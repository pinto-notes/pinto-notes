# Privacy Policy

Last updated: 27 October 2026

## The short version

- Pinto Notes was called Amber Notes until October 2026. Same app, same service, and this policy covers both names.
- Your notes are yours. Your notes, their titles, folder names, file names and files, and earlier versions are encrypted on your iPhone or Mac with a key only your devices hold, before they're uploaded. We store the encrypted copies so they sync, and we can't read them.
- Some details stay readable to us, such as your email address, dates and sizes, and how your notes are organized. The section on end-to-end encryption lists all of them, and its limits.
- No ads and no tracking, and we never sell or share your data. Versions of the apps after 1.2 send error and crash reports and a few usage counts to PostHog in the EU, never your notes or anything you write. One switch in Settings turns it off. Version 1.2 and earlier send none of this.
- The website counts page views and where visitors came from with Vercel Web Analytics, and which links and buttons are clicked, where on a page people click and how far pages are scrolled with PostHog, in the EU. These are counted across all visitors. Neither keeps a profile of you, and neither runs on shared notes or the connect pages. Vercel never uses cookies. PostHog uses none either, unless you choose Accept on the website's cookie banner: then it keeps one cookie for up to a year, so it can recognise your return visits, and records your visits to the website's public pages as session replays: what the pages showed and where the pointer went, never what you type. It also counts Mac downloads as daily totals. None of this touches your notes or your computer.
- We count how features are used on our own server to improve the app. We never share or sell it.
- An AI assistant can only read your notes if you connect it and approve it on your iPhone or Mac, or with your recovery key on pintonotes.com. While it works, our server opens the notes it asks for in memory. You can disconnect it at any time.
- In versions of the apps after 1.2.3, a note can hold a small app that your AI makes. To build and check it, our server sends the app's code, and a stand-in for the note with its words and numbers replaced, to a render service we run at Railway. Your real note is never sent there.
- A note you lock is encrypted a second time with your notes password. Not us and not an AI can read its text.
- A note you share can be read by anyone with its link, and by us, until you stop sharing.
- Your data is stored in the European Union (Frankfurt, Germany).
- **Settings → Privacy & Security** lets you export your notes, and **Settings → Delete Account** deletes your account and everything in it.
- We keep as few logs as we can, for as short a time as we can. The section on logs lists every one.

## Who we are

Pinto Notes is made by Emil Wagman, an individual developer in Sweden. He is the controller of the personal data described here. Questions about privacy go to **hello@pintonotes.com**.

This policy covers the Pinto Notes apps for iPhone and Mac, the service that lets AI assistants connect to your notes, and the website at pintonotes.com, including shared note pages.

## What we collect

**Your account**

- **Sign in with Apple:** Apple gives us an identifier for your account and an email address. If you choose Hide My Email, we only ever see Apple's relay address. We never see your Apple ID password.
- **Sign in with Google:** Google gives us an identifier for your Google account, its email address, your name and the address of your profile picture. We ask Google for nothing else: not your contacts, files, mail or calendar. We use these only to sign you in. We never see your Google password.
- **Email and password:** your email address and a one-way hash of your password. We never store the password itself.
- **Sign-in records:** when you sign in, the sign-in service records the time, your email address and the IP address of the request, to keep your account secure. We delete these records after 30 days. While you're signed in on a device, that sign-in also keeps the IP address and device type from its last refresh, until you sign out or delete your account.

**Your profile, if you set one**

- The name and photo you choose in Settings. Photos are cropped, resized, and stripped of location and camera data on your device before they're uploaded.

**Your notes, encrypted**

- Your notes, folders, checklists, tables, and the images and files you add, and earlier versions of each note, so a change can be undone: up to 500 per note. We receive them only encrypted (see End-to-end encryption below). Each version records whether it came from the app, an AI connection, an import or a restore.
- With each note, file and version we also store, readable: its size and dates, its folder, its parent note if it's a sub-note, whether it's pinned or locked, and which device or AI app wrote it.

