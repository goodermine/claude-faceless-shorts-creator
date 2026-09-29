#!/usr/bin/env python3
"""Master a rendered short's audio to a loudness target. The video stream is copied untouched.

Chain: gentle compressor (evens out the voice) -> make-up gain solved to the LUFS target ->
peak limiter (ceiling). Loudness is measured per ITU-R BS.1770 (pyloudnorm), and the result is
re-measured AFTER the AAC encode, since encoding can shift peaks.

Why: renders sum the voice + SFX at the composition's raw levels. ElevenLabs narration lands
around -21 LUFS, well under what shorts platforms play at (they turn loud content DOWN but do
not turn quiet content up), and the existing mix tools only add a safety limiter.

Needs: pip install pedalboard pyloudnorm numpy ; ffmpeg on PATH (falls back to the full ffmpeg
Remotion bundles in remotion/node_modules/@remotion/compositor-*/). Run from the repo root:

    python tools/master_audio.py remotion/out/Vox3HeavierNotHarder.mp4
    python tools/master_audio.py in.mp4 --lufs -14 --ceiling -1.5 --out out.mp4
"""
import argparse
import glob
import io
import os
import shutil
import subprocess
import wave

import numpy as np
import pyloudnorm as pyln
from pedalboard import Compressor, Gain, Limiter, Pedalboard

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def find_ffmpeg():
    sysff = shutil.which("ffmpeg")
    if sysff:
        return sysff, dict(os.environ)
    for d in sorted(glob.glob(os.path.join(ROOT, "remotion", "node_modules", "@remotion", "compositor-*"))):
        ff = os.path.join(d, "ffmpeg")
        if os.path.exists(ff):
            env = dict(os.environ)
            env["LD_LIBRARY_PATH"] = d + os.pathsep + env.get("LD_LIBRARY_PATH", "")
            return ff, env
    raise SystemExit("no ffmpeg found (install one, or `cd remotion && npm install`)")


# Audio moves through pipes as 16-bit WAV: Remotion's bundled ffmpeg is a stripped build with no
# raw-float (f32le) format, but every ffmpeg has the wav muxer/demuxer and pcm_s16le.
def decode(ff, env, path):
    raw = subprocess.run([ff, "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(SR),
                          "-acodec", "pcm_s16le", "-f", "wav", "-"], check=True, capture_output=True, env=env).stdout
    pcm = raw[raw.find(b"data") + 8:]  # piped WAV has no seekable size field; take all data
    pcm = pcm[: len(pcm) // 4 * 4]
    return np.frombuffer(pcm, dtype=np.int16).reshape(-1, 2).astype(np.float32) / 32768.0


def to_wav(x):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1.0, 1.0) * 32767.0).round().astype(np.int16).tobytes())
    return buf.getvalue()


def measure(x):
    return pyln.Meter(SR).integrated_loudness(x.astype(np.float64)), 20 * np.log10(np.abs(x).max() + 1e-12)


def master(x, lufs, ceiling):
    comp = Pedalboard([Compressor(threshold_db=-24, ratio=2.0, attack_ms=12, release_ms=160)])
    y = comp(x.T.copy(), SR).T
    gain = lufs - measure(y)[0]
    for _ in range(4):  # the limiter shaves loudness, so re-solve the make-up gain
        z = Pedalboard([Gain(gain_db=gain), Limiter(threshold_db=ceiling, release_ms=120)])(y.T.copy(), SR).T
        z = np.clip(z, -1.0, 1.0)
        got = measure(z)[0]
        if abs(got - lufs) < 0.15:
            break
        gain += lufs - got
    return z


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--lufs", type=float, default=-15.5, help="integrated loudness target (repo shorts standard)")
    ap.add_argument("--ceiling", type=float, default=-1.5, help="limiter ceiling, dBFS (headroom for AAC)")
    ap.add_argument("--out", help="default: <name>-master.mp4 next to the input")
    a = ap.parse_args()
    out = a.out or os.path.splitext(a.video)[0] + "-master.mp4"
    ff, env = find_ffmpeg()

    x = decode(ff, env, a.video)
    l0, p0 = measure(x)
    z = master(x, a.lufs, a.ceiling)
    subprocess.run([ff, "-v", "error", "-y", "-i", a.video, "-f", "wav", "-i", "-",
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out],
                   input=to_wav(z), check=True, env=env)
    l1, p1 = measure(decode(ff, env, out))
    print(f"in : {l0:6.1f} LUFS  peak {p0:6.2f} dBFS  ({os.path.relpath(a.video)})")
    print(f"out: {l1:6.1f} LUFS  peak {p1:6.2f} dBFS  ({os.path.relpath(out)}, measured after AAC encode)")


if __name__ == "__main__":
    main()
