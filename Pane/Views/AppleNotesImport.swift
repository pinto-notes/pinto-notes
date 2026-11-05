#if os(macOS)
import AppKit
import SwiftData
import SwiftUI

/// Reads Apple Notes through AppleScript. macOS asks once for permission.
enum AppleNotesBridge {
    enum Failure: LocalizedError {
        case script(String)
        /// Don't Allow was chosen when macOS asked.
        case denied
        var errorDescription: String? {
            switch self {
            case .script(let m): m
            case .denied: "Pinto Notes isn't allowed to read Apple Notes. Turn it on in System Settings → Privacy & Security → Automation."
            }
        }
    }

    /// Every Apple Event to Notes goes through `run`, and macOS asks for permission on the first.
    /// The rule (2026-10-12): it may only happen after a press on something that names Apple
    /// Notes. Tests count calls here, and can answer in Notes' place.
    nonisolated(unsafe) static var calls = 0
    nonisolated(unsafe) static var standIn: ((String) throws -> NSAppleEventDescriptor)?

    private static func run(_ source: String) throws -> NSAppleEventDescriptor {
        calls += 1
        if let standIn { return try standIn(source) }
        var error: NSDictionary?
        guard let script = NSAppleScript(source: source) else { throw Failure.script("Couldn't prepare the script.") }
        let result = script.executeAndReturnError(&error)
        if let error {
            let code = error[NSAppleScript.errorNumber] as? Int
            if code == -1743 { throw Failure.denied }
            throw Failure.script(error[NSAppleScript.errorMessage] as? String ?? "Apple Notes didn't answer.")
        }
        return result
    }

    /// Every note of every account and folder, outside Recently Deleted. One request per folder
    /// and property, so a library of thousands lists in seconds. A folder Apple Notes won't read
    /// is reported, not skipped.
    static func list() throws -> AppleNotesListing {
        listing(from: try run("""
        tell application "Notes"
            set out to {}
            set failed to {}
            set mainAccount to ""
            try
                set mainAccount to name of default account
            end try
            repeat with f in folders
                set fname to "A folder"
                try
                    set fname to name of f
                    set parents to {}
                    set c to container of f
                    repeat while class of c is folder
                        set beginning of parents to name of c
                        set c to container of c
                    end repeat
                    set aname to name of c
                    if fname is not "Recently Deleted" and parents does not contain "Recently Deleted" then
                        set end of out to {fname, id of notes of f, name of notes of f, modification date of notes of f, creation date of notes of f, password protected of notes of f, parents, aname}
                    end if
                on error errMsg
                    set end of failed to {fname, errMsg}
                end try
            end repeat
            return {mainAccount, out, failed}
        end tell
        """))
    }

    /// Reads what the script above returns: {main account, {folder, ids, names, edited, made,
    /// locked, parent folders, account} for each folder, {folder, error} for each that failed}.
    static func listing(from d: NSAppleEventDescriptor) -> AppleNotesListing {
        var listing = AppleNotesListing()
        listing.mainAccount = d.atIndex(1)?.stringValue ?? ""
        var notes: [AppleNote] = []
        if let folders = d.atIndex(2), folders.numberOfItems > 0 {
            for i in 1...folders.numberOfItems {
                guard let item = folders.atIndex(i), item.numberOfItems >= 6, let ids = item.atIndex(2), ids.numberOfItems > 0 else { continue }
                let folder = item.atIndex(1)?.stringValue ?? ""
                var parents: [String] = []
                if let p = item.atIndex(7), p.numberOfItems > 0 { parents = (1...p.numberOfItems).compactMap { p.atIndex($0)?.stringValue } }
                let account = item.atIndex(8)?.stringValue ?? ""
                for j in 1...ids.numberOfItems {
                    notes.append(AppleNote(
                        id: ids.atIndex(j)?.stringValue ?? "",
                        name: item.atIndex(3)?.atIndex(j)?.stringValue ?? "Untitled",
                        folder: folder,
                        modified: item.atIndex(4)?.atIndex(j)?.dateValue ?? .now,
                        created: item.atIndex(5)?.atIndex(j)?.dateValue,
                        locked: item.atIndex(6)?.atIndex(j)?.booleanValue ?? false,
                        parents: parents,
                        account: account,
                        folderOrder: i))
                }
            }
        }
        if let failed = d.atIndex(3), failed.numberOfItems > 0 {
            for i in 1...failed.numberOfItems {
                guard let item = failed.atIndex(i) else { continue }
                listing.unreadFolders.append(.init(folder: item.atIndex(1)?.stringValue ?? "A folder", why: item.atIndex(2)?.stringValue ?? ""))
            }
        }
        listing.notes = AppleNote.unique(notes)
        return listing
    }

    /// `-uitest -demo`: website and store captures show this library instead of the person's own.
    static var isDemo: Bool {
        let args = ProcessInfo.processInfo.arguments
        return forceDemo || (args.contains("-uitest") && args.contains("-demo"))
    }
    /// Offscreen captures in the test host, which has no launch arguments of its own.
    nonisolated(unsafe) static var forceDemo = false
    nonisolated(unsafe) static var forceLarge = false

    /// `-importLarge`: the 1,284-note library the website and App Store show, all picked.
    static var largeDemo: Bool { isDemo && (forceLarge || ProcessInfo.processInfo.arguments.contains("-importLarge")) }

    static var demoNotes: [AppleNote] {
        let day: TimeInterval = 86_400
        if largeDemo {
            // The library the website and App Store show: 1,284 notes in five folders.
            let counts: [(String, Int)] = [("Notes", 612), ("Recipes", 188), ("Work", 241), ("Travel", 97), ("Home", 146)]
            let names: [String: [String]] = [
                "Notes": ["Books to read", "Gift ideas", "Wi-Fi at the cabin", "Call back", "Weekend plans", "Quotes"],
                "Recipes": ["Pasta night for eight", "Grandma's cardamom buns", "Weeknight curry", "Sunday soup", "Pancakes"],
                "Work": ["Standup", "1:1 with Sara", "Q4 planning", "Retro", "Hiring loop"],
                "Travel": ["Porto in October", "Packing list", "Copenhagen tips from Jonas", "Kyoto", "Road trip"],
                "Home": ["Kitchen measurements", "Paint colours", "Plants and when to water them", "Repairs", "Bills"],
            ]
            var out: [AppleNote] = []
            for (folder, n) in counts {
                let list = names[folder] ?? ["Note"]
                for i in 0..<n {
                    let name = i < list.count ? list[i] : "\(list[i % list.count]) \(i / list.count + 1)"
                    out.append(AppleNote(id: "demo-\(folder)-\(i)", name: name, folder: folder, modified: Date.now.addingTimeInterval(-(1 + Double(i) * 0.45) * day)))
                }
            }
            return out
        }
        let rows: [(String, String, Double)] = [
            ("Pasta night for eight", "Recipes", 0.1), ("Grandma's cardamom buns", "Recipes", 2), ("Weeknight curry", "Recipes", 5),
            ("Porto in October", "Travel", 0.3), ("Packing list", "Travel", 9), ("Copenhagen tips from Jonas", "Travel", 21),
            ("Kitchen measurements", "Home", 1), ("Paint colours", "Home", 12), ("Plants and when to water them", "Home", 30),
            ("Books to read", "Notes", 3), ("Gift ideas", "Notes", 6), ("Wi-Fi at the cabin", "Notes", 40),
            ("Old apartment", "Archive", 200),
        ]
        return rows.enumerated().map { i, r in AppleNote(id: "demo-\(i)", name: r.0, folder: r.1, modified: Date.now.addingTimeInterval(-r.2 * day)) }
    }

