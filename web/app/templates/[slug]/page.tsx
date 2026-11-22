import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHATGPT_PLUGIN_URL, CLAUDE_DIRECTORY_URL } from "@/lib/facts";
import { pageMetadata } from "@/lib/site";
import { JsonLd, breadcrumbs, faqPage, maker, organization, templateHowTo, templateWork } from "@/lib/structured-data";
import { templateSeo } from "@/lib/template-seo";
import { COVERS, coverPath } from "@/lib/template-covers";
import { BYLINE, INSTALLS, copiedPrompt, heading, moreTemplates, named, templatePage, updatedMonth } from "@/lib/template-pages";
import { appLink, authorLink, searchTitle, template, templates, templatePath, usePath, type Template } from "@/lib/templates";
import OpenInApp from "../../OpenInApp";
import CopyButton from "../CopyButton";
import Slides from "./Slides";
import s from "./d.module.css";

export const dynamic = "force-static";
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return templates().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = template((await params).slug);
  if (!t) return {};
  return pageMetadata({ title: searchTitle(t), shareTitle: `${t.title}: a template your AI fills in`, description: t.description, path: `/templates/${t.slug}`, image: { url: `/templates/${t.slug}/opengraph-image`, alt: `The ${t.title.toLowerCase()} template for Pinto Notes` } });
}


/// How to get it, for the page and its HowTo data.
const steps = (t: Template) => {
  const page = templatePage(t.slug);
  return [
    { name: "Get Pinto Notes", text: "Pinto Notes is free on Mac and iPhone." },
    { name: "Connect your AI", text: "Connect ChatGPT or Claude to Pinto Notes once, from its listing in ChatGPT's plugins or Claude's connector directory." },
    { name: page.ask.step, text: `Paste the prompt into a chat. Your AI adds the ${named(t)} template to Pinto Notes, then fills it in as you talk.` },
  ];
};

export default async function Page({ params }: Props) {
  const t = template((await params).slug);
  if (!t) notFound();
  const page = templatePage(t.slug);
  const seo = templateSeo(t.slug);
  const more = moreTemplates(t);
  const how = steps(t);
  const get = (className: string, auto = false) => (
    <OpenInApp auto={auto} className={className} href={usePath(t.slug)} app={appLink(t.slug)} label={`Get template: ${t.title}`} template={named(t)}>Get template</OpenInApp>
  );
  return (
    <div className={s.page}>
      <JsonLd graph={[
        breadcrumbs([{ name: "Templates", path: "/templates" }, { name: t.title, path: `/templates/${t.slug}` }]),
        templateWork(t), templateHowTo(t, how), organization, maker,
        ...(seo ? [faqPage(seo.faq, `/templates/${t.slug}`)] : []),
      ]} />
      <ol className={s.crumbs} aria-label="Breadcrumb">
        <li><a href="/templates">Templates</a></li>
        <li aria-current="page">{t.title}</li>
      </ol>
      <div className={s.head}>
        <header>
          <h1 className={s.title}>{heading(t)}</h1>
          <p className={s.by}>By <b>Pinto Notes</b> · {BYLINE}</p>
          <p className={s.pitch}>{page.subtitle}</p>
        </header>
        <div className={s.cta}>{get(s.btn, true)}<small>{INSTALLS}</small></div>
      </div>

      <div className={s.main}>
        <Slides slug={t.slug} slides={page.slides} note={!t.app} />
        <aside className={s.side}>
          <h2>About this template</h2>
          <p>{page.about}</p>
          <dl className={s.facts}>
            <dt>Works with</dt><dd>ChatGPT, Claude</dd>
            <dt>Runs on</dt><dd>Mac, iPhone</dd>
            <dt>Price</dt><dd>Free</dd>
            <dt>Updated</dt><dd>{updatedMonth(t)}</dd>
            {t.author && <><dt>Made by</dt><dd><a href={authorLink(t.author)}>@{t.author}</a></dd></>}
          </dl>
        </aside>
      </div>

      <section className={s.how} aria-labelledby="how-title" id="how">
        <h2 id="how-title" className={s.h2}>How to get it</h2>
        <ol className={s.steps}>
          <li id="step-1">
            <b>{how[0].name}</b>
            <span className={s.links}><a href="/download">Mac or iPhone</a></span>
          </li>
          <li id="step-2">
            <b>{how[1].name}</b>
            <span className={s.links}>
              <a href={CHATGPT_PLUGIN_URL} target="_blank" rel="noopener">Connect ChatGPT</a>
              <a href={CLAUDE_DIRECTORY_URL} target="_blank" rel="noopener">Connect Claude</a>
              <a href="/open/connect-ai">How to connect</a>
            </span>
          </li>
          <li id="step-3">
            <b>{how[2].name}</b>
            <div className={s.prompt}>
              <p>{page.ask.prompt}</p>
              <CopyButton className={s.copy} text={copiedPrompt(t, page)} label="Copy" event="template_prompt_copied" />
            </div>
            <p className={s.fine}>Copy adds the full instructions for the {named(t)} template, so your AI makes this one.</p>
          </li>
        </ol>
      </section>

      {seo && (
        <section className={s.how} aria-labelledby="questions">
          <h2 id="questions" className={s.h2}>Questions</h2>
          <dl className={s.faq}>
            {seo.faq.map((f) => <div key={f.q}><dt>{f.q}</dt>{f.a.map((a) => <dd key={a}>{a}</dd>)}</div>)}
            {seo.post && <div><dt>Would you rather build your own?</dt><dd><a href={`/blog/${seo.post.slug}`}>{seo.post.title}</a> shows both ways.</dd></div>}
          </dl>
        </section>
      )}

      <section className={s.more} aria-labelledby="more">
        <h2 id="more" className={s.h2}>More templates</h2>
        <ul className={s.cards}>
          {more.map((m) => (
            <li key={m.slug}>
              <a className={s.card} href={templatePath(m.slug)}>
                <img src={coverPath(m.slug)} alt={COVERS[m.slug].alt} width={800} height={800} loading="lazy" decoding="async" />
                <b><span>{m.title}</span><i>Free</i></b>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className={s.dock}>
        <div><b>{t.title}</b><br /><small>Installs Pinto Notes, free</small></div>
        {get(s.btn)}
      </div>
    </div>
  );
}
