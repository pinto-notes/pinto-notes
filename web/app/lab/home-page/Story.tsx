"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { AiShow } from "./AiShow";
import { AskChatGpt, HabitsNote } from "./Habits";
import { CollabPicture } from "./Collab";
import { Study, Trust } from "./Close";
import { HeroArt } from "./HeroArt";
import { useArt } from "./art";
import { BoardBig, CanvasChrome, Note, NotePhone } from "./Things";
import { underline } from "./hand";
import { WbArt, WbCanvas } from "./Wb";
import { AiAlt } from "./AiAlt";
import { HeroWin } from "./HeroWin";
import { Chat, tellCarry } from "./Carry";
import { CloseNote } from "./CloseNote";
import { PageHero } from "./PageHero";
import { lerp, mj, seg } from "./show";
import c from "./carry.module.css";
import ha from "./heroArt.module.css";
import hw from "./heroWin.module.css";
import s from "./s.module.css";

// Study Z, round 18 (2026-11-16): option C after the round 13 council. S's binder carrying one
// person's week, several parts of one life. The first screen is that person's table (the still life)
// with one note on it, "This week", all dinner: what they decided ("20-minute weeknight dinners"),
// Tuesday's dinner, and Thursday's, which ChatGPT just added. Over it, the ChatGPT request that changed
// it ("Add a dinner for Thursday."); on load, the decision's "20-minute" takes ChatGPT's underline and
// Thursday's line writes itself in, "Lemon chicken · 20 min", marked "Added by ChatGPT": the AI read
// what you decided. That picture is HeroArt.tsx, one swappable piece. Each chapter shows another part
// of that life: Notes, a book note open in Pinto (vermilion), the notes brought over from Apple Notes;
// Whiteboards, the job offer from Studio North mapped as a decision (deep green); Apps, the habits
// they're building (kraft); Your AI, one request typed in ChatGPT that lands in all three, in Pinto
// Notes (ink). Then the close, on the same table (round 21: the stats sheet is gone, and the study is
// one line in Your AI and one fact here): "Pinto Notes is free.", the download, and four true facts.
//
// Every sheet, the close too, is torn along its top and laid over the last. The four
// chapters dock under their tabs; the close, which has no tab, rises on over the tab
// strip and dock under the header, so the tabs end with Your AI. When a sheet lands its tab rises out
// of it and stays docked under the header; as a sheet rises, the words and things on the one under it move up
// ahead of its torn edge, so a tear never cuts through them. Above that, a sheet's contents end where
// its paper does: they're masked by the sheet's own torn edge, fading out just before it, so nothing
// is ever cut by a straight line under the tabs. A heading and its line fade out whole before they
// reach that edge. On a phone each chapter is as long as what's on it: the next sheet waits just
// under the last line, not a screen below.
//
// The sheets move by `position: sticky` alone (the browser scrolls them; no script moves them). The
// script measures how far each one is through its stay; the chapters' shows (show.ts) start when they
// dock. With Reduce Motion or `?t=`, everything shows its end state.

type Tone = "write" | "draw" | "build" | "ai" | "share" | "cover";
/** Every chapter the page can have, in order. Sharing is there only with `?collab=1` (round 23); the
 *  binder works with the chapters on the page (`ord` in useBinder). */
const ORDER: Tone[] = ["write", "draw", "build", "ai", "share", "cover"];
const TAB: Record<Tone, string> = { write: "Notes", draw: "Whiteboards", build: "Apps", ai: "Your AI", share: "Sharing", cover: "" };
/** On a phone, the chapters whose next sheet waits just under their last line (+ AIR px), so a chapter
 *  is as long as what's on it. Your AI keeps its stay (it fills the screen, and its cards step). */
const SNUG: Tone[] = ["write", "draw", "build", "share"];
const AIR = 34;
/** On a Mac, Notes is as long as what's on it too (round 19): the whiteboard's sheet waits this far
 *  under the Mac window and its iPhone, so no stretch of empty red follows them. */
const SNUG_WIDE: Tone[] = ["write"];
const AIR_WIDE = 44;
/** The gap between the tabs, which are as wide as their labels (round 19), on a Mac and on a phone. */
const TAB_GAP = 8, TAB_GAP_NARROW = 6;
const narrowNow = () => typeof matchMedia === "function" && matchMedia("(max-width: 760px)").matches;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** How far (px) above its clip line a headline starts to fade; it's gone by the time it gets there. */
const FADE = 64;
/** A product picture slides on under the torn edge above it, as a page in the binder would, cut along
 *  the tear (never a straight line), and stays whole and solid until only SHOW_FROM of it is left in
 *  view; it fades out by SHOW_TO. Round 24: round 23 faded it once 12% had gone under, so for most of a
 *  hand-off the sheet was empty (desk-06, phone-04, phone-06); now there's always something on it until
 *  the next sheet has nearly covered it. */
const SHOW_FROM = 0.36, SHOW_TO = 0.12;
/** How far under its torn edge a heading with little room above it goes while it fades. */
const TUCK_HEAD = 56;

