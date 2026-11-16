// Voting and a timer for a team session on a shared whiteboard, in the browser (round 16; FigJam's
// retro tools). The app does the same (Pane/Collab/BoardTeam.swift) and the two read each other's
// presence (supabase/functions/_shared/collab-vectors.json, team_presence).
//
// Whoever starts one hosts it: their presence carries it (`team`), and each voter's carries their
// own dots (`dots`). It's never part of the drawing: the document, its pictures and the share page
// leave it out.
// - Voting: each person has a number of votes (3 to start with). While it's on, a click on a shape
//   or a sticky puts one of your dots on it, in your colour; a click on your dot takes it back. You
//   see your own dots, as in FigJam; the host sees how many are in. End voting shows everyone the
//   totals; Done clears them.
// - Timer: 1, 3, 5 or 10 minutes, or your own; everyone sees it count down, and a soft chime ends it.

export type Voting = { id: string; votes: number; results?: Record<string, number> | null };
export type Timer = { id: string; total: number; left: number };
export type TeamSession = { voting?: Voting | null; timer?: Timer | null };
export type Dots = { id: string; on: string[] };

export const DEFAULT_VOTES = 3;
/** The Start voting menu: the usual first, then the others. */
export const VOTE_CHOICES = [3, 1, 5, 10];
export const MOST_VOTES = 20;
export const TIMER_MINUTES = [1, 3, 5, 10];
export const MOST_MINUTES = 60;
/** A finished timer's "Time's up" clears itself after this long, if the host hasn't. */
export const TIMES_UP_FOR = 120_000;

export const START_VOTING = "Start voting";
export const END_VOTING = "End voting";
export const CLEAR_VOTES = "Clear votes";
export const TIMER = "Timer";
export const STOP_TIMER = "Stop timer";
export const TIMES_UP = "Time’s up";
export const DONE = "Done";
export const VOTING = "Voting";
export const votesEach = (n: number) => (n === 1 ? "1 vote each" : `${n} votes each`);
export const minutes = (n: number) => (n === 1 ? "1 minute" : `${n} minutes`);
export const votesLeft = (n: number) => (n === 0 ? "No votes left" : n === 1 ? "1 vote left" : `${n} votes left`);
export const votesIn = (n: number) => (n === 1 ? "1 vote in" : `${n} votes in`);
export const resultsLine = (n: number) => (n === 1 ? "Results: 1 vote" : `Results: ${n} votes`);
export const hostedBy = (name: string) => `${name} started it`;

/** "4:32", "0:07": whole seconds, rounded up, so it reads 0:00 only at the end. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function tally(all: string[][]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dots of all) for (const id of dots) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/** The minutes typed for a custom timer (1 to 60, whole), or null. */
export function minutesFrom(typed: string): number | null {
  const n = Number(typed.trim());
  return Number.isInteger(n) && n >= 1 && n <= MOST_MINUTES ? n : null;
}

const newId = (kind: string) => `${kind}-${Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("")}`;
const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64;

/** A presence's `team`, checked: anything malformed is left out, not half taken. */
export function sessionOf(v: unknown): TeamSession | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { voting?: unknown; timer?: unknown };
  let voting: Voting | null = null, timer: Timer | null = null;
  if (o.voting && typeof o.voting === "object") {
    const x = o.voting as { id?: unknown; votes?: unknown; results?: unknown };
    if (isId(x.id) && Number.isInteger(x.votes) && (x.votes as number) >= 1 && (x.votes as number) <= MOST_VOTES) {
      let results: Record<string, number> | null = null;
      if (x.results && typeof x.results === "object") {
        results = Object.fromEntries(Object.entries(x.results as Record<string, unknown>).filter((e): e is [string, number] => isId(e[0]) && Number.isInteger(e[1]) && (e[1] as number) > 0).slice(0, 500));
      }
      voting = { id: x.id, votes: x.votes as number, results };
    }
  }
  if (o.timer && typeof o.timer === "object") {
    const x = o.timer as { id?: unknown; total?: unknown; left?: unknown };
    const ok = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= MOST_MINUTES * 60;
    if (isId(x.id) && ok(x.total) && ok(x.left) && x.total > 0) timer = { id: x.id, total: x.total, left: x.left };
  }
  return voting || timer ? { voting, timer } : null;
}

