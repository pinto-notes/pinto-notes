import QuartzCore
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// When ticked items sink (or unticked ones rise), the rows slide to their new places like
/// Notes, instead of jumping. The text is reordered at once; for the length of the slide,
/// pictures of the old rows cover it and move from where each row was to where it is now.
/// Each row moves as one piece, its circle and its words together.
@MainActor
enum ReorderSlide {
    static let duration: CFTimeInterval = 0.35

    /// For each old line, its index after the reorder. Lines are matched by their text; equal
    /// lines keep their relative order.
    static func moves(old: [String], new: [String]) -> [Int] {
        var used = Set<Int>()
        return old.map { line in
            let j = new.indices.first { !used.contains($0) && new[$0] == line } ?? 0
            used.insert(j)
            return j
        }
    }

    /// Each old line's top after the reorder, relative to the run's top, from the lines' heights
    /// (a row keeps its height: its text moves with it).
    static func targets(heights: [CGFloat], moves: [Int]) -> [CGFloat] {
        var byNew = Array(repeating: CGFloat(0), count: heights.count)
        for (i, j) in moves.enumerated() where j < byNew.count { byNew[j] = heights[i] }
        var tops: [CGFloat] = []
        var y: CGFloat = 0
        for h in byNew { tops.append(y); y += h }
        return moves.map { $0 < tops.count ? tops[$0] : 0 }
    }

    /// The run's lines as `(text, range)`, the last one without its newline.
    static func lines(of range: NSRange, in text: NSString) -> [(String, NSRange)] {
        var out: [(String, NSRange)] = []
        text.enumerateSubstrings(in: range, options: [.byLines]) { s, r, _, _ in out.append((s ?? "", r)) }
        return out
    }

    /// Each row's band across the editor (`origin` is where the text container sits in it), from
    /// its top to the next row's top. The whole run is laid out first: a line ticked a moment ago
    /// could otherwise still report where TextKit guessed it was, and the pictures would show the
    /// wrong strip of the page. The last row is as tall as its own lines: after a final newline
    /// TextKit adds an empty line to the last paragraph, and that isn't part of the row.
    static func bands(_ starts: [Int], layout tlm: NSTextLayoutManager?, origin: CGPoint, width: CGFloat) -> [CGRect] {
        guard let tlm, let tcm = tlm.textContentManager, let first = starts.first, let last = starts.last,
              let a = tcm.location(tcm.documentRange.location, offsetBy: first),
              let b = tcm.location(tcm.documentRange.location, offsetBy: last) else { return [] }
        tlm.ensureLayout(for: NSTextRange(location: a, end: b) ?? NSTextRange(location: a))
        tlm.ensureLayout(for: NSTextRange(location: b))
        let fragments = starts.compactMap { s in tcm.location(tcm.documentRange.location, offsetBy: s).flatMap { tlm.textLayoutFragment(for: $0) } }
        guard fragments.count == starts.count else { return [] }
        let tops = fragments.map { $0.layoutFragmentFrame.minY + origin.y }
        let end = fragments[fragments.count - 1]
        var height = end.layoutFragmentFrame.height
        if end.textLineFragments.count > 1, let first = end.textLineFragments.first, let extra = end.textLineFragments.last, extra.characterRange.length == 0 {
            // Every line sits the same distance below its band's top, the empty one too.
            height = extra.typographicBounds.minY - first.typographicBounds.minY
        }
        return tops.enumerated().map { i, y in
            CGRect(x: 0, y: y, width: width, height: i + 1 < tops.count ? tops[i + 1] - y : height)
        }
    }

    /// The order to stack the pictures in, lowest first: the rows that travel furthest (the item
    /// that was ticked, sinking past the others) go over the rest. The others pass under it
    /// and stay in sight; on top of it, they would hide it for the middle of the move.
    static func stacking(from: [CGFloat], to: [CGFloat]) -> [Int] {
        from.indices.sorted { (abs(to[$0] - from[$0]), $0) < (abs(to[$1] - from[$1]), $1) }
    }

    #if os(macOS)
    typealias Piece = CALayer
    #else
    typealias Piece = UIView
    #endif

    /// A slide on screen. A click while it plays is for the row drawn under the pointer, which
    /// is a picture, not the text beneath it: `line(atY:)` says which line that row is now.
    final class Running {
        private let cover: Piece
        private let rows: [Piece]
        /// For each picture, where its line starts in the reordered text.
        let lines: [Int]
        /// The pictures from the one drawn lowest to the one on top.
        private let stacking: [Int]
        private(set) var done = false

        fileprivate init(cover: Piece, rows: [Piece], lines: [Int], stacking: [Int]) {
            self.cover = cover
            self.rows = rows
            self.lines = lines
            self.stacking = stacking
        }

        /// Where each picture is drawn right now, in the editor's coordinates.
        var drawn: [CGRect] {
            #if os(macOS)
            rows.map { $0.presentation()?.frame ?? $0.frame }
            #else
            rows.map { $0.layer.presentation()?.frame ?? $0.frame }
            #endif
        }

