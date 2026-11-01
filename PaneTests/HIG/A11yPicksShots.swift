#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The accessibility fixes Emil picked on 2026-11-01, as the app draws them: the Appearance page
/// (a chosen accent with its tick, and High contrast without the accent row), a checklist in dark
/// mode, and Sepia with Increase Contrast. One contact sheet, with the iPhone's pictures if
/// A11yPicksPhoneShots (below, on a simulator) wrote them first into `raw-ios`. Windows far off screen, never ordered in.
/// `TEST_RUNNER_PANE_A11Y_PICKS_SHOTS=/path scripts/qa-test.sh PaneTests/A11yPicksShots`
@MainActor @Suite(.serialized) struct A11yPicksShots {
    static let checklist = """
    Weekend bag

    - [x] Passport
    - [x] Adapter
    - [ ] Rain jacket
    - [ ] Book for the train
    """

    static func appearance(dark: Bool) async throws -> NSBitmapImageRep {
        try await ThemeShots.host(Form { AppearancePage() }.formStyle(.grouped).tint(Color(PColor.paneAccent)),
                                  size: CGSize(width: 520, height: 500), dark: dark, wait: 0.8)
    }

    static func page(_ c: ModelContainer, dark: Bool) async throws -> NSBitmapImageRep {
        let w = ThemeShots.window(c, dark: dark)
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 20)
        w.makeFirstResponder(nil)
        await MacWindowChromeTests.settle(w, 6)
        let page = try ThemeShots.page(w, ThemeShots.shot(w))
        return try Self.crop(page, height: 300)
    }

    static func crop(_ rep: NSBitmapImageRep, height: CGFloat) throws -> NSBitmapImageRep {
        let px = CGFloat(rep.pixelsWide) / rep.size.width
        let h = min(height, rep.size.height)
        let cg = try #require(rep.cgImage?.cropping(to: CGRect(x: 0, y: 0, width: CGFloat(rep.pixelsWide), height: h * px)))
        let out = NSBitmapImageRep(cgImage: cg)
        out.size = CGSize(width: rep.size.width, height: h)
        return out
    }

    @Test func pictures() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_A11Y_PICKS_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let kept = ThemeStore.shared.current
        defer { ThemeStore.shared.set(kept, persist: false) }
        func save(_ rep: NSBitmapImageRep, _ name: String) throws {
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
        }
        var rows: [[(String, NSBitmapImageRep)]] = []

        // The Appearance page: Sepia with blue chosen (ticked), then High contrast (no accent row).
        var row: [(String, NSBitmapImageRep)] = []
        for (look, label) in [(ThemeLook(theme: .sepia, accent: .blue), "sepia-blue"), (ThemeLook(theme: .contrast, accent: .blue), "high-contrast")] {
            ThemeStore.shared.set(look, persist: false)
            for dark in [false, true] {
                let rep = try await Self.appearance(dark: dark)
                try save(rep, "mac-appearance-\(label)-\(dark ? "dark" : "light")")
                row.append(("Mac, \(look.theme.title), accent \(look.accent.title)\(look.theme == .contrast ? " stored" : ""), \(dark ? "dark" : "light")", rep))
            }
        }
        rows.append(Array(row.prefix(2)))
        rows.append(Array(row.suffix(2)))

        // iPhone, if its shots ran first.
        let ios = ["iphone-appearance-sepia-blue-light", "iphone-appearance-sepia-blue-dark", "iphone-appearance-high-contrast-light", "iphone-appearance-high-contrast-dark"]
        let phone = ios.compactMap { name -> (String, NSBitmapImageRep)? in
            let url = dir.appending(path: "raw-ios/\(name).png")
            guard let data = try? Data(contentsOf: url), let rep = NSBitmapImageRep(data: data) else { return nil }
            rep.size = CGSize(width: CGFloat(rep.pixelsWide) / 3, height: CGFloat(rep.pixelsHigh) / 3)
            try? data.write(to: dir.appending(path: "\(name).png"))
            return (name.replacingOccurrences(of: "iphone-appearance-", with: "iPhone, ").replacingOccurrences(of: "-", with: " "), rep)
        }
        if !phone.isEmpty { rows.append(phone) }

        // A checklist in dark mode: Default, Sepia and High contrast, ticks near-black on the accent.
        let c = try AppSnapshotTests.container()
        let travel = try c.mainContext.fetch(FetchDescriptor<Folder>()).first { $0.name == "Travel" } ?? c.mainContext.createFolder(named: "Travel")
        let n = c.mainContext.createNote(in: .folder(travel.id), body: Self.checklist)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Weekend bag") {
            var checks: [(String, NSBitmapImageRep)] = []
            for theme in [Theme.standard, .sepia, .contrast] {
                ThemeStore.shared.set(ThemeLook(theme: theme, accent: .theme), persist: false)
                let rep = try await Self.page(c, dark: true)
                try save(rep, "checklist-dark-\(theme.rawValue)")
                checks.append(("Checklist, \(theme.title), dark", rep))
            }
            rows.append(checks)

        }
        // Sepia, light, without and with Increase Contrast: muted text and hairlines, in the
        // sidebar, the list and a note.
        let trip = c.mainContext.createNote(in: .folder(travel.id), body: ThemeShots.note)
        trip.updatedAt = .now.addingTimeInterval(1200)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
            var boost: [(String, NSBitmapImageRep)] = []
            for on in [false, true] {
                ThemeStore.shared.set(ThemeLook(theme: .sepia, accent: .theme, increaseContrast: on), persist: false)
                let w = ThemeShots.window(c, dark: false)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                let page = try ThemeShots.page(w, ThemeShots.shot(w))
                let sidebar = try await ThemeShots.host(NavigationStack { SidebarView(scope: .constant(.folder(travel.id)), onNewNote: {}) }
                    .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                    size: CGSize(width: 220, height: page.size.height), dark: false)
                let list = try await ThemeShots.host(NavigationStack { NoteListView(scope: .folder(travel.id), selection: .constant([trip.id]), onNewNote: {}) }
                    .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                    size: CGSize(width: 280, height: page.size.height), dark: false, wait: 2.5, layers: true)
                let rep = try Self.crop(ThemeShots.stitch([sidebar, list, page]), height: 460)
                try save(rep, "sepia-increase-contrast-\(on ? "on" : "off")")
                boost.append(("Sepia, Increase Contrast \(on ? "on" : "off")", rep))
            }
            rows.append(boost)
        }
        try ThemeShots.sheet("Accessibility picks: tick, High contrast, Increase Contrast, accents", rows: rows, scale: 0.6)
            .write(to: dir.appending(path: "contact-sheet.png"))
    }
}
#endif

