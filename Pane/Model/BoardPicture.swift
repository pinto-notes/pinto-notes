import CryptoKit
import Foundation
import ImageIO
import Supabase
import UniformTypeIdentifiers

/// A shared whiteboard's web page (14 November 2026). A board's drawing is its page data, sealed
/// like the rest, so the page can't draw it: it shows a picture this device makes from the open
/// board and publishes beside the board's readable copy (publish_share_picture), and the copy's
/// text is the board's words (`body`), for the page's text, its description and the picture's.
///
/// The picture is made again on each republish while the board is open here (SharePublisher,
/// 2 s after the drawing's last change went up: SyncEngine); a board that isn't open keeps the
/// last one. Stopping the link, locking, trashing or deleting the note takes it down (the server).
@MainActor
enum BoardPicture {
    /// The server's limit (publish_share_picture): a board too big for it at 2x is sent smaller.
    nonisolated static let maxBytes = 4 * 1024 * 1024

    // MARK: Open boards

    private final class Open {
        weak var board: CanvasController?
        init(_ board: CanvasController) { self.board = board }
    }
    /// Per note, the boards showing it, the last opened last (a note can be open in two windows).
    private static var open: [UUID: [Open]] = [:]

    /// A board's page joined its controller (NotePageView): it can make the picture from now on.
    static func opened(_ board: CanvasController, note: UUID) {
        var list = (open[note] ?? []).filter { $0.board != nil && $0.board !== board }
        list.append(Open(board))
        open[note] = list
    }

    /// It went (the note closed, another note in its place).
    static func closed(_ board: CanvasController, note: UUID) {
        let list = (open[note] ?? []).filter { $0.board != nil && $0.board !== board }
        open[note] = list.isEmpty ? nil : list
    }

    /// The note's board, while it's open here: the one opened last.
    static func board(_ note: UUID) -> CanvasController? {
        open[note]?.last { $0.board?.exporter != nil }?.board
    }

    // MARK: Publishing

    /// What each link's page was last sent (a digest of the picture; "" for none), so a board that
    /// didn't change isn't sent again on every republish.
    private static var sent: [String: String] = [:]

    /// The page lost its picture (the note was trashed or locked, which takes the copy down): the
    /// next publish sends it whatever it was before.
    static func forget(slug: String) { sent[slug] = nil }

    /// Tests start with nothing sent and no board open.
    static func reset() { sent = [:]; open = [:] }

    enum Outcome: Equatable {
        case sent, cleared, unchanged
        /// The board isn't open here: the page keeps the picture it has.
        case notOpen
        case failed
    }

    /// Makes the board's picture (light, at 2x) and publishes it to the link's page. `force` sends
    /// it even when it's what was sent last (Share Link and Copy Link put the page right).
    @discardableResult
    static func publish(note: UUID, slug: String, client: SupabaseClient, force: Bool = false) async -> Outcome {
        guard let board = board(note) else { return .notOpen }
        let content: Data?
        if let png = await board.export(.png, light: true) {
            guard let fitted = fitted(png) else { return .failed }
            content = fitted
        } else {
            // Nothing drawn: the page shows no picture. Anything else (a page not ready yet) keeps
            // the last one.
            guard board.connected, board.state.empty else { return .failed }
            content = nil
        }
        let digest = content.map { SHA256.hash(data: $0).map { String(format: "%02x", $0) }.joined() } ?? ""
        if !force, sent[slug] == digest { return .unchanged }
        struct Params: Encodable { var p_slug: String; var p_content: String? }
        do {
            try await client.rpc("publish_share_picture", params: Params(p_slug: slug, p_content: content?.base64EncodedString())).execute()
        } catch {
            ShareLinkStore.log.notice("board picture not published: \(String(describing: error), privacy: .public)")
            return .failed
        }
        sent[slug] = digest
        return content == nil ? .cleared : .sent
    }

    /// The picture within `limit`: as it is, or made smaller until it fits. Nil when it can't be read.
    nonisolated static func fitted(_ png: Data, limit: Int = maxBytes) -> Data? {
        guard png.count > limit else { return png }
        guard let src = CGImageSourceCreateWithData(png as CFData, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
              let w = props[kCGImagePropertyPixelWidth] as? Int, let h = props[kCGImagePropertyPixelHeight] as? Int else { return nil }
        var side = Double(max(w, h))
        while side > 256 {
            // About the share of pixels that fits, a little under: a PNG's size follows its area.
            side *= min(0.9, (Double(limit) / Double(png.count)).squareRoot() * 0.95)
            guard let image = CGImageSourceCreateThumbnailAtIndex(src, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: Int(side),
            ] as CFDictionary) else { return nil }
            let out = NSMutableData()
            guard let dest = CGImageDestinationCreateWithData(out, UTType.png.identifier as CFString, 1, nil) else { return nil }
            CGImageDestinationAddImage(dest, image, nil)
            guard CGImageDestinationFinalize(dest) else { return nil }
            if out.length <= limit { return out as Data }
        }
        return nil
    }

    // MARK: The copy's text

    /// A board's readable copy: its title, then its words, a paragraph each, as written (what the
    /// page shows when it has no picture yet, and what describes the picture).
    nonisolated static func body(title: String, words: [String]) -> String {
        ([title] + words.map(escaped)).joined(separator: "\n\n")
    }

    /// A word on the board as plain text in markdown: "# Goals" is a heading on the board's page
    /// otherwise, "1. Plan" a list and "*idea*" in italics.
    nonisolated static func escaped(_ text: String) -> String {
        var out = ""
        for c in text {
            if "\\`*_[]<>#|~!&".contains(c) { out.append("\\") }
            out.append(c)
        }
        if let first = out.first, "-+=".contains(first) { out = "\\" + out }
        if let m = out.firstMatch(of: /^(\d+)([.)])/) { out = String(m.1) + "\\" + String(m.2) + out[m.range.upperBound...] }
        return out
    }
}
