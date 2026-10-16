from pathlib import Path
import json, math, zipfile, shutil
import numpy as np
import manifold3d as m
import trimesh as tm
O=Path(__file__).resolve().parent
SOURCE=Path('/Users/cheshire/Documents/Codex/2026-09-04/ca/outputs/two-slot-mini-optimized')
# Dimensions in mm. Underside clearance is deliberately not a press-fit feature.
P=dict(device_width=127,device_depth=127,device_height=50,tilt=15,circular_clearance_diameter=120,levels=[40,120],frame_width=154,frame_depth=188)
(O/'parameters.json').write_text(json.dumps(P,indent=2))
a=math.radians(P['tilt']); c,s=math.cos(a),math.sin(a)
def box(d,p): return m.Manifold.cube(d,True).translate(p)
def tilt(q,z):return q.rotate([15,0,0]).translate([0,0,z])
def mesh(q):
 t=q.to_mesh();return tm.Trimesh(vertices=t.vert_properties[:,:3],faces=t.tri_verts,process=True)
def obj(name,q,ref=False):
 t=mesh(q);return dict(name=name,reference=ref,vertices=t.vertices.tolist(),faces=t.faces.tolist())
# Two rigid C sides, integral feet, and a rear ladder. Rear face Y=94 is the print bed.
parts=[]
for x in [-71,71]:
 parts += [box([12,188,8],[x,0,4]),box([12,16,148],[x,86,74])]
# Rear rungs sit behind and below each computer's rear connections.
for z in [27,107]: parts += [box([154,12,16],[0,88,z])]
for z in P['levels']:
 # Open horseshoe: broad corners support the case, a 120 mm circular opening clears the base.
 shelf=box([154,158,12],[0,10,-6])
 circle=m.Manifold.cylinder(30,60,60,160,True).translate([0,0,-4])
 mouth=box([96,90,32],[0,-74,-4])
 shelf=shelf-circle-mouth
 # Slim upper side guides have 1.5 mm nominal clearance to the 127 mm case.
 for x in [-68,68]: shelf += box([6,128,4],[x,0,2])
 # Small front stops outside the circular opening; tapered undersides avoid isolated print starts.
 for x in [-55,55]:
  wedge=m.Manifold.hull_points([[x+dx,y,zz] for dx in [-7,7] for y,zz in [(-62,-12),(-64.2,0),(-64.2,5),(-69,5),(-69,-12)]])
  shelf+=wedge
 parts.append(tilt(shelf,z))
# Integrate lower/upper rails into the rear posts and feet. No assembly joints.
rack=m.Manifold.batch_boolean(parts,m.OpType.Add)
t=mesh(rack)
assert t.is_watertight and len(rack.decompose())==1
# Print on back: assembled rear face becomes Z=0. All shelf rails grow toward the front.
printed=rack.rotate([90,0,0]); mt=mesh(printed)
shift=np.array([128,128,0])-np.r_[mt.bounds.mean(0)[:2],mt.bounds[0,2]]
printed=printed.translate(shift);pt=mesh(printed)
assert (pt.bounds[0]>=0).all() and (pt.bounds[1]<256).all()
# Conservative square device collision envelopes. Rounded visual envelopes are inset by 12 mm at corners.
refs=[];collisions=[];clear=[]
for i,z in enumerate(P['levels']):
 # total height includes an approximate 5 mm underside base; enclosure seats above support plane.
 body=m.Manifold.cube([103,103,45],True).minkowski_sum(m.Manifold.cylinder(.01,12,12,40,True)).translate([0,0,22.5])
 refs.append(obj('Mac mini '+str(i+1)+' / enclosure reference',tilt(body,z),True))
 envelope=tilt(box([127,127,50],[0,0,25]),z)
 collisions.append((rack^envelope).volume())
 keep=tilt(m.Manifold.cylinder(10,59.5,59.5,160,True).translate([0,0,-5]),z)
 clear.append((rack^keep).volume())
checks=dict(watertight=t.is_watertight,connected_bodies=len(rack.decompose()),assembled_dimensions_mm=t.extents.tolist(),print_dimensions_mm=pt.extents.tolist(),print_bounds_mm=pt.bounds.tolist(),solid_volume_cm3=t.volume/1000,device_envelope_intersection_mm3=collisions,circular_keepout_intersection_mm3=clear,circular_clearance_diameter_mm=120,underside_fit='clearance only; circular base dimensions not measured',physical_validation=False)
assert max(collisions)<.001,collisions
assert max(clear)<.001,clear
(O/'geometry-checks.json').write_text(json.dumps(checks,indent=2))
for name,objects in [('assembly',[obj('rack',rack)]+refs),('bare-rack',[obj('rack',rack)]),('print',[obj('rack',printed)])]:
 (O/(name+'.mesh.json')).write_text(json.dumps(dict(objects=objects),separators=(',',':')))
# Preserve P1S ABS profile in a Bambu project, replacing the old repeat plate with one connected body.
with zipfile.ZipFile(SOURCE/'slice-optimized/mini-optimized.3mf') as z:
 print('3mf entries',z.namelist()[:12])
# Portable model-only 3MF, then Bambu applies the supplied profiles for the slice.
import xml.etree.ElementTree as E
ns='http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
root=E.Element('model',unit='millimeter',xmlns=ns);resources=E.SubElement(root,'resources');ob=E.SubElement(resources,'object',id='1',type='model',name='Two Mac minis - one piece')
me=E.SubElement(ob,'mesh');vs=E.SubElement(me,'vertices');ts=E.SubElement(me,'triangles')
for v in pt.vertices:E.SubElement(vs,'vertex',**dict(zip(['x','y','z'],map(str,v))))
for f in pt.faces:E.SubElement(ts,'triangle',**dict(zip(['v1','v2','v3'],map(str,f))))
build=E.SubElement(root,'build');E.SubElement(build,'item',objectid='1')
with zipfile.ZipFile(O/'mini-single-piece.3mf','w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('3D/3dmodel.model',E.tostring(root,encoding='utf-8',xml_declaration=True))
 z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
 z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
for f in ['machine.json','filament.json']:shutil.copy(SOURCE/f,O/f)
pr=json.loads((SOURCE/'process.json').read_text());pr.update(name='Mini single piece / ABS / 0.28 / 4 walls',print_settings_id='Mini single piece / ABS / 0.28 / 4 walls',enable_support='1',brim_width='5')
(O/'process.json').write_text(json.dumps(pr,indent=2))
print(json.dumps(checks,indent=2))
