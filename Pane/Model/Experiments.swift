import Foundation

/// Features to try before they're settled (Emil, 12 November 2026: "I want an experimental page in
/// settings where you can turn on and off stuff ... because I'm not sure I will want this in the
/// end"). Each is off until turned on in Settings › Experimental, on this device. Turned off, the
/// feature is out of sight; what it stored stays, so turning it on again brings it back as it was.
enum Experiment: String, CaseIterable, Identifiable {
    /// A note's cover photo above its title and an emoji icon before it (NoteCover), with Add Icon
    /// and Add Cover by the title (Emil, 13 November 2026: "try it out in production ... and feel it").
    case covers
    /// A folder as a gallery of cards led by their pictures (FolderGallery).
    case gallery

    var id: String { rawValue }
    /// Its switch's UserDefaults key (also an `-experiment.covers YES` launch argument for tests).
    var key: String { "experiment." + rawValue }

    var title: String {
        switch self {
        case .covers: "Covers and icons"
        case .gallery: "Gallery view"
        }
    }

    var detail: String {
        switch self {
        case .covers: "Give a note a cover photo and an icon, from the buttons by its title."
        case .gallery: "Show a folder as cards with each note\u{2019}s cover or first picture, from the list\u{2019}s menu."
        }
    }

    var symbol: String {
        switch self {
        case .covers: "photo.artframe"
        case .gallery: "square.grid.2x2"
        }
    }
}

enum Experiments {
    /// Posted when a switch changes: open notes draw their covers and icons again.
    static let didChange = Notification.Name("pane.experiments.didChange")

    /// Whether `experiment` is on, from any thread (the editor's styling asks off the main actor).
    nonisolated static func isOn(_ experiment: Experiment, defaults: UserDefaults = .standard) -> Bool {
        defaults.bool(forKey: experiment.key)
    }

    @MainActor static func set(_ experiment: Experiment, _ on: Bool, defaults: UserDefaults = .standard) {
        guard isOn(experiment, defaults: defaults) != on else { return }
        defaults.set(on, forKey: experiment.key)
        NotificationCenter.default.post(name: didChange, object: nil)
    }
}
