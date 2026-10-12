import CryptoKit
import Foundation

// The server's copy of the account's key (docs/Technical/recoverable-key.md).
//
// An account keeps its key one of two ways. Standard: the server also holds a sealed copy, so a
// device that signs in gets the key with no other device and no recovery key. Strict ("Advanced
// protection" in Settings): no copy, as every account was before. The copy is sealed on the server
// under a secret only the `key` function has; here are the two boxes a device makes or opens on
// the way, the same as supabase/functions/_shared/keycopy.ts, pinned by keycopy-vectors.json.

/// How the account keeps its key (`account_key_protection`).
enum KeyProtection: String, Sendable, Equatable {
    /// The server keeps a copy: signing in opens the notes on a new device.
    case standard
    /// The key is on the person's devices only.
    case strict
}

/// Why the server didn't store or hand out a key.
enum KeyCopyError: Error, Equatable {
    /// The server doesn't keep copies (yet): everything works as it did without them.
    case off
    /// The account keeps its key on its devices only.
    case strict
    /// An account from before copies, which hasn't chosen: nothing is stored without the person.
    case notChosen
    /// No copy of this account's key is kept.
    case noCopy
    /// 72 hours after a password reset, until `until`.
    case paused(until: Date?)
    case tooMany
    /// What was sent or came back isn't this account's key.
    case wrongKey
    /// Strict needs another way back first: a saved recovery key or another device.
    case needsRecoveryKey
    /// Strict can't be turned on for 72 hours after a password reset, until `until`.
    case strictPaused(until: Date?)
    case signIn
    /// The session's sign-in is too old for this: sign in again.
    case reauth
    case offline
}

/// The server's side of the copy. Every call throws a `KeyCopyError`.
protocol KeyCopyServer: Sendable {
    /// Whether the server keeps copies at all. Throws when it couldn't be asked.
    func available() async throws -> Bool
    /// Stores a copy of `key`. `choose`: the person chose this (or the account is new, where a
    /// copy is the default); without it the server only renews the copy of a standard account.
    /// `from`: the mode this device last saw. The server turns Advanced protection off only for a
    /// choice that says it saw it on, so a device that hasn't heard never undoes it.
    func store(_ key: StoredKey, user: UUID, choose: Bool, from: KeyProtection?) async throws
    /// The account's key from the server's copy, for the key id the server names.
    func fetch(user: UUID, keyID: String) async throws -> StoredKey
    /// Advanced protection: the server deletes its copy. `device` is this device,
    /// which doesn't count as another way back.
    func keepOnDevices(device: UUID) async throws
}

/// When this device last got the key by signing in: the "A new device opened your notes" notice
/// every device gets isn't news on the one that just did.
@MainActor
enum KeyCopyMoment {
    static var here: Date?
}

/// The boxes a key travels in between a device and the server:
/// `amb2t.<base64 sender's ephemeral P-256 public key (65) ‖ nonce (12) ‖ ciphertext ‖ tag>`,
/// key HKDF-SHA256(ECDH secret, salt "amber-notes/e2ee", info "key-copy <up|down> <user id>"),
/// AAD "amb2t|<up|down>|<user id>|<key id>", plaintext the data key (32) ‖ the recovery key (16).
enum KeyCopyBox {
    static let prefix = "amb2t."

    enum Direction: String { case up, down }

    private static func key(_ secret: SharedSecret, _ direction: Direction, user: UUID) -> SymmetricKey {
        secret.hkdfDerivedSymmetricKey(using: SHA256.self, salt: E2EE.hkdfSalt,
                                       sharedInfo: Data("key-copy \(direction.rawValue) \(user.uuidString.lowercased())".utf8), outputByteCount: 32)
    }

    private static func aad(_ direction: Direction, user: UUID, keyID: String) -> Data {
        Data("amb2t|\(direction.rawValue)|\(user.uuidString.lowercased())|\(keyID)".utf8)
    }

