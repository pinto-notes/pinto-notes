// Note cards: a note of yours on the board (whiteboard council, round 6: "a linked note card that
// opens its source note from the board", so a diagram connects to the writing behind it).
//
// A card is ordinary Excalidraw elements in one group, so it saves in the scene, exports as drawn
// and any AI can read and write it:
//   - the card itself, a rounded rectangle: customData { pintoNote: <the note's id>, title, pintoCard: "card" }
//   - a small note glyph (two lines), the title and the first lines of the note: customData
//     { pintoNote, pintoCard: "glyph" | "title" | "preview" }.
// An AI makes one by writing any shape with customData.pintoNote set to a note's title or id (the
// short form): the board draws the card around it, keeping its id (so arrows bound to it stay).
// The app sends each card's title and first lines (op "cards") whenever the board opens and when
// a note changes; a deleted note's card says so, quietly, and doesn't open.
import { convertToExcalidrawElements, getCommonBounds, viewportCoordsToSceneCoords } from "@excalidraw/excalidraw";

export const CARD = {
  width: 260, pad: 16, top: 14, gap: 6, font: 6, lineHeight: 1.25,
  title: { size: 18, lines: 2, ink: "#2a1d10" },
  // Readable in light (4.7:1 on white) and through the dark filter (6.2:1); the edge shows in
  // both (whiteboard council, round 7: the excerpt and edge faded out in dark mode).
  preview: { size: 14, lines: 3, ink: "#6c757d" },
  glyph: { w: 14, h: 18, fold: 5, ink: "#d96a06" },
  edge: "#adb5bd", oldEdge: "#ced4da", fill: "#ffffff", quiet: "#868e96",
};

const data = (e) => (e && e.customData) || {};
/** The note an element is part of a card for: its id, or (an AI's short form) its title. */
export const noteOf = (e) => { const v = data(e).pintoNote; return typeof v === "string" && v.trim() ? v.trim() : null; };
const roleOf = (e) => data(e).pintoCard || null;
/** The card itself (its rectangle). */
export const isCard = (e) => !!e && !e.isDeleted && !!noteOf(e) && roleOf(e) === "card";
/** An AI's short form: any shape with customData.pintoNote, not drawn as a card yet. */
const isSeed = (e) => !!e && !e.isDeleted && !!noteOf(e) && !roleOf(e) && !e.containerId
  && !["arrow", "line", "freedraw"].includes(e.type);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nonce = () => Math.floor(Math.random() * 2 ** 31);

// MARK: Words

let ctx = null;
const font = (size) => `${size}px Nunito, Segoe UI Emoji`;
function measure(text, size) {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx.font = font(size);
  return ctx.measureText(text).width;
}

/** `text` in lines no wider than `max`, at most `lines` of them; what doesn't fit ends in "…". */
export function wrap(text, size, max, lines) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const out = [];
  let line = "", i = 0;
  for (; i < words.length && out.length < lines; i++) {
    let w = words[i];
    const next = line ? `${line} ${w}` : w;
    if (measure(next, size) <= max) { line = next; continue; }
    if (line) { out.push(line); line = ""; if (out.length >= lines) break; }
    // A word wider than a line is cut where it runs out.
    while (measure(w, size) > max && out.length < lines) {
      let k = w.length - 1;
      while (k > 1 && measure(w.slice(0, k), size) > max) k--;
      out.push(w.slice(0, k));
      w = w.slice(k);
    }
    if (out.length >= lines) { i++; if (w) i = -1; break; }
    line = w;
  }
  const more = i === -1 || i < words.length;
  if (line && out.length < lines) out.push(line);
  if (more && out.length) {
    let last = out[out.length - 1];
    while (last.length > 1 && measure(`${last}…`, size) > max) last = last.slice(0, -1);
    out[out.length - 1] = `${last.replace(/[\s.,;:]+$/, "")}…`;
  }
  return out.join("\n");
}

const height = (text, size) => (text ? text.split("\n").length : 0) * size * CARD.lineHeight;
const widest = (text, size) => Math.max(1, ...String(text).split("\n").map((l) => measure(l, size)));

/** Where everything on a card goes, from its top left and width, and what it says. `quiet`: the
 *  note is gone (or never was): grey, and a dashed edge. */
