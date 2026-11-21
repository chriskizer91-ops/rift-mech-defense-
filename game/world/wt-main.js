'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: THE PAGE (game/world/wt-main.js)
   The renderer, the top-down camera (high three-quarter, following the Wraith, north up), touch controls (left thumb
   walks, as in Ironhowl 4; hold HOVER for the jets), the three views, and the frame.
   For tests (tools/shoot.py's last argument): WT.ready (a promise), WT.place(x,z,yaw), WT.view(0|1|2), WT.sim(secs,mx,mz,hover)
   (runs the world forward without drawing), WT.barrage(), WT.zoom(metres), WT.stats().
   ===================================================================================================================== */
const $=id=>document.getElementById(id);
const WT={shake:0,flash:0,view:0,zoom:0,input:{mx:0,mz:0,hover:false},script:null,ready:null,fps:0,
  phone:matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600};
addEventListener('error',e=>{$('err').textContent+=(e.message||e)+'\n';});
addEventListener('unhandledrejection',e=>{$('err').textContent+=String(e.reason&&e.reason.stack||e.reason)+'\n';});
let capT=0;function caption(h,secs){$('cap').innerHTML=h;$('cap').style.opacity=1;capT=secs||4;}
let noteT=0;function note(h,secs){$('note').innerHTML=h;noteT=secs||1.2;}

/* ---------- renderer, scene, light ---------- */
const cv=document.createElement('canvas');document.body.prepend(cv);
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance',alpha:false});
const PR=Math.min(window.devicePixelRatio||1,WT.phone?1.5:2);
R.toneMapping=THREE.AgXToneMapping;R.toneMappingExposure=1.1;R.outputColorSpace=THREE.SRGBColorSpace;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();const FOG=new THREE.Color(.52,.58,.62);scene.background=FOG.clone();
const cam=new THREE.PerspectiveCamera(40,1,.5,1600);
const fsCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1),fsScene=new THREE.Scene(),fsQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));fsQuad.frustumCulled=false;fsScene.add(fsQuad);
const sun=new THREE.DirectionalLight(new THREE.Color(1,.88,.74),3.1);sun.castShadow=true;
sun.shadow.mapSize.set(WT.phone?1536:2048,WT.phone?1536:2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:200});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;
scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(new THREE.Color(.62,.68,.74),new THREE.Color(.32,.26,.2),.3);scene.add(hemi);
/* a small sky for reflections (the Wraith's metal, the water) */
(function(){const s=new THREE.Scene(),g=new THREE.SphereGeometry(10,32,16),c=[];const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i)/10,top=new THREE.Color(.22,.32,.46),hz=new THREE.Color(.52,.52,.5),gr=new THREE.Color(.16,.15,.14);
    const k=y>0?top.clone().lerp(hz,Math.pow(1-y,3)):gr.clone().lerp(hz,Math.pow(1+y,6));c.push(k.r,k.g,k.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));s.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const pm=new THREE.PMREMGenerator(R);scene.environment=pm.fromScene(s,.02).texture;pm.dispose();scene.environmentIntensity=.35;})();
let W=1,H=1,rtS,rtH1,rtH2,rtQ1,rtQ2;const HALF=R.extensions.has('EXT_color_buffer_float')||R.extensions.has('EXT_color_buffer_half_float');
function mkRT(w,h,d){return new THREE.WebGLRenderTarget(w,h,{type:HALF?THREE.HalfFloatType:THREE.UnsignedByteType,format:THREE.RGBAFormat,depthBuffer:!!d,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});}
function resize(){W=Math.max(1,innerWidth);H=Math.max(1,innerHeight);R.setPixelRatio(PR);R.setSize(W,H,false);const w=Math.floor(W*PR),h=Math.floor(H*PR);
  [rtS,rtH1,rtH2,rtQ1,rtQ2].forEach(t=>t&&t.dispose());rtS=mkRT(w,h,1);rtH1=mkRT(w>>1,h>>1);rtH2=mkRT(w>>1,h>>1);rtQ1=mkRT(w>>2,h>>2);rtQ2=mkRT(w>>2,h>>2);
  cam.aspect=W/H;cam.updateProjectionMatrix();}
