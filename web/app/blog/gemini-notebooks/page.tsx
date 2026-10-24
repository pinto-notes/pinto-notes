import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("gemini-notebooks", { title: "Gemini Notebooks: how to use them, now from any Gemini chat" });

// Checked on 24 October 2026 against Google's own pages: the Workspace Updates post of 23 October (Gemini Notebook as
// a Connected App: what it does, Settings > Connected Apps, on by default except the EEA, all Workspace customers,
// Workspace Individual and personal accounts, the four example prompts), the Gemini help article Create and use
// notebooks in Gemini Apps (support.google.com/gemini/answer/16972047: New notebook, Add sources, Add to notebook,
// Keep Activity, the Mac app has notebooks but not the connected app, a notebook can't be a source), the Gemini
// Notebook help on notebooks in Gemini (support.google.com/gemininotebook/answer/17003757: two-way sync, Studio only in
// Gemini Notebook, notebooks with Gemini chats can't be shared, not used to train models unless you send feedback),
// the source limits page (support.google.com/gemininotebook/answer/16213268) and the Workspace Updates post of 16 July
// (NotebookLM is now Gemini Notebook). 9to5Google reported the connected app on 23 October and notebooks in April. Not
// tried by me. Pictures: Google, and 9to5Google where the caption says so.

