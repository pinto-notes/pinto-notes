import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A small library for the locked and shared pictures: a pinned shared note, a pinned note, two
/// locked notes, a shared note and a plain one, in one folder, with a notes password set up and
/// every locked note locked. Its own vault (`NoteVault.shared` is swapped in by the shots).
@MainActor struct LockedSharedScene {
    static var dir: URL? { ProcessInfo.processInfo.environment["PANE_LOCKED_SHARED_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let password = "correct horse"

    let container: ModelContainer
    let vault: NoteVault
    let folder: UUID
    /// The locked note the pictures open.
    let locked: Note

    static func make(biometry: String?) async throws -> LockedSharedScene {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let folder = context.createFolder(named: "Personal")
        let vault = NoteVault(keyStore: MemoryKeyStore(biometryName: biometry), defaults: MemoryDefaults(), iterations: 1_000)
        try await vault.setUp(password: password, hint: "The usual")
        func note(_ body: String, minutesAgo: Double, pinned: Bool = false, shared: Bool = false, locked: Bool = false) throws -> Note {
            let n = context.createNote(in: .folder(folder.id), body: body)
            n.isPinned = pinned
            if shared { n.sharedNoteID = UUID() }
            if locked { try vault.lock(n) }
            n.updatedAt = Calendar.current.startOfDay(for: .now).addingTimeInterval(9 * 3600 - minutesAgo * 60)
            n.createdAt = n.updatedAt
            return n
        }
        _ = try note("Weekend in Lisbon\n\nTram 28 early, before the queues. Dinner on Saturday.", minutesAgo: -200, pinned: true, shared: true)
        _ = try note("Groceries\n\nOat milk, lemons, rice, basil", minutesAgo: -150, pinned: true)
        let bank = try note("Bank details\n\nAccount 1234 5678, sort code 12-34-56", minutesAgo: -90, locked: true)
        _ = try note("Book club\n\nNext up: Piranesi, on the 14th at Ana's", minutesAgo: -60, shared: true)
        _ = try note("Ideas for the garden\n\nLavender by the path, a bench under the pear tree", minutesAgo: -20)
        _ = try note("Passport numbers\n\nMine, Sara's and the kids'", minutesAgo: 600, locked: true)
        try context.save()
        // Locked, and Face ID or Touch ID has no key to open them with until the password is typed.
        vault.forgetDeviceKey()
        return LockedSharedScene(container: c, vault: vault, folder: folder.id, locked: bank)
    }
}

#if os(macOS)
import AppKit

/// Locked and shared notes on the Mac, as the list and the note pane draw them, light and dark:
/// the list with a locked note selected, the list while locked notes are open, and the locked
/// note's page. Drawn in borderless windows far off screen that are never ordered in
/// (ThemeShots' way): nothing appears on the display. With the iPhone's pictures beside them
/// when LockedSharedPhoneShots wrote them first, and a before and after sheet when a `before`
/// folder sits beside this one.
/// `TEST_RUNNER_PANE_LOCKED_SHARED_SHOTS=/path scripts/qa-test.sh PaneTests/LockedSharedShots`
@MainActor @Suite(.serialized) struct LockedSharedShots {
    static let listSize = CGSize(width: 300, height: 440)
    static let pageSize = CGSize(width: 600, height: 440)

    @Test func pictures() async throws {
        guard let dir = LockedSharedScene.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let scene = try await LockedSharedScene.make(biometry: "Touch ID")
        let keptVault = NoteVault.shared, keptLocale = DateBucket.locale
        NoteVault.shared = scene.vault
        DateBucket.locale = Locale(identifier: "en_US")
        defer {
            NoteVault.shared = keptVault
            DateBucket.locale = keptLocale
        }
        func save(_ rep: NSBitmapImageRep, _ name: String) throws {
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
        }
        func list(dark: Bool) async throws -> NSBitmapImageRep {
            try await ThemeShots.host(NavigationStack { NoteListView(scope: .folder(scene.folder), selection: .constant([scene.locked.id]), onNewNote: {}) }
                .modelContainer(scene.container).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                size: Self.listSize, dark: dark, wait: 2.5, layers: true)
        }
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            let rows = try await list(dark: dark)
            try save(rows, "mac-list-\(mode)")
            let page = try await ThemeShots.host(LockedNoteView(note: scene.locked).modelContainer(scene.container).background(Color.notePage),
                                                 size: Self.pageSize, dark: dark, wait: 1.2)
            try save(page, "mac-locked-page-\(mode)")
            try save(try ThemeShots.stitch([rows, page]), "mac-\(mode)")
        }
        // While locked notes are open their locks show open, as Notes draws them.
        try await scene.vault.unlock(password: LockedSharedScene.password)
        for dark in [false, true] { try save(try await list(dark: dark), "mac-list-unlocked-\(dark ? "dark" : "light")") }
        scene.vault.lockNow()
        try Self.sheets(in: dir)
    }

    /// One sheet of this run's pictures, and one of before beside after when there's a `before`
    /// folder next to an `after` one. Each picture is drawn at its size in points, whatever its scale.
    static func sheets(in dir: URL) throws {
        let widths: [String: CGFloat] = ["mac-list": listSize.width, "mac-list-unlocked": listSize.width, "mac-locked-page": pageSize.width,
                                         "iphone-list": 402, "iphone-list-unlocked": 402, "iphone-locked-page": 402]
        let names = ["mac-list", "mac-list-unlocked", "mac-locked-page", "iphone-list", "iphone-list-unlocked", "iphone-locked-page"]
        func load(_ url: URL, _ name: String) -> NSBitmapImageRep? {
            guard let data = try? Data(contentsOf: url), let rep = NSBitmapImageRep(data: data), let width = widths[name] else { return nil }
            let scale = CGFloat(rep.pixelsWide) / width
            rep.size = CGSize(width: width, height: CGFloat(rep.pixelsHigh) / scale)
            return rep
        }
        var rows: [[(String, NSBitmapImageRep)]] = []
        for name in names {
            let row = ["light", "dark"].compactMap { mode in load(dir.appending(path: "\(name)-\(mode).png"), name).map { ("\(name) \(mode)", $0) } }
            if !row.isEmpty { rows.append(row) }
        }
        if !rows.isEmpty {
            try ThemeShots.sheet("Locked and shared notes", rows: rows, scale: 0.8).write(to: dir.appending(path: "contact-sheet.png"))
        }
        guard dir.lastPathComponent == "after" else { return }
        let before = dir.deletingLastPathComponent().appending(path: "before")
        var pairs: [[(String, NSBitmapImageRep)]] = []
        for name in names {
            for mode in ["light", "dark"] {
                guard let b = load(before.appending(path: "\(name)-\(mode).png"), name),
                      let a = load(dir.appending(path: "\(name)-\(mode).png"), name) else { continue }
                pairs.append([("Before: \(name) \(mode)", b), ("After: \(name) \(mode)", a)])
            }
        }
        if !pairs.isEmpty {
            try ThemeShots.sheet("Locked and shared notes, before and after", rows: pairs, scale: 0.7).write(to: dir.deletingLastPathComponent().appending(path: "before-after.png"))
        }
    }
}
#endif

#if os(iOS)
import UIKit

/// The iPhone half of LockedSharedShots: the list (locked and while open) and the locked note's
/// page, light and dark, at an iPhone 17 Pro's size. On a simulator, before the Mac half:
/// `TEST_RUNNER_PANE_LOCKED_SHARED_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=…'
/// -only-testing:PaneTests/LockedSharedPhoneShots CODE_SIGNING_ALLOWED=NO`
@MainActor @Suite(.serialized) struct LockedSharedPhoneShots {
    @Test func pictures() async throws {
        guard let dir = LockedSharedScene.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let windowScene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let scene = try await LockedSharedScene.make(biometry: "Face ID")
        let keptVault = NoteVault.shared, keptLocale = DateBucket.locale
        NoteVault.shared = scene.vault
        DateBucket.locale = Locale(identifier: "en_US")
        defer {
            NoteVault.shared = keptVault
            DateBucket.locale = keptLocale
        }
        func shoot(_ view: some View, _ name: String, dark: Bool) async throws {
            let window = UIWindow(windowScene: windowScene)
            window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
            window.overrideUserInterfaceStyle = dark ? .dark : .light
            window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US")))
            window.isHidden = false
            try? await Task.sleep(for: .seconds(1.6))
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            window.isHidden = true
            try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
        }
        func list() -> some View {
            NavigationStack { NoteListView(scope: .folder(scene.folder), selection: .constant([]), onNewNote: {}) }.modelContainer(scene.container)
        }
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            try await shoot(list(), "iphone-list-\(mode)", dark: dark)
            let page = NavigationStack { NoteDetailView(note: scene.locked, controller: EditorController(), onNewNote: {}) }.modelContainer(scene.container)
            try await shoot(page, "iphone-locked-page-\(mode)", dark: dark)
        }
        try await scene.vault.unlock(password: LockedSharedScene.password)
        for dark in [false, true] { try await shoot(list(), "iphone-list-unlocked-\(dark ? "dark" : "light")", dark: dark) }
        scene.vault.lockNow()
    }
}
#endif
