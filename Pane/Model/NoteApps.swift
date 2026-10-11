import Foundation

/// Notes that are apps (see NotePage, MakeAnApp): this is the one switch every way in asks. Off,
/// nothing offers to make an app, Settings has no app sections, a template's app isn't fetched, and
/// a note that already has an app opens as its text. The app and its data stay stored and synced
/// untouched.
///
/// On in every build, the released app included. `-noteApps NO` (a launch argument, or
/// `defaults write dev.emilwagman.pane noteApps -bool NO`; Pinto Notes Beta's domain ends in
/// `.beta`) turns them off on that device, read once at launch.
enum NoteApps {
    static let key = "noteApps"

    static let enabled: Bool = {
        let defaults = UserDefaults.standard
        return isEnabled(setting: defaults.object(forKey: key) == nil ? nil : defaults.bool(forKey: key))
    }()

    /// On unless the `noteApps` setting says no.
    static func isEnabled(setting: Bool?) -> Bool {
        setting ?? true
    }

    /// The app a note runs, as NotePageStore.live: none while apps are off.
    @MainActor static func page(_ id: UUID, in store: NotePageStore = .shared, enabled: Bool = NoteApps.enabled) -> NotePageStore.Page? {
        enabled ? store.live(id) : nil
    }
}
