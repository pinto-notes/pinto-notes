import SwiftUI

/// Small moments of life in the app's glyphs, in the spirit of iOS 27.2's Genmoji button: under
/// the pointer a glyph does one short thing that fits what it is (the search lens glances left and
/// right, the pencil writes a line, the trash lifts its lid), then settles exactly where it was.
/// Once in a while, never on the first few hovers and never twice running, it does its rare
/// version instead (the lens grows an eye, eyes peek out of the trash).
///
/// Every glyph is drawn from one number, the seconds since the move began, so a test can draw
/// any frame offscreen and the app draws only while a move plays (the timeline is paused at rest).
/// Nothing moves with Reduce Motion on.
///
/// In the app, kept few on purpose (Emil and the UI council, 5 November 2026): Today's page
/// turns to today's date, Format's A leans into italic, a finished list bursts (CheckPop), and
/// rarely (about one hover in 40, once a launch at most) Format tries on bold, italic and
/// underline. The other glyphs stay drawn here for the concept films but aren't in the app.
enum Charm {
    enum Kind: String, CaseIterable, Sendable {
        case search, compose, checklist, table, attach, share, more, sidebar, folder, trash
        case format, today, undo, settings, lock, leaf, tick, tray
    }

    /// How long each move runs, ordinary and rare.
    static func duration(_ kind: Kind, rare: Bool) -> Double {
        switch kind {
        case .search: rare ? 1.9 : 1.0
        case .compose: rare ? 1.6 : 1.3
        case .checklist: rare ? 1.5 : 1.3
        case .table: rare ? 1.2 : 1.0
        case .attach: rare ? 1.5 : 0.9
        case .share: rare ? 1.6 : 1.15
        case .more: rare ? 1.7 : 0.75
        case .sidebar: 0.8
        case .folder: rare ? 1.3 : 1.0
        case .trash: rare ? 2.2 : 0.85
        case .format: rare ? 1.1 : 0.85
        case .today: rare ? 1.55 : 0.9
        case .undo: rare ? 1.45 : 0.8
        case .settings: rare ? 1.9 : 1.05
        case .lock: rare ? 1.65 : 0.85
        case .leaf: rare ? 2.0 : 1.7
        case .tick: rare ? 1.0 : 0.7
        case .tray: rare ? 1.5 : 0.85
        }
    }

    /// Which glyphs have a rare version.
    static func hasRare(_ kind: Kind) -> Bool { kind != .sidebar }

    /// The rare versions the app plays: Format's alone (UI council, 5 November 2026). The others
    /// stay drawn for the concept films.
    static let rareInApp: Set<Kind> = [.format]

    // MARK: The rare roll

    /// Hovers so far this run, and whether the last move was rare.
    @MainActor private static var hovers = 0
    @MainActor private static var lastRare = false
    /// One hover in this many, roughly, plays the rare version, and at most once a launch.
    static let rareOdds = 40
    @MainActor private static var rareShown = false
    /// Tests and captures: always (true) or never (false) rare.
    @MainActor static var forcedRare: Bool?

    @MainActor static func rollRare(_ kind: Kind) -> Bool {
        if let forcedRare { return forcedRare && hasRare(kind) }
        // Captures: `-uitest -charmRare YES` plays every glyph's rare version.
        if ProcessInfo.processInfo.arguments.contains("-uitest"), UserDefaults.standard.object(forKey: "charmRare") != nil {
            return UserDefaults.standard.bool(forKey: "charmRare") && hasRare(kind)
        }
        hovers += 1
        let rare = rareInApp.contains(kind) && hovers > 4 && !lastRare && !rareShown && Int.random(in: 0..<rareOdds) == 0
        lastRare = rare
        rareShown = rareShown || rare
        return rare
    }

    /// Tests: a fresh launch's rolls.
    @MainActor static func resetRolls() {
        hovers = 0
        lastRare = false
        rareShown = false
    }

    // MARK: Drawing

    /// The art is drawn on a 24-unit square; `size` is the canvas.
    struct Pen {
        var ink: GraphicsContext.Shading
        var accent: GraphicsContext.Shading
        var line: CGFloat = 1.55
        var style: StrokeStyle { StrokeStyle(lineWidth: line, lineCap: .round, lineJoin: .round) }
    }

    static func draw(_ kind: Kind, in c: inout GraphicsContext, size: CGSize, t: Double, rare: Bool, pen: Pen, day: Int) {
        let s = min(size.width, size.height) / 24
        c.translateBy(x: (size.width - 24 * s) / 2, y: (size.height - 24 * s) / 2)
        c.scaleBy(x: s, y: s)
        // Past the end, the resting frame.
        let t = t >= duration(kind, rare: rare) ? 0 : max(t, 0)
        c.drawLayer { c in
        switch kind {
        case .search: search(&c, t, rare, pen)
        case .compose: compose(&c, t, rare, pen)
        case .checklist: checklist(&c, t, rare, pen)
        case .table: table(&c, t, rare, pen)
        case .attach: attach(&c, t, rare, pen)
        case .share: share(&c, t, rare, pen)
        case .more: more(&c, t, rare, pen)
        case .sidebar: sidebar(&c, t, pen)
        case .folder: folder(&c, t, rare, pen)
        case .trash: trash(&c, t, rare, pen)
        case .format: format(&c, t, rare, pen)
        case .today: today(&c, t, rare, pen, day: day)
        case .undo: undo(&c, t, rare, pen)
        case .settings: settings(&c, t, rare, pen)
        case .lock: lock(&c, t, rare, pen)
        case .leaf: leaf(&c, t, rare, pen)
        case .tick: tick(&c, t, rare, pen)
        case .tray: tray(&c, t, rare, pen)
        }
        }
    }

    /// Cuts `path` out of what's drawn so far in this glyph, so what's behind (a toolbar's glass)
    /// shows through: the pencil's body over the square, the page inside the folder.
    static func clear(_ c: GraphicsContext, _ path: Path, stroke: StrokeStyle? = nil) {
        var g = c
        g.blendMode = .destinationOut
        if let stroke { g.stroke(path, with: .color(.black), style: stroke) } else { g.fill(path, with: .color(.black)) }
    }

    // MARK: Search: the lens glances left, then right. Rare: it has an eye, which looks and blinks.

    private static func search(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let swing = rare
            ? CharmMath.keys(t, [(0, 0), (0.2, -10), (0.55, -10), (0.75, 9), (1.1, 9), (1.35, 0)])
            : CharmMath.keys(t, [(0, 0), (0.18, -9), (0.42, -9), (0.62, 8), (0.82, 8), (1.0, 0)])
        var g = c
        g.rotate(around: CGPoint(x: 19.6, y: 19.6), by: .degrees(swing))
        let center = CGPoint(x: 10.3, y: 10.3), r = 6.3
        g.stroke(Path(ellipseIn: CGRect(x: center.x - r, y: center.y - r, width: 2 * r, height: 2 * r)), with: p.ink, style: p.style)
        var handle = Path()
        handle.move(to: CGPoint(x: 15.0, y: 15.0))
        handle.addLine(to: CGPoint(x: 19.6, y: 19.6))
        g.stroke(handle, with: p.ink, style: StrokeStyle(lineWidth: p.line * 1.35, lineCap: .round))
        if rare {
            // The eye opens, follows the swing, blinks twice near the end, and closes.
            let open = CharmMath.seg(t, 0, 0.18) * (1 - CharmMath.seg(t, 1.55, 1.85))
            let look = swing / 10 * 1.6
            let blink = 1 - CharmMath.pulse(t, 1.12, 1.26) - CharmMath.pulse(t, 1.32, 1.46)
            let rx = 2.1 * open, ry = 2.1 * open * max(blink, 0.08)
            if open > 0.01 {
                g.fill(Path(ellipseIn: CGRect(x: center.x + look - rx, y: center.y - ry, width: 2 * rx, height: 2 * ry)), with: p.ink)
                // A catchlight.
                let cl = 0.65 * open * max(blink, 0)
                Charm.clear(g, Path(ellipseIn: CGRect(x: center.x + look + 0.35, y: center.y - 1.15, width: cl, height: cl)))
            }
        } else {
            // A glint that slides across the glass as it turns.
            let glint = CharmMath.pulse(t, 0.1, 0.9) * 0.55
            if glint > 0.01 {
                var arc = Path()
                let a0 = 200 + swing * 2.2
                arc.addArc(center: center, radius: 3.9, startAngle: .degrees(a0), endAngle: .degrees(a0 + 50), clockwise: false)
                g.stroke(arc, with: p.ink, style: StrokeStyle(lineWidth: 1.1, lineCap: .round))
                g.opacity = 1
                _ = glint
            }
        }
    }

