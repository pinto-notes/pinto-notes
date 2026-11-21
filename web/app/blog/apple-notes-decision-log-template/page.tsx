import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-decision-log-template", { title: "Decision log template for Apple Notes, with the why" });

// Written 21 November 2026 for "decision log template" (Google autocomplete 20 Nov: decision log template, decision log
// template excel, project management, confluence, word and smartsheet; topic-research-2026-11-20.md row 19). The result
// page: Excel, Confluence and Smartsheet pages, no notes-app version. The angle is the why: a log that answers "why did
// we choose this" months later. Apple Notes facts, all from earlier posts tried on macOS 27: Edit, Paste as Markdown
// turns #, ## and "- [ ]" lines into a title, headings and checklists and a plain Command-V keeps the symbols
// (apple-notes-templates); column widths in a table can't be dragged (apple-notes-tables); Edit, Add Link, Command-K,
// links to another note and search reads every word (apple-notes-recipe-template); typing #word makes a tag
// (apple-notes-tags-smart-folders); pin a note (apple-notes-recipe-template); sharing a note needs an Apple Account for
// each person (apple-notes-meeting-notes-template, from support.apple.com/102462). Pinto side:
// web/content/templates/decision-log.json (Open questions and Decisions, newest first; the AI logs a decision under a
// heading with the date, then Context, Options, What we chose, Why and When to revisit, asks if the why is missing,
// moves questions out of Open questions once decided, and finds and quotes an entry when asked why; a Claude Code prompt
// logs technical decisions with the files they touch and checks the log before proposing a change; the asks "Why did we
// pick Stripe over Paddle?" and "What's still undecided?"). The picture is BlogSnapshots.decisionLogForTemplatePost: the
// template's own example, drawn offscreen by the Mac app's NoteDetailView.

const TEMPLATE = `# Decision log

Every decision worth remembering: what we chose, what we didn't, and why. Newest first.

## Open questions
- Do we support offline editing in the first release?
- Who owns the importer after the launch?

## Stay on Postgres, 4 November
- Context: notes grew to 2 million rows and search got slow.
- Options: a document store, a search service, or better indexes.
- Chose: Postgres with a trigram index.
- Why: one database to run, and the index made search 40 times faster.
- Revisit: at 20 million rows.

## Release every Tuesday, 2 November
- Context: releases slipped whenever one fix wasn't ready.
- Chose: ship what's ready every Tuesday.
- Why: small releases are easier to undo.
`;

