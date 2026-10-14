import CryptoKit
import Foundation
import SwiftData

/// Share: one link per note, Can edit, Can view or Off (ShareSheet, ShareController).
///
/// The link is `<site>/s/<id>#<secret>`. From the secret come the join answer (the server keeps
/// its SHA-256) and the key the note key is sealed under for whoever joins (`note_invite_links`,
/// with the link's role). Neither leaves the device except inside the link. Opening it in Pinto
/// Notes joins the note with that role. (The read-only web copy of a link, `SealedLink`, isn't
/// published yet.)
extension CollabStore: ShareBackend {
    /// The values an Edit link's secret gives: what proves you hold it, and the key that opens the
    /// note key. The same derivation as `linkKeys` in supabase/functions/_shared/collab.ts.
    nonisolated static func linkKeys(_ secret: Data, link: String) -> (answer: String, answerHash: String, key: SymmetricKey) {
        let base = SymmetricKey(data: secret)
        let answer = HKDF<SHA256>.deriveKey(inputKeyMaterial: base, salt: E2EE.hkdfSalt, info: Data("invite answer \(link.lowercased())".utf8), outputByteCount: 32)
        let key = HKDF<SHA256>.deriveKey(inputKeyMaterial: base, salt: E2EE.hkdfSalt, info: Data("invite key \(link.lowercased())".utf8), outputByteCount: 32)
        let raw = E2EE.bytes(answer)
        return (E2EE.hex(raw), E2EE.hex(SHA256.hash(data: raw)), key)
    }

    /// The note's link while it's on. It's never shown, only handed to the share sheet.
    func linkURL(_ note: Note) -> URL? {
        guard let l = links[note.id], linkAccess[note.id] != nil else { return nil }
        return URL(string: "\(Self.site)/s/\(l.id)#\(SealedLink.base64url(l.secret))")
    }

    func access(_ note: Note) -> ShareState.Access { access(of: note.id) }
    func access(of note: UUID) -> ShareState.Access { linkAccess[note] ?? .off }

    /// Can edit or Can view: the note becomes a shared note (its own key) if it isn't one yet, and
    /// the link lets whoever opens it in Pinto Notes join with that role. Off: the link stops
    /// working at once; turning it on again makes a new one.
    func setAccess(_ access: ShareState.Access, for note: Note) async throws {
        guard let transport else { throw Collab.Failure.notSignedIn }
        switch access {
        case .off:
            if sessions[note.id] != nil { try await transport.stopLink(note: note.id) }
            links[note.id] = nil
            linkAccess[note.id] = nil
            linkVault?.remove(note.id)
        case .view, .edit:
            if sessions[note.id] == nil { try await share(note) }
            let link = links[note.id] ?? (SealedLink.randomID(bytes: 16), E2EE.randomBytes(16))
            try await publishInviteLink(note, link: link, role: access == .edit ? "editor" : "viewer")
            links[note.id] = link
            linkAccess[note.id] = access
            linkVault?.save(LinkVaultEntry(id: link.id, secret: link.secret, access: access.rawValue), for: note.id)
        }
        CollabDemo.wrote(access == .edit ? "edit-link" : "link", linkURL(note) ?? URL(fileURLWithPath: "/"))
    }

    /// The link's join row: the hash of what proves you hold the link, and the note key sealed
    /// under the link's own key. Neither the link nor its secret reaches the server.
    private func publishInviteLink(_ note: Note, link: (id: String, secret: Data), role: String) async throws {
        guard let transport, let k = keys[note.id] else { throw Collab.Failure.notSignedIn }
        let lk = Self.linkKeys(link.secret, link: link.id)
        let wrap = try NoteCrypto.seal(E2EE.bytes(k.nk).base64EncodedString(), key: lk.key, keyID: E2EE.keyID(of: k.nk), context: "invite:\(link.id.lowercased())")
        try await transport.createLink(id: link.id, note: note.id, role: role, epoch: k.epoch, answerHash: lk.answerHash, keyWrap: wrap)
    }

    /// Removes someone: quietly, a new key for everyone else and a new link (the old one would let
    /// them back in). The new link reaches people when it's shared again.
    func remove(_ user: UUID, from note: Note) async throws {
        try await rotate(note, removing: user)
        // The server dropped the old link with the old key.
        links[note.id] = nil
        if let access = linkAccess[note.id] {
            linkAccess[note.id] = nil
            try await setAccess(access, for: note)
        }
    }

