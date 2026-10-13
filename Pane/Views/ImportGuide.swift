import SwiftUI

/// DESIGN STUDY (2026-10-12, not wired into the app): the guided import, one sheet of pages per
/// source. An intro that says what will happen, a few guide pages with a picture each and the link
/// that opens the right place, a page to drop the file on, and a page that says what came.
/// Someone who already has the file skips to the drop page. One filled button per page.

/// A source's guide: the words and pictures of each page.
struct ImportGuide: Identifiable {
    var id: String
    var origin: ImportOrigin
    var name: String
    /// "Bring your Google Keep notes"
    var introTitle: String
    var introLine: String
    /// What the intro's quiet link says ("I already have the download").
    var skipTitle: String
    var steps: [Step]
    var drop: Drop
    var success: (count: Int, line: String)
    var wrongFile: (title: String, line: String)

    struct Step {
        var title: String
        var text: String
        var art: Art
        /// The link this step opens, said on its button ("Open Google Takeout").
        var action: String?
    }

    struct Drop {
        var title: String
        var line: String
        var choose: String
        /// The file as it was downloaded, as found ("takeout-20261012T101500Z-001.zip").
        var found: (name: String, detail: String, button: String)?
        var fileSymbol: String
    }

    enum Art {
        case drawn(Drawn)
        /// A real screenshot, with the things to set ringed (in fractions of the picture) and named.
        case picture(URL, rings: [(CGRect, String?)] = [])
        case none
    }

    enum Drawn {
        case takeoutPick, takeoutCreate, takeoutEmail
        case evernoteExport, evernoteFormat
        case bearSelect, bearExport
        case obsidianReveal, obsidianFound
        case settingsAutomation, notesEmpty, macHandoff, notesShareOne
    }
}

extension ImportGuide {
    static let keep = ImportGuide(
        id: "keep", origin: .files(.keep), name: "Google Keep",
        introTitle: "Bring your Google Keep notes",
        introLine: "Google can give you a copy of all your notes as one download. It takes about five minutes, and nothing in Keep changes.",
        skipTitle: "I already have the download",
        steps: [
            Step(title: "Ask Google for your notes",
                 text: "The link opens Google's download page with only Keep ticked. Scroll down and click Next step.",
                 art: .drawn(.takeoutPick), action: "Open Google Takeout"),
            Step(title: "Click Create export",
                 text: "Leave the rest as it is. Google emails you in a few minutes. You can close this and come back.",
                 art: .drawn(.takeoutCreate), action: nil),
            Step(title: "Download it from the email",
                 text: "In Google's email, click Download archive. It goes to your Downloads folder.",
                 art: .drawn(.takeoutEmail), action: "Open Gmail"),
        ],
        drop: Drop(title: "Drop the download here",
                   line: "A file named takeout and some numbers, in your Downloads folder. No need to open it.",
                   choose: "Choose File…",
                   found: ("takeout-20261012T101500Z-001.zip", "In Downloads, 2 minutes ago", "Import 36 Notes"),
                   fileSymbol: "doc.zipper"),
        success: (36, "They're in a folder named Google Keep. Labels became folders inside it."),
        wrongFile: ("This isn't a Google Keep download",
                    "Look in Downloads for a file whose name starts with takeout. If Google's email hasn't come yet, give it a few more minutes."))

    static let evernote = ImportGuide(
        id: "evernote", origin: .files(.evernote), name: "Evernote",
        introTitle: "Bring your Evernote notes",
        introLine: "Evernote saves each notebook as a file you can bring here. About a minute per notebook, and nothing in Evernote changes.",
        skipTitle: "I already have the files",
        steps: [
            Step(title: "Export a notebook",
                 text: "Click Notebooks. By a notebook, click the three dots, then Export Notebook. The website can't do this; the app can.",
                 art: .drawn(.evernoteExport), action: "Open Evernote"),
            Step(title: "Save it as an ENEX file",
                 text: "Choose ENEX and click Export. Do this once for each notebook.",
                 art: .drawn(.evernoteFormat), action: nil),
        ],
        drop: Drop(title: "Drop the notebook files here",
                   line: "Files that end in .enex. Drop all of them at once; each becomes a folder.",
                   choose: "Choose Files…", found: nil, fileSymbol: "doc"),
        success: (1_489, "Each notebook is a folder of its own. Tags came too."),
        wrongFile: ("These aren't Evernote notebook files",
                    "In Evernote, choose ENEX when you export. The files end in .enex."))

