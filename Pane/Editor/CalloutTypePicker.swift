import SwiftUI
#if os(iOS)
import UIKit

/// The list a callout's icon opens on iPhone: each type with its icon in its colour, the current
/// one ticked. A popover over the icon, like a menu, not a sheet.
final class CalloutTypePicker: UIHostingController<CalloutTypeList>, UIPopoverPresentationControllerDelegate {
    init(current: Callouts.Kind?, pick: @escaping (Callouts.Kind) -> Void) {
        var close: () -> Void = {}
        super.init(rootView: CalloutTypeList(current: current, pick: { kind in pick(kind); close() }))
        close = { [weak self] in self?.dismiss(animated: true) }
        modalPresentationStyle = .popover
        preferredContentSize = CGSize(width: 220, height: CalloutTypeList.rowHeight * CGFloat(Callouts.menuKinds.count) + 12)
        popoverPresentationController?.delegate = self
        popoverPresentationController?.permittedArrowDirections = [.up, .down]
    }

    @MainActor required dynamic init?(coder: NSCoder) { fatalError() }

    /// A popover on iPhone too, not a sheet.
    func adaptivePresentationStyle(for controller: UIPresentationController, traitCollection: UITraitCollection) -> UIModalPresentationStyle { .none }
}
#endif

struct CalloutTypeList: View {
    static let rowHeight: CGFloat = 44
    let current: Callouts.Kind?
    let pick: (Callouts.Kind) -> Void

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Callouts.menuKinds, id: \.self) { kind in
                Button { pick(kind) } label: {
                    HStack(spacing: 12) {
                        Image(systemName: kind.symbol)
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(Color(kind.tone.ink))
                            .frame(width: 24)
                        Text(kind.title).foregroundStyle(.primary)
                        Spacer(minLength: 0)
                        if kind == current {
                            Image(systemName: "checkmark").font(.system(size: 15, weight: .semibold)).foregroundStyle(.primary)
                        }
                    }
                    .padding(.horizontal, 16)
                    .frame(height: CalloutTypeList.rowHeight)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(kind.title)
                .accessibilityAddTraits(kind == current ? .isSelected : [])
            }
        }
        .padding(.vertical, 6)
    }
}