/** Who wants to know how far each chapter is through its stay (0 as it docks, 1 as the next one rises). */
type Listener = (dwell: number, arrive: number) => void;
const listeners = new Map<Tone, Set<Listener>>();
function listen(tone: Tone, fn: Listener) {
  const set = listeners.get(tone) ?? new Set();
  set.add(fn); listeners.set(tone, set);
  return () => { set.delete(fn); };
}

export function still() {
  return typeof location !== "undefined" && new URLSearchParams(location.search).has("t");
}
function calm() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where a tab scrolls to: docked, and for the drawing, most of the way through its stay. */
const STAY: Record<Tone, number> = { write: 0.2, draw: 0.85, build: 0.02, ai: 0.02, share: 0.02, cover: 0 };
/** A chapter's stay as a show's clock source (see show.ts). */
const stayOf = (tone: Tone) => (fn: (dwell: number, arrive: number) => void) => listen(tone, fn);
let jump: (tone: Tone) => void = () => {};

/* ───────────────────────── The binder: what the script does ───────────────────────── */

function useBinder(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    // The header is the binder's top on this page: solid cream, no frost, no line (inline, so the
    // scrolled state's frost can't win).
    const header = document.querySelector<HTMLElement>(".site-header");
    const HEADER = { backgroundColor: "#fff4e6", boxShadow: "none", backdropFilter: "none", webkitBackdropFilter: "none" } as const;
    if (header) Object.assign(header.style, HEADER);
    el.dataset.live = "";
    const ord = ORDER.filter((t) => el.querySelector(`[data-ch="${t}"]`));
    const chs = ord.map((t) => el.querySelector<HTMLElement>(`[data-ch="${t}"]`)!);
    const hero = el.querySelector<HTMLElement>("[data-hero]")!;
    const probe = el.querySelector<HTMLElement>("[data-probe]")!;
    const reduced = calm();
    /** Each chapter's words that fade before they reach its clip line (headlines and their lines). */
    const fades = chs.map((c) => [...c.querySelectorAll<HTMLElement>("[data-fade]")]);
    let vh = 0, tt = 0, hh = 0, tear = 0, raf = 0, pastY = 400;
    // Round 26, `carry`: the Notes chapter's window (the carrier) is the first screen's picture. `dock` is
    // where its note pane lies once Notes has docked; `rest`, where it lies in the first screen (on a Mac
    // with hero=1, the same place: it never moves). Both in screen px, the pane's top left.
    const carry = el.dataset.carry;
    const carrier = carry ? el.querySelector<HTMLElement>("[data-carrier]") : null;
    const pane = carrier?.querySelector<HTMLElement>("[data-pane]") ?? null;
    const win = carrier?.querySelector<HTMLElement>("[data-win]") ?? null;
    const chat = carry ? el.querySelector<HTMLElement>("[data-chat]") : null;
    const slot = carry ? hero.querySelector<HTMLElement>("[data-slot]") : null;
    // Round 27, `page`: the first screen is a note (PageHero.tsx). Its sheet lies over the page at rest;
    // as you scroll it's laid fixed and shrinks onto the Notes window (pinned where it docks, behind it)
    // while its words scroll away inside it, then fades into the window. S0: the sheet at rest, in page px.
    const page = el.dataset.page;
    const sheet = page ? el.querySelector<HTMLElement>("[data-sheet]") : null;
    const sheetIn = sheet?.querySelector<HTMLElement>("[data-sheet-in]") ?? null;
    const paper = sheet?.querySelector<HTMLElement>("[data-paper]") ?? null;
    const pill = sheet?.querySelector<HTMLElement>("[data-pill]") ?? null;
    const bar = sheet?.querySelector<HTMLElement>("[data-bar]") ?? null;
    let S0 = { x: 0, y: 0, w: 1, h: 1 }, P = { x: 0, y: 0, w: 1, h: 1 }, sheetNarrow = false;
    let sheetLive = false;
    let anchorY = 0, dock = { x: 0, y: 0, w: 1, h: 1 }, rest = { x: 0, y: 0, s: 1, r: 0 }, chatAt = { dx: 0, dy: 0, r: 0 }, lastP = -1;
    /** Where a sheet docks: a chapter under its tab, the close (no tab) under the header,
     *  over the tab strip, so the tabs end with Your AI. */
    const topOf = (i: number) => (TAB[ord[i]] ? tt : hh);
    let doc: number[] = [], mt: number[] = [];
    const covered = chs.map(() => false);
    const lifts = chs.map(() => 0);
    /** How far down the sheet its words and things reach (from its top, without any lift). */
    const reach = (i: number) => {
      const c = chs[i], top = c.getBoundingClientRect().top;
      const kids = c.querySelectorAll<HTMLElement>("[data-body] > * > *");
      let b = 0;
      kids.forEach((k) => { const r = k.getBoundingClientRect(); if (r.height > 0 && getComputedStyle(k).display !== "none") b = Math.max(b, r.bottom); });
      return b - top + lifts[i];
    };

    const measure = () => {
      if (carrier) carrier.style.transform = "none";
      if (sheet && sheetIn && paper) {
        sheet.removeAttribute("style"); sheetIn.removeAttribute("style"); paper.removeAttribute("style"); bar?.removeAttribute("style");
        sheetLive = false;
        const r = sheet.getBoundingClientRect();
        S0 = { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
      }
      vh = innerHeight; tt = probe.offsetHeight;
      const cs = getComputedStyle(el);
      tear = parseFloat(cs.getPropertyValue("--tearH")) || 0;
      hh = parseFloat(cs.getPropertyValue("--hh")) || 0;
      // On a phone the next sheet waits just under a chapter's last line: its margin (the stay) is
      // taken back by the room left empty under the words. Wide windows keep the stylesheet's stays.
      const narrow = narrowNow();
      chs.forEach((c, i) => {
        const next = chs[i + 1]; if (!next) return;
        const snug = narrow ? SNUG.includes(ord[i]) : SNUG_WIDE.includes(ord[i]);
        const want = snug ? `${-Math.max(0, Math.round(c.offsetHeight - reach(i) - (narrow ? AIR : AIR_WIDE)))}px` : "";
        if (next.style.marginTop !== want) next.style.marginTop = want;
      });
      // The tabs are as wide as their labels, side by side from the page's left edge.
      let l = 0;
      chs.forEach((c) => {
        const tab = c.querySelector<HTMLElement>("[data-tab]"); if (!tab) return;
        c.style.setProperty("--l", `${l}px`);
        l += tab.offsetWidth + (narrow ? TAB_GAP_NARROW : TAB_GAP);
      });
      // Round 25: once the first screen's buttons have gone under the header, a phone's header offers
      // the iPhone download in Templates' place (.getIt).
      const cta = (sheet ?? hero).querySelector<HTMLElement>("[data-cta]");
      pastY = cta ? cta.getBoundingClientRect().bottom + scrollY - hh : 400;
      let end = hero.getBoundingClientRect().bottom + scrollY;
      doc = []; mt = [];
      chs.forEach((c, i) => { const m = parseFloat(getComputedStyle(c).marginTop) || 0; mt.push(m); doc.push(end + m); end = doc[i] + c.offsetHeight; });
      if (carrier && pane && win) {
        const ch = chs[0].getBoundingClientRect(), r = pane.getBoundingClientRect(), w = win.getBoundingClientRect(), cb = carrier.getBoundingClientRect();
        dock = { x: r.left, y: r.top - ch.top + tt + lifts[0], w: r.width, h: w.bottom - r.top };
        // ChatGPT is pinned beside the To try heading, which doesn't move as lines are written under it.
        anchorY = (pane.querySelector<HTMLElement>("[data-anchor]")?.getBoundingClientRect().top ?? r.top + 300) - r.top;
        carrier.style.transformOrigin = `${(r.left - cb.left).toFixed(1)}px ${(r.top - cb.top).toFixed(1)}px`;
        el.style.setProperty("--paneL", `${Math.round(dock.x)}px`);
        el.style.setProperty("--paneW", `${Math.round(dock.w)}px`);
        el.style.setProperty("--paneT", `${Math.round(dock.y)}px`);
        // The first screen's words leave room for the picture: on a phone the note waits under them.
        const narrow = narrowNow();
        if (narrow) {
          const words = hero.querySelector<HTMLElement>("[data-words]");
          el.style.setProperty("--slotT", `${Math.round((words?.getBoundingClientRect().bottom ?? 420) + scrollY + 174)}px`);
        }
        const sr = slot?.getBoundingClientRect();
        // Where the note lands: the window's note column, its toolbar included (on a phone, the whole
        // iPhone card), as it lies once Notes has docked.
        const wr = win.getBoundingClientRect(), wy = wr.top - ch.top + tt + lifts[0];
        sheetNarrow = narrow;
        P = narrow ? { x: wr.left, y: wy, w: wr.width, h: wr.height } : { x: r.left, y: wy, w: wr.right - r.left, h: wr.height };
        rest = page ? { x: dock.x, y: dock.y, s: 1, r: 0 } : carry === "2" && !narrow && sr && !reduced
          ? { x: sr.left, y: sr.top + scrollY, s: sr.width / Math.max(1, r.width), r: -2.4 }
          : narrow && sr ? { x: sr.left, y: sr.top + scrollY, s: sr.width / Math.max(1, r.width), r: carry === "2" && !reduced ? -1.6 : 0 }
          : { x: dock.x, y: dock.y, s: 1, r: 0 };
        // ChatGPT over the window's corner: on a Mac over the pane's empty right margin (the room the
        // iPhone takes later), hanging below the window; on a phone over the note's top right.
        chatAt = narrow ? { dx: -250, dy: carry === "2" ? -173 : -167, r: 0 } : carry === "2" ? { dx: -34, dy: -128, r: 0 } : { dx: -76, dy: -18, r: 0 };
      }
    };

    /** The note at hand-off progress p: it shrinks, whole, from where it rests onto the window's note
     *  column (pinned there, under it), its words going as it goes, then fades into that column, so
     *  the app's own note (Deep Work) is what's left. Only one empty box's rect, a transform and
     *  opacities change. */
    const sheetAt = (p: number, y: number) => {
      if (!sheet || !sheetIn || !paper) return;
      if (p <= 0 && y <= 0) {
        if (sheetLive) { sheetLive = false; sheet.removeAttribute("style"); sheetIn.removeAttribute("style"); paper.removeAttribute("style"); bar?.removeAttribute("style"); }
        return;
      }
      const e = mj(seg(p, 0.02, 0.32));
      const rx = lerp(S0.x, P.x, e), ry = lerp(S0.y, P.y, e), rw = lerp(S0.w, P.w, e), rh = lerp(S0.h, P.h, sheetNarrow ? mj(seg(p, 0.02, 0.2)) : e);
      if (!sheetLive) {
        sheetLive = true;
        Object.assign(sheet.style, { position: "fixed", right: "auto", bottom: "auto", minHeight: "0" });
        sheetIn.style.width = `${S0.w}px`;
        sheetIn.style.transformOrigin = "0 0";
      }
      sheet.style.left = `${rx.toFixed(1)}px`; sheet.style.top = `${ry.toFixed(1)}px`;
      sheet.style.width = `${rw.toFixed(1)}px`; sheet.style.height = `${rh.toFixed(1)}px`;
      // The words shrink with the sheet, from its top left, and are gone before it lands.
      sheetIn.style.transform = `scale(${(rw / S0.w).toFixed(4)})`;
      sheetIn.style.opacity = (1 - seg(p, 0.04, 0.22)).toFixed(3);
      // Its toolbar goes with them: the window it lands on has its own.
      if (bar) bar.style.opacity = (1 - seg(p, 0.04, 0.22)).toFixed(3);
      // The column it lands on has square corners where it meets the sidebar (a phone's card keeps its own).
      const rl = (sheetNarrow ? 14 : lerp(14, 0, e)).toFixed(1);
      paper.style.borderRadius = `${rl}px 14px 14px ${rl}px`;
      if (pill) pill.style.opacity = (1 - seg(p, 0.02, 0.18)).toFixed(3);
      paper.style.opacity = (1 - seg(p, 0.2, 0.38)).toFixed(3);
      sheet.style.visibility = p >= 0.38 ? "hidden" : "";
    };

    const frame = () => {
      raf = 0;
      const y = scrollY;
      if (carrier && chs[0]) {
        // How far the hand-off is: 0 in the first screen, 1 as Notes docks under its tab.
        const off = Math.max(0, doc[0] - y - tt);
        const p = clamp(1 - off / Math.max(1, doc[0] - tt));
        const step = (a: number, b: number) => (reduced ? (p >= (a + b) / 2 ? 1 : 0) : mj(seg(p, a, b)));
        const e = step(0.1, 0.9);
        const px = lerp(rest.x, dock.x, e), py = lerp(rest.y, dock.y, e), sc = lerp(rest.s, 1, e), rot = lerp(rest.r, 0, e);
        // With Reduce Motion the note scrolls away as a page does and the window waits in its chapter.
        carrier.style.transform = p >= 1 || (page && reduced) ? "" : `translate3d(${(px - dock.x).toFixed(1)}px, ${(py - dock.y - off).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        const w0 = chs[0];
        // `page`: the window keeps its sidebar (it's under the sheet until the sheet fades); the marks
        // fade only once it's in view, as the app's do; the iPhone comes as it settles.
        const sb = page ? "1" : step(0.42, 0.86).toFixed(3);
        const mk = (1 - (page ? step(0.9, 1) : step(0.3, 0.68))).toFixed(3), ph = (page ? step(0.74, 1) : step(0.7, 1)).toFixed(3);
        if (sheet && sheetIn && paper && !reduced) sheetAt(p, y);
        if (w0.style.getPropertyValue("--sb") !== sb) w0.style.setProperty("--sb", sb);
        if (w0.style.getPropertyValue("--mk") !== mk) w0.style.setProperty("--mk", mk);
        if (w0.style.getPropertyValue("--ph") !== ph) w0.style.setProperty("--ph", ph);
        // The desk's props (the sprig, the pen) are put away as the window becomes the app, so nothing pokes
        // out from under it; the paper stays.
        const hp = step(0.08, 0.4).toFixed(3);
        if (el.style.getPropertyValue("--hp") !== hp) el.style.setProperty("--hp", hp);
        if ((p < 1) !== (el.dataset.carrying !== undefined)) el.toggleAttribute("data-carrying", p < 1);
        if (chat) {
          // It steps away first, down and out, before the sidebar opens.
          const co = step(0.02, 0.3);
          const right = px + dock.w * sc, at = py + (narrowNow() ? 0 : anchorY) * sc;
          // Never past the page's edge: on a narrower window it slides left, still over the pane's margin.
          const cx = Math.min(right + chatAt.dx, innerWidth - chat.offsetWidth - (narrowNow() ? 10 : 24)) + co * 48, cy = at + chatAt.dy + co * 90;
          chat.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) rotate(${lerp(chatAt.r, 0, e).toFixed(2)}deg)`;
          chat.style.opacity = String(1 - co);
          chat.style.visibility = co >= 1 ? "hidden" : "visible";
        }
        if (p !== lastP) { lastP = p; tellCarry(p); }
      }
      if ((y > pastY) !== (el.dataset.past !== undefined)) el.toggleAttribute("data-past", y > pastY);
      const docked: boolean[] = [];
      for (let i = 0; i < chs.length; i++) {
        const nt = doc[i] - y, top = topOf(i);
        const arrive = clamp((vh - nt) / Math.max(1, vh - top));
        docked.push(nt <= top + 0.5);
        // A stay is at least 35% of a screen of scroll, so a phone's snug chapter still plays its show.
        const dwellLen = i + 1 < chs.length ? Math.max(vh * 0.35, mt[i + 1]) : vh * 0.4;
        const dwell = clamp((top - nt) / dwellLen);
        listeners.get(ord[i])?.forEach((fn) => fn(dwell, arrive));
      }
      // A docked chapter's tab rises out of its page (CSS), so a tab never crosses the page under it.
      for (let i = 0; i < chs.length; i++) if (docked[i] !== (chs[i].dataset.docked !== undefined)) chs[i].toggleAttribute("data-docked", docked[i]);
      // The chapter you're in (the front one docked under its tab) raises its tab; the others sit lower.
      let front = -1;
      for (let i = 0; i < chs.length; i++) if (docked[i]) front = TAB[ord[i]] ? i : -1;
      for (let i = 0; i < chs.length; i++) if ((i === front) !== (chs[i].dataset.front !== undefined)) chs[i].toggleAttribute("data-front", i === front);
      // As the next sheet rises, this one's words and things move up ahead of its torn edge (the gap
      // never closes), so a tear never cuts through a line or a card: every chapter has finished, all
      // of it in view, before the next sheet reaches it.
      for (let i = 0; i + 1 < chs.length; i++) {
        const nt = doc[i + 1] - y;
        let lift = 0;
        if (docked[i] && nt < vh) lift = Math.max(0, Math.round(topOf(i) + reach(i) - (nt - 18)));
        if (lift !== lifts[i]) { lifts[i] = lift; chs[i].style.setProperty("--lift", `${lift}px`); chs[i].toggleAttribute("data-lifted", lift > 0); }
        // A headline is never sliced: as a chapter's heading and its line move up to its torn edge,
        // each fades out, whole, as it reaches it (round 24: each on its own, so a heading that goes
        // doesn't take its line, still well clear of the edge, with it). A product picture
        // (`data-fade="pic"`) goes on under the tear instead, and fades once most of it has gone.
        const heads = fades[i];
        if (!heads.length) continue;
        const clipY = topOf(i) + tear;
        heads.forEach((h) => {
          if (!lift) { if (h.style.opacity) h.style.opacity = ""; return; }
          const r = h.getBoundingClientRect();
          let o: string;
          if (h.dataset.fade === "pic") {
            const left = (r.bottom - clipY) / Math.max(1, r.height);
            o = clamp((left - SHOW_TO) / (SHOW_FROM - SHOW_TO)).toFixed(3);
          } else {
            // Over the last FADE px before the clip line. A phone's heading sits just under the tear,
            // with less room than that: it starts fading from full as the lift begins and goes on
            // under the tear's band by up to TUCK_HEAD px as it fades, so it doesn't vanish in the
            // first few pixels of the hand-off.
            const gap = r.top - clipY - 4, room = gap + lift;
            o = clamp(room >= FADE ? gap / FADE : (gap + TUCK_HEAD) / Math.max(1, room + TUCK_HEAD)).toFixed(3);
          }
          if (h.style.opacity !== o) h.style.opacity = o;
        });
      }
      // A chapter under a docked one is filed: its contents aren't painted, and its torn top edge
      // goes, so only the front sheet's edge crosses the tabs behind it (each tab stays whole).
      for (let i = 0; i < chs.length; i++) {
        const behind = i + 1 < chs.length && docked[i + 1];
        if (behind !== (chs[i].dataset.behind !== undefined)) chs[i].toggleAttribute("data-behind", behind);
        const cov = behind && (doc[i + 1] - y) <= topOf(i + 1) - 40;
        if (cov !== covered[i]) { covered[i] = cov; chs[i].toggleAttribute("data-covered", cov); }
        // Once a sheet with no tab has docked under the header, everything under it is put away, tabs
        // and all, so only the page's own cream shows through the gaps in its torn edge.
        let gone = false;
        for (let j = i + 1; j < chs.length; j++) if (!TAB[ord[j]] && docked[j]) { gone = true; break; }
        if (gone !== (chs[i].dataset.gone !== undefined)) chs[i].toggleAttribute("data-gone", gone);
      }
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { measure(); frame(); };
    jump = (tone) => {
      const i = ord.indexOf(tone);
      const stay = i + 1 < chs.length ? Math.max(0, mt[i + 1]) * STAY[tone] : 0;
      scrollTo({ top: Math.max(0, doc[i] - tt + stay + 1), behavior: reduced ? "auto" : "smooth" });
    };
    measure(); frame();
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    if (pane) ro.observe(pane);
    document.fonts?.ready.then(resize);
    return () => {
      removeEventListener("scroll", ask); removeEventListener("resize", resize); ro.disconnect(); cancelAnimationFrame(raf);
      if (header) for (const k of Object.keys(HEADER)) header.style.removeProperty(k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
      chs.forEach((c) => { c.style.marginTop = ""; });
      if (carrier) carrier.style.transform = "";
      delete el.dataset.live; jump = () => {};
    };
  }, [root]);
}

