import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Facts, FolderTree, More, PostFigure, Sorter, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("evernote-price-increase", {
  title: "Evernote price increase: what to do at renewal",
});

// Written 21 November 2026 for "evernote price increase 2026", "evernote renewal cost",
// "what happens if i cancel my evernote subscription", "evernote starter plan",
// "why is evernote so expensive now" and "is evernote worth it", supplied in BRIEF-evernote-price.md.
// Evernote facts below were read on its own pages on 21 November 2026 by the brief's researcher:
// https://help.evernote.com/hc/en-us/articles/46317642175763
// New plans, gradual rollout, notice before renewal, USD prices, limits, shared tools,
// coming-soon tools, unchanged notes/tags/structure, refund route and Evernote's stated reason.
// https://evernote.com/blog/evernote-pricing-upcoming-features-update
// Personal's 2023 USD price, $129.99 yearly or $14.99 monthly; Advanced is $120 more yearly.
// https://help.evernote.com/hc/en-us/articles/46706074208531
// Starter switch at renewal, with separate routes for Advanced, legacy plans, Apple and Google.
// https://help.evernote.com/hc/en-us/articles/48232083096211
// Over Starter limits: existing notes remain viewable/editable/exportable/deletable;
// creation/attachment restrictions and disconnecting extra devices.
// https://help.evernote.com/hc/en-us/articles/115005949208
// https://help.evernote.com/hc/en-us/articles/33872737333907
// Cancellation steps, active until billing-cycle end, then Free; notes retained and exportable.
// https://help.evernote.com/hc/en-us/articles/209005557
// Desktop-only ENEX export, attributes, 100 selected notes or whole notebooks, Free can export.
// https://evernote.com/compare-plans supplies Free's 50 notes, 1 notebook and 1 device.
// Destination facts reused only from evernote-alternative/page.tsx, whose official sources were
// read 21 November 2026. These are documented import routes, not fresh migration tests:
// https://support.apple.com/en-us/102223 and
// https://support.apple.com/guide/notes/not201900c07/mac (Mac ENEX import; unsupported content omitted).
// https://obsidian.md/ and https://obsidian.md/help/import/evernote (local Markdown; ENEX Importer).
// https://bear.app/ and https://bear.app/faq/migrate-from-evernote/ (Markdown/tags; ENEX import).
// https://joplinapp.org/help/ and https://joplinapp.org/help/apps/import_export/
// (free/open source notebooks; ENEX import creates a notebook per file).
// https://www.notion.com/product and https://www.notion.com/help/import-data-into-notion
// (team workspace; account import on desktop/web, notebooks to pages, notes to database items;
// no ENEX upload documented).
// Pinto sources: BRIEF-evernote-price.md, "Pinto facts for this post", checked in shipped 1.4 code:
// bullet 1: free, Mac/iPhone only; no Windows, Android or web app; import on Mac.
// bullet 2: File, Import from Evernote; one/many ENEX files; notebook to folder; checklists,
// tables, attachments, tags and created/edited dates; encrypted-section placeholder.
// bullet 3 and BRIEF.md, "Pinto facts you may use", bullet 2: ChatGPT/Claude read and edit
// once connected and allowed. No connection-time or migration-test claim is made here.
// Picture: /blog/launch/import-file-menu, same dimensions, alt and caption as evernote-alternative.
// Models: mem-ai-alternative-for-mac-and-iphone and evernote-alternative, plus the parent briefs' models.

