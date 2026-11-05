#if os(iOS)
import Testing
import UIKit
@testable import Pane

/// Starting to type on a short note's last line doesn't scroll its title under the bar while that
/// line is well clear of the keyboard (persona council r7, Sara's shared list, two runs). A caret
/// out of view still brings the text to it.
@MainActor @Suite(.serialized) struct CaretScrollTests {
    @Test func aCaretInViewIsNotScrolledTo() {
        let visible = CGRect(x: 0, y: 100, width: 390, height: 400)
        let at = NSRange(location: 3, length: 0)
        #expect(PaneTextView.caretInView(selection: at, caret: CGRect(x: 20, y: 300, width: 2, height: 20), visible: visible))
        #expect(!PaneTextView.caretInView(selection: at, caret: CGRect(x: 20, y: 490, width: 2, height: 20), visible: visible), "under the keyboard")
        #expect(!PaneTextView.caretInView(selection: at, caret: CGRect(x: 20, y: 90, width: 2, height: 20), visible: visible), "under the bar")
        #expect(!PaneTextView.caretInView(selection: NSRange(location: 3, length: 4), caret: CGRect(x: 20, y: 300, width: 2, height: 20), visible: visible), "a selection: UIKit's call")
        #expect(!PaneTextView.caretInView(selection: at, caret: nil, visible: visible))
    }

    @Test func theKeyboardComingUpLeavesACaretInViewWhereItIs() async throws {
        #expect(PaneTextView.keepsPlaceForKeyboard(caret: CGRect(x: 20, y: 300, width: 2, height: 20), keyboardTop: 500, visibleTop: 100))
        #expect(!PaneTextView.keepsPlaceForKeyboard(caret: CGRect(x: 20, y: 490, width: 2, height: 20), keyboardTop: 500, visibleTop: 100), "under it: scroll to it")
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let v = PaneTextView(frame: window.bounds)
        let body = "Offsite plan\n\n- [x] Book the venue\n- [ ] Pick dates\n- [x] Order lunch\n- [ ] Print agenda\n"
        v.configure(text: body, header: "Today 09:41")
        window.addSubview(v)
        window.isHidden = false
        defer { window.isHidden = true }
        v.layoutIfNeeded()
        v.becomeFirstResponder()
        v.selectedRange = NSRange(location: (body as NSString).length, length: 0)
        let before = v.contentOffset
        // The keyboard's frame on screen, as UIKit posts it.
        let frame = CGRect(x: 0, y: 844 - 336, width: 390, height: 336)
        v.keyboardWillShow(Notification(name: UIResponder.keyboardWillShowNotification, object: nil,
                                        userInfo: [UIResponder.keyboardFrameEndUserInfoKey: frame, UIResponder.keyboardAnimationDurationUserInfoKey: 0.25]))
        // What UIKit does as the keyboard comes up: the room below changes and the text is moved.
        v.contentInset.bottom += 336
        v.contentOffset = CGPoint(x: 0, y: before.y + 16)
        #expect(abs(v.contentOffset.y - before.y) < 0.5, "the title stays: \(before.y) to \(v.contentOffset.y)")
        try? await Task.sleep(for: .seconds(0.6))
        v.contentOffset = CGPoint(x: 0, y: before.y + 40)
        #expect(abs(v.contentOffset.y - before.y - 40) < 0.5, "and once it's up, you can scroll again")
    }

    @Test func typingOnAShortNotesLastLineKeepsItsTitle() async throws {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let v = PaneTextView(frame: window.bounds)
        let body = "Offsite plan\n\n- [x] Book the venue\n- [ ] Pick dates\n- [x] Order lunch\n- [ ] Print agenda\n- [ ] "
        v.configure(text: body, header: "Today 09:41")
        window.addSubview(v)
        window.isHidden = false
        defer { window.isHidden = true }
        v.layoutIfNeeded()
        v.becomeFirstResponder()
        v.selectedRange = NSRange(location: (body as NSString).length, length: 0)
        // The keyboard: 336 pt of room taken at the bottom.
        v.contentInset.bottom += 336
        v.layoutIfNeeded()
        let before = v.contentOffset
        // What UIKit asks for with the caret on the last line: the caret and the room under the text.
        let caret = v.caretRect(for: v.selectedTextRange!.end)
        #expect(PaneTextView.caretInView(selection: v.selectedRange, caret: caret, visible: v.visibleTextArea), "the last line is clear of the keyboard")
        v.scrollRectToVisible(CGRect(x: 0, y: caret.minY, width: 2, height: v.contentSize.height - caret.minY + 400), animated: false)
        v.insertText("Book the train")
        v.layoutIfNeeded()
        #expect(abs(v.contentOffset.y - before.y) < 0.5, "the title stays: \(before.y) to \(v.contentOffset.y)")
    }
}
#endif
