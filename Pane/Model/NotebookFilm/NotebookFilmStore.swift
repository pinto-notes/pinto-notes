import Foundation
import CoreTransferable
import Observation
import SwiftData
import UniformTypeIdentifiers
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
/// launch shows it as the app opens (`atLaunch`), before anything has been typed and never beside
/// another prompt or during the first-run flow. A launch that isn't ready in time leaves it for the
/// next one. Once shown on a device, it isn't offered there again.
///
/// Dev: `-forceNotebookFilm` shows a film of a made-up month (FilmDemo) as the notes open;
/// `-filmLook paper` starts it on a look.
@MainActor
@Observable
final class NotebookFilmStore {
    var visible = false
    /// The film being shown.
    private(set) var script: FilmScript?
    var look: FilmLook = .night
    /// Folder names over their clusters (on unless you turn them off); note titles never show.
    var folderNames = true

    @ObservationIgnored private var account: UUID?
    @ObservationIgnored private var service: FilmSource.Service?
    @ObservationIgnored private(set) var launchChecked = false
    @ObservationIgnored private(set) var prepareChecked = false
    @ObservationIgnored let defaults: UserDefaults
    @ObservationIgnored let launched: Date
    @ObservationIgnored let forced: Bool
    @ObservationIgnored let folder: URL

    /// How long after launch it may still show: the app is opening, nothing has happened yet.
    static let launchWindow: TimeInterval = 6

    init(defaults: UserDefaults = .standard, launched: Date = .now, arguments: [String] = ProcessInfo.processInfo.arguments,
         folder: URL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("NotebookFilm", isDirectory: true)) {
        self.defaults = defaults
        self.launched = launched
        self.folder = folder
        forced = arguments.contains("-forceNotebookFilm")
    }

    static func shownKey(_ account: UUID?) -> String { "notebookFilm.shown.\(account?.uuidString.lowercased() ?? "device")" }

    /// It was shown on this device for this account.
    var shown: Bool { defaults.bool(forKey: Self.shownKey(account)) }

    /// What the next launch shows, kept on this device.
    var preparedURL: URL { folder.appendingPathComponent("ready-\(account?.uuidString.lowercased() ?? "device").json") }

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
        visible = true
        defaults.set(true, forKey: Self.shownKey(account))
        try? FileManager.default.removeItem(at: preparedURL)
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

    /// Dev: `-forceNotebookFilm`.
    func showIfForced() {
        guard forced, !visible else { return }
        // Captures: `-filmLook paper`.
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-filmLook"), i + 1 < args.count, let l = FilmLook(rawValue: args[i + 1]) { look = l }
        script = FilmScript(FilmDemo.notebook(now: .now))
        visible = true
    }

    /// The film as you've set it: its look, folder names, and the app's mark in the corner.
    var labels: FilmRenderer.Labels {
        var l = FilmRenderer.Labels()
        l.look = look
        l.folderNames = folderNames
        l.markImage = Self.mark
        return l
    }

    static let mark: CGImage? = {
        #if os(macOS)
        NSImage(named: "MarkTight")?.cgImage(forProposedRect: nil, context: nil, hints: nil)
        #else
        UIImage(named: "MarkTight")?.cgImage
        #endif
    }()

    static func title(_ s: FilmStats?) -> String { "Your first month" }
}

/// The film as a movie file, made when it's shared (the share sheet waits for it).
struct FilmMovie: Transferable, Sendable {
    let script: FilmScript
    let labels: FilmRenderer.Labels

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(exportedContentType: .mpeg4Movie) { movie in
            let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let url = dir.appendingPathComponent("Pinto Notes \u{2013} my notebook.mp4")
            try FilmVideo.write(FilmRenderer(script: movie.script, labels: movie.labels), to: url)
            return SentTransferredFile(url)
        }
    }
}