    static func bear(picture: URL?) -> ImportGuide {
        ImportGuide(
            id: "bear", origin: .files(.bear), name: "Bear",
            introTitle: "Bring your Bear notes",
            introLine: "Bear can save all your notes into a folder in one go. It takes a minute, and nothing in Bear changes.",
            skipTitle: "I already have the folder",
            steps: [
                Step(title: "Select all your notes in Bear",
                     text: "Click Notes at the top of Bear's sidebar, then press Command-A.",
                     art: .drawn(.bearSelect), action: "Open Bear"),
                Step(title: "Save them as Markdown",
                     text: "Choose File, then Export Notes. Pick Markdown, tick Export attachments, and save into a new folder.",
                     art: picture.map { .picture($0, rings: [(CGRect(x: 0.485, y: 0.04, width: 0.5, height: 0.27), "Pick Markdown"),
                                                             (CGRect(x: 0.015, y: 0.74, width: 0.56, height: 0.24), "Tick it")]) } ?? .drawn(.bearExport),
                     action: nil),
            ],
            drop: Drop(title: "Drop the folder here",
                       line: "The folder you just saved. Pictures inside it come too.",
                       choose: "Choose Folder…", found: nil, fileSymbol: "folder"),
            success: (412, "They're in a folder named Bear. Tags stay in the text, as you wrote them."),
            wrongFile: ("There are no Bear notes in this folder",
                        "Choose the folder you exported into. If it's empty, export again and pick Markdown."))
    }

    static func obsidian(picture: URL?) -> ImportGuide {
        ImportGuide(
            id: "obsidian", origin: .files(.obsidian), name: "Obsidian",
            introTitle: "Bring your Obsidian notes",
            introLine: "Your notes are already files on this Mac, so there's nothing to export. Obsidian stays as it is.",
            skipTitle: "I know where my vault is",
            steps: [
                Step(title: "Find your vault",
                     text: "Your vault is the folder your notes live in. In Obsidian, right-click any note and choose Reveal in Finder.",
                     art: picture.map { .picture($0, rings: [(CGRect(x: 0.235, y: 0.4, width: 0.7, height: 0.17), nil)]) } ?? .drawn(.obsidianReveal),
                     action: "Open Obsidian"),
            ],
            drop: Drop(title: "Drop your vault here",
                       line: "The whole folder. Subfolders, pictures and links between notes come too.",
                       choose: "Choose Folder…",
                       found: ("Second brain", "Your vault in Documents, 1,126 notes", "Import Second brain"),
                       fileSymbol: "folder"),
            success: (1_126, "Your vault is a folder named Second brain. Links between notes still work."),
            wrongFile: ("There are no notes in this folder",
                        "Choose the vault folder itself: the one with your notes and a hidden .obsidian folder inside."))
    }

    static let markdown = ImportGuide(
        id: "markdown", origin: .files(.markdown), name: "Markdown or text files",
        introTitle: "Bring Markdown or text files",
        introLine: "Notes saved as files from Notion, Joplin, Logseq or any other app. Markdown is plain text with simple marks for headings and lists.",
        skipTitle: "",
        steps: [],
        drop: Drop(title: "Drop a folder or .zip here",
                   line: "Files that end in .md or .txt. Each folder becomes a folder here.",
                   choose: "Choose Folder or .zip…", found: nil, fileSymbol: "doc.text"),
        success: (363, "They're in a folder named Notion export, subfolders and pictures included."),
        wrongFile: ("No notes in this one",
                    "Choose a folder or .zip with .md or .txt files in it."))

    #if os(iOS)
    /// On iPhone the Takeout download lands in Files, and the drop page is a button.
    static let keepPhone: ImportGuide = {
        var g = keep
        g.steps[2].text = "Open Google's email and tap Download archive. Safari saves it in Files, in Downloads."
        g.drop = Drop(title: "Choose the download",
                      line: "In Files, Downloads: a file named takeout and some numbers. No need to open it.",
                      choose: "Choose File", found: nil, fileSymbol: "doc.zipper")
        return g
    }()

    /// On iPhone a vault lives in Files, usually in iCloud Drive's Obsidian folder.
    static func obsidianPhone(picture: URL?) -> ImportGuide {
        var g = obsidian(picture: nil)
        g.introLine = "Your notes are already files, so there's nothing to export. Obsidian stays as it is."
        g.steps = [Step(title: "Find your vault in Files",
                        text: "Open Files, then iCloud Drive, then Obsidian. Each folder in there is a vault.",
                        art: picture.map { .picture($0) } ?? .none, action: "Open Files")]
        g.drop = Drop(title: "Choose your vault",
                      line: "The whole folder. Subfolders, pictures and links between notes come too.",
                      choose: "Choose Folder", found: nil, fileSymbol: "folder")
        return g
    }
    #endif
}

// MARK: The sheet

/// One page of a guide, as the sheet shows it.
enum ImportGuidePage: Equatable {
    case intro
    case step(Int)
    case drop(DropState)
    case importing(done: Int, total: Int)
    case success

    enum DropState: Equatable { case empty, hovering, found, wrong }
}

/// The two layouts weighed: the picture over the words, or beside them.
enum ImportGuideLayout { case stacked, beside }

struct ImportGuideSheet: View {
    var guide: ImportGuide
    var page: ImportGuidePage
    var layout: ImportGuideLayout = .stacked
    /// The step's link was opened: Next takes the filled button.
    var opened = false

    #if os(iOS)
    static let compact = true
    #else
    static let compact = false
    #endif

