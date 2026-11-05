import Foundation
import SwiftData
import Testing
@testable import Pane

/// The two-device check's steps file (CollabScript) is Amber Notes Beta's alone: Pinto Notes, the
/// release, never reads one, whatever it's opened with.
struct CollabScriptTests {
    let args = ["/Applications/App", "-collabScript", "/tmp/steps.json"]

    @Test func onlyTheBetaReadsASteps() {
        #expect(CollabScript.requested(arguments: args, bundleID: "dev.emilwagman.pane.beta")?.path == "/tmp/steps.json")
        #expect(CollabScript.requested(arguments: args, bundleID: "dev.emilwagman.pane") == nil)
        #expect(CollabScript.requested(arguments: args, bundleID: nil) == nil)
        // A copy of the Beta with its own id reads one; nothing else that starts the same way does.
        #expect(CollabScript.requested(arguments: args, bundleID: "dev.emilwagman.pane.beta.proof") != nil)
        #expect(CollabScript.requested(arguments: args, bundleID: "dev.emilwagman.pane.betax") == nil)
        #expect(CollabScript.requested(arguments: args, bundleID: "dev.emilwagman.pane.PaneShare") == nil)
    }

    @Test func theReleaseIdentityIgnoresIt() {
        // This test host is Pinto Notes' own bundle: the argument does nothing here.
        #expect(Bundle.main.bundleIdentifier != CollabScript.betaBundleID)
        #expect(CollabScript.requested(arguments: args, bundleID: Bundle.main.bundleIdentifier) == nil)
    }

    @Test func onlyALocalFileNeverAnAddress() {
        let beta = "dev.emilwagman.pane.beta"
        #expect(CollabScript.requested(arguments: ["x", "-collabScript", "https://example.com/steps.json"], bundleID: beta) == nil)
        #expect(CollabScript.requested(arguments: ["x", "-collabScript", "file:///tmp/steps.json"], bundleID: beta) == nil)
        #expect(CollabScript.requested(arguments: ["x", "-collabScript", "steps.json"], bundleID: beta) == nil)
        #expect(CollabScript.requested(arguments: ["x", "-collabScript"], bundleID: beta) == nil)
        #expect(CollabScript.requested(arguments: ["x"], bundleID: beta) == nil)
    }
}

/// The lost-access alert in the script (waitLostAccess, answerLostAccess): what it says, and each
/// answer as its button does (SharedRemovalAlert).
@MainActor struct CollabScriptLostAccessTests {
    let container: ModelContainer
    var context: ModelContext { container.mainContext }

    init() throws {
        container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    @Test func keepACopyKeepsYourTextAsANoteOfYourOwn() throws {
        let typed = SharedRemoval(id: UUID(), title: "Offsite plan", owner: "Emil", copy: "Offsite plan\n\n- [ ] Bring name badges", folder: nil)
        let removals = SharedRemovals()
        removals.add(typed)
        let asked = CollabScript.lostAccessQuestion(typed)
        #expect(asked["title"] as? String == "You no longer have access to \u{201C}Offsite plan\u{201D}")
        #expect((asked["message"] as? String)?.hasPrefix("Ask Emil to share it with you again") == true)
        #expect(asked["buttons"] as? [String] == ["Keep a Copy", "Don\u{2019}t Keep"])

        // An answer the alert doesn't offer fails, and leaves it up.
        #expect(throws: CollabScript.Failed.self) { try CollabScript.answerLostAccess("ok", removals: removals, context: context) }
        #expect(removals.current == typed)

        let copy = try #require(try CollabScript.answerLostAccess("keepCopy", removals: removals, context: context))
        #expect(copy.body == "Offsite plan\n\n- [ ] Bring name badges")
        #expect(!copy.isShared && copy.deletedAt == nil && copy.folder?.name == "Notes")
        #expect(removals.current == nil, "said once")
        #expect(throws: CollabScript.Failed.self) { try CollabScript.answerLostAccess("keepCopy", removals: removals, context: context) }
    }

    @Test func dontKeepAndOKLetTheNoteGo() throws {
        let removals = SharedRemovals()
        let typed = SharedRemoval(id: UUID(), title: "Offsite plan", owner: "Emil", copy: "Offsite plan\n- Venue", folder: nil)
        removals.add(typed)
        #expect(try CollabScript.answerLostAccess("dontKeep", removals: removals, context: context) == nil)
        #expect(removals.current == nil)

        // Nothing typed on this device: OK is all it offers.
        let untouched = SharedRemoval(id: UUID(), title: "", owner: nil, copy: nil, folder: nil)
        removals.add(untouched)
        let asked = CollabScript.lostAccessQuestion(untouched)
        #expect(asked["title"] as? String == "You no longer have access to a shared note")
        #expect(asked["buttons"] as? [String] == ["OK"])
        #expect(throws: CollabScript.Failed.self) { try CollabScript.answerLostAccess("keepCopy", removals: removals, context: context) }
        #expect(try CollabScript.answerLostAccess("ok", removals: removals, context: context) == nil)
        #expect(removals.current == nil)
        let notes = try context.fetch(FetchDescriptor<Note>())
        #expect(notes.isEmpty, "no copy for Don't Keep or OK")
    }
}
