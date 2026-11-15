// The whiteboard page's session (board-session.ts) against an in-memory server that keeps changes,
// snapshots and pictures as the real tables do and relays them as the note's channel does: two
// people drawing at once end with the same board, a viewer follows by pulling, pointers and
// selections cross, pictures and comments travel sealed, and a snapshot keeps the document short.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import { loadAutomerge } from "./automerge";
import { open3, pictureBytes, seal3 } from "./collab";
import type { Bytes } from "./e2ee";
import { type Automerge, type Comment, ordered, PALETTE, slots, STALE } from "./board-doc";
import { BoardSession, type Clock, type Live, type LiveEvents, type Member, type Snapshot, type Transport, type Update } from "./board-session";

const wasm = () => readFileSync(createRequire(import.meta.url).resolve("@automerge/automerge/automerge.wasm"));
let A: Automerge;
beforeAll(async () => { A = await loadAutomerge(wasm()); });

const NOTE = "6f1c1b0e-2a7d-4c55-9a43-1d2e3f405162";
const EMIL = "11111111-1111-4111-8111-111111111111", SARA = "22222222-2222-4222-8222-222222222222";
const nk = crypto.getRandomValues(new Uint8Array(32)) as Bytes;

/** A clock the test moves. */
class TestClock implements Clock {
  t = 1_000_000;
  private jobs: { at: number; every?: number; fn: () => void; id: number }[] = [];
  private n = 0;
  now() { return this.t; }
  every(ms: number, fn: () => void) { const id = ++this.n; this.jobs.push({ at: this.t + ms, every: ms, fn, id }); return () => { this.jobs = this.jobs.filter((j) => j.id !== id); }; }
  after(ms: number, fn: () => void) { const id = ++this.n; this.jobs.push({ at: this.t + ms, fn, id }); return () => { this.jobs = this.jobs.filter((j) => j.id !== id); }; }
  async advance(ms: number) {
    const end = this.t + ms;
    for (;;) {
      const next = this.jobs.filter((j) => j.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      this.t = next.at;
      if (next.every) next.at += next.every; else this.jobs = this.jobs.filter((j) => j !== next);
      next.fn();
      await settle();
    }
    this.t = end;
    await settle();
  }
}

// WebCrypto answers from a worker thread: a few real milliseconds, not only queued callbacks.
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 4)); };

/** The server: the note's tables and its channel. */
class Server {
  updates: (Update & { note: string })[] = [];
  snapshots: Snapshot[] = [];
  files = new Map<string, { epoch: number; ct: string }>();
  epoch = 1;
  members: Member[] = [{ user_id: EMIL, role: "owner", display_name: "Emil Wagman" }, { user_id: SARA, role: "editor", display_name: "Sara Berg" }];
  private live: { user: string; on: LiveEvents }[] = [];
  private id = 0;
  relay = true;
  failNextSend = false;

  transport(me: string | null, opts: { write?: boolean; live?: boolean } = {}): Transport {
    const t: Transport = {
      pull: async (after) => {
        const snap = this.snapshots.filter((s) => after === 0 || s.upto > after).sort((a, b) => b.upto - a.upto)[0] ?? null;
        const from = snap?.upto ?? after;
        return { snapshot: snap, updates: this.updates.filter((u) => u.id > from).map(({ note: _, ...u }) => u) };
      },
      file: async (id) => this.files.get(id) ?? null,
    };
    if (me && opts.write !== false) {
      t.send = async (ct, epoch) => {
        if (this.failNextSend) { this.failNextSend = false; throw new Error("offline"); }
        if (epoch !== this.epoch) throw new Error("stale_epoch");
        const u = { id: ++this.id, author_id: me, epoch, ct, client: null, note: NOTE };
        this.updates.push(u);
        if (this.relay) for (const l of this.live) setTimeout(() => l.on.update({ id: u.id, author_id: me, epoch, ct, client: null }), 0);
        return { id: u.id, author_id: me, epoch, ct, client: null };
      };
      t.snapshot = async (ct, upto, epoch) => {
        this.snapshots.push({ ct, upto, epoch });
        this.updates = this.updates.filter((u) => u.id > upto);
      };
      t.putFile = async (id, epoch, ct) => { if (ct.length > 6_000_000) throw new Error("files_full"); this.files.set(id, { epoch, ct }); };
    }
    if (me) {
      t.members = async () => this.members;
      if (opts.live !== false) {
        t.live = async (on) => {
          const entry = { user: me, on };
          this.live.push(entry);
          const live: Live = {
            presence: (ct) => { for (const l of this.live) if (l !== entry) setTimeout(() => l.on.presence(me, ct), 0); },
            close: () => { this.live = this.live.filter((l) => l !== entry); for (const l of this.live) l.on.leave(me); },
          };
          setTimeout(() => on.relaying(), 0);
          return live;
        };
      }
    }
    return t;
  }

