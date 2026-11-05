"""
NAPOLITIME — 3D beverage can generator (Blender / bpy).

Builds real 3D 33 cl cans from scratch — Coca-Cola, Pepsi, Fanta Orange and Sprite — and exports:
  public/models/{coca-cola,pepsi,fanta,sprite}.glb                    (meshes + PBR materials + embedded textures)
  public/models/previews/{name}-preview.png                           (Cycles studio renders)
  public/models/previews/*.webp                                       (same renders, light, for the website fallback)

Geometry (metres, Blender Z-up; glTF export converts to Y-up):
  * aluminium bottom: stand ring + recessed dome, revolved from a real can profile
  * label body: smooth cylinder with a cylindrical UV map (u = angle, v = height)
  * aluminium shoulder, neck, rolled lip, countersunk lid
  * pull tab (with finger hole), rivet, embossed opening score
  * condensation: a few hundred flattened droplets merged into one mesh
Labels are painted here with Pillow at 2048 px (fonts in scripts/assets/fonts, OFL licensed).
The artwork is brand-inspired, drawn from scratch: no official logo files are used.

Run (Blender 4.2+/5.x as a Python module, or inside Blender):
  python3 -m venv .venv && .venv/bin/pip install bpy pillow numpy
  .venv/bin/python scripts/generate_beverages.py            # models + previews
  .venv/bin/python scripts/generate_beverages.py --no-render  # models only (fast)
  .venv/bin/python scripts/generate_beverages.py --only fanta,sprite   # only these cans (others untouched)
or:  blender -b -P scripts/generate_beverages.py -- --no-render
"""
import math
import os
import random
import sys

import bpy  # must come first: bmesh / mathutils are provided by bpy
import bmesh
from mathutils import Matrix, Vector
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(HERE, 'assets', 'fonts')
OUT = os.path.join(ROOT, 'public', 'models')
PREVIEWS = os.path.join(OUT, 'previews')
TMP = os.path.join(ROOT, 'scripts', '.build')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
RENDER = '--no-render' not in ARGS
ONLY = ARGS[ARGS.index('--only') + 1].split(',') if '--only' in ARGS else None

# ---------------------------------------------------------------- can dimensions (33 cl standard can)
R = 0.0330            # body radius
LABEL_Z0 = 0.0125     # label (printed body) from …
LABEL_Z1 = 0.0985     # … to
HEIGHT = 0.1157
SEG = 128             # radial segments
TEX_W, TEX_H = 2048, 848   # label aspect = circumference / printed height (≈ 207 mm / 86 mm)

# Outer profile (r, z) of the aluminium parts, bottom centre → label start, label end → lid centre.
BOTTOM = [(0.0, 0.0100), (0.0060, 0.0098), (0.0120, 0.0090), (0.0180, 0.0074), (0.0220, 0.0052),
          (0.0245, 0.0025), (0.0255, 0.0008), (0.0263, 0.0000), (0.0272, 0.0001), (0.0282, 0.0008),
          (0.0295, 0.0025), (0.0310, 0.0055), (0.0322, 0.0088), (0.0328, 0.0110), (R, LABEL_Z0)]
TOP = [(R, LABEL_Z1), (0.0329, 0.1010), (0.0324, 0.1040), (0.0314, 0.1072), (0.0300, 0.1100),
       (0.0286, 0.1120), (0.0276, 0.1135), (0.0273, 0.1145), (0.0276, 0.1152), (0.0275, 0.1157),
       (0.0268, 0.1158), (0.0262, 0.1152), (0.0259, 0.1140), (0.0254, 0.1124), (0.0246, 0.1120),
       (0.0238, 0.1126), (0.0180, 0.1129), (0.0, 0.1130)]
LID_Z = 0.1130


def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


# ---------------------------------------------------------------- label artwork
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def vertical_gradient(w, h, top, mid, bottom):
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        a, b, k = (top, mid, t * 2) if t < .5 else (mid, bottom, (t - .5) * 2)
        col = tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))
        for x in range(w):
            px[x, y] = col
    return img


