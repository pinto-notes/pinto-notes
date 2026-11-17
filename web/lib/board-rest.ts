// The server, as the whiteboard page talks to it: Supabase's REST API (PostgREST) with plain fetch,
// as the connect page does (no client library), and its Realtime for a member's live channel.
//
// - Not signed in: the link's own calls (collab_open_link, collab_link_pull, collab_link_file),
//   which prove the link with its answer and read only (20261117130000_collab_link_read.sql).
// - Signed in: the account's session (kept in this browser like the connect page's, SESSION_KEY),
//   refreshed when the server says it's old, for what a member does in the app's transport
//   (Pane/Collab/SupabaseCollabTransport.swift): read and add changes, snapshots and pictures.
import { refreshRequest, sessionFrom, type StoredSession } from "./connect-browser";

export class RestError extends Error {
  constructor(readonly status: number, message: string, readonly hint: string | null, readonly code: string | null) { super(message); }
}

type Body = { message?: unknown; hint?: unknown; code?: unknown; msg?: unknown } | null;

async function failure(res: Response): Promise<RestError> {
  const body = await res.json().catch(() => null) as Body;
  const message = typeof body?.message === "string" ? body.message : typeof body?.msg === "string" ? body.msg : `HTTP ${res.status}`;
  return new RestError(res.status, message, typeof body?.hint === "string" ? body.hint : null, typeof body?.code === "string" ? body.code : null);
}

/** Whether a failure is the link stopped, changed or expired (collab_open_link's refusal). */
export const isLinkGone = (e: unknown) => e instanceof RestError && (e.code === "P0002" || /expired or was stopped/.test(e.message));
/** Whether a failure is the network, not the server saying no. */
export const isOffline = (e: unknown) => !(e instanceof RestError) || e.status >= 500 || e.status === 0;

export class Rest {
  constructor(readonly base: string, readonly anonKey: string, private session: StoredSession | null = null,
    private readonly saved: (s: StoredSession | null) => void = () => {}, private readonly f: typeof fetch = (...a) => fetch(...a)) {
    this.base = base.replace(/\/+$/, "");
  }

  get signedIn() { return !!this.session; }
  get user() { return this.session?.user_id ?? null; }
  get email() { return this.session?.email ?? null; }
  get accessToken() { return this.session?.access_token ?? null; }
  /** Told when the session changes (refreshed), for Realtime. */
  onToken: ((token: string) => void) | null = null;

  use(session: StoredSession | null) { this.session = session; this.saved(session); if (session) this.onToken?.(session.access_token); }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { apikey: this.anonKey, authorization: `Bearer ${this.session?.access_token || this.anonKey}`, ...extra };
  }

  /** The session made fresh with its refresh token; false when the server refused it (signed out). */
  async refresh(): Promise<boolean> {
    if (!this.session) return false;
    const [url, init] = refreshRequest(this.base, this.anonKey, this.session.refresh_token);
    const res = await this.f(url, init);
    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 403) this.use(null);
      return false;
    }
    const s = sessionFrom(await res.json().catch(() => null), this.session.email);
    if (!s) return false;
    this.use(s);
    return true;
  }

  private async send(path: string, init: RequestInit & { headers?: Record<string, string> }, again = true): Promise<Response> {
    const res = await this.f(`${this.base}/rest/v1/${path}`, { ...init, cache: "no-store", headers: this.headers(init.headers ?? {}) });
    // An access token lasts an hour: refreshed once, and asked again.
    if (res.status === 401 && again && this.session && await this.refresh()) return await this.send(path, init, false);
    if (!res.ok) throw await failure(res);
    return res;
  }

  async get<T>(path: string): Promise<T> {
    return await (await this.send(path, { method: "GET" })).json() as T;
  }

  async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const res = await this.send(`rpc/${name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(args) });
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  async insert<T>(table: string, row: Record<string, unknown>, select?: string): Promise<T | null> {
    const res = await this.send(`${table}${select ? `?select=${select}` : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json", prefer: select ? "return=representation" : "return=minimal", ...(select ? { accept: "application/vnd.pgrst.object+json" } : {}) },
      body: JSON.stringify(row),
    });
    return select ? await res.json() as T : null;
  }

  /** Your name, as others see it on the board (profiles.display_name). */
  async setName(name: string): Promise<void> {
    await this.send("profiles?on_conflict=user_id", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: this.user, display_name: name }),
    });
  }

  async name(): Promise<string | null> {
    if (!this.user) return null;
    const rows = await this.get<{ display_name: string | null }[]>(`profiles?select=display_name&user_id=eq.${this.user}`);
    return rows[0]?.display_name?.trim() || null;
  }
}
