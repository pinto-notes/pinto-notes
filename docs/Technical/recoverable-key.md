# The recoverable key: a copy of your key that signing in opens

Status: built, not live. The server side is in `supabase/functions/key` and `supabase/migrations/20261011120000_key_copy.sql`, switched off unless the function's `KEY_COPY` secret is `on`. Until it is on, everything works as `e2ee-design.md` describes.

## Why

Since 1.1 an account's data key (DK) lived only on the person's devices. A device without it had to be added from one that had it, or opened with a recovery key that nothing asked anyone to save. With neither, the only way on was Start fresh, which deletes the notes. People got locked out of their own notes and nobody could help them.

So an account is now one of two kinds:

| | Standard (the default) | Advanced protection (strict) |
|---|---|---|
| Notes on the server | Encrypted with DK, as before | The same |
| Who holds DK | The person's devices, and the server keeps a sealed copy | The person's devices only |
| A new device | Signs in and gets the key | Is added from another device, or uses the recovery key |
| Can we open the notes | Yes, with the function's secret and the database | No |
| Can we help someone back in | Yes: they sign in | No |

Nothing about how notes are sealed changes: the same DK, key id, verifier, boxes and wraps. AI connections and shared-note keys are untouched.

## The copy

`account_key_copies.sealed` holds DK and the recovery key (48 bytes), so a device that gets the copy holds what every other device of the account holds:

```
amb2k.<secret version>.<base64 nonce (12) ‖ ciphertext ‖ tag (16)>     AES-256-GCM
key = HKDF-SHA256(KEY_COPY_SECRET_<version>, salt "amber-notes/e2ee", info "key-copy <user id>")
AAD = "amb2k|<version>|<user id>|<key id>"
```

- `KEY_COPY_SECRET_<n>` is an Edge Function secret (32 random bytes, base64). It is not in the database, not in the repository and not readable from SQL. Supabase function secrets belong to the project and not to one function: every function of ours (`mcp`, `account`, `share-files`, `lifecycle` and the rest) has it in its environment, and all of them reach the database through the same connection. Only `key` uses it. A bug in any of them that runs code or leaks the environment is every standard account's key; `mcp` takes untrusted input and is the first place to look. Keeping it apart for real means the `key` function in a Supabase project of its own, which is not built. The table alone opens nothing (`key.pglite.test.ts`, "the table without the function's secret opens nothing").
- The account and the key id are in the key derivation and the AAD: a row moved to another account, or kept past a Start fresh, does not open.
- No API role can read the table, the service role included. Edge functions connect to the database as `postgres`, which can; only the `key` function's code does.
- Before a copy is stored, the function checks it is the account's key: the key id, the verifier, and that its recovery key opens the account's recovery wrap. Before a copy is handed out, it checks again.
- Supabase Vault was considered and not used: its root key is outside a dump, but anyone with live SQL access as `postgres` reads `vault.decrypted_secrets`. That is the key in the same database.

### Rotating the secret

Secrets are numbered. The function seals with the highest number present and opens with any that is present. To rotate: set `KEY_COPY_SECRET_<n+1>`, run `scripts/key-copy-rotate.ts` (it seals every older row again), check it reports no unreadable rows, then unset the old secret. A copy is also sealed again whenever it is used.

If a secret is lost, its rows can never be opened. Delete them (`delete from account_key_copies where secret_version = <n>`); every device that holds the key stores a new copy the next time it opens. A function that merely lacks a secret by mistake never deletes anything: it answers `unreadable` and leaves the row.

## The function

All requests carry the person's normal session (`Authorization: Bearer <access token>`), which the function checks with the auth server. The account is whoever the token says. There is no way to name another account.

| Request | Answer |
|---|---|
| `GET /functions/v1/key` | `{on, pub, ticket}`: a P-256 public key to seal a copy to, and the ticket to send back with it |
| `POST {op: "store", ticket, box, choose, platform}` | `{stored: true}` |
| `POST {op: "fetch", pub, platform}` | `{sealed, key_id, generation}` |

