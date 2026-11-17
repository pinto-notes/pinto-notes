#if os(macOS)
import AppKit
import SwiftUI
import Testing
import UniformTypeIdentifiers
@testable import Pane

/// Editor-only note opens. No SwiftData, list, toolbar, network or visible window.
/// Timings are diagnostic; structural behaviour belongs in the interaction suites.
@MainActor @Suite(.serialized) struct EditorOpenStageTests {
    /// Recreate the previous delegate order without a production switch. Alternate the two
    /// orders so CPU load changes affect both measurements in the same stretch of the run.
    @Test func pairedInitialConfiguration() async {
        let clock = ContinuousClock()
        for (name, text) in [("small", "Title\n\nSome **bold** text.\n- [ ] Task\n"),
                             ("80 lines", PerfFixtures.longNote(lines: 80)),
                             ("10 tables", PerfFixtures.blockyNote(embeds: 0))] {
            var samples: [Bool: [Double]] = [:]
            for iteration in 0..<25 {
                for previousOrder in iteration.isMultiple(of: 2) ? [true, false] : [false, true] {
                    let view = PaneTextView(frame: .zero)
                    if previousOrder { view.delegate = view }
                    let start = clock.now
                    view.configure(text: text, header: "Today")
                    let duration = clock.now - start
                    if iteration > 0 {
                        samples[previousOrder, default: []].append(Double(duration.components.seconds) * 1000 + Double(duration.components.attoseconds) / 1e15)
                    }
                    #expect(view.core.lastRegions.count == (previousOrder ? 2 : 1))
                    #expect(view.string == text)
                }
                await Task.yield()
            }
            print("PERF paired initial configuration [\(name), Debug, 24 pairs]: previous \(String(format: "%.3f", PerfTiming.median(samples[true]!))) ms, fixed \(String(format: "%.3f", PerfTiming.median(samples[false]!))) ms")
        }
    }