**Your encryption key, locked**

- Your notes' key is made on your first device and kept in your iCloud Keychain. We never receive it in readable form.
- We store a short identifier of the key and a check value that lets your devices confirm they have the right key. Neither can be used to read your notes.
- Your recovery key is a key you save yourself. We store your notes' key locked with it, so a device can get your key with the recovery key. We never receive the recovery key.
- Each AI connection you approve gets a copy of your notes' key, locked with a key derived from that connection's access token, which we store only as a hash (see AI connections).

**Your devices**

- The devices signed in to your account, so they can approve AI connections and keep your key in step.

**Locked notes, if you lock any**

- A locked note's text is encrypted on your device with a key made from your notes password (AES-256-GCM, with the key derived by PBKDF2) before it's uploaded, and its title is encrypted with your notes' key like every other title. Files and sub-notes can't be put in a locked note.
- To let your devices check the password, we store a random value (a salt), a small encrypted test value, and the password hint you write. We never receive or store the password or the key. On your device, the key can be kept in the Keychain so Face ID or Touch ID can unlock your notes; it never leaves the device.
- Locking a note deletes its earlier versions from our servers. While it's locked, earlier versions are kept only in encrypted form, and changing your notes password removes the versions encrypted with the old one.
- If you forget your notes password, we can't recover your locked notes.
- Once you have a notes password, older versions of the app can't sync until they're updated, so they can never upload a readable copy of a locked note.

**AI connections, if you make any**

- For each connection: its name, whether it may edit or only read, when it was created and last used, its access token, stored only as a one-way hash, and its locked copy of your notes' key.
- For connections made by signing in from ChatGPT, Claude or another assistant, also the name and return address the assistant registers, and short-lived access and refresh tokens, stored as one-way hashes.
- While a connection is being approved from a browser: which account asked, when, a description of the browser (such as "Chrome on a Mac"), the browser's public key, and the approval sealed to that browser until it picks it up.

**Shared notes, if you share any**

- The link, which note it shows, whether sub-notes are included, and a readable copy of the note (with its included sub-notes and files) that your device publishes for the link. The copy is deleted when you stop sharing.

**Reports about shared pages**

- If someone reports a shared page: the page's link, the reason they give, any contact details they choose to add, and a one-way hash of their network address made with a secret key that changes every month, so one person can't report a page many times. We don't store the address itself, and we blank the hash after 30 days.

**How the app is used**

We count how features are used on our own server to improve the app. We never share or sell it. That means:

- how many notes an AI connection changed on each day;
- which steps of the first-run setup you've completed;
- if you answer it, how you heard about Pinto Notes: the choice you tap, and any words you add under Something else. We only look at it added up across accounts;
- a random identifier for each installation of the app and its platform (iPhone or Mac), to count how many devices an account uses. It isn't linked to your device's hardware or advertising identifiers.

**Diagnostics and usage from the apps**

Versions of the iPhone and Mac apps after 1.2 report on themselves, so we find out when something is broken instead of waiting for someone to write to us. Version 1.2 and earlier send none of this. They send:

- **errors:** that a step failed and its error code, such as a save to the Keychain that was refused, a sync that keeps failing, or a sign-in that didn't work;
- **crashes and hangs,** from Apple's own diagnostics: the kind of crash and where in our code it happened, as numbers;
- **a few events:** that the app was opened, that you signed in or signed up and how (Apple, Google or email), which screen you saw while a new device was getting your key, your first note and first sync, that an AI was connected (Claude, ChatGPT or other; never its name or address), and the first time you opened a note an AI had changed;
- **speed:** how long the app took to open and to sync, and roughly how many notes you have (as a range such as 11 to 100, never the number).

With each: the app's version, whether it's the App Store app or the Mac download, the kind of device (such as iPhone or Mac), the system version, and your account's identifier, so we can tell that one account keeps hitting the same problem. Before you sign in, a random identifier is used instead, made new each time the app starts and never stored on your device.

