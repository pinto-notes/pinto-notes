// Real drags of notes in a running Pinto Notes, the way a hand makes them, and what each one did.
// Run by scripts/note-drags.sh on the measuring Mac, never on a Mac someone is working at: it
// moves the pointer and presses.
//
//   NoteDrags <pid> [row | undo-menu | two | text | self]
//
// With the made-up library (`-uitest -demo`), one step per launch: a note dragged onto another
// note's row becomes its sub-note and the list opens that note; Edit > Undo puts it back; two
// selected notes go together; a note dragged into the open note's text is linked there and stays
// in the list; a note dropped on itself changes nothing. What happened is read through
// Accessibility. Keys typed by a tool over ssh don't reach the app, so Undo is chosen from the
// menu bar. Exits 1 when a step didn't do what it should.
import AppKit
import ApplicationServices

func attr<T>(_ e: AXUIElement, _ name: String) -> T? {
    var v: CFTypeRef?
    guard AXUIElementCopyAttributeValue(e, name as CFString, &v) == .success else { return nil }
    return v as? T
}
func role(_ e: AXUIElement) -> String { attr(e, kAXRoleAttribute) ?? "" }
func frame(_ e: AXUIElement) -> CGRect {
    var p = CGPoint.zero, s = CGSize.zero
    if let v: AXValue = attr(e, kAXPositionAttribute) { AXValueGetValue(v, .cgPoint, &p) }
    if let v: AXValue = attr(e, kAXSizeAttribute) { AXValueGetValue(v, .cgSize, &s) }
    return CGRect(origin: p, size: s)
}
func find(_ e: AXUIElement, shallow: Bool = false, depth: Int = 0, _ match: (AXUIElement) -> Bool) -> [AXUIElement] {
    var out = match(e) ? [e] : []
    if depth > 40 || (shallow && ["AXOutline", "AXTable", "AXToolbar"].contains(role(e))) { return out }
    for k in (attr(e, kAXChildrenAttribute) as [AXUIElement]?) ?? [] { out += find(k, shallow: shallow, depth: depth + 1, match) }
    return out
}
func post(_ type: CGEventType, _ p: CGPoint, flags: CGEventFlags = []) {
    guard let e = CGEvent(mouseEventSource: CGEventSource(stateID: .hidSystemState), mouseType: type, mouseCursorPosition: p, mouseButton: .left) else { return }
    if type != .mouseMoved { e.setIntegerValueField(.mouseEventClickState, value: 1) }
    e.flags = flags
    e.post(tap: .cghidEventTap)
}
func wait(_ seconds: Double) { usleep(useconds_t(seconds * 1_000_000)) }

setbuf(stdout, nil)
guard CommandLine.arguments.count >= 2, let pid = pid_t(CommandLine.arguments[1]) else { print("usage: NoteDrags <pid>"); exit(2) }
let app = AXUIElementCreateApplication(pid)
AXUIElementSetMessagingTimeout(app, 5)
guard let window: AXUIElement = attr(app, kAXMainWindowAttribute) ?? (attr(app, kAXWindowsAttribute) as [AXUIElement]?)?.first else {
    print("No window to read: is this allowed to use Accessibility, and is the app's window open?"); exit(2)
}
let lists = find(window) { ["AXOutline", "AXTable"].contains(role($0)) }
let notSidebar = lists.filter { (attr($0, kAXDescriptionAttribute) as String?) != "Sidebar" }
guard let list = (notSidebar.isEmpty ? lists : notSidebar).max(by: { frame($0).minX < frame($1).minX }) else {
    // What the window holds instead, to tell a welcome card from a window that isn't ready.
    let seen = find(window) { _ in true }.prefix(60).map { "\(role($0)) \((attr($0, kAXTitleAttribute) as String?) ?? (attr($0, kAXValueAttribute) as String?) ?? "")" }
    print("No note list in the window. It holds: \(seen.joined(separator: " | "))"); exit(2)
}

func rows() -> [AXUIElement] { attr(list, kAXRowsAttribute) ?? [] }
/// A note row's title: the row is named `note.<title>` for Accessibility.
func title(_ row: AXUIElement) -> String? {
    find(row) { _ in true }.compactMap { attr($0, kAXIdentifierAttribute) as String? }.first { $0.hasPrefix("note.") }.map { String($0.dropFirst(5)) }
}
func titles() -> [String] { rows().compactMap(title) }
func row(_ name: String) -> AXUIElement? { rows().first { title($0) == name } }
func center(_ title: String) -> CGPoint? { row(title).map { CGPoint(x: frame($0).midX, y: frame($0).midY) } }
/// The middle of a note's row, or the run ends saying which row is missing.
func at(_ title: String) -> CGPoint {
    guard let p = center(title) else { print("FAIL no row \"\(title)\" in the list now: \(titles())"); exit(1) }
    return p
}
func editor() -> AXUIElement? { find(window, shallow: true) { role($0) == "AXTextArea" && (attr($0, kAXIdentifierAttribute) as String?) == "editor" }.first }
func editorText() -> String { editor().flatMap { attr($0, kAXValueAttribute) as String? } ?? "" }

