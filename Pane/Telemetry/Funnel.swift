import Foundation

/// The funnels' steps (onboarding, imports, connecting an AI, signing in, adding a device), recorded
/// where they happen. Through here so a test can see each step its own code records (`tap`, bound
/// for the test's task only): the app's own Telemetry never sends from a test run.
enum Funnel {
    /// Tests: every funnel step recorded within the task that bound it, in order.
    @TaskLocal static var tap: (@Sendable (TelemetryEvent) -> Void)?

    static func record(_ event: TelemetryEvent) {
        tap?(event)
        Telemetry.shared.record(event)
    }
}
