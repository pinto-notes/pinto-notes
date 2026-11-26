import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-wishlist-template", { title: "Apple Notes wishlist template for Christmas and birthdays" });

// Written 25 November 2026 for "apple notes wishlist template" (Google autocomplete, US: also "apple notes wishlist",
// "iphone notes christmas list"), in pattern E (lib/SideBySide.tsx). Words: Codex, GPT-6.1 Sol, checked and edited. This
// address was a document template removed on 21 Nov (#735); it now serves this post, whose Pinto side is a real template.
// Apple Notes: blog-growth/research/apple-notes-checklist-wishlist-2026-11-25.md (macOS 27.0 VM, Edit, Paste as Markdown): the
// # line the title, a heading per person, every wish a checklist; Pressed flower kit and Wool socks ticked and sorted down.
// Share, Collaborate, Apple Accounts and locked notes: support.apple.com/102462, as the grocery post says. Edit, Attach File:
// the macOS 27 Edit menu.
// Pinto Notes: content/templates/gift-ideas.app rendered with scripts/page-render: the same three people with a Christmas
// budget each and the same seven ideas, two bought, seen on 25 November, on the Christmas 2026 page
// (public/blog/side-by-side/wishlist-pinto-*). Totals, "Still to buy for" and private-to-you: gift-ideas.app/docs/README.md.
// The two bought ideas are saved short there ("Flower kit", "Wool socks"; Dad's size is in his sizes): the Everyone list
// truncates its status line, and "Bought: Pressed flower kit" is cut even at 440 pt. Phone rendered at 440 pt, every line whole.

const TEMPLATE = `# Family wishlist, Christmas 2026

## Emma
- [ ] Pressed flower kit, $35
- [ ] Green hoodie, size 10, $30
- [ ] Book 4 of her dragon series, $12

## Dad
- [ ] Wool socks, size 10, $24
- [ ] Hand coffee grinder, $45

## Grandma
- [ ] Framed family photo, $40
- [ ] Lavender hand cream, $18
`;

const FAQ = [
  { q: "Is there a wishlist layout built into Apple Notes?", a: [
    "No. Apple Notes has no templates feature, so a wishlist template is a note you keep and copy. Use this one, with a heading per person and a price beside each wish.",
  ] },
  { q: "How do relatives add their own wishes to this note?", a: [
    "Tap the Share button, then Collaborate, so everyone can edit the same note. Everyone needs an Apple Account, and a locked note can't be shared to edit.",
  ] },
  { q: "Can each wish include a shop link or a photo?", a: [
    "Yes. Paste the web address after the wish to add a link. For a photo, use the Attachments button on iPhone, or Edit, Attach File on a Mac, or drag it into the note.",
  ] },
  { q: "Can I hide the bought checkmarks from the person getting the gift?", a: [
    "No. Everyone in a shared note sees every tick. Keep the shared note for wishes, and your own list of what's bought where the family can't see it.",
  ] },
  { q: "Where can I keep private gift ideas with a budget for each person?", a: [
    "Pinto Notes' free gift ideas template keeps each person's ideas and budget private to you, and shows what's bought and what's left to spend. Tell ChatGPT or Claude an idea and it saves it under that person.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-wishlist-template"
      cover={false}
      intro={<>A family wishlist with prices and sizes under each person&apos;s name. Share it, and everyone adds their own wishes.</>}
      answer={<>
        <Keep title="Family wishlist for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B41: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="apple-notes-wishlist-template" position="answer" title="Want to track gifts and spending where the family can't see?">
          <p>Pinto Notes&apos; free gift ideas keeps each person&apos;s ideas, sizes and budget private to you, and shows what&apos;s bought and what&apos;s left before Christmas.</p>
        </PostCta>
        <SideBySide slug="apple-notes-wishlist-template"
          apple={{ src: "/blog/side-by-side/wishlist-template-apple-notes", width: 747, height: 709, line: "Everyone adds wishes and sees every tick. Adding up what you've spent is up to you.",
            alt: "The family wishlist in Apple Notes on macOS 27: wishes with prices under Emma, Dad and Grandma as checklists, with Pressed flower kit and Wool socks, size 10 ticked at the bottom of their lists." }}
          pinto={{ title: "The same Christmas in Pinto Notes", line: "Private to you. Each person's budget and what's bought, added up, and who's still to buy for.",
            alt: "Christmas 2026 in the Pinto Notes gift ideas template, in 30 days: $59 of $210 spent, 2 of 3 bought, $151 left and still to buy for Grandma; Emma $35 of $80 with the flower kit bought, Dad $24 of $70 with the wool socks bought, Grandma $0 of $60.",
            phone: { src: "/blog/side-by-side/wishlist-pinto-phone", width: 880, height: 1400 },
            desk: { src: "/blog/side-by-side/wishlist-pinto-mac", width: 1536, height: 1280 },
            template: "gift-ideas" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the names and wishes to your family&apos;s. Keep each price beside its wish, and add a size where it matters.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, tap the Checklist button and type the wishes under each name.</li>
        <li>Share the note so the family can add their wishes. Everyone needs an Apple Account. Tap the Share button, then Collaborate.</li>
        <li>Keep track of what you buy somewhere the person can&apos;t see. A tick in a shared note shows to everyone, so ticking a wish tells them it&apos;s bought.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-checklist-template">a daily checklist</a>, <a href="/blog/apple-notes-budget-template">a budget</a>, <a href="/blog/iphone-notes-christmas-list">your own Christmas shopping list</a> and <a href="/blog/apple-notes-to-do-list-template">a to-do list</a>.</p>
    </PostPage>
  );
}
