"""
Luxury 3D Kaftan Boutique — 3D character generator (Blender / bpy).

Builds one complete 3D fashion figure per distinct outfit, from scratch, and exports:
  public/models/kaftan-model-0N.glb        meshes + PBR materials (satin sheen) + embedded fabric normal map
  blender/kaftan-model-0N.blend             Blender source file (kept out of public/: not deployed)
  public/images/products/<id>-{front,three-quarter,back}.webp   Cycles studio renders (product photography)
  public/textures/satin-weave-normal.png   the tiling fabric normal map embedded in every GLB
  scripts/model-report.json                validation report (bounds, floor contact, triangle counts)

Every figure is a real closed 3D body (skin-modifier skeleton: torso, arms, hands with thumbs, legs,
feet, neck, head, hair) wearing a 3D garment made of revolved/swept surfaces with thickness. Front, side
and rear surfaces are all geometry: no image planes, cutouts or billboards.

Conventions (Blender Z-up, metres): origin at the centre between the feet on the floor (z = 0), figure
facing -Y. The glTF exporter converts this to Y-up facing +Z (towards a default three.js camera).

Run:
  python3 -m venv .venv && .venv/bin/pip install bpy pillow numpy
  .venv/bin/python scripts/generate_kaftans.py               # models + renders
  .venv/bin/python scripts/generate_kaftans.py --no-render   # models only (fast)
  .venv/bin/python scripts/generate_kaftans.py --only 01,04  # only these models
"""
import json
import math
import os
import sys

import bpy  # must come first: bmesh / mathutils are provided by bpy
import bmesh
import numpy as np
from mathutils import Vector
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_MODELS = os.path.join(ROOT, 'public', 'models')
OUT_BLEND = os.path.join(ROOT, 'blender')
OUT_IMAGES = os.path.join(ROOT, 'public', 'images', 'products')
OUT_TEX = os.path.join(ROOT, 'public', 'textures')
TMP = os.path.join(HERE, '.build')

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
RENDER = '--no-render' not in ARGS
ONLY = None
if '--only' in ARGS:
    ONLY = set(ARGS[ARGS.index('--only') + 1].split(','))

TAU = math.pi * 2


def srgb(hex_):
    """'#RRGGBB' -> linear RGBA tuple (Blender colours are linear)."""
    h = hex_.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


# --------------------------------------------------------------------------------------------------
# Outfits. One entry per *distinct* garment found in the reference captions (see REFERENCE-MAP.md).
# Colours follow the captions; anything the captions do not state is an assumption listed there.
# --------------------------------------------------------------------------------------------------
OUTFITS = [
    dict(id='01', slug='chocolate-kaftan', name='Chocolate Kaftan',
         color='#4A2618', sheen='#8A5A3C', rough=0.34,
         neckline='round', sleeves='bell', belt='gold', trim=('neck', 'cuff'),
         flare=1.0, hair='bun', cape=False),
    dict(id='02', slug='dark-satin-kaftan', name='Dark Satin Kaftan',
         color='#24160F', sheen='#6E5240', rough=0.22,
         neckline='v', sleeves='wide', belt='self', trim=(),
         flare=1.08, hair='long', cape=False),
    dict(id='03', slug='burgundy-kaftan', name='Burgundy Kaftan',
         color='#6B1626', sheen='#A8485A', rough=0.3,
         neckline='deep-v', sleeves='straight', belt='gold', trim=('neck', 'cuff', 'hem'),
         flare=0.95, hair='bun', cape=False),
    dict(id='04', slug='satin-cape-drape-kaftan', name='Satin Cape-Drape Kaftan',
         color='#C9AE86', sheen='#F2E2C4', rough=0.26,
         neckline='round', sleeves='fitted', belt='gold', trim=('neck',),
         flare=0.92, hair='long', cape=True),
    dict(id='05', slug='red-off-shoulder-kaftan', name='Red Off-Shoulder Kaftan',
         color='#A3161F', sheen='#E0505A', rough=0.28,
         neckline='off-shoulder', sleeves='flared-off', belt='inner', trim=(),
         flare=1.02, hair='bun', cape=False),
]


# --------------------------------------------------------------------------------------------------
# Scene helpers
# --------------------------------------------------------------------------------------------------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_object(name, verts, faces, uvs=None, mat_idx=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    if uvs is not None:
        uv = me.uv_layers.new(name='UVMap')
        k = 0
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uv.data[li].uv = uvs[vi]
                k += 1
    if mat_idx is not None:
        for poly, mi in zip(me.polygons, mat_idx):
            poly.material_index = mi
    me.validate()
    for p in me.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, me)
    return link(obj)


