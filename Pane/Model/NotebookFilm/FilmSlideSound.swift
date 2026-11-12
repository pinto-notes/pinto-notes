import Foundation

// Light music under the slides before the film (Emil, 11-11: "some light music, to get you into
// the mood"), made like the film's own sound (FilmSound), from what each slide shows: a bed of the
// film's chord under them all, and a few soft notes as each slide's picture comes in. In the film's
// key, so the film takes over without a change of key.
//
// Kept small whatever the month (Emil, 11-11: the welcome's twenty notes were "almost a bit
// annoyingly much", and "the final tone is dragged on in each section"): a slide's notes are few
// however much it shows, each dies away within a second, and a slide's sound has ended before
// you'd go on from it.
enum FilmSlideSound {
    static let rate = 44_100.0

    /// No note on a slide is louder than this (before `level`).
    static let noteGain = 0.075
    /// At most this many notes for the welcome's stars, however many it shows.
    static let starNotes = 8
    /// How long any note rings, at most (the time it takes to die to a twentieth).
    static let longestRing = 1.2
    /// The whole of it: about 7 LU under the film (-21 LUFS against its -13 or so), as quiet as a
    /// bed can be and still be heard on a phone's speaker. (The pilot Emil liked was -19.6.)
    static let level = 3.0

    // D major pentatonic, as the film.
    private static let scale = [0, 2, 4, 7, 9]
    static func pitch(_ degree: Int, octave: Int) -> Double {
        let d = ((degree % 5) + 5) % 5, o = octave + Int((Double(degree) / 5).rounded(.down))
        return 293.66 * pow(2, Double(scale[d] + 12 * o) / 12)
    }

    /// Stereo samples, interleaved, at `rate`.
    struct Track {
        var left: [Float], right: [Float]
        init(seconds: Double) {
            let n = max(1, Int(seconds * FilmSlideSound.rate))
            left = [Float](repeating: 0, count: n); right = left
        }
        var seconds: Double { Double(left.count) / FilmSlideSound.rate }
        mutating func add(at t0: Double, length: Double, pan: Double, gain: Double, _ voice: (Double) -> Double) {
            let n = left.count, sr = FilmSlideSound.rate
            let a = max(0, Int(t0 * sr)), b = min(n, Int((t0 + length) * sr))
            guard a < b else { return }
            let g = gain * FilmSlideSound.level
            let l = Float(g * cos((pan + 1) * .pi / 4)), r = Float(g * sin((pan + 1) * .pi / 4))
            for k in a..<b { let v = Float(voice(Double(k) / sr - t0)); left[k] += v * l; right[k] += v * r }
        }
        /// The film's soft mallet, dying away over `ring` (to a twentieth), cut clean after it.
        mutating func note(_ t0: Double, _ f: Double, gain: Double, pan: Double = 0, ring: Double = 0.6) {
            let ring = min(ring, FilmSlideSound.longestRing), decay = ring / 3
            add(at: t0, length: ring, pan: pan, gain: min(gain, FilmSlideSound.noteGain)) { t in
                let attack: Double = min(1, t / 0.006)
                let tail: Double = 1 - filmSmooth((t - ring * 0.8) / (ring * 0.2))
                let env: Double = attack * exp(-t / decay) * tail
                let w: Double = 2 * .pi * f * t
                let tone: Double = sin(w) + 0.16 * sin(2 * w) * exp(-t / 0.25) + 0.08 * sin(3.97 * w) * exp(-t / 0.05)
                return env * tone
            }
        }
        /// Gone by `end`: faded over its last `over` seconds, and silent after.
        mutating func end(at end: Double, over: Double = 0.3) {
            let sr = FilmSlideSound.rate, a = max(0, Int((end - over) * sr))
            for k in a..<left.count {
                let g = Float(1 - filmSmooth((Double(k) / sr - (end - over)) / over))
                left[k] *= g; right[k] *= g
            }
        }
        var interleaved: [Float] { var out = [Float](); out.reserveCapacity(left.count * 2); for k in left.indices { out.append(left[k]); out.append(right[k]) }; return out }
        var peak: Float { max(left.map(abs).max() ?? 0, right.map(abs).max() ?? 0) }
    }

