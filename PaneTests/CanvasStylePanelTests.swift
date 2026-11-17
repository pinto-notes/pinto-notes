#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The board's style panel (CanvasStyleSidebar) and Excalidraw's colour picker in it
/// (CanvasColorPicker): which sections show for what, wide or as a strip, where the bar over the
/// selection's actions went, and the picker's colours and keys (Emil, 16 and 17 November 2026).
/// The panel on a live board: BoardEmilFixesTests.
@MainActor @Suite struct CanvasStylePanelTests {
    /// Full Screen gets Excalidraw's whole panel; beside the sidebar and the list, its strip.
    @Test func wideOnAWideBoardElseAStrip() {
        #expect(CanvasStyleSidebar.layout(board: 1400) == .wide)
        #expect(CanvasStyleSidebar.layout(board: CanvasStyleSidebar.wideFrom) == .wide)
        #expect(CanvasStyleSidebar.layout(board: CanvasStyleSidebar.wideFrom - 1) == .compact)
        #expect(CanvasStyleSidebar.layout(board: 760) == .compact)
        #expect(CanvasStyleSidebar.panelWidth(.wide) == CanvasStyleSidebar.width && CanvasStyleSidebar.panelWidth(.compact) == CanvasStyleSidebar.strip)
    }

    /// Only the sections that apply, as Excalidraw's panel shows them.
    @Test func theSectionsFollowWhatsSelected() {
        // Nothing selected: what the next shape takes.
        let next = CanvasStyleSidebar.parts(CanvasState())
        #expect(next.next && next.stroke && next.fill && next.width && next.line && next.text && next.opacity)
        #expect(!next.layers && !next.align && !next.template && !next.actions)
        // A box: its stroke, fill and line, its layer, and what to do with it; its fill's style
        // once it has a fill.
        let box = CanvasStyleSidebar.parts(CanvasState(["selection": ["rectangle"]]))
        #expect(box.stroke && box.fill && box.width && box.line && box.opacity && box.layers && box.actions)
        #expect(!box.next && !box.text && !box.arrow && !box.align && !box.fillStyle && !box.template)
        #expect(CanvasStyleSidebar.parts(CanvasState(["selection": ["rectangle"], "style": ["backgroundColor": "#ffec99"]])).fillStyle)
        // Two or more: Align.
        #expect(CanvasStyleSidebar.parts(CanvasState(["selection": ["rectangle", "ellipse"]])).align)
        // An arrow: its type and heads.
        #expect(CanvasStyleSidebar.parts(CanvasState(["selection": ["arrow"]])).arrow)
        // Words: their font, size and colour.
        let words = CanvasStyleSidebar.parts(CanvasState(["selection": ["text"]]))
        #expect(words.text && words.stroke && !words.fill && !words.width)
        // A picture: no stroke or fill; its layer and actions (Crop among them).
        let picture = CanvasStyleSidebar.parts(CanvasState(["selection": ["image"]]))
        #expect(!picture.stroke && !picture.fill && !picture.width && picture.layers && picture.actions)
        // The pen picked: its colour and width, no line style.
        let pen = CanvasStyleSidebar.parts(CanvasState(["tool": "freedraw"]))
        #expect(pen.stroke && pen.width && !pen.line && !pen.fill && !pen.next && !pen.actions)
        // A Kanban column: its template's next part.
        #expect(CanvasStyleSidebar.parts(CanvasState(["selection": ["rectangle"], "grows": "column"])).template)
        // Cropping: Done, and nothing else.
        var done = CanvasStyleSidebar.Parts()
        done.opacity = false
        done.actions = true
        #expect(CanvasStyleSidebar.parts(CanvasState(["selection": ["image"], "cropping": true])) == done)
    }

    /// The strip has a button for each section that applies, in the panel's order.
    @Test func theStripHasAButtonForEachSection() {
        func pops(_ m: [String: Any]) -> [CanvasStyleSidebar.Pop] {
            CanvasStyleSidebar.Pop.allCases.filter { $0.shows(CanvasStyleSidebar.parts(CanvasState(m))) }
        }
        #expect(pops([:]) == [.stroke, .fill, .lines, .text, .opacity])
        #expect(pops(["selection": ["rectangle"]]) == [.stroke, .fill, .lines, .opacity, .arrange, .actions])
        #expect(pops(["selection": ["arrow"]]) == [.stroke, .lines, .arrow, .opacity, .arrange, .actions])
        #expect(pops(["selection": ["image"]]) == [.opacity, .arrange, .actions])
        #expect(pops(["selection": ["image"], "cropping": true]) == [.actions])
    }

