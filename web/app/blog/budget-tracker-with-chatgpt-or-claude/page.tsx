import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("budget-tracker-with-chatgpt-or-claude", { title: "How to make a budget tracker with ChatGPT or Claude" });

// Checked on 13 October 2026 against the Budget and expenses template on main (Mac 1.2.26):
// content/templates/budget-log.json (prompt, asks) and budget-log.app (README.md, docs/README.md: Month,
// Expenses and Budget screens; add, edit, delete expenses with Undo; add, rename, remove categories; budget
// per category; currency; monthly bills added on their day; roll-over; a six-month chart; no income,
// per-month budgets or export; no bank connection). Re-checked on growth/apps-bar for the upgraded app.
// The sums are computed by the app (src/lib/budget.ts), not by the AI. The iPhone app isn't on the App Store
// yet. What ChatGPT and Claude build in a chat is described as what you can check yourself.

const PROMPT = `Build me a simple monthly budget tracker as a small interactive app.

Currency: kr. Categories and monthly budgets:
- Groceries 4,000
- Eating out 1,500
- Transport 800
- Home 1,000
- Fun 1,000

First screen: what's left this month as one big number, a bar, and each category against its budget. One Add expense button that asks for the amount first, then what it was and the category.

Let me edit or delete an expense, and change the categories and budgets myself. No charts beyond the bars, no income, no login.`;