They never send your notes, titles, folder or file names, what you search for, anything an AI wrote, your email address, your recovery key or any other key, or your device's name. An event can only hold numbers, yes or no, and words from a fixed list. The full list of events is in the open at [github.com/pinto-notes/pinto-notes](https://github.com/pinto-notes/pinto-notes/blob/main/docs/Technical/app-telemetry.md).

The reports go to PostHog, hosted in Frankfurt, Germany (EU). PostHog keeps no profile of you, works out no location from them, and records no screens. They are on unless you turn them off: **Settings → General → Share diagnostics and usage** turns all of it off, and nothing is kept or sent while it's off. The app says so under the sign-in form. Like every request, a report reaches PostHog from your IP address; PostHog is set not to keep it.

**Emails we send you**

- **Account emails:** the code that confirms your email address, password reset links, and a notice when your password or email address changes.
- **Onboarding emails:** a welcome email a couple of minutes after you sign up, then at most six short emails from Emil in your first 30 days, each about one next step in the app. Every one has a "Stop these emails" link, and using it stops them all. They go only to a confirmed email address.
- **How we pick them:** from what your account has done so far, such as how many notes it has, which kinds of device it uses, whether an AI is connected, and which features have been used. Never from what's in a note.
- **What we record:** which of these emails were sent to you and when, whether you unsubscribed, that you replied to one (the time, not what you wrote), and, if you click a link in one, which email it was in and the page the link leads to.

**Visits to the website**

- **Page views,** with Vercel Web Analytics: which page was viewed, the site you came from, and your country, browser and type of device. It uses no cookies and stores nothing on your device, and it doesn't identify you or follow you to other sites. Vercel tells visits apart for a day with a hash it doesn't store. Shared notes, the connect pages and report pages are never counted, and page addresses are counted without anything after them, such as a code in a link.
- **Clicks and scrolling,** with PostHog, hosted in Frankfurt, Germany (EU): which pages were viewed, which links and buttons were clicked on them (such as Download for Mac, Use template, or a link to the App Store or GitHub), how far down each page you scrolled, the site you came from, and your browser and type of device. On the home, download, templates, blog, help, changelog and Privacy & Security pages it also notes where on the page each click landed, and clicks that did nothing or were repeated on one spot, so we can see which parts of a page people try to use. These are added up across all visitors into a map of each page. Unless you accept cookies, it uses no cookies and stores nothing on your device. Like Vercel, it then tells visits apart for a day: PostHog's servers make a one-way hash of your IP address and browser details together with a random value that changes every day and that PostHog deletes once that day's visits are counted. The next day gives a different hash, so visits on different days can't be linked. If you choose Accept on the website's cookie banner, PostHog instead keeps a random identifier in a cookie on pintonotes.com for up to a year, so your visits on different days count as the same visitor. That lets us see, for example, that someone who read a blog post came back a week later and downloaded the app. The identifier is random and isn't linked to your name, email address or account. You can change your answer at any time with Cookie settings at the bottom of every page, and choosing Reject deletes the cookie. Either way, it keeps no profile of you, records no keystrokes, and is set not to keep your IP address. If you choose Accept, PostHog also records your visit as a session replay: what each public page showed you, how far you scrolled, and where the pointer moved and clicked, so we can see where a page loses people. Everything typed into a field is masked in your browser before anything is sent, and so is text in any part of a page marked private; console logs, network requests and canvas drawings aren't recorded. A replay is never made on shared notes, the connect pages, password reset, account or report pages, or the links that open the app, and never if you reject, don't answer the banner, or your browser sends Do Not Track or Global Privacy Control. Choosing Reject stops a recording at once. Without Accept, no visit is recorded or replayed. It never runs on shared notes, the connect pages, report pages or the links that open the app, page addresses are sent without anything after them, and it doesn't run at all if your browser sends Do Not Track or Global Privacy Control.
- **Mac downloads,** as one total per day: the date and a number. Nothing about who downloaded, not even a network address. Updates the Mac app installs itself aren't counted.
- None of this touches your notes or your computer, and none of it is linked to your account.

