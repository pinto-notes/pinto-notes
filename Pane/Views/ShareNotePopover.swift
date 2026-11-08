#if os(macOS)
import AppKit
import UniformTypeIdentifiers
import SwiftUI

/// What the share popover offers, and the one line that says what the chosen way does.
enum ShareWays {
    enum Way: String, CaseIterable, Identifiable {
        /// People in the note, editing it together (on when CollabFeature is).
        case people = "Collaborate"
        case link = "Share a Link"
        case copy = "Send a Copy"
        /// A picture of the note, to post or send (it was a row under the others).
        case picture = "Picture"
        var id: String { rawValue }

        /// The same short names in every popover, with or without Collaborate: what a tab is called
        /// doesn't change with what the note can do (council, 8 November 2026).
        func label(collaborating: Bool) -> String {
            switch self {
            case .people: return "Collaborate"
            case .link: return "Web Page"
            case .copy: return "Send Copy"
            case .picture: return "Picture"
            }
        }
    }

    /// `sharedWithPeople`: the note's text is everyone's in it, so it gets no web page; one made
    /// before it was shared (`webShared`) is still listed, to open or stop.
    static func ways(collaborating: Bool, sharedWithPeople: Bool = false, webShared: Bool = false, picture: Bool = false, linkAvailable: Bool = true) -> [Way] {
        var ways: [Way] = collaborating
            ? (sharedWithPeople && !webShared ? [.people, .copy] : [.people, .copy, .link])
            : (linkAvailable ? [.copy, .link] : [.copy])
        if picture { ways.append(.picture) }
        return ways
    }

    /// A link when links can be made (signed in, sharing set up), else a copy.
    static func initial(linkAvailable: Bool) -> Way { linkAvailable ? .link : .copy }

    /// With collaboration: Collaborate, unless the note only has a web page, or can't be shared
    /// with people yet (it has files or an app: `canCollaborate` false).
    static func initial(collaborating: Bool, inNote people: Int, linkOn: Bool, webShared: Bool, linkAvailable: Bool, canCollaborate: Bool = true) -> Way {
        guard collaborating else { return initial(linkAvailable: linkAvailable) }
        if people > 1 || linkOn { return .people }
        if !canCollaborate { return initial(linkAvailable: linkAvailable) }
        return webShared ? .link : .people
    }

    /// What the chosen way does, in one line. A shared link publishes a readable copy until it is stopped.
    static func line(_ way: Way, shared: Bool, trashed: Bool = false, sharedWithPeople: Bool = false) -> String {
        switch way {
        case .people: ShareCopy.privacy
        case .link where sharedWithPeople && !trashed: SharedNoteLimits.pageLine
        case .link where trashed: "The page is down while this note is in Recently Deleted."
        case .link where shared: "Anyone with the link can read this note on the web. Stop sharing to take the page down."
        case .link: "Makes a web page of this note that anyone with the link can read, until you stop sharing."
        case .copy: "Sends the note as it is now. Later changes aren't sent."
        case .picture: "A picture of the note, to post or send."
        }
    }
}

