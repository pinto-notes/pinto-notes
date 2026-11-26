"use client";

import { useRef, useState } from "react";
import DownloadLink from "@/app/DownloadLink";
import { copyText } from "@/app/templates/CopyButton";
import { DISHES, START_WEEK, DAYS, editedEvent, groceryList, noteText, plannedMonday, toggle } from "./live-meal-plan";
import { SITE_EVENT } from "./open-in-app";
import { mailLink, sendLink } from "./platform";
import { APP_STORE_URL, SITE_URL } from "./site";
import s from "./live-meal-plan.module.css";

/// The Pinto Notes meal plan template, live in a blog post (lib/live-meal-plan.ts says what it's ported
/// from and why). The reader taps dinners, a dinner a day, and the grocery list builds itself by aisle,
/// one line per thing, less what's always in the cupboard. "Copy for Apple Notes" gives them the week
/// as a note whether or not they install anything: plain lines on an iPhone, where Notes pastes a web
/// page's text as it is, and Markdown elsewhere, for the Mac's Edit, Paste as Markdown. Everything stays
/// in this component's memory: nothing is sent or stored, and a reload starts over. The page renders
/// the template's own first four dinners, so it is static and nothing moves when it wakes up.
/// Tracking: the first change sends blog_live_template_edited (once per page view); every link and the
/// copy button carry data-cta…, so a tap is a blog_cta_clicked with position "live" (lib/posthog.ts).
export function LiveMealPlan({ slug }: { slug: string }) {
  const [week, setWeek] = useState<(string | null)[]>(START_WEEK);
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState<"" | "ios" | "mac">("");
  const told = useRef(false);

  const tap = (id: string) => {
    if (!told.current) {
      told.current = true;
      window.dispatchEvent(new CustomEvent(SITE_EVENT, { detail: editedEvent(window.location.pathname, slug) }));
    }
    const next = toggle(week, id);
    setFull(next === week);
    setWeek(next);
    setCopied("");
  };
  const copy = async () => {
    const ios = document.documentElement.dataset.platform === "ios";
    const ok = await copyText(noteText(week, plannedMonday(new Date()), ios ? "plain" : "markdown"));
    setCopied(!ok ? "" : ios ? "ios" : "mac");
  };

  const list = groceryList(week);
  const planned = week.filter(Boolean).length;
  const cta = (action: string) => ({ "data-cta": slug, "data-cta-position": "live", "data-cta-action": action });
  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <section className={s.live} aria-label="Meal plan and groceries, the Pinto Notes template, to try here" data-live-meal-plan="">
      <div className={s.bar}>
        <img src="/icon-96.png" alt="" width={22} height={22} />
        <p className={s.barTitle}>Meal plan and groceries</p>
        <p className={s.barTag}>Pinto Notes template</p>
      </div>

      <div className={s.app}>
        <div className={s.section}>
          <div className={s.secHead}>
            <p className={s.secTitle}>Dinners this week</p>
            <p className={s.count} data-testid="live-planned">{planned} of 7</p>
          </div>
          <p className={s.hint}>Tap dinners to add or remove them, up to seven.</p>
          <ul className={s.dishes}>
            {DISHES.map((d) => {
              const day = week.indexOf(d.id);
              return (
                <li key={d.id}>
                  <button type="button" className={s.dish} aria-pressed={day >= 0} onClick={() => tap(d.id)} data-dish={d.short} title={d.dish}>
                    <span className={s.day} aria-hidden="true">{day >= 0 ? DAYS[day].slice(0, 3) : "+"}</span>
                    <span>{d.short}</span>
                    {day >= 0 && <span className={s.sr}>, {DAYS[day]}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {full && <p className={s.full} role="status">Your seven days are full. Remove a dinner to add another.</p>}
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
        </div>

        <div className={s.section}>
          <div className={s.secHead}>
            <p className={s.secTitle}>Grocery list</p>
            <p className={s.count} data-testid="live-count" aria-live="polite">{list.count} to buy</p>
          </div>
          <div className={s.group} data-testid="live-list">
            {list.aisles.length === 0 && <p className={s.empty}>Pick a dinner to start your grocery list.</p>}
            {list.aisles.map((a) => (
              <div key={a.name} className={s.aisle}>
                <p className={s.aisleName}>{a.name}</p>
                <ul className={s.items}>
                  {a.items.map((g) => (
                    <li key={g.key} className={s.item}>
                      <span className={s.box} aria-hidden="true" />
                      {g.name}
                      {g.for.length > 1 && <span className={s.for}> · {g.for.length} dinners</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {list.leftOut.length > 0 && <p className={s.leftOut} data-testid="live-left-out">Left off, already in the cupboard: {list.leftOut.join(", ")}</p>}
        </div>

        <div className={s.copyArea}>
          <button type="button" className={s.copy} onClick={copy} disabled={!planned} data-event="blog_copy_clicked" {...cta("copy")}>
            {copied ? "Copied" : "Copy for Apple Notes"}
          </button>
          <p className={s.after} aria-live="polite" data-testid="live-after">
            {copied === "ios" ? "Paste in Notes, select the grocery lines, then tap the checklist button."
              : copied === "mac" ? "In Notes, choose Edit, then Paste as Markdown." : ""}
          </p>
          <p className={s.fine}>
            Each week, Pinto Notes makes your grocery list from your dinners. Tick things off in the shop and they drop to the bottom of their aisle. The app is free; your picks stay on this page and don&apos;t carry into it.
          </p>
        </div>
      </div>
    </section>
  );
}
