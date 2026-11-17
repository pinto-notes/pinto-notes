import SwiftUI
import SwiftData
import UniformTypeIdentifiers
import WebKit

/// A canvas's own controls, over the drawing (direction B, "Dock", 13 November 2026):
/// - one floating dock centred at the foot: Undo and Redo, then the tools (Mac); the tools and the
///   style (iPhone, where Undo and Redo are in the navigation bar);
/// - a small bar floating just above the selection, for its colours, stroke, layer and the rest;
/// - the zoom, quiet at the bottom right (Mac), with − and + under the pointer.
/// All of it native; the drawing itself is the only web part (CanvasBridge).
struct CanvasOverlay: View {
    let canvas: CanvasController
    /// For the empty board's "Ask your AI to draw it".
    var targets: [AskAI.Target] = []
    /// Worked out only when Ask opens: it reads the board's whole text (the owner's sample had it
    /// on every redraw of the note's view, 17 November 2026).
    var subject: (() -> AskAI.Subject)?

    /// The board, as the overlay measures it (the selection bar, and the corner's tags kept inside it).
    static let space = "canvas.overlay"
    #if os(macOS)
    /// The map is on: the style panel stops above it.
    @AppStorage(CanvasMap.key) private var mapOn = false
    #endif

    var body: some View {
        ZStack {
            if canvas.connected {
                #if os(macOS)
                // The style of what's selected or drawn next, and what to do with the selection, at
                // the left: Excalidraw's full panel on a wide board, its compact strip on a narrower
                // one. Only the panel takes a click: the rest of the board stays the board's.
                if CanvasStyleSidebar.shows(canvas.state, viewOnly: canvas.viewOnly) {
                    GeometryReader { geo in
                        CanvasStyleSidebar(canvas: canvas, layout: CanvasStyleSidebar.layout(board: geo.size.width),
                                           height: geo.size.height - CanvasToolPalette.below - CanvasStyleSidebar.foot(map: mapOn))
                            .tint(Color(PColor.paneAccent))
                            // Under the tools' row, as Excalidraw's properties are under its top bar.
                            .padding(.leading, CanvasStyleSidebar.inset)
                            .padding(.top, CanvasToolPalette.below)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    }
                    .transition(.opacity)
                }
                #endif
                // Measured over the whole page, as the page measures the selection: on iPhone the
                // canvas runs under the bars, and inside the safe area the bar came out a band too
                // low, under the shape (the iPhone pictures, 13 November 2026).
                GeometryReader { geo in
                    #if os(iOS)
                    // The Mac has the style panel instead (Emil, 17 November 2026: "I don't like this
                    // thing. I prefer just having the style menu.").
                    if canvas.state.present == nil, canvas.state.showsSelectionBar, let bounds = canvas.state.bounds, CanvasSelectionBar.inView(bounds, area: geo.size) {
                        CanvasSelectionBar(canvas: canvas, bounds: bounds, area: geo.size)
                    }
                    #endif
                    if let h = canvas.highlight {
                        CanvasAIHighlight(highlight: h)
                            .transition(.opacity)
                    }
                    // A comment's thread, by its pin (BoardComments): placed as the page says.
                    if canvas.state.present == nil {
                        CanvasCommentAnchor(canvas: canvas, area: geo.size)
                    }
                }
                .animation(.easeOut(duration: 0.3), value: canvas.highlight)
                #if os(iOS)
                .ignoresSafeArea()
                #endif
                // A board shared with you to look at: nothing to start drawing with.
                if CanvasStart.shows(canvas.state), !canvas.viewOnly {
                    CanvasStart(canvas: canvas, targets: targets, subject: subject)
                        .transition(.opacity)
                }
                #if os(macOS)
                // The tools, at the top middle of the board, and Excalidraw's hint under them (Emil,
                // 17 November 2026: the tools on what they draw on; the window's toolbar keeps the
                // actions). Each takes clicks on itself only.
                if CanvasToolPalette.shows(canvas) {
                    GeometryReader { geo in
                        VStack(spacing: 8) {
                            CanvasToolPalette(canvas: canvas, width: geo.size.width)
                            // Not over a banner of someone presenting, or voting's.
                            if let hint = canvas.state.hint, canvas.followBanner == nil, !canvas.team.running,
                               let room = CanvasHint.room(board: geo.size.width) {
                                CanvasHint(text: hint)
                                    .frame(maxWidth: room)
                            }
                        }
                        .padding(.top, CanvasToolPalette.top)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    }
                }
                #endif
                // Presenting shows only the Present bar (round 6: the zoom and tools stayed).
                if canvas.state.present == nil {
                VStack(spacing: 0) {
                    Spacer(minLength: 0)
                    #if os(macOS)
                    // The tools are in the window's toolbar, where a note's are (Emil, 13 November
                    // 2026: "why can't it be at the top like it is for notes"). The zoom stays here.
                    HStack {
                        // Excalidraw's corner: the map's switch, the zoom, Undo and Redo (Emil, 17
                        // November 2026).
                        CanvasCorner(canvas: canvas)
                        Spacer(minLength: 0)
                        // Offline, back and synced, across from them (round 12).
                        BoardSyncLine()
                    }
                    .padding(.leading, CanvasMap.left)
                    .overlay {
                        if let notice = canvas.notice {
                            Toast(text: notice, undo: canvas.noticeUndo)
                                .transition(.opacity)
                                .accessibilityIdentifier("canvas.notice")
                        } else if canvas.state.lost {
                            CanvasBackToContent(canvas: canvas)
                                .transition(.opacity)
                        }
                    }
                    .animation(.smooth(duration: 0.2), value: canvas.notice)
                    .animation(.easeOut(duration: 0.15), value: canvas.state.lost)
                    .padding(.trailing, 16)
                    .padding(.bottom, CanvasDock.margin)
                    #else
                    if canvas.state.lost {
                        CanvasBackToContent(canvas: canvas)
                            .padding(.bottom, 8)
                            .transition(.opacity)
                    }
                    // Offline, back and synced, above the dock (round 12).
                    BoardSyncLine()
                        .padding(.bottom, 8)
                    // Comments (BoardCommentPhone): the Comment tool's bar, the list, a viewer's button.
                    CanvasPhoneComments(canvas: canvas)
                    if !canvas.viewOnly {
                        CanvasDock(canvas: canvas)
                            .padding(.bottom, CanvasDock.margin)
                    }
                    #endif
                }
                }
                if let p = canvas.state.present {
                    if let frame = p.frame {
                        CanvasPresentMask(frame: frame, light: canvas.background)
                            .transition(.opacity)
                    }
                    VStack {
                        Spacer(minLength: 0)
                        CanvasPresentBar(canvas: canvas, step: p)
                            .padding(.bottom, 20)
                    }
                    .transition(.opacity)
                }
                // Someone presenting on a shared board, or whom you follow (BoardFollow).
                CanvasFollowBanner(canvas: canvas)
                // Voting and the timer of a team session (BoardTeam).
                CanvasTeamBar(canvas: canvas)
            }
        }
        // The selection bar's space too: it measures the board from the same corner.
        .coordinateSpace(.named(Self.space))
        .animation(.easeOut(duration: 0.2), value: canvas.state.present == nil)
        // Presenting takes the window (Full Screen), and gives it back after.
        .onChange(of: canvas.state.present == nil) { _, stopped in
            NotificationCenter.default.post(name: .paneCanvasPresenting, object: !stopped)
        }
        #if os(macOS)
        // Presenting shows only the Present bar: the window's toolbar goes too (round 7, 25-present-1).
        .background(WindowToolbarHider(hidden: canvas.state.present != nil))
        #endif
        .sheet(isPresented: Binding(get: { canvas.choosingNote }, set: { canvas.choosingNote = $0 })) {
            CanvasNotePicker(canvas: canvas)
        }
    }
}

#if os(macOS)
/// Hides the window's toolbar while `hidden`, and shows it again after (only if it hid it).
struct WindowToolbarHider: NSViewRepresentable {
    let hidden: Bool

    final class Probe: NSView {
        var hid = false
        // It only finds the window: never in the way of a click (round 9, on the Air: it lay over
        // the whole board and took every click).
        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        func apply(_ hidden: Bool) {
            guard let toolbar = window?.toolbar else { return }
            if hidden, toolbar.isVisible { toolbar.isVisible = false; hid = true }
            else if !hidden, hid { toolbar.isVisible = true; hid = false }
        }
    }

    func makeNSView(context: Context) -> Probe { Probe() }
    func updateNSView(_ v: Probe, context: Context) {
        let hidden = hidden
        DispatchQueue.main.async { v.apply(hidden) }
    }
    static func dismantleNSView(_ v: Probe, coordinator: ()) { v.apply(false) }
}
#endif

extension Notification.Name {
    /// A board started (true) or stopped (false) presenting.
    static let paneCanvasPresenting = Notification.Name("pane.canvasPresenting")
}