def orient_outward(obj, centre_fn):
    """Flip every face if, on average, normals point towards the axis instead of away from it."""
    me = obj.data
    score = 0.0
    for p in me.polygons:
        c = p.center
        score += p.normal.dot(c - centre_fn(c))
    if score < 0:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()


def apply_all_modifiers(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    bpy.data.meshes.remove(old)
    for p in me.polygons:
        p.use_smooth = True


def add_solidify(obj, thickness=0.004):
    m = obj.modifiers.new('solidify', 'SOLIDIFY')
    m.thickness = thickness
    m.offset = 1.0
    m.use_even_offset = False
    m.use_quality_normals = True
    m.material_offset_rim = 0


def join(objs, name):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    objs[0].data.name = name
    return objs[0]


# --------------------------------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------------------------------
_normal_img = None


def satin_normal_image():
    """Tiling satin/twill weave normal map, painted with numpy, saved once and embedded in each GLB."""
    global _normal_img
    if _normal_img is not None:
        return _normal_img
    os.makedirs(OUT_TEX, exist_ok=True)
    n = 512
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    # fine diagonal twill + very soft long waves (fabric slub), all periodic over the tile
    h = (0.55 * np.sin(TAU * 96 * (x + y))
         + 0.25 * np.sin(TAU * 192 * (x - 0.5 * y))
         + 0.35 * np.sin(TAU * 3 * x + 1.3) * np.sin(TAU * 2 * y))
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1)
    gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    s = 0.06
    nx, ny, nz = -gx * s, -gy * s, np.ones_like(h)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    rgb = np.stack([nx / ln, ny / ln, nz / ln], -1) * 0.5 + 0.5
    path = os.path.join(OUT_TEX, 'satin-weave-normal.png')
    Image.fromarray((rgb * 255).astype(np.uint8)).save(path, optimize=True)
    _normal_img = path
    return path