**What we don't collect**

- No advertising identifiers, no location and no contacts. The apps link no analytics or crash-reporting SDK: crash reports come from Apple's own diagnostics, and the app sends its reports itself (see Diagnostics and usage from the apps).
- We never receive your notes' key, your recovery key or your notes password in readable form, except that during an AI connection's requests our server unlocks your notes' key in memory (see AI connections).
- The Apple Notes import runs on your Mac, and only the notes you choose are uploaded. If you turn on "Also bring over pinned notes", the app reads only which notes are pinned, from a temporary copy of the Notes database on your Mac, and deletes the copy straight after.

## Why we use it

We process personal data under the EU General Data Protection Regulation (GDPR) on these legal bases:

| What | Why | Legal basis |
|---|---|---|
| Account, profile, encrypted notes, files and versions, devices, AI connections, share links | To provide the service: store and sync your notes, and answer the AI apps you connect | Performance of a contract |
| Sign-in records, rate limits, hashed network addresses, request logs | To keep the service secure and stop abuse | Legitimate interests |
| Reports about shared pages | To review and remove content that breaks our Terms | Legitimate interests, and legal obligations where they apply |
| Feature usage counts | To learn whether the app works for people and improve it | Legitimate interests |
| Diagnostics and usage from the apps | To find and fix errors, and to learn where people get stuck | Legitimate interests. You can turn it off in Settings at any time |
| Account emails | To confirm your address and keep your account secure | Performance of a contract |
| Onboarding emails, and the record of which were sent and clicked | To help new users get started, and to not send the same email twice | Legitimate interests; you can stop them at any time |
| Website page views, clicks and scroll depth, counted without cookies, and daily download totals | To learn how people find the website, which pages help, and how many download the app | Legitimate interests |
| Recognising your return visits to the website with a PostHog cookie, and session replays of its public pages, only if you accept | To see which pages bring people back, where a page loses them, and what leads to a download over several visits | Consent, which you can withdraw at any time with Cookie settings |

We don't use your data for advertising. The only emails about Pinto Notes we send you are the ones described above. We don't make automated decisions about you with legal or similarly significant effects.

## End-to-end encryption

**What's encrypted.** Your notes, their titles and previews, folder names, file names and files, and every earlier version are encrypted on your iPhone or Mac (AES-256-GCM) with a key only your devices hold, before they're uploaded. iCloud Keychain, which Apple encrypts end to end, carries the key between your iPhone and Mac. Your recovery key is the fallback when a device can't get it from iCloud Keychain. We store only the encrypted copies, and we can't read them. Signing in, with Apple or a password, only identifies you; your password has nothing to do with the key.

**What stays readable to us:**

- your email address and sign-in records;
- your profile name and photo;
- your notes-password hint;
- the size and dates of each note, file and version;
- the folder and sub-note tree: which folder each note is in, and which notes are sub-notes of which;
- which notes are pinned, and which are locked;
- the names of the AI apps that edited a note;
- your list of devices;
- your AI connections;
- the usage counts described under How the app is used;
- the diagnostics and usage reports described under What we collect;
- a note you share, while it's shared.

**Limits.** End-to-end encryption doesn't cover everything, and we'd rather say so:

- **AI requests.** While an AI you connected works, our server unlocks your whole notes' key in memory and handles the text the AI asks for (see AI connections). A changed server could copy it.
- **Apps your AI makes.** To build and check an app, our server sends its code, in readable form, to a render service at Railway, with a stand-in for your note, never the note itself (see Notes that are apps).
- **The recovery key in the browser.** Approving on pintonotes.com with your recovery key runs our code in your browser. The page never stores the recovery key or your notes' key or sends them to us, but a changed page could read them. When you can, approve from your iPhone or Mac instead.
- **No key rotation yet.** Your notes' key stays the same for the life of your account.
- **The database.** Someone running the database can't read your notes, but could roll a note back to an earlier encrypted version, or hide notes from your devices.

