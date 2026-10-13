import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "../../home.module.css";
import HomeA from "../A";
import HomeB from "../B";
import HomeC from "../C";

// Three directions for the home page, each at the home page's own address with ?v=a, ?v=b or ?v=c
// (a rewrite in next.config.ts). Never in search; the page without ?v= is unchanged until one is picked.
const PAGES = { a: HomeA, b: HomeB, c: HomeC } as const;
type V = keyof typeof PAGES;

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(PAGES).map((v) => ({ v }));

export const metadata: Metadata = {
  title: "Pinto Notes: one notes app for every AI you use",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: "/" },
};

export default async function HomeDirection({ params }: { params: Promise<{ v: string }> }) {
  const { v } = await params;
  const Page = PAGES[v as V];
  if (!Page) notFound();
  // data-home-v: the header drops its version and star count on these pages (site.css).
  return <div className={styles.main} data-home-v={v}><Page /></div>;
}
