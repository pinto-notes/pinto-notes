import Foundation
import Testing
@testable import Pane

/// AI Changes offline says what can't load: the AIs' changes, not "this note's earlier versions",
/// which is version history's line (round 15, the sheet on a Mac with the server gone).
@Suite struct AIChangesCopyTests {
    @Test func offlineSaysWhatCantLoad() {
        #expect(HistoryError.offline.aiChangesDescription == "You're offline. Connect to the internet to see what your AIs changed.")
        #expect(!HistoryError.offline.aiChangesDescription.contains("versions"))
        #expect(HistoryError.offline.errorDescription?.contains("earlier versions") == true, "history keeps its own line")
        #expect(HistoryError.from(URLError(.notConnectedToInternet)).aiChangesDescription.contains("what your AIs changed"))
        #expect(HistoryError.gone.aiChangesDescription == "That version is no longer kept.")
    }
}
