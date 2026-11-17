#if os(macOS)
import AppKit

extension NSTableView {
    /// Whether `row` is a section heading (a group row) rather than a note or file.
    func isHeadingRow(_ row: Int) -> Bool {
        if let view = rowView(atRow: row, makeIfNecessary: true) { return view.isGroupRowStyle }
        return delegate?.tableView?(self, isGroupRow: row) ?? false
    }
}
#endif