def draw_text_centered(draw, cx, cy, text, fnt, fill, spacing=0):
    if spacing:
        widths = [draw.textlength(ch, font=fnt) for ch in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = cx - total / 2
        for ch, w in zip(text, widths):
            draw.text((x, cy), ch, font=fnt, fill=fill, anchor='lm')
            x += w + spacing
    else:
        draw.text((cx, cy), text, font=fnt, fill=fill, anchor='mm')


def ribbon(draw, x0, x1, y_mid, amp, thickness, fill, phase=0.0, steps=240):
    """White dynamic ribbon: a band between two sine curves whose thickness swells in the middle."""
    upper, lower = [], []
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = y_mid + math.sin(t * math.pi * 1.6 + phase) * amp
        th = thickness * (0.25 + 0.75 * math.sin(t * math.pi))
        upper.append((x, y - th / 2))
        lower.append((x, y + th / 2))
    draw.polygon(upper + lower[::-1], fill=fill)


def coca_label(path):
    w, h = TEX_W, TEX_H
    img = vertical_gradient(w, h, (178, 10, 22), (228, 30, 43), (170, 8, 20))
    d = ImageDraw.Draw(img)
    script = font('yellowtail.ttf', 225)
    caps = font('montserrat-700.ttf', 46)
    small = font('montserrat-700.ttf', 30)
    for cx in (w * 0.25, w * 0.75):                # two faces, like a real can
        ribbon(d, cx - 500, cx + 500, h * 0.72, 24, 52, (250, 250, 250), phase=0.4)
        draw_text_centered(d, cx, h * 0.17, 'ORIGINAL TASTE', caps, (255, 255, 255), spacing=7)
        d.text((cx + 5, h * 0.46 + 6), 'Coca-Cola', font=script, fill=(120, 0, 10), anchor='mm')  # soft emboss shadow
        d.text((cx, h * 0.46), 'Coca-Cola', font=script, fill=(255, 255, 255), anchor='mm')
    for cx in (0, w * 0.5, w):                     # small print on the sides
        draw_text_centered(d, cx, h * 0.90, '33 cl', small, (255, 225, 225))
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(path, quality=92)


def pepsi_globe(size):
    """Red / white / blue globe with the white wave, drawn at 4× then downsampled for clean edges."""
    s = size * 4
    circle = Image.new('L', (s, s), 0)
    ImageDraw.Draw(circle).ellipse((0, 0, s - 1, s - 1), fill=255)
    globe = Image.new('RGB', (s, s), (255, 255, 255))
    red = Image.new('L', (s, s), 0)
    blue = Image.new('L', (s, s), 0)
    up, lo = [], []
    for i in range(241):
        t = i / 240
        x = t * s
        up.append((x, s * (0.47 - 0.17 * math.sin(t * math.pi * 1.05 - 0.15))))
        lo.append((x, s * (0.60 - 0.13 * math.sin(t * math.pi * 1.05 - 0.15)) + s * 0.10 * t))
    ImageDraw.Draw(red).polygon([(0, 0), (s, 0)] + up[::-1], fill=255)
    ImageDraw.Draw(blue).polygon(lo + [(s, s), (0, s)], fill=255)
    globe.paste((206, 18, 38), (0, 0), red)
    globe.paste((16, 52, 160), (0, 0), blue)
    rgba = globe.convert('RGBA')
    rgba.putalpha(circle)
    ring = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, s - 1, s - 1), outline=(255, 255, 255, 255), width=int(s * 0.035))
    rgba.alpha_composite(ring)
    return rgba.resize((size, size), Image.LANCZOS)


