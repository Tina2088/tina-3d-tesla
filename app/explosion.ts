import * as THREE from 'three';
export const VIEW_DIRECTION = new THREE.Vector3(-6,2.8,6.4).normalize();
export type BoundPart = {id:string;center:number[];size:number[];category:string};
export function makeLayout(parts:BoundPart[]) {
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),VIEW_DIRECTION).normalize();
 const up=new THREE.Vector3().crossVectors(VIEW_DIRECTION,right).normalize();
 const cards=parts.map(p=>({p,w:Math.max(.16,p.size.reduce((s,v,i)=>s+Math.abs(right.getComponent(i))*v,0))+.18,h:Math.max(.14,p.size.reduce((s,v,i)=>s+Math.abs(up.getComponent(i))*v,0))+.18})).sort((a,b)=>a.p.category.localeCompare(b.p.category)||b.h-a.h||a.p.id.localeCompare(b.p.id));
 const width=Math.max(10,Math.sqrt(cards.reduce((s,c)=>s+c.w*c.h,0)*1.5));
 let x=0,y=0,row=0;
 const cells=cards.map(c=>{if(x+c.w>width&&x>0){x=0;y+=row;row=0}const v={...c,x:x+c.w/2,y:y+c.h/2};x+=c.w;row=Math.max(row,c.h);return v});
 const height=y+row;
 const positions=new Map(cells.map(c=>[c.p.id,right.clone().multiplyScalar(c.x-width/2).addScaledVector(up,height/2-c.y).add(new THREE.Vector3(0,1,0))]));
 return {positions,width,height,cells,right,up};
}
export function anatomicalOffset(p:BoundPart){
 const [x,y,z]=p.center;
 const lift:Record<string,number>={body:.55,glass:1.6,cabin:.5,lights:.2,wheels:-.04};
 return new THREE.Vector3(x*.32,(lift[p.category]??0)+(y-.7)*.16,z*(p.category==='wheels'?1.05:.8));
}
