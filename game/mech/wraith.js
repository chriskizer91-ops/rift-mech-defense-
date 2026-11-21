/* mech/wraith.js — the Wraith, from Ironhowl 4 (05_wraith).
   The combat model and its kit are the Wraith V2 HD set (borrowed/ironhowl4/m4/, packed into the page by systems/build.py).
   The Wraith's empties are its joints: hips > thigh/knee/hock/ankle (legs), torso > arm/elbow/wrist, head, and five mounts:
   fa_L, fa_R (forearms), sh_L, sh_R (shoulders), bk (back). Every kit piece has an empty called `mount`: it is placed on the
   Wraith's mount of its slot, so nothing is positioned by hand.
   Changes from Ironhowl 4: no bay and no pilot levels (the loadout comes from the arena's upgrade screen), no drone for now,
   plain three.js materials (no Ironhowl world hook), flat ground. The walk, leg solve, muzzles and jet flames are Ironhowl 4's. */
const KIT={
  ac:{L:'ac_L',R:'ac_R',orm:'ac_combat_orm',slot:'fa',name:'AC-4 AUTOCANNON'},
  ln:{L:'ln_L',R:'ln_R',orm:'ln_combat_orm',slot:'fa',name:'LN-1 LANCE'},
  ar:{L:'ar_L',R:'ar_R',orm:'ar_combat_orm',slot:'fa',name:'AR-1 ARC'},
  mpod:{stem:'mpod',slot:'sh',name:'MP-9 MISSILE POD'},watcher:{stem:'watcher',slot:'sh',name:'WT-1 WATCHER'},
  jetpack:{stem:'jetpack',slot:'bk',name:'JP-2 JET PACK'}};
const SLOTS=['fa_L','fa_R','sh_L','sh_R','bk'];
const LOAD_DEF={fa_L:'ac',fa_R:'ac',sh_L:'watcher',sh_R:'mpod',bk:'jetpack'};
function loadout(){let s={};try{s=JSON.parse(store.get('loadout','{}'))||{};}catch(e){}return Object.assign({},LOAD_DEF,s);}
function setLoadout(L){store.set('loadout',JSON.stringify(L));}
function kitStem(id,slot){const k=KIT[id];return k.stem||(slot&&slot.endsWith('_R')?k.R:k.L);}
function kitFiles(stem,orm){return {glb:stem+'_combat.glb',map:stem+'_combat_albedo.webp',nrm:stem+'_combat_normal.webp',orm:(orm||stem+'_combat_orm')+'.webp'};}
const KMAT={};
function kitMat(f){if(KMAT[f.map])return KMAT[f.map];
  return KMAT[f.map]=new THREE.MeshStandardMaterial({map:assetTex(f.map,{glb:1}),normalMap:assetTex(f.nrm,{glb:1,lin:1}),roughnessMap:assetTex(f.orm,{glb:1,lin:1}),metalnessMap:assetTex(f.orm,{glb:1,lin:1}),roughness:1,metalness:1});}
function dressModel(sc,mat){sc.traverse(o=>{if(o.isMesh){o.material=mat;o.castShadow=o.receiveShadow=true;}});return sc;}
/* put a kit piece on a mount: the piece's own `mount` empty lands exactly on the host's mount */
function onMount(host,sc){sc.updateMatrixWorld(true);const mt=sc.getObjectByName('mount');
  const hold=new THREE.Group();hold.name='kit';host.add(hold);
  if(mt){const inv=mt.matrixWorld.clone().invert();inv.decompose(sc.position,sc.quaternion,sc.scale);}
  hold.add(sc);return hold;}
function buildWraithModel(L){
  const W={root:new THREE.Group(),J:{},holds:{},kit:{}};const wf=kitFiles('wraith_v2');
  return loadGLB(wf.glb).then(sc=>{dressModel(sc,kitMat(wf));W.root.add(sc);sc.traverse(o=>{if(o.name)W.J[o.name]=W.J[o.name]||o;});W.body=sc;
    return refitModel(W,L||loadout());}).then(()=>W);}
