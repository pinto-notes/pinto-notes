#if os(macOS)
import AppKit
import SQLite3
import SwiftData
import SwiftUI
import Testing
import ZIPFoundation
@testable import Pane

/// The PersonaR7Shots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/PersonaR7Shots.swift.
@MainActor @Suite(.serialized) struct PersonaR7Shots {
    /// The notes window in a borderless window far off screen, ordered in so its buttons can be
    /// pressed through the accessibility API (a titled window off screen is pulled back onto it).
    static func pressable(_ c: ModelContainer, note: String, dark: Bool, _ body: (OffscreenAX) async throws -> Void) async throws {
        try await AppSnapshotTests.withLastNote(c, note) {
            let ax = OffscreenAX(RootView().modelContainer(c).environment(SetupStore()).environment(\.controlActiveState, .key),
                                 size: PersonaEditorShots.size, dark: dark)
            defer { ax.close() }
            await ax.settle(1600)
            if let split = AIEditSplit.find(in: ax.window.contentView) {
                split.setPosition(220, ofDividerAt: 0)
                split.setPosition(540, ofDividerAt: 1)
            }
            await ax.settle(800)
            try await body(ax)
        }
    }

    /// The demo library with "Lisbon trip" in Travel, as `-seedTrip` makes it on the iPhone.
    static func tripLibrary() throws -> ModelContainer {
        let c = try PersonaEditorShots.library()
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        let trip = c.mainContext.createNote(in: .folder(travel.id), body: Capture.lisbonTrip)
        trip.updatedAt = .now.addingTimeInterval(-20 * 60)
        try c.mainContext.save()
        return c
    }

    /// A generated photo (a dusk sky over a roofline), as a pasted picture would be.
    static func photoPNG() -> Data { DemoData.samplePNG() }
}
#endif
