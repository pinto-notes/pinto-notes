import QuickLook
import SwiftData
import SwiftUI
import TipKit
import UniformTypeIdentifiers

struct NoteDetailView: View {
    @Environment(\.modelContext) private var context
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var confirmingPurge = false
    @State private var importing = false
    /// Dev: an app built outside (scripts/build-app.ts), from a file, into this note.
    @State private var importingApp = false
    @State private var saver = DebouncedSave()
    @State private var shareLinks = ShareLinkStore()
    @State private var showHistory = HistoryLaunch.open
    @State private var movingNote = false
    @State private var pickingPhotos = false
    @State private var linkingNote = false
    @State private var choosingAttachment = false
    /// "ChatGPT changed 5 lines · Undo", while an AI's edit that just landed is on show.
    @State private var receipt: AIEdit.Receipt?
    /// The version that didn't open, for Undo on "Reverted to the last working version".
    @State private var revertedFrom: NotePageStore.Page?
    /// A text field in the note's app has focus: no receipt is drawn over it.
    @State private var pageFieldFocused = false
    /// A receipt waiting for the field to let go.
    @State private var heldReceipt: AIEdit.Receipt?
    @State private var undoFailed: String?
    /// For Undo of a page an AI made: the page before it (nil: none).
    @State private var undoPage: NotePageStore.Page?
    /// For Undo of a change to the app's own data: the data before it.
    @State private var undoData: NotePageData.Doc?
    /// The app asks to reach a host: shown as a question, answered once per host.
    @State private var hostAsk: HostAsk?
    /// The app needs an API key that isn't set up: the card that offers to add it.
    @State private var keyNeeded: NotePageNetwork.KeyNeed?
    @State private var addingKey: APIKeyForm.Draft?
    @State private var showNetLog = false
    @State private var showMakeApp = false
    @State private var showAppInfo = false

    struct HostAsk: Identifiable {
        let host: String
        /// The whole address, when the app asked to open a link (not to send a request).
        var link: String?
        let answer: (Bool) -> Void

        var title: String {
            guard let link else { return "This app wants to reach \(host)" }
            if link.lowercased().hasPrefix("mailto:") { return "This app wants to start an email" }
            if link.lowercased().hasPrefix("tel:") { return "This app wants to start a call" }
            return "This app wants to open a link"
        }
        var allow: String { link == nil ? "Allow" : "Open" }
        var message: String {
            link.map { "\($0)\n\nEverything in this address leaves the app with it." } ?? "Everything it sends there is listed in App Info › Internet."
        }
        var id: String { host }
    }
    /// Lock Note: setting the password up, asking for it, or confirming.
    @State private var lockSheet: LockSheet?
    @State private var confirmLock = false
    /// The lock dialog's title, taken from the note as the dialog opens (see `askToLock`).
    @State private var lockDialogTitle = ""
    @State private var lockProblem: String?
    /// A wiki link was tapped whose note doesn't exist yet: its name, while we offer to make it.
    @State private var missingNote: String?
    /// The title when the note opened; renaming it points wiki links at the new title on leaving.
    @State private var titleAtOpen: String?
    /// Notes that link here.
    @State private var backlinks: [Note] = []
    /// The foot of the note: what links here, with its lines, and what mentions it.
    @State private var links = NoteLinks()
    /// The wiki index's generation when they were last looked for.
    @State private var linksGeneration = -1
    /// Note pages (prototype): Page or Text, when the note has a page.
    @State private var mode: NoteMode = NoteDetailView.startMode
    /// Which side a note with an app opens on (Mac shots photograph both).
    nonisolated(unsafe) static var startMode: NoteMode = .page
    /// The text before edits made on the page, tinted once Text shows again.
    @State private var pageTint: String?
    /// The page as last shown, to tell an AI's new page from one already seen.
    @State private var shownPage: NotePageStore.Page?
    /// Pages that failed to load here: never fallen back to twice.
    @State private var failedPages: Set<String> = []
    /// Collaboration (prototype): the people sheet.
    /// Collaboration and sharing (prototype): the one Share sheet, and Share as Template on its own (demo).
    @State private var showPeople = false
    @State private var showTemplateShare = false
    @Bindable var note: Note
    let controller: EditorController
    var autofocus = false
    let onNewNote: () -> Void
    /// Opens another note; `edit` puts the keyboard in it.
    var onOpenNote: (UUID, Bool) -> Void = { _, _ in }

    // The body's modifiers in stages, in the same order: as one chain it took the type checker
    // about 10 s, the slowest function in the app (compile-time audit, 2026-10-13).
    var body: some View {
        withCollab(withArrivals(withFirstOpen(withLockAndSheets(editorWithImports))))
    }

