import QuartzCore
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// The little pop a checklist circle gives when you tick it, like Notes: the filled disc
/// grows in with a slight overshoot and settles. Drawn as a short-lived layer over the
/// circle the text already shows, then removed. Nothing plays with Reduce Motion on.
@MainActor
enum CheckPop {
    static var reduceMotion: Bool {
        #if os(iOS)
        UIAccessibility.isReduceMotionEnabled
        #else
        NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        #endif
    }

    /// `rect` is the circle in `host`'s coordinates (y grows downwards, as in text views).
    static func play(in host: CALayer, rect: CGRect, completes: Bool = false) {
        guard !reduceMotion, rect.width > 0 else { return }
        if completes, Charm.on { burst(in: host, rect: rect) }
        let s = rect.width
        let pop = CALayer()
        pop.frame = rect
        pop.zPosition = 10

        let disc = CAShapeLayer()
        disc.frame = pop.bounds
        disc.path = CGPath(ellipseIn: pop.bounds, transform: nil)
        disc.fillColor = PColor.paneAccent.cgColor
        pop.addSublayer(disc)

        let tick = CAShapeLayer()
        tick.frame = pop.bounds
        let path = CGMutablePath()
        path.move(to: CGPoint(x: s * 0.29, y: s * 0.51))
        path.addLine(to: CGPoint(x: s * 0.44, y: s * 0.66))
        path.addLine(to: CGPoint(x: s * 0.715, y: s * 0.355))
        tick.path = path
        tick.strokeColor = CheckTick.color.cgColor
        tick.fillColor = nil
        tick.lineWidth = s * 0.1
        tick.lineCap = .round
        tick.lineJoin = .round
        pop.addSublayer(tick)
        host.addSublayer(pop)

        CATransaction.begin()
        CATransaction.setCompletionBlock { pop.removeFromSuperlayer() }
        let grow = CAKeyframeAnimation(keyPath: "transform.scale")
        grow.values = [0.55, 1.12, 0.97, 1.0]
        grow.keyTimes = [0, 0.45, 0.75, 1]
        grow.timingFunctions = [CAMediaTimingFunction(name: .easeOut), CAMediaTimingFunction(name: .easeInEaseOut), CAMediaTimingFunction(name: .easeInEaseOut)]
        grow.duration = 0.32
        pop.add(grow, forKey: "grow")
        let draw = CABasicAnimation(keyPath: "strokeEnd")
        draw.fromValue = 0
        draw.toValue = 1
        draw.beginTime = CACurrentMediaTime() + 0.06
        draw.duration = 0.2
        draw.fillMode = .backwards
        draw.timingFunction = CAMediaTimingFunction(name: .easeOut)
        tick.add(draw, forKey: "draw")
        CATransaction.commit()
    }

    /// The last open item of a list ticked: eight small dots in the accent fly out from the circle
    /// and fade, once (Charm). Short and small, so finishing a list feels like something.
    static func burst(in host: CALayer, rect: CGRect) {
        let s = rect.width
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let dot = s * 0.16
        CATransaction.begin()
        for i in 0..<8 {
            let a = Double(i) / 8 * 2 * .pi - .pi / 2
            let from = CGPoint(x: center.x + cos(a) * s * 0.62, y: center.y + sin(a) * s * 0.62)
            let to = CGPoint(x: center.x + cos(a) * s * 1.05, y: center.y + sin(a) * s * 1.05)
            let d = CAShapeLayer()
            d.bounds = CGRect(x: 0, y: 0, width: dot, height: dot)
            d.path = CGPath(ellipseIn: d.bounds, transform: nil)
            d.fillColor = PColor.paneAccent.cgColor
            d.position = to
            d.opacity = 0
            d.zPosition = 11
            host.addSublayer(d)
            let move = CABasicAnimation(keyPath: "position")
            #if os(iOS)
            move.fromValue = NSValue(cgPoint: from)
            move.toValue = NSValue(cgPoint: to)
            #else
            move.fromValue = NSValue(point: from)
            move.toValue = NSValue(point: to)
            #endif
            move.timingFunction = CAMediaTimingFunction(name: .easeOut)
            let shrink = CABasicAnimation(keyPath: "transform.scale")
            shrink.fromValue = 1
            shrink.toValue = 0.2
            let fade = CAKeyframeAnimation(keyPath: "opacity")
            fade.values = [0, 1, 1, 0]
            fade.keyTimes = [0, 0.1, 0.5, 1]
            let group = CAAnimationGroup()
            group.animations = [move, shrink, fade]
            group.beginTime = CACurrentMediaTime() + 0.08
            group.duration = 0.5
            group.fillMode = .backwards
            group.isRemovedOnCompletion = true
            group.delegate = LayerRemover(d)
            d.add(group, forKey: "burst")
        }
        CATransaction.commit()
    }

    /// Whether the tick at `lineStart` just finished its list: the run of checklist lines around
    /// it (two or more) has no open item left.
    nonisolated static func completesList(_ text: String, lineStart: Int) -> Bool {
        let ns = text as NSString
        guard lineStart < ns.length else { return false }
        func isItem(_ line: String) -> Bool? {
            let t = line.drop { $0 == " " || $0 == "\t" }
            for m in ["- [", "* [", "+ ["] where t.hasPrefix(m) {
                let rest = t.dropFirst(3)
                guard let c = rest.first, rest.dropFirst().first == "]" else { return nil }
                return c == "x" || c == "X"
            }
            return nil
        }
        var lines: [Bool] = []
        // Up from the ticked line, then down from it.
        var at = ns.lineRange(for: NSRange(location: lineStart, length: 0))
        guard isItem(ns.substring(with: at).trimmingCharacters(in: .newlines)) != nil else { return false }
        var up = at
        while true {
            guard let done = isItem(ns.substring(with: up).trimmingCharacters(in: .newlines)) else { break }
            lines.append(done)
            guard up.location > 0 else { break }
            up = ns.lineRange(for: NSRange(location: up.location - 1, length: 0))
        }
        while NSMaxRange(at) < ns.length {
            at = ns.lineRange(for: NSRange(location: NSMaxRange(at), length: 0))
            guard let done = isItem(ns.substring(with: at).trimmingCharacters(in: .newlines)) else { break }
            lines.append(done)
        }
        return lines.count >= 2 && lines.allSatisfy { $0 }
    }
}

/// Takes a finished layer off its host.
private final class LayerRemover: NSObject, CAAnimationDelegate {
    weak var layer: CALayer?
    init(_ layer: CALayer) { self.layer = layer }
    func animationDidStop(_ anim: CAAnimation, finished: Bool) { layer?.removeFromSuperlayer() }
}