/* ───────────────────────── A chapter (a divider) ───────────────────────── */

function Chapter({ tone, label, className = "", children }: { tone: Tone; label: string; className?: string; children: React.ReactNode }) {
  const i = ORDER.indexOf(tone);
  return (
    <section id={`s-${tone}`} data-ch={tone} className={`${s.ch} ${s[tone]} ${className}`} aria-labelledby={label} style={{ zIndex: i + 2 }}>
      {TAB[tone] && (
        <a data-tab className={s.tab} href={`#s-${tone}`} onClick={(e) => { e.preventDefault(); jump(tone); }} style={{ "--slot": i } as React.CSSProperties}>
          {TAB[tone]}
        </a>
      )}
      <div className={s.paper} aria-hidden="true"><i className={s.rim} /><i className={s.sheetBg} /><i className={s.dots} /></div>
      <div data-body className={s.body}>{children}</div>
    </section>
  );
}

/** A chapter's line: the full sentence on wide screens, a shorter one on a phone (both true). */
const Say = ({ long, short }: { long: string; short: string }) => (
  <p className={s.say} data-fade><span className={s.long}>{long}</span><span className={s.short}>{short}</span></p>
);

/* ───────────────────────── The first screen ───────────────────────── */

const Cta = () => (
  <div className={`${x.ctas} ${s.ctas}`} data-cta>
    <Download note={false} />
    <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
      Get it for iPhone
    </a>
    <a className={x.offMac} href="/download">Download for Mac</a>
    <p className={`${x.fine} ${x.offApple}`} data-off-apple>
      Pinto Notes is for iPhone and Mac.{" "}
      <a href={mailLink(SITE_URL)} onClick={(e) => sendLink(navigator, e, SITE_URL)}>Send myself the link</a>
    </p>
  </div>
);