        /// The line of the row drawn at `y`: the picture on top there, as it's seen.
        func line(atY y: CGFloat) -> Int? {
            guard !done else { return nil }
            let frames = drawn
            for i in stacking.reversed() where frames[i].minY <= y && y < frames[i].maxY { return lines[i] }
            return nil
        }

        /// Ends the slide now: the rows are where the text has them.
        func stop() {
            guard !done else { return }
            done = true
            #if os(macOS)
            CATransaction.begin()
            CATransaction.setDisableActions(true)
            cover.removeFromSuperlayer()
            rows.forEach { $0.removeFromSuperlayer() }
            CATransaction.commit()
            #else
            cover.removeFromSuperview()
            rows.forEach { $0.removeFromSuperview() }
            #endif
        }
    }

    #if os(macOS)
    /// Slides pictures of the old rows (`rows`, in `view`'s flipped coordinates) to their new
    /// tops over a cover the colour of the page. Call right after the text is reordered.
    /// `lines` is where each row's line starts in the new text.
    static func play(in view: NSView, rows: [(image: CGImage, frame: CGRect)], newTops: [CGFloat], lines: [Int], cover: CGRect, pageColor: NSColor) -> Running? {
        guard !CheckPop.reduceMotion, rows.count > 1, let host = view.layer else { return nil }
        let top = rows.map(\.frame.minY).min() ?? 0
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        let shield = CALayer()
        shield.frame = cover
        // Resolve the page colour in the view's own appearance (light or dark), not the app's.
        var page = pageColor.cgColor
        view.effectiveAppearance.performAsCurrentDrawingAppearance { page = pageColor.cgColor }
        shield.backgroundColor = page
        shield.zPosition = 20
        host.addSublayer(shield)
        let order = stacking(from: rows.map(\.frame.minY), to: newTops.map { top + $0 })
        var pieces: [CALayer] = []
        for (i, row) in rows.enumerated() {
            let l = CALayer()
            l.contents = row.image
            l.contentsScale = view.window?.backingScaleFactor ?? 2
            l.frame = row.frame
            l.zPosition = 21 + CGFloat(order.firstIndex(of: i) ?? 0) / CGFloat(rows.count)
            host.addSublayer(l)
            pieces.append(l)
            let to = CGPoint(x: row.frame.midX, y: top + newTops[i] + row.frame.height / 2)
            let slide = CABasicAnimation(keyPath: "position")
            slide.fromValue = NSValue(point: CGPoint(x: row.frame.midX, y: row.frame.midY))
            slide.toValue = NSValue(point: to)
            slide.duration = duration
            slide.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            l.position = to
            l.add(slide, forKey: "slide")
        }
        CATransaction.commit()
        let running = Running(cover: shield, rows: pieces, lines: lines, stacking: order)
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { running.stop() }
        return running
    }

    /// A picture of `rect` of `view` as it's drawn now.
    /// Drawn over the page colour, so the text is smoothed against the page as it is on screen.
    static func picture(of rect: CGRect, in view: NSView, page: NSColor = .panePage) -> CGImage? {
        guard rect.width > 0, rect.height > 0, let rep = view.bitmapImageRepForCachingDisplay(in: rect),
              let ctx = NSGraphicsContext(bitmapImageRep: rep) else { return nil }
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = ctx
        view.effectiveAppearance.performAsCurrentDrawingAppearance {
            page.setFill()
            NSRect(x: 0, y: 0, width: rep.size.width, height: rep.size.height).fill()
        }
        NSGraphicsContext.restoreGraphicsState()
        view.cacheDisplay(in: rect, to: rep)
        return rep.cgImage
    }
    #else
    static func play(in view: UIView, rows: [(snapshot: UIView, frame: CGRect)], newTops: [CGFloat], lines: [Int], cover: CGRect, pageColor: UIColor) -> Running? {
        guard !CheckPop.reduceMotion, rows.count > 1 else { return nil }
        let top = rows.map(\.frame.minY).min() ?? 0
        let shield = UIView(frame: cover)
        shield.backgroundColor = pageColor
        shield.isUserInteractionEnabled = false
        view.addSubview(shield)
        let order = stacking(from: rows.map(\.frame.minY), to: newTops.map { top + $0 })
        for i in order {
            rows[i].snapshot.frame = rows[i].frame
            rows[i].snapshot.isUserInteractionEnabled = false
            view.addSubview(rows[i].snapshot)
        }
        let running = Running(cover: shield, rows: rows.map(\.snapshot), lines: lines, stacking: order)
        UIView.animate(withDuration: duration, delay: 0, options: [.curveEaseInOut]) {
            for (i, row) in rows.enumerated() { row.snapshot.frame.origin.y = top + newTops[i] }
        } completion: { _ in running.stop() }
        return running
    }
    #endif
}
