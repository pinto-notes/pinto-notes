import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("what-time-ai-companies-launch", { title: "What time do AI companies launch? We timed 206 launches" });

// Every number here comes from news-watcher/backtest/data_post.py in the content-tools repo (run 22 October 2026 on
// results/cascade8-hist.jsonl): 2,715 items, 308 launch items, 206 launches, 200 with a clock time, 128 of them
// 15:00-20:59 UTC (64.0%), 37 at 17:00-17:59 UTC, Tue 62 (30.1%), Tue-Thu 150 (72.8%), weekend 10 (4.9%), 97 of 182
// days without a launch, six busiest days 46 launches (22.3%), 19 May 12. Baselines: all items 51.2% (2,514 timed),
// official launch posts 73.9% (46), all official posts 46.2% (652); Tuesday 23.6% and weekends 8.6% of all items.
// The charts come from data_post_charts.py in the same folder.

const FAQ = [
  { q: "What time does OpenAI usually release new models?", a: [
    "In our count, OpenAI followed the same pattern as everyone else: 20 of its 35 launches with a known time broke between 11 am and 5 pm US Eastern. That&apos;s 57%, a little below the 64% across all companies.",
  ] },
  { q: "Can I use these charts in my article?", a: [
    "Yes. Use the charts and numbers as you like, and link to this page as the source so readers can see how we counted.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="what-time-ai-companies-launch"
      intro={<>If you cover AI, you know the feeling: the big launch drops just as your day is ending, or just as it starts. We wanted to know if that&apos;s a real pattern, so we collected six months of AI launch news, from 21 April to 19 October 2026, and counted when each launch first appeared.</>}
      answer={
        <Answer jump={[
          { href: "#hours", label: "The hour" },
          { href: "#days", label: "The day" },
          { href: "#bursts", label: "The bursts" },
          { href: "#method", label: "How we counted" },
        ]}>
          <p>
            Most AI launches break between 11 am and 5 pm US Eastern: 64% of the 200 launches we could time, which is
            17:00 to 23:00 in Central Europe. The busiest single hour is 1 pm Eastern (10 am Pacific). Tuesday is the
            biggest day, with 30% of all 206 launches, and only 5% land on a weekend.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch-times/ai-launches-hours" width={1600} height={1000} maxWidth={800}
        alt="A bar chart of 200 AI launches by the hour their first report appeared, in New York and Paris time. The bars from 11 am to 5 pm New York time are highlighted and hold 64% of launches; the tallest bar, 1 pm, has 37."
        caption="Each bar is the hour a launch was first reported, in New York and Paris time." />}
      faq={FAQ}
    >
      <h2 id="hours">Lunchtime in New York, evening in Europe</h2>
      <p>
        The pattern is sharp. Of the 200 launches with a known time, 128 broke between 11 am and 5 pm Eastern. The single
        busiest hour, 1 pm to 2 pm Eastern, held 37 of them, nearly one in five. Add the hour before and you have 62
        launches, 31%, arriving between 9 and 11 am Pacific, the start of the working day in San Francisco and Mountain View.
      </p>
      <p>
        Very little ships overnight in the US. Only 10 launches, 5%, broke between 10 pm and 6 am Eastern, the European
        morning. For anyone in Europe, that means the news you need to react to usually lands after dinner.
      </p>

      <h2>It&apos;s not just when news sites publish</h2>
      <PostFigure src="/blog/launch-times/ai-launches-baseline" width={1600} height={1000} maxWidth={800}
        alt="Four bars showing the share published between 11 am and 5 pm US Eastern: all launches 64%, all news in the same feeds 51%, launch posts on OpenAI and Google blogs 74%, all posts on the same blogs 46%."
        caption="Launches pick the afternoon more than other news from the same sources." />
      <p>
        A fair objection: tech sites publish in US working hours anyway. So we compared. Across all 2,514 items with a time
        in the same feeds, 51% landed in that window. Launches: 64%. The gap is wider on the companies&apos; own blogs. On
        OpenAI&apos;s and Google&apos;s blogs, 74% of launch posts went up between 11 am and 5 pm Eastern, against 46% of
        all their posts. The window looks chosen, not a side effect of when news sites work.
      </p>

      <h2 id="days">Tuesday is launch day</h2>
      <PostFigure src="/blog/launch-times/ai-launches-weekdays" width={1600} height={1000} maxWidth={800}
        alt="Bar chart of 206 AI launches by weekday in US Eastern time: Monday 20, Tuesday 62, Wednesday 45, Thursday 43, Friday 26, Saturday 3, Sunday 7."
        caption="Launches by weekday, US Eastern time." />
      <p>
        Tuesday carried 62 of 206 launches, 30%, while it carried 24% of all the news in our feeds. Tuesday to Thursday
        together held 73%. Mondays were quiet, with 20, and weekends nearly empty: 10 launches, 5%, against 9% of
        all news. If an AI company wants your attention, it shows up midweek.
      </p>

      <h2 id="bursts">Most days, nothing ships</h2>
      <PostFigure src="/blog/launch-times/ai-launches-calendar" width={1600} height={1000} maxWidth={800}
        alt="A bar for each day from 21 April to 19 October 2026 showing launches per day. Most days have none or a few. Spikes: Google I/O on 19 May with 12, WWDC on 8 June with 7, and 9 September with 11."
        caption="Launches per day. The tallest spikes are keynote days." />
      <p>
        On 97 of the 182 days, nothing launched at all. The rest came in bursts: the six busiest days carried 46 launches,
        22% of the total. Google I/O on 19 May was the peak, with 12 launches in one day, from Gemini 3.5
        to Gmail Live. On 9 September, Apple confirmed the release dates for iOS 27
        and macOS 27 and said Siri AI would launch that month: 11 launches. Of the months we have complete data for, September was the
        busiest, with 58, against 37 in May and 41 in August. Autumn brought <a href="/blog/what-are-chatgpt-dots">ChatGPT
        dots</a>, <a href="/blog/siri-ai-apple-notes">Siri AI</a> and <a href="/blog/gpt-6-astra-use-cases">GPT-6</a>.
      </p>
      <p>
        By company, Google had the most launches in our count (70), then Apple (57), OpenAI (37), Anthropic (21) and Meta
        (11). Read that with care: our sources include Google&apos;s and Apple&apos;s own blogs and four sites that mostly cover
        those two.
      </p>

      <h2 id="method">How we counted</h2>
      <PostFigure src="/blog/launch-times/ai-launches-method" width={1600} height={1000} maxWidth={800}
        alt="Three bars narrowing down: 2,715 AI news items from 15 feeds rebuilt from the Wayback Machine, 308 items about a launch people can use, and 206 launches once reports of the same one are merged."
        caption="From news items to launches." />
      <p>
        We rebuilt what 15 news feeds carried each day from 21 April to 19 October 2026 out of Wayback Machine snapshots:
        the OpenAI and Google blogs, Google DeepMind, Apple Newsroom, 9to5Mac, 9to5Google, TechCrunch, Engadget, AppleInsider,
        Lifehacker, TestingCatalog, Simon Willison, The Verge, MacStories and The Decoder. A keyword filter kept 2,715 items
        about AI and the apps around it.
      </p>
      <p>
        We sorted every item against a written rubric, using AI models. A launch is something new that ordinary people can
        use now or within weeks, in an AI assistant (ChatGPT, Claude, Gemini, Grok, Meta AI, Copilot, Perplexity), in
        Apple&apos;s software, or in a notes or productivity app. New model generations count. Point releases, developer
        APIs, business deals, research, rumors and car, TV or watch features don&apos;t. That gave 308 items. Reports of the
        same launch within 72 hours were merged into one, leaving 206 launches. A launch&apos;s time is its earliest report
        with a clock time. Six had only a date, so they count for the weekday but not the hour.
      </p>
      <p>
        The limits: these are publish times, so a launch that went live an hour before anyone wrote about it shows up an
        hour late. The archive kept few snapshots of 9to5Mac, 9to5Google and TechCrunch in June, so WWDC is undercounted.
        Anthropic and Meta announcements reach the count only through news sites. Our rubric leans toward what our readers
        use, so small notes features count as launches.
      </p>
      <p>
        We counted because we write how-to posts the day something ships, for people who use these assistants with Pinto
        Notes, a notes app for the Mac that ChatGPT and Claude can read and edit. The charts and numbers are free to reuse:
        please link to this page.
      </p>
    </PostPage>
  );
}