def principled(name, base, rough=0.5, metal=0.0, sheen=None, sheen_w=0.0, spec=0.5,
               normal_tex=False, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = base
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Specular IOR Level'].default_value = spec
    if sheen is not None:
        bsdf.inputs['Sheen Weight'].default_value = sheen_w
        bsdf.inputs['Sheen Tint'].default_value = sheen
        bsdf.inputs['Sheen Roughness'].default_value = 0.35
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.25
    if normal_tex:
        img = bpy.data.images.load(satin_normal_image(), check_existing=True)
        img.colorspace_settings.name = 'Non-Color'
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = img
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = 0.35
        nt.links.new(tex.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def outfit_materials(o):
    fabric = principled(f'{o["slug"]}-satin', srgb(o['color']), rough=o['rough'],
                        sheen=srgb(o['sheen']), sheen_w=0.35, spec=0.55, normal_tex=True)
    gold = principled('brushed-gold', srgb('#C9A15A'), rough=0.32, metal=1.0)
    if o['belt'] == 'self':
        belt = principled(f'{o["slug"]}-belt', srgb('#160D09'), rough=0.2,
                          sheen=srgb(o['sheen']), sheen_w=0.5, spec=0.7, normal_tex=True)
    else:
        belt = gold
    return fabric, gold, belt


# --------------------------------------------------------------------------------------------------
# Body (skin modifier skeleton) — shared anatomy, small per-model pose variation
# --------------------------------------------------------------------------------------------------
def build_body(skin_mat, variant):
    lean = 0.012 if variant % 2 else -0.012     # contrapposto: which knee relaxes
    abd = 0.0 if variant != 1 else 0.02          # wide sleeves need a little more arm clearance
    V = []
    R = []
    E = []

    def v(p, r, parent=None):
        V.append(p)
        R.append(r)
        i = len(V) - 1
        if parent is not None:
            E.append((parent, i))
        return i

    pelvis = v((0, 0, 0.96), (0.15, 0.11))
    waist = v((0, 0, 1.07), (0.112, 0.085), pelvis)
    chest = v((0, 0, 1.24), (0.135, 0.095), waist)
    upper = v((0, 0.004, 1.34), (0.125, 0.08), chest)
    neck0 = v((0, 0.012, 1.42), (0.048, 0.048), upper)
    v((0, 0.018, 1.53), (0.043, 0.043), neck0)
    for s in (-1, 1):
        sh = v((s * 0.162, 0.008, 1.372), (0.045, 0.045), upper)
        el = v((s * (0.235 + abd), 0.015, 1.125), (0.034, 0.034), sh)
        wr = v((s * (0.262 + abd * 1.5), -0.035, 0.885), (0.024, 0.02), el)
        hd = v((s * (0.27 + abd * 1.5), -0.05, 0.825), (0.03, 0.013), wr)
        v((s * (0.272 + abd * 1.5), -0.06, 0.765), (0.022, 0.01), hd)        # fingers (mitten)
        v((s * (0.255 + abd * 1.5), -0.075, 0.835), (0.009, 0.009), wr)      # thumb
        knee_fwd = lean * s
        hip = v((s * 0.085, 0, 0.9), (0.075, 0.075), pelvis)
        kn = v((s * 0.088, -0.02 - knee_fwd * 2, 0.5), (0.048, 0.05), hip)
        an = v((s * 0.095, 0.005, 0.085), (0.03, 0.03), kn)
        v((s * 0.096, 0.035, 0.04), (0.03, 0.03), an)                        # heel
        ball = v((s * 0.1, -0.09, 0.03), (0.034, 0.024), an)
        v((s * 0.102, -0.145, 0.025), (0.026, 0.018), ball)                  # toes

    me = bpy.data.meshes.new('body-skel')
    me.from_pydata(V, E, [])
    obj = link(bpy.data.objects.new('Body', me))
    skin = obj.modifiers.new('skin', 'SKIN')
    skin.use_smooth_shade = True
    sv = me.skin_vertices[0].data
    for i, r in enumerate(R):
        sv[i].radius = r
    sv[0].use_root = True
    sub = obj.modifiers.new('sub', 'SUBSURF')
    sub.levels = 2
    sub.render_levels = 2
    apply_all_modifiers(obj)

    # bust (covered by the garment, gives it the right volume)
    parts = [obj]
    for s in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.058,
                                             location=(s * 0.058, -0.06, 1.265))
        b = bpy.context.active_object
        b.scale = (1, 0.9, 0.95)
        parts.append(b)

    # head: egg with tapered jaw, chin, nose, ears
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=28, radius=1, location=(0, 0, 0))
    head = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(head.data)
    for vert in bm.verts:
        x, y, z = vert.co
        taper = 1 - 0.32 * max(0.0, -z) ** 1.4
        fwd = 0.08 * max(0.0, -z) * (1 if y < 0 else 0)
        vert.co = Vector((x * 0.074 * taper, y * 0.092 * (0.94 + 0.06 * taper) - fwd * 0.09, z * 0.108))
    bm.to_mesh(head.data)
    bm.free()
    head.location = (0, 0.006, 1.615)
    head.rotation_euler = (math.radians(-6), 0, 0)
    parts.append(head)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.012,
                                         location=(0, -0.088, 1.6))
    nose = bpy.context.active_object
    nose.scale = (0.9, 1.1, 1.9)
    parts.append(nose)
    for s in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.017,
                                             location=(s * 0.072, 0.005, 1.605))
        ear = bpy.context.active_object
        ear.scale = (0.45, 0.9, 1.5)
        parts.append(ear)
    for p in parts[1:]:
        apply_transform(p)
    body = join(parts, 'Body')
    body.data.materials.append(skin_mat)
    # lips + closed-eye lash lines + brows (separate material slots on the body mesh)
    feats = []
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1, location=(0, -0.083, 1.555))
    lips = bpy.context.active_object
    lips.scale = (0.015, 0.0065, 0.005)
    feats.append((lips, 1))
    for s in (-1, 1):
        lash = sweep('Lash', resample([(s * 0.013, -0.086, 1.623), (s * 0.026, -0.082, 1.626),
                                        (s * 0.04, -0.073, 1.623)], 8), [(0.0012, 0.0012)] * 8, seg=8)
        feats.append((lash, 2))
        brow = sweep('Brow', resample([(s * 0.011, -0.083, 1.646), (s * 0.028, -0.078, 1.652),
                                        (s * 0.046, -0.065, 1.646)], 8), [(0.0016, 0.0011)] * 8, seg=8)
        feats.append((brow, 2))
    lip_m = principled('lips', srgb('#A8695C'), rough=0.42, spec=0.5)
    lash_m = principled('lashes', srgb('#3A241A'), rough=0.6)
    for f, mi in feats:
        apply_transform(f)
        f.data.materials.append(lip_m if mi == 1 else lash_m)
    body = join([body] + [f for f, _ in feats], 'Body')
    for p in body.data.polygons:
        p.use_smooth = True
    return body


