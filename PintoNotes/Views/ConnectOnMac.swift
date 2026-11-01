import SwiftUI

/// Mac first (Emil, 28 October 2026): the iPhone does notes, sync and ChatGPT; everything else
/// happens in the Mac app. So on iPhone and iPad nothing outside Settings asks to connect an AI,
/// and in Settings only ChatGPT connects here (in one tap, through its published app). Claude,
/// Codex and any other AI say to connect them on the Mac, and offer the Mac link: a flow that
/// can't finish on the phone is never started there. The Mac is unchanged.
enum ConnectHere {
    typealias Guide = ConnectAISection.Guide

    static var onMac: Bool {
        #if os(macOS)
        true
        #else
        false
        #endif
    }

    /// Cards, menu items and links outside Settings that ask to connect an AI: the Mac's only.
    static func nudges(mac: Bool = onMac) -> Bool { mac }

    /// An AI that is connected on the Mac, never started from this device.
    static func onMacOnly(_ g: Guide, mac: Bool = onMac) -> Bool { !mac && g != .chatgpt }

    /// What a press on an AI's row in Connect an AI does.
    enum Press: Equatable {
        /// Its own guide (ChatGPT, Another AI and Incredible on the Mac).
        case guide
        /// Started from the row (Claude, Codex on the Mac).
        case start
        /// iPhone: a short sheet that says to connect it on the Mac, with the Mac link.
        case onMac
        /// Nothing: it is connected already, and can't be connected again from here.
        case nothing
    }

    static func press(_ g: Guide, connected: Bool, mac: Bool = onMac) -> Press {
        if onMacOnly(g, mac: mac) { return connected ? .nothing : .onMac }
        return g == .incredible || ConnectWebGuide.opensSheet(g) ? .guide : .start
    }

    /// The AIs "Having trouble?" helps with here: on iPhone, only ChatGPT's.
    static func helped(_ all: [Guide], mac: Bool = onMac) -> [Guide] { all.filter { !onMacOnly($0, mac: mac) } }
}

enum ConnectOnMacWords {
    typealias Guide = ConnectAISection.Guide

    private static func name(_ g: Guide) -> String { g == .other ? "another AI" : g.title }

    /// The row's line, and the sheet's title.
    static func line(_ g: Guide) -> String { "Connect \(name(g)) on your Mac" }
    static func text(_ g: Guide) -> String {
        "Open Pinto Notes on your Mac and connect \(g == .other ? "it" : g.title) in Settings. It then works with the same notes as this iPhone."
    }
    static let noMac = "No Mac app yet? Send yourself the link."
    /// The same words and link as the Mac card (OnboardingFlow, AppleNotesOnMacSheet).
    static let send = "Send the Mac link to myself"
    /// The Mac download, as the Mac card sends it (OnboardingFlow.macDownload on iPhone).
    static let macDownload = URL(string: "https://pintonotes.com/download")!
}

/// iPhone: why an AI isn't connected here, and the Mac link to send to yourself.
struct ConnectOnMacSheet: View {
    let ai: ConnectAISection.Guide
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                AITile(ai: ai.title, size: 56)
                    .accessibilityHidden(true)
                Text(ConnectOnMacWords.line(ai))
                    .font(.title3.weight(.bold))
                    .foregroundStyle(Color.ink)
                    .multilineTextAlignment(.center)
                    .accessibilityAddTraits(.isHeader)
                Text(ConnectOnMacWords.text(ai))
                    .font(.subheadline)
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                Text(ConnectOnMacWords.noMac)
                    .font(.subheadline)
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                ShareLink(item: ConnectOnMacWords.macDownload, subject: Text("Pinto Notes for Mac"), message: Text("Pinto Notes for Mac")) {
                    Text(ConnectOnMacWords.send)
                }
                .buttonStyle(.amberProminent(.form, wide: true))
                .padding(.top, 8)
                .accessibilityIdentifier("connect.onMac.send")
                Button("Done") { dismiss() }
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.muted)
                    .frame(minHeight: 44)
                    .accessibilityIdentifier("connect.onMac.done")
            }
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 28)
            .padding(.top, 32)
            .padding(.bottom, 16)
            .frame(maxWidth: .infinity, alignment: .top)
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Color(Palette.sheetGround))
        .presentationDetents(typeSize.isAccessibilitySize ? [.large] : [.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(Color(Palette.sheetGround))
        .accessibilityIdentifier("connect.onMac")
    }
}
