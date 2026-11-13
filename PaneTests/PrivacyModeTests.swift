import Foundation
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// What a callback heard, kept where a Sendable closure can add to it.
final class Heard<T>: @unchecked Sendable {
    private let lock = NSLock()
    private var items: [T] = []
    func add(_ t: T) { lock.withLock { items.append(t) } }
    var all: [T] { lock.withLock { items } }
}

/// A detector the test drives: it says sharing started or stopped when told.
@MainActor final class FakeShareDetector: ScreenShareDetector {
    private var changed: (@MainActor (Bool) -> Void)?
    private(set) var started = false
    func start(_ changed: @escaping @MainActor (Bool) -> Void) { self.changed = changed; started = true }
    func stop() { changed = nil; started = false }
    func say(_ sharing: Bool) { changed?(sharing) }
}

/// Privacy mode (Emil, 13 November 2026): on by hand, or by itself while the screen is shared,
/// after the cover asks. Ships on and automatic on both platforms.
@MainActor @Suite struct PrivacyModeTests {
    static func fresh() -> (PrivacyMode, FakeShareDetector, UserDefaults) {
        let store = MemoryDefaults()
        let mode = PrivacyMode(store: store)
        let fake = FakeShareDetector()
        mode.watch(fake)
        return (mode, fake, store)
    }

    @Test func offAndAskingByDefault() {
        let (mode, fake, _) = Self.fresh()
        #expect(!mode.isOn)
        #expect(mode.whenShared == .ask, "automatic, asking, out of the box")
        #expect(fake.started)
    }

    @Test func theShortcutsToggleTurnsItOnByHandAndOff() {
        let (mode, _, store) = Self.fresh()
        mode.toggle()
        #expect(mode.isOn && mode.isManual)
        #expect(store.bool(forKey: PrivacyMode.manualKey), "kept for the next launch")
        #expect(PrivacyMode(store: store).isManual, "a new launch starts with it on")
        mode.toggle()
        #expect(!mode.isOn)
        #expect(!store.bool(forKey: PrivacyMode.manualKey))
    }

    /// Sharing starts: the cover asks, and while it's up the notes are already hidden.
    @Test func theCoverAsksWhenSharingStartsAndHidesTheNotesMeanwhile() {
        let (mode, fake, _) = Self.fresh()
        fake.say(true)
        #expect(mode.asking)
        #expect(mode.isOn, "the cover is itself what hides them")
        mode.answer(hide: true, remember: false)
        #expect(!mode.asking && mode.isOn && mode.source == .automatic)
        // Sharing stops: what it turned on goes off.
        fake.say(false)
        #expect(!mode.isOn)
        // Next time it asks again: Remember this wasn't ticked.
        fake.say(true)
        #expect(mode.asking)
    }

    @Test func showNotesLeavesThemShownUntilTheNextShare() {
        let (mode, fake, _) = Self.fresh()
        fake.say(true)
        mode.answer(hide: false, remember: false)
        #expect(!mode.isOn && !mode.asking)
        fake.say(false)
        fake.say(true)
        #expect(mode.asking, "a new share asks again")
    }

    @Test func rememberThisKeepsTheChoice() {
        let (mode, fake, store) = Self.fresh()
        fake.say(true)
        mode.answer(hide: true, remember: true)
        #expect(mode.whenShared == .hide)
        #expect(PrivacyMode(store: store).whenShared == .hide, "kept")
        fake.say(false)
        #expect(!mode.isOn)
        fake.say(true)
        #expect(!mode.asking && mode.isOn && mode.source == .automatic, "hides at once, without asking")
        fake.say(false)
        // Show notes, remembered: nothing happens next time.
        mode.whenShared = .ask
        fake.say(true)
        mode.answer(hide: false, remember: true)
        #expect(mode.whenShared == .nothing)
        fake.say(false)
        fake.say(true)
        #expect(!mode.isOn && !mode.asking)
        // Settings › Privacy changes it back.
        mode.whenShared = .ask
        fake.say(false)
        fake.say(true)
        #expect(mode.asking)
    }

