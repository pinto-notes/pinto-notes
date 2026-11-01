# Theme accessibility audit, 1 November 2026

All six themes (Default, Paper, Sepia, Slate, Forest, High contrast), light and dark, with the theme's own accent and each of the five picker accents (blue, green, purple, red, graphite). Ratios are WCAG 2.2 contrast ratios computed from the hex values in `Pane/Editor/Theme.swift` and `Pane/Editor/Palette.swift`, not from pictures. The shots were used only to see where each pair is drawn.

`PaneTests/ThemeTests.swift` now checks the whole matrix (`everyThemeReads`, `highContrastIsAAA`), so nothing here needs to be redone by hand. On the old values those tests fail on 32 pairs. On the new values they pass.

## What was checked

Text (4.5:1, and 7:1 in High contrast). Each pair is drawn at 13 pt or so. Nothing here is used only at 18 pt and up, so 3:1 never applies.

- Ink and muted text on the page, list, sidebar, card, code fill, table and selected row.
- The selected row's date (ink at 85%).
- Links (the accent) on the page, a card, a table cell and a table's header row (the code fill).
- The selected folder's name (the accent) on its pill in the sidebar. The pill is SwiftUI's tertiary fill, measured at about 4% black or white over the sidebar.
- An AI's line in a note row (`amberInk`) on the list and on the selected row.
- The white label on an accent button.
- Themed ink and muted text on Settings' and onboarding's unthemed sheet ground and form rows.

Controls and marks (3:1):

- The unread AI dot on the list and the selected row.
- A ticked checkbox on the page.
- Focus rings and the accent swatch's ring on Settings' ground.
- The selected row against the list, hairlines against the page, and the white tick on a ticked checkbox. These three are listed apart because they fail in almost every theme. See the open items.

## Text, worst pair per theme and mode

Default is shown with its own accent only. The other themes are shown across all six accents. High contrast is held to 7:1.

| Theme | Mode | Needs | Worst text pair before | Before | Worst text pair after | After |
|---|---|---|---|---|---|---|
| Default | light | 4.5:1 | selected folder's name on its pill, 2.75:1 | fail | unchanged, 2.75:1 | fail (not fixed, see open items) |
| Default | dark | 4.5:1 | white label on the accent fill (amberButton), 3.49:1 | fail | unchanged, 3.49:1 | fail (not fixed, see open items) |
| Paper | light | 4.5:1 | selected folder's name on its pill (own accent), 3.89:1 | fail | the same pair, 4.60:1 | pass |
| Paper | dark | 4.5:1 | AI line on the selected row (red), 5.06:1 | pass | muted on the selected row, 5.06:1 | pass |
| Sepia | light | 4.5:1 | selected folder's name on its pill (red), 3.75:1 | fail | muted on the selected row, 4.56:1 | pass |
| Sepia | dark | 4.5:1 | AI line on the selected row (red), 5.03:1 | pass | muted on the selected row, 5.29:1 | pass |
| Slate | light | 4.5:1 | selected folder's name on its pill (red), 4.28:1 | fail | selected folder's name (own accent), 4.64:1 | pass |
| Slate | dark | 4.5:1 | AI line on the selected row (red), 3.40:1 | fail | AI line on the selected row (purple), 4.61:1 | pass |
| Forest | light | 4.5:1 | selected folder's name on its pill (own accent), 4.05:1 | fail | the same pair, 4.62:1 | pass |
| Forest | dark | 4.5:1 | AI line on the selected row (red), 5.10:1 | pass | muted on the selected row, 5.48:1 | pass |
| High contrast, own accent | light | 7:1 | link in a table's header row, 9.30:1 | pass | the same, 9.30:1 | pass |
| High contrast, own accent | dark | 7:1 | AI line on the selected row, 6.04:1 (also muted 6.84, date 6.70) | fail | the same pair, 7.12:1 | pass |
| High contrast, picker accent | light | 7:1 | link in a table's header row (red), 4.98:1 | fail | the same pair, 6.14:1 | AA pass, AAA fail (open) |
| High contrast, picker accent | dark | 7:1 | AI line on the selected row (red), 3.36:1 | fail | AI line on the selected row (purple), 4.74:1 | AA pass, AAA fail (open) |

## Controls and marks, after the fixes

