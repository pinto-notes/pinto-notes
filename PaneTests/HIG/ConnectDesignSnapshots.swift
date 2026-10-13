import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The connect design study (ConnectDesignLab.swift): every alternative, AI, place and state.
/// Offscreen. Runs only when AMBER_HIG_SHOTS is set.
@MainActor @Suite(.serialized) struct ConnectDesignSnapshots {
    typealias Look = ConnectDesign.Look
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// (name, look, light too)
    static func looks(_ alt: ConnectDesign.Alt) -> [(String, Look, Bool)] {
        var out: [(String, Look, Bool)] = []
        let a = alt.rawValue
        for place in ConnectDesign.Place.allCases {
            out.append(("\(a)-\(place.rawValue)-0-rest", Look(alt: alt, place: place), true))
            let phases: [ConnectDesign.Phase] = place == .flow ? [.waiting, .connected, .failed] : [.waiting, .connected, .failed, .disconnecting]
            for ai in ConnectDesign.AI.allCases {
                if alt == .b { out.append(("\(a)-\(place.rawValue)-\(ai.rawValue)-1-picked", Look(alt: alt, place: place, ai: ai), false)) }
                for (i, phase) in phases.enumerated() {
                    var look = Look(alt: alt, place: place, ai: ai, phase: phase)
                    // C: what it found is the main path; another AI comes through "Use a different AI".
                    if alt == .c, !Look.foundHere.contains(ai) { look.picking = true }
                    if alt == .c, Look.foundHere.contains(ai) { look.found = [ai] }
                    out.append(("\(a)-\(place.rawValue)-\(ai.rawValue)-\(i + 2)-\(phase.rawValue)", look, false))
                }
            }
            if place != .flow {
                out.append(("\(a)-\(place.rawValue)-9-two-connected", Look(alt: alt, place: place, connected: [.chatgpt, .claudeCode]), true))
            }
        }
        // The press itself.
        out.append(("\(a)-flow-claude-1-pressed", Look(alt: alt, place: .flow, ai: alt == .c ? nil : .claude, pressed: true), false))
        if alt == .c {
            out += [
                ("C-flow-found-both-waiting", Look(alt: .c, ai: nil, phase: .waiting), false),
                ("C-flow-found-both-one-done", Look(alt: .c, ai: .claude, phase: .waiting, foundDone: [.claudeCode]), false),
                ("C-flow-found-both-connected", Look(alt: .c, phase: .connected, foundDone: Look.foundHere), false),
                ("C-flow-found-both-one-failed", Look(alt: .c, ai: .claude, phase: .failed, foundDone: [.claudeCode]), false),
                ("C-flow-found-none", Look(alt: .c, found: []), true),
                ("C-flow-found-three", Look(alt: .c, found: [.claude, .claudeCode, .codex]), false),
                ("C-flow-use-a-different-ai", Look(alt: .c, picking: true), false),
            ]
        }
        return out
    }

    static func screen(_ look: Look) -> some View {
        ConnectDesignScreen(look: look)
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    static let shared: [(String, AnyView)] = {
        var out: [(String, AnyView)] = []
        for step in 1...4 { out.append(("chatgpt-guide-step-\(step)", AnyView(ChatGPTFloatingGuide(step: step)))) }
        out.append(("chatgpt-guide-connected", AnyView(ChatGPTFloatingGuide(connected: true))))
        out.append(("chatgpt-intro-before", AnyView(ChatGPTIntro().padding(24).frame(width: 400).background(Color(Palette.sheetGround)))))
        for ai in ConnectDesign.AI.allCases { out.append(("trouble-\(ai.rawValue)", AnyView(ConnectTroubleSheet(ai: ai)))) }
        return out
    }()

    #if os(macOS)
    @Test(arguments: ConnectDesign.Alt.allCases)
    func mac(alt: ConnectDesign.Alt) async throws {
        guard Self.dir != nil else { return }
        for (name, look, light) in Self.looks(alt) {
            for dark in light ? [true, false] : [true] {
                let file = "mac-\(name)-\(dark ? "dark" : "light")"
                if look.place == .flow {
                    try await AppSnapshotTests.shoot(Self.screen(look).containerBackground(for: .window) { Backdrop() }, name: file,
                                                     size: WelcomeFlow.size, dark: dark, toolbar: false, card: true, wait: 0.7)
                } else {
                    try await AppSnapshotTests.render(Self.screen(look), name: file, dark: dark, wait: 0.6)
                }
            }
        }
        // The sidebar card that opens it.
        let card = ConnectDesignCard(alt: alt).frame(width: 230).padding(10).background(Color(Palette.sheetGround)).tint(Color(PColor.paneAccent))
        try await AppSnapshotTests.render(card, name: "mac-\(alt.rawValue)-sidebar-card-dark", dark: true, wait: 0.6)
    }

    @Test func macShared() async throws {
        guard Self.dir != nil else { return }
        for (name, view) in Self.shared {
            try await AppSnapshotTests.render(view.tint(Color(PColor.paneAccent)), name: "mac-shared-\(name)-dark", dark: true, wait: 0.6)
        }
    }
    #endif

    #if os(iOS)
    static func draw(_ view: some View, name: String, dark: Bool, in dir: URL) async throws {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view)
        window.isHidden = false
        try? await Task.sleep(for: .seconds(0.7))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.isHidden = true
        try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
    }

    @Test(arguments: ConnectDesign.Alt.allCases)
    func iPhone(alt: ConnectDesign.Alt) async throws {
        guard let dir = Self.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for (name, look, light) in Self.looks(alt) {
            for dark in light ? [true, false] : [true] {
                try await Self.draw(Self.screen(look), name: "iphone-\(name)-\(dark ? "dark" : "light")", dark: dark, in: dir)
            }
        }
    }

    @Test func iPhoneShared() async throws {
        guard let dir = Self.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for (name, view) in Self.shared where !name.hasPrefix("chatgpt-guide") {
            let page = ScrollView { view }.background(Color(Palette.sheetGround)).tint(Color(PColor.paneAccent))
            try await Self.draw(page, name: "iphone-shared-\(name)-dark", dark: true, in: dir)
        }
    }
    #endif
}
