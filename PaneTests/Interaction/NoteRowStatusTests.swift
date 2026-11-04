import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The room before a note's title holds its status, one mark at a time, as Apple Notes' list does
/// (Emil, 4 November 2026): a lock, drawn open while locked notes are open; the dot of an AI change
/// not seen yet; Apple's shared mark on a note shared with people; a pin where no Pinned heading
/// says it already.
@MainActor @Suite(.serialized) struct NoteRowStatusTests {
    typealias S = NoteRowStatus

    static func of(locked: Bool = false, unlocked: Bool = false, ai: Bool = false, shared: Bool = false,
                   pinned: Bool = false, trashed: Bool = false, heading: Bool = false) -> S? {
        S.of(locked: locked, unlocked: unlocked, aiUnseen: ai, shared: shared, pinned: pinned, trashed: trashed, pinnedHeading: heading)
    }

    /// One at a time: the lock, then the AI dot, then shared, then the pin.
    @Test func oneMarkInThisOrder() {
        #expect(Self.of() == nil, "a plain note: nothing")
        #expect(Self.of(locked: true, ai: true, shared: true, pinned: true) == .locked(open: false), "a locked note always shows its lock")
        #expect(Self.of(locked: true, unlocked: true) == .locked(open: true), "open while locked notes are open, as Notes draws it")
        #expect(Self.of(ai: true, shared: true, pinned: true) == .aiUnseen, "the dot is for now")
        #expect(Self.of(shared: true, pinned: true) == .shared)
        #expect(Self.of(pinned: true) == .pinned, "search on the folders screen: no heading says it")
        #expect(Self.of(pinned: true, heading: true) == nil, "under the Pinned heading the words say it")
        #expect(Self.of(shared: true, pinned: true, heading: true) == .shared)
    }

    /// In Recently Deleted a note is neither shared nor pinned; a locked note keeps its lock.
    @Test func recentlyDeletedIsNeitherSharedNorPinned() {
        #expect(Self.of(shared: true, trashed: true) == nil)
        #expect(Self.of(pinned: true, trashed: true) == nil)
        #expect(Self.of(locked: true, shared: true, trashed: true) == .locked(open: false))
        #expect(Self.of(ai: true, trashed: true) == .aiUnseen, "the dot as before")
    }

    /// Apple's glyphs: Notes' lock (open and closed), its shared mark and the pin. The AI change is a dot.
    @Test func theGlyphs() {
        #expect(S.locked(open: false).symbol == "lock.fill")
        #expect(S.locked(open: true).symbol == "lock.open.fill")
        #expect(S.shared.symbol == "person.crop.circle.badge.checkmark")
        #expect(S.pinned.symbol == "pin.fill")
        #expect(S.aiUnseen.symbol == nil)
    }