/// While presenting a frame, the rest of the board is covered in the board's own colour, so only
/// the frame shows (whiteboard council, round 6: the next frame's edge showed beside it). The
/// pointer goes through it, to the laser.
struct CanvasPresentMask: View {
    /// Solid: nothing of the next frame shows through (round 13, 25-present-1: at 96% its words
    /// read faintly at the right edge).
    static let opacity: Double = 1
    let frame: CGRect
    /// The board's background as stored (light; dark mode shows it dark).
    let light: String
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        // As the board shows it (dark mode turns the light colour dark).
        let fill = CanvasStyle.shown(light, dark: scheme == .dark) ?? (scheme == .dark ? .black : .white)
        GeometryReader { geo in
            Path { p in
                p.addRect(CGRect(origin: .zero, size: geo.size))
                p.addRoundedRect(in: frame.insetBy(dx: -12, dy: -12), cornerSize: CGSize(width: 8, height: 8))
            }
            .fill(fill.opacity(Self.opacity), style: FillStyle(eoFill: true))
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// Presenting a board: which frame of how many, its name, back and next, and Done (whiteboard
/// council, rounds 4 and 5: "frames, and next and previous for walking a board through in a call").
/// The arrow keys, Space and Escape do the same on the board.
struct CanvasPresentBar: View {
    let canvas: CanvasController
    let step: CanvasState.Presenting

    static let startTitle = "Present"
    static func position(_ s: CanvasState.Presenting) -> String { "\(s.index + 1) of \(s.count)" }

    var body: some View {
        HStack(spacing: 4) {
            Button { canvas.send(.present(.prev)) } label: { Image(systemName: "chevron.left").frame(width: 28, height: 28).contentShape(Circle()) }
                .hoverHighlight(Circle())
                .disabled(step.index == 0)
                .help("Previous (\u{2190})")
                .accessibilityLabel("Previous")
                .accessibilityIdentifier("canvas.present.prev")
            VStack(spacing: 1) {
                Text(step.name).font(.system(size: 13, weight: .semibold)).lineLimit(1)
                Text(Self.position(step)).font(.system(size: 11)).foregroundStyle(.secondary).monospacedDigit()
            }
            .frame(minWidth: 120)
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("canvas.present.step")
            Button { canvas.send(.present(.next)) } label: { Image(systemName: "chevron.right").frame(width: 28, height: 28).contentShape(Circle()) }
                .hoverHighlight(Circle())
                .disabled(step.index >= step.count - 1)
                .help("Next (\u{2192} or Space)")
                .accessibilityLabel("Next")
                .accessibilityIdentifier("canvas.present.next")
            // Who follows you on a shared board (BoardFollow).
            CanvasFollowers(canvas: canvas)
            // The laser, lit while it's on (round 6: nothing showed it was on).
            let laser = canvas.state.tool == .laser
            Button { canvas.send(.tool(laser ? .selection : .laser)) } label: {
                Image(systemName: "cursorarrow.rays")
                    .foregroundStyle(laser ? Color.white : Color.primary)
                    .frame(width: 28, height: 28)
                    .background(laser ? Color.red : Color.clear, in: .circle)
            }
            .hoverHighlight(Circle())
            .help(laser ? "Laser pointer on (K)" : "Laser pointer (K)")
            .accessibilityLabel("Laser pointer")
            .accessibilityValue(laser ? "On" : "Off")
            .accessibilityIdentifier("canvas.present.laser")
            .padding(.leading, 6)
            // The frames' order, to change it or jump to one (round 7).
            if !canvas.state.frames.isEmpty {
                Button { canvas.showingPresentOrder.toggle() } label: { Image(systemName: "list.number").frame(width: 28, height: 28).contentShape(Circle()) }
                    .hoverHighlight(Circle())
                    .help(CanvasPresentOrder.help)
                    .accessibilityLabel(CanvasPresentOrder.title)
                    .accessibilityIdentifier("canvas.present.order")
                    .popover(isPresented: Bindable(canvas).showingPresentOrder, arrowEdge: .top) {
                        CanvasPresentOrder(canvas: canvas)
                            .presentationCompactAdaptation(.popover)
                    }
            }
            Button("Done") { canvas.showingPresentOrder = false; canvas.send(.present(.stop)) }
                .buttonStyle(.hoverText)
                .help("Stop presenting (Esc)")
                .accessibilityIdentifier("canvas.present.done")
                .padding(.leading, 8)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.regularMaterial, in: .capsule)
        .overlay(Capsule().strokeBorder(Color.primary.opacity(0.08)))
        .shadow(color: .black.opacity(0.12), radius: 10, y: 3)
    }
}

/// The order Present walks the board's frames in (round 7: it was only the order they were made):
/// drag a frame up or down, or Move Up and Move Down; click one to present it. The order is kept in
/// the board (each frame's `customData.presentOrder`), so it saves and an AI reading it sees it.
struct CanvasPresentOrder: View {
    let canvas: CanvasController

    static let title = "Order"
    static let help = "The order frames are presented in"
    static let moveUp = "Move Up"
    static let moveDown = "Move Down"
    static let fromHere = "Present from Here"

    /// The ids with `source` moved to before `destination`, as List's onMove gives them.
    static func moved(_ ids: [String], from source: IndexSet, to destination: Int) -> [String] {
        var out = ids
        out.move(fromOffsets: source, toOffset: destination)
        return out
    }
    /// The ids with the one at `index` one place earlier (`by: -1`) or later (`by: 1`); nil at an end.
    static func moved(_ ids: [String], at index: Int, by step: Int) -> [String]? {
        let to = index + step
        guard ids.indices.contains(index), ids.indices.contains(to) else { return nil }
        var out = ids
        out.swapAt(index, to)
        return out
    }

    var body: some View {
        let frames = canvas.state.frames, ids = frames.map(\.id)
        let showing = canvas.state.present.flatMap { $0.index < frames.count ? frames[$0.index].id : nil }
        VStack(alignment: .leading, spacing: 0) {
            Text(Self.title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.muted)
                .padding(.horizontal, 14)
                .padding(.top, 10)
                .accessibilityAddTraits(.isHeader)
            List {
                ForEach(Array(frames.enumerated()), id: \.element.id) { i, frame in
                    Button { canvas.send(.presentFrom(frame.id)) } label: {
                        HStack(spacing: 8) {
                            Text("\(i + 1)").monospacedDigit().foregroundStyle(.secondary).frame(minWidth: 16, alignment: .trailing)
                            Text(frame.name).lineLimit(1).fontWeight(frame.id == showing ? .semibold : .regular)
                            Spacer(minLength: 0)
                        }
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .hoverRow("present.\(frame.id)")
                    .contextMenu {
                        Button(Self.moveUp) { move(ids, i, -1) }.disabled(i == 0)
                        Button(Self.moveDown) { move(ids, i, 1) }.disabled(i == ids.count - 1)
                    }
                    .accessibilityLabel("\(i + 1). \(frame.name)")
                    .accessibilityAction(named: Self.moveUp) { move(ids, i, -1) }
                    .accessibilityAction(named: Self.moveDown) { move(ids, i, 1) }
                    .accessibilityIdentifier("canvas.present.order.frame")
                }
                .onMove { canvas.send(.presentOrder(Self.moved(ids, from: $0, to: $1))) }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .frame(width: 240, height: min(CGFloat(max(frames.count, 1)) * 28 + 12, 320))
        }
        .padding(.bottom, 6)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canvas.present.orderList")
    }

    private func move(_ ids: [String], _ i: Int, _ step: Int) {
        if let next = Self.moved(ids, at: i, by: step) { canvas.send(.presentOrder(next)) }
    }
}

/// Pictures dropped on a board: image files from Finder, or an image dragged from another app.
@MainActor enum CanvasImageDrop {
    /// Pictures, a library item from the Library popover, and Excalidraw library files.
    static let types: [UTType] = [.fileURL, .image, CanvasLibraryDrag.type]

    /// Done when what was dropped is on the board (tests wait for it).
    @discardableResult
    static func place(_ providers: [NSItemProvider], at point: CGPoint, on canvas: CanvasController, library: CanvasLibrary = .shared) -> Task<Void, Never> {
        Task { @MainActor in
            // A library item: where it's dropped.
            if let item = await CanvasLibraryDrag.item(from: providers, in: library) {
                canvas.insert(item, at: point)
                return
            }
            var placed = 0
            var libraries: [URL] = []
            for p in providers.prefix(10) {
                // An Excalidraw library file goes into the library, as Excalidraw takes one dropped on it.
                if let url = await fileURL(p), url.pathExtension.lowercased() == CanvasLibraryFile.fileExtension { libraries.append(url); continue }
                guard let data = await load(p) else { continue }
                guard let image = await Task.detached(priority: .userInitiated, operation: { CanvasImage(data: data) }).value else { continue }
                // Several at once: each a little lower and to the right of the last.
                canvas.send(.image(image, at: CGPoint(x: point.x + CGFloat(placed) * 28, y: point.y + CGFloat(placed) * 28)))
                placed += 1
            }
            if !libraries.isEmpty { CanvasLibraryImport.run(libraries, canvas: canvas, library: library); return }
            if placed == 0 { canvas.confirm("Only notes and pictures can go on a whiteboard") }
        }
    }

    private static func fileURL(_ p: NSItemProvider) async -> URL? {
        guard p.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) else { return nil }
        return await withCheckedContinuation { done in
            _ = p.loadObject(ofClass: URL.self) { url, _ in done.resume(returning: url) }
        }
    }

    private static func load(_ p: NSItemProvider) async -> Data? {
        if p.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) {
            let url = await fileURL(p)
            if let url, (UTType(filenameExtension: url.pathExtension)?.conforms(to: .image) ?? false) { return try? Data(contentsOf: url) }
            return nil
        }
        guard p.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { return nil }
        return await withCheckedContinuation { done in
            _ = p.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { d, _ in done.resume(returning: d) }
        }
    }
}

/// Notes dragged from the note list onto a board: a card for each, where they're dropped.
@MainActor enum CanvasNoteDrop {
    static func carriesNotes(_ providers: [NSItemProvider]) -> Bool {
        providers.contains { $0.hasItemConformingToTypeIdentifier(UTType.paneItem.identifier) }
    }

    static func place(_ providers: [NSItemProvider], at point: CGPoint, on canvas: CanvasController) {
        Task { @MainActor in
            var data: [Data] = []
            for p in providers where p.hasItemConformingToTypeIdentifier(UTType.paneItem.identifier) {
                let d: Data? = await withCheckedContinuation { done in
                    _ = p.loadDataRepresentation(forTypeIdentifier: UTType.paneItem.identifier) { d, _ in done.resume(returning: d) }
                }
                if let d { data.append(d) }
            }
            let ids = EditorController.draggedNotes(data).filter { $0 != canvas.noteID }
            guard !ids.isEmpty else { canvas.confirm("Only notes and pictures can go on a whiteboard"); return }
            canvas.addCards(ids, at: point)
        }
    }
}

/// Add Note Card…: find a note by its title and put it on the board as a card. Return takes the
/// first, as Go to Note does.
struct CanvasNotePicker: View {
    let canvas: CanvasController
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var entries: [WikiIndex.Entry] = []
    @FocusState private var focused: Bool

    static let title = "Add a note to the board"

    /// The notes whose titles hold what's typed: those starting with it first, then the rest,
    /// each lot newest first. Everything, newest first, before anything is typed. Never the board.
    static func matches(_ entries: [WikiIndex.Entry], query: String, excluding: UUID?, limit: Int = 60) -> [WikiIndex.Entry] {
        let q = WikiLinks.key(query.trimmingCharacters(in: .whitespaces))
        let live = entries.filter { $0.id != excluding && !$0.title.isEmpty }.sorted { $0.updated > $1.updated }
        guard !q.isEmpty else { return Array(live.prefix(limit)) }
        let starts = live.filter { WikiLinks.key($0.title).hasPrefix(q) }
        let contains = live.filter { let k = WikiLinks.key($0.title); return !k.hasPrefix(q) && k.contains(q) }
        return Array((starts + contains).prefix(limit))
    }

    var body: some View {
        let found = Self.matches(entries, query: query, excluding: canvas.noteID)
        VStack(alignment: .leading, spacing: 12) {
            Text(Self.title)
                .font(.headline)
            TextField("Search notes", text: $query)
                .textFieldStyle(.roundedBorder)
                .focused($focused)
                .onSubmit { if let first = found.first { pick(first.id) } }
                .accessibilityIdentifier("canvas.notePicker.search")
            List(found, id: \.id) { e in
                Button { pick(e.id) } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "doc.text")
                            .foregroundStyle(Color.amberInk)
                        Text(e.title)
                            .lineLimit(1)
                            .foregroundStyle(Color.ink)
                        Spacer(minLength: 8)
                        if let folder = e.folders.last {
                            Text(folder)
                                .lineLimit(1)
                                .foregroundStyle(Color.muted)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .hoverRow("notePicker.\(e.id)")
                .accessibilityIdentifier("canvas.notePicker.note")
            }
            .listStyle(.plain)
            .overlay {
                if found.isEmpty {
                    Text(query.isEmpty ? "No notes yet" : "No note has \u{201C}\(query)\u{201D} in its title")
                        .foregroundStyle(Color.muted)
                }
            }
            HStack {
                Spacer()
                Button("Cancel", role: .cancel) { dismiss() }
                    .keyboardShortcut(.cancelAction)
            }
        }
        .padding(20)
        #if os(macOS)
        .frame(width: 440, height: 460)
        #endif
        .onAppear {
            entries = WikiDirectory.index(context).entries
            focused = true
        }
        .accessibilityIdentifier("canvas.notePicker")
    }

    private func pick(_ id: UUID) {
        canvas.addCards([id])
        dismiss()
    }
}

/// Around what an AI just drew: an accent outline and its name at the top left, for a few
/// seconds. The receipt at the foot says it too, with Undo.
struct CanvasAIHighlight: View {
    let highlight: CanvasController.Highlight

    /// The outlines: one per thing the AI added or changed.
    var outlines: [CGRect] {
        (highlight.boxes.isEmpty ? [highlight.rect] : highlight.boxes).map { $0.insetBy(dx: -6, dy: -6) }
    }

    typealias Line = CanvasController.Highlight.Line

    /// How far the name tag keeps from everything else drawn: shapes, words, arrows and their
    /// heads (round 10, 16: "ChatGPT" sat against the head of the arrow coming into the shape).
    static let clearance: CGFloat = 8
    static let tagHeight: CGFloat = 22

    /// The tag's width for a name: its mark, the name in 12 pt semibold, and its padding. A
    /// person's tag has no mark.
    static func tagWidth(_ name: String, mark: Bool = true) -> CGFloat {
        #if os(macOS)
        let font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        #else
        let font = UIFont.systemFont(ofSize: 12, weight: .semibold)
        #endif
        return 8 + (mark ? 12 + 5 : 0) + ceil((name as NSString).size(withAttributes: [.font: font]).width) + 8
    }

    /// The hand-drawn letters and strokes reach past the boxes the engine gives them by a few
    /// points: the tag keeps its clearance from where they're drawn (round 13, 12-ai-drew: "ChatGPT"
    /// sat a hair from the end of the how-to line, the third round running).
    static let inkReach: CGFloat = 4

    /// Where the tag goes for this highlight, clear of everything drawn.
    static func tag(for h: CanvasController.Highlight, outlines: [CGRect]) -> CGPoint {
        tag(over: outlines, avoiding: h.near.map { $0.insetBy(dx: -inkReach, dy: -inkReach) }, lines: h.lines,
            rows: h.rows.map { $0.insetBy(dx: -inkReach, dy: -inkReach) }, in: h.view,
            width: tagWidth(h.by, mark: h.kind == .ai || h.kind == .device))
    }

    /// How far along a line of words the tag counts as on its row: closer than this beside it, it
    /// reads as the line's last word (round 15, 12-ai-drew: 8 pt past "…to add an arrow.").
    static let rowReach: CGFloat = 120

    /// Whether a tag here would sit on a row of words: beside one of them, overlapping its height.
    static func sharesRow(_ r: CGRect, with rows: [CGRect]) -> Bool {
        rows.contains { w in
            r.minY < w.maxY && w.minY < r.maxY && max(w.minX - r.maxX, r.minX - w.maxX) < rowReach
        }
    }

    /// Where the name tag's top-left corner goes: above the topmost outline, 4 pt off it (round 3,
    /// 16: it covered a shape's corner), and at least `clearance` from every other shape, word,
    /// line, arrow and arrowhead (rounds 4, 7, 8 and 10, 16). The first clear spot of: above at
    /// its left end, then slid along above it (over it a while it fits its width, then staying over
    /// it by 24 pt), beside it at its top, slid down its side, then below it; in the view. With no
    /// clear spot, the roomiest one. Never on a row of words (`rows`, also in `near`) when there's
    /// a clear spot that isn't (round 15).
    static func tag(over outlines: [CGRect], avoiding near: [CGRect] = [], lines: [Line] = [], rows: [CGRect] = [], in view: CGSize? = nil, width: CGFloat = 96) -> CGPoint {
        guard let top = outlines.min(by: { ($0.minY, $0.minX) < ($1.minY, $1.minX) }) else { return .zero }
        let h = tagHeight, keep = min(24, width / 2)
        let above = top.minY - 4 - h, below = top.maxY + 4
        var spots: [(p: CGPoint, cost: CGFloat)] = []
        for dx in stride(from: CGFloat(0), through: width + top.width, by: 2) {
            for x in Set([top.minX - dx, top.minX + dx]) where x >= top.minX - width + keep && x <= top.maxX - keep {
                let over = x >= top.minX && x + width <= top.maxX
                spots.append((CGPoint(x: x, y: above), over ? dx / 2 : dx))
                spots.append((CGPoint(x: x, y: below), dx + 80))
            }
        }
        for dy in stride(from: CGFloat(0), through: max(0, top.height - h), by: 2) {
            spots.append((CGPoint(x: top.minX - 6 - width, y: top.minY + dy), 60 + dy))
            spots.append((CGPoint(x: top.maxX + 6, y: top.minY + dy), 60 + dy))
        }
        let inView = spots.filter { s in
            s.p.x >= 4 && s.p.y >= 4 && view.map { s.p.x + width <= $0.width - 4 && s.p.y + h <= $0.height - 4 } ?? true
        }.sorted { $0.cost < $1.cost }
        let others = outlines.filter { $0 != top } + near
        let rect = { (p: CGPoint) in CGRect(x: p.x, y: p.y, width: width, height: h) }
        let clear = inView.filter { gap(rect($0.p), to: others, lines: lines) >= clearance }
        if let off = clear.first(where: { !sharesRow(rect($0.p), with: rows) }) { return off.p }
        if let clear = clear.first { return clear.p }
        let roomiest = inView.max { gap(rect($0.p), to: others, lines: lines) < gap(rect($1.p), to: others, lines: lines) }
        return roomiest?.p ?? CGPoint(x: max(4, top.minX), y: above >= 4 ? above : below)
    }

    /// How far a rect is from the nearest of these boxes and drawn lines (0 when it touches one).
    static func gap(_ r: CGRect, to boxes: [CGRect], lines: [Line]) -> CGFloat {
        var least = CGFloat.infinity
        for b in boxes {
            let dx = max(0, b.minX - r.maxX, r.minX - b.maxX), dy = max(0, b.minY - r.maxY, r.minY - b.maxY)
            least = min(least, hypot(dx, dy))
        }
        for l in lines {
            if l.points.count == 1 { least = min(least, max(0, distance(l.points[0], r) - l.radius)) }
            for i in l.points.indices.dropLast() { least = min(least, max(0, distance(r, l.points[i], l.points[i + 1]) - l.radius)) }
        }
        return least
    }

    static func distance(_ p: CGPoint, _ r: CGRect) -> CGFloat {
        hypot(max(0, r.minX - p.x, p.x - r.maxX), max(0, r.minY - p.y, p.y - r.maxY))
    }

    static func distance(_ p: CGPoint, _ a: CGPoint, _ b: CGPoint) -> CGFloat {
        let dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy
        let t = len == 0 ? 0 : min(1, max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len))
        return hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
    }

    /// From a rect to a line segment: 0 when they meet.
    static func distance(_ r: CGRect, _ a: CGPoint, _ b: CGPoint) -> CGFloat {
        if r.contains(a) || r.contains(b) { return 0 }
        let corners = [CGPoint(x: r.minX, y: r.minY), CGPoint(x: r.maxX, y: r.minY), CGPoint(x: r.maxX, y: r.maxY), CGPoint(x: r.minX, y: r.maxY)]
        func cross(_ o: CGPoint, _ p: CGPoint, _ q: CGPoint) -> CGFloat { (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x) }
        for i in 0..<4 {
            let c = corners[i], d = corners[(i + 1) % 4]
            if cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0 { return 0 }
        }
        return min(distance(a, r), distance(b, r), corners.map { distance($0, a, b) }.min() ?? .infinity)
    }

    @Environment(\.colorScheme) private var scheme

    /// The outline's and tag's colour: the accent for an AI and a search's match, the person's own
    /// colour (as their pointer has it on this board), grey for your other device.
    var tint: Color {
        switch highlight.kind {
        case .ai, .found: Color.paneAccent
        case .person(let color, let dark): BoardCommentUI.color(scheme == .dark ? dark : color)
        case .device: Color.secondary
        }
    }

    /// What a screen reader hears.
    static func spoken(_ h: CanvasController.Highlight) -> String {
        switch h.kind {
        case .ai: "\(h.by) drew this"
        case .person: "\(h.by) changed this"
        case .device: "Changed on \(h.by)"
        case .found: "Found here"
        }
    }

    /// Another device's symbol by its name.
    static func deviceSymbol(_ name: String) -> String {
        name.localizedCaseInsensitiveContains("iPhone") ? "iphone" : name.localizedCaseInsensitiveContains("iPad") ? "ipad"
            : name.localizedCaseInsensitiveContains("Mac") ? "laptopcomputer" : "macbook.and.iphone"
    }

    var body: some View {
        let boxes = outlines
        let kind = highlight.kind
        let at = Self.tag(for: highlight, outlines: boxes)
        // A person's or a device's change is quieter than an AI's: thinner, solid, no wash.
        let quiet = kind.quiet
        ZStack {
            ForEach(Array(boxes.enumerated()), id: \.offset) { _, r in
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .strokeBorder(tint.opacity(kind == .device ? 0.8 : 1), style: quiet ? StrokeStyle(lineWidth: 1.5) : StrokeStyle(lineWidth: 2, dash: [6, 4]))
                    .background(tint.opacity(quiet ? 0.03 : 0.05), in: .rect(cornerRadius: 8, style: .continuous))
                    .frame(width: max(r.width, 20), height: max(r.height, 20))
                    .position(x: r.midX, y: r.midY)
            }
            if kind != .found {
                HStack(spacing: 5) {
                    switch kind {
                    case .ai: AIGlyph(ai: highlight.by, size: 12, monochrome: true)
                    case .device: Image(systemName: Self.deviceSymbol(highlight.by)).font(.system(size: 10, weight: .semibold)).frame(width: 12)
                    default: EmptyView()
                    }
                    Text(highlight.by)
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .frame(height: 22)
                .background(kind == .device ? Color(white: scheme == .dark ? 0.38 : 0.48) : tint, in: Capsule())
                .fixedSize()
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .offset(x: at.x, y: at.y)
                .accessibilityIdentifier("canvas.highlight.tag")
            }
        }
        .allowsHitTesting(false)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Self.spoken(highlight))
        .accessibilityIdentifier(kind == .ai ? "canvas.aiHighlight" : "canvas.highlight")
    }
}

// MARK: An empty whiteboard

/// On an empty whiteboard: draw, or start from a template, or ask your AI (Emil, 13 November 2026).
/// Blank costs nothing: picking a drawing tool or drawing puts it away; a template comes in as one
/// step Undo takes back.
struct CanvasStart: View {
    let canvas: CanvasController
    /// The connected AIs, and what they'd be asked about (this whiteboard): the last line asks
    /// one to draw (whiteboard council, round 1: "make the AI line an action").
    var targets: [AskAI.Target] = []
    /// Worked out only when Ask opens (CanvasOverlay.subject).
    var subject: (() -> AskAI.Subject)?
    /// Your own templates, after the built-in ones.
    var templates: WhiteboardTemplates = .shared
    @State private var asking: AskAI.Target?
    @State private var renaming: CanvasLibraryItem?
    @State private var nameDraft = ""
    @State private var deleting: CanvasLibraryItem?
    @State private var showingAll = false

