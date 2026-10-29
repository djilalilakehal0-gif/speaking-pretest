"""Synthesises the showreel soundtrack (120 BPM, cuts land on the beat). Pure numpy, no samples."""
import sys, wave
import numpy as np

SR, DUR = 44100, 15.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros(N)


def tt(d):
    return np.arange(int(SR * d)) / SR


def put(sig, at, gain=1.0):
    i = int(at * SR)
    if i >= N:
        return
    seg = sig[: N - i]
    mix[i:i + len(seg)] += seg * gain


def lowpass(x, cutoff):
    """one-pole low-pass; cutoff may be an array (Hz) for sweeps"""
    c = np.broadcast_to(cutoff, x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); s = 0.0
    for n in range(len(x)):
        s += a[n] * (x[n] - s); y[n] = s
    return y


def kick():
    t = tt(.5)
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 1.0 + np.exp(-t * 400) * rng.standard_normal(len(t)) * .25


def hat():
    t = tt(.08); n = rng.standard_normal(len(t)); n = n - np.concatenate([[0], n[:-1]])
    return n * np.exp(-t * 70) * .5


def clap():
    t = tt(.3); n = rng.standard_normal(len(t))
    env = np.exp(-t * 22)
    bp = lowpass(n, 3500) - lowpass(n, 700)
    return bp * env * 1.6


def bass(freq, d=.28):
    t = tt(d); ph = 2 * np.pi * freq * t
    return (np.sin(ph) + .35 * np.sin(2 * ph) + .15 * np.sin(3 * ph)) * np.exp(-t * 6) * np.minimum(1, t * 400)


def pluck(freq, d=.5):
    t = tt(d); ph = 2 * np.pi * freq * t
    return (np.sin(ph) + .5 * np.sin(2 * ph) * np.exp(-t * 10) + .25 * np.sin(3 * ph)) * np.exp(-t * 7) * np.minimum(1, t * 600)


def whoosh(d=.55):
    t = tt(d); n = rng.standard_normal(len(t))
    cut = 200 + 7000 * (t / d) ** 2
    return lowpass(n, cut) * (t / d) ** 1.8 * 1.5


def riser(d=1.0):
    t = tt(d); k = t / d
    n = lowpass(rng.standard_normal(len(t)), 300 + 9000 * k ** 2) * k ** 2
    s = np.sin(2 * np.pi * np.cumsum(180 + 1800 * k ** 2) / SR) * k ** 2 * .25
    return (n * 1.1 + s)


def boom(d=1.6):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2) * 1.2


def crash(d=1.8):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - np.concatenate([[0], n[:-1]])
    return n * np.exp(-t * 2.6) * .35


beat = .5
# --- drums: kick every beat, offbeat hats from the logo reveal onward
for b in np.arange(0, 13.5, beat):
    put(kick(), b, .85)
for b in np.arange(2.0, 13.5, beat):
    put(hat(), b + beat / 2, .5)
    put(hat(), b + beat / 4, .22); put(hat(), b + beat * .75, .22)
for b in np.arange(2.5, 13.5, 1.0):
    put(clap(), b, .55)
# --- bass line (A minor-ish) from the logo reveal
notes = [55, 55, 82.4, 55, 73.4, 55, 65.4, 82.4]
for k, b in enumerate(np.arange(2.0, 13.5, beat)):
    put(bass(notes[k % 8]), b + beat / 2, .55)
# --- opening hits on the three words
for b in (0, .5, 1.0):
    put(clap(), b, .8); put(boom(.5), b, .5)
# --- transition whooshes ending on each cut
for c in (2.0, 4.0, 7.0, 9.5, 11.5):
    put(whoosh(.55), c - .5, .7)
# --- counter ticks during the dashboard
for k, tm in enumerate(np.arange(4.5, 6.3, .045)):
    t = tt(.02); put(np.sin(2 * np.pi * (1500 + k * 22) * t) * np.exp(-t * 150), tm, .09)
# --- network blips in the spread scene
for tm in np.linspace(7.4, 9.1, 26):
    f = 440 * 2 ** (rng.integers(0, 10) / 12 * 1.0)
    put(pluck(f, .25), tm, .13)
# --- stat hits (9.5, 10, 10.5, 11)
for k, c in enumerate((9.5, 10.0, 10.5, 11.0)):
    put(boom(.6), c, .55); put(clap(), c, .6)
    put(pluck([220, 247, 262, 330][k] * 2, .5), c, .35)
# --- arpeggio in the orbit scene
scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3]
for k, tm in enumerate(np.arange(11.5, 13.5, .125)):
    put(pluck(scale[(k * 2) % len(scale)] * (2 if k % 4 == 3 else 1), .35), tm, .2)
# --- riser into the end card, then the drop
put(riser(1.0), 12.5, .75)
put(boom(1.8), 13.5, 1.0); put(crash(1.6), 13.5, 1.0); put(kick(), 13.5, 1.0)
for f, d in ((220, 1.4), (329.6, 1.4), (392, 1.4), (523.3, 1.4), (659.3, 1.4)):
    t = tt(d); s = (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 1.6) * np.minimum(1, t * 200)
    put(s, 13.5, .13)
for k, tm in enumerate((13.5, 13.75, 14.0, 14.25)):
    put(pluck([659.3, 784, 880, 1046.5][k], .6), tm + .05, .22)

# --- master
mix = np.tanh(mix * .9)
mix *= np.clip((DUR - np.arange(N) / SR) / .25, 0, 1)
mix = mix / np.max(np.abs(mix)) * .89
pcm = (np.stack([mix, np.roll(mix, 40) * .98], axis=1) * 32767).astype('<i2')
out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', out)
