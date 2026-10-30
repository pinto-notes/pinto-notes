import Foundation

/// Which app this is: Amber Notes, or Amber Notes Beta, the build on the staging backend
/// (Config/Beta.xcconfig, docs/Technical/staging.md). Read from Info.plist, which the build
/// settings fill; the defaults are Amber Notes' own.
enum AppIdentity {
    /// The app's URL scheme: ambernotes, or ambernotes-beta.
    static let scheme = info("PaneURLScheme") ?? "ambernotes"
    /// Keychain service names start with this: dev.emilwagman.pane, or dev.emilwagman.pane.beta, so
    /// Amber Notes Beta never reads or replaces the real app's session, keys or locks.
    static let keychainPrefix = info("PaneBundleID") ?? "dev.emilwagman.pane"
    /// The app's folder in Application Support, and its library's name (Pane.store): "Pane" for
    /// Pinto Notes and its Beta. A build under a bundle id of its own (scripts/make-it-yours.sh) gets
    /// a folder named after that id: the Mac app runs outside the sandbox, so with "Pane" it would
    /// open an installed Pinto Notes' library, and signing in there as another account clears it.
    static let dataFolder = dataFolder(bundleID: info("PaneBundleID"))

    static func dataFolder(bundleID: String?) -> String {
        guard let id = bundleID, id != "dev.emilwagman.pane", !id.hasPrefix("dev.emilwagman.pane.") else { return "Pane" }
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