  /** The owner shared the board from the app as the app does it: the whole document as a snapshot
   *  up to 0, and no changes after it (CollabStore.share). */
  async shareAsSnapshot(elements: Record<string, unknown>[]) {
    const doc = A.change(A.init<Record<string, unknown>>(), { message: `u:${EMIL.toUpperCase()}` }, (d) => {
      d.body = "Launch plan"; d.board = Object.fromEntries(elements.map((e) => [e.id as string, JSON.stringify(e)])); d.boardState = {}; d.comments = {};
    });
    this.snapshots.push({ ct: await seal3("s", A.save(doc) as Bytes, nk, NOTE, 1, "0"), upto: 0, epoch: 1 });
  }

  /** The owner shared the board from the app: its first change makes the drawing's maps. */
  async share() {
    const doc = A.change(A.init<Record<string, unknown>>(), { message: `u:${EMIL.toUpperCase()}` }, (d) => { d.body = "Launch plan"; d.board = {}; d.boardState = {}; });
    const ct = await seal3("u", A.getLastLocalChange(doc)! as Bytes, nk, NOTE, 1, EMIL);
    this.updates.push({ id: ++this.id, author_id: EMIL, epoch: 1, ct, client: null, note: NOTE });
  }
}

const box = (id: string, over: Record<string, unknown> = {}) => ({
  id, type: "rectangle", x: 0, y: 0, width: 100, height: 60, version: 1, versionNonce: 10, seed: 1, isDeleted: false, index: "a0", ...over,
});

async function open(server: Server, me: string | null, clock: TestClock, o: { write?: boolean; live?: boolean; name?: string } = {}) {
  const s = new BoardSession({ A, note: NOTE, epoch: 1, nk, transport: server.transport(me, o), me, name: o.name ?? "Someone", canWrite: o.write !== false && !!me, clock });
  const seen = { scenes: 0, peers: [] as ReturnType<BoardSession["boardPeers"]>, comments: [] as Comment[], refused: [] as [string[], string][], ai: [] as [string, string[]][] };
  s.onScene = () => { seen.scenes++; };
  s.onPeers = (p) => { seen.peers = p; };
  s.onComments = (c) => { seen.comments = c; };
  s.onRefused = (ids, why) => { seen.refused.push([ids, why]); };
  s.onAI = (by, ids) => { seen.ai.push([by, ids]); };
  await s.start();
  await settle();
  return { s, seen };
}

const drawing = (s: BoardSession) => ordered(s.board).map((e) => `${e.id}@${e.x},${e.y}#${e.version}`);

