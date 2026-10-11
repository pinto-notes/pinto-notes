# App Privacy answers for App Store Connect

App Store Connect → Amber Notes: Notes & Lists → App Privacy. Click through exactly this:

1. **Privacy Policy URL:** https://ambernotes.app/privacy
2. **Get Started → "Do you or your third-party partners collect data from this app?"** → **Yes, we collect data from this app**.
3. Tick these data types, and nothing else:
   - **Contact Info → Email Address** (the account email, from Sign in with Apple, Sign in with Google or email sign-up)
   - **Contact Info → Name** (the profile name you set, or the name Sign in with Apple or Google shares)
   - **User Content → Photos or Videos** (images you add to notes, and your profile photo)
   - **User Content → Other User Content** (your notes, folders and files)
   - **Identifiers → User ID** (the account identifier)
   - **Usage Data → Product Interaction** (per-account feature counts on our own server: AI edits,
     tips shown and used). Purposes: **Analytics** and **App Functionality** (a tip is never shown
     for a feature you've used). Linked: **Yes**. Tracking: **No**.
4. For each of the other types answer:
   - **How is it used?** → **App Functionality** only.
   - **Is it linked to the user's identity?** → **Yes**.
   - **Used for tracking?** → **No**.
5. **Publish** the answers.

Not collected (leave unticked): location, contacts, browsing or search history, health, financial
info, purchases, diagnostics, sensitive info. The app has no analytics, ads or
crash-reporting SDKs.

## From the first build with app telemetry (after 1.2)

The answers above describe 1.2 and earlier, which send no diagnostics. The first build that ships
app telemetry (`docs/Technical/app-telemetry.md`) needs these instead, published before that build
is submitted. `Pane/Resources/PrivacyInfo.xcprivacy` already says the same.

3. Tick these data types, and nothing else:
   - **Contact Info → Email Address** (as above)
   - **Contact Info → Name** (as above)
   - **User Content → Photos or Videos** (as above)
   - **User Content → Other User Content** (as above)
   - **Identifiers → User ID** (the account identifier). Purposes: **App Functionality** and
     **Analytics** (it's sent with diagnostics and usage reports).
   - **Identifiers → Device ID** (the random installation identifier the app keeps on our own
     server; the diagnostics reports carry no device identifier). Purposes: **App Functionality**
     and **Analytics**. The manifest has listed it since before telemetry; the answers above did not.
   - **Usage Data → Product Interaction** (feature counts on our own server, and the app's product
     events: app opened, signed in, first note, first sync, AI connected). Purposes: **Analytics**
     and **App Functionality**.
   - **Diagnostics → Crash Data** (crash and hang summaries from Apple's MetricKit). Purposes:
     **App Functionality** and **Analytics**.
   - **Diagnostics → Performance Data** (launch time, sync times, a library size range).
     Purposes: **App Functionality** and **Analytics**.
   - **Diagnostics → Other Diagnostic Data** (error reports: which step failed and its code).
     Purposes: **App Functionality** and **Analytics**.
   - **Other Data → Other Data Types** (how you heard about the app, if you answer). Purpose:
     **Analytics**. Also in the manifest since before telemetry.
4. For every type: **Linked to the user's identity → Yes** (reports carry the account
   identifier). **Used for tracking → No**: nothing is joined with data from other companies, and
   nothing goes to an advertiser or a data broker.

Not collected (leave unticked): location, contacts, browsing or search history, health, financial
info, purchases, sensitive info. The app links no analytics, ads or crash-reporting SDK; it sends
its own reports to PostHog in the EU, which is a third-party partner in Apple's sense, so the
types above are ticked.

Reports about shared pages are made on the website by visitors, not in the app, so they don't
belong in the app's privacy label. The privacy policy covers them.
