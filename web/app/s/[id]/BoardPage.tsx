"use client";

// A shared whiteboard in the browser, at its link /s/<id>#<secret>: live, read only until you sign
// in with an Edit link, then edited with the people in it, as in the app. Everything between the
// address and the board is lib/board-controller.ts; the drawing board itself is the app's canvas in
// a frame from this site (public/board/canvas.html, lib/board-host.ts). A link to a note that isn't
// a whiteboard (or a broken one) opens as before: Pinto Notes, or how to get it (NoteLink).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoardController } from "@/lib/board-controller";
import type { Comment, Thread } from "@/lib/board-doc";
import { complete, DELETED_TEXT, mentionQuery, mentionRanges, suggestions, when } from "@/lib/board-doc";
import { codeDigits, CODE_LENGTH, looksLikeEmail } from "@/lib/board-auth";
import { followers as followersOf, followersLine, words } from "@/lib/board-follow";
import type { PageState } from "@/lib/board-host";
import { presentHint, presentKey, styleBarShows } from "@/lib/board-present";
import { CommentBar, FIT_ICON, Icon, StyleBar, ToolBar, TOOLS, useDismiss, useWidth, ZoomControl } from "./BoardControls";
import NoteLink, { appLink } from "./NoteLink";
import s from "./board.module.css";

type Props = { id: string; supabaseURL: string; anonKey: string };