    static func shows(_ s: CanvasState) -> Bool { s.empty && !s.busy && !s.editing && !s.tool.draws && s.tool != .eraser }

    static let askTitle = "Ask your AI to draw it\u{2026}"
    static func askTitle(_ t: AskAI.Target) -> String { "Ask \(t.ai) to draw it\u{2026}" }
    static let connectTitle = "Connect an AI to draw it for you\u{2026}"
    static let importTitle = "Import Excalidraw files\u{2026}"
    static let yourTemplatesTitle = "Your templates"
    static let moreTitle = "More\u{2026}"
    static let renameTitle = "Rename\u{2026}"
    static let deleteTitle = "Delete"
    static func deleteQuestion(_ name: String) -> String { "Delete \u{201C}\(name)\u{201D}?" }
    static let deleteMessage = "It\u{2019}s removed from your templates. Boards made from it keep their drawing. Undo brings it back."

    var body: some View {
        VStack(spacing: 16) {
            Text("Draw anything, or start from a template")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.muted)
            templateRow(WhiteboardTemplate.first)
            // FigJam's other everyday boards, in a row of their own under a quiet heading, as
            // your own templates are (round 12).
            VStack(spacing: 10) {
                Self.rowHeading(Self.moreTemplatesTitle)
                templateRow(WhiteboardTemplate.more)
            }
            .frame(width: Self.rowWidth)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Self.moreTemplatesTitle)
            .accessibilityIdentifier("canvas.moreTemplates")
            if !templates.items.isEmpty { yours }
            ask
            #if os(macOS)
            // Coming from Excalidraw: bring the old boards along from here (whiteboard council,
            // round 4: "an import entry on the empty board").
            Button(Self.importTitle) { CanvasImport.pick() }
                .buttonStyle(.hoverLink)
                .font(.system(size: 12))
                .foregroundStyle(Color.muted)
                .accessibilityIdentifier("canvas.import")
            #endif
        }
        .padding(20)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Start this whiteboard")
        .accessibilityIdentifier("canvas.start")
    }

    /// A row of the built-in templates' tiles.
    private func templateRow(_ row: [WhiteboardTemplate]) -> some View {
        HStack(spacing: 10) {
            ForEach(row) { t in
                Self.tile(t.title) { CanvasTemplatePreview(template: t) } action: { canvas.insert(t) }
                    .help("Start from \(t.inSentence)")
                    .accessibilityIdentifier("canvas.template.\(t.rawValue)")
            }
        }
    }

    static let moreTemplatesTitle = "More templates"
    /// Five tiles and the gaps between them.
    static let rowWidth: CGFloat = 116 * 5 + 10 * 4

    /// The quiet heading over a row of tiles ("More templates", "Your templates").
    static func rowHeading(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Color.muted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader)
    }

    /// A template's tile: its drawing small, its name under it.
    static func tile<Preview: View>(_ title: String, @ViewBuilder preview: () -> Preview, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 8) {
                preview()
                    .frame(width: 92, height: 58)
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .padding(.horizontal, 6)
            }
            .padding(.vertical, 10)
            .frame(width: 116)
            .contentShape(.rect(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .background(Color.card, in: .rect(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color.primary.opacity(0.08)))
        .hoverHighlight(.rect(cornerRadius: 14))
        .accessibilityLabel(title)
    }

    /// Your own templates: one row at most, the last place More… when there are more (a grid).
    private var yours: some View {
        let row = templates.row
        return VStack(spacing: 10) {
            Self.rowHeading(Self.yourTemplatesTitle)
            HStack(spacing: 10) {
                ForEach(row.items) { yourTile($0) }
                if row.more {
                    Button { showingAll = true } label: {
                        VStack(spacing: 8) {
                            Image(systemName: "square.grid.2x2")
                                .font(.system(size: 22, weight: .regular))
                                .foregroundStyle(Color.muted)
                                .frame(width: 92, height: 58)
                            Text("\(Self.moreTitle) (\(templates.items.count))")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color.ink)
                        }
                        .padding(.vertical, 10)
                        .frame(width: 116)
                        .contentShape(.rect(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
                    .background(Color.card, in: .rect(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Color.primary.opacity(0.08)))
                    .hoverHighlight(.rect(cornerRadius: 14))
                    .help("All your templates")
                    .accessibilityLabel("More templates")
                    .accessibilityIdentifier("canvas.yourTemplates.more")
                    .popover(isPresented: $showingAll, arrowEdge: .bottom) { allTemplates }
                }
                Spacer(minLength: 0)
            }
        }
        .frame(width: Self.rowWidth)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Self.yourTemplatesTitle)
        .accessibilityIdentifier("canvas.yourTemplates")
        .alert(Self.renameTitle, isPresented: Binding(get: { renaming != nil }, set: { if !$0 { renaming = nil } })) {
            TextField("Name", text: $nameDraft)
            Button("Cancel", role: .cancel) { renaming = nil }
            Button("Rename") {
                if let r = renaming { templates.rename(r.id, to: nameDraft) }
                renaming = nil
            }
        }
        .confirmationDialog(deleting.map { Self.deleteQuestion($0.name ?? "") } ?? "", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }), titleVisibility: .visible) {
            Button(Self.deleteTitle, role: .destructive) {
                if let d = deleting { canvas.deleteTemplate(d.id, templates) }
                deleting = nil
            }
        } message: {
            Text(Self.deleteMessage)
        }
    }

    /// One of yours: click puts it in; right-click renames or deletes it.
    private func yourTile(_ item: CanvasLibraryItem) -> some View {
        let name = item.name ?? "Template"
        return Self.tile(name) { CanvasSketchView(sketch: CanvasSketch(elements: item.elements)) } action: {
            showingAll = false
            canvas.insertTemplate(item)
        }
        .help("Start from \(name)")
        .contextMenu { Self.tileMenu(rename: { nameDraft = name; renaming = item }, delete: { deleting = item }) }
        .accessibilityIdentifier("canvas.yourTemplate.\(item.id)")
    }

    /// A tile's right-click menu.
    @ViewBuilder static func tileMenu(rename: @escaping () -> Void, delete: @escaping () -> Void) -> some View {
        Button(renameTitle, systemImage: "pencil", action: rename)
        Divider()
        DestructiveMenuButton(deleteTitle, systemImage: "trash", action: delete)
    }

    /// Every one of yours in a grid (More…).
    private var allTemplates: some View {
        ScrollView {
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(116), spacing: 10), count: 4), spacing: 10) {
                ForEach(templates.items) { yourTile($0) }
            }
            .padding(14)
        }
        .frame(width: 116 * 4 + 10 * 3 + 28, height: min(CGFloat((templates.items.count + 3) / 4) * 112 + 28, 420))
        .accessibilityIdentifier("canvas.yourTemplates.all")
    }

    @ViewBuilder private var ask: some View {
        Group {
            if let subject, targets.count == 1, let t = targets.first {
                Button { asking = t } label: {
                    Label { Text(Self.askTitle(t)) } icon: { AIGlyph(ai: t.ai, size: 14, monochrome: true) }
                }
                .askAIPopover($asking, subject: subject(), arrowEdge: .bottom)
            } else if let subject, targets.count > 1 {
                Menu {
                    ForEach(targets) { t in Button(AskAI.submenuItem(t)) { asking = t } }
                } label: {
                    Label(Self.askTitle, systemImage: "sparkles")
                }
                .menuStyle(.button)
                #if os(macOS)
                .menuIndicator(.hidden)
                #endif
                .fixedSize()
                .askAIPopover($asking, subject: subject(), arrowEdge: .bottom)
            } else {
                Button { NotificationCenter.default.post(name: .paneConnectAI, object: nil) } label: {
                    Label(Self.connectTitle, systemImage: "sparkles")
                }
            }
        }
        .buttonStyle(.hoverLink)
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(Color.amberInk)
        .accessibilityIdentifier("canvas.ask")
    }
}

/// A template's shapes drawn small, in their colours, for its tile on an empty whiteboard (round
/// 1 of the whiteboard council: "show a preview, not a glyph").
struct CanvasTemplatePreview: View {
    let template: WhiteboardTemplate
    var body: some View { CanvasSketchView(sketch: CanvasSketch(elements: template.elements)) }
}

