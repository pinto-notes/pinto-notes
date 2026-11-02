#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Primary buttons stay readable in both appearances: white on the accent (Palette.accent; amber in
/// Pinto Notes, your own with scripts/set-accent.sh). The file and test names keep "Amber" because
/// the button style is `.amberProminent` and CI's test lists name these tests.
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
        // The same fill in dark as in light: never the lighter dark-mode accent, which sits near 2:1 under white.
        let darkAmber = Self.resolved(Palette.amber, .darkAqua)
        #expect(Self.contrast(darkAmber, label) < ratio)
        print("CONTRAST accent button \(appearance.rawValue): \(String(format: "%.2f", ratio)):1; old dark-mode fill \(String(format: "%.2f", Self.contrast(darkAmber, label))):1")
    }

    /// Every accent-coloured primary button uses the one style: the first-run flow's, the share ask's,
    /// the sheets'. The system's prominent style (and dark ink on its dark-mode accent) is the bug.
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
            // No hand-built accent buttons: no dark ink on the accent.
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

    /// The destructive primary (Start fresh) carries a white label in both appearances.
    @Test(arguments: [NSAppearance.Name.aqua, .darkAqua])
    func destructiveLabelReads(_ appearance: NSAppearance.Name) {
        let fill = Self.resolved(AmberProminentButtonStyle.destructiveFill, appearance)
        let ratio = Self.contrast(fill, Self.resolved(AmberProminentButtonStyle.destructiveLabel, appearance))
        #expect(ratio >= 4.5, "\(appearance.rawValue): \(ratio)")
        print("CONTRAST destructive button \(appearance.rawValue): \(String(format: "%.2f", ratio)):1")
    }

    /// The light keeps the accent primary with its white label; the dark is pure black, so its
    /// primary is white with a black label, never the accent (Emil, 2026-10-28).
    @Test func thePrimaryIsAmberInTheLightAndWhiteInTheDark() {
        func rgb(_ c: NSColor, _ a: NSAppearance.Name) -> [Int] {
            let s = Self.resolved(c, a)
            return [s.redComponent, s.greenComponent, s.blueComponent, s.alphaComponent].map { Int(($0 * 255).rounded()) }
        }
        #expect(rgb(AmberProminentButtonStyle.fill, .aqua) == rgb(Palette.amber, .aqua), "the light-mode amber")
        #expect(rgb(AmberProminentButtonStyle.label, .aqua) == [255, 255, 255, 255])
        #expect(rgb(AmberProminentButtonStyle.fill, .darkAqua) == [255, 255, 255, 255], "white in the dark")
        #expect(rgb(AmberProminentButtonStyle.label, .darkAqua) == [0, 0, 0, 255], "black text in the dark")
        // In the dark the accent primary is the ink button (`inkProminent`), not a second white.
        #expect(rgb(AmberProminentButtonStyle.fill, .darkAqua) == rgb(Palette.inkButton, .darkAqua))
        #expect(rgb(AmberProminentButtonStyle.label, .darkAqua) == rgb(Palette.inkButtonLabel, .darkAqua))
        // Hover, pressed and selected fills in the dark are neutral: no accent left in them.
        for (name, c) in [("primary hover", Palette.primaryButtonHover), ("hover", Palette.buttonHover), ("pressed", Palette.buttonPressed),
                          ("quiet pressed", Palette.quietPressed), ("choice hover", Palette.choiceHover), ("selected", Palette.amberSoft)] {
            let v = rgb(c, .darkAqua)
            #expect(v[0] == v[1] && v[1] == v[2], "\(name) is neutral in the dark: \(v)")
        }
        // A lit choice still reads against the card it replaces.
        #expect(Self.contrast(Self.resolved(Palette.amberSoft, .darkAqua), Self.resolved(Palette.card, .darkAqua)) >= 1.1)
        // The light keeps its accent: the hovers lean toward it and the soft fill is its tint.
        let lightAccent = rgb(Palette.amber, .aqua)
        #expect(rgb(Palette.buttonHover, .aqua)[0...2] == lightAccent[0...2])
        #expect(rgb(Palette.amberSoft, .aqua) == rgb(Palette.rgb(Palette.accent.soft), .aqua))
        #expect(zip(rgb(Palette.amberSoft, .aqua), lightAccent).allSatisfy { $0 >= $1 }, "the soft fill is a light tint of the accent")
        // The ticks, links and the icon keep the accent in the dark: a colour, not a grey.
        let tick = rgb(Palette.amberButton, .darkAqua), accent = rgb(Palette.amber, .darkAqua)
        #expect(tick == rgb(Palette.rgb(Palette.accent.light), .aqua) && accent == rgb(Palette.rgb(Palette.accent.dark), .aqua))
        #expect(Self.chroma(tick) > 60 && Self.chroma(accent) > 60, "tick \(tick), accent \(accent)")
    }

    /// How far a colour is from grey: its brightest channel less its dimmest.
    static func chroma(_ v: [Int]) -> Int { v[0...2].max()! - v[0...2].min()! }

    /// The accent's shades still read where they sit, for amber and for an accent worked out
    /// from two colours (docs/MAKE-IT-YOURS.md's green), so changing `Palette.accent` is safe.
    @Test(arguments: [("amber", Palette.Accent.amber), ("green", Palette.Accent(light: 0x1E7A4C, dark: 0x5CC48A))])
    func theAccentsShadesRead(_ name: String, _ accent: Palette.Accent) {
        let white = Palette.rgb(0xFFFFFF), black = Palette.rgb(0x000000)
        #expect(Self.contrast(white, Palette.rgb(accent.light)) >= 3, "\(name): a white label on the primary button")
        #expect(Self.contrast(Palette.rgb(accent.ink.0), white) >= 4.5, "\(name): accent text on white")
        #expect(Self.contrast(Palette.rgb(accent.ink.1), black) >= 4.5, "\(name): accent text on black")
        #expect(Self.contrast(Palette.rgb(accent.dark), black) >= 4.5, "\(name): the accent on black")
        #expect(Self.contrast(Palette.rgb(accent.soft), white) < 1.25, "\(name): the soft fill stays soft")
        #expect(Self.contrast(Palette.rgb(accent.ink.0), Palette.rgb(accent.soft)) >= 4.5, "\(name): accent text on its soft fill")
    }

    /// The system's controls take the AccentColor asset; it holds the same two colours as `Palette.accent`.
    @Test func theAccentColorAssetMatchesThePalette() throws {
        // AccentColor, or the build's own AccentColorLocal (scripts/set-accent.sh), as the build names it.
        let name = Bundle.main.object(forInfoDictionaryKey: "NSAccentColorName") as? String ?? "AccentColor"
        let asset = try #require(NSColor(named: name))
        for (appearance, hex) in [(NSAppearance.Name.aqua, Palette.accent.light), (.darkAqua, Palette.accent.dark)] {
            let a = Self.resolved(asset, appearance), p = Self.resolved(Palette.rgb(hex), appearance)
            #expect(abs(a.redComponent - p.redComponent) < 0.01 && abs(a.greenComponent - p.greenComponent) < 0.01
                    && abs(a.blueComponent - p.blueComponent) < 0.01,
                    "AccentColor.colorset in \(appearance.rawValue) should be #\(String(format: "%06X", hex))")
        }
    }

    /// No button style reaches for the accent directly: its hovers and presses go through the
    /// Palette, which turns them neutral in the dark.
    @Test func noButtonStyleHardCodesAmber() throws {
        let src = try String(contentsOf: TestFiles.url("Views").appendingPathComponent("DesignSystem.swift"), encoding: .utf8)
        #expect(!src.contains("Color(Palette.amber).opacity"), "use Palette.buttonHover and friends")
        #expect(!src.contains("static let fill = Palette.amberButton"))
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
    /// A tile shows it can be clicked: a wash under the pointer, a deeper one pressed, none at rest
    /// (Emil, 2 November 2026, the setup card's import tiles had no hover).
    @Test func aTileWashesUnderThePointer() throws {
        #expect(TileButtonStyle.wash(hovering: false, pressed: false) == 0)
        #expect(TileButtonStyle.wash(hovering: true, pressed: false) > 0)
        #expect(TileButtonStyle.wash(hovering: true, pressed: true) > TileButtonStyle.wash(hovering: true, pressed: false))
        let setup = try #require(try Self.appSources().first { $0.name == "Views/SetupCards.swift" }).text
        let tile = try #require(setup.range(of: "private struct SetupTile"))
        let body = setup[tile.lowerBound...].prefix(1500)
        #expect(body.contains(".buttonStyle(.tile(") && !body.contains(".buttonStyle(.plain)"), "the import tiles use the tile style")
    }

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

    /// Buttons that draw no hover of their own and still look different under the pointer, or never
    /// show on the Mac, though the scan below can't tell. Keyed "file Type.member"; one reason each.
    static let hoverAllowed: [String: String] = [
        "Views/ShareNotePopover.swift ShareNotePopover.copyRows": "the label is rowLabel, which has .hoverHighlight",
        "Views/ShareNotePopover.swift ShareNotePopover.row": "the label is rowLabel, which has .hoverHighlight",
        "Views/SidebarCards.swift SidebarCardShell.body": "the label it wraps has .hoverOverlay, set a few lines up",
        "Views/ConnectChoices.swift Accessory.pressable": "ConnectChoices' pressable: both callers' labels have .choiceCard",
        // Leave the close × alone (lead, 2 November 2026): one shared solid close style replaces them all.
        "Views/SidebarCards.swift MacCard.body": "close ×: shared .closeCircle style (lead); and iPhone only",
        "Views/SettingsCard.swift SettingsCard.header": "close ×: shared .closeCircle style (lead)",
        "Views/MakeAnApp.swift MakeAppSheet.close": "close ×: shared .closeCircle style (lead)",
        "Views/ImportGuide.swift Action.topBar": "close ×: shared .closeCircle style (lead)",
        "Views/ImportGuide.swift ImportNoticePage.page": "close ×: shared .closeCircle style (lead)",
        "Views/ConnectWebGuide.swift ConnectWebGuideSheet.topBar": "close ×: shared .closeCircle style (lead)",
    ]

    /// Every clickable thing on the Mac looks different under the pointer (Emil, 2 November 2026:
    /// "ALL clickable things need hover states"). The plain style, PressScale and CardPress draw no
    /// hover, so each use needs a hover look in its own expression (in the label or on the button:
    /// .hoverHighlight, .hoverRow, .hoverOverlay, .choiceCard, HoverTracking, .onHover), or sits in
    /// iPhone-only code, or is on `hoverAllowed` with its reason. Otherwise pick .tile(radius:),
    /// .quietIcon, .hoverText or .hoverLink.
    @Test func everyMacButtonShowsItsHover() throws {
        let style = try Regex(#"\.buttonStyle\((\.plain|PressScale\(\)|CardPress\(\))\)"#)
        let member = try Regex(#"^\s*(?:@\w+\s+|private\s+|fileprivate\s+|static\s+|override\s+)*(?:func|var)\s+(\w+)"#)
        let type = try Regex(#"^\s*(?:@\w+\s+|private\s+|fileprivate\s+|public\s+|final\s+)*(?:struct|class|enum|extension)\s+(\w+)"#)
        let cues = [".hoverHighlight(", ".hoverRow(", ".hoverOverlay(", ".choiceCard(", "HoverTracking(", ".onHover", "HoverRowReader"]
        func indent(_ s: Substring) -> Int { s.prefix { $0 == " " }.count }
        func trimmed(_ s: Substring) -> Substring { s.drop { $0 == " " } }
        func continues(_ s: Substring) -> Bool { let t = trimmed(s); return t.isEmpty || t.hasPrefix(".") || t.hasPrefix("#") || t.hasPrefix("//") }
        var seen = 0, used: Set<String> = [], missing: [String] = []
        for (name, text) in try Self.appSources() where name != "Views/DesignSystem.swift" {
            let lines = text.split(separator: "\n", omittingEmptySubsequences: false)
            // Which side of each #if the line is on: "ios", "mac" or "other".
            var stack: [String] = []
            for (i, line) in lines.enumerated() {
                let t = trimmed(line)
                if t.hasPrefix("#if") { stack.append(t.contains("os(iOS)") && !t.contains("macOS") ? "ios" : t.contains("os(macOS)") ? "mac" : "other"); continue }
                if t.hasPrefix("#elseif") { stack[stack.count - 1] = "other"; continue }
                if t.hasPrefix("#else") { stack[stack.count - 1] = ["ios": "mac", "mac": "ios"][stack.last!] ?? "other"; continue }
                if t.hasPrefix("#endif") { stack.removeLast(); continue }
                guard !t.hasPrefix("//"), line.contains(style) else { continue }
                seen += 1
                if stack.contains("ios") { continue }
                // The expression: back to the line that starts it, on through its modifiers.
                let n = indent(line)
                var start = i
                if t.hasPrefix(".") {
                    start = i - 1
                    while start > 0, indent(lines[start]) > n || (indent(lines[start]) == n && (continues(lines[start]) || trimmed(lines[start]).hasPrefix("}"))) { start -= 1 }
                }
                var end = i
                while end + 1 < lines.count, indent(lines[end + 1]) > n || (indent(lines[end + 1]) == n && continues(lines[end + 1])) { end += 1 }
                let expression = lines[start...end].joined(separator: "\n")
                if cues.contains(where: { expression.contains($0) }) { continue }
                let owner = lines[...i].last { $0.contains(member) }.flatMap { try? member.firstMatch(in: String($0))?.output[1].substring } ?? "?"
                let kind = lines[...i].last { $0.contains(type) }.flatMap { try? type.firstMatch(in: String($0))?.output[1].substring } ?? "?"
                let key = "\(name) \(kind).\(owner)"
                if Self.hoverAllowed[key] != nil { used.insert(key); continue }
                missing.append("\(key) line \(i + 1)")
            }
        }
        #expect(seen > 60, "the scan found \(seen) plain buttons")
        #expect(missing.isEmpty, "no hover on the Mac; use .tile(radius:), .quietIcon, .hoverText, .hoverLink or a hover row:\n\(missing.joined(separator: "\n"))")
        #expect(used == Set(Self.hoverAllowed.keys), "allowed but no longer needed: \(Set(Self.hoverAllowed.keys).subtracting(used).sorted())")
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
    /// in the light and pure black in the dark, the sidebar's glass has no brown laid in it (a neutral grey in the light), and the
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
        // The list is the page's white; in the dark a neutral step off black, so list and note read apart.
        let listGround = appearance == .darkAqua ? [13, 13, 13, 255] : [255, 255, 255, 255]
        #expect(rgba(Palette.listGround) == listGround, "list \(appearance.rawValue)")
        // The sidebar: 5% neutral black in light mode, Notes' grey (Emil, 10-31); none in the dark.
        let warmth = rgba(Palette.sidebarWarmth)
        if appearance == .darkAqua {
            #expect(warmth[3] == 0, "sidebar warmth \(appearance.rawValue)")
        } else {
            #expect(warmth[0] == 0 && warmth[1] == 0 && warmth[2] == 0 && (12...14).contains(warmth[3]), "sidebar grey: \(warmth)")
        }
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
        // The accent stays a colour in every look.
        let amber = rgba(Palette.amber)
        #expect(Self.chroma(amber) > 60, "accent \(appearance.rawValue): \(amber)")
        // The other looks keep their warmth, for comparison.
        DesignLook.current = .reading
        #expect(rgba(Palette.page) != ground && rgba(Palette.sidebarWarmth)[3] > 0)
        let warmInk = rgba(Palette.ink)
        #expect(warmInk[0] != warmInk[2], "the reading look's ink stays warm \(appearance.rawValue): \(warmInk)")
    }
}
#endif
