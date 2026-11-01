import SwiftUI

/// Settings › Security, three friendlier designs (2026-11-01, after Emil called the page "a wall of
/// text"). A study: off in the app (`securityStudy` is nil), drawn by SecurityStudySnapshots into
/// docs/Evidence/security-page. Its switches and buttons don't change the account yet: the picked
/// one gets wired to PrivacySecuritySection's actions when it's built for real.
///
/// - A, status first: a calm header, three one-line controls, the rest behind "How it works".
/// - B, cards: who can open your notes, losing a device, AI access, locked notes.
/// - C, who can open your notes: everything that can open them, drawn as tiles. Emil picked C.
///   Advanced protection is retired, so C has no switch. On iPhone the 3-wide grid was cramped;
///   `securityPhoneStudy` picks one of three phone versions (SecurityPhoneC).
enum SecurityStudy: String, CaseIterable, Identifiable {
    case a, b, c
    var id: String { rawValue }
}

/// C on iPhone (2026-11-01, Emil: "not great with that 3 wide grid"). The Mac keeps C's tiles.
/// - tiles: C as it was, three wide.
/// - list: A+C. A one-line status, then who can open your notes as a grouped list.
/// - groups: C with bigger tiles, two wide, in "Your devices" and "Also can open them".
/// - reasons: a picture of every mark, then one list grouped by why each can open them.
enum SecurityPhoneStudy: String, CaseIterable, Identifiable {
    case tiles, list, groups, reasons
    var id: String { rawValue }
}

extension EnvironmentValues {
    @Entry var securityStudy: SecurityStudy? = nil
    @Entry var securityPhoneStudy: SecurityPhoneStudy = .reasons
}

/// What the page says, read once from the account. Never "end-to-end" unless Advanced protection is on.
struct SecurityFacts {
    /// Only the person's devices hold the key: Pinto Notes keeps no copy.
    var advanced: Bool
    var recoverySaved: Bool
    var holders: [Holder]
    /// The AIs connected now, by name.
    var ais: [String]

    struct Holder: Identifiable {
        var id: String { name + when }
        let name: String
        let symbol: String
        let when: String
    }

    @MainActor init(crypto: AccountCrypto, devices: KeyDevices, ais: [String]) {
        advanced = !crypto.serverCopy
        recoverySaved = crypto.recoveryKeySaved
        var h = [Holder(name: PrivacyCopy.thisDevice, symbol: InstallID.platform == "macos" ? "laptopcomputer" : "iphone", when: "In use now")]
        for d in devices.others where !d.removing {
            h.append(Holder(name: d.name, symbol: d.symbol, when: Self.seen(d.seenAt)))
        }
        if crypto.backedUp || devices.others.contains(where: \.backedUp) {
            h.append(Holder(name: PrivacyCopy.keychainTitle, symbol: "icloud", when: "Your Apple Account"))
        }
        holders = h
        self.ais = ais
    }

    init(advanced: Bool, recoverySaved: Bool, holders: [Holder], ais: [String]) {
        self.advanced = advanced
        self.recoverySaved = recoverySaved
        self.holders = holders
        self.ais = ais
    }

    static func seen(_ date: Date) -> String {
        Calendar.current.isDateInToday(date) ? "Seen today" : "Seen \(date.formatted(.dateTime.month(.abbreviated).day()))"
    }

    /// One line under the status: "encrypted", or "end-to-end encrypted" only when it's true.
    var status: String { advanced ? SecurityStudyCopy.statusAdvanced : SecurityStudyCopy.status }
    var aiNames: String { ais.formatted(.list(type: .and)) }
}

/// The study's words. Each is one short line; the long ones live in "How it works".
enum SecurityStudyCopy {
    static let protectedTitle = "Your notes are protected"
    static let status = "Encrypted on your devices before they sync."
    static let statusAdvanced = "End-to-end encrypted. Only your devices can open them."
    static let advancedLine = "Only your devices hold the key."
    static let recoveryOptional = "Optional"
    static let recoveryNeeded = "Not saved"
    static let lockLine = "From a note\u{2019}s \u{2022}\u{2022}\u{2022} menu"
    static let aiLine = "Can read your notes while connected"
    static let noAI = "No AI connected"
    static let devicesTitle = "Devices with your key"
    static let howItWorks = "How it works"
    static let lockedTitle = "Locked notes"
    static let lockedLine = "AIs see the title, not what\u{2019}s inside."
    static let pintoLine = "Keeps a copy to help you back in"
    static let aiHolds = "Can read notes while connected"

