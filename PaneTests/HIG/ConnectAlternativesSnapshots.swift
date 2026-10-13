import SwiftUI
import Testing
@testable import Pane

/// Alternatives for Connect ChatGPT and Connect another AI, drawn to choose from before one is
/// built (13 October 2026). Mocks in the sheet's own look; nothing here ships. Runs only when
/// AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh "PaneTests/ConnectAlternativesSnapshots"`.
#if os(macOS)
@MainActor @Suite(.serialized) struct ConnectAlternativesSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let server = "https://mcp.pintonotes.com"
    static let prompt = "\u{201C}\(WebConnectPlan.testPrompt)\u{201D}"

    static func connected(_ ai: String, other: Bool = false) -> AltPage {
        AltPage(marks: ai, done: true, title: other ? "Cursor is connected" : "\(ai) is connected",
                line: "Ask it about your notes: \(prompt)", primary: other ? nil : "Ask \(ai)", primarySymbol: other ? nil : "arrow.up.right",
                quiet: "Done")
    }

    static var pages: [(String, AltPage)] {
        [
            // ChatGPT A: the Keep import's shape. Intro, two pages, Connected by itself.
            ("chatgpt-A-guide-0-intro", AltPage(dots: (0, 3), marks: "ChatGPT", title: "Connect ChatGPT",
                                                line: "You add Pinto Notes once on chatgpt.com. It takes a minute, and the address is copied for you.",
                                                primary: "Show Me How")),
            ("chatgpt-A-guide-1-open", AltPage(dots: (1, 3), back: true, art: .addMenu, label: "Step 1 of 2", title: "Open ChatGPT\u{2019}s plugins",
                                               line: "Click Add, then Add custom MCP server.",
                                               primary: "Open ChatGPT", primarySymbol: "arrow.up.right")),
            ("chatgpt-A-guide-2-paste", AltPage(dots: (2, 3), back: true, art: .form, artHeight: 196, label: "Step 2 of 2", title: "Paste, tick, create",
                                                line: "Name it Pinto Notes, press \u{2318}V under Connection, tick I understand, then Create. Choose Allow when Pinto Notes asks.",
                                                waiting: "Waiting for ChatGPT\u{2026}", quiet: "Copy the address again")),
            ("chatgpt-A-guide-3-connected", connected("ChatGPT")),

            // ChatGPT B: one page. The press copies and opens; the same page waits, then Connected.
            ("chatgpt-B-onepage-0", AltPage(marks: "ChatGPT", art: .form, artHeight: 190, title: "Connect ChatGPT",
                                            line: "The address is copied. In ChatGPT: Add, Add custom MCP server, paste it, tick I understand, Create.",
                                            primary: "Open ChatGPT", primarySymbol: "arrow.up.right")),
            ("chatgpt-B-onepage-1-waiting", AltPage(marks: "ChatGPT", art: .form, artHeight: 190, title: "Connect ChatGPT",
                                                    line: "The address is copied. In ChatGPT: Add, Add custom MCP server, paste it, tick I understand, Create.",
                                                    waiting: "Waiting for ChatGPT\u{2026} Choose Allow when Pinto Notes asks.", quiet: "Open ChatGPT again")),
            ("chatgpt-B-onepage-2-connected", connected("ChatGPT")),

            // ChatGPT C: once OpenAI approves the public plugin. One button to its page, Connect there.
            ("chatgpt-C-plugin-0", AltPage(marks: "ChatGPT", art: .listing, artHeight: 190, title: "Connect ChatGPT",
                                           line: "ChatGPT opens Pinto Notes. Click Connect there, then Allow here.",
                                           primary: "Open Pinto Notes in ChatGPT", primarySymbol: "arrow.up.right")),
            ("chatgpt-C-plugin-1-waiting", AltPage(marks: "ChatGPT", art: .listing, artHeight: 190, title: "Connect ChatGPT",
                                                   line: "ChatGPT opens Pinto Notes. Click Connect there, then Allow here.",
                                                   waiting: "Waiting for ChatGPT\u{2026}", quiet: "Open ChatGPT again")),

            // Another AI A: the address, Copy, the wait.
            ("other-A-address-0", AltPage(marks: "", title: "Connect another AI", line: "Paste this where your AI app adds a connector.",
                                          address: .plain, primary: "Copy Address", quiet: "Having trouble?")),
            ("other-A-address-1-waiting", AltPage(marks: "", title: "Connect another AI", line: "Paste this where your AI app adds a connector.",
                                                  address: .plain, primary: "Copied", primarySymbol: "checkmark",
                                                  waiting: "Waiting for your AI\u{2026}", quiet: "Having trouble?")),
            ("other-A-address-2-connected", connected("Cursor", other: true)),

            // Another AI B: the apps that take a link, each a row that adds it in one press.
            ("other-B-apps-0", AltPage(marks: "", title: "Connect another AI", line: "Choose your app. It opens with Pinto Notes filled in.",
                                       apps: AltPage.apps, quiet: "Something else? Copy the address")),
            ("other-B-apps-1-waiting", AltPage(marks: "", title: "Connect another AI", line: "Choose your app. It opens with Pinto Notes filled in.",
                                               apps: AltPage.apps, waitingApp: "Cursor", quiet: "Something else? Copy the address")),

            // Another AI C: the address and Copy first, one-press links for the apps that take one under it.
            ("other-C-both-0", AltPage(marks: "", title: "Connect another AI", line: "Paste this where your AI app adds a connector.",
                                       address: .plain, primary: "Copy Address", chips: ["Claude", "Cursor", "VS Code"], quiet: "Having trouble?")),
            ("other-C-both-1-waiting", AltPage(marks: "", title: "Connect another AI", line: "Paste this where your AI app adds a connector.",
                                               address: .plain, primary: "Copied", primarySymbol: "checkmark", chips: ["Claude", "Cursor", "VS Code"],
                                               waiting: "Waiting for your AI\u{2026}", quiet: "Having trouble?")),
        ]
    }

    @Test func mac() async throws {
        guard let dir = Self.dir else { return }
        for dark in [false, true] {
            for (name, page) in Self.pages {
                try await VersionHistorySnapshots.shoot(page, to: dir.appending(path: "alternatives/\(name)-\(dark ? "dark" : "light").png"),
                                                        size: CGSize(width: 540, height: 560), dark: dark)
            }
        }
    }
}