function pass(mat,target){fsQuad.material=mat;R.setRenderTarget(target);R.render(fsScene,fsCam);}
const pxScale=()=>(H*PR)/(2*Math.tan(cam.fov*Math.PI/360));

/* ---------- the world ---------- */
const VIEWED=[];   /* every mesh with a material for each view: userData.mats = [real, sensor, thermal] */
function viewed(m,mats){m.userData.mats=mats;VIEWED.push(m);return m;}
let ground,water;
function buildWorld(){
  buildMap();soilInit();lookTextures();scene.fog=new THREE.Fog(FOG,MAP.def.fog[0],MAP.def.fog[1]);
  /* the ground: one grid that follows the Wraith, 25 cm apart under it and wider further out (Mud Lab's patch) */
  const E=Math.min(MAP.S/2,MAP.def.fog[1]*.75);
  const grid=(n,c)=>{const h=n/2,A=c*h,B=E-A,P=[],I=[];const w=q=>{const u=q/h-1;return A*u+B*u*u*u;};
    for(let j=0;j<=n;j++)for(let i=0;i<=n;i++)P.push(w(i),0,w(j));
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=j*(n+1)+i,q=p+1,r=p+n+1,s=r+1;I.push(p,r,s,p,s,q);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(P.length).map((_,k)=>k%3===1?1:0),3));g.setIndex(I);return g;};
  const g=grid(WT.phone?224:288,.25),gw=grid(WT.phone?96:128,.5);
  ground=viewed(new THREE.Mesh(g,matTerrain()),[null,matTerrainView(1),matTerrainView(2)]);ground.userData.mats[0]=ground.material;ground.receiveShadow=true;ground.frustumCulled=false;scene.add(ground);
  /* the water: the same grid, each point at the water's level there */
  water=new THREE.Mesh(gw,matWater());water.renderOrder=2;water.receiveShadow=true;water.frustumCulled=false;scene.add(water);
  /* materials for the town, the rocks and the wrecks */
  const T=LOOK.tex,std=(map,o)=>new THREE.MeshStandardMaterial(Object.assign({map,roughness:.88,metalness:.05},o||{}));
  const mats={fac1:std(T.fac1,{roughness:.8}),fac2:std(T.fac2,{roughness:.6,metalness:.15}),roof:std(T.roof,{color:0x8a8580}),rock:std(T.rock,{color:0xb8b0a4,roughness:.95}),
    wreck:std(T.metal,{color:0x7a7c80,roughness:.6,metalness:.5}),barn:std(T.barn||T.fac1,{roughness:.85})};
  const S1=matMeshView(1),S1r=matMeshView(1,{k:.8}),T1=matMeshView(2,{heat:.3}),T1r=matMeshView(2,{heat:.22}),T1w=matMeshView(2,{heat:.27});
  mats.rockS=S1r;mats.rockT=T1r;
  /* buildings: boxes, the facade picture 12 m to a tile */
  const geo={1:[],2:[],3:[]},roofs=[];
  for(const b of BUILD){const x0=b.x0,x1=b.x1,z0=b.z0,z1=b.z1,y0=b.y0,y1=b.y1,F=geo[b.kind],tl=b.kind===1?12:b.kind===3?6:16;
    const quad=(a,bq,c,d,uw,vh,u0,v0,arr)=>{arr.push([a,bq,c,d,uw,vh,u0||0,v0||0]);};
    const vr=(y1-y0)/tl,v0=-(y0+2)/tl;
    quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],(x1-x0)/tl,vr,x0/tl,v0,F);   /* south */
    quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],(x1-x0)/tl,vr,x0/tl,v0,F);   /* north */
    quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],(z1-z0)/tl,vr,z0/tl,v0,F);   /* east */
    quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],(z1-z0)/tl,vr,z0/tl,v0,F);   /* west */
    quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],(x1-x0)/8,(z1-z0)/8,0,0,roofs);}
  const mkG=arr=>{const p=[],u=[],ix=[];for(const [a,b,c,d,uw,vh,u0,v0] of arr){const k=p.length/3;p.push(...a,...b,...c,...d);u.push(u0,v0,u0+uw,v0,u0+uw,v0+vh,u0,v0+vh);ix.push(k,k+1,k+2,k,k+2,k+3);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();return g;};
  for(const [k,m] of [[1,mats.fac1],[2,mats.fac2],[3,mats.barn]]){if(!geo[k].length)continue;const me=viewed(new THREE.Mesh(mkG(geo[k]),m),[m,S1,T1]);me.castShadow=me.receiveShadow=true;scene.add(me);}
  {const me=viewed(new THREE.Mesh(mkG(roofs),mats.roof),[mats.roof,S1,T1]);me.castShadow=me.receiveShadow=true;scene.add(me);}
  /* wrecks: grey lumps (what a swarm leaves of machinery) */
  for(const [i,q] of WRECKS.entries()){const gg=rockGeo(500+i,1.6*q.s);gg.scale(1.5,.55,.9);const m=viewed(new THREE.Mesh(gg,mats.wreck),[mats.wreck,S1r,T1w]);
    m.position.set(q.x,q.y+.25*q.s,q.z);m.rotation.y=i*1.3;m.castShadow=m.receiveShadow=true;scene.add(m);}
  /* rocks along the bluff's foot */
  for(const [i,q] of ROCKS.entries()){const x=q.x,z=q.z,r=q.r;const m=viewed(new THREE.Mesh(rockGeo(900+i,r),mats.rock),[mats.rock,S1r,T1r]);
    m.position.set(x,hgt(x,z)+r*.3,z);m.rotation.set(rnd()*3,rnd()*3,rnd()*3);m.castShadow=m.receiveShadow=true;scene.add(m);}
  riftBuild(scene,mats);for(const R of RIFTS)for(const m of [...R.tun,...R.arch,...R.rubble])VIEWED.push(m);
  fxInit(scene);swarmInit(scene);
  /* steam where the cracks reach up near the surface */
  WT.steam=[];RS=5;for(let k=0;k<6000&&WT.steam.length<18;k++){const N=MAP.N,i=Math.floor(rnd()*N),j=Math.floor(rnd()*N);if(MAP.crk[j*N+i]>.6)WT.steam.push({x:MAP.X0+i*MAP.C,z:MAP.X0+j*MAP.C,t:rnd()*3});}
  treesInit(scene);
}
function setView(v){WT.view=v;for(const m of VIEWED){const s=m.userData.mats;if(s&&s[v])m.material=s[v];}
  if(MECH.M)for(const m of MECH.M.meshes)if(m.userData.mats)m.material=m.userData.mats[v];
  water.visible=v===0;FX.mesh.visible=v===0;SWARM.pts.visible=v>0;scene.fog=v===0?new THREE.Fog(FOG,MAP.def.fog[0],MAP.def.fog[1]):null;scene.background=v===0?FOG.clone():null;
  R.shadowMap.autoUpdate=v===0;
  for(let i=0;i<3;i++)$('v'+i).classList.toggle('on',i===v);$('nm').textContent=['REAL','SENSOR','THERMAL'][v];$('sen').style.display=v?'block':'none';
  $('cl').textContent=v===0?MAP.def.name+' · the Static, day 3':v===1?'Threat overlay · red: hostile · green: you':'Thermal · magma hot · sea cold';}

