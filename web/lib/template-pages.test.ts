import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pictureBody } from "./template-picture-body.mjs";
import { experimentalLine, moreTemplates, picture, templatePage } from "./template-pages";
import { templateFiles, templates } from "./templates";

/// The words and pictures of each template's page (content/template-pages/<slug>.json, layout D).
describe("a template's page data", () => {
  it("has a page for every template, and none for a template that isn't there", () => {
    const pages = new Set(templates().map((t) => t.slug));
    expect(pages).toEqual(new Set(templateFiles()));
    for (const t of templates()) expect(() => templatePage(t.slug), t.slug).not.toThrow();
  });

  for (const t of templates()) {
    const p = templatePage(t.slug);
    // Everything a visitor reads on the page that comes from this file.
    const words = [p.subtitle, p.about, p.ask.prompt, p.ask.step, ...(p.experimental ? [experimentalLine(p.experimental)] : []), ...p.slides.flatMap((s) => [s.label, s.you, s.ai, s.note, s.alt, s.before?.alt])].filter((w): w is string => Boolean(w));

    it(`${t.slug}: writes plainly, names neither AI, and is only about Pinto`, () => {
      for (const w of words) {
        // ChatGPT and Claude are named in the title and the facts line only.
        expect(w, w).not.toMatch(/ChatGPT|Claude/);
        expect(w, w).not.toMatch(/[–—]/);
        expect(w, w).not.toMatch(/iPad|Apple Notes|Incredible/);
      }
      // About: two sentences.
      expect(p.about.split(/(?<=\.)\s+/).length, p.about).toBe(2);
    });

    // A page that leads with covers or the gallery has that slide first, before its chats.
    const lead = p.experimental ? 1 : 0;
    const talk = p.slides.slice(lead);

    it(`${t.slug}: 2 or 3 slides of short chats (4 for the habit tracker, as approved; one more before them for covers), ending on doing it yourself`, () => {
      expect(talk.length).toBeGreaterThanOrEqual(2);
      expect(talk.length).toBeLessThanOrEqual(t.slug === "habit-tracker" ? 4 : 3);
      const chats = p.slides.filter((s) => s.you);
      expect(chats.length).toBeGreaterThanOrEqual(1);
      for (const s of chats) {
        expect(s.ai, s.you).toBeTruthy();
        expect(s.you!.length + s.ai!.length, s.you).toBeLessThanOrEqual(190);
      }
      expect(p.slides.at(-1)!.note).toMatch(/^Or .* yourself\.$/);
    });

    it(`${t.slug}: every picture is on disk`, () => {
      for (const s of p.slides) {
        for (const name of [s.mac, s.phone, s.before?.mac, s.before?.phone].filter((n): n is string => Boolean(n))) {
          expect(existsSync(path.join(process.cwd(), "public", picture(t.slug, name))), `${t.slug}/${name}`).toBe(true);
        }
      }
    });

    // A plain note's pictures are the template drawn by the apps, at a step of its demo calls (or
    // as it starts), scrolled to a heading that is really in the note drawn.
    it.runIf(!t.app)(`${t.slug}: draws only what the template holds, and each slide shows a picture it draws`, () => {
      expect(p.pictures).toBeTruthy();
      // All the demo calls make the example, so a picture at a step is the note on its way there.
      expect(pictureBody(t, { of: "example" }).trim()).toBe(t.example.trim());
      for (const [name, pic] of Object.entries(p.pictures!)) {
        expect(name, name).toMatch(/^(mac|phone)-/);
        const md = pictureBody(t, pic);
        // A heading, or a bold label on a line of its own.
        const heading = (l: string) => l.replace(/^#+\s*/, "").replace(/^\*\*(.*)\*\*$/, "$1");
        if (pic.from) expect(md.split("\n").some((l) => heading(l) === pic.from), `${name}: ${pic.from}`).toBe(true);
      }
      for (const s of p.slides) for (const n of [s.mac, s.phone].filter(Boolean)) expect(Object.keys(p.pictures!), n).toContain(n);
      // The slide that talks about a section shows that section (in the note that slide draws).
      const [first, second] = talk;
      const from = p.pictures![second.phone].from;
      expect(from && pictureBody(t, p.pictures![second.phone]).includes(from), second.phone).toBeTruthy();
      // A reply that says something changed shows the change: the note under it isn't the one the
      // slide before showed (a question changes nothing, so both can show the same note; nor does a
      // reply that only asks, as when "Quiz me" is answered with the first cue).
      if (!second.you!.trim().endsWith("?") && !second.ai!.trim().endsWith("?")) {
        expect(pictureBody(t, p.pictures![second.phone]), `${t.slug}: slide 2 shows the change`).not.toBe(pictureBody(t, p.pictures![first.mac!]));
        expect(pictureBody(t, p.pictures![second.phone]), `${t.slug}: slide 2 shows the change`).not.toBe(pictureBody(t, p.pictures![first.phone]));
      }
    });

    // A page about talking to your AI draws the note as each real chat left it (saved from the
    // local stack): still the template's note, every section of it there, and filled in by the chat.
    const saved = Object.entries(p.pictures ?? {}).filter(([, pic]) => pic.saved);
    it.runIf(saved.length > 0)(`${t.slug}: a saved picture is the template's note as a chat left it`, () => {
      const sections = t.note.split("\n").filter((l) => /^## /.test(l));
      for (const [name, pic] of saved) {
        const md = pictureBody(t, pic);
        for (const h of sections) expect(md.split("\n"), `${name}: ${h}`).toContain(h);
        expect(md.trim(), name).not.toBe(t.note.trim());
      }
      // Each chat slide draws the note after its own chat: the first chat's note, then a later one.
      const chats = p.slides.filter((sl) => sl.you);
      chats.forEach((sl, k) => {
        for (const n of [sl.mac, sl.phone].filter((x): x is string => Boolean(x))) expect(p.pictures![n].saved, `${sl.label}: ${n}`).toBe(`after-chat${k + 1}`);
      });
    });
  }

  // Covers and the gallery view (Emil, 22 November 2026): experiments in the app, shown on the site
  // with where to turn them on. The first slide is the template's own notes drawn with covers, a
  // folder of them in the gallery where the page says so, and no other slide uses them.
  for (const t of templates().filter((x) => templatePage(x.slug).experimental)) {
    const p = templatePage(t.slug);
    it(`${t.slug}: leads with its notes drawn with covers, and says where to turn them on`, () => {
      const [first, ...rest] = p.slides;
      expect(first.you, "the covers slide is pictures, not a chat").toBeUndefined();
      expect(first.mac && first.phone).toBeTruthy();
      const mac = p.pictures![first.mac!], phone = p.pictures![first.phone];
      const cards = mac.gallery?.notes ?? [mac];
      expect(Boolean(mac.gallery), t.slug).toBe(p.experimental!.includes("gallery"));
      if (mac.gallery) expect(cards.length).toBeGreaterThanOrEqual(2);
      for (const pic of [...cards, phone]) {
        expect(pic.cover, JSON.stringify(pic)).toBeTruthy();
        expect(pic.icon, JSON.stringify(pic)).toMatch(/^\p{Extended_Pictographic}$/u);
      }
      // The cards are the template's notes (or, in a shared folder, another template's), each with its own cover.
      for (const c of cards) {
        const of = c.template ? templates().find((x) => x.slug === c.template)! : t;
        expect(pictureBody(of, c).startsWith(`${c.icon} `)).toBe(true);
        expect(pictureBody(of, { ...c, icon: undefined }).split("\n")[0], JSON.stringify(c)).toMatch(/^[A-Z]/);
      }
      expect(new Set(cards.map((c) => c.cover)).size).toBe(cards.length);
      for (const s of rest) for (const n of [s.mac, s.phone].filter((x): x is string => Boolean(x))) {
        expect(p.pictures![n].cover ?? p.pictures![n].gallery, `${s.label}: ${n}`).toBeUndefined();
      }
      expect(experimentalLine(p.experimental!)).toMatch(/Settings › Experimental/);
      expect(experimentalLine(p.experimental!)).toContain("Covers and icons");
      if (p.experimental!.includes("gallery")) expect(experimentalLine(p.experimental!)).toContain("Gallery view");
    });
  }

  it("lists four more templates, never the page's own", () => {
    for (const t of templates()) {
      const more = moreTemplates(t);
      expect(more).toHaveLength(4);
      expect(more.map((m) => m.slug)).not.toContain(t.slug);
      expect(new Set(more.map((m) => m.slug)).size).toBe(4);
    }
  });
});
