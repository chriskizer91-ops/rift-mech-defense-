/* mech/weapons.js — the Wraith's weapons, from Ironhowl 4 (06b_weapons, 06k_kit) with Ironhowl 4's numbers.
   Each forearm fires its own weapon while you fire:
     AC-4 autocannon  tiers I-IV (6 to 9 rounds a second, 11 damage at tier I), heat 2.3 a round, overheat at 100, VENT dumps it all.
                      One autocannon arm fires at 60 % of the pair's rate.
     LN-1 Lance       charges while you fire (1.2 s) and fires by itself when full; let go early (past a quarter) for a weaker shot.
                      A rail shot: instant, 260 m, through up to 3 creatures (100 %, 80 %, 60 % of 120).
     AR-1 Arc         4 zaps a second at the creature nearest the aim within 35 m; each zap jumps on to the nearest creature within
                      12 m of the last, up to 4, 14 a jump.
   MP-9 missiles: a creature kept near the aim for 0.6 s is locked (0.36 s with the Watcher). Each press fires a salvo of 2 (8 with
     upgrades); locked ones first, then the BIGGEST clusters in front of you (changed for dots: Ironhowl 4 took the nearest to the crosshair).
   SALVO: 14 rounds from the shoulder pods at the creatures all round you, the BIGGEST first, then a 12 s wait. Works in the air.
   Damage is dots: 11 damage knocks 11 dots off (systems/swarm.js hurtCluster).
   Top-down change: the aim is a line on the ground (systems/input.js), not a camera ray. Shots test hits on the ground plane. */
const GUN={tier:1,base:1,heat:0,over:false,cd:0,side:0,cool:0,ventCd:0,flash:0,hitT:0,
  rate:[0,6,7,8,9],dmg:[0,11,8.5,7.2,6.6],spread:[0,.004,.006,.02,.009]};
const HEAT={shot:2.3,cool:30,delay:.45,resume:38};
const MSL={ammo:12,max:24,salvo:2,cd:0};
const SALVO={cd:0,cool:12,n:14,left:0,t:0,dmg:16,range:48};
const BOLT={speed:150,range:170};
const LANCE={charge:1.2,dmg:120,range:260,pierce:3,fall:[1,.8,.6],cool:.35};
const ARCW={range:35,hop:12,jumps:4,dmg:14,rate:4,cone:.95};
const WATCH={radar:220,lockK:.6};
const LOCK={time:.6,cone:.6,range:180};
const UP={dmgK:1,stomp:false,repair:35};
const BOLTS=[],MISS=[];
let BM=null,MSM=null,MFL=null;
const _sc=new THREE.Vector3(),_v=new THREE.Vector3(),_w=new THREE.Vector3(),_m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_z=new THREE.Vector3(0,0,1),_ka=new THREE.Vector3(),_kb=new THREE.Vector3();
function sendInst(im,n){im.visible=n>0;if(n){const A=im.instanceMatrix;A.clearUpdateRanges();A.addUpdateRange(0,n*16);A.needsUpdate=true;}}
function buildWeapons(){
  const g=new THREE.CylinderGeometry(.11,.11,1,6,1,true);g.rotateX(Math.PI/2);
  BM=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(1,.78,.4).multiplyScalar(5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),200);
  const g3=new THREE.CylinderGeometry(.09,.12,.9,8);g3.rotateX(Math.PI/2);
  MSM=new THREE.InstancedMesh(g3,new THREE.MeshStandardMaterial({color:0xd8d8d0,roughness:.5,metalness:.4,emissive:0x221508}),60);
  for(const m of [BM,MSM]){m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);S.add(m);}
  BM.renderOrder=4;
  MFL=new THREE.PointLight(0xffb060,0,22,1.6);S.add(MFL);
  kitFxInit();
}
/* ---------------- where the Wraith is aiming ----------------
   Touch and gamepad: the aim stick gives a direction; aim assist bends it onto the creature nearest that line within 0.2 rad
   and 48 m (about what the screen shows; the rounds still fly 170 m).
   Mouse: the shot goes to the point under the cursor, or to a creature the cursor is on (within 2.5 m of its edge). */
const AIM={x:0,y:1.2,z:0,e:null,dist:0,dx:0,dz:-1,mouse:false};
/* GAPS (being tested): a cluster is mostly empty space. A gun round that crosses it hits with a chance of dots/(dots+22):
   KNOT 31 %, SKEIN 48 %, RUNNER 69 %, STALKER 82 %, BRUTE 96 %, and less as a cluster thins (never under 30 %). The Lance (a beam), the Arc and blasts
   always hit. ?solid in the address turns it off. */
