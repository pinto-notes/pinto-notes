#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The templates library's front page (TemplateFrontPage, the editorial front page, 12 November
/// 2026): the question and the field, the shelves, Search's plain words (TemplateAsk) and the
/// note made when nothing matches. A card opens the template's page, the library's own.
@MainActor @Suite struct TemplateFrontTests {
    nonisolated static let all = TemplateCatalog.shipped.entries

    private func found(_ query: String) -> [String] { TemplateAsk.answers(query, in: Self.all).map(\.entry.slug) }
    private func entry(_ slug: String) throws -> TemplateCatalog.Entry { try #require(Self.all.first { $0.slug == slug }) }
    private func store() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }
    private var frontSource: String { get throws { try SettingsHomeTests.source("Pane/Views/TemplateFront.swift") } }

    // MARK: One library, one page

    /// The front page is the library's first page, and there is one library and one template
    /// page: no launch switch picks another gallery, page or density.
    @Test func oneLibraryAndOnePageWithNoSwitches() throws {
        let library = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(library.contains("    private var front: some View {\n        TemplateFrontPage(catalog: catalog,"))
        #expect(library.contains("front\n                .opacity(open == nil ? 1 : 0)"), "the front page is what shows with nothing open")
        // No launch switch anywhere in the app's sources (MakeAnApp's templatesPage is the site's page, a URL).
        let pane = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane")
        let files = try #require(FileManager.default.enumerator(at: pane, includingPropertiesForKeys: nil)).compactMap { $0 as? URL }.filter { $0.pathExtension == "swift" }
        #expect(files.count > 50)
        for file in files {
            let s = try String(contentsOf: file, encoding: .utf8)
            for flag in ["\"templatesLeap\"", "\"templatesPage\"", "\"templatesDensity\"", "-templatesLeap", "-templatesPage", "-templatesDensity", "TemplateEditorialView"] {
                #expect(!s.contains(flag), "\(file.lastPathComponent) has \(flag)")
            }
        }
    }

    /// A card on the front page, pressed the way VoiceOver presses it, opens the template's page,
    /// the library's own (Back, the example and Make with your AI), not a page of the front page's.
    @Test func aCardOpensTheLibrarysPage() async throws {
        let ax = OffscreenAX(TemplateLibraryView(catalog: .shipped, ais: [.chatgpt, .claude], open: nil).environment(\.inSheet, true), size: TemplateLibraryView.size)
        defer { ax.close() }
        _ = await ax.waiting(for: "templates.search")
        #expect(ax.find("templates.back") == nil, "no page at rest")
        let card = try #require(await ax.waiting(for: "templates.reading-list"), "the Start here shelf's Reading list")
        #expect(card.press())
        let back = await ax.waiting(for: "templates.back", tries: 30)
        #expect(back != nil, "the page opened")
        #expect(ax.find("templates.make") != nil && ax.find("templates.name")?.text.contains("Reading list") == true, "the library's page: its name and Make")
        // And a result row opens it the same way.
        let search = OffscreenAX(TemplateLibraryView(catalog: .shipped, ais: [.chatgpt], open: nil, query: "lisbon").environment(\.inSheet, true), size: TemplateLibraryView.size)
        defer { search.close() }
        let row = try #require(await search.waiting(for: "templates.trip-plan"), "Lisbon finds the trip plan")
        #expect(search.find("templates.results")?.text.contains("1 template for") == true)
        #expect(row.press())
        #expect(await search.waiting(for: "templates.back", tries: 30) != nil)
        #expect(search.find("templates.name")?.text.contains("Trip plan") == true)
    }

    // MARK: The front page

