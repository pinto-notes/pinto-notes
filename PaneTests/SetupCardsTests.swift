#if os(macOS)
import AppKit
import Foundation
import SwiftUI
import Testing
@testable import Pane

/// The first run as cards over the notes (round 7): what each card says and offers, and that the
/// gallery's templates are real ones that open the AI with the ask in it.
@MainActor @Suite struct SetupCardsTests {
    /// Every card fits the narrowest notes window (760 pt), with room either side.
    @Test func everyCardFitsTheNarrowestWindow() {
        let cards: [SetupCards.Card] = [.signIn, .bring, .importing, .connect, .waiting, .connected, .set, .gallery, .making]
        for card in cards { #expect(SetupCards.width(card) <= 760 - 2 * 12, "\(card)") }
        #expect(cards.map(SetupCards.width).max() == SetupCards.width(.gallery), "the gallery is the one wide card")
    }

    /// Emil 10-30: a real choice of where notes come from, not one default and a hidden link.
    /// Six tiles, Apple Notes first, and the button names what it will do with the pick.
    @Test func bringOffersEverySourceAndNamesThePick() {
        #expect(SetupCards.sources.first == .appleNotes)
        #expect(SetupCards.sources.count == 6)
        let titles = SetupCards.sources.map(SetupCards.importTitle)
        #expect(Set(titles).count == titles.count, "each pick says something different")
        #expect(SetupCards.importTitle(.appleNotes) == "Import from Apple Notes")
        #expect(SetupCards.importTitle(.files(.obsidian)) == "Choose Obsidian vault\u{2026}")
        #expect(SetupCards.sources.allSatisfy { SetupCards.tileName($0).count <= 14 }, "names fit a third of the card")
    }

    /// Emil 10-30: ChatGPT, Claude or another AI side by side; what follows names the pick, and
    /// the card keeps App Review's line about what the AI can do.
    @Test func connectNamesThePickedAI() {
        #expect(SetupCards.AI.allCases.map(\.tile) == ["ChatGPT", "Claude", "Another AI"])
        #expect(SetupCards.AI.claude.button == "Connect Claude")
        #expect(SetupCards.finishTitle(.claude) == "Finish in Claude.")
        #expect(SetupCards.connectedTitle(.other) == "Your AI is connected.")
        for ai in SetupCards.AI.allCases {
            #expect(ai.reads.hasPrefix(ai.Name) && ai.reads.contains("read and edit") && ai.reads.contains("Disconnect anytime"))
        }
        #expect(SetupCards.AI.other.asks == false, "no link reaches another AI: no gallery for it")
    }

    /// Emil 10-30: the first-note card shows real templates with their covers. Each one is a
    /// template the website serves, its cover ships in the app, and picking it opens ChatGPT or
    /// Claude with an ask that names Pinto Notes.
    @Test func theGalleryIsRealTemplatesThatOpenTheAI() {
        #expect(SetupCards.picks.count == 4)
        for pick in SetupCards.picks {
            #expect(NoteSourceLink(kind: .template, slug: pick.slug).isValid, "\(pick.slug)")
            #expect(NSImage(named: pick.cover) != nil, "\(pick.cover) is in the assets")
            #expect(SetupCards.prompt(pick).hasPrefix("In Pinto Notes, "))
            let gpt = try? #require(SetupCards.page(.chatgpt, pick))
            #expect(gpt?.host == "chatgpt.com")
            #expect(SetupCards.page(.claude, pick)?.host == "claude.ai")
            #expect(SetupCards.page(.other, pick) == nil)
        }
        #expect(SetupCards.galleryTitle(.chatgpt) == "What should ChatGPT make first?")
    }

    /// The words on a cover's ground read: light on the dark green and blue, dark on yellow and pink.
    @Test func coverWordsReadOnTheirGround() {
        let ink = Dictionary(uniqueKeysWithValues: SetupCards.picks.map { ($0.slug, $0.lightInk) })
        #expect(ink["trip-plan"] == true)
        #expect(ink["reading-list"] == true)
        #expect(ink["meal-plan"] == false)
        #expect(ink["weekly-review"] == false)
    }

    /// The card flow never asks for a name, and a connected ChatGPT leads to the gallery
    /// (Try it), where the store's own order already goes.
    /// Another AI has no link to open, so a template's ask is shown to copy, word for word.
    @Test func anotherAIGetsThePromptToCopy() {
        let pick = SetupCards.picks[0]
        #expect(SetupCards.page(.other, pick) == nil)
        #expect(SetupCards.page(.chatgpt, pick) != nil)
        #expect(SetupCards.prompt(pick).hasPrefix("In Pinto Notes, "))
        #expect(SetupCards.width(.prompt) <= SetupCards.width(.gallery))
    }

    /// The card's shadow is its shape's alone. On the whole card SwiftUI cast it again under every
    /// tile, word and button inside, a grey smear (2026-10-30). A shape drawn on its own doesn't
    /// show it, only the full card in a window, so this reads the source, like the button rules.
    @Test func theCardsShadowIsOnItsShapeOnly() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "SetupCards.swift"), encoding: .utf8)
        let card = try #require(source.components(separatedBy: "struct SetupCard<Content: View>").last?.components(separatedBy: "\n}\n").first)
        let lines = card.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }
        let fill = try #require(lines.firstIndex { $0.hasPrefix("shape.fill(SetupCards.ground)") })
        #expect(lines.indices.filter { lines[$0].hasPrefix(".shadow(") }.allSatisfy { $0 == fill + 1 || $0 == fill + 2 })
        #expect(lines.contains { $0.hasPrefix(".shadow(") })
    }

    /// The library's line: what an AI is for until you have it, then when you last used it, and
    /// how many accounts when there are two (two Claudes).
    @Test func theLibrarySaysWhatYouHave() {
        func c(_ used: Date?) -> Connection {
            Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: used, revoked_at: nil, redirect_host: "claude.ai")
        }
        #expect(ConnectCopy.libraryLine(.claude, accounts: [], working: nil) == ConnectAISection.Guide.claude.line)
        #expect(ConnectCopy.libraryLine(.claude, accounts: [c(nil)], working: nil) == "Not used yet")
        #expect(ConnectCopy.libraryLine(.claude, accounts: [c(.now), c(nil)], working: nil).hasPrefix("2 accounts"))
        #expect(ConnectCopy.libraryLine(.claude, accounts: [c(.now)], working: "Waiting for Claude") == "Waiting for Claude")
        #expect(ConnectCopy.anotherAccount("Claude") == "Add another Claude account")
    }

    /// The library shows each AI's bare mark, never the white tile (Emil, 2026-10-30).
    @Test func theLibraryHasNoWhiteTiles() throws {
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appending(path: "Pane/Views/ConnectChoices.swift"), encoding: .utf8)
        let row = try #require(src.range(of: "private func libraryRow"))
        let body = src[row.lowerBound...].prefix(400)
        #expect(body.contains("AIGlyph(") && !body.contains("AITile("))
    }

    /// Make with ChatGPT and its arrow are one split button: square where the halves meet, not
    /// two rounded buttons side by side (Emil, 2026-10-30).
    @Test func makeAndItsArrowAreOneSplitButton() throws {
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appending(path: "Pane/Views/TemplateLibrary.swift"), encoding: .utf8)
        #expect(src.contains("joined: .leading") && src.contains("joined: .trailing"))
        #expect(AmberProminentButtonStyle.amberProminent(.regular, joined: .trailing).joined == .trailing)
    }

    /// A Mac menu drew the marks dark on its dark ground (Emil, 2026-10-30): each row gets a
    /// finished picture, ChatGPT in the text colour and Claude in its orange.
    @Test @MainActor func theMenuMarksKeepTheirColours() throws {
        func ink(_ ai: String, dark: Bool) throws -> (r: Double, g: Double, b: Double) {
            let picture = try #require(AIGlyph.menuPicture(ai, dark: dark))
            #expect(!picture.isTemplate)
            let bitmap = try #require(picture.cgImage(forProposedRect: nil, context: nil, hints: nil).map(NSBitmapImageRep.init(cgImage:)))
            var best: NSColor?
            for x in 0..<bitmap.pixelsWide { for y in 0..<bitmap.pixelsHigh {
                if let c = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.sRGB), c.alphaComponent > (best?.alphaComponent ?? 0.5) { best = c }
            } }
            let c = try #require(best)
            return (c.redComponent, c.greenComponent, c.blueComponent)
        }
        #expect(try ink("ChatGPT", dark: true).r > 0.85)
        #expect(try ink("ChatGPT", dark: false).r < 0.15)
        let claude = try ink("Claude", dark: true)
        #expect(claude.r > 0.7 && claude.b < 0.5)
    }

    /// With a mouse attached the scroll bar takes room from the grid, which then fitted a column
    /// fewer and left a gap (Emil, 2026-10-30): the cards are sized to the measured row.
    @Test func theTemplateGridFillsTheRowBesideAScrollBar() throws {
        for row in [552.0, 552 - 15, 992, 992 - 15] {
            let width = TemplateLibraryView.cardWidth(row: row, gap: 16)
            let count = ((row + 16) / (width + 16)).rounded(.down)
            #expect(row - (count * width + (count - 1) * 16) < count)
        }
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appending(path: "Pane/Views/TemplateLibrary.swift"), encoding: .utf8)
        #expect(src.contains(".onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { row = $0 }"))
    }

    @Test func afterConnectingTheGalleryIsNext() {
        #expect(Onboarding.next(after: .connect, connected: true) == .tryIt)
        #expect(Onboarding.next(after: .connect, connected: false) == nil)
    }
}
#endif