    /// "How it works": every fact the page stands on, a title and at most two lines each.
    static func how(advanced: Bool) -> [(symbol: String, title: String, line: String)] {
        var out: [(String, String, String)] = [
            ("lock.fill", "Encrypted before they sync", "Your notes are encrypted on your devices, then synced."),
        ]
        if advanced {
            out.append(("checkmark.shield", "Advanced protection is on",
                        "Only your devices hold the key. We can\u{2019}t open your notes, and can\u{2019}t help you back in."))
        } else {
            out += [
                ("person.badge.key", "We keep a locked copy of your key",
                 "So signing in opens your notes on a new device, and we can help you back in."),
                ("building.columns", "That means we could open them",
                 "For example under a court order. So could someone who gets into your account."),
            ]
        }
        out += [
            ("sparkles", "Connected AIs", "Each AI you connect holds its own copy of your key. It can read your notes until you disconnect it."),
            ("key", "Recovery key", advanced ? "Opens your notes if you lose your devices. We can\u{2019}t help you then."
                                             : "Opens your notes without signing in. Optional while we keep a copy."),
            ("lock.doc", "Locked notes", "Each has its own password; lock one from its \u{2022}\u{2022}\u{2022} menu. A connected AI sees the title, not what\u{2019}s inside."),
        ]
        return out
    }
}

/// Security, as the study picked draws it, or the page as it is.
struct SecurityStudyGate<Current: View>: View {
    let facts: () -> SecurityFacts
    @ViewBuilder let current: Current
    @Environment(\.securityStudy) private var study

    var body: some View {
        if let study {
            SecurityStudyPage(study: study, facts: facts())
        } else {
            current
        }
    }
}

struct SecurityStudyPage: View {
    let study: SecurityStudy
    let facts: SecurityFacts
    var howOpen = false

    var body: some View {
        switch study {
        case .a: SecurityStatusFirst(facts: facts, howOpen: howOpen)
        case .b: SecurityCards(facts: facts)
        case .c:
            #if os(iOS)
            SecurityPhoneC(facts: facts)
            #else
            SecurityWhoCanOpen(facts: facts)
            #endif
        }
    }
}

// MARK: Pieces

private enum Look {
    #if os(macOS)
    static let radius: CGFloat = 10
    static let fill = Color.primary.opacity(0.045)
    static let ground = Color.clear
    static let inset: CGFloat = 20
    #else
    static let radius: CGFloat = 24
    static let fill = Color(.secondarySystemGroupedBackground)
    static let ground = Color(.systemGroupedBackground)
    static let inset: CGFloat = 16
    #endif
}

/// The Advanced protection switch, asked once more before it turns, with the court-order detail
/// in the question (KeyCopyWords), as the page has it today.
private struct AdvancedToggle<Label: View>: View {
    @Binding var on: Bool
    @ViewBuilder let label: Label
    @State private var asks = false
    @State private var turning = false

    var body: some View {
        Toggle(isOn: Binding(get: { on }, set: { turning = $0; asks = true })) { label.frame(maxWidth: .infinity, alignment: .leading) }
            .toggleStyle(.switch)
            #if os(macOS)
            .controlSize(.small)
            .tint(Color(Palette.switchOn))
            #endif
            .confirmationDialog(turning ? KeyCopyWords.turnOnTitle : KeyCopyWords.turnOffTitle, isPresented: $asks, titleVisibility: .visible) {
                Button(turning ? KeyCopyWords.turnOn : KeyCopyWords.turnOff, role: turning ? .destructive : nil) { on = turning }
            } message: {
                Text(turning ? KeyCopyWords.turnOnMessage : KeyCopyWords.turnOffMessage)
            }
            .accessibilityIdentifier("security.advanced")
    }
}

/// An AI's mark beside its name (a named AI shows its logo).
private struct AIMarks: View {
    let names: [String]
    var size: CGFloat = 14
    var body: some View {
        HStack(spacing: 4) {
            ForEach(names, id: \.self) { VersionAuthorMark(author: .ai($0), size: size) }
        }
    }
}

