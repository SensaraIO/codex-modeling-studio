"""Resolve installed Bambu profiles for reproducible, offline-only slicing."""
from pathlib import Path
import json

ROOT = Path('/Applications/BambuStudio.app/Contents/Resources/profiles/BBL')
OUT = Path(__file__).resolve().parent / 'profiles'
OUT.mkdir(exist_ok=True)

def resolve(category, name):
    path = ROOT / category / f'{name}.json'
    raw = json.loads(path.read_text())
    result = resolve(category, raw['inherits']) if raw.get('inherits') else {}
    for include in raw.get('include', []):
        result.update(resolve(category, include))
    result.update(raw)
    for key in ['inherits', 'include']:
        result.pop(key, None)
    return result

machine = resolve('machine', 'Bambu Lab H2S 0.4 nozzle')
process = resolve('process', '0.20mm Standard @BBL H2S')
filament = resolve('filament', 'Bambu ABS-GF @BBL H2S')
process.update(name='H2S Spark rack - 0.20mm ABS-GF', wall_loops='6',
               sparse_infill_density='35%', sparse_infill_pattern='gyroid',
               top_shell_layers='6', bottom_shell_layers='6',
               brim_type='outer_only', brim_width='8', brim_object_gap='0.1',
               enable_support='0', curr_bed_type='Textured PEI Plate')
for name, profile in [('machine', machine), ('process', process), ('filament', filament)]:
    (OUT / f'{name}.json').write_text(json.dumps(profile, indent=2)+'\n')
print(json.dumps({ 'printer': machine['name'], 'material': filament['name'],
                  'layer_height': process.get('layer_height'), 'walls':process['wall_loops'],
                  'nozzle_temperature':filament['nozzle_temperature'],
                  'chamber_temperature':filament['chamber_temperatures'],
                  'bed_temperature':filament.get('textured_plate_temp'),
                  'machine_gcode_is_h2s':'H2S' in machine.get('machine_start_gcode','')}, indent=2))
