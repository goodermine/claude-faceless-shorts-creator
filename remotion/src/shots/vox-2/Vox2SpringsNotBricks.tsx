import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import {
  CollageBoard,
  Grain,
  Layer,
  LabelChip,
  PaperBG,
  RubberStamp,
  SerifStatement,
  SketchArrow,
  VOX,
} from '../../lib/collage';

// =============================================================================
// COMPOSITION — "Springs, Not Bricks" (Iron Thread, Ch 4). First martial-arts
// book short. Illustrated Vox collage: subjects are inline SVG props (no AI
// pixels / no API key). Scene plan: vox-shorts/vox-2-iron-thread/script.md.
// =============================================================================
export const compositionConfig = {
  id: 'Vox2SpringsNotBricks',
  durationInSeconds: 38,
  fps: 30,
  width: 1080,
  height: 1920,
};

const W = 1080;
const H = 1920;

// -----------------------------------------------------------------------------
// SVG subject props — each rendered INSIDE the kit's <Layer>, so it inherits the
// entrance / idle-drift / parallax engine for free. Pure (no hooks).
// -----------------------------------------------------------------------------
const Brick: React.FC = () => (
  <svg viewBox="0 0 300 188" width="100%" style={{ display: 'block', filter: 'drop-shadow(0 18px 22px rgba(40,28,12,0.30))' }}>
    <defs>
      <linearGradient id="brk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b25a40" />
        <stop offset="1" stopColor="#883e2b" />
      </linearGradient>
    </defs>
    <rect x="6" y="14" width="288" height="164" rx="8" fill="url(#brk)" stroke="#6c2e1f" strokeWidth="3" />
    <rect x="6" y="14" width="288" height="30" rx="8" fill="#c26a4f" opacity="0.55" />
    <g fill="#5a271b" opacity="0.18">
      <circle cx="58" cy="72" r="4.5" />
      <circle cx="150" cy="120" r="5.5" />
      <circle cx="236" cy="88" r="3.5" />
      <circle cx="108" cy="150" r="3" />
      <circle cx="205" cy="55" r="3" />
      <circle cx="255" cy="140" r="4" />
    </g>
  </svg>
);

const Coil: React.FC = () => (
  <svg viewBox="0 0 220 300" width="100%" style={{ display: 'block', filter: 'drop-shadow(0 16px 18px rgba(40,28,12,0.26))' }}>
    <defs>
      <linearGradient id="stl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8f979c" />
        <stop offset="0.5" stopColor="#eef2f4" />
        <stop offset="1" stopColor="#767e83" />
      </linearGradient>
    </defs>
    <line x1="110" y1="16" x2="110" y2="46" stroke="#767e83" strokeWidth="12" strokeLinecap="round" />
    {[54, 94, 134, 174, 214].map((cy, i) => (
      <ellipse key={i} cx="110" cy={cy} rx="80" ry="26" fill="none" stroke="url(#stl)" strokeWidth="15" />
    ))}
    <line x1="110" y1="250" x2="110" y2="280" stroke="#767e83" strokeWidth="12" strokeLinecap="round" />
    <line x1="36" y1="288" x2="184" y2="288" stroke="#767e83" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

const Bow: React.FC = () => (
  <svg viewBox="0 0 300 360" width="100%" style={{ display: 'block', filter: 'drop-shadow(0 16px 18px rgba(40,28,12,0.24))' }}>
    {/* limb, bowing left */}
    <path d="M172 24 C 58 122, 58 238, 172 336" fill="none" stroke={VOX.teal} strokeWidth="18" strokeLinecap="round" />
    {/* string, pulled to the right */}
    <path d="M172 24 L 240 180 L 172 336" fill="none" stroke={VOX.ink} strokeWidth="5" strokeLinecap="round" />
    {/* arrow shaft + head (ready to fly left) */}
    <line x1="240" y1="180" x2="72" y2="180" stroke={VOX.ink} strokeWidth="7" strokeLinecap="round" />
    <path d="M72 180 L 100 165 M72 180 L 100 195" fill="none" stroke={VOX.ink} strokeWidth="7" strokeLinecap="round" />
    {/* red fletching at the nock */}
    <path d="M240 180 L 262 167 M240 180 L 262 193" fill="none" stroke={VOX.red} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

// Fades a whole scene's layers out over its last `dur` local frames.
const SceneFade: React.FC<{ out: number; dur?: number; children: React.ReactNode }> = ({ out, dur = 16, children }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [out - dur, out], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ opacity: op }}>{children}</div>;
};

