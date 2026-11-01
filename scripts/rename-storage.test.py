#!/usr/bin/env python3
"""Check the Swift module rename with a temporary store and the app's real model declarations.

No app, windows, backend or installed library is opened. Two small command-line programs use
only a new temporary directory, first as module Pane, then PintoNotes, then Pane again.
"""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent


def model_prefix(source, name):
    """Keep stored properties and the initializer; UI and sync helpers do not define the schema."""
    start = source.index("@Model\nfinal class " + name + " {")
    init = source.index("    init(", start)
    opening = source.index("{", init)
    depth = 1
    end = opening + 1
    while depth:
        depth += (source[end] == "{") - (source[end] == "}")
        end += 1
    return source[start:end] + "\n}\n"


def check():
    models = (ROOT / "PintoNotes/Model/Models.swift").read_text()
    files = (ROOT / "PintoNotes/Model/Files.swift").read_text()
    source = "import Foundation\nimport SwiftData\n"
    source += "enum NoteSummaries { static func install() {} }\n"
    source += model_prefix(models, "Folder") + model_prefix(models, "Note")
    source += model_prefix(files, "Attachment")
    source += r'''
@main struct Check {
    @MainActor static func main() throws {
        let url = URL(fileURLWithPath: CommandLine.arguments[1])
        let schema = Schema([Folder.self, Note.self, Attachment.self])
        let config = ModelConfiguration(schema: schema, url: url, cloudKitDatabase: .none)
        let container = try ModelContainer(for: schema, configurations: [config])
        let context = container.mainContext
        context.autosaveEnabled = false
        if CommandLine.arguments[2] == "seed" {
            let folder = Folder(name: "Synthetic rename fixture")
            context.insert(folder)
            let note = Note(body: "Before the module rename", folder: folder)
            note.isPinned = true
            note.serverVersion = 42
            context.insert(note)
            let file = Attachment(filename: "fixture.txt", contentType: "public.plain-text", size: 12)
            file.folderID = folder.id
            context.insert(file)
            try context.save()
        } else {
            let notes = try context.fetch(FetchDescriptor<Note>())
            let folders = try context.fetch(FetchDescriptor<Folder>())
            let files = try context.fetch(FetchDescriptor<Attachment>())
            precondition(notes.count == 1 && folders.count == 1 && files.count == 1)
            let note = notes[0], folder = folders[0], file = files[0]
            precondition(note.folder?.id == folder.id && folder.notes.first?.id == note.id)
            precondition(file.folderID == folder.id && file.filename == "fixture.txt")
            precondition(note.isPinned && note.serverVersion == 42)
            if CommandLine.arguments[2] == "update" {
                precondition(note.body == "Before the module rename")
                note.body = "After the module rename"
                try context.save()
            } else {
                precondition(note.body == "After the module rename")
            }
        }
    }
}
'''
    env = os.environ.copy()
    env.setdefault("DEVELOPER_DIR", "/Applications/Xcode.app/Contents/Developer")
    with tempfile.TemporaryDirectory(prefix="pinto-module-store-") as tmp:
        tmp = Path(tmp)
        swift = tmp / "Models.swift"
        swift.write_text(source)
        for module in ["Pane", "PintoNotes"]:
            subprocess.run(["xcrun", "swiftc", "-parse-as-library", "-module-name", module,
                            str(swift), "-o", str(tmp / module)], env=env, check=True)
        for module, operation in [("Pane", "seed"), ("PintoNotes", "update"), ("Pane", "verify")]:
            subprocess.run([str(tmp / module), str(tmp / "Pane.store"), operation], check=True)
    print("SwiftData module rename: existing notes, relationships and attachment metadata round-trip")


if __name__ == "__main__":
    check()
