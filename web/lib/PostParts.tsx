import CopyButton from "@/app/templates/CopyButton";
import s from "./post-parts.module.css";
import { NoteBlocks } from "./TemplatePicker";
import { AIGlyph, AI_GLYPHS } from "./ai-glyphs";

/// The parts a how-to post is built from. The short answer comes first, so someone from a search
/// result has it on the first screen; the rest is for the people who read on.

/// The short answer, with links that jump to the sections that have the detail.
export function Answer({ children, jump = [], label = "The short answer", jumpTo = "Jump to" }: { children: React.ReactNode; jump?: { href: string; label: string }[]; label?: string; jumpTo?: string }) {
  return (
    <aside className={s.answer} aria-label={label}>
      {children}
      {jump.length ? (
        <p className={`${s.jump} post-jump`}>
          {jumpTo}{" "}
          {jump.map((j, i) => <span key={j.href} className={s.jumpItem}><a href={j.href}>{j.label}</a>{i < jump.length - 1 ? <span className={s.jumpDot} aria-hidden="true">·</span> : null}</span>)}
        </p>
      ) : null}
    </aside>
  );
}

/// A menu path as it reads on screen, Settings › Apps › Notes, with an optional keyboard shortcut.
export function Path({ steps, keys }: { steps: string[]; keys?: string }) {
  return (
    <span className={s.path} role="group" aria-label={steps.join(", then ") + (keys ? ` (${keys})` : "")}>
      {steps.map((step, i) => (
        <span key={`${i}-${step}`} className={s.step} aria-hidden="true"><span>{step}</span>{keys && i === steps.length - 1 ? <kbd>{keys}</kbd> : null}</span>
      ))}
    </span>
  );
}

/// The same thing on each device: a label, then its path.
export function Paths({ rows }: { rows: { on: string; steps: string[]; keys?: string }[] }) {
  return (
    <dl className={s.paths}>
      {rows.map((r) => [<dt key={`${r.on}-t`}>{r.on}</dt>, <dd key={`${r.on}-d`}><Path steps={r.steps} keys={r.keys} /></dd>])}
    </dl>
  );
}

/// Numbered steps, each with its number in a soft circle.
export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className={s.steps}>{children}</ol>;
}

/// Paper-cut art at the top of a post: decoration only, so it has no alt text. Its box has a fixed
/// shape, so the text under it never moves as it loads. Never a picture of an app's screen.
export function Banner({ src }: { src: string }) {
  return (
    <div className={s.banner}>
      <picture>
        <source type="image/avif" srcSet={`${src}.avif`} />
        <img src={`${src}.webp`} alt="" width={1200} height={480} decoding="async" fetchPriority="high" />
      </picture>
    </div>
  );
}

