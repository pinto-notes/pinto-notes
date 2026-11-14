// pinto: your Pinto Notes from the terminal. The same verbs the connector gives AIs (search, list,
// read, create, edit, write, move, delete, history, restore, pin), as a thin MCP client over the
// Pinto Notes MCP server, and push, which sends a folder as a note's app through those same tools.
// It was called amber; installed as amber too, and every AMBER_ setting still works. See README.md.
import { accessToken, login, logout, revoke } from "./src/auth.ts";
import { connect, Refused, redact, ToolFailed, VERSION } from "./src/client.ts";
import { parse } from "./src/args.ts";
import { env, envName } from "./src/env.ts";
import { encode, readFolder, size } from "./src/files.ts";
import { format, readText } from "./src/format.ts";
import { push } from "./src/push.ts";
import { DEFAULT_SERVER, defaultServer, deleteCredentials, loadConfig, loadCredentials, OLD_DEFAULT_SERVER, saveConfig, saveCredentials, where } from "./src/store.ts";

const HELP = `pinto: your Pinto Notes from the terminal

Notes are paths like "Work/Acme.md"; folders end in "/". A note's sub-notes and files are in the
folder with its name ("Work/Acme/Agenda.md"). Read a note before you edit or write it.

  pinto search <words>               find notes, best first ("quoted phrase", OR, -word)
  pinto grep <pattern> [<path>]      lines matching a regular expression (--files, --count, -C 2)
  pinto list [<folder>/] [--glob G]  a folder, newest first; --glob "**/*.md" over everything below
  pinto read <note> [--offset N]     print a note's markdown (--limit N lines; --numbers)
  pinto create <path> [<text>]       new note "Work/Acme.md" (text or stdin), or a folder "Work/"
  pinto edit <note> <old> <new>      replace exact text, once (--all for every match)
  pinto write <path> [--file F]      a whole note or file, from stdin or F (app files too)
  pinto push <folder> <note>         a folder with index.html becomes the note's app
  pinto move <note> <to>             to a folder ("Archive/") or a new name ("Work/New.md")
  pinto delete <note>                to Recently Deleted
  pinto history <note>               earlier versions
  pinto restore <note> [<version>]   undelete, or bring back a version
  pinto pin <note> [--off]

  pinto login                        connect: approve in Pinto Notes on your iPhone or Mac
  pinto logout                       disconnect this terminal
  pinto status                       who and where

--json for the server's full answer (for scripts and agents); pinto help <command> for more.`;

const MORE: Record<string, string> = {
  search: `pinto search <words> [--limit 20] [--offset 20] [--path Work/]\n\nFinds notes by their words, best first. "exact phrase", a OR b, -word. Locked notes are left out.\nPrints each note's path and a snippet.`,
  grep: `pinto grep <pattern> [<path>] [--files | --count] [-C 2] [--case]\n\nLines matching a regular expression, as path:line: text. <path> narrows it: a folder, a note, a glob.\n  --files   only the matching notes' paths\n  --count   how many matches\n  -C N      N lines of context\n  --case    case-sensitive`,
  list: `pinto list                   the top level, newest first\npinto list Work/              a folder\npinto list Work/Acme/         a note's sub-notes and files\npinto list --glob "**/*.md"   every path that matches\npinto list "Recently Deleted/"`,
  read: `pinto read <note> [--offset 40] [--limit 80] [--numbers]\n\nPrints the note's markdown exactly, nothing else, so it pipes (--numbers: with line numbers).\nLong notes come in parts; pinto read says on stderr how to get the next one.`,
  create: `pinto create Work/Standup.md "- shipped the CLI"   (its name is its title)\npinto create Work/Standup.md < body.md\npinto create Work/Acme/Agenda.md < agenda.md        (in a note's folder: a sub-note)\npinto create Work/Clients/                          (a folder)\n\n  --pin             pin it`,
  edit: `pinto edit <note> <old text> <new text> [--all]\n\nExact search and replace, after pinto read in this terminal. old text must occur exactly once\n(unless --all), or nothing changes. new text "" deletes.\nPrints what the change broke, if anything (a damaged table, a checklist line that won't tick).`,
  write: `pinto write <note> < new.md\npinto write "To read/Paper.pdf" --file paper.pdf\npinto write Games/Doom.app/doom.wasm --file doom.wasm\n\nWrites the whole note, file or app file from stdin or --file: creates it, or replaces it after\npinto read in this terminal. Text goes as text, anything else as its bytes. The old version stays in\nhistory. Prefer edit for small changes to text.`,
  push: `pinto push <folder> <note>\npinto push ./doom Games/Doom\n\nThe folder (index.html at its top) becomes the note's app, as when it's dropped on the note in\nPinto Notes: its files are written (text as text, the rest as their bytes), and the app's files the\nfolder doesn't have are deleted. A new note or app is made if needed. Hidden files are left out;\ndata.json stays the app's data. The app before is in history.`,
  move: `pinto move <note> Archive/           to a folder (made if needed)\npinto move <note> "Work/New name.md"  rename (rewrites the first line)\npinto move Work/ Archive/Work/        a folder`,
  delete: `pinto delete <note>     to Recently Deleted, with its sub-notes; pinto restore brings it back for 30 days\npinto delete Work/      a folder: its notes go to Recently Deleted`,
  history: `pinto history <note> [--limit 10]\n\nEarlier versions, newest first, with who made each (a device, or an AI).`,
  restore: `pinto restore <note>              out of Recently Deleted\npinto restore <note> <version>    bring back a version from pinto history (the current text is kept too)`,
  pin: `pinto pin <note>\npinto pin <note> --off`,
  login: `pinto login                 opens your browser; approve in Pinto Notes on your iPhone or Mac\npinto login --no-browser    for a server or SSH session: prints the address to open anywhere,\n                            then takes the address the browser ends on\npinto login --token         paste an access token from Settings › Connect an AI (for CI)\n\nOr set PINTO_TOKEN (AMBER_TOKEN works too). The connection shows in Settings › Connect an AI, where you can disconnect it.\nTokens are kept in ${where()}.`,
};

