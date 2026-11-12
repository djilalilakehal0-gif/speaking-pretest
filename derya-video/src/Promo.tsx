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
  DIVE_BEAT,
  END_BEAT,
  FPS,
  GOLD,
  GREEN_800,
  INK,
  LAST_BEAT,
  MINT,
  PHOTOS,
  PHOTOS_BEAT,
  PHOTO_BEATS,
  STORE_BEATS,
} from "./data";

// Fonts ship with the project (public/fonts) so rendering needs no network.
const SANS = "Inter Tight";
const ANTON = "Anton";
const BRUSH = "Caveat Brush";
loadFont({ family: SANS, url: staticFile("fonts/InterTight.woff2"), weight: "100 900" });
loadFont({ family: ANTON, url: staticFile("fonts/Anton.woff2") });
loadFont({ family: BRUSH, url: staticFile("fonts/CaveatBrush.woff2") });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

const beatAt = (t: number) => {
  let i = -1;
  while (i + 1 < BEATS.length && BEATS[i + 1] <= t) i++;
  const since = i < 0 ? 99 : t - BEATS[i];
  // beat numbers count from the end of the storefront opening
  return { i: i - STORE_BEATS, pulse: Math.exp(-since * 7) };
};
const bt = (i: number) => BEATS[Math.max(0, Math.min(i + STORE_BEATS, BEATS.length - 1))];
const ramp = (t: number, start: number, dur: number, ease = outExpo) =>
  interpolate(t, [start, start + dur], [0, 1], { ...clamp, easing: ease });

const STAGE_BG = "linear-gradient(180deg,#0c3523 0%,#14503a 45%,#9fd8bf 100%)";

