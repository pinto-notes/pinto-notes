// Voting and a timer for a team session on a shared board (web/lib/board-team.ts; round 16,
// FigJam's retro tools): the rules, and what presence carries, read the same as the app reads it
// (supabase/functions/_shared/collab-vectors.json, team_presence; PaneTests/Collab/BoardTeamTests.swift).
// Two people voting and timing on one board, through the session, are in board-session.test.ts.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chime, clock, dotsOf, minutesFrom, resultsLine, sessionOf, tally, TeamModel, votesEach, votesIn, votesLeft } from "./board-team";

const v = JSON.parse(readFileSync(new URL("../../supabase/functions/_shared/collab-vectors.json", import.meta.url), "utf8"));
const t = v.team_presence as {
  presence: { team: unknown; dots: unknown }; ended: unknown; tally: { dots: string[][]; totals: Record<string, number> };
  clock: [number, string][]; malformed: unknown[];
};

class Clock {
  t = 1_000_000;
  private jobs: { at: number; fn: () => void }[] = [];
  now() { return this.t; }
  after(ms: number, fn: () => void) { const j = { at: this.t + ms, fn }; this.jobs.push(j); return () => { this.jobs = this.jobs.filter((x) => x !== j); }; }
  advance(ms: number) {
    const end = this.t + ms;
    for (;;) {
      const next = this.jobs.filter((j) => j.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      this.t = next.at;
      this.jobs = this.jobs.filter((j) => j !== next);
      next.fn();
    }
    this.t = end;
  }
}

describe("voting and a timer", () => {
  it("gives each person their votes, and the totals add up", () => {
    const team = new TeamModel(new Clock());
    team.canHost = true; team.canVote = true;
    let page = 0, out = 0;
    team.onPage = () => { page++; };
    team.onPublish = () => { out++; };
    expect(team.vote("a")).toBe(false);
    team.startVoting();
    expect(team.voting?.votes).toBe(3);
    for (const id of ["a", "a", "b", "c"]) team.vote(id);
    expect(team.myDots).toEqual(["a", "a", "b"]);
    expect(votesLeft(team.votesLeft)).toBe("No votes left");
    team.unvote("a");
    expect(team.myDots).toEqual(["a", "b"]);
    expect(team.command("#186B70", "#1C8086")).toEqual({ op: "votes", on: true, dots: [{ on: "a", color: "#186B70", dark: "#1C8086" }, { on: "b", color: "#186B70", dark: "#1C8086" }], results: null });
    team.endVoting();
    expect(team.voting?.results).toEqual({ a: 1, b: 1 });
    expect(team.dots()).toBeNull();
    expect(team.command("#186B70", "#1C8086")).toEqual({ op: "votes", on: false, dots: [], results: { a: 1, b: 1 } });
    team.clearVoting();
    expect(team.running).toBe(false);
    expect(page).toBeGreaterThan(0);
    expect(out).toBeGreaterThan(0);
    // Someone who can only comment votes, but doesn't start one.
    const commenter = new TeamModel(new Clock());
    commenter.canVote = true;
    commenter.startVoting();
    commenter.startTimer(60);
    expect(commenter.running).toBe(false);
    expect([votesEach(1), votesEach(3), votesIn(1), votesIn(4), resultsLine(7)]).toEqual(["1 vote each", "3 votes each", "1 vote in", "4 votes in", "Results: 7 votes"]);
    expect([minutesFrom(" 7 "), minutesFrom("0"), minutesFrom("61"), minutesFrom("2.5"), minutesFrom("two")]).toEqual([7, null, null, null, null]);
  });

  it("reads the app's presence, and leaves out anything malformed", () => {
    expect(sessionOf(t.presence.team)).toEqual({ voting: { id: "v-1a2b3c4d", votes: 3, results: null }, timer: { id: "t-5e6f7a8b", total: 300, left: 287.5 } });
    expect(dotsOf(t.presence.dots)).toEqual({ id: "v-1a2b3c4d", on: ["box-1", "box-1", "sticky-2"] });
    expect(sessionOf(t.ended)).toEqual({ voting: { id: "v-1a2b3c4d", votes: 3, results: { "box-1": 4, "sticky-2": 1 } }, timer: null });
    expect(tally(t.tally.dots)).toEqual(t.tally.totals);
    for (const [s, words] of t.clock) expect(clock(s)).toBe(words);
    for (const bad of t.malformed) expect(sessionOf(bad)).toBeNull();
    expect(dotsOf({ id: "v-1", on: [] })).toBeNull();
    // What the browser writes, the app reads: the same keys (BoardTeam.Session's).
    const team = new TeamModel(new Clock());
    team.canHost = true;
    team.startVoting(5);
    team.startTimer(90);
    expect(Object.keys(team.session()!).sort()).toEqual(["timer", "voting"]);
    expect(Object.keys(team.session()!.timer!).sort()).toEqual(["id", "left", "total"]);
  });

  it("counts down, says time's up and chimes once; joining after the end doesn't chime", () => {
    const c = new Clock();
    const host = new TeamModel(c);
    host.canHost = true;
    let rang = 0;
    host.onChime = () => { rang++; };
    host.startTimer(180);
    expect(clock(host.timeLeft())).toBe("3:00");
    c.advance(60_500);
    expect(clock(host.timeLeft())).toBe("2:00");
    c.advance(119_500);
    expect(host.finished).toBe(true);
    expect(rang).toBe(1);
    // A late joiner hears it ended.
    const late = new TeamModel(c);
    late.me = "sara";
    let lateRang = 0;
    late.onChime = () => { lateRang++; };
    late.heard("emil", "Emil Wagman", host.session(), null);
    expect(late.finished).toBe(true);
    expect(late.hostName).toBe("Emil");
    expect(lateRang).toBe(0);
    // The host's "Time's up" clears itself after two minutes.
    c.advance(120_000);
    expect(host.timer).toBeNull();
  });

  it("ends when its host leaves, and two starting at once settle on one", () => {
    const c = new Clock();
    const sara = new TeamModel(c);
    sara.me = "5a000000-0000-4000-8000-000000000002";
    sara.canHost = true; sara.canVote = true;
    sara.heard("E0000000-0000-4000-8000-000000000001", "Emil", { voting: { id: "v-1", votes: 3 } }, null);
    expect(sara.canStart).toBe(false);
    sara.vote("box");
    expect(sara.dots()).toEqual({ id: "v-1", on: ["box"] });
    sara.left("e0000000-0000-4000-8000-000000000001");
    expect(sara.running).toBe(false);
    expect(sara.myDots).toEqual([]);
    // Both start: the account id that sorts first runs it.
    sara.startVoting();
    sara.heard("e0000000-0000-4000-8000-000000000001", "Emil", { voting: { id: "v-emil", votes: 5 } }, null);
    expect(sara.hosting).toBe(true);
    const emil = new TeamModel(c);
    emil.me = "e0000000-0000-4000-8000-000000000001";
    emil.canHost = true;
    emil.startVoting();
    emil.heard(sara.me, "Sara", sara.session(), null);
    expect(emil.hosting).toBe(false);
    expect(emil.voting?.id).toBe(sara.voting?.id);
  });

  it("makes no sound where there's no audio", () => {
    expect(() => chime()).not.toThrow();
  });
});