/** A presence's `dots`, checked. */
export function dotsOf(v: unknown): Dots | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { id?: unknown; on?: unknown };
  if (!isId(o.id) || !Array.isArray(o.on)) return null;
  const on = o.on.filter(isId).slice(0, MOST_VOTES);
  return on.length ? { id: o.id, on } : null;
}

type Clock = { now(): number; after(ms: number, fn: () => void): () => void };
const realClock: Clock = { now: () => Date.now(), after: (ms, fn) => { const t = setTimeout(fn, ms); return () => clearTimeout(t); } };

/** One board's team session as this browser sees it (the app's BoardTeamModel). */
export class TeamModel {
  /** You (null: not signed in). */
  me: string | null = null;
  /** You may start voting or a timer (you can edit). */
  canHost = false;
  /** You may vote (you can edit or comment). */
  canVote = false;
  host: string | null = null;
  hostName: string | null = null;
  voting: Voting | null = null;
  timer: Timer | null = null;
  endsAt: number | null = null;
  finished = false;
  myDots: string[] = [];
  private theirs = new Map<string, Dots>();
  private chimed = new Set<string>();
  private ticking: (() => void) | null = null;
  private clearing: (() => void) | null = null;

  /** What the page draws changed. */
  onPage: (() => void) | null = null;
  /** What your presence carries changed. */
  onPublish: (() => void) | null = null;
  /** The timer ended here (once a timer, never for one that ended before you came). */
  onChime: (() => void) | null = null;

  constructor(private readonly clock: Clock = realClock) {}

  get running() { return !!(this.voting || this.timer); }
  get hosting() { return this.host === null && this.running; }
  get votingOpen() { return !!this.voting && !this.voting.results; }
  get votesLeft() { return Math.max(0, (this.voting?.votes ?? 0) - this.myDots.length); }
  get votesIn() {
    const id = this.voting?.id;
    if (!id) return 0;
    let n = this.myDots.length;
    for (const d of this.theirs.values()) if (d.id === id) n += d.on.length;
    return n;
  }
  get resultsTotal() { return Object.values(this.voting?.results ?? {}).reduce((a, b) => a + b, 0); }
  get canStart() { return this.canHost && this.host === null; }
  timeLeft(now = this.clock.now()) { return this.endsAt === null ? 0 : Math.max(0, (this.endsAt - now) / 1000); }

  // MARK: The host's

  startVoting(votes = DEFAULT_VOTES) {
    if (!this.canStart) return;
    this.voting = { id: newId("v"), votes: Math.min(Math.max(Math.round(votes), 1), MOST_VOTES) };
    this.myDots = [];
    this.changed();
  }

  endVoting() {
    const v = this.voting;
    if (this.host !== null || !v || v.results) return;
    const all = [this.myDots, ...[...this.theirs.values()].filter((d) => d.id === v.id).map((d) => d.on)];
    this.voting = { ...v, results: tally(all) };
    this.changed();
  }

  clearVoting() {
    if (this.host !== null || !this.voting) return;
    this.voting = null;
    this.myDots = [];
    this.changed();
  }

  startTimer(seconds: number) {
    if (!this.canStart || !(seconds > 0)) return;
    const s = Math.min(seconds, MOST_MINUTES * 60);
    this.timer = { id: newId("t"), total: s, left: s };
    this.endsAt = this.clock.now() + s * 1000;
    this.finished = false;
    this.tick();
    this.changed();
  }

  stopTimer() {
    if (this.host !== null || !this.timer) return;
    this.timer = null;
    this.endsAt = null;
    this.finished = false;
    this.ticking?.(); this.ticking = null;
    this.clearing?.(); this.clearing = null;
    this.changed();
  }

  // MARK: Voting

  vote(on: string) {
    if (!this.canVote || !this.votingOpen || this.votesLeft <= 0) return false;
    this.myDots = [...this.myDots, on];
    this.changed();
    return true;
  }

  unvote(on: string) {
    const i = this.myDots.lastIndexOf(on);
    if (!this.votingOpen || i < 0) return;
    this.myDots = this.myDots.filter((_, k) => k !== i);
    this.changed();
  }

  // MARK: What your presence carries

