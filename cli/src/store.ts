// Where pinto keeps what it needs between runs.
//
// ~/.config/pinto/config.json ($XDG_CONFIG_HOME respected): the server signed in to. Nothing secret.
// The credentials (access and refresh token) live in the macOS Keychain (service "pinto-cli",
// account = the server), written through `security -i` on stdin so a token is never in a process's
// arguments. Elsewhere, ~/.config/pinto/credentials.json, mode 600, in a folder of mode 700.
//
// The tool was called amber: what amber saved (~/.config/amber, the Keychain's "amber-cli") is still
// read when pinto has nothing of its own, and signing out removes both.
import { env } from "./env.ts";

export const DEFAULT_SERVER = "https://mcp.pintonotes.com";
/** The address before Pinto Notes. It still answers; sign-ins made there keep working there. */
export const OLD_DEFAULT_SERVER = "https://mcp.ambernotes.app";
const SERVICE = env("KEYCHAIN_SERVICE") ?? "pinto-cli";
/** amber's Keychain service: "amber-cli" for "pinto-cli" (and "amber-x" for a test's "pinto-x"). */
const OLD_SERVICE = SERVICE.replace(/^pinto/, "amber");

/** sessions: the MCP session per server, reused between runs (not a secret: it only names what was read). */
export type Config = { server?: string; sessions?: Record<string, { id: string; at: number }> };

export type Credentials = {
  access_token: string;
  /** Absent for a pasted token, which doesn't expire. */
  refresh_token?: string;
  /** Epoch milliseconds. */
  expires_at?: number;
  client_id?: string;
  scope?: string;
};

const configHome = () => Deno.env.get("XDG_CONFIG_HOME") || `${Deno.env.get("HOME")}/.config`;
export const configDir = () => `${configHome()}/pinto`;
export const oldConfigDir = () => `${configHome()}/amber`;
const configFile = () => `${configDir()}/config.json`;
const credentialsFile = () => `${configDir()}/credentials.json`;
const oldCredentialsFile = () => `${oldConfigDir()}/credentials.json`;

/** Where the credentials are kept, in words. */
export const where = () => useKeychain() ? `the macOS Keychain (${SERVICE})` : credentialsFile().replace(Deno.env.get("HOME") ?? "\0", "~");

function useKeychain(): boolean {
  if (Deno.build.os !== "darwin" || env("NO_KEYCHAIN") === "1") return false;
  try { return Deno.statSync("/usr/bin/security").isFile; } catch { return false; }
}

async function readJson<T>(path: string, empty: T): Promise<T> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return empty;
    throw new Error(`${path} can't be read: ${(e as Error).message}`);
  }
}

/** Written whole, created with `mode` before anything is in it. */
async function writePrivate(path: string, text: string, mode: number) {
  const dir = path.slice(0, path.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true, mode: 0o700 });
  await Deno.chmod(dir, 0o700);
  const tmp = `${path}.${crypto.randomUUID()}.tmp`;
  await Deno.writeTextFile(tmp, "", { mode });
  await Deno.chmod(tmp, mode);
  await Deno.writeTextFile(tmp, text);
  await Deno.rename(tmp, path);
}

/** pinto's config, or amber's until pinto has saved one. */
export async function loadConfig(): Promise<Config> {
  const mine = await readJson<Config | null>(configFile(), null);
  return mine ?? await readJson<Config>(`${oldConfigDir()}/config.json`, {});
}
export const saveConfig = (c: Config) => writePrivate(configFile(), JSON.stringify(c, null, 2) + "\n", 0o600);

async function security(stdin: string | null, ...args: string[]): Promise<{ ok: boolean; out: string }> {
  const p = new Deno.Command("/usr/bin/security", { args, stdin: stdin === null ? "null" : "piped", stdout: "piped", stderr: "piped" }).spawn();
  if (stdin !== null) {
    const w = p.stdin.getWriter();
    await w.write(new TextEncoder().encode(stdin));
    await w.close();
  }
  const o = await p.output();
  return { ok: o.success, out: new TextDecoder().decode(o.stdout).trim() };
}

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
/** A keychain account name: the server address, without the quotes `security -i` would choke on. */
const account = (server: string) => server.replace(/["\\\s]/g, "");

async function fromKeychain(service: string, server: string): Promise<Credentials | null> {
  const r = await security(null, "find-generic-password", "-s", service, "-a", account(server), "-w");
  if (!r.ok || !r.out) return null;
  try { return JSON.parse(unb64(r.out)); } catch { return null; }
}

export async function loadCredentials(server: string): Promise<Credentials | null> {
  if (useKeychain()) return await fromKeychain(SERVICE, server) ?? (OLD_SERVICE !== SERVICE ? await fromKeychain(OLD_SERVICE, server) : null);
  const mine = await readJson<Record<string, Credentials>>(credentialsFile(), {});
  if (mine[server]) return mine[server];
  return (await readJson<Record<string, Credentials>>(oldCredentialsFile(), {}))[server] ?? null;
}

export async function saveCredentials(server: string, c: Credentials): Promise<void> {
  if (useKeychain()) {
    // base64 keeps the value free of quotes and spaces; stdin keeps it out of `ps`.
    const r = await security(`add-generic-password -U -s ${SERVICE} -a "${account(server)}" -l "Pinto Notes (pinto CLI)" -w ${b64(JSON.stringify(c))}\n`, "-i");
    if (!r.ok) throw new Error("Couldn't save to the macOS Keychain.");
    return;
  }
  const all = await readJson<Record<string, Credentials>>(credentialsFile(), {});
  all[server] = c;
  await writePrivate(credentialsFile(), JSON.stringify(all, null, 2) + "\n", 0o600);
}

/** Forgets the sign-in for `server`, pinto's and amber's. */
export async function deleteCredentials(server: string): Promise<void> {
  if (useKeychain()) {
    await security(null, "delete-generic-password", "-s", SERVICE, "-a", account(server));
    if (OLD_SERVICE !== SERVICE) await security(null, "delete-generic-password", "-s", OLD_SERVICE, "-a", account(server));
    return;
  }
  for (const file of [credentialsFile(), oldCredentialsFile()]) {
    const all = await readJson<Record<string, Credentials>>(file, {});
    if (!(server in all)) continue;
    delete all[server];
    await writePrivate(file, JSON.stringify(all, null, 2) + "\n", 0o600);
  }
}

/** The server when none is named: mcp.pintonotes.com, unless the only sign-in here is one amber
 *  made at mcp.ambernotes.app (its tokens belong to that address, which still answers). */
export async function defaultServer(): Promise<string> {
  if (await loadCredentials(DEFAULT_SERVER)) return DEFAULT_SERVER;
  return await loadCredentials(OLD_DEFAULT_SERVER) ? OLD_DEFAULT_SERVER : DEFAULT_SERVER;
}

/** Runs `fn` holding ~/.config/pinto/refresh.lock: refresh tokens are single use, so two pinto
 *  processes refreshing at once would get the connection revoked. */
export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await Deno.mkdir(configDir(), { recursive: true, mode: 0o700 });
  const f = await Deno.open(`${configDir()}/refresh.lock`, { create: true, write: true, mode: 0o600 });
  try {
    await f.lock(true);
    return await fn();
  } finally {
    f.close();
  }
}
