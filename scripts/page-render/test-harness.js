// run_app_tests: a small Vitest- and Testing Library-compatible harness, served to the test page as
// the modules "vitest", "@testing-library/react" (and "/preact", "/dom"), "@testing-library/user-event"
// and "@testing-library/jest-dom". It has the parts of each that app tests use (the list is in every
// app's README, app_scaffold.ts TEST_RUNNER); anything else fails with a message that names it,
// instead of "undefined is not a function" (2026-11-17: an AI building five apps lost a fix round
// to each of vi.spyOn, toMatchObject, userEvent.paste, aria-label in getByLabelText, the form
// role, the selector option and Enter in a textarea, and nothing said they were missing).
// It runs in the renderer's sandbox, against a throwaway copy of the app's data.
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { options as preactOptions } from "preact";

// The harness's own clock: a test may fake the page's timers and Date (vi.useFakeTimers).
const real = { setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window), setInterval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window), Date: window.Date };
const realNow = () => real.Date.now();

const RUNNER = "Pinto's test runner";
const SEE = "The app's README lists what the test runner has, under Tests.";
function unsupported(what, hint = "") { throw new Error(`${what} isn't in ${RUNNER}. ${hint ? hint + " " : ""}${SEE}`); }
// Names a caller may look up on any object without meaning a feature (awaiting it, printing it, React).
const QUIET = new Set(["then", "toJSON", "constructor", "asymmetricMatch", "$$typeof", "nodeType", "prototype", "__esModule", "default", "length", "name", "displayName", "toString", "valueOf", "inspect", "_isMockFunction"]);
/** obj, where reading a name it doesn't have throws a message that says what's missing. */
function strict(obj, label, hint) {
  return new Proxy(obj, { get(t, k, r) { if (typeof k === "symbol" || k in t || QUIET.has(k)) return Reflect.get(t, k, r); unsupported(`${label}${k}`, typeof hint === "function" ? hint(k) : hint); } });
}

// MARK: vitest

