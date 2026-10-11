import CryptoKit
import Foundation
import Supabase

/// The server's copy of the account's key (the `key` function and `keep_key_on_devices`;
/// docs/Technical/recoverable-key.md). A key crosses the network only sealed to a P-256 key of
/// the other side: to the function's ticket key going up, to a key this device makes per request
/// coming down.
struct SupabaseKeyCopy: KeyCopyServer {
    let client: SupabaseClient
    var platform: String = InstallID.platform

    private struct Hello: Decodable { var pub: String; var ticket: String }
    private struct Fetched: Decodable { var sealed: String; var key_id: String; var generation: Int }
    private struct Stored: Decodable { var stored: Bool }
    private struct Refusal: Decodable { var hint: String?; var until: String? }

    func available() async throws -> Bool {
        do {
            _ = try await hello()
            return true
        } catch KeyCopyError.off {
            return false
        }
    }

    private func hello() async throws -> Hello {
        do {
            return try await client.functions.invoke("key", options: FunctionInvokeOptions(method: .get))
        } catch { throw Self.refusal(error) }
    }

    func store(_ key: StoredKey, user: UUID, choose: Bool) async throws {
        let h = try await hello()
        guard let pub = Data(base64Encoded: h.pub), let box = try? KeyCopyBox.seal(key, to: pub, direction: .up, user: user) else { throw KeyCopyError.off }
        struct Body: Encodable { var op = "store"; var ticket: String; var box: String; var choose: Bool; var platform: String }
        do {
            let _: Stored = try await client.functions.invoke(
                "key", options: FunctionInvokeOptions(method: .post, body: Body(ticket: h.ticket, box: box, choose: choose, platform: platform)))
        } catch { throw Self.refusal(error) }
    }

    func fetch(user: UUID, keyID: String) async throws -> StoredKey {
        let mine = P256.KeyAgreement.PrivateKey()
        struct Body: Encodable { var op = "fetch"; var pub: String; var platform: String }
        let got: Fetched
        do {
            got = try await client.functions.invoke(
                "key", options: FunctionInvokeOptions(method: .post, body: Body(pub: mine.publicKey.x963Representation.base64EncodedString(), platform: platform)))
        } catch { throw Self.refusal(error) }
        // The account's key changed between the read and here: startup decides again.
        guard got.key_id == keyID,
              let key = try? KeyCopyBox.open(got.sealed, with: mine, direction: .down, user: user, keyID: keyID, generation: got.generation) else { throw KeyCopyError.wrongKey }
        return key
    }

    func keepOnDevices(device: UUID) async throws {
        do {
            try await client.rpc("keep_key_on_devices", params: ["p_device": device.uuidString.lowercased()]).execute()
        } catch let e as PostgrestError where e.hint == "needs_recovery_key" {
            throw KeyCopyError.needsRecoveryKey
        } catch let e as PostgrestError where e.hint == "paused_after_reset" {
            throw KeyCopyError.strictPaused(until: e.detail.flatMap(Backend.pauseDate))
        } catch {
            throw KeyCopyError.offline
        }
    }

    /// The function's refusal as the app knows it. "Off" is only what says so (or a server from
    /// before the function, which answers 404): it's remembered for hours, and a passing fault
    /// must not be. Anything else unknown is "couldn't ask".
    nonisolated static func refusal(_ error: Error) -> KeyCopyError {
        guard case .httpError(let status, let data)? = error as? FunctionsError else { return .offline }
        return refusal(status: status, body: data)
    }

    nonisolated static func refusal(status: Int, body: Data) -> KeyCopyError {
        let r = try? JSONDecoder().decode(Refusal.self, from: body)
        switch r?.hint {
        case "strict": return .strict
        case "not_chosen": return .notChosen
        case "no_copy", "no_key": return .noCopy
        case "paused_after_reset": return .paused(until: r?.until.flatMap(Backend.pauseDate))
        case "rate": return .tooMany
        case "wrong_key": return .wrongKey
        case "sign_in": return .signIn
        // The copy is there and can't be opened right now: the other ways to the notes are offered.
        case "unreadable": return .noCopy
        case "off": return .off
        default: return status == 401 ? .signIn : status == 404 ? .off : .offline
        }
    }
}
