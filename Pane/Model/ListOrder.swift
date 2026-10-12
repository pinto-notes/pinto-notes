import Foundation
import Observation
import SwiftUI

/// How the note list is ordered: "Sort By" and "Group By Date" in the list's menu, as in Apple
/// Notes. One choice for every folder, kept on this device (never synced). Pinned notes stay on
/// top in every order, and sub-notes stay inside their parents.
struct ListOrder: Equatable, Sendable {
    enum Key: String, CaseIterable, Identifiable, Sendable {
        case edited, created, title

        var id: String { rawValue }

        var title: String {
            switch self {
            case .edited: "Date Edited"
            case .created: "Date Created"
            case .title: "Title"
            }
        }
    }

    var key = Key.edited
    /// Oldest first, or Z to A.
    var reversed = false
    var groupsByDate = true

    /// Newest edit first, under date headings: the list as it has always been.
    static let standard = ListOrder()

    /// Date headings need dates in order: with titles in order there are none, as in Apple Notes.
    var showsDateHeadings: Bool { groupsByDate && key != .title }

    /// The two directions, first the one a new choice of key starts with.
    var directions: (String, String) { key == .title ? ("A to Z", "Z to A") : ("Newest First", "Oldest First") }

    /// The same place in the list: grouping changes the headings, not where an item goes.
    func sortsLike(_ other: ListOrder) -> Bool { key == other.key && reversed == other.reversed }

    /// Whether `a` comes before `b`. Equal titles fall back to the newest edit first.
    func before<A: DatedListItem, B: DatedListItem>(_ a: A, _ b: B) -> Bool {
        switch key {
        case .edited: return reversed ? a.listDate < b.listDate : a.listDate > b.listDate
        case .created: return reversed ? a.listCreated < b.listCreated : a.listCreated > b.listCreated
        case .title:
            let order = a.listTitle.localizedStandardCompare(b.listTitle)
            if order == .orderedSame { return a.listDate > b.listDate }
            return (order == .orderedAscending) != reversed
        }
    }

    /// The date an item is listed under, and the one its row shows: the date the list is sorted
    /// by, as in Apple Notes. Sorted by title, that is the date edited.
    func date<Item: DatedListItem>(of item: Item) -> Date { showsCreationDates ? item.listCreated : item.listDate }

    /// Rows show when their note was made instead of when it was last edited.
    var showsCreationDates: Bool { key == .created }
}

/// The list's order as chosen on this device, for every window's list.
@MainActor @Observable
final class ListOrderStore {
    static let shared = ListOrderStore(defaults: PaneApp.isUnitTestHost ? MemoryDefaults() : .standard)
    static let keyKey = "list.sortBy", reversedKey = "list.sortReversed", groupKey = "list.groupByDate"

    var order: ListOrder {
        didSet {
            guard order != oldValue else { return }
            defaults.set(order.key.rawValue, forKey: Self.keyKey)
            defaults.set(order.reversed, forKey: Self.reversedKey)
            defaults.set(order.groupsByDate, forKey: Self.groupKey)
        }
    }

    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        order = ListOrder(key: defaults.string(forKey: Self.keyKey).flatMap(ListOrder.Key.init) ?? .edited,
                          reversed: defaults.bool(forKey: Self.reversedKey),
                          groupsByDate: defaults.object(forKey: Self.groupKey) as? Bool ?? true)
    }
}

/// "Sort By" and "Group By Date", for the list's menu on the Mac, iPhone and iPad.
struct ListOrderMenu: View {
    @Bindable var store: ListOrderStore

    var body: some View {
        Menu("Sort By", systemImage: "arrow.up.arrow.down") {
            Picker("Sort By", selection: $store.order.key) {
                ForEach(ListOrder.Key.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.inline)
            .labelsHidden()
            Divider()
            Picker("Order", selection: $store.order.reversed) {
                Text(store.order.directions.0).tag(false)
                Text(store.order.directions.1).tag(true)
            }
            .pickerStyle(.inline)
            .labelsHidden()
        }
        .accessibilityIdentifier("list.sortBy")
        // Titles in order have no dates to group by.
        Menu("Group By Date", systemImage: "calendar") {
            Picker("Group By Date", selection: $store.order.groupsByDate) {
                Text("On").tag(true)
                Text("Off").tag(false)
            }
            .pickerStyle(.inline)
            .labelsHidden()
        }
        .disabled(store.order.key == .title)
        .accessibilityIdentifier("list.groupByDate")
    }
}
