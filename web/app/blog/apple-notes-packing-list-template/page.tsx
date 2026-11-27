import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-packing-list-template", { title: "Apple Notes packing list template for iPhone and Mac" });

// Written 23 November 2026 for "apple notes packing list template" (Google autocomplete, US: also "iphone notes packing list
// template", "apple notes check list"), in pattern E (lib/SideBySide.tsx). Words: Codex, GPT-6.1 Sol, checked and edited.
// Apple Notes: blog-growth/research/apple-notes-todo-packing-2026-11-23.md (macOS 27.0 VM, Edit, Paste as Markdown): the five
// group headings and all 20 items as checklists; Passport, A top for each day, Toothbrush and toothpaste and Phone charger
// ticked, each dropped to the bottom of its group (sorting on). Format, More holds Uncheck All; File holds Duplicate Note.
// Checklist on iPhone and Share, Collaborate: support.apple.com/102296. Locked notes and Apple Accounts for sharing:
// support.apple.com/102462, as the grocery post says.
// Pinto Notes: the trip plan template's Packing tab (content/templates/trip-plan.app, src/screens/packing.tsx) with the same
// 20 things in the same five groups (its GROUPS) and the same four packed, rendered with scripts/page-render
// (public/blog/side-by-side/packing-list-pinto-*). What's left stays on top of each group; Unpack all and Start a new trip
// unpack the list for the next trip (trip-plan.app/docs/README.md). The AI adds what a trip needs (trip-plan.json prompt).

const TEMPLATE = `# Packing list

## Documents
- [ ] Passport
- [ ] Tickets and bookings
- [ ] Travel insurance details
- [ ] Bank card and some cash

## Clothes
- [ ] A top for each day
- [ ] Trousers or shorts
- [ ] Underwear and socks
- [ ] Something warm
- [ ] Comfortable shoes
- [ ] Swimwear

## Toiletries
- [ ] Toothbrush and toothpaste
- [ ] Sunscreen
- [ ] Medicines
- [ ] Glasses or contacts

## Tech
- [ ] Phone charger
- [ ] Headphones
- [ ] Plug adapter

## Other
- [ ] Water bottle
- [ ] Snacks for the journey
- [ ] A book
`;

const FAQ = [
  { q: "Does Apple Notes have a packing list template?", a: [
    "No. Apple Notes has no templates feature, so a template is a note you keep. Paste this list into a new note, change the things for your trip and keep the note for next time.",
  ] },
  { q: "How do I make a checklist in Apple Notes?", a: [
    "On iPhone, type the items, select them and tap the checklist button. Each Return adds another item. On a Mac, paste lines that start with - [ ] using Edit, Paste as Markdown, and they become a checklist.",
  ] },
  { q: "How do I untick a whole packing list at once?", a: [
    "Keep the note, and before you pack again choose Format, More, Uncheck All on a Mac. To keep a blank copy as well, choose File, Duplicate Note first and tick the copy.",
  ] },
  { q: "Can I share the packing list with someone I travel with?", a: [
    "Yes. Tap the Share button, then Collaborate, so you can both tick things off. Everyone needs an Apple Account, and a locked note can't be shared to edit.",
  ] },
  { q: "Is there a packing list that's part of a trip plan?", a: [
    "Pinto Notes has a free trip plan template with the days, the bookings and a packing list in one place. Tell ChatGPT or Claude where you're going and it adds what the trip needs to the list.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-packing-list-template"
      cover={false}
      intro={<>A checklist with a heading for each kind of thing, to keep and use again on every trip.</>}
      answer={<>
        <Keep title="Packing list for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-packing-list-template" position="answer" title="Want a packing list that resets for every trip?">
          <p>In Pinto Notes&apos; free trip plan, start a new trip and the packing list comes back unticked, next to the days and bookings.</p>
        </PostCta>
        <SideBySide slug="apple-notes-packing-list-template"
          apple={{ src: "/blog/side-by-side/packing-list-template-apple-notes", width: 520, height: 1429, line: "Holds the list. You untick it yourself before the next trip.",
            alt: "The packing list template in Apple Notes on macOS 27: Documents, Clothes, Toiletries, Tech and Other as checklists, with one thing ticked in four of them." }}
          pinto={{ title: "The same packing list in Pinto Notes", line: "Part of a trip plan, next to the days and bookings. Start a new trip and the list comes back unpacked.",
            alt: "The same 20 things in the Pinto Notes trip plan's packing list, in the same five groups, with 4 of 20 packed and an Unpack all button.",
            phone: { src: "/blog/side-by-side/packing-list-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/packing-list-pinto-mac", width: 1526, height: 1280 },
            template: "trip-plan" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the things to suit your trip. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the things, select them and tap the checklist button.</li>
        <li>Turn on sorting, so each thing you tick drops to the bottom of its group. On iPhone it&apos;s Settings, Apps, Notes, Sort Checked Items. On a Mac, Notes asks the first time you tick something.</li>
        <li>Keep the note. Before the next trip, untick everything at once: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-trip-planner-template">a trip planner</a>, <a href="/blog/iphone-notes-travel-itinerary-template">a travel itinerary</a>, <a href="/blog/apple-notes-to-do-list-template">a to-do list</a>, <a href="/blog/apple-notes-checklist-template">a daily checklist</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