/* ---------- input: left thumb walks (anywhere on the left of the screen), HOVER held, keys ---------- */
const stick={id:null,x0:0,y0:0,x:0,y:0};const keys=new Set();
cv.addEventListener('pointerdown',e=>{if(e.clientX<W*.62&&stick.id===null){stick.id=e.pointerId;stick.x0=e.clientX;stick.y0=e.clientY;stick.x=stick.y=0;
  const s=$('stick');s.style.display='block';s.style.left=e.clientX+'px';s.style.top=e.clientY+'px';cv.setPointerCapture(e.pointerId);}});
cv.addEventListener('pointermove',e=>{if(e.pointerId!==stick.id)return;let dx=e.clientX-stick.x0,dy=e.clientY-stick.y0;const l=Math.hypot(dx,dy),m=52;if(l>m){dx*=m/l;dy*=m/l;}
  stick.x=dx/m;stick.y=dy/m;$('stick').firstElementChild.style.transform=`translate(${dx}px,${dy}px)`;});
const stickEnd=e=>{if(e.pointerId!==stick.id)return;stick.id=null;stick.x=stick.y=0;$('stick').style.display='none';$('stick').firstElementChild.style.transform='';};
cv.addEventListener('pointerup',stickEnd);cv.addEventListener('pointercancel',stickEnd);
/* two fingers or the wheel: zoom */
cv.addEventListener('wheel',e=>{WT.zoom=clamp(WT.zoom+e.deltaY*.03,-26,WT.zoomMax);},{passive:true});
const tch={};cv.addEventListener('touchstart',e=>{if(e.touches.length===2){tch.d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);tch.z=WT.zoom;}},{passive:true});
cv.addEventListener('touchmove',e=>{if(e.touches.length===2&&tch.d){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);WT.zoom=clamp(tch.z-(d-tch.d)*.12,-26,WT.zoomMax);}},{passive:true});
const hov=$('bHover');let hovHeld=false;
hov.addEventListener('pointerdown',e=>{hovHeld=true;hov.classList.add('on');hov.setPointerCapture(e.pointerId);e.preventDefault();});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])hov.addEventListener(ev,()=>{hovHeld=false;hov.classList.remove('on');});
for(let i=0;i<3;i++)$('v'+i).addEventListener('click',()=>setView(i));
$('bArt').addEventListener('click',artButton);
function artButton(){if(!riftOpenN()){riftReset();caption('<b>OVERWATCH</b> Rifts reset (test).',2);}else if(RIFTS.some(r=>r.state==='shelling'||r.state==='falling'))note('BARRAGE ALREADY ON ITS WAY',1.2);else riftBarrage();}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(k==='1'||k==='2'||k==='3')setView(+k-1);if(k==='v')setView((WT.view+1)%3);if(k==='b')artButton();if(k===' ')e.preventDefault();});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());
function readInput(){if(WT.script)return WT.script;let mx=stick.x,mz=stick.y;
  if(keys.has('a')||keys.has('arrowleft'))mx-=1;if(keys.has('d')||keys.has('arrowright'))mx+=1;if(keys.has('w')||keys.has('arrowup'))mz-=1;if(keys.has('s')||keys.has('arrowdown'))mz+=1;
  const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l;}return {mx,mz,hover:hovHeld||keys.has(' ')};}

