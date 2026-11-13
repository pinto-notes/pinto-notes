/// Equatable through a hand-written `isEqual`, for a type that compares only some of its values.
///
/// Write `static func isEqual(_ a: Self, _ b: Self) -> Bool` and conform to this instead of
/// writing `static func ==` on the type. A `==` declared on a type ties every file that uses `==`
/// to that type, so adding even a private function to it rebuilds all of them: one private
/// function in NoteListView rebuilt 246 of the app's 268 files and every test file (about 60 s,
/// against 23 s for a change inside a function). Declared once here, `==` keeps each type's
/// changes to the files that use it.
protocol CustomEquatable: Equatable {
    static func isEqual(_ a: Self, _ b: Self) -> Bool
}

extension CustomEquatable {
    static func == (a: Self, b: Self) -> Bool { isEqual(a, b) }
}
