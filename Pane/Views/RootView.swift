import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// Three columns, like Apple Notes: folders, notes, the note.
struct RootView: View {
    @Environment(\.modelContext) private var context
    @Environment(OnboardingStore.self) private var onboarding: OnboardingStore?
    @Environment(\.behindSetupCard) private var behindSetupCard
    @Environment(\.undoManager) private var undoManager
    #if os(iOS)
    /// On iPhone a folder is pushed once the first layout is done (see `lifecycle`).
    @State private var scope: Scope?
    #else
    @State private var scope: Scope? = .all
    #endif
    /// The note list is showing its empty state: the note pane stays blank (NoteListView.showsEmpty).
    @State private var listEmpty = false
    /// The list shows search results: the empty note pane points at them.
    @State private var listSearching = false
    /// The list's selection; one note opens in the editor, several show a summary like Notes.
    @State private var selection: Set<UUID> = []
    @State private var visibility: NavigationSplitViewVisibility = .all
    #if os(macOS)
    @State private var listWidth = ListWidthKeeper.Probe()
    /// Whether the sidebar hid itself for a narrow window, and the change it's making (SidebarFit).
    @State private var sidebarFit = SidebarFit()
    /// Waits for the window's width to hold still before the sidebar acts on it.
    @State private var sidebarFitWait: Task<Void, Never>?
    #endif
    #if os(iOS)
    /// The open notes, for the list beside the note to draw (OpenNotes).
    @State private var openNotes = OpenNotes()
    /// The window's size, for the two layouts the columns can't choose by width class alone.
    @State private var windowSize: CGSize = .zero
    /// The whole window from what the geometry reports: a Duo open like a book keeps a strip down
    /// one side for the clock and camera, and the fold is halfway across the screen, strip included.
    static func wholeWindow(_ size: CGSize, _ insets: EdgeInsets) -> CGSize {
        CGSize(width: size.width + insets.leading + insets.trailing, height: size.height + insets.top + insets.bottom)
    }
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
    /// The folder you were in, for the next launch (LaunchSpot).
    private var lastScopeData: Data { LaunchSpot.value(forKey: "lastScope") as? Data ?? Data() }
    /// Files that weren't added (a kind the app can't show, or over 100 MB), said once.
    @State private var refusal: FileRefusal?
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
    /// Whether its field has the cursor: ⌘K then closes it; while you're in the app it returns.
    @State private var quickOpenFocused = false
    @State private var quickOpenFocusRequest = 0
    #endif
    @Environment(SetupStore.self) private var setupStore: SetupStore?
    @Environment(Backend.self) private var backendForConnect: Backend?
    /// The note you were on, for the next launch (LaunchSpot).
    private var lastNote: String { LaunchSpot.value(forKey: "lastNote") as? String ?? "" }

    /// The single open note, when exactly one is selected.
    private var selectedNote: UUID? {
        get { selection.count == 1 ? selection.first : nil }
        nonmutating set { selection = newValue.map { [$0] } ?? [] }
    }

    /// What the note pane shows: the selection, from the press on its row (PressSelect).
    private var shown: Set<UUID> { selection }
    private var shownNote: UUID? { shown.count == 1 ? shown.first : nil }

    var body: some View {
        #if DEBUG || QA
        RenderProbe.count("RootView", context: context)
        #endif
        #if os(macOS)
        // The window sizes to its content here, and contentMinSize alone didn't hold it (round 19:
        // it still went to 621 and cut the note off).
        let split = split.frame(minWidth: WindowFrameMemory.minimum.width)
        #endif
        return popups(imports(lifecycle(split)).newAppSheet())
            // Reports: the notes are on screen, for the cold launch time (Telemetry).
            .onAppear { Telemetry.shared.notesShown() }
            .focusedSceneValue(\.newNoteAction, newNoteCommand)
            .focusedSceneValue(\.editorController, editor)
            .focusedSceneValue(\.importAction, behindSetupCard ? nil : { showImport = true })
            .focusedSceneValue(\.importFromAction, behindSetupCard ? nil : { kind in importFiles = []; importing = kind })
            .focusedSceneValue(\.deleteNoteAction, deleteAction)
            // A template or shared note to add, from a link.
            .noteSourceHandler()
            // Today's Note, from the calendar button and the menus, in this window (DailyNotes).
            .environment(\.todaysNote, TodaysNoteAction(open: openTodaysNote))
            .focusedSceneValue(\.todaysNote, TodaysNoteAction(open: openTodaysNote))
            #if os(macOS)
            // View › Hide Sidebar / Show Sidebar, named for the state it's in (SidebarCommands
            // read "Show Sidebar" both ways beside this three-column split view).
            .focusedSceneValue(\.sidebarVisibility, $visibility)
            // The list comes back at the width it had: hidden, it's held at 350 pt for the
            // sidebar's buttons, and kept that when the sidebar came back (council round 3).
            .background(ListWidthKeeper(probe: listWidth))
            .onChange(of: visibility) { old, new in listWidth.changed(from: old, to: new) }
            #endif
            .sharedDeleteConfirmation($pendingSharedDelete) { removeNow($0) }
            .onReceive(NotificationCenter.default.publisher(for: FileRefusal.notification)) { n in refusal = n.object as? FileRefusal }
            .alert(refusal?.title ?? "", isPresented: Binding(get: { refusal != nil }, set: { if !$0 { refusal = nil } })) {
                Button("OK") {}
            } message: { Text(refusal?.message ?? "") }
            // A shared note you lost access to: said once, and the note closes.
            .modifier(SharedRemovalAlert(selection: $selection))
            #if os(iOS)
            .alert("Launch alert", isPresented: $launchAlert) { Button("OK", role: .cancel) {} }
            #endif
    }

