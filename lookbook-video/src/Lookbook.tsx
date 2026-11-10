import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  BEATS,
  BEAT_LEN,
  CONTACT_BEAT,
  DIMS,
  FINALE_BEAT,
  FIRST_LOOK,
  FPS,
  INK,
  INTRO_BEATS,
  LOOKS,
  LOOK_BEATS,
  MID,
} from "./data";

// Fonts ship with the project (public/fonts) so rendering needs no network.
const WIDE = "Michroma";
const SCRIPT = "Pinyon Script";
const SANS = "Inter";
const ARABIC = "Aref Ruqaa";
loadFont({ family: WIDE, url: staticFile("fonts/Michroma.woff2") });
loadFont({ family: SCRIPT, url: staticFile("fonts/PinyonScript.woff2") });
loadFont({ family: SANS, url: staticFile("fonts/Inter-400.woff2"), weight: "400" });
loadFont({ family: SANS, url: staticFile("fonts/Inter-600.woff2"), weight: "600" });
loadFont({ family: ARABIC, url: staticFile("fonts/ArefRuqaa-arabic.woff2") });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

// Where we are in the music: the last beat passed, and how long ago it was.
const beatAt = (t: number) => {
  let i = -1;
  while (i + 1 < BEATS.length && BEATS[i + 1] <= t) i++;
  const since = i < 0 ? 99 : t - BEATS[i];
  return { i, since, pulse: Math.exp(-since * 7) };
};
const beatTime = (i: number) => BEATS[Math.min(i, BEATS.length - 1)];

// 0 → 1 over `dur` seconds starting at `start` (seconds), eased.
const ramp = (t: number, start: number, dur: number, ease = outExpo) =>
  interpolate(t, [start, start + dur], [0, 1], { ...clamp, easing: ease });