const FAQ = [
  { q: "What happens to my notes if I cancel my Evernote subscription?", a: [
    "Your paid plan stays active until the billing cycle ends, then your account becomes Free. No notes are lost. You can still view, edit, export and delete them. Free allows one device at a time, and you cannot create new notes if you have more than 50 notes or more than one notebook.",
  ] },
  { q: "Is Evernote Starter enough for my existing notebooks?", a: [
    "Starter fits up to 1,000 notes, 20 notebooks, 1,000 attachments, 100 tags, 5 GB of storage and three synced devices. If you are over its limits, you keep existing notes and can view, edit, export and delete them. New notes and attachments are restricted, and extra devices must be disconnected.",
  ] },
  { q: "Can I keep my old Evernote Personal renewal price?", a: [
    "No. Evernote says Plus, Premium, Personal and Professional are no longer available. You cannot return to them or get a custom discount. You can keep Advanced, switch to Starter if it fits, or cancel before the new price takes effect.",
  ] },
  { q: "Why is Evernote so expensive now?", a: [
    "Evernote says it has modernized and streamlined the service for long-term reliability, performance and innovation. Starter and Advanced replace Personal and Professional. Advanced is US$249.99 a year, $120 more than Personal's $129.99 yearly price after the 2023 change. Starter is $99.00 a year if its limits fit your use.",
  ] },
  { q: "Do I need to pay Evernote to export after cancelling?", a: [
    "No. Free accounts can export. Use Evernote's desktop app on Mac or Windows, select notes or a whole notebook, then right-click and choose Export. Choose ENEX and tick the attributes you want to keep. Export is not available on Evernote Web.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="evernote-price-increase"
      intro={<>The renewal email gives you a date to decide whether to keep paying. Check the new plan against your library before that date.</>}
      answer={
        <Answer jump={[
          { href: "#changed", label: "Prices and limits" },
          { href: "#choose", label: "Choose a plan" },
          { href: "#starter", label: "Switch to Starter" },
          { href: "#cancel", label: "Cancel" },
          { href: "#refund", label: "Already charged" },
          { href: "#export", label: "Export" },
          { href: "#destinations", label: "Where to move" },
        ]}>
          <p>
            Evernote has replaced Personal and Professional with Starter and Advanced, and moves you at your next renewal.
            Unless you act, you renew on Advanced: US$249.99 a year, up from $129.99 for Personal.
          </p>
          <p>
            If your library fits Starter&apos;s limits, switch before renewal for $99.00 a year or $14.99 a month.
            Otherwise, keep Advanced at $249.99 a year or cancel. Cancelling keeps every note readable and exportable,
            so you can move after the renewal date.
          </p>
          <PostCta slug="evernote-price-increase" position="answer" title="Bring an Evernote export to Pinto Notes">
            <p>Pinto Notes is free for Mac and iPhone, with Evernote import on the Mac.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <Facts items={[
        { label: "Free", value: "$0, up to 50 notes and 1 device" },
        { label: "Starter", value: "$99 a year, up to 1,000 notes and 3 devices" },
        { label: "Advanced", value: "$249.99 a year, no note or device limit" },
      ]} />

      <h2 id="changed">What changed and when</h2>
      <p>
        Personal was $129.99 a year or $14.99 a month after the 2023 change. Advanced is $120 more a year.
        Evernote is migrating accounts gradually, with advance notice and no price change before your next scheduled billing date.
        Your notes, tags and structure stay as they are. These are USD prices checked on 21 November 2026;
        Apple and Google subscriptions may be priced differently. See{" "}
        <a href="https://help.evernote.com/hc/en-us/articles/46317642175763">Evernote&apos;s plan-change FAQ</a>.
      </p>
      <More summary="Compare the full Starter and Advanced limits">
        <div className="tableWrap">
          <table>
            <thead><tr><th scope="col">Limit or tool</th><th scope="col">Starter</th><th scope="col">Advanced</th></tr></thead>
            <tbody>
              <tr><th scope="row">Notes</th><td>1,000</td><td>Unlimited, with safeguard limits</td></tr>
              <tr><th scope="row">Notebooks</th><td>20</td><td>Unlimited, with safeguard limits</td></tr>
              <tr><th scope="row">Attachments</th><td>1,000</td><td>Unlimited, with safeguard limits</td></tr>
              <tr><th scope="row">Tags</th><td>100</td><td>100,000</td></tr>
              <tr><th scope="row">Storage</th><td>5 GB</td><td>Unlimited, with safeguard limits</td></tr>
              <tr><th scope="row">Synced devices</th><td>3</td><td>Unlimited, with safeguard limits</td></tr>
              <tr><th scope="row">Transcription, web clipping, mobile capture, AI Edit and Transcribe</th><td>Included</td><td>Included</td></tr>
              <tr><th scope="row">Semantic Search and AI Assistant</th><td>Coming soon</td><td>Coming soon</td></tr>
            </tbody>
          </table>
        </div>
        <p>Limits and tool status from <a href="https://help.evernote.com/hc/en-us/articles/46317642175763">Evernote&apos;s FAQ</a>, checked on 21 November 2026.</p>
      </More>

      <h2 id="choose">Which plan fits you?</h2>
      <p>
        Staying is a reasonable choice if Evernote&apos;s tools and the new price work for you. Check attachments, tags and storage
        as well as note count. If you switch to Starter above its limits, existing notes remain editable and exportable,
        but you cannot create notes above 1,000 notes or 20 notebooks, or add attachments above 1,000.
        Extra devices must be disconnected.
      </p>
      <Sorter groups={[
        { tone: "leaf", title: "Starter is enough", items: [{ name: "Switch before renewal", href: "#starter" }],
          line: "Up to 1,000 notes, 20 notebooks and 3 devices, within the attachment, tag and storage limits too." },
        { tone: "sky", title: "You need Advanced", items: [{ name: "Keep your plan" }],
          line: "You need to keep adding beyond Starter's limits. If Advanced's price works for you, no action is needed." },
        { tone: "amber", title: "Leave Evernote", items: [{ name: "Cancel", href: "#cancel" }, { name: "Export and move", href: "#export" }],
          line: "Cancel before the new price takes effect. Your existing notes remain available while you choose a destination." },
      ]} />

      <h2 id="starter">Switch to Starter before you renew</h2>
      <p>The change takes effect at your next renewal. Follow <a href="https://help.evernote.com/hc/en-us/articles/46706074208531">the route for how you pay</a>.</p>
      <Steps>
        <li>Card or PayPal, already on Advanced: open Account Settings, Manage plan, then Switch to Starter.</li>
        <li>Still on Personal or Professional: cancel, then subscribe to Starter once the current subscription expires.</li>
        <li>Apple subscription: change the plan in the App Store on Mac or your Apple account on iPhone.</li>
        <li>Google Play: cancel, then subscribe to Starter after the subscription expires.</li>
      </Steps>

      <h2 id="cancel">Cancel without losing notes</h2>
      <Steps>
        <li>For card, PayPal or SEPA payments, open Account Settings on Evernote Web. If more than one device is connected, disconnect all but one first.</li>
        <li>Open Billing, then Manage next to Your plan.</li>
        <li>Choose Cancel plan at the bottom, then &ldquo;Cancel and lose all benefits&rdquo;.</li>
      </Steps>
      <p>
        Your plan runs to the end of the billing cycle, then becomes Free. No notes are lost: on Free you can still view,
        edit and export them, on one device at a time. You can&apos;t add notes while you have more than 50 notes or more than one notebook. So you can cancel now and export later.{" "}
        <a href="https://help.evernote.com/hc/en-us/articles/115005949208">Evernote&apos;s cancellation guide</a> covers the payment routes,
        and its <a href="https://help.evernote.com/hc/en-us/articles/33872737333907">after-cancellation guide</a> explains Free access.
      </p>

      <h2 id="refund">Already charged for Advanced</h2>
      <p>
        Log in to the account that was charged and open the Contact Form linked from{" "}
        <a href="https://help.evernote.com/hc/en-us/articles/46317642175763">Evernote&apos;s plan-change FAQ</a>.
        Choose Accounts and Subscriptions, then &ldquo;I&apos;d like to request a refund&rdquo;. Evernote&apos;s refund policy terms apply.
      </p>

      <h2 id="export">Export your notebooks</h2>
      <p>
        Export works in Evernote&apos;s desktop app for Mac or Windows, including on Free. It does not work on the web.
        You can export up to 100 selected notes at a time or an entire notebook, according to{" "}
        <a href="https://help.evernote.com/hc/en-us/articles/209005557">Evernote&apos;s export guide</a>.
      </p>
      <Steps>
        <li>Select a notebook or the notes you want in the desktop app.</li>
        <li>Right-click, choose Export, then select ENEX.</li>
        <li>Tick the attributes you want to keep, such as tags and created date, then Export.</li>
        <li>Repeat for each notebook, keeping a separate .enex file for each.</li>
      </Steps>
      <FolderTree root="Evernote exports" items={[
        { name: "Recipes.enex", note: "Recipes notebook", file: true },
        { name: "Travel.enex", note: "Travel notebook", file: true },
        { name: "Work.enex", note: "Work notebook", file: true },
      ]} caption="Example notebook names. Each notebook becomes a folder when imported into Pinto Notes. Joplin creates a notebook per ENEX file." />

      <h2 id="destinations">Where to move</h2>
      <p>
        Choose by how you want to use the notes. The <a href="/blog/evernote-alternative">full Evernote alternatives comparison</a>{" "}
        covers these destinations. For Apple&apos;s route, follow <a href="/blog/evernote-to-apple-notes">Evernote to Apple Notes</a>;
        unsupported attachments and features may be omitted during import.
      </p>
      <Sorter groups={[
        { tone: "leaf", title: "Personal notes on Apple devices",
          items: [{ name: "Apple Notes", href: "/blog/evernote-to-apple-notes" }, { name: "Pinto Notes", href: "#pinto-notes" }],
          line: "Both accept ENEX on a Mac. Pinto Notes adds connected ChatGPT or Claude access." },
        { tone: "sky", title: "Markdown files or writing with tags",
          items: [{ name: "Obsidian", href: "https://obsidian.md/help/import/evernote" }, { name: "Bear", href: "https://bear.app/faq/migrate-from-evernote/" }],
          line: "Obsidian keeps local Markdown and imports ENEX through Importer. Bear has Markdown, tags and ENEX import." },
        { tone: "amber", title: "Open source notebooks",
          items: [{ name: "Joplin", href: "https://joplinapp.org/help/apps/import_export/" }],
          line: "Free and open source. Its desktop ENEX import creates a notebook per file." },
        { tone: "rose", title: "A team workspace",
          items: [{ name: "Notion", href: "https://www.notion.com/help/import-data-into-notion" }],
          line: "Connect your Evernote account on desktop or web. Notebooks become pages and notes become database items. No ENEX upload is documented." },
      ]} />
      <p id="pinto-notes">
        Pinto Notes is free for Mac and iPhone, with no Windows, Android or web app. On the Mac, choose File, Import from Evernote
        and drop in one or many .enex files. Each notebook becomes a folder. Checklists, tables, attachments, tags and created
        and edited dates come across. Encrypted sections leave a line telling you to open that part in Evernote.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect and allow ChatGPT or Claude</a>, it can read and edit the notes.
      </p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
        alt="The File menu in Pinto Notes on a Mac, with Import from Evernote and other import options."
        caption="Pinto Notes has an Evernote import in the File menu on a Mac. Screenshot: Pinto Notes." />
    </PostPage>
  );
}