// ── Giant outlined-gradient wordmark, one line at a time ───────────────────
const WordLine: React.FC<{
  text: string;
  top: number;
  h: number;
  size: number;
  p: number;
  id: string;
}> = ({ text, top, h, size, p, id }) => (
  <div style={{ position: "absolute", left: 0, top, width: 1080, height: h, overflow: "hidden" }}>
    <svg
      viewBox={`0 0 1080 ${h}`}
      width={1080}
      height={h}
      style={{ display: "block", transform: `translateY(${(1 - p) * h}px)` }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset=".5" stopColor="#f1f5f3" stopOpacity=".92" />
          <stop offset="1" stopColor="#d7e6de" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <text
        x="24"
        y={h * 0.86}
        textLength="1032"
        lengthAdjust="spacingAndGlyphs"
        fill={`url(#${id})`}
        style={{ fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -6 }}
      >
        {text}
      </text>
    </svg>
  </div>
);

const Tag: React.FC<{ label: string; x: number; y: number; right?: boolean; p: number; rot: number }> = ({
  label,
  x,
  y,
  right,
  p,
  rot,
}) => (
  <div
    style={{
      position: "absolute",
      top: y,
      ...(right ? { right: x } : { left: x }),
      height: 66,
      padding: "0 30px",
      display: "flex",
      alignItems: "center",
      background: "#fff",
      color: INK,
      fontFamily: SANS,
      fontWeight: 650,
      fontSize: 31,
      letterSpacing: "-0.02em",
      whiteSpace: "nowrap",
      boxShadow: "0 7px 0 rgba(0,0,0,.2), 0 14px 26px rgba(0,0,0,.18)",
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * -50}px) rotate(${(1 - p) * rot}deg) scale(${0.8 + 0.2 * p})`,
    }}
  >
    {label}
  </div>
);

// ── The lanyard badge with the Derya Couture card ──────────────────────────
const S = 1.15; // badge scale
const STRAP_X = 289; // strap centre in badge.webp
const CARD = { x: 172, y: 536, w: 238, h: 392 };
export const BADGE_PIVOT_X = 862;
const BADGE_TOP = 300; // screen y of the badge image's top edge
export const CARD_CENTER = {
  x: BADGE_PIVOT_X + (CARD.x + CARD.w / 2 - STRAP_X) * S,
  y: BADGE_TOP + (CARD.y + CARD.h / 2) * S,
};

const Badge: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  const lt = t - start;
  const drop = spring({ frame: lt * FPS, fps: FPS, config: { damping: 14, stiffness: 90, mass: 1 } });
  const swing = lt < 0 ? 0 : 7 * Math.exp(-lt * 1.1) * Math.sin(lt * 5.2 + 0.4);
  const top = -60;
  return (
    <div
      style={{
        position: "absolute",
        left: BADGE_PIVOT_X - STRAP_X * S,
        top,
        width: 582 * S,
        height: BADGE_TOP - top + 1030 * S,
        transformOrigin: `${STRAP_X * S}px 0px`,
        transform: `translateY(${(1 - drop) * -1500}px) rotate(${swing}deg)`,
        filter: "drop-shadow(0 26px 30px rgba(0,0,0,.28))",
      }}
    >
      {/* strap continues up off the top of the frame */}
      <div
        style={{
          position: "absolute",
          left: (STRAP_X - 41.5) * S,
          top: 0,
          width: 83 * S,
          height: BADGE_TOP - top + 40,
          backgroundImage: `url(${staticFile("strap.webp")})`,
          backgroundSize: `${83 * S}px ${200 * S}px`,
          backgroundRepeat: "repeat-y",
        }}
      />
      <Img
        src={staticFile("badge.webp")}
        style={{ position: "absolute", left: 0, top: BADGE_TOP - top, width: 582 * S, height: 1030 * S }}
      />
      {/* the card */}
      <div
        style={{
          position: "absolute",
          left: CARD.x * S,
          top: BADGE_TOP - top + CARD.y * S,
          width: CARD.w * S,
          height: CARD.h * S,
          padding: "22px 18px 0",
          color: "#141615",
          fontFamily: SANS,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, letterSpacing: ".04em" }}>
          <span>MAISON DE COUTURE</span>
          <span>2021</span>
        </div>
        <div style={{ alignSelf: "stretch", borderTop: "1.5px solid #222", marginTop: 6 }} />
        <Img src={staticFile("logo.webp")} style={{ width: 226, height: 226, marginTop: 22 }} />
        <div style={{ alignSelf: "stretch", marginTop: 22, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, padding: "6px 0 4px", borderBottom: "1.5px dotted #333" }}>
          <span>ATELIER</span>
          <b style={{ fontWeight: 600 }}>LES MUREAUX</b>
        </div>
        <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, padding: "6px 0 4px", borderBottom: "1.5px dotted #333" }}>
          <span>WHATSAPP</span>
          <b style={{ fontWeight: 600 }}>06 44 72 57 58</b>
        </div>
      </div>
    </div>
  );
};

// ── Scene 1: the studio, the name, the man, the card ──────────────────────
const Hero: React.FC<{ t: number; pulse: number; beat: number }> = ({ t, pulse, beat }) => {
  const b = bt;
  const l1 = ramp(t, b(0), 0.9);
  const l2 = ramp(t, b(1), 0.9);
  const me = spring({ frame: (t - b(2)) * FPS, fps: FPS, config: { damping: 20, stiffness: 80 } });
  const script = ramp(t, b(5), BEAT_LEN * 2, Easing.inOut(Easing.cubic));
  const tag = (n: number) =>
    spring({ frame: (t - b(8 + n)) * FPS, fps: FPS, config: { damping: 11, stiffness: 160 } });

  // the dive into the card
  const dive = ramp(t, b(DIVE_BEAT), BEAT_LEN * 2, Easing.in(Easing.cubic));
  const zoom = 1 + dive * 7.5;
  const H = 1190;
  const W = (H * 364) / 1188;
  const meX = 440;

  return (
    <AbsoluteFill style={{ background: STAGE_BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${CARD_CENTER.x}px ${CARD_CENTER.y}px`,
          transform: `scale(${zoom})`,
        }}
      >
        {/* soft floor */}
        <div
          style={{
            position: "absolute",
            left: meX - 260,
            top: 1790,
            width: 520,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(10,40,28,${0.32 + 0.1 * pulse}), transparent)`,
            opacity: me,
          }}
        />
        <WordLine text="DERYA" top={225} h={300} size={300} p={l1} id="g1" />
        <WordLine text="COUTURE" top={485} h={250} size={250} p={l2} id="g2" />
        <Badge t={t} start={b(6)} />
        <Img
          src={staticFile("me.webp")}
          style={{
            position: "absolute",
            left: meX - W / 2,
            top: 1830 - H,
            width: W,
            height: H,
            transformOrigin: "50% 100%",
            transform: `translateY(${(1 - me) * 380}px) scale(${(1.06 - 0.06 * me) * (1 + 0.006 * pulse * (beat >= 4 ? 1 : 0))})`,
            filter: `blur(${(1 - Math.min(1, me * 1.2)) * 14}px) drop-shadow(0 18px 24px rgba(0,0,0,.22))`,
            opacity: Math.min(1, me * 2),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 560,
            top: 1440,
            fontFamily: BRUSH,
            fontSize: 100,
            lineHeight: 1,
            color: "#fff",
            whiteSpace: "nowrap",
            transform: "rotate(-8deg)",
            transformOrigin: "0 50%",
            textShadow: "0 2px 14px rgba(0,0,0,.2)",
            clipPath: `inset(-30% ${(1 - script) * 100}% -30% 0)`,
          }}
        >
          haute couture
        </div>
      </AbsoluteFill>

      {/* UI on top: tags and hint (they don't zoom, they fade) */}
      <AbsoluteFill style={{ opacity: 1 - ramp(t, b(DIVE_BEAT), BEAT_LEN * 0.8) }}>
        <Tag label="nos créations" x={34} y={46} p={tag(0)} rot={-8} />
        <Tag label="sur mesure" x={34} y={46} right p={tag(1)} rot={8} />
        <Tag label="achat & location" x={34} y={136} p={tag(2)} rot={6} />
        <Tag label="prendre rendez-vous" x={34} y={136} right p={tag(3)} rot={-6} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 34,
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: ".18em",
            color: "#fff",
            opacity: 0.85 * ramp(t, b(11), 0.6),
          }}
        >
          DÉCOUVREZ LA COLLECTION
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(t, [b(DIVE_BEAT) + BEAT_LEN * 1.4, b(PHOTOS_BEAT)], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};

// ── Scene 2: the collection, one photo every two beats ─────────────────────
const Ticket: React.FC<{ k: number; lt: number }> = ({ k, lt }) => {
  const p = ramp(lt, 0, 0.45);
  const hole = (pos: React.CSSProperties) => (
    <i
      style={{
        position: "absolute",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: GREEN_800,
        boxShadow: "inset 0 2px 3px rgba(0,0,0,.35)",
        ...pos,
      }}
    />
  );
  const rows = [PHOTOS[k].name.toUpperCase(), "SUR MESURE · ACHAT · LOCATION", `${String(k + 1).padStart(2, "0")} / ${String(PHOTOS.length).padStart(2, "0")}`];
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        top: 70,
        height: 262,
        background: "#fff",
        color: INK,
        borderRadius: 4,
        boxShadow: "0 18px 40px rgba(0,0,0,.28)",
        padding: "30px 52px 0 52px",
        fontFamily: SANS,
      }}
    >
      {hole({ left: 14, top: 14 })}
      {hole({ right: 14, top: 14 })}
      {hole({ left: 14, bottom: 14 })}
      {hole({ right: 14, bottom: 14 })}
      <div style={{ fontFamily: ANTON, fontSize: 72, lineHeight: 1, whiteSpace: "nowrap" }}>NOS CRÉATIONS</div>
      <div style={{ marginTop: 12 }}>
        {rows.map((r, i) => {
          const q = i === 1 ? 1 : p;
          return (
            <div
              key={i}
              style={{
                textAlign: "right",
                fontWeight: 700,
                fontSize: 21,
                letterSpacing: ".02em",
                padding: "6px 0 5px",
                borderBottom: "1.5px dotted #2a2a2a",
                overflow: "hidden",
              }}
            >
              <span style={{ display: "inline-block", opacity: q, transform: `translateY(${(1 - q) * 24}px)` }}>{r}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Collection: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const s0 = bt(PHOTOS_BEAT);
  const k = Math.floor((beatAt(t).i - PHOTOS_BEAT) / PHOTO_BEATS);
  const kk = Math.min(PHOTOS.length - 1, Math.max(0, k));
  const start = bt(PHOTOS_BEAT + kk * PHOTO_BEATS);
  const lt = t - start;
  const enter = ramp(t, s0, 0.9);
  const out = ramp(t, bt(END_BEAT) - BEAT_LEN * 0.6, BEAT_LEN * 0.6, Easing.in(Easing.cubic));
  const FW = 860;
  const FH = 1440;
  const FY = 390;
  return (
    <AbsoluteFill style={{ background: STAGE_BG }}>
      <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 - out * 0.06})` }}>
        <Ticket k={kk} lt={lt} />
        {/* the screen */}
        <div
          style={{
            position: "absolute",
            left: (1080 - FW) / 2,
            top: FY,
            width: FW,
            height: FH,
            background: "#111",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: `0 30px 60px rgba(0,0,0,.35), 0 0 0 10px #fff`,
            transform: `translateY(${(1 - enter) * 120}px) scale(${1 + 0.006 * pulse})`,
            opacity: enter,
          }}
        >
          {PHOTOS.map((ph, i) => {
            if (i !== kk && i !== kk - 1) return null;
            const isNew = i === kk;
            const p = isNew ? (kk === 0 ? 1 : ramp(lt, 0, 0.55)) : 1;
            const own = t - bt(PHOTOS_BEAT + i * PHOTO_BEATS);
            const kb = 1.1 - 0.06 * Math.min(1, own / (BEAT_LEN * 2.4));
            return (
              <Img
                key={ph.file}
                src={staticFile(`photos/${ph.file}.webp`)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 22%",
                  zIndex: isNew ? 2 : 1,
                  transform: `scale(${kb})`,
                  clipPath: isNew ? `inset(${(1 - p) * 100}% 0 0 0)` : undefined,
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              background: "linear-gradient(115deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 38%)",
            }}
          />
          <div style={{ position: "absolute", inset: 0, zIndex: 4, background: "#fff", opacity: kk > 0 ? interpolate(lt, [0, 0.18], [0.35, 0], clamp) : 0 }} />
        </div>
        <div
          style={{
            position: "absolute",
            right: 70,
            top: FY + FH - 150,
            zIndex: 5,
            fontFamily: BRUSH,
            fontSize: 96,
            color: "#fff",
            transform: "rotate(-7deg)",
            textShadow: "0 2px 14px rgba(0,0,0,.35)",
            opacity: enter,
          }}
        >
          derya couture
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(t, [s0, s0 + 0.35], [1, 0], clamp) }} />
    </AbsoluteFill>
  );
};

