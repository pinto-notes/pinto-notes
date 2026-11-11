import Foundation
import SwiftData
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// iPhone 1.3 (Emil, 11 November 2026): "I cant tap into a folder. Only way for me to enter is
/// really weird. I click edit, then click done, and that moves me into the folder." The folders'
/// list took a set of picks (⌘ and ⇧ on the Mac) on iPhone too: Back emptied the pick, which kept
/// the folder as an empty ⌘ pick does, so a tap on the folder you came back from changed nothing.
/// The iPhone opens in the last folder, so that was the first folder most people tapped.
@MainActor @Suite(.serialized) struct PhoneFolderTapTests {
    /// The Mac keeps several picks (⌘ and ⇧); iPhone and iPad pick one row, so a tap goes into it.
    @Test func iPhonePicksOneFolderAtATime() {
        #if os(iOS)
        #expect(!SidebarView.picksSeveral)
        #else
        #expect(SidebarView.picksSeveral)
        #endif
    }

    #if os(iOS)
    /// A tap on a folder opens its notes, a tap on a note opens it, and Back goes back; All Notes too.
    @Test func aTapOnAFolderOpensIt() async throws {
        await PhoneScreenTurn.take()
        defer { PhoneScreenTurn.give() }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: false, welcome: false)
        let work = c.mainContext.createFolder(named: "Work")
        _ = c.mainContext.createNote(in: .folder(work.id), body: "Plans\n\nShip it")
        _ = c.mainContext.createNote(in: .all, body: "Groceries\n\nOat milk")
        try? c.mainContext.save()
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }

        // The iPhone opens where you were: All Notes and its newest note the first time. Back,
        // and Back again, shows the folders.
        let launched = await Self.until { Self.titles(in: window).starts(with: ["Folders", "All Notes"]) }
        #expect(launched, "it opened on \(Self.titles(in: window))")
        for _ in 0..<2 where Self.titles(in: window).count > 1 {
            try? await Task.sleep(for: .milliseconds(500))
            Self.back(in: window)
        }
        let onFolders = await Self.until { Self.titles(in: window) == ["Folders"] }
        #expect(onFolders, "Back from All Notes left \(Self.titles(in: window))")
        guard onFolders else { return }
        try? await Task.sleep(for: .milliseconds(600))

        // The folders' rows: All Notes, Notes, Work.
        let workRow = try await Self.waitFor("Work's row", in: window) { Self.row(2, in: $0) }
        Self.tap(workRow)
        let inWork = await Self.until { Self.titles(in: window).last == "Work" }
        #expect(inWork, "after a tap on Work the screens were \(Self.titles(in: window))")
        guard inWork else { return }

        // Its one note opens.
        let plans = try await Self.waitFor("the note Plans", in: window) { Self.row(0, in: $0) }
        Self.tap(plans)
        let opened = await Self.until { Self.textViews(in: window).contains { $0.text.hasPrefix("Plans") } }
        #expect(opened, "the note didn't open; screens \(Self.titles(in: window))")

        // Back to Work's notes, then to the folders.
        Self.back(in: window)
        let list = await Self.until { Self.titles(in: window).last == "Work" && !Self.textViews(in: window).contains { $0.text.hasPrefix("Plans") } }
        #expect(list, "Back from the note left \(Self.titles(in: window))")
        Self.back(in: window)
        let folders = await Self.until { Self.titles(in: window) == ["Folders"] }
        #expect(folders, "Back from Work left \(Self.titles(in: window))")
        try? await Task.sleep(for: .milliseconds(600))
        // The folder you just came back from opens again: Back leaves nothing picked.
        let again = try await Self.waitFor("Work's row", in: window) { Self.row(2, in: $0) }
        Self.tap(again)
        let inWorkAgain = await Self.until { Self.titles(in: window).last == "Work" }
        #expect(inWorkAgain, "after Back, a tap on Work again left \(Self.titles(in: window))")
        Self.back(in: window)
        _ = await Self.until { Self.titles(in: window) == ["Folders"] }
        try? await Task.sleep(for: .milliseconds(600))
        let all = try await Self.waitFor("All Notes' row", in: window) { Self.row(0, in: $0) }
        Self.tap(all)
        let inAll = await Self.until { Self.titles(in: window).last == "All Notes" }
        #expect(inAll, "after a tap on All Notes the screens were \(Self.titles(in: window))")
    }

    // MARK: - Driving the hosted list, without touches

    /// A row of the list on screen.
    struct Row { let list: UICollectionView; let path: IndexPath }

    /// The row at `item` of the first section of the one list on screen (the pushed screens' lists
    /// leave the window when they're covered).
    static func row(_ item: Int, in window: UIWindow) -> Row? {
        let lists = views(UICollectionView.self, in: window).filter { $0.window != nil && !$0.isHidden && $0.bounds.width > 200 }
        guard lists.count == 1, let list = lists.first, list.numberOfSections > 0, list.numberOfItems(inSection: 0) > item else { return nil }
        return Row(list: list, path: IndexPath(item: item, section: 0))
    }

    /// What a tap on the row does: the list asks, picks it, and says so.
    static func tap(_ row: Row) {
        let list = row.list
        guard list.delegate?.collectionView?(list, shouldSelectItemAt: row.path) ?? true else { return }
        list.selectItem(at: row.path, animated: false, scrollPosition: [])
        list.delegate?.collectionView?(list, didSelectItemAt: row.path)
    }

    /// The screens' titles, the bottom of the stack first.
    static func titles(in window: UIWindow) -> [String] {
        controllers(UINavigationController.self, in: window).flatMap { $0.viewControllers.compactMap { $0.navigationItem.title } }
    }

    /// Back, as the bar's button does it.
    static func back(in window: UIWindow) {
        for nav in controllers(UINavigationController.self, in: window) where nav.viewControllers.count > 1 {
            // The folders' screen under a folder's notes is the split view's first column.
            // VoiceOver's escape: what the bar's Back does, through the same path.
            if nav.topViewController?.view.accessibilityPerformEscape() != true { nav.popViewController(animated: true) }
            return
        }
    }

    static func textViews(in window: UIWindow) -> [UITextView] { views(UITextView.self, in: window).filter { $0.window != nil } }

    static func views<V: UIView>(_ kind: V.Type, in view: UIView) -> [V] {
        ((view as? V).map { [$0] } ?? []) + view.subviews.flatMap { views(kind, in: $0) }
    }

    static func controllers<C: UIViewController>(_ kind: C.Type, in window: UIWindow) -> [C] {
        var out: [C] = []
        func walk(_ vc: UIViewController) {
            if let c = vc as? C { out.append(c) }
            vc.children.forEach(walk)
            if let p = vc.presentedViewController, p.presentingViewController === vc { walk(p) }
        }
        window.rootViewController.map(walk)
        return out
    }

    static func until(seconds: Double = 3, _ ok: () -> Bool) async -> Bool {
        let end = Date().addingTimeInterval(seconds)
        while Date() < end {
            if ok() { return true }
            try? await Task.sleep(for: .milliseconds(100))
        }
        return ok()
    }

    static func waitFor<T>(_ what: String, in window: UIWindow, seconds: Double = 4, _ find: (UIWindow) -> T?) async throws -> T {
        let end = Date().addingTimeInterval(seconds)
        while Date() < end {
            if let t = find(window) { return t }
            try? await Task.sleep(for: .milliseconds(100))
        }
        let lists = views(UICollectionView.self, in: window).map { l in "\(l.numberOfSections) sections, \(l.numberOfSections > 0 ? l.numberOfItems(inSection: 0) : 0) rows" }
        return try #require(find(window), "no \(what); the lists read \(lists), screens \(titles(in: window))")
    }
    #endif
}

#if os(iOS)
/// One hosted iPhone app at a time. Suites run side by side, and every launch reads and writes the
/// same remembered folder and note, so two at once would open in each other's place.
@MainActor enum PhoneScreenTurn {
    private static var busy = false
    static func take() async {
        while busy { try? await Task.sleep(for: .milliseconds(50)) }
        busy = true
    }
    static func give() { busy = false }
}
#endif
