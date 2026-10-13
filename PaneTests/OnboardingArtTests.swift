#if os(macOS)
import AppKit
import Foundation
import Testing
@testable import Pane

/// The sign-in and first-run pictures: one set per person, kept; every picture there in light and
/// dark; and none of them in the share extension.
@MainActor @Suite struct OnboardingArtTests {
    /// The first ask picks at random and keeps it; every later ask, a restart included, gets the
    /// same set whatever the dice say.
    @Test func theSetIsPickedOnceAndKept() {
        guard ProcessInfo.processInfo.environment["PINTO_ONBOARDING_SET"] == nil else { return }
        let d = TestDefaults()
        #expect(OnboardingArt.set(defaults: d, random: { true }) == .still)
        #expect(d.string(forKey: OnboardingArt.key) == "still")
        for _ in 0..<5 { #expect(OnboardingArt.set(defaults: d, random: { false }) == .still) }
        let other = TestDefaults()
        #expect(OnboardingArt.set(defaults: other, random: { false }) == .desk)
        #expect(OnboardingArt.set(defaults: other, random: { true }) == .desk)
    }

    /// Both outcomes come up: the pick is a coin, not a constant.
    @Test func bothSetsComeUp() {
        guard ProcessInfo.processInfo.environment["PINTO_ONBOARDING_SET"] == nil else { return }
        let picks = Set((0..<64).map { _ in OnboardingArt.set(defaults: TestDefaults()) })
        #expect(picks == [.still, .desk])
    }

    /// Mean luminance of `image` drawn as a window in `appearance` would draw it.
    static func luminance(_ image: NSImage, _ appearance: NSAppearance.Name) -> Double {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 30, pixelsHigh: 40, bitsPerSample: 8, samplesPerPixel: 4,
                                   hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSAppearance(named: appearance)!.performAsCurrentDrawingAppearance {
            NSGraphicsContext.saveGraphicsState()
            NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
            image.draw(in: NSRect(x: 0, y: 0, width: 30, height: 40))
            NSGraphicsContext.restoreGraphicsState()
        }
        var total = 0.0
        for x in 0..<30 { for y in 0..<40 { let c = rep.colorAt(x: x, y: y)!; total += 0.2126 * c.redComponent + 0.7152 * c.greenComponent + 0.0722 * c.blueComponent } }
        return total / 1200
    }

    /// Ten pictures a set (five moments, light and dark), 3:4, and the dark one darker.
    @Test(arguments: OnboardingArt.Set.allCases)
    func everyMomentHasLightAndDark(_ set: OnboardingArt.Set) throws {
        for moment in OnboardingArt.Moment.allCases {
            let name = OnboardingArt.name(moment, in: set)
            let image = try #require(NSImage(named: name), "\(name) is in the app's catalog")
            #expect(abs(image.size.width / image.size.height - 0.75) < 0.01, "\(name) is 3:4")
            let light = Self.luminance(image, .aqua), dark = Self.luminance(image, .darkAqua)
            #expect(dark < light - 0.1, "\(name) has a dark version (\(light) light, \(dark) dark)")
        }
    }

    /// Each first-run step has its own picture, and none repeats within a set.
    @Test func eachStepHasItsOwnPicture() {
        let names = Onboarding.Step.allCases.map { OnboardingArt.name(OnboardingArt.moment($0), in: .still) }
        #expect(Set(names).count == Onboarding.Step.allCases.count)
        #expect(!names.contains(OnboardingArt.name(.signin, in: .still)))
    }

    /// The pictures live in their own catalog, which comes with the app's folder (the Mac and the
    /// iPhone app) and which the share extension, listing its own sources, never gets.
    @Test func theShareExtensionDoesntCarryThem() throws {
        let project = try String(contentsOf: TestFiles.url("project.yml"), encoding: .utf8)
        let share = try #require(project.components(separatedBy: "\n  PaneShare:\n").last?.components(separatedBy: "\n  Pane").first)
        #expect(share.contains("Assets.xcassets"))
        #expect(!share.contains("Onboarding.xcassets"))
        #expect(!share.contains("      - Pane\n"), "the share extension lists files, never the whole app folder")
        // Both apps: the folder whole, with no filter or exclusion keeping the pictures from iPhone.
        #expect(project.contains("sources: &appSources\n      - Pane\n"))
        #expect(!project.contains("excludes: [\"Resources/Onboarding.xcassets\"]"))
        #expect(!project.contains("Onboarding.xcassets\n        destinationFilters"))
    }
}
#endif
