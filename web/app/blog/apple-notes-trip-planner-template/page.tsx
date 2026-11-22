import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-trip-planner-template", { title: "Apple Notes trip planner template, bookings to packing" });

// Written 15 November 2026 for "apple notes trip planner template"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0, Edit, Paste as Markdown, sorting off): the #
// line the title, each ## line a heading, Bookings and Packing checklists, the day plans a dashed list. Two bookings (the
// outbound flight and the hotel) and three packing items (Passport, Phone charger, Travel adapter) ticked.
// Pinto Notes: content/templates/trip-plan.app rendered with scripts/page-render with the same trip, days, four bookings (two
// paid) and eight packing items (three packed), seen on 13 October, nine days before (public/blog/side-by-side/trip-pinto-*).

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
    "Yes. On a Mac, drag the PDF into the note. On iPhone with iOS 27, Attach File is in the edit menu. A note with a file attached can't be locked.",
  ] },
  { q: "How do I reuse a packing list for the next trip?", a: [
    "Duplicate the note with File, Duplicate Note, then click in the packing list and choose Format, More, Uncheck All. Change the dates and delete the old days.",
  ] },
  { q: "Is there a free trip planner that works like a note?", a: [
    "Pinto Notes has a free trip plan template: a countdown, each day as a timeline, the bookings with a tick for paid, and a packing list. ChatGPT or Claude can add a booking you paste to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-trip-planner-template"
      cover={false}
      intro={<>One note for the trip: bookings to tick when paid, a heading for each day, and the packing list.</>}
      answer={<>
        <Keep title="Trip planner for Apple Notes" text={TEMPLATE}
          note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
        <SideBySide slug="apple-notes-trip-planner-template"
          apple={{ src: "/blog/side-by-side/trip-planner-template-apple-notes", width: 781, height: 1529, line: "Holds the plan. Counting the days and what's left to pay is up to you.",
            alt: "The trip template in Apple Notes on macOS 27: four bookings with two ticked, a heading for each day with times, a packing checklist with three ticked, and ideas." }}
          pinto={{ title: "The same trip in Pinto Notes", line: "Counts the days and what's left to pay. Paste a booking into your AI and it lands on the right day.",
            alt: "The same Lisbon trip in the Pinto Notes trip plan, nine days before: 2 of 4 bookings paid, 3 of 8 packed, and the first day as a timeline.",
            phone: { src: "/blog/side-by-side/trip-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/trip-pinto-mac", width: 1526, height: 1008 },
            href: "/templates/trip-plan", button: "Get the trip plan template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Swap in your trip: the bookings with their references, a heading per day, what you always forget. Keep a word in every line.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the lines, select the bookings and the packing list and tap the checklist button.</li>
        <li>Tick a booking once it&apos;s paid, so the unticked ones are what you still owe.</li>
        <li>For the next trip, duplicate the note and untick the packing list: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-meal-planner-template">a meal planner</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
