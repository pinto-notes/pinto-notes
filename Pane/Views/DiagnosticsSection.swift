import SwiftUI

/// The words for what the app reports about itself (Telemetry), in Settings and under the
/// sign-in form. docs/Technical/app-telemetry.md lists everything that's sent.
enum DiagnosticsCopy {
    static let title = "Share diagnostics and usage"
    static let footer = "Error reports, speed, which settings you use and a few counts like “first sync”, linked to your account. Never your notes, titles, file names or what you type."
    /// Under the sign-in form, where an account is made.
    /// Two lines on the sign-in card at 11 pt, each measured to fit (council round 9: the first
    /// sentence wrapped after "never your").
    static let signIn = "Sends error reports and counts. Never your notes. Turn off in Settings."
    /// The same, short, under the welcome note's way in (two lines with the terms, no more).
    static let welcome = "Sends error reports, never your notes. Turn off in Settings."
}

/// Settings › General: one switch for everything the app reports about itself. Off, nothing is
/// kept or sent, and what was waiting to be sent is dropped.
struct DiagnosticsSection: View {
    @AppStorage(Telemetry.consentKey) private var share = true

    var body: some View {
        Section {
            Toggle(DiagnosticsCopy.title, isOn: Binding(get: { share }, set: { share = $0; Telemetry.shared.consent = $0 }))
                .accessibilityIdentifier("settings.diagnostics")
        } header: {
            Text("Diagnostics")
        } footer: {
            Text(DiagnosticsCopy.footer)
                .foregroundStyle(.secondary)
        }
    }
}