    /// Every page is the same size, so moving between them never changes the sheet's height.
    static func size(_ layout: ImportGuideLayout) -> CGSize {
        layout == .stacked ? CGSize(width: 540, height: 560) : CGSize(width: 760, height: 440)
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            content
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        #if os(macOS)
        .frame(width: Self.size(layout).width, height: Self.size(layout).height)
        #endif
        .foregroundStyle(Color.ink)
        .background(Color(Palette.sheetGround))
        .tint(Color(Palette.amber))
    }

    // MARK: Parts

    private var pageCount: Int { guide.steps.count + 2 }
    private var pageIndex: Int {
        switch page {
        case .intro: 0
        case .step(let i): i + 1
        case .drop, .importing: guide.steps.count + 1
        case .success: guide.steps.count + 2
        }
    }

    private var topBar: some View {
        HStack {
            if case .intro = page {
                Color.clear.frame(width: 1, height: 1)
            } else if case .success = page {
                Color.clear.frame(width: 1, height: 1)
            } else {
                Button { } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                        Text("Back")
                    }
                }
                .buttonStyle(.hoverText)
                .foregroundStyle(Color.muted)
            }
            Spacer()
            if pageIndex <= pageCount - 1, !guide.steps.isEmpty {
                HStack(spacing: 6) {
                    ForEach(0..<pageCount, id: \.self) { i in
                        Capsule()
                            .fill(i == pageIndex ? Color(Palette.amber) : Color.line)
                            .frame(width: i == pageIndex ? 18 : 6, height: 6)
                    }
                }
                .accessibilityHidden(true)
            }
            Spacer()
            Button { } label: {
                Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                    .frame(width: 26, height: 26)
                    .background(Color.line.opacity(0.6), in: .circle)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close")
        }
        .frame(height: 30)
        .padding(.horizontal, Self.compact ? 20 : 18)
        .padding(.top, Self.compact ? 14 : 14)
    }

    @ViewBuilder private var content: some View {
        switch page {
        case .intro: intro
        case .step(let i): step(guide.steps[i], number: i + 1)
        case .drop(let state): drop(state)
        case .importing(let done, let total): importing(done, total)
        case .success: success
        }
    }

    private var intro: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            ImportSourceIcon(origin: guide.origin, size: Self.compact ? 84 : 76)
                .padding(.bottom, 22)
            Text(guide.introTitle)
                .font(.display(Self.compact ? 30 : 28))
                .tracking(Palette.tracking(28))
                .multilineTextAlignment(.center)
                .padding(.bottom, 10)
            Text(guide.introLine)
                .font(Self.compact ? .body : .system(size: 15))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 400)
            Spacer(minLength: 0)
            primary(guide.steps.isEmpty ? guide.drop.choose : "Show Me How")
            if !guide.skipTitle.isEmpty { quiet(guide.skipTitle) } else { quiet(" ").hidden() }
        }
        .padding(.horizontal, 40)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    @ViewBuilder
    private func step(_ s: ImportGuide.Step, number: Int) -> some View {
        let words = VStack(alignment: .leading, spacing: 8) {
            if guide.steps.count > 1 {
                Text("Step \(number) of \(guide.steps.count)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.muted)
            }
            Text(s.title).font(.system(size: Self.compact ? 24 : 21, weight: .bold)).tracking(-0.3)
            Text(s.text)
                .font(Self.compact ? .body : .system(size: 14))
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
                .lineSpacing(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        let buttons = VStack(spacing: 0) {
            if let action = s.action, !opened {
                primary(action, symbol: "arrow.up.right")
                quiet("Next")
            } else {
                primary(number == guide.steps.count ? "I Have It" : "Next")
                if let action = s.action { quiet("\(action) again") } else { quiet(" ").hidden() }
            }
        }

        if layout == .beside && !Self.compact {
            HStack(alignment: .top, spacing: 26) {
                art(s.art).frame(width: 380, height: 320)
                VStack(alignment: .leading, spacing: 0) {
                    words
                    Spacer(minLength: 12)
                    buttons
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, 12)
            .padding(.bottom, 26)
        } else {
            VStack(spacing: 0) {
                art(s.art)
                    .frame(height: Self.compact ? 300 : 236)
                    .padding(.top, 8)
                    .padding(.bottom, 20)
                words
                Spacer(minLength: 12)
                buttons
            }
            .padding(.horizontal, Self.compact ? 24 : 36)
            .padding(.bottom, Self.compact ? 12 : 26)
        }
    }

    /// "Choose Another Folder…", "Choose Other Files…"
    private var chooseAnother: String {
        guide.drop.choose.replacingOccurrences(of: "Choose", with: guide.drop.choose.contains("Files") ? "Choose Other" : "Choose Another")
    }

    private func drop(_ state: ImportGuidePage.DropState) -> some View {
        VStack(spacing: 0) {
            Text(state == .found ? "Found it" : guide.drop.title)
                .font(.system(size: Self.compact ? 24 : 21, weight: .bold)).tracking(-0.3)
                .padding(.top, 6)
            Text(state == .found ? "This looks like the one. Import it, or choose another." : guide.drop.line)
                .font(Self.compact ? .body : .system(size: 14))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 400)
                .padding(.top, 8)
            dropZone(state)
                .padding(.top, 20)
            Spacer(minLength: 12)
            switch state {
            case .found:
                primary(guide.drop.found?.button ?? "Import")
                quiet(chooseAnother)
            case .wrong:
                primary(chooseAnother)
                quiet(guide.steps.isEmpty ? " " : "Show me how again")
            default:
                primary(guide.drop.choose)
                quiet(guide.steps.isEmpty ? " " : "Show me how again").opacity(guide.steps.isEmpty ? 0 : 1)
            }
        }
        .padding(.horizontal, Self.compact ? 24 : 36)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    @ViewBuilder
    private func dropZone(_ state: ImportGuidePage.DropState) -> some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        let wrong = state == .wrong
        VStack(spacing: 12) {
            switch state {
            case .found:
                HStack(spacing: 14) {
                    fileIcon(guide.drop.fileSymbol, size: 46)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(guide.drop.found?.name ?? "").font(.system(size: 14, weight: .semibold)).lineLimit(1).truncationMode(.middle)
                        Text(guide.drop.found?.detail ?? "").font(.system(size: 12)).foregroundStyle(Color.muted)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 20)).foregroundStyle(Color(Palette.amber))
                }
                .padding(.horizontal, 20)
            case .wrong:
                Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 28)).foregroundStyle(Color(Palette.amber))
                Text(guide.wrongFile.title).font(.system(size: 15, weight: .semibold))
                Text(guide.wrongFile.line)
                    .font(.system(size: 13)).foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: 340)
            default:
                fileIcon(guide.drop.fileSymbol, size: 52)
                    .offset(y: state == .hovering ? -4 : 0)
                Text(Self.compact ? "Tap the button to choose it" : state == .hovering ? "Let go to import" : "Drag it here from Finder")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(state == .hovering ? Color(Palette.amberInk) : Color.muted)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: Self.compact ? 230 : 250)
        .background(state == .hovering ? Color(Palette.amberSoft) : Color(Palette.page).opacity(state == .found ? 1 : 0.55), in: shape)
        .overlay(
            shape.strokeBorder(state == .hovering ? Color(Palette.amber) : wrong ? Color(Palette.amber).opacity(0.6) : Color.line,
                               style: StrokeStyle(lineWidth: state == .hovering ? 2 : 1.5, dash: state == .found || wrong ? [] : [7, 5]))
        )
    }

    private func fileIcon(_ symbol: String, size: CGFloat) -> some View {
        Image(systemName: symbol)
            .font(.system(size: size * 0.62, weight: .light))
            .foregroundStyle(Color.muted)
            .frame(width: size, height: size)
    }

    private func importing(_ done: Int, _ total: Int) -> some View {
        VStack(spacing: 14) {
            Spacer(minLength: 0)
            ImportSourceIcon(origin: guide.origin, size: 64)
            Text("Bringing in your notes").font(.system(size: 21, weight: .bold)).tracking(-0.3)
            ProgressView(value: Double(done), total: Double(total))
                .frame(maxWidth: 300)
                .tint(Color(Palette.amber))
            Text("\(done.formatted(.number.locale(Locale(identifier: "en_US")))) of \(total.formatted(.number.locale(Locale(identifier: "en_US"))))").font(.system(size: 13)).foregroundStyle(Color.muted).monospacedDigit()
            Spacer(minLength: 0)
            quiet("Stop")
        }
        .padding(.horizontal, 36)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    private var success: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            ZStack(alignment: .bottomTrailing) {
                ImportSourceIcon(origin: guide.origin, size: 76)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 28))
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, Color(Palette.amberButton))
                    .background(Circle().fill(Color(Palette.sheetGround)).padding(-3))
                    .offset(x: 8, y: 6)
            }
            .padding(.bottom, 22)
            Text("\(guide.success.count.formatted(.number.locale(Locale(identifier: "en_US")))) notes from \(guide.name) are here")
                .font(.display(Self.compact ? 28 : 26))
                .tracking(Palette.tracking(26))
                .multilineTextAlignment(.center)
                .padding(.bottom, 10)
            Text(guide.success.line)
                .font(Self.compact ? .body : .system(size: 15))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 400)
            Spacer(minLength: 0)
            primary("Show My Notes")
            quiet(" ").hidden()
        }
        .padding(.horizontal, 40)
        .padding(.bottom, Self.compact ? 12 : 26)
    }

    // MARK: Buttons

    /// The one filled button on the page.
    private func primary(_ title: String, symbol: String? = nil) -> some View {
        Button { } label: {
            HStack(spacing: 6) {
                Text(title)
                if let symbol { Image(systemName: symbol).font(.system(size: 12, weight: .bold)) }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.amberProminent(height: Self.compact ? 50 : 40, cornerRadius: Self.compact ? 14 : 10))
        .frame(maxWidth: Self.compact ? .infinity : 320)
    }

    /// Everything else: quiet text.
    private func quiet(_ title: String) -> some View {
        Button(title) { }
            .buttonStyle(.hoverLink)
            .font(.system(size: Self.compact ? 15 : 13, weight: .medium))
            .foregroundStyle(Color.muted)
            .frame(height: 34)
            .padding(.top, 6)
    }

    // MARK: Pictures

    private func pictureAspect(_ url: URL) -> CGFloat {
        #if os(macOS)
        let size = NSImage(contentsOf: url)?.size ?? CGSize(width: 2, height: 1)
        #else
        let size = UIImage(contentsOfFile: url.path)?.size ?? CGSize(width: 2, height: 1)
        #endif
        return size.width / max(size.height, 1)
    }

    @ViewBuilder private func art(_ art: ImportGuide.Art) -> some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        Group {
            switch art {
            case .picture(let url, let rings):
                Color.clear.overlay {
                    #if os(macOS)
                    if let image = NSImage(contentsOf: url) { Image(nsImage: image).resizable().aspectRatio(contentMode: .fit) }
                    #else
                    if let image = UIImage(contentsOfFile: url.path) { Image(uiImage: image).resizable().aspectRatio(contentMode: .fit) }
                    #endif
                }
                .overlay {
                    GeometryReader { g in
                        ForEach(Array(rings.enumerated()), id: \.offset) { _, ring in
                            let r = CGRect(x: ring.0.minX * g.size.width, y: ring.0.minY * g.size.height,
                                           width: ring.0.width * g.size.width, height: ring.0.height * g.size.height)
                            RoundedRectangle(cornerRadius: 7).strokeBorder(Color(Palette.amberButton), lineWidth: 2.5)
                                .frame(width: r.width, height: r.height)
                                .overlay(alignment: ring.0.maxX < 0.7 ? .trailing : .bottomTrailing) {
                                    if let label = ring.1 {
                                        Text(label).font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                                            .padding(.horizontal, 7).padding(.vertical, 3)
                                            .background(Color(Palette.amberButton), in: .capsule)
                                            .fixedSize()
                                            .offset(x: 0)
                                            .alignmentGuide(.trailing) { ring.0.maxX < 0.7 ? $0[.leading] - 8 : $0[.trailing] }
                                            .offset(y: ring.0.maxX < 0.7 ? 0 : 26)
                                    }
                                }
                                .position(x: r.midX, y: r.midY)
                        }
                    }
                    .aspectRatio(pictureAspect(url), contentMode: .fit)
                }
                .padding(14)
            case .drawn(let d): GuideDrawing(drawn: d)
            case .none: Color.clear
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(Palette.page))
        .clipShape(shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
    }
}

// MARK: Drawn pictures

/// A plain drawing of the screen at that step: the outside page's shape in greys, with the one
/// thing to click drawn as it is labelled there and ringed in amber. No other company's logo.
struct GuideDrawing: View {
    var drawn: ImportGuide.Drawn

    var body: some View {
        switch drawn {
        case .takeoutPick:
            browser("takeout.google.com") {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        bar(120, 9)
                        Spacer()
                        Text("1 of 70 selected").font(.system(size: 10)).foregroundStyle(ink.opacity(0.55))
                    }
                    checkRow("Google Fit", on: false)
                    checkRow("Keep", on: true, bold: true)
                    checkRow("Maps", on: false)
                    HStack { Spacer(); ring { pill("Next step", filled: true) } }
                }
            }
        case .takeoutCreate:
            browser("takeout.google.com") {
                VStack(alignment: .leading, spacing: 9) {
                    bar(150, 9)
                    labelled("Send download link via email")
                    labelled("Export once")
                    labelled(".zip")
                    HStack { Spacer(); ring { pill("Create export", filled: true) } }
                }
            }
        case .takeoutEmail:
            browser("mail.google.com") {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        Circle().fill(Color.gray.opacity(0.35)).frame(width: 22, height: 22)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Your Google data is ready to download").font(.system(size: 11, weight: .semibold)).foregroundStyle(ink)
                            bar(90, 6)
                        }
                    }
                    bar(220, 6); bar(180, 6)
                    ring { pill("Download archive", filled: true) }
                }
            }
        case .evernoteExport:
            appWindow {
                HStack(alignment: .top, spacing: 0) {
                    VStack(alignment: .leading, spacing: 9) {
                        bar(50, 6); bar(60, 6)
                        Text("Notebooks").font(.system(size: 11, weight: .semibold)).foregroundStyle(ink)
                            .padding(.horizontal, 6).padding(.vertical, 3)
                            .background(Color.gray.opacity(0.18), in: .rect(cornerRadius: 5))
                        bar(44, 6); bar(54, 6)
                    }
                    .padding(12)
                    .frame(width: 112, alignment: .leading)
                    .frame(maxHeight: .infinity, alignment: .top)
                    .background(Color.gray.opacity(0.10))
                    VStack(alignment: .leading, spacing: 10) {
                        notebookRow("Recipes", dots: false)
                        notebookRow("Work", dots: true)
                        notebookRow("Travel journal", dots: false)
                    }
                    .padding(14)
                    .overlay(alignment: .topTrailing) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Rename notebook").foregroundStyle(ink.opacity(0.5))
                            ring { Text("Export notebook…").foregroundStyle(ink).font(.system(size: 11, weight: .semibold)) }
                            Text("Delete notebook").foregroundStyle(ink.opacity(0.5))
                        }
                        .font(.system(size: 11))
                        .padding(10)
                        .background(paper, in: .rect(cornerRadius: 8))
                        .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
                        .offset(x: -14, y: 66)
                    }
                }
            }
        case .evernoteFormat:
            appWindow {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Export notebook").font(.system(size: 12, weight: .semibold)).foregroundStyle(ink)
                    Text("Export as").font(.system(size: 10)).foregroundStyle(ink.opacity(0.6))
                    ring { radio("ENEX format (.enex)", on: true) }
                    radio("Single page HTML (.html)", on: false)
                    radio("Multiple web pages (.html)", on: false)
                    HStack { Spacer(); pill("Export", filled: true) }
                }
                .padding(18)
            }
        case .bearSelect:
            appWindow {
                HStack(alignment: .top, spacing: 0) {
                    VStack(alignment: .leading, spacing: 9) {
                        ring {
                            Text("Notes").font(.system(size: 11, weight: .semibold)).foregroundStyle(ink)
                                .padding(.horizontal, 6).padding(.vertical, 3)
                        }
                        bar(50, 6); bar(42, 6); bar(56, 6)
                    }
                    .padding(12)
                    .frame(width: 104, alignment: .leading)
                    .frame(maxHeight: .infinity, alignment: .top)
                    .background(Color.gray.opacity(0.10))
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(0..<4, id: \.self) { _ in
                            VStack(alignment: .leading, spacing: 4) { bar(110, 7, dark: true); bar(150, 5) }
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(Palette.amber).opacity(0.18), in: .rect(cornerRadius: 6))
                        }
                    }
                    .padding(10)
                    .overlay(alignment: .bottomTrailing) {
                        keycap("⌘ A").padding(12)
                    }
                }
            }
        case .bearExport:
            appWindow {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Export notes").font(.system(size: 12, weight: .semibold)).foregroundStyle(ink)
                    ring { labelled("Export as: Markdown") }
                    radio("Export attachments", on: true, square: true)
                    HStack { Spacer(); pill("Export notes", filled: true) }
                }
                .padding(18)
            }
        case .obsidianReveal:
            appWindow {
                HStack(alignment: .top, spacing: 0) {
                    VStack(alignment: .leading, spacing: 8) {
                        bar(60, 6); bar(70, 6)
                        Text("Weekly review").font(.system(size: 11)).foregroundStyle(ink)
                            .padding(.horizontal, 6).padding(.vertical, 3)
                            .background(Color.gray.opacity(0.18), in: .rect(cornerRadius: 5))
                        bar(52, 6); bar(64, 6)
                    }
                    .padding(12)
                    .frame(width: 130, alignment: .leading)
                    .frame(maxHeight: .infinity, alignment: .top)
                    .background(Color.gray.opacity(0.10))
                    Spacer()
                }
                .overlay(alignment: .topLeading) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Open in new tab").foregroundStyle(ink.opacity(0.5))
                        Text("Rename…").foregroundStyle(ink.opacity(0.5))
                        ring { Text("Reveal in Finder").foregroundStyle(ink).font(.system(size: 11, weight: .semibold)) }
                        Text("Delete").foregroundStyle(ink.opacity(0.5))
                    }
                    .font(.system(size: 11))
                    .padding(10)
                    .background(paper, in: .rect(cornerRadius: 8))
                    .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
                    .offset(x: 96, y: 62)
                }
            }
        case .obsidianFound, .notesEmpty:
            Color.clear
        case .settingsAutomation:
            appWindow {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Automation").font(.system(size: 13, weight: .bold)).foregroundStyle(ink)
                    bar(200, 6)
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 5).fill(Color(Palette.amber)).frame(width: 18, height: 18)
                            Text("Pinto Notes").font(.system(size: 11, weight: .semibold)).foregroundStyle(ink)
                        }
                        ring {
                            HStack {
                                Text("Notes").font(.system(size: 11)).foregroundStyle(ink)
                                Spacer()
                                Capsule().fill(Color(Palette.amberButton)).frame(width: 30, height: 17)
                                    .overlay(alignment: .trailing) { Circle().fill(.white).padding(2) }
                            }
                            .frame(width: 210)
                        }
                    }
                    .padding(12)
                    .background(Color.gray.opacity(0.08), in: .rect(cornerRadius: 8))
                }
                .padding(18)
            }
        case .macHandoff:
            HStack(spacing: 22) {
                Image(systemName: "iphone").font(.system(size: 64, weight: .ultraLight)).foregroundStyle(Color.muted)
                Image(systemName: "arrow.left").font(.system(size: 20, weight: .semibold)).foregroundStyle(Color(Palette.amber))
                Image(systemName: "laptopcomputer").font(.system(size: 84, weight: .ultraLight)).foregroundStyle(Color.ink)
            }
        case .notesShareOne:
            Color.clear
        }
    }

    // A browser window, drawn plainly: the address, and the page under it.
    private func browser(_ address: String, @ViewBuilder _ page: () -> some View) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                ForEach(0..<3, id: \.self) { _ in Circle().fill(Color.gray.opacity(0.35)).frame(width: 7, height: 7) }
                Text(address)
                    .font(.system(size: 10, weight: .medium)).foregroundStyle(ink.opacity(0.6))
                    .padding(.horizontal, 10).padding(.vertical, 3)
                    .frame(maxWidth: .infinity)
                    .background(Color.gray.opacity(0.14), in: .capsule)
                    .padding(.horizontal, 26)
            }
            .padding(.horizontal, 10)
            .frame(height: 26)
            .background(Color.gray.opacity(0.08))
            page()
                .padding(18)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background(paper)
        .clipShape(.rect(cornerRadius: 9))
        .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
        .padding(.horizontal, 28)
        .padding(.top, 22)
        .padding(.bottom, -10)
        .environment(\.colorScheme, .light)
    }

    private func appWindow(@ViewBuilder _ content: () -> some View) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                ForEach(0..<3, id: \.self) { _ in Circle().fill(Color.gray.opacity(0.35)).frame(width: 7, height: 7) }
                Spacer()
            }
            .padding(.horizontal, 10)
            .frame(height: 22)
            content().frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background(paper)
        .clipShape(.rect(cornerRadius: 9))
        .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
        .padding(.horizontal, 28)
        .padding(.top, 22)
        .padding(.bottom, -10)
        .environment(\.colorScheme, .light)
    }

    private let ink = Color(white: 0.15)
    private let paper = Color(white: 0.99)
    private let blue = Color(red: 0.10, green: 0.45, blue: 0.91)

    private func bar(_ w: CGFloat, _ h: CGFloat, dark: Bool = false) -> some View {
        Capsule().fill(Color.gray.opacity(dark ? 0.45 : 0.22)).frame(width: w, height: h)
    }

    private func ring(@ViewBuilder _ content: () -> some View) -> some View {
        content()
            .padding(.horizontal, 6).padding(.vertical, 4)
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(Palette.amberButton), lineWidth: 2.5).padding(-2))
    }

    private func checkRow(_ name: String, on: Bool, bold: Bool = false) -> some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 3).fill(on ? blue : .clear)
                .overlay(RoundedRectangle(cornerRadius: 3).strokeBorder(on ? blue : Color.gray.opacity(0.6), lineWidth: 1.5))
                .overlay { if on { Image(systemName: "checkmark").font(.system(size: 8, weight: .heavy)).foregroundStyle(.white) } }
                .frame(width: 13, height: 13)
            Text(name).font(.system(size: 11, weight: bold ? .semibold : .regular)).foregroundStyle(ink.opacity(on ? 1 : 0.55))
            Spacer(minLength: 0)
        }
        .frame(width: 210)
    }

    private func pill(_ title: String, filled: Bool) -> some View {
        Text(title).font(.system(size: 10.5, weight: .semibold))
            .foregroundStyle(filled ? .white : blue)
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(filled ? blue : .clear, in: .capsule)
    }

    private func labelled(_ title: String) -> some View {
        Text(title).font(.system(size: 10.5)).foregroundStyle(ink.opacity(0.75))
            .padding(.horizontal, 9).padding(.vertical, 5)
            .background(Color.gray.opacity(0.10), in: .rect(cornerRadius: 6))
    }

    private func radio(_ title: String, on: Bool, square: Bool = false) -> some View {
        HStack(spacing: 7) {
            Group {
                if square {
                    RoundedRectangle(cornerRadius: 3).fill(on ? blue : .clear).frame(width: 12, height: 12)
                        .overlay { if on { Image(systemName: "checkmark").font(.system(size: 7, weight: .heavy)).foregroundStyle(.white) } }
                } else {
                    Circle().strokeBorder(on ? blue : Color.gray.opacity(0.6), lineWidth: on ? 4 : 1.5).frame(width: 12, height: 12)
                }
            }
            Text(title).font(.system(size: 11)).foregroundStyle(ink.opacity(on ? 1 : 0.6))
        }
    }

    private func notebookRow(_ name: String, dots: Bool) -> some View {
        HStack {
            Image(systemName: "book.closed").font(.system(size: 11)).foregroundStyle(ink.opacity(0.5))
            Text(name).font(.system(size: 11)).foregroundStyle(ink)
            Spacer()
            if dots {
                ring { Image(systemName: "ellipsis").font(.system(size: 11, weight: .bold)).foregroundStyle(ink) }
            }
        }
        .frame(width: 210)
    }

    private func keycap(_ title: String) -> some View {
        Text(title).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(ink)
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(paper, in: .rect(cornerRadius: 7))
            .overlay(RoundedRectangle(cornerRadius: 7).strokeBorder(Color.gray.opacity(0.4)))
            .shadow(color: .black.opacity(0.15), radius: 0, y: 2)
    }
}

