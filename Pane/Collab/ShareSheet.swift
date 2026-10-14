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
/// - "People with the link: Can edit / Can view / Off". Off stops the link at once; turning it
///   on again makes a new one, which is also the way to retire a link that went too far.
/// - Someone else's note: Leave Note instead of the link.
///
/// No email invites in v1: people who sign in with Apple often hide their address.
struct ShareState: Equatable {
    enum Access: String, CaseIterable, Identifiable {
        case edit = "Can edit", view = "Can view", off = "Off"
        var id: String { rawValue }
    }
    struct Person: Identifiable, Equatable {
        let id: UUID
        var name: String
        var isMe = false
        var role: String
        var safetyCode: String?
        var photo: PImage? = nil
    }
    var link: URL?
    var access: Access = .off
    var people: [Person] = []
    var problem: String?

    /// Your role in the note: owner, editor or viewer. A note nobody shares yet is yours.
    var myRole: String { people.first(where: \.isMe)?.role ?? "owner" }
}

/// The sheet's content: People, the link, Leave. On iPhone in a sheet; the Mac shows the same
/// controller in the toolbar's popover (ShareNotePopover).
struct ShareForm: View {
    let title: String
    @Bindable var share: ShareController
    var done: () -> Void = {}

    private var state: ShareState { share.state }

    var body: some View {
        Form {
            Section {
                ForEach(state.people) { p in
                    Group {
                        if p.isMe || p.safetyCode == nil { PersonRow(person: p, removing: share.working == .remove(p.id)) }
                        else { NavigationLink(value: p.id) { PersonRow(person: p, removing: share.working == .remove(p.id)) } }
                    }
                    #if os(iOS)
                    .swipeActions { if share.isOwner, !p.isMe { Button("Remove", role: .destructive) { share.askRemove(p) } } }
                    #endif
                    .contextMenu { if share.isOwner, !p.isMe { Button("Remove from Note", systemImage: "person.badge.minus", role: .destructive) { share.askRemove(p) } } }
                }
            } footer: {
                Text(ShareCopy.privacy)
            }

            if share.isOwner {
                Section {
                    shareButton
                    Picker(selection: Binding(get: { state.access }, set: { a in Task { await share.setAccess(a) } })) {
                        ForEach(ShareState.Access.allCases) { Text($0.rawValue).tag($0) }
                    } label: {
                        Text("People with the link")
                    }
                    .pickerStyle(.menu)
                    .disabled(share.working != nil)
                    .accessibilityIdentifier("share.access")
                } footer: {
                    footer(ShareCopy.link(state))
                }
            } else {
                Section {
                    Button(role: .destructive) { share.askLeave() } label: {
                        if share.working == .leave { WorkingLabel(ShareCopy.working(.leave)) } else { Text("Leave Note") }
                    }
                    .disabled(share.working != nil)
                    .accessibilityIdentifier("share.leave")
                } footer: {
                    footer(nil)
                }
            }
        }
        .formStyle(.grouped)
        #if os(macOS)
        .buttonStyle(.borderless)
        #endif
        .navigationTitle("Share")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done", action: done) } }
        .navigationDestination(for: UUID.self) { id in
            if let p = state.people.first(where: { $0.id == id }) { PersonDetail(person: p, canRemove: share.isOwner, remove: { share.askRemove(p) }) }
        }
        .modifier(ShareConfirmations(share: share, title: title))
    }

    @ViewBuilder
    private func footer(_ line: String?) -> some View {
        if let problem = state.problem {
            Text(problem).foregroundStyle(.red).accessibilityIdentifier("share.problem")
        } else if let line {
            Text(line)
        }
    }

    /// One button. The system share sheet (iPhone) or menu (Mac) has Copy and every app to send it with.
    private var shareButton: some View {
        Button {
            Task { await share.shareLink() }
        } label: {
            if share.working == .link { WorkingLabel(ShareCopy.working(.link)) } else { Label("Share Link", systemImage: "square.and.arrow.up") }
        }
        .disabled(share.working != nil)
        #if os(macOS)
        .background(SharePickerAnchor(url: $share.sharing))
        #else
        .onChange(of: share.sharing) { _, url in
            guard let url else { return }
            share.sharing = nil
            SystemShare.present(url)
        }
        #endif
        .accessibilityIdentifier("share.link")
    }
}

