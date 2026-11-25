import Foundation
import Supabase

/// Share diagnostics and usage follows the account (docs/Technical/telemetry-inventory.md). The
/// server keeps the account's choice (telemetry_choice, 20261125120000_telemetry_choice.sql) and
/// stops its own counting when it's off; each device keeps a copy, which decides while signed out.
/// Between them, the latest choice wins: a device that turned it off while signed out tells the
/// account at sign-in, and a device signing in to an account that turned it off elsewhere turns off.
struct AccountTelemetryChoice: Decodable, Equatable, Sendable {
    /// Nil: the account never chose (on).
    var share: Bool?
    /// When it was chosen, in seconds since 1970.
    var updatedAt: Double?

    enum CodingKeys: String, CodingKey { case share, updatedAt = "updated_at" }

    var at: Date? { updatedAt.map(Date.init(timeIntervalSince1970:)) }
}

protocol TelemetryChoiceService: Sendable {
    func get() async throws -> AccountTelemetryChoice
    func set(_ share: Bool, at: Date) async throws -> AccountTelemetryChoice
}

struct SupabaseTelemetryChoice: TelemetryChoiceService {
    let client: SupabaseClient

    func get() async throws -> AccountTelemetryChoice {
        try await client.rpc("telemetry_choice_get").execute().value
    }

    func set(_ share: Bool, at: Date) async throws -> AccountTelemetryChoice {
        struct Params: Encodable { let share: Bool; let made_at: String }
        return try await client.rpc("telemetry_choice_set", params: Params(share: share, made_at: at.ISO8601Format())).execute().value
    }
}

@MainActor
enum TelemetryChoiceSync {
    enum Outcome: Equatable {
        /// The account's choice is newer: this device takes it.
        case adopt(Bool, at: Date?)
        /// This device's choice is newer: the account takes it.
        case push(Bool, at: Date)
        case agree
    }

    /// Which way the choice goes. `deviceAt` nil: this device never chose (it is on by default).
    nonisolated static func decide(device: Bool, deviceAt: Date?, account: AccountTelemetryChoice) -> Outcome {
        guard let share = account.share else {
            guard let deviceAt else { return .agree }
            return .push(device, at: deviceAt)
        }
        if share == device { return .agree }
        guard let deviceAt else { return .adopt(share, at: account.at) }
        return deviceAt > (account.at ?? .distantPast) ? .push(device, at: deviceAt) : .adopt(share, at: account.at)
    }

    /// The signed-in account's server, while signed in.
    private(set) static var service: TelemetryChoiceService?
    private static var running: Task<Void, Never>?

    /// Signed in: learn the account's choice, and tell it this device's if that's newer.
    static func signedIn(_ account: UUID, service: TelemetryChoiceService, telemetry: Telemetry = .shared) {
        self.service = service
        running?.cancel()
        running = Task { await sync(account, service: service, telemetry: telemetry) }
    }

    static func signedOut() {
        running?.cancel()
        running = nil
        service = nil
    }

    static func sync(_ account: UUID, service: TelemetryChoiceService, telemetry: Telemetry = .shared) async {
        do {
            let theirs = try await service.get()
            switch decide(device: telemetry.consent, deviceAt: telemetry.consentAt, account: theirs) {
            case let .adopt(share, at): telemetry.setConsent(share, at: at)
            case let .push(share, at): _ = try await service.set(share, at: at)
            case .agree: break
            }
            telemetry.accountChoiceKnown(account)
        } catch where (error as? URLError) != nil || Task.isCancelled {
            // Offline: still unknown. Sending waits, and the next sign-in or launch asks again.
        } catch {
            // The server answered but couldn't say (an older server): this device's choice stands.
            telemetry.accountChoiceKnown(account)
        }
    }

    /// The switch in Settings was flipped: the device takes it now, and the account as soon as it
    /// can (offline, the next sync sends it: this device's choice is newer).
    static func changed(_ share: Bool, telemetry: Telemetry = .shared) {
        telemetry.consent = share
        guard let service, let at = telemetry.consentAt else { return }
        Task { _ = try? await service.set(share, at: at) }
    }
}
