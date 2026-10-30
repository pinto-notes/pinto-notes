import Foundation
import Observation
import SwiftUI

/// How the note list is ordered: "Sort By" and "Group By Date" in the list's menu, as in Apple
/// Notes. Kept on this device (never synced): the sort is one choice for every folder, grouping
/// is chosen per folder (`ListOrderStore.order(for:)`). Pinned notes stay on top in every order.
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
    /// Group By Date as set in each folder, by `ListOrderStore.key(of:)`.
    static let groupsKey = "list.groupByDate.byFolder"

    var order: ListOrder {
        didSet {
            guard order != oldValue else { return }
            defaults.set(order.key.rawValue, forKey: Self.keyKey)
            defaults.set(order.reversed, forKey: Self.reversedKey)
            defaults.set(order.groupsByDate, forKey: Self.groupKey)
        }
    }

    /// Group By Date in the folders where it was set; the others follow `order.groupsByDate`.
    private var groups: [String: Bool] {
        didSet { if groups != oldValue { defaults.set(groups, forKey: Self.groupsKey) } }
    }

    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        order = ListOrder(key: defaults.string(forKey: Self.keyKey).flatMap(ListOrder.Key.init) ?? .edited,
                          reversed: defaults.bool(forKey: Self.reversedKey),
                          groupsByDate: defaults.object(forKey: Self.groupKey) as? Bool ?? true)
        groups = defaults.dictionary(forKey: Self.groupsKey) as? [String: Bool] ?? [:]
    }

    /// The order one list is shown in: the sort every list shares, with that folder's grouping.
    func order(for scope: Scope) -> ListOrder {
        var o = order
        if let g = groups[Self.key(of: scope)] { o.groupsByDate = g }
        return o
    }

    /// Group By Date in one folder, as in Apple Notes, where each folder keeps its own.
    func setGroupsByDate(_ on: Bool, for scope: Scope) { groups[Self.key(of: scope)] = on }

    static func key(of scope: Scope) -> String {
        switch scope {
        case .all: "all"
        case .trash: "trash"
        case .folder(let id): id.uuidString
        }
    }
}

/// "Sort By" and "Group By Date", for the list's menu on the Mac, iPhone and iPad.
struct ListOrderMenu: View {
    @Bindable var store: ListOrderStore
    /// The list the menu is for: Group By Date is set for it alone.
    let scope: Scope

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
            Picker("Group By Date", selection: Binding(get: { store.order(for: scope).groupsByDate }, set: { store.setGroupsByDate($0, for: scope) })) {
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