function refitModel(W,L){const gen=W.gen=(W.gen||0)+1;   /* a newer refit wins: pieces an older one loads late are dropped */
  for(const s in W.holds){const h=W.holds[s];if(h&&h.parent)h.parent.remove(h);}W.holds={};W.kit={};
  const jobs=SLOTS.filter(s=>L[s]&&KIT[L[s]]).map(s=>{const id=L[s],k=KIT[id],stem=kitStem(id,s),f=kitFiles(stem,k.orm);
    return loadGLB(f.glb).then(sc=>{if(W.gen!==gen)return;dressModel(sc,kitMat(f));W.holds[s]=onMount(W.J[s],sc);W.kit[s]=id;});});
  return Promise.all(jobs);}

/* ---------------- the Wraith in the arena ---------------- */
const MT={flame:new THREE.MeshBasicMaterial({color:new THREE.Color(1,.46,.16).multiplyScalar(1.6),transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}),
  flame2:new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.7,1).multiplyScalar(2),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})};
/* L: a fixed loadout (the wingmates); none = the player's, from the upgrade screen */
function buildMech(L){
  const M={root:new THREE.Group(),ready:false,phase:0,lean:0,roll:0,tier:0,arms:[],pods:[],jets:[],wing:!!L};S.add(M.root);
  M.loaded=buildWraithModel(L).then(W=>{M.W=W;M.root.add(W.root);const J=W.J;
    M.hips=J.hips;M.torso=J.torso;M.head=J.head;M.hip0=J.hips.position.y;M.tor0=J.torso.position.y;
    W.root.updateMatrixWorld(true);M.legs=[-1,1].map(sd=>legSetup(J,sd<0?'L':'R',sd,M.hip0));
    if(!L){M.jl=new THREE.PointLight(0xff9a40,0,14,1.8);M.jl.position.set(0,0,1.6);M.torso.add(M.jl);}   /* the jet light: the player's only (lights cost on a phone) */
    M.rest=[M.hips,M.torso,J.arm_L,J.arm_R].filter(Boolean).map(o=>[o,o.rotation.clone()]);
    rigKit(M);M.ready=true;M.tier=0;setTier(M,L?1:GUN.tier||1);});
  return M;
}
/* after the upgrade screen changes the loadout */
function refitKit(M){if(!M||!M.W)return Promise.resolve();M.ready=false;
  const p=refitModel(M.W,loadout()),gen=M.W.gen,done=()=>{if(M.W.gen!==gen)return;rigKit(M);M.ready=true;const t=M.tier;M.tier=0;setTier(M,t||GUN.tier||1);};
  return p.then(done,e=>{console.warn('refit',e);done();});}
