# Release gate: design/browser-connect (connecting an AI in the browser)

**Written review, not a measured gate run.** This branch changes keys (the server opens the key copy to
connect an AI) and the connect flow, so CLAUDE.md asks for a gate report before it ships. The measured
gate (`scripts/release-gate.sh`) reads staging, which doesn't run this branch's functions, and needs the
Air; run it once the functions are on staging and before the next App Store submission. Nothing here
was deployed.

- Date: 2026-10-29
- Candidate: branch `design/browser-connect` off origin/dev 9755fbc3
- Tested on: PGlite (every migration) and the local stack (`supabase start`, `supabase functions serve`,
  the site built and served on 127.0.0.1:5291). No staging, no production.

## What changes

- **Server, `supabase/functions/mcp/oauth.ts`:** new `POST /connect/allow`. For an account with a key
  copy, a signed-in /connect page answers the request itself. The function opens the copy
  (`openAtRest`, then `isAccountsKey`, as the `key` function does), makes the code a device would make
  (`amb_code_` and 64 hex), wraps the data key under it, and stores only the code's SHA-256 and the wrap.
  `/token` is unchanged. `/connect/request` gains `allow_here` and `allow_here_why`, and `/connect/label`
  gains `allow_here`. The grant writing in `decide` moved into `grant()`, which both paths use.
- **Migration `20261029120000_connect_in_browser.sql`:** additive. `key_copy_events.what` also takes
  `connected`, one row each time the server opens a copy to connect an AI.
- **Key function:** `isAccountsKey` and `KeyRow` are now exported. No behaviour change. Its 22 tests pass.
- **Site, `/connect`:** when the label says `allow_here`, the page offers an email code, Google or Apple
  sign-in, then the consent and Allow. Otherwise it is the page as it was. Accounts without a copy
  continue to the old page from the "Allow this in Pinto Notes" screen.
- **App:** a "Connect an AI" sheet (ChatGPT or Claude, one sentence, a visible "Shared with …" line,
  one button). Lines that said "allow it here" now say to allow on the Pinto Notes page. Both apply
  only when `serverCopy` is true. Strict accounts keep every string and the app approval.

## Switches (all off until set)

`CONNECT_IN_BROWSER=on` on the functions, together with the existing `KEY_COPY=on` and a
`KEY_COPY_SECRET_<n>`. If any is missing, the label says `allow_here: false`, the site shows the old
page, and `/connect/allow` answers 503 `off`. The site can deploy first. To turn it off without a
deploy, unset `CONNECT_IN_BROWSER`.

## Security

| Check | Result |
|---|---|
| Secret scan, gitleaks over the branch's 7 commits | no leaks |
| New third-party hosts | none (only example and test hosts in tests) |
| Who may allow | the page's origin only (an exact `Origin` match; the apps keep `/connect/decide`), a valid session, and the account that claimed the request |
| How recent the sign-in must be | `KEY_COPY_SIGNIN_HOURS`, 1 hour by default, read from the token's `amr` after the auth server has checked the token. This is the same rule as a new device fetching the key, so a stolen old session can't connect its own AI either |
| After a password reset | `KEY_COPY_HOLD_HOURS` applies, as for key fetches (off by default) |
| Rate limits | 30 per 10 minutes per address (`allow` bucket, checked before the session is looked at); 10 an hour and 30 a day per account, counted under the key function's advisory lock |
| Storage | the code's hash and its wrap only; the wrap is cleared at `/token`, and a reused code revokes the grant (unchanged) |
| Key material | wiped after use; never logged or returned. Logs carry only `connect_allow` with a fixed hint |
| Audit | `key_copy_events` 'connected' (platform web), and the `ai_connected` account notice, so every device shows the new connection with Disconnect |
| Refusals | the request is let go (unclaimed), so the app or the recovery key can still answer it |
| Strict accounts | `strict` and `no_copy` never open anything; the old flow stays whole |
| A copy of an old key | refused (`no_copy`) |
| Return address | the page sends back the exact `redirect_uri` it showed; a mismatch gets 409. The page follows only https or loopback http |

