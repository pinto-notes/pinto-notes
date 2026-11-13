import Foundation
import Observation
#if os(iOS)
import UIKit
import WidgetKit
#endif

// Privacy mode (Emil, 13 November 2026): the previews under each title in the note list blurred,
// so a shared screen, a recording or someone beside you doesn't read every note at a glance.
// Titles and the note you have open stay as they are: you have to be able to work (Emil, the
// same day, after an earlier build blurred the editor too). It
// turns itself on when your screen is shared, after asking (the cover, PrivacyCover), and off
// again when the sharing stops; turned on by hand, it stays on until you turn it off.

/// Says whether the screen is being shared or recorded right now. The iPhone asks the system
/// (SceneCaptureDetector); the Mac has no way to ask, so it looks for the apps that share
/// (ProcessShareDetector). Tests drive it with a fake.
@MainActor
protocol ScreenShareDetector: AnyObject {
    /// Starts watching; `changed` is called on the main thread each time the answer changes.
    func start(_ changed: @escaping @MainActor (Bool) -> Void)
    func stop()
}

@MainActor @Observable
final class PrivacyMode {
    static let shared = PrivacyMode(store: PaneApp.isUnitTestHost ? MemoryDefaults() : .standard)

    /// What happens when sharing starts (Settings › Privacy › Privacy mode).
    enum WhenShared: String, CaseIterable, Identifiable, Sendable {
        /// The cover asks (the default).
        case ask
        /// Notes hide at once ("Remember this" with Hide notes).
        case hide
        /// Nothing happens ("Remember this" with Show notes).
        case nothing
        var id: String { rawValue }
        var title: String {
            switch self {
            case .ask: "Ask"
            case .hide: PrivacyWords.hide
            case .nothing: PrivacyWords.show
            }
        }
    }

    /// Why it's on.
    enum Source: Equatable, Sendable {
        /// You turned it on (View › Privacy Mode, the eye, Control Centre, Settings). Stays on.
        case manual
        /// Sharing started and you chose Hide notes (or always do). Off when sharing stops.
        case automatic
    }

    static let manualKey = "privacyMode.manual"
    static let whenSharedKey = "privacyMode.whenShared"

    private let store: UserDefaults
    private(set) var source: Source?
    /// The screen is shared or recorded, as the detector last said.
    private(set) var sharing = false
    /// The frosted notice over the window, asking.
    private(set) var asking = false
    /// "Show previews" was chosen for this sharing session: not asked again until it stops.
    private var declined = false
    private var detector: ScreenShareDetector?

    var whenShared: WhenShared {
        didSet { store.set(whenShared.rawValue, forKey: Self.whenSharedKey) }
    }

    /// Previews are blurred: in the list, the sidebar's cards, search, the menu bar and the widget.
    var isOn: Bool { source != nil || asking }
    var isManual: Bool { source == .manual }

    /// Told each time `isOn` changes (the iPhone's widget and control).
    var changed: @MainActor (Bool) -> Void = { _ in }

    init(store: UserDefaults) {
        self.store = store
        whenShared = store.string(forKey: Self.whenSharedKey).flatMap(WhenShared.init(rawValue:)) ?? .ask
        if store.bool(forKey: Self.manualKey) { source = .manual }
    }

    // MARK: By hand

    /// View › Privacy Mode, the eye in the toolbar: off when it's on (for whatever reason), else on.
    func toggle() {
        if isOn { turnOff() } else { setManual(true) }
    }

    func setManual(_ on: Bool) {
        if on {
            update { asking = false; source = .manual }
        } else {
            turnOff()
        }
    }

    /// Off now. While the screen is still shared it isn't asked again: you just said show them.
    private func turnOff() {
        update {
            if sharing { declined = true }
            asking = false
            source = nil
        }
    }

    // MARK: The cover

    /// Hide notes or Show notes on the cover; with Remember this, the next share does the same
    /// without asking (Settings › Privacy changes it back).
    func answer(hide: Bool, remember: Bool) {
        if remember { whenShared = hide ? .hide : .nothing }
        update {
            asking = false
            if hide {
                if source == nil { source = .automatic }
            } else {
                declined = true
            }
        }
    }

    // MARK: Sharing

    /// Starts listening to a detector (the app does at launch; tests pass a fake).
    func watch(_ detector: ScreenShareDetector) {
        self.detector?.stop()
        self.detector = detector
        detector.start { [weak self] on in self?.sharingChanged(on) }
    }

    func stopWatching() {
        detector?.stop()
        detector = nil
    }

    func sharingChanged(_ on: Bool) {
        guard on != sharing else { return }
        update {
            sharing = on
            if on {
                declined = false
                guard source == nil else { return }
                switch whenShared {
                case .ask: asking = true
                case .hide: source = .automatic
                case .nothing: break
                }
            } else {
                // Sharing stopped: what it turned on goes off, what you turned on stays.
                asking = false
                declined = false
                if source == .automatic { source = nil }
            }
        }
    }

    private func update(_ change: () -> Void) {
        let was = isOn
        let wasManual = isManual
        change()
        if wasManual != isManual { store.set(isManual, forKey: Self.manualKey) }
        if was != isOn || wasManual != isManual { publish() }
    }

    /// Posted on the main thread each time privacy mode turns on or off.
    nonisolated static let didChange = Notification.Name("pinto.privacyMode.changed")

    private func publish() {
        changed(isOn)
        NotificationCenter.default.post(name: Self.didChange, object: nil)
        #if os(iOS)
        // The widget says Hidden, the Control Centre switch shows whether you turned it on.
        let p = ChecklistShelf.Privacy(hidden: isOn, manual: isManual)
        if ChecklistShelf.savePrivacy(p), !PaneApp.isUnitTestHost {
            WidgetCenter.shared.reloadTimelines(ofKind: ChecklistWidgetContent.kind)
            ControlCenter.shared.reloadControls(ofKind: PrivacyWords.controlKind)
        }
        #endif
    }

    /// The Control Centre switch writes what you set into the App Group: taken up when the app
    /// comes forward.
    func takeUpControl() {
        #if os(iOS)
        let p = ChecklistShelf.privacy()
        if p.manual != isManual { setManual(p.manual) }
        #endif
    }
}
