#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
import Vision
@testable import Pane

/// The first run as cards over the notes (round 7): what each card says and offers, and that the
/// gallery's templates are real ones that open the AI with the ask in it.
@MainActor @Suite struct SetupCardsTests {
    /// Every card fits the narrowest notes window (760 pt), with room either side.
    @Test func everyCardFitsTheNarrowestWindow() {
        let cards: [SetupCards.Card] = [.signIn, .bring, .importing, .connect, .waiting, .connected, .gallery, .making]
        // Only the first run reaches the gallery, in a window at its default size. What the menus
        // open later fits the narrowest window.
        for card in cards where card != .gallery { #expect(SetupCards.width(card) <= WindowFrameMemory.minimum.width - 2 * 12, "\(card)") }
        #expect(SetupCards.width(.gallery) <= WindowFrameMemory.standard.width - 2 * 12)
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
        #expect(SetupCards.AI.tiles.map(\.tile) == ["ChatGPT", "Claude", "Another AI"])
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

    /// Escape moves on from every step of setup: Skip, Not now and Cancel are its cancel buttons.
    /// A rig pressing Escape on "Bring in your notes?" got nowhere (round 17). Reads the source,
    /// as a keyboard shortcut isn't visible from outside the button.
    @Test func escapeLeavesEverySetupStep() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "SetupCards.swift"), encoding: .utf8)
        let lines = source.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }
        let ways = lines.indices.filter { lines[$0].hasPrefix("Button(only == nil ?") }
        #expect(ways.count >= 3)
        for at in ways {
            #expect(lines[at + 1] == ".keyboardShortcut(.cancelAction)", "\(lines[at])")
        }
    }

    /// Not now ends setup on a new note, ready to type. "You're set." with one Done button stood
    /// between the person and writing, and ⌘N made notes behind it (round 17).
    @Test func notNowGoesStraightToWriting() async throws {
        let store = OnboardingStore(defaults: TestDefaults())
        store.showForPreview(.connect)
        var landed: [Onboarding.Landing?] = []
        let flow = SetupCardsFlow(store: store, backend: Backend(), finish: { landed.append($0) })
        let ax = OffscreenAX(flow.modelContainer(for: Note.self, inMemory: true), size: CGSize(width: 600, height: 500))
        defer { ax.close() }
        await ax.settle(500)
        #expect(try #require(ax.find("setup.notNow")).press())
        await ax.settle(300)
        #expect(landed == [.newNote])
    }

    /// ⌘N and ⇧⌘N do nothing while a setup card is up: the notes behind it are shut.
    @Test func newNoteIsOffBehindASetupCard() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "RootView.swift"), encoding: .utf8)
        #expect(source.contains(".focusedSceneValue(\\.newNoteAction, newNoteCommand)"))
        #expect(source.contains("if behindSetupCard { return nil }"))
    }

    /// A section's header merges into one heading, which hid New Folder from VoiceOver (round 18).
    @Test func voiceOverReachesNewFolderInTheHeading() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "SidebarView.swift"), encoding: .utf8)
        let header = try #require(source.range(of: "Text(\"Folders\")"))
        let rest = source[header.lowerBound...].prefix(1500)
        #expect(rest.contains(".accessibilityAddTraits(.isHeader)"))
        #expect(rest.contains(".accessibilityAction(named: \"New Folder\")"))
    }

    /// Correcting the address takes the old complaint away; Continue checks again (round 18).
    @Test func typingClearsTheEmailError() throws {
        for file in ["SignInView.swift", "WelcomeEmailSignIn.swift"] {
            let source = try String(contentsOf: TestFiles.url("Views").appending(path: file), encoding: .utf8)
            #expect(source.contains("email != $0 {") && source.contains("error = nil }; "), "\(file)")
        }
    }

    /// The Recently Deleted banner pushes the note down instead of lying over its title (round 18).
    @Test func theTrashBannerMakesRoomForTheNote() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "NoteDetailView.swift"), encoding: .utf8)
        #expect(source.contains(".padding(.top, note.trashedAt != nil ? TrashBanner.height : 0)"))
    }

    /// Go to Note's rows are one element each for VoiceOver, and pressable (round 18).
    @Test func goToNoteRowsAreRowsToVoiceOver() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "QuickOpen.swift"), encoding: .utf8)
        #expect(source.contains(".accessibilityElement(children: .ignore)"))
        #expect(source.contains(".accessibilityAction { jumpAndChoose(row) }"))
    }

    /// Deleting the open note opens its neighbour, from More and from Edit, like Notes (round 18).
    @Test func deletingGoesByWayOfTheList() throws {
        let views = try TestFiles.url("Views")
        let more = try String(contentsOf: views.appending(path: "NoteDetailView.swift"), encoding: .utf8)
        let root = try String(contentsOf: views.appending(path: "RootView.swift"), encoding: .utf8)
        let list = try String(contentsOf: views.appending(path: "NoteListView.swift"), encoding: .utf8)
        #expect(more.contains("post(name: .paneDeleteNotes, object: Set([note.id]))"))
        #expect(root.contains("post(name: .paneDeleteNotes, object: Set(notes.map(\\.id)))"))
        #expect(list.contains("publisher(for: .paneDeleteNotes)") && list.contains("performRemove(ids)"))
    }

    /// File › Import Notes too: a sheet opened over the shut window inherits its "disabled", so
    /// its Choose button looked fine and did nothing, with no way forward (round 18).
    @Test func importIsOffBehindASetupCard() throws {
        let source = try String(contentsOf: TestFiles.url("Views").appending(path: "RootView.swift"), encoding: .utf8)
        #expect(source.contains(".focusedSceneValue(\\.importAction, behindSetupCard ? nil"))
        #expect(source.contains(".focusedSceneValue(\\.importFromAction, behindSetupCard ? nil"))
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
        let rows: [CGFloat] = [552, 537, 992, 977]
        for row in rows {
            let width: CGFloat = TemplateLibraryView.cardWidth(row: row, gap: 16)
            let count: CGFloat = ((row + 16) / (width + 16)).rounded(.down)
            let used: CGFloat = count * width + (count - 1) * 16
            #expect(row - used < count)
        }
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appending(path: "Pane/Views/TemplateLibrary.swift"), encoding: .utf8)
        #expect(src.contains(".onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { row = $0 }"))
    }

    /// Every template's page says its name once, beside the stage, notes too (on 2026-10-30 a
    /// note's name showed only in the note). What its AI is asked shows as it's sent: no "…" gap
    /// (the AI gets none either), as plain words.
    @Test func everyTemplateSaysItsNameBesideTheStage() throws {
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appending(path: "Pane/Views/TemplateLibrary.swift"), encoding: .utf8)
        #expect(src.components(separatedBy: "Text(e.title).font(.system(size: PageType.name, weight: .bold))").count == 2)
        #expect(src.contains("TemplateCatalog.Entry.sendable(e.ask)"))
    }

    /// The library offers your AIs, the one used last first, each kind once; any AI without a chat
    /// link (Codex CLI, Claude Code) is "another AI", and with none connected Make copies the ask.
    @Test func theLibraryOffersYourAIsLastUsedFirst() {
        func c(_ name: String, used: TimeInterval?, host: String? = nil, kind: String = "oauth") -> Connection {
            Connection(id: UUID(), name: name, kind: kind, created_at: .now.addingTimeInterval(-86_400), last_used_at: used.map { .now.addingTimeInterval(-$0) }, revoked_at: nil, redirect_host: host)
        }
        #expect(TemplateMaking.ais([c("ChatGPT", used: 600, host: "chatgpt.com"), c("Claude", used: 60, host: "claude.ai")]) == [.claude, .chatgpt])
        #expect(TemplateMaking.ais([c("Claude", used: 60, host: "claude.ai"), c("Claude", used: 900, host: "claude.ai")]) == [.claude])
        #expect(TemplateMaking.ais([]) == [.other])
    }

    /// Templates opens in the app on the Mac: the sidebar's row and card, and the setup gallery's link.
    @Test func templatesOpenInTheApp() throws {
        let views = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views")
        for file in ["SidebarAIs.swift", "SidebarCards.swift", "SetupCards.swift"] {
            let src = try String(contentsOf: views.appending(path: file), encoding: .utf8)
            #expect(src.contains("post(name: .paneTemplates"), "\(file)")
        }
        #expect(TemplatesCard.opensWeb == false)
        let root = try String(contentsOf: views.appending(path: "RootView.swift"), encoding: .utf8)
        #expect(root.contains("publisher(for: .paneTemplates)") && root.contains("TemplateLibraryView(ais: ais"))
    }

    /// An app template runs in the library (Emil, 2026-10-30: "these images suck"): each has its
    /// note, its project and its starting data in the app, and a change stays in the preview.
    @Test @MainActor func everyAppTemplateCanRun() throws {
        let apps = TemplateCatalog.shipped.entries.filter(\.app)
        #expect(apps.count >= 4)
        for e in apps {
            #expect(e.note?.isEmpty == false, "\(e.slug)")
            #expect(e.appProject?.contains("amberApp") == true, "\(e.slug)")
            #expect(!e.appData.isEmpty, "\(e.slug)")
        }
        let id = UUID()
        _ = TemplateAppPreview(entry: try #require(apps.first), project: "")
        #expect(NotePageDataStore.shared.docs[id] == nil)
        // Every template carries its note now (Make adds it from here, 8 November 2026); only apps have a project.
        #expect(TemplateCatalog.shipped.entries.filter { !$0.app }.allSatisfy { $0.appProject == nil && $0.note != nil })
    }

    /// Grok: a two-step guide like ChatGPT's old one, recognised by its own callback only.
    @Test func grokHasAGuideAndIsKnownByItsCallback() {
        let g = ConnectWebGuide.grok(onWeb: true)
        #expect(g.steps.count == 2 && g.steps[0].link == ConnectWebGuide.grokConnectors && g.steps[0].copiesAndMovesOn)
        #expect(g.steps[0].text.contains("New Connector") && g.steps[0].text.contains("Custom"))
        #expect(g.steps[1].text.contains("Server URL") && g.steps[1].text.contains("Add Connector") && g.steps[1].waits)
        #expect(ConnectWebGuide.opensSheet(.grok))
        #expect(ConnectTrust.verifiedAI(redirectURI: "https://grok.com/connectors-oauth-exchange-code/") == "Grok")
        #expect(ConnectTrust.verifiedAI(redirectURI: "https://grok.com.evil.example/connectors-oauth-exchange-code/") == nil)
        #expect(ConnectTrust.makers["Grok"] == "xAI")
        let mine = Connection(id: UUID(), name: "Pinto Notes", kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: "grok.com")
        let theirs = Connection(id: UUID(), name: "Grok", kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: "evil.example")
        #expect(ConnectRun.owner(of: mine) == .grok && ConnectRun.owner(of: theirs) == .other, "by where access went, never by the name")
        #expect(ConnectRun.isNew([mine], for: .grok, since: .distantPast) && !ConnectRun.isNew([theirs], for: .grok, since: .distantPast))
    }

    /// Emil, 2 November 2026: the connect guide's Back was a different (underlined) one, and the
    /// page dots jumped when Back appeared. Both guides use the quiet Back and centered dots.
    @Test func guidesShareTheirBackAndKeepTheDotsStill() throws {
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views")
        for file in ["ConnectWebGuide.swift", "ImportGuide.swift"] {
            let src = try String(contentsOf: root.appending(path: file), encoding: .utf8)
            let bar = try #require(src.range(of: "private var topBar: some View {"))
            let rest = String(src[bar.lowerBound...].prefix(1400))
            #expect(rest.contains("Label(\"Back\", systemImage: \"chevron.left\")") && rest.contains(".buttonStyle(.quiet)"), "\(file)")
            #expect(!rest.contains(".hoverText"), "\(file)")
            #expect(rest.contains(".overlay {") && rest.contains("PageDots("), "\(file): dots centered on the bar")
        }
    }

    /// Claude's directory still lists Pinto Notes as Amber Notes: the wait says so, for Claude only.
    @Test func claudesWaitExplainsTheOldName() {
        #expect(SetupCards.oldNameLine(.claude) == "In Claude it\u{2019}s still called Amber Notes, our old name.")
        for ai in [SetupCards.AI.chatgpt, .grok, .other, .codex] { #expect(SetupCards.oldNameLine(ai) == nil) }
    }

    @Test func afterConnectingTheGalleryIsNext() {
        #expect(Onboarding.next(after: .connect, connected: true) == .tryIt)
        #expect(Onboarding.next(after: .connect, connected: false) == nil)
    }

    /// Emil, 2 November 2026: Connect your AI is two brand buttons, one click each, with a row
    /// under them; Other opens the address and its steps. Claude Code comes with Claude, Cursor and
    /// VS Code sit behind Other, never Mistral. Grok is live (Emil connected it, 2 November);
    /// Gemini is behind Another app.
    @Test func connectIsTwoBrandButtonsAndARow() throws {
        #expect(SetupCards.connectLook == .likeImport)
        #expect(SetupCards.moreLook == .row)
        #expect(ConnectWebGuide.otherLook == .steps)
        #expect(SetupCards.brands == [.chatgpt, .claude, .grok], "three brands (Emil, 2 November 2026)")
        #expect(SetupCards.connectTiles == [.chatgpt, .claude, .grok, .other], "Other is a tile beside them, not a link under the button")
        let row = SetupCards.rowAIs.map(\.name)
        #expect(row == ["Other"], "everything else, Gemini included, is Another app")
        #expect(SetupCards.comingSoon.isEmpty)
        #expect(SetupCards.AI.grok.guide == .grok && !SetupCards.AI.grok.asks)
        for never in ["Codex", "Claude Code", "Cursor", "VS Code", "Mistral", "Le Chat", "Gemini"] { #expect(!row.contains(never)) }
        #expect(SetupCards.AI.codex.guide == .codex && !SetupCards.AI.codex.asks, "Codex is added on this Mac; its ask is copied")
        #expect(SetupCards.connectReads.contains("read and edit") && SetupCards.connectReads.contains("Disconnect anytime"), "App Review: what it can do, before any AI")
        #expect(AIGlyph.asset("Codex") != nil && AIGlyph.asset("Grok") != nil && AIGlyph.asset("Gemini") != nil)
        let url = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views/SetupCards.swift")
        let source = try String(contentsOf: url, encoding: .utf8)
        #expect(source.contains("ConnectWebGuideSheet(ai: g, client: client)") && source.contains("guidePage = .grok") && source.contains("guidePage = .other"),
                "Grok opens its guide over the card, Other its page")
        // The guide hangs off the card, not the choice the Waiting card replaces.
        let card = try #require(source.range(of: "SetupCard(card: card) { content }"))
        let sheet = try #require(source.range(of: ".sheet(item: $guidePage, onDismiss: guideClosed)"))
        let choice = try #require(source.range(of: "private var connectBranded: some View"))
        #expect(card.lowerBound < sheet.lowerBound && sheet.lowerBound < choice.lowerBound, "Grok's guide showed only after Cancel")
    }

}

/// The template library's speed (Emil, 8 November 2026: "janky, laggy"): its first frame, a
/// pass after a change (a key typed, a card picked), and each slow step on its own. Printed as
/// PERF lines; the limits are loose, so a slow machine doesn't fail them, and only catch a step
/// that's back to reading or decoding files on every pass.
@MainActor @Suite struct TemplateLibraryTimings {
    /// The library as its window holds it; a new `n` is a change that runs its body again, as a
    /// key typed or a card picked does.
    struct Host: View {
        let n: Int
        let open: TemplateCatalog.Entry?
        var body: some View {
            TemplateLibraryView(catalog: .shipped, ais: [.chatgpt, .claude], open: open, make: { _, _ in _ = n }).environment(\.inSheet, true)
        }
    }

    private func ms(_ d: Duration) -> Double { Double(d.components.attoseconds) / 1e15 + Double(d.components.seconds) * 1000 }

    private func measure(_ name: String, open: TemplateCatalog.Entry?) async throws -> (first: Double, again: Double) {
        let clock = ContinuousClock(), start = clock.now
        let host = NSHostingView(rootView: Host(n: 0, open: open))
        host.frame = CGRect(origin: .zero, size: TemplateLibraryView.size)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: host.frame.width, height: host.frame.height), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        CATransaction.flush()
        let first = ms(clock.now - start)
        try await Task.sleep(for: .milliseconds(300))
        var passes: [Double] = []
        for i in 1...15 {
            let t = clock.now
            host.rootView = Host(n: i, open: open)
            host.layoutSubtreeIfNeeded()
            CATransaction.flush()
            passes.append(ms(clock.now - t))
        }
        let again = passes.sorted()[passes.count / 2]
        print("PERF templates \(name): first frame \(String(format: "%.1f", first)) ms, a pass after a change \(String(format: "%.1f", again)) ms (median of 15)")
        return (first, again)
    }

    @Test func theLibraryIsQuick() async throws {
        let c = TemplateCatalog.shipped
        let closed = try await measure("closed", open: nil)
        let note = try await measure("a note open", open: c.entries.first { $0.slug == "meeting-notes" })
        let app = try await measure("an app open", open: c.entries.first { $0.slug == "trip-plan" })
        // The steps on their own, as each pass ran them.
        let clock = ContinuousClock()
        var start = clock.now
        for e in c.entries { _ = e.pick.image }
        print("PERF templates covers: \(String(format: "%.2f", ms(clock.now - start))) ms for \(c.entries.count) cards")
        start = clock.now
        for e in c.entries { _ = NotePreview.blocks(e.example) }
        print("PERF templates note previews parsed: \(String(format: "%.2f", ms(clock.now - start))) ms for \(c.entries.count)")
        start = clock.now
        for e in c.entries where e.app { _ = e.appProject; _ = e.appData }
        print("PERF templates app projects read: \(String(format: "%.2f", ms(clock.now - start))) ms")
        start = clock.now
        for e in c.entries { _ = c.shown(filter: "All", query: e.title) }
        print("PERF templates searches: \(String(format: "%.2f", ms(clock.now - start))) ms for \(c.entries.count)")
        for t in [closed, note, app] { #expect(t.again < 250) }
    }
}


/// How the template library behaves: a gallery and a template's page, two pages in one sheet
/// (Emil, 9 November 2026: "page navigation instead of the template being a thing that shows up
/// on the right side").
@MainActor @Suite struct TemplateLibraryBehaviour {
    nonisolated static let all = TemplateCatalog.shipped.entries
    private func entry(_ slug: String) throws -> TemplateCatalog.Entry { try #require(Self.all.first { $0.slug == slug }) }
    private var library: String { get throws { try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift") } }

    // MARK: Two pages

    /// Nothing is open at rest: the gallery. A template's page comes in over it, opaque, and the
    /// gallery stays under it as it was left (its scroll, kind and search). Going from one
    /// template to the next, the page being left stays whole under the new one.
    @Test func aPageComesOverTheGalleryWhichStays() throws {
        let src = try library
        #expect(src.contains("gallery(shown)\n                // Under a page it keeps its place, and takes no clicks or VoiceOver.\n                .allowsHitTesting(open == nil)"))
        #expect(src.contains(".background(SetupCards.ground)\n                    .zIndex(Double(i + 1))"), "a page is opaque over what's under it")
        #expect(src.contains("SetupTemplateCard(pick: e.pick, width: width, selected: focused == e, words: .name, tag: e.app ? TemplateLibraryWords.app : nil)"), "a cover is its art and name; the ring is the keys'")
        #expect(!src.contains("selected: current == e"), "no cover is picked at rest")
    }

    /// One quick move between the pages and from one template to the next, 0.18 s at most, and
    /// none with Reduce Motion. A second move before the first has landed is made at once, so
    /// nothing is ever half in.
    @Test func oneQuickMoveAndNoneWithReduceMotion() throws {
        #expect(TemplateLibraryView.moveDuration > 0 && TemplateLibraryView.moveDuration <= 0.18)
        #expect(TemplateLibraryView.move(reduceMotion: true) == nil)
        #expect(TemplateLibraryView.move(reduceMotion: false) != nil)
        let src = try library
        #expect(src.contains("static func pageTransition(reduceMotion: Bool) -> AnyTransition { reduceMotion ? .identity : .opacity }"))
        // From one template to the next the page changes at once: dissolved, both pages' words
        // showed over each other.
        let a = try entry("meeting-notes"), b = try entry("trip-plan")
        #expect(TemplateLibraryView.animates(from: nil, to: a) && TemplateLibraryView.animates(from: a, to: nil))
        #expect(!TemplateLibraryView.animates(from: a, to: b))
        #expect(src.contains("guard Self.animates(from: open, to: e), let animation = Self.move(reduceMotion: reduceMotion) else {"))
        #expect(!src.contains("@State private var under"), "no second page is kept under the open one")
        #expect(!src.contains(".transition(.opacity.animation("), "nothing fades out while another fades in")
    }

    /// The arrow keys move a ring through the covers, a row up and down, one along left and
    /// right (left and right only while they wouldn't move the cursor in Search); on a page left
    /// and right walk the gallery's order.
    @Test func arrowKeysWalkTheCoversAndThePages() throws {
        let shown = Array(Self.all.prefix(12))
        #expect(TemplateLibraryView.step(shown, from: nil, by: 1) == shown[0], "the first press lands on the first cover")
        #expect(TemplateLibraryView.step(shown, from: shown[0], by: 1) == shown[1])
        #expect(TemplateLibraryView.step(shown, from: shown[0], by: 5) == shown[5], "a row down, five across")
        #expect(TemplateLibraryView.step(shown, from: shown[0], by: -1) == shown[0])
        #expect(TemplateLibraryView.step(shown, from: shown[11], by: 5) == shown[11])
        #expect(TemplateLibraryView.step([], from: nil, by: 1) == nil)
        #expect(TemplateLibraryView.arrowsMoveCovers(searching: true, query: ""))
        #expect(!TemplateLibraryView.arrowsMoveCovers(searching: true, query: "tr"))
        #expect(TemplateLibraryView.arrowsMoveCovers(searching: false, query: "tr"))
        let last = try #require(Self.all.last)
        #expect(TemplateLibraryView.walk(shown, all: Self.all, open: shown[3]) == shown)
        #expect(TemplateLibraryView.walk(shown, all: Self.all, open: last) == Self.all, "opened from More like this: all of them")
        let src = try library
        #expect(src.contains(".onKeyPress(.return) { openFromKeys() ? .handled : .ignored }") && src.contains(".onSubmit { _ = openFromKeys() }"), "Return opens")
        // A page takes the keys, so its arrows reach it (with nothing focused they went nowhere).
        #expect(src.contains("Button(\"\") { _ = arrow(shown, rows: 0, along: -1) }.keyboardShortcut(e == open ? KeyboardShortcut(.leftArrow, modifiers: []) : nil)"))
        #expect(src.contains("Button(\"\") { _ = arrow(shown, rows: 0, along: 1) }.keyboardShortcut(e == open ? KeyboardShortcut(.rightArrow, modifiers: []) : nil)"))
        #expect(!src.contains(".focusable("), "a page never takes the focus: it drew focus rings on Back and Make")
        #expect(src.contains(".onChange(of: open) { _, now in searching = now == nil }"))
        #expect(src.contains(".keyboardShortcut(e == open ? .cancelAction : nil)") && src.contains("KeyboardShortcut(\"[\", modifiers: .command)"), "Esc and Command-[ go back")
        #expect(src.contains("CardCloseButton(cancels: open == nil, action: close)") && src.contains("CardCloseButton(cancels: false, action: close)"), "Esc is the gallery's x only on the gallery")
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        let made = try #require(root.range(of: "private func templates(_ ais: [SetupCards.AI]) -> some View {"))
        #expect(!root[made.lowerBound...].prefix(900).contains(".onExitCommand"), "Esc on a page goes back; it doesn't close the sheet")
    }

    /// A cover the keys move to comes into view by the nearest edge; one in view doesn't move.
    @Test func aCoverTheKeysReachComesInByTheNearestEdge() {
        let visible = CGRect(x: 0, y: 0, width: 900, height: 560)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: 40, width: 185, height: 257), visible: visible) == nil)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: 400, width: 185, height: 257), visible: visible) == .bottom)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: -100, width: 185, height: 257), visible: visible) == .top)
        #expect(TemplateLibraryView.revealAnchor(cell: nil, visible: visible) == .bottom, "a cover not laid out yet is below")
    }

    /// The sheet is never wider or taller than its window less a margin; on a big window it's
    /// its full size. Five covers go across the full sheet, three on the smallest.
    @Test func theSheetFitsItsWindowAndFiveCoversGoAcross() {
        #expect(TemplateLibraryView.size(on: CGSize(width: 1600, height: 1000)) == TemplateLibraryView.size)
        let small = TemplateLibraryView.size(on: CGSize(width: 800, height: 560))
        #expect(small.width <= 800 - 80 && small.height <= 560 - 60)
        #expect(TemplateLibraryView.size(on: CGSize(width: 500, height: 300)) == CGSize(width: 720, height: 500))
        let wide = TemplateLibraryView.cardWidth(row: TemplateLibraryView.size.width - 48, gap: 16)
        #expect(wide == 185, "five across: \(wide)")
        #expect(abs(wide - SetupTemplateCard.size.width) < 30, "near the covers' own size")
        let narrow = TemplateLibraryView.cardWidth(row: 720 - 48, gap: 16)
        #expect(narrow == 213, "three across the smallest sheet: \(narrow)")
    }

    /// A page's parts: the stage takes six tenths of the width, large; "More like this" shows on
    /// a sheet tall enough for it.
    @Test func thePagesParts() {
        let size = TemplateLibraryView.size
        #expect(TemplateLibraryView.stageWidth(for: size) == 624)
        #expect(TemplateLibraryView.window(for: size) == CGSize(width: 624, height: 464))
        #expect(TemplateLibraryView.showsMore(size))
        #expect(!TemplateLibraryView.narrow(size))
        let small = TemplateLibraryView.size(on: CGSize(width: 800, height: 560))
        #expect(!TemplateLibraryView.showsMore(small) && TemplateLibraryView.narrow(small))
        #expect(TemplateLibraryView.window(for: small).height == small.height - TemplateLibraryView.topRow - 1 - TemplateLibraryView.exampleRow)
        // A narrow sheet gives the words more of it, so the button keeps its whole name.
        #expect(TemplateLibraryView.stageWidth(for: small) == 396)
        let words = small.width - 396 - 1 - TemplateLibraryView.margin * 2
        let name = ("Make with ChatGPT" as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: 15, weight: .semibold)]).width
        #expect(name + 14 + 7 + 40 + 44 <= words, "the mark, the name, the button's padding and its arrow fit in \(words) pt")
        #expect(TemplateLibraryWords.example == "Example" && TemplateLibraryWords.asked == "What your AI is asked" && TemplateLibraryWords.moreLike == "More like this")
    }

    /// The one button: Make with your AI; with none that opens with the ask, Add the note or Add
    /// the app. Its arrow has the other ways: another AI, without one, and the prompt to copy.
    /// There's no prompt box and no second button beside it.
    @Test func oneButtonAndItsOtherWays() throws {
        let note = try entry("meeting-notes"), app = try entry("trip-plan")
        #expect(TemplateLibraryWords.make(note, .chatgpt) == "Make with ChatGPT" && TemplateLibraryWords.make(app, .claude) == "Make with Claude")
        #expect(TemplateLibraryWords.make(note, .other) == "Add the note" && TemplateLibraryWords.make(app, .other) == "Add the app")
        #expect(TemplateLibraryWords.withoutAI == "Add without AI" && TemplateLibraryWords.copy == "Copy the prompt")
        #expect(TemplateLibraryWords.kind(note) == "Work" && TemplateLibraryWords.kind(app) == "Personal \u{00B7} App")
        let src = try library
        #expect(!src.contains("askBox") && !src.contains("Copy Prompt") && !src.contains("opensWith"), "no prompt box, no second button")
        #expect(src.contains("Button(TemplateLibraryWords.withoutAI) { make(e, .other) }") && src.contains("Button(TemplateLibraryWords.copy) { copy(e) }"))
        #expect(src.contains(".keyboardShortcut(e == open ? .defaultAction : nil)"), "Return makes the open template")
        #expect(src.components(separatedBy: ".buttonStyle(.amberProminent(").count == 3, "one primary button and its arrow")
        // What your AI is asked: plain quoted words.
        #expect(src.contains("Text(\"\\u{201C}\\(NoWidow.kept(TemplateCatalog.Entry.sendable(e.ask), phrases: true))\\u{201D}\")"))
    }

    /// The quiet line under the button says what Make does and where the note goes, for every
    /// template, in two lines at most beside the stage: "Adds to (folder) Health, then ChatGPT
    /// asks which habits you did today." With no AI that opens with the ask: "Adds to Health."
    @Test(arguments: all) func everyTemplateHasItsCaption(_ e: TemplateCatalog.Entry) throws {
        let asks = try #require(TemplateLibraryWords.asks[e.slug], "\(e.slug) has no caption")
        #expect(asks.first?.isLowercase == true && !asks.hasSuffix("."), "\(e.slug): \(asks)")
        let folder = try #require(e.folder)
        let with = TemplateLibraryWords.caption(e, ai: .chatgpt)
        #expect(with.lead == "Adds to " && with.folder == folder && with.rest == ", then ChatGPT asks \(asks).")
        let without = TemplateLibraryWords.caption(e, ai: .other)
        #expect(without.lead + without.folder + without.rest == "Adds to \(folder).")
        // Beside the full sheet's stage: the words' column less its margins.
        let width = TemplateLibraryView.size.width - TemplateLibraryView.stageWidth(for: TemplateLibraryView.size) - 1 - TemplateLibraryView.margin * 2
        for ai in [SetupCards.AI.chatgpt, .claude] {
            let c = TemplateLibraryWords.caption(e, ai: ai)
            let lines = Balanced.lines(c.lead + "xx " + c.folder + c.rest, font: .systemFont(ofSize: 12), width: width)
            #expect(lines <= 2, "\(e.slug) with \(ai.name): \(lines) lines")
        }
    }

    /// Search and the kinds filter the covers in place; when nothing matches, one plain line.
    @Test func nothingMatchingIsOnePlainLine() throws {
        #expect(TemplateLibraryWords.none == "No templates match")
        #expect(TemplateCatalog.shipped.shown(filter: "All", query: "zebra").isEmpty)
        #expect(TemplateCatalog.shipped.shown(filter: "Apps", query: "").count == 4)
        let src = try library
        #expect(src.contains("Text(TemplateLibraryWords.none)") && !src.contains("TemplateLibraryWords.clear") && !src.contains("noneHint"))
    }

    // MARK: The examples (all 23)

    /// Every date in every example is one the stage moves to today: the examples are written for
    /// the samples' day, and no month is named outside a date. Moved by no days, an example is
    /// itself, weekdays included.
    @Test(arguments: all) func everyDateMovesWithToday(_ e: TemplateCatalog.Entry) throws {
        #expect(TemplateExample.moved(e.example, days: 0) == e.example, "\(e.slug): a weekday or a week's Monday is wrong for its date")
        let named = e.example.matches(of: /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/).count
        let dated = TemplateExample.dates(in: e.example).filter { !$0.contains("-") }.count
        #expect(named == dated, "\(e.slug): a month named outside a date (\(named) named, \(dated) dates)")
        // Written for the samples' week: nothing weeks old.
        #expect(!e.example.contains("September") && !e.example.contains("October") && e.example.firstMatch(of: /\b\d{1,2} (Sep|Oct)\b/) == nil, "\(e.slug)")
        let later = TemplateExample.moved(e.example, days: 40)
        #expect(!later.contains("2026-11-0"), "\(e.slug): an ISO date stayed in early November")
    }

    /// A date keeps its form when it moves: ISO, a day and a month (short or whole), with its
    /// weekday worked out again, and a week stays named by its Monday.
    @Test func aDateKeepsItsForm() {
        #expect(TemplateExample.moved("### Sunday 8 November", days: 3) == "### Wednesday 11 November")
        #expect(TemplateExample.moved("(Sun 8 Nov)", days: 1) == "(Mon 9 Nov)")
        #expect(TemplateExample.moved("due 10 Nov, then 30 November", days: 25) == "due 5 Dec, then 25 December")
        #expect(TemplateExample.moved("| 2026-11-08 | Push |", days: 30) == "| 2026-12-08 | Push |")
        #expect(TemplateExample.moved("| 2025-11-20 | 2026-11-20 |", days: 60) == "| 2026-01-19 | 2027-01-19 |")
        #expect(TemplateExample.moved("### Week of 2 November", days: 3) == "### Week of 2 November", "still that week's Monday")
        #expect(TemplateExample.moved("### Week of 2 November", days: 8) == "### Week of 9 November")
        #expect(TemplateExample.moved("30 minutes, 3 months, 2 cups, Monday: legs", days: 9) == "30 minutes, 3 months, 2 cups, Monday: legs")
        // The stage reads an example through it, a day's worth worked out once.
        #expect(TemplateSample.anchor == "2026-11-08")
    }

    /// A table on the stage has its heading over it, shows five columns at most, and fits the
    /// stage's width with no word broken and nothing running off its side.
    @Test(arguments: all.filter { !$0.app }) func everyTableFitsTheStageUnderItsHeading(_ e: TemplateCatalog.Entry) throws {
        let blocks = NotePreview.blocks(e.example).filter { $0 != .gap }
        for (i, block) in blocks.enumerated() {
            guard case .table = block else { continue }
            #expect(i > 0 && blocks[i - 1].isHeading, "\(e.slug): a table with no heading over it")
        }
        let room = TemplateLibraryView.window(for: TemplateLibraryView.size).width - TemplateLibraryView.margin * 2
        for block in TemplateLibraryView.staged(e.example) {
            guard case .table(let header, let rows) = block else { continue }
            #expect(header.count <= TemplateLibraryView.stageColumns && rows.allSatisfy { $0.count == header.count }, "\(e.slug): \(header)")
            let least = NotePreview.leastWidths(header: header, rows: rows)
            #expect(least.reduce(0, +) <= room, "\(e.slug): its words need \(least.reduce(0, +)) pt of \(room)")
        }
    }

    /// The fixes to single examples (9 November 2026).
    @Test func theExamplesSayNothingOdd() throws {
        let job = try entry("job-hunt").example
        for name in ["Northwind", "Fabrikam", "Contoso"] { #expect(!job.contains(name), "a sample company from somewhere else: \(name)") }
        let standup = try entry("daily-standup").example
        #expect(standup.components(separatedBy: "Blockers").count == 2, "one Blockers section")
        #expect(standup.contains("### Standup, 8 November\n**Yesterday**"), "the day's heading isn't a bare date over Yesterday")
        let home = try entry("home-maintenance").example
        #expect(home.split(separator: "\n").allSatisfy { !$0.hasSuffix(":") }, "no blank field")
        let recipes = try entry("recipe-box")
        let subnotes = NotePreview.blocks(recipes.example).compactMap { block -> String? in
            if case .paragraph(let s) = block { return NotePreview.subnote(s) }
            return nil
        }
        #expect(subnotes == ["Lentil soup with lemon", "Sesame noodles", "Tomato and white bean stew", "Slow-roast lamb", "Sunday pancakes", "Cardamom buns"], "sub-notes show as rows, not links: \(subnotes)")
        #expect(NotePreview.subnote("A line with [a link](https://example.com) in it") == nil)
        #expect(try entry("gift-ideas").example.contains("| Budget (kr) |") && entry("budget-log").example.contains(" kr "), "one currency style")
        let meals = TemplateLibraryView.staged(try entry("meal-plan").example)
        #expect(meals.contains(.heading(2, "Groceries")), "the meal plan shows its groceries too")
        // An app's note holds only what its app doesn't: no table the app never reads.
        for e in Self.all where e.app {
            #expect(!(e.note ?? "").contains("|") && !e.example.contains("|"), "\(e.slug): a table in an app's note")
        }
    }

    /// The cast is shared (Sara, Jonas, Emma, Maja); a book or a story isn't told twice.
    @Test func noStoryIsToldTwice() {
        func templates(with word: String) -> [String] { Self.all.filter { $0.example.localizedCaseInsensitiveContains(word) }.map(\.slug) }
        #expect(templates(with: "Four Thousand Weeks") == ["book-notes"])
        #expect(templates(with: "pricing") == ["meeting-notes"])
        #expect(templates(with: "Lisbon").isEmpty && templates(with: "Ramiro").isEmpty, "the trip is the trip app's own")
        #expect(templates(with: "Lemon chicken") == ["meal-plan"])
        #expect(templates(with: "Maja").count >= 3, "the cast is shared")
    }

    /// "More like this" is the same need, said for each template: three or four others, each a
    /// template the app has, never one from the same kind only to fill the row.
    @Test(arguments: all) func moreLikeThisIsTheSameNeed(_ e: TemplateCatalog.Entry) throws {
        let listed = try #require(TemplateLibraryView.like[e.slug], "\(e.slug) has no list")
        let more = TemplateLibraryView.related(e, in: Self.all)
        #expect(more.map(\.slug) == listed, "every one listed is a template")
        #expect((3...4).contains(more.count) && !more.contains(e) && Set(listed).count == listed.count)
        if e.slug == "reading-list" { #expect(listed == ["book-notes", "study-flashcards", "cornell-notes"]) }
        if e.slug == "habit-tracker" { #expect(listed == ["mood-energy-log", "workout-log", "daily-journal", "weekly-review"]) }
    }

    /// One measure everywhere (a 24 pt margin, a 16 pt gap), and a short type ladder on a
    /// template's page: its name the one large thing, over twice the body; with the button's own
    /// size, four sizes in three weights.
    @Test func oneMeasureAndAShortTypeLadder() throws {
        #expect(TemplateLibraryView.margin == 24 && TemplateLibraryView.gap == 16)
        typealias T = TemplateLibraryView.PageType
        #expect(T.name / T.body >= 2 && T.name / T.body <= 2.6 && T.small < T.body)
        let src = try library
        let from = try #require(src.range(of: "    // MARK: A template's page"))
        let to = try #require(src.range(of: "/// The × in Search that clears it"))
        let page = String(src[from.lowerBound..<to.lowerBound])
        let sizes = Set(page.matches(of: /\.system\(size: ([A-Za-z.0-9]+)/).map { String($0.1) })
        #expect(sizes == ["PageType.name", "PageType.body", "PageType.small"], "\(sizes)")
        let weights = Set(page.matches(of: /weight: \.([a-z]+)/).map { String($0.1) })
        #expect(weights == ["bold", "semibold"], "bold and semibold, and regular where none is said: \(weights)")
        // Everything starts on the margin: the sheet's name, Back's chevron, the stage's lines,
        // the words beside it and "More like this".
        #expect(page.contains(".padding(.leading, Self.margin - 9)") && page.contains(".padding(.leading, Self.margin)\n                .frame(height: Self.exampleRow"))
        #expect(src.contains(".padding(.horizontal, Self.margin)\n        .frame(height: Self.headerHeight)"))
        #expect(TemplateFiles.stageCSS.contains("main > div:first-child { padding-left: 32px !important; padding-right: 32px !important; }"), "an app's own margin on the stage is the sheet's, 24 pt at 75%")
    }

    /// The page keeps the card you clicked: its cover, small, beside its name; the same small
    /// cover as under "More like this". A cover with an app says so in the gallery: a small tag,
    /// white on a dark pill, the same in light and dark.
    @Test func thePageKeepsItsCoverAndAppsAreMarked() throws {
        let src = try library
        let words = try #require(src.range(of: "private func words(_ e: TemplateCatalog.Entry) -> some View {"))
        #expect(src[words.lowerBound...].prefix(700).contains("Self.thumbnail(e.pick)"))
        #expect(src.contains("Self.thumbnail(r.pick)") && TemplateLibraryView.moreCover == 56)
        // All of a "More like this" tile takes the click, the gaps in it too.
        let more = try #require(src.range(of: "private func more(_ e: TemplateCatalog.Entry) -> some View {"))
        #expect(src[more.lowerBound...].prefix(2200).contains(".padding(.leading, 8)\n                        // All of the tile takes the click"))
        #expect(src[more.lowerBound...].prefix(2200).contains(".contentShape(.rect)"))
        #expect(TemplateLibraryWords.app == "App")
        // White on the pill over the lightest cover there could be is still 4.5:1 or more.
        let pill = 1 - SetupTemplateCard.tagGround
        let ground = pill <= 0.03928 ? pill / 12.92 : pow((pill + 0.055) / 1.055, 2.4)
        #expect((1 + 0.05) / (ground + 0.05) >= 4.5, "white on the tag's pill over a white cover")
        let cards = try SettingsHomeTests.source("Pane/Views/SetupCards.swift")
        #expect(cards.contains("Text(tag).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(.white)"))
    }

    /// No note's stage is more than about a quarter empty: its example has enough in it to fill
    /// the stage (9 November 2026: Reading list showed three rows over 40% of nothing).
    @Test(arguments: all.filter { !$0.app }) func noStageIsMoreThanAQuarterEmpty(_ e: TemplateCatalog.Entry) throws {
        let size = TemplateLibraryView.size, window = TemplateLibraryView.window(for: size)
        let view = NotePreview(markdown: e.example, given: TemplateFiles.example(e), whole: true)
            .padding(.horizontal, TemplateLibraryView.margin - 20)
            .frame(width: window.width, height: window.height, alignment: .topLeading)
            .background(Color.black)
            .environment(\.colorScheme, .dark)
        let r = ImageRenderer(content: view)
        r.scale = 1
        let image = try #require(r.cgImage)
        let p = try #require(Pixels(image))
        var last = 0
        for y in 0..<p.height {
            for x in stride(from: 0, to: p.width, by: 2) where p.rgb(at: y * p.width + x) & 0xFF > 90 { last = y; break }
        }
        // Of the whole stage, with the "Example" row over the note.
        let stage = TemplateLibraryView.stageHeight(for: size)
        let filled = (CGFloat(last) + TemplateLibraryView.exampleRow) / stage
        #expect(filled >= 0.72, "\(e.slug): its words end \(Int(filled * 100))% down the stage")
    }

    // MARK: The stage

    /// A note on the stage ends on whole blocks: none cut through at the foot, never a heading
    /// or a gap last, and its tables at the stage's width (council round 3).
    @Test func aNoteEndsOnWholeBlocks() throws {
        // Four 20 pt blocks, 4 pt apart, in 70 pt: three fit (20 + 4 + 20 + 4 + 20 = 68).
        #expect(WholeBlocks.shown(heights: [20, 20, 20, 20], headings: [false, false, false, false], gaps: [false, false, false, false], room: 70, spacing: 4) == 3)
        // The third is a heading: it goes too, with the gap above it.
        #expect(WholeBlocks.shown(heights: [20, 8, 20, 20], headings: [false, false, true, false], gaps: [false, true, false, false], room: 60, spacing: 4) == 1)
        // When not one whole block fits, it all shows and runs off the foot: never an empty window.
        #expect(WholeBlocks.shown(heights: [20, 120, 20], headings: [true, false, false], gaps: [false, false, false], room: 60, spacing: 4) == 3)
        // Rows joined to the one above take no space between; a header row is never last.
        #expect(WholeBlocks.shown(heights: [20, 30, 30, 30], headings: [true, false, false, false], gaps: [false, false, false, false],
                                  joined: [false, true, true, true], room: 80, spacing: 4) == 3)
        let src = try library
        #expect(src.contains("NotePreview(markdown: e.example, given: TemplateFiles.example(e, room: Self.lineRoom(for: size)), whole: true)"))
        #expect(NotePreview.shownCell("2026-11-06") == "6\u{00A0}Nov")
        #expect(NotePreview.shownCell("120 kg x 3") == "120\u{00A0}kg\u{00A0}×\u{00A0}3")
    }

    /// The stage skips sections still empty in the example, and a line all bold leads into its
    /// items like a heading: neither ends the stage alone. A table keeps its first five columns.
    @Test func theStagesTrim() throws {
        let blocks = TemplateLibraryView.staged("List\n\nIntro line.\n\n## Fruit\n- [ ] Lemons\n\n## Meat\n\n## Cupboard\n- [ ] Rice\n\n## Frozen\n")
        #expect(blocks.first == .heading(2, "Fruit"), "from the first heading, without the title and the opening line")
        #expect(!blocks.contains(.heading(2, "Meat")) && !blocks.contains(.heading(2, "Frozen")), "\(blocks)")
        #expect(blocks.contains(.heading(2, "Cupboard")))
        #expect(NotePreview.Block.paragraph("**Fruit and veg**").leadsIn)
        let wide = TemplateLibraryView.staged("T\n\n## Bugs\n| A | B | C | D | E | F |\n| --- | --- | --- | --- | --- | --- |\n| 1 | 2 | 3 | 4 | 5 | 6 |\n")
        #expect(wide.contains(.table(header: ["A", "B", "C", "D", "E"], rows: [["1", "2", "3", "4", "5"]])), "\(wide)")
        #expect(TemplateLibraryView.stageColumns == 5)
        // A stage too narrow for five columns' words shows fewer, never one cut at its side.
        let job = try entry("job-hunt")
        for block in TemplateLibraryView.staged(job.example, room: 340) {
            guard case .table(let header, let rows) = block else { continue }
            #expect(header.count < 5 && NotePreview.leastWidths(header: header, rows: rows).reduce(0, +) <= 340, "\(header)")
        }
    }

    /// The live app on the stage is drawn with the tokens its picture was drawn with, so the app
    /// that replaces the picture is the same size, layout and colours (see template-stage.css).
    @Test func theStageHasItsPicturesTokens() throws {
        let css = TemplateFiles.stageCSS
        let render = try SettingsHomeTests.source("scripts/page-render/render.ts")
        let block = try #require(css.range(of: "\n:root {"), "the stage's stylesheet sets the tokens, unlayered")
        let dark = try #require(css.range(of: "@media (prefers-color-scheme: dark) {\n  :root {", range: block.upperBound..<css.endIndex))
        let light = String(css[block.upperBound..<dark.lowerBound]), night = String(css[dark.upperBound...])
        let pairs = render.matches(of: /\["(--amber-[a-z-]+)", d \? "([^"]+)" : "([^"]+)"\]/)
        #expect(pairs.count == 13, "render.ts's colour tokens: \(pairs.count)")
        for m in pairs {
            #expect(light.contains("\(m.1): \(m.3);"), "\(m.1) in the light look is \(m.3)")
            #expect(night.contains("\(m.1): \(m.2);"), "\(m.1) in the dark look is \(m.2)")
        }
        for fixed in ["--amber-radius: 14px;", "--amber-radius-small: 10px;", "--amber-root-font: 17px/1.35 -apple-system, system-ui, sans-serif;"] {
            #expect(render.contains(fixed), "render.ts still says \(fixed)")
            #expect(light.contains(fixed), "the stage says \(fixed)")
        }
        for e in Self.all where e.app {
            let staged = try #require(TemplateFiles.project(e))
            // The project is JSON, so the font's "/" is written "\/": the size is enough to tell.
            #expect(staged.contains("--amber-root-font: 17px"), "\(e.slug): the tokens are in its page on the stage")
            #expect(!(e.appProject ?? "").contains("--amber-root-font: 17px"), "\(e.slug): Make adds the app without them")
        }
    }

    /// An app's picture is the live app's size on the full sheet's stage, at 2x: it stands in for
    /// the app until it has drawn, so the two are the same layout. The app shows whole, in its two
    /// columns (at 533 px wide it showed one habit of four), at 75%.
    @Test func theAppPictureIsTheLiveViewsSize() throws {
        let window = TemplateLibraryView.window(for: TemplateLibraryView.size)
        let css = TemplateAppPreview.css(for: window)
        #expect(css == CGSize(width: 832, height: 619) && TemplateAppPreview.zoom(for: window) == 0.75)
        let script = try SettingsHomeTests.source("scripts/template-stage-pictures.ts")
        #expect(script.contains("[{ name: \"stage\", width: 832, height: 619 }, { name: \"stage-narrow\", width: 533, height: 640 }]") && script.contains("scale: 2 }"), "the pictures are drawn at that size, at 2x")
        for e in Self.all where e.app {
            for dark in [false, true] {
                let picture = try #require(TemplateFiles.picture(e, dark: dark), "\(e.slug)")
                let rep = try #require(picture.representations.first)
                #expect(rep.pixelsWide == Int(css.width) * 2 && rep.pixelsHigh == Int(css.height) * 2, "\(e.slug): \(rep.pixelsWide) x \(rep.pixelsHigh)")
            }
            #expect(Bundle.main.url(forResource: "template-app-\(e.slug)-stage-small-dark", withExtension: "jpg") == nil, "one stage, one picture")
        }
        // A narrow sheet shows the app in its one column, at a size to read, from its own picture.
        let small = TemplateLibraryView.window(for: TemplateLibraryView.size(on: CGSize(width: 800, height: 560)))
        #expect(TemplateAppPreview.css(for: small, narrow: true).width == 533 && TemplateAppPreview.zoom(for: small, narrow: true) > 0.7)
        for e in Self.all where e.app {
            let rep = try #require(TemplateFiles.picture(e, dark: true, narrow: true)?.representations.first, "\(e.slug)")
            #expect(rep.pixelsWide == 1066 && rep.pixelsHigh == 1280)
        }
    }

    /// The stage shows each app in use, on its sample data moved to today, in the live app and
    /// in its picture; Make adds the starting data and the app as it is. The app shows today: the
    /// stage's script no longer sets its clock to a Thursday.
    @Test func theStageShowsTheAppInUseTodayAndMakeAddsTheStart() throws {
        let apps = Self.all.filter(\.app)
        #expect(apps.count == 4)
        for e in apps {
            let sample = TemplateFiles.sample(e)
            let values = try #require(sample["values"] as? [String: Any], "\(e.slug)")
            #expect(!NSDictionary(dictionary: sample).isEqual(to: e.appData), "\(e.slug): the stage isn't the empty start")
            switch e.slug {
            case "habit-tracker": #expect(((values["days"] as? [String: Any])?.count ?? 0) >= 7, "habits ticked this week")
            case "budget-log": #expect(((values["expenses"] as? [Any])?.count ?? 0) >= 5, "expenses this month")
            case "study-flashcards": #expect(((values["cards"] as? [Any])?.count ?? 0) > ((e.appData["values"] as? [String: Any])?["cards"] as? [Any])?.count ?? 0, "cards in two topics")
            case "trip-plan": #expect(values["trip"] is [String: Any] && ((values["days"] as? [Any])?.count ?? 0) == 5, "a planned trip")
            default: Issue.record("an app with no sample: \(e.slug)")
            }
            let draft = try #require(e.draft(apps: true))
            #expect(NSDictionary(dictionary: NotePageData.decode(draft.appData)).isEqual(to: e.appData), "\(e.slug): Make adds the starting data")
            #expect(draft.appProject == e.appProject && !(draft.appProject ?? "").contains("<style>"))
            let staged = try #require(TemplateFiles.project(e))
            #expect(staged.contains("nav[aria-label=\\\"Screens\\\"]") || staged.contains("nav[aria-label=\"Screens\"]"), "\(e.slug): the stage's stylesheet is in its page")
        }
        // Today, moved from the samples' day.
        var c = DateComponents(); (c.year, c.month, c.day, c.hour) = (2026, 11, 11, 9)
        let today = try #require(Calendar(identifier: .gregorian).date(from: c))
        #expect(TemplateSample.days(to: today) == 3)
        let moved = TemplateSample.moved(["days": ["2026-11-08": ["walk": 1]], "trip": ["start": "2026-11-22", "name": "2026-11-08 trip"]] as [String: Any], days: 3) as? [String: Any]
        #expect(Set((moved?["days"] as? [String: Any] ?? [:]).keys) == ["2026-11-11"])
        #expect((moved?["trip"] as? [String: Any])?["name"] as? String == "2026-11-08 trip", "only whole dates move")
        let src = try library
        #expect(src.contains("preview: doc ?? TemplateFiles.sample(entry)") && !src.contains("stageDay"), "the live app runs on the sample, today")
        let js = TemplateFiles.stageScript
        #expect(!js.isEmpty && !js.contains("STAGE_WEEKDAY") && !js.contains("window.Date ="), "the app's clock is the real one")
        #expect(js.contains("const FADE = 16"), "the stage's 12 pt fade at 75%")
        #expect(TemplateLibraryView.footFade / TemplateAppPreview.zoom(for: TemplateLibraryView.window(for: TemplateLibraryView.size)) == 16)
        #expect(js.contains("const cuts = [{ left: -Infinity, right: Infinity, y: limit() }]"), "the foot is worked out per column")
        let script = try SettingsHomeTests.source("scripts/template-stage-pictures.ts")
        #expect(script.contains(".sample.json") && script.contains("staged(") && !script.contains("getDay()"), "the pictures are drawn from the same sample and trim, today")
    }

    // MARK: The covers

    @Test func coversAreReadOnce() throws {
        let pick = try #require(Self.all.first).pick
        _ = pick.image
        #expect(SetupCards.Pick.covers.object(forKey: pick.cover as NSString) != nil)
    }

    /// A cover in the library is its art and its name, the name at the cover's foot; it reads on
    /// every cover (4.5:1 or more: it sits where the caption's last line sat). The first-run
    /// gallery's cards keep their caption, which reads too.
    @Test func everyNameReadsOnItsCover() throws {
        func card(_ pick: SetupCards.Pick, _ width: CGFloat, _ words: SetupTemplateCard.Words) throws -> Pixels {
            let r = ImageRenderer(content: SetupTemplateCard(pick: pick, width: width, words: words) {}.environment(\.colorScheme, .light))
            r.scale = 2
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        // Where `with` differs from `without`: the letters added; the contrast of the ink on the
        // mean colour of the cover under them.
        func contrast(_ pick: SetupCards.Pick, with: Pixels, without: Pixels, cover: Pixels) -> (Double, Int) {
            var lum = 0.0, n = 0
            for i in 0..<(with.width * with.height) {
                guard with.difference(without, at: i) > 60 else { continue }
                lum += SetupCards.luminance(cover.rgb(at: i)); n += 1
            }
            guard n > 0 else { return (0, 0) }
            let ink = SetupCards.luminance(pick.inkRGB), ground = lum / Double(n)
            return ((max(ink, ground) + 0.05) / (min(ink, ground) + 0.05), n)
        }
        let widths = [TemplateLibraryView.size.width, 720].map { TemplateLibraryView.cardWidth(row: $0 - 48, gap: 16) }
        for e in Self.all {
            for width in widths {
                let none = try card(e.pick, width, .none), name = try card(e.pick, width, .name)
                let (reads, letters) = contrast(e.pick, with: name, without: none, cover: none)
                #expect(letters > 200, "\(e.slug) at \(width): the name's letters found (\(letters) pixels)")
                #expect(reads >= 4.5, "\(e.slug) at \(width): the name at \(String(format: "%.2f", reads)):1")
            }
        }
        for pick in SetupCards.picks {
            let width = SetupTemplateCard.size.width
            let none = try card(pick, width, .none), title = try card(pick, width, .title), both = try card(pick, width, .both)
            let (caption, letters) = contrast(pick, with: both, without: title, cover: none)
            let (heading, _) = contrast(pick, with: title, without: none, cover: none)
            #expect(letters > 200 && caption >= 4.5, "\(pick.slug): the caption at \(String(format: "%.2f", caption)):1")
            #expect(heading >= 3, "\(pick.slug): the title at \(String(format: "%.2f", heading)):1")
        }
    }

    /// A press on a card is the design system's card press, eased: the plain style dimmed the
    /// whole cover hard for the length of the press, a flash on every pick. Under the pointer in
    /// dark mode a cover gets a light ring and a touch of brightness: a black shadow on a
    /// near-black sheet showed nothing.
    @Test func aCardsPressAndHover() throws {
        let src = try SettingsHomeTests.source("Pane/Views/SetupCards.swift")
        let card = try #require(src.range(of: "struct SetupTemplateCard: View"))
        let end = try #require(src.range(of: "\nextension Color {", range: card.upperBound..<src.endIndex))
        let body = src[card.lowerBound..<end.lowerBound]
        #expect(body.components(separatedBy: ".buttonStyle(CardPress())").count == 3, "both of the card's looks")
        #expect(!body.contains(".buttonStyle(.plain)"))
        #expect(SetupTemplateCard.hoverRing(dark: true, hover: true) >= 0.4 && SetupTemplateCard.hoverBrightness(dark: true, hover: true) > 0)
        #expect(SetupTemplateCard.hoverRing(dark: true, hover: false) == 0 && SetupTemplateCard.hoverRing(dark: false, hover: true) == 0)
        // In the library a cover stays where it is under the pointer: a ring and a touch of light
        // or shade, no lift and no shadow, so its neighbours never seem to move.
        #expect(!SetupTemplateCard.lifts(.name) && SetupTemplateCard.lifts(.both))
        #expect(SetupTemplateCard.quietRing(dark: true, hover: true) >= 0.4 && SetupTemplateCard.quietRing(dark: false, hover: true) > 0.2)
        #expect(SetupTemplateCard.quietBrightness(dark: true, hover: true) > 0 && SetupTemplateCard.quietBrightness(dark: false, hover: true) < 0)
        #expect(SetupTemplateCard.quietRing(dark: true, hover: false) == 0 && SetupTemplateCard.quietBrightness(dark: false, hover: false) == 0)
        #expect(body.contains(".offset(y: hover && !reduceMotion && Self.lifts(words) ? -3 : 0)") && body.contains(".shadow(color: .black.opacity(hover && Self.lifts(words) ? 0.28 : 0)"))
    }

    /// No ask tells the AI made-up facts about you: Make sends it as it is. Each asks you first.
    @Test(arguments: all) func everyAskAsksYouFirst(_ e: TemplateCatalog.Entry) {
        #expect(e.ask.hasPrefix("Ask "), "\(e.slug): \(e.ask)")
        #expect(!e.ask.contains { $0.isNumber }, "no amounts, dates or counts: \(e.ask)")
        #expect(e.ask.hasSuffix("."), "a whole sentence: \(e.ask)")
    }

    /// The first-run gallery's asks have the AI ask too, never a trip or a week it made up.
    @Test func theGalleryAsksYouFirst() {
        for pick in SetupCards.picks {
            #expect(!pick.ask.contains { $0.isNumber }, "\(pick.slug): \(pick.ask)")
            #expect(!pick.ask.contains("Lisbon") && !pick.ask.contains("Friday") && !pick.ask.contains("mushrooms"), "\(pick.slug): \(pick.ask)")
        }
    }

    /// Descriptions in the app say what the template does, without the site's "A free … in a
    /// note:" and "in Pinto Notes" (council round 3: ad copy inside the app).
    @Test(arguments: all) func theDescriptionIsPlain(_ e: TemplateCatalog.Entry) throws {
        let d = e.shownDescription
        #expect(!d.lowercased().contains("free") && !d.contains("in Pinto Notes") && !d.contains("in a note:"), "\(e.slug): \(d)")
        let first = try #require(d.first)
        #expect(first.isUppercase && d.hasSuffix("."), "\(e.slug): \(d)")
    }

    /// A caption or a description never ends on one word alone on its last line.
    @Test func noLineEndsOnOneWordAlone() throws {
        #expect(NoWidow.kept("What you chose, what you didn't, and why.") == "What you chose, what you didn't, and\u{00A0}why.")
        #expect(NoWidow.kept("Edit it yourself, or let your AI fill it in.").hasSuffix("it\u{00A0}in."))
        #expect(NoWidow.kept("Alone") == "Alone")
        #expect(NoWidow.kept("A short evening check-in that shows patterns.").contains("check\u{2011}in"), "a hyphenated word never breaks")
        let s = "Log what you spend with quick add. Your AI files it on the left."
        let kept = NoWidow.kept(s, phrases: true)
        #expect(kept.contains("quick\u{00A0}add.") && kept.contains("on\u{00A0}the\u{00A0}left."), "\(kept)")
    }

    // MARK: After Make

    /// The sheet that greets a note just made is all there when it opens on the Mac (it built in
    /// line by line), as tall as what it holds (a set height left 100 pt of nothing under Start),
    /// and is put away when the library is opened again.
    @Test func theSheetAfterMakeIsAllThereAndNoTallerThanItsWords() throws {
        let src = try SettingsHomeTests.source("Pane/Views/FirstOpen.swift")
        #expect(src.contains("func entrance(_ shown: Bool, _ i: Int, _ reduceMotion: Bool) -> some View {\n        #if os(macOS)"))
        #expect(!src.contains(".frame(width: 460, height: moment.isApp ? 600 : 460)"))
        #expect(src.contains(".fixedSize(horizontal: false, vertical: true)\n            .frame(width: 460)\n            .background(Color.notePage)\n            .interactiveDismissDisabled()\n        #endif\n    }\n\n    /// Under Start on the Mac"))
        let moment = FirstOpen.Moment(note: UUID(), isApp: true, title: "Trip plan", description: nil, ask: "Ask where and when I'm going and what I enjoy, then plan the trip.", slug: "trip-plan", preview: nil, full: true)
        let host = NSHostingView(rootView: FirstOpenSheet(moment: moment) {})
        host.layoutSubtreeIfNeeded()
        let fit = host.fittingSize
        #expect(fit.width == 460 && fit.height < 560, "as tall as its words: \(fit)")
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("for m in greeting { FirstOpen.shared.start(m) }"))
        #expect(!root.contains("if !ai.asks { try? await Task.sleep(for: .seconds(0.9)) }"), "Make closes the library at once")
    }
}

/// Pictures of the template library (9 November 2026, the two pages): the gallery's states and
/// three templates' pages, in light and dark, drawn offscreen as its sheet shows them.
@MainActor @Suite struct TemplateLibraryShots {
    static let dir = ProcessInfo.processInfo.environment["AMBER_TEMPLATE_SHOTS"].map { URL(fileURLWithPath: $0) }

    @Test(arguments: [false, true]) func shots(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let c = TemplateCatalog.shipped
        let big = TemplateLibraryView.size, small = TemplateLibraryView.size(on: CGSize(width: 800, height: 560))
        func entry(_ slug: String) -> TemplateCatalog.Entry? { c.entries.first { $0.slug == slug } }
        let states: [(String, TemplateCatalog.Entry?, String, String, CGSize, [SetupCards.AI], TemplateCatalog.Entry?)] = [
            ("1-gallery", nil, "All", "", big, [.chatgpt, .claude], nil),
            ("1b-gallery-keys-on-a-cover", nil, "All", "", big, [.chatgpt, .claude], entry("reading-list")),
            ("2-gallery-apps", nil, "Apps", "", big, [.chatgpt, .claude], nil),
            ("3-gallery-search-trip", nil, "All", "trip", big, [.chatgpt, .claude], nil),
            ("4-gallery-nothing-matches", nil, "All", "zebra", big, [.chatgpt, .claude], nil),
            ("5-gallery-small-window", nil, "All", "", small, [.chatgpt, .claude], nil),
            ("6-page-app-habits", entry("habit-tracker"), "All", "", big, [.chatgpt, .claude], nil),
            ("7-page-table-reading-list", entry("reading-list"), "All", "", big, [.chatgpt, .claude], nil),
            ("8-page-plain-meeting-notes", entry("meeting-notes"), "All", "", big, [.chatgpt, .claude], nil),
            ("9-page-no-ai-app", entry("trip-plan"), "All", "", big, [.other], nil),
            ("9b-page-no-ai-note", entry("workout-log"), "All", "", big, [.other], nil),
            ("10-page-claude", entry("bug-triage"), "All", "", big, [.claude, .chatgpt], nil),
            ("11-page-small-window", entry("budget-log"), "All", "", small, [.chatgpt, .claude], nil),
            ("11b-page-small-window-note", entry("job-hunt"), "All", "", small, [.chatgpt, .claude], nil),
        ]
        for (name, open, filter, query, size, ais, focused) in states {
            let view = TemplateLibraryView(catalog: c, ais: ais, open: open, filter: filter, query: query, focused: focused, size: size)
                .environment(\.inSheet, true)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(SetupCards.ground)
                .tint(Color(PColor.paneAccent))
            try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"), size: size, dark: dark)
        }
    }
}

/// Every template's page, one picture each, light and dark: what each one shows on its stage and
/// says beside it, to read side by side.
@MainActor @Suite struct EveryTemplateShots {
    static let dir = ProcessInfo.processInfo.environment["AMBER_TEMPLATE_ALL_SHOTS"].map { URL(fileURLWithPath: $0) }

    @Test(arguments: [false, true]) func shots(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let c = TemplateCatalog.shipped
        let size = TemplateLibraryView.size
        for (i, e) in c.entries.enumerated() {
            let view = TemplateLibraryView(catalog: c, ais: [.chatgpt, .claude], open: e, size: size)
                .environment(\.inSheet, true)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(SetupCards.ground)
                .tint(Color(PColor.paneAccent))
            let name = String(format: "%02d-%@-%@.png", i + 1, e.slug, dark ? "dark" : "light")
            try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: name), size: size, dark: dark)
        }
    }
}

