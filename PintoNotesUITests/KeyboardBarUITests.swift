#if os(iOS)
import XCTest

/// The bar above the keyboard while you write sits close to it, as Notes' does (Emil, 28 October
/// 2026: "the buttons above the keyboard are weirdly far away from the keyboard"). Measured on the
/// simulator with the software keyboard: the gap between the bar's buttons and the keyboard's top.
final class KeyboardBarUITests: XCTestCase {
    /// Notes on iOS 26 leaves about 8 pt between its bar and the keyboard.
    static let gap: ClosedRange<CGFloat> = 4...12

    @MainActor
    func testTheBarSitsJustAboveTheKeyboard() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-uitest", "-demo", "-open", "Groceries"]
        app.launch()
        let editor = app.textViews["editor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        editor.tap()
        let done = app.buttons["editor.done"]
        XCTAssertTrue(done.waitForExistence(timeout: 5), "the bar above the keyboard")
        let keyboard = app.keyboards.firstMatch
        if keyboard.waitForExistence(timeout: 5) {
            // The keyboard's own frame starts below its suggestions row: its visible top edge is
            // found in the picture, where the page's colour gives way to the keyboard's.
            let screen = app.screenshot()
            let top = try XCTUnwrap(Self.visibleTop(of: keyboard.frame, below: done.frame, in: screen.image))
            let gap = top - done.frame.maxY
            let shot = XCTAttachment(screenshot: screen)
            shot.name = "keyboard-up"
            shot.lifetime = .keepAlways
            add(shot)
            print("KEYBOARD-GAP \(gap) keyboard top \(top) frame \(keyboard.frame) bar \(done.frame)")
            XCTAssertTrue(Self.gap.contains(gap), "\(gap) pt between the bar and the keyboard")
        } else {
            // A hardware keyboard: only the shortcut bar shows, and the bar sits on the screen's
            // bottom safe area.
            let window = app.windows.firstMatch.frame
            let gap = window.maxY - done.frame.maxY
            print("KEYBOARD-GAP hardware \(gap) bar \(done.frame)")
            XCTAssertLessThan(gap, 80, "the bar sits low with only the shortcut bar")
        }
    }

    /// The keyboard's visible top: going down from just under the bar, in the empty stretch between
    /// the bar's tools and its keyboard button, the first row whose colour isn't the page's.
    static func visibleTop(of keyboard: CGRect, below bar: CGRect, in image: UIImage) -> CGFloat? {
        guard let cg = image.cgImage else { return nil }
        let scale = CGFloat(cg.width) / image.size.width
        let w = cg.width, h = cg.height
        var data = [UInt8](repeating: 0, count: w * h * 4)
        guard let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
        let x = Int((bar.minX - 20) * scale)
        func color(_ y: CGFloat) -> (Int, Int, Int) {
            let i = (Int(y * scale) * w + x) * 4
            return (Int(data[i]), Int(data[i + 1]), Int(data[i + 2]))
        }
        let start = bar.maxY + 1 / scale
        let page = color(start)
        var y = start
        while y < keyboard.minY {
            let c = color(y)
            if abs(c.0 - page.0) + abs(c.1 - page.1) + abs(c.2 - page.2) > 20 { return y }
            y += 1 / scale
        }
        return keyboard.minY
    }
}
#endif