/// One page in the guides' look, put together from parts (mock).
struct AltPage: View {
    enum Address { case plain }
    var dots: (Int, Int)? = nil
    var back = false
    var marks: String? = nil
    var done = false
    var art: ConnectDrawing.Kind? = nil
    var artHeight: CGFloat = 236
    var label: String? = nil
    var title: String
    var line: String
    var address: Address? = nil
    var apps: [(String, String)] = []
    var waitingApp: String? = nil
    var primary: String? = nil
    var primarySymbol: String? = nil
    var chips: [String] = []
    var waiting: String? = nil
    var quiet: String? = nil

    static let apps = [("Claude", "Adds it on claude.ai"), ("Cursor", "Adds it in Cursor"),
                       ("VS Code", "Adds it in VS Code")]

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                if back {
                    HStack(spacing: 4) { Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold)); Text("Back") }
                        .foregroundStyle(Color.muted)
                } else { Color.clear.frame(width: 1, height: 1) }
                Spacer()
                if let dots {
                    HStack(spacing: 6) {
                        ForEach(0..<dots.1, id: \.self) { i in
                            Capsule().fill(i == dots.0 ? Color(Palette.amber) : Color.line).frame(width: i == dots.0 ? 18 : 6, height: 6)
                        }
                    }
                }
                Spacer()
                Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                    .frame(width: 26, height: 26).background(Color.line.opacity(0.6), in: .circle)
            }
            .frame(height: 30).padding(.horizontal, 18).padding(.top, 14)
            content.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(width: 540, height: 560)
        .foregroundStyle(Color.ink)
        .background(Color(Palette.sheetGround))
        .tint(Color(Palette.amber))
    }

    private var stepPage: Bool { label != nil }

    @ViewBuilder private var content: some View {
        VStack(spacing: 0) {
            if let art {
                drawing(art).frame(height: artHeight).padding(.top, 8).padding(.bottom, 18)
            }
            if !stepPage {
                if art == nil { Spacer(minLength: 0) }
                if let marks { markRow(marks).padding(.bottom, art == nil ? 22 : 12) }
                Text(title).font(.display(art == nil ? 28 : 24)).tracking(Palette.tracking(28)).multilineTextAlignment(.center).padding(.bottom, 8)
                Text(line).font(.system(size: 15)).foregroundStyle(Color.muted).multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: 410)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text(label ?? "").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                    Text(title).font(.system(size: 21, weight: .bold)).tracking(-0.3)
                    Text(line).font(.system(size: 14)).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true).lineSpacing(2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            if address != nil { addressField.padding(.top, 18) }
            if !apps.isEmpty { appRows.padding(.top, 18) }
            Spacer(minLength: 12)
            if let primary, address != nil { primaryButton(primary).padding(.bottom, chips.isEmpty ? 0 : 4) }
            if !chips.isEmpty { chipRow.padding(.top, 8) }
            if let waiting { waitingRow(waiting).padding(.top, address != nil ? 6 : 0) }
            else if let primary, address == nil { primaryButton(primary) }
            Text(quiet ?? " ").font(.system(size: 13, weight: .medium)).foregroundStyle(Color.muted)
                .frame(height: 34).padding(.top, 6).opacity(quiet == nil ? 0 : 1)
        }
        .padding(.horizontal, 36)
        .padding(.bottom, 26)
    }

    private func markRow(_ ai: String) -> some View {
        Group {
            if done {
                ZStack(alignment: .bottomTrailing) {
                    if ai == "Cursor" || ai.isEmpty { AITile(ai: "", size: 72) } else { AITile(ai: ai, size: 72) }
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 28)).symbolRenderingMode(.palette)
                        .foregroundStyle(.white, Color(Palette.amberButton))
                        .background(Circle().fill(Color(Palette.sheetGround)).padding(-3)).offset(x: 8, y: 6)
                }
            } else {
                HStack(spacing: 14) {
                    AITile(ai: ai, size: art == nil ? 60 : 44)
                    Image(systemName: "arrow.left.arrow.right").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.muted)
                    AppMark(size: art == nil ? 60 : 44)
                }
            }
        }
    }

    private func drawing(_ kind: ConnectDrawing.Kind) -> some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        return ImportSheetFit.scaled(ConnectDrawing(kind: kind).frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(Palette.page)).clipShape(shape).overlay(shape.strokeBorder(Color.line, lineWidth: 1)),
                                     to: artHeight, from: 236)
    }

    private var addressField: some View {
        let shape = RoundedRectangle(cornerRadius: 10, style: .continuous)
        return Text(ConnectAlternativesSnapshots.server)
            .font(.system(size: 18, weight: .medium, design: .monospaced))
            .frame(maxWidth: .infinity).frame(height: 54)
            .background(Color(Palette.field), in: shape)
            .overlay(shape.strokeBorder(Color(Palette.fieldHairline), lineWidth: 1))
    }

    private var appRows: some View {
        let shape = RoundedRectangle(cornerRadius: 10, style: .continuous)
        return VStack(spacing: 8) {
            ForEach(Self.apps, id: \.0) { name, detail in
                let lit = waitingApp == name
                HStack(spacing: 12) {
                    if name == "Claude" { AITile(ai: name, size: 32) } else { AITile(ai: "", size: 32) }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(name).font(.system(size: 14, weight: .semibold))
                        Text(lit ? "Waiting for \(name)\u{2026} Choose Allow when Pinto Notes asks." : detail)
                            .font(.system(size: 12)).foregroundStyle(lit ? Color.ink : Color.muted)
                    }
                    Spacer()
                    if lit { ProgressView().controlSize(.small) }
                    else { Image(systemName: "arrow.up.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary) }
                }
                .padding(.horizontal, 12).frame(height: 52)
                .background(lit ? Color.amberSoft : Color(Palette.field), in: shape)
                .overlay(shape.strokeBorder(lit ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: lit ? 1.5 : 1))
            }
        }
    }

    private var chipRow: some View {
        HStack(spacing: 8) {
            Text("Or add it in one click:").font(.system(size: 13)).foregroundStyle(Color.muted)
            ForEach(chips, id: \.self) { c in
                Text(c).font(.system(size: 13, weight: .semibold)).foregroundStyle(Color(Palette.amberInk))
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(Color.line.opacity(0.5), in: .capsule)
            }
        }
    }

    private func primaryButton(_ title: String) -> some View {
        Button {} label: {
            HStack(spacing: 6) {
                Text(title)
                if let primarySymbol { Image(systemName: primarySymbol).font(.system(size: 12, weight: .bold)) }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.amberProminent(height: 40, cornerRadius: 10))
        .frame(maxWidth: 320)
    }

    private func waitingRow(_ text: String) -> some View {
        HStack(spacing: 8) {
            ProgressView().controlSize(.small)
            Text(text).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.muted)
        }
        .frame(height: 40)
    }
}
#endif
