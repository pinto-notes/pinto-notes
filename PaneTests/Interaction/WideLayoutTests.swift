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
        #expect(Self.listBesideNote(in: window), "the list is beside it")
        let editor = try #require(PhoneRenderTests.editor(in: window))
        let noteLeft = editor.convert(editor.bounds, to: nil).minX
        #expect(abs(noteLeft - Self.duoOpenWide.size.width / 2) <= 2, "the note starts at the fold (\(noteLeft) pt)")
        let search = Self.searchFieldWidth(in: window)
        #expect(search.map { $0 >= 120 } ?? true, "search isn't squeezed to \"S…\" (\(search ?? 0) pt)")
    }

    /// Held upright the columns are too narrow to share: the note takes the whole width, and the
    /// list comes over it from the button at the top left.
    /// On a real Duo open like a book the window's geometry leaves out the strip for the clock and
    /// camera, about 84 points, and the list stopped 42 points short of the fold.
    @Test func theFoldIsHalfOfTheWholeWindowStripIncluded() {
        let whole = RootView.wholeWindow(CGSize(width: 867, height: 669), EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 84))
        #expect(whole == CGSize(width: 951, height: 669))
    }

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

    /// The left side is the iPhone's screens: Back from the notes' list shows the folders there,
    /// and the note stays open beside them (Emil, 3 November 2026).
    @Test func backShowsTheFoldersBesideTheNote() async throws {
        let (window, host, _, notes) = try Self.window(Self.duoOpenWide)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[2], in: window)
        await PhoneRenderTests.settle(window)
        func controllers(_ c: UIViewController) -> [UIViewController] { [c] + c.children.flatMap(controllers) }
        let stacks = controllers(try #require(window.rootViewController)).compactMap { $0 as? UINavigationController }
            .filter { $0.viewControllers.count > 1 }
        let left = try #require(stacks.first, "the notes' list pushed over the folders")
        left.popViewController(animated: false)
        await PhoneRenderTests.settle(window)
        Self.shoot(window, "duo-open-wide-folders")
        #expect(left.viewControllers.count == 1, "the folders on the left")
        #expect(Self.showing(notes[2], in: window), "the note still open beside them")

        // Folded like that, the note stays open on the one screen.
        await Self.change(window, host, to: Self.duoClosed)
        Self.shoot(window, "duo-folded-from-folders")
        #expect(Self.showing(notes[2], in: window), "folding keeps the note open")
    }

    /// Beside the note the list draws the open note itself in a warm grey: the list's own
    /// highlight was a cold grey, or dark ink on the accent (Emil, 3 November 2026: "these
    /// contrasts are not working").
    @Test func theListBesideTheNoteDrawsNoHighlightOfItsOwn() async throws {
        let (window, _, _, notes) = try Self.window(Self.duoOpenWide)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[2], in: window)
        await PhoneRenderTests.settle(window)
        let lists = PhoneRenderTests.all(UICollectionView.self, in: window).filter { $0.window != nil && !$0.visibleCells.isEmpty }
        #expect(!lists.isEmpty)
        for list in lists {
            #expect((list.indexPathsForSelectedItems ?? []).isEmpty, "no system selection drawn")
        }
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
    /// The note's top bar views of a kind (by class name), left to right, in window points.
    static func barViews(_ kind: String, in window: UIWindow) -> [UIView] {
        PhoneRenderTests.all(UINavigationBar.self, in: window).filter { $0.window != nil && !$0.isHidden }
            .flatMap { PhoneRenderTests.all(UIView.self, in: $0) }
            .filter { String(describing: type(of: $0)).hasPrefix(kind) && $0.window != nil }
            .sorted { $0.convert($0.bounds, to: nil).minX < $1.convert($1.bounds, to: nil).minX }
    }

    /// The first button at the top left of the window, pressed as a tap does. Since iOS 27 a bar
    /// button is a hosted view with no control behind it, so a test has nothing to press: this
    /// finds no button there, and the caller records that as a known issue.
    static func pressTopLeft(in window: UIWindow) async throws {
        let button = try #require(barViews("_UIButtonBarButton", in: window).first as? UIControl, "a button at the top left")
        #expect(button.convert(button.bounds, to: nil).minX < 80, "at the left")
        button.sendActions(for: .touchUpInside)
        await PhoneRenderTests.settle(window)
    }

    /// Held upright the Duo is one screen at a time, as on the iPhone: Back closes the note and
    /// the list fills the window (Emil, 3 November 2026: the list slid over a greyed window).
    @Test func duoUprightBackShowsTheListAlone() async throws {
        let (window, _, _, notes) = try Self.window(Self.duoOpen)
        defer { window.isHidden = true }
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[2], in: window)
        await PhoneRenderTests.settle(window)
        // Checked by hand on the Duo simulator until a test can press a bar button on iOS 27.
        await withKnownIssue("iOS 27's bar buttons can't be pressed from a test", isIntermittent: true) {
            try await Self.pressTopLeft(in: window)
            Self.shoot(window, "duo-upright-back")
            #expect(PhoneRenderTests.editor(in: window) == nil, "Back closed the note")
            let lists = PhoneRenderTests.all(UICollectionView.self, in: window).filter { $0.window != nil && !$0.isHidden && !$0.visibleCells.isEmpty }
            let widest = try #require(lists.map { $0.convert($0.bounds, to: nil) }.max { $0.width < $1.width })
            #expect(widest.minX < 2 && widest.width > window.bounds.width - 2, "the list fills the window")
        }
    }

    /// Where the note is, in the top bar beside the list button (Emil, 3 November 2026).
    @Test func theNoteBarSaysWhichFolderTheNoteIsIn() async throws {
        let (window, _, c, notes) = try Self.window(Self.duoOpenWide)
        defer { window.isHidden = true }
        let travel = Folder(name: "Travel")
        c.mainContext.insert(travel)
        notes[2].folder = travel
        try c.mainContext.save()
        await PhoneRenderTests.settle(window, seconds: 1)
        try await PhoneRenderTests.open(notes[2], in: window)
        await PhoneRenderTests.settle(window)
        Self.shoot(window, "duo-open-wide-crumbs")
        // Right of the list button, over the note, wide enough for the name (it showed "…").
        let editor = try #require(PhoneRenderTests.editor(in: window))
        let noteLeft = editor.convert(editor.bounds, to: nil).minX
        let hosted = Self.barViews("UIKitBarItemHost", in: window).map { $0.convert($0.bounds, to: nil) }.filter { $0.minX > noteLeft }
        // Since iOS 27 the list button sits with the system's other buttons, and the breadcrumb
        // alone starts the bar over the note.
        let crumb = try #require(hosted.first, "a breadcrumb over the note")
        #expect(crumb.minX - noteLeft < 40, "at the start of the note")
        #expect(crumb.width > 44, "the folder's name, not a squeezed …")
    }

    @Test func breadcrumbsWalkTheFolders() throws {
        let (c, notes) = try PhoneRenderTests.library(notes: 1)
        let work = Folder(name: "Work"), q4 = Folder(name: "Q4", parent: work)
        c.mainContext.insert(work); c.mainContext.insert(q4)
        let note = notes[0]
        #expect(NoteBreadcrumbs.path(note).map { $0.name } == (note.folder.map { [$0.name] } ?? ["All Notes"]))
        note.folder = q4
        #expect(NoteBreadcrumbs.path(note).map { $0.name } == ["Work", "Q4"])
        #expect(NoteBreadcrumbs.path(note).last?.scope == .folder(q4.id))
        let a = Folder(name: "A"), b = Folder(name: "B", parent: a), d = Folder(name: "D", parent: b), e = Folder(name: "E", parent: d)
        [a, b, d, e].forEach { c.mainContext.insert($0) }
        note.folder = e
        #expect(NoteBreadcrumbs.path(note).map { $0.name } == ["D", "E"], "deep: the two nearest")
        #expect(EmptyDetailView.showsWords(opening: nil) && !EmptyDetailView.showsWords(opening: UUID()), "no flash of the empty pane while a note is on its way")
        note.trashedAt = .now
        #expect(NoteBreadcrumbs.path(note).map { $0.scope } == [.trash])
    }
}
#endif
