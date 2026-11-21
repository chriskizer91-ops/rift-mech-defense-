'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: SPRAY, DUST, SHELLS AND THE RIFT (game/world/wt-fx.js)
   One pool of billboards for everything thrown about: clods, sand, spray, smoke, fire. Drawn with Ironhowl 4's
   particle shader (06x PFX: its smoke puff and its fx atlas: two explosions, a muzzle flash, sparks, steam), with a
   solid round clod added. Clods that land on the ground are taken into the soil as a lump (Mud Lab's mlLand).
   THE RIFT is a cave mouth in the bluff's south face, opening into a tunnel that goes down into the ground. ARTILLERY
   calls a barrage on it: fourteen shells over five seconds; each digs a crater, and when the last has landed the
   face above the mouth comes down and fills it. Nothing comes out of it after that.
   ===================================================================================================================== */
const FX={max:2200,n:0,P:[],mesh:null,iP:null,iS:null,iC:null};
/* kinds (the shader's iS.w): 0 smoke, .7 clod, 1 glow, 1.3 ring, 2/3 explosions, 4 flash, 5 sparks, 6 steam */
function fxInit(scene){
  const base=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
  const n=FX.max;FX.iP=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);FX.iS=new THREE.InstancedBufferAttribute(new Float32Array(n*4),4);FX.iC=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);
  for(const a of [FX.iP,FX.iS,FX.iC])a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP',FX.iP);g.setAttribute('iS',FX.iS);g.setAttribute('iC',FX.iC);g.instanceCount=0;
  const m=new THREE.ShaderMaterial({uniforms:{tSmoke:{value:LOOK.tex.smoke},tFx:{value:LOOK.tex.fx}},transparent:true,depthWrite:false,
    blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
    vertexShader:`attribute vec3 iP;attribute vec4 iS;attribute vec3 iC;varying vec2 vUv;varying vec4 vS;varying vec3 vC;
      void main(){vUv=uv;vS=iS;vC=iC;float c=cos(iS.y),s=sin(iS.y);vec2 q=vec2(c*position.x-s*position.y,s*position.x+c*position.y)*iS.x;
        vec4 mv=viewMatrix*vec4(iP,1.);mv.xy+=q;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D tSmoke,tFx;varying vec2 vUv;varying vec4 vS;varying vec3 vC;
      void main(){if(vS.w<.5){float t=texture2D(tSmoke,vUv).r;float a=smoothstep(.04,.6,t)*vS.z;gl_FragColor=vec4(vC*(.6+.5*t)*a,a);}
        else if(vS.w<.9){float r=length(vUv-.5)*2.;if(r>1.)discard;float a=smoothstep(1.,.75,r)*vS.z;gl_FragColor=vec4(vC*(1.-.35*r*r)*a,a);}
        else if(vS.w<1.2){float r=length(vUv-.5)*2.;float gl=pow(max(0.,1.-r),2.2);gl_FragColor=vec4(vC*gl*vS.z,0.);}
        else if(vS.w<1.5){float r=length(vUv-.5)*2.;float gl=smoothstep(.55,.84,r)*(1.-smoothstep(.86,1.,r));gl_FragColor=vec4(vC*gl*vS.z,0.);}
        else{float t=vS.w-2.;vec2 tu=vec2((mod(t,4.)+vUv.x)*.25,1.-(floor(t/4.)+1.-vUv.y)*.5);vec3 c=texture2D(tFx,tu).rgb;
          float edge=smoothstep(.5,.42,max(abs(vUv.x-.5),abs(vUv.y-.5)));c*=edge;
          if(t>3.5){float a=smoothstep(.04,.6,dot(c,vec3(.33)))*vS.z;gl_FragColor=vec4(vC*c*a,a);}else gl_FragColor=vec4(c*vC*vS.z,0.);}}`});
  FX.mesh=new THREE.Mesh(g,m);FX.mesh.frustumCulled=false;FX.mesh.renderOrder=5;scene.add(FX.mesh);}
