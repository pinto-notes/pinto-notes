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