const GAPS=Q.has('solid')?0:22;
const ASSIST_R=48;   /* aim assist only reaches what the top-down camera shows (Ironhowl 4's reached 170 m) */
function updAim(c){
  let dx=-Math.sin(P.yaw),dz=-Math.cos(P.yaw);if(c.aim){dx=c.ax;dz=c.az;}
  AIM.dx=dx;AIM.dz=dz;AIM.mouse=!!c.aimPt;let hitE=null;
  if(c.aimPt){let bd=1e9;for(const e of EN){if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-c.aimPt.x,e.z-c.aimPt.z)-e.r;if(d<2.5&&d<bd){bd=d;hitE=e;}}}
  else{let ba=.2;for(const e of EN){if(e.dead||e.spawnT>0)continue;const ex=e.x-P.x,ez=e.z-P.z,t=ex*dx+ez*dz;if(t<2||t>ASSIST_R)continue;
    const perp=Math.abs(ex*dz-ez*dx),ang=Math.max(0,perp-e.r)/t;if(ang<ba){ba=ang;hitE=e;}}}
  if(hitE){AIM.e=hitE;AIM.x=hitE.x;AIM.z=hitE.z;AIM.y=hitE.cy;AIM.dist=Math.hypot(hitE.x-P.x,hitE.z-P.z);return;}
  const d=c.aimPt?clamp(c.aimPt.d,6,BOLT.range):40;
  AIM.e=null;AIM.x=P.x+dx*d;AIM.z=P.z+dz*d;AIM.y=1.2;AIM.dist=d;
}
/* the creature hit by a segment on the ground plane (with a height check), and how far along (0..1) */
function segCircle(x0,z0,x1,z1,cx,cz,r){const dx=x1-x0,dz=z1-z0,fx=x0-cx,fz=z0-cz,a=dx*dx+dz*dz,b=2*(fx*dx+fz*dz),c=fx*fx+fz*fz-r*r;
  if(c<0)return 0;const D=b*b-4*a*c;if(D<0||a<1e-9)return -1;const t=(-b-Math.sqrt(D))/(2*a);return t>=0&&t<=1?t:-1;}
