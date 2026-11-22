/* =====================================================================================================================
   RIFT MECH DEFENSE · THE JOIN (game/mission/mission.js, session B)
   Runs inside session C's code (the same wrapper, after C's files): C's Wraith, weapons, wingmates, HUD, creatures and
   frame loop as they are, on B's world. A function declared here replaces C's function of the same name. What changes:
     buildArena   B's map (RMD.World: ground, soil, water, trees, buildings, props), a dawn sky, the minimap
     updCam       the forward camera (Christopher, 22 Nov): lower, behind the Wraith, looking ahead; it turns
                  (touch: drag across the top of the screen; keys [ and ]; it swings back behind you as you walk ahead);
                  CAMERA (Z) steps Forward / Low / High
     readCtl      the sticks are the screen's, so they turn with the camera (C's readCtl runs first, as readCtlC)
     updPlayer    wading: slower by depth, and no walking on into water past the hips (C's runs inside, as updPlayerC)
     poseMech     footprints in the soil, rings and spray in water (C's runs first, as poseMechC)
     updAllies    people on a deck stay on it (C's runs first, as updAlliesC)
     updRadio     also runs the world and the mission each frame
   The build (game/mission/build.py) renames those four of C's functions and makes three small fixes in C's code so it
   reads B's ground (hgt, the arena's size, aim and markers at ground height). It checks each one and stops if C's code
   has changed under it.
   ===================================================================================================================== */
