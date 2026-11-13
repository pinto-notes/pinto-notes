#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Covers and icons in the real app window (NoteCover): a note with neither and the pointer on its
/// title (Add Icon, Add Cover), and notes with both, the list showing their photos. Borderless,
/// far off screen, never ordered in; drawn with cacheDisplay, the editor's lines by their layout
/// fragments. Runs only with NOTE_COVER_SHOTS set:
/// `TEST_RUNNER_NOTE_COVER_SHOTS=/dir TEST_RUNNER_NOTE_COVER_PHOTOS=/photos scripts/qa-test.sh PaneTests/NoteCoverShots`
@MainActor @Suite(.serialized) struct NoteCoverShots {
    static let recipes: [(icon: String, photo: String, body: String)] = [
        ("🍋", "pasta", "Lemon pasta\n\n20 min. Serves 4.\n\n## Ingredients\n\n- [x] 400 g spaghetti\n- [x] 2 lemons, zest and juice\n- [ ] 60 g butter\n- [ ] 80 g parmesan, finely grated\n\n## Method\n\n1. Boil the spaghetti in well salted water. Keep a cup of the water.\n2. Melt the butter in a wide pan with the lemon zest.\n3. Toss the pasta in with a splash of the water.\n"),
        ("🥐", "kanelbullar", "Mormor's kanelbullar\n\nFor Sunday fika. Makes 24.\n"),
        ("🍲", "meatballs", "Mormor's meatballs\n\nFrom Greta, 1974.\n"),
        ("🍳", "shakshuka", "Shakshuka\n\nEggs in spicy tomato, for two.\n"),
        ("🌮", "tacos", "Fish tacos\n\nCod, pickled onion, lime.\n"),
    ]

    static func library(photos: URL, covers: Bool) throws -> (ModelContainer, Folder) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = ctx.createFolder(named: "Recipes")
        for (i, r) in recipes.enumerated() {
            var body = r.body
            if covers, let file = try? FileStore.importFile(at: photos.appending(path: "\(r.photo).png")) {
                ctx.insert(file)
                body = NoteCover.setting(NoteCover.line(id: file.id, filename: file.filename), in: r.icon + " " + body)
            }
            let note = ctx.createNote(in: .folder(folder.id), body: body)
            note.updatedAt = .now.addingTimeInterval(Double(-i) * 3600)
        }
        try ctx.save()
        return (c, folder)
    }

    static func draw(_ host: NSView, to url: URL) throws {
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        if let tv = MacWindowChromeTests.find(PaneTextView.self, in: host), let tlm = tv.textLayoutManager, let ctx = NSGraphicsContext(bitmapImageRep: rep) {
            tlm.ensureLayout(for: tlm.documentRange)
            let saved = NSGraphicsContext.current
            NSGraphicsContext.current = ctx
            let cg = ctx.cgContext
            let visible = tv.visibleRect
            let r = tv.convert(visible, to: nil)
            cg.saveGState()
            cg.clip(to: r)
            cg.translateBy(x: r.minX, y: r.maxY)
            cg.scaleBy(x: 1, y: -1)
            cg.translateBy(x: -visible.minX, y: -visible.minY)
            NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)
            (host.appearance ?? NSAppearance(named: .aqua)!).performAsCurrentDrawingAppearance {
                let origin = tv.textContainerOrigin
                tlm.enumerateTextLayoutFragments(from: tlm.documentRange.location, options: [.ensuresLayout]) { f in
                    let o = CGPoint(x: origin.x + f.layoutFragmentFrame.minX, y: origin.y + f.layoutFragmentFrame.minY)
                    if o.y > visible.maxY { return false }
                    f.draw(at: o, in: cg)
                    return true
                }
            }
            cg.restoreGState()
            NSGraphicsContext.current = saved
        }
        try #require(rep.representation(using: .png, properties: [:])).write(to: url)
    }

    @Test func pictures() async throws {
        let env = ProcessInfo.processInfo.environment
        guard let dir = env["NOTE_COVER_SHOTS"].map({ URL(fileURLWithPath: $0) }), let photos = env["NOTE_COVER_PHOTOS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let d = UserDefaults.standard
        let keepNote = d.object(forKey: "lastNote"), keepScope = d.object(forKey: "lastScope")
        defer {
            if let keepNote { d.set(keepNote, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let keepScope { d.set(keepScope, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        let size = CGSize(width: 1440, height: 900)
        // No toolbar in a borderless window: without its fade, the title row shows as it does under one.
        NoteDetailView.captureWithoutToolbar = true
        defer { NoteDetailView.captureWithoutToolbar = false }
        for (name, covers, dark, hoverTitle) in [("1-add-buttons", false, false, true), ("2-cover", true, false, false), ("3-cover-dark", true, true, false)] {
            let (c, folder) = try Self.library(photos: photos, covers: covers)
            let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
            if let n = notes.first(where: { $0.title.hasSuffix("Lemon pasta") }) { d.set(n.id.uuidString, forKey: "lastNote") }
            d.set(try JSONEncoder().encode(Scope.folder(folder.id)), forKey: "lastScope")
            let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            let host = NSHostingView(rootView: AnyView(RootView().modelContainer(c).environment(SetupStore()).environment(\.controlActiveState, .key)))
            host.appearance = w.appearance
            host.frame = CGRect(origin: .zero, size: size)
            w.contentView = host
            defer { w.close() }
            try? await Task.sleep(for: .seconds(1.2))
            if let split = AIEditSnapshots.splitView(in: host) {
                split.setPosition(220, ofDividerAt: 0)
                split.setPosition(520, ofDividerAt: 1)
            }
            try? await Task.sleep(for: .seconds(1.5))
            if hoverTitle, let tv = MacWindowChromeTests.find(PaneTextView.self, in: host), let title = tv.titleLineRect() {
                tv.updateTitleActions(at: CGPoint(x: title.midX, y: title.midY))
                #expect(tv.titleActionsShown, "Add Icon and Add Cover show with the pointer on the title: \(title), width \(tv.bounds.width)")
                try? await Task.sleep(for: .seconds(0.4))
            }
            try Self.draw(host, to: dir.appending(path: "\(name).png"))
        }
    }
}
#endif