    /// A note's own status: its lock follows the vault (closed, open, closed again); shared and
    /// pinned come from the note, and Recently Deleted drops them.
    @Test func aNotesOwnStatus() async throws {
        let scene = try await LockedSharedScene.make(biometry: nil)
        let kept = NoteVault.shared
        NoteVault.shared = scene.vault
        defer { NoteVault.shared = kept }
        let notes = try scene.container.mainContext.fetch(FetchDescriptor<Note>())
        func note(_ title: String) throws -> Note { try #require(notes.first { $0.title == title }) }
        func status(_ n: Note, ai: Bool = false, heading: Bool = true) -> S? { S.of(n, aiUnseen: ai, pinnedHeading: heading) }

        #expect(status(scene.locked) == .locked(open: false))
        try await scene.vault.unlock(password: LockedSharedScene.password)
        #expect(status(scene.locked) == .locked(open: true))
        scene.vault.lockNow()
        #expect(status(scene.locked) == .locked(open: false))

        #expect(status(try note("Book club")) == .shared)
        #expect(status(try note("Ideas for the garden")) == nil)
        let groceries = try note("Groceries")
        #expect(status(groceries) == nil, "under its heading")
        #expect(status(groceries, heading: false) == .pinned)
        let lisbon = try note("Weekend in Lisbon")  // pinned and shared
        #expect(status(lisbon, heading: false) == .shared)
        #expect(status(lisbon, ai: true) == .aiUnseen)
        lisbon.trashedAt = .now
        #expect(status(lisbon, heading: false) == nil)
    }

    /// Every mark fits the room before the title with a point clear on each side, at the largest
    /// it's drawn, and is centred in it: it never touches the title or the selected card's edge.
    /// The room is the selected card's on the Mac and the row's inset on iPhone.
    @Test func everyMarkFitsItsRoom() throws {
        #if os(macOS)
        let room = RowMetrics.leading + Hover.noteRowReach.leading
        let largest = RowMetrics.statusSize
        #else
        let room = RowMetrics.sideInset + RowMetrics.leading
        let largest = RowMetrics.statusSize * RowMetrics.statusMaxScale
        #endif
        #expect(RowMetrics.statusCenter == -room / 2, "centred in the room")
        #expect(RowMetrics.dotSize <= room - 2)
        for status in [S.locked(open: false), .locked(open: true), .shared, .pinned] {
            let width = try Self.width(of: try #require(status.symbol), size: largest * status.relativeSize)
            #expect(width <= room - 2, "\(status.name): \(width) pt wide in \(room) pt")
        }
    }

    /// A symbol's width at a size, in the marks' weight (medium): the glyph's own, without the
    /// margins its image keeps either side (its alignment rectangle).
    static func width(of symbol: String, size: CGFloat) throws -> CGFloat {
        #if os(macOS)
        let config = NSImage.SymbolConfiguration(pointSize: size, weight: .medium)
        let image = try #require(NSImage(systemSymbolName: symbol, accessibilityDescription: nil)?.withSymbolConfiguration(config))
        return image.alignmentRect.width
        #else
        let config = UIImage.SymbolConfiguration(pointSize: size, weight: .medium)
        let image = try #require(UIImage(systemName: symbol, withConfiguration: config))
        return image.size.width - image.alignmentRectInsets.left - image.alignmentRectInsets.right
        #endif
    }

    #if os(macOS)
    /// Rows that differ only in their status: the same title, text and time.
    static func rows() throws -> (ModelContainer, [String: Note]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let time = Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: .now) ?? .now
        var notes: [String: Note] = [:]
        for name in ["plain", "locked", "shared", "pinned", "ai"] {
            let n = ctx.createNote(in: .all, body: "Lisbon\nTram 28 early")
            switch name {
            case "locked":
                n.lockedBody = "sealed"
                n.body = "Lisbon"
            case "shared": n.sharedNoteID = UUID()
            case "pinned": n.isPinned = true
            case "ai":
                n.aiEditor = "ChatGPT"
                n.aiEditedAt = time
            default: break
            }
            n.updatedAt = time
            n.createdAt = time
            notes[name] = n
        }
        try ctx.save()
        return (c, notes)
    }

    /// The columns, in points from the picture's left and up to `limit`, where anything is drawn:
    /// a pixel that isn't the ground's (the top left corner's).
    static func inkColumns(_ rep: NSBitmapImageRep, width: CGFloat, upTo limit: CGFloat) -> [CGFloat] {
        let scale = CGFloat(rep.pixelsWide) / width
        guard let ground = rep.colorAt(x: 0, y: 0)?.usingColorSpace(.sRGB) else { return [] }
        func ink(_ c: NSColor) -> Bool {
            max(abs(c.redComponent - ground.redComponent), abs(c.greenComponent - ground.greenComponent),
                abs(c.blueComponent - ground.blueComponent), abs(c.alphaComponent - ground.alphaComponent)) > 0.2
        }
        var columns: [CGFloat] = []
        for x in 0..<min(rep.pixelsWide, Int(limit * scale)) {
            for y in 0..<rep.pixelsHigh {
                if let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB), ink(c) {
                    columns.append(CGFloat(x) / scale)
                    break
                }
            }
        }
        return columns
    }

