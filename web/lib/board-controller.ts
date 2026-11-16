// A shared whiteboard's link, opened in a browser (app/s/[id]/BoardPage.tsx): everything between
// the address and the board, with no React in it.
//
// 1. The link: its secret (in the address's fragment, never sent) gives the answer the server
//    checks and the key the board's note key (NK) is sealed under (collab.ts linkKeys). The server
//    hands back the sealed NK, the note, its role (Can edit, Can comment or Can view) and the board's title,
//    sealed; all of it opens here.
// 2. The board, live: its document from the server, opened with NK. Someone who isn't signed in
//    (or can only view) reads it through the link and follows it every 2 seconds.
// 3. Sign in to edit or to comment (an Edit or a Comment link): an email code, with an account made
//    for a new email. Someone who can comment sees the board as a viewer does, with no drawing
//    tools, and writes only comments (their own stream on the server, board-session.ts). Then
//    joining, as the app joins (board-keys.ts): the account's key, its sharing key, NK sealed to it,
//    collab_join_link. From then on the board is read and written as a member, on the note's live
//    channel, with pointers both ways.
// 4. Someone already in the board (signed in here before) goes straight to 3's end.
import { BoardComments, Seen } from "./board-comments";
import { darkOf, firstName, type Person } from "./board-doc";
import { BoardHost } from "./board-host";
import { forgetIdentities, identityWith, joinWithLink, KeyBook, keepIdentity, keptIdentity, keyRefusalText, memberKey, withDataKey } from "./board-keys";
import { isLinkGone, Rest } from "./board-rest";
import { BoardSession, type Member, type Status } from "./board-session";
import { linkTransport, memberTransport, realtimeFor } from "./board-transport";
import { loadAutomerge } from "./automerge";
import { codeError, forgetSession, loadSession, saveSession, sessionFrom, signUpCodeRequest, type StoredSession, verifyError, verifyRequest } from "./board-auth";
import { linkKeys, open3 } from "./collab";
import { type Bytes, fromBase64, open } from "./e2ee";

export type Phase = "opening" | "board" | "note" | "gone" | "broken" | "offline";
export type SignInStep = "email" | "code" | "name" | "joining";

export type Config = {
  supabaseURL: string;
  anonKey: string;
  id: string;
  /** The fragment, without the #. */
  secret: string;
  storage?: Storage | null;
  fetch?: typeof fetch;
  wasm?: string | Uint8Array;
  /** Where the frame's canvas gets its commands. */
  send?: (command: Record<string, unknown>) => void;
};

const SECRET = /^[A-Za-z0-9_-]{22}$/;
const fromB64url = (s: string) => fromBase64(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));

type OpenedLink = { note_id: string; role: string; epoch: number; key_wrap: string; owner_name: string | null; head_ct: string | null };

export class BoardController {
  phase: Phase = "opening";
  title = "Whiteboard";
  owner: string | null = null;
  /** The link's role: "editor" (Can edit) or "viewer". */
  linkRole = "viewer";
  /** Your role in the board once you're in it ("owner", "editor", "viewer"), or null. */
  role: string | null = null;
  status: Status = "loading";
  /** Signed in: who. */
  account: { id: string; email: string; name: string | null } | null = null;
  signIn: { step: SignInStep; email: string; error: string | null; busy: boolean; app?: boolean } | null = null;
  /** A line for a moment, with an undo when it can be undone. */
  notice: { line: string; undo?: () => void; at: number } | null = null;
  members: Member[] = [];

  host: BoardHost | null = null;
  session: BoardSession | null = null;
  readonly comments: BoardComments;

  /** Anything changed: the page draws again. */
  onChange: (() => void) | null = null;

  private rest: Rest;
  private link: { id: string; answer: string } | null = null;
  private nk: Bytes | null = null;
  private note = "";
  private epoch = 0;
  private A: Awaited<ReturnType<typeof loadAutomerge>> | null = null;
  private readonly f: typeof fetch;
  private readonly storage: Storage | null;
  private send: (command: Record<string, unknown>) => void;
  private closed = false;

  constructor(private readonly cfg: Config) {
    this.f = cfg.fetch ?? ((...a) => fetch(...a));
    this.storage = cfg.storage ?? null;
    this.send = cfg.send ?? (() => {});
    const stored = loadSession(this.storage);
    this.rest = this.restFor(stored);
    if (stored) this.account = { id: stored.user_id.toLowerCase(), email: stored.email, name: null };
    this.comments = new BoardComments(cfg.id, new Seen(this.storage));
    this.comments.onConfirm = (line, undo) => this.say(line, undo);
  }

