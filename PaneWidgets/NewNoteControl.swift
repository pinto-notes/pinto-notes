import AppIntents
import SwiftUI
import WidgetKit

/// "New Pinto note" in Control Centre and on the Lock Screen; the Action button can run it too.
/// It opens the app on a new note with the keyboard up (NewNoteIntent runs in the app).
struct NewNoteControl: ControlWidget {
    static let kind = "NewNoteControl"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: NewNoteIntent()) {
                Label(QuickWords.newNote, systemImage: "square.and.pencil")
            }
        }
        .displayName(LocalizedStringResource(stringLiteral: QuickWords.newNote))
        .description(LocalizedStringResource(stringLiteral: QuickWords.newNoteLine))
    }
}
