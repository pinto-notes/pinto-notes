import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("slash-menu", { title: "Type / to format your notes, like in Notion" });

export default function Page() {
  return (
    <PostPage
      slug="slash-menu"
      intro={<>Pinto Notes 1.3 for Mac adds a / menu, the kind you know from Notion. Type / anywhere in a note, pick what you want, and press Return. Your hands stay on the keyboard.</>}
    >
      <h2>Type / and pick</h2>
      <p>
        The menu opens under the caret with everything you can add to a note: headings, checklists, lists, quotes, callouts,
        highlights, code, tables, dividers, today&apos;s date, links, links to your other notes and files. The arrow keys move
        through it, Return or Tab picks one, and Escape closes it. Each command shows its keyboard shortcut, if you&apos;d rather
        learn that one.
      </p>
      <h2>Find a command by its name</h2>
      <p>
        Keep typing after the / and the menu narrows down: /tab for a table, /div for a divider. The words you know from other
        apps work too, like h1, todo, hr or ul. The commands you used last sit at the top, so the ones you need most are one
        Return away.
      </p>

      <PostFigure src="/blog/launch/slash-menu-open" width={1600} height={1000} kind="plain"
        alt="Two windows of a Kitchen redo note in Pinto Notes on a Mac. Left: the / menu open under a checklist, with Title, Heading, Subheading, Body, Checklist, Bulleted List, Dashed List, Numbered List and Block Quote, each with its shortcut. Right: /warn typed, and the menu down to Warning Callout."
        caption="Type / for the whole menu, or keep typing to find one command." />

      <h2>Callouts</h2>
      <p>
        A callout is a box that stands out from the rest of the note, for a tip, a warning or a question. Type /warn, /tip or
        /question to get that kind straight away. Pinto Notes saves them as plain Markdown, written the way Obsidian writes
        callouts, so they still look right if you open the note there, and notes you{" "}
        <a href="/blog/import-your-notes">bring over from Obsidian</a> keep theirs. ChatGPT and Claude read them as plain text
        too, once you <a href="/blog/connect-chatgpt-to-your-notes">connect them to your notes</a>.
      </p>
      <h2>Tables, dates and links</h2>
      <p>
        /table puts in an empty table with the keyboard in its first cell, and Tab moves to the next one. /date writes
        today&apos;s date. Link to Note lets you pick another note by its name, the same as typing two square brackets.
      </p>
      <PostFigure src="/blog/launch/slash-menu-callout-table" width={1600} height={1000} kind="plain"
        alt="The Kitchen redo note in Pinto Notes on a Mac with an orange warning callout, Water is off on 2 and 3 March. Left: /tab typed under it, and the menu down to Table. Right: the table that came in, Quote and Price, Worktop 9,800 kr, Electrician 4,500 kr."
        caption="/warn made the callout. /table puts in a table, and Tab moves from cell to cell." />

      <h2>Update to 1.3</h2>
      <p>
        The / menu is in Pinto Notes 1.3 for Mac. If you already have the app, choose Pinto Notes, then Check for Updates.
        The Format menu and its shortcuts are still there too.
      </p>
    </PostPage>
  );
}