  private restFor(s: StoredSession | null) {
    return new Rest(this.cfg.supabaseURL, this.cfg.anonKey, s, (next) => {
      if (next) saveSession(this.storage, next);
      else { forgetSession(this.storage); this.account = null; this.changed(); }
    }, this.f);
  }

  private changed() { if (!this.closed) this.onChange?.(); }

  say(line: string, undo?: () => void) { this.notice = { line, undo, at: Date.now() }; this.changed(); }

  /** The frame's canvas is there: its commands go to it. */
  attach(send: (command: Record<string, unknown>) => void) { this.send = send; }

  /** A message from the frame's canvas. Its first state can come before the board is open: kept
   *  for the host, which then sends the page everything. */
  fromCanvas(m: Record<string, unknown>) {
    if (this.host) { this.host.message(m); return; }
    if (typeof m?.load === "string") this.pageLoad = m;
  }
  private pageLoad: Record<string, unknown> | null = null;

  get canEdit() { return this.role === "owner" || this.role === "editor"; }
  /** You can comment: Can comment, or you can edit. */
  get canComment() { return this.canEdit || this.role === "commenter"; }
  /** Whether "Sign in to edit" (an Edit link) or "Sign in to comment" (a Comment link) is offered:
   *  you can't do what the link gives yet. */
  get offersSignIn() {
    if (this.phase !== "board") return false;
    if (this.linkRole === "editor") return !this.canEdit;
    return this.linkRole === "commenter" && !this.canComment;
  }
  /** "Sign in to edit" or "Sign in to comment", as the link gives. */
  get signInLabel() { return this.linkRole === "commenter" ? "Sign in to comment" : "Sign in to edit"; }
  /** What you can do here, under the title; null for someone who can edit. */
  get accessLine(): string | null {
    if (this.canEdit) return null;
    if (this.canComment) return "Can comment";
    return this.linkRole === "editor" || this.linkRole === "commenter" ? "View only until you sign in" : "Can view";
  }
  /** What you can now do, said when you join. */
  private get joinedLine() { return this.canEdit ? "You can edit this board" : this.canComment ? "You can comment on this board" : "You joined this board"; }

  // MARK: Opening

  async open(): Promise<void> {
    if (!SECRET.test(this.cfg.secret) || !/^[A-Za-z0-9_-]{22}$/.test(this.cfg.id)) { this.phase = "broken"; this.changed(); return; }
    let opened: OpenedLink;
    try {
      const lk = await linkKeys(fromB64url(this.cfg.secret), this.cfg.id);
      this.link = { id: this.cfg.id, answer: lk.answer };
      const anon = new Rest(this.cfg.supabaseURL, this.cfg.anonKey, null, () => {}, this.f);
      const rows = await anon.rpc<OpenedLink[]>("collab_open_link", { p_link: this.cfg.id, p_answer: lk.answer });
      if (!rows?.[0]) throw new Error("That link has expired or was stopped.");
      opened = rows[0];
      this.nk = fromBase64(await open(opened.key_wrap, lk.key, `invite:${this.cfg.id.toLowerCase()}`));
    } catch (e) {
      this.phase = isLinkGone(e) || /expired or was stopped|wrong key/.test(String((e as Error)?.message)) ? "gone" : "offline";
      this.changed();
      return;
    }
    this.note = opened.note_id.toLowerCase();
    this.epoch = Number(opened.epoch);
    this.linkRole = opened.role;
    this.owner = opened.owner_name ? firstName(opened.owner_name) : null;
    if (opened.head_ct) {
      try {
        const head = JSON.parse(new TextDecoder().decode(await open3("h", opened.head_ct, this.nk, this.note))) as { title?: unknown };
        if (typeof head.title === "string" && head.title.trim()) this.title = head.title.trim();
      } catch { /* the title stays "Whiteboard" */ }
    }
    this.A = await loadAutomerge(this.cfg.wasm);
    // Signed in here before and in the board already: straight in as a member.
    if (this.account && await this.tryMember()) return;
    await this.startViewer();
  }

  private async startViewer() {
    const session = this.newSession(linkTransport(new Rest(this.cfg.supabaseURL, this.cfg.anonKey, null, () => {}, this.f), this.link!.id, this.link!.answer), null, "Someone", null);
    await this.begin(session);
  }

  private newSession(transport: ConstructorParameters<typeof BoardSession>[0]["transport"], me: string | null, name: string, role: string | null) {
    const canWrite = role === "owner" || role === "editor";
    const session = new BoardSession({ A: this.A!, note: this.note, epoch: this.epoch, nk: this.nk!, transport, me, name, canWrite, role, canComment: canWrite || role === "commenter" });
    session.onCommentsRefused = (why) => this.say(why);
    return session;
  }

