// Real clicks on the note list of a running Pinto Notes, the way a hand makes them, and what each
// one did (docs/Technical/release-gate.md, "Clicks"). Run by scripts/row-clicks.sh on the measuring
// Mac, never on a Mac someone is working at: it moves the pointer and clicks.
//
//   RowClicks <pid> [budget ms] [median budget ms]
//
// Each note row in view is pressed and lifted with the pointer travelling 0, 1, 2 and 3 points in
// between, which is what a hand on a mouse or a trackpad does. Read through Accessibility after
// each: did the list select that row and does the editor hold another note's text, and how long
// from the press until the app answered with both (the main thread is free again and the note is
// there). Exits 1 when a click opened nothing, one took longer than the budget, or the median of
// them all is over the median budget.
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
/// Every element under `e` that matches; lists and toolbars are not looked into when `shallow`.
func find(_ e: AXUIElement, shallow: Bool = false, depth: Int = 0, _ match: (AXUIElement) -> Bool) -> [AXUIElement] {
    var out = match(e) ? [e] : []
    if depth > 40 || (shallow && ["AXOutline", "AXTable", "AXToolbar"].contains(role(e))) { return out }
    for k in (attr(e, kAXChildrenAttribute) as [AXUIElement]?) ?? [] { out += find(k, shallow: shallow, depth: depth + 1, match) }
    return out
}
func now() -> Double { Double(DispatchTime.now().uptimeNanoseconds) / 1e6 }
func post(_ type: CGEventType, _ p: CGPoint) {
    guard let e = CGEvent(mouseEventSource: CGEventSource(stateID: .hidSystemState), mouseType: type, mouseCursorPosition: p, mouseButton: .left) else { return }
    if type != .mouseMoved { e.setIntegerValueField(.mouseEventClickState, value: 1) }
    e.post(tap: .cghidEventTap)
}

let args = CommandLine.arguments
guard args.count >= 2, let pid = pid_t(args[1]) else { print("usage: RowClicks <pid> [budget ms]"); exit(2) }
let budget = args.count > 2 ? Double(args[2]) ?? 500 : 500
let medianBudget = args.count > 3 ? Double(args[3]) ?? 210 : 210
let app = AXUIElementCreateApplication(pid)
AXUIElementSetMessagingTimeout(app, 5)
guard let window: AXUIElement = attr(app, kAXMainWindowAttribute) ?? (attr(app, kAXWindowsAttribute) as [AXUIElement]?)?.first else {
    print("No window to read: is this allowed to use Accessibility, and is the app's window open?"); exit(2)
}
// The note list: the list that isn't the sidebar.
let lists = find(window) { ["AXOutline", "AXTable"].contains(role($0)) }
let notSidebar = lists.filter { (attr($0, kAXDescriptionAttribute) as String?) != "Sidebar" }
guard let list = (notSidebar.isEmpty ? lists : notSidebar).max(by: { frame($0).minX < frame($1).minX }) else {
    print("No note list in the window."); exit(2)
}
func rows() -> [AXUIElement] { attr(list, kAXRowsAttribute) ?? [] }
func selected() -> [Int] { ((attr(list, kAXSelectedRowsAttribute) as [AXUIElement]?) ?? []).compactMap { attr($0, kAXIndexAttribute) as Int? } }
func editorText() -> String? {
    find(window, shallow: true) { role($0) == "AXTextArea" && (attr($0, kAXIdentifierAttribute) as String?) == "editor" }.first.flatMap { attr($0, kAXValueAttribute) as String? }
}

// Note rows wholly in view (a section's header is shorter).
let view = frame(window)
let targets = rows().enumerated().filter { frame($0.element).height >= 40 && view.contains(frame($0.element)) }.map(\.offset)
guard targets.count >= 3 else { print("Fewer than three note rows in view (\(targets.count)): the library needs a few notes."); exit(2) }

var missed = 0, slow = 0, times: [Double] = []
for travel in [0.0, 1, 2, 3] {
    // Each row in turn, never the one that is already open.
    for target in targets + targets.prefix(1) where selected() != [target] {
        let f = frame(rows()[target])
        let p = CGPoint(x: f.midX, y: f.midY), lift = CGPoint(x: p.x + travel, y: p.y + travel / 2)
        let before = editorText()
        // Arrive as a hand does: a short glide onto the row, a pause, then the press.
        for i in 0..<8 { post(.mouseMoved, CGPoint(x: p.x - 40 + Double(i) * 5, y: p.y - 8 + Double(i))); usleep(8000) }
        post(.mouseMoved, p); usleep(120_000)
        let pressed = now()
        post(.leftMouseDown, p); usleep(40_000)
        if travel > 0 { post(.leftMouseDragged, lift) }
        usleep(40_000)
        post(.leftMouseUp, lift)
        var opened: Double?
        while opened == nil, now() - pressed < 1500 {
            // The app answers when its main thread is free again: after the note has been put up.
            let isSelected = selected() == [target], text = editorText()
            if isSelected, let text, text != before { opened = now() - pressed } else { usleep(4000) }
        }
        if let opened {
            times.append(opened)
            if opened > budget { slow += 1 }
            print("row \(target), pointer travel \(Int(travel)) pt: opened in \(Int(opened)) ms\(opened > budget ? "  OVER \(Int(budget)) ms" : "")")
        } else {
            missed += 1
            print("row \(target), pointer travel \(Int(travel)) pt: NOTHING OPENED (selected rows \(selected()))")
            // Leave whatever state the lost click made: a plain click on another row.
            post(.leftMouseDown, p); usleep(60_000); post(.leftMouseUp, p)
        }
        usleep(700_000)
    }
}
let sorted = times.sorted()
let median = sorted.isEmpty ? 0 : sorted[sorted.count / 2]
print("\(times.count + missed) clicks: \(missed) opened nothing, \(slow) over \(Int(budget)) ms" + (sorted.isEmpty ? "" : "; press to note median \(Int(median)) ms\(median > medianBudget ? " OVER \(Int(medianBudget)) ms" : ""), slowest \(Int(sorted.last!)) ms"))
exit(missed + slow == 0 && median <= medianBudget ? 0 : 1)