| Theme | Mode | Worst tested control or mark | Ratio | Selected row vs list | Hairline vs page | White tick on a ticked box (own accent) |
|---|---|---|---|---|---|---|
| Default | light | AI dot on the selected row | 2.93:1 (fail) | 1.19:1 | 1.26:1 | 3.49:1 |
| Default | dark | AI dot on the selected row (purple) | 7.13:1 | 1.28:1 | 1.66:1 | 1.93:1 |
| Paper | light | AI dot on the selected row | 4.54:1 | 1.21:1 | 1.30:1 | 6.17:1 |
| Paper | dark | AI dot on the selected row (purple) | 6.05:1 | 1.32:1 | 1.39:1 | 2.00:1 |
| Sepia | light | AI dot on the selected row (red) | 4.40:1 | 1.25:1 | 1.34:1 | 7.03:1 |
| Sepia | dark | AI dot on the selected row | 5.32:1 | 1.35:1 | 1.29:1 | 2.40:1 |
| Slate | light | AI dot on the selected row | 4.54:1 | 1.20:1 | 1.27:1 | 6.16:1 |
| Slate | dark | AI dot on the selected row (purple) | 4.61:1 | 1.36:1 | 1.45:1 | 2.00:1 |
| Forest | light | AI dot on the selected row | 4.56:1 | 1.19:1 | 1.26:1 | 6.01:1 |
| Forest | dark | AI dot on the selected row (purple) | 6.09:1 | 1.36:1 | 1.39:1 | 2.08:1 |
| High contrast | light | AI dot on the selected row (red) | 5.37:1 | 1.30:1 | 21:1 | 10.60:1 |
| High contrast | dark | AI dot on the selected row (purple) | 4.74:1 | 2.09:1 | 21:1 | 1.41:1 |

The last three columns fail 3:1 nearly everywhere, Default included. They are open items, not value fixes.

## Fixes

Each one is a colour value. Each theme keeps its hue. Default's own look is unchanged.

| Colour | Was | Now | Why |
|---|---|---|---|
| Paper accent, light | `#A85700` | `#974E00` | Selected folder name 3.89:1 and links in a table header 4.32:1 |
| Sepia accent, light | `#9A4A12` | `#8E4411` | Selected folder name 4.13:1 on the tan sidebar |
| Slate accent, light | `#3F6699` | `#3D6394` | Selected folder name 4.43:1 |
| Forest accent, light | `#2B7A4B` | `#287045` | Selected folder name 4.05:1 |
| Slate selected row, dark | `#434C5E` | `#3C4454` | AI line on the selected row 3.4 to 4.3:1 |
| High contrast selected row, dark | `#5C4B00` | `#4F4100` | Muted 6.84, date 6.70 and the yellow AI line 6.04:1, under AAA |
| Blue accent | `#0A64C8` / `#5AA9FF` | `#0957AE` / `#74B7FF` | 3.78:1 on Sepia's sidebar, 3.5:1 on dark selected rows |
| Green accent, light | `#256B41` | `#23653D` | 4.26:1 on Sepia's sidebar |
| Purple accent | `#7448C2` / `#B69CFF` | `#6841AF` / `#BCA4FF` | 4.02:1 on Sepia's sidebar, 3.77:1 on dark selected rows |
| Red accent | `#C0302A` / `#FF7A70` | `#A72A25` / `#FF958D` | 3.75:1 on Sepia's sidebar, 3.36:1 on dark selected rows |
| Graphite accent, dark | `#B0B0B0` | `#B2B2B2` | 3.93:1 on High contrast's dark selected row |

The picker accents affect Default only when someone picks one. Default with its own accent is the same as before (`defaultIsTodaysColours` still passes).

Also: the swatch names VoiceOver reads now come from one place (`Theme.spokenName`, `AccentChoice.spokenName`). A test checks that every swatch has a distinct, readable name.

Shots after the fixes: `theme-*-a11y.png` and `themes-all-a11y.png` in this folder. The older shots are kept.

## System settings

- **Increase Contrast.** No theme reacts to it. A theme's values stay the same with it on. Only the iPhone Format panel, the table grid and the unticked checkbox ring react, and they do that in every theme. Default behaves as before.
- **Reduce Transparency.** The themes draw a solid sidebar with no glass, so it changes nothing there. Default keeps the system's glass, which follows the setting as before.
- **Differentiate Without Colour.** Nothing in the app reads it. Status is mostly shown by shape already: a filled disc against an empty ring, a ring on the chosen swatch, an AI's mark beside its line. The weak spot is the selected note row, which is a fill only (see below).
- **Default follows the system as before.** Its values match today's colours exactly, and the system controls still take the AccentColor asset.