    /// The front page has every template, each on one shelf. The keys walk each once.
    @Test func theFrontPageHasEveryTemplate() {
        let c = TemplateCatalog.shipped, front = TemplateFront.shipped
        let order = front.order(for: c).map(\.slug)
        #expect(order.count == c.entries.count && Set(order) == Set(c.entries.map(\.slug)), "each once for the keys")
        #expect(order.first == front.shelves.first?.slugs.first, "from the first shelf's first")
        #expect(TemplateFrontPage.order("", catalog: c).map(\.slug) == order)
        let placed = front.shelves(for: c).flatMap(\.entries).map(\.slug)
        #expect(Set(placed) == Set(c.entries.map(\.slug)) && placed.count == c.entries.count, "each on one shelf")
        #expect(front.shelves.filter { $0.kind == .covers }.allSatisfy { $0.slugs.count == 3 }, "a row of three covers")
        // A template the site adds that no shelf names yet still shows.
        let fewer = TemplateFront(shelves: Array(front.shelves.dropFirst()))
        #expect(fewer.order(for: c).count == c.entries.count)
    }

    /// Four sizes of type for the whole front page, and nothing set at any other: the question,
    /// headings, an item's name, and every secondary line.
    @Test func oneTypeScaleOfFourSizes() throws {
        #expect(TemplateType.hero == 30 && TemplateType.heading == 20 && TemplateType.item == 15 && TemplateType.line == 13)
        #expect(TemplateType.hero >= TemplateType.heading * 1.5, "a heading is clearly smaller than the question")
        #expect(TemplateType.heading >= TemplateType.item * 1.3, "and clearly larger than an item's name")
        let src = try frontSource
        let size = try Regex(#"\.font\(\.system\(size: ([0-9.]+)"#)
        var literal: [String] = []
        for (i, line) in src.split(separator: "\n", omittingEmptySubsequences: false).enumerated() where line.contains(size) {
            // A symbol's size is the symbol's own (a chevron, the search glass); words take the scale.
            if line.contains("Image(systemName:") { continue }
            literal.append("line \(i + 1)")
        }
        #expect(literal.isEmpty, "type set at a size outside the scale: \(literal)")
        // The sentence is under its heading, never beside it.
        #expect(src.contains("Text(shelf.line).font(.system(size: TemplateType.line)).foregroundStyle(Color.muted)\n                .lineLimit(2)\n                .fixedSize(horizontal: false, vertical: true)\n                .padding(.top, Self.headingLine)"))
    }

    /// The front page leads with two rows, the question and the field close under it, centred;
    /// under them the first shelf starts above the fold, on the full sheet and the smallest.
    /// Drawn offscreen and read the way VoiceOver reads it.
    @Test func theFirstScreenIsTheQuestionAndTheStartOfOneShelf() async throws {
        #expect(TemplateFrontPage.question == "What do you want to track, plan or write?")
        #expect(TemplateFrontPage.searchPrompt == "Running, meeting notes, a trip to Lisbon", "the placeholder is an example")
        for size in [TemplateLibraryView.size, TemplateLibraryView.size(on: CGSize(width: 800, height: 560))] {
            let name = "\(Int(size.width)) wide"
            let ax = OffscreenAX(TemplateLibraryView(catalog: .shipped, ais: [.chatgpt, .claude], open: nil, size: size).environment(\.inSheet, true), size: size)
            defer { ax.close() }
            let field = try #require(await ax.waiting(for: "templates.search"), "\(name)")
            let question = try #require(ax.find("templates.question"), "\(name)")
            let sheet = ax.window.frame, top = (NSScreen.screens.first?.frame.maxY ?? 0) - sheet.maxY
            func y(_ r: CGRect) -> CGFloat { r.minY - top }
            func centre(_ r: CGRect) -> CGFloat { r.midX - sheet.minX }
            #expect(abs(centre(question.frame) - size.width / 2) <= 2 && abs(centre(field.frame) - size.width / 2) <= 30, "\(name): centred")
            #expect(field.frame.width >= min(TemplateFrontPage.column, size.width - 2 * TemplateLibraryView.margin(for: size)) - 80, "\(name): the field is wide, \(field.frame.width)")
            #expect(y(field.frame) - question.frame.maxY + top < 70, "\(name): the field close under the question")
            #expect(y(question.frame) >= TemplateLibraryView.topRow(for: size), "\(name): the question is under the bar")
            let heading = try #require(ax.find("templates.shelf.Start here"), "\(name): the first shelf")
            let air = y(heading.frame) - (y(field.frame) + field.frame.height)
            #expect(air >= 40 && air <= 90, "\(name): air between the field and the first shelf, \(air)")
            #expect(y(heading.frame) < size.height - 160, "\(name): the first shelf starts well above the fold, at \(y(heading.frame))")
        }
    }

    /// What scrolls up passes under the header, which then has the system's bar material with a
    /// 1 px hairline (as the notes list's toolbar edge); at rest neither shows, and the bar has
    /// only the close x. No fade at the top.
    @Test func theHeaderHasTheSystemsBandNotAFade() throws {
        let src = try frontSource
        #expect(src.contains(".safeAreaPadding(.top, height)\n            .scrollEdgeEffectHidden(true, for: .top)\n            .overlay(alignment: .top) {"), "the page passes under the bar, and the system draws no edge of its own")
        #expect(src.contains("Rectangle().fill(.bar).opacity(under ? 1 : 0)"), "the system's bar material, only with something under the bar")
        #expect(src.contains("Rectangle().fill(Color(nsColor: .separatorColor)).frame(height: 1 / scale).opacity(under ? 1 : 0)"), "and a 1 px hairline")
        #expect(src.contains(".modifier(HeaderBand(under: under, height: TemplateLibraryView.topRow(for: size)) { bar })"))
        #expect(src.contains("of: { Self.under($0, first: Self.pageTop) }) { [under] _, now in under.now = now }"))
        #expect(src.contains(".opacity(named ? 1 : 0)") && src.contains("let named = under.now"), "the sheet's name shows with the band")
        typealias F = TemplateFrontPage
        #expect(F.bandBelow == 12 && F.bandBelow < F.pageTop, "at rest nothing is under the band")
        #expect(!src.contains("LinearGradient("), "no fade under the bar")
    }

    /// Example content never out-shouts the library's own words: on an app's card its picture's
    /// largest figure is drawn smaller than an item's name, and the picture shows without the
    /// app's own tabs. No card has a button at rest.
    @Test func anAppsPictureIsQuieterThanItsName() throws {
        let size = TemplateLibraryView.size
        let width = size.width - TemplateLibraryView.margin(for: size) * 2
        let card = ((width - TemplateFrontPage.gap) / 2).rounded(.down)
        let picture = ((card - 10) * 0.51).rounded()
        #expect(TemplateArt.cardLargestType * picture / TemplateArt.cardDrawn.width < TemplateType.item)
        #expect(abs(TemplateArt.cardShape - 454.0 / 533.0) < 0.0001, "the top of the picture, without the tabs' 66 px")
        let css = try SettingsHomeTests.source("Pane/Resources/Templates/template-stage.css")
        #expect(css.contains(".text-\\[2rem\\], .text-\\[2\\.5rem\\], .text-\\[4rem\\] { font-size: 1.75rem !important; }"), "the largest figure a staged app draws")
        let src = try frontSource
        #expect(src.contains(".overlay(alignment: .trailing) { if over { pill().padding(.trailing, 8) } }"), "a row's button shows under the pointer or the keys")
        for card in ["private struct EditorialCoverCard: View", "private struct EditorialAppCard: View"] {
            let from = try #require(src.range(of: card))
            let rest = src[from.lowerBound...]
            let body = rest[..<(rest.range(of: "\n}\n")?.lowerBound ?? rest.endIndex)]
            #expect(!body.contains("TemplateButton("), "\(card) has no button")
        }
    }

    /// Every cover is drawn in bounds of its own: nothing beside it can squeeze it into a sliver.
    @Test(arguments: all) func everyCoverKeepsItsBounds(_ e: TemplateCatalog.Entry) {
        let squeezed = HStack(spacing: 0) {
            TemplateArt.tile(e, width: 44, height: 44, radius: 10)
            Text(String(repeating: "A long name that wants all the room there is ", count: 6)).lineLimit(1)
        }
        .frame(width: 120)
        #expect(NSHostingView(rootView: TemplateArt.tile(e, width: 44, height: 44, radius: 10)).fittingSize == CGSize(width: 44, height: 44))
        let row = NSHostingView(rootView: squeezed)
        row.frame = CGRect(x: 0, y: 0, width: 120, height: 44)
        row.layoutSubtreeIfNeeded()
        #expect(row.fittingSize.height == 44)
        #expect(NSHostingView(rootView: TemplateArt.tile(e, width: 312, height: 218, radius: 14)).fittingSize == CGSize(width: 312, height: 218))
        #expect(Bundle.main.url(forResource: "template-cover-\(e.slug)-large", withExtension: "jpg") != nil, "\(e.slug) has its large cover")
    }

    @Test(arguments: all.filter(\.app)) func everyAppHasItsCardPicture(_ e: TemplateCatalog.Entry) throws {
        for dark in [false, true] {
            let card = try #require(TemplateArt.card(e, dark: dark))
            let rep = try #require(card.representations.first)
            #expect(rep.pixelsWide == 1066 && rep.pixelsHigh == 1040, "drawn for the card, at 2x")
        }
        let script = try SettingsHomeTests.source("scripts/template-stage-pictures.ts")
        #expect(script.contains("const FRONT = [{ name: \"stage-card\", width: 533, height: 520 }];"))
        #expect(TemplateArt.cardDrawn == CGSize(width: 533, height: 520))
    }

    // MARK: Search understands plain words

    @Test func wordsFindTheTemplatesThatAnswerThem() {
        #expect(found("running") == ["workout-log", "habit-tracker"])
        #expect(found("my running") == ["workout-log", "habit-tracker"], "\u{201C}my\u{201D} says nothing about which")
        #expect(found("lisbon") == ["trip-plan"])
        #expect(found("holiday") == ["trip-plan"])
        #expect(found("a trip to Lisbon in May").first == "trip-plan")
        #expect(found("food") == ["meal-plan", "recipe-box", "grocery-list"])
        #expect(found("1:1").first == "one-on-one-notes")
        #expect(found("New York") == ["trip-plan"], "words that go together match whole")
        #expect(found("Meetings at work") == ["meeting-notes", "daily-standup", "one-on-one-notes"], "\u{201C}work\u{201D} is work, not the start of workout")
        #expect(found("Books I read") == ["reading-list", "book-notes", "habit-tracker"])
    }

    @Test func typingNarrows() {
        let r = found("r"), ru = found("ru"), run = found("run")
        #expect(!r.isEmpty && r.count >= ru.count && ru.count >= run.count)
        #expect(run.contains("workout-log") && run.contains("habit-tracker"))
        #expect(found("").isEmpty && found("my ").isEmpty, "nothing to match yet")
    }

    @Test(arguments: all) func everyTemplateHasItsWordsAndItsAsk(_ e: TemplateCatalog.Entry) throws {
        let fits = try #require(e.fits)
        #expect(!fits.isEmpty && fits.allSatisfy { !$0.words.isEmpty && $0.why.hasSuffix(".") && !$0.why.contains("\u{2014}") && !$0.why.contains("!") })
        #expect(fits.flatMap(\.words).allSatisfy { $0 == $0.lowercased() })
        let tailor = try #require(e.tailor)
        #expect(tailor.hasPrefix("Ask ") && tailor.hasSuffix("."), "the AI asks you first")
        #expect(found(e.title).first == e.slug, "its own name finds it")
    }

    /// What shows under Search: the front page until something is typed that can match; what was
    /// found (one match too, as a row that opens its page); and, once three letters match
    /// nothing, the new note.
    @Test func whatSearchShows() {
        func showing(_ q: String) -> TemplateFrontPage.Showing { TemplateFrontPage.showing(q, in: Self.all) }
        #expect(showing("") == .front && showing("  ") == .front && showing("my") == .front)
        #expect(showing("zq") == .front, "a letter or two that starts nothing is still being typed")
        #expect(showing("wine cellar") == .none && showing("zebra") == .none)
        guard case .results(let food) = showing("food"), case .results(let lisbon) = showing("lisbon") else { Issue.record("matches are results"); return }
        #expect(food.map(\.entry.slug) == ["meal-plan", "recipe-box", "grocery-list"])
        #expect(food.allSatisfy { !$0.why.isEmpty }, "each says why it answers the words")
        #expect(lisbon.map(\.entry.slug) == ["trip-plan"], "one match is a row like the rest")
        #expect(TemplateFrontPage.order("food", catalog: .shipped).map(\.slug) == food.map(\.entry.slug), "the keys walk what was found")
    }

    @Test func theAskCarriesThePersonsWords() throws {
        let log = try entry("workout-log")
        let plain = TemplateAsk.ask(log, words: "")
        #expect(plain.words == nil && plain.text == SetupCards.prompt(log.pick), "with no words, the template's own ask")
        let running = TemplateAsk.ask(log, words: TemplateAsk.carried("my running", for: log))
        #expect(running.text == "In Pinto Notes, use my Workout log note. Set it up for \u{201C}my running\u{201D}. Ask what I train and how often, then set the log up for that.")
        let gym = TemplateAsk.ask(log, words: " the gym,  three times a week. ")
        #expect(gym.words == "the gym, three times a week" && gym.text != running.text)
        // Words that only name the template add nothing.
        #expect(TemplateAsk.carried("workouts", for: log).isEmpty)
        #expect(TemplateAsk.carried("my habits", for: try entry("habit-tracker")).isEmpty)
        #expect(TemplateAsk.cleaned("say \u{201C}hi\u{201D}\nthere!") == "say hi there")
        // A row's Make sends the words through the library, which marks the row's state as the page's.
        let library = try SettingsHomeTests.source("Pane/Views/TemplateLibrary.swift")
        #expect(library.contains("guard let prompt, let makeAsking else { return press(e, with) }"))
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("makeAsking: { run($0, $1, $2) }") || root.contains("makeAsking: { e, ai, prompt in run(e, ai, prompt) }"))
    }

