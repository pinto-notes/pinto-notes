import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("budget-tracker-with-chatgpt-or-claude", { title: "A budget your AI can keep for you" });

// Checked on 13 October 2026 against the Budget and expenses template on main (Mac 1.2.26):
// content/templates/budget-log.json (prompt, asks) and budget-log.app (README.md, docs/README.md: Month,
// Expenses and Budget screens; add, edit, delete expenses with Undo; add, rename, remove categories; budget
// per category; currency; monthly bills added on their day; roll-over; a six-month chart; no income,
// per-month budgets or export; no bank connection). Re-checked on growth/apps-bar for the upgraded app.
// YNAB checked 14 Oct: no official MCP server or ChatGPT app; community MCP servers with API tokens exist (usecarly, GitHub).
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
      intro={<>
        Budgets fail at the same step as habit trackers: writing things down. I&apos;d buy coffee, mean to log it, and forget. What finally
        worked was telling the AI I already chat with, &ldquo;spent 85 on the bus card&rdquo;, and having a real budget update itself. Here&apos;s
        how to get there, and why I don&apos;t let the AI do the maths.
      </>}
      answer={
        <Answer jump={[
          { href: "#in-chat", label: "Build one in the chat" },
          { href: "#missing", label: "What's missing" },
          { href: "#template", label: "A budget your AI keeps" },
          { href: "#ai-logs", label: "Talk to it" },
          { href: "#limits", label: "Limits" },
        ]}>
          <p>
            ChatGPT and Claude can build a budget tracker in one message, but it lives in that chat, and every sum is the AI&apos;s guess.
            Budgeting apps mostly keep their own AI; YNAB, for one, has no official ChatGPT app, only unofficial bridges developers set
            up with an API token. A budget in Pinto Notes is built for it: you tell
            your AI what you spent, it adds the expense, and the app does the sums.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/pinto/budget-log-main-mac-light" width={1280} height={900} maxWidth={640}
        alt="The Budget and expenses app in a Pinto Notes note on a Mac: what's left this month as one big number with a bar, spending by category against each budget, a six-month chart and the month's bills."
        caption="The budget template in Pinto Notes. Tell your AI what you spent; the app keeps the totals. Example data." />}
      faq={FAQ}
    >
      <h2 id="in-chat">Ask ChatGPT or Claude to build one</h2>
      <p>
        Give it your categories and monthly amounts and you&apos;ll get a spreadsheet to download or a little app in the chat. It&apos;s a
        quick way to see a layout.
      </p>
      <Keep title="A budget tracker prompt" text={PROMPT}
        note="Swap in your own categories and amounts. Fewer categories is easier to keep up." />
      <PostFigure src="/blog/drawn/bd-guess" width={1200} height={750} maxWidth={560}
        alt="A chat bubble with a small table whose total is a red question mark."
        caption="A total written by an AI in a chat is a guess until you check it." />
      <p>
        Two checks before you trust it. Add an expense, close the chat and come back tomorrow: is it still there? And add up one category
        by hand. An AI writing numbers into a chat can get a sum wrong without telling you.
      </p>

      <h2 id="missing">What&apos;s missing</h2>
      <PostFigure src="/blog/drawn/bd-lock" width={1200} height={750} maxWidth={560}
        alt="A budgeting app with a padlock, and the ChatGPT logo outside it."
        caption="Budgeting apps keep their own AI, and keep yours out." />
      <p>
        The budgeting apps are good at budgets and mostly closed to everything else. Their AI is their own. YNAB has no official ChatGPT
        app; the unofficial ones need an API token and a developer&apos;s patience. A spreadsheet is open, but the AI only sees it when you
        upload it again.
      </p>
      <p>
        What I wanted: a budget I can open and change like any app, that does its own arithmetic, and that the AI I&apos;m already talking
        to can add to from my phone the moment I pay for something.
      </p>

      <h2 id="template">A budget your AI keeps</h2>
      <p>
        That&apos;s the <a href="/templates/budget-log">budget template</a> in Pinto Notes, the notes app I make for Mac (iPhone coming soon). It&apos;s a
        note with a small app in it. Choose Start budgeting, set your categories, then <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> once.
      </p>
      <PostFigure src="/blog/pinto/budget-log-expenses-mac-light" width={1280} height={900} maxWidth={640}
        alt="The Expenses list of the budget app on a Mac for October: each expense by day with its category and amount, and a delete button."
        caption="Every expense this month, on a Mac. Edit or delete any of them." />
      <PostFigure src="/blog/pinto/budget-log-budget-phone-light" width={780} height={1688} maxWidth={320}
        alt="The Budget screen on a phone: each category with its monthly budget, which you can change, and monthly bills."
        caption="Your categories and budgets, on a phone. Change any of them yourself." />
      <p>
        You stay in charge: add, edit and delete expenses, rename categories and change their budgets, add rent once as a monthly bill,
        and turn on roll-over if you want what&apos;s left to carry into next month.
      </p>

      <h2 id="ai-logs">Talk to it</h2>
      <ul>
        <li>&ldquo;Spent 412 on groceries and 85 on the bus card.&rdquo;</li>
        <li>&ldquo;How am I doing on eating out this month?&rdquo;</li>
        <li>&ldquo;Add rent as a monthly bill on the 25th.&rdquo;</li>
      </ul>
      <PostFigure src="/blog/drawn/bd-log" width={1200} height={750} maxWidth={560}
        alt="A chat bubble saying 412 groceries, 85 bus card, with an arrow to a budget listing both and what's left."
        caption="The AI adds the expenses; the app does the sums." />
      <p>
        The AI adds two expenses; the app works out what&apos;s left. That split is the point: the AI understands what you said, and the
        app does the arithmetic, so the number on the screen is never a guess. Ask Claude next week how the month went, and it reads the
        same budget ChatGPT filled in.
      </p>

      <h2 id="limits">Limits</h2>
      <PostFigure src="/blog/drawn/bd-bank" width={1200} height={750} maxWidth={560}
        alt="A bank building and a budget card with a crossed-out line between them."
        caption="No bank connection: each expense is added by you or your AI." />
      <p>
        No bank connection: you, or your AI, add each expense. No income tracking yet. Connecting ChatGPT needs a paid plan with custom apps.
        {APP_STORE_LIVE
          ? <> Pinto Notes is free on Mac and iPhone.</>
          : <> Pinto Notes is free on the Mac today; the iPhone app is coming soon, and Claude can still add expenses from your phone.</>}{" "}
        For daily habits, the same idea is <a href="/blog/habit-tracker-with-chatgpt-or-claude">a habit tracker your AI can update</a>, and{" "}
        <a href="/blog/apple-notes-tables">Apple Notes tables</a> explains why a plain table can&apos;t add up.
      </p>
    </PostPage>
  );
}
