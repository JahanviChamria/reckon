# Reckon: the moat

## The problem, stated plainly

Reckon was built in a weekend, so anyone can build it. Four canvas widgets, a
seeded feed, a pool of cards — all reproducible. The finite-feed idea is a
*decision*, not a barrier; a competitor copies it in an afternoon. No accounts,
no data, no network effects. As an artifact, the moat is zero.

So the moat can't be the artifact. It has to be something that **compounds over
time** or has **trust / habit lock-in**.

## The three real moats

### 1. The content engine (technical, compounding)

The real bottleneck for any "learn by scrolling" app is producing a *sustained*
stream that stays surprising, mechanistic, correct, and interactive. Three
things compound here, none clonable in a weekend:

- **A verification pipeline.** Every card carries a `source` field. Turn it into
  an automated first-pass fact-checker (fetch source → model checks the claim →
  human approves). In an AI-slop era, "every claim verified" is the
  differentiator, and doing it *cheaply* is the moat.
- **A widget library.** Each widget is ~90 minutes of craft, but once built one
  backs many cards (ScaleZoom already backs several). At 20 widgets a competitor
  must rebuild all 20 to reach parity, and content composes them combinatorially.
  Illustration doesn't compound; an interaction engine does.
- **Generation + review velocity.** A week of feed in an evening while rivals
  hand-write. Velocity is a moat *when quality holds* — and the verifier holds it.

### 2. The daily ritual + share loop (distribution)

Wordle's code was cloned in days; its moat was being *the* daily habit and *the*
shared object. Reckon has the ingredients: a finite feed with a real stop, the
share image (built), a shared seeded "today's feed" like a Wordle puzzle, and a
day counter. Add the daily notification (the #1 v1 item) and you own a habit
slot. Being first and default is the moat, not the mechanic.

### 3. Editorial trust + taste (brand)

"The science feed you can actually trust — every claim sourced, every card passes
the Kurzgesagt test." Slow to build, destroyed by one wrong fact, impossible to
fake at scale without moat #1 underneath. A magazine moat.

## The plan, in order

1. **Verifier** on the `source` field — biggest trust-per-effort, and it makes
   scaling content safe.
2. **Grow the widget library** deliberately — each new widget is a permanent
   compounding asset, not a one-off.
3. **Daily notification** + lean into the shared "today's feed" framing to lock
   the ritual (the share image already seeds acquisition).
4. **Never ship an unverified card.** The trust brand is the cheapest moat to
   hold and the most expensive to rebuild.

## The positioning that wins

The competitors are each missing one leg, and the content engine is what lets a
solo builder hold all four at once cheaply:

> Generic AI learning apps have volume but no trust and no real interaction.
> Imprint-style apps are polished but static and course-shaped, not snackable.
> Doomscroll apps own the habit but the content is empty and never ends.
> **Reckon is the only one that is verified, interactive, finite, and daily.**

Holding all four simultaneously is the actual barrier, and it's only affordable
because of the engine. That's the moat.

## Corollary: the visuals

Card art is **generative / systematic, not hand-drawn**, so the engine produces
the whole card — text, widget, and a visual — at near-zero marginal cost. Craft
that compounds, not craft you repeat.