    /// The key sealed to the other side's public key (raw uncompressed, 65 bytes). `ephemeral`
    /// and `nonce` are for the test vector only.
    static func seal(_ stored: StoredKey, to publicKey: Data, direction: Direction, user: UUID,
                     ephemeral: P256.KeyAgreement.PrivateKey = .init(), nonce: AES.GCM.Nonce = .init()) throws -> String {
        guard publicKey.count == 65, publicKey.first == 4,
              let other = try? P256.KeyAgreement.PublicKey(x963Representation: publicKey) else { throw E2EE.Failure.malformed }
        let kek = key(try ephemeral.sharedSecretFromKeyAgreement(with: other), direction, user: user)
        let box = try AES.GCM.seal(stored.dataKey + stored.recovery, using: kek, nonce: nonce, authenticating: aad(direction, user: user, keyID: stored.keyID))
        guard let combined = box.combined else { throw E2EE.Failure.malformed }
        return prefix + (ephemeral.publicKey.x963Representation + combined).base64EncodedString()
    }

    /// What was sealed to `privateKey`, for this account and this key id. `generation`: the
    /// account's reset generation the key belongs to, which the server says beside the box.
    static func open(_ sealed: String, with privateKey: P256.KeyAgreement.PrivateKey, direction: Direction, user: UUID, keyID: String,
                     generation: Int = 0) throws -> StoredKey {
        guard sealed.hasPrefix(prefix), let bytes = Data(base64Encoded: String(sealed.dropFirst(prefix.count))),
              bytes.count == 65 + 12 + 48 + 16,
              let sender = try? P256.KeyAgreement.PublicKey(x963Representation: bytes.prefix(65)),
              let box = try? AES.GCM.SealedBox(combined: bytes.dropFirst(65)) else { throw E2EE.Failure.malformed }
        let kek = key(try privateKey.sharedSecretFromKeyAgreement(with: sender), direction, user: user)
        guard let plain = try? AES.GCM.open(box, using: kek, authenticating: aad(direction, user: user, keyID: keyID)) else { throw E2EE.Failure.wrongKey }
        guard plain.count == 48, let stored = StoredKey(dataKey: Data(plain.prefix(32)), recovery: Data(plain.suffix(16)), generation: generation),
              stored.keyID == keyID else { throw E2EE.Failure.malformed }
        return stored
    }
}

/// The words about where the key is kept, by the kind of account, in one place.
enum KeyCopyWords {
    static let strictTitle = "Advanced protection"
    static let strictSubtitle = "Only your devices hold your key. We can\u{2019}t open your notes, and can\u{2019}t help you back in."
    static let strictFooterOff = "Your notes are encrypted on your devices before they sync. We keep a locked copy of your key so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account. With Advanced protection on, we keep no copy."
    static let strictFooterOn = "Your notes are end-to-end encrypted: we can\u{2019}t open them and can\u{2019}t help you back in. A new device is added from one that has your notes, or opened with your recovery key."
    static let turnOnTitle = "Turn on Advanced protection?"
    static let turnOnMessage = "We delete our copy of your key now. After that we can\u{2019}t open your notes, and we can\u{2019}t help you if you lose your devices. A new device has to be added from one that has your notes, or opened with your recovery key."
    static let turnOn = "Turn On Advanced Protection"
    static let turnOffTitle = "Turn off Advanced protection?"
    static let turnOffMessage = "We keep a locked copy of your key again, so a new device only needs you to sign in. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account."
    static let turnOff = "Turn Off Advanced Protection"
    static let needsRecoveryKey = "Save your recovery key first, or add another device. Without one of them your notes could not be opened again."
    static let saveFirstTitle = "Save your recovery key first"
    static let saveFirstMessage = "With Advanced protection on, your recovery key is the only way back to your notes if you lose your devices. We can\u{2019}t help you then. Save it now, and Advanced protection turns on when it\u{2019}s saved."
    static let saveFirst = "Show and Save Recovery Key"
    static func strictPaused(until: Date?) -> String {
        let when = until.map { "from \($0.formatted(date: .long, time: .shortened))" } ?? "in 3 days"
        return "You can turn this on \(when), because the password was just reset."
    }
    static let copyTitle = "Pinto Notes"
    static let copyDetail = "Keeps a locked copy of your key, so signing in opens your notes on a new device"
    static let safeBySignIn = "Signing in opens your notes on a new device."
    static let unavailable = "Can\u{2019}t change this right now. Check your connection and try again."

