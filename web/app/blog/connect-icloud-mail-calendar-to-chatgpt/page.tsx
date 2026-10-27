import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("connect-icloud-mail-calendar-to-chatgpt", { title: "How to connect iCloud Mail and Calendar to ChatGPT" });

// News post, 27 October 2026 evening. Checked that night against OpenAI's own pages: the ChatGPT release notes (27 October:
// "iCloud Mail and Calendar plugins", find emails, catch up on your inbox, check your schedule, update calendar events;
// all plans, web, desktop app and iOS), Connecting and managing app accounts in ChatGPT (help.openai.com/en/articles/
// 20001494: Settings > Plugins, Install plugin, app-specific password, Mail address @icloud.com/@me.com/@mac.com, Calendar
// uses the primary Apple Account email, connect each separately, read-only contact lookup, no Contacts or Reminders
// plugins in this launch, disconnecting doesn't revoke the password at Apple), and the two plugin pages in ChatGPT
// (captured first-hand, signed in, nothing installed: Capabilities Read, Write; version 1.0.2). Apple's steps: support.
// apple.com/102654 (account.apple.com > Sign-In and Security > App-Specific Passwords; two-factor needed; up to 25;
// changing the Apple Account password revokes them all). The prompts in the Keep box are ours, built on the tasks OpenAI
// names. Not connected first-hand: entering an Apple password is the reader's job, so the connection form isn't pictured.

const FAQ = [
  { q: "Is the iCloud plugin in ChatGPT free?", a: [
    "Yes. OpenAI says the iCloud Mail and Calendar plugins are on all ChatGPT plans, Free included, on the web, in the desktop app and on iOS.",
  ] },
  { q: "Why does ChatGPT want an app-specific password for iCloud?", a: [
    "iCloud doesn't let other companies sign in with your Apple password. An app-specific password is a separate one you make at account.apple.com for a single app, and you can delete it at any time without changing your real password. OpenAI says never to type your regular Apple password into the form or paste any password into a chat.",
  ] },
  { q: "Which email do I use for iCloud Calendar?", a: [
    "Your primary Apple Account email. For Mail you use your iCloud Mail address (ending in @icloud.com, @me.com or @mac.com). The two can be different, which is the most common reason the Calendar connection fails.",
  ] },
  { q: "Can ChatGPT send email from my iCloud account?", a: [
    "Yes. The Mail plugin lists reading, managing messages and drafts, and sending email. OpenAI says ChatGPT may ask for your approval before it reads something or takes an action, and you control that in its plugin settings.",
  ] },
  { q: "Can ChatGPT read my Apple Notes or Reminders now?", a: [
    "No. This launch is Mail and Calendar only, each with read-only contact lookup. OpenAI says Contacts and Reminders plugins aren't part of it, and Notes isn't mentioned at all.",
  ] },
];

const ASK = `Catch me up on my iCloud inbox since yesterday. What needs a reply?
Find the email with my flight confirmation and add the flight to my iCloud calendar.
What's on my calendar this week, and where do I have a free afternoon?
Move Thursday's dentist appointment to Friday at the same time.
Draft a reply to the last email from my landlord, but don't send it.`;

