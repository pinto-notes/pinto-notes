"use client";

import { useState } from "react";
import CopyButton from "@/app/templates/CopyButton";
import s from "./post-parts.module.css";

/// A few templates to copy, one shown at a time: pick one, see it the way Notes shows it once pasted
/// (a title, headings, Notes' round checkboxes), and copy it as Markdown. Every template stays in the
/// page's HTML, the ones not picked hidden, so search engines and AI answers can read them all.
/// Picking one counts as blog_helper_used, and copying as blog_copy_clicked.
/// A template with `pinto` says under it which Pinto Notes template does the same job, linked to that
/// template's page; with `post`, the link counts as the post's blog_cta_clicked (position "template").
export type Template = { title: string; text: string; pinto?: { slug: string; name: string; rest: string } };

/// `start` is the template shown first (the templates post opens on the Packing list its side-by-side shows).
/// `note` sits under the picked template, like Keep's (the paste steps).
export function TemplatePicker({ templates, legend, post, start = 0, note }: { templates: Template[]; legend: string; post?: string; start?: number; note?: React.ReactNode }) {
  const [picked, setPicked] = useState(start);
  return (
    <div className={s.chooser}>
      <fieldset>
        <legend>{legend}</legend>
        <div className={s.choices}>
          {templates.map((t, i) => (
            <button key={t.title} type="button" aria-pressed={picked === i} data-event="blog_helper_used" onClick={() => setPicked(i)}>{t.title}</button>
          ))}
        </div>
      </fieldset>
      {templates.map((t, i) => (
        <div key={t.title} className={s.verdict} hidden={picked !== i}>
          <Preview text={t.text} copy={<CopyButton text={t.text} label="Copy" className={s.copy} event="blog_copy_clicked" />} />
          {t.pinto ? (
            <p className={s.tplPinto}>
              Pinto Notes has a{" "}
              <a href={`/templates/${t.pinto.slug}`}
                {...(post ? { "data-cta": post, "data-cta-position": "template", "data-cta-action": t.pinto.slug } : {})}>{t.pinto.name} template</a>{" "}
              {t.pinto.rest}
            </p>
          ) : null}
        </div>
      ))}
      {note ? <p className={s.keepNote}>{note}</p> : null}
    </div>
  );
}

/// The Markdown drawn the way Notes shows it after Paste as Markdown. A Markdown table (| between the cells) pastes as a
/// real Notes table on macOS 27 (tried 24 Nov 2026), its first row a plain row; the | --- | line is dropped.
type Block = { kind: "title" | "heading" | "line"; text: string } | { kind: "tick" | "dash"; items: string[] } | { kind: "table"; rows: string[][] };

export function blocksOf(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split("\n")) {
    if (/^\|.*\|\s*$/.test(line)) {
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
      const last = blocks.at(-1);
      if (last?.kind === "table") last.rows.push(cells);
      else blocks.push({ kind: "table", rows: [cells] });
      continue;
    }
    const tick = /^- \[ \] (.+)$/.exec(line)?.[1];
    const dash = tick === undefined ? /^- (.+)$/.exec(line)?.[1] : undefined;
    const item = tick ?? dash;
    if (item !== undefined) {
      const kind = tick !== undefined ? "tick" : "dash";
      const last = blocks.at(-1);
      if (last && last.kind === kind && "items" in last) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else if (line.startsWith("# ")) blocks.push({ kind: "title", text: line.slice(2) });
    else if (line.startsWith("## ")) blocks.push({ kind: "heading", text: line.slice(3) });
    else if (line.trim()) blocks.push({ kind: "line", text: line });
  }
  return blocks;
}

const CLASS = { title: s.tplTitle, heading: s.tplHeading, line: s.tplLine };

/// One block as Notes draws it.
function NoteBlock({ b }: { b: Block }) {
  return b.kind === "table"
    ? <table className={s.tplTable}><tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody></table>
    : "items" in b
    ? <ul className={b.kind === "tick" ? s.ticks : s.dashes}>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
    : <p className={CLASS[b.kind]}>{b.text}</p>;
}

/// A whole template drawn as a note, title included (Keep shows a Markdown template this way on phones).
export function NoteBlocks({ text, className }: { text: string; className?: string }) {
  return <div className={`${s.tpl} ${className ?? ""}`.trim()}>{blocksOf(text).map((b, i) => <NoteBlock key={i} b={b} />)}</div>;
}

/// The note's title shares a row with the Copy button.
function Preview({ text, copy }: { text: string; copy: React.ReactNode }) {
  const [first, ...rest] = blocksOf(text);
  const title = first?.kind === "title" ? first.text : null;
  return (
    <div className={s.tpl}>
      <div className={s.keepHead}>{title && <p className={s.tplTitle}>{title}</p>}{copy}</div>
      {(title ? rest : [first, ...rest]).map((b, i) => <NoteBlock key={i} b={b} />)}
    </div>
  );
}
