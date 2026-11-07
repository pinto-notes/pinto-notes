import Foundation
import SwiftData
import Testing
@testable import Pane

/// What an app sent stays on this device only while it's needed: never the request body or query
/// on disk, and none of it once the note, its app or the library is gone.
@MainActor
@Suite struct NotePageNetLogTests {
    static let canary = "canary-7f3a9 private note text"

    static func defaults() -> UserDefaults {
        let name = "NotePageNetLogTests.\(UUID().uuidString)"
        let d = UserDefaults(suiteName: name)!
        d.removePersistentDomain(forName: name)
        return d
    }

    static func entry() -> NotePageNetLog.Entry {
        .init(at: .now, method: "POST", url: "https://api.example.com/v1/save?q=\(canary.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!)#frag",
              sent: "{\"text\":\"\(canary)\"}", status: 200, key: nil, carriesNoteText: true)
    }

    static func onDisk(_ d: UserDefaults) -> String {
        [d.data(forKey: "notePageNetLog"), d.data(forKey: "notePageApprovedHosts")].compactMap { $0 }.map { String(decoding: $0, as: UTF8.self) }.joined()
    }

    @Test func theBodyAndQueryAreShownNowButNeverWrittenToDisk() {
        let d = Self.defaults(), note = UUID()
        let log = NotePageNetLog(defaults: d)
        log.add(Self.entry(), for: note)
        #expect(log.entries[note]?.last?.sent.contains("canary-7f3a9") == true, "the open app shows the whole request")
        #expect(!Self.onDisk(d).contains("canary-7f3a9"))
        let reopened = NotePageNetLog(defaults: d)
        let kept = try? #require(reopened.entries[note]?.last)
        #expect(kept?.url == "https://api.example.com/v1/save" && kept?.sent == "" && kept?.status == 200 && kept?.carriesNoteText == true)
    }

    @Test func aLogWrittenBeforeLosesItsBodiesWhenRead() throws {
        let d = Self.defaults(), note = UUID()
        d.set(try JSONEncoder().encode([note: [Self.entry()]]), forKey: "notePageNetLog")
        #expect(Self.onDisk(d).contains("canary-7f3a9"))
        let log = NotePageNetLog(defaults: d)
        #expect(!Self.onDisk(d).contains("canary-7f3a9"))
        #expect(log.entries[note]?.count == 1)
    }

    @Test func forgettingANoteOrEverythingLeavesNothingBehind() {
        let d = Self.defaults(), one = UUID(), two = UUID()
        let log = NotePageNetLog(defaults: d)
        for n in [one, two] { log.approve("api.example.com", for: n); log.add(Self.entry(), for: n) }
        log.forgetNote(one)
        #expect(log.entries[one] == nil && !log.isApproved("api.example.com", for: one))
        #expect(log.entries[two]?.count == 1 && log.isApproved("api.example.com", for: two))
        #expect(NotePageNetLog(defaults: d).entries[one] == nil)
        log.forgetAll()
        #expect(log.entries.isEmpty && log.approved.isEmpty)
        #expect(d.data(forKey: "notePageNetLog") == nil && d.data(forKey: "notePageApprovedHosts") == nil)
        let reopened = NotePageNetLog(defaults: d)
        #expect(reopened.entries.isEmpty && reopened.approved.isEmpty)
    }

    @Test func removingTheLibraryOrDeletingANoteForGoodClearsItsLog() throws {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = container.mainContext
        let folder = Folder(name: "Work")
        context.insert(folder)
        let kept = Note(body: "Weather\n\nRome", folder: folder), gone = Note(body: "Plan\n\n\(Self.canary)", folder: folder)
        context.insert(kept)
        context.insert(gone)
        try context.save()
        let log = NotePageNetLog.shared
        for n in [kept, gone] { log.approve("api.example.com", for: n.id); log.add(Self.entry(), for: n.id) }

        context.trash(gone)
        #expect(log.entries[gone.id] != nil, "Recently Deleted can bring it back, with its app")
        context.purge(gone)
        #expect(log.entries[gone.id] == nil && !log.isApproved("api.example.com", for: gone.id))
        #expect(log.entries[kept.id] != nil)

        let files = FileManager.default.temporaryDirectory.appending(path: "NotePageNetLogTests.\(UUID().uuidString)", directoryHint: .isDirectory)
        context.wipeLocalLibrary(files: files)
        #expect(log.entries.isEmpty && log.approved.isEmpty)
    }
}
