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

    /// Not started in a build of your own (AppIdentity.takesUpdates): no checks, and the menu item is off.
    let controller = SPUStandardUpdaterController(startingUpdater: AppIdentity.takesUpdates, updaterDelegate: UpdateWaiting.shared, userDriverDelegate: nil)
    @Published private(set) var canCheck = false
    /// The version downloaded and waiting for a quit, for General's row: nil while there's none.
    @Published fileprivate(set) var waiting: String?
    /// Installs the waiting update and relaunches (Sparkle's own block for it).
    fileprivate var install: (() -> Void)?

    /// Set once automatic updates have been switched on for an install (see above).
    static let automaticUpdatesSetKey = "PaneAutomaticUpdatesSet"

    private init() {
        controller.updater.publisher(for: \.canCheckForUpdates).assign(to: &$canCheck)
        let defaults = UserDefaults.standard
        if AppIdentity.takesUpdates, !defaults.bool(forKey: Self.automaticUpdatesSetKey) {
            controller.updater.automaticallyDownloadsUpdates = true
            defaults.set(true, forKey: Self.automaticUpdatesSetKey)
        }
    }

    func checkForUpdates() { controller.checkForUpdates(nil) }

    /// Settings › General's Install and Relaunch.
    func installNow() { install?() }
}

/// Told by Sparkle when an update has come down and waits for a quit: General shows it with
/// Install and Relaunch. Returning false leaves Sparkle's own handling as it was (install on quit,
/// its window after a week).
final class UpdateWaiting: NSObject, SPUUpdaterDelegate {
    nonisolated(unsafe) static let shared = UpdateWaiting()

    func updater(_ updater: SPUUpdater, willInstallUpdateOnQuit item: SUAppcastItem, immediateInstallationBlock: @escaping () -> Void) -> Bool {
        let version = item.displayVersionString
        // Sparkle calls its delegate on the main thread.
        MainActor.assumeIsolated {
            Updater.shared.waiting = version
            Updater.shared.install = immediateInstallationBlock
        }
        return false
    }
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
