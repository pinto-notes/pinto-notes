import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// Three columns, like Apple Notes: folders, notes, the note.
struct RootView: View {
    @Environment(\.modelContext) private var context
    @Environment(OnboardingStore.self) private var onboarding: OnboardingStore?
    #if os(iOS)
    /// On iPhone a folder is pushed once the first layout is done (see `lifecycle`).
    @State private var scope: Scope?
    #else
    @State private var scope: Scope? = .all
    #endif
    /// The list's selection; one note opens in the editor, several show a summary like Notes.
    @State private var selection: Set<UUID> = []
    @State private var visibility: NavigationSplitViewVisibility = .all
    @State private var editor = EditorController()
    /// The library's notes as the list keeps them, for the list and the sidebar's folder counts.
    @State private var library = LibraryNotes()
    @State private var justCreated: UUID?
    #if os(iOS)
    /// The notes links opened, for Back to the note or app a link was in.
    @State private var trail = LinkTrail()
    #endif
    #if os(iOS)
    @Environment(\.dynamicTypeSize) private var typeSize
    /// UI tests: `-uitest -launchAlert` raises an alert as the notes first show, like the
    /// account's connection notices after unlocking.
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var launchAlert = ProcessInfo.processInfo.arguments.contains("-uitest") && ProcessInfo.processInfo.arguments.contains("-launchAlert")
    #endif
    @State private var showImport = false
    #if os(macOS)
    /// "Imported 18 notes": shown for a few seconds once the Apple Notes sheet has closed.
    @State private var importLine: String?
    #endif
    #if os(iOS)
    /// "Import from Apple Notes" from an email, on an iPhone: it's a Mac feature.
    @State private var importOnMac = false
    #endif
    /// The import sheet showing (Evernote, Markdown…).
    @State private var importing: ImportKind?
    /// Files the import sheet opens with (shared, opened from Files, dropped on the app).
    @State private var importFiles: [URL] = []
    @AppStorage("lastScope") private var lastScopeData: Data = Data()
    /// Files that weren't added (a kind the app can't show, or over 100 MB), said once.
    @State private var refusal: FileRefusal?
    /// Connect an AI, from the File menu, the list's menu or the card at the foot of the sidebar.
    @State private var connectingAI = false
    #if os(macOS)
    /// Go to Note… (⌘O): the notes as they were when it opened, while it shows.
    @State private var quickOpen: [QuickOpen.NoteItem]?
    #endif
    @Environment(SetupStore.self) private var setupStore: SetupStore?
    @Environment(Backend.self) private var backendForConnect: Backend?
    @AppStorage("lastNote") private var lastNote: String = ""

    /// The single open note, when exactly one is selected.
    private var selectedNote: UUID? {
        get { selection.count == 1 ? selection.first : nil }
        nonmutating set { selection = newValue.map { [$0] } ?? [] }
    }

    #if os(macOS)
    /// For a pass after a press on a row, the note pane keeps what it showed (PressSelect).
    @State private var hold = DetailHold.shared
    /// What the note pane shows: the selection, or what it had while a pressed row's fill goes out.
    private var shown: Set<UUID> { hold.held ?? selection }
    #else
    private var shown: Set<UUID> { selection }
    #endif
    private var shownNote: UUID? { shown.count == 1 ? shown.first : nil }

    var body: some View {
        #if DEBUG
        RenderProbe.count("RootView")
        #endif
        return imports(lifecycle(split)).newAppSheet()
            // Reports: the notes are on screen, for the cold launch time (Telemetry).
            .onAppear { Telemetry.shared.notesShown() }
            .focusedSceneValue(\.newNoteAction, newNote)
            .focusedSceneValue(\.editorController, editor)
            .focusedSceneValue(\.importAction, { showImport = true })
            .focusedSceneValue(\.importFromAction, { kind in importFiles = []; importing = kind })
            .focusedSceneValue(\.deleteNoteAction, deleteAction)
            // A template or shared note to add, from a link.
            .noteSourceHandler()
            .onReceive(NotificationCenter.default.publisher(for: .paneConnectAI)) { _ in connectingAI = true }
            #if os(macOS)
            .onReceive(NotificationCenter.default.publisher(for: .paneQuickOpen)) { _ in
                quickOpen = quickOpen == nil ? QuickOpen.noteItems(in: context) : nil
            }
            .overlay(alignment: .top) { quickOpenPanel }
            #endif
            .sheet(isPresented: $connectingAI, onDismiss: { Task { await setupStore?.refresh(force: true) } }) {
                if let client = backendForConnect?.client { ConnectAISheet(client: client) }
            }
            // Collaboration (prototype): an invitation to someone else's note.
            .modifier(CollabInviteAlert())
            .onReceive(NotificationCenter.default.publisher(for: FileRefusal.notification)) { n in refusal = n.object as? FileRefusal }
            .alert(refusal?.title ?? "", isPresented: Binding(get: { refusal != nil }, set: { if !$0 { refusal = nil } })) {
                Button("OK") {}
            } message: { Text(refusal?.message ?? "") }
            #if os(iOS)
            .alert("Launch alert", isPresented: $launchAlert) { Button("OK", role: .cancel) {} }
            #endif
    }