    /// Two locked notes for captures of what stays in Apple Notes.
    static var demoLockedNotes: [AppleNote] {
        [("Journal", "Notes", 4.0), ("Surprise party for Leo", "Home", 8.0)].enumerated().map { i, r in
            var n = AppleNote(id: "demo-locked-\(i)", name: r.0, folder: r.1, modified: Date.now.addingTimeInterval(-r.2 * 86_400))
            n.locked = true
            return n
        }
    }

    static func body(of id: String) throws -> String {
        let escaped = id.replacingOccurrences(of: "\"", with: "\\\"")
        return try run("tell application \"Notes\" to get body of note id \"\(escaped)\"").stringValue ?? ""
    }

    /// The note's text as Notes shows it, with every line break its HTML may leave out.
    static func plainText(of id: String) throws -> String {
        let escaped = id.replacingOccurrences(of: "\"", with: "\\\"")
        return try run("tell application \"Notes\" to get plaintext of note id \"\(escaped)\"").stringValue ?? ""
    }
}

/// Pick Apple Notes to copy in. Nothing in Apple Notes is changed.
/// The Apple Notes import's steps in the import funnel (`import_step`, docs/Technical/app-telemetry.md),
/// kept apart from the sheet so tests can drive them.
enum AppleNotesFunnel {
    static func opened() { Funnel.record(.importStep(.appleNotes, .opened)) }

    /// Apple Notes was read, or wasn't: no permission, nothing in it, more than one account in it,
    /// or another failure.
    static func read(_ result: Result<AppleNotesListing, Error>) {
        switch result {
        case .failure(AppleNotesBridge.Failure.denied):
            Funnel.record(.importStep(.appleNotes, .permissionDenied))
        case .failure(let error):
            Funnel.record(.importStep(.appleNotes, .failed, kind: FailureSummary(error).kind))
        case .success(let listing):
            if listing.notes.isEmpty { Funnel.record(.importStep(.appleNotes, .nothingFound)) }
            if listing.accounts.count > 1 { Funnel.record(.importStep(.appleNotes, .secondAccount)) }
        }
    }

    static func importing() { Funnel.record(.importStep(.appleNotes, .importing)) }

    /// The import ended: `failed` when nothing came in and notes couldn't be read, else `done`
    /// with how many came in as a range.
    static func finished(_ summary: AppleNotesImportSummary) {
        if summary.noteIDs.isEmpty, !summary.notImported.isEmpty {
            Funnel.record(.importStep(.appleNotes, .failed, kind: .file))
        } else {
            Funnel.record(.importStep(.appleNotes, .done, count: CountBucket(summary.noteIDs.count)))
        }
    }

    static func cancelled() { Funnel.record(.importStep(.appleNotes, .cancelled)) }
}

///
/// One step: every note that isn't here yet is picked when the sheet opens, and the amber button
/// brings them in. When it's done the sheet closes by itself and the window says what came over;
/// it stays open only to name notes that couldn't be read.
struct AppleNotesImportView: View {
    /// The sheet's height (captures can ask for a shorter one).
    nonisolated(unsafe) static var height: CGFloat = 640
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    /// Called once the import is done, with what it did (for the line the window shows).
    var onSummary: (AppleNotesImportSummary) -> Void = { _ in }
    /// Called with the new notes' ids once the import is done.
    var onImported: ([UUID]) -> Void = { _ in }
    @Environment(\.importDoneTitle) private var importDoneTitle

    @Environment(\.locale) private var locale
    @State private var listing = AppleNotesListing()
    private var notes: [AppleNote] { listing.notes }
    @State private var picked: Set<String> = []
    @State private var query = ""
    @State private var loading = true
    @State private var failure: String?
    /// The import's own pages for when it can't just work: Don't Allow was chosen, or Apple Notes
    /// has no notes on this Mac yet.
    @State private var notice: Notice?
    enum Notice { case denied, empty }
    @State private var progress: (done: Int, total: Int)?
    /// The notes already here, by title and date.
    @State private var existing: Set<String> = []
    /// Notes' own database can be read (Full Disk Access is on): checklists and pins come over too.
    @State private var storeAccess = true
    @State private var explainingChecklists = false
    /// Captures: the sheet as it is on a Mac where Notes' database can't be read.
    nonisolated(unsafe) static var demoWithoutAccess = false
    /// Captures: the made-up library with two locked notes in it.
    nonisolated(unsafe) static var demoLocked = false
    /// Set when some notes couldn't be read: the sheet stays to say which.
    @State private var unread: AppleNotesImportSummary?
    @FocusState private var searchFocused: Bool
    /// The notes one by one. The sheet opens on folders and their counts: picking is the
    /// exception, so it's one quiet press away instead of the first thing seen.
    @State private var choosingNotes = false
    /// Choose notes: the folders opened to show their notes. All start closed.
    @State private var expanded: Set<[String]> = []
    /// The picks from before Choose notes, which starts with none: Back puts them back.
    @State private var pickedBefore: Set<String>?
    /// An import ran (the import funnel's `cancelled` is for a sheet closed before one did).
    @State private var imported = false
    /// The import came through whole: the success page, as the other guides end.
    @State private var finished: AppleNotesImportSummary?
    /// Captures: the sheet at a given page without importing (`guided`).
    nonisolated(unsafe) static var demoPage: DemoPage?
    enum DemoPage { case importing, finished, choosing, reading }

    private var shown: [AppleNote] {
        query.isEmpty ? notes : notes.filter { n in n.name.localizedStandardContains(query) || listing.destination(of: n).contains { $0.localizedStandardContains(query) } }
    }

    /// Shown notes by account and folder, in Apple Notes' own order.
    private var groups: [(String, [AppleNote])] { listing.groups(shown).map { ($0.heading, $0.notes) } }

    /// Folders alone need little room: the sheet fits them, up to its full height for picking notes.
    private var sheetHeight: CGFloat {
        Self.sheetHeight(loading: loading, choosingNotes: choosingNotes, result: unread != nil,
                         folders: groups.count + listing.unreadFolders.count, full: Self.height)
    }

    /// The sheet opens at the height most libraries end at, so the folder list arrives without the
    /// sheet jumping (2026-10-12: it opened 640 tall, then snapped to fit). A long folder list grows
    /// it a little, smoothly, and then scrolls; picking notes one by one takes the full height.
    static func sheetHeight(loading: Bool, choosingNotes: Bool, result: Bool, folders: Int, full: CGFloat) -> CGFloat {
        let opening: CGFloat = 380, most: CGFloat = 460
        if choosingNotes { return full }
        if loading { return opening }
        if result { return most }
        return min(most, max(opening, 170 + CGFloat(folders) * 30))
    }

    /// Shown notes that can be picked: a locked note's text can't be read.
    private var pickable: [AppleNote] { shown.filter { !$0.locked } }

    var body: some View {
        if let notice {
            noticePage(notice)
        } else {
            sheet
        }
    }

