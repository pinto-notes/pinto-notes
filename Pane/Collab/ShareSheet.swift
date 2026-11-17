import SwiftUI
#if os(macOS)
import AppKit
#endif

/// Share: who's in the note, one Share Link button, and what the link lets people do.
///
/// - People come first: everyone in the note with their role. Remove is in a row's context menu
///   (and a swipe on iPhone); removing someone quietly gives the note a new key and a new link.
///   Tapping someone shows their safety code (Verify).
/// - Share Link hands the link to the system share sheet (iPhone) or share menu (Mac), which
///   already have Copy. The link itself is never shown.
/// - "People with the link: Can edit / Can view / Off" (a whiteboard also has Can comment, as
///   FigJam does). Off stops the link at once; turning it on again makes a new one, which is also
///   the way to retire a link that went too far.
/// - Someone else's note: Leave Note instead of the link.
///
/// No email invites in v1: people who sign in with Apple often hide their address.
struct ShareState: Equatable {
    enum Access: String, CaseIterable, Identifiable {
        case edit = "Can edit", comment = "Can comment", view = "Can view", off = "Off"
        var id: String { rawValue }

        /// What a link can let people do: Can comment only on a whiteboard (a note has no comments).
        static func choices(board: Bool) -> [Access] { board ? allCases : [.edit, .view, .off] }

        /// The role a link with it gives (`note_invite_links.role`).
        var role: String { self == .edit ? "editor" : self == .comment ? "commenter" : "viewer" }
    }
    /// What someone else in the note can do. The owner changes it from their row (Can edit, Can
    /// view), as the link's own role is changed under Join by Link.
    enum Role: String, CaseIterable, Identifiable {
        case editor, viewer
        var id: String { rawValue }
        var label: String { ShareCopy.role(rawValue) }
    }
    /// Nobody else is in the note and it has no link yet. Join by Link stays out of sight then: it
    /// read "Off" right above a button that makes a link anyone can join (Emil, 16 November 2026).
    var notSharedYet: Bool { access == .off && people.count <= 1 }
    struct Person: Identifiable, Equatable {
        let id: UUID
        var name: String
        var isMe = false
        var role: String
        var safetyCode: String?
        var photo: PImage? = nil
        /// You checked their safety code and it matched.
        var verified = false
        /// Their key isn't the one first seen for them: what to say (Collab.KeyChange.message).
        var keyChanged: String? = nil
        /// Their colour in this note (CollabSession.paletteSlot), when its members are known.
        var colorSlot: Int? = nil
    }
    var link: URL?
    var access: Access = .off
    var people: [Person] = []
    var problem: String?

    /// Your role in the note: owner, editor, commenter or viewer. A note nobody shares yet is yours.
    var myRole: String { people.first(where: \.isMe)?.role ?? "owner" }

    /// The people, each with their colour in this note: the session's when it has said, else the
    /// one the member list gives, by the board's own rule (CollabSession.slots: the owner, then the
    /// others as listed). So a person has one colour in Share, on the board and in a browser
    /// (round 15, comment-role-1: Cleo was plum here and blue on the board).
    var colored: [Person] {
        let order = people.filter { $0.role == "owner" }.map(\.id) + people.filter { $0.role != "owner" }.map(\.id)
        let slots = CollabSession.slots(for: order)
        return people.map { p in
            var p = p
            if p.colorSlot == nil { p.colorSlot = slots[p.id] }
            return p
        }
    }
}

/// The sheet's content on iPhone: People, then Share Link and what the link lets people do, or
/// Leave for someone else's note. The Mac shows the same controller in the toolbar's popover
/// (ShareNotePopover). The note's title isn't repeated: the note above says it.
struct ShareForm: View {
    @Bindable var share: ShareController
    var done: () -> Void = {}
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var state: ShareState { share.state }

