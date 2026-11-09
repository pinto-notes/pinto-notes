import Foundation
import Observation
import SwiftData

/// The notebook film, offered once: at a launch, after about a month of real use (FilmEligibility),
/// ready to share the moment it shows. Made on this device from the notes here and who wrote
/// them; titles and words are never in it.
///
/// The moment follows the share ask's rules (ShareAsk): only at launch, within its first two
/// minutes, never once a key has been typed, never on a launch that shows another prompt, and
/// never during the first-run flow. Once shown on a device, it isn't offered there again.
///
/// Dev: `-forceNotebookFilm` shows a film of a made-up month (FilmDemo) a second after launch.
@MainActor
@Observable
final class NotebookFilmStore {
    var visible = false
    /// The film, once made.
    private(set) var movie: URL?
    private(set) var stats: FilmStats?

    @ObservationIgnored private var account: UUID?
    @ObservationIgnored private var service: FilmSource.Service?
    @ObservationIgnored private(set) var launchChecked = false
    @ObservationIgnored let defaults: UserDefaults
    @ObservationIgnored let launched: Date
    @ObservationIgnored let forced: Bool

    init(defaults: UserDefaults = .standard, launched: Date = .now, arguments: [String] = ProcessInfo.processInfo.arguments) {
        self.defaults = defaults
        self.launched = launched
        forced = arguments.contains("-forceNotebookFilm")
    }

    static func shownKey(_ account: UUID?) -> String { "notebookFilm.shown.\(account?.uuidString.lowercased() ?? "device")" }

    /// It was shown on this device for this account.
    var shown: Bool { defaults.bool(forKey: Self.shownKey(account)) }

    func attach(account: UUID?, service: FilmSource.Service?) {
        if account != self.account { launchChecked = false }
        self.account = account
        self.service = service
    }

    /// Where the film is kept: the caches, one per account, replaced each time it's made.
    static func movieURL(_ account: UUID?) -> URL {
        let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("NotebookFilm", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("Pinto Notes \u{2013} \(account?.uuidString.prefix(8).lowercased() ?? "notebook").mp4")
    }

    /// The launch's one chance. Reads who wrote what from the server only when the notes here
    /// could be enough, makes the film off the main thread, and shows it if the moment still holds.
    func atLaunch(context: ModelContext, otherPrompt: Bool, now: Date = .now) async {
        guard !forced, !visible, !launchChecked, let service else { return }
        launchChecked = true
        guard !otherPrompt, !shown, FilmSource.mightBeReady(context, now: now) else { return }
        let ids = ((try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? []).map(\.id)
        guard let rows = try? await service.rows(notes: ids) else { return }
        let input = FilmSource.notes(context, edits: FilmSource.edits(rows), now: now)
        guard FilmEligibility.isReady(input) else { return }
        guard await make(input) else { return }
        // The person may have started something meanwhile: then it waits for another launch.
        guard Date.now.timeIntervalSince(launched) <= ShareAsk.launchWindow, ShareAsk.lastKeystroke < launched else { return }
        show()
    }

    /// Dev: `-forceNotebookFilm`.
    func showIfForced() async {
        guard forced, !visible else { return }
        if await make(FilmDemo.notebook(now: .now)) { visible = true }
    }

    private func make(_ input: FilmInput) async -> Bool {
        let url = Self.movieURL(account)
        let made = await Task.detached(priority: .utility) { () -> FilmStats? in
            let script = FilmScript(input)
            do {
                try FilmVideo.write(FilmRenderer(script: script), to: url)
                return script.stats
            } catch {
                return nil
            }
        }.value
        guard let made else { return false }
        stats = made
        movie = url
        return true
    }

    private func show() {
        visible = true
        defaults.set(true, forKey: Self.shownKey(account))
    }
}
