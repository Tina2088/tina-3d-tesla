import json,struct,collections,sys
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
import fast_simplification
SRC=Path(sys.argv[1])
OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
g=json.loads((SRC/'scene.gltf').read_text());blob=(SRC/'scene.bin').read_bytes()
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];cols={'VEC3':3,'VEC2':2,'SCALAR':1,'VEC4':4}[a['type']];dtype={5126:np.float32,5123:np.uint16,5125:np.uint32}[a['componentType']];offset=v.get('byteOffset',0)+a.get('byteOffset',0)
 return np.ndarray((a['count'],cols),dtype=dtype,buffer=blob,offset=offset,strides=(v.get('byteStride',np.dtype(dtype).itemsize*cols),np.dtype(dtype).itemsize)).copy()
groups=collections.defaultdict(list)
def walk(i,parent):
 n=g['nodes'][i];m=parent@np.array(n.get('matrix',np.eye(4).flatten(order='F'))).reshape(4,4,order='F')
 if 'mesh' in n:
  for p in g['meshes'][n['mesh']]['primitives']:
   v=acc(p['attributes']['POSITION']);v=v@m[:3,:3].T+m[:3,3]
   no=acc(p['attributes']['NORMAL']);no=no@np.linalg.inv(m[:3,:3]);no/=np.maximum(np.linalg.norm(no,axis=1,keepdims=True),1e-12)
   # Normalize to meters, front at negative X, Y-up.
   v=np.column_stack((-v[:,2],v[:,1],v[:,0]));no=np.column_stack((-no[:,2],no[:,1],no[:,0]))
   groups[(n['name'],p['material'])].append((v,no,acc(p['indices']).reshape(-1,3)))
 for j in n.get('children',[]):walk(j,m)
walk(0,np.eye(4))
allv=np.concatenate([v for group in groups.values() for v,_,_ in group]);mi=allv.min(0);ma=allv.max(0);scale=4.75/(ma[0]-mi[0]);origin=np.array([(mi[0]+ma[0])/2,mi[1],(mi[2]+ma[2])/2])
print('original bounds',mi,ma,'scale',scale,flush=True)
materials=g['materials']
for m in materials:
 name=m['name'];p=m['pbrMetallicRoughness'];p['roughnessFactor']=.35;p['metallicFactor']=.65
 if name=='body':p.update(baseColorFactor=[.47,.53,.61,1],metallicFactor=.72,roughnessFactor=.24);m['extensions']={'KHR_materials_clearcoat':{'clearcoatFactor':1,'clearcoatRoughnessFactor':.2}}
 elif name=='glass_body':p.update(baseColorFactor=[.028,.046,.065,1],metallicFactor=.65,roughnessFactor=.12)
 elif name=='tires':p.update(baseColorFactor=[.018,.022,.028,1],metallicFactor=.05,roughnessFactor=.85)
 elif name=='interior':p.update(baseColorFactor=[.085,.092,.108,1],metallicFactor=.02,roughnessFactor=.68)
 elif name.startswith('black') or name=='fenders':p.update(baseColorFactor=[.025,.032,.04,1],metallicFactor=.25,roughnessFactor=.45)
 elif 'rear_lights' in name:p.update(baseColorFactor=[.3,.006,.016,1],metallicFactor=.35,roughnessFactor=.2)
 elif 'glass' in name:p.update(baseColorFactor=[.68,.78,.88,1],metallicFactor=.45,roughnessFactor=.14)
 elif 'calipers' in name:p.update(baseColorFactor=[.4,.055,.028,1],metallicFactor=.45,roughnessFactor=.3)
 elif name=='wheels':p.update(baseColorFactor=[.23,.26,.31,1],metallicFactor=.85,roughnessFactor=.24)
 m['doubleSided']=True