    /// Connect an AI, and on the Mac the panel and the popups over the notes (apart, so the
    /// compiler can check the body in time).
    private func popups(_ content: some View) -> some View {
        content
            #if os(macOS)
            // Connect an AI is the Mac's only: on iPhone and iPad nothing listens, and Settings ›
            // AI lists what's connected (Emil, 8 November 2026).
            .onReceive(NotificationCenter.default.publisher(for: .paneConnectAI)) { _ in
                openPopup(.connectAI)
            }
            .onReceive(NotificationCenter.default.publisher(for: .paneQuickOpen)) { _ in
                // Open: ⌘K closes it from its field, and from the app takes you back to it.
                if quickOpen != nil {
                    if quickOpenFocused { quickOpen = nil } else { quickOpenFocusRequest += 1 }
                    return
                }
                // On screen at once with the recent notes it lists; the rest come a moment later,
                // read off the main thread, for what you type (2,000 notes held the first frame 164 ms).
                let first = QuickOpen.noteItems(in: context, limit: QuickOpen.firstRead)
                quickOpen = first
                Task { @MainActor [container = context.container] in
                    let all = await QuickOpen.allNoteItems(in: container)
                    if quickOpen != nil { quickOpen = QuickOpen.merged(first: first, all: all) }
                }
            }
            // Go to Note floats over the app and leaves it usable, so VoiceOver reaches both.
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
            // ⌘= is ⌘+ without shift, as in every Mac app that zooms (View › Bigger).
            .background {
                Button("Bigger") { TextSize.bigger() }.keyboardShortcut("=", modifiers: .command).hidden()
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
            // The sheet that greets a note just made is on this window too: it's put away first,
            // so the library can open again while it shows (two sheets don't share a window).
            let greeting = FirstOpen.shared.pending.values.filter(\.full)
            for m in greeting { FirstOpen.shared.start(m) }
            if !greeting.isEmpty { try? await Task.sleep(for: .seconds(0.45)) }
            // Real-input checks (`-uitest -demo -templatesSheet -templatesAIs`): as with ChatGPT
            // and Claude connected, in a demo run, which has no account to ask.
            let ais: [SetupCards.AI] = Self.templatesStandIn ? [.chatgpt, .claude] : TemplateMaking.ais(rows)
            withAnimation(.snappy(duration: 0.2)) { popup = nil; templateAIs = ais }
        }
    }

    /// Your connected AIs as the library offers them, asked for again (after Connect an AI closes
    /// over a template's page).
    private func connectedAIs() async -> [SetupCards.AI] {
        var rows: [Connection] = []
        if let client = backendForConnect?.client {
            rows = (try? await client.from("mcp_tokens").select().order("created_at", ascending: false).limit(20).execute().value) ?? []
        }
        return Self.templatesStandIn ? [.chatgpt, .claude] : TemplateMaking.ais(rows)
    }

    /// Connect an AI, over the library: the template's page stays under it, and is there with
    /// Make naming the AI when it closes (it used to close the library and open over All Notes).
    @State private var connectingOverTemplates = false

    /// An app just made has drawn (its page is in the window), or a second and a half has gone.
    private func appDrawn(_ note: UUID) async {
        let start = ContinuousClock.now
        while NotePageLive.view(note) == nil, start.duration(to: .now) < .seconds(1.5) { try? await Task.sleep(for: .milliseconds(30)) }
    }

    @Environment(SyncEngine.self) private var syncForSettings: SyncEngine?
    /// Whether the server can be reached: Make with an AI doesn't open the AI while it can't.
    @Environment(\.networkReach) private var reach

