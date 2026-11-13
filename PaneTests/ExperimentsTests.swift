import Foundation
import Testing
@testable import Pane

/// Settings › Experimental's switches (Experiments).
@Suite struct ExperimentsTests {
    /// Each switch has a key of its own with no dot in it: views read them with @AppStorage, and
    /// one whose key had a dot drew again on every write to UserDefaults, whatever was written
    /// (the window, the note and every list row as each note opened; BackForwardTests counted it).
    @Test func eachSwitchHasAKeyWithoutADot() {
        let keys = Experiment.allCases.map(\.key)
        #expect(keys == ["experimentCovers", "experimentGallery", "experimentTags"])
        #expect(keys.allSatisfy { !$0.contains(".") })
    }

    /// Off until turned on, on this device.
    @Test func eachIsOffUntilTurnedOn() {
        let defaults = TestDefaults()
        for e in Experiment.allCases { #expect(!Experiments.isOn(e, defaults: defaults)) }
        defaults.set(true, forKey: Experiment.tags.key)
        #expect(Experiments.isOn(.tags, defaults: defaults) && !Experiments.isOn(.covers, defaults: defaults))
    }
}