    private var split: some View {
        NavigationSplitView(columnVisibility: $visibility) {
            // On the Mac the folders and the list are compared before they're worked out again (see
            // their `==`): the split view hands its columns over again whenever one is hidden or shown.
            SidebarView(scope: $scope, onNewNote: newNote, onOpenNote: openFound)
                #if os(macOS)
                .equatable()
                #endif
                .environment(library)
                #if os(macOS)
                // Search takes the sidebar button's place (Emil, 10-29). View › Hide Sidebar (⌃⌘S)
                // and the split view's own collapse in a narrow window still hide it.
                .toolbar(removing: .sidebarToggle)
                .navigationSplitViewColumnWidth(min: 200, ideal: 260, max: 360)
                #else
                // iPad: room for the title beside the account button.
                .navigationSplitViewColumnWidth(min: 264, ideal: 270, max: 400)
                #endif
        } content: {
            NoteListView(scope: scope ?? .all, selection: $selection, onNewNote: newNote)
                #if os(macOS)
                .equatable()
                #endif
                .environment(library)
                #if os(macOS)
                .navigationSplitViewColumnWidth(min: 260, ideal: 330, max: 440)
                #else
                // Large text needs the room more here than in the note beside it.
                .navigationSplitViewColumnWidth(min: typeSize.isAccessibilitySize ? 340 : 260, ideal: typeSize.isAccessibilitySize ? 380 : 310, max: 420)
                #endif
                #if os(iOS)
                // Each visit to a folder starts at the top with its large title, as in Notes.
                .id(scope)
                #endif
        } detail: {
            detail
                #if os(macOS)
                // Room for the note's toolbar; a narrow window drops the sidebar instead, like Notes.
                .navigationSplitViewColumnWidth(min: 520, ideal: 760)
                #endif
        }
        .environment(editor)
        .environment(\.importActions, ImportActions(appleNotes: { showImport = true },
                                                     from: { kind in importFiles = []; importing = kind }))
        #if os(macOS)
        // The list column shows its own title; no window title in the bar.
        .toolbar(removing: .title)
        // ⌘F (Edit › Find › Find…) opens the notes search, unless the note's text has the keys:
        // then the text view takes it first and finds in the note, as in Notes.
        .onCommand(#selector(NSTextView.performFindPanelAction(_:))) {
            NotificationCenter.default.post(name: .paneSearchNotes, object: nil)
        }
        #endif
    }

    #if os(macOS)
    /// Go to Note…, over the window's top third like Spotlight. A click outside closes it.
    @ViewBuilder private var quickOpenPanel: some View {
        if let notes = quickOpen {
            let open = selectedNote.flatMap { context.note($0) }
            ZStack(alignment: .top) {
                Color.clear
                    .contentShape(.rect)
                    .onTapGesture { quickOpen = nil }
                QuickOpenPanel(notes: notes,
                               commands: QuickOpen.commands(openNote: open != nil && open?.trashedAt == nil, pinned: open?.isPinned == true, importKinds: ImportKind.listed),
                               choose: { row in
                                   quickOpen = nil
                                   QuickOpen.choose(row, with: quickOpenActions)
                               },
                               close: { quickOpen = nil })
                    .padding(.top, 72)
            }
        }
    }

