import SwiftUI
import WidgetKit

/// Pinto Notes within reach (2026-11-04): a checklist you tick on the Home Screen without opening
/// the app, and New Pinto note for Control Centre, the Lock Screen and the Action button.
@main
struct PaneWidgetsBundle: WidgetBundle {
    var body: some Widget {
        ChecklistWidget()
        NewNoteControl()
        PrivacyModeControl()
    }
}