function updSalvo(c,dt){
  SALVO.cd=Math.max(0,SALVO.cd-dt);
  if(c.salvo&&!P.dead){if(SALVO.cd<=0&&SALVO.left<=0){for(const e of EN)e.pend=0;SALVO.left=SALVO.n;SALVO.t=0;SALVO.cd=SALVO.cool;HUD.msg('SALVO',.8);CAMS.shake=Math.max(CAMS.shake,.3);}else if(SALVO.left<=0)sClick();}
  if(SALVO.left>0){SALVO.t-=dt;while(SALVO.left>0&&SALVO.t<=0){SALVO.t+=.065;SALVO.left--;salvoRound(SALVO.n-SALVO.left);}}
}
function salvoRound(i){
  /* the biggest clusters first; a round goes to the biggest one not already doomed by rounds in the air */
  const near=EN.filter(e=>!e.dead&&e.spawnT<=0&&Math.hypot(e.x-P.x,e.z-P.z)<SALVO.range+e.r).sort((a,b)=>b.alive-a.alive);
  const pod=M.ready?M.pods[i%M.pods.length]:null;if(pod)pod.getWorldPosition(_w);else _w.set(P.x,P.y+5,P.z);
  let tx,ty,tz,tg=null;
  if(near.length){const e=tg=near.find(o=>o.alive-(o.pend||0)>0)||near[0];e.pend=(e.pend||0)+SALVO.dmg;const a=Math.random()*TAU,rr=Math.random()*e.r*.6;tx=e.x+Math.cos(a)*rr;ty=e.cy;tz=e.z+Math.sin(a)*rr;}
  else{const a=P.yaw+i/SALVO.n*TAU;tx=P.x-Math.sin(a)*14;tz=P.z-Math.cos(a)*14;ty=0;}
  let ax=tx-_w.x,ay=ty-_w.y,az=tz-_w.z;const l=Math.hypot(ax,ay,az)||1;ax/=l;ay/=l;az/=l;
  BOLTS.push({x:_w.x,y:_w.y,z:_w.z,vx:ax*170,vy:ay*170,vz:az*170,life:(l+8)/170,dmg:SALVO.dmg,tg,salvo:1});
  part({x:_w.x+ax*.6,y:_w.y+ay*.6,z:_w.z+az*.6,vx:0,vy:0,vz:0,life:.07,s0:1.5,s1:.6,a:1.6,col:[1,.75,.4],glow:true});MFL.position.copy(_w);GUN.flash=1;sGun(2);
}
function updGun(c,dt){
  updSalvo(c,dt);
  GUN.cd-=dt;GUN.ventCd=Math.max(0,GUN.ventCd-dt);GUN.flash=Math.max(0,GUN.flash-dt*12);GUN.hitT=Math.max(0,GUN.hitT-dt);
  if(M.ready)setTier(M,GUN.tier);
  const AC=M.ready?M.ac:[null],firing=c.fire&&!GUN.over&&!P.dead&&AC.length>0;
  kitArms(c,dt);
  if(firing&&GUN.cd<=0){
    const t=GUN.tier,A=AC[GUN.side%AC.length];GUN.cd+=1/(GUN.rate[t]*(AC.length<2?.6:1));if(GUN.cd<0)GUN.cd=0;GUN.side=(GUN.side+1)%AC.length;
    if(A){A.muzzle.getWorldPosition(_w);A.kick=1;}else _w.set(P.x,P.y+3.6,P.z);
    const offs=t===1?[[0,0]]:t===2?[[-.11,0],[.11,0]]:t===3?[[-.12,-.07],[.12,-.07],[0,.13]]:[[.1,.1],[-.1,.1],[-.1,-.1],[.1,-.1]];
    const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
    for(const o of offs){const sx=_w.x+rx*o[0],sy=_w.y+o[1],sz=_w.z+rz*o[0];
      let ax=AIM.x-sx,ay=AIM.y-sy,az=AIM.z-sz;const l=Math.hypot(ax,ay,az)||1;ax/=l;ay/=l;az/=l;
      const sp=GUN.spread[t];ax+=(Math.random()-.5)*sp*2;ay+=(Math.random()-.5)*sp*2;az+=(Math.random()-.5)*sp*2;
      BOLTS.push({x:sx,y:sy,z:sz,vx:ax*BOLT.speed,vy:ay*BOLT.speed,vz:az*BOLT.speed,life:BOLT.range/BOLT.speed,dmg:GUN.dmg[t]*UP.dmgK});}
    part({x:_w.x+fx*.4,y:_w.y,z:_w.z+fz*.4,vx:0,vy:0,vz:0,life:.08,s0:1.6+t*.25,s1:.8,a:2.6,col:[1,.7,.35],glow:true});
    if(Math.random()<.5)part({x:_w.x,y:_w.y,z:_w.z,vx:fx*2,vy:.8,vz:fz*2,life:.7,s0:.4,s1:1.4,a:.22,col:SMOKE,drag:2});
    MFL.position.copy(_w);GUN.flash=1;
    GUN.heat+=HEAT.shot;GUN.cool=HEAT.delay;
    if(GUN.heat>=100){GUN.heat=100;GUN.over=true;sOver();HUD.msg('OVERHEAT · VENT IT',1.4);}
    sGun(t);
  }else if(!firing){GUN.cool-=dt;if(GUN.cool<=0)GUN.heat=Math.max(0,GUN.heat-HEAT.cool*dt);}
  if(GUN.over){GUN.cool-=dt;if(GUN.cool<=0)GUN.heat=Math.max(0,GUN.heat-HEAT.cool*.8*dt);if(GUN.heat<=HEAT.resume)GUN.over=false;
    if(M.ready&&M.ac.length&&Math.random()<dt*14){const A=M.ac[Math.random()*M.ac.length|0];A.muzzle.getWorldPosition(_w);part({x:_w.x,y:_w.y,z:_w.z,vx:(Math.random()-.5),vy:1.5+Math.random(),vz:(Math.random()-.5),life:1.2,s0:.4,s1:1.6,a:.35,col:[.85,.85,.88],drag:1});}}
  MFL.intensity=GUN.flash*90;
  /* vent: dump all heat with a steam blast that shoves close creatures back and knocks a few dots off */
  if(c.vent&&GUN.ventCd<=0&&!P.dead){GUN.ventCd=GUN.ventCool||8;GUN.heat=0;GUN.over=false;sVent();CAMS.shake=Math.max(CAMS.shake,.35);
    for(let i=0;i<10;i++){const a=Math.random()*TAU;part({x:P.x+Math.cos(a)*1.5,y:P.y+2+Math.random()*2,z:P.z+Math.sin(a)*1.5,vx:Math.cos(a)*3,vy:2+Math.random()*2,vz:Math.sin(a)*3,life:1.6,s0:2,s1:6,a:.6,col:[1,1,1],drag:1.5,grav:-.6});}
    for(let i=0;i<26;i++){const a=Math.random()*TAU,s=4+Math.random()*7;part({x:P.x+Math.cos(a)*1.2,y:P.y+1.5+Math.random()*2,z:P.z+Math.sin(a)*1.2,vx:Math.cos(a)*s,vy:.5+Math.random()*2,vz:Math.sin(a)*s,life:1.4+Math.random(),s0:1,s1:4.2,a:.4,col:[.92,.93,.95],drag:2.2,grav:-.4});}
    for(const e of EN){if(e.dead||e.spawnT>0)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz)||1;if(d<10+e.r*.5){hurtCluster(e,15,e.x,1,e.z);const k=16*(1-Math.min(1,d/12))*Math.min(1,30/e.alive+.2);e.kx+=dx/d*k;e.kz+=dz/d*k;}}}
  /* missiles: each press fires a salvo at locked creatures, then the biggest in front */
  MSL.cd-=dt;updLock(dt);
  if(c.msl&&!P.dead){
    if(MSL.ammo<=0||MSL.cd>0){if(MSL.ammo<=0){sClick();HUD.msg(kitHas('mpod')?'NO MISSILES':'NO MISSILE POD',1);}}
    else{MSL.cd=.7;const cand=lockCands();
      const n=Math.min(MSL.salvo,MSL.ammo);for(let i=0;i<n;i++){const tg=cand.length?cand[i%cand.length]:null,pod=M.ready?M.pods[(MSL.tube=(MSL.tube||0)+1)%M.pods.length]:null;
        if(pod)pod.getWorldPosition(_w);else _w.set(P.x,P.y+4.4,P.z);
        const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
        MISS.push({x:_w.x,y:_w.y,z:_w.z,vx:fx*14+(i%2?3:-3),vy:9,vz:fz*14,t:0,tg,life:4.5,ax:AIM.x,ay:AIM.y,az:AIM.z,delay:i*.09,turn:tg&&tg.lk>=1?4.2:1.7});}
      MSL.ammo-=n;sMissile();}
  }
}
/* missile lock: a creature near the aim line for 0.6 s (0.36 s with the Watcher) is locked */
function updLock(dt){const T=LOCK.time*(kitHas('watcher')?WATCH.lockK:1),pod=MSL.ammo>0&&kitHas('mpod');
  for(const e of EN){if(e.dead||e.spawnT>0){e.lk=0;continue;}const ex=e.x-P.x,ez=e.z-P.z,d=Math.hypot(ex,ez);
    const a=Math.acos(clamp((ex*AIM.dx+ez*AIM.dz)/(d||1),-1,1));e.lka=a;const inC=pod&&a<LOCK.cone&&d<LOCK.range;
    const was=(e.lk||0)>=1;e.lk=inC?Math.min(1,(e.lk||0)+dt/T):Math.max(0,(e.lk||0)-dt*2);if(!was&&e.lk>=1)sChirp();}}
