/// The privacy and security facts, written once for the Privacy & Security page and the home page.
/// Every sentence must be true today; docs/privacy-policy.md is the long form, and
/// docs/Technical/e2ee-design.md is the model as built, with the copy of the key the server keeps
/// for a standard account on top of it. Every claim about encryption on the site is
/// in this file, so the page and the home page can't say more than it does.

export const PRIVACY_PATH = "/privacy-security";

export type Fact = { title: string; text: string };

/// The short list the Privacy & Security page opens with.
export const FACTS: Fact[] = [
  { title: "Encrypted on your devices", text: "Your notes are encrypted on your devices before they sync. We keep a locked copy of your key so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account. With Advanced protection on, your notes are end-to-end encrypted: we can't open them and can't help you back in." },
  { title: "AI only with your approval", text: "An AI app can read your notes only after you approve it on your iPhone or Mac. While it works, our server opens the notes it asks for in memory. Disconnect it at any time." },
  { title: "No ads, no tracking in the app", text: "No ads and no tracking in the apps. They count a few things on our own server, and versions after 1.2 send error reports and a few usage counts, never your notes, to PostHog in the EU; one switch in Settings turns the reports off. This website counts page views and where visitors came from, clicks and how far pages are scrolled, without profiles, without cookies unless you accept them, and never on shared notes, and Mac downloads as daily totals. We never sell or share your data." },
  { title: "Stored in the EU", text: "Your encrypted notes and files are kept in Frankfurt, Germany." },
];

/// The one line under the facts: encryption has limits, and the page lists them.
export const CAVEAT = {
  text: "Encryption has limits. Unless Advanced protection is on, we keep a locked copy of your key. When an AI you connected asks for notes, our server reads them in memory to answer it, and some details about your account stay readable to us. Here is all of it.",
  href: "#limits",
  link: "See the limits",
};

export type Item = { label: string; text: string };

/// "What's encrypted" on the Privacy & Security page.
export const ENCRYPTION: { items: Item[]; note: string } = {
  items: [
    { label: "On your devices:", text: "your notes, their titles, folder names, file names and files, and every earlier version are encrypted on your device before they're uploaded, with a key made on your first device. We store the encrypted copies." },
    { label: "Your key, and our copy of it:", text: "your devices hold the key, and iCloud Keychain carries it between your iPhone and Mac. We keep a locked copy of your key so that signing in opens your notes on a new device, with no other device and no recovery key. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account. The copy is sealed with a secret kept outside the database, so a copy or a backup of the database alone opens nothing. We hold both the secret and the database." },
    { label: "Advanced protection:", text: "a switch in Settings, Security. It is off unless you turn it on. Turning it on needs a saved recovery key or another device, and deletes our copy. With Advanced protection on, your notes are end-to-end encrypted: we can't open them and can't help you back in. Then only your devices, and AI connections you approve, can unlock your notes. A new device gets your key from iCloud Keychain, is added from a device that has your notes, or is opened with your recovery key. If you lose every device and the recovery key, your notes are lost." },
    { label: "Accounts made before we kept copies:", text: "the app asks once, with a sheet titled \"Signing in now opens your notes\", before anything is copied. Continue stores the copy. Keep my key on my devices only turns on Advanced protection. Until you answer, nothing is copied and your key stays on your devices, as before." },
    { label: "Your recovery key:", text: "a key you save yourself, shown in Settings, Security on your devices. It opens your notes without us. We keep your notes' key locked with it. Our copy of your key, while we keep one, holds the recovery key too." },
    { label: "Locked notes:", text: "encrypted a second time, with a key made from your notes password. That key never leaves your devices, so not even an AI you connect can read a locked note's text. If you forget the password, nobody can recover it." },
    { label: "On the way and on disk:", text: "everything travels over HTTPS, and Supabase encrypts its disks as well (AES-256)." },
    { label: "Passwords and access tokens", text: "are stored only as one-way hashes." },
  ],
  note: "Signing in, with Apple, Google or a password, tells us who you are. Unless Advanced protection is on, it is also what lets a new device get your key, and there is no waiting period, also after a password reset. Each time a device gets your key by signing in, every device of yours shows the notice \"A new device opened your notes\", and we send an email to your account's address.",
};

/// "What stays readable to us" on the Privacy & Security page.
export const READABLE: string[] = [
  "your email address and your sign-in records",
  "your profile name and photo",
  "your notes-password hint",
  "the size and dates of each note, file and version",
  "which folder each note is in, and which notes are sub-notes of which",
  "which notes are pinned, and which are locked",
  "the names of the AI apps that edited a note",
  "your list of devices",
  "your AI connections: their names, access, and when they were made and last used",
  "the usage counts listed below",
  "a note you share, while it's shared, since anyone with the link can read it",
];

