#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
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

    /// Every template says its name under the stage, notes too: a note's own title can be off a
    /// small stage, and then nothing named it (council, 8 November 2026; on 2026-10-30 a note's
    /// name showed only in the note). The ask keeps its two lines, never cut to one.
    @Test func everyTemplateSaysItsNameUnderTheStage() throws {
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appending(path: "Pane/Views/TemplateLibrary.swift"), encoding: .utf8)
        #expect(!src.contains("if e.app {\n                        Text(e.title)"))
        #expect(src.contains("Text(e.title).font(.system(size: Self.panelTitle, weight: .semibold))"))
        // The ask shows as it's sent: no "…" gap (the AI gets none either), in a box that fits it.
        #expect(src.contains("Text(TemplateCatalog.Entry.sendable(e.ask))\n                        .font(.system(size: text)).foregroundStyle(Color.ink)\n                        .lineLimit(2)\n"))
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


/// How the template library behaves (Emil, 8 November 2026: "it works a bit weird").
@MainActor @Suite struct TemplateLibraryBehaviour {
    /// One template is always open, so the grid keeps its width and picking a card never moves
    /// the others: with none open it was five across, then three after the first click.
    @Test func aTemplateIsAlwaysOpen() throws {
        let c = TemplateCatalog.shipped
        let all = c.shown(filter: "All", query: "")
        #expect(TemplateLibraryView.showing(all, open: nil) == all.first)
        let meeting = try #require(all.first { $0.slug == "meeting-notes" })
        #expect(TemplateLibraryView.showing(all, open: meeting) == meeting)
        // A kind that doesn't have the open one opens its own first.
        let apps = c.shown(filter: "Apps", query: "")
        #expect(TemplateLibraryView.showing(apps, open: meeting) == apps.first)
        // No match keeps the open one: the panel never leaves and slides back (council, 8 November 2026).
        #expect(TemplateLibraryView.showing([], open: meeting) == meeting)
        #expect(TemplateLibraryView.showing([], open: nil) == nil)
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(!src.contains(".move(edge: .trailing)"), "the panel no longer slides in and squeezes the grid")
    }

    /// The arrow keys move through the cards: one along, or a row of three.
    @Test func arrowKeysMoveThroughTheCards() {
        let all = TemplateCatalog.shipped.shown(filter: "All", query: "")
        #expect(TemplateLibraryView.step(all, from: all[0], by: 1) == all[1])
        #expect(TemplateLibraryView.step(all, from: all[4], by: -3) == all[1])
        #expect(TemplateLibraryView.step(all, from: all[0], by: -1) == all[0], "the first stays put")
        #expect(TemplateLibraryView.step(all, from: all.last, by: 3) == all.last, "the last stays put")
        #expect(TemplateLibraryView.step([], from: nil, by: 1) == nil)
    }

    /// The sheet fits the window it's on, and is never smaller than its buttons need.
    @Test func theSheetFitsItsWindow() {
        #expect(TemplateLibraryView.size(on: CGSize(width: 1600, height: 1000)) == TemplateLibraryView.size)
        #expect(TemplateLibraryView.size(on: CGSize(width: 800, height: 560)) == CGSize(width: 720, height: 500))
        #expect(TemplateLibraryView.size(on: CGSize(width: 1000, height: 700)) == CGSize(width: 920, height: 640))
        // The kinds fit the smallest sheet: one word each (the full names made the control 750 pt).
        // "Personal", not "Home", which read like a way back (council, 8 November 2026).
        #expect(TemplateCatalog.filters.map(TemplateCatalog.label) == ["All", "Apps", "Health", "Work", "Learning", "Personal"])
    }

    /// With no match the message takes the grid's place and the open template stays beside it,
    /// so clearing the search moves nothing (council, 8 November 2026).
    @Test func noMatchKeepsTheOpenTemplate() throws {
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        let body = try #require(src.components(separatedBy: "var body: some View {").dropFirst().first?.components(separatedBy: "private var columns").first)
        let none = try #require(body.range(of: "templates.none")), panel = try #require(body.range(of: "if let current { detail(current) }"))
        #expect(none.lowerBound < panel.lowerBound, "the message and the panel share one row")
        #expect(body.components(separatedBy: "HStack(spacing: 0)").count == 2, "one row, whether or not anything matches")
        #expect(body.contains("Self.showing(shown, open: open ?? catalog.entries.first)"))
    }

