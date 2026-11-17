import Foundation

/// Files from the checkout that tests read, copied into the test bundle when it's built
/// (project.yml, PaneTests' resources). Never read through `#filePath`: a checkout under
/// ~/Documents made macOS ask whether the test host may read the Documents folder, and the test
/// waited on that question, a dialog on whoever's screen it was, until someone answered.
enum TestFiles {
    private final class Token {}
    static let bundle = Bundle(for: Token.self)

    /// A file or folder at the top of the bundle's resources, by its name there
    /// ("note-pages", "amber-base.ts", "Views").
    static func url(_ name: String) throws -> URL {
        guard let url = bundle.resourceURL?.appending(path: name), FileManager.default.fileExists(atPath: url.path(percentEncoded: false)) else {
            throw CocoaError(.fileNoSuchFile, userInfo: [NSFilePathErrorKey: name])
        }
        return url
    }

    /// The demo note apps (demo/note-pages in the checkout).
    static var notePages: URL { get throws { try url("note-pages") } }

    static func text(_ name: String) throws -> String { try String(contentsOf: url(name), encoding: .utf8) }
}
