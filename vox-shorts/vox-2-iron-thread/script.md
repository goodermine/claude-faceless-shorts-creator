# vox-2 · Iron Thread — "Springs, Not Bricks"

Source: *Iron Thread — The Lost Art of Tendon Strength* (Aaron Ellis), **Chapter 4 — Springs, Not Bricks**
(`bookshelf` repo, `manuscripts/iron-thread/manuscript.txt`).

Format: 1080×1920 @ 30fps, ~38s (1140 frames). Layered-collage (Vox) look on the `collage.tsx` kit.
Pixels: **illustrated** — subjects are authored as inline SVG props (brick, coil spring, drawn bow),
NOT AI die-cut photos. This is the no-API-key pilot build; when a `GEMINI_API_KEY` is added, the same
scene plan swaps the SVG subjects for photographic `Cutout`s with no change to the choreography.

Voice: **none yet.** The on-screen `SerifStatement` lines carry the narrative (documentary Vox often
runs caption-free). VO column below is the *intended* narration for a later `gen_voice.py` pass.

## The idea (one visual metaphor, held all the way through)

Tendons are strong because they are **springy, not rigid.** A **brick** is stiff right up until it
**cracks**; a **spring / drawn bow** loads and gives the energy back. The chapter's anecdote — a 70 kg
Muay Thai coach folding a man twice his size with a low kick — becomes *spring beats brick*. Visual
vocabulary the whole short reuses: **BRICK = brittle · COIL/BOW = resilient.**

## Beat sheet

| Beat | Time | Camera | On-screen layers | VO (intended) |
|------|------|--------|------------------|----------------|
| **HOOK** | 0–5.3s | push 1.0→1.06 | Frame 0 fully composed: title **"Springs, not bricks."** (Springs highlighted), a **brick** (left) + **coil spring** (right) already placed, kicker chip "IRON THREAD · CH 4 — the lost art of tendon strength" | "Picture a strong material. You imagine a brick. For tendons, that's wrong." |
| **BRICK** | 5–13s | ease to brick, z1.16 | Brick centred + enlarged; statement **"A brick is stiff — until it cracks."**; a jagged **crack** draws across it; red chip **"Brittle · no rebound"** | "A brick is stiff right up until it's too stiff — and then it cracks." |
| **SPRING / BOW** | 12.3–22s | pan to bow, z1.12 | A **drawn bow** (the Achilles "loads like a drawn bow"); a small coil echo; statement **"A tendon loads like a drawn bow — and gives it back."**; teal **rebound arrow** springs up; chips **"Load · energy stored"** / **"Rebound · given back"** | "A tendon stores energy and gives it back. It loads like a drawn bow, then snaps back." |
| **ANECDOTE** | 21.7–31s | widen, z1.06 | statement **"Beaten by a better spring."**; small **coil** "70 kg" vs big **brick** "twice his size"; a dashed **kick arc** whips spring→brick; red **"SAT DOWN"** stamp | "A 70-kilo coach folded a man twice his size with one low kick. Not out-muscled — out-sprung." |
| **CLOSE / LOOP** | 30–38s | return home 1.06→1.0 | back to the composed title frame (brick + spring + title) ≈ frame 0; chip **"Build living springs."** | "We're not turning you to stone. We're building living springs." |

Loop: the final frame reproduces the HOOK composition (title + brick + spring) so it replays seamlessly.
No CTA outro — it ends on the payoff line and dissolves back into the intro.

## Layout (vertical safe areas)

- Title band y≈470; hero props y≈980–1120 (board centre); chips/annotations mid–lower; kicker chip y≈1520.
- Nothing critical in the bottom ~340px (UI) or right ~160px (like/share rail); text ≥5% from edges.
- Frame 0 is the thumbnail — brick + spring + title all present at f0 (`enter="none"` on the props).

## Layers → sources

| Subject | This pilot (no key) | Photographic upgrade (with GEMINI_API_KEY) |
|---|---|---|
| Brick | inline SVG `Brick` prop | `gen_image.py` "a single house brick, isolated on white" → `cutout.py` |
| Coil spring | inline SVG `Coil` prop | product photo of a steel compression spring → cutout |
| Drawn bow / Achilles | inline SVG `Bow` prop | archival drawing of a drawn bow, or a leg/Achilles diagram |
| Crack, rebound arrow, kick arc | `SketchArrow` (SVG in TSX) | unchanged |
| Chips, statements, stamp, paper, grain | kit (`LabelChip`, `SerifStatement`, `RubberStamp`, `PaperBG`, `Grain`) | unchanged |

## Production notes

- One `CollageBoard cam={CAM}`; scenes are `<Sequence layout="none">` with a `SceneFade` tail so
  annotations clear before the next scene composes. Camera keys are GLOBAL frames; layer `at`s are LOCAL.
- Subjects are pure SVG components inside the kit's generic `Layer` → they inherit entrance / idle-drift /
  parallax-by-depth for free (verified against `collage.tsx`).
- Palette is the VOX kit (paper `#efe6d3`, ink, red, teal, yellow). A dedicated Iron-Thread / martial-arts
  brand skin is a later step; this pilot ships in the stock Vox palette.
- QA at phone scale before any full render; last frame must land on frame 0.