    /// One of the first run's cards, as a sheet; Cancel or Escape closes it.
    @ViewBuilder private func popupCard(_ only: SetupCardsFlow.Only, done: (() -> Void)? = nil) -> some View {
        if let backend = backendForConnect {
            let close = done ?? { withAnimation(.snappy(duration: 0.2)) { popup = nil } }
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

    private static let templatesStandIn: Bool = {
        let args = ProcessInfo.processInfo.arguments
        return args.contains("-uitest") && args.contains("-demo") && args.contains("-templatesAIs")
    }()

    private func templates(_ ais: [SetupCards.AI]) -> some View {
        // Make adds where New Note would: the folder shown, or with All Notes the first.
        let target = TemplateMaking.folder(in: context, scope: scope)
        let account = backendForConnect?.userID
        let closeConnect = {
            withAnimation(.snappy(duration: 0.2)) { connectingOverTemplates = false }
            Task {
                await setupStore?.refresh(force: true)
                let now = await connectedAIs()
                if templateAIs != nil { templateAIs = now }
            }
        }
        return ZStack {
            TemplateLibraryView(ais: ais, folder: target?.name ?? TemplateMaking.firstFolder,
                                have: { TemplateMaking.have($0, context: context, account: account) }, make: { e, ai in
                Task {
                    let before = (selection, scope)
                    let had = TemplateMaking.have(e, context: context, account: account) != nil
                    // A real-input check never opens the AI's page in a browser.
                    let note = await TemplateMaking.make(e, with: ai, context: context, account: account,
                                                         into: target.map { .existing($0.id) } ?? .new(TemplateMaking.firstFolder), reach: reach,
                                                         open: { if !Self.templatesStandIn { openURLForTemplates($0) } })
                    // No second sheet: the page just said what it is. The note opens with a line
                    // saying where it went, and Undo beside it.
                    if let note, let made = context.note(note) {
                        let isApp = NotePageStore.shared[note] != nil
                        let undo: (() -> Void)? = had ? nil : {
                            if let n = context.note(note), n.trashedAt == nil { context.trash(n) }
                            selection = before.0
                            scope = before.1
                        }
                        FirstOpen.shared.fromLibrary(note, title: e.title, slug: e.slug, isApp: isApp, folder: made.folder?.name ?? "Notes", hadIt: had,
                                                     waitingFor: ai.asks && reach != .online ? ai.name : nil, undo: undo)
                        selection = [note]
                        // An app: the library stays until its first screen has drawn, so the pane
                        // is never empty in between (it was, for about seven frames).
                        if isApp { await appDrawn(note) }
                    }
                    withAnimation(.snappy(duration: 0.2)) { templateAIs = nil }
                }
            }, connect: { withAnimation(.snappy(duration: 0.2)) { connectingOverTemplates = true } }, covered: connectingOverTemplates, uncover: closeConnect,
               close: { withAnimation(.snappy(duration: 0.2)) { templateAIs = nil } })
            // Esc is the library's own: its x on the gallery, Back on a template's page.
            .allowsHitTesting(!connectingOverTemplates)
            if connectingOverTemplates {
                Color.black.opacity(0.32)
                    .contentShape(.rect)
                    .onTapGesture(perform: closeConnect)
                    .transition(.opacity)
                popupCard(.connectAI, done: closeConnect)
                    .environment(\.inSheet, false)
                    .transition(.opacity)
            }
        }
        .onDisappear { connectingOverTemplates = false }
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
        .onGeometryChange(for: CGSize.self) { Self.wholeWindow($0.size, $0.safeAreaInsets) } action: { windowSize = $0 }
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
        // Too narrow for three columns (a 13-inch screen, a window at half), the sidebar steps
        // aside on its own and comes back when there's room, unless you hid it yourself
        // (Emil, 11-04: hiding it only by menu or keys was weird).
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width in
            // Once the width has held for a moment: a window being made passes through its least
            // width on the way to its own, and changing the columns inside a resize's layout pass
            // looped AppKit's constraints until it threw (council round 13, the Air).
            sidebarFitWait?.cancel()
            sidebarFitWait = Task { @MainActor in
                try? await Task.sleep(for: .seconds(SidebarFit.hold))
                guard !Task.isCancelled, let v = sidebarFit.settled(width: width, visibility: visibility) else { return }
                withAnimation(SidebarToggle.animation(reduceMotion: NSWorkspace.shared.accessibilityDisplayShouldReduceMotion)) { visibility = v }
            }
        }
        .onChange(of: visibility) { _, new in
            sidebarFit.changed(to: new)
        }
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
                    NoteListView(scope: s, selection: $selection, onNewNote: newNote, showsEmpty: $listEmpty, showsResults: $listSearching)
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
                // The sidebar hides with its own button, first beside the window's buttons as in
                // Notes, and with View › Hide Sidebar (⌃⌘S) (Emil, 11-04: with only the menu and
                // keys it looked like it couldn't). Ours, not the system's, so it stays in its
                // place with the sidebar shown or hidden; New Folder moved to the Folders heading.
                .toolbar(removing: .sidebarToggle)
                .navigationSplitViewColumnWidth(min: 240, ideal: 260, max: 360)
                .environment(\.toggleSidebar, ToggleSidebarAction(shown: visibility == .all) {
                    withAnimation(SidebarToggle.animation(reduceMotion: NSWorkspace.shared.accessibilityDisplayShouldReduceMotion)) {
                        visibility = SidebarToggle.toggled(visibility)
                    }
                })
                #else
                // iPad: room for the title beside the account button.
                .navigationSplitViewColumnWidth(min: 264, ideal: 270, max: 400)
                #endif
        } content: {
            NoteListView(scope: scope ?? .all, selection: $selection, onNewNote: newNote, showsEmpty: $listEmpty, showsResults: $listSearching)
                .equatable()
                .environment(library)
                #if os(macOS)
                .environment(\.listSidebarHidden, visibility != .all)
                // Never narrower than the window's buttons, the sidebar's New Folder, Today and Search,
                // and More and New Note need with the sidebar hidden: a narrower list had to grow
                // and shrink back on every toggle (Emil, 6 November 2026). So a toggle only slides.
                .navigationSplitViewColumnWidth(min: 330, ideal: 330, max: 440)
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
                // Small enough to tile on half a 1440 pt screen, with the wider list too (round 17).
                .navigationSplitViewColumnWidth(min: 360, ideal: 760)
                .overlay(alignment: .leading) { ColumnHairline() }
                #endif
        }
    }

    #if os(macOS)
    /// Go to Note…, over the window's top third like Spotlight. A click outside closes it.
    private var quickOpenPanel: some View {
        ZStack(alignment: .top) { quickOpenContent }
            .animation(QuickOpen.motion(opening: quickOpen != nil, reduceMotion: NSWorkspace.shared.accessibilityDisplayShouldReduceMotion), value: quickOpen == nil)
    }

