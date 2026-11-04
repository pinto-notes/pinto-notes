import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// Three columns, like Apple Notes: folders, notes, the note.
struct RootView: View {
    @Environment(\.modelContext) private var context
    @Environment(OnboardingStore.self) private var onboarding: OnboardingStore?
    @Environment(\.behindSetupCard) private var behindSetupCard
    #if os(iOS)
    /// On iPhone a folder is pushed once the first layout is done (see `lifecycle`).
    @State private var scope: Scope?
    #else
    @State private var scope: Scope? = .all
    #endif
    /// The list's selection; one note opens in the editor, several show a summary like Notes.
    @State private var selection: Set<UUID> = []
    @State private var visibility: NavigationSplitViewVisibility = .all
    #if os(iOS)
    /// The open notes, for the list beside the note to draw (OpenNotes).
    @State private var openNotes = OpenNotes()
    /// The window's size, for the two layouts the columns can't choose by width class alone.
    @State private var windowSize: CGSize = .zero
    /// iPhone Duo open like a book (about 951 × 669 pt): half the window, so the list ends at the fold.
    private var bookHalf: CGFloat? {
        guard sizeClass != .compact, windowSize.width > windowSize.height, windowSize.width < 1000 else { return nil }
        return (windowSize.width / 2).rounded(.down)
    }
    /// Columns too narrow to share: an upright window under 760 pt (the Duo upright, about 669).
    private var noteFirst: Bool {
        sizeClass != .compact && windowSize.width > 0 && windowSize.width < 760 && windowSize.width <= windowSize.height
    }
    #endif
    @State private var editor = EditorController()
    /// The library's notes as the list keeps them, for the list and the sidebar's folder counts.
    @State private var library = LibraryNotes()
    /// Every tag in the library, for the sidebar's Tags and the tags offered while one is typed.
    @State private var tags = TagIndex()
    @State private var justCreated: UUID?
    #if os(iOS)
    /// The notes links opened, for Back to the note or app a link was in.
    @State private var trail = LinkTrail()
    #else
    /// The notes opened, for Back and Forward over the note.
    @State private var history = OpenedNotes()
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
    @State private var pendingSharedDelete: [Note]?
    /// Files the import sheet opens with (shared, opened from Files, dropped on the app).
    @State private var importFiles: [URL] = []
    @AppStorage("lastScope") private var lastScopeData: Data = Data()
    /// Files that weren't added (a kind the app can't show, or over 100 MB), said once.
    @State private var refusal: FileRefusal?
    /// Connect an AI, from the File menu, the list's menu or the card at the foot of the sidebar.
    @State private var connectingAI = false
    #if os(macOS)
    /// Import notes or Connect an AI, as the first run's card over the notes (Mac).
    @State private var popup: SetupCardsFlow.Only?
    /// Keyboard Shortcuts, open (nil: closed).
    @State private var shortcuts: [Shortcuts.Group]?
    #endif
    /// The import actions handed to the folders and the list: one box for the window's life (ImportActions).
    @State private var importBox = ImportActions.Box()
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

    /// What the note pane shows: the selection, from the press on its row (PressSelect).
    private var shown: Set<UUID> { selection }
    private var shownNote: UUID? { shown.count == 1 ? shown.first : nil }

    var body: some View {
        #if DEBUG
        RenderProbe.count("RootView", context: context)
        #endif
        return popups(imports(lifecycle(split)).newAppSheet())
            // Reports: the notes are on screen, for the cold launch time (Telemetry).
            .onAppear { Telemetry.shared.notesShown() }
            .focusedSceneValue(\.newNoteAction, newNote)
            .focusedSceneValue(\.editorController, editor)
            .focusedSceneValue(\.importAction, { showImport = true })
            .focusedSceneValue(\.importFromAction, { kind in importFiles = []; importing = kind })
            .focusedSceneValue(\.deleteNoteAction, deleteAction)
            // A template or shared note to add, from a link.
            .noteSourceHandler()
            // Today's Note, from the calendar button and the menus, in this window (DailyNotes).
            .environment(\.todaysNote, TodaysNoteAction(open: openTodaysNote))
            .focusedSceneValue(\.todaysNote, TodaysNoteAction(open: openTodaysNote))
            .sheet(isPresented: $connectingAI, onDismiss: { Task { await setupStore?.refresh(force: true) } }) {
                if let client = backendForConnect?.client { ConnectAISheet(client: client) }
            }
            .sharedDeleteConfirmation($pendingSharedDelete) { removeNow($0) }
            .onReceive(NotificationCenter.default.publisher(for: FileRefusal.notification)) { n in refusal = n.object as? FileRefusal }
            .alert(refusal?.title ?? "", isPresented: Binding(get: { refusal != nil }, set: { if !$0 { refusal = nil } })) {
                Button("OK") {}
            } message: { Text(refusal?.message ?? "") }
            #if os(iOS)
            .alert("Launch alert", isPresented: $launchAlert) { Button("OK", role: .cancel) {} }
            #endif
    }