    /// The bed under the slides: the high notes of the film's chord, slow and soft, with no bass
    /// (Emil, 11-12: the low D under it all was "a bassy note that plays basically the whole time").
    /// It comes in over its first seconds and goes over its last two; the app fades it sooner, as
    /// the play slide comes up.
    static let bedNotes: [(f: Double, pan: Double, gain: Double)] = [(293.66, 0.35, 0.6), (369.99, -0.2, 0.45), (440.0, 0.25, 0.35)]
    static func pad(seconds: Double) -> Track {
        var t = Track(seconds: seconds)
        for (j, n) in bedNotes.enumerated() {
            t.add(at: 0, length: seconds, pan: n.pan, gain: 0.013 * n.gain) { s in
                let swell = filmSmooth(s / 2.5) * (1 - filmSmooth((s - (seconds - 2)) / 2))
                let wobble = 1 + 0.07 * sin(2 * .pi * (0.11 + 0.04 * Double(j)) * s)
                let w: Double = 2 * .pi * n.f * s
                return swell * wobble * (sin(w) + 0.45 * sin(w * 1.0023 + Double(j)))
            }
        }
        return t
    }

    /// What plays as `slide` comes in, from its first frame: nil for a slide with none (play, where
    /// the bed goes). It has ended by the time the slide has.
    static func cue(_ slide: FilmSlides.Slide, of slides: FilmSlides) -> Track? {
        switch slide.name {
        case "start" where slides.startLook == 4:
            // The notes you started with as stars: a soft high note for a few of them as they
            // appear, rising, and a lower, fuller one for the first and biggest.
            let n = slides.welcomeStars, notes = min(n, starNotes)
            var t = Track(seconds: slide.length + 0.6)
            for m in 0..<notes {
                let along: Double = notes == 1 ? 0 : Double(m) * Double(n - 1) / Double(notes - 1)
                let i = Int(along.rounded())
                let at = FilmSlides.starAppears(i, of: n)
                if m == 0 { t.note(at, pitch(0, octave: 0), gain: 0.07, ring: 0.9); continue }
                t.note(at, pitch(m + 1, octave: 1), gain: 0.045 - 0.002 * Double(m), pan: filmHash(i, 5) * 1.2 - 0.6, ring: 0.5)
            }
            t.end(at: slide.length + 0.6)
            return t
        case "top-notes":
            // The countdown climbs: a note as each row lands, fifth to first, and a chord for yours.
            let rows = slides.topRows
            guard rows > 0 else { return nil }
            var t = Track(seconds: slide.length + 0.6)
            for i in 0..<rows {
                let at = FilmSlides.rowAppears(i, rows: rows)
                if i == 0 {
                    for (d, g) in [(4, 0.06), (7, 0.05), (9, 0.035)] { t.note(at, pitch(d, octave: 0), gain: g, pan: Double(d - 7) / 6, ring: 1.0) }
                } else {
                    t.note(at, pitch(rows - 1 - i, octave: 0), gain: 0.05, pan: -0.3 + 0.15 * Double(i), ring: 0.5)
                }
            }
            t.end(at: slide.length + 0.6)
            return t
        case "when":
            // The hand round the day: a faint tick for each hour you wrote in (only the busiest
            // dozen, however many), brighter for your three; then the moon or the sun, low.
            let hours = slides.byHour, best = slides.bestHours
            let mine = Set((0..<3).map { (best + $0) % 24 })
            let others = (0..<24).filter { hours[$0] > 0 && !mine.contains($0) }.sorted { hours[$0] > hours[$1] }.prefix(12)
            var t = Track(seconds: slide.length + 0.6)
            for hr in Array(others) + mine.sorted() {
                let at = FilmSlides.handPasses(hr), m = mine.contains(hr)
                t.note(at, pitch(m ? 5 + hr % 3 : 2 + hr % 2, octave: 0), gain: m ? 0.05 : 0.014, pan: sin(Double(hr) / 24 * 2 * .pi) * 0.6, ring: m ? 0.5 : 0.18)
            }
            let landed = FilmSlides.dialLands
            t.note(landed, pitch(0, octave: -1), gain: 0.07, ring: 1.1)
            t.note(landed, pitch(3, octave: -1), gain: 0.03, pan: 0.2, ring: 1.0)
            t.end(at: slide.length + 0.6)
            return t
        default:
            return nil
        }
    }

    /// 16-bit stereo WAV.
    static func wav(_ track: Track) -> Data {
        let n = track.left.count
        var d = Data()
        func u32(_ v: UInt32) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        func u16(_ v: UInt16) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        d.append(contentsOf: Array("RIFF".utf8)); u32(UInt32(36 + n * 4)); d.append(contentsOf: Array("WAVEfmt ".utf8))
        u32(16); u16(1); u16(2); u32(UInt32(rate)); u32(UInt32(rate) * 4); u16(4); u16(16)
        d.append(contentsOf: Array("data".utf8)); u32(UInt32(n * 4))
        for k in 0..<n {
            for v in [track.left[k], track.right[k]] {
                let c = Int16(max(-1, min(1, v)) * 32767)
                withUnsafeBytes(of: c.littleEndian) { d.append(contentsOf: $0) }
            }
        }
        return d
    }
}