  private async begin(session: BoardSession) {
    const was = this.session;
    session.onStatus = (s) => { this.status = s; if (s === "gone" && !this.role) this.phase = "gone"; this.changed(); };
    session.onMembers = (m) => this.membersChanged(m);
    session.onKeyChanged = () => void this.keyChanged();
    session.hidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";
    await session.start();
    if (this.closed) { session.close(); return; }
    // The first pull says what it is: a note that isn't a whiteboard opens in the app.
    // An empty one is a board on its way (just shared): it shows as it arrives.
    if (!session.isBoard && !session.isEmpty && session.status === "live") { session.close(); this.phase = "note"; this.changed(); return; }
    this.session = session;
    this.status = session.status;
    was?.close();
    if (this.host) this.host.swap(session, !session.canWrite); else this.makeHost(session);
    this.comments.show(session.comments);
    if (this.phase === "opening") this.phase = "board";
    this.changed();
  }

  private makeHost(session: BoardSession) {
    this.host = new BoardHost((c) => this.send(c), session, this.comments, !session.canWrite);
    this.host.onNotice = (line) => this.say(line);
    this.host.onState = () => this.changed();
    this.host.onAnchor = () => this.changed();
    this.host.onPeople = () => this.changed();
    this.host.follow.onChange = () => this.changed();
    this.comments.show(session.comments);
    if (this.pageLoad) { this.host.message(this.pageLoad); this.pageLoad = null; }
  }

  private membersChanged(members: Member[]) {
    this.members = members;
    const me = this.account?.id;
    this.comments.mentionable = members.filter((m) => m.user_id.toLowerCase() !== me && m.accepted !== false)
      // Account ids as the app writes them in comments (upper case: UUID.uuidString).
      .map((m): Person => ({ id: m.user_id.toUpperCase(), name: firstName(m.display_name) }))
      .filter((p) => p.name !== "You");
    this.comments.colorOf = (u) => this.session?.colorOf(u) ?? "#2D639A";
    const mine = members.find((m) => m.user_id.toLowerCase() === me);
    if (mine && this.role && mine.role !== this.role) {
      // The owner changed what you can do: Can view now, or Can edit again.
      this.role = mine.role;
      this.comments.setCanComment(this.canComment);
      this.host?.setViewOnly(!this.canEdit);
      if (this.session) {
        this.session.canWrite = this.canEdit;
        this.session.canComment = this.canComment;
        this.session.role = mine.role;
      }
    }
    this.changed();
  }

  /** The board's key changed (someone was removed): a member opens the new one, as the app does. */
  private async keyChanged() {
    if (!this.account || !this.role) { this.phase = "gone"; this.changed(); return; }
    try {
      const identity = await keptIdentity(this.account.id);
      if (!identity) throw new Error("no identity");
      const k = await memberKey(this.rest, this.note, this.account.id, identity, new KeyBook(this.storage, this.account.id));
      if (!k) { this.role = null; this.say("You’re no longer in this board."); await this.startViewer(); return; }
      this.nk = k.nk; this.epoch = k.epoch;
      this.session?.rekey(k.nk, k.epoch);
    } catch (e) {
      this.say((e as Error)?.message?.includes("sharing key changed") ? (e as Error).message : "This board’s key changed. Open the link again to keep editing.");
    }
  }

  /** Whether this account is in the board: then it opens as a member. */
  private async tryMember(): Promise<boolean> {
    if (!this.account) return false;
    let rows: { role: string }[];
    try {
      rows = await this.rest.get<{ role: string }[]>(`note_members?select=role&note_id=eq.${this.note}&user_id=eq.${this.account.id}`);
    } catch {
      return false;
    }
    if (!this.rest.signedIn) return false;
    if (!rows[0]) return false;
    await this.becomeMember(rows[0].role);
    return true;
  }

  private async becomeMember(role: string) {
    const me = this.account!;
    me.name = me.name ?? await this.rest.name().catch(() => null);
    const transport = memberTransport(this.rest, this.note, realtimeFor(this.cfg.supabaseURL, this.cfg.anonKey));
    const session = this.newSession(transport, me.id, me.name ?? "Someone", role);
    this.comments.author = { id: me.id.toUpperCase(), name: firstName(me.name) };
    this.comments.colorOf = (u) => session.colorOf(u);
    this.comments.darkOf = (c) => darkOf(c);
    await this.begin(session);
    // Only now, with the canvas told it can draw: the tools show, and a tool picked then stays picked
    // (the canvas sets the selection tool when it leaves view mode).
    this.role = role;
    this.comments.setCanComment(this.canComment);
    this.changed();
    void session.refreshMembers();
  }

  // MARK: Signing in and joining