const out = (s: string) => console.log(s);
const fail = (s: string, code = 1): never => { console.error(`pinto: ${redact(s)}`); Deno.exit(code); };

async function stdinText(): Promise<string> {
  return await new Response(Deno.stdin.readable).text();
}

async function readSecret(prompt: string): Promise<string> {
  if (!Deno.stdin.isTerminal()) return (await stdinText()).trim();
  await Deno.stderr.write(new TextEncoder().encode(prompt));
  Deno.stdin.setRaw(true);
  const buf = new Uint8Array(1);
  let s = "";
  try {
    while (true) {
      const n = await Deno.stdin.read(buf);
      if (n === null || buf[0] === 13 || buf[0] === 10) break;
      if (buf[0] === 3) Deno.exit(130);
      if (buf[0] === 127) s = s.slice(0, -1);
      else s += String.fromCharCode(buf[0]);
    }
  } finally {
    Deno.stdin.setRaw(false);
    await Deno.stderr.write(new TextEncoder().encode("\n"));
  }
  return s.trim();
}

/** Opens the browser: $PINTO_BROWSER (or $AMBER_BROWSER), else open (macOS) or xdg-open (Linux with a display). */
async function openBrowser(url: string): Promise<boolean> {
  const custom = env("BROWSER");
  const cmd = custom ? custom : Deno.build.os === "darwin" ? "open" : (Deno.env.get("DISPLAY") || Deno.env.get("WAYLAND_DISPLAY")) ? "xdg-open" : null;
  if (!cmd || Deno.env.get("SSH_CONNECTION") && !custom && Deno.build.os !== "darwin") return false;
  try {
    const p = new Deno.Command(cmd, { args: [url], stdout: "null", stderr: "null", stdin: "null" }).spawn();
    if (!custom) return (await p.status).success;
    p.unref();
    return true;
  } catch {
    return false;
  }
}

async function askLine(prompt: string): Promise<string | null> {
  await Deno.stderr.write(new TextEncoder().encode(prompt));
  const reader = Deno.stdin.readable.pipeThrough(new TextDecoderStream()).getReader();
  let line = "";
  while (!line.includes("\n")) {
    const { value, done } = await reader.read();
    if (done) break;
    line += value;
  }
  reader.releaseLock();
  return line.trim() || null;
}