function kitHas(id){if(!M||!M.W)return false;const K=M.W.kit;for(const k in K)if(K[k]===id)return true;return false;}
/* muzzles, missile tubes and jet nozzles from the fitted kit */
const JETG=[];
function rigKit(M){const W=M.W,_p=new THREE.Vector3();
  /* measure in the standing pose: a turned torso or raised arm would put the muzzle on the side of the weapon */
  const now=(M.rest||[]).map(([o,r])=>{const c=o.rotation.clone();o.rotation.copy(r);return [o,c];});W.root.updateMatrixWorld(true);
  M.arms=['fa_L','fa_R'].map((s,i)=>{const hold=W.holds[s],arm=W.J[i?'arm_R':'arm_L'];if(!hold)return {sh:arm,muzzle:arm,hold:null,kick:0,sd:i?1:-1};
    const q=new THREE.Quaternion();W.root.getWorldQuaternion(q);const wf=new THREE.Vector3(0,0,-1).applyQuaternion(q);
    hold.parent.getWorldQuaternion(q);const fwd=wf.applyQuaternion(q.invert()).normalize();
    const bb=localBox(hold),mz=new THREE.Object3D();hold.add(mz);bb.getCenter(_p);
    const ax=['x','y','z'].sort((a,b)=>Math.abs(fwd[b])-Math.abs(fwd[a]))[0];_p[ax]=fwd[ax]>0?bb.max[ax]:bb.min[ax];mz.position.copy(_p);
    return {sh:arm,muzzle:mz,hold,base:hold.position.clone(),fwd,kick:0,sd:i?1:-1,kind:W.kit[s]};});
  M.ac=M.arms.filter(a=>!a.kind||a.kind==='ac');
  M.pods=[];for(let i=0;i<9;i++)for(const s of ['sh_R','sh_L']){const h=W.holds[s];if(h&&W.kit[s]==='mpod'){const t=h.getObjectByName('tube'+i);if(t)M.pods.push(t);}}
  if(!M.pods.length)M.pods=[W.J.sh_R,W.J.sh_L];
  for(const J of M.jets){J.f1.parent&&J.f1.parent.remove(J.f1);J.f2.parent&&J.f2.parent.remove(J.f2);}
  M.jets=[];const jp=W.holds.bk;if(!JETG.length)JETG.push(new THREE.CylinderGeometry(.22,.02,1,10,1,true),new THREE.CylinderGeometry(.12,.01,1,8,1,true));
  for(const s of ['R','L']){const n=jp&&jp.getObjectByName('exhaust_'+s);if(!n)continue;
    const f1=new THREE.Mesh(JETG[0],MT.flame);f1.castShadow=false;n.add(f1);
    const f2=new THREE.Mesh(JETG[1],MT.flame2);f2.castShadow=false;n.add(f2);M.jets.push({n,f1,f2});}
  for(const [o,c] of now)o.rotation.copy(c);W.root.updateMatrixWorld(true);
}
function localBox(g){const bb=new THREE.Box3(),inv=new THREE.Matrix4(),m=new THREE.Matrix4();g.updateMatrixWorld(true);inv.copy(g.matrixWorld).invert();
  g.traverse(o=>{if(!o.isMesh)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox.clone().applyMatrix4(m.multiplyMatrices(inv,o.matrixWorld)));});return bb;}
/* gun tiers: the autocannon carries all four barrel sets (t1_ .. t4_); show the chosen one */
function setTier(M,t){if(!M.ready||!M.W||M.tier===t)return;M.tier=t;
  for(const s of ['fa_L','fa_R']){const h=M.W.holds[s];if(h&&M.W.kit[s]==='ac')h.traverse(o=>{const m=/^t(\d)_/.exec(o.name||'');if(m)o.visible=+m[1]===t;});}}
/* ---------------- walking: each foot stays planted while the body moves over it (Ironhowl 4, unchanged) ---------------- */
const _ang=v=>Math.atan2(v.z,v.y),_wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function legSetup(J,s,sd,hip0){const w=n=>{const v=new THREE.Vector3();J[n+'_'+s].getWorldPosition(v);return v;};
  const H=w('thigh'),K=w('knee'),Hk=w('hock'),A=w('ankle');
  const t0={y:K.y-H.y,z:K.z-H.z},s0={y:Hk.y-K.y,z:Hk.z-K.z},m0={y:A.y-Hk.y,z:A.z-Hk.z},P0={y:t0.y+m0.y,z:t0.z+m0.z};
  const L={s,sd,thigh:J['thigh_'+s],knee:J['knee_'+s],hock:J['hock_'+s],ankle:J['ankle_'+s],Hy:H.y-hip0,Hz:H.z,Ay:A.y,Az:A.z,ox:A.x,P:P0,Q:s0,
    lp:Math.hypot(P0.y,P0.z),lq:Math.hypot(s0.y,s0.z),sign:1,plant:true,gy:0};
  L.reach=H.y-A.y;
  L.sign=[1,-1].map(g=>[g,legSolve(L,{y:P0.y+s0.y,z:P0.z+s0.z},g)]).sort((a,b)=>(Math.abs(a[1].a)+Math.abs(a[1].b))-(Math.abs(b[1].a)+Math.abs(b[1].b)))[0][0];
  return L;}
function legSolve(l,D,sg){let d=Math.hypot(D.y,D.z);d=Math.min((l.lp+l.lq)*.995,Math.max(Math.abs(l.lp-l.lq)*1.01,d));
  const phD=_ang(D),g=Math.acos(clamp((l.lp*l.lp+d*d-l.lq*l.lq)/(2*l.lp*d),-1,1)),phP=phD+sg*g;
  const Pp={y:Math.cos(phP)*l.lp,z:Math.sin(phP)*l.lp},Qp={y:Math.cos(phD)*d-Pp.y,z:Math.sin(phD)*d-Pp.z};
  return {a:_wrap(phP-_ang(l.P)),b:_wrap(_ang(Qp)-_ang(l.Q))};}
