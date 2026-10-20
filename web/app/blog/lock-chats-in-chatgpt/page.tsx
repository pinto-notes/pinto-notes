import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPath, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("lock-chats-in-chatgpt", { title: "How to lock chats in ChatGPT with a PIN or Face ID" });

// Checked on 20 October 2026 against OpenAI's own pages: the ChatGPT release notes for 20 October (Introducing locked
// chats: Free, Go, Plus and Pro on the web, iOS, Android and the new desktop app, from a chat's ••• menu) and the help
// article Using locked chats in ChatGPT (help.openai.com/en/articles/20001411: Projects > Locked chats, the 4-digit
// account PIN, Face ID, Touch ID or device unlock, Settings > Security and login > Account PIN, relocking after 1 minute
// on mobile, what locking doesn't do, PIN reset deleting everything, chats that can't be locked, memory, files, temporary
// chat compared). TechCrunch's report of the same day adds Business, Enterprise and Edu. Not tried by me yet: it's
// rolling out gradually. The pictures are our own drawings, because OpenAI published no launch picture.

const FAQ = [
  { q: "Why don't I see Lock chat in ChatGPT?", a: [
    "Locked chats are rolling out gradually, so your account may not have them yet. Some chats can't be locked at all: temporary, archived and group chats, chats made from a shared link, and chats with scheduled tasks, meeting recordings or background tasks. On a Mac or Windows PC you need the new ChatGPT desktop app.",
  ] },
  { q: "Does a locked chat still go into ChatGPT's memory?", a: [
    "Locked chats keep a memory of their own, shared only between locked chats. They can use your regular memory, but what they learn doesn't flow back into regular chats. Anything ChatGPT remembered from the chat before you locked it stays remembered.",
  ] },
  { q: "Can I search my locked chats?", a: [
    "No. Locked chats are left out of regular search, and you can't search across them either. Open Projects, then Locked chats, and browse. On iPhone you can use Find inside one open chat.",
  ] },
  { q: "How do I unlock a chat in ChatGPT for good?", a: [
    "Open the locked chat, choose ••• and then Unlock chat (Unlock on iPhone), and confirm. It goes back to your regular history, though not to the project it came from.",
  ] },
  { q: "Why are my screenshots of a locked chat black?", a: [
    "On Android, the ChatGPT app hides locked chats in screenshots, so they come out blank or black.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="lock-chats-in-chatgpt"
      intro={<>Since 20 October you can lock a chat in ChatGPT, much like WhatsApp&apos;s chat lock. The chat leaves your history and search, and it opens only with a PIN or your face. Here&apos;s how to set it up, and what it doesn&apos;t protect.</>}
      answer={
        <Answer jump={[
          { href: "#lock", label: "Lock a chat" },
          { href: "#open", label: "Open locked chats" },
          { href: "#limits", label: "What it doesn't do" },
          { href: "#temporary", label: "Locked or temporary" },
          { href: "#notes", label: "Plans worth keeping" },
        ]}>
          <p>
            Open a chat&apos;s ••• menu, choose Lock chat, confirm, and create a 4-digit PIN. The chat moves to Projects, then Locked
            chats, and disappears from your history and search. You open it again with the PIN, or with Face ID, Touch ID or your
            phone&apos;s unlock on mobile. It works on the web, on iPhone and Android, and in the new desktop app.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/lc-handover" width={1200} height={750} maxWidth={600}
        alt="A ChatGPT chat list showing Holiday photos, Pasta for four and Bike repair, with a Locked chats row at the bottom, next to a wrapped present with a padlock on it."
        caption="Hand someone your phone and they see the harmless chats. The party plan stays behind the PIN." />}
      faq={FAQ}
    >
      <h2 id="lock">How to lock a chat in ChatGPT</h2>
      <PostFigure src="/blog/drawn/lc-menu" width={1200} height={750} maxWidth={600}
        alt="The ••• button above a small menu with Rename, Share and a highlighted Lock chat option with a padlock, beside the ChatGPT logo."
        caption="Lock chat sits in the same ••• menu as Rename and Share." />
      <Steps>
        <li>
          <strong>Open the chat&apos;s ••• menu</strong>
          It&apos;s the more options button, three dots, for the chat you want to hide.
        </li>
        <li>
          <strong>Choose Lock chat, then Lock chat again</strong>
          ChatGPT asks you to confirm before it moves anything.
        </li>
        <li>
          <strong>Create your PIN the first time</strong>
          Pick four digits and enter them twice. It&apos;s one PIN for your whole OpenAI account, so it works on your other devices
          too.
        </li>
      </Steps>
      <p>
        ChatGPT moves the chat into Locked chats and removes its title and contents from your history and from search. Files you
        uploaded or made in that chat are hidden with it. Search can take a little while to catch up, and another device with
        ChatGPT already open may keep showing the title until its list refreshes. On iPhone, a chat that was already loaded can
        stay visible until the app refreshes, so check your other screens before you share one.
      </p>
      <p>
        Once you have a PIN you can also start a new chat straight inside Locked chats. A chat you lock from a project leaves that
        project and stops using its instructions and files.
      </p>

      <h2 id="open">How to open your locked chats</h2>
      <PostFigure src="/blog/drawn/lc-pin" width={1200} height={750} maxWidth={600}
        alt="A phone showing Locked chats with a padlock and four PIN dots, three of them filled, next to a Face ID symbol."
        caption="A 4-digit PIN everywhere, and Face ID, Touch ID or your phone's unlock on mobile." />
      <MenuPath steps={["Projects", "Locked chats", "Enter your PIN"]} />
      <p>
        The Locked chats project can stay in your sidebar with the chat titles hidden. Select it, enter your PIN or look at your
        phone, and pick the chat. That gives you access for a while without unlocking anything for good. On iPhone and Android it
        ends after a minute away from your locked chats, or a minute with ChatGPT in the background. On the web it ends when you
        refresh or close the tab, or after you&apos;ve been away from it, and a new tab asks again. Lock now ends it at once.
      </p>
      <p>
        To use your face or fingerprint on iPhone, go to Settings, then Security and login, then Account PIN, and turn on Use
        Face ID or Use Touch ID. On Android, choose Use device unlock when ChatGPT asks. Each phone is set up on its own, and
        the PIN always works as the fallback. The same Account PIN screen is where you change the PIN, which needs the old one.
      </p>

      <h2 id="limits">What locking a chat doesn&apos;t do</h2>
      <PostFigure src="/blog/drawn/lc-reset" width={1200} height={750} maxWidth={600}
        alt="Four question marks for a forgotten PIN, with an arrow to a bin full of chat bubbles."
        caption="Forget the PIN and the reset deletes every locked chat." />
      <p>
        OpenAI&apos;s help page lists what a lock leaves alone, and it&apos;s worth reading before you trust one. Locking doesn&apos;t add end-to-end encryption or a
        separate vault, doesn&apos;t change how long OpenAI keeps the chat, and doesn&apos;t change your setting for improving
        the model. It doesn&apos;t erase anything ChatGPT remembered from the chat before you locked it. On Business, Enterprise
        and Edu, your workspace&apos;s rules still apply, and Enterprise and Edu compliance logs still include locked chats.
        Anyone who gets past the PIN can copy what&apos;s in them.
      </p>
      <p>
        The part to remember is the PIN. If you forget it, the only way back in is a reset, and the reset permanently deletes
        every locked chat, the memories kept only in locked chats, and their files. OpenAI support can&apos;t recover them. That&apos;s harsher than
        Apple Notes, where a reset leaves your old locked notes in place, still locked (<a href="/blog/forgot-apple-notes-password">what
        to try there</a>). So
        pick four digits you&apos;ll remember, and if a locked chat holds something you need, copy it somewhere you control.
      </p>

      <h2 id="temporary">Locked chat or temporary chat?</h2>
      <PostFigure src="/blog/drawn/lc-vs-temp" width={1200} height={750} maxWidth={600}
        alt="Two chat bubbles: a solid one with a padlock, labelled Locked: kept, and a dashed outline labelled Temporary: not saved."
        caption="A locked chat is saved and hidden. A temporary chat isn't saved to your history." />
      <p>
        ChatGPT already had temporary chat, and it answers a different question. A temporary chat never goes into your history,
        doesn&apos;t create memories, and isn&apos;t used to improve OpenAI&apos;s models while it stays temporary. A locked chat
        is saved so you can come back to it, and it follows your normal setting for improving the model.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Locked chat</th><th scope="col">Temporary chat</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Kept for later</th><td>Yes, under Locked chats</td><td>No</td></tr>
            <tr><th scope="row">In history and search</th><td>No</td><td>No</td></tr>
            <tr><th scope="row">Needs a PIN to open</th><td>Yes</td><td>No</td></tr>
            <tr><th scope="row">Memory</th><td>Its own, shared between locked chats</td><td>Creates none</td></tr>
            <tr><th scope="row">Used to improve models</th><td>Follows your setting</td><td>No</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        For a quick question you&apos;d rather not keep, use temporary chat. For a surprise party you&apos;re planning over three
        weeks, lock the chat.
      </p>

      <h2 id="notes">For plans worth keeping</h2>
      <PostFigure src="/blog/amber-notes-locked-notes-password" width={880} height={600} maxWidth={440}
        alt="Pinto Notes on a Mac asking you to create a password for locked notes, with the warning that a forgotten password can't be recovered."
        caption="Locked notes in Pinto Notes are encrypted with a key made from your password." />
      <p>
        A chat is a good place to work a plan out, and a less good place to keep it, since a forgotten PIN takes the whole
        conversation with it. I make Pinto Notes, a notes app for Mac that Claude can read and edit once you approve it (ChatGPT and the
        iPhone app are coming soon). Its locked notes are encrypted with a key made from your password, which stays on your
        devices, and a connected AI only sees their titles. <a href="/blog/encrypted-notes-app-for-ai">How its encryption
        works</a> has the details and the limits.
      </p>
    </PostPage>
  );
}