/// Something to keep: a checklist, a cheat sheet, a prompt or a script, with a Copy button that copies
/// `text` exactly. What shows is `children`, or the text itself in a code block. Copies are counted as
/// blog_copy_clicked (lib/posthog.ts reads data-event).
/// `fold`: show only that many lines of a long template, faded, with "Show all N lines" under it, so what comes after
/// (the Apple Notes and Pinto Notes cards) starts on the first or second screen of a phone. Copy always copies all of it.
/// No script: the checkbox sits inside its label, and :has() opens the rest.
/// A Markdown template (a # title, ## headings or - [ ] items) shows as Markdown from 601 px and, on a phone, the way it
/// looks as a note: a title, headings and round checkboxes (experiment B39; on a phone the Markdown read as code). Copy
/// copies the same Markdown on both.
export const isMarkdownTemplate = (text: string) => /^(#{1,2} |- \[ \] )/m.test(text);

export function Keep({ title, note, text, code = false, fold, children, copyLabel = "Copy" }: { title: string; note?: React.ReactNode; text: string; code?: boolean; fold?: number; children?: React.ReactNode; copyLabel?: string }) {
  const lines = text.trimEnd().split("\n").length;
  const folded = !children && !code && fold !== undefined && lines > fold + 2;
  const md = !children && !code && isMarkdownTemplate(text);
  const body = children ?? (code ? <pre tabIndex={0}><code>{text}</code></pre>
    : md ? <><pre className={`${s.plain} ${s.asMarkdown}`} tabIndex={0}>{text}</pre><NoteBlocks text={text} className={s.asNote} /></>
    : <pre className={s.plain} tabIndex={0}>{text}</pre>);
  return (
    <div className={s.keep}>
      <div className={s.keepHead}>
        <p className={s.keepTitle}>{title}</p>
        <CopyButton text={text} label={copyLabel} className={s.copy} event="blog_copy_clicked" />
      </div>
      {folded ? (
        <div className={s.fold} style={{ "--fold-lines": fold } as React.CSSProperties}>
          {body}
          <label className={s.more}><input type="checkbox" />Show all {lines} lines</label>
        </div>
      ) : body}
      {note && <p className={s.keepNote}>{note}</p>}
    </div>
  );
}

/// How to paste a Markdown template into Apple Notes, for the device in hand (experiment B39): the Mac steps on a Mac,
/// the iPhone steps on an iPhone, both anywhere else. iOS 27.2 Notes, read in the simulator on 24 Nov 2026, turns a paste
/// into checklists and headings only when the copied text is marked as Markdown, which a web page's Copy can't do, and
/// its edit menu has no Paste as Markdown (blog-growth EXPERIMENTS.md, B39). `mac` replaces the start of the Mac line.
export function PasteSteps({ mac = "On a Mac, paste it into a new note with Edit, Paste as Markdown." }: { mac?: string }) {
  return (
    <>
      <span className={`${s.pasteStep} pi-not-ios`}>{mac} The headings and checklists come through, and the note syncs to your iPhone.</span>
      <span className={`${s.pasteStep} pi-not-mac`}>On iPhone, Notes pastes it as plain text, with the # and - [ ] marks and no checkboxes. For the checklists, paste it on a Mac and let it sync, or type the lines, select them and tap the checklist button.</span>
    </>
  );
}

/// A checklist to keep: drawn with the round boxes Notes uses, and copied as plain lines (title first)
/// that become a checklist in Notes with one tap of the checklist button.
export function Checklist({ title, items, note }: { title: string; items: string[]; note?: React.ReactNode }) {
  return (
    <Keep title={title} note={note} text={[title, ...items].join("\n")}>
      <ul className={s.ticks}>{items.map((it) => <li key={it}>{it}</li>)}</ul>
    </Keep>
  );
}

/// A real capture from Apple's own apps (public/blog/macos27, taken in a clean macOS 27 VM with no
/// account), as AVIF with a WebP fallback, captioned with its OS. Windows, dialogs and menus are cut
/// out along their own rounded edges and sit straight on the page with a soft shadow, no box behind
/// them. `phone` is a tighter crop of the same capture for narrow screens, so the text stays readable
/// there; the browser picks one before loading, and each has its own size, so nothing moves. `width`
/// and `height` are the file's pixels (2x); it shows at most at `maxWidth`, or half its width.
type Img = { src: string; width: number; height: number };
const PHONE = "(max-width: 600px)";

export function Capture(props: Img & { alt: string; caption: string; priority?: boolean; maxWidth?: number; phone?: Img }) {
  return <PostFigure {...props} kind="cutout" />;
}

/// The image-led post format (one section per feature: an H2, then a real screenshot of exactly that
/// feature, then a few short lines and its menu path). PostFigure is that screenshot, the hero of its
/// section. `kind`: a "crop" of the screen (a rectangle: soft corners, a hairline and a soft shadow,
/// breaking out to about 860 px on wide screens when it is big enough to use the room) or a "cutout"
/// window or dialog with its own transparent edges (no frame, a drop shadow that follows its shape).
/// A "plain" picture carries its own shadows (a composition of lifted UI on a transparent ground), so it gets
/// no frame and no added shadow. A short muted caption sits under it.
export function PostFigure({ src, alt, width, height, caption, priority = false, maxWidth, phone, kind = "crop" }: Img & {
  alt: string; caption: string; priority?: boolean; maxWidth?: number; phone?: Img; kind?: "crop" | "cutout" | "plain";
}) {
  const w = maxWidth ?? width / 2;
  const wide = kind !== "cutout" && w >= 640;
  const style = { "--w": `${wide ? 860 : w}px`, "--pw": phone ? `${phone.width / 2}px` : undefined } as React.CSSProperties;
  return (
    <figure className={`${s.capture} ${wide ? s.wide : ""}`.trim()} data-kind={kind} style={style}>
      <picture>
        {phone && <source media={PHONE} type="image/avif" srcSet={`${phone.src}.avif`} width={phone.width} height={phone.height} />}
        {phone && <source media={PHONE} type="image/webp" srcSet={`${phone.src}.webp`} width={phone.width} height={phone.height} />}
        <source type="image/avif" srcSet={`${src}.avif`} />
        <img src={`${src}.webp`} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} />
      </picture>
      <figcaption className={s.captureCaption}>{caption}</figcaption>
    </figure>
  );
}