const MSN={real:false,camYaw:0,turnT:9,glitch:0,hip:3.3,deepT:-9,step:null,miniT:0,ready:false};
const CAMF=[{name:'FORWARD',pitch:.6,D:46,ahead:14},{name:'LOW',pitch:.38,D:30,ahead:10},{name:'HIGH',pitch:.98,D:60,ahead:6}];
let CFI=+store.get('camf',0)||0;
/* ---------- the world ---------- */
const SKY_FOG=new THREE.Color(.43,.46,.5);
function buildArena(){
  RMD.World.build(S,R,{phone:touchy,fog:true,fogColor:SKY_FOG});
  S.background=SKY_FOG.clone();
  /* dawn: a low sun from the east-north-east, cool light from the sky */
  SUN.set(.62,.42,-.66).normalize();KEY.color.set(0xffd2a8);KEY.intensity=2.4;HEMI.color.set(0xb4c4d8);HEMI.groundColor.set(0x4a4238);HEMI.intensity=.95;
  const g=new THREE.SphereGeometry(1500,32,16),c=[],p=g.attributes.position,sd=new THREE.Vector3(SUN.x,0,SUN.z).normalize();
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize(),y=Math.max(0,v.y);
    const col=SKY_FOG.clone().lerp(new THREE.Color(.16,.22,.32),Math.pow(y,.5));const warm=Math.pow(Math.max(0,v.x*sd.x+v.z*sd.z),4)*Math.exp(-y*6);
    col.r+=warm*.42;col.g+=warm*.22;col.b+=warm*.08;c.push(col.r,col.g,col.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  MSN.sky=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));MSN.sky.renderOrder=-10;MSN.sky.frustumCulled=false;S.add(MSN.sky);
  MSN.hip=3.3;
  if(MSN.build)MSN.build();
  miniInit($('mini'));MSN.ready=true;
}
/* ---------- the camera ---------- */
function cycleZoom(){CFI=(CFI+1)%CAMF.length;store.set('camf',CFI);HUD.msg('CAMERA '+CAMF[CFI].name,.9);}
const _ct=new THREE.Vector3(),_cp=new THREE.Vector3();
function updCam(dt){
  const C=CAMF[CFI%CAMF.length],land=W>H,D=C.D*(land?.85:1),ahead=C.ahead*(land?.8:1);
  /* turning: keys, the touch strip; it swings back behind the Wraith while it walks ahead */
  const kt=(KEYS.has('BracketRight')?1:0)-(KEYS.has('BracketLeft')?1:0);if(kt){MSN.camYaw-=kt*1.6*dt;MSN.turnT=0;}
  MSN.turnT+=dt;const hs=Math.hypot(P.vx,P.vz);
  if(MSN.turnT>1.4&&hs>2&&!P.dead){const d=angD(Math.atan2(-P.vx,-P.vz),MSN.camYaw);if(Math.abs(d)<.9)MSN.camYaw+=d*damp(.9,dt);}
  const fx=-Math.sin(MSN.camYaw),fz=-Math.cos(MSN.camYaw);
  const tx=P.x+fx*ahead,tz=P.z+fz*ahead,ty=Math.max(Math.max(P.y,RMD.World.waterAt(P.x,P.z))+1.5,Math.max(hgt(tx,tz),RMD.World.waterAt(tx,tz))+1);
  if(!CAMS.ready){_ct.set(tx,ty,tz);CAMS.ready=true;}else _ct.lerp(_cp.set(tx,ty,tz),damp(5,dt));
  const back=Math.cos(C.pitch)*(D+ahead),up=Math.sin(C.pitch)*(D+ahead)+P.y*0;
  let cx=_ct.x-fx*back,cz=_ct.z-fz*back,cy=_ct.y+up;const gy=Math.max(hgt(cx,cz),RMD.World.waterAt(cx,cz))+3;if(cy<gy)cy=gy;
  CAMS.shake=Math.max(0,CAMS.shake-dt*2.2);const sh=CAMS.shake*CAMS.shake*.6;
  cam.position.set(cx+(Math.random()-.5)*sh,cy+(Math.random()-.5)*sh,cz+(Math.random()-.5)*sh);cam.lookAt(_ct);
  if(MSN.sky)MSN.sky.position.copy(cam.position);
}
/* the touch strip across the top of the screen turns the camera (it claims touches there before C's sticks see them) */
(function(){let id=-1,x0=0;
  addEventListener('touchstart',e=>{if(G.mode!=='play'||G.paused)return;for(const t of e.changedTouches){if(t.target.closest&&t.target.closest('button,.panel'))continue;
    if(t.clientY<innerHeight*.2&&id<0){id=t.identifier;x0=t.clientX;if(e.changedTouches.length===1){e.stopImmediatePropagation();e.preventDefault();}}}},{capture:true,passive:false});
  addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===id){MSN.camYaw+=(t.clientX-x0)*.009;x0=t.clientX;MSN.turnT=0;}},{capture:true,passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===id)id=-1;};addEventListener('touchend',end,{capture:true});addEventListener('touchcancel',end,{capture:true});})();
/* ---------- controls: the screen's directions turned by the camera ---------- */
const _gr=new THREE.Raycaster(),_gm=new THREE.Vector2();
function groundUnderMouse(){_gm.set(MOUSE.x/innerWidth*2-1,-(MOUSE.y/innerHeight)*2+1);_gr.setFromCamera(_gm,cam);const o=_gr.ray.origin,d=_gr.ray.direction;if(d.y>-.01)return null;
  let t=(o.y-1.2)/-d.y;for(let i=0;i<8;i++){const x=o.x+d.x*t,z=o.z+d.z*t,h=Math.max(hgt(x,z),RMD.World.waterAt(x,z))+1.2;t=(o.y-h)/-d.y;}
  return {x:o.x+d.x*t,z:o.z+d.z*t};}
function readCtl(dt){const o=readCtlC(dt);const cy=MSN.camYaw,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy);
  /* C: mx = right, my = up on the screen (they were east and north while the camera faced north) */
  const ex=rx*o.mx+fx*o.my,ez=rz*o.mx+fz*o.my;o.mx=ex;o.my=-ez;
  if(o.aim){if(o.aimPt&&P){const g=groundUnderMouse();if(g){const dx=g.x-P.x,dz=g.z-P.z,d=Math.hypot(dx,dz)||1;o.ax=dx/d;o.az=dz/d;o.aimPt={x:g.x,z:g.z,d};}}
    else{const ax=o.ax,az=o.az;o.ax=rx*ax-fx*az;o.az=rz*ax-fz*az;}}
  return o;}
