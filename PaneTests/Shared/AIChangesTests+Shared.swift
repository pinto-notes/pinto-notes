import Foundation
import SwiftData
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// The AIChangesTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/Interaction/AIChangesTests.swift.
@MainActor @Suite(.serialized) struct AIChangesTests {
    static let before = "Lisbon, 4 days in May\n\n- [ ] Day 1: Alfama and the castle\n- [ ] Day 2: Belém and the tile museum\n- [ ] Day 3: LX Factory"
    static let after = "Lisbon, 4 days in May\n\n- [ ] Day 1: Alfama and the castle\n- [ ] Day 2: Belém and the tile museum\n- [ ] Day 3: Sintra, Pena Palace first\n- [ ] Day 4: LX Factory and a late lunch"

    /// A note this device had, then an AI's edit synced onto it, as the sync engine records it.
    static func aiEdited(_ c: ModelContainer, by ai: String = "ChatGPT") -> Note {
        let note = c.mainContext.createNote(in: .all, body: before)
        AIEditTests.arrive(note, body: after, by: ai)
        return note
    }

    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }
}
