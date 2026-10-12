#if os(macOS)
import AppKit
import SwiftUI

/// What the share popover offers, and the one line that says what the chosen way does.
enum ShareWays {
    enum Way: String, CaseIterable, Identifiable {
        case link = "Share a Link"
        case copy = "Send a Copy"
        var id: String { rawValue }
    }

    /// A link when links can be made (signed in, sharing set up), else a copy.
    static func initial(linkAvailable: Bool) -> Way { linkAvailable ? .link : .copy }

    /// What the chosen way does, in one line. A shared link publishes a readable copy until it is stopped.
    static func line(_ way: Way, shared: Bool, trashed: Bool = false) -> String {
        switch way {
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
    /// The people sheet of collaboration, only where that prototype is on.
    var people: (() -> Void)?
    /// Captures: the way it opens on.
    var startingWay: ShareWays.Way?
    let close: () -> Void

    @State private var way: ShareWays.Way?
    static let width: CGFloat = 268

    private var canLink: Bool { linkAvailable ?? store.isAvailable }
    private var chosen: ShareWays.Way { way ?? startingWay ?? ShareWays.initial(linkAvailable: canLink) }
    private var shared: Bool { store.state.slug != nil }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
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

            if canLink {
                Picker("", selection: Binding(get: { chosen }, set: { way = $0 })) {
                    ForEach(ShareWays.Way.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .padding(.horizontal, 14)
                .accessibilityIdentifier("share.way")
            }
            Text(ShareWays.line(chosen, shared: shared, trashed: trashed))
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 8)
            Divider().padding(.horizontal, 12)

            VStack(alignment: .leading, spacing: 0) {
                switch chosen {
                case .link: linkRows
                case .copy: copyRows
                }
            }
            .padding(6)
        }
        .frame(width: Self.width)
        .accessibilityIdentifier("share.popover")
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
        if let people {
            Divider().padding(.horizontal, 6).padding(.vertical, 4)
            row("Share…", "person.crop.circle.badge.plus", id: "collab.share", action: people)
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
    var people: (() -> Void)?
    @State private var showing = false

    var body: some View {
        Button { showing.toggle() } label: { Label("Share", systemImage: "square.and.arrow.up") }
            .help("Share")
            .popover(isPresented: $showing, arrowEdge: .bottom) {
                ShareNotePopover(title: note.title, text: note.body, store: store, trashed: note.trashedAt != nil, people: people) { showing = false }
            }
    }
}
#endif