function lockCands(){return EN.filter(e=>!e.dead&&e.spawnT<=0&&e.lka<LOCK.cone&&Math.hypot(e.x-P.x,e.z-P.z)<LOCK.range).sort((a,b)=>((b.lk>=1)-(a.lk>=1))||(b.alive-a.alive));}
/* move bolts and missiles, test hits */
function updShots(dt){
  const drop=i=>{const b=BOLTS[i];if(b.tg)b.tg.pend=Math.max(0,(b.tg.pend||0)-b.dmg);BOLTS.splice(i,1);};
  for(let i=BOLTS.length-1;i>=0;i--){const b=BOLTS[i];b.life-=dt;if(b.life<=0){drop(i);continue;}
    const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt,nz=b.z+b.vz*dt;let hit=null,ht=1;
    for(const e of EN){if(e.dead||e.spawnT>0||b.pass&&b.pass.includes(e))continue;const top=e.tier.size*e.scale+.8;if(Math.min(b.y,ny)>top)continue;const t=segCircle(b.x,b.z,nx,nz,e.x,e.z,e.r);if(t>=0&&t<ht){ht=t;hit=e;}}
    /* through the gaps: a round only knocks dots off if it meets some (see GAPS) */
    if(hit&&GAPS&&Math.random()>Math.max(.3,hit.alive/(hit.alive+GAPS))){(b.pass||(b.pass=[])).push(hit);hit=null;ht=1;}
    const hx=lerp(b.x,nx,ht),hy=lerp(b.y,ny,ht),hz=lerp(b.z,nz,ht);
    if(hit){drop(i);hurtCluster(hit,b.dmg,hx,Math.max(.5,hy),hz);GUN.hitT=.12;sparks(hx,Math.max(.5,hy),hz,3,[1,.75,.35]);continue;}
    if(ny<hgt(nx,nz)){sparks(nx,.1,nz,3,[1,.7,.3]);part({x:nx,y:.2,z:nz,vx:0,vy:1,vz:0,life:.8,s0:.5,s1:1.6,a:.3,col:DUST,drag:1.5});drop(i);continue;}
    b.x=nx;b.y=ny;b.z=nz;}
  for(let i=MISS.length-1;i>=0;i--){const m=MISS[i];m.t+=dt;m.life-=dt;if(m.t<m.delay)continue;
    if(m.tg&&m.tg.dead)m.tg=null;
    const tx=m.tg?m.tg.x:m.ax,ty=m.tg?m.tg.cy:m.ay,tz=m.tg?m.tg.z:m.az;
    if(m.t>m.delay+.25){const sp=Math.min(62,Math.hypot(m.vx,m.vy,m.vz)+60*dt);let dx=tx-m.x,dy=ty-m.y,dz=tz-m.z;const dl=Math.hypot(dx,dy,dz)||1;
      const k=Math.min(1,dt*(m.turn||4.2));const cl=Math.hypot(m.vx,m.vy,m.vz)||1;let vx=m.vx/cl,vy=m.vy/cl,vz=m.vz/cl;
      vx+=(dx/dl-vx)*k;vy+=(dy/dl-vy)*k;vz+=(dz/dl-vz)*k;const nl=Math.hypot(vx,vy,vz)||1;m.vx=vx/nl*sp;m.vy=vy/nl*sp;m.vz=vz/nl*sp;}
    else m.vy-=6*dt;
    m.x+=m.vx*dt;m.y+=m.vy*dt;m.z+=m.vz*dt;
    if(Math.random()<.9)part({x:m.x,y:m.y,z:m.z,vx:0,vy:.3,vz:0,life:1.1,s0:.35,s1:1.5,a:.33,col:SMOKE,drag:1});
    part({x:m.x,y:m.y,z:m.z,vx:0,vy:0,vz:0,life:.06,s0:.7,s1:.3,a:1.6,col:[1,.6,.25],glow:true});
    const near=m.tg&&Math.hypot(tx-m.x,tz-m.z)<m.tg.r*.7+.6&&m.y<m.tg.tier.size*m.tg.scale+1;
    if(near||m.life<=0||m.y<hgt(m.x,m.z)+.1){boom(m.x,Math.max(m.y,.3),m.z,1);splash(m.x,m.z,4.8,75);MISS.splice(i,1);}}
  drawShots();
}
function drawShots(){
  let n=0;for(const b of BOLTS){if(n>=200)break;const l=Math.hypot(b.vx,b.vy,b.vz);_v.set(b.vx/l,b.vy/l,b.vz/l);_q.setFromUnitVectors(_z,_v);
    _m4.compose(_w.set(b.x-_v.x*1.8,b.y-_v.y*1.8,b.z-_v.z*1.8),_q,_sc.set(1.3,1.3,3.6));BM.setMatrixAt(n++,_m4);}
  BM.count=n;sendInst(BM,n);
  n=0;for(const m of MISS){if(n>=60)break;if(m.t<m.delay)continue;const l=Math.hypot(m.vx,m.vy,m.vz)||1;_v.set(m.vx/l,m.vy/l,m.vz/l);_q.setFromUnitVectors(_z,_v);_m4.compose(_w.set(m.x,m.y,m.z),_q,_sc.set(1.4,1.4,1.4));MSM.setMatrixAt(n++,_m4);}
  MSM.count=n;sendInst(MSM,n);
}
function sparks(x,y,z,n,col){if(n>2)part({x,y,z,vx:0,vy:0,vz:0,life:.14,s0:.7,s1:1.6,a:1.3,col:[1,1,1],glow:true});for(let i=0;i<n;i++){const a=Math.random()*TAU,b=Math.random()*2-1,s=4+Math.random()*7;
  part({x,y,z,vx:Math.cos(a)*s*Math.sqrt(1-b*b),vy:b*s+2,vz:Math.sin(a)*s*Math.sqrt(1-b*b),life:.25+Math.random()*.25,s0:.22,s1:.06,a:2,col,glow:true,drag:2,grav:12});}}