// MARK: Every template, as a person uses it (Emil, 8 November 2026: "I don't trust that they work")

extension TemplateCatalog.Entry: CustomTestStringConvertible {
    public var testDescription: String { slug }
}

/// Each template in the shipped catalog, run the way a person uses it: it's listed with its
/// pictures, Make adds its note (and an app's app and data) offline, the note draws as the editor
/// draws it, the AI opens with the right ask, and Make again opens the same note.
@MainActor @Suite struct EveryTemplateTests {
    nonisolated static let all = TemplateCatalog.shipped.entries

    private func store() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    private func ledger(account: UUID? = UUID()) -> NoteSourceLedger {
        NoteSourceLedger(defaults: UserDefaults(suiteName: "templates.test.\(UUID().uuidString)")!, account: account)
    }

    /// The site, out of reach: Make never needs it for a template the app ships.
    struct Offline: NoteSourceFetching {
        func draft(for link: NoteSourceLink) async throws -> NoteDraft { throw NoteSourceError.offline }
    }

    @Test func theCatalogHasEveryTemplate() {
        #expect(Self.all.count == 23)
        #expect(Set(Self.all.map(\.slug)).count == Self.all.count, "no slug twice")
        #expect(Self.all.filter(\.app).map(\.slug).sorted() == ["budget-log", "habit-tracker", "study-flashcards", "trip-plan"])
        let byKind = TemplateCatalog.filters.dropFirst(2).flatMap { TemplateCatalog.shipped.shown(filter: $0, query: "") }
        #expect(byKind.count == Self.all.count, "every template is under exactly one kind")
    }