    /// The editor, its importers and the dialogs about links.
    private var editorWithImports: some View {
        chrome(editor)
            .quickLookPreview(previewBinding)
            .fileImporter(isPresented: $importing, allowedContentTypes: FileKinds.contentTypes, allowsMultipleSelection: true, onCompletion: attach)
            #if DEBUG || QA
            .background {
                Color.clear.fileImporter(isPresented: $importingApp, allowedContentTypes: [.json, .html, .plainText]) { result in
                    guard case .success(let url) = result else { return }
                    let access = url.startAccessingSecurityScopedResource()
                    defer { if access { url.stopAccessingSecurityScopedResource() } }
                    guard let text = try? String(contentsOf: url, encoding: .utf8), NotePageProject.parse(text) != nil else { return }
                    NotePageStore.shared.setHere(note.id, .init(html: text, by: "File", at: .now))
                    pageArrived(NotePageStore.shared.live(note.id))
                }
            }
            #endif
            #if os(iOS)
            // What the paperclip above the keyboard (FormatBar) opens: the Mac's Attach menu.
            .confirmationDialog("Attach", isPresented: $choosingAttachment, titleVisibility: .hidden) {
                Button("Choose Photo or Video…") { pickingPhotos = true }
                    .accessibilityIdentifier("attach.photo")
                Button("Attach File…") { importing = true }
                    .accessibilityIdentifier("attach.file")
                if !hidden {
                    Button("Link to a Note…") { linkingNote = true }
                        .accessibilityIdentifier("attach.noteLink")
                    Button("Add Link", action: controller.insertLink)
                        .accessibilityIdentifier("attach.link")
                }
            }
            .sheet(isPresented: $linkingNote) { noteLinkPicker.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top).presentationDetents([.medium]) }
            .modifier(PhotoAttach(isPresented: $pickingPhotos) { urls in controller.insertFiles(context.addAttachments(urls)) })
            #endif
            .onAppear(perform: wireController)
            .onDisappear {
                saver.flush()
                followRename()
            }
            .confirmationDialog(missingNote.map { "Create \u{201C}\($0)\u{201D}?" } ?? "", isPresented: Binding(get: { missingNote != nil }, set: { if !$0 { missingNote = nil } }), titleVisibility: .visible) {
                Button("Create Note") { if let name = missingNote { createLinkedNote(name) } }
                    .accessibilityIdentifier("wiki.create")
            } message: {
                Text("No note has this title yet.")
            }
            // Captures: yes to making the note a link named.
            .onReceive(NotificationCenter.default.publisher(for: Capture.wikiCreate)) { _ in
                if let name = missingNote {
                    missingNote = nil
                    createLinkedNote(name)
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: ModelContext.didSave, object: context)) { saved in
                WikiDirectory.take(saved)
                refreshLinks(after: saved)
            }
            // The library's titles and links were read off the main thread: links and "Linked from" follow.
            .onReceive(NotificationCenter.default.publisher(for: WikiDirectory.didRead, object: context)) { _ in refreshLinks() }
            .shareLinkChrome(shareLinks, note: note)
    }

    /// The lock, history and app sheets, and the overlays at the foot.
    private func withLockAndSheets(_ content: some View) -> some View {
        content
            .focusedSceneValue(\.showHistoryAction, { if !note.isLocked { showHistory = true } })
            .sheet(item: $lockSheet) { step in
                switch step {
                case .setUp: NotesPasswordSetupSheet { lockNote() }
                case .password: NotesPasswordPrompt(message: "Enter your notes password to lock this note.") { askToLock() }
                }
            }
            .confirmationDialog(lockDialogTitle, isPresented: $confirmLock, titleVisibility: .visible) {
                Button("Lock Note") { lockNote() }
                    .accessibilityIdentifier("lock.confirm")
            } message: {
                Text("Its earlier versions are removed from version history, so no readable copy is kept, and if it has a share link, the link stops working.")
            }
            .alert("Can't lock this note", isPresented: Binding(get: { lockProblem != nil }, set: { if !$0 { lockProblem = nil } })) {
                Button("OK") {}
            } message: { Text(lockProblem ?? "") }
            .sheet(isPresented: $showHistory) {
                if let history = NoteHistory.shared { VersionHistorySheet(note: note, history: history) }
            }
            #if os(iOS)
            .safeAreaInset(edge: .bottom, spacing: 0) { if !showingPage { phoneTips } }
            #endif
            .overlay(alignment: .bottom) { aiReceipt }
            .overlay(alignment: .bottom) { undoProblem }
            .overlay(alignment: .bottom) { editorNotice }
            .overlay(alignment: .bottom) { keyCard }
            .modifier(HostAskAlert(ask: $hostAsk))
            .sheet(item: $addingKey) { d in APIKeyForm(draft: d) }
            .sheet(isPresented: $showNetLog) { NotePageNetLogView(noteID: note.id) }
            .sheet(isPresented: $showMakeApp) { MakeAppSheet(noteID: note.id, title: note.title, body_: note.body) }
            .sheet(item: firstOpenSheet) { m in
                if FirstOpen.variant == .ac {
                    FirstOpenRichSheet(moment: m) { startFirstOpen(m) }
                } else {
                    FirstOpenSheet(moment: m) { startFirstOpen(m) }
                }
            }
            #if os(iOS)
            .fullScreenCover(item: firstOpenWelcome) { m in FirstOpenWelcome(moment: m) { startFirstOpen(m) } }
            #else
            .sheet(item: firstOpenWelcome) { m in FirstOpenWelcome(moment: m) { startFirstOpen(m) } }
            #endif
    }

    /// A template's first open, and the app's info sheet.
    private func withFirstOpen(_ content: some View) -> some View {
        content
            // Later templates: just a line.
            .task(id: firstOpen?.note) {
                guard let m = firstOpen, !m.full else { return }
                try? await Task.sleep(for: .seconds(0.6))
                notice("Added to your notes")
                FirstOpen.shared.start(m)
            }
            .sheet(isPresented: $showAppInfo) {
                if let p = notePage {
                    AppInfoSheet(noteID: note.id, html: p.html,
                                     hasPrevious: NotePageStore.shared.previous(note.id) != nil,
                                     previous: { restorePreviousPage() },
                                     remove: {
                                         // The note's text stays as it is, and the app is kept: Previous App brings it back.
                                         NotePageStore.shared.setHere(note.id, nil)
                                         shownPage = nil
                                         mode = .text
                                     })
                }
            }
    }

    /// What arrives while the note is open: an AI's edit, an app's data, captures.
    private func withArrivals(_ content: some View) -> some View {
        content
            .onChange(of: note.aiEditedAt) { _, _ in showAIEdit() }
            .onChange(of: NotePageStore.shared[note.id]) { _, _ in pageArrived(NotePageStore.shared.live(note.id)) }
            // An AI's new version failed its checks on the server and waits there as a draft: the
            // working one keeps running; say so once.
            .onChange(of: NotePageStore.shared.drafts[note.id]) { _, draft in
                guard let draft, showingPage else { return }
                showPageReceipt(AIEdit.Receipt(noteID: note.id, by: draft.by, at: .now, previous: note.body, lines: 0, kind: .heldBack))
            }
            .onChange(of: mode) { _, now in if now == .text { tintPageEdits() } }
            // An AI (or MCP tool) changed the app's data while it's open: the app already shows it;
            // say who, and offer Undo back to before.
            .onChange(of: NotePageDataStore.shared.arrivals[note.id]) { _, a in
                guard let a, showingPage else { return }
                undoData = NotePageData.decode(a.before)
                showPageReceipt(AIEdit.Receipt(noteID: note.id, by: a.by, at: a.at, previous: note.body, lines: 0, kind: .dataEdit))
            }
            // Captures: `-lockCapture setup` or `confirm` (see Capture).
            .onReceive(NotificationCenter.default.publisher(for: Capture.lockCapture)) { n in
                switch n.object as? String {
                case "setup": lockSheet = .setUp
                case "confirm": askToLock()
                default: break
                }
            }
            // Captures: the "landed" moment is over.
            .onReceive(NotificationCenter.default.publisher(for: Capture.clearAIMarks)) { _ in
                withAnimation(.easeIn(duration: 0.2)) { receipt = nil }
                controller.clearTint()
            }
            // A version was restored (from the history, or Undo of an AI's edit): the editor
            // shows it at once, with nothing to undo back into, and an AI's marking goes.
            .onReceive(NotificationCenter.default.publisher(for: NoteHistory.restored)) { n in
                guard n.object as? UUID == note.id, collab == nil, let text = vault.text(of: note) else { return }
                withAnimation(.easeIn(duration: 0.2)) { receipt = nil }
                controller.takeRestored(text)
            }
            .task(id: note.id) { await noteOpened() }
            .onChange(of: showHistory) { _, open in if open { FeatureUse.mark(.versionHistory) } }
    }

    /// Collaboration (prototype) and the history link from an email.
    private func withCollab(_ content: some View) -> some View {
        content
            .modifier(CollabWiring(note: note, controller: controller, showPeople: $showPeople))
            .sheet(isPresented: $showPeople) { if let store = CollabStore.shared { ShareSheet(note: note, store: store) } }
            .sheet(isPresented: $showTemplateShare) { if let store = CollabStore.shared { TemplateShareSheet(note: note, store: store) } }
            .onReceive(NotificationCenter.default.publisher(for: CollabDemo.closeShare)) { _ in showPeople = false }
            .onReceive(NotificationCenter.default.publisher(for: CollabDemo.showShare)) { n in
                guard n.object as? String == "template" else { showPeople = true; return }
                showPeople = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { showTemplateShare = true }
            }
            // "See your note's history" from an email opened this note to show its history.
            .onChange(of: AppPlaceCenter.shared.historyFor, initial: true) { _, id in
                guard id == note.id else { return }
                AppPlaceCenter.shared.historyFor = nil
                if !note.isLocked { showHistory = true }
            }
    }

    /// Collaboration (prototype): the open shared note's session, when there is one.
    private var collab: CollabSession? { CollabStore.shared?.session(for: note.id) }

    #if os(iOS)
    /// On iPhone the note's tips sit just above the toolbar: a popover from a toolbar button
    /// never appears there. TipKit shows at most one of them, and only when it's due. The note
    /// keeps room below its last line so it can scroll clear of the tip.
    private var phoneTips: some View {
        VStack(spacing: 8) {
            CompactTip(tip: VersionHistoryTip()) { a in if a.id == "open" { showHistory = true } }
            CompactTip(tip: ShareLinkTip())
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 6)
        .onGeometryChange(for: CGFloat.self, of: \.size.height) { controller.bottomReserve = $0 }
    }
    #endif

    @ViewBuilder
    private var undoProblem: some View {
        if let undoFailed {
            // Room for two lines: a notice is never squeezed into one.
            Text(undoFailed)
                .font(.system(size: AIReceipt.text, weight: .semibold))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .frame(minHeight: AIReceipt.height)
                // Solid, never see-through.
                .background(Color(PColor.panePanel), in: .rect(cornerRadius: AIReceipt.height / 2))
                .overlay(RoundedRectangle(cornerRadius: AIReceipt.height / 2).strokeBorder(Color.line, lineWidth: 1))
                .padding(.horizontal, 24)
                #if os(macOS)
                .padding(.bottom, 20)
                #else
                .padding(.bottom, 64)
                #endif
                .transition(.opacity)
                .accessibilityAddTraits(.isStaticText)
                .accessibilityIdentifier("note.notice")
        }
    }

    /// "Table deleted", with Undo: what the editor just did at once, without asking first. It goes
    /// after a few seconds; Undo stays in the Edit menu, ⌘Z and shake.
    @ViewBuilder
    private var editorNotice: some View {
        if let n = controller.notice {
            Toast(text: n.text, undo: n.canUndo ? { withAnimation(.smooth(duration: 0.2)) { controller.undoNotice() } } : nil)
                .padding(.horizontal, 24)
                #if os(macOS)
                .padding(.bottom, 20)
                #else
                // Over the keyboard while you write; clear of the foot of the screen otherwise.
                .padding(.bottom, controller.isEditing ? 12 : 64)
                #endif
                .transition(AIReceipt.transition(reduceMotion: reduceMotion))
                .accessibilityIdentifier("note.editorNotice")
                .task(id: n.id) {
                    AccessibilityNotification.Announcement(n.text).post()
                    try? await Task.sleep(for: .seconds(5))
                    guard controller.notice?.id == n.id else { return }
                    withAnimation(.easeIn(duration: 0.2)) { controller.notice = nil }
                }
        }
    }

    @ViewBuilder
    private var aiReceipt: some View {
        if let receipt {
            #if os(iOS)
            // Over a note's app it sits in the navigation bar instead (see toolbar): an app's own
            // tab bar, sheets and the keyboard live at the bottom, its title at the top. An AI's
            // edit of the text is only the tint and a plain Undo button in the bar.
            let inBar = showingPage || NoteAIUndo.inBar(receipt, showingPage: showingPage)
            #else
            let inBar = false
            #endif
            if !inBar {
                AIReceipt(receipt: receipt, seeAll: AIChangesCenter.shared.store == nil ? nil : { AIChangesCenter.shared.show(ai: receipt.by) }) { undo(receipt) }
                #if os(macOS)
                .padding(.bottom, 20)
                #else
                .padding(.bottom, 64)
                #endif
                .transition(AIReceipt.transition(reduceMotion: reduceMotion))
            }
        }
    }

    /// An AI's edit you haven't seen: tint what it changed and offer Undo. Opening the note counts
    /// as seeing it, so the list's dot goes; the tint and Undo stay while you read, and go quietly
    /// once you start typing, undo it or leave the note (`staysUntilEdited`).
    private func showAIEdit() {
        guard let r = AIEdit.markSeen(note) else { return }
        Telemetry.shared.record(.firstAIEditSeen)
        try? context.save()
        let slow = ChangeTint.slowMotion
        Task { @MainActor in
            // Let the editor take the new text first.
            try? await Task.sleep(for: .seconds(0.15 * slow))
            guard note.id == r.noteID else { return }
            controller.tintChanges(from: r.previous, untilCleared: r.staysUntilEdited)
            withAnimation(.spring(duration: 0.45 * slow, bounce: 0.25)) { receipt = r }
            PaneTips.aiEditLanded()
        }
    }

    /// You started typing: what the AI changed is yours now, so its marking goes, quietly.
    private func editedSinceAIEdit() {
        guard let r = receipt, r.staysUntilEdited else { return }
        withAnimation(.easeOut(duration: 0.2)) { receipt = nil }
        controller.clearTint()
    }

    private func undo(_ r: AIEdit.Receipt) {
        withAnimation(.smooth(duration: 0.25)) { receipt = nil }
        if r.staysUntilEdited { controller.clearTint() }
        if r.kind == .pageMade || r.kind == .pageChanged {
            // The note's text never changed: the page goes back to what it was (the new one is kept).
            if undoPage != nil { restorePreviousPage() } else {
                NotePageStore.shared.setHere(note.id, nil)
                shownPage = nil
                mode = .text
            }
            return
        }
        if r.kind == .reverted {
            if let page = revertedFrom { NotePageStore.shared.force(note.id, page); shownPage = page }
            revertedFrom = nil
            return
        }
        if r.kind == .pageEdit { pageTint = nil }
        if r.kind == .dataEdit {
            // Back to the data before this run of changes; the note's text is untouched.
            if let undoData { NotePageDataStore.shared.set(note.id, undoData) }
            undoData = nil
            return
        }
        // The editor takes the old text as an outside change, which also clears the tint.
        let note = self.note
        Task { @MainActor in
            do {
                try await AIEdit.undo(r, on: note)
            } catch {
                // Couldn't reach the server: say so where the receipt was.
                withAnimation(.smooth(duration: 0.25)) { undoFailed = (error as? LocalizedError)?.errorDescription ?? "Couldn't undo. Try again." }
                try? await Task.sleep(for: .seconds(4))
                withAnimation(.smooth(duration: 0.25)) { undoFailed = nil }
            }
        }
    }

    private var vault: NoteVault { .shared }
    private struct ImagesAsk: Equatable { var note: UUID; var pulled: Int; var files: Int }

    /// The editor, or for a locked note that isn't open, the lock.
    @ViewBuilder
    private var editor: some View {
        if readable {
            // Both stay alive, so switching is instant and the editor can tint what the page changed.
            ZStack {
                // A shared note's editor takes merged text from its session (CollabWiring), not from
                // the note's mirrored body, which can lag a keystroke behind and undo it.
                NoteEditorText(note: note, controller: controller, autofocus: autofocus, followsInitialText: collab == nil, foot: trashed ? nil : links, onChange: save)
                    #if os(macOS)
                    // Like Notes: the text runs under the see-through toolbar, which fades it at the
                    // edge (AppKit insets the text by the toolbar's height). Not under a banner.
                    .ignoresSafeArea(.container, edges: note.trashedAt == nil ? .top : [])
                    // The soft edge: text passing under the toolbar fades into the page's ground, so
                    // the buttons stay readable over it.
                    .overlay(alignment: .top) {
                        if note.trashedAt == nil && !Self.captureWithoutToolbar {
                            LinearGradient(stops: [.init(color: Color.notePage, location: 0), .init(color: Color.notePage.opacity(0.85), location: 0.55),
                                                   .init(color: Color.notePage.opacity(0), location: 1)],
                                           startPoint: .top, endPoint: .bottom)
                                .frame(height: NoteDetailView.toolbarFade)
                                .ignoresSafeArea(.container, edges: .top)
                                .allowsHitTesting(false)
                                .accessibilityHidden(true)
                        }
                    }
                    #endif
                    .onAppear { if note.isLocked { vault.touch() } }
                    // Opened by a link to one of its headings: there, once the text is laid out.
                    .task {
                        try? await Task.sleep(for: .milliseconds(150))
                        landOnHeading()
                    }
                    // The note's images that are on the server and not here are fetched as it opens,
                    // and again when a sync brings changes: a note's text, or file rows on their own
                    // (a picture added on another device can arrive a sync after the text that shows it).
                    .task(id: ImagesAsk(note: note.id, pulled: sync?.remoteChangeTick ?? 0, files: sync?.filesPulledTick ?? 0)) {
                        // The text is read as the fetch starts, not in the note pane's body (see `readable`).
                        guard let text = vault.text(of: note) else { return }
                        await controller.fetchMissingImages(note: note.id, body: text)
                    }
                    .opacity(showingPage ? 0 : 1)
                    .allowsHitTesting(!showingPage)
                    .accessibilityHidden(showingPage)
                if let page = notePage {
                    NotePageView(noteID: note.id, html: page.html, text: vault.text(of: note) ?? "", onUpdate: applyPageEdit, onFailure: pageFailed, onData: pageData,
                                 files: { [context] id in NotePageActions.file(id, note: note, context: context) },
                                 onFocus: { focused in
                                     pageFieldFocused = focused
                                     // Typing in the app: a receipt steps out of the way (Undo stays in Edit and ⌘Z).
                                     if focused, receipt != nil { withAnimation(.easeIn(duration: 0.15)) { receipt = nil } }
                                     if !focused, let held = heldReceipt {
                                         heldReceipt = nil
                                         if held.at.timeIntervalSinceNow > -3 { showPageReceipt(held) }
                                     }
                                 },
                                 insetBottom: pageInsetBottom)
                        .id(note.id)
                        .opacity(showingPage ? 1 : 0)
                        .allowsHitTesting(showingPage)
                        .accessibilityHidden(!showingPage)
                        // B: the first-open card inside the app, at its top, until Start.
                        .safeAreaInset(edge: .top, spacing: 0) {
                            if showingPage, let m = firstOpen, m.full, m.isApp, FirstOpen.variant == .b {
                                FirstOpenCard(moment: m) { startFirstOpen(m) }
                                    .transition(.move(edge: .top).combined(with: .opacity))
                            }
                        }
                }
            }
        } else {
            LockedNoteView(note: note)
        }
    }

    /// Whether the note's text is here to show: always, unless the note is locked and not open.
    /// Asked without reading the text of a note that isn't locked. This view reads the text
    /// nowhere while you type (`NoteEditorText` does), so a save doesn't work out the note pane,
    /// its toolbar and its menus again: the editor writes the note every 0.35 s.
    private var readable: Bool { note.lockedBody == nil || vault.text(of: note) != nil }

    /// A locked note that isn't open: nothing on screen to edit. The page has no caret either.
    private var hidden: Bool { !readable || showingPage }
    /// In Recently Deleted: read, recover or delete, nothing else (like Notes).
    private var trashed: Bool { note.trashedAt != nil }

    // MARK: Note pages (prototype)

    enum NoteMode: String { case page, text }

    /// The note's page, unless the note is locked (a locked note never shows one).
    /// The version that runs: the newest that passed its checks and opens here (NotePageStore.live).
    private var notePage: NotePageStore.Page? { note.isLocked ? nil : NoteApps.page(note.id) }
    private var showingPage: Bool { notePage != nil && mode == .page }

    /// A template just added from the website, opening for the first time.
    private var firstOpen: FirstOpen.Moment? { FirstOpen.shared.pending[note.id] }

    private func startFirstOpen(_ m: FirstOpen.Moment) {
        withAnimation(.smooth(duration: 0.3)) { FirstOpen.shared.start(m) }
    }

    /// A: a sheet over the app (and, for a note template, its lighter version, whatever the design).
    private var firstOpenSheet: Binding<FirstOpen.Moment?> {
        Binding(get: {
            guard let m = firstOpen, m.full else { return nil }
            return !m.isApp || FirstOpen.variant == .a || FirstOpen.variant == .ac ? m : nil
        }, set: { if $0 == nil, let m = firstOpen { FirstOpen.shared.start(m) } })
    }

    /// C: a short welcome before the app.
    private var firstOpenWelcome: Binding<FirstOpen.Moment?> {
        Binding(get: {
            guard let m = firstOpen, m.full, m.isApp, FirstOpen.variant == .c else { return nil }
            return m
        }, set: { if $0 == nil, let m = firstOpen { FirstOpen.shared.start(m) } })
    }

    /// What of the app's bottom edge Amber covers: on the Mac the receipt (its height, its margin and
    /// a gap); on iPhone nothing (the receipt goes in the navigation bar, and the App side has no
    /// bottom toolbar).
    private var pageInsetBottom: CGFloat {
        #if os(macOS)
        receipt != nil && showingPage ? AIReceipt.height + 20 + 8 : 0
        #else
        0
        #endif
    }

    /// An edit the page asked for, applied to the markdown as an edit of yours: it syncs, keeps a
    /// version, and the receipt offers Undo. The page re-renders from the new text.
    private func applyPageEdit(_ op: NotePage.Op) throws {
        let before = note.body
        let after = try NotePage.apply(op, to: before)
        guard after != before else { return }
        note.body = after
        note.touch()
        try? context.save()
        if pageTint == nil { pageTint = before }
        let r = AIEdit.Receipt(noteID: note.id, by: AIGlyph.page, at: .now, previous: before, after: after,
                               lines: ChangeTint.changedLines(from: before, to: after).count, kind: .pageEdit)
        showPageReceipt(r)
    }

    /// Never over a field you're typing in, or under a sheet. A change made while a field has
    /// focus (a button pressed as the field lets go) shows once the focus has gone, if that's soon.
    private func showPageReceipt(_ r: AIEdit.Receipt) {
        guard !showAppInfo else { return }
        guard !pageFieldFocused else { heldReceipt = r; return }
        heldReceipt = nil
        withAnimation(.spring(duration: 0.45, bounce: 0.25)) { receipt = r }
        Task { @MainActor in
            // Longer than an AI's: you may switch to Text to see the change before you undo it.
            try? await Task.sleep(for: .seconds(10 * ChangeTint.slowMotion))
            while ChangeTint.holdForCapture, receipt == r { try? await Task.sleep(for: .seconds(0.1)) }
            if receipt == r { withAnimation(.easeIn(duration: 0.2)) { receipt = nil } }
        }
    }

    /// The app's own data and files (amber.store, amber.files). Data changes are kept next to the
    /// page, never in the note's text, and get a receipt with Undo like any other change.
    /// The app's own data, files, the device and the network. Data changes are the app's own
    /// state (a ticked set, a rating): kept quietly, versioned on the server, without a receipt;
    /// receipts are for changes to the note's text.
    private func pageData(_ message: Any) async throws -> [String: Any] {
        let (reply, before) = try await NotePageActions.data(message, note: note, context: context, sync: sync, html: notePage?.html ?? "",
                                                             ask: askHost, askLink: askLink, needKey: { need in withAnimation(.smooth) { keyNeeded = need } },
                                                             open: followAppLink)
        // A change you made gets a receipt; the app saving on its own is quiet (Undo still reaches it
        // through version history).
        if let before, (message as? [String: Any])?["_user"] as? Bool == true { dataChanged(before: before) }
        return reply
    }

    /// The app's data is the app's content now: a change gets "Changed · Undo" like any edit. A run
    /// of changes (typing, a game, a batch) is one receipt, and Undo goes back to before the run.
    private func dataChanged(before: NotePageData.Doc) {
        if let r = receipt ?? heldReceipt, r.kind == .dataEdit, r.at.timeIntervalSinceNow > -10, undoData != nil {
            // Same run: the Undo point stays where the run began.
        } else {
            undoData = before
        }
        let r = AIEdit.Receipt(noteID: note.id, by: AIGlyph.page, at: .now, previous: note.body, lines: 0, kind: .dataEdit)
        showPageReceipt(r)
    }

    private func askHost(_ host: String) async -> Bool { await askHost(host, link: nil) }

    /// Asks before an app's link opens, showing all of it.
    private func askLink(_ link: String) async -> Bool { await askHost(URL(string: link)?.host ?? link, link: link) }

    private func askHost(_ host: String, link: String?) async -> Bool {
        await withCheckedContinuation { c in
            // Answered once, whichever way the alert goes away.
            final class Once { var done = false }
            let once = Once()
            hostAsk = HostAsk(host: host, link: link) { ok in
                guard !once.done else { return }
                once.done = true
                c.resume(returning: ok)
            }
        }
    }

    /// "This app needs an OpenWeather API key", with Add Key and how to get one.
    @ViewBuilder
    private var keyCard: some View {
        if let need = keyNeeded, showingPage {
            VStack(alignment: .leading, spacing: 10) {
                Label("This app needs \(need.name.first.map { "AEIOU".contains($0) } == true ? "an" : "a") \(need.name) API key", systemImage: "key.fill")
                    .font(.headline)
                if let help = need.help { Text(help).font(.subheadline).foregroundStyle(.secondary) }
                Text("It's sent only to \(need.hosts.joined(separator: ", ")). The app never sees it.")
                    .font(.footnote).foregroundStyle(.secondary)
                HStack {
                    Button("Not Now") { withAnimation(.smooth) { keyNeeded = nil } }
                    Spacer()
                    Button("Add Key") { addingKey = APIKeyForm.Draft(need); keyNeeded = nil }
                        .buttonStyle(.amberProminent)
                        .accessibilityIdentifier("keycard.add")
                }
            }
            .padding(16)
            .background(.regularMaterial, in: .rect(cornerRadius: 20, style: .continuous))
            .padding(.horizontal, 16)
            #if os(macOS)
            .frame(maxWidth: 460)
            .padding(.bottom, 20)
            #else
            .padding(.bottom, 24)
            #endif
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
    }

    /// Back in Text: what the page changed is tinted, as an AI's edit is.
    private func tintPageEdits() {
        guard let before = pageTint else { return }
        pageTint = nil
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(0.15 * ChangeTint.slowMotion))
            controller.tintChanges(from: before)
        }
    }

    /// The note on screen changed: what its view starts from. (Its own function: the view's body is
    /// at the limit of what the compiler type-checks in one go.)
    private func noteOpened() async {
        titleAtOpen = note.body.isEmpty || note.isLocked ? nil : note.title
        refreshLinks()
        links.findMentions(note, context: context)
        receipt = nil
        shownPage = NoteApps.enabled ? NotePageStore.shared[note.id] : nil
        // A note with an app is the app: what its text held goes into the app's data once.
        if shownPage != nil { NotePageActions.importIfNeeded(note) }
        if shownPage != nil { NotePageTiming.open(note.id) }
        pageTint = nil
        mode = Self.startMode
        showAIEdit()
        #if os(macOS)
        PaneTips.menuBarShown = MenuBarSettings.allowed && UserDefaults.standard.object(forKey: MenuBarSettings.key) as? Bool ?? true
        #endif
        PaneTips.noteOpened(note.body)
        ShareAsk.noteUsed()
    }

    /// A page an AI made or changed while the note is open: show it, say who, offer Undo.
    private func pageArrived(_ now: NotePageStore.Page?) {
        guard NoteApps.enabled else { return }
        let before = shownPage
        shownPage = now
        if now != nil { NotePageActions.importIfNeeded(note) }
        guard let now, now.isNewVersion(after: before), now.by != AIGlyph.page, now.by != FirstOpen.templateWriter else { return }
        withAnimation(.smooth(duration: 0.3)) { mode = .page }
        let r = AIEdit.Receipt(noteID: note.id, by: now.by, at: now.at, previous: note.body, lines: 0, kind: before == nil ? .pageMade : .pageChanged)
        undoPage = before
        guard !pageFieldFocused else { return }
        withAnimation(.spring(duration: 0.45, bounce: 0.25)) { receipt = r }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(5.5 * ChangeTint.slowMotion))
            while ChangeTint.holdForCapture, receipt == r { try? await Task.sleep(for: .seconds(0.1)) }
            if receipt == r { withAnimation(.easeIn(duration: 0.2)) { receipt = nil } }
        }
    }

    /// One item of the More menu (`NoteMoreMenu` decides which, and their order).
    @ViewBuilder
    private func moreItem(_ item: NoteMoreMenu.Item) -> some View {
        switch item {
        case .pin:
            Button(note.isPinned ? "Unpin Note" : "Pin Note", systemImage: note.isPinned ? "pin.slash" : "pin") {
                withAnimation(.snappy) { context.togglePin(note) }
            }
        case .lock:
            Button("Lock Note", systemImage: "lock", action: startLock)
                .accessibilityIdentifier("editor.lock")
        case .lockNow:
            Button("Lock Now", systemImage: "lock") { vault.lockNow() }
                .accessibilityIdentifier("editor.lockNow")
        case .removeLock:
            Button("Remove Lock", systemImage: "lock.open", action: removeLock)
                .accessibilityIdentifier("editor.removeLock")
        case .makeApp:
            Button("Make It an App…", systemImage: NoteAppMark.symbol) { showMakeApp = true }
                .accessibilityIdentifier("editor.makeApp")
        case .appInfo:
            // Everything about the app in one place: its settings, the internet, Previous App, Remove App.
            Button("App Info…", systemImage: "info.circle") { showAppInfo = true }
                .accessibilityIdentifier("editor.appInfo")
        case .devImportApp:
            // An app built outside the AI tools (scripts/build-app.ts output, or one HTML file).
            Button("Dev: Import App File…", systemImage: "square.and.arrow.down") { importingApp = true }
                .accessibilityIdentifier("editor.devImportApp")
        case .moveTo:
            #if os(macOS)
            // One item, whatever the number of folders: the folders are in the picker it opens.
            Button("Move to…", systemImage: "folder") { movingNote = true }
                .accessibilityIdentifier("editor.moveTo")
            #else
            Menu("Move to", systemImage: "folder") {
                ForEach(context.allFolders()) { f in
                    Button(f.name) { context.move(note, to: f) }.disabled(note.folder?.id == f.id)
                }
            }
            #endif
        case .share:
            Menu("Share", systemImage: "square.and.arrow.up") { shareItems }
        case .history:
            Button(NoteMoreMenu.historyTitle, systemImage: "clock.arrow.circlepath") { showHistory = true }
        case .recover:
            Button("Recover", systemImage: "arrow.uturn.backward") { withAnimation(.snappy) { context.restore(note) } }
                .accessibilityIdentifier("editor.recover")
        case .delete:
            if trashed {
                Button("Delete Now…", systemImage: "trash", role: .destructive) { confirmingPurge = true }
                    .accessibilityIdentifier("editor.deleteNow")
            } else {
                Button("Delete Note", systemImage: "trash", role: .destructive) {
                    withAnimation(.snappy) { context.trash(note) }
                }
            }
        }
    }

    private func restorePreviousPage() {
        guard let back = NotePageStore.shared.restorePrevious(note.id) else { return }
        shownPage = back
        withAnimation(.smooth(duration: 0.25)) { mode = .page }
    }

    /// The page threw while loading or drew nothing: the one before it comes back, and the note
    /// says so. With no page before it, the note shows its text. The failed page is kept.
    private func pageFailed(_ reasons: [String]) {
        guard let page = notePage else { return }
        failedPages.insert(page.html)
        let store = NotePageStore.shared
        store.markBroken(note.id, page)
        // The new page's receipt goes: the revert says what happened instead.
        withAnimation(.smooth(duration: 0.2)) { receipt = nil }
        sync?.reportLoadFailure(note: note.id, message: reasons.first ?? "It didn't open.")
        if let good = store.live(note.id), good != page {
            // The last working version runs, with the app's data as it is now. Undo runs the broken
            // one again, if you want to see it.
            shownPage = good
            revertedFrom = page
            showPageReceipt(AIEdit.Receipt(noteID: note.id, by: page.by, at: .now, previous: note.body, lines: 0, kind: .reverted))
        } else {
            withAnimation(.smooth(duration: 0.25)) { mode = .text }
            notice("This app didn't open, and there's no earlier version that works.")
        }
    }

    private func notice(_ text: String) {
        withAnimation(.smooth(duration: 0.25)) { undoFailed = text }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(5 * ChangeTint.slowMotion))
            while ChangeTint.holdForCapture, undoFailed == text { try? await Task.sleep(for: .seconds(0.1)) }
            if undoFailed == text { withAnimation(.smooth(duration: 0.25)) { undoFailed = nil } }
        }
    }

    enum LockSheet: String, Identifiable {
        case setUp, password
        var id: String { rawValue }
    }

    private var lockTitle: String {
        note.title.isEmpty ? "Lock this note?" : "Lock \u{201C}\(note.title)\u{201D}?"
    }

    /// Asks before locking. The dialog's title names the note, and the note's title is read from
    /// its text: it is read here, as the dialog opens, and not in the note pane's body, which
    /// would then be worked out again with every write of the editor.
    private func askToLock() {
        lockDialogTitle = lockTitle
        confirmLock = true
    }

    /// Lock Note: sets the notes password up the first time, asks for it while notes are locked.
    private func startLock() {
        if let why = NoteVault.blocker(for: note) { lockProblem = why.errorDescription; return }
        Task { @MainActor in
            if !vault.isSetUp { await vault.refresh() }
            if !vault.isSetUp { lockSheet = .setUp } else if !vault.isUnlocked { lockSheet = .password } else { askToLock() }
        }
    }

    private func lockNote() {
        // Typing not yet in the note goes in first, then it's sealed.
        saver.flush()
        do {
            try vault.lock(note)
            try? context.save()
            shareLinks.forgetLink()
        } catch {
            lockProblem = (error as? LocalizedError)?.errorDescription ?? "Try again."
        }
    }

    private func removeLock() {
        saver.flush()
        try? vault.removeLock(note)
        try? context.save()
    }

    private func chrome(_ content: some View) -> some View {
        // Counted here, once per body: a statement in the body itself is more than the
        // compiler can type-check in time.
        #if DEBUG
        RenderProbe.count("NoteDetailView")
        #endif
        return content
            .ignoresSafeArea(.container, edges: .bottom)
            .background(Color.notePage.ignoresSafeArea())
            .safeAreaInset(edge: .top, spacing: 0) {
                VStack(spacing: 0) {
                    if note.trashedAt != nil { trashBanner }
                }
            }
            .onChange(of: note.trashedAt, initial: true) { _, at in controller.readOnly = at != nil }
            .confirmationDialog("Delete \u{201C}\(note.title)\u{201D} now?", isPresented: $confirmingPurge, titleVisibility: .visible) {
                Button("Delete Now", role: .destructive) { withAnimation(.snappy) { context.purge(note) } }
            } message: {
                Text("It's deleted for good, on all your devices. This can't be undone.")
            }
            .navigationTitle("")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            .animation(.snappy(duration: 0.2), value: controller.isEditing)
            #endif
            #if os(macOS)
            // Handed up to the toolbar that stays as the notes change (NoteToolbarStage).
            .preference(key: NoteToolbarKey.self, value: toolbarParts)
            #else
            .toolbar { toolbar }
            #endif
    }

    #if os(macOS)
    private var toolbarParts: NoteToolbarParts {
        NoteToolbarParts(
            // A note with an app is just the app: no writing tools.
            writing: notePage != nil ? nil : AnyView(Group {
                FormatButton(controller: controller).disabled(hidden || trashed)
                Button("Checklist", systemImage: "checklist", action: controller.checklist)
                    .help("Checklist (⇧⌘L)")
                    .disabled(hidden || trashed)
                // In a table it's the table's menu, like Notes.
                if let menu = controller.currentTableMenu {
                    Menu { TableMenuItems(menu: menu) } label: { Label("Table", systemImage: "tablecells") }
                        .help("Table")
                        .disabled(hidden || trashed)
                } else {
                    Button("Table", systemImage: "tablecells", action: controller.insertTable)
                        .help("Table (⌥⌘T)")
                        .disabled(hidden || trashed)
                }
                attachMenu.disabled(trashed)
            }),
            people: collab.map { collab in AnyView(PresenceStack(session: collab) { showPeople = true }) },
            sharing: AnyView(Group {
                shareMenu
                moreMenu
            }))
    }
    #endif

    /// Every keystroke lands here; the model is written once typing pauses.
    private func save(_ text: String) {
        // Recently Deleted is read-only: nothing typed or ticked there is kept.
        guard !trashed else { return }
        if receipt != nil { editedSinceAIEdit() }
        // A shared note's text lives in its document; the note follows it (CollabStore).
        if let collab {
            collab.local(text, selection: controller.target?.currentSelection)
            return
        }
        PaneTips.typed()
        ShareAsk.noteUsed(typing: true)
        let note = self.note
        let vault = self.vault
        saver.schedule(base: vault.text(of: note) ?? note.body) { [saver] in
            // Something else rewrote the note meanwhile (sync, an AI): the editor
            // already shows that version, so this older text must not win.
            guard (vault.text(of: note) ?? note.body) == saver.base else { return }
            write(text, to: note)
        }
    }

    private func write(_ text: String, to note: Note) {
        if note.isLocked {
            // Sealed again as you type; the title in the list follows.
            guard text != vault.text(of: note) else { return }
            try? vault.write(text, to: note)
            return
        }
        guard text != note.body else { return }
        if TipTriggers.isBigDeletion(from: note.body, to: text) { PaneTips.deletedALot() }
        note.body = text
        note.touch()
    }

    #if os(macOS)
    /// How far down the toolbar's soft edge reaches from the window's top.
    /// Captures only: an offscreen window has no toolbar, so the fade under it would lie over the
    /// title instead. Off in the app.
    nonisolated(unsafe) static var captureWithoutToolbar = false
    static let toolbarFade: CGFloat = 64
    #endif

    // MARK: Wiki links

    /// Colours for the editor's wiki links and the "Linked from" list, from the library as it is now.
    private func refreshLinks() {
        controller.wiki = WikiDirectory.scope(for: note, in: context)
        backlinks = note.isLocked ? [] : context.backlinks(to: note)
        links.refresh(backlinks, note: note, context: context)
        linksGeneration = WikiDirectory.generation
    }

    /// After a save, "Linked from" is looked for again only if the save could have changed it: a
    /// title or folder changed, a note was deleted for good, or a note it changed links here or did.
    /// Most saves are this note being typed in.
    private func refreshLinks(after saved: Notification) {
        let link = "pane-note:\(note.id.uuidString.lowercased())"
        let mayLink: (Note) -> Bool = { other in
            other.id != note.id && (backlinks.contains { $0.id == other.id } || other.body.contains("[[") || other.body.contains(link))
        }
        let changes = context.savedNotes(saved)
        // Another note's text changed (it may mention this one now), or this one's title did.
        if changes?.notes.contains(where: { $0.id != note.id }) ?? true {
            links.findMentions(note, context: context, delay: .seconds(1))
        } else {
            links.findMentions(note, context: context, delay: .seconds(0.8), force: false)
        }
        guard WikiDirectory.generation == linksGeneration, let changes, !changes.notes.contains(where: mayLink) else {
            refreshLinks()
            return
        }
        controller.wiki = WikiDirectory.scope(for: note, in: context)
    }

    /// A wiki link was tapped: open its note, or offer to make it, as Obsidian does.
    /// `written` is the link's target, with its `#heading` if it has one.
    private func followWikiLink(_ written: String) {
        let link = WikiLinks.links(in: "[[\(written)]]").first
        followLink(link?.target ?? written, heading: link?.heading)
    }

    /// A link in this note's app was tapped (pinto:Work/Acme#Agenda): the same as a wiki link.
    /// The app hears whether there was a note to open.
    private func followAppLink(_ link: AppLinks.Link) throws {
        guard followLink(link.target, heading: link.heading) else {
            throw NotePage.OpError("No note is called \u{201C}\(WikiLinks.name(of: link.target))\u{201D}.")
        }
    }

    /// Opens the note a link names, at its heading, or offers to make it. False when there's none.
    @discardableResult
    private func followLink(_ target: String, heading: String?) -> Bool {
        // What was just typed here counts in the next note's "Linked from".
        saver.flush()
        guard let linked = context.resolveWikiLink(target, from: note) else {
            missingNote = WikiLinks.name(of: target)
            return false
        }
        if let heading { LinkLanding.shared.request(linked.id, heading: heading) }
        if linked.id == note.id { landOnHeading() } else { onOpenNote(linked.id, false) }
        return true
    }

    /// A link asked for a heading in this note: the text scrolls to it. A note showing its app
    /// opens on the app.
    private func landOnHeading() {
        if !showingPage, let at = LinkLanding.shared.takeLocation(note.id) {
            controller.reveal(at)
            return
        }
        guard let heading = LinkLanding.shared.take(note.id), !showingPage,
              let text = vault.text(of: note), let at = WikiLinks.headingLocation(heading, in: text) else { return }
        controller.reveal(at)
    }

    /// The note a link named, made in this note's folder and opened for writing.
    private func createLinkedNote(_ title: String) {
        let made = context.createNote(in: note.folder.map { .folder($0.id) } ?? .all, body: title + "\n")
        WikiDirectory.invalidate()
        onOpenNote(made.id, true)
    }

    /// Leaving a note whose title changed: links to its old title now name the new one.
    private func followRename() {
        guard let old = titleAtOpen, !note.isLocked, note.deletedAt == nil, note.title != old else { return }
        titleAtOpen = note.title
        context.retargetWikiLinks(to: note, renamedFrom: old)
    }

    private func attach(_ result: Result<[URL], Error>) {
        if case .success(let urls) = result { controller.insertFiles(context.addAttachments(urls)) }
    }

    private var previewBinding: Binding<URL?> {
        Binding(get: { controller.previewURL }, set: { controller.previewURL = $0 })
    }

    /// Gives the editor what it needs from this screen: files, downloads, the picker.
    private func wireController() {
        let context = self.context
        let sync = self.sync
        controller.resolveAttachment = { id in context.attachment(id) }
        controller.resolveNoteModel = { id in context.note(id) }
        // A note dragged in from the list is linked by its title. Not this note to itself.
        controller.noteLinkTitle = { [own = note.id] id in
            guard id != own, let n = context.note(id), n.deletedAt == nil else { return nil }
            return n.title
        }
        controller.openNote = { id in onOpenNote(id, false) }
        controller.openWiki = { target in followWikiLink(target) }
        controller.suggestTitles = { [id = note.id] typed in WikiDirectory.suggestions(typed, excluding: id, in: context) }
        controller.suggestHeadings = { [note] target, typed in WikiDirectory.headingSuggestions(typed, target: target, from: note, in: context) }
        links.open = { [saver] id, location in
            // What was just typed here counts in the next note's "Linked from".
            saver.flush()
            LinkLanding.shared.request(id, location: location)
            onOpenNote(id, false)
        }
        controller.download = { a in await sync?.download(a) ?? false }
        controller.attach = { importing = true }
        controller.attachChoices = { choosingAttachment = true }
        controller.addFiles = { urls in note.isLocked ? [] : context.addAttachments(urls) }
        controller.addData = { data, name, type in
            guard !note.isLocked, let a = try? FileStore.importData(data, filename: name, type: type) else { return nil }
            context.insert(a)
            try? context.save()
            SyncSignal.changed()
            return a
        }
    }

    private var trashBanner: some View {
        TrashBanner { withAnimation(.snappy) { context.restore(note) } }
    }

    #if os(iOS)
    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        // The floating buttons in the label colour, not the accent (Emil, 28 October 2026): the
        // accent is for the caret, ticks, selection and links.
        // No bar at the foot while you read (Emil, 29 October 2026): the writing tools come up
        // with the keyboard, above it (FormatBar).
        // No new note in here: that's the list's + (Emil, 29 October 2026).
        if showingPage, let receipt {
            ToolbarItem(placement: .principal) {
                AIReceipt(receipt: receipt, compact: true) { undo(receipt) }
                    .transition(.opacity)
            }
            .sharedBackgroundVisibility(.hidden)
        }
        // Undo, a round button of its own just left of Share and More (Emil, 29 October 2026): it
        // comes once you change the note and goes when there's nothing left since it opened.
        // Before you've changed anything it undoes an AI's edit, whose lines are tinted.
        if let undoButton = NoteAIUndo.button(canUndo: controller.canUndo, canRedo: controller.canRedo, receipt: receipt,
                                              showingPage: showingPage, trashed: trashed) {
            ToolbarItem(placement: .primaryAction) { barUndo(undoButton) }
            ToolbarSpacer(.fixed, placement: .primaryAction)
        }

        if let collab {
            ToolbarItem(placement: .primaryAction) { PresenceStack(session: collab) { showPeople = true } }
        }
        // Share beside More in one floating capsule, as in Notes; Share is no longer in More.
        ToolbarItemGroup(placement: .primaryAction) {
            if !note.isLocked {
                Menu("Share", systemImage: "square.and.arrow.up") { shareItems }
                    .disabled(trashed)
                    .tint(.primary)
                    .accessibilityIdentifier("editor.share")
            }
            moreMenu.tint(.primary)
        }
    }

    @ViewBuilder
    private func barUndo(_ button: NoteAIUndo.Button) -> some View {
        switch button {
        case .yours(let canRedo):
            if canRedo {
                // A long press offers Redo.
                Menu {
                    Button("Redo", systemImage: "arrow.uturn.forward", action: controller.redo)
                } label: {
                    Label("Undo", systemImage: "arrow.uturn.backward")
                } primaryAction: {
                    controller.undo()
                }
                .tint(.primary)
                .accessibilityIdentifier(NoteAIUndo.yoursIdentifier)
            } else {
                Button("Undo", systemImage: "arrow.uturn.backward", action: controller.undo)
                    .tint(.primary)
                    .accessibilityIdentifier(NoteAIUndo.yoursIdentifier)
            }
        case .ai(let receipt):
            // Titled for VoiceOver ("Undo ChatGPT's changes"); the bar shows the glyph. A long
            // press offers every change that AI made (AI Changes).
            Menu {
                Button("See All Changes by \(receipt.by)", systemImage: "clock.arrow.circlepath") { AIChangesCenter.shared.show(ai: receipt.by) }
                    .disabled(AIChangesCenter.shared.store == nil)
            } label: {
                Label(receipt.undoLabel, systemImage: "arrow.uturn.backward")
            } primaryAction: {
                undo(receipt)
            }
                .tint(.primary)
                .accessibilityHint("Puts the note back the way it was before \(receipt.by)'s edit")
                .accessibilityIdentifier(NoteAIUndo.identifier)
        }
    }
    #endif

    #if os(macOS)
    /// The paperclip: what can be put into a note. A photo or video, a file; then a link to
    /// another note (the `[[Title]]` link typing `[[` makes) and a web link.
    private var attachMenu: some View {
        Menu {
            Button("Choose Photo or Video…", systemImage: "photo.on.rectangle") { pickingPhotos = true }
                .accessibilityIdentifier("attach.photo")
            Button("Attach File…", systemImage: "doc") { importing = true }
                .accessibilityIdentifier("attach.file")
            Divider()
            Group {
                Button("Link to a Note…", systemImage: "note.text.badge.plus") { linkingNote = true }
                    .accessibilityIdentifier("attach.noteLink")
                Button("Add Link", systemImage: "link", action: controller.insertLink)
                    .accessibilityIdentifier("attach.link")
            }
            .disabled(hidden)
        } label: {
            Label("Attach", systemImage: "paperclip")
        }
        .disabled(note.isLocked || showingPage)
        .tint(.primary)
        .menuIndicator(.hidden)
        .help("Attach")
        .popover(isPresented: $linkingNote, arrowEdge: .bottom) { noteLinkPicker }
        .modifier(PhotoAttach(isPresented: $pickingPhotos) { urls in controller.insertFiles(context.addAttachments(urls)) })
        .accessibilityIdentifier("editor.attach")
    }
    #endif

    private var noteLinkPicker: some View {
        NoteLinkPicker(titles: { [id = note.id] typed in WikiDirectory.suggestions(typed, excluding: id, in: context, limit: NoteLinkPicker.limit) },
                       pick: { controller.insertWikiLink($0) })
    }

    /// Everything about sharing in one place, like Notes: the public link, and sending a copy.
    @ViewBuilder
    private var shareItems: some View {
        if let store = CollabStore.shared, store.isReady {
            Section {
                // One Share: a link anyone can View or Edit with, the people in the note, and Share as Template.
                Button("Share…", systemImage: "person.crop.circle.badge.plus") { showPeople = true }
                    .accessibilityIdentifier("collab.share")
            }
        }
        ShareLinkMenuSection(store: shareLinks, note: note)
        Section {
            SendCopyItem(note: note)
        }
    }

    #if os(macOS)
    /// The toolbar's Share: a plain button with a popover (ShareNotePopover), in one group with More.
    private var shareMenu: some View {
        ShareButton(note: note, store: shareLinks, people: CollabStore.shared?.isReady == true ? { showPeople = true } : nil)
            // A locked note can't be shared, and its text isn't here to send; a deleted one isn't shared.
            .disabled(note.isLocked || trashed)
            .paneTip(ShareLinkTip(), arrowEdge: .top)
            .accessibilityIdentifier("editor.share")
    }
    #endif

    private var moreMenu: some View {
        Menu {
            let groups = NoteMoreMenu.groups(locked: note.isLocked, vaultOpen: vault.isUnlocked, trashed: note.trashedAt != nil,
                                             hasApp: notePage != nil, appsEnabled: NoteApps.enabled)
            ForEach(Array(groups.enumerated()), id: \.offset) { index, group in
                if index > 0 { Divider() }
                ForEach(group, id: \.self) { moreItem($0) }
            }
        } label: {
            Label("More", systemImage: "ellipsis")
        }
        #if os(macOS)
        .tint(.primary)
        .menuIndicator(.hidden)
        .help("More")
        #endif
        #if os(macOS)
        .popover(isPresented: $movingNote, arrowEdge: .bottom) {
            MoveToPicker(current: note.folder?.id) { context.move(note, to: $0) }
        }
        // Move Note… from Go to Note (⌘O).
        .onReceive(NotificationCenter.default.publisher(for: .paneMoveNote)) { _ in if !trashed { movingNote = true } }
        #endif
        #if os(macOS)
        .paneTip(VersionHistoryTip(), arrowEdge: .top) { action in
            if action.id == "open" { showHistory = true }
        }
        #endif
        .accessibilityIdentifier("editor.more")
    }
}