/// Remove and Leave ask first, with what happens in plain words.
struct ShareConfirmations: ViewModifier {
    @Bindable var share: ShareController
    let title: String

    func body(content: Content) -> some View {
        content
            .alert(share.confirmingRemove.map(ShareCopy.removeTitle) ?? "",
                   isPresented: Binding(get: { share.confirmingRemove != nil }, set: { if !$0 { share.confirmingRemove = nil } })) {
                Button("Cancel", role: .cancel) { share.confirmingRemove = nil }
                Button("Remove", role: .destructive) { Task { await share.confirmRemove() } }
            } message: {
                Text(share.confirmingRemove.map(ShareCopy.removeMessage) ?? "")
            }
            .alert(ShareCopy.leaveTitle(title), isPresented: $share.confirmingLeave) {
                Button("Cancel", role: .cancel) {}
                Button("Leave", role: .destructive) { Task { await share.confirmLeave() } }
            } message: {
                Text(ShareCopy.leaveMessage)
            }
    }
}

/// A short progress line on the button that started it.
struct WorkingLabel: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        HStack(spacing: 8) {
            ProgressView().controlSize(.small)
            Text(text).foregroundStyle(.secondary)
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
            PersonAvatar(name: person.name, color: person.isMe ? Color(PColor.paneAccent) : CollabSession.color(for: person.id), size: size,
                         photo: person.photo, ring: .clear, ink: person.isMe ? .avatarOnAmber : .white)
            Text(person.isMe ? "\(person.name) (you)" : person.name)
                .lineLimit(1)
                .truncationMode(.tail)
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
}

/// A person, opened: their safety code for anyone who wants to check, and Remove.
struct PersonDetail: View {
    let person: ShareState.Person
    var canRemove = true
    let remove: () -> Void
    @Environment(\.dismiss) private var dismiss

    private var first: String { ShareCopy.first(person.name) }

    var body: some View {
        Form {
            Section {
                HStack(spacing: 14) {
                    PersonAvatar(name: person.name, color: CollabSession.color(for: person.id), size: 48, photo: person.photo, ring: .clear)
                    VStack(alignment: .leading) {
                        Text(person.name).font(.headline)
                        Text(ShareCopy.role(person.role)).foregroundStyle(.secondary)
                    }
                }
            }
            if let code = person.safetyCode {
                Section {
                    SafetyCode(code: code)
                } header: {
                    Text("Verify \(first)")
                } footer: {
                    Text(ShareCopy.verify(first))
                }
            }
            if canRemove {
                Section {
                    Button("Remove from Note", role: .destructive) { dismiss(); remove() }
                        .accessibilityIdentifier("share.person.remove")
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle(first)
    }
}

/// Twelve digits in three groups, large enough to read out.
struct SafetyCode: View {
    let code: String
    var body: some View {
        Text(code).font(.title2.monospacedDigit()).frame(maxWidth: .infinity, alignment: .center).textSelection(.enabled)
            .accessibilityIdentifier("share.safetyCode")
    }
}

#if os(macOS)
/// Opens the system share menu (Messages, Mail, AirDrop, Copy Link…) from the view it sits
/// behind, as soon as there's a link to share.
struct SharePickerAnchor: NSViewRepresentable {
    @Binding var url: URL?

    func makeNSView(context: Context) -> NSView { NSView() }

    func updateNSView(_ view: NSView, context: Context) {
        guard let url else { return }
        DispatchQueue.main.async {
            self.url = nil
            guard view.window != nil else { return }
            NSSharingServicePicker(items: [url]).show(relativeTo: view.bounds, of: view, preferredEdge: .minY)
        }
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
            ShareForm(title: note.title, share: share, done: { dismiss() })
        }
        .task {
            // People come and go: keep the list current while the sheet is open.
            while !Task.isCancelled {
                share.refresh()
                // scripts/collab-demo.sh: the owner's sheet sets the link by itself.
                if let auto = CollabDemo.pendingAccess { CollabDemo.pendingAccess = nil; try? await Task.sleep(for: .seconds(1.2)); await share.setAccess(auto) }
                try? await Task.sleep(for: .seconds(0.5))
            }
        }
        .onChange(of: share.left) { _, left in if left { dismiss() } }
        #if os(macOS)
        .frame(minWidth: 420, minHeight: 360)
        #endif
    }
}
