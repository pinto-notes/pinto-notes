import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-gift-ideas", { title: "Apple Notes gift ideas list, by person" });

// Written 21 November 2026 for "gift ideas list app" (topic-research-2026-11-20.md row 31; the only autocomplete
// suggestion that day). Seasonal: Christmas and birthdays, so it ships in November or waits a year. Apple Notes facts,
// all from earlier posts tried on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title,
// headings and checklists, a plain Command-V keeps the symbols, and an empty item doesn't survive (apple-notes-templates);
// tab-separated lines selected, then the Table button, make a table, Format, Table (Option-Command-T), Tab in the last
// cell adds a row, column widths can't be dragged, tables don't add up or sort (apple-notes-tables, wording copied from
// apple-notes-cornell-notes-template); Math Results does sums you type (apple-notes-budget-template); Format, More,
// Uncheck All and "Automatically sort checked items" (apple-notes-meal-planner-template, apple-notes-grocery-list-template);
// search reads every word and pinning a note (apple-notes-recipe-template); locked notes with a password, Face ID or Touch ID
// (forgot-apple-notes-password). The template's budgets are in kr (Swedish example data); the Apple Notes template here
// uses a plain Budget column. Pinto side: web/content/templates/gift-ideas.json (an Ideas table with Person, Occasion,
// Idea, Budget as a number and Status as a choice of Idea, Bought or Given, and a Sizes and likes list; the AI adds a
// row whenever you mention something someone would like, keeps sizes and likes, suggests three gifts within budget
// before a birthday and sets Bought; the asks "Dad's birthday is in three weeks. Ideas under 500?" and "Jonas wears a
// medium and loves anything green."). The picture is BlogSnapshots.giftIdeasForTemplatePost: the template's own example,
// drawn offscreen by the Mac app's NoteDetailView.

const SKELETON = `# Gift ideas

## Ideas
Paste the table here.

## Sizes and likes
- Maja: cooks a lot, already has a stand mixer.
- Jonas: medium, loves anything green.
- Mum: no more things; she'd rather do something together.
- Dad: has every scarf the club sells.

## Christmas
- [ ] Mum
- [ ] Dad
- [ ] Jonas
`;

// Tabs between the columns: select these lines in Notes and press the Table button.
const TABLE = `Person\tOccasion\tIdea\tBudget\tStatus
Maja\tHousewarming\tA good chef's knife\t900\tIdea
Dad\tChristmas\tFootball tickets\t500\tBought
Jonas\tBirthday\tA green wool beanie\t300\tIdea
Mum\tChristmas\tA weekend away\t2500\tIdea
Emma\tThank you\tGood olive oil\t200\tGiven
`;

