import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pictureBody } from "./template-picture-body.mjs";
import { moreTemplates, picture, templatePage } from "./template-pages";
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
    const words = [p.subtitle, p.about, p.ask.prompt, p.ask.step, ...p.slides.flatMap((s) => [s.label, s.you, s.ai, s.note, s.alt, s.before?.alt])].filter((w): w is string => Boolean(w));

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

    it(`${t.slug}: 2 or 3 slides of short chats (4 for the habit tracker, as approved), ending on doing it yourself`, () => {
      expect(p.slides.length).toBeGreaterThanOrEqual(2);
      expect(p.slides.length).toBeLessThanOrEqual(t.slug === "habit-tracker" ? 4 : 3);
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
      const [first, second] = p.slides;
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

  it("lists four more templates, never the page's own", () => {
    for (const t of templates()) {
      const more = moreTemplates(t);
      expect(more).toHaveLength(4);
      expect(more.map((m) => m.slug)).not.toContain(t.slug);
      expect(new Set(more.map((m) => m.slug)).size).toBe(4);
    }
  });
});