    /// Turned on by hand, it stays on after the sharing stops; turned on by the share, it doesn't.
    @Test func manualStaysOnAfterSharingStops() {
        let (mode, fake, _) = Self.fresh()
        mode.setManual(true)
        fake.say(true)
        #expect(!mode.asking, "already hidden: nothing to ask")
        fake.say(false)
        #expect(mode.isOn && mode.isManual)
        // On by the share, then on by hand while it lasts: stays.
        mode.setManual(false)
        fake.say(true)
        mode.answer(hide: true, remember: false)
        mode.toggle()
        #expect(!mode.isOn, "the eye or ⌃⌘P turns it off")
        mode.toggle()
        #expect(mode.isManual)
        fake.say(false)
        #expect(mode.isOn)
    }

    @Test func theShortcutWhileTheCoverAsksShowsTheNotes() {
        let (mode, fake, _) = Self.fresh()
        fake.say(true)
        mode.toggle()
        #expect(!mode.isOn && !mode.asking)
        // Not asked again during this share.
        fake.say(true)
        #expect(!mode.asking)
    }

    @Test func theEditorAndWidgetHearEachChange() {
        let (mode, fake, _) = Self.fresh()
        let heard = Heard<Bool>()
        mode.changed = { heard.add($0) }
        let posted = Heard<Int>()
        let token = NotificationCenter.default.addObserver(forName: PrivacyMode.didChange, object: nil, queue: nil) { _ in posted.add(1) }
        defer { NotificationCenter.default.removeObserver(token) }
        fake.say(true)
        mode.answer(hide: true, remember: false)
        fake.say(false)
        #expect(heard.all == [true, false], "on with the cover, still on after Hide notes, off when sharing stops")
        #expect(posted.all.count == 2)
    }

    // MARK: The Mac's detector

    @Test func zoomCountsAtOnceTheScreenshotToolAfterEightSeconds() {
        var h = ShareHeuristic()
        let t0 = Date(timeIntervalSince1970: 1000)
        #expect(h.active(running: ["finder", "cpthost"], now: t0) == ["Zoom"])
        #expect(h.active(running: ["screensharingd"], now: t0) == ["Screen Sharing"])
        // A screenshot: its tool runs for a few seconds, and that isn't sharing.
        #expect(h.active(running: ["screencaptureui"], now: t0).isEmpty)
        #expect(h.active(running: ["screencaptureui"], now: t0.addingTimeInterval(6)).isEmpty)
        #expect(h.active(running: [], now: t0.addingTimeInterval(7)).isEmpty)
        // A recording: it stays up.
        #expect(h.active(running: ["screencaptureui"], now: t0.addingTimeInterval(8)).isEmpty, "a new run starts the wait again")
        #expect(h.active(running: ["screencaptureui"], now: t0.addingTimeInterval(16)) == ["Screen recording"])
        #expect(h.active(running: ["screencapture"], now: t0.addingTimeInterval(18)) == ["Screen recording"], "Terminal's screencapture -v too")
        // Nothing for a meeting in a browser, or Zoom without sharing.
        #expect(h.active(running: ["google chrome", "zoom.us", "aomhost"], now: t0.addingTimeInterval(20)).isEmpty)
    }