async function main() {
  const args = parse(Deno.args);
  const [cmd, ...rest] = args._;
  if (args.version) return out(VERSION);
  if (!cmd || cmd === "help" || args.help) return out(MORE[cmd === "help" ? rest[0] : cmd] ?? HELP);
  const cfg = await loadConfig();
  const named = args.server ?? env("SERVER") ?? cfg.server;
  // A new sign-in goes to mcp.pintonotes.com; one amber made at mcp.ambernotes.app keeps working there.
  const server = (named ?? (cmd === "login" ? DEFAULT_SERVER : await defaultServer())).replace(/\/+$/, "");

  if (cmd === "login") {
    // The sign-in this one replaces is disconnected once the new one works, so none is left behind.
    const old = await loadCredentials(server);
    if (args.token) {
      const token = await readSecret("Access token from Pinto Notes › Settings › Connect an AI: ");
      if (!/^pane_[0-9a-f]{64}$/i.test(token)) fail("That isn't a Pinto Notes access token (pane_ and 64 letters and digits).");
      const mcp = await connect(server, () => Promise.resolve(token)).catch((e) => fail(e instanceof Refused ? "The server refused that token." : e.message));
      await mcp.close();
      await saveCredentials(server, { access_token: token });
    } else {
      // Every connection reads and edits (29 October 2026): say so rather than ignore the old flag.
      if (args["read-only"]) fail("Every connection can read and edit now. Run pinto login without --read-only.");
      const c = await login(server, { open: openBrowser, say: (l) => console.error(l), ask: askLine }, { noBrowser: args["no-browser"] });
      if (!c) return;
    }
    if (old) await revoke(server, old);
    // Signed in again at the new address: the sign-in amber made at the old one is ended too.
    const before = !named && server === DEFAULT_SERVER ? await loadCredentials(OLD_DEFAULT_SERVER) : null;
    if (before) { await revoke(OLD_DEFAULT_SERVER, before); await deleteCredentials(OLD_DEFAULT_SERVER); }
    await saveConfig({ ...cfg, server: server === DEFAULT_SERVER ? undefined : server });
    const c = (await loadCredentials(server))!;
    const access = args.token ? "the token's access" : c.scope?.includes("notes:write") ? "read & edit" : "read only";
    return out(`Connected to Pinto Notes (${access}). Tokens are kept in ${where()}.\nDisconnect any time: pinto logout, or Settings › Connect an AI in the app.`);
  }
  if (cmd === "logout") {
    const what = await logout(server);
    return out(what === "revoked" ? "Disconnected this terminal from Pinto Notes." : what === "forgotten"
      ? "Forgot the access token here. It keeps working until you delete it in Pinto Notes › Settings › Connect an AI." : "This terminal wasn't connected.");
  }

  // One session across runs (for 12 hours), so what pinto read read counts for pinto edit.
  const config = await loadConfig();
  const kept = config.sessions?.[server];
  const session = kept && Date.now() - kept.at < 12 * 3600_000 ? kept.id : undefined;
  const mcp = await connect(server, (force) => accessToken(server, force), session).catch((e) =>
    fail(e instanceof Refused ? (env("TOKEN") ? `The server refused ${envName("TOKEN")}.` : "Pinto Notes turned this terminal away. Run `pinto login` to connect again.") : e.message));
  if (mcp.session && mcp.session !== session) await saveConfig({ ...config, sessions: { ...(config.sessions ?? {}), [server]: { id: mcp.session, at: Date.now() } } }).catch(() => {});
  try {
    if (cmd === "status") {
      const c = env("TOKEN") ? null : await loadCredentials(server);
      const write = mcp.tools.includes("write") || mcp.tools.includes("replace_note_body");
      out(`server  ${server}\naccess  ${write ? "read & edit" : "read only"}${env("TOKEN") ? ` (${envName("TOKEN")})` : c?.refresh_token ? ` (signed in; tokens in ${where()})` : " (access token)"}\ntools   ${mcp.tools.includes("fetch") && mcp.tools.includes("list") ? "files" : "classic"}`);
      return;
    }
    if (!mcp.tools.includes("fetch") || !mcp.tools.includes("list")) {
      fail(`This server offers the classic tools (${mcp.tools.slice(0, 4).join(", ")}, …), not the file tools pinto uses.`);
    }
    const need = (n: number, usage: string) => { if (rest.length < n) fail(`Usage: ${usage}\nMore: pinto help ${cmd}`); };
    if (cmd === "push") {
      need(2, "pinto push <folder> <note>");
      if (!["create", "write", "delete"].every((t) => mcp.tools.includes(t))) fail("This connection can only read notes. Run pinto login again to edit.");
      const files = await readFolder(rest[0]).catch((e) => fail(`Can't read the folder ${rest[0]}: ${e.message}`));
      const total = files.reduce((n, f) => n + f.bytes.length, 0);
      if (!args.json) out(`Pushing ${files.length} files (${size(total)}) from ${rest[0]} to ${rest[1]}`);
      const r = await push(mcp, files, rest[1], args.json ? undefined : out).catch((e) => fail(e.message));
      if (args.json) return out(JSON.stringify(r, null, 2));
      const count = (d: string) => r.steps.filter((s) => s.did === d).length;
      out(`${r.app}/: ${["created", "replaced", "unchanged", "deleted"].map((d) => `${count(d)} ${d}`).join(", ")}`);
      for (const p of r.skipped) out(`Left out ${p}: in an app it's the app's data. Change it with pinto write ${r.app}/data.json.`);
      if (!r.last) return out("No change: the app already has these files.");
      if (r.last.live) out(r.last.live);
      for (const e of r.last.errors ?? []) out(`  error: ${e}`);
      for (const n of r.last.notes ?? []) out(`  note: ${n}`);
      if (r.last.tests) out(`  tests: ${r.last.tests}`);
      return;
    }
    let tool: string, call: Record<string, unknown>;
    switch (cmd) {
      case "list": case "ls": tool = "list"; call = { ...(rest[0] ? { path: rest[0] } : {}), ...(args.glob ? { pattern: args.glob } : {}), ...(args.limit ? { limit: Number(args.limit) } : {}), ...(args.offset ? { offset: Number(args.offset) } : {}) }; break;
      case "read": case "cat": need(1, "pinto read <note>"); tool = "fetch"; call = { id: rest[0], ...(args.offset ? { offset: Number(args.offset) } : {}), ...(args.limit ? { limit: Number(args.limit) } : {}) }; break;
      case "search": need(1, "pinto search <words>"); tool = "search"; call = { query: rest.join(" "), ...(args.limit ? { limit: Number(args.limit) } : {}), ...(args.offset ? { offset: Number(args.offset) } : {}), ...(args.path ? { path: args.path } : {}) }; break;
      case "grep": need(1, "pinto grep <pattern> [<path>]"); tool = "search"; call = { pattern: rest[0], ...(rest[1] ? { path: rest[1] } : {}), output: args.files ? "files" : args.count ? "count" : "content", ...(args.C ? { context: Number(args.C) } : {}), ...(args.case ? { case_sensitive: true } : {}), ...(args.limit ? { limit: Number(args.limit) } : {}), ...(args.offset ? { offset: Number(args.offset) } : {}) }; break;
      case "create": {
        need(1, "pinto create <path> [<text>]");
        const text = rest.length > 1 ? rest.slice(1).join(" ") : Deno.stdin.isTerminal() ? "" : await stdinText();
        tool = "create";
        if (rest[0].endsWith("/") && !text.trim()) call = { type: "folder", path: rest[0] };
        else call = { path: rest[0], content: text, ...(args.pin ? { pinned: true } : {}) };
        break;
      }
      case "edit": need(3, "pinto edit <note> <old text> <new text>"); tool = "edit"; call = { path: rest[0], old_string: rest[1], new_string: rest[2], ...(args.all ? { replace_all: true } : {}) }; break;
      case "write": {
        need(1, "pinto write <path> < new.md   (or --file <file>)");
        if (!args.file && Deno.stdin.isTerminal()) fail("pinto write reads from stdin or --file: pinto write <note> < new.md");
        // Text goes as text; anything else (a .wasm, a picture, a PDF) as its bytes, in base64.
        const bytes = args.file ? await Deno.readFile(args.file).catch((e) => fail(`Can't read ${args.file}: ${e.message}`)) : new Uint8Array(await new Response(Deno.stdin.readable).arrayBuffer());
        tool = "write"; call = { path: rest[0], ...encode(bytes) }; break;
      }
      case "move": case "mv": need(2, "pinto move <note> <to>"); tool = "move"; call = { path: rest[0], to: rest[1] }; break;
      case "delete": case "rm": need(1, "pinto delete <note>"); tool = "delete"; call = { path: rest[0] }; break;
      case "history": need(1, "pinto history <note>"); tool = "history"; call = { path: rest[0], ...(args.limit ? { limit: Number(args.limit) } : {}) }; break;
      case "restore": need(1, "pinto restore <note> [<version>]"); tool = "restore"; call = { path: rest[0], ...(rest[1] ? { version: Number(rest[1]) } : {}) }; break;
      case "pin": need(1, "pinto pin <note> [--off]"); tool = "pin"; call = { path: rest[0], pinned: !args.off }; break;
      default: return fail(`Unknown command "${cmd}".\n\n${HELP}`);
    }
    if (!mcp.tools.includes(tool)) fail(`This connection can only read notes. Run pinto login again to edit.`);
    const r = await mcp.call(tool, call);
    if (args.json) return out(JSON.stringify(r, null, 2));
    if (tool === "fetch") {
      const text = readText(r, !!args.numbers);
      await Deno.stdout.write(new TextEncoder().encode(text.endsWith("\n") ? text : text + "\n"));
      const next = String(r?.metadata?.truncated ?? "").match(/offset (\d+)/);
      if (next) console.error(`(more: pinto read ${JSON.stringify(rest[0])} --offset ${next[1]})`);
      return;
    }
    out(format(tool, r));
  } catch (e) {
    if (e instanceof ToolFailed) fail(e.message);
    if (e instanceof Refused) fail("Pinto Notes turned this terminal away. Run `pinto login` to connect again.");
    throw e;
  } finally {
    // The session stays open for the next run (it ends on its own).
  }
}

try {
  await main();
} catch (e) {
  fail(String((e as Error)?.message ?? e));
}
