// Each ChatGPT plugin has its own domain-challenge token, served at its MCP host (see
// app/.well-known/openai-apps-challenge/route.ts). The tokens are public challenges, not secrets.

export const CHALLENGE_TOKENS: Record<string, string> = {
  "mcp.ambernotes.app": "63ThANIdhp-bJNHKaegib3mD6AXGcWuB4Dvwj-m3eqs",
  "mcp.pintonotes.com": "k11dzM9GOLGKrm56UKtMrtnzfMMa2vgeoD9qbJ5VaE8",
};

/** The token for a request's host; the Amber Notes one for any other host, as before. */
export function challengeToken(host: string | null): string {
  const name = (host ?? "").split(":")[0].toLowerCase();
  return CHALLENGE_TOKENS[name] ?? CHALLENGE_TOKENS["mcp.ambernotes.app"];
}