def pepsi_label(path):
    w, h = TEX_W, TEX_H
    img = vertical_gradient(w, h, (8, 34, 120), (20, 70, 190), (6, 28, 105)).convert('RGBA')
    shine = Image.new('L', (w, h), 0)
    sd = ImageDraw.Draw(shine)
    for cx in (w * 0.25, w * 0.75):                # lighter vertical sheen across each face
        for k in range(60):
            sd.rectangle((cx - 300 + k * 10, 0, cx - 290 + k * 10, h), fill=int(40 * math.sin(k / 59 * math.pi)))
    img.paste((70, 130, 235, 255), (0, 0), shine)
    d = ImageDraw.Draw(img)
    word = font('montserrat-800.ttf', 170)
    small = font('montserrat-700.ttf', 30)
    globe = pepsi_globe(420)
    for cx in (w * 0.25, w * 0.75):
        img.alpha_composite(globe, (int(cx - 210), int(h * 0.08)))
        d.text((cx, h * 0.82), 'pepsi', font=word, fill=(255, 255, 255), anchor='mm')
    for cx in (0, w * 0.5, w):
        draw_text_centered(d, cx, h * 0.90, '33 cl', small, (220, 230, 255))
    img.convert('RGB').filter(ImageFilter.GaussianBlur(0.5)).save(path, quality=92)


def stroked_text(img, xy, text, fnt, fill, stroke, stroke_w, angle=0.0, shadow=None, shadow_offset=(0, 10)):
    """Text with a thick outline (and optional soft shadow), drawn on its own layer so it can be rotated."""
    pad = stroke_w * 3 + 40
    probe = ImageDraw.Draw(Image.new('L', (1, 1)))
    l, t, r, b = probe.textbbox((0, 0), text, font=fnt, stroke_width=stroke_w)
    w, h = r - l + pad * 2, b - t + pad * 2
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    origin = (pad - l, pad - t)
    if shadow:
        sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((origin[0] + shadow_offset[0], origin[1] + shadow_offset[1]), text, font=fnt,
                                fill=shadow, stroke_width=stroke_w, stroke_fill=shadow)
        layer.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    d.text(origin, text, font=fnt, fill=fill, stroke_width=stroke_w, stroke_fill=stroke)
    if angle:
        layer = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
    img.alpha_composite(layer, (int(xy[0] - layer.width / 2), int(xy[1] - layer.height / 2)))


