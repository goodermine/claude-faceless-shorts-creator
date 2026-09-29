"""Fuse three sources into word-exact VO timing for vox-3:
  - the SCRIPT (ground-truth words + spelling, e.g. 'centre')
  - SILENCE MAP phrase windows (authoritative line boundaries, from ffmpeg silencedetect)
  - WHISPER word starts/ends (placement of words inside each phrase)
Whisper words are matched to script words in order; each word is clamped into its phrase
window (fixes Whisper pulling a word into a pause, and ignores its trailing hallucination).
Writes beats.json (repo contract) and vo.gen.ts (imported by the composition)."""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))  # repo root
LINES = [  # (text, phrase window from silencedetect speech segments)
    ("Want to hit heavier?", 0.00, 0.86, "hook"),
    ("Don't swing harder.", 1.61, 2.49, "hook"),
    ("Let more of you take part.", 3.16, 4.35, "hook"),
    ("Tap the pad with just the hand.", 5.09, 6.61, "ladder"),
    ("Now let the forearm belong to it.", 7.34, 8.84, "ladder"),
    ("Then the elbow.", 9.56, 10.34, "ladder"),
    ("The shoulder.", 11.05, 11.59, "ladder"),
    ("The trunk.", 12.23, 12.70, "ladder"),
    ("The centre.", 13.44, 13.93, "ladder"),
    ("Then let the legs own the ground.", 14.63, 16.38, "ladder"),
    ("To you, almost nothing changes.", 17.06, 19.45, "twist"),
    ("But to the person holding the pad,", 20.10, 21.52, "twist"),
    ("it keeps getting heavier", 21.87, 22.89, "twist"),
    ("until it stops feeling like a hand at all.", 23.29, 25.51, "twist"),
    ("The legs do not punch.", 26.22, 27.47, "payoff"),
    ("The arms do not punch alone, either.", 28.00, 29.77, "payoff"),
    ("The person punches.", 30.55, 31.77, "payoff"),
    ("Heavier.", 32.44, 32.88, "loop"),
    ("Not harder.", 33.56, 34.23, "loop"),
]

norm = lambda s: re.sub(r"[^a-z']", "", s.lower().replace("’", "'"))
wh = json.load(open(os.path.join(HERE, "whisper-words.json")))
wi = 0
vo = []
for text, a, b, beat in LINES:
    toks = text.split()
    words = []
    for t in toks:
        # advance through whisper words until the normalized token matches
        while wi < len(wh) and norm(wh[wi]["w"]) != norm(t):
            wi += 1
        if wi < len(wh):
            s, e = wh[wi]["start"], wh[wi]["end"]
            wi += 1
        else:
            s = e = None
        words.append({"w": t, "start": s, "end": e})
    # Keep Whisper's relative spacing; only nudge the minimum needed to stay inside the
    # phrase window and strictly ordered (Whisper tends to start a phrase's first word
    # early, into the pause). Even spacing is used ONLY for a word Whisper never matched.
    n = len(words)
    for i, w in enumerate(words):
        if w["start"] is None:
            w["start"] = a + (b - a) * i / n
        floor = a if i == 0 else words[i - 1]["start"] + 0.04
        w["start"] = round(min(max(w["start"], floor), b - 0.05), 3)
    for i, w in enumerate(words):
        nxt = words[i + 1]["start"] if i + 1 < n else b
        e = w["end"] if w["end"] is not None else nxt
        w["end"] = round(min(max(e, w["start"] + 0.08), nxt), 3)
    vo.append({"beat": beat, "text": text, "start": a, "end": b, "words": words})

beats = {
    "id": "vox-3-zhan-zhuang",
    "title": "Heavier, Not Harder",
    "source": "Zhan Zhuang – Internal Power (Aaron Ellis), Chapter 36 — Heavier, Not Harder",
    "composition": "Vox3HeavierNotHarder",
    "format": {"width": 1080, "height": 1920, "fps": 30, "durationSec": 35.6},
    "voiceStatus": "elevenlabs:vfUnrup2Gg0HIEnGQSnE (Aaron — Professional Voice Clone), eleven_multilingual_v2",
    "timing": "silencedetect phrase windows + faster-whisper word times, fused by align_vo.py",
    "vo": vo,
}
json.dump(beats, open(f"{ROOT}/vox-shorts/vox-3-zhan-zhuang/beats.json", "w"), indent=2, ensure_ascii=False)

ts = ["// AUTO-GENERATED from vox-shorts/vox-3-zhan-zhuang/beats.json — do not hand-edit.",
      "// Real word times: silencedetect phrase windows + faster-whisper, fused (align_vo.py).",
      "import type { VoLine } from '../../lib/shorts';", "",
      "export const VO: VoLine[] = " + json.dumps(
          [{"text": l["text"], "start": l["start"], "end": l["end"], "words": l["words"]} for l in vo],
          indent=2, ensure_ascii=False) + ";", ""]
open(f"{ROOT}/remotion/src/shots/vox-3/vo.gen.ts", "w").write("\n".join(ts))

for l in vo:
    print(f"{l['start']:6.2f}-{l['end']:6.2f} [{l['beat']:6}] " + " ".join(f"{w['w']}@{w['start']:.2f}" for w in l["words"]))
