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

    /// A web project's folder dropped on a note (its text or its app, on the Mac) becomes the note's
    /// app as it's built, the way a site's folder opens in a browser. The app it replaces stays in
    /// Previous App. Not for a locked, deleted or shared note, as Make It an App isn't.
    @MainActor static func takeFolder(_ url: URL, for note: Note, store: NotePageStore = .shared, enabled: Bool = enabled) throws {
        guard enabled, !note.isLocked, note.trashedAt == nil, !note.isShared else {
            throw NotePageProject.FolderError("This note can't have an app.")
        }
        let project = try NotePageProject.folder(url)
        store.setHere(note.id, .init(html: project.stored, by: "You", at: .now))
    }

    static let enabled: Bool = {
        let defaults = UserDefaults.standard
        return isEnabled(setting: defaults.object(forKey: key) == nil ? nil : defaults.bool(forKey: key))
    }()

    /// On unless the `noteApps` setting says no.
    static func isEnabled(setting: Bool?) -> Bool {
        setting ?? true
    }

    // MARK: Pictures with the real note

    /// Whether Settings offers "Let AIs preview apps with my notes" (AppPreviewSection): the one
    /// way a note's real text could reach the service that draws app previews. Not in the released
    /// app, where the server refuses real data whatever the setting says. Development builds
    /// (Debug, QA) and Pinto Notes Beta keep it, for a server set up to allow it.
    static let realPreviews: Bool = {
        #if DEBUG || QA
        return true
        #else
        return AppIdentity.keychainPrefix.hasSuffix(".beta")
        #endif
    }()

    /// The app a note runs, as NotePageStore.live: none while apps are off.
    @MainActor static func page(_ id: UUID, in store: NotePageStore = .shared, enabled: Bool = NoteApps.enabled) -> NotePageStore.Page? {
        enabled ? store.live(id) : nil
    }
}
