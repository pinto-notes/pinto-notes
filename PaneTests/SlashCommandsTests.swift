import Foundation
import Testing
@testable import Pane

/// The `/` menu's model: where a `/query` is being typed, and which commands it names.
@Suite struct SlashCommandsTests {
    /// The query at the end of `text` (the caret there), as written.
    func query(_ text: String) -> String? {
        SlashCommands.query(in: text, caret: (text as NSString).length).map { (text as NSString).substring(with: $0) }
    }

    @Test func aSlashAtALineStartOrAfterASpace() {
        #expect(query("/") == "/")
        #expect(query("Plan\n/che") == "/che")
        #expect(query("Call Sara /da") == "/da")
        #expect(query("- [ ] Milk /to") == "/to")
        #expect(query("\t/h1") == "/h1")
    }

    @Test func notInsideWordsURLsOrCode() {
        #expect(query("and/or") == nil, "inside a word")
        #expect(query("See https://") == nil, "a URL's slashes")
        #expect(query("See https://example.com/pa") == nil)
        #expect(query("Dates 2026/11") == nil)
        #expect(query("Run `ls /us") == nil, "inline code")
        #expect(query("Run `ls` /ta") == "/ta", "after inline code closes")
        #expect(query("```\n/che") == nil, "a code block")
        #expect(query("```\ncode\n```\n/che") == "/che", "after a code block")
        #expect(query("| a | /b") == nil, "a table row")
        #expect(query("/ ") == nil, "a space straight after the slash")
        #expect(query("Plan /\n") == nil, "the next line")
    }

    @Test func theCaretMustBeAtTheQuery() {
        let text = "Plan /che and more"
        #expect(SlashCommands.query(in: text, caret: 9).map { (text as NSString).substring(with: $0) } == "/che")
        #expect(SlashCommands.query(in: text, caret: 4) == nil)
        #expect(SlashCommands.active(in: text, selection: NSRange(location: 6, length: 2)) == nil, "a selection, not a caret")
        #expect(query("Plan /" + String(repeating: "a", count: 30)) == nil, "too long to be a command")
    }

    @Test func filteringByNameWordAndAlias() {
        let all = SlashCommand.allCases
        #expect(SlashCommands.matches("", in: all) == all)
        #expect(SlashCommands.matches("che", in: all) == [.checklist])
        #expect(SlashCommands.matches("CHE", in: all) == [.checklist], "case aside")
        #expect(SlashCommands.matches("h1", in: all) == [.title])
        #expect(SlashCommands.matches("h2", in: all) == [.heading])
        #expect(SlashCommands.matches("h3", in: all) == [.subheading])
        #expect(SlashCommands.matches("todo", in: all) == [.checklist])
        #expect(SlashCommands.matches("hr", in: all) == [.divider])
        #expect(SlashCommands.matches("line", in: all) == [.divider])
        #expect(SlashCommands.matches("today", in: all) == [.date])
        #expect(SlashCommands.matches("file", in: all) == [.attach])
        #expect(SlashCommands.matches("xyz", in: all).isEmpty)
        #expect(SlashCommands.matches("call", in: all) == [.callout])
        #expect(SlashCommands.matches("warning", in: all) == [.callout])
        #expect(SlashCommands.matches("high", in: all) == [.highlight])
        #expect(SlashCommands.matches("marker", in: all) == [.highlight])
    }

    @Test func rankingNamesBeforeWordsBeforeAliases() {
        let all = SlashCommand.allCases
        // "Link" starts with it; the lists have a word that does; "line" is Divider's alias.
        #expect(SlashCommands.matches("li", in: all) == [.link, .noteLink, .bulleted, .dashed, .numbered, .divider])
        #expect(SlashCommands.matches("h", in: all).prefix(3) == [.heading, .highlight, .title], "Heading and Highlight by name, then Title by h1")
        #expect(SlashCommands.matches("bulleted l", in: all) == [.bulleted], "a two-word name")
        #expect(SlashCommands.matches("che ", in: all) == [.checklist], "a trailing space keeps a match")
    }

    /// Letters in order find a command when nothing starts with them (Notion's menu needs the
    /// start of a word), and never crowd a real match.
    @Test func shorthandFindsACommand() {
        let all = SlashCommand.allCases
        #expect(SlashCommands.matches("chk", in: all) == [.checklist])
        #expect(SlashCommands.matches("cdblk", in: all) == [.codeBlock])
        #expect(SlashCommands.matches("nmbr", in: all) == [.numbered])
        #expect(SlashCommands.matches("line", in: all) == [.divider], "a real match only")
        #expect(SlashCommands.matches("k", in: all).isEmpty, "one letter isn't shorthand")
        #expect(SlashCommands.matches("note", in: all) == [.noteLink, .callout], "a word of Link to note, then Callout's alias")
        #expect(SlashCommands.matches("wiki", in: all) == [.noteLink])
    }

    /// What you used last comes first, three of them, newest first; typed or not.
    @Test func theOnesUsedLastComeFirst() {
        let all = SlashCommand.allCases
        #expect(SlashCommands.matches("", in: all, recent: [.table, .checklist]).prefix(3) == [.table, .checklist, .title])
        #expect(SlashCommands.matches("h", in: all, recent: [.highlight]).prefix(2) == [.highlight, .heading], "a tie goes to the recent one")
        #expect(SlashCommands.matches("h", in: all, recent: [.title]).first == .heading, "a better match still wins")
        let defaults = UserDefaults(suiteName: "SlashRecentsTests")!
        defaults.removePersistentDomain(forName: "SlashRecentsTests")
        let saved = SlashRecents.defaults
        SlashRecents.defaults = defaults
        defer { SlashRecents.defaults = saved }
        for c in [SlashCommand.title, .table, .checklist, .table, .divider] { SlashRecents.used(c) }
        #expect(SlashRecents.commands == [.divider, .table, .checklist], "newest first, no repeats, three")
    }

    @Test func aSpaceAfterAQueryThatNamesNothingCloses() {
        let text = "Pay half/half or /table is"
        #expect(SlashCommands.active(in: text, selection: NSRange(location: (text as NSString).length, length: 0)) == nil)
        let open = "Pay /tab"
        let found = SlashCommands.active(in: open, selection: NSRange(location: 8, length: 0))
        #expect(found?.query == NSRange(location: 4, length: 4))
        #expect(found?.commands == [.table])
    }

    @Test func everyCommandHasANameSymbolAndAWayToFindIt() {
        for c in SlashCommand.allCases {
            #expect(!c.name.isEmpty && !c.symbol.isEmpty)
            #expect(c.name.prefix(1) == c.name.prefix(1).uppercased() && c.name.dropFirst() == c.name.dropFirst().lowercased(), "sentence case: \(c.name)")
            #expect(SlashCommands.matches(String(c.name.prefix(3)), in: SlashCommand.allCases).contains(c))
        }
        #if os(macOS)
        #expect(SlashCommand.available.contains(.attach))
        #else
        #expect(!SlashCommand.available.contains(.attach))
        #endif
    }
}
