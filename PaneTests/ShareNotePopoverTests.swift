#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The toolbar's Share popover: the way it opens on, what its one line says, and its pictures.
@MainActor @Suite(.serialized) struct ShareNotePopoverTests {
    @Test func itOpensOnALinkWhenLinksCanBeMade() {
        #expect(ShareWays.initial(linkAvailable: true) == .link)
        #expect(ShareWays.initial(linkAvailable: false) == .copy)
    }

    /// The line under the chooser tells the truth: a link publishes a page anyone with it can
    /// read, until sharing is stopped; a copy is the note as it is now. Nothing about working together.
    @Test func theLineSaysWhatTheChosenWayDoes() {
        let fresh = ShareWays.line(.link, shared: false)
        #expect(fresh.contains("anyone with the link can read") && fresh.contains("until you stop sharing"))
        #expect(ShareWays.line(.link, shared: true).contains("Stop sharing"))
        #expect(ShareWays.line(.link, shared: true, trashed: true).contains("Recently Deleted"))
        #expect(ShareWays.line(.copy, shared: false).contains("as it is now"))
        for way in ShareWays.ways(collaborating: false) {
            for shared in [false, true] {
                let line = ShareWays.line(way, shared: shared).lowercased()
                #expect(!line.contains("collaborat") && !line.contains("together") && !line.contains("edit"))
            }
        }
    }

    /// Picture is one of the ways, last; a link that can't be made isn't offered.
    @Test func pictureIsOneOfTheWays() throws {
        #expect(ShareWays.ways(collaborating: true, picture: true) == [.people, .copy, .link, .picture])
        #expect(ShareWays.ways(collaborating: false, picture: true) == [.copy, .link, .picture])
        #expect(ShareWays.ways(collaborating: false, picture: true, linkAvailable: false) == [.copy, .picture])
        #expect(ShareWays.Way.picture.label(collaborating: true) == "Picture")
        let source = try SettingsHomeTests.source("Pane/Views/ShareNotePopover.swift")
        #expect(source.contains(".presentationBackground(Color.card)"), "solid, not see-through")
        #expect(!source.contains(".pickerStyle(.segmented)"), "no accent-filled segments")
        #expect(!source.contains("line(ShareCopy.privacy"), "Collaborate doesn't explain encryption")
        #expect(ShareWays.ways(collaborating: true).firstIndex(of: .copy)! < ShareWays.ways(collaborating: true).firstIndex(of: .link)!, "Send Copy left of Web Page")
        #expect(source.contains(".amberProminent(.compact, wide: true)"), "Share Link isn't oversized")
    }

    /// The popover is narrower (Emil, 8 November 2026: "I dont like how wide this whole thing is"),
    /// and the four ways still fit in it at their full names.
    @Test func theFourWaysFitTheNarrowerPopover() async throws {
        #expect(ShareNotePopover.width <= 320 && ShareNotePopover.collaborateWidth <= 320)
        let font = NSFont.systemFont(ofSize: 12, weight: .medium)
        let names = ShareWays.ways(collaborating: true, picture: true).map { $0.label(collaborating: true) }
        #expect(names == ["Collaborate", "Send Copy", "Web Page", "Picture"])
        let needed = names.map { ($0 as NSString).size(withAttributes: [.font: font]).width + 12 }.reduce(0, +)
        #expect(needed <= ShareNotePopover.collaborateWidth - 36, "the tabs need \(needed) of \(ShareNotePopover.collaborateWidth - 36)")
        let share = await CollabShareSnapshots.controller(CollabShareSnapshots.owner())
        let host = NSHostingView(rootView: ShareNotePopover(title: "Team offsite", text: "Team offsite", store: ShareLinkStore(state: ShareLinkState(phase: .notShared)),
                                                            linkAvailable: true, share: share, startingWay: .people, close: {}))
        #expect(host.fittingSize.width <= 320, "the popover is \(host.fittingSize.width) wide")
    }

    /// The Picture tab shows the picture: its box is the same size before and after the picture
    /// comes, so the popover, sized once as it opens, has room for it (Emil, 8 November 2026: a dot).
    @Test func thePictureTabShowsThePicture() async throws {
        let view = SharePopoverCapture(store: ShareLinkStore(state: ShareLinkState(phase: .notShared)), way: .picture, withPicture: true)
        let host = NSHostingView(rootView: view.background(Color.white))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 600, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        let opened = host.fittingSize
        host.frame = CGRect(origin: .zero, size: opened)
        try await Task.sleep(for: .seconds(2))
        #expect(abs(host.fittingSize.height - opened.height) < 0.5, "it opened \(opened.height) tall, then wanted \(host.fittingSize.height)")
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        // The thumb's box, about the middle of the popover: many colours where a picture is drawn.
        let scale = CGFloat(rep.pixelsWide) / host.bounds.width
        var colours = Set<Int>()
        let below = ShareNotePopover.pictureControls
        let rows = Int((host.bounds.height - NotePictureThumb.height - below) * scale)..<Int((host.bounds.height - below) * scale)
        for y in stride(from: rows.lowerBound, to: rows.upperBound, by: 4) {
            for x in stride(from: Int(20 * scale), to: rep.pixelsWide - Int(20 * scale), by: 4) {
                guard let c = rep.colorAt(x: x, y: y) else { continue }
                colours.insert(Int(c.redComponent * 31) << 10 | Int(c.greenComponent * 31) << 5 | Int(c.blueComponent * 31))
            }
        }
        #expect(colours.count > 40, "the picture is drawn (\(colours.count) colours in its box)")
    }