    private func noticePage(_ notice: Notice) -> some View {
        (notice == .denied ? ImportNoticePage.notesDenied : ImportNoticePage.notesEmpty)
            .with { action in
                switch action {
                case .primary:
                    if notice == .denied, let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation") {
                        NSWorkspace.shared.open(url)
                    } else if let notes = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.Notes") {
                        NSWorkspace.shared.openApplication(at: notes, configuration: NSWorkspace.OpenConfiguration())
                    }
                case .quiet: Task { await load() }
                case .close, .back: dismiss()
                }
            }
            .presentationBackground(Color(Palette.sheetGround))
            // Back from System Settings or Apple Notes: look again, so the notes show up by themselves.
            .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
                Task { await load() }
            }
    }

    /// The one-press path looks like the other import guides (Emil, 2 November 2026: "it doesnt
    /// look as polished"): the × at the top, Apple Notes' icon and a large title, what will come
    /// in a card, one wide button. Picking notes one by one, and what couldn't be read, keep the
    /// list with its bar at the foot.
    private var guided: Bool { unread == nil }

    private var sheet: some View {
        VStack(spacing: 0) {
            if guided {
                // Choose notes has its Back and × in its title row.
                if pageKey != 3 { topBar }
                guidePage
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                topBar
                header
                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                Rectangle().fill(Color.line).frame(height: 1)
                footer
            }
        }
        .frame(width: guided && pageKey == 3 ? Self.pickerSize.width : 540,
               height: guided && pageKey == 3 ? Self.pickerSize.height : guided ? Self.guideHeight : sheetHeight)
        .animation(.easeInOut(duration: 0.25), value: choosingNotes)
        .onChange(of: choosingNotes) { _, on in if !on { query = "" } }
        // Any change of height is one short, even move: never a jump.
        .animation(.easeInOut(duration: 0.22), value: sheetHeight)
        .foregroundStyle(Color.ink)
        // The app's own warm ground, not the system's grey sheet.
        .background(Color(Palette.sheetGround))
        .presentationBackground(Color(Palette.sheetGround))
        .task {
            AppleNotesFunnel.opened()
            await load()
        }
        .onDisappear { if !imported { AppleNotesFunnel.cancelled() } }
        // Coming back from System Settings: look again.
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
            if !AppleNotesBridge.isDemo, ApplePins.isAvailable { storeAccess = ApplePins.hasAccess() }
        }
        // Captures: the import half done, without reading anything.
        .onReceive(NotificationCenter.default.publisher(for: Capture.importHalfway)) { _ in
            guard AppleNotesBridge.isDemo else { return }
            progress = (picked.count / 2, picked.count)
        }
    }

    /// The guides' size, so every import sheet is the same.
    static let guideHeight: CGFloat = 560

    private var topBar: some View {
        HStack {
            if choosingNotes, progress == nil {
                Button { leaveChoosing() } label: { Label("Back", systemImage: "chevron.left") }
                    .buttonStyle(.quiet)
                    .padding(.leading, -QuietButtonStyle.inset)
                    .accessibilityIdentifier("import.back")
            }
            Spacer()
            CardCloseButton { dismiss() }
                .disabled(progress != nil)
                .accessibilityIdentifier("import.close")
        }
        .frame(height: 30)
        .padding(.horizontal, 18)
        .padding(.top, 16)
    }

    /// Which page of the guide look shows.
    private var pageKey: Int { finished != nil || Self.demoPage == .finished ? 2 : progress != nil || Self.demoPage == .importing ? 1 : choosingNotes || Self.demoPage == .choosing ? 3 : loading || Self.demoPage == .reading ? 4 : 0 }

    private var guidePage: some View {
        ZStack {
            Group {
                switch pageKey {
                case 2: successPage
                case 1: importingPage
                case 3: chooseNotesPage
                case 4: readingPage
                default: choosePage
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .id(pageKey)
            .transition(BlurMotion.page)
        }
        .animation(BlurMotion.enter, value: pageKey)
        .padding(.horizontal, pageKey == 3 ? 24 : 40)
        .padding(.bottom, 26)
    }

    /// "Bring your Apple Notes": what will come, folder by folder, and the one button.
    private var choosePage: some View {
        VStack(spacing: 0) {
            ImportSourceIcon(origin: .appleNotes, size: 64)
                .padding(.bottom, 16)
            Text("Bring your Apple Notes")
                .font(.display(26))
                .tracking(Palette.tracking(26))
                .multilineTextAlignment(.center)
            Text(Self.subtitle(notes: loading || failure != nil ? nil : notes.count, folders: groups.count, locale: locale))
                .font(.system(size: 14))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .padding(.top, 8)
                .accessibilityIdentifier("import.subtitle")
            folderCard
                .padding(.top, 20)
            if let stays = staysLine {
                Text(stays)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: 420)
                    .padding(.top, 10)
                    .accessibilityIdentifier("import.stays")
            }
            Spacer(minLength: 12)
            Button { Task { await runImport() } } label: {
                Text(Self.importTitle(picked: picked.count, new: newCount, all: Self.readable(notes), locale: locale)).frame(maxWidth: .infinity)
            }
            .buttonStyle(.amberProminent(.regular, wide: true))
            .keyboardShortcut(.defaultAction)
            .frame(maxWidth: 320)
            .disabled(loading || failure != nil || picked.isEmpty)
            .accessibilityIdentifier("import.start")
            Button("Choose Notes\u{2026}") { startChoosing() }
                .buttonStyle(.hoverLink)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.muted)
                .frame(height: 34)
                .padding(.top, 6)
                .disabled(loading || failure != nil || notes.isEmpty)
                .accessibilityIdentifier("import.chooseNotes")
        }
    }

    /// The folders in a card, as the other guides show the folder they found.
    private var folderCard: some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        // The card only once there are folders to put in it: reading, or a problem, is said on the
        // sheet itself in the same room, so nothing moves when the folders arrive (Emil, 2 November
        // 2026: an empty box with a spinner in it "looks shit").
        let carded = !loading && failure == nil
        return Group {
            if loading {
                Color.clear
            } else if let failure {
                VStack(spacing: 10) {
                    Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 24)).foregroundStyle(Color(Palette.amber))
                    Text("Can't read Apple Notes").font(.system(size: 14, weight: .semibold))
                    Text(failure).font(.system(size: 12)).foregroundStyle(Color.muted).multilineTextAlignment(.center).frame(maxWidth: 340)
                    Button("Try Again") { Task { await load() } }.buttonStyle(.secondary(.compact))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(listing.unreadFolders.enumerated()), id: \.offset) { _, folder in
                            Label("Apple Notes wouldn't list the folder \u{201C}\(folder.folder)\u{201D}. Its notes aren't shown.", systemImage: "exclamationmark.triangle.fill")
                                .symbolRenderingMode(.multicolor)
                                .font(.footnote)
                                .padding(.horizontal, 18)
                                .padding(.vertical, 6)
                        }
                        // As a tree, as Apple Notes' own sidebar shows it: a folder inside another
                        // sits under it, indented, by its own name (Emil, 2 November 2026: "Recipes ›
                        // Italian" rows looked bad).
                        let rows = Self.folderTree(groups.map { (folder, items) in
                            (path: items.first.map(listing.destination(of:)) ?? [folder],
                             coming: items.filter { picked.contains($0.id) }.count, total: items.count)
                        })
                        ForEach(Array(rows.enumerated()), id: \.offset) { i, row in
                            let indent = CGFloat(row.depth) * Self.treeIndent
                            if i > 0 { Rectangle().fill(Color.line).frame(height: 1).padding(.leading, 50 + indent) }
                            HStack(spacing: 12) {
                                Image(systemName: "folder").font(.system(size: 15)).foregroundStyle(Color.muted).frame(width: 20)
                                Text(row.name).font(.system(size: 13, weight: .medium)).lineLimit(1)
                                Spacer(minLength: 8)
                                if let total = row.total {
                                    Text(Self.folderLine(coming: row.coming, of: total, locale: locale))
                                        .font(.system(size: 12)).foregroundStyle(Color.muted).monospacedDigit()
                                }
                            }
                            .padding(.leading, 18 + indent)
                            .padding(.trailing, 18)
                            .frame(height: 40)
                            .accessibilityElement(children: .combine)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .scrollIndicators(.automatic)
                .scrollBounceBehavior(.basedOnSize)
            }
        }
        .frame(maxWidth: .infinity)
        // The line under it, when there is one, takes half a row from the card, which scrolls:
        // the last folder shows half, so the list says there's more (a whole row hid the fifth).
        .frame(height: Self.folderCardHeight - (staysLine == nil ? 0 : 20))
        .background(carded ? Color(Palette.page) : .clear, in: shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: carded ? 1 : 0))
        .clipShape(shape)
        .animation(.easeOut(duration: 0.2), value: carded)
    }

    /// How far a folder inside another sits in, per level.
    static let treeIndent: CGFloat = 22

    struct TreeRow: Equatable {
        var path: [String] = []
        var name: String
        var depth: Int
        var coming: Int
        /// Nil for a folder that holds only folders: it has no count of its own.
        var total: Int?
    }

    /// The folders as a tree, in the order given (Apple Notes' own): each folder by its own name,
    /// one level in per folder above it, and a folder that holds only folders put in above them.
    static func folderTree(_ folders: [(path: [String], coming: Int, total: Int)]) -> [TreeRow] {
        var rows: [TreeRow] = []
        var shown = Set<[String]>()
        for f in folders where !f.path.isEmpty {
            for depth in 0..<(f.path.count - 1) {
                let above = Array(f.path[...depth])
                if shown.insert(above).inserted { rows.append(TreeRow(path: above, name: above.last!, depth: depth, coming: 0, total: nil)) }
            }
            if shown.insert(f.path).inserted {
                rows.append(TreeRow(path: f.path, name: f.path.last!, depth: f.path.count - 1, coming: f.coming, total: f.total))
            } else if let i = rows.firstIndex(where: { $0.path == f.path && $0.total == nil }) {
                rows[i].coming = f.coming; rows[i].total = f.total
            }
        }
        return rows
    }

    /// Choose notes is a wider sheet with one tree, as a sync app's "choose folders" or Mail's
    /// Import Mailboxes: each folder with ▸ to open it in place and a checkbox to bring it, its notes
    /// under it with checkboxes of their own, in the system's list. Nothing is picked on arrival.
    /// (Emil, 2 November 2026: two panes, a highlight to look and a tick to pick, were unclear.)
    static let pickerSize = CGSize(width: 820, height: 620)

    private func startChoosing() {
        pickedBefore = picked
        picked = []
        expanded = []
        choosingNotes = true
    }

    private func leaveChoosing() {
        if let pickedBefore { picked = pickedBefore }
        pickedBefore = nil
        query = ""
        choosingNotes = false
    }

    private var chooseNotesPage: some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        return VStack(spacing: 0) {
            HStack(alignment: .center, spacing: 14) {
                // Back beside the title, as System Settings has it, the × at the other end
                // (Emil, 2 November 2026: Back above the title sat oddly).
                CardBackButton { leaveChoosing() }
                    .disabled(progress != nil)
                    .accessibilityIdentifier("import.back")
                VStack(alignment: .leading, spacing: 3) {
                    Text("Choose notes").font(.system(size: 21, weight: .bold)).tracking(-0.3)
                    Text(Self.count(picked.count, of: notes.count, locale: locale))
                        .font(.system(size: 13)).foregroundStyle(Color.muted).monospacedDigit()
                        .accessibilityIdentifier("import.count")
                }
                Spacer(minLength: 0)
                SoftSearchField(text: $query, identifier: "import.search")
                    .frame(width: 280)
                CardCloseButton(size: 28) { dismiss() }
                    .disabled(progress != nil)
                    .accessibilityIdentifier("import.close")
            }
            .padding(.top, 18)
            Group {
                if chooseTree.isEmpty {
                    Text("No notes match \u{201C}\(query)\u{201D}.")
                        .font(.system(size: 13)).foregroundStyle(Color.muted)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        // Room above the first folder (Emil, 2 November 2026). A clear row, because
                        // .contentMargins doesn't reach a List's table view on macOS.
                        Self.treeEdge
                        ForEach(chooseTree, id: \.path) { node in
                            if isOpen(node.path.dropLast()) {
                                folderTreeRow(node).modifier(TreeRowLook())
                                if isOpen(node.path) {
                                    ForEach(notesIn(node.path)) { note in
                                        noteTreeRow(note, depth: node.depth + 1).modifier(TreeRowLook())
                                    }
                                }
                            }
                        }
                        Self.treeEdge
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(Palette.page), in: shape)
            .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
            .clipShape(shape)
            .padding(.top, 14)
            HStack(spacing: 14) {
                if !storeAccess { checklistNote }
                Spacer(minLength: 0)
                Button(Self.importTitle(picked: picked.count, new: newCount, all: Self.readable(notes), locale: locale)) {
                    Task { await runImport() }
                }
                .buttonStyle(.amberProminent(.regular))
                .keyboardShortcut(.defaultAction)
                .disabled(picked.isEmpty)
                .accessibilityIdentifier("import.start")
            }
            .padding(.top, 14)
        }
    }

    /// Open: the top level always; a folder once opened, and every folder while searching.
    private func isOpen<P: Collection<String>>(_ path: P) -> Bool {
        path.isEmpty || !query.isEmpty || expanded.contains(Array(path))
            // Captures: the first folder open, to show its notes.
            || (Self.demoPage == .choosing && Array(path) == chooseTree.first?.path)
    }

    /// The checkbox for all, some or none: the Mac's own square marks.
    static func checkbox(_ state: FolderPick) -> String {
        switch state {
        case .all: "checkmark.square.fill"
        case .some: "minus.square.fill"
        case .none: "square"
        }
    }

    /// The room inside the tree's card above its first row and below its last.
    static let treeInset: CGFloat = 12
    /// The hover pill on a folder or note row: clearly rounded (Emil, 2 November 2026).
    static let treeHoverRadius: CGFloat = 10
    /// The clear row above the first folder and below the last.
    static var treeEdge: some View {
        Color.clear.frame(height: treeInset).accessibilityHidden(true)
            .listRowInsets(EdgeInsets()).listRowSeparator(.hidden).listRowBackground(Color.clear)
    }

    /// How far in each level of the tree sits.
    static let treeStep: CGFloat = 20

    private func checkboxImage(_ state: FolderPick) -> some View {
        Image(systemName: Self.checkbox(state))
            .font(.system(size: 15))
            .foregroundStyle(state == .none ? AnyShapeStyle(Color.muted) : AnyShapeStyle(.tint))
            .frame(width: 18, height: 18)
            .contentTransition(.symbolEffect(.replace))
    }

    /// A folder: ▸ opens it in place, the checkbox brings all of it, the rest of the row opens it.
    private func folderTreeRow(_ node: TreeRow) -> some View {
        let under = notesUnder(node.path).filter { !$0.locked }
        let count = under.filter { picked.contains($0.id) }.count
        let state = Self.folderPick(picked: count, pickable: under.count)
        let open = isOpen(node.path)
        let toggleOpen = {
            withAnimation(.easeOut(duration: 0.18)) {
                if expanded.contains(node.path) { expanded.remove(node.path) } else { expanded.insert(node.path) }
            }
        }
        // One hover for the whole row, as a note row has: a click anywhere opens the folder, the
        // checkbox alone picks it (Emil, 2 November 2026: the arrow, the box and the name each lit
        // up on their own, which felt weird).
        return HStack(spacing: 8) {
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.muted)
                .rotationEffect(.degrees(open ? 90 : 0))
                .frame(width: 16, height: 16)
            Button {
                let ids = under.map(\.id)
                if state == .all { picked.subtract(ids) } else { picked.formUnion(ids) }
            } label: { checkboxImage(state).contentShape(.rect) }
            .buttonStyle(.plain)
            .disabled(under.isEmpty)
            .accessibilityLabel(node.name)
            .accessibilityValue(state == .all ? "Included" : state == .some ? "Partly included" : "Not included")
            Image(systemName: "folder").font(.system(size: 13)).foregroundStyle(Color.muted)
            Text(node.name).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.ink).lineLimit(1)
            Spacer(minLength: 8)
            Text(Self.treeCount(picked: count, of: notesUnder(node.path).count, locale: locale))
                .font(.system(size: 12)).foregroundStyle(Color.muted).monospacedDigit()
        }
        .padding(.horizontal, 6)
        .frame(maxWidth: .infinity, minHeight: 32)
        .contentShape(.rect)
        .hoverHighlight(RoundedRectangle(cornerRadius: Self.treeHoverRadius, style: .continuous))
        .onTapGesture { if query.isEmpty { toggleOpen() } }
        .accessibilityElement(children: .contain)
        .accessibilityAction(named: open ? "Close \(node.name)" : "Open \(node.name)") { toggleOpen() }
        .padding(.leading, CGFloat(node.depth) * Self.treeStep)
    }

    /// A note under its folder: the whole row ticks it.
    private func noteTreeRow(_ note: AppleNote, depth: Int) -> some View {
        let on = picked.contains(note.id)
        let already = AppleNotesListing.isHere(note, keys: existing)
        return Button {
            if on { picked.remove(note.id) } else { picked.insert(note.id) }
        } label: {
            HStack(spacing: 9) {
                if note.locked {
                    Image(systemName: "lock.fill").font(.system(size: 11)).foregroundStyle(Color.muted).frame(width: 18, height: 18)
                } else {
                    checkboxImage(on ? .all : .none)
                }
                Text(note.name).font(.system(size: 13)).foregroundStyle(Color.ink).lineLimit(1)
                    .opacity(note.locked ? 0.55 : 1)
                if note.locked || already {
                    Text(note.locked ? "Locked in Apple Notes" : "Already imported")
                        .font(.system(size: 11)).foregroundStyle(Color.muted)
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(Color.line.opacity(0.6), in: .capsule)
                }
                // No date on the right: only folders say something there, their count, so the
                // right edge reads one way (Emil, 2 November 2026: "right side is kinda confusing").
                Spacer(minLength: 8)
            }
            .padding(.leading, 6)
            .padding(.trailing, 4)
            .frame(maxWidth: .infinity, minHeight: 30)
            .contentShape(.rect)
            .hoverHighlight(RoundedRectangle(cornerRadius: Self.treeHoverRadius, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(note.locked)
        // One step in: the note's checkbox sits under its folder's icon, as in an outline.
        .padding(.leading, CGFloat(depth - 1) * Self.treeStep + 48)
        .accessibilityLabel(note.locked ? "\(note.name), locked in Apple Notes" : already ? "\(note.name), already imported" : note.name)
        .accessibilityValue(on ? "Included" : "Not included")
        .help(DateBucket.rowDate(note.modified))
    }

    /// Choose notes' folders as a tree, from the notes shown (a search narrows it).
    private var chooseTree: [TreeRow] {
        Self.folderTree(groups.map { (folder, items) in
            (path: items.first.map(listing.destination(of:)) ?? [folder], coming: 0, total: items.count)
        })
    }

    /// The shown notes filed right in this folder.
    private func notesIn(_ path: [String]) -> [AppleNote] {
        groups.first { $0.1.first.map(listing.destination(of:)) == path }?.1 ?? []
    }

    /// The shown notes in this folder and every folder inside it.
    private func notesUnder(_ path: [String]) -> [AppleNote] {
        groups.filter { g in g.1.first.map { listing.destination(of: $0).starts(with: path) } ?? false }.flatMap(\.1)
    }

    /// Whether a folder's notes are all, some or none of them picked.
    enum FolderPick: Equatable { case all, some, none }
    static func folderPick(picked: Int, pickable: Int) -> FolderPick {
        pickable == 0 || picked == 0 ? .none : picked >= pickable ? .all : .some
    }

    /// While Apple Notes is read: a page of its own at the guide's sizes, as the import's own
    /// progress page, not a small spinner in an empty sheet (Emil, 2 November 2026). macOS may ask
    /// for permission now, so the line says what to choose.
    private var readingPage: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            ImportSourceIcon(origin: .appleNotes, size: 76)
                .padding(.bottom, 22)
            Text("Reading your Apple Notes")
                .font(.display(26))
                .tracking(Palette.tracking(26))
                .multilineTextAlignment(.center)
            ProgressView()
                .progressViewStyle(.linear)
                .tint(Color(Palette.amber))
                .frame(maxWidth: 300)
                .padding(.top, 20)
            Text("If macOS asks whether Pinto Notes may use Notes, choose Allow.")
                .font(.system(size: 15))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 380)
                .padding(.top, 18)
                .accessibilityIdentifier("import.permissionLine")
            Spacer(minLength: 0)
        }
    }

    /// Five folders without scrolling; more scroll inside the card.
    static let folderCardHeight: CGFloat = 212


    /// Under the folders, before Import: what won't come over as it is (persona council 11-04).
    private var staysLine: String? {
        loading || failure != nil ? nil : Self.staysLine(locked: notes.filter(\.locked).map(\.name), checklists: !storeAccess, locale: locale)
    }

    /// "Bank details and Codes are locked, so they can't come over. Unlock them in Apple Notes
    /// first, or copy them over yourself." Named, with what to do (Emil, 4 November 2026). The way
    /// to keep checklists is under Choose Notes, off the one-press path; this only says it.
    static func staysLine(locked: [String], checklists: Bool, locale: Locale) -> String? {
        var said: [String] = []
        if let names = lockedNames(locked, locale: locale) {
            said.append(locked.count == 1
                ? "\(names) is locked, so it can\u{2019}t come over. Unlock it in Apple Notes first, or copy it over yourself."
                : "\(names) are locked, so they can\u{2019}t come over. Unlock them in Apple Notes first, or copy them over yourself.")
        }
        if checklists { said.append("Checklists may come in as plain lists.") }
        return said.isEmpty ? nil : said.joined(separator: " ")
    }

    /// "Bank details", "Bank details and Codes", "Bank details, Codes, Passport and 4 more".
    static func lockedNames(_ names: [String], locale: Locale) -> String? {
        let named = names.map { $0.isEmpty ? "A note" : "\u{201C}\($0)\u{201D}" }
        switch named.count {
        case 0: return nil
        case 1: return named[0]
        case 2, 3: return named.dropLast().joined(separator: ", ") + " and " + named.last!
        default: return named.prefix(3).joined(separator: ", ") + " and \((named.count - 3).formatted(.number.locale(locale))) more"
        }
    }

    private var importingPage: some View {
        let p = progress ?? (picked.count / 2, max(picked.count, 1))
        return VStack(spacing: 14) {
            Spacer(minLength: 0)
            ImportSourceIcon(origin: .appleNotes, size: 64)
            Text("Bringing in your notes").font(.system(size: 21, weight: .bold)).tracking(-0.3)
            ProgressView(value: Double(p.done), total: Double(max(p.total, 1)))
                .frame(maxWidth: 300)
                .tint(Color(Palette.amber))
            Text("\(min(p.done + 1, p.total).formatted(.number.locale(locale))) of \(p.total.formatted(.number.locale(locale)))")
                .font(.system(size: 13)).foregroundStyle(Color.muted).monospacedDigit()
            Spacer(minLength: 0)
        }
    }

    private var successPage: some View {
        let n = finished?.noteIDs.count ?? picked.count
        return VStack(spacing: 0) {
            Spacer(minLength: 0)
            ZStack(alignment: .bottomTrailing) {
                ImportSourceIcon(origin: .appleNotes, size: 76)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 28))
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, Color(Palette.amberButton))
                    .background(Circle().fill(Color(Palette.sheetGround)).padding(-3))
                    .offset(x: 8, y: 6)
            }
            .padding(.bottom, 22)
            Text(ImportGuideSheet.successTitle(n, from: "Apple Notes"))
                .font(.display(26))
                .tracking(Palette.tracking(26))
                .multilineTextAlignment(.center)
                .padding(.bottom, 10)
            Text(Self.successLine(locked: finished.map { $0.notImported.filter { $0.why == AppleNotesImportSummary.lockedWhy }.map(\.name) } ?? notes.filter(\.locked).map(\.name), locale: locale))
                .font(.system(size: 15))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 400)
            Spacer(minLength: 0)
            Button { dismiss() } label: { Text(importDoneTitle).frame(maxWidth: .infinity) }
                .buttonStyle(.amberProminent(.regular, wide: true))
                .keyboardShortcut(.defaultAction)
                .frame(maxWidth: 320)
                .accessibilityIdentifier("import.done")
            Text(" ").frame(height: 34).padding(.top, 6).hidden()
        }
    }

    static let successLine = "Your folders came over as they were."

    /// The success page's line, and the locked notes that stayed, as the first page said they would.
    static func successLine(locked: [String], locale: Locale) -> String {
        guard let names = lockedNames(locked, locale: locale) else { return successLine }
        return successLine + (locked.count == 1
            ? " \(names) is locked, so it stayed in Apple Notes. Unlock it there and import again, or copy it over yourself."
            : " \(names) are locked, so they stayed in Apple Notes. Unlock them there and import again, or copy them over yourself.")
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                ImportSourceIcon(origin: .appleNotes, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Import from Apple Notes").font(.system(size: 17, weight: .bold))
                    Text(Self.subtitle(notes: loading || failure != nil ? nil : notes.count, folders: groups.count, locale: locale))
                        .font(.callout).foregroundStyle(Color.muted)
                        .accessibilityIdentifier("import.subtitle")
                }
            }
            // Search belongs to picking notes one by one, not to the one-press path.
            if unread == nil, failure == nil, !loading, choosingNotes {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color.muted)
                    TextField("Search", text: $query, prompt: Text("Search").foregroundStyle(Color(Palette.placeholder)))
                        .textFieldStyle(.plain)
                        .focusEffectDisabled()
                        .focused($searchFocused)
                }
                .padding(.horizontal, 10)
                .frame(height: 30)
                .background(Color(Palette.field), in: .rect(cornerRadius: 8))
                // The field draws its own border, and a ring in the app's amber while it has the keyboard.
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(searchFocused ? Color.paneAccent.opacity(0.7) : Color(Palette.fieldHairline), lineWidth: searchFocused ? 1.5 : 1))
                .disabled(progress != nil)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    @ViewBuilder
    private var content: some View {
        if let unread {
            unreadList(unread)
        } else if loading {
            VStack(spacing: 10) {
                ProgressView().controlSize(.small)
                Text("Reading Apple Notes…").font(.callout)
                // Said before macOS's own question, which only names the two apps.
                Text("If macOS asks whether Pinto Notes may use Notes, choose Allow.")
                    .font(.footnote).foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 320)
                    .accessibilityIdentifier("import.permissionLine")
            }
        } else if let failure {
            ContentUnavailableView {
                Label("Can't read Apple Notes", systemImage: "exclamationmark.triangle")
            } description: { Text(failure) } actions: {
                Button("Try Again") { Task { await load() } }
            }
        } else if notes.isEmpty {
            ContentUnavailableView("No notes in Apple Notes", systemImage: "note.text", description: Text("There's nothing to import yet."))
        } else if shown.isEmpty {
            ContentUnavailableView.search(text: query)
        } else {
            VStack(spacing: 0) {
                // A folder Apple Notes won't list is said, whichever view is showing.
                ForEach(Array(listing.unreadFolders.enumerated()), id: \.offset) { _, folder in
                    Label("Apple Notes wouldn't list the folder \u{201C}\(folder.folder)\u{201D}. Its notes aren't shown.", systemImage: "exclamationmark.triangle.fill")
                        .symbolRenderingMode(.multicolor)
                        .font(.footnote)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 6)
                }
                if !choosingNotes && query.isEmpty {
                    summary
                } else {
                selectionBar
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0, pinnedViews: [.sectionHeaders]) {
                        ForEach(groups, id: \.0) { folder, items in
                            Section {
                                ForEach(items) { note in row(note) }
                            } header: {
                                // One folder needs no heading.
                                if groups.count > 1 { folderHeader(folder, count: items.count) }
                            }
                        }
                    }
                    .padding(.bottom, 8)
                }
                .disabled(progress != nil)
                // The one place the checklist question is answered: off the one-press path.
                if !storeAccess {
                    HStack { checklistNote; Spacer() }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                }
                }
            }
        }
    }

    /// What will come, folder by folder, and the quiet way to pick notes one by one.
    private var summary: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(groups, id: \.0) { folder, items in
                        let coming = items.filter { picked.contains($0.id) }.count
                        HStack(spacing: 10) {
                            Image(systemName: "folder").foregroundStyle(Color.muted).frame(width: 20)
                            Text(folder).font(.system(size: 13, weight: .medium)).lineLimit(1)
                            Spacer(minLength: 8)
                            Text(Self.folderLine(coming: coming, of: items.count, locale: locale))
                                .font(.system(size: 12)).foregroundStyle(Color.muted).monospacedDigit()
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 7)
                        .accessibilityElement(children: .combine)
                    }
                }
                .padding(.bottom, 8)
            }
        }
    }

    /// A folder's count in Choose notes: "9 notes" with none or all of them picked (the checkbox
    /// says which), "3 of 9 notes" for some. "0 of 9" on every folder read like an error.
    static func treeCount(picked: Int, of total: Int, locale: Locale) -> String {
        picked == 0 || picked == total ? folderLine(coming: total, of: total, locale: locale) : folderLine(coming: picked, of: total, locale: locale)
    }

    /// "18 notes", "2 of 9 notes" (the rest are here already or locked).
    static func folderLine(coming: Int, of total: Int, locale: Locale) -> String {
        func n(_ c: Int) -> String { c.formatted(.number.locale(locale)) }
        if coming == total { return total == 1 ? "1 note" : "\(n(total)) notes" }
        return "\(n(coming)) of \(n(total)) \(total == 1 ? "note" : "notes")"
    }

    /// How many are picked, and the one control that picks or clears them all.
    private var selectionBar: some View {
        let all = !pickable.isEmpty && pickable.allSatisfy { picked.contains($0.id) }
        return HStack {
            Text(Self.count(picked.count, of: notes.count, locale: locale))
                .font(.system(size: 12, weight: .medium)).foregroundStyle(Color.muted).monospacedDigit()
            Spacer()
            Button(all ? "Deselect All" : "Select All") {
                let ids = pickable.map(\.id)
                if all { picked.subtract(ids) } else { picked.formUnion(ids) }
            }
            .buttonStyle(.hoverLink)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(.tint)
            .disabled(pickable.isEmpty || progress != nil)
            .accessibilityIdentifier("import.selectAll")
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    /// The notes that can come at all: a locked note's text can't be read. "Import 12 Notes" with
    /// all of them picked, not "Import 12 New Notes" because two locked ones were counted.
    static func readable(_ notes: [AppleNote]) -> Int { notes.filter { !$0.locked }.count }

    /// Notes that can come and aren't here yet: what the sheet picks when it opens.
    private var newCount: Int { notes.filter { !$0.locked && !AppleNotesListing.isHere($0, keys: existing) }.count }

    /// "35 notes in 5 folders. Apple Notes stays as it is." Before the notes are read, only the promise.
    static func subtitle(notes: Int?, folders: Int, locale: Locale) -> String {
        let stays = "Apple Notes stays as it is."
        guard let notes, notes > 0 else { return stays }
        func n(_ c: Int) -> String { c.formatted(.number.locale(locale)) }
        let what = "\(n(notes)) \(notes == 1 ? "note" : "notes")"
        let whereIn = folders > 1 ? " in \(n(folders)) folders" : ""
        return "\(what)\(whereIn). \(stays)"
    }

    /// The one button: "Import 35 Notes" when every note is picked, "Import 17 New Notes" when
    /// everything new is, otherwise the count.
    static func importTitle(picked: Int, new: Int, all: Int, locale: Locale) -> String {
        func n(_ c: Int) -> String { c.formatted(.number.locale(locale)) }
        if picked == 0 { return "Import" }
        if picked == all { return picked == 1 ? "Import 1 Note" : "Import \(n(picked)) Notes" }
        if picked == new && new < all { return "Import \(n(picked)) New \(picked == 1 ? "Note" : "Notes")" }
        return "Import \(n(picked)) \(picked == 1 ? "Note" : "Notes")"
    }

    /// "18 of 18 notes selected", "No notes selected".
    static func count(_ picked: Int, of total: Int, locale: Locale) -> String {
        let t = total.formatted(.number.locale(locale))
        if picked == 0 { return total == 1 ? "1 note, not selected" : "\(t) notes, none selected" }
        return "\(picked.formatted(.number.locale(locale))) of \(t) \(total == 1 ? "note" : "notes") selected"
    }

    private func folderHeader(_ folder: String, count: Int, inset: CGFloat = 20, ground: Color = Color(Palette.sheetGround)) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "folder").font(.system(size: 11)).foregroundStyle(Color.muted)
            Text(folder).font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted).lineLimit(1)
            Text(count.formatted(.number.locale(locale))).font(.system(size: 12)).foregroundStyle(Color.muted.opacity(0.7)).monospacedDigit()
            Spacer()
        }
        .padding(.horizontal, inset)
        .padding(.vertical, 6)
        .background(ground)
    }

    private func row(_ note: AppleNote, inset: CGFloat = 20) -> some View {
        let on = picked.contains(note.id)
        let already = AppleNotesListing.isHere(note, keys: existing)
        return Button {
            if on { picked.remove(note.id) } else { picked.insert(note.id) }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: note.locked ? "lock.fill" : on ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: note.locked ? 13 : 17))
                    .frame(width: 20)
                    .foregroundStyle(on ? AnyShapeStyle(.tint) : AnyShapeStyle(Color.muted.opacity(0.6)))
                    .contentTransition(.symbolEffect(.replace))
                VStack(alignment: .leading, spacing: 2) {
                    Text(note.name).font(.system(size: 13, weight: .medium)).lineLimit(1)
                    Text(DateBucket.rowDate(note.modified)).font(.system(size: 12)).foregroundStyle(Color.muted).monospacedDigit()
                }
                .opacity(note.locked ? 0.55 : 1)
                Spacer(minLength: 8)
                if note.locked || already {
                    Text(note.locked ? "Locked in Apple Notes" : "Already imported")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.muted)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(Color.line.opacity(0.6), in: .capsule)
                }
            }
            .padding(.horizontal, inset)
            .padding(.vertical, 7)
            // A rounded pill inset from the edges, as the folders' (Emil, 2 November 2026: a hard
            // grey band read oddly).
            .hoverHighlight(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .disabled(note.locked)
        .accessibilityLabel(note.locked ? "\(note.name), locked in Apple Notes, can't be imported" : already ? "\(note.name), already imported" : note.name)
        .accessibilityValue(DateBucket.rowDate(note.modified))
        .accessibilityAddTraits(on ? .isSelected : [])
        .animation(.easeOut(duration: 0.12), value: on)
    }

    private var footer: some View {
        HStack(spacing: 14) {
            if unread != nil {
                Spacer()
                Button("Done") { dismiss() }
                    .buttonStyle(.amberProminent)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("import.done")
            } else if let progress {
                ProgressView(value: Double(progress.done), total: Double(max(progress.total, 1)))
                    .frame(width: 120)
                // One line, however large the numbers.
                Text("Importing \(min(progress.done + 1, progress.total).formatted(.number.locale(locale))) of \(progress.total.formatted(.number.locale(locale)))…")
                    .font(.callout).foregroundStyle(Color.muted).monospacedDigit()
                    .lineLimit(1).fixedSize()
                Spacer()
            } else {
                if !loading, failure == nil, !notes.isEmpty {
                    // Picking one by one is there, quietly, for whoever wants it.
                    Button(choosingNotes ? "Show Folders" : "Choose Notes…") {
                        choosingNotes.toggle()
                        if !choosingNotes { query = "" }
                    }
                    .buttonStyle(.hoverLink)
                    .foregroundStyle(.tint)
                    .disabled(progress != nil)
                    .accessibilityIdentifier("import.chooseNotes")
                }
                Spacer(minLength: 0)
                Button("Cancel") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                    .fixedSize()
                Button(Self.importTitle(picked: picked.count, new: newCount, all: Self.readable(notes), locale: locale)) {
                    Task { await runImport() }
                }
                .buttonStyle(.amberProminent)
                .keyboardShortcut(.defaultAction)
                .disabled(picked.isEmpty)
                .fixedSize()
                .accessibilityIdentifier("import.start")
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }

    /// What AppleScript can't tell us, said once and never asked for: a checklist is only a
    /// checklist, and a pin a pin, in Notes' database and in its own export. The line is there
    /// only when the database can't be read.
    private var checklistNote: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("Checklists may come in as plain lists.")
            Button("How to keep them") { explainingChecklists = true }
                .buttonStyle(.hoverLink)
                .foregroundStyle(.tint)
                .accessibilityIdentifier("import.checklists")
                .popover(isPresented: $explainingChecklists, arrowEdge: .top) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Keeping checklists and pins").font(.headline)
                        Text("Checklists and pinned notes come over exactly when Pinto Notes has Full Disk Access. Without it, checklists arrive as bullet lists.")
                        Button("Open Settings") { NSWorkspace.shared.open(ApplePins.settingsURL) }
                            .accessibilityIdentifier("import.fullDiskAccess")
                        Text("Or, instead of this import, export from Notes as Markdown and import that folder. Not both: notes brought in both ways come twice.")
                            .padding(.top, 4)
                        Text("1. In Apple Notes, select the notes and choose File, Export as, Markdown.\n2. Here, choose File, Import Markdown or Text, and pick that folder.")
                            .foregroundStyle(Color.muted)
                    }
                    .font(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(width: 330, alignment: .leading)
                    .padding(16)
                }
        }
        .font(.footnote)
        .foregroundStyle(Color.muted)
        .fixedSize(horizontal: false, vertical: true)
    }

    /// After an import that left something behind: what came, and each note that didn't, with why.
    private func unreadList(_ summary: AppleNotesImportSummary) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Label(summary.line(locale: locale), systemImage: "checkmark.circle.fill")
                    .font(.system(size: 13, weight: .medium))
                    .symbolRenderingMode(.hierarchical)
                    .accessibilityIdentifier("import.result")
                if let left = summary.leftLine(locale: locale) {
                    Label(left, systemImage: "exclamationmark.triangle.fill")
                        .font(.system(size: 13, weight: .medium))
                        .symbolRenderingMode(.multicolor)
                        .padding(.top, 6)
                    ForEach(Array(summary.notImported.enumerated()), id: \.offset) { _, note in
                        VStack(alignment: .leading, spacing: 1) {
                            Text(note.name).font(.system(size: 13)).lineLimit(1)
                            Text(note.why).font(.footnote).foregroundStyle(Color.muted).lineLimit(2)
                        }
                        .padding(.leading, 26)
                    }
                }
                ForEach(Array(listing.unreadFolders.enumerated()), id: \.offset) { _, folder in
                    Label("The folder \u{201C}\(folder.folder)\u{201D} couldn't be read, so its notes aren't listed. \(folder.why)", systemImage: "folder.badge.questionmark")
                        .font(.system(size: 13))
                        .padding(.top, 6)
                }
                Text("Import again any time: notes that are already here are skipped.")
                    .font(.footnote).foregroundStyle(Color.muted).padding(.top, 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
        }
    }

    private func load() async {
        loading = true
        failure = nil
        existing = AppleNotesListing.keysOfNotes(in: context)
        if AppleNotesBridge.isDemo {
            // `-importDelay 1.5`: captures of the sheet while Apple Notes is being read.
            if let wait = Capture.argument("-importDelay").flatMap(Double.init) { try? await Task.sleep(for: .seconds(wait)) }
            // Captures never read the real Apple Notes: a made-up library, most of it picked.
            listing = AppleNotesListing(notes: AppleNotesBridge.demoNotes + (Self.demoLocked ? AppleNotesBridge.demoLockedNotes : []))
            picked = Set(notes.filter { $0.folder != "Archive" && !$0.locked }.map(\.id))
            existing = []
            storeAccess = !Self.demoWithoutAccess
            loading = false
            return
        }
        storeAccess = !ApplePins.isAvailable || ApplePins.hasAccess()
        do {
            listing = try await Task.detached { try AppleNotesBridge.list() }.value
            AppleNotesFunnel.read(.success(listing))
            // Everything that isn't here yet, in every folder, ready to go: importing all of it
            // is the usual wish, and nothing is left out for being further down the list.
            picked = listing.pickedAtFirst(keys: existing)
        } catch AppleNotesBridge.Failure.denied {
            AppleNotesFunnel.read(.failure(AppleNotesBridge.Failure.denied))
            failure = AppleNotesBridge.Failure.denied.localizedDescription
        } catch {
            AppleNotesFunnel.read(.failure(error))
            failure = error.localizedDescription
        }
        notice = failure == AppleNotesBridge.Failure.denied.localizedDescription ? .denied
            : failure == nil && listing.notes.isEmpty && listing.unreadFolders.isEmpty ? .empty : nil
        loading = false
    }

    private func runImport() async {
        // The made-up library of captures is never read from Apple Notes.
        guard !AppleNotesBridge.isDemo else { return }
        // The picked notes, and the locked ones nobody could pick: they're named afterwards.
        let chosen = notes.filter { picked.contains($0.id) || $0.locked }
        progress = (0, chosen.count)
        imported = true
        AppleNotesFunnel.importing()
        let summary = await AppleNotesImporter(context: context).run(chosen, listing: listing, keepFolders: true) { done, total in
            progress = (done, total)
        }
        AppleNotesFunnel.finished(summary)
        onSummary(summary)
        onImported(summary.noteIDs)
        progress = nil
        // Nothing to explain: the success page, as the other guides end. Otherwise what couldn't come.
        // Locked notes were said to stay before Import, so they alone don't make it a list.
        if Self.endsOnSuccess(summary, unreadFolders: listing.unreadFolders.count) { choosingNotes = false; pickedBefore = nil; finished = summary } else { unread = summary }
    }
}

extension AppleNotesImportView {
    /// The import ends on the success page when nothing went wrong: every note came, or the only
    /// ones that didn't are locked (the first page said those stay).
    static func endsOnSuccess(_ summary: AppleNotesImportSummary, unreadFolders: Int) -> Bool {
        unreadFolders == 0 && summary.notImported.allSatisfy { $0.why == AppleNotesImportSummary.lockedWhy }
    }
}

/// The quiet line an import leaves behind: a capsule over the foot of the window, gone by itself.
struct ImportDoneLine: View {
    let text: String

    var body: some View {
        Toast(text: text)
            .accessibilityIdentifier("import.doneLine")
    }
}

/// A row of Choose notes' tree: tight, no separator, its own hover instead of the list's.
private struct TreeRowLook: ViewModifier {
    func body(content: Content) -> some View {
        content
            .listRowInsets(EdgeInsets(top: 0, leading: 10, bottom: 0, trailing: 12))
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)
    }
}
#endif
