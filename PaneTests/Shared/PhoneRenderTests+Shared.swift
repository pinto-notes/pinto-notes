#if os(iOS)
import SwiftData
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The PhoneRenderTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/Perf/PhoneRenderTests.swift.
@MainActor @Suite(.serialized) struct PhoneRenderTests {
    static func library(notes count: Int) throws -> (ModelContainer, [Note]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = Folder(name: "Notes")
        ctx.insert(folder)
        var notes: [Note] = []
        for i in 0..<count {
            let n = Note(body: "Note \(i)\n\nSome text for note \(i), with **bold** and a list:\n- one\n- two\n", folder: folder)
            n.updatedAt = Date().addingTimeInterval(Double(-i * 3600))
            ctx.insert(n)
            notes.append(n)
        }
        try ctx.save()
        return (c, notes)
    }

    static func update(_ window: UIWindow) async {
        for _ in 0..<4 { await Task.yield() }
        window.layoutIfNeeded()
    }

    static func settle(_ window: UIWindow, seconds: Double = 0.5) async {
        let clock = ContinuousClock()
        let end = clock.now + .milliseconds(Int(seconds * 1000))
        while clock.now < end {
            try? await Task.sleep(for: .milliseconds(30))
            window.layoutIfNeeded()
        }
    }

    static func find<T: UIView>(_ type: T.Type, in view: UIView) -> T? {
        if let v = view as? T { return v }
        for s in view.subviews { if let v = find(type, in: s) { return v } }
        return nil
    }

    static func all<T: UIView>(_ type: T.Type, in view: UIView) -> [T] {
        var out: [T] = []
        if let v = view as? T { out.append(v) }
        for s in view.subviews { out += all(type, in: s) }
        return out
    }

    static func editor(in window: UIWindow) -> PaneTextView? {
        all(PaneTextView.self, in: window).first { $0.window != nil && !$0.isHidden }
    }

    static func navigation(in window: UIWindow) -> UINavigationController? {
        func walk(_ vc: UIViewController) -> UINavigationController? {
            if let n = vc as? UINavigationController, n.viewControllers.count > 1 { return n }
            for c in vc.children { if let n = walk(c) { return n } }
            return nil
        }
        return window.rootViewController.flatMap(walk)
    }

    /// Opens a note and waits until its editor shows it.
    static func open(_ note: Note, in window: UIWindow) async throws {
        NoteOpener.shared.request = note.id
        for _ in 0..<60 {
            await update(window)
            if editor(in: window)?.text.contains(note.title) == true { return }
            try? await Task.sleep(for: .milliseconds(5))
        }
        Issue.record("The note \(note.title) did not open")
    }

    /// Back, as the back button does it, and waits until the editor has gone.
    static func back(in window: UIWindow) async throws {
        let nav = try #require(navigation(in: window), "a navigation stack with the note on it")
        nav.popViewController(animated: false)
        for _ in 0..<60 {
            await update(window)
            if editor(in: window) == nil { return }
            try? await Task.sleep(for: .milliseconds(5))
        }
        Issue.record("Back left the editor up")
    }
}
#endif
