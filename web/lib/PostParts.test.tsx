import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Answer, Keep, PasteSteps } from "./PostParts";

const jump = [
  { href: "#a", label: "Which to use" },
  { href: "#b", label: "What exists" },
  { href: "#c", label: "AppleScript and Python" },
];

describe("the short answer's jump links", () => {
  it("keep each dot after its link, so a row that wraps never starts a line with one", () => {
    const html = renderToStaticMarkup(<Answer jump={jump}><p>No.</p></Answer>);
    for (const { label } of jump.slice(0, -1)) expect(html).toMatch(new RegExp(`>${label}</a><span [^>]*aria-hidden="true">·</span></span>`));
    expect(html).toMatch(/>AppleScript and Python<\/a><\/span><\/p>/);
    expect(html).not.toMatch(/jumpItem[^"]*"><span/);
  });
});

// Experiment B39 (24 Nov 2026): on a phone a Markdown template read as code, and the paste steps were for a Mac.
describe("a template to copy", () => {
  const md = "# To-do list\n\n## Today\n- [ ] Pay the electricity bill\n- [ ] Call the dentist\n";

  it("draws a Markdown template as a note too, for phones, and still copies the Markdown", () => {
    const html = renderToStaticMarkup(<Keep title="To-do list for Apple Notes" text={md} />);
    expect(html).toContain("<pre");
    expect(html).toContain("- [ ] Pay the electricity bill");
    // The note: the title, the heading and the items as round checkboxes, without the Markdown marks.
    expect(html).toMatch(/<p class="[^"]*tplTitle[^"]*">To-do list<\/p>/);
    expect(html).toMatch(/<p class="[^"]*tplHeading[^"]*">Today<\/p>/);
    expect(html).toMatch(/<ul class="[^"]*ticks[^"]*"><li>Pay the electricity bill<\/li><li>Call the dentist<\/li><\/ul>/);
    expect(html).toMatch(/class="[^"]*asMarkdown/);
    expect(html).toMatch(/class="[^"]*asNote/);
  });

  it("leaves plain lines and tables as they are", () => {
    for (const text of ["Budget, November\n\nIncome = 3200\nRent = 1200\n", "Mood log\n\nDate\tMood\n4 Nov\t4\n"]) {
      const html = renderToStaticMarkup(<Keep title="t" text={text} />);
      expect(html).not.toMatch(/asNote|asMarkdown/);
    }
  });

  it("gives the Mac steps everywhere but an iPhone, and the iPhone steps everywhere but a Mac", () => {
    const html = renderToStaticMarkup(<PasteSteps />);
    expect(html).toMatch(/<span class="[^"]*pi-not-ios">On a Mac, paste it into a new note with Edit, Paste as Markdown\./);
    expect(html).toMatch(/<span class="[^"]*pi-not-mac">On iPhone, Notes pastes it as plain text/);
    expect(html).toContain("select them and tap the checklist button");
    expect(html).not.toMatch(/[\u2013\u2014]/);
  });
});