    /// 1. Listed, with its words, cover and kind; an app with both pictures, its project and data.
    @Test(arguments: all) func isListedWithItsPictures(_ e: TemplateCatalog.Entry) throws {
        for (name, s) in [("title", e.title), ("tagline", e.tagline), ("description", e.description), ("ask", e.ask), ("example", e.example)] {
            #expect(!s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, "\(name)")
        }
        #expect(NoteSourceLink(kind: .template, slug: e.slug).isValid)
        #expect(e.ground.count == 6 && UInt32(e.ground, radix: 16) != nil)
        #expect(Bundle.main.url(forResource: e.pick.cover, withExtension: "jpg").flatMap(NSImage.init(contentsOf:)) != nil, "cover")
        #expect(TemplateCatalog.filters.contains(e.category))
        #expect(TemplateCatalog.shipped.shown(filter: e.category, query: "").contains(e))
        #expect(TemplateCatalog.shipped.shown(filter: "Apps", query: "").contains(e) == e.app)
        #expect(TemplateCatalog.shipped.shown(filter: "All", query: e.title).contains(e), "search finds it by name")
        let note = try #require(e.note, "the note Make adds")
        #expect(note.components(separatedBy: "\n").first == e.title, "its first line is its title")
        #expect(e.folder?.isEmpty == false)
        #expect(e.example.components(separatedBy: "\n").first == e.title)
        if e.app {
            for dark in [false, true] { #expect(e.appPicture(dark: dark) != nil, "picture, dark: \(dark)") }
            let project = try #require(e.appProject)
            #expect(NotePageProject.parse(project) != nil, "the project reads as an app")
            let url = try #require(Bundle.main.url(forResource: "template-app-\(e.slug).data", withExtension: "json"))
            let data = try Data(contentsOf: url)
            #expect(data.count <= NotePageData.maxBytes)
            let doc = try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
            #expect(!doc.isEmpty && Set(doc.keys).isSubset(of: ["values", "collections"]), "\(doc.keys)")
            #expect(!e.appData.isEmpty)
        } else {
            #expect(e.appProject == nil && e.appPicture(dark: false) == nil)
        }
    }

    /// 2 to 4. Make with ChatGPT, offline: the note is added in its folder with the template's
    /// words, an app gets its project and data, the ask is copied and ChatGPT opens with it.
    /// Make again (with Claude) opens the same note: never two of the same name.
    @Test(arguments: all) func makeAddsTheNoteAndOpensTheAI(_ e: TemplateCatalog.Entry) async throws {
        let container = try store()
        let ctx = container.mainContext
        let ledger = ledger()
        var copied: [String] = []
        var opened: [URL] = []
        let made = await TemplateMaking.make(e, with: .chatgpt, context: ctx, account: nil, source: ShippedTemplates(site: Offline()), ledger: ledger,
                                             copy: { copied.append($0) }, open: { opened.append($0) })
        let id = try #require(made, "the note is added with no network")
        let note = try #require(ctx.note(id))
        #expect(note.title == e.title)
        #expect(note.body == e.note)
        #expect(note.folder?.name == e.folder && note.folder?.parent == nil, "in its own folder, made for it")
        #expect(note.dirty, "it syncs")
        let prompt = "In Pinto Notes, use my \(e.title) note. \(TemplateCatalog.Entry.sendable(e.ask))"
        #expect(copied == [prompt])
        #expect(!prompt.contains("\u{2026}") && !prompt.hasSuffix(","), "no gap left for words")
        let page = try #require(opened.first)
        #expect(opened.count == 1 && page.host == "chatgpt.com")
        #expect(URLComponents(url: page, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "q" }?.value == prompt)
        if e.app {
            #expect(NotePageStore.shared[id]?.html == e.appProject, "the note is the app from the start")
            #expect(NSDictionary(dictionary: NotePageDataStore.shared.doc(id)).isEqual(to: e.appData), "on the template's data")
            #expect(NotePageDataStore.shared.dirty.contains(id), "the data syncs")
        } else {
            #expect(NotePageStore.shared[id] == nil)
        }
        let again = await TemplateMaking.make(e, with: .claude, context: ctx, account: nil, source: ShippedTemplates(site: Offline()), ledger: ledger,
                                              copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(again == id)
        #expect(try ctx.fetch(FetchDescriptor<Note>()).filter { $0.deletedAt == nil && $0.title == e.title }.count == 1)
        #expect(opened.last?.host == "claude.ai" && opened.last?.path == "/new" && copied.last == prompt)
    }

    /// 2. The note and the filled-in example draw as the editor draws them: every table a grid
    /// (typed where the template types it), inline marks that read, no link to a missing note.
    @Test(arguments: all) func theNoteDrawsInTheEditor(_ e: TemplateCatalog.Entry) async throws {
        let body = try #require(e.note)
        for (which, md) in [("note", body), ("example", e.example)] {
            let blocks = NotePreview.blocks(md)
            let tables = blocks.filter { if case .table = $0 { true } else { false } }.count
            let structure = NoteStructure(md)
            #expect(structure.grids.count == tables, "\(which): every table is a grid")
            let typed = md.components(separatedBy: "\n").filter { $0.hasPrefix("<!-- pane-table:") }.count
            #expect(structure.grids.filter { $0.types != nil }.count == typed, "\(which): every typed table keeps its types")
            #expect(TypedTable.find(in: md).count == typed)
            for g in structure.grids {
                #expect(!g.rows.isEmpty && g.columns > 1, "\(which): a table with its header")
                #expect(g.rows.allSatisfy { $0.count == g.columns }, "\(which): rows as wide as the header")
            }
            for case .paragraph(let s) in blocks {
                #expect((try? AttributedString(markdown: s, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))) != nil, "\(which): \(s)")
            }
            #expect(!md.contains("[["), "\(which): no wiki link to a note you don't have")
        }
        // In the real editor, offscreen: the tables show as grids.
        let h = await EditorHarness(body, focus: false)
        defer { h.close() }
        #expect(h.gridCount == NoteStructure(body).grids.count)
        if ProcessInfo.processInfo.environment["AMBER_QA_SHOTS"] != nil { await h.snapshot("template-\(e.slug)") }
    }

    /// 4 and 5. No AI that opens from a link (signed out, or none connected): the button says
    /// Add the note, and Make adds the note and nothing else: nothing opens, and nothing goes on
    /// the clipboard unasked (the page's arrow has "Copy the prompt").
    @Test func withNoAIMakeAddsTheNoteAndNothingElse() async throws {
        #expect(TemplateMaking.ais([]) == [.other])
        let container = try store()
        let e = try #require(Self.all.first { $0.slug == "meeting-notes" })
        var copied: [String] = []
        var opened: [URL] = []
        let id = await TemplateMaking.make(e, with: .other, context: container.mainContext, account: nil, source: ShippedTemplates(site: Offline()),
                                           ledger: ledger(account: nil), copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(id != nil && opened.isEmpty && copied.isEmpty)
        #expect(SetupCards.prompt(e.pick) == "In Pinto Notes, use my Meeting notes note. Ask me for my meeting notes or transcript, then add the summary and action items.")
    }

    /// 5. A folder of that name you already have (any case) takes the note; a note you put in
    /// Recently Deleted is made again rather than opened.
    @Test func makeUsesYourFolderAndMakesADeletedNoteAgain() async throws {
        let container = try store()
        let ctx = container.mainContext
        let work = ctx.createFolder(named: "work")
        let e = try #require(Self.all.first { $0.slug == "decision-log" })
        let ledger = ledger()
        let made = await TemplateMaking.make(e, with: .other, context: ctx, account: nil, source: ShippedTemplates(site: Offline()), ledger: ledger, copy: { _ in }, open: { _ in })
        let first = try #require(made)
        #expect(ctx.note(first)?.folder?.id == work.id, "no second Work folder")
        ctx.note(first)?.trashedAt = .now
        let second = await TemplateMaking.make(e, with: .other, context: ctx, account: nil, source: ShippedTemplates(site: Offline()), ledger: ledger, copy: { _ in }, open: { _ in })
        #expect(second != nil && second != first, "the one in Recently Deleted isn't opened")
    }

    /// A template this build doesn't ship (one the site added since) comes from the site; with
    /// the site out of reach, Make adds nothing and asks the AI about nothing.
    @Test func aTemplateTheAppDoesNotShipComesFromTheSite() async throws {
        struct Site: NoteSourceFetching {
            func draft(for link: NoteSourceLink) async throws -> NoteDraft { NoteDraft(link: link, title: "New one", body: "New one\n\nBody", leftOut: 0) }
        }
        let d = try await ShippedTemplates(site: Site()).draft(for: NoteSourceLink(kind: .template, slug: "brand-new"))
        #expect(d.title == "New one")
        let e = try JSONDecoder().decode(TemplateCatalog.Entry.self, from: JSONSerialization.data(withJSONObject: [
            "slug": "brand-new", "title": "New", "tagline": "t", "description": "d", "category": "Work", "app": false, "ground": "123456", "ask": "a", "example": "New",
        ]))
        let container = try store()
        var opened: [URL] = []
        var copied: [String] = []
        let id = await TemplateMaking.make(e, with: .chatgpt, context: container.mainContext, account: nil, source: ShippedTemplates(site: Offline()), ledger: ledger(),
                                           copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(id == nil && opened.isEmpty && copied.isEmpty, "no note, so no ask about it")
    }

    /// An ask with a gap for your own words is sent without the gap.
    @Test func askGapsAreLeftOut() {
        #expect(TemplateCatalog.Entry.sendable("Here are my notes from the pricing sync: \u{2026}") == "Here are my notes from the pricing sync:")
        #expect(TemplateCatalog.Entry.sendable("Save this one: Senior designer at Northwind, \u{2026}") == "Save this one: Senior designer at Northwind")
        #expect(TemplateCatalog.Entry.sendable("Plan dinners for this week.") == "Plan dinners for this week.")
    }

    /// Every ask is a whole request: none ends on a colon or a gap, waiting for words the person
    /// never gets to add (council round 2: "pricing sync:" sent to ChatGPT with nothing after it).
    @Test(arguments: all) func everyAskIsAWholeRequest(_ e: TemplateCatalog.Entry) {
        let ask = TemplateCatalog.Entry.sendable(e.ask)
        #expect(ask == e.ask, "shown, copied and sent are the same words: \(e.ask)")
        #expect(!ask.hasSuffix(":") && !ask.hasSuffix(",") && !ask.contains("\u{2026}"), "\(e.slug): \(ask)")
    }
}

/// A picture's pixels as 8-bit sRGB, read fast (colorAt per pixel took minutes over every cover).
struct Pixels {
    let width: Int, height: Int
    private let bytes: [UInt8]

    init?(_ image: CGImage) {
        let (w, h) = (image.width, image.height)
        var data = [UInt8](repeating: 0, count: w * h * 4)
        let drew = data.withUnsafeMutableBytes { raw -> Bool in
            guard let ctx = CGContext(data: raw.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { return false }
            ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
            ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
            ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard drew else { return nil }
        (width, height, bytes) = (w, h, data)
    }

    /// Pixel `i` (row by row from the top left) as 0xRRGGBB.
    func rgb(at i: Int) -> UInt32 { UInt32(bytes[i * 4]) << 16 | UInt32(bytes[i * 4 + 1]) << 8 | UInt32(bytes[i * 4 + 2]) }

    /// The summed channel difference between pixel `i` here and pixel `other` (by default `i`) there.
    func difference(_ there: Pixels, at i: Int, other: Int? = nil) -> Int {
        let j = other ?? i
        return (0..<3).reduce(0) { $0 + abs(Int(bytes[i * 4 + $1]) - Int(there.bytes[j * 4 + $1])) }
    }
}
#endif