    // MARK: Compose: the pencil lifts and writes a line in the square, which fades. Rare: a heart.

    private static func compose(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        var square = Path()
        square.move(to: CGPoint(x: 11.2, y: 5.2))
        square.addLine(to: CGPoint(x: 7.2, y: 5.2))
        square.addArc(tangent1End: CGPoint(x: 3.5, y: 5.2), tangent2End: CGPoint(x: 3.5, y: 9), radius: 3.6)
        square.addLine(to: CGPoint(x: 3.5, y: 16.3))
        square.addArc(tangent1End: CGPoint(x: 3.5, y: 20), tangent2End: CGPoint(x: 7.2, y: 20), radius: 3.6)
        square.addLine(to: CGPoint(x: 14.6, y: 20))
        square.addArc(tangent1End: CGPoint(x: 18.3, y: 20), tangent2End: CGPoint(x: 18.3, y: 16.3), radius: 3.6)
        square.addLine(to: CGPoint(x: 18.3, y: 12.4))
        c.stroke(square, with: p.ink, style: p.style)

        let rest = CGPoint(x: 10.4, y: 13.6)
        // Where the tip goes: a line (or a heart) traced across the square.
        let trail: [CGPoint] = rare ? heartPoints(center: CGPoint(x: 9.6, y: 13.4), size: 5.6) : wavePoints(from: CGPoint(x: 6.4, y: 15.4), to: CGPoint(x: 14.2, y: 14.6), amp: 1.15, waves: 2.2)
        let draw0 = 0.3, draw1 = rare ? 1.05 : 0.8, back = rare ? 1.3 : 1.02
        let end = duration(.compose, rare: rare)
        var tip = rest
        var tilt = 0.0
        if t > 0 {
            let first = trail[0], last = trail[trail.count - 1]
            if t < 0.12 {
                // A small lift, the anticipation.
                let k = CharmMath.easeOut(CharmMath.seg(t, 0, 0.12))
                tip = CharmMath.mix(rest, CGPoint(x: rest.x + 0.9, y: rest.y - 1.1), k)
            } else if t < draw0 {
                let k = CharmMath.easeInOut(CharmMath.seg(t, 0.12, draw0))
                tip = CharmMath.mix(CGPoint(x: rest.x + 0.9, y: rest.y - 1.1), first, k)
            } else if t < draw1 {
                let k = CharmMath.seg(t, draw0, draw1)
                tip = CharmMath.along(trail, CharmMath.easeInOut(k))
                tilt = sin(k * .pi * 4.4) * 4
            } else if t < back {
                tip = CharmMath.mix(last, rest, CharmMath.easeInOut(CharmMath.seg(t, draw1, back)))
            } else {
                // Back in its place with a small settle.
                let k = CharmMath.seg(t, back, end)
                let bob = sin(k * .pi * 2) * exp(-4 * k) * 0.5
                tip = CGPoint(x: rest.x + bob, y: rest.y - bob)
            }
            // The ink, drawn as the tip goes and fading after.
            let drawn = CharmMath.seg(t, draw0, draw1)
            let fade = 1 - CharmMath.easeIn(CharmMath.seg(t, back - 0.15, end))
            if drawn > 0, fade > 0 {
                var ink = Path()
                let n = max(Int(Double(trail.count - 1) * drawn), 1)
                ink.move(to: trail[0])
                for i in 1...n { ink.addLine(to: trail[i]) }
                var g = c
                g.opacity = fade
                g.stroke(ink, with: p.accent, style: StrokeStyle(lineWidth: 1.4, lineCap: .round, lineJoin: .round))
            }
        }
        pencil(&c, tip: tip, angle: -45 + tilt, p)
    }

    /// A pencil whose tip is at `tip`, its body going up and to the right at `angle` (-45 is the symbol's).
    private static func pencil(_ c: inout GraphicsContext, tip: CGPoint, angle: Double, _ p: Pen) {
        var g = c
        g.translateBy(x: tip.x, y: tip.y)
        g.rotate(by: .degrees(angle))
        // Local: x along the body away from the tip, y across it.
        let w = 1.75, len = 11.6
        var body = Path()
        body.move(to: .zero)
        body.addLine(to: CGPoint(x: 3.2, y: -w))
        body.addLine(to: CGPoint(x: len - w, y: -w))
        body.addArc(center: CGPoint(x: len - w, y: 0), radius: w, startAngle: .degrees(-90), endAngle: .degrees(90), clockwise: false)
        body.addLine(to: CGPoint(x: 3.2, y: w))
        body.closeSubpath()
        Charm.clear(g, body)
        g.stroke(body, with: p.ink, style: StrokeStyle(lineWidth: 1.4, lineCap: .round, lineJoin: .round))
        var band = Path()
        band.move(to: CGPoint(x: len - 3.6, y: -w))
        band.addLine(to: CGPoint(x: len - 3.6, y: w))
        g.stroke(band, with: p.ink, style: StrokeStyle(lineWidth: 1.2, lineCap: .round))
    }

    private static func wavePoints(from a: CGPoint, to b: CGPoint, amp: Double, waves: Double) -> [CGPoint] {
        (0...60).map { i in
            let k = Double(i) / 60
            return CGPoint(x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - sin(k * .pi * 2 * waves) * amp * (0.6 + 0.4 * k))
        }
    }