## AI connections

Nothing reaches an AI assistant unless you connect one. When you connect ChatGPT, Claude, Claude Code, Codex or another assistant:

- You approve the connection on your iPhone or Mac and choose **read only** or **read and edit**. When you start from a browser, the page shows a number and your device asks you to tap the same one. With no device nearby, you can approve on pintonotes.com with your recovery key.
- Approving gives that connection a copy of your notes' key, locked with a key derived from that connection's access token. We keep only a hash of the token; the token itself arrives with each of the assistant's requests. During each request, our server unlocks your whole notes' key in memory, decrypts the notes the assistant asks for, encrypts any change it makes, and forgets the key when the request ends.
- For those requests, the text the assistant reads or writes, and its access tokens, pass through our hosting providers Vercel and Supabase in readable form on their way. Neither stores your notes.
- The assistant can read the notes it asks for and, if you allowed editing, change them. Every change it makes keeps the previous version, so you can undo it.
- The notes the assistant reads, with their text and the files it opens, are sent to the company behind that assistant: OpenAI for ChatGPT and Codex, Anthropic for Claude and Claude Code, or the company that makes any other assistant you connect. That company handles them, and everything else you and the assistant exchange, under its own privacy policy. Notes it reads become part of your conversation with it.
- You can disconnect any assistant at any time in **Settings → Connect an AI**. It loses access immediately, and its copy of your notes' key is deleted.
- Locked notes are encrypted with your notes password, which our server never has, so an assistant sees only their titles. It can't read, search or change them.

## Notes that are apps

In versions of the apps after 1.2.3, a note can hold a small app (a habit tracker, a budget) that an AI you connected makes for it. Nothing in this section happens unless you connect an AI and it makes or changes an app.

- **Where an app and its data live.** The app's code and everything the app saves are encrypted like your notes, and we store only the encrypted copies. As with any AI request, our server handles them in readable form in memory while your AI works on the app (see AI connections).
- **What an app can reach.** An app runs inside Pinto Notes. It sees the one note it belongs to and its own data, not your other notes, your keys or your account, and it has no connection to the internet of its own. If it asks to reach an address, Pinto Notes asks you first, then makes the request itself, straight from your device to that address, and lists what was sent in the note's **App Info**. What that service does with it is under its own privacy policy; we don't see it. If an app asks to open a link, you see the whole address first, every time. An app can't use your calendar, reminders, contacts, camera, location or notifications.
- **Building and checking an app.** Our server can't build an app or open one in a browser itself, so it uses a render service that we run at Railway. Each time your AI saves a change to an app, and each time it asks for a check or a picture of one, our server sends that service the app's code. To have something to show in the app, it also sends a stand-in for your note and for the app's data: the same layout, with every word and number replaced by a made-up one. Headings, the names of table columns and the names of the app's data fields are kept as they are. The service keeps nothing once it has answered, and logs only the time, how long the work took and how big the request was.
- **The code is your AI's.** If your AI writes something from your notes into an app's code, it is part of the code, and goes to the render service with it.
- **Your real note is never sent there.** A check or a picture of an app always uses the stand-in. Our server refuses to send the render service a real note or an app's real data.
- **Packages.** An app can use open-source code packages. Most come inside Pinto Notes. For any other, your device downloads the package once from jsDelivr (cdn.jsdelivr.net), a public service for such packages. jsDelivr sees your device's IP address and which package was asked for, and nothing of your notes or your account. Our server and the render service look packages up there too.
- **When an app doesn't open.** If a version of an app fails to open on your device, the device goes back to the version before and sends us the error message it got, up to 1,000 characters, with whether it was an iPhone or a Mac. This message is not encrypted, so that your AI can be told what broke, and it can quote a few words of what the app was showing. It's deleted with the note or your account.
- **API keys** you add for apps (**Settings → API Keys**) stay in your device's Keychain, and in iCloud Keychain if you use it. We receive only each key's name and the addresses it may be sent to, encrypted like your notes.