/// The toolbar's Share, like Notes': the note and the app at the top, a choice between sharing a
/// link and sending a copy with a line saying what that does, then what there is to do. For a
/// link: make it, or (once shared) copy it, open the page, stop sharing. For
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
    /// Share as Picture: opens the sheet with every choice.
    var picture: (() -> Void)?
    /// What the Picture tab shows. Without it there's no tab.
    var pictureRequest: (() -> NotePicture.Request?)?
    let close: () -> Void

    @State private var way: ShareWays.Way?
    @State private var pictureImage: CGImage?
    @State private var pictureCopied = false
    /// Narrower than it was (340, and 360 with Collaborate): Emil, 8 November 2026, "I dont like how
    /// wide this whole thing is". Four ways still fit, each tab as wide as its name.
    static let width: CGFloat = 316
    static let collaborateWidth: CGFloat = width

    private var canLink: Bool { linkAvailable ?? store.isAvailable }
    private var collaborating: Bool { share != nil }
    /// The note is shared with people: no web page of it is made (SharedNoteLimits).
    private var sharedWithPeople: Bool { share?.note.isShared == true }
    private var ways: [ShareWays.Way] { ShareWays.ways(collaborating: collaborating, sharedWithPeople: sharedWithPeople, webShared: shared, picture: hasPicture, linkAvailable: canLink) }
    private var hasPicture: Bool { pictureRequest != nil && !trashed }
    private var chosen: ShareWays.Way {
        let way = way ?? startingWay ?? ShareWays.initial(collaborating: collaborating, inNote: share?.state.people.count ?? 0,
                                                          linkOn: (share?.state.access ?? .off) != .off, webShared: shared, linkAvailable: canLink,
                                                          canCollaborate: share?.notYet == nil)
        return ways.contains(way) ? way : (ways.first ?? .copy)
    }
    private var shared: Bool { store.state.slug != nil }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // No header in either popover: the note is open behind it (council, 8 November 2026:
            // the two-way popover had one and the four-way didn't).

            if ways.count > 1 {
                ShareTabs(ways: ways, chosen: chosen, collaborating: collaborating) { way = $0 }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
            }
            // Every tab the same way down: a line on what it does, a hairline, its content, its button
            // (council, 8 November 2026: Collaborate had no line and started higher).
            do {
                Text(chosen == .people ? ShareCopy.collaborate : ShareWays.line(chosen, shared: shared, trashed: trashed, sharedWithPeople: sharedWithPeople))
                    .font(.system(size: 12))
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    .padding(.bottom, 10)
                Rectangle().fill(Color.line).frame(height: 1).padding(.horizontal, 16)
            }

            VStack(alignment: .leading, spacing: 0) {
                switch chosen {
                case .people: if let share { CollaborateRows(share: share, startingPage: collaboratePage) }
                case .link: linkRows
                case .copy: copyRows
                case .picture: pictureRows
                }
            }
            // The rows' words, previews and buttons all start 16 pt in, as the line above them does
            // (council, 8 November 2026: margins drifted between 10 and 27 pt).
            .padding(.horizontal, 8)
            .padding(.top, 6)
            .padding(.bottom, chosen == .people ? 8 : 14)
        }
        .frame(width: collaborating ? Self.collaborateWidth : Self.width)
        // Solid, as the app's cards are: the system's glass let the window behind show through its
        // words (Emil, 7 November 2026).
        .presentationBackground(Color.card)
        .accessibilityIdentifier("share.popover")
    }

    @ViewBuilder private var linkRows: some View {
        if trashed {
            if shared { row("Stop Sharing", "xmark.circle", id: "share.stop", destructive: true) { Task { await store.stopSharing() } } }
        } else if sharedWithPeople {
            // A page from before the note was shared with people: open it or stop it. Copy Link would
            // publish the note again, and its text is everyone's now.
            if shared {
                if let url = store.url { row("Open Web Page", "safari", id: "share.open") { NSWorkspace.shared.open(url) } }
                row("Stop Sharing", "xmark.circle", id: "share.stop", destructive: true) { Task { await store.stopSharing() } }
            }
        } else if !shared {
            WebPagePreview(title: title, text: text)
                .padding(.horizontal, 8).padding(.top, 6).padding(.bottom, 12)
            // One filled button per tab, the tab's main action, as Collaborate has.
            primary("Publish Web Page…", "globe", id: "share.create", busy: store.state.isWorking) { close(); _ = store.requestShare() }
        } else {
            if let url = store.url {
                // The address in a field, as a link is shown to be copied: not grey code (council,
                // 8 November 2026). Selectable; Copy Link copies all of it.
                Text(url.absoluteString.replacingOccurrences(of: "https://", with: ""))
                    .font(.system(size: 12))
                    .foregroundStyle(Color.ink)
                    .textSelection(.enabled)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .padding(.horizontal, 8)
                    .frame(maxWidth: .infinity, minHeight: 26, alignment: .leading)
                    .background(Color(nsColor: .textBackgroundColor), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
                    .padding(.horizontal, 8)
                    .padding(.top, 6)
                    .padding(.bottom, 10)
            }
            primary("Copy Link", "link", id: "share.copy") { close(); Task { await store.shareAndCopy() } }
                .padding(.bottom, 6)
            if let url = store.url {
                row("Open Web Page", "safari", id: "share.open") { NSWorkspace.shared.open(url) }
            }
            Divider().padding(.horizontal, 8).padding(.vertical, 4)
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
        Divider().padding(.horizontal, 8).padding(.vertical, 4)
        row("Copy as Text", "doc.on.doc", id: "share.copyText") {
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(text, forType: .string)
        }
    }

    /// What sits under the picture: the backgrounds, then the buttons.
    static let pictureControls: CGFloat = 86

    @ViewBuilder private var pictureRows: some View {
        if let request = pictureRequest?() {
            NotePictureThumb(request: request, image: $pictureImage).padding(.horizontal, 8).padding(.top, 6).padding(.bottom, 10)
            // The background is chosen here, under the picture, not behind a menu row
            // (council, 8 November 2026: one row held copy, save and the background).
            PictureBackgrounds().padding(.horizontal, 8).padding(.bottom, 12)
        }
        HStack(spacing: 8) {
            Button { copyPicture() } label: {
                // Words only: three buttons share the width, and an icon cut "Copy Picture" short.
                if pictureCopied { Label("Copied", systemImage: "checkmark") } else { Text("Copy Picture") }
            }
            .buttonStyle(.amberProminent(.compact, wide: true))
            .disabled(pictureImage == nil)
            .accessibilityIdentifier("share.copyPicture")
            // Save in plain sight, not behind Share (council, 8 November 2026).
            Button("Save…") { savePicture() }
                .buttonStyle(.secondary(.compact))
                .fixedSize()
                .disabled(pictureImage == nil)
                .accessibilityIdentifier("share.savePicture")
            if let picture {
                Button("Share…") { close(); picture() }
                    .buttonStyle(.secondary(.compact))
                    .fixedSize()
                    .accessibilityIdentifier("share.picture")
            }
        }
        .padding(.horizontal, 8)
    }

    private func savePicture() {
        guard let pictureImage else { return }
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.png]
        panel.nameFieldStringValue = NotePicture.filename(title: title)
        close()
        panel.begin { response in
            guard response == .OK, let url = panel.url else { return }
            Task { _ = await NotePictureSheet.write(pictureImage, to: url) }
        }
    }

    private func copyPicture() {
        guard let pictureImage else { return }
        NSPasteboard.general.clearContents()
        NSPasteboard.general.writeObjects([NSImage(cgImage: pictureImage, size: .zero)])
        pictureCopied = true
        Task { try? await Task.sleep(for: .seconds(1.6)); pictureCopied = false }
    }

    /// The tab's main action: a full-width filled button, the same on every tab that has one.
    private func primary(_ title: String, _ symbol: String, id: String, busy: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) { Label(title, systemImage: symbol) }
            .buttonStyle(.amberProminent(.compact, wide: true))
            .amberBusy(busy)
            .disabled(busy)
            .padding(.horizontal, 8)
            .accessibilityIdentifier(id)
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

/// The ways to share, as tabs: the chosen one on a soft pill, the app's neutral selection, not the
/// system's segmented control in the accent.
private struct ShareTabs: View {
    let ways: [ShareWays.Way]
    let chosen: ShareWays.Way
    let collaborating: Bool
    let choose: (ShareWays.Way) -> Void

    var body: some View {
        // Each tab as wide as its name, the room left shared out between them: four equal tabs
        // needed the popover 360 wide for "Collaborate" to fit.
        // On a track, as a segmented control is, so the tabs read as one control and not grey
        // words; it runs margin to margin like everything under it (council, 8 November 2026).
        HStack(spacing: 0) {
            ForEach(ways) { way in
                ShareTab(title: way.label(collaborating: collaborating), on: way == chosen) { choose(way) }
            }
        }
        .padding(2)
        .background(Color.soft, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("share.way")
    }
}

private struct ShareTab: View {
    /// The chosen tab's pill: the app's soft fill was 1.1:1 on the card, hard to see (council,
    /// 8 November 2026).
    static let chosen = Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.36, alpha: 1) : .white })
    let title: String
    let on: Bool
    let action: () -> Void
    @State private var hovering = false

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 6, style: .continuous)
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(on || hovering ? Color.ink : Color.muted)
                .lineLimit(1)
                .fixedSize()
                .padding(.horizontal, 6)
                .frame(maxWidth: .infinity, minHeight: 24)
                .background {
                    if on { shape.fill(Self.chosen).shadow(color: .black.opacity(0.12), radius: 1, y: 0.5) }
                    else if hovering { shape.fill(Hover.row) }
                }
                .contentShape(shape)
        }
        .buttonStyle(.plain)
        .modifier(HoverTracking(hovering: $hovering))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// What the web page will look like, small: a browser's bar with the page's address, then the note's
