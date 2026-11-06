#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A locked note opens to a page in its place, as Apple Notes does (Emil, 4 November 2026): a
/// quiet lock, "This note is locked.", the notes password, and Touch ID where the Mac has it.
/// Unlocking shows the note. Read offscreen through the accessibility API (OffscreenAX): nothing
/// is put on the screen and nothing is clicked.
@MainActor @Suite(.serialized) struct LockedNotePageTests {
    static let pageSize = CGSize(width: 600, height: 440)

    /// `body` with the scene's vault as the app's.
    static func with(_ scene: LockedSharedScene, _ body: () async throws -> Void) async throws {
        let kept = NoteVault.shared
        NoteVault.shared = scene.vault
        defer { NoteVault.shared = kept }
        try await body()
    }

    @Test func thePageAsksForThePassword() async throws {
        let scene = try await LockedSharedScene.make(biometry: "Touch ID")
        try await Self.with(scene) {
            let ax = OffscreenAX(LockedNoteView(note: scene.locked).modelContainer(scene.container), size: Self.pageSize)
            defer { ax.close() }
            await ax.settle(800)
            #expect(ax.find("lock.heading")?.text.contains("This note is locked.") == true, "\(ax.ids())")
            #expect(ax.find("lock.explanation")?.text.contains("Enter your notes password to view this note.") == true)
            #expect(ax.find("lock.password") != nil, "the password field")
            let view = try #require(ax.find("lock.view"))
            #expect(view.text.contains("View Note"), "title case: \(view.text)")
            #expect(!view.enabled, "nothing to check until a password is typed")
            #expect(ax.find("lock.biometrics")?.text.contains("Use Touch ID") == true)
            #expect(ax.find("lock.art") == nil, "the lock is a picture: VoiceOver skips it")
            #expect(ax.find("lock.problem") == nil && ax.find("lock.hint") == nil, "no problem or hint before a try")
            // One focus: the page doesn't repeat the note's title, as Notes doesn't.
            #expect(!ax.ids().contains("lock.title"))
        }
    }

    /// The page never makes the window taller: the window takes its smallest size from what's in
    /// it (.contentSize), and it grew past the screen's bottom with a locked note open (round 17).
    @Test func thePageNeverMakesTheWindowTaller() async throws {
        let scene = try await LockedSharedScene.make(biometry: "Touch ID")
        try await Self.with(scene) {
            let host = NSHostingView(rootView: LockedNoteView(note: scene.locked).modelContainer(scene.container))
            host.frame = CGRect(origin: .zero, size: Self.pageSize)
            let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 600, height: 440), styleMask: [.titled], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            w.contentView = host
            defer { w.close() }
            try? await Task.sleep(for: .milliseconds(500))
            // The smallest height is measured at the smallest width, where the words wrap one to a line.
            #expect(w.contentMinSize.height < Self.pageSize.height, "asks for \(w.contentMinSize)")
            #expect(w.frame.height < Self.pageSize.height + 60, "grew to \(w.frame.size)")
        }
    }

    /// No Touch ID button where the Mac has none (or it's turned off).
    @Test func noTouchIDWhereThereIsNone() async throws {
        let scene = try await LockedSharedScene.make(biometry: nil)
        try await Self.with(scene) {
            let ax = OffscreenAX(LockedNoteView(note: scene.locked).modelContainer(scene.container), size: Self.pageSize)
            defer { ax.close() }
            await ax.settle(800)
            #expect(ax.find("lock.heading") != nil)
            #expect(ax.find("lock.password") != nil)
            #expect(ax.find("lock.biometrics") == nil)
        }
    }

    /// The words under the heading, for a note locked with a password from before it changed.
    @Test func anEarlierPasswordSaysSo() {
        #expect(LockedNoteView.explanation(earlier: false) == "Enter your notes password to view this note.")
        #expect(LockedNoteView.explanation(earlier: true) == "It was locked with an earlier notes password. Enter that password to view it.")
        #expect(LockedNoteView.biometrySymbol("Touch ID") == "touchid")
        #expect(LockedNoteView.biometrySymbol("Face ID") == "faceid")
    }

    /// In the note pane the page stands in the note's place; unlocking shows the note's text, and
    /// locking again brings the page back. Without Touch ID: the test's key store hands the key
    /// straight back, so the page's own Touch ID would open the note again at once.
    @Test func unlockingShowsTheNote() async throws {
        let scene = try await LockedSharedScene.make(biometry: nil)
        try await Self.with(scene) {
            let ax = OffscreenAX(NavigationStack { NoteDetailView(note: scene.locked, controller: EditorController(), onNewNote: {}) }
                .modelContainer(scene.container), size: CGSize(width: 700, height: 500))
            defer { ax.close() }
            await ax.settle(800)
            #expect(ax.find("lock.heading") != nil, "the page, not the note")
            #expect(!Self.shownText(in: ax.window).contains("Account 1234"), "nothing of the text")
            try await scene.vault.unlock(password: LockedSharedScene.password)
            await ax.settle(800)
            #expect(ax.find("lock.heading") == nil, "the page goes")
            #expect(Self.shownText(in: ax.window).contains("Account 1234"), "the note's text in its place")
            scene.vault.lockNow()
            await ax.settle(800)
            #expect(ax.find("lock.heading") != nil, "locked again: the page is back")
            #expect(!Self.shownText(in: ax.window).contains("Account 1234"))
        }
    }

    /// The text of every text view in the window.
    static func shownText(in window: NSWindow) -> String {
        func walk(_ view: NSView) -> [String] { ((view as? NSTextView).map { [$0.string] } ?? []) + view.subviews.flatMap(walk) }
        return window.contentView.map(walk)?.joined(separator: "\n") ?? ""
    }
}
#endif
