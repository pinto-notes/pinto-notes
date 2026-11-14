import type { Metadata } from "next";
import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Story } from "./Story";
import s from "./t.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study T, "one note becomes everything" (round 5, 2026-11-14). The page is one note on a sticky
// stage (Story.tsx): the headline is its first line, and scrolling grows it a checklist, unfolds it
// into a whiteboard, puts a habit tracker in it, and lets ChatGPT edit all three. After the story, a
// short ending: everything else as a ticked list, then free and the download.

const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.7 2.7L12.2 5.2" /></svg>;

function Ctas({ fine = true }: { fine?: boolean }) {
  return (
    <>
      <div className={x.ctas}>
        <Download note={false} />
        <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
          Get it for iPhone
        </a>
        <a className={x.offMac} href="/download">Download for Mac</a>
      </div>
      {fine && <p className={`${s.closingFine} pi-apple`}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>}
    </>
  );
}

// Only true claims, from the live page's list (_home/Home.tsx EXTRAS).
const MORE: { title: string; say: React.ReactNode }[] = [
  { title: "Feels like Apple Notes", say: "Checklists, tables, folders and links between notes." },
  { title: "Mac and iPhone", say: "Always in sync, and it works offline." },
  { title: "Bring your notes", say: "From Apple Notes, Obsidian, Bear, Evernote and Keep." },
  { title: "Every change says who", say: "You or which AI. Undo takes it back." },
  { title: "Your AI remembers", say: <>In a new chat, Claude got 18% of questions on past chats right. With Pinto, 82.5%. <a href="/blog/ai-memory-with-notes">Read the study</a></> },
  { title: "Private", say: "Encrypted on your device before it syncs. Lock a note with its own password." },
  { title: "Open source", say: "Anyone can check the code." },
];

export default function Page() {
  return (
    <div className={s.main}>
      <Story cta={<Ctas />} />

      <div className={s.after}>
        <section className={s.more} aria-labelledby="t-more">
          <h2 id="t-more" className={s.moreTitle}>And everything a notebook needs.</h2>
          <ul className={s.list}>
            {MORE.map((m) => (
              <li key={m.title}><i><Tick /></i><b>{m.title}</b><span>{m.say}</span></li>
            ))}
          </ul>
        </section>

        <section className={s.closing} aria-labelledby="t-closing">
          <h2 id="t-closing" className={s.closingTitle}>Pinto Notes<br />is free.</h2>
          <p className={s.closingSay}>On Mac and iPhone, and open source under the MIT license.</p>
          <Ctas fine={false} />
          <p className={s.closingFine}>Requires macOS 26 or iOS 26.</p>
        </section>
      </div>
    </div>
  );
}
