import Foundation
#if os(macOS)
import AppKit
#endif

/// "Pinto Notes is now in the Mac App Store": the Mac download (target PaneDirect, `DIRECT`) asks
/// its people to move to the App Store build, where updates come from from now on.
///
/// The rules (2026-11-12):
/// - only the Mac download says it. App Store builds (Mac, iPhone, iPad) never do: `isDirectBuild`
///   is false there, and nothing is fetched;
/// - only once the site says the store version is live: `pintonotes.com/mac-app-store.json`, read
///   at launch, says `{"live": true}`. No file, no answer or anything else means not yet;
/// - after launch, once the notes are open, and never on a launch that shows another prompt;
/// - at most twice per Mac: Not Now brings it back once, a week later. Open the App Store, or a
///   second Not Now, ends it for good.
enum MacStoreMove {
    static let title = "Pinto Notes is now in the Mac App Store"
    static let line = "Updates come from the App Store from now on. Your notes stay in your account: delete this copy, get Pinto Notes from the App Store, and sign in."
    static let openTitle = "Open the App Store"
    static let notNowTitle = "Not Now"

    /// The app's page in the App Store app (the record is shared with iPhone).
    static let storePage = URL(string: "macappstore://apps.apple.com/app/id6817253103")!
    /// The flag: a static file on the site, deployed with the site's move to the store.
    static let flagURL = URL(string: ShareAsk.site + "/mac-app-store.json")!

    /// How long Not Now holds before the one more time.
    static let againAfter: TimeInterval = 7 * 86_400
    /// How many times a Mac is ever told.
    static let maxShows = 2

    #if DIRECT
    static let isDirectBuild = true
    #else
    static let isDirectBuild = false
    #endif

    enum Answer: Equatable, Sendable { case openStore, notNow }

    static let shownKey = "macStoreMove.shown"
    static let nextKey = "macStoreMove.next"
    static let doneKey = "macStoreMove.done"

    /// Whether this launch may say it: the Mac download, the store version live, fewer than two
    /// times so far, a week since Not Now, and never after Open the App Store.
    static func isDue(direct: Bool, live: Bool, defaults: UserDefaults = .standard, now: Date = .now) -> Bool {
        guard direct, live, !defaults.bool(forKey: doneKey) else { return false }
        guard defaults.integer(forKey: shownKey) < maxShows else { return false }
        if let next = defaults.object(forKey: nextKey) as? Date, now < next { return false }
        return true
    }

    /// Counts a time shown.
    static func noteShown(defaults: UserDefaults = .standard) {
        defaults.set(defaults.integer(forKey: shownKey) + 1, forKey: shownKey)
        Funnel.record(.macAppStoreStep(.shown))
    }

    /// The answer, kept: Open the App Store ends it; Not Now waits a week, and the second ends it.
    static func answer(_ answer: Answer, defaults: UserDefaults = .standard, now: Date = .now) {
        switch answer {
        case .openStore:
            defaults.set(true, forKey: doneKey)
            Funnel.record(.macAppStoreStep(.openStore))
        case .notNow:
            if defaults.integer(forKey: shownKey) >= maxShows { defaults.set(true, forKey: doneKey) }
            defaults.set(now.addingTimeInterval(againAfter), forKey: nextKey)
            Funnel.record(.macAppStoreStep(.notNow))
        }
    }

    /// The flag file's answer: live only when it says `"live": true`.
    static func live(from data: Data) -> Bool {
        struct Flag: Decodable { var live: Bool? }
        return (try? JSONDecoder().decode(Flag.self, from: data))?.live == true
    }

    /// Reads the flag from the site. Any failure is "not yet".
    static func fetchLive(session: URLSession = .shared) async -> Bool {
        var request = URLRequest(url: flagURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.httpMethod = "GET"
        guard let (data, response) = try? await session.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200 else { return false }
        return live(from: data)
    }

    /// The launch's one chance. Returns the answer when it was shown.
    @MainActor
    @discardableResult
    static func atLaunch(direct: Bool = isDirectBuild,
                         otherPrompt: Bool,
                         defaults: UserDefaults = .standard,
                         now: () -> Date = { .now },
                         fetchLive: () async -> Bool = { await MacStoreMove.fetchLive() },
                         present: () async -> Answer,
                         open: (URL) -> Void) async -> Answer? {
        // Nothing is fetched on an App Store build, nor once it's done for this Mac.
        guard direct, !otherPrompt, isDue(direct: direct, live: true, defaults: defaults, now: now()) else { return nil }
        guard await fetchLive(), isDue(direct: direct, live: true, defaults: defaults, now: now()) else { return nil }
        noteShown(defaults: defaults)
        let answer = await present()
        self.answer(answer, defaults: defaults, now: now())
        if answer == .openStore { open(storePage) }
        return answer
    }

    #if os(macOS)
    /// The alert: the title, the line, Open the App Store (the default) and Not Now.
    @MainActor
    static func makeAlert() -> NSAlert {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = line
        alert.alertStyle = .informational
        alert.addButton(withTitle: openTitle)
        // Escape is Not Now, as Cancel would be.
        alert.addButton(withTitle: notNowTitle).keyEquivalent = "\u{1b}"
        return alert
    }

    /// What a button press means: the first button opens the store, anything else is Not Now.
    static func answer(for response: NSApplication.ModalResponse) -> Answer {
        response == .alertFirstButtonReturn ? .openStore : .notNow
    }

    /// Shows the alert as a sheet on the notes window (or on its own without one).
    @MainActor
    static func presentAlert() async -> Answer {
        let alert = makeAlert()
        if let window = NSApp.keyWindow ?? NSApp.mainWindow {
            return await withCheckedContinuation { done in
                alert.beginSheetModal(for: window) { done.resume(returning: answer(for: $0)) }
            }
        }
        return answer(for: alert.runModal())
    }
    #endif
}
