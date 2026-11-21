'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: THE WRAITH (game/world/wt-mech.js)
   Ironhowl 4's Wraith (borrowed/ironhowl4: the Wraith V2 HD combat model, its jet pack and two autocannons) and its
   walk: loadGLB, onMount, legSetup, legSolve and poseMech are Ironhowl 4's 05_wraith.js, copied. The feet stand on this
   world's ground (hgt: the ground as made plus the soil), so a planted foot sits in its own print.
   New here (decided): WADING. Water slows the Wraith by its depth; it pushes a bow wave and leaves rings. Past about
   hip depth (its hips are 3.5 m up; the Wraith is 6.6 m) it can't walk on into deeper water; the jet pack is the way
   across (a stub here: hold HOVER).
   Walking speed, the jet hover's height and speed are Ironhowl 4's (06_player.js: WALK 7.5 m/s, HOV.speed 9 m/s).
   ===================================================================================================================== */
const WALK=7.5,RAD=1.35,HOVSPD=9,HOVH=2.6;
const MECH={M:null,P:null,ready:false};
/* ---------- the models (Ironhowl 4 ships them as .glb gzipped and in base64) ---------- */
function glbParse(key){const A=window.WT_ASSETS.glb[key];
  return fetch('data:application/octet-stream;base64,'+A.b64).then(r=>r.arrayBuffer())
   .then(b=>new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
   .then(buf=>new Promise((ok,no)=>new THREE.GLTFLoader().parse(buf,'',g=>ok(g.scene),no)));}
const KMAT={};
function kitMat(key){if(KMAT[key])return KMAT[key];const A=window.WT_ASSETS.glb[key],L=new THREE.TextureLoader();
  const t=(u,lin)=>{const x=L.load(u);x.flipY=false;x.colorSpace=lin?THREE.NoColorSpace:THREE.SRGBColorSpace;x.anisotropy=4;return x;};
  return KMAT[key]=new THREE.MeshStandardMaterial({map:t(A.map),normalMap:t(A.nrm,1),roughnessMap:t(A.orm,1),metalnessMap:t(A.orm,1),roughness:1,metalness:1});}
function dressModel(sc,mat){sc.traverse(o=>{if(o.isMesh){o.material=mat;o.castShadow=o.receiveShadow=true;}});return sc;}
function onMount(host,sc){sc.updateMatrixWorld(true);const mt=sc.getObjectByName('mount');
  const hold=new THREE.Group();hold.name='kit';host.add(hold);
  if(mt){const inv=mt.matrixWorld.clone().invert();inv.decompose(sc.position,sc.quaternion,sc.scale);}
  hold.add(sc);return hold;}
/* ---------- walking: each foot stays planted while the body moves over it (Ironhowl 4) ---------- */
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
/* pose the Wraith for this frame (Ironhowl 4's poseMech). st: {x,z,gy,legYaw,aimYaw,spd,air,vy,land,thrust,pitch}.
   Returns the feet that came down this frame [{side,x,z}] */
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
    const fx=st.x+L.ox*cy+tz*sy,fz=st.z-L.ox*sy+tz*cy;L.gy=st.air?st.gy:hgt(fx,fz);L.fx=fx;L.fz=fz;
    const D={y:(st.air?-L.reach*.82+lift:(L.gy+L.Ay+lift)-(hipY+L.Hy)),z:(L.Az+tz)-L.Hz};
    const r=legSolve(L,D,L.sign);
    L.thigh.rotation.x=r.a;L.knee.rotation.x=r.b-r.a;L.hock.rotation.x=r.a-r.b;L.ankle.rotation.x=-r.a+(st.air?.3:pitch);
    const e=ev[ev.length-1];if(e&&e.side===L.sd&&e.x===undefined){e.x=fx;e.z=fz;}
  }
  for(const A of M.arms){if(A)A.rotation.x=st.pitch*.85+Math.sin(M.phase*TAU+(A.userData.sd>0?Math.PI:0))*.04*w;}
  const th=st.thrust,fl=.6+Math.random()*.4;
  for(const J of M.jets){J.f1.visible=J.f2.visible=th>.02;const l1=(.5+th*1.6)*fl,l2=(.35+th*.95)*fl;J.f1.scale.set(1,l1,1);J.f1.position.y=.15+.5*l1;
    J.f2.scale.set(1,l2,1);J.f2.position.y=.15+.5*l2;}
  if(M.jl)M.jl.intensity=th*60*fl;
  return ev;
}
/* ---------- build the Wraith with its kit (the jet pack on its back, an autocannon on each forearm) ---------- */
function buildMech(scene){
  const M={root:new THREE.Group(),ready:false,phase:0,lean:0,roll:0,arms:[],jets:[],meshes:[]};scene.add(M.root);MECH.M=M;
  const flameMat=new THREE.MeshBasicMaterial({color:new THREE.Color(1,.46,.16).multiplyScalar(1.25),transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
  const flameMat2=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.7,1).multiplyScalar(1.5),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false});
  return Promise.all(['wraith','jetpack','acL','acR'].map(glbParse)).then(([w,jp,aL,aR])=>{
    dressModel(w,kitMat('wraith'));const W=new THREE.Group();W.add(w);M.root.add(W);const J={};w.traverse(o=>{if(o.name)J[o.name]=J[o.name]||o;});
    dressModel(jp,kitMat('jetpack'));dressModel(aL,kitMat('acL'));dressModel(aR,kitMat('acR'));
    const hold={bk:onMount(J.bk,jp),fa_L:onMount(J.fa_L,aL),fa_R:onMount(J.fa_R,aR)};
    for(const h of [hold.fa_L,hold.fa_R])h.traverse(o=>{const m=/^t(\d)_/.exec(o.name||'');if(m)o.visible=+m[1]===1;});   /* the first barrel set */
    M.hips=J.hips;M.torso=J.torso;M.head=J.head;M.hip0=J.hips.position.y;M.tor0=J.torso.position.y;
    W.updateMatrixWorld(true);M.legs=[-1,1].map(sd=>legSetup(J,sd<0?'L':'R',sd,M.hip0));
    M.arms=[J.arm_L,J.arm_R].filter(Boolean);M.arms.forEach((a,i)=>a.userData.sd=i?1:-1);
    M.jl=new THREE.PointLight(0xff9a40,0,14,1.8);M.jl.position.set(0,0,1.6);M.torso.add(M.jl);
    const g1=new THREE.CylinderGeometry(.22,.02,1,10,1,true),g2=new THREE.CylinderGeometry(.12,.01,1,8,1,true);
    for(const s of ['R','L']){const n=jp.getObjectByName('exhaust_'+s);if(!n)continue;const f1=new THREE.Mesh(g1,flameMat),f2=new THREE.Mesh(g2,flameMat2);n.add(f1,f2);M.jets.push({n,f1,f2});}
    M.root.traverse(o=>{if(o.isMesh&&o.material!==flameMat&&o.material!==flameMat2)M.meshes.push(o);});
    M.ready=true;MECH.ready=true;return M;});
}
/* ---------- the player ---------- */
function mkPlayer(){const y=hgt(SPAWN.x,SPAWN.z);return {x:SPAWN.x,z:SPAWN.z,y,yaw:SPAWN.yaw,legYaw:SPAWN.yaw,vx:0,vz:0,vy:0,air:false,hover:false,land:0,thrust:0,spd:0,
  depth:0,wade:1,blocked:0,ev:[]};}
