import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { evolvePath } from '@remotion/paths';
import {
  ArchivalPhoto,
  CollageBoard,
  EASE_OUT,
  Grain,
  LabelChip,
  Layer,
  PaperBG,
  RubberStamp,
  SerifStatement,
  SketchArrow,
  VOX,
} from '../../lib/collage';
import { Captions } from '../../lib/shorts';
import { FONT_BODY } from '../../fonts';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION — "Heavier, Not Harder" (Zhan Zhuang – Internal Power, Ch 36).
// Narrated in Aaron's own voice clone. The chapter's ladder drill, drawn as a gold
// line lighting each link of the book's own strike figure while two meters show the
// gap: YOUR EFFORT stays put, WHAT THEY FEEL climbs. Plan: vox-shorts/vox-3-zhan-zhuang.
// =============================================================================
export const compositionConfig = {
  id: 'Vox3HeavierNotHarder',
  durationInSeconds: 35.6,
  fps: 30,
  width: 1080,
  height: 1920,
};

const W = 1080;
const H = 1920;
const asset = (f: string) => staticFile(`projects/vox-3-zhan-zhuang/layers/${f}`);
const sfx = (id: string) => staticFile(`library/sfx/clips/${id}.mp3`);
const f = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// The book cover's gold, as a small palette for this short.
const GOLD = { light: '#f3cf7a', mid: '#dfae4c', deep: '#a8741f', ink: '#7a5412' } as const;

// =============================================================================
// CUES — GLOBAL frames from REAL word times (beats.json / vo.gen.ts). Keep every cue here.
// =============================================================================
const T = {
  heavierHook: f(0.38), //  "heavier?" — a first glint of the chain
  resetA: f(4.6), //         full chain fades so the ladder can rebuild it
  resetB: f(5.07),
  ladder: f(5.14), //        "Tap"
  rung: [f(6.18), f(7.7), f(9.8), f(11.09), f(12.27), f(13.48), f(15.12)], // hand … legs
  ground: f(15.84), //       "ground"
  toYou: f(17.06), //        "To you"
  holder: f(20.1), //        "But to the person holding the pad"
  heavier: f(22.3), //       "heavier"
  handAtAll: f(24.62), //    "hand at all"
  legs: f(26.26), //         "The legs do not punch"
  arms: f(28.04), //         "The arms do not punch alone"
  person: f(30.55), //       "The person punches"
  punches: f(30.9),
  loopHeavier: f(32.44), //  "Heavier."
  loopNot: f(33.56), //      "Not harder."
} as const;

// Camera — push on the hook, frame the figure + meters for the ladder (higher, so his
// feet stay clear of the caption band), widen for the print, push for the payoff, and
// land on the frame-0 framing for a seamless loop.
const CAM = [
  { f: 0, x: 540, y: 960, z: 1.0 },
  { f: 140, x: 540, y: 955, z: 1.03 },
  { f: 178, x: 530, y: 980, z: 1.07 },
  { f: 480, x: 530, y: 980, z: 1.07 },
  { f: 520, x: 540, y: 950, z: 1.0 },
  { f: 780, x: 540, y: 950, z: 1.0 },
  { f: 815, x: 520, y: 980, z: 1.07 },
  { f: 955, x: 520, y: 980, z: 1.07 },
  { f: 1000, x: 540, y: 960, z: 1.0 },
  { f: 1067, x: 540, y: 960, z: 1.0 },
];

// =============================================================================
// THE FIGURE — book photo cutout (672×1041 source px) + the gold chain overlay.
// Chain coordinates are in SOURCE pixels, so re-cutting the photo never moves them.
// =============================================================================
const FIG = { cx: 380, cy: 860, w: 500 } as const; // on the board
const SRC = { w: 672, h: 1041 } as const;

type Group = 'hand' | 'arm' | 'upper' | 'legs';
type Seg = { d: string; rung: number; group: Group; node?: [number, number] };