#if os(iOS)
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The iPhone half of A11yPicksShots: the Appearance page with Sepia and blue chosen (44 pt
/// accent targets, the tick on the chosen one, its name under the row), and with High contrast
/// (no accent row), light and dark. On a simulator, before the Mac half:
/// `TEST_RUNNER_PANE_A11Y_PICKS_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
/// -only-testing:PaneTests/A11yPicksPhoneShots CODE_SIGNING_ALLOWED=NO`
@MainActor @Suite(.serialized) struct A11yPicksPhoneShots {
    @Test func pictures() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_A11Y_PICKS_SHOTS"].map({ URL(fileURLWithPath: $0).appending(path: "raw-ios") }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let kept = ThemeStore.shared.current
        defer { ThemeStore.shared.set(kept, persist: false) }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for (look, label) in [(ThemeLook(theme: .sepia, accent: .blue), "sepia-blue"), (ThemeLook(theme: .contrast, accent: .blue), "high-contrast")] {
            ThemeStore.shared.set(look, persist: false)
            for dark in [false, true] {
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(x: 0, y: 0, width: 402, height: 700)
                window.overrideUserInterfaceStyle = dark ? .dark : .light
                let page = NavigationStack { Form { AppearancePage() }.navigationTitle("Appearance").navigationBarTitleDisplayMode(.inline) }
                window.rootViewController = UIHostingController(rootView: page.tint(Color(PColor.paneAccent)))
                window.isHidden = false
                try? await Task.sleep(for: .seconds(1))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                window.isHidden = true
                try #require(image.pngData()).write(to: dir.appending(path: "iphone-appearance-\(label)-\(dark ? "dark" : "light").png"))
            }
        }
    }
}
#endif