    var body: some View {
        Form {
            Section {
                ForEach(state.colored) { p in
                    Group {
                        let busy = share.working == .remove(p.id) || share.working == .role(p.id)
                        if p.isMe || p.safetyCode == nil && !share.canChangeRole(p) { PersonRow(person: p, removing: busy) }
                        else { NavigationLink(value: p.id) { PersonRow(person: p, removing: busy) } }
                    }
                    #if os(iOS)
                    .swipeActions { if share.isOwner, !p.isMe { Button("Remove", role: .destructive) { share.askRemove(p) } } }
                    #endif
                    .contextMenu { if share.isOwner, !p.isMe { DestructiveMenuButton("Remove from Note", systemImage: "person.badge.minus") { share.askRemove(p) } } }
                }
            } footer: {
                VStack(alignment: .leading, spacing: 6) {
                    if case .removed = share.done { DoneLine(text: share.removedLine) }
                    if case .roleChanged(_, let said) = share.done { DoneLine(text: said) }
                }
            }

            if share.isOwner, let why = share.notYet {
                // Files or an app: not shared with people yet (SharedNoteLimits), said up front.
                Section {} footer: { Text(why).accessibilityIdentifier("share.notYet") }
            } else if share.isOwner {
                Section {
                    shareButton
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
                Section {
                    if !state.notSharedYet {
                        Picker(selection: Binding(get: { state.access }, set: { a in Task { await share.setAccess(a) } })) {
                            ForEach(ShareState.Access.choices(board: share.board())) { Text($0.rawValue).tag($0) }
                        } label: {
                            Text("Join by Link")
                        }
                        .pickerStyle(.menu)
                        .disabled(share.working != nil)
                        .accessibilityIdentifier("share.access")
                    }
                } footer: {
                    footer(share.done == .linkChanged ? nil : share.linkReplaced ? ShareCopy.linkReplaced : ShareCopy.link(state, board: share.board()), done: share.done == .linkChanged)
                }
            } else {
                Section {
                    Button(role: .destructive) { share.askLeave() } label: {
                        Text("Leave Note").foregroundStyle(.red)
                    }
                    .amberBusy(share.working == .leave)
                    .disabled(share.working != nil)
                    .accessibilityIdentifier("share.leave")
                } footer: {
                    footer(nil, done: false)
                }
            }
        }
        .formStyle(.grouped)
        // Someone removed: the rows below slide up rather than jump (persona council r7e).
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: state.people.map(\.id))
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: share.done)
        .navigationTitle("Share")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done", action: done).buttonStyle(.quiet) } }
        .navigationDestination(for: UUID.self) { id in
            if let p = state.colored.first(where: { $0.id == id }) {
                PersonDetail(person: p, canRemove: share.isOwner, justVerified: share.done == .verified(p.id),
                             roles: share.canChangeRole(p) ? .init(changing: share.working == .role(p.id), said: share.roleLine(for: p.id),
                                                                   problem: share.working == nil ? state.problem : nil,
                                                                   choose: { r in Task { await share.setRole(r, of: p) } }) : nil,
                             verify: { share.verify(p) }, done: done, remove: { share.askRemove(p) })
            }
        }
        .modifier(ShareConfirmations(share: share))
    }

    @ViewBuilder
    private func footer(_ line: String?, done: Bool) -> some View {
        if let problem = state.problem {
            Text(problem).foregroundStyle(.red).accessibilityIdentifier("share.problem")
        } else if done {
            DoneLine(text: ShareController.Done.linkChanged.text)
        } else if let line {
            Text(line)
        }
    }

    /// The one primary button. The system share sheet has Copy and every app to send it with.
    private var shareButton: some View {
        Button {
            Task { await share.shareLink() }
        } label: {
            if case .shared = share.done { Label(share.done?.text ?? "", systemImage: "checkmark") }
            else { Label("Invite People…", systemImage: "person.badge.plus") }
        }
        .buttonStyle(.amberProminent(.big, wide: true))
        .amberBusy(share.working == .link)
        .disabled(share.working != nil)
        #if os(macOS)
        .background(SharePickerAnchor(url: $share.sharing) { sent, copied in share.shareFinished(sent: sent, copied: copied) })
        #else
        .onChange(of: share.sharing) { _, url in
            guard let url else { return }
            share.sharing = nil
            ShareLinkSheet.present(url) { sent, copied in share.shareFinished(sent: sent, copied: copied) }
        }
        #endif
        .accessibilityIdentifier("share.link")
    }
}

/// "Removed", "Saved", "Copied": what just got done, with a tick, for a moment.
struct DoneLine: View {
    let text: String
    var body: some View {
        // Color.primary, not .primary: in a form's footer .primary is the footer's own grey.
        Label(text, systemImage: "checkmark")
            .foregroundStyle(Color.primary)
            .transition(.opacity)
            .accessibilityIdentifier("share.done")
    }
}