export function layout({ x, y, width = CARD.width, title, preview, quiet = false }) {
  const { pad, top, gap } = CARD;
  const titleText = wrap(title || "Note", CARD.title.size, width - pad * 2 - CARD.glyph.w - 10, CARD.title.lines);
  const previewText = preview ? wrap(preview, CARD.preview.size, width - pad * 2, CARD.preview.lines) : "";
  const th = height(titleText, CARD.title.size), ph = height(previewText, CARD.preview.size);
  const line = CARD.title.size * CARD.lineHeight;
  return {
    frame: { x, y, width, height: Math.round(top + th + (previewText ? gap + ph : 0) + pad), strokeStyle: quiet ? "dashed" : "solid" },
    glyph: { x: x + pad, y: y + top + (line - CARD.glyph.h) / 2, ink: quiet ? CARD.quiet : CARD.glyph.ink },
    title: { x: x + pad + CARD.glyph.w + 10, y: y + top, text: titleText, width: widest(titleText, CARD.title.size), height: th, ink: quiet ? CARD.quiet : CARD.title.ink },
    preview: previewText ? { x: x + pad, y: y + top + th + gap, text: previewText, width: widest(previewText, CARD.preview.size), height: ph, ink: CARD.preview.ink } : null,
  };
}

// MARK: Making one

/** A card's elements, in the short form, with ids that follow from the card's own (so two devices
 *  drawing the same AI card make the same elements). */
function skeleton({ id, group, note, title, preview, quiet, x, y, width, fill, extraGroups = [] }) {
  const at = layout({ x, y, width, title, preview, quiet });
  const groupIds = [group, ...extraGroups];
  const base = { strokeWidth: 1, roughness: 0, opacity: 100, groupIds };
  const g = CARD.glyph;
  const out = [
    { ...base, type: "rectangle", id, ...at.frame, strokeColor: CARD.edge, backgroundColor: fill || CARD.fill, fillStyle: "solid", roundness: { type: 3 },
      customData: { pintoNote: note, title: title || "", pintoCard: "card" } },
    // A page with its corner folded.
    { ...base, type: "line", id: `${id}-glyph`, x: at.glyph.x, y: at.glyph.y, width: g.w, height: g.h, strokeColor: at.glyph.ink, strokeWidth: 1.5,
      points: [[0, 0], [g.w - g.fold, 0], [g.w, g.fold], [g.w, g.h], [0, g.h], [0, 0]], customData: { pintoNote: note, pintoCard: "glyph" } },
    { ...base, type: "line", id: `${id}-fold`, x: at.glyph.x + g.w - g.fold, y: at.glyph.y, width: g.fold, height: g.fold, strokeColor: at.glyph.ink, strokeWidth: 1.5,
      points: [[0, 0], [0, g.fold], [g.fold, g.fold]], customData: { pintoNote: note, pintoCard: "glyph" } },
    { ...base, type: "text", id: `${id}-title`, x: at.title.x, y: at.title.y, text: at.title.text, fontSize: CARD.title.size, fontFamily: CARD.font,
      lineHeight: CARD.lineHeight, strokeColor: at.title.ink, textAlign: "left", verticalAlign: "top", customData: { pintoNote: note, pintoCard: "title" } },
  ];
  if (at.preview) {
    out.push({ ...base, type: "text", id: `${id}-preview`, x: at.preview.x, y: at.preview.y, text: at.preview.text, fontSize: CARD.preview.size, fontFamily: CARD.font,
      lineHeight: CARD.lineHeight, strokeColor: at.preview.ink, textAlign: "left", verticalAlign: "top", customData: { pintoNote: note, pintoCard: "preview" } });
  }
  return out;
}

/** A card's full elements. */
export function makeCard(opts) {
  const made = convertToExcalidrawElements(skeleton(opts), { regenerateIds: false });
  // The words' size as laid out (the engine measures in the font it has, which may still be coming).
  const at = layout(opts);
  for (const e of made) {
    if (e.type !== "text") continue;
    const part = roleOf(e) === "title" ? at.title : at.preview;
    if (part) Object.assign(e, { x: part.x, y: part.y, width: part.width, height: part.height });
  }
  return made;
}

/** New cards for notes the app sends ({ id, title, preview, deleted }), side by side, the first
 *  centred on `at` (scene coordinates). */
