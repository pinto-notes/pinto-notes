import AVFoundation
import CoreVideo
import Foundation

/// Writes the notebook film to a movie file (H.264, 1080 × 1350, 30 fps), off the main thread.
enum FilmVideo {
    enum Failure: Error { case writer(String) }

    /// Renders every frame into `url`, replacing what's there. `progress` gets 0...1.
    static func write(_ renderer: FilmRenderer, to url: URL, progress: (@Sendable (Double) -> Void)? = nil) throws {
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
                AVVideoAverageBitRateKey: 10_000_000,
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

        let total = FilmScript.frameCount
        var i = 0
        while !renderer.isDone {
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
