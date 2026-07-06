# Reckon

A scroll feed that ends. Bite-size interactive science instead of mindless scrolling.

Everyone doomscrolls, and every "healthy alternative" fails because it ignores why scrolling works: frictionless, thumb-driven, surprising. Reckon keeps the feed and swaps the content. Every few cards is something you manipulate or a prediction you commit to before the reveal. And the feed ends — 25 cards, then it tells you to leave.

The name is the mechanic: you *reckon* — estimate, predict, figure — then find out.

## How it works

- **A finite daily feed.** ~25 cards, seeded by the calendar day, then a hard stop. No infinite scroll, by design.
- **Three card types.** Concept (a single fact with the *why*), Interactive (one manipulable widget), and Predict (commit to a guess, then an animated reveal).
- **Four widgets, built from scratch on `<canvas>`:**
  - **Moon Distance** — drag the Moon, then watch every planet line up in the gap.
  - **Scale Zoom** — a log slider from a proton to the observable universe.
  - **Deep Time** — scrub 4.5 billion years and find humans as a sliver.
  - **Gravity Toy** — throw a ball under Moon, Earth, or Jupiter gravity.
- **Every empirical claim is sourced** and hand-verified against NASA, NOAA, USGS, and peer-reviewed work.

## Stack

- Next.js 16 (App Router) + React 19, fully static
- Tailwind CSS 4
- Plain `<canvas>` 2D + `requestAnimationFrame` for every widget — no 3D libraries
- State in `localStorage`, no backend

## Develop

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Append `?card=<id>` to preview a single card (ids live in `content/cards.json`).

## Structure

```
app/            today's feed (client shell)
components/
  cards/        Concept, Interactive, Predict card shells
  widgets/      the four canvas widgets
lib/            types, seeded feed logic, persisted state
content/        cards.json — the verified card pool
```

Built in 48 hours with Claude.
