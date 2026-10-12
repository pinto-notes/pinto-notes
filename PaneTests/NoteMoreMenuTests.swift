import Testing
@testable import Pane

/// The note's More (…) menu: two groups in the order the owner asked for on 2026-10-11,
/// "Pin Note, Lock Note, Make It an App…" then "Move to…, Show Version History…, Delete Note".
@Suite struct NoteMoreMenuTests {
    func groups(locked: Bool = false, vaultOpen: Bool = false, trashed: Bool = false, hasApp: Bool = false, linkedFrom: Bool = false,
                phone: Bool = false, dev: Bool = false) -> [[NoteMoreMenu.Item]] {
        NoteMoreMenu.groups(locked: locked, vaultOpen: vaultOpen, trashed: trashed, hasApp: hasApp, appsEnabled: true, linkedFrom: linkedFrom, phone: phone, dev: dev)
    }

    @Test func aPlainNoteOnTheMac() {
        #expect(groups() == [[.pin, .lock, .makeApp], [.moveTo, .history, .delete]])
    }

    @Test func theSameOrderOnIPhoneWithSharingInTheSecondGroup() {
        #expect(groups(phone: true) == [[.pin, .lock, .makeApp], [.moveTo, .share, .history, .delete]])
    }

    @Test func whatANoteIsChangesTheFirstGroupOnly() {
        #expect(groups(hasApp: true) == [[.pin, .lock, .appInfo], [.moveTo, .history, .delete]])
        #expect(groups(linkedFrom: true) == [[.pin, .lock, .makeApp], [.moveTo, .linkedFrom, .history, .delete]])
        // A locked note that is open can be locked again or have its lock removed; closed, neither.
        #expect(groups(locked: true, vaultOpen: true) == [[.pin, .lockNow, .removeLock], [.moveTo, .delete]])
        #expect(groups(locked: true) == [[.pin], [.moveTo, .delete]])
        // In Recently Deleted a note can only come back or go for good, like Notes (2026-10-12).
        #expect(groups(trashed: true) == [[.recover, .delete]])
        #expect(groups(locked: true, trashed: true) == [[.recover, .delete]])
        #expect(NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: false, appsEnabled: true, linkedFrom: false, nested: true, phone: false, dev: false)[1] == [.moveTo, .moveOut, .history, .delete])
        #expect(groups(dev: true).first == [.pin, .lock, .makeApp, .devImportApp])
    }
}
