# Privacy Policy

Last updated: 17 November 2026

## The short version

- Your notes are yours. They're encrypted on your device before they're uploaded. We never sell your data, show you ads or use your notes to train AI.
- We keep a locked copy of your notes' key, so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order.
- An AI assistant sees your notes only if you connect it. What it reads goes to the company behind that assistant.
- The apps and the website tell us how they're used and when something breaks, so we can fix and improve Pinto Notes. Never your notes or what you write. You can turn the app's reports off in Settings.
- Your data is stored in the EU, in Frankfurt, Germany.
- You can export your notes or delete your account at any time.

Pinto Notes was called Amber Notes until October 2026. This policy covers both names.

## Who we are

Pinto Notes is made by Emil Wagman, an individual developer in Sweden, who is the controller of the personal data described here. This policy covers the Pinto Notes apps for iPhone and Mac, the service that lets AI assistants connect to your notes, and the website at pintonotes.com, including shared note pages. Questions go to **hello@pintonotes.com**.

## What we collect

**Your account.** Your email address. If you sign in with Apple or Google, an identifier for that account, and from Google your name and profile picture. If you use a password, only a one-way hash of it. The name and photo you choose for your profile.

**Your notes and files.** Your notes, folders, files and earlier versions, which we receive only encrypted. To make sync work we also keep some details readable: sizes and dates, how your notes are arranged in folders and sub-notes, whether a note is pinned, locked or shared, which device or AI made a change, and your notes-password hint.

**Your keys.** Locked copies of your notes' key: one locked with your recovery key, one for each AI you connect and, for most accounts, our own copy (see Encryption). We never receive your notes password.

**Devices and AI connections.** The devices signed in to your account, and the AI assistants you connect, with when each was added and last used. Access tokens are kept only as one-way hashes.

**Sharing.** For a note you share as a web page, a readable copy of it while it's shared. For a note you share with people, who is in it, their roles, and the note's encrypted changes.

**Usage and diagnostics.** How the apps and our service are used, so we can find problems and improve them. For example: which features are used and when, what your AI connections do (such as reading, searching or changing a note), setup steps, errors, crashes and how long things take. With these we record the app's version, the kind of device, the system version and your account's identifier. They never contain your notes, titles, folder or file names, what you search for, anything an AI wrote, your email address or your keys. The app's reports can be turned off in **Settings → General → Share diagnostics and usage**. Our code is open source, and the list of what the apps report is public in it.

**Website visits.** Pages viewed, links clicked and where, how far pages are scrolled, the site or ad you came from, and your browser, kind of device and country. We count Mac downloads as daily totals. Cookies are used only if you accept them (see Cookies and storage on the website).

**Emails.** Which emails we've sent you, and whether you clicked a link in one, replied or unsubscribed.

**Security.** Sign-in records, including the IP address, counters that limit repeated requests, and reports people send about shared pages.

**What you tell us.** Emails you send us, and your answer if you tell us how you heard about Pinto Notes.

We don't collect advertising identifiers, your location or your contacts. The Apple Notes import runs on your Mac, and only the notes you choose are uploaded.

## How we use it

| What we do | Legal basis under the GDPR |
|---|---|
| Run the service: store and sync your notes, sign you in, connect the AI assistants you choose, share what you share | Performance of a contract |
| Keep the service and your account secure, prevent abuse and enforce our Terms | Legitimate interests, and legal obligations where they apply |
| Find and fix problems, and learn how Pinto Notes is used so we can improve it | Legitimate interests. You can object, or turn the app's reports off |
| Send account emails, such as sign-in codes and security notices | Performance of a contract |
| Send a few emails that help new users get started | Legitimate interests. Every one has a link that stops them |
| Learn how people find the website and the app, including which of our ads led to downloads, as totals | Legitimate interests |
| Recognise return visits to the website and record session replays of its public pages | Consent, which you can withdraw at any time |

We don't sell your data, use it for advertising or use your notes to train AI models. We don't make automated decisions about you with legal or similarly significant effects.

## Encryption

- Your notes, titles, folder and file names, files and earlier versions are encrypted (AES-256-GCM) on your device, or in your browser when you use our website, before they're uploaded. All data also travels encrypted.
- **Our copy of your key.** For most accounts we keep a copy of your notes' key, sealed with a secret kept outside our database. We use it for one thing: so that signing in opens your notes on a new device. It means we could open your notes, and so could someone who gets into your account or our hosting account. Each time a new device gets your key, your devices show a notice and we email you.
- **Advanced protection:** we're retiring it, and newer versions of the apps don't offer it. With Advanced protection on, your notes are end-to-end encrypted: we hold no copy of your key, and can't open your notes or help you back in.
- **Locked notes** are encrypted again with your notes password, which we never receive, so neither we nor an AI can read them. If you forget the password, they can't be recovered.
- **While an AI works,** our server decrypts the notes it asks for in memory, and forgets the key when the request ends.

