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
        <PostFigure src="/blog/launch/chatgpt-plans-lisbon" width={1600} height={1040} kind="plain" priority
          alt="Illustration: in ChatGPT, Plan four days in Lisbon for us and save it to my notes, Edited Lisbon in Pinto Notes; beside it the Lisbon note in Pinto Notes with a plan checklist, places, a hotel booking and a table of where to eat."
          caption="You ask in ChatGPT, and the plan is in your Lisbon note. (Illustration with a real Pinto Notes screen.)" />
      }
    >
      <h2>Ask from any chat</h2>
      <p>You don&apos;t need to copy anything out of ChatGPT any more. Ask it to put things where you&apos;ll use them:</p>
      <ul>
        <li>&ldquo;Plan four days in Lisbon for us and save it to my notes.&rdquo;</li>
        <li>&ldquo;Turn my meeting notes into a checklist.&rdquo;</li>
        <li>&ldquo;Add the books Sara recommended to my reading list.&rdquo;</li>
        <li>&ldquo;What did I write about the kitchen measurements?&rdquo;</li>
      </ul>
      <p>
        ChatGPT finds the right note and makes the change. It&apos;s in the note on your Mac and on{" "}
        <a href="/blog/pinto-notes-for-iphone">your iPhone</a> a second later.
      </p>

      <h2>You can undo anything it does</h2>
      <p>
        The lines ChatGPT changes are tinted for a moment, with Undo next to them. And every version of a note is kept, with who
        made it, so you can go back to the one before any change.
      </p>
      <PostFigure src="/blog/launch/version-history-list" width={520} height={960} maxWidth={360}
        alt="A note's version history in Pinto Notes: the current version by you on iPhone, 4:35 by ChatGPT, 13:35 by you on Mac with 3 edits, 13:30 by you on iPhone and 1:30 by Claude Code."
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