def apply_transform(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def build_hair(style, hair_mat):
    parts = []
    # skull cap: sphere slightly larger than the head, opened at the face
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=28, radius=1, location=(0, 0, 0))
    cap = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(cap.data)
    kill = [f for f in bm.faces if f.calc_center_median().y < -0.25 and f.calc_center_median().z < 0.55]
    kill += [f for f in bm.faces if f.calc_center_median().z < -0.35 and f.calc_center_median().y < 0.45]
    bmesh.ops.delete(bm, geom=list(set(kill)), context='FACES')
    for vert in bm.verts:
        x, y, z = vert.co
        vert.co = Vector((x * 0.082, y * 0.1, z * 0.116))
    bm.to_mesh(cap.data)
    bm.free()
    cap.location = (0, 0.012, 1.622)
    cap.rotation_euler = (math.radians(-6), 0, 0)
    add_solidify(cap, 0.006)
    apply_transform(cap)
    apply_all_modifiers(cap)
    parts.append(cap)
    if style == 'bun':
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.05,
                                              location=(0, 0.112, 1.575))
        bun = bpy.context.active_object
        bun.scale = (1.15, 0.85, 0.95)
        apply_transform(bun)
        parts.append(bun)
    else:
        # long hair falling down the back: swept surface behind neck and shoulders
        rings = []
        uvs = []
        zs = np.linspace(1.6, 1.18, 14)
        n = 33
        for j, z in enumerate(zs):
            t = j / (len(zs) - 1)
            row = []
            for i in range(n):
                a = math.pi * (0.08 + 0.84 * i / (n - 1))       # back half only
                w = 0.085 + 0.04 * t
                d = 0.095 + 0.02 * math.sin(t * math.pi) + 0.012 * t
                x = math.cos(a) * w
                y = 0.02 + math.sin(a) * d + 0.03 * t
                wave = 0.004 * math.sin(i * 1.7 + j * 0.9)
                row.append((x * (1 + wave * 10), y + wave, z))
                uvs.append((i / (n - 1), t))
            rings.append(row)
        verts = [p for r in rings for p in r]
        faces = []
        for j in range(len(rings) - 1):
            for i in range(n - 1):
                a = j * n + i
                faces.append((a, a + 1, a + n + 1, a + n))
        h = mesh_object('HairLong', verts, faces, uvs)
        orient_outward(h, lambda c: Vector((0, 0.02, c.z)))
        add_solidify(h, 0.012)
        apply_all_modifiers(h)
        parts.append(h)
    hair = join(parts, 'Hair')
    hair.data.materials.append(hair_mat)
    return hair


def build_sandals(gold):
    parts = []
    for s in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=1, depth=0.012,
                                            location=(s * 0.098, -0.05, 0.006))
        sole = bpy.context.active_object
        sole.scale = (0.042, 0.125, 1)
        apply_transform(sole)
        parts.append(sole)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.034, minor_radius=0.005,
                                         location=(s * 0.1, -0.09, 0.036))
        strap = bpy.context.active_object
        strap.scale = (1, 0.55, 1)
        strap.rotation_euler = (0, math.radians(90 * 0), 0)
        apply_transform(strap)
        parts.append(strap)
    sandals = join(parts, 'Sandals')
    sandals.data.materials.append(gold)
    for p in sandals.data.polygons:
        p.use_smooth = True
    return sandals


# --------------------------------------------------------------------------------------------------
# Garment pieces
# --------------------------------------------------------------------------------------------------
def ellipse_point(theta, rx, ryf, ryb):
    """theta = 0 at +X, pi/2 at the front (-Y), 3pi/2 at the back (+Y)."""
    s = math.sin(theta)
    ry = ryf if s > 0 else ryb
    return math.cos(theta) * rx, -s * ry


def lathe(name, profile, seg=128, folds=None, theta_range=None, top_z_fn=None, mat_fn=None,
          uv_repeat=6, clamp_fn=None, face_fn=None):
    """Revolve a profile [(z, rx, ryf, ryb), ...] (bottom -> top). Optional partial range (cape)."""
    closed = theta_range is None
    cols = seg if closed else seg + 1
    verts, uvs, rows_z = [], [], []
    nrows = len(profile)
    for j, (z, rx, ryf, ryb) in enumerate(profile):
        for i in range(cols):
            if closed:
                th = TAU * i / seg
            else:
                a0, a1 = theta_range(z)
                th = a0 + (a1 - a0) * i / seg
            amp = folds(z, th) if folds else 0.0
            x, y = ellipse_point(th, rx * (1 + amp), ryf * (1 + amp), ryb * (1 + amp))
            zz = z
            if j == nrows - 1 and top_z_fn:
                zz = top_z_fn(th, z)
            if clamp_fn:
                zz = clamp_fn(x, y, zz)
            verts.append((x, y, zz))
            uvs.append((uv_repeat * i / seg, zz * 2.0))
    faces, mats = [], []
    for j in range(nrows - 1):
        for i in range(cols if closed else cols - 1):
            a = j * cols + i
            b = j * cols + (i + 1) % cols
            faces.append((a, b, b + cols, a + cols))
            zc = (profile[j][0] + profile[j + 1][0]) / 2
            m = mat_fn(j, zc) if mat_fn else 0
            if face_fn:
                quad = [verts[k] for k in (a, b, b + cols, a + cols)]
                c = tuple(sum(q[k] for q in quad) / 4 for k in range(3))
                fm = face_fn(c, j)
                if fm is not None:
                    m = fm
            mats.append(m)
    obj = mesh_object(name, verts, faces, uvs, mats)
    orient_outward(obj, lambda c: Vector((0, 0, c.z)))
    return obj


