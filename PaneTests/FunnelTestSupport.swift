import Foundation
@testable import Pane

/// The funnel steps a piece of code records (Funnel.tap), for the funnel tests:
///
///     let steps = FunnelSteps()
///     await steps.watch { ... }
///     #expect(steps.count(.importStep(.appleNotes, .opened)) == 1)
final class FunnelSteps: @unchecked Sendable {
    private(set) var events: [TelemetryEvent] = []
    private let lock = NSLock()

    private func add(_ e: TelemetryEvent) { lock.withLock { events.append(e) } }

    /// Runs `body` with this collecting every funnel step recorded in its task (and tasks it starts).
    func watch<T>(_ body: () async throws -> T) async rethrows -> T {
        try await Funnel.$tap.withValue({ [self] e in add(e) }, operation: body)
    }

    /// The same, for code that doesn't wait.
    func watch<T>(_ body: () throws -> T) rethrows -> T {
        try Funnel.$tap.withValue({ [self] e in add(e) }, operation: body)
    }

    /// How many times this exact step was recorded.
    func count(_ e: TelemetryEvent) -> Int { lock.withLock { events.filter { $0 == e }.count } }
}
