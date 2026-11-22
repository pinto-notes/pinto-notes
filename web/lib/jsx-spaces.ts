/// JSX drops a line break that touches a tag, so prose written as
///   "...other people can edit.\n<a href=...>Docs can</a>\nwhile keeping..."
/// renders as "edit.Docs can" and "</a>while". This finds those spots in a page's source: a line of
/// prose that ends in a word and a next line that starts with an inline tag, or a line that ends in
/// a closing inline tag and a next line that starts with a word. A trailing {" "} marks a spot as fixed.
const INLINE = "a|code|strong|em|Link|b|i|kbd";
const OPEN = new RegExp(`^<(${INLINE})[\\s>]`);
const CLOSE = new RegExp(`</(${INLINE})>$`);
const NOT_PROSE = /^\s*(<|\{|\}|\/\/|\*|\/\*|import |export |const |let |return\b|function |type |if |\]|\)|"|'|`)/;

export function missingSpaces(source: string): number[] {
  const lines = source.split("\n");
  const out: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i].trimEnd();
    const b = lines[i + 1].trim();
    if (!a || a.endsWith('{" "}')) continue;
    const proseEnd = /[A-Za-z0-9.,;:)!?]$/.test(a) && !NOT_PROSE.test(a);
    if ((proseEnd && OPEN.test(b)) || (CLOSE.test(a) && /^[A-Za-z(]/.test(b))) out.push(i + 1);
  }
  return out;
}

export function fixSpaces(source: string): string {
  const lines = source.split("\n");
  for (const n of missingSpaces(source)) lines[n - 1] = lines[n - 1].trimEnd() + '{" "}';
  return lines.join("\n");
}