// GLOBAL frame cues (@30). Scene `from`s below; local at = cue - from.
const CUE = {
  // negative so the title + kicker are already composed at frame 0 (the thumbnail),
  // and the last frame lands on the same composition for a seamless loop.
  hookTitle: -40,
  hookKicker: -10,
  bHero: 158,
  bStatement: 170,
  bCrack: 205,
  bChip: 250,
  sBow: 380,
  sCoil: 388,
  sStatement: 392,
  sArrow: 470,
  sLoad: 430,
  sRebound: 520,
  aStatement: 662,
  aProps: 686,
  aArc: 720,
  aChips: 700,
  aStamp: 815,
  lHero: 918,
  lTitle: 940,
  lChip: 986,
} as const;

// Camera — one gentle journey: push on hook, ease onto the brick, pan to the bow,
// widen for the anecdote, return to the frame-0 framing for the loop. f strictly up.
const CAM = [
  { f: 0, x: 540, y: 960, z: 1.0 },
  { f: 130, x: 540, y: 985, z: 1.06 },
  { f: 165, x: 545, y: 1035, z: 1.16 },
  { f: 360, x: 545, y: 1035, z: 1.16 },
  { f: 400, x: 545, y: 995, z: 1.12 },
  { f: 640, x: 545, y: 995, z: 1.12 },
  { f: 690, x: 540, y: 1010, z: 1.06 },
  { f: 900, x: 540, y: 1005, z: 1.05 },
  { f: 960, x: 540, y: 960, z: 1.0 },
  { f: 1140, x: 540, y: 960, z: 1.0 },
];

const TITLE_WORDS = [{ t: 'Springs,', hl: true }, { t: 'not' }, { t: 'bricks.' }];

