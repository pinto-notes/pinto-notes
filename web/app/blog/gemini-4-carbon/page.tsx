import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("gemini-4-carbon", { title: "Gemini 4 Carbon: who gets it, price and what to try first" });

// News post, 28 October 2026. Checked that evening against Google's own pages: Gemini 4 Carbon: our next frontier model
// (blog.google, also at deepmind.google/blog, 28 October, Koray Kavukcuoglu: #1 on the Artificial Analysis Intelligence
// Index v5.0 at 59, SEC-bench Pro 88.2%, ExploitGym 54.8%, CWE-bench 71.0%, WebDev Arena #4 at 1769 (+89), runs for days
// on long engineering tasks; this week a subset of cyber defenders, then more trusted partners through the Fairwind
// Program, then developers, businesses and consumers "as soon as possible", no date; US government voluntary pre-release
// testing; introductory price $2 in / $10 out per million tokens, cached input 95% off, then $4 / $20, no end date given;
// Terminal-Bench 4.0 cheating 0.0%, attempts 0.4%, high-severity misalignment alerts down almost 80%, unsupported claims
// about 2x fewer than Argon, overreach down 26%, under-service down 29%, Gray Swan IPI 0.0% vs Argon 0.7%). The benchmark
// table and charts are Google's, from that post. The Fairwind Program page (deepmind.google/fairwind-program: approved
// trusted partners only; access only for internal security, incident response and pen-testing teams). Gemini 4 Argon:
// the Gemini app release notes (13 October: Google AI Pro and Ultra, worldwide) and Google's Argon post (Gemini app and AI
// Mode for Pro and Ultra, API paid tier, Antigravity for Ultra; introductory price until 30 November 2026). The Gemini
// API models and pricing pages listed Argon and no Carbon on 28 October. Not tried by me: Carbon isn't open to the public.

const FAQ = [
  { q: "When will Gemini 4 Carbon be in the Gemini app?", a: [
    "Google hasn't given a date. It says Carbon comes to developers, businesses and consumers \"as soon as possible\", after a first group of cyber defenders and more trusted partners have used it and Google has tuned the guardrails. Argon, the Gemini 4 model before it, reached the Gemini app on launch day for Google AI Pro and Ultra.",
  ] },
  { q: "Is Gemini 4 Carbon free?", a: [
    "Not for anyone yet, because it isn't public. Google hasn't said which Gemini plans will get it. If it follows Argon, expect it on Google AI Pro and Ultra first. For developers it will cost $2 per million input tokens and $10 per million output tokens at launch, then $4 and $20.",
  ] },
  { q: "What's the difference between Gemini 4 Carbon and Gemini 4 Argon?", a: [
    "Carbon is the newer, stronger model, aimed at long engineering jobs and security work. Google's table puts it ahead of Argon on most tests, for example 65.2% against 57.1% on Terminal-Bench 4.0, and it makes fewer unsupported claims. Argon is the one you can use today.",
  ] },
  { q: "Can I use Gemini 4 Carbon in the Gemini API?", a: [
    "Not yet. On 28 October the Gemini API's model list had Argon (gemini-4-argon) and no Carbon. Google says developers get it after the first partners. Until then, Argon is on the API's paid tier at the same introductory price.",
  ] },
];

const RERUN = `Here is a folder of notes and files for a client project. Turn it into a five-slide proposal: the problem, what we'll do, timeline, price and next steps. Where the files disagree or something is missing, list it at the end instead of guessing.`;

