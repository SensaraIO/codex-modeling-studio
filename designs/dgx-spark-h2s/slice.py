"""Offline Bambu Studio slicing and readback. Never connects to a printer."""
from pathlib import Path
import json, re, subprocess, zipfile, shutil

HERE = Path(__file__).resolve().parent
OUT = HERE/'output'/'sliced'
OUT.mkdir(parents=True, exist_ok=True)
PREPARED=HERE/'output'/'prepared'
PREPARED.mkdir(exist_ok=True)
PUBLIC=HERE.parents[1]/'public'/'designs'/HERE.name
parts = [('fit-coupon-first',1),('side-frame',2),('shelf-tray',4),('locking-keys-print-16',1)]
summary=[]
for name, count in parts:
    output=f'{name}-h2s-abs-gf.3mf'
    args=['/Applications/BambuStudio.app/Contents/MacOS/BambuStudio',
          '--datadir','/tmp/h2s-rack-slicer',
          '--load-settings',f'{HERE}/profiles/machine.json;{HERE}/profiles/process.json',
          '--load-filaments',str(HERE/'profiles/filament.json'),
          '--slice','0','--arrange','0','--orient','0',
          '--export-3mf',output,'--outputdir',str(OUT),str(HERE/'output'/f'{name}.3mf')]
    dependencies=[HERE/'output'/f'{name}.3mf',*list((HERE/'profiles').glob('*.json'))]
    if not (OUT/output).exists() or (OUT/output).stat().st_mtime < max(p.stat().st_mtime for p in dependencies):
        result=subprocess.run(args,capture_output=True,text=True,timeout=180)
        log=result.stdout+result.stderr
        (OUT/f'{name}.log').write_text(log)
        if result.returncode:raise RuntimeError(f'{name}: {result.returncode}\n{log[-2000:]}')
    else:
        log=(OUT/f'{name}.log').read_text()
    # Deliver an editable project, not a pre-generated printer job.
    prepared_args=args.copy()
    index=prepared_args.index('--slice')
    del prepared_args[index:index+2]
    prepared_args[prepared_args.index('--outputdir')+1]=str(PREPARED)
    if not (PREPARED/output).exists() or (PREPARED/output).stat().st_mtime < max(p.stat().st_mtime for p in dependencies):
        prepared=subprocess.run(prepared_args,capture_output=True,text=True,timeout=60)
        assert prepared.returncode==0,prepared.stderr
    with zipfile.ZipFile(PREPARED/output) as archive:
        assert not any(n.endswith('.gcode') for n in archive.namelist())
    shutil.copy2(PREPARED/output,PUBLIC/output)
    with zipfile.ZipFile(OUT/output) as archive:
        settings=json.loads(archive.read('Metadata/project_settings.config'))
        assert settings['printer_model']=='Bambu Lab H2S'
        assert settings['filament_type']==['ABS-GF']
        assert settings['wall_loops']=='6' and settings['sparse_infill_density']=='35%'
        gcode=archive.read('Metadata/plate_1.gcode').decode()
        weight=float(re.search(r'total filament weight \[g\] : ([\d.]+)',gcode)[1])
        time=re.search(r'total estimated time: (.+)',gcode)[1].strip()
        layers=int(re.search(r'total layer number: (\d+)',gcode)[1])
        assert layers>1 and weight>0
        # Verify material extrusion paths only, excluding vendor start/end moves.
        # Printing paths must remain inside the configured plate, at valid Z.
        in_layers=False
        x=y=z=0.0
        positions=[]
        for line in gcode.splitlines():
            if line.startswith('; CHANGE_LAYER'):in_layers=True
            if line.startswith('; filament end gcode'):in_layers=False
            if not in_layers or not re.match(r'G[01] ',line):continue
            fields={a:float(b) for a,b in re.findall(r'([XYZE])([-+]?(?:\d+(?:\.\d*)?|\.\d+))',line.split(';')[0])}
            x,y,z=fields.get('X',x),fields.get('Y',y),fields.get('Z',z)
            if fields.get('E',0)>0 and ('X' in fields or 'Y' in fields):positions.append((x,y,z))
        assert positions, 'No extrusion paths read'
        minimum=[min(v[i] for v in positions) for i in range(3)]
        maximum=[max(v[i] for v in positions) for i in range(3)]
        assert all(a>=-0.1 and b<=limit+.1 for a,b,limit in zip(minimum,maximum,[340,320,340])), (minimum,maximum)
        plate=json.loads(archive.read('Metadata/plate_1.json'))
        assert plate['bbox_all'][0]>=0 and plate['bbox_all'][1]>=0 and plate['bbox_all'][2]<=340 and plate['bbox_all'][3]<=320
        for asset in ['Metadata/plate_1.png','Metadata/top_1.png']:
            (OUT/f'{name}-{Path(asset).name}').write_bytes(archive.read(asset))
    summary.append(dict(part=name,quantity=count,grams_each=weight,estimated_time_each=time,layers=layers,
                        extrusion_path_bounds_mm=[minimum,maximum],first_layer_with_brim_bbox_mm=plate['bbox_all'],file=output,
                        slicer_messages=[line for line in log.splitlines() if '[error]' in line or '[warning]' in line]))
    print(json.dumps(summary[-1]),flush=True)
(OUT/'slicing-checks.json').write_text(json.dumps(summary,indent=2)+'\n')
