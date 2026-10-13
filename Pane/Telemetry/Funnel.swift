import Foundation

/// The funnels' steps (onboarding, imports, connecting an AI, signing in, adding a device), recorded
/// where they happen. Through here so a test can see each step as it's sent (`tap`): the app's own
/// Telemetry never sends from a test run.
enum Funnel {
    /// Tests: every funnel step as it's recorded, in order.
    nonisolated(unsafe) static var tap: ((TelemetryEvent) -> Void)?

    static func record(_ event: TelemetryEvent) {
        tap?(event)
        Telemetry.shared.record(event)
    }
}