/* ---------- wading ---------- */
function updPlayer(c,dt){
  if(!P.dead&&!P.air){const d=RMD.World.depthAt(P.x,P.z),k=1-.65*smooth(.15,MSN.hip,d);if(k<1)c=Object.assign({},c,{mx:c.mx*k,my:c.my*k});}
  const ox=P.x,oz=P.z,d0=RMD.World.depthAt(ox,oz);
  updPlayerC(c,dt);
  if(!P.air&&!P.dead){const d1=RMD.World.depthAt(P.x,P.z);
    if(d1>MSN.hip&&d1>d0+.002){P.x=ox;P.z=oz;P.y=hgt(ox,oz);P.vx*=.3;P.vz*=.3;if(G.t-MSN.deepT>4){MSN.deepT=G.t;HUD.msg('TOO DEEP TO WADE · JET, THEN HOLD TO HOVER',1.8);}}}
  pushOut(P,2.2,P.air?P.y:hgt(P.x,P.z)+5);for(const w of WINGS)if(!w.down)pushOut(w,2.2,hgt(w.x,w.z)+5);
  P.depth=RMD.World.depthAt(P.x,P.z);}
/* the pier is solid: a walker whose head is above the deck is pushed out to the nearer side (a jet clears it) */
function pierRects(){const Q=MAP.def.PIER;if(!Q)return [];if(!MSN.pr){const h=Q.head;MSN.pr=[[Q.x-Q.w/2,Q.x+Q.w/2,Q.z1,Q.z0],[h.x-h.w/2,h.x+h.w/2,h.z-h.d/2,h.z+h.d/2]];}return MSN.pr;}
function pushOut(o,r,top){const Q=MAP.def.PIER;if(!Q||top<Q.y-.5||(o.y!=null&&o.y>Q.y+.3&&o===P&&P.air))return;
  for(const [x0,x1,z0,z1] of pierRects()){if(o.x<x0-r||o.x>x1+r||o.z<z0-r||o.z>z1+r)continue;
    const dl=o.x-(x0-r),dr=x1+r-o.x,dn=o.z-(z0-r),ds=z1+r-o.z,m=Math.min(dl,dr,dn,ds);
    if(m===dl)o.x=x0-r;else if(m===dr)o.x=x1+r;else if(m===dn)o.z=z0-r;else o.z=z1+r;}}
/* ---------- feet in the soil and the water ---------- */
function poseMech(Mx,st,dt){const ev=poseMechC(Mx,st,dt);
  for(const e of ev){if(e.x===undefined)continue;const f=RMD.World.foot(e.x,e.z,st.legYaw);
    if(f.depth>.05){const k=Math.min(1,f.depth/1.2),wy=RMD.World.waterAt(e.x,e.z);RMD.World.ring(e.x,e.z,.8+1.4*k);
      for(let i=0;i<8+12*k;i++){const a=Math.random()*TAU,v=(2+3*k)*(.3+Math.random()*.7);part({x:e.x,y:wy+.1,z:e.z,vx:Math.cos(a)*v,vy:(3+5*k)*(.5+Math.random()*.7),vz:Math.sin(a)*v,life:.8+Math.random()*.5,s0:.4,s1:1.2,a:.5,col:[.82,.86,.88],drag:.4,grav:9});}}}
  return ev;}