result={'asset':{'version':'2.0','generator':'Tina 3D Tesla — Model Y CC-BY mesh-island preparation','copyright':'Tesla Model Y 2021 by 763468712, CC BY 4.0'},'extensionsUsed':['KHR_materials_clearcoat'],'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':materials,'accessors':[],'bufferViews':[],'buffers':[]}
binary=bytearray();catalog=[]
def attribute(a,typ,component):
 a=np.ascontiguousarray(a);offset=len(binary);binary.extend(a.tobytes());binary.extend(bytes((-len(binary))%4));vi=len(result['bufferViews']);result['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes});i=len(result['accessors']);entry={'bufferView':vi,'componentType':component,'count':len(a),'type':typ}
 if typ=='VEC3':entry.update(min=a.min(0).astype(float).tolist(),max=a.max(0).astype(float).tolist())
 result['accessors'].append(entry);return i

def add_piece(v,n,f,mat,source):
 v=(v-origin)*scale
 if len(f)>1000:
  # Position welding before quadric simplification prevents UV seams becoming cracks.
  unique, inv=np.unique(np.round(v,6),axis=0,return_inverse=True);f2=inv[f]
  vv,ff=fast_simplification.simplify(unique,f2,target_reduction=.72,agg=5)
  if len(ff)>0:
   v=vv;f=ff;n=np.zeros_like(v);fn=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
   for k in range(3):np.add.at(n,f[:,k],fn)
   n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
 center=(v.min(0)+v.max(0))/2;size=v.max(0)-v.min(0);v-=center
 mn=materials[mat]['name']
 cat='wheels' if mn in ['wheels','tires','calipers','calipers2','brakedsk'] or int(source.split('_')[0])<34 else 'glass' if mn=='glass_body' else 'cabin' if mn=='interior' else 'lights' if 'lights' in mn or 'rear' in mn else 'body'
 labels={'body':('车身构件','Body component'),'glass':('玻璃构件','Glazing component'),'cabin':('座舱构件','Cabin component'),'lights':('灯组构件','Lighting component'),'wheels':('车轮构件','Wheel component')}
 number=len(catalog)+1;id=f'MY-{number:03d}';zh,en=labels[cat]
 if mn=='tires':zh,en='轮胎','Tire'
 elif mn=='wheels':zh,en='轮辋构件','Wheel rim'
 elif 'calipers' in mn:zh,en='制动卡钳构件','Brake caliper'
 elif mn=='brakedsk':zh,en='制动盘构件','Brake disc'
 elif mn=='body':zh,en='车身面板','Body panel'
 pos=attribute(v.astype('<f4'),'VEC3',5126);normal=attribute(n.astype('<f4'),'VEC3',5126);ind=attribute(f.reshape(-1).astype('<u4'),'SCALAR',5125)
 idx=len(result['nodes']);result['scenes'][0]['nodes'].append(idx);result['nodes'].append({'name':id,'mesh':idx,'translation':center.tolist(),'extras':{'partId':id,'category':cat,'source':source,'material':mn}});result['meshes'].append({'name':id,'primitives':[{'attributes':{'POSITION':pos,'NORMAL':normal},'indices':ind,'material':mat}]})
 catalog.append({'id':id,'category':cat,'zh':zh,'en':en,'source':source,'material':mn,'center':np.round(center,5).tolist(),'size':np.round(size,5).tolist(),'triangles':len(f)})

for (name,mat),items in groups.items():
 offset=0;vs=[];ns=[];fs=[]
 for v,n,f in items:vs.append(v);ns.append(n);fs.append(f+offset);offset+=len(v)
 v=np.concatenate(vs);n=np.concatenate(ns);f=np.concatenate(fs)
 # Connectivity is determined by shared positions, including original material seams.
 u,inv=np.unique(np.round(v,7),axis=0,return_inverse=True);fi=inv[f]
 rows=np.concatenate([fi[:,0],fi[:,1],fi[:,2]]);cols=np.concatenate([fi[:,1],fi[:,2],fi[:,0]])
 graph=coo_matrix((np.ones(len(rows)),(rows,cols)),shape=(len(u),len(u)))
 count,labs=connected_components(graph,directed=False);fl=labs[fi[:,0]]
 small=[];chunks=[]
 for j in range(count):
  faces=f[fl==j]
  if len(faces)<8:small.extend(faces.tolist());continue
  ids=np.unique(faces);size=(v[ids].max(0)-v[ids].min(0))*scale
  if np.max(size)<.008:small.extend(faces.tolist());continue
  chunks.append(faces)
 if small:chunks.append(np.array(small))
 for faces in chunks:
  ids,remap=np.unique(faces,return_inverse=True);add_piece(v[ids].copy(),n[ids].copy(),remap.reshape(-1,3),mat,name)
 print(name,len(chunks),'total',len(catalog),flush=True)
result['buffers']=[{'byteLength':len(binary)}];j=json.dumps(result,separators=(',',':')).encode();j+=b' '*((-len(j))%4);glb=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
(OUT/'model-y.glb').write_bytes(glb);(OUT/'parts.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8');(OUT/'license.txt').write_text((SRC/'license.txt').read_text()+'\nAdaptations by Tina 3D Tesla: normalization, connected mesh-island separation, polygon reduction, studio materials. Mesh islands are not verified Tesla service parts.\n')
print('DONE',len(catalog),'parts',len(glb),'bytes',sum(p['triangles'] for p in catalog),'triangles',collections.Counter(p['category'] for p in catalog),flush=True)

