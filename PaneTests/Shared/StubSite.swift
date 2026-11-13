import Foundation

/// Answers requests for one test's own host, so suites running side by side never share answers.
final class StubSite: URLProtocol, @unchecked Sendable {
    typealias Answer = @Sendable (URLRequest) throws -> (Int, Data)
    private static let lock = NSLock()
    nonisolated(unsafe) private static var answers: [String: Answer] = [:]
    nonisolated(unsafe) private static var seen: [String: [URLRequest]] = [:]

    /// A session whose requests to `host` get `answer`.
    static func session(host: String, answer: @escaping Answer) -> URLSession {
        lock.withLock { answers[host] = answer; seen[host] = [] }
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubSite.self]
        return URLSession(configuration: config)
    }

    static func requests(_ host: String) -> [URLRequest] { lock.withLock { seen[host] ?? [] } }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}
    override func startLoading() {
        let host = request.url?.host ?? ""
        var req = request
        // URLSession moves the body to a stream; read it back for the test.
        if req.httpBody == nil, let stream = req.httpBodyStream {
            stream.open()
            var data = Data()
            var buf = [UInt8](repeating: 0, count: 4096)
            while stream.hasBytesAvailable { let n = stream.read(&buf, maxLength: buf.count); if n <= 0 { break }; data.append(buf, count: n) }
            stream.close()
            req.httpBody = data
        }
        let answer = Self.lock.withLock { () -> Answer? in Self.seen[host, default: []].append(req); return Self.answers[host] }
        do {
            guard let answer else { throw URLError(.cannotFindHost) }
            let (status, data) = try answer(req)
            let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }
}
