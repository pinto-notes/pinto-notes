import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, Keep, Paths, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-tables", { title: "Apple Notes tables: column width, sums and formulas" });

// Checked on 4 October 2026 against Apple's pages: Add a table in Notes on Mac (macOS 27 and 26), Create
// and format notes on iPhone (iOS 27), and Solve math in Notes on Mac. Menu names read from Notes on
// macOS 26.5: MainMenu.nib (Format, Table, Option-Command-T; Convert to Text; Format, Math Results) and the
// app's Shortcuts actions (Add Table to Note, which takes comma-separated values). Pinto Notes' side
// checked in Pane/Editor/TableGrid.swift and the read_table and log_table_row tools in
// supabase/functions/mcp/tools.ts. Updated 12 October 2026: tables are plain to edit, with no column
// types to set; a Yes/No column from a template keeps its tick.
// Rewritten answer first on 11 October: same facts, no new claims about Apple Notes.
// Tested the same day in Notes on macOS 27.0 in a throwaway VM with no Apple Account (deleted afterwards):
// Format, Table (Option-Command-T), Convert to Text and Format, Math Results (Insert Results, Suggest
// Results, Off) are in the menu; the column handle's menu has Add Column Before, Add Column After and
// Delete Column and nothing for width; a sum typed in a cell gets no result, and the same sum with
// names under the table gets one. The two captures in public/blog/macos27/notes-table-* are from
// that VM.

const FAQ = [
  { q: "Can you change the column width of a table in Apple Notes?", a: [
    "No. Apple Notes sets column widths itself. Neither the Format menu, the column's own menu nor Apple's guide has a way to drag or set them, on macOS 27 as before. Shorter header text, and longer text moved below the table, are the only levers.",
  ] },
  { q: "Can Apple Notes add up a column in a table?", a: [
    "No. Tables in Apple Notes have no formulas and no sum. Math Results, which solves sums like 120+45= as you type, works in the body of a note and not in table cells: on macOS 27 a sum typed in a cell stays as typed. Write the total as a sum under the table, or move the data to Numbers.",
  ] },
  { q: "How do I add a row or column to an Apple Notes table?", a: [
    "On a Mac, click the table, click the handle to the left of a row or above a column, then click its down arrow and choose to add or remove. Pressing Tab or Return in the last cell adds a row at the bottom.",
  ] },
  { q: "How do I turn a table back into text in Apple Notes?", a: [
    "Click anywhere in the table, click the Table Actions button and choose Convert to Text. On a Mac, Format, Convert to Text does the same.",
  ] },
];

