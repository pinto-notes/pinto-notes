// The board benchmark's page side (scripts/board-perf.sh). Put into a board page (Pinto's, or plain
// Excalidraw's: bench/plain.jsx), it drives the drawing with pointer and wheel events dispatched
// inside the page (nothing reaches the system) and measures what a person would feel:
//
// - frames: the time between animation frames while it runs (a dropped frame is a long one);
// - work: how long each frame kept the page busy (its animation frame callbacks, style, layout and
//   painting), from the frame's first callback to a task posted from it;
// - latency (pencil): from a pointer move to the end of the frame that drew ink up to it;
// - long tasks: a 5 ms timer that runs late was held up by work that long; the Long Tasks API too
//   where the browser has it (Chrome);
// - traffic (Pinto): the messages the page sent the app while it ran.
//
//   await __boardBench.run("freedraw" | "pan" | "zoom" | "drag" | "idle", { duration, rate })
//
// Returns the numbers as JSON. The same file runs in WebKit and in Chrome.
(() => {
  if (window.__boardBench) return;
  const now = () => performance.now();
  const api = () => (window.amber && window.amber._canvas && window.amber._canvas.api) || window.__excalidrawAPI || null;
  const surface = () => document.querySelector("canvas.excalidraw__canvas.interactive");
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
  const frames = async (n) => { for (let i = 0; i < n; i++) await raf(); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pct = (xs, p) => {
    if (!xs.length) return null;
    const s = xs.slice().sort((a, b) => a - b);
    return Math.round(s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))] * 100) / 100;
  };
  const stats = (xs) => ({ n: xs.length, p50: pct(xs, 0.5), p95: pct(xs, 0.95), p99: pct(xs, 0.99), max: xs.length ? Math.round(Math.max(...xs) * 100) / 100 : null });

  // MARK: What the page sends the app (Pinto)

  const traffic = { canvas: 0, canvasNearby: 0, data: 0, dataChars: 0 };
  // Each message, when it went (epoch ms, the app's clock) and what it was: set against the app's long main-thread turns.
  const sentAt = [];
  const epoch = () => Math.round((performance.timeOrigin + performance.now()) * 10) / 10;
  const wrapBridge = () => {
    const h = window.webkit && window.webkit.messageHandlers;
    if (!h || wrapBridge.done) return;
    const canvas = h.amberCanvas, data = h.amberData;
    const any = canvas || data;
    if (!any) return;
    wrapBridge.done = true;
    // On the handlers' prototype (WebKit's own objects take no property of their own).
    const proto = Object.getPrototypeOf(any), post = proto.postMessage;
    proto.postMessage = function (m) {
      if (this === canvas) { traffic.canvas++; if (m && Array.isArray(m.nearby)) traffic.canvasNearby += m.nearby.length; sentAt.push([epoch(), "canvas", m && m.busy ? "busy" : "state"]); }
      else if (this === data) { traffic.data++; if (m && typeof m.json === "string") traffic.dataChars += m.json.length; sentAt.push([epoch(), "data", (m && m.op) || ""]); }
      return post.call(this, m);
    };
  };

  // MARK: Frames, work and long tasks

  const monitor = () => {
    const m = { starts: [], works: [], late: [], longTasks: [], on: true };
    const ch = new MessageChannel();
    let began = 0;
    ch.port1.onmessage = () => { if (began) m.works.push(now() - began); began = 0; m.onFrameEnd && m.onFrameEnd(); };
    const frame = () => {
      if (!m.on) return;
      began = now();
      m.starts.push(began);
      ch.port2.postMessage(0);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    let expected = now() + 5;
    const probe = () => {
      if (!m.on) return;
      const t = now();
      m.late.push(Math.max(0, t - expected));
      expected = t + 5;
      setTimeout(probe, 5);
    };
    setTimeout(probe, 5);
    let obs = null;
    try {
      if (PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) m.longTasks.push(e.duration); });
        obs.observe({ entryTypes: ["longtask"] });
      }
    } catch (_) {}
    m.stop = () => { m.on = false; if (obs) obs.disconnect(); };
    // The window [from, to): frame intervals and work for frames that began in it.
    m.slice = (from, to) => {
      const idx = m.starts.map((t, i) => [t, i]).filter(([t]) => t >= from && t < to).map(([, i]) => i);
      const intervals = [];
      for (const i of idx) if (i > 0 && m.starts[i - 1] >= from) intervals.push(m.starts[i] - m.starts[i - 1]);
      return { intervals, works: idx.map((i) => m.works[i]).filter((w) => typeof w === "number") };
    };
    return m;
  };

  // MARK: Input

  const pointer = (type, x, y, buttons) => {
    const s = surface();
    const init = { clientX: x, clientY: y, screenX: x, screenY: y, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons,
      pressure: buttons ? 0.5 : 0, bubbles: true, cancelable: true, composed: true, view: window };
    (type === "pointerup" ? window : s).dispatchEvent(new PointerEvent(type, init));
  };
  const wheel = (x, y, dx, dy, ctrl) => {
    surface().dispatchEvent(new WheelEvent("wheel", { clientX: x, clientY: y, deltaX: dx, deltaY: dy, deltaMode: 0, ctrlKey: !!ctrl, bubbles: true, cancelable: true, composed: true, view: window }));
  };
  /** Calls step(i, t) every 1000/rate ms (on time: each run is set from the start, not the last). */
  const paced = (rate, duration, step) => new Promise((done) => {
    const every = 1000 / rate, t0 = now();
    let i = 0;
    const tick = () => {
      const t = now() - t0;
      if (t >= duration) { done(i); return; }
      step(i++, t);
      const next = t0 + i * every - now();
      setTimeout(tick, Math.max(0, next));
    };
    tick();
  });

  // MARK: The view

  const fit = async () => {
    const a = api();
    a.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } });
    a.setActiveTool({ type: "selection" });
    a.scrollToContent(a.getSceneElements(), { fitToViewport: true, viewportZoomFactor: 0.9, animate: false });
    await frames(3);
    const s = a.getAppState();
    return { zoom: s.zoom.value, width: s.width, height: s.height, dpr: window.devicePixelRatio };
  };
  const rect = () => surface().getBoundingClientRect();

  // MARK: Scenarios

  const scenarios = {
    async idle({ duration }) { await sleep(duration); return {}; },

    /** The pencil, one stroke across the middle of the view, a point every 1/rate s. */
    async freedraw({ duration, rate }, out) {
      const a = api();
      a.setActiveTool({ type: "freedraw" });
      await frames(4);
      const r = rect(), x0 = r.left + r.width * 0.2, span = r.width * 0.6, y0 = r.top + r.height * 0.5, amp = r.height * 0.15;
      const at = (t) => [x0 + span * (t / duration), y0 + amp * Math.sin(t / 180)];
      // Each move: when it was sent, and where it lands on the board (along x, which only grows).
      const sent = [], sceneX = [];
      const toScene = (cx) => { const s = a.getAppState(); return (cx - s.offsetLeft) / s.zoom.value - s.scrollX; };
      // Ink: each draw on the canvas the new stroke is drawn on says how far the stroke reaches.
      const proto = CanvasRenderingContext2D.prototype, draw = proto.drawImage, fillPath = proto.fill;
      let inked = -1, inkedThisFrame = [];
      const note = (ctx) => {
        const c = ctx.canvas;
        if (!c || !c.classList || !c.classList.contains("excalidraw__canvas") || c.classList.contains("interactive") || c.classList.contains("static")) return;
        const e = a.getAppState().newElement;
        if (!e || e.type !== "freedraw" || !e.points.length) return;
        const reach = e.x + e.points[e.points.length - 1][0] + 0.01;
        while (inked + 1 < sceneX.length && sceneX[inked + 1] <= reach) { inked++; inkedThisFrame.push(inked); }
      };
      proto.drawImage = function (...args) { note(this); return draw.apply(this, args); };
      proto.fill = function (...args) { note(this); return fillPath.apply(this, args); };
      const latency = [];
      out.monitor.onFrameEnd = () => { const t = now(); for (const k of inkedThisFrame) latency.push(t - sent[k]); inkedThisFrame = []; };
      try {
        const [sx, sy] = at(0);
        pointer("pointerdown", sx, sy, 1);
        await raf();
        out.mark("start");
        await paced(rate, duration, (i, t) => {
          const [x, y] = at(t);
          sent[i] = now();
          sceneX[i] = toScene(x);
          pointer("pointermove", x, y, 1);
        });
        await raf();
        out.mark("end");
        const [ex, ey] = at(duration);
        pointer("pointerup", ex, ey, 0);
        await frames(3);
      } finally {
        proto.drawImage = draw;
        proto.fill = fillPath;
        out.monitor.onFrameEnd = null;
        a.setActiveTool({ type: "selection" });
      }
      return { latency: stats(latency), moves: sent.length, inked: inked + 1 };
    },

    /** Two-finger scrolling: wheel events, a little each, panning one way and back. */
    async pan({ duration, rate }, out) {
      const r = rect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      out.mark("start");
      await paced(rate, duration, (i, t) => { const dir = Math.floor(t / 750) % 2 ? -1 : 1; wheel(cx, cy, 3 * dir, 5 * dir, false); });
      out.mark("end");
      return {};
    },

    /** Pinch zoom: wheel events with Control (as a trackpad's pinch reaches a page), in and out. */
    async zoom({ duration, rate }, out) {
      const r = rect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      out.mark("start");
      await paced(rate, duration, (i, t) => { const dir = Math.floor(t / 750) % 2 ? 1 : -1; wheel(cx, cy, 0, 1.5 * dir, true); });
      out.mark("end");
      return {};
    },

    /** Twenty shapes selected and dragged round in a circle. */
    async drag({ duration, rate }, out) {
      const a = api();
      const s = a.getAppState(), z = s.zoom.value;
      const view = (e) => ({ x: (e.x + e.width / 2 + s.scrollX) * z + s.offsetLeft, y: (e.y + e.height / 2 + s.scrollY) * z + s.offsetTop });
      const r = rect(), mid = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      // The 20 filled shapes nearest the middle of the view, the nearest first (pressed on).
      const shapes = a.getSceneElements().filter((e) => ["rectangle", "ellipse", "diamond"].includes(e.type) && e.backgroundColor !== "transparent" && !e.groupIds.length)
        .map((e) => ({ e, d: Math.hypot(view(e).x - mid.x, view(e).y - mid.y) })).sort((p, q) => p.d - q.d).slice(0, 20).map((p) => p.e);
      a.updateScene({ appState: { selectedElementIds: Object.fromEntries(shapes.map((e) => [e.id, true])) } });
      await frames(4);
      const p0 = view(shapes[0]);
      pointer("pointerdown", p0.x, p0.y, 1);
      await raf();
      out.mark("start");
      await paced(rate, duration, (i, t) => {
        const ang = t / 400, rad = 80 * Math.min(1, t / 300);
        pointer("pointermove", p0.x + rad * Math.cos(ang) - rad, p0.y + rad * Math.sin(ang), 1);
      });
      await raf();
      out.mark("end");
      pointer("pointerup", p0.x, p0.y, 0);
      await frames(3);
      const moved = a.getSceneElements().filter((e) => shapes.some((x) => x.id === e.id) && e.version > 3).length;
      a.updateScene({ appState: { selectedElementIds: {} } });
      return { selected: shapes.length, moved };
    },
  };

  window.__boardBench = {
    ready: () => !!(api() && surface()),
    fit,
    stats,
    traffic: () => ({ ...traffic }),
    /** One scenario: half a second still, `duration` ms of it, then `tail` ms still (a save lands then). */
    async run(name, opts = {}) {
      const o = { duration: 3000, rate: 120, tail: 1500, lead: 500, ...opts };
      wrapBridge();
      const before = { ...traffic }, runFrom = now();
      const out = { monitor: monitor() };
      // A moment of the run, with what had been sent the app by then.
      out.mark = (k) => { out[k] = now(); out[k + "Traffic"] = { ...traffic }; };
      await sleep(o.lead);
      const extra = await scenarios[name](o, out);
      if (out.start === undefined) { out.start = now() - o.duration; out.end = now(); out.startTraffic = out.endTraffic = { ...traffic }; }
      const endOfRun = now();
      await sleep(o.tail);
      out.monitor.stop();
      const run = out.monitor.slice(out.start, out.end);
      const all = out.monitor.slice(out.start, endOfRun + o.tail);
      const probeAll = out.monitor.late;
      const sent = Object.fromEntries(Object.keys(traffic).map((k) => [k, traffic[k] - before[k]]));
      const nominal = run.intervals.length ? pct(run.intervals, 0.5) : null;
      return JSON.stringify({
        scenario: name, duration: Math.round(out.end - out.start), rate: o.rate,
        frames: { ...stats(run.intervals), dropped: run.intervals.filter((d) => nominal && d > nominal * 1.5).length, fps: run.intervals.length ? Math.round(1000 * run.intervals.length / (out.end - out.start)) : 0 },
        work: stats(run.works),
        workWithTail: stats(all.works),
        // The 5 ms probe: how late it ran is how long something held the page up.
        held: { p95: pct(probeAll, 0.95), max: probeAll.length ? Math.round(Math.max(...probeAll)) : null, over8: probeAll.filter((x) => x > 8).length, over16: probeAll.filter((x) => x > 16).length, over50: probeAll.filter((x) => x > 50).length },
        longTasks: { n: out.monitor.longTasks.length, max: out.monitor.longTasks.length ? Math.round(Math.max(...out.monitor.longTasks)) : 0 },
        traffic: sent,
        sentAt: sentAt.filter((x) => x[0] >= performance.timeOrigin + runFrom).slice(0, 60),
        // Sent while the pointer moved or the wheel turned (pressing and lifting aside).
        trafficMoving: Object.fromEntries(Object.keys(traffic).map((k) => [k, out.endTraffic[k] - out.startTraffic[k]])),
        ...extra,
      });
    },
  };
})();
