import Foundation
import SwiftData
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// The two-device check of shared notes in the real app (Amber Notes Beta on staging): a local JSON
/// file of steps, played through the app's own code. Sharing goes through ShareController and the
/// live CollabStore, joining through JoinCenter, typing through the editor's own `insertText`, as
/// the keyboard does. No input events are posted.
///
///   "Amber Notes Beta" -collabScript /path/to/steps.json
///
/// Only Amber Notes Beta (bundle id dev.emilwagman.pane.beta, or .beta.<name>) honours it: Pinto Notes ignores the
/// argument (`requested`), so it can't run in a release. Only a local file is read. Steps are one key
/// each, played in order; names of files (`copyLink`, `waitFile`, `dump`, …) are in the app's temporary
/// directory (in the sandbox container on the Mac), where a test script puts and collects them:
///
///   {"signIn": {"email": "…", "password": "…"}}   unless signed in already
///   {"waitReady": 60}                              until sharing has started (seconds)
///   {"skipIntro": 6}                               past "Your notes are encrypted" and the first-run steps
///   {"create": "Offsite plan\n\n- [ ] Venue\n"}    a new note, opened
///   {"open": "Offsite plan"}                       a note by title, opened
///   {"showShare": true} / {"closeShare": true}     the Share sheet or popover, as the Share button does
///   {"access": "edit" | "view" | "off"}            People with the link
///   {"copyLink": "link.txt"}                       Share Link, copied (and written to the file)
///   {"waitFile": "link.txt"} then {"join": "link.txt"}   another device's link, opened
///   {"type": {"text": "…", "after": "anchor"}}     typed into the open note after `anchor` (or at the end)
///   {"waitText": "…"}                              until the open note shows it (60 s)
///   {"verify": {"name": "Sara", "file": "code.txt"}}   their safety code written, then "They match"
///   {"leave": true}                                Leave Note
///   {"delete": true}                               Delete the open note (the owner's stops sharing)
///   {"waitGone": 90}                               until the open shared note is taken away
///   {"startFresh": true}                           Start fresh (the account's notes and links go)
///   {"dump": "state.json"}                         the open note's text, its share state and saved link
///   {"wait": 2}, {"quit": true}
@MainActor
enum CollabScript {
    nonisolated static let betaBundleID = "dev.emilwagman.pane.beta"

    /// The steps file, when this app is Amber Notes Beta and was opened with `-collabScript <path>`.
    nonisolated static func requested(arguments: [String], bundleID: String?) -> URL? {
        // The Beta, or a copy of it with an id of its own (`dev.emilwagman.pane.beta.<name>`: its own
        // container and Keychain items on a machine where the Beta is signed in to someone else).
        guard let bundleID, bundleID == betaBundleID || bundleID.hasPrefix(betaBundleID + "."),
              let i = arguments.firstIndex(of: "-collabScript"), i + 1 < arguments.count else { return nil }
        let path = arguments[i + 1]
        // A path on this machine, never an address.
        guard path.hasPrefix("/"), !path.contains("://") else { return nil }
        return URL(fileURLWithPath: path)
    }

    private static var running = false
    private static var signIn: ((String, String) async throws -> Void)?
    private static var skipIntro: (() -> Void)?
    private static var context: ModelContext?
    private static var current: Note?
    private static let dir = URL(fileURLWithPath: NSTemporaryDirectory())