## Shared notes

- A note you share becomes a web page at pintonotes.com. Your device publishes a readable copy of it for the page, and that copy is stored on our server. So the shared note isn't end-to-end encrypted while it's shared: anyone with the link can read it, and so can we, until you stop sharing. Changes, including an AI's, show on the page after your device's next sync. Anyone with the link can read it without signing in, and the link may be passed on.
- The page shows the note, your profile name and photo, and your email address unless it's an Apple relay address.
- Shared pages are hidden from search engines.
- **Stop Sharing** takes the page down at once and deletes the readable copy. Images and files on a shared page are served through links that expire after an hour.
- Anyone can report a shared page. Reports are reviewed, and pages that break our Terms are removed.
- A locked note can't be shared. Locking a shared note stops its link.

## Where your data is stored

| Service | What it does for us | Where | Transfers outside the EU |
|---|---|---|---|
| Supabase (Supabase Pte. Ltd.) | Database, file storage, sign-in and server functions | Frankfurt, Germany (EU). A request to a server function enters Supabase's network at the location nearest its sender and is passed to Frankfurt, where it is handled | Standard Contractual Clauses, in its [data processing agreement](https://supabase.com/legal/dpa) ([sub-processors](https://supabase.com/legal/customer-resources/subprocessor-list)) |
| Vercel, Inc. | The website, shared note pages, the addresses AI apps connect to (mcp.pintonotes.com, and mcp.ambernotes.app for earlier connections), Mac app downloads, update checks, website page view counts | Pages are built in Frankfurt, Germany (EU) and delivered through Vercel's global network | EU-U.S. Data Privacy Framework ([privacy policy](https://vercel.com/legal/privacy-policy), [sub-processors](https://vercel.com/legal/sub-processors)) |
| PostHog, Inc. | Website usage: page views, clicks, where on a page people click, and scroll depth, and, if you accept cookies, recognising return visits and session replays of the public pages. Never on shared notes or the connect pages. From versions of the apps after 1.2: the diagnostics and usage reports, with your account's identifier | Frankfurt, Germany (EU) | Standard Contractual Clauses, in its [data processing agreement](https://posthog.com/dpa) ([sub-processors](https://posthog.com/subprocessors)) |
| Resend (Plus Five Five, Inc.) | Sends our emails: the account emails and the onboarding emails. It receives your email address and the email's text. It also carries the notice we get when a shared page is reported, with the page's link, the reason and any contact details the reporter added | United States | Standard Contractual Clauses, in its [data processing agreement](https://resend.com/legal/dpa) ([sub-processors](https://resend.com/legal/subprocessors)) |
| Railway (Railway Corporation) | The render service for notes that are apps: it builds and checks the apps your AI makes. It receives an app's code and a stand-in for its note, never the note itself (see Notes that are apps). It stores none of it | Amsterdam, the Netherlands (EU) | Standard Contractual Clauses, in its [data processing agreement](https://railway.com/legal/dpa) |
| jsDelivr | Open-source packages that a note's app uses: it receives the IP address of the device (or of our server) and the name of the package | Worldwide, at the server nearest to the request | Under jsDelivr's own [privacy policy](https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net) |
| Apple | Sign in with Apple and the App Store, if you use them | Under Apple's own privacy policy | Apple's own terms |
| Google | Sign in with Google, if you use it | Under Google's own privacy policy | Google's own terms |
| Forward Email and Google (Gmail) | Email you send to hello@pintonotes.com: Forward Email passes it on, and it's read and kept in Gmail | United States | Under each company's own terms |

Your encrypted notes and files are stored only at Supabase, in Frankfurt. Supabase processes them only on our instructions. Our server functions do their work in Frankfurt too. A request to one enters Supabase's network at the location nearest whoever sent it, which can be outside the EU, and is passed to Frankfurt, where it is handled. If Frankfurt can't be reached, a request that only reads is answered where it arrived, and a request that changes something fails so it can be tried again. Vercel handles requests to the website on their way through: it sees a shared note while it shows the page, and the requests AI apps send to mcp.ambernotes.app, including the text of the notes they read or write, but it doesn't store your notes. Either company's support staff could access data from outside the EU; those transfers are covered as the table says.

On top of end-to-end encryption, all data travels encrypted (HTTPS), and Supabase encrypts its disks (AES-256). Each account can only reach its own data: the database enforces this on every request.

## Logs

We don't write the text of your notes, email addresses, access tokens or network addresses into any log of our own. When something fails on our server, the log says where and what kind of error, with names, addresses and ids blanked out.

Our hosting providers keep logs of the requests that reach them. We can't turn these off, but they're kept briefly:

| Log | What's in it | Kept for |
|---|---|---|
| Supabase request logs | For each request to our server: the time, the address it asked for, the IP address and device type it came from, and the approximate location the provider works out from the IP address | 1 day |
| Supabase sign-in logs | Each sign-in and sign-out: the time, the email address and the IP address | 1 day |
| Supabase server function and database logs | When each function ran and what it was asked for, and the errors described above | 1 day |
| Vercel request logs | For each request to the website: the time, the page, the IP address and device type, and whether it worked | 1 hour |
| Vercel performance charts | Counts and timings, without who asked | 12 hours |

Rate limits on sign-in and connection requests count a one-way hash of the IP address, made with a key that changes every day, and delete it after 2 hours.

## How long we keep it

- **Notes you delete** stay in Recently Deleted for 30 days, then they're deleted for good, together with their earlier versions and share links. This happens on our server even if you never open the app again.
- **Earlier versions** of a note: every version from the last 24 hours, then the last one of each hour for 7 days, the last one of each day for 90 days, and every AI change for 90 days. Older versions are deleted. A note keeps at most 500 versions and 10 MB of them; past that, the oldest go first.
- **Files** you add stay until you delete them or your account.
- **Your account** is kept until you delete it. **Settings → Delete Account** removes your account, notes, files, profile photo, versions, AI connections, share links, notes password settings, usage counts, the record of emails we sent you, sign-in records and reports about your shared pages straight away.
- **Usage counts** (AI changes per day, days of use, tips, app installations): 12 months.
- **Diagnostics and usage from the apps:** at PostHog for as long as its plan keeps events (at least a month), or until you ask us to delete them. Deleting your account stops new reports and drops the ones still waiting on your device; it doesn't remove the ones PostHog already holds, so write to us to have those deleted.
- **The record of emails we sent you,** of links you clicked in them and of unsubscribing: until you delete your account.
- **Sign-in records:** 30 days. **Rate-limit hashes:** 2 hours. **Unfinished AI sign-ins and expired access tokens:** a day after they expire.
- **Reports:** the reporter's hash is blanked after 30 days; a report is deleted 12 months after it was made, once it's been reviewed.
- **Logs** at our hosting providers: 1 hour to 1 day, as listed under Logs.
- **Website counts:** page view counts stay at Vercel, and clicks and scroll depth at PostHog, for as long as their plans keep them (at least a month). Daily download totals hold nothing about a person and are kept.
- **Session replays,** only if you accept: kept at PostHog for 30 days, then deleted.
- **The website's cookie,** only if you accept: PostHog's cookie expires a year after your last visit, or when you choose Reject. Your answer to the cookie banner stays in your browser until you clear its data.
- **Your notes' key, locked:** the copy locked with your recovery key is kept until you delete your account or start fresh; each AI connection's copy is deleted when you disconnect it.
- **Browser approvals:** the approval sealed to a browser is kept until the browser picks it up, and the request expires after 10 minutes.
- **Backups:** our current hosting plan keeps no backups of the database, so what's deleted is gone. If that changes, a backup would hold only the encrypted copies and the locked copies of your key, for the period this policy states.

## Your rights

Under the GDPR you can:

- **access** your data and get a copy of it;
- **correct** it (most of it you can edit directly in the app);
- **delete** it, in the app with **Delete Account** or by asking us;
- **take it with you:** **Settings → Privacy & Security → Export Your Notes** makes a zip on your device with every note as Markdown in its folder, with its files. We can't read your notes, so only your device can export them. Ask us for everything else we keep about you, and we'll send it as JSON;
- **object** to processing based on legitimate interests, including the feature usage counts and the diagnostics and usage reports (which you can also turn off in Settings), or ask us to **restrict** it.

Write to **hello@pintonotes.com**. We answer within one month. If you think we've handled your data wrongly, you can complain to the Swedish Authority for Privacy Protection (Integritetsskyddsmyndigheten, IMY) at imy.se, or to the data protection authority where you live.

## Cookies and storage on the website

The website asks before it sets a cookie. Its page view counts (Vercel Web Analytics) never store anything in your browser. Its click and scroll counts (PostHog) don't either, and tell visits apart for a day with a hash made on PostHog's servers, unless you choose Accept on the cookie banner (see Visits to the website). This is everything the website can store in your browser:

- **localStorage, `amber_consent`:** your answer to the cookie banner, 1 for Accept or 0 for Reject, so it doesn't ask again. It's stored only once you answer, and stays until you clear your browser's data. Cookie settings, at the bottom of every page, changes it.
- **Cookie, `ph_<project key>_posthog`, only if you accept:** PostHog's random identifier for your browser, the current visit, and the address and referring site of the first page you opened. It's kept on pintonotes.com only, and expires a year after your last visit. Choosing Reject deletes it.
- **sessionStorage, `ph_<project key>_posthog` and `ph_<project key>_window_id`, only if you accept:** PostHog's note of the current visit in this tab, deleted when you close the tab or choose Reject.
- **localStorage, `pinto_internal`, only on our own devices:** set when a page is opened with `?internal=1`, a link we use ourselves, so our own visits can be left out of the counts. `?internal=0` removes it. Events from browsers run by test scripts are marked the same way. Ordinary visitors never get it.
- **sessionStorage, `amber.connect.pkce`,** only on the page where you connect an AI (pintonotes.com/connect): a one-time code for Sign in with Apple or Google, kept while you go to Apple or Google and back, and deleted as soon as you return.

If your browser sends Do Not Track or Global Privacy Control, we treat it as Reject: the banner doesn't ask, and PostHog doesn't run at all. The banner never appears on shared notes, the connect pages or report pages, and PostHog never runs there.

Everything else on the connect page stays in its memory and is gone when you close it: your sign-in (which it ends when the connection is allowed, declined or expires, or when you close the page), the key and secret it uses to receive your device's approval, and, if you use it, your recovery key. These are strictly necessary for something you asked for, so they're used without asking.

## Children

Pinto Notes isn't directed at children under 13, or in the EU under the age your country sets for consenting to online services (up to 16). If you believe a child has given us personal data, write to us and we'll delete it.

## Security

We encrypt your notes end to end on your devices, encrypt data in transit, store passwords and access tokens only as one-way hashes, limit each account to its own data at the database level, and rate-limit sign-in and connection endpoints. The code is open source, so anyone can check how it works. No system is perfectly secure. If something goes wrong that affects you, we'll tell you as the law requires.

## Changes to this policy

When this policy changes, the date at the top changes. If a change matters to you, we'll tell you in the app before it takes effect.

## Contact

Emil Wagman, Sweden · **hello@pintonotes.com**