const Vox2SpringsNotBricks: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: VOX.paper }}>
      <CollageBoard cam={CAM}>
        <PaperBG w={W} h={H} />

        {/* ---- HOOK (0–5.3s): composed frame 0 — title + brick + spring ---- */}
        <Sequence from={0} durationInFrames={170} layout="none">
          <SceneFade out={162}>
            <Layer x={398} y={1120} w={380} at={0} enter="none" rotate={-3} depth={0.06} z={2}>
              <Brick />
            </Layer>
            <Layer x={706} y={1090} w={300} at={0} enter="none" rotate={3} depth={0.1} z={2}>
              <Coil />
            </Layer>
            <SerifStatement x={540} y={470} w={780} at={CUE.hookTitle} size={92} align="center" words={TITLE_WORDS} />
            <LabelChip
              x={540}
              y={1520}
              at={CUE.hookKicker}
              text="The lost art of tendon strength"
              kicker="Iron Thread · Chapter 4"
              accent={VOX.teal}
              size={33}
              rotate={-1.2}
            />
          </SceneFade>
        </Sequence>

        {/* ---- BRICK (5–13s): brittle — stiff until it cracks ---- */}
        <Sequence from={150} durationInFrames={242} layout="none">
          <SceneFade out={234}>
            <Layer x={540} y={1050} w={470} at={CUE.bHero - 150} enter="place" rotate={-2} depth={0.05} z={2}>
              <Brick />
            </Layer>
            <SerifStatement
              x={540}
              y={560}
              w={880}
              at={CUE.bStatement - 150}
              size={74}
              align="center"
              words={[{ t: 'A' }, { t: 'brick' }, { t: 'is' }, { t: 'stiff —' }, { t: 'until' }, { t: 'it' }, { t: 'cracks.', hl: true }]}
            />
            <SketchArrow
              id="crack"
              d="M 500 918 L 542 992 L 498 1038 L 566 1092 L 520 1142 L 588 1192"
              vb={{ w: W, h: H }}
              at={CUE.bCrack - 150}
              dur={22}
              color="#20160f"
              width={7}
              head={false}
              z={4}
            />
            <LabelChip x={786} y={1214} at={CUE.bChip - 150} text="Brittle" kicker="no rebound" accent={VOX.red} size={30} rotate={2} />
          </SceneFade>
        </Sequence>

        {/* ---- SPRING / BOW (12.3–22s): loads like a drawn bow, gives it back ---- */}
        <Sequence from={370} durationInFrames={300} layout="none">
          <SceneFade out={292}>
            <Layer x={540} y={980} w={520} at={CUE.sBow - 370} enter="place" rotate={-1.5} depth={0.06} z={2}>
              <Bow />
            </Layer>
            <Layer x={856} y={1140} w={150} at={CUE.sCoil - 370} enter="pop" rotate={4} depth={0.12} z={2}>
              <Coil />
            </Layer>
            <SerifStatement
              x={540}
              y={560}
              w={900}
              at={CUE.sStatement - 370}
              size={64}
              align="center"
              words={[{ t: 'A' }, { t: 'tendon' }, { t: 'loads' }, { t: 'like' }, { t: 'a' }, { t: 'drawn' }, { t: 'bow —' }, { t: 'and' }, { t: 'gives' }, { t: 'it' }, { t: 'back.', hl: true }]}
            />
            <SketchArrow
              id="rebound"
              d="M 706 1214 C 766 1064, 704 902, 726 772"
              vb={{ w: W, h: H }}
              at={CUE.sArrow - 370}
              dur={26}
              color={VOX.teal}
              width={8}
              head
              z={3}
            />
            <LabelChip x={300} y={1030} at={CUE.sLoad - 370} text="Load" kicker="energy stored" accent={VOX.red} size={28} rotate={-2} />
            <LabelChip x={772} y={824} at={CUE.sRebound - 370} text="Rebound" kicker="given back" accent={VOX.teal} size={28} rotate={1.6} />
          </SceneFade>
        </Sequence>

        {/* ---- ANECDOTE (21.7–31s): spring beats brick — the low kick ---- */}
        <Sequence from={650} durationInFrames={282} layout="none">
          <SceneFade out={274}>
            <SerifStatement
              x={540}
              y={540}
              w={860}
              at={CUE.aStatement - 650}
              size={76}
              align="center"
              words={[{ t: 'Beaten' }, { t: 'by' }, { t: 'a' }, { t: 'better' }, { t: 'spring.', hl: true }]}
            />
            <Layer x={372} y={1090} w={168} at={CUE.aProps - 650} enter="slide-l" rotate={-4} depth={0.09} z={2}>
              <Coil />
            </Layer>
            <Layer x={734} y={1070} w={252} at={CUE.aProps - 650} enter="slide-r" rotate={3} depth={0.06} z={2}>
              <Brick />
            </Layer>
            <LabelChip x={372} y={1268} at={CUE.aChips - 650} text="70 kg" kicker="all spring" accent={VOX.teal} size={28} rotate={-1.5} />
            <LabelChip x={742} y={1236} at={CUE.aChips - 650} text="Twice his size" kicker="all brick" accent={VOX.red} size={28} rotate={2} />
            <SketchArrow
              id="kick"
              d="M 396 1082 Q 560 936 706 1050"
              vb={{ w: W, h: H }}
              at={CUE.aArc - 650}
              dur={20}
              color={VOX.ink}
              width={7}
              dashed
              head
              z={3}
            />
            <RubberStamp text="Sat down" x={604} y={1360} at={CUE.aStamp - 650} size={58} rotate={-9} z={5} />
          </SceneFade>
        </Sequence>

        {/* ---- CLOSE / LOOP (30–38s): back to the frame-0 composition ---- */}
        <Sequence from={910} layout="none">
          <Layer x={398} y={1120} w={380} at={CUE.lHero - 910} enter="fade" rotate={-3} depth={0.06} z={2}>
            <Brick />
          </Layer>
          <Layer x={706} y={1090} w={300} at={CUE.lHero - 910} enter="fade" rotate={3} depth={0.1} z={2}>
            <Coil />
          </Layer>
          <Sequence from={CUE.lTitle - 910} layout="none">
            <SerifStatement x={540} y={470} w={780} at={0} size={92} align="center" words={TITLE_WORDS} />
          </Sequence>
          <LabelChip
            x={540}
            y={1520}
            at={CUE.lChip - 910}
            text="Build living springs."
            kicker="Iron Thread"
            accent={VOX.yellow}
            kickerColor={VOX.inkSoft}
            size={33}
            rotate={-1.2}
          />
        </Sequence>
      </CollageBoard>
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox2SpringsNotBricks;
