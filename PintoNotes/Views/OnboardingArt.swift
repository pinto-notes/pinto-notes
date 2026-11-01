import SwiftUI
#if os(macOS)
import AppKit
#endif

/// The pictures beside sign-in and the first-run steps on the Mac: two paper-craft sets, a still
/// life for each step (`still`) and one desk that fills up step by step (`desk`). Each person
/// gets one of them, picked at random the first time it's asked for and kept from then on, so
/// one person's flow never mixes the two, across restarts as well. Each picture has its own dark
/// version (Onboarding.xcassets, the Mac app's only). Nothing about which set a person got is
/// sent anywhere.
enum OnboardingArt {
    enum Set: String, CaseIterable, Sendable {
        case still, desk
    }

    /// The moments that have a picture: sign-in (and the screens around it), then each step.
    enum Moment: String, CaseIterable, Sendable {
        case signin, name, bring, connect, tryit
    }

    static let key = "onboardingArtSet"

    #if DEBUG
    /// Tests: a set to use, ahead of everything else.
    nonisolated(unsafe) static var forced: Set?
    #endif

    /// This person's set: the one kept in `defaults`, or a new 50/50 pick, kept. A debug build
    /// takes `PINTO_ONBOARDING_SET=still|desk` first, for captures and tests.
    static func set(defaults: UserDefaults = .standard, random: () -> Bool = { Bool.random() }) -> Set {
        #if DEBUG
        if let forced { return forced }
        if let forced = ProcessInfo.processInfo.environment["PINTO_ONBOARDING_SET"].flatMap(Set.init(rawValue:)) { return forced }
        #endif
        if let kept = defaults.string(forKey: key).flatMap(Set.init(rawValue:)) { return kept }
        let picked: Set = random() ? .still : .desk
        defaults.set(picked.rawValue, forKey: key)
        return picked
    }

    /// The image's name in the catalog.
    static func name(_ moment: Moment, in set: Set) -> String { "Onboarding-\(set.rawValue)-\(moment.rawValue)" }

    /// Where in the picture (0 top, 1 bottom) a narrow band should centre: the step's new object.
    /// iPhone shows each step's picture in a band about a third of its height; the centre slice cut
    /// through the easel and the ribbon. Chosen by eye on each picture (light and dark share the
    /// layout): the name card, the bundle, the two pencils, the checklist; on the desk, the
    /// notebook's spread with what was just added.
    static func focus(_ moment: Moment, in set: Set) -> CGFloat {
        switch (set, moment) {
        case (_, .signin): 0.5
        case (.still, .name): 0.5
        case (.still, .bring): 0.57
        case (.still, .connect): 0.5
        case (.still, .tryit): 0.62
        case (.desk, .name): 0.54
        case (.desk, .bring): 0.76
        case (.desk, .connect): 0.5
        case (.desk, .tryit): 0.5
        }
    }

    /// The vertical offset that puts `focus` (0–1 down a picture of `height`) in the middle of a
    /// band `band` tall, without leaving the picture: 0 shows its top, `band - height` its foot.
    static func offset(focus: CGFloat, height: CGFloat, band: CGFloat) -> CGFloat {
        min(0, max(band - height, band / 2 - focus * height))
    }

    /// This person's picture for `moment`.
    static func name(_ moment: Moment) -> String { name(moment, in: set()) }

    #if os(macOS)
    /// Decodes the pictures beside `step` (the one before and the one after) ahead of time, so a
    /// crossfade to either never waits on the disk or shows the ground.
    static func prefetch(around step: Onboarding.Step) {
        let steps = Onboarding.Step.allCases
        guard let i = steps.firstIndex(of: step) else { return }
        let near = [i - 1, i + 1].filter { steps.indices.contains($0) }.map { name(moment(steps[$0])) }
        for n in near + (i == 0 ? [name(.signin)] : []) {
            _ = NSImage(named: n)?.cgImage(forProposedRect: nil, context: nil, hints: nil)
        }
    }
    #endif

    static func moment(_ step: Onboarding.Step) -> Moment {
        switch step {
        case .name: .name
        case .bring: .bring
        case .connect: .connect
        case .tryIt: .tryit
        }
    }
}
