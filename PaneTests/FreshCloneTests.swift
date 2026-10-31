#if os(macOS)
import Foundation
import Testing
@testable import Pane

/// A fresh clone with no secrets and no Apple team builds (docs/MAKE-IT-YOURS.md): who the app is
/// and how it signs live in Config/Identity.xcconfig, which scripts/make-it-yours.sh overrides with
/// a gitignored Config/Identity.local.xcconfig. scripts/ci/fresh-clone-build.sh builds one nightly.
@Suite struct FreshCloneTests {
    /// Settings written in project.yml sit above the project's xcconfig, so any of these there would
    /// win over Identity.local.xcconfig, and make-it-yours.sh would quietly stop working.
    @Test func projectYmlLeavesWhoTheAppIsToTheXcconfig() throws {
        let project = try TestFiles.text("project.yml")
        for key in ["DEVELOPMENT_TEAM", "CODE_SIGN_STYLE", "PANE_BUNDLE_ID:", "PANE_DISPLAY_NAME:", "PANE_URL_SCHEME:", "PANE_APP_GROUP:"] {
            #expect(!project.contains(key), "\(key) belongs in Config/Identity.xcconfig")
        }
        #expect(project.contains("configFiles:\n  Debug: Config/Identity.xcconfig\n  Release: Config/Identity.xcconfig\n"))
    }

    /// XcodeGen gives the two-platform app target the iOS preset's "iPhone Developer", which won on
    /// the Mac too: a plain Mac build (Xcode's Run) asked for a team on 2026-10-30.
    @Test func theAppTargetTakesItsSigningIdentityFromTheXcconfig() throws {
        let project = try TestFiles.text("project.yml")
        let app = try #require(project.components(separatedBy: "\n  Pane:\n").dropFirst().first?.components(separatedBy: "\n  PaneDirect:\n").first)
        #expect(app.contains("CODE_SIGN_IDENTITY: $(inherited)"))
    }

    /// Ad-hoc everywhere but on an iPhone, and the local file read last so it overrides.
    @Test func theXcconfigSignsAdHocAndReadsTheLocalFileLast() throws {
        let lines = try TestFiles.text("Identity.xcconfig").split(separator: "\n").map(String.init).filter { !$0.hasPrefix("//") && !$0.isEmpty }
        #expect(lines.contains("CODE_SIGN_IDENTITY = -"))
        #expect(lines.contains("DEVELOPMENT_TEAM ="))
        #expect(lines.contains("DEVELOPMENT_TEAM[sdk=iphoneos*] = $(PANE_IOS_TEAM)"))
        #expect(lines.last == "#include? \"Identity.local.xcconfig\"")
    }

    /// A Mac build under its own bundle id keeps its library apart from an installed Pinto Notes:
    /// outside the sandbox both would otherwise open ~/Library/Application Support/Pane.
    @Test func aBuildOfYourOwnKeepsItsNotesApart() {
        #expect(AppIdentity.dataFolder(bundleID: "dev.emilwagman.pane") == "Pane")
        #expect(AppIdentity.dataFolder(bundleID: "dev.emilwagman.pane.beta") == "Pane")
        #expect(AppIdentity.dataFolder(bundleID: nil) == "Pane")
        #expect(AppIdentity.dataFolder(bundleID: "com.kim.notes") == "com.kim.notes")
        #expect(AppIdentity.dataFolder(bundleID: "dev.emilwagman.panes") == "dev.emilwagman.panes")
    }

    /// A build of your own never replaces itself with Pinto Notes: the Mac download's updater runs
    /// only under upstream's bundle id and with a feed (make-it-yours.sh also clears the feed).
    @Test func onlyPintoNotesItselfTakesUpdates() {
        let feed = "https://ambernotes.app/updates/appcast.xml"
        #expect(AppIdentity.takesUpdates(bundleID: "dev.emilwagman.pane", feed: feed))
        #expect(!AppIdentity.takesUpdates(bundleID: "com.kim.notes", feed: feed))
        #expect(!AppIdentity.takesUpdates(bundleID: "dev.emilwagman.pane", feed: nil))
    }

    /// `scripts/setup.sh --local-only` builds with an empty backend address: the app opens on the
    /// notes, with sync off and no sign-in.
    @Test func aBuildWithNoBackendAddressRunsWithSyncOff() {
        #expect(BackendConfig.url(from: "") == nil)
        #expect(BackendConfig.url(from: nil) == nil)
        #expect(BackendConfig.url(from: "$(PANE_SUPABASE_URL)") == nil)
        #expect(BackendConfig.url(from: "http://127.0.0.1:56421")?.port == 56421)
    }

    /// A free Apple account (a personal team) can't sign Sign in with Apple, push or associated
    /// domains; asking for any of them fails the iPhone build.
    @Test func aFreeAccountsEntitlementsAskOnlyForWhatItCanSign() throws {
        let data = try Data(contentsOf: TestFiles.url("Pane-ios-personal.entitlements"))
        let plist = try #require(try PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any])
        #expect(Set(plist.keys) == ["com.apple.security.application-groups", "keychain-access-groups"])
    }
}
#endif
