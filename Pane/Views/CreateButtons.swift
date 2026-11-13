import SwiftData
import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// The three ways to make something, side by side where compose was (create study, 13 November
/// 2026): New Note, New Canvas and New App, one press each, as one glass group. Hidden behind a
/// press-and-hold before, New App and New Canvas went unfound ("where do I click to create each
/// one"). Canvas and App show only while apps are on.
struct CreateButtons: View {
    let newNote: () -> Void
    /// New Note is off on an untouched new note (ListCompose.isOff): it would only put the cursor back.
    var noteOff = false

    var body: some View {
        ForEach(CreateKind.allCases.filter(\.shown)) { kind in
            Button { kind.run(newNote: newNote) } label: {
                Label { Text(kind.title) } icon: { glyph(kind) }
            }
            .disabled(kind == .note && noteOff)
            #if os(macOS)
            .help(kind == .note && noteOff ? "This note is new and empty" : kind.help)
            #endif
            .accessibilityLabel(kind.title)
            .accessibilityIdentifier(kind.identifier)
        }
    }

    @ViewBuilder private func glyph(_ kind: CreateKind) -> some View {
        #if os(macOS)
        // The pencil pokes out top-right; ToolbarGlyph re-centres its ink.
        ToolbarGlyph.image(kind.symbol, shift: kind == .note ? ToolbarGlyph.composeShift : .zero)
            .foregroundStyle(kind == .note ? ListCompose.iconStyle(off: noteOff) : .primary)
        #else
        Image(systemName: kind.symbol)
        #endif
    }
}

#if os(iOS)
/// The iPhone's bottom bar: the three, as one glass group right of Search (B-iphone-bar).
struct CreateBarItems: ToolbarContent {
    let newNote: () -> Void
    var identifier = "list.newNote"

    var body: some ToolbarContent {
        ToolbarItemGroup(placement: .bottomBar) {
            ForEach(CreateKind.allCases.filter(\.shown)) { kind in
                Button(kind.title, systemImage: kind.symbol) { kind.run(newNote: newNote) }
                    .tint(.primary)
                    .accessibilityIdentifier(kind == .note ? identifier : identifier.replacingOccurrences(of: "newNote", with: kind == .canvas ? "newCanvas" : "newApp"))
            }
        }
    }
}
#endif

// MARK: An empty library

/// A new account, nothing in it yet: "Make your first one", with a card for each kind and its key,
/// and a quiet line for bringing notes over (empty-mac). Only while the library holds no notes.
struct FirstOneView: View {
    let newNote: () -> Void
    /// The cards in a column, one under another (the iPhone's list).
    var compact = false
    @Environment(\.importActions) private var imports

    static let title = "Make your first one"
    static let line = "Notes, drawings and small apps live side by side."
    static let importLead = "Moving from Apple Notes?"
    static let importAction = "Import your notes"

    /// The cards' pictures: the paper-craft covers of the templates they're nearest.
    static func cover(_ kind: CreateKind) -> String {
        switch kind {
        case .note: "template-cover-meeting-notes"
        case .canvas: "template-cover-trip-plan"
        case .app: "template-cover-habit-tracker"
        }
    }

