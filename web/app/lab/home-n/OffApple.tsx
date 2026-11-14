"use client";

import { SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import x from "../../_home/hero.module.css";

/** Off Apple (Windows, Android, Linux): what Pinto runs on, and a way to send yourself the link. */
export function OffApple() {
  return (
    <p className={`${x.fine} ${x.offApple}`} data-off-apple>
      Pinto Notes is for iPhone and Mac.{" "}
      <a href={mailLink(SITE_URL)} onClick={(ev) => sendLink(navigator, ev, SITE_URL)}>Send myself the link</a>
    </p>
  );
}