/* ---------- one step of the world ---------- */
const camT=new THREE.Vector3(),camP=new THREE.Vector3();let jetT=0,firstNote=true;
function step(dt){
  SOIL.clock+=dt;LOOK.u.uT.value=SOIL.clock;dotMat.uniforms.uT.value=SOIL.clock;
  const P=MECH.P,M=MECH.M;
  if(P&&M&&M.ready){
    const c=readInput();updPlayer(P,c,dt);
    const ev=poseMech(M,{x:P.x,z:P.z,gy:P.y,legYaw:P.legYaw,aimYaw:P.legYaw,spd:P.spd,air:P.air,vy:P.vy,land:P.land,thrust:P.thrust,pitch:0},dt);
    const hip=hipDepth();
    for(const e of ev){if(e.x===undefined)continue;const dep=depthAt(e.x,e.z),load=1-.5*smooth(0,hip,dep);const S=soilFoot(e.x,e.z,P.legYaw,load);fxFoot(e.x,e.z,S,dep);WT.shake=Math.max(WT.shake,.1);}
    for(const e of P.ev){if(e.t==='land'){const dep=depthAt(P.x,P.z);WT.shake=Math.max(WT.shake,.25+e.k*.5);
      for(const L of M.legs){const S=soilFoot(L.fx,L.fz,P.legYaw,1.2+e.k);fxFoot(L.fx,L.fz,S,depthAt(L.fx,L.fz));}
      if(dep>.1){fxSpray(P.x,waterL(P.x,P.z),P.z,40,6,9,.6);lookRing(P.x,P.z,3);}}}
    P.ev.length=0;
    /* the jets' wash: on the water, rings and spray; on the ground, dust and a little churn */
    if(P.air&&P.thrust>.2){jetT+=dt;const g=hgt(P.x,P.z),alt=P.y-Math.max(g,waterL(P.x,P.z));
      if(alt<7&&jetT>.12){jetT=0;const k=smooth(7,1.5,alt)*P.thrust;
        const wl=waterL(P.x,P.z);if(g<wl){lookRing(P.x+(Math.random()-.5)*2,P.z+(Math.random()-.5)*2,1.2*k);fxSpray(P.x,wl+.05,P.z,Math.round(8*k),5*k,2.5,.5);}
        else{fxDust(P.x,g,P.z,Math.round(3*k),2,soilParams(P.x,P.z).kind,.35);soilChurn(P.x,P.z,2.2,.05*k,0,.25*k);}}}
    /* the bow wave while it wades (Mud Lab 17's: by its speed through the water and the water's depth) */
    {const sp=Math.hypot(P.vx,P.vz),dep=P.air?0:P.depth,want=dep>.25&&sp>.4?smooth(.4,4,sp)*Math.min(1,dep/1.2):0;
      LOOK.bow.z+=(want-LOOK.bow.z)*damp(3.5,dt);if(want>0){const dx=P.vx/sp,dz=P.vz/sp;LOOK.bowD.set(dx,dz,Math.min(16,4+2.4*sp),0);LOOK.bow.set(P.x+dx*1.3,P.z+dz*1.3,LOOK.bow.z,1.2);}
      if(dep>.3&&sp>1&&Math.random()<dt*sp*1.5)fxSpray(P.x+P.vx/sp*1.4,waterL(P.x,P.z)+.1,P.z+P.vz/sp*1.4,3,1.5,2.5,.35);}
    if(P.blocked>.9&&P.blocked<1.1)note(P.depth>hip-.3||depthAt(P.x+P.vx,P.z+P.vz)>hip?'TOO DEEP TO WADE · HOLD HOVER':'',1.2);
    if(M.meshes[0]&&M.meshes[0].userData.mats){const u=M.meshes[0].userData.mats[2].uniforms;u.uHeat.value=.5+.4*P.thrust;}
  }
  swarmStep(dt,SOIL.clock,P);riftStep(dt);fxStep(dt);soilSettle(dt);
  for(const s of WT.steam){s.t-=dt;if(s.t<=0){s.t=.35+Math.random()*.6;fx({x:s.x+(Math.random()-.5)*3,y:waterL(s.x,s.z)+.2,z:s.z+(Math.random()-.5)*3,vx:.3,vy:1.2,vz:0,s:2.5,grow:2.5,life:3,k:6,r:1,g:.95,b:.9,a:.45,fade:'in'});}}
  WT.shake*=Math.exp(-dt*5);WT.flash*=Math.exp(-dt*7);
  if(capT>0){capT-=dt;if(capT<=0)$('cap').style.opacity=0;}
  if(noteT>0){noteT-=dt;if(noteT<=0)$('note').innerHTML='';}
}
function placeCam(dt,snap){const P=MECH.P;if(!P)return;
  const land=W>H;const D=(land?40:50)+WT.zoom,pit=land?.86:.9;
  const tx=P.x,ty=Math.max(P.y,waterL(P.x,P.z))+1.5,tz=P.z-(land?4:7);
  if(snap)camT.set(tx,ty,tz);else camT.lerp(new THREE.Vector3(tx,ty,tz),damp(5,dt));
  camP.set(camT.x,camT.y+Math.sin(pit)*D,camT.z+Math.cos(pit)*D);
  const s=WT.shake;cam.position.set(camP.x+(Math.random()-.5)*s,camP.y+(Math.random()-.5)*s,camP.z+(Math.random()-.5)*s);cam.lookAt(camT);
  /* the ground follows, in 2 m steps; the sun's shadow follows */
  ground.position.set(Math.round(P.x/2)*2,0,Math.round(P.z/2)*2);water.position.copy(ground.position);soilFollow(P.x,P.z);treesFollow(P.x,P.z);
  const u=LOOK.u.uSun.value;sun.target.position.set(P.x,0,P.z-6);sun.position.set(P.x+u.x*90,u.y*90,P.z-6+u.z*90);}
