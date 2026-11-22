import { PostPage, postMetadata } from "@/lib/PostPage";
import { MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";
import { APPLE_NOTES_TEMPLATES } from "@/lib/apple-notes-templates";
import { TemplatePicker } from "@/lib/TemplatePicker";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-templates", { title: "Apple Notes templates: make your own, plus five to copy" });

// Rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx): the five templates, then the Packing list in Apple Notes and in
// Pinto Notes, then the steps and the questions.
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0): all five pasted with Edit, Paste as Markdown,
// every heading, checklist and list item came through; nothing ticked, as templates stay blank. The capture shown is the
// Packing list, the note the post's own Templates-folder picture had open. Duplicate Note (Command-D): macOS 27 File menu.
// Pinto Notes: the Packing list belongs to the trip plan template (TemplatePicker sends it there). content/templates/trip-plan.app
// rendered with scripts/page-render with the same nine things in the same three groups, none packed
// (public/blog/side-by-side/packing-pinto-*). A new trip keeps the list and unpacks it (trip-plan.app/docs/README.md).

const FAQ = [
  { q: "Does Apple Notes have templates?", a: [
    "No. Notes on iPhone and Mac has no template feature, in iOS 27 and macOS 27 either. Keep each template as a note in its own folder, and duplicate or copy it when you need it.",
  ] },
  { q: "Can every new note start from a template?", a: [
    "No. A new note in Apple Notes always starts empty, and there's no setting for what goes in it.",
  ] },
  { q: "How do I duplicate a note in Apple Notes?", a: [
    "On a Mac, select the note and choose File, Duplicate Note, or press Command-D. The copy lands in the same folder. On iPhone, select everything in the note, copy it, and paste it into a new note.",
  ] },
  { q: "How do I make a checklist template?", a: [
    "Write the items as lines, select them and tap the checklist button, or on a Mac choose Format, Checklist. On macOS 27 you can instead paste lines that start with - [ ] using Edit, Paste as Markdown, and they become a checklist.",
  ] },
  { q: "Where can I download Apple Notes templates?", a: [
    "There's nothing to download or install: a template is just a note. Copy one of the five on this page and paste it into a new note.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-templates"
      cover={false}
      intro={<>Apple Notes has no templates button, but a folder of notes does the job. Here are five to copy.</>}
      answer={<>
        <TemplatePicker templates={APPLE_NOTES_TEMPLATES} legend="Pick a template" post="apple-notes-templates" start={2} />
        <SideBySide slug="apple-notes-templates"
          apple={{ src: "/blog/side-by-side/templates-apple-notes", width: 477, height: 797, line: "A blank copy for each trip. You untick it yourself.",
            alt: "The Packing list template in Apple Notes on macOS 27: Documents, Clothes and Bag headings, each over a checklist of three things." }}
          pinto={{ title: "The same packing list in Pinto Notes", line: "Part of a trip plan, next to the days and bookings. The list stays for your next trip.",
            alt: "The same nine things in the Pinto Notes trip plan's packing list, grouped under Documents, Clothes and Bag, with 0 of 9 packed.",
            phone: { src: "/blog/side-by-side/packing-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/packing-pinto-mac", width: 1526, height: 1280 },
            href: "/templates/trip-plan", button: "Get the trip plan template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use them</h2>
      <Steps>
        <li>In Notes, make a folder called Templates, with one note per template.</li>
        <li>On a Mac, start a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> Headings and checklists come through. On iPhone with iOS 27, Apple says Markdown formats itself when you paste it.</li>
        <li>Leave the templates blank and fill in the copies.</li>
        <li>To use one on a Mac, select it and press Command-D: <MenuPath steps={["File", "Duplicate Note"]} /> On iPhone, copy everything in the template and paste it into a new note.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-habit-tracker">a habit tracker</a>, <a href="/blog/apple-notes-trip-planner-template">a trip planner</a>, <a href="/blog/apple-notes-meal-planner-template">a meal planner</a> and <a href="/blog/apple-notes-budget-template">a budget that adds itself up</a>.</p>
    </PostPage>
  );
}