/// "How it works": one row per fact, a glyph, a title and a line or two.
struct SecurityHowItWorks: View {
    let advanced: Bool
    var body: some View {
        ForEach(SecurityStudyCopy.how(advanced: advanced), id: \.title) { item in
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Image(systemName: item.symbol)
                    .foregroundStyle(.secondary)
                    .frame(width: 20)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title)
                    Text(item.line).font(.callout).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 2)
            .accessibilityElement(children: .combine)
        }
    }
}

/// The "How it works" page B and C open: the same facts, in a sheet of their own.
private struct HowItWorksSheet: View {
    let advanced: Bool
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            Form { Section { SecurityHowItWorks(advanced: advanced) } }
                .formStyle(.grouped)
                .navigationTitle(SecurityStudyCopy.howItWorks)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        #if os(macOS)
        .frame(width: 460, height: 560)
        #endif
    }
}

private struct HowItWorksLink: View {
    let advanced: Bool
    @State private var open = false
    var body: some View {
        Button { open = true } label: {
            HStack(spacing: 6) {
                Image(systemName: "info.circle").accessibilityHidden(true)
                Text(SecurityStudyCopy.howItWorks)
                Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
            }
            .foregroundStyle(.tint)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $open) { HowItWorksSheet(advanced: advanced) }
        .accessibilityIdentifier("security.howItWorks")
    }
}

// MARK: A, status first

/// A calm header that says it's fine, the three things you might change, one line each, then the
/// devices and AIs, and every detail folded under "How it works". Like iPhone's Passwords page.
struct SecurityStatusFirst: View {
    let facts: SecurityFacts
    var howOpen = false
    @State private var advanced: Bool
    @State private var how: Bool

    init(facts: SecurityFacts, howOpen: Bool = false) {
        self.facts = facts
        self.howOpen = howOpen
        _advanced = State(initialValue: facts.advanced)
        _how = State(initialValue: howOpen)
    }

    private var shown: SecurityFacts { var f = facts; f.advanced = advanced; return f }

    var body: some View {
        Form {
            Section {
                VStack(spacing: 6) {
                    Image(systemName: advanced ? "lock.shield.fill" : "checkmark.shield.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.green)
                        .padding(.bottom, 2)
                        .accessibilityHidden(true)
                    Text(SecurityStudyCopy.protectedTitle).font(.title2.weight(.semibold))
                    Text(shown.status).font(.callout).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .accessibilityElement(children: .combine)
            }
            Section {
                AdvancedToggle(on: $advanced) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(KeyCopyWords.strictTitle)
                        Text(SecurityStudyCopy.advancedLine).font(.callout).foregroundStyle(.secondary)
                    }
                }
                HStack {
                    Text("Recovery key")
                    Spacer()
                    Text(facts.recoverySaved ? "Saved" : advanced ? SecurityStudyCopy.recoveryNeeded : SecurityStudyCopy.recoveryOptional)
                        .foregroundStyle(advanced && !facts.recoverySaved ? .orange : .secondary)
                    Button(facts.recoverySaved ? "Show\u{2026}" : "Save\u{2026}") {}
                }
                HStack {
                    Text("Locked notes")
                    Spacer()
                    Text(SecurityStudyCopy.lockLine).foregroundStyle(.secondary)
                }
            }
            Section {
                DisclosureGroup {
                    ForEach(facts.holders) { h in
                        HStack(spacing: 10) {
                            Image(systemName: h.symbol).foregroundStyle(.secondary).frame(width: 22)
                            Text(h.name)
                            Spacer()
                            Text(h.when).foregroundStyle(.secondary)
                        }
                    }
                } label: {
                    HStack {
                        Text(SecurityStudyCopy.devicesTitle)
                        Spacer()
                        Text("\(facts.holders.count)").foregroundStyle(.secondary)
                    }
                }
                HStack(spacing: 8) {
                    Text("AI access")
                    Spacer()
                    if facts.ais.isEmpty {
                        Text(SecurityStudyCopy.noAI).foregroundStyle(.secondary)
                    } else {
                        AIMarks(names: facts.ais)
                        Text("While connected").foregroundStyle(.secondary)
                    }
                }
            }
            Section {
                DisclosureGroup(SecurityStudyCopy.howItWorks, isExpanded: $how) {
                    SecurityHowItWorks(advanced: advanced)
                }
                .accessibilityIdentifier("security.howItWorks")
            }
        }
        .formStyle(.grouped)
        #if os(macOS)
        .scrollContentBackground(.hidden)
        #endif
    }
}

