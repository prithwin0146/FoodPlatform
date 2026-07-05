# SeeThePrep — Copilot Instructions

## Project context

FoodPlatform / SeeThePrep is a UK food delivery site whose core differentiator
is live in-kitchen cameras — customers watch their food being cooked in real
time — combined with FSA hygiene ratings and full allergen transparency per
dish. Stack: .NET 8 API (`FoodPlatform.Api`), Angular 19 client (`app`).

## Visual direction — do not deviate without being asked

BOLD & PLAYFUL. Vibrant, energetic, food-culture-forward: punchy color
blocking, confident large type, motion/energy in the UI, personality in
microcopy and empty states.

Avoid by default:
- Generic "clean SaaS" minimalism
- Dark/moody premium-restaurant aesthetics
- Muted/desaturated palettes

Every new UI surface (component, page, empty state, modal) should read as
belonging to the same energetic brand — not a one-off style choice.

## Non-negotiable functional rules

- The live kitchen camera viewer is the hero feature. Treat it as a
  signature UI moment, not a bolted-on widget. It needs: loading/connecting
  state, "cooking now" live indicator, graceful offline fallback, mobile +
  desktop layouts.
- FSA hygiene rating must be visible and legible on every restaurant card.
- Allergen info must be reachable per-dish without extra clicks into a
  buried modal.
- Order flow (browse → restaurant → dish → cart → checkout) prioritizes
  speed and tap-target clarity over decoration — boldness should never
  slow down checkout.

## Design tokens — READ THIS BEFORE TOUCHING ANY STYLES

`client/src/styles.scss` currently has TWO overlapping token generations:
old original tokens, and a half-finished migration to `--NEW--`-prefixed
tokens (e.g. `--NEW--primary`, `--NEW--accent`, `--NEW--space-1`). This
migration was never finished, which is why the UI currently looks
inconsistent across pages/components.

**Do not add a third naming scheme. Do not add more `--NEW--` tokens beyond
finishing what's already started.**

Before styling anything:
1. Check which token generation the file/component you're editing
   currently uses (old or `--NEW--`).
2. If it's already on `--NEW--` tokens, finish migrating that file fully —
   do not leave a mix of old and `--NEW--` values in the same file.
3. If it's still on old tokens, migrate it to `--NEW--` as part of your
   edit rather than leaving it stale.
4. Never invent a fresh one-off hex/spacing/shadow value. If a `--NEW--`
   token doesn't exist yet for what you need, check `design-system` skill
   guidance and add it to the token set properly — don't hardcode.

The end state is ONE consistent token set. Every file you touch should move
closer to that, never further from it.

## Scope discipline

Do not propose or begin work from `UI_ENHANCEMENT_ANALYSIS.md` or
`UI_REWORK_PLAN.md` beyond what is explicitly requested in the current
task. Those documents describe a large multi-week enhancement program;
treat them as background reference only, not a queue of work to execute
autonomously. If a request is ambiguous, ask which specific priority area
to work on rather than picking one from those plans.

## Using design & UI/UX skills

This project has the following Agent Skills installed in `.claude/skills/`.
Match the task to the right skill(s) and invoke them rather than generating
UI from general knowledge alone:

- **ui-ux-pro-max** — primary skill for UX decisions, layout, interaction
  patterns, component behavior. Default to this for most UI work.
- **design-system** — token work: colors, type scale, spacing, radius,
  shadow, motion values. Use before introducing any new visual value.
- **ui-styling** — visual styling/CSS-level implementation once a design
  direction is set.
- **brand** — voice, tone, and visual identity consistency (relevant for
  microcopy, empty states, and making sure new UI still reads as the same
  bold/playful brand).
- **design** — general design guidance, use when a task doesn't clearly
  map to one of the more specific skills above.
- **frontend-design** — frontend implementation patterns/constraints for
  translating a design into working component code.

For most component or page work, more than one of these applies (e.g.
design-system for the tokens + ui-styling for the CSS + brand for
copy/tone). Invoke the ones that apply rather than picking just one. If
unsure whether a skill applies, prefer invoking it — these skills encode
project-specific design constraints that general suggestions won't include.

## Code conventions

- Follow existing SOLID conventions in `FoodPlatform.Api`
- Angular: standalone components, existing service/DTO patterns in `app`
- Use real project content (restaurant names, categories, existing copy)
  instead of lorem ipsum placeholders when generating UI with sample data

## What NOT to assume

- Don't invent new pages, flows, or features that don't exist unless asked
- Don't simplify away the live-cam, FSA rating, or allergen requirements
  above even if a simpler visual treatment would look cleaner 