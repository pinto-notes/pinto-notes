#if os(macOS)
import Foundation
import Testing

/// The Mac download updates on its own (2026-10-13): Sparkle checks every hour, downloads quietly
/// and installs when the app quits, with no window for a routine update and no first-launch
/// question about checking. Updater.swift explains the rest.
@Suite struct UpdaterTests {
    static func directInfo() throws -> [String: Any] {
        let data = try Data(contentsOf: TestFiles.url("Info-Direct.plist"))
        return try #require(PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any])
    }

    @Test func theMacDownloadUpdatesOnItsOwn() throws {
        let info = try Self.directInfo()
        #expect(info["SUAutomaticallyUpdate"] as? Bool == true, "downloads and installs without asking")
        #expect(info["SUAllowsAutomaticUpdates"] as? Bool == true)
        #expect(info["SUScheduledCheckInterval"] as? Int == 3600, "every hour, Sparkle's shortest")
    }

    /// Sparkle asks "check for updates automatically?" on the second launch unless the app has
    /// already answered in its Info.plist.
    @Test func sparkleNeverAsksWhetherToCheck() throws {
        let info = try Self.directInfo()
        #expect(info["SUEnableAutomaticChecks"] as? Bool == true)
        #expect(info["SUPromptUserOnFirstLaunch"] == nil)
    }
}
#endif
