"use client";

import { useRef, useState } from "react";
import DownloadLink from "@/app/DownloadLink";
import { copyText } from "@/app/templates/CopyButton";
import { CATEGORIES, START, amountOf, byDay, dayName, editedEvent, iso, money, noteText, totals, type Expense } from "./live-expenses";
import { SITE_EVENT } from "./open-in-app";
import { mailLink, sendLink } from "./platform";
import { APP_STORE_URL, SITE_URL } from "./site";
import s from "./live-expenses.module.css";

/// The Pinto Notes Budget and expenses template, logging expenses live in a blog post (lib/live-expenses.ts says
/// what it's ported from and why). The reader types an amount, what it was and a category, and the expense goes
/// on the list by day while the total and each category add up, each amount typed once. "Copy for Apple Notes"
/// gives them their own log in the post's Math Results format whether or not they install anything. Everything
/// stays in this component's memory: nothing is sent or stored, and a reload starts over. The page renders the
/// Apple Notes template's six expenses, so it is static and nothing moves when it wakes up.
/// Tracking: the first add or delete sends blog_live_template_edited (once per page view); every link and the
/// copy button carry data-cta…, so a tap is a blog_cta_clicked with position "live" (lib/posthog.ts).
export function LiveExpenses({ slug }: { slug: string }) {
  const [list, setList] = useState<Expense[]>(START);
  const [amount, setAmount] = useState("");
  const [what, setWhat] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [copied, setCopied] = useState<"" | "ios" | "mac">("");
  const told = useRef(false);
  const next = useRef(0);

  const edited = () => {
    setCopied("");
    if (told.current) return;
    told.current = true;
    window.dispatchEvent(new CustomEvent(SITE_EVENT, { detail: editedEvent(window.location.pathname, slug) }));
  };
  const value = amountOf(amount);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === null) return;
    edited();
    setList([...list, { id: `n${next.current++}`, date: iso(new Date()), what: what.trim() || category, category, amount: value }]);
    setAmount(""); setWhat("");
  };
  const drop = (id: string) => { edited(); setList(list.filter((x) => x.id !== id)); };
  const copy = async () => {
    const ios = document.documentElement.dataset.platform === "ios";
    const ok = await copyText(noteText(list));
    setCopied(!ok ? "" : ios ? "ios" : "mac");
  };

  const t = totals(list);
  const days = byDay(list);
  const fmt = (n: number) => money(n, "");
  const cta = (action: string) => ({ "data-cta": slug, "data-cta-position": "live", "data-cta-action": action });
  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <section className={s.live} aria-label="Budget and expenses, the Pinto Notes template, to try here" data-live-expenses="">
      <div className={s.bar}>
        <img src="/icon-96.png" alt="" width={22} height={22} />
        <p className={s.barTitle}>Budget and expenses</p>
        <p className={s.barTag}>Pinto Notes template</p>
      </div>

      {/* One column on a phone: add, Keep it (on the first screen), the totals and the list, then the copy.
          From 701 px add, Keep it and the copy sit beside the totals and the list. */}
      <div className={s.app}>
        <form className={s.add} onSubmit={add}>
          <div className={s.secHead}>
            <p className={s.secTitle}>Add an expense</p>
            <p className={s.count} data-testid="live-spent" aria-live="polite">{fmt(t.spent)} spent</p>
          </div>
          <div className={s.fields}>
            <input aria-label="Amount" inputMode="decimal" autoComplete="off" placeholder="0" className={s.amount} value={amount}
              onChange={(e) => setAmount(e.currentTarget.value)} />
            <input aria-label="What" autoComplete="off" placeholder="Weekly shop" className={s.what} value={what}
              onChange={(e) => setWhat(e.currentTarget.value)} />
          </div>
          <div className={s.pills} role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={c === category} className={s.pill} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <button type="submit" className={s.addButton} disabled={value === null}>Add</button>
        </form>

        <div className={s.keep}>
          <DownloadLink className={`${s.primary} pi-apple pi-not-ios`} {...cta("download_mac")}>Keep it in Pinto Notes</DownloadLink>
          <div className={`pi pi-ios ${s.pi}`}>
            <a className={s.primary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" {...cta("app_store")}>Keep it in Pinto Notes</a>
          </div>
          <div className={`pi pi-other ${s.pi}`}>
            <p className={s.fine}><strong>Pinto Notes is for iPhone and Mac.</strong> Send yourself the link to get it there.</p>
            <a className={s.tint} href={mailLink(url)} onClick={(e) => sendLink(navigator, e, url)} {...cta("send_link")}>Send myself the link</a>
          </div>
        </div>

        <div className={s.log}>
          <div className={s.section}>
            <p className={`${s.secTitle} ${s.pad}`}>By category</p>
            <div className={s.group} data-testid="live-by">
              {t.by.map((c) => (
                <div key={c.name} className={s.catRow}>
                  <span>{c.name}</span>
                  <span className={s.num}>{fmt(c.spent)}</span>
                </div>
              ))}
              {!t.by.length && <p className={s.empty}>Nothing spent yet.</p>}
            </div>
          </div>
          <div data-testid="live-list">
            {days.map((d) => (
              <div key={d.date} className={s.section}>
                <p className={`${s.secTitle} ${s.pad}`}>{dayName(d.date)}</p>
                <ul className={s.group}>
                  {d.items.map((e) => (
                    <li key={e.id} className={s.row}>
                      <div className={s.rowText}>
                        <p className={s.rowWhat}>{e.what}</p>
                        <p className={s.rowCat}>{e.category}</p>
                      </div>
                      <span className={s.num}>{fmt(e.amount)}</span>
                      <button type="button" aria-label={`Delete ${e.what}`} className={s.remove} onClick={() => drop(e.id)}><TrashGlyph /></button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!days.length && <p className={s.emptyLog}>Your log is empty. Add an expense above.</p>}
          </div>
        </div>

        <div className={s.copyArea}>
          <button type="button" className={s.copy} onClick={copy} disabled={!list.length} data-event="blog_copy_clicked" {...cta("copy")}>
            {copied ? "Copied" : "Copy for Apple Notes"}
          </button>
          <p className={s.after} aria-live="polite" data-testid="live-after">
            {copied === "ios" ? "Paste into a new note in Apple Notes, then type = at the end of the last line to show the total." : copied === "mac" ? "Paste into a new note. Select the lines from Date down and press the Table button (Format, Table). Then type = at the end of the last line." : ""}
          </p>
          <p className={s.fine}>Pinto Notes is free and shows what&apos;s left in each category&apos;s monthly budget. What you type here stays on this page.</p>
        </div>
      </div>
    </section>
  );
}

// The app's delete icon (lucide Trash2), drawn inline so the page loads no icon set.
const TrashGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" />
  </svg>
);
