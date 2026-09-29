#!/usr/bin/env python3
"""Word-exact VO timing for vox-3, fused from three sources:
  - the SCRIPT (ground-truth words + spelling, e.g. 'centre', 'Zhan Zhuang')
  - SILENCE-MAP phrase windows (authoritative line boundaries; ffmpeg silencedetect on the audio)
  - WHISPER word times (placement of words inside each phrase; faster-whisper, word_timestamps)
The ElevenLabs connector returns no word timestamps, so timing comes from the audio itself.

Audio: media/projects/vox-3-zhan-zhuang/narration-cta.m4a (narration + spliced CTA, splice_cta.py).
Writes beats.json (repo contract) and remotion/src/shots/vox-3/vo.gen.ts.

    python vox-shorts/vox-3-zhan-zhuang/align_vo.py --transcribe   # re-run Whisper, then align
    python vox-shorts/vox-3-zhan-zhuang/align_vo.py                # align from whisper-words.json
"""
import argparse
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))  # repo root
AUDIO = os.path.join(ROOT, "media", "projects", "vox-3-zhan-zhuang", "narration-cta.m4a")
WHISPER_JSON = os.path.join(HERE, "whisper-words.json")

# (text, phrase window from the silencedetect speech segments of narration-cta.m4a, beat)
LINES = [
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
    ("The arms do not punch alone, either.", 28.00, 29.76, "payoff"),
    ("The person punches.", 30.55, 31.76, "payoff"),
    ("It's all in my book,", 32.70, 33.54, "cta"),
    ("Zhan Zhuang: Internal Power.", 33.81, 35.36, "cta"),
    ("On Amazon now.", 35.69, 36.43, "cta"),
    ("Heavier.", 37.18, 37.62, "loop"),
    ("Not harder.", 38.30, 38.96, "loop"),
]
DURATION = 40.4
LOOKAHEAD = 6  # a script word may only match one of the next few Whisper words


def transcribe():
    from faster_whisper import WhisperModel

    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(AUDIO, word_timestamps=True, vad_filter=False, beam_size=5,
                               initial_prompt=" ".join(t for t, *_ in LINES))
    words = [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for s in segs for w in s.words]
    json.dump(words, open(WHISPER_JSON, "w"), indent=0)
    print(f"whisper: {len(words)} words -> {os.path.relpath(WHISPER_JSON, ROOT)}")


def norm(s):
    return re.sub(r"[^a-z']", "", s.lower().replace("’", "'"))


def align():
    wh = json.load(open(WHISPER_JSON))
    wi = 0
    vo = []
    for text, a, b, beat in LINES:
        words = []
        for t in text.split():
            # bounded lookahead: an unmatched word (e.g. a mis-heard proper noun) must NOT consume
            # the rest of the Whisper stream, or every later line loses its timing
            hit = next((j for j in range(wi, min(wi + LOOKAHEAD, len(wh)))
                        if norm(wh[j]["w"]) == norm(t) and a - 0.6 <= wh[j]["start"] <= b + 0.3), None)
            if hit is None:
                words.append({"w": t, "start": None, "end": None})
            else:
                words.append({"w": t, "start": wh[hit]["start"], "end": wh[hit]["end"]})
                wi = hit + 1
        n = len(words)
        # unmatched words: spread evenly between their matched neighbours (or the phrase bounds)
        i = 0
        while i < n:
            if words[i]["start"] is not None:
                i += 1
                continue
            j = i
            while j < n and words[j]["start"] is None:
                j += 1
            lo = words[i - 1]["start"] if i > 0 else a
            hi = words[j]["start"] if j < n else b
            for k in range(i, j):
                words[k]["start"] = lo + (hi - lo) * (k - i + (1 if i > 0 else 0)) / (j - i + 1)
            i = j
        # keep Whisper's relative spacing; only nudge the minimum to stay inside the window, ordered
        for i, w in enumerate(words):
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
        "format": {"width": 1080, "height": 1920, "fps": 30, "durationSec": DURATION},
        "voiceStatus": "elevenlabs:vfUnrup2Gg0HIEnGQSnE (Aaron — Professional Voice Clone), eleven_multilingual_v2; "
                       "CTA generated separately and spliced (splice_cta.py)",
        "timing": "silencedetect phrase windows + faster-whisper word times, fused by align_vo.py",
        "vo": vo,
    }
    json.dump(beats, open(os.path.join(HERE, "beats.json"), "w"), indent=2, ensure_ascii=False)
    ts = ["// AUTO-GENERATED from vox-shorts/vox-3-zhan-zhuang/beats.json — do not hand-edit.",
          "// Real word times: silencedetect phrase windows + faster-whisper, fused (align_vo.py).",
          "import type { VoLine } from '../../lib/shorts';", "",
          "export const VO: VoLine[] = " + json.dumps(
              [{"text": l["text"], "start": l["start"], "end": l["end"], "words": l["words"]} for l in vo],
              indent=2, ensure_ascii=False) + ";", ""]
    open(os.path.join(ROOT, "remotion", "src", "shots", "vox-3", "vo.gen.ts"), "w").write("\n".join(ts))
    for l in vo:
        print(f"{l['start']:6.2f}-{l['end']:6.2f} [{l['beat']:6}] " + " ".join(f"{w['w']}@{w['start']:.2f}" for w in l["words"]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--transcribe", action="store_true", help="re-run faster-whisper on the audio first")
    if ap.parse_args().transcribe:
        transcribe()
    align()
