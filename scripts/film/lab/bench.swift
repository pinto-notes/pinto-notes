import CoreGraphics
import Foundation
/// Lab: how long a style takes to draw one frame, without encoding.
enum Bench {
    static func run(_ name: String, width: Int, height: Int, frames: [Int], draw: (CGContext, Int) -> Void) {
        guard let ctx = Kit.context(width, height) else { return }
        draw(ctx, frames[0])
        let start = Date()
        for f in frames { draw(ctx, f) }
        print("\(name) \(width)x\(height): \(String(format: "%.1f", Date().timeIntervalSince(start) / Double(frames.count) * 1000)) ms a frame")
    }
}
