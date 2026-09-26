#!/usr/bin/env python3
"""
The soundtrack, synthesised from scratch and timed from film.json.

    python3 video/music.py   ->  video/out/soundtrack.wav

Scene starts become impacts (with a whoosh leading in), caption lines become
short hits, and the groove sits on the same 120 BPM grid the picture is cut
to, so every cut and text slam lands on the beat. No samples: every sound is
built here from sine waves and noise. Needs numpy and scipy.
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = json.load(open(os.path.join(HERE, 'film.json')))
SR = 48000
BPM = FILM['bpm']
BEAT = 60 / BPM
DUR = FILM['duration']
N = int(SR * (DUR + 0.5))
rng = np.random.default_rng(7)  # fixed seed: the same film gives the same track

L = np.zeros(N)
R = np.zeros(N)
bus_duck = np.zeros(N)  # music that ducks under the kick (bass, pads, arps)
bus_duck_r = np.zeros(N)


def t_(n):
    return np.arange(n) / SR


def add(sig, at, gain=1.0, pan=0.0, duck=False):
    """Mix a mono signal in at `at` seconds. pan -1 (left) .. 1 (right)."""
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    if duck:
        bus_duck[i:i + len(sig)] += sig * l
        bus_duck_r[i:i + len(sig)] += sig * r
    else:
        L[i:i + len(sig)] += sig * l
        R[i:i + len(sig)] += sig * r


def filt(sig, kind, freq, order=2):
    return sosfilt(butter(order, freq, btype=kind, fs=SR, output='sos'), sig)


def env(n, a=0.002, d=0.2, curve=6.0):
    t = t_(n)
    e = np.minimum(t / max(a, 1e-4), 1.0)
    return e * np.exp(-np.maximum(t - a, 0) * curve / max(d, 1e-4))


def note(name):
    """'A2' -> Hz."""
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    return 440.0 * 2 ** ((names[name[:-1]] + (int(name[-1]) - 4) * 12) / 12)


# ── Instruments ────────────────────────────────────────────────────

def kick(gain=1.0):
    n = int(0.45 * SR)
    t = t_(n)
    f = 45 + 110 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    click = filt(rng.standard_normal(n), 'high', 2000) * np.exp(-t * 300) * 0.3
    return np.tanh((body + click) * 1.6) * gain


def clap():
    n = int(0.3 * SR)
    noise = filt(rng.standard_normal(n), 'band', [900, 5000])
    t = t_(n)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):  # three quick smacks, then the tail
        e += np.exp(-np.maximum(t - off, 0) * (140 if k < 2 else 18)) * (t >= off)
    return noise * e * 0.5


def hat(open_=False):
    n = int((0.25 if open_ else 0.05) * SR)
    s = filt(rng.standard_normal(n), 'high', 7000)
    return s * env(n, 0.001, 0.2 if open_ else 0.03, 5) * (0.35 if open_ else 0.3)


def saw(freq, n, detune=0.0):
    t = t_(n)
    ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def bass(freq, dur):
    n = int(dur * SR)
    s = saw(freq, n) * 0.6 + np.sin(2 * np.pi * freq * t_(n)) * 0.8
    s = filt(s, 'low', 420)
    return s * env(n, 0.004, dur * 0.9, 3)


def pad(freqs, dur):
    n = int(dur * SR)
    s = np.zeros(n)
    for f in freqs:
        for dt in (-0.006, 0.0, 0.007):
            s += saw(f, n, dt)
    s = filt(s / (len(freqs) * 3), 'low', 1400)
    t = t_(n)
    a = np.minimum(t / 0.35, 1) * np.minimum((dur - t) / 0.3, 1).clip(0, 1)
    return s * a * 0.5


def pluck(freq, dur=0.22):
    n = int(dur * SR)
    t = t_(n)
    s = np.sin(2 * np.pi * freq * t + 0.8 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 18))
    return s * env(n, 0.002, dur, 7) * 0.35


def ping(freq):
    """A notification blip for the hook's chaos."""
    n = int(0.18 * SR)
    t = t_(n)
    s = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 1.5 * t)
    return s * env(n, 0.002, 0.15, 6) * 0.28


def whoosh(dur=0.5):
    """Filtered noise swelling into a cut."""
    n = int(dur * SR)
    t = t_(n)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 12
    for k in range(steps):  # a crude sweep: band-passed chunks rising in pitch
        a, b = k * n // steps, (k + 1) * n // steps
        lo = 300 * (18 ** (k / steps))
        out[a:b] = filt(noise, 'band', [lo, min(lo * 3, 20000)])[a:b]
    return out * (t / dur) ** 2.2 * 0.35


def impact(gain=1.0):
    n = int(1.4 * SR)
    t = t_(n)
    sub = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 12)) * t) * np.exp(-t * 3.2)
    crack = filt(rng.standard_normal(n), 'band', [200, 3000]) * np.exp(-t * 22) * 0.5
    return np.tanh((sub + crack) * 1.4) * gain


def thock():
    """The caption slam: a short, dry, woody hit."""
    n = int(0.12 * SR)
    t = t_(n)
    body = np.sin(2 * np.pi * (220 * np.exp(-t * 25) + 90) * t) * np.exp(-t * 38)
    snap = filt(rng.standard_normal(n), 'band', [1500, 6000]) * np.exp(-t * 120) * 0.4
    return (body + snap) * 0.5


def riser(dur):
    n = int(dur * SR)
    t = t_(n)
    tone = np.sin(2 * np.pi * np.cumsum(110 + 770 * (t / dur) ** 2) / SR) * 0.15
    noise = filt(rng.standard_normal(n), 'high', 1500) * 0.25
    return (tone + noise) * (t / dur) ** 3