/* ---------- drawing ---------- */
let holdUntil=0,interf=0;
function draw(now){
  const v=WT.view;
  if(v===0){R.setRenderTarget(null);R.render(scene,cam);return;}
  const P=MECH.P,nr=P?riftNear(P.x,P.z,true):null,dR=nr?nr.d:999;
  interf=clamp(.05+SWARM.near*.6+smooth(45,10,dR)*.16+WT.flash*.6,0,1);
  const stut=smooth(.55,1,interf)*.6;
  if(now<holdUntil)return;
  if(stut>0&&Math.random()<stut*.22)holdUntil=now+30+Math.random()*Math.random()*260*stut;
  const S=pxScale(),th=v===2;dotMat.uniforms.uScale.value=S;dotMat.uniforms.uSoft.value=th?1:0;
  dotMat.uniforms.uGain.value=th?.12:1.15;dotMat.uniforms.uMin.value=(th?6:2)*PR*.5+1;dotMat.uniforms.uMax.value=th?120:48;dotMat.uniforms.uSize.value=th?4:1;
  R.setRenderTarget(rtS);R.setClearColor(0x000000,0);R.clear();R.render(scene,cam);
  downMat.uniforms.tA.value=rtS.texture;downMat.uniforms.uPx.value.set(1/rtS.width,1/rtS.height);pass(downMat,rtH1);
  const spread=th?2.2:1;
  blurMat.uniforms.tA.value=rtH1.texture;blurMat.uniforms.uD.value.set(spread/rtH1.width,0);pass(blurMat,rtH2);
  blurMat.uniforms.tA.value=rtH2.texture;blurMat.uniforms.uD.value.set(0,spread/rtH1.height);pass(blurMat,rtH1);
  downMat.uniforms.tA.value=rtH1.texture;downMat.uniforms.uPx.value.set(1/rtH1.width,1/rtH1.height);pass(downMat,rtQ1);
  blurMat.uniforms.tA.value=rtQ1.texture;blurMat.uniforms.uD.value.set(spread*1.6/rtQ1.width,0);pass(blurMat,rtQ2);
  blurMat.uniforms.tA.value=rtQ2.texture;blurMat.uniforms.uD.value.set(0,spread*1.6/rtQ1.height);pass(blurMat,rtQ1);
  const u=finMat.uniforms;u.tS.value=rtS.texture;u.tH.value=rtH1.texture;u.tQ.value=rtQ1.texture;u.uMode.value=th?1:0;u.uI.value=interf;u.uT.value=SOIL.clock;
  u.uPix.value=1+Math.floor(smooth(.45,1,interf)*7)*PR;u.uRes.value.set(rtS.width,rtS.height);u.uFlash.value=WT.flash;u.uExp.value=1.3;
  pass(finMat,null);
}
/* ---------- the HUD ---------- */
let hudT=0,fpsN=0,fpsT=0;
function hud(dt){hudT-=dt;if(hudT>0)return;hudT=.15;const P=MECH.P;if(!P)return;
  const hip=hipDepth(),d=P.depth;$('wd').textContent=d<.03?'DRY':d.toFixed(1)+' M'+(P.air?' · HOVER':d>hip?' · TOO DEEP':d>.4?' · WADING':'');
  $('wdi').style.width=Math.min(100,d/(hip*1.4)*100)+'%';$('wdb').classList.toggle('bad',d>hip*.85);$('wdh').style.left=(100/1.4)+'%';
  $('spd').textContent=Math.round(Math.hypot(P.vx,P.vz)*3.6)+' KM/H';
  if(WT.view){$('cnt').textContent=SWARM.shown.toLocaleString('en-US')+' dots';const conf=clamp(1-interf*.95,0,1);$('conf').style.width=(conf*100).toFixed(0)+'%';$('confb').classList.toggle('bad',conf<.45);}
  const ri=R.info.render;$('fps').textContent=`${WT.fps.toFixed(0)} FPS · ${(ri.triangles/1000).toFixed(0)}K TRIS`;
  const busy=RIFTS.some(r=>r.state==='shelling'||r.state==='falling'),nr=riftNear(P.x,P.z,true);
  $('bArt').innerHTML=!riftOpenN()?'Reset rifts<small>(test)</small>':busy?'Shells<small>on the way</small>':'Artillery<small>'+(nr?Math.round(nr.d)+' m · '+(RIFTS.length>1?nr.R.M.name:'on the rift'):'')+'</small>';
  $('rift').textContent=nr?Math.round(nr.d)+' M '+compass(nr.R.M.x-P.x,nr.R.M.zf-P.z):'ALL SEALED';}