/// title and its first lines on a page (Emil, 8 November 2026: "a small at least fake preview of
/// the website"). Drawn, not loaded: there is no page until the link is made.
struct WebPagePreview: View {
    let title: String
    let text: String
    static let height: CGFloat = 116

    /// The lines under the title: the note's first few, its first line left out when it is the title.
    static func lines(title: String, text: String) -> [String] {
        var lines = text.split(separator: "\n", omittingEmptySubsequences: true).map { $0.trimmingCharacters(in: .whitespaces) }
        if let first = lines.first, first == title.trimmingCharacters(in: .whitespaces) { lines.removeFirst() }
        // A divider's "---" is no line of text (Emil, 8 November 2026: it showed as "---").
        let dividers: Set<Character> = ["-", "*", "_", " "]
        lines.removeAll { $0.count >= 3 && $0.allSatisfy(dividers.contains) }
        return Array(lines.filter { !$0.isEmpty }.prefix(4)).map { line in
            // Markdown's list and heading marks read as clutter at this size.
            // List items keep a bullet, as the page draws them (council, 8 November 2026).
            for mark in ["- [ ] ", "- [x] ", "- ", "* "] where line.hasPrefix(mark) { return "\u{2013} " + line.dropFirst(mark.count) }
            for mark in ["# ", "## ", "### "] where line.hasPrefix(mark) { return String(line.dropFirst(mark.count)) }
            return line
        }
    }

