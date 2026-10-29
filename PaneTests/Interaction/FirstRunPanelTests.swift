#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The first-run panel itself, offscreen: Return does the step's primary row, Esc skips without
/// marking the step done, and the count is on the panel. Keys go through this app's own event
/// dispatch to its offscreen window, so the panel's key monitor hears them as it would a person's;
/// nothing is posted system-wide.
@MainActor @Suite(.serialized) struct FirstRunPanelTests {
    @MainActor final class Stage {
        let window: KeyableWindow
        let host: NSHostingView<AnyView>
        let model: FirstRunModel
        var performed: [FirstRun.Action] = []
        var skips = 0

        init(at step: Onboarding.Step?) {
            FirstRunPanel.typesQuestion = false
            let store = OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps)
            model = FirstRunModel(store: store)
            if let step {
                store.attach(account: UUID(), created: .now.addingTimeInterval(-30), holdsNothing: true)
                store.settle(accountIsNew: true, progress: SetupProgress())
                if step != .bring { store.go(to: step) }
                model.signedIn()
                model.follow(store.step)
            }
            window = KeyableWindow(contentRect: NSRect(x: -20000, y: -20000, width: 800, height: 560), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            host = NSHostingView(rootView: AnyView(EmptyView()))
            let model = model
            host.rootView = AnyView(FirstRunPanel(model: model, backend: Backend(), perform: { [weak self] in self?.performed.append($0) },
                                                  skip: { [weak self] in self?.skips += 1; model.skip() })
                .frame(width: 800, height: 560, alignment: .top))
            host.frame = window.contentRect(forFrameRect: window.frame)
            window.contentView = host
            window.makeKey()
        }

        func settle() async { try? await Task.sleep(for: .milliseconds(200)) }

        /// A key press for this window, through the app's event dispatch (local monitors included).
        func key(_ code: UInt16, _ chars: String) async {
            let e = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                     windowNumber: window.windowNumber, context: nil, characters: chars, charactersIgnoringModifiers: chars,
                                     isARepeat: false, keyCode: code)!
            NSApp.sendEvent(e)
            await settle()
        }

        /// Every accessibility element's identifier and what it says, asked the way VoiceOver
        /// asks (the accessibility API, in-process). The window is shown, far off screen:
        /// accessibility lists shown windows only.
        func labels() async -> [String: String] {
            window.orderFrontRegardless()
            try? await Task.sleep(for: .seconds(0.5))
            func attr(_ e: AXUIElement, _ name: String) -> CFTypeRef? {
                var v: CFTypeRef?
                return AXUIElementCopyAttributeValue(e, name as CFString, &v) == .success ? v : nil
            }
            var out: [String: String] = [:]
            func walk(_ e: AXUIElement, _ depth: Int) {
                if let id = attr(e, "AXIdentifier") as? String, !id.isEmpty {
                    out[id] = (attr(e, kAXDescriptionAttribute) as? String).flatMap { $0.isEmpty ? nil : $0 }
                        ?? (attr(e, kAXTitleAttribute) as? String).flatMap { $0.isEmpty ? nil : $0 }
                        ?? attr(e, kAXValueAttribute) as? String ?? ""
                }
                guard depth < 20 else { return }
                for k in attr(e, kAXChildrenAttribute) as? [AXUIElement] ?? [] { walk(k, depth + 1) }
            }
            let app = AXUIElementCreateApplication(getpid())
            AXUIElementSetMessagingTimeout(app, 5)
            walk(app, 0)
            return out
        }

        func close() { window.orderOut(nil); window.close() }
    }

    @Test func returnDoesThePrimaryRow() async {
        let stage = Stage(at: .bring)
        defer { stage.close() }
        await stage.settle()
        await stage.key(36, "\r")
        #expect(stage.performed == [.importAppleNotes])
        // The arrows move the pick; Return then does that row.
        await stage.key(125, "")
        await stage.key(36, "\r")
        #expect(stage.performed.last == .otherApps)
    }

    @Test func returnOnSignInContinuesWithApple() async {
        let stage = Stage(at: nil)
        defer { stage.close() }
        await stage.settle()
        await stage.key(36, "\r")
        #expect(stage.performed == [.signIn(.apple)])
        await stage.key(53, "\u{1B}")
        #expect(stage.skips == 0, "signing in has no way past")
    }

    @Test func escSkipsWithoutMarkingTheStepDone() async {
        let stage = Stage(at: .bring)
        defer { stage.close() }
        await stage.settle()
        await stage.key(53, "\u{1B}")
        #expect(stage.skips == 1)
        #expect(stage.performed.isEmpty)
        #expect(stage.model.outcome(.notes) == .skipped)
        #expect(!stage.model.done.contains(.notes))
        #expect(stage.model.step == .ai)
    }

    @Test func thePanelShowsItsStepCount() async {
        let stage = Stage(at: .connect)
        defer { stage.close() }
        await stage.settle()
        let labels = await stage.labels()
        #expect(labels["firstRun.count"] == "Step 3 of 4")
        #expect(labels["firstRun.skip"] == FirstRun.skip)
        #expect(labels["firstRun.disclosure"] != nil, "what connecting sends, and to whom, is on the panel")
    }
}
#endif
