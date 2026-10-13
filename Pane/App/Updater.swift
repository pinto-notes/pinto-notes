#if SPARKLE
import Combine
import Sparkle
import SwiftUI

/// Updates for the Mac download (the Developer ID build, target PaneDirect). The App Store
/// and TestFlight builds don't compile this: they get updates from Apple.
///
/// Updates come on their own, like a Mac App Store app's. Sparkle checks the appcast every hour
/// (SUScheduledCheckInterval in Info-Direct.plist, its shortest), downloads a new version quietly
/// and installs it when the person quits; the next launch is the new version. No window for a
/// routine update, and no first-launch "check automatically?" question (SUEnableAutomaticChecks
/// is set in the plist). "Check for Updates…" asks now and shows Sparkle's window.
///
/// Sparkle still shows its window, without waiting for a quit, when an update needs the person:
/// a critical one (downloaded first, then shown), an informational one (nothing to install), a
/// major upgrade, or one whose signature doesn't check out (never installed). An update left
/// waiting for a week because the app was never quit is also shown.
///
/// Sparkle's user defaults win over the plist, and an earlier version left the "Automatically
/// download and install updates" box in the update window up to the person. So installs that
/// unticked it are switched to automatic once, on the first launch of this version; if they
/// untick it again from "Check for Updates…", that stays.
@MainActor
final class Updater: ObservableObject {
    static let shared = Updater()

    let controller = SPUStandardUpdaterController(startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil)
    @Published private(set) var canCheck = false

    /// Set once automatic updates have been switched on for an install (see above).
    static let automaticUpdatesSetKey = "PaneAutomaticUpdatesSet"

    private init() {
        controller.updater.publisher(for: \.canCheckForUpdates).assign(to: &$canCheck)
        let defaults = UserDefaults.standard
        if !defaults.bool(forKey: Self.automaticUpdatesSetKey) {
            controller.updater.automaticallyDownloadsUpdates = true
            defaults.set(true, forKey: Self.automaticUpdatesSetKey)
        }
    }

    func checkForUpdates() { controller.checkForUpdates(nil) }
}

/// "Check for Updates…" under the app menu, right after About, where Mac apps keep it.
struct UpdaterCommands: Commands {
    @ObservedObject private var updater = Updater.shared

    var body: some Commands {
        CommandGroup(after: .appInfo) {
            Button("Check for Updates…") { updater.checkForUpdates() }
                .disabled(!updater.canCheck)
        }
    }
}
#endif
