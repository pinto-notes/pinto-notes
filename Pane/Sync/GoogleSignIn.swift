import SwiftUI

/// Sign in with Google as one of our secondary buttons (DESIGN.md: a button is a fill, never a
/// stroke): the soft fill, the full-colour "G" at Google's proportions and the standard wording,
/// which Google's branding guidelines allow on a neutral button of the app's own
/// (developers.google.com/identity/branding-guidelines). Its size is the form's, so it reads as
/// one family with Sign in with Apple above it.
struct GoogleAuthButton: View {
    var title = "Sign in with Google"
    var size: ButtonSize = .form
    /// Pressed and under way: a spinner in the logo's place, and the button stays solid.
    var busy = false
    let action: () -> Void

    /// The logo's side: Google's 18 pt on its 40 pt button, scaled with the row and never smaller.
    static func logoSize(height: CGFloat) -> CGFloat { max(16, (height * 0.42).rounded()) }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Self.logoGap) {
                Group {
                    if busy {
                        ProgressView().controlSize(.small)
                    } else {
                        Image("GoogleG")
                            .resizable()
                            .interpolation(.high)
                            .aspectRatio(1, contentMode: .fit)
                    }
                }
                .frame(width: Self.logoSize(height: size.height), height: Self.logoSize(height: size.height))
                .accessibilityHidden(true)
                Text(title)
                    .minimumScaleFactor(0.8)
            }
        }
        .buttonStyle(.secondary(size, wide: true))
        .accessibilityLabel(title)
        .accessibilityValue(busy ? "Signing in" : "")
    }

    /// Between the logo and the words: Google's 12 pt on iPhone, 10 on the Mac's smaller row.
    #if os(macOS)
    static let logoGap: CGFloat = 10
    #else
    static let logoGap: CGFloat = 12
    #endif
}
