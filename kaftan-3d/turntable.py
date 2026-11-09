"""Blender 360° turntable for a GLB. Usage: python3 turntable.py in.glb out_dir [frames]"""
import sys, math, os
import bpy
from mathutils import Vector

src, out = sys.argv[1], sys.argv[2]
frames = int(sys.argv[3]) if len(sys.argv) > 3 else 120
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in scene.objects if o.type == 'MESH']

# Parent everything to a pivot, normalise height to 1.75 m, stand on floor, centre.
pivot = bpy.data.objects.new("Pivot", None)
scene.collection.objects.link(pivot)
for o in scene.objects:
    if o is not pivot and o.parent is None:
        o.parent = pivot
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
s = 1.75 / (mx.z - mn.z)
pivot.scale = (s, s, s)
ctr = (mn + mx) / 2
pivot.location = (-ctr.x * s, -ctr.y * s, -mn.z * s)
bpy.context.view_layer.update()

# Turntable: rotate the pivot 360° about Z.
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert("rotation_euler", index=2, frame=1)
pivot.rotation_euler.z = math.radians(360)
pivot.keyframe_insert("rotation_euler", index=2, frame=frames + 1)

# Floor (shadow catcher look) + backdrop colour like the photo.
bpy.ops.mesh.primitive_plane_add(size=20)
floor = bpy.context.object
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.38, 0.26, 1)
fm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
floor.data.materials.append(fm)

world = bpy.data.worlds.new("W"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.62, 0.45, 0.32, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6

def light(name, kind, loc, energy, size=3):
    d = bpy.data.lights.new(name, kind); d.energy = energy
    if kind == 'AREA': d.size = size
    o = bpy.data.objects.new(name, d); scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.9)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light("Key", 'AREA', (2.5, -3, 3), 450)
light("Fill", 'AREA', (-3, -2, 2), 250)
light("Rim", 'AREA', (0, 3.5, 3), 400)

cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 68
cam = bpy.data.objects.new("Cam", cam_d); scene.collection.objects.link(cam)
cam.location = (0, -4.4, 0.95)
cam.rotation_euler = (math.radians(89), 0, 0)
scene.camera = cam

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = int(os.environ.get("SAMPLES", 24))
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.render.resolution_x, scene.render.resolution_y = 720, 1080
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, frames
scene.view_settings.view_transform = 'AgX'
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(out, "frame_")
bpy.ops.render.render(animation=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "turntable.blend"))
print("DONE")
