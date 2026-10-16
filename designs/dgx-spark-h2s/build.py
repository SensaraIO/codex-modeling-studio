"""Four-Spark rack for Bambu H2S. Millimetres; only geometry, never printer control.

Run: /tmp/spark-rack-cad/bin/python designs/dgx-spark-h2s/build.py
Requires numpy, trimesh, manifold3d, networkx. The same ordered primitives drive
the editable studio model and independently booleaned, closed 3MF print meshes.
"""
from pathlib import Path
from datetime import datetime, timezone
import copy
import json
import math
import zipfile
import xml.etree.ElementTree as ET

import numpy as np
import trimesh as tm

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parents[1] / "public" / "designs" / HERE.name
OUT = HERE / "output"
BED = np.array([340., 320., 340.])
BRIM = 8.
SHELF_TOPS = [24., 116., 208., 300.]
FRAME_X = 104.
FRAME_THICK = 12.
FRAME_HEIGHT = 318.
FRAME_DEPTH = 208.
BEAM_Y = 64.
BEAM_DEPTH = 24.
SHELF_THICK = 14.
SLOT_ALLOWANCE = 0.5  # total Y/Z allowance; bearing face at nominal shelf bottom
KEY_X = 112.4


def box(name, size, pos, rot=(0, 0, 0), op="add", role="solid"):
    return dict(name=name, type="box", role=role, operation=op,
                position=list(pos), rotation=list(rot), scale=[1, 1, 1],
                dimensions=dict(width=size[0], depth=size[1], height=size[2],
                                radius=1, radiusTop=1, radiusBottom=1, tube=1),
                visible=True, locked=False)


def transform(shapes, R, t):
    result = copy.deepcopy(shapes)
    for s in result:
        old = tm.transformations.euler_matrix(*np.radians(s["rotation"]), axes="rxyz")[:3, :3]
        s["position"] = (R @ np.array(s["position"]) + t).tolist()
        s["rotation"] = np.degrees(tm.transformations.euler_from_matrix(R @ old, axes="rxyz")).tolist()
    return result


def mesh(shapes):
    result = None
    for s in shapes:
        if s["role"] == "reference":
            continue
        d = s["dimensions"]
        m = tm.creation.box([d["width"], d["depth"], d["height"]])
        T = tm.transformations.euler_matrix(*np.radians(s["rotation"]), axes="rxyz")
        T[:3, 3] = s["position"]
        m.apply_transform(T)
        if result is None:
            assert s["operation"] == "add"
            result = m
        elif s["operation"] == "cut":
            result = tm.boolean.difference([result, m], engine="manifold")
        else:
            result = tm.boolean.union([result, m], engine="manifold")
    assert result is not None
    return result


def side_frame(allowance=SLOT_ALLOWANCE):
    s = [box("Full-depth foot", [12, FRAME_DEPTH, 14], [0, 0, 7])]
    for y in [-BEAM_Y, BEAM_Y]:
        s.append(box("Continuous upright", [12, 36, FRAME_HEIGHT], [0, y, FRAME_HEIGHT / 2]))
    for top in SHELF_TOPS[1:]:
        s.append(box("Shelf bearing rung", [12, 128, 12], [0, 0, top - 20]))
    s.append(box("Top tie", [12, 128, 16], [0, 0, 310]))
    for level in range(3):
        rise = 54 * (1 if level % 2 == 0 else -1)
        s.append(box("Diagonal side brace", [12, math.hypot(128, rise), 12],
                     [0, 0, 64 + level * 92], [math.degrees(math.atan2(rise, 128)), 0, 0]))
    for top in SHELF_TOPS:
        for y in [-BEAM_Y, BEAM_Y]:
            s.append(box("Through mortise; gravity bearing below", [14, BEAM_DEPTH + allowance, SHELF_THICK + allowance],
                         [0, y, top - SHELF_THICK / 2 + allowance / 2], op="cut"))
    return s