const SEGS: Seg[] = [
  { d: 'M 664 256 L 604 282', rung: 0, group: 'hand' },
  { d: 'M 604 282 Q 540 316 455 368', rung: 1, group: 'arm' },
  { d: 'M 455 368 Q 432 312 388 256', rung: 2, group: 'arm', node: [455, 368] },
  { d: 'M 388 256 Q 360 268 336 300', rung: 3, group: 'upper', node: [388, 256] },
  { d: 'M 336 300 Q 314 410 312 520', rung: 4, group: 'upper' },
  { d: 'M 312 520 Q 318 562 340 585', rung: 5, group: 'upper', node: [340, 585] },
  { d: 'M 340 585 Q 368 604 400 625 L 530 695 L 494 950 L 598 998', rung: 6, group: 'legs', node: [530, 695] },
  { d: 'M 340 585 L 266 650 L 176 800 L 60 972 L 150 1022', rung: 6, group: 'legs', node: [176, 800] },
];
const GROUND = 'M 0 1024 L 650 1024';

// 0..1 bump that rises fast and settles, for payoff pulses.
const bump = (frame: number, at: number) => interpolate(frame, [at, at + 5, at + 26], [0, 1, 0], clamp);

const GoldChain: React.FC = () => {
  const frame = useCurrentFrame();
  const alpha = frame < T.resetA ? 1 : frame < T.resetB ? interpolate(frame, [T.resetA, T.resetB], [1, 0]) : 1;
  const progress = (rung: number) =>
    frame < T.resetB ? 1 : interpolate(frame, [T.rung[rung], T.rung[rung] + 10], [0, 1], { easing: EASE_OUT, ...clamp });
  const all = bump(frame, T.person) + 0.5 * bump(frame, T.heavierHook);
  const pulse: Record<Group, number> = {
    hand: all + bump(frame, T.arms),
    arm: all + bump(frame, T.arms),
    upper: all,
    legs: all + bump(frame, T.legs),
  };
  const groundP = frame < T.resetB ? 1 : interpolate(frame, [T.ground, T.ground + 14], [0, 1], clamp);
  const fistP = progress(0);

  const stroke = (d: string, p: number, g: number, key: string) => {
    if (p <= 0.001) return null;
    const ev = evolvePath(p, d);
    return (
      <g key={key}>
        <path d={d} fill="none" stroke={GOLD.mid} strokeWidth={20 + 14 * g} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.45 + 0.35 * g} filter="url(#chainGlow)" />
        <path d={d} fill="none" stroke={GOLD.light} strokeWidth={7 + 3 * g} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${SRC.w} ${SRC.h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', opacity: alpha }}>
      <defs>
        <filter id="chainGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* the fist: a ring that opens around the first point of contact */}
      {fistP > 0.001 ? (
        <circle cx={642} cy={258} r={36 * fistP + 6 * pulse.hand} fill="none" stroke={GOLD.light} strokeWidth={6} opacity={0.9} />
      ) : null}
      {SEGS.map((s, i) => stroke(s.d, progress(s.rung), pulse[s.group], `s${i}`))}
      {stroke(GROUND, groundP, pulse.legs, 'ground')}
      {SEGS.filter((s) => s.node).map((s, i) => {
        const p = progress(s.rung);
        if (p <= 0.001) return null;
        const [x, y] = s.node as [number, number];
        return <circle key={`n${i}`} cx={x} cy={y} r={(9 + 5 * pulse[s.group]) * Math.min(1, p * 1.4)} fill={GOLD.light} stroke={GOLD.deep} strokeWidth={2} />;
      })}
    </svg>
  );
};

const Figure: React.FC = () => {
  const frame = useCurrentFrame();
  const halo = bump(frame, T.person);
  return (
    <Layer x={FIG.cx} y={FIG.cy} w={FIG.w} at={0} enter="none" depth={0.05} drift={0.5} z={2}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: '-8% -12%',
            background: `radial-gradient(ellipse at 55% 45%, rgba(243,207,122,${0.55 * halo}) 0%, rgba(243,207,122,0) 62%)`,
          }}
        />
        <Img
          src={asset('puncher.png')}
          style={{
            width: '100%',
            display: 'block',
            filter: `drop-shadow(5px 0 0 ${VOX.cream}) drop-shadow(-5px 0 0 ${VOX.cream}) drop-shadow(0 5px 0 ${VOX.cream}) drop-shadow(0 -5px 0 ${VOX.cream}) drop-shadow(0 16px 22px rgba(40,28,12,0.28))`,
          }}
        />
        <GoldChain />
      </div>
    </Layer>
  );
};