/// What the note's More (…) menu holds, in order: two groups, like the owner drew them on
/// 2026-10-11. What the note is (pinned, locked, an app) first; then where it goes, what it
/// was and deleting it.
enum NoteMoreMenu {
    /// The history item's name, as in Notes' more menu. On the Mac it opens a sheet, so "…".
    static var historyTitle: String {
        #if os(iOS)
        "Version History"
        #else
        "Version History…"
        #endif
    }

    static var isPhoneOrPad: Bool {
        #if os(iOS)
        true
        #else
        false
        #endif
    }

    static var isDevBuild: Bool {
        #if DEBUG || QA
        true
        #else
        false
        #endif
    }

    enum Item: Hashable { case pin, lock, lockNow, removeLock, makeApp, appInfo, devImportApp, moveTo, share, history, recover, delete }

    static func groups(locked: Bool, vaultOpen: Bool, trashed: Bool, hasApp: Bool, appsEnabled: Bool,
                       phone: Bool = isPhoneOrPad, dev: Bool = isDevBuild) -> [[Item]] {
        // A note in Recently Deleted can only come back or go for good, like Notes.
        if trashed { return [[.recover, .delete]] }
        var about: [Item] = [.pin]
        if locked {
            if vaultOpen { about += [.lockNow, .removeLock] }
        } else if !trashed {
            about.append(.lock)
        }
        if appsEnabled, !hasApp, !locked, !trashed { about.append(.makeApp) }
        if hasApp { about.append(.appInfo) }
        if dev, appsEnabled, !locked, !trashed { about.append(.devImportApp) }
        // What links here is at the foot of the note (NoteLinksSection), not in this menu.
        var rest: [Item] = [.moveTo]
        // Sharing has its own button beside More, on iPhone and iPad as on the Mac.
        if !locked { rest.append(.history) }
        rest.append(.delete)
        return [about, rest]
    }
}

