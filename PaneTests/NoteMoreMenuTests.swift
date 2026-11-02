import Testing
@testable import Pane

/// The note's More (…) menu: the groups the owner asked for on 2026-10-11, "Pin Note, Lock Note,
/// Make It an App…" then "Move to…, Version History…", grouped as Apple Notes groups it (Emil,
/// 2 November 2026): Open Note in New Window first on the Mac, Delete on its own at the end.
@Suite struct NoteMoreMenuTests {
    func groups(locked: Bool = false, vaultOpen: Bool = false, trashed: Bool = false, hasApp: Bool = false,
                phone: Bool = false, dev: Bool = false, inOwnWindow: Bool = false) -> [[NoteMoreMenu.Item]] {
        NoteMoreMenu.groups(locked: locked, vaultOpen: vaultOpen, trashed: trashed, hasApp: hasApp, appsEnabled: true, phone: phone, dev: dev,
                            inOwnWindow: inOwnWindow)
    }

    @Test func aPlainNoteOnTheMac() {
        #expect(groups() == [[.openInNewWindow], [.pin, .lock, .makeApp], [.moveTo, .history], [.delete]])
    }

    /// In the note's own window there's no other window to open it in.
    @Test func itsOwnWindowOffersNoOther() {
        #expect(groups(inOwnWindow: true) == [[.pin, .lock, .makeApp], [.moveTo, .history], [.delete]])
        #expect(!groups(locked: true, vaultOpen: true, inOwnWindow: true).joined().contains(.openInNewWindow))
    }

    /// Share has its own button beside More on iPhone (as in Notes, 28 October 2026), so it isn't
    /// in the menu too: the same menu as the Mac's.
    @Test func theSameMenuOnIPhoneWithSharingBesideIt() {
        #expect(groups(phone: true) == [[.pin, .lock, .makeApp], [.moveTo, .history], [.delete]])
        #expect(!groups(phone: true).joined().contains(.share))
    }

    @Test func whatANoteIsChangesTheFirstGroupOnly() {
        #expect(groups(hasApp: true) == [[.openInNewWindow], [.pin, .lock, .appInfo], [.moveTo, .history], [.delete]])
        // A locked note that is open can be locked again or have its lock removed; closed, neither.
        #expect(groups(locked: true, vaultOpen: true) == [[.openInNewWindow], [.pin, .lockNow, .removeLock], [.moveTo], [.delete]])
        #expect(groups(locked: true) == [[.openInNewWindow], [.pin], [.moveTo], [.delete]])
        // In Recently Deleted a note can only come back or go for good, like Notes (2026-10-12).
        #expect(groups(trashed: true) == [[.recover, .delete]])
        #expect(groups(locked: true, trashed: true) == [[.recover, .delete]])
        #expect(groups(dev: true)[1] == [.pin, .lock, .makeApp, .devImportApp])
        // Delete is always last, alone, as in Notes.
        for locked in [false, true] { #expect(groups(locked: locked).last == [.delete]) }
    }
}
