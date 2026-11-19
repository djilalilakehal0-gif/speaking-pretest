"""Generate the detailed 3D building model (OBJ/MTL + boxes JSON).

Dimensions are in the same SVG units as building_geometric.svg (y points down);
they are converted to scene units (1 unit = 100 svg px, y up) on output.

Usage: python3 build_building_3d.py <out_dir>
Writes building_3d.obj, building_3d.mtl and boxes.json into <out_dir>.
"""
import json
import sys

S = 100.0
boxes = []


def box(name, x, ytop, w, h, z0, z1, c):
    boxes.append((name, (x - 320) / S, (x + w - 320) / S,
                  (620 - ytop - h) / S, (620 - ytop) / S, z0 / S, z1 / S, c))


C = dict(wall='#eceff1', roof='#cfd8dc', slab='#b0bec5', base='#90a4ae',
         door='#78909c', rail='#f9a825', railcap='#e69500', frame='#f5f5f5',
         glass='#6f9bb5', sill='#cfd8dc', knob='#263238')

# ground, roof, walls
box('base', 60, 566, 520, 30, -30, 320, C['base'])
box('roof', 110, 90, 420, 26, -10, 210, C['roof'])
box('roof_parapet', 110, 82, 420, 8, -10, 210, C['slab'])


def window(n, x, y, w=45, h=80):
    f = 4                       # frame thickness
    zf = 206                    # frame front
    # glass (slightly recessed behind the frame)
    box(n + '_glass', x, y, w, h, 200, 202, C['glass'])
    # outer frame
    box(n + '_fT', x - f, y - f, w + 2 * f, f, 200, zf, C['frame'])
    box(n + '_fB', x - f, y + h, w + 2 * f, f, 200, zf, C['frame'])
    box(n + '_fL', x - f, y, f, h, 200, zf, C['frame'])
    box(n + '_fR', x + w, y, f, h, 200, zf, C['frame'])
    # mullions: one vertical, one horizontal (4 panes)
    box(n + '_mV', x + w / 2 - 1.5, y, 3, h, 202, 205, C['frame'])
    box(n + '_mH', x, y + h * 0.4 - 1.5, w, 3, 202, 205, C['frame'])
    # lintel above and projecting sill below
    box(n + '_lintel', x - f - 4, y - f - 5, w + 2 * f + 8, 5, 200, 209, C['sill'])
    box(n + '_sill', x - f - 5, y + h + f, w + 2 * f + 10, 5, 200, 212, C['sill'])


def railing_front(n, x0, x1, top, z):
    zf, zb = z - 2, z + 2       # 4-unit-thick plane around z
    # handrail (wide, flat), mid rail, bottom rail
    box(n + '_hand', x0, top, x1 - x0, 4, zf - 1, zb + 1, C['rail'])
    box(n + '_mid', x0, top + 11, x1 - x0, 2.5, zf + 0.5, zb - 0.5, C['rail'])
    box(n + '_low', x0, top + 21, x1 - x0, 3, zf, zb, C['rail'])
    # balusters every 10 units
    x = x0 + 10
    k = 0
    while x < x1 - 4:
        box(f'{n}_bal{k}', x - 1, top + 4, 2, 17, z - 1, z + 1, C['rail'])
        x += 10
        k += 1
    # toe board
    box(n + '_toe', x0, top + 24, x1 - x0, 2, zf, zb, C['railcap'])


def railing_side(n, x, z0, z1, top):
    box(n + '_hand', x - 2, top, 4, 4, z0, z1, C['rail'])
    box(n + '_mid', x - 1, top + 11, 2.5, 2.5, z0, z1, C['rail'])
    box(n + '_low', x - 1, top + 21, 2.5, 3, z0, z1, C['rail'])
    z = z0 + 10
    k = 0
    while z < z1 - 4:
        box(f'{n}_bal{k}', x - 1, top + 4, 2, 17, z - 1, z + 1, C['rail'])
        z += 10
        k += 1
    box(n + '_toe', x - 1, top + 24, 2.5, 2, z0, z1, C['railcap'])


def post(n, x, z, top):
    box(n, x - 3, top, 6, 26, z - 3, z + 3, C['rail'])
    box(n + '_cap', x - 4.5, top - 3, 9, 3, z - 4.5, z + 4.5, C['railcap'])


for i, fy in enumerate([130, 280, 430]):
    n = ['f3', 'f2', 'f1'][i]
    box(n + '_wall', 120, fy - 14, 400, 150, 0, 200, C['wall'])
    window(n + '_winL', 155, fy + 10)
    window(n + '_winR', 440, fy + 10)
    box(n + '_door', 285, fy - 5, 70, 105, 198, 205, C['door'])
    box(n + '_knob', 343, fy + 48, 4, 4, 205, 208, C['knob'])
    sy = fy + 116
    box(n + '_slab', 100, sy, 440, 12, 0, 250, C['slab'])
    top = fy + 90
    railing_front(n + '_rf', 100, 540, top, 248)
    railing_side(n + '_rsL', 101, 200, 250, top)
    railing_side(n + '_rsR', 539, 200, 250, top)
    for k, px in enumerate([101, 210.5, 320, 429.5, 539]):
        post(f'{n}_post{k}', px, 248, top)
    for k, px in enumerate([101, 539]):
        post(f'{n}_sidepost{k}', px, 201, top)

box('step2', 240, 542, 160, 24, 250, 280, C['roof'])
box('step1', 260, 554, 120, 12, 280, 300, C['slab'])

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    json.dump(boxes, open(f'{out}/boxes.json', 'w'))
    mats, obj, mtl, v = {}, ['mtllib building_3d.mtl'], [], 0
    F = [(1, 4, 3, 2), (5, 6, 7, 8), (1, 5, 8, 4), (2, 3, 7, 6), (4, 8, 7, 3), (1, 2, 6, 5)]
    for n, x0, x1, y0, y1, z0, z1, c in boxes:
        if c not in mats:
            mats[c] = f'm{len(mats)}'
            r, g, b = [int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)]
            mtl += [f'newmtl {mats[c]}', f'Kd {r:.3f} {g:.3f} {b:.3f}']
        obj += [f'o {n}', f'usemtl {mats[c]}']
        vs = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
              (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
        obj += [f'v {a:.4f} {b:.4f} {c_:.4f}' for a, b, c_ in vs]
        obj += ['f ' + ' '.join(str(v + i) for i in f) for f in F]
        v += 8
    open(f'{out}/building_3d.obj', 'w').write('\n'.join(obj))
    open(f'{out}/building_3d.mtl', 'w').write('\n'.join(mtl))
    print(len(boxes), 'boxes')