const Background: React.FC<{ pulse: number }> = ({ pulse }) => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg,#e9f0f8 0%,#f3f7fc 55%,#ffffff 100%)",
    }}
  >
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 18% at 50% 88%, rgba(28,58,158,${0.07 + 0.05 * pulse}), transparent 70%)`,
      }}
    />
  </AbsoluteFill>
);

// Eight small bars that fill one per beat: the bar count of the current scene.
const BeatBars: React.FC<{ beat: number; pulse: number }> = ({ beat, pulse }) => (
  <div style={{ position: "absolute", left: 80, bottom: 110, display: "flex", gap: 14 }}>
    {Array.from({ length: 8 }, (_, k) => {
      const on = k <= beat;
      const now = k === beat;
      return (
        <div
          key={k}
          style={{
            width: 64,
            height: 6,
            background: on ? INK : "rgba(28,58,158,.18)",
            transform: `scaleY(${now ? 1 + 1.6 * pulse : 1})`,
          }}
        />
      );
    })}
  </div>
);

const Flash: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const o = interpolate(t, [at, at + 0.22], [0.75, 0], clamp);
  return <AbsoluteFill style={{ background: "#fff", opacity: t >= at ? o : 0 }} />;
};

// ── Intro: season, "designed by" and the name, each on a beat ──────────────
const Intro: React.FC<{ t: number; beat: number; pulse: number }> = ({ t, beat, pulse }) => {
  const b = (n: number) => beatTime(n);
  const season = "SPRING SUMMER 2027";
  const out = 1 - ramp(t, b(14) + BEAT_LEN, BEAT_LEN * 1.6, Easing.in(Easing.cubic));
  const reveal = ramp(t, b(6), BEAT_LEN * 2.2, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill style={{ opacity: out, transform: `translateY(${(1 - out) * -60}px)` }}>
      {/* LOOK / BOOK, outlined, breathing on every beat */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 400,
          textAlign: "center",
          fontFamily: WIDE,
          fontSize: 230,
          lineHeight: 1,
          letterSpacing: "0.04em",
          color: "rgba(255,255,255,.4)",
          WebkitTextStroke: `2.5px rgba(28,58,158,${0.28 * ramp(t, b(2), 0.6)})`,
          transform: `scale(${1 + 0.025 * pulse * (beat >= 2 ? 1 : 0)})`,
        }}
      >
        LOOK
        <br />
        BOOK
      </div>
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 80,
          right: 80,
          textAlign: "center",
          fontFamily: WIDE,
          fontSize: 44,
          letterSpacing: "0.12em",
          whiteSpace: "nowrap",
          color: INK,
        }}
      >
        {season.split("").map((c, k) => {
          const p = ramp(t, b(0) + k * 0.045, 0.5);
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                opacity: p,
                transform: `translateY(${(1 - p) * 40}px)`,
                filter: `blur(${(1 - p) * 8}px)`,
              }}
            >
              {c === " " ? " " : c}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1000,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: WIDE,
          fontSize: 44,
          letterSpacing: "0.24em",
          color: INK,
          opacity: ramp(t, b(4), 0.5),
          transform: `translateY(${(1 - ramp(t, b(4), 0.5)) * 30}px)`,
        }}
      >
        DESIGNED BY
      </div>
      <div
        style={{
          position: "absolute",
          top: 1070,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SCRIPT,
          fontSize: 200,
          lineHeight: 0.98,
          color: INK,
          clipPath: `inset(-20% ${(1 - reveal) * 100}% -20% 0)`,
        }}
      >
        Lakehal
        <br />
        Djilali
      </div>
      <div
        style={{
          position: "absolute",
          top: 1520,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: ARABIC,
          fontSize: 96,
          color: INK,
          direction: "rtl",
          opacity: ramp(t, b(10), 0.6),
          transform: `scale(${0.92 + 0.08 * ramp(t, b(10), 0.6)})`,
        }}
      >
        لكحل جيلالي
      </div>
      <BeatBars beat={beat % 8} pulse={pulse} />
    </AbsoluteFill>
  );
};

// ── One look: two bars, entering on the bar's first beat ───────────────────
const Look: React.FC<{ k: number; t: number; beat: number; pulse: number }> = ({ k, t, beat, pulse }) => {
  const start = beatTime(INTRO_BEATS + k * LOOK_BEATS);
  const lt = t - start;
  const look = LOOKS[k];
  const [w, h] = DIMS[k];
  const H = 1420;
  const W = (H * w) / h;
  const dir = k % 2 ? -1 : 1;

  const enter = spring({ frame: lt * FPS, fps: FPS, config: { damping: 18, stiffness: 120, mass: 0.9 } });
  const exit = ramp(lt, BEAT_LEN * 7.4, BEAT_LEN * 0.6, Easing.in(Easing.cubic));
  const bump = 1 + 0.018 * pulse;
  const x = 560 - W / 2 + (1 - enter) * 140 * dir - exit * 220 * dir;
  const word = look.word.toUpperCase();
  const wordSize = Math.min(230, 1640 / (word.length * 1.18));

  const pieceIdx = beat >= 5 ? 1 : 0;
  const pieceIn = ramp(lt, BEAT_LEN * (pieceIdx ? 5 : 2), 0.45);
  const ring = (at: number) => {
    const p = interpolate(lt, [BEAT_LEN * at, BEAT_LEN * at + 1.1], [0, 1], clamp);
    return { opacity: lt >= BEAT_LEN * at ? (1 - p) * 0.8 : 0, scale: 0.3 + p * 1.3 };
  };

  return (
    <AbsoluteFill>
      {/* the look's word, vertical along the left edge, letter by letter */}
      <div
        style={{
          position: "absolute",
          left: 80 + wordSize * 0.62,
          top: 160,
          transformOrigin: "0 0",
          transform: "rotate(90deg)",
          whiteSpace: "nowrap",
          fontFamily: WIDE,
          fontSize: wordSize,
          lineHeight: 1,
          letterSpacing: "0.04em",
          color: "rgba(255,255,255,.45)",
          WebkitTextStroke: "2.5px rgba(28,58,158,.32)",
          opacity: 1 - exit,
        }}
      >
        {word.split("").map((c, i) => {
          const p = ramp(lt, 0.05 + i * 0.05, 0.6);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: p,
                transform: `translateY(${(1 - p) * 50}px)`,
                filter: `blur(${(1 - p) * 12}px)`,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>

      {/* light rings from the feet on beats 1 and 5 */}
      {[0, 4].map((at) => {
        const r = ring(at);
        return (
          <div
            key={at}
            style={{
              position: "absolute",
              left: 560 - 260,
              top: 1690 - 40,
              width: 520,
              height: 80,
              borderRadius: "50%",
              border: `2px solid ${INK}`,
              opacity: r.opacity,
              transform: `scale(${r.scale})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 560 - W * 0.42,
          top: 1680,
          width: W * 0.84,
          height: 44,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(40,55,90,.28), transparent)",
          opacity: enter * (1 - exit),
        }}
      />

      {/* the look itself */}
      <Img
        src={staticFile(`looks/${k + 1}.webp`)}
        style={{
          position: "absolute",
          left: x,
          top: 1700 - H,
          width: W,
          height: H,
          transformOrigin: "50% 100%",
          transform: `scale(${(1.14 - 0.14 * enter) * bump})`,
          filter: `blur(${Math.max(0, (1 - enter) * 16 + exit * 14)}px)`,
          opacity: Math.min(1, enter * 1.4) * (1 - exit),
        }}
      />

      {/* white veil so the text below stays legible over the legs */}
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, transparent 82%, rgba(255,255,255,.8) 93%)" }}
      />

      {/* LOOK 15 … with the number rolling in */}
      <div
        style={{
          position: "absolute",
          top: 110,
          right: 80,
          textAlign: "right",
          fontFamily: WIDE,
          color: INK,
          opacity: 1 - exit,
        }}
      >
        <div style={{ fontSize: 44, letterSpacing: "0.24em" }}>LOOK</div>
        <div style={{ height: 130, overflow: "hidden" }}>
          <div
            style={{
              fontSize: 120,
              lineHeight: "130px",
              letterSpacing: "0.04em",
              transform: `translateY(${(1 - ramp(lt, 0, 0.55)) * 130}px)`,
            }}
          >
            {FIRST_LOOK + k}
          </div>
        </div>
      </div>

      {/* the piece names, one at a time */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 150,
          fontFamily: WIDE,
          fontSize: 44,
          lineHeight: 1.3,
          letterSpacing: "0.1em",
          color: INK,
          opacity: beat >= 2 ? pieceIn * (1 - exit) : 0,
          transform: `translateY(${(1 - pieceIn) * 30}px)`,
        }}
      >
        {look.pieces[pieceIdx].toUpperCase()}
      </div>

      <BeatBars beat={beat} pulse={pulse} />
      <Flash t={lt} at={0} />
    </AbsoluteFill>
  );
};

