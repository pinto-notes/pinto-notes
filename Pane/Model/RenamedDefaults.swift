import Foundation

/// Settings whose names had a dot in them, renamed, each moved once with what was chosen.
/// SwiftUI can't watch a UserDefaults key with a dot in it on its own: a view keeping one with
/// @AppStorage drew again on every write to the app's defaults. RootView kept the columns layout
/// that way, so the whole notes window was worked out again each time, and the menu bar item wrote
/// to the defaults each time the window was: on a board, "10 fps laggy" (17 November 2026).
@MainActor
enum RenamedDefaults {
    static var renames: [(old: String, new: String)] {
        var all: [(old: String, new: String)] = [
            ("experiment.layout", ColumnsLayout.key),
            ("notePicture.background", NotePicture.backgroundKey),
            ("notePicture.showsMark", NotePicture.showsMarkKey),
        ]
        #if os(macOS)
        all.append(("canvas.stylePanel.open", CanvasStyleSidebar.openKey))
        #endif
        return all
    }

    /// Moves each old setting to its new name: a value already under the new name stays.
    static func migrate(_ defaults: UserDefaults = .standard) {
        for (old, new) in renames {
            guard let value = defaults.object(forKey: old) else { continue }
            if defaults.object(forKey: new) == nil { defaults.set(value, forKey: new) }
            defaults.removeObject(forKey: old)
        }
    }
}