const newSuite = (name, parent, flags = {}) => ({ name, tests: [], before: [], after: [], beforeAll: [], afterAll: [], parent, ...flags });
let root = newSuite("", null);
let current = root;
function addSuite(name, fn, flags) {
  const s = newSuite(String(name), current, flags);
  current.tests.push({ suite: s });
  const was = current; current = s;
  try { fn?.(); } finally { current = was; }
}
function addTest(name, fn, opts, flags = {}) {
  const timeout = typeof opts === "number" ? opts : opts?.timeout;
  if (typeof fn !== "function") flags = { ...flags, skip: true };
  current.tests.push({ name: String(name), fn, timeout, ...flags });
}
// it.each([[1, 2], [3, 4]])("adds %i and %i", (a, b) => ...), and with objects: "$name".
function each(add) {
  return (table, ...rest) => {
    // A tagged template: it.each`a | b ${1} | ${2}`.
    if (Array.isArray(table) && table.raw) {
      const keys = table[0].split("|").map((s) => s.trim()).filter(Boolean);
      const rows = [];
      for (let i = 0; i < rest.length; i += keys.length) rows.push(Object.fromEntries(keys.map((k, j) => [k, rest[i + j]])));
      table = rows;
    }
    return (name, fn, opts) => table.forEach((row, i) => {
      const args = Array.isArray(row) ? row : [row];
      let k = 0;
      const title = String(name).replace(/%[sdifjo#%]/g, (m) => m === "%%" ? "%" : m === "%#" ? String(i) : fmt(args[k++], true))
        .replace(/\$([\w.]+)/g, (m, path) => row && typeof row === "object" && !Array.isArray(row) ? fmt(path.split(".").reduce((o, p) => o?.[p], row), true) : m);
      add(title, () => fn(...args), opts);
    });
  };
}
function testApi(flags) {
  const f = (name, fn, opts) => addTest(name, fn, opts, flags);
  f.each = each(f);
  return f;
}
export const it = strict(testApi({}), "it.");
it.skip = testApi({ skip: true });
it.only = testApi({ only: true });
it.todo = (name) => addTest(name, undefined, undefined, { skip: true });
it.concurrent = it; it.sequential = it;
it.skipIf = (cond) => cond ? it.skip : it;
it.runIf = (cond) => cond ? it : it.skip;
it.fails = () => unsupported("it.fails", "Check the failure with expect(...).toThrow() or .rejects instead.");
export const test = it;
export const describe = strict((name, fn) => addSuite(name, fn), "describe.");
describe.skip = (name, fn) => addSuite(name, fn, { skip: true });
describe.only = (name, fn) => addSuite(name, fn, { only: true });
describe.todo = (name) => addSuite(name, undefined, { skip: true });
describe.each = each((name, fn) => addSuite(name, fn));
describe.concurrent = describe; describe.sequential = describe;
describe.skipIf = (cond) => cond ? describe.skip : describe;
describe.runIf = (cond) => cond ? describe : describe.skip;
export const suite = describe;
export function beforeEach(fn) { current.before.push(fn); }
export function afterEach(fn) { current.after.push(fn); }
export function beforeAll(fn) { current.beforeAll.push(fn); }
export function afterAll(fn) { current.afterAll.push(fn); }

const fmt = (v, bare = false) => {
  try {
    if (typeof v === "string") return bare ? v : JSON.stringify(v);
    if (v instanceof Element) return `<${v.tagName.toLowerCase()}>`;
    if (v?.asymmetricMatch) return v.toString();
    if (typeof v === "function") return v.mock ? "vi.fn()" : `[Function ${v.name || "anonymous"}]`;
    return JSON.stringify(v) ?? String(v);
  } catch { return String(v); }
};
const isObj = (v) => v !== null && typeof v === "object";
const equal = (a, b) => {
  if (b?.asymmetricMatch) return b.asymmetricMatch(a);
  if (a?.asymmetricMatch) return a.asymmetricMatch(b);
  if (Object.is(a, b)) return true;
  if (!isObj(a) || !isObj(b)) return false;
  if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  if (a instanceof RegExp || b instanceof RegExp) return String(a) === String(b);
  if (a instanceof Map || b instanceof Map) return a instanceof Map && b instanceof Map && a.size === b.size && [...a].every(([k, v]) => b.has(k) && equal(v, b.get(k)));
  if (a instanceof Set || b instanceof Set) return a instanceof Set && b instanceof Set && a.size === b.size && [...a].every((v) => b.has(v) || [...b].some((w) => equal(v, w)));
  if (a instanceof Node || b instanceof Node) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => a[k] !== undefined), kb = Object.keys(b).filter((k) => b[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => equal(a[k], b[k]));
};
// toMatchObject: every field the expected object names, at any depth; arrays item by item.
const subset = (a, b) => {
  if (b?.asymmetricMatch) return b.asymmetricMatch(a);
  if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && b.every((x, i) => subset(a[i], x));
  if (isObj(b) && !(b instanceof Date) && !(b instanceof RegExp)) return isObj(a) && Object.keys(b).every((k) => k in Object(a) && subset(a[k], b[k]));
  return equal(a, b);
};
const items = (v) => v != null && typeof v[Symbol.iterator] === "function" ? [...v] : [];
const textOf = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const visible = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden" || e.hidden) return false; } return true; };
const pathOf = (p) => Array.isArray(p) ? p : String(p).replace(/\[(\w+)\]/g, ".$1").split(".").filter(Boolean);

// Asymmetric matchers: expect.any(Number), expect.objectContaining({ id: "a" }) and friends.
const asym = (name, test, shown) => ({ asymmetricMatch: test, toString: () => `expect.${name}(${shown})`, toJSON: () => `expect.${name}(${shown})` });
const anyOf = (C) => asym("any", (v) => v != null && (Object(v) instanceof C || (C === Number && typeof v === "number") || (C === String && typeof v === "string") || (C === Boolean && typeof v === "boolean") || (C === Function && typeof v === "function")), C?.name ?? String(C));
const asymmetric = {
  any: anyOf,
  anything: () => asym("anything", (v) => v != null, ""),
  objectContaining: (o) => asym("objectContaining", (v) => isObj(v) && Object.keys(o).every((k) => equal(v[k], o[k])), fmt(o)),
  arrayContaining: (xs) => asym("arrayContaining", (v) => Array.isArray(v) && xs.every((x) => v.some((y) => equal(y, x))), fmt(xs)),
  stringContaining: (s) => asym("stringContaining", (v) => typeof v === "string" && v.includes(s), fmt(s)),
  stringMatching: (re) => asym("stringMatching", (v) => typeof v === "string" && (typeof re === "string" ? new RegExp(re) : re).test(v), String(re)),
  closeTo: (n, d = 2) => asym("closeTo", (v) => typeof v === "number" && Math.abs(v - n) < 10 ** -d / 2, `${n}, ${d}`),
};

let assertions = 0, wantAssertions = null;
const custom = {};

function matchers(actual, not) {
  const check = (pass, msg) => { assertions++; if (pass === not) throw new Error(`expect(${fmt(actual)})${not ? ".not" : ""}.${msg}`); };
  const calls = () => { if (!actual?.mock) throw new Error(`expect(${fmt(actual)}) is not a vi.fn() or vi.spyOn() mock.`); return actual.mock.calls; };
  const style = (el) => getComputedStyle(el);
  const css = (want) => typeof want === "string" ? Object.fromEntries(want.split(";").map((d) => d.split(":").map((s) => s.trim())).filter(([k, v]) => k && v)) : want;
  const kebab = (k) => k.startsWith("--") ? k : k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
  const norm = (prop, v) => { const probe = document.createElement("div"); document.body.appendChild(probe); probe.style.setProperty(prop, String(v)); const out = getComputedStyle(probe).getPropertyValue(prop); probe.remove(); return out || String(v); };
  const thrown = (fn) => { try { fn(); } catch (e) { return { threw: true, err: e }; } return { threw: false }; };
  const throwMatch = (err, want) => want === undefined ? true : typeof want === "string" ? String(err?.message ?? err).includes(want) : want instanceof RegExp ? want.test(String(err?.message ?? err)) : typeof want === "function" ? err instanceof want : isObj(want) ? subset(err, want) : false;
  const m = {
    toBe: (v) => check(Object.is(actual, v), `toBe(${fmt(v)})`),
    toEqual: (v) => check(equal(actual, v), `toEqual(${fmt(v)})`),
    toStrictEqual: (v) => check(equal(actual, v), `toStrictEqual(${fmt(v)})`),
    toMatchObject: (v) => check(subset(actual, v), `toMatchObject(${fmt(v)})`),
    toBeTruthy: () => check(!!actual, "toBeTruthy()"),
    toBeFalsy: () => check(!actual, "toBeFalsy()"),
    toBeNull: () => check(actual === null, "toBeNull()"),
    toBeUndefined: () => check(actual === undefined, "toBeUndefined()"),
    toBeDefined: () => check(actual !== undefined, "toBeDefined()"),
    toBeNaN: () => check(Number.isNaN(actual), "toBeNaN()"),
    toBeTypeOf: (t) => check(typeof actual === t, `toBeTypeOf(${fmt(t)}), it is ${typeof actual}`),
    toBeInstanceOf: (C) => check(actual instanceof C, `toBeInstanceOf(${C?.name})`),
    toBeOneOf: (xs) => check(xs.some((x) => equal(actual, x)), `toBeOneOf(${fmt(xs)})`),
    toSatisfy: (fn) => check(!!fn(actual), "toSatisfy(fn)"),
    toContain: (v) => check(typeof actual === "string" ? actual.includes(v) : actual instanceof Element ? actual.contains(v) : items(actual).includes(v), `toContain(${fmt(v)})`),
    toContainEqual: (v) => check(items(actual).some((x) => equal(x, v)), `toContainEqual(${fmt(v)})`),
    toHaveLength: (n) => check(actual?.length === n, `toHaveLength(${n}), got ${actual?.length}`),
    toHaveProperty: (p, ...v) => { const path = pathOf(p); let o = actual, ok = true; for (const k of path) { if (o == null || !(k in Object(o))) { ok = false; break; } o = o[k]; } check(ok && (!v.length || equal(o, v[0])), `toHaveProperty(${fmt(p)}${v.length ? ", " + fmt(v[0]) : ""})`); },
    toMatch: (re) => check(typeof re === "string" ? String(actual).includes(re) : re.test(String(actual)), `toMatch(${re})`),
    toBeGreaterThan: (n) => check(actual > n, `toBeGreaterThan(${n})`),
    toBeGreaterThanOrEqual: (n) => check(actual >= n, `toBeGreaterThanOrEqual(${n})`),
    toBeLessThan: (n) => check(actual < n, `toBeLessThan(${n})`),
    toBeLessThanOrEqual: (n) => check(actual <= n, `toBeLessThanOrEqual(${n})`),
    toBeCloseTo: (n, d = 2) => check(Math.abs(actual - n) < 10 ** -d / 2, `toBeCloseTo(${n})`),
    // A function that should throw, or (after .rejects) the error itself.
    toThrow: (want) => { const t = typeof actual === "function" ? thrown(actual) : { threw: actual !== undefined, err: actual }; check(t.threw && throwMatch(t.err, want), `toThrow(${want === undefined ? "" : fmt(want)})${t.threw ? `, threw ${fmt(String(t.err?.message ?? t.err))}` : ""}`); },
    toHaveBeenCalled: () => check(calls().length > 0, "toHaveBeenCalled()"),
    toHaveBeenCalledOnce: () => check(calls().length === 1, `toHaveBeenCalledOnce(), called ${calls().length} times`),
    toHaveBeenCalledTimes: (n) => check(calls().length === n, `toHaveBeenCalledTimes(${n}), got ${calls().length}`),
    toHaveBeenCalledWith: (...args) => check(calls().some((c) => equal(c, args)), `toHaveBeenCalledWith(${args.map((a) => fmt(a)).join(", ")}), calls were ${fmt(calls())}`),
    toHaveBeenLastCalledWith: (...args) => check(calls().length > 0 && equal(calls().at(-1), args), `toHaveBeenLastCalledWith(${args.map((a) => fmt(a)).join(", ")})`),
    toHaveBeenNthCalledWith: (n, ...args) => check(equal(calls()[n - 1], args), `toHaveBeenNthCalledWith(${n}, ${args.map((a) => fmt(a)).join(", ")})`),
    toHaveReturned: () => check((actual?.mock?.results ?? []).some((r) => r.type === "return"), "toHaveReturned()"),
    toHaveReturnedWith: (v) => check((actual?.mock?.results ?? []).some((r) => r.type === "return" && equal(r.value, v)), `toHaveReturnedWith(${fmt(v)})`),
    // jest-dom
    toBeInTheDocument: () => check(!!actual && document.body.contains(actual), "toBeInTheDocument()"),
    toBeVisible: () => check(!!actual && document.body.contains(actual) && visible(actual), "toBeVisible()"),
    toBeEmptyDOMElement: () => check(!!actual && [...actual.childNodes].every((n) => n.nodeType === 8), "toBeEmptyDOMElement()"),
    toContainElement: (el) => check(!!actual && !!el && actual.contains(el), "toContainElement(…)"),
    toContainHTML: (html) => check(!!actual && actual.outerHTML.includes(html), `toContainHTML(${fmt(html)})`),
    toHaveTextContent: (t, o = {}) => { const text = o.normalizeWhitespace === false ? actual?.textContent ?? "" : textOf(actual); check(!!actual && (typeof t === "string" ? text.includes(t) : t.test(text)), `toHaveTextContent(${fmt(t)}), text is ${fmt(actual ? text.slice(0, 120) : null)}`); },
    toHaveValue: (v) => check(equal(valueOf(actual), v), `toHaveValue(${fmt(v)}), value is ${fmt(valueOf(actual))}`),
    toHaveDisplayValue: (v) => { const shown = actual?.tagName === "SELECT" ? [...actual.selectedOptions].map((o) => o.textContent) : [actual?.value]; check([v].flat().every((w) => shown.some((s) => matches(s ?? "", w))) && shown.length === [v].flat().length, `toHaveDisplayValue(${fmt(v)}), shows ${fmt(shown)}`); },
    toBeChecked: () => check(!!actual && (actual.checked === true || actual.getAttribute("aria-checked") === "true" || actual.getAttribute("data-state") === "checked"), "toBeChecked()"),
    toBePartiallyChecked: () => check(!!actual && (actual.indeterminate === true || actual.getAttribute("aria-checked") === "mixed"), "toBePartiallyChecked()"),
    toBeDisabled: () => check(!!actual && (actual.disabled === true || actual.getAttribute("aria-disabled") === "true" || !!actual.closest?.("fieldset[disabled]")), "toBeDisabled()"),
    toBeEnabled: () => check(!!actual && !(actual.disabled === true || actual.getAttribute("aria-disabled") === "true" || !!actual.closest?.("fieldset[disabled]")), "toBeEnabled()"),
    toBeRequired: () => check(!!actual && (actual.required === true || actual.getAttribute("aria-required") === "true"), "toBeRequired()"),
    toBeInvalid: () => check(!!actual && (actual.getAttribute("aria-invalid") === "true" || actual.checkValidity?.() === false), "toBeInvalid()"),
    toBeValid: () => check(!!actual && !(actual.getAttribute("aria-invalid") === "true" || actual.checkValidity?.() === false), "toBeValid()"),
    toHaveAttribute: (k, v) => check(!!actual && actual.hasAttribute(k) && (v === undefined || matches(actual.getAttribute(k), v)), `toHaveAttribute(${fmt(k)}${v === undefined ? "" : ", " + fmt(v)})${actual?.hasAttribute?.(k) ? `, it is ${fmt(actual.getAttribute(k))}` : ""}`),
    toHaveClass: (...cs) => { const o = isObj(cs.at(-1)) ? cs.pop() : {}; const want = cs.flatMap((c) => String(c).split(/\s+/)).filter(Boolean); const has = [...(actual?.classList ?? [])]; check(!!actual && (want.length ? want.every((c) => has.includes(c)) && (!o.exact || has.length === want.length) : has.length > 0), `toHaveClass(${want.join(" ")}), classes are ${fmt(has.join(" "))}`); },
    toHaveStyle: (want) => { const w = css(want); const bad = Object.entries(w).filter(([k, v]) => style(actual).getPropertyValue(kebab(k)) !== norm(kebab(k), v)); check(!!actual && !bad.length, `toHaveStyle(${fmt(w)})${bad.length ? `, ${bad.map(([k]) => `${kebab(k)} is ${fmt(style(actual).getPropertyValue(kebab(k)))}`).join(", ")}` : ""}`); },
    toHaveFocus: () => check(document.activeElement === actual, `toHaveFocus(), focus is on ${fmt(document.activeElement)}`),
    toHaveAccessibleName: (n) => check(!!actual && (n === undefined ? nameOf(actual) !== "" : matches(nameOf(actual), n)), `toHaveAccessibleName(${n === undefined ? "" : fmt(n)}), name is ${fmt(actual ? nameOf(actual) : null)}`),
    toHaveAccessibleDescription: (n) => { const d = descriptionOf(actual); check(!!actual && (n === undefined ? d !== "" : matches(d, n)), `toHaveAccessibleDescription(${n === undefined ? "" : fmt(n)}), description is ${fmt(d)}`); },
    toHaveRole: (r) => check(!!actual && rolesOf(actual).includes(r), `toHaveRole(${fmt(r)}), roles are ${fmt(actual ? rolesOf(actual) : [])}`),
  };
  m.toThrowError = m.toThrow;
  m.toBeCalled = m.toHaveBeenCalled; m.toBeCalledTimes = m.toHaveBeenCalledTimes; m.toBeCalledWith = m.toHaveBeenCalledWith;
  for (const [k, fn] of Object.entries(custom)) m[k] = (...args) => { const r = fn.call({ isNot: not, equals: equal }, actual, ...args); check(!!r.pass, `${k}(${args.map((a) => fmt(a)).join(", ")})${r.message ? ": " + r.message() : ""}`); };
  return m;
}
const MATCHER_HINT = (k) => /^to/.test(k) ? "Check the value another way (toEqual, toBe, toContain, toHaveTextContent…)." : "";
function wrap(actual, make) {
  const m = make(actual, false);
  m.not = strict(make(actual, true), "expect(…).not.", MATCHER_HINT);
  return strict(m, "expect(…).", MATCHER_HINT);
}
// Matchers asked for later: expect(p).resolves.toBe(1), expect.poll(fn).toBe(1), and their .not.
const later = (run, negate = false) => new Proxy({}, { get: (_, k) => typeof k === "symbol" || QUIET.has(k) ? undefined : k === "not" ? later(run, !negate) : (...a) => run((v) => { const m = wrap(v, matchers); return (negate ? m.not : m)[k](...a); }) });
function expectFn(actual) {
  const m = wrap(actual, matchers);
  // Promises: await expect(p).resolves.toBe(1); await expect(p).rejects.toThrow("no").
  Object.defineProperty(m, "resolves", { get: () => later(async (use) => use(await actual)) });
  Object.defineProperty(m, "rejects", { get: () => later(async (use) => { let e, threw = false; try { await actual; } catch (x) { e = x; threw = true; } if (!threw) throw new Error("expected the promise to reject; it resolved"); return use(e); }) });
  return m;
}
export const expect = strict(expectFn, "expect.");
Object.assign(expectFn, asymmetric, {
  not: { objectContaining: (o) => asym("not.objectContaining", (v) => !asymmetric.objectContaining(o).asymmetricMatch(v), fmt(o)), arrayContaining: (xs) => asym("not.arrayContaining", (v) => !asymmetric.arrayContaining(xs).asymmetricMatch(v), fmt(xs)), stringContaining: (s) => asym("not.stringContaining", (v) => !asymmetric.stringContaining(s).asymmetricMatch(v), fmt(s)) },
  soft: (v) => expect(v),
  assertions: (n) => { wantAssertions = n; },
  hasAssertions: () => { wantAssertions = -1; },
  extend: (ms) => { Object.assign(custom, ms); },
  // expect.poll(() => value).toBe(x): asked again until it passes, like waitFor.
  poll: (fn, o = {}) => later((use) => waitFor(async () => use(await fn()), o)),
});

// MARK: vi

const mocks = new Set();
function mockFn(impl, restore) {
  let base = impl, once = [];
  const f = function (...args) {
    f.mock.calls.push(args); f.mock.lastCall = args; f.mock.instances.push(this);
    const run = once.length ? once.shift() : base;
    try { const value = run ? run.apply(this, args) : undefined; f.mock.results.push({ type: "return", value }); return value; }
    catch (e) { f.mock.results.push({ type: "throw", value: e }); throw e; }
  };
  f._isMockFunction = true;
  f.mock = { calls: [], results: [], instances: [], lastCall: undefined };
  let label = "vi.fn()";
  Object.assign(f, {
    mockImplementation: (g) => { base = g; return f; },
    mockImplementationOnce: (g) => { once.push(g); return f; },
    mockReturnValue: (v) => { base = () => v; return f; },
    mockReturnValueOnce: (v) => { once.push(() => v); return f; },
    mockResolvedValue: (v) => { base = () => Promise.resolve(v); return f; },
    mockResolvedValueOnce: (v) => { once.push(() => Promise.resolve(v)); return f; },
    mockRejectedValue: (v) => { base = () => Promise.reject(v); return f; },
    mockRejectedValueOnce: (v) => { once.push(() => Promise.reject(v)); return f; },
    mockReturnThis: () => { base = function () { return this; }; return f; },
    mockClear: () => { f.mock.calls = []; f.mock.results = []; f.mock.instances = []; f.mock.lastCall = undefined; return f; },
    mockReset: () => { f.mockClear(); base = impl; once = []; return f; },
    mockRestore: () => { f.mockClear(); restore?.(); mocks.delete(f); return f; },
    mockName: (n) => { label = n; return f; },
    getMockName: () => label,
    getMockImplementation: () => base,
    withImplementation: (g, cb) => { const was = base; base = g; const r = cb(); return r?.then ? r.finally(() => { base = was; }) : (base = was, r); },
  });
  mocks.add(f);
  return strict(f, "vi.fn().");
}
let systemTime = null, clock = null;
const nowFn = () => clock ? clock.now : systemTime ?? realNow();
function fakeDate() {
  const R = real.Date;
  function D(...a) { if (!new.target) return new R(nowFn()).toString(); return a.length ? new R(...a) : new R(nowFn()); }
  D.prototype = R.prototype; D.now = nowFn; D.parse = R.parse; D.UTC = R.UTC;
  return D;
}
const setDate = () => { window.Date = (clock || systemTime !== null) ? fakeDate() : real.Date; };
function addTimer(fn, ms, args, every) {
  const id = clock.id++;
  const wait = Math.max(0, Number(ms) || 0);
  clock.timers.set(id, { at: clock.now + wait, fn: typeof fn === "function" ? fn : () => (0, eval)(String(fn)), args, every: every ? Math.max(1, wait) : 0, order: id });
  return id;
}
function nextTimer(limit = Infinity) {
  let best = null;
  for (const [id, t] of clock.timers) if (t.at <= limit && (!best || t.at < best[1].at || (t.at === best[1].at && t.order < best[1].order))) best = [id, t];
  return best;
}
function fire(best) {
  const [id, t] = best;
  clock.now = Math.max(clock.now, t.at);
  if (t.every) { t.at += t.every; t.order = clock.id++; } else clock.timers.delete(id);
  t.fn(...t.args);
}
const needClock = (what) => { if (!clock) throw new Error(`${what} needs vi.useFakeTimers() first.`); };
const flushAsync = () => new Promise((ok) => real.setTimeout(ok, 0));
const stubs = [];
export const vi = strict({
  fn: (impl) => mockFn(impl),
  spyOn(obj, key, access) {
    if (!obj) throw new Error(`vi.spyOn: no object to spy on (got ${fmt(obj)}).`);
    if (access) unsupported(`vi.spyOn(obj, key, "${access}")`, "Spy on a method, or replace the value with vi.stubGlobal.");
    const original = obj[key];
    if (typeof original !== "function") throw new Error(`vi.spyOn: ${String(key)} is not a function on that object (it is ${typeof original}).`);
    const own = Object.prototype.hasOwnProperty.call(obj, key);
    const restore = () => { if (own) obj[key] = original; else delete obj[key]; };
    restore.original = original;
    const f = mockFn(original, restore);
    obj[key] = f;
    return f;
  },
  isMockFunction: (f) => !!f?._isMockFunction,
  mocked: (x) => x,
  clearAllMocks() { for (const f of mocks) f.mockClear(); return vi; },
  resetAllMocks() { for (const f of mocks) f.mockReset(); return vi; },
  restoreAllMocks() { for (const f of [...mocks]) f.mockRestore(); return vi; },
  stubGlobal(name, value) { stubs.push([name, Object.getOwnPropertyDescriptor(window, name)]); Object.defineProperty(window, name, { value, configurable: true, writable: true }); return vi; },
  unstubAllGlobals() { for (const [name, d] of stubs.splice(0).reverse()) { if (d) Object.defineProperty(window, name, d); else delete window[name]; } return vi; },
  mock: () => unsupported("vi.mock", "It can't replace a module here: test through the screen and pinto.data, pass the dependency in, or use vi.spyOn on an object."),
  doMock: () => unsupported("vi.doMock", "Use vi.spyOn on an object instead."),
  importActual: () => unsupported("vi.importActual"),
  hoisted: (fn) => fn(),
  waitFor: (fn, o) => waitFor(fn, o),
  async waitUntil(fn, o = {}) { const end = performance.now() + (typeof o === "number" ? o : o.timeout ?? 2000); for (;;) { const v = await fn(); if (v) return v; if (performance.now() > end) throw new Error("vi.waitUntil timed out"); await new Promise((ok) => real.setTimeout(ok, o.interval ?? 50)); } },
  // Timers and the clock. setSystemTime alone fixes Date (as in Vitest without fake timers).
  useFakeTimers(o = {}) {
    if (!clock) {
      clock = { now: o.now !== undefined ? +new real.Date(o.now) : nowFn(), timers: new Map(), id: 1 };
      window.setTimeout = (fn, ms, ...args) => addTimer(fn, ms, args, false);
      window.setInterval = (fn, ms, ...args) => addTimer(fn, ms, args, true);
      window.clearTimeout = window.clearInterval = (id) => { clock?.timers.delete(id); };
      // React here is Preact, which runs effects after a frame and then a setTimeout: on the real
      // clock, so a component's useEffect still runs (React schedules them without timers).
      clock.effects = preactOptions.requestAnimationFrame;
      preactOptions.requestAnimationFrame = (cb) => real.setTimeout(cb, 0);
      setDate();
    }
    return vi;
  },
  useRealTimers() { if (clock) { Object.assign(window, { setTimeout: real.setTimeout, setInterval: real.setInterval, clearTimeout: real.clearTimeout, clearInterval: real.clearInterval }); preactOptions.requestAnimationFrame = clock.effects; clock = null; } systemTime = null; setDate(); return vi; },
  isFakeTimers: () => !!clock,
  setSystemTime(t) { const ms = +new real.Date(t); if (clock) clock.now = ms; else systemTime = ms; setDate(); return vi; },
  getMockedSystemTime: () => clock ? new real.Date(clock.now) : systemTime === null ? null : new real.Date(systemTime),
  getRealSystemTime: () => realNow(),
  advanceTimersByTime(ms) { needClock("vi.advanceTimersByTime"); const end = clock.now + ms; for (let n = 0, t; n < 100000 && (t = nextTimer(end)); n++) fire(t); clock.now = end; return vi; },
  async advanceTimersByTimeAsync(ms) { needClock("vi.advanceTimersByTimeAsync"); const end = clock.now + ms; for (let n = 0, t; n < 100000 && (t = nextTimer(end)); n++) { fire(t); await flushAsync(); } clock.now = end; await flushAsync(); return vi; },
  advanceTimersToNextTimer() { needClock("vi.advanceTimersToNextTimer"); const t = nextTimer(); if (t) fire(t); return vi; },
  async advanceTimersToNextTimerAsync() { vi.advanceTimersToNextTimer(); await flushAsync(); return vi; },
  runAllTimers() { needClock("vi.runAllTimers"); let n = 0; for (let t; (t = nextTimer()); ) { if (++n > 10000) throw new Error("vi.runAllTimers: more than 10,000 timers; an interval never stops. Use vi.advanceTimersByTime instead."); fire(t); } return vi; },
  async runAllTimersAsync() { needClock("vi.runAllTimersAsync"); let n = 0; for (let t; (t = nextTimer()); ) { if (++n > 10000) throw new Error("vi.runAllTimersAsync: more than 10,000 timers; an interval never stops."); fire(t); await flushAsync(); } return vi; },
  runOnlyPendingTimers() { needClock("vi.runOnlyPendingTimers"); const ids = new Set(clock.timers.keys()); for (let t; (t = nextTimer()) && ids.has(t[0]); ) { ids.delete(t[0]); fire(t); } return vi; },
  async runOnlyPendingTimersAsync() { vi.runOnlyPendingTimers(); await flushAsync(); return vi; },
  clearAllTimers() { clock?.timers.clear(); return vi; },
  getTimerCount: () => clock ? clock.timers.size : 0,
  runAllTicks() { return vi; },
}, "vi.", (k) => /timer/i.test(k) ? "The clock has useFakeTimers, setSystemTime, advanceTimersByTime(Async), runAllTimers, runOnlyPendingTimers and useRealTimers." : "");

/** Drops what a test file registered before it failed to load, so the next file doesn't run it. */
export function forget() { root = current = newSuite("", null); }

/** Runs the tests registered so far (one test file's) and returns [{ name, ok, error, ms }]. */
export async function run(reset) {
  const results = [];
  const tree = root;
  root = current = newSuite("", null);
  const hasOnly = (s) => s.tests.some((t) => t.suite ? t.suite.only || hasOnly(t.suite) : t.only);
  const focus = hasOnly(tree);
  const wanted = (s, inOnly) => s.tests.some((t) => t.suite ? !t.suite.skip && wanted(t.suite, inOnly || t.suite.only) : !t.skip && (!focus || inOnly || t.only));
  const walk = async (suite, path, before, after, inOnly) => {
    if (!wanted(suite, inOnly)) return;
    const failedAll = [];
    for (const f of suite.beforeAll) { try { await f(); } catch (e) { failedAll.push(String(e?.message ?? e)); } }
    for (const t of suite.tests) {
      if (t.suite) { if (!t.suite.skip) await walk(t.suite, [...path, t.suite.name], [...before, ...t.suite.before], [...t.suite.after, ...after], inOnly || t.suite.only); continue; }
      if (t.skip || (focus && !inOnly && !t.only)) continue;
      const name = [...path, t.name].filter(Boolean).join(" › ");
      const t0 = performance.now();
      assertions = 0; wantAssertions = null;
      try {
        if (failedAll.length) throw new Error(`beforeAll failed: ${failedAll[0]}`);
        await reset?.();
        for (const b of before) await b();
        const limit = t.timeout ?? 5000;
        let timer;
        await Promise.race([t.fn(), new Promise((_, no) => { timer = real.setTimeout(() => no(new Error(`timed out after ${limit / 1000} s`)), limit); })]).finally(() => real.clearTimeout(timer));
        if (wantAssertions === -1 && !assertions) throw new Error("expect.hasAssertions(): no expect() ran");
        if (wantAssertions >= 0 && wantAssertions !== null && assertions !== wantAssertions) throw new Error(`expect.assertions(${wantAssertions}): ${assertions} ran`);
        results.push({ name, ok: true, ms: Math.round(performance.now() - t0) });
      } catch (e) {
        results.push({ name, ok: false, error: String(e?.message ?? e).slice(0, 500), ms: Math.round(performance.now() - t0) });
      } finally {
        for (const a of after) { try { await a(); } catch {} }
        cleanup();
      }
    }
    for (const f of suite.afterAll) { try { await f(); } catch {} }
  };
  try { await walk(tree, [], tree.before, tree.after, false); }
  finally {
    // Each file starts clean: no spies, fake clock or stubbed globals left from the one before.
    vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); for (const k of Object.keys(custom)) delete custom[k];
  }
  return results;
}

// MARK: @testing-library/react

const mounted = [];
export function cleanup() { for (const m of mounted.splice(0)) { try { m.root.unmount(); } catch {} if (m.owned) m.container.remove(); } }
const flush = () => new Promise((ok) => real.setTimeout(ok, 0));
/** Under fake timers, runs fn and then the renders and effects it caused before returning, as
 *  React's act() does (Preact's own test-utils do it this way): render(<Ticker />) has started its
 *  interval when it returns, so vi.advanceTimersByTime moves it. Only then: on the real clock,
 *  running effects early changed which screen existing tests saw (the habit tracker template's
 *  Undo test found the bar left by the test before it), and their saves would be held back. */
function flushSync(fn) {
  if (!clock) return fn();
  const raf = preactOptions.requestAnimationFrame, debounce = preactOptions.debounceRendering;
  let effects = null;
  const renders = [];
  preactOptions.requestAnimationFrame = (cb) => { effects = cb; };
  preactOptions.debounceRendering = (cb) => { renders.push(cb); };
  try {
    const r = fn();
    for (let i = 0; i < 25 && (effects || renders.length); i++) {
      while (renders.length) renders.shift()();
      if (effects) { const e = effects; effects = null; e(); }
    }
    return r;
  } finally {
    preactOptions.requestAnimationFrame = raf; preactOptions.debounceRendering = debounce;
  }
}
export async function act(fn) { const r = await flushSync(() => fn?.()); await flush(); await flush(); return r; }
export function render(ui, o = {}) {
  const owned = !o.container;
  const container = o.container ?? (o.baseElement ?? document.body).appendChild(document.createElement("div"));
  const root = createRoot(container);
  const wrapUi = (x) => o.wrapper ? createElement(o.wrapper, null, x) : x;
  flushSync(() => root.render(wrapUi(ui)));
  mounted.push({ root, container, owned });
  return {
    container, baseElement: o.baseElement ?? document.body,
    unmount: () => flushSync(() => root.unmount()), rerender: (next) => flushSync(() => root.render(wrapUi(next))),
    asFragment: () => document.createRange().createContextualFragment(container.innerHTML),
    debug: (el = container) => console.log(prettyDOM(el)),
    ...queriesFor(container),
  };
}
/** renderHook(() => useThing(), { initialProps, wrapper }): result.current is what it returned last. */
export function renderHook(hook, o = {}) {
  const result = { current: undefined };
  function Probe({ props }) { result.current = hook(props); return null; }
  const r = render(createElement(Probe, { props: o.initialProps }), { wrapper: o.wrapper });
  return { result, rerender: (props) => r.rerender(createElement(Probe, { props })), unmount: r.unmount };
}
export const prettyDOM = (el = document.body, max = 7000) => (el?.outerHTML ?? String(el)).slice(0, max);
let testIdAttribute = "data-testid", asyncTimeout = 2000;
export function configure(o = {}) { if (typeof o === "function") o = o({ testIdAttribute, asyncUtilTimeout: asyncTimeout }); if (o.testIdAttribute) testIdAttribute = o.testIdAttribute; if (o.asyncUtilTimeout) asyncTimeout = o.asyncUtilTimeout; }

const TEXTBOX = /^(text|email|tel|url|search|password|)$/;
// Implicit roles, as Testing Library reads them (a subset of the ARIA in HTML table).
function implicitRoles(e) {
  const t = e.tagName, type = (e.getAttribute("type") ?? "").toLowerCase();
  const named = () => !!(e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.getAttribute("title"));
  const landmark = () => !e.parentElement?.closest("article, aside, main, nav, section");
  switch (t) {
    case "BUTTON": return ["button"];
    case "SUMMARY": return ["button"];
    case "INPUT":
      if (/^(button|submit|reset|image)$/.test(type)) return ["button"];
      if (type === "checkbox") return ["checkbox"];
      if (type === "radio") return ["radio"];
      if (type === "range") return ["slider"];
      if (type === "number") return ["spinbutton"];
      if (type === "search") return e.hasAttribute("list") ? ["combobox"] : ["searchbox", "textbox"];
      if (TEXTBOX.test(type) || !/^(hidden|file|color|date|datetime-local|month|time|week)$/.test(type)) return e.hasAttribute("list") ? ["combobox"] : ["textbox"];
      return [];
    case "TEXTAREA": return ["textbox"];
    case "SELECT": return e.multiple || e.size > 1 ? ["listbox"] : ["combobox"];
    case "OPTION": return ["option"];
    case "OPTGROUP": return ["group"];
    case "A": case "AREA": return e.hasAttribute("href") ? ["link"] : [];
    case "H1": case "H2": case "H3": case "H4": case "H5": case "H6": return ["heading"];
    case "UL": case "OL": case "MENU": return ["list"];
    case "LI": return ["listitem"];
    case "IMG": return e.getAttribute("alt") === "" ? ["presentation"] : ["img"];
    case "FIGURE": return ["figure"];
    case "TABLE": return ["table"];
    case "THEAD": case "TBODY": case "TFOOT": return ["rowgroup"];
    case "TR": return ["row"];
    case "TD": return ["cell", "gridcell"];
    case "TH": return e.getAttribute("scope") === "row" ? ["rowheader"] : ["columnheader"];
    case "FORM": return ["form"];
    case "FIELDSET": return ["group"];
    case "DETAILS": return ["group"];
    case "NAV": return ["navigation"];
    case "MAIN": return ["main"];
    case "ASIDE": return ["complementary"];
    case "HEADER": return landmark() ? ["banner"] : [];
    case "FOOTER": return landmark() ? ["contentinfo"] : [];
    case "SECTION": return named() ? ["region"] : [];
    case "ARTICLE": return ["article"];
    case "DIALOG": return ["dialog"];
    case "HR": return ["separator"];
    case "PROGRESS": return ["progressbar"];
    case "METER": return ["meter"];
    case "OUTPUT": return ["status"];
    case "P": return ["paragraph"];
    case "DT": return ["term"];
    case "DD": return ["definition"];
    case "BLOCKQUOTE": return ["blockquote"];
    case "CODE": return ["code"];
    case "STRONG": case "B": return ["strong"];
    case "EM": case "I": return ["emphasis"];
    case "SVG": case "svg": return [];
    default: return e.isContentEditable && e.getAttribute("contenteditable") !== null ? ["textbox"] : [];
  }
}
const rolesOf = (e) => { const r = e.getAttribute?.("role"); return r ? r.trim().split(/\s+/).slice(0, 1) : implicitRoles(e); };
const hiddenEl = (e) => e.nodeType === 1 && (e.getAttribute("aria-hidden") === "true" || e.hidden || getComputedStyle(e).display === "none");
// The text a control is named by: its text, with pictures' alt and labelled children's labels.
function contentName(e) {
  let out = "";
  for (const n of e.childNodes) {
    if (n.nodeType === 3) out += n.textContent;
    else if (n.nodeType === 1 && !hiddenEl(n)) {
      if (n.getAttribute("aria-label")) out += " " + n.getAttribute("aria-label") + " ";
      else if (n.tagName === "IMG") out += " " + (n.getAttribute("alt") ?? "") + " ";
      else if (/^(svg|SVG)$/.test(n.tagName) && n.querySelector("title")) out += " " + n.querySelector("title").textContent + " ";
      else { const block = /^(DIV|P|LI|H[1-6]|BR)$/.test(n.tagName); out += (block ? " " : "") + contentName(n) + (block ? " " : ""); }
    }
  }
  return out;
}
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const labelsOf = (e) => {
  const out = [];
  if (e.id) for (const l of document.querySelectorAll(`label[for="${CSS.escape(e.id)}"]`)) out.push(l);
  const wrap = e.parentElement?.closest("label");
  if (wrap && !wrap.htmlFor) out.push(wrap);
  return out;
};
/** A label's text without the control inside it (<label>Name <input></label> is "Name"). */
function labelText(l, e) {
  if (!l.contains(e)) return clean(contentName(l));
  const path = [];
  for (let n = e; n !== l; n = n.parentNode) path.unshift([...n.parentNode.childNodes].indexOf(n));
  const copy = l.cloneNode(true);
  let n = copy;
  for (const i of path) n = n.childNodes[i];
  n.remove();
  return clean(contentName(copy));
}
function nameOf(e) {
  const by = e.getAttribute("aria-labelledby");
  if (by) return clean(by.split(/\s+/).map((id) => { const x = document.getElementById(id); return x ? x.getAttribute("aria-label") ?? contentName(x) : ""; }).join(" "));
  if (e.getAttribute("aria-label")) return clean(e.getAttribute("aria-label"));
  if (/^(INPUT|TEXTAREA|SELECT|METER|PROGRESS|OUTPUT|BUTTON)$/.test(e.tagName)) { const ls = labelsOf(e); if (ls.length) return clean(ls.map((l) => labelText(l, e)).join(" ")); }
  if (e.tagName === "INPUT" && /^(button|submit|reset)$/.test(e.type)) return clean(e.value || (e.type === "submit" ? "Submit" : e.type === "reset" ? "Reset" : ""));
  if (e.tagName === "INPUT" && e.type === "image") return clean(e.alt || e.value || "");
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) return clean(e.title || e.getAttribute("placeholder") || "");
  if (e.tagName === "IMG" || e.tagName === "AREA") return clean(e.getAttribute("alt") ?? e.title ?? "");
  if (e.tagName === "FIELDSET") return clean(e.querySelector("legend")?.textContent ?? "");
  if (e.tagName === "TABLE") return clean(e.querySelector("caption")?.textContent ?? "");
  if (e.tagName === "FIGURE") return clean(e.querySelector("figcaption")?.textContent ?? "");
  // What's inside it, for every role (Testing Library takes a list's or a region's name only from a
  // label; this runner always was more forgiving, and apps' tests rely on it).
  return clean(contentName(e)) || clean(e.title);
}
const descriptionOf = (e) => { const by = e?.getAttribute("aria-describedby"); return by ? clean(by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ")) : clean(e?.getAttribute("aria-description") ?? e?.title ?? ""); };
const valueOf = (e) => {
  if (!e) return undefined;
  if (e.tagName === "SELECT" && e.multiple) return [...e.selectedOptions].map((o) => o.value);
  if (e.type === "checkbox" || e.type === "radio") return e.checked ? (e.value || "on") : null;
  if (e.type === "number" || e.type === "range") return e.value === "" ? null : Number(e.value);
  return "value" in e ? e.value : e.getAttribute("aria-valuenow") ?? undefined;
};
const matches = (text, want, exact = true, normalizer, el) => {
  const t = normalizer ? normalizer(text) : clean(text);
  if (typeof want === "function") return !!want(t, el);
  if (want instanceof RegExp) return want.test(t);
  return exact ? t === clean(String(want)) : t.toLowerCase().includes(clean(String(want)).toLowerCase());
};
const all = (root) => [...root.querySelectorAll("*")];
const pick = (els, o) => o?.selector && o.selector !== "*" ? els.filter((e) => e.matches(o.selector)) : els;
const OPTIONS = { Role: ["name", "description", "hidden", "level", "checked", "pressed", "selected", "expanded", "current", "busy", "value", "exact", "queryFallbacks", "suggest"], Text: ["exact", "selector", "ignore", "normalizer"], LabelText: ["exact", "selector", "normalizer"],
  PlaceholderText: ["exact", "normalizer"], TestId: ["exact", "normalizer"], DisplayValue: ["exact", "normalizer"], Title: ["exact", "normalizer"], AltText: ["exact", "normalizer"] };
// trim and collapseWhitespace are always on; timeout and interval belong to findBy's third argument.
const TOLERATED = ["trim", "collapseWhitespace", "timeout", "interval"];
const checkOptions = (kind, o) => { if (!isObj(o)) return; for (const k of Object.keys(o)) if (!OPTIONS[kind].includes(k) && !TOLERATED.includes(k)) unsupported(`The "${k}" option of getBy${kind}`, `It has ${OPTIONS[kind].join(", ")}.`); };
const state = (e, attr, prop) => { const a = e.getAttribute(attr); return a === null ? (prop ? !!e[prop] : undefined) : a === "true" ? true : a === "mixed" ? "mixed" : a === "false" ? false : a; };
const finders = {
  Role: (root, role, o = {}) => all(root).filter((e) => rolesOf(e).includes(role)
    && (o.hidden || visible(e))
    && (o.name === undefined || matches(nameOf(e), o.name, o.exact !== false, undefined, e))
    && (o.description === undefined || matches(descriptionOf(e), o.description, true, undefined, e))
    && (o.level === undefined || e.tagName === `H${o.level}` || e.getAttribute("aria-level") === String(o.level))
    && (o.checked === undefined || (e.indeterminate ? "mixed" : state(e, "aria-checked", "checked")) === o.checked)
    && (o.pressed === undefined || state(e, "aria-pressed") === o.pressed)
    && (o.selected === undefined || (state(e, "aria-selected", e.tagName === "OPTION" ? "selected" : null) ?? false) === o.selected)
    && (o.expanded === undefined || (state(e, "aria-expanded") ?? (e.tagName === "DETAILS" ? e.open : undefined)) === o.expanded)
    && (o.current === undefined || (e.getAttribute("aria-current") === null ? false : e.getAttribute("aria-current") === "true" ? true : e.getAttribute("aria-current")) === o.current)
    && (o.busy === undefined || (e.getAttribute("aria-busy") === "true") === o.busy)
    && (o.value === undefined || Object.entries(o.value).every(([k, v]) => matches(String(e.getAttribute(`aria-value${k}`) ?? (k === "now" ? e.value : "")), v)))),
  Text: (root, t, o = {}) => pick(all(root), o).filter((e) => !e.matches(o.ignore === false ? ":not(*)" : o.ignore ?? "script, style")
    && (([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && matches(e.textContent, t, o.exact !== false, o.normalizer, e))
      || (e.tagName === "INPUT" && /^(submit|button|reset)$/.test(e.type) && matches(e.value, t, o.exact !== false, o.normalizer, e)))),
  // Elements named by a label (for, wrapped, aria-labelledby) or by aria-label, as Testing Library finds them.
  LabelText: (root, t, o = {}) => pick(all(root), o).filter((e) => {
    if (e.getAttribute("aria-label") !== null && matches(e.getAttribute("aria-label"), t, o.exact !== false, o.normalizer, e)) return true;
    const by = e.getAttribute("aria-labelledby");
    if (by) return matches(by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" "), t, o.exact !== false, o.normalizer, e);
    if (!/^(INPUT|TEXTAREA|SELECT|BUTTON|METER|PROGRESS|OUTPUT)$/.test(e.tagName) && !e.getAttribute("role")) return false;
    if (e.tagName === "INPUT" && e.type === "hidden") return false;
    if (labelsOf(e).some((l) => matches(labelText(l, e), t, o.exact !== false, o.normalizer, e))) return true;
    // As this runner always had it: a field's placeholder or a button's text counts as its label.
    return matches(nameOf(e), t, o.exact !== false, o.normalizer, e);
  }),
  PlaceholderText: (root, t, o = {}) => all(root).filter((e) => e.hasAttribute("placeholder") && matches(e.getAttribute("placeholder"), t, o.exact !== false, o.normalizer, e)),
  TestId: (root, t, o = {}) => all(root).filter((e) => e.hasAttribute(testIdAttribute) && matches(e.getAttribute(testIdAttribute), t, o.exact !== false, o.normalizer, e)),
  DisplayValue: (root, t, o = {}) => all(root).filter((e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && (e.tagName === "SELECT" ? [...e.selectedOptions].some((x) => matches(x.textContent, t, o.exact !== false, o.normalizer, e)) : matches(String(e.value), t, o.exact !== false, o.normalizer, e))),
  Title: (root, t, o = {}) => all(root).filter((e) => (e.hasAttribute("title") && matches(e.getAttribute("title"), t, o.exact !== false, o.normalizer, e)) || (e.tagName === "title" && e.parentElement?.tagName.toLowerCase() === "svg" && matches(e.textContent, t, o.exact !== false, o.normalizer, e))),
  AltText: (root, t, o = {}) => all(root).filter((e) => /^(IMG|INPUT|AREA)$/.test(e.tagName) && e.hasAttribute("alt") && matches(e.getAttribute("alt"), t, o.exact !== false, o.normalizer, e)),
};
const describeQuery = (kind, args) => `${kind}(${args.map((a) => fmt(a)).join(", ")})`;
function screenText() { return [...document.body.children].filter((e) => !/^(SCRIPT|STYLE)$/.test(e.tagName)).map(textOf).join(" ").trim().slice(0, 300); }
// What a failed getByRole could have meant: the roles and names on the screen.
function rolesOnScreen(root) {
  const seen = new Map();
  for (const e of all(root)) { if (!visible(e)) continue; for (const r of rolesOf(e)) { if (/^(paragraph|strong|emphasis|code|generic|presentation|rowgroup|row|cell|gridcell|listitem|list|term|definition)$/.test(r)) continue; const n = nameOf(e); if (!seen.has(r)) seen.set(r, []); if (seen.get(r).length < 6) seen.get(r).push(n ? JSON.stringify(n.slice(0, 40)) : "(no name)"); } }
  return [...seen].map(([r, ns]) => `${r}: ${ns.join(", ")}`).join("; ").slice(0, 600);
}
export async function waitFor(fn, o = {}) {
  const timeout = o.timeout ?? asyncTimeout, interval = o.interval ?? 50;
  const end = performance.now() + timeout;
  for (;;) {
    try { return await fn(); } catch (e) { if (performance.now() > end) { o.onTimeout?.(e); throw e; } }
    await new Promise((ok) => real.setTimeout(ok, interval));
  }
}
export async function waitForElementToBeRemoved(what, o = {}) {
  const get = () => { const v = typeof what === "function" ? what() : what; return [v].flat().filter(Boolean); };
  const first = get();
  if (!first.length) throw new Error("waitForElementToBeRemoved: the element(s) aren't there to begin with.");
  await waitFor(() => { const now = typeof what === "function" ? get() : first.filter((e) => document.body.contains(e)); if (now.length) throw new Error(`waitForElementToBeRemoved: still on screen after ${(o.timeout ?? asyncTimeout) / 1000} s. The screen shows: ${screenText()}`); }, o);
}
function queriesFor(root, label = "screen.") {
  const q = {};
  for (const [kind, find] of Object.entries(finders)) {
    const found = (a) => { checkOptions(kind, a[1]); return find(root, ...a); };
    const missing = (name, a) => `Unable to find ${describeQuery(name + kind, a)}. ${kind === "Role" ? `Roles on the screen: ${rolesOnScreen(root) || "none"}` : `The screen shows: ${screenText()}`}`;
    q[`queryAllBy${kind}`] = (...a) => found(a);
    q[`getAllBy${kind}`] = (...a) => { const r = found(a); if (!r.length) throw new Error(missing("getAllBy", a)); return r; };
    q[`queryBy${kind}`] = (...a) => { const r = found(a); if (r.length > 1) throw new Error(`Found ${r.length} elements for ${describeQuery("queryBy" + kind, a)}; use the AllBy variant.`); return r[0] ?? null; };
    q[`getBy${kind}`] = (...a) => { const r = found(a); if (r.length !== 1) throw new Error(r.length ? `Found ${r.length} elements for ${describeQuery("getBy" + kind, a)}; use getAllBy${kind}, or narrow it with within(…) or a name.` : missing("getBy", a)); return r[0]; };
    const waits = (a) => ({ ...(isObj(a[1]) && a[1].timeout ? { timeout: a[1].timeout } : {}), ...(a[2] ?? {}) });
    q[`findBy${kind}`] = (...a) => waitFor(() => q[`getBy${kind}`](...a), waits(a));
    q[`findAllBy${kind}`] = (...a) => waitFor(() => q[`getAllBy${kind}`](...a), waits(a));
  }
  q.debug = (el = root) => console.log(prettyDOM(el));
  return strict(q, label, (k) => /^(get|query|find)(All)?By/.test(k) ? `Queries are ${Object.keys(finders).map((f) => "By" + f).join(", ")}.` : "");
}
export const screen = queriesFor(document.body);
export const within = (el) => { if (!el) throw new Error(`within: no element (got ${fmt(el)}).`); return queriesFor(el, "within(…)."); };
export const getQueriesForElement = within;
// @testing-library/dom's queries that take the container first: getByText(container, "Hi").
const containerQuery = (name) => (el, ...a) => queriesFor(el)[name](...a);
export const queries = Object.fromEntries(Object.keys(finders).flatMap((k) => ["getBy", "getAllBy", "queryBy", "queryAllBy", "findBy", "findAllBy"].map((p) => [p + k, containerQuery(p + k)])));
export const {
  getByRole, getAllByRole, queryByRole, queryAllByRole, findByRole, findAllByRole,
  getByText, getAllByText, queryByText, queryAllByText, findByText, findAllByText,
  getByLabelText, getAllByLabelText, queryByLabelText, queryAllByLabelText, findByLabelText, findAllByLabelText,
  getByPlaceholderText, getAllByPlaceholderText, queryByPlaceholderText, queryAllByPlaceholderText, findByPlaceholderText, findAllByPlaceholderText,
  getByTestId, getAllByTestId, queryByTestId, queryAllByTestId, findByTestId, findAllByTestId,
  getByDisplayValue, getAllByDisplayValue, queryByDisplayValue, queryAllByDisplayValue, findByDisplayValue, findAllByDisplayValue,
  getByTitle, getAllByTitle, queryByTitle, queryAllByTitle, findByTitle, findAllByTitle,
  getByAltText, getAllByAltText, queryByAltText, queryAllByAltText, findByAltText, findAllByAltText,
} = queries;

const EVENT_TYPES = { doubleClick: "dblclick", contextMenu: "contextmenu", dragStart: "dragstart", dragEnd: "dragend", dragEnter: "dragenter", dragLeave: "dragleave", dragOver: "dragover", dragExit: "dragexit", focusIn: "focusin", focusOut: "focusout", beforeInput: "beforeinput",
  compositionStart: "compositionstart", compositionEnd: "compositionend", compositionUpdate: "compositionupdate", touchStart: "touchstart", touchEnd: "touchend", touchMove: "touchmove", touchCancel: "touchcancel", animationEnd: "animationend", transitionEnd: "transitionend", loadedData: "loadeddata" };
const eventClass = (type) => /^key/.test(type) ? KeyboardEvent : /^pointer/.test(type) ? PointerEvent : /^(mouse|click|dblclick|contextmenu)/.test(type) ? MouseEvent : /^(focus|blur)/.test(type) ? FocusEvent : /^(input|beforeinput)$/.test(type) ? InputEvent : type === "wheel" ? WheelEvent : /^(drag|drop)/.test(type) && window.DragEvent ? DragEvent : /^composition/.test(type) ? CompositionEvent : Event;
const dispatch = (el, type, init = {}) => {
  if (!el) throw new Error(`Can't fire "${type}": no element.`);
  const { target: _target, clipboardData, dataTransfer, ...rest } = init;
  const ev = new (eventClass(type))(type, { bubbles: !/^(focus|blur|mouseenter|mouseleave|pointerenter|pointerleave|load|scroll)$/.test(type), cancelable: true, composed: true, ...rest });
  if (clipboardData) Object.defineProperty(ev, "clipboardData", { value: clipboardData });
  if (dataTransfer) Object.defineProperty(ev, "dataTransfer", { value: dataTransfer });
  return el.dispatchEvent(ev);
};
const applyTarget = (el, target) => {
  if (!target) return;
  for (const [k, v] of Object.entries(target)) {
    if (k === "value") setValue(el, v);
    else if (k === "checked") Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked").set.call(el, v);
    else if (k === "files") Object.defineProperty(el, "files", { value: v, configurable: true });
    else el[k] = v;
  }
};
// Under fake timers each one redraws before it returns, as Testing Library's fireEvent does.
export const fireEvent = new Proxy(Object.assign((el, ev) => flushSync(() => el.dispatchEvent(ev)), {
  click: (el, init) => flushSync(() => dispatch(el, "click", { button: 0, ...init })),
  change: (el, init) => flushSync(() => { applyTarget(el, init?.target); dispatch(el, "input"); return dispatch(el, "change"); }),
  input: (el, init) => flushSync(() => { applyTarget(el, init?.target); return dispatch(el, "input", { ...init, target: undefined }); }),
  focus: (el) => flushSync(() => { el.focus(); return dispatch(el, "focus"); }),
  blur: (el) => flushSync(() => { el.blur(); return dispatch(el, "blur"); }),
  submit: (el) => flushSync(() => dispatch(el, "submit")),
}), { get(t, k) {
  if (typeof k === "symbol" || k in t) return t[k];
  if (QUIET.has(k)) return undefined;
  const type = EVENT_TYPES[k] ?? k.toLowerCase();
  return (el, init) => flushSync(() => { applyTarget(el, init?.target); return dispatch(el, type, init); });
} });
export { createElement };

// MARK: @testing-library/user-event

const setValue = (el, v) => {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
};
const editable = (el) => !!el && ((el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|reset|file|image|range|color)$/.test(el.type)) || el.tagName === "TEXTAREA" || el.isContentEditable);
const usable = (el, what) => { if (!el) throw new Error(`userEvent.${what}: no element (got ${fmt(el)}).`); };
const selectionOf = (el) => { try { if (el.selectionStart !== null && el.selectionStart !== undefined) return [el.selectionStart, el.selectionEnd]; } catch {} const n = (el.value ?? "").length; return [n, n]; };
const putCaret = (el, at) => { try { el.setSelectionRange?.(at, at); } catch {} };
/** Types text at the caret as the browser would: beforeinput, the value, input. */
function insert(el, text, inputType = "insertText") {
  if (el.readOnly || el.disabled) return;
  if (el.isContentEditable) { if (!dispatch(el, "beforeinput", { data: text, inputType })) return; el.textContent += text; dispatch(el, "input", { data: text, inputType }); return; }
  const value = el.value ?? "";
  const [s, e] = selectionOf(el);
  let add = text;
  if (el.maxLength > 0) add = add.slice(0, Math.max(0, el.maxLength - (value.length - (e - s))));
  if (!add && text) return;
  if (!dispatch(el, "beforeinput", { data: add, inputType })) return;
  setValue(el, value.slice(0, s) + add + value.slice(e));
  putCaret(el, s + add.length);
  dispatch(el, "input", { data: add, inputType });
}
function erase(el, forward) {
  if (el.readOnly || el.disabled || !editable(el)) return;
  const value = el.value ?? "";
  let [s, e] = selectionOf(el);
  if (s === e) { if (forward) e = Math.min(value.length, e + 1); else s = Math.max(0, s - 1); }
  if (s === e) return;
  const inputType = forward ? "deleteContentForward" : "deleteContentBackward";
  if (!dispatch(el, "beforeinput", { inputType })) return;
  setValue(el, value.slice(0, s) + value.slice(e));
  putCaret(el, s);
  dispatch(el, "input", { inputType });
}
// "{Enter}", "{Shift>}A{/Shift}", "[KeyA]", "{{" for "{": as user-event reads them.
function keys(text) {
  const out = [];
  const s = String(text);
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    if ((c === "{" || c === "[") && s[i + 1] === c) { out.push({ key: c }); i += 2; continue; }
    if (c === "{" || c === "[") {
      const close = s.indexOf(c === "{" ? "}" : "]", i);
      if (close < 0) throw new Error(`userEvent: "${c}" with nothing to close it in ${JSON.stringify(s)}; type "${c}${c}" for the character.`);
      let body = s.slice(i + 1, close);
      const release = body.startsWith("/"), hold = body.endsWith(">");
      body = body.replace(/^\//, "").replace(/>$/, "");
      const key = c === "[" ? ({ Space: " ", Enter: "Enter", Tab: "Tab", Backspace: "Backspace", Escape: "Escape" }[body] ?? (body.match(/^Key([A-Z])$/)?.[1].toLowerCase() ?? body.match(/^Digit(\d)$/)?.[1] ?? body)) : ({ space: " ", enter: "Enter", esc: "Escape", backspace: "Backspace", del: "Delete", tab: "Tab", arrowleft: "ArrowLeft", arrowright: "ArrowRight", arrowup: "ArrowUp", arrowdown: "ArrowDown", selectall: "selectall" }[body.toLowerCase()] ?? body);
      out.push({ key, hold, release, named: true });
      i = close + 1; continue;
    }
    out.push({ key: c }); i++;
  }
  return out;
}
const MODS = { Shift: "shiftKey", Control: "ctrlKey", Alt: "altKey", Meta: "metaKey" };
async function press(list, opts = {}) {
  const held = { shiftKey: false, ctrlKey: false, altKey: false, metaKey: false };
  for (const k of list) {
    const el = document.activeElement ?? document.body;
    if (MODS[k.key]) { if (!k.release) { held[MODS[k.key]] = true; dispatch(el, "keydown", { key: k.key, ...held }); } if (k.release || !k.hold) { held[MODS[k.key]] = false; dispatch(el, "keyup", { key: k.key, ...held }); } continue; }
    if (k.key === "selectall") { el.select?.(); continue; }
    const key = k.key === "\n" ? "Enter" : k.key;
    if (k.release) { dispatch(el, "keyup", { key, ...held }); continue; }
    const go = dispatch(el, "keydown", { key, code: key.length === 1 ? (/[a-z]/i.test(key) ? "Key" + key.toUpperCase() : /\d/.test(key) ? "Digit" + key : key === " " ? "Space" : "") : key, ...held });
    const printable = key.length === 1;
    // No keypress for Enter: WebKit submits a form itself on a synthetic Enter keypress, so the
    // form was sent twice (a quick-entry field saved each to-do twice).
    if (go && printable) dispatch(el, "keypress", { key, charCode: key.charCodeAt(0), ...held });
    if (go) {
      const shortcut = held.ctrlKey || held.metaKey;
      if (printable && !shortcut) {
        if (key === " " && (el.tagName === "BUTTON" || (el.tagName === "INPUT" && /^(checkbox|radio|button|submit|reset)$/.test(el.type)))) { /* clicked on keyup */ }
        else if (editable(el)) insert(el, key);
      } else if (key === "Enter") {
        if (el.tagName === "TEXTAREA" || el.isContentEditable) insert(el, "\n", "insertLineBreak");
        else if (el.tagName === "INPUT" && el.form && !/^(checkbox|radio|button|submit|reset)$/.test(el.type)) el.form.requestSubmit?.();
        else if (el.tagName === "BUTTON" || (el.tagName === "A" && el.hasAttribute("href")) || (el.tagName === "INPUT" && /^(button|submit|reset|checkbox|radio)$/.test(el.type) && el.type !== "checkbox")) el.click();
      } else if (key === "Backspace") erase(el, false);
      else if (key === "Delete") erase(el, true);
      else if (key === "Tab") await user.tab({ shift: held.shiftKey });
      else if (/^Arrow(Left|Right)$/.test(key) && editable(el) && !el.isContentEditable) { const [s] = selectionOf(el); putCaret(el, Math.max(0, Math.min((el.value ?? "").length, s + (key === "ArrowLeft" ? -1 : 1)))); }
      else if (key === "Home" && editable(el)) putCaret(el, 0);
      else if (key === "End" && editable(el)) putCaret(el, (el.value ?? "").length);
    }
    if (!k.hold) {
      dispatch(el, "keyup", { key, ...held });
      if (go && key === " " && (el.tagName === "BUTTON" || (el.tagName === "INPUT" && /^(checkbox|radio|button|submit|reset)$/.test(el.type)))) el.click();
    }
    if (opts.delay) await new Promise((ok) => real.setTimeout(ok, opts.delay));
  }
  await act();
}
const focusable = (e) => (e.tabIndex >= 0 || (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.tagName) || (e.tagName === "A" && e.hasAttribute("href")))) && !e.disabled && e.getAttribute("tabindex") !== "-1" && visible(e);
const user = {
  async click(el, o = {}) {
    usable(el, "click");
    const init = { button: 0, shiftKey: !!o.shiftKey, ctrlKey: !!o.ctrlKey, metaKey: !!o.metaKey, altKey: !!o.altKey };
    for (const t of ["pointerover", "pointerenter", "mouseover", "mouseenter", "pointerdown", "mousedown"]) dispatch(el, t, init);
    const target = el.closest?.("input, select, textarea, button, a[href], [tabindex], [contenteditable]") ?? null;
    if (target && focusable(target)) target.focus(); else if (!target && document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.();
    for (const t of ["pointerup", "mouseup"]) dispatch(el, t, init);
    if (!el.disabled) el.click();
    await act();
  },
  async dblClick(el) { await user.click(el); await user.click(el); dispatch(el, "dblclick", { button: 0, detail: 2 }); await act(); },
  async tripleClick(el) { await user.click(el); await user.click(el); await user.click(el); el.select?.(); await act(); },
  async type(el, text, o = {}) {
    usable(el, "type");
    if (!o.skipClick) await user.click(el);
    else el.focus();
    if (editable(el) && !el.isContentEditable) putCaret(el, o.initialSelectionStart ?? (el.value ?? "").length);
    if (o.initialSelectionStart !== undefined && o.initialSelectionEnd !== undefined) try { el.setSelectionRange(o.initialSelectionStart, o.initialSelectionEnd); } catch {}
    await press(keys(String(text).replace(/\n/g, "{Enter}")), o);
    dispatch(el, "change");
    await act();
  },
  async keyboard(text, o) { await press(keys(text), o); },
  async clear(el) {
    usable(el, "clear");
    if (!editable(el)) throw new Error(`userEvent.clear: ${fmt(el)} can't be typed in.`);
    if (el.disabled || el.readOnly) return;
    el.focus();
    if (el.isContentEditable) { el.textContent = ""; dispatch(el, "input", { inputType: "deleteContentBackward" }); }
    else if ((el.value ?? "") !== "") { try { el.setSelectionRange(0, el.value.length); } catch {} if (dispatch(el, "beforeinput", { inputType: "deleteContentBackward" })) { setValue(el, ""); dispatch(el, "input", { inputType: "deleteContentBackward" }); } }
    dispatch(el, "change");
    await act();
  },
  // paste("text") into what has focus; paste(el, "text") as user-event 13 had it.
  async paste(a, b) {
    let el = document.activeElement ?? document.body, text = a;
    if (a instanceof Element) { el = a; text = b; el.focus(); }
    const data = typeof text === "string" ? text : text?.getData?.("text/plain") ?? String(text ?? "");
    let clip;
    try { clip = new DataTransfer(); clip.setData("text/plain", data); } catch { clip = { getData: (t) => /text/.test(t) ? data : "", types: ["text/plain"], files: [] }; }
    if (dispatch(el, "paste", { clipboardData: clip }) && editable(el)) insert(el, data, "insertFromPaste");
    await act();
  },
  async selectOptions(el, values) { await choose(el, values, true); },
  async deselectOptions(el, values) { await choose(el, values, false); },
  async tab(o = {}) {
    const els = all(document.body).filter(focusable);
    if (!els.length) return;
    const i = els.indexOf(document.activeElement);
    const next = o.shift ? els[(i <= 0 ? els.length : i) - 1] : els[(i + 1) % els.length];
    const from = document.activeElement ?? document.body;
    dispatch(from, "keydown", { key: "Tab", shiftKey: !!o.shift });
    next.focus();
    dispatch(next, "keyup", { key: "Tab", shiftKey: !!o.shift });
    await act();
  },
  async hover(el) { usable(el, "hover"); for (const t of ["pointerover", "pointerenter", "mouseover", "mouseenter", "pointermove", "mousemove"]) dispatch(el, t); await act(); },
  async unhover(el) { for (const t of ["pointermove", "mousemove", "pointerout", "pointerleave", "mouseout", "mouseleave"]) dispatch(el, t); await act(); },
  async upload(el, files) {
    usable(el, "upload");
    const input = el.tagName === "LABEL" ? el.control : el;
    if (!input || input.type !== "file") throw new Error("userEvent.upload: give it an <input type=\"file\"> or its label.");
    if (input.disabled) return;
    const list = [files].flat().slice(0, input.multiple ? undefined : 1);
    let fl;
    try { const dt = new DataTransfer(); for (const f of list) dt.items.add(f); fl = dt.files; } catch { fl = Object.assign([...list], { item: (i) => list[i] ?? null }); }
    Object.defineProperty(input, "files", { value: fl, configurable: true });
    dispatch(input, "input"); dispatch(input, "change");
    await act();
  },
  pointer: () => unsupported("userEvent.pointer", "Use click, dblClick, hover or fireEvent.pointerDown/Move/Up."),
  copy: () => unsupported("userEvent.copy", "Check what the app put on the clipboard another way."),
  cut: () => unsupported("userEvent.cut"),
};
async function choose(el, values, on) {
  usable(el, on ? "selectOptions" : "deselectOptions");
  const want = [values].flat();
  const hit = (o) => want.some((v) => v === o || (typeof v === "string" && (o.value === v || clean(o.textContent) === clean(v))));
  if (el.tagName === "SELECT") {
    const opts = [...el.options];
    for (const v of want) if (!opts.some((o) => o === v || o.value === v || clean(o.textContent) === clean(String(v)))) throw new Error(`userEvent.selectOptions: no option ${fmt(v)}. Options: ${opts.map((o) => fmt(o.textContent)).join(", ")}`);
    if (!on && !el.multiple) throw new Error("userEvent.deselectOptions: only a <select multiple> can deselect.");
    el.focus();
    for (const o of opts) if (hit(o)) { if (el.multiple) o.selected = on; else setValue(el, o.value); dispatch(o, "pointerdown"); dispatch(o, "click"); }
    dispatch(el, "input"); dispatch(el, "change");
  } else {
    // A listbox of role="option" elements (radix-ui's Select): each is clicked.
    const opts = [...(el.ownerDocument ?? document).querySelectorAll('[role="option"]')];
    for (const v of want) { const o = v instanceof Element ? v : opts.find((x) => matches(nameOf(x), v)); if (!o) throw new Error(`userEvent.selectOptions: no option ${fmt(v)} on the screen. Open the list first (click it), then choose.`); await user.click(o); }
  }
  await act();
}
const userApi = (bound) => strict({ ...user, setup: () => userApi(true) }, bound ? "user." : "userEvent.", "It has click, dblClick, tripleClick, type, keyboard, clear, paste, selectOptions, deselectOptions, tab, hover, unhover and upload.");
export const userEvent = userApi(false);
export default userEvent;
