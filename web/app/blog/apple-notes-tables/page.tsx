import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, Keep, Paths } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-tables", { title: "Apple Notes tables: add rows, sum a column, sort and resize" });

// Rebuilt image-led on 14 October 2026, in the format of the iOS 27 post: one section per thing people
// search for (make, rows and columns, sum, sort, resize, convert to text, copy to Numbers), each with
// a real capture of that action. Every capture in public/blog/macos27/notes-tables-* was taken that
// day in Notes on macOS 27, in a throwaway VM with no Apple Account (deleted afterwards), light mode,
// in a "Pinto blog demo" folder. Pinto Notes' side checked in Pane/Views/RootView.swift (Format,
// Table, Option-Command-T), Pane/Editor/TableGrid.swift (row and column menus; no sort, no sums,
// widths fit the text) and the read_table and log_table_row tools in supabase/functions/mcp/tools.ts.

const FAQ = [
  { q: "Can Apple Notes add up a column in a table?", a: [
    "No. A table in Apple Notes holds text, with no formulas and no sum. Math Results, which solves sums as you type, works in the body of a note and not in table cells. Type the sum under the table, or copy the table into Numbers.",
  ] },
  { q: "Can you sort a table in Apple Notes?", a: [
    "No. There's no sort command in the Format menu, the Table Actions menu or a column's own menu, on macOS 27 as before. You can drag rows into order by hand, or copy the table into Numbers and sort it there.",
  ] },
  { q: "Can you change the column width of a table in Apple Notes?", a: [
    "No. Notes sets column widths itself and there's no edge to drag. Shorter header text, and long text moved below the table, are the only levers.",
  ] },
  { q: "How do I add a row or column to an Apple Notes table?", a: [
    "On a Mac, press Tab in the last cell to add a row at the bottom. Anywhere else, click the handle beside a row or above a column, then choose Add Row Above, Add Row Below, Add Column Before or Add Column After.",
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
      intro={<>I made a moving budget in Apple Notes on macOS 27 and tried every table action I could find. Here&apos;s how to do each one, with the menu path, and the three things a table in Notes can&apos;t do.</>}
      answer={
        <Answer>
          <p>
            Choose Format, Table (Option-Command-T) to make a table. Press Tab in the last cell for a new row, and use the handle
            beside a row or above a column to add, delete or move one. Apple Notes can&apos;t sum a column, sort a table or set a
            column&apos;s width. For a total, type the sum under the table and Math Results answers it. To sort or use formulas,
            copy the table into Numbers.
          </p>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      {/* SECTIONS */}
    </PostPage>
  );
}