# ── Arrangement ────────────────────────────────────────────────────

scenes = {s['id']: s for s in FILM['scenes']}
S = lambda i: scenes[i]['start']
GROOVE_FROM, GROOVE_TO = S('register'), S('end') + 2.5
# A minor: Am – F – C – G, one chord per bar.
PROG = [('A2', ['A3', 'C4', 'E4']), ('F2', ['F3', 'A3', 'C4']), ('C3', ['G3', 'C4', 'E4']), ('G2', ['G3', 'B3', 'D4'])]
ARP = [0, 1, 2, 1, 2, 0, 1, 2]

# Hook: ticking, notification pings on each fragment, a riser, silence, then the reveal.
for k in range(16):
    add(hat(), k * BEAT / 2, 0.5 if k % 2 else 0.8, 0.3)
drone = filt(saw(note('A1'), int(4 * SR)) + saw(note('A1'), int(4 * SR), 0.004), 'low', 260) * np.minimum(t_(int(4 * SR)) / 1.5, 1) * 0.25
add(drone, 0)
pent = [note(n) for n in ('A5', 'C6', 'D6', 'E6', 'G6', 'A6')]
for k in range(14):
    add(ping(pent[int(rng.integers(0, len(pent)))]), 0.25 + k * 0.25, 0.9, float(rng.uniform(-0.8, 0.8)))
add(riser(2.0), 2.0, 1.0)
add(impact(0.9), 4.25)
add(pad([note('A3'), note('C4'), note('E4'), note('A4')], 1.75), 4.25, 0.9)
for c in scenes['hook']['captions']:
    add(thock(), c['at'], 0.8)

# The groove, from the first cut to the wordmark.
beats = np.arange(GROOVE_FROM, GROOVE_TO - 1e-6, BEAT)
for b in beats:
    add(kick(), b, 0.9)
    i = int(round((b - GROOVE_FROM) / BEAT))
    if i % 2 == 1 and b >= S('atrisk'):
        add(clap(), b, 0.8, -0.1)
    add(hat(open_=True), b + BEAT / 2, 0.8, 0.25)
    for q in (0.25, 0.75):
        add(hat(), b + BEAT * q, 0.35, -0.25)
bar_len = 4 * BEAT
for j, b in enumerate(np.arange(GROOVE_FROM, GROOVE_TO - 1e-6, bar_len)):
    root, chord = PROG[j % 4]
    for e in range(8):  # eighth-note bass, octave bounce
        f = note(root) * (2 if e % 2 else 1)
        add(bass(f, BEAT / 2 * 0.95), b + e * BEAT / 2, 0.55, duck=True)
    add(pad([note(n) for n in chord], bar_len), b, 0.45, duck=True)
    if b >= S('atrisk'):
        for k in range(16):  # sixteenth-note arpeggio, an octave up
            f = note(chord[ARP[k % 8]]) * 2
            add(pluck(f), b + k * BEAT / 4, 0.55 if k % 4 == 0 else 0.35, 0.35 if k % 2 else -0.35, duck=True)

# Cuts: a whoosh leading in, an impact on the downbeat.
for s in FILM['scenes'][1:]:
    add(whoosh(0.5), s['start'] - 0.5, 0.8)
    add(impact(0.55), s['start'])
# Caption slams.
for s in FILM['scenes'][1:]:
    for c in s['captions']:
        if not c.get('small'):
            add(thock(), s['start'] + c['at'], 0.55)

# Payroll lift: a snare roll into the end card.
roll_from = S('end') - 2.0
for k in range(16):
    tt = roll_from + k * BEAT / 4
    add(clap(), tt, 0.25 + 0.5 * k / 16, 0.1 * (-1) ** k)
add(riser(2.0), roll_from, 0.7)

# End card: the groove stops on the wordmark; a big hit and a held chord.
mark = S('end') + 2.5
add(impact(1.1), mark)
final = pad([note('A2'), note('E3'), note('A3'), note('C4'), note('E4')], DUR - mark + 0.4)
add(final, mark, 1.1)
for k, n in enumerate(('A4', 'C5', 'E5', 'A5')):  # a little figure under the tagline and CTA
    add(pluck(note(n), 0.6), mark + 0.5 + k * BEAT / 2, 0.6, 0.2 * (-1) ** k)

# ── Mix ────────────────────────────────────────────────────────────

duck = np.ones(N)
for b in beats:
    i = int(b * SR)
    n = min(int(0.3 * SR), N - i)
    duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.55 * np.exp(-t_(n) * 14))
L += bus_duck * duck
R += bus_duck_r * duck

# A short plate-ish reverb on everything, mixed low.
ir_n = int(1.6 * SR)
ir = rng.standard_normal(ir_n) * np.exp(-t_(ir_n) * 4.0)
ir = filt(ir, 'low', 5000)
ir /= np.sqrt(np.sum(ir ** 2))
L = L + 0.16 * fftconvolve(L, ir)[:N]
R = R + 0.16 * fftconvolve(R, np.roll(ir, 37))[:N]  # offset IR: a little stereo width

# Sidechain first (above), then master: high-pass rumble, gentle saturation, normalise, fade out.
L, R = filt(L, 'high', 28), filt(R, 'high', 28)
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(L / peak * 1.3) / np.tanh(1.3), np.tanh(R / peak * 1.3) / np.tanh(1.3)
fade = np.clip((DUR - t_(N)) / 0.6, 0, 1)
L, R = L * fade * 0.89, R * fade * 0.89
n_out = int(DUR * SR)
pcm = (np.stack([L[:n_out], R[:n_out]], axis=1) * 32767).astype('<i2')

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
path = os.path.join(HERE, 'out', 'soundtrack.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(path)