/* add one: o = {x,y,z, vx,vy,vz, s (size, m), grow (m/s), life (s), k (kind), r,g,b, a (alpha), grav, drag, lump (soil it carries, m^3), rot, spin} */
function fx(o){if(FX.P.length>=FX.max)return null;o.t=0;o.a0=o.a==null?1:o.a;o.rot=o.rot==null?Math.random()*TAU:o.rot;FX.P.push(o);return o;}
function fxStep(dt){
  const P=FX.P;let w=0;
  for(let i=0;i<P.length;i++){const p=P[i];p.t+=dt;if(p.t>=p.life)continue;
    if(p.grav)p.vy-=p.grav*dt;if(p.drag){const k=1-damp(p.drag,dt);p.vx*=k;p.vy*=k;p.vz*=k;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.s+=(p.grow||0)*dt;p.rot+=(p.spin||0)*dt;
    if(p.k===.7&&p.vy<0){const g=hgt(p.x,p.z),wl=waterL(p.x,p.z);if(p.y<=Math.max(g,wl)){if(g>=wl&&p.lump)soilLump(p.x,p.z,p.lump);else if(p.lump)lookRing(p.x,p.z,.3);continue;}}
    P[w++]=p;}
  P.length=w;
  const n=Math.min(w,FX.max),A=FX.iP.array,S=FX.iS.array,C=FX.iC.array;
  for(let i=0;i<n;i++){const p=P[i],u=p.t/p.life,fade=p.fade==='in'?Math.sin(u*Math.PI):p.k===.7?1:1-u*u;
    A[i*3]=p.x;A[i*3+1]=p.y;A[i*3+2]=p.z;S[i*4]=p.s;S[i*4+1]=p.rot;S[i*4+2]=p.a0*fade;S[i*4+3]=p.k;C[i*3]=p.r;C[i*3+1]=p.g;C[i*3+2]=p.b;}
  FX.mesh.geometry.instanceCount=n;FX.iP.needsUpdate=FX.iS.needsUpdate=FX.iC.needsUpdate=true;FX.n=n;}
/* the soil's colour, for clods and dust */
const SOILCOL={sand:[.62,.5,.34],wsand:[.4,.32,.22],mud:[.2,.15,.1],dirt:[.42,.26,.16],hard:[.3,.3,.3],rock:[.42,.38,.33],meadow:[.26,.22,.13],plough:[.3,.2,.13],wheat:[.42,.33,.18]};
function fxClods(x,y,z,n,sp,up,kind,lump){const c=SOILCOL[kind]||SOILCOL.dirt;
  for(let i=0;i<n;i++){const a=Math.random()*TAU,v=sp*(.3+Math.random()*.7),b=.7+Math.random()*.45;
    fx({x,y,z,vx:Math.cos(a)*v,vy:up*(.4+Math.random()*.8),vz:Math.sin(a)*v,s:.08+Math.random()*Math.random()*.32,life:4,k:.7,r:c[0]*b,g:c[1]*b,b:c[2]*b,grav:16,drag:.15,lump:lump?lump*(.5+Math.random()):0});}}
function fxDust(x,y,z,n,s,kind,a){const c=SOILCOL[kind]||SOILCOL.dirt;
  for(let i=0;i<n;i++){const q=Math.random()*TAU,v=.6+Math.random()*1.4;
    fx({x:x+Math.cos(q)*.4,y:y+.2,z:z+Math.sin(q)*.4,vx:Math.cos(q)*v,vy:.4+Math.random()*.8,vz:Math.sin(q)*v,s:s*(.6+Math.random()*.6),grow:s*.7,life:1.4+Math.random()*1.2,k:0,
      r:c[0]*1.1+.08,g:c[1]*1.1+.07,b:c[2]*1.1+.06,a:(a||.45)*(.6+Math.random()*.4),drag:1.2,grav:-.15});}}
function fxSpray(x,y,z,n,sp,up,s){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=sp*(.3+Math.random()*.7);
  fx({x,y,z,vx:Math.cos(a)*v,vy:up*(.5+Math.random()*.7),vz:Math.sin(a)*v,s:(s||.25)*(.6+Math.random()*.8),grow:.5,life:.9+Math.random()*.6,k:0,r:.85,g:.88,b:.9,a:.55,grav:9,drag:.4});}}
/* ---------- a foot coming down ---------- */
function fxFoot(x,z,P,dep){
  if(dep>.05){const k=Math.min(1,dep/1.2);fxSpray(x,waterL(x,z)+.05,z,Math.round(6+14*k),2+3*k,3+5*k,.35+.4*k);lookRing(x,z,.8+1.4*k);return;}
  const kind=P.kind;if(kind==='sand')fxDust(x,hgt(x,z),z,3,1.1,'sand',.32);
  else if(kind==='dirt'||kind==='rock'||kind==='wheat')fxDust(x,hgt(x,z),z,2,1,'dirt',.3);
  if(kind==='mud'||kind==='wsand'||kind==='plough'||kind==='meadow')fxClods(x,hgt(x,z)+.15,z,kind==='mud'||kind==='plough'?10:4,2.2,4,kind,.0012);
  else if(kind==='sand')fxClods(x,hgt(x,z)+.15,z,5,2.5,3,kind,.0008);}