/// A board's shapes drawn small: boxes, ellipses and diamonds in their fills, lines, arrows and
/// pencil strokes as thin lines, and its words as soft bars where they sit, one a line, as wide
/// as the line. The list's whiteboard rows and the template tiles.
struct CanvasSketchView: View {
    let sketch: CanvasSketch
    var lineWidth: CGFloat = 0.8
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Canvas { ctx, size in
            let shapes = sketch.shapes, all = shapes + sketch.words
            guard let first = all.first?.frame.standardized else { return }
            let box = all.dropFirst().reduce(first) { $0.union($1.frame.standardized) }.insetBy(dx: -2, dy: -2)
            let scale = min(size.width / max(box.width, 1), size.height / max(box.height, 1))
            let dx = (size.width - box.width * scale) / 2 - box.minX * scale
            let dy = (size.height - box.height * scale) / 2 - box.minY * scale
            let ink = Color.ink.opacity(0.75)
            func at(_ p: CGPoint) -> CGPoint { CGPoint(x: p.x * scale + dx, y: p.y * scale + dy) }
            for s in shapes {
                let f = s.frame.standardized
                let r = CGRect(origin: at(f.origin), size: CGSize(width: f.width * scale, height: f.height * scale))
                let path: Path
                switch s.kind {
                case "ellipse": path = Path(ellipseIn: r)
                case "diamond":
                    path = Path { p in
                        p.move(to: CGPoint(x: r.midX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.midY))
                        p.addLine(to: CGPoint(x: r.midX, y: r.maxY)); p.addLine(to: CGPoint(x: r.minX, y: r.midY)); p.closeSubpath()
                    }
                case "arrow", "line", "freedraw":
                    // Points run from the element's own origin (as written, not standardised).
                    let o = s.frame.origin
                    let pts = s.points.isEmpty ? [CGPoint.zero, CGPoint(x: s.frame.size.width, y: s.frame.size.height)] : s.points
                    let line = Path { p in
                        for (i, q) in pts.enumerated() {
                            let pt = at(CGPoint(x: o.x + q.x, y: o.y + q.y))
                            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
                        }
                    }
                    ctx.stroke(line, with: .color(ink), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
                    continue
                case "image": path = Path(r)
                default: path = Path(roundedRect: r, cornerRadius: min(3, r.height / 4))
                }
                if let hex = s.fill, let c = CanvasStyle.shown(hex, dark: scheme == .dark) { ctx.fill(path, with: .color(c)) }
                ctx.stroke(path, with: .color(ink), lineWidth: lineWidth)
            }
            for w in sketch.words {
                let f = w.frame.standardized
                let line = CGRect(x: f.minX * scale + dx, y: f.minY * scale + dy, width: f.width * scale, height: f.height * scale)
                let h = min(max(line.height * 0.45, 1.2), 3)
                let bar = CGRect(x: line.minX, y: line.midY - h / 2, width: max(line.width, h), height: h)
                ctx.fill(Path(roundedRect: bar, cornerRadius: h / 2), with: .color(Color.ink.opacity(0.42)))
            }
        }
        .accessibilityHidden(true)
    }
}

// MARK: The dock

struct CanvasDock: View {
    let canvas: CanvasController
    @Namespace private var well
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showingStyle = false

    static let margin: CGFloat = 16
    static let button: CGFloat = 36

    /// The grey well slides to the tool you pick.
    var motion: Animation? { reduceMotion ? nil : .easeOut(duration: 0.15) }

    var body: some View {
        HStack(spacing: 2) {
            #if os(macOS)
            CanvasBarButton(title: "Undo", key: "\u{2318}Z", symbol: "arrow.uturn.backward", enabled: canvas.canUndo) { canvas.run(.undo) }
                .accessibilityIdentifier("canvas.undo")
            CanvasBarButton(title: "Redo", key: "\u{21E7}\u{2318}Z", symbol: "arrow.uturn.forward", enabled: canvas.canRedo) { canvas.run(.redo) }
                .accessibilityIdentifier("canvas.redo")
            Color.clear.frame(width: 14, height: 1)
            ForEach(CanvasTool.dock) { tool in toolButton(tool) }
            #else
            toolButton(.selection)
            toolButton(.freedraw)
            shapesButton
            toolButton(.arrow)
            toolButton(.text)
            toolButton(.eraser)
            CanvasLibraryDockButton(canvas: canvas)
            CanvasCommentDockButton(canvas: canvas, well: well)
            styleButton
            #endif
        }
        .padding(6)
        .glassEffect(.regular, in: .capsule)
        .animation(motion, value: canvas.state.tool)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Drawing tools")
        .accessibilityIdentifier("canvas.dock")
    }

    private func toolButton(_ tool: CanvasTool) -> some View {
        CanvasBarButton(title: tool.title, key: tool.key, symbol: tool.symbol, selected: canvas.state.tool == tool,
                        well: well) { canvas.pick(tool) }
            .accessibilityIdentifier("canvas.tool.\(tool.rawValue)")
    }

    #if os(iOS)
    /// The shapes in one button: the last shape picked, the rest in its menu.
    private var shapesButton: some View {
        let current = CanvasTool.shapes.contains(canvas.state.tool) ? canvas.state.tool : .rectangle
        return Menu {
            ForEach(CanvasTool.shapes) { tool in
                Button(tool.title, systemImage: tool.symbol) { canvas.pick(tool) }
            }
            Divider()
            Button(CanvasMenu.noteCard, systemImage: "doc.text") { canvas.choosingNote = true }
        } label: {
            CanvasWell(selected: CanvasTool.shapes.contains(canvas.state.tool), well: well) {
                Image(systemName: CanvasTool.shapesSymbol)
            }
        } primaryAction: {
            canvas.pick(current)
        }
        .accessibilityLabel("Shapes")
        .accessibilityIdentifier("canvas.tool.shapes")
    }

    /// The style of what's selected or about to be drawn, in a sheet.
    private var styleButton: some View {
        Button { showingStyle = true } label: {
            Circle()
                .fill(AngularGradient(colors: [.red, .orange, .yellow, .green, .blue, .purple, .red], center: .center))
                .frame(width: 26, height: 26)
                .frame(width: CanvasDock.button, height: CanvasDock.button)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Style")
        .accessibilityIdentifier("canvas.style")
        .sheet(isPresented: $showingStyle) {
            CanvasStylePanel(canvas: canvas)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }
    #endif
}

/// The grey well under the picked tool; it slides between tools (matched geometry).
struct CanvasWell<Label: View>: View {
    var selected = false
    var hovering = false
    var well: Namespace.ID?
    @ViewBuilder let label: Label

    var body: some View {
        label
            .font(.system(size: 15, weight: .regular))
            .foregroundStyle(Color.ink)
            .frame(width: CanvasDock.button, height: CanvasDock.button)
            .background {
                if selected, let well {
                    Circle().fill(Color.soft).matchedGeometryEffect(id: "well", in: well)
                } else if selected {
                    Circle().fill(Color.soft)
                } else if hovering {
                    Circle().fill(Color.soft.opacity(0.55))
                }
            }
            .contentShape(Circle())
    }
}

/// A button on the dock or the selection bar: its symbol in a well, a tag after a short hover
/// ("Rectangle  R").
struct CanvasBarButton: View {
    let title: String
    var key: String? = nil
    let symbol: String
    var selected = false
    var enabled = true
    var well: Namespace.ID? = nil
    let action: () -> Void
    @State private var hovering = false
    @State private var tagShown: Bool
    @State private var tagWait: Task<Void, Never>?
    /// From the button's middle to the board's left and right edges.
    @State private var room = CanvasTag.Room.unlimited

    /// `tagShown`: its tag already up, as after a hover (for pictures).
    init(title: String, key: String? = nil, symbol: String, selected: Bool = false, enabled: Bool = true, well: Namespace.ID? = nil,
         tagShown: Bool = false, action: @escaping () -> Void) {
        self.title = title
        self.key = key
        self.symbol = symbol
        self.selected = selected
        self.enabled = enabled
        self.well = well
        self.action = action
        _tagShown = State(initialValue: tagShown)
    }

    var body: some View {
        #if os(macOS)
        // For the tag's placement, worked out off the main actor.
        let tagRoom = room, space = CanvasOverlay.space
        #endif
        Button(action: action) {
            CanvasWell(selected: selected, hovering: hovering && enabled, well: well) {
                Image(systemName: symbol)
            }
            .opacity(enabled ? 1 : 0.35)
        }
        .buttonStyle(CanvasPressStyle())
        .disabled(!enabled)
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? .isSelected : [])
        #if os(macOS)
        .onHover { inside in
            hovering = inside
            tagWait?.cancel()
            if inside {
                tagWait = Task { @MainActor in
                    try? await Task.sleep(for: .milliseconds(450))
                    if !Task.isCancelled { tagShown = true }
                }
            } else {
                tagShown = false
            }
        }
        // Over the button, kept inside the board (real-window check, 17 Nov: the map's "Hide Map"
        // was cut off at the board's left edge, under the list).
        .onGeometryChange(for: CanvasTag.Room.self) { proxy in
            guard let board = proxy.bounds(of: .named(space)) else { return .unlimited }
            let mid = proxy.size.width / 2
            return CanvasTag.Room(left: mid - board.minX, right: board.maxX - mid)
        } action: { room = $0 }
        .overlay {
            if tagShown {
                // A layout, not an alignment guide: a guide's closure wasn't asked again when the
                // room came in, so the tag stayed centred and cut off.
                CanvasTag.Place(room: tagRoom) { CanvasTag(title: title, key: key) }
                    .allowsHitTesting(false).transition(.opacity)
            }
        }
        .animation(.easeOut(duration: 0.12), value: tagShown)
        #endif
    }
}

/// "Rectangle  R": dark, small, above the button.
struct CanvasTag: View {
    let title: String
    var key: String?

    /// How far the board reaches from the button's middle, left and right.
    struct Room: Equatable {
        var left: CGFloat, right: CGFloat
        static let unlimited = Room(left: .infinity, right: .infinity)
    }
    /// Kept this far inside the board's edges.
    nonisolated static let margin: CGFloat = 8

    /// The point of a tag `width` wide that stands over the button's middle: its own middle, unless
    /// that would take it past the board's edge; then it moves in, `margin` from the edge.
    nonisolated static func middle(width: CGFloat, room: Room) -> CGFloat {
        var x = width / 2
        if room.left - margin < x { x = room.left - margin }
        if room.right - margin < width - x { x = width - (room.right - margin) }
        return x
    }

    /// Puts the tag 38 points over its button's top: over the button's middle, moved in to stay
    /// `margin` inside the board (`room`, from the button's middle).
    struct Place: Layout {
        var room: Room

        func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
            proposal.replacingUnspecifiedDimensions()
        }

        func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
            guard let tag = subviews.first else { return }
            let size = tag.sizeThatFits(.unspecified)
            let x = CanvasTag.middle(width: size.width, room: room)
            tag.place(at: CGPoint(x: bounds.midX - x, y: bounds.minY - 38), anchor: .topLeading, proposal: ProposedViewSize(size))
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            Text(title).fontWeight(.semibold)
            if let key { Text(key).foregroundStyle(.white.opacity(0.6)) }
        }
        .font(.system(size: 12))
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(white: 0.12), in: RoundedRectangle(cornerRadius: 6))
        .accessibilityHidden(true)
    }
}

// MARK: The bar over the selection

struct CanvasSelectionBar: View {
    let canvas: CanvasController
    let bounds: CGRect
    let area: CGSize
    /// The style panel, kept clear as words on the board are (Emil's pictures, 16 November 2026:
    /// the bar for a box near the panel lay over its Opacity row).
    var avoiding: CGRect? = nil
    @State private var tray: Tray? = CanvasSelectionBar.startTray
    @State private var size = CGSize(width: 240, height: 44)

    /// Pictures only: the swatch tray starts out open.
    nonisolated(unsafe) static var startTray: Tray?
    @Environment(\.colorScheme) private var scheme

    enum Tray: Equatable { case stroke, fill }

    /// A note card's own action, first on its bar (and in its right-click menu).
    static let openNote = "Open Note"
    /// Its action instead when its note is in Recently Deleted: the note comes back, and the card.
    static let restoreNote = "Restore Note"

    /// How far above the selection it floats: 6 pt on the Mac; on iPhone clear of the touch
    /// handles and the rotate handle above them, which the page's bounds don't include.
    #if os(iOS)
    static let gap: CGFloat = 28
    #else
    /// Clear of the rotate handle, which stands about 20 pt above the selection's box.
    static let gap: CGFloat = 30
    #endif

    /// Shown only while some of the selection is in view: scrolled away, a bar kept at the edge
    /// floated over other things for a shape you couldn't see (whiteboard council, round 2, 15).
    static func inView(_ bounds: CGRect, area: CGSize) -> Bool {
        bounds.intersects(CGRect(origin: .zero, size: area).insetBy(dx: 12, dy: 12))
    }

    /// How far round the selection the page lists what's drawn (canvas.jsx NEARBY_REACH): the bar
    /// looks for room no further out, where it would know nothing of what it covered.
    static let reach: CGFloat = 260

    /// Its centre. Above the selection where it covers nothing drawn; else slid along above it,
    /// then below, then beside it; else the nearest spot further out that covers nothing (round
    /// 16, 43-timeline-1: Add Step sat on the Design step beside the one selected; 46-org-chart-1:
    /// Add Report on Alex's corner and the line to Jo); with nowhere clear, where it covers least
    /// (whiteboard council, round 2, 07: it sat on the arrow into the box and on the shape above).
    /// Always in the canvas. A shape round the whole selection (a Kanban lane, a frame) counts by
    /// its edge: the bar may lie over its empty middle.
    static func position(bounds: CGRect, bar: CGSize, area: CGSize, nearby given: [CanvasObstacle] = [], margin: CGFloat = 8) -> CGPoint {
        let nearby = given.flatMap { o -> [CanvasObstacle] in
            guard case .box(let b) = o, b.contains(bounds) else { return [o] }
            return [.line([CGPoint(x: b.minX, y: b.minY), CGPoint(x: b.maxX, y: b.minY), CGPoint(x: b.maxX, y: b.maxY), CGPoint(x: b.minX, y: b.maxY), CGPoint(x: b.minX, y: b.minY)])]
        }
        func clamp(_ p: CGPoint) -> CGPoint {
            CGPoint(x: min(max(p.x, margin + bar.width / 2), max(area.width - margin - bar.width / 2, margin + bar.width / 2)),
                    y: min(max(p.y, margin + bar.height / 2), max(area.height - margin - bar.height / 2, margin + bar.height / 2)))
        }
        // Clear by the bar's shadow and a hand-drawn stroke's wobble (round 4, 07: it still clipped
        // the Start ellipse's edge with 4 pt).
        func rect(_ c: CGPoint) -> CGRect { CGRect(x: c.x - bar.width / 2, y: c.y - bar.height / 2, width: bar.width, height: bar.height).insetBy(dx: -10, dy: -10) }
        func fits(_ c: CGPoint) -> Bool {
            c.y - bar.height / 2 >= margin && c.y + bar.height / 2 <= area.height - margin
                && c.x - bar.width / 2 >= margin && c.x + bar.width / 2 <= area.width - margin
        }
        let above = bounds.minY - gap - bar.height / 2, below = bounds.maxY + gap + bar.height / 2
        let slide = (bounds.width + bar.width) / 2
        let offsets: [CGFloat] = [0] + stride(from: CGFloat(16), through: slide, by: 16).flatMap { [-$0, $0] }
        var spots = [CGPoint]()
        // Slid spots are kept inside the canvas side to side; one that can't be is left out.
        let lo = margin + bar.width / 2, hi = max(area.width - margin - bar.width / 2, lo)
        for y in [above, below] {
            for o in offsets {
                let c = CGPoint(x: min(max(bounds.midX + o, lo), hi), y: y)
                if !spots.contains(c) { spots.append(c) }
            }
        }
        // Off a corner, clear of shapes as wide as the selection right above or below it (round 5,
        // 07: Start above the selected box; 15: Done below the diamond), then beside it.
        let left = bounds.minX - gap / 2 - bar.width / 2, right = bounds.maxX + gap / 2 + bar.width / 2
        spots += [CGPoint(x: right, y: above), CGPoint(x: left, y: above), CGPoint(x: right, y: below), CGPoint(x: left, y: below)]
        spots += [CGPoint(x: bounds.minX - gap - bar.width / 2, y: bounds.midY), CGPoint(x: bounds.maxX + gap + bar.width / 2, y: bounds.midY)]
        let inside = spots.filter(fits)
        if let clear = inside.first(where: { c in !nearby.contains { $0.hits(rect(c)) } }) { return clear }
        if let further = further(bounds: bounds, bar: bar, area: area, nearby: nearby, margin: margin) { return further }
        // Nowhere clear: the old place, above (below with no room above), kept in the canvas.
        let fallback = CGPoint(x: bounds.midX, y: above - bar.height / 2 < margin ? below : above)
        // Words count far more than lines and shapes: the bar sits on a line before a how-to line.
        func cost(_ c: CGPoint) -> Int { nearby.filter { $0.hits(rect(c)) }.reduce(0) { $0 + $1.weight } }
        let least = inside.min { cost($0) < cost($1) }
        if let least, cost(least) < cost(fallback) { return least }
        return clamp(fallback)
    }