def sweep(name, path, radii, seg=48, folds=0.0, mat_fn=None, uv_repeat=3):
    """Elliptical tube along a polyline. radii = [(lateral, front-back), ...] per path point."""
    pts = [Vector(p) for p in path]
    verts, uvs = [], []
    n = len(pts)
    for j, p in enumerate(pts):
        t = (pts[min(j + 1, n - 1)] - pts[max(j - 1, 0)]).normalized()
        ref = Vector((0, -1, 0))
        side = t.cross(ref).normalized()
        fwd = side.cross(t).normalized()
        rl, rf = radii[j]
        for i in range(seg):
            a = TAU * i / seg
            f = 1 + folds * (j / (n - 1)) * math.sin(7 * a + j * 0.6)
            q = p + side * (math.cos(a) * rl * f) + fwd * (math.sin(a) * rf * f)
            verts.append(tuple(q))
            uvs.append((uv_repeat * i / seg, j / (n - 1)))
    faces, mats = [], []
    for j in range(n - 1):
        for i in range(seg):
            a = j * seg + i
            b = j * seg + (i + 1) % seg
            faces.append((a, b, b + seg, a + seg))
            mats.append(mat_fn(j, n - 1) if mat_fn else 0)
    obj = mesh_object(name, verts, faces, uvs, mats)
    centres = pts

    def nearest(c):
        return min(centres, key=lambda q: (q - c).length)
    orient_outward(obj, nearest)
    return obj


def resample(points, count):
    """Smooth polyline through control points (Catmull-Rom), `count` samples."""
    P = [Vector(p) for p in points]
    out = []
    segs = len(P) - 1
    for k in range(count):
        u = k / (count - 1) * segs
        i = min(int(u), segs - 1)
        t = u - i
        p0 = P[max(i - 1, 0)]
        p1, p2 = P[i], P[i + 1]
        p3 = P[min(i + 2, segs)]
        t2, t3 = t * t, t * t * t
        q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                   + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
        out.append(tuple(q))
    return out