    /// A small sheet keeps two columns of smaller cards, never one big card, and a narrower panel
    /// (council, 8 November 2026: one card at 231 pt on 800 x 560, against 173 on the full sheet).
    @Test func aSmallSheetKeepsTwoColumns() {
        let small = TemplateLibraryView.size(on: CGSize(width: 800, height: 560))
        #expect(TemplateLibraryView.panel(for: small) == 360 && TemplateLibraryView.panel(for: TemplateLibraryView.size) == 440)
        let row = small.width - TemplateLibraryView.panel(for: small) - 49
        let w = TemplateLibraryView.cardWidth(row: row, gap: 16)
        #expect(((row + 16) / (w + 16)).rounded(.down) == 2 && w <= 160, "\(w)")
        // The full sheet is as it was: three across, none narrower than the gallery's.
        let full = TemplateLibraryView.cardWidth(row: 551, gap: 16)
        #expect(full >= SetupTemplateCard.size.width && 3 * full + 32 <= 551)
    }

    /// The panel's parts have set heights, so its words and buttons sit in the same place for
    /// every template (council: the gap above the buttons went from 43 to 102 pt), and the stage
    /// never takes its height from the cover (a square that cut the window's top off).
    @Test func thePanelKeepsItsPlaceFromTemplateToTemplate() throws {
        #expect(TemplateLibraryView.stage(for: TemplateLibraryView.size) == 300)
        // A small sheet hides the subtitle and gives its room to the stage (council round 2).
        #expect(TemplateLibraryView.stage(for: CGSize(width: 720, height: 500)) == 172)
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(src.contains(".lineLimit(3, reservesSpace: true)"), "the description keeps three lines' room")
        #expect(src.contains(".frame(width: panel, height: stage)"))
        #expect(!src.contains("ZStack(alignment: .top) {\n                ground"), "the cover no longer sizes the stage")
    }

    /// The app's picture shows its full width, never cut at the right edge ("11-", "Princip").
    @Test func anAppPictureFitsItsWidth() throws {
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(src.contains("} else {\n                            Image(nsImage: picture).resizable().scaledToFit()\n"))
        // On a small sheet it's drawn as a 560 pt view shows it, from the top left, so its words
        // read (council round 2: 2.5 pt type across a 328 pt window).
        #expect(src.contains(".frame(width: drawn, height: drawn * picture.size.height / max(picture.size.width, 1))"))
        #expect(src.contains("drawn: Self.small(size) ? Self.smallPictureWidth : nil"))
        #expect(TemplateLibraryView.smallPictureWidth == 560)
    }

    /// Search's clear x and the cards' close x are apart: the close x by the title, Search on the
    /// kinds' row (they sat 36 pt apart). The buttons are the Mac's sheet size, 28 pt, with
    /// Make's word on what it does.
    @Test func searchSitsAwayFromCloseAndButtonsAreSheetSized() throws {
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        let header = try #require(src.components(separatedBy: "private var header: some View {").dropFirst().first?.components(separatedBy: "private var search").first)
        let close = try #require(header.range(of: "CardCloseButton(action: close)"))
        let kinds = try #require(header.range(of: "Picker(\"Kind\""))
        let search = try #require(header.range(of: "\n                search\n"))
        #expect(close.lowerBound < kinds.lowerBound && kinds.lowerBound < search.lowerBound)
        #expect(src.contains(".amberProminent(.compact, wide: true, joined: .leading) : .amberProminent(.compact, wide: true)"))
        #expect(!src.contains(".amberProminent(.regular"))
        #expect(TemplateLibraryWords.opensWith(.chatgpt) == "Adds the note, then asks ChatGPT:")
        #expect(TemplateLibraryWords.opensWith(.other).hasPrefix("Adds the note."))
        // Title Case, and on a small sheet Copy is its icon so Make keeps its whole name.
        #expect(TemplateLibraryWords.copy == "Copy Prompt")
        #expect(src.contains(".help(TemplateLibraryWords.copy)"))
    }