/// The note's text in the editor, under its date. A view of its own: it is what reads the text
/// and the date, so a save while you type works out this view, not the whole note pane.
private struct NoteEditorText: View {
    let note: Note
    let controller: EditorController
    let autofocus: Bool
    let followsInitialText: Bool
    let foot: NoteLinks?
    let onChange: (String) -> Void

    var body: some View {
        #if DEBUG
        let _ = RenderProbe.count("NoteEditorText")
        #endif
        // A locked note that isn't open has no text to give the editor; its pane shows the lock.
        if let text = NoteVault.shared.text(of: note) {
            // The note the welcome becomes opens as the welcome showed it, date and all.
            let handoff = WelcomeHandoff.shared.opening == note.id
            MarkdownEditor(initialText: text, header: DateBucket.header(note.updatedAt), controller: controller, autofocus: autofocus,
                           followsInitialText: followsInitialText, dateShown: handoff, foot: foot, onChange: onChange)
        }
    }
}

/// "Send a Copy…" with the note's text. A view of its own for the same reason: it reads the text.
private struct SendCopyItem: View {
    let note: Note

    var body: some View {
        #if os(macOS)
        // A button that asks for the sharing picker when it is chosen. A ShareLink in the toolbar's
        // menu made a picker each time the menu was worked out: about 100 for every note opened.
        // Each one looks up the Mac's sharing services, so the cost is the Mac's: 19 ms a burst on
        // a Mac with few of them, 115 to 370 ms of the main thread in the log of one with many
        // (1.2.4, 2026-10-11), twice for each note opened.
        Button { SendCopy.show(note.body) } label: {
            Label("Send a Copy…", systemImage: "square.and.arrow.up")
        }
        #else
        ShareLink(item: note.body, preview: SharePreview(note.title)) {
            Label("Send a Copy…", systemImage: "square.and.arrow.up")
        }
        #endif
    }
}