    @Test func makeSendsTheAskWithTheWords() async throws {
        // The container is kept: a context outlives nothing.
        let container = try store()
        let ctx = container.mainContext
        let e = try entry("workout-log")
        let prompt = TemplateAsk.ask(e, words: "my running").text
        var copied: [String] = [], opened: [URL] = []
        let ledger = NoteSourceLedger(defaults: try #require(UserDefaults(suiteName: "front.test.\(UUID().uuidString)")), account: UUID())
        let made = await TemplateMaking.make(e, with: .chatgpt, context: ctx, account: nil, prompt: prompt, ledger: ledger,
                                             copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(made != nil && copied == [prompt])
        #expect(URLComponents(url: try #require(opened.first), resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "q" }?.value == prompt)
        // With no words given, Make is the page's: the template's own ask.
        let other = try entry("reading-list")
        copied = []
        _ = await TemplateMaking.make(other, with: .chatgpt, context: ctx, account: nil, ledger: ledger, copy: { copied.append($0) }, open: { _ in })
        #expect(copied == [SetupCards.prompt(other.pick)])
    }

    // MARK: Nothing matches: a new note

    @Test func noMatchMakesANoteTheAIShapes() throws {
        let container = try store()
        let ctx = container.mainContext
        var copied: [String] = [], opened: [URL] = []
        let id = try #require(TemplateAsk.makeBlank("wine cellar", with: .chatgpt, context: ctx, into: .new("Notes"), copy: { copied.append($0) }, open: { opened.append($0) }))
        let note = try #require(ctx.note(id))
        #expect(note.title == "Wine cellar" && note.folder?.name == "Notes")
        #expect(copied == ["In Pinto Notes, use my new note \u{201C}Wine cellar\u{201D}. Ask what I want to keep in it, then set it up with the headings, lists or table that fit."])
        #expect(opened.first?.host == "chatgpt.com")
        // Just the empty note: only the note.
        let quiet = TemplateAsk.makeBlank("wine cellar", with: .other, context: ctx, into: .new("Notes"), copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(quiet != nil && copied.count == 1 && opened.count == 1)
        // While sync is away the ask is copied and no page opens.
        _ = TemplateAsk.makeBlank("wine cellar", with: .chatgpt, context: ctx, into: .new("Notes"), reach: .offline, copy: { copied.append($0) }, open: { opened.append($0) })
        #expect(copied.count == 2 && opened.count == 1)
        #expect(TemplateAsk.makeBlank("  ", with: .chatgpt, context: ctx, into: .new("Notes"), copy: { _ in }, open: { _ in }) == nil, "no name, no note")
        // The library is given it, so the no-match state offers it.
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("makeBlank: {") && root.contains("TemplateAsk.makeBlank("))
    }

    /// The no-match state is four short things: the name, what happens, the button and where it goes.
    @Test func theNoMatchWordsAreShort() {
        #expect(TemplateAsk.none("wine cellar.") == "No template for \u{201C}wine cellar\u{201D} yet.")
        #expect(TemplateAsk.blankTitle("wine cellar") == "Wine cellar")
        #expect(TemplateAsk.blankLine(.chatgpt) == "Start a note and ChatGPT shapes it with you.")
        #expect(TemplateAsk.blankButton(.chatgpt) == "Make the note" && TemplateAsk.blankButton(.other) == "Add the note" && TemplateAsk.blankButton(.chatgpt, online: false) == "Add the note")
        let c = TemplateAsk.blankCaption(.claude, folder: "Work")
        #expect(c.lead + c.folder + c.rest == "Adds an empty note to Work, then opens Claude.")
        for s in [TemplateAsk.blankLine(.chatgpt), TemplateAsk.blankLine(.other), TemplateAsk.blankRowLine(.chatgpt), TemplateAsk.blankRowLine(.other), TemplateAsk.blankAsk("wine cellar").text] {
            #expect(!s.contains("!") && !s.contains("\u{2014}"))
        }
    }

    // MARK: A row's button

    /// A row's button follows the state, as the page's does: Make with your AI, Add with no AI or
    /// while sync is away, Open for one you have. While it works it says what it does.
    @Test func aRowsButtonFollowsTheState() {
        typealias F = TemplateFrontPage
        #expect(F.primary(ai: .chatgpt, reach: .online, have: nil) == .make)
        #expect(F.primary(ai: .other, reach: .online, have: nil) == .add)
        #expect(F.primary(ai: .chatgpt, reach: .offline, have: nil) == .add, "while sync is away the AI isn't opened")
        #expect(F.primary(ai: .chatgpt, reach: .online, have: "Reading") == .open)
        for app in [false, true] {
            #expect(F.title(.make, app: app, ai: .chatgpt) == "Make with ChatGPT" && F.title(.make, app: app, ai: .claude, row: true) == "Make")
        }
        #expect(F.title(.add, app: false, ai: .other) == "Add the note" && F.title(.add, app: true, ai: .other) == "Add the app" && F.title(.add, app: true, ai: .other, row: true) == "Add")
        #expect(F.title(.open, app: false, ai: .chatgpt) == "Open your note" && F.title(.open, app: true, ai: .chatgpt, row: true) == "Open")
        #expect(F.working(.make) == "Adding\u{2026}" && F.working(.add) == "Adding\u{2026}" && F.working(.open) == "Opening\u{2026}")
    }

    /// Both buttons are the app's own: the compact primary and the compact secondary, at one
    /// height, with no style of the front page's own (AmberButtonTests checks the whole app).
    @Test func theFrontPageHasOnePrimaryAndOneQuietButton() throws {
        func size(_ v: some View) -> CGSize { NSHostingView(rootView: v).fittingSize }
        let primary = size(TemplateButton(title: "Make", look: .primary, least: TemplateFrontPage.pillLeast) {})
        let quiet = size(TemplateButton(title: "Make", look: .quiet, least: TemplateFrontPage.pillLeast) {})
        #expect(primary.height == ButtonSize.compact.height && quiet.height == ButtonSize.compact.height)
        #expect(primary.width == TemplateFrontPage.pillWidth && quiet.width == TemplateFrontPage.pillWidth)
        for word in ["Make", "Add", "Open"] {
            #expect(size(TemplateButton(title: word, look: .quiet, least: TemplateFrontPage.pillLeast) {}).width == TemplateFrontPage.pillWidth, "\(word) is as wide in a row")
        }
        #expect(size(TemplateButton(title: "Make", look: .primary, working: "Adding\u{2026}") {}).width > primary.width, "working says what it's doing")
        let src = try frontSource
        #expect(src.contains(".buttonStyle(.amberProminent(.compact))") && src.contains(".buttonStyle(.secondary(.compact))"))
        #expect(!src.contains("Capsule().fill") && !src.contains("ButtonStyle {"))
    }

    /// A long folder name keeps its start and its end, and its mark stays with it.
    @Test func aLongFolderNameKeepsItsEnd() throws {
        typealias F = TemplateFrontPage
        #expect(F.shownFolder("Everything for the house move in March") == "Everything for the house move in March", "whole: the line has two lines for it")
        #expect(F.shownFolder("Everything for the house move in March and the one after that in May") == "Everything for the \u{2026} after that in May", "whole words from its start and its end")
        #expect(F.shownFolder("Notes") == "Notes")
        #expect(try frontSource.contains("Text(\"\\u{202F}\\(Self.shownFolder(c.folder))\")"), "no break between the folder's mark and its name")
    }

    // MARK: The sheet's frame, drawn

    /// The library as its sheet shows it, in a window off the screen (an ImageRenderer draws no
    /// scroll view's content): the window, for its accessibility, and its pixels at a pixel a point.
    static func drawn(_ open: TemplateCatalog.Entry?, size: CGSize, dark: Bool = true, query: String = "",
                      ais: [SetupCards.AI] = [.chatgpt, .claude]) async throws -> (ax: OffscreenAX, pixels: Pixels) {
        let view = TemplateLibraryView(catalog: .shipped, ais: ais, open: open, query: query, size: size)
            .environment(\.inSheet, true).environment(\.networkReach, .online).environment(\.colorScheme, dark ? .dark : .light)
            .frame(width: size.width, height: size.height, alignment: .topLeading)
            .background(SetupCards.ground)
        let ax = OffscreenAX(view, size: size, dark: dark)
        await ax.settle()
        return (ax, try pixels(ax, size: size))
    }

    static func pixels(_ ax: OffscreenAX, size: CGSize) throws -> Pixels {
        let host = try #require(ax.window.contentView)
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        let cg = try #require(rep.cgImage)
        let small = try #require(CGContext(data: nil, width: Int(size.width), height: Int(size.height), bitsPerComponent: 8, bytesPerRow: 0,
                                           space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue))
        small.interpolationQuality = .none
        small.draw(cg, in: CGRect(origin: .zero, size: size))
        let one = try #require(small.makeImage())
        return try #require(Pixels(one))
    }