/// Remove and Leave ask first, with what happens in plain words.
struct ShareConfirmations: ViewModifier {
    @Bindable var share: ShareController

    func body(content: Content) -> some View {
        content
            .alert(share.confirmingRemove.map(ShareCopy.removeTitle) ?? "",
                   isPresented: Binding(get: { share.confirmingRemove != nil }, set: { if !$0 { share.confirmingRemove = nil } })) {
                Button("Cancel", role: .cancel) { share.confirmingRemove = nil }
                Button("Remove", role: .destructive) { Task { await share.confirmRemove() } }
            } message: {
                Text(share.confirmingRemove.map(ShareCopy.removeMessage) ?? "")
            }
            .alert(ShareCopy.leaveTitle(share.note.title), isPresented: $share.confirmingLeave) {
                Button("Cancel", role: .cancel) {}
                Button("Leave", role: .destructive) { Task { await share.confirmLeave() } }
            } message: {
                Text(ShareCopy.leaveMessage)
            }
    }
}

struct PersonRow: View {
    let person: ShareState.Person
    var removing = false
    var size: CGFloat = 32

    var body: some View {
        HStack(spacing: size > 28 ? 12 : 8) {
            // On its own in a row, an avatar needs no ring.
            PersonAvatar(name: person.name, color: Self.color(person), size: size, photo: person.photo, ring: .clear)
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Text(person.isMe ? "\(person.name) (you)" : person.name)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    if person.verified, person.keyChanged == nil {
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(.secondary).font(.caption)
                            .accessibilityLabel("Verified")
                    }
                }
                if person.keyChanged != nil {
                    Text(ShareCopy.keyChangedRow).font(.caption).foregroundStyle(Color(Palette.amber))
                }
            }
            Spacer(minLength: 4)
            if removing {
                ProgressView().controlSize(.small)
            } else {
                Text(ShareCopy.role(person.role))
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
    }

    /// One colour per person in the note, none shared with anyone else in it: the same in
    /// everyone's view (yours too), and the same as their caret. Never the app's accent.
    static func color(_ person: ShareState.Person) -> Color {
        person.colorSlot.map { CollabSession.color(at: $0) } ?? CollabSession.color(for: person.id)
    }
}

/// A person, opened: for the owner, what they can do (Can edit or Can view); their safety code,
/// calmly, for anyone who wants to check, "They match"; and Remove for the owner. A changed key
/// says so in one line, and "They match" trusts the new one.
struct PersonDetail: View {
    let person: ShareState.Person
    var canRemove = true
    var justVerified = false
    /// The owner's choice of what this person can do; nil for everyone else.
    var roles: Roles?
    struct Roles {
        var changing = false
        /// "Sara can view now.", once it's done.
        var said: String?
        var problem: String?
        var choose: (ShareState.Role) -> Void
    }
    var verify: () -> Void = {}
    /// Closes the whole sheet (the Back button goes back to Share).
    var done: (() -> Void)?
    let remove: () -> Void
    @Environment(\.dismiss) private var dismiss

    private var first: String { ShareCopy.first(person.name) }