#if os(macOS)
/// The system's sharing picker for a note's text, shown where the pointer chose the menu item.
@MainActor
enum SendCopy {
    static func show(_ text: String) {
        guard let window = NSApp.keyWindow ?? NSApp.mainWindow, let view = window.contentView else { return }
        let at = view.convert(window.mouseLocationOutsideOfEventStream, from: nil)
        NSSharingServicePicker(items: [text]).show(relativeTo: NSRect(x: at.x, y: at.y, width: 1, height: 1), of: view, preferredEdge: .minY)
    }
}
#endif

/// Collaboration (prototype): hooks an open shared note to its session. The editor takes merged
/// text from others, their carets are drawn, and your caret goes out as presence.
private struct CollabWiring: ViewModifier {
    let note: Note
    let controller: EditorController
    @Binding var showPeople: Bool

    private var session: CollabSession? { CollabStore.shared?.session(for: note.id) }

    func body(content: Content) -> some View {
        content
            .task(id: session.map { ObjectIdentifier($0) }) {
                guard let session else { controller.remoteCarets = []; return }
                session.onRemoteText = { [weak controller] text in controller?.target?.syncExternal(text) }
                // Carets go straight to the text view, not through SwiftUI's next update, so they move
                // in the same frame as the text.
                session.onCarets = { [weak controller] carets in controller?.target?.showRemoteCarets(carets) }
                // Your caret, a few times a second (it also goes with every keystroke).
                while !Task.isCancelled {
                    session.selectionChanged(controller.isEditing ? controller.target?.currentSelection : nil)
                    controller.remoteCarets = session.remoteCarets
                    CollabStore.shared?.loadPhotos(session)
                    try? await Task.sleep(for: .seconds(0.1))
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: CollabDemo.invite)) { _ in showPeople = true }
    }
}