export default function BoardPage({ id, supabaseURL, anonKey }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ctl, setCtl] = useState<BoardController | null>(null);
  const [, redraw] = useState(0);

  useEffect(() => {
    const c = new BoardController({ supabaseURL, anonKey, id, secret: window.location.hash.replace(/^#/, ""), storage: safeStorage() });
    c.onChange = () => redraw((n) => n + 1);
    c.attach((command) => frame.current?.contentWindow?.postMessage({ pintoCommand: command }, window.location.origin));
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = (e.data as { pintoCanvas?: unknown })?.pintoCanvas;
      if (m && typeof m === "object") c.fromCanvas(m as Record<string, unknown>);
    };
    window.addEventListener("message", onMessage);
    setCtl(c);
    void c.open();
    return () => { window.removeEventListener("message", onMessage); c.close(); };
  }, [id, supabaseURL, anonKey]);

  if (!ctl) return <div className={s.board} />;
  if (ctl.phase === "note" || ctl.phase === "broken") return <NoteLink id={id} />;
  if (ctl.phase === "gone" || ctl.phase === "offline") return <Unavailable gone={ctl.phase === "gone"} />;

  return (
    <div className={s.board} data-phase={ctl.phase}>
      <iframe ref={frame} className={s.frame} src="/board/canvas.html" title={ctl.title} data-board-frame />
      {ctl.phase === "opening" && <p className={s.opening} role="status">Opening the board</p>}
      {ctl.phase === "board" && <Board ctl={ctl} id={id} focusBoard={() => frame.current?.contentWindow?.focus()} />}
    </div>
  );
}

function safeStorage(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

function Unavailable({ gone }: { gone: boolean }) {
  return (
    <div className={s.board}>
      <div className={s.center}>
        <div className={s.card}>
          <h1 className={s.cardTitle}>{gone ? "This link has expired or was stopped" : "Couldn’t open the board"}</h1>
          <p className={s.lede}>{gone ? "Ask the person who shared the board for a new link." : "Check your connection and try again."}</p>
          {!gone && <button className={s.primary} onClick={() => location.reload()}>Try again</button>}
        </div>
      </div>
    </div>
  );
}

// MARK: The board's chrome

function Board({ ctl, id, focusBoard }: { ctl: BoardController; id: string; focusBoard: () => void }) {
  const [list, setList] = useState(false);
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const width = useWidth(), height = typeof window === "undefined" ? 800 : window.innerHeight;
  const host = ctl.host, state = host?.state ?? {};
  const peers = ctl.session?.boardPeers() ?? [];
  const href = useMemo(() => appLink(id, typeof window === "undefined" ? "" : window.location.hash), [id]);
  // A tool or action from the toolbar, then the board has the keys again (as in the app: R, V, Delete).
  const command = useCallback((c: Record<string, unknown>) => { host?.command(c); focusBoard(); }, [host, focusBoard]);
  const status = ctl.status === "offline" ? "Offline. Trying again" : ctl.accessLine;
  const myColor = ctl.account && ctl.session ? ctl.session.colorOf(ctl.account.id) : "#2D639A";
  const anchor = host?.anchor ?? null;
  const comments = ctl.comments;
  const threadOpen = !!(comments.openThread || comments.draft);
  const presenting = state.present ?? null;
  const meName = ctl.account ? (ctl.account.name ?? ctl.account.email).trim() : "";

  // Presenting: the frame alone, the Present bar at the foot, nothing else (as the app presents).
  if (presenting) return <Presenting ctl={ctl} step={presenting} command={command} />;

  return (
    <>
      <header className={s.top}>
        <div className={s.titleBox}>
          <h1 className={s.title}>{ctl.title}</h1>
          <p className={s.status} role="status">{status ?? (ctl.owner ? `${ctl.owner}’s board` : "Live")}</p>
        </div>
        <div className={s.right}>
          {/* Everyone on the board in one group, gently overlapping, white letters on every colour,
              you last (as the app's toolbar groups them; round 13, web-04: E, Comments, then S). */}
          {(peers.length > 0 || ctl.account) && (
            <ul className={s.people} aria-label="On the board now" data-people>
              {/* A click follows their view, as in the app (board-follow.ts); again stops. */}
              {peers.slice(0, 5).map((p) => {
                const on = host?.follow.following === p.id;
                return (
                  <li key={p.id}>
                    <button className={s.avatar} style={{ background: p.color }} title={on ? `Stop following ${p.name}` : `Follow ${p.name}`} aria-pressed={on}
                      onClick={() => (on ? host?.follow.stop() : host?.follow.follow(p.id))}>{(p.name[0] ?? "?").toUpperCase()}</button>
                  </li>
                );
              })}
              {ctl.account && (
                <li className={s.menuWrap} data-me>
                  <button className={`${s.avatar} ${s.me}`} style={{ background: myColor }} aria-label="Your account" title={`You (${meName})`} aria-expanded={menu} onClick={() => setMenu(!menu)}>
                    {(meName[0] ?? "?").toUpperCase()}
                  </button>
                  {menu && (
                    <div className={s.menu} role="menu">
                      <p className={s.menuLine}>Signed in as {ctl.account.email}</p>
                      {href && <a className={s.menuItem} role="menuitem" href={href}>Open in Pinto Notes</a>}
                      <button className={s.menuItem} role="menuitem" onClick={() => { setMenu(false); void ctl.signOut(); }}>Sign out</button>
                    </div>
                  )}
                </li>
              )}
            </ul>
          )}
          <button className={s.iconButton} aria-label="Comments" title="Comments" aria-pressed={list} onClick={() => { setList(!list); if (!list) comments.markSeen(); }}>
            <Icon>{TOOLS[10].icon}</Icon>
            {comments.unseen && <i className={s.dot} aria-label="New comments" />}
          </button>
          {ctl.offersSignIn && <button className={s.primarySmall} onClick={() => ctl.startSignIn()}>{ctl.signInLabel}</button>}
          {!ctl.offersSignIn && !ctl.account && href && <a className={s.secondarySmall} href={href}>Open in Pinto Notes</a>}
          {ctl.canEdit && <BoardMore open={more} setOpen={setMore} command={command} steps={state.frames?.length ?? 0} />}
        </div>
      </header>

      {ctl.canEdit && <ToolBar state={state} command={command} width={width} />}
      {!ctl.canEdit && ctl.canComment && <CommentBar state={state} command={command} />}
      {/* Never over an open thread: the thread is what you're reading (round 13, web-06). */}
      {styleBarShows(state, ctl.canEdit, threadOpen) && <StyleBar state={state} command={command} width={width} height={height} />}

      <ZoomControl zoom={state.zoom ?? 1} command={command} width={width} overTools={ctl.canEdit} />

      {host && <FollowBanner ctl={ctl} />}
      {threadOpen && <ThreadCard ctl={ctl} anchor={anchor} />}
      {list && <CommentList ctl={ctl} onClose={() => setList(false)} />}
      {ctl.signIn && <SignInSheet ctl={ctl} href={href} />}
      {ctl.notice && <Toast ctl={ctl} />}
    </>
  );
}

/** The board's More menu (people who can edit): Present, and Zoom to Fit. */
function BoardMore({ open, setOpen, command, steps }: { open: boolean; setOpen: (v: boolean) => void; command: (c: Record<string, unknown>) => void; steps: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const down = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", down, true);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("pointerdown", down, true); };
  }, [open, setOpen]);
  return (
    <div ref={wrap} className={s.menuWrap}>
      <button className={s.iconButton} aria-label="More" title="More" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon><path d="M5 11h.01M11 11h.01M17 11h.01" strokeWidth="2.6" /></Icon>
      </button>
      {open && (
        <div className={s.menu} role="menu" aria-label="More">
          <button className={s.menuItem} role="menuitem" data-present onClick={() => { setOpen(false); startPresenting(command); }}>
            <Icon size={18}><path d="M3.5 4.5h15v10h-15zM11 14.5v3M7.5 17.5h7" /><path d="M9.5 7.5v4l3.5-2z" fill="currentColor" /></Icon>
            <span>{PRESENT}</span>
            <span className={s.menuHint}>{presentHint(steps)}</span>
          </button>
          <button className={s.menuItem} role="menuitem" onClick={() => { setOpen(false); command({ op: "action", name: "zoomToFit" }); }}>
            <Icon size={18}>{FIT_ICON}</Icon><span>Zoom to Fit</span>
          </button>
        </div>
      )}
    </div>
  );
}

export const PRESENT = "Present";


/** Present, as the app starts it: the whole window (Full Screen where the browser allows it), the
 *  first frame filling it, the laser picked. Followers in the app and other browsers see it. */
function startPresenting(command: (c: Record<string, unknown>) => void) {
  const el = typeof document === "undefined" ? null : document.documentElement;
  try { void el?.requestFullscreen?.().catch(() => {}); } catch { /* not allowed here: the window will do */ }
  command({ op: "present", to: "start" });
}

function stopPresenting(command: (c: Record<string, unknown>) => void) {
  command({ op: "present", to: "stop" });
  try { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); } catch { /* fine */ }
}

