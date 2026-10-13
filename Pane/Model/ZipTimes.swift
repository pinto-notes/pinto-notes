import Foundation
import ZIPFoundation

/// A .zip keeps each file's time as the wall clock read where it was made (Finder, `zip`, Windows),
/// with no time zone. ZIPFoundation reads and writes that clock as UTC, so in Sweden an unzipped
/// note came in two hours late and an exported one read two hours early everywhere else (Air test
/// 2026-10-13). These unzip and zip with the clock read as this Mac's own, as every other tool does.
enum ZipTimes {
    /// Unzips `zip` into `dest`, each file at the time it was made.
    static func unzip(_ zip: URL, to dest: URL) throws {
        try FileManager.default.unzipItem(at: zip, to: dest)
        shift(dest) { local(fromStored: $0) }
    }

    /// Zips `folder` (itself, with what's in it) to `zip`, each file's time stored as its local time
    /// of day. The folder's own files are changed to do it: zip only a copy made for the purpose.
    static func zip(_ folder: URL, to zip: URL) throws {
        shift(folder) { stored(fromLocal: $0) }
        try FileManager.default.zipItem(at: folder, to: zip, shouldKeepParent: true)
    }

    /// The moment whose local wall clock reads what `date` reads in UTC (unzipping).
    static func local(fromStored date: Date, in zone: TimeZone = .current) -> Date { convert(date, from: .gmt, to: zone) }

    /// The moment whose UTC wall clock reads what `date` reads here (zipping).
    static func stored(fromLocal date: Date, in zone: TimeZone = .current) -> Date { convert(date, from: zone, to: .gmt) }

    private static func convert(_ date: Date, from: TimeZone, to: TimeZone) -> Date {
        var a = Calendar(identifier: .gregorian)
        a.timeZone = from
        var b = a
        b.timeZone = to
        return b.date(from: a.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)) ?? date
    }

    private static func shift(_ folder: URL, by change: (Date) -> Date) {
        let items = FileManager.default.enumerator(at: folder, includingPropertiesForKeys: [.contentModificationDateKey])
        while let url = items?.nextObject() as? URL {
            guard let time = try? url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate else { continue }
            try? FileManager.default.setAttributes([.modificationDate: change(time)], ofItemAtPath: url.path)
        }
    }
}