export default function Page() {
  return (
    <PostPage
      slug="connect-icloud-mail-calendar-to-chatgpt"
      intro={<>
        ChatGPT can now read your iCloud Mail and work in your iCloud Calendar, the way it already could with Gmail and Google
        Calendar. OpenAI released the two plugins on 27 October. Setting them up takes about five minutes, and one step trips most
        people up: Apple makes you create a separate password first. Here&apos;s how to do it, what to ask, and how to undo it.
      </>}
      answer={
        <Answer jump={[
          { href: "#password", label: "Make the password" },
          { href: "#connect", label: "Connect the plugins" },
          { href: "#ask", label: "What to ask" },
          { href: "#undo", label: "Disconnect" },
        ]}>
          <p>
            Two new plugins by OpenAI, iCloud Mail and iCloud Calendar, on every ChatGPT plan including Free, on the web, the desktop
            app and iOS. To connect: make an app-specific password at account.apple.com (Sign-In and Security, App-Specific Passwords),
            then in ChatGPT open Settings, Plugins, choose iCloud Mail or iCloud Calendar, select Install plugin and enter your email
            and that password. Connect each one separately.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/chatgpt-icloud-mail-plugin" width={1232} height={560} maxWidth={616}
        alt="The iCloud Mail plugin page in ChatGPT, by OpenAI: search and read iCloud Mail, manage messages and drafts, send email, and look up iCloud contacts, with an Install plugin button."
        caption="The iCloud Mail plugin in ChatGPT's plugin directory." />}
      faq={FAQ}
    >
      <h2 id="password">Step 1: make an app-specific password</h2>
      <p>
        ChatGPT never gets your Apple password. Instead, Apple lets you make a password for one app only, which you can delete
        later without touching anything else. Your Apple Account needs two-factor authentication on for this.
      </p>
      <MenuPaths rows={[
        { on: "Browser", steps: ["account.apple.com", "Sign-In and Security", "App-Specific Passwords"] },
      ]} />
      <p>
        Choose Generate an app-specific password, name it something like ChatGPT, and copy what Apple shows you. You can make one for
        each plugin, so later you can cut off Mail and keep Calendar.
      </p>

      <h2 id="connect">Step 2: connect iCloud Mail and Calendar</h2>
      <MenuPaths rows={[
        { on: "ChatGPT", steps: ["Settings", "Plugins", "iCloud Mail", "Install plugin"] },
      ]} />
      <p>
        The iCloud plugins are under New &amp; Noteworthy, or search for iCloud. In the connection form, enter:
      </p>
      <ul>
        <li><strong>For Mail:</strong> your iCloud Mail address, the one ending in @icloud.com, @me.com or @mac.com.</li>
        <li><strong>For Calendar:</strong> your primary Apple Account email. If you signed up with a Gmail or work address, it&apos;s that
          one, not your iCloud address.</li>
        <li><strong>For both:</strong> the app-specific password from step 1. Never your normal Apple password.</li>
      </ul>
      <p>
        Then do the same for iCloud Calendar. Installing one doesn&apos;t connect the other.
      </p>

      <h2 id="ask">What to ask</h2>
      <PostFigure src="/blog/news/chatgpt-icloud-cal-plugin" width={1232} height={560} maxWidth={616}
        alt="The iCloud Calendar plugin page in ChatGPT, by OpenAI: list iCloud calendars, find events, create or change events, and look up iCloud contacts."
        caption="iCloud Calendar can create and change events, not only read them." />
      <p>
        Bring a plugin into a chat by typing @ and its name, or from the + menu. Mail can search and read your email, manage messages
        and drafts, and send. Calendar can find events and create or change them. Both can look up your iCloud contacts.
      </p>
      <Keep title="Things to try" text={ASK} note="Ours, built on what OpenAI says the plugins do." />
      <p>
        ChatGPT may ask before it reads or acts. If you&apos;d rather approve every send yourself, check the plugin&apos;s permission
        setting in Settings, Plugins.
      </p>

      <h2 id="undo">Disconnecting, and what it doesn&apos;t do</h2>
      <AIConnect ais={["chatgpt"]} caption="ChatGPT reaches iCloud only through the password you gave it." />
      <p>
        In Settings, Plugins, open the plugin, then the ••• menu, and choose Disconnect. That stops ChatGPT, but the password still
        works at Apple until you remove it at account.apple.com, under App-Specific Passwords. If you ever change your Apple Account
        password, Apple revokes every app-specific password, so you&apos;ll need a new one to reconnect.
      </p>
      <p>
        Worth knowing: while a plugin is connected, ChatGPT may share relevant chats and memories with it to help with a request, and
        with Memory on it can use what it finds to make suggestions.
      </p>
      <p>
        One thing isn&apos;t in this launch: your notes. OpenAI says Contacts and Reminders aren&apos;t included, and Apple Notes
        isn&apos;t mentioned. Apple Notes has <a href="/blog/apple-notes-api">no API</a> for ChatGPT to use, so if you want it to work with what
        you&apos;ve written down, <a href="/blog/connect-chatgpt-to-your-notes">connect it to a notes app</a> that lets it read and
        edit them. That&apos;s what I
        made Pinto Notes for.
        {APP_STORE_LIVE
          ? <> It&apos;s free on Mac and iPhone.</>
          : <> It&apos;s free on the Mac today, with the iPhone app coming soon.</>}{" "}
        For everything else ChatGPT added this month, see the <a href="/blog/new-ai-features">list of new AI features</a>.
      </p>
    </PostPage>
  );
}
