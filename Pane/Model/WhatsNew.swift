import Foundation
import Observation

/// What changed in each version lives on the website's changes page, reached from Help ›
/// What's New… on the Mac and Settings › About on iPhone and iPad. The app shows no release
/// notes by itself: a card at the top of the note list was in the way, and meant nothing to a
/// new account (2026-10-12).
enum WhatsNew {
    static let changelogURL = URL(string: "https://pintonotes.com/changelog")!
    static let title = "What\u{2019}s New"
}

/// Which page Settings shows. The Mac keeps its last tab for next time; links, cards and the
/// storage warning open Settings at a page (the card's "Reconnect your AI" opens AI).
@MainActor
@Observable
final class SettingsRoute {
    static let shared = SettingsRoute()
    static let key = "settings.tab"
    @ObservationIgnored private let defaults: UserDefaults

    /// The Mac's tab, remembered across launches.
    var tab: SettingsTab { didSet { if tab != oldValue { defaults.set(tab.rawValue, forKey: Self.key) } } }
    /// iPhone: the page to open once Settings is showing; cleared when it has.
    var target: SettingsTab?

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        tab = defaults.string(forKey: Self.key).flatMap(SettingsTab.init) ?? .general
    }

    /// Settings at `tab`: the Mac's window switches to it, iPhone opens its page.
    func open(_ tab: SettingsTab) {
        self.tab = tab
        #if os(iOS)
        target = tab
        #endif
    }
}
