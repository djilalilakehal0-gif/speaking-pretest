// Procedural soundtrack, 120 BPM, locked to the visual timeline in reel.html.
const fs = require('fs');
const SR = 44100, DUR = 20, N = SR * DUR, BEAT = 0.5;
const bus = () => [new Float32Array(N), new Float32Array(N)];
const drums = bus(), bass = bus(), arp = bus(), pad = bus(), fx = bus();
let seed = 99; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (b, i, v, pan = 0) => { if (i < 0 || i >= N) return; b[0][i] += v * (1 - Math.max(0, pan)); b[1][i] += v * (1 + Math.min(0, pan)); };

function kick(t, g = 1) {
  let ph = 0;
  for (let n = 0, s = Math.floor(t * SR); n < 0.45 * SR; n++) {
    const x = n / SR, f = 42 + 130 * Math.exp(-x * 28); ph += (2 * Math.PI * f) / SR;
    add(drums, s + n, Math.sin(ph) * Math.exp(-x * 7) * 0.95 * g + (n < 60 ? rnd() * 0.3 : 0) * g);
  }
}
function clap(t, g = 1) {
  const s = Math.floor(t * SR); let lp = 0;
  for (let n = 0; n < 0.3 * SR; n++) {
    const x = n / SR, burst = [0, 0.011, 0.022].reduce((a, o) => a + (x >= o ? Math.exp(-(x - o) * 90) : 0), 0) * 0.5 + Math.exp(-x * 14) * 0.5;
    const r = rnd(); lp += 0.55 * (r - lp);
    add(drums, s + n, (r - lp) * burst * 0.55 * g, 0.1);
  }
}
function hat(t, open = false, g = 1, pan = 0) {
  const s = Math.floor(t * SR); let prev = 0;
  for (let n = 0; n < (open ? 0.25 : 0.06) * SR; n++) {
    const x = n / SR, r = rnd(), hp = r - prev; prev = r;
    add(drums, s + n, hp * Math.exp(-x * (open ? 16 : 70)) * 0.22 * g, pan);
  }
}
function bassNote(t, d, f, g = 1) {
  const s = Math.floor(t * SR); let ph = 0, lp = 0;
  for (let n = 0; n < d * SR; n++) {
    const x = n / SR; ph += f / SR; const saw = 2 * (ph % 1) - 1;
    lp += (0.04 + 0.08 * Math.exp(-x * 9)) * (saw - lp);
    const env = Math.min(1, x * 200) * Math.exp(-x * 2.2) * Math.min(1, (d - x) * 40);
    add(bass, s + n, (lp * 0.8 + Math.sin(2 * Math.PI * ph) * 0.45) * env * 0.5 * g);
  }
}
function pluck(t, f, g = 1, pan = 0, dur = 0.5) {
  const s = Math.floor(t * SR); let p1 = 0, p2 = 0, lp = 0;
  for (let n = 0; n < dur * SR; n++) {
    const x = n / SR; p1 += f / SR; p2 += (f * 1.006) / SR;
    const saw = (2 * (p1 % 1) - 1 + 2 * (p2 % 1) - 1) * 0.5;
    lp += (0.03 + 0.4 * Math.exp(-x * 14)) * (saw - lp);
    add(arp, s + n, lp * Math.exp(-x * 6) * Math.min(1, x * 400) * 0.35 * g, pan);
  }
}
function bell(t, f, g = 1) {
  const s = Math.floor(t * SR);
  for (let n = 0; n < 1.6 * SR; n++) {
    const x = n / SR;
    const v = Math.sin(2 * Math.PI * f * x) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * x) * Math.exp(-x * 5) + 0.3 * Math.sin(2 * Math.PI * f * 5.4 * x) * Math.exp(-x * 9);
    add(fx, s + n, v * Math.exp(-x * 3.2) * 0.22 * g, Math.sin(f) * 0.4);
  }
}
function blip(t, f, g = 1) {
  const s = Math.floor(t * SR); let ph = 0;
  for (let n = 0; n < 0.18 * SR; n++) { const x = n / SR; ph += (2 * Math.PI * f * (1 + 0.5 * x)) / SR; add(fx, s + n, Math.sin(ph) * Math.exp(-x * 18) * 0.3 * g); }
}
function padChord(t, d, notes, g = 1) {
  const s = Math.floor(t * SR);
  notes.forEach((m, k) => {
    const f = hz(m); let p1 = 0, p2 = 0, lp = 0;
    for (let n = 0; n < d * SR; n++) {
      const x = n / SR; p1 += f / SR; p2 += (f * 1.004) / SR;
      const saw = (2 * (p1 % 1) - 1 + 2 * (p2 % 1) - 1) * 0.5;
      lp += 0.02 * (saw - lp);
      const env = Math.min(1, x / 0.6) * Math.min(1, (d - x) / 0.5);
      add(pad, s + n, lp * env * 0.16 * g, (k % 2 ? 0.4 : -0.4));
    }
  });
}
function noiseSweep(t0, t1, g = 1, rise = true) {
  const s = Math.floor(t0 * SR), L = Math.floor((t1 - t0) * SR); let lp = 0, lp2 = 0;
  for (let n = 0; n < L; n++) {
    const u = n / L, k = rise ? u : 1 - u, a = 0.02 + 0.5 * k * k;
    lp += a * (rnd() - lp); lp2 += a * (lp - lp2);
    const bell = rise ? Math.pow(u, 2.2) : Math.sin(Math.PI * u);
    add(fx, s + n, (lp - lp2) * 6 * bell * g, Math.sin(u * 6) * 0.5);
  }
}
function boom(t, g = 1) {
  const s = Math.floor(t * SR); let ph = 0;
  for (let n = 0; n < 2.0 * SR; n++) {
    const x = n / SR; ph += (2 * Math.PI * (48 + 90 * Math.exp(-x * 12))) / SR;
    add(fx, s + n, (Math.sin(ph) * Math.exp(-x * 2.2) + rnd() * Math.exp(-x * 14) * 0.5) * 0.8 * g);
  }
}

