#if os(iOS)
import SwiftData
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The notes at iPad and iPhone Duo sizes (Emil, 3 November 2026). The real RootView in a window
/// of the iOS test host, given the window's size and width class the way the system gives them:
/// the Duo open is an iPhone with a regular width (about 669 × 951 points), closed a compact one.
/// Folding and unfolding changes the width class while the app runs; the open note must stay.
/// With TEST_RUNNER_PANE_WIDE_SHOTS=<dir> each layout is also written out as a PNG.
@MainActor @Suite(.serialized) struct WideLayoutTests {
    struct Layout {
        let name: String
        let size: CGSize
        let width: UIUserInterfaceSizeClass
    }
    static let duoOpen = Layout(name: "duo-open", size: CGSize(width: 669, height: 951), width: .regular)
    static let duoOpenWide = Layout(name: "duo-open-landscape", size: CGSize(width: 951, height: 669), width: .regular)
    static let duoClosed = Layout(name: "duo-closed", size: CGSize(width: 375, height: 812), width: .compact)

    static func window(_ layout: Layout, notes: Int = 12) throws -> (UIWindow, UIHostingController<AnyView>, ModelContainer, [Note]) {
        UserDefaults.standard.removeObject(forKey: "lastScope")
        UserDefaults.standard.removeObject(forKey: "lastNote")
        // Trying the column looks (ColumnLook): TEST_RUNNER_PANE_COLUMN_LOOK=A|B|C.
        UserDefaults.standard.set(ProcessInfo.processInfo.environment["PANE_COLUMN_LOOK"], forKey: "columnLook")
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let (c, list) = try PhoneRenderTests.library(notes: notes)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: layout.size)
        let host = UIHostingController(rootView: AnyView(RootView().modelContainer(c)))
        host.traitOverrides.horizontalSizeClass = layout.width
        window.rootViewController = host
        window.isHidden = false
        return (window, host, c, list)
    }

    /// Folding or unfolding: the window takes the other screen's size and width class.
    static func change(_ window: UIWindow, _ host: UIViewController, to layout: Layout) async {
        window.frame = CGRect(origin: .zero, size: layout.size)
        host.traitOverrides.horizontalSizeClass = layout.width
        await PhoneRenderTests.settle(window, seconds: 1)
    }

    static func shoot(_ window: UIWindow, _ name: String) {
        guard let dir = ProcessInfo.processInfo.environment["PANE_WIDE_SHOTS"] else { return }
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let image = UIGraphicsImageRenderer(bounds: window.bounds).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        try? image.pngData()?.write(to: URL(fileURLWithPath: dir).appending(path: "\(name).png"))
    }

    static func showing(_ note: Note, in window: UIWindow) -> Bool {
        PhoneRenderTests.editor(in: window)?.text.contains(note.title) == true
    }

    /// A list with rows on screen, left of the open note.
    static func listBesideNote(in window: UIWindow) -> Bool {
        guard let editor = PhoneRenderTests.editor(in: window) else { return false }
        let noteLeft = editor.convert(editor.bounds, to: nil).minX
        return PhoneRenderTests.all(UICollectionView.self, in: window).contains {
            $0.window != nil && !$0.isHidden && !$0.visibleCells.isEmpty && $0.convert($0.bounds, to: nil).maxX <= noteLeft + 1
        }
    }

    /// The search field at the list's foot, as wide as its words need ("Search", not "S…").
    static func searchFieldWidth(in window: UIWindow) -> CGFloat? {
        PhoneRenderTests.all(UISearchTextField.self, in: window).filter { $0.window != nil && !$0.isHidden }.map(\.bounds.width).max()
    }

    /// Open like a book (wider than tall): the list is the left half and the note the right, so
    /// the fold runs between them and not through the note's text (Emil, 3 November 2026).
    @Test func duoOpenSplitsAtTheFold() async throws {
        let (window, _, _, notes) = try Self.window(Self.duoOpenWide)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[2], in: window)
        await PhoneRenderTests.settle(window)
        Self.shoot(window, "duo-open-wide-note")
        #expect(Self.showing(notes[2], in: window), "the note is open")
        #expect(PhoneRenderTests.navigation(in: window) == nil, "as columns, not pushed onto a stack")
        #expect(Self.listBesideNote(in: window), "the list is beside it")
        let editor = try #require(PhoneRenderTests.editor(in: window))
        let noteLeft = editor.convert(editor.bounds, to: nil).minX
        #expect(abs(noteLeft - Self.duoOpenWide.size.width / 2) <= 2, "the note starts at the fold (\(noteLeft) pt)")
        let search = Self.searchFieldWidth(in: window)
        #expect(search.map { $0 >= 120 } ?? true, "search isn't squeezed to \"S…\" (\(search ?? 0) pt)")
    }

    /// Held upright the columns are too narrow to share: the note takes the whole width, and the
    /// list comes over it from the button at the top left.
    @Test func duoUprightShowsTheNoteWhole() async throws {
        let (window, _, _, notes) = try Self.window(Self.duoOpen)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[2], in: window)
        await PhoneRenderTests.settle(window)
        Self.shoot(window, "duo-upright-note")
        let editor = try #require(PhoneRenderTests.editor(in: window))
        #expect(editor.convert(editor.bounds, to: nil).minX < 2, "the note from the window's left edge")
        #expect(!Self.listBesideNote(in: window), "no list squeezed beside it")
    }

    @Test func unfoldingKeepsTheOpenNote() async throws {
        let (window, host, _, notes) = try Self.window(Self.duoClosed)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[3], in: window)
        await PhoneRenderTests.settle(window)
        Self.shoot(window, "duo-closed-note")
        #expect(Self.showing(notes[3], in: window))

        await Self.change(window, host, to: Self.duoOpen)
        Self.shoot(window, "duo-unfolded-note")
        #expect(Self.showing(notes[3], in: window), "unfolding keeps the note open")

        await Self.change(window, host, to: Self.duoOpenWide)
        Self.shoot(window, "duo-open-landscape-note")
        #expect(Self.showing(notes[3], in: window), "turning it keeps the note open")

        await Self.change(window, host, to: Self.duoClosed)
        Self.shoot(window, "duo-folded-note")
        #expect(Self.showing(notes[3], in: window), "folding again keeps the note open")
    }

    @Test func unfoldingFromTheListOpensNoNote() async throws {
        let (window, host, _, _) = try Self.window(Self.duoClosed)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        // A launch reopens the note edited last (RootView.restoreNote); Back to the list first.
        if PhoneRenderTests.editor(in: window) != nil { try await PhoneRenderTests.back(in: window) }
        await PhoneRenderTests.settle(window)
        Self.shoot(window, "duo-closed-start")
        await Self.change(window, host, to: Self.duoOpen)
        Self.shoot(window, "duo-unfolded-start")
        await Self.change(window, host, to: Self.duoClosed)
        Self.shoot(window, "duo-folded-start")
        #expect(PhoneRenderTests.editor(in: window) == nil, "no note opened by itself")
    }
}
#endif