def lerp_radii(keys, count):
    out = []
    for k in range(count):
        u = k / (count - 1) * (len(keys) - 1)
        i = min(int(u), len(keys) - 2)
        t = u - i
        a, b = keys[i], keys[i + 1]
        out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def build_garment(o, fabric, gold, belt_mat):
    """Returns list of garment objects (materials slot 0 = fabric, 1 = gold trim, 2 = belt)."""
    fl = o['flare']
    trim = o['trim']
    off = o['neckline'] == 'off-shoulder'
    belt_lo, belt_hi = (1.035, 1.085) if o['belt'] in ('gold', 'self') else (1.05, 1.07)

    prof = [
        (0.035, 0.37 * fl, 0.34 * fl, 0.37 * fl),
        (0.12, 0.355 * fl, 0.325 * fl, 0.355 * fl),
        (0.3, 0.315 * fl, 0.285 * fl, 0.31 * fl),
        (0.5, 0.275 * fl, 0.245 * fl, 0.265 * fl),
        (0.7, 0.238, 0.21, 0.225),
        (0.88, 0.205, 0.175, 0.185),
        (0.98, 0.182, 0.148, 0.158),
        (belt_lo, 0.158, 0.126, 0.13),
        ((belt_lo + belt_hi) / 2, 0.148, 0.118, 0.122),
        (belt_hi, 0.152, 0.124, 0.125),
        (1.16, 0.16, 0.15, 0.12),
        (1.25, 0.168, 0.165, 0.117),
        (1.31, 0.18, 0.15, 0.11),
    ]
    if off:
        prof[-1] = (1.31, 0.19, 0.15, 0.11)
        prof += [(1.34, 0.21, 0.142, 0.106), (1.36, 0.218, 0.135, 0.104)]
        top_fn = lambda th, z: z + 0.012 * math.cos(2 * th)  # noqa: E731
    else:
        prof += [(1.355, 0.2, 0.128, 0.108), (1.39, 0.218, 0.108, 0.098),
                 (1.418, 0.2, 0.094, 0.09), (1.437, 0.13, 0.078, 0.074),
                 (1.447, 0.074, 0.068, 0.064)]
        top_fn = None

    def folds(z, th):
        k = max(0.0, (1.0 - z) / 1.0) ** 1.6       # folds grow towards the hem
        return k * (0.045 * math.sin(9 * th + 0.7) + 0.02 * math.sin(17 * th + 2.1))

    # densify the profile vertically for smooth silhouettes
    dense = []
    for (a, b) in zip(prof[:-1], prof[1:]):
        step = 0.012 if a[0] >= 1.15 else 0.03
        steps = max(1, int(round((b[0] - a[0]) / step)))
        for s in range(steps):
            t = s / steps
            dense.append(tuple(a[k] + (b[k] - a[k]) * t for k in range(4)))
    dense.append(prof[-1])
    n_rows = len(dense)

    def mat_fn_dense(j, zc):
        if 'hem' in trim and zc < 0.1:
            return 1
        if belt_lo - 0.001 <= zc <= belt_hi + 0.001 and o['belt'] in ('gold', 'self'):
            return 2
        if 'neck' in trim and not off and j == n_rows - 2:
            return 1
        return 0

    # Neckline opening: every front vertex above the neckline curve is pulled down onto it, so the
    # opening edge follows the curve exactly (round scoop, V or deep V) and the chest shows through.
    z_top = dense[-1][0]
    halfw, depth, shape = {'round': (0.085, 0.035, 'round'), 'v': (0.078, 0.13, 'v'),
                           'deep-v': (0.085, 0.2, 'v'), 'off-shoulder': (0, 0, None)}[o['neckline']]

    def neck_z(x):
        t = min(1.0, abs(x) / halfw)
        if shape == 'round':
            return z_top - depth * math.sqrt(max(0.0, 1 - t * t))
        return z_top - depth * (1 - t)

    def clamp(x, y, z):
        if shape and y < 0 and abs(x) < halfw:
            return min(z, neck_z(x))
        return z

    def face_fn(c, j):
        if 'neck' not in trim or not shape:
            return None
        x, y, z = c
        if j >= n_rows - 3:
            return 1                                        # band round the back of the neck
        return None

    body = lathe('Kaftan', dense, folds=folds, top_z_fn=top_fn, mat_fn=mat_fn_dense,
                 clamp_fn=clamp, face_fn=face_fn)
    pieces = [body]

    if shape and 'neck' in trim:
        # gold piping that follows the front opening exactly (a flat cord on the garment surface)
        zs = [r[0] for r in dense]

        def ring_at(z):
            for k in range(len(dense) - 1):
                if zs[k] <= z <= zs[k + 1]:
                    t = (z - zs[k]) / max(1e-6, zs[k + 1] - zs[k])
                    return [dense[k][m] + (dense[k + 1][m] - dense[k][m]) * t for m in range(4)]
            return list(dense[-1])
        pts = []
        n = 41
        for k in range(n):
            x = -halfw + 2 * halfw * k / (n - 1)
            z = neck_z(x)
            _, rx, ryf, _ = ring_at(z)
            yy = -ryf * math.sqrt(max(0.0, 1 - min(0.999, (x / rx) ** 2))) - 0.004
            pts.append((x, yy, z))
        pieces.append(sweep('NeckPiping', pts, [(0.005, 0.0025)] * n, seg=10, mat_fn=lambda j, l: 1))

    # sleeves ---------------------------------------------------------------------------------
    abd = 0.02 if o['sleeves'] == 'wide' else 0.0
    for s in (-1, 1):
        sh = (s * 0.152, 0.008, 1.36)
        el = (s * (0.235 + abd), 0.015, 1.125)
        wr = (s * (0.262 + abd * 1.5), -0.035, 0.885)
        end = (s * (0.268 + abd * 1.5), -0.05, 0.845)
        kind = o['sleeves']
        if kind == 'flared-off':
            start = tuple(sh[k] + (el[k] - sh[k]) * 0.3 for k in range(3))
            path = resample([start, el, wr, end], 16)
            radii = lerp_radii([(0.058, 0.062), (0.06, 0.07), (0.09, 0.13), (0.1, 0.15)], 16)
        else:
            path = resample([sh, el, wr, end], 18)
            keys = {
                'bell': [(0.06, 0.062), (0.062, 0.07), (0.08, 0.12), (0.095, 0.145)],
                'wide': [(0.07, 0.072), (0.095, 0.13), (0.1, 0.17), (0.105, 0.18)],
                'straight': [(0.058, 0.06), (0.054, 0.056), (0.056, 0.06), (0.062, 0.068)],
                'fitted': [(0.056, 0.058), (0.048, 0.05), (0.04, 0.042), (0.042, 0.044)],
            }[kind]
            radii = lerp_radii(keys, 18)
        cuff = 'cuff' in trim

        def sl_mat(j, last, cuff=cuff):
            return 1 if cuff and j >= last - 2 else 0
        sleeve = sweep('Sleeve', path, radii,
                       folds=0.05 if kind in ('bell', 'wide', 'flared-off') else 0.0,
                       mat_fn=sl_mat)
        pieces.append(sleeve)

    # off-shoulder finishing ruffle + halter neck strap ------------------------------------------
    if off:
        ring = []
        for i in range(97):
            th = TAU * i / 96
            x, y = ellipse_point(th, 0.222, 0.139, 0.108)
            ring.append((x, y, 1.36 + 0.012 * math.cos(2 * th)))
        ruffle = sweep('Ruffle', ring, [(0.006, 0.009)] * len(ring), seg=12)
        pieces.append(ruffle)
        strap_ring = []
        for i in range(65):
            th = TAU * i / 64
            strap_ring.append((math.cos(th) * 0.058, 0.012 - math.sin(th) * 0.058, 1.452 - 0.012 * math.sin(th)))
        pieces.append(sweep('NeckStrap', strap_ring, [(0.006, 0.006)] * len(strap_ring), seg=12))
        front = resample([(0, -0.052, 1.44), (0, -0.095, 1.40), (0, -0.14, 1.365)], 10)
        pieces.append(sweep('NeckStrapDrop', front, [(0.009, 0.004)] * 10, seg=12))

    # inner belt (thin cord) or gold buckle ---------------------------------------------------------
    if o['belt'] == 'inner':
        ring = []
        for i in range(97):
            th = TAU * i / 96
            x, y = ellipse_point(th, 0.152, 0.123, 0.127)
            ring.append((x, y, 1.06))
        pieces.append(sweep('InnerBelt', ring, [(0.006, 0.006)] * len(ring), seg=12, mat_fn=lambda j, l: 1))
    if o['belt'] == 'gold':
        bpy.ops.mesh.primitive_torus_add(major_radius=0.022, minor_radius=0.006,
                                         location=(0, -0.124, 1.06), rotation=(math.pi / 2, 0, 0))
        buckle = bpy.context.active_object
        apply_transform(buckle)
        for p in buckle.data.polygons:
            p.material_index = 1
        pieces.append(buckle)

    # cape overlay ------------------------------------------------------------------------------
    if o['cape']:
        cape_prof = [
            (0.06, 0.45, 0.42, 0.44),
            (0.3, 0.43, 0.38, 0.41),
            (0.55, 0.41, 0.34, 0.36),
            (0.8, 0.39, 0.29, 0.31),
            (1.0, 0.37, 0.24, 0.26),
            (1.15, 0.34, 0.2, 0.21),
            (1.28, 0.3, 0.16, 0.16),
            (1.36, 0.265, 0.13, 0.13),
            (1.415, 0.235, 0.112, 0.112),
        ]
        dense_c = []
        for (a, b) in zip(cape_prof[:-1], cape_prof[1:]):
            steps = max(1, int(round((b[0] - a[0]) / 0.04)))
            for s_ in range(steps):
                t = s_ / steps
                dense_c.append(tuple(a[k] + (b[k] - a[k]) * t for k in range(4)))
        dense_c.append(cape_prof[-1])

        def cape_range(z):
            half = math.radians(28 + 30 * (1.415 - z) / 1.36)   # front opening widens downwards
            return (math.pi / 2 + half, math.pi / 2 + TAU - half)

        def cape_folds(z, th):
            k = (1.42 - z) / 1.4
            return k * (0.05 * math.sin(7 * th) + 0.02 * math.sin(13 * th + 1))
        cape = lathe('Cape', dense_c, seg=120, folds=cape_folds, theta_range=cape_range)
        pieces.append(cape)

    for p in pieces:
        p.data.materials.append(fabric)
        p.data.materials.append(gold)
        p.data.materials.append(belt_mat)
        add_solidify(p, 0.004)
        apply_all_modifiers(p)
    garment = join(pieces, 'Kaftan')
    return garment


