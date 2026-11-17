import ImageIO
import SwiftUI

/// Ready-made covers, drawn here, so a note gets one in a click without hunting for a photo (Emil,
/// 13 November 2026: the file picker took ten seconds of the recording; Notion offers its own).
/// Picked, one is drawn to a picture and kept like any other cover: the note stays Markdown.
enum CoverPattern: String, CaseIterable, Identifiable {
    case redGingham, greenGingham, ticking, polka, kraft, sunset, sea, dusk

    var id: String { rawValue }

    var title: String {
        switch self {
        case .redGingham: "Red gingham"
        case .greenGingham: "Green gingham"
        case .ticking: "Blue stripes"
        case .polka: "Polka dots"
        case .kraft: "Kraft paper"
        case .sunset: "Sunset"
        case .sea: "Sea"
        case .dusk: "Dusk"
        }
    }

    /// The picture's size: a wide banner, sharp at twice the widest column.
    static let pixels = CGSize(width: 1800, height: 600)

    /// Draws the pattern into `size` (any size: the swatch and the picture are the same drawing).
    func draw(_ g: inout GraphicsContext, _ size: CGSize) {
        let all = Path(CGRect(origin: .zero, size: size))
        let unit = size.height / 10
        switch self {
        case .redGingham, .greenGingham:
            let ink = self == .redGingham ? Color(red: 0.78, green: 0.22, blue: 0.22) : Color(red: 0.27, green: 0.52, blue: 0.33)
            g.fill(all, with: .color(Color(red: 0.99, green: 0.98, blue: 0.96)))
            var x: CGFloat = 0
            while x < size.width { g.fill(Path(CGRect(x: x, y: 0, width: unit, height: size.height)), with: .color(ink.opacity(0.45))); x += unit * 2 }
            var y: CGFloat = 0
            while y < size.height { g.fill(Path(CGRect(x: 0, y: y, width: size.width, height: unit)), with: .color(ink.opacity(0.45))); y += unit * 2 }
        case .ticking:
            g.fill(all, with: .color(Color(red: 0.97, green: 0.96, blue: 0.93)))
            var x: CGFloat = unit * 0.5
            let ink = Color(red: 0.25, green: 0.36, blue: 0.56)
            while x < size.width {
                g.fill(Path(CGRect(x: x, y: 0, width: unit * 0.35, height: size.height)), with: .color(ink.opacity(0.85)))
                g.fill(Path(CGRect(x: x + unit * 0.6, y: 0, width: unit * 0.12, height: size.height)), with: .color(ink.opacity(0.6)))
                x += unit * 1.8
            }
        case .polka:
            g.fill(all, with: .color(Color(red: 0.98, green: 0.95, blue: 0.86)))
            let r = unit * 0.32, step = unit * 1.4
            var row = 0
            var y = step / 2
            while y < size.height + step {
                var x = row.isMultiple(of: 2) ? step / 2 : step
                while x < size.width + step {
                    g.fill(Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)), with: .color(Color(red: 0.87, green: 0.62, blue: 0.18)))
                    x += step
                }
                y += step * 0.866; row += 1
            }
        case .kraft:
            g.fill(all, with: .color(Color(red: 0.80, green: 0.67, blue: 0.50)))
            // Fibres: the same speckle every time, from a fixed seed.
            var seed: UInt64 = 0x9E3779B97F4A7C15
            func next() -> CGFloat { seed = seed &* 6364136223846793005 &+ 1442695040888963407; return CGFloat(seed >> 33) / CGFloat(1 << 31) }
            for _ in 0..<Int(size.width * size.height / (unit * unit) * 6) {
                let p = CGPoint(x: next() * size.width, y: next() * size.height), s = unit * (0.03 + next() * 0.08)
                g.fill(Path(ellipseIn: CGRect(x: p.x, y: p.y, width: s * 2.4, height: s)), with: .color((next() > 0.5 ? Color.white : Color.black).opacity(0.07)))
            }
        case .sunset:
            g.fill(all, with: .linearGradient(Gradient(colors: [Color(red: 0.99, green: 0.80, blue: 0.62), Color(red: 0.94, green: 0.55, blue: 0.55)]),
                                              startPoint: .zero, endPoint: CGPoint(x: size.width, y: size.height)))
        case .sea:
            g.fill(all, with: .linearGradient(Gradient(colors: [Color(red: 0.70, green: 0.90, blue: 0.84), Color(red: 0.33, green: 0.58, blue: 0.80)]),
                                              startPoint: .zero, endPoint: CGPoint(x: size.width, y: size.height)))
        case .dusk:
            g.fill(all, with: .linearGradient(Gradient(colors: [Color(red: 0.80, green: 0.73, blue: 0.93), Color(red: 0.22, green: 0.24, blue: 0.45)]),
                                              startPoint: .zero, endPoint: CGPoint(x: size.width, y: size.height)))
        }
    }

    /// The pattern as a PNG in a folder of its own, named for it, ready to keep as a cover.
    @MainActor func render() -> URL? {
        let renderer = ImageRenderer(content: Canvas { g, size in var g = g; draw(&g, size) }.frame(width: Self.pixels.width, height: Self.pixels.height))
        renderer.scale = 1
        guard let image = renderer.cgImage else { return nil }
        let dir = FileManager.default.temporaryDirectory.appending(path: "covers-\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "\(title).png")
        guard let dest = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil) else { return nil }
        CGImageDestinationAddImage(dest, image, nil)
        return CGImageDestinationFinalize(dest) ? url : nil
    }
}

/// Add Cover and Change Cover: the ready-made covers, then Photos and a file.
struct CoverPicker: View {
    let pick: (CoverSource) -> Void

    static let size = CGSize(width: 344, height: 196)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(74), spacing: 8), count: 4), spacing: 8) {
                ForEach(CoverPattern.allCases) { p in
                    Button { pick(.pattern(p)) } label: {
                        Canvas { g, size in var g = g; p.draw(&g, size) }
                            .frame(width: 74, height: 42)
                            .clipShape(.rect(cornerRadius: 7, style: .continuous))
                    }
                    .buttonStyle(CoverSwatchStyle())
                    .help(p.title)
                    .accessibilityLabel(p.title)
                    .accessibilityIdentifier("cover.pattern.\(p.rawValue)")
                }
            }
            HStack(spacing: 8) {
                Button("Choose from Photos…", systemImage: "photo.on.rectangle") { pick(.photos) }
                    .accessibilityIdentifier("cover.photos")
                Button("Choose File…", systemImage: "folder") { pick(.file) }
                    .accessibilityIdentifier("cover.file")
            }
            .controlSize(.small)
        }
        .padding(14)
        .frame(width: Self.size.width)
    }
}