    /// You leave someone else's note. The server takes you out of it; the owner's next device
    /// gives the note a new key without you.
    func leave(_ note: Note) async throws {
        guard let transport else { throw Collab.Failure.notSignedIn }
        try await transport.leave(note: note.id)
        sessions[note.id]?.disconnect()
        sessions[note.id] = nil
        keys[note.id] = nil
        onLeft?(note.id)
    }

    /// The note's link as this device or your others kept it, after a relaunch.
    func restoreLink(_ note: UUID) {
        guard links[note] == nil, let e = linkVault?.load(note), let access = ShareState.Access(rawValue: e.access), access != .off else { return }
        links[note] = (e.id, e.secret)
        linkAccess[note] = access
    }

    /// "They match": you checked this person's safety code. A changed key you checked is trusted.
    func markVerified(_ user: UUID, in note: Note) {
        if let change = keyChanges.first(where: { $0.user == user }) { trust(change) }
        guard let key = sessions[note.id]?.members.first(where: { $0.id == user })?.publicKey else { return }
        verified.mark(user, key: key)
    }

    /// Share's state for a note: the link, and everyone in it (just you before anyone joins).
    func shareState(for note: Note) -> ShareState {
        restoreLink(note.id)
        let list = people(in: note)
        let me = self.me ?? UUID()
        let people = (list.isEmpty ? [.init(id: me, name: name, isMe: true, role: "owner")] : list).map { p in
            var p = p
            p.photo = photos[p.id]
            return p
        }
        return ShareState(link: linkURL(note), access: access(note), people: people)
    }

    /// A new note key, sealed from this device to every member who stays, in one call; then the
    /// document re-sealed under it, so devices that join later start from there.
    private func rotate(_ note: Note, removing user: UUID?) async throws {
        guard let transport, let me, let session = sessions[note.id], let old = keys[note.id] else { return }
        let identity = try await ensureIdentity()
        // Everything stored so far goes into the snapshot sealed under the new key below, so a device
        // that starts from it never needs a change sealed under the old one.
        await session.catchUp()
        let members = try await transport.members(of: note.id)
        checkKeys(members)
        let epoch = old.epoch + 1
        let nk = SymmetricKey(size: .bits256)
        var wraps: [Collab.Wrap] = []
        for m in members where m.user_id != user {
            // Sealed only to the key first seen for each person: a changed key gets nothing until
            // someone checks the code, and the server then refuses the incomplete set.
            guard let key = identityKeys?.trustedKey(of: m) else { continue }
            wraps.append(Collab.Wrap(user_id: m.user_id, key_wrap: try CollabCrypto.sealNoteKey(nk, from: identity, to: key, party: .init(note: note.id, epoch: epoch, from: me, to: m.user_id))))
        }
        try await transport.remove(note: note.id, user: user, epoch: epoch, wraps: wraps)
        try await transport.accept(note: note.id, selfWrap: try CollabCrypto.selfWrap(nk, dataKey: try dataKey(), note: note.id, epoch: epoch))
        keys[note.id] = (nk, epoch)
        session.reseal(nk: nk, epoch: epoch)
        try? await transport.send(snapshot: try session.sealedSnapshot(upto: session.lastSeen), note: note.id, upto: session.lastSeen, epoch: epoch)
        await session.refreshMembers()
    }

    /// Who's in the note, for the Share sheet: you first, then the others in the order they joined.
    func people(in note: Note) -> [ShareState.Person] {
        guard let session = sessions[note.id] else { return [] }
        return session.members.map { m in
            ShareState.Person(id: m.id, name: m.name, isMe: m.id == session.me, role: m.role,
                              safetyCode: m.id == session.me ? nil : identity.flatMap { id in m.publicKey.map { CollabCrypto.safetyCode(id.publicRaw, $0) } },
                              verified: m.publicKey.map { verified.isVerified(m.id, key: $0) } ?? false,
                              keyChanged: keyChanges.first { $0.user == m.id }?.message)
        }.sorted { ($0.isMe ? 0 : 1, $0.role == "owner" ? 0 : 1) < ($1.isMe ? 0 : 1, $1.role == "owner" ? 0 : 1) }
    }

