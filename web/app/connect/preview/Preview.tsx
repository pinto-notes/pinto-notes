"use client";

import { useState } from "react";
import { scanAppLink, scanLink } from "@/lib/connect-flow";
import { universalLink } from "@/lib/connect";
import { DeviceScreen, type NumberAction } from "../DeviceLead";
import type { PreviewState } from "./states";
import { EndedScreen, LeavingScreen, NotifyScreen, NotifySignInScreen, RecoverScreen, ScanScreen } from "../ConnectScreens";
import { BrowserSignInScreen, CodeScreen, ConnectedScreen, ConsentScreen, InAppScreen } from "../BrowserScreens";
import { consentWords } from "@/lib/connect-browser";

// The connect page's screens with fixed, made-up values. Nothing here talks to a server.


const ID = "5a0f6c1e-2b1d-4c36-9e0a-6b6f0c1a2b3c";
// Placeholders in the right shape (22 and 43 base64url characters), not real values.
const SCAN = "preview_scan_secret_01";
const FINGERPRINT = "preview_key_hash_" + "0".repeat(26);
const PREVIEW_LINK = scanLink(ID, SCAN, FINGERPRINT);
const TO = "claude.ai";
const noop = () => {};
const sentAgain = async () => null;
const prevent = (e: React.FormEvent) => e.preventDefault();
/// Who is asking, as /connect/request says it after sign-in: ChatGPT at its own callback, and an
/// app Pinto can't name.
const CHATGPT = { verified_ai: "ChatGPT" as const, redirect_host: "chatgpt.com", loopback: false, claimed_name: null, client_name: "ChatGPT" };
const CLAUDE = { verified_ai: "Claude" as const, redirect_host: "claude.ai", loopback: false, claimed_name: null, client_name: "Claude" };
const UNKNOWN = { verified_ai: null, redirect_host: "notebot.example", loopback: false, claimed_name: "notebot", client_name: "notebot.example" };

export default function Preview({ state, number, action, both }: {
  state: PreviewState; number: string | null; action: NumberAction; both: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [write, setWrite] = useState(true);
  const signIn = { email, password, onEmail: setEmail, onPassword: setPassword, onApple: noop, onGoogle: noop, busy: false, ready: true, failure: null };
  switch (state) {
    case "scan":
      return <ScanScreen to={TO} on="other" link={PREVIEW_LINK} macLink={null} onNotify={noop} onRecover={noop} />;
    case "scanMac":
      return <ScanScreen to={TO} on="mac" link={PREVIEW_LINK} macLink={scanAppLink(ID, SCAN, FINGERPRINT)} onNotify={noop} onRecover={noop} />;
    case "scanPhone":
      return <ScanScreen to={TO} on="iphone" link={PREVIEW_LINK} macLink={null} onNotify={noop} onRecover={noop} />;
    case "notifySignIn":
      return <NotifySignInScreen {...signIn} to={TO} onSubmit={prevent} onScan={noop} />;
    case "notifyNumber":
      return <NotifyScreen number="42" onScan={noop} />;
    case "recover":
      return (
        <RecoverScreen
          {...signIn} to={TO} signedIn={null} recoveryKey={recoveryKey} onRecoveryKey={setRecoveryKey}
          access={{ write, canWrite: true, onWrite: setWrite }} onSubmit={prevent} onSignIn={prevent}
          other={{ label: "Scan the code instead", onClick: noop }}
        />
      );
    case "recoverKey":
      return (
        <RecoverScreen
          {...signIn} to={TO} signedIn="me@example.com" recoveryKey={recoveryKey} onRecoveryKey={setRecoveryKey}
          access={{ write, canWrite: true, onWrite: setWrite }} onSubmit={prevent} onSignIn={prevent}
          other={{ label: "Approve on your iPhone or Mac instead", onClick: noop }}
        />
      );
    case "checkIphone":
      return <DeviceScreen lead="iphone" devices={{ iphone: true, mac: both }} number={number} action={action} openLink={universalLink(ID)} onRecover={noop} onResend={sentAgain} />;
    case "checkMac":
      return <DeviceScreen lead="mac" devices={{ iphone: false, mac: true }} number={number} action={action} openLink={universalLink(ID)} onRecover={noop} onResend={sentAgain} />;
    case "thisMac":
      return <DeviceScreen lead="thisMac" devices={{ iphone: both, mac: true }} number={number} action={action} openLink={universalLink(ID)} onRecover={noop} onResend={sentAgain} />;
    case "thisIphone":
      return <DeviceScreen lead="thisIphone" devices={{ iphone: true, mac: both }} number={number} action={action} openLink={universalLink(ID)} onRecover={noop} onResend={sentAgain} />;
    case "leaving":
      return <LeavingScreen allowed host={TO} />;
    case "webSignIn":
    case "webSignInAgain":
      return (
        <BrowserSignInScreen
          who="ChatGPT" email={state === "webSignInAgain" ? "me@example.com" : email} onEmail={setEmail} onSubmit={prevent} onGoogle={noop} onApple={noop}
          busy={false} ready failure={null} again={state === "webSignInAgain"} onDifferent={noop}
        />
      );
    case "webCode":
      return <CodeScreen email="me@example.com" code={email.replace(/\D/g, "")} onCode={setEmail} onSubmit={prevent} onResend={noop} onDifferent={noop} busy={false} ready failure={null} resent={false} />;
    case "webConsent":
    case "webConsentRead":
    case "webConsentUnknown":
    case "webConsentClaude":
    case "webAllowing": {
      const r = state === "webConsentUnknown" ? UNKNOWN : state === "webConsentClaude" ? CLAUDE : CHATGPT;
      return (
        <ConsentScreen
          words={consentWords(r)} requested="Requested just now from Chrome on Windows" canWrite={state !== "webConsentRead"} write={state === "webConsentRead" ? false : write} onWrite={setWrite}
          onAllow={noop} onDeny={noop} busy={state === "webAllowing" ? "allow" : null} failure={null} email="me@example.com" onSwitch={noop}
        />
      );
    }
    case "webConnected":
      return <ConnectedScreen to="ChatGPT" href="#" />;
    case "webExpired":
      return <EndedScreen title="This request has expired" text="Start connecting again from ChatGPT, Claude or the other app you were using." />;
    case "webInApp":
      return <InAppScreen email="me@example.com" onSwitch={noop} onContinue={noop} />;
  }
}