export function newCards(notes, at) {
  let x = at.x - CARD.width / 2;
  const out = [];
  for (const n of notes) {
    const id = `card-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    const els = makeCard({ id, group: `${id}-group`, note: n.id, title: n.title, preview: n.deleted ? n.preview || "Note deleted" : n.preview, quiet: !!n.deleted, x, y: at.y - 40 });
    out.push(...els);
    x += CARD.width + 24;
  }
  return out;
}

/** An AI's short cards drawn as cards: each keeps its id and place (and its width, if it gave one
 *  wide enough); words it wrote on the shape become the card's title until the app sends the
 *  note's own. `changed` when there were any. */
export function expandSeeds(elements) {
  const seeds = elements.filter(isSeed);
  if (!seeds.length) return { elements, changed: false };
  const out = [];
  const byId = new Map(elements.map((e) => [e.id, e]));
  const replaced = new Set(seeds.map((s) => s.id));
  const moved = new Map();
  for (const e of elements) {
    // Words the AI bound to the shape (its label) go: the card draws its own.
    if (e.containerId && replaced.has(e.containerId)) { out.push({ ...e, isDeleted: true, version: e.version + 1, versionNonce: nonce(), updated: Date.now() }); continue; }
    if (!replaced.has(e.id)) { out.push(e); continue; }
    const note = noteOf(e);
    const label = (e.boundElements || []).map((b) => byId.get(b.id)).find((t) => t && t.type === "text");
    const title = data(e).title || (label && (label.originalText || label.text)) || (UUID.test(note) ? "" : note.split("/").pop());
    const fill = e.backgroundColor && e.backgroundColor !== "transparent" ? e.backgroundColor : undefined;
    const card = makeCard({ id: e.id, group: `${e.id}-group`, note, title, x: e.x, y: e.y, width: e.width >= 160 ? e.width : CARD.width, fill, extraGroups: e.groupIds || [] });
    // Arrows the AI bound to it stay bound, and still meet it; its own words don't.
    const arrows = (e.boundElements || []).filter((b) => b.type === "arrow");
    card[0] = { ...card[0], boundElements: arrows.length ? arrows : null, version: (e.version || 1) + 1 };
    for (const [aid, a] of follow(elements, e.id, { y: e.y, height: e.height }, { y: card[0].y, height: card[0].height }, (a) => moved.get(a.id) || a)) moved.set(aid, a);
    out.push(...card);
  }
  return { elements: out.map((e) => (moved.has(e.id) ? { ...moved.get(e.id), version: e.version + 1, versionNonce: nonce(), updated: Date.now() } : e)), changed: true };
}

// MARK: Arrows that join a card

/**
 * Arrows bound to card `id` when its box went from `was` to `now` ({ y, height }): the end on the
 * card moves with its edge, at the same place along it, so the arrow still meets the card.
 * Returns the arrows changed, by id.
 */
function follow(elements, id, was, now, current = (a) => a) {
  const out = new Map();
  if (!was.height || (was.y === now.y && was.height === now.height)) return out;
  const along = (y) => now.y + (y - was.y) * (now.height / was.height);
  for (const e of elements) {
    // As already changed for another card it joins (an arrow between two cards).
    const a = current(e);
    if (a.isDeleted || a.type !== "arrow" || !Array.isArray(a.points) || a.points.length < 2) continue;
    const start = a.startBinding && a.startBinding.elementId === id, end = a.endBinding && a.endBinding.elementId === id;
    if (!start && !end) continue;
    const abs = a.points.map(([px, py]) => [a.x + px, a.y + py]);
    if (start) abs[0] = [abs[0][0], along(abs[0][1])];
    if (end) abs[abs.length - 1] = [abs[abs.length - 1][0], along(abs[abs.length - 1][1])];
    const [x, y] = abs[0];
    const points = abs.map(([px, py]) => [px - x, py - y]);
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    out.set(a.id, { ...a, x, y, points, width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) });
  }
  return out;
}

// MARK: Keeping them current

/** Each card on the board, with its parts. */
export function cardsIn(elements) {
  const cards = [];
  const live = elements.filter((e) => !e.isDeleted && noteOf(e));
  for (const frame of live.filter(isCard)) {
    const group = (frame.groupIds || [])[0];
    const parts = group ? live.filter((e) => e !== frame && (e.groupIds || [])[0] === group && noteOf(e) === noteOf(frame)) : [];
    cards.push({ frame, glyphs: parts.filter((e) => roleOf(e) === "glyph"), title: parts.find((e) => roleOf(e) === "title"), preview: parts.find((e) => roleOf(e) === "preview") });
  }
  return cards;
}

/** The notes the board's cards name, each once, for the app to send their titles. */
export function cardNotes(elements) {
  return [...new Set(elements.filter(isCard).map(noteOf))].sort();
}

/**
 * The board with each card saying what its note says now: `info` is the app's, by what the card
 * names ({ id, title, preview, deleted }). A card that named its note by title takes the note's
 * id. Null when nothing changed.
 */
export function refreshCards(elements, info) {
  const changes = new Map();
  // Previews made now, each to go just after its card's title.
  const inserts = new Map();
  const set = (e, fields) => {
    const was = changes.get(e.id) || e;
    const differs = Object.keys(fields).some((k) => JSON.stringify(was[k]) !== JSON.stringify(fields[k]));
    if (differs) changes.set(e.id, { ...was, ...fields });
  };
  for (const c of cardsIn(elements)) {
    const ref = noteOf(c.frame), got = info && info[ref];
    if (!got) continue;
    const quiet = !!got.deleted;
    const title = got.title || data(c.frame).title || "";
    const preview = quiet ? got.preview || "Note deleted" : got.preview || "";
    const note = got.id || ref;
    const at = layout({ x: c.frame.x, y: c.frame.y, width: c.frame.width, title, preview, quiet });
    set(c.frame, { height: at.frame.height, strokeStyle: at.frame.strokeStyle, customData: { ...data(c.frame), pintoNote: note, title },
      ...(c.frame.strokeColor === CARD.oldEdge ? { strokeColor: CARD.edge } : {}) });
    const arrows = follow(elements, c.frame.id, { y: c.frame.y, height: c.frame.height }, { y: c.frame.y, height: at.frame.height }, (a) => changes.get(a.id) || a);
    for (const a of elements) if (arrows.has(a.id)) { const m = arrows.get(a.id); set(a, { x: m.x, y: m.y, points: m.points, width: m.width, height: m.height }); }
    const glyphAt = c.glyphs.length ? Math.min(...c.glyphs.map((g) => g.y)) : 0;
    for (const g of c.glyphs) set(g, { strokeColor: at.glyph.ink, y: g.y - glyphAt + at.glyph.y, customData: { ...data(g), pintoNote: note } });
    if (c.title) {
      set(c.title, { text: at.title.text, originalText: at.title.text, x: at.title.x, y: at.title.y, width: at.title.width, height: at.title.height,
        fontSize: CARD.title.size, strokeColor: at.title.ink, customData: { ...data(c.title), pintoNote: note } });
    }
    const words = at.preview && { text: at.preview.text, originalText: at.preview.text, x: at.preview.x, y: at.preview.y, width: at.preview.width,
      height: at.preview.height, fontSize: CARD.preview.size, strokeColor: at.preview.ink, isDeleted: false };
    // A preview that went (a note emptied) comes back as the same element.
    const group = (c.frame.groupIds || [])[0];
    const gone = !c.preview && group ? elements.find((e) => e.isDeleted && roleOf(e) === "preview" && (e.groupIds || [])[0] === group) : null;
    const preview0 = c.preview || gone;
    if (preview0 && words) set(preview0, { ...words, customData: { ...data(preview0), pintoNote: note } });
    else if (c.preview && !words) set(c.preview, { isDeleted: true });
    else if (!preview0 && words) {
      const [made] = convertToExcalidrawElements([{ type: "text", id: `${c.frame.id}-preview`, text: at.preview.text, x: at.preview.x, y: at.preview.y,
        fontSize: CARD.preview.size, fontFamily: CARD.font, lineHeight: CARD.lineHeight, strokeColor: at.preview.ink, textAlign: "left", verticalAlign: "top",
        strokeWidth: 1, roughness: 0, groupIds: c.frame.groupIds || [], customData: { pintoNote: note, pintoCard: "preview" } }], { regenerateIds: false });
      inserts.set((c.title || c.frame).id, { ...made, width: at.preview.width, height: at.preview.height });
    }
  }
  if (!changes.size && !inserts.size) return null;
  const now = Date.now();
  const bump = (e) => ({ ...e, version: e.version + 1, versionNonce: nonce(), updated: now });
  const out = [];
  for (const e of elements) {
    out.push(changes.has(e.id) ? bump(changes.get(e.id)) : e);
    if (inserts.has(e.id)) out.push(inserts.get(e.id));
  }
  return out;
}

// MARK: Opening one

/** The card under a point of the page (client coordinates), or null: the topmost thing there
 *  decides, so a shape drawn over a card isn't taken for it. Arrows and lines don't hide one. */
export function cardAt(api, clientX, clientY) {
  const s = api.getAppState();
  const p = viewportCoordsToSceneCoords({ clientX, clientY }, s);
  const els = api.getSceneElements();
  for (let i = els.length - 1; i >= 0; i--) {
    const e = els[i];
    if (["arrow", "line", "freedraw"].includes(e.type) && !noteOf(e)) continue;
    const [x1, y1, x2, y2] = getCommonBounds([e]);
    if (p.x < x1 || p.x > x2 || p.y < y1 || p.y > y2) continue;
    if (!noteOf(e)) return null;
    if (isCard(e)) return e;
    const group = (e.groupIds || [])[0];
    return els.find((f) => isCard(f) && (f.groupIds || [])[0] === group) || null;
  }
  return null;
}

/** The card a selection is, when it's one card (all of its parts, or the card alone). */
export function selectedCard(selected) {
  if (!selected.length || !selected.every(noteOf)) return null;
  const frames = selected.filter(isCard);
  if (frames.length !== 1 || new Set(selected.map(noteOf)).size !== 1) return null;
  const f = frames[0];
  return { note: noteOf(f), title: data(f).title || "" };
}