function boom(x,y,z,k){sBoom(k);CAMS.shake=Math.max(CAMS.shake,Math.min(.9,.7*k*12/Math.max(6,Math.hypot(x-P.x,z-P.z))));
  part({x,y,z,vx:0,vy:0,vz:0,life:.35,s0:4*k,s1:7*k,a:1.6,col:[1,.62,.28],glow:true});
  part({x,y,z,vx:0,vy:0,vz:0,life:.3,s0:3*k,s1:14*k,a:.75,col:[1,.82,.6],glow:true,ring:true,vr:0});
  for(let i=0,n=8*k;i<n;i++){const a=Math.random()*TAU,s=(4+Math.random()*9)*Math.sqrt(k);
    part({x,y,z,vx:Math.cos(a)*s,vy:6+Math.random()*9*Math.sqrt(k),vz:Math.sin(a)*s,life:.8+Math.random()*.8,s0:.34,s1:.1,a:2.2,col:[1,.5,.16],glow:true,drag:.5,grav:17});}
  for(let i=0;i<10*k;i++){const a=Math.random()*TAU,s=2+Math.random()*5*k;part({x,y,z,vx:Math.cos(a)*s,vy:1+Math.random()*4,vz:Math.sin(a)*s,life:1.4+Math.random(),s0:1.2*k,s1:4.4*k,a:.45,col:[.32,.3,.29],drag:1.8,grav:-.6});}
  sparks(x,y,z,10*k,[1,.62,.25]);MFL.position.set(x,y+1,z);GUN.flash=Math.max(GUN.flash,1.4*k);}
