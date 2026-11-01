# Accessibility picks, 1 November 2026

What Emil picked from the before-and-after study (`design/a11y-before-after`), built as real behaviour. The audit is `docs/Evidence/themes/accessibility-audit.md`.

- **2. Ticked checkbox.** In dark mode the tick is near-black (`#141414`) on the accent's disc, in the note (`DecoratedLayoutFragment.drawCheckbox`) and in the tick animation (`CheckPop`), on Mac and iPhone. Light mode keeps the white tick.
- **5. High contrast.** No accent row while High contrast is chosen, and the footer says it uses its own blue and yellow. It always draws with its own accent. A stored accent is kept and comes back with another theme.
- **6. Increase Contrast** (Mac) and **Darken Colors** (iPhone). With it on, a theme's muted text takes the ink colour and its hairlines the muted text's colour. It follows the setting live. Default draws as before. The selected row is unchanged.
- **8. Accent picker.** On iPhone each accent is a 30 pt dot in a 44 by 44 pt target, on its own row under "Accent", wrapping if needed, with the chosen accent's name under the row. The Mac keeps its single row.
- **9. Colour blindness.** The chosen accent swatch has a tick inside its ring: white or near-black, whichever reads better on that swatch. No accent colour changed.

Tests: `PaneTests/ThemeTests.swift` (`theTickFollowsTheMode`, `highContrastKeepsItsOwnAccent`, `increaseContrastStrengthensMutedAndLines`, `iPhoneAccentTargetsAre44`, `theChosenSwatchIsTicked`, and the matrix now runs with Increase Contrast on and off, the tick on every accent, and every stored accent under High contrast).

Pictures: `contact-sheet.png`. Made by `PaneTests/HIG/A11yPicksShots.swift`: A11yPicksPhoneShots on a simulator first, then A11yPicksShots on the Mac, offscreen.
