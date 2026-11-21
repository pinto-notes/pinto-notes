import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-trip-planner-template", { title: "Apple Notes trip planner template, bookings to packing" });

// Written 15 November 2026 for "apple notes trip planner template" (autocomplete: ...template, apple notes planner
// template): blog-growth/topic-research-2026-11-13.md. The result page is an old Cult of Mac how-to, template spam,
// App Store listings and a forum thread; nothing gives a trip note to paste. Apple Notes facts, all tested in earlier
// posts on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title, headings and a checklist and
// drops empty items (apple-notes-templates, apple-notes-ios-27); Edit, Add Link (Command-K), Link to Section, and
// ">>" on iPhone (apple-notes-ios-27, Apple's "Add links in Notes on iPhone"); Format, Table, Option-Command-T
// (apple-notes-tables); File, Duplicate Note and Format, More, Uncheck All (apple-notes-habit-tracker); a note with a
// file attached, such as a PDF, can't be locked (forgot-apple-notes-password, from Apple's guide); Attach File in the
// iPhone edit menu on iOS 27 (Apple's image in apple-notes-ios-27). Pinto side: web/content/templates/trip-plan.app
// README (screens: countdown, days as timelines, bookings with paid ticks, packing by group, Share, a new trip keeps
// the packing list) and trip-plan.json (the AI prompt adds pasted bookings and plans the days).

const TEMPLATE = `# Lisbon, 22 to 26 October

## Bookings
- [ ] Flight ARN to LIS, Thu 22 Oct 06:55, ref TP7XQ2
- [ ] Hotel Principe Real, 22 to 26 Oct, ref 88412093
- [ ] Fado dinner, Sat 24 Oct 20:00
- [ ] Flight LIS to ARN, Mon 26 Oct 17:40

## Thursday 22 October
- 06:55 Flight to Lisbon
- 13:00 Lunch at Time Out Market
- 15:00 Check in at the hotel
- 19:30 Sunset at Miradouro da Senhora do Monte

## Friday 23 October
- 09:30 Tram 28 to Alfama
- 12:00 Lunch near the castle
- Afternoon free

## Saturday 24 October
- 10:00 Day trip to Sintra
- 20:00 Fado dinner

## Packing
- [ ] Passport or ID
- [ ] Travel insurance details
- [ ] Phone charger
- [ ] Travel adapter
- [ ] Comfortable shoes
- [ ] Rain jacket
- [ ] Toothbrush
- [ ] Sunscreen

## Ideas
- Bring back tinned sardines
- Ask Maja for her list of bakeries
`;

