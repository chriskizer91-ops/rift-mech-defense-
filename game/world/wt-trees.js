'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: TREES (game/world/wt-trees.js)
   Ironhowl 3's oak (borrowed/ironhowl4/models/trees: tree_oak and its far copy, tree_oak_far), drawn as instances: the
   full oak within 60 m of the Wraith, the far oak out to 300 m, re-chosen whenever the Wraith has moved 15 m.
   Field 1's tree lines and groves come from wt-fields.js (MAP.def.TREES). The coast has none.
   ===================================================================================================================== */
const TREE={near:[],far:[],shown:0,cx:1e9,cz:1e9,NEAR:30,FAR:1000};
function treesInit(scene){if(WT.phone){TREE.NEAR=16;TREE.FAR=520;}const L=MAP.def.TREES;if(!L||!L.length||!window.WT_ASSETS.glb.oak)return;
  const parts=(sc,cap,list)=>{sc.updateMatrixWorld(true);sc.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
    const m=o.material;m.vertexColors=!!g.attributes.color;const im=new THREE.InstancedMesh(g,m,cap);im.count=0;im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
    const fol=/fol/i.test(m.name||'');im.userData.mats=[m,matMeshView(1,{k:fol?.5:.8}),matMeshView(2,{heat:fol?.17:.22})];VIEWED.push(im);scene.add(im);list.push(im);});};
  Promise.all(['oak','oakfar'].map(k=>glbRaw(k))).then(([n,f])=>{parts(n,TREE.NEAR,TREE.near);parts(f,TREE.FAR,TREE.far);for(const im of TREE.far)im.castShadow=false;TREE.cx=1e9;if(WT.view)setView(WT.view);});}
/* a model with its own materials (the trees carry vertex colours, no pictures) */
function glbRaw(key){const A=window.WT_ASSETS.glb[key];
  return Promise.resolve(b64bytes(A.b64))
   .then(b=>new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
   .then(buf=>new Promise((ok,no)=>new THREE.GLTFLoader().parse(buf,'',g=>ok(g.scene),no)));}
const _tm=new THREE.Matrix4(),_tq=new THREE.Quaternion(),_tv=new THREE.Vector3(),_ts=new THREE.Vector3(),_ty=new THREE.Vector3(0,1,0);
function treesFollow(x,z){if(!TREE.near.length||Math.hypot(x-TREE.cx,z-TREE.cz)<15)return;TREE.cx=x;TREE.cz=z;
  const L=MAP.def.TREES,c=[];for(const t of L){const d=Math.abs(t.x-x)+Math.abs(t.z-z);if(d<420)c.push([d,t]);}c.sort((a,b)=>a[0]-b[0]);
  let nN=0,nF=0;
  for(const [d,t] of c){const near=d<55&&nN<TREE.NEAR;if(!near&&nF>=TREE.FAR)break;
    _tq.setFromAxisAngle(_ty,t.r);_ts.setScalar(t.s*(near?.95:1.25));_tv.set(t.x,t.y-.3,t.z);_tm.compose(_tv,_tq,_ts);
    for(const im of near?TREE.near:TREE.far)im.setMatrixAt(near?nN:nF,_tm);if(near)nN++;else nF++;}
  for(const im of TREE.near){im.count=nN;im.instanceMatrix.needsUpdate=true;}for(const im of TREE.far){im.count=nF;im.instanceMatrix.needsUpdate=true;}
  TREE.shown=nN+nF;}
/* trunks the Wraith walks into */
function treeBump(x,z,r){if(!MAP.def.TREES)return [x,z];for(const t of MAP.def.TREES){const dx=x-t.x,dz=z-t.z;if(Math.abs(dx)>3||Math.abs(dz)>3)continue;const d=Math.hypot(dx,dz),m=r+.5;if(d<m&&d>1e-4){x=t.x+dx/d*m;z=t.z+dz/d*m;}}return [x,z];}