    @ViewBuilder private var quickOpenContent: some View {
        if let notes = quickOpen {
            let targets = QuickOpen.targets(in: context, scope: scope, selected: selectedNote)
            // Nothing behind the panel catches clicks: the app stays usable while it's open, and its
            // details follow the note you open (Emil, 9 November 2026).
            ZStack(alignment: .top) {
                QuickOpenPanel(notes: notes,
                               commands: QuickOpen.commands(targets, importKinds: ImportKind.listed),
                               choose: { row in
                                   quickOpen = nil
                                   QuickOpen.choose(row, with: quickOpenActions)
                               },
                               close: { quickOpen = nil },
                               searchText: { [container = context.container] q in await QuickOpen.textHits(for: q, in: container) },
                               focusRequest: quickOpenFocusRequest,
                               focusChanged: { quickOpenFocused = $0 })
                    .padding(.top, 72)
            }
            .onDisappear { RowPressSlop.cover = nil; quickOpenFocused = false }
            // On the layer that comes and goes, not the panel inside it: SwiftUI runs only the
            // outermost inserted view's transition, so the panel's own showed as a plain fade.
            .transition(QuickOpen.transition(reduceMotion: NSWorkspace.shared.accessibilityDisplayShouldReduceMotion))
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
                case .connectAI: openPopup(.connectAI)
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
                        openAskedFromOutside()
                    }
                }
                #else
                restoreScope()
                restoreNote()
                openFromLaunchArguments()
                openAskedFromOutside()
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
            // A note opened from the menu bar or the Home Screen widget.
            .onChange(of: NoteOpener.shared.request) { _, id in reveal(id) }
            // New Note from Control Centre, the Lock Screen, the Action button or Siri.
            .onChange(of: NoteOpener.shared.newNoteAsked) { _, asked in if asked { openAskedFromOutside() } }
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
        if let new, let data = try? JSONEncoder().encode(new) { LaunchSpot.set(data, forKey: "lastScope") }
        #if os(iOS)
        // Back out of a folder on iPhone: the next launch opens the folders, as in Notes.
        if new == nil, sizeClass == .compact { LaunchSpot.set(PhoneLaunchSpot.folders, forKey: "lastScope") }
        #endif
    }

    private func noteChanged(from old: UUID?, to new: UUID?) {
        // The note you were typing in is written before anything looks at it.
        DebouncedSave.flushAll()
        if new == nil { PaneTips.listOpened() }
        // A note tapped: the clock for note_opened_speed runs until its editor is on screen.
        if new != nil { NoteOpenSpeed.tapped(at: Self.eventTime()) }
        if old != nil { NotificationCenter.default.post(name: .paneNoteClosed, object: nil) }
        discardIfEmpty(old)
        if let new { LaunchSpot.set(new.uuidString, forKey: "lastNote") }
        #if os(iOS)
        // Back out of a note on iPhone: the next launch opens the list it was in, not the note,
        // as in Notes. Leaving the app with the note open changes nothing here, so it reopens.
        if new == nil, sizeClass == .compact { LaunchSpot.set(PhoneLaunchSpot.list, forKey: "lastNote") }
        #endif
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
                    // Show Imported Notes: the folder the import made, open on a note its list shows.
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
        #if os(macOS)
        // Not from Recently Deleted (forever, asked elsewhere): the list opens the neighbour, like Notes.
        if notes.allSatisfy({ $0.trashedAt == nil }) {
            NotificationCenter.default.post(name: .paneDeleteNotes, object: Set(notes.map(\.id)))
            return
        }
        #endif
        withAnimation(.snappy(duration: 0.25)) {
            context.remove(notes, undo: undoManager) { back in selection = Set(back.map(\.id)) }
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
            } else if !behindSetupCard && !listEmpty {
                listSearching ? EmptyDetailView(title: EmptyDetailView.pickResult) : EmptyDetailView(newNote: newNote)
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

    /// File › New Note and ⌘N: off while a setup card is up, as the notes behind it are shut.
    private var newNoteCommand: (() -> Void)? {
        if behindSetupCard { return nil }
        return { newNote() }
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
        Usage.count(.todaysNote)
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
        #if os(macOS)
        // Real-input checks of the template library: `-uitest -demo -templatesSheet` opens it over
        // the made-up notes, and again each time `pintonotes.test.templates` is posted (the
        // sidebar's Templates row needs an account, which a demo run doesn't have).
        if args.contains("-uitest"), args.contains("-demo"), args.contains("-templatesSheet") || args.contains("-templatesHook") {
            // `-templatesHook` alone: only the notification, the library closed at launch.
            if args.contains("-templatesSheet") {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { NotificationCenter.default.post(name: .paneTemplates, object: nil) }
            }
            DistributedNotificationCenter.default().addObserver(forName: Notification.Name("pintonotes.test.templates"), object: nil, queue: .main) { _ in
                NotificationCenter.default.post(name: .paneTemplates, object: nil)
            }
        }
        #endif
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
        guard let id else { return }
        guard let note = context.note(id), note.deletedAt == nil else {
            // Gone (a widget's link to a deleted note): nothing's on its way, so the empty pane
            // isn't waiting for it (EmptyDetailView).
            if NoteOpener.shared.request == id { NoteOpener.shared.request = nil }
            return
        }
        #if os(iOS)
        // One screen at a time, UIKit drops a push made while an alert is up or still closing,
        // yet the note stays selected: Join on a shared note's link left its row chosen in All
        // Notes and the note unopened. It opens once the alert has gone.
        if Presentation.waitsToOpen(compact: sizeClass == .compact, presenting: Presentation.isActive, waited: waited) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { reveal(id, waited: waited + 1) }
            return
        }
        if waited > 0 { CollabScript.trace("the note waited \(waited) tenths of a second to open") }
        #endif
        // Cleared only now: until it opens, the empty pane doesn't offer a new note (EmptyDetailView).
        NoteOpener.shared.request = nil
        if note.trashedAt != nil { scope = .trash } else if case .folder(let f) = scope, note.folder?.id == f {} else {
            #if os(iOS)
            // Its folder's list under it, as for a note search found, so back leads there.
            scope = Scope.opening(note)
            #else
            scope = .all
            #endif
        }
        selectedNote = id
    }

    /// What was asked for before the notes showed (a launch from the widget, a control or Siri):
    /// a new note, or a note to show.
    private func openAskedFromOutside() {
        if NoteOpener.shared.newNoteAsked {
            NoteOpener.shared.newNoteAsked = false
            NoteOpener.shared.request = nil
            newNote()
        } else {
            reveal(NoteOpener.shared.request)
        }
    }

    /// Reopen the note you were on; otherwise the one you edited last.
    private func restoreNote() {
        guard selectedNote == nil, !ProcessInfo.processInfo.arguments.contains("-uitest") else { return }
        // Settings › General › Open it when Pinto starts: the first window opens on today's note.
        if TodaysNoteLaunch.shared.take(TodaysNoteSettings.load()) { openTodaysNote(); return }
        #if os(iOS)
        // You went Back out of the note last time: the list (or the folders) opens, with no note.
        if sizeClass == .compact, lastNote == PhoneLaunchSpot.list || scope == nil { return }
        #endif
        // A file kept in a folder reopens like a note.
        if let id = UUID(uuidString: lastNote), let f = context.attachment(id), f.folderID != nil, f.deletedAt == nil, f.trashedAt == nil {
            selectedNote = id
            return
        }
        if let n = context.noteToReopen(last: UUID(uuidString: lastNote), inTrash: scope == .trash) { selectedNote = n.id }
    }

    private func restoreScope() {
        #if os(iOS)
        // Captures: `-uitest -showFolders` stays on the folder list.
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-uitest"), args.contains("-showFolders") { return }
        // You went Back out to the folders last time: they're where it opens.
        if sizeClass == .compact, lastScopeData == PhoneLaunchSpot.folders { return }
        #endif
        if let s = try? JSONDecoder().decode(Scope.self, from: lastScopeData),
           !({ if case .folder(let id) = s { return context.folder(id) == nil } else { return false } }()) {
            scope = s
        } else if scope == nil {
            scope = .all
        }
    }
}