    /// Connect an AI, and on the Mac the panel and the popups over the notes (apart, so the
    /// compiler can check the body in time).
    private func popups(_ content: some View) -> some View {
        content
            .onReceive(NotificationCenter.default.publisher(for: .paneConnectAI)) { _ in
                #if os(macOS)
                openPopup(.connectAI)
                #else
                connectingAI = true
                #endif
            }
            #if os(macOS)
            .onReceive(NotificationCenter.default.publisher(for: .paneQuickOpen)) { _ in
                quickOpen = quickOpen == nil ? QuickOpen.noteItems(in: context) : nil
            }
            .overlay(alignment: .top) { quickOpenPanel }
            .modifier(ExportAllNotes())
            .onReceive(NotificationCenter.default.publisher(for: .paneTemplates)) { _ in openTemplates() }
            .onReceive(NotificationCenter.default.publisher(for: .paneImportNotes)) { _ in openPopup(.importNotes) }
            // Every popup a sheet on this window (popupSheet).
            .sheet(isPresented: Binding(get: { templateAIs != nil }, set: { if !$0 { templateAIs = nil } })) {
                if let ais = templateAIs { templates(ais).popupSheet("templates") }
            }
            // One sheet for Import and Connect an AI: asking for the other swaps what it shows.
            .sheet(isPresented: Binding(get: { popup != nil }, set: { if !$0 { popup = nil } })) {
                if let popup { popupCard(popup).popupSheet(popup.rawValue) }
            }
            // Help › Keyboard Shortcuts, read from the menu bar as it is when asked.
            .onReceive(NotificationCenter.default.publisher(for: .paneShowShortcuts)) { _ in
                shortcuts = Shortcuts.groups(in: NSApp.mainMenu)
            }
            .sheet(isPresented: Binding(get: { shortcuts != nil }, set: { if !$0 { shortcuts = nil } })) {
                if let shortcuts { ShortcutsSheet(groups: shortcuts) { self.shortcuts = nil }.popupSheet("shortcuts") }
            }
            // Settings: a card over the notes, like Templates, on the window in front.
            .settingsCard(backend: backendForConnect, sync: syncForSettings, opening: { templateAIs = nil; popup = nil })
            #endif
    }

    #if os(macOS)
    /// Templates over the notes, with the AIs to make them with (nil: closed).
    @State private var templateAIs: [SetupCards.AI]?
    @Environment(\.openURL) private var openURLForTemplates

    private func openTemplates() {
        Task {
            var rows: [Connection] = []
            if let client = backendForConnect?.client {
                rows = (try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value) ?? []
            }
            withAnimation(.snappy(duration: 0.2)) { popup = nil; templateAIs = TemplateMaking.ais(rows) }
        }
    }

    @Environment(SyncEngine.self) private var syncForSettings: SyncEngine?

    /// One of the first run's cards, as a sheet; Cancel or Escape closes it.
    @ViewBuilder private func popupCard(_ only: SetupCardsFlow.Only) -> some View {
        if let backend = backendForConnect {
            let close = { withAnimation(.snappy(duration: 0.2)) { popup = nil } }
            SetupCardsFlow(store: nil, backend: backend, setup: setupStore, only: only, finish: { _ in
                close()
                Task { await setupStore?.refresh(force: true) }
            })
            .id(only)
            .fixedSize(horizontal: false, vertical: true)
            .onExitCommand(perform: close)
        }
    }

    private func openPopup(_ only: SetupCardsFlow.Only) {
        withAnimation(.snappy(duration: 0.2)) {
            templateAIs = nil
            popup = only
        }
    }

    private func templates(_ ais: [SetupCards.AI]) -> some View {
        TemplateLibraryView(ais: ais, make: { e, ai in
            Task {
                let note = await TemplateMaking.make(e, with: ai, context: context, account: backendForConnect?.userID, open: { openURLForTemplates($0) })
                // Another AI: Copied shows on the panel a moment before it closes.
                if !ai.asks { try? await Task.sleep(for: .seconds(0.9)) }
                withAnimation(.snappy(duration: 0.2)) { templateAIs = nil }
                if let note { selection = [note] }
            }
        }, close: { withAnimation(.snappy(duration: 0.2)) { templateAIs = nil } })
        .onExitCommand { withAnimation(.snappy(duration: 0.2)) { templateAIs = nil } }
    }
    #endif