const FAQ = [
  { q: "Can ChatGPT make a budget tracker?", a: [
    "Yes: a spreadsheet you download, or a small app in a canvas. Give it your categories and monthly amounts. Check its sums once by hand, and check that what you enter is still there after you close the chat.",
  ] },
  { q: "Can Claude build a budget app?", a: [
    "Yes. Claude builds it as an artifact you can use in the chat. Whether your expenses are saved between visits depends on what it built, so add one, come back the next day, and look.",
  ] },
  { q: "Should I give ChatGPT my bank statements?", a: [
    "That's your call, and it depends on your plan's data settings. You don't need to for a budget: telling it \"412 on groceries\" is enough to log an expense, and nothing about your bank is involved.",
  ] },
  { q: "Is there a free budget template ChatGPT can fill in?", a: [
    "The Budget and expenses template for Pinto Notes is free and comes with its own app. Once Pinto Notes is connected, ChatGPT or Claude adds expenses to it, and the app does the sums.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="budget-tracker-with-chatgpt-or-claude"
      intro={<>A budget only works if logging an expense takes less effort than skipping it. Saying &ldquo;412 on groceries&rdquo; to your AI is about as little effort as it gets, as long as the number lands somewhere that adds up correctly.</>}
      caption="The budget template's app in Pinto Notes on a Mac. The app does the sums; you or your AI add the expenses."
      answer={
        <Answer jump={[
          { href: "#in-chat", label: "Build one in the chat" },
          { href: "#sums", label: "Who does the sums" },
          { href: "#template", label: "Start from the template" },
          { href: "#yourself", label: "Edit it yourself" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            Paste a prompt with your categories and monthly amounts into ChatGPT or Claude and it builds a small budget tracker, or
            a spreadsheet. That&apos;s fine for trying a layout. For a budget you keep all year, use one where you can add and fix
            expenses by hand, your AI can add them when you tell it, and the totals come from the app, not from the AI&apos;s
            arithmetic. The free Budget and expenses template for Pinto Notes works that way.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="in-chat">Route 1: ask ChatGPT or Claude to build one</h2>
      <p>
        Start with the categories you already think in and a monthly amount for each. Five or six categories is plenty; with
        fifteen you spend the month deciding whether coffee is Eating out or Fun.
      </p>
      <Keep title="A budget tracker prompt" text={PROMPT}
        note="Change the currency, categories and amounts to yours. The amount-first Add button is what makes logging quick." />
      <p>
        Claude shows the result as an artifact you can click through. ChatGPT gives you code in a canvas, or a spreadsheet if you
        ask for one, with formulas you can check. Before you trust either, add three expenses, then close the chat and come back.
        If they&apos;re gone, the tracker keeps nothing between visits. A spreadsheet keeps everything, but it lives in your
        Downloads folder, and the AI only sees it when you upload it again.
      </p>

      <h2 id="sums">Let the app do the sums</h2>
      <p>
        A language model is good at turning &ldquo;85 on the bus card and a 412 grocery shop&rdquo; into two tidy rows. It&apos;s less
        reliable at adding forty numbers in its head, and a budget is mostly adding. So whatever you build, I&apos;d keep one rule:
        the AI writes rows, and code adds them up. In a spreadsheet that means formulas. In an app it means the totals are computed
        from the expenses every time the screen opens, so a wrong total can only come from a wrong expense, and you can find that
        one and fix it.
      </p>

      <h2 id="template">Route 2: start from the budget template</h2>
      <p>
        I make Pinto Notes, a notes app for Mac and iPhone that ChatGPT, Claude and Claude Code can read and edit once you allow
        them. A note in it can hold a small app. The <a href="/templates/budget-log">Budget and expenses template</a> is a note
        with a budget app already built, with sample categories and a month of sample expenses to replace.
      </p>
      <Steps>
        <li>
          <strong>Choose Start budgeting on the template page</strong>
          On a Mac with Pinto Notes, it opens the app and adds a &ldquo;Budget and expenses&rdquo; note, with its app, to the folder you pick.
        </li>
        <li>
          <strong>Connect ChatGPT or Claude</strong>
          Once, with Read and Edit. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> needs Developer mode on a paid
          plan; Claude connects from its connector directory.
        </li>
        <li>
          <strong>Tell your AI what you spent</strong>
          It finds the note and reads the app&apos;s own notes on how expenses are kept: a date, what it was, a category from
          your list and an amount.
        </li>
      </Steps>
      <p>
        Then talk to it the way you&apos;d text a partner: &ldquo;Spent 412 on groceries and 85 on the bus card today.&rdquo; The AI
        adds two expenses, and the Month screen shows the new total. &ldquo;How am I doing against the budget this month?&rdquo; gets
        you an answer from the same numbers the app shows. At the end of the month, ask how each category did against its
        budget.
      </p>
      <p>
        To change the app itself, ask for that too: &ldquo;Add rent as a monthly bill on the 25th&rdquo; or &ldquo;Show my
        spending by week.&rdquo; Your AI edits the app, and the new version shows up in the note.
      </p>

      <h2 id="yourself">What you can still do yourself</h2>
      <p>
        Month is the first screen: what&apos;s left as a number and a bar, about how much a day that leaves, and each category against
        its budget. Next to it, a bar for each of the last six months and a line like &ldquo;600 kr less than September by the
        13th&rdquo;, which is the comparison that matters halfway through a month. Add expense starts on the amount. On Expenses,
        every expense of the month is listed by day; tap one to change it, or delete it, and Undo appears at the top of the
        screen. Earlier months are one tap back.
      </p>
      <p>
        Rent and subscriptions go in once. Turn on Every month when you add one, or add it under Every month on the Budget tab,
        and the app adds its expense on that day each month. Until then it&apos;s listed as due, and the per-day figure counts it.
        Roll over what&apos;s left is a single switch: what you didn&apos;t spend in a category carries into next month, and what you
        overspent comes off it.
      </p>
      <p>
        Budget is also where you add, rename and remove categories, change each monthly amount, and set the currency. A removed category
        keeps its expenses, so last month&apos;s total doesn&apos;t change under you. If the template&apos;s layout isn&apos;t right,
        ask your AI to change the app itself: it&apos;s a small React project in the note, and Pinto Notes runs its tests on every save
        and only shows a version that passes.
      </p>

      <h2 id="limits">What it doesn&apos;t do yet</h2>
      <p>
        It connects to no bank and imports nothing. Every expense is one you or your AI added. If you want your card spending pulled in automatically, use your bank&apos;s app or a budgeting app
        for that. There&apos;s no income, no savings goal per category and no budget that changes from month to month,
        and there&apos;s no CSV export yet. Over budget is shown in red, but nothing alerts you.
      </p>
      <p>
        The iPhone app isn&apos;t on the App Store yet, so the budget app opens on a Mac with macOS 26 or later. ChatGPT and Claude
        can still log expenses from your phone, because they reach the note through the connection, not the app. Notes, and the
        app&apos;s data with them, are end-to-end encrypted on your devices; see <a href="/blog/encrypted-notes-app-for-ai">what an
        AI can read</a> while it works. For bills to pay and other money errands, <a href="/for/chatgpt">a
        ChatGPT to-do list</a> works the same way.
      </p>
      <PostCta slug="budget-tracker-with-chatgpt-or-claude" position="how-amber-helps" title="Try the budget template on your Mac">
        <p>A budget app in a note: add expenses yourself, or tell your AI what you spent.</p>
      </PostCta>
    </PostPage>
  );
}
