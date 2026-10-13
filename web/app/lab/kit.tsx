// The design studies' parts: the app's own surfaces drawn in HTML so they follow light and dark (a
// note as Pinto Notes shows it on iPhone and Mac, an AI chat, a terminal). Shapes, type and colours
// are measured from the app's captures in public/blog and public/demo. Server components: no motion.

import { AIGlyph } from "@/lib/ai-glyphs";
import DownloadLink from "../DownloadLink";
import PlatformNote from "../PlatformNote";
import k from "./kit.module.css";

export type Who = "you" | "chatgpt" | "claude" | "claude-code" | "codex";
export const WHO: Record<Who, { name: string; short: string; glyph: "openai" | "claude" | null }> = {
  you: { name: "You", short: "You", glyph: null },
  chatgpt: { name: "ChatGPT", short: "ChatGPT", glyph: "openai" },
  claude: { name: "Claude", short: "Claude", glyph: "claude" },
  "claude-code": { name: "Claude Code", short: "Claude Code", glyph: "claude" },
  codex: { name: "Codex", short: "Codex", glyph: "openai" },
};

/// The app's mark for who did something: the AI's glyph, or your initial in a plain circle.
export function WhoMark({ who, size = 16 }: { who: Who; size?: number }) {
  const g = WHO[who].glyph;
  if (g) return <span className={k.whoMark} data-who={who} style={{ width: size + 8, height: size + 8 }}><AIGlyph name={g} size={size} /></span>;
  return <span className={k.whoMark} data-who="you" style={{ width: size + 8, height: size + 8 }} aria-hidden="true"><Pencil size={size} /></span>;
}

export type Line =
  | { k: "p"; text: string; tint?: boolean; by?: Who; quiet?: boolean }
  | { k: "h"; text: string; tint?: boolean; by?: Who }
  | { k: "todo" | "done"; text: string; tint?: boolean; by?: Who }
  | { k: "bullet"; text: string; tint?: boolean; by?: Who };

