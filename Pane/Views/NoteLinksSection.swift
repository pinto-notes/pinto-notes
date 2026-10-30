import SwiftData
import SwiftUI

/// What the foot of a note shows about the notes around it, as Obsidian's backlinks do: the notes
/// that link here, each with the lines it links on, and the notes that mention this one's title
/// without a link, each with Link to make one. Worked out from the link index
/// (`ModelContext.linkingNotes`) and, for mentions, a search off the main thread.
@MainActor @Observable
final class NoteLinks {
    private(set) var noteID: UUID?
    private(set) var linked: [LinkingNote] = []
    private(set) var linkedTotal = 0
    private(set) var mentions: [LinkingNote] = []
    /// More notes mention it than were read.
    private(set) var mentionsMore = false
    /// The last Link, for Undo: shown at the top of the mentions for a few seconds.
    private(set) var lastLinked: Linked?
    /// How many linking notes get their lines (Show All raises it).
    var linkedLimit = NoteLinks.firstLinked
    var mentionsLimit = NoteLinks.firstMentions
    static let firstLinked = 20
    static let firstMentions = 10

    struct Linked: Equatable {
        var note: UUID
        var title: String
        var before: String
        var after: String
        var id = UUID()
    }

    /// The section's height as last laid out, for the text view that holds it.
    @ObservationIgnored var height: CGFloat = 0
    /// Told when the height changes (the text view places the section again).
    @ObservationIgnored var changed: () -> Void = {}
    /// Opens a note at a place in its text (set by the note screen).
    @ObservationIgnored var open: (UUID, Int) -> Void = { _, _ in }

    @ObservationIgnored private var names: [String] = []
    @ObservationIgnored private var search: Task<Void, Never>?
    @ObservationIgnored private weak var context: ModelContext?

    init(noteID: UUID? = nil) { self.noteID = noteID }

    var isEmpty: Bool { linked.isEmpty && mentions.isEmpty && lastLinked == nil }

    /// The notes that link here, from the link index (`found`: `backlinks(to:)`, newest first).
    func refresh(_ found: [Note], note: Note, context: ModelContext) {
        self.context = context
        noteID = note.id
        guard !note.isLocked, note.trashedAt == nil else { linked = []; linkedTotal = 0; return }
        let now = context.linkingNotes(found, to: note, limit: linkedLimit)
        if now.notes != linked { linked = now.notes }
        if now.total != linkedTotal { linkedTotal = now.total }
    }

    /// Looks for the notes that mention this one without a link, off the main thread, after
    /// `delay` (a title being typed is looked for once it rests). Only when what it's called
    /// could have changed, or `force`.
    func findMentions(_ note: Note, context: ModelContext, delay: Duration = .zero, force: Bool = true) {
        self.context = context
        noteID = note.id
        guard !note.isLocked, note.trashedAt == nil else { mentions = []; return }
        let names = Mentions.names(title: note.title, frontMatter: note.frontMatter)
        guard force || names != self.names else { return }
        self.names = names
        let id = note.id, container = context.container
        search?.cancel()
        search = Task { [weak self] in
            if delay > .zero { try? await Task.sleep(for: delay) }
            guard !Task.isCancelled else { return }
            let found = await Task.detached(priority: .utility) { Mentions.search(names, excluding: id, container: container) }.value
            guard !Task.isCancelled, let self else { return }
            if found.notes != self.mentions { self.mentions = found.notes }
            self.mentionsMore = found.more
        }
    }

    /// The mentions search under way, done (tests).
    func mentionsSettled() async { await search?.value }

    /// Link: the mentions on `line` of `other` become links to this note. Undo puts them back.
    @discardableResult
    func link(_ line: LinkLine, in other: LinkingNote) -> Linked? {
        guard let context, let noteID, let note = context.note(noteID), let model = context.note(other.id), let done = context.linkMentions(of: note, in: model, at: line.spots) else { return nil }
        let l = Linked(note: other.id, title: other.title, before: done.before, after: done.after)
        // Off the list at once; the note shows under "Linked from" as the save comes through.
        mentions = mentions.compactMap { m in
            guard m.id == other.id else { return m }
            var m = m
            let spots = Mentions.find(names, in: done.after)
            m.lines = LinkSnippets.lines(done.after, spots: spots)
            return m.lines.isEmpty ? nil : m
        }
        lastLinked = l
        let shown = l.id
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(6))
            if self?.lastLinked?.id == shown { self?.lastLinked = nil }
        }
        return l
    }

    func undo(_ l: Linked) {
        guard let context, let noteID, let note = context.note(noteID), let model = context.note(l.note) else { return }
        context.undoLinkMentions(in: model, before: l.before, after: l.after)
        if lastLinked?.id == l.id { lastLinked = nil }
        findMentions(note, context: context)
    }
}

