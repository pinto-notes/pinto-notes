import type { Metadata } from "next";
import { headers } from "next/headers";
import { approveOnFromUA } from "@/lib/connect-flow";
import { fetchLabel, functionURL, problemText, qrConnectLive, validRequest } from "@/lib/connect";
import { functionRegion, upstreamHeaders } from "@/lib/mcp-proxy";
import { publicVersion } from "@/lib/public-release";
import BrowserConnect from "./BrowserConnect";
import ConnectCard from "./ConnectCard";
import ConnectFlow from "./ConnectFlow";
import ConnectFlowV1 from "./ConnectFlowV1";
import styles from "./connect.module.css";

// Where an AI's sign-in lands (the MCP server's /authorize sends it here). It says what the app calls itself.
// With a server that allows it, you sign in and allow it here (lib/connect-browser.ts); otherwise you
// approve on your iPhone or Mac, or here with your recovery key (lib/connect.ts).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect to Pinto Notes", robots: { index: false, follow: false } };

export default async function Connect({ searchParams }: { searchParams: Promise<{ request?: string; problem?: string; recover?: string; code?: string; error?: string; qr?: string }> }) {
  const { request, problem, recover, code, error, qr } = await searchParams;
  const supabaseURL = process.env.SUPABASE_URL ?? "";
  const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
  if (validRequest(request) && (!supabaseURL || !anonKey)) {
    console.error("/connect: SUPABASE_URL or SUPABASE_ANON_KEY is not set");
    return (
      <ConnectCard>
        <h1 className={styles.title}>Couldn't connect</h1>
        <p className={styles.lede}>Connecting isn't available right now. Try again in a few minutes.</p>
      </ConnectCard>
    );
  }
  if (!validRequest(request)) {
    return (
      <ConnectCard>
        <h1 className={styles.title}>{problem ? "Couldn't connect" : "This link isn't complete"}</h1>
        <p className={styles.lede}>{problemText(problem)}</p>
        <a className={styles.secondary} href="/open/connect-ai">How to connect your AI</a>
      </ConnectCard>
    );
  }
  const label = await labelFor(request);
  const flow = {
    requestId: request.toLowerCase(), supabaseURL, anonKey, label, recover: recover === "1",
    authCode: typeof code === "string" ? code : undefined, authError: typeof error === "string" ? error : undefined,
  };
  // The QR page once the public apps can scan it (lib/connect.ts, qrConnectLive); until then the
  // page those apps understand, and ?qr=1 for testing a newer build.
  const live = qrConnectLive(publicVersion());
  const device = approveOnFromUA((await headers()).get("user-agent"));
  const asBefore = (f: typeof flow) => qrConnectLive(publicVersion(), qr) ? <ConnectFlow {...f} keepQR={!live} device={device} /> : <ConnectFlowV1 {...f} />;
  // A server that lets the page answer (lib/connect-browser.ts): sign in and Allow here. The way it
  // was stays for the recovery key's return trip and for accounts whose key is only on their devices.
  if (label?.allow_here && recover !== "1") {
    // Its own frame on every step (BrowserFrame); the way it was keeps its card.
    return (
      <BrowserConnect
        requestId={flow.requestId} supabaseURL={supabaseURL} anonKey={anonKey} authCode={flow.authCode} authError={flow.authError}
        label={label} inApp={<ConnectCard request label={label}>{asBefore({ ...flow, authCode: undefined, authError: undefined })}</ConnectCard>}
      />
    );
  }
  return (
    <ConnectCard request label={label}>
      {asBefore(flow)}
    </ConnectCard>
  );
}

/// Who is asking, from the MCP function, as the site's proxy would ask: with the visitor's address
/// for its rate limit. Nothing when it can't say; the page then uses general words.
async function labelFor(id: string) {
  const supabase = process.env.SUPABASE_URL;
  if (!supabase) return null;
  const secret = process.env.MCP_PROXY_SECRET;
  const incoming = await headers();
  const region = functionRegion(process.env.FUNCTION_REGION);
  return fetchLabel(functionURL(supabase), id, secret ? upstreamHeaders(incoming, secret, region) : new Headers(region ? { "x-region": region } : {}));
}