    /// What the panel's rows do here: the notes window's own actions, as the menus run them.
    private var quickOpenActions: QuickOpen.Actions {
        QuickOpen.Actions(
            open: { id in reveal(id) },
            run: { action in
                switch action {
                case .newNote: newNote()
                case .newFolder: NotificationCenter.default.post(name: .paneNewFolder, object: nil)
                case .togglePin: if let id = selectedNote, let n = context.note(id) { context.togglePin(n) }
                case .move: NotificationCenter.default.post(name: .paneMoveNote, object: nil)
                case .importAppleNotes: showImport = true
                case .importFrom(let kind): importFiles = []; importing = kind
                case .connectAI: connectingAI = true
                case .settings: SettingsRoute.shared.show()
                }
            },
            search: { text in
                scope = .all
                NotificationCenter.default.post(name: .paneSearchNotes, object: text)
            })
    }
    #endif

    /// Restoring where you were, and remembering it.
    private func lifecycle(_ content: some View) -> some View {
        content
            .onAppear {
                #if os(iOS)
                // On iPhone restoring the folder pushes the note list; doing that after the first
                // layout lets the list open with its large title showing, as it does when you tap in.
                DispatchQueue.main.async {
                    // A push made while an alert or sheet is up (the connection notices right
                    // after unlocking) is dropped by UIKit, yet the folder and note stay selected:
                    // the folder list then wears the list's and the note's toolbars, compose
                    // makes a note nobody sees and search focuses a field that isn't on screen.
                    // With something presented, the iPhone folder list stays, as it's what you see.
                    guard sizeClass != .compact || !Presentation.isActive else { return }
                    // Opened where you were, not pushed there: with animation the folder list
                    // showed for a moment and the note then slid in over it.
                    var instant = Transaction()
                    instant.disablesAnimations = true
                    withTransaction(instant) {
                        restoreScope()
                        restoreNote()
                        openFromLaunchArguments()
                    }
                }
                #else
                restoreScope()
                restoreNote()
                openFromLaunchArguments()
                reveal(NoteOpener.shared.request)
                #endif
            }
            .onChange(of: scope) { _, new in
                rememberScope(new)
                #if os(iOS)
                // Back on the iPhone folder list nothing is open: a note left selected would keep
                // its toolbar on this screen. Leaving an empty new note this way discards it.
                if new == nil, !selection.isEmpty { selection = [] }
                #endif
            }
            .onChange(of: selectedNote) { old, new in noteChanged(from: old, to: new) }
            #if os(macOS)
            .onChange(of: selection, initial: true) { _, new in DetailHold.shared.current = new }
            #endif
            // The first-run flow just ended: the notes open on what it left ready.
            .task(id: onboarding?.landing) { openLanding() }
            // A note opened from the menu bar.
            .onChange(of: NoteOpener.shared.request) { _, id in reveal(id) }
            // From the onboarding emails: ambernotes.app/open/import and /open/history.
            .onChange(of: AppPlaceCenter.shared.pending, initial: true) { _, place in openPlace(place) }
            #if os(iOS)
            .alert("Import on your Mac", isPresented: $importOnMac) {
                Button("OK") {}
            } message: { Text("To bring everything at once, use Import from Apple Notes in Pinto Notes on your Mac. It syncs here a second later.") }
            #endif
    }

    /// Opens the place an email linked to, if it's one this view owns, then clears it.
    private func openPlace(_ place: AppPlace?) {
        let center = AppPlaceCenter.shared
        switch place {
        case .importNotes:
            center.pending = nil
            #if os(macOS)
            showImport = true
            #else
            importOnMac = true
            #endif
        case .history:
            center.pending = nil
            let notes = (try? context.fetch(FetchDescriptor<Note>())) ?? []
            let live = notes.filter { $0.deletedAt == nil && $0.trashedAt == nil && !$0.isLocked }
            guard let id = AppPlace.historyNote(live.map { (id: $0.id, aiEditedAt: $0.aiEditedAt) }) else {
                // No note an AI changed yet: the notes, so the person can pick one.
                scope = .all
                selectedNote = nil
                return
            }
            center.historyFor = id
            reveal(id)
        default:
            break
        }
    }