    /// Plays the steps file, if there is one. Called once the app has started.
    static func runIfRequested(context: ModelContext, signIn: @escaping (String, String) async throws -> Void, skipIntro: @escaping () -> Void) {
        guard !running, let file = requested(arguments: ProcessInfo.processInfo.arguments, bundleID: Bundle.main.bundleIdentifier),
              let data = try? Data(contentsOf: file),
              let steps = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return }
        running = true
        self.context = context
        self.signIn = signIn
        self.skipIntro = skipIntro
        Task { @MainActor in
            log("start \(steps.count) steps")
            for (n, step) in steps.enumerated() {
                guard let (key, value) = step.first else { continue }
                do {
                    try await play(key, value)
                    log("\(n + 1) \(key) ok")
                } catch {
                    log("\(n + 1) \(key) FAILED \(error)")
                    return
                }
            }
            log("done")
        }
    }

    struct Failed: Error, CustomStringConvertible { let description: String }

    private static func play(_ key: String, _ value: Any) async throws {
        switch key {
        case "wait":
            try await Task.sleep(for: .seconds(value as? Double ?? 1))
        case "signIn":
            guard CollabStore.shared?.isReady != true else { return }
            let v = value as? [String: String] ?? [:]
            try await signIn?(v["email"] ?? "", v["password"] ?? "")
        case "waitReady":
            try await until(value as? Double ?? 60, "sharing to start") { CollabStore.shared?.isReady == true && AccountCrypto.shared.dataKey != nil }
        case "skipIntro":
            // "Your notes are encrypted" and the first-run steps, as Continue and Skip end them; the
            // first-run flow can start after the first sync, so a few times over `value` seconds.
            let end = Date.now.addingTimeInterval(value as? Double ?? 6)
            while Date.now < end { skipIntro?(); try await Task.sleep(for: .seconds(1)) }
        case "create":
            guard let context else { throw Failed(description: "no store") }
            let note = Note(body: value as? String ?? "")
            context.insert(note)
            try? context.save()
            open(note)
        case "open":
            let title = value as? String ?? ""
            try await until(30, "a note called \(title)") { note(titled: title) != nil }
            open(note(titled: title)!)
        case "showShare":
            NotificationCenter.default.post(name: CollabDemo.showShare, object: nil)
            try await Task.sleep(for: .seconds(1))
        case "closeShare":
            NotificationCenter.default.post(name: CollabDemo.closeShare, object: nil)
            try await Task.sleep(for: .seconds(0.5))
        case "access":
            let access: ShareState.Access = switch value as? String { case "view": .view; case "off": .off; default: .edit }
            let share = try controller()
            await share.setAccess(access)
            if let problem = share.state.problem { throw Failed(description: problem) }
        case "copyLink":
            let share = try controller()
            await share.shareLink()
            guard let link = share.sharing else { throw Failed(description: share.state.problem ?? "no link") }
            copy(link.absoluteString)
            share.sharing = nil
            share.shareFinished(sent: true, copied: true)
            try write(link.absoluteString, to: value as? String ?? "link.txt")
        case "waitFile":
            let name = value as? String ?? ""
            try await until(600, "the file \(name)") { FileManager.default.fileExists(atPath: dir.appending(path: name).path) }
        case "join":
            let text = try String(contentsOf: dir.appending(path: value as? String ?? "link.txt"), encoding: .utf8)
            guard let url = URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines)) else { throw Failed(description: "not a link") }
            let before = Set(sharedNotes().map(\.id))
            JoinCenter.shared.open(url)
            try await until(60, "the shared note to arrive") { sharedNotes().contains { !before.contains($0.id) } }
            if case .failed(let why) = JoinCenter.shared.phase { throw Failed(description: why) }
            open(sharedNotes().first { !before.contains($0.id) }!)
        case "type":
            let v = value as? [String: String] ?? [:]
            try await type(v["text"] ?? "", after: v["after"])
        case "waitText":
            let want = value as? String ?? ""
            try await until(60, "the note to show \(want)") { editorText()?.contains(want) == true }
        case "verify":
            let v = value as? [String: String] ?? [:]
            let share = try controller()
            share.refresh()
            guard let person = share.state.people.first(where: { !$0.isMe && $0.name.hasPrefix(v["name"] ?? "") }), let code = person.safetyCode else {
                throw Failed(description: "no safety code for \(v["name"] ?? "")")
            }
            try write(code, to: v["file"] ?? "code.txt")
            share.verify(person)
        case "leave":
            let share = try controller()
            share.askLeave()
            await share.confirmLeave()
            if let problem = share.state.problem { throw Failed(description: problem) }
            NotificationCenter.default.post(name: CollabDemo.closeShare, object: nil)
        case "delete":
            // As Delete in the note's menu: yours stops being shared, someone else's you leave.
            guard let context, let current else { throw Failed(description: "no note open") }
            context.trash(current)
        case "waitGone":
            // The note this device has open was taken away (its owner deleted it, or stopped sharing).
            guard let current else { throw Failed(description: "no note open") }
            let id = current.id
            try await until(value as? Double ?? 90, "the shared note to go") {
                guard let n = notes().first(where: { $0.id == id }) else { return true }
                return n.deletedAt != nil || n.trashedAt != nil || n.sharedNoteID == nil
            }
        case "startFresh":
            try await AccountCrypto.shared.startFresh(confirmation: AccountCrypto.startFreshPhrase)
        case "dump":
            try write(dump(), to: value as? String ?? "state.json")
        case "quit":
            log("quit")
            #if os(macOS)
            NSApp.terminate(nil)
            #else
            exit(0)
            #endif
        default:
            throw Failed(description: "unknown step \(key)")
        }
    }

    // MARK: Pieces

    private static func controller() throws -> ShareController {
        guard let store = CollabStore.shared, let current else { throw Failed(description: "no note open, or sharing isn't on") }
        return ShareController(note: current, backend: store)
    }

    private static func open(_ note: Note) {
        current = note
        NoteOpener.shared.open(note.id)
    }

    private static func notes() -> [Note] {
        (try? context?.fetch(FetchDescriptor<Note>())) ?? []
    }
    private static func note(titled title: String) -> Note? { notes().first { $0.title == title && $0.deletedAt == nil && $0.trashedAt == nil } }
    private static func sharedNotes() -> [Note] { notes().filter { $0.sharedNoteID != nil && $0.deletedAt == nil } }

    private static func until(_ seconds: Double, _ what: String, _ ok: () -> Bool) async throws {
        let end = Date.now.addingTimeInterval(seconds)
        while !ok() {
            guard Date.now < end else { throw Failed(description: "waited \(Int(seconds)) s for \(what)") }
            try await Task.sleep(for: .milliseconds(200))
        }
    }

    private static func write(_ text: String, to name: String) throws {
        try text.write(to: dir.appending(path: name), atomically: true, encoding: .utf8)
    }

    private static func log(_ line: String) {
        let url = dir.appending(path: "collab-script.log")
        let stamped = "\(ISO8601DateFormatter().string(from: .now)) \(line)\n"
        if let h = try? FileHandle(forWritingTo: url) {
            h.seekToEndOfFile(); h.write(Data(stamped.utf8)); try? h.close()
        } else {
            try? stamped.write(to: url, atomically: true, encoding: .utf8)
        }
    }

    private static func copy(_ s: String) {
        #if os(iOS)
        UIPasteboard.general.string = s
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(s, forType: .string)
        #endif
    }

    /// What the open note shows and how it's shared, for the test script to check.
    private static func dump() -> String {
        var out: [String: Any] = ["signedIn": AccountCrypto.shared.account != nil, "ready": CollabStore.shared?.isReady == true]
        if let current {
            out["title"] = current.title
            out["text"] = editorText() ?? current.body
            out["sharedNoteID"] = current.sharedNoteID?.uuidString ?? NSNull()
            out["deleted"] = current.deletedAt != nil
            out["inRecentlyDeleted"] = current.trashedAt != nil && current.deletedAt == nil
            if let store = CollabStore.shared {
                let s = ShareController(note: current, backend: store).state
                out["access"] = s.access.rawValue
                out["link"] = s.link != nil
                out["people"] = s.people.map { ["name": $0.name, "role": $0.role, "me": $0.isMe, "verified": $0.verified] }
                if let account = AccountCrypto.shared.account, let shared = current.sharedNoteID ?? (s.link != nil ? current.id : nil) {
                    let vault = KeychainLinkVault(account: account)
                    out["linkSaved"] = vault.load(shared) != nil
                    out["linkInFile"] = vault.usesFallback
                }
            }
        }
        out["sharedNotes"] = sharedNotes().map(\.title)
        let data = (try? JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted, .sortedKeys])) ?? Data()
        return String(decoding: data, as: UTF8.self)
    }

    // MARK: The editor

    #if os(iOS)
    private static func editor() -> PaneTextView? {
        func find(_ v: UIView) -> PaneTextView? {
            if let t = v as? PaneTextView, t.window != nil, !t.isHidden { return t }
            for s in v.subviews { if let t = find(s) { return t } }
            return nil
        }
        for w in UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).flatMap(\.windows) { if let t = find(w) { return t } }
        return nil
    }
    private static func editorText() -> String? { editor()?.text }
    #else
    private static func editor() -> PaneTextView? {
        func find(_ v: NSView) -> PaneTextView? {
            if let t = v as? PaneTextView, t.window != nil, !t.isHidden { return t }
            for s in v.subviews { if let t = find(s) { return t } }
            return nil
        }
        for w in NSApp.windows where w.isVisible { if let c = w.contentView, let t = find(c) { return t } }
        return nil
    }
    private static func editorText() -> String? { editor()?.string }
    #endif

    /// Types a character at a time through the text view's own input path, as the keyboard does;
    /// Return asks the editor first, so lists continue.
    private static func type(_ text: String, after anchor: String?) async throws {
        try await until(30, "the editor") { editor() != nil }
        let view = editor()!
        #if os(iOS)
        if !view.isFirstResponder { view.becomeFirstResponder(); try await Task.sleep(for: .seconds(0.5)) }
        let all = view.text as NSString
        #else
        view.window?.makeFirstResponder(view)
        let all = view.string as NSString
        #endif
        var at = all.length
        if let anchor {
            let r = all.range(of: anchor)
            guard r.location != NSNotFound else { throw Failed(description: "no \(anchor) in the note") }
            at = NSMaxRange(r)
        }
        #if os(iOS)
        view.selectedRange = NSRange(location: at, length: 0)
        #else
        view.setSelectedRange(NSRange(location: at, length: 0))
        #endif
        try await Task.sleep(for: .seconds(0.3))
        for ch in text {
            #if os(iOS)
            if ch == "\n", let delegate = view.delegate,
               delegate.textView?(view, shouldChangeTextIn: view.selectedRange, replacementText: "\n") == false {
                try await Task.sleep(for: .seconds(0.12))
                continue
            }
            view.insertText(String(ch))
            #else
            if ch == "\n" { view.insertNewline(nil) } else { view.insertText(String(ch), replacementRange: view.selectedRange()) }
            #endif
            try await Task.sleep(for: .seconds(ch == " " ? 0.11 : Double.random(in: 0.06...0.13)))
        }
    }
}