  startSignIn() {
    if (this.account) { void this.join(); return; }
    this.signIn = { step: "email", email: "", error: null, busy: false };
    this.changed();
  }

  cancelSignIn() { if (this.signIn?.step !== "joining") { this.signIn = null; this.changed(); } }

  async sendCode(email: string): Promise<void> {
    if (!this.signIn) return;
    this.signIn = { ...this.signIn, email: email.trim(), busy: true, error: null };
    this.changed();
    try {
      const [url, init] = signUpCodeRequest(this.cfg.supabaseURL, this.cfg.anonKey, email);
      const res = await this.f(url, init);
      if (!res.ok) { this.signIn = { ...this.signIn, busy: false, error: codeError(res.status, await res.json().catch(() => null)) }; this.changed(); return; }
      this.signIn = { step: "code", email: email.trim(), busy: false, error: null };
    } catch {
      this.signIn = { ...this.signIn, busy: false, error: "Couldn’t send a code. Check your connection and try again." };
    }
    this.changed();
  }

  async verify(code: string): Promise<void> {
    if (!this.signIn) return;
    const email = this.signIn.email;
    this.signIn = { ...this.signIn, busy: true, error: null };
    this.changed();
    let s: StoredSession | null = null;
    try {
      const [url, init] = verifyRequest(this.cfg.supabaseURL, this.cfg.anonKey, email, code);
      const res = await this.f(url, init);
      const body = await res.json().catch(() => null);
      if (res.ok) s = sessionFrom(body, email);
      if (!s) { this.signIn = { ...this.signIn, busy: false, error: verifyError(res.status, body) }; this.changed(); return; }
    } catch {
      this.signIn = { ...this.signIn, busy: false, error: "Couldn’t sign in. Check your connection and try again." };
      this.changed();
      return;
    }
    saveSession(this.storage, s);
    this.rest = this.restFor(s);
    this.account = { id: s.user_id.toLowerCase(), email: s.email, name: await this.rest.name().catch(() => null) };
    // Someone new to Pinto Notes: their name, for the people on the board.
    if (!this.account.name) { this.signIn = { step: "name", email, busy: false, error: null }; this.changed(); return; }
    await this.join();
  }

  async setName(name: string): Promise<void> {
    const n = name.trim().slice(0, 80);
    if (!n || !this.account) return;
    this.signIn = { ...(this.signIn ?? { email: this.account.email, error: null }), step: "name", busy: true, error: null };
    this.changed();
    try {
      await this.rest.setName(n);
      this.account.name = n;
    } catch {
      this.signIn = { ...this.signIn!, busy: false, error: "Couldn’t save your name. Try again." };
      this.changed();
      return;
    }
    await this.join();
  }

  /** Joins the board with the link (as the app does), then edits it as a member. */
  async join(): Promise<void> {
    if (!this.account || !this.link || !this.nk) return;
    const me = this.account;
    this.signIn = { step: "joining", email: me.email, busy: true, error: null };
    this.changed();
    // In it already (another device joined): no keys needed here to start.
    if (await this.tryMember()) { this.signIn = null; this.say(this.joinedLine); return; }
    const token = this.rest.accessToken;
    if (!token) { this.signIn = { step: "email", email: me.email, busy: false, error: null }; this.changed(); return; }
    const nk = this.nk, note = this.note, epoch = this.epoch, link = this.link;
    const out = await withDataKey(this.cfg.supabaseURL, token, me.id, async (dk) => {
      const identity = await identityWith(this.rest, dk, me.id);
      await joinWithLink(this.rest, link, nk, note, epoch, identity, me.id, dk);
      await keepIdentity(me.id, identity);
      return true;
    }, this.f).catch((e: unknown) => ({ why: isLinkGone(e) ? "gone" : "error", message: String((e as Error)?.message ?? "") }));
    if ("why" in out) {
      if (out.why === "gone") { this.signIn = null; this.phase = "gone"; this.changed(); return; }
      const r = keyRefusalText(out.why);
      if (r.signIn) { this.signIn = { step: "email", email: me.email, busy: false, error: r.text }; this.changed(); return; }
      this.signIn = { step: "joining", email: me.email, busy: false, error: r.text, app: r.app };
      this.changed();
      return;
    }
    await this.becomeMember(this.linkRole);
    this.session?.announceMembers();
    this.signIn = null;
    this.say(this.joinedLine);
  }

  async signOut(): Promise<void> {
    forgetSession(this.storage);
    await forgetIdentities();
    this.account = null;
    this.role = null;
    this.rest = this.restFor(null);
    this.comments.setCanComment(false);
    this.comments.author = { id: "", name: "You" };
    await this.startViewer();
    this.say("Signed out");
  }

  close() { this.closed = true; this.session?.close(); }
}