// ── Finale: the eight looks line up one per beat, then the contact card ────
const Finale: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const b0 = beatTime(FINALE_BEAT);
  const lt = t - b0;
  const toCard = ramp(t, beatTime(CONTACT_BEAT), BEAT_LEN * 2, Easing.inOut(Easing.cubic));
  const order = [3, 5, 1, 7, 0, 6, 2, 4]; // stagger so neighbours differ in colour
  const H = 820;
  // the card starts a beat after the line-up begins to move away, so they never overlap
  const card = (n: number) => ramp(t, beatTime(CONTACT_BEAT + 2 + n), 0.6);

  return (
    <AbsoluteFill>
      {/* line-up */}
      <AbsoluteFill
        style={{
          opacity: 1 - toCard * 0.9,
          transform: `translateY(${-toCard * 520}px) scale(${1 - toCard * 0.35})`,
          transformOrigin: "50% 0%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 230,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: WIDE,
            fontSize: 52,
            letterSpacing: "0.14em",
            color: INK,
            opacity: ramp(lt, 0, 0.5),
          }}
        >
          EIGHT LOOKS
        </div>
        {order.map((k, slot) => {
          const [w, h] = DIMS[k];
          const W = (H * w) / h;
          const cx = 120 + slot * 120;
          const p = spring({
            frame: (t - beatTime(FINALE_BEAT + slot)) * FPS,
            fps: FPS,
            config: { damping: 16, stiffness: 140 },
          });
          return (
            <Img
              key={k}
              src={staticFile(`looks/${k + 1}.webp`)}
              style={{
                position: "absolute",
                left: cx - W / 2,
                top: 1300 - H + (slot % 2 ? 40 : 0),
                width: W,
                height: H,
                zIndex: slot % 2 ? 1 : 2,
                opacity: p,
                transform: `translateY(${(1 - p) * 80}px)`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* contact card */}
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 80,
          right: 80,
          textAlign: "center",
          color: INK,
        }}
      >
        <div
          style={{
            fontFamily: WIDE,
            fontSize: 44,
            letterSpacing: "0.24em",
            opacity: card(0),
            transform: `translateY(${(1 - card(0)) * 30}px)`,
          }}
        >
          WORK WITH ME
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: SCRIPT,
            fontSize: 170,
            lineHeight: 1.05,
            clipPath: `inset(-20% ${(1 - ramp(t, beatTime(CONTACT_BEAT + 3), BEAT_LEN * 2)) * 100}% -20% 0)`,
          }}
        >
          Lakehal Djilali
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: ARABIC,
            fontSize: 84,
            direction: "rtl",
            opacity: card(3),
          }}
        >
          لكحل جيلالي
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: WIDE,
            fontSize: 44,
            lineHeight: 1.5,
            letterSpacing: "0.12em",
            opacity: card(4),
            transform: `translateY(${(1 - card(4)) * 30}px)`,
          }}
        >
          APPS · WEBSITES · ADS
        </div>
        <div
          style={{
            margin: "70px auto 0",
            width: 920,
            padding: "40px 0 46px",
            background: INK,
            color: "#fff",
            opacity: card(5),
            transform: `translateY(${(1 - card(5)) * 50}px) scale(${1 + 0.02 * pulse * card(5)})`,
          }}
        >
          <div style={{ fontFamily: WIDE, fontSize: 40, letterSpacing: "0.24em" }}>WHATSAPP</div>
          <div
            style={{
              marginTop: 18,
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 80,
              letterSpacing: "0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +33 7 55 24 47 52
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: SANS,
            fontSize: 44,
            color: MID,
            opacity: card(6),
          }}
        >
          Software developer, app maker &amp; designer
        </div>
      </div>
      <Flash t={t} at={beatTime(FINALE_BEAT)} />
    </AbsoluteFill>
  );
};

export const Lookbook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { i, pulse } = beatAt(t);

  let scene: React.ReactNode;
  if (i < INTRO_BEATS) {
    scene = <Intro t={t} beat={Math.max(0, i)} pulse={i < 0 ? 0 : pulse} />;
  } else if (i < FINALE_BEAT) {
    const k = Math.floor((i - INTRO_BEATS) / LOOK_BEATS);
    scene = <Look k={k} t={t} beat={(i - INTRO_BEATS) % LOOK_BEATS} pulse={pulse} />;
  } else {
    scene = <Finale t={t} pulse={pulse} />;
  }

  const fadeOut = interpolate(t, [47.9, 48.8], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      <Audio src={staticFile("music.mp3")} />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <Background pulse={pulse} />
        {scene}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