// ── Scene 3: the end card ──────────────────────────────────────────────────
const EndCard: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const b0 = bt(END_BEAT);
  const c = (n: number) => ramp(t, bt(END_BEAT + n), 0.6);
  const logo = spring({ frame: (t - b0) * FPS, fps: FPS, config: { damping: 13, stiffness: 110 } });
  const H = 650;
  const W = (H * 364) / 1188;
  const me = spring({ frame: (t - bt(END_BEAT + 5)) * FPS, fps: FPS, config: { damping: 20, stiffness: 90 } });
  return (
    <AbsoluteFill style={{ background: STAGE_BG }}>
      <WordLine text="DERYA" top={40} h={300} size={300} p={c(0)} id="e1" />
      <WordLine text="COUTURE" top={300} h={250} size={250} p={c(1)} id="e2" />
      <div
        style={{
          position: "absolute",
          left: 540 - 235,
          top: 590,
          width: 470,
          height: 470,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: `0 30px 60px rgba(0,0,0,.3), 0 0 0 ${10 + 8 * pulse}px rgba(255,255,255,.18)`,
          transform: `scale(${logo})`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Img src={staticFile("logo.webp")} style={{ width: 452, height: 452 }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1095, textAlign: "center", color: "#fff", fontFamily: SANS }}>
        <div style={{ fontWeight: 700, fontSize: 40, letterSpacing: ".02em", opacity: c(2), transform: `translateY(${(1 - c(2)) * 30}px)` }}>
          Robes traditionnelles · Mariage
          <br />
          Soirée · Abaya
        </div>
        <div style={{ marginTop: 22, fontWeight: 600, fontSize: 30, letterSpacing: ".16em", color: MINT, opacity: c(3) }}>
          SUR MESURE · ACHAT · LOCATION
        </div>
      </div>
      {/* the man, small, beside the contact block */}
      <Img
        src={staticFile("me.webp")}
        style={{
          position: "absolute",
          left: 70,
          top: 1880 - H,
          width: W,
          height: H,
          opacity: me,
          transform: `translateY(${(1 - me) * 200}px)`,
          filter: "drop-shadow(0 16px 22px rgba(0,0,0,.25))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 340,
          right: 60,
          top: 1320,
          background: "#fff",
          color: INK,
          padding: "30px 34px 34px",
          borderRadius: 4,
          fontFamily: SANS,
          boxShadow: "0 7px 0 rgba(0,0,0,.2), 0 18px 34px rgba(0,0,0,.22)",
          opacity: c(4),
          transform: `translateY(${(1 - c(4)) * 50}px) rotate(${(1 - c(4)) * 4}deg) scale(${1 + 0.015 * pulse * c(4)})`,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: ".2em" }}>WHATSAPP</div>
        <div style={{ fontFamily: ANTON, fontSize: 82, lineHeight: 1.1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>06 44 72 57 58</div>
        <div style={{ marginTop: 14, borderTop: "1.5px dotted #333", paddingTop: 12, fontWeight: 600, fontSize: 25, lineHeight: 1.35 }}>
          31 rue Aristide Briand
          <br />
          78130 Les Mureaux
        </div>
        <div style={{ marginTop: 8, fontWeight: 600, fontSize: 22, color: "#55605a" }}>Du lundi au samedi · 9h – 19h</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 1715,
          fontFamily: BRUSH,
          fontSize: 92,
          color: "#fff",
          transform: "rotate(-6deg)",
          textShadow: "0 2px 14px rgba(0,0,0,.25)",
          clipPath: `inset(-30% ${(1 - ramp(t, bt(END_BEAT + 7), BEAT_LEN * 2, Easing.inOut(Easing.cubic))) * 100}% -30% 0)`,
        }}
      >
        à très vite !
      </div>
      <div
        style={{
          position: "absolute",
          left: 330,
          right: 40,
          top: 1838,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: ".2em",
          color: "#fff",
          opacity: 0.9 * c(6),
        }}
      >
        DESIGNED BY <span style={{ fontWeight: 800 }}>LAKEHAL DJILALI</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1268, height: 4 }}>
        <div style={{ margin: "0 auto", width: 120 * c(3), height: 3, background: GOLD }} />
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(t, [b0, b0 + 0.3], [0.8, 0], clamp) }} />
    </AbsoluteFill>
  );
};