/// "This app wants to reach …" for a request, or the whole address of a link an app asked to open.
/// Its own modifier: the note's body is at the limit of what the compiler type-checks in one go.
private struct HostAskAlert: ViewModifier {
    @Binding var ask: NoteDetailView.HostAsk?

    func body(content: Content) -> some View {
        content.alert(ask?.title ?? "", isPresented: Binding(get: { ask != nil }, set: { if !$0, let a = ask { a.answer(false); ask = nil } })) {
            Button("Don't Allow", role: .cancel) { ask?.answer(false); ask = nil }
            Button(ask?.allow ?? "Allow") { ask?.answer(true); ask = nil }
        } message: {
            Text(ask?.message ?? "")
        }
    }
}

#if os(macOS)
/// The open note's toolbar items, handed from the note pane to the toolbar that shows them.
///
/// The note pane is a new view for every note (`.id` in RootView: nothing of one note's state
/// reaches the next). A toolbar declared on the pane was a new toolbar for every note: each
/// item taken out of the window's toolbar and put back, and the Format, Share and More menus
/// built from nothing, pictures and all. That was about four fifths of the time between a click
/// on a note and the note (2026-10-11: 280 ms of main thread a note in a Debug build, 55 ms
/// without it). So the pane only makes its items, where their state is, and hands them up.
/// `NoteToolbarStage` stands in the detail column for as long as a note is open and shows them
/// in a toolbar that stays: the items are brought up to date in place, like any other view.
struct NoteToolbarParts: Equatable, @unchecked Sendable {
    /// Format, Checklist, Table, Attach; none for a note that is an app.
    var writing: AnyView?
    /// Who else is in a shared note.
    var people: AnyView?
    /// Share and More.
    var sharing: AnyView
    /// Views can't be compared: each time the pane works its items out, they count as new.
    let made = NoteToolbarParts.next()

