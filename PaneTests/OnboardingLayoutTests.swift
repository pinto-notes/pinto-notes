#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The first-run flow in the welcome's 900 by 600 card. Item 107 (2026-10-12): Bring your notes
/// was so tall its button nearly left the window. Item 101: the picture on the left changed size
/// and crop on that step, because the step made the card taller than the window.
@MainActor
@Suite struct OnboardingLayoutTests {
    private static let card = WelcomeFlow.size

    @Test func everyStepFitsTheCardWithItsButton() {
        for shot in OnboardingSnapshots.shots {
            // The step at its natural height, the bottom margin under its button included.
            let host = NSHostingView(rootView: OnboardingSnapshots.flow(shot).frame(width: Self.card.width).fixedSize(horizontal: false, vertical: true))
            #expect(host.fittingSize.height <= Self.card.height, "\(shot.name) is \(host.fittingSize.height) pt tall")
        }
    }

    @Test func aTallStepNeverMakesTheCardTaller() {
        for side in [CGFloat(200), 600, 900] {
            let host = NSHostingController(rootView: CardLayout { Color.clear.frame(height: side) })
            #expect(host.sizeThatFits(in: Self.card).height == Self.card.height, "a \(side) pt step leaves the picture's panel as it is")
        }
    }
}
#endif