    /// The same value on every pass. The closures only set this window's state, so the ones from
    /// any pass do what new ones would; they're put in the box again, which nothing observes.
    private var importActions: ImportActions {
        importBox.appleNotes = { showImport = true }
        importBox.from = { kind in importFiles = []; importing = kind }
        return ImportActions(box: importBox)
    }

    private var split: some View {
        Group {
            #if os(iOS)
            if sizeClass != .compact { twoColumns } else { threeColumns }
            #else
            threeColumns
            #endif
        }
        .environment(editor)
        .environment(\.importActions, importActions)
        #if os(iOS)
        .onChange(of: selection, initial: true) { _, now in if openNotes.ids != now { openNotes.ids = now } }
        // Whether the window shows one screen at a time (iPhone, iPhone Duo closed, a narrow iPad
        // window) or the columns side by side. The columns themselves can't tell: inside the split
        // view each reports a compact width, even on a 13-inch iPad.
        .environment(\.stackedNotes, sizeClass == .compact)
        .modifier(NoteFirstStyle(on: noteFirst))
        .onGeometryChange(for: CGSize.self) { $0.size } action: { windowSize = $0 }
        // Columns too narrow to share (the Duo held upright, an iPad mini upright): one screen at
        // a time, as on the iPhone (twoColumns).
        .onChange(of: noteFirst, initial: true) { _, on in
            if on { visibility = selectedNote == nil ? .doubleColumn : .detailOnly } else if sizeClass != .compact { visibility = .all }
        }
        .onChange(of: selectedNote) { _, id in
            if noteFirst, id != nil { visibility = .detailOnly }
        }
        #endif
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

    #if os(iOS)
    /// iPad and iPhone Duo open: the iPhone's own screens on the left, the folders with the notes'
    /// list pushed over them and Back between the two, and the note on the right (Emil, 3 November
    /// 2026: three columns looked like a different app from the iPhone).
    private var twoColumns: some View {
        // Not a split view: its sidebar is a floating glass panel that greys the iPhone's white
        // cards, and it decides itself when the left side shows.
        let listOpen = visibility != .detailOnly
        // Columns too narrow to share (the Duo held upright, an iPad mini upright): one screen at a
        // time, as on the iPhone. The list fills the window, a note opens over it, and Back
        // closes the note (Emil, 3 November 2026: the list slid over a greyed window).
        let listAlone = noteFirst && (selection.isEmpty || openNotes.editing)
        return ZStack(alignment: .leading) {
            HStack(spacing: 0) {
                if listOpen && !noteFirst {
                    phoneScreens
                        .frame(width: leftWidth)
                        .transition(.move(edge: .leading))
                    Rectangle().fill(Color(uiColor: .separator)).frame(width: 1 / 3).ignoresSafeArea()
                }
                NavigationStack {
                    detail
                        .toolbar {
                            ToolbarItem(placement: .topBarLeading) {
                                if noteFirst {
                                    Button("Back", systemImage: "chevron.backward") {
                                        withAnimation(.snappy(duration: 0.3)) { selection = [] }
                                    }
                                    .accessibilityIdentifier("columns.back")
                                } else if !listOpen {
                                    Button("Show Notes", systemImage: "sidebar.left") {
                                        withAnimation(.snappy(duration: 0.3)) { visibility = .all }
                                    }
                                    .accessibilityIdentifier("columns.showNotes")
                                } else {
                                    Button("Hide Notes", systemImage: "sidebar.left") {
                                        withAnimation(.snappy(duration: 0.3)) { visibility = .detailOnly }
                                    }
                                    .accessibilityIdentifier("columns.hideNotes")
                                }
                            }
                            // Where the note is, beside the list button: a folder opens on the left.
                            if let id = shownNote, let note = context.note(id), note.deletedAt == nil {
                                ToolbarItem(placement: .topBarLeading) {
                                    NoteBreadcrumbs(note: note) { s in
                                        withAnimation(.snappy(duration: 0.3)) {
                                            scope = s
                                            if noteFirst { selection = [] } else { visibility = .all }
                                        }
                                    }
                                }
                                .sharedBackgroundVisibility(.hidden)
                            }
                        }
                }
            }
            if listAlone {
                phoneScreens.transition(.move(edge: .leading))
            }
        }
    }

    /// The left side's width: the half of a Duo open like a book, so the fold runs between the
    /// list and the note; otherwise about an iPhone's width.
    private var leftWidth: CGFloat {
        if let bookHalf { return bookHalf }
        let base = min(max(windowSize.width * 0.34, 320), 420)
        return typeSize.isAccessibilitySize ? min(base + 40, 460) : base
    }

    /// The iPhone's screens: the folders, with a folder's notes pushed over them.
    private var phoneScreens: some View {
        NavigationStack {
            SidebarView(scope: $scope, onNewNote: newNote, onOpenNote: openFound, onNewNoteIn: newNote(inFolder:))
                .equatable()
                .environment(library)
                .phoneScreen()
                .navigationDestination(item: $scope) { s in
                    NoteListView(scope: s, selection: $selection, onNewNote: newNote)
                        .equatable()
                        .environment(library)
                        .environment(openNotes)
                        .phoneScreen()
                }
        }
        .environment(\.sideWidth, noteFirst ? windowSize.width : leftWidth)
    }
    #endif

    private var threeColumns: some View {
        NavigationSplitView(columnVisibility: $visibility) {
            // The folders and the list are compared before they're worked out again (see their `==`):
            // on the Mac the split view hands its columns over again whenever one is hidden or shown,
            // and on iPhone every pass of this view (each note opened or closed) worked out the
            // folders under the stack and the list again (ios-render-audit-2026-11-02.md).
            SidebarView(scope: $scope, onNewNote: newNote, onOpenNote: openFound, onNewNoteIn: newNote(inFolder:))
                .equatable()
                .environment(library)
                .environment(tags)
                #if os(macOS)
                // No sidebar button (Emil, 10-29), and no way to hide it at all (11-01): it can't
                // collapse (SidebarPin; the split view's own ⌃⌘S does nothing), and the window can't
                // get narrower than the three columns. At its narrowest it still has room for New
                // Folder, Today and Search beside the window's buttons (10-31).
                .toolbar(removing: .sidebarToggle)
                .background(SidebarPin())
                .navigationSplitViewColumnWidth(min: 240, ideal: 260, max: 360)
                #else
                // iPad: room for the title beside the account button.
                .navigationSplitViewColumnWidth(min: 264, ideal: 270, max: 400)
                #endif
        } content: {
            NoteListView(scope: scope ?? .all, selection: $selection, onNewNote: newNote)
                .equatable()
                .environment(library)
                #if os(macOS)
                .navigationSplitViewColumnWidth(min: 260, ideal: 330, max: 440)
                #else
                // Large text needs the room more here than in the note beside it.
                // A window wider than tall and under 1,000 pt (iPhone Duo open like a book): the list is
                // the left half and the note the right, so the fold runs between them, not through
                // the note's text (Emil, 3 November 2026).
                .navigationSplitViewColumnWidth(min: bookHalf ?? (typeSize.isAccessibilitySize ? 340 : 260),
                                                ideal: bookHalf ?? (typeSize.isAccessibilitySize ? 380 : 310),
                                                max: bookHalf ?? 420)
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
                .overlay(alignment: .leading) { ColumnHairline() }
                #endif
        }
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
                               close: { quickOpen = nil },
                               searchText: { [container = context.container] q in await QuickOpen.textHits(for: q, in: container) })
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
                case .todaysNote: openTodaysNote()
                case .newFolder: NotificationCenter.default.post(name: .paneNewFolder, object: nil)
                case .togglePin: if let id = selectedNote, let n = context.note(id) { context.togglePin(n) }
                case .move: NotificationCenter.default.post(name: .paneMoveNote, object: nil)
                case .importAppleNotes: showImport = true
                case .importFrom(let kind): importFiles = []; importing = kind
                case .exportNotes: NotificationCenter.default.post(name: .paneExportNotes, object: nil)
                case .connectAI:
                    #if os(macOS)
                    openPopup(.connectAI)
                    #else
                    connectingAI = true
                    #endif
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
                wireTags()
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
                #if os(macOS)
                // Another folder: a note that isn't in its list closes, so the note side never
                // shows one the list doesn't (Emil, 3 November 2026: a deleted note stayed open
                // beside Notes, its Recover banner over nothing).
                if let new, let id = selectedNote, let note = context.note(id),
                   ModelContext.lists(new, note) == false { selection = [] }
                #endif
                #if os(iOS)
                // Back on the iPhone folder list nothing is open: a note left selected would keep
                // its toolbar on this screen. Leaving an empty new note this way discards it. Beside
                // the note (iPad, iPhone Duo open) the note stays while the folders show.
                if new == nil, sizeClass == .compact, !selection.isEmpty { selection = [] }
                #endif
            }
            .onChange(of: selectedNote) { old, new in noteChanged(from: old, to: new) }
            #if os(iOS)
            // Folded with the folders showing beside an open note: on the one screen the note
            // sits on its list, as on iPhone, not over the folders.
            .onChange(of: sizeClass) { _, now in
                if now == .compact, scope == nil, let id = selectedNote, let note = context.note(id) { scope = Scope.opening(note) }
            }
            #endif
            // The first-run flow just ended: the notes open on what it left ready.
            .task(id: onboarding?.landing) { openLanding() }
            // A note opened from the menu bar.
            .onChange(of: NoteOpener.shared.request) { _, id in reveal(id) }
            // From the onboarding emails: ambernotes.app/open/import and /open/history.
            .onChange(of: AppPlaceCenter.shared.pending, initial: true) { _, place in openPlace(place) }
            .modifier(AIChangesPresenter())
            #if os(iOS)
            .alert("Import on your Mac", isPresented: $importOnMac) {
                Button("OK") {}
            } message: { Text("To bring everything at once, use Import from Apple Notes in Pinto Notes on your Mac. It syncs here a second later.") }
            #endif
    }

    /// A tag clicked in a note shows its notes, and typing one offers the library's tags.
    private func wireTags() {
        let context = self.context
        let tags = self.tags
        editor.suggestTags = { typed in tags.suggestions(typed, in: context) }
        editor.openTag = { name in showTag(name) }
    }

    /// The notes with a tag, in the list. On the Mac the note stays open beside them (it has the
    /// tag, so it's in the list); on iPhone the list comes back into view.
    private func showTag(_ name: String) {
        scope = .tag(tags.listedName(name, in: context))
        #if os(iOS)
        if sizeClass == .compact { selection = [] }
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
        // A spare web view waiting to start waits on: starting one lands in the next open or Back.
        NotePageSandbox.navigationOccurred()
        #if os(iOS)
        trail.opened(new)
        #else
        history.opened(from: old, to: new)
        #endif
    }

    #if os(macOS)
    private func isGone(_ id: UUID) -> Bool { context.note(id).map { $0.deletedAt != nil } ?? true }

    /// Back and Forward over the note, like a browser (Emil, 11-01).
    private var historyActions: OpenedNotes.Actions {
        OpenedNotes.Actions(notes: history,
                            back: { stepHistory(back: true) }, forward: { stepHistory(back: false) })
    }
    private func stepHistory(back: Bool) {
        var instant = Transaction(animation: nil)
        instant.disablesAnimations = true
        withTransaction(instant) {
            let target = back ? history.back(from: selectedNote, gone: isGone) : history.forward(from: selectedNote, gone: isGone)
            if let target { selectedNote = target }
        }
    }
    #endif

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
        // A shared note asks first: people lose it, or it leaves your notes.
        if SharedDelete.ask(notes) != nil { pendingSharedDelete = notes; return }
        removeNow(notes)
    }

    private func removeNow(_ notes: [Note]) {
        withAnimation(.snappy(duration: 0.25)) {
            context.remove(notes)
            selection = []
        }
    }

    @ViewBuilder
    private var detail: some View {
        #if os(macOS)
        if let id = shownNote, let file = context.attachment(id), file.folderID != nil, file.deletedAt == nil {
            // A file kept in the folder: its preview.
            FileDetailView(file: file, onNewNote: newNote, onOpenFile: { selectedNote = $0 })
                .id(id)
        } else {
            // Keep the stage across selections. Native toolbar visibility hides the items and
            // their glass without rebuilding the controls when a note opens again.
            let note = shownNote.flatMap { context.note($0) }.flatMap { $0.deletedAt == nil ? $0 : nil }
            NoteToolbarStage(showsItems: note != nil,
                             showsWriting: note.map { ($0.isLocked || NoteApps.page($0.id) == nil) && $0.trashedAt == nil } ?? false,
                             history: historyActions, controller: editor, place: note,
                             openScope: { s in
                                 scope = s
                                 if visibility == .detailOnly { visibility = .doubleColumn }
                             }) {
                if let note {
                    NoteDetailView(note: note, controller: editor, autofocus: justCreated == note.id, onNewNote: newNote) { target, edit in
                        if edit { justCreated = target }
                        selectedNote = target
                    }
                        .id(note.id)
                } else {
                    noNote
                }
            }
        }
        #else
        if let id = shownNote, let note = context.note(id), note.deletedAt == nil {
            NoteDetailView(note: note, controller: editor, autofocus: justCreated == id, onNewNote: newNote) { target, edit in
                if edit { justCreated = target }
                trail.followed(from: selectedNote, to: target)
                selectedNote = target
            }
                .id(id)
                .modifier(LinkBackButton(title: trail.previous.flatMap { context.note($0) }.flatMap { $0.deletedAt == nil ? $0.title : nil }, back: goBack))
        } else if let id = shownNote, let file = context.attachment(id), file.folderID != nil, file.deletedAt == nil {
            // A file kept in the folder: its preview.
            FileDetailView(file: file, onNewNote: newNote, onOpenFile: { selectedNote = $0 })
                .id(id)
        } else {
            noNote
        }
        #endif
    }

    /// The note pane with no note: several selected, or none.
    private var noNote: some View {
        let content = Group {
            if shown.count > 1 {
                MultipleSelectionView(count: shown.count, items: shown.contains { context.attachment($0) != nil })
            } else if !behindSetupCard {
                EmptyDetailView()
            } else {
                Color.clear
            }
        }
        #if os(macOS)
        // Under the toolbar, a column with nothing that scrolls gets the window's grey title bar
        // (a "hard pocket") across its top. A scroll view behind the page, which never scrolls,
        // takes the toolbar's soft edge instead, so the page's ground runs up under the toolbar
        // as it does under a note, and in Notes.
        return content
            .background {
                SoftToolbarEdge().ignoresSafeArea()
            }
            .background(Color.notePage.ignoresSafeArea())
        #else
        return content.background(Color.notePage.ignoresSafeArea())
        #endif
    }

    private func newNote() {
        let target: Scope = scope == .trash ? .all : (scope ?? .all)
        if scope == .trash { scope = .all }
        // Reuse an untouched empty note instead of stacking blanks.
        if scope != nil, let id = selectedNote, Self.reusesForNewNote(context.note(id)) {
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

    /// Whether New Note opens this note instead of making another: an untouched empty note that is
    /// in a folder you can see. A blank note without a live folder is in no list, and New Note
    /// reusing it made nothing at all (Emil, 3 November 2026, with every folder deleted).
    static func reusesForNewNote(_ n: Note?) -> Bool {
        guard let n, n.body.isEmpty, n.trashedAt == nil, n.deletedAt == nil, let folder = n.folder else { return false }
        return folder.deletedAt == nil
    }

    /// New Note from a folder's menu: a note in that folder, the folder selected and the note open
    /// with the cursor in it (on iPhone the folder's list opens under it, as for any new note).
    static func newNote(inFolder id: UUID, context: ModelContext) -> (scope: Scope, note: UUID) {
        let note = context.createNote(in: .folder(id))
        return (Scope.opening(note), note.id)
    }

    private func newNote(inFolder id: UUID) {
        let made = Self.newNote(inFolder: id, context: context)
        Telemetry.shared.record(.firstNoteCreated)
        scope = made.scope
        justCreated = made.note
        selectedNote = made.note
    }

    /// Today's note, made if it isn't yet, open with the cursor in it. The list shows it where
    /// it is: the folder you're in if it's there, else Daily.
    private func openTodaysNote() {
        let (note, made) = context.openTodaysNote()
        if made { Telemetry.shared.record(.firstNoteCreated) }
        let shown: Bool
        switch scope {
        case .all?: shown = true
        case .folder(let f)?: shown = note.folder?.id == f
        default: shown = false
        }
        if !shown { scope = Scope.opening(note) }
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
        #if os(macOS)
        // Let the destination's first frame commit before saving and diffing the list. A main
        // queue block can run before that commit; a run-loop timer follows it.
        let timer = Timer(timeInterval: 0.001, repeats: false) { _ in
            MainActor.assumeIsolated {
                guard id != selectedNote, let note = context.note(id), note.deletedAt == nil,
                      note.body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
                library.discardEmpty(note, in: context)
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        #else
        context.purge(n)
        #endif
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
    private func reveal(_ id: UUID?, waited: Int = 0) {
        guard let id, let note = context.note(id), note.deletedAt == nil else { return }
        NoteOpener.shared.request = nil
        #if os(iOS)
        // One screen at a time, UIKit drops a push made while an alert is up or still closing,
        // yet the note stays selected: Join on a shared note's link left its row chosen in All
        // Notes and the note unopened. It opens once the alert has gone.
        if Presentation.waitsToOpen(compact: sizeClass == .compact, presenting: Presentation.isActive, waited: waited) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { reveal(id, waited: waited + 1) }
            return
        }
        #endif
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
        // Words only, like Notes (Emil, 11-03: no app icon on the empty states).
        VStack(spacing: 10) {
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
/// Equal whatever its closures: they only set the window's own state, so one made on an earlier
/// pass does what a new one would. As closures they counted as changed on every pass of RootView,
/// and every view that reads them (the sidebar and the note list) was worked out again on each
/// note open, seven times per open (NoteOpenProfile, 2026-11-02).
///
/// Being Equatable wasn't enough: the environment compares a new value with the old one bit by bit,
/// and two closures made on two passes never match, so the folders and the note list still read
/// `importActions` as changed on every pass of RootView (iPhone, 2026-11-02: both worked out again
/// on every note opened, ios-render-audit-2026-11-02.md). The closures now live in one box the
/// window keeps, and the value handed down is only that box: the same bits on every pass.
struct ImportActions: Equatable {
    @MainActor final class Box {
        var appleNotes: () -> Void = {}
        var from: (ImportKind) -> Void = { _ in }
    }
    let box: Box
    @MainActor var appleNotes: () -> Void { box.appleNotes }
    @MainActor var from: (ImportKind) -> Void { box.from }

    init(box: Box) { self.box = box }

    @MainActor init(appleNotes: @escaping () -> Void, from: @escaping (ImportKind) -> Void) {
        let box = Box()
        box.appleNotes = appleNotes
        box.from = from
        self.box = box
    }

    static func == (a: ImportActions, b: ImportActions) -> Bool { a.box === b.box }
}

extension EnvironmentValues {
    /// iOS: the notes show one screen at a time (a stack), not as columns. Set by RootView from
    /// the window's width class; read this, not `horizontalSizeClass`, inside the columns.
    @Entry var stackedNotes = true
    /// iOS: the iPhone's screens beside the note (iPad, iPhone Duo open), where a note stays selected.
    @Entry var besideNote = false
    /// The left side's width, for the search field drawn in its bottom bar (BarSearchField).
    @Entry var sideWidth: CGFloat = 0
    @Entry var importActions: ImportActions? = nil
}

#if os(iOS)
/// The open notes, read by the list beside the note (iPad, iPhone Duo open), which draws the open
/// one itself. An object, so the rows follow it while the list is compared by its folder only
/// (NoteListView's `==`).
@Observable final class OpenNotes {
    var ids: Set<UUID> = []
    /// The list is picking notes (Select): its selection isn't a note to open.
    var editing = false
}

extension View {
    /// The iPhone's screen, look and buttons, in the left column of the iPad and the open Duo.
    /// Set on each screen: a pushed screen doesn't take it from the stack around it.
    func phoneScreen() -> some View {
        environment(\.stackedNotes, true).environment(\.besideNote, true)
    }
}
#endif

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
    @FocusedValue(\.todaysNote) private var todaysNote

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
            // ⌘T: Obsidian has no key for it and Pinto has no Font menu; ⌥⌘T is Table, ⇧⌘T Title.
            Button("Today\u{2019}s Note") { todaysNote?.open() }
                .keyboardShortcut("t")
                .disabled(todaysNote == nil)
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
        // View › AI Changes: everything an AI changed, across all notes.
        CommandGroup(after: .sidebar) {
            // As in Notes. The shortcuts are Xcode's Fold All and Unfold All.
            Button("Collapse All Sections") { editor?.collapseAllSections() }
                .keyboardShortcut(.leftArrow, modifiers: [.command, .option, .shift])
                .disabled(editor == nil)
            Button("Expand All Sections") { editor?.expandAllSections() }
                .keyboardShortcut(.rightArrow, modifiers: [.command, .option, .shift])
                .disabled(editor == nil)
            Divider()
            Button("\(AIChangeCopy.title)\u{2026}") { AIChangesCenter.shared.show() }
                .keyboardShortcut("a", modifiers: [.command, .option])
                .disabled(AIChangesCenter.shared.store == nil)
        }
        CommandGroup(after: .help) {
            // The website's changes page: release notes are never shown in the app by themselves.
            Button(Shortcuts.title) { NotificationCenter.default.post(name: .paneShowShortcuts, object: nil) }
                .keyboardShortcut("/", modifiers: .command)
            Button("\(WhatsNew.title)\u{2026}") { NSWorkspace.shared.open(WhatsNew.changelogURL) }
            Button("Show Setup Guide") { NotificationCenter.default.post(name: .paneReplayOnboarding, object: nil) }
            // What the Help and feedback page in Settings held (MacHelp).
            Divider()
            Button(MacHelp.questionsTitle) { MacHelp.questions() }
            Button(MacHelp.feedbackTitle) { MacHelp.sendFeedback() }
            Button(MacHelp.reportTitle) { MacHelp.reportIssue() }
            Button(MacHelp.githubTitle) { MacHelp.github() }
            Divider()
            Button(MacHelp.connectHelp) { MacHelp.helpConnecting() }
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
            // Your notes as Markdown in their folders, signed in or not.
            Button("Export All Notes\u{2026}") { NotificationCenter.default.post(name: .paneExportNotes, object: nil) }
                .disabled(importNotes == nil)
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
                // ⇧⌘E, as Notes' Highlight.
                Button("Highlight") { editor?.highlight() }.keyboardShortcut("e", modifiers: [.command, .shift])
                Button("Monostyled") { editor?.code() }.keyboardShortcut("m", modifiers: [.command, .shift])
                Divider()
                Button("Checklist") { editor?.checklist() }.keyboardShortcut("l", modifiers: [.command, .shift])
                Button("Bulleted List") { editor?.bulletList() }.keyboardShortcut("7", modifiers: [.command, .shift])
                Button("Dashed List") { editor?.dashedList() }.keyboardShortcut("8", modifiers: [.command, .shift])
                Button("Numbered List") { editor?.numberedList() }.keyboardShortcut("9", modifiers: [.command, .shift])
                Button("Block Quote") { editor?.blockQuote() }.keyboardShortcut("'", modifiers: .command)
                // A line across the note (`---`). No shortcut, as in Pages.
                Button("Divider") { editor?.insertDivider() }
                // A tinted panel with a title (`> [!note]`, as in Obsidian). No shortcut.
                Button("Callout") { editor?.insertCallout() }
                Divider()
                Button("Table") { editor?.insertTable() }.keyboardShortcut("t", modifiers: [.command, .option])
                // Today's date, shown as a chip that says Today (NoteDates).
                Button("Date") { editor?.insertDate() }.keyboardShortcut("d", modifiers: [.command, .shift])
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

    /// Whether a note asked to open waits another tenth of a second: only on one screen at a
    /// time, only while something is presented, and for three seconds at most (a sheet left open
    /// on purpose then gets the push it always got).
    static func waitsToOpen(compact: Bool, presenting: Bool, waited: Int) -> Bool {
        compact && presenting && waited < 30
    }
}
#endif

#if os(macOS)
/// An empty scroll view that never scrolls, behind a pane with nothing that does: the window
/// takes its soft edge under the toolbar instead of drawing its grey title bar there.
struct SoftToolbarEdge: NSViewRepresentable {
    func makeNSView(context: Context) -> NSScrollView {
        let v = NSScrollView()
        v.drawsBackground = false
        v.hasVerticalScroller = true
        v.autohidesScrollers = true
        v.scrollerStyle = .overlay
        v.verticalScrollElasticity = .none
        v.horizontalScrollElasticity = .none
        let page = NSView(frame: CGRect(x: 0, y: 0, width: 100, height: 100))
        page.autoresizingMask = [.width]
        v.documentView = page
        v.setAccessibilityElement(false)
        return v
    }

    func updateNSView(_ v: NSScrollView, context: Context) {}
}

/// The line between the notes list and the note, top to bottom, toolbar band included. The split
/// view's own divider takes a colour that disappears on the plain look's black (Emil, 10-30: "no
/// visible separation between note and notes list"), so the system's separator is drawn here,
/// one pixel wide, against the note's leading edge.
struct ColumnHairline: View {
    @Environment(\.displayScale) private var scale

    var body: some View {
        Rectangle()
            .fill(Color(nsColor: .separatorColor))
            .frame(width: 1 / max(scale, 1))
            .ignoresSafeArea()
            .allowsHitTesting(false)
            .accessibilityHidden(true)
    }
}
#endif

#if os(macOS)
/// Keeps the notes window's sidebar from collapsing: there is no sidebar-hidden state
/// (Emil, 11-01). SwiftUI's split view still answers ⌃⌘S (Toggle Sidebar, hidden in its own
/// menu); with its sidebar item unable to collapse, that does nothing.
struct SidebarPin: NSViewRepresentable {
    func makeNSView(context: Context) -> PinView { PinView() }
    func updateNSView(_ view: PinView, context: Context) { view.pin() }

    final class PinView: NSView {
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            pin()
            // The split view controller is put together a turn later.
            DispatchQueue.main.async { [weak self] in self?.pin() }
        }

        func pin() {
            guard let content = window?.contentView, let split = Self.split(in: content),
                  let sidebar = split.splitViewItems.first else { return }
            if sidebar.canCollapse { sidebar.canCollapse = false }
            if sidebar.isCollapsed { sidebar.isCollapsed = false }
        }

        /// SwiftUI's split view controller isn't a child view controller: it's the split view's delegate.
        static func split(in view: NSView) -> NSSplitViewController? {
            if let v = view as? NSSplitView, let s = v.delegate as? NSSplitViewController { return s }
            for sub in view.subviews { if let s = split(in: sub) { return s } }
            return nil
        }
    }
}
#endif

#if os(iOS)
/// The note first, the list over it (`RootView.noteFirst`); otherwise the system's own choice.
private struct NoteFirstStyle: ViewModifier {
    let on: Bool
    func body(content: Content) -> some View {
        if on { content.navigationSplitViewStyle(.prominentDetail) } else { content.navigationSplitViewStyle(.automatic) }
    }
}
#endif
