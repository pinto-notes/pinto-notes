import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, FigurePair, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-tables", { title: "Apple Notes tables: add rows, sum a column, sort and resize" });

// Rebuilt image-led on 14 October 2026, in the format of the iOS 27 post: one section per thing people
// search for, each with a real capture of that action. Every picture in public/blog/macos27/notes27-table-*
// was taken that day in Notes on macOS 27, in a throwaway VM with no Apple Account (deleted afterwards),
// light mode, in a "Pinto blog demo" folder. Tried there: Format, Table; tab-separated lines plus the
// Table button make a table; Tab in the last cell adds a row; the row and column menus (add and delete
// only); dragging a column edge selects cells and doesn't resize; a sum in a cell gets no result and Math
// Results is greyed out in a table; the same sum under the table gets 505; Table Actions has only Convert
// to Text; a whole table selected and copied pastes into TextEdit as a table, and Copy as Markdown is
// greyed out for it. Not tried: Numbers (not on the test Mac), iPhone, dragging rows.
// Pinto Notes' side checked in Pane/Views/RootView.swift (Format, Table, Option-Command-T),
// Pane/Editor/TableGrid.swift (row and column menus; no sort, no sums; widths fit the text) and the
// read_table and log_table_row tools in supabase/functions/mcp/tools.ts.