// ---- arrangement ----
const CH = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]; // Am F C G
const ROOT = [33, 29, 36, 31];
const barOf = (t) => Math.floor(t / 2) % 4;
const cuts = [3, 7.5, 11.5, 15, 18];

for (let b = 0; b < DUR / BEAT; b++) {
  const t = b * BEAT, bar = barOf(t), inBar = b % 4;
  const g = t < 3 ? 0.55 + 0.15 * (t / 3) : 1;
  if (t < 17.5 || t >= 18) kick(t, t >= 15 && t < 18 ? 0.8 : g);     // every beat
  if (t >= 7.5 && t < 11.5 && (inBar === 1 || inBar === 3)) clap(t, 1); // beats 2 & 4 of the rhythm scene
  if (t >= 3 && t < 7.5 && t >= 5.5 && (inBar === 1 || inBar === 3)) clap(t, 0.6);
  if (t >= 1 && t < 17.5) hat(t + 0.25, false, 0.8, 0.3);               // off-beat hats
  if (t >= 7.5 && t < 11.5) { hat(t, false, 0.5, -0.3); hat(t + 0.125, false, 0.4, 0.2); hat(t + 0.375, false, 0.4, -0.2); }
  if (t >= 3 && t < 17.5) { bassNote(t, 0.45, hz(ROOT[bar]), 1); bassNote(t + 0.25, 0.2, hz(ROOT[bar] + (inBar % 2 ? 12 : 0)), 0.6); }
  if (t >= 15 && t < 18) hat(t + 0.125, true, 0.5);
}
// arpeggio, 8th notes
for (let i = 0; i < DUR * 4; i++) {
  const t = i * 0.25; if (t < 1.5 || (t >= 17.5 && t < 18.25) || t >= 19.5) continue;
  const bar = barOf(t), notes = CH[bar], m = notes[i % 3] + (i % 6 < 3 ? 12 : 24);
  const gain = t < 3 ? 0.4 : t >= 11.5 && t < 15 ? 0.8 : 1;
  pluck(t, hz(m), gain, Math.sin(i) * 0.5);
}
// pads follow the chords
for (let bar = 0; bar < 10; bar++) { const t = bar * 2; if (t < 1 || t >= 18) continue; padChord(t, 2.1, CH[bar % 4], t >= 11.5 && t < 15 ? 1.4 : 1); }
// scene transitions: riser into each cut, whoosh + boom on it
cuts.forEach((T) => { noiseSweep(T - 0.9, T, 1.0, true); noiseSweep(T, T + 0.5, 0.7, false); boom(T, T === 18 ? 1.4 : 0.8); });
boom(0, 0.9);
// shape-morph accents (3.5 4.5 5.5 6.5): rising bells
[69, 72, 76, 81].forEach((m, i) => bell(3.5 + i, hz(m + 12), 1));
// easing words (15.45, 16.2, 16.95): blips climbing
[81, 85, 88].forEach((m, i) => blip([15.45, 16.2, 16.95][i], hz(m), 1));
// beat-number stamps in the rhythm scene are the kicks above; "EVERY BEAT LANDS ON THE FRAME" words tick on the beat
for (let i = 0; i < 6; i++) blip(8 + i * 0.5, hz(93), 0.35);
// finale: chord, shimmer while the crescent draws, bells on the three Arabic words
padChord(18.2, 2.0, [45, 57, 60, 64, 69], 2.2);
for (let i = 0; i < 12; i++) blip(18.3 + i * 0.055, hz(81 + [0, 3, 7, 10, 12, 15][i % 6] + Math.floor(i / 6) * 5), 0.6);
[[18.95, 72], [19.2, 76], [19.45, 81]].forEach(([t, m]) => bell(t, hz(m + 12), 1.1));

// ---- mix ----
const L = new Float32Array(N), R = new Float32Array(N);
const lev = { drums: 0.95, bass: 0.9, arp: 0.65, pad: 0.7, fx: 0.7 };
const mix = (b, g, c) => { for (let i = 0; i < N; i++) { L[i] += b[0][i] * g; R[i] += b[1][i] * g; } };
// ping-pong delay on arp
const dl = Math.floor(0.375 * SR);
for (let i = dl; i < N; i++) { arp[0][i] += arp[1][i - dl] * 0.38; arp[1][i] += arp[0][i - dl] * 0.38; }
// light comb reverb on pad + fx
[[1557, 0.5], [1617, 0.46], [1491, 0.44], [1422, 0.4]].forEach(([d, g]) => { for (const b of [pad, fx]) for (let c = 0; c < 2; c++) { const cd = d + c * 23; for (let i = cd; i < N; i++) b[c][i] += b[c][i - cd] * g * 0.5; } });
mix(drums, lev.drums); mix(bass, lev.bass); mix(arp, lev.arp); mix(pad, lev.pad); mix(fx, lev.fx);
// sidechain duck on kicks, limiter, fades
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, ph = (t % BEAT), duck = 1 - 0.45 * Math.exp(-ph * 14) * (t >= 1 ? 1 : 0.4);
  const fade = Math.min(1, t / 0.02) * Math.min(1, (DUR - t) / 0.45);
  L[i] = Math.tanh(L[i] * duck * 0.55) * fade; R[i] = Math.tanh(R[i] * duck * 0.55) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.93 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); out.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync(process.argv[2], out);
console.log('audio ok, peak', peak.toFixed(2));
