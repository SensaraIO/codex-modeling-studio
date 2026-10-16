import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const host = document.querySelector('#viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ecf0ed');
const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor('#ecf0ed');
host.append(renderer.domElement);
let camera = new THREE.PerspectiveCamera(34,1,.1,10000);
camera.up.set(0,0,1);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
scene.add(new THREE.HemisphereLight(0xffffff,0x626e67,2.5));
const light=new THREE.DirectionalLight(0xfff5df,3.5);
light.position.set(-220,-360,600);light.castShadow=true;
light.shadow.mapSize.set(2048,2048);
Object.assign(light.shadow.camera,{left:-450,right:450,top:450,bottom:-450,near:1,far:1800});
light.shadow.normalBias=.7;scene.add(light);
const fill=new THREE.DirectionalLight(0xd8e8ff,2);fill.position.set(300,200,330);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.ShadowMaterial({opacity:.10}));
ground.position.z=-.25;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(340,17,0x839b8c,0xb4c5b9);
grid.rotation.x=Math.PI/2;grid.position.set(170,160,-.15);grid.visible=false;scene.add(grid);
const bed=new THREE.Mesh(new THREE.PlaneGeometry(340,320),new THREE.MeshBasicMaterial({color:0xdce6dd,transparent:true,opacity:.45,side:THREE.DoubleSide}));
bed.position.set(170,160,-.2);bed.visible=false;scene.add(bed);
const material=new THREE.MeshStandardMaterial({color:0x364d48,roughness:.85,metalness:.05,flatShading:true});
const deviceMaterial=new THREE.MeshStandardMaterial({color:0xb4b8ad,roughness:.55,metalness:.3,flatShading:true});
const keyMaterial=new THREE.MeshStandardMaterial({color:0xa38144,roughness:.85,flatShading:true});
const frameMaterial=new THREE.MeshStandardMaterial({color:0x374b47,roughness:.85,flatShading:true});
let group=new THREE.Group(), currentData, currentName, currentCamera='isometric', request=0;
scene.add(group);
const checks=await fetch('/designs/dgx-spark-h2s/geometry-checks.json').then(r=>r.json());
const notes={
  assembly:['Four-bay assembly','Silver boxes show the nominal 150 × 150 × 50.5 mm Spark enclosures.'],
  'bare-rack':['Open frame & removable trays','Each tray transfers its load directly into the continuous side frames.'],
  exploded:['How the joints fit','Slide both frames onto all four trays, then insert the sixteen retaining keys.'],
  'side-frame':['Continuous side frame · print 2','318 × 208 × 12 mm · flat on the H2S bed · no centre joint.'],
  'shelf-tray':['One-piece shelf tray · print 4','240 × 166 × 14 mm · continuous front and rear beams.'],
  'locking-key':['Rigid retaining key · print 16','Print flat. A removable key holds each beam end outside its frame.'],
  'key-plate':['Sixteen keys · one print plate','All keys are identical. Fit the coupon before printing the full set.'],
  'fit-coupon':['Joint fit coupon · print first','Three sockets: 0.4, 0.5, 0.7 mm total clearance, ordered left to right in Top view.'],
};
function cameraFor(view,aspect=1){
  const bounds=new THREE.Box3().setFromObject(group);
  const center=bounds.getCenter(new THREE.Vector3());
  const size=bounds.getSize(new THREE.Vector3());
  const span=Math.max(size.x,size.y,size.z,30);
  const half=span*.67/Math.min(aspect,1);
  const c=view==='isometric'?new THREE.PerspectiveCamera(34,aspect,.1,10000):new THREE.OrthographicCamera(-half*aspect,half*aspect,half,-half,.1,10000);c.up.set(0,0,1);
  const direction={isometric:[1.3,-1.7,1.05],front:[0,-1,0],right:[1,0,0],top:[0,0,1]}[view];
  if(view==='top')c.up.set(0,1,0);
  const distance=span/(2*Math.tan(THREE.MathUtils.degToRad(17)))*1.62/Math.min(aspect,1);
  c.position.copy(center).add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance));
  c.lookAt(center);return {camera:c,center};
}
function frame(view='isometric'){
  currentCamera=view;
  const next=cameraFor(view,host.clientWidth/host.clientHeight);
  camera=next.camera;controls.object=camera;controls.target.copy(next.center);controls.update();
  document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===view));
}
async function setModel(name){
  if(!notes[name])throw new Error('Unknown model variant');
  const token=++request;
  const data=await fetch(`/designs/dgx-spark-h2s/${name}.mesh.json`).then(r=>{if(!r.ok)throw new Error('Model failed to load');return r.json();});
  if(token!==request)return;
  const next=new THREE.Group();
  for(const part of data.objects){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));
    geometry.setIndex(part.faces.flat());geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,part.reference?deviceMaterial:part.name.startsWith('key')||part.name.startsWith('locking')?keyMaterial:part.name.startsWith('frame')?frameMaterial:material);
    mesh.name=part.name;mesh.castShadow=true;mesh.receiveShadow=true;next.add(mesh);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),new THREE.LineBasicMaterial({color:part.reference?0x626a61:0x172f29,transparent:true,opacity:part.reference?.3:.22}));
    next.add(edges);
  }
  scene.remove(group);group.traverse(o=>{o.geometry?.dispose();if(o.isLineSegments)o.material.dispose();});
  group=next;scene.add(group);currentName=name;currentData=data;
  bed.visible=grid.visible=!['assembly','bare-rack','exploded'].includes(name);
  document.querySelector('#view-title').textContent=notes[name][0];
  document.querySelector('#view-note').textContent=notes[name][1];
  document.querySelectorAll('[data-model]').forEach(b=>b.classList.toggle('active',b.dataset.model===name));
  document.querySelector('#part').value=bed.visible?name:'';
  document.querySelector('#status').textContent=`${data.objects.filter(o=>!o.reference).length} print components · validated meshes loaded`;
  frame();
}
function capture(view='isometric',width=1000,height=1000){
  const captureRenderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  captureRenderer.setPixelRatio(1);captureRenderer.setSize(width,height);
  captureRenderer.outputColorSpace=THREE.SRGBColorSpace;captureRenderer.shadowMap.enabled=true;captureRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
  captureRenderer.render(scene,cameraFor(view,width/height).camera);
  const url=captureRenderer.domElement.toDataURL('image/png');captureRenderer.dispose();return url;
}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
document.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>setModel(b.dataset.model));
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>frame(b.dataset.camera));
document.querySelector('#part').onchange=e=>{if(e.target.value)setModel(e.target.value);};
document.querySelector('#capture').onclick=async()=>{
  const url=capture(currentCamera,1400,1400);
  const response=await fetch('/__rack_preview_image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:`${currentName}-${currentCamera}`,png:url.split(',')[1]})});
  if(response.ok){const saved=await response.json();document.querySelector('#status').textContent=`Image saved: ${saved.path}`;}
  else download(url,`spark-rack-${currentName}-${currentCamera}.png`);
};
new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);if(currentData)frame(currentCamera);}).observe(host);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
await setModel('assembly');
const textResult=value=>({content:[{type:'text',text:JSON.stringify(value)}]});
if(document.modelContext){
  const tools=[
    {name:'inspect_model',description:'Inspect the selected rack assembly or printable part, using the independently validated print meshes.',inputSchema:{type:'object',properties:{}},annotations:{readOnlyHint:true},execute:()=>textResult({variant:currentName,objects:currentData.objects.map(({name,reference,vertices,faces})=>({name,reference,vertices:vertices.length,triangles:faces.length})),checks})},
    {name:'show_model_variant',description:'Switch between the assembly, exploded view, and the actual printable part meshes.',inputSchema:{type:'object',properties:{variant:{type:'string',enum:Object.keys(notes)}},required:['variant']},execute:async input=>{await setModel(input.variant);return textResult({variant:currentName});}},
    {name:'capture_model_view',description:'Render a PNG of the selected model from the requested camera.',inputSchema:{type:'object',properties:{view:{type:'string',enum:['isometric','front','right','top']}},required:['view']},annotations:{readOnlyHint:true},execute:input=>({content:[{type:'image',mimeType:'image/png',data:capture(input.view).split(',')[1]}]})},
    {name:'validate_and_export_stl',description:'Report the independently computed mesh checks. This preview provides 3MF print files and does not export STL.',inputSchema:{type:'object',properties:{download:{type:'boolean',default:false}}},annotations:{readOnlyHint:true},execute:input=>{if(input.download)throw new Error('Use the supplied 3MF print files.');return textResult({downloaded:false,checks,physical_validation:'not yet performed'});}},
  ];
  await Promise.all(tools.map(t=>document.modelContext.registerTool(t)));
  document.querySelector('#status').textContent+=' · Agent tools live';
}