    // The question an account from before is asked, once, before anything is copied.
    static let askTitle = "Signing in now opens your notes"
    static let askMessage = "Until now only your devices held the key to your notes, and a new device had to be added from one of them. From now on we keep a locked copy of your key, so signing in is enough and you can\u{2019}t lock yourself out.\n\nThat means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account. Prefer it the way it was? Keep your key on your devices only. You can change this later in Settings \u{203A} Security \u{203A} Advanced protection."
    static let askContinue = "Continue"
    static let askStrict = "Keep My Key on My Devices Only"
    /// Offered only when the answer couldn't be sent: the question comes back at the next launch.
    static let askNotNow = "Not Now"

    // A device waiting for the password-reset hold to end.
    static let heldTitle = "Your notes open here soon"
    static func heldMessage(until: Date?) -> String {
        let when = until.map { "on \($0.formatted(date: .long, time: .shortened))" } ?? "in 3 days"
        return "Your password was just reset, so this \(InstallID.kind) can open your notes \(when). That wait protects your notes from someone who got into your email."
    }
    static let heldAdd = "Open them now from another device"
    static let heldRetry = "Try again"

    /// Why the linking screen is up. A standard account reaches it only when the key couldn't be
    /// got by signing in just now (too many tries, the server down), and "only your own devices
    /// can open them" isn't so for it.
    static func gateWhy(_ protection: KeyProtection?) -> String {
        protection == .standard ? gateWhyStandard : AddDeviceCopy.gateWhy
    }
    static var gateWhyStandard: String { "You already have notes in this account. This \(InstallID.kind) couldn\u{2019}t get your key by signing in just now. Try again later, or add it from a device that has your notes." }
    static func noDeviceMessage(_ protection: KeyProtection?) -> String {
        protection == .standard ? "We couldn\u{2019}t get your key to this \(InstallID.kind) just now. One of these can still open your notes." : AddDeviceCopy.noDeviceMessage
    }

    // Before a key is fetched: the session is too old, or the person is asked first.
    static let signInAgainTitle = "Sign in again to open your notes"
    static var signInAgainMessage: String { "This \(InstallID.kind) has been signed in for a while without your notes. To open them here, sign in once more." }
    static let signInAgain = "Sign In Again"
    static let askFetchTitle = "Open your notes by signing in?"
    static var askFetchWasStrict: String { "Advanced protection was on for this account, and it is off now. Signing in can open your notes on this \(InstallID.kind). If you didn\u{2019}t turn it off, don\u{2019}t continue: reset your password and check your devices in Settings \u{203A} Security." }
    static var askFetchOtherKey: String { "This \(InstallID.kind) holds a different key from the one your account uses now. Signing in can open your notes with the account\u{2019}s key. If you didn\u{2019}t start fresh or change anything, don\u{2019}t continue: reset your password." }
    static let askFetch = "Open My Notes"
    static let reauthStrict = "Sign out and sign in again, then turn on Advanced protection within 10 minutes. That check keeps an old session from removing our copy of your key."

    /// While an account that hasn't a copy yet waits on a second device.
    static let waitForOther = "Or open Pinto Notes on a device that already has your notes. This one opens by itself after that."

    static func error(_ e: KeyCopyError) -> String {
        switch e {
        case .needsRecoveryKey: needsRecoveryKey
        case .strictPaused(let until): strictPaused(until: until)
        case .reauth: reauthStrict
        case .offline: "Can\u{2019}t reach Pinto Notes. Connect to the internet and try again."
        case .tooMany: "Too many tries. Wait a little and try again."
        case .paused(let until): heldMessage(until: until)
        default: unavailable
        }
    }
}