/** Presenting from the browser: everything round the current frame covered in the board's colour,
 *  and the Present bar (back, the frame's name and "2 of 3", next, the laser, Done). The arrow
 *  keys, Space and Page Up/Down step; Escape ends (here and on the board). Leaving Full Screen ends
 *  it too, as Done does. */
function Presenting({ ctl, step, command }: { ctl: BoardController; step: NonNullable<PageState["present"]>; command: (c: Record<string, unknown>) => void }) {
  const state = ctl.host?.state ?? {};
  const laser = state.tool === "laser";
  const followers = followersLine(followers_(ctl));
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const to = presentKey(e.key);
      if (!to) return;
      e.preventDefault();
      if (to === "stop") stopPresenting(command); else command({ op: "present", to });
    };
    const left = () => { if (!document.fullscreenElement && ctl.host?.state.present) command({ op: "present", to: "stop" }); };
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", left);
    return () => { window.removeEventListener("keydown", key); document.removeEventListener("fullscreenchange", left); };
  }, [command, ctl]);
  const bg = String((state as { background?: string }).background ?? "#ffffff");
  return (
    <>
      {step.frame && <PresentMask frame={step.frame} color={bg} />}
      <div className={s.presentBar} role="toolbar" aria-label="Presenting" data-presenting>
        <button className={s.tool} aria-label="Back" title="Back (←)" disabled={step.index === 0} onClick={() => command({ op: "present", to: "prev" })}>
          <Icon><path d="M13.5 5l-6 6 6 6" /></Icon>
        </button>
        <span className={s.presentStep}>
          <b>{step.name}</b>
          <span>{`${step.index + 1} of ${step.count}`}</span>
        </span>
        <button className={s.tool} aria-label="Next" title="Next (→)" disabled={step.index >= step.count - 1} onClick={() => command({ op: "present", to: "next" })}>
          <Icon><path d="M8.5 5l6 6-6 6" /></Icon>
        </button>
        <button className={`${s.tool} ${laser ? s.laserOn : ""}`} aria-label="Laser pointer" title="Laser pointer (K)" aria-pressed={laser}
          onClick={() => command({ op: "tool", tool: laser ? "selection" : "laser" })}>
          <Icon><path d="M11 3v3M11 16v3M3 11h3M16 11h3M5.5 5.5l2 2M14.5 14.5l2 2M16.5 5.5l-2 2M7.5 14.5l-2 2" /></Icon>
        </button>
        {followers && <span className={s.presentFollowers}>{followers}</span>}
        <button className={s.presentDone} onClick={() => stopPresenting(command)}>Done</button>
      </div>
    </>
  );
}

