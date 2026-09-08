import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {makeLayout,VIEW_DIRECTION} from '../app/explosion.ts';
const parts=JSON.parse(fs.readFileSync(new URL('../app/parts.json',import.meta.url),'utf8'));
assert.equal(parts.length,397);assert.equal(new Set(parts.map(p=>p.id)).size,397);
for(const p of parts){assert(p.triangles>0);assert(p.center.every(Number.isFinite));assert(p.size.every(x=>Number.isFinite(x)&&x>=0))}
const layout=makeLayout(parts);
for(let i=0;i<layout.cells.length;i++)for(let j=i+1;j<layout.cells.length;j++){
 const a=layout.cells[i],b=layout.cells[j];
 assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2-1e-6||Math.abs(a.y-b.y)>=(a.h+b.h)/2-1e-6,`Overlapping layout: ${a.p.id}/${b.p.id}`);
}
for(const aspect of [2,1.2,.65]){
 const camera=new THREE.PerspectiveCamera(36,aspect,.02,300),target=new THREE.Vector3(0,1,0),tan=Math.tan(THREE.MathUtils.degToRad(18));
 const distance=Math.max(layout.width/(2*tan*aspect),layout.height/(2*tan))*1.15+3;
 camera.position.copy(target).addScaledVector(VIEW_DIRECTION,distance);camera.lookAt(target);camera.updateMatrixWorld();
 for(const p of parts)for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5]){
  const v=layout.positions.get(p.id).clone().add(new THREE.Vector3(x*p.size[0],y*p.size[1],z*p.size[2])).project(camera);
  assert(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z<1,`${p.id} outside ${aspect} view`);
 }
}
const bytes=fs.readFileSync(new URL('../public/models/model-y.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let meshes=0,triangles=0;const found=new Set();gltf.scene.traverse(o=>{if(o.isMesh){meshes++;found.add(o.userData.partId);const pos=o.geometry.attributes.position;for(let i=0;i<pos.array.length;i++)assert(Number.isFinite(pos.array[i]));triangles+=o.geometry.index.count/3;}});
assert.equal(meshes,397);for(const p of parts)assert(found.has(p.id));
console.log(`PASS: ${meshes} selectable meshes, ${triangles} triangles, unique IDs, finite geometry, collision-free final packing, camera coverage at 3 aspect ratios.`);