function Hero({ v = "0" }: { v?: Variant }) {
  // Round 21: a, b and c set the words upright in ink (b's full stop in Pinto orange); a and b lay
  // the chapters' kind of picture in the panel (HeroWin), c keeps today's.
  const win = v === "a" || v === "b";
  return (
    <section data-hero className={s.hero} aria-labelledby="s-h1">
      <div className={s.heroText}>
        {v === "0"
          ? <h1 id="s-h1" className={s.h1}>The notebook for <span className={s.h1You}>you and <span className={s.h1Ai}>your AI.<Underline /></span></span></h1>
          : <h1 id="s-h1" className={`${s.h1} ${hw.h1Up}`}>The notebook for you and your AI<span className={v === "b" ? hw.stop : undefined}>.</span></h1>}
        <p className={s.lede}>Simple notes, whiteboards and apps. ChatGPT and Claude work in all three with you, and can read what you decided.</p>
        <Cta />
        {/* On a phone, the price in a short line under the buttons (the line below is the Mac's). */}
        <p className={s.freeLine}>Free on iPhone and Mac.</p>
        <p className={s.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
      </div>
      {/* The picture: swap HeroArt (and its heroArt.module.css) for another first screen. */}
      <div className={`${s.art} ${win ? hw.art : ""}`}><div className={s.artTop}>{win ? <HeroWin /> : <HeroArt />}</div></div>
    </section>
  );
}

/** Round 26, `carry`: the first screen. The headline, Emil's line, the buttons; on the right the torn
 *  paper of round 23 with its sprig and pen, and on it (laid by the binder) the Notes chapter's own
 *  window with ChatGPT over its corner. hero=2 lays it smaller and turned on a wider sheet (`slot`). */
function CarryHero({ v }: { v: "1" | "2" }) {
  const art = useArt();
  return (
    <section data-hero className={`${s.hero} ${c.hero}`} aria-labelledby="s-h1">
      <div className={`${s.heroText} ${c.heroText}`} data-words>
        <h1 id="s-h1" className={`${s.h1} ${hw.h1Up} ${c.h1}`}>The notebook <br className={c.br} />for you and <br className={c.br} />your AI.</h1>
        <p className={s.lede}>Simple notes, whiteboards and apps. ChatGPT and Claude work in all three with you, and can read what you decided.</p>
        <Cta />
        <p className={s.freeLine}>Free on iPhone and Mac.</p>
        <p className={s.fine}>Free on Mac and iPhone. Works with <span className={s.with}><AIGlyph name="openai" size={15} />ChatGPT</span> and <span className={s.with}><AIGlyph name="claude" size={15} color="#d97757" />Claude</span>.</p>
      </div>
      <div className={`${s.art} ${c.art} ${v === "2" ? c.art2 : ""}`} aria-hidden="true">
        <div className={s.artTop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={ha.pic} src={art.hero} alt="" width={art.heroSide} height={art.heroSide} fetchPriority="high" />
        </div>
      </div>
      {/* Where the window lies in the first screen when it isn't where Notes keeps it (hero=2, phones). */}
      <i data-slot className={`${c.slot} ${v === "2" ? c.slot2 : ""} ${c.slotPhone}`} aria-hidden="true" />
    </section>
  );
}

/** A hand-drawn orange stroke under "your AI", drawn in once on arrival. */
function Underline() {
  const [d, d2] = underline();
  return (
    <svg className={s.uline} viewBox="0 0 564 40" preserveAspectRatio="none" aria-hidden="true">
      <defs><mask id="s-under"><rect className={s.underWipe} x="0" y="-10" width="564" height="60" fill="#fff" /></mask></defs>
      <g mask="url(#s-under)"><path d={d} /><path d={d2} /></g>
    </svg>
  );
}

/* ───────────────────────── Write notes ───────────────────────── */

function Write({ carry, page }: { carry?: boolean; page?: "1" | "2" }) {
  const [live, setLive] = useState(false);
  useEffect(() => listen("write", (_d, p) => { if (p >= 0.92) setLive(true); }), []);
  return (
    <Chapter tone="write" label="s-write-h">
      <div className={s.wBody}>
        <div className={s.wIn}>
          <div className={s.wHead}>
            <h2 id="s-write-h" className={s.wTitle} data-fade>Write <br />notes.</h2>
            <Say long="Keep what you read and what you decide. It feels like Apple Notes, on Mac and iPhone, and brings yours over." short="Keep what you read and what you decide. It feels like Apple Notes, and brings yours over." />
          </div>
          {/* The note on a Mac, and the same note on an iPhone laid over the window's corner. */}
          <div className={s.wDevices} data-fade="pic" data-carrier={carry || undefined}>
            <Note live={live} carry={carry} page={page} />
            <NotePhone />
          </div>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Draw on whiteboards ───────────────────────── */

export type Variant = "0" | "a" | "b" | "c";
/** The whiteboard chapter has one more: d, variant 0's frame holding the real board (part 5). */
export type WbVariant = Variant | "d";

function Draw({ wb = "0" }: { wb?: WbVariant }) {
  // With Reduce Motion or `?t=`, Claude's path is already drawn when the chapter arrives. Otherwise it
  // lands on a clock once the board docks (round 25: on a Mac too, so the board at rest shows it), or
  // sooner if you scroll on.
  const bind = useCallback((set: (k: number) => void) => {
    let d0 = 0, t0 = 0, raf = 0, k = 0;
    const show = (v: number) => { if (v !== k) { k = v; set(v); } };
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const tk = Math.min(1, (now - t0) / 2400);
      show(Math.max(tk, d0));
      raf = tk < 1 ? requestAnimationFrame(tick) : 0;
    };
    const off = listen("draw", (d, p) => {
      if (still() || (calm() && p >= 1)) { show(1); return; }
      d0 = d;
      if (p >= 0.995 && !t0 && !raf) raf = requestAnimationFrame(tick);
      if (!raf) show(Math.max(d, t0 ? 1 : 0));
    });
    return () => { off(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <Chapter tone="draw" label="s-draw-h">
      <div className={s.dBody}>
        <div className={s.dHead}>
          <h2 id="s-draw-h" className={s.dTitle} data-fade>Draw on whiteboards.</h2>
          <Say long="Think a decision through on a board beside your notes. Here Claude drew what happens if you wait." short="Think a decision through. Here Claude drew what happens if you wait." />
        </div>
        {wb === "d" ? <div className={s.dBoard} data-fade="pic" role="img" aria-label="A whiteboard in Pinto Notes, Studio North: now or March? The offer leads to a question, take it now? Yes means starting in January with the launch half done. Claude has drawn the other path, outlined and named as its own: no, finish the launch and ship in February, then talk again in March."><WbCanvas bind={bind} /></div>
          : wb !== "0" ? <WbArt v={wb} bind={bind} /> : <div className={s.dBoard} role="img" aria-label="A whiteboard, Studio North: now or March? The offer leads to a question, take it now? Yes, dashed as the path not taken, means starting in January with the launch half done. The path chosen is finishing the launch, shipping in February, then talking again in March. Claude's cursor draws the last arrow, the no, from the question to the path chosen.">
          {/* The board in Pinto's canvas: a thin frame, the drawing, the dock of tools at its foot. */}
          <div className={s.canvas}>
            <div className={s.canvasArea}>
              <span className={s.wideOnly}><BoardBig bind={bind} /></span>
              <span className={s.tallOnly}><BoardBig tall bind={bind} /></span>
            </div>
            <CanvasChrome />
          </div>
        </div>}
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Build apps ───────────────────────── */

function Build() {
  // Round 23: the habit app inside its note (Habits.tsx), so "a note can be a small app" is visible.
  // Round 25: read in order, request to result (council r19: the app came before its prompt): the words,
  // then ChatGPT with what New App typed into it, laid over the corner of the app it became.
  return (
    <Chapter tone="build" label="s-build-h">
      <div className={s.bBody}>
        <div className={s.bIn}>
          <div className={s.bSide}>
            <div className={s.bHead}>
              <h2 id="s-build-h" className={s.bTitle} data-fade>Build apps.</h2>
              <Say long="A note can be a small app. Describe one, and New App hands it to ChatGPT or Claude, who build it as a new note." short="A note can be a small app. Describe it, and ChatGPT or Claude builds it." />
            </div>
            <div className={s.bAsk} data-fade="pic"><AskChatGpt /></div>
          </div>
          <div className={s.bApp} data-fade="pic"><HabitsNote /></div>
        </div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── Your AI ───────────────────────── */

function Ai({ v = "0", study = false }: { v?: Variant; study?: boolean }) {
  const sub = useCallback(stayOf("ai"), []);
  if (v !== "0") return (
    <Chapter tone="ai" label="s-ai-h">
      <AiAlt v={v} title={<h2 id="s-ai-h" className={s.aTitle} data-fade>Your AI,<br />{" "}in all three.</h2>} study={study} />
    </Chapter>
  );
  return (
    <Chapter tone="ai" label="s-ai-h">
      <AiShow
        subscribe={sub}
        title={<h2 id="s-ai-h" className={s.aTitle} data-fade>Your AI,<br />{" "}in all three.</h2>}
        foot={
          <div className={s.aFoot}>
            <p className={s.works}>Connect <span className={s.with}><AIGlyph name="openai" size={17} color="#fff1e2" />ChatGPT</span>, <span className={s.with}><AIGlyph name="claude" size={17} color="#d97757" />Claude</span>, Claude Code or Codex. Every chat starts knowing your notes.</p>
          </div>
        }
      />
    </Chapter>
  );
}

/* ───────────────────────── Share with people (`?collab=1`) ───────────────────────── */

function Share() {
  // Round 23: behind `?collab=1` only, as collaboration ships in 1.4. The whiteboard chapter's layout:
  // the heading and its line, then one picture (Collab.tsx), only what the app shows.
  return (
    <Chapter tone="share" label="s-share-h">
      <div className={s.dBody}>
        <div className={s.dHead}>
          <h2 id="s-share-h" className={s.dTitle} data-fade>Share with people.</h2>
          <Say long="Share a note and write in it together. Each of you can bring your own AI." short="Write in a note together, each with your own AI." />
        </div>
        <div className={s.shareFig} data-fade="pic"><CollabPicture /></div>
      </div>
    </Chapter>
  );
}

/* ───────────────────────── The cover: the notebook closes ───────────────────────── */

function Cover() {
  // Round 22: `?art=` picks the picture (art.ts); a phone lays the same file as the cover's ::after.
  const art = useArt();
  const vars = { zIndex: 9, "--s-close-art": `url(${art.close})` } as React.CSSProperties;
  return (
    <section id="s-cover" data-ch="cover" className={s.cover} aria-labelledby="s-free-h" style={vars}>
      {/* The close's paper, torn along its top like every sheet above it, with the still life on it. */}
      <div className={s.coverPaper} aria-hidden="true">
        <div className={s.coverSheet}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.coverArt} src={art.close} alt="" width={art.closeW} height={art.closeH} loading="lazy" />
        </div>
      </div>
      {/* Round 25: the study first, compact, then the invitation, so the page ends on "Pinto Notes is
          free.", the downloads and the four lines a careful person checks (council r19). */}
      <div data-body className={s.coverBody}>
        <div className={s.coverStudy}><Study /></div>
        <div className={s.coverText}>
          <h2 id="s-free-h" className={s.fTitle}>Pinto Notes<br />is free.</h2>
          <div className={s.fCtas}><Cta /></div>
          <p className={s.fReq}>Requires macOS 26 or iOS 26.</p>
          <Trust />
        </div>
      </div>
    </section>
  );
}

export function Story({ className, wb = "d", ai = "b", hero = "c", collab = false, carry, close = "1", page }: { className: string; wb?: WbVariant; ai?: Variant; hero?: Variant; collab?: boolean; carry?: "1" | "2"; close?: "0" | "1"; page?: "1" | "2" }) {
  const root = useRef<HTMLDivElement>(null);
  useBinder(root);
  return (
    <div ref={root} className={`${s.stack} ${className}`} data-five={collab || undefined} data-carry={page ? "1" : carry} data-page={page}>
      <span data-probe className={s.probe} aria-hidden="true" />
      {/* Round 25: on a phone, the iPhone download in the header once the first screen's has scrolled away. */}
      <a className={s.getIt} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Get Pinto Notes for iPhone">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
        Get it
      </a>
      {page ? <PageHero v={page} cta={<Cta />} /> : carry ? <CarryHero v={carry} /> : <Hero v={hero} />}
      {carry && !page && <Chat />}
      <Write carry={!!carry || !!page} page={page} />
      <Draw wb={wb} />
      <Build />
      <Ai v={ai} study={close === "1"} />
      {collab && <Share />}
      {close === "1" ? <CloseNote /> : <Cover />}
      {close !== "1" && <div className={s.tail} aria-hidden="true" />}
    </div>
  );
}
