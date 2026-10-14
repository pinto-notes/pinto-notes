import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, FigurePair, Keep, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("plan-a-trip-with-chatgpt-or-claude", { title: "Plan a trip with ChatGPT or Claude, and keep the itinerary" });

// Checked on 13 October 2026 against the Trip plan template on main (Mac 1.2.26): content/templates/trip-plan.json
// (prompt, asks) and trip-plan.app (README.md, docs/README.md: Trip, Days, Bookings and Packing tabs; Edit for the
// trip and dates; add, edit, delete days, bookings and packing items with Undo; paid and packed ticks; "Day 2 of 5"
// during the trip; each day as a timeline with its bookings; Share a day or the trip as text; grouped packing that
// stays for the next trip; no item reordering within a day, no costs, map or weather; no network unless allowed).
// Re-checked on growth/apps-bar for the upgraded app. The
// iPhone app isn't on the App Store yet. What ChatGPT and Claude do in a chat is described as what you can check.

const PROMPT = `Plan a 4-day trip to Lisbon for two, 22 to 25 October. We like food, views and walking. Not museums. We're staying in Príncipe Real and don't want a car.

For each day give me a short title and three to five things, in the order we'd do them, with the rough travel time between places. Keep one evening free. Put anything that needs booking ahead in a separate list with why it needs booking.

Then a packing list for late October, for two, no checked bags.

Be specific about places, but say so if you're not sure something is open on that day.`;

