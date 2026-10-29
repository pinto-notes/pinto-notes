import type { Metadata } from "next";
import { functionURL } from "@/lib/connect";
import StartConnect from "./StartConnect";

// Where Connect in the app opens (lib/connect-browser.ts, "Connect in the app counts as the
// Allow"): the ticket in the fragment becomes this browser's key, then on to ChatGPT or Claude.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect to Pinto Notes", robots: { index: false, follow: false } };

export default function Start() {
  return <StartConnect mcp={functionURL(process.env.SUPABASE_URL ?? "")} />;
}