    /// One margin frames the front page, on the full sheet and the smallest: its outermost things
    /// are that far from the left and right edges, alike, and the close x that far from the top.
    @Test func oneMarginFramesTheFrontPage() async throws {
        typealias L = TemplateLibraryView
        func bounds(_ p: Pixels) -> (left: Int, right: Int, top: Int) {
            let ground = p.rgb(at: 2 * p.width + 2)
            func far(_ a: UInt32, _ b: UInt32) -> Int { (0..<3).map { abs(Int((a >> ($0 * 8)) & 255) - Int((b >> ($0 * 8)) & 255)) }.max() ?? 0 }
            var x0 = p.width, x1 = -1, y0 = p.height
            for y in 0..<p.height { for x in 0..<p.width where far(p.rgb(at: y * p.width + x), ground) > 8 { x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y) } }
            return (x0, p.width - 1 - x1, y0)
        }
        for size in [L.size, L.size(on: CGSize(width: 800, height: 560))] {
            let m = Int(L.margin(for: size))
            let name = "\(Int(size.width)) by \(Int(size.height))"
            let (ax, p) = try await Self.drawn(nil, size: size)
            defer { ax.close() }
            let b = bounds(p)
            #expect(b.left >= m - 1 && b.left <= m + 2, "\(name): \(b.left) pt at the left")
            #expect(b.right >= m - 1 && b.right <= m + 2 && abs(b.left - b.right) <= 2, "\(name): \(b.right) pt at the right")
            #expect(b.top >= m - 1 && b.top <= m + 2, "\(name): \(b.top) pt at the top")
        }
    }
}

