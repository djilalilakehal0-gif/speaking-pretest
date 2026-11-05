"""
NAPOLITIME — 3D beverage can generator (Blender / bpy).

Builds two real 3D 33 cl cans from scratch — Coca-Cola (red) and Pepsi (blue) — and exports:
  public/models/coca-cola.glb, public/models/pepsi.glb          (meshes + PBR materials + embedded textures)
  public/models/previews/coca-cola-preview.png / pepsi-preview.png   (Cycles studio renders)
  public/models/previews/*.webp                                       (same renders, light, for the website fallback)

Geometry (metres, Blender Z-up; glTF export converts to Y-up):
  * aluminium bottom: stand ring + recessed dome, revolved from a real can profile
  * label body: smooth cylinder with a cylindrical UV map (u = angle, v = height)
  * aluminium shoulder, neck, rolled lip, countersunk lid
  * pull tab (with finger hole), rivet, embossed opening score
  * condensation: a few hundred flattened droplets merged into one mesh
Labels are painted here with Pillow at 2048 px (fonts in scripts/assets/fonts, OFL licensed).

Run (Blender 4.2+/5.x as a Python module, or inside Blender):
  python3 -m venv .venv && .venv/bin/pip install bpy pillow numpy
  .venv/bin/python scripts/generate_beverages.py            # models + previews
  .venv/bin/python scripts/generate_beverages.py --no-render  # models only (fast)
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

    coca_png, pepsi_png = os.path.join(TMP, 'coca-cola-label.jpg'), os.path.join(TMP, 'pepsi-label.jpg')
    coca_label(coca_png)
    pepsi_label(pepsi_png)

    coca_col, coca_root = build_can('coca', 'CocaCola', coca_png, (0.86, 0.84, 0.82))
    pepsi_col, pepsi_root = build_can('pepsi', 'Pepsi', pepsi_png, (0.78, 0.80, 0.86))

    export_glb(coca_col, coca_root, os.path.join(OUT, 'coca-cola.glb'))
    export_glb(pepsi_col, pepsi_root, os.path.join(OUT, 'pepsi.glb'))
    print('exported', [os.path.getsize(os.path.join(OUT, f)) for f in ('coca-cola.glb', 'pepsi.glb')])

    if RENDER:
        setup_studio()
        for root in (coca_root, pepsi_root):
            root.rotation_euler = (0, 0, math.radians(-8))
        for col, name in ((coca_col, 'coca-cola'), (pepsi_col, 'pepsi')):
            png = os.path.join(PREVIEWS, f'{name}-preview.png')
            render_preview(col, [coca_col, pepsi_col], png)
            Image.open(png).convert('RGB').save(png.replace('.png', '.webp'), quality=86)
            print('rendered', png)


if __name__ == '__main__':
    main()
