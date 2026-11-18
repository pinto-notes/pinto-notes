import Foundation
import SwiftData
import Testing
@testable import Pane

/// Sharing with people in release 1.3: on for everyone signed in, with true words, and nothing
/// offered for a shared note that isn't proven end to end (apps, a lock, Version History, a public
/// web page of everyone's text). Files and photos are (SharedFilesTests). See SharedNoteLimits.
@MainActor @Suite(.serialized) struct SharedNoteLimitsTests {
    static let me = CollabGallery.emil

    static func alone() -> ShareState { ShareState(people: [.init(id: me, name: "Emil Wagman", isMe: true, role: "owner")]) }

    /// No launch argument and no default: sharing with people is on in the sharing update for
    /// everyone signed in (it was off in Mac 1.3), and a stray old default doesn't turn it off.
    @Test func sharingWithPeopleIsOnInThisRelease() {
        let forced = CollabFeature.forced
        defer { CollabFeature.forced = forced }
        CollabFeature.forced = nil
        UserDefaults.standard.set(false, forKey: "collabEnabled")
        defer { UserDefaults.standard.removeObject(forKey: "collabEnabled") }
        #expect(CollabFeature.released)
        #expect(CollabFeature.isOn)
        #expect(CollabStore.isOn)
    }

    /// A shared note open in its own Mac window stayed open on "This note was deleted" once you
    /// were removed: only the main window let go of it. Its window closes now, unless it has moved
    /// on to another note (a link followed in it).
    @Test func aSharedNotesOwnWindowClosesWhenYoureNoLongerInIt() {
        let plan = UUID(), other = UUID()
        #expect(NoteWindows.closes(window: plan, showing: nil, removed: [plan]))
        #expect(!NoteWindows.closes(window: plan, showing: nil, removed: [other]))
        #expect(NoteWindows.closes(window: plan, showing: other, removed: [other]))
        #expect(!NoteWindows.closes(window: plan, showing: other, removed: [plan]), "it shows another note now")
    }

    /// The server can hold a copy of a standard account's key, so nothing about a shared note may
    /// say "end-to-end". What it does say is true either way.
    @Test func theWordsNeverPromiseEndToEnd() {
        var lines: [String] = [ShareCopy.privacy, ShareCopy.notSharedYet, ShareCopy.leaveMessage, SharedNoteLimits.appLine, SharedNoteLimits.pageLine,
                               SharedFiles.Problem.notHere.errorDescription ?? ""]
        lines += ShareState.Access.allCases.map { ShareCopy.link($0) }
        #if os(macOS)
        lines += ShareWays.Way.allCases.map { ShareWays.line($0, shared: false) }
        lines += ShareWays.Way.allCases.map { ShareWays.line($0, shared: true, sharedWithPeople: true) }
        #endif
        for line in lines {
            let l = line.lowercased()
            #expect(!l.contains("end-to-end") && !l.contains("end to end"), "\(line)")
        }
        #expect(ShareCopy.privacy.hasPrefix("Encrypted."))
        #expect(ShareCopy.privacy.contains("Only people in this note can read it."))
    }

    /// A note with an app isn't shared with people: Share Link and the link switch say why and ask
    /// the server nothing. A note with files or photos is shared like a plain one (its files go
    /// with it, SharedFiles).
    @Test func aNoteWithAnAppIsNotSharedWithPeopleButOneWithFilesIs() async {
        let app = ShareController(note: Note(body: "Habit tracker\n"), backend: SampleShare(Self.alone()), hasApp: { true })
        #expect(app.notYet == SharedNoteLimits.appLine)
        let appBackend = SampleShare(Self.alone())
        let appShare = ShareController(note: Note(body: "Habit tracker\n"), backend: appBackend, hasApp: { true })
        await appShare.shareLink()
        #expect(appBackend.calls.isEmpty && appShare.state.problem == SharedNoteLimits.appLine && appShare.sharing == nil)
        // Turning a link off is never refused.
        await appShare.setAccess(.off)
        #expect(appBackend.calls.isEmpty)

        let photoBackend = SampleShare(Self.alone())
        let photo = ShareController(note: Note(body: "Lasagne\n![lasagne.jpg](pane-file:0a000000-0000-4000-8000-0000000000f1)\n"), backend: photoBackend, hasApp: { false })
        #expect(photo.notYet == nil)
        await photo.shareLink()
        #expect(photoBackend.calls == ["access Can edit"] && photo.sharing != nil)

        let plainBackend = SampleShare(Self.alone())
        let plain = ShareController(note: Note(body: "Groceries\n- [ ] Milk\n"), backend: plainBackend, hasApp: { false })
        #expect(plain.notYet == nil)
        await plain.shareLink()
        #expect(plainBackend.calls == ["access Can edit"] && plain.sharing != nil)
    }