const FAQ = [
  { q: "Does Apple Notes have a gift list template?", a: [
    "No. Apple Notes has no templates. One note with a table of ideas by person and a list of sizes and likes works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I keep a Christmas gift list on my iPhone?", a: [
    "Keep one note with a checklist of everyone you buy for and tick each name once their gift is bought. Pin the note so it's at the top when you're in a shop.",
  ] },
  { q: "Can I hide a gift list in Apple Notes?", a: [
    "Yes. Lock the note with a password, Face ID or Touch ID, and its contents stay hidden until you unlock it.",
  ] },
  { q: "Is there a gift ideas app that remembers what people like?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free gift ideas template. Tell ChatGPT or Claude what someone would like and it saves it, then suggests gifts within budget before a birthday.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-gift-ideas"
      intro={<>
        The perfect gift idea comes up in March, in passing, and by December it&apos;s gone. A note you add to the moment you hear one
        fixes that. Here&apos;s a gift ideas list for Apple Notes, by person, with budgets and sizes, ready for Christmas and every
        birthday after it.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#season", label: "Through the year" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A list that suggests gifts" },
        ]}>
          <p>
            Apple Notes has no gift list template, but one note does the job: a table with the person, the occasion, the idea, a budget
            and whether it&apos;s bought, then a list of sizes and likes for each person. Pin it, and add an idea the moment you hear it.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-gift-ideas" position="answer" template="gift-ideas" title="Want gift ideas saved as you hear them?">
            <p>Pinto Notes works like Apple Notes and has a free gift ideas list. Tell ChatGPT or Claude what someone would like and it adds the idea, then suggests gifts within budget before a birthday.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/gift-ideas-note" width={1520} height={1057} maxWidth={600}
        alt="A Gift ideas note in Pinto Notes on a Mac: an Ideas table of five gifts for Maja, Dad, Jonas, Mum and Emma with the occasion, a budget in kr and a status, and a Sizes and likes list for four people."
        caption="A gift ideas list in Pinto Notes, where Budget is a number and Status is a choice. In Apple Notes the same table holds them as typed text." />}
      faq={FAQ}
    >
      <h2 id="template">The template: ideas by person, sizes and likes</h2>
      <p>
        The table holds every idea, one row each, so you can see at a glance who has something and who doesn&apos;t. The sizes and likes
        list is what you learn about people over the year: a size, a favourite colour, what they already own. The Christmas checklist is
        who you still need a gift for. The note comes in two parts: the headings and lists first, then the table.
      </p>
      <Keep title="Gift ideas for Apple Notes" text={SKELETON}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the names under
        Christmas into a checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the names and tap the
        checklist button. Then replace the line under Ideas with the table.
      </p>
      <Keep title="Ideas table" text={TABLE}
        note="Each line has a tab between the columns. Paste it, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the table lines under Ideas, select the six lines from Person to the last
          gift, and press the Table button. Every tab becomes a column.
        </li>
        <li>
          <strong>Or start empty.</strong> Choose Format, Table for two rows and two columns, and Tab in the last cell adds the next row.
        </li>
        <li>
          <strong>Keep each idea short.</strong> Notes sets the column widths itself and you can&apos;t drag them. &ldquo;A green wool
          beanie&rdquo; is enough, and the details go under Sizes and likes.
        </li>
        <li>
          <strong>Lock it if family share your Mac.</strong> A locked note opens only with your password, Face ID or Touch ID.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t do.
      </p>

      <h2 id="season">Through the year, and at Christmas</h2>
      <ul>
        <li>
          <strong>Pin it.</strong> A pinned note sits at the top of its folder, so an idea heard at dinner goes in before you forget it.
        </li>
        <li>
          <strong>Search by name.</strong> Notes search reads every word, so searching &ldquo;Jonas&rdquo; finds his row and his size.
        </li>
        <li>
          <strong>Add up the budgets yourself.</strong> Tables don&apos;t add up, but Math Results does sums you type. Under the table,
          type 500 + 2500 = and Notes gives you the total for Christmas so far.
        </li>
        <li>
          <strong>Tick names as you buy.</strong> With &ldquo;Automatically sort checked items&rdquo; on, the people still left rise to the
          top of the Christmas list.
        </li>
        <li>
          <strong>Reset it next December.</strong> Click in the Christmas list and choose Format, More, Uncheck All.
        </li>
      </ul>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "More", "Uncheck All"] }]} />
      <p>
        For keeping the whole season&apos;s spending in view, the <a href="/blog/apple-notes-budget-template">Apple Notes budget
        template</a> adds itself up with Math Results. More notes to paste in are in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a gift list in Notes stops</h2>
      <ul>
        <li><strong>Ideas arrive somewhere else.</strong> A friend mentions a book in a message, and it only reaches the note if you stop and copy it.</li>
        <li><strong>No sorting.</strong> Tables in Notes don&apos;t sort, so seeing everything for one person or one occasion means reading the whole table.</li>
        <li><strong>The budget total is by hand.</strong> You type the sum again each time an idea changes.</li>
        <li><strong>The choosing is yours.</strong> The sizes, likes and budgets are all in the note, and matching them to a gift three weeks before a birthday is still up to you.</li>
      </ul>
      <p>
        For a handful of people, one note is all you need. For a family Christmas and a year of birthdays, keeping it current is the work.
      </p>

      <h2 id="pinto-notes">A gift list that suggests gifts</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/gift-ideas">gift ideas</a> template is one note with an Ideas table and a Sizes and
        likes list. In the table, Budget is a number and Status is a choice of Idea, Bought or Given.
      </p>
      <p>
        Mention something someone would like and your AI adds a row: the person, the occasion if you said one, the idea, the budget if
        you gave one, and Idea as the status. Say &ldquo;Jonas wears a medium and loves anything green&rdquo; and it goes under Sizes and
        likes. Ask &ldquo;Dad&apos;s birthday is in three weeks. Ideas under 500?&rdquo; and it suggests three gifts within budget that
        fit what&apos;s in the note. When you buy one, it sets the status to Bought. This part works once ChatGPT or Claude is connected,
        and <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute. You can still edit every row yourself,
        and every earlier version of the note is kept.
      </p>
      <p>
        The lists you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
      <p>
        Planning a wedding? The <a href="/blog/apple-notes-wedding-planner-template">wedding planner template</a> keeps guests, vendors and next steps in one note.
      </p>
    </PostPage>
  );
}
