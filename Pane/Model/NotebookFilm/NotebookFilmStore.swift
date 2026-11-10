import Foundation
import Observation
import SwiftData
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The notebook film, offered once: after about a month of real use (FilmEligibility), as the app
/// opens. Made on this device from the notes here and who wrote them; titles and words are never
/// in it.
///
/// It never comes in the middle of a session. A launch on which the account is due only gets it
/// ready (`prepare`: reads who wrote what and keeps what the film needs on this device). The next
/// launch shows it as the app opens (`atLaunch`), before anything has been typed or touched and
/// never beside another prompt or during the first-run flow. A launch that isn't ready in time, or
/// on which you're already doing something (`postpone`), leaves it for the next one. Once it has
/// been on screen (`didPresent`) it isn't offered there again; it's kept, and Help shows it again
/// when you ask (`rewatch`).
///
/// Dev: `-forceNotebookFilm` shows a film of a made-up month (FilmDemo) as the notes open;
/// `-filmLook paper` starts it on a look.
@MainActor
@Observable
final class NotebookFilmStore {
    var visible = false
    /// The film being shown.
    private(set) var script: FilmScript?
    var look: FilmLook = .leaf
    /// A look asked for by name (captures) stays; otherwise the film opens in the app's appearance.
    private(set) var lookFixed = false
    /// The film is about to come up in an app that's dark, or light: it opens in that one.
    func follow(dark: Bool) {
        guard !lookFixed else { return }
        look = FilmLook.matching(dark: dark)
    }
    /// Folder names over their clusters (on unless you turn them off); note titles never show.
    var folderNames = true
    /// The film as a movie file for the look and folder names chosen now, once it's made. Movies
    /// are made in the background from the intro on, the chosen one first, then the other looks, so
    /// Share almost never waits and trying a look doesn't either.
    var movie: URL? { movies[movieKey] }
    /// How far the chosen movie is, 0...1, while it's being made.
    var making: Double? { movie == nil ? progress[movieKey] ?? 0 : nil }
    private(set) var movies: [String: URL] = [:]
    private var progress: [String: Double] = [:]
    @ObservationIgnored private var maker: Task<Void, Never>?
    @ObservationIgnored private var makingKey: String?

    private var movieKey: String { Self.key(look, folderNames) }
    private static func key(_ look: FilmLook, _ folderNames: Bool) -> String { "\(look.rawValue)-\(folderNames)" }

    @ObservationIgnored private var account: UUID?
    @ObservationIgnored private var service: FilmSource.Service?
    /// Asked for from Help, not offered at launch: it comes up at once.
    private(set) var rewatching = false
    @ObservationIgnored private(set) var launchChecked = false
    @ObservationIgnored private(set) var prepareChecked = false
    @ObservationIgnored let defaults: UserDefaults
    @ObservationIgnored let launched: Date
    @ObservationIgnored let forced: Bool
    @ObservationIgnored let folder: URL

    /// How long after launch it may still show: the app is opening, nothing has happened yet.
    static let launchWindow: TimeInterval = 6

    init(defaults: UserDefaults = .standard, launched: Date = .now, arguments: [String] = ProcessInfo.processInfo.arguments,
         folder: URL = NotebookFilmStore.defaultFolder) {
        self.defaults = defaults
        self.launched = launched
        self.folder = folder
        forced = arguments.contains("-forceNotebookFilm")
    }