    /// After the first-run flow: a new empty note with the cursor in it, or the To-do note the
    /// last step's prompt writes to. A beat after the window's own restoring, which it replaces.
    private func openLanding() {
        guard let onboarding, onboarding.landing != nil else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            switch onboarding.takeLanding() {
            case .newNote: newNote()
            case .note(let id): reveal(id)
            case nil: break
            }
        }
    }

    private func rememberScope(_ new: Scope?) {
        if let new, let data = try? JSONEncoder().encode(new) { lastScopeData = data }
    }

    private func noteChanged(from old: UUID?, to new: UUID?) {
        // The note you were typing in is written before anything looks at it.
        DebouncedSave.flushAll()
        if new == nil { PaneTips.listOpened() }
        if old != nil { NotificationCenter.default.post(name: .paneNoteClosed, object: nil) }
        discardIfEmpty(old)
        if let new { lastNote = new.uuidString }
        #if os(iOS)
        trail.opened(new)
        #endif
    }

    #if os(iOS)
    /// Back after a link: the note or app the link was in.
    private func goBack() {
        guard let p = trail.back() else { return }
        selectedNote = p
    }
    #endif

    private func imports(_ content: some View) -> some View {
        content
            #if os(macOS)
            .sheet(isPresented: $showImport) {
                AppleNotesImportView(onSummary: { importLine = $0.line() }) { ids in
                    if let first = ids.first { scope = .all; selectedNote = first }
                }
            }
            // What the import did, said once over the window's foot instead of asked to be dismissed.
            .overlay(alignment: .bottom) {
                if let importLine, !showImport {
                    ImportDoneLine(text: importLine)
                        .padding(.bottom, 18)
                        .transition(.opacity.combined(with: .offset(y: 6)))
                        .task {
                            try? await Task.sleep(for: .seconds(6))
                            self.importLine = nil
                        }
                }
            }
            .animation(.easeOut(duration: 0.25), value: importLine)
            .animation(.easeOut(duration: 0.25), value: showImport)
            #endif
            .sheet(item: $importing, onDismiss: EvernoteInbox.clear) { kind in
                ImportFlow(kind: kind, files: importFiles) { ids in
                    #if os(macOS)
                    // Show My Notes: the folder the import made, open on a note its list shows.
                    if !ids.isEmpty {
                        let landing = context.importLanding(of: ids)
                        scope = landing.scope
                        selectedNote = landing.note
                    }
                    #endif
                }
            }
            // Exports shared into the app, or opened with it from Files or Finder.
            .onReceive(NotificationCenter.default.publisher(for: .paneEvernoteOffered)) { _ in offerEvernote() }
            .onOpenURL { url in
                guard url.isFileURL, EvernoteInbox.isExport(url.lastPathComponent) else { return }
                EvernoteInbox.offer([EvernoteInbox.keep(url) ?? url])
            }
            .onAppear { offerEvernote() }
    }

    private func offerEvernote() {
        guard !EvernoteInbox.files.isEmpty, importing == nil else { return }
        importFiles = EvernoteInbox.files
        importing = .evernote
    }

    private var deleteAction: (() -> Void)? {
        guard !selection.isEmpty else { return nil }
        return { deleteSelected() }
    }

    /// Edit › Delete: every selected note goes to Recently Deleted (or, there, is deleted for good).
    private func deleteSelected() {
        let notes = selection.compactMap { context.note($0) }
        withAnimation(.snappy(duration: 0.25)) {
            context.remove(notes)
            selection = []
        }
    }

    @ViewBuilder
    private var detail: some View {
            if let id = shownNote, let note = context.note(id), note.deletedAt == nil {
                #if os(macOS)
                NoteToolbarStage {
                    NoteDetailView(note: note, controller: editor, autofocus: justCreated == id, onNewNote: newNote) { target, edit in
                        if edit { justCreated = target }
                        selectedNote = target
                    }
                        .id(id)
                }
                #else
                NoteDetailView(note: note, controller: editor, autofocus: justCreated == id, onNewNote: newNote) { target, edit in
                    if edit { justCreated = target }
                    trail.followed(from: selectedNote, to: target)
                    selectedNote = target
                }
                    .id(id)
                    .modifier(LinkBackButton(title: trail.previous.flatMap { context.note($0) }.flatMap { $0.deletedAt == nil ? $0.title : nil }, back: goBack))
                #endif
            } else if let id = shownNote, let file = context.attachment(id), file.folderID != nil, file.deletedAt == nil {
                // A file kept in the folder: its preview.
                FileDetailView(file: file, onNewNote: newNote, onOpenFile: { selectedNote = $0 })
                    .id(id)
            } else {
                Group {
                    if shown.count > 1 {
                        MultipleSelectionView(count: shown.count, items: shown.contains { context.attachment($0) != nil })
                    } else {
                        EmptyDetailView()
                    }
                }
                .background(Color.notePage.ignoresSafeArea())
                #if os(macOS)
                .toolbar {
                    ToolbarItem {
                        ComposeButton(newNote: newNote) {
                            Label { Text("New Note") } icon: { ToolbarGlyph.image("square.and.pencil", shift: ToolbarGlyph.composeShift) }
                        }
                            .accessibilityIdentifier("list.newNote")
                    }
                    ToolbarSpacer(.flexible)
                }
                #endif
            }
    }

    private func newNote() {
        let target: Scope = scope == .trash ? .all : (scope ?? .all)
        if scope == .trash { scope = .all }
        // Reuse an untouched empty note instead of stacking blanks.
        if scope != nil, let id = selectedNote, let n = context.note(id), n.body.isEmpty, n.trashedAt == nil {
            editor.focus()
            return
        }
        let note = context.createNote(in: target)
        Telemetry.shared.record(.firstNoteCreated)
        #if os(iOS)
        // From the iPhone folder list: open the note's folder under it, as Notes does, so the
        // editor is pushed and back leads to the folder the note is in.
        if scope == nil { scope = Scope.opening(note) }
        #endif
        justCreated = note.id
        selectedNote = note.id
    }

    /// A note the iPhone folders screen's search found: its folder opens under it, as for a new
    /// note, so back leads through the folder to the search.
    private func openFound(_ id: UUID) {
        guard let note = context.note(id), note.deletedAt == nil else { return }
        scope = Scope.opening(note)
        selectedNote = id
    }

    /// Leaving a blank note deletes it, like Apple Notes.
    private func discardIfEmpty(_ id: UUID?) {
        guard let id, id != selectedNote, let n = context.note(id), n.deletedAt == nil,
              n.body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        context.purge(n)
    }

    /// Test runs can open a note by title: `-uitest -open "Lisbon"`.
    private func openFromLaunchArguments() {
        let args = ProcessInfo.processInfo.arguments
        guard args.contains("-uitest"), let i = args.firstIndex(of: "-open"), i + 1 < args.count else { return }
        let title = args[i + 1]
        #if os(macOS)
        // Website and store captures: `-uitest -demo -importSheet` opens the import sheet over made-up Apple Notes.
        if args.contains("-demo"), args.contains("-importSheet") { DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { showImport = true } }
        #endif
        if title == "-new" { DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { newNote() }; return }
        let all = (try? context.fetch(FetchDescriptor<Note>())) ?? []
        if let n = all.first(where: { $0.title == title && $0.deletedAt == nil }) {
            selectedNote = n.id
        } else if let f = context.folderFiles().first(where: { $0.filename == title }), let folder = f.folderID {
            // A file kept in a folder, by its name: its folder's list, with the file open.
            scope = .folder(folder)
            selectedNote = f.id
        }
        // `-folder "To read"`: that folder's list.
        if let j = args.firstIndex(of: "-folder"), j + 1 < args.count, let f = context.allFolders().first(where: { $0.name == args[j + 1] }) {
            scope = .folder(f.id)
        }
    }

    /// Shows a note asked for from outside the window, switching to All Notes if it isn't in view.
    private func reveal(_ id: UUID?) {
        guard let id, let note = context.note(id), note.deletedAt == nil else { return }
        NoteOpener.shared.request = nil
        if note.trashedAt != nil { scope = .trash } else if case .folder(let f) = scope, note.folder?.id == f {} else { scope = .all }
        selectedNote = id
    }

    /// Reopen the note you were on; otherwise the one you edited last.
    private func restoreNote() {
        guard selectedNote == nil, !ProcessInfo.processInfo.arguments.contains("-uitest") else { return }
        // A file kept in a folder reopens like a note.
        if let id = UUID(uuidString: lastNote), let f = context.attachment(id), f.folderID != nil, f.deletedAt == nil, f.trashedAt == nil {
            selectedNote = id
            return
        }
        if let n = context.noteToReopen(last: UUID(uuidString: lastNote)) { selectedNote = n.id }
    }

    private func restoreScope() {
        #if os(iOS)
        // Captures: `-uitest -showFolders` stays on the folder list.
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-uitest"), args.contains("-showFolders") { return }
        #endif
        if let s = try? JSONDecoder().decode(Scope.self, from: lastScopeData),
           !({ if case .folder(let id) = s { return context.folder(id) == nil } else { return false } }()) {
            scope = s
        } else if scope == nil {
            scope = .all
        }
    }
}