    static func == (a: NoteToolbarParts, b: NoteToolbarParts) -> Bool { a.made == b.made }

    nonisolated(unsafe) private static var count = 0
    private static func next() -> Int {
        count += 1
        return count
    }
}

struct NoteToolbarKey: PreferenceKey {
    static var defaultValue: NoteToolbarParts? { nil }
    static func reduce(value: inout NoteToolbarParts?, nextValue: () -> NoteToolbarParts?) {
        value = nextValue() ?? value
    }
}

/// Where the note pane stands in the detail column, with the toolbar for its items. The pane
/// inside it comes and goes with each note; this view and its toolbar don't. (The toolbar has to
/// be on a view around the pane: put on the pane itself, also from outside its `.id`, the
/// column makes it again with every note.)
struct NoteToolbarStage<Pane: View>: View {
    @ViewBuilder let pane: Pane
    @State private var parts: NoteToolbarParts?
    /// The column's width, for lining the toolbar up with the note's text.
    @State private var width: CGFloat = 0

    /// How far in from each side of the column the toolbar's groups stand: the text's own margin,
    /// less the room the toolbar leaves at its edges anyway. In a wide window the groups stay over
    /// the reading column instead of out at the window's edges (Emil, 10-29: the Share group felt
    /// "a bit lonely" at the edge).
    /// None in a narrow window: the groups' own place at the edges is then about the text's.
    static func inset(column width: CGFloat) -> CGFloat? {
        let inset = PaneTextView.textSide(width: width) - edgeRoom
        return inset >= 36 ? inset : nil
    }
    /// What the toolbar leaves between the column's edge and its first group, and between two
    /// items, measured (MacWindowChromeTests).
    static var edgeRoom: CGFloat { 18 }