const followers_ = (ctl: BoardController) => {
  const me = ctl.account?.id ?? null;
  return followersOf(me, ctl.host?.follow.people ?? []);
};

/** The rest of the board covered, solid, in its own colour: only the frame shows. Takes no clicks. */
function PresentMask({ frame, color }: { frame: [number, number, number, number]; color: string }) {
  const [x, y, w, h] = frame, pad = 12;
  return (
    <svg className={s.presentMask} aria-hidden="true" data-present-mask>
      <path fillRule="evenodd" fill={color} d={`M-10000 -10000H20000V20000H-10000Z M${x - pad} ${y - pad}h${w + 2 * pad}v${h + 2 * pad}h${-(w + 2 * pad)}Z`} />
    </svg>
  );
}

/** Someone presenting ("Sara is presenting · Follow"), or whom you follow ("Following Sara · Stop
 *  following", with an outline round the board in their colour): board-follow.ts. */
function FollowBanner({ ctl }: { ctl: BoardController }) {
  const follow = ctl.host?.follow;
  const b = follow?.banner;
  useEffect(() => {
    if (b?.kind !== "following") return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") follow?.stop(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [b?.kind, follow]);
  if (!follow || !b) return null;
  return (
    <>
      {b.kind === "following" && <div className={s.followOutline} style={{ borderColor: b.person.color }} aria-hidden="true" />}
      <div className={s.follow} style={{ background: b.person.color }} role="status" data-follow={b.kind}>
        <span data-follow-line>{words(b, (id) => ctl.host?.state.frames?.find((f) => f.id === id)?.name)}</span>
        <button style={{ color: b.person.color }} onClick={() => (b.kind === "following" ? follow.stop() : follow.follow(b.person.id))}>{b.action}</button>
      </div>
    </>
  );
}

function Toast({ ctl }: { ctl: BoardController }) {
  const n = ctl.notice!;
  useEffect(() => {
    const t = setTimeout(() => { if (ctl.notice === n) { ctl.notice = null; ctl.onChange?.(); } }, 4000);
    return () => clearTimeout(t);
  }, [ctl, n]);
  return (
    <div className={s.toast} role="status">
      <span>{n.line}</span>
      {n.undo && <button className={s.toastUndo} onClick={() => { n.undo!(); ctl.notice = null; ctl.onChange?.(); }}>Undo</button>}
    </div>
  );
}

// MARK: Comments

function Avatar({ ctl, c }: { ctl: BoardController; c: Comment }) {
  return <span className={s.avatarSmall} style={{ background: ctl.comments.color(c) }} aria-hidden="true">{((c.ai ?? c.name).trim()[0] ?? "?").toUpperCase()}</span>;
}

/** A comment's words, with each mention of someone on the board set apart. */
function Words({ ctl, c }: { ctl: BoardController; c: Comment }) {
  if (c.deleted) return <p className={s.deleted}>{DELETED_TEXT}</p>;
  const names = ctl.comments.names(c.mentions);
  const ranges = names.flatMap((n) => mentionRanges(n, c.text)).sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const [a, b] of ranges) {
    if (a < at) continue;
    parts.push(c.text.slice(at, a), <b key={a} className={s.mention}>{c.text.slice(a, b)}</b>);
    at = b;
  }
  parts.push(c.text.slice(at));
  return <p className={s.words}>{parts}</p>;
}

function Composer({ ctl, placeholder, initial = "", button, onSend, onCancel, autoFocus }: {
  ctl: BoardController; placeholder: string; initial?: string; button: string; onSend: (text: string) => void; onCancel?: () => void; autoFocus?: boolean;
}) {
  const [text, setText] = useState(initial);
  const [pick, setPick] = useState(0);
  const area = useRef<HTMLTextAreaElement>(null);
  const q = mentionQuery(text);
  const people = q ? suggestions(q.query, ctl.comments.mentionable).slice(0, 5) : [];
  useEffect(() => { if (autoFocus) area.current?.focus(); }, [autoFocus]);
  const send = () => { if (text.trim()) { onSend(text); setText(""); } };
  return (
    <div className={s.composer}>
      {people.length > 0 && (
        <ul className={s.suggest} role="listbox" aria-label="Mention">
          {people.map((p, i) => (
            <li key={p.id}><button role="option" aria-selected={i === pick} className={s.suggestItem} onMouseDown={(e) => { e.preventDefault(); setText(complete(text, p)); area.current?.focus(); }}>@{p.name}</button></li>
          ))}
        </ul>
      )}
      <textarea ref={area} className={s.input} rows={2} placeholder={placeholder} value={text} aria-label={placeholder}
        onChange={(e) => { setText(e.target.value); setPick(0); }}
        onKeyDown={(e) => {
          if (people.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setPick((pick + (e.key === "ArrowDown" ? 1 : people.length - 1)) % people.length); return; }
          if (people.length && (e.key === "Enter" || e.key === "Tab")) { e.preventDefault(); setText(complete(text, people[pick])); return; }
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          if (e.key === "Escape") onCancel?.();
        }} />
      <div className={s.composerActions}>
        {onCancel && <button className={s.quiet} onClick={onCancel}>Cancel</button>}
        <button className={s.post} disabled={!text.trim()} onClick={send}>{button}</button>
      </div>
    </div>
  );
}

function OneComment({ ctl, c }: { ctl: BoardController; c: Comment }) {
  const [editing, setEditing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenu(false), []);
  useDismiss(menu, closeMenu, wrap);
  const mine = ctl.comments.isMine(c) && !c.deleted && ctl.comments.canComment;
  return (
    <li className={s.comment} data-comment={c.id}>
      <Avatar ctl={ctl} c={c} />
      <div className={s.commentBody}>
        <div className={s.commentHead}>
          <p className={s.byline}><b>{ctl.comments.byline(c)}</b> <span className={s.when}>{when(c)}{c.edited && !c.deleted ? " · Edited" : ""}</span></p>
          {/* Edit and Delete on your own comment, in a ⋯ menu, as the app has them (round 14, web-06). */}
          {mine && !editing && !asking && (
            <div ref={wrap} className={s.menuWrap}>
              <button className={s.commentMore} aria-label="More" title="Edit or delete" aria-haspopup="menu" aria-expanded={menu} data-comment-more onClick={() => setMenu(!menu)}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
              </button>
              {menu && (
                <div className={s.commentMenu} role="menu" aria-label="Comment">
                  <button role="menuitem" className={s.menuItem} onClick={() => { setMenu(false); setEditing(true); }}>Edit</button>
                  <button role="menuitem" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => { setMenu(false); setAsking(true); }}>Delete…</button>
                </div>
              )}
            </div>
          )}
        </div>
        {editing
          ? <Composer ctl={ctl} placeholder="Comment" initial={c.text} button="Save" autoFocus onCancel={() => setEditing(false)} onSend={(t) => { ctl.comments.edit(c.id, t); setEditing(false); }} />
          : <Words ctl={ctl} c={c} />}
        {asking && (
          <div className={s.ask} role="alertdialog" aria-label="Delete this comment?">
            <p>Delete this comment?</p>
            <button className={s.quiet} onClick={() => setAsking(false)}>Cancel</button>
            <button className={s.danger} onClick={() => { setAsking(false); ctl.comments.delete(c.id); }}>Delete</button>
          </div>
        )}
      </div>
    </li>
  );
}