/* water over the ground at a point (0 if dry) */
const depthAt=(x,z)=>Math.max(0,-hgt(x,z));
const hipDepth=()=>MECH.M&&MECH.M.hip0?MECH.M.hip0-.2:3.3;
function bumpBuildings(x,z,r){for(const b of BUILD){const cx=clamp(x,b.x0,b.x1),cz=clamp(z,b.z0,b.z1),dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);
  if(d<r){if(d<1e-4){const L=[x-b.x0,b.x1-x,z-b.z0,b.z1-z],m=Math.min(...L),q=L.indexOf(m);if(q===0)x=b.x0-r;else if(q===1)x=b.x1+r;else if(q===2)z=b.z0-r;else z=b.z1+r;}
    else{x=cx+dx/d*r;z=cz+dz/d*r;}}}return [x,z];}
/* c: {mx, mz (world directions, -1..1), hover (held)} */
function updPlayer(P,c,dt){
  const ml=Math.min(1,Math.hypot(c.mx,c.mz));const wx=ml>.02?c.mx:0,wz=ml>.02?c.mz:0;
  const hip=hipDepth(),dHere=depthAt(P.x,P.z);P.depth=dHere;
  /* WADING: slower the deeper (35% of a walk at hip depth), and the legs drag in the water */
  P.wade=1-.65*smooth(.15,hip,dHere);
  const wantHover=c.hover;
  if(wantHover&&!P.hover){P.hover=true;P.air=true;P.vy=Math.max(P.vy,4.5);P.ev.push({t:'jet'});}
  if(!wantHover&&P.hover){P.hover=false;P.ev.push({t:'hoverout'});}
  if(P.air){
    const floor=Math.max(hgt(P.x,P.z),0);   /* over water the jets hold it above the surface */
    if(P.hover){const tgt=floor+HOVH+Math.sin(performance.now()*.0022)*.15;P.vy+=((tgt-P.y)*3.2-P.vy)*damp(4,dt);
      const k=damp(1.8,dt);P.vx+=(wx*HOVSPD-P.vx)*k;P.vz+=(wz*HOVSPD-P.vz)*k;P.thrust+=(.62-P.thrust)*damp(8,dt);}
    else{P.vy-=22*dt;P.vx*=1-damp(.8,dt);P.vz*=1-damp(.8,dt);P.thrust+=(0-P.thrust)*damp(10,dt);}
    P.y+=P.vy*dt;
  }else{
    const sp=WALK*P.wade,tx=wx*sp,tz=wz*sp,k=damp(ml>.05?3.4:5.5,dt);
    P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;P.thrust+=(0-P.thrust)*damp(10,dt);
  }
  /* move: out of buildings, inside the map, and on foot not on into water past the hips nor up a cliff */
  let nx=P.x+P.vx*dt,nz=P.z+P.vz*dt;[nx,nz]=bumpBuildings(nx,nz,RAD);
  if(!P.air){const dN=depthAt(nx,nz),g0=hgt(P.x,P.z),g1=hgt(nx,nz),step=Math.hypot(nx-P.x,nz-P.z)||1e-4;
    const deeper=dN>hip&&dN>dHere-.01,steep=(g1-g0)/step>1.25;
    if(deeper||steep){P.blocked=deeper?1:2;nx=P.x;nz=P.z;P.vx*=.3;P.vz*=.3;}else P.blocked=Math.max(0,P.blocked-dt*2);}
  nx=clamp(nx,-150,150);nz=clamp(nz,-150,150);
  P.x=nx;P.z=nz;
  const g=hgt(P.x,P.z);
  if(P.air){if(!P.hover&&P.y<=g&&P.vy<0){const k=clamp(-P.vy/16,0,1.3);P.y=g;P.air=false;P.vy=0;P.land=Math.max(P.land,.18+k*.32);P.ev.push({t:'land',k});}
    if(P.y<g)P.y=g;}
  else P.y=g;
  P.land=Math.max(0,P.land-dt*1.6);
  /* legs face the way it walks (backwards when walking backwards) */
  const hs=Math.hypot(P.vx,P.vz);let tgt=P.legYaw;
  if(hs>.6){const my=Math.atan2(-P.vx,-P.vz);tgt=my;P.yaw=my;}
  const dl=angD(tgt,P.legYaw),mx=(P.air?2:5.5)*dt;P.legYaw+=clamp(dl,-mx,mx);
  const lf=-Math.sin(P.legYaw),lz=-Math.cos(P.legYaw);
  P.spd=P.vx*lf+P.vz*lz;if(Math.abs(P.spd)<2&&!P.air&&Math.abs(dl)>.05)P.spd=2*Math.sign(P.spd||1);
}
