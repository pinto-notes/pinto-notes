// Which changes make scripts/prepush.sh run the site's template tests and the catalog check (its
// --touches-templates mode). Run: deno test -A scripts/prepush.test.ts
import { assertEquals } from "jsr:@std/assert@1";

const script = new URL("./prepush.sh", import.meta.url).pathname;

async function touches(files: string[]): Promise<string> {
  const out = await new Deno.Command("zsh", { args: [script, "--touches-templates", ...files] }).output();
  return new TextDecoder().decode(out.stdout).trim();
}

// On 2026-11-09 a change to all 23 templates ran no template test: the patterns were matched
// against the whole list as one string, so only its first file counted.
Deno.test("a template counts wherever it is in the list of changed files", async () => {
  const others = ["Pane.xcodeproj/project.pbxproj", "Pane/Views/RootView.swift", "PaneTests/SetupCardsTests.swift"];
  assertEquals(await touches([...others, "web/content/templates/book-notes.json"]), "yes");
  assertEquals(await touches(["web/content/templates/book-notes.json", ...others]), "yes");
  assertEquals(await touches([others[0], "web/content/templates/habit-tracker.app/src/screens/today.tsx", others[1]]), "yes");
});

Deno.test("the templates' code and the app's copy count too", async () => {
  assertEquals(await touches(["Pane/Views/RootView.swift", "web/lib/templates.ts"]), "yes");
  assertEquals(await touches(["Pane/Views/RootView.swift", "web/lib/template-catalog.test.ts"]), "yes");
  assertEquals(await touches(["Pane/Views/RootView.swift", "Pane/Resources/Templates/catalog.json"]), "yes");
  assertEquals(await touches(["Pane/Views/RootView.swift", "Pane/Resources/Templates/template-stage.css"]), "yes");
});

Deno.test("a change with no template in it doesn't", async () => {
  assertEquals(await touches(["Pane/Views/TemplateLibrary.swift", "web/lib/other.ts", "web/content/blog/post.md"]), "no");
  assertEquals(await touches([]), "no");
});

// --tests runs the suites of the touched test files by the names select-tests.py gives them: since
// the tests are four targets (project.yml), each name says its target.
async function suitesOf(...files: string[]): Promise<string[]> {
  const select = new URL("./ci/select-tests.py", import.meta.url).pathname;
  const out = await new Deno.Command("python3", { args: [select, "--suites-of", ...files] }).output();
  return new TextDecoder().decode(out.stdout).split("\n").filter((l) => l !== "");
}

Deno.test("a touched test file's suites are named in their own target", async () => {
  assertEquals(await suitesOf("PaneTests/AmberButtonTests.swift"), ["PaneTests/AmberButtonTests.swift\tPaneTests/AmberButtonTests"]);
  assertEquals(await suitesOf("PaneTests/HIG/ChromeSnapshots.swift"), ["PaneTests/HIG/ChromeSnapshots.swift\tPaneHIGTests/ChromeSnapshots"]);
  assertEquals(await suitesOf("PaneTests/Network/SyncFaultTests.swift"), ["PaneTests/Network/SyncFaultTests.swift\tPaneSystemTests/NetworkFaults/SyncFaultTests"]);
  const [line] = await suitesOf("PaneTests/Interaction/ChecklistInteractionTests.swift");
  assertEquals(line.split("\t")[1].split(" ")[0], "PaneInteractionTests/ChecklistInteractionTests");
});
