import { Loop } from "@/lib/Loop";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("pinto-notes-in-chatgpt", { title: "Pinto Notes is now in ChatGPT" });

const PLUGIN_URL = "https://chatgpt.com/plugins/plugin_asdk_app_6ace2593e6008191bdbc937f56ece80f";

export default function Page() {
  return (
    <PostPage
      slug="pinto-notes-in-chatgpt"
      intro={<>Pinto Notes is now a plugin in ChatGPT. Connect it once, and ChatGPT can find, write and edit your notes from any chat. The change is in Pinto Notes on your Mac and iPhone a second later.</>}
      hero={
        <PostFigure src="/blog/launch/chatgpt-ask-iphone-groceries" width={1600} height={1000} priority
          alt="Illustration: in ChatGPT, Add the paella things to my groceries, Edited Groceries in Pinto Notes; beside it an iPhone showing the Groceries note with the five new items tinted."
          caption="You ask in ChatGPT. The list on your phone has the new items. (Illustration with a real iPhone screen.)" />
      }
    >
      <h2>Ask from any chat</h2>
      <p>You don&apos;t need to copy anything out of ChatGPT any more. Ask it to put the plan where you&apos;ll use it:</p>
      <ul>
        <li>&ldquo;Add the paella things to my groceries.&rdquo;</li>
        <li>&ldquo;Plan four days in Lisbon for us and save it to my notes.&rdquo;</li>
        <li>&ldquo;What did I write about the kitchen measurements?&rdquo;</li>
        <li>&ldquo;Turn my meeting notes into a checklist.&rdquo;</li>
      </ul>
      <p>ChatGPT finds the right note and makes the change. On <a href="/blog/pinto-notes-for-iphone">your iPhone</a> it looks like this:</p>
      <Loop src="/blog/loops/iphone-chatgpt-adds-groceries.mp4" poster="/blog/loops/iphone-chatgpt-adds-groceries.webp" width={640} height={1202}
        label="Pinto Notes on iPhone: five grocery items ChatGPT just added land in the list, tinted, with ChatGPT changed 5 lines and Undo."
        caption="Recorded on an iPhone: the five lines ChatGPT added." />

      <h2>You can undo anything it does</h2>
      <p>The lines ChatGPT changes are tinted for a moment, with Undo next to them. One click and the note is as it was.</p>
      <PostFigure src="/blog/launch/chatgpt-changed-5-lines-undo" width={1600} height={1000}
        alt="The five lines ChatGPT added to a Groceries note, tinted: paella rice, saffron, chorizo, chicken thighs and smoked paprika, with ChatGPT changed 5 lines and Undo below."
        caption="What ChatGPT changed, and the Undo next to it. From Pinto Notes on a Mac." />
      <p>Every version of a note is kept too, with who made it, so you can go back to the one before any change.</p>
      <PostFigure src="/blog/launch/chatgpt-version-history-list" width={1600} height={1000}
        alt="A note's version history in Pinto Notes: the current version by you on iPhone, 4:35 by ChatGPT, 13:35 by you on Mac with 3 edits, and 1:30 by Claude Code."
        caption="A note's history: you on iPhone, ChatGPT, you on the Mac, Claude Code." />

      <h2>Nothing is shared until you allow it</h2>
      <p>
        When you connect, Pinto Notes on your Mac or iPhone asks whether ChatGPT may use your notes, and nothing is shared until
        you choose Allow. Settings, Connect an AI shows what&apos;s connected and when it was last used.
      </p>

      <h2>Connect it</h2>
      <Steps>
        <li><strong>Open the plugin</strong> Open <a href={PLUGIN_URL} rel="noopener">Pinto Notes in ChatGPT</a>, or search for Pinto Notes in Plugins in ChatGPT&apos;s sidebar.</li>
        <li><strong>Connect it</strong> Press the connect button and sign in to Pinto Notes on the page that opens.</li>
        <li><strong>Choose Allow</strong> Pinto Notes on your Mac or iPhone asks first. Choose Allow, and you&apos;re back in ChatGPT.</li>
      </Steps>
      <p>
        <a href="/blog/connect-chatgpt-to-your-notes">How to connect ChatGPT to your notes</a> has every step with pictures, and
        Claude too. OpenAI decides which ChatGPT plans and countries get plugins, so if you can&apos;t find Plugins, check that first.
      </p>
    </PostPage>
  );
}