    /// The nearest spot that covers nothing drawn, further out than right beside the selection
    /// (above a how-to line, under the row below): on a grid 12 pt down and 16 pt across, kept in
    /// the canvas and within `reach` of the selection, never on the selection or its rotate handle.
    /// Above before below at the same distance. Nil when there's none.
    private static func further(bounds: CGRect, bar: CGSize, area: CGSize, nearby: [CanvasObstacle], margin: CGFloat) -> CGPoint? {
        let room = bounds.insetBy(dx: -reach, dy: -reach)
            .intersection(CGRect(x: margin, y: margin, width: area.width - 2 * margin, height: area.height - 2 * margin))
        guard room.width >= bar.width, room.height >= bar.height else { return nil }
        // The selection, its handles and the rotate handle above it.
        let own = CGRect(x: bounds.minX - 10, y: bounds.minY - gap, width: bounds.width + 20, height: bounds.height + gap + 10)
        // Only what lies in reach can be in the way.
        let inRoom = nearby.filter { $0.hits(room.insetBy(dx: -12, dy: -12)) }
        var best: (at: CGPoint, distance: CGFloat)?
        // The grid lines up with the spot right above the selection, centred on it.
        func first(_ from: CGFloat, _ lowest: CGFloat, _ step: CGFloat) -> CGFloat { from - ((from - lowest) / step).rounded(.down) * step }
        var y = first(bounds.minY - gap - bar.height / 2, room.minY + bar.height / 2, 12)
        while y <= room.maxY - bar.height / 2 {
            var x = first(bounds.midX, room.minX + bar.width / 2, 16)
            while x <= room.maxX - bar.width / 2 {
                let r = CGRect(x: x - bar.width / 2, y: y - bar.height / 2, width: bar.width, height: bar.height)
                if !r.intersects(own) {
                    let dx = max(0, r.minX - bounds.maxX, bounds.minX - r.maxX), dy = max(0, r.minY - bounds.maxY, bounds.minY - r.maxY)
                    // Nearest first; then above before below, then the most nearly centred.
                    let distance = (dx * dx + dy * dy).squareRoot() + (y > bounds.midY ? 1 : 0) + abs(x - bounds.midX) * 0.001
                    if distance < best?.distance ?? .infinity, !inRoom.contains(where: { $0.hits(r.insetBy(dx: -10, dy: -10)) }) {
                        best = (CGPoint(x: x, y: y), distance)
                    }
                }
                x += 16
            }
            y += 12
        }
        return best?.at
    }