    /// Everything the bar over the selection did is in the panel's Actions (and its right-click
    /// menu): Duplicate, Delete, Add Comment, Crop and Done, Open or Restore Note, Save to Library,
    /// Save as Template, Present from Here.
    @Test func theBarsActionsAreInThePanel() {
        let canvas = CanvasController()
        canvas.receive(["selection": ["rectangle"], "inFrame": true])
        let ids = CanvasStyleSidebar.actions(canvas).map(\.id)
        #expect(ids.starts(with: ["duplicate", "delete"]), "\(ids)")
        #expect(Set(["saveToLibrary", "saveTemplate", "presentFromHere"]).isSubset(of: ids), "\(ids)")
        #expect(ids.contains("comment") == (canvas.canComment && !canvas.viewOnly), "\(ids)")
        #expect(CanvasStyleSidebar.actions(canvas).first { $0.id == "delete" }?.destructive == true)
        canvas.receive(["selection": ["image"]])
        #expect(CanvasStyleSidebar.actions(canvas).map(\.id).contains("crop"))
        canvas.receive(["selection": ["image"], "cropping": true])
        #expect(CanvasStyleSidebar.actions(canvas).map(\.id) == ["cropDone"])
        canvas.receive(["selection": ["rectangle"], "card": ["note": UUID().uuidString, "title": "Groceries"], "selectedCards": 1, "onlyCards": true])
        #expect(CanvasStyleSidebar.actions(canvas).map(\.id).contains("openNote"))
        // Layers, back to front, and Align: lining up two, spacing out three or more.
        #expect(CanvasStyleSidebar.layers.map(\.action) == [.sendToBack, .sendBackward, .bringForward, .bringToFront])
        #expect(CanvasStyleSidebar.aligns(2).count == 6 && CanvasStyleSidebar.aligns(3).count == 8)
        // In the panel, Excalidraw's two rows: across, then down; spaced evenly at the end of each.
        #expect(CanvasStyleSidebar.alignRows(3).map { $0.map(\.action) } == [[.alignLeft, .alignCenter, .alignRight, .distributeHorizontally], [.alignTop, .alignMiddle, .alignBottom, .distributeVertically]])
        #expect(CanvasStyleSidebar.alignRows(2).map { $0.map(\.action) } == [[.alignLeft, .alignCenter, .alignRight], [.alignTop, .alignMiddle, .alignBottom]])
        #expect(Set(CanvasStyleSidebar.alignRows(3).joined().map(\.title)) == Set(CanvasStyleSidebar.aligns(3).map(\.title)), "the menu has the same")
    }

    /// The panel builds, with its sections, in both layouts and both looks (read the way
    /// VoiceOver reads it, offscreen).
    @Test(arguments: [false, true])
    func thePanelBuildsWideAndAsAStrip(dark: Bool) async throws {
        let canvas = CanvasController()
        canvas.receive(["selection": ["rectangle", "ellipse"], "style": ["backgroundColor": "#ffec99"]])
        let wide = OffscreenAX(CanvasStyleSidebar(canvas: canvas, layout: .wide).padding(12), size: CGSize(width: 260, height: 900), dark: dark)
        defer { wide.close() }
        await wide.settle()
        for id in ["canvas.stylePanel", "canvas.stylePanel.picker.strokeColor", "canvas.stylePanel.picker.backgroundColor", "canvas.stylePanel.fillStyle.0",
                   "canvas.stylePanel.width.2", "canvas.stylePanel.strokeStyle.1", "canvas.stylePanel.opacity", "canvas.stylePanel.layer.bringToFront",
                   "canvas.stylePanel.align.alignLeft", "canvas.stylePanel.action.duplicate", "canvas.stylePanel.action.delete"] {
            #expect(await wide.waiting(for: id, tries: 5) != nil, "wide: \(id) in \(wide.ids())")
        }
        #expect(wide.find("canvas.stylePanel.toggle") == nil, "no title to fold it by")
        let strip = OffscreenAX(CanvasStyleSidebar(canvas: canvas, layout: .compact).padding(12), size: CGSize(width: 80, height: 500), dark: dark)
        defer { strip.close() }
        await strip.settle()
        for pop in CanvasStyleSidebar.Pop.allCases where pop.shows(CanvasStyleSidebar.parts(canvas.state)) {
            #expect(await strip.waiting(for: "canvas.stylePanel.open.\(pop.rawValue)", tries: 5) != nil, "strip: \(pop) in \(strip.ids())")
        }
        let panel = try #require(strip.find("canvas.stylePanel"))
        #expect(abs(panel.frame.width - CanvasStyleSidebar.strip) <= 1, "the strip: \(panel.frame)")
    }