def shelf():
    s = []
    for y in [-BEAM_Y, BEAM_Y]:
        s.append(box("Continuous 240 mm shelf beam", [240, BEAM_DEPTH, 14], [0, y, 7]))
    for x in [-90.6, 90.6]:
        s.append(box("Side rail and joint shoulder", [14, 166, 14], [x, 0, 7]))
    for y in [-42, -28, -14, 0, 14, 28, 42]:
        s.append(box("Open deck cross rib", [195.2, 6, 14], [0, y, 7]))
    for x in [-48, 0, 48]:
        s.append(box("Open deck longitudinal rib", [6, 128, 14], [x, 0, 7]))
    for x in [-KEY_X, KEY_X]:
        for y in [-BEAM_Y, BEAM_Y]:
            s.append(box("Printed locking-key opening", [4.4, 8.4, 16], [x, y, 7], op="cut"))
    return s


def key():
    # Flat, rigid retaining key. No flexible snap arms in glass-filled plastic.
    return [box("Key shank", [4, 8, 20.1], [0, 0, 10]),
            box("Key finger tab", [10, 8, 3], [3, 0, 21.5])]


def project(name, shapes):
    ss = copy.deepcopy(shapes)
    for i, s in enumerate(ss):
        s["id"] = f"h2s-{i:03d}"
    return dict(id="dgx-spark-h2s-four", name=name, unit="mm", color="#303e46",
                roughness=0.82, metalness=0.12, buildVolume=BED.tolist(), shapes=ss,
                updatedAt=datetime.now(timezone.utc).isoformat())


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n")


NS = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
ET.register_namespace("", NS)