## AI assistants

- Nothing reaches an AI assistant unless you connect one, in the app or on our website. A connected assistant can read and change your notes. Every change keeps the version before it, so you can undo it.
- The notes and files an assistant reads are sent to the company behind it, such as OpenAI for ChatGPT or Anthropic for Claude, and handled under that company's privacy policy.
- You can disconnect an assistant at any time in Settings. It loses access at once.
- An assistant sees only the titles of locked notes.
- **Notes that are apps.** A note can hold a small app that your AI makes. To build and check it, our server sends the app's code, and a stand-in for the note with its words and numbers replaced, to a render service we run. Your real note is never sent there. An app sees only its own note, and can reach the internet only after you allow it.

## Sharing

- **As a web page.** Anyone with the link can read the note, and so can we, until you stop sharing. The page shows your profile name and photo, and your email address unless it's an Apple relay address. Shared pages are hidden from search engines, and anyone can report one.
- **With people.** The note stays encrypted. The people in it can read it, and their AI when they ask. Where we keep a copy of someone's key, we could open the notes shared with them too. If you remove someone, they can't read what's written after, but we can't take back a copy they already made.

## Who we share it with

We use service providers that process data for us under data processing agreements:

- **Supabase:** database, file storage, sign-in and server functions, in Frankfurt, Germany.
- **Vercel:** the website, shared note pages and the address AI assistants connect to.
- **PostHog:** usage and diagnostics, and website analytics, in Frankfurt, Germany.
- **Resend:** sending our emails, in the United States.
- **Railway:** the render service for notes that are apps, in the Netherlands.
- **jsDelivr:** open-source code packages that a note's app uses.
- **Apple and Google:** Sign in with Apple, Sign in with Google and the App Store, if you use them.
- **Forward Email and Gmail:** email you send to hello@pintonotes.com.

We also share data with the AI assistants you connect, with the people you share notes with, and with authorities when the law requires it. Where data leaves the EU, it's protected by the EU's Standard Contractual Clauses or the EU-U.S. Data Privacy Framework.

## How long we keep it

- **Your account, notes and files:** until you delete them or your account. Deleted notes stay in Recently Deleted for 30 days, then they're gone.
- **Earlier versions of a note:** up to 90 days.
- **Usage counts on our server:** 12 months. **Reports from the apps:** at PostHog for as long as we need them for the purposes above, or until you ask us to delete them.
- **Security records:** sign-in records for 30 days, each device's last address while it stays signed in, request logs at our hosting providers for a day or less, and the record of when our copy of your key was used for 12 months.
- **Website:** session replays for 30 days, and the cookie for up to a year.
- **The record of emails we sent you:** until you delete your account.

**Settings → Delete Account** deletes your account and everything in it straight away. To have the reports PostHog already holds deleted too, write to us.

## Your rights

You can access your data, correct it, delete it, take it with you, object to how we use it, or ask us to restrict it. **Settings → Account → Export Your Notes…** saves all your notes as Markdown (on the Mac, **File → Export All Notes…**). For anything else, write to **hello@pintonotes.com**, and we'll answer within one month. You can also complain to the Swedish Authority for Privacy Protection (IMY) at imy.se, or to the data protection authority where you live.

## Cookies and storage on the website

The website asks before it sets a cookie.

- **Your choice** on the cookie banner is kept in your browser, so it doesn't ask again.
- **If you accept,** PostHog keeps a random identifier in a cookie for up to a year, so return visits count as one visitor, and records session replays of the public pages. Anything typed into a field is masked before it's sent. Choosing Reject in Cookie settings, at the bottom of every page, deletes the cookie and stops recording.
- **If you don't accept,** nothing is stored in your browser for analytics. If your browser sends Do Not Track or Global Privacy Control, we treat it as Reject.
- **Signing in** on the page where you connect an AI keeps what it needs only while you're on it.

Analytics never run on shared notes, the connect pages or report pages.

## Children

Pinto Notes isn't directed at children under 13, or in the EU under the age your country sets for consenting to online services (up to 16). If you believe a child has given us personal data, write to us and we'll delete it.

## Security

We encrypt your notes on your devices and all data in transit, store passwords and tokens only as one-way hashes, let each account reach only its own data, and limit repeated sign-in attempts. Our code is open source, so anyone can check how it works. No system is perfectly secure. If something goes wrong that affects you, we'll tell you as the law requires.

## Changes to this policy

We may update this policy. The date at the top shows when it last changed. If a change significantly expands how we use your data or reduces your rights, we'll tell you in the app, on the website or by email before it applies.

## Contact

Emil Wagman, Sweden · **hello@pintonotes.com**
