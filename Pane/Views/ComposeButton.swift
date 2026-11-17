import SwiftUI
import TipKit

/// New Note on its own (a file's toolbar): one press makes a note. New Canvas and New App are their
/// own buttons beside it where notes are listed (CreateButtons); the press-and-hold menu that hid
/// them is gone (create study, 13 November 2026).
struct ComposeButton<Label: View>: View {
    let newNote: () -> Void
    /// Off: drawn greyed, and does nothing.
    var off = false
    @ViewBuilder let label: () -> Label

    var body: some View {
        Button(action: newNote, label: label)
            .disabled(off)
    }
}

/// Today's note in one press, beside New Note on the iPhone and at the top of the Mac sidebar,
/// like Obsidian's calendar button in its ribbon.
struct TodayButton: View {
    /// The calendar with today's date on it, one flat symbol. `turns` redraws it when the day changes.
    static func symbol(for date: Date, calendar: Calendar = .current) -> String {
        "\(calendar.component(.day, from: date)).calendar"
    }

    var identifier = "list.today"
    @Environment(\.todaysNote) private var todaysNote
    /// Times the page has turned: on opening today's note and when the day changes (Charm).
    @State private var turns = 0

    var body: some View {
        Button {
            todaysNote?.open()
            turns += 1
        } label: {
            Label { Text("Today\u{2019}s note") } icon: {
                if Charm.on { CharmSymbol("calendar", cue: turns) } else { Image(systemName: Self.symbol(for: .now)) }
            }
        }
        #if os(macOS)
        .help("Today\u{2019}s note (⌘T)")
        #endif
        .disabled(todaysNote == nil)
        .accessibilityIdentifier(identifier)
        // A new day: the page turns to its date.
        .onReceive(NotificationCenter.default.publisher(for: .NSCalendarDayChanged).receive(on: RunLoop.main)) { _ in turns += 1 }
    }
}

/// Asks the window for New App's start page (its button beside New Note, File › New App…, ⌃⌘N):
/// a new note that opens on the start page (AppStart), as New Canvas opens a new canvas.
@MainActor @Observable
final class NewApp {
    static let shared = NewApp()
    /// Counts up per ask; the window makes one start per change.
    var asks = 0

    @ObservationIgnored private var taken = 0

    func ask() {
        guard NoteApps.enabled else { return }
        FeatureUse.mark(.newApp)
        asks += 1
    }

    /// One window makes it, however many are open: the first to claim the ask.
    func claim() -> Bool {
        guard taken < asks else { return false }
        taken = asks
        return true
    }
}

/// Was the first-time tip that holding compose offers New App. New App is a button of its own now
/// (CreateButtons), so the tip is never shown; the type stays so New App's use is still marked for
/// the account and counted (FeatureUse.mark(.newApp), TipLog), as before.
struct NewAppTip: Tip {
    var id: String { "newApp" }
    var title: Text { Text("New App") }
    var rules: [Rule] { tipRules(Feature.newApp) }
    var options: [any TipOption] { [Tips.MaxDisplayCount(1)] }
}

#if os(iOS)

/// The iPhone bottom bar of the folders screen and of a folder's notes, one look for both: the
/// search field, and the three create buttons at the right (CreateBarItems).
struct SearchComposeBar: ToolbarContent {
    let newNote: () -> Void
    /// Recently Deleted holds no new notes: no New Note there, like Notes.
    var hidesCompose = false
    var identifier = "list.newNote"
    /// The screen's search words, for the field iPad needs drawn here (BarSearchField).
    var search: Binding<String>? = nil
    @Environment(\.stackedNotes) private var stacked
    @Environment(\.besideNote) private var besideNote
    @Environment(\.sideWidth) private var sideWidth

    var body: some ToolbarContent {
        // As a column (iPad, iPhone Duo open) search is at the column's top (NoteListView), not
        // here; compose then belongs at the trailing edge.
        if let search, BarSearchField.drawn(besideNote: besideNote) {
            ToolbarItem(placement: .bottomBar) {
                BarSearchField(text: search, width: BarSearchField.width(side: sideWidth, compose: !hidesCompose))
            }
        } else if stacked {
            DefaultToolbarItem(kind: .search, placement: .bottomBar)
        }
        if !stacked {
            ToolbarSpacer(.flexible, placement: .bottomBar)
        } else {
            ToolbarSpacer(.fixed, placement: .bottomBar)
        }
        if !hidesCompose {
            Compose(newNote: newNote, identifier: identifier)
        }
    }

    /// New Note, New Canvas and New App, one glass group (CreateBarItems). Today's note is at the
    /// top left of the list now (NoteListView), where the study put it.
    struct Compose: ToolbarContent {
        let newNote: () -> Void
        var identifier = "list.newNote"

        var body: some ToolbarContent {
            CreateBarItems(newNote: newNote, identifier: identifier)
        }
    }
}
#endif

#if os(iOS)
/// iPad: the search field at the foot of the left side, beside Today and compose, where the
/// iPhone has it (Emil, 3 November 2026). Given to `.searchable`, iPad puts it up in the top bar
/// whatever placement it's asked for, so it's drawn here; the iPhone Duo keeps the system's own.
/// `.searchable`, unless the bar draws the field itself (BarSearchField).
struct SystemSearch: ViewModifier {
    @Binding var text: String
    let placement: SearchFieldPlacement
    let off: Bool

    func body(content: Content) -> some View {
        if off {
            content
        } else {
            content.searchable(text: $text, placement: placement, prompt: "Search").searchToolbarBehavior(.automatic)
        }
    }
}

struct BarSearchField: View {
    @Binding var text: String
    let width: CGFloat
    @FocusState private var focused: Bool

    static func drawn(besideNote: Bool) -> Bool {
        besideNote && UIDevice.current.userInterfaceIdiom == .pad
    }

    /// The left side's width less Today, compose and the bar's margins.
    static func width(side: CGFloat, compose: Bool) -> CGFloat {
        max(150, side - (compose ? 140 : 40))
    }

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
            TextField("Search", text: $text)
                .focused($focused)
                .submitLabel(.search)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            if !text.isEmpty {
                Button("Clear", systemImage: "xmark.circle.fill") { text = "" }
                    .labelStyle(.iconOnly)
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .frame(width: width, height: 36)
        .contentShape(.capsule)
        .onTapGesture { focused = true }
        .hoverEffect(.highlight)
        .accessibilityIdentifier("bar.search")
    }
}
#endif