    @Test func representedEditorReplacementAndReuse() async {
        let clock = ContinuousClock()
        for reuse in [false, true] {
            let controller = EditorController()
            func editor(_ index: Int) -> AnyView {
                AnyView(MarkdownEditor(initialText: "Note \(index)\n\nSome text with **bold** and a list:\n- one\n- two\n",
                                       header: "Today", controller: controller, onChange: { _ in })
                    .id(reuse ? 0 : index))
            }
            let window = NSWindow(contentRect: NSRect(x: -30000, y: -30000, width: 720, height: 760),
                                  styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            let host = NSHostingView(rootView: editor(0))
            window.contentView = host
            host.layoutSubtreeIfNeeded()
            window.displayIfNeeded()
            var samples: [Double] = []
            var throughQueuedDisplay: [Double] = []
            weak var previous = controller.target
            for index in 1...25 {
                let start = clock.now
                host.rootView = editor(index)
                host.layoutSubtreeIfNeeded()
                window.displayIfNeeded()
                let duration = clock.now - start
                samples.append(Double(duration.components.seconds) * 1000 + Double(duration.components.attoseconds) / 1e15)
                for _ in 0..<4 { await Task.yield() }
                host.layoutSubtreeIfNeeded()
                window.displayIfNeeded()
                let queuedDuration = clock.now - start
                throughQueuedDisplay.append(Double(queuedDuration.components.seconds) * 1000 + Double(queuedDuration.components.attoseconds) / 1e15)
                #expect(controller.target?.currentText.hasPrefix("Note \(index)\n") == true)
                if reuse { #expect(controller.target === previous) }
                else { #expect(controller.target !== previous) }
                previous = controller.target
            }
            print("PERF represented small editor [\(reuse ? "reuse experiment" : "replace as shipped")]: median \(String(format: "%.3f", PerfTiming.median(samples))) ms")
            print("PERF represented small editor through queued display [\(reuse ? "reuse experiment" : "replace as shipped")]: median \(String(format: "%.3f", PerfTiming.median(throughQueuedDisplay))) ms")
            window.close()
        }
    }

    @Test func openingEditorStages() async throws {
        let photo = try NoteOpenTests.photo(0.3)
        let files = try (0..<3).map { try FileStore.importData(photo, filename: "editor-open-\($0).jpg", type: .jpeg) }
        defer { for file in files { FileStore.remove(file) } }
        let fixtures = [
            ("small", "A note\n\nSome text with **bold** and a list:\n- one\n- two\n"),
            ("80 lines", PerfFixtures.longNote(lines: 80)),
            ("blocks", PerfFixtures.blockyNote().replacingOccurrences(of: #"https://example.com/(\d+)/(\d+)"#,
                                                                        with: "![[Synthetic $1-$2]]", options: .regularExpression)),
            ("3 photos", "Trip\n\n" + files.map { $0.markdown }.joined(separator: "\n\n"))
        ]
        let clock = ContinuousClock()
        func milliseconds(_ duration: Duration) -> Double {
            Double(duration.components.seconds) * 1000 + Double(duration.components.attoseconds) / 1e15
        }
        for (name, text) in fixtures {
            var samples: [String: [Double]] = [:]
            for iteration in 0..<25 {
                func stage<T>(_ name: String, _ action: () -> T) -> T {
                    let start = clock.now
                    let result = action()
                    samples[name, default: []].append(milliseconds(clock.now - start))
                    return result
                }
                let window = NSWindow(contentRect: NSRect(x: -30000, y: -30000, width: 720, height: 760),
                                      styleMask: [.borderless], backing: .buffered, defer: false)
                window.isReleasedWhenClosed = false
                let start = clock.now
                let scroll = stage("scroll") { NSScrollView(frame: NSRect(x: 0, y: 0, width: 720, height: 760)) }
                scroll.drawsBackground = false
                scroll.hasVerticalScroller = true
                scroll.autohidesScrollers = true
                scroll.scrollerStyle = .overlay
                let view = stage("text view + TextKit") { PaneTextView(frame: .zero) }
                let controller = EditorController()
                controller.resolveAttachment = { id in files.first { $0.id == id } }
                stage("configure") { view.configure(text: text, header: "Today") }
                view.controller = controller
                view.core.resolveAttachment = { id in controller.resolveAttachment(id) }
                controller.target = view
                stage("attach") { scroll.documentView = view; window.contentView = scroll }
                stage("viewport") {
                    scroll.layoutSubtreeIfNeeded()
                    view.setFrameSize(NSSize(width: scroll.contentSize.width, height: scroll.contentSize.height))
                    view.layoutSubtreeIfNeeded()
                    view.textLayoutManager?.textViewportLayoutController.layoutViewport()
                }
                stage("overlays") { view.layoutCards(animated: false) }
                stage("display") { window.displayIfNeeded() }
                samples["total", default: []].append(milliseconds(clock.now - start))
                // Include the editor's queued overlay passes in a second measurement.
                for _ in 0..<4 { await Task.yield() }
                window.contentView?.layoutSubtreeIfNeeded()
                window.displayIfNeeded()
                samples["through queued display", default: []].append(milliseconds(clock.now - start))
                #expect(view.string == text)
                #expect(view.textLayoutManager != nil, "the real TextKit 2 editor is measured")
                #expect(view.textContainer!.size.width > 600, "the editor has its final column width")
                if iteration == 1 {
                    func countViews(_ root: NSView) -> Int { 1 + root.subviews.reduce(0) { $0 + countViews($1) } }
                    print("PERF editor native subtree [\(name)]: \(countViews(scroll)) views")
                }
                window.close()
                if iteration == 0 {
                    print("PERF editor first [\(name)]: " + samples.keys.sorted().map {
                        "\($0)=\(String(format: "%.3f", samples[$0]!.last!)) ms"
                    }.joined(separator: ", "))
                    samples = [:]
                }
            }
            print("PERF editor warm [\(name), Debug, 24 opens]: " + samples.keys.sorted().map {
                "\($0)=\(String(format: "%.3f", PerfTiming.median(samples[$0]!))) ms"
            }.joined(separator: ", "))
        }
    }
}
#endif
