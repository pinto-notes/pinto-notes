# Import source icons

The Import choice shows each source's own app icon. On the Mac the icon of an installed app is
read from the app itself (NSWorkspace). For two sources whose app may not be installed, the icon
ships in the asset catalog, unaltered, taken from the app's Mac App Store listing on 2026-10-12:

| Asset | App | From | Terms |
| --- | --- | --- | --- |
| `ImportIconEvernote` | Evernote (Evernote Corporation) | `artworkUrl512` of `https://itunes.apple.com/lookup?bundleId=com.evernote.Evernote&entity=macSoftware` | evernote.com/legal/trademark-use allows the unaltered app icon "to show that your product is compatible with Evernote", with attribution (shown in Settings, About) |
| `ImportIconBear` | Bear (Shiny Frog Ltd.) | `artworkUrl512` of `https://itunes.apple.com/lookup?bundleId=net.shinyfrog.bear&entity=macSoftware` | bear.app/terms asks for "prior written consent of Shiny Frog Ltd." for its trademarks with another product; no press kit. Used unaltered to name the source, on the owner's decision |
| `ImportIconObsidian` | Obsidian (Dynalist Inc.) | `Contents/Resources/icon.icns` of Obsidian.app, converted to PNG with `sips` (read only), 2026-10-13 | obsidian.md/brand: "If you want to use Obsidian assets for commercial purposes, please contact us." Used unaltered, on the owner's decision |
| `ImportIconKeep` | Google Keep (Google) | Google's product logo `https://www.gstatic.com/images/branding/productlogos/keep_2020q4/v8/web-512dp/logo_keep_2020q4_color_2x_web_512dp.png`, unaltered, centred on a white app-icon tile as Keep's own iPhone icon is, 2026-10-13 | Google's Partner Marketing Hub asks for an approval request for product icons. Used on the owner's decision |

Apple's icons are never bundled (Apple's guidelines allow no Apple icon without a licence, and App
Review can reject an app that shows one). On iPhone Apple Notes is a drawn notes page (white, a
yellow band, ruled lines); on the Mac it is the installed Notes app's icon. Markdown files are a
drawn document like the Files app's on both (Finder's page was too faint at row size).