Refusals are a status and a short `hint`: `sign_in` (401), `off` (503), `rate` (429), `no_key` and `no_copy` (404), `strict` and `not_chosen` (409), `wrong_key` and `bad_request` (400), `paused_after_reset` with `until` (403, only while a hold is set), `unreadable` (503).

The account is whoever the session says. No field of the body, no header and no part of the address is read as an account (`key.pglite.test.ts`, "nothing in a request names another account").

### On the way

The key never crosses the network in the clear, in either direction, even inside TLS. It is sealed to a P-256 key of the receiving side:

```
amb2t.<base64 sender's ephemeral public key (65, uncompressed) ‖ nonce (12) ‖ ciphertext ‖ tag>
key = HKDF-SHA256(ECDH shared secret, salt "amber-notes/e2ee", info "key-copy <up|down> <user id>")
AAD = "amb2t|<up|down>|<user id>|<key id>"
```

- **Getting the key (`down`)**: the device makes a key pair for the request and sends the public half. A recorded request sent again returns a box only that device can open.
- **Storing a copy (`up`)**: the function hands out a public key with a ticket, which is the matching private key sealed under the function's secret, good for 5 minutes and for that account. No server has to remember anything between the two requests.

These are P-256 ECDH, HKDF-SHA256 and AES-256-GCM, which WebCrypto, Android and Windows all have. A client on any platform needs HTTPS and nothing else. `supabase/functions/_shared/keycopy-vectors.json` pins both boxes; the Deno tests and the Swift tests check the same file.

This guards against logs, relays and proxies holding a key. It does not guard against whoever runs the TLS endpoint, who could swap the public key.

### Who gets the key

A signed-in device of a standard account, unless:

- **A hold after a password reset is set, and the password was just reset.** There is no hold by default: a person who resets their password and signs in gets their notes, which is the point of the copy. The function secret `KEY_COPY_HOLD_HOURS` (0 to 720, default 0) turns one on without a deploy: `supabase secrets set KEY_COPY_HOLD_HOURS=72`. While set, a new device gets the key only that many hours after a password change or a sign-in by emailed link (`account_recoveries`), and the app shows a screen that says when. A device that already holds the key is not affected, and adding the device from another one still works at once.
- **Too many tries.** 5 fetches an hour and 20 a day per account, 30 requests a minute per address. The address is counted before the session is checked, so made-up tokens from one place never reach the auth server more than that. The account's count and the row that says "fetched" are taken in one transaction under a lock on the account, so fifteen requests sent at once get five answers and five emails.
- **The session's sign-in is older than an hour.** A new device asks seconds after signing in. A session signed in to longer ago than `KEY_COPY_SIGNIN_HOURS` (a function secret, 1 to 720, default 1) is refused with `reauth` (403), however often it was refreshed since: the time is the newest sign-in in the token's `amr` claim, as `pane_signed_in_at()` reads it. So a stolen access or refresh token from an old session, a token from a device backup, and a refresh token read out of a copy of the database do not get the key. The cost: a device that waited at the linking screen for more than an hour (an account from before, whose other device had not answered yet) shows "Sign in again to open your notes" with one button.
- **The mode is not exactly `standard`.** A copy row beside no choice can only be a write to the database, and is not handed out.
- **The account is strict**, or has not chosen yet (below).

Each store, fetch, removal and refusal to an account is a row in `key_copy_events` (kept 12 months, readable by the account, in the data export) and a log line of a few fixed words (`_shared/log.ts`). Refusals are rows up to 30 an hour per account and log lines always. A request with no valid session belongs to no account, so it is a log line only. Neither ever holds key bytes, a ticket or a box (`key.pglite.test.ts`, "no row of the log of what happened and no log line ever holds key bytes"). A fetch also writes the notice "A new device opened your notes" to every device of the account and sends an email to its address. What became of the email is a row too (`mailed`: `sent`, `logged`, `failed` or `off`). With the function secret `KEY_NOTICE_SEND=log` the email is rendered and written to the function log (its subject, length and a hash, never the address) and Resend is not called: staging is set so, because Resend's daily quota is shared with production. Unset, it sends.

## Choosing

`account_key_protection.mode` is `standard` or `strict`. No row means an account from before this, which has not chosen: it has no copy and nothing stores one until the person says so on a device that holds the key.