const FAQ = [
  { q: "Does Apple Notes have a trip planner template?", a: [
    "No. Apple Notes has no trip planner and no templates. One note with a heading for the bookings, a heading for each day and a packing checklist works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "Can I keep my tickets in Apple Notes?", a: [
    "Yes. On a Mac, drag the PDF into the note. On iPhone with iOS 27, Attach File is in the edit menu. One catch: a note with a file attached can't be locked.",
  ] },
  { q: "How do I reuse a packing list for the next trip?", a: [
    "Duplicate the note with File, Duplicate Note, then click in the packing list and choose Format, More, Uncheck All. Change the dates and delete the old days.",
  ] },
  { q: "Is there a free trip planner that works like a note?", a: [
    "Pinto Notes has a free trip plan template: a note that is a small app, with a countdown, each day as a timeline, the bookings with a tick for paid, and a packing list. ChatGPT or Claude can add a booking you paste to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-trip-planner-template"
      intro={<>
        The flight is in one email, the hotel in another, the plan for Saturday in a chat, and the packing list in your head. Apple Notes
        can hold all of it in one note. Here&apos;s a trip template to paste in, three ways to make it work better, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#better", label: "Make it work better" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A trip plan that keeps count" },
        ]}>
          <p>
            Apple Notes has no trip planner, but one note does the job. Give it a checklist of bookings you tick when they&apos;re paid,
            a heading for each day with times in front of the plans, and a packing checklist. Copy the template below.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-trip-planner-template" position="answer" template="trip-plan" title="Want the countdown and bookings kept for you?">
            <p>Pinto Notes works like Apple Notes and has a free trip plan template: days to go, each day as a timeline, what&apos;s left to pay and what&apos;s packed. Paste a booking email into ChatGPT or Claude and it lands in the plan.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/trip-booking" width={1200} height={750} maxWidth={560}
        alt="A drawn envelope with an arrow to a checklist card, two of its items ticked in orange."
        caption="Every booking email ends up as a line in the plan." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note per trip</h2>
      <p>
        Four days in Lisbon, as an example. Swap in your own trip before you paste: the bookings with their confirmation numbers, one
        heading per day, and what you always forget to pack. Keep every line with a word in it, because an empty checklist item
        doesn&apos;t survive the paste.
      </p>
      <Keep title="Trip planner for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="The same Markdown pasted twice in Apple Notes on macOS 27: with Command-V the symbols stay as text, and with Edit, Paste as Markdown it becomes a heading, a list and bold text."
        caption="Plain paste on the left, Paste as Markdown on the right. Checklist lines work the same way." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, make a new note and choose Edit, Paste as Markdown. The # line becomes the title, each ## line a
        heading, the bookings and the packing list become checklists, and the plans stay as a list. A plain Command-V keeps the symbols
        as text. On iPhone, type the lines, select the bookings and the packing list and tap the checklist button.
      </p>
      <p>
        Tick a booking once it&apos;s paid, so the unticked ones are what you still owe. If you&apos;d rather see bookings as a table with
        columns for the date and the reference, Format, Table makes one; <a href="/blog/apple-notes-tables">tables in Apple Notes</a> shows
        how, and what they can&apos;t do.
      </p>

      <h2 id="better">Make it work better</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link", "Link to Section"], keys: "⌘K" },
        { on: "iPhone", steps: ["Edit menu", "Add Link", "Link to Section"] },
      ]} />
      <ul>
        <li>
          <strong>A contents line at the top.</strong> On macOS 27 and iOS 27 a link can point at a heading, so the note can start with a
          link to each day. Type the trip&apos;s title under Link To and its headings show up.{" "}
          <a href="/blog/apple-notes-ios-27">What&apos;s new in Apple Notes in iOS 27</a> has the details.
        </li>
        <li>
          <strong>Tickets in the note.</strong> On a Mac, drag the PDF of a ticket or a hotel confirmation into the note, under its
          booking. On iPhone with iOS 27, use Attach File in the edit menu. A note with a file in it can&apos;t be locked, so keep
          passport numbers out of it.
        </li>
        <li>
          <strong>The same list next time.</strong> When you&apos;re back, choose File, Duplicate Note, then click in the packing list and
          choose Format, More, Uncheck All. The copy is the start of the next trip.
        </li>
      </ul>
      <p>
        If you plan this way often, <a href="/blog/apple-notes-templates">Apple Notes templates</a> has a packing list and a weekly review
        to paste in the same way.
      </p>

      <h2 id="limits">Where a trip planner in Notes stops</h2>
      <ul>
        <li><strong>No countdown.</strong> The dates are words. Notes doesn&apos;t know the trip is in nine days, or that today is day two.</li>
        <li><strong>Bookings by hand.</strong> Every confirmation email is copied in line by line: the time, the reference, the day it belongs to.</li>
        <li><strong>Days don&apos;t sort.</strong> Add a dinner to Friday and you find Friday&apos;s heading and the right spot in it yourself. Move it to Saturday and you cut and paste.</li>
        <li><strong>No count.</strong> How many bookings are still unpaid or how much is left to pack means counting ticks.</li>
      </ul>
      <p>
        For a weekend away, the note is plenty. For a week with flights, trains and a few dinners booked, you end up keeping the plan
        in order by hand.
      </p>

      <h2 id="pinto-notes">A trip plan that keeps count</h2>
      <Figure shot={SHOTS.tripApp} caption="The trip plan template in Pinto Notes on a Mac, with example data: 9 days to go, 3 of 5 bookings paid, 5 of 14 items packed, and the first day as a timeline." />
      <p>
        That&apos;s what Pinto Notes is for. It looks and works like Apple Notes on iPhone and Mac, and a note can also be a small app.
        The free <a href="/templates/trip-plan">trip plan</a> template is one. You say where you&apos;re going and when, and it counts the
        days down, then shows which day of the trip it is. Each day is a timeline with its bookings in place. Bookings have a kind, a
        time and a reference, and a tick once paid, so it says what&apos;s left to pay. The packing list is grouped, one tap per item, and
        a new trip keeps it.
      </p>
      <p>
        You can also paste a booking confirmation into ChatGPT or Claude, in the chat you already use, and it adds the booking to the
        right day. Ask what you still need to book and it reads the plan to answer.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
      <p>
        Moving house rather than travelling? The <a href="/blog/apple-notes-moving-checklist-template">moving checklist template</a> keeps address changes, utilities and boxes in one note.
      </p>
    </PostPage>
  );
}