  session(): TeamSession | null {
    if (!this.hosting) return null;
    return { voting: this.voting, timer: this.timer ? { ...this.timer, left: Math.round(this.timeLeft() * 10) / 10 } : null };
  }

  dots(): Dots | null {
    const v = this.voting;
    return v && !v.results && this.myDots.length ? { id: v.id, on: this.myDots } : null;
  }

  /** What the page shows: `{ op: "votes", on, dots, results }`, your dots in your colour. */
  command(color: string, dark: string | undefined) {
    return { op: "votes", on: this.votingOpen && this.canVote, dots: this.votingOpen ? this.myDots.map((on) => ({ on, color, dark: dark ?? color })) : [], results: this.voting?.results ?? null };
  }

  // MARK: What the others' presence carries

  heard(user: string, name: string, session: TeamSession | null, dots: Dots | null) {
    const id = user.toLowerCase();
    if (id === this.me) return;
    const before = JSON.stringify([this.theirs.get(id) ?? null, this.host, this.voting, this.timer?.id ?? null]);
    if (dots) this.theirs.set(id, dots); else this.theirs.delete(id);
    if (session && (session.voting || session.timer)) {
      // Two started at once: the one whose account id sorts first runs it, on every device.
      if (!(this.hosting && this.me && this.me < id)) this.adopt(id, name, session);
    } else if (this.host === id) this.end();
    if (JSON.stringify([this.theirs.get(id) ?? null, this.host, this.voting, this.timer?.id ?? null]) !== before) this.onPage?.();
  }

  left(user: string) {
    const id = user.toLowerCase();
    this.theirs.delete(id);
    if (this.host === id) { this.end(); this.onPage?.(); }
  }

  private adopt(user: string, name: string, s: TeamSession) {
    if (this.hosting) { this.ticking?.(); this.clearing?.(); }
    this.host = user;
    this.hostName = name.split(/\s+/)[0] || name;
    if ((s.voting?.id ?? null) !== (this.voting?.id ?? null)) this.myDots = [];
    this.voting = s.voting ?? null;
    const t = s.timer ?? null;
    if (t) {
      const ends = this.clock.now() + Math.max(0, t.left) * 1000;
      if (t.id !== this.timer?.id) {
        this.timer = t;
        this.endsAt = ends;
        this.finished = t.left <= 0;
        // Joined after it ended: no chime.
        if (this.finished) this.chimed.add(t.id);
        this.tick();
      } else if (this.endsAt !== null && Math.abs(this.endsAt - ends) > 1000) {
        this.timer = t;
        this.endsAt = ends;
        this.tick();
      }
    } else if (this.timer) {
      this.timer = null; this.endsAt = null; this.finished = false; this.ticking?.(); this.ticking = null;
    }
  }

  private end() {
    this.ticking?.(); this.ticking = null;
    this.host = null; this.hostName = null; this.voting = null; this.timer = null; this.endsAt = null; this.finished = false; this.myDots = [];
  }

  private changed() { this.onPage?.(); this.onPublish?.(); }

  private tick() {
    this.ticking?.();
    this.ticking = null;
    const id = this.timer?.id, ends = this.endsAt;
    if (!id || ends === null) return;
    this.ticking = this.clock.after(Math.max(0, ends - this.clock.now()), () => {
      this.ticking = null;
      if (this.timer?.id === id) this.finish(id);
    });
  }

  private finish(id: string) {
    this.finished = true;
    if (!this.chimed.has(id)) { this.chimed.add(id); this.onChime?.(); }
    this.onPage?.();
    if (this.host !== null) return;
    this.clearing?.();
    this.clearing = this.clock.after(TIMES_UP_FOR, () => { this.clearing = null; if (this.timer?.id === id && this.host === null) this.stopTimer(); });
  }
}

/** The soft chime at a timer's end: two quiet sine notes, a fifth apart, over half a second. */
export function chime(ctx?: AudioContext) {
  try {
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const a = ctx ?? (AC ? new AC() : null);
    if (!a) return;
    const notes = [[880, 0], [1318.5, 0.16]] as const;
    for (const [hz, at] of notes) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = "sine";
      o.frequency.value = hz;
      const t = a.currentTime + at;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + 0.55);
    }
  } catch { /* no sound here */ }
}
