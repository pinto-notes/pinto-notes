import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, MenuPaths, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("iphone-notes-christmas-list", { title: "iPhone Notes Christmas list template, with budgets" });

// Written 26 November 2026 for "iphone notes christmas list" (Google autocomplete, US: also "notes app christmas list",
// "christmas list notes app template", and "apple notes christmas list" completes to it), in pattern E (lib/SideBySide.tsx),
// experiment B43. Page 1 is gift list apps on the App Store and gift trackers, so this is the buyer's own list: who to buy for,
// a budget each, ideas with prices. The family wishlist everyone shares is apple-notes-wishlist-template. Words: Codex, GPT-6.1
// Sol, checked and edited. Research: blog-growth/research/apple-notes-75hard-christmas-2026-11-26.md.
// Apple Notes: macOS 27.0 VM, Edit, Paste as Markdown: the # line the title, a heading per person, every idea a checklist;
// Silk scarf and Wool socks ticked and sorted down. File, Lock Note: the VM's File menu. Lock on iPhone (More, Lock; the iPhone
// passcode or a Notes password; only iCloud or on-device notes; not with tags or a PDF; a shared note can't be locked):
// support.apple.com/102537 and the Notes User Guide for Mac, "Lock your notes". Math Results: as on apple-notes-budget-template.
// Pinto Notes: content/templates/gift-ideas.app rendered with scripts/page-render with the same four people, budgets and seven
// ideas, two bought, on 26 November, on the Christmas 2026 page (public/blog/side-by-side/christmas-list-pinto-*). Totals and
// "Still to buy for": gift-ideas.app/docs/README.md. Phone rendered at 440 pt, so every status line is whole.

const TEMPLATE = `# Christmas list 2026

## Mum, $60
- [ ] Silk scarf, $45
- [ ] Hand cream, $15

## Dad, $50
- [ ] Coffee grinder, $45
- [ ] Wool socks, $20

## Leo, $40
- [ ] Lego set, $35
- [ ] Football socks, $12

## Nora, $30
- [ ] Sketchbook and pens, $25
`;

const FAQ = [
  { q: "How do I set up a Christmas shopping list on my iPhone?", a: [
    "In Notes, type a heading for each person with their budget. Tap the Checklist button and type their gift ideas with prices, one per line. Tick a gift when you buy it.",
  ] },
  { q: "How do I hide the list from family who use my iPhone or Mac?", a: [
    "Lock the note. On iPhone, open it, tap the More button, then Lock. On a Mac, choose File, Lock Note. Only notes in iCloud or on your device can be locked, and not shared notes or notes with tags.",
  ] },
  { q: "Can I add a gift's link or photo next to its price?", a: [
    "Yes. Paste the web address beside the gift to add a link. For a photo, use the Attachments button on iPhone, or Edit, Attach File on a Mac.",
  ] },
  { q: "Will ticking a gift add it to what I've spent?", a: [
    "No. Math Results answers a sum you type ending in an equals sign, such as 45 + 20 =, but Notes doesn't total the gifts you've ticked. On a Mac, Format, Math Results must be on.",
  ] },
  { q: "Is there a Christmas list that adds up each person's budget for me?", a: [
    "Pinto Notes' free gift ideas template adds up what you've bought against each budget and lists who's still to buy for. Tell ChatGPT or Claude \"Mum would love a silk scarf, $45\" and it saves the idea under Mum.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="iphone-notes-christmas-list"
      cover={false}
      intro={<>Your Christmas shopping list in one note: a budget for each person and a price beside each idea. Tick a gift when you buy it.</>}
      answer={<>
        <Keep title="Christmas list for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B43: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="iphone-notes-christmas-list" position="answer" title="Want to see what you've spent and who's left, without doing the sums?">
          <p>Pinto Notes&apos; free gift ideas adds up each person&apos;s budget against what you&apos;ve bought, and lists who&apos;s still to buy for.</p>
        </PostCta>
        <SideBySide slug="iphone-notes-christmas-list"
          apple={{ src: "/blog/side-by-side/christmas-list-template-apple-notes", width: 660, height: 783, line: "A tick means bought. Adding up each budget and who's left is up to you.",
            alt: "The Christmas list in Apple Notes on macOS 27: budgets and gift ideas under Mum, Dad, Leo and Nora as checklists, with Silk scarf and Wool socks ticked at the bottom of their lists." }}
          pinto={{ title: "The same Christmas list in Pinto Notes", line: "Each budget adds up as you buy, with who's still to buy for.",
            alt: "Christmas 2026 in the Pinto Notes gift ideas template, in 29 days: $65 of $180 spent, 2 of 4 bought, $115 left and still to buy for Leo and Nora; Mum $45 of $60 with the silk scarf bought, Dad $20 of $50 with the wool socks bought, Leo $0 of $40 with 2 ideas, Nora $0 of $30 with 1 idea.",
            phone: { src: "/blog/side-by-side/christmas-list-pinto-phone", width: 880, height: 1560 },
            desk: { src: "/blog/side-by-side/christmas-list-pinto-mac", width: 1536, height: 1400 },
            template: "gift-ideas" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the names, budgets and ideas to yours. Keep each price beside its idea.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type a heading for each person, then tap the Checklist button and type their ideas.</li>
        <li>Lock the note, so nobody who picks up your iPhone or Mac sees the gifts. You can use your iPhone passcode or a password just for Notes.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["More", "Lock"] },
            { on: "Mac", steps: ["File", "Lock Note"] },
          ]} /></li>
        <li>Tick each gift when you buy it. With sorting on, bought gifts drop to the bottom of each person&apos;s list. On iPhone it&apos;s Settings, Apps, Notes, Sort Checked Items. On a Mac, Notes asks the first time you tick something.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-wishlist-template">a family wishlist</a>, <a href="/blog/apple-notes-budget-template">a budget</a> and <a href="/blog/apple-notes-checklist-template">a daily checklist</a>.</p>
    </PostPage>
  );
}