def write_3mf(path, objects):
    root = ET.Element(f"{{{NS}}}model", unit="millimeter", attrib={"xml:lang": "en-US"})
    ET.SubElement(root, f"{{{NS}}}metadata", name="Title").text = path.stem
    resources = ET.SubElement(root, f"{{{NS}}}resources")
    build = ET.SubElement(root, f"{{{NS}}}build")
    for oid, (name, m) in enumerate(objects, 1):
        obj = ET.SubElement(resources, f"{{{NS}}}object", id=str(oid), type="model", name=name)
        me = ET.SubElement(obj, f"{{{NS}}}mesh")
        vs, ts = ET.SubElement(me, f"{{{NS}}}vertices"), ET.SubElement(me, f"{{{NS}}}triangles")
        for v in m.vertices:
            ET.SubElement(vs, f"{{{NS}}}vertex", **dict(zip(("x", "y", "z"), (f"{x:.6f}" for x in v))))
        for f in m.faces:
            ET.SubElement(ts, f"{{{NS}}}triangle", **dict(zip(("v1", "v2", "v3"), map(str, f))))
        ET.SubElement(build, f"{{{NS}}}item", objectid=str(oid))
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        z.writestr("_rels/.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        z.writestr("3D/3dmodel.model", ET.tostring(root, encoding="utf-8", xml_declaration=True))


def place_on_bed(shapes, R=np.eye(3), xy=(170, 160)):
    ss = transform(shapes, R, np.zeros(3))
    m = mesh(ss)
    shift = np.array([xy[0] - m.bounds.mean(0)[0], xy[1] - m.bounds.mean(0)[1], -m.bounds[0, 2]])
    return transform(ss, np.eye(3), shift)


def check_part(name, m):
    assert m.is_watertight, f"{name} is open"
    assert m.is_winding_consistent and m.volume > 0
    assert len(m.split()) == 1, f"{name} has disconnected geometry"
    assert m.bounds[0, 2] >= -1e-5
    assert np.all(m.bounds[0, :2] >= BRIM) and np.all(m.bounds[1, :2] <= BED[:2] - BRIM)
    assert m.bounds[1, 2] <= BED[2]
    return dict(dimensions_mm=np.round(m.extents, 4).tolist(), bounds_mm=np.round(m.bounds, 4).tolist(),
                watertight=bool(m.is_watertight), winding_consistent=bool(m.is_winding_consistent),
                connected_solids=len(m.split()), solid_volume_cm3=round(float(m.volume) / 1000, 3),
                fits_h2s_with_8mm_brim=True, triangles=len(m.faces))


def main():
    OUT.mkdir(exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    f, s, k = side_frame(), shelf(), key()
    parts = {"side-frame": f, "shelf-tray": s, "locking-key": k}
    Ry = tm.transformations.rotation_matrix(math.pi / 2, [0, 1, 0])[:3, :3]
    Rx = tm.transformations.rotation_matrix(math.pi / 2, [1, 0, 0])[:3, :3]
    print_shapes = {"side-frame": place_on_bed(f, Ry), "shelf-tray": place_on_bed(s), "locking-key": place_on_bed(k, Rx)}
    checks = {}
    for name, ss in print_shapes.items():
        m = mesh(ss)
        checks[name] = check_part(name, m)
        write_3mf(OUT / f"{name}.3mf", [(name, m)])
        write_json(PUBLIC / f"{name}.json", project(f"H2S / {name} / print orientation", ss))

    assembly, assembled_meshes = [], []
    exploded = []
    for sign in [-1, 1]:
        ss = transform(f, np.eye(3), np.array([sign * FRAME_X, 0, 0]))
        assembly += ss
        assembled_meshes.append((f"frame-{sign}", mesh(ss)))
        exploded += transform(ss, np.eye(3), np.array([sign * 35, 0, 0]))
    for level, top in enumerate(SHELF_TOPS):
        ss = transform(s, np.eye(3), np.array([0, 0, top - SHELF_THICK]))
        assembly += ss
        assembled_meshes.append((f"tray-{level+1}", mesh(ss)))
        exploded += ss
        for sign in [-1, 1]:
            R = tm.transformations.rotation_matrix(math.pi if sign < 0 else 0, [0, 0, 1])[:3, :3]
            for y in [-BEAM_Y, BEAM_Y]:
                kk = transform(k, R, np.array([sign * KEY_X, y, top - 20]))
                assembly += kk
                assembled_meshes.append((f"key-{level}-{sign}-{y}", mesh(kk)))
                exploded += transform(kk, np.eye(3), np.array([sign * 5, 0, 27]))

    overlaps = []
    for i, (an, a) in enumerate(assembled_meshes):
        for bn, b in assembled_meshes[i + 1:]:
            if np.any(np.minimum(a.bounds[1], b.bounds[1]) - np.maximum(a.bounds[0], b.bounds[0]) <= 1e-5):
                continue
            intersection = tm.boolean.intersection([a, b], engine="manifold")
            volume = 0.0 if intersection.is_empty else float(intersection.volume)
            if volume > 0.01:
                overlaps.append(dict(a=an, b=bn, volume_mm3=volume))
    assert not overlaps, overlaps

    refs = [box(f"Spark {i+1} / nominal 150 x 150 x 50.5 mm", [150, 150, 50.5], [0, 0, top + 25.25], role="reference")
            for i, top in enumerate(SHELF_TOPS)]
    # The side frames finish below the top device. Device envelopes are context,
    # never printable parts, and are not included in the assembled rack bounds.
    for i, ref in enumerate(refs):
        ref_mesh = tm.creation.box([150, 150, 50.5])
        ref_mesh.apply_translation(ref["position"])
        for name, part in assembled_meshes:
            if np.any(np.minimum(part.bounds[1], ref_mesh.bounds[1]) - np.maximum(part.bounds[0], ref_mesh.bounds[0]) <= 1e-5):
                continue
            assert tm.boolean.intersection([part, ref_mesh], engine="manifold").volume < 0.01, (i, name)

    for name, shapes in [("assembly", assembly + refs), ("bare-rack", assembly), ("exploded", exploded)]:
        write_json(PUBLIC / f"{name}.json", project(f"DGX Spark / four-bay H2S rack / {name}", shapes))

    # Sixteen interchangeable retainers on one plate, all laid flat.
    key_plate, key_objects = [], []
    for i in range(16):
        kk = place_on_bed(k, Rx, (108 + (i % 8) * 18, 139 + (i // 8) * 40))
        key_plate += kk
        key_objects.append((f"locking-key-{i+1:02d}", mesh(kk)))
    write_3mf(OUT / "locking-keys-print-16.3mf", key_objects)
    write_json(PUBLIC / "key-plate.json", project("H2S / 16 rigid locking keys / print flat", key_plate))

    # Coupon sockets use the production mortise sizes and frame print direction.
    coupons, coupon_objects = [], []
    for i, allowance in enumerate([0.4, 0.5, 0.7]):
        ss = [box(f"Socket coupon total allowance {allowance}", [12, 40, 32], [0, 0, 16]),
              box("Mortise test opening", [14, 24 + allowance, 14 + allowance], [0, 0, 8 + (14 + allowance) / 2], op="cut")]
        pp = place_on_bed(ss, Ry, (108 + i * 48, 125))
        coupons += pp
        coupon_objects.append((f"socket-total-clearance-{allowance:.1f}mm", mesh(pp)))
    # A full-sized beam end and its shoulder, with the actual key hole.
    tongue = [box("Full-size test tongue", [44, 24, 14], [98, 0, 7]),
              box("Joint shoulder", [14, 40, 14], [90.6, 0, 7]),
              box("Actual key opening", [4.4, 8.4, 16], [KEY_X, 0, 7], op="cut")]
    tongue = place_on_bed(tongue, xy=(148, 190))
    coupons += tongue
    coupon_objects.append(("test-tongue", mesh(tongue)))
    kp = place_on_bed(k, Rx, (206, 186))
    coupons += kp
    coupon_objects.append(("test-locking-key", mesh(kp)))
    for name, m in coupon_objects:
        check_part(name, m)
    write_3mf(OUT / "fit-coupon-first.3mf", coupon_objects)
    write_json(PUBLIC / "fit-coupon.json", project("H2S / joint fit coupon / 0.4, 0.5, 0.7 mm total clearance", coupons))

    bbox = tm.util.concatenate([m for _, m in assembled_meshes]).bounds
    report = dict(printer="Bambu Lab H2S", build_volume_mm=BED.tolist(), material="Bambu ABS-GF",
                  default_nozzle_mm=0.4, optional_recommended_nozzle_mm=0.6,
                  parts=checks, required_counts={"side-frame": 2, "shelf-tray": 4, "locking-key": 16},
                  assembled_rack_dimensions_mm=np.round(bbox[1] - bbox[0], 3).tolist(),
                  rack_with_devices_height_mm=350.5, device_dimensions_mm=[150, 150, 50.5],
                  nominal_device_mass_kg=1.2, devices=4, total_device_mass_kg=4.8,
                  shelf_top_heights_mm=SHELF_TOPS, vertical_gap_to_next_tray_mm=27.5,
                  centered_device_to_side_frame_mm=23.0,
                  fit_clearance_total_mm=SLOT_ALLOWANCE,
                  component_intersections_mm3=overlaps,
                  nvidia_external_clearance_mm={"front": 100, "sides": 20, "rear": 400},
                  validation_limits={"physical_fit": "not yet tested", "load_and_creep": "not yet tested", "thermal_airflow": "not yet tested"})
    write_json(OUT / "geometry-checks.json", report)
    write_json(PUBLIC / "geometry-checks.json", report)
    # Precomputed meshes keep the assembly preview responsive and exactly match
    # the boolean solids exported for printing. No browser-side re-booleaning.
    scenes = {
        "assembly": assembled_meshes,
        "bare-rack": assembled_meshes,
        "exploded": [(name, part.copy()) for name, part in assembled_meshes],
        **{name: [(name, mesh(ss))] for name, ss in print_shapes.items()},
        "key-plate": key_objects,
        "fit-coupon": coupon_objects,
    }
    for name, part in scenes["exploded"]:
        if name.startswith("frame"):
            part.apply_translation([35 * (1 if part.centroid[0] > 0 else -1), 0, 0])
        elif name.startswith("key"):
            part.apply_translation([5 * (1 if part.centroid[0] > 0 else -1), 0, 27])
    def packed(name, part, reference=False):
        return dict(name=name, vertices=np.round(part.vertices, 5).tolist(),
                    faces=part.faces.tolist(), reference=reference)
    for name, objects in scenes.items():
        packed_objects = [packed(n, m) for n, m in objects]
        if name == "assembly":
            for i, top in enumerate(SHELF_TOPS):
                m = tm.creation.box([150, 150, 50.5])
                m.apply_translation([0, 0, top + 25.25])
                packed_objects.append(packed(f"Spark {i+1}: nominal enclosure", m, True))
        write_json(PUBLIC / f"{name}.mesh.json", dict(name=name, objects=packed_objects))
    for path in OUT.glob("*.3mf"):
        (PUBLIC / path.name).write_bytes(path.read_bytes())
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