    var body: some View {
        let state = canvas.state
        let dark = scheme == .dark
        VStack(spacing: 6) {
            if let tray {
                swatchTray(tray, dark: dark)
                    .transition(.opacity.combined(with: .scale(scale: 0.96, anchor: .bottom)))
            }
            HStack(spacing: 2) {
                if state.cropping {
                    textButton(Self.doneCropping, symbol: "checkmark", id: "canvas.bar.cropDone") { canvas.send(.cropDone) }
                } else {
                if state.selection == ["image"] {
                    textButton(Self.crop, symbol: "crop", id: "canvas.bar.crop") { canvas.run(.crop) }
                }
                if let card = state.card, canvas.restorable.contains(card.note) {
                    Button { canvas.restoreCard(card.note) } label: {
                        Label(Self.restoreNote, systemImage: "arrow.uturn.backward")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.ink)
                            .padding(.horizontal, 10)
                            .frame(height: 34)
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .hoverHighlight(Capsule())
                    #if os(macOS)
                    .help("Restore \u{201C}\(card.title)\u{201D} from Recently Deleted")
                    #endif
                    .accessibilityIdentifier("canvas.bar.restoreNote")
                } else if let card = state.card {
                    Button { canvas.openCard(card.note) } label: {
                        Label(Self.openNote, systemImage: "doc.text")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.ink)
                            .padding(.horizontal, 10)
                            .frame(height: 34)
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .hoverHighlight(Capsule())
                    #if os(macOS)
                    .help("Open \u{201C}\(card.title)\u{201D} (double-click the card)")
                    #endif
                    .accessibilityIdentifier("canvas.bar.openNote")
                }
                // A Kanban or Retro column, a Timeline step: the next of its kind (round 15; Tab too).
                if let grows = state.grows {
                    textButton(grows.title, symbol: grows.symbol, id: "canvas.bar.grow") { canvas.send(.grow) }
                }
                if state.showsStroke || state.showsText {
                    chip(.stroke) {
                        Circle().fill(CanvasStyle.shown(state.strokeColor, dark: dark) ?? .primary).frame(width: 18, height: 18)
                    }
                    .accessibilityLabel(state.showsText && !state.showsStroke ? "Text colour" : "Stroke colour")
                    .accessibilityIdentifier("canvas.bar.stroke")
                }
                if state.showsFill {
                    chip(.fill) { Self.fillSwatch(state.mixedFill ? "mixed" : state.backgroundColor, dark: dark, size: 18) }
                        .accessibilityLabel("Fill")
                        .accessibilityIdentifier("canvas.bar.fill")
                }
                if state.showsStroke {
                    menuButton("Stroke width", symbol: "line.3.horizontal", id: "canvas.bar.width") {
                        Picker("Stroke width", selection: Binding(get: { state.strokeWidth }, set: { canvas.set(.strokeWidth, .number($0)) })) {
                            ForEach(CanvasStyle.widths, id: \.value) { Text($0.name).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                        Picker("Line", selection: Binding(get: { state.strokeStyle }, set: { canvas.set(.strokeStyle, .text($0)) })) {
                            ForEach(CanvasStyle.strokeStyles, id: \.value) { Text($0.name).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                    }
                } else if state.showsText {
                    menuButton("Text size", symbol: "textformat.size", id: "canvas.bar.textSize") {
                        Picker("Size", selection: Binding(get: { state.fontSize }, set: { canvas.set(.fontSize, .number($0)) })) {
                            ForEach(CanvasStyle.fontSizes, id: \.value) { Text($0.name).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                    }
                }
                if state.showsArrowheads {
                    menuButton("Arrow type", symbol: CanvasStyle.arrowTypes.first { $0.value == state.arrowType }?.symbol ?? "arrow.up.right", id: "canvas.bar.arrowType") {
                        Picker("Arrow type", selection: Binding(get: { state.arrowType }, set: { canvas.set(.arrowType, .text($0)) })) {
                            ForEach(CanvasStyle.arrowTypes, id: \.value) { Label($0.name, systemImage: $0.symbol).tag($0.value) }
                        }
                        .pickerStyle(.inline)
                    }
                }
                if state.showsAlign {
                    menuButton("Align", symbol: "align.horizontal.left", id: "canvas.bar.align") { CanvasAlignItems(canvas: canvas, count: state.alignCount) }
                }
                menuButton("Arrange", symbol: "square.3.layers.3d", id: "canvas.bar.layer") {
                    Button("Bring to Front", systemImage: "square.3.layers.3d.top.filled") { canvas.run(.bringToFront) }
                    Button("Bring Forward", systemImage: "arrow.up") { canvas.run(.bringForward) }
                    Button("Send Backward", systemImage: "arrow.down") { canvas.run(.sendBackward) }
                    Button("Send to Back", systemImage: "square.3.layers.3d.bottom.filled") { canvas.run(.sendToBack) }
                }
                if canvas.canComment, !canvas.viewOnly {
                    iconButton(BoardCommentUI.comment, symbol: "plus.bubble", id: "canvas.bar.comment") { canvas.comment() }
                }
                menuButton("More", symbol: "ellipsis", id: "canvas.bar.more") { CanvasMoreItems(canvas: canvas) }
                }
            }
            .padding(4)
            // Solid, as a menu is: over a drawing, glass let the lines behind run through the
            // buttons (whiteboard council, round 1).
            .background(Color.card, in: Capsule())
            .raised(in: Capsule())
        }
        .fixedSize()
        .onGeometryChange(for: CGSize.self) { $0.size } action: { size = $0 }
        .position(Self.position(bounds: bounds, bar: size, area: area, nearby: canvas.state.nearby + (avoiding.map { [.words($0)] } ?? [])))
        .animation(.easeOut(duration: 0.15), value: tray)
        .onChange(of: canvas.state.selection) { _, _ in tray = nil }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Selection")
        .accessibilityIdentifier("canvas.selectionBar")
    }

    static let crop = "Crop"
    static let doneCropping = "Done"

    /// A named action on the bar (Crop, Done), as Open Note is.
    private func textButton(_ title: String, symbol: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.ink)
                .padding(.horizontal, 10)
                .frame(height: 34)
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .hoverHighlight(Capsule())
        .accessibilityIdentifier(id)
    }

    /// One action, as an icon (Comment).
    private func iconButton(_ title: String, symbol: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 14))
                .foregroundStyle(Color.ink)
                .frame(width: 34, height: 34)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .hoverHighlight(Circle())
        #if os(macOS)
        .help(title + " (C)")
        #endif
        .accessibilityLabel(title)
        .accessibilityIdentifier(id)
    }

    private func chip(_ which: Tray, @ViewBuilder label: () -> some View) -> some View {
        Button { tray = tray == which ? nil : which } label: {
            CanvasWell(selected: tray == which) { label() }
                .frame(width: 34, height: 34)
        }
        .buttonStyle(CanvasPressStyle())
    }

    private func menuButton(_ title: String, symbol: String, id: String, @ViewBuilder items: () -> some View) -> some View {
        Menu { items() } label: {
            Image(systemName: symbol)
                .font(.system(size: 14))
                .foregroundStyle(Color.ink)
                .frame(width: 34, height: 34)
                .contentShape(Circle())
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .hoverHighlight(Circle())
        #if os(macOS)
        .menuIndicator(.hidden)
        .help(title)
        #endif
        .fixedSize()
        .accessibilityLabel(title)
        .accessibilityIdentifier(id)
    }

    /// A row of swatches and the system colour well, above the bar.
    private func swatchTray(_ which: Tray, dark: Bool) -> some View {
        let swatches = which == .stroke ? CanvasStyle.strokes : CanvasStyle.fills
        let current = which == .stroke ? canvas.state.strokeColor : canvas.state.backgroundColor
        let key: CanvasCommand.StyleKey = which == .stroke ? .strokeColor : .backgroundColor
        return HStack(spacing: 6) {
            ForEach(swatches) { s in
                Button { canvas.set(key, .text(s.hex)) } label: {
                    Self.fillSwatch(s.hex, dark: dark, size: 22)
                        .padding(3)
                        .overlay(Circle().strokeBorder(Color.ink, lineWidth: current.lowercased() == s.hex ? 2 : 0))
                }
                .buttonStyle(CanvasPressStyle())
                .accessibilityLabel(s.name)
                .accessibilityAddTraits(current.lowercased() == s.hex ? .isSelected : [])
            }
            CanvasColorWell(title: which == .stroke ? "Stroke colour" : "Fill colour",
                            color: CanvasStyle.shown(current, dark: dark) ?? .clear) { canvas.set(key, .text(CanvasStyle.hex($0, dark: dark))) }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.card, in: Capsule())
        .raised(in: Capsule())
        .accessibilityIdentifier("canvas.tray")
    }

    /// A colour as a swatch: none crossed out, different fills half and half (the style panel too).
    @ViewBuilder
    static func fillSwatch(_ hex: String, dark: Bool, size: CGFloat) -> some View {
        if hex == "mixed" {
            // Different fills: half and half, as a mixed state.
            RoundedRectangle(cornerRadius: size * 0.28).fill(LinearGradient(colors: [.secondary.opacity(0.55), .secondary.opacity(0.55), Color.card, Color.card], startPoint: .topLeading, endPoint: .bottomTrailing))
                .overlay(RoundedRectangle(cornerRadius: size * 0.28).strokeBorder(Color.line, lineWidth: 1))
                .frame(width: size, height: size)
                .accessibilityLabel("Mixed")
        } else if hex == "transparent" {
            Circle().fill(Color.card)
                .overlay(Rectangle().fill(Color.red).frame(width: 1.5, height: size * 1.1).rotationEffect(.degrees(45)))
                .clipShape(Circle())
                .overlay(Circle().strokeBorder(Color.line, lineWidth: 1))
                .frame(width: size, height: size)
        } else {
            RoundedRectangle(cornerRadius: size * 0.28).fill(CanvasStyle.shown(hex, dark: dark) ?? .clear)
                .overlay(RoundedRectangle(cornerRadius: size * 0.28).strokeBorder(Color.line, lineWidth: 1))
                .frame(width: size, height: size)
        }
    }
}

/// Lining up two or more: Excalidraw's align and distribute (whiteboard council, round 2: "used on
/// every diagram").
struct CanvasAlignItems: View {
    let canvas: CanvasController
    let count: Int

    var body: some View {
        Button("Align Left", systemImage: "align.horizontal.left") { canvas.run(.alignLeft) }
        Button("Align Centre", systemImage: "align.horizontal.center") { canvas.run(.alignCenter) }
        Button("Align Right", systemImage: "align.horizontal.right") { canvas.run(.alignRight) }
        Divider()
        Button("Align Top", systemImage: "align.vertical.top") { canvas.run(.alignTop) }
        Button("Align Middle", systemImage: "align.vertical.center") { canvas.run(.alignMiddle) }
        Button("Align Bottom", systemImage: "align.vertical.bottom") { canvas.run(.alignBottom) }
        if count >= 3 {
            Divider()
            Button("Space Evenly Across", systemImage: "distribute.horizontal.center") { canvas.run(.distributeHorizontally) }
            Button("Space Evenly Down", systemImage: "distribute.vertical.center") { canvas.run(.distributeVertically) }
        }
    }
}

/// The selection's ••• menu: the rest of its style, then Duplicate and Delete.
struct CanvasMoreItems: View {
    let canvas: CanvasController

    var body: some View {
        let state = canvas.state
        if state.showsFill, state.backgroundColor != "transparent" {
            Picker("Fill style", selection: Binding(get: { state.fillStyle }, set: { canvas.set(.fillStyle, .text($0)) })) {
                ForEach(CanvasStyle.fillStyles, id: \.value) { Text($0.name).tag($0.value) }
            }
        }
        if state.showsText {
            Picker("Font", selection: Binding(get: { state.fontFamily }, set: { canvas.set(.fontFamily, .number(Double($0))) })) {
                ForEach(CanvasStyle.fonts, id: \.value) { Text($0.name).tag($0.value) }
            }
            if state.showsStroke {
                Picker("Text size", selection: Binding(get: { state.fontSize }, set: { canvas.set(.fontSize, .number($0)) })) {
                    ForEach(CanvasStyle.fontSizes, id: \.value) { Text($0.name).tag($0.value) }
                }
            }
        }
        if state.showsArrowheads {
            Picker("Start", selection: Binding(get: { state.startArrowhead ?? "" }, set: { canvas.set(.startArrowhead, $0.isEmpty ? .none : .text($0)) })) {
                ForEach(CanvasStyle.arrowheads, id: \.name) { Text($0.name).tag($0.value ?? "") }
            }
            Picker("End", selection: Binding(get: { state.endArrowhead ?? "" }, set: { canvas.set(.endArrowhead, $0.isEmpty ? .none : .text($0)) })) {
                ForEach(CanvasStyle.arrowheads, id: \.name) { Text($0.name).tag($0.value ?? "") }
            }
        }
        Picker("Opacity", selection: Binding(get: { (state.opacity / 25).rounded() * 25 }, set: { canvas.set(.opacity, .number($0)) })) {
            ForEach([100.0, 75, 50, 25], id: \.self) { Text("\(Int($0))%").tag($0) }
        }
        Divider()
        #if os(macOS)
        // Kept for any board, in the toolbar's Library (CanvasLibraryPopover).
        Button(CanvasLibraryPopover.saveTitle, systemImage: CanvasLibraryPopover.symbol) { Task { await canvas.saveSelectionToLibrary() } }
            .accessibilityIdentifier("canvas.saveToLibrary")
        // What's selected as one of your templates (a frame with all that's in it; round 15).
        Button(NoteMoreMenu.saveTemplateTitle, systemImage: "square.on.square.dashed") { canvas.askTemplateName(.selection) }
            .accessibilityIdentifier("canvas.bar.saveTemplate")
        Divider()
        #endif
        if state.inFrame {
            Button(CanvasPresentOrder.fromHere, systemImage: "play.rectangle") { canvas.send(.presentFrom(nil)) }
                .accessibilityIdentifier("canvas.presentFromHere")
            Divider()
        }
        Button("Duplicate", systemImage: "plus.square.on.square") { canvas.run(.duplicate) }
        Button("Delete", systemImage: "trash", role: .destructive) { canvas.run(.delete) }
    }
}

#if os(iOS)
/// The style of what's selected or about to be drawn, as one panel (the iPhone's sheet).
struct CanvasStylePanel: View {
    let canvas: CanvasController
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let state = canvas.state
        let dark = scheme == .dark
        Form {
            if state.showsStroke || state.showsText {
                Section(state.showsStroke ? "Stroke" : "Text") {
                    swatches(CanvasStyle.strokes, current: state.strokeColor, key: .strokeColor, dark: dark)
                }
            }
            if state.showsFill {
                Section("Fill") {
                    swatches(CanvasStyle.fills, current: state.backgroundColor, key: .backgroundColor, dark: dark)
                }
            }
            if state.showsStroke {
                Section {
                    Picker("Width", selection: Binding(get: { state.strokeWidth }, set: { canvas.set(.strokeWidth, .number($0)) })) {
                        ForEach(CanvasStyle.widths, id: \.value) { Text($0.name).tag($0.value) }
                    }
                    .pickerStyle(.segmented)
                    Picker("Line", selection: Binding(get: { state.strokeStyle }, set: { canvas.set(.strokeStyle, .text($0)) })) {
                        ForEach(CanvasStyle.strokeStyles, id: \.value) { Text($0.name).tag($0.value) }
                    }
                    .pickerStyle(.segmented)
                }
            }
            Section {
                CanvasMoreItems(canvas: canvas)
            }
        }
        .accessibilityIdentifier("canvas.stylePanel")
    }

    private func swatches(_ list: [CanvasStyle.Swatch], current: String, key: CanvasCommand.StyleKey, dark: Bool) -> some View {
        HStack(spacing: 10) {
            ForEach(list) { s in
                Button { canvas.set(key, .text(s.hex)) } label: {
                    Circle().fill(s.hex == "transparent" ? Color.card : (CanvasStyle.shown(s.hex, dark: dark) ?? .clear))
                        .overlay(Circle().strokeBorder(Color.line, lineWidth: 1))
                        .frame(width: 30, height: 30)
                        .padding(3)
                        .overlay(Circle().strokeBorder(Color.ink, lineWidth: current.lowercased() == s.hex ? 2 : 0))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(s.name)
            }
            Spacer(minLength: 0)
            ColorPicker("Other colour", selection: Binding(get: { CanvasStyle.shown(current, dark: dark) ?? .clear },
                                                           set: { canvas.set(key, .text(CanvasStyle.hex($0, dark: dark))) }), supportsOpacity: false)
                .labelsHidden()
        }
    }
}
#endif

/// Any other colour: a round rainbow well. On the Mac it opens the system colour panel (SwiftUI's
/// ColorPicker draws a wide well there); on iPhone it's the system ColorPicker.
struct CanvasColorWell: View {
    let title: String
    let color: Color
    let pick: (Color) -> Void

    var body: some View {
        #if os(macOS)
        Button { CanvasColorPanel.shared.open(color, pick: pick) } label: {
            Circle()
                .fill(AngularGradient(colors: [.red, .orange, .yellow, .green, .blue, .purple, .red], center: .center))
                .frame(width: 22, height: 22)
                .padding(3)
        }
        .buttonStyle(CanvasPressStyle())
        .help(title)
        .accessibilityLabel(title)
        #else
        ColorPicker(title, selection: Binding(get: { color }, set: pick), supportsOpacity: false)
            .labelsHidden()
        #endif
    }
}

#if os(macOS)
/// The system colour panel, sending what's picked to the open canvas.
@MainActor final class CanvasColorPanel: NSObject {
    static let shared = CanvasColorPanel()
    private var pick: ((Color) -> Void)?

    func open(_ color: Color, pick: @escaping (Color) -> Void) {
        self.pick = pick
        let panel = NSColorPanel.shared
        panel.showsAlpha = false
        panel.setTarget(self)
        panel.setAction(#selector(changed(_:)))
        panel.color = NSColor(color)
        panel.orderFront(nil)
    }

    @objc private func changed(_ panel: NSColorPanel) { pick?(Color(nsColor: panel.color)) }
}
#endif

// MARK: Zoom

#if os(macOS)
/// "100%", quiet, at the bottom right; − and + come with the pointer. ⌘+, ⌘− and ⌘0 too.
struct CanvasZoom: View {
    let canvas: CanvasController
    @State private var hovering = false

    var body: some View {
        HStack(spacing: 2) {
            if hovering {
                CanvasBarButton(title: CanvasMenu.zoomOut, key: "\u{2318}\u{2212}", symbol: "minus") { canvas.run(.zoomOut) }
                    .transition(.opacity)
            }
            Button { canvas.run(.resetZoom) } label: {
                Text("\(Int((canvas.state.zoom * 100).rounded()))%")
                    .font(.system(size: 12, weight: .medium).monospacedDigit())
                    .foregroundStyle(Color.muted)
                    .frame(minWidth: 40, minHeight: CanvasDock.button)
            }
            .buttonStyle(.plain)
            .hoverHighlight(Capsule())
            .help("Actual Size (\u{2318}0)")
            .accessibilityLabel("Zoom \(Int((canvas.state.zoom * 100).rounded())) percent")
            .accessibilityIdentifier("canvas.zoom")
            if hovering {
                CanvasBarButton(title: CanvasMenu.zoomIn, key: "\u{2318}+", symbol: "plus") { canvas.run(.zoomIn) }
                    .transition(.opacity)
            }
        }
        .padding(.horizontal, 4)
        .contentShape(Rectangle())
        .onHover { inside in withAnimation(.easeOut(duration: 0.15)) { hovering = inside } }
    }
}

/// The board's bottom left corner, as Excalidraw's: the map's switch (CanvasMap), the zoom (−, the
/// percent, +), and Undo and Redo, in one glass bar (Emil, 17 November 2026).
struct CanvasCorner: View {
    let canvas: CanvasController
    @AppStorage(CanvasMap.key) private var map = false

    /// The bar's height: a button and its padding (CanvasMap.bottom stands the map above it).
    static let height: CGFloat = CanvasDock.button + 8

    var body: some View {
        let percent = Int((canvas.state.zoom * 100).rounded())
        HStack(spacing: 2) {
            CanvasBarButton(title: CanvasMap.title(map), symbol: map ? "map.fill" : CanvasMap.symbol, selected: map) { map.toggle() }
                .accessibilityIdentifier("canvas.map")
            rule
            CanvasBarButton(title: CanvasMenu.zoomOut, key: "\u{2318}\u{2212}", symbol: "minus") { canvas.run(.zoomOut) }
                .accessibilityIdentifier("canvas.zoomOut")
            Button { canvas.run(.resetZoom) } label: {
                Text("\(percent)%")
                    .font(.system(size: 12, weight: .medium).monospacedDigit())
                    .foregroundStyle(Color.muted)
                    .frame(minWidth: 44, minHeight: CanvasDock.button)
                    .contentShape(Capsule())
            }
            .buttonStyle(.plain)
            .hoverHighlight(Capsule())
            .help("\(CanvasMenu.actualSize) (\u{2318}0)")
            .accessibilityLabel("Zoom \(percent) percent")
            .accessibilityIdentifier("canvas.zoom")
            CanvasBarButton(title: CanvasMenu.zoomIn, key: "\u{2318}+", symbol: "plus") { canvas.run(.zoomIn) }
                .accessibilityIdentifier("canvas.zoomIn")
            // A board you can only look at has nothing to undo.
            if !canvas.viewOnly {
                rule
                CanvasBarButton(title: "Undo", key: "\u{2318}Z", symbol: "arrow.uturn.backward", enabled: canvas.canUndo) { canvas.run(.undo) }
                    .accessibilityIdentifier("canvas.undo")
                CanvasBarButton(title: "Redo", key: "\u{21E7}\u{2318}Z", symbol: "arrow.uturn.forward", enabled: canvas.canRedo) { canvas.run(.redo) }
                    .accessibilityIdentifier("canvas.redo")
            }
        }
        .padding(4)
        .glassEffect(.regular, in: .capsule)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canvas.corner")
        // On or off for every board; it goes while presenting (this bar does) and comes back.
        .onChange(of: map) { _, on in canvas.send(.minimap(on)) }
        .onAppear { if map { canvas.send(.minimap(true)) } }
        .onDisappear { if map { canvas.send(.minimap(false)) } }
    }

    private var rule: some View {
        Rectangle().fill(Color.primary.opacity(0.14)).frame(width: 1, height: 18).padding(.horizontal, 3).accessibilityHidden(true)
    }
}

/// A focused canvas's note list, slid in over the drawing from the window's left edge while the
/// pointer is there; the drawing doesn't move (Emil, 13 November 2026).
struct CanvasEdgePeek<Content: View>: View {
    @Binding var shown: Bool
    @ViewBuilder let content: Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static var width: CGFloat { 330 }

    var body: some View {
        ZStack(alignment: .leading) {
            // The strip that wakes it: the window's left edge.
            Color.clear
                .frame(width: 6)
                .frame(maxHeight: .infinity)
                .contentShape(Rectangle())
                .onHover { if $0 { shown = true } }
                .accessibilityHidden(true)
            if shown {
                content
                    .frame(width: Self.width)
                    .frame(maxHeight: .infinity)
                    .background(Color(nsColor: .windowBackgroundColor))
                    .clipShape(UnevenRoundedRectangle(bottomTrailingRadius: 14, topTrailingRadius: 14))
                    .raised(in: UnevenRoundedRectangle(bottomTrailingRadius: 14, topTrailingRadius: 14))
                    .onHover { if !$0 { shown = false } }
                    .transition(reduceMotion ? .opacity : .move(edge: .leading))
                    .accessibilityIdentifier("canvas.peek")
            }
        }
        .animation(reduceMotion ? nil : .snappy(duration: 0.22), value: shown)
    }
}

/// Non-generic home for the peek's picture switch.
enum CanvasEdgePeekFlag {
    nonisolated(unsafe) static var startShown = false
}
#endif

#if os(macOS)
// MARK: In the window's toolbar (Mac)

private extension View {
    /// The picked one in the accent; the others untouched, as the toolbar's other buttons are.
    @ViewBuilder func picked(_ on: Bool) -> some View {
        if on { foregroundStyle(Color.amberInk) } else { self }
    }
}

/// A board's window toolbar (Emil, 17 November 2026: "sharing, ... at the very right, while the
/// toggles in the center"): where the board is and its name on the left; its actions on the right,
/// Share filled in the accent, then the library, Comments and More. The tools float on the board
/// (CanvasToolPalette). In a narrow column the folder goes first, then Share shows its glyph
/// alone, and the name gets what's left.
enum BoardToolbar {
    /// How much of the bar shows, fullest first.
    enum Fit: Int, Comparable, CaseIterable, Sendable {
        /// The board's folder, and Share in words.
        case full
        /// Without the folder (the list shows it, and More's Move To).
        case noPlace
        /// Share as its glyph, still filled.
        case tight

        static func < (a: Fit, b: Fit) -> Bool { a.rawValue < b.rawValue }
        var showsPlace: Bool { self == .full }
        var shareInWords: Bool { self <= .noPlace }
    }

    /// What the bar holds beside the board's actions, for working out the Fit: the widths are as
    /// drawn (text with its padding).
    struct Room: Equatable, Sendable {
        /// The board's name, whole, as the title field draws it.
        var title: CGFloat = 120
        /// The board's folder (the breadcrumbs).
        var place: CGFloat = 0
        /// The people of a shared board (PresenceStack).
        var people: CGFloat = 0
        /// A line said in the bar ("Added to Habits", with its Undo).
        var said: CGFloat = 0
        /// Full Screen has the window: "Notes" and the name on the left, no back and forward.
        var focus = false
        /// The library's button (not on a board you can only look at).
        var library = true
        /// Share (not for a deleted board).
        var share = true
    }

    // The bar's measures (Tahoe, measured offscreen in the notes window: CanvasNativeUITests,
    // theBoardsToolbarNeverClips). A button is 36 to 39 pt; the bar puts 8 pt between its glass
    // groups.
    static let item: CGFloat = 37
    static let groupGap: CGFloat = 8
    /// Share filled in the accent, in words and as its glyph (59 and 35 pt measured, with no
    /// glass of its own: 4 pt to the next group).
    static let shareWords: CGFloat = 60
    static let shareGlyph: CGFloat = 36
    /// After the name: the toolbar's anchor item (18 pt), and the least the flexible space after
    /// it keeps (26 pt, measured with a long name).
    static let titleTail: CGFloat = 18 + 26
    /// From the column's left edge to its first item, and from the last item to the window's edge.
    static let edges: CGFloat = 4 + 8
    /// Kept spare, so a bar a few points off this Mac's measures still fits (the Air's back and
    /// forward stood 9 pt further apart, round 10).
    static let margin: CGFloat = 12
    /// The name gets at least this much before the bar gives up its next thing.
    static func titleFloor(_ fit: Fit) -> CGFloat {
        switch fit {
        case .full: 200
        case .noPlace: 120
        case .tight: 60
        }
    }
    static let titleMax: CGFloat = 280
    static let titleMin: CGFloat = 60

    /// The width the bar needs at a step, the name aside.
    static func needed(_ fit: Fit, _ room: Room) -> CGFloat {
        var left = room.focus ? item : 2 * item
        if fit.showsPlace, room.place > 0, !room.focus { left += room.place }
        if room.said > 0 { left += room.said + groupGap }
        left += titleTail
        // Share on its own, then the library, Comments and More in one group.
        var right = CGFloat(room.library ? 3 : 2) * item + room.people
        if room.share { right += (fit.shareInWords ? shareWords : shareGlyph) + groupGap }
        return left + right + edges + margin
    }

    /// The fullest step that fits beside the name at its floor, and the width the name gets.
    static func layout(_ room: Room, width: CGFloat) -> (fit: Fit, title: CGFloat) {
        let whole = min(max(room.title, titleMin), titleMax)
        for fit in Fit.allCases {
            let spare = width - needed(fit, room)
            if spare >= min(whole, titleFloor(fit)) || fit == .tight {
                return (fit, max(titleMin, min(whole, spare)))
            }
        }
        return (.tight, titleMin)
    }

    /// The board's name as the title field draws it (CanvasTitleField): its words and padding.
    static func titleWidth(_ name: String) -> CGFloat {
        let font = NSFont.systemFont(ofSize: 13, weight: .semibold)
        return ceil((name.isEmpty ? CanvasNote.title : name).size(withAttributes: [.font: font]).width) + 2 * CanvasTitleField.inset
    }

    /// Where the board's items can start: beside the window's buttons, the sidebar's and the
    /// list's (a narrow list's own buttons run past its column), or the column's own edge.
    static let listBarEnd: CGFloat = 373
    static let windowButtonsEnd: CGFloat = 92

    static let imageTitle = "Image"

    /// Pictures from a file, onto the middle of the view.
    static func pickImage(_ canvas: CanvasController) {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image]
        panel.allowsMultipleSelection = true
        panel.begin { response in
            guard response == .OK else { return }
            let urls = panel.urls
            Task { @MainActor in
                for (i, url) in urls.prefix(10).enumerated() {
                    guard let image = await Task.detached(priority: .userInitiated, operation: { (try? Data(contentsOf: url)).flatMap(CanvasImage.init(data:)) }).value else {
                        canvas.confirm("\u{201C}\(url.lastPathComponent)\u{201D} couldn\u{2019}t be read"); continue
                    }
                    _ = i
                    canvas.send(.image(image, at: nil))
                }
            }
        }
    }
}

/// The library's button in a board's toolbar: its popover of what you keep to draw with.
struct CanvasLibraryButton: View {
    let canvas: CanvasController

    var body: some View {
        Button { canvas.showingLibrary.toggle() } label: {
            Label(CanvasLibraryPopover.title, systemImage: CanvasLibraryPopover.symbol).picked(canvas.showingLibrary).toolbarCell()
        }
        .help(CanvasLibraryPopover.help)
        .accessibilityIdentifier("canvas.tool.library")
        .popover(isPresented: Bindable(canvas).showingLibrary, arrowEdge: .bottom) { CanvasLibraryPopover(canvas: canvas) }
    }
}

/// Excalidraw files brought in as whiteboards (whiteboard council, round 2: "Missing import blocks
/// moving existing work").
@MainActor enum CanvasImport {
    struct Made { var notes: [Note] = []; var refused: [String] = [] }

    static let types: [UTType] = [UTType(filenameExtension: "excalidraw") ?? .json, .json]

    static func make(_ urls: [URL], in scope: Scope, context: ModelContext, pages: NotePageStore = .shared, data: NotePageDataStore = .shared) -> Made {
        var made = Made()
        for url in urls {
            let reach = url.startAccessingSecurityScopedResource()
            defer { if reach { url.stopAccessingSecurityScopedResource() } }
            guard let bytes = try? Data(contentsOf: url), let scene = CanvasNote.scene(fromExcalidraw: bytes) else {
                made.refused.append(url.lastPathComponent); continue
            }
            made.notes.append(CanvasNote.make(in: scope, context: context, pages: pages, data: data, scene: scene, named: CanvasNote.name(ofFile: url)))
        }
        return made
    }

    static func pick() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = types
        panel.allowsMultipleSelection = true
        panel.message = "Choose Excalidraw files. Each one becomes a whiteboard."
        panel.prompt = "Import"
        guard panel.runModal() == .OK else { return }
        NotificationCenter.default.post(name: .paneImportWhiteboards, object: panel.urls)
    }

    static func report(_ made: Made) {
        guard !made.refused.isEmpty else { return }
        let alert = NSAlert()
        alert.messageText = made.refused.count == 1 ? "\u{201C}\(made.refused[0])\u{201D} isn't an Excalidraw file" : "\(made.refused.count) files aren't Excalidraw files"
        alert.informativeText = made.notes.isEmpty ? "Nothing was imported." : "The others are in your notes."
        alert.runModal()
    }
}

// MARK: The library

/// Your whiteboard library, in a popover from the toolbar's Library button (whiteboard council,
/// round 5: "a native shape library, including importing existing Excalidraw libraries and saving
/// a selected group for reuse"). Each item as the board draws it with its name under it, grouped
/// under the library file it came from (CanvasLibraryGrid), with a search field once there are
/// more than 12 (round 6). A click, or the arrow keys and Return, puts it in the middle of the view
/// in a free spot, selected; a drag puts it where it's dropped; right-click › Remove.
struct CanvasLibraryPopover: View {
    let canvas: CanvasController
    var library: CanvasLibrary = .shared
    /// The item the arrow keys start on (its id), for tests; none otherwise.
    var startsOn: String?

    static let title = "Library"
    static let symbol = "books.vertical"
    static let help = "Library: shapes you saved or imported"
    static let saveTitle = "Save to Library"
    static let importTitle = "Import Library\u{2026}"
    static let removeTitle = "Remove"
    static let renameTitle = "Rename\u{2026}"
    static let emptyLine = "Select shapes and choose Save to Library to keep them here."
    static let searchPrompt = "Search"
    static let noMatches = "No items match"

    static let tile: CGFloat = 76
    /// The name under each picture.
    static let label: CGFloat = 18
    static let columns = 4
    static let spacing: CGFloat = 8
    static let padding: CGFloat = 12
    static let heading: CGFloat = 22
    static var width: CGFloat { CGFloat(columns) * tile + CGFloat(columns - 1) * spacing + 2 * padding }
    /// Under the search field: nothing of the grid for `searchGap` points, then it fades in over 10.
    static let searchGap: CGFloat = 4
    static var searchFade: some View {
        VStack(spacing: 0) {
            Color.clear.frame(height: searchGap)
            LinearGradient(colors: [.clear, .black], startPoint: .top, endPoint: .bottom).frame(height: 10)
            Color.black
        }
    }
    /// The groups' height, up to about four rows, so a longer library shows it scrolls. As the
    /// grid lays them out: each group's heading, the gap under it, its rows; a gap between groups
    /// (round 12, library-sync-mac: the gap under each heading wasn't counted, and the footer
    /// covered the last row's names).
    static func gridHeight(_ grid: CanvasLibraryGrid) -> CGFloat {
        let row = tile + label
        let groups = grid.groups.map { g -> CGFloat in
            let rows = CGFloat((g.items.count + columns - 1) / columns)
            return heading + spacing + rows * row + max(rows - 1, 0) * spacing
        }
        let content = groups.reduce(0, +) + CGFloat(max(groups.count - 1, 0)) * spacing
        return min(max(content + 2 * padding, 60), 4.4 * (row + spacing) + padding)
    }

    @State private var query = ""
    /// The name being typed for the item being renamed.
    @State private var draft = ""
    @FocusState private var naming: Bool
    /// The item the arrow keys are on (its id).
    @State private var picked: String?
    @FocusState private var focus: Field?
    private enum Field { case search, grid }

    private var searching: Bool { CanvasLibraryGrid.showsSearch(library.items.count) }
    private var grid: CanvasLibraryGrid { CanvasLibraryGrid(library.items, query: searching ? query : "", columns: Self.columns) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if library.items.isEmpty {
                VStack(spacing: 14) {
                    Text(Self.emptyLine)
                        .font(.system(size: 13))
                        .foregroundStyle(Color.muted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("canvas.library.empty")
                    importButton
                }
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 24)
                .padding(.vertical, 20)
            } else {
                let grid = self.grid
                if searching {
                    TextField(Self.searchPrompt, text: $query, prompt: Text(Self.searchPrompt))
                        .textFieldStyle(.roundedBorder)
                        .focused($focus, equals: .search)
                        .onKeyPress(keys: [.upArrow, .downArrow]) { press in key(press.key, grid) }
                        .onSubmit { if let item = grid.chosen(picked, searching: true) { add(item) } }
                        .padding([.horizontal, .top], Self.padding)
                        .accessibilityIdentifier("canvas.library.search")
                }
                ScrollViewReader { scroll in
                    ScrollView {
                        if grid.groups.isEmpty {
                            Text(Self.noMatches)
                                .font(.system(size: 13))
                                .foregroundStyle(Color.muted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 20)
                                .accessibilityIdentifier("canvas.library.noMatches")
                        }
                        VStack(alignment: .leading, spacing: Self.spacing) {
                            ForEach(grid.groups) { group in
                                Text(group.title)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(Color.muted)
                                    .lineLimit(1)
                                    .frame(height: Self.heading, alignment: .bottomLeading)
                                    .accessibilityAddTraits(.isHeader)
                                    .accessibilityIdentifier("canvas.library.group")
                                LazyVGrid(columns: Array(repeating: GridItem(.fixed(Self.tile), spacing: Self.spacing), count: Self.columns), spacing: Self.spacing) {
                                    ForEach(group.items) { tile($0).id($0.id) }
                                }
                            }
                        }
                        .padding(Self.padding)
                    }
                    .onChange(of: picked) { _, id in if let id { withAnimation(.snappy(duration: 0.15)) { scroll.scrollTo(id) } } }
                }
                .frame(height: Self.gridHeight(grid))
                // The grid stays under the search field: cut at its own top, with a clear gap and
                // a short fade below the field (round 14, library-sync-mac-end: tiles scrolled up
                // under the field and touched its edge).
                .mask { if searching { Self.searchFade } else { Rectangle() } }
                HStack {
                    importButton
                    Spacer(minLength: 8)
                    Text(library.items.count == 1 ? "1 item" : "\(library.items.count) items")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.muted)
                }
                .padding(.horizontal, Self.padding)
                .padding(.bottom, Self.padding)
            }
        }
        .frame(width: Self.width)
        // The arrow keys and Return, with the search field or the grid in focus.
        .focusable(!library.items.isEmpty)
        .focused($focus, equals: .grid)
        .focusEffectDisabled()
        .onKeyPress(keys: [.leftArrow, .rightArrow, .upArrow, .downArrow, .return]) { press in
            if canvas.renamingLibraryItem != nil { return .ignored }
            if press.key == .return {
                guard let item = grid.chosen(picked, searching: searching && !query.isEmpty) else { return .ignored }
                add(item)
                return .handled
            }
            // In the search field, left and right move through its words.
            if focus == .search, press.key == .leftArrow || press.key == .rightArrow { return .ignored }
            return key(press.key, grid)
        }
        .onChange(of: query) { picked = nil }
        .onAppear { focus = searching ? .search : .grid; if picked == nil { picked = startsOn } }
        .onDisappear { canvas.renamingLibraryItem = nil }
        // Pictures for what has none yet (an imported library), drawn by the board.
        .task(id: library.items.map(\.id)) { await canvas.drawThumbnails(library) }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Self.title)
        .accessibilityIdentifier("canvas.library")
    }

