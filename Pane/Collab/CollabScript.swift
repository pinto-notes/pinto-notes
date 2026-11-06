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
///   {"signIn": {"email": "…", "password": "…"}}   unless signed in already ("again": true signs in anyway)
///   {"waitReady": 60}                              until sharing has started (seconds)
///   {"skipIntro": 6}                               past "Your notes are encrypted" and the first-run steps
///   {"create": "Offsite plan\n\n- [ ] Venue\n"}    a new note, opened
///   {"open": "Offsite plan"}                       a note by title, opened
///   {"showShare": true} / {"closeShare": true}     the Share sheet or popover, as the Share button does
///   {"access": "edit" | "view" | "off"}            People with the link
///   {"copyLink": "link.txt"}                       Share Link, copied (and written to the file)
///   {"waitFile": "link.txt"} then {"join": "link.txt"}   another device's link, opened, and Join on its question
///   {"openLink": {"file": "link.txt", "question": "q.json"}}, then {"answerJoin": "join" | "notNow"}   the question, then the answer
///   {"type": {"text": "…", "after": "anchor"}}     typed into the open note after `anchor` (or at the end)
///   {"waitText": "…"}                              until the open note shows it (60 s; or {"text": "…", "timeout": 180})
///   {"tick": "Venue"}                              taps (or clicks) the box of the item with that text
///   {"remove": "Sara"}                             Remove from Note on that person in Share, and its Remove
///   {"verify": {"name": "Sara", "file": "code.txt"}}   their safety code written, then "They match"
///   {"leave": true}                                Leave Note
///   {"delete": true}                               Delete the open note (the owner's stops sharing)
///   {"askDelete": {"file": "asked.txt", "fallback": "press-failed.txt"}}   its question, for a press from outside
///   {"waitGone": 90}                               until the open shared note is taken away
///   {"waitPresence": {"name": "Sara", "grey": true, "timeout": 30}}   until that person (without a name,
///                                                  anyone) is in the open note, shown grey or not (without "grey", either)
///   {"waitSync": {"text": "Not synced yet", "timeout": 30}}   until the open note's bar says it ("Synced" too)
///   {"deadLink": {"file": "link.txt", "out": "old-link.json"}}   opens a link and writes whether it opened and what it said
///   {"dismissJoinProblem": true}   the OK on that message
///   {"reviewAI": "open"}   the open note's AI receipt opens its review; "undoAll" presses Undo All
///   {"waitLostAccess": {"file": "lost.json", "timeout": 60}}   until "You no longer have access to …"
///                                                  shows: its title, message and buttons written to the file
///   {"answerLostAccess": "keepCopy" | "dontKeep" | "ok"}   as that alert's button does: Keep a Copy opens the copy
///   {"startFresh": true}                           Start fresh (the account's notes and links go)
///   {"dump": "state.json"}                         the open note's text, its share state and saved link, who's
///                                                  in it, its sync line, its AI mark, and a lost-access alert
///   {"wait": 2}, {"quit": true}
///   {"keyFetchHere": true}                         the key fetch the run script makes for this account's AI is this device's own, so it asks nothing here
///
/// The last four take "soft": true (answerLostAccess as {"answer": "keepCopy", "soft": true}): when what
/// they wait for doesn't come, the log says "<n> <step> missed …" in place of "ok" and the steps go on,
/// so a recording keeps what happened instead.
@MainActor
enum CollabScript {
    nonisolated static let betaBundleID = "dev.emilwagman.pane.beta"
    /// Asks the open note's Delete question, as Delete Note in its menu does (NoteDetailView).
    static let askDelete = Notification.Name("pane.collabScriptAskDelete")
    static let reviewAI = Notification.Name("pane.collabScriptReviewAI")

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
                } catch let missed as Missed {
                    log("\(n + 1) \(key) missed \(missed)")
                } catch {
                    log("\(n + 1) \(key) FAILED \(error)")
                    return
                }
            }
            log("done")
        }
    }

    struct Failed: Error, CustomStringConvertible { let description: String }
    /// A soft step whose moment didn't come: logged, and the steps go on.
    struct Missed: Error, CustomStringConvertible { let description: String }

    private static func play(_ key: String, _ value: Any) async throws {
        switch key {
        case "wait":
            try await Task.sleep(for: .seconds(value as? Double ?? 1))
        case "keyFetchHere":
            KeyCopyMoment.here = .now
        case "signIn":
            // "again": signs in even when signed in, as Start fresh asks for a recent sign-in.
            let v = value as? [String: Any] ?? [:]
            guard v["again"] as? Bool == true || CollabStore.shared?.isReady != true else { return }
            try await signIn?(v["email"] as? String ?? "", v["password"] as? String ?? "")
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
            // As opening the link and pressing Join on its question.
            let url = try link(value as? String ?? "link.txt")
            let before = Set(sharedNotes().map(\.id))
            JoinCenter.shared.open(url)
            try await until(60, "the link's question") { joinAsked() != nil || joinFailed() != nil || sharedNotes().contains { !before.contains($0.id) } }
            if let q = joinAsked() { try write(question(q), to: "join-question.json"); JoinCenter.shared.accept() }
            try await arrived(before)
        case "openLink":
            // The link opened, and its question shown: nothing joined until it's answered.
            let v = value as? [String: String] ?? [:]
            let url = try link(v["file"] ?? "link.txt")
            JoinCenter.shared.open(url)
            try await until(60, "the link's question") { joinAsked() != nil || joinFailed() != nil }
            if let why = joinFailed() { throw Failed(description: why) }
            try write(question(joinAsked()!), to: v["question"] ?? "join-question.json")
        case "deadLink":
            // A link that should no longer open: its message stays up, and what happened is written down.
            let v = value as? [String: String] ?? [:]
            let before = Set(sharedNotes().map(\.id))
            JoinCenter.shared.open(try link(v["file"] ?? "link.txt"))
            try await until(60, "the link's answer") { joinAsked() != nil || joinFailed() != nil || sharedNotes().contains { !before.contains($0.id) } }
            let says = joinFailed()
            let answer = try JSONSerialization.data(withJSONObject: ["opened": says == nil, "says": says ?? ""] as [String: Any])
            try write(String(decoding: answer, as: UTF8.self), to: v["out"] ?? "old-link.json")
        case "dismissJoinProblem":
            JoinCenter.shared.dismissProblem()
        case "reviewAI":
            // The receipt's button, or the review's Undo All, or Keep or Undo on its next part.
            NotificationCenter.default.post(name: reviewAI, object: value as? String)
        case "answerJoin":
            // The question's Join, or Not Now.
            let before = Set(sharedNotes().map(\.id))
            guard joinAsked() != nil else { throw Failed(description: "no question showing") }
            if value as? String == "notNow" { JoinCenter.shared.decline(); return }
            JoinCenter.shared.accept()
            try await arrived(before)
        case "type":
            let v = value as? [String: String] ?? [:]
            try await type(v["text"] ?? "", after: v["after"])
        case "replace":
            // The words selected and typed over, as a person does.
            let v = value as? [String: String] ?? [:]
            try await replace(v["from"] ?? "", with: v["to"] ?? "")
        case "keepClash":
            // The word's button on the card that asks which to keep; it asks first or this fails.
            let word = value as? String ?? ""
            try await until(60, "the question about the same words") { editor()?.controller?.clash != nil }
            editor()?.controller?.keepClash(word)
        case "waitClash":
            try await until(value as? Double ?? 60, "the question about the same words") { editor()?.controller?.clash != nil }
        case "waitText":
            let v = value as? [String: Any]
            let want = value as? String ?? v?["text"] as? String ?? ""
            try await until(v?["timeout"] as? Double ?? 60, "the note to show \(want)") { editorText()?.contains(want) == true }
        case "tick":
            try await tick(value as? String ?? "")
        case "remove":
            // As the person's menu in Share: Remove from Note, then Remove on its question.
            let name = value as? String ?? ""
            // The open sheet's own controller when Share is open, so the sheet shows what follows.
            let share = try ShareController.current ?? controller()
            try await until(30, "\(name) in the note") { share.refresh(); return share.state.people.contains { !$0.isMe && $0.name.hasPrefix(name) } }
            share.askRemove(share.state.people.first { !$0.isMe && $0.name.hasPrefix(name) }!)
            await share.confirmRemove()
            if let problem = share.state.problem { throw Failed(description: problem) }
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
        case "askDelete":
            // Delete Note's question on screen; the test presses its Delete from outside (an
            // accessibility press on that button) and writes `fallback` if it can't, which deletes directly.
            guard let context, let current else { throw Failed(description: "no note open") }
            let v = value as? [String: Any] ?? [:]
            NotificationCenter.default.post(name: askDelete, object: nil)
            try await Task.sleep(for: .seconds(1))
            try write("asked", to: v["file"] as? String ?? "asked.txt")
            let fallback = dir.appending(path: v["fallback"] as? String ?? "press-failed.txt")
            try await until(v["timeout"] as? Double ?? 90, "Delete to be pressed") {
                current.trashedAt != nil || FileManager.default.fileExists(atPath: fallback.path)
            }
            if current.trashedAt == nil { log("Delete wasn't pressed: deleting directly"); context.trash(current) }
            else { log("Delete pressed in the question") }
        case "waitGone":
            // The note this device has open was taken away (its owner deleted it, or stopped sharing).
            guard let current else { throw Failed(description: "no note open") }
            let id = current.id
            try await until(value as? Double ?? 90, "the shared note to go") {
                guard let n = notes().first(where: { $0.id == id }) else { return true }
                return n.deletedAt != nil || n.trashedAt != nil || n.sharedNoteID == nil
            }
        case "waitPresence":
            // As the people beside the note's title show them: by name, and grey when not heard from.
            let v = value as? [String: Any] ?? [:]
            let name = v["name"] as? String, grey = v["grey"] as? Bool
            let what = "\(name ?? "someone") in the note" + (grey.map { $0 ? ", grey" : ", not grey" } ?? "")
            try await until(v["timeout"] as? Double ?? 60, what, soft: v["soft"] as? Bool == true) {
                guard let s = session() else { return false }
                return here(s).contains { p in
                    let named = name.map { (p["name"] as? String)?.hasPrefix($0) == true } ?? true
                    let shown = grey.map { p["grey"] as? Bool == $0 } ?? true
                    return named && shown
                }
            }
        case "waitSync":
            let v = value as? [String: Any]
            let want = value as? String ?? v?["text"] as? String ?? ""
            try await until(v?["timeout"] as? Double ?? 60, "the note's bar to say \(want)", soft: v?["soft"] as? Bool == true) {
                session().flatMap { SharedSyncLine.at(.now, session: $0)?.text } == want
            }
        case "waitLostAccess":
            // Removed, or the owner stopped sharing: the alert over the notes (SharedRemovalAlert).
            let v = value as? [String: Any]
            try await until(v?["timeout"] as? Double ?? 60, "the lost-access alert", soft: v?["soft"] as? Bool == true) { SharedRemovals.shared.current != nil }
            try write(json(lostAccessQuestion(SharedRemovals.shared.current!)), to: v?["file"] as? String ?? "lost.json")
        case "answerLostAccess":
            let v = value as? [String: Any]
            let answer = value as? String ?? v?["answer"] as? String ?? ""
            guard let context else { throw Failed(description: "no store") }
            if v?["soft"] as? Bool == true, SharedRemovals.shared.current == nil { throw Missed(description: "no lost-access alert showing") }
            if let copy = try answerLostAccess(answer, removals: .shared, context: context) { open(copy) }
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

    private static func link(_ file: String) throws -> URL {
        let text = try String(contentsOf: dir.appending(path: file), encoding: .utf8)
        guard let url = URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines)) else { throw Failed(description: "not a link") }
        return url
    }
    private static func joinAsked() -> JoinPreview? { if case .asking(let p) = JoinCenter.shared.phase { p } else { nil } }
    private static func joinFailed() -> String? { if case .failed(let why) = JoinCenter.shared.phase { why } else { nil } }
    private static func question(_ p: JoinPreview) -> String {
        let q: [String: Any] = ["title": JoinCopy.askTitle(p), "message": JoinCopy.askMessage(p), "canEdit": p.canEdit,
                                "sharedNotesBefore": sharedNotes().map(\.title)]
        return String(decoding: (try? JSONSerialization.data(withJSONObject: q, options: [.prettyPrinted, .sortedKeys])) ?? Data(), as: UTF8.self)
    }
    /// Until the joined note is here, then opens it.
    private static func arrived(_ before: Set<UUID>) async throws {
        try await until(60, "the shared note to arrive") { joinFailed() != nil || sharedNotes().contains { !before.contains($0.id) } }
        if let why = joinFailed() { throw Failed(description: why) }
        let note = sharedNotes().first { !before.contains($0.id) }!
        current = note
        // Joining opens the note by itself (CollabStore.join): see that it did, on screen.
        let shows = { editorText() != nil && note.body.split(separator: "\n").first.map { editorText()!.contains($0) } == true }
        // Join opens the note itself; the step fails if it doesn't (on iPhone the push was once
        // dropped while the Join alert closed: RootView.reveal now waits for it).
        try await until(10, "the joined note to open by itself") { shows() }
        log("the joined note opened by itself")
    }

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

    /// `soft`: when the time runs out, the step is missed (logged, and the steps go on), not failed.
    private static func until(_ seconds: Double, _ what: String, soft: Bool = false, _ ok: () -> Bool) async throws {
        let end = Date.now.addingTimeInterval(seconds)
        while !ok() {
            guard Date.now < end else {
                let why = "waited \(Int(seconds)) s for \(what)"
                if soft { throw Missed(description: why) }
                throw Failed(description: why)
            }
            try await Task.sleep(for: .milliseconds(200))
        }
    }

    /// The open shared note's session, once its document is open here.
    private static func session() -> CollabSession? {
        guard let current else { return nil }
        return CollabStore.shared?.session(for: current.id)
    }

    /// The people in the note as the avatars beside its title show them (PresenceStack): each by
    /// name, and grey when not heard from for a while.
    static func here(_ session: CollabSession, at now: Date = .now) -> [[String: Any]] {
        session.peers.values.sorted { $0.name < $1.name }.map { ["name": $0.name, "grey": $0.isStale(at: now)] }
    }

    /// What the lost-access alert says, and its buttons, as SharedRemovalAlert shows them.
    static func lostAccessQuestion(_ removal: SharedRemoval) -> [String: Any] {
        ["title": removal.alertTitle, "message": removal.message,
         "buttons": removal.copy != nil ? [SharedRemoval.keepCopy, SharedRemoval.dontKeep] : ["OK"]]
    }

    /// The lost-access alert answered as its buttons do (SharedRemovalAlert): Keep a Copy makes your
    /// text a note of your own and returns it, for the step to open, as the button does; Don't Keep
    /// and OK let the note go. An answer the alert doesn't offer fails.
    static func answerLostAccess(_ answer: String, removals: SharedRemovals, context: ModelContext) throws -> Note? {
        guard let removal = removals.current else { throw Failed(description: "no lost-access alert showing") }
        let offersCopy = removal.copy != nil
        switch answer {
        case "keepCopy" where offersCopy:
            guard let copy = removals.keep(removal, in: context) else { throw Failed(description: "no copy kept") }
            return copy
        case "dontKeep" where offersCopy, "ok" where !offersCopy:
            removals.shown(removal)
            return nil
        default:
            throw Failed(description: "the alert has no \(answer) (it offers \((lostAccessQuestion(removal)["buttons"] as? [String] ?? []).joined(separator: ", ")))")
        }
    }

    private static func json(_ object: [String: Any]) -> String {
        String(decoding: (try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys])) ?? Data(), as: UTF8.self)
    }

    private static func write(_ text: String, to name: String) throws {
        try text.write(to: dir.appending(path: name), atomically: true, encoding: .utf8)
    }

    /// A line in the steps' log from the collaboration code (how an AI's change arrived, and
    /// whether it was marked), so a two-device run can tell afterwards. Only while steps are
    /// playing: never in Pinto Notes, never in the Beta used normally. Ids and counts only, no text.
    static func trace(_ line: @autoclosure () -> String) {
        guard running else { return }
        log("collab: \(line())")
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
            out["editable"] = editor()?.isEditable ?? NSNull()
            out["canUndo"] = editor()?.controller?.canUndo ?? NSNull()
            out["clash"] = editor()?.controller?.clash.map { $0.merged } ?? NSNull()
            out["documentOpen"] = CollabStore.shared?.session(for: current.id) != nil
            if let s = CollabStore.shared?.session(for: current.id) {
                out["here"] = here(s)
                out["sync"] = SharedSyncLine.at(.now, session: s)?.text ?? NSNull()
            }
            // An AI's last change, as the receipt names it ("Sara's Claude"), and whether the open
            // note has shown it (its receipt and tint come with that).
            out["ai"] = current.aiEditor.map { by -> [String: Any] in
                ["by": by, "person": current.aiEditorPerson ?? NSNull(), "says": AIEdit.whose(by, person: current.aiEditorPerson), "seen": !AIEdit.isUnseen(current)]
            } ?? NSNull()
            out["folder"] = current.folder?.name ?? NSNull()
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
        out["lostAccess"] = SharedRemovals.shared.current.map(lostAccessQuestion) ?? NSNull()
        return json(out)
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

    /// Ticks the box of the item with `item` in it the way a tap (or a click) on its circle does.
    private static func tick(_ item: String) async throws {
        try await until(60, "the editor to take a tick") { editor()?.isEditable == true }
        let view = editor()!
        #if os(iOS)
        let all = view.text as NSString
        #else
        let all = view.string as NSString
        #endif
        let r = all.range(of: item)
        guard r.location != NSNotFound else { throw Failed(description: "no \(item) in the note") }
        let line = all.lineRange(for: NSRange(location: r.location, length: 0)).location
        #if os(iOS)
        guard let p = view.checkboxCenter(line: line) else { throw Failed(description: "\(item) has no box") }
        view.tapCheckbox(at: p)
        #else
        guard let box = view.core.checkboxRect(line: line, layout: view.textLayoutManager), let window = view.window,
              let click = NSEvent.mouseEvent(with: .leftMouseDown, location: view.convert(CGPoint(x: box.midX + view.textContainerOrigin.x, y: box.midY + view.textContainerOrigin.y), to: nil),
                                             modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil,
                                             eventNumber: 0, clickCount: 1, pressure: 1) else { throw Failed(description: "\(item) has no box") }
        // Handed to the text view in this process, as AppKit would; nothing is posted to the system.
        view.mouseDown(with: click)
        #endif
    }

    private static func replace(_ words: String, with new: String) async throws {
        try await until(60, "the editor to take typing") { editor()?.isEditable == true }
        let view = editor()!
        #if os(iOS)
        if !view.isFirstResponder { view.becomeFirstResponder(); try await Task.sleep(for: .seconds(0.5)) }
        let r = (view.text as NSString).range(of: words)
        guard r.location != NSNotFound else { throw Failed(description: "no \(words) in the note") }
        view.selectedRange = r
        try await Task.sleep(for: .seconds(0.4))
        view.insertText(new)
        #else
        view.window?.makeFirstResponder(view)
        let r = (view.string as NSString).range(of: words)
        guard r.location != NSNotFound else { throw Failed(description: "no \(words) in the note") }
        view.setSelectedRange(r)
        try await Task.sleep(for: .seconds(0.4))
        view.insertText(new, replacementRange: r)
        #endif
    }

    /// Types a character at a time through the text view's own input path, as the keyboard does;
    /// Return asks the editor first, so lists continue.
    private static func type(_ text: String, after anchor: String?) async throws {
        // A shared note is read-only until its document has opened.
        try await until(60, "the editor to take typing") { editor()?.isEditable == true }
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
