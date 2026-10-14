/// Which site pages are cream and which are leaf brown. The changelog and Privacy & Security are cream
/// since the site audit of 13 October 2026, so the dark closing band at their end is the one brown
/// moment on them. Help stays leaf brown (Emil, 14 October 2026: it looked better that way), with the
/// privacy policy and terms. Shared notes and the report form have no
/// fixed theme: they follow the visitor's system (app/site.css), cream in light and leaf brown in dark.
/// Any other address is a site page, so an address the site doesn't have gets the site's own 404.
export function themeFor(path: string): "cream" | "leaf" | null {
  if (/^\/(n|s|t|report)(\/|$)/.test(path)) return null;
  if (/^\/(support|help|privacy|terms)(\/|$)/.test(path)) return "leaf";
  // Design studies (/lab/*, noindex, unlinked) follow the visitor's system: cream in light, leaf brown in
  // dark. The home page studies (/lab/home-d, -e, -f, -g) are cream like the home page: the home page is never dark.
  if (/^\/lab(\/|$)/.test(path) && !/^\/lab\/home-[defg](\/|$)/.test(path)) return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "leaf" : "cream";
  return "cream";
}

/// Pages whose header drops the version badge and the GitHub stars (the stars move to the footer).
/// Only home page studies E and F for now, to compare against the live header.
export function quietHeader(path: string): boolean {
  return path === "/lab/home-e" || path === "/lab/home-f" || path === "/lab/home-g";
}

/// Site pages that are one card under their own quiet top bar (lib/ui.tsx Shell and TopBar): the
/// site's colours without its header and footer. A page that draws a TopBar and isn't listed here
/// gets two headers; theme.test.ts checks every page that draws one. `copyIds` are the prompts
/// /copy/<id> has a page for (lib/try-prompts.json): any other id is the site's 404, with the header.
export function ownTopBar(path: string, copyIds: readonly string[] = []): boolean {
  if (["/connect", "/connect/preview", "/open/connect", "/reset-password", "/unsubscribe"].includes(path)) return true;
  const copy = /^\/copy\/([^/]+)$/.exec(path);
  return !!copy && copyIds.includes(copy[1]);
}

/// Runs in <head> before first paint, so a page never flashes the wrong theme. The consent page's
/// CSP allows it by its hash (middleware.ts), so change it only here.
export const themeScript = `(function(){var p=location.pathname,t=/^\\/(n|s|t|report)(\\/|$)/.test(p)?null:/^\\/(support|help|privacy|terms)(\\/|$)/.test(p)?"leaf":/^\\/lab(\\/|$)/.test(p)&&!/^\\/lab\\/home-[defg](\\/|$)/.test(p)&&typeof matchMedia==="function"&&matchMedia("(prefers-color-scheme: dark)").matches?"leaf":"cream";if(t)document.documentElement.dataset.theme=t;})();`;
