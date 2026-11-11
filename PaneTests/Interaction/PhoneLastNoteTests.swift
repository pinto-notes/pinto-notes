import Foundation
import SwiftData
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// iPhone 1.3 (Emil, 11 November 2026): "we have some logic that makes it so you always return to
/// the latest note you were in. but I think that should be nullified if you intentionally left
/// the note." As in Notes: Back out of a note, and the next launch opens the list; Back out to the
/// folders, and it opens the folders; leave the app inside a note, and that note opens again.
@MainActor @Suite(.serialized) struct PhoneLastNoteTests {
    /// What the Mac and the iPad make of what the iPhone saves after Back: the newest note opens
    /// (the list's mark is no note's id), and All Notes (the folders' mark is no scope).
    @Test func theMacAndTheIPadKeepOpeningANote() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: false, welcome: false)
        let newest = c.mainContext.createNote(in: .all, body: "Groceries\n\nOat milk")
        try? c.mainContext.save()
        #expect(UUID(uuidString: PhoneLaunchSpot.list) == nil)
        #expect(c.mainContext.noteToReopen(last: UUID(uuidString: PhoneLaunchSpot.list))?.id == newest.id)
        #expect((try? JSONDecoder().decode(Scope.self, from: PhoneLaunchSpot.folders)) == nil)
    }

    #if os(iOS)
    /// Open a note, Back to its list, and the next launch opens the list, not the note.
    @Test func backOutOfANoteOpensTheListNextTime() async throws {
        await PhoneScreenTurn.take()
        defer { PhoneScreenTurn.give() }
        let place = try Place()
        defer { place.restore() }
        place.start(scope: .folder(place.work.id), note: place.plans.id)

        var window = place.launch()
        let inNote = await T.until { place.noteOpen(in: window) }
        #expect(inNote, "it opened on \(T.titles(in: window))")
        try? await Task.sleep(for: .milliseconds(500))
        T.back(in: window)
        let list = await T.until { T.titles(in: window).last == "Work" && !place.noteOpen(in: window) }
        #expect(list, "Back from the note left \(T.titles(in: window))")
        #expect(UserDefaults.standard.string(forKey: "lastNote") == PhoneLaunchSpot.list)

        window = place.relaunch(window)
        let onList = await T.until { T.titles(in: window) == ["Folders", "Work"] }
        try? await Task.sleep(for: .milliseconds(800))
        #expect(onList && T.titles(in: window) == ["Folders", "Work"] && !place.noteOpen(in: window),
                "after Back and a relaunch the screens were \(T.titles(in: window))")
        place.close(window)
    }

    /// Open a note, leave the app (Home, another app, iOS ending it), and it opens in that note.
    @Test func leavingTheAppInANoteOpensItNextTime() async throws {
        await PhoneScreenTurn.take()
        defer { PhoneScreenTurn.give() }
        let place = try Place()
        defer { place.restore() }
        place.start(scope: .folder(place.work.id), note: PhoneLaunchSpot.list)

        var window = place.launch()
        let onList = await T.until { T.titles(in: window) == ["Folders", "Work"] }
        #expect(onList, "it opened on \(T.titles(in: window))")
        try? await Task.sleep(for: .milliseconds(600))
        let row = try await T.waitFor("the note Plans", in: window) { T.row(0, in: $0) }
        T.tap(row)
        let opened = await T.until { place.noteOpen(in: window) }
        #expect(opened, "the note didn't open; screens \(T.titles(in: window))")
        #expect(UserDefaults.standard.string(forKey: "lastNote") == place.plans.id.uuidString)

        // Home: the app resigns and goes to the background; iOS then ends it.
        NotificationCenter.default.post(name: UIApplication.willResignActiveNotification, object: UIApplication.shared)
        NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: UIApplication.shared)
        try? await Task.sleep(for: .milliseconds(300))
        window = place.relaunch(window)
        // Opened again, the app is in front and active (left in the background, the harness's Back
        // stopped reaching the folder list's pick in the next test).
        NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: UIApplication.shared)
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: UIApplication.shared)
        let back = await T.until { place.noteOpen(in: window) && T.titles(in: window).starts(with: ["Folders", "Work"]) }
        #expect(back, "after leaving the app in the note and a relaunch the screens were \(T.titles(in: window))")
        place.close(window)
    }

    /// Back out of a folder to the folders, and the next launch opens the folders.
    @Test func backToTheFoldersOpensThemNextTime() async throws {
        await PhoneScreenTurn.take()
        defer { PhoneScreenTurn.give() }
        let place = try Place()
        defer { place.restore() }
        place.start(scope: .folder(place.work.id), note: place.plans.id)

        var window = place.launch()
        let inNote = await T.until { place.noteOpen(in: window) }
        #expect(inNote, "it opened on \(T.titles(in: window))")
        for _ in 0..<2 where T.titles(in: window).count > 1 {
            try? await Task.sleep(for: .milliseconds(500))
            T.back(in: window)
        }
        let folders = await T.until { T.titles(in: window) == ["Folders"] }
        #expect(folders, "Back twice left \(T.titles(in: window))")
        let saved = await T.until { UserDefaults.standard.data(forKey: "lastScope") == PhoneLaunchSpot.folders }
        #expect(saved, "the last scope read \(String(decoding: UserDefaults.standard.data(forKey: "lastScope") ?? Data(), as: UTF8.self))")

        window = place.relaunch(window)
        _ = await T.until { T.titles(in: window).count > 1 }
        try? await Task.sleep(for: .milliseconds(800))
        #expect(T.titles(in: window) == ["Folders"] && !place.noteOpen(in: window),
                "after Back to the folders and a relaunch the screens were \(T.titles(in: window))")

        // The folders still open: a tap on Work goes in.
        let workRow = try await T.waitFor("Work's row", in: window) { T.row(2, in: $0) }
        T.tap(workRow)
        let inWork = await T.until { T.titles(in: window).last == "Work" }
        #expect(inWork, "after a tap on Work the screens were \(T.titles(in: window))")
        place.close(window)
    }

    private typealias T = PhoneFolderTapTests

    /// A library with a folder Work holding the note Plans, and the launch memory set and put back.
    @MainActor final class Place {
        let container: ModelContainer
        let work: Folder
        let plans: Note
        private let kept: (Any?, Any?)

        init() throws {
            container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            let c = container.mainContext
            Seed.ensureLibrary(c, demo: false, welcome: false)
            work = c.createFolder(named: "Work")
            plans = c.createNote(in: .folder(work.id), body: "Plans\n\nShip it")
            _ = c.createNote(in: .all, body: "Groceries\n\nOat milk")
            try? c.save()
            let d = UserDefaults.standard
            kept = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        }

        func start(scope: Scope, note: UUID) { start(scope: scope, note: note.uuidString) }

        func start(scope: Scope, note: String) {
            UserDefaults.standard.set(try? JSONEncoder().encode(scope), forKey: "lastScope")
            UserDefaults.standard.set(note, forKey: "lastNote")
        }

        func restore() {
            let d = UserDefaults.standard
            if let v = kept.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = kept.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }

        /// The app opening: a new window on a new root view, over the same notes.
        func launch() -> UIWindow {
            let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
            let window = UIWindow(windowScene: scene!)
            window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
            window.rootViewController = UIHostingController(rootView: RootView().modelContainer(container).environment(SetupStore()))
            window.makeKeyAndVisible()
            return window
        }

        /// The app ended and opened again: the old window and its view go, a new one comes.
        func relaunch(_ old: UIWindow) -> UIWindow {
            close(old)
            return launch()
        }

        /// The window and its root view gone, so a later test's launch is the only app running.
        func close(_ window: UIWindow) {
            window.isHidden = true
            window.rootViewController = nil
        }

        func noteOpen(in window: UIWindow) -> Bool { T.textViews(in: window).contains { $0.text.hasPrefix("Plans") } }
    }
    #endif
}
