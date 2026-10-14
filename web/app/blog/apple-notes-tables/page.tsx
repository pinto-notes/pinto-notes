import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, FigurePair, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-tables", { title: "Apple Notes tables: sums, sorting and the trick for totals" });

// Rewritten by hand on 14 October 2026 to Emil's recipe: answer the search well, let the reader feel what's
// missing, then pay it off with Pinto once. The story is one moving budget, the case where people hit the wall.
// Every Apple Notes picture in public/blog/macos27/notes27-table-* was taken that day in Notes on macOS 27, in a
// throwaway VM with no Apple Account (deleted afterwards), light mode, in a "Pinto blog demo" folder. Tried there:
// Format, Table; tab-separated lines plus the Table button make a table; Tab in the last cell adds a row; the row
// and column menus (add and delete only); dragging a column edge selects cells and doesn't resize; a sum in a cell
// gets no result and Math Results is greyed out in a table; the same sum under the table gets 505; Table Actions has
// only Convert to Text; a whole table selected and copied pastes into TextEdit as a table, and Copy as Markdown is
// greyed out for it. Not tried: Numbers (not on the test Mac), iPhone, dragging rows.
// Pinto Notes' side: tables in Pane/Editor/TableGrid.swift (no sums, no sort); ChatGPT and Claude read and add rows
// through the MCP tools (read_table, log_table_row in supabase/functions/mcp/tools.ts); the Budget and expenses
// template's app (web/content/templates/budget-log.app) adds itself up. Its picture is the app on a Mac, from the
// apps-v2 captures with example data.

const FAQ = [
  { q: "Can Apple Notes add up a column in a table?", a: [
    "No. A table in Apple Notes holds text, with no formulas and no sum, and Math Results is greyed out while you're in a table. Type the sum under the table instead, with a name for each number, and Math Results answers it.",
  ] },
  { q: "Can you sort a table in Apple Notes?", a: [
    "No. There's no sort command in the Format menu, the Table Actions button or a row's or column's menu, on macOS 27 as before. Copy the table into Numbers to sort it.",
  ] },
  { q: "Can you change the column width of a table in Apple Notes?", a: [
    "No. Notes sets column widths itself, and dragging the line between two columns only selects cells. Shorter headers, and long text kept under the table, are the only levers.",
  ] },
  { q: "How do I add a row or column to an Apple Notes table?", a: [
    "On a Mac, press Tab in the last cell to add a row at the bottom. Anywhere else, click the handle beside a row or above a column, click its arrow, then choose Add Row Above, Add Row Below, Add Column Before or Add Column After.",
  ] },
];

