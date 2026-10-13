// Domain verification for ChatGPT's plugin directory. OpenAI fetches
// https://<MCP host>/.well-known/openai-apps-challenge (middleware.ts lets this path through to the
// site) and expects the token from that plugin's dashboard as plain text, alone in the body: no
// newline, no JSON. Each plugin has its own token, so each MCP host answers with its own: the Amber
// Notes plugin (2 Oct) is on mcp.ambernotes.app, the Pinto Notes plugin (13 Oct) on
// mcp.pintonotes.com. The tokens are public challenges, not secrets.

import { challengeToken } from "@/lib/openai-challenge";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return new Response(challengeToken(host), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
