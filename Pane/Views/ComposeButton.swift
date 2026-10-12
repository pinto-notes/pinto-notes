import SwiftUI
import TipKit

/// The compose button. A tap or click makes a new note at once, as it always has. Pressing and
/// holding (iPhone, iPad) or clicking and holding (Mac) offers New Note and New App. New App opens
/// the sheet where your AI builds an app as a new note (MakeAppSheet, `init(newApp:)`); on the Mac
/// it is also File › New App.
struct ComposeButton<Label: View>: View {
    let newNote: () -> Void
    @ViewBuilder let label: () -> Label

    var body: some View {
        Menu {
            Button("New Note", systemImage: "square.and.pencil", action: newNote)
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
