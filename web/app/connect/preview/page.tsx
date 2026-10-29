import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ConnectLabel } from "@/lib/connect";
import { BrowserFrame } from "../BrowserScreens";
import ConnectCard from "../ConnectCard";
import Preview from "./Preview";
import styles from "../connect.module.css";
import { PREVIEW_STATES, type PreviewState } from "./states";

// Dev only: each state of the connect page from fixed props, with no network, for design review and
// screenshots (/connect/preview?state=scan). Not on the production site.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dev: connect preview", robots: { index: false, follow: false } };

/// Who is asking, by kind: an AI on its own domain, a local app, a local app using Claude's name,
/// a website, and an app with no name.
const APPS: Record<string, ConnectLabel> = {
  claude: { claimed_name: "Claude", redirect_host: "claude.ai", loopback: false },
  chatgpt: { claimed_name: "ChatGPT", redirect_host: "chatgpt.com", loopback: false },
  codex: { claimed_name: "codex", redirect_host: "127.0.0.1", loopback: true },
  fake: { claimed_name: "claude", redirect_host: "127.0.0.1", loopback: true },
  web: { claimed_name: "notebot", redirect_host: "notebot.example", loopback: false },
  glama: { claimed_name: "glama", redirect_host: "glama.ai", loopback: false },
  none: { claimed_name: null, redirect_host: "127.0.0.1", loopback: true },
};

export default async function ConnectPreview({ searchParams }: { searchParams: Promise<{ state?: string; number?: string; action?: string; both?: string; theme?: string; app?: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { state, number, action, both, theme, app } = await searchParams;
  const s: PreviewState = (PREVIEW_STATES as readonly string[]).includes(state ?? "") ? state as PreviewState : "scan";
  // For the device screens: &number=1 shows the number, &action=compare
  // is the 1.2 wording, &both=1 gives the account the other device too. &theme=leaf shows the card on
  // the site's dark theme, which /connect itself never uses. &app= picks who is asking (APPS).
  // The screens of connecting on the web alone sit in their own frame (BrowserFrame), not the card.
  if (s.startsWith("web")) {
    const ai = s === "webConsentUnknown" ? null : s === "webConsentClaude" ? "Claude" : "ChatGPT";
    return <BrowserFrame ai={ai} done={s === "webConnected"}><Preview state={s} number={null} action="type" both={false} /></BrowserFrame>;
  }
  const card = (
    <ConnectCard request label={APPS[app ?? ""] ?? APPS.claude}>
      <Preview
        state={s} number={number === "1" ? "42" : null}
        action={action === "compare" ? "compare" : "type"} both={both === "1"}
      />
    </ConnectCard>
  );
  return theme === "leaf" ? <div data-theme="leaf" className={styles.leafPreview}>{card}</div> : card;
}
