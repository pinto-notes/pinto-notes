#if os(macOS)
import SwiftData
import Testing
@testable import Pane

/// Move to menus nest folders as the sidebar does (Emil, 4 November 2026: "Claude Code / Codex"
/// sat in Brain but the menu listed it flat beside the top folders).
@MainActor @Suite struct FolderMenuTests {
    @Test func aSubfolderSitsInsideItsParentInTheMoveToMenu() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let brain = Folder(name: "Brain", sortIndex: 0), journal = Folder(name: "Journal", sortIndex: 1), life = Folder(name: "Life", sortIndex: 2)
        let codex = Folder(name: "Claude Code / Codex", parent: brain, sortIndex: 0)
        for f in [brain, journal, life, codex] { ctx.insert(f) }
        try ctx.save()
        let tree = FolderMenuItems.tree(ctx.allFolders())
        #expect(tree.map(\.folder.name) == ["Brain", "Journal", "Life"], "top folders only, in the sidebar's order")
        #expect(tree.first?.children.map(\.folder.name) == ["Claude Code / Codex"], "the subfolder is inside Brain")
        #expect(tree.dropFirst().allSatisfy { $0.children.isEmpty })
    }
}
#endif
