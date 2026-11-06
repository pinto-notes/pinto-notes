import SwiftUI
import UniformTypeIdentifiers
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Share as Picture: the picture as it will be, a scene to put it on, light or dark, and what to
/// do with it. It looks right with nothing changed; the choices stay on this device.
struct NotePictureSheet: View {
    let request: NotePicture.Request

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @AppStorage("notePicture.background") private var storedBackground = ""
    @AppStorage("notePicture.showsMark") private var showsMark = true
    @State private var dark: Bool?
    @State private var rendered: NotePicture.Rendered?
    @State private var done: Done?
    @State private var problem: String?
    /// The first picture has been drawn, or found impossible.
    @State private var finished = false
    #if os(macOS)
    @State private var sharing: URL?
    #endif

    private enum Done: Equatable { case copied, saved }

    private var look: NotePicture.Look {
        let isDark = dark ?? (colorScheme == .dark)
        let background = NotePicture.Background(rawValue: storedBackground) ?? (isDark ? .dusk : .hills)
        return NotePicture.Look(background: background, dark: isDark, showsMark: showsMark)
    }

    var body: some View {
        #if os(iOS)
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    preview
                    note
                    backgrounds
                    choices
                }
                .padding(16)
            }
            .safeAreaInset(edge: .bottom) { actions.padding(16).background(.bar) }
            .navigationTitle("Share as Picture")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Done") { dismiss() } } }
        }
        .task(id: look.key) { await draw() }
        #else
        VStack(spacing: 14) {
            preview.frame(maxHeight: 400)
            note
            backgrounds
            choices
            actions
        }
        .padding(20)
        .frame(width: 560)
        .task(id: look.key) { await draw() }
        #endif
    }

    /// The picture stays as it is until the next is ready, so the sheet doesn't blink.
    private func draw() async {
        let look = look
        let next: NotePicture.Rendered?
        if let app = request.app {
            let shot = await NotePageLive.snapshot(app, dark: look.dark)
            guard !Task.isCancelled else { return }
            next = shot.flatMap { NotePicture.render(app: $0, look: look) }
        } else {
            let apps = await NotePageLive.embedded(in: request.passage.text, dark: look.dark)
            guard !Task.isCancelled else { return }
            next = NotePicture.render(request, look: look, apps: apps)
        }
        rendered = next
        done = nil
        finished = true
    }

    @ViewBuilder private var preview: some View {
        if let rendered {
            Image(decorative: rendered.image, scale: 1)
                .resizable()
                .interpolation(.high)
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .accessibilityElement()
                .accessibilityLabel("The picture, on \(look.background.name)")
                .accessibilityIdentifier("picture.preview")
        } else if finished {
            Text(request.app == nil ? "There's nothing in this note to show yet." : "The app couldn't be pictured. Close this and try again once it has opened.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, minHeight: 180)
                .accessibilityIdentifier("picture.none")
        } else {
            ProgressView().frame(maxWidth: .infinity, minHeight: 180)
        }
    }

    /// Says when the picture doesn't show everything, and what to do about it.
    @ViewBuilder private var note: some View {
        if rendered?.fadesOut == true {
            Text(request.passage.isSelection ? "This part is too long for one picture, so it fades out. Select less to show all of it."
                                             : "This note is too long for one picture, so it fades out. Select a part of it to choose what shows.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("picture.fades")
        }
        if let problem {
            Text(problem).font(.footnote).foregroundStyle(.red).frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var backgrounds: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(NotePicture.Background.allCases) { background in
                    Button { storedBackground = background.rawValue } label: { thumbnail(background) }
                        .buttonStyle(.tile(radius: 10))
                        .help(background.name)
                        .accessibilityLabel(background.name)
                        .accessibilityAddTraits(look.background == background ? .isSelected : [])
                        .accessibilityIdentifier("picture.background.\(background.rawValue)")
                }
            }
            .padding(3)
        }
    }

    private func thumbnail(_ background: NotePicture.Background) -> some View {
        let shape = RoundedRectangle(cornerRadius: 8, style: .continuous)
        return Group {
            if let asset = background.asset {
                Image(asset).resizable().scaledToFill()
            } else {
                let p = background.plain
                Color(red: Double(p >> 16 & 255) / 255, green: Double(p >> 8 & 255) / 255, blue: Double(p & 255) / 255)
            }
        }
        .frame(width: 66, height: 44)
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.5))
        .padding(2)
        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(Color.primary, lineWidth: look.background == background ? 2 : 0))
    }

    private var choices: some View {
        // Share is the one orange thing here (DESIGN.md): these two stay in the neutral ink.
        HStack(spacing: 16) {
            Picker("Appearance", selection: Binding(get: { look.dark }, set: { dark = $0 })) {
                Text("Light").tag(false)
                Text("Dark").tag(true)
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .fixedSize()
            .tint(.primary)
            .accessibilityIdentifier("picture.appearance")
            Spacer(minLength: 0)
            Toggle("Pinto Notes mark", isOn: $showsMark)
                .tint(.primary)
                .accessibilityIdentifier("picture.mark")
                #if os(iOS)
                .fixedSize()
                #endif
        }
    }

    private var copyTitle: String { done == .copied ? "Copied" : "Copy" }

    #if os(iOS)
    private var actions: some View {
        VStack(spacing: 8) {
            if let rendered {
                ShareLink(item: NotePicturePNG(image: rendered.image, name: NotePicture.filename(title: request.title)),
                          preview: SharePreview(request.title.isEmpty ? "Note" : request.title, image: Image(decorative: rendered.image, scale: 8))) {
                    Text("Share")
                }
                .buttonStyle(.amberProminent(.big, wide: true))
                .accessibilityIdentifier("picture.share")
            }
            Button { copy() } label: {
                Label(copyTitle, systemImage: done == .copied ? "checkmark" : "doc.on.doc")
            }
            .buttonStyle(.secondary(.big, wide: true))
            .disabled(rendered == nil)
            .accessibilityIdentifier("picture.copy")
        }
    }

    private func copy() {
        guard let rendered else { return }
        UIPasteboard.general.image = UIImage(cgImage: rendered.image)
        confirm(.copied)
    }
    #else
    private var actions: some View {
        HStack(spacing: 8) {
            Button("Done") { dismiss() }
                .buttonStyle(.quiet)
                .keyboardShortcut(.cancelAction)
                .accessibilityIdentifier("picture.done")
            Spacer(minLength: 0)
            Button { copy() } label: {
                Label(copyTitle, systemImage: done == .copied ? "checkmark" : "doc.on.doc")
            }
            .buttonStyle(.secondary(.regular))
            .accessibilityIdentifier("picture.copy")
            Button { save() } label: {
                if done == .saved { Label("Saved", systemImage: "checkmark") } else { Text("Save…") }
            }
            .buttonStyle(.secondary(.regular))
            .accessibilityIdentifier("picture.save")
            Button("Share…") { share() }
                .buttonStyle(.amberProminent(.regular))
                .background(SharePickerAnchor(url: $sharing))
                .keyboardShortcut(.defaultAction)
                .accessibilityIdentifier("picture.share")
        }
        .disabled(rendered == nil)
    }

    private func copy() {
        guard let rendered else { return }
        let image = NSImage(cgImage: rendered.image, size: .zero)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.writeObjects([image])
        confirm(.copied)
    }

    private func save() {
        guard let rendered, let window = NSApp.keyWindow else { return }
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.png]
        panel.nameFieldStringValue = NotePicture.filename(title: request.title)
        panel.beginSheetModal(for: window) { response in
            guard response == .OK, let url = panel.url else { return }
            Task {
                if await Self.write(rendered.image, to: url) { confirm(.saved) } else { problem = Self.couldNotWrite }
            }
        }
    }

    private func share() {
        guard let rendered else { return }
        let folder = FileManager.default.temporaryDirectory.appending(path: "NotePicture", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let url = folder.appending(path: NotePicture.filename(title: request.title))
        Task {
            if await Self.write(rendered.image, to: url) { sharing = url } else { problem = Self.couldNotWrite }
        }
    }

    private static let couldNotWrite = "The picture couldn't be saved. Try another place."

    private static func write(_ image: CGImage, to url: URL) async -> Bool {
        await Task.detached(priority: .userInitiated) {
            guard let data = NotePicture.png(image) else { return false }
            return (try? data.write(to: url, options: .atomic)) != nil
        }.value
    }
    #endif

    /// Says it happened, then goes back to the button's own word.
    private func confirm(_ what: Done) {
        problem = nil
        done = what
        Task {
            try? await Task.sleep(for: .seconds(1.6))
            if done == what { done = nil }
        }
    }
}

private extension NotePicture.Look {
    var key: String { "\(background.rawValue) \(dark) \(showsMark)" }
}

#if os(iOS)
/// The picture for the share sheet, made into a PNG only when something asks for it.
struct NotePicturePNG: Transferable {
    let image: CGImage
    let name: String

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .png) { picture in
            guard let data = NotePicture.png(picture.image) else { throw CocoaError(.fileWriteUnknown) }
            return data
        }
        .suggestedFileName { $0.name }
    }
}
#endif