// =============================================================================
// METERS — same 7-slot scale either side of him. The right one is the pad.
// =============================================================================
const SLOTS = 7;
const Meter: React.FC<{ id: string; label: string; level: number; pad?: boolean }> = ({ id, label, level, pad = false }) => {
  const w = pad ? 112 : 90;
  const h = 440;
  const inset = pad ? 16 : 12;
  const ih = h - inset * 2;
  const fill = (ih * Math.max(0, Math.min(SLOTS, level))) / SLOTS;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 22, letterSpacing: 2.6, textTransform: 'uppercase', color: VOX.ink, marginBottom: 12, whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 12px 16px rgba(40,28,12,0.28))' }}>
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={GOLD.deep} />
            <stop offset="1" stopColor={GOLD.light} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={w} height={h} rx={pad ? 26 : 14} fill={pad ? '#2a231a' : VOX.cream} stroke={VOX.ink} strokeWidth={3} />
        {pad ? <rect x={7} y={7} width={w - 14} height={h - 14} rx={20} fill="none" stroke="#e9dcc0" strokeWidth={2} strokeDasharray="7 7" opacity={0.5} /> : null}
        <rect x={inset} y={inset} width={w - inset * 2} height={ih} rx={8} fill={pad ? '#15110c' : '#e6dbc3'} />
        <rect x={inset} y={inset + ih - fill} width={w - inset * 2} height={fill} rx={8} fill={`url(#${id})`} />
        {Array.from({ length: SLOTS - 1 }, (_, i) => {
          const y = inset + ih - (ih * (i + 1)) / SLOTS;
          return <line key={i} x1={inset + 4} x2={w - inset - 4} y1={y} y2={y} stroke={pad ? '#e9dcc0' : VOX.ink} strokeWidth={1.5} opacity={0.35} />;
        })}
      </svg>
    </div>
  );
};

const METER_Y = 745;
const EFFORT_X = 162;
const PAD_X = 674; // pad's face sits on the knuckles, so each knock visibly lands

const Meters: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame() + from; // global frame
  const g = (x: number) => x - from;
  const padLevel = T.rung.reduce((acc, r) => acc + interpolate(frame, [r, r + 8], [0, 1], { easing: EASE_OUT, ...clamp }), 0);
  const effortLevel = interpolate(frame, [T.rung[0], T.rung[0] + 8], [0, 1], { easing: EASE_OUT, ...clamp });
  // every knock shakes the pad, harder rung by rung; "heavier" shakes it hardest
  const knocks = [...T.rung.map((r, i) => ({ at: r, amp: 3 + i * 2.2 })), { at: T.heavier, amp: 22 }, { at: T.handAtAll, amp: 12 }];
  const shake = knocks.reduce((acc, k) => {
    const dt = frame - k.at;
    if (dt < 0 || dt > 14) return acc;
    return acc + Math.sin(dt * 2.3) * k.amp * interpolate(dt, [0, 2, 14], [0.4, 1, 0], clamp);
  }, 0);
  const burst = interpolate(frame, [T.heavier, T.heavier + 22], [0, 1], clamp);
  return (
    <>
      <Layer x={EFFORT_X} y={METER_Y} w={260} at={g(T.ladder)} dur={16} enter="slide-l" depth={0.04} drift={0.4} z={3}>
        <Meter id="effortFill" label="Your effort" level={effortLevel} />
      </Layer>
      <Layer x={PAD_X} y={METER_Y} w={260} at={g(T.ladder)} dur={16} enter="slide-r" depth={0.04} drift={0.4} z={3}>
        <div style={{ transform: `translateX(${shake}px)`, position: 'relative' }}>
          <Meter id="feelFill" label="What they feel" level={padLevel} pad />
          {burst > 0 && burst < 1 ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 58,
                width: 320 * burst,
                height: 320 * burst,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `${8 * (1 - burst) + 2}px solid ${GOLD.light}`,
                opacity: 1 - burst,
              }}
            />
          ) : null}
        </div>
      </Layer>
    </>
  );
};