    private func key(_ key: KeyEquivalent, _ grid: CanvasLibraryGrid) -> KeyPress.Result {
        let move: CanvasLibraryGrid.Move
        switch key {
        case .leftArrow: move = .left
        case .rightArrow: move = .right
        case .upArrow: move = .up
        case .downArrow: move = .down
        default: return .ignored
        }
        picked = grid.moved(picked, move)
        return .handled
    }

    private var importButton: some View {
        Button(Self.importTitle) { CanvasLibraryImport.pick(canvas, library: library) }
            .accessibilityIdentifier("canvas.library.import")
    }

    private func tile(_ item: CanvasLibraryItem) -> some View {
        let shape = RoundedRectangle(cornerRadius: 10, style: .continuous)
        return Button { add(item) } label: {
            VStack(spacing: 2) {
                CanvasLibraryThumbnail(item: item, light: library.thumbnails[item.id], dark: library.darkThumbnails[item.id])
                    .padding(9)
                    .frame(width: Self.tile, height: Self.tile)
                    .background(Color.primary.opacity(0.045), in: shape)
                    .overlay { if picked == item.id { shape.strokeBorder(Color.paneAccent, lineWidth: 2) } }
                if canvas.renamingLibraryItem == item.id {
                    Color.clear.frame(width: Self.tile, height: Self.label - 2)
                } else {
                    Text(item.title)
                        .font(.system(size: 11))
                        .foregroundStyle(picked == item.id ? Color.primary : Color.muted)
                        .lineLimit(1)
                        .truncationMode(.tail)
                        .frame(width: Self.tile, height: Self.label - 2)
                }
            }
            .contentShape(.rect)
        }
        .buttonStyle(CanvasPressStyle())
        .hoverHighlight(shape)
        .help("\(item.title). Click to add it, or drag it onto the board.")
        .contextMenu {
            Button("Add to Whiteboard") { add(item) }
            Button(Self.renameTitle) { canvas.renamingLibraryItem = item.id }
            Divider()
            Button(Self.removeTitle, role: .destructive) { library.remove(item.id) }
        }
        .onDrag { CanvasLibraryDrag.provider(item) }
        .accessibilityLabel(item.title)
        .accessibilityHint("Adds it to the whiteboard")
        .accessibilityAddTraits(picked == item.id ? .isSelected : [])
        .accessibilityIdentifier("canvas.library.item")
        // The name typed in place, as Finder renames: Return keeps it, Escape leaves it as it was.
        .overlay(alignment: .bottom) {
            if canvas.renamingLibraryItem == item.id {
                TextField("Name", text: $draft)
                    .textFieldStyle(.plain)
                    .font(.system(size: 11))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 3)
                    .frame(width: Self.tile + 6, height: Self.label)
                    .background(Color(nsColor: .textBackgroundColor), in: .rect(cornerRadius: 4))
                    .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(Color.paneAccent, lineWidth: 1.5))
                    .offset(y: 1)
                    .focused($naming)
                    .onSubmit { finishRename(item, keep: true) }
                    .onExitCommand { finishRename(item, keep: false) }
                    .onChange(of: naming) { _, now in if !now, canvas.renamingLibraryItem == item.id { finishRename(item, keep: true) } }
                    .onAppear { draft = item.title; naming = true }
                    .accessibilityLabel("Name")
                    .accessibilityIdentifier("canvas.library.rename")
            }
        }
    }

    private func finishRename(_ item: CanvasLibraryItem, keep: Bool) {
        guard canvas.renamingLibraryItem == item.id else { return }
        canvas.renamingLibraryItem = nil
        if keep, draft != item.title { library.rename(item.id, to: draft) }
    }

    private func add(_ item: CanvasLibraryItem) {
        canvas.renamingLibraryItem = nil
        canvas.showingLibrary = false
        canvas.insert(item)
    }
}