export default function Page() {
  return (
    <PostPage
      slug="gemini-4-carbon"
      intro={<>Google announced Gemini 4 Carbon on 28 October, 15 days after <a href="/blog/new-ai-features">Gemini 4 Argon</a>. It&apos;s Google&apos;s strongest model, built for long coding jobs and security work. The catch: almost nobody can use it yet. Here&apos;s who can, what it will cost, and what to try while you wait.</>}
      answer={
        <Answer jump={[
          { href: "#what", label: "What it is" },
          { href: "#who", label: "Who gets it" },
          { href: "#careful", label: "What changed" },
          { href: "#first", label: "What to try first" },
        ]}>
          <p>
            <strong>What it is:</strong> Google&apos;s new frontier model, the second in the Gemini 4 family, made for long, multi-step
            engineering work and finding and fixing security flaws. <strong>Who gets it:</strong> from this week, a small group of
            cyber defenders, then more partners in Google&apos;s Fairwind Program. Developers, businesses and Gemini app users come
            later, with no date yet. <strong>What it costs:</strong> in the API, $2 per million input tokens and $10 per million
            output tokens to start, then $4 and $20. Google hasn&apos;t named the Gemini plans. <strong>How to use it:</strong> you
            can&apos;t yet. Gemini 4 Argon is in the Gemini app today on Google AI Pro and Ultra.
          </p>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="what">What Gemini 4 Carbon is</h2>
      <PostFigure src="/blog/gemini-4-carbon/benchmarks" width={1600} height={1346} maxWidth={760}
        alt="Google's benchmark table comparing Gemini 4 Carbon with Gemini 4 Argon, GPT-6 Astra, Claude Opus 5.5 and Claude Fable 5.1. Carbon leads most rows, with 59 on the AA Index v5.0, 65.2% on Terminal-Bench 4.0 and 88.2% on SEC-bench Pro."
        caption="Google's own numbers: Carbon leads most rows, but not every one. Image: Google." />
      <p>
        Carbon is the model Google built for jobs that take a long time. Google says its own teams have watched it work for days
        on one problem, getting past dead ends to find and patch subtle bugs in large codebases. It ranks first on the Artificial
        Analysis Intelligence Index with 59, and moved up 89 points to fourth place on WebDev Arena, which rates the websites
        models build.
      </p>
      <p>
        It isn&apos;t first everywhere. In Google&apos;s own table GPT-6 Astra still leads FrontierSWE 2, and Claude Opus 5.5
        leads OSWorld, the test of using a computer. Treat the table as Google&apos;s pitch and wait for people to try it on
        real work.
      </p>

      <h2 id="who">Who can use it, and what it will cost</h2>
      <PostFigure src="/blog/gemini-4-carbon/sec-bench-pro" width={1600} height={900} maxWidth={720}
        alt="A bar chart of SEC-bench Pro scores, higher is better: Gemini 4 Carbon 88.2%, GPT-6 Astra 85.4%, Gemini 4 Argon 83.4%, GPT-6.1 Terra 83.3%, GPT-6.1 Sol 78.8%, and lower scores for MiMo and DeepSeek models."
        caption="Finding real security flaws is Carbon's best test, so defenders get it first. Image: Google." />
      <p>
        Google is holding Carbon back on purpose. This week it goes to a subset of cyber defenders. Then more trusted partners get
        it through the Fairwind Program, which only approves organisations, and only for their own security teams. Google is also
        in the US government&apos;s voluntary testing of models before release. Developers, businesses and consumers come
        &quot;as soon as possible&quot;, once the guardrails are tuned. There&apos;s no date, and no word on which Gemini plans
        get it.
      </p>
      <p>
        The price is set. In the API it starts at $2 per million input tokens and $10 per million output tokens, with cached input
        95% off, the same as Argon. After an introductory period it goes up to $4 and $20. Google hasn&apos;t said when that
        period ends for Carbon. For Argon it&apos;s 30 November.
      </p>

      <h2 id="careful">What changes: a more careful agent</h2>
      <PostFigure src="/blog/gemini-4-carbon/prompt-injection" width={1600} height={900} maxWidth={720}
        alt="A bar chart of the Gray Swan indirect prompt injection test, lower is better: Gemini 4 Carbon at 0%, Gemini 4 Argon 0.7%, Claude Opus 5.5 and Claude Fable 5.1 at 1.0%, and higher rates for GPT-6 Astra, Muse Spark, GLM, Grok and Kimi."
        caption="No hidden instruction in Gray Swan's test got Carbon to change course. Image: Google." />
      <p>
        The part you&apos;ll notice day to day is how it behaves on a long task. Google says Carbon makes about half as many claims
        it can&apos;t back up as Argon, and when your files disagree, it shows you the conflict before acting instead of guessing.
        It oversteps 26% less often and leaves work undone 29% less often.
      </p>
      <p>
        It also held up against every hidden instruction in Gray Swan&apos;s prompt injection test, the kind planted in a web page
        or email to hijack an agent. That matters more as Gemini reads your mail and connected apps for you.
      </p>

      <h2 id="first">What to try first, while you wait</h2>
      <PostFigure src="/blog/gemini-4-carbon/gemini-4-argon" width={1300} height={731} maxWidth={620}
        alt="Google's launch picture for Gemini 4 Argon: a large soft white 4 on a blue gradient."
        caption="Gemini 4 Argon, from 13 October, is the Gemini 4 model you can use now. Image: Google." />
      <p>
        On Google AI Pro or Ultra, Argon is in the Gemini app and AI Mode in Search. Give it the kind of job Google built Gemini 4
        for: a messy folder turned into a proposal, a long financial report to pick apart, or on a Mac, a coding agent in
        Antigravity from the Gemini app. (Gemini&apos;s <a href="/blog/gemini-notebooks">notebooks</a> are a good place to keep
        the files together.)
      </p>
      <p>
        Then save the prompt. When Carbon arrives, run the same one again, and you&apos;ll see for yourself whether it&apos;s
        better on your work, not just on Google&apos;s charts. This one tests what Google says Carbon fixed:
      </p>
      <Keep title="A prompt to run on Argon now and Carbon later" text={RERUN} />
      <p>
        I keep prompts like this in a note so I can rerun them on every new model, as I did for <a
        href="/blog/gpt-6-astra-use-cases">GPT-6 Astra</a>. I make Pinto Notes, a notes app for Mac that ChatGPT, Claude, Claude
        Code and Codex can read and edit once you allow it (the iPhone app is coming soon). It doesn&apos;t connect to Gemini, so
        there you paste the prompt in.
      </p>
    </PostPage>
  );
}