/* blast damage on the ground plane: full at the middle, half at the edge */
function splash(x,z,r,dmg){for(const e of EN){if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<r+e.r)hurtCluster(e,dmg*(1-.5*clamp((d-e.r*.5)/r,0,1)),e.x,e.cy,e.z);}}

/* ---------------- beams: one instanced mesh of glowing cylinders for the rail shots and the lightning ---------------- */
const KX={beams:[],bm:null,col:new THREE.Color(),m4:new THREE.Matrix4(),q:new THREE.Quaternion(),s:new THREE.Vector3(),p:new THREE.Vector3(),z:new THREE.Vector3(0,0,1),d:new THREE.Vector3()};
function kitFxInit(){if(KX.bm)return;const g=new THREE.CylinderGeometry(1,1,1,6,1,true);g.rotateX(Math.PI/2);
  const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  KX.bm=new THREE.InstancedMesh(g,m,400);KX.bm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);KX.bm.setColorAt(0,KX.col.setRGB(0,0,0));
  KX.bm.count=0;KX.bm.frustumCulled=false;KX.bm.renderOrder=4;S.add(KX.bm);}
function beam(a,b,r,col,life){KX.beams.push({a:[a.x,a.y,a.z],b:[b.x,b.y,b.z],r,col,life,t:0});}
function bolt(a,b,r,col,life,j){const n=Math.max(3,Math.min(10,Math.round(a.distanceTo(b)/2.2)));let p=a.clone();
  for(let i=1;i<=n;i++){const q=i===n?b.clone():a.clone().lerp(b,i/n).add(new THREE.Vector3((Math.random()-.5)*2*j,(Math.random()-.5)*2*j,(Math.random()-.5)*2*j));
    beam(p,q,r,col,life);p=q;}}
function updBeams(dt){const L=KX.beams;let n=0;
  for(let i=L.length-1;i>=0;i--){const B=L[i];B.t+=dt;if(B.t>=B.life){L.splice(i,1);continue;}}
  for(const B of L){if(n>=400)break;const f=1-B.t/B.life,a=B.a,b=B.b;KX.d.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const len=KX.d.length();if(len<1e-3)continue;
    KX.p.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);KX.q.setFromUnitVectors(KX.z,KX.d.multiplyScalar(1/len));const r=B.r*(.4+.6*f)*1.6;KX.s.set(r,r,len);
    KX.m4.compose(KX.p,KX.q,KX.s);KX.bm.setMatrixAt(n,KX.m4);KX.bm.setColorAt(n,KX.col.setRGB(B.col[0]*f*1.6,B.col[1]*f*1.6,B.col[2]*f*1.6));n++;}
  KX.bm.count=n;KX.bm.visible=n>0;
  if(n)for(const A of [KX.bm.instanceMatrix,KX.bm.instanceColor])if(A){A.clearUpdateRanges();A.addUpdateRange(0,n*A.itemSize);A.needsUpdate=true;}}
/* ---------------- the forearms ---------------- */
function kitArms(c,dt){if(!M||!M.ready)return;const hold=c.fire&&!P.dead;let lances=0;
  M.arms.forEach((A,i)=>{if(A.kind==='ln')lanceArm(A,hold,dt,lances++);else if(A.kind==='ar')arcArm(A,hold,dt,i);});}