/// A note's body, as the app draws it: 17 pt text, round checklist circles, amber ticks, and the
/// app's tint (a pale amber band with a bar on its left edge) on the lines an AI just changed.
/// With `gutter`, each line's author sits in the margin to its left.
export function NoteBody({ lines, gutter = false, size = "m", bySize = 12 }: { lines: Line[]; gutter?: boolean; size?: "s" | "m" | "l"; bySize?: number }) {
  return (
    <div className={k.body} data-size={size} data-gutter={gutter || undefined}>
      {lines.map((l, i) => {
        const prev = lines[i - 1];
        const showBy = gutter && l.by && (!prev || prev.by !== l.by);
        return (
          <div key={i} className={k.line} data-k={l.k} data-tint={l.tint || undefined} data-first-tint={(l.tint && !prev?.tint) || undefined}
            data-last-tint={(l.tint && !lines[i + 1]?.tint) || undefined} data-quiet={("quiet" in l && l.quiet) || undefined} data-by-start={showBy || undefined}>
            {gutter && <span className={k.by}>{showBy && l.by ? <><WhoMark who={l.by} size={bySize} /><span className={k.byName}>{WHO[l.by].short}</span></> : null}</span>}
            {(l.k === "todo" || l.k === "done") && <span className={k.circle} data-done={l.k === "done" || undefined} aria-hidden="true">{l.k === "done" && <Tick />}</span>}
            {l.k === "bullet" && <span className={k.dash} aria-hidden="true">–</span>}
            <span className={k.text}>{l.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/// The receipt the app shows after an AI changes a note: who, how much, and Undo.
export function Receipt({ who, text }: { who: Who; text: string }) {
  return (
    <span className={k.receipt}>
      {WHO[who].glyph && <AIGlyph name={WHO[who].glyph!} size={15} />}
      <span>{text}</span><i aria-hidden="true" /><b>Undo</b>
    </span>
  );
}

/// An iPhone, drawn: the bezel, the Dynamic Island and the status bar. The screen is the children.
export function Phone({ children, label, className = "", width }: { children: React.ReactNode; label: string; className?: string; width?: string }) {
  return (
    <figure className={`${k.phone} ${className}`} aria-label={label} style={width ? ({ "--pw": width } as React.CSSProperties) : undefined}>
      <div className={k.screen}>
        <div className={k.status} aria-hidden="true"><span>9:41</span><i className={k.island} /><span className={k.bars}><b /><b /><b /><b /></span></div>
        {children}
      </div>
    </figure>
  );
}

/// A note open on iPhone: back and More buttons, the large title, the note, the toolbar.
export function PhoneNote({ title, lines, receipt }: { title: string; lines: Line[]; receipt?: { who: Who; text: string } }) {
  return (
    <div className={k.pNote}>
      <div className={k.pNav} aria-hidden="true"><span className={k.round}><Chevron /></span><span className={k.round}><Dots /></span></div>
      <h3 className={k.pTitle}>{title}</h3>
      <NoteBody lines={lines} size="s" />
      {receipt && <div className={k.pReceipt}><Receipt {...receipt} /></div>}
      <div className={k.pTools} aria-hidden="true"><span className={k.toolGroup}><ListIcon /><TableIcon /><ClipIcon /></span><span className={k.round}><ComposeIcon /></span></div>
    </div>
  );
}

/// A note on iPhone whose body is something else (a note app).
export function PhoneCustom({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={k.pNote}>
      <div className={k.pNav} aria-hidden="true"><span className={k.round}><Chevron /></span><span className={k.round}><Dots /></span></div>
      <h3 className={k.pTitle}>{title}</h3>
      {children}
    </div>
  );
}

/// A plain sheet of the app's paper (its colours, light or dark), for a note drawn without a window.
export function Paper({ children, className = "", label }: { children: React.ReactNode; className?: string; label?: string }) {
  return <figure className={`${k.mac} ${k.sheet} ${className}`} aria-label={label}>{children}</figure>;
}

/// The note list on iPhone, as Apple Notes lays it out: a large title, then notes grouped by day.
export function PhoneList({ groups }: { groups: { day: string; notes: { title: string; when: string; preview: string; tint?: boolean }[] }[] }) {
  return (
    <div className={k.pList}>
      <div className={k.pNav} aria-hidden="true"><span className={k.round}><Chevron /></span><span className={k.round}><Dots /></span></div>
      <h3 className={k.pTitle}>Notes</h3>
      {groups.map((g) => (
        <div key={g.day} className={k.pGroup}>
          <p className={k.pDay}>{g.day}</p>
          <ul className={k.pRows}>
            {g.notes.map((n) => (
              <li key={n.title} data-tint={n.tint || undefined}><b>{n.title}</b><span><em>{n.when}</em> {n.preview}</span></li>
            ))}
          </ul>
        </div>
      ))}
      <div className={k.pTools} aria-hidden="true"><span className={k.search}><SearchIcon /> Search</span><span className={k.round}><ComposeIcon /></span></div>
    </div>
  );
}

/// A note in a Mac window: traffic lights, the folder, the date, the title, the note.
/// With `bigBy`, the margin's names are set larger, and on a phone each name sits above its run.
export function MacNote({ title, folder, date, lines, gutter, bigBy, receipt, className = "", label }: {
  title: string; folder: string; date: string; lines: Line[]; gutter?: boolean; bigBy?: boolean; receipt?: { who: Who; text: string }; className?: string; label: string;
}) {
  return (
    <figure className={`${k.mac} ${className}`} aria-label={label} data-gutter={gutter || undefined} data-big-by={bigBy || undefined}>
      <div className={k.macBar} aria-hidden="true"><span className={k.lights}><i /><i /><i /></span><span className={k.macFolder}><FolderIcon />{folder}</span></div>
      <div className={k.macPaper}>
        <p className={k.macDate}>{date}</p>
        <h3 className={k.macTitle}>{title}</h3>
        <NoteBody lines={lines} gutter={gutter} bySize={bigBy ? 15 : 12} />
        {receipt && <div className={k.macReceipt}><Receipt {...receipt} /></div>}
      </div>
    </figure>
  );
}

export type Turn = { me?: string; tool?: string; ai?: string };

/// An AI chat: ChatGPT or Claude, on a phone or in a window. Your messages right, the AI's left, the
/// tool it used in small grey type above its answer.
export function Chat({ app, turns, frame = "window", className = "", label }: { app: "chatgpt" | "claude"; turns: Turn[]; frame?: "window" | "bare"; className?: string; label: string }) {
  return (
    <figure className={`${k.chat} ${className}`} data-app={app} data-frame={frame} aria-label={label}>
      {frame === "window" && (
        <div className={k.chatBar} aria-hidden="true"><span className={k.lights}><i /><i /><i /></span><span className={k.chatTitle}><AIGlyph name={app === "chatgpt" ? "openai" : "claude"} size={14} />{app === "chatgpt" ? "ChatGPT" : "Claude"}</span></div>
      )}
      {frame === "bare" && (
        <div className={k.chatTop} aria-hidden="true"><span className={k.chatTitle}>{app === "chatgpt" ? "ChatGPT" : "Claude"}</span></div>
      )}
      <div className={k.msgs}>
        {turns.map((t, i) => (
          <div key={i} className={k.turn}>
            {t.me && <p className={k.me}>{t.me}</p>}
            {t.tool && <p className={k.tool}>{t.tool}</p>}
            {t.ai && <p className={k.ai}>{t.ai}</p>}
          </div>
        ))}
      </div>
      <div className={k.input} aria-hidden="true"><b>+</b><em>{app === "chatgpt" ? "Ask anything" : "Reply to Claude…"}</em><span className={k.send}>↑</span></div>
    </figure>
  );
}

/// A terminal running Claude Code or Codex: the prompt, the Pinto Notes tool it called, what it said.
export function Term({ app, ask, call, out, className = "", label }: { app: "claude-code" | "codex"; ask: string; call: string; out: string[]; className?: string; label: string }) {
  return (
    <figure className={`${k.term} ${className}`} aria-label={label}>
      <div className={k.termBar} aria-hidden="true"><span className={k.lights}><i /><i /><i /></span><span>{app === "codex" ? "codex" : "claude"}</span></div>
      <div className={k.termBody}>
        <p className={k.prompt}><span>›</span>{ask}</p>
        <p className={k.call}><span>⏺</span> {call}</p>
        {out.map((o, i) => <p key={i} className={k.out}>{o}</p>)}
      </div>
    </figure>
  );
}

/// A note that holds an app: a habit tracker the AI built, ticked day by day.
export function HabitApp({ days, rows, compact = false }: { days: string[]; rows: { name: string; done: boolean[] }[]; compact?: boolean }) {
  return (
    <div className={k.habit} data-compact={compact || undefined} role="img" aria-label={`A habit tracker: ${rows.map((r) => `${r.name}, ${r.done.filter(Boolean).length} of ${days.length} days`).join("; ")}.`}>
      <div className={k.habitRow} aria-hidden="true"><span />{days.map((d, i) => <b key={i}>{d}</b>)}<span className={k.habitStreak}>Streak</span></div>
      {rows.map((r) => {
        let streak = 0; for (let i = r.done.length - 1; i >= 0 && r.done[i]; i--) streak++;
        return (
          <div key={r.name} className={k.habitRow} aria-hidden="true">
            <span className={k.habitName}>{r.name}</span>
            {r.done.map((d, i) => <i key={i} data-on={d || undefined}>{d && <Tick />}</i>)}
            <span className={k.habitStreak}>{streak}</span>
          </div>
        );
      })}
    </div>
  );
}

/// The page's one download button, and the line a visitor on Windows or Android sees instead.
export function Download({ className = "", quiet }: { className?: string; quiet?: React.ReactNode }) {
  return (
    <div className={`${k.cta} ${className}`}>
      <div className="pi-apple pi-not-ios"><DownloadLink className={k.primary}><Apple /> Download for Mac</DownloadLink></div>
      {quiet && <p className={`${k.ctaQuiet} pi-apple pi-not-ios`}>{quiet}</p>}
      <PlatformNote place="hero" />
    </div>
  );
}

const Pencil = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 2.5 3 3L6 13l-3.5.5L3 10Z" /></svg>;
export const Tick = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>;
const Chevron = () => <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2 2 10l8 8" /></svg>;
const Dots = () => <svg width="20" height="6" viewBox="0 0 20 6" fill="currentColor"><circle cx="3" cy="3" r="2.2" /><circle cx="10" cy="3" r="2.2" /><circle cx="17" cy="3" r="2.2" /></svg>;
const ListIcon = () => <svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="3.5" cy="4" r="2.5" /><circle cx="3.5" cy="14" r="2.5" /><path d="M9 4h12M9 14h12" /></svg>;
const TableIcon = () => <svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="20" height="16" rx="3" /><path d="M1 7h20M1 12h20M8 7v10M14 7v10" /></svg>;
const ClipIcon = () => <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m16 9-7 7a4.5 4.5 0 0 1-6.4-6.4l7.4-7.4a3 3 0 0 1 4.2 4.2L6.8 13.8a1.5 1.5 0 0 1-2.1-2.1L11 5.4" /></svg>;
const ComposeIcon = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" /><path d="m15.5 2.5 2 2L10 12l-3 1 1-3Z" /></svg>;
const SearchIcon = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5" /><path d="m11 11 3.5 3.5" /></svg>;
export const FolderIcon = () => <svg width="15" height="12" viewBox="0 0 17 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M1.5 3.5a1.5 1.5 0 0 1 1.5-1.5h3.2l1.5 1.6H14a1.5 1.5 0 0 1 1.5 1.5v6.4A1.5 1.5 0 0 1 14 13H3a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>;
export const Apple = () => <svg width="14" height="17" viewBox="0 0 15 18" aria-hidden="true" fill="currentColor"><path d="M12.3 9.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8C3.2 4.6 1.8 5.4 1 6.8c-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.3-.9-2.3-3.8zM10.1 3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z" /></svg>;