// Hand-drawn ring (4 cubics + an overshoot tail) — board coordinates.
const ringPath = (cx: number, cy: number, rx: number, ry: number) => {
  const k = 0.5523;
  return [
    `M ${cx} ${cy - ry}`,
    `C ${cx + k * rx} ${cy - ry} ${cx + rx} ${cy - k * ry} ${cx + rx} ${cy}`,
    `C ${cx + rx} ${cy + k * ry} ${cx + k * rx} ${cy + ry} ${cx} ${cy + ry}`,
    `C ${cx - k * rx} ${cy + ry} ${cx - rx} ${cy + k * ry} ${cx - rx} ${cy}`,
    `C ${cx - rx} ${cy - k * ry} ${cx - k * rx} ${cy - ry} ${cx + 14} ${cy - ry - 8}`,
  ].join(' ');
};

const SceneFade: React.FC<{ out: number; dur?: number; children: React.ReactNode }> = ({ out, dur = 14, children }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [out - dur, out], [1, 0], clamp);
  return <div style={{ opacity: op }}>{children}</div>;
};

// Title + credit — identical in the hook (frame 0) and the loop (last frame).
const TITLE_1 = [{ t: 'Heavier,', hl: true }];
const TITLE_2 = [{ t: 'not' }, { t: 'harder.' }];
const Credit: React.FC<{ at: number }> = ({ at }) => (
  <LabelChip x={540} y={185} at={at} text="Zhan Zhuang – Internal Power" kicker="Aaron Ellis · Chapter 36" accent={GOLD.mid} kickerColor={GOLD.ink} size={26} rotate={-1} center />
);
const Cover: React.FC<{ at: number; enter: 'none' | 'place' }> = ({ at, enter }) => (
  <ArchivalPhoto src={asset('cover.jpg')} x={800} y={740} w={210} at={at} enter={enter} rotate={3} depth={0.07} treatment="none" z={2} />
);

// SFX — library clips on real cue frames; the rung knocks get heavier with the pad. Measured
// (peak, 350ms windows): rung-7 "legs own the ground" is the deliberate climax and the loudest
// instant, ~0.6 dB over the narration's own max peak (was +3 dB before rescaling); every other
// cue sits at or under the voice. An AUDITION — pull rung 7 down if it reads too hot by ear.
const SFX: { at: number; id: string; v: number }[] = [
  { at: T.ladder, id: 'whoosh-soft', v: 0.3 },
  { at: T.rung[0], id: 'knock-solid', v: 0.26 },
  { at: T.rung[1], id: 'knock-solid', v: 0.3 },
  { at: T.rung[2], id: 'knock-solid', v: 0.34 },
  { at: T.rung[3], id: 'impact-soft', v: 0.32 },
  { at: T.rung[4], id: 'impact-soft', v: 0.36 },
  { at: T.rung[5], id: 'impact-soft', v: 0.4 },
  { at: T.rung[6], id: 'impact-soft', v: 0.44 },
  { at: T.rung[6], id: 'impact-deep-soft', v: 0.22 },
  { at: T.holder + 2, id: 'page-flip', v: 0.38 },
  { at: T.heavier + 3, id: 'stamp-hit', v: 0.44 },
  { at: T.punches, id: 'impact-deep-soft', v: 0.44 },
  { at: T.punches, id: 'warm-shimmer', v: 0.26 },
  { at: T.loopHeavier, id: 'whoosh-soft', v: 0.26 },
];

