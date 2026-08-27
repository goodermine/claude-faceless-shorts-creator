// Brand 3-font system — SELF-HOSTED from media/fonts/ (staticFile) so renders need
// no network. (Google Fonts' runtime CDN fetch fails behind the restricted egress
// proxy — the browser can't validate the proxy CA. Local woff2 sidesteps TLS entirely.)
// Family names are unchanged from the previous @remotion/google-fonts setup, so every
// shot keeps working. woff2 fetched once via tools/getfonts (latin subset, matching weights).
import { staticFile, delayRender, continueRender } from 'remotion';

type Face = { family: string; weight: number; file: string };

const FACES: Face[] = [
  { family: 'Space Grotesk', weight: 500, file: 'SpaceGrotesk-500.woff2' },
  { family: 'Space Grotesk', weight: 600, file: 'SpaceGrotesk-600.woff2' },
  { family: 'Space Grotesk', weight: 700, file: 'SpaceGrotesk-700.woff2' },
  { family: 'Inter', weight: 400, file: 'Inter-400.woff2' },
  { family: 'Inter', weight: 500, file: 'Inter-500.woff2' },
  { family: 'Inter', weight: 600, file: 'Inter-600.woff2' },
  { family: 'JetBrains Mono', weight: 400, file: 'JetBrainsMono-400.woff2' },
  { family: 'JetBrains Mono', weight: 500, file: 'JetBrainsMono-500.woff2' },
  { family: 'JetBrains Mono', weight: 700, file: 'JetBrainsMono-700.woff2' },
  { family: 'Spectral', weight: 500, file: 'Spectral-500.woff2' },
  { family: 'Spectral', weight: 600, file: 'Spectral-600.woff2' },
  { family: 'Source Serif 4', weight: 600, file: 'SourceSerif4-600.woff2' },
  { family: 'Source Serif 4', weight: 700, file: 'SourceSerif4-700.woff2' },
  { family: 'Source Serif 4', weight: 900, file: 'SourceSerif4-900.woff2' },
];

// Register the faces in the browser bundle and hold the render until they're ready.
if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  const handle = delayRender('self-hosted fonts', { timeoutInMilliseconds: 120000 });
  // Each face resolves independently (a single failure never stalls the others),
  // and the handle clears once all have settled.
  Promise.allSettled(
    FACES.map((f) => {
      const ff = new FontFace(f.family, `url(${staticFile('fonts/' + f.file)}) format('woff2')`, {
        weight: String(f.weight),
        style: 'normal',
      });
      return ff.load().then((loaded) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document.fonts as any).add(loaded);
      });
    }),
  ).then(() => continueRender(handle));
}

export const FONT_DISPLAY = 'Space Grotesk';
export const FONT_BODY = 'Inter';
export const FONT_MONO = 'JetBrains Mono';
// serif for the Claude Code wordmark clone (close match to the app's serif)
export const FONT_SERIF = 'Spectral';
// heavy editorial serif for the vox collage engine's headlines
export const FONT_EDITORIAL = 'Source Serif 4';
