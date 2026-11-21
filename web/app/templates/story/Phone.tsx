import s from "./story.module.css";

/// An iPhone drawn around a real capture of the app (the capture starts under the status bar).
export function Phone({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`${s.phone} ${className}`.trim()} role="img" aria-label={alt}>
      <div className={s.screen}>
        <div className={s.status} aria-hidden="true"><span>9:41</span><span className={s.bat} /></div>
        <img src={src} alt="" width={780} height={1688} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />
      </div>
      <span className={s.island} aria-hidden="true" />
    </div>
  );
}
