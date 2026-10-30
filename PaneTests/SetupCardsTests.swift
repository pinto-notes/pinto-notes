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
    @Test func afterConnectingTheGalleryIsNext() {
        #expect(Onboarding.next(after: .connect, connected: true) == .tryIt)
        #expect(Onboarding.next(after: .connect, connected: false) == nil)
    }

    /// The strong button is pure black in the light and pure white in the dark, never the grey a
    /// system colour gives on a dark card.
    @Test func theInkButtonIsBlackOrWhite() {
        func white(_ color: Color, _ look: NSAppearance.Name) -> CGFloat {
            var w: CGFloat = -1
            NSAppearance(named: look)!.performAsCurrentDrawingAppearance {
                w = NSColor(color).usingColorSpace(.deviceGray)!.whiteComponent
            }
            return w
        }
        #expect(white(SetupCards.ink, .aqua) == 0)
        #expect(white(SetupCards.ink, .darkAqua) == 1)
        #expect(white(SetupCards.inkLabel, .aqua) == 1)
        #expect(white(SetupCards.inkLabel, .darkAqua) == 0)
    }
}
#endif