const compass=(dx,dz)=>['N','NE','E','SE','S','SW','W','NW'][Math.round(((Math.atan2(dx,-dz)/TAU)*8+8))%8];
/* ---------- the frame ---------- */
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
  fpsN++;fpsT+=dt;if(fpsT>1){WT.fps=fpsN/fpsT;fpsN=0;fpsT=0;}
  step(dt);placeCam(dt);soilUpload(R);hud(dt);draw(now);}

/* ---------- start ---------- */
addEventListener('resize',resize);resize();
buildWorld();MECH.P=mkPlayer();
WT.ready=buildMech(scene).then(M=>{
  for(const m of M.meshes)m.userData.mats=[m.material,matMeshView(1,{ally:1}),matMeshView(2,{heat:.5})];
  /* one shared thermal material for the Wraith so its heat can follow the jets */
  const th=M.meshes[0].userData.mats[2];for(const m of M.meshes)m.userData.mats[2]=th;
  poseMech(M,{x:MECH.P.x,z:MECH.P.z,gy:MECH.P.y,legYaw:MECH.P.legYaw,aimYaw:MECH.P.legYaw,spd:0,air:false,vy:0,land:0,thrust:0,pitch:0},.016);
  setView(/sensor/.test(location.hash)?1:/thermal/.test(location.hash)?2:0);placeCam(0,true);
  $('load').remove();caption('<b>OVERWATCH</b> Wraith, swarm coming ashore. Switch to SENSOR to see them.',6);
  requestAnimationFrame(loop);return M;});