// Captions: identical to the VO except the very first word shows 3 frames late, so frame 0
// (the thumbnail, and the loop's landing frame) carries no caption. Audio is untouched.
const CAPTION_VO = VO.map((line, i) =>
  i === 0
    ? { ...line, start: 0.1, words: line.words?.map((w, j) => (j === 0 ? { ...w, start: 0.1 } : w)) }
    : line,
);

const Vox3HeavierNotHarder: React.FC = () => {
  const TWIST = 500;
  const PAYOFF = 905;
  const LOOP = T.loopHeavier;
  return (
    <AbsoluteFill style={{ backgroundColor: VOX.paper }}>
      <CollageBoard cam={CAM}>
        <PaperBG src={asset('paper.jpg')} w={W} h={H} />

        {/* ---- the figure + gold chain: one long sequence, so its frames are GLOBAL ---- */}
        <Sequence from={0} layout="none">
          <Figure />
        </Sequence>

        {/* ---- HOOK (0–5.1s): frame 0 is the thumbnail — credit, title, lit figure, cover ---- */}
        <Sequence from={0} durationInFrames={168} layout="none">
          <SceneFade out={156} dur={14}>
            <Credit at={-12} />
            <SerifStatement x={540} y={295} w={900} at={-40} size={88} hlColor={GOLD.light} words={TITLE_1} />
            <SerifStatement x={540} y={395} w={900} at={-40} size={88} words={TITLE_2} />
            <Cover at={0} enter="none" />
          </SceneFade>
        </Sequence>

        {/* ---- METERS (ladder → payoff), out as the loop begins ---- */}
        <Sequence from={150} durationInFrames={840} layout="none">
          <SceneFade out={840} dur={16}>
            <Meters from={150} />
          </SceneFade>
        </Sequence>

        {/* ---- TWIST (17–25.5s): effort ring, the holder, HEAVIER ---- */}
        <Sequence from={TWIST} durationInFrames={280} layout="none">
          <SceneFade out={280} dur={16}>
            <SketchArrow id="effortRing" d={ringPath(EFFORT_X, METER_Y - 5, 88, 288)} vb={{ w: W, h: H }} at={T.toYou - TWIST} dur={26} color={GOLD.mid} width={7} head={false} z={4} />
            <ArchivalPhoto
              src={asset('partner-start.jpg')}
              x={610}
              y={310}
              w={400}
              at={T.holder - TWIST}
              enter="place"
              rotate={-2.5}
              depth={0.06}
              treatment="none"
              caption="From the book · Chapter 17, Put Hands On It"
              z={3}
            />
            {/* stamped down the pad itself, clear of his arm */}
            <RubberStamp text="Heavier" x={PAD_X} y={METER_Y + 22} at={T.heavier - TWIST} size={46} rotate={-84} z={6} />
          </SceneFade>
        </Sequence>

        {/* ---- PAYOFF (26–32s): the person punches ---- */}
        <Sequence from={PAYOFF} durationInFrames={70} layout="none">
          <SceneFade out={68} dur={14}>
            <SerifStatement
              x={540}
              y={300}
              w={940}
              at={T.person - PAYOFF - 2}
              size={84}
              hlColor={GOLD.light}
              words={[{ t: 'The' }, { t: 'person', hl: true }, { t: 'punches.' }]}
            />
          </SceneFade>
        </Sequence>

        {/* ---- LOOP (32.4–35.6s): back to the frame-0 composition ---- */}
        <Sequence from={LOOP} layout="none">
          <Credit at={10} />
          <SerifStatement x={540} y={295} w={900} at={0} size={88} hlColor={GOLD.light} words={TITLE_1} />
          <SerifStatement x={540} y={395} w={900} at={T.loopNot - LOOP} size={88} words={TITLE_2} />
          <Cover at={4} enter="place" />
        </Sequence>
      </CollageBoard>

      <Grain opacity={0.05} />
      <Captions lines={CAPTION_VO} y={1320} size={50} maxWords={4} plate accent={GOLD.light} />

      <Audio src={staticFile('projects/vox-3-zhan-zhuang/narration.mp3')} />
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at} layout="none">
          <Audio src={sfx(s.id)} volume={s.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export default Vox3HeavierNotHarder;
