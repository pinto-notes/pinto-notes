import AVFoundation
import CoreVideo
import Foundation

/// Writes the notebook film to a movie file (H.264, 1080 × 1350, 30 fps), off the main thread.
enum FilmVideo {
    enum Failure: Error { case writer(String) }

    /// Renders every frame into `url`, replacing what's there, with the film's sound when it has
    /// one. `progress` gets 0...1.
    static func write(_ renderer: FilmRenderer, to url: URL, progress: (@Sendable (Double) -> Void)? = nil) async throws {
        try? FileManager.default.removeItem(at: url)
        guard renderer.labels.sound, renderer.labels.startsAtFirstNote else { try picture(renderer, to: url, progress: progress); return }
        // The picture, then the sound on its own, then the two put together without encoding
        // either again. (Written side by side in one go, each waited on the other and it never finished.)
        let dir = url.deletingLastPathComponent(), id = UUID().uuidString
        let picture = dir.appendingPathComponent("picture-\(id).mp4"), sound = dir.appendingPathComponent("sound-\(id).m4a")
        defer { try? FileManager.default.removeItem(at: picture); try? FileManager.default.removeItem(at: sound) }
        try Self.picture(renderer, to: picture, progress: progress)
        try Self.sound(FilmSound(script: renderer.script).samples(), to: sound)
        try Task.checkCancellation()
        let both = AVMutableComposition()
        let v = AVURLAsset(url: picture), a = AVURLAsset(url: sound)
        guard let vt = try await v.loadTracks(withMediaType: .video).first, let at = try await a.loadTracks(withMediaType: .audio).first,
              let vc = both.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
              let ac = both.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else { throw Failure.writer("tracks") }
        let length = try await v.load(.duration)
        try vc.insertTimeRange(CMTimeRange(start: .zero, duration: length), of: vt, at: .zero)
        let heard = try await a.load(.duration)
        try ac.insertTimeRange(CMTimeRange(start: .zero, duration: CMTimeMinimum(length, heard)), of: at, at: .zero)
        guard let export = AVAssetExportSession(asset: both, presetName: AVAssetExportPresetPassthrough) else { throw Failure.writer("export") }
        try await export.export(to: url, as: .mp4)
    }

    /// The film's sound as AAC, on its own.
    private static func sound(_ samples: [Float], to url: URL) throws {
        let writer = try AVAssetWriter(outputURL: url, fileType: .m4a)
        var asbd = AudioStreamBasicDescription(mSampleRate: FilmSound.rate, mFormatID: kAudioFormatLinearPCM,
                                               mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked, mBytesPerPacket: 8,
                                               mFramesPerPacket: 1, mBytesPerFrame: 8, mChannelsPerFrame: 2, mBitsPerChannel: 32, mReserved: 0)
        var format: CMAudioFormatDescription?
        CMAudioFormatDescriptionCreate(allocator: nil, asbd: &asbd, layoutSize: 0, layout: nil, magicCookieSize: 0, magicCookie: nil, extensions: nil, formatDescriptionOut: &format)
        guard let format else { throw Failure.writer("audio format") }
        let input = AVAssetWriterInput(mediaType: .audio, outputSettings: [
            AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: FilmSound.rate, AVNumberOfChannelsKey: 2, AVEncoderBitRateKey: 192_000,
        ])
        input.expectsMediaDataInRealTime = false
        guard writer.canAdd(input) else { throw Failure.writer("can't add audio") }
        writer.add(input)
        guard writer.startWriting() else { throw Failure.writer(writer.error?.localizedDescription ?? "start audio") }
        writer.startSession(atSourceTime: .zero)
        let frames = samples.count / 2
        var at = 0
        while at < frames {
            if Task.isCancelled { writer.cancelWriting(); throw CancellationError() }
            while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
            let n = min(8_192, frames - at)
            var block: CMBlockBuffer?
            CMBlockBufferCreateWithMemoryBlock(allocator: nil, memoryBlock: nil, blockLength: n * 8, blockAllocator: nil, customBlockSource: nil,
                                               offsetToData: 0, dataLength: n * 8, flags: kCMBlockBufferAssureMemoryNowFlag, blockBufferOut: &block)
            guard let block else { throw Failure.writer("no audio block") }
            samples.withUnsafeBytes { raw in
                _ = CMBlockBufferReplaceDataBytes(with: raw.baseAddress! + at * 8, blockBuffer: block, offsetIntoDestination: 0, dataLength: n * 8)
            }
            var buffer: CMSampleBuffer?
            CMAudioSampleBufferCreateReadyWithPacketDescriptions(allocator: nil, dataBuffer: block, formatDescription: format, sampleCount: n,
                                                                 presentationTimeStamp: CMTime(value: CMTimeValue(at), timescale: CMTimeScale(FilmSound.rate)),
                                                                 packetDescriptions: nil, sampleBufferOut: &buffer)
            guard let buffer, input.append(buffer) else { throw Failure.writer(writer.error?.localizedDescription ?? "audio") }
            at += n
        }
        input.markAsFinished()
        let done = DispatchSemaphore(value: 0)
        writer.finishWriting { done.signal() }
        done.wait()
        if writer.status != .completed { throw Failure.writer(writer.error?.localizedDescription ?? "finish audio") }
    }

    /// The picture alone.
    private static func picture(_ renderer: FilmRenderer, to url: URL, progress: (@Sendable (Double) -> Void)?) throws {
        try? FileManager.default.removeItem(at: url)
        let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)
        let w = renderer.width, h = renderer.height
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: w,
            AVVideoHeightKey: h,
            AVVideoColorPropertiesKey: [
                AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
                AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
                AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
            ],
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 7_000_000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoMaxKeyFrameIntervalKey: FilmScript.fps * 2,
            ],
        ])
        input.expectsMediaDataInRealTime = false
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: w,
            kCVPixelBufferHeightKey as String: h,
        ])
        guard writer.canAdd(input) else { throw Failure.writer("can't add input") }
        writer.add(input)
        guard writer.startWriting() else { throw Failure.writer(writer.error?.localizedDescription ?? "start") }
        writer.startSession(atSourceTime: .zero)

        let total = renderer.script.frameCount
        var i = 0
        while !renderer.isDone {
            if Task.isCancelled {
                writer.cancelWriting()
                throw CancellationError()
            }
            while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
            guard let pool = adaptor.pixelBufferPool else { throw Failure.writer("no pool") }
            var buffer: CVPixelBuffer?
            CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
            guard let buffer else { throw Failure.writer("no buffer") }
            CVPixelBufferLockBaseAddress(buffer, [])
            let ctx = FilmRenderer.context(width: w, height: h, data: CVPixelBufferGetBaseAddress(buffer), bytesPerRow: CVPixelBufferGetBytesPerRow(buffer))
            if let ctx { renderer.drawNext(in: ctx) }
            CVPixelBufferUnlockBaseAddress(buffer, [])
            guard ctx != nil else { throw Failure.writer("no context") }
            guard adaptor.append(buffer, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: CMTimeScale(FilmScript.fps))) else {
                throw Failure.writer(writer.error?.localizedDescription ?? "append")
            }
            i += 1
            progress?(Double(i) / Double(total))
        }
        input.markAsFinished()
        let done = DispatchSemaphore(value: 0)
        writer.finishWriting { done.signal() }
        done.wait()
        if writer.status != .completed { throw Failure.writer(writer.error?.localizedDescription ?? "finish") }
    }
}
