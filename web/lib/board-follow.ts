// Following someone on a shared whiteboard, in the browser: what the app does
// (Pane/Collab/BoardFollow.swift and CanvasController's following), for the page at /s/<id>.
//
// It travels in the sealed presence the board already sends (board-session.ts), the same fields
// the app sends: `present` (the frame someone presents, its step and the steps), `view` (what of
// the board they see, in its own coordinates), `laser` (their laser's points since the last beat)
// and `follow` (whose view they follow). So a browser follows a Mac and an iPhone, and they it.
//
// - Someone presenting: "Sara is presenting · Follow". Follow moves your view to each frame she
//   shows; her laser's trail shows. "Following Sara · Stop following"; Stop following, Escape, or
//   moving the board yourself ends it, and so does her Done.
// - Follow from an avatar: their view, wherever they scroll and zoom, until you stop or they go.
// - Whoever is followed sees how many follow.

export type Presenting = { frame: string | null; i: number; n: number };
export type View = [number, number, number, number];

/** Someone else on the board, for following them (BoardPerson in the app). */
export type BoardPerson = {
  id: string; name: string; color: string; dark: string;
  presenting: Presenting | null; view: View | null; following: string | null; stale: boolean;
};

export const MOST_LASER_POINTS = 120;
export const FOLLOW = "Follow";
export const STOP = "Stop following";

/** A presenting step as presence carries it, checked (BoardPresenting.checked). */
export function presentingOf(v: unknown): Presenting | null {
  if (!v || typeof v !== "object") return null;
  const p = v as { frame?: unknown; i?: unknown; n?: unknown };
  const frame = typeof p.frame === "string" ? p.frame : null;
  if (frame !== null && (frame === "" || frame.length > 200)) return null;
  if (typeof p.i !== "number" || typeof p.n !== "number" || !Number.isInteger(p.i) || !Number.isInteger(p.n)) return null;
  if (p.n < 1 || p.n > 10_000 || p.i < 0 || p.i >= p.n) return null;
  return { frame, i: p.i, n: p.n };
}

/** A view as presence carries it: x, y, width, height, finite, with a size. */
export function viewOf(v: unknown): View | null {
  if (!Array.isArray(v) || v.length !== 4 || !v.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  if (v[2] <= 0 || v[3] <= 0 || v[2] >= 1e7 || v[3] >= 1e7) return null;
  return [v[0], v[1], v[2], v[3]];
}

/** Laser points as presence carries them, checked. */
export function pointsOf(v: unknown): [number, number][] {
  if (!Array.isArray(v)) return [];
  const out: [number, number][] = [];
  for (const p of v.slice(0, MOST_LASER_POINTS)) {
    if (Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number" && Number.isFinite(n))) out.push([p[0], p[1]]);
  }
  return out;
}

export type Banner = { kind: "presenting" | "following"; person: BoardPerson; line: string; action: string };

/** Who presents: the first of the others presenting who's still heard from. */
export function presenter(people: BoardPerson[]): BoardPerson | null {
  const live = people.filter((p) => p.presenting && !p.stale).sort((a, b) => (a.id.toUpperCase() < b.id.toUpperCase() ? -1 : 1));
  return live[0] ?? null;
}

/** The banner over the board: whom you follow, or someone else presenting while you aren't. */
export function banner(people: BoardPerson[], following: string | null, presentingHere = false): Banner | null {
  const f = following ? people.find((p) => p.id === following) : undefined;
  if (f) return { kind: "following", person: f, line: `Following ${f.name}`, action: STOP };
  const p = presentingHere ? null : presenter(people);
  return p ? { kind: "presenting", person: p, line: `${p.name} is presenting`, action: FOLLOW } : null;
}

/** The people following you. */
export function followers(me: string | null, people: BoardPerson[]): BoardPerson[] {
  if (!me) return [];
  return people.filter((p) => p.following === me && !p.stale).sort((a, b) => a.name.localeCompare(b.name));
}

/** "Sara is following", "3 following". */
export function followersLine(list: BoardPerson[]): string | null {
  return list.length === 0 ? null : list.length === 1 ? `${list[0].name} is following` : `${list.length} following`;
}

/** The page's command for where a follower's view goes: the frame they present (the whole board
 *  when it has none), else what they see. */
export function target(p: BoardPerson): Record<string, unknown> | null {
  if (p.presenting) return p.presenting.frame ? { op: "follow", frame: p.presenting.frame } : { op: "follow", whole: true };
  return p.view ? { op: "follow", view: p.view } : null;
}

/** Following someone on this page's board: whose view, and the page told where to look. */
export class BoardFollow {
  people: BoardPerson[] = [];
  following: string | null = null;
  /** You followed them because they were presenting: their Done ends it. */
  private presenterFollow = false;
  private last = "";
  /** Tells the others whose view you follow. */
  onFollow: ((id: string | null) => void) | null = null;
  /** The banner or the people changed: the page draws again. */
  onChange: (() => void) | null = null;

  constructor(private readonly send: (command: Record<string, unknown>) => void) {}

  get banner() { return banner(this.people, this.following); }

  show(people: BoardPerson[]) {
    const same = JSON.stringify(people) === JSON.stringify(this.people);
    this.people = people;
    if (this.following) {
      const p = people.find((x) => x.id === this.following);
      if (!p || (this.presenterFollow && !p.presenting)) { this.stop(); return; }
      this.apply(p);
    }
    if (!same) this.onChange?.();
  }

  follow(id: string) {
    const p = this.people.find((x) => x.id === id);
    if (!p) return;
    if (this.following !== id) this.onFollow?.(id);
    this.following = id;
    this.presenterFollow = !!p.presenting;
    this.last = "";
    this.apply(p);
    this.onChange?.();
  }

  stop() {
    if (!this.following) return;
    this.following = null;
    this.presenterFollow = false;
    this.last = "";
    this.onFollow?.(null);
    this.send({ op: "follow", off: true });
    this.onChange?.();
  }

  /** The page loaded again: whose view it follows, again. */
  reload() {
    this.last = "";
    const p = this.following ? this.people.find((x) => x.id === this.following) : undefined;
    if (p) this.apply(p);
  }

  private apply(p: BoardPerson) {
    const t = target(p);
    if (!t) return;
    const j = JSON.stringify(t);
    if (j === this.last) return;
    this.last = j;
    this.send(t);
  }
}
