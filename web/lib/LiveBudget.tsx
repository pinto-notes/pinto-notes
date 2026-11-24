"use client";

import { useRef, useState } from "react";
import DownloadLink from "@/app/DownloadLink";
import { START_INCOME, START_LINES, editedEvent, money, plan, type Line } from "./live-budget";
import { SITE_EVENT } from "./open-in-app";
import { mailLink, sendLink } from "./platform";
import { APP_STORE_URL, SITE_URL } from "./site";
import s from "./live-budget.module.css";

/// The Pinto Notes budget template, live in a blog post (lib/live-budget.ts says what it's ported
/// from and why). The reader types their income and what each thing gets a month and sees what's
/// left, as the app's first screen and its Month card show it. Everything stays in this component's
/// memory: nothing is sent or stored, and a reload starts over. The page renders it with the
/// template's own numbers, so it is static and nothing moves when it wakes up.
/// Tracking: the first change sends blog_live_template_edited (once per page view); every link in the
/// keep area carries data-cta…, so a tap is a blog_cta_clicked with position "live" (lib/posthog.ts),
/// next to the download card's "answer" clicks.
export function LiveBudget({ slug }: { slug: string }) {
  const [income, setIncome] = useState(START_INCOME);
  const [lines, setLines] = useState<Line[]>(START_LINES);
  const [currency, setCurrency] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const told = useRef(false);

  const edited = () => {
    if (told.current) return;
    told.current = true;
    window.dispatchEvent(new CustomEvent(SITE_EVENT, { detail: editedEvent(window.location.pathname, slug) }));
  };
  const change = (key: number, patch: Partial<Line>) => { edited(); setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l))); };
  const typed = name.trim();
  const has = (n: string) => lines.some((l) => l.name.trim().toLowerCase() === n.toLowerCase());
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed || has(typed)) return;
    edited();
    setLines([...lines, { key: Math.max(-1, ...lines.map((l) => l.key)) + 1, name: typed, amount }]);
    setName(""); setAmount("");
  };

  const p = plan(income, lines);
  const cur = currency.trim();
  const fmt = (n: number) => money(n, cur);
  const over = p.left < 0;
  const cta = (action: string) => ({ "data-cta": slug, "data-cta-position": "live", "data-cta-action": action });
  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <section className={s.live} aria-label="Budget and expenses, the Pinto Notes template, to try here" data-live-budget="">
      <div className={s.bar}>
        <img src="/icon-96.png" alt="" width={22} height={22} />
        <p className={s.barTitle}>Budget and expenses</p>
        <p className={s.barTag}>Pinto Notes template</p>
      </div>

      {/* Two columns from 700 px, as the app's Month and Budget screens: what's left and Keep it, then the form. */}
      <div className={s.app}>
        <div className={s.summary}>
          <div className={s.card}>
            <p className={s.label}>{!p.income ? "Planned each month" : over ? "Over your income" : "Left each month"}</p>
            <p className={s.big} data-over={over || undefined} data-testid="live-left" aria-live="polite">{fmt(p.income ? Math.abs(p.left) : p.planned)}</p>
            <div className={s.track} role="progressbar" aria-label="Planned of income" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, p.share) * 100)}>
              <div className={s.fill} data-over={over || undefined} style={{ width: `${Math.min(1, p.share) * 100}%` }} />
            </div>
            <p className={s.line} data-testid="live-line">
              {p.income ? <>{fmt(p.planned)} planned of {fmt(p.income)} income</> : <>Put in your income to see what&apos;s left.</>}
            </p>
          </div>

          <div className={s.keep}>
            <DownloadLink className={`${s.primary} pi-apple pi-not-ios`} {...cta("download_mac")}>Keep it in Pinto Notes</DownloadLink>
            <div className={`pi pi-ios ${s.pi}`}>
              <a className={s.primary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" {...cta("app_store")}>Keep it in Pinto Notes</a>
            </div>
            <div className={`pi pi-other ${s.pi}`}>
              <p className={s.fine}><strong>Pinto Notes is for iPhone and Mac.</strong> Send yourself the link to get it there.</p>
              <a className={s.tint} href={mailLink(url)} onClick={(e) => sendLink(navigator, e, url)} {...cta("send_link")}>Send myself the link</a>
            </div>
            <p className={s.fine}>
              Free. Your numbers stay on this page and aren&apos;t sent anywhere, so in the app you type them in once.
            </p>
          </div>
        </div>

        <div className={s.form}>
          <div className={s.section}>
            <p className={s.secTitle}>Income</p>
            <div className={s.group}>
              <label className={s.row}>
                <span className={s.rowName}>Income a month</span>
                <input aria-label="Income a month" inputMode="decimal" placeholder="0" className={s.amount} value={income}
                  onChange={(e) => { edited(); setIncome(e.currentTarget.value); }} />
              </label>
            </div>
          </div>

          <div className={s.section}>
            <div className={s.secHead}>
              <p className={s.secTitle}>Each month</p>
              <label className={s.currency}>Currency
                <input aria-label="Currency" placeholder="$, €, kr" className={s.currencyInput} value={currency}
                  onChange={(e) => { edited(); setCurrency(e.currentTarget.value.slice(0, 4)); }} />
              </label>
            </div>
            <div className={s.group}>
              {lines.map((l) => (
                <div key={l.key} className={s.row}>
                  <input aria-label={`Name of ${l.name || "category"}`} value={l.name} className={s.name}
                    onChange={(e) => change(l.key, { name: e.currentTarget.value })} />
                  <input aria-label={`${l.name || "Category"} a month`} inputMode="decimal" placeholder="0" value={l.amount} className={s.amount}
                    onChange={(e) => change(l.key, { amount: e.currentTarget.value })} />
                  <button type="button" aria-label={`Remove ${l.name || "category"}`} className={s.remove}
                    onClick={() => { edited(); setLines(lines.filter((x) => x.key !== l.key)); }}><TrashGlyph /></button>
                </div>
              ))}
              <form onSubmit={add} className={s.row}>
                <input aria-label="New category" placeholder="Add your own" className={s.field} value={name} onChange={(e) => setName(e.currentTarget.value)} />
                <input aria-label="New category a month" inputMode="decimal" placeholder="0" className={s.amount} value={amount} onChange={(e) => setAmount(e.currentTarget.value)} />
                <button type="submit" aria-label="Add category" disabled={!typed} className={s.add}><PlusGlyph /></button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// The app's icons (lucide Trash2 and Plus), drawn inline so the page loads no icon set.
const TrashGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" />
  </svg>
);
const PlusGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);