/// Two screenshots side by side (before and after, Mac and iPhone), with one caption under both.
/// They stack on phones.
export function FigurePair({ items, caption }: { items: (Img & { alt: string })[]; caption: string }) {
  return (
    <figure className={s.pair}>
      {/* Each column is as wide as its picture's shape, so a wide Mac capture and a tall phone capture
          stand at one height side by side instead of the wide one shrinking to a stamp. */}
      <div className={s.pairRow} style={{ gridTemplateColumns: items.map((it) => `minmax(0, ${(it.width / it.height).toFixed(3)}fr)`).join(" ") }}>
        {items.map((it) => (
          <picture key={it.src}>
            <source type="image/avif" srcSet={`${it.src}.avif`} />
            <img src={`${it.src}.webp`} alt={it.alt} width={it.width} height={it.height} loading="lazy" decoding="async" />
          </picture>
        ))}
      </div>
      <figcaption className={s.captureCaption}>{caption}</figcaption>
    </figure>
  );
}


/// Experiment B35 (21 Nov 2026, after Emil called the posts "a beige boring page"): parts that let a
/// reader see the answer before reading it. Each replaces a paragraph, never adds one.

/// A comparison sorted into a few coloured groups: what the group means, in a sentence, and the
/// options in it as big name chips. `ais` puts those AIs' marks on a group's corner.
export type SortGroup = { title: string; line: string; items: { name: string; href?: string }[]; ais?: (keyof typeof AI_GLYPHS)[]; tone: "leaf" | "sky" | "amber" | "rose" };
export function Sorter({ groups, caption }: { groups: SortGroup[]; caption?: string }) {
  return (
    <figure className={s.sorter}>
      <div className={s.sortGrid} data-n={groups.length}>
        {groups.map((g) => (
          <div key={g.title} className={s.sortGroup} data-tone={g.tone}>
            {g.ais && <span className={s.sortMarks} aria-hidden="true">{g.ais.map((a) => <span key={a} className={s.sortMark}><AIGlyph name={a} size={18} /></span>)}</span>}
            <p className={s.sortTitle}>{g.title}</p>
            <ul className={s.sortItems}>
              {g.items.map((it) => <li key={it.name}>{it.href ? <a href={it.href}>{it.name}</a> : it.name}</li>)}
            </ul>
            <p className={s.sortLine}>{g.line}</p>
          </div>
        ))}
      </div>
      {caption && <figcaption className={s.captureCaption}>{caption}</figcaption>}
    </figure>
  );
}

/// Three facts about one option, at the top of its section, so the reader who skims gets them
/// without the paragraph.
export function Facts({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className={s.facts}>
      {items.map((it) => (
        <div key={it.label} className={s.fact}><dt>{it.label}</dt><dd>{it.value}</dd></div>
      ))}
    </dl>
  );
}

/// Detail most readers skip (a long sourced table), folded under one line they can open.
export function More({ summary, children }: { summary: string; children: React.ReactNode }) {
  return <details className={s.more}><summary>{summary}</summary><div className={s.moreBody}>{children}</div></details>;
}

/// A folder as a picture: the export a reader is about to download, with what each part holds.
export function FolderTree({ root, items, caption }: { root: string; items: { name: string; note: string; file?: boolean }[]; caption?: string }) {
  return (
    <figure className={s.tree}>
      <div className={s.treeBox}>
        <p className={s.treeRoot}><ZipIcon />{root}</p>
        <ul className={s.treeItems}>
          {items.map((it) => (
            <li key={it.name}>{it.file ? <FileIcon /> : <FolderIcon />}<code>{it.name}</code><span>{it.note}</span></li>
          ))}
        </ul>
      </div>
      {caption && <figcaption className={s.captureCaption}>{caption}</figcaption>}
    </figure>
  );
}
const FolderIcon = () => <svg className={s.treeIcon} viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2h8.8A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" fill="#f0a640" /></svg>;
const FileIcon = () => <svg className={s.treeIcon} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="#fffaf3" stroke="#b8a48c" strokeWidth="1.2" /><path d="M8 11h8M8 14h8M8 17h5" stroke="#b8a48c" strokeWidth="1.2" /></svg>;
const ZipIcon = () => <svg className={s.treeIcon} viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" fill="#7a5a3a" /><path d="M12 3v2m0 2v2m0 2v2" stroke="#f7e5cc" strokeWidth="1.6" /><rect x="10.5" y="13" width="3" height="4" rx="1" fill="#f7e5cc" /></svg>;

/// The menu path of the format: "Notes › View › Show Tables" as quiet chips. Paths is the same for
/// more than one device; both are MenuPath.
export { Path as MenuPath, Paths as MenuPaths };