describe("a shared board in the browser", () => {
  it("two people drawing at once end with the same board, live, and a viewer follows by pulling", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock, { name: "Emil Wagman" });
    const sara = await open(server, SARA, clock, { name: "Sara Berg" });
    const viewer = await open(server, null, clock);
    expect(emil.s.isBoard && sara.s.isBoard && viewer.s.isBoard).toBe(true);
    expect(viewer.s.canWrite).toBe(false);

    await emil.s.local([box("a")]);
    await settle();
    expect(drawing(sara.s)).toEqual(["a@0,0#1"]);
    expect(sara.seen.scenes).toBeGreaterThan(0);

    // Both move the same box at once: Excalidraw's rule picks one everywhere (the higher version,
    // then the lower nonce).
    await Promise.all([emil.s.local([box("a", { x: 50, version: 2, versionNonce: 900 })]), sara.s.local([box("a", { x: 70, version: 2, versionNonce: 300 })])]);
    await sara.s.local([box("b", { index: "a1", y: 200 })]);
    await settle();
    expect(drawing(emil.s)).toEqual(["a@70,0#2", "b@0,200#1"]);
    expect(drawing(sara.s)).toEqual(drawing(emil.s));

    // The viewer has nothing yet; the next beat pulls it in. What it draws goes nowhere.
    expect(drawing(viewer.s)).toEqual([]);
    await clock.advance(2000);
    expect(drawing(viewer.s)).toEqual(drawing(emil.s));
    const stored = server.updates.length;
    await viewer.s.local([box("c")]);
    await settle();
    expect(server.updates.length).toBe(stored);

    // An older copy of an element than the document's isn't taken: the page gets the document's back.
    const before = sara.seen.scenes;
    await sara.s.local([box("a", { x: 999, version: 1 })]);
    expect(drawing(sara.s)[0]).toBe("a@70,0#2");
    expect(sara.seen.scenes).toBe(before + 1);
    for (const p of [emil, sara, viewer]) p.s.close();
  });

  it("a board the app shared as a snapshot alone opens, for a viewer and a member, and one opened before it arrived follows", async () => {
    const server = new Server(), clock = new TestClock();
    const early = await open(server, null, clock);
    expect(early.s.isEmpty).toBe(true);
    expect(early.s.isBoard).toBe(false);
    await server.shareAsSnapshot([box("mac-1", { x: 40, y: 80 })]);
    const viewer = await open(server, null, clock);
    const sara = await open(server, SARA, clock);
    expect(viewer.s.isBoard && sara.s.isBoard).toBe(true);
    expect(drawing(viewer.s)).toEqual(["mac-1@40,80#1"]);
    expect(drawing(sara.s)).toEqual(["mac-1@40,80#1"]);
    await clock.advance(2000);
    expect(drawing(early.s)).toEqual(["mac-1@40,80#1"]);
    // Pulled again, it isn't taken twice, and what comes after it still comes.
    await sara.s.local([box("b", { index: "a1" })]);
    await clock.advance(2000);
    expect(drawing(viewer.s)).toEqual(["mac-1@40,80#1", "b@0,0#1"]);
    for (const p of [early, viewer, sara]) p.s.close();
  });

  it("a change that didn't go up goes again, in order, and one relayed late is pulled", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock);
    const sara = await open(server, SARA, clock);
    server.failNextSend = true;
    await sara.s.local([box("a")]);
    await sara.s.local([box("a", { x: 5, version: 2 })]);
    await settle();
    expect(sara.s.status).toBe("offline");
    expect(sara.s.unsent).toBe(2);
    await clock.advance(3000);
    expect(sara.s.unsent).toBe(0);
    expect(drawing(emil.s)).toEqual(["a@5,0#2"]);
    // The relay drops a change: the pull every 20 seconds brings it.
    server.relay = false;
    await sara.s.local([box("b", { index: "a1" })]);
    await settle();
    expect(drawing(emil.s)).toEqual(["a@5,0#2"]);
    await clock.advance(20_000);
    expect(drawing(emil.s)).toEqual(["a@5,0#2", "b@0,0#1"]);
    emil.s.close(); sara.s.close();
  });

  it("pointers and selections cross in each person's colour, grey once nothing is heard, the name only while moving", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock, { name: "Emil Wagman" });
    const sara = await open(server, SARA, clock, { name: "Sara Berg" });
    sara.s.presence([120.5, 80], ["a"]);
    await settle();
    const colours = slots([EMIL, SARA]);
    expect(emil.seen.peers).toEqual([{ id: SARA, name: "Sara", color: PALETTE[colours.get(SARA)!][0], dark: PALETTE[colours.get(SARA)!][1], sel: ["a"], flag: true, x: 120.5, y: 80 }]);
    // The owner first: Emil and Sara never share a colour on this board.
    expect(colours.get(EMIL)).not.toBe(colours.get(SARA));
    // At most ten a second: a move right after waits for the beat, the last one wins.
    sara.s.presence([121, 81], ["a"]);
    sara.s.presence([130, 90], []);
    await settle();
    expect(emil.seen.peers[0].x).toBe(120.5);
    await clock.advance(100);
    expect([emil.seen.peers[0].x, emil.seen.peers[0].sel]).toEqual([130, []]);
    // Still for 3 seconds: the name flag goes; presence still arrives every 2 seconds.
    await clock.advance(3100);
    expect(emil.seen.peers[0].flag).toBe(false);
    expect(emil.seen.peers[0].color).toBe(PALETTE[colours.get(SARA)!][0]);
    // Emil's pointer reaches Sara the same way.
    emil.s.presence([10, 20], []);
    await clock.advance(200);
    expect(sara.seen.peers.map((p) => [p.name, p.x, p.y])).toEqual([["Emil", 10, 20]]);
    // Sara's connection goes: grey after 6 seconds, gone when she leaves.
    sara.s.close();
    await settle();
    expect(emil.seen.peers).toEqual([]);
    emil.s.close();
  });

  it("following: what someone presents and sees, their laser and whom they follow cross, as the app sends them", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock, { name: "Emil Wagman" });
    const sara = await open(server, SARA, clock, { name: "Sara Berg" });
    let people: ReturnType<BoardSession["boardPeople"]> = [];
    const lasers: [string, [number, number][]][] = [];
    emil.s.onPeople = (p) => { people = p; };
    emil.s.onLaser = (id, pts) => { lasers.push([id, pts]); };
    // Sara presents her second frame, with the laser down: two points, then two more.
    sara.s.presence([40, 50], []);
    sara.s.look({ frame: "f2", i: 1, n: 3 }, [-10.4, 20.6, 800, 500], [[40, 50], [41, 52]]);
    await clock.advance(120);
    sara.s.look({ frame: "f2", i: 1, n: 3 }, [-10.4, 20.6, 800, 500], [[43, 55], [44, 57]]);
    await clock.advance(120);
    expect(people.map((p) => [p.name, p.presenting, p.view, p.following, p.stale])).toEqual([["Sara", { frame: "f2", i: 1, n: 3 }, [-10, 21, 800, 500], null, false]]);
    expect(people[0].color).toBe(PALETTE[slots([EMIL, SARA]).get(SARA)!][0]);
    // Each laser point once, in order.
    expect(lasers.flatMap(([, pts]) => pts)).toEqual([[40, 50], [41, 52], [43, 55], [44, 57]]);
    expect(lasers.every(([id]) => id === SARA)).toBe(true);
    // Emil follows Sara: she reads it (upper case from the app works too).
    let hers: ReturnType<BoardSession["boardPeople"]> = [];
    sara.s.onPeople = (p) => { hers = p; };
    emil.s.follow(SARA.toUpperCase());
    await clock.advance(120);
    expect(hers.map((p) => [p.name, p.following])).toEqual([["Emil", SARA]]);
    // Done: no frame any more, and the laser off.
    sara.s.look(null, [0, 0, 800, 500], null);
    await clock.advance(120);
    expect(people[0].presenting).toBeNull();
    // What a malformed beat carries is left out, not half taken.
    const k = sara.s as unknown as { myPresenting: unknown; myView: unknown };
    k.myPresenting = { frame: "", i: 5, n: 2 };
    k.myView = [0, 0, -1, 10];
    sara.s.presence([1, 1], []);
    await clock.advance(120);
    expect([people[0].presenting, people[0].view]).toEqual([null, null]);
    emil.s.close(); sara.s.close();
  });

  it("someone silent for 6 seconds is drawn grey", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock);
    const sara = await open(server, SARA, clock, { live: true });
    sara.s.presence([1, 2], []);
    await settle();
    // Sara's tab stops sending (asleep): its beats are dropped.
    (sara.s as unknown as { live: Live | null }).live = { presence() {}, close() {} };
    await clock.advance(6100);
    expect([emil.seen.peers[0].color, emil.seen.peers[0].dark, emil.seen.peers[0].flag]).toEqual([...STALE, false]);
    emil.s.close(); sara.s.close();
  });

  it("a picture goes up sealed before the change that shows it, and opens for the others; one that doesn't fit is refused", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock);
    const sara = await open(server, SARA, clock);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]).toString("base64");
    const file = { id: "pic-1", dataURL: `data:image/png;base64,${png}`, mimeType: "image/png", created: 1 };
    await sara.s.local([box("img", { type: "image", fileId: "pic-1", status: "saved" })], {}, { "pic-1": file });
    await settle();
    expect(server.files.has("pic-1")).toBe(true);
    // Sealed under the note key, for that file id: the server holds no picture bytes.
    expect(server.files.get("pic-1")!.ct).not.toContain(png);
    expect(Buffer.from(await open3("f", server.files.get("pic-1")!.ct, nk, NOTE, "pic-1")).toString("base64"))
      .toBe(Buffer.from(pictureBytes("image/png", Buffer.from(png, "base64") as unknown as Bytes)).toString("base64"));
    expect(emil.s.pictures.get("pic-1")?.dataURL).toBe(file.dataURL);
    expect(emil.s.scene().files["pic-1"].dataURL).toBe(file.dataURL);

    // Over the board's 4 MB of pictures: refused, its element taken off the page, never sent.
    const big = { id: "pic-2", dataURL: `data:image/png;base64,${"A".repeat(4_300_000)}`, mimeType: "image/png", created: 1 };
    await sara.s.local([box("img2", { type: "image", fileId: "pic-2", index: "a1" })], {}, { "pic-2": big });
    expect(sara.seen.refused).toEqual([[["img2"], "This picture doesn’t fit: a whiteboard’s pictures can be 4 MB in all"]]);
    expect(server.files.has("pic-2")).toBe(false);
    expect(ordered(sara.s.board).map((e) => e.id)).toEqual(["img"]);
    emil.s.close(); sara.s.close();
  });

  it("comments travel as changes, and a viewer reads them", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const emil = await open(server, EMIL, clock);
    const sara = await open(server, SARA, clock);
    const viewer = await open(server, null, clock);
    const c: Comment = { id: "c-0000000000000001", on: "a", x: 1, y: 0, by: SARA, name: "Sara", text: "Kan vi flytta den här?", created: "2026-11-17T09:12:00Z", resolved: false, version: 1 };
    sara.s.commentLocal([c]);
    await settle();
    expect(emil.seen.comments.map((x) => x.text)).toEqual(["Kan vi flytta den här?"]);
    emil.s.commentLocal([{ ...c, resolved: true, version: 2 }]);
    await settle();
    await clock.advance(2000);
    expect(sara.seen.comments[0].resolved).toBe(true);
    expect(viewer.seen.comments[0].resolved).toBe(true);
    // A viewer writes no comment.
    viewer.s.commentLocal([{ ...c, id: "c-0000000000000002" }]);
    expect(server.updates.length).toBe(3);
    for (const p of [emil, sara, viewer]) p.s.close();
  });

  it("after 200 changes and 5 quiet seconds a snapshot goes up, and someone opening later reads it and what came after", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const sara = await open(server, SARA, clock);
    for (let i = 0; i < 205; i++) await sara.s.local([box("a", { x: i, version: i + 2 })]);
    await settle();
    // The snapshot covers what every pull has had (the cursor), never a change still on its way.
    await clock.advance(20_000);
    await clock.advance(6000);
    expect(server.snapshots.length).toBe(1);
    const upto = server.snapshots[0].upto;
    expect(upto).toBeGreaterThan(1);
    await sara.s.local([box("b", { index: "a1" })]);
    await settle();
    const later = await open(server, EMIL, clock);
    expect(drawing(later.s)).toEqual(["a@204,0#206", "b@0,0#1"]);
    expect(later.s.snapshotUpto).toBe(upto);
    sara.s.close(); later.s.close();
  });

  it("a change under a key this page doesn't have says the key changed, and the new key opens it", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const sara = await open(server, SARA, clock);
    let told = 0;
    sara.s.onKeyChanged = () => { told++; };
    const nk2 = crypto.getRandomValues(new Uint8Array(32)) as Bytes;
    server.epoch = 2;
    const doc = A.change(A.load<Record<string, Record<string, unknown>>>(A.save(sara.s.doc)), (d) => { d.board!.z = new A.ImmutableString(JSON.stringify(box("z"))); });
    server.updates.push({ id: 99, author_id: EMIL, epoch: 2, ct: await seal3("u", A.getLastLocalChange(doc)! as Bytes, nk2, NOTE, 2, EMIL), client: null, note: NOTE });
    // Not relayed (it went in as the key changed): the 20-second pull finds it.
    await clock.advance(20_000);
    expect([told, sara.s.status]).toEqual([1, "keyChanged"]);
    sara.s.rekey(nk2, 2);
    await settle();
    expect(drawing(sara.s)).toEqual(["z@0,0#1"]);
    // What's drawn here from now on is sealed with the new key.
    await sara.s.local([box("y", { index: "a1" })]);
    await settle();
    expect(server.updates.at(-1)!.epoch).toBe(2);
    sara.s.close();
  });

  it("an AI's change is named with its person and outlined", async () => {
    const server = new Server(), clock = new TestClock();
    await server.share();
    const sara = await open(server, SARA, clock);
    const doc = A.change(A.load<Record<string, Record<string, unknown>>>(A.save(sara.s.doc)), { message: "Emil's Claude" }, (d) => { d.board!.ai = new A.ImmutableString(JSON.stringify(box("ai"))); });
    server.updates.push({ id: 50, author_id: EMIL, epoch: 1, ct: await seal3("u", A.getLastLocalChange(doc)! as Bytes, nk, NOTE, 1, EMIL), client: "Claude", note: NOTE });
    await clock.advance(20_000);
    expect(sara.seen.ai).toEqual([["Emil's Claude", ["ai"]]]);
    sara.s.close();
  });
});
