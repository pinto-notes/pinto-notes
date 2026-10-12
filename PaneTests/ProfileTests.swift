import Foundation
import ImageIO
import Supabase
import Testing
import UniformTypeIdentifiers
@testable import Pane

@Suite struct ProfileTests {
    /// A landscape JPEG carrying EXIF, GPS and TIFF metadata, like a phone photo.
    func photoWithMetadata(width: Int = 800, height: Int = 600) throws -> Data {
        let ctx = try #require(CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                                         space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue))
        ctx.setFillColor(CGColor(red: 0.9, green: 0.5, blue: 0.1, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        let image = try #require(ctx.makeImage())
        let out = NSMutableData()
        let dest = try #require(CGImageDestinationCreateWithData(out, UTType.jpeg.identifier as CFString, 1, nil))
        let meta: [CFString: Any] = [
            kCGImagePropertyGPSDictionary: [kCGImagePropertyGPSLatitude: 59.33, kCGImagePropertyGPSLongitude: 18.06],
            kCGImagePropertyExifDictionary: [kCGImagePropertyExifUserComment: "secret"],
            kCGImagePropertyTIFFDictionary: [kCGImagePropertyTIFFMake: "Phone"],
        ]
        CGImageDestinationAddImage(dest, image, meta as CFDictionary)
        #expect(CGImageDestinationFinalize(dest))
        return out as Data
    }

    @Test func photosBecomeSmallSquaresWithoutMetadata() throws {
        let source = try photoWithMetadata()
        let inSource = try #require(CGImageSourceCreateWithData(source as CFData, nil))
        let inProps = try #require(CGImageSourceCopyPropertiesAtIndex(inSource, 0, nil) as? [CFString: Any])
        #expect(inProps[kCGImagePropertyGPSDictionary] != nil, "the test photo carries a location")

        let out = try ProfileImage.prepare(source)
        let src = try #require(CGImageSourceCreateWithData(out as CFData, nil))
        #expect(CGImageSourceGetType(src) as String? == UTType.jpeg.identifier)
        let props = try #require(CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any])
        #expect(props[kCGImagePropertyPixelWidth] as? Int == 512)
        #expect(props[kCGImagePropertyPixelHeight] as? Int == 512)
        #expect(props[kCGImagePropertyGPSDictionary] == nil, "no location")
        #expect((props[kCGImagePropertyTIFFDictionary] as? [CFString: Any])?[kCGImagePropertyTIFFMake] == nil, "no camera")
        #expect((props[kCGImagePropertyExifDictionary] as? [CFString: Any])?[kCGImagePropertyExifUserComment] == nil, "no comments")
        #expect(out.count < 1_048_576, "fits the 1 MB photo limit")
    }

    @Test func tallAndTinyImagesStillWork() throws {
        #expect(try ProfileImage.prepare(try photoWithMetadata(width: 300, height: 1200)).count > 0)
        #expect(try ProfileImage.prepare(try photoWithMetadata(width: 40, height: 40)).count > 0)
        #expect(throws: (any Error).self) { try ProfileImage.prepare(Data("not an image".utf8)) }
    }

    @Test func namesAreTrimmedCleanAndShort() {
        #expect(ProfileName.normalized("  Emil Wagman  ") == "Emil Wagman")
        #expect(ProfileName.normalized("Emil\u{0007}\nWagman") == "EmilWagman")
        #expect(ProfileName.normalized("   ") == nil)
        #expect(ProfileName.normalized(String(repeating: "a", count: 80))?.count == 60)
    }

    /// The sidebar's account row and the iPhone's account button show a name, never an address
    /// (2026-10-11: a Sign in with Apple account showed "f7k6w27t…ppleid.com").
    @Test func theAccountIsShownByNameNeverByAddress() {
        #expect(AccountName.shown("Emil Wagman") == "Emil Wagman")
        #expect(AccountName.shown(nil) == "Your account")
        #expect(AccountName.shown("  ") == "Your account")
        #expect(AccountName.shown("f7k6w27tsh@privaterelay.appleid.com") == "Your account")
        #expect(AccountName.shown("you@example.com") == "Your account")
        #expect(AccountName.isSet("Emil Wagman"))
        #expect(!AccountName.isSet(nil))
        #expect(!AccountName.isSet("f7k6w27tsh@privaterelay.appleid.com"))
    }

    /// The account row shows the picture a Google sign-in came with, while the profile has none
    /// (owner, 2026-10-11: "we get that from google at least"). Only Google's own address counts.
    @Test func theSignInPictureIsGooglesOwnAddressOrNothing() {
        let google = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c"
        #expect(SignInPhoto.url(from: ["avatar_url": .string(google)])?.absoluteString == google)
        #expect(SignInPhoto.url(from: ["picture": .string(google)])?.absoluteString == google)
        #expect(SignInPhoto.url(from: ["full_name": .string("Sara Lind")]) == nil, "Apple and email accounts have none")
        #expect(SignInPhoto.url(from: ["avatar_url": .string("http://lh3.googleusercontent.com/a/x")]) == nil, "not without https")
        #expect(SignInPhoto.url(from: ["avatar_url": .string("https://example.com/me.jpg")]) == nil)
        #expect(SignInPhoto.url(from: ["avatar_url": .string("https://googleusercontent.com.evil.example/a")]) == nil)
    }

    @Test func theSignInPictureIsFetchedOnceAndForgottenWhenItIsGone() throws {
        let url = try #require(URL(string: "https://lh3.googleusercontent.com/a/one"))
        #expect(SignInPhoto.step(url: url, cached: nil, haveCopy: false) == .fetch(url))
        #expect(SignInPhoto.step(url: url, cached: url.absoluteString, haveCopy: true) == .keep)
        #expect(SignInPhoto.step(url: url, cached: "https://lh3.googleusercontent.com/a/old", haveCopy: true) == .fetch(url), "a new picture")
        #expect(SignInPhoto.step(url: url, cached: url.absoluteString, haveCopy: false) == .fetch(url), "the copy was lost")
        #expect(SignInPhoto.step(url: nil, cached: url.absoluteString, haveCopy: true) == .forget)
        #expect(SignInPhoto.step(url: nil, cached: nil, haveCopy: false) == .keep)
    }

    /// A photo you chose always wins; the sign-in picture never becomes the profile's photo.
    @Test @MainActor func yourOwnPhotoComesBeforeTheSignInPicture() {
        let store = ProfileStore(defaults: UserDefaults(suiteName: "profile-shown-\(UUID())")!, folder: FileManager.default.temporaryDirectory.appending(path: "profile-shown-\(UUID())"))
        #expect(store.shownPhoto == nil)
        let own = PImage()
        store.showForPreview(name: "Sara Lind", photo: own)
        #expect(store.shownPhoto === own)
    }

    @Test func initialsFromNamesOrEmails() {
        #expect(AvatarView.initials("Emil Wagman") == "EW")
        #expect(AvatarView.initials("emil@example.com") == "E")
        #expect(AvatarView.initials("anna-lena.berg@example.com") == "AB")
        #expect(AvatarView.initials("") == "?")
    }

    @Test func photoURLsNeverCarryAnythingButAPhotoName() {
        #expect(ProfileStore.avatarURL("../secret") == nil)
        #expect(ProfileStore.avatarURL("0123456789abcdef0123456789abcdef.jpg.html") == nil)
    }

    @Test func pendingEditsSurviveARestart() throws {
        var p = ProfileStore.Pending()
        #expect(p.isEmpty)
        p.name = "Emil"
        p.removePhoto = true
        let back = try JSONDecoder().decode(ProfileStore.Pending.self, from: JSONEncoder().encode(p))
        #expect(back == p && !back.isEmpty)
    }

    // MARK: The name from sign-in

    @Test func applesNamePartsBecomeOneName() {
        var parts = PersonNameComponents()
        parts.givenName = "Sara"
        parts.familyName = "Lindqvist"
        #expect(SignInName.from(parts) == "Sara Lindqvist")
        // Every sign-in after the first: Apple sends no name at all, or empty parts.
        #expect(SignInName.from(nil as PersonNameComponents?) == nil)
        #expect(SignInName.from(PersonNameComponents()) == nil)
        parts.familyName = nil
        #expect(SignInName.from(parts) == "Sara")
    }

    @Test func aSignInWithApplePassesTheNameOn() {
        #expect(AppleSignIn.Credential(idToken: "t", rawNonce: "n").name == nil)
        #expect(AppleSignIn.Credential(idToken: "t", rawNonce: "n", name: "Sara Lindqvist").name == "Sara Lindqvist")
    }

    @Test func googlesNameComesFromTheAccountsMetadata() {
        #expect(SignInName.from(metadata: ["full_name": .string("Jonas Berg"), "name": .string("jonas")]) == "Jonas Berg")
        #expect(SignInName.from(metadata: ["name": .string("  Emma Holm ")]) == "Emma Holm")
        #expect(SignInName.from(metadata: ["email": .string("emma@example.com")]) == nil, "an email sign-up has no name")
        #expect(SignInName.from(metadata: ["full_name": .string("emma@example.com")]) == nil, "an address is not a name")
        #expect(SignInName.from(metadata: ["full_name": .string("   ")]) == nil)
        #expect(SignInName.from(metadata: [:]) == nil)
    }

    @Test func onlyASignUpSuggestsAName() {
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        #expect(SignInName.isSignUp(created: now.addingTimeInterval(-20), now: now))
        #expect(!SignInName.isSignUp(created: now.addingTimeInterval(-86_400), now: now), "an account from yesterday keeps the name it chose, or cleared")
    }

    @Test func theSuggestedNameFillsOnlyAnEmptyProfileAndOnlyOnce() {
        let defaults = TestDefaults()
        let account = UUID()
        ProfileStore.suggest("  Sara Lindqvist ", for: account, defaults: defaults)
        let suggested = ProfileStore.takeSuggestion(for: account, defaults: defaults)
        #expect(suggested == "Sara Lindqvist")
        #expect(ProfileStore.seed(current: nil, suggested: suggested) == "Sara Lindqvist")
        #expect(ProfileStore.seed(current: "Sara L", suggested: suggested) == nil, "a name already on the profile stays")
        #expect(ProfileStore.takeSuggestion(for: account, defaults: defaults) == nil, "used up: clearing the name later keeps it cleared")
        #expect(ProfileStore.seed(current: nil, suggested: nil) == nil)
    }

    @Test func aSuggestionIsKeptPerAccountAndGoesWithTheAccount() {
        let defaults = TestDefaults()
        let a = UUID(), b = UUID()
        ProfileStore.suggest("Sara", for: a, defaults: defaults)
        #expect(ProfileStore.takeSuggestion(for: b, defaults: defaults) == nil)
        // The key follows the profile's own scheme, so signing in to another account removes it.
        #expect(ProfileStore.suggestionKey(a).hasPrefix("profile."))
        #expect(ProfileStore.suggestionKey(a).hasSuffix(a.uuidString.lowercased()))
        ProfileStore.suggest("   ", for: b, defaults: defaults)
        #expect(defaults.string(forKey: ProfileStore.suggestionKey(b)) == nil, "nothing is kept for an empty name")
    }
}