/// Pictures of the front page, drawn offscreen as its sheet shows it, light and dark, into the
/// folder in AMBER_TEMPLATE_FRONT_SHOTS (TEST_RUNNER_AMBER_TEMPLATE_FRONT_SHOTS=<folder>
/// scripts/qa-test.sh PaneTests/TemplateFrontShots): at rest, scrolled, Search, no match, the
/// smallest sheet, and a card pressed into its template's page.
@MainActor @Suite(.serialized) struct TemplateFrontShots {
    static let dir = ProcessInfo.processInfo.environment["AMBER_TEMPLATE_FRONT_SHOTS"].map { URL(fileURLWithPath: $0) }

    /// The drawn window, at the backing's scale, as a PNG.
    private func write(_ ax: OffscreenAX, to url: URL) throws {
        let host = try #require(ax.window.contentView)
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: url)
    }

    /// The front page's scroll view: the tallest document in the window.
    private func scroller(_ view: NSView) -> NSScrollView? {
        var best: NSScrollView?
        func walk(_ v: NSView) {
            if let s = v as? NSScrollView, (s.documentView?.frame.height ?? 0) > (best?.documentView?.frame.height ?? 0) { best = s }
            v.subviews.forEach(walk)
        }
        walk(view)
        return best
    }

    @Test(arguments: [false, true]) func shots(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let kept = ThemeStore.shared.current
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        defer { ThemeStore.shared.set(kept, persist: false) }
        let look = dark ? "dark" : "light"
        let big = TemplateLibraryView.size, small = TemplateLibraryView.size(on: CGSize(width: 800, height: 560))
        func library(query: String = "", size: CGSize = big, ais: [SetupCards.AI] = [.chatgpt, .claude]) -> OffscreenAX {
            let view = TemplateLibraryView(catalog: .shipped, ais: ais, open: nil, makeAsking: { _, _, _ in }, makeBlank: { _, _ in }, connect: {}, query: query, size: size)
                .environment(\.inSheet, true).environment(\.networkReach, .online)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(SetupCards.ground)
                .tint(Color(PColor.paneAccent))
            return OffscreenAX(view, size: size, dark: dark)
        }
        func shoot(_ name: String, _ ax: OffscreenAX, scrolled y: CGFloat? = nil) async throws {
            defer { ax.close() }
            _ = await ax.waiting(for: "templates.search")
            await ax.settle(800)
            if let y, let s = scroller(try #require(ax.window.contentView)) {
                s.contentView.scroll(to: CGPoint(x: 0, y: y))
                s.reflectScrolledClipView(s.contentView)
                await ax.settle(800)
            }
            try write(ax, to: dir.appending(path: "\(name)-\(look).png"))
        }
        try await shoot("1-front-at-rest", library())
        try await shoot("2-front-scrolled", library(), scrolled: 560)
        try await shoot("2b-front-scrolled-further", library(), scrolled: 1120)
        try await shoot("3-search-food", library(query: "food"))
        try await shoot("3b-search-lisbon-one-match", library(query: "lisbon"))
        try await shoot("4-search-no-match", library(query: "wine cellar", ais: [.chatgpt]))
        try await shoot("5-smallest-front-at-rest", library(size: small))
        try await shoot("5b-smallest-front-scrolled", library(size: small), scrolled: 440)

        // A card pressed (the way VoiceOver presses it): the template's page, the library's own.
        let ax = library()
        defer { ax.close() }
        let card = try #require(await ax.waiting(for: "templates.reading-list"))
        #expect(card.press())
        #expect(await ax.waiting(for: "templates.back", tries: 30) != nil)
        await ax.settle(1600)
        try write(ax, to: dir.appending(path: "6-a-card-pressed-opens-its-page-\(look).png"))
    }
}
#endif
