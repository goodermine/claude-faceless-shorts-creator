#!/usr/bin/env python3
"""Splice the call-to-action line into the approved narration -> narration-cta.m4a.

The main narration (narration.mp3) was approved as-is, so it is NOT regenerated. The CTA
("It's all in my book, Zhan Zhuang: Internal Power. On Amazon now.") was generated separately
in the same voice clone (cta.mp3), loudness-matched to the narration, and dropped into the
pause after the payoff "The person punches." The loop line "Heavier. Not harder." still ends
the video, so the last frame still lands on frame 0.

Layout (seconds, composite timeline):
    0.00 .. SPLIT            narration, unchanged (ends 0.33s after "punches")
    CTA_AT ..                cta.mp3, gain-matched (speech starts at the clip's 0.0)
    B_AT ..                  narration from SPLIT onward ("Heavier." sits 0.34s into it)
Run from the repo root:  python vox-shorts/vox-3-zhan-zhuang/splice_cta.py
"""
import os
import subprocess
import wave

import numpy as np
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
MEDIA = os.path.join(ROOT, "media", "projects", "vox-3-zhan-zhuang")
FFDIR = os.path.join(ROOT, "remotion", "node_modules", "@remotion", "compositor-linux-x64-gnu")
FF = os.path.join(FFDIR, "ffmpeg")
ENV = dict(os.environ, LD_LIBRARY_PATH=FFDIR)
SR = 48000

SPLIT = 32.10  # inside the pause between "punches." (ends 31.77) and "Heavier." (32.44)
PUNCHES_END = 31.77
BREATH_BEFORE_CTA = 0.85  # let the payoff land
CTA_SPEECH_END = 3.81  # in cta.mp3 (silencedetect)
GAP_BEFORE_HEAVIER = 0.75
HEAVIER_INTO_B = 32.44 - SPLIT


def load(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-acodec", "pcm_s16le",
                          "-f", "wav", "-"], check=True, capture_output=True, env=ENV).stdout
    pcm = raw[raw.find(b"data") + 8:]
    return np.frombuffer(pcm[: len(pcm) // 4 * 4], dtype=np.int16).reshape(-1, 2).astype(np.float64) / 32768.0


def silence(sec):
    return np.zeros((int(round(sec * SR)), 2))


def main():
    narr, cta = load(os.path.join(MEDIA, "narration.mp3")), load(os.path.join(MEDIA, "cta.mp3"))
    meter = pyln.Meter(SR)
    gain_db = meter.integrated_loudness(narr) - meter.integrated_loudness(cta)
    cta = cta * 10 ** (gain_db / 20)

    cta_at = PUNCHES_END + BREATH_BEFORE_CTA
    b_at = cta_at + CTA_SPEECH_END + GAP_BEFORE_HEAVIER - HEAVIER_INTO_B
    a = narr[: int(round(SPLIT * SR))]
    gap1 = silence(cta_at - SPLIT)
    gap2 = silence(max(0.0, b_at - (cta_at + len(cta) / SR)))
    if b_at < cta_at + len(cta) / SR:  # B starts inside the CTA's trailing silence: trim it
        cta = cta[: int(round((b_at - cta_at) * SR))]
    out = np.concatenate([a, gap1, cta, gap2, narr[int(round(SPLIT * SR)):]])
    peak = 20 * np.log10(np.abs(out).max())
    assert peak < -1.0, f"splice would clip ({peak:.2f} dBFS)"

    wav = os.path.join(MEDIA, "_splice.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2), w.setsampwidth(2), w.setframerate(SR)
        w.writeframes((out * 32767).round().astype(np.int16).tobytes())
    dst = os.path.join(MEDIA, "narration-cta.m4a")
    # -f mp4: Remotion's stripped ffmpeg lacks the .m4a (ipod) muxer name; mp4 is the same container
    subprocess.run([FF, "-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "192k", "-f", "mp4", dst],
                   check=True, env=ENV)
    os.remove(wav)
    print(f"CTA gain {gain_db:+.1f} dB | CTA at {cta_at:.2f}s | shift after split {b_at - SPLIT:+.2f}s | "
          f"total {len(out)/SR:.2f}s | peak {peak:.2f} dBFS -> {os.path.relpath(dst, ROOT)}")


if __name__ == "__main__":
    main()
