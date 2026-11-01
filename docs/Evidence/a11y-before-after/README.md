# Themes accessibility: before and after

One contact sheet per problem in `docs/Evidence/themes/accessibility-audit.md`, before on the left and the options on the right, each labelled with its ratio. `overview.png` shows all nine.

Every picture is drawn with the app's own views from windows that are never shown. The "after" pictures turn on study switches in `A11yStudy` (`Pane/Editor/Theme.swift`), which are off in the app. The iPhone accent layouts (8) are standalone study views in the test. Captures: `PaneTests/HIG/A11yBeforeAfterPhoneShots.swift` (simulator, first) and `PaneTests/HIG/A11yBeforeAfterShots.swift` (Mac).

## What I recommend

1. **Selected row:** add the 3 pt accent bar (option a). It reaches 4.4:1 and up against the list and the fill in every theme, keeps today's fill, and doesn't depend on colour. The outline also passes but makes the list look boxed. A stronger fill can't pass without hurting the grey text.
2. **Checkbox tick:** use a near-black tick (#141414) on the accent in dark mode. It goes from 1.9 to 2.1:1 up to 8.9 to 9.5:1, and light mode doesn't change.
3. **iPhone Format panel:** in dark mode, use the accent's dark shade for the on segment with a near-black glyph. The segment goes from 1.8:1 to 6.0:1 against the pill, with every accent.
4. **Default's amber:** option a, a deeper amber (#A34E00) for text, links and the labelled button only. It fixes all four failures (link 5.8:1, folder name 4.6:1, button label 5.8:1, AI dot 4.8:1) and leaves ticks and fills bright. Option b leaves links failing. This changes how Default looks, so it's your call.
5. **High contrast with a picked accent:** option a, hide the accent row in High contrast. It's the simplest change and keeps every pair at 7:1. Option b also passes (7.2:1 and up) but adds five more colour pairs to maintain, and the dark shades come out pale.
6. **Increase Contrast:** switch muted text to ink, hairlines to the muted colour, and add the bar from 1 when the setting is on. Grey text goes from 6 to 8:1 up to 11 to 13:1 and hairlines from 1.3 to 1.5:1 up to 6 to 8:1. It costs nothing when the setting is off.
7. **Hairlines:** no change. They're decorative today, and with 6 they become solid for anyone who asks for more contrast.
8. **iPhone accent dots:** option b, one Accent row that opens a list of named accents. Every target is a full 44 pt row, and the names also help with 9. Option a fits, but it adds a second row of large dots to the page.
9. **Colour blindness:** move purple to magenta (#93246F, #FF9AD5), give Forest its own moss accent (#4A6A12, #B4D16A), and tick the chosen swatch. Blue against magenta goes from ΔE 3 to 5 up to 17 to 36 for red-green colour blindness, and Forest against green from 0 to about 30. Red and green still look alike to people with red-green colour blindness, so the tick and the names from 8 matter.
