"use client";

import { mailLink, sendLink } from "@/lib/platform";

/** "Send myself the link", off Apple devices: the share sheet where there is one, else an email. */
export function MailLink({ url, children }: { url: string; children: React.ReactNode }) {
  return <a href={mailLink(url)} onClick={(e) => sendLink(navigator, e, url)}>{children}</a>;
}
