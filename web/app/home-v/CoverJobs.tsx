"use client";

import { COVERS, coverPath, inkOn } from "@/lib/template-covers";
import { JOBS, JobFigure, useFirstView, useJobTyping } from "../Sections";
import h from "./home-v.module.css";

/// Each request's own cover: a reno for the messy note, a running path for the plan, a morning desk
/// for the standup.
const COVER = ["home-maintenance", "habit-tracker", "daily-standup"];

/// The three requests as cover cards, the chat set on the bottom of the picture and the words on the
/// cover's ground below it, like the templates gallery.
export function CoverJobs() {
  const [ref, seen] = useFirstView<HTMLDivElement>(0.4);
  const [typed, done] = useJobTyping(seen);
  return (
    <div ref={ref} className={h.coverJobs}>
      {JOBS.map((j, k) => {
        const c = COVERS[COVER[k]];
        return (
          <article key={j.app} className={h.coverJob} data-ink={inkOn(c.ground)} style={{ "--ground": c.ground } as React.CSSProperties}>
            <span className={h.coverPic}><img src={coverPath(COVER[k])} alt="" width={800} height={800} loading="lazy" decoding="async" /></span>
            <JobFigure j={j} typed={typed[k]} done={done[k]} className={h.coverFigure} />
            <h3 className={h.coverTitle}>{j.title}</h3>
            <p className={h.coverLine}>{j.line}</p>
          </article>
        );
      })}
    </div>
  );
}