// MARK: B, cards

/// Four small cards, each a question people ask, with its answer in a line and its one control.
struct SecurityCards: View {
    let facts: SecurityFacts
    @State private var advanced: Bool

    init(facts: SecurityFacts) {
        self.facts = facts
        _advanced = State(initialValue: facts.advanced)
    }

    #if os(macOS)
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    #else
    private let columns = [GridItem(.flexible())]
    #endif

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Label {
                    Text(advanced ? SecurityStudyCopy.statusAdvanced : SecurityStudyCopy.status)
                } icon: {
                    Image(systemName: "checkmark.shield.fill").foregroundStyle(.green)
                }
                .font(.callout)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

                LazyVGrid(columns: columns, alignment: .leading, spacing: 12) {
                    card("Who can open your notes", "person.2.fill",
                         advanced ? "Only you, on your devices." : "You, and Pinto Notes to help you back in.") {
                        AdvancedToggle(on: $advanced) { Text(KeyCopyWords.strictTitle) }
                    }
                    card("If you lose a device", "arrow.triangle.2.circlepath",
                         advanced ? "Another device or your recovery key opens them." : "Sign in on a new one. Your notes open.") {
                        HStack {
                            Button(facts.recoverySaved ? "Show recovery key\u{2026}" : "Save a recovery key\u{2026}") {}
                                .buttonStyle(.secondary(.compact))
                            Spacer(minLength: 4)
                            if !facts.recoverySaved {
                                Text(advanced ? SecurityStudyCopy.recoveryNeeded : SecurityStudyCopy.recoveryOptional)
                                    .font(.callout).foregroundStyle(advanced ? .orange : .secondary)
                            }
                        }
                    }
                    card("AI access", "sparkles",
                         facts.ais.isEmpty ? SecurityStudyCopy.noAI : "\(facts.aiNames) can read notes while connected.") {
                        HStack {
                            AIMarks(names: facts.ais, size: 16)
                            Spacer()
                            Button("Manage\u{2026}") {}.buttonStyle(.secondary(.compact))
                        }
                    }
                    card("Locked notes", "lock.fill", "A password per note. No AI can read it.") {
                        Text("Lock one " + SecurityStudyCopy.lockLine.lowercased()).font(.callout).foregroundStyle(.secondary)
                            .frame(minHeight: 26)
                    }
                }

                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 14) {
                        Text("Your key is on").foregroundStyle(.secondary)
                        ForEach(facts.holders) { h in
                            Label(h.name, systemImage: h.symbol).labelStyle(.titleAndIcon).lineLimit(1).fixedSize()
                        }
                        Spacer(minLength: 0)
                    }
                    Text("Your key is on \(facts.holders.map(\.name).formatted(.list(type: .and))).")
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .font(.callout)
                .padding(.horizontal, 4)
                .accessibilityElement(children: .combine)

                HowItWorksLink(advanced: advanced).font(.callout).padding(.horizontal, 4)
            }
            .padding(.horizontal, Look.inset)
            .padding(.top, 12)
            .padding(.bottom, 24)
        }
        .background(Look.ground)
    }

    private func card(_ title: String, _ symbol: String, _ line: String, @ViewBuilder control: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: symbol)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 28, height: 28)
                    .background(Color(PColor.paneAccent), in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                    .accessibilityHidden(true)
                Text(title).font(.headline)
            }
            Text(line).font(.callout).foregroundStyle(.secondary)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            control()
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 140, alignment: .topLeading)
        .background(Look.fill, in: RoundedRectangle(cornerRadius: Look.radius, style: .continuous))
        .accessibilityElement(children: .contain)
    }
}

// MARK: C, who can open your notes

/// The page answers the one question people bring to it, by picture: everything that can open
/// your notes, as tiles. Your devices, Pinto Notes (while it keeps a copy), the AIs you connected,
/// and a recovery key if you save one. Advanced protection takes Pinto Notes off the picture, so
/// the switch shows what it does instead of a paragraph saying it.
struct SecurityWhoCanOpen: View {
    let facts: SecurityFacts
    @State private var advanced: Bool

    init(facts: SecurityFacts) {
        self.facts = facts
        _advanced = State(initialValue: facts.advanced)
    }