/// An item as the board draws it, in dark mode in the colours the canvas shows then
/// (CanvasLibrary.darkened), or its outline until the board has drawn it.
struct CanvasLibraryThumbnail: View {
    let item: CanvasLibraryItem
    var light: PImage?
    var dark: PImage?
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if let image = scheme == .dark ? dark : light {
            Image(nsImage: image).resizable().interpolation(.high).scaledToFit()
        } else {
            CanvasSketchView(sketch: CanvasSketch(elements: item.elements), lineWidth: 1)
        }
    }
}
#endif

/// A library item dragged from the Library popover onto a board: its id, for this app only.
enum CanvasLibraryDrag {
    static let type = UTType(exportedAs: "dev.emilwagman.pane.whiteboard-shape", conformingTo: .data)

    static func provider(_ item: CanvasLibraryItem) -> NSItemProvider {
        let p = NSItemProvider()
        let id = Data(item.id.utf8)
        p.registerDataRepresentation(forTypeIdentifier: type.identifier, visibility: .ownProcess) { done in
            done(id, nil)
            return nil
        }
        return p
    }

    /// The library item being dropped, if it's one.
    @MainActor static func item(from providers: [NSItemProvider], in library: CanvasLibrary) async -> CanvasLibraryItem? {
        guard let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier(type.identifier) }) else { return nil }
        let data: Data? = await withCheckedContinuation { done in
            _ = p.loadDataRepresentation(forTypeIdentifier: type.identifier) { d, _ in done.resume(returning: d) }
        }
        guard let data else { return nil }
        let id = String(decoding: data, as: UTF8.self)
        return library.items.first { $0.id == id }
    }
}

/// Excalidraw libraries (.excalidrawlib, from libraries.excalidraw.com or Excalidraw's own Export
/// library) into your library: Import Library… in the popover, or a library file dropped on a board.
@MainActor enum CanvasLibraryImport {
    struct Report: Equatable { var added = 0; var already = 0; var refused: [String] = [] }

    static func add(_ urls: [URL], to library: CanvasLibrary) -> Report {
        var r = Report()
        for url in urls {
            let reach = url.startAccessingSecurityScopedResource()
            defer { if reach { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url), let got = library.importLibrary(data, source: CanvasLibraryFile.displayName(url)) else { r.refused.append(url.lastPathComponent); continue }
            r.added += got.added
            r.already += got.already
        }
        return r
    }

    /// What the board says after: "Added 12 items to the library".
    static func said(_ r: Report) -> String? {
        if r.added > 0 { return r.added == 1 ? "Added 1 item to the library" : "Added \(r.added) items to the library" }
        if r.already > 0 { return "Already in your library" }
        return nil
    }

    /// Adds them, says so over the board, and opens the library on what came in.
    static func run(_ urls: [URL], canvas: CanvasController, library: CanvasLibrary = .shared) {
        let r = add(urls, to: library)
        if let s = said(r) { canvas.confirm(s, for: .seconds(3)) }
        if r.added + r.already > 0 { canvas.showingLibrary = true }
        #if os(macOS)
        if !r.refused.isEmpty {
            let alert = NSAlert()
            alert.messageText = r.refused.count == 1 ? "\u{201C}\(r.refused[0])\u{201D} isn\u{2019}t an Excalidraw library" : "\(r.refused.count) files aren\u{2019}t Excalidraw libraries"
            alert.informativeText = "A library is an .excalidrawlib file, like the ones on libraries.excalidraw.com."
            alert.runModal()
        }
        #endif
    }

    #if os(macOS)
    static func pick(_ canvas: CanvasController, library: CanvasLibrary = .shared) {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [CanvasLibraryFile.contentType, .json]
        panel.allowsMultipleSelection = true
        panel.message = "Choose Excalidraw libraries (.excalidrawlib) to add to your library."
        panel.prompt = "Import"
        // The panel takes over from the popover; it comes back with what was added.
        canvas.showingLibrary = false
        panel.begin { response in
            guard response == .OK else { return }
            run(panel.urls, canvas: canvas, library: library)
        }
    }
    #endif
}

#if os(macOS)
/// Export and Copy as PNG, from the More menu and File › Export (Excalidraw's Export image and
/// Copy to clipboard as PNG, ⇧⌥C there; ⇧⌥⌘C here, with the Mac's ⌘).
@MainActor enum CanvasExportAction {
    static func save(_ format: CanvasExport, canvas: CanvasController) {
        Task { @MainActor in
            guard let data = await canvas.export(format) else { canvas.confirm("Nothing to export yet"); return }
            let panel = NSSavePanel()
            panel.allowedContentTypes = [format.contentType]
            panel.nameFieldStringValue = CanvasExport.filename(canvas.title, format)
            panel.canCreateDirectories = true
            panel.begin { response in
                guard response == .OK, let url = panel.url else { return }
                do { try data.write(to: url, options: .atomic); canvas.confirm("Exported \(url.lastPathComponent)") }
                catch { canvas.confirm("Couldn\u{2019}t save \(url.lastPathComponent)") }
            }
        }
    }

    /// The selection if there is one, else the whole board.
    static func copy(_ canvas: CanvasController) {
        Task { @MainActor in
            let selected = canvas.state.bounds != nil
            guard let data = await canvas.export(.png, selected: selected), let image = NSImage(data: data) else { canvas.confirm("Nothing to copy yet"); return }
            NSPasteboard.general.clearContents()
            NSPasteboard.general.writeObjects([image])
            canvas.confirm(selected ? "Copied the selection as PNG" : "Copied as PNG")
        }
    }

    static let copyTitle = "Copy as PNG"
}

/// A canvas's name, in the toolbar after where it is: click it to rename, Return or a click away
/// keeps it, Escape puts it back. A canvas has no text for a title line, so this is where it's
/// named (Emil, 13 November 2026: "there is no way to name the canvas").
struct CanvasTitleField: View {
    let note: Note
    /// Its widest (BoardToolbar.titleWidth): a long name is cut short in a narrow column.
    var maxWidth: CGFloat = 280
    @State private var text = ""
    @FocusState private var focused: Bool
    /// The name's inset after the folder's chevron: a note's title's, so a board's location reads
    /// exactly as a note's (folder, chevron, name).
    static let inset = ButtonSize.compact.padding * 0.75

    var body: some View {
        // Sized to what's typed, from a hidden copy of it.
        Text(text.isEmpty ? CanvasNote.title : text)
            .font(.system(size: 13, weight: .semibold))
            .lineLimit(1)
            .padding(.horizontal, Self.inset)
            .hidden()
            .frame(minWidth: 60, maxWidth: maxWidth)
            .overlay {
                TextField(CanvasNote.title, text: $text)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, weight: .semibold))
                    // Its own text clear while the name is only shown: the label below draws it.
                    .foregroundStyle(labelled ? AnyShapeStyle(Color.clear) : AnyShapeStyle(Color.ink))
                    .padding(.horizontal, Self.inset)
                    .overlay(alignment: .leading) {
                        // A name cut short ends in "…" (round 12: the field clipped it mid-letter,
                        // "Product laun", in a narrow window). Clicks go to the field under it.
                        if labelled {
                            Text(text)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(Color.ink)
                                .lineLimit(1)
                                .truncationMode(.tail)
                                .padding(.horizontal, Self.inset)
                                .allowsHitTesting(false)
                                .accessibilityHidden(true)
                        }
                    }
                    .focused($focused)
                    .onSubmit { commit(); toBoard() }
                    .onExitCommand { text = note.title; focused = false; toBoard() }
                    .help("Rename")
                    .accessibilityLabel("Whiteboard name")
                    .accessibilityIdentifier("canvas.title")
            }
            .frame(height: 24)
            .background(focused ? Color.primary.opacity(0.07) : .clear, in: .rect(cornerRadius: 6))
            .onAppear { text = note.title }
            .onChange(of: note.id) { _, _ in text = note.title }
            .onChange(of: note.title) { _, t in if !focused { text = t } }
            .onChange(of: focused) { _, now in if !now { commit() } }
    }

    /// Shown, not being renamed: the label draws the name.
    private var labelled: Bool { !focused && !text.isEmpty }

    private func commit() {
        if let t = Self.renamed(note, to: text) { text = t } else { text = note.title }
    }

    /// Done renaming (Return or Escape): the keys go back to the board, so its tool keys pick
    /// tools again (real-window check, 17 Nov: P after the name typed into it).
    private func toBoard() {
        guard let web = NotePageLive.view(note.id) else { return }
        web.window?.makeFirstResponder(web)
    }

    /// Renames a canvas: its text is its title, one line. Nil when there's nothing to change.
    @MainActor @discardableResult
    static func renamed(_ note: Note, to typed: String) -> String? { CanvasRename.renamed(note, to: typed) }
}
#endif

/// Renaming a board (its text is its title, one line), on every platform: the title field on the
/// Mac, and a template's name on both.
enum CanvasRename {
    /// Nil when there's nothing to change.
    @MainActor @discardableResult
    static func renamed(_ note: Note, to typed: String) -> String? {
        guard let t = title(typed, for: note) else { return nil }
        note.body = t
        note.touch()
        return t
    }

    /// The name typed, on one line, or nil when there's nothing to change.
    static func title(_ typed: String, for note: Note) -> String? {
        let t = typed.components(separatedBy: .newlines).joined(separator: " ").trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty, t != note.title, !note.isLocked else { return nil }
        return t
    }

    /// A shared board's name is its document's title: renamed there, for everyone. Nil for a
    /// viewer, or when there's nothing to change.
    @MainActor @discardableResult
    static func renamed(_ note: Note, to typed: String, in session: CollabSession) -> String? {
        guard session.canWrite, let t = title(typed, for: note) else { return nil }
        session.localFromOutside(t)
        return t
    }
}