    /// The trip's ask matches the trip its picture shows: Lisbon, 22 to 26 October (it asked for
    /// four days in May beside a picture of five in October).
    @Test func theTripAskMatchesItsPicture() throws {
        let trip = try #require(TemplateCatalog.shipped.entries.first { $0.slug == "trip-plan" })
        #expect(trip.ask.contains("22 to 26 October") && !trip.ask.contains("May"))
    }

    /// The open card is scrolled into full view with 16 pt to spare: on opening, on a pick, a key
    /// or a kind (council: it was a 23 pt sliver, or off screen on a small sheet).
    @Test func theOpenCardIsInView() async throws {
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let c = TemplateCatalog.shipped
        let size = TemplateLibraryView.size(on: CGSize(width: 800, height: 560))
        let weekly = try #require(c.entries.first { $0.slug == "weekly-review" })
        let host = NSHostingView(rootView: TemplateLibraryView(catalog: c, ais: [.chatgpt, .claude], open: weekly, size: size).environment(\.inSheet, true)
            .frame(width: size.width, height: size.height, alignment: .topLeading).environment(\.controlActiveState, .key))
        host.frame = CGRect(origin: .zero, size: size)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        host.appearance = NSAppearance(named: .aqua)
        window.appearance = host.appearance
        window.contentView = host
        defer { window.close() }
        try await Task.sleep(for: .milliseconds(1000))
        host.layoutSubtreeIfNeeded()
        func scrolls(_ v: NSView) -> [NSScrollView] { ((v as? NSScrollView).map { [$0] } ?? []) + v.subviews.flatMap(scrolls) }
        let grid = try #require(scrolls(host).max { $0.frame.width < $1.frame.width })
        #expect(grid.contentView.bounds.minY > 0, "scrolled down to it")
        // The open card where it's drawn: its ring, the only accent in the gap beside it.
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.appearance!.performAsCurrentDrawingAppearance { host.cacheDisplay(in: host.bounds, to: rep) }
        let i = try #require(c.entries.firstIndex(of: weekly))
        let row = size.width - TemplateLibraryView.panel(for: size) - 49
        let w = TemplateLibraryView.cardWidth(row: row, gap: 16)
        let columns = Int((row + 16) / (w + 16))
        let x = 24 + CGFloat(i % columns) * (w + 16) - 1.5
        let scale = CGFloat(rep.pixelsWide) / host.bounds.width
        var rows: [CGFloat] = []
        for y in 0..<rep.pixelsHigh {
            guard let p = rep.colorAt(x: Int((x * scale).rounded()), y: y)?.usingColorSpace(.sRGB) else { continue }
            // The accent's orange, however the offscreen window dims it.
            if p.alphaComponent > 0.5, p.redComponent - p.blueComponent > 0.3, p.redComponent - p.greenComponent > 0.15 { rows.append(CGFloat(y) / scale) }
        }
        let ringTop = try #require(rows.min()), ringBottom = try #require(rows.max())
        let ring = (ringTop, ringBottom)
        // The grid's top and bottom in the picture: under the header's line, to the sheet's foot.
        let seenTop = host.bounds.height - grid.convert(grid.bounds, to: host).maxY
        let seenBottom = host.bounds.height - grid.convert(grid.bounds, to: host).minY
        let top = host.isFlipped ? grid.convert(grid.bounds, to: host).minY : seenTop
        let bottom = host.isFlipped ? grid.convert(grid.bounds, to: host).maxY : seenBottom
        print("PERF templates open card ring \(ring.0)...\(ring.1), seen \(top)...\(bottom)")
        // The ring sits 3 pt outside the card: 16 pt of room is 13 to the ring.
        #expect(ring.0 >= top + 12 && ring.1 <= bottom - 12, "ring \(ring.0)...\(ring.1) in \(top)...\(bottom)")
    }


