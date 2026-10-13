import Foundation
@testable import Pane

/// Collects the funnel steps a piece of code records (Funnel.tap), for the funnel tests.
final class FunnelSteps: @unchecked Sendable {
    private(set) var events: [TelemetryEvent] = []
    private let lock = NSLock()

    init() { Funnel.tap = { [weak self] e in self?.add(e) } }
    deinit { Funnel.tap = nil }

    private func add(_ e: TelemetryEvent) { lock.withLock { events.append(e) } }

    /// How many times this exact step was recorded.
    func count(_ e: TelemetryEvent) -> Int { lock.withLock { events.filter { $0 == e }.count } }
}
