import SwiftUI
import TipKit

/// The compose button. A tap or click makes a new note at once, as it always has. Pressing and
/// holding (iPhone, iPad) or clicking and holding (Mac) offers New Note, Today's Note (DailyNotes)
/// and New App. New App opens the sheet where your AI builds an app as a new note
/// (MakeAppSheet, `init(newApp:)`); on the Mac it is also File › New App.
struct ComposeButton<Label: View>: View {
    let newNote: () -> Void
    /// Off: a plain button, disabled. A menu with a primary action becomes a segmented control in
    /// the Mac's toolbar, and `.disabled` stopped its clicks but left it drawn as on (Emil, 2
    /// November 2026: "only interaction is disabled"); a disabled button is drawn greyed.
    var off = false
    @ViewBuilder let label: () -> Label
    @Environment(\.todaysNote) private var todaysNote

    var body: some View {
        if off {
            Button(action: {}, label: label)
                .disabled(true)
        } else {
            menu
        }
    }

    private var menu: some View {
        Menu {
            Button("New Note", systemImage: "square.and.pencil", action: newNote)
            Button("Today\u{2019}s Note", systemImage: "calendar") { todaysNote?.open() }
                .accessibilityIdentifier("compose.today")
            Button("New App", systemImage: NoteAppMark.symbol) { NewApp.shared.open() }
                .accessibilityIdentifier("compose.newApp")
        } label: {
            label()
        } primaryAction: {
            newNote()
        }
        .menuIndicator(.hidden)
    }
}

/// Today's note in one press, beside New Note on the iPhone and at the top of the Mac sidebar,
/// like Obsidian's calendar button in its ribbon.
struct TodayButton: View {
    var identifier = "list.today"
    @Environment(\.todaysNote) private var todaysNote
    /// Times the page has turned: on opening today's note and when the day changes (Charm).
    @State private var turns = 0

    var body: some View {
        Button {
            todaysNote?.open()
            turns += 1
        } label: {
            Label { Text("Today\u{2019}s note") } icon: { CharmSymbol("calendar", cue: turns) }
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

/// Asks the window to show New App (from the compose button's menu, or File › New App).
@MainActor @Observable
final class NewApp {
    static let shared = NewApp()
    var showing = false

    func open() {
        guard NoteApps.enabled else { return }
        FeatureUse.mark(.newApp)
        showing = true
    }
}

extension View {
    /// New App's one-off tip on this compose button. Shown here, it is remembered for the account.
    func newAppTip() -> some View {
        paneTip(NewAppTip(), arrowEdge: .top)
            .task {
                for await show in NewAppTip().shouldDisplayUpdates where show {
                    FeatureUse.remember(.newApp)
                    break
                }
            }
    }

    /// New App over this view, when asked.
    func newAppSheet() -> some View { modifier(NewAppSheetHost()) }
}

private struct NewAppSheetHost: ViewModifier {
    @Bindable private var request = NewApp.shared

    func body(content: Content) -> some View {
        content.sheet(isPresented: $request.showing) { MakeAppSheet(newApp: ()) }
    }
}

/// The first time only, by the compose button: that holding it offers New App. Once per account:
/// shown or dismissed here, it never shows on another device either (FeatureUse), and it waits
/// while the first-run flow is on screen, like every tip.
struct NewAppTip: Tip {
    var id: String { "newApp" }
    var title: Text { Text("Hold for New App") }
    var message: Text? { Text("Press and hold the compose button, and your AI builds an app as a new note.") }
    var image: Image? { TipGlyph.image(NoteAppMark.symbol) }
    var rules: [Rule] { tipRules(Feature.newApp) }
    var options: [any TipOption] { [Tips.MaxDisplayCount(1)] }
}

#if os(iOS)

/// The iPhone bottom bar of the folders screen and of a folder's notes, one look for both: the
/// search field, and New Note at the right, as in Notes and Mail.
struct SearchComposeBar: ToolbarContent {
    let newNote: () -> Void
    /// Recently Deleted holds no new notes: no New Note there, like Notes.
    var hidesCompose = false
    /// New App's one-off tip, shown on one of the two buttons only.
    var tip = false
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
            Compose(newNote: newNote, tip: tip, identifier: identifier)
        }
    }

    /// New Note alone (iPad's folders, where the list beside them has the search). Holding it
    /// still offers New App.
    struct Compose: ToolbarContent {
        let newNote: () -> Void
        var disabled = false
        var tip = false
        var identifier = "list.newNote"

        var body: some ToolbarContent {
            ToolbarItem(placement: .bottomBar) {
                TodayButton(identifier: identifier.replacingOccurrences(of: "newNote", with: "today"))
                    .tint(.primary)
            }
            ToolbarSpacer(.fixed, placement: .bottomBar)
            ToolbarItem(placement: .bottomBar) {
                ComposeButton(newNote: newNote) { SwiftUI.Label("New Note", systemImage: "square.and.pencil") }
                    .tint(.primary)
                    .modifier(NewAppTipHere(on: tip))
                    .disabled(disabled)
                    .accessibilityIdentifier(identifier)
            }
        }
    }
}

private struct NewAppTipHere: ViewModifier {
    let on: Bool

    func body(content: Content) -> some View {
        if on { content.newAppTip() } else { content }
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
