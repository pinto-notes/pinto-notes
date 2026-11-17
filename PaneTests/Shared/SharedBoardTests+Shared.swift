import Automerge
import CryptoKit
import Foundation
import SwiftData
import Testing
#if os(macOS)
import AppKit
#endif
@testable import Pane

/// The SharedBoardTests suite's declaration, and the helpers of it that tests in other test targets
/// use (a test target can't see another's code): its people, and a board's shapes, scenes and
/// pictures as the shared document keeps them. Its tests are in PaneTests/Collab/SharedBoardTests.swift.
@MainActor @Suite struct SharedBoardTests {
    let people = BoardPeople()
    var server: MemoryCollabServer { people.server }
    typealias Device = BoardPeople.Device

    /// A shape as the board's engine keeps it (the fields the document and the rule read).
    static func shape(_ id: String, x: Double = 0, y: Double = 0, version: Int = 1, nonce: Int = 1, index: String = "a0", text: String? = nil, type: String = "rectangle") -> [String: Any] {
        var e: [String: Any] = ["id": id, "type": type, "x": x, "y": y, "width": 120, "height": 60, "angle": 0, "version": version, "versionNonce": nonce,
                                "index": index, "isDeleted": false, "seed": 7, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
                                "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100, "groupIds": [String](), "boundElements": NSNull(),
                                "updated": 1, "link": NSNull(), "locked": false]
        if let text { e["text"] = text }
        return e
    }

    static func scene(_ elements: [[String: Any]]) -> [String: Any] {
        CollabBoard.scene(elements: elements, settings: ["viewBackgroundColor": "#ffffff"])
    }

    /// A picture as the board keeps it: `bytes` of data (a 1×1 PNG when 0).
    static func picture(_ id: String, bytes: Int = 0) -> [String: Any] {
        let b64 = bytes == 0 ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            : Data((0..<bytes).map { UInt8(truncatingIfNeeded: $0 &* 31) }).base64EncodedString()
        return ["id": id, "dataURL": "data:image/png;base64," + b64, "mimeType": "image/png", "created": 1]
    }

    /// An image element showing the picture `file`.
    static func image(_ id: String, file: String, index: String = "a1", deleted: Bool = false) -> [String: Any] {
        var e = shape(id, x: 300, index: index, type: "image")
        e["fileId"] = file
        e["status"] = "saved"
        e["scale"] = [1, 1]
        if deleted { e["isDeleted"] = true }
        return e
    }
}
