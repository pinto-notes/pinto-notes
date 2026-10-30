import SwiftUI
import TipKit

/// The compose button. A tap or click makes a new note at once, as it always has. Pressing and
/// holding (iPhone, iPad) or clicking and holding (Mac) offers New Note, Today's Note, New App and
/// the templates (DailyNotes). New App opens the sheet where your AI builds an app as a new note
/// (MakeAppSheet, `init(newApp:)`); on the Mac it is also File › New App.
struct ComposeButton<Label: View>: View {
    let newNote: () -> Void
    @ViewBuilder let label: () -> Label
    @Environment(\.noteMakers) private var makers

    var body: some View {
        Menu {
            Button("New Note", systemImage: "square.and.pencil", action: newNote)
            Button("Today\u{2019}s Note", systemImage: "calendar") { makers?.today() }
                .accessibilityIdentifier("compose.today")
            Button("New App", systemImage: NoteAppMark.symbol) { NewApp.shared.open() }
                .accessibilityIdentifier("compose.newApp")
            #if os(macOS)
            Menu("New from Template") { TemplateMenuItems(makers: makers) }
            #else
            Section("Templates") { TemplateMenuItems(makers: makers) }
            #endif
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
    @Environment(\.noteMakers) private var makers

    var body: some View {
        Button { makers?.today() } label: { Label("Today\u{2019}s note", systemImage: "calendar") }
            #if os(macOS)
            .help("Today\u{2019}s note (⌘T)")
            #endif
            .disabled(makers == nil)
            .accessibilityIdentifier(identifier)
    }
}

/// The templates, then New Template…, for the compose button's menu and File › New from Template.
struct TemplateMenuItems: View {
    let makers: NoteMakers?
    private var shelf = TemplateShelf.shared

    init(makers: NoteMakers?) { self.makers = makers }

    var body: some View {
        ForEach(shelf.templates) { t in
            Button(t.name, systemImage: "doc.text") { makers?.fromTemplate(t.id) }
        }
        #if os(macOS)
        if !shelf.templates.isEmpty { Divider() }
        #endif
        Button("New Template\u{2026}", systemImage: "doc.badge.plus") { makers?.newTemplate() }
            .accessibilityIdentifier("compose.newTemplate")
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
    /// Recently Deleted holds no new notes.
    var disabled = false
    /// New App's one-off tip, shown on one of the two buttons only.
    var tip = false
    var identifier = "list.newNote"

    var body: some ToolbarContent {
        DefaultToolbarItem(kind: .search, placement: .bottomBar)
        // iPad moves search to the top of the column; compose then belongs at the trailing edge.
        if UIDevice.current.userInterfaceIdiom == .pad {
            ToolbarSpacer(.flexible, placement: .bottomBar)
        } else {
            ToolbarSpacer(.fixed, placement: .bottomBar)
        }
        Compose(newNote: newNote, disabled: disabled, tip: tip, identifier: identifier)
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