# --------------------------------------------------------------------------------------------------
# Build, validate, export
# --------------------------------------------------------------------------------------------------
def tri_count(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


def world_bounds(objs):
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            mn = Vector(map(min, mn, w))
            mx = Vector(map(max, mx, w))
    return mn, mx


def build_model(o, index):
    reset_scene()
    skin = principled('skin', srgb('#C99A7E'), rough=0.48, spec=0.4, sheen=srgb('#F0C8B0'), sheen_w=0.15)
    hair_m = principled('hair', srgb('#2B1A12'), rough=0.38, spec=0.6, sheen=srgb('#7A5A44'), sheen_w=0.4)
    fabric, gold, belt = outfit_materials(o)

    body = build_body(skin, index)
    hair = build_hair(o['hair'], hair_m)
    garment = build_garment(o, fabric, gold, belt)
    sandals = build_sandals(gold)
    # floor contact: sit the body on the sandal soles
    mn, _ = world_bounds([body, hair, garment])
    lift = 0.011 - mn.z
    for ob in (body, hair, garment):
        ob.location.z += lift
        apply_transform(ob)

    root = bpy.data.objects.new(f'kaftan-model-{o["id"]}', None)
    link(root)
    for ob in (body, hair, garment, sandals):
        ob.parent = root
    root['product_id'] = o['slug']
    root['product_name'] = o['name']

    parts = [body, hair, garment, sandals]
    mn, mx = world_bounds(parts)
    report = dict(
        id=o['id'], slug=o['slug'],
        triangles={p.name: tri_count(p) for p in parts},
        triangles_total=sum(tri_count(p) for p in parts),
        bounds_min=[round(c, 4) for c in mn], bounds_max=[round(c, 4) for c in mx],
        height_m=round(mx.z - mn.z, 3),
        floor_contact=abs(mn.z) < 0.002,
        centred=abs((mn.x + mx.x) / 2) < 0.02,
        materials=sorted({m.name for p in parts for m in p.data.materials}),
    )
    return root, parts, report


def export(o, root, parts):
    os.makedirs(OUT_MODELS, exist_ok=True)
    os.makedirs(OUT_BLEND, exist_ok=True)
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    root.select_set(True)
    for p in parts:
        p.select_set(True)
    path = os.path.join(OUT_MODELS, f'kaftan-model-{o["id"]}.glb')
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_yup=True, export_extras=True, export_cameras=False, export_lights=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12, export_image_format='AUTO')
    bpy.context.preferences.filepaths.save_version = 0   # no .blend1 backups
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_BLEND, f'kaftan-model-{o["id"]}.blend'),
                                compress=True)
    return path