/// Where the iPhone opens after you went Back, as in Notes (Emil, 11 November 2026: "you always
/// return to the latest note you were in. but I think that should be nullified if you
/// intentionally left the note"). Back out of a note saves the list; Back out of a folder saves
/// the folders; opening a note or a folder saves it again. Leaving the app inside a note (Home,
/// another app, iOS ending it in the background) keeps the note, so it reopens. The iPad and the
/// Mac keep their selection: with the list beside the note there's no Back to mean "leave".
enum PhoneLaunchSpot {
    /// The last note, after Back out of it: open the list, no note.
    static let list = "list"
    /// The last scope, after Back out of a folder: open the folder list.
    static let folders = Data("folders".utf8)
}

/// Where you were (the last folder and note), kept for the next launch. Written half a second
/// after a switch on the Mac, not in it: as @AppStorage, each folder switch wrote two defaults in the click's
/// own update, and every view that reads a default was updated with it, about a tenth of the
/// switch (Emil, 12 November 2026: "switching between folders is not fast enough").
@MainActor
enum LaunchSpot {
    private static var pending: [String: Any] = [:]
    private static var scheduled = false
    private static var watching = false

    static func set(_ value: Any, forKey key: String) {
        #if os(iOS)
        // iOS can end the app in the background without a word: written at once there.
        UserDefaults.standard.set(value, forKey: key)
        #else
        pending[key] = value
        watchForQuit()
        guard !scheduled else { return }
        scheduled = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { flush() }
        #endif
    }

    /// The value waiting to be written, or the one written.
    static func value(forKey key: String) -> Any? { pending[key] ?? UserDefaults.standard.object(forKey: key) }

    static func flush() {
        scheduled = false
        let values = pending
        pending = [:]
        for (key, value) in values { UserDefaults.standard.set(value, forKey: key) }
    }

    /// Another account's library: what was waiting goes, with what was written (AccountLibrary).
    static func forget(_ keys: [String]) { keys.forEach { pending.removeValue(forKey: $0) } }

    #if os(macOS)
    /// Quitting or closing a window writes what's waiting at once.
    private static func watchForQuit() {
        guard !watching else { return }
        watching = true
        for name in [NSApplication.willTerminateNotification, NSWindow.willCloseNotification] {
            NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { _ in MainActor.assumeIsolated { flush() } }
        }
    }
    #endif
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

/// A shared note you're no longer in (SharedRemovals): said once over the notes, with Keep a Copy
/// when you'd typed in it here (persona council round 7, bugs 17 and 19). The note has gone from
/// the library already; open, it closes as a deleted note does: back to the list on iPhone,
/// nothing selected on the Mac.
private struct SharedRemovalAlert: ViewModifier {
    @Binding var selection: Set<UUID>
    @Environment(\.modelContext) private var context

    func body(content: Content) -> some View {
        let removals = SharedRemovals.shared
        let current = removals.current
        content
            .onChange(of: removals.queue.map(\.id), initial: true) { _, gone in
                if !selection.isDisjoint(with: gone) { selection.subtract(gone) }
            }
            .alert(current?.alertTitle ?? "", isPresented: Binding(get: { current != nil }, set: { if !$0, let current { removals.shown(current) } }),
                   presenting: current) { removal in
                if removal.copy != nil {
                    Button(SharedRemoval.keepCopy) {
                        if let note = removals.keep(removal, in: context) { NoteOpener.shared.open(note.id) }
                    }
                    #if os(macOS)
                    // Return keeps it on the Mac. On iPhone a default button is filled in the
                    // system's blue under the app's orange label, 1.6:1 (round 7 captures): it
                    // stays a plain alert button in the accent, as the app's other alerts are.
                    .keyboardShortcut(.defaultAction)
                    #endif
                    Button(SharedRemoval.dontKeep, role: .cancel) { removals.shown(removal) }
                } else {
                    Button("OK", role: .cancel) { removals.shown(removal) }
                }
            } message: { removal in
                Text(removal.message)
            }
    }
}

struct EmptyDetailView: View {
    /// File › New Note, from here too (persona council 11-04: the empty pane offered nothing to
    /// write). Nil where a note can't be made from this pane.
    var newNote: (() -> Void)? = nil

    static let title = "No note selected"
    /// With search results in the list (round 20: "No note selected", and a New Note, beside them).
    static let pickResult = "Select a result to open it"
    var title = EmptyDetailView.title

    /// A note is on its way (Keep a Copy, a join): nothing flashes before it opens (persona council r7).
    static func showsWords(opening: UUID?) -> Bool { opening == nil }

