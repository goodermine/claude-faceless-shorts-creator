# vox-3 · Zhan Zhuang — "Heavier, Not Harder"

Source: *Zhan Zhuang – Internal Power* (Aaron Ellis), **Chapter 36 — Heavier, Not Harder**
(`bookshelf` repo, `manuscripts/zhan-zhuang-power/manuscript.txt`). Series: Zhan Zhuang & Martial Arts.

Format: 1080×1920 @ 30fps, 35.6s (1068 frames). Vox layered collage on the `collage.tsx` kit.
Voice: **Aaron's own Professional Voice Clone** (ElevenLabs `vfUnrup2Gg0HIEnGQSnE`,
`eleven_multilingual_v2`), generated in-session via the ElevenLabs connector — 34.64s.
Timing: word-exact (see `beats.json`) — ffmpeg `silencedetect` phrase windows fused with
faster-whisper word times; the script supplies spelling ("centre").

## The idea

The chapter's own drill — **the ladder** — is the whole short. Tap the pad with the hand, then let
the forearm belong to it, the elbow, the shoulder, the trunk, the centre, the legs. *"To you, almost
nothing changes… but to the person holding the shield the knock keeps getting heavier."*

Visual: the book's own compact-strike figure (right panel of `figures/safe-stop.jpg`, cut out). As
each rung is spoken, a **gold line draws along that link of the body** — hand → forearm → elbow →
shoulder → trunk → centre → legs → ground — until the whole figure is lit, echoing the gold-lit
figure on the book's cover. Either side of him, two meters on the same 7-slot scale:
**YOUR EFFORT** (stays at one slot) and **WHAT THEY FEEL** (the pad — climbs a slot per rung).
The gap between the two meters *is* the chapter. Each rung's knock also gets audibly heavier.

## Beat sheet (real word times)

| Beat | Time | On screen | VO |
|------|------|-----------|-----|
| HOOK | 0–5.1s | Frame 0 composed: kicker chip (Aaron Ellis · Chapter 36 / *Zhan Zhuang – Internal Power*), title **Heavier, / not harder.**, the figure fully lit gold, the book cover as a taped print | "Want to hit heavier? Don't swing harder. Let more of you take part." |
| LADDER | 5.1–16.4s | Cover out, meters in; chain resets and relights one link per spoken word (hand 6.18 · forearm 7.70 · elbow 9.80 · shoulder 11.09 · trunk 12.27 · centre 13.48 · legs 15.12 · ground 15.84); pad fills + shakes harder each rung; effort stays at one | "Tap the pad with just the hand. Now let the forearm belong to it. Then the elbow. The shoulder. The trunk. The centre. Then let the legs own the ground." |
| TWIST | 17.1–25.5s | Gold hand-drawn ring around the effort meter; the book's partner-start photo (Ch 17) as an archival print; **HEAVIER** stamp slams on the pad at "heavier" (22.30) with a gold burst | "To you, almost nothing changes. But to the person holding the pad, it keeps getting heavier — until it stops feeling like a hand at all." |
| PAYOFF | 26.2–31.8s | Legs pulse on "legs", arms pulse on "arms", whole chain flares + halo on "person"; statement **The person punches.** | "The legs do not punch. The arms do not punch alone, either. The person punches." |
| LOOP | 32.4–35.6s | Meters out, cover back, title returns line by line on "Heavier." / "Not harder." — last frame = frame 0 | "Heavier. Not harder." |

No CTA outro: it ends on the payoff and dissolves into the intro. The book is credited by the
kicker chip + cover print in the loop frame (which is also the thumbnail).

## Layers → sources

| Layer | Source |
|---|---|
| `puncher.png` | Book figure `safe-stop.jpg` (right panel, cropped at the knuckles to drop the baked-in arrow/tick), cut out locally with rembg `u2net_human_seg` |
| `partner-start.jpg` | Book figure (Ch 17, *Put Hands On It*) — archival print, no cutout |
| `cover.jpg` | The book's cover — archival print |
| `paper.jpg` | Generated in-session (ElevenLabs connector, `bytedance-seedream-5-lite`), rotated to portrait |
| `narration.mp3` | Generated in-session with Aaron's voice clone |
| Gold chain, meters, ring, burst | SVG authored in TSX |
| SFX | Library only (`knock-solid`, `impact-soft`, `impact-deep-soft`, `whoosh-soft`, `page-flip`, `stamp-hit`, `warm-shimmer`) |

## Safe areas

Captions (dark pill, gold active word) centred y≈1320 — above YouTube Shorts' ~500px bottom UI
zone. Nothing critical right of x≈920. During zoomed beats the camera frames higher so the
figure's feet stay clear of the caption band.

## Generation cost (this video)

Narration ~$0.10 · paper texture ~$0.05 · (demo brick/fighter images earlier ~$0.54, unused here).
