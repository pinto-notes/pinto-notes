#if os(macOS)
import AppKit
import SwiftData
import SwiftUI

/// Reads Apple Notes through AppleScript. macOS asks once for permission.
enum AppleNotesBridge {
    enum Failure: LocalizedError {
        case script(String)
        var errorDescription: String? {
            switch self { case .script(let m): m }
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
            if code == -1743 {
                throw Failure.script("Pinto Notes isn't allowed to read Apple Notes. Turn it on in System Settings → Privacy & Security → Automation.")
            }
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

    static func body(of id: String) throws -> String {
        let escaped = id.replacingOccurrences(of: "\"", with: "\\\"")
        return try run("tell application \"Notes\" to get body of note id \"\(escaped)\"").stringValue ?? ""
    }
}

/// Pick Apple Notes to copy in. Nothing in Apple Notes is changed.
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

    @Environment(\.locale) private var locale
    @State private var listing = AppleNotesListing()
    private var notes: [AppleNote] { listing.notes }
    @State private var picked: Set<String> = []
    @State private var query = ""
    @State private var loading = true
    @State private var failure: String?
    @State private var progress: (done: Int, total: Int)?
    /// The notes already here, by title and date.
    @State private var existing: Set<String> = []
    /// Notes' own database can be read (Full Disk Access is on): checklists and pins come over too.
    @State private var storeAccess = true
    @State private var explainingChecklists = false
    /// Captures: the sheet as it is on a Mac where Notes' database can't be read.
    nonisolated(unsafe) static var demoWithoutAccess = false
    /// Set when some notes couldn't be read: the sheet stays to say which.
    @State private var unread: AppleNotesImportSummary?
    @FocusState private var searchFocused: Bool
    /// The notes one by one. The sheet opens on folders and their counts: picking is the
    /// exception, so it's one quiet press away instead of the first thing seen.
    @State private var choosingNotes = false

    private var shown: [AppleNote] {
        query.isEmpty ? notes : notes.filter { n in n.name.localizedStandardContains(query) || listing.destination(of: n).contains { $0.localizedStandardContains(query) } }
    }

    /// Shown notes by account and folder, in Apple Notes' own order.
    private var groups: [(String, [AppleNote])] { listing.groups(shown).map { ($0.heading, $0.notes) } }

    /// Folders alone need little room: the sheet fits them, up to its full height for picking notes.
    private var sheetHeight: CGFloat {
        guard !loading, failure == nil, unread == nil, !choosingNotes, !groups.isEmpty else { return Self.height }
        return min(Self.height, max(300, 170 + CGFloat(groups.count) * 30 + CGFloat(listing.unreadFolders.count) * 22))
    }

    /// Shown notes that can be picked: a locked note's text can't be read.
    private var pickable: [AppleNote] { shown.filter { !$0.locked } }

    var body: some View {
        VStack(spacing: 0) {
            header
            content
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            Rectangle().fill(Color.line).frame(height: 1)
            footer
        }
        .frame(width: 540, height: sheetHeight)
        .animation(.easeOut(duration: 0.2), value: choosingNotes)
        .foregroundStyle(Color.ink)
        // The app's own warm ground, not the system's grey sheet.
        .background(Color(Palette.sheetGround))
        .presentationBackground(Color(Palette.sheetGround))
        .task { await load() }
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
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(searchFocused ? Color.accentColor.opacity(0.7) : Color(Palette.fieldHairline), lineWidth: searchFocused ? 1.5 : 1))
                .disabled(progress != nil)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 20)
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

    private func folderHeader(_ folder: String, count: Int) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "folder").font(.system(size: 11)).foregroundStyle(Color.muted)
            Text(folder).font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted).lineLimit(1)
            Text(count.formatted(.number.locale(locale))).font(.system(size: 12)).foregroundStyle(Color.muted.opacity(0.7)).monospacedDigit()
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 6)
        .background(Color(Palette.sheetGround))
    }

    private func row(_ note: AppleNote) -> some View {
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
            .padding(.horizontal, 20)
            .padding(.vertical, 7)
            .hoverHighlight(Rectangle())
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
                Button(Self.importTitle(picked: picked.count, new: newCount, all: notes.count, locale: locale)) {
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
            // Captures never read the real Apple Notes: a made-up library, most of it picked.
            listing = AppleNotesListing(notes: AppleNotesBridge.demoNotes)
            picked = Set(notes.filter { $0.folder != "Archive" }.map(\.id))
            existing = []
            storeAccess = !Self.demoWithoutAccess
            loading = false
            return
        }
        storeAccess = !ApplePins.isAvailable || ApplePins.hasAccess()
        do {
            listing = try await Task.detached { try AppleNotesBridge.list() }.value
            // Everything that isn't here yet, in every folder, ready to go: importing all of it
            // is the usual wish, and nothing is left out for being further down the list.
            picked = listing.pickedAtFirst(keys: existing)
        } catch {
            failure = error.localizedDescription
        }
        loading = false
    }

    private func runImport() async {
        // The made-up library of captures is never read from Apple Notes.
        guard !AppleNotesBridge.isDemo else { return }
        // The picked notes, and the locked ones nobody could pick: they're named afterwards.
        let chosen = notes.filter { picked.contains($0.id) || $0.locked }
        progress = (0, chosen.count)
        let summary = await AppleNotesImporter(context: context).run(chosen, listing: listing, keepFolders: true) { done, total in
            progress = (done, total)
        }
        onSummary(summary)
        onImported(summary.noteIDs)
        progress = nil
        // Nothing to explain: back to the notes, where a line says what came over.
        if summary.notImported.isEmpty && listing.unreadFolders.isEmpty { dismiss() } else { unread = summary }
    }
}

/// The quiet line an import leaves behind: a capsule over the foot of the window, gone by itself.
struct ImportDoneLine: View {
    let text: String

    var body: some View {
        Label(text, systemImage: "checkmark.circle.fill")
            .symbolRenderingMode(.hierarchical)
            .font(.callout.weight(.medium))
            .foregroundStyle(Color.ink)
            .lineLimit(1)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            // Solid, so note text behind never shows through.
            .background(Color.notePage, in: .capsule)
            .overlay(Capsule().strokeBorder(Color.line, lineWidth: 0.5))
            .shadow(color: .black.opacity(0.12), radius: 10, y: 3)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.updatesFrequently)
            .accessibilityIdentifier("import.doneLine")
    }
}
#endif
