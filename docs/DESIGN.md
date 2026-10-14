# Pinto Notes design rules

One set of rules for the app (Mac and iPhone), the website and the emails. If a screen breaks one, the screen changes, not the rule. To change a rule, change this file first, in its own commit, with the reason.

## The bar

People pick a notes app because it looks lovely. Each surface should look like someone cared about every pixel: every state has been designed (hover, press, focus, disabled, empty, loading, done), every icon sits on the same grid, and nothing moves unless the motion says something.

Apple Notes is still the reference for behaviour, and Apple's Human Interface Guidelines are still the floor. These rules decide the look on top of that floor.

## Our signature

1. **Paper-craft illustrations.** Warm, tactile, cut-paper scenes, one per moment: the Templates cards, the email heroes, the sign-in leaf. This is the thing people remember, and no one else has it. Use one where a screen has a moment: a welcome, an empty state, a finished import, an email, a section of the home page. Never use one inside a working view such as the note list or the editor.
2. **Warm ink on cream.** The text is brown-black, never pure black. The grounds lean toward the icon's brown (#8A4A1C) without ever reading as brown in the app.
3. **Heavy, tight display type** for the one line that matters on a screen.

We learn craft from other products (Alcove, Klack, Things, Apple's own apps), but never their look. If a detail could only belong to them, leave it out.

## Colour

The website's and the app's colours come from the same family. Names differ by platform. These are the pairs:

| Role | Website (`web/app/site.css`) | App (`Pane/Editor/Palette.swift`) |
|---|---|---|
| Text | `--ink` | `Palette.ink` |
| Secondary text | `--muted` | `Palette.muted` |
| Accent, links | `--amber`, `--link` | `Palette.amber`, `Palette.amberInk` |
| Soft fill (secondary buttons, chips) | `--soft` | `Palette.soft` (new) |
| Hairline | `--line` | `Palette.line` |
| Raised card | `--card` | `Palette.card` (new) |
| Primary button | `--cta-bg` / `--cta-ink` | `Palette.amberButton` / white |

- **One orange thing per view.** The accent marks the single thing to do, the current selection or an AI's work. If two things on screen are orange, one of them is wrong.
- **Dark mode is warm, never neutral grey.** Lean 2–3% toward the brown on the app's surfaces. The website can go fully brown (`#2e180a`); the app stays a warm grey beside other Mac apps.
- **Page grounds.** Marketing pages are cream, with dark brown (`#2e180a`) bands for contrast: the home page, `/for/*`, `/alternatives/*`, `/templates` and every template, `/blog` and every post, `/download`, and also `/privacy-security`. A few reference pages are leaf brown top to bottom: `/help`, `/support` and `/changelog`, with the fine print at `/privacy` and `/terms`. The owner likes them as a strong contrast with the rest of the site, so keep them dark; a dark page ends without the closing band, which would vanish on it. Shared notes (`/n`, `/s`, `/t`) and the report form follow the visitor's system. The map is `themeFor` in `web/lib/theme.ts`, pinned by `theme.test.ts`.
- **Solid, not see-through.** Use system materials (sidebar, toolbar glass) as the platform draws them. Never add your own translucent layers, rings or badges.
- Contrast is AA at least: 4.5:1 for body text, 3:1 for bold labels of 17 pt and up.

## Type

- **System font only** (SF Pro). The voice comes from weight and tracking, not from a different family.
- **Display:** weight 800, tracking −0.03 em (`Palette.tracking(_:)`), line height about 1.0. Use it for one line per screen at most: a page title, the onboarding step's heading, a note's title in the editor, an email headline.
- **One display headline per page.** Section titles are a clear step smaller, and nothing at the fold may look like a second hero.
- **Body:** regular 400, the platform's default size (13 pt Mac UI, 17 pt iPhone and web body). Secondary text uses `muted`, never a smaller size to say the same thing.
- **Labels and buttons:** semibold 600 or bold 700. Never 500 next to 600.
- Tabular figures wherever numbers line up: counts, dates, times.

## Shape

One radius scale everywhere. Concentric corners: an inner shape's radius is the outer radius minus the padding between them.

| Size | Radius | Used for |
|---|---|---|
| xs | 6 | Tags, inline chips, small icon wells |
| sm | 10 | Rows, menu items, small buttons (height ≤ 32) |
| md | 14 | Buttons (height 40–50), fields |
| lg | 20 | Cards, popovers, toasts |
| xl | 28 | Sheets, sign-in card, big illustrated panels |

Spacing is a 4-point grid: 4, 8, 12, 16, 24, 32, 48, 64. Things that belong together sit half as far apart as things that don't.

## Buttons

Three kinds, everywhere. Nothing else.

| Kind | Fill | Label | Use |
|---|---|---|---|
| **Primary** | Solid: amber in the app, ink on the website | White / cream, bold | The one thing to do. At most one per view. |
| **Secondary** | `soft` fill | Ink, semibold | Every other button with a shape. |
| **Quiet** | None until hover | Muted, turns ink on hover | Cancel, Back, Skip, icon buttons in a toolbar row. |

- **No borders on buttons.** A button is a fill, never a stroke. That includes "Sign in with Google": a secondary fill with the Google mark, not a white box with a grey edge. (Apple's "Sign in with Apple" keeps Apple's required look.)
- Native toolbar buttons and menus stay native (`.glass`, system toolbar items). These rules are for the buttons we draw.
- Heights: 50 (big, onboarding and website), 40 (default), 28 (compact, rows and toolbars). The radius follows the table above.
- Disabled is a quiet warm grey with muted text (`Palette.disabledButton`), never faded amber.
- Every button has hover (Mac and web: fill shifts about 10–14% toward amber), press (scale 0.97, 120 ms), and a visible focus ring (2 pt accent, 2 pt offset).

In code: `AmberProminentButtonStyle` (primary), a secondary style and a quiet style, each taking only a size. No call site picks its own height or radius.

## Borders and depth

- **Borders mark edges of content, never controls.** A table's cells, a field's edge, a card on a ground of the same colour. Not buttons, not chips, not toasts.
- Prefer a fill step over a line: a card one step lighter than its ground needs no border.
- Where a hairline is needed, use `line`, 1 px (0.5 pt on 2x), solid.
- One shadow recipe for raised things (cards, popovers, toasts): a 1 px `line` ring, a 1–2 px contact shadow, and one long soft shadow tinted brown, never grey. Nothing in the editor or the list has a shadow.
- **No rounded card with a coloured stripe down one side.** It's the most common tell of generated design.

## Icons

- **SF Symbols in the app**, one weight per surface: regular in toolbars, medium in the sidebar, and the same optical size in each row. No mixed outline and fill in the same group. Selected states may use the `.fill` variant.
- **Icons where Apple Notes has them, no more.** Folders in the sidebar and the folder under a note in a list stay, drawn lighter and smaller than the text beside them. Anywhere else, if the words already say it, leave the icon out.
- Website and email icons follow the same rules: 1.75 px strokes at 20 px, rounded caps, drawn on the same 24-unit grid.
- The app icon and the leaf mark are the only places our brand mark appears inside the app. No logo in the sidebar or in toolbars.

## Motion

- **The website can be expressive. The app stays calm.** In the app, one motion per change, with no staggers or layered effects. Nothing animates on opening a note, switching folders or toggling the sidebar: speed comes first there.
- Standard easing is ease-out, 120 ms for press, 150–220 ms for state changes, and up to 500 ms for an entrance (the single blur-in: 9 px to 0, small rise, fade).
- Things that leave go faster than things that arrive.
- Filters and lists never go blank: cards settle into place.
- **Website only:** story sections show one thing and play the story over time, one change at a time, instead of showing every state at once.
- Respect Reduce Motion everywhere: cut to the end state.

## States

Every interactive thing gets each of these designed, not left to defaults:

- Rest, hover, press, focus, disabled, selected.
- Every list or page: empty, loading, error, full.
- Every action: pressed, working, done. Silent success is a bug.

## Overlays and toasts

- One toast style: `card` fill, `lg` radius, the shared shadow, an SF Symbol and one line of text. Bottom centre on the Mac, above the toolbar on iPhone.
- At most one toast or banner at a time. A second waits.

## Copy

Sentence case, short sentences, no hype. Buttons say what happens ("Import my notes"), not "OK" or "Continue" when something more exact fits.

Every line earns its place: if a first-time reader doesn't need it at that moment, cut it.

## How design decisions get made

1. Name the screen's one focus. Cut what competes with it.
2. Build two or three candidates in the real UI (the app's offscreen harness, or the real site pages), with today's version as the control.
3. Render light and dark, and review every scroll frame before showing anyone.
4. Pick one. Turn the winner into values in this file and the token files, with a test that pins it.

## What has been tried and rejected

- Footer scroll effects on the website (two rounds, A to H). The footer stays plain.
- Staggered blur entrances in the app. One blur-in, no stagger.
- Prompt cards with an accent left border in the emails.
- Removing every illustration from the emails. Keep a hero for charm and a real capture for proof.
