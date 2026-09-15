# Anti-Slop Design Instructions — [Brand] Website

Paste this block into any UI/vibe-coding prompt for this site to keep output aligned with the brand and away from generic "AI-generated" defaults.

---

## Brand system (use these, not substitutes)

**Color**
- `#cc0000` — the brand red. Reserve it for one or two decisive moments per screen: the primary CTA, a key rule/underline, the logo mark. Never use it as a background wash, an icon fill, or repeated decoration — the brand personality is minimal & precise, so red must stay rationed to keep its impact.
- `#FFFFFF` — main canvas.
- A true near-black for text and most headlines — not pure `#000`. Use something like `#0F0F0F`–`#141414`. Precision reads through near-black, not through red.
- One quiet neutral grey (e.g. `#F3F3F1`) for section breaks/resting backgrounds — don't let white be the only surface or red be the only accent.
- No third accent color. Adding a "friendly" secondary hue undercuts the precision.

**Type**
- English display/headings: **Instrument Serif**. Display-only — single weight, high-contrast, thin at small sizes. Use only at large sizes on short lines (hero headlines, section titles). Never for body copy, labels, buttons, or anything under ~24px.
- English body/interface: **Work Sans**. Carries everything else — nav, buttons, body copy, captions, forms, labels.
- Arabic display/headings: **Alyamama** — mirrors Instrument Serif's role.
- Arabic body/interface: **Tajwal** (fallback face) — mirrors Work Sans's role.
- Set Arabic type slightly larger than its Latin counterpart at each scale step — Alyamama/Tajwal won't share x-height or weight logic with the Latin faces, so matching pixel sizes will look visually smaller.
- Exactly two typefaces per language, each with one clear job. Don't add a third English face anywhere — no monospace for data labels, no script accents, no "just for this one section" font.

**Personality target: minimal & precise**
- Left-aligned text over centered — precise reads more technical/considered than centered/consumer-friendly.
- Generous whitespace; tight, deliberate type scale (few sizes, clear jumps between them) rather than a soft many-size system.
- Thin structural rules (hairline borders, a single red underline) instead of card shadows.
- Sharp or barely-rounded corners — not the soft `border-radius: 16px+` SaaS default.
- Let red do structural work (marking an active state, underlining a stat, the one CTA) rather than decorative work (icon chips, colored badges scattered around).

## Avoid the tells

These patterns are overused by AI-generated UI — don't reach for them unless there's a specific reason tied to this brief:

- **Palette clichés**: warm cream + terracotta (~#D97757); or near-black + acid-green/vermilion. Not this brand's system — don't drift toward either.
- **The SaaS-card kit**: identical rounded cards everywhere, one uniform border-radius regardless of hierarchy, the same soft grey box-shadow (`rgba(0,0,0,.1)`) under every card, decorative gradient washes.
- **Broadsheet-by-default**: dense newspaper columns and zero-radius everything — only appropriate if the content is genuinely editorial/list-heavy.
- **Template chrome**: tracked-out ALL-CAPS eyebrow labels above every heading; meta strings joined with middle dots (`A · B · C`); "WORD — fragment" labels with a spaced em dash; a monospace face for small data labels; a `→` tacked onto every link/button.
- **Typographic tics**: bolding/coloring a single word in a headline for emphasis; labels above content that add no information; numbered markers (01/02/03) on content that isn't actually a sequence.
- **Motion defaults**: fade-and-slide-up on every section as it scrolls into view, hover transitions on every card. One deliberate motion moment beats scattering; motion answering a user action (open, confirm, expand) is always fine.

## Before shipping, self-check

- Does red appear more than once or twice per screen? If yes, cut it back — scarcity is the whole point.
- Is Instrument Serif being used anywhere below ~24px or for body text? If yes, swap to Work Sans.
- Would this layout survive being run through the same prompt for a totally different brand? If yes, it's still generic — revise.
- Visible keyboard focus, works down to mobile width, respects reduced-motion, contrast is genuinely accessible (check red-on-white and red-on-black-text contrast specifically).
- Take one thing away (an accent, an effect, a label) and see if it's better without it.
