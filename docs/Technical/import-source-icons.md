# Import source icons

The Import choice shows each source's own app icon. On the Mac the icon of an installed app is
read from the app itself (NSWorkspace). For two sources whose app may not be installed, the icon
ships in the asset catalog, unaltered, taken from the app's Mac App Store listing on 2026-10-12:

| Asset | App | From | Terms |
| --- | --- | --- | --- |
| `ImportIconEvernote` | Evernote (Evernote Corporation) | `artworkUrl512` of `https://itunes.apple.com/lookup?bundleId=com.evernote.Evernote&entity=macSoftware` | evernote.com/legal/trademark-use allows the unaltered app icon "to show that your product is compatible with Evernote", with attribution (shown in Settings, About) |
| `ImportIconBear` | Bear (Shiny Frog Ltd.) | `artworkUrl512` of `https://itunes.apple.com/lookup?bundleId=net.shinyfrog.bear&entity=macSoftware` | No published terms; used unaltered to name the source, on the owner's decision |

Google Keep has no bundled icon: Google requires an approved brand-permission request for any
product icon. It shows a drawn tile on the app-icon grid until one is granted.