/* pose the Wraith for this frame. st: {x,z,gy,legYaw,aimYaw,spd (m/s along the legs, minus = backwards),air,vy,land,thrust,pitch}
   returns foot-plant events [{x,z,side}] for sound, dust and shake */
function poseMech(M,st,dt){
  const ev=[];if(!M.ready)return ev;
  const sp=Math.abs(st.spd),sf=clamp(sp/7.5,0,1),w=smooth(.15,1.4,sp),S_=lerp(1.3,3.2,sf);
  if(!st.air)M.phase+=st.spd*dt/(2*S_);
  const cy=Math.cos(st.legYaw),sy=Math.sin(st.legYaw),comp=st.land*.6;
  const bob=st.air?0:Math.abs(Math.sin(M.phase*TAU))*.1*w;
  const hipY=st.gy+M.hip0-bob-comp-(st.air?0:.05*w);
  M.root.position.set(st.x,0,st.z);
  M.hips.position.y=hipY;M.torso.position.y=hipY+(M.tor0-M.hip0);
  M.hips.rotation.y=st.legYaw;M.torso.rotation.y=st.aimYaw;
  M.lean+=((st.air?-.1:-.05*sf*Math.sign(st.spd||1))+st.land*.25-M.lean)*damp(6,dt);
  M.roll+=((st.air?0:Math.sin(M.phase*TAU)*.025*w)-M.roll)*damp(8,dt);
  M.torso.rotation.x=M.lean;M.torso.rotation.z=M.roll;M.hips.rotation.z=M.roll*.6;
  for(const L of M.legs){
    let tz=0,lift=0,pitch=0;
    if(st.air){tz=-.2+L.sd*.1;lift=.55+(st.vy>0?.25:0);}
    else{let u=(M.phase+(L.sd>0?.5:0))%1;if(u<0)u+=1;
      if(u<.5){tz=lerp(-S_/2,S_/2,u/.5);}else{const s=(u-.5)/.5;tz=lerp(S_/2,-S_/2,s*s*(3-2*s));lift=Math.sin(Math.PI*s)*.5*w;pitch=-.3*Math.sin(Math.PI*s)*w;}
      tz*=w;const nowPlant=u<.5;if(nowPlant&&!L.plant&&w>.3)ev.push({side:L.sd});L.plant=nowPlant;}
    const fx=st.x+L.ox*cy+tz*sy,fz=st.z-L.ox*sy+tz*cy;L.gy=st.air?st.gy:hgt(fx,fz);
    const D={y:(st.air?-L.reach*.82+lift:(L.gy+L.Ay+lift)-(hipY+L.Hy)),z:(L.Az+tz)-L.Hz};
    const r=legSolve(L,D,L.sign);
    L.thigh.rotation.x=r.a;L.knee.rotation.x=r.b-r.a;L.hock.rotation.x=r.a-r.b;L.ankle.rotation.x=-r.a+(st.air?.3:pitch);
    const e=ev[ev.length-1];if(e&&e.side===L.sd&&e.x===undefined){e.x=fx;e.z=fz;}
  }
  for(const A of M.arms){A.kick*=Math.exp(-dt*16);if(A.sh)A.sh.rotation.x=st.pitch*.85+Math.sin(M.phase*TAU+(A.sd>0?Math.PI:0))*.04*w;
    if(A.hold)A.hold.position.copy(A.base).addScaledVector(A.fwd,-A.kick*.28);}
  const th=st.thrust,fl=.6+Math.random()*.4;
  for(const J of M.jets){J.f1.visible=J.f2.visible=th>.02;const l1=(.5+th*1.6)*fl,l2=(.35+th*.95)*fl;J.f1.scale.set(1,l1,1);J.f1.position.y=.15+.5*l1;
    J.f2.scale.set(1,l2,1);J.f2.position.y=.15+.5*l2;}
  if(M.jl)M.jl.intensity=th*60*fl;
  return ev;
}
