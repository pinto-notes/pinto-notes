"use client";

import { useEffect, useRef } from "react";
import f from "./film.module.css";

// Round 27, slug `film` (2026-11-17): the first screen's picture is a recording, not a drawing.
//
// What the footage is (cut by ~/content-tools/projects/pinto-home-big3/film/encode.sh):
// - `tall` and `crop`: Pinto Notes on iPhone, recorded in the simulator on 2026-11-11 (the X reply
//   project). Three lines and a heading land in "AI models I'm trying", take the app's tint, and the
//   app's bar rises: "Claude changed 4 lines". The rendering, the tint and the bar are the real app's;
//   the lines were written by the app's capture hook (Pane/App/Capture.swift, -aiEdit), not by a live
//   Claude. `tall` is the whole screen (the Mac's first screen), `crop` is "Heard about" down (a phone's).
// - `chat`: ChatGPT, recorded 2026-10-13 with the real Pinto Notes app connected
//   (web/public/demo/pinto-notes-chatgpt.mp4): "In my Lisbon note, check off "Tram 28 early"." and its
//   answer. The take is held states joined by hard cuts; the loop keeps two of them.
// No recording on disk has both halves in one take, so they are never shown side by side as cause and effect.
//
// Each loop starts on its last state (the landed edit, the answer), and that frame is also the picture
// under the video, so the first paint is already the proof and the video starting changes nothing. A loop
// loads and plays only once it's on screen (a hidden one, for the other width, never loads), and never
// with Reduce Motion or `?t=`: then the picture is the end state.

export type Clip = "tall" | "crop" | "chat";
const SIZE: Record<Clip, [number, number]> = { tall: [720, 1566], crop: [716, 670], chat: [860, 612] };
const src = (c: Clip, ext: string) => `/lab/film/${c}.${ext}`;

export function Film({ clip, label, className = "" }: { clip: Clip; label: string; className?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = v.current, b = box.current; if (!el || !b) return;
    if (new URLSearchParams(location.search).has("t")) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    let seen = false;
    const go = () => {
      if (!seen || calm.matches) { el.pause(); return; }
      el.play().then(() => b.toggleAttribute("data-playing", true)).catch(() => {});
    };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }, { threshold: 0.02 });
    io.observe(b);
    const onCalm = () => { if (calm.matches) b.removeAttribute("data-playing"); go(); };
    calm.addEventListener("change", onCalm);
    return () => { io.disconnect(); calm.removeEventListener("change", onCalm); };
  }, []);
  const [w, h] = SIZE[clip];
  return (
    <div ref={box} className={`${f.film} ${className}`} role="img" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={f.still} src={src(clip, "webp")} alt="" width={w} height={h} fetchPriority="high" decoding="async" />
      <video ref={v} className={f.video} muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1}>
        <source src={src(clip, "mp4")} type="video/mp4" />
        <source src={src(clip, "webm")} type="video/webm" />
      </video>
    </div>
  );
}
