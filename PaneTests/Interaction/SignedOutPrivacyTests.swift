#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Privacy and security signed out (persona council, 4 November 2026: Marcus reads it before he
/// signs in): every "How it works" line is on the page, as a new account has them, locked notes
/// said as the app says them everywhere, with the diagnostics and the terms still under them.
@MainActor @Suite(.serialized) struct SignedOutPrivacyTests {
    @Test func signedOutThePageSaysHowItWorks() async throws {
        let settings = SettingsView(backend: Backend(), sync: nil)
        let ax = OffscreenAX(settings.place(.security).frame(width: SettingsCard.pageWidth).environment(\.settingsAsPage, true),
                             size: CGSize(width: SettingsCard.pageWidth, height: 1400))
        defer { ax.close() }
        await ax.settle(600)
        let line = try #require(ax.find("privacy.signedOut"), "the line on what signing in adds: \(ax.ids())")
        #expect(line.text.contains("Sign in to see each device and AI"), "\(line.text)")
        for item in PrivacyCopy.signedOutHow {
            let row = try #require(ax.find("privacy.how.\(item.symbol)"), "\(item.title)")
            #expect(row.text.contains(item.title), "\(row.text)")
        }
        let locked = try #require(ax.find("privacy.how.lock.doc"))
        #expect(locked.text.contains("An AI sees that a locked note exists, not its title or text."), "\(locked.text)")
        // What a connected AI can do, as Allow says it.
        let ais = try #require(ax.find("privacy.how.sparkles"))
        #expect(ais.text.contains("Each AI you connect " + PrivacyCopy.aiMay), "what it may do comes first: \(ais.text)")
        #expect(ConnectCopy.scope == "It " + PrivacyCopy.aiMay)
        #expect(ax.find("privacy.learnMore") != nil, "the website's longer page")
        #expect(ax.find("settings.diagnostics") != nil, "diagnostics stay: \(ax.ids())")
        // As a new account has it: Pinto Notes keeps a copy of the key, said with what it means.
        let titles = PrivacyCopy.signedOutHow.map(\.title)
        #expect(titles.contains("Pinto Notes keeps a copy of your key") && titles.contains("That means Pinto Notes could open them"))
        #expect(titles.contains("Connected AIs") && titles.last == "Locked notes")
    }
}
#endif
