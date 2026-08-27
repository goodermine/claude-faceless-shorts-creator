#!/usr/bin/env python3
"""Fetch the brand fonts (latin woff2) into media/fonts/ so Remotion renders need
NO network at render time. @remotion/google-fonts fetches from Google's CDN at render
time, which fails behind a restricted egress proxy (the render browser can't validate
the proxy CA); self-hosting the woff2 sidesteps TLS entirely. src/fonts.ts loads these
via staticFile(). Re-run this whenever a weight is added there.

Honours HTTPS_PROXY and SSL_CERT_FILE from the environment (urllib reads both), so it
works through the agent proxy. Run from the repo root:  python tools/getfonts.py
"""
import os
import re
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media", "fonts")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0.0.0 Safari/537.36")

# family (Google name) -> weights. Mirror src/fonts.ts.
FAMILIES = {
    "Space Grotesk": [500, 600, 700],
    "Inter": [400, 500, 600],
    "JetBrains Mono": [400, 500, 700],
    "Spectral": [500, 600],
    "Source Serif 4": [600, 700, 900],
}


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read() if binary else r.read().decode("utf-8")


def main():
    os.makedirs(OUT, exist_ok=True)
    fam_q = "&".join(
        "family=" + f.replace(" ", "+") + ":wght@" + ";".join(str(w) for w in ws)
        for f, ws in FAMILIES.items()
    )
    css = get("https://fonts.googleapis.com/css2?" + fam_q + "&display=swap")
    saved = []
    # each /* subset */ comment applies to the following @font-face block; keep latin.
    for subset, body in re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{([^}]*)\}", css):
        if subset != "latin":
            continue
        fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        wght = re.search(r"font-weight:\s*(\d+)", body).group(1)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        slug = fam.replace(" ", "") + "-" + wght + ".woff2"
        with open(os.path.join(OUT, slug), "wb") as fh:
            fh.write(get(url, binary=True))
        saved.append(slug)
    print("wrote", len(saved), "faces to", OUT)
    for s in sorted(saved):
        print("  -", s)


if __name__ == "__main__":
    main()
