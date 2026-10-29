#if os(iOS)
import SwiftUI
import UIKit

/// The glass bar that floats above the keyboard while you write.
struct FormatBar: View {
    let controller: EditorController
    /// Over a table cell's keyboard: the table's own menu, like Notes.
    var inTable = false
    let dismiss: () -> Void

    /// The glass around a 44 pt target: a 48 pt capsule, as tall as the system toolbar's.
    static let inset: CGFloat = 2

    var body: some View {
        GlassEffectContainer(spacing: 10) {
            HStack(spacing: 10) {
                if inTable { tableTools } else if controller.wikiSuggestions.isEmpty { tools } else {
                    WikiSuggestionRow(controller: controller)
                        .glassEffect(.regular.interactive(), in: .capsule)
                }

                Spacer(minLength: 0)

                Button(action: dismiss) {
                    BarIcon(systemName: "keyboard.chevron.compact.down")
                }
                .buttonStyle(PressScale())
                .accessibilityLabel("Hide keyboard")
                .accessibilityIdentifier("editor.done")
                .padding(Self.inset)
                .glassEffect(.regular.interactive(), in: .circle)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
        }
    }

    /// In a table the Table button is the table's menu: add or delete a row or column, or Delete
    /// Table, like Notes.
    private var tableTools: some View {
        Menu {
            if let menu = controller.currentTableMenu { TableMenuItems(menu: menu) }
        } label: {
            BarIcon(systemName: "tablecells")
        }
        .accessibilityLabel("Table")
        .accessibilityIdentifier("editor.tableMenu")
        .padding(.horizontal, Self.inset * 4)
        .padding(.vertical, Self.inset)
        .glassEffect(.regular.interactive(), in: .capsule)
    }

    /// The writing tools; while a `[[link` is typed, note titles take their place. They show only
    /// with the keyboard: the note has no bar at its foot while you read (Emil, 29 October 2026).
    private var tools: some View {
        HStack(spacing: 8) {
            // The Format panel in the keyboard's place, like Notes (FormatPanel). It was a
            // menu until 2026-10-28: a short list over the text, with no state shown.
            Button(action: controller.showFormatPanel) { BarIcon(systemName: "textformat") }
                .buttonStyle(PressScale())
                .accessibilityLabel("Format")
                .accessibilityIdentifier("editor.format")
            BarButton("Checklist", "checklist", action: controller.checklist)
            BarButton("Table", "tablecells", action: controller.insertTable)
            attachMenu
        }
        .padding(.horizontal, Self.inset * 4)
        .padding(.vertical, Self.inset)
        .glassEffect(.regular.interactive(), in: .capsule)
    }

    /// The paperclip: what can be put into a note. The note screen asks which (a photo or video, a
    /// file, a link to a note, a web link). A menu here put out a second, nameless button for
    /// VoiceOver (AccessibilityUITests).
    private var attachMenu: some View {
        BarButton("Attach", "paperclip", action: controller.attachChoices)
            .accessibilityIdentifier("editor.attach")
    }
}

private struct BarButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    init(_ title: String, _ icon: String, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.action = action
    }
    var body: some View {
        Button(action: action) { BarIcon(systemName: icon) }
            .buttonStyle(PressScale())
            .accessibilityLabel(title)
    }
}

/// A tool's glyph at 22 pt, the size the system toolbar draws them (Emil, 29 October 2026: "I like
/// the 22pt size on buttons, not smaller on iOS"; they were 17 pt here), in a 44 pt target.
private struct BarIcon: View {
    let systemName: String
    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: 22, weight: .regular))
            .foregroundStyle(.primary)
            .frame(width: 44, height: 44)
            .contentShape(.rect)
    }
}

/// Hosts the format bar as the text view's input accessory.
final class FormatBarHost: UIView {
    private let host: UIHostingController<FormatBar>

    init(controller: EditorController, inTable: Bool = false, dismiss: @escaping () -> Void) {
        host = UIHostingController(rootView: FormatBar(controller: controller, inTable: inTable, dismiss: dismiss))
        // The accessory sits on the keyboard: the bar mustn't make room for the keyboard or the
        // home indicator again on top of that (it stood 84 pt above the keyboard; Notes' is about 8).
        host.safeAreaRegions = []
        super.init(frame: CGRect(x: 0, y: 0, width: 390, height: 60))
        autoresizingMask = .flexibleHeight
        backgroundColor = .clear
        host.view.backgroundColor = .clear
        host.view.translatesAutoresizingMaskIntoConstraints = false
        addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            host.view.topAnchor.constraint(equalTo: topAnchor),
            host.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    override var intrinsicContentSize: CGSize { CGSize(width: UIView.noIntrinsicMetric, height: 60) }

    required init?(coder: NSCoder) { fatalError() }
}
#endif
