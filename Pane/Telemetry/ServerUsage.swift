import Foundation
import Supabase

/// The usage the app writes to Pinto's own server, rather than PostHog: tips shown and used, the
/// features an account has used, its days of use, this install's hello, and the answer to "How
/// did you hear about Pinto Notes?". Every one goes through `send`, which asks the gate
/// (`Telemetry.allowed(.server)`) first; off, nothing is sent. The server asks the account's choice
/// again (public.telemetry_allowed, 20261125120000_telemetry_choice.sql).
///
/// The only place in the app that names these server functions (TelemetryGuardTests).
enum ServerUsage {
    enum Call: Equatable, Sendable {
        /// A tip, or the share ask, was shown, used or answered (pane_tip_activity).
        case tipEvent(tip: String, event: String)
        /// A feature was used, first use only (pane_feature_use): shared between devices for the tips.
        case featureUsed(String)
        /// Days notes were used on this device, "yyyy-MM-dd" (pane_active_days).
        case activeDays([String])
        /// This install's random id and platform (pane_devices).
        case seenDevice(UUID, platform: String)
        /// The heard-from answer (pane_heard_from).
        case heardFrom(source: String, detail: String)

        /// The server function, for the guard test's list.
        var function: String {
            switch self {
            case .tipEvent: "pane_tip_event"
            case .featureUsed: "pane_feature_used"
            case .activeDays: "pane_active_days_add"
            case .seenDevice: "pane_seen_device"
            case .heardFrom: "pane_heard_from_answer"
            }
        }
    }

    /// Every server function that records usage, one per case of `Call`.
    static let functions = ["pane_tip_event", "pane_feature_used", "pane_active_days_add", "pane_seen_device", "pane_heard_from_answer"]

    /// Tests: every call that passed the gate, in place of the server.
    @TaskLocal static var tap: (@Sendable (Call) -> Void)?

    /// Sends `call` if the switch is on. Off, it does nothing and doesn't throw.
    static func send(_ call: Call, _ client: SupabaseClient?, telemetry: Telemetry = .shared) async throws {
        guard telemetry.allowed(.server) else { return }
        if let tap { tap(call); return }
        guard let client else { return }
        switch call {
        case let .tipEvent(tip, event):
            try await client.rpc(call.function, params: ["tip": tip, "event": event]).execute()
        case let .featureUsed(feature):
            try await client.rpc(call.function, params: ["feature": feature]).execute()
        case let .activeDays(days):
            try await client.rpc(call.function, params: ["days": days]).execute()
        case let .seenDevice(device, platform):
            try await client.rpc(call.function, params: ["device": device.uuidString.lowercased(), "platform": platform]).execute()
        case let .heardFrom(source, detail):
            try await client.rpc(call.function, params: ["source": source, "detail": detail]).execute()
        }
    }

    /// The same, where a failure changes nothing.
    static func sendQuietly(_ call: Call, _ client: SupabaseClient?, telemetry: Telemetry = .shared) async {
        _ = try? await send(call, client, telemetry: telemetry)
    }
}
