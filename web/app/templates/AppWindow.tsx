import { readFileSync } from "node:fs";
import path from "node:path";
import { appFiles } from "@/lib/templates";
import s from "./templates.module.css";

/// An app template's app as Pinto Notes shows it on a Mac: the window with the folder in its title
/// bar, then the picture the template ships of its app (scripts/template-apps.ts draws them from the
/// app itself), light or dark. The template pages are always cream, so the scheme is chosen here,
/// not by the visitor's system. No code runs on the site.
export default function AppWindow({ slug, folder, label, scheme = "light" }: { slug: string; folder: string; label: string; scheme?: "light" | "dark" }) {
  const src = appFiles(slug)[scheme];
  const { width, height } = pngSize(src);
  return (
    <figure className={s.window} data-scheme={scheme} aria-label={label} style={{ margin: 0 }}>
      <div className={s.bar} aria-hidden="true">
        <span className={s.lights}><i /><i /><i /></span>
        <span className={s.folder}><FolderGlyph />{folder}</span>
      </div>
      <span className={s.appShot}><img src={src} alt="" width={width} height={height} decoding="async" /></span>
    </figure>
  );
}

/// A PNG's size from its header, so the picture holds its place while it loads.
export function pngSize(publicPath: string): { width: number; height: number } {
  const b = readFileSync(path.join(process.cwd(), "public", publicPath));
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

const FolderGlyph = () => <svg width="15" height="12" viewBox="0 0 17 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M1.5 3.5a1.5 1.5 0 0 1 1.5-1.5h3.2l1.5 1.6H14a1.5 1.5 0 0 1 1.5 1.5v6.4A1.5 1.5 0 0 1 14 13H3a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>;