/// What the note pane shows with several notes selected, as in Notes.
struct MultipleSelectionView: View {
    let count: Int
    /// Files are among them.
    var items = false

    var body: some View {
        Text(items ? "\(count) Items Selected" : "\(count) Notes Selected")
            .font(.title3)
            .foregroundStyle(.secondary)
            .monospacedDigit()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityIdentifier("detail.multiple")
    }
}

struct EmptyDetailView: View {
    var body: some View {
        VStack(spacing: 10) {
            AppMark(size: 44)
            Text("No note selected")
                .font(.callout)
                .foregroundStyle(Color.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// The import actions, for the folders and the note list. They come through the environment, not
/// the scene's focused values: those change whenever a view that publishes one updates (the open
/// note does on every save while you type), and each change rebuilt the folders and the list again.
struct ImportActions {
    var appleNotes: () -> Void
    var from: (ImportKind) -> Void
}

extension EnvironmentValues {
    @Entry var importActions: ImportActions? = nil
}

// MARK: Focused actions for menus and shortcuts

private struct NewNoteActionKey: FocusedValueKey {
    typealias Value = () -> Void
}

private struct DeleteNoteActionKey: FocusedValueKey {
    typealias Value = () -> Void
}

private struct ImportActionKey: FocusedValueKey {
    typealias Value = () -> Void
}

private struct ImportFromActionKey: FocusedValueKey {
    typealias Value = (ImportKind) -> Void
}

private struct EditorControllerKey: FocusedValueKey {
    typealias Value = EditorController
}

private struct ShowHistoryActionKey: FocusedValueKey {
    typealias Value = () -> Void
}

extension FocusedValues {
    var newNoteAction: (() -> Void)? {
        get { self[NewNoteActionKey.self] }
        set { self[NewNoteActionKey.self] = newValue }
    }
    var deleteNoteAction: (() -> Void)? {
        get { self[DeleteNoteActionKey.self] }
        set { self[DeleteNoteActionKey.self] = newValue }
    }
    var importAction: (() -> Void)? {
        get { self[ImportActionKey.self] }
        set { self[ImportActionKey.self] = newValue }
    }
    /// File › Import from Evernote…, Import Markdown or Text…
    var importFromAction: ((ImportKind) -> Void)? {
        get { self[ImportFromActionKey.self] }
        set { self[ImportFromActionKey.self] = newValue }
    }
    var editorController: EditorController? {
        get { self[EditorControllerKey.self] }
        set { self[EditorControllerKey.self] = newValue }
    }
    /// File › Version History… for the open note.
    var showHistoryAction: (() -> Void)? {
        get { self[ShowHistoryActionKey.self] }
        set { self[ShowHistoryActionKey.self] = newValue }
    }
}

#if os(macOS)
struct PaneCommands: Commands {
    @FocusedValue(\.newNoteAction) private var newNote
    @FocusedValue(\.deleteNoteAction) private var deleteNote
    @FocusedValue(\.editorController) private var editor
    @FocusedValue(\.importAction) private var importNotes
    @FocusedValue(\.importFromAction) private var importFrom
    @FocusedValue(\.showHistoryAction) private var showHistory

    var body: some Commands {
        // Settings shows as a sheet on the notes window in front, like WhatsApp's.
        CommandGroup(replacing: .appSettings) {
            Button("Settings\u{2026}") { SettingsRoute.shared.show() }
                .keyboardShortcut(",")
        }
        CommandGroup(replacing: .newItem) {
            Button("New Note") { newNote?() }
                .keyboardShortcut("n")
                .disabled(newNote == nil)
            // ⇧⌘N is New Folder in Notes and Finder.
            Button("New Folder") { NotificationCenter.default.post(name: .paneNewFolder, object: nil) }
                .keyboardShortcut("n", modifiers: [.command, .shift])
                .disabled(newNote == nil)
            Button("New App…") { NewApp.shared.open() }
                .disabled(newNote == nil || !NoteApps.enabled)
            Divider()
            // ⌘K is Add Link, as in Notes. ⌘O is where Open would be, and Obsidian's quick switcher.
            Button("Go to Note…") { NotificationCenter.default.post(name: .paneQuickOpen, object: nil) }
                .keyboardShortcut("o")
                .disabled(newNote == nil)
        }
        // Where Pages keeps Browse All Versions: File, after saving.
        CommandGroup(after: .saveItem) {
            Button(NoteMoreMenu.historyTitle) { showHistory?() }
                .disabled(showHistory == nil)
        }
        CommandGroup(after: .help) {
            // The website's changes page: release notes are never shown in the app by themselves.
            Button("\(WhatsNew.title)\u{2026}") { NSWorkspace.shared.open(WhatsNew.changelogURL) }
            Button("Show Setup Guide") { NotificationCenter.default.post(name: .paneReplayOnboarding, object: nil) }
        }
        CommandGroup(replacing: .importExport) {
            // Not inside Settings: a home anyone finds, beside Import.
            Button("Connect an AI\u{2026}") { NotificationCenter.default.post(name: .paneConnectAI, object: nil) }
            Divider()
            Button { importNotes?() } label: { Label { Text("Import from Apple Notes…") } icon: { ImportOrigin.appleNotes.menuImage } }
                .disabled(importNotes == nil)
            ForEach(ImportKind.listed) { kind in
                Button { importFrom?(kind) } label: { Label { Text(kind.menuTitle) } icon: { ImportOrigin.files(kind).menuImage } }
                    .disabled(importFrom == nil)
            }
            Divider()
            Button("Attach File…") { editor?.attach() }
                .keyboardShortcut("a", modifiers: [.command, .shift])
                .disabled(editor == nil)
        }
        CommandGroup(after: .pasteboard) {
            Divider()
            // No shortcut: ⌘⌫ belongs to the text (delete to the start of the line).
            Button("Delete Note") { deleteNote?() }
                .disabled(deleteNote == nil)
        }
        // Shortcuts follow Apple Notes, so muscle memory carries over.
        CommandMenu("Format") {
            Group {
                Button("Title") { editor?.heading(1) }.keyboardShortcut("t", modifiers: [.command, .shift])
                Button("Heading") { editor?.heading(2) }.keyboardShortcut("h", modifiers: [.command, .shift])
                Button("Subheading") { editor?.heading(3) }.keyboardShortcut("j", modifiers: [.command, .shift])
                Button("Body") { editor?.heading(0) }.keyboardShortcut("b", modifiers: [.command, .shift])
                Divider()
                Button("Bold") { editor?.bold() }.keyboardShortcut("b")
                Button("Italic") { editor?.italic() }.keyboardShortcut("i")
                Button("Underline") { editor?.underline() }.keyboardShortcut("u")
                Button("Strikethrough") { editor?.strikethrough() }.keyboardShortcut("x", modifiers: [.command, .shift])
                Button("Monostyled") { editor?.code() }.keyboardShortcut("m", modifiers: [.command, .shift])
                Divider()
                Button("Checklist") { editor?.checklist() }.keyboardShortcut("l", modifiers: [.command, .shift])
                Button("Bulleted List") { editor?.bulletList() }.keyboardShortcut("7", modifiers: [.command, .shift])
                Button("Dashed List") { editor?.dashedList() }.keyboardShortcut("8", modifiers: [.command, .shift])
                Button("Numbered List") { editor?.numberedList() }.keyboardShortcut("9", modifiers: [.command, .shift])
                Button("Block Quote") { editor?.blockQuote() }.keyboardShortcut("'", modifiers: .command)
                Divider()
                Button("Table") { editor?.insertTable() }.keyboardShortcut("t", modifiers: [.command, .option])
                Button("Link") { editor?.insertLink() }.keyboardShortcut("k")
            }
            .disabled(editor == nil)
        }
    }
}
#endif

#if os(iOS)
/// Whether an alert or sheet is up in any of the app's windows.
@MainActor
enum Presentation {
    static var isActive: Bool {
        UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .contains { $0.rootViewController?.presentedViewController != nil }
    }
}
#endif