    /// Drawn, each mark sits centred in the room before the title, a point clear of the title and
    /// of the selected card's edge, and its title starts where a plain note's does. The lock drawn
    /// open too, while locked notes are open. Light and dark.
    @Test(arguments: [false, true]) func theMarkSitsBeforeTheTitle(dark: Bool) async throws {
        let (c, notes) = try Self.rows()
        // The mark draws before the row's own frame, in the card's room: room for it on the left.
        let pad: CGFloat = 24, width: CGFloat = 300
        func columns(_ name: String) async throws -> [CGFloat] {
            let note = try #require(notes[name])
            // At the leading edge, as the list lays a row out; in a borderless window far off the
            // screen, never ordered in (ThemeShots' way).
            let rep = try await ThemeShots.host(NoteRow(note: note).frame(width: width, alignment: .leading).padding(.leading, pad).modelContainer(c),
                                                size: CGSize(width: width + pad, height: 80), dark: dark, wait: 0.4)
            return Self.inkColumns(rep, width: width + pad, upTo: pad + 60)
        }
        let plain = try await columns("plain")
        let start = try #require(plain.first, "a plain row draws its text")
        let title = pad + RowMetrics.leading
        #expect(start >= title && start < title + 2.5, "a plain note's text starts at the title's place: \(start - pad)")
        let room = RowMetrics.leading + Hover.noteRowReach.leading
        var marks: [(String, [CGFloat])] = []
        for name in ["locked", "shared", "pinned", "ai"] { marks.append((name, try await columns(name))) }
        // Locked notes open: the same locked note, its lock drawn open.
        let open = NoteVault(keyStore: MemoryKeyStore(), defaults: MemoryDefaults(), iterations: 1_000)
        try await open.setUp(password: "correct horse", hint: nil)
        try #require(open.isUnlocked)
        let kept = NoteVault.shared
        NoteVault.shared = open
        defer { NoteVault.shared = kept }
        marks.append(("unlocked", try await columns("locked")))
        for (name, ink) in marks {
            let mark = ink.filter { $0 < start - 0.5 }
            let text = ink.filter { $0 >= start - 0.5 }
            let first = try #require(mark.first, "\(name): a mark before the title")
            let last = try #require(mark.last)
            // `last` is where the last drawn column starts: half a pixel short of the ink's end.
            let middle = (first + last + 0.5) / 2 - (title - room / 2)
            #expect(first >= title - room + 1, "\(name): clear of the card's edge, from \(first - title) pt")
            #expect(last <= title - 1, "\(name): clear of the title, to \(last - title) pt")
            #expect(abs(middle) <= 1, "\(name): in the room's middle, \(middle) pt off")
            #expect(abs((text.first ?? 0) - start) < 0.6, "\(name): its title starts where a plain note's does")
        }
    }

    /// VoiceOver hears what the marks show, each once, and a shared note stays "Shared" while the
    /// AI dot has the room.
    @Test func voiceOverHearsTheStatus() async throws {
        let (c, notes) = try Self.rows()
        func heard(_ name: String) async throws -> String {
            let note = try #require(notes[name])
            let ax = OffscreenAX(NoteRow(note: note).frame(width: 300).padding(10).modelContainer(c), size: CGSize(width: 320, height: 100))
            defer { ax.close() }
            await ax.settle()
            return try #require(ax.find("note.Lisbon"), "\(name): the row").text
        }
        let locked = try await heard("locked")
        #expect(locked.components(separatedBy: "Locked").count == 2, "Locked, once: \(locked)")
        let shared = try await heard("shared")
        #expect(shared.contains("Shared"), "\(shared)")
        let pinned = try await heard("pinned")
        #expect(pinned.contains("Pinned"), "\(pinned)")
        let plain = try await heard("plain")
        #expect(!plain.contains("Shared") && !plain.contains("Locked") && !plain.contains("Pinned"), "\(plain)")
        try #require(notes["ai"]).sharedNoteID = UUID()
        let both = try await heard("ai")
        #expect(both.contains("Shared"), "the dot has the room; VoiceOver still hears it's shared: \(both)")
    }
    #endif
}