    /// The sheet drawn offscreen, light, on the default theme, as its sheet shows it.
    private func drawn(open: TemplateCatalog.Entry?, size: CGSize) async throws -> (rep: NSBitmapImageRep, scale: CGFloat) {
        let host = NSHostingView(rootView: TemplateLibraryView(catalog: .shipped, ais: [.chatgpt, .claude], open: open, size: size).environment(\.inSheet, true)
            .frame(width: size.width, height: size.height, alignment: .topLeading).background(SetupCards.ground).environment(\.controlActiveState, .key))
        host.frame = CGRect(origin: .zero, size: size)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        host.appearance = NSAppearance(named: .aqua)
        window.appearance = host.appearance
        window.contentView = host
        defer { window.close() }
        try await Task.sleep(for: .milliseconds(800))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.appearance!.performAsCurrentDrawingAppearance { host.cacheDisplay(in: host.bounds, to: rep) }
        return (rep, CGFloat(rep.pixelsWide) / size.width)
    }

    /// Nothing on the stage fades: the window is opaque to the stage's foot, so the cover's art
    /// never shows through the note (council round 2: grey cart wheels over a grocery list).
    @Test func theCoverNeverShowsThroughTheNote() async throws {
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let size = TemplateLibraryView.size
        let meal = try #require(TemplateCatalog.shipped.entries.first { $0.slug == "meal-plan" })
        let (rep, scale) = try await drawn(open: meal, size: size)
        let panel = TemplateLibraryView.panel(for: size)
        // The stage's foot: from the top, the header (to the line under the kinds), then the stage.
        // The header's line: at the sheet's left edge, outside the header's 24 pt inset, the first
        // row that isn't the ground.
        var line = 0
        let ground = try #require(rep.colorAt(x: Int(8 * scale), y: Int(8 * scale))?.usingColorSpace(.sRGB))
        for y in Int(40 * scale)..<Int(200 * scale) {
            guard let p = rep.colorAt(x: Int(8 * scale), y: y)?.usingColorSpace(.sRGB) else { continue }
            if abs(p.brightnessComponent - ground.brightnessComponent) > 0.04 { line = y; break }
        }
        #expect(line > 0, "found the header's line")
        let foot = CGFloat(line) / scale + TemplateLibraryView.stage(for: size)
        // Across the window's width, just above the stage's foot: the window's white, no art.
        var art: [Int] = [], samples = 0
        for x in stride(from: size.width - panel + 32, to: size.width - 32, by: 4) {
            guard let p = rep.colorAt(x: Int(x * scale), y: Int((foot - 4) * scale))?.usingColorSpace(.sRGB) else { continue }
            samples += 1
            let spread = max(p.redComponent, p.greenComponent, p.blueComponent) - min(p.redComponent, p.greenComponent, p.blueComponent)
            // Text in the note is grey ink (a tick can be the accent); the cover is coloured.
            if spread > 0.15 { art.append(Int(x)) }
        }
        #expect(samples > 50 && art.count * 10 < samples, "the cover shows through at \(art.count) of \(samples): x \(art.prefix(8))")
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(!src.contains("LinearGradient"), "no fade on the stage")
    }

