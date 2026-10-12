import Foundation
import SwiftUI
import Testing
@testable import Pane

/// What the server knows about an account's setup, and how the app reads and marks it.
@Suite struct SetupProgressTests {
    @Test func decodesTheServerAnswer() throws {
        let json = #"{"imported":true,"connected":false,"ai_edits":2,"dismissed":false,"celebrated":false,"templates_closed":true}"#
        let p = try JSONDecoder().decode(SetupProgress.self, from: Data(json.utf8))
        #expect(p == SetupProgress(imported: true, connected: false, aiEdits: 2, templatesClosed: true))
    }

    /// A server from before the Templates card doesn't send its mark: everything else still reads.
    @Test func aServerWithoutTheNewestMarkStillDecodes() throws {
        let json = #"{"imported":true,"connected":true,"ai_edits":0,"dismissed":true,"celebrated":false}"#
        let p = try JSONDecoder().decode(SetupProgress.self, from: Data(json.utf8))
        #expect(p == SetupProgress(imported: true, connected: true, dismissed: true))
        #expect(!p.templatesClosed)
    }
}

/// A stand-in for the server.
private final class FakeSetup: SetupService, @unchecked Sendable {
    var answer = SetupProgress()
    var marked: [String] = []
    var calls = 0
    /// A server that doesn't know a step refuses it.
    var refuses: Set<String> = []
    struct Refused: Error {}
    func progress() async throws -> SetupProgress { calls += 1; return answer }
    func mark(_ step: String) async throws {
        if refuses.contains(step) { throw Refused() }
        marked.append(step)
    }
}

@MainActor @Suite struct SetupStoreTests {
    @Test func noAccountNothingKnown() async {
        let store = SetupStore()
        await store.refresh(force: true)
        #expect(store.progress == nil)
    }

    @Test func markingUpdatesAtOnceAndTellsTheServer() async {
        let fake = FakeSetup()
        let store = SetupStore()
        store.attach(account: UUID(), service: fake)
        await store.refresh(force: true)
        await store.mark("imported")
        #expect(store.progress?.imported == true)
        await store.mark("dismissed")
        #expect(store.progress?.dismissed == true)
        await store.mark("templates_closed")
        #expect(store.progress?.templatesClosed == true)
        #expect(fake.marked == ["imported", "dismissed", "templates_closed"])
    }

    /// Before the server learns the Templates mark, closing the card still holds here.
    @Test func aStepTheServerRefusesStillHoldsOnThisDevice() async {
        let fake = FakeSetup()
        fake.refuses = ["templates_closed"]
        let store = SetupStore()
        store.attach(account: UUID(), service: fake)
        await store.refresh(force: true)
        await store.mark("templates_closed")
        #expect(store.progress?.templatesClosed == true)
        #expect(fake.marked.isEmpty)
    }

    @Test func anUnknownStepIsNotSent() async {
        let fake = FakeSetup()
        let store = SetupStore()
        store.attach(account: UUID(), service: fake)
        await store.refresh(force: true)
        await store.mark("reset")
        #expect(fake.marked.isEmpty, "the old setup card's reset is gone")
    }

    @Test func refreshesAreThrottledUnlessForced() async {
        let fake = FakeSetup()
        let store = SetupStore()
        store.attach(account: UUID(), service: fake)
        await store.refresh(force: true)
        await store.refresh()
        await store.refresh()
        #expect(fake.calls == 1, "coming back to the app again and again mustn't flood the server")
        // The first-run flow asks after a connect guide closes, whatever was asked a second ago.
        fake.answer.connected = true
        await store.refresh(force: true)
        #expect(fake.calls == 2)
        #expect(store.progress?.connected == true)
    }

    @Test func anotherAccountStartsOver() async {
        let fake = FakeSetup()
        fake.answer = SetupProgress(imported: true, dismissed: true, templatesClosed: true)
        let store = SetupStore()
        store.attach(account: UUID(), service: fake)
        await store.refresh(force: true)
        #expect(store.progress?.templatesClosed == true)
        store.attach(account: UUID(), service: FakeSetup())
        #expect(store.progress == nil)
        await store.refresh(force: true)
        #expect(store.progress == SetupProgress())
    }
}

/// Where the notes live, said in the app.
@Suite struct SyncWordingTests {
    @Test func settingsSaysItSyncsAndWhen() {
        let now = Date(timeIntervalSince1970: 1_790_000_000)
        #expect(SyncStatusLabel.when(now.addingTimeInterval(-20), now: now) == "just now")
        #expect(SyncStatusLabel.when(now.addingTimeInterval(-600), now: now).hasPrefix("last synced "))
    }
}

#if os(macOS)
extension AIEditSnapshots {
    /// The Settings sync line, as it reads once synced.
    @Test func syncStatusLine() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let form = Form { LabeledContent("Sync") { SyncStatusLabel(status: .synced(.now.addingTimeInterval(-300))) } }
            .formStyle(.grouped).frame(width: 520)
        try await AppSnapshotTests.render(form, name: "settings-sync-line", dark: false)
    }
}
#endif
