import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Small building blocks in the style of Apple's own apps: grouped sections on solid surfaces,
// rows at least 44 pt tall, one accent (Pinto's amber), and motion only where it explains a change.

/** A titled group of rows on the surface colour, like a Settings or Health section. */
export function Section({ title, action, footer, children, className }: { title?: string; action?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-6", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-1 pb-2">
          {title && <h2 className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>}
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-xl bg-card">{children}</div>
      {footer && <p className="px-1 pt-2 text-[0.8125rem] text-muted-foreground">{footer}</p>}
    </section>
  )
}

/** One row of a section: 44 pt or taller, a hairline above every row but the first. */
export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-11 items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0", className)}>{children}</div>
}

/** A progress ring. value from 0 to 1. */
export function Ring({ value, size = 88, stroke = 10, label, children }: { value: number; size?: number; stroke?: number; label?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className="stroke-[var(--amber-accent)] transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ opacity: v === 0 ? 0 : 1 }} />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  )
}

/** A thin bar. value from 0 to 1; over shows the danger colour (a budget gone over). */
export function Bar({ value, over, className, label }: { value: number; over?: boolean; className?: string; label?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, Math.min(1, value)) * 100)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none", over ? "bg-destructive" : "bg-[var(--amber-accent)]")}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

/** A sheet for a short task: rises from the bottom on iPhone, a centred panel on wider windows. */
export function Sheet({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!open) return
    const was = document.activeElement as HTMLElement | null
    const first = box.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")
    first?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", key)
    return () => { document.removeEventListener("keydown", key); was?.focus?.() }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center min-[700px]:items-center">
      <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-200 motion-reduce:animate-none" onClick={onClose} />
      <div ref={box} role="dialog" aria-modal="true" aria-label={title}
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-background shadow-xl animate-in slide-in-from-bottom-8 fade-in duration-200 motion-reduce:animate-none min-[700px]:max-w-md min-[700px]:rounded-2xl"
        style={{ paddingBottom: "max(12px, var(--amber-safe-bottom))" }}>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="flex-1 text-[1.0625rem] font-semibold">{title}</h2>
          <button data-close type="button" aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="px-4 pt-1">{footer}</div>}
      </div>
    </div>
  )
}

/** The screen's one main action: full width on iPhone. */
export function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[1.0625rem] font-semibold text-primary-foreground active:opacity-80 disabled:opacity-40 [&_svg]:size-5", className)}>
      {children}
    </button>
  )
}

/** A quieter button: tinted fill, the accent's text colour. */
export function TintButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={cn("inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--amber-accent-soft)] px-4 font-semibold text-primary active:opacity-70 disabled:opacity-40 [&_svg]:size-[18px]", className)}>
      {children}
    </button>
  )
}

/** A labelled field in a sheet. */
export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export const inputClass = "h-11 w-full rounded-xl border border-input bg-[var(--amber-field)] px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-ring"

/** Choices as a row of pills, one selected (a category, a topic). */
export function Pills<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
          className={cn("h-11 rounded-full px-4 text-[0.9375rem] font-medium", value === o ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
          {o}
        </button>
      ))}
    </div>
  )
}

// Undo for deletes, in the app's own UI: removing something shows "Removed X" with Undo in a bar at
// the top of the screen for a few seconds. No browser dialogs, no toasts.
type Undoable = { text: string; undo: () => unknown }
let pending: Undoable | null = null
const listeners = new Set<(u: Undoable | null) => void>()
export function offerUndo(text: string, undo: () => unknown) {
  pending = { text, undo }
  listeners.forEach((f) => f(pending))
}
export function UndoBar() {
  const [u, setU] = useState<Undoable | null>(null)
  useLayoutEffect(() => { listeners.add(setU); return () => { listeners.delete(setU) } }, [])
  useEffect(() => {
    if (!u) return
    const t = setTimeout(() => { if (pending === u) pending = null; setU((now) => (now === u ? null : now)) }, 6000)
    return () => clearTimeout(t)
  }, [u])
  if (!u) return null
  return (
    <div role="status" className="mb-4 animate-in fade-in duration-200 motion-reduce:animate-none">
      <div className="flex w-full items-center gap-3 rounded-xl bg-[var(--amber-accent-soft)] py-1.5 pl-4 pr-1.5 text-foreground">
        <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{u.text}</span>
        <button type="button" onClick={async () => { pending = null; setU(null); await u.undo() }} className="h-10 rounded-lg px-3 font-semibold text-primary">Undo</button>
      </div>
    </div>
  )
}

/** A destructive button for the bottom of an edit sheet. */
export function DeleteButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn("mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl font-semibold text-destructive active:opacity-70", className)}>
      {children}
    </button>
  )
}

/** The big title at the top of a screen, with a line under it and an action on the right. */
export function Title({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end gap-3 pb-5 pt-2">
      <div className="min-w-0 flex-1">
        {subtitle && <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{subtitle}</p>}
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  )
}