    /// Whether the library holds no note at all (Recently Deleted aside). One row is enough to know.
    @MainActor static func libraryIsEmpty(_ context: ModelContext) -> Bool {
        var d = FetchDescriptor<Note>(predicate: #Predicate { $0.trashedAt == nil && $0.deletedAt == nil })
        d.fetchLimit = 1
        return ((try? context.fetchCount(d)) ?? 1) == 0
    }

    var body: some View {
        let kinds = CreateKind.allCases.filter(\.shown)
        VStack(spacing: compact ? 20 : 28) {
            VStack(spacing: 8) {
                Text(Self.title)
                    .font(.system(size: compact ? 28 : 34, weight: .heavy))
                    .tracking(Palette.tracking(compact ? 28 : 34))
                    .foregroundStyle(Color.ink)
                    .multilineTextAlignment(.center)
                    .accessibilityAddTraits(.isHeader)
                Text(Self.line)
                    .font(compact ? .subheadline : .system(size: 14))
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
            }
            if compact {
                VStack(spacing: 12) { ForEach(kinds) { card($0) } }
            } else {
                HStack(alignment: .top, spacing: 16) { ForEach(kinds) { card($0) } }
                    .frame(maxWidth: 760)
            }
            importLine
        }
        .padding(.horizontal, compact ? 16 : 32)
        .frame(maxWidth: .infinity, maxHeight: compact ? nil : .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("firstOne")
    }

    private func card(_ kind: CreateKind) -> some View {
        Button { kind.run(newNote: newNote) } label: {
            VStack(alignment: .leading, spacing: 10) {
                if !compact {
                    Color.clear
                        .aspectRatio(10 / 7, contentMode: .fit)
                        .overlay { FirstOpen.image(Self.cover(kind))?.resizable().scaledToFill() }
                        .clipShape(.rect(cornerRadius: 12, style: .continuous))
                        .accessibilityHidden(true)
                }
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Image(systemName: kind.symbol)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(Color.ink)
                        .frame(width: 18)
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(kind.noun).font(.system(size: compact ? 17 : 15, weight: .semibold)).foregroundStyle(Color.ink)
                            Spacer(minLength: 8)
                            #if os(macOS)
                            Text(kind.keys).font(.system(size: 12)).foregroundStyle(Color.muted).monospacedDigit()
                            #endif
                        }
                        Text(kind.line)
                            .font(.system(size: compact ? 15 : 13))
                            .foregroundStyle(Color.muted)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.horizontal, 6)
                .padding(.bottom, 4)
            }
            .padding(compact ? 14 : 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.soft, in: .rect(cornerRadius: 20, style: .continuous))
            .contentShape(.rect(cornerRadius: 20, style: .continuous))
        }
        .buttonStyle(.tile(radius: 20))
        #if os(macOS)
        .help(kind.help)
        #endif
        .accessibilityLabel(kind.title)
        .accessibilityHint(kind.line)
        .accessibilityIdentifier("firstOne.\(kind.rawValue)")
    }

    @ViewBuilder private var importLine: some View {
        if let imports {
            HStack(spacing: 4) {
                Text(Self.importLead).foregroundStyle(Color.muted)
                Button(Self.importAction) {
                    #if os(macOS)
                    NotificationCenter.default.post(name: .paneImportNotes, object: nil)
                    #else
                    imports.appleNotes()
                    #endif
                }
                .buttonStyle(.hoverLink)
                .foregroundStyle(Color.amberInk)
                .fontWeight(.semibold)
                .accessibilityIdentifier("firstOne.import")
            }
            .font(compact ? .subheadline : .system(size: 13))
        }
    }
}

// MARK: New App's templates

/// One template in New App: the app's picture, its name and a few words. One press makes it.
struct AppTemplateCard: View {
    let template: AppTemplate
    /// Nil: as wide as its grid column.
    var width: CGFloat? = nil
    let make: () -> Void
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Button(action: make) {
            VStack(alignment: .leading, spacing: 8) {
                Color.clear
                    .aspectRatio(1 / 0.72, contentMode: .fit)
                    .frame(width: width)
                    .overlay {
                        if let url = template.picture(dark: scheme == .dark) { Self.image(url)?.resizable().scaledToFill() }
                    }
                    .clipShape(.rect(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(template.name)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.ink)
                    Text(template.line)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.muted)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 2)
            }
            .frame(width: width, alignment: .leading)
            .frame(maxWidth: width == nil ? .infinity : nil, alignment: .leading)
            .contentShape(.rect(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.tile(radius: 12))
        #if os(macOS)
        .help("Make a \(template.name.lowercased()) now")
        #endif
        .accessibilityLabel(template.name)
        .accessibilityHint(template.line)
        .accessibilityIdentifier("newApp.template.\(template.slug)")
    }

    static func image(_ url: URL) -> Image? {
        #if os(iOS)
        UIImage(contentsOfFile: url.path).map { Image(uiImage: $0) }
        #else
        NSImage(contentsOf: url).map { Image(nsImage: $0) }
        #endif
    }
}