    /// What you share, for the export's Sharing.md: the open shared notes and notes with a link,
    /// with their people and link setting, and the templates you published.
    func exportSharing() -> NoteExport.Sharing {
        let ids = Set(sessions.keys).union(links.keys).sorted { $0.uuidString < $1.uuidString }
        let notes = ids.map { id in
            let people = sessions[id].map { s in
                s.members.map { NoteExport.Sharing.Person(name: $0.name, role: $0.role, isMe: $0.id == s.me) }
            } ?? []
            let link: ShareState.Access? = links[id] == nil ? nil : access(of: id)
            return NoteExport.Sharing.SharedNote(note: id, people: people, link: link)
        }
        let templates = templates.sorted { $0.key.uuidString < $1.key.uuidString }
            .map { NoteExport.Sharing.Template(note: $0.key, url: URL(string: "\(Self.site)/t/\($0.value)")!) }
        return .init(notes: notes, templates: templates)
    }

    // MARK: Opening a link

    /// A link's id and secret, from `…/s/<id>#<secret>` (or ambernotes://s/<id>#<secret>).
    nonisolated static func parseLink(_ url: URL) -> (id: String, secret: Data)? {
        let parts = url.path.split(separator: "/").map(String.init)
        let id: String
        if url.scheme == AppIdentity.scheme, url.host == "s", let first = parts.first { id = first }
        else if let i = parts.firstIndex(of: "s"), i + 1 < parts.count { id = parts[i + 1] }
        else { return nil }
        guard id.range(of: #"^[A-Za-z0-9_-]{22}$"#, options: .regularExpression) != nil, let frag = url.fragment,
              frag.range(of: #"^[A-Za-z0-9_-]{22}$"#, options: .regularExpression) != nil else { return nil }
        var b64 = frag.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64 += "=" }
        guard let secret = Data(base64Encoded: b64) else { return nil }
        return (id, secret)
    }

    /// A link opened in the app: joins the note with the link's role (Can edit or Can view) and
    /// opens it. A link that was turned off or changed says so.
    @discardableResult
    func join(_ url: URL) async -> Bool {
        guard let transport, let me, let context, let (id, secret) = Self.parseLink(url) else { return false }
        let lk = Self.linkKeys(secret, link: id)
        guard let opened = try? await transport.openLink(id: id, answer: lk.answer) else {
            joinProblem = "This link was turned off or changed. Ask for a new one."
            return false
        }
        // Already in the note on this device (your own link, or one you joined before): open it.
        if sessions[opened.note_id] != nil {
            NoteOpener.shared.open(opened.note_id)
            return true
        }
        do {
            guard let text = try? NoteCrypto.open(opened.key_wrap, key: lk.key, context: "invite:\(id.lowercased())"),
                  let raw = Data(base64Encoded: text), raw.count == 32 else { throw CollabCrypto.Failure.wrongKey }
            let nk = SymmetricKey(data: raw)
            let identity = try await ensureIdentity()
            let toSelf = try CollabCrypto.sealNoteKey(nk, from: identity, to: identity.publicRaw, party: .init(note: opened.note_id, epoch: opened.epoch, from: me, to: me))
            try await transport.joinLink(id: id, answer: lk.answer, keyWrap: toSelf, selfWrap: try CollabCrypto.selfWrap(nk, dataKey: try dataKey(), note: opened.note_id, epoch: opened.epoch))
            handled.insert(opened.note_id)
            let session = try await CollabSession.load(note: opened.note_id, epoch: opened.epoch, nk: nk, transport: transport, me: me, name: name)
            keys[opened.note_id] = (nk, opened.epoch)
            let note = context.note(opened.note_id) ?? {
                let n = Note(body: session.text)
                n.id = opened.note_id
                context.insert(n)
                return n
            }()
            note.body = session.text
            note.updatedAt = .now
            try? context.save()
            openSession(session, note: note)
            NoteOpener.shared.open(note.id)
            return true
        } catch {
            joinProblem = "This link didn't open. Ask for a new one."
            return false
        }
    }

    /// Your memberships, checked now and then: a new key (someone was removed, or the link was
    /// reset) is opened and taken; a note you were removed from stops syncing.
    func followKeys(_ rows: [Collab.Membership]) async {
        for (id, session) in sessions {
            guard let row = rows.first(where: { $0.note_id == id }) else {
                session.disconnect()
                sessions[id] = nil
                removedFrom.insert(id)
                continue
            }
            guard row.epoch > session.epoch, let opened = try? await openKey(row) else { continue }
            if row.self_wrap == nil, let key = try? dataKey(), let wrap = try? CollabCrypto.selfWrap(opened.nk, dataKey: key, note: id, epoch: row.epoch) {
                try? await transport?.accept(note: id, selfWrap: wrap)
            }
            keys[id] = (opened.nk, row.epoch)
            session.reseal(nk: opened.nk, epoch: row.epoch)
        }
    }
}