    #if os(macOS)
    /// Each look costs well under the 2 s between looks: names only, no permission asked.
    @Test func lookingAtTheProcessesIsCheap() {
        let lister = LibProcLister()
        let names = lister.names()
        #expect(names.count > 20, "this Mac's processes: \(names.count)")
        #expect(names.contains(ProcessInfo.processInfo.processName.lowercased()) || names.contains("pane"), "itself among them")
        var usage = rusage()
        getrusage(RUSAGE_SELF, &usage)
        let before = Double(usage.ru_utime.tv_sec + usage.ru_stime.tv_sec) + Double(usage.ru_utime.tv_usec + usage.ru_stime.tv_usec) / 1e6
        let clock = ContinuousClock.now
        for _ in 0..<50 { _ = lister.names() }
        let wall = (ContinuousClock.now - clock) / 50
        getrusage(RUSAGE_SELF, &usage)
        let after = Double(usage.ru_utime.tv_sec + usage.ru_stime.tv_sec) + Double(usage.ru_utime.tv_usec + usage.ru_stime.tv_usec) / 1e6
        let cpu = (after - before) / 50
        print("share-detector: \(names.count) processes, \(String(format: "%.2f", cpu * 1000)) ms CPU and \(wall) per look; every 2 s that is \(String(format: "%.3f", cpu / 2 * 100))% of one core")
        #expect(cpu < 0.02, "under 20 ms of CPU a look (1% of a core at one look every 2 s)")
    }

    @Test func theDetectorTellsTheMainThreadOnlyWhenTheAnswerChanges() async {
        final class Names: ProcessLister, @unchecked Sendable {
            let lock = NSLock()
            var now: Set<String> = []
            func names() -> Set<String> { lock.withLock { now } }
        }
        let names = Names()
        let detector = ProcessShareDetector(lister: names)
        let heard = Heard<Bool>()
        detector.start { heard.add($0) }
        defer { detector.stop() }
        try? await Task.sleep(for: .seconds(0.3))
        #expect(heard.all.isEmpty, "not sharing at the start: nothing said")
        names.lock.withLock { names.now = ["cpthost"] }
        let end = Date.now.addingTimeInterval(6)
        while heard.all.isEmpty, Date.now < end { try? await Task.sleep(for: .milliseconds(100)) }
        #expect(heard.all == [true])
    }
    #endif

    // MARK: Widget and menu bar

    /// A checklist stays, since you tick it in the widget; a note's lines are its preview, so blurred.
    @Test func theWidgetBlursANotesLinesAndKeepsAChecklist() {
        let list = ChecklistWidgetContent.sample
        #expect(ChecklistWidgetContent.resolve(picked: list.id, lists: [list], hidden: true) == .list(list))
        #expect(ChecklistWidgetContent.resolve(picked: list.id, lists: [list], hidden: false) == .list(list))
        let preview = ChecklistShelf.Preview(id: UUID(), title: "Doctor", lines: ["Results on Thursday"], updatedAt: .now)
        #expect(ChecklistWidgetContent.resolve(picked: preview.id, lists: [], previews: [preview], hidden: true) == .blurred(preview))
        #expect(ChecklistWidgetContent.resolve(picked: preview.id, lists: [], previews: [preview], hidden: false) == .note(preview))
        #expect(ChecklistWidgetContent.resolve(picked: nil, lists: [], previews: [preview], hidden: true) == .blurred(preview))
    }

