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
    /// The page to open once Settings is showing; cleared when it has.
    var target: SettingsTab?
    #if os(macOS)
    /// Mac: Settings is waiting to show, as a sheet on the notes window in front (NoteListView takes it).
    var presenting = false
    @ObservationIgnored private var asks = 0
    #endif
    /// Counts `open` calls, so the Mac's Settings goes to the page even when it is the remembered one.
    private(set) var opened = 0

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        tab = defaults.string(forKey: Self.key).flatMap(SettingsTab.init) ?? .general
    }

    /// Settings at `tab`: it shows (on the Mac, as a sheet on the notes window) and opens the page.
    func open(_ tab: SettingsTab) {
        self.tab = tab
        opened += 1
        target = tab
        #if os(macOS)
        show()
        #endif
    }

    #if os(macOS)
    /// Settings on the notes window in front: Cmd-comma, the menu bar. A request no notes window
    /// takes soon (signed out, say) is dropped rather than showing later out of nowhere.
    func show() {
        presenting = true
        asks += 1
        let asked = asks
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(3))
            if asks == asked { presenting = false }
        }
    }
    #endif
}