const FAQ = [
  { q: "Can Apple Notes add up a column in a table?", a: [
    "No. A table in Apple Notes holds text, with no formulas and no sum, and Math Results is greyed out while you're in a table. Type the sum under the table instead, where Math Results answers it, or copy the table into Numbers.",
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
      intro={<>I made a reading list and a moving budget in Apple Notes on macOS 27 and tried every table action I could find. Here&apos;s each one with its menu, and what a table in Notes can&apos;t do.</>}
      answer={
        <Answer jump={[
          { href: "#make", label: "Make a table" },
          { href: "#rows-columns", label: "Rows and columns" },
          { href: "#sum", label: "Sum a column" },
          { href: "#sort", label: "Sort" },
          { href: "#column-width", label: "Column width" },
          { href: "#convert", label: "Convert to text" },
          { href: "#numbers", label: "Copy to Numbers" },
        ]}>
          <p>
            Choose Format, Table (Option-Command-T). Press Tab in the last cell for a new row, and use the handle beside a row or
            above a column to add or delete one. Apple Notes can&apos;t sum a column, sort a table or set a column&apos;s width. For a
            total, type the sum under the table and Math Results answers it. To sort or use formulas, copy the table into Numbers.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/macos27/notes27-table-reading-list" width={1400} height={554} maxWidth={700}
        phone={{ src: "/blog/macos27/notes27-table-reading-list-phone", width: 1098, height: 492 }}
        alt="A note called Reading list in Apple Notes on macOS 27, with a table of three columns, Book, Author and Started, and four books. Long titles wrap inside their cells."
        caption="A table in Apple Notes on macOS 27. Notes picks the column widths, so long titles wrap." />}
      faq={FAQ}
    >
      <h2 id="make">Make a table</h2>
      <PostFigure src="/blog/macos27/notes27-table-format-menu" width={1280} height={1116} maxWidth={640}
        phone={{ src: "/blog/macos27/notes27-table-format-menu-phone", width: 500, height: 1116 }}
        alt="The Format menu of Apple Notes on macOS 27 with Table highlighted and its shortcut, Option-Command-T. Convert to Text is greyed out below it. Behind the menu, a Moving budget note with a table."
        caption="Format, Table. Convert to Text, just under it, only works when you're in a table." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
        { on: "iPhone", steps: ["Table button"] },
      ]} />
      <p>
        You get an empty table with two rows and two columns, and the caret in the first cell. The Table button in the toolbar does
        the same. If you already have the text, put a tab between the columns, select the lines and click the Table button. I typed
        the reading list that way and every tab became a column.
      </p>

      <h2 id="rows-columns">Add rows and columns</h2>
      <PostFigure src="/blog/macos27/notes27-table-row-menu" width={768} height={327} maxWidth={384}
        alt="A table in Apple Notes on macOS 27 with the row Van for half a day selected and its menu open: Add Row Above, Add Row Below and Delete Row."
        caption="The menu from a row's handle. A column's handle has the same three, for columns." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Click a cell", "Row or column handle", "Arrow"] },
      ]} />
      <p>
        For a new row at the bottom, press Tab in the last cell. Anywhere else, click a cell, click the small handle beside its row or
        above its column, then the arrow on it, and choose Add Row Above, Add Row Below or Delete Row (or the column versions). Apple
        says you can drag a selected row or column to move it, and
        its <a href="https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac" rel="noopener">guide to tables on Mac</a> has the iPhone taps too.
      </p>

      <h2 id="sum">Sum a column</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum" width={768} height={430} maxWidth={384}
        alt="A moving budget table in Apple Notes on macOS 27. The Total row's cell reads 85+240+180= with no answer. Under the table, three lines name Boxes, Van and Cleaning with their costs, and the line Boxes + Van + Cleaning = shows 505 in yellow."
        caption="The sum in the Total cell stays as typed. The same sum under the table gets its answer, 505." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Math Results"] }]} />
      <p>
        This is what most people come for, and Notes can&apos;t do it. A table holds text, with no formulas, and Math Results is greyed
        out while the caret is in a table. What works is the sum under the table: give each number a name, and the total updates when
        you change one. Format, Math Results sets whether Notes suggests the answer, inserts it or stays out of it.
      </p>
      <Keep title="A total to keep under a table" text={TOTAL}
        note="Type these lines under the table, not in a cell. Notes offers the answer after the last equals sign; press Return to keep it." />

      <h2 id="sort">Sort a table</h2>
      <PostFigure src="/blog/macos27/notes27-table-format-in-table" width={1280} height={1126} maxWidth={640}
        alt="The Format menu of Apple Notes on macOS 27 opened from inside a table. Most styles and Math Results are greyed out, Convert to Text is available, and there is no sort command."
        caption="The Format menu from inside a table. No sort, and Math Results is greyed out." />
      <p>
        There&apos;s no sort anywhere: not in the Format menu, the Table Actions button or the row and column menus. In a short table,
        drag the rows into order by hand. For anything longer, copy the table into Numbers, sort it there and paste it back.
      </p>

      <h2 id="column-width">Resize a column</h2>
      <PostFigure src="/blog/macos27/notes27-table-column-menu" width={1055} height={317} maxWidth={528}
        alt="A table in Apple Notes on macOS 27 with the Cost column selected and its menu open: Add Column Before, Add Column After and Delete Column."
        caption="The whole menu for a column. Nothing in it sets a width." />
      <p>
        You can&apos;t. Notes sets the widths, and when I dragged the line between two columns it selected cells instead. Short headers
        help (&ldquo;Qty&rdquo; rather than &ldquo;Quantity needed&rdquo;), and so does keeping long text under the table.
      </p>

      <h2 id="convert">Turn a table into text</h2>
      <FigurePair items={[
        { src: "/blog/macos27/notes27-table-convert-menu", width: 1096, height: 512,
          alt: "The Reading list table in Apple Notes on macOS 27 with the Table Actions button's menu open, showing one item, Convert to Text." },
        { src: "/blog/macos27/notes27-table-converted", width: 1096, height: 512,
          alt: "The same reading list after Convert to Text: five highlighted lines of text, with tabs between the book, the author and the month." },
      ]} caption="Table Actions has one item, Convert to Text. Each row becomes a line, with tabs between the cells." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Click in the table", "Table Actions", "Convert to Text"] },
        { on: "Or", steps: ["Format", "Convert to Text"] },
      ]} />
      <p>Click the Table button with the lines still selected and it&apos;s a table again.</p>

      <h2 id="numbers">Copy a table into Numbers</h2>
      <PostFigure src="/blog/macos27/notes27-table-copy" width={1362} height={676} maxWidth={681}
        alt="Apple Notes on macOS 27 with a whole table selected, outlined in yellow, and the Edit menu open at Copy. Copy as Markdown is greyed out."
        caption="Drag across the table to select every cell, then Edit, Copy. Copy as Markdown is greyed out for a table." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Drag across the cells", "Edit", "Copy"] }]} />
      <p>
        Drag from the first cell to the last; Select All only selects the text in one cell. Pasted into TextEdit, the copy came out as a
        table with the same rows and columns, so a spreadsheet gets the cells too. My test Mac has no Numbers, so I couldn&apos;t try that
        last step there.
      </p>

      <h2 id="limits">What Apple Notes tables can&apos;t do</h2>
      <ul>
        <li>Add up, count or average a column, or use any formula. Math Results is off inside tables.</li>
        <li>Sort rows, or filter them.</li>
        <li>Set a column&apos;s width or a row&apos;s height.</li>
        <li>Merge cells. The row and column menus only add and delete.</li>
        <li>Copy a whole table as Markdown. <a href="/blog/apple-notes-ios-27">Copy as Markdown</a> is new in macOS 27, but it&apos;s greyed out for a table.</li>
      </ul>

      <h2 id="pinto-notes">If you want your AI to do the sums</h2>
      <Figure shot={SHOTS.tracker} caption="An Evening tracker in Pinto Notes on a Mac. A wide table scrolls sideways instead of squeezing its columns." />
      <p>
        I make Pinto Notes, a notes app for Mac and iPhone that works like Apple Notes. Its tables are just as plain: Format, Table
        (Option-Command-T), the same row and column menus, and no sums or sorting either. The difference is that ChatGPT or Claude can
        read the table and add a row for today. Ask &ldquo;what did the move cost?&rdquo; and they do the sum for you; <a href="/blog/budget-tracker-with-chatgpt-or-claude">a budget tracker with ChatGPT or Claude</a> shows how that goes.
        {APP_STORE_LIVE
          ? <> The Mac and iPhone apps are both out.</>
          : <> The Mac app is out, and the iPhone app is coming soon.</>}{" "}
        <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> brings your tables across in one import.
      </p>
      <PostCta slug="apple-notes-tables" position="how-amber-helps" title="Try Pinto Notes on your Mac">
        <p>Tables that ChatGPT and Claude can read, add rows to and total for you.</p>
      </PostCta>
    </PostPage>
  );
}
