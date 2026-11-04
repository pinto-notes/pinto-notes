#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The Home Screen checklist widget as the extension draws it (ChecklistWidgetView, shared with
/// PaneWidgets), drawn offscreen with ImageRenderer at iPhone 17 Pro sizes (small 170 pt, medium
/// 364 × 170, 16 pt margins), light and dark, with no window. The checks hold the brief's sizes;
/// the pictures go to $PANE_WIDGET_SHOTS:
/// `TEST_RUNNER_PANE_WIDGET_SHOTS=/path scripts/qa-test.sh PaneTests/ChecklistWidgetShots`
@MainActor @Suite(.serialized) struct ChecklistWidgetShots {
    static let small = CGSize(width: 170, height: 170)
    static let medium = CGSize(width: 364, height: 170)
    static let margin: CGFloat = 16

    /// The demo's Groceries, as the app leaves it (ChecklistShelf.list).
    static var groceries: ChecklistShelf.List {
        ChecklistShelf.list(id: UUID(), title: "Groceries", body: """
        Groceries

        For the weekend, and Sunday dinner with Sara and Jonas.

        - [ ] Oat milk
        - [ ] Lemons
        - [ ] Coffee beans
        - [ ] Fresh basil
        - [ ] Burrata
        - [ ] Cherry tomatoes
        - [ ] Olive oil
        - [ ] Dark chocolate
        - [x] Sourdough
        - [x] Eggs
        - [x] Spinach
        """, updatedAt: .now, pinned: true)!
    }

    /// The widget on a Home Screen-like ground: its rounded card, margins and the app's tint.
    static func widget(_ content: ChecklistWidgetContent, size: CGSize, dark: Bool) -> some View {
        ChecklistWidgetView(content: content, medium: size.width > size.height)
            .padding(margin)
            .frame(width: size.width, height: size.height)
            .background(ChecklistWidgetGround())
            .clipShape(.rect(cornerRadius: 23, style: .continuous))
            .padding(24)
            .background(dark ? Color(white: 0.16) : Color(red: 0.86, green: 0.88, blue: 0.92))
            .tint(Color(PColor.paneAccent))
            .environment(\.colorScheme, dark ? .dark : .light)
    }

    static func render(_ view: some View) throws -> NSBitmapImageRep {
        let r = ImageRenderer(content: view)
        r.scale = 3
        let cg = try #require(r.cgImage)
        return NSBitmapImageRep(cgImage: cg)
    }

    /// SwiftUI's yellow "can't draw this" placeholder anywhere in these pixel rows.
    static func hasPlaceholder(_ rep: NSBitmapImageRep, rows: Range<Int>) -> Bool {
        for y in rows where y < rep.pixelsHigh {
            for x in stride(from: 0, to: rep.pixelsWide, by: 3) {
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB) else { continue }
                if c.redComponent > 0.95, c.greenComponent > 0.74, c.greenComponent < 0.9, c.blueComponent < 0.1 { return true }
            }
        }
        return false
    }

    @Test func sizesAreTheBriefs() {
        #expect(ChecklistWidgetLayout.smallRows == 4)
        #expect(ChecklistWidgetLayout.mediumRows == 7)
        #expect(ChecklistWidgetLayout.circle == 22)
        #expect(ChecklistWidgetLayout.text == 15)
        // Title and four rows fit the small widget inside its margins.
        #expect(20 + 4 + CGFloat(ChecklistWidgetLayout.smallRows) * ChecklistWidgetLayout.row <= Self.small.height - 2 * Self.margin)
    }

    @Test func itDrawsEveryStateLightAndDark() throws {
        let dir = ProcessInfo.processInfo.environment["PANE_WIDGET_SHOTS"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        var ticked = Self.groceries
        ticked.items[1].done = true
        let cases: [(String, ChecklistWidgetContent, CGSize)] = [
            ("widget-small", .list(Self.groceries), Self.small),
            ("widget-medium", .list(Self.groceries), Self.medium),
            ("widget-medium-ticked", .list(ticked), Self.medium),
            ("widget-small-empty", .noLists, Self.small),
            ("widget-small-gone", .gone, Self.small),
        ]
        for (name, content, size) in cases {
            for dark in [false, true] {
                let rep = try Self.render(Self.widget(content, size: size, dark: dark))
                #expect(rep.pixelsWide == Int((size.width + 48) * 3), "\(name)")
                // Something was drawn: the widget's ground differs from the screen around it.
                let inside = rep.colorAt(x: Int(24 * 3 + 8), y: Int(24 * 3 + 120 * 3))
                let outside = rep.colorAt(x: 4, y: 4)
                #expect(inside != outside, "\(name)")
                // The title draws: no view the widget can't draw (a Link, once) leaves SwiftUI's
                // yellow placeholder across the top.
                #expect(!Self.hasPlaceholder(rep, rows: (24 + 16) * 3 ..< (24 + 36) * 3), "\(name)")
                if let dir {
                    try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }
}
#endif
