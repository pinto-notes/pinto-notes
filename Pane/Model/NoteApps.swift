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

    // MARK: The device

    /// What an app may use of the device beyond a link, the share sheet and the photo and file
    /// pickers: Reminders, Calendar, notifications, the camera, contacts, location, Maps, weather
    /// and the on-device model (NotePageDevice). The system gives those permissions to Pinto Notes
    /// as a whole, not to one note's app, so until each app is asked for itself they are off in the
    /// released app (Release, Pinto Notes' own bundle id) on iPhone, iPad and Mac. An app that
    /// calls one is told it isn't available yet.
    ///
    /// Development builds (Debug, QA) and Pinto Notes Beta have them on; `-noteAppDevice NO` there
    /// shows the released state. The setting can't turn them on in the released app.
    static let deviceKey = "noteAppDevice"

    static let device: Bool = {
        #if DEBUG || QA
        let development = true
        #else
        let development = false
        #endif
        let defaults = UserDefaults.standard
        return isDeviceEnabled(development: development, beta: AppIdentity.keychainPrefix.hasSuffix(".beta"),
                               setting: defaults.object(forKey: deviceKey) == nil ? nil : defaults.bool(forKey: deviceKey))
    }()

    static func isDeviceEnabled(development: Bool, beta: Bool, setting: Bool?) -> Bool {
        development || beta ? setting ?? true : false
    }

    /// The app a note runs, as NotePageStore.live: none while apps are off.
    @MainActor static func page(_ id: UUID, in store: NotePageStore = .shared, enabled: Bool = NoteApps.enabled) -> NotePageStore.Page? {
        enabled ? store.live(id) : nil
    }
}