def render_previews(o):
    """Studio product photography with Cycles: front, three-quarter and back views."""
    os.makedirs(OUT_IMAGES, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 48
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 900
    sc.render.resolution_y = 1200
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = -0.3

    world = bpy.data.worlds.new('studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = srgb('#3A2A20')
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    sc.world = world

    # boutique backdrop: warm floor + wall cyclorama
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(principled('floor', srgb('#D9C6A8'), rough=0.28, spec=0.5))
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 2.2, 3), rotation=(math.pi / 2, 0, 0))
    wall = bpy.context.active_object
    wall.data.materials.append(principled('wall', srgb('#5A4032'), rough=0.85))

    def light(name, loc, energy, size, color='#FFE6C8'):
        ld = bpy.data.lights.new(name, 'AREA')
        ld.energy = energy
        ld.size = size
        ld.color = srgb(color)[:3]
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        link(lo)
        d = Vector((0, 0, 1.0)) - Vector(loc)
        lo.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        return lo
    light('key', (-1.6, -2.4, 2.6), 300, 1.6)
    light('fill', (2.2, -1.8, 1.4), 90, 2.2, '#FFF1E0')
    light('rim', (0.6, 2.0, 2.6), 240, 1.2, '#FFD9A8')

    cam_d = bpy.data.cameras.new('cam')
    cam_d.lens = 70
    cam = link(bpy.data.objects.new('cam', cam_d))
    sc.camera = cam
    root = next(ob for ob in sc.objects if ob.name.startswith('kaftan-model-'))
    views = {'front': 0, 'three-quarter': -38, 'back': 180}
    for view, deg in views.items():
        root.rotation_euler = (0, 0, math.radians(deg))
        cam.location = (0, -4.6, 1.0)
        target = Vector((0, 0, 0.88))
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
        png = os.path.join(TMP, f'{o["slug"]}-{view}.png')
        sc.render.filepath = png
        bpy.ops.render.render(write_still=True)
        Image.open(png).convert('RGB').save(
            os.path.join(OUT_IMAGES, f'{o["slug"]}-{view}.webp'), 'WEBP', quality=82, method=6)


def main():
    report_path = os.path.join(HERE, 'model-report.json')
    reports = {}
    if os.path.exists(report_path):
        reports = {r['id']: r for r in json.load(open(report_path))}
    for idx, o in enumerate(OUTFITS):
        if ONLY and o['id'] not in ONLY:
            continue
        root, parts, rep = build_model(o, idx)
        glb = export(o, root, parts)
        rep['glb_bytes'] = os.path.getsize(glb)
        reports[o['id']] = rep
        print(json.dumps(rep, indent=1))
        if RENDER:
            render_previews(o)
    json.dump([reports[k] for k in sorted(reports)], open(report_path, 'w'), indent=2)


if __name__ == '__main__':
    main()