    @Test func theAppLeavesPrivacyModeForTheWidgetAndControl() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "privacy-shelf-\(UUID().uuidString)")
        ChecklistShelf.rootOverride = dir
        defer { ChecklistShelf.rootOverride = nil; try? FileManager.default.removeItem(at: dir) }
        #expect(ChecklistShelf.privacy() == .init())
        #expect(ChecklistShelf.savePrivacy(.init(hidden: true, manual: true)))
        #expect(!ChecklistShelf.savePrivacy(.init(hidden: true, manual: true)), "unchanged: no redraw")
        #expect(ChecklistShelf.privacy() == .init(hidden: true, manual: true))
    }

    /// Which titles blur: on the Mac, with privacy mode on, all but the open note's, until the
    /// list shows them. The iPhone's never do.
    @Test func whichTitlesBlur() {
        #if os(macOS)
        #expect(ListTitleReveal.blurs(privacyOn: true, open: false, revealed: false))
        #else
        #expect(!ListTitleReveal.blurs(privacyOn: true, open: false, revealed: false), "the iPhone's titles stay sharp")
        #endif
        #expect(!ListTitleReveal.blurs(privacyOn: true, open: true, revealed: false), "the open note's title shows")
        #expect(!ListTitleReveal.blurs(privacyOn: true, open: false, revealed: true), "over the list, titles show")
        #expect(!ListTitleReveal.blurs(privacyOn: false, open: false, revealed: false), "off: nothing blurs")
    }

    /// Pointer over the list: titles at once. Away: a moment later, unless it comes back first.
    /// The arrow keys while the list has the keys: titles, until it loses them.
    @Test func theRevealWaitsBeforeBlurringAgain() async {
        let r = ListTitleReveal(delay: .milliseconds(200))
        #expect(!r.shown)
        r.pointer(true)
        #expect(r.shown)
        r.pointer(false)
        #expect(r.shown, "not at once: brushing past doesn't flicker")
        try? await Task.sleep(for: .milliseconds(80))
        r.pointer(true)
        try? await Task.sleep(for: .milliseconds(300))
        #expect(r.shown, "came back in time: still shown")
        r.pointer(false)
        try? await Task.sleep(for: .milliseconds(400))
        #expect(!r.shown, "after the delay: blurred")
        r.navigated()
        #expect(r.shown, "the keys show them")
        r.focus(true)
        #expect(r.shown)
        r.focus(false)
        try? await Task.sleep(for: .milliseconds(400))
        #expect(!r.shown, "the list lost the keys: blurred again")
    }

    /// Previews stay unreadable under the blur: at 4 whole sentences could be read in the
    /// pictures (13 November 2026), so it can't drift back below 8.
    @Test func thePreviewBlurIsStrongEnoughThatPreviewsCantBeRead() {
        #expect(PreviewBlur.minimumRadius == 8)
        #expect(PreviewBlur.radius >= PreviewBlur.minimumRadius, "previews are readable below \(PreviewBlur.minimumRadius): \(PreviewBlur.radius)")
    }

    // MARK: Words

    @Test func theCopyIsPlain() {
        let all = [PrivacyWords.menuTitle, PrivacyWords.name, PrivacyWords.turnOff, PrivacyWords.help,
                   PrivacyWords.settingsFooter, PrivacyWords.settingsFooterPhone, PrivacyWords.whenSharedTitle, PrivacyWords.whenSharedFooter,
                   PrivacyWords.coverTitle, PrivacyWords.coverQuestion, PrivacyWords.hide, PrivacyWords.show, PrivacyWords.remember, PrivacyWords.controlLine]
        for w in all { #expect(!w.contains("\u{2014}"), "no em dash: \(w)") }
        #expect(PrivacyWords.coverTitle == "Your screen is being shared")
        #expect(PrivacyWords.coverQuestion == "Blur note previews?")
        #expect(PrivacyWords.hide == "Blur previews" && PrivacyWords.show == "Show previews")
        #expect(PrivacyWords.settingsFooter == "Blurs note previews, and note titles until you point at the list. The note you have open still shows.")
        #expect(PrivacyWords.settingsFooterPhone == "Blurs the previews under each title in the note list. Titles and the note you have open still show.")
        for w in all { #expect(!w.contains("Hidden") && !w.contains("Hides") && !w.contains("hidden"), "it blurs, it doesn't hide: \(w)") }
    }

    #if os(iOS)
    /// The iPhone's capture state (recording, mirroring, AirPlay) drives the same model.
    @Test func theIPhonesCaptureStateDrivesTheModel() {
        let store = MemoryDefaults()
        let mode = PrivacyMode(store: store)
        let captured = Heard<Bool>()
        let detector = SceneCaptureDetector(read: { captured.all.last ?? false })
        mode.watch(detector)
        #expect(!mode.isOn)
        captured.add(true)
        NotificationCenter.default.post(name: UIScreen.capturedDidChangeNotification, object: nil)
        #expect(mode.asking)
        mode.answer(hide: true, remember: false)
        captured.add(false)
        NotificationCenter.default.post(name: UIScreen.capturedDidChangeNotification, object: nil)
        #expect(!mode.isOn)
        mode.stopWatching()
    }
    #endif
}