    var body: some View {
        // A calm tray with a small browser window in it, drawn in the current appearance: the
        // tinted stage and a white page in dark mode were louder than the action (council,
        // 8 November 2026), and Emil found the plain one blended in. The tray sets it apart.
        // One window, full width, with a hairline and a soft shadow so it stands off the card: no
        // grey well around it (council, 8 November 2026: a box in a box).
        browser
            .frame(height: Self.height)
            .shadow(color: .black.opacity(0.08), radius: 6, y: 2)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("A preview of the web page")
            .accessibilityIdentifier("share.webPreview")
    }

    private var browser: some View {
        let shape = RoundedRectangle(cornerRadius: 10, style: .continuous)
        let name = title.trimmingCharacters(in: .whitespaces).isEmpty ? "New note" : title
        return VStack(spacing: 0) {
            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { _ in Circle().fill(Color.primary.opacity(0.16)).frame(width: 6, height: 6) }
                Spacer(minLength: 8)
                Text("pintonotes.com/s/\u{2026}")
                    .font(.system(size: 9.5))
                    .foregroundStyle(Color.muted)
                    .lineLimit(1)
                    .padding(.horizontal, 10).frame(height: 16)
                    .background(Capsule().fill(Color.primary.opacity(0.06)))
                Spacer(minLength: 8)
                Color.clear.frame(width: 26, height: 6)
            }
            .padding(.horizontal, 8)
            .frame(height: 22)
            Rectangle().fill(Color.line).frame(height: 1)
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                ForEach(Array(Self.lines(title: title, text: text).prefix(4).enumerated()), id: \.offset) { _, line in
                    Text(line).font(.system(size: 9.5)).foregroundStyle(Color.muted).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .clipped()
            .background(Color.card)
        }
        .background(Color.soft)
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color.primary.opacity(0.14), lineWidth: 0.5))
    }
}

/// The picture's backgrounds, small and round, under the picture: the chosen one ringed. The same
/// choice the picture sheet keeps.
struct PictureBackgrounds: View {
    @Environment(\.colorScheme) private var colorScheme
    @AppStorage("notePicture.background") private var storedBackground = ""

    var body: some View {
        let chosen = NotePicture.Background(rawValue: storedBackground) ?? (colorScheme == .dark ? .dusk : .hills)
        HStack(spacing: 4) {
            Text("Background").font(.system(size: 12)).foregroundStyle(Color.muted)
            Spacer(minLength: 4)
            ForEach(NotePicture.Background.allCases) { b in
                Button { storedBackground = b.rawValue } label: {
                    swatch(b)
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                        .overlay(Circle().strokeBorder(Color.primary.opacity(0.22), lineWidth: 1))
                        .padding(3)
                        .overlay { if b == chosen { Circle().strokeBorder(Color.ink, lineWidth: 2) } }
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .hoverHighlight(Circle())
                .accessibilityLabel(b.name)
                .accessibilityAddTraits(b == chosen ? .isSelected : [])
                .help(b.name)
            }
        }
        .padding(.trailing, -3)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("share.pictureBackgrounds")
    }

    @ViewBuilder private func swatch(_ b: NotePicture.Background) -> some View {
        if let asset = b.asset {
            Image(asset).resizable().scaledToFill()
        } else {
            let c = b.plain
            Color(red: Double((c >> 16) & 0xFF) / 255, green: Double((c >> 8) & 0xFF) / 255, blue: Double(c & 0xFF) / 255)
        }
    }
}

/// The note as a picture, with the look last chosen: what the Picture tab opens on.
struct NotePictureThumb: View {
    /// Tall enough that the picture fills the popover's width, as the web page preview does.
    static let height: CGFloat = 200
    let request: NotePicture.Request
    /// The picture once drawn, for Copy Picture.
    var image: Binding<CGImage?>? = nil
    @Environment(\.colorScheme) private var colorScheme
    @AppStorage("notePicture.background") private var storedBackground = ""
    @AppStorage("notePicture.showsMark") private var showsMark = true
    @State private var drawn: CGImage?