const FAQ = [
  { q: "Can ChatGPT plan a trip itinerary?", a: [
    "Yes, and it's good at a first draft: a day-by-day plan in your style, with travel times between places. Check opening days and prices on the places' own sites before you book anything, because the plan can be out of date or wrong.",
  ] },
  { q: "Is Claude or ChatGPT better for trip planning?", a: [
    "Both write a good first itinerary. Use whichever you already pay for. The bigger difference is where the plan ends up: in a chat you scroll back to, or somewhere you can edit and tick off.",
  ] },
  { q: "Is there a free trip planner template ChatGPT can fill in?", a: [
    "The Trip plan template for Pinto Notes is free and comes with its own app: a countdown, a day-by-day plan, bookings with paid ticks and a packing list. Once Pinto Notes is connected, ChatGPT or Claude fills it in, and you can change all of it yourself.",
  ] },
  { q: "Can the trip planner show a map or the weather?", a: [
    "The Pinto Notes one can't. It has no map, no weather and no costs per booking, and the app has no network access unless you allow a site.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="plan-a-trip-with-chatgpt-or-claude"
      intro={<>ChatGPT and Claude will write you a Lisbon itinerary in ten seconds. Two weeks later you&apos;re scrolling up through a long chat looking for the restaurant on day three, with the hotel confirmation in your email and the packing list on the back of an envelope.</>}
      caption="The trip plan template's app in Pinto Notes on a Mac: the countdown, what's still open, and the next day as a timeline."
      answer={
        <Answer jump={[
          { href: "#prompt", label: "The prompt" },
          { href: "#check", label: "What to check" },
          { href: "#keep", label: "Keep the plan" },
          { href: "#yourself", label: "Edit it yourself" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            Tell ChatGPT or Claude where, when, who&apos;s going and what you like, and ask for three to five things a day with travel
            times. Check opening days before you book. Then move the plan somewhere you can edit it and tick things off. The free Trip
            plan template for Pinto Notes is a trip planner app your AI can fill in: day-by-day plan, bookings with paid ticks, and a
            packing list.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/pinto/trip-plan-main-mac-light" width={1280} height={900} maxWidth={640}
        alt="The Trip plan app in a Pinto Notes note on a Mac: Lisbon, 9 days to go, bookings and packing still open, and the first day as a timeline."
        caption="The trip plan template in Pinto Notes: the countdown, what's still open, and the first day. Example data." />}
      faq={FAQ}
    >
      <h2 id="prompt">The prompt</h2>
      <p>
        Most of a good itinerary comes from what you tell the AI you don&apos;t want. &ldquo;Not museums&rdquo; and &ldquo;no car&rdquo;
        remove more bad suggestions than any list of interests adds. Ask for three to five things a day. A plan with eight stops a day
        looks generous in the chat and is exhausting by day two.
      </p>
      <Keep title="A trip itinerary prompt" text={PROMPT}
        note="The last line matters most. Without it, every place in the plan sounds equally certain." />
      <p>
        ChatGPT and Claude both answer this well. If you use ChatGPT&apos;s or Claude&apos;s web search, they can also check
        opening hours, though I&apos;d still open the place&apos;s own page for anything you&apos;re paying for. Follow up in the
        same chat: &ldquo;swap day 2 and day 3, it&apos;s supposed to rain on the 23rd&rdquo;, or &ldquo;add a day trip to Sintra and
        drop one evening walk.&rdquo;
      </p>

      <h2 id="check">What to check before you trust it</h2>
      <p>
        Go through the draft for three things before you book around it. Is each place open on the day the plan sends you there?
        Museums and restaurants often close on a Monday. Are the travel times realistic for you, on hills and with luggage? And does
        each restaurant still exist at that address? The AI&apos;s knowledge has a date, and a small place can close long before
        that date catches up. None of this makes the draft useless. The draft is where your planning starts, and the hour you spend
        checking it is the part the AI can&apos;t do for you.
      </p>

      <h2 id="missing">What&apos;s missing</h2>
      <p>
        The plan is good now, and it&apos;s stuck in a chat. The bookings are in your email, the packing list is in your head, and the
        friend coming with you can&apos;t see any of it. Trip apps help, but they&apos;re another place to retype it all: TripIt reads
        forwarded emails and Wanderlog has its own assistant, and neither is the ChatGPT or Claude you planned with.
      </p>
      <p>
        What you want is the plan in one place you can tick off on the trip, that the AI you planned with can keep adding to.
      </p>

      <h2 id="keep">Keep the plan where you can edit it</h2>
      <p>
        Once the plan is roughly right, it needs a home where you can change it without asking the AI, tick off what&apos;s paid and
        packed, and still let the AI add to it. I make Pinto Notes, a notes app for Mac and iPhone that ChatGPT, Claude and Claude Code can
        read and edit once you allow them. A note in it can hold a small app, and the <a href="/templates/trip-plan">Trip plan
        template</a> is a note with a trip planner app already built, with a sample Lisbon trip to replace.
      </p>
      <Steps>
        <li>
          <strong>Choose Plan the trip on the template page</strong>
          On a Mac with Pinto Notes, it opens the app and adds a &ldquo;Trip plan&rdquo; note, with its app, to the folder you pick.
        </li>
        <li>
          <strong>Connect ChatGPT or Claude once</strong>
          With Read and Edit. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> needs Developer mode on a paid plan.
        </li>
        <li>
          <strong>Tell your AI about the trip</strong>
          &ldquo;Lisbon, 4 days in May. I like food, views and walking. Not museums.&rdquo; It finds the note, reads the app&apos;s
          own notes on how the trip is kept, then sets the dates, fills in the days and adds what you&apos;ll need to the packing
          list.
        </li>
      </Steps>
      <p>
        From then on, paste booking confirmations into the chat as they arrive: &ldquo;Here&apos;s the hotel confirmation.&rdquo; The
        AI adds a booking with what it is, when, and its reference, marked not paid. Ask &ldquo;What do I still need to book?&rdquo;
        and it reads the same list you see. If you already have a plan in a chat, paste it in and ask the AI to put it into the trip
        plan; that&apos;s quicker than retyping it.
      </p>
      <p>
        To change the app itself, ask for that too: &ldquo;Add a day for Sintra&rdquo; or &ldquo;Show a cost for each
        booking.&rdquo; Your AI edits the app, and the new version shows up in the note.
      </p>

      <h2 id="yourself">What you can still do yourself</h2>
      <FigurePair items={[
        { src: "/blog/pinto/trip-plan-days-mac-light", width: 1280, height: 900,
          alt: "The Days tab of the trip plan app on a Mac: each day as a timeline, with timed plans and bookings in order and a Share button per day." },
        { src: "/blog/pinto/trip-plan-packing-phone-light", width: 780, height: 1688,
          alt: "The Packing tab on a phone: a grouped packing list with documents, clothes and toiletries, ticked items lower down." },
      ]} caption="Each day as a timeline you can share, and a packing list that stays for the next trip." />
      <p>
        Everything is yours to change in the app. Days puts each day&apos;s plan and bookings in time order, so the 06:55 flight sits above
        lunch, and Share sends a day as text to the friend who asks &ldquo;so what are we doing Thursday?&rdquo;. Tick bookings once
        they&apos;re paid and items once they&apos;re packed; add, edit or delete anything, with Undo. During the trip the countdown turns
        into &ldquo;Day 2 of 5&rdquo;, and you can still ask ChatGPT or Claude on your phone &ldquo;what&apos;s on today?&rdquo;. If
        you&apos;d rather keep a plain checklist, <a href="/blog/apple-notes-templates">Apple Notes templates</a> has a packing list to copy.
      </p>

      <h2 id="limits">What it doesn&apos;t do yet</h2>
      <p>
        A day&apos;s plan is edited as text, one line per item, and you can&apos;t drag items around within a day. There&apos;s no map,
        no weather and no cost per booking, and the app can&apos;t look anything up online unless you allow a site. Booking still
        happens on the airline&apos;s or hotel&apos;s own site: the AI records a booking, it doesn&apos;t make one.
      </p>
      <p>
        The iPhone app isn&apos;t on the App Store yet, so for now the trip plan opens on a Mac with macOS 26 or later. When you&apos;re
        home, Start a new trip in the Edit sheet clears the plan and bookings and keeps the
        packing list, unpacked, so the next trip starts from what you took last time.
      </p>
    </PostPage>
  );
}