function lanceArm(A,hold,dt,k){A.cd=Math.max(0,(A.cd||0)-dt);if(A.ch==null)A.ch=0;
  if(hold&&A.cd<=0){if(!A.chg){A.chg=true;A.ch=k?-.125:0;if(!k)sCharge();}A.ch=Math.min(1,A.ch+dt/LANCE.charge*(UP.chargeK||1));if(A.ch>=1)railShot(A,1);}
  else if(!hold&&A.chg){A.chg=false;if(A.ch>=.25)railShot(A,A.ch);A.ch=0;}
  else if(!hold)A.ch=0;
  if(!A.glow){if(!KX.lg){KX.lg=new THREE.SphereGeometry(1,12,8);KX.lm=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.8,1).multiplyScalar(4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});}
    A.glow=new THREE.Mesh(KX.lg,KX.lm);A.glow.renderOrder=5;A.muzzle.add(A.glow);}
  const ch=Math.max(0,A.ch||0);A.glow.visible=ch>0;if(ch>0){const s=.08+ch*.32+(ch>=.99?Math.random()*.06:0);A.glow.scale.setScalar(s/Math.max(1e-3,A.muzzle.getWorldScale(_kb).x));
    if(Math.random()<dt*40*ch){A.muzzle.getWorldPosition(_ka);const a=Math.random()*TAU,b=Math.random()*TAU,r=1.2;
      part({x:_ka.x+Math.cos(a)*r,y:_ka.y+Math.sin(b)*r,z:_ka.z+Math.sin(a)*r,vx:-Math.cos(a)*r*5,vy:-Math.sin(b)*r*5,vz:-Math.sin(a)*r*5,life:.2,s0:.25,s1:.05,a:1.5,col:[.55,.8,1],glow:true});}}}
function railShot(A,k){A.muzzle.getWorldPosition(_ka);const s=_ka.clone();
  const d=new THREE.Vector3(AIM.x-s.x,AIM.y-s.y,AIM.z-s.z);if(d.lengthSq()<1)d.set(AIM.dx,0,AIM.dz);d.normalize();
  let len=LANCE.range;if(d.y<-1e-4)len=Math.min(len,(s.y-.05)/-d.y);
  const e1=s.clone().addScaledVector(d,len);
  const hits=[];for(const e of EN){if(e.dead||e.spawnT>0)continue;const t=segCircle(s.x,s.z,e1.x,e1.z,e.x,e.z,e.r*1.1);if(t>=0)hits.push([t,e]);}
  hits.sort((a,b)=>a[0]-b[0]);const dmg=LANCE.dmg*k*UP.dmgK*(UP.railK||1);
  hits.slice(0,LANCE.pierce+(UP.pierce||0)).forEach(([t,e],i)=>{const hx=s.x+(e1.x-s.x)*t,hy=Math.max(.6,s.y+(e1.y-s.y)*t),hz=s.z+(e1.z-s.z)*t;
    hurtCluster(e,dmg*(LANCE.fall[i]||.6),hx,hy,hz);e.kx+=d.x*6*k*Math.min(1,40/e.alive);e.kz+=d.z*6*k*Math.min(1,40/e.alive);sparks(hx,hy,hz,10,[.6,.85,1]);});
  if(hits.length)GUN.hitT=.2;
  beam(s,e1,.09+.07*k,[2.2,2.4,2.6],.22+.12*k);beam(s,e1,.3+.2*k,[.25,.55,1.3],.3+.15*k);
  for(let i=0;i<3;i++)part({x:s.x+d.x*i*.6,y:s.y+d.y*i*.6,z:s.z+d.z*i*.6,vx:0,vy:0,vz:0,life:.1,s0:1.8-i*.4,s1:.6,a:2,col:[.7,.9,1],glow:true});
  if(len<LANCE.range-1){sparks(e1.x,e1.y+.1,e1.z,8,[.6,.85,1]);part({x:e1.x,y:e1.y+.3,z:e1.z,vx:0,vy:1,vz:0,life:.9,s0:1,s1:3,a:.35,col:DUST,drag:1.5});}
  A.kick=1.6;CAMS.shake=Math.max(CAMS.shake,.18+.15*k);MFL.position.copy(s);GUN.flash=1;sRail(k);A.ch=0;A.chg=false;A.cd=LANCE.cool;}
function arcArm(A,hold,dt,i){if(A.cd==null)A.cd=i?.5/ARCW.rate:0;A.cd-=dt;if(!hold){A.cd=Math.max(A.cd,i?.5/ARCW.rate:0);return;}
  if(A.cd>0)return;A.cd+=1/ARCW.rate;if(A.cd<0)A.cd=0;arcZap(A);}