def leaf(img, cx, cy, length, angle, dark=(18, 110, 40), light=(70, 175, 70)):
    """Two-tone leaf with a central vein, drawn at 4x then downsampled."""
    s = 4
    L = int(length * s)
    lay = Image.new('RGBA', (L, L // 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    top, bot = [], []
    for i in range(61):
        t = i / 60
        x = t * L
        w = math.sin(t * math.pi) ** 0.8 * L * 0.2
        top.append((x, L / 4 - w))
        bot.append((x, L / 4 + w))
    d.polygon(top + bot[::-1], fill=dark)
    d.polygon(top + [(L, L / 4), (0, L / 4)], fill=light)
    d.line([(L * 0.04, L / 4), (L * 0.96, L / 4)], fill=(210, 240, 190), width=max(2, s * 2))
    lay = lay.resize((L // s, L // (2 * s)), Image.LANCZOS).rotate(angle, resample=Image.BICUBIC, expand=True)
    img.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))


def citrus_slice(size, flesh, pith=(255, 248, 225), peel=(240, 120, 10), segments=10):
    """Cross-section of a citrus fruit (orange / lime): peel, pith, juicy segments, at 4x then downsampled."""
    s = size * 4
    lay = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.ellipse((0, 0, s - 1, s - 1), fill=peel)
    m = s * 0.045
    d.ellipse((m, m, s - m, s - m), fill=pith)
    inner = s / 2 - s * 0.085
    c = s / 2
    gap = math.radians(3.2)
    for k in range(segments):
        a0 = 2 * math.pi * k / segments + gap
        a1 = 2 * math.pi * (k + 1) / segments - gap
        pts = [(c + s * 0.025 * math.cos((a0 + a1) / 2), c + s * 0.025 * math.sin((a0 + a1) / 2))]
        for i in range(17):
            a = a0 + (a1 - a0) * i / 16
            pts.append((c + inner * math.cos(a), c + inner * math.sin(a)))
        d.polygon(pts, fill=flesh)
        hl = tuple(min(255, int(v * 1.12) + 18) for v in flesh)   # juicy highlight streak in each segment
        mid = (a0 + a1) / 2
        d.line([(c + inner * 0.35 * math.cos(mid), c + inner * 0.35 * math.sin(mid)),
                (c + inner * 0.82 * math.cos(mid), c + inner * 0.82 * math.sin(mid))], fill=hl, width=int(s * 0.012))
    return lay.resize((size, size), Image.LANCZOS)


def splash(img, cx, cy, size, color, seed=3):
    """Juice splash: a soft crown of teardrops thrown upwards from behind a fruit slice."""
    rnd = random.Random(seed)
    s = 3
    W = int(size * 2 * s)
    lay = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    c = W / 2
    for k in range(9):
        a = math.radians(225 + 90 * k / 8 + rnd.uniform(-5, 5))
        r1 = size * s * rnd.uniform(0.62, 0.92)
        w = size * s * rnd.uniform(0.05, 0.08)
        tip = (c + r1 * math.cos(a), c + r1 * math.sin(a))
        base = size * s * 0.32
        nx, ny = -math.sin(a), math.cos(a)
        pts = []
        for i in range(21):                                   # teardrop: wide near the fruit, thin to the drop
            t = i / 20
            rr = base + (r1 - base) * t
            half = w * (1 - t) ** 1.4 + w * 0.12
            pts.append((c + rr * math.cos(a) + nx * half, c + rr * math.sin(a) + ny * half))
        for i in range(20, -1, -1):
            t = i / 20
            rr = base + (r1 - base) * t
            half = w * (1 - t) ** 1.4 + w * 0.12
            pts.append((c + rr * math.cos(a) - nx * half, c + rr * math.sin(a) - ny * half))
        d.polygon(pts, fill=color)
        dr = w * rnd.uniform(0.55, 0.85)
        dx, dy = tip[0] + math.cos(a) * dr * 2.2, tip[1] + math.sin(a) * dr * 2.2
        d.ellipse((dx - dr, dy - dr, dx + dr, dy + dr), fill=color)
    lay = lay.filter(ImageFilter.GaussianBlur(s * 1.2)).resize((W // s, W // s), Image.LANCZOS)
    img.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))


def fanta_label(path):
    w, h = TEX_W, TEX_H
    img = vertical_gradient(w, h, (214, 62, 0), (240, 104, 0), (200, 52, 0)).convert('RGBA')
    glow = Image.new('L', (w, h), 0)
    gd = ImageDraw.Draw(glow)
    for cx in (w * 0.25, w * 0.75):                      # bright sunburst behind each logo
        for k in range(28):
            r = 470 - k * 15
            gd.ellipse((cx - r, h * 0.44 - r * 0.8, cx + r, h * 0.44 + r * 0.8), fill=int(5 + k * 3.4))
    img.paste((255, 150, 20, 255), (0, 0), glow.filter(ImageFilter.GaussianBlur(30)))
    word = font('lilita-one.ttf', 245)
    tag = font('montserrat-800.ttf', 54)
    small = font('montserrat-700.ttf', 30)
    for cx in (w * 0.25, w * 0.75):
        # white-ringed orange badge, the blue wordmark across it, a leaf on top
        d = ImageDraw.Draw(img)
        r = 290
        d.ellipse((cx - r, h * 0.44 - r, cx + r, h * 0.44 + r), fill=(255, 255, 255))
        r2 = r - 22
        d.ellipse((cx - r2, h * 0.44 - r2, cx + r2, h * 0.44 + r2), fill=(242, 100, 0))
        leaf(img, cx + 40, h * 0.17, 210, 14)
        stroked_text(img, (cx, h * 0.45), 'fanta', word, (14, 46, 150), (255, 255, 255), 17, angle=4,
                     shadow=(10, 22, 80, 170), shadow_offset=(6, 12))
        d = ImageDraw.Draw(img)
        pill_w, pill_h, py, px = 330, 92, h * 0.73, cx - 40
        d.rounded_rectangle((px - pill_w / 2, py - pill_h / 2, px + pill_w / 2, py + pill_h / 2), radius=24,
                            fill=(16, 44, 130), outline=(255, 255, 255), width=6)
        draw_text_centered(d, px, py + 2, 'Orange', tag, (255, 255, 255))
        sl = citrus_slice(280, (255, 150, 20), peel=(244, 118, 6))
        splash(img, cx + 340, h * 0.86, 230, (255, 196, 70, 235), seed=int(cx))
        img.alpha_composite(sl, (int(cx + 340 - 140), int(h * 0.84 - 140)))
        leaf(img, cx + 450, h * 0.66, 140, 50)
    d = ImageDraw.Draw(img)
    for cx in (0, w * 0.5, w):
        draw_text_centered(d, cx, h * 0.92, '33 cl', small, (255, 236, 210))
    img.convert('RGB').filter(ImageFilter.GaussianBlur(0.5)).save(path, quality=92)


def sprite_banner(width, height):
    """Green banner with a white outline and spiky ends, like the Sprite label."""
    s = 4
    W, H = width * s, height * s
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    tip = H * 0.18
    pts = [(tip, H * 0.18), (W * 0.5, H * 0.04), (W - tip * 0.2, H * 0.10), (W - tip, H * 0.30), (W - tip * 0.4, H * 0.55),
           (W - tip * 1.1, H * 0.74), (W * 0.5, H * 0.92), (tip * 0.6, H * 0.86), (tip * 1.2, H * 0.62), (0, H * 0.40)]
    d.polygon(pts, fill=(255, 255, 255))
    cx, cy = W / 2, H / 2
    inner = [(cx + (x - cx) * 0.93, cy + (y - cy) * 0.86) for x, y in pts]
    d.polygon(inner, fill=(10, 112, 46))
    return lay.resize((width, height), Image.LANCZOS)


def sprite_label(path):
    w, h = TEX_W, TEX_H
    img = vertical_gradient(w, h, (6, 96, 38), (20, 150, 64), (5, 84, 32)).convert('RGBA')
    sheen = Image.new('L', (w, h), 0)
    sd = ImageDraw.Draw(sheen)
    for cx in (w * 0.25, w * 0.75):                      # diagonal light streaks
        for k in range(5):
            x = cx - 380 + k * 170
            sd.polygon([(x, 0), (x + 60, 0), (x - 140, h), (x - 200, h)], fill=26)
    img.paste((120, 220, 120, 255), (0, 0), sheen.filter(ImageFilter.GaussianBlur(18)))
    word = font('kanit-800-italic.ttf', 205)
    small = font('montserrat-700.ttf', 30)
    for cx in (w * 0.25, w * 0.75):
        d = ImageDraw.Draw(img)
        # yellow-to-lime citrus sun peeking over the banner
        sun = Image.new('RGBA', (360, 360), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(sun)
        for k in range(180):
            t = k / 179
            col = (int(250 - 60 * t), int(214 + 20 * t), int(30 + 40 * t), 255)
            sdraw.ellipse((k, k, 359 - k, 359 - k), outline=col, width=2)
        img.alpha_composite(sun.rotate(25), (int(cx + 10), int(h * 0.02)))
        banner = sprite_banner(900, 330)
        img.alpha_composite(banner, (int(cx - 450), int(h * 0.22)))
        stroked_text(img, (cx, h * 0.41), 'Sprite', word, (255, 255, 255), (8, 70, 28), 6, angle=8,
                     shadow=(0, 40, 14, 170), shadow_offset=(5, 9))
        lime = citrus_slice(260, (190, 228, 60), pith=(240, 250, 210), peel=(70, 160, 40))
        splash(img, cx + 210, h * 0.82, 220, (225, 250, 255, 210), seed=int(cx) + 5)
        img.alpha_composite(lime, (int(cx + 210 - 130), int(h * 0.80 - 130)))
    d = ImageDraw.Draw(img)
    for cx in (0, w * 0.5, w):
        draw_text_centered(d, cx, h * 0.92, '33 cl', small, (210, 245, 215))
    img.convert('RGB').filter(ImageFilter.GaussianBlur(0.5)).save(path, quality=92)


# ---------------------------------------------------------------- materials
def principled(name, color, metallic=0.0, roughness=0.3, coat=0.0, transmission=0.0, ior=1.45, image=None, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    p.inputs['IOR'].default_value = ior
    if 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = coat
        p.inputs['Coat Roughness'].default_value = 0.05
    if 'Transmission Weight' in p.inputs:
        p.inputs['Transmission Weight'].default_value = transmission
    if image:
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(image)
        tex.interpolation = 'Cubic'
        nt.links.new(tex.outputs['Color'], p.inputs['Base Color'])
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
    return m


# ---------------------------------------------------------------- geometry helpers
def lathe(name, profile, collection, material, uv=False, segments=SEG, rings=None):
    """Revolves an (r, z) profile around Z. With `uv`, writes a cylindrical UV map (u = angle, v = height)."""
    if rings:  # insert intermediate rings on long straight runs (smooth shading, texture precision)
        dense = []
        for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
            for k in range(rings):
                t = k / rings
                dense.append((r0 + (r1 - r0) * t, z0 + (z1 - z0) * t))
        dense.append(profile[-1])
        profile = dense
    bm = bmesh.new()
    rows = []
    for r, z in profile:
        if r < 1e-6:
            rows.append([bm.verts.new((0, 0, z))])
        else:
            rows.append([bm.verts.new((r * math.cos(2 * math.pi * i / segments), r * math.sin(2 * math.pi * i / segments), z)) for i in range(segments)])
    uv_layer = bm.loops.layers.uv.new('UVMap') if uv else None
    z0, z1 = profile[0][1], profile[-1][1]
    for a, b in zip(rows, rows[1:]):
        for i in range(segments):
            j = (i + 1) % segments
            if len(a) == 1:
                verts = [a[0], b[i], b[j]]
            elif len(b) == 1:
                verts = [a[i], a[j], b[0]]
            else:
                verts = [a[i], a[j], b[j], b[i]]
            try:
                f = bm.faces.new(verts)
            except ValueError:
                continue
            f.smooth = True
            if uv_layer:
                for loop in f.loops:
                    co = loop.vert.co
                    ang = math.atan2(co.y, co.x) % (2 * math.pi)
                    u = ang / (2 * math.pi)
                    # faces that straddle the seam: the vertex on column 0 belongs to u = 1
                    if j == 0 and loop.vert in (a[0] if len(a) > 1 else None, b[0] if len(b) > 1 else None):
                        u = 1.0
                    loop[uv_layer].uv = (u, (co.z - z0) / (z1 - z0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


def superellipse(cx, cy, a, b, n=3.0, count=72):
    pts = []
    for i in range(count):
        t = 2 * math.pi * i / count
        c, s = math.cos(t), math.sin(t)
        pts.append((cx + a * math.copysign(abs(c) ** (2 / n), c), cy + b * math.copysign(abs(s) ** (2 / n), s)))
    return pts


def flat_shape(name, outlines, thickness, collection, material, bevel=0.0):
    """Extruded 2D shape (first outline = outside, others = holes) converted to a mesh."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '2D'
    cu.fill_mode = 'BOTH'
    cu.extrude = thickness / 2
    cu.bevel_depth = bevel
    cu.resolution_u = 2
    for outline in outlines:
        sp = cu.splines.new('POLY')
        sp.points.add(len(outline) - 1)
        for p, (x, y) in zip(sp.points, outline):
            p.co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    tmp = bpy.data.objects.new(name + '_curve', cu)
    collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    obj = bpy.data.objects.new(name, me)
    for poly in me.polygons:
        poly.use_smooth = False
    obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


def droplets(name, collection, material, count=320, seed=7):
    """Condensation: flattened icospheres on the label surface (and a few on the shoulder), one merged mesh."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    for k in range(count):
        ang = rnd.uniform(0, 2 * math.pi)
        z = rnd.uniform(LABEL_Z0 + 0.002, LABEL_Z1 + 0.004)
        size = rnd.choice([0.00045, 0.0006, 0.0008, 0.0010, 0.0013, 0.0017]) * rnd.uniform(0.8, 1.2)
        elong = rnd.uniform(1.0, 1.25) if size < 0.0012 else rnd.uniform(1.2, 1.7)   # big drops sag downwards
        radial = Vector((math.cos(ang), math.sin(ang), 0))
        tangent = Vector((-math.sin(ang), math.cos(ang), 0))
        up = Vector((0, 0, 1))
        r_here = R if z <= LABEL_Z1 else 0.0328
        centre = radial * (r_here + size * 0.18) + Vector((0, 0, z - size * (elong - 1) * 0.6))
        basis = Matrix((
            (tangent.x * size, up.x * size * elong, radial.x * size * 0.42, centre.x),
            (tangent.y * size, up.y * size * elong, radial.y * size * 0.42, centre.y),
            (tangent.z * size, up.z * size * elong, radial.z * size * 0.42, centre.z),
            (0, 0, 0, 1)))
        geom = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
        bmesh.ops.transform(bm, matrix=basis, verts=geom['verts'])
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(material)
    collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------- one can
def build_can(key, title, label_png, tab_tint):
    col = bpy.data.collections.new(f'{title} Can')
    bpy.context.scene.collection.children.link(col)

    alu = principled(f'{key}_aluminium', (0.80, 0.81, 0.83), metallic=1.0, roughness=0.22)
    alu_lid = principled(f'{key}_aluminium_lid', (0.74, 0.75, 0.77), metallic=1.0, roughness=0.32)
    tab_mat = principled(f'{key}_pull_tab', tab_tint, metallic=1.0, roughness=0.26)
    label_mat = principled(f'{key}_label', (1, 1, 1), metallic=0.12, roughness=0.28, coat=0.25, image=label_png)
    water = principled(f'{key}_condensation', (0.95, 0.97, 1.0), metallic=0.0, roughness=0.02, transmission=1.0, ior=1.33)

    parts = [
        lathe(f'{title}_Bottom', BOTTOM, col, alu, rings=1),
        lathe(f'{title}_Label', [(R, LABEL_Z0), (R, LABEL_Z1)], col, label_mat, uv=True, rings=8),
        lathe(f'{title}_Top', TOP, col, alu_lid, rings=1),
    ]
    # pull tab (rivet at the lid centre, nose over the opening, finger hole behind)
    tab = flat_shape(f'{title}_PullTab', [superellipse(0, -0.0045, 0.0086, 0.0118, 3.4),
                                          superellipse(0, -0.0092, 0.0056, 0.0040, 3.0)], 0.0005, col, tab_mat)
    tab.location = (0, 0, LID_Z + 0.0009)
    tab.rotation_euler = (math.radians(-3), 0, 0)
    rivet = flat_shape(f'{title}_Rivet', [superellipse(0, 0, 0.0017, 0.0017, 2.0, 32)], 0.0008, col, alu, bevel=0.0002)
    rivet.location = (0, 0, LID_Z + 0.0011)
    score = flat_shape(f'{title}_OpeningScore', [superellipse(0, 0.0118, 0.0082, 0.0074, 2.6),
                                                 superellipse(0, 0.0118, 0.0074, 0.0066, 2.6)], 0.00025, col, alu_lid)
    score.location = (0, 0, LID_Z + 0.0002)
    parts += [tab, rivet, score, droplets(f'{title}_Condensation', col, water)]

    # one root per can, origin at the can's centre, rotated so the main logo faces the viewer (-Y → +Z in glTF)
    root = bpy.data.objects.new(f'{title}_Can', None)
    root.empty_display_type = 'CUBE'
    root.empty_display_size = 0.04
    col.objects.link(root)
    for p in parts:
        p.parent = root
        p.location.z -= HEIGHT / 2
    return col, root


def export_glb(col, root, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = root
    kwargs = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                  export_image_format='JPEG', export_texcoords=True, export_normals=True, export_materials='EXPORT',
                  export_cameras=False, export_lights=False)
    try:
        bpy.ops.export_scene.gltf(**kwargs, export_jpeg_quality=90)
    except TypeError:
        bpy.ops.export_scene.gltf(**kwargs)


def render_preview(col_visible, all_cols, path):
    sc = bpy.context.scene
    for c in all_cols:
        c.hide_render = c is not col_visible
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def setup_studio():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 80
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 1000, 1250
    sc.render.image_settings.file_format = 'PNG'
    sc.view_settings.view_transform = 'Standard'   # keeps brand reds / blues saturated
    sc.view_settings.look = 'Medium High Contrast'
    world = bpy.data.worlds.new('Studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.006, 0.005, 0.005, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    sc.world = world

    studio = bpy.data.collections.new('Studio')
    sc.collection.children.link(studio)
    floor_mat = principled('studio_floor', (0.004, 0.003, 0.003), roughness=0.32)
    bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, -HEIGHT / 2))
    floor = bpy.context.active_object
    floor.data.materials.append(floor_mat)
    sc.collection.objects.unlink(floor)
    studio.objects.link(floor)

    def area(name, loc, energy, size, color, target=(0, 0, 0)):
        light = bpy.data.lights.new(name, 'AREA')
        light.energy, light.size, light.color = energy, size, color
        o = bpy.data.objects.new(name, light)
        o.location = loc
        d = Vector(target) - Vector(loc)
        o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        studio.objects.link(o)
    area('Key', (-0.35, -0.45, 0.25), 26, 0.45, (1.0, 0.93, 0.85))
    area('Fill', (0.45, -0.35, 0.05), 5, 0.6, (0.85, 0.9, 1.0))
    area('RimL', (-0.30, 0.35, 0.15), 30, 0.12, (1.0, 0.82, 0.6))
    area('RimR', (0.30, 0.35, 0.15), 30, 0.12, (0.75, 0.85, 1.0))
    area('Top', (0, 0, 0.45), 14, 0.35, (1, 1, 1))

    cam_data = bpy.data.cameras.new('Camera')
    cam_data.lens = 85
    cam = bpy.data.objects.new('Camera', cam_data)
    cam.location = (0, -0.42, 0.045)
    cam.rotation_euler = (Vector((0, 0, 0.002)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    studio.objects.link(cam)
    sc.camera = cam


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PREVIEWS, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    clean_scene()

    # key, Blender title, output file name, label painter, pull-tab tint
    cans = [
        ('coca', 'CocaCola', 'coca-cola', coca_label, (0.86, 0.84, 0.82)),
        ('pepsi', 'Pepsi', 'pepsi', pepsi_label, (0.78, 0.80, 0.86)),
        ('fanta', 'Fanta', 'fanta', fanta_label, (0.84, 0.80, 0.74)),
        ('sprite', 'Sprite', 'sprite', sprite_label, (0.78, 0.84, 0.80)),
    ]
    if ONLY:                                     # e.g. --only fanta,sprite  (keeps the other GLBs untouched)
        cans = [c for c in cans if c[2] in ONLY]

    built = []
    for key, title, name, painter, tab in cans:
        png = os.path.join(TMP, f'{name}-label.jpg')
        painter(png)
        col, root = build_can(key, title, png, tab)
        export_glb(col, root, os.path.join(OUT, f'{name}.glb'))
        print('exported', name, os.path.getsize(os.path.join(OUT, f'{name}.glb')))
        built.append((col, root, name))

    if RENDER:
        setup_studio()
        cols = [b[0] for b in built]
        for col, root, name in built:
            root.rotation_euler = (0, 0, math.radians(-8))
            png = os.path.join(PREVIEWS, f'{name}-preview.png')
            render_preview(col, cols, png)
            Image.open(png).convert('RGB').save(png.replace('.png', '.webp'), quality=86)
            print('rendered', png)


if __name__ == '__main__':
    main()
