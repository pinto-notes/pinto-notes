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
        #expect(src.components(separatedBy: "Text(e.title).font(.system(size: name, weight: .bold))").count == 2)
        #expect(src.contains("TemplateCatalog.Entry.sendable(prompt(e, p))"))
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

    /// Nothing is open at rest: the gallery. Under a template's page it keeps its place (its
    /// scroll, kind and search), out of sight, taking no clicks. A cover is its art with its name
    /// and a line under it; none is picked at rest.
    @Test func aPageOpensAndTheGalleryKeepsItsPlace() throws {
        let src = try library
        #expect(src.contains("gallery(shown)\n                .opacity(open == nil ? 1 : 0)"))
        #expect(src.contains(".allowsHitTesting(open == nil && loading == nil)"))
        #expect(src.contains("page(e, shown: shown)\n                        .opacity(e == open ? 1 : 0)\n                        .allowsHitTesting(e == open)"))
        #expect(src.contains("SetupTemplateCard(pick: e.pick, width: width, captionBelow: true, selected: focused == e, line: TemplateLibraryWords.line(e), app: e.app, art: rhythm.art,"), "a cover is its art, its name and a line; the ring is the keys'")
        #expect(!src.contains("selected: current == e"), "no cover is picked at rest")
    }

    /// Between the gallery and a page, both ways, and from one template to the next, the sheet
    /// changes in one frame: no fade, no slide, nothing animated (dissolved, the covers showed
    /// through the page; faded out and then in, the sheet was empty in between: a white flash in
    /// the light, a blink in the dark). A page shows once its example is there.
    @Test func thePagesChangeInOneFrame() throws {
        typealias L = TemplateLibraryView
        let a = try entry("meeting-notes"), b = try entry("trip-plan")
        let src = try library
        let view = try #require(src.range(of: "struct TemplateLibraryView: View {")), kinds = try #require(src.range(of: "struct TemplateKinds: View {"))
        let body = String(src[view.lowerBound..<kinds.lowerBound])
        let show = try #require(body.range(of: "    private func show(_ e: TemplateCatalog.Entry?) {")), point = try #require(body.range(of: "    private func point(_ e: TemplateCatalog.Entry, _ on: Bool) {"))
        let moves = String(body[show.lowerBound..<point.lowerBound])
        #expect(!moves.contains("withAnimation") && !moves.contains("reduceMotion"), "no move is animated, so Reduce Motion has nothing to turn off")
        #expect(moves.components(separatedBy: "withTransaction(instant) {").count == 4, "back, getting a page ready, and showing it: each at once")
        #expect(!body.contains("galleryShown") && !body.contains("pageShown") && !body.contains("pageShift") && !body.contains("Self.slide"), "nothing fades or slides between pages")
        #expect(!body.contains(".transition("), "nothing fades out while another fades in")
        #expect(moves.components(separatedBy: "guard mine == move else { return }").count >= 2, "a move overtaken by the next stops")
        // A page is shown once its example is there: an app draws out of sight first (its picture
        // is of another day, and the app replacing it was a change you could see); what's showing
        // stays meanwhile, and a page that isn't ready in time shows anyway.
        #expect(L.readyBy > 0.2 && L.readyBy <= 0.6)
        #expect(moves.contains("withTransaction(instant) {\n            loading = e\n            warm = nil\n        }") && moves.contains("start.duration(to: .now) < .seconds(Self.readyBy)"))
        #expect(src.contains("ForEach(Self.pages(warm: warm, loading: loading, open: open), id: \\.slug) { e in"), "the page drawn out of sight is the page shown")
        // The cover the pointer rests on has its page got ready before any click, so a click
        // shows it at once; each page is laid out once, whichever of the three it is.
        #expect(L.warmAfter > 0.05 && L.warmAfter <= 0.2)
        #expect(L.pages(warm: a, loading: a, open: b) == [a, b] && L.pages(warm: nil, loading: nil, open: nil).isEmpty && L.pages(warm: a, loading: b, open: nil) == [a, b])
        #expect(src.contains("pointer: { on in point(e, on) }") && src.contains("guard pointed == e.slug, open == nil, loading == nil, warm != e else { return }"))
        #expect(src.contains("if warm != e { ready.remove(e.slug) }"), "the page the pointer rested on is there already")
        #expect(src.contains("TemplateAppPreview(entry: e, project: project, narrow: Self.narrow(size)) { id in\n                ready.insert(e.slug)"))
        #expect(src.components(separatedBy: ".onAppear { ready.insert(e.slug) }").count == 3, "a note is there as soon as it's laid out")
        #expect(src.contains("ready = true\n                                 drew(id)"))
        #expect(!src.contains("@State private var under"), "no second page is kept under the open one")
    }

    /// The arrow keys move a ring through the covers, a row up and down, one along left and
    /// right (left and right only while they wouldn't move the cursor in Search); on a page left
    /// and right walk the gallery's order. One cue at a time: with the ring out the covers have
    /// the keys and Search shows no caret; up from the first row gives them back to Search.
    @Test func arrowKeysWalkTheCoversAndThePages() throws {
        typealias L = TemplateLibraryView
        let shown = Array(Self.all.prefix(12))
        #expect(L.step(shown, from: nil, by: 1) == shown[0], "the first press lands on the first cover")
        #expect(L.step(shown, from: shown[0], by: 1) == shown[1])
        #expect(L.step(shown, from: shown[0], by: 5) == shown[5], "a row down, five across")
        #expect(L.step(shown, from: shown[0], by: -1) == shown[0])
        #expect(L.step(shown, from: shown[11], by: 5) == shown[11])
        #expect(L.step([], from: nil, by: 1) == nil)
        #expect(L.arrowsMoveCovers(searching: true, query: ""))
        #expect(!L.arrowsMoveCovers(searching: true, query: "tr"))
        #expect(L.arrowsMoveCovers(searching: false, query: "tr"))
        // Where an arrow takes the keys.
        #expect(L.arrow(shown, from: nil, rows: 1, along: 0, columns: 5, searching: true, query: "") == .cover(shown[0]), "down from Search: the first cover")
        #expect(L.arrow(shown, from: nil, rows: -1, along: 0, columns: 5, searching: true, query: "") == .nowhere, "up with no ring out")
        #expect(L.arrow(shown, from: shown[3], rows: -1, along: 0, columns: 5, searching: false, query: "") == .search, "up from the first row: back to Search")
        #expect(L.arrow(shown, from: shown[7], rows: -1, along: 0, columns: 5, searching: false, query: "") == .cover(shown[2]))
        #expect(L.arrow(shown, from: nil, rows: 0, along: 1, columns: 5, searching: true, query: "tr") == .nowhere, "the arrow moves the cursor in what's typed")
        #expect(L.arrow(shown, from: shown[1], rows: 0, along: 1, columns: 5, searching: false, query: "tr") == .cover(shown[2]))
        let last = try #require(Self.all.last)
        #expect(L.walk(shown, all: Self.all, open: shown[3]) == shown)
        #expect(L.walk(shown, all: Self.all, open: last) == Self.all, "opened from More like this: all of them")
        let src = try library
        #expect(src.contains(".onKeyPress(.return) { pressStop() || openFromKeys() ? .handled : .ignored }") && src.contains(".onSubmit { _ = openFromKeys() }"), "Return opens")
        // A page's arrows are its buttons' shortcuts (with nothing focused, key presses went nowhere).
        #expect(src.contains("Button(\"\") { _ = arrow(shown, rows: 0, along: -1) }.keyboardShortcut(e == open ? KeyboardShortcut(.leftArrow, modifiers: []) : nil)"))
        #expect(src.contains("Button(\"\") { _ = arrow(shown, rows: 0, along: 1) }.keyboardShortcut(e == open ? KeyboardShortcut(.rightArrow, modifiers: []) : nil)"))
        // The covers' grid and an open page take the focus besides Search, and neither draws a
        // ring of the system's: the ring on a cover, or on a page's button, is the cue.
        #expect(src.components(separatedBy: ".focusable(").count == 3 && src.components(separatedBy: ".focusEffectDisabled()").count == 3)
        #expect(src.contains(".focusable(true, interactions: .edit)\n        .focused($keys, equals: .covers)\n        .focusEffectDisabled()"))
        #expect(src.contains(".focused($keys, equals: .search)"))
        #expect(src.contains("case .cover(let to):\n            focused = to\n            keys = .covers"), "the ring out, Search gives up its caret")
        #expect(src.contains("case .search:\n            focused = nil\n            keys = .search"))
        #expect(src.contains(".onChange(of: keys) { _, now in if now == .search { focused = nil } }"), "Search with the keys: the ring goes")
        #expect(src.contains("keys = now == nil ? (focused == nil ? .search : .covers) : .page"))
        #expect(src.contains(".keyboardShortcut(e == open && !covered ? .cancelAction : nil)") && src.contains("KeyboardShortcut(\"[\", modifiers: .command)"), "Esc and Command-[ go back")
        #expect(src.contains("CardCloseButton(cancels: open == nil && !covered, action: close)") && src.contains("CardCloseButton(cancels: false, action: close)"), "Esc is the gallery's x only on the gallery")
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        let made = try #require(root.range(of: "private func templates(_ ais: [SetupCards.AI]) -> some View {"))
        #expect(!root[made.lowerBound...].prefix(1400).contains(".onExitCommand"), "Esc on a page goes back; it doesn't close the sheet")
    }

    /// A cover the keys move to comes into view by the nearest edge; one in view doesn't move.
    @Test func aCoverTheKeysReachComesInByTheNearestEdge() {
        let visible = CGRect(x: 0, y: 0, width: 900, height: 560)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: 40, width: 185, height: 257), visible: visible) == nil)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: 400, width: 185, height: 257), visible: visible) == .bottom)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: -100, width: 185, height: 257), visible: visible) == .top)
        #expect(TemplateLibraryView.revealAnchor(cell: nil, visible: visible) == .bottom, "a cover not laid out yet is below")
        // At rest the first row is in view, under the grid's own margin: the first arrow press moves nothing.
        #expect(TemplateLibraryView.revealSpare < TemplateLibraryView.gridTop)
        #expect(TemplateLibraryView.revealAnchor(cell: CGRect(x: 0, y: TemplateLibraryView.gridTop, width: 185, height: 183), visible: visible) == nil)
    }

    /// The sheet is never wider or taller than its window less a margin, and never larger than its
    /// full size, however large the window. Five covers go across the full sheet, three on the smallest.
    @Test func theSheetFitsItsWindowAndFiveCoversGoAcross() {
        typealias L = TemplateLibraryView
        #expect(L.size(on: CGSize(width: 1280, height: 800)) == L.size)
        #expect(L.size(on: CGSize(width: 1728, height: 1080)) == L.size && L.size(on: CGSize(width: 3000, height: 2000)) == L.size, "it doesn't grow with a large window")
        let small = L.size(on: CGSize(width: 800, height: 560))
        #expect(small.width <= 800 - 80 && small.height <= 560 - 60)
        #expect(L.size(on: CGSize(width: 500, height: 300)) == CGSize(width: 720, height: 500))
        let wide = L.cardWidth(row: L.size.width - 64, gap: 16)
        #expect(wide == 182, "five across, inside the sheet's 32 pt margins: \(wide)")
        #expect(abs(wide - SetupTemplateCard.size.width) < 30, "near the covers' own size")
        let narrow = L.cardWidth(row: 720 - 48, gap: 16)
        #expect(narrow == 213, "three across the smallest sheet: \(narrow)")
    }

    /// The rows' rhythm puts the sheet's foot inside a row of covers at rest, on the full sheet
    /// and the smallest: never through a name or the line under it (the smallest sheet's foot cut
    /// "Dinners and the shopping" in half). Scrolled, whatever is at the foot fades out.
    @Test func theSheetsFootFallsInsideARowOfCovers() throws {
        typealias L = TemplateLibraryView
        for size in [L.size, L.size(on: CGSize(width: 800, height: 560)), L.size(on: CGSize(width: 1000, height: 700)), L.size(on: CGSize(width: 900, height: 640))] {
            let viewport = size.height - L.topRow(for: size) - L.subtitleRow
            let width = L.cardWidth(row: size.width - L.margin(for: size) * 2, gap: L.gap)
            let r = L.rhythm(viewport: viewport, width: width)
            let into = (viewport - L.gridTop).truncatingRemainder(dividingBy: r.art + L.cardWords + r.gap)
            #expect(into >= 6 && into <= r.art, "\(Int(size.width)) by \(Int(size.height)): the foot is \(into) pt into a row whose cover is \(r.art) pt")
            #expect(r.art >= (width * 0.6).rounded() && r.art <= (width * 0.7).rounded() && r.gap >= 18 && r.gap <= 26)
        }
        #expect(L.rhythm(viewport: 598, width: 182) == (127, 18), "the full sheet keeps its 10:7 covers")
        let src = try library
        #expect(src.contains("spacing: rhythm.gap) {") && src.contains("app: e.app, art: rhythm.art,"))
        #expect(src.contains("LinearGradient(colors: [.black, galleryMore ? .clear : .black], startPoint: .top, endPoint: .bottom).frame(height: Self.galleryFoot)") && L.galleryFoot == 24)
    }


    /// The gallery's header: one row as tall as a page's top row (the close x never moves between
    /// the two), and under the sheet's name one line saying what these are. The name shows on
    /// every sheet, the smallest too (Search is shorter there). Three rows of covers show whole
    /// under it on the full sheet: the art is 4:3, with a name and one line under it. Under the
    /// last row the sheet's margin, so its names and lines end clear of the foot.
    @Test func theHeaderSaysWhatTheseAreAndThreeRowsShow() throws {
        typealias L = TemplateLibraryView
        #expect(TemplateLibraryWords.subtitle == "Notes and small apps your AI can fill in and keep up to date.")
        let src = try library
        #expect(src.components(separatedBy: ".frame(height: Self.controls)").count == 3, "the gallery's row and a page's row are one height")
        #expect(src.components(separatedBy: ".padding(.top, Self.margin(for: size))").count == 3, "and both start a margin under the sheet's top")
        #expect(src.contains("Text(TemplateLibraryWords.subtitle)\n                .font(.system(size: 13)).foregroundStyle(Color.muted)"))
        let width = L.cardWidth(row: L.size.width - L.margin * 2, gap: L.gap)
        #expect(SetupTemplateCard.artHeight(width) == (width * 0.7).rounded(), "10:7")
        let name = NSFont.systemFont(ofSize: SetupTemplateCard.nameSize, weight: .semibold)
        func tall(_ f: NSFont) -> CGFloat { (f.ascender - f.descender + f.leading).rounded(.up) }
        let card = SetupTemplateCard.artHeight(width) + 8 + tall(name) + 2 + 17
        let room = L.size.height - L.topRow(for: L.size) - L.subtitleRow
        // Three rows whole, clear of the fade at the foot, and the fourth's tops in it.
        #expect(L.gridTop + card * 3 + L.rowGap * 2 <= room - L.galleryFoot, "three rows of \(card) pt in \(room) pt")
        #expect(L.gridTop + card * 3 + L.rowGap * 3 < room, "the fourth row's covers show at the foot")
        #expect(src.contains(".padding(.bottom, Self.margin(for: size))\n                    .coordinateSpace(.named(Self.space))"), "the last row ends a margin clear of the foot")
        // The rows under the foot fade out there, and at the gallery's end there's no fade.
        #expect(src.contains("LinearGradient(colors: [.black, galleryMore ? .clear : .black], startPoint: .top, endPoint: .bottom).frame(height: Self.galleryFoot)"))
        // The name is in the row on every sheet: with Search at its least it fits the smallest.
        #expect(!src.contains("headerRow(named: false)") && src.contains("headerRow(search: Self.searchWidth)\n                headerRow(search: Self.searchNarrow)"))
        let kinds = NSHostingView(rootView: TemplateKinds(filter: .constant("All"))).fittingSize.width
        let title = (TemplateLibraryWords.title as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: 20, weight: .bold)]).width
        let smallest = L.size(on: CGSize(width: 500, height: 300)).width
        // The name, the kinds, Search at its least, the close x (28) and 10 pt between each, inside the margins.
        #expect(title + kinds + L.searchNarrow + 28 + 10 * 3 <= smallest - L.marginSmall * 2, "the smallest sheet's row: \(title) + \(kinds) + \(L.searchNarrow) + 28 + 30 in \(smallest - L.marginSmall * 2)")
    }

    /// Under each cover, its name and a few words, each whole on its one line at the narrowest
    /// card (the site's lines were cut short on every card). An app's line says so first.
    @Test(arguments: all) func everyCoverLineShowsWhole(_ e: TemplateCatalog.Entry) throws {
        let short = try #require(TemplateLibraryWords.lines[e.slug], "\(e.slug) has no line")
        #expect(!short.hasSuffix(".") && short.first?.isUppercase == true, "\(e.slug): \(short)")
        let line = TemplateLibraryWords.line(e)
        #expect(line == short, "the line is its words; an app's mark is drawn before it, never written in it")
        let width = SetupTemplateCard.wordsWidth(TemplateLibraryView.cardWidth(row: TemplateLibraryView.size.width - 64 - 15, gap: 16))
        func wide(_ s: String, _ f: NSFont) -> CGFloat { (s as NSString).size(withAttributes: [.font: f]).width }
        // An app's line starts after the app's mark.
        let room = width - (e.app ? SetupTemplateCard.markRoom : 0)
        // Whole on the full sheet's card; beside a scroll bar, at most a hair smaller.
        #expect(wide(line, .systemFont(ofSize: SetupTemplateCard.lineSize)) * SetupTemplateCard.nameShrink <= room, "\(e.slug): \u{201C}\(line)\u{201D} is wider than \(room) pt")
        // The longest name ("Study notes and flashcards") is set a hair smaller to stay whole.
        #expect(wide(e.title, .systemFont(ofSize: SetupTemplateCard.nameSize, weight: .semibold)) * SetupTemplateCard.nameShrink <= width, "\(e.slug): its name is wider than \(width) pt")
    }

    /// An app's card says App with the app's own mark (the soft capsule the notes list shows
    /// after an app's name), before its line, in the same place on every app's card: a thing to
    /// see at a glance, not two more grey words in the line.
    @Test func anAppsCardCarriesTheAppsMark() throws {
        let cards = try SettingsHomeTests.source("Pane/Views/SetupCards.swift")
        #expect(cards.contains("if app { AppMarkView(size: Self.markSize) }\n                        Text(line ?? pick.line)"))
        #expect(NoteAppMark.style == .soft)
        #expect(SetupTemplateCard.markRoom > 24 && SetupTemplateCard.markRoom < 40, "\(SetupTemplateCard.markRoom)")
        func card(_ app: Bool) throws -> Pixels {
            let pick = try entry("trip-plan").pick
            let r = ImageRenderer(content: SetupTemplateCard(pick: pick, width: 185, captionBelow: true, line: "Days, bookings, packing", app: app) {}.padding(4).background(Color.white).environment(\.colorScheme, .light))
            r.scale = 2
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        let with = try card(true), without = try card(false)
        #expect(with.width == without.width && with.height == without.height, "a card is one size with the mark and without")
        var differ = 0
        for i in 0..<(with.width * with.height) where with.difference(without, at: i) > 12 { differ += 1 }
        #expect(differ > 200, "the mark is drawn: \(differ) pixels differ")
    }

    /// The kinds are the sheet's own control: the picked one on a neutral raised pill, its word
    /// in ink, the same in a key window and out of one (the system's segmented picker filled its
    /// pick with the accent under white words in the real window, about 2:1).
    @Test func thePickedKindIsNeutral() throws {
        let src = try library
        // Apps is a format among topics: last, set apart by a wider gap and no line.
        #expect(!src.contains("TemplateKinds.apart") && !src.contains("kind == \"Apps\" ?") && TemplateCatalog.filters.last == "Apps", "spaced as the rest")
        #expect(src.contains("TemplateKinds(filter: $filter)") && !src.contains(".pickerStyle(.segmented)"))
        func kinds(_ dark: Bool) throws -> Pixels {
            let r = ImageRenderer(content: TemplateKinds(filter: .constant("Work")).padding(4).background(SetupCards.ground).environment(\.colorScheme, dark ? .dark : .light))
            r.scale = 2
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        for dark in [false, true] {
            let p = try kinds(dark)
            var strong = 0
            for i in 0..<(p.width * p.height) {
                let c = p.rgb(at: i)
                let r = Int((c >> 16) & 255), g = Int((c >> 8) & 255), b = Int(c & 255)
                if max(r, g, b) - min(r, g, b) > 24 { strong += 1 }
            }
            #expect(strong == 0, "\(dark ? "dark" : "light"): \(strong) coloured pixels in the kinds")
        }
    }

    /// A page's parts: the stage takes six tenths of the width, with the example in a frame
    /// inset by the sheet's margin; "More like this" shows on a sheet tall enough for it.
    @Test func thePagesParts() {
        typealias L = TemplateLibraryView
        let size = L.size
        #expect(L.stageWidth(for: size) == 624)
        #expect(L.frameRadius == 12)
        #expect(L.window(for: size) == CGSize(width: 576, height: 428.5), "the frame: \(L.window(for: size))")
        #expect(L.notePadding == 24 && L.lineRoom(for: size) == 528, "a note's margin in the panel, the same on all four sides")
        #expect(L.showsMore(size))
        #expect(!L.narrow(size))
        let small = L.size(on: CGSize(width: 800, height: 560))
        #expect(!L.showsMore(small) && L.narrow(small))
        #expect(L.window(for: small).height == small.height - L.topRow(for: small) - L.exampleRow - L.margin(for: small))
        // A narrow sheet gives the words more of it, so the button keeps its whole name.
        #expect(L.stageWidth(for: small) == 396)
        let words = L.wordsWidth(for: small)
        let name = ("Make with ChatGPT" as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: 15, weight: .semibold)]).width
        #expect(name + 14 + 7 + 40 + 44 <= words, "the mark, the name, the button's padding and its arrow fit in \(words) pt")
        #expect(TemplateLibraryWords.example == "Example" && TemplateLibraryWords.moreLike == "More like this")
        #expect(TemplateLibraryWords.exampleApp == "Example \u{00B7} try it, nothing is saved")
        #expect(Self.all.allSatisfy { TemplateLibraryWords.example($0) == ($0.app ? TemplateLibraryWords.exampleApp : "Example") }, "an app's example says it's live and nothing is kept")
        #expect(TemplateLibraryWords.asked(.chatgpt) == "What ChatGPT is asked" && TemplateLibraryWords.asked(.claude) == "What Claude is asked" && TemplateLibraryWords.asked(.other) == "What to ask your AI")
    }

    /// The example is a picture of the template in a rounded panel on the sheet itself: the
    /// notes' own ground (white, or black in the dark), with no line around it and no band behind
    /// it. In the dark its black is a shade under the sheet's grey; in the light a very soft
    /// shadow lifts it.
    @Test func theExampleIsAPanelWithNoLineAroundIt() throws {
        typealias L = TemplateLibraryView
        let src = try library
        let stage = try #require(src.range(of: "private func stage(_ e: TemplateCatalog.Entry) -> some View {"))
        let body = src[stage.lowerBound...].prefix(1800)
        #expect(body.contains("Text(TemplateLibraryWords.example(e))"))
        #expect(body.contains(".background(frameGround)\n                .clipShape(frame)") && !body.contains("strokeBorder") && !body.contains(".background(Self.pane)"))
        #expect(body.contains(".shadow(color: .black.opacity(scheme == .dark ? 0 : Self.panelShadow.near), radius: 1.5, y: 0.5)"))
        #expect(L.panelShadow.near <= 0.12 && L.panelShadow.far <= 0.1, "a very soft shadow")
        // The words start a clear gap beside the panel, and "More like this" a clear space under it.
        #expect(L.gap(for: L.size) == 32 && L.gap(for: L.size) == L.margin(for: L.size), "one gap between regions, the margin's measure")
        #expect(L.wordsWidth(for: L.size) == L.size.width - L.margin - L.window(for: L.size).width - L.gap(for: L.size) - L.margin)
    }

    /// One outer margin frames the whole library, the same on all four sides (Emil, 10 November
    /// 2026: "nice padding around the outline of all content"): 32 pt, 24 on a small sheet. Drawn
    /// on the full sheet, the smallest and the largest: the outermost things on the gallery and
    /// on a template's page (the name, the kinds, the close circle, the covers; Back, the
    /// example's panel, the words, "More like this") are that far from the sheet's edges, left
    /// as right, top as sides, and a page's last thing as far over the foot. (The gallery
    /// scrolls: its rows run under the foot, and its end has the margin under the last row.)
    @Test func oneMarginFramesTheSheetOnEverySide() throws {
        typealias L = TemplateLibraryView
        #expect(L.margin(for: L.size) == 32 && L.margin(for: L.size(on: CGSize(width: 800, height: 560))) == 24)
        // What isn't the sheet's ground, in the dark look (a panel there has no shadow): its bounds.
        func bounds(_ open: TemplateCatalog.Entry?, _ size: CGSize) throws -> (left: Int, right: Int, top: Int, bottom: Int) {
            let view = TemplateLibraryView(catalog: TemplateCatalog.shipped, ais: [.chatgpt, .claude], open: open, size: size)
                .environment(\.inSheet, true).frame(width: size.width, height: size.height).background(SetupCards.ground).environment(\.colorScheme, .dark)
            let r = ImageRenderer(content: view)
            r.scale = 1
            let cg = try #require(r.cgImage)
            let p = try #require(Pixels(cg))
            let ground = p.rgb(at: 2 * p.width + 2)
            func far(_ a: UInt32, _ b: UInt32) -> Int { (0..<3).map { abs(Int((a >> ($0 * 8)) & 255) - Int((b >> ($0 * 8)) & 255)) }.max() ?? 0 }
            var x0 = p.width, x1 = -1, y0 = p.height, y1 = -1
            for y in 0..<p.height { for x in 0..<p.width where far(p.rgb(at: y * p.width + x), ground) > 8 { x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) } }
            return (x0, p.width - 1 - x1, y0, p.height - 1 - y1)
        }
        for size in [L.size, L.size(on: CGSize(width: 800, height: 560))] {
            let m = Int(L.margin(for: size))
            let name = "\(Int(size.width)) by \(Int(size.height))"
            let gallery = try bounds(nil, size)
            #expect(gallery.left >= m && gallery.left <= m + 2, "\(name), gallery: \(gallery.left) pt at the left")
            #expect(gallery.right >= m && gallery.right <= m + 2 && abs(gallery.left - gallery.right) <= 2, "\(name), gallery: \(gallery.right) pt at the right")
            #expect(gallery.top >= m && gallery.top <= m + 2, "\(name), gallery: \(gallery.top) pt at the top")
            for slug in ["reading-list", "habit-tracker", "study-flashcards"] {
                let page = try bounds(try entry(slug), size)
                #expect(page.left >= m && page.left <= m + 2, "\(name), \(slug): \(page.left) pt at the left")
                #expect(page.right >= m && page.right <= m + 2 && abs(page.left - page.right) <= 2, "\(name), \(slug): \(page.right) pt at the right")
                #expect(page.top >= m && page.top <= m + 2, "\(name), \(slug): \(page.top) pt at the top")
                #expect(page.bottom >= m && page.bottom <= m + 2, "\(name), \(slug): \(page.bottom) pt at the foot")
            }
        }
        // Inside the example's panel: one padding on all four sides, a note's and an app's.
        let preview = try SettingsHomeTests.source("Pane/Views/NoteSourceSheet.swift")
        #expect(preview.contains(".padding(.bottom, margin ?? (compact ? 12 : 16))") && preview.contains(".padding(.top, margin.map { $0 - ((given ?? Self.blocks(markdown)).first?.isHeading == true ? 6 : 0) }"))
        #expect(TemplateFiles.stageCSS.contains("main > div:first-child { padding-left: 35px !important; padding-right: 35px !important; padding-top: 26px !important; }"))
        #expect(TemplateFiles.stageScript.contains("const GAP = 35"), "and over an app's tabs")
        #expect(abs(35 * TemplateAppPreview.zoom(for: L.window(for: L.size)) - L.notePadding) < 0.5)
    }

    /// No lines between the regions of the sheet (Emil, 10 November 2026: "many divider lines ...
    /// makes it look cheap"): the gallery has none under its header, a page none under its top
    /// row, between the example and the words, or over "More like this"; the recipe box none
    /// between its list and the open recipe; the filter none before Apps; the prompt no rule.
    /// Space and surface do it. The one Divider left is inside the arrow's menu, the system's.
    @Test func noLinesBetweenTheSheetsRegions() throws {
        typealias L = TemplateLibraryView
        let src = try library
        let view = try #require(src.range(of: "struct TemplateLibraryView: View {")), files = try #require(src.range(of: "@MainActor enum TemplateFiles {"))
        let body = String(src[view.lowerBound..<files.lowerBound])
        #expect(!body.contains("Divider()"), "no divider anywhere in the sheet (the arrow's menu is the system's, with its own separator)")
        #expect(!body.contains("Rectangle().fill(Color.primary") && !body.contains("fill(.separator"), "no drawn rule either")
        #expect(!body.contains("lineWidth: 0.5))\n                .accessibilityLabel(\"\\(e.title), an example\")"), "no hairline around the example")
        // Drawn, in both looks: where the lines were, there is only the sheet's ground.
        for dark in [false, true] {
            func pixels(_ open: TemplateCatalog.Entry?) throws -> Pixels {
                let view = TemplateLibraryView(catalog: TemplateCatalog.shipped, ais: [.chatgpt], open: open, size: L.size)
                    .environment(\.inSheet, true).frame(width: L.size.width, height: L.size.height).background(SetupCards.ground).environment(\.colorScheme, dark ? .dark : .light)
                let r = ImageRenderer(content: view)
                r.scale = 1
                let cg = try #require(r.cgImage)
                return try #require(Pixels(cg))
            }
            // A run of pixels all one colour, the ground's (a line's grey differs from it by more).
            func plain(_ p: Pixels, x: Range<Int>, y: Range<Int>, _ what: String) {
                let ground = p.rgb(at: y.lowerBound * p.width + x.lowerBound)
                var off = 0
                func far(_ a: UInt32, _ b: UInt32) -> Int { (0..<3).reduce(0) { $0 + abs(Int((a >> ($1 * 8)) & 255) - Int((b >> ($1 * 8)) & 255)) } }
                for yy in y { for xx in x where far(p.rgb(at: yy * p.width + xx), ground) > 3 { off += 1 } }
                #expect(off == 0, "\(dark ? "dark" : "light"): \(what): \(off) pixels off the ground")
            }
            let gallery = try pixels(nil)
            // Under the header, in the gallery's left margin, from the subtitle down into the grid's margin.
            let top = Int(L.topRow(for: L.size)), more = Int(L.size.height - L.moreHeight(for: L.size))
            plain(gallery, x: 4..<20, y: top + Int(L.subtitleRow) - 4..<top + Int(L.subtitleRow) + 10, "under the gallery's header")
            let page = try pixels(try entry("reading-list"))
            // Under the top row; between the panel and the words; over "More like this".
            plain(page, x: 4..<20, y: top - 4..<top + 8, "under the page's top row")
            plain(page, x: Int(L.size.width) - 20..<Int(L.size.width) - 4, y: top - 4..<top + 8, "under the top row, at the right")
            // Past the panel's own soft shadow, which falls a little way into the gap.
            let between = Int(L.margin + L.window(for: L.size).width) + 25
            plain(page, x: between..<between + 5, y: top + 4..<more - 4, "between the example and the words")
            // Clear of the panel's own soft shadow, which falls a little way into the margin.
            plain(page, x: 2..<8, y: more - 6..<more + 6, "over More like this")
            plain(page, x: Int(L.size.width) - 20..<Int(L.size.width) - 4, y: more - 6..<more + 6, "over More like this, at the right")
        }
    }

    /// Beside the stage, each thing once and in one order: the cover with the name and the kind
    /// beside it, what it is, the button and right under it the line saying what it does, then,
    /// apart and plainly second, the way to do it yourself, and what your AI is asked, quoted.
    /// Everything down to the buttons keeps its place from page to page.
    @Test func theWordsBesideTheStage() throws {
        typealias L = TemplateLibraryView
        typealias W = TemplateLibraryWords
        let note = try entry("meeting-notes"), app = try entry("trip-plan"), habits = try entry("habit-tracker")
        #expect(W.make(note, .chatgpt) == "Make with ChatGPT" && W.make(app, .claude) == "Make with Claude")
        #expect(W.make(note, .other) == "Add the note" && W.make(app, .other) == "Add the app")
        #expect(W.kind(note) == "Work" && W.kind(app) == "Personal \u{00B7} App")
        // The button says what it does in each state: Make with your AI; with no AI, or while sync
        // is away, what it adds; for one you made and still have, Open and its name.
        #expect(L.mode(ai: .chatgpt, reach: .online, have: nil) == .make && L.mode(ai: .other, reach: .online, have: nil) == .plain)
        #expect(L.mode(ai: .chatgpt, reach: .offline, have: nil) == .plain && L.mode(ai: .chatgpt, reach: .online, have: "Notes") == .have)
        #expect(W.primary(habits, .chatgpt, .make) == "Make with ChatGPT" && W.primary(habits, .chatgpt, .plain) == "Add the app" && W.primary(note, .chatgpt, .plain) == "Add the note")
        #expect(W.primary(habits, .chatgpt, .have) == "Open Habit tracker")
        // The second button is named for what you do next.
        #expect(W.addMyself(note) == "Add and fill it in myself" && W.addMyself(app) == "Add and set it up myself" && W.copy == "Copy the prompt")
        // The arrow's menu: your other AIs, then the prompt to copy. With nothing but Copy to
        // offer there's no arrow, and Copy is beside the prompt.
        #expect(L.menu(.make, ai: .chatgpt, ais: [.chatgpt, .claude]) == [.make(.claude), .divider, .copy])
        #expect(L.menu(.make, ai: .chatgpt, ais: [.chatgpt]).isEmpty && L.menu(.plain, ai: .other, ais: [.other]).isEmpty && L.menu(.plain, ai: .chatgpt, ais: [.chatgpt, .claude], reach: .offline).isEmpty)
        // For one you have, the menu asks an AI about it, with the everyday ask, not the set-up.
        #expect(L.menu(.have, ai: .chatgpt, ais: [.chatgpt, .claude]) == [.ask(.chatgpt), .ask(.claude), .divider, .copy] && L.menu(.have, ai: .chatgpt, ais: [.chatgpt], reach: .offline).isEmpty)
        #expect(W.ask(.claude) == "Ask Claude" && W.everydayAsk(habits).contains("today") && W.everydayAsk(habits) != habits.ask && W.everydayAsk(note) == note.ask)
        let src = try library
        let words = try #require(src.range(of: "private func words(_ e: TemplateCatalog.Entry) -> some View {"))
        let body = String(src[words.lowerBound...].prefix(4200))
        let order = ["Self.thumbnail(e.pick, side: cover)", "Text(e.title)", "kind(e, have: p.have)", "e.shownDescription", "actions(e, p)", "caption(e, p)",
                     "Button(TemplateLibraryWords.connect, action: connect)", "Button(TemplateLibraryWords.addMyself(e)) { make(e, .other) }", "asked(e, p)"]
        var at = body.startIndex
        for part in order {
            let found = try #require(body.range(of: part, range: at..<body.endIndex), "\(part) is missing or out of order")
            at = found.upperBound
        }
        #expect(body.contains("HStack(alignment: .center, spacing: Self.headGap) {\n                Self.thumbnail(e.pick, side: cover)"), "the cover is beside the name, on one row")
        #expect(body.contains("caption(e, p)\n                .padding(.top, 8)"), "the line sits close under Make")
        // Plainly second: lower than Make, a quieter fill.
        #expect(body.contains("Button(TemplateLibraryWords.addMyself(e)) { make(e, .other) }\n                    .buttonStyle(.secondaryQuiet)") && SecondaryQuietButtonStyle.height == 32)
        #expect(src.contains("var secondary: Bool { mode == .make }"), "no second button where the first already only adds, or opens")
        #expect(!src.contains("askBox") && !src.contains("Copy Prompt") && !src.contains("opensWith"))
        #expect(src.components(separatedBy: ".keyboardShortcut(e == open && !covered ? .defaultAction : nil)").count == 3, "Return makes the open template")
        // The menu is put up with its right edge on the arrow's (it hung past the sheet), an
        // AI's mark in its own colours and the copy symbol in the menu's ink.
        #expect(src.contains("DispatchQueue.main.async {\n            menu.popUp(positioning: nil, at: NSPoint(x: view.bounds.maxX - menu.size.width, y: view.bounds.maxY + 6), in: view)"))
        #expect(src.contains("add(TemplateLibraryWords.copy, NSImage(systemSymbolName: \"doc.on.doc\", accessibilityDescription: nil)) { copy(e) }"))
        #expect(AIGlyph.menuPicture("Claude", dark: true) != nil && AIGlyph.menuPicture("ChatGPT", dark: false) != nil)
        // Pressed, a half of the split button keeps its place and size; only its fill darkens
        // (dipping, the two halves drew apart and a gap opened between them).
        let design = try SettingsHomeTests.source("Pane/Views/DesignSystem.swift")
        #expect(design.contains(".modifier(ButtonChrome(shape: shape, pressed: joined == nil && pressed, focused: isFocused))"))
        // Drawn: at rest, under the pointer and pressed, Make is the same shape in the same
        // place; only its fill changes, each step plainly darker than the last.
        func make(_ state: Set<String>) throws -> Pixels {
            let view = HStack(spacing: 1) {
                Button("Make with ChatGPT") {}.buttonStyle(.amberProminent(.regular, wide: true, joined: .leading))
                Button("v") {}.buttonStyle(.amberProminent(.regular, joined: .trailing))
            }
            .frame(width: 300).padding(6).background(Color.white).environment(\.hoverPreview, state).environment(\.colorScheme, .light)
            let r = ImageRenderer(content: view)
            r.scale = 2
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        let rest = try make([]), over = try make(["split.hover"]), pressed = try make(["split.pressed"])
        func edges(_ p: Pixels) -> [Int] {
            // The columns of the middle row that aren't the white ground: where the buttons are.
            let y = p.height / 2
            return (0..<p.width).filter { p.rgb(at: y * p.width + $0) & 0xFF < 200 }
        }
        #expect(edges(rest) == edges(over) && edges(rest) == edges(pressed), "one shape at rest, under the pointer and pressed")
        func red(_ p: Pixels) -> Int { Int((p.rgb(at: (p.height / 2) * p.width + 40) >> 16) & 0xFF) }
        #expect(red(rest) - red(over) >= 14 && red(over) - red(pressed) >= 10, "rest \(red(rest)), hover \(red(over)), pressed \(red(pressed))")
        // What your AI is asked: in quotation marks, small, in the labels' grey: a quotation of
        // what gets sent, with no box and no rule.
        let asked = try #require(src.range(of: "private func asked(_ e: TemplateCatalog.Entry, _ p: Parts) -> some View {"))
        let quote = String(src[asked.lowerBound...].prefix(1500))
        #expect(quote.contains("Text(\"\\u{201C}\\(NoWidow.kept(TemplateCatalog.Entry.sendable(prompt(e, p)), phrases: true))\\u{201D}\")\n                .font(.system(size: PageType.small)).foregroundStyle(Color.muted)"))
        #expect(!quote.contains(".background(") && !quote.contains("SetupCards.soft"), "no fill behind the prompt")
        #expect(quote.contains("if p.copy {\n                    Button(copied ? TemplateLibraryWords.copiedShort : TemplateLibraryWords.copyShort) { copy(e) }"), "with no arrow, Copy is beside the label")
        #expect(W.asked(.chatgpt) == "What ChatGPT is asked" && W.asked(.chatgpt, sent: false) == "What to ask ChatGPT" && W.asked(.other) == "What to ask your AI")
        // With no AI connected, the way to get one is under Make's line. It opens over the page,
        // and the page is there, with Make naming the AI, when it closes.
        #expect(W.connect == "Connect your AI to have it filled in for you.")
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("connect: { withAnimation(.snappy(duration: 0.2)) { connectingOverTemplates = true } }, covered: connectingOverTemplates,"))
        #expect(root.contains("popupCard(.connectAI, done: closeConnect)") && root.contains("if templateAIs != nil { templateAIs = now }") && !root.contains("connect: { openPopup(.connectAI) }"))
        // One size for every name, beside its cover: on one line on the full sheet, on two at
        // most where the words are narrow. Every page keeps the same room for it.
        let titles = Self.all.map(\.title)
        func wide(_ name: String, _ size: CGFloat) -> CGFloat { (name as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: size, weight: .bold)]).width }
        #expect(L.nameSize(for: L.size) == L.PageType.name && L.nameLines(titles, size: L.PageType.name, room: L.nameRoom(for: L.size)) == 1, "every name on one line on the full sheet")
        for size in [L.size, L.size(on: CGSize(width: 800, height: 560))] {
            let room = L.nameRoom(for: size), points = L.nameSize(for: size)
            let lines = L.nameLines(titles, size: points, room: room)
            for e in Self.all { #expect(wide(e.title, points) <= room * CGFloat(lines) * (lines > 1 ? 0.85 : 1), "\(e.slug) at \(points) pt is \(wide(e.title, points)) of \(room) on \(lines)") }
            // The description keeps room for its longest.
            let font = NSFont.systemFont(ofSize: L.PageType.body)
            for e in Self.all {
                let n = Balanced.lines(NoWidow.kept(e.shownDescription, phrases: true), font: font, width: L.wordsWidth(for: size))
                #expect(n <= L.descriptionLines(for: size), "\(e.slug): \(n) lines of description")
            }
        }
        #expect(!src.contains("minimumScaleFactor(0.7)") && src.contains("Text(e.title).font(.system(size: name, weight: .bold))"), "no name is set smaller for being longer")
        #expect(body.contains(".frame(height: Self.descriptionHeight(for: size), alignment: .topLeading)"))
        #expect(L.descriptionHeight(for: L.size) >= 16 * 3 + 4 && L.descriptionHeight(for: L.size) <= 56)
        // Drawn: Make sits at one height on every page, whatever the name's and the description's lengths.
        let tops = Set(try ["habit-tracker", "meal-plan", "study-flashcards", "job-hunt", "one-on-one-notes"].map { try Self.makeTop(try entry($0), size: L.size) })
        #expect(tops.count == 1 && !tops.contains(-1), "Make's top edge on five pages: \(tops.sorted())")
    }

    /// Where Make's top edge is on a page, drawn in the dark look with no AI (the button is
    /// white there): the first row of the words' column that is mostly white. -1 when none is.
    static func makeTop(_ e: TemplateCatalog.Entry, size: CGSize) throws -> Int {
        typealias L = TemplateLibraryView
        let view = TemplateLibraryView(catalog: TemplateCatalog.shipped, ais: [.other], open: e, size: size)
            .environment(\.inSheet, true).frame(width: size.width, height: size.height).background(SetupCards.ground).environment(\.colorScheme, .dark)
        let r = ImageRenderer(content: view)
        r.scale = 1
        let cg = try #require(r.cgImage)
        let p = try #require(Pixels(cg))
        let x0 = Int(size.width - L.margin(for: size) - L.wordsWidth(for: size)) + 100, x1 = x0 + 200
        for y in 0..<p.height {
            var white = 0
            for x in x0..<x1 where p.rgb(at: y * p.width + x) & 0xFF > 235 { white += 1 }
            if white > 150 { return y }
        }
        return -1
    }

    /// One accent for the sheet and for the apps shown on it. Light: ticks, rings and bars #D96A06
    /// with a white glyph, amber text #A85700, the primary button #BB5B05 with a white label.
    /// Dark: ticks and bars #F4AD33 with the glyph #1F1300, amber text #F4AD33, the primary button
    /// white with a black label (dark mode's buttons are white or black, never amber).
    @Test func theSheetsAccentIsTheAppsOwn() throws {
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        func hex(_ c: NSColor, dark: Bool) -> String {
            var out = ""
            NSAppearance(named: dark ? .darkAqua : .aqua)?.performAsCurrentDrawingAppearance {
                let s = c.usingColorSpace(.sRGB) ?? c
                out = String(format: "#%02X%02X%02X", Int((s.redComponent * 255).rounded()), Int((s.greenComponent * 255).rounded()), Int((s.blueComponent * 255).rounded()))
            }
            return out
        }
        #expect(hex(Palette.amber, dark: false) == "#D96A06" && hex(Palette.amber, dark: true) == "#F4AD33", "ticks, rings and bars")
        #expect(hex(PColor.paneAccent, dark: false) == "#D96A06" && hex(PColor.paneAccent, dark: true) == "#F4AD33", "the sheet's own rings and ticks")
        #expect(hex(Palette.amberInk, dark: false) == "#A85700" && hex(Palette.amberInk, dark: true) == "#F4AD33", "amber text")
        #expect(hex(Palette.primaryButton, dark: false) == "#BB5B05" && hex(Palette.primaryButton, dark: true) == "#FFFFFF", "the primary button")
        #expect(hex(Palette.primaryButtonLabel, dark: false) == "#FFFFFF" && hex(Palette.primaryButtonLabel, dark: true) == "#000000", "its label")
        // The apps on the stage are drawn with the same set.
        let css = TemplateFiles.stageCSS
        #expect(css.contains("--amber-accent: #D96A06; --amber-accent-text: #A85700;") && css.contains("--amber-on-accent: #FFFFFF;"))
        #expect(css.contains("--amber-accent: #F4AD33; --amber-accent-text: #F4AD33;") && css.contains("--amber-on-accent: #1F1300;"))
        #expect(css.contains("background: var(--amber-accent-soft) !important; color: var(--amber-accent-text) !important;"), "the tinted pill's words are amber text, not the button's fill")
    }

    /// The Tab key walks the page's own buttons, in order, each ringed in its turn: Make, the
    /// arrow, the second button, Back, Close, the tiles under "More like this", and last the
    /// example, one stop that Return enters and Esc leaves (Tab went into the example's app and
    /// never reached Make). It works whatever the Mac's keyboard navigation setting: the page has
    /// the keys, as the covers do in the gallery. Back by a key puts the ring on the cover you came from.
    @Test func tabWalksThePagesButtons() throws {
        typealias L = TemplateLibraryView
        let all = L.stops(arrow: true, secondary: true, connect: false, copy: false, related: ["a", "b"], example: true)
        #expect(all == [.make, .arrow, .secondary, .back, .close, .more("a"), .more("b"), .example])
        #expect(L.stops(arrow: false, secondary: false, connect: true, copy: true, related: [], example: false) == [.make, .connect, .copy, .back, .close])
        #expect(L.next(all, from: nil, by: 1) == .make && L.next(all, from: nil, by: -1) == .example, "the first Tab is Make; Shift-Tab, the last")
        #expect(L.next(all, from: .make, by: 1) == .arrow && L.next(all, from: .example, by: 1) == .make && L.next(all, from: .make, by: -1) == .example)
        #expect(L.next(all, from: .more("gone"), by: 1) == .make, "a stop that's no longer there starts again")
        let src = try library
        // The keys are with a view beside the page, never around it: buttons inside a view that
        // has the keys all drew their own focus rings at once.
        #expect(src.contains("Color.clear.frame(width: 1, height: 1)\n                    .focusable(open != nil, interactions: .edit)\n                    .focused($keys, equals: .page)\n                    .focusEffectDisabled()"), "the page has the keys")
        #expect(src.contains(".onKeyPress(keys: [.tab, Self.backTab]) { tab($0) }") && src.contains(".onKeyPress(.space) { pressStop() ? .handled : .ignored }") && src.contains(".onKeyPress(.return) { pressStop() || openFromKeys() ? .handled : .ignored }"))
        for stop in [".make", ".arrow", ".secondary", ".connect", ".copy", ".back", ".close", ".more(r.slug)", ".example"] {
            #expect(src.contains(".overlay { ring(\(stop), on: e, radius:"), "\(stop) shows the ring")
        }
        #expect(src.contains("RoundedRectangle(cornerRadius: radius + 3, style: .continuous).strokeBorder(Color.paneAccent, lineWidth: 2.5).padding(-4)"), "the covers' own ring")
        #expect(src.contains("stop = nil\n        }"), "no ring is left on from the page before")
        // Into the example and out again.
        #expect(src.contains("case .example: enterExample(e)") && src.contains("window.makeFirstResponder(web)"))
        #expect(src.contains("if open != nil, Self.inExample() { leaveExample() } else if open != nil { show(nil) } else { close() }"))
        #expect(src.contains("if let from = open, NSApp.currentEvent?.type == .keyDown, catalog.shown(filter: filter, query: query).contains(from) { focused = from }"))
    }


    /// The words beside the stage fit their column on the smallest sheet too: the prompt's box
    /// ends above the sheet's foot on every page (a short sheet has a smaller cover and closer rows).
    @Test func theWordsFitTheSmallestSheet() throws {
        typealias L = TemplateLibraryView
        let small = L.size(on: CGSize(width: 800, height: 560))
        #expect(L.short(small) && !L.short(L.size) && L.nameCover(for: small) < L.nameCover(for: L.size))
        // The pages with the most to say under the buttons: the longest prompts, and an app.
        let longest = Self.all.filter { !$0.app }.sorted { $0.ask.count > $1.ask.count }.prefix(3) + [try entry("study-flashcards")]
        for e in longest {
            let view = TemplateLibraryView(catalog: TemplateCatalog.shipped, ais: [.chatgpt, .claude], open: e, size: small)
                .environment(\.inSheet, true).frame(width: small.width, height: small.height).background(SetupCards.ground).environment(\.colorScheme, .dark)
            let r = ImageRenderer(content: view)
            r.scale = 1
            let cg = try #require(r.cgImage)
            let p = try #require(Pixels(cg))
            // The last row of the words' column with anything lighter than its ground in it.
            let x0 = Int(L.stageWidth(for: small)) + 26, x1 = Int(small.width) - 26
            var last = 0
            for y in 0..<p.height { for x in stride(from: x0, to: x1, by: 2) where p.rgb(at: y * p.width + x) & 0xFF > 70 { last = y; break } }
            #expect(last > 300 && last <= Int(small.height) - 12, "\(e.slug): the words end at \(last) of \(Int(small.height))")
        }
    }

    /// The line under Make says plainly what Make does, for every template: "Adds an empty note to
    /// (folder) Work, then opens ChatGPT." An app's: "Adds the app to (folder) Work, then opens
    /// ChatGPT to set it up." (an "empty app" read as losing the example's habits; its first
    /// screen suggests them). The folder is New Note's, not the template's own. With no AI that
    /// opens with the ask, only what it adds; while sync is away, when the AI can fill it. One
    /// you made and still have: where it is. The folder's name shows whole, on a line of its own
    /// if it must; a very long one loses its middle, and its help tag has all of it.
    @Test(arguments: all) func everyTemplateSaysWhatMakeAdds(_ e: TemplateCatalog.Entry) throws {
        typealias L = TemplateLibraryView
        let lead = e.app ? "Adds the app to " : "Adds an empty note to "
        let with = TemplateLibraryWords.caption(e, ai: .chatgpt, folder: "Work")
        #expect(with.lead == lead && with.folder == "Work" && with.rest == (e.app ? ", then opens ChatGPT to set it up." : ", then opens ChatGPT."))
        let without = TemplateLibraryWords.caption(e, ai: .other, folder: "Work")
        #expect(without.lead + without.folder + without.rest == lead + "Work.")
        let had = TemplateLibraryWords.caption(e, ai: .claude, folder: "Work", have: "Habits")
        #expect(had.lead + had.folder + had.rest == "Already in Habits.")
        for reach in [SyncEngine.Reach.offline, .unreachable] {
            let away = TemplateLibraryWords.caption(e, ai: .claude, folder: "Work", reach: reach)
            #expect(away.lead == lead && away.rest == ". Ask Claude after it syncs.")
            #expect(TemplateLibraryWords.caption(e, ai: .other, folder: "Work", reach: reach).rest == ".")
        }
        // One line with an everyday folder; a longer name takes a second line, whole.
        #expect(L.captionLines(for: L.size, ai: .chatgpt, folder: "Notes") == 1 && L.captionLines(for: L.size, ai: .claude, folder: "Reading") == 1)
        #expect(L.captionLines(for: L.size, ai: .chatgpt, folder: "Side projects and plans") == 2 && L.shownFolder("Side projects and plans") == "Side projects and plans")
        let long = L.shownFolder("Everything for the house move in March")
        #expect(long.hasPrefix("Everything") && long.hasSuffix("in March") && long.contains("\u{2026}") && long.count <= 26, "\(long)")
        #expect(L.captionLines(for: L.size, ai: .chatgpt, folder: "Everything for the house move in March") <= 2)
        #expect(L.captionLines(for: L.size(on: CGSize(width: 800, height: 560)), ai: .chatgpt, folder: "Everything for the house move in March") <= 3)
        let src = try library
        #expect(src.contains(".help(c.folder)") && src.contains("let lines = Self.captionLines(for: size, ai: ai, folder: folder, reach: reach)"))
    }


    /// Make from the library puts a template where New Note would put a note: the folder you're
    /// in, or with All Notes your first folder; never a folder of the template's own (three makes
    /// made three folders of one note each). The website's way keeps the template's folder.
    @Test func makeAddsWhereNewNoteWould() async throws {
        let container = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = container.mainContext
        #expect(TemplateMaking.folder(in: ctx, scope: .all) == nil, "no folder yet: Notes is made")
        let notes = ctx.createFolder(named: "Notes"), work = ctx.createFolder(named: "Work")
        notes.sortIndex = 0; work.sortIndex = 1
        #expect(TemplateMaking.folder(in: ctx, scope: .all)?.id == notes.id, "All Notes: the first folder")
        #expect(TemplateMaking.folder(in: ctx, scope: .folder(work.id))?.id == work.id, "a folder: that one")
        #expect(TemplateMaking.folder(in: ctx, scope: .trash)?.id == notes.id)
        let defaults = try #require(UserDefaults(suiteName: "templates.where.\(UUID().uuidString)"))
        let ledger = NoteSourceLedger(defaults: defaults, account: nil)
        let reading = try entry("reading-list"), habits = try entry("habit-tracker")
        let a = await TemplateMaking.make(reading, with: .other, context: ctx, account: nil, into: .existing(work.id), ledger: ledger, copy: { _ in }, open: { _ in })
        let b = await TemplateMaking.make(habits, with: .other, context: ctx, account: nil, into: .existing(work.id), ledger: ledger, copy: { _ in }, open: { _ in })
        #expect(a.flatMap { ctx.note($0) }?.folder?.id == work.id && b.flatMap { ctx.note($0) }?.folder?.id == work.id)
        #expect(ctx.allFolders().count == 2, "no Reading and no Habits folder: \(ctx.allFolders().map(\.name))")
        // Made again: the one you have is opened, and the page says where it is.
        let again = await TemplateMaking.make(habits, with: .other, context: ctx, account: nil, into: .existing(notes.id), ledger: ledger, copy: { _ in }, open: { _ in })
        let all = try ctx.fetch(FetchDescriptor<Note>())
        #expect(again == b && all.filter { $0.title == "Habit tracker" }.count == 1, "no second Habit tracker: \(all.map(\.title))")
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("let target = TemplateMaking.folder(in: context, scope: scope)"))
        #expect(root.contains("into: target.map { .existing($0.id) } ?? .new(TemplateMaking.firstFolder), reach: reach,"))
        #expect(root.contains("have: { TemplateMaking.have($0, context: context, account: account) }"))
        let source = try SettingsHomeTests.source("Pane/Model/NoteSource.swift")
        #expect(source.contains("if folder == nil { folder = context.suggestedFolder(for: d) }"), "the website's sheet keeps the template's folder")
    }

    /// Search and the kinds filter the covers in place; when nothing matches, the gallery says
    /// what was looked for, with Clear search beside it.
    @Test func nothingMatchingSaysWhatAndOffersTheWayBack() throws {
        #expect(TemplateLibraryWords.none(query: "zebra", filter: "All") == "No templates for \u{201C}zebra\u{201D}")
        // Looked for inside a kind: the same words in every kind is one press away.
        #expect(TemplateLibraryWords.searchAll == "Search all templates")
        #expect(try library.contains("if filter != \"All\" {\n                            Button(TemplateLibraryWords.searchAll) {\n                                filter = \"All\""))
        #expect(TemplateLibraryWords.none(query: " zebra ", filter: "Work") == "No Work templates for \u{201C}zebra\u{201D}")
        #expect(TemplateLibraryWords.none(query: "zebra", filter: "Habits and health") == "No Health templates for \u{201C}zebra\u{201D}")
        #expect(TemplateLibraryWords.none(query: "zebra", filter: "Apps") == "No app templates for \u{201C}zebra\u{201D}")
        #expect(TemplateLibraryWords.clear == "Clear search")
        #expect(TemplateCatalog.shipped.shown(filter: "All", query: "zebra").isEmpty)
        #expect(TemplateCatalog.shipped.shown(filter: "Apps", query: "").count == 4)
        let src = try library
        #expect(src.contains("Text(TemplateLibraryWords.none(query: query, filter: filter))"))
        #expect(src.contains("Button(TemplateLibraryWords.clear) {\n                            query = \"\"\n                            keys = .search\n                        }\n                        .buttonStyle(.secondary)"))
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

    /// A note's example moves by whole weeks, so on every day of the week its weekdays are its
    /// own: a standup's days are working days, a review's is its Sunday (moved by exact days, the
    /// standup read "Sunday 8 November" on a Tuesday). An app's sample moves by exact days.
    @Test(arguments: all.filter { !$0.app }) func aNotesWeekdaysAreItsOwnOnEveryDay(_ e: TemplateCatalog.Entry) throws {
        let weekdays = TemplateExample.weekdays + TemplateExample.weekdays.map { String($0.prefix(3)) }
        func named(_ text: String) -> [String] {
            TemplateExample.dates(in: text).compactMap { d in weekdays.first { d.hasPrefix($0 + " ") } }
        }
        let own = named(e.example)
        var c = DateComponents(); (c.year, c.month, c.day, c.hour) = (2026, 11, 8, 12)
        let cal = Calendar(identifier: .gregorian)
        let sunday = try #require(cal.date(from: c))
        // Three weeks of days from the samples' Sunday, a year's end among them.
        for ahead in Array(0..<21) + Array(50..<58) {
            let today = try #require(cal.date(byAdding: .day, value: ahead, to: sunday))
            let days = TemplateExample.wholeWeeks(TemplateSample.days(to: today))
            #expect(days % 7 == 0 && days <= ahead && ahead - days < 7)
            let moved = TemplateExample.moved(e.example, days: days)
            #expect(named(moved) == own, "\(e.slug), \(ahead) days on: \(named(moved))")
            if ["daily-standup", "meeting-notes", "one-on-one-notes", "bug-triage"].contains(e.slug) {
                #expect(!named(moved).contains { $0.hasPrefix("Sat") || $0.hasPrefix("Sun") }, "\(e.slug), \(ahead) days on: a working day's note on a weekend")
            }
        }
        #expect(TemplateExample.wholeWeeks(2) == 0 && TemplateExample.wholeWeeks(7) == 7 && TemplateExample.wholeWeeks(13) == 7)
        let src = try library
        #expect(src.contains("let days = TemplateExample.wholeWeeks(TemplateSample.days(to: today))\n        let key = \"\\(e.slug)-\\(days)-\\(Int(room))\""))
        #expect(src.contains("TemplateSample.moved($0, days: TemplateSample.days(to: today))"), "an app's sample moves to today exactly")
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
        // A year written after the month moves with the date: last year's service stays a year back.
        #expect(TemplateExample.moved("| 20 Nov 2025 | 20 Nov 2026 |", days: 7) == "| 27 Nov 2025 | 27 Nov 2026 |")
        #expect(TemplateExample.moved("| 20 Nov 2025 | 20 Nov 2026 |", days: 49) == "| 8 Jan 2026 | 8 Jan 2027 |", "over the year's end, each to its own new year")
        #expect(TemplateExample.moved("1 December 2026", days: 31) == "1 January 2027")
        #expect(TemplateExample.dates(in: "done 1 Nov, due 20 Nov 2026") == ["1 Nov", "20 Nov 2026"])
        // The stage reads an example through it, a day's worth worked out once.
        #expect(TemplateSample.anchor == "2026-11-08")
    }

    /// A table in an example has its heading over it and shows every one of its columns, on the
    /// full sheet and on the smallest: none is dropped (the smallest sheet lost Job hunt's "Next
    /// step", the column its page sells). Where a row's cells don't fit on one line each, they
    /// wrap at a word; no word is broken and nothing runs off the table's side.
    @Test(arguments: all.filter { !$0.app }) func everyTableShowsAllItsColumns(_ e: TemplateCatalog.Entry) throws {
        typealias L = TemplateLibraryView
        let blocks = NotePreview.blocks(e.example).filter { $0 != .gap }
        for (i, block) in blocks.enumerated() {
            guard case .table = block else { continue }
            #expect(i > 0 && blocks[i - 1].isHeading, "\(e.slug): a table with no heading over it")
        }
        func tables(_ blocks: [NotePreview.Block]) -> [[String]] { blocks.compactMap { if case .table(let header, _) = $0 { header } else { nil } } }
        #expect(tables(L.staged(e.example)) == tables(blocks), "\(e.slug): every column shows")
        for size in [L.size, L.size(on: CGSize(width: 800, height: 560))] {
            let room = L.lineRoom(for: size)
            for block in L.staged(e.example, room: room) {
                guard case .table(let header, let rows) = block else { continue }
                #expect(rows.allSatisfy { $0.count == header.count }, "\(e.slug): \(header)")
                // On the full sheet every short value keeps its line; where that doesn't fit (the
                // smallest sheet), values wrap at their words, a size smaller.
                let points = L.tableSize(for: size), inset = L.tableInset(for: size)
                let loose = NotePreview.loose(header: header, rows: rows, size: points, inset: inset, room: room)
                if size == L.size { #expect(!loose, "\(e.slug): on the full sheet no short value wraps") }
                let least = NotePreview.leastWidths(header: header, rows: rows, size: points, loose: loose, inset: inset)
                // Six columns on the smallest sheet (Bug triage) are a little too wide even so:
                // all six show, each a little narrower, and a long word may break.
                let most = header.count >= 6 && size != L.size ? room * 1.15 : room
                #expect(least.reduce(0, +) <= most, "\(e.slug) on \(Int(size.width)): its \(header.count) columns' words need \(least.reduce(0, +)) pt of \(room)")
            }
        }
    }


    /// The fixes to single examples (9 November 2026).
    @Test func theExamplesSayNothingOdd() throws {
        let job = try entry("job-hunt").example
        for name in ["Northwind", "Fabrikam", "Contoso"] { #expect(!job.contains(name), "a sample company from somewhere else: \(name)") }
        let standup = try entry("daily-standup").example
        #expect(standup.components(separatedBy: "Blockers").count == 2, "one Blockers section")
        #expect(standup.contains("### Friday 6 November\n**Yesterday**"), "the day's heading has its weekday, and is a working day")
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

    /// "More like this" is the same need, said for each template where the templates are written
    /// (the site's `related`, carried in the app's copy): three others, each a template the app
    /// has, never the template itself, never one from the same kind only to fill the row.
    @Test(arguments: all) func moreLikeThisIsTheSameNeed(_ e: TemplateCatalog.Entry) throws {
        let listed = try #require(e.related, "\(e.slug) has no list")
        let more = TemplateLibraryView.related(e, in: Self.all)
        #expect(more.map(\.slug) == listed, "every one listed is a template")
        #expect(more.count == 3 && !more.contains(e) && Set(listed).count == listed.count)
        if e.slug == "reading-list" { #expect(listed == ["book-notes", "study-flashcards", "cornell-notes"]) }
        if e.slug == "habit-tracker" { #expect(listed.first == "mood-energy-log" && !listed.contains("reading-list")) }
        let src = try library
        #expect(!src.contains("static let like:"), "one list, the templates' own")
        let script = try SettingsHomeTests.source("scripts/template-catalog.py")
        #expect(script.contains("\"related\": t.get(\"related\", []),"))
    }

    /// One measure everywhere (a 24 pt margin, a 16 pt gap), and a short type ladder on a
    /// template's page: its name the one large thing, over twice the body (a long name steps
    /// down to stay on one line); with the button's own size, four sizes in three weights.
    @Test func oneMeasureAndAShortTypeLadder() throws {
        #expect(TemplateLibraryView.margin == 32 && TemplateLibraryView.marginSmall == 24 && TemplateLibraryView.gap == 16)
        typealias T = TemplateLibraryView.PageType
        #expect(T.name / T.body >= 1.7 && T.name / T.body <= 2.6 && T.small < T.body && T.nameShort < T.name && T.nameShort > T.body)
        #expect(T.table >= 12 && T.table <= T.body, "a table's words are the body's size, near enough")
        let src = try library
        let from = try #require(src.range(of: "    // MARK: A template's page"))
        let to = try #require(src.range(of: "/// The kinds, as one row of words in a quiet track"))
        let page = String(src[from.lowerBound..<to.lowerBound])
        let sizes = Set(page.matches(of: /\.system\(size: ([A-Za-z.0-9]+)/).map { String($0.1) })
        #expect(sizes == ["name", "PageType.body", "PageType.small"], "\(sizes)")
        let weights = Set(page.matches(of: /weight: \.([a-z]+)/).map { String($0.1) })
        #expect(weights == ["bold", "semibold"], "bold and semibold, and regular where none is said: \(weights)")
        // Everything starts on the margin: the sheet's name, Back's chevron, the frame, the
        // words beside it and "More like this".
        #expect(page.contains(".padding(.leading, Self.margin(for: size) - 9)") && page.contains(".padding(.leading, inset)"))
        #expect(src.contains("                .accessibilityIdentifier(\"templates.subtitle\")\n        }\n        .padding(.horizontal, Self.margin(for: size))\n        .padding(.top, Self.margin(for: size))"))
        #expect(TemplateFiles.stageCSS.contains("main > div:first-child { padding-left: 35px !important; padding-right: 35px !important;"), "an app's own margin in the panel")
    }

    /// The page keeps the card you clicked: its cover, small, beside its name; the same small
    /// cover as under "More like this", the whole picture, the same in light and dark. Under
    /// "More like this" the names start level, each with its line from the gallery under it,
    /// and three share the row evenly.
    @Test func thePageKeepsItsCoverAndMoreLikeThisLinesUp() throws {
        let src = try library
        let words = try #require(src.range(of: "private func words(_ e: TemplateCatalog.Entry) -> some View {"))
        #expect(src[words.lowerBound...].prefix(1400).contains("Self.thumbnail(e.pick, side: cover)"))
        #expect(src.contains("Self.thumbnail(r.pick)") && TemplateLibraryView.moreCover == 56)
        // All of a "More like this" tile takes the click, the gaps in it too.
        let more = try #require(src.range(of: "private func more(_ e: TemplateCatalog.Entry) -> some View {"))
        let body = String(src[more.lowerBound...].prefix(2600))
        #expect(body.contains(".padding(.leading, 8)\n                        // All of the tile takes the click"))
        #expect(body.contains(".contentShape(.rect)"))
        #expect(body.contains("HStack(alignment: .top, spacing: Self.gap)") && body.contains("HStack(alignment: .top, spacing: 12)"), "the names start level")
        #expect(body.contains("/ CGFloat(max(related.count, 1))") && body.contains(".frame(width: share - 8, alignment: .leading)"), "an even share each")
        // Every tile has its line from its card in the gallery under its name, an app's with the
        // app's mark: one pattern (a kind showed under some names and not under others).
        let reading = try entry("reading-list")
        #expect(body.contains("if r.app { AppMarkView(size: SetupTemplateCard.markSize) }\n                                    Text(TemplateLibraryWords.line(r))"))
        #expect(!src.contains("kind(r, under: e)") && !body.contains("if let kind"))
        #expect(TemplateLibraryWords.app == "App")
        // Each name and line fits its tile with four across.
        let tile = (TemplateLibraryView.size.width - TemplateLibraryView.margin * 2 - TemplateLibraryView.gap * 3) / 4 - 8 - TemplateLibraryView.moreCover - 12 - 8
        for e in Self.all {
            let name = (e.title as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: TemplateLibraryView.PageType.body, weight: .semibold)]).width
            let line = (TemplateLibraryWords.line(e) as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: TemplateLibraryView.PageType.small)]).width + (e.app ? SetupTemplateCard.markRoom : 0)
            if TemplateLibraryView.related(e, in: Self.all).count < 4, Self.all.allSatisfy({ TemplateLibraryView.related($0, in: Self.all).count < 4 || !TemplateLibraryView.related($0, in: Self.all).contains(e) }) { continue }
            #expect(name <= tile && line <= tile, "\(e.slug): its name \(name) and line \(line) in \(tile) pt")
        }
        // The small cover is the same picture in light and dark: nothing in it reads the look.
        func cover(_ dark: Bool) throws -> Pixels {
            let r = ImageRenderer(content: TemplateLibraryView.thumbnail(reading.pick).environment(\.colorScheme, dark ? .dark : .light))
            r.scale = 2
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        let light = try cover(false), dark = try cover(true)
        var differ = 0
        // Inside the hairline and its rounded corners, which are the look's own.
        for y in 22..<(light.height - 22) { for x in 22..<(light.width - 22) where light.difference(dark, at: y * light.width + x) > 12 { differ += 1 } }
        #expect(differ == 0, "\(differ) pixels of the cover differ between light and dark")
        // In the gallery the art is the cover's picture from its top, the same in both looks.
        let cards_ = try SettingsHomeTests.source("Pane/Views/SetupCards.swift")
        #expect(cards_.contains(".frame(width: width, height: art ?? Self.artHeight(width))\n                    .overlay(alignment: .top) { pick.image.resizable().scaledToFill().frame(width: width, height: width) }"))
        #expect(!cards_.contains("var tag: String?"), "no badge on the art: an app's line starts with the app's mark")
    }

    /// No note's stage is more than about a quarter empty: its example has enough in it to fill
    /// the stage (9 November 2026: Reading list showed three rows over 40% of nothing).
    @Test(arguments: all.filter { !$0.app }) func noStageIsMoreThanAQuarterEmpty(_ e: TemplateCatalog.Entry) throws {
        let size = TemplateLibraryView.size, window = TemplateLibraryView.window(for: size)
        let view = NotePreview(markdown: e.example, given: TemplateFiles.example(e), whole: true, margin: TemplateLibraryView.notePadding, tableSize: TemplateLibraryView.PageType.table)
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

    /// A note that files sub-notes shows one of them open beside it: Recipe box's list on the
    /// left and a whole recipe on the right, its name as a heading, its ingredients a checklist
    /// (the list alone said a recipe was filed and never showed one). The app's copy of the
    /// templates carries the sub-note, the first one the template's demo makes.
    @Test func aRecipeShowsOpenBesideTheBox() throws {
        let recipes = try entry("recipe-box")
        let text = try #require(recipes.opened, "the catalog carries the first recipe")
        #expect(text.hasPrefix("Lentil soup with lemon\n"))
        let blocks = try #require(TemplateFiles.opened(recipes))
        #expect(blocks.first == .heading(2, "Lentil soup with lemon"))
        #expect(blocks.filter { if case .check = $0 { true } else { false } }.count >= 5, "its ingredients, to tick")
        #expect(blocks.filter { if case .numbered = $0 { true } else { false } }.count >= 3, "its steps")
        #expect(Self.all.filter { $0.opened != nil }.map(\.slug) == ["recipe-box"])
        #expect(TemplateLibraryView.listWidth < TemplateLibraryView.window(for: TemplateLibraryView.size).width / 2)
        let src = try library
        #expect(src.contains("} else if let opened = TemplateFiles.opened(e), !Self.narrow(size) {"))
        // Both show whole in the frame: nothing of the recipe is cut off at its foot.
        let window = TemplateLibraryView.window(for: TemplateLibraryView.size)
        let host = NSHostingView(rootView: NotePreview(markdown: text, given: blocks).frame(width: window.width - TemplateLibraryView.listWidth - 1))
        host.layoutSubtreeIfNeeded()
        #expect(host.fittingSize.height <= window.height - 2, "the recipe is \(host.fittingSize.height) pt tall in a \(window.height) pt frame")
    }

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
        #expect(src.contains("NotePreview(markdown: e.example, given: TemplateFiles.example(e, room: Self.lineRoom(for: size)), whole: true,\n                            margin: Self.notePadding, tableSize: Self.tableSize(for: size), tableRoom: Self.lineRoom(for: size), tableInset: Self.tableInset(for: size))"))
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
        // Every column of a table shows: none is trimmed for the stage.
        let wide = TemplateLibraryView.staged("T\n\n## Bugs\n| A | B | C | D | E | F |\n| --- | --- | --- | --- | --- | --- |\n| 1 | 2 | 3 | 4 | 5 | 6 |\n")
        #expect(wide.contains(.table(header: ["A", "B", "C", "D", "E", "F"], rows: [["1", "2", "3", "4", "5", "6"]])), "\(wide)")
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
        #expect(css == CGSize(width: 832, height: 619), "the frame is the picture's shape: \(css)")
        #expect(abs(TemplateAppPreview.zoom(for: window) - 576.0 / 832) < 0.0001)
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
        #expect(TemplateAppPreview.css(for: small, narrow: true).width == 533 && TemplateAppPreview.zoom(for: small, narrow: true) > 0.68)
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
            #expect(staged.contains("main button.bg-primary.w-full"), "\(e.slug): the stage's stylesheet is in its page")
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
        // The app's own tabs show, at the frame's foot, and its blocks end whole above them.
        #expect(!TemplateFiles.stageCSS.contains("nav[aria-label=\"Screens\"] { display: none") && !TemplateFiles.stageCSS.contains("main { padding-bottom: 0"), "the tabs are the app's, and show in its example")
        #expect(js.contains("const limit = () => { const t = tabs(); return (t ? t.top - GAP : innerHeight - FADE) - 1 }"), "the foot is the top of the app's tabs")
        #expect(js.contains("if (!open && e.target.closest && e.target.closest('nav[aria-label=\"Screens\"]')) reveal()"), "another screen of the app shows whole")
        // Esc with the keys inside the example goes back, as Esc anywhere on the page does.
        #expect(src.contains("if open != nil, Self.inExample() { leaveExample() } else if open != nil { show(nil) } else { close() }"))
        #expect(js.contains("const cuts = [{ left: -Infinity, right: Infinity, y: limit() }]"), "the foot is worked out per column")
        let script = try SettingsHomeTests.source("scripts/template-stage-pictures.ts")
        #expect(script.contains(".sample.json") && script.contains("staged(") && !script.contains("getDay()"), "the pictures are drawn from the same sample and trim, today")
    }

    /// A note's example scrolls in its frame when it's taller, and the frame's foot fades while
    /// there's more under it, never otherwise: all of the example is there, with a cue that it is.
    @Test func anExampleScrollsAndItsFootFadesWhileTheresMore() throws {
        typealias L = TemplateLibraryView
        #expect(L.more(content: 600, offset: 0, room: 428.5) && L.more(content: 600, offset: 100, room: 428.5))
        #expect(!L.more(content: 600, offset: 171.5, room: 428.5), "at its end: no fade")
        #expect(!L.more(content: 300, offset: 0, room: 428.5), "all in view: no fade")
        // 40 pt, its last 16 solid: a line the foot cuts is under it, so what shows ends on a whole line.
        #expect(L.footFade == 40 && abs(L.footFade * (1 - L.footSolid) - 16) < 0.5)
        let src = try library
        #expect(src.contains("ScrollView(.vertical) {\n            content()"))
        #expect(src.contains(".opacity(below.contains(e.slug) ? 1 : 0)"), "the fade shows only while there's more")
        #expect(src.contains(".opacity(above.contains(e.slug) ? 1 : 0)"), "scrolled, the top fades too")
        #expect(src.components(separatedBy: "scrolls(e) {").count == 3, "a note, and a note with a sub-note open beside it")
        // In a scroll view (no height given) the blocks are as tall as they're placed: no room
        // kept under the last, none between a table's rows.
        let blocks = WholeBlocks(spacing: 4) {
            Color.red.frame(height: 20)
            Color.blue.frame(height: 30).layoutValue(key: WholeBlocks.Joined.self, value: true)
            Color.green.frame(height: 10)
        }
        let host = NSHostingView(rootView: ScrollView { blocks }.frame(width: 100, height: 40))
        host.layoutSubtreeIfNeeded()
        let tall = NSHostingView(rootView: blocks.frame(width: 100).fixedSize(horizontal: false, vertical: true)).fittingSize.height
        #expect(tall == 64, "20, 30 joined, 4, 10: \(tall)")
        // A long example is taller than its frame at the full sheet's width: it has more to scroll to.
        let window = L.window(for: L.size)
        let long = try #require(Self.all.filter { !$0.app && $0.opened == nil }.map { e -> (String, CGFloat) in
            let view = NotePreview(markdown: e.example, given: TemplateFiles.example(e), whole: true, margin: L.notePadding, tableSize: L.PageType.table)
            return (e.slug, NSHostingView(rootView: view.frame(width: window.width).fixedSize(horizontal: false, vertical: true)).fittingSize.height)
        }.max { $0.1 < $1.1 })
        #expect(long.1 > 100, "\(long.0) is \(long.1) pt tall")
    }

    /// In an example a table's words are the body's size, near enough (they were the system's
    /// 10 pt footnote beside 13 pt lines), with the columns' least widths worked out at that
    /// size; an empty checkbox is as plain as a ticked one; and in a list of sub-notes with one
    /// open beside it, that one's row is the picked one.
    @Test func anExamplesTablesChecksAndPickedRow() throws {
        let preview = try SettingsHomeTests.source("Pane/Views/NoteSourceSheet.swift")
        #expect(preview.contains(".font(tableSize.map { .system(size: $0, weight: header ? .semibold : .regular) } ?? (header ? .footnote.weight(.semibold) : .footnote))"))
        #expect(preview.contains("let least = Self.leastWidths(header: header, rows: rows, size: tableSize, loose: loose, inset: tableInset)"))
        let small = NotePreview.leastWidths(header: ["Title", "Author"], rows: [["Piranesi", "Susanna Clarke"]])
        let body = NotePreview.leastWidths(header: ["Title", "Author"], rows: [["Piranesi", "Susanna Clarke"]], size: 12)
        #expect(zip(small, body).allSatisfy { $0 < $1 }, "wider words need wider columns: \(small) \(body)")
        let src = try library
        // A table as the editor draws it at rest: its corners, its header's fill and its rules
        // come from one place (GridLook), in the editor and in an example alike.
        let grid = try SettingsHomeTests.source("Pane/Editor/TableGrid.swift")
        for part in ["GridLook.radius", "GridLook.headerFill", "GridLook.rule(increased:", "GridLook.columnLinesAtRest"] {
            #expect(grid.components(separatedBy: part).count >= 2 && preview.contains(part), "\(part) in the editor's table and in an example's")
        }
        #expect(GridLook.radius == Radius.sm && GridLook.headerFill != nil && !GridLook.columnLinesAtRest, "the reading page: rounded, a soft header, no rules between columns")
        func table(_ dark: Bool) throws -> Pixels {
            let view = NotePreview(markdown: "", given: [.table(header: ["Title", "Author"], rows: [["Piranesi", "Susanna Clarke"], ["Dune", "Frank Herbert"]])], whole: true, margin: 20, tableSize: 12)
                .frame(width: 340, height: 160, alignment: .topLeading).background(dark ? Color.black : Color.white).environment(\.colorScheme, dark ? .dark : .light)
            let r = ImageRenderer(content: view)
            r.scale = 2
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        func far(_ a: UInt32, _ b: UInt32) -> Int { (0..<3).map { abs(Int((a >> ($0 * 8)) & 255) - Int((b >> ($0 * 8)) & 255)) }.max() ?? 0 }
        for dark in [false, true] {
            let p = try table(dark)
            let ground = p.rgb(at: 4 * p.width + 4)
            // The table starts 20 pt in and 24 pt down (its margin, and 4 pt over it): at 2x, (40, 48).
            let x0 = 40, y0 = 48
            #expect(far(p.rgb(at: (y0 + 1) * p.width + x0 + 1), ground) < 12, "\(dark ? "dark" : "light"): the corner is rounded off")
            let header = p.rgb(at: (y0 + 20) * p.width + x0 + 300)
            #expect(far(header, ground) >= 8, "the header row has a fill")
            // The first body row, over its words, from one column into the next: no rule there.
            let y = y0 + 69
            let row = (x0 + 20..<x0 + 580).map { p.rgb(at: y * p.width + $0) }
            #expect(row.allSatisfy { far($0, ground) < 12 }, "no rule between the columns")
        }
        #expect(preview.contains("done ? AnyShapeStyle(Color(PColor.paneAccent)) : whole ? AnyShapeStyle(.secondary) : AnyShapeStyle(.tertiary)"))
        // The open recipe's row is picked in the list.
        let recipes = try entry("recipe-box")
        #expect(TemplateFiles.openedName(recipes) == "Lentil soup with lemon")
        #expect(recipes.example.contains("[Lentil soup with lemon](pane-note:"), "the list has the open recipe's row")
        #expect(src.contains("picked: TemplateFiles.openedName(e))"))
        func list(_ picked: String?) throws -> Pixels {
            let view = NotePreview(markdown: recipes.example, given: TemplateFiles.example(recipes, room: 204), whole: true, margin: 16, tableSize: 12, picked: picked)
                .frame(width: 236, height: 300, alignment: .topLeading).background(Color.white).environment(\.colorScheme, .light)
            let r = ImageRenderer(content: view)
            r.scale = 1
            let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
        }
        let plain = try list(nil), picked = try list("Lentil soup with lemon")
        var washed = 0
        for i in 0..<(plain.width * plain.height) where plain.difference(picked, at: i) > 8 { washed += 1 }
        #expect(washed > 2000 && washed < 12000, "one row's wash: \(washed) pixels")
    }

    // MARK: The covers

    @Test func coversAreReadOnce() throws {
        let pick = try #require(Self.all.first).pick
        _ = pick.image
        #expect(SetupCards.Pick.covers.object(forKey: pick.cover as NSString) != nil)
    }

    /// The first-run gallery's cards carry their words on the cover: the caption reads on every
    /// one (4.5:1 or more), and the title too. (The library's cards have theirs under the art.)
    @Test func everyCaptionReadsOnItsCover() throws {
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
    /// whole cover hard for the length of the press, a flash on every pick. Under the pointer a
    /// cover in the library stays where it is: a quiet ring and a touch of light or shade, no lift
    /// and no shadow, so its neighbours never seem to move. In the dark the ring is light: a black
    /// shadow on a near-black sheet showed nothing.
    @Test func aCardsPressAndHover() throws {
        let src = try SettingsHomeTests.source("Pane/Views/SetupCards.swift")
        let card = try #require(src.range(of: "struct SetupTemplateCard: View"))
        let end = try #require(src.range(of: "\nextension Color {", range: card.upperBound..<src.endIndex))
        let body = src[card.lowerBound..<end.lowerBound]
        #expect(body.components(separatedBy: ".buttonStyle(CardPress())").count == 3, "both of the card's looks")
        #expect(!body.contains(".buttonStyle(.plain)"))
        #expect(SetupTemplateCard.hoverRing(dark: true, hover: true) >= 0.4 && SetupTemplateCard.hoverBrightness(dark: true, hover: true) > 0)
        #expect(SetupTemplateCard.hoverRing(dark: true, hover: false) == 0 && SetupTemplateCard.hoverRing(dark: false, hover: true) == 0)
        #expect(SetupTemplateCard.quietRing(dark: true, hover: true) >= 0.4 && SetupTemplateCard.quietRing(dark: false, hover: true) > 0.2)
        #expect(SetupTemplateCard.quietBrightness(dark: true, hover: true) > 0 && SetupTemplateCard.quietBrightness(dark: false, hover: true) < 0)
        #expect(SetupTemplateCard.quietRing(dark: true, hover: false) == 0 && SetupTemplateCard.quietBrightness(dark: false, hover: false) == 0)
        let below = try #require(body.range(of: "private var below: some View {"))
        let onCover = try #require(body.range(of: "private var onCover: some View {"))
        let library = body[below.lowerBound..<onCover.lowerBound]
        #expect(!library.contains(".offset(") && !library.contains(".shadow("), "a library cover never lifts")
        #expect(library.contains("Self.quietRing(dark: dark, hover: over)") && library.contains("Self.quietBrightness(dark: dark, hover: over)"))
        // Under the pointer it shows, in both looks: the ring changes the art's edge.
        let pick = try #require(Self.all.first).pick
        for dark in [false, true] {
            func shot(_ hover: Bool) throws -> Pixels {
                let view = SetupTemplateCard(pick: pick, width: 185, captionBelow: true) {}
                    .environment(\.hoverPreview, hover ? ["templates.\(pick.slug)"] : [])
                    .padding(8).background(SetupCards.ground).environment(\.colorScheme, dark ? .dark : .light)
                let r = ImageRenderer(content: view)
                r.scale = 2
                let cg = try #require(r.cgImage)
            return try #require(Pixels(cg))
            }
            let rest = try shot(false), over = try shot(true)
            #expect(rest.width == over.width && rest.height == over.height, "nothing moves or grows")
            var changed = 0
            for i in 0..<(rest.width * rest.height) where rest.difference(over, at: i) > 20 { changed += 1 }
            #expect(changed > 400, "\(dark ? "dark" : "light"): the hover shows (\(changed) pixels)")
        }
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

    /// Made from the library, a template opens with no second sheet: its page has just said what
    /// it is, what Make adds and what your AI is asked. The note shows one line saying where it
    /// went, the folder as Go to Note tags one. The first-time sheet stays for a template added
    /// from the website, and making one from the library doesn't use it up.
    @Test func noSheetAfterMakeFromTheLibrary() throws {
        let defaults = try #require(UserDefaults(suiteName: "templates.firstopen.\(UUID().uuidString)"))
        let first = FirstOpen(defaults: defaults)
        let note = UUID()
        var draft = NoteDraft(link: NoteSourceLink(kind: .template, slug: "reading-list"), title: "Reading list", body: "Reading list\n", leftOut: 0)
        draft.ask = "Ask which book I want to add."
        first.added(note: note, draft: draft)
        #expect(first.pending[note]?.full == true, "from the website: the first-time sheet")
        first.fromLibrary(note, title: "Reading list", slug: "reading-list", isApp: false, folder: "Reading")
        let moment = try #require(first.pending[note])
        #expect(!moment.full, "from the library: no sheet")
        #expect(NoticeText.plain(moment.line) == "Added to Reading" && moment.line.contains(FirstOpen.folderMark))
        first.start(moment)
        #expect(first.pending[note] == nil)
        // Not used up: the next template from the website still gets its sheet.
        let later = UUID()
        first.added(note: later, draft: draft)
        #expect(first.pending[later]?.full == true)
        // A template you had already: the library opens it, and the line says it was there.
        let had = UUID()
        first.fromLibrary(had, title: "Trip plan", slug: "trip-plan", isApp: true, folder: "Travel")
        #expect(NoticeText.plain(first.pending[had]?.line ?? "") == "Already in Travel" && first.pending[had]?.full == false)
        #expect(FirstOpen.Moment(note: UUID(), isApp: false, title: "", description: nil, ask: nil, slug: "", preview: nil, full: false).line == "Added to your notes")
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        let made = try #require(root.range(of: "private func templates(_ ais: [SetupCards.AI]) -> some View {"))
        let body = String(root[made.lowerBound...].prefix(4200))
        let quiet = try #require(body.range(of: "FirstOpen.shared.fromLibrary(note, title: e.title, slug: e.slug"))
        let shows = try #require(body.range(of: "selection = [note]"))
        #expect(quiet.lowerBound < shows.lowerBound, "the sheet is put off before the note opens")
        let detail = try SettingsHomeTests.source("Pane/Views/NoteDetailView.swift")
        #expect(detail.contains("notice(m.line)") && detail.contains("NoticeText.text(undoFailed)"))
        // While an app shows, the line is in the window's bar, never over the app: there it
        // sat on the app's bar of screens, and moved up, on a row of Budget.
        #expect(detail.contains("if let undoFailed, !noticeInBar {") && detail.contains("said: said?.text ?? (noticeInBar ? undoFailed : nil),"))
        #expect(detail.contains("if let said = self.parts?.said {\n                        ToolbarItem {\n                            HStack(spacing: 8) {\n                                NoticeText.text(said)"))
        #expect(!detail.contains("noticeOverAppBar"))
    }

    /// After Make the window's bar says where it went, for a note and an app alike (a note's line
    /// sat over its foot, where you type), with Undo beside it. Undo, and Command-Z ("Undo Add
    /// Note" in Edit), take it back: the note goes to Recently Deleted and you're where you were.
    /// The caret is where you'd write first. An app's first screen has drawn before the library
    /// goes, so the pane is never empty in between. Made while sync was away, the line says the
    /// AI can fill it in after it syncs, and when sync is back the same place offers to ask it.
    @Test func afterMakeTheBarSaysWhereWithUndo() throws {
        let defaults = try #require(UserDefaults(suiteName: "firstopen.undo.\(UUID().uuidString)"))
        let first = FirstOpen(defaults: defaults)
        let note = UUID()
        var undone = 0
        first.fromLibrary(note, title: "Reading list", slug: "reading-list", isApp: false, folder: "Notes", hadIt: false, waitingFor: "ChatGPT", undo: { undone += 1 })
        let moment = try #require(first.pending[note])
        #expect(!moment.full && !moment.hadIt)
        #expect(NoticeText.plain(moment.line) == "Added to Notes. ChatGPT can fill it in after it syncs.")
        first.takeUndo(note)?()
        #expect(undone == 1 && first.takeUndo(note) == nil, "Undo is taken once")
        let had = UUID()
        first.fromLibrary(had, title: "Trip plan", slug: "trip-plan", isApp: true, folder: "Travel")
        #expect(NoticeText.plain(first.pending[had]?.line ?? "") == "Already in Travel" && first.takeUndo(had) == nil, "one you had: nothing to undo")
        let detail = try SettingsHomeTests.source("Pane/Views/NoteDetailView.swift")
        #expect(detail.contains("undoManager?.registerUndo(withTarget: context) { _ in MainActor.assumeIsolated { undo() } }\n                    undoManager?.setActionName(m.isApp ? \"Add App\" : \"Add Note\")"))
        #expect(detail.contains("say(m.line, action: undo.map { run in (\"Undo\", { self.said = nil; run() }) })"))
        #expect(detail.contains("Button(action.title, action: action.run)\n                                        .buttonStyle(LinkButtonStyle())"))
        #expect(detail.contains("if !m.hadIt { landInMade() }"))
        #expect(detail.contains("say(\"Synced.\", action: (\"Ask \\(w.ai)\", {"), "sync is back: the same place offers to ask the AI")
        // The caret: the first empty cell under a table's header; with no table, the note's end.
        let reading = TemplateSkeleton.withFirstRows(try #require(try entry("reading-list").note))
        let cell = try #require(NoteDetailView.firstEmptyCell(in: reading))
        #expect(cell.grid == 0 && cell.cell == GridCell(row: 1, column: 0))
        #expect(NoteDetailView.firstEmptyCell(in: "Title\n\n| A | B |\n| --- | --- |\n| 1 |  |\n")?.cell == GridCell(row: 1, column: 1))
        #expect(NoteDetailView.firstEmptyCell(in: try #require(try entry("meeting-notes").note)) == nil)
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        let made = try #require(root.range(of: "private func templates(_ ais: [SetupCards.AI]) -> some View {"))
        let body = String(root[made.lowerBound...].prefix(4200))
        #expect(body.contains("if let n = context.note(note), n.trashedAt == nil { context.trash(n) }\n                            selection = before.0\n                            scope = before.1"))
        let waits = try #require(body.range(of: "if isApp { await appDrawn(note) }")), closes = try #require(body.range(of: "withAnimation(.snappy(duration: 0.2)) { templateAIs = nil }"))
        #expect(waits.lowerBound < closes.lowerBound, "the library stays until the app's first screen has drawn")
        #expect(root.contains("while NotePageLive.view(note) == nil, start.duration(to: .now) < .seconds(1.5)"))
    }

    /// A template's table that has only its header gets one empty row when the note is added: a
    /// header alone drew as one small rounded bar, which read as a control, not a table to fill
    /// in. An app's note is left as it is (its app reads it), and so is a table that has rows.
    @Test func anEmptyTableStartsWithOneRow() throws {
        let bare = "Reading list\n\n## Books\n<!-- pane-table: Title=text; Rating=scale 1-5 -->\n| Title | Author | Rating |\n| --- | --- | --- |\n\n## Notes\n"
        let rowed = TemplateSkeleton.withFirstRows(bare)
        #expect(rowed == "Reading list\n\n## Books\n<!-- pane-table: Title=text; Rating=scale 1-5 -->\n| Title | Author | Rating |\n| --- | --- | --- |\n|  |  |  |\n\n## Notes\n")
        #expect(TemplateSkeleton.withFirstRows(rowed) == rowed, "a table with a row keeps what it has")
        let grid = try #require(NoteStructure(rowed).grids.first)
        #expect(grid.columns == 3 && grid.rows.count == 2 && grid.rows.allSatisfy { $0.count == 3 }, "the header and one empty row: \(grid.rows)")
        #expect(TemplateSkeleton.withFirstRows("| A | B |\n| --- | --- |") == "| A | B |\n| --- | --- |\n|  |  |", "a table at the note's end")
        #expect(TemplateSkeleton.withFirstRows("No table here.\n- [ ] One\n") == "No table here.\n- [ ] One\n")
        for e in Self.all where !e.app {
            let note = try #require(e.note)
            for g in NoteStructure(TemplateSkeleton.withFirstRows(note)).grids {
                #expect(g.rows.count >= 2, "\(e.slug): a table with only its header")
            }
        }
        let source = try SettingsHomeTests.source("Pane/Model/NoteSource.swift")
        #expect(source.contains("if link.kind == .template, d.appProject == nil { d.body = TemplateSkeleton.withFirstRows(d.body) }"))
    }

    /// A template's table as it lands fills the note's width, not just its headers': a tracker (a
    /// table with column types) always does, so it doesn't grow as it's filled in. A plain short
    /// table keeps its own width, as before.
    @Test func aTrackerFillsTheNotesWidth() throws {
        let note = TemplateSkeleton.withFirstRows(try #require(try entry("reading-list").note))
        let tracker = try #require(NoteStructure(note).grids.first)
        #expect(tracker.types != nil)
        #expect(abs(tracker.columnWidths(available: 620).reduce(0, +) - 620) < 1, "\(tracker.columnWidths(available: 620))")
        let plain = try #require(NoteStructure("T\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n").grids.first)
        #expect(plain.types == nil && plain.columnWidths(available: 620).reduce(0, +) < 300, "a plain short table keeps its own width")
        for e in Self.all where !e.app {
            for g in NoteStructure(TemplateSkeleton.withFirstRows(try #require(e.note))).grids where g.types != nil {
                #expect(abs(g.columnWidths(available: 620).reduce(0, +) - 620) < 1, "\(e.slug)")
            }
        }
    }

    /// In the real editor, offscreen: a template's note as it lands has its table as a grid of
    /// two rows, the header and the empty one. (Pictures with AMBER_QA_SHOTS: before and after.)
    @Test func theLandedTableIsAGridOfTwoRows() async throws {
        let note = try #require(try entry("reading-list").note)
        let h = await EditorHarness(TemplateSkeleton.withFirstRows(note), focus: false)
        defer { h.close() }
        #expect(h.gridCount == 1)
        if ProcessInfo.processInfo.environment["AMBER_QA_SHOTS"] != nil {
            await h.snapshot("landing-reading-list-after")
            let before = await EditorHarness(note, focus: false)
            await before.snapshot("landing-reading-list-before")
            before.close()
        }
    }

    /// The sheet that greets a template added from the website is all there when it opens on the
    /// Mac (it built in line by line), as tall as what it holds (a set height left 100 pt of
    /// nothing under Start), and is put away when the library is opened again.
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
        let both: [SetupCards.AI] = [.chatgpt, .claude]
        let states: [(String, TemplateCatalog.Entry?, String, String, CGSize, [SetupCards.AI], TemplateCatalog.Entry?, Set<String>)] = [
            ("1-gallery", nil, "All", "", big, both, nil, []),
            ("1b-gallery-keys-on-a-cover", nil, "All", "", big, both, entry("reading-list"), []),
            ("1c-gallery-pointer-on-a-cover", nil, "All", "", big, both, nil, ["templates.meeting-notes"]),
            ("2-gallery-apps", nil, "Apps", "", big, both, nil, []),
            ("3-gallery-search-trip", nil, "All", "trip", big, both, nil, []),
            ("3b-gallery-search-notes", nil, "All", "notes", big, both, nil, []),
            ("3c-gallery-search-notes-in-work", nil, "Work", "notes", big, both, nil, []),
            ("4-gallery-nothing-matches", nil, "All", "zebra", big, both, nil, []),
            ("4b-gallery-nothing-matches-in-work", nil, "Work", "zebra", big, both, nil, []),
            ("5-gallery-small-window", nil, "All", "", small, both, nil, []),
            ("6-page-app-habits", entry("habit-tracker"), "All", "", big, both, nil, []),
            ("7-page-table-reading-list", entry("reading-list"), "All", "", big, both, nil, []),
            ("8-page-plain-meeting-notes", entry("meeting-notes"), "All", "", big, both, nil, []),
            ("8b-page-long-name", entry("study-flashcards"), "All", "", big, both, nil, []),
            ("9-page-no-ai-app", entry("trip-plan"), "All", "", big, [.other], nil, []),
            ("9b-page-no-ai-note", entry("workout-log"), "All", "", big, [.other], nil, []),
            ("10-page-claude", entry("bug-triage"), "All", "", big, [.claude, .chatgpt], nil, []),
            ("11-page-small-window", entry("budget-log"), "All", "", small, both, nil, []),
            ("11b-page-small-window-note", entry("job-hunt"), "All", "", small, both, nil, []),
        ]
        for (name, open, filter, query, size, ais, focused, hover) in states {
            let view = TemplateLibraryView(catalog: c, ais: ais, open: open, filter: filter, query: query, focused: focused, size: size)
                .environment(\.inSheet, true)
                .environment(\.hoverPreview, hover)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(SetupCards.ground)
                .tint(Color(PColor.paneAccent))
            try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"), size: size, dark: dark)
        }
        // The states the list above has no column for.
        func shoot(_ name: String, _ library: TemplateLibraryView, size: CGSize, hover: Set<String> = [], reach: SyncEngine.Reach = .online) async throws {
            let view = library
                .environment(\.inSheet, true)
                .environment(\.networkReach, reach)
                .environment(\.hoverPreview, hover)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(SetupCards.ground)
                .tint(Color(PColor.paneAccent))
            try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"), size: size, dark: dark)
        }
        try await shoot("9c-page-no-ai-with-the-way-to-connect", TemplateLibraryView(catalog: c, ais: [.other], open: entry("reading-list"), connect: {}, size: big), size: big)
        try await shoot("12a-make-at-rest", TemplateLibraryView(catalog: c, ais: both, open: entry("reading-list"), folder: "Work", size: big), size: big)
        try await shoot("12b-make-under-the-pointer", TemplateLibraryView(catalog: c, ais: both, open: entry("reading-list"), folder: "Work", size: big), size: big, hover: ["split.hover"])
        try await shoot("12c-make-pressed", TemplateLibraryView(catalog: c, ais: both, open: entry("reading-list"), folder: "Work", size: big), size: big, hover: ["split.pressed"])
        try await shoot("9d-page-one-ai-no-arrow", TemplateLibraryView(catalog: c, ais: [.chatgpt], open: entry("reading-list"), folder: "Work", size: big), size: big)
        try await shoot("13-page-one-you-already-made", TemplateLibraryView(catalog: c, ais: both, open: entry("habit-tracker"), folder: "Work", have: { _ in "Notes" }, size: big), size: big)
        try await shoot("13b-page-a-long-folder-name", TemplateLibraryView(catalog: c, ais: both, open: entry("meeting-notes"), folder: "Everything for the house move in March", size: big), size: big)
        try await shoot("13c-page-while-sync-is-away", TemplateLibraryView(catalog: c, ais: both, open: entry("reading-list"), folder: "Work", size: big), size: big, reach: .offline)
        try await shoot("13d-page-app-while-sync-is-away", TemplateLibraryView(catalog: c, ais: both, open: entry("habit-tracker"), folder: "Work", size: big), size: big, reach: .offline)
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
        let byKind = TemplateCatalog.topics.flatMap { TemplateCatalog.shipped.shown(filter: $0, query: "") }
        #expect(TemplateCatalog.filters.first == "All" && TemplateCatalog.filters.last == "Apps" && TemplateCatalog.topics.count == 4, "Apps is a format: last, apart from the topics")
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

    /// While sync is away (no network, or only the server away), Make with an AI still adds the
    /// note and copies the ask, and doesn't open the AI: it can't see a note that hasn't synced.
    /// "Add without AI" is as ever.
    @Test(arguments: [SyncEngine.Reach.offline, .unreachable])
    func makeWhileSyncIsAwayAddsTheNoteAndOpensNothing(reach: SyncEngine.Reach) async throws {
        let e = try #require(Self.all.first)
        let container = try store()
        let ctx = container.mainContext
        var copied: [String] = []
        var opened: [URL] = []
        let made = await TemplateMaking.make(e, with: .chatgpt, context: ctx, account: nil, reach: reach, source: ShippedTemplates(site: Offline()),
                                             ledger: ledger(), copy: { copied.append($0) }, open: { opened.append($0) })
        let id = try #require(made)
        let note = try #require(ctx.note(id))
        #expect(note.title == e.title && note.dirty)
        #expect(copied.count == 1 && opened.isEmpty, "the ask is ready to paste; no browser on a page that can't load")
        let last = try #require(Self.all.last)
        let plain = await TemplateMaking.make(last, with: .other, context: ctx, account: nil, reach: reach,
                                              source: ShippedTemplates(site: Offline()), ledger: ledger(), copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(plain != nil && copied.count == 1 && opened.isEmpty)
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
        // As added: a table with only its header starts with one empty row.
        #expect(note.body == (e.app ? e.note : e.note.map(TemplateSkeleton.withFirstRows)))
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
        // Asked about one you have: the everyday ask, not the one that set it up.
        let later = SetupCards.prompt(e.pick(asking: TemplateLibraryWords.everydayAsk(e)))
        #expect(opened.last?.host == "claude.ai" && opened.last?.path == "/new" && copied.last == later)
        #expect((later == prompt) == (TemplateLibraryWords.everyday[e.slug] == nil))
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
