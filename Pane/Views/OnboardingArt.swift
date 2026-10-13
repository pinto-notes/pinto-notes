import SwiftUI

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

    /// This person's set: the one kept in `defaults`, or a new 50/50 pick, kept. A debug build
    /// takes `PINTO_ONBOARDING_SET=still|desk` first, for captures and tests.
    static func set(defaults: UserDefaults = .standard, random: () -> Bool = { Bool.random() }) -> Set {
        #if DEBUG
        if let forced = ProcessInfo.processInfo.environment["PINTO_ONBOARDING_SET"].flatMap(Set.init(rawValue:)) { return forced }
        #endif
        if let kept = defaults.string(forKey: key).flatMap(Set.init(rawValue:)) { return kept }
        let picked: Set = random() ? .still : .desk
        defaults.set(picked.rawValue, forKey: key)
        return picked
    }

    /// The image's name in the catalog.
    static func name(_ moment: Moment, in set: Set) -> String { "Onboarding-\(set.rawValue)-\(moment.rawValue)" }

    /// This person's picture for `moment`.
    static func name(_ moment: Moment) -> String { name(moment, in: set()) }

    static func moment(_ step: Onboarding.Step) -> Moment {
        switch step {
        case .name: .name
        case .bring: .bring
        case .connect: .connect
        case .tryIt: .tryit
        }
    }
}