**Changed trust boundary:** the `mcp` function now opens key copies. Until now only the `key`
function did that. Supabase function secrets are project-wide, so `KEY_COPY_SECRET_<n>` was already
in the mcp function's environment, but the code that can open a copy now sits in a larger function.
The other option is an internal call to the `key` function. It was turned down because it needs a
new shared secret, and it moves the same risk to a network hop. Worth a second look in review.

**Consent phishing:** someone starts a sign-in from their own ChatGPT and sends the link to someone
else. That risk is the same as before (the old flow also signed in and approved). The frame still
says "This request comes from chatgpt.com. Allow it only if you started this." The AI's name shows
as text only, never as a mark. That follows the 2 October rule for showing an AI's name or icon on
the web page.

## Tests

- `supabase/functions/mcp/oauth_browser.pglite.test.ts` (new, added to CI's list): 12 passed. It
  covers each refusal above, the code working once, the key reaching the tokens, and the code itself
  never being stored.
- `oauth.pglite.test.ts`: 71 passed. The label assertion was updated for the new field.
  `key/key.pglite.test.ts`: 22 passed.
- Site: `pnpm test`, 82 files and 719 tests passed (`BrowserConnect.test.tsx` is new, 10 tests).
  `pnpm typecheck` and `next build` are clean.
- App: `scripts/prepush.sh --tests` passed (104 tests, 0 failed). The new `ConnectBrowserTests` pass.
- End to end on the local stack: ChatGPT's real register and authorize, the email code read from
  Mailpit (no real send), Allow, and a redirect with a code that `/token` exchanged for read-and-edit
  tokens. The run is recorded.

## Performance, storage, network

There are no new client requests on the app's paths. The page adds `/auth/v1/otp`, `/auth/v1/verify`,
`/connect/request` and `/connect/allow`, one each per connection. On the server, one Allow costs one
AES-GCM open, one wrap and one transaction. Nothing was measured on staging.

## Before it ships

1. **Nothing deploys while the 1.2 builds are in App Review.** Their review notes say each connection
   is approved on the device with Face ID ("approved per connection on their device with Face ID").
   The demo account has a key copy, so a reviewer would see the web consent instead.
2. Deploy the functions to staging, set `CONNECT_IN_BROWSER=on` there, and run the measured gate.
3. Then do production: the migration first, then the functions, then the site, and turn the switch
   on last.

## Wording that must change when the switch goes on

- `docs/appstore/metadata.md`: the reviewer notes, section 4 ("approved per connection on their device
  with Face ID"), promotional line 59 ("You approve every AI connection on your device"), and screenshot
  4's caption ("You approve it on your iPhone").
- `docs/appstore/metadata-mac.md` line 53, the same bullet.
- `README.md` lines 65 and 104, and the architecture table's "approve in the app or on the web".
- Privacy policy, in `docs/privacy-policy.md` and `web/content/privacy-policy.md` (lines 13 and 171):
  "approve it on your iPhone or Mac". Name the key copy's role: the server opens it to connect the AI
  you allow.
- `web/lib/privacy.ts` lines 14 and 58 (the privacy and security page).
- `web/app/help/questions.ts` lines 19 and 29.
- `web/app/open/connect-ai/page.tsx` line 21 ("type the number the page shows").
- `docs/support.md` and `web/content/support.md` line 14.
- `plugins/amber-notes/README.md` and `plugins/grok/pinto-notes/README.md` (what the browser shows
  after sign-in).
- The ChatGPT plugin and Claude directory listings, if their descriptions or test notes describe app
  approval.
- `web/lib/seo.test.ts` line 389 checks the approve-on-device claim; update it with the copy.
- The changelog entry for the release that turns it on.

## Changed on this branch since (29 October, later)

- The web consent is in the Mac's wide Allow sheet layout, with no number; its button reads Don't Allow.
- The connect pages (/connect, /open/connect) follow the system: the cream in light, pure black in dark.
- The app's Connect an AI sheet: "ChatGPT opens Pinto Notes in its apps. Click Connect, then sign in and
  choose Allow on the Pinto Notes page." The button is Open Pinto Notes in ChatGPT. The Shared with OpenAI
  line is unchanged.
- `ChatGPTPlugin.listed` is now the published plugin's page, so the app's other ChatGPT guide
  (ConnectWebGuide.chatgpt) is its one-page listing version too, for every account.