const TOTAL = `Boxes = 85
Van = 240
Cleaning = 180
Boxes + Van + Cleaning =
`;

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-tables"
      intro={<>
        I planned a move in Apple Notes this week. Boxes, a van for half a day, a cleaner: a little table, and then the one question that
        matters, what does it all cost? Here&apos;s everything a table in Notes on macOS 27 can do, the trick that gets you a total anyway,
        and where it runs out.
      </>}
      answer={
        <Answer jump={[
          { href: "#make", label: "Make a table" },
          { href: "#rows-columns", label: "Rows and columns" },
          { href: "#sum", label: "The total trick" },
          { href: "#sort", label: "Sort" },
          { href: "#column-width", label: "Column width" },
          { href: "#numbers", label: "Copy to Numbers" },
        ]}>
          <p>
            Format, Table (Option-Command-T) makes one, and Tab in the last cell adds a row. Notes can&apos;t sum a column, sort a table or
            set a width. For a total, name each number under the table and Math Results adds them up for you.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="A note called Reading list in Apple Notes on macOS 27, with a table of three columns, Book, Author and Started, and four books. Long titles wrap inside their cells."
        caption="A table in Apple Notes on macOS 27. Clean, quick, and Notes picks the column widths for you." />}
      faq={FAQ}
    >
      <h2 id="make">Make a table</h2>
      <PostFigure src="/blog/macos27/notes27-table-format-menu" width={1280} height={1116} maxWidth={640}
        phone={{ src: "/blog/macos27/notes27-table-format-menu-phone", width: 500, height: 1116 }}
        alt="The Format menu of Apple Notes on macOS 27 with Table highlighted and its shortcut, Option-Command-T. Behind the menu, a Moving budget note with a table."
        caption="Format, Table. The moving budget is already behind the menu." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Table button"] },
      ]} />
      <p>
        You get two rows and two columns with the caret in the first cell. Faster still: type the rows with a tab between each column,
        select them and press the Table button. Every tab becomes a column, which is how I turned a pasted list into a table in one go.
      </p>

      <h2 id="rows-columns">Add rows and columns</h2>
      <PostFigure src="/blog/macos27/notes27-table-row-menu-v2" width={1168} height={860} maxWidth={584}
        alt="A table in Apple Notes on macOS 27 with the row Van for half a day selected and its menu open: Add Row Above, Add Row Below and Delete Row."
        caption="A row's menu: add above, add below, delete. Columns get the same three." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Click a cell", "Row or column handle", "Arrow"] },
      ]} />
      <p>
        Tab in the last cell adds a row at the bottom, which is all a growing list needs. For anywhere else, click the small handle beside a
        row or above a column, then its arrow. Apple&apos;s <a href="https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac" rel="noopener">guide to tables</a> has
        the iPhone taps.
      </p>

      <h2 id="sum">Add it up: the trick for totals</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="A Moving budget table in Apple Notes on macOS 27. The Total cell reads 85+240+180= with no answer. Under the table, Boxes = 85, Van = 240 and Cleaning = 180 are named, and Boxes + Van + Cleaning = shows 505 as Notes' suggestion."
        caption="In the table, the sum just sits there. Under it, Notes answers: 505." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Math Results"] }]} />
      <p>
        This is where most people get stuck. I typed 85+240+180= into the Total cell and nothing happened: a table only holds text, and
        Math Results switches off while you&apos;re in one.
      </p>
      <p>
        The trick is to do the sum just under the table. Give each cost a name, then add the names up. Notes fills in the answer, and when
        the van turns out to be 280, change that one line and the total follows. It&apos;s the closest Apple Notes gets to a spreadsheet.
      </p>
      <Keep title="Paste this under your table" text={TOTAL}
        note="Notes offers the answer after the last equals sign; press Return to keep it." />

      <h2 id="sort">Sort a table</h2>
      <PostFigure src="/blog/macos27/notes27-table-format-in-table" width={1280} height={1126} maxWidth={640}
        alt="The Format menu of Apple Notes on macOS 27 opened from inside a table. Most styles and Math Results are greyed out, and there is no sort command."
        caption="Every menu checked from inside a table. There is no sort." />
      <p>
        You can&apos;t. Not in the Format menu, not under Table Actions, not in a row&apos;s menu. Drag rows by hand for a short list, or
        copy the table into Numbers and back.
      </p>

      <h2 id="column-width">Resize a column</h2>
      <PostFigure src="/blog/macos27/notes27-table-column-menu-v2" width={1168} height={860} maxWidth={584}
        alt="A table in Apple Notes on macOS 27 with the Cost column selected and its menu open: Add Column Before, Add Column After and Delete Column."
        caption="A column's whole menu. Nothing about width." />
      <p>
        You can&apos;t do that either. Dragging the line between two columns just selects cells. Short headers (&ldquo;Qty&rdquo;, not
        &ldquo;Quantity needed&rdquo;) are the only lever.
      </p>

      <h2 id="convert">Turn a table back into text</h2>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-table-convert-menu", width: 1096, height: 512,
          alt: "The Reading list table in Apple Notes on macOS 27 with the Table Actions button's menu open, showing one item, Convert to Text." },
        { src: "/blog/macos27/notes27-table-converted", width: 1096, height: 512,
          alt: "The same reading list after Convert to Text: highlighted lines of text, with tabs between the book, the author and the month." },
      ]} caption="Convert to Text turns each row into a line, with tabs between the cells." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Click in the table", "Table Actions", "Convert to Text"] },
      ]} />
      <p>Press the Table button with the lines still selected and it&apos;s a table again.</p>

      <h2 id="numbers">Copy a table into Numbers</h2>
      <PostFigure src="/blog/macos27/notes27-table-copy" width={1362} height={676} maxWidth={681}
        alt="Apple Notes on macOS 27 with a whole table selected, outlined in yellow, and the Edit menu open at Copy."
        caption="Drag across every cell, then Edit, Copy." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Drag across the cells", "Edit", "Copy"] }]} />
      <p>
        Drag from the first cell to the last; Select All only grabs one cell. Pasted elsewhere, the rows and columns stay intact, so this
        is the way out when you need sorting or real formulas. (The new <a href="/blog/apple-notes-ios-27">Copy as Markdown</a> doesn&apos;t work on tables.)
      </p>

      <h2 id="missing">What&apos;s still missing</h2>
      <p>
        By now my moving budget worked, sort of. The table held the costs, the total lived in three lines underneath, and every new cost
        meant updating two places. And the questions I actually had, it couldn&apos;t answer: what&apos;s left if I keep it under 800? Did I
        already pay the deposit? Notes has the numbers. It just can&apos;t think about them.
      </p>
      <p>
        What I wanted was a table I could talk to. Tell it &ldquo;the cleaner said 120&rdquo; from my phone and have the row appear. Ask
        &ldquo;what&apos;s the move costing so far?&rdquo; and get a number, not a menu.
      </p>

      <h2 id="pinto-notes">A table you can just ask</h2>
      <PostFigure src="/blog/pinto/pinto-budget-app-mac" width={1280} height={900} maxWidth={640}
        alt="The Budget and expenses app inside a note in Pinto Notes on a Mac: 8,205 kr left this month with a progress bar, spending by category, a six-month chart and the bills for the month."
        caption="A budget in Pinto Notes that adds itself up, with example data. You edit it, or your AI does." />
      <p>
        That&apos;s why I made Pinto Notes. It feels like Apple Notes and brings your notes over in <a href="/blog/move-from-apple-notes">one import</a>, tables included. The
        difference is who else can work in it: <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT</a> or Claude, and they read your table, add the row you mention and do the
        sum when you ask. And if a table should really be a little app, the <a href="/templates/budget-log">budget template</a> is one:
        it keeps the total, what&apos;s left and each category for you, and you can still change every line yourself.
        {APP_STORE_LIVE
          ? <> It&apos;s free on Mac and iPhone.</>
          : <> It&apos;s free on the Mac today, with the iPhone app coming soon.</>}
      </p>
    </PostPage>
  );
}