    /// The rows are 16 pt apart, as the columns are, and a third row shows under the first two,
    /// so the grid doesn't look finished at six cards (council round 2: the rows were 32 apart).
    @Test func rowsAreAsFarApartAsColumns() async throws {
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let size = TemplateLibraryView.size
        let (rep, scale) = try await drawn(open: nil, size: size)
        let row = size.width - TemplateLibraryView.panel(for: size) - 49
        let w = TemplateLibraryView.cardWidth(row: row, gap: 16)
        // The second column, not the open (first) card with its ring; on its middle.
        let x = Int((24 + w + 16 + w / 2) * scale)
        let ground = try #require(rep.colorAt(x: Int(10 * scale), y: rep.pixelsHigh - Int(10 * scale))?.usingColorSpace(.sRGB))
        func isGround(_ y: Int) -> Bool {
            guard let p = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB) else { return false }
            return abs(p.redComponent - ground.redComponent) + abs(p.greenComponent - ground.greenComponent) + abs(p.blueComponent - ground.blueComponent) < 0.03
        }
        // Runs of ground and card down the column, under the header.
        var runs: [(card: Bool, length: Int)] = []
        for y in Int(140 * scale)..<rep.pixelsHigh {
            let card = !isGround(y)
            if let last = runs.last, last.card == card { runs[runs.count - 1].length += 1 } else { runs.append((card, 1)) }
        }
        let cards = runs.filter(\.card)
        #expect(cards.count >= 3, "a third row shows: \(runs.map { "\($0.card ? "card" : "gap") \(CGFloat($0.length) / scale)" })")
        let gaps = runs.enumerated().filter { !$0.element.card && $0.offset > 0 && $0.offset < runs.count - 1 }.map { CGFloat($0.element.length) / scale }
        let between = try #require(gaps.first)
        #expect(abs(between - 16) <= 1.5, "rows \(between) pt apart")
    }

    /// A note is named once in the panel: its title is left off the stage, and on a small sheet
    /// its opening lines too, so the stage shows the note filled in.
    @Test func aNoteIsNamedOnce() throws {
        let meeting = try #require(TemplateCatalog.shipped.entries.first { $0.slug == "meeting-notes" })
        let full = TemplateLibraryView.staged(meeting.example, small: false)
        #expect(!full.contains(.title("Meeting notes")))
        if case .paragraph = full.first {} else { Issue.record("the full stage starts with the note's words: \(String(describing: full.first))") }
        let small = TemplateLibraryView.staged(meeting.example, small: true)
        if case .heading = small.first {} else { Issue.record("the small stage starts at the first heading: \(String(describing: small.first))") }
        #expect(TemplateLibraryView.panelTitle == 17)
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(src.contains(".font(.system(size: Self.panelTitle, weight: .semibold))"))
    }

    /// The ask's box fits its words and sits on the buttons, under a label in regular weight
    /// that ends on the ask (council round 2: an empty second line read as a field to type in,
    /// and the label ended on "with" in a heading's weight).
    @Test func theAskBoxFitsItsWords() throws {
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(!src.contains(".lineLimit(2, reservesSpace: true)"))
        #expect(src.contains("Text(TemplateLibraryWords.opensWith(ai)).font(.system(size: 12)).foregroundStyle(Color.muted)"))
        for ai in [SetupCards.AI.chatgpt, .claude, .other] { #expect(TemplateLibraryWords.opensWith(ai).hasSuffix(":")) }
        #expect(TemplateLibraryWords.opensWith(.claude) == "Adds the note, then asks Claude:")
    }

    /// A small sheet hides the subtitle, Search and the kinds are both 28 pt, and no match says
    /// it as a Mac search does.
    @Test func theHeaderIsSmallAndEven() throws {
        let src = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        let header = try #require(src.components(separatedBy: "private var header: some View {").dropFirst().first?.components(separatedBy: "private var search").first)
        #expect(header.contains("if !Self.small(size) {\n                        Text(TemplateLibraryWords.line)"))
        #expect(header.contains(".controlSize(.large)"))
        #expect(src.contains(".frame(height: 28)"))
        #expect(TemplateLibraryWords.none("zebra") == "No Results for \u{201C}zebra\u{201D}")
        #expect(TemplateLibraryWords.noneHint == "Check the spelling or try a new search.")
    }

    /// Covers are read once, not again for every card on every key typed.
    @Test func coversAreReadOnce() throws {
        let pick = try #require(TemplateCatalog.shipped.entries.first).pick
        _ = pick.image
        #expect(SetupCards.Pick.covers.object(forKey: pick.cover as NSString) != nil)
    }
}

/// Pictures of the template library for the design council (8 November 2026): the states you
/// meet, in light and dark, drawn offscreen as its sheet shows them.
@MainActor @Suite struct TemplateLibraryShots {
    static let dir = ProcessInfo.processInfo.environment["AMBER_TEMPLATE_SHOTS"].map { URL(fileURLWithPath: $0) }

