// The two ways the whiteboard page reaches a board's document (board-session.ts):
// - with its link, not signed in: read only, proven by the link's answer (collab_link_pull, collab_link_file);
// - as a member: the tables and the note's Realtime channel, as the app's transport does
//   (Pane/Collab/SupabaseCollabTransport.swift): changes relayed as they're stored, sealed presence
//   broadcast on `note:<id>`, each browser tab its own presence entry.
import { RealtimeClient } from "@supabase/realtime-js";
import type { Rest } from "./board-rest";
import type { Live, LiveEvents, Member, Pull, Transport, Update } from "./board-session";

const num = (v: unknown) => Number(v);
const update = (r: { id: unknown; author_id: unknown; epoch: unknown; ct: unknown; client?: unknown }): Update =>
  ({ id: num(r.id), author_id: String(r.author_id), epoch: num(r.epoch), ct: String(r.ct), client: typeof r.client === "string" ? r.client : null });

type LinkPull = { snapshot: { upto: number; epoch: number; ct: string } | null; updates: Update[]; more: boolean };

/** The board through its link, for someone who isn't signed in (or isn't in it): read only. */
export function linkTransport(rest: Rest, link: string, answer: string): Transport {
  return {
    async pull(after) {
      const out: Pull = { snapshot: null, updates: [] };
      let from = after;
      for (let page = 0; page < 1000; page++) {
        const r = await rest.rpc<LinkPull>("collab_link_pull", { p_link: link, p_answer: answer, p_after: from });
        if (page === 0 && r.snapshot) out.snapshot = { upto: num(r.snapshot.upto), epoch: num(r.snapshot.epoch), ct: r.snapshot.ct };
        out.updates.push(...r.updates.map(update));
        if (!r.more || !r.updates.length) break;
        from = num(r.updates[r.updates.length - 1].id);
      }
      return out;
    },
    async file(id) {
      const rows = await rest.rpc<{ file_id: string; epoch: number; ct: string }[]>("collab_link_file", { p_link: link, p_answer: answer, p_file: id });
      return rows?.[0] ? { epoch: num(rows[0].epoch), ct: rows[0].ct } : null;
    },
  };
}

const PAGE = 500;

/** The board as a member: what the app's transport reads and writes, and the live channel. */
export function memberTransport(rest: Rest, note: string, realtime: (() => RealtimeClient) | null): Transport {
  const id = note.toLowerCase();
  return {
    async pull(after) {
      // Only a snapshot past `after`: this page has everything up to there.
      const snaps = await rest.get<{ upto: number; epoch: number; ct: string }[]>(
        `note_snapshots?select=upto,epoch,ct&note_id=eq.${id}${after > 0 ? `&upto=gt.${after}` : ""}&order=upto.desc,epoch.desc&limit=1`);
      const s = snaps[0] ? { upto: num(snaps[0].upto), epoch: num(snaps[0].epoch), ct: snaps[0].ct } : null;
      const snapshot = s && (after === 0 || after < s.upto) ? s : null;
      let from = snapshot?.upto ?? after;
      const updates: Update[] = [];
      for (;;) {
        const rows = await rest.get<Update[]>(`note_updates?select=id,author_id,epoch,ct,client&note_id=eq.${id}&id=gt.${from}&order=id&limit=${PAGE}`);
        updates.push(...rows.map(update));
        if (rows.length < PAGE) break;
        from = num(rows[rows.length - 1].id);
      }
      return { snapshot, updates };
    },
    async file(file) {
      const rows = await rest.get<{ epoch: number; ct: string }[]>(`note_files?select=epoch,ct&note_id=eq.${id}&file_id=eq.${encodeURIComponent(file)}`);
      return rows[0] ? { epoch: num(rows[0].epoch), ct: rows[0].ct } : null;
    },
    async send(ct, epoch) {
      const row = await rest.insert<Update>("note_updates", { note_id: id, epoch, ct }, "id,author_id,epoch,ct,client");
      return update(row!);
    },
    async snapshot(ct, upto, epoch) {
      await rest.insert("note_snapshots", { note_id: id, upto, epoch, ct });
    },
    async putFile(file, epoch, ct) {
      await rest.rpc("collab_put_file", { p_note: id, p_file: file, p_epoch: epoch, p_ct: ct });
    },
    async members() {
      return await rest.rpc<Member[]>("collab_members", { p_note: id });
    },
    live: realtime ? (events) => join(realtime(), rest, id, events) : undefined,
  };
}

/** The note's channel (SupabaseCollabTransport.join): refused within 10 seconds for someone who isn't a member. */
async function join(client: RealtimeClient, rest: Rest, note: string, on: LiveEvents): Promise<Live | null> {
  const me = rest.user;
  if (!me || !rest.accessToken) return null;
  await client.setAuth(rest.accessToken);
  rest.onToken = (t) => { void client.setAuth(t); };
  const device = crypto.randomUUID();
  const channel = client.channel(`note:${note}`, { config: { private: true, presence: { key: device, enabled: true }, broadcast: { self: false } } });
  const here = new Map<string, string>();
  channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "note_updates", filter: `note_id=eq.${note}` }, (m: { new?: Record<string, unknown> }) => {
    if (m.new && m.new.ct) on.update(update(m.new as Parameters<typeof update>[0]));
  });
  channel.on("broadcast", { event: "presence" }, (m: { payload?: { user?: unknown; ct?: unknown } }) => {
    const p = m.payload;
    if (typeof p?.user === "string" && typeof p.ct === "string" && p.user.toLowerCase() !== me.toLowerCase()) on.presence(p.user, p.ct);
  });
  channel.on("broadcast", { event: "members" }, () => on.members());
  channel.on("presence", { event: "join" }, (m: { key: string; newPresences: { user?: string }[] }) => {
    const u = m.newPresences?.[0]?.user;
    if (typeof u === "string") here.set(m.key, u.toLowerCase());
  });
  channel.on("presence", { event: "leave" }, (m: { key: string }) => {
    const u = here.get(m.key);
    here.delete(m.key);
    if (u && u !== me.toLowerCase() && ![...here.values()].includes(u)) on.leave(u);
  });
  channel.on("system", {}, (m: { extension?: string; status?: string; message?: string }) => {
    if (m?.extension !== "postgres_changes") return;
    if (m.status === "ok") on.relaying(); else on.notRelaying(m.message ?? String(m.status));
  });
  let joined = false;
  const ok = await new Promise<boolean>((done) => {
    const timer = setTimeout(() => done(false), 10_000);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        if (joined) on.relaying();
        joined = true;
        done(true);
      } else if (status === "CHANNEL_ERROR" && !joined) { clearTimeout(timer); done(false); }
    });
  });
  if (!ok) { void client.removeChannel(channel); return null; }
  void channel.track({ user: me.toLowerCase() });
  return {
    presence(ct) { void channel.send({ type: "broadcast", event: "presence", payload: { user: me.toLowerCase(), ct } }); },
    members() { void channel.send({ type: "broadcast", event: "members", payload: {} }); },
    close() { void channel.untrack(); void client.removeChannel(channel); rest.onToken = null; },
  };
}

/** A Realtime client for the project, made when a member's board first joins its channel. */
export function realtimeFor(supabaseURL: string, anonKey: string): () => RealtimeClient {
  let client: RealtimeClient | null = null;
  return () => client ??= new RealtimeClient(`${supabaseURL.replace(/^http/, "ws").replace(/\/+$/, "")}/realtime/v1`, { params: { apikey: anonKey } });
}