    private static func heartPoints(center: CGPoint, size: Double) -> [CGPoint] {
        // The classic heart curve, from the bottom point round and back.
        (0...90).map { i in
            let a = Double(i) / 90 * 2 * .pi + .pi
            let x = 16 * pow(sin(a), 3)
            let y = 13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a)
            return CGPoint(x: center.x + x / 34 * size, y: center.y - y / 34 * size)
        }
    }

    // MARK: Checklist: the empty item ticks itself, then lets go. Rare: with a burst.

    private static func checklist(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let r = 2.7
        let top = CGPoint(x: 5.6, y: 7), bottom = CGPoint(x: 5.6, y: 17)
        // The ticked one, filled with its tick cut out.
        c.drawLayer { l in
            l.fill(Path(ellipseIn: CGRect(x: top.x - r - 0.4, y: top.y - r - 0.4, width: 2 * r + 0.8, height: 2 * r + 0.8)), with: p.ink)
            l.blendMode = .destinationOut
            l.stroke(tickPath(top, 2 * r + 0.8), with: .color(.black), style: StrokeStyle(lineWidth: 1.25, lineCap: .round, lineJoin: .round))
        }
        for y in [top.y, bottom.y] {
            var line = Path()
            line.move(to: CGPoint(x: 11, y: y))
            line.addLine(to: CGPoint(x: 20.5, y: y))
            c.stroke(line, with: p.ink, style: p.style)
        }
        let on = CharmMath.seg(t, 0.08, 0.18) * (1 - CharmMath.seg(t, rare ? 1.25 : 1.05, rare ? 1.5 : 1.3))
        let pop = t > 0.08 ? CharmMath.spring(t - 0.08, freq: 2.6, damping: 9) : 0
        // The empty circle, while it isn't filled.
        var g = c
        g.opacity = 1 - on
        g.stroke(Path(ellipseIn: CGRect(x: bottom.x - r, y: bottom.y - r, width: 2 * r, height: 2 * r)), with: p.ink, style: StrokeStyle(lineWidth: 1.35))
        if on > 0 {
            let scale = 0.55 + 0.45 * pop
            let rr = (r + 0.4) * scale
            c.drawLayer { l in
                l.opacity = on
                l.fill(Path(ellipseIn: CGRect(x: bottom.x - rr, y: bottom.y - rr, width: 2 * rr, height: 2 * rr)), with: p.accent)
                let drawn = CharmMath.easeOut(CharmMath.seg(t, 0.16, 0.38))
                l.blendMode = .destinationOut
                l.stroke(tickPath(bottom, 2 * rr).trimmedPath(from: 0, to: drawn), with: .color(.black), style: StrokeStyle(lineWidth: 1.25 * scale, lineCap: .round, lineJoin: .round))
            }
            if rare { burst(&c, at: bottom, t: t - 0.12, p) }
        }
        // The line beside it nods once, as if read off.
        _ = 0
    }

    private static func tickPath(_ center: CGPoint, _ s: Double) -> Path {
        var path = Path()
        let o = CGPoint(x: center.x - s / 2, y: center.y - s / 2)
        path.move(to: CGPoint(x: o.x + s * 0.29, y: o.y + s * 0.52))
        path.addLine(to: CGPoint(x: o.x + s * 0.44, y: o.y + s * 0.67))
        path.addLine(to: CGPoint(x: o.x + s * 0.72, y: o.y + s * 0.36))
        return path
    }

    /// Six small dots flung out from `at` that fade as they go.
    private static func burst(_ c: inout GraphicsContext, at: CGPoint, t: Double, _ p: Pen) {
        guard t > 0, t < 0.6 else { return }
        let k = CharmMath.easeOut(t / 0.6)
        for i in 0..<6 {
            let a = Double(i) / 6 * 2 * .pi - .pi / 2 + 0.3
            let d = 3.6 + 3.4 * k
            let r = 0.75 * (1 - k)
            let pt = CGPoint(x: at.x + cos(a) * d, y: at.y + sin(a) * d)
            c.fill(Path(ellipseIn: CGRect(x: pt.x - r, y: pt.y - r, width: 2 * r, height: 2 * r)), with: p.accent)
        }
    }

    // MARK: Table: a cell lights and moves along, as Tab would. Rare: every cell fills in turn.

    private static func table(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let frame = CGRect(x: 3.3, y: 4.8, width: 17.4, height: 14.4)
        let cols = [3.3, 12.0, 20.7], rows = [4.8, 9.6, 14.4, 19.2]
        func cell(_ r: Int, _ col: Int) -> CGRect {
            CGRect(x: cols[col], y: rows[r], width: cols[col + 1] - cols[col], height: rows[r + 1] - rows[r])
        }
        // Header band, filled like the symbol's.
        c.drawLayer { l in
            l.clip(to: Path(roundedRect: frame, cornerRadius: 3))
            if t > 0 {
                l.clip(to: Path(roundedRect: frame.insetBy(dx: 0.3, dy: 0.3), cornerRadius: 2.7))
                if rare {
                    for i in 0..<4 {
                        let a = 0.08 + Double(i) * 0.14
                        let on = CharmMath.easeOut(CharmMath.seg(t, a, a + 0.12)) * (1 - CharmMath.seg(t, 0.85, 1.15))
                        guard on > 0 else { continue }
                        let rc = cell(i / 2, i % 2).insetBy(dx: 1.1, dy: 1.1)
                        var g = l
                        g.opacity = on * 0.9
                        g.fill(Path(roundedRect: rc, cornerRadius: 1), with: p.accent)
                    }
                } else {
                    // The lit cell, sliding from one to the next with a little spring.
                    let stops: [(Int, Int)] = [(0, 0), (0, 1), (1, 0), (1, 1)]
                    let step = 0.16
                    let pos = min(max((t - 0.08) / step, 0), 3)
                    let i = min(Int(pos), 2)
                    let local = CharmMath.spring((pos - Double(i)) * step, freq: 3.2, damping: 14)
                    let a = cell(stops[i].0, stops[i].1), b = cell(stops[min(i + 1, 3)].0, stops[min(i + 1, 3)].1)
                    let rc = CGRect(x: a.minX + (b.minX - a.minX) * local, y: a.minY + (b.minY - a.minY) * local, width: a.width, height: a.height).insetBy(dx: 1.1, dy: 1.1)
                    var g = l
                    g.opacity = CharmMath.seg(t, 0, 0.1) * (1 - CharmMath.seg(t, 0.72, 1.0)) * 0.9
                    g.fill(Path(roundedRect: rc, cornerRadius: 1), with: p.accent)
                }
            }
        }
        c.stroke(Path(roundedRect: frame, cornerRadius: 3), with: p.ink, style: p.style)
        var grid = Path()
        grid.move(to: CGPoint(x: 12, y: rows[0])); grid.addLine(to: CGPoint(x: 12, y: rows[3]))
        grid.move(to: CGPoint(x: frame.minX, y: rows[1])); grid.addLine(to: CGPoint(x: frame.maxX, y: rows[1]))
        grid.move(to: CGPoint(x: frame.minX, y: rows[2])); grid.addLine(to: CGPoint(x: frame.maxX, y: rows[2]))
        c.stroke(grid, with: p.ink, style: StrokeStyle(lineWidth: 1.3))
    }

    // MARK: Attach: the clip springs. Rare: it twirls.

    private static func attach(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        var g = c
        var sway = 0.0, squash = 1.0, drop = 0.0
        if rare {
            // A full twirl about its middle, a hop, and a settle.
            sway = 360 * CharmMath.easeInOut(CharmMath.seg(t, 0.08, 0.8)) + (t > 0.8 ? CharmMath.wobble(t - 0.8, amp: 12, freq: 3, damping: 6) : 0)
            drop = -2.2 * CharmMath.pulse(t, 0.08, 0.8)
            squash = 1 - 0.12 * CharmMath.pulse(t, 0, 0.1) - 0.1 * CharmMath.pulse(t, 0.8, 0.95)
            var h = c
            h.translateBy(x: 0, y: drop)
            h.rotate(around: CGPoint(x: 12, y: 12), by: .degrees(sway))
            h.scale(around: CGPoint(x: 12, y: 20), x: 1 / max(squash, 0.6), y: squash)
            paperclip(&h, p)
            return
        } else {
            sway = CharmMath.wobble(t, amp: 16, freq: 3.4, damping: 5.5)
            squash = 1 - 0.1 * CharmMath.pulse(t, 0, 0.22) + 0.04 * CharmMath.pulse(t, 0.22, 0.42)
        }
        g.translateBy(x: 0, y: drop)
        g.rotate(around: CGPoint(x: 12, y: 3.5), by: .degrees(sway))
        g.scale(around: CGPoint(x: 12, y: 3.5), x: 1 / max(squash, 0.6), y: squash)
        paperclip(&g, p)
    }

    private static func paperclip(_ g: inout GraphicsContext, _ p: Pen) {
        // The clip: two nested loops.
        var clip = Path()
        clip.move(to: CGPoint(x: 13.9, y: 8.4))
        clip.addLine(to: CGPoint(x: 13.9, y: 16.4))
        clip.addArc(center: CGPoint(x: 11.8, y: 16.4), radius: 2.1, startAngle: .degrees(0), endAngle: .degrees(180), clockwise: false)
        clip.addLine(to: CGPoint(x: 9.7, y: 6.4))
        clip.addArc(center: CGPoint(x: 12.7, y: 6.4), radius: 3.0, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
        clip.addLine(to: CGPoint(x: 15.7, y: 17.2))
        clip.addArc(center: CGPoint(x: 11.8, y: 17.2), radius: 3.9, startAngle: .degrees(0), endAngle: .degrees(180), clockwise: false)
        clip.addLine(to: CGPoint(x: 7.9, y: 9.5))
        g.rotate(around: CGPoint(x: 12, y: 12), by: .degrees(32))
        g.stroke(clip, with: p.ink, style: p.style)
    }

    // MARK: Share: the arrow hops out of the box and lands. Rare: it flies off and comes back down.

    private static func share(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        var lift = 0.0, boxSquash = 0.0
        if rare {
            // Off the top of the glyph, a beat away, then back down from above with a bounce.
            if t < 0.57 {
                lift = CharmMath.keys(t, [(0, 0), (0.1, -0.9), (0.38, 20)])
            } else {
                lift = 20 * (1 - CharmMath.spring(t - 0.57, freq: 1.7, damping: 6.5))
            }
            boxSquash = CharmMath.pulse(t, 0.0, 0.14) * 0.5 + CharmMath.pulse(t, 0.68, 0.86)
        } else {
            if t < 0.1 {
                lift = -0.9 * CharmMath.easeOut(t / 0.1) // a dip
            } else if t < 0.32 {
                lift = -0.9 + 4.6 * CharmMath.easeOut(CharmMath.seg(t, 0.1, 0.32))
            } else {
                lift = 3.7 * (1 - CharmMath.spring(t - 0.32, freq: 1.9, damping: 7.5))
            }
            boxSquash = CharmMath.pulse(t, 0.0, 0.12) * 0.6 + CharmMath.pulse(t, 0.44, 0.62)
        }
        var box = Path()
        box.move(to: CGPoint(x: 9.2, y: 9.6))
        box.addLine(to: CGPoint(x: 7.8, y: 9.6))
        box.addArc(tangent1End: CGPoint(x: 5, y: 9.6), tangent2End: CGPoint(x: 5, y: 12.6), radius: 2.8)
        box.addLine(to: CGPoint(x: 5, y: 18.6))
        box.addArc(tangent1End: CGPoint(x: 5, y: 21.3), tangent2End: CGPoint(x: 8, y: 21.3), radius: 2.8)
        box.addLine(to: CGPoint(x: 16, y: 21.3))
        box.addArc(tangent1End: CGPoint(x: 19, y: 21.3), tangent2End: CGPoint(x: 19, y: 18.6), radius: 2.8)
        box.addLine(to: CGPoint(x: 19, y: 12.6))
        box.addArc(tangent1End: CGPoint(x: 19, y: 9.6), tangent2End: CGPoint(x: 16.2, y: 9.6), radius: 2.8)
        box.addLine(to: CGPoint(x: 14.8, y: 9.6))
        var g = c
        g.scale(around: CGPoint(x: 12, y: 21.3), x: 1 + 0.06 * boxSquash, y: 1 - 0.08 * boxSquash)
        g.stroke(box, with: p.ink, style: p.style)
        var a = c
        a.clip(to: Path(CGRect(x: -2, y: -2, width: 28, height: 28)))
        a.translateBy(x: 0, y: -lift)
        var arrow = Path()
        arrow.move(to: CGPoint(x: 12, y: 14.6)); arrow.addLine(to: CGPoint(x: 12, y: 3.0))
        arrow.move(to: CGPoint(x: 8.6, y: 6.3)); arrow.addLine(to: CGPoint(x: 12, y: 2.9)); arrow.addLine(to: CGPoint(x: 15.4, y: 6.3))
        a.stroke(arrow, with: p.ink, style: p.style)
    }

    // MARK: More: the dots do a wave. Rare: they make a face and smile.

    private static func more(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let r = 1.45
        if rare {
            let k = CharmMath.easeInOut(CharmMath.seg(t, 0.05, 0.4)) * (1 - CharmMath.easeInOut(CharmMath.seg(t, 1.3, 1.65)))
            let blink = 1 - CharmMath.pulse(t, 0.95, 1.1) * 0.9
            let eyes = [CGPoint(x: 5.5 + (9 - 5.5) * k, y: 12 - 2.6 * k), CGPoint(x: 18.5 + (15 - 18.5) * k, y: 12 - 2.6 * k)]
            for e in eyes {
                let ry = r * (1 - k + k * blink)
                c.fill(Path(ellipseIn: CGRect(x: e.x - r, y: e.y - ry, width: 2 * r, height: 2 * ry)), with: p.ink)
            }
            // The middle dot stretches into a smile.
            if k < 0.02 {
                c.fill(Path(ellipseIn: CGRect(x: 12 - r, y: 12 - r, width: 2 * r, height: 2 * r)), with: p.ink)
            } else {
                var smile = Path()
                let spread = 34 * k
                smile.addArc(center: CGPoint(x: 12, y: 12 + 3.2 * k - 3.6 * k), radius: 3.6 * k + 0.01, startAngle: .degrees(90 - spread), endAngle: .degrees(90 + spread), clockwise: false)
                if k < 0.3 {
                    c.fill(Path(ellipseIn: CGRect(x: 12 - r, y: 12 + 2.4 * k - r, width: 2 * r, height: 2 * r)), with: p.ink)
                }
                var s = c
                s.opacity = min(k / 0.3, 1)
                s.stroke(smile, with: p.ink, style: StrokeStyle(lineWidth: r * 2 * (1 - 0.35 * k), lineCap: .round))
            }
            return
        }
        for i in 0..<3 {
            let a = 0.0 + Double(i) * 0.085
            let up = 2.3 * CharmMath.pulse(t, a, a + 0.36)
            let x = 5.5 + 6.5 * Double(i)
            let sq = 1 + 0.18 * CharmMath.pulse(t, a, a + 0.12)
            c.fill(Path(ellipseIn: CGRect(x: x - r * sq, y: 12 - up - r / sq, width: 2 * r * sq, height: 2 * r / sq)), with: p.ink)
        }
    }

    // MARK: Sidebar: the sidebar peeks wider and springs back.

    private static func sidebar(_ c: inout GraphicsContext, _ t: Double, _ p: Pen) {
        let frame = CGRect(x: 2.8, y: 5, width: 18.4, height: 14)
        let open = t < 0.16 ? 4.2 * CharmMath.easeOut(t / 0.16) : 4.2 * (1 - CharmMath.spring(t - 0.16, freq: 2.1, damping: 8))
        let x = 9.0 + open
        c.stroke(Path(roundedRect: frame, cornerRadius: 3.3), with: p.ink, style: p.style)
        var div = Path()
        div.move(to: CGPoint(x: x, y: frame.minY)); div.addLine(to: CGPoint(x: x, y: frame.maxY))
        c.stroke(div, with: p.ink, style: StrokeStyle(lineWidth: 1.35))
        for i in 0..<2 {
            var l = Path()
            let y = 8.6 + Double(i) * 2.6
            l.move(to: CGPoint(x: 5, y: y)); l.addLine(to: CGPoint(x: x - 2.1, y: y))
            c.stroke(l, with: p.ink, style: StrokeStyle(lineWidth: 1.25, lineCap: .round))
        }
    }

    // MARK: Folder: the front opens and a page peeks out. Rare: the page hops out and drops back in.

    private static func folder(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let end = duration(.folder, rare: rare)
        let open = t > 0 ? (t < end - 0.32 ? CharmMath.spring(t, freq: 2.2, damping: 9) : 1 - CharmMath.easeInOut(CharmMath.seg(t, end - 0.32, end))) : 0
        var back = Path()
        back.move(to: CGPoint(x: 2.8, y: 17))
        back.addLine(to: CGPoint(x: 2.8, y: 7.6))
        back.addArc(tangent1End: CGPoint(x: 2.8, y: 5.2), tangent2End: CGPoint(x: 5.2, y: 5.2), radius: 2.2)
        back.addLine(to: CGPoint(x: 8.4, y: 5.2))
        back.addQuadCurve(to: CGPoint(x: 10.2, y: 6.0), control: CGPoint(x: 9.5, y: 5.2))
        back.addLine(to: CGPoint(x: 11.0, y: 6.8))
        back.addLine(to: CGPoint(x: 18.8, y: 6.8))
        back.addArc(tangent1End: CGPoint(x: 21.2, y: 6.8), tangent2End: CGPoint(x: 21.2, y: 9.2), radius: 2.2)
        back.addLine(to: CGPoint(x: 21.2, y: 17))
        c.stroke(back, with: p.ink, style: p.style)
        // The page inside.
        var rise = 2.6 * open
        if rare {
            rise = CharmMath.keys(t, [(0, 0), (0.18, 2.6), (0.38, 2.4), (0.55, 7.5), (0.7, 7.5), (0.95, 2.6), (1.3, 0)])
        }
        if rise > 0.05 {
            let page = CGRect(x: 6.2, y: 10.2 - rise, width: 11.6, height: 9)
            Charm.clear(c, Path(roundedRect: page, cornerRadius: 1.2))
            c.stroke(Path(roundedRect: page, cornerRadius: 1.2), with: p.ink, style: StrokeStyle(lineWidth: 1.1))
            for i in 0..<2 {
                var l = Path()
                let y = page.minY + 2.4 + Double(i) * 2.2
                l.move(to: CGPoint(x: page.minX + 2.2, y: y)); l.addLine(to: CGPoint(x: page.maxX - 2.2 - Double(i) * 2.5, y: y))
                c.stroke(l, with: p.ink, style: StrokeStyle(lineWidth: 0.9, lineCap: .round))
            }
        }
        // The front, its top edge dropping forward as it opens.
        let drop = 2.0 * open, lean = 1.4 * open
        var front = Path()
        front.move(to: CGPoint(x: 2.8 + lean, y: 9.9 + drop))
        front.addLine(to: CGPoint(x: 21.2 + lean * 0.4, y: 9.9 + drop))
        front.addLine(to: CGPoint(x: 21.2, y: 16.6))
        front.addArc(tangent1End: CGPoint(x: 21.2, y: 19.2), tangent2End: CGPoint(x: 18.6, y: 19.2), radius: 2.4)
        front.addLine(to: CGPoint(x: 5.4, y: 19.2))
        front.addArc(tangent1End: CGPoint(x: 2.8, y: 19.2), tangent2End: CGPoint(x: 2.8, y: 16.6), radius: 2.4)
        front.closeSubpath()
        Charm.clear(c, front)
        c.stroke(front, with: p.ink, style: p.style)
    }

    // MARK: Trash: the lid lifts and drops with a rattle. Rare: two eyes peek out from under it.

    private static func trash(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        var lift = 0.0, tilt = 0.0
        if rare {
            lift = CharmMath.keys(t, [(0, 0), (0.25, 5.4), (1.75, 5.4), (1.85, 0)])
            tilt = CharmMath.keys(t, [(0, 0), (0.25, -4), (1.75, -4), (1.85, 0)]) + CharmMath.wobble(max(t - 1.85, 0), amp: t > 1.85 ? 5 : 0, freq: 6, damping: 9)
        } else {
            lift = CharmMath.keys(t, [(0, 0), (0.16, 2.2), (0.36, 2.2), (0.48, 0)])
            tilt = CharmMath.keys(t, [(0, 0), (0.16, -14), (0.36, -14), (0.48, 0)]) + (t > 0.48 ? CharmMath.wobble(t - 0.48, amp: 6, freq: 7, damping: 10) : 0)
        }
        // The can.
        var can = Path()
        can.move(to: CGPoint(x: 5.6, y: 7.2))
        can.addLine(to: CGPoint(x: 6.7, y: 18.9))
        can.addQuadCurve(to: CGPoint(x: 9.0, y: 21.0), control: CGPoint(x: 6.9, y: 21.0))
        can.addLine(to: CGPoint(x: 15.0, y: 21.0))
        can.addQuadCurve(to: CGPoint(x: 17.3, y: 18.9), control: CGPoint(x: 17.1, y: 21.0))
        can.addLine(to: CGPoint(x: 18.4, y: 7.2))
        c.stroke(can, with: p.ink, style: p.style)
        var ribs = Path()
        ribs.move(to: CGPoint(x: 10, y: 10.2)); ribs.addLine(to: CGPoint(x: 10.3, y: 17.8))
        ribs.move(to: CGPoint(x: 14, y: 10.2)); ribs.addLine(to: CGPoint(x: 13.7, y: 17.8))
        c.stroke(ribs, with: p.ink, style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
        if rare {
            // Eyes in the gap: open, look left, right, blink, then duck back as the lid shuts.
            let open = CharmMath.seg(t, 0.3, 0.42) * (1 - CharmMath.seg(t, 1.6, 1.72))
            let look = CharmMath.keys(t, [(0, 0), (0.55, 0), (0.7, -1.3), (1.0, -1.3), (1.15, 1.3), (1.4, 1.3), (1.55, 0)])
            let blink = 1 - CharmMath.pulse(t, 1.42, 1.56)
            let r = 1.3, ry = r * open * max(blink, 0.1)
            if open > 0.01 {
                for x in [10.2, 13.8] {
                    c.fill(Path(ellipseIn: CGRect(x: x + look - r, y: 5.0 - ry + (1 - open) * 2.0, width: 2 * r, height: 2 * ry)), with: p.ink)
                }
            }
        }
        var g = c
        g.translateBy(x: 0, y: -lift)
        g.rotate(around: CGPoint(x: 19.8, y: 7.2), by: .degrees(tilt))
        var lid = Path()
        lid.move(to: CGPoint(x: 4.0, y: 7.2)); lid.addLine(to: CGPoint(x: 20.0, y: 7.2))
        lid.move(to: CGPoint(x: 9.4, y: 7.2)); lid.addLine(to: CGPoint(x: 9.4, y: 5.6))
        lid.addQuadCurve(to: CGPoint(x: 10.8, y: 4.2), control: CGPoint(x: 9.4, y: 4.2))
        lid.addLine(to: CGPoint(x: 13.2, y: 4.2))
        lid.addQuadCurve(to: CGPoint(x: 14.6, y: 5.6), control: CGPoint(x: 14.6, y: 4.2))
        lid.addLine(to: CGPoint(x: 14.6, y: 7.2))
        g.stroke(lid, with: p.ink, style: p.style)
    }

    // MARK: Format: the small a hops and the A leans into italic. Rare: it tries on bold, italic and underline.

    private static func format(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        func glyph(_ s: String, size: Double, weight: Font.Weight, italic: Bool = false) -> Text {
            var text = Text(s).font(.system(size: size, weight: weight))
            if italic { text = text.italic() }
            return text.foregroundStyle(.primary)
        }
        var weight = Font.Weight.regular
        var shear = 0.0, hop = 0.0, squash = 0.0, underline = 0.0
        if rare {
            // Bold, then italic, then underlined, each held a moment, then plain again: the
            // keyframes below at 1.8 times the pace, about a second in all.
            let t = t * 1.8
            let bold = CharmMath.seg(t, 0.1, 0.22) * (1 - CharmMath.seg(t, 0.62, 0.72))
            weight = bold > 0.5 ? .bold : .regular
            shear = -0.24 * CharmMath.easeInOut(CharmMath.seg(t, 0.62, 0.78)) * (1 - CharmMath.easeInOut(CharmMath.seg(t, 1.1, 1.25)))
            underline = CharmMath.easeOut(CharmMath.seg(t, 1.1, 1.3)) * (1 - CharmMath.seg(t, 1.6, 1.8))
            hop = 1.6 * (CharmMath.pulse(t, 0.1, 0.32) + CharmMath.pulse(t, 0.62, 0.84) + CharmMath.pulse(t, 1.1, 1.32))
        } else {
            hop = 2.6 * CharmMath.pulse(t, 0.04, 0.34)
            squash = CharmMath.pulse(t, 0.0, 0.08) + CharmMath.pulse(t, 0.32, 0.42) * 0.7
            shear = -0.22 * CharmMath.pulse(t, 0.3, 0.8)
        }
        var big = c
        big.translateBy(x: 8.4, y: 12.4)
        big.concatenate(CGAffineTransform(a: 1, b: 0, c: shear, d: 1, tx: 0, ty: 0))
        let A = big.resolve(glyph("A", size: 15.5, weight: weight))
        big.draw(A, at: .zero, anchor: .center)
        var small = c
        small.translateBy(x: 17.0, y: 14.5 - hop)
        small.scaleBy(x: 1 + 0.14 * squash, y: 1 - 0.16 * squash)
        small.concatenate(CGAffineTransform(a: 1, b: 0, c: rare ? shear : 0, d: 1, tx: 0, ty: 0))
        small.draw(small.resolve(glyph("a", size: 12.5, weight: weight)), at: .zero, anchor: .center)
        if underline > 0 {
            var u = Path()
            u.move(to: CGPoint(x: 2.6, y: 20.3)); u.addLine(to: CGPoint(x: 2.6 + 18.8 * underline, y: 20.3))
            // The text's colour, not the accent, so it can't read as underline being on.
            c.stroke(u, with: p.ink, style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
        }
    }

    // MARK: Today: the page flips to today's date. Rare: a few days riffle past first.

    /// The page's number at `t` (nil: a blank page) and how far open it is (1 open, 0 edge on).
    static func todayPage(_ t: Double, _ rare: Bool, day: Int) -> (shown: Int?, fold: Double) {
        var shown = day, fold = 1.0, blank = false
        let flips = rare ? 5 : 1
        let span = rare ? 0.9 : 0.5
        if t > 0.05, t < 0.05 + span + 0.4 {
            let k = min((t - 0.05) / span, 1) * Double(flips)
            let i = min(Int(k), flips - 1)
            let local = k - Double(i)
            let from = day - flips + i
            if k >= Double(flips) {
                shown = day
                fold = 1
            } else if local < 0.5 {
                shown = from
                // The page that turns away is blank, so no wrong date ever shows (UI council).
                blank = !rare
                fold = 1 - CharmMath.easeIn(local * 2)
            } else {
                shown = from + 1
                fold = CharmMath.easeOut((local - 0.5) * 2)
            }
            if k >= Double(flips) - 0.5 {
                // The last flip lands with a small overshoot.
                let settle = t - (0.05 + span * (Double(flips) - 0.5) / Double(flips))
                fold = CharmMath.spring(max(settle, 0), freq: 2.6, damping: 9)
            }
        }
        return (blank ? nil : ((shown - 1 + 31) % 31) + 1, fold)
    }

    private static func today(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen, day: Int) {
        let frame = CGRect(x: 3.6, y: 4.8, width: 16.8, height: 15.6)
        c.stroke(Path(roundedRect: frame, cornerRadius: 3.2), with: p.ink, style: p.style)
        c.drawLayer { l in
            l.clip(to: Path(roundedRect: frame, cornerRadius: 3.2))
            l.fill(Path(CGRect(x: frame.minX, y: frame.minY, width: frame.width, height: 4.2)), with: p.ink)
        }
        let (shown, fold) = todayPage(t, rare, day: day)
        var page = c
        page.scale(around: CGPoint(x: 12, y: 9.0), x: 1, y: max(fold, 0.02))
        let n = page.resolve(Text(shown.map(String.init) ?? "").font(.system(size: 8.6, weight: .semibold)).monospacedDigit().foregroundStyle(.primary))
        page.draw(n, at: CGPoint(x: 12, y: 14.7), anchor: .center)
        // Two rings over the top.
        var rings = Path()
        rings.move(to: CGPoint(x: 8.2, y: 3.0)); rings.addLine(to: CGPoint(x: 8.2, y: 6.2))
        rings.move(to: CGPoint(x: 15.8, y: 3.0)); rings.addLine(to: CGPoint(x: 15.8, y: 6.2))
        Charm.clear(c, rings, stroke: StrokeStyle(lineWidth: 3.2, lineCap: .round))
        c.stroke(rings, with: p.ink, style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
    }

    // MARK: Undo: the arrow winds back and springs home. Rare: a whole turn backwards.

    private static func undo(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let turn: Double
        if rare {
            turn = -360 * CharmMath.easeInOut(CharmMath.seg(t, 0.05, 0.7)) + (t > 0.7 ? CharmMath.wobble(t - 0.7, amp: 10, freq: 3, damping: 7) : 0)
        } else {
            turn = t < 0.18 ? -28 * CharmMath.easeOut(t / 0.18) : -28 * (1 - CharmMath.spring(t - 0.18, freq: 2.0, damping: 7.5))
        }
        let nudge = rare ? 0 : -1.2 * CharmMath.pulse(t, 0, 0.36)
        var g = c
        g.translateBy(x: nudge, y: 0)
        g.rotate(around: CGPoint(x: 12.5, y: 13), by: .degrees(turn))
        var path = Path()
        path.move(to: CGPoint(x: 9.2, y: 4.8))
        path.addLine(to: CGPoint(x: 4.6, y: 9.4))
        path.addLine(to: CGPoint(x: 9.2, y: 14.0))
        path.move(to: CGPoint(x: 4.8, y: 9.4))
        path.addLine(to: CGPoint(x: 14.4, y: 9.4))
        path.addArc(center: CGPoint(x: 14.4, y: 14.6), radius: 5.2, startAngle: .degrees(-90), endAngle: .degrees(90), clockwise: false)
        path.addLine(to: CGPoint(x: 10.8, y: 19.8))
        g.stroke(path, with: p.ink, style: p.style)
    }

    // MARK: Settings: the gear turns one tooth and clicks into place. Rare: it spins up and winds down.

    private static func settings(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let turn: Double
        if rare {
            turn = 720 * CharmMath.easeInOut(CharmMath.seg(t, 0, 1.2)) + (t > 1.2 ? CharmMath.wobble(t - 1.2, amp: 8, freq: 4, damping: 8) : 0)
        } else {
            turn = 45 * CharmMath.spring(t, freq: 2.4, damping: 8)
        }
        var g = c
        let click = rare ? CharmMath.pulse(t, 1.15, 1.32) : CharmMath.pulse(t, 0.12, 0.3)
        g.scale(around: CGPoint(x: 12, y: 12), x: 1 - 0.08 * click, y: 1 - 0.08 * click)
        // The gear looks the same every 45°, so only the remainder is drawn: a move that ends a
        // whole tooth on rests on exactly the pixels it began with.
        g.rotate(around: CGPoint(x: 12, y: 12), by: .degrees(turn - 45 * (turn / 45).rounded()))
        var gear = Path()
        let teeth = 8
        for i in 0..<(teeth * 4) {
            let a = Double(i) / Double(teeth * 4) * 2 * .pi
            let r = (i % 4 == 1 || i % 4 == 2) ? 8.6 : 6.6
            let pt = CGPoint(x: 12 + cos(a - 0.1) * r, y: 12 + sin(a - 0.1) * r)
            if i == 0 { gear.move(to: pt) } else { gear.addLine(to: pt) }
        }
        gear.closeSubpath()
        g.stroke(gear, with: p.ink, style: StrokeStyle(lineWidth: p.line, lineCap: .round, lineJoin: .round))
        g.stroke(Path(ellipseIn: CGRect(x: 9, y: 9, width: 6, height: 6)), with: p.ink, style: p.style)
    }

    // MARK: Lock: the shackle pops up and clicks back down. Rare: it swings open, then shuts.

    private static func lock(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        var up = 0.0, swing = 0.0, shake = 0.0
        if rare {
            up = CharmMath.keys(t, [(0, 0), (0.15, 2.2), (1.0, 2.2), (1.15, 0)])
            swing = CharmMath.keys(t, [(0, 0), (0.15, 0), (0.4, -38), (0.8, -38), (1.0, 0)])
            shake = t > 1.15 ? CharmMath.wobble(t - 1.15, amp: 0.8, freq: 9, damping: 12) : 0
        } else {
            up = CharmMath.keys(t, [(0, 0), (0.14, 2.0), (0.28, 2.0), (0.36, 0)])
            shake = t > 0.36 ? CharmMath.wobble(t - 0.36, amp: 0.9, freq: 9, damping: 11) : 0
        }
        var g = c
        g.translateBy(x: shake, y: 0)
        var sh = g
        sh.translateBy(x: 0, y: -up)
        sh.rotate(around: CGPoint(x: 15.6, y: 11.5), by: .degrees(swing))
        var shackle = Path()
        shackle.move(to: CGPoint(x: 8.4, y: 11.2))
        shackle.addLine(to: CGPoint(x: 8.4, y: 8.0))
        shackle.addArc(center: CGPoint(x: 12, y: 8.0), radius: 3.6, startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
        shackle.addLine(to: CGPoint(x: 15.6, y: 11.2))
        sh.stroke(shackle, with: p.ink, style: p.style)
        let body = CGRect(x: 5.6, y: 11.2, width: 12.8, height: 9.6)
        Charm.clear(g, Path(roundedRect: body, cornerRadius: 2.4))
        g.stroke(Path(roundedRect: body, cornerRadius: 2.4), with: p.ink, style: p.style)
    }

    // MARK: Leaf: Pinto's leaf sways as if in a breeze while its lines write in. Rare: it spins once like a falling leaf.

    private static func leaf(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        var g = c
        let sway = rare ? 0 : CharmMath.wobble(t, amp: 9, freq: 1.4, damping: 3.4)
        if rare {
            let k = CharmMath.easeInOut(CharmMath.seg(t, 0.1, 1.6))
            let drop = sin(k * .pi) * 1.6
            g.translateBy(x: sin(k * .pi * 2) * 1.6, y: drop)
            g.rotate(around: CGPoint(x: 12, y: 12), by: .degrees(360 * k))
        } else {
            g.rotate(around: CGPoint(x: 6, y: 20.5), by: .degrees(sway))
        }
        var leaf = Path()
        leaf.move(to: CGPoint(x: 6.2, y: 18.2))
        leaf.addCurve(to: CGPoint(x: 20.6, y: 3.4), control1: CGPoint(x: 2.2, y: 9.5), control2: CGPoint(x: 10.5, y: 3.4))
        leaf.addCurve(to: CGPoint(x: 6.2, y: 18.2), control1: CGPoint(x: 20.9, y: 13.6), control2: CGPoint(x: 13.6, y: 20.4))
        leaf.closeSubpath()
        g.stroke(leaf, with: p.ink, style: p.style)
        var stem = Path()
        stem.move(to: CGPoint(x: 3.8, y: 20.6))
        stem.addQuadCurve(to: CGPoint(x: 16.6, y: 7.6), control: CGPoint(x: 9.0, y: 11.8))
        g.stroke(stem, with: p.ink, style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
        // The lines of writing either side of the vein, written in from the left.
        let lines: [(CGPoint, CGPoint)] = [((CGPoint(x: 9.2, y: 8.6)), CGPoint(x: 11.6, y: 8.6)), (CGPoint(x: 14.2, y: 10.4), CGPoint(x: 17.6, y: 10.4)),
                                           (CGPoint(x: 6.9, y: 12.0), CGPoint(x: 9.6, y: 12.0)), (CGPoint(x: 12.2, y: 13.6), CGPoint(x: 16.0, y: 13.6))]
        for (i, (a, b)) in lines.enumerated() {
            let k = t > 0 && !rare ? CharmMath.easeOut(CharmMath.seg(t, 0.15 + Double(i) * 0.12, 0.35 + Double(i) * 0.12)) : 1
            let gone = t > 0 && !rare ? CharmMath.seg(t, 0.0, 0.12) * (1 - CharmMath.seg(t, 0.1 + Double(i) * 0.12, 0.15 + Double(i) * 0.12)) : 0
            var l = Path()
            l.move(to: a); l.addLine(to: CGPoint(x: a.x + (b.x - a.x) * k, y: b.y))
            var lg = g
            lg.opacity = 1 - gone
            lg.stroke(l, with: p.accent, style: StrokeStyle(lineWidth: 1.25, lineCap: .round))
        }
    }

    // MARK: Tick: a checklist circle ticked in a note. Rare (the last item of a list): a burst.

    private static func tick(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let center = CGPoint(x: 12, y: 12), r = 7.4
        if t <= 0 {
            c.stroke(Path(ellipseIn: CGRect(x: center.x - r, y: center.y - r, width: 2 * r, height: 2 * r)), with: p.ink, style: StrokeStyle(lineWidth: 1.2))
            return
        }
        let pop = CharmMath.spring(t, freq: 2.8, damping: 9)
        let rr = r * (0.55 + 0.45 * pop)
        c.drawLayer { l in
            l.fill(Path(ellipseIn: CGRect(x: center.x - rr, y: center.y - rr, width: 2 * rr, height: 2 * rr)), with: p.accent)
            l.blendMode = .destinationOut
            l.stroke(tickPath(center, 2 * rr).trimmedPath(from: 0, to: CharmMath.easeOut(CharmMath.seg(t, 0.06, 0.26))), with: .color(.black), style: StrokeStyle(lineWidth: 2 * rr * 0.1, lineCap: .round, lineJoin: .round))
        }
        if rare {
            var g = c
            g.scaleBy(x: 1, y: 1)
            for i in 0..<8 {
                let a = Double(i) / 8 * 2 * .pi - .pi / 2
                let k = CharmMath.easeOut(CharmMath.seg(t, 0.08, 0.6))
                let d = r + 1.2 + 4 * k
                let dr = 0.95 * (1 - k)
                if dr > 0.02 {
                    let pt = CGPoint(x: center.x + cos(a) * d, y: center.y + sin(a) * d)
                    g.fill(Path(ellipseIn: CGRect(x: pt.x - dr, y: pt.y - dr, width: 2 * dr, height: 2 * dr)), with: p.accent)
                }
            }
        }
    }
    // MARK: Tray (All Notes): a note drops in from above and the others move down into the tray. Rare: three in a row.

    private static func tray(_ c: inout GraphicsContext, _ t: Double, _ rare: Bool, _ p: Pen) {
        let frame = CGRect(x: 3, y: 5, width: 18, height: 14.6)
        // The tray's rim, with its dip.
        var rim = Path()
        rim.move(to: CGPoint(x: frame.minX, y: 13.4))
        rim.addLine(to: CGPoint(x: 7.4, y: 13.4))
        rim.addQuadCurve(to: CGPoint(x: 8.6, y: 14.4), control: CGPoint(x: 8.3, y: 13.4))
        rim.addQuadCurve(to: CGPoint(x: 10.4, y: 15.8), control: CGPoint(x: 9.1, y: 15.8))
        rim.addLine(to: CGPoint(x: 13.6, y: 15.8))
        rim.addQuadCurve(to: CGPoint(x: 15.4, y: 14.4), control: CGPoint(x: 14.9, y: 15.8))
        rim.addQuadCurve(to: CGPoint(x: 16.6, y: 13.4), control: CGPoint(x: 15.7, y: 13.4))
        rim.addLine(to: CGPoint(x: frame.maxX, y: 13.4))
        // How many notes have arrived (fractional while one falls).
        let n = rare ? 3 : 1
        let each = rare ? 0.38 : 0.55
        var squash = 0.0
        var shift = 0.0
        for i in 0..<n {
            let a = 0.05 + Double(i) * each
            shift += CharmMath.easeInOut(CharmMath.seg(t, a + 0.08, a + each * 0.75))
            squash += CharmMath.pulse(t, a + each * 0.55, a + each * 0.95)
        }
        if t <= 0 { shift = 0 }
        let gap = 2.6
        var g = c
        g.scale(around: CGPoint(x: 12, y: frame.maxY), x: 1 + 0.07 * squash, y: 1 - 0.1 * squash)
        g.stroke(Path(roundedRect: frame, cornerRadius: 3.2), with: p.ink, style: p.style)
        g.stroke(rim, with: p.ink, style: p.style)
        // The lines of the notes, clipped to above the rim: the lowest slides into the dip and goes.
        var inside = g
        inside.clip(to: Path(CGRect(x: frame.minX, y: 0, width: frame.width, height: 12.7)))
        let frac = shift - floor(shift)
        let k = Int(floor(shift))
        for j in -1...2 {
            let y = 7.9 + (Double(j) + frac) * gap
            guard y > 3.5, y < 12.7 else { continue }
            var l = Path()
            l.move(to: CGPoint(x: 7.2, y: y)); l.addLine(to: CGPoint(x: 16.8, y: y))
            var lg = inside
            // The arriving line fades in from above.
            if y < 7.9 { lg.opacity = CharmMath.clamp((y - 3.5) / (7.9 - 3.5)) }
            if j + k >= 0 || true { lg.stroke(l, with: p.ink, style: StrokeStyle(lineWidth: 1.4, lineCap: .round)) }
        }
    }

}


// MARK: - Motion maths

/// Easing and springs for `Charm`, all of plain numbers.
enum CharmMath {
    static func clamp(_ x: Double) -> Double { min(max(x, 0), 1) }
    /// How far `t` is through [a, b], 0 to 1.
    static func seg(_ t: Double, _ a: Double, _ b: Double) -> Double { clamp((t - a) / (b - a)) }
    static func easeInOut(_ x: Double) -> Double { x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2 }
    static func easeOut(_ x: Double) -> Double { 1 - pow(1 - x, 3) }
    static func easeIn(_ x: Double) -> Double { x * x * x }
    /// 0 up to 1 and back, over [a, b].
    static func pulse(_ t: Double, _ a: Double, _ b: Double) -> Double {
        guard t > a, t < b else { return 0 }
        return sin(seg(t, a, b) * .pi)
    }
    /// 0 to 1 with an overshoot that settles, `t` in seconds.
    static func spring(_ t: Double, freq: Double, damping: Double) -> Double {
        guard t > 0 else { return 0 }
        return 1 - exp(-damping * t) * cos(2 * .pi * freq * t)
    }
    /// A swing about 0 that dies away.
    static func wobble(_ t: Double, amp: Double, freq: Double, damping: Double) -> Double {
        guard t > 0 else { return 0 }
        return amp * exp(-damping * t) * sin(2 * .pi * freq * t)
    }
    /// Eased between keyframes (time, value).
    static func keys(_ t: Double, _ k: [(Double, Double)]) -> Double {
        guard let first = k.first else { return 0 }
        if t <= first.0 { return first.1 }
        for i in 1..<k.count where t <= k[i].0 {
            let a = k[i - 1], b = k[i]
            return a.1 + (b.1 - a.1) * easeInOut(seg(t, a.0, b.0))
        }
        return k[k.count - 1].1
    }
    static func mix(_ a: CGPoint, _ b: CGPoint, _ k: Double) -> CGPoint {
        CGPoint(x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k)
    }
    /// The point `k` of the way along a polyline (by index; the points are close and even).
    static func along(_ pts: [CGPoint], _ k: Double) -> CGPoint {
        let f = clamp(k) * Double(pts.count - 1)
        let i = min(Int(f), pts.count - 2)
        return mix(pts[i], pts[i + 1], f - Double(i))
    }
}

// MARK: - The view

/// A glyph that plays its move when the pointer comes onto it (or onto `trigger`'s owner, such as
/// a whole sidebar row), then rests. `pointSize` matches the SF Symbol it stands in for.
struct CharmIcon: View {
    let kind: Charm.Kind
    var pointSize: CGFloat = 16
    /// When set, the move plays as this turns true (a row's hover) rather than on the glyph's own.
    var trigger: Bool?
    /// The accent for ink trails and ticks; the tint when nil.
    var accent: Color?
    @State private var start: Date?
    @State private var rare = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static func canvas(_ pointSize: CGFloat) -> CGFloat { (pointSize * 1.4).rounded() }

    var body: some View {
        let side = Self.canvas(pointSize)
        TimelineView(.animation(paused: start == nil)) { tl in
            let t = start.map { tl.date.timeIntervalSince($0) } ?? 0
            CharmFrame(kind: kind, t: t, rare: rare, accent: accent)
        }
        .frame(width: side, height: side)
        .contentShape(.rect)
        .onHover { if trigger == nil, $0 { play() } }
        .onChange(of: trigger) { _, on in if on == true { play() } }
        .task(id: start) {
            guard let start else { return }
            let d = Charm.duration(kind, rare: rare) - Date.now.timeIntervalSince(start)
            try? await Task.sleep(for: .seconds(max(d, 0) + 0.05))
            if self.start == start { self.start = nil }
        }
        .accessibilityHidden(true)
    }

    private func play() {
        guard !reduceMotion, start == nil else { return }
        rare = Charm.rollRare(kind)
        start = .now
    }
}

/// One frame of a glyph's move, at `t` seconds in (0: at rest).
struct CharmFrame: View {
    let kind: Charm.Kind
    var t: Double = 0
    var rare = false
    var accent: Color?
    var day = Calendar.current.component(.day, from: .now)

    var body: some View {
        Canvas { c, size in
            let pen = Charm.Pen(ink: .style(.foreground), accent: accent.map { .color($0) } ?? .style(.tint))
            Charm.draw(kind, in: &c, size: size, t: t, rare: rare, pen: pen, day: day)
        }
    }
}

extension GraphicsContext {
    /// Turns what's drawn next by `angle` about `p`.
    mutating func rotate(around p: CGPoint, by angle: Angle) {
        translateBy(x: p.x, y: p.y)
        rotate(by: angle)
        translateBy(x: -p.x, y: -p.y)
    }
    /// Scales what's drawn next about `p`.
    mutating func scale(around p: CGPoint, x: CGFloat, y: CGFloat) {
        translateBy(x: p.x, y: p.y)
        scaleBy(x: x, y: y)
        translateBy(x: -p.x, y: -p.y)
    }
}

// MARK: - In the app

extension Charm {
    /// On unless turned off with `defaults write <bundle id> charmOff -bool YES` (a concept that
    /// may not stay; off, every place shows its SF Symbol as before).
    static var on: Bool { !UserDefaults.standard.bool(forKey: "charmOff") }

    /// The glyph that stands in for an SF Symbol, where there is one.
    static func kind(forSymbol name: String) -> Kind? {
        switch name {
        case "magnifyingglass": .search
        case "square.and.pencil": .compose
        case "checklist": .checklist
        case "tablecells": .table
        case "paperclip": .attach
        case "square.and.arrow.up": .share
        case "ellipsis": .more
        case "sidebar.left": .sidebar
        case "folder": .folder
        case "trash": .trash
        case "textformat": .format
        case "calendar": .today
        case "arrow.uturn.backward": .undo
        case "gearshape": .settings
        case "lock": .lock
        case "tray.full": .tray
        default: nil
        }
    }
}

/// Plays a button's glyph when the pointer comes onto any part of the button, not just the glyph:
/// the pointer then sits beside the glyph rather than on it, so the move is seen.
/// `CharmHover { on in Button { … } label: { Label { … } icon: { CharmSymbol(name, trigger: on) } } }`
struct CharmHover<Content: View>: View {
    @ViewBuilder let content: (Bool) -> Content
    @State private var on = false

    var body: some View {
        content(on).onHover { on = $0 }
    }
}

/// An SF Symbol, or the glyph that stands in for it while charms are on. `trigger` plays it from
/// a hover outside it (a whole sidebar row); without one it plays when the pointer is on it.
struct CharmSymbol: View {
    let name: String
    var pointSize: CGFloat = 16
    var trigger: Bool?

    init(_ name: String, pointSize: CGFloat = 16, trigger: Bool? = nil) {
        self.name = name
        self.pointSize = pointSize
        self.trigger = trigger
    }

    var body: some View {
        #if os(macOS)
        if Charm.on, let kind = Charm.kind(forSymbol: name) {
            CharmIcon(kind: kind, pointSize: pointSize, trigger: trigger)
                // As small as the symbol it stands in for, in a toolbar or a row.
                .padding(-(CharmIcon.canvas(pointSize) - pointSize * 1.2) / 2)
        } else {
            Image(systemName: name).font(.system(size: pointSize))
        }
        #else
        Image(systemName: name)
        #endif
    }
}