function ThreadCard({ ctl, anchor }: { ctl: BoardController; anchor: { x: number; y: number; width: number; height: number } | null }) {
  const comments = ctl.comments;
  const thread = comments.threads.find((t) => t.first.id === comments.openThread) ?? null;
  const card = useRef<HTMLDivElement>(null);
  // Next to the pin, inside the window; at phone width, a sheet at the bottom.
  const style: React.CSSProperties = {};
  if (anchor && typeof window !== "undefined" && window.innerWidth > 600) {
    const w = 340, left = anchor.x + anchor.width + 12 + w > window.innerWidth - 12 ? anchor.x - w - 12 : anchor.x + anchor.width + 12;
    style.left = Math.max(12, left);
    style.top = Math.min(Math.max(72, anchor.y - 8), window.innerHeight - 260);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") comments.closeThread(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [comments]);
  return (
    <div ref={card} className={s.thread} style={style} role="dialog" aria-label={thread ? "Comment" : "New Comment"} data-anchored={!!anchor}>
      <div className={s.threadHead}>
        <p className={s.threadPlace}>{thread ? comments.place(thread) : "New Comment"}</p>
        {thread && comments.canComment && (
          <button className={s.link} onClick={() => comments.resolve(thread.first.id, !thread.first.resolved)}>{thread.first.resolved ? "Open Again" : "Resolve"}</button>
        )}
        <button className={s.close} aria-label="Close" onClick={() => comments.closeThread()}>×</button>
      </div>
      {thread && (
        <ul className={s.comments}>
          {[thread.first, ...thread.replies].map((c) => <OneComment key={c.id} ctl={ctl} c={c} />)}
        </ul>
      )}
      {comments.canComment && (thread
        ? <Composer key={`r-${thread.first.id}`} ctl={ctl} placeholder="Reply" button="Post" onSend={(t) => comments.reply(thread.first.id, t)} />
        : <Composer key="draft" ctl={ctl} placeholder="Add a comment" button="Post" autoFocus onCancel={() => comments.closeThread()} onSend={(t) => comments.post(t)} />)}
    </div>
  );
}

function CommentList({ ctl, onClose }: { ctl: BoardController; onClose: () => void }) {
  const [resolved, setResolved] = useState(false);
  const comments = ctl.comments;
  const latest = (t: Thread) => t.replies[t.replies.length - 1]?.created ?? t.first.created;
  const list = comments.threads.filter((t) => resolved || !t.first.resolved).sort((a, b) => latest(b).localeCompare(latest(a)));
  return (
    <aside className={s.list} aria-label="Comments">
      <div className={s.listHead}>
        <h2 className={s.listTitle}>Comments</h2>
        <label className={s.toggle}><input type="checkbox" checked={resolved} onChange={(e) => setResolved(e.target.checked)} /> Show resolved</label>
        <button className={s.close} aria-label="Close" onClick={onClose}>×</button>
      </div>
      {comments.canComment && (
        <button className={s.secondaryWide} onClick={() => { onClose(); ctl.host?.command({ op: "tool", tool: "comment" }); }}>New Comment</button>
      )}
      {list.length === 0
        ? <p className={s.empty}>{comments.threads.length ? "No comments on this board" : "No comments yet"}</p>
        : (
          <ul className={s.rows}>
            {list.map((t) => (
              <li key={t.first.id}>
                <button className={s.row} onClick={() => { comments.open(t.first.id); ctl.host?.command({ op: "focusComment", id: t.first.id }); if (window.innerWidth <= 600) onClose(); }}>
                  <Avatar ctl={ctl} c={t.first} />
                  <span className={s.rowText}>
                    <span className={s.byline}><b>{comments.byline(t.first)}</b> <span className={s.when}>{when(t.first)} · {comments.place(t)}</span></span>
                    <span className={s.rowWords}>{t.first.deleted ? DELETED_TEXT : t.first.text}</span>
                    <span className={s.rowFoot}>
                      {t.replies.length > 0 && <span>{t.replies.length === 1 ? "1 reply" : `${t.replies.length} replies`}</span>}
                      {t.first.resolved && <span>Resolved</span>}
                      {comments.unreadMention(t) && <span className={s.mentionsYou}>Mentions you</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
    </aside>
  );
}

// MARK: Signing in

function SignInSheet({ ctl, href }: { ctl: BoardController; href: string | null }) {
  const st = ctl.signIn!;
  const [email, setEmail] = useState(st.email);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => { field.current?.focus(); }, [st.step]);
  const close = st.step !== "joining" || !!st.error;
  return (
    <div className={s.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget && close) ctl.cancelSignIn(); }}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="sign-in-title">
        {st.step === "email" && (
          <form className={s.form} onSubmit={(e) => { e.preventDefault(); if (looksLikeEmail(email)) void ctl.sendCode(email); }}>
            <h2 id="sign-in-title" className={s.cardTitle}>{ctl.signInLabel}</h2>
            <p className={s.lede}>We’ll email you a code. New to Pinto Notes? The same code makes your account.</p>
            <label className={s.label} htmlFor="board-email">Email</label>
            <input ref={field} id="board-email" className={s.field} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!st.error} />
            {st.error && <p className={s.error} role="alert">{st.error}</p>}
            <div className={s.actions}>
              <button type="button" className={s.quiet} onClick={() => ctl.cancelSignIn()}>Cancel</button>
              <button type="submit" className={s.primary} disabled={st.busy || !looksLikeEmail(email)}>{st.busy ? "Sending" : "Send code"}</button>
            </div>
          </form>
        )}
        {st.step === "code" && (
          <form className={s.form} onSubmit={(e) => { e.preventDefault(); if (codeDigits(code).length === CODE_LENGTH) void ctl.verify(codeDigits(code)); }}>
            <h2 id="sign-in-title" className={s.cardTitle}>Check your email</h2>
            <p className={s.lede}>Enter the {CODE_LENGTH}-digit code we sent to <b>{st.email}</b>.</p>
            <label className={s.label} htmlFor="board-code">Code</label>
            <input ref={field} id="board-code" className={s.field} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(codeDigits(e.target.value))} aria-invalid={!!st.error} />
            {st.error && <p className={s.error} role="alert">{st.error}</p>}
            <div className={s.actions}>
              <button type="button" className={s.quiet} onClick={() => void ctl.sendCode(st.email)}>Send a new code</button>
              <button type="submit" className={s.primary} disabled={st.busy || codeDigits(code).length !== CODE_LENGTH}>{st.busy ? "Signing in" : "Sign in"}</button>
            </div>
          </form>
        )}
        {st.step === "name" && (
          <form className={s.form} onSubmit={(e) => { e.preventDefault(); if (name.trim()) void ctl.setName(name); }}>
            <h2 id="sign-in-title" className={s.cardTitle}>Your name</h2>
            <p className={s.lede}>The people on this board see it next to your pointer and your comments.</p>
            <label className={s.label} htmlFor="board-name">Name</label>
            <input ref={field} id="board-name" className={s.field} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            {st.error && <p className={s.error} role="alert">{st.error}</p>}
            <div className={s.actions}>
              <button type="submit" className={s.primary} disabled={st.busy || !name.trim()}>Continue</button>
            </div>
          </form>
        )}
        {st.step === "joining" && (
          <div className={s.form}>
            <h2 id="sign-in-title" className={s.cardTitle}>{st.error ? "Couldn’t join the board" : "Joining the board"}</h2>
            {st.error ? <p className={s.lede}>{st.error}</p> : <p className={s.lede} role="status"><i className={s.spinner} aria-hidden="true" /> Opening your keys in this browser</p>}
            {st.error && (
              <div className={s.actions}>
                <button className={s.quiet} onClick={() => { ctl.signIn = null; ctl.onChange?.(); }}>Close</button>
                {st.app && href ? <a className={s.primary} href={href}>Open in Pinto Notes</a> : <button className={s.primary} onClick={() => void ctl.join()}>Try again</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
