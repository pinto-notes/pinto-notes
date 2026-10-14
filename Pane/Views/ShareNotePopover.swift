#if os(macOS)
import AppKit
import SwiftUI

/// What the share popover offers, and the one line that says what the chosen way does.
enum ShareWays {
    enum Way: String, CaseIterable, Identifiable {
        /// People in the note, editing it together (on when CollabFeature is).
        case people = "Collaborate"
        case link = "Share a Link"
        case copy = "Send a Copy"
        var id: String { rawValue }

        /// Beside Collaborate the labels are shorter, and the public link is what it makes: a web page.
        func label(collaborating: Bool) -> String {
            guard collaborating else { return rawValue }
            switch self {
            case .people: return "Collaborate"
            case .link: return "Web Page"
            case .copy: return "Send Copy"
            }
        }
    }

    static func ways(collaborating: Bool) -> [Way] { collaborating ? [.people, .link, .copy] : [.link, .copy] }

    /// A link when links can be made (signed in, sharing set up), else a copy.
    static func initial(linkAvailable: Bool) -> Way { linkAvailable ? .link : .copy }

    /// With collaboration: Collaborate, unless the note only has a web page.
    static func initial(collaborating: Bool, inNote people: Int, linkOn: Bool, webShared: Bool, linkAvailable: Bool) -> Way {
        guard collaborating else { return initial(linkAvailable: linkAvailable) }
        if people > 1 || linkOn { return .people }
        return webShared ? .link : .people
    }

    /// What the chosen way does, in one line. A shared link publishes a readable copy until it is stopped.
    static func line(_ way: Way, shared: Bool, trashed: Bool = false) -> String {
        switch way {
        case .people: ShareCopy.privacy
        case .link where trashed: "The page is down while this note is in Recently Deleted."
        case .link where shared: "Anyone with the link can read this note on the web. Stop sharing to take the page down."
        case .link: "Makes a web page of this note that anyone with the link can read, until you stop sharing."
        case .copy: "Sends the note as it is now. Later changes aren't sent."
        }
    }
}

/// The toolbar's Share, like Notes': the note and the app at the top, a choice between sharing a
/// link and sending a copy with a line saying what that does, then what there is to do. For a
/// link: make it, or (once shared) copy it, open the page, include sub-notes, stop sharing. For
/// a copy: the system's share targets with their own icons, and Copy.
struct ShareNotePopover: View {
    let title: String
    /// The note's text, for a copy.
    let text: String
    let store: ShareLinkStore
    var trashed = false
    /// Captures: as if links can be made, whatever the store says.
    var linkAvailable: Bool?
    /// Sharing with people (CollabFeature): who's in the note, its link, Leave.
    var share: ShareController?
    /// Captures: the way it opens on, and the page Collaborate opens on.
    var startingWay: ShareWays.Way?
    var collaboratePage: CollaborateRows.Page?
    let close: () -> Void

    @State private var way: ShareWays.Way?
    static let width: CGFloat = 268
    /// Wide enough for three ways and a person's name beside their role.
    static let collaborateWidth: CGFloat = 312

    private var canLink: Bool { linkAvailable ?? store.isAvailable }
    private var collaborating: Bool { share != nil }
    private var ways: [ShareWays.Way] { ShareWays.ways(collaborating: collaborating) }
    private var chosen: ShareWays.Way {
        way ?? startingWay ?? ShareWays.initial(collaborating: collaborating, inNote: share?.state.people.count ?? 0,
                                                linkOn: (share?.state.access ?? .off) != .off, webShared: shared, linkAvailable: canLink)
    }
    private var shared: Bool { store.state.slug != nil }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // With people sharing, the note's own title is all the naming it needs: not repeated here.
            if !collaborating { header }

