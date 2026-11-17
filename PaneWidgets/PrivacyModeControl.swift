import AppIntents
import SwiftUI
import WidgetKit

/// Privacy mode in Control Centre (Emil, 13 November 2026): a switch, on while you turned it on
/// in Pinto Notes, like New Pinto note beside it. The app takes it up (SetPrivacyModeIntent).
struct PrivacyModeControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: PrivacyWords.controlKind, provider: Value()) { on in
            ControlWidgetToggle(PrivacyWords.name, isOn: on, action: SetPrivacyModeIntent()) { on in
                Label(on ? "On" : "Off", systemImage: on ? "eye.slash" : "eye")
            }
        }
        .displayName(LocalizedStringResource(stringLiteral: PrivacyWords.name))
        .description(LocalizedStringResource(stringLiteral: PrivacyWords.controlLine))
    }

    /// What the app last left: on while you turned it on.
    struct Value: ControlValueProvider {
        var previewValue: Bool { false }
        func currentValue() async throws -> Bool { ChecklistShelf.privacy().manual }
    }
}
