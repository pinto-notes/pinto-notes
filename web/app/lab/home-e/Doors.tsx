"use client";

import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { publishingFlow } from "./rough";
import e from "./e.module.css";

// Study E, three doors: the first screen is the headline and a triptych. Maya's note at dusk, Jonas's
// whiteboard at night, Sara's app in the morning, each with the real piece of Pinto on it. Point at a
// door (or tap it) and it opens wide while the others narrow, with its one line.

const DOORS = [
  {
    key: "notes", title: "Notes", line: "Feels like Apple Notes, on Mac and iPhone. Your Apple Notes come along.",
    src: "/home-v5/frontier/maya-paper.webp",
    alt: "A cut-paper scene of San Francisco at dusk, a woman on the path in Dolores Park with her phone.",
  },
  {
    key: "whiteboards", title: "Whiteboards", line: "Draw how something works. Your AI can read it and draw into it.",
    src: "/home-v5/frontier/jonas-lisbon.webp",
    alt: "A cut-paper scene of a man at his desk late at night, a laptop glowing, Lisbon's rooftops through tall open windows.",
  },
  {
    key: "apps", title: "Apps", line: "A note that works like a small app. Pick a template, or ask your AI to make one.",
    src: "/home-v5/frontier/sara-cafe.webp",
    alt: "A cut-paper scene of a woman in a café by the water in Stockholm in the morning, looking at her phone.",
  },
] as const;

const FLOW = publishingFlow();