            if canLink || collaborating {
                Picker("", selection: Binding(get: { chosen }, set: { way = $0 })) {
                    ForEach(ways) { Text($0.label(collaborating: collaborating)).tag($0) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .padding(.horizontal, 14)
                .padding(.top, collaborating ? 14 : 0)
                .accessibilityIdentifier("share.way")
            }
            if chosen != .people {
                Text(ShareWays.line(chosen, shared: shared, trashed: trashed))
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 8)
                Divider().padding(.horizontal, 12)
            }

            VStack(alignment: .leading, spacing: 0) {
                switch chosen {
                case .people: if let share { CollaborateRows(share: share, startingPage: collaboratePage) }
                case .link: linkRows
                case .copy: copyRows
                }
            }
            .padding(6)
        }
        .frame(width: collaborating ? Self.collaborateWidth : Self.width)
        .accessibilityIdentifier("share.popover")
    }

    private var header: some View {
            HStack(spacing: 10) {
                AppMark(size: 34)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title).font(.system(size: 13, weight: .semibold)).lineLimit(1).truncationMode(.tail)
                    Text("Pinto Notes").font(.system(size: 11)).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 10)
    }

    @ViewBuilder private var linkRows: some View {
        if trashed {
            if shared { row("Stop Sharing", "xmark.circle", id: "share.stop", destructive: true) { Task { await store.stopSharing() } } }
        } else if !shared {
            row("Create Link…", "link", id: "share.create") { _ = store.requestShare() }
                .disabled(store.state.isWorking)
        } else {
            if let url = store.url {
                Text(url.absoluteString.replacingOccurrences(of: "https://", with: ""))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .padding(.horizontal, 10)
                    .padding(.top, 4)
                    .padding(.bottom, 2)
            }
            row("Copy Link", "link", id: "share.copy") { Task { await store.shareAndCopy() } }
            if let url = store.url {
                row("Open Shared Page", "safari", id: "share.open") { NSWorkspace.shared.open(url) }
            }
            row(store.state.includesSubNotes ? "Leave Sub-notes Out" : "Include Sub-notes…", "doc.on.doc", id: "share.subnotes") {
                // Turning sub-notes on makes more public: it asks first. Leaving them out needs no warning.
                if store.state.includesSubNotes { Task { await store.setIncludesSubNotes(false) } } else { store.confirming = .includeSubNotes }
            }
            Divider().padding(.horizontal, 6).padding(.vertical, 4)
            row("Stop Sharing", "xmark.circle", id: "share.stop", destructive: true) { Task { await store.stopSharing() } }
        }
    }

    @ViewBuilder private var copyRows: some View {
        ForEach(ShareTargets.services(for: text), id: \.title) { service in
            Button {
                close()
                service.perform(withItems: [text])
            } label: {
                rowLabel(service.title) { Image(nsImage: service.image).resizable().interpolation(.high).frame(width: 18, height: 18) }
            }
            .buttonStyle(.plain)
        }
        Divider().padding(.horizontal, 6).padding(.vertical, 4)
        row("Copy", "doc.on.doc", id: "share.copyText") {
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(text, forType: .string)
        }
    }

    private func row(_ title: String, _ symbol: String, id: String, destructive: Bool = false, action: @escaping () -> Void) -> some View {
        Button {
            close()
            action()
        } label: {
            rowLabel(title, destructive: destructive) {
                Image(systemName: symbol).font(.system(size: 13)).frame(width: 18)
            }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(id)
    }

    private func rowLabel<Icon: View>(_ title: String, destructive: Bool = false, @ViewBuilder icon: () -> Icon) -> some View {
        HStack(spacing: 8) {
            icon()
            Text(title).font(.system(size: 13))
            Spacer(minLength: 0)
        }
        .foregroundStyle(destructive ? AnyShapeStyle(.red) : AnyShapeStyle(.primary))
        .padding(.horizontal, 8)
        .frame(height: 26)
        .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

/// The system's share targets for a piece of text (AirDrop, Mail, Messages, Notes…), with their
/// own names and icons.
@MainActor
enum ShareTargets {
    /// Captures: fixed targets, so a picture doesn't depend on the Mac it was taken on.
    static var preview: [NSSharingService]?

    static func services(for text: String) -> [NSSharingService] {
        preview ?? (Listing.self as any Lists.Type).services(for: [text])
    }

    private protocol Lists { static func services(for items: [Any]) -> [NSSharingService] }
    private enum Listing: Lists {
        // The picker (NSSharingServicePicker) draws its own menu; this is the one call that
        // gives the targets themselves, to list beside the rest of the popover.
        @available(macOS, deprecated: 13.0)
        static func services(for items: [Any]) -> [NSSharingService] { NSSharingService.sharingServices(forItems: items) }
    }
}

/// The Share button in the note's toolbar: a plain button with a popover, in one group with More.
struct ShareButton: View {
    let note: Note
    let store: ShareLinkStore
    /// Sharing with people, when it's on (CollabFeature).
    var people: ShareBackend?
    /// Open: also from the toolbar's avatars.
    @Binding var showing: Bool

    var body: some View {
        Button { showing.toggle() } label: { Label("Share", systemImage: "square.and.arrow.up") }
            .help("Share")
            .popover(isPresented: $showing, arrowEdge: .bottom) {
                SharePopoverLive(note: note, store: store, people: people) { showing = false }
            }
    }
}

/// The popover with a ShareController that lives as long as it's open, kept current.
private struct SharePopoverLive: View {
    let note: Note
    let store: ShareLinkStore
    let close: () -> Void
    @State private var share: ShareController?

    init(note: Note, store: ShareLinkStore, people: ShareBackend?, close: @escaping () -> Void) {
        self.note = note
        self.store = store
        self.close = close
        _share = State(initialValue: people.map { ShareController(note: note, backend: $0) })
    }

    var body: some View {
        ShareNotePopover(title: note.title, text: note.body, store: store, trashed: note.trashedAt != nil, share: share, close: close)
            .task {
                guard let share else { return }
                while !Task.isCancelled {
                    share.refresh()
                    try? await Task.sleep(for: .seconds(0.5))
                }
            }
            .onChange(of: share?.left) { _, left in if left == true { close() } }
    }
}

/// Collaborate, in the popover: the people in the note (Verify on click, Remove on right-click),
/// then Share Link and what the link lets people do, or Leave for someone else's note. Remove and
/// Leave ask inside the popover, which stays open while they happen; each says when it's done.
struct CollaborateRows: View {
    @Bindable var share: ShareController
    /// Captures: open on a person's safety code.
    var startingPage: Page?

    enum Page: Equatable { case people, verify(UUID) }
    @State private var page: Page?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var shown: Page { page ?? startingPage ?? .people }

    var body: some View {
        Group {
            if let p = share.confirmingRemove {
                confirm(ShareCopy.removeTitle(p), ShareCopy.removeMessage(p), action: "Remove", id: "share.confirmRemove",
                        cancel: { share.confirmingRemove = nil }) { page = .people; Task { await share.confirmRemove() } }
            } else if share.confirmingLeave {
                confirm(ShareCopy.leaveTitle, ShareCopy.leaveMessage, action: "Leave", id: "share.confirmLeave",
                        cancel: { share.confirmingLeave = false }) { Task { await share.confirmLeave() } }
            } else if case .verify(let id) = shown, let p = share.state.people.first(where: { $0.id == id }) {
                verify(p)
            } else {
                people
            }
        }
        .padding(8)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: share.done)
    }

    @ViewBuilder private var people: some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                ForEach(share.state.people) { p in
                    Button { if !p.isMe, p.safetyCode != nil { page = .verify(p.id) } } label: {
                        HStack(spacing: 6) {
                            PersonRow(person: p, removing: share.working == .remove(p.id), size: 24)
                            // Opens their safety code, as the iPhone's row does.
                            if !p.isMe, p.safetyCode != nil {
                                Image(systemName: "chevron.right").font(.system(size: 10, weight: .semibold)).foregroundStyle(.tertiary)
                            }
                        }
                        .font(.system(size: 13))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .contextMenu { if share.isOwner, !p.isMe { Button("Remove from Note", role: .destructive) { share.askRemove(p) } } }
                    .accessibilityIdentifier("share.person")
                }
            }
            if case .removed = share.done { DoneLine(text: ShareController.Done.removed(UUID()).text).font(.system(size: 11)) }
            line(ShareCopy.privacy, problem: false)
            if share.isOwner {
                HStack(spacing: 8) {
                    Text("People with the link").font(.system(size: 13))
                    Spacer(minLength: 0)
                    Picker("People with the link", selection: Binding(get: { share.state.access }, set: { a in Task { await share.setAccess(a) } })) {
                        ForEach(ShareState.Access.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .labelsHidden()
                    .pickerStyle(.menu)
                    .fixedSize()
                    .disabled(share.working != nil)
                    .accessibilityIdentifier("share.access")
                }
                if let problem = share.state.problem { line(problem, problem: true) }
                else if share.done == .linkChanged { DoneLine(text: ShareController.Done.linkChanged.text).font(.system(size: 11)) }
                else { line(ShareCopy.link(share.state), problem: false) }
                Button { Task { await share.shareLink() } } label: {
                    if case .shared = share.done { Label(share.done?.text ?? "", systemImage: "checkmark") }
                    else { Label("Share Link", systemImage: "square.and.arrow.up") }
                }
                .buttonStyle(.amberProminent(.regular, wide: true))
                .amberBusy(share.working == .link)
                .disabled(share.working != nil)
                .background(SharePickerAnchor(url: $share.sharing) { sent, copied in share.shareFinished(sent: sent, copied: copied) })
                .accessibilityIdentifier("share.link")
            } else {
                if let problem = share.state.problem { line(problem, problem: true) }
                Button(role: .destructive) { share.askLeave() } label: { Text("Leave Note").foregroundStyle(.red) }
                    .buttonStyle(.quiet)
                    .amberBusy(share.working == .leave)
                    .disabled(share.working != nil)
                    // The word lines up with the names above it.
                    .padding(.leading, -QuietButtonStyle.inset)
                    .accessibilityIdentifier("share.leave")
            }
        }
    }

    private func line(_ text: String, problem: Bool) -> some View {
        Text(text)
            .font(.system(size: 11))
            .foregroundStyle(problem ? AnyShapeStyle(.red) : AnyShapeStyle(.secondary))
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier(problem ? "share.problem" : "share.line")
    }

    private func verify(_ p: ShareState.Person) -> some View {
        let first = ShareCopy.first(p.name)
        return VStack(alignment: .leading, spacing: 12) {
            Button { page = .people } label: { Label("People", systemImage: "chevron.left") }
                .buttonStyle(.quiet)
                .padding(.leading, -QuietButtonStyle.inset)
                .accessibilityIdentifier("share.back")
            HStack(spacing: 10) {
                PersonAvatar(name: p.name, color: CollabSession.color(for: p.id), size: 36, photo: p.photo, ring: .clear)
                VStack(alignment: .leading, spacing: 1) {
                    Text(p.name).font(.system(size: 13, weight: .semibold))
                    Text(ShareCopy.role(p.role)).font(.system(size: 11)).foregroundStyle(.secondary)
                }
            }
            if let code = p.safetyCode {
                SafetyCode(code: code, alignment: .leading)
                line(p.keyChanged ?? ShareCopy.verify(first), problem: false)
                if p.verified && p.keyChanged == nil || share.done == .verified(p.id) {
                    DoneLine(text: ShareCopy.verifiedLine(first)).font(.system(size: 11))
                } else {
                    Button("They Match") { share.verify(p) }
                        .buttonStyle(.amberProminent(.regular, wide: true))
                        .accessibilityIdentifier("share.verify")
                }
            }
            if share.isOwner {
                Button(role: .destructive) { share.askRemove(p) } label: { Text("Remove from Note").foregroundStyle(.red) }
                    .buttonStyle(.quiet)
                    .padding(.leading, -QuietButtonStyle.inset)
                    .accessibilityIdentifier("share.person.remove")
            }
        }
    }

    /// A question asked in place: the destructive answer is the one primary, in red.
    private func confirm(_ title: String, _ message: String, action: String, id: String, cancel: @escaping () -> Void, go: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 13, weight: .semibold))
            Text(message).font(.system(size: 11)).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            HStack {
                Spacer()
                Button("Cancel", action: cancel).buttonStyle(.quiet).keyboardShortcut(.cancelAction)
                Button(action, role: .destructive, action: go).buttonStyle(.amberProminent).accessibilityIdentifier(id)
            }
            .padding(.top, 4)
        }
    }
}
#endif
