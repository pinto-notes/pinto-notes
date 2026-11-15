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

const TOOLS: { tool: string; label: string; key: string; icon: React.ReactNode }[] = [
  { tool: "selection", label: "Select", key: "V", icon: <path d="M5 3.5l11.5 6.2-5 1.4-2.3 4.9z" /> },
  { tool: "hand", label: "Hand", key: "H", icon: <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4.5a1.5 1.5 0 0 1 3 0V10m0-3.5a1.5 1.5 0 0 1 3 0V13a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 5 14.6L3.6 12a1.4 1.4 0 0 1 2.3-1.5L8 13" /> },
  { tool: "rectangle", label: "Rectangle", key: "R", icon: <rect x="3.5" y="5" width="15" height="12" rx="2" /> },
  { tool: "diamond", label: "Diamond", key: "D", icon: <path d="M11 3l8 8-8 8-8-8z" /> },
  { tool: "ellipse", label: "Oval", key: "O", icon: <ellipse cx="11" cy="11" rx="8" ry="6.5" /> },
  { tool: "arrow", label: "Arrow", key: "A", icon: <path d="M4 18L18 4m0 0h-8m8 0v8" /> },
  { tool: "line", label: "Line", key: "L", icon: <path d="M4 18L18 4" /> },
  { tool: "freedraw", label: "Draw", key: "P", icon: <path d="M3.5 16c2-3 4-4.5 5.5-3.5s.5 3.5 2.5 3.5 3-5 5-7 2.5-1 2.5-1" /> },
  { tool: "text", label: "Text", key: "T", icon: <path d="M5 5.5h12M11 5.5v12" /> },
  { tool: "eraser", label: "Eraser", key: "E", icon: <path d="M8.5 18.5h10M4.6 13.4l7.8-7.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 17a2 2 0 0 1-1.4.6H8.3a2 2 0 0 1-1.4-.6l-2.3-2.3a1 1 0 0 1 0-1.3z" /> },
  { tool: "comment", label: "Comment", key: "C", icon: <path d="M4.5 4.5h13a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V15.5h-1A1.5 1.5 0 0 1 3 14V6a1.5 1.5 0 0 1 1.5-1.5z" /> },
];

const Icon = ({ children, size = 22 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function Board({ ctl, id, focusBoard }: { ctl: BoardController; id: string; focusBoard: () => void }) {
  const [list, setList] = useState(false);
  const [menu, setMenu] = useState(false);
  const host = ctl.host, state = host?.state ?? {};
  const peers = ctl.session?.boardPeers() ?? [];
  const href = useMemo(() => appLink(id, typeof window === "undefined" ? "" : window.location.hash), [id]);
  // A tool or action from the toolbar, then the board has the keys again (as in the app: R, V, Delete).
  const command = useCallback((c: Record<string, unknown>) => { host?.command(c); focusBoard(); }, [host, focusBoard]);
  const status = ctl.status === "offline" ? "Offline. Trying again" : ctl.canEdit ? null : ctl.linkRole === "editor" ? "View only until you sign in" : "Can view";
  const myColor = ctl.account && ctl.session ? ctl.session.colorOf(ctl.account.id) : "#2D639A";
  const anchor = host?.anchor ?? null;
  const comments = ctl.comments;
  const threadOpen = !!(comments.openThread || comments.draft);

  return (
    <>
      <header className={s.top}>
        <div className={s.titleBox}>
          <h1 className={s.title}>{ctl.title}</h1>
          <p className={s.status} role="status">{status ?? (ctl.owner ? `${ctl.owner}’s board` : "Live")}</p>
        </div>
        <div className={s.right}>
          {peers.length > 0 && (
            <ul className={s.people} aria-label="On the board now">
              {peers.slice(0, 5).map((p) => <li key={p.id} className={s.avatar} style={{ background: p.color }} title={p.name}>{(p.name[0] ?? "?").toUpperCase()}</li>)}
            </ul>
          )}
          <button className={s.iconButton} aria-label="Comments" title="Comments" aria-pressed={list} onClick={() => { setList(!list); if (!list) comments.markSeen(); }}>
            <Icon>{TOOLS[10].icon}</Icon>
            {comments.unseen && <i className={s.dot} aria-label="New comments" />}
          </button>
          {ctl.offersSignIn && <button className={s.primarySmall} onClick={() => ctl.startSignIn()}>Sign in to edit</button>}
          {!ctl.offersSignIn && !ctl.account && href && <a className={s.secondarySmall} href={href}>Open in Pinto Notes</a>}
          {ctl.account && (
            <div className={s.menuWrap}>
              <button className={s.me} style={{ background: myColor }} aria-label="Your account" aria-expanded={menu} onClick={() => setMenu(!menu)}>
                {((ctl.account.name ?? ctl.account.email).trim()[0] ?? "?").toUpperCase()}
              </button>
              {menu && (
                <div className={s.menu} role="menu">
                  <p className={s.menuLine}>Signed in as {ctl.account.email}</p>
                  {href && <a className={s.menuItem} role="menuitem" href={href}>Open in Pinto Notes</a>}
                  <button className={s.menuItem} role="menuitem" onClick={() => { setMenu(false); void ctl.signOut(); }}>Sign out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {ctl.canEdit && (
        <nav className={s.tools} aria-label="Tools">
          {TOOLS.map((t) => (
            <button key={t.tool} className={s.tool} aria-label={`${t.label} (${t.key})`} title={`${t.label} (${t.key})`} aria-pressed={state.tool === t.tool}
              onClick={() => command({ op: "tool", tool: t.tool })}>
              <Icon>{t.icon}</Icon>
            </button>
          ))}
          <span className={s.gap} />
          <button className={s.tool} aria-label="Undo" title="Undo" disabled={!state.canUndo} onClick={() => command({ op: "action", name: "undo" })}><Icon><path d="M8 5L4 9l4 4M4 9h9a5 5 0 0 1 0 10h-3" /></Icon></button>
          <button className={s.tool} aria-label="Redo" title="Redo" disabled={!state.canRedo} onClick={() => command({ op: "action", name: "redo" })}><Icon><path d="M14 5l4 4-4 4m4-4H9a5 5 0 0 0 0 10h3" /></Icon></button>
        </nav>
      )}

      <div className={s.zoom}>
        <button className={s.zoomButton} aria-label="Zoom out" onClick={() => command({ op: "action", name: "zoomOut" })}>−</button>
        <button className={s.zoomValue} aria-label="Zoom to fit" title="Zoom to fit" onClick={() => command({ op: "action", name: "zoomToFit" })}>{Math.round((state.zoom ?? 1) * 100)}%</button>
        <button className={s.zoomButton} aria-label="Zoom in" onClick={() => command({ op: "action", name: "zoomIn" })}>+</button>
      </div>

      {threadOpen && <ThreadCard ctl={ctl} anchor={anchor} />}
      {list && <CommentList ctl={ctl} onClose={() => setList(false)} />}
      {ctl.signIn && <SignInSheet ctl={ctl} href={href} />}
      {ctl.notice && <Toast ctl={ctl} />}
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
  const mine = ctl.comments.isMine(c) && !c.deleted && ctl.comments.canComment;
  return (
    <li className={s.comment} data-comment={c.id}>
      <Avatar ctl={ctl} c={c} />
      <div className={s.commentBody}>
        <p className={s.byline}><b>{ctl.comments.byline(c)}</b> <span className={s.when}>{when(c)}{c.edited && !c.deleted ? " · Edited" : ""}</span></p>
        {editing
          ? <Composer ctl={ctl} placeholder="Comment" initial={c.text} button="Save" autoFocus onCancel={() => setEditing(false)} onSend={(t) => { ctl.comments.edit(c.id, t); setEditing(false); }} />
          : <Words ctl={ctl} c={c} />}
        {mine && !editing && !asking && (
          <p className={s.commentActions}>
            <button className={s.link} onClick={() => setEditing(true)}>Edit</button>
            <button className={s.link} onClick={() => setAsking(true)}>Delete…</button>
          </p>
        )}
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
            <h2 id="sign-in-title" className={s.cardTitle}>Sign in to edit</h2>
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