// MARK: One-page notices (Apple Notes' edge paths, the iPhone)

/// A page on its own: what happened in plain words, a picture when it helps, and one button.
struct ImportNoticePage: View {
    var origin: ImportOrigin = .appleNotes
    var title: String
    var line: String
    var art: ImportGuide.Drawn?
    var primary: String
    var primarySymbol: String?
    var quiet: String?

    #if os(iOS)
    private let compact = true
    #else
    private let compact = false
    #endif

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Image(systemName: "xmark").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.muted)
                    .frame(width: 26, height: 26)
                    .background(Color.line.opacity(0.6), in: .circle)
            }
            .frame(height: 30)
            .padding(.horizontal, 18)
            .padding(.top, 14)
            VStack(spacing: 0) {
                if let art {
                    GuideDrawing(drawn: art)
                        .frame(maxWidth: .infinity)
                        .frame(height: compact ? 260 : 210)
                        .background(Color(Palette.page))
                        .clipShape(.rect(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
                        .padding(.bottom, 22)
                } else {
                    Spacer(minLength: 0)
                    ImportSourceIcon(origin: origin, size: compact ? 84 : 76).padding(.bottom, 22)
                }
                Text(title)
                    .font(art == nil ? .display(compact ? 30 : 26) : .system(size: compact ? 24 : 21, weight: .bold))
                    .tracking(art == nil ? Palette.tracking(26) : -0.3)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 10)
                Text(line)
                    .font(compact ? .body : .system(size: 15))
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: 420)
                Spacer(minLength: 0)
                Button { } label: {
                    HStack(spacing: 6) {
                        Text(primary)
                        if let primarySymbol { Image(systemName: primarySymbol).font(.system(size: 12, weight: .bold)) }
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.amberProminent(height: compact ? 50 : 40, cornerRadius: compact ? 14 : 10))
                .frame(maxWidth: compact ? .infinity : 320)
                Button(quiet ?? " ") { }
                    .buttonStyle(.hoverLink)
                    .font(.system(size: compact ? 15 : 13, weight: .medium))
                    .foregroundStyle(Color.muted)
                    .frame(height: 34)
                    .padding(.top, 6)
                    .opacity(quiet == nil ? 0 : 1)
            }
            .padding(.horizontal, compact ? 24 : 36)
            .padding(.bottom, compact ? 12 : 26)
        }
        #if os(macOS)
        .frame(width: 540, height: 560)
        #endif
        .foregroundStyle(Color.ink)
        .background(Color(Palette.sheetGround))
        .tint(Color(Palette.amber))
    }

    static let notesDenied = ImportNoticePage(
        title: "Pinto Notes needs your OK to read Apple Notes",
        line: "macOS asked earlier, and the answer was Don't Allow. Turn on Notes under Pinto Notes in System Settings, then come back here. Your notes show up by themselves.",
        art: .settingsAutomation, primary: "Open System Settings", primarySymbol: "arrow.up.right", quiet: "Try Again")

    static let notesEmpty = ImportNoticePage(
        title: "Apple Notes is empty on this Mac",
        line: "If your notes are in iCloud, open Apple Notes once and wait until you see them. Then come back and try again.",
        art: nil, primary: "Open Apple Notes", primarySymbol: "arrow.up.right", quiet: "Try Again")

    static let phoneAppleNotes = ImportNoticePage(
        title: "Easiest on your Mac",
        line: "iPhone doesn't let apps read Apple Notes. On a Mac, Pinto Notes brings them all in with one click, and they're on this iPhone a moment later.",
        art: .macHandoff, primary: "Send Me the Mac Link", primarySymbol: "square.and.arrow.up", quiet: "No Mac? Bring notes one at a time")

    static let phoneAppleNotesOne = ImportNoticePage(
        title: "One note at a time",
        line: "In Apple Notes, open a note, tap Share, then Export as Markdown, and choose Save to Files. Then choose those files here.",
        art: nil, primary: "Choose Files", primarySymbol: nil, quiet: "Back")

    static let phoneBear = ImportNoticePage(
        origin: .files(.bear),
        title: "Easiest on your Mac",
        line: "Bear on the Mac saves all your notes into one folder in a minute, and Pinto Notes on the Mac brings them in. They're on this iPhone a moment later.",
        art: .macHandoff, primary: "Send Me the Mac Link", primarySymbol: "square.and.arrow.up", quiet: "I already have the folder")

    static let phoneEvernote = ImportNoticePage(
        origin: .files(.evernote),
        title: "Easiest on a computer",
        line: "Evernote's phone app can't save notebooks as files. On a Mac or PC, Evernote can, and Pinto Notes on the Mac brings them in. They're on this iPhone a moment later.",
        art: .macHandoff, primary: "Send Me the Mac Link", primarySymbol: "square.and.arrow.up", quiet: "I already have the files")
}
