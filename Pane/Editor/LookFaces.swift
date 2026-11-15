import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// A face named in the look: a family on this device or from a font file, or one of the system's designs.
struct LookFace: Equatable, Sendable {
    enum Kind: Equatable, Sendable { case family(String), design(NoteFont) }
    let kind: Kind

    /// The face `name` stands for, or nil when there's no such font here.
    static func named(_ name: String) -> LookFace? {
        let lower = name.lowercased()
        if let design = NoteFont.allCases.first(where: { $0.rawValue == lower || $0.title.lowercased() == lower }) {
            return LookFace(kind: .design(design))
        }
        // The system's own faces, which aren't listed as families.
        let system: [String: NoteFont] = ["system": .standard, "sf pro": .standard, "san francisco": .standard, "new york": .serif,
                                          "sf pro rounded": .rounded, "sf mono": .mono, "monospace": .mono, "monospaced": .mono]
        if let design = system[lower] { return LookFace(kind: .design(design)) }
        guard let family = family(matching: name) else { return nil }
        return LookFace(kind: .family(family))
    }

    /// The family's name as the system spells it.
    static func family(matching name: String) -> String? {
        #if os(iOS)
        let families = UIFont.familyNames
        #else
        let families = NSFontManager.shared.availableFontFamilies
        #endif
        if let f = families.first(where: { $0.caseInsensitiveCompare(name) == .orderedSame }) { return f }
        // A font's own name ("Georgia-Bold", "Avenir Next Demi Bold"): its family.
        #if os(iOS)
        return UIFont(name: name, size: 12)?.familyName
        #else
        return NSFont(name: name, size: 12)?.familyName
        #endif
    }

    func font(ofSize size: CGFloat, weight: PFont.Weight) -> PFont {
        switch kind {
        case .design(let d): return d.font(ofSize: size, weight: weight)
        case .family(let family):
            let d = PFontDescriptor(fontAttributes: [.family: family, .traits: [PFontDescriptor.TraitKey.weight: weight]])
            #if os(iOS)
            let f = UIFont(descriptor: d, size: size)
            return f.familyName == family ? f : .systemFont(ofSize: size, weight: weight)
            #else
            guard let f = NSFont(descriptor: d, size: size), f.familyName == family else { return .systemFont(ofSize: size, weight: weight) }
            return f
            #endif
        }
    }
}

/// The faces the look sets, read from any thread (the editor styles off the main actor).
enum LookFaces {
    private static let lock = NSLock()
    private nonisolated(unsafe) static var _body: LookFace?
    private nonisolated(unsafe) static var _heading: LookFace?
    @TaskLocal static var override: (body: LookFace?, heading: LookFace?)?

    static var body: LookFace? { override.map { $0.body } ?? lock.withLock { _body } }
    /// Headings take the heading face, else the text's.
    static var heading: LookFace? { override.map { $0.heading ?? $0.body } ?? lock.withLock { _heading ?? _body } }

    /// Sets both; true when either changed.
    @discardableResult static func set(body: LookFace?, heading: LookFace?) -> Bool {
        lock.withLock {
            guard _body != body || _heading != heading else { return false }
            _body = body; _heading = heading
            return true
        }
    }
}