/// The foot of a note: "Linked from" and "Unlinked mentions". It sits in the text view, under the
/// last line, and scrolls with the note (MarkdownEditor's `foot`). Each part folds away, and stays
/// as it was left; mentions start folded. Nothing shows when no note links here or mentions it.
struct NoteLinksSection: View {
    let model: NoteLinks
    @AppStorage("noteLinks.linkedShown") private var linkedShown = true
    @AppStorage("noteLinks.mentionsShown") private var mentionsShown = false
    @Environment(\.undoManager) private var undoManager

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            if !model.linked.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    header(model.linkedTotal == 1 ? "Linked from 1 note" : "Linked from \(model.linkedTotal) notes", shown: $linkedShown, id: "noteLinks.linked")
                    if linkedShown {
                        ForEach(model.linked) { n in card(n, mention: false) }
                        if model.linkedTotal > model.linked.count {
                            more("Show All \(model.linkedTotal)", id: "noteLinks.linkedAll") {
                                model.linkedLimit = .max
                                model.changed()
                            }
                        }
                    }
                }
            }
            if !model.mentions.isEmpty || model.lastLinked != nil {
                VStack(alignment: .leading, spacing: 8) {
                    header(mentionsTitle, shown: $mentionsShown, id: "noteLinks.mentions")
                    if let l = model.lastLinked { linkedNotice(l) }
                    if mentionsShown {
                        ForEach(model.mentions.prefix(model.mentionsLimit)) { n in card(n, mention: true) }
                        if model.mentions.count > model.mentionsLimit {
                            more("Show All \(model.mentions.count)\(model.mentionsMore ? "+" : "")", id: "noteLinks.mentionsAll") {
                                model.mentionsLimit = .max
                            }
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .fixedSize(horizontal: false, vertical: true)
        .onGeometryChange(for: CGFloat.self, of: \.size.height) { h in
            guard abs(h - model.height) > 0.5 else { return }
            model.height = h
            model.changed()
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("noteLinks")
    }

    private var mentionsTitle: String {
        let n = model.mentions.count
        return n == 0 ? "Unlinked mentions" : "Unlinked mentions \u{00B7} \(n)\(model.mentionsMore ? "+" : "")"
    }

    private func header(_ title: String, shown: Binding<Bool>, id: String) -> some View {
        Button {
            shown.wrappedValue.toggle()
        } label: {
            HStack(spacing: 5) {
                Text(title)
                    .font(.system(size: Self.small, weight: .semibold))
                    .foregroundStyle(.secondary)
                Image(systemName: "chevron.right")
                    .font(.system(size: Self.small - 3, weight: .bold))
                    .foregroundStyle(.tertiary)
                    .rotationEffect(.degrees(shown.wrappedValue ? 90 : 0))
            }
            .frame(minHeight: Self.target)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(.isHeader)
        .accessibilityValue(shown.wrappedValue ? "Expanded" : "Collapsed")
        .accessibilityIdentifier(id)
    }

    private func card(_ n: LinkingNote, mention: Bool) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Button { model.open(n.id, n.lines.first?.location ?? 0) } label: {
                Text(n.title)
                    .font(.system(size: EditorMetrics.body, weight: .semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Open \(n.title)")
            .accessibilityIdentifier("noteLinks.note.\(n.title)")
            ForEach(n.lines) { line in
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Button { model.open(n.id, line.location) } label: {
                        Text(Self.marked(line, link: !mention))
                            .font(.system(size: Self.small))
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 2)
                            .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(line.text)
                    .accessibilityHint("Opens \(n.title) here")
                    if mention {
                        Button("Link") {
                            guard let l = model.link(line, in: n) else { return }
                            undoManager?.registerUndo(withTarget: model) { m in m.undo(l) }
                            undoManager?.setActionName("Link")
                        }
                        .buttonStyle(LinkButtonStyle())
                        .accessibilityLabel("Link \(n.title)")
                        .accessibilityIdentifier("noteLinks.link.\(n.title)")
                    }
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.paneChip, in: .rect(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .contain)
    }

    private func linkedNotice(_ l: NoteLinks.Linked) -> some View {
        HStack(spacing: 10) {
            Text("Linked in \u{201C}\(l.title)\u{201D}")
                .font(.system(size: Self.small))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Spacer(minLength: 0)
            Button("Undo") { model.undo(l) }
                .buttonStyle(LinkButtonStyle())
                .accessibilityIdentifier("noteLinks.undo")
        }
        .padding(.horizontal, 14)
        .frame(minHeight: Self.target)
        .background(Color.paneChip, in: .rect(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("noteLinks.linked.notice")
    }

    private func more(_ title: String, id: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .font(.system(size: Self.small, weight: .medium))
            .foregroundStyle(Color(PColor.paneAccent))
            .buttonStyle(.plain)
            .frame(minHeight: Self.target)
            .accessibilityIdentifier(id)
    }

    /// The line with its mark: a link in the links' colour, a mention in the text's own, both heavier.
    static func marked(_ line: LinkLine, link: Bool) -> AttributedString {
        var s = AttributedString(line.text)
        let ns = line.text as NSString
        for m in line.marks where NSMaxRange(m) <= ns.length {
            guard let r = Range(m, in: line.text), let a = Range(r, in: s) else { continue }
            s[a].foregroundColor = link ? Color(PColor.paneAccent) : Color.primary
            s[a].font = .system(size: small, weight: .semibold)
        }
        return s
    }

    #if os(macOS)
    static let small: CGFloat = 13
    static let target: CGFloat = 24
    #else
    static let small: CGFloat = 15
    static let target: CGFloat = 44
    #endif
}

/// Link and Undo: small, solid, black on white or white on black, never amber.
private struct LinkButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: NoteLinksSection.small, weight: .semibold))
            .foregroundStyle(Color(Palette.inkButtonLabel))
            .padding(.horizontal, 12)
            #if os(macOS)
            .frame(minHeight: 22)
            #else
            .frame(minHeight: 30)
            #endif
            .background(Color(Palette.inkButton).opacity(configuration.isPressed ? 0.75 : 1), in: .capsule)
            #if os(iOS)
            // 44 pt to tap, as drawn smaller.
            .padding(.vertical, 7)
            #endif
            .contentShape(.rect)
    }
}
