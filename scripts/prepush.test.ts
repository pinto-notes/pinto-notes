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

Deno.test("source text and comments cannot nest later suites or invent tests", async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/scripts/ci`, { recursive: true });
    await Deno.mkdir(`${root}/PaneTests`);
    await Deno.copyFile(new URL("./ci/select-tests.py", import.meta.url), `${root}/scripts/ci/select-tests.py`);
    await Deno.writeTextFile(`${root}/PaneTests/Fixture.swift`, [
      "extension ExistingTests {",
      "    // An unmatched brace in a comment: {",
      "    /* Nested comments: /* { */ { */",
      '    let source = "private var body: some View {"',
      '    let raw = #"a quote \\" and a brace {"#',
      String.raw`    let interpolated = "prefix \(f("}")) suffix"`,
      String.raw`    let nested = "prefix \(f("nested \(g("}"))")) suffix"`,
      String.raw`    let rawInterpolation = #"prefix \#(f("}")) suffix"#`,
      String.raw`    let commented = "prefix \(f(/* ) } */ "}")) suffix"`,
      '    let multiline = """',
      "@Suite struct FakeTests { @Test func fake() {}",
      '"""',
      "    @Test func real() {}",
      "}",
      "@Suite struct LaterTests { @Test func real() {} }",
      "extension Container {",
      "    @Suite struct NestedTests { @Test func real() {} }",
      "}",
    ].join("\n"));
    const out = await new Deno.Command("python3", {
      args: [`${root}/scripts/ci/select-tests.py`, "--suites-of", "PaneTests/Fixture.swift"],
    }).output();
    assertEquals(out.code, 0);
    assertEquals(new TextDecoder().decode(out.stdout).trim().split("\t")[1].split(" ").sort(),
      ["PaneTests/Container/NestedTests", "PaneTests/ExistingTests", "PaneTests/LaterTests"]);
  } finally { await Deno.remove(root, { recursive: true }); }
});

Deno.test("Settings extension and later suites all have runnable paths", async () => {
  const [line] = await suitesOf("PaneTests/SettingsHomeTests.swift");
  assertEquals(line.split("\t")[1].split(" ").sort(), [
    "PaneTests/AccountPagesTests", "PaneTests/GeneralSettingsTests",
    "PaneTests/SettingsHomeTests", "PaneTests/SettingsPageRowTests",
  ]);
});