/* ---------- the rifts' mouths: the tunnel, its arch of rock, the rubble that fills it ----------
   Each mouth is built in its own frame: x across the face, y up, z out of the face (toward whatever it faces) */
const RIFTS=[],RLIGHTS=[];
function rockGeo(seed,r){const g=new THREE.IcosahedronGeometry(r,2),p=g.attributes.position;RS=seed;const o=[rnd()*9,rnd()*9,rnd()*9];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.35*(vnoise(x/r*1.6+o[0],z/r*1.6+y/r+o[1])-.5)+.2*(vnoise(y/r*3+o[2],x/r*3)-.5);
    p.setXYZ(i,x*k,y*k*.8,z*k);}g.computeVertexNormals();return g;}
/* a point in a mouth's frame, in the world */
function rW(M,lx,ly,lz){const c=Math.cos(M.yaw),s=Math.sin(M.yaw);return new THREE.Vector3(M.x+lx*c+lz*s,ly,M.zf-lx*s+lz*c);}
function riftBuild(scene,mats){
  MAP.def.MOUTHS.forEach((M,idx)=>{
    const R={M,idx,state:'open',open:1,t:0,arch:[],rubble:[],pend:[],heapD:0,shook:0};RIFTS.push(R);
    const G=R.grp=new THREE.Group();G.position.set(M.x,0,M.zf);G.rotation.y=M.yaw;scene.add(G);
    /* the tunnel: an arch drawn round (the mouth's shape) and carried 26 m into the scarp, dropping as it goes */
    const nA=18,nL=14,pos=[],uv=[],ix=[];
    for(let l=0;l<=nL;l++){const f=l/nL,z=1-f*26,y0=M.y-f*5,sc=1-f*.25;
      for(let a=0;a<=nA;a++){const th=Math.PI*(1-a/nA);pos.push(Math.cos(th)*M.w*1.04*sc,y0+Math.max(-.3,Math.sin(th))*M.h*1.02*sc-.3,z);uv.push(a/nA*3,f*6);}}
    for(let l=0;l<nL;l++)for(let a=0;a<nA;a++){const p=l*(nA+1)+a,q=p+nA+1;ix.push(p,p+1,q,p+1,q+1,q);}
    const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tg.setIndex(ix);tg.computeVertexNormals();
    const fg=new THREE.PlaneGeometry(M.w*2.1,29,1,9);fg.rotateX(-Math.PI/2);fg.translate(0,0,3.5-14.5);
    {const p=fg.attributes.position;for(let i=0;i<p.count;i++){const f=Math.max(0,(1-p.getZ(i))/26);p.setY(i,M.y-.25-f*5);}fg.computeVertexNormals();}
    const tunMat=R.tunMat=new THREE.ShaderMaterial({uniforms:{tR:{value:LOOK.tex.rock},uT:LOOK.u.uT,uOpen:{value:1}},side:THREE.DoubleSide,
      vertexShader:`varying vec3 vL,vWp;void main(){vL=position;vec4 w=modelMatrix*vec4(position,1.);vWp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:`uniform sampler2D tR;uniform float uT,uOpen;varying vec3 vL,vWp;
        void main(){float d=clamp((1.-vL.z)/26.,0.,1.);if(vL.z>1.2&&vL.y<-1e9)discard;vec3 r=texture2D(tR,vL.xy/6.+vL.zz/9.).rgb;
          vec3 c=r*.2*exp(-d*5.)+vec3(1.,.18,.05)*pow(d,2.2)*(.55+.25*sin(uT*2.1+vL.z*.4))*uOpen;gl_FragColor=vec4(c,1.);}`});
    R.tun=[new THREE.Mesh(tg,tunMat),new THREE.Mesh(fg,tunMat)];for(const m of R.tun){m.userData.mats=[tunMat,matMeshView(1,{k:.6,side:THREE.DoubleSide}),matMeshView(2,{heat:.62,side:THREE.DoubleSide})];G.add(m);}
    /* the arch of rocks round the mouth */
    for(let i=0;i<13;i++){const th=Math.PI*(i/12),r=1.6+((i*7)%5)*.25;const m=new THREE.Mesh(rockGeo(31+i+idx*50,r),mats.rock);
      m.position.copy(rW(M,Math.cos(th)*(M.w+r*.55),M.y+Math.sin(th)*(M.h+r*.4)-.2,.6+(i%3)*.4));m.rotation.set(i,i*1.7,i*.3);m.castShadow=m.receiveShadow=true;
      m.userData.mats=[mats.rock,mats.rockS,mats.rockT];m.userData.home=m.position.clone();scene.add(m);R.arch.push(m);}
    /* the rubble that will come down (hidden until then) */
    for(let i=0;i<16;i++){const r=1.2+(i%4)*.55;const m=new THREE.Mesh(rockGeo(71+i+idx*50,r),mats.rock);m.visible=false;m.castShadow=m.receiveShadow=true;
      m.userData.mats=[mats.rock,mats.rockS,mats.rockT];m.userData.to=rW(M,(i%5-2)*2.6+Math.sin(i)*1.2,0,1.5+((i*3)%4)*1.3);m.userData.from=rW(M,(i%5-2)*2,13+i%3,-5);scene.add(m);R.rubble.push(m);}
    R.glow=new THREE.PointLight(0xff4a18,30,22,1.6);R.glow.position.copy(rW(M,0,M.y+3,-4));scene.add(R.glow);
    LOOK.u.uRiftP.value[idx].set(M.x,M.y,M.zf,M.yaw);LOOK.u.uRiftO.value[idx].x=1;});
  for(let i=0;i<3;i++){const L=new THREE.PointLight(0xffa040,0,40,1.6);scene.add(L);RLIGHTS.push({L,t:9});}
}
const riftOpenN=()=>RIFTS.filter(r=>r.state!=='sealed').length;
function riftNear(x,z,open){let best=null,bd=1e9;for(const R of RIFTS){if(open&&R.state!=='open')continue;const d=Math.hypot(x-R.M.x,z-R.M.zf);if(d<bd){bd=d;best=R;}}return best?{R:best,d:bd}:null;}
/* ---------- ARTILLERY: a barrage on the nearest open rift ---------- */
function riftBarrage(){const P=MECH.P,n=riftNear(P.x,P.z,true);if(!n)return false;if(n.d>600){note('NO RIFT IN RANGE (600 M)',1.5);return false;}
  const R=n.R,M=R.M;R.state='shelling';R.t=0;RS=(Date.now()&65535)+1;
  const T=[];for(let i=0;i<14;i++){const top=i%3===2;const p=top?rW(M,(rnd()-.5)*26,0,-6-rnd()*10):rW(M,(rnd()-.5)*22,0,2+rnd()*12);T.push({x:p.x,z:p.z,at:.6+i*.32+rnd()*.25});}
  for(const [lx,lz,at] of [[-1,-3,5.4],[2,-2,5.55]]){const p=rW(M,lx,0,lz);T.push({x:p.x,z:p.z,at});}   /* the last two right over the mouth */
  R.pend=T;caption('<b>OVERWATCH</b> Fire mission'+(M.name?' on the '+M.name:' on the rift')+'. Shells away.',3.5);return true;}
function shellLand(x,z){
  const g=hgt(x,z),wl=waterL(x,z),top=g>baseH(x,z)+0&&soilParams(x,z).kind==='rock',R=top?2.6:3.2,D=top?.9:1.5;soilCrater(x,z,R,D);
  const y=Math.max(g,wl)+.3,kind=soilParams(x,z).kind;
  fx({x,y:y+1.5,z,vx:0,vy:0,vz:0,s:12,grow:6,life:.5,k:2+(Math.random()<.5?0:1),r:1,g:1,b:1,a:1});
  fx({x,y:y+1,z,vx:0,vy:0,vz:0,s:22,life:.14,k:4,r:1,g:.9,b:.7,a:1});
  fx({x,y:y+.4,z,vx:0,vy:0,vz:0,s:4,grow:46,life:.45,k:1.3,r:1,g:.7,b:.4,a:.8,rot:0});
  for(let i=0;i<7;i++)fx({x:x+(Math.random()-.5)*3,y:y+1+Math.random()*2,z:z+(Math.random()-.5)*3,vx:(Math.random()-.5)*3,vy:1.5+Math.random()*2.5,vz:(Math.random()-.5)*3,
    s:4+Math.random()*3,grow:2.2,life:4+Math.random()*3,k:0,r:.2,g:.19,b:.18,a:.75,drag:.6});
  for(let i=0;i<4;i++)fx({x,y:y+1,z,vx:(Math.random()-.5)*14,vy:6+Math.random()*10,vz:(Math.random()-.5)*14,s:2,life:.5,k:5,r:1,g:1,b:1,a:1,grav:10});
  if(wl>g){fxSpray(x,wl,z,60,8,14,.8);lookRing(x,z,3);}else fxClods(x,y+.4,z,34,9,14,kind,.006);
  const L=RLIGHTS.find(l=>l.t>.5)||RLIGHTS[0];L.L.position.set(x,y+4,z);L.t=0;
  WT.shake=Math.max(WT.shake,smooth(90,10,Math.hypot(x-MECH.P.x,z-MECH.P.z))*1.1);WT.flash=Math.max(WT.flash,.25);
  SWARM.blast(x,z,9);}
function riftStep(dt){
  for(const l of RLIGHTS){l.t+=dt;l.L.intensity=l.t<.5?900*Math.exp(-l.t*9):0;}
  for(const R of RIFTS){const M=R.M;
  if(R.state==='shelling'||R.state==='falling'){R.t+=dt;
    for(let i=R.pend.length-1;i>=0;i--){const s=R.pend[i];
      if(!s.tr&&R.t>s.at-1.1){s.tr=1;s.x0=s.x+36;s.z0=s.z+70;}
      if(s.tr&&R.t<s.at){const f=clamp(1-(s.at-R.t)/1.1,0,1),px=lerp(s.x0,s.x,f),pz=lerp(s.z0,s.z,f),py=lerp(160+M.y,hgt(s.x,s.z),f*f*.2+f*.8);
        fx({x:px,y:py,z:pz,vx:0,vy:0,vz:0,s:1.8,life:.28,k:1,r:1,g:.8,b:.5,a:1});}
      if(R.t>=s.at){R.pend.splice(i,1);shellLand(s.x,s.z);}}
    if(R.state==='shelling'&&!R.pend.length){R.state='falling';R.t=0;caption('<b>OVERWATCH</b> Good hits. The face is coming down…',4);}}
  if(R.state==='falling'){
    /* the face above the mouth slides down into it over 1.6 s: the soil heaps up, the rocks come down, the mouth closes */
    const f=clamp(R.t/1.6,0,1),k=smooth(0,1,f);
    if(k>R.heapD){const d=k-R.heapD;R.heapD=k;const H=(lx,lz,r,h)=>{const p=rW(M,lx,0,lz);soilHeap(p.x,p.z,r,h*d);};
      H(0,2.2,11,7.6);H(0,-3,8,-2.6);H(5,6,7,1.6);H(-6,5,6,1.2);}
    R.open=1-k;LOOK.u.uRiftO.value[R.idx].x=R.open;R.tunMat.uniforms.uOpen.value=R.open;R.glow.intensity=30*R.open;
    for(const [i,a] of R.arch.entries()){const h=a.userData.home,ox=Math.sin(M.yaw)*2.5,oz=Math.cos(M.yaw)*2.5;
      a.position.set(lerp(h.x,lerp(h.x,M.x,.25)+ox,k),lerp(h.y,Math.max(hgt(h.x,h.z),h.y-6)+.4,k),lerp(h.z,lerp(h.z,M.zf,.25)+oz,k));a.rotation.x+=dt*k*(i%2?1:-1);}
    for(const [i,r] of R.rubble.entries()){const t=clamp((R.t-i*.06)/1.1,0,1);if(t<=0)continue;r.visible=true;const to=r.userData.to,fr=r.userData.from,gy=hgt(to.x,to.z);
      r.position.set(lerp(fr.x,to.x,t),lerp(M.y+fr.y,gy+.3,t*t),lerp(fr.z,to.z,t));r.rotation.set(t*3+i,t*2,i);}
    if(Math.random()<dt*30){const p=rW(M,(Math.random()-.5)*16,0,2+Math.random()*4);fxDust(p.x,M.y+Math.random()*7,p.z,1,5,'rock',.7);}
    if(f>=1&&!R.shook){R.shook=1;WT.shake=Math.max(WT.shake,.9);}
    if(f>=1&&R.t>2.4){R.state='sealed';WT.shake=Math.max(WT.shake,.6);for(let i=0;i<26;i++){const p=rW(M,(Math.random()-.5)*20,0,3+Math.random()*6);fxDust(p.x,M.y+1,p.z,1,7,'rock',.6);}
      const n=riftOpenN();caption('<b>OVERWATCH</b> '+(M.name||'Rift')+' is sealed.'+(n?' '+n+' still open.':' Nothing more is coming out.'),5);}}}
}
/* put the rifts back (for testing again) */
function riftReset(){for(const R of RIFTS){R.state='open';R.open=1;R.heapD=0;R.shook=0;R.pend=[];LOOK.u.uRiftO.value[R.idx].x=1;R.tunMat.uniforms.uOpen.value=1;R.glow.intensity=30;
  for(const a of R.arch)a.position.copy(a.userData.home);for(const r of R.rubble)r.visible=false;}soilClear();}