    /// Once a note is shared, the question is past: a member never sees it, nor does the owner of
    /// a note shared already (its files stay theirs to remove).
    @Test func aSharedNoteIsPastTheQuestion() {
        #expect(SharedNoteLimits.notYet(text: "![a](pane-file:0a000000-0000-4000-8000-0000000000f1)", hasApp: true, alreadyShared: true) == nil)
        let member = ShareController(note: Note(body: "![a](pane-file:0a000000-0000-4000-8000-0000000000f1)"),
                                     backend: SampleShare(ShareControllerTests.member()), hasApp: { true })
        #expect(member.notYet == nil)
        #expect(SharedNoteLimits.hasFiles("[report.pdf](pane-file:0a000000-0000-4000-8000-0000000000f1)"))
        #expect(!SharedNoteLimits.hasFiles("A note about pane-file: links"))
    }

    /// Files and photos go into a shared note you can edit, as into a note of your own; not into
    /// one you can only view, nor a locked note.
    @Test func filesGoIntoSharedNotesYouCanEdit() {
        let mine = Note(body: "Mine")
        let shared = Note(body: "Ours")
        shared.sharedNoteID = UUID()
        #expect(SharedNoteLimits.allowsFiles(mine))
        #expect(SharedNoteLimits.allowsFiles(shared))
        #expect(SharedNoteLimits.allowsFiles(shared, viewOnly: false))
        #expect(!SharedNoteLimits.allowsFiles(shared, viewOnly: true))
        // Your own note is never view only.
        #expect(SharedNoteLimits.allowsFiles(mine, viewOnly: true))
    }

    #if os(iOS)
    /// Join on a shared note's link opens the note while the Join alert is still closing; on the
    /// iPhone that push was dropped and the note stayed unopened. It waits for the alert, for three
    /// seconds at most, and only where one screen shows at a time. The real-app check is
    /// scripts/collab-two-simulators.ts ("Sara opens the link, joins, and has the note").
    @Test func aJoinedNoteOpensOnceTheAlertHasGone() {
        #expect(Presentation.waitsToOpen(compact: true, presenting: true, waited: 0))
        #expect(Presentation.waitsToOpen(compact: true, presenting: true, waited: 29))
        #expect(!Presentation.waitsToOpen(compact: true, presenting: true, waited: 30))
        #expect(!Presentation.waitsToOpen(compact: true, presenting: false, waited: 0))
        #expect(!Presentation.waitsToOpen(compact: false, presenting: true, waited: 0))
    }
    #endif

    #if os(macOS)
    /// The Share popover: a shared note has no Web Page to make (it would publish everyone's text);
    /// a page made before it was shared is listed, with what it is.
    @Test func aSharedNoteGetsNoWebPage() {
        #expect(ShareWays.ways(collaborating: true, sharedWithPeople: true) == [.people, .copy])
        #expect(ShareWays.ways(collaborating: true, sharedWithPeople: true, webShared: true) == [.people, .copy, .link])
        #expect(ShareWays.ways(collaborating: true) == [.people, .copy, .link])
        #expect(ShareWays.line(.link, shared: true, sharedWithPeople: true) == SharedNoteLimits.pageLine)
        // A note that can't be shared with people opens on what it can do.
        #expect(ShareWays.initial(collaborating: true, inNote: 1, linkOn: false, webShared: false, linkAvailable: true, canCollaborate: false) == .link)
        #expect(ShareWays.initial(collaborating: true, inNote: 1, linkOn: false, webShared: false, linkAvailable: false, canCollaborate: false) == .copy)
    }
    #endif

    /// The publisher itself refuses a shared note: no readable copy of its text is made, whatever
    /// asks for one (Copy Link on an old page republishes).
    @Test func noReadableCopyOfASharedNote() throws {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, SharedDocument.self,
                                           configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = container.mainContext
        let note = Note(body: "Groceries\n- [ ] Milk\n")
        context.insert(note)
        #expect(SharePublisher.copy(of: note.id, includeSubNotes: false, in: context)?.body == note.body)
        note.sharedNoteID = note.id
        #expect(SharePublisher.copy(of: note.id, includeSubNotes: false, in: context) == nil)
    }
}