func click(_ p: CGPoint, flags: CGEventFlags = []) {
    post(.mouseMoved, p); wait(0.15)
    post(.leftMouseDown, p, flags: flags); wait(0.06)
    post(.leftMouseUp, p, flags: flags); wait(0.7)
}
/// Press, a pause as a hand makes, a glide to `to`, a rest over it, and let go.
func drag(from: CGPoint, to: CGPoint) {
    post(.mouseMoved, from); wait(0.2)
    post(.leftMouseDown, from); wait(0.25)
    let steps = 40
    for i in 1...steps {
        let t = Double(i) / Double(steps)
        post(.leftMouseDragged, CGPoint(x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t))
        wait(0.02)
    }
    // A little movement over the target: a drop target only knows the pointer by its moves.
    for d in [1.0, -1, 1, 0] { post(.leftMouseDragged, CGPoint(x: to.x + d, y: to.y)); wait(0.15) }
    post(.leftMouseUp, to); wait(1.2)
}
/// Edit > Undo, chosen from the menu bar.
func undoMenu() {
    guard let bar: AXUIElement = attr(app, kAXMenuBarAttribute),
          let item = find(bar, { role($0) == "AXMenuItem" && ((attr($0, kAXTitleAttribute) as String?) ?? "").hasPrefix("Undo") }).first else { return }
    AXUIElementPerformAction(item, kAXPressAction as CFString)
    wait(1.0)
}

var failed = 0
func check(_ ok: Bool, _ what: String) {
    print("\(ok ? "ok  " : "FAIL") \(what)")
    if !ok { failed += 1 }
}

let view = frame(window)
let all = rows().filter { view.contains(frame($0)) }.compactMap(title)
guard all.count >= 5 else { print("Fewer than five notes in view."); exit(2) }
// Plain notes of the made-up library when they are in view, or the last five.
let wanted = ["Standup notes", "Reading list", "Snippets", "Q4 goals", "Packing"]
let pick = wanted.allSatisfy(all.contains) ? wanted : Array(all.suffix(5))
let parent = pick[0], one = pick[1], two = pick[2], three = pick[3], other = pick[4]

// A plain note is open while notes are dragged: not one of these.
if let elsewhere = (all.contains("Groceries") ? "Groceries" : all.first(where: { !pick.contains($0) })) { click(at(elsewhere)) }
// Each step starts from the library as it was made: the app is opened again for each.
let step = CommandLine.arguments.count > 2 ? CommandLine.arguments[2] : "row"

switch step {
case "row":
    print("\n\"\(one)\" dragged onto the row of \"\(parent)\"")
    drag(from: at(one), to: at(parent))
    check(!titles().contains(one), "the dragged note left the list")
    check(titles().contains(parent), "the note it was dropped on is still there")
    // The list opens the note it was dropped on: its text ends with the sub-note's line.
    wait(2.5)
    let text = editorText()
    check(text.contains("[\(one)](pane-note:"), "the parent is open and its text ends with the sub-note's line: …\(text.suffix(70).replacingOccurrences(of: "\n", with: "⏎"))")
    // And the list takes plain clicks again, one note at a time (the app says what it selected).
    for name in ["Standup notes", "Groceries"].filter({ titles().contains($0) }) { click(at(name)); wait(1.2) }
    check(editor() != nil, "a click afterwards opens one note, not a selection of several")
case "undo-menu":
    print("\n\"\(one)\" dragged onto the row of \"\(parent)\", then Edit > Undo")
    drag(from: at(one), to: at(parent))
    check(!titles().contains(one), "the dragged note left the list")
    undoMenu()
    check(titles().contains(one), "Undo put the note back in the list")
case "two":
    print("\n\"\(two)\" and \"\(three)\" selected, dragged onto \"\(other)\"")
    click(at(three))
    click(at(two), flags: .maskCommand)
    drag(from: at(two), to: at(other))
    check(!titles().contains(two) && !titles().contains(three), "both left the list")
    undoMenu()
    check(titles().contains(two) && titles().contains(three), "Undo put both back")
case "text":
    print("\n\"\(two)\" dragged into the text of \"\(parent)\"")
    click(at(parent))
    let before = editorText()
    if let e = editor() {
        let f = frame(e)
        drag(from: at(two), to: CGPoint(x: f.minX + min(260, f.width / 2), y: f.minY + min(150, f.height / 2)))
    }
    let after = editorText()
    check(after.contains("[[\(two)]]"), "a link to it is in the text: …\(after.replacingOccurrences(of: "\n", with: "⏎").prefix(220))")
    check(after != before && titles().contains(two), "and the note is still in the list: nothing moved")
case "self":
    print("\n\"\(three)\" dragged a little and dropped on its own row")
    let count = titles().count
    let c = at(three)
    drag(from: c, to: CGPoint(x: c.x + 60, y: c.y + 4))
    check(titles().count == count && titles().contains(three), "nothing changed")
default:
    print("unknown step \(step)"); exit(2)
}


exit(failed == 0 ? 0 : 1)