    /// Web Page shows what the page will look like before the link is made: the note's title and
    /// its first lines, without markdown's marks (Emil, 8 November 2026).
    @Test func webPageShowsAPreview() {
        #expect(WebPagePreview.lines(title: "Dinner Guide", text: SharePopoverCapture.text)
                == ["A plan for Friday: tapas at six, then the walk along the river.", "– Olives and bread", "– Patatas bravas", "– Flan"])
        #expect(WebPagePreview.lines(title: "Other", text: "Notes\n- [ ] Buy milk") == ["Notes", "– Buy milk"])
        // A divider is no line of text (Emil, 8 November 2026: the preview showed "---").
        #expect(WebPagePreview.lines(title: "T", text: "T\nOne\n---\nTwo\n***") == ["One", "Two"])
    }

    /// Before sharing, once shared, and sending a copy; light and dark.
    @Test(arguments: [false, true])
    func pictures(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        ShareTargets.preview = ["Mail", "Messages", "Notes"].compactMap { name in
            // The apps' own icons, as the system's share targets bring: symbols here made the
            // pictures look cruder than the app is (council, 8 November 2026).
            NSSharingService(title: name, image: NSWorkspace.shared.icon(forFile: "/System/Applications/\(name).app"), alternateImage: nil, handler: {})
        }
        defer { ShareTargets.preview = nil }
        func popover(_ state: ShareLinkState, _ way: ShareWays.Way) -> some View {
            let store = ShareLinkStore(state: state)
            store.baseURL = URL(string: "https://pintonotes.com/s/")
            return SharePopoverCapture(store: store, way: way).tint(Color(PColor.paneAccent))
        }
        try await AppSnapshotTests.render(popover(ShareLinkState(phase: .notShared), .link), name: "mac-look-share-link-\(mode)", dark: dark)
        try await AppSnapshotTests.render(popover(ShareLinkState(phase: .shared(slug: "k3v9-dinner-guide", includesSubNotes: false)), .link), name: "mac-look-share-shared-\(mode)", dark: dark)
        try await AppSnapshotTests.render(popover(ShareLinkState(phase: .notShared), .copy), name: "mac-look-share-copy-\(mode)", dark: dark)
        // All four ways, as with Collaborate on, each tab.
        let share = await CollabShareSnapshots.controller(CollabShareSnapshots.owner(.off))
        for way in [ShareWays.Way.people, .copy, .link, .picture] {
            let view = ShareNotePopover(title: "Dinner Guide", text: SharePopoverCapture.text, store: ShareLinkStore(state: ShareLinkState(phase: .notShared)),
                                        linkAvailable: true, share: share, startingWay: way, picture: {},
                                        pictureRequest: { NotePicture.Request(title: "Dinner Guide", passage: NotePicture.passage(in: SharePopoverCapture.text, selection: nil)) }, close: {})
                .tint(Color(PColor.paneAccent))
            let rep = try await Self.drawn(view, dark: dark, refit: false)
            try #require(rep.representation(using: .png, properties: [:])).write(to: AppSnapshotTests.dir!.appending(path: "mac-look-share-four-\(way.rawValue)-\(mode).png"))
        }
        // The picture tab, sized as a popover sizes it: once, after its picture has come.
        let picture = SharePopoverCapture(store: ShareLinkStore(state: ShareLinkState(phase: .notShared)), way: .picture, withPicture: true).tint(Color(PColor.paneAccent))
        let rep = try await Self.drawn(picture, dark: dark)
        try #require(rep.representation(using: .png, properties: [:])).write(to: AppSnapshotTests.dir!.appending(path: "mac-look-share-picture-\(mode).png"))
    }

    /// Draws the popover as AppKit sizes a popover: to its fitting size, after `wait`.
    static func drawn(_ view: some View, dark: Bool, wait: Double = 2, refit: Bool = true) async throws -> NSBitmapImageRep {
        let host = NSHostingView(rootView: view.background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 600, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        try? await Task.sleep(for: .seconds(wait))
        if refit {
            host.frame = CGRect(origin: .zero, size: host.fittingSize)
            window.setContentSize(host.fittingSize)
        }
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        return rep
    }
}

private struct SharePopoverCapture: View {
    let store: ShareLinkStore
    let way: ShareWays.Way
    var withPicture = false
    static let text = "Dinner Guide\n\nA plan for Friday: tapas at six, then the walk along the river.\n\n- Olives and bread\n- Patatas bravas\n- Flan"
    var body: some View {
        ShareNotePopover(title: "Dinner Guide", text: Self.text, store: store, linkAvailable: true, startingWay: way,
                         picture: withPicture ? {} : nil,
                         pictureRequest: withPicture ? { NotePicture.Request(title: "Dinner Guide", passage: NotePicture.passage(in: Self.text, selection: nil)) } : nil,
                         close: {})
    }
}
#endif
