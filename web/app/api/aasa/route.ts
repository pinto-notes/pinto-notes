import { aasa, validAppID } from "@/lib/aasa";

// A build of your own's apple-app-site-association (lib/aasa.ts): only reached through the rewrite
// that APPLE_APP_ID turns on.
export function GET() {
  const id = process.env.APPLE_APP_ID;
  if (!validAppID(id)) return new Response("Not found", { status: 404 });
  return Response.json(aasa(id), { headers: { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