const FAQ = [
  { q: "Is Gemini Notebook the same as NotebookLM?", a: [
    "Yes. Google renamed NotebookLM to Gemini Notebook in July 2026. Shared notebooks and old links still work. The notebooks you make in the Gemini app show up there too, and changes in one appear in the other.",
  ] },
  { q: "Are Gemini Notebooks free?", a: [
    "Yes, with limits. On a free Google account a notebook holds up to 50 sources and you can have 100 notebooks. Google AI Plus raises that to 100 sources, Pro to 300, and Ultra to 500 or 600.",
  ] },
  { q: "How are Gemini Notebooks different from Claude Projects?", a: [
    "Both keep files and instructions together so you don't paste them into every chat. A Gemini notebook also syncs with Gemini Notebook, where you can turn its sources into audio and video overviews, and since 23 October you can fill it from any chat by asking. Claude Projects are on every Claude plan, including free with up to five projects, and sharing a project needs a Team or Enterprise plan.",
  ] },
  { q: "Why don't I see @Gemini Notebook?", a: [
    "It's rolling out gradually on the Gemini website and the phone apps, and it isn't in the Gemini app for Mac yet. In the EEA it starts switched off: turn it on in Settings, then Connected Apps. On a work or school account, your admin has to allow both Gemini and Gemini Notebook.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="gemini-notebooks"
      intro={<>Gemini has had notebooks since April: a place to keep the files, links and chats for one project, so you stop re-explaining it. On 23 October Google made them reachable from any chat. Type @Gemini Notebook and Gemini can make a notebook, add to it, or answer from it. Here&apos;s how to set one up and what to ask. (It&apos;s in my <a href="/blog/new-ai-features">list of every new AI feature</a> too.)</>}
      answer={
        <Answer jump={[
          { href: "#what", label: "What they are" },
          { href: "#make", label: "Make a notebook" },
          { href: "#chat", label: "Use it from any chat" },
          { href: "#notes", label: "Bring your notes in" },
        ]}>
          <p>
            Gemini Notebooks are project spaces in the Gemini app that keep your sources, instructions and chats together. They
            work on free and paid Google accounts. On the website or phone app, open the menu and choose New notebook under
            Notebooks. To use one from a chat, type @Gemini Notebook and say what you want. It&apos;s on by default, except in the
            EEA, where you turn it on in Settings, then Connected Apps.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/gemini-notebooks/new-notebook" width={1600} height={800} maxWidth={800}
        alt="The Gemini app on the web with Notebooks in the side menu, listing Job search and Biology finals, and a new notebook being named Grad school application. The Gemini and NotebookLM logos are above it."
        caption="New notebook sits in Gemini's side menu, above your chats. Image: Google." />}
      faq={FAQ}
    >
      <h2 id="what">What Gemini Notebooks are</h2>
      <PostFigure src="/blog/gemini-notebooks/gemini-notebook-stage" width={1600} height={800} maxWidth={720}
        alt="The Gemini Notebook logo on a big screen on a stage, beside a blue curtain."
        caption="NotebookLM became Gemini Notebook in July. Image: 9to5Google." />
      <p>
        A notebook is a workspace for one thing: a trip, an exam, a business plan. You give it sources, like PDFs, Google Docs,
        web links, pasted text or Markdown files, and every chat inside it starts out knowing them. You can also give it
        instructions, such as &quot;answer in short bullet points&quot;, and it keeps them.
      </p>
      <p>
        Each notebook also lives in Gemini Notebook, the app that used to be NotebookLM. Add a source in one and it shows up in
        the other. The difference is in the answers. Gemini Notebook answers only from your sources and can make audio and
        video overviews of them. Gemini can mix your sources with web search and its other tools.
      </p>

      <h2 id="make">How to make a notebook</h2>
      <PostFigure src="/blog/gemini-notebooks/add-to-notebook" width={350} height={350} maxWidth={350}
        alt="A chat's menu in the Gemini app: Share conversation, Pin, Rename, Add to notebook and Delete, with Add to notebook highlighted."
        caption="Any past chat can move into a notebook from its menu. Image: 9to5Google." />
      <Steps>
        <li>
          <strong>Open the menu and choose New notebook</strong>
          It&apos;s under Notebooks, on gemini.google.com or in the Gemini app for iPhone and Android.
        </li>
        <li>
          <strong>Give it a name and a first prompt</strong>
          The name is how you&apos;ll find it later, so make it plain: &quot;Kitchen remodel&quot;, not &quot;Project 3&quot;.
        </li>
        <li>
          <strong>Add sources</strong>
          Upload files, pick them from Google Drive, or paste links and text. A notebook can&apos;t use another notebook as a source.
        </li>
        <li>
          <strong>Bring in old chats</strong>
          Open the menu, choose Search chats, then More next to a chat, and Add to notebook.
        </li>
      </Steps>
      <p>
        Saving chats, Drive files and notebook memory need Keep Activity turned on in your Gemini settings. Without it you can
        still chat with a notebook, but those chats aren&apos;t saved and it won&apos;t build a memory of them.
      </p>

      <h2 id="chat">Use @Gemini Notebook from any chat</h2>
      <PostFigure src="/blog/gemini-notebooks/at-gemini-notebook" width={1018} height={1043} maxWidth={520}
        alt="A Gemini chat about recent trends in solar farm markets. The user then writes: That's great. @Gemini Notebook can you add this to my notebook, Solar Market Trends? Gemini replies: Added to Solar Farm Market Trends."
        caption="Halfway through a normal chat, one line files it in a notebook. Image: Google." />
      <p>
        This is the new part. You no longer have to open a notebook first. In any chat, type @Gemini Notebook and ask, and Gemini
        works on your notebooks for you. It also reaches for them on its own when a question fits. Google&apos;s examples:
      </p>
      <ul>
        <li>&quot;Create a Gemini Notebook about solar farm market trends.&quot;</li>
        <li>&quot;Add a copy of this chat to my notebook about Bio 101 course.&quot;</li>
        <li>&quot;Show me a list of all the sources in my notebook about US National Parks.&quot;</li>
        <li>&quot;What do my Gemini Notebooks say about butterfly migration?&quot;</li>
      </ul>
      <p>
        It works on the Gemini website and the phone apps, and it&apos;s rolling out gradually. The Gemini app for Mac has
        notebooks but not this yet. To switch it off, or on in the EEA, go to Settings, then Connected Apps. Google says what you
        put in Gemini Notebook isn&apos;t used to train its models unless you send feedback.
      </p>

      <h2 id="notes">Bring your own notes in</h2>
      <PostFigure src="/blog/notes-export-menu" width={700} height={453} maxWidth={420}
        alt="The File menu of Apple Notes on a Mac running macOS 26, open at Export as, with PDF and Markdown in the submenu and Markdown selected."
        caption="Apple Notes on a Mac can export a note as Markdown, which a notebook takes as a source." />
      <p>
        A notebook is only as good as what you put in it, and a lot of what you know about a project is probably in your notes
        app. Notebooks take Markdown files, so in Apple Notes on a Mac choose File, then Export as, then Markdown, and add the file
        as a source. (More in <a href="/blog/export-apple-notes-to-markdown">how to export Apple Notes to Markdown</a>.)
      </p>
      <p>
        The catch is that it&apos;s a copy, so when the note changes, the notebook doesn&apos;t. I make Pinto Notes, a notes app for
        Mac that Claude can read and edit directly once you allow it, so there&apos;s no copy to keep up to date. It doesn&apos;t
        work with Gemini, so for a Gemini notebook, the export is the way.
      </p>
    </PostPage>
  );
}
