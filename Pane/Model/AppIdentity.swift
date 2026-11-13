import Foundation

/// Which app this is: Amber Notes, or Amber Notes Beta, the build on the staging backend
/// (Config/Beta.xcconfig, docs/Technical/staging.md). Read from Info.plist, which the build
/// settings fill; the defaults are Amber Notes' own.
enum AppIdentity {
    /// The app's URL scheme: pintonotes, or ambernotes-beta.
    static let scheme = info("PaneURLScheme") ?? "pintonotes"
    /// Keychain service names start with this: dev.emilwagman.pane, or dev.emilwagman.pane.beta, so
    /// Amber Notes Beta never reads or replaces the real app's session, keys or locks.
    static let keychainPrefix = keychainPrefix(bundleID: info("PaneBundleID"), devRun: devRun)

    static func keychainPrefix(bundleID: String?, devRun: Bool) -> String {
        let id = bundleID ?? "dev.emilwagman.pane"
        // Still ending in .beta, so a dev run counts as the beta (telemetry's channel, note apps).
        return devRun ? id + ".devrun.beta" : id
    }

    /// Debug builds launched with PANE_DEV_RUN=1 (`open --env PANE_DEV_RUN=1 …`): a library and
    /// Keychain items of their own, so a dev build run next to the installed app never shares its
    /// session or notes, and never stops at launch on a Keychain prompt for the installed app's
    /// items (a Debug build is signed differently, so the Keychain asks, and the app waits).
    static let devRun: Bool = {
        #if DEBUG
        ProcessInfo.processInfo.environment["PANE_DEV_RUN"] == "1"
        #else
        false
        #endif
    }()
    /// The app's folder in Application Support, and its library's name (Pane.store): "Pane" for
    /// Pinto Notes and its Beta only. Any other bundle id, ours with a suffix too, gets a folder named
    /// after that id: the Mac app runs outside the sandbox, so with "Pane" it would open an installed
    /// Pinto Notes' library, and signing in there as another account clears it. (13 November 2026: a
    /// test build as dev.emilwagman.pane.canvastest opened Emil's real notes under a sign-in sheet.)
    static let dataFolder = dataFolder(bundleID: info("PaneBundleID"), devRun: devRun)

    /// The bundle ids whose library is Pinto Notes' own: the app, and the sandboxed Beta (its
    /// container keeps it apart). Nothing is matched by prefix.
    static let sharesPintoLibrary: Set<String> = ["dev.emilwagman.pane", "dev.emilwagman.pane.beta"]

    static func dataFolder(bundleID: String?, devRun: Bool = false) -> String {
        if devRun { return "Pane-devrun" }
        guard let id = bundleID, !sharesPintoLibrary.contains(id) else { return "Pane" }
        return id
    }
    /// Whether the Mac download takes updates (Updater.swift): only Pinto Notes' own app, with a
    /// feed. A build under a bundle id of its own never replaces itself with Pinto Notes, even when
    /// it still has upstream's feed and Sparkle key (scripts/make-it-yours.sh also clears the feed).
    static let takesUpdates = takesUpdates(bundleID: info("PaneBundleID"), feed: info("SUFeedURL"))

    static func takesUpdates(bundleID: String?, feed: String?) -> Bool {
        dataFolder(bundleID: bundleID) == "Pane" && feed?.hasPrefix("https://") == true
    }
    /// The App Group the share extension hands items to the app through.
    static let appGroup = info("PaneAppGroup") ?? "group.dev.emilwagman.pane"
    /// Website hosts whose /open/… links the app handles: ambernotes.app, pintonotes.com (the new
    /// name, alongside; old links keep working), and the site the build shares to when that's
    /// another public one (the staging site).
    static let webHosts: Set<String> = {
        var hosts: Set<String> = ["ambernotes.app", "www.ambernotes.app", "pintonotes.com", "www.pintonotes.com"]
        if let s = info("PaneShareURL"), let u = URL(string: s), u.scheme == "https", let host = u.host?.lowercased() { hosts.insert(host) }
        return hosts
    }()

    private static func info(_ key: String) -> String? {
        guard let s = Bundle.main.object(forInfoDictionaryKey: key) as? String, !s.isEmpty, !s.hasPrefix("$(") else { return nil }
        return s
    }
}
