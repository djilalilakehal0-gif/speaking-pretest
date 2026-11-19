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
         glass='#6f9bb5', sill='#cfd8dc', knob='#263238',
         panel='#8fa4af', brass='#c9a227',
         quoin='#dfe5e8', groove='#c5cdd2', tar='#6d7d86', coping='#b0bec5',
         tank='#78909c', vent='#90a4ae')

# ground, roof, walls
box('base', 60, 566, 520, 30, -30, 320, C['base'])
box('roof', 110, 90, 420, 26, -10, 210, C['roof'])
# roof: dark membrane, hollow parapet ring with coping, drip edge
box('roof_tar', 120, 86, 400, 4, 0, 200, C['tar'])
box('roof_drip', 106, 112, 428, 4, -14, 214, C['slab'])
for nm, x, w, z0, z1 in [('pF', 110, 420, 200, 210), ('pB', 110, 420, -10, 0),
                         ('pL', 110, 10, 0, 200), ('pR', 520, 10, 0, 200)]:
    box('roof_' + nm, x, 74, w, 16, z0, z1, C['slab'])
box('roof_copF', 107, 71, 426, 3, 198, 213, C['coping'])
box('roof_copB', 107, 71, 426, 3, -13, 2, C['coping'])
box('roof_copL', 107, 71, 15, 3, 0, 200, C['coping'])
box('roof_copR', 518, 71, 15, 3, 0, 200, C['coping'])
# rooftop stair-head, water tank on legs, vent pipes
box('roof_stairhead', 150, 40, 90, 46, 30, 110, C['wall'])
box('roof_stairhead_top', 146, 37, 98, 3, 26, 114, C['coping'])
box('roof_stairhead_door', 180, 56, 30, 30, 110, 112, C['door'])
for k, (lx, lz) in enumerate([(400, 40), (450, 40), (400, 90), (450, 90)]):
    box(f'roof_tankleg{k}', lx, 66, 5, 20, lz, lz + 5, C['vent'])
box('roof_tank', 395, 36, 65, 30, 35, 100, C['tank'])
box('roof_tank_lid', 392, 33, 71, 3, 32, 103, C['coping'])
for k, vx in enumerate([300, 330, 360]):
    box(f'roof_vent{k}', vx, 62, 6, 24, 60, 66, C['vent'])
    box(f'roof_vent{k}_cap', vx - 2, 59, 10, 3, 58, 68, C['coping'])


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


def door(n, x, y, w=70, h=105):
    f = 5                                   # frame thickness
    # door leaf
    box(n + '_leaf', x, y, w, h, 198, 205, C['door'])
    # frame (top, left, right) + lintel + threshold step
    box(n + '_fT', x - f, y - f, w + 2 * f, f, 198, 208, C['frame'])
    box(n + '_fL', x - f, y, f, h, 198, 208, C['frame'])
    box(n + '_fR', x + w, y, f, h, 198, 208, C['frame'])
    box(n + '_lintel', x - f - 5, y - f - 5, w + 2 * f + 10, 5, 198, 210, C['sill'])
    box(n + '_step', x - f - 3, y + h, w + 2 * f + 6, 16, 198, 212, C['sill'])
    # raised panels: 2 columns x 3 rows (top row = glass)
    pw, ph, gap, m = 23, 25, 6, 8
    for r in range(3):
        for c in range(2):
            px = x + m + c * (pw + gap)
            py = y + m + r * (ph + gap)
            if r == 0:
                box(f'{n}_glass{r}{c}', px, py, pw, ph, 205, 206, C['glass'])
                box(f'{n}_gfr{r}{c}T', px - 2, py - 2, pw + 4, 2, 205, 207, C['frame'])
                box(f'{n}_gfr{r}{c}B', px - 2, py + ph, pw + 4, 2, 205, 207, C['frame'])
                box(f'{n}_gfr{r}{c}L', px - 2, py, 2, ph, 205, 207, C['frame'])
                box(f'{n}_gfr{r}{c}R', px + pw, py, 2, ph, 205, 207, C['frame'])
            else:
                box(f'{n}_pan{r}{c}', px, py, pw, ph, 205, 207, C['panel'])
    # hinges (left edge)
    for k, hy in enumerate([y + 12, y + h - 22]):
        box(f'{n}_hinge{k}', x, hy, 3, 10, 205, 207, C['knob'])
    # handle: backplate, lever, keyhole
    hx = x + w - 13
    box(n + '_plate', hx, y + 46, 5, 18, 205, 206.5, C['knob'])
    box(n + '_lever', hx - 8, y + 52, 13, 3, 206.5, 210, C['brass'])
    box(n + '_stem', hx + 1, y + 50, 3, 7, 206.5, 210, C['brass'])
    box(n + '_key', hx + 1.5, y + 59, 2, 3, 206.5, 207, C['railcap'])


def side_window(n, face, zc, y, w=45, h=80):
    x0 = 114 if face == 'L' else 520          # protrudes 6 from the side wall
    gx = x0 + 4 if face == 'L' else x0         # glass flush against the wall
    f = 4
    z0 = zc - w / 2
    box(n + '_glass', gx, y, 2, h, z0, z0 + w, C['glass'])
    box(n + '_fT', x0, y - f, 6, f, z0 - f, z0 + w + f, C['frame'])
    box(n + '_fB', x0, y + h, 6, f, z0 - f, z0 + w + f, C['frame'])
    box(n + '_fL', x0, y, 6, h, z0 - f, z0, C['frame'])
    box(n + '_fR', x0, y, 6, h, z0 + w, z0 + w + f, C['frame'])
    box(n + '_mV', x0 + 1, y, 4, h, zc - 1.5, zc + 1.5, C['frame'])
    box(n + '_mH', x0 + 1, y + h * 0.4 - 1.5, 4, 3, z0, z0 + w, C['frame'])
    box(n + '_sill', x0 - 2, y + h + f, 10, 5, z0 - f - 5, z0 + w + f + 5, C['sill'])


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
    # wall details: corner pilasters, side windows, cornice dentils
    box(n + '_quoinL', 120, fy - 14, 14, 150, 200, 204, C['quoin'])
    box(n + '_quoinR', 506, fy - 14, 14, 150, 200, 204, C['quoin'])
    for k, zc in enumerate([50, 150]):
        side_window(f'{n}_swL{k}', 'L', zc, fy + 10)
        side_window(f'{n}_swR{k}', 'R', zc, fy + 10)
    # horizontal rustication grooves (ground floor) / floor-line band
    if n == 'f1':
        for k in range(11):
            box(f'{n}_rust{k}', 134, fy - 14 + 12 * (k + 1), 372, 1.5, 200, 201, C['groove'])
    box(n + '_band', 118, fy + 134, 404, 4, 200, 203, C['quoin'])
    door(n + '_door', 285, fy - 5)
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

# cornice dentils under the roof slab (front and both sides)
x = 126
k = 0
while x < 514:
    box(f'dent_f{k}', x, 116, 8, 7, 200, 210, C['quoin'])
    x += 14
    k += 1
for k, z in enumerate(range(10, 196, 14)):
    box(f'dent_l{k}', 114, 116, 6, 7, z, z + 8, C['quoin'])
    box(f'dent_r{k}', 520, 116, 6, 7, z, z + 8, C['quoin'])
# plinth around the ground-floor wall
box('plinth', 116, 556, 408, 10, -4, 204, C['slab'])
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
