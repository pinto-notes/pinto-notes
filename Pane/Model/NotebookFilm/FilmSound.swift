import Foundation

// The film's sound, made from the notebook itself, so no two sound alike: a soft chord that fills
// out as the notebook does, a plucked note for each note as it appears (its pitch from its folder),
// a faint glint for writing, the empty sky gathering, a low boom as what you brought in bursts out,
// a falling note for each one removed, and a chord as the month lights up at the end.
// Nothing here is recorded: it's drawn sample by sample, like the film's frames.

struct FilmSound {
    let script: FilmScript
    static let rate = 44_100.0

    /// How long it is: the film's growth and its end, from film time 0 (the film's first frame).
    var duration: Double { script.growth + FilmScript.outro }

    // D major pentatonic: nothing in it clashes, whatever plays at once.
    private static let scale = [0, 2, 4, 7, 9]
    private static func pitch(_ degree: Int, octave: Int) -> Double {
        let d = ((degree % 5) + 5) % 5, o = octave + (degree < 0 ? -1 : degree / 5)
        return 293.66 * pow(2, Double(scale[d] + 12 * o) / 12)
    }

    /// Stereo, interleaved left and right, at `rate`.
    func samples() -> [Float] {
        let n = Int(duration * Self.rate)
        var left = [Float](repeating: 0, count: n), right = [Float](repeating: 0, count: n)
        let growth = script.growth, nodes = script.nodes
        let sr = Self.rate

        func add(at t0: Double, length: Double, pan: Double, gain: Double, _ voice: (Double) -> Double) {
            let a = max(0, Int(t0 * sr)), b = min(n, Int((t0 + length) * sr))
            guard a < b else { return }
            let l = Float(gain * cos((pan + 1) * .pi / 4)), r = Float(gain * sin((pan + 1) * .pi / 4))
            for k in a..<b {
                let v = Float(voice(Double(k) / sr - t0))
                left[k] += v * l; right[k] += v * r
            }
        }
        /// A soft mallet on wood and paper: a clean tone with a short bright edge, dying away.
        func pluck(_ t0: Double, _ f: Double, gain: Double, pan: Double, decay: Double = 0.7) {
            add(at: t0, length: decay * 6, pan: pan, gain: gain) { t in
                let env = min(1, t / 0.004) * exp(-t / decay)
                return env * (sin(2 * .pi * f * t) + 0.22 * sin(2 * .pi * 2 * f * t) * exp(-t / 0.25)
                              + 0.18 * sin(2 * .pi * 3.97 * f * t) * exp(-t / 0.06))
            }
        }

        // The chord under it all: quiet in the empty sky, fuller as the notebook fills, then gone.
        let alive: [Double] = {
            // How full the sky is, sampled ten times a second.
            let steps = Int(duration * 10) + 1
            var out = [Double](repeating: 0, count: steps)
            let total = Double(max(1, nodes.count))
            for s in 0..<steps {
                let t = Double(s) / 10
                out[s] = Double(nodes.filter { $0.birth <= t && ($0.gone ?? .infinity) > t }.count) / total
            }
            return out
        }()
        let chord: [(Double, Double)] = [(146.83, 0.0), (220.0, -0.4), (293.66, 0.4), (369.99, -0.2), (440.0, 0.25)]
        let bang = script.bangAt
        let end = duration
        for (j, (f, pan)) in chord.enumerated() {
            add(at: 0, length: end, pan: pan, gain: 0.022) { t in
                let s = min(Double(alive.count - 1), t * 10), i = Int(s), x = s - Double(i)
                let full = alive[i] * (1 - x) + alive[min(alive.count - 1, i + 1)] * x
                // Before the month: only the lowest note, gathering. After: the rest come in.
                let gather = filmSmooth(t / max(0.1, script.opening))
                let level = j == 0 ? 0.35 + 0.65 * gather : (bang.map { filmSmooth((t - $0) / 0.8) } ?? gather) * (0.45 + 0.55 * full)
                let out = 1 - filmSmooth((t - (end - 1.6)) / 1.6)
                let wobble = 1 + 0.06 * sin(2 * .pi * (0.13 + 0.05 * Double(j)) * t)
                // (A second voice a hair apart, quieter, so it shimmers without pulsing.)
                return level * out * wobble * (sin(2 * .pi * f * t) + 0.45 * sin(2 * .pi * (f * 1.0021) * t + Double(j)) + 0.12 * sin(2 * .pi * 2 * f * t))
            }
        }

        // The empty sky gathering: a hush that rises into the burst.
        var hush = 0.0
        if script.opening > 0 {
            let until = bang ?? script.opening
            var seedState: UInt64 = 0x1234_5678
            add(at: 0, length: until + 0.05, pan: 0, gain: 0.16) { t in
                seedState = seedState &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
                let white = Double(Int64(bitPattern: seedState >> 11) % 1_000_000) / 1_000_000
                let cutoff = 0.01 + 0.08 * pow(t / until, 2)
                hush += cutoff * (white - hush)
                return hush * pow(min(1, t / until), 2.2)
            }
        }

        // The bursts, one for each folder of what was brought in: a low boom (the largest the
        // deepest and loudest, each after it a step higher), a breath of air, and that folder's
        // notes ringing out.
        let biggest = Double(script.bangs.map(\.count).max() ?? 1)
        for (k, b) in script.bangs.enumerated() {
            let at = b.at, share = (Double(b.count) / biggest).squareRoot(), low = 38 * pow(2, Double(k) * 2 / 12)
            add(at: at, length: 2.6, pan: Double(k % 3 - 1) * 0.25, gain: 0.55 * (0.45 + 0.55 * share)) { t in
                let f = low + 34 * exp(-t / 0.18)
                let phase = 2 * .pi * f * t + 3 * (1 - exp(-t / 0.18))
                // (Its overtones carry it on a phone's small speaker, which can't play the boom itself.)
                return min(1, t / 0.006) * exp(-t / 0.6) * (sin(phase) + 0.4 * sin(2 * phase) * exp(-t / 0.3) + 0.25 * sin(3 * phase) * exp(-t / 0.2))
            }
            var noise: UInt64 = 0x9E37_79B9 &+ UInt64(k)
            var air = 0.0
            add(at: at, length: 1.2, pan: 0, gain: 0.22 * (0.5 + 0.5 * share)) { t in
                noise = noise &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
                let white = Double(Int64(bitPattern: noise >> 11) % 1_000_000) / 1_000_000
                air += (0.04 + 0.3 * exp(-t / 0.08)) * (white - air)
                return air * exp(-t / 0.26)
            }
            let mine = nodes.indices.filter { nodes[$0].imported && nodes[$0].folder == b.folder }
            let rings = mine.count <= 8 ? mine : (0..<8).map { mine[$0 * mine.count / 8] }
            for (r, i) in rings.enumerated() {
                let t0 = at + 0.04 + 0.4 * filmHash(i, 81) * filmHash(i, 82)
                pluck(t0, Self.pitch(nodes[i].folder * 2 + r % 3, octave: 1 + r % 2), gain: 0.07, pan: filmHash(i, 83) * 1.6 - 0.8, decay: 0.9)
            }
            for (j, d) in [0, 2, 4].enumerated() { pluck(at + 0.02 * Double(j), Self.pitch(k + d, octave: 1), gain: 0.05, pan: Double(j - 1) * 0.5, decay: 1.3) }
        }

        // Each note as it appears, and each one removed; never more than a few a second, so a big
        // notebook is a shower, not a roar.
        var last = -1.0, ownCount = 0
        for node in nodes where !(node.imported && bang != nil) && node.birth < growth {
            guard node.birth - last >= 0.085 else { continue }
            last = node.birth
            let degree = node.folder * 2 + ownCount % 3
            ownCount += 1
            pluck(node.birth, Self.pitch(degree, octave: ownCount % 4 == 0 ? 1 : 0), gain: 0.16, pan: filmHash(node.folder, 84) * 1.2 - 0.6, decay: 0.75)
        }
        // Writing: a faint glint now and then, high up.
        var glint = -1.0
        for (i, node) in nodes.enumerated() {
            for (k, e) in node.edits.enumerated().dropFirst() where e < growth && e - glint >= 0.16 {
                glint = e
                pluck(e, Self.pitch(node.folder * 2 + k % 5, octave: 2), gain: 0.035, pan: filmHash(i, 85) * 1.6 - 0.8, decay: 0.22)
            }
        }
        var lastGone = -1.0
        for (i, node) in nodes.enumerated() {
            guard let g = node.gone, g < growth, g - lastGone >= 0.2 else { continue }
            lastGone = g
            let f0 = Self.pitch(node.folder * 2, octave: 1)
            add(at: g, length: 0.9, pan: filmHash(i, 86) * 1.4 - 0.7, gain: 0.07) { t in
                let f = f0 * pow(2, -t / 0.6)
                return min(1, t / 0.01) * exp(-t / 0.25) * sin(2 * .pi * f * t * (1 - 0.4 * t))
            }
        }

        // The end: the month lights up, and a chord rings out over it.
        for (k, f) in [293.66, 369.99, 440.0, 587.33, 739.99].enumerated() {
            pluck(growth + 0.1 + 0.11 * Double(k), f, gain: 0.11, pan: Double(k - 2) * 0.3, decay: 1.8)
        }
        add(at: growth, length: FilmScript.outro, pan: 0, gain: 0.05) { t in
            let env = filmSmooth(t / 0.4) * (1 - filmSmooth((t - FilmScript.outro + 1.4) / 1.4))
            return env * (sin(2 * .pi * 146.83 * t) + sin(2 * .pi * 220 * t) + sin(2 * .pi * 293.66 * t))
        }

        // Kept soft at the top, then brought up to a steady level.
        var peak: Float = 0.0001
        for k in 0..<n {
            left[k] = Float(tanh(Double(left[k]) * 1.2)); right[k] = Float(tanh(Double(right[k]) * 1.2))
            peak = max(peak, abs(left[k]), abs(right[k]))
        }
        let scale = 0.85 / peak
        var out = [Float](repeating: 0, count: n * 2)
        for k in 0..<n { out[2 * k] = left[k] * scale; out[2 * k + 1] = right[k] * scale }
        return out
    }

    /// As a WAV file: 16-bit stereo.
    func wav() -> Data {
        let s = samples()
        var d = Data()
        func u32(_ v: UInt32) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        func u16(_ v: UInt16) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        let bytes = UInt32(s.count * 2)
        d.append(contentsOf: Array("RIFF".utf8)); u32(36 + bytes); d.append(contentsOf: Array("WAVE".utf8))
        d.append(contentsOf: Array("fmt ".utf8)); u32(16); u16(1); u16(2); u32(UInt32(Self.rate)); u32(UInt32(Self.rate) * 4); u16(4); u16(16)
        d.append(contentsOf: Array("data".utf8)); u32(bytes)
        var pcm = [Int16](repeating: 0, count: s.count)
        for k in s.indices { pcm[k] = Int16(max(-1, min(1, s[k])) * 32_767) }
        pcm.withUnsafeBytes { d.append(contentsOf: $0) }
        return d
    }
}