/* ---------- people on a deck stay on it ---------- */
/* allies on a deck stay on it; Gull's crew fire rifles: 1 dot every .8 s each, out to 30 m */
function updAllies(dt){updAlliesC(dt);for(const a of ALLIES){if(!a.deck||a.state===2)continue;const D=a.deck;a.x=clamp(a.x,D.x0,D.x1);a.z=clamp(a.z,D.z0,D.z1);
  if(a.state!==0)continue;a.cd=(a.cd==null?Math.random()*.8:a.cd)-dt;if(a.cd>0)continue;a.cd=.8;let t=null,bd=30;
  for(const e of EN){if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-a.x,e.z-a.z)-e.r;if(d<bd){bd=d;t=e;}}
  if(t){const hx=lerp(t.x,a.x,.25),hz=lerp(t.z,a.z,.25);hurtCluster(t,1,hx,t.cy,hz);sparks(hx,t.cy,hz,2,[.6,1,.6]);}}}
/* ---------- every frame: the world, the swarm's marks on it, the minimap, the mission ---------- */
function updRadio(dt){if(RADIO_T>0){RADIO_T-=dt;if(RADIO_T<=0)$('cap').style.opacity=0;}
  if(!MSN.ready||!P)return;
  RMD.World.update(dt,G.t,{x:P.x,y:P.y,z:P.z},cam,W,H,PR,R);
  DS.visible=!MSN.real;
  /* the bow wave while it wades */
  {const sp=Math.hypot(P.vx,P.vz),dep=P.air?0:(P.depth||0),k=dep>.25&&sp>.4?smooth(.4,4,sp)*Math.min(1,dep/1.2):0;
    MSN.bow=(MSN.bow||0)+(k-(MSN.bow||0))*damp(3.5,dt);if(MSN.bow>.01&&sp>.1)RMD.World.bow(P.x+P.vx/sp*1.3,P.z+P.vz/sp*1.3,P.vx/sp,P.vz/sp,MSN.bow,Math.min(16,4+2.4*sp));else RMD.World.bow(0,0,1,0,0);}
  /* where the creatures walk: the sand turned over (warm for a while), rings in shallow water */
  for(const e of EN){if(e.dead||e.spawnT>0)continue;if(e._mx===undefined){e._mx=e.x;e._mz=e.z;e._mr=0;}
    const d=Math.hypot(e.x-e._mx,e.z-e._mz);if(d<.6)continue;e._mx=e.x;e._mz=e.z;e._mr+=d;const sz=Math.sqrt(e.alive/10),dep=RMD.World.depthAt(e.x,e.z);
    if(dep<.5)RMD.World.churn(e.x,e.z,.55*sz+.35,.1*sz,.02*sz,.24);
    else if(dep<2.4&&e._mr>1.6){e._mr=0;RMD.World.ring(e.x,e.z,.35+.25*sz);}}
  if(MSN.glitch>0)MSN.glitch=Math.max(0,MSN.glitch-dt);
  if(MSN.step&&G.mode==='play'&&!G.paused)MSN.step(dt);
  MSN.miniT+=dt;if(MSN.miniT>.1){const cts=MSN.real?[]:EN.filter(e=>!e.dead).map(e=>({x:e.x,z:e.z,n:e.alive}));
    const al=ALLIES.filter(a=>a.state!==2).map(a=>({x:a.x,z:a.z})).concat(WINGS.filter(w=>!w.down).map(w=>({x:w.x,z:w.z})));
    miniDraw(P.x,P.z,MSN.camYaw,cts,MSN.miniT,{heading:P.legYaw,allies:al,marks:MSN.marks||[],rifts:[]});MSN.miniT=0;}
}
/* the sensor glitches when it's switched on, on top of the creatures' interference */
function sensorInterference(){let s=0;
  for(const e of EN){if(e.dead)continue;const d=Math.hypot(e.x-P.x,e.z-P.z),R_=e.rig.size*e.scale;s+=smooth(R_*3.2+8,R_*.75+2.5,d)*Math.sqrt(e.alive/100);}
  return clamp(.035+.6*(1-Math.exp(-s*.6))+MSN.glitch*.8,0,MSN.glitch>0?.95:.7);}
