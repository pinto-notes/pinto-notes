"use client";

import { JobFigure, useFirstView, useJobTyping, type Job } from "../Sections";
import a from "../sections.module.css";

/// The three requests and what each did, under one heading of the page's own: they type and answer
/// the first time they're seen.
export function Jobs({ jobs }: { jobs: Job[] }) {
  const [ref, seen] = useFirstView<HTMLDivElement>(0.4);
  const [typed, done] = useJobTyping(seen);
  return (
    <div ref={ref} className={a.jobs}>
      {jobs.map((j, k) => (
        <div key={j.app} className={a.cap}>
          <JobFigure j={j} typed={typed[k]} done={done[k]} />
          <h3 className={a.capTitle}>{j.title}</h3>
          <p className={a.capLine}>{j.line}</p>
        </div>
      ))}
    </div>
  );
}
