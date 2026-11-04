#if os(macOS)
import AppKit
import SwiftUI
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

    /// A dev run (PANE_DEV_RUN=1) keeps its own library and Keychain items, still as the beta.
    @Test func aDevRunHasItsOwnLibraryAndKeychain() {
        #expect(AppIdentity.dataFolder(bundleID: "dev.emilwagman.pane.beta", devRun: true) == "Pane-devrun")
        #expect(AppIdentity.dataFolder(bundleID: "dev.emilwagman.pane.beta", devRun: false) == "Pane")
        let prefix = AppIdentity.keychainPrefix(bundleID: "dev.emilwagman.pane.beta", devRun: true)
        #expect(prefix != "dev.emilwagman.pane.beta" && prefix.hasSuffix(".beta"))
        #expect(AppIdentity.keychainPrefix(bundleID: "dev.emilwagman.pane", devRun: false) == "dev.emilwagman.pane")
        #expect(!AppIdentity.devRun, "tests aren't a dev run")
    }

    /// Signed out, the sidebar behind the sign-in card is empty: no "Folders" heading up under
    /// the window's buttons (Emil, 2 November 2026).
    @Test func anEmptySidebarHasNoHeading() {
        #expect(!SidebarView.showsHeading(folders: 0, trashed: 0))
        #expect(SidebarView.showsHeading(folders: 1, trashed: 0))
        #expect(SidebarView.showsHeading(folders: 0, trashed: 2))
    }

    /// Under the sign-in form: short, and still says it never sends your notes and can be
    /// turned off (Emil, 2 November 2026).
    @Test func theSignInDisclosureIsShort() {
        #expect(DiagnosticsCopy.signIn == "Sends error reports and counts. Never your notes. Turn off in Settings.")
    }

    /// The terms and privacy links in the sentence carry an underline (shown on iPhone, where
    /// there's no pointer; the Mac's LinkLabel shows it only under the pointer).
    @Test func theConsentLinksAreUnderlined() {
        for sentence in [Legal.consentSentence, Legal.shortConsent] {
            let links = sentence.runs.filter { $0.link != nil }
            #expect(links.count == 2)
            #expect(links.allSatisfy { $0.underlineStyle == .single })
            #expect(sentence.runs.filter { $0.link == nil }.allSatisfy { $0.underlineStyle == nil })
        }
    }

    #if os(macOS)
    /// On the Mac the sign-in footer's links carry the hand cursor and stay links.
    @MainActor @Test func theFooterLinksShowAHand() {
        let styled = LinkLabel.styled(Legal.consentSentence)
        var hands = 0, links = 0
        styled.enumerateAttributes(in: NSRange(location: 0, length: styled.length)) { attrs, _, _ in
            if attrs[.link] != nil { links += 1; if (attrs[.cursor] as? NSCursor) == NSCursor.pointingHand { hands += 1 } }
        }
        #expect(links == 2 && hands == 2)
        #expect(LinkLabel.View().acceptsFirstMouse(for: nil), "a link opens on the first click, the window behind or not")
    }

    /// With keyboard navigation on, Tab reaches each link with a focus ring, and Return opens it
    /// (council rounds 7 and 8). Events go straight to the view; nothing is posted to the system.
    @MainActor @Test func theFooterLinksTakeTheKeyboard() async throws {
        let host = NSHostingView(rootView: LinkLabel(text: Legal.consentSentence).frame(width: 360))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 360, height: 80), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        try await Task.sleep(for: .milliseconds(100))
        func find(_ v: NSView) -> LinkLabel.View? { (v as? LinkLabel.View) ?? v.subviews.lazy.compactMap(find).first }
        let label = try #require(find(host))
        label.keyboardNavigation = { false }
        #expect(!label.acceptsFirstResponder, "no focus without keyboard navigation: a click never leaves it focused")
        label.keyboardNavigation = { true }
        var opened: [URL] = []
        label.opener = { opened.append($0) }
        #expect(label.links.count == 2)
        #expect(window.makeFirstResponder(label) && label.focused == 0, "Tab lands on Terms of Service")
        #expect(label.focusRingMaskBounds.width > 20, "the ring is the link's own")
        func key(_ code: UInt16, _ chars: String, shift: Bool = false) -> NSEvent {
            NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: shift ? .shift : [], timestamp: 0, windowNumber: window.windowNumber,
                             context: nil, characters: chars, charactersIgnoringModifiers: chars, isARepeat: false, keyCode: code)!
        }
        label.keyDown(with: key(48, "\t"))
        #expect(label.focused == 1, "Tab: Privacy Policy")
        label.keyDown(with: key(36, "\r"))
        #expect(opened.count == 1 && opened.first?.absoluteString.lowercased().contains("privacy") == true, "Return opens it: \(opened)")
        label.keyDown(with: key(48, "\t", shift: true))
        #expect(label.focused == 0, "Shift-Tab: back to Terms")
    }

    /// Emil (11-03): the links didn't underline under the pointer; the fix was an underline that
    /// was always there. Now like "Forgot password?": plain at rest, underlined while hovered.
    @MainActor @Test func theFooterLinksUnderlineUnderThePointer() async throws {
        let host = NSHostingView(rootView: LinkLabel(text: Legal.consentSentence).frame(width: 360))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 360, height: 80), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        try await Task.sleep(for: .milliseconds(100))
        func find(_ v: NSView) -> LinkLabel.View? { (v as? LinkLabel.View) ?? v.subviews.lazy.compactMap(find).first }
        let label = try #require(find(host))
        let storage = try #require(label.textStorage), layout = try #require(label.layoutManager), container = try #require(label.textContainer)
        let terms = (storage.string as NSString).range(of: "Terms of Service")
        func underlined(_ range: NSRange) -> Bool {
            (storage.attribute(.underlineStyle, at: range.location, effectiveRange: nil) as? Int ?? 0) != 0
                || (layout.temporaryAttribute(.underlineStyle, atCharacterIndex: range.location, effectiveRange: nil) as? Int ?? 0) != 0
        }
        #expect(!underlined(terms), "no underline at rest")

        let glyphs = layout.glyphRange(forCharacterRange: terms, actualCharacterRange: nil)
        let rect = layout.boundingRect(forGlyphRange: glyphs, in: container)
        label.hover(at: NSPoint(x: rect.midX + label.textContainerOrigin.x, y: rect.midY + label.textContainerOrigin.y))
        #expect(label.hovered == terms)
        #expect(underlined(terms), "underlined under the pointer")
        let privacy = (storage.string as NSString).range(of: "Privacy Policy")
        #expect(!underlined(privacy), "only the link under the pointer")

        label.hover(at: nil)
        #expect(!underlined(terms), "and plain again when it leaves")
    }
    #endif

    /// The Mac sidebar's rows replace its cards (Connect your AI, Templates).
    @Test func theMacSidebarHasRowsNotCards() {
        #expect(!SidebarView.showsCards)
    }
}

#endif
