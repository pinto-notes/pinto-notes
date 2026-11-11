import Foundation
import Observation
import SwiftData
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The notebook film, offered after about a month of real use (FilmEligibility): a card in the
/// sidebar (`offered`) that you open when you like (`open`). It never comes up by itself. Made on
/// this device from the notes here and who wrote them; titles show only on your screen, and only
/// in the slides before the film.
///
/// A launch on which the account is due only gets it ready (`prepare`: reads who wrote what and
/// keeps what the film needs on this device). The next launch offers it (`atLaunch`), never during
/// the first-run flow or beside another prompt. Once it's been opened (`didPresent`), or its card
/// closed (`closeOffer`), it isn't offered again; it's kept, and Help shows it again (`rewatch`).
///
/// Dev: `-forceNotebookFilm` opens a film of a made-up month (FilmDemo) as the notes open
/// (`-filmCard` offers it as the card instead); `-filmLook paper` starts it on a look.
@MainActor
@Observable
final class NotebookFilmStore {
    var visible = false
    /// Its card is in the sidebar: tap to open it, or close it.
    private(set) var offered = false
    /// Opened from its card: it comes up at once, and nothing you do first puts it off.
    private(set) var opened = false
    /// You asked for it (its card, or Help): it comes up at once.
    var asked: Bool { opened || rewatching }
    /// The film being shown.
    private(set) var script: FilmScript?
    /// What the film in hand was made from: the cards before it are drawn from it.
    private(set) var input: FilmInput?
    /// The month as cards and then the paper galaxy (false: the older looks, kept for comparing).
    var galaxy = true
    var look: FilmLook = .holoLeaf
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

    /// As the app opens: offers the film an earlier launch got ready, as a card, or nothing.
    func atLaunch(otherPrompt: Bool, now: Date = .now) {
        guard !forced, !visible, !offered, !launchChecked else { return }
        launchChecked = true
        guard !otherPrompt, !shown,
              let data = try? Data(contentsOf: preparedURL),
              let input = try? JSONDecoder().decode(FilmInput.self, from: data) else { return }
        self.input = input
        script = FilmScript(input, bang: galaxy)
        rewatching = false
        offered = true
    }

    /// Its card was tapped: it comes up now.
    func open() {
        guard offered, script != nil else { return }
        offered = false
        opened = true
        rewatching = false
        visible = true
    }

    /// Its card was closed: not offered again, and kept for Help.
    func closeOffer() {
        guard offered else { return }
        offered = false
        didPresent()
        if !forced { script = nil; input = nil }
    }

    /// What its card says: what you set out with, and that it's ready.
    var offerLine: String? {
        guard let input, let script else { return nil }
        return FilmSlides.cardLine(input, script: script)
    }

    /// It's on screen: it isn't offered on this device again, and it's kept to watch again.
    func didPresent() {
        offered = false
        guard !forced, !rewatching, !shown else { return }
        defaults.set(true, forKey: Self.shownKey(account))
        try? FileManager.default.removeItem(at: keptURL)
        try? FileManager.default.moveItem(at: preparedURL, to: keptURL)
    }

    /// Something was touched or typed before it came up: not on this launch. It stays ready
    /// for the next one.
    func postpone() {
        guard visible, !forced, !asked, !shown else { return }
        visible = false
        script = nil
    }

    /// From Help: shows the film this device kept.
    func rewatch() {
        guard !visible else { return }
        // (Its card, if it's up, is what Help means.)
        if offered { open(); return }
        guard let data = try? Data(contentsOf: keptURL),
              let input = try? JSONDecoder().decode(FilmInput.self, from: data) else { return }
        self.input = input
        script = FilmScript(input, bang: galaxy)
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
        guard forced, !visible, !offered else { return }
        rewatching = false
        // Captures: `-filmLook paper`.
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-filmLook"), i + 1 < args.count, let l = FilmLook(rawValue: args[i + 1]) { look = l; lookFixed = true }
        if args.contains("-filmNoFolderNames") { folderNames = false }
        // Captures: `-filmMe` (came with notes, makes and removes some, a daily tracker), `-filmWeek`
        // (a note a week), `-filmKB` (a knowledge base of hundreds).
        let demo = args.contains("-filmMe") ? FilmDemo.real(now: .now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
            : args.contains("-filmWeek") ? FilmDemo.real(now: .now)
            : args.contains("-filmKB") ? FilmDemo.real(now: .now, notesPerWeek: 22, imported: 240, removed: 8, linked: 0.6)
            : FilmDemo.notebook(now: .now, light: args.contains("-filmLight"))
        if args.contains("-filmOldLooks") { galaxy = false }
        input = demo
        script = FilmScript(demo, bang: galaxy)
        // Captures: `-filmCard` offers it as its card; otherwise it opens at once.
        // (`-filmAutoOpen` then opens it from the card a moment later, as a tap would.)
        if args.contains("-filmCard") {
            offered = true
            if args.contains("-filmAutoOpen") { Task { try? await Task.sleep(for: .seconds(3)); self.open() } }
        } else { opened = true; visible = true }
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
    var shareTitle: String { script.map { labels.title($0.stats) } ?? "Your first month" }
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
        let order = galaxy ? [look] : [look] + FilmLook.offered.filter { $0 != look }
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
                let url = dir.appendingPathComponent(await MainActor.run { self?.fileName } ?? "Pinto Notes \u{2013} your first month.mp4")
                let work = Task.detached(priority: priority) { () async -> Bool in
                    do {
                        // Written under another name and renamed when it's whole.
                        let making = dir.appendingPathComponent("making.mp4")
                        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                        try await FilmVideo.write(FilmRenderer(script: script, labels: labels), to: making) { p in
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
        if galaxy {
            // The paper galaxy: no lines to read while it grows, and its name only at the end.
            l.look = .town
            l.scene = { script, names in GalaxyScene(script: script, names: names, seed: script.seed) }
            l.captionsOn = false
            l.startsAtFirstNote = true
            // (The play screen before it has said what this is.)
            l.openingTitle = false
            l.sound = true
            l.workCount = FilmRenderer.Labels.notesAndEdits
            let kind = GalaxyScene.name(of: script?.form ?? .nebula)
            // (Not "your first month": what it is, is the notebook.)
            l.endTitle = { _ in "Your notebook is \(kind)" }
        }
        return l
    }
}
