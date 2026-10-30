// What scripts/qa-test.sh prints after a run (its --summarize mode, on a made-up log with the lines
// real runs have). Run: deno test -A scripts/qa-test.test.ts
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";

const script = new URL("./qa-test.sh", import.meta.url).pathname;

async function summarize(log: string): Promise<string[]> {
  const file = await Deno.makeTempFile({ suffix: ".log" });
  await Deno.writeTextFile(file, log);
  const out = await new Deno.Command("zsh", { args: [script, "--summarize", file] }).output();
  await Deno.remove(file);
  return new TextDecoder().decode(out.stdout).split("\n").filter((l) => l !== "");
}

// WebKit's logging in a passing run: timestamped lines that say "error:", and their continuations.
const webkit = `2026-10-30 20:26:13.395124+0100 Pane[46599:106629121] [general] WebContent[46716] Connection to 'pboard' server had an error: <dictionary: 0x1f286d560> { count = 1, contents =
\t"XPCErrorDescription" => <string: 0x1f286d6a0> { string cache = 0x0, length = 18, contents = "Connection invalid" }
}
Invalidation reason: Connection init failed at lookup with error 159 - Sandbox restriction
`;
const passed = `◇ Test run started.
◇ Suite NotePageTests started.
${webkit.repeat(30)}✔ Test everyPageGetsTheAppsThemeAsVariables() passed after 0.215 seconds.
✔ Suite NotePageTests passed after 34.448 seconds.
✔ Test run with 66 tests in 1 suite passed after 34.448 seconds.

** TEST SUCCEEDED **
`;

Deno.test("a passing run prints only its result, whatever WebKit logs", async () => {
  assertEquals(await summarize(passed), [
    "✔ Test run with 66 tests in 1 suite passed after 34.448 seconds.",
    "** TEST SUCCEEDED **",
  ]);
});

Deno.test("a failing run names what failed, then its result", async () => {
  const failed = `${webkit}✘ Test aSave() recorded an issue at WindowUpdateTests.swift:284:9: Expectation failed: 156 <= 72
✘ Test aSave() failed after 4.963 seconds with 1 issue.
${webkit}✘ Test run with 1 test in 1 suite failed after 4.964 seconds with 1 issue.

** TEST FAILED **
`;
  const out = await summarize(failed);
  assertStringIncludes(out[0], "WindowUpdateTests.swift:284:9: Expectation failed");
  assertEquals(out.slice(-2), ["✘ Test run with 1 test in 1 suite failed after 4.964 seconds with 1 issue.", "** TEST FAILED **"]);
  assertEquals(out.filter((l) => l.includes("XPC") || l.includes("pboard")), []);
});

Deno.test("a compile error is shown", async () => {
  const out = await summarize(`/Users/kim/pinto-notes/Pane/Editor/Palette.swift:27:9: error: cannot find 'accnt' in scope\n** TEST FAILED **\n`);
  assertStringIncludes(out[0], "Palette.swift:27:9: error: cannot find 'accnt' in scope");
});

Deno.test("each failed expectation shows with its file:line and values, before the tests' doc comments", async () => {
  const one = (n: number) => `✘ Test labelReadsOnTheFill${n}(_:) recorded an issue with 1 argument appearance → NSAppearanceName(rawValue: "NSAppearanceNameAqua") at AmberButtonTests.swift:${30 + n}:9: Expectation failed: (ratio → 1.28) >= 3.0
↳ // The label is bold: Apple's minimum for bold text is 3:1.
↳ NSAppearanceNameAqua: 1.28
​✘ Test labelReadsOnTheFill${n}(_:) with 2 test cases failed after 0.001 seconds with 1 issue.
↳ /// Primary buttons stay readable in both appearances: white on the accent.
↳ /// A second line of the test's doc comment.
`;
  const log = `${webkit}${Array.from({ length: 12 }, (_, i) => one(i)).join("")}    export SYSTEM_DEVELOPER_PERFORMANCE_TOOLS_DIR\\=/Applications/Xcode.app/Contents/Developer/Applications/Performance\\ Tools
✘ Test run with 15 tests in 1 suite failed after 1.061 seconds with 12 issues.

** TEST FAILED **
`;
  const out = await summarize(log);
  const issues = out.filter((l) => l.includes("Expectation failed: (ratio → 1.28) >= 3.0"));
  assertEquals(issues.length, 12, out.join("\n"));
  assertStringIncludes(issues[0], "AmberButtonTests.swift:30:9");
  assertEquals(out.filter((l) => l.startsWith("↳ ///") || l.includes("export ")), []);
  assertEquals(out.at(-1), "** TEST FAILED **");
});
