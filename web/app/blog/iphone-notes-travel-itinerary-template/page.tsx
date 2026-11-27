import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, MenuPaths, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("iphone-notes-travel-itinerary-template", { title: "iPhone Notes travel itinerary template: day by day" });

// Written 27 November 2026 for "iphone notes travel itinerary template" (Google autocomplete, US: also "iphone notes travel
// itinerary", "iphone notes itinerary template", "apple notes travel itinerary template", "apple notes itinerary template",
// "notes app itinerary template"), in pattern E (lib/SideBySide.tsx), experiment B46. Page 1 is r/AppleNotesGang, Etsy,
// iAppList's guide, videos and App Store itinerary apps; pintonotes.com isn't on it. This is the day-by-day plan you open during
// the trip; the whole trip before you go (bookings to pay, packing) is apple-notes-trip-planner-template. Words: Codex, GPT-6.1
// Sol, checked and edited. Research: blog-growth/research/apple-notes-gym-itinerary-2026-11-27.md.
// Apple Notes: macOS 27.0 VM, Edit, Paste as Markdown: the # line the title, a heading per day, every line a dashed list item,
// nothing lost. File, Pin Note: the VM's File menu. iPhone: pin, support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios;
// collapsing a heading's section, support.apple.com/guide/iphone/create-and-format-notes-iph1ac0b3a2/ios (Mac: Notes User Guide,
// "Format notes"); Find in Note, support.apple.com/guide/iphone/search-notes-iphb8628c6b8/ios; a PDF from Files,
// support.apple.com/guide/iphone/work-with-pdfs-iph8958dd125/ios; Collaborate, support.apple.com/102296 and
// support.apple.com/guide/iphone/share-and-collaborate-iphe4d04f674/ios (an Apple Account each).
// Pinto Notes: content/templates/trip-plan.app drawn by scripts/blog-side-by-side-apps.ts (travel-itinerary) with the same trip on
// Friday 4 December: the Trip tab on iPhone (Day 2 of 4, today first), the Days tab on a Mac. Bookings joining their day at their
// time, Share, the AI adding a pasted booking: trip-plan.app/docs/README.md.

const TEMPLATE = `# Chicago, 3 to 6 December

## Thursday 3 December
- 08:15 Flight to Chicago, ref QX4T7B
- 12:30 Check in, Hotel Lakeview, ref 77310452
- 14:00 Millennium Park
- 19:30 Dinner at Marlow's, table for 2

## Friday 4 December
- 10:00 Art Institute, tickets ref AIC5521
- 13:00 Lunch in the West Loop
- 16:00 Walk the Riverwalk
- 20:00 Blues show, ref BL0412

## Saturday 5 December
- 09:30 Brunch near the hotel
- 11:00 Field Museum
- Afternoon free

## Sunday 6 December
- 11:00 Check out
- 16:45 Flight home, ref QX4T7B
`;

const FAQ = [
  { q: "How should I lay out each travel day in Notes on iPhone?", a: [
    "Give each day a heading, then start each line with its time. Keep the lines in time order, with each booking ref on the line it belongs to.",
  ] },
  { q: "How can everyone on the trip edit the itinerary?", a: [
    "Tap the Share button, then Collaborate, and choose how to send the invitation. Everyone needs an Apple Account to edit it with you.",
  ] },
  { q: "How do I attach a confirmation PDF to an itinerary?", a: [
    "On iPhone, open Files, touch and hold the PDF, tap Share, then Notes, choose the itinerary note and tap Save. On a Mac, drag the PDF into the note. For a link to a ticket, paste its web address.",
  ] },
  { q: "Should packing go below the daily itinerary?", a: [
    "Keep packing in its own note, so the itinerary stays short enough to scroll on a phone. The trip planner template holds bookings, days and packing in one note.",
  ] },
  { q: "Can ChatGPT or Claude add a booking to my itinerary?", a: [
    "Yes, in Pinto Notes' free trip plan. Paste the confirmation to your AI and it adds the booking to the right day, at its time.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="iphone-notes-travel-itinerary-template"
      cover={false}
      intro={<>A travel itinerary in one note: a heading for each day and a time at the start of each line, with the booking refs where you need them.</>}
      answer={<>
        <Keep title="Travel itinerary for iPhone Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B46: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="iphone-notes-travel-itinerary-template" position="answer" title="Still scrolling your trip note to find today's plan?">
          <p>Pinto Notes&apos; free trip plan opens on today during the trip, with each booking at its time in the day.</p>
        </PostCta>
        <SideBySide slug="iphone-notes-travel-itinerary-template"
          apple={{ src: "/blog/side-by-side/travel-itinerary-template-apple-notes", width: 770, height: 921, line: "The whole trip in one long note. Finding today and fitting in a new booking is up to you.",
            alt: "The Chicago itinerary for 3 to 6 December in Apple Notes on macOS 27: a heading per day and each plan on its own line, starting with the time, with the booking refs." }}
          pinto={{ title: "The same itinerary in Pinto Notes", line: "Today's plan comes first, with each booking at its time among the other plans.",
            alt: "The same Chicago trip in the Pinto Notes trip plan on Friday 4 December: day 2 of 4, 5 of 5 bookings paid, and today as a timeline: 10:00 Art Institute, ref AIC5521, 13:00 Lunch in the West Loop, 16:00 Walk the Riverwalk, 20:00 Blues show, ref BL0412. On a Mac, all four days as timelines.",
            phone: { src: "/blog/side-by-side/travel-itinerary-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/travel-itinerary-pinto-mac", width: 2200, height: 1520 },
            template: "trip-plan" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Put in your days and times, with each booking ref on its line. Keep a word in every line.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the lines, with a heading for each day.</li>
        <li>Pin the note for the trip, so it&apos;s at the top of Notes when you need it.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Touch and hold the note", "Pin Note"] },
            { on: "Mac", steps: ["File", "Pin Note"] },
          ]} /></li>
        <li>During the trip, tap the Collapse button by each day that&apos;s done, so today is nearer the top. Or search the note for the day:
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Note Actions button", "Find in Note"] },
          ]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-trip-planner-template">a trip planner with bookings and packing</a>, <a href="/blog/apple-notes-packing-list-template">a packing list</a> and <a href="/blog/apple-notes-templates">more templates</a>.</p>
    </PostPage>
  );
}
