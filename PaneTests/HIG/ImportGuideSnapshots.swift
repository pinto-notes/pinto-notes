import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// DESIGN STUDY: every page of the guided imports, light and dark, written as pictures under
/// `$AMBER_HIG_SHOTS/<source>/`. Offscreen. Mac: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh
/// PaneTests/ImportGuideSnapshots`; iPhone: the same suite on a simulator.
/// `AMBER_GUIDE_ART` points at the folder of real screenshots (bear/bear-export-notes-menu.jpeg).
@MainActor @Suite(.serialized) struct ImportGuideSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static var art: URL? { ProcessInfo.processInfo.environment["AMBER_GUIDE_ART"].map { URL(fileURLWithPath: $0) } }

    static func picture(_ path: String) -> URL? {
        guard let u = art?.appending(path: path), FileManager.default.fileExists(atPath: u.path) else { return nil }
        return u
    }

    static var guides: [ImportGuide] {
        #if os(iOS)
        return [.keepPhone, .obsidianPhone(picture: picture("obsidian/obsidian-icloud-folder-location.png")), .markdown]
        #else
        return [.keep, .evernote, .bear(picture: picture("bear/bear-export-options-tight.png")),
                .obsidian(picture: picture("obsidian/obsidian-reveal-in-finder-tight.png")), .markdown]
        #endif
    }

    /// The pages of a guide, in order, with the file name each is written to.
    static func pages(_ g: ImportGuide) -> [(String, ImportGuidePage, Bool)] {
        var out: [(String, ImportGuidePage, Bool)] = [("01-intro", .intro, false)]
        for i in g.steps.indices {
            out.append((String(format: "%02d-step-%d", i + 2, i + 1), .step(i), false))
            if g.steps[i].action != nil { out.append((String(format: "%02d-step-%d-after-opening", i + 2, i + 1), .step(i), true)) }
        }
        let n = g.steps.count + 2
        out.append((String(format: "%02d-drop", n), .drop(.empty), false))
        #if os(macOS)
        out.append((String(format: "%02d-drop-hovering", n), .drop(.hovering), false))
        #endif
        if g.drop.found != nil { out.append((String(format: "%02d-drop-found", n), .drop(.found), false)) }
        out.append((String(format: "%02d-wrong-file", n), .drop(.wrong), false))
        out.append((String(format: "%02d-importing", n + 1), .importing(done: g.success.count / 2, total: g.success.count), false))
        out.append((String(format: "%02d-success", n + 2), .success, false))
        return out
    }

    static let notices: [(String, String, ImportNoticePage)] = {
        #if os(iOS)
        [("apple-notes", "easiest-on-mac", .phoneAppleNotes), ("apple-notes", "one-at-a-time", .phoneAppleNotesOne),
         ("evernote", "easiest-on-a-computer", .phoneEvernote), ("bear", "easiest-on-mac", .phoneBear)]
        #else
        [("apple-notes", "permission-denied", .notesDenied), ("apple-notes", "nothing-found", .notesEmpty)]
        #endif
    }()

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let mode = dark ? "dark" : "light"
        for g in Self.guides {
            for (name, page, opened) in Self.pages(g) {
                let size = ImportGuideSheet.size(.stacked)
                try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: g, page: page, opened: opened),
                                                        to: dir.appending(path: "\(g.id)/mac-\(mode)-\(name).png"), size: size, dark: dark)
            }
        }
        // Option B, weighed against the stacked pages: the picture beside the words.
        let keep = ImportGuide.keep
        for i in keep.steps.indices {
            try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: keep, page: .step(i), layout: .beside),
                                                    to: dir.appending(path: "keep/option-b-beside/mac-\(mode)-0\(i + 2)-step-\(i + 1).png"),
                                                    size: ImportGuideSheet.size(.beside), dark: dark)
        }
        for (folder, name, page) in Self.notices {
            try await VersionHistorySnapshots.shoot(page, to: dir.appending(path: "\(folder)/mac-\(mode)-\(name).png"),
                                                    size: CGSize(width: 540, height: 560), dark: dark)
        }
        // A second account: the real sheet, with iCloud and a Gmail account in Apple Notes.
        AppleNotesBridge.forceDemo = true
        DateBucket.locale = Locale(identifier: "en_US")
        defer { AppleNotesBridge.forceDemo = false; AppleNotesImportView.demoListing = nil; DateBucket.locale = .autoupdatingCurrent }
        var listing = AppleNotesListing(notes: Self.twoAccounts)
        listing.mainAccount = "iCloud"
        AppleNotesImportView.demoListing = listing
        let c = try ImportSheetSnapshots.container()
        try await VersionHistorySnapshots.shoot(AppleNotesImportView().modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US")),
                                                to: dir.appending(path: "apple-notes/mac-\(mode)-second-account.png"),
                                                size: CGSize(width: 540, height: 460), dark: dark)
    }

    static var twoAccounts: [AppleNote] {
        let rows: [(String, String, String, Int)] = [
            ("Pasta night for eight", "Recipes", "iCloud", 1), ("Weeknight curry", "Recipes", "iCloud", 1),
            ("Porto in October", "Travel", "iCloud", 2), ("Packing list", "Travel", "iCloud", 2),
            ("Books to read", "Notes", "iCloud", 3), ("Gift ideas", "Notes", "iCloud", 3), ("Wi-Fi at the cabin", "Notes", "iCloud", 3),
            ("Standup", "Notes", "Gmail", 4), ("1:1 with Sara", "Notes", "Gmail", 4), ("Q4 planning", "Notes", "Gmail", 4),
        ]
        return rows.enumerated().map { i, r in
            AppleNote(id: "two-\(i)", name: r.0, folder: r.1, modified: Date.now.addingTimeInterval(-Double(i) * 86_400), account: r.2, folderOrder: r.3)
        }
    }
    #endif

    #if os(iOS)
    @Test(arguments: [false, true])
    func iPhone(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let mode = dark ? "dark" : "light"
        let size = CGSize(width: 402, height: 874)
        for g in Self.guides {
            for (name, page, opened) in Self.pages(g) {
                try await Self.shoot(ImportGuideSheet(guide: g, page: page, opened: opened), to: dir.appending(path: "\(g.id)/iphone-\(mode)-\(name).png"),
                                     size: size, dark: dark, scene: scene)
            }
        }
        for (folder, name, page) in Self.notices {
            try await Self.shoot(page, to: dir.appending(path: "\(folder)/iphone-\(mode)-\(name).png"), size: size, dark: dark, scene: scene)
        }
    }

    /// As a sheet over the app: the page at the full height of a sheet.
    static func shoot(_ page: some View, to url: URL, size: CGSize, dark: Bool, scene: UIWindowScene) async throws {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        let root = Color(Palette.listGround).ignoresSafeArea()
            .sheet(isPresented: .constant(true)) { page.presentationBackground(Color(Palette.sheetGround)) }
        window.rootViewController = UIHostingController(rootView: root)
        window.isHidden = false
        try? await Task.sleep(for: .seconds(1.4))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.rootViewController?.dismiss(animated: false)
        window.isHidden = true
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try #require(image.pngData()).write(to: url)
    }
    #endif
}
