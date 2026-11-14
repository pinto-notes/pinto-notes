// For tests: a local https server that stands in for the internet. Names under example.com get
// made-up public addresses from `dns`; the fetcher (public_fetch.ts) checks those addresses as it
// would real ones and then dials this server instead, over TLS with a certificate made for the
// test (openssl), so the real connection code runs and nothing leaves the machine.
import { useNetwork } from "./public_fetch.ts";

async function openssl(dir: string, ...args: string[]) {
  const out = await new Deno.Command("openssl", { args, cwd: dir, stdout: "null", stderr: "piped" }).output();
  if (!out.success) throw new Error(`openssl ${args[0]}: ${new TextDecoder().decode(out.stderr)}`);
}

let made: Promise<{ ca: string; cert: string; key: string }> | null = null;
/** A test CA and a certificate from it for example.com, *.example.com and ChatGPT's file host, made once per run. */
function certificate() {
  made ??= (async () => {
    const dir = await Deno.makeTempDir({ prefix: "pinto-https-test-" });
    try {
      const ec = ["-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1", "-nodes"];
      await openssl(dir, "req", "-x509", ...ec, "-days", "2", "-subj", "/CN=Pinto test CA", "-keyout", "ca.key", "-out", "ca.pem");
      await openssl(dir, "req", ...ec, "-subj", "/CN=example.com", "-keyout", "leaf.key", "-out", "leaf.csr");
      await Deno.writeTextFile(`${dir}/ext.cnf`, "basicConstraints=critical,CA:FALSE\nsubjectAltName=DNS:example.com,DNS:*.example.com,DNS:files.oaiusercontent.com\nextendedKeyUsage=serverAuth\n");
      await openssl(dir, "x509", "-req", "-in", "leaf.csr", "-CA", "ca.pem", "-CAkey", "ca.key", "-CAcreateserial", "-days", "2", "-extfile", "ext.cnf", "-out", "leaf.pem");
      const read = (f: string) => Deno.readTextFile(`${dir}/${f}`);
      return { ca: await read("ca.pem"), cert: await read("leaf.pem"), key: await read("leaf.key") };
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  })();
  return made;
}

export type TestWeb = {
  /** Every address the fetcher dialled, as it checked it. */
  dialled: string[];
  /** Every path the server was asked for, with the headers that came with it. */
  asked: { url: string; headers: Headers }[];
  port: number;
  close: () => Promise<void>;
};

/** Starts the stand-in internet: `dns` maps names to addresses, `handler` answers every request. */
export async function testWeb(dns: Record<string, string[]>, handler: (req: Request) => Response | Promise<Response>, o: { timeoutMs?: number } = {}): Promise<TestWeb> {
  const { ca, cert, key } = await certificate();
  const asked: TestWeb["asked"] = [], dialled: string[] = [];
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, cert, key, onListen: () => {} }, (req) => {
    asked.push({ url: req.url, headers: req.headers });
    return handler(req);
  });
  const port = server.addr.port;
  const restore = useNetwork({
    resolve: (host, type) => Promise.resolve((dns[host] ?? []).filter((ip) => (type === "A") === !ip.includes(":"))),
    route: (ip) => { dialled.push(ip); return { hostname: "127.0.0.1", port }; },
    caCerts: [ca],
    ...(o.timeoutMs ? { timeoutMs: o.timeoutMs } : {}),
  });
  return { dialled, asked, port, close: async () => { restore(); await server.shutdown(); } };
}