// ── Opening: the shop front ────────────────────────────────────────────────
const Store: React.FC<{ t: number; pulse: number }> = ({ t, pulse }) => {
  const end = bt(0);
  const zoom = interpolate(t, [0, end], [1.14, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = ramp(t, end - BEAT_LEN * 0.7, BEAT_LEN * 0.7, Easing.in(Easing.cubic));
  const IH = (1080 * 1269) / 1240;
  const cap = ramp(t, BEATS[2], 0.6);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Img
        src={staticFile("store.webp")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(40px) brightness(.55)",
          transform: "scale(1.2)",
        }}
      />
      <Img
        src={staticFile("store.webp")}
        style={{
          position: "absolute",
          left: 0,
          top: (1920 - IH) / 2 - 60,
          width: 1080,
          height: IH,
          transformOrigin: "50% 20%",
          transform: `scale(${zoom * (1 + 0.006 * pulse)})`,
          boxShadow: "0 30px 70px rgba(0,0,0,.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: (1920 + IH) / 2 + 10,
          textAlign: "center",
          color: "#fff",
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: ".24em",
          opacity: cap,
          transform: `translateY(${(1 - cap) * 24}px)`,
        }}
      >
        LES MUREAUX · 78130
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(out, interpolate(t, [0, 0.4], [1, 0], clamp)) }} />
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { i, pulse } = beatAt(t);

  let scene: React.ReactNode;
  if (i < 0) scene = <Store t={t} pulse={pulse} />;
  else if (i < PHOTOS_BEAT) scene = <Hero t={t} pulse={i < 0 ? 0 : pulse} beat={Math.max(0, i)} />;
  else if (i < END_BEAT) scene = <Collection t={t} pulse={pulse} />;
  else scene = <EndCard t={t} pulse={pulse} />;

  const end = bt(LAST_BEAT) + 0.5;
  const fadeOut = interpolate(t, [end - 0.8, end - 0.05], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) => interpolate(f / FPS, [end - 1.6, end], [1, 0], clamp)}
      />
      <AbsoluteFill style={{ opacity: fadeOut }}>{scene}</AbsoluteFill>
    </AbsoluteFill>
  );
};