    var body: some View {
        // Words, and one way on (Emil, 11-03: no app icon on the empty states).
        VStack(spacing: 14) {
            Text(title)
                .font(.callout)
                .foregroundStyle(Color.muted)
            if let newNote {
                Button(action: newNote) {
                    HStack(spacing: 8) {
                        Text("New Note")
                        #if os(macOS)
                        // The shortcut, as a menu shows it; ⌘N itself stays with File › New Note.
                        Text("\u{2318}N")
                            .foregroundStyle(Color.muted)
                            .accessibilityHidden(true)
                        #endif
                    }
                }
                .buttonStyle(.secondary)
                .accessibilityLabel("New Note")
                .accessibilityIdentifier("detail.newNote")
                #if os(macOS)
                .help("New Note (\u{2318}N)")
                #endif
            }
        }
        .opacity(Self.showsWords(opening: NoteOpener.shared.request) ? 1 : 0)
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
    /// A Format menu item (or its shortcut) was used: one feature_used each time.
    private func format(_ run: () -> Void) {
        Usage.count(.formatUsed)
        run()
    }

    @FocusedValue(\.newNoteAction) private var newNote
    @FocusedValue(\.deleteNoteAction) private var deleteNote
    @FocusedValue(\.editorController) private var editor
    @FocusedValue(\.importAction) private var importNotes
    @FocusedValue(\.importFromAction) private var importFrom
    @FocusedValue(\.showHistoryAction) private var showHistory
    @FocusedValue(\.todaysNote) private var todaysNote
    @FocusedValue(\.sidebarVisibility) private var sidebarVisibility
    /// Read so the View menu's text size items enable and disable as the size changes.
    @AppStorage(TextSize.key) private var textSize: Double = 0

    var body: some Commands {
        // Settings shows as a sheet on the notes window in front, like WhatsApp's.
        // The trademark notes as the About window's credits, where a Mac app keeps them; they sat
        // at the foot of Privacy and security (council round 7).
        CommandGroup(replacing: .appInfo) {
            Button("About Pinto Notes") { AboutCredits.show() }
        }
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
            // ⌘O is where Open would be, and Obsidian's quick switcher. ⌘K opens it too, through the
            // Link item, unless text is picked in the note (CommandK).
            Button("Go to Note…") { NotificationCenter.default.post(name: .paneQuickOpen, object: nil) }
                .keyboardShortcut("o")
                .disabled(newNote == nil)
        }
        // Where Pages keeps Browse All Versions: File, after saving.
        CommandGroup(after: .saveItem) {
            Button(NoteMoreMenu.historyTitle) { showHistory?() }
                .disabled(showHistory == nil)
        }
        // View › Hide Sidebar, then AI Changes (everything an AI changed, across all notes) and
        // the rest. The sidebar group is replaced, not added to: an empty replacement (11-01)
        // took everything after it away.
        CommandGroup(replacing: .sidebar) {
            Button(SidebarToggle.title(sidebarVisibility?.wrappedValue)) {
                guard let v = sidebarVisibility else { return }
                // Reduce Motion: it's there or gone, no slide (council round 4, 11-04).
                withAnimation(SidebarToggle.animation(reduceMotion: NSWorkspace.shared.accessibilityDisplayShouldReduceMotion)) {
                    v.wrappedValue = SidebarToggle.toggled(v.wrappedValue)
                }
            }
            .keyboardShortcut("s", modifiers: [.command, .control])
            .disabled(sidebarVisibility == nil)
            Divider()
            // As in Notes. The shortcuts are Xcode's Fold All and Unfold All.
            Button("Collapse All Sections") { editor?.collapseAllSections() }
                .keyboardShortcut(.leftArrow, modifiers: [.command, .option, .shift])
                .disabled(editor == nil)
            Button("Expand All Sections") { editor?.expandAllSections() }
                .keyboardShortcut(.rightArrow, modifiers: [.command, .option, .shift])
                .disabled(editor == nil)
            Divider()
            // Note text, as in Notes' View menu. A PDF or picture open takes ⌘+ and ⌘− for its zoom.
            Button(TextSize.biggerTitle) { TextSize.bigger() }
                .keyboardShortcut("+", modifiers: .command)
                .disabled(textSize >= Double(TextSize.steps.last!))
            Button(TextSize.smallerTitle) { TextSize.smaller() }
                .keyboardShortcut("-", modifiers: .command)
                .disabled(textSize == 0 || textSize <= Double(TextSize.steps.first!))
            Button(TextSize.actualTitle) { TextSize.actualSize() }
                .keyboardShortcut("0", modifiers: .command)
                .disabled(textSize == 0)
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
        // The note on paper or as a PDF, as Notes has them (round 20).
        CommandGroup(replacing: .printItem) {
            Button("Export as PDF\u{2026}") { editor?.exportPDF() }
                .disabled(editor == nil)
            Button("Print\u{2026}") { editor?.printNote() }
                .keyboardShortcut("p")
                .disabled(editor == nil)
        }
        CommandGroup(replacing: .importExport) {
            // Not inside Settings: a home anyone finds, beside Import.
            Button("Connect an AI\u{2026}") { NotificationCenter.default.post(name: .paneConnectAI, object: nil) }
            Divider()
            // One item in File, the sources inside: six of them crowded it (round 17).
            Menu("Import Notes") {
                Button { importNotes?() } label: { Label { Text("Import from Apple Notes…") } icon: { ImportOrigin.appleNotes.menuImage } }
                    .disabled(importNotes == nil)
                ForEach(ImportKind.listed) { kind in
                    Button { importFrom?(kind) } label: { Label { Text(kind.menuTitle) } icon: { ImportOrigin.files(kind).menuImage } }
                        .disabled(importFrom == nil)
                }
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
                Button("Title") { format { editor?.heading(1) } }.keyboardShortcut("t", modifiers: [.command, .shift])
                Button("Heading") { format { editor?.heading(2) } }.keyboardShortcut("h", modifiers: [.command, .shift])
                Button("Subheading") { format { editor?.heading(3) } }.keyboardShortcut("j", modifiers: [.command, .shift])
                Button("Body") { format { editor?.heading(0) } }.keyboardShortcut("b", modifiers: [.command, .shift])
                Divider()
                Button("Bold") { format { editor?.bold() } }.keyboardShortcut("b")
                Button("Italic") { format { editor?.italic() } }.keyboardShortcut("i")
                Button("Underline") { format { editor?.underline() } }.keyboardShortcut("u")
                Button("Strikethrough") { format { editor?.strikethrough() } }.keyboardShortcut("x", modifiers: [.command, .shift])
                // ⇧⌘E, as Notes' Highlight.
                Button("Highlight") { format { editor?.highlight() } }.keyboardShortcut("e", modifiers: [.command, .shift])
                Button("Monostyled") { format { editor?.code() } }.keyboardShortcut("m", modifiers: [.command, .shift])
                Divider()
                Button("Checklist") { format { editor?.checklist() } }.keyboardShortcut("l", modifiers: [.command, .shift])
                #if os(macOS)
                // ⇧⌘U, as Notes' Mark as Checked: no pointer needed.
                Button(EditorController.tickTitle(ticked: editor?.caretItemTicked)) { format { editor?.tickItem() } }
                    .keyboardShortcut("u", modifiers: [.command, .shift])
                    .disabled(editor?.caretItemTicked == nil)
                #endif
                // Notes' Uncheck All, in the app's word: on in a checklist with something ticked.
                Button(EditorController.untickAllTitle) { format { editor?.untickAll() } }
                    .keyboardShortcut("l", modifiers: [.command, .option, .shift])
                    .disabled(editor?.canUntickAll != true)
                Button("Bulleted List") { format { editor?.bulletList() } }.keyboardShortcut("7", modifiers: [.command, .shift])
                Button("Dashed List") { format { editor?.dashedList() } }.keyboardShortcut("8", modifiers: [.command, .shift])
                Button("Numbered List") { format { editor?.numberedList() } }.keyboardShortcut("9", modifiers: [.command, .shift])
                Button("Block Quote") { format { editor?.blockQuote() } }.keyboardShortcut("'", modifiers: .command)
                // Notes' Move List Item Up and Down, for any line (council rounds 13 and 14).
                Button("Move Item Up") { format { editor?.moveItem(up: true) } }.keyboardShortcut(.upArrow, modifiers: [.command, .control])
                Button("Move Item Down") { format { editor?.moveItem(up: false) } }.keyboardShortcut(.downArrow, modifiers: [.command, .control])
                // A line across the note (`---`). No shortcut, as in Pages.
                Button("Code Block") { format { editor?.codeBlock() } }
                Button("Divider") { format { editor?.insertDivider() } }
                // A tinted panel with a title (`> [!note]`, as in Obsidian). No shortcut.
                Button("Callout") { format { editor?.insertCallout() } }
                Divider()
                Button("Table") { format { editor?.insertTable() } }.keyboardShortcut("t", modifiers: [.command, .option])
                // Today's date, shown as a chip that says Today (NoteDates).
                Button("Date") { format { editor?.insertDate() } }.keyboardShortcut("d", modifiers: [.command, .shift])
                // ⌘K adds a link only with text picked in the note; anywhere else it opens Go to
                // Note (CommandK). Chosen from the menu it always adds a link.
                Button("Link") {
                    switch CommandK.route(editor, byKey: NSApp.currentEvent?.type == .keyDown) {
                    case .link: format { editor?.insertLink() }
                    case .goToNote: NotificationCenter.default.post(name: .paneQuickOpen, object: nil)
                    }
                }.keyboardShortcut("k")
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
    /// An alert up, or anything still opening or closing: what makes UIKit drop a push. Waiting on
    /// anything else presented could hold a joined note back for seconds with nothing on screen
    /// saying why (persona council r7: 4.8 s in one take of three, cause not pinned down further).
    static var isActive: Bool {
        UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .contains { window in
                guard let shown = window.rootViewController?.presentedViewController else { return false }
                return shown is UIAlertController || shown.isBeingDismissed || shown.isBeingPresented
            }
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

/// ColumnHairline's line, always drawn: one device pixel in its colour.
struct SolidHairline: View {
    @Environment(\.displayScale) private var scale
    var body: some View { Rectangle().fill(ColumnHairline.colour).frame(width: 1 / max(scale, 1)) }
}

/// The line between the notes list and the note, top to bottom, toolbar band included. The split
/// view's own divider takes a colour that disappears on the plain look's black (Emil, 10-30: "no
/// visible separation between note and notes list"), so the system's separator is drawn here,
/// one pixel wide, against the note's leading edge.
struct ColumnHairline: View {
    @Environment(\.displayScale) private var scale
    /// Fainter than the system's separator, which read as a hard edge once the list had a ground
    /// of its own (Emil, 6 November 2026).
    static let colour = Color(nsColor: NSColor(name: nil) {
        $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 1, alpha: 0.09) : NSColor(white: 0, alpha: 0.08)
    })

    /// The same line where nothing draws one for us, light and dark: Settings' card, between its
    /// sidebar and the page (Emil, 7 November 2026: the window has one, the card had none).
    static var line: some View { SolidHairline() }

    /// macOS 27 draws its own divider here, so a second line only made it harder.
    static var systemDrawsIt: Bool { if #available(macOS 27, *) { true } else { false } }

    /// Whether this line is drawn. In light mode macOS 27's divider, once ListEdgeLine hides its
    /// bright ground, leaves nothing between the white list and the white note (Emil, 7 November
    /// 2026), so the line is ours there; in dark mode the system's still shows.
    static func draws(dark: Bool, systemDrawsIt: Bool = systemDrawsIt) -> Bool { !systemDrawsIt || !dark }

    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if Self.draws(dark: scheme == .dark) {
            Rectangle()
                .fill(Self.colour)
                .frame(width: 1 / max(scale, 1))
                .ignoresSafeArea()
                .allowsHitTesting(false)
                .accessibilityHidden(true)
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

#if os(macOS)
/// View › Hide Sidebar / Show Sidebar for the notes window's split view.
enum SidebarToggle {
    static func title(_ v: NavigationSplitViewVisibility?) -> String {
        v == nil || v == .all ? "Hide Sidebar" : "Show Sidebar"
    }
    static func animation(reduceMotion: Bool) -> Animation? { reduceMotion ? nil : .snappy(duration: 0.3) }

    static func toggled(_ v: NavigationSplitViewVisibility) -> NavigationSplitViewVisibility {
        v == .all ? .doubleColumn : .all
    }
}

private struct SidebarVisibilityKey: FocusedValueKey {
    typealias Value = Binding<NavigationSplitViewVisibility>
}

extension FocusedValues {
    var sidebarVisibility: Binding<NavigationSplitViewVisibility>? {
        get { self[SidebarVisibilityKey.self] }
        set { self[SidebarVisibilityKey.self] = newValue }
    }
}
#endif

#if os(macOS)
/// Remembers the notes list's width while the sidebar is hidden and puts it back when the
/// sidebar shows again.
struct ListWidthKeeper: NSViewRepresentable {
    let probe: Probe

    func makeNSView(context: Context) -> Probe { probe }
    func updateNSView(_ view: Probe, context: Context) {}

    final class Probe: NSView {
        /// How far the list reaches past the sidebar just before the sidebar hid: what you see of
        /// it. On macOS 26 the list's own view runs on under the floating sidebar, so its frame is
        /// wider than that (520 pt for a 260 pt list on the Air, council round 5, 11-04).
        private(set) var saved: CGFloat?
        /// The same, kept as the split view resizes while the sidebar shows: hidden from AppKit's
        /// side (Toggle Sidebar from the responder chain), it has already collapsed by the time
        /// SwiftUI says so.
        private(set) var tracked: CGFloat?
        private var restoring = false
        private weak var watching: NSSplitView?

        /// The window's three-column split view.
        var split: NSSplitView? {
            func find(_ v: NSView) -> NSSplitView? {
                if let s = v as? NSSplitView, s.arrangedSubviews.count >= 3 { return s }
                for k in v.subviews { if let f = find(k) { return f } }
                return nil
            }
            return window?.contentView.flatMap(find)
        }

        /// The list's width as you see it: from the sidebar's edge to the list's.
        static func shownWidth(sidebar: CGRect, list: CGRect) -> CGFloat { list.maxX - sidebar.maxX }

        /// The width as you see it now, or nil with the sidebar folded away.
        static func shownWidth(_ split: NSSplitView) -> CGFloat? {
            let side = split.arrangedSubviews[0]
            guard !side.isHidden, !split.isSubviewCollapsed(side), side.frame.width >= 100 else { return nil }
            return shownWidth(sidebar: side.frame, list: split.arrangedSubviews[1].frame)
        }

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            DispatchQueue.main.async { [weak self] in self?.watch() }
        }

        private func watch() {
            guard let split, split !== watching else { return }
            watching = split
            NotificationCenter.default.addObserver(self, selector: #selector(resized), name: NSSplitView.didResizeSubviewsNotification, object: split)
            resized()
        }

        @objc private func resized() {
            guard !restoring, let split = watching, let w = Self.shownWidth(split) else { return }
            tracked = w
        }

        func changed(from old: NavigationSplitViewVisibility, to new: NavigationSplitViewVisibility) {
            watch()
            guard let split else { return }
            if old == .all, new != .all {
                // Before the split view moves: it still has the widths it had.
                saved = Self.shownWidth(split) ?? tracked
            } else if new == .all, let width = saved {
                saved = nil
                restoring = true
                // Once the sidebar has stopped sliding in (the same width twice running; it takes
                // about a quarter second). Set while it slid, the list ended up 100 pt too wide.
                Task { @MainActor [weak self] in
                    var last: CGFloat = -1
                    for _ in 0..<20 {
                        try? await Task.sleep(for: .milliseconds(60))
                        guard let self, let split = self.split else { return }
                        let side = split.arrangedSubviews[0]
                        let w = split.isSubviewCollapsed(side) || side.isHidden ? 0 : side.frame.width
                        defer { last = w }
                        guard w > 100, w == last else { continue }
                        split.setPosition(side.frame.maxX + width, ofDividerAt: 1)
                        break
                    }
                    self?.restoring = false
                    self?.resized()
                }
            }
        }
    }
}
#endif

#if os(macOS)
/// The sidebar button's action, and whether the sidebar shows now.
struct ToggleSidebarAction: Equatable {
    let shown: Bool
    let run: () -> Void
    func callAsFunction() { run() }
    var title: String { shown ? "Hide Sidebar" : "Show Sidebar" }
    static func == (a: Self, b: Self) -> Bool { a.shown == b.shown }
}

extension EnvironmentValues {
    @Entry var toggleSidebar: ToggleSidebarAction? = nil
    @Entry var listSidebarHidden = false
    /// The notes list: the window's sidebar is hidden, so its buttons sit beside the list's.
}

/// The sidebar steps aside when the window is too narrow for three columns and comes back when
/// there's room again. Only on crossing the line, so a sidebar you show in a narrow window stays,
/// and one you hid stays hidden when the window grows.
struct SidebarFit: Equatable {
    /// The sidebar at its narrowest (240), the list (300) and room for the note to read well (560:
    /// about 70 characters at 13 pt with its margins). A 13-inch Air's full screen is 1,470.
    static let threeColumns: CGFloat = 1100

    /// It comes back only with this much more room, so the width its own hiding causes (the
    /// window's least width moves with the columns: 1,029 shown, 1,119 hidden in a test) can't
    /// bring it straight back and loop.
    static let comeBack: CGFloat = threeColumns + 120
    /// Widths for this long after its own change are the change settling, not you.
    static let settle: TimeInterval = 0.5

    /// The sidebar hid itself, so it may come back by itself.
    private(set) var autoHidden = false
    /// The visibility this is setting, to tell its own change from yours.
    private var setting: NavigationSplitViewVisibility?
    private var quietUntil = Date.distantPast

    /// How long a width holds before it counts.
    static let hold: Double = 0.3
    /// The last width it acted on; a window starts out wide, so a narrow one opens without it.
    private var last = CGFloat.infinity

    /// The visibility to move to now that the window has settled at `width`, or nil. Only on
    /// crossing a line from the last settled width.
    mutating func settled(width: CGFloat, visibility: NavigationSplitViewVisibility, now: Date = .now) -> NavigationSplitViewVisibility? {
        // No width yet (the window is still being made), or its own change settling.
        guard width > 1, now >= quietUntil else { return nil }
        let was = last
        last = width
        if was >= Self.threeColumns, width < Self.threeColumns, visibility == .all {
            autoHidden = true; setting = .doubleColumn; quietUntil = now.addingTimeInterval(Self.settle)
            return .doubleColumn
        }
        if was < Self.comeBack, width >= Self.comeBack, autoHidden, visibility != .all {
            autoHidden = false; setting = .all; quietUntil = now.addingTimeInterval(Self.settle)
            return .all
        }
        return nil
    }

    /// Any change it didn't make is yours: then it's yours to keep.
    mutating func changed(to v: NavigationSplitViewVisibility) {
        if v == setting { setting = nil } else { autoHidden = false; setting = nil }
    }
}
#endif

extension RootView {
    /// When the click or key that's being handled happened, on the Mac (the clock NoteOpenSpeed
    /// uses): the time from it to the note on screen is what was felt. Nil elsewhere, or for an
    /// event from more than a second ago.
    @MainActor static func eventTime() -> TimeInterval? {
        #if os(macOS)
        guard let e = NSApp.currentEvent, [.leftMouseDown, .leftMouseUp, .keyDown].contains(e.type),
              ProcessInfo.processInfo.systemUptime - e.timestamp < 1 else { return nil }
        return e.timestamp
        #else
        return nil
        #endif
    }
}
