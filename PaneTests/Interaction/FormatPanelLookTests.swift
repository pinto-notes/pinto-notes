import Foundation
import Testing
import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// The Format panel's look and motion (Emil, 30 October 2026): each paragraph style written exactly
/// as the note writes it, no empty forehead above the first row, and the panel and the keyboard
/// trading places on the keyboard's own move instead of cutting. And the welcome's way in, which
/// springs up again.
@MainActor @Suite(.serialized) struct FormatPanelLookTests {
    /// The face the styler gives a line of each style is the one the panel's choice is drawn in.
    @Test(arguments: [(FormatControl.title, "# Plan"), (.heading, "## Plan"), (.subheading, "### Plan"), (.body, "Plan")])
    func eachStyleIsTheNotesOwnFace(_ args: (FormatControl, String)) {
        let (style, line) = args
        let storage = NSTextStorage(string: "Trip\n\(line)")
        EditorCore().restyle(storage, selection: nil, force: true)
        let noted = storage.attribute(.font, at: storage.length - 1, effectiveRange: nil) as? PFont
        let panel = MarkdownStyler().font(for: style)
        #expect(noted != nil && panel == noted, "\(style.name): the panel's \(String(describing: panel)), the note's \(String(describing: noted))")
        #if os(iOS)
        #expect(StyleChip.font(style) == noted)
        #endif
    }

    #if os(iOS)
    /// Title is drawn at the note's full size: its row grows to hold it, never shrinks it.
    @Test func aTallTitleMakesItsRowTaller() {
        let font = StyleChip.font(.title)
        let chip = UIHostingController(rootView: StyleChip(style: .title, on: true, enabled: true) {})
        let size = chip.sizeThatFits(in: CGSize(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude))
        #expect(size.height >= max(44, ceil(font.lineHeight)), "the row is \(size.height), the title's line \(font.lineHeight)")
        #expect(font.pointSize == MarkdownStyler().headingFont(1).pointSize, "never shrunk")
    }

    /// No forehead: the first row ("Format" and the close button) starts as far from the panel's
    /// top as its pills from the sides.
    @Test func theFirstRowStartsAtTheSideInset() async throws {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIViewController()
        window.isHidden = false
        defer { window.isHidden = true }
        let panel = FormatPanelHost(controller: EditorController())
        window.rootViewController!.view.addSubview(panel)
        let height = panel.intrinsicContentSize.height
        panel.frame = CGRect(x: 0, y: window.bounds.height - height, width: window.bounds.width, height: height)
        FormatPanel.firstRowFrame = .zero
        for _ in 0..<20 where FormatPanel.firstRowFrame == .zero {
            panel.layoutIfNeeded()
            try await Task.sleep(for: .milliseconds(50))
        }
        let row = FormatPanel.firstRowFrame
        #expect(row.height == FormatPanel.closeSize, "the row is the close button's circle, \(row.height)")
        #expect(abs((row.minY - panel.frame.minY) - FormatPanel.inset) < 0.5, "\(row.minY - panel.frame.minY) pt above the first row, \(FormatPanel.inset) at the sides")
    }

    @Test func thePanelTradesPlacesWithTheKeyboardOrFadesWithReduceMotion() async throws {
        #expect(FormatPanelMotion.motion(reduceMotion: false) == .trade)
        #expect(FormatPanelMotion.motion(reduceMotion: true) == .crossFade)

        // Through the real editor: opening and closing go through the motion, not a cut.
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        let controller = EditorController()
        window.rootViewController = UIHostingController(rootView: MarkdownEditor(initialText: "Trip\nPlan", header: "", controller: controller, onChange: { _ in }))
        window.isHidden = false
        defer { window.isHidden = true }
        var tv: PaneTextView?
        for _ in 0..<20 where tv == nil {
            tv = WelcomeNoteTests.textView(in: window)
            try await Task.sleep(for: .milliseconds(50))
        }
        let view = try #require(tv)
        window.makeKey()
        #expect(view.becomeFirstResponder())
        view.selectedRange = NSRange(location: 9, length: 0)
        controller.showFormatPanel()
        #expect(view.lastFormatMotion == FormatPanelMotion.now)
        #expect(view.showsFormatPanel)
        for _ in 0..<20 where !view.isFirstResponder { try await Task.sleep(for: .milliseconds(50)) }
        #expect(view.isFirstResponder, "the text has the panel, in the keyboard's place")
        #expect(view.selectedRange == NSRange(location: 9, length: 0), "on the same caret")
        #expect(controller.formatPanelShown, "handing the keyboard down for the swap didn't close the panel")
        #expect(controller.isEditing, "nor end editing")

        controller.closeFormatPanel()
        #expect(view.lastFormatMotion == FormatPanelMotion.now)
        for _ in 0..<20 where !view.isFirstResponder { try await Task.sleep(for: .milliseconds(50)) }
        #expect(!view.showsFormatPanel && view.isFirstResponder, "the keyboard is back in the text")
        #expect(view.selectedRange == NSRange(location: 9, length: 0))
        view.resignFirstResponder()
    }

    /// The way in springs up from the foot of the page (it had come up with a fade since the email
    /// sign-in moved it); with Reduce Motion it fades.
    @Test func theWelcomeWayInSprings() {
        #expect(WelcomeNoteView.WayInMotion.motion(reduceMotion: false) == .spring)
        #expect(WelcomeNoteView.WayInMotion.spring.animation == .spring(response: 0.42, dampingFraction: 0.75))
        #expect(WelcomeNoteView.WayInMotion.motion(reduceMotion: true) == .fade)
        #expect(WelcomeNoteView.WayInMotion.fade.animation == .easeOut(duration: 0.25))
    }
    #endif
}
