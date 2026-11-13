import Foundation
import SwiftData
import Testing
@testable import Pane

/// Sharing with people in release 1.3: on for everyone signed in, with true words, and nothing
/// offered for a shared note that isn't proven end to end (files, apps, a lock, Version History,
/// a public web page of everyone's text). See SharedNoteLimits.
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
        var lines: [String] = [ShareCopy.privacy, ShareCopy.notSharedYet, ShareCopy.leaveMessage, SharedNoteLimits.appLine, SharedNoteLimits.filesLine,
                               SharedNoteLimits.filesTitle, SharedNoteLimits.filesMessage, SharedNoteLimits.pageLine]
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

    /// A note with files or an app isn't shared with people: Share Link and the link switch say
    /// why and ask the server nothing. A plain note is shared as before.
    @Test func aNoteWithFilesOrAnAppIsNotSharedWithPeople() async {
        let photo = Note(body: "Packing\n![beach.jpg](pane-file:0a000000-0000-4000-8000-0000000000f1)\n")
        let backend = SampleShare(Self.alone())
        let share = ShareController(note: photo, backend: backend, hasApp: { false })
        #expect(share.notYet == SharedNoteLimits.filesLine)
        await share.shareLink()
        await share.setAccess(.edit)
        #expect(backend.calls.isEmpty)
        #expect(share.state.problem == SharedNoteLimits.filesLine && share.sharing == nil)
        // Turning a link off is never refused.
        await share.setAccess(.off)
        #expect(backend.calls.isEmpty)

        let app = ShareController(note: Note(body: "Habit tracker\n"), backend: SampleShare(Self.alone()), hasApp: { true })
        #expect(app.notYet == SharedNoteLimits.appLine)

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

    /// No file or photo goes into a shared note (the others couldn't open it); a locked one takes
    /// none either. An ordinary note does.
    @Test func filesGoOnlyIntoNotesOfYourOwn() {
        let mine = Note(body: "Mine")
        let shared = Note(body: "Ours")
        shared.sharedNoteID = UUID()
        #expect(SharedNoteLimits.allowsFiles(mine))
        #expect(!SharedNoteLimits.allowsFiles(shared))
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