/// Frozen (?t=, Reduce Motion): everything at rest, drawn. ?open=0..2 opens a door, for screenshots.
function useStill() {
  const [still, setStill] = useState(false);
  const [first, setFirst] = useState<number | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("t") !== null || matchMedia("(prefers-reduced-motion: reduce)").matches) setStill(true);
    const o = q.get("open");
    if (o !== null && /^[0-2]$/.test(o)) setFirst(Number(o));
  }, []);
  return { still, first };
}

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function Doors() {
  const { still, first } = useStill();
  const [open, setOpen] = useState<number | null>(null);
  // The whiteboard draws itself again each time its door opens.
  const [drawn, setDrawn] = useState(0);
  useEffect(() => { if (first !== null) setOpen(first); }, [first]);
  const show = (i: number | null) => {
    if (i === 1 && open !== 1 && !still) setDrawn((n) => n + 1);
    setOpen(i);
  };
  const hover = typeof window !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches;

  return (
    <section className={e.hero} data-still={still ? "" : undefined}>
      <div className={e.head}>
        <h1 className={`${e.h1} rise`} style={rise(0)}>The notebook <span className={e.mark}>you and your AI</span> share.</h1>
        <div className={`${e.side} rise`} style={rise(1)}>
          <p className={e.lede}>Write notes, draw on whiteboards and make small apps. ChatGPT and Claude work in all three, with your OK.</p>
          <div className={x.ctas}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
            <p className={`${x.fine} ${x.offApple}`} data-off-apple>
              Pinto Notes is for iPhone and Mac.{" "}
              <a href={mailLink(SITE_URL)} onClick={(ev) => sendLink(navigator, ev, SITE_URL)}>Send myself the link</a>
            </p>
          </div>
        </div>
      </div>

      <div className={`${e.doors} rise`} style={rise(2)} data-open={open ?? undefined} onMouseLeave={() => hover && show(null)}>
        {DOORS.map((d, i) => (
          <div key={d.key} className={e.door} data-door={d.key} data-on={open === i ? "" : undefined}
            onMouseEnter={() => hover && show(i)}>
            <img className={e.art} src={d.src} alt={d.alt} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
            <div className={e.piece} aria-hidden="true">
              {i === 0 && <Note />}
              {i === 1 && <Whiteboard key={drawn} />}
              {i === 2 && <Habits />}
            </div>
            <div className={e.label}>
              <h2 className={e.title}>{d.title}</h2>
              <p className={e.line}>{d.line}</p>
            </div>
            <button type="button" className={e.hit} aria-expanded={open === i} aria-label={`${d.title}: ${d.line}`}
              onClick={() => show(i)} onFocus={() => show(i)}>
              <span className={e.plus} aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" /></svg></span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

const Chip = ({ ai, name }: { ai: "openai" | "claude"; name: string }) => <em className={e.chip}><AIGlyph name={ai} size={9} />{name}</em>;

/// Maya's Tomorrow note on her phone, as the iPhone app draws it.
function Note() {
  const rows: [string, boolean, boolean][] = [
    ["Pick up the dry cleaning", true, false],
    ["Run before work, 5 km", false, true],
    ["Call the dentist", false, true],
    ["Book Lisbon flights", false, true],
  ];
  return (
    <div className={e.note}>
      <p className={e.nBack}>‹ My notebook</p>
      <p className={e.nTitle}>Tomorrow</p>
      <p className={e.nDate}>Today at 21:40</p>
      <ul className={e.nList}>
        {rows.map(([t, done, ai], k) => (
          <li key={t} style={{ "--k": k } as React.CSSProperties} data-ai={ai ? "" : undefined}>
            <i data-on={done ? "" : undefined} />{t}{ai && <Chip ai="openai" name="ChatGPT" />}
          </li>
        ))}
      </ul>
      <p className={e.nPara}>Long run on Saturday, 12 km.</p>
    </div>
  );
}

/// Jonas's whiteboard in the Mac app, drawing itself stroke by stroke.
function Whiteboard() {
  let n = 0;
  return (
    <div className={e.board}>
      <div className={e.bBar}><span className={e.lights}><i /><i /><i /></span><span className={e.bBack}>‹</span><b>Publishing flow</b></div>
      <svg className={e.bInk} viewBox="0 0 572 268" role="presentation">
        {FLOW.map((s, k) => {
          const at = n; n += s.strokes.length;
          return (
            <g key={k}>
              {s.fill && <path className={e.fill} d={s.fill.d} fill={s.fill.color} style={{ "--s": at + 1 } as React.CSSProperties} />}
              {s.strokes.map((d, j) => <path key={j} className={e.stroke} d={d} pathLength={1} style={{ "--s": at + j * 0.7 } as React.CSSProperties} />)}
              {s.label && <text className={e.ink} x={s.label.x} y={s.label.y} style={{ "--s": at + 0.8 } as React.CSSProperties}>{s.label.text}</text>}
            </g>
          );
        })}
        {/* Claude Code drew the last box: its cursor, as a collaborator's shows on a whiteboard. */}
        <g className={e.cursor} style={{ "--s": n } as React.CSSProperties} transform="translate(436 244)">
          <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill="#d97757" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="14" y="14" width="80" height="20" rx="6" fill="#d97757" />
          <text x="54" y="24.5" className={e.cursorName}>Claude Code</text>
        </g>
      </svg>
    </div>
  );
}

/// Sara's habit tracker, the Today screen of the template app on iPhone.
function Habits() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const rows: [string, string, boolean, boolean][] = [
    ["Morning walk", "5 days in a row", true, false],
    ["Read 20 pages", "4 of 7 this week", true, false],
    ["Gym", "Logged by Claude", true, true],
    ["No phone after 22", "3 of 7 this week", false, false],
  ];
  return (
    <div className={e.app}>
      <p className={e.aTop}><b>Habit tracker</b><span>App</span></p>
      <p className={e.aTitle}>Today</p>
      <div className={e.aWeek}>{week.map((w, k) => <span key={k} data-on={k < 4 ? "" : undefined} data-now={k === 3 ? "" : undefined}><small>{w}</small><i /></span>)}</div>
      <ul className={e.aList}>
        {rows.map(([t, sub, done, ai], k) => (
          <li key={t} style={{ "--k": k } as React.CSSProperties} data-ai={ai ? "" : undefined}>
            <span><b>{t}</b><small>{ai ? <><AIGlyph name="claude" size={9} color="#d97757" /> {sub}</> : sub}</small></span>
            <i data-on={done ? "" : undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>
          </li>
        ))}
      </ul>
      <div className={e.aTabs}><span data-on="">Today</span><span>Month</span><span>Habits</span></div>
    </div>
  );
}
