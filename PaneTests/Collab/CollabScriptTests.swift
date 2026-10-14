import Foundation
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