    #if os(macOS)
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 4)
    #else
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 3)
    #endif

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Who can open your notes").font(.title3.weight(.semibold))
                    Text(advanced ? SecurityStudyCopy.statusAdvanced : SecurityStudyCopy.status)
                        .font(.callout).foregroundStyle(.secondary)
                }
                .padding(.horizontal, 4)

                LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
                    ForEach(facts.holders) { h in
                        tile(h.name, h.when) { Image(systemName: h.symbol).font(.system(size: 20)).foregroundStyle(Color.ink) }
                    }
                    if !advanced {
                        tile("Pinto Notes", "Helps you back in") { AppMark(size: 28) }
                            .transition(.scale.combined(with: .opacity))
                    }
                    ForEach(facts.ais, id: \.self) { ai in
                        tile(ai, "While connected") { VersionAuthorMark(author: .ai(ai), size: 24) }
                    }
                    recoveryTile
                }
                .animation(.snappy(duration: 0.25), value: advanced)

                HStack(spacing: 10) {
                    Image(systemName: "lock.fill").foregroundStyle(.secondary).frame(width: 20).accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(SecurityStudyCopy.lockedTitle)
                        Text(SecurityStudyCopy.lockedLine + " Lock one " + SecurityStudyCopy.lockLine.lowercased() + ".")
                            .font(.callout).foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 14)
                .background(Look.fill, in: RoundedRectangle(cornerRadius: Look.radius, style: .continuous))
                .accessibilityElement(children: .combine)

                HowItWorksLink(advanced: advanced).font(.callout).padding(.horizontal, 4)
            }
            .padding(.horizontal, Look.inset)
            .padding(.top, 12)
            .padding(.bottom, 24)
        }
        .background(Look.ground)
    }

    /// Saved: a tile like the rest. Not saved: an outline to fill, which saves one.
    @ViewBuilder private var recoveryTile: some View {
        if facts.recoverySaved {
            tile("Recovery key", "Saved") { Image(systemName: "key.fill").font(.system(size: 20)).foregroundStyle(Color.ink) }
        } else {
            let shape = RoundedRectangle(cornerRadius: Look.radius, style: .continuous)
            Button {} label: {
                VStack(spacing: 6) {
                    Image(systemName: "plus").font(.system(size: 18, weight: .medium)).frame(height: 30)
                    Text("Recovery key").font(.callout.weight(.medium)).lineLimit(1)
                    Text(advanced ? "Save one" : "Optional").font(.caption).foregroundStyle(advanced ? .orange : .secondary).lineLimit(1)
                }
                .foregroundStyle(.tint)
                .frame(maxWidth: .infinity, minHeight: 96)
                .overlay(shape.strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [4, 3])).foregroundStyle(Color.primary.opacity(0.25)))
                .contentShape(shape)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Save a recovery key")
        }
    }

    private func tile(_ name: String, _ caption: String, @ViewBuilder mark: () -> some View) -> some View {
        VStack(spacing: 6) {
            mark().frame(height: 30)
            Text(name).font(.callout.weight(.medium)).foregroundStyle(Color.ink).lineLimit(1).minimumScaleFactor(0.85)
            Text(caption).font(.caption).foregroundStyle(.secondary).lineLimit(1).minimumScaleFactor(0.85)
        }
        .padding(.horizontal, 6)
        .frame(maxWidth: .infinity, minHeight: 96)
        .background(Look.fill, in: RoundedRectangle(cornerRadius: Look.radius, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

// MARK: C on iPhone

#if os(iOS)
/// One thing that can open your notes: its mark, its name and a short grey line.
private struct Opener: Identifiable {
    enum Mark { case symbol(String), app, ai(String) }
    var id: String { name + detail }
    let mark: Mark
    let name: String
    let detail: String

    static func devices(_ f: SecurityFacts) -> [Opener] {
        f.holders.filter { $0.name != PrivacyCopy.keychainTitle }.map { Opener(mark: .symbol($0.symbol), name: $0.name, detail: $0.when) }
    }
    /// What keeps a copy so you can get back in: iCloud Keychain (if it holds one) and Pinto Notes.
    static func backIn(_ f: SecurityFacts) -> [Opener] {
        f.holders.filter { $0.name == PrivacyCopy.keychainTitle }.map { Opener(mark: .symbol($0.symbol), name: $0.name, detail: $0.when) }
            + [Opener(mark: .app, name: "Pinto Notes", detail: SecurityStudyCopy.pintoLine)]
    }
    static func ais(_ f: SecurityFacts) -> [Opener] {
        f.ais.map { Opener(mark: .ai($0), name: $0, detail: SecurityStudyCopy.aiHolds) }
    }
    static func all(_ f: SecurityFacts) -> [Opener] { devices(f) + backIn(f) + ais(f) }
}

private struct OpenerMark: View {
    let mark: Opener.Mark
    var size: CGFloat = 22
    /// Grows with the text, like Settings' row icons.
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1
    var scales = true
    var body: some View {
        let size = size * (scales ? min(scale, 1.6) : 1)
        Group {
            switch mark {
            case .symbol(let name): Image(systemName: name).font(.system(size: size)).foregroundStyle(Color.ink)
            case .app: AppMark(size: size * 1.2)
            case .ai(let name): VersionAuthorMark(author: .ai(name), size: size)
            }
        }
        .frame(width: size * 1.4, height: size * 1.4)
        .accessibilityHidden(true)
    }
}

/// A list row like Settings › Apple Account's devices: mark, name, a grey line under it.
private struct OpenerRow: View {
    let opener: Opener
    var body: some View {
        HStack(spacing: 12) {
            OpenerMark(mark: opener.mark)
            VStack(alignment: .leading, spacing: 1) {
                Text(opener.name).foregroundStyle(Color.ink)
                Text(opener.detail).font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}

/// "Save a recovery key": an add row, in the tint, with the plus where a mark would be.
private struct RecoveryAddRow: View {
    let saved: Bool
    var body: some View {
        if saved {
            OpenerRow(opener: Opener(mark: .symbol("key.fill"), name: "Recovery key", detail: "Saved"))
        } else {
            Button {} label: {
                HStack(spacing: 12) {
                    Image(systemName: "plus.circle.fill").font(.title2).frame(minWidth: 31, minHeight: 31)
                        .accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Save a recovery key")
                        Text("Optional. For when you can\u{2019}t sign in.").font(.subheadline).foregroundStyle(Color.secondary)
                    }
                }
                .padding(.vertical, 2)
                .contentShape(.rect)
            }
            .accessibilityIdentifier("security.recovery")
        }
    }
}

private struct LockedNotesRow: View {
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "lock.fill").font(.title3).foregroundStyle(.secondary).frame(minWidth: 31, minHeight: 31)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 1) {
                Text(SecurityStudyCopy.lockedTitle)
                Text(SecurityStudyCopy.lockedLine + " Lock one " + SecurityStudyCopy.lockLine.lowercased() + ".")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}

/// "How it works" as a list row that opens the sheet.
private struct HowItWorksRow: View {
    let advanced: Bool
    @State private var open = false
    var body: some View {
        Button { open = true } label: {
            HStack(spacing: 12) {
                Image(systemName: "info.circle").font(.title3).frame(minWidth: 31, minHeight: 31).accessibilityHidden(true)
                Text(SecurityStudyCopy.howItWorks)
                Spacer()
                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
            }
            .contentShape(.rect)
        }
        .sheet(isPresented: $open) { HowItWorksSheet(advanced: advanced) }
        .accessibilityIdentifier("security.howItWorks")
    }
}

/// C on iPhone, as `securityPhoneStudy` picks.
struct SecurityPhoneC: View {
    let facts: SecurityFacts
    @Environment(\.securityPhoneStudy) private var study

    var body: some View {
        switch study {
        case .tiles: SecurityWhoCanOpen(facts: facts)
        case .list: list
        case .groups: SecurityPhoneTiles(facts: facts)
        case .reasons: reasons
        }
    }

    /// 1, A+C: the status in one line, then everything that can open your notes as one list.
    private var list: some View {
        Form {
            Section {
                HStack(spacing: 12) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color(PColor.paneAccent), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .accessibilityHidden(true)
                    Text(SecurityStudyCopy.status).font(.headline)
                }
                .padding(.vertical, 4)
            }
            Section("Who can open your notes") {
                ForEach(Opener.all(facts)) { OpenerRow(opener: $0) }
                RecoveryAddRow(saved: facts.recoverySaved)
            }
            Section {
                LockedNotesRow()
                HowItWorksRow(advanced: facts.advanced)
            }
        }
        .formStyle(.grouped)
    }

    /// 3, by reason: every mark in a row as the picture, then the same list grouped by why each
    /// one can open your notes, with the honest line under each group.
    private var reasons: some View {
        Form {
            Section {
                VStack(spacing: 10) {
                    MarkStack(openers: Opener.all(facts))
                    VStack(spacing: 2) {
                        Text("Who can open your notes").font(.title3.weight(.semibold))
                        Text(SecurityStudyCopy.status).font(.subheadline).foregroundStyle(.secondary)
                    }
                    .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            Section {
                ForEach(Opener.devices(facts)) { OpenerRow(opener: $0) }
            } header: {
                Text("Your devices")
            }
            Section {
                ForEach(Opener.backIn(facts)) { OpenerRow(opener: $0) }
                RecoveryAddRow(saved: facts.recoverySaved)
            } header: {
                Text("To help you back in")
            } footer: {
                Text("Pinto Notes keeps a copy of your key so signing in opens your notes on a new device. That means Pinto Notes can open them too.")
            }
            if !facts.ais.isEmpty {
                Section {
                    ForEach(Opener.ais(facts)) { OpenerRow(opener: $0) }
                } header: {
                    Text("While connected")
                } footer: {
                    Text("Each AI holds its own copy of your key. Disconnect one to take it off this list.")
                }
            }
            Section {
                LockedNotesRow()
                HowItWorksRow(advanced: facts.advanced)
            }
        }
        .formStyle(.grouped)
    }
}

/// Every opener's mark, overlapping, in a small circle each: the picture C drew with tiles.
private struct MarkStack: View {
    let openers: [Opener]
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        HStack(spacing: -6) {
            ForEach(openers) { o in
                OpenerMark(mark: o.mark, size: 20, scales: false)
                    .frame(width: 44, height: 44)
                    .background(Color(.tertiarySystemGroupedBackground), in: Circle())
                    .overlay(Circle().strokeBorder(Color(.secondarySystemGroupedBackground), lineWidth: 2.5))
            }
        }
        .accessibilityHidden(true)
    }
}

/// 2, C with bigger tiles: two wide (one wide at the largest text sizes), in two groups.
struct SecurityPhoneTiles: View {
    let facts: SecurityFacts
    @Environment(\.dynamicTypeSize) private var type

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 12), count: type.isAccessibilitySize ? 1 : 2)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Who can open your notes").font(.title3.weight(.semibold))
                    Text(SecurityStudyCopy.status).font(.subheadline).foregroundStyle(.secondary)
                }
                .padding(.horizontal, 4)
                .padding(.bottom, 8)

                group("Your devices", Opener.devices(facts))
                group("Also can open them", Opener.backIn(facts) + Opener.ais(facts))
                    .padding(.top, 10)

                VStack(spacing: 0) {
                    RecoveryAddRow(saved: facts.recoverySaved).buttonStyle(.plain).foregroundStyle(.tint)
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .padding(.vertical, 8)
                    Divider().padding(.leading, 43)
                    LockedNotesRow()
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .padding(.vertical, 8)
                    Divider().padding(.leading, 43)
                    HowItWorksRow(advanced: facts.advanced).buttonStyle(.plain).foregroundStyle(.tint)
                        .frame(minHeight: 44)
                        .padding(.vertical, 4)
                }
                .padding(.horizontal, 16)
                .background(Look.fill, in: RoundedRectangle(cornerRadius: Look.radius, style: .continuous))
                .padding(.top, 20)
            }
            .padding(.horizontal, Look.inset)
            .padding(.top, 12)
            .padding(.bottom, 24)
        }
        .background(Look.ground)
    }

    private func group(_ title: String, _ openers: [Opener]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary).padding(.horizontal, 4)
            LazyVGrid(columns: columns, alignment: .leading, spacing: 12) {
                ForEach(openers) { o in
                    VStack(alignment: .leading, spacing: 8) {
                        OpenerMark(mark: o.mark, size: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(o.name).font(.headline).foregroundStyle(Color.ink).lineLimit(2)
                            Text(o.detail).font(.subheadline).foregroundStyle(.secondary).lineLimit(3)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, minHeight: 118, maxHeight: .infinity, alignment: .topLeading)
                    .background(Look.fill, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }
}
#endif