    var body: some View {
        Form {
            Section {
                HStack(spacing: 14) {
                    PersonAvatar(name: person.name, color: PersonRow.color(person), size: 48, photo: person.photo, ring: .clear)
                    VStack(alignment: .leading) {
                        Text(person.name).font(.headline)
                        Text(ShareCopy.role(person.role)).foregroundStyle(.secondary)
                    }
                }
            }
            if let roles {
                Section {
                    Picker(selection: Binding<ShareState.Role?>(get: { ShareState.Role(rawValue: person.role) },
                                                                set: { r in if let r { roles.choose(r) } })) {
                        ForEach(ShareState.Role.allCases) { Text($0.label).tag(Optional($0)) }
                    } label: {
                        Text("Access")
                    }
                    .pickerStyle(.menu)
                    .disabled(roles.changing)
                    .accessibilityIdentifier("share.person.role")
                } footer: {
                    if let problem = roles.problem { Text(problem).foregroundStyle(.red).accessibilityIdentifier("share.problem") }
                    else if let said = roles.said { DoneLine(text: said) }
                }
            }
            if let code = person.safetyCode {
                Section {
                    SafetyCode(code: code)
                } header: {
                    Text("Verify \(first)")
                } footer: {
                    Text(person.keyChanged ?? ShareCopy.verify(first))
                }
                Section {
                    if person.verified && person.keyChanged == nil || justVerified {
                        DoneLine(text: ShareCopy.verifiedLine(first))
                    } else {
                        Button("They Match", action: verify)
                            .buttonStyle(.amberProminent(.big, wide: true))
                            .accessibilityIdentifier("share.verify")
                    }
                }
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)
            }
            if canRemove {
                Section {
                    // Its own inset row, as Leave Note is.
                    Button(role: .destructive) { dismiss(); remove() } label: { Text("Remove from Note").foregroundStyle(.red) }
                        .accessibilityIdentifier("share.person.remove")
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle(first)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar { if let done { ToolbarItem(placement: .confirmationAction) { Button("Done", action: done).buttonStyle(.quiet) } } }
    }
}

/// The twelve digits as three groups side by side, solid and large enough to read out.
struct SafetyCode: View {
    let code: String
    var alignment: Alignment = .center
    var body: some View {
        HStack(spacing: 8) {
            ForEach(Array(code.split(separator: " ").enumerated()), id: \.offset) { _, group in
                Text(group)
                    .font(.system(size: 20, weight: .semibold).monospacedDigit())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color(Palette.soft), in: .rect(cornerRadius: 8))
            }
        }
        .frame(maxWidth: .infinity, alignment: alignment)
        .textSelection(.enabled)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(code)
        .accessibilityIdentifier("share.safetyCode")
    }
}

#if os(macOS)
/// Opens the system share menu (Messages, Mail, AirDrop, Copy Link…) from the view it sits
/// behind, as soon as there's a link to share, and says whether it went somewhere.
struct SharePickerAnchor: NSViewRepresentable {
    @Binding var url: URL?
    var finished: (_ sent: Bool, _ copied: Bool) -> Void = { _, _ in }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, NSSharingServicePickerDelegate {
        var finished: (Bool, Bool) -> Void = { _, _ in }
        func sharingServicePicker(_ picker: NSSharingServicePicker, didChoose service: NSSharingService?) {
            let copied = service?.title.lowercased().contains("copy") ?? false
            finished(service != nil, copied)
        }
    }

    func makeNSView(context: Context) -> NSView { NSView() }

    func updateNSView(_ view: NSView, context: Context) {
        context.coordinator.finished = finished
        guard let url else { return }
        DispatchQueue.main.async {
            self.url = nil
            guard view.window != nil else { return }
            let picker = NSSharingServicePicker(items: [url])
            picker.delegate = context.coordinator
            picker.show(relativeTo: view.bounds, of: view, preferredEdge: .minY)
        }
    }
}
#else
/// The system share sheet for a note's link, saying when it went somewhere and whether it was Copy.
enum ShareLinkSheet {
    @MainActor static func present(_ url: URL, finished: @escaping (_ sent: Bool, _ copied: Bool) -> Void) {
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first,
              var top = scene.keyWindow?.rootViewController else { return }
        while let next = top.presentedViewController { top = next }
        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = top.view
        sheet.completionWithItemsHandler = { type, completed, _, _ in finished(completed, type == .copyToPasteboard) }
        top.present(sheet, animated: true)
    }
}
#endif

/// The live sheet: the form, wired to the store for this note.
struct ShareSheet: View {
    let note: Note
    @State private var share: ShareController
    @Environment(\.dismiss) private var dismiss

    init(note: Note, backend: ShareBackend) {
        self.note = note
        _share = State(initialValue: ShareController(note: note, backend: backend))
    }

    var body: some View {
        NavigationStack {
            ShareForm(share: share, done: { dismiss() })
        }
        .task {
            ShareController.current = share
            // People come and go: keep the list current while the sheet is open.
            while !Task.isCancelled {
                share.refresh()
                try? await Task.sleep(for: .seconds(0.5))
            }
        }
        .onChange(of: share.left) { _, left in if left { dismiss() } }
        #if os(macOS)
        .frame(minWidth: 420, minHeight: 360)
        #endif
    }
}
