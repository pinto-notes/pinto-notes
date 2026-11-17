#if os(macOS)
import AppKit
import SwiftUI

/// A toolbar symbol redrawn so its ink sits in the optical centre of the button.
/// AppKit centres a symbol's layout box, and a few symbols (the compose pencil) carry ink
/// well off that centre; `.offset` on a toolbar label is ignored, so the fix lives in the image.
enum ToolbarGlyph {
    /// Point size that matches the other symbols in the unified toolbar.
    static let pointSize: CGFloat = 16

    static func image(_ name: String, shift: CGSize) -> Image {
        Image(nsImage: nsImage(name, shift: shift))
    }

    static func nsImage(_ name: String, shift: CGSize) -> NSImage {
        let config = NSImage.SymbolConfiguration(pointSize: pointSize, weight: .regular, scale: .medium)
        let system = NSImage(systemSymbolName: name, accessibilityDescription: nil)
        // The app's own symbols (Assets.xcassets, scripts/glyphs) when the system has none of the name.
        guard let symbol = (system ?? NSImage(symbolName: name, bundle: .main, variableValue: 1))?.withSymbolConfiguration(config) else { return NSImage() }
        // Same canvas as the symbol, so the button keeps the size of its neighbours; one of the
        // app's own takes compose's room, the toolbar's other create buttons' size.
        let room = system == nil ? NSImage(systemSymbolName: "square.and.pencil", accessibilityDescription: nil)?.withSymbolConfiguration(config)?.size ?? symbol.size : symbol.size
        let at = CGRect(x: (room.width - symbol.size.width) / 2, y: (room.height - symbol.size.height) / 2, width: symbol.size.width, height: symbol.size.height)
        // shift is in points, +x right, +y down (like SwiftUI).
        let image = NSImage(size: room, flipped: false) { _ in
            symbol.draw(in: at.offsetBy(dx: shift.width, dy: -shift.height))
            return true
        }
        image.isTemplate = true
        return image
    }

    /// The compose pencil's ink sits right of and below the symbol's centre.
    static let composeShift = CGSize(width: -0.25, height: -0.75)
}
#endif
