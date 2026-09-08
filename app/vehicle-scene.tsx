'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import partData from './parts.json';
import {makeLayout,anatomicalOffset,VIEW_DIRECTION} from './explosion';
export type SceneHandle={fit:()=>void;zoom:(factor:number)=>void;view:(name:'front'|'side'|'top'|'perspective')=>void};
type Props={explosion:number;category:string;selected:string;isolate:boolean;rotate:boolean;wireframe:boolean;language:'zh'|'en';onSelect:(id:string)=>void;onReady:(ready:boolean)=>void};
const partMap=new Map(partData.map(p=>[p.id,p]));
const layout=makeLayout(partData);
const VehicleScene=forwardRef<SceneHandle,Props>(function VehicleScene(props,ref){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const engine=useRef<SceneHandle|null>(null);
 const [error,setError]=useState(false),[progress,setProgress]=useState(0),[ready,setReady]=useState(false),[retry,setRetry]=useState(0);
 useImperativeHandle(ref,()=>({fit:()=>engine.current?.fit(),zoom:f=>engine.current?.zoom(f),view:n=>engine.current?.view(n)}),[]);
 useEffect(()=>{
  const el=host.current!;let renderer:THREE.WebGLRenderer;
  setReady(false);setError(false);setProgress(0);latest.current.onReady(false);
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setError(true);return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.02,300);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.16;controls.maxDistance=100;controls.maxPolarAngle=Math.PI*.87;controls.autoRotateSpeed=.6;
  controls.target.set(0,1.12,0);camera.position.copy(controls.target).addScaledVector(VIEW_DIRECTION,9.6);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.03);scene.environment=environment.texture;
  scene.add(new THREE.HemisphereLight(0xf0f5ff,0x86919f,1.5));
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-3,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:20});key.shadow.bias=-.0003;key.shadow.normalBias=.02;scene.add(key);
  const fill=new THREE.DirectionalLight(0xc2d5f1,1.4);fill.position.set(4,3,-5);scene.add(fill);
  const platform=new THREE.Group();scene.add(platform);
  const plinthMat=new THREE.MeshStandardMaterial({color:0xd5dce4,metalness:.35,roughness:.5});
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(3.05,3.12,.085,120),plinthMat);plinth.position.y=-.055;plinth.receiveShadow=true;platform.add(plinth);
  const rimMat=new THREE.MeshStandardMaterial({color:0x8fa0b6,metalness:.8,roughness:.24});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.075,.006,5,160),rimMat);ring.rotation.x=Math.PI/2;ring.position.y=-.016;platform.add(ring);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.ShadowMaterial({color:0x4a5766,opacity:.1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.102;floor.receiveShadow=true;scene.add(floor);
  const assembly=new THREE.Group();scene.add(assembly);
  type Piece={mesh:THREE.Mesh;home:THREE.Vector3;spread:THREE.Vector3;end:THREE.Vector3;category:string;id:string;materials:THREE.MeshStandardMaterial[];size:THREE.Vector3};
  const pieces:Piece[]=[];let cancelled=false,loaded=false,raf=0,last=performance.now(),amount=latest.current.explosion/100,dirty=true,framing=1;
  const pointer=new THREE.Vector2(),ray=new THREE.Raycaster(),down=new Map<number,{x:number;y:number}>();let blockedTap=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fit(direction=VIEW_DIRECTION,immediate=false){
   let center=new THREE.Vector3(0,1.12,0),distance=Math.max(8.8,6.2/camera.aspect);
   const p=latest.current;
   if(p.isolate){
    const visible=pieces.filter(x=>p.selected?x.id===p.selected:p.category==='all'||x.category===p.category);
    const bounds=new THREE.Box3();visible.forEach(x=>bounds.expandByObject(x.mesh));
    if(!bounds.isEmpty()){center=bounds.getCenter(new THREE.Vector3());const size=bounds.getSize(new THREE.Vector3());distance=Math.max(.35,size.length()/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*.7/Math.min(1,camera.aspect))}
   }else{
    const blend=THREE.MathUtils.smoothstep(amount,.38,1),tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const full=Math.max(layout.width/(2*tangent*camera.aspect),layout.height/(2*tangent))*1.15+3;
    center.lerp(new THREE.Vector3(0,1,0),blend);distance=THREE.MathUtils.lerp(distance,full,blend)+Math.sin(amount*Math.PI)*1.2;
   }
   const target=center.clone().addScaledVector(direction,distance);
   camera.position.lerp(target,immediate?1:.12);controls.target.lerp(center,immediate?1:.12);dirty=true;
  }
  engine.current={fit:()=>{fit(VIEW_DIRECTION,true);framing=0},zoom:factor=>{framing=0;camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();dirty=true},view:name=>{framing=0;const d=name==='front'?new THREE.Vector3(-1,.09,0):name==='side'?new THREE.Vector3(0,.08,1):name==='top'?new THREE.Vector3(.001,1,0):VIEW_DIRECTION;fit(d.clone().normalize(),true)}};
  const onStart=()=>{framing=0};controls.addEventListener('start',onStart);
  const dispose=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
  new GLTFLoader().load('/models/model-y.glb',gltf=>{
   if(cancelled){dispose(gltf.scene);return}
   gltf.scene.updateMatrixWorld(true);const nodes:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)nodes.push(o)});
   for(const mesh of nodes){
    const id=mesh.userData.partId||mesh.name,info=partMap.get(id);if(!info)continue;
    assembly.attach(mesh);const materials=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>m.clone() as THREE.MeshStandardMaterial);mesh.material=Array.isArray(mesh.material)?materials:materials[0];
    materials.forEach(m=>{m.envMapIntensity=1.15;m.userData.baseColor=m.color.clone()});mesh.castShadow=true;mesh.receiveShadow=true;
    pieces.push({mesh,home:mesh.position.clone(),spread:anatomicalOffset(info),end:layout.positions.get(id)!.clone(),category:info.category,id,materials,size:new THREE.Vector3(...info.size)});
   }
   dispose(gltf.scene);loaded=true;setReady(true);setProgress(100);latest.current.onReady(true);fit(VIEW_DIRECTION,true);dirty=true;renderer.shadowMap.needsUpdate=true;
  },e=>{if(!cancelled&&e.total)setProgress(Math.round(e.loaded/e.total*100))},()=>{if(!cancelled)setError(true)});
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();framing=.5;dirty=true};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const onDown=(e:PointerEvent)=>{if(e.button!==0)return;if(!down.size)blockedTap=false;down.set(e.pointerId,{x:e.clientX,y:e.clientY});if(down.size>1)blockedTap=true};
  const onMove=(e:PointerEvent)=>{const s=down.get(e.pointerId);if(s&&Math.hypot(e.clientX-s.x,e.clientY-s.y)>6)blockedTap=true};
  const onCancel=(e:PointerEvent)=>{down.delete(e.pointerId);blockedTap=true};
  const onUp=(e:PointerEvent)=>{onMove(e);const tap=down.has(e.pointerId)&&down.size===1&&!blockedTap;down.delete(e.pointerId);if(!tap||!loaded)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);const visible=pieces.filter(p=>p.mesh.visible);const hit=ray.intersectObjects(visible.map(p=>p.mesh),false)[0];if(hit)latest.current.onSelect(hit.object.userData.partId||hit.object.name);else latest.current.onSelect('')};
  const lost=(e:Event)=>{e.preventDefault();setError(true);latest.current.onReady(false)};
  const canvas=renderer.domElement;canvas.style.touchAction='none';canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onCancel);canvas.addEventListener('webglcontextlost',lost);
  let stateKey='',previousAmount=-1;const oldPos=new THREE.Vector3(),oldQuat=new THREE.Quaternion();
  const selectionOutline=new THREE.Box3Helper(new THREE.Box3(),0x365de4);scene.add(selectionOutline);selectionOutline.visible=false;
  function frame(now:number){
   raf=requestAnimationFrame(frame);if(document.hidden)return;const dt=Math.min((now-last)/1000,.06);last=now;const p=latest.current;
   if(previousAmount!==p.explosion){previousAmount=p.explosion;framing=.85}
   const oldAmount=amount;amount=reduced?p.explosion/100:THREE.MathUtils.damp(amount,p.explosion/100,7,dt);if(Math.abs(amount-p.explosion/100)<.0001)amount=p.explosion/100;
   const key=[p.category,p.selected,p.isolate,p.wireframe,p.rotate].join('|'),changed=key!==stateKey||oldAmount!==amount||dirty;
   if(key!==stateKey){if(p.isolate||stateKey.includes('true'))framing=.7;stateKey=key}
   if(changed&&loaded){
    const full=THREE.MathUtils.smoothstep(amount,.38,1),structure=THREE.MathUtils.smoothstep(amount,0,.5);
    for(const piece of pieces){
     piece.mesh.position.copy(piece.home).addScaledVector(piece.spread,structure).lerp(piece.end,full);
     const matches=p.category==='all'||piece.category===p.category,selected=p.selected===piece.id;
     piece.mesh.visible=!p.isolate||(p.selected?selected:matches);
     piece.materials.forEach(m=>{m.wireframe=p.wireframe;const transparent=!matches&&!selected&&!p.isolate;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true}m.opacity=m.transparent?.095:1;m.depthWrite=!m.transparent;m.emissive.set(selected?0x2b4edb:0x000000);m.emissiveIntensity=selected?.25:0});
    }
    const selected=pieces.find(x=>x.id===p.selected);selectionOutline.visible=!!selected&&selected.mesh.visible;
    if(selected){selectionOutline.box.setFromObject(selected.mesh);selectionOutline.box.expandByScalar(.014)}
    platform.visible=amount<.06&&!p.isolate;floor.visible=amount<.1&&!p.isolate;renderer.shadowMap.enabled=amount<.06&&!p.isolate;if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;
   }
   if(framing>0&&loaded){fit();framing-=dt}
   controls.autoRotate=p.rotate&&!reduced;controls.update();
   const cameraMoved=camera.position.distanceToSquared(oldPos)>1e-10||1-Math.abs(camera.quaternion.dot(oldQuat))>1e-10;
   if(changed||cameraMoved){renderer.render(scene,camera);oldPos.copy(camera.position);oldQuat.copy(camera.quaternion);dirty=false}
  }
  raf=requestAnimationFrame(frame);
  return()=>{cancelled=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();engine.current=null;canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onCancel);canvas.removeEventListener('webglcontextlost',lost);dispose(scene);selectionOutline.geometry.dispose();(selectionOutline.material as THREE.Material).dispose();environment.dispose();room.dispose();pmrem.dispose();renderer.dispose();canvas.remove()};
 },[retry]);
 const zh=props.language==='zh';
 return <div className="scene-host" ref={host} role="region" aria-label={zh?'可拖动的 Model Y 3D 模型；也可使用旁边的部件目录选择。':'Interactive Model Y. Drag to orbit or select a part from the component directory.'}>
 {!ready&&!error&&<div className="model-loading" role="status"><span className="loading-line"><i style={{width:`${progress}%`}}/></span><b>{zh?'正在加载 Model Y':'Loading Model Y'} <span>{progress}%</span></b><small>{zh?'397 个部件，即将呈现':'397 individual pieces, coming into view'}</small></div>}
 {error&&<div className="model-loading model-error" role="alert"><b>{zh?'3D 视图暂时无法加载':'The 3D view could not load'}</b><p>{zh?'请重试；如仍无法显示，请在浏览器设置中开启硬件加速。':'Try again. If the issue persists, enable hardware acceleration in your browser.'}</p><button onClick={()=>setRetry(v=>v+1)}>{zh?'重新加载模型':'Reload model'}</button></div>}
 </div>;
});
export default VehicleScene;
