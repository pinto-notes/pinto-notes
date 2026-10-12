#if os(macOS)
import AppKit
import OSLog

/// What a click in the note list did, in every build, the released app's too, so a click that
/// selects nothing can be read back afterwards instead of guessed at. On 2026-10-12 the list of
/// the owner's 1.2.8 refused every click and the Down arrow for minutes after the app came to the
/// front, then let go; scripted clicks never reproduce it. Read it with
///
///     log show --last 30m --info --predicate 'subsystem == "dev.emilwagman.pane" AND category == "rowclick"'
///
/// Local system log lines only, nothing sent anywhere. No note or file names and no text: ids cut
/// to 8 characters, row numbers, view class names, event kinds and states.
///
/// Per press: the mouse down and up as the window got them (before any view did), the row under
/// each, the views under the pointer with the state of every gesture recognizer on them (a
/// recognizer left mid-gesture is one way a view stops taking clicks), the list's selection before
/// and after, and whether the change came from the list itself (a click or a key) or from code.
/// Also the app becoming active or not, the window becoming key or not, and arrow keys.
enum RowClickLog {
    private static let log = Logger(subsystem: "dev.emilwagman.pane", category: "rowclick")

    @MainActor private static var monitor: Any?
    @MainActor private static var observers: [NSObjectProtocol] = []
    @MainActor private static var downAt: Int?
    @MainActor private static var dragged = false
    /// The list's selection binding was set by the list (a click, a key) since the last change.
    @MainActor private static var fromList = false

    /// Starts watching the app's own mouse and arrow-key events, once.
    @MainActor static func start() {
        guard monitor == nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .leftMouseDragged, .leftMouseUp, .keyDown]) { event in
            MainActor.assumeIsolated { note(event) }
            return event
        }
        let center = NotificationCenter.default
        for (name, what) in [(NSApplication.didBecomeActiveNotification, "app active"), (NSApplication.didResignActiveNotification, "app not active"),
                             (NSWindow.didBecomeKeyNotification, "window key"), (NSWindow.didResignKeyNotification, "window not key")] {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { n in
                let number = (n.object as? NSWindow)?.windowNumber ?? 0
                log.notice("\(what, privacy: .public)\(number == 0 ? "" : " \(number)", privacy: .public)")
            })
        }
        log.notice("rowclick logging on")
    }

    @MainActor private static func note(_ event: NSEvent) {
        guard let window = event.window, let content = window.contentView else { return }
        if event.type == .keyDown {
            // Arrow keys only (up, down), and where they went.
            guard [125, 126].contains(event.keyCode) else { return }
            log.notice("arrow \(event.keyCode == 125 ? "down" : "up", privacy: .public) to \(name(window.firstResponder), privacy: .public)")
            return
        }
        let hit = content.hitTest(content.convert(event.locationInWindow, from: nil))
        guard let table = enclosingTable(hit) else { return }
        let row = table.row(at: table.convert(event.locationInWindow, from: nil))
        let selected = Array(table.selectedRowIndexes).map(String.init).joined(separator: ",")
        switch event.type {
        case .leftMouseDown:
            downAt = row
            dragged = false
            log.notice("down row \(row, privacy: .public) clicks \(event.clickCount, privacy: .public) mods \(event.modifierFlags.rawValue & 0xFFFF0000, privacy: .public) active \(NSApp.isActive, privacy: .public) key \(window.isKeyWindow, privacy: .public) firstResponder \(name(window.firstResponder), privacy: .public) selected [\(selected, privacy: .public)]")
            log.notice("down views \(chain(hit), privacy: .public)")
        case .leftMouseDragged:
            guard !dragged else { return }
            dragged = true
            log.notice("dragged from row \(downAt ?? -2, privacy: .public)")
        case .leftMouseUp:
            log.notice("up row \(row, privacy: .public) (down \(downAt ?? -2, privacy: .public), dragged \(dragged, privacy: .public)) selected [\(selected, privacy: .public)] views \(chain(hit), privacy: .public)")
            // What the table settled on once the click is handled.
            Task { @MainActor in
                let after = Array(table.selectedRowIndexes).map(String.init).joined(separator: ",")
                log.notice("after up selected [\(after, privacy: .public)] firstResponder \(name(window.firstResponder), privacy: .public)")
            }
        default: break
        }
    }

    /// The list set its selection binding (a click or a key in the list).
    @MainActor static func listSet(_ old: Set<UUID>, _ new: Set<UUID>) {
        fromList = true
        log.notice("list sets \(short(old), privacy: .public) -> \(short(new), privacy: .public)")
    }

    /// The selection changed, by the list or by code.
    @MainActor static func selection(_ old: Set<UUID>, _ new: Set<UUID>) {
        log.notice("selection \(short(old), privacy: .public) -> \(short(new), privacy: .public) by \(fromList ? "the list" : "code", privacy: .public)")
        fromList = false
    }

    /// A file row's drag began (the List asked it for its item).
    static func dragStarted(_ id: UUID) {
        log.notice("drag provider asked for file \(String(id.uuidString.prefix(8)), privacy: .public)")
    }

    private static func short(_ ids: Set<UUID>) -> String {
        "[" + ids.map { String($0.uuidString.prefix(8)) }.sorted().joined(separator: ",") + "]"
    }

    private static func name(_ responder: NSResponder?) -> String {
        responder.map { String(describing: type(of: $0)).prefix(60).description } ?? "none"
    }

    private static func enclosingTable(_ view: NSView?) -> NSTableView? {
        var v = view
        while let x = v {
            if let t = x as? NSTableView { return t }
            v = x.superview
        }
        return nil
    }

    /// The hit view and its ancestors up to the table, by class (cut short), each with its gesture
    /// recognizers and their states (0 possible, 1 began, 2 changed, 3 ended, 4 cancelled, 5 failed).
    private static func chain(_ view: NSView?) -> String {
        var parts: [String] = []
        var v = view
        while let x = v, parts.count < 8 {
            var part = String(String(describing: type(of: x)).prefix(40))
            let recognizers = x.gestureRecognizers.map { "\(String(describing: type(of: $0)).prefix(30)):\($0.state.rawValue)\($0.isEnabled ? "" : "off")" }
            if !recognizers.isEmpty { part += "{" + recognizers.joined(separator: " ") + "}" }
            parts.append(part)
            if x is NSTableView { break }
            v = x.superview
        }
        return parts.joined(separator: " < ")
    }
}
#endif
