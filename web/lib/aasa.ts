// The apple-app-site-association file a build of your own serves (docs/MAKE-IT-YOURS.md): set
// APPLE_APP_ID to your team id and bundle id ("ABCDE12345.com.kim.notes") and the site claims /open/*
// for your app instead of Pinto Notes'. Unset, the site serves public/.well-known/ as it is.

/// The file, for one app: the same shape as public/.well-known/apple-app-site-association.
export function aasa(appID: string) {
  return {
    applinks: {
      apps: [],
      details: [{ appIDs: [appID], components: [{ "/": "/open/*", comment: "Opens the app, e.g. /open/connect?request=<id>" }], appID, paths: ["/open/*"] }],
    },
  };
}

/// A team id, a dot and a bundle id.
export const validAppID = (id: string | undefined): id is string => /^[A-Z0-9]{10}\.[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(id ?? "");

/// For next.config.ts's beforeFiles (which comes before public/): the file from /api/aasa when
/// APPLE_APP_ID is set. None otherwise, so pintonotes.com is unchanged.
export function aasaRewrites(appID = process.env.APPLE_APP_ID) {
  return validAppID(appID) ? [{ source: "/.well-known/apple-app-site-association", destination: "/api/aasa" }] : [];
}