    /// Excalidraw's palette, in its grid's order and with its keys. The colours are the engine's
    /// own (its bundle has open-color's ten shades of each, and the picker shows 0, 2, 4, 6 and
    /// 8; bronze has five).
    @Test func thePickerIsExcalidraws() throws {
        #expect(CanvasColorPicker.names == ["transparent", "white", "gray", "black", "bronze", "cyan", "blue", "violet", "grape", "pink",
                                            "green", "teal", "yellow", "orange", "red"])
        #expect(CanvasColorPicker.keys == ["q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v", "b"])
        let file = try #require(NotePageLibraries.canvasFile("canvas.js"))
        let js = try #require(String(data: file.data, encoding: .utf8))
        for (name, shades) in CanvasColorPicker.shades {
            let r = try #require(js.range(of: ",\(name):[\"#"), "\(name) in the engine")
            let rest = js[js.index(r.upperBound, offsetBy: -2)...]
            let end = try #require(rest.firstIndex(of: "]"))
            let all = rest[..<end].split(separator: ",").map { $0.trimmingCharacters(in: CharacterSet(charactersIn: "\"")) }
            let want = all.count == 10 ? [0, 2, 4, 6, 8].map { all[$0] } : all
            #expect(shades == want, "\(name): \(shades), the engine's \(want)")
        }
        #expect(js.contains("black:\"#1e1e1e\"") && js.contains("white:\"#ffffff\""))
    }

    /// Its keys: a letter picks the grid's colour in the shade in use; ⇧1 to ⇧5 a shade of the
    /// colour in use, by the key (⇧2 types " on a Swedish keyboard).
    @Test func thePickersKeysPickColoursAndShades() {
        // With no shade of its own, a stroke takes the darkest, a background the second lightest.
        #expect(CanvasColorPicker.picked("s", shift: false, digit: nil, current: "#2a1d10", key: .strokeColor) == "#1971c2")
        #expect(CanvasColorPicker.picked("s", shift: false, digit: nil, current: "transparent", key: .backgroundColor) == "#a5d8ff")
        // In the shade in use; black, white and none are one each.
        #expect(CanvasColorPicker.picked("b", shift: false, digit: nil, current: "#a5d8ff", key: .strokeColor) == "#ffc9c9")
        #expect(CanvasColorPicker.picked("Q", shift: false, digit: nil, current: "#a5d8ff", key: .backgroundColor) == "transparent")
        #expect(CanvasColorPicker.picked("r", shift: false, digit: nil, current: "#a5d8ff", key: .strokeColor) == "#1e1e1e")
        // ⇧1 to ⇧5: by the key, whatever it types.
        #expect(CanvasColorPicker.picked("!", shift: true, digit: 0, current: "#1971c2", key: .strokeColor) == "#e7f5ff")
        #expect(CanvasColorPicker.picked("\"", shift: true, digit: 1, current: "#1971c2", key: .strokeColor) == "#a5d8ff")
        #expect(CanvasColorPicker.picked("%", shift: true, digit: 4, current: "#e7f5ff", key: .strokeColor) == "#1971c2")
        #expect([18, 19, 20, 21, 23].map { CanvasColorPicker.digit(keyCode: $0) } == [0, 1, 2, 3, 4])
        #expect(CanvasColorPicker.digit(keyCode: 22) == nil, "6 isn't a shade")
        // No shades for black; other keys aren't the picker's.
        #expect(CanvasColorPicker.picked("@", shift: true, digit: 1, current: "#1e1e1e", key: .strokeColor) == nil)
        #expect(CanvasColorPicker.picked("y", shift: false, digit: nil, current: "#1971c2", key: .strokeColor) == nil)
        #expect(CanvasColorPicker.picked("S", shift: true, digit: nil, current: "#1971c2", key: .strokeColor) == nil)
        // Where a colour is in the palette.
        #expect(CanvasColorPicker.place("#E03131")?.name == "red" && CanvasColorPicker.place("#e03131")?.shade == 4)
        #expect(CanvasColorPicker.place("#2a1d10") == nil)
    }

    /// Each colour's key is inside its square, at the bottom right (it hung off the edge, 17
    /// November 2026): drawn with and without it, the pixels that differ are in the square's
    /// bottom right quarter.
    @Test(arguments: ["#ffffff", "#1e1e1e", "#ffc9c9", "transparent"])
    func theKeysAreInsideTheirColours(value: String) throws {
        let pad: CGFloat = 6, size = CanvasColorPicker.Chip.size, scale: CGFloat = 3
        func pixels(_ label: String) throws -> [UInt8] {
            let r = ImageRenderer(content: CanvasColorPicker.Chip(value: value, label: label, dark: false).padding(pad))
            r.scale = scale
            let image = try #require(r.cgImage)
            let w = Int((size + 2 * pad) * scale)
            #expect(image.width == w && image.height == w, "\(image.width)×\(image.height)")
            var data = [UInt8](repeating: 0, count: w * w * 4)
            let ctx = try #require(CGContext(data: &data, width: w, height: w, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
            ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: w))
            return data
        }
        let with = try pixels("W"), without = try pixels("")
        let w = Int((size + 2 * pad) * scale)
        var box: (x0: Int, y0: Int, x1: Int, y1: Int)? = nil
        for y in 0..<w {
            for x in 0..<w {
                let i = (y * w + x) * 4
                guard (0..<4).contains(where: { abs(Int(with[i + $0]) - Int(without[i + $0])) > 24 }) else { continue }
                box = box.map { (min($0.x0, x), min($0.y0, y), max($0.x1, x), max($0.y1, y)) } ?? (x, y, x, y)
            }
        }
        let b = try #require(box, "the key is drawn on \(value)")
        // In points, from the picture's top left: the square is pad to pad + size.
        let p = (x0: CGFloat(b.x0) / scale, y0: CGFloat(b.y0) / scale, x1: CGFloat(b.x1 + 1) / scale, y1: CGFloat(b.y1 + 1) / scale)
        #expect(p.x0 >= pad + size / 2 && p.y0 >= pad + size / 2, "in the bottom right quarter on \(value): \(p)")
        #expect(p.x1 <= pad + size - 2 && p.y1 <= pad + size - 1.5, "inside the square's edge on \(value): \(p)")
        #expect(p.y1 - p.y0 >= 5, "big enough to read on \(value): \(p)")
    }

    /// The picker builds, with its grid, its shades and its hex code, both looks.
    @Test(arguments: [false, true])
    func thePickerBuilds(dark: Bool) async throws {
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasColorPicker(canvas: canvas, key: .strokeColor, current: "#1971c2").padding(12), size: CGSize(width: 220, height: 320), dark: dark)
        defer { ax.close() }
        await ax.settle()
        for id in CanvasColorPicker.names.map({ "canvas.color.\($0)" }) + (1...5).map({ "canvas.color.shade.\($0)" }) + ["canvas.color.shades", "canvas.color.hex", "canvas.color.eyedropper"] {
            #expect(await ax.waiting(for: id, tries: 5) != nil, "\(id) in \(ax.ids())")
        }
    }

    /// A colour that isn't one of the palette's (the board's ink, #2a1d10) has no shades, and the
    /// picker shows no Shades section for it, heading and all (real-window check, 17 Nov: "Shades",
    /// then "No shades for this colour").
    @Test func aColourWithNoShadesShowsNoShades() async throws {
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasColorPicker(canvas: canvas, key: .strokeColor, current: "#2a1d10").padding(12), size: CGSize(width: 220, height: 320))
        defer { ax.close() }
        await ax.settle()
        #expect(await ax.waiting(for: "canvas.color.hex", tries: 5) != nil, "the picker built: \(ax.ids())")
        #expect(!ax.ids().contains { $0.hasPrefix("canvas.color.shade") }, "no Shades: \(ax.ids())")
        #expect(CanvasColorPicker.place("#2a1d10") == nil)
    }

    /// What the panel opens shows beside it, its top at its opener's; moved up only as far as it
    /// must to end above the zoom, never above the panel's top, which is under the tools.
    @Test func whatThePanelOpensStaysBelowTheTools() {
        #expect(CanvasStyleSidebar.cardTop(opener: 5, card: 330, room: 600) == 5, "at its opener's top")
        #expect(CanvasStyleSidebar.cardTop(opener: 200, card: 330, room: 400) == 70, "moved up to end inside the room")
        #expect(CanvasStyleSidebar.cardTop(opener: 200, card: 500, room: 400) == 0, "never above the panel's top")
        #expect(CanvasStyleSidebar.cardTop(opener: -12, card: 100, room: 400) == 0, "an opener scrolled up: from the top")
    }
}
#endif