const FAQ = [
  { q: "What goes in a decision log?", a: [
    "For each decision: the date, the context, the options you considered, what you chose, why, and when to look at it again. The why and the options are the parts people forget to write and later need most.",
  ] },
  { q: "Does Apple Notes have a decision log template?", a: [
    "No. Apple Notes has no templates. One note with a heading for each decision, newest first, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "Should a decision log be a table or a list?", a: [
    "In a spreadsheet, a table. In Apple Notes, a heading per decision reads better: column widths can't be dragged, and a long why squeezes into a narrow cell.",
  ] },
  { q: "Is there a decision log that answers why we chose something?", a: [
    "Pinto Notes has a free decision log template. Tell ChatGPT or Claude what you decided and it logs the context, options and why. Later, ask why you chose something and it quotes the entry.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-decision-log-template"
      intro={<>
        Teams re-argue settled questions because nobody wrote down why they were settled. A decision log fixes that, and it doesn&apos;t
        need Confluence or a spreadsheet. Here&apos;s a decision log template for Apple Notes, how to keep it, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#keep-it", label: "Keep it going" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A log that remembers why" },
        ]}>
          <p>
            Apple Notes has no decision log template, but one note does the job: open questions at the top, then a heading for each
            decision with its date, and under it the context, the options, what you chose, why, and when to revisit. Newest first, so the
            latest decisions are the first thing you read.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-decision-log-template" position="answer" template="decision-log" title="Want decisions logged for you?">
            <p>Pinto Notes works like Apple Notes and has a free decision log. Tell ChatGPT or Claude what you decided and it writes down the options and why, then finds it when you ask.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/decision-log-note" width={1520} height={1055} maxWidth={600}
        alt="A Decision log note in Pinto Notes on a Mac: two open questions, then a Stay on Postgres decision from 4 November with its context, options, choice, reason and when to revisit, and a Release every Tuesday decision below it."
        caption="A decision log in Pinto Notes, the way the template writes it. The same layout works in Apple Notes. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one heading per decision</h2>
      <p>
        Each entry is five short lines. Context says what forced the choice. Options lists what you didn&apos;t pick, which is the line
        that stops the same idea coming back next quarter. Revisit says when the answer might change, so it isn&apos;t treated as
        forever. Small decisions can skip Options, like the Tuesday release below.
      </p>
      <Keep title="Decision log for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
        { on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" },
      ]} />
      <ul>
        <li>
          <strong>Paste it once.</strong> On a Mac with macOS 27, make a note and choose Edit, Paste as Markdown. The # line becomes the
          title and each ## line a heading. A plain Command-V keeps the symbols as text. On iPhone, type it in.
        </li>
        <li>
          <strong>One log per project.</strong> Keep it in the project&apos;s folder and pin it to the top, so it&apos;s next to the notes
          it explains.
        </li>
        <li>
          <strong>Share it with the team.</strong> If everyone uses Apple Notes, share the note so each person can add their own
          decisions. Everyone needs an Apple Account.
        </li>
      </ul>

      <h2 id="keep-it">Keep it going</h2>
      <ul>
        <li>
          <strong>Log it the same day.</strong> The why is clearest at the end of the meeting where you decided. A week later it&apos;s
          already a guess.
        </li>
        <li>
          <strong>Move questions down when they&apos;re settled.</strong> When an open question is decided, delete it from Open questions
          and write its entry at the top of the decisions.
        </li>
        <li>
          <strong>Link from where it came up.</strong> In the meeting note, select the decision and choose Edit, Add Link to point at the
          log, so the meeting and the reasons stay connected.
        </li>
        <li>
          <strong>Search before you re-argue.</strong> Search reads every word in every note, so &ldquo;Postgres&rdquo; finds the entry
          before anyone books a meeting about it. A #decision tag on meeting notes that changed something helps too.
        </li>
      </ul>
      <p>
        Most decisions start in a meeting, and the <a href="/blog/apple-notes-meeting-notes-template">meeting notes template</a> has a
        Decisions heading for exactly that. More notes to paste in are in <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a decision log in Notes stops</h2>
      <ul>
        <li><strong>Someone has to write it.</strong> After a long meeting, the log is the first thing that gets skipped.</li>
        <li><strong>The why goes missing.</strong> Nothing asks for the reason when someone logs only the choice.</li>
        <li><strong>Search finds words, not answers.</strong> It finds every note that says Stripe. It can&apos;t answer &ldquo;why did we pick Stripe over Paddle?&rdquo;</li>
        <li><strong>Sharing needs an Apple Account.</strong> Every person on the team needs one to open and edit the shared log.</li>
      </ul>

      <h2 id="pinto-notes">A decision log that remembers why</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/decision-log">decision log</a> template is one note with Open questions and Decisions,
        newest first.
      </p>
      <p>
        Tell your AI about a decision in your own words. It adds an entry at the top with the decision in a few words and the date, then
        Context, Options considered, What we chose, Why, and When to revisit, a short line each. If you haven&apos;t said why, it asks.
        Questions you haven&apos;t settled go under Open questions, and come off the list once they&apos;re decided. Months later, ask
        &ldquo;why did we pick Stripe over Paddle?&rdquo; and it finds the entry and quotes it, or ask &ldquo;what&apos;s still
        undecided?&rdquo;. You can still write and edit every entry yourself, and every earlier version of the note is kept. This part
        works once ChatGPT or Claude is connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        In <a href="/blog/notes-in-claude-code-and-codex">Claude Code</a>, the template has its own instructions for a project&apos;s
        technical decisions. When you settle on a library, a schema or an architecture, it logs the entry with the files it affects, and
        before proposing a change it reads the log to check it isn&apos;t undoing a decision.
      </p>
      <p>
        The notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
      <p>
        Starting something new rather than recording a choice? A <a href="/blog/apple-notes-project-brief-template">project brief template</a> sets out the outcome, scope and checks first.
      </p>
    </PostPage>
  );
}
