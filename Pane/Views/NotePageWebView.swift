#if os(macOS)
import AppKit
import WebKit

/// The web view every note page runs in on the Mac. An ordinary page gets WebKit's behaviour; a
/// canvas (CanvasBridge) gets the Mac's own:
///
/// - Right-click and drag pans the drawing, as in Miro and Freeform. A right click that doesn't move
///   opens the app's menu for the canvas (Duplicate, Delete, Bring to Front…), never the web view's.
///   (On the Mac the web view's menu opens on the press, so a drag could never start: Emil,
///   13 November 2026, "right clicking to drag is not working".)
/// - Edit › Undo and Redo reach the drawing's own history, not the window's.
/// - Two-finger scrolling, pinching, middle-button drag and space-drag reach the page as they are:
///   the engine pans and zooms on them itself.
final class NotePageWebView: WKWebView {
    /// The canvas this view shows, while it shows one.
    weak var canvas: CanvasController?

    /// How far a right press moves before it's a pan, not a click (points).
    static let dragSlop: CGFloat = 3

    /// Shows the canvas's menu. Tests put their own here: the real one tracks the mouse until it closes.
    var presentMenu: (NSMenu, NSEvent, NSView) -> Void = { menu, event, view in NSMenu.popUpContextMenu(menu, with: event, for: view) }

    private var rightStart: NSPoint?
    private var rightLast: NSPoint?
    private(set) var panning = false

    // MARK: Right button

    override func rightMouseDown(with event: NSEvent) {
        guard canvas != nil else { return super.rightMouseDown(with: event) }
        window?.makeFirstResponder(self)
        rightStart = event.locationInWindow
        rightLast = event.locationInWindow
        panning = false
    }

    override func rightMouseDragged(with event: NSEvent) {
        guard let canvas, let start = rightStart, let last = rightLast else { return super.rightMouseDragged(with: event) }
        let p = event.locationInWindow
        if !panning, hypot(p.x - start.x, p.y - start.y) < Self.dragSlop { return }
        if !panning {
            panning = true
            NSCursor.closedHand.push()
        }
        // The window's y runs up; the page's runs down.
        canvas.send(.pan(dx: Double(p.x - last.x), dy: Double(last.y - p.y)))
        rightLast = p
    }

    override func rightMouseUp(with event: NSEvent) {
        guard canvas != nil, rightStart != nil else { return super.rightMouseUp(with: event) }
        let wasPanning = panning
        rightStart = nil
        rightLast = nil
        panning = false
        if wasPanning {
            NSCursor.pop()
        } else {
            presentMenu(canvasMenu(), event, self)
        }
    }

    /// The canvas's own menu: what acts on the selection, then the whole drawing.
    func canvasMenu() -> NSMenu {
        let menu = NSMenu(title: "Whiteboard")
        let selected = canvas?.state.hasSelection ?? false
        func item(_ title: String, _ action: CanvasCommand.Action, enabled: Bool = true) -> NSMenuItem {
            let i = CanvasMenuItem(title: title) { [weak self] in self?.canvas?.run(action) }
            i.isEnabled = enabled
            return i
        }
        menu.autoenablesItems = false
        menu.addItem(item("Duplicate", .duplicate, enabled: selected))
        menu.addItem(item("Delete", .delete, enabled: selected))
        menu.addItem(.separator())
        menu.addItem(item("Bring to Front", .bringToFront, enabled: selected))
        menu.addItem(item("Bring Forward", .bringForward, enabled: selected))
        menu.addItem(item("Send Backward", .sendBackward, enabled: selected))
        menu.addItem(item("Send to Back", .sendToBack, enabled: selected))
        menu.addItem(.separator())
        menu.addItem(item("Select All", .selectAll))
        menu.addItem(item("Zoom to Fit", .zoomToFit))
        return menu
    }

    /// Never the web view's own menu over a canvas (Reload, Inspect Element…). The page stops it
    /// too; this is the backstop for a Control-click.
    override func willOpenMenu(_ menu: NSMenu, with event: NSEvent) {
        if canvas != nil { menu.removeAllItems() }
        super.willOpenMenu(menu, with: event)
    }

    // MARK: Undo and Redo

    @objc func undo(_ sender: Any?) {
        guard let canvas else { _ = nextResponder?.tryToPerform(#selector(undo(_:)), with: sender); return }
        canvas.run(.undo)
    }

    @objc func redo(_ sender: Any?) {
        guard let canvas else { _ = nextResponder?.tryToPerform(#selector(redo(_:)), with: sender); return }
        canvas.run(.redo)
    }

    override func responds(to selector: Selector!) -> Bool {
        if selector == #selector(undo(_:)) || selector == #selector(redo(_:)) { return canvas != nil }
        return super.responds(to: selector)
    }

    override func validateUserInterfaceItem(_ item: any NSValidatedUserInterfaceItem) -> Bool {
        if let canvas {
            if item.action == #selector(undo(_:)) { return canvas.canUndo }
            if item.action == #selector(redo(_:)) { return canvas.canRedo }
        }
        return super.validateUserInterfaceItem(item)
    }
}

/// A menu item that runs a closure.
final class CanvasMenuItem: NSMenuItem {
    private let run: () -> Void

    init(title: String, run: @escaping () -> Void) {
        self.run = run
        super.init(title: title, action: #selector(fire), keyEquivalent: "")
        target = self
    }

    required init(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func fire() { run() }
}
#endif