/// "When you connect an AI" on the Privacy & Security page.
export const AI_ACCESS: Item[] = [
  { label: "You approve it on your device.", text: "Your iPhone or Mac asks you, and you type the number the page you started on shows there. With no device nearby, you can approve in the browser with your recovery key." },
  { label: "Our server opens your notes for it.", text: "Approving gives that AI connection a copy of your notes' key, locked with a key derived from that connection's access token. We store only a hash of the token; the token itself arrives with each of the AI's requests. During each request our server unlocks your whole notes' key in memory, reads the notes the AI asks for, and forgets the key when the request ends." },
  { label: "Our hosts carry that text.", text: "For AI requests, the text of the notes the AI reads or writes, and its access tokens, pass through Vercel and Supabase in readable form on their way. Neither stores your notes." },
  { label: "Locked notes stay locked.", text: "An AI sees only their titles, never their text." },
];

/// "Limits" on the Privacy & Security page: what encryption doesn't protect against, today.
export const LIMITS: Item[] = [
  { label: "Our copy of your key.", text: "Unless Advanced protection is on, we hold a copy of your notes' key, sealed with a secret kept outside the database. We hold both, so we could open your notes, and so could someone who took over our hosting account. A copy of the database alone opens nothing." },
  { label: "Signing in.", text: "Unless Advanced protection is on, anyone who can sign in as you can open your notes: with your password, by resetting it from your mailbox, or through the Apple or Google account you sign in with. The notice on your devices and the email tell you it happened. They don't stop it." },
  { label: "AI requests.", text: "While an AI you connected works, our server handles the text it asks for. A changed server could copy it. Disconnecting ends this at once." },
  { label: "The recovery key in the browser.", text: "Approving on pintonotes.com with your recovery key runs our code in your browser. It never stores or sends the key, but a changed page could read it. When you can, approve from your iPhone or Mac instead." },
  { label: "No key rotation yet.", text: "Your notes' key stays the same for the life of your account. Disconnecting an AI deletes its copy of the key, but you can't change the key itself yet." },
  { label: "The database.", text: "Someone with only a copy of the database can't read your notes. Someone running the live database could roll a note back to an earlier encrypted version, or hide notes from your devices. Where we keep a copy of your key, they could also sign in as you and get it, as a new device of yours would." },
];

/// "Who can see what" on the Privacy & Security page.
export const WHO_CAN_SEE: Item[] = [
  { label: "You,", text: "on every iPhone and Mac you sign in on. With Advanced protection on, a new device first needs your key: from iCloud Keychain, from one of your devices, or from your recovery key." },
  { label: "Us.", text: "As the people running Pinto Notes (that's Emil, who makes it), we see the encrypted copies and the details listed under what stays readable. We keep a locked copy of your key, so we could open your notes if we had to, for example under a court order. With Advanced protection on, we can't open them." },
  { label: "Anyone who can sign in as you,", text: "unless Advanced protection is on. Signing in opens your notes on a new device." },
  { label: "AI apps you approve,", text: "for the notes they ask for, until you disconnect them. They never see the text of locked notes." },
  { label: "Anyone with the link to a note you share,", text: "until you stop sharing it. Your device publishes a readable copy for the link, and it's deleted when you stop. Shared pages are hidden from search engines." },
];

export type Log = { name: string; what: string; kept: string };

/// Every log that holds anything about a request, ours or our hosts'. Same as the policy's Logs section.
export const LOGS: Log[] = [
  { name: "Supabase request logs", what: "Each request to our server: the time, the address it asked for, the IP address and device type, and a rough location from the IP address.", kept: "1 day" },
  { name: "Supabase sign-in logs", what: "Each sign-in and sign-out: the time, the email address and the IP address.", kept: "1 day" },
  { name: "Supabase function and database logs", what: "When each server function ran and what it was asked for, and errors, with names, addresses and ids blanked out.", kept: "1 day" },
  { name: "Sign-in records in our database", what: "Each sign-in: the time, the email address and the IP address, to keep your account secure.", kept: "30 days" },
  { name: "Vercel request logs", what: "Each request to this website: the time, the page, the IP address and device type, and whether it worked.", kept: "1 hour" },
  { name: "Rate limits", what: "A one-way hash of the IP address, made with a key that changes every day, to stop floods of sign-in attempts.", kept: "2 hours" },
  { name: "The log of our copy of your key", what: "Each time the copy was stored, fetched by a device or removed, and each time a request for it was refused: the time and the kind of device.", kept: "12 months" },
];

/// What the apps count, on our own server. Kept 12 months, never shared.
export const COUNTS: string[] = [
  "how many notes an AI connection changed on each day",
  "which days you used the app, to ask once, after a week, whether you'd like to share it",
  "which tips were shown and whether the feature was then used",
  "which first-run setup steps you've done",
  "how you heard about Pinto Notes, if you answer that one question after sign-up",
  "a random id for each installation and whether it's an iPhone or a Mac, to count devices",
];

/// The home page's privacy card: one claim, what our copy of the key means, the switch that removes it,
/// and in the same breath the AI exception from CAVEAT.
export const HOME_PRIVACY = {
  eyebrow: "Private by design",
  title: "Encrypted on your devices.",
  text: "Your notes are encrypted on your iPhone or Mac before they sync. We keep a locked copy of your key, so signing in opens them on a new device, and we could open them if we had to. Turn on Advanced protection and we keep no copy. When an AI you approve asks for notes, our server reads them in memory to answer it.",
  link: "Read what we store, and every log we keep",
};