function arcZap(A){A.muzzle.getWorldPosition(_ka);const s=_ka.clone(),fx=AIM.dx,fz=AIM.dz;
  const ok=e=>!e.dead&&e.spawnT<=0;
  /* first: the creature under the aim if it is close enough, otherwise the one nearest the aim line in front of you */
  let first=AIM.e&&ok(AIM.e)&&Math.hypot(AIM.e.x-P.x,AIM.e.z-P.z)<ARCW.range+AIM.e.r?AIM.e:null;
  if(!first){let best=1e9;for(const e of EN){if(!ok(e))continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);if(d>ARCW.range+e.r)continue;
    const ang=Math.acos(clamp((dx*fx+dz*fz)/(d||1),-1,1));if(ang>ARCW.cone)continue;const sc=ang+d/80;if(sc<best){best=sc;first=e;}}}
  const col=[.35,.6,1.9];
  if(!first){const p=new THREE.Vector3(AIM.x,AIM.y,AIM.z).sub(s);p.setLength(Math.min(9,p.length()));p.add(s);bolt(s,p,.05,col,.08,.6);sArc();return;}
  const hit=[first];let cur=first;
  while(hit.length<ARCW.jumps+(UP.jumps||0)){let nx=null,bd=ARCW.hop;for(const e of EN){if(!ok(e)||hit.includes(e))continue;const d=Math.hypot(e.x-cur.x,e.z-cur.z)-e.r-cur.r;if(d<bd){bd=d;nx=e;}}
    if(!nx)break;hit.push(nx);cur=nx;}
  let p=s;for(const e of hit){const q=new THREE.Vector3(e.x+(Math.random()-.5)*e.r*.6,e.cy*(.6+Math.random()*.6),e.z+(Math.random()-.5)*e.r*.6);
    bolt(p,q,.07,col,.11,Math.min(1.4,.08*p.distanceTo(q)+.3));bolt(p,q,.025,[1.6,1.8,2.2],.08,.3);
    hurtCluster(e,ARCW.dmg*UP.dmgK,q.x,q.y,q.z);sparks(q.x,q.y,q.z,4,[.6,.85,1]);p=q;}
  part({x:s.x,y:s.y,z:s.z,vx:0,vy:0,vz:0,life:.08,s0:1.3,s1:.5,a:1.8,col:[.6,.8,1],glow:true});A.kick=.4;GUN.hitT=.12;sArc();}

/* ---------------- pickups: chip (gun tier), repair, shield, missiles, fuel (Ironhowl 4) ---------------- */
const PK=[],PKDEF={chip:{col:[1,.85,.2],name:'GUN TIER'},repair:{col:[.35,1,.45],name:'REPAIR'},shield:{col:[.4,.7,1],name:'SHIELD'},
  missile:{col:[1,.5,.2],name:'MISSILES'},fuel:{col:[.92,.95,1],name:'JET FUEL'}};
let PKG=null,PKB=null;
function dropPickup(x,z,kind){
  if(!kind){const r=Math.random();kind=r<.34?'chip':r<.58?'repair':r<.76?'missile':r<.9?'fuel':'shield';}
  if(kind==='chip'&&GUN.tier>=4)kind='missile';
  if(!PKG){PKG=new THREE.OctahedronGeometry(.75,0);PKB=new THREE.CylinderGeometry(.1,.1,14,6,1,true);PKB.translate(0,7,0);}
  const c=new THREE.Color(...PKDEF[kind].col),gem=new THREE.Mesh(PKG,new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(3)}));
  const beam=new THREE.Mesh(PKB,new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(.9),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));
  const g=new THREE.Group();g.add(gem,beam);const d=Math.hypot(x,z),k=d>ARENA_R-4?(ARENA_R-4)/d:1;x*=k;z*=k;g.position.set(x,0,z);S.add(g);
  PK.push({kind,g,gem,beam,x,z,t:0,life:28});}
function updPickups(dt){for(let i=PK.length-1;i>=0;i--){const p=PK[i];p.t+=dt;p.gem.rotation.y+=dt*2.4;p.gem.position.y=1.4+Math.sin(p.t*3)*.25;
  p.g.visible=p.life-p.t>5||Math.sin(p.t*18)>0;
  if(!P.dead&&Math.hypot(P.x-p.x,P.z-p.z)<3.6){collect(p.kind);S.remove(p.g);PK.splice(i,1);continue;}
  if(p.t>p.life){S.remove(p.g);PK.splice(i,1);}}}
function collect(k){sPickup();
  if(k==='chip'){GUN.tier=Math.min(4,GUN.tier+1);HUD.msg('GUN TIER '+['','I','II','III','IV'][GUN.tier],1.6);}
  else if(k==='repair'){P.hull=Math.min(P.hullMax,P.hull+UP.repair);HUD.msg('REPAIR +'+UP.repair,1.2);}
  else if(k==='shield'){P.shield=P.shieldMax;HUD.msg('SHIELD FULL',1.2);}
  else if(k==='missile'){if(MSL.max>0){MSL.ammo=Math.min(MSL.max,MSL.ammo+6);HUD.msg('MISSILES +6',1.2);}}
  else {P.fuel=P.cells;HUD.msg('JET FUEL FULL',1.2);}}
function clearPickups(){for(const p of PK)S.remove(p.g);PK.length=0;}