    @Test(arguments: [false, true]) func shots(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let c = TemplateCatalog.shipped
        let states: [(String, TemplateCatalog.Entry?, String, String, CGSize)] = [
            ("1-opened", nil, "All", "", TemplateLibraryView.size),
            ("2-note-picked", c.entries.first { $0.slug == "meeting-notes" }, "All", "", TemplateLibraryView.size),
            ("3-app-picked-habits", c.entries.first { $0.slug == "habit-tracker" }, "All", "", TemplateLibraryView.size),
            ("3b-app-picked-trip", c.entries.first { $0.slug == "trip-plan" }, "All", "", TemplateLibraryView.size),
            ("3c-app-picked-budget-not-default", c.entries.first { $0.slug == "budget-log" }, "All", "", TemplateLibraryView.size),
            ("4-long-note-picked", c.entries.first { $0.slug == "cornell-notes" }, "All", "", TemplateLibraryView.size),
            ("5-apps-filter", nil, "Apps", "", TemplateLibraryView.size),
            ("6-search-trip", nil, "All", "trip", TemplateLibraryView.size),
            ("7-search-nothing", c.entries.first { $0.slug == "meeting-notes" }, "All", "zebra", TemplateLibraryView.size),
            ("8-small-window", c.entries.first { $0.slug == "weekly-review" }, "All", "", TemplateLibraryView.size(on: CGSize(width: 800, height: 560))),
            ("8b-small-window-app", c.entries.first { $0.slug == "habit-tracker" }, "All", "", TemplateLibraryView.size(on: CGSize(width: 800, height: 560))),
            ("9-longest-prompt", c.entries.max { $0.ask.count < $1.ask.count }, "All", "", TemplateLibraryView.size),
            ("10-last-card-open", c.entries.last, "All", "", TemplateLibraryView.size),
            ("11-small-window-cornell", c.entries.first { $0.slug == "cornell-notes" }, "All", "", TemplateLibraryView.size(on: CGSize(width: 800, height: 560))),
            ("11b-small-window-longest-prompt", c.entries.max { $0.ask.count < $1.ask.count }, "All", "", TemplateLibraryView.size(on: CGSize(width: 800, height: 560))),
            ("12-longest-description", c.entries.max { $0.description.count < $1.description.count }, "All", "", TemplateLibraryView.size),
            ("13-longest-name", c.entries.max { $0.title.count < $1.title.count }, "All", "", TemplateLibraryView.size),
            ("14-one-line-ask", c.entries.min { $0.ask.count < $1.ask.count }, "All", "", TemplateLibraryView.size),
            ("15-claude-picked", c.entries.first { $0.slug == "meeting-notes" }, "All", "", TemplateLibraryView.size),
        ]
        for (name, open, filter, query, size) in states {
            // 15: the panel with Claude as the AI Make uses, as after picking it from the arrow.
            let ais: [SetupCards.AI] = name.hasPrefix("15") ? [.claude, .chatgpt] : [.chatgpt, .claude]
            let view = TemplateLibraryView(catalog: c, ais: ais, open: open, filter: filter, query: query, size: size)
                .environment(\.inSheet, true)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(SetupCards.ground)
                .tint(Color(PColor.paneAccent))
            try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"), size: size, dark: dark)
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
    /// Add the note, and Make adds the note and copies the ask without opening anything.
    @Test func withNoAIMakeAddsTheNoteAndCopiesTheAsk() async throws {
        #expect(TemplateMaking.ais([]) == [.other])
        #expect(TemplateLibraryWords.make(.other) == "Add the note")
        #expect(TemplateLibraryWords.make(.chatgpt) == "Make with ChatGPT" && TemplateLibraryWords.make(.claude) == "Make with Claude")
        let container = try store()
        let e = try #require(Self.all.first { $0.slug == "meeting-notes" })
        var copied: [String] = []
        var opened: [URL] = []
        let id = await TemplateMaking.make(e, with: .other, context: container.mainContext, account: nil, source: ShippedTemplates(site: Offline()),
                                           ledger: ledger(account: nil), copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(id != nil && opened.isEmpty)
        #expect(copied == ["In Pinto Notes, use my Meeting notes note. Ask me for my notes from the pricing sync, then add the summary and action items."])
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
#endif