const TOTAL = `Flights = 420
Hotel = 610
Food = 250
Flights + Hotel + Food =
`;

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-tables"
      intro={<>Apple Notes tables are simple on purpose. If you came here to make a column wider or add one up, the answer is short, and there are workarounds that hold.</>}
      answer={
        <Answer jump={[
          { href: "#can-and-cant", label: "What tables can and can't do" },
          { href: "#add", label: "Add a table" },
          { href: "#rows-columns", label: "Rows and columns" },
          { href: "#width", label: "Column width" },
          { href: "#sums", label: "Sums" },
          { href: "#import", label: "Data from a spreadsheet" },
        ]}>
          <p>
            You can&apos;t set a column&apos;s width in Apple Notes, and a table can&apos;t add up a column: there are no formulas
            and no sorting. You can add, delete and move rows and columns, paste into cells, and turn a table back into text. For a
            total, type the sum under the table and Math Results solves it. For real formulas, the table belongs in Numbers.
          </p>
        </Answer>
      }
      // Nothing above the intro, so the short answer is on the first screen. The captures sit in the
      // sections that use them.
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="can-and-cant">What tables can and can&apos;t do</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">You want to</th><th scope="col">In Apple Notes</th><th scope="col">What to do</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Add or delete a row or column</th><td>Yes</td><td>The handle beside the row or above the column</td></tr>
            <tr><th scope="row">Move a row or column</th><td>Yes</td><td>Select it, hold until it lifts, then drag</td></tr>
            <tr><th scope="row">Turn text into a table, or back</th><td>Yes</td><td>The Table button, or Convert to Text</td></tr>
            <tr><th scope="row">Set a column&apos;s width</th><td>No</td><td>Shorter headers, long text under the table</td></tr>
            <tr><th scope="row">Add up a column</th><td>No</td><td>A sum under the table, solved by Math Results</td></tr>
            <tr><th scope="row">Sort, or use formulas</th><td>No</td><td>Move the table to Numbers</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="add">Add a table</h2>
      <p>On a Mac, click where the table should go, then:</p>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
      ]} />
      <p>
        Notes adds an empty table with two rows and two columns, and the Table button in the toolbar does the same. On iPhone,
        tap the Add Table button while you write. To turn
        text you&apos;ve already written into a table, select the paragraphs first and then click the Table button. To go the
        other way, click in the table, click the Table Actions button and choose Convert to Text. Apple&apos;s steps are in{" "}
        <a href="https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac" rel="noopener">Add a table in Notes on Mac</a>.
      </p>

      <h2 id="rows-columns">Rows and columns</h2>
      <p>On a Mac:</p>
      <Steps>
        <li>
          <strong>Add a row at the bottom</strong>
          Press Tab or Return in the last cell. Tab and the arrow keys also move between cells.
        </li>
        <li>
          <strong>Add or delete anywhere else</strong>
          Click the table, click the handle to the left of the row or above the column, then click its down arrow and choose.
        </li>
        <li>
          <strong>Move a row or column</strong>
          Select it, click and hold until it lifts off the table, and drag.
        </li>
        <li>
          <strong>Clear or remove one</strong>
          Select it and press Delete to empty it. If it&apos;s already empty, Delete removes it.
        </li>
      </Steps>
      <Capture src="/blog/macos27/notes-table-column-menu" width={560} height={264} maxWidth={320}
        alt="A table in Apple Notes on a Mac with its Cost column selected. The menu from the column's handle lists Add Column Before, Add Column After and Delete Column."
        caption="The whole menu for a column, in Notes on macOS 27. Nothing in it sets a width." />
      <p>
        On iPhone, tap a cell, then tap the handle above its column or beside its row for the same options: add one before or after,
        or delete it.
      </p>
      <p>
        Pasting into a cell drops named styles such as Monostyled and Subheading. You can also copy a whole table out of Safari or
        Pages and paste it into a note, though Apple warns that some formatting won&apos;t come along.
      </p>

      <h2 id="width">Column width: you can&apos;t change it</h2>
      <p>
        This is the most common complaint, and there&apos;s no setting for it. Notes decides how wide each column is. There&apos;s no
        edge to drag, and neither the Format menu, the column&apos;s menu above nor Apple&apos;s guide has anything for width. What helps:
      </p>
      <ul>
        <li>Keep headers short. &ldquo;Qty&rdquo; leaves more room for the column next to it than &ldquo;Quantity needed&rdquo;.</li>
        <li>Keep long text out of the table. Put a short label in the cell and the paragraph under the table.</li>
        <li>Split a wide table into two narrower ones. A table with eight columns is cramped on an iPhone whatever you do.</li>
      </ul>

      <h2 id="sums">Sums and formulas: there aren&apos;t any</h2>
      <p>
        A table in Apple Notes holds text. It can&apos;t total a column, count rows or refer to another cell. I typed{" "}
        <code>420+610+250=</code> into a cell on macOS 27 and nothing happened. What Notes does have is Math Results, which solves
        the same sum the moment you type it under the table, in the body of the note. It works with names too, so the total
        updates when you change a number.
      </p>
      <Capture src="/blog/macos27/notes-table-math" width={480} height={264} maxWidth={320}
        alt="A Trip budget note in Apple Notes on a Mac. In the table, the Total row's cell reads 420+610+250= with no result. Under the table, three lines name Flights, Hotel and Food, and a fourth, Flights + Hotel + Food =, is followed by 1,280 in yellow."
        caption="Notes on macOS 27. The sum in the Total cell stays as typed. The same sum under the table gets its answer, 1,280." />
      <Keep title="A total to keep under a table" text={TOTAL}
        note="Type these lines under the table, in the note itself and not in a cell. Notes offers the result after the last equals sign." />
      <p>
        Apple documents this for iCloud notes and notes kept on your Mac. Whether Notes offers the result, puts it in for you or
        leaves sums alone is a setting, with Insert Results, Suggest Results or Off:
      </p>
      <Paths rows={[
        { on: "Mac", steps: ["Format", "Math Results"] },
      ]} />
      <p>
        Apple&apos;s steps are in <a href="https://support.apple.com/guide/notes/solve-math-apda85974595/mac" rel="noopener">Solve
        math in Notes on Mac</a>. So for a budget or a tally, the pattern that holds is the table for the items and those lines
        under it for the total. If you need real formulas, sorting or charts, the table has outgrown Notes, and Numbers is the
        place for it.
      </p>

      <h2 id="import">Getting data in from a spreadsheet</h2>
      <p>
        On macOS 26, Notes gives the Shortcuts app an Add Table to Note action that takes comma-separated values. Export a sheet from
        Numbers as CSV, pass the text to that action, and the rows arrive as a table in the note you pick.
      </p>
      <p>
        Getting tables out is less certain. Before you rely on the Markdown export for tables, try it on one note and check the file; <a href="/blog/export-apple-notes-to-markdown">how
        to export Apple Notes to Markdown</a> covers what to look for, and <a href="/blog/back-up-apple-notes">how to back up Apple Notes</a> covers
        keeping a copy.
      </p>

      <h2 id="pinto-notes">When you want a table that does more</h2>
      <p>
        Pinto Notes, the notes app for iPhone and Mac that I make, keeps tables just as plain to edit. On a Mac it&apos;s Format, Table
        (Option-Command-T), or the Table button, and the caret lands in the first cell. Every cell is text you type in. A tracker made
        from a template keeps a tick you click for its yes-or-no columns. It doesn&apos;t do sums or formulas either, and you can&apos;t set
        column widths, which fit the text. A table too wide for the window scrolls sideways instead of squeezing every column.
      </p>
      <Figure shot={SHOTS.tracker} caption="An Evening tracker in Pinto Notes on a Mac: number columns, and Yes/No columns you tick." />
      <p>
        One thing Apple Notes can&apos;t do: ChatGPT or Claude can work with the table:
        they read its rows, add a row for today, and answer questions such as &ldquo;what did I spend on food this
        month?&rdquo; by doing the sum themselves. The table stays markdown underneath, so any editor can open it.
      </p>
      {APP_STORE_LIVE ? (
        <p>
          The iPhone app has the same tables, with the Table button in the format bar. <a href="/blog/move-from-apple-notes">Moving
          from Apple Notes</a> brings your existing tables across in one import on your Mac.
        </p>
      ) : (
        <p>
          The iPhone app is coming soon to the App Store, with the same tables. <a href="/blog/move-from-apple-notes">Moving from
          Apple Notes</a> brings your existing tables across in one import on your Mac, and <a href="/blog/pinto-notes-vs-apple-notes">Pinto
          Notes vs Apple Notes</a> compares the rest.
        </p>
      )}
      <PostCta slug="apple-notes-tables" position="how-amber-helps" title="Try Pinto Notes on your Mac">
        <p>Tables with typed columns, which ChatGPT and Claude can read and add rows to.</p>
      </PostCta>
    </PostPage>
  );
}