    var body: some View {
        let parts = $parts
        ZStack {
            // A turn after the pane made them. A pane that has just gone leaves the items as they
            // are: the next pane's are on their way, and without a note this view goes too.
            pane.onPreferenceChange(NoteToolbarKey.self) { if let made = $0 { parts.wrappedValue = made } }
        }
            .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width = $0 }
            .toolbar {
                if let shown = self.parts {
                    // Only the note's own controls (Emil's draft, 10-29): the writing tools on the
                    // left, share and more on the right, both over the note's text column. Compose
                    // sits with the list, search with the sidebar.
                    let inset = Self.inset(column: width)
                    if let inset {
                        ToolbarItem { Color.clear.frame(width: inset, height: 1) }
                            .sharedBackgroundVisibility(.hidden)
                    }
                    if let writing = shown.writing {
                        ToolbarItemGroup { writing }
                    }
                    ToolbarSpacer(.flexible)
                    if let people = shown.people {
                        ToolbarItem { people }
                    }
                    ToolbarItemGroup { shown.sharing }
                    if let inset {
                        ToolbarItem { Color.clear.frame(width: inset, height: 1) }
                            .sharedBackgroundVisibility(.hidden)
                    }
                }
            }
    }
}
#endif

/// A quiet notice on the app's warm tint, clearly apart from the page, with the app's own primary
/// button (2026-10-12: glass over the page blended in, and its yellow Recover glared).
struct TrashBanner: View {
    var recover: () -> Void

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        HStack(spacing: 12) {
            Image(systemName: "trash").foregroundStyle(Color.muted)
            Text("This note is in Recently Deleted.")
                .font(.callout)
                .foregroundStyle(Color.ink)
            Spacer(minLength: 8)
            Button("Recover", action: recover)
                .buttonStyle(.amberProminent)
                .fixedSize()
                .accessibilityIdentifier("editor.bannerRecover")
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.amberSoft, in: shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
        .padding(12)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("editor.trashBanner")
    }
}

/// A link that named a heading (`[[Budget#October]]`, `pinto:Budget#October`): the note it opens
/// scrolls there once its text is on screen. Kept only for the next note that opens.
@MainActor
final class LinkLanding {
    static let shared = LinkLanding()
    private var pending: (id: UUID, heading: String?, location: Int?)?

    func request(_ id: UUID, heading: String) { pending = (id, heading, nil) }
    /// A line of "Linked from" was opened: the note scrolls to the link on it.
    func request(_ id: UUID, location: Int) { pending = (id, nil, location) }

    /// The heading asked for in note `id`, once.
    func take(_ id: UUID) -> String? {
        guard let p = pending, p.id == id, let heading = p.heading else { return nil }
        pending = nil
        return heading
    }

    /// The place in its text asked for in note `id`, once.
    func takeLocation(_ id: UUID) -> Int? {
        guard let p = pending, p.id == id, let location = p.location else { return nil }
        pending = nil
        return location
    }
}

/// The notes a link opened, in order, so Back returns to the note or app the link was in, as a
/// link does in Notes on iPhone. Opening a note any other way (the list, a new note) ends it.
struct LinkTrail: Equatable {
    private(set) var stack: [UUID] = []
    /// The note a link or Back is opening right now.
    private var expected: UUID?

    /// Where Back goes.
    var previous: UUID? { stack.last }

    /// A link in `from` opened `to`.
    mutating func followed(from: UUID?, to: UUID) {
        guard let from, from != to else { return }
        stack.append(from)
        if stack.count > 50 { stack.removeFirst() }
        expected = to
    }

    /// Back: the note to open again, taken off the trail.
    mutating func back() -> UUID? {
        guard let p = stack.popLast() else { return nil }
        expected = p
        return p
    }

    /// The open note changed. Anything but a link or Back ends the trail.
    mutating func opened(_ id: UUID?) {
        if id == nil || id != expected { stack = [] }
        expected = nil
    }
}

#if os(iOS)
/// After a link: Back in the navigation bar returns to the note or app the link was in.
struct LinkBackButton: ViewModifier {
    /// The note Back returns to, or nil for the system's Back to the list.
    let title: String?
    let back: () -> Void

    func body(content: Content) -> some View {
        content
            .navigationBarBackButtonHidden(title != nil)
            .toolbar {
                if let title {
                    ToolbarItem(placement: .topBarLeading) {
                        Button(action: back) { Image(systemName: "chevron.backward") }
                            .accessibilityLabel("Back to \(title)")
                            .accessibilityIdentifier("note.linkBack")
                    }
                }
            }
    }
}
#endif
