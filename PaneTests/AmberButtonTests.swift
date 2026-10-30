#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Primary buttons stay readable in both appearances: white on the deeper amber.
@MainActor
@Suite struct AmberButtonTests {
    /// WCAG relative luminance of an sRGB colour.
    static func luminance(_ c: NSColor) -> Double {
        let s = c.usingColorSpace(.sRGB)!
        func lin(_ v: CGFloat) -> Double { let v = Double(v); return v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 0.2126 * lin(s.redComponent) + 0.7152 * lin(s.greenComponent) + 0.0722 * lin(s.blueComponent)
    }

    static func contrast(_ a: NSColor, _ b: NSColor) -> Double {
        let la = luminance(a), lb = luminance(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    /// The colours as a view in `appearance` would draw them.
    static func resolved(_ c: NSColor, _ appearance: NSAppearance.Name) -> NSColor {
        var out = c
        NSAppearance(named: appearance)!.performAsCurrentDrawingAppearance { out = c.usingColorSpace(.sRGB)! }
        return out
    }

    @Test(arguments: [NSAppearance.Name.aqua, .darkAqua])
    func labelReadsOnTheFill(_ appearance: NSAppearance.Name) {
        let fill = Self.resolved(AmberProminentButtonStyle.fill, appearance)
        let label = Self.resolved(AmberProminentButtonStyle.label, appearance)
        let ratio = Self.contrast(fill, label)
        // The label is bold: Apple's minimum for bold text is 3:1 (4.5:1 is for regular text up to 17 pt).
        #expect(ratio >= 3.0, "\(appearance.rawValue): \(ratio)")
        // The same fill in dark as in light: never the lighter dark-mode amber, which sits near 2:1 under white.
        let darkAmber = Self.resolved(Palette.amber, .darkAqua)
        #expect(Self.contrast(darkAmber, label) < ratio)
        print("CONTRAST amber button \(appearance.rawValue): \(String(format: "%.2f", ratio)):1; old dark-mode fill \(String(format: "%.2f", Self.contrast(darkAmber, label))):1")
    }

    /// Every amber primary button uses the one style: the first-run flow's, the share ask's, the
    /// sheets'. The system's prominent style (and dark ink on its dark-mode amber) is the bug.
    @Test func everyPrimaryButtonUsesTheAmberStyle() throws {
        let views = try TestFiles.url("Views")
        let files = try FileManager.default.contentsOfDirectory(at: views, includingPropertiesForKeys: nil).filter { $0.pathExtension == "swift" }
        #expect(files.count > 10)
        var prominent: [String] = []
        for f in files {
            let src = try String(contentsOf: f, encoding: .utf8)
            if src.contains(".borderedProminent") { prominent.append(f.lastPathComponent) }
        }
        #expect(prominent.isEmpty, "use .amberProminent in \(prominent)")
        for name in ["OnboardingFlow.swift", "ShareAskView.swift", "ImportSheet.swift", "AppleNotesImport.swift", "NoteSourceSheet.swift", "SignInView.swift", "Encryption.swift"] {
            let src = try String(contentsOf: views.appendingPathComponent(name), encoding: .utf8)
            #expect(src.contains(".amberProminent"), "\(name)")
            // No hand-built amber buttons: no dark ink on amber.
            #expect(!src.contains("onAmber"), "\(name)")
        }
    }

    /// Busy swaps the label for a spinner without moving anything: the same size busy or not, as
    /// a capsule and as a form row (sign-in, the key screens).
    @Test func busyKeepsTheButtonsSize() {
        func size(_ v: some View) -> CGSize { NSHostingView(rootView: v).fittingSize }
        let capsule = { (busy: Bool) in Button("Add to my notes") {}.buttonStyle(.amberProminent).amberBusy(busy) }
        #expect(size(capsule(false)) == size(capsule(true)))
        let row = { (busy: Bool) in
            Button("Continue") {}.buttonStyle(.amberProminent(.form, wide: true))
                .amberBusy(busy).disabled(busy).frame(width: 300)
        }
        #expect(size(row(false)) == size(row(true)))
        #expect(size(row(true)).height == SignInView.Row.height)
    }

    /// The destructive primary (Start fresh) carries the same white label.
    @Test(arguments: [NSAppearance.Name.aqua, .darkAqua])
    func destructiveLabelReads(_ appearance: NSAppearance.Name) {
        let fill = Self.resolved(AmberProminentButtonStyle.destructiveFill, appearance)
        let ratio = Self.contrast(fill, Self.resolved(AmberProminentButtonStyle.label, appearance))
        #expect(ratio >= 4.5, "\(appearance.rawValue): \(ratio)")
        print("CONTRAST destructive button \(appearance.rawValue): \(String(format: "%.2f", ratio)):1")
    }

    @Test func fillIsTheSameInBothAppearances() {
        let light = Self.resolved(AmberProminentButtonStyle.fill, .aqua), dark = Self.resolved(AmberProminentButtonStyle.fill, .darkAqua)
        #expect(light == dark)
        #expect(light == Self.resolved(Palette.amber, .aqua), "the light-mode amber")
    }
    // MARK: The design system (docs/DESIGN.md)

    /// The app's code, as the test bundle carries it (project.yml): every Swift file under these folders.
    static func appSources() throws -> [(name: String, text: String)] {
        var out: [(String, String)] = []
        for folder in ["Views", "App", "Model", "Editor", "Sync", "Telemetry", "PaneShare"] {
            let root = try TestFiles.url(folder)
            let files = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL } ?? []
            for f in files where f.pathExtension == "swift" {
                out.append(("\(folder)/\(f.lastPathComponent)", try String(contentsOf: f, encoding: .utf8)))
            }
        }
        return out
    }

    /// Three kinds of button, everywhere, nothing else (DESIGN.md, Buttons): every ButtonStyle is
    /// in DesignSystem.swift, no view reaches for the system's bordered or glass prominent styles,
    /// and no call site gives a button its own height or corners.
    @Test func everyButtonStyleLivesInTheDesignSystem() throws {
        let sources = try Self.appSources()
        #expect(sources.count > 100)
        let conformance = try Regex(#"(struct|class|enum|extension)\s+\w+\s*:[^{\n]*\b(Primitive)?ButtonStyle\b"#)
        var styles: [String] = [], system: [String] = [], adHoc: [String] = []
        for (name, text) in sources {
            if name != "Views/DesignSystem.swift", text.contains(conformance) { styles.append(name) }
            for line in text.split(separator: "\n") where line.contains(".buttonStyle(") {
                if line.contains(".bordered") || line.contains(".glassProminent") || line.contains(".buttonStyle(.glass)") { system.append(name) }
                if line.contains("height:") || line.contains("cornerRadius:") { adHoc.append(name) }
            }
        }
        #expect(styles.isEmpty, "a ButtonStyle outside DesignSystem.swift: \(styles)")
        #expect(system.isEmpty, "use .amberProminent, .secondary or .quiet in \(system)")
        #expect(adHoc.isEmpty, "a button's size comes from ButtonSize, not the call site: \(adHoc)")
    }

    /// The sizes and radii in code are DESIGN.md's: heights 50, 40 and 28, radii from the scale.
    @Test func theSizesAreTheDesignRules() throws {
        let rules = try String(contentsOf: TestFiles.url("DESIGN.md"), encoding: .utf8)
        #expect(rules.contains("Heights: 50 (big, onboarding and website), 40 (default), 28 (compact, rows and toolbars)"))
        #expect(ButtonSize.big.designHeight == 50 && ButtonSize.regular.designHeight == 40 && ButtonSize.compact.designHeight == 28)
        for (name, value) in [("xs", Radius.xs), ("sm", Radius.sm), ("md", Radius.md), ("lg", Radius.lg), ("xl", Radius.xl)] {
            #expect(rules.contains("| \(name) | \(Int(value)) |"), "\(name) is \(value) in code")
        }
        // Buttons of 40 and 50 take md, a 28 pt button sm.
        #expect(ButtonSize.big.radius == Radius.md && ButtonSize.regular.radius == Radius.md && ButtonSize.compact.radius == Radius.sm)
        #expect(SignInView.Row.height == ButtonSize.form.height && SignInView.Row.radius == ButtonSize.form.radius)
    }

    /// Each kind draws at its size's height, whatever its title.
    @Test(arguments: ButtonSize.allCases)
    func everyKindIsItsSizesHeight(_ size: ButtonSize) {
        func height(_ v: some View) -> CGFloat { NSHostingView(rootView: v).fittingSize.height }
        #expect(height(Button("Import my notes") {}.buttonStyle(.amberProminent(size))) == size.height)
        #expect(height(Button("Not now") {}.buttonStyle(.secondary(size))) == size.height)
        #expect(height(Button("Skip") {}.buttonStyle(.quiet(size))) == size.height)
    }

    /// No borders on buttons: the kinds are fills. The only line any of them draws is the keyboard
    /// focus ring, and Sign in with Google is a secondary fill too.
    @Test func buttonsAreFillsNotStrokes() throws {
        let src = try String(contentsOf: TestFiles.url("Views").appendingPathComponent("DesignSystem.swift"), encoding: .utf8)
        let buttons = try #require(src.components(separatedBy: "// MARK: Primary").last?.components(separatedBy: "// MARK: Depth").first)
        #expect(!buttons.contains("strokeBorder"))
        #expect(src.components(separatedBy: ".stroke(").count - 1 == 2, "the focus ring and the busy spinner only")
    }

    /// Secondary and quiet labels read on their fills: ink on soft, muted on the page and the sheets.
    @Test(arguments: [NSAppearance.Name.aqua, .darkAqua])
    func secondaryAndQuietLabelsRead(_ appearance: NSAppearance.Name) {
        let ink = Self.resolved(Palette.ink, appearance)
        let soft = Self.resolved(Palette.soft, appearance)
        #expect(Self.contrast(ink, soft) >= 4.5, "ink on soft \(appearance.rawValue)")
        let muted = Self.resolved(Palette.muted, appearance)
        for ground in [Palette.page, Palette.sheetGround, Palette.card] {
            #expect(Self.contrast(muted, Self.resolved(ground, appearance)) >= 4.5, "muted on \(ground) \(appearance.rawValue)")
        }
        // A disabled secondary still says what it is.
        #expect(Self.contrast(Self.resolved(Palette.disabledButtonLabel, appearance), soft) >= 3)
    }

    /// E, D's reading page in plain white and black, is the Mac window that ships: without
    /// PINTO_LOOK the app draws it, with its calm list (DesignLook.shipped; release builds read
    /// nothing else).
    @Test func theShippedLookIsThePlainReadingPage() {
        #expect(DesignLook.shipped == .plain)
        let env = ProcessInfo.processInfo.environment
        if env["PINTO_LOOK"] == nil && UserDefaults.standard.string(forKey: "PintoLook") == nil {
            #expect(DesignLook.current == .plain)
            #expect(DesignLook.isCandidate && DesignLook.calmList && DesignLook.readingPage)
        }
        // Release builds have no switch at all: the look is the shipped one.
        let src = try? String(contentsOf: TestFiles.url("Editor").appendingPathComponent("Palette.swift"), encoding: .utf8)
        #expect(src?.contains("#else\n        return shipped\n        #endif") == true)
    }

    /// The Mac's shipped look is plain (Emil, 2026-10-29: no cream): the note and the list are white
    /// in the light and pure black in the dark, the sidebar's glass has no brown laid in it, and the
    /// cards, chips and hairlines are neutral grey. The selected note still reads on the white list.
    @Test(arguments: [NSAppearance.Name.aqua, .darkAqua])
    func theShippedMacLookIsPlainWhiteAndBlack(_ appearance: NSAppearance.Name) {
        let was = DesignLook.current
        DesignLook.current = DesignLook.shipped
        defer { DesignLook.current = was }
        func rgba(_ c: NSColor) -> [Int] {
            let s = Self.resolved(c, appearance)
            return [s.redComponent, s.greenComponent, s.blueComponent, s.alphaComponent].map { Int(($0 * 255).rounded()) }
        }
        let ground = appearance == .darkAqua ? [0, 0, 0, 255] : [255, 255, 255, 255]
        #expect(rgba(Palette.page) == ground, "page \(appearance.rawValue)")
        #expect(rgba(Palette.listGround) == ground, "list \(appearance.rawValue)")
        #expect(rgba(Palette.sidebarWarmth)[3] == 0, "sidebar warmth \(appearance.rawValue)")
        for (name, c) in [("card", Palette.card), ("soft", Palette.soft), ("line", Palette.line), ("row selection", Palette.rowSelection)] {
            let v = rgba(c)
            #expect(v[0] == v[1] && v[1] == v[2], "\(name) is neutral \(appearance.rawValue): \(v)")
        }
        let list = Self.resolved(Palette.listGround, appearance), selection = Self.resolved(Palette.rowSelection, appearance)
        #expect(Self.contrast(list, selection) >= 1.15, "the selected row reads on the list \(appearance.rawValue)")
        // The text is plain black and grey, like Apple Notes: no brown left in the ink, the muted
        // text (and the secondary icons drawn in it), the placeholder, the fields or the sheets.
        let text: [(String, NSColor)] = [("ink", Palette.ink), ("muted", Palette.muted), ("placeholder", Palette.placeholder),
                                         ("disabled label", Palette.disabledButtonLabel), ("disabled fill", Palette.disabledButton),
                                         ("sheet", Palette.sheetGround), ("field", Palette.field), ("field edge", Palette.fieldHairline),
                                         ("search", Palette.searchFill), ("shadow", Palette.shadow)]
        for (name, c) in text {
            let v = rgba(c)
            #expect(v[0] == v[1] && v[1] == v[2], "\(name) is neutral \(appearance.rawValue): \(v)")
        }
        // Near-black on white and near-white on black, and the muted text still reads where it sits.
        let ink = Self.resolved(Palette.ink, appearance), muted = Self.resolved(Palette.muted, appearance)
        #expect(Self.contrast(ink, list) >= 12, "ink on the page \(appearance.rawValue)")
        for (name, ground) in [("page", Palette.page), ("selected row", Palette.rowSelection), ("soft", Palette.soft),
                               ("card", Palette.card), ("sheet", Palette.sheetGround)] {
            #expect(Self.contrast(ink, Self.resolved(ground, appearance)) >= 7, "ink on \(name) \(appearance.rawValue)")
            #expect(Self.contrast(muted, Self.resolved(ground, appearance)) >= 4.5, "muted on \(name) \(appearance.rawValue)")
        }
        // Amber stays the accent.
        let amber = rgba(Palette.amber)
        #expect(amber[0] > amber[2] + 100, "amber \(appearance.rawValue): \(amber)")
        // The other looks keep their warmth, for comparison.
        DesignLook.current = .reading
        #expect(rgba(Palette.page) != ground && rgba(Palette.sidebarWarmth)[3] > 0)
        let warmInk = rgba(Palette.ink)
        #expect(warmInk[0] != warmInk[2], "the reading look's ink stays warm \(appearance.rawValue): \(warmInk)")
    }
}
#endif