- A store with `choose: true` (the person chose, or the account is new) stores the copy and sets `standard` in one transaction. Without `choose`, a device only renews the copy of an account that is already standard. The mode is read again inside that transaction, under the lock `keep_key_on_devices` takes: an account that is strict by then gets a copy only when the choice was to turn strict off, which the app says by sending the mode it saw (`from: "strict"`). A renewal that raced the switch, a device that had not heard, and a recorded store sent again all leave it strict. A ticket stores once (`key_copy_tickets` keeps its hash for as long as it lives).
- `keep_key_on_devices(device)` (Advanced protection in the app) sets `strict` and deletes the copy in one transaction. It is plain SQL, with no function and no secret, so removing a copy never depends on the function being up. It is refused unless a recovery key was saved or another device that lists itself as holding the key was seen in the last 30 days. It is also refused for 72 hours after a password reset, the same pause as Start fresh and Delete Account (`pane_reset_pause_until`): it takes away a way back, and someone who got into the mailbox must not be able to do that to a person whose only device is gone. And it needs a sign-in from the last 10 minutes, as Start fresh does, so an old or stolen session cannot remove the copy. All three conditions apply only when there is a copy to take away: an account from before, which has none, can always answer "keep my key on my devices only". The recovery key and other device conditions are what the app reports and the server cannot check (`mark_recovery_key_saved` and `key_devices` rows are written by clients); they keep an honest app from locking its person out and stop no attacker.
- The mode survives Start fresh. The copy does not: it goes with the key.

`account_key_state()` now also returns `protection`, `copy` (whether a copy of the current key is kept) and `protection_paused_until` (until when Advanced protection can't be turned on after a password reset, null when nothing holds it; the app says it under the switch). Builds from before ignore all three.

## Who can read notes now

Plainly, for a standard account:

- **We can.** Whoever holds the function's secret and can read the database: the person running Pinto Notes, Supabase as the platform, and anyone who takes over the Supabase account, its access token or the deploy path. Before this, the same people could reach an account only while an AI connection of it was in use.
- **Anyone we are legally compelled to give them to.**
- **Anyone who can sign in as the person**: a guessed or phished password, a taken-over mailbox (a password reset is enough, at once, unless a hold is set), a taken-over Apple or Google account. The account password is now the only thing between such a person and the notes. The notice on every device and the email say it happened; they do not stop it.
- **Code running in any of our Edge Functions**, since they all hold the secret and the database connection (above).
- **Someone with write access to the live database, the service role key or the JWT secret**, because they can make a session as anyone and ask for the key as a device would. The notice and the email make that visible; nothing prevents it.

Who still cannot:

- Someone with only the sealed table, or an old copy of the database. The sealed rows open with nothing a copy holds.
- A copy of the database is not harmless, though. `auth.refresh_tokens` holds refresh tokens in the clear, and a session is what gets the key. What stands in the way is the one-hour rule above: a session from a copy gets the key only if its sign-in was in the last hour when it asks, so a copy older than an hour gets nothing that way. Someone with live read access can do more (ask for a password reset for an address and read the recovery token's hash out of `auth`, as we understand Supabase Auth; not tried), then sign in as that person, and a fresh sign-in gets the key. Count live read access to the database as access to every standard account's notes, with the notice and the email as the trace.
- Someone on the network.
- For a strict account: everyone above. Nothing changed for it.

## Rolling it out

1. The migration and the `key` function, with `KEY_COPY` unset. Old builds never call either.
2. App builds that ask, store and fetch. With the switch off they behave as before.
3. On one day: the privacy policy and the site, then `KEY_COPY=on`, then the email to existing accounts.

Turning it back: `KEY_COPY=off` stops storing and handing out at once (copies stay sealed, devices fall back to Add a device). Deleting the rows of `account_key_copies` and the secret returns the server to holding no key material, and is not a clean way back once it has been on: anyone who lost their device, or used Sign Out and Remove Notes because we kept a copy, has no other way to their notes. Delete rows only for accounts whose devices are known to hold the key, or after telling people.
