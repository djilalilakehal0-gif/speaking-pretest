"""Build a GLB "photo panel": the photo, untouched, on the front of a thin panel.

The image bytes are embedded exactly as given (no resize, no re-encode). The photo
material is unlit (KHR_materials_unlit) so viewers show its true colours whatever
the lighting. Back and edges are plain black.

usage: python3 scripts/make_portrait_glb.py PHOTO.png OUT.glb
"""
import json, struct, sys
from PIL import Image

photo, out = sys.argv[1], sys.argv[2]
img_bytes = open(photo, 'rb').read()
iw, ih = Image.open(photo).size
mime = 'image/png' if img_bytes[:8] == b'\x89PNG\r\n\x1a\n' else 'image/jpeg'

W = 1.0                 # panel width in metres
H = W * ih / iw         # keeps the photo's exact aspect ratio
D = 0.02                # thickness
x, y, z = W / 2, H / 2, D / 2

# front face (+Z), textured
front_pos = [(-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
front_nrm = [(0, 0, 1)] * 4
front_uv = [(0, 1), (1, 1), (1, 0), (0, 0)]        # glTF UV origin is the top-left
front_idx = [0, 1, 2, 0, 2, 3]

# back + 4 edges, black
quads = [
    ([(x, -y, -z), (-x, -y, -z), (-x, y, -z), (x, y, -z)], (0, 0, -1)),   # back
    ([(x, -y, z), (x, -y, -z), (x, y, -z), (x, y, z)], (1, 0, 0)),         # right
    ([(-x, -y, -z), (-x, -y, z), (-x, y, z), (-x, y, -z)], (-1, 0, 0)),    # left
    ([(-x, y, z), (x, y, z), (x, y, -z), (-x, y, -z)], (0, 1, 0)),         # top
    ([(-x, -y, -z), (x, -y, -z), (x, -y, z), (-x, -y, z)], (0, -1, 0)),    # bottom
]
shell_pos, shell_nrm, shell_idx = [], [], []
for verts, n in quads:
    b = len(shell_pos)
    shell_pos += verts
    shell_nrm += [n] * 4
    shell_idx += [b, b + 1, b + 2, b, b + 2, b + 3]

buf = bytearray()
views, accessors = [], []

def pad4(data, fill=b'\x00'):
    while len(data) % 4:
        data += fill
    return data

def add_view(data, target=None):
    global buf
    buf = pad4(buf)
    v = {'buffer': 0, 'byteOffset': len(buf), 'byteLength': len(data)}
    if target:
        v['target'] = target
    buf += data
    views.append(v)
    return len(views) - 1

def add_floats(rows, typ):
    flat = [c for r in rows for c in r]
    view = add_view(struct.pack(f'<{len(flat)}f', *flat), 34962)
    a = {'bufferView': view, 'componentType': 5126, 'count': len(rows), 'type': typ}
    if typ == 'VEC3':
        a['min'] = [min(r[i] for r in rows) for i in range(3)]
        a['max'] = [max(r[i] for r in rows) for i in range(3)]
    accessors.append(a)
    return len(accessors) - 1

def add_indices(idx):
    view = add_view(struct.pack(f'<{len(idx)}H', *idx), 34963)
    accessors.append({'bufferView': view, 'componentType': 5123, 'count': len(idx), 'type': 'SCALAR'})
    return len(accessors) - 1

fp, fn, fu, fi = add_floats(front_pos, 'VEC3'), add_floats(front_nrm, 'VEC3'), add_floats(front_uv, 'VEC2'), add_indices(front_idx)
sp, sn, si = add_floats(shell_pos, 'VEC3'), add_floats(shell_nrm, 'VEC3'), add_indices(shell_idx)
img_view = add_view(img_bytes)

gltf = {
    'asset': {'version': '2.0', 'generator': 'make_portrait_glb.py'},
    'extensionsUsed': ['KHR_materials_unlit'],
    'scene': 0,
    'scenes': [{'nodes': [0]}],
    'nodes': [{'mesh': 0, 'name': 'Djilali portrait panel'}],
    'meshes': [{'name': 'portrait_panel', 'primitives': [
        {'attributes': {'POSITION': fp, 'NORMAL': fn, 'TEXCOORD_0': fu}, 'indices': fi, 'material': 0},
        {'attributes': {'POSITION': sp, 'NORMAL': sn}, 'indices': si, 'material': 1},
    ]}],
    'materials': [
        {'name': 'photo', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': 1},
         'extensions': {'KHR_materials_unlit': {}}},
        {'name': 'frame', 'pbrMetallicRoughness': {'baseColorFactor': [0.02, 0.02, 0.02, 1], 'metallicFactor': 0, 'roughnessFactor': 0.6}},
    ],
    'textures': [{'source': 0, 'sampler': 0}],
    'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
    'images': [{'bufferView': img_view, 'mimeType': mime, 'name': 'photo'}],
    'accessors': accessors,
    'bufferViews': views,
}
buf = pad4(buf)
gltf['buffers'] = [{'byteLength': len(buf)}]
js = pad4(bytearray(json.dumps(gltf, separators=(',', ':')).encode()), b' ')
total = 12 + 8 + len(js) + 8 + len(buf)
with open(out, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(buf), 0x004E4942)); f.write(buf)
print(f'{out}: {total} bytes, panel {W:.3f} x {H:.4f} x {D} m, photo {iw}x{ih} {mime} embedded unchanged')
