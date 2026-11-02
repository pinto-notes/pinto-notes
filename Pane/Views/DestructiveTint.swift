import SwiftUI

extension View {
    /// A destructive menu item's icon in red, like its title, as in Apple Notes. Menus here are
    /// tinted with the label colour (never amber), and that tint reached the icons of
    /// destructive items too: a black trash can beside a red "Delete" (Emil, 30 October 2026).
    /// Put it on every Button whose role is destructive; `false` leaves the tint alone.
    func destructiveTint(_ destructive: Bool = true) -> some View {
        tint(destructive ? DestructiveTint.color : nil)
    }
}

enum DestructiveTint {
    /// The system red, which menus use for a destructive item's title.
    static let color = Color.red
}

/// A menu item that deletes or removes something: its title red as well as its icon, as in Apple
/// Notes (Emil, 2 November 2026: a red trash beside a black "Delete" on the Mac). On the Mac a
/// destructive role alone leaves the title in the menu's colour; a title styled red reaches the
/// menu as a red title (MenuLookTests reads it there). Not for swipe actions, whose title sits on
/// a red ground. With `destructive` false it is a plain item, for menus that choose at run time.
struct DestructiveMenuButton: View {
    let title: String
    let systemImage: String
    var destructive = true
    let action: () -> Void

    init(_ title: String, systemImage: String, destructive: Bool = true, action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.destructive = destructive
        self.action = action
    }

    var body: some View {
        Button(role: destructive ? .destructive : nil, action: action) {
            Label {
                Self.title(title, destructive: destructive)
            } icon: {
                Image(systemName: systemImage)
            }
        }
        .destructiveTint(destructive)
    }

    static func title(_ title: String, destructive: Bool) -> Text {
        destructive ? Text(title).foregroundStyle(DestructiveTint.color) : Text(title)
    }
}