/* ---------- for tests ---------- */
WT.place=(x,z,yaw)=>{const P=MECH.P;P.x=x;P.z=z;P.y=hgt(x,z);if(yaw!=null)P.yaw=P.legYaw=yaw;P.vx=P.vz=0;P.air=false;P.hover=false;placeCam(0,true);};
WT.setView=setView;WT.barrage=()=>riftBarrage();WT.zoomTo=z=>{WT.zoom=z;placeCam(0,true);};WT.zoomMax=MAPID==='fields'?260:60;
WT.sim=(secs,mx,mz,hover)=>{WT.script={mx:mx||0,mz:mz||0,hover:!!hover};const n=Math.round(secs*30);for(let i=0;i<n;i++){step(1/30);if(i%30===0)soilFollow(MECH.P.x,MECH.P.z);}placeCam(0,true);WT.script=null;soilCap=1e9;soilUpload(R);soilCap=12;};
WT.stats=()=>({fps:WT.fps,tris:R.info.render.triangles,calls:R.info.render.calls,dots:SWARM.shown,prints:SOIL.stat.prints,tiles:SOIL.stat.tiles,craters:SOIL.stat.craters,
  x:MECH.P.x,z:MECH.P.z,y:MECH.P.y,depth:MECH.P.depth,air:MECH.P.air,rift:RIFTS.map(r=>r.state).join(','),trees:TREE.shown});
window.WT=WT;
/* ---------- for other sessions (C's arena, A's creatures): the ground and the water ----------
   heightAt(x,z): the ground's height (m), soil and all; depthAt(x,z): water over it (0 where it's dry);
   waterAt(x,z): the water's level; size, x0: the map's side and its west/north edge */
window.RMD=window.RMD||{};window.RMD.World={heightAt:hgt,depthAt,waterAt:waterL,get size(){return MAP.S;},get x0(){return MAP.X0;},map:MAPID};