    static var defaultFolder: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("NotebookFilm", isDirectory: true)
    }

    static func shownKey(_ account: UUID?) -> String { "notebookFilm.shown.\(account?.uuidString.lowercased() ?? "device")" }

    /// It was shown on this device for this account.
    var shown: Bool { defaults.bool(forKey: Self.shownKey(account)) }

    /// What the next launch shows, kept on this device.
    var preparedURL: URL { folder.appendingPathComponent("ready-\(account?.uuidString.lowercased() ?? "device").json") }

    /// The film once it has been shown, kept on this device so it can be watched again.
    var keptURL: URL { Self.keptURL(account, in: folder) }
    static func keptURL(_ account: UUID?, in folder: URL = defaultFolder) -> URL {
        folder.appendingPathComponent("shown-\(account?.uuidString.lowercased() ?? "device").json")
    }
    /// Help offers to show it again when it's there.
    static func canRewatch(_ account: UUID?, in folder: URL = defaultFolder) -> Bool {
        FileManager.default.fileExists(atPath: keptURL(account, in: folder).path)
    }
    /// How many months the kept film covers (1 when there's none to read).
    static func keptMonths(_ account: UUID?, in folder: URL = defaultFolder) -> Int {
        guard let data = try? Data(contentsOf: keptURL(account, in: folder)),
              let input = try? JSONDecoder().decode(FilmInput.self, from: data) else { return 1 }
        return FilmStats(input).months
    }

    func attach(account: UUID?, service: FilmSource.Service?) {
        if account != self.account { launchChecked = false; prepareChecked = false }
        self.account = account
        self.service = service
    }

    /// As the app opens: shows the film an earlier launch got ready, or nothing.
    func atLaunch(otherPrompt: Bool, now: Date = .now) {
        guard !forced, !visible, !launchChecked else { return }
        launchChecked = true
        guard !otherPrompt, !shown, now.timeIntervalSince(launched) <= Self.launchWindow,
              ShareAsk.lastKeystroke < launched,
              let data = try? Data(contentsOf: preparedURL),
              let input = try? JSONDecoder().decode(FilmInput.self, from: data) else { return }
        script = FilmScript(input)
        rewatching = false
        visible = true
    }

    /// It's on screen: it isn't offered on this device again, and it's kept to watch again.
    func didPresent() {
        guard !forced, !rewatching, !shown else { return }
        defaults.set(true, forKey: Self.shownKey(account))
        try? FileManager.default.removeItem(at: keptURL)
        try? FileManager.default.moveItem(at: preparedURL, to: keptURL)
    }

    /// Something was touched or typed before it came up: not on this launch. It stays ready
    /// for the next one.
    func postpone() {
        guard visible, !forced, !rewatching, !shown else { return }
        visible = false
        script = nil
    }

    /// From Help: shows the film this device kept.
    func rewatch() {
        guard !visible, let data = try? Data(contentsOf: keptURL),
              let input = try? JSONDecoder().decode(FilmInput.self, from: data) else { return }
        script = FilmScript(input)
        rewatching = true
        visible = true
    }

    /// Later in a launch, never showing anything: if the account is due, reads who wrote what and
    /// keeps the film's notes for the next launch. Reads from the server only when the notes here
    /// could be enough.
    func prepare(context: ModelContext, now: Date = .now) async {
        guard !forced, !prepareChecked, let service else { return }
        prepareChecked = true
        guard !shown, !visible, !FileManager.default.fileExists(atPath: preparedURL.path),
              FilmSource.mightBeReady(context, now: now) else { return }
        let ids = ((try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? []).map(\.id)
        guard let rows = try? await service.rows(notes: ids) else { return }
        let input = FilmSource.notes(context, edits: FilmSource.edits(rows), now: now)
        guard FilmEligibility.isReady(input), let data = try? JSONEncoder().encode(input) else { return }
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        try? data.write(to: preparedURL, options: .atomic)
    }

    /// Dev: `-forceNotebookFilm`; captures: `-filmLook paper`, `-filmNoFolderNames`, `-filmLight`
    /// (the thinnest month it's offered for).
    func showIfForced() {
        guard forced, !visible else { return }
        rewatching = false
        // Captures: `-filmLook paper`.
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-filmLook"), i + 1 < args.count, let l = FilmLook(rawValue: args[i + 1]) { look = l; lookFixed = true }
        if args.contains("-filmNoFolderNames") { folderNames = false }
        script = FilmScript(FilmDemo.notebook(now: .now, light: args.contains("-filmLight")))
        visible = true
    }

    /// The film as you've set it: its look, folder names, and the app's mark in the corner.
    var labels: FilmRenderer.Labels { labels(look: look, folderNames: folderNames) }

    static let mark: CGImage? = {
        #if os(macOS)
        NSImage(named: "MarkTight")?.cgImage(forProposedRect: nil, context: nil, hints: nil)
        #else
        UIImage(named: "MarkTight")?.cgImage
        #endif
    }()

    static func title(_ s: FilmStats?) -> String { "Your \(s?.period ?? "first month")" }
    /// What the film in hand is called when it's shared or saved.
    var shareTitle: String { script.map { labels.title($0.stats) } ?? "My first month" }
    var fileName: String { "Pinto Notes \u{2013} \(shareTitle.prefix(1).lowercased() + shareTitle.dropFirst()).mp4" }

    /// Makes the movies still missing: the one chosen now first, then the other looks with the
    /// same folder names. Choosing another look or folder names while one is being made moves
    /// that one to the front.
    func makeMovies() {
        guard let script else { return }
        if movie != nil, maker != nil { return }
        if let makingKey, makingKey == movieKey, maker != nil { return }
        maker?.cancel()
        let folderNames = folderNames
        let order = [look] + FilmLook.offered.filter { $0 != look }
        let jobs = order.map { (Self.key($0, folderNames), labels(look: $0, folderNames: folderNames)) }
            .filter { movies[$0.0] == nil }
        guard !jobs.isEmpty else { maker = nil; return }
        maker = Task { [weak self] in
            for (k, (key, labels)) in jobs.enumerated() {
                guard !Task.isCancelled else { return }
                // The one you're looking at is made at once; the others after it, in the background.
                let priority: TaskPriority = k == 0 && key == self?.movieKey ? .userInitiated : .utility
                self?.makingKey = key
                let dir = FileManager.default.temporaryDirectory.appendingPathComponent("NotebookFilm-\(UUID().uuidString)", isDirectory: true)
                let url = dir.appendingPathComponent(await MainActor.run { self?.fileName } ?? "Pinto Notes \u{2013} my first month.mp4")
                let work = Task.detached(priority: priority) { () -> Bool in
                    do {
                        // Written under another name and renamed when it's whole.
                        let making = dir.appendingPathComponent("making.mp4")
                        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                        try FilmVideo.write(FilmRenderer(script: script, labels: labels), to: making) { p in
                            Task { @MainActor in self?.progress[key] = p }
                        }
                        try FileManager.default.moveItem(at: making, to: url)
                        return true
                    } catch {
                        return false
                    }
                }
                let ok = await withTaskCancellationHandler { await work.value } onCancel: { work.cancel() }
                guard !Task.isCancelled, let self else { return }
                progress[key] = nil
                if ok { movies[key] = url }
            }
            self?.maker = nil
            self?.makingKey = nil
        }
    }

    /// Closed: stops making movies (the ones made stay until the app quits).
    func stopMaking() {
        maker?.cancel()
        maker = nil
        makingKey = nil
    }

    func labels(look: FilmLook, folderNames: Bool) -> FilmRenderer.Labels {
        var l = FilmRenderer.Labels()
        l.look = look
        l.folderNames = folderNames
        l.markImage = Self.mark
        return l
    }
}
