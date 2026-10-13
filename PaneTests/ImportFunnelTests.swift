import Foundation
import Testing
@testable import Pane

extension FunnelTests {
    /// The import funnel (`import_step`): each step of the import sheets is recorded once, where it
    /// happens, with the source's name and never anything from the files.
    @MainActor @Suite struct ImportFunnel {
        typealias F = Pane.ImportFunnel

        static func source(notes: Int, problem: String? = nil) -> ImportSource {
            ImportSource(url: URL(fileURLWithPath: "/tmp/\(UUID().uuidString)"), name: "Export", notes: notes, bytes: 10, problem: problem)
        }

        @Test func everyKindHasItsFunnelName() {
            #expect(ImportKind.allCases.map(\.funnelSource) == [.obsidian, .bear, .evernote, .keep, .markdown])
        }

        @Test func openingAndStartingAreSaidOnce() async {
            let steps = FunnelSteps()
            await steps.watch {
                F.opened(.evernote)
                F.importing(.evernote)
            }
            #expect(steps.events == [.importStep(.evernote, .opened), .importStep(.evernote, .importing)])
        }

        @Test func aWrongFileAndAnEmptyExportAreSaidOncePerPick() async throws {
            let steps = FunnelSteps()
            // An empty folder isn't a Markdown export: the importer says why.
            let empty = FileManager.default.temporaryDirectory.appending(path: "md-empty-\(UUID().uuidString)")
            try FileManager.default.createDirectory(at: empty, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: empty) }
            let wrong = MarkdownImporter.inspect(empty)
            #expect(wrong.problem != nil)
            await steps.watch {
                F.inspected(.obsidian, [wrong, Self.source(notes: 0, problem: "Not a vault")])
                F.inspected(.keep, [Self.source(notes: 0), Self.source(notes: 0)])
                F.inspected(.bear, [Self.source(notes: 4)])
            }
            #expect(steps.events == [.importStep(.obsidian, .wrongFile), .importStep(.keep, .nothingFound)])
        }

        @Test func theEndIsDoneWithARangeCancelledWhenStoppedOrFailed() async {
            let steps = FunnelSteps()
            await steps.watch {
                F.finished(.markdown, ImportSummary(notes: 42))
                F.finished(.keep, ImportSummary(notes: 3, stopped: true))
                F.finished(.evernote, ImportSummary(notes: 0, failedFiles: ["Notebook.enex: not readable"]))
                F.cancelled(.bear)
            }
            #expect(steps.events == [
                .importStep(.markdown, .done, count: .upTo99),
                .importStep(.keep, .cancelled),
                .importStep(.evernote, .failed, kind: .file),
                .importStep(.bear, .cancelled),
            ])
        }

        @Test func countsAreRangesNeverNumbers() {
            #expect(CountBucket(0) == nil)
            #expect(CountBucket(1) == .upTo9 && CountBucket(9) == .upTo9)
            #expect(CountBucket(10) == .upTo99 && CountBucket(999) == .upTo999 && CountBucket(1000) == .over999)
        }

        #if os(macOS)
        @Test func appleNotesSaysEachStepOnce() async {
            let steps = FunnelSteps()
            let one = AppleNote(id: "a", name: "A", folder: "Notes", modified: .now, account: "iCloud")
            let other = AppleNote(id: "b", name: "B", folder: "Notes", modified: .now, account: "On My Mac")
            await steps.watch {
                AppleNotesFunnel.opened()
                AppleNotesFunnel.read(.failure(AppleNotesBridge.Failure.notAllowed))
                AppleNotesFunnel.read(.failure(AppleNotesBridge.Failure.script("Apple Notes didn't answer.")))
                AppleNotesFunnel.read(.success(AppleNotesListing(notes: [])))
                AppleNotesFunnel.read(.success(AppleNotesListing(notes: [one, other])))
                AppleNotesFunnel.read(.success(AppleNotesListing(notes: [one])))
                AppleNotesFunnel.importing()
                AppleNotesFunnel.finished(AppleNotesImportSummary(noteIDs: [UUID(), UUID()]))
                AppleNotesFunnel.cancelled()
            }
            #expect(steps.events == [
                .importStep(.appleNotes, .opened),
                .importStep(.appleNotes, .permissionDenied),
                .importStep(.appleNotes, .failed, kind: .other),
                .importStep(.appleNotes, .nothingFound),
                .importStep(.appleNotes, .secondAccount),
                .importStep(.appleNotes, .importing),
                .importStep(.appleNotes, .done, count: .upTo9),
                .importStep(.appleNotes, .cancelled),
            ])
        }

        @Test func appleNotesNotAllowedStillSaysWhatToDo() {
            #expect(AppleNotesBridge.Failure.notAllowed.errorDescription?.contains("Automation") == true)
        }
        #endif
    }
}
