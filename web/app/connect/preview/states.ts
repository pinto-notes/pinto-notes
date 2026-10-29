/// The states /connect/preview can show (?state=…).
export const PREVIEW_STATES = ["scan", "scanMac", "scanPhone", "notifySignIn", "notifyNumber", "recover", "recoverKey", "leaving", "checkIphone", "checkMac", "thisMac", "thisIphone",
  // Connecting on the web page alone (BrowserScreens.tsx).
  "webSignIn", "webSignInAgain", "webCode", "webConsent", "webConsentRead", "webConsentUnknown", "webConsentClaude", "webAllowing", "webConnected", "webExpired", "webInApp"] as const;
export type PreviewState = (typeof PREVIEW_STATES)[number];