## Colour blindness

Simulated with the Machado 2009 matrices at full strength.

- **Selected row.** In every theme it is a lightness step, not a hue. The simulations keep the same ratio, 1.2 to 1.4:1, and 2.1:1 in High contrast dark. So it never relies on hue alone. But the step is faint for everyone, see open item 1. High contrast's yellow row on white keeps its 1.3:1 step under tritanopia, but its colour difference drops from ΔE 73 to 23.
- **Accent picker.** Blue and purple become hard to tell apart with protanopia and deuteranopia (ΔE 3.8 to 6). Forest's own accent and green are very close in light mode and identical in dark (`#6CC690`). The chosen swatch is still clear, because it gets a ring, and VoiceOver and the tooltip name every dot. A sighted person who is colour blind can't read the dot's name, though.

## The picker

Read in the code (`Pane/Views/AppearanceSettings.swift`):

- Every theme tile and accent dot is a `Button`, labelled with its name ("Sepia", "Blue", "The theme's own"). The chosen one gets the `isSelected` trait. Each dot has a tooltip on the Mac.
- On the Mac they are plain buttons, so Full Keyboard Access reaches them with Tab. With the default keyboard setting, Tab skips them, as it does for every plain button on the Mac.
- On iPhone a theme tile is about 62 to 80 pt wide and 60 pt tall, which is fine. **An accent dot is 22 by 22 pt, under the 44 pt minimum.** See the open items.
- The names are covered by a test. The traits can't be: SwiftUI builds no accessibility tree for a window that is never shown, and a UI test would launch the app.

## Surfaces the themes don't reach yet

- Settings' and onboarding's sheet ground (`#F7F7F7` / `#141414`), form rows and switches stay unthemed. Every theme's ink, muted text, accent and focus ring still clears 4.5:1 on them. No low pairs come from mixing themed and unthemed colours there.
- The sidebar's folder pill is the system's fill over the theme's sidebar. The selected folder's name in the accent was the main failure, now fixed for every theme.
- **The iPhone Format panel fails in dark mode with any theme or picker accent.** Its "on" segment is `accent.light` on a fixed dark pill (`#36322E`), at 1.2 to 2.4:1 (2.0 to 3.0:1 with Increase Contrast). Only the stock amber passes. This is open item 4.

## Open items for Emil

1. **The selected note row is a faint fill in every theme, Default included (1.2 to 1.4:1, needs 3:1).** A fill can't reach 3:1 against the list while keeping text at 4.5:1 on it. A non-colour mark would fix it: a leading bar, an outline, or a bolder title. This is a layout change, so I didn't build it.
2. **Default fails a few text pairs, and I left it alone as asked.** The stock amber `#D96A06` is 3.49:1 as a link or button label on white, 2.75:1 as the selected folder's name, and 3.06:1 in a table header. The AI dot on the selected row is 2.93:1. The fix would be a deeper light amber, which changes how Default looks.
3. **The white tick on a ticked checkbox is 1.4 to 2.5:1 in dark mode in every theme** (Default 1.93:1, High contrast's yellow 1.41:1). The disc against the empty ring still shows the state. The fix would be a black tick on light accents in dark mode, in `DecoratedLayoutFragment.drawCheckbox` and `CheckPop`. That's a code change.
4. **iPhone Format panel, dark mode.** The "on" segment fails 3:1 with every non-stock accent. `Palette.Format.on` should use `accent.dark` with a dark glyph in dark mode. That's a code change.
5. **High contrast with a picker accent reaches AA, not AAA** (6.1:1 light, 4.7:1 dark). Two ways out: hide the accent row while High contrast is on, or give High contrast its own deep and bright shades of each accent.
6. **Increase Contrast doesn't change any theme.** One option is to make it switch hairlines and muted text to their High contrast values on any theme.
7. **Hairlines are 1.3 to 1.7:1 in every theme but High contrast.** They are decorative today, since cards also have a shadow and columns have the split view's divider. They would matter if one ever becomes the only boundary.
8. **iPhone accent dots are 22 pt.** Six 44 pt targets don't fit beside the "Accent" label, so this needs a layout call: a second row, or a menu.
9. **Blue and purple look alike to people with red-green colour blindness, and Forest's own accent equals green in dark mode.** Options: show the chosen accent's name beside the dots, or swap purple for a pink or teal.
