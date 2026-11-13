import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Privacy mode's pictures, all with it on: the editor (sharp, as always), the list (titles sharp,
/// previews blurred in place), the menu bar, the cover, the eye, Settings and the widget, light and dark, offscreen. Runs only when AMBER_HIG_SHOTS is set. Mac:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/PrivacyModeShots`; iPhone:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=…'
/// -only-testing:PaneTests/PrivacyModeShots CODE_SIGNING_ALLOWED=NO`.
@MainActor @Suite(.serialized) struct PrivacyModeShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    static let note = """
    Offsite plan
    Friday at the lake house, 14:00
    - [ ] Book the boat for Saturday
    - [x] Tell Sam about the budget
    - [ ] Pick up the cake
    The salary numbers stay between us until the board meets.
    """

    static func library() throws -> (ModelContainer, [Note]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notes = [
            ctx.createNote(in: .all, body: "Offsite plan\nFriday at the lake house, 14:00"),
            ctx.createNote(in: .all, body: "Salary talk\nAsk for the raise on Monday"),
            ctx.createNote(in: .all, body: "Groceries\nOat milk, lemons, coffee beans"),
            ctx.createNote(in: .all, body: "Doctor\nResults on Thursday"),
        ]
        try ctx.save()
        return (c, notes)
    }

    static func list(_ notes: [Note]) -> some View {
        List(notes) { NoteRow(note: $0) }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color(Palette.listGround))
    }

    /// Rows as the list draws them, without the List (ImageRenderer draws no AppKit table).
    static func rows(_ notes: [Note], open: UUID? = nil, reveal: ListTitleReveal? = nil) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(notes) { NoteRow(note: $0, open: $0.id == open).padding(.horizontal, 8); Divider().padding(.leading, 18) }
            Spacer(minLength: 0)
        }
        .environment(\.listTitleReveal, reveal)
        .background(Color(Palette.listGround))
    }

    static func on() { PrivacyModeInteractionReset.reset(); PrivacyMode.shared.setManual(true) }

    /// A model that's asking, for the cover's picture (the app's own stays off).
    static func asking(call: Bool = false) -> PrivacyMode {
        let m = PrivacyMode(store: MemoryDefaults())
        if call { m.callChanged(true) } else { m.sharingChanged(true) }
        return m
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let mode = dark ? "dark" : "light"
        Self.on()
        defer { PrivacyModeInteractionReset.reset() }
        // The editor, with privacy mode on: nothing of it blurred.
        let h = await EditorHarness(Self.note, width: 720, height: 420, dark: dark)
        defer { h.close() }
        await h.caret(after: "Book the boat")
        await h.settle(0.3)
        let view = h.scroll
        let rep = try #require(view.bitmapImageRepForCachingDisplay(in: view.bounds))
        view.cacheDisplay(in: view.bounds, to: rep)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-editor-\(mode).png"))

        // SwiftUI's blur and materials only show through ImageRenderer offscreen (cacheDisplay leaves them out).
        let (c, notes) = try Self.library()
        // The list with the pointer away from it (titles blurred but the open note's), and over it.
        let away = ListTitleReveal(), over = ListTitleReveal()
        over.pointer(true)
        try Self.render(Self.rows(notes, open: notes[1].id, reveal: away).modelContainer(c).frame(width: 320, height: 300), dark: dark,
                        to: dir.appending(path: "mac-list-away-\(mode).png"))
        try Self.render(Self.rows(notes, open: notes[1].id, reveal: over).modelContainer(c).frame(width: 320, height: 300), dark: dark,
                        to: dir.appending(path: "mac-list-over-\(mode).png"))
        // The menu bar panel's rows (ImageRenderer draws neither its field nor its scroll view).
        let menuRows = VStack(alignment: .leading, spacing: 2) {
            ForEach(notes) { MenuBarPanel.rowText($0).frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 8).padding(.vertical, 5) }
        }
        .padding(6).frame(width: 340).background(Color(nsColor: .windowBackgroundColor))
        try Self.render(menuRows, dark: dark, to: dir.appending(path: "mac-menubar-\(mode).png"))
        let behind = HStack(spacing: 0) {
            Self.rows(notes).frame(width: 300)
            Text(Self.note).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading).padding(24).background(Color.notePage)
        }
        try Self.render(behind.overlay { PrivacyCoverView(mode: Self.asking()) }.modelContainer(c).frame(width: 900, height: 560),
                        dark: dark, to: dir.appending(path: "mac-cover-\(mode).png"))
        try Self.render(behind.overlay { PrivacyCoverView(mode: Self.asking(call: true)) }.modelContainer(c).frame(width: 900, height: 560),
                        dark: dark, to: dir.appending(path: "mac-cover-call-\(mode).png"))
        // The eye in the toolbar's place, and Settings › Privacy's section.
        try await VersionHistorySnapshots.shoot(PrivacyEyeButton().buttonStyle(.barIcon).padding(12),
                                                to: dir.appending(path: "mac-eye-\(mode).png"), size: CGSize(width: 60, height: 52), dark: dark)
        try await VersionHistorySnapshots.shoot(Form { PrivacyModeSection() }.formStyle(.grouped).frame(width: 560, height: 300),
                                                to: dir.appending(path: "mac-settings-\(mode).png"), size: CGSize(width: 560, height: 300), dark: dark)
    }
    #endif

    #if os(macOS)
    static func render(_ view: some View, dark: Bool, to url: URL) throws {
        let r = ImageRenderer(content: view.environment(\.colorScheme, dark ? .dark : .light))
        r.scale = 2
        let image = try #require(r.cgImage)
        let rep = NSBitmapImageRep(cgImage: image)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: url)
    }
    #endif

    #if os(iOS)
    static func shoot(_ window: UIWindow, to url: URL) throws {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try #require(image.pngData()).write(to: url)
    }

    static func window(_ scene: UIWindowScene, dark: Bool, root: UIViewController) -> UIWindow {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = root
        window.isHidden = false
        return window
    }

    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        Self.on()
        defer { PrivacyModeInteractionReset.reset() }
        let (c, notes) = try Self.library()
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            // The editor, with privacy mode on: nothing of it blurred.
            let host = UIViewController()
            host.view.backgroundColor = Palette.page
            let text = PaneTextView(frame: CGRect(x: 0, y: 60, width: 402, height: 814))
            text.configure(text: Self.note, header: "")
            host.view.addSubview(text)
            let w1 = Self.window(scene, dark: dark, root: host)
            let at = (Self.note as NSString).range(of: "Book the boat")
            text.selectedRange = NSRange(location: NSMaxRange(at), length: 0)
            try? await Task.sleep(for: .seconds(1))
            try Self.shoot(w1, to: dir.appending(path: "iphone-editor-\(mode).png"))
            w1.isHidden = true

            let w2 = Self.window(scene, dark: dark, root: UIHostingController(rootView: NavigationStack { Self.list(notes).navigationTitle("Notes") }.modelContainer(c)))
            try? await Task.sleep(for: .seconds(1.2))
            try Self.shoot(w2, to: dir.appending(path: "iphone-list-\(mode).png"))
            w2.isHidden = true

            let behind = NavigationStack { Self.list(notes).navigationTitle("Notes") }.modelContainer(c)
            let w3 = Self.window(scene, dark: dark, root: UIHostingController(rootView: behind.overlay { PrivacyCoverView(mode: Self.asking()) }))
            try? await Task.sleep(for: .seconds(1.2))
            try Self.shoot(w3, to: dir.appending(path: "iphone-cover-\(mode).png"))
            w3.isHidden = true

            let preview = ChecklistShelf.Preview(id: UUID(), title: "Doctor", lines: ["Results on Thursday", "Bring the referral letter", "Ask about the dose"], updatedAt: .now)
            let widget = ChecklistWidgetView(content: .blurred(preview)).padding(16).frame(width: 170, height: 170)
                .background(ChecklistWidgetGround()).clipShape(.rect(cornerRadius: 22))
            let w4 = Self.window(scene, dark: dark, root: UIHostingController(rootView: widget.frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(Palette.listGround))))
            try? await Task.sleep(for: .seconds(0.8))
            try Self.shoot(w4, to: dir.appending(path: "iphone-widget-\(mode).png"))
            w4.isHidden = true
        }
    }
    #endif
}