    var body: some View {
        let dark = colorScheme == .dark
        let look = NotePicture.Look(background: NotePicture.Background(rawValue: storedBackground) ?? (dark ? .dusk : .hills), dark: dark, showsMark: showsMark)
        // One fixed box, the picture or its spinner: a popover is sized once, as it opens, and the
        // picture came after and was squeezed into the spinner's room, a dot (Emil, 8 November 2026).
        ZStack {
            if let drawn {
                Image(decorative: drawn, scale: 1).resizable().interpolation(.high).scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .accessibilityLabel("A picture of the note")
            } else {
                ProgressView().controlSize(.small)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: Self.height)
        .task(id: look.key) {
            if let app = request.app {
                let shot = await NotePageLive.snapshot(app, dark: look.dark)
                guard !Task.isCancelled else { return }
                drawn = shot.flatMap { NotePicture.render(app: $0, look: look) }?.image
            } else {
                let apps = await NotePageLive.embedded(in: request.passage.text, dark: look.dark)
                guard !Task.isCancelled else { return }
                drawn = NotePicture.render(request, look: look, apps: apps)?.image
            }
        }
        .onChange(of: drawn) { _, new in image?.wrappedValue = new }
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
    var picture: (() -> Void)?
    var pictureRequest: (() -> NotePicture.Request?)?

    var body: some View {
        Button { showing.toggle() } label: { Label("Share", systemImage: "square.and.arrow.up") }
            .help("Share")
            .popover(isPresented: $showing, arrowEdge: .bottom) {
                SharePopoverLive(note: note, store: store, people: people, picture: picture, pictureRequest: pictureRequest) { showing = false }
            }
    }
}

/// The popover with a ShareController that lives as long as it's open, kept current.
private struct SharePopoverLive: View {
    let note: Note
    let store: ShareLinkStore
    var picture: (() -> Void)?
    var pictureRequest: (() -> NotePicture.Request?)?
    let close: () -> Void
    @State private var share: ShareController?

    init(note: Note, store: ShareLinkStore, people: ShareBackend?, picture: (() -> Void)? = nil, pictureRequest: (() -> NotePicture.Request?)? = nil, close: @escaping () -> Void) {
        self.note = note
        self.store = store
        self.picture = picture
        self.pictureRequest = pictureRequest
        self.close = close
        _share = State(initialValue: people.map { ShareController(note: note, backend: $0) })
    }

    var body: some View {
        ShareNotePopover(title: note.title, text: note.body, store: store, trashed: note.trashedAt != nil, share: share, picture: picture, pictureRequest: pictureRequest, close: close)
            .task {
                guard let share else { return }
                ShareController.current = share
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
    @State private var accessHover = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var shown: Page { page ?? startingPage ?? .people }

    var body: some View {
        Group {
            if let p = share.confirmingRemove {
                confirm(ShareCopy.removeTitle(p), ShareCopy.removeMessage(p), action: "Remove", id: "share.confirmRemove",
                        cancel: { share.confirmingRemove = nil }) { page = .people; Task { await share.confirmRemove() } }
            } else if share.confirmingLeave {
                confirm(ShareCopy.leaveTitle(share.note.title), ShareCopy.leaveMessage, action: "Leave", id: "share.confirmLeave",
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
                    let opens = !p.isMe && p.safetyCode != nil
                    let row = HStack(spacing: 5) {
                        PersonRow(person: p, removing: share.working == .remove(p.id), size: 24)
                        // A pop-up, as Anyone with the link is: a chevron read as navigation
                        // (council, 8 November 2026). Rows without one keep its room, so every
                        // role lines up.
                        Image(systemName: "chevron.up.chevron.down").font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(Color.muted)
                            .opacity(opens ? 1 : 0)
                    }
                    .font(.system(size: 13))
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .contentShape(Rectangle())
                    Group {
                        if opens {
                            // A light wash under the pointer, as every clickable row has.
                            Menu {
                                Button("Check Safety Code…") { page = .verify(p.id) }
                                if share.isOwner { Divider(); Button("Remove from Note", role: .destructive) { share.askRemove(p) } }
                            } label: { row }
                            .menuStyle(.button)
                            .menuIndicator(.hidden)
                            .buttonStyle(.tile(radius: 6))
                        } else {
                            row
                        }
                    }
                    .padding(.horizontal, -4)
                    .contextMenu { if share.isOwner, !p.isMe { DestructiveMenuButton("Remove from Note", systemImage: "person.badge.minus") { share.askRemove(p) } } }
                    .accessibilityIdentifier("share.person")
                }
            }
            if case .removed = share.done { DoneLine(text: ShareController.Done.removed(UUID()).text).font(.system(size: 11)) }
            if share.isOwner, let why = share.notYet {
                // Files or an app: not shared with people yet, and the popover says why up front.
                line(why, problem: false)
            } else if share.isOwner {
                HStack(spacing: 8) {
                    Text("Anyone with the link").font(.system(size: 13))
                    Spacer(minLength: 0)
                    // A neutral menu: the system's took the accent, loud for a setting left at Off.
                    Menu {
                        Picker("Anyone with the link", selection: Binding(get: { share.state.access }, set: { a in Task { await share.setAccess(a) } })) {
                            ForEach(ShareState.Access.allCases) { Text($0.rawValue).tag($0) }
                        }
                        .pickerStyle(.inline)
                        .labelsHidden()
                    } label: {
                        HStack(spacing: 5) {
                            Text(share.state.access.rawValue).font(.system(size: 12, weight: .medium))
                            Image(systemName: "chevron.up.chevron.down").font(.system(size: 9, weight: .semibold)).foregroundStyle(Color.muted)
                        }
                        .foregroundStyle(Color.ink)
                        // Borderless, as the people's pop-ups above it are.
                        .padding(.horizontal, 6)
                        .frame(height: 24)
                        .background { if accessHover { RoundedRectangle(cornerRadius: 6, style: .continuous).fill(Hover.row) } }
                        .padding(.trailing, -6)
                    }
                    .menuStyle(.button)
                    .buttonStyle(.plain)
                    .menuIndicator(.hidden)
                    .modifier(HoverTracking(hovering: $accessHover))
                    .fixedSize()
                    .disabled(share.working != nil)
                    .accessibilityLabel("Anyone with the link: \(share.state.access.rawValue)")
                    .accessibilityIdentifier("share.access")
                }
                if let problem = share.state.problem { line(problem, problem: true) }
                else if share.done == .linkChanged { DoneLine(text: ShareController.Done.linkChanged.text).font(.system(size: 11)) }
                else { line(ShareCopy.link(share.state), problem: false) }
                Button { Task { await share.shareLink() } } label: {
                    if case .shared = share.done { Label(share.done?.text ?? "", systemImage: "checkmark") }
                    else { Label("Invite People…", systemImage: "person.badge.plus") }
                }
                .buttonStyle(.amberProminent(.compact, wide: true))
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
            .font(.system(size: 12))
            .foregroundStyle(problem ? AnyShapeStyle(.red) : AnyShapeStyle(Color.muted))
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
                    HStack {
                        Spacer()
                        // A regular push button on the Mac; full width only on iPhone.
                        Button("They Match") { share.verify(p) }
                            .buttonStyle(.amberProminent)
                            .accessibilityIdentifier("share.verify")
                    }
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

    /// A question asked in place, as an alert would: Cancel is the default (Return and Esc), and the
    /// destructive answer is a plain button in red, never a red fill (HIG).
    private func confirm(_ title: String, _ message: String, action: String, id: String, cancel: @escaping () -> Void, go: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 13, weight: .semibold))
            Text(message).font(.system(size: 11)).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            HStack {
                Spacer()
                Button(role: .destructive, action: go) { Text(action).foregroundStyle(.red) }
                    .buttonStyle(.quiet)
                    .accessibilityIdentifier(id)
                Button("Cancel", action: cancel)
                    .buttonStyle(.amberProminent)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("share.cancel")
                // Esc cancels too.
                Button("", action: cancel).keyboardShortcut(.cancelAction).hidden().frame(width: 0, height: 0)
            }
            .padding(.top, 4)
        }
    }
}
#endif
