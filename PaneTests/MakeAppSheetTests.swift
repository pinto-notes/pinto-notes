#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Make It an App (More, and the chip on a note that looks like one). Emil, using 1.2.4: the menu
/// item's icon was a blank square, and the sheet had a blank yellow square, one huge button, a
/// footer bar and half a window of empty space. The symbol is one that reads as apps, and the sheet
/// is as tall as what it says, in each state. With PANE_SNAPSHOT_DIR (or the snapshot run's
/// AMBER_HIG_SHOTS) set, each state is drawn offscreen, light and dark, in both layouts tried.
@MainActor
@Suite(.serialized) struct MakeAppSheetTests {
    @Test func theMenuSymbolIsARealSymbolAndNotAPlainSquare() {
        #expect(NoteAppMark.symbol != "app.fill" && NoteAppMark.symbol != "app")
        #expect(NSImage(systemSymbolName: NoteAppMark.symbol, accessibilityDescription: nil) != nil, "\(NoteAppMark.symbol) exists on this system")
    }

    /// The More menu's rows as labels at menu size, the old symbol beside the new one (a picture of
    /// the symbols, not of the menu itself: a menu can't be drawn offscreen).
    @Test func theSymbolBesideItsNeighbours() throws {
        let env = ProcessInfo.processInfo.environment
        guard let dir = env["PANE_SNAPSHOT_DIR"] ?? env["AMBER_HIG_SHOTS"] else { return }
        for dark in [false, true] {
            let rows = HStack(alignment: .top, spacing: 36) {
                ForEach([("Before", "app.fill"), ("After", NoteAppMark.symbol)], id: \.0) { name, symbol in
                    VStack(alignment: .leading, spacing: 9) {
                        Text(name).font(.system(size: 11, weight: .semibold)).foregroundStyle(.secondary)
                        Label("Pin Note", systemImage: "pin")
                        Label("Move to…", systemImage: "folder")
                        Label("Show Version History…", systemImage: "clock.arrow.circlepath")
                        Label("Make It an App…", systemImage: symbol)
                        Label("Lock Note", systemImage: "lock")
                    }
                    .font(.system(size: 13))
                }
            }
            .padding(20)
            .background(Color(Palette.sheetGround))
            let host = NSHostingView(rootView: rows.fixedSize())
            host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            host.frame = CGRect(origin: .zero, size: host.fittingSize)
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            try #require(rep.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: dir).appending(path: "mac-make-app-menu-symbol-\(dark ? "dark" : "light").png"))
        }
    }

    private func host(connected: Bool, layout: MakeAppSheet.Layout, dark: Bool) async throws -> NSHostingView<some View> {
        MakeAppSheet.stateForPictures = connected
        MakeAppSheet.layout = layout
        let host = NSHostingView(rootView: MakeAppSheet(title: "Evening tracker", body_: Capture.habitNote())
            .environment(\.controlActiveState, .key).fixedSize())
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        host.layoutSubtreeIfNeeded()
        // The state arrives from the sheet's own task.
        try await Task.sleep(for: .milliseconds(400))
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        host.layoutSubtreeIfNeeded()
        return host
    }

    @Test func theSheetIsTheSizeOfWhatItSays() async throws {
        defer { MakeAppSheet.stateForPictures = nil; MakeAppSheet.layout = .stacked }
        let env = ProcessInfo.processInfo.environment
        let dir = env["PANE_SNAPSHOT_DIR"] ?? env["AMBER_HIG_SHOTS"]
        for layout in [MakeAppSheet.Layout.stacked, .pictureFirst] {
            var heights: [Bool: CGFloat] = [:]
            for connected in [false, true] {
                for dark in [false, true] {
                    let host = try await host(connected: connected, layout: layout, dark: dark)
                    heights[connected] = host.fittingSize.height
                    #expect(host.fittingSize.width == 420)
                    guard let dir else { continue }
                    let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                    host.cacheDisplay(in: host.bounds, to: rep)
                    let png = try #require(rep.representation(using: .png, properties: [:]))
                    try png.write(to: URL(fileURLWithPath: dir).appending(path: "mac-make-app-\(layout.rawValue)-\(connected ? "connected" : "no-ai")-\(dark ? "dark" : "light").png"))
                }
            }
            // No window of empty space: connecting is one button under the words, and the prompt
            // makes the sheet taller only by its own lines.
            let none = try #require(heights[false]), with = try #require(heights[true])
            #expect(none < 420, "\(layout): no AI connected is \(none) pt tall")
            #expect(with > none && with < none + 160, "\(layout): with the prompt it is \(with) pt tall")
        }
    }
}
#endif
