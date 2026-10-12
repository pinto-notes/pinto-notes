#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The note list in the orders its menu offers (Sort By, Group By Date), in the app's window,
/// offscreen. Runs only when AMBER_HIG_SHOTS is set.
@MainActor @Suite(.serialized) struct ListOrderSnapshots {
    @Test func theListInEachOrder() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let c = try AppSnapshotTests.container()
        let store = ListOrderStore.shared, kept = store.order
        defer { store.order = kept }
        let orders: [(String, ListOrder)] = [("date-edited", .standard), ("title", ListOrder(key: .title)), ("date-created-oldest-first", ListOrder(key: .created, reversed: true)),
                                            ("date-edited-ungrouped", ListOrder(key: .edited, groupsByDate: false))]
        for (name, order) in orders {
            store.order = order
            try await AppSnapshotTests.withLastNote(c, "Welcome to Pinto Notes") {
                try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "mac-list-sorted-by-\(name)", size: CGSize(width: 1180, height: 760), dark: false)
            }
        }
    }
}
#endif
