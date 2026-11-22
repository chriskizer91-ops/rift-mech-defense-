'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 5, NIGHT SHIFT (game/cinematic/film/scene-m5.js, session D)
   3 min 16 on the Saltpans at night. The whole mission; the Copper stretch is scene-m5c.js moved by 91 s.
     0:00  the saltworks from the drone. The Wraith switches to thermal. Copper's eight and Reed's six come out.
     0:26  contacts on both sides. The channel is too wide for the jets: "Go west." Copper: "We'll hold. Go."
     0:57  the Wraith holds the west side for Reed and the civilians: one STALKER and four RUNNERs. Copper's rifles across
           the water the whole time.
     1:40  Copper's helmet: the ground moving. Their dots turn red: two, five, all of them. The pack, bigger.
     2:09  the pack crosses the channel. The picture breaks up. Fire only on the lock: "Now." Three times, the Lance.
     2:42  board clear. Reed: "Don't forget them." "I won't." Copper logged as lost: eight names. The Arc is coming.
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=196,DT=1/60,OFF=91;
const P11=.35,R11=1+.13*P11,T11=16.6+OFF;   /* M5_11's words "Two." "Five." "All of them." are at 4.79, 5.72, 6.94 s in the take */
const TW=[T11+4.79/R11,T11+5.72/R11,T11+6.94/R11];
const TURN=[TW[0],TW[0]+.12,TW[1],TW[1]+.1,TW[1]+.22,TW[2],TW[2]+.12,TW[2]+.26];
const WIN=[143.2,150.2,157.2],WL=1.9;                 /* the three locks */
const lockAt=t=>{for(let w=0;w<3;w++)if(t>=WIN[w]&&t<WIN[w]+WL)return w;return -1;};
const LINES=[
 {id:'M5_01_OW',t:2.0,w:6.3,who:'OVERWATCH',p:.1,tx:'The saltworks. People are still coming out. Copper’s on the east side, Reed’s on the west.'},
 {id:'M5_02_OW',t:10.8,w:3.8,who:'OVERWATCH',p:.1,tx:'It’s night. Thermal will be clearer than the sensor.'},
 {id:'M5_03_COPPER',t:15.8,w:4.6,who:'COPPER',p:.15,tx:'Copper. Eight of us, bringing out the last of the night shift.'},
 {id:'M5_04_REED',t:21.6,w:3.4,who:'REED',p:.15,tx:'Reed. Out the west gate. Moving.'},
 {id:'M5_05_OW',t:26.3,w:3.9,who:'OVERWATCH',p:.55,tx:'Wait. Both of them. Both squads have contacts.'},
 {id:'M5_06_COPPER',t:31.0,w:4.7,who:'COPPER',p:.4,tx:'OVERWATCH, Copper. Contacts on the east pans. A lot of them.'},
 {id:'M5_07_REED',t:36.8,w:4.7,who:'REED',p:.35,tx:'Reed, west side. Movement here too. We’ve got the civilians.'},
 {id:'M5_08_OW',t:42.6,w:6.1,who:'OVERWATCH',p:.6,tx:'Wraith, Reed has the civilians and Copper’s across the channel. It’s too wide for your jets. Go west.'},
 {id:'PING_04_PILOT',t:49.2,w:1.5,who:'WRAITH',p:.1,tx:'Moving.'},
 {id:'M5_09_COPPER',t:51.2,w:5.6,who:'COPPER',p:.3,tx:'Copper to Wraith. She’s right. You can’t get to us. We’ll hold. Go.'},
 {id:'GEN_15_REED',t:72.6,w:2.4,who:'REED',p:.4,tx:'Painting it. Send it.'},
 {id:'PING_03_PILOT',t:75.6,w:1.6,who:'WRAITH',p:.3,tx:'On it.'},
 {id:'M5_10_COPPER',t:9.2+OFF,w:3.7,who:'COPPER',p:.75,tx:'We can’t see anything, it’s just the ground moving, it’s…'},
 {id:'M5_11_OW',t:T11,w:7.3,who:'OVERWATCH',p:P11,tx:'Copper, come in. Their dots are changing colour. Two. Five. All of them.'},
 {id:'M5_12_OW',t:30.4+OFF,w:6.0,who:'OVERWATCH',p:.3,tx:'They’ve gone red. They’re part of it now. Wraith… that pack just got bigger.'},
 {id:'M5_13_OW',t:129.8,w:3.9,who:'OVERWATCH',p:.5,tx:'The pack’s coming for you. And my picture’s breaking up.'},
 {id:'M5_14_OW',t:135.2,w:4.5,who:'OVERWATCH',p:.45,tx:'Don’t fire into the static. Wait for me to lock. Then fire.'},
 {id:'M5_15_OW_A',t:WIN[0]-.15,w:1.4,who:'OVERWATCH',p:.5,tx:'Now.'},
 {id:'M5_15_OW_B',t:WIN[1]-.15,w:1.2,who:'OVERWATCH',p:.5,tx:'Now.'},
 {id:'M5_15_OW_C',t:WIN[2]-.15,w:1.4,who:'OVERWATCH',p:.55,tx:'Now.'},
 {id:'GEN_04_OW',t:162.6,w:3.8,who:'OVERWATCH',p:.1,tx:'Board’s clear. Breathe.'},
 {id:'M5_16_REED',t:167.0,w:4.7,who:'REED',p:.2,tx:'Reed to Wraith. Copper bought us that minute. Don’t forget them.'},
 {id:'M5_17_PILOT',t:173.0,w:1.2,who:'WRAITH',p:0,tx:'I won’t.'},
 {id:'M5_18_OW',t:176.0,w:7.6,who:'OVERWATCH',p:.05,tx:'I’m logging Copper as lost. Eight names. I’ll remember them… even if nobody else does.'},
 {id:'M5_19_OW',t:185.6,w:4.1,who:'OVERWATCH',p:.1,tx:'They’re sending an Arc. Lightning, for the crowded ones.'}];
/* ---------------------------------------------------------------- people: Copper east of the channel, Reed and the civilians west */
const NAMES=['A. BRENNAN','T. REYES','I. VARGA','J. OKAFOR','M. HALLORAN','S. PETROV','N. ASHBY','K. MENSAH'];
const CP=[[44,-8],[47,-3],[43,2],[49,4],[46,8],[51,-6],[52,1],[48,11]];
const RP=[[-34,6],[-37,10],[-31,13],[-38,15],[-33,18],[-36,3]];
const CV=Array.from({length:8},(_,j)=>[-45-(j%2)*3.2-(j%3)*.8,3+j*2.1]);
const WR={x:-24,z:8};
function copperAt(i,t){const [x0,z0]=CP[i];const w=1-ss(15,46,t);const x=x0+60*w,z=z0+30*w;const tn=TURN[i];const u=ss(tn+.5,tn+9,t);
  return {x:lerp(x,60,u*.8)+Math.sin(t*3+i)*.15*(t<tn?1:0),z:lerp(z,-2,u*.8),mv:w>0&&w<1};}
function reedAt(i,t){const [x,z]=RP[i];const w=1-ss(18,64,t);return {x:x-62*w,z:z+Math.sin(i*1.7)*2*w,mv:w>0&&w<1};}
function civAt(j,t){const [x,z]=CV[j];const w=1-ss(18,66,t);return {x:x-58*w,z:z+Math.cos(j)*3*w,mv:w>0&&w<1};}
const mid=(f,n,t)=>{const c=V();for(let i=0;i<n;i++){const p=f(i,t);c.x+=p.x/n;c.z+=p.z/n;}return c;};
/* ---------------------------------------------------------------- the Wraith: up the west bank, west to Reed, back to the channel */
const E=Math.PI/2;
const KEYS=[[0,-18,124,0],[10,-18,124,0],[44,-21,52,0],[57,-21,52,-E],[70,-66,14,E],[98,-66,14,E],[104,-50,34,0],[110,-22,26,-E],[114,WR.x,WR.z,-E],[DUR,WR.x,WR.z,-E]];
const moving=i=>i>=0&&i<KEYS.length-1&&Math.hypot(KEYS[i+1][1]-KEYS[i][1],KEYS[i+1][2]-KEYS[i][2])>.01;
function keyAt(t){for(let i=0;i<KEYS.length-1;i++){const [a,ax,az]=KEYS[i],[b,bx,bz,bf]=KEYS[i+1];if(t<b||i===KEYS.length-2){let u=clamp((t-a)/(b-a),0,1);
  const s0=!moving(i-1),s1=!moving(i+1);if(s0&&s1)u=u*u*(3-2*u);else if(s0)u=2*u*u-u*u*u;else if(s1)u=1-(2*(1-u)*(1-u)-(1-u)*(1-u)*(1-u));
  return {x:lerp(ax,bx,u),z:lerp(az,bz,u),face:bf};}}}
const MT=(function(){const tb=[];let d=0,yaw=0,px=null,pz=null;for(let i=0;i<=DUR*20;i++){const t=i/20,p=keyAt(t);
  if(px!=null){const dx=p.x-px,dz=p.z-pz,s=Math.hypot(dx,dz);d+=s;const want=s*20>.6?Math.atan2(-dx,-dz):p.face;let a=want-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));yaw+=a*.12;tb.push({x:p.x,z:p.z,d,yaw,spd:s*20});}
  else{yaw=p.face;tb.push({x:p.x,z:p.z,d:0,yaw,spd:0});}px=p.x;pz=p.z;}return tb;})();
function mech(t){const i=clamp(t*20,0,DUR*20-1),j=Math.floor(i),f=i-j,a=MT[j],b=MT[j+1]||a;const x=lerp(a.x,b.x,f),z=lerp(a.z,b.z,f);
  return {x,z,y:SALT.h(x,z),yaw:a.yaw+(b.yaw-a.yaw)*f,dist:lerp(a.d,b.d,f),spd:lerp(a.spd,b.spd,f)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- the packs (moved by script; A's swarm draws and counts them) */
const EA=[-.5,.7,-1.35,1.55],AA=[-1.2,-.4,.4,1.2],EORD=[1,2,0,3];   /* east: where they come from, where they attack the Wraith, Lance order */
const ECX=t=>K([[0,48],[112,48],[118,58],[129,58],[141,WR.x]],t),ECZ=t=>K([[0,1],[112,1],[118,-1],[129,-1],[141,WR.z]],t);
function eastPos(i,t){const r=t<96?lerp(210,64,ss(25,88,t)):K([[96,64],[104+i*1.6,7],[129,9],[135,14],[141,24]],t)+6*Math.sin(t*1.3+i*2)*ss(141,143,t);
  const a=lerp(EA[i]+(i%2?1:-1)*.012*clamp(t-25,0,104),AA[i],ss(129,141,t))+.14*Math.sin(t*.31+i*1.9);
  return {x:ECX(t)+r*Math.cos(a),z:ECZ(t)+r*Math.sin(a)};}
const WZ=[10,-36,48,-14,30],WK=['stalker','runner','runner','runner','runner'];
function westPos(j,t){const u=ss(26.2,j?84+j*2:94,t);return {x:lerp(-250,j?-82:-90,u)+Math.sin(t*.8+j)*3,z:lerp(WZ[j],10+WZ[j]*.35,u)+Math.sin(t*.9+j*2)*5};}
/* ---------------------------------------------------------------- the sim */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=5353;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:3000,maxDebris:1200});sw.points.layers.set(1);sw.ground=(x,z)=>SALT.h(x,z);
  Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.E=null;SIM.W=null;SIM.ab=0;SIM.cool=0;SIM.burst=0;SIM.tgt=null;SIM.ev=[];FFX.reset();}
const cross=x=>SIM.t<x&&SIM.t+DT>=x;
function nearest(list,x,z,max){let b=null,bd=max||1e9;for(const c of list||[]){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-x,c.pos.z-z);if(d<bd){bd=d;b=c;}}return b;}
function place(c,p,q){c.pos.set(p.x,SALT.h(p.x,p.z),p.z);c.heading=Math.atan2(q.x-p.x,q.z-p.z)||c.heading;c.target=null;}
function finish(c){const at=SIM.sw.center(c);SIM.sw.hit(c,at,40,c.count+5);SIM.ev.push({t:SIM.t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
const TG=[];
function simStep(){const t=SIM.t,sw=SIM.sw;const sv=Math.random;Math.random=srnd;const m=mech(t),w=lockAt(t);
  if(cross(25))SIM.E=EA.map((a,i)=>{const p=eastPos(i,t);const c=sw.spawn('stalker',V(p.x,SALT.h(p.x,p.z),p.z),-E);c.prefers='ally';return c;});
  if(cross(26.2))SIM.W=WK.map((k,j)=>{const p=westPos(j,t);const c=sw.spawn(k,V(p.x,0,p.z),E);c.prefers='ally';return c;});
  TG.length=0;TG.push({pos:V(m.x,m.y,m.z),kind:'mech',notice:120});
  sw.update(DT,t,TG);
  if(SIM.E)SIM.E.forEach((c,i)=>{if(!c.dead)place(c,eastPos(i,t),eastPos(i,t+.5));});
  if(SIM.W)SIM.W.forEach((c,j)=>{if(!c.dead)place(c,westPos(j,t),westPos(j,t+.5));});
  /* each of Copper's eight that turns adds 25 dots to the nearest stalker */
  for(let i=0;i<8;i++)if(SIM.E&&t>=TURN[i]+6&&SIM.ab<=i){const p=copperAt(i,t);const b=nearest(SIM.E,p.x,p.z);if(b)sw.absorb(b,V(p.x,0,p.z),25);SIM.ab=i+1;}
  /* Copper's rifles across the water, until each one turns; Reed's on the west side */
  if(SIM.E&&t>58&&srnd()<DT/.45){const i=Math.floor(srnd()*8);if(t<TURN[i]-.3){const p=copperAt(i,t);const c=nearest(SIM.E,p.x,p.z,150);
    if(c){const mz=V(p.x,1.4,p.z),at=sw.center(c).add(V((srnd()-.5)*8,(srnd()-.5)*3,(srnd()-.5)*8));FFX.shot(t,mz,at,.35);FFX.flash(t,mz,.25);if(srnd()<.3)sw.hit(c,at,2,1);}}}
  if(SIM.W&&t>68&&t<95.5&&srnd()<DT/.38){const p=reedAt(Math.floor(srnd()*6),t);const c=nearest(SIM.W,p.x,p.z,170);
    if(c){const mz=V(p.x,1.4,p.z),at=sw.center(c).add(V((srnd()-.5)*6,(srnd()-.5)*3,(srnd()-.5)*6));FFX.shot(t,mz,at,.35);FFX.flash(t,mz,.25);if(srnd()<.3)sw.hit(c,at,2,1);}}
  /* the Wraith's autocannon: the west pack, then only inside the last lock */
  if(SIM.burst>0){SIM.burst-=DT;const n0=Math.ceil((SIM.burst+DT)/.085),n1=Math.ceil(SIM.burst/.085);
    for(let r=n1;r<n0;r++){const c=SIM.tgt;const mz=muzzle(m,(r%2)?1:-1);let at;
      if(c&&!c.dead){at=sw.center(c).add(V((srnd()-.5)*5,(srnd()-.5)*3,(srnd()-.5)*5));
        if(srnd()<.7){const before=c.count;const n=c.rig.id==='runner'?4:w>=0?8:5;const got=sw.hit(c,at,2.2,n);
          if(got>0)SIM.ev.push({t,k:'hit',x:at.x,z:at.z});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}
      else at=mz.clone().add(V(-Math.sin(m.yaw)*80,-8,-Math.cos(m.yaw)*80));
      FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,SALT.h(at.x,at.z),at.z),1.2,6);}}
  else{SIM.cool-=DT;if(SIM.cool<=0){let c=null;
    if(t>66&&t<95.5)c=nearest(SIM.W,m.x,m.z,190);
    else if(w===2&&t>WIN[2]+.9&&SIM.E)c=!SIM.E[EORD[3]].dead?SIM.E[EORD[3]]:nearest(SIM.E,m.x,m.z,90);
    if(c){SIM.tgt=c;SIM.burst=8*.085;SIM.ev.push({t,k:'burst',x:m.x,z:m.z});SIM.cool=w>=0?.15:1.0+srnd()*.6;}else SIM.cool=.2;}}
  /* the Lance, once per lock */
  for(let q=0;q<3;q++)if(SIM.E&&cross(WIN[q]+.7)){let c=SIM.E[EORD[q]];if(c.dead)c=nearest(SIM.E,m.x,m.z,200);
    if(c){const mz=muzzle(m,1),at=sw.center(c);FFX.shot(t,mz,at,3.6);FFX.flash(t,mz,3.2);sw.hit(c,at,60,c.count+10);SIM.ev.push({t,k:'lance',x:at.x,z:at.z});
      if(c.dead)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:'lance'});}}
  if(SIM.W&&cross(95.5))SIM.W.forEach(c=>{if(!c.dead)finish(c);});
  if(SIM.E&&cross(WIN[2]+WL-.1))SIM.E.forEach(c=>{if(!c.dead)finish(c);});
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>20000)break;}}
/* ---------------------------------------------------------------- Copper's dots: green until each one turns red */
const CU={uT:{value:0},uScale:{value:1},uTurn:{value:new Array(8).fill(0)},uPos:{value:Array.from({length:8},()=>new T.Vector3())}};
function copperDots(){const per=16,n=8*per,p=new Float32Array(n*3),s=new Float32Array(n*4);for(let i=0;i<n;i++){p.set([0,0,0],i*3);s.set([Math.floor(i/per),Math.random(),Math.random(),Math.random()],i*4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aS',new T.BufferAttribute(s,4));
  const m=new T.ShaderMaterial({uniforms:CU,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute vec4 aS;uniform float uT,uScale;uniform float uTurn[8];uniform vec3 uPos[8];varying vec3 vC;varying float vA;
    void main(){int k=int(aS.x);vec3 c=uPos[0];float tu=uTurn[0];for(int i=1;i<8;i++)if(i==k){c=uPos[i];tu=uTurn[i];}
      vec3 o=vec3(sin(aS.y*40.+uT*1.3),fract(aS.z*7.)*1.9+.1,cos(aS.w*40.+uT*1.1))*vec3(.45,1.,.45);vec3 p=c+o*(1.+tu*.6);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float px=.9*uScale/max(.001,-mv.z);float cl=clamp(px,3.,16.);
      vA=.7*min(1.,px*px/(cl*cl)+.5);gl_PointSize=cl;vC=mix(vec3(0.,0.,1.),vec3(1.,0.,0.),tu);}`,
    fragmentShader:`varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vC*vA*exp(-r*r*3.),1.);}`});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.layers.set(1);return pts;}
/* ---------------------------------------------------------------- people in the real world, with torches */
let FOLK=[],REED=[],CIV=[],TORCH=[],allyR=[],allyC=[],allyW=null,PBODY=null,CBODY=null;
function people(scene){PBODY=new T.MeshStandardMaterial({color:0x2a2e34,roughness:.9,emissive:0x3a2a20,emissiveIntensity:.6});
  CBODY=new T.MeshStandardMaterial({color:0x5a5248,roughness:.9,emissive:0x3a2a20,emissiveIntensity:.6});
  const mk=mat=>{const g=new T.Group();const b=new T.Mesh(new T.CapsuleGeometry(.28,.95,4,8),mat);b.position.y=.78;g.add(b);const h=new T.Mesh(new T.SphereGeometry(.17,8,6),mat);h.position.y=1.6;g.add(h);
    scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});return g;};
  FOLK=CP.map(()=>mk(PBODY));REED=RP.map(()=>mk(PBODY));CIV=CV.map(()=>mk(CBODY));
  for(let i=0;i<4;i++){const L=new T.SpotLight(0xdde6ff,28,70,.35,.6,1.4);scene.add(L);scene.add(L.target);TORCH.push(L);}}
/* ---------------------------------------------------------------- shots (dots: the overlay on or off; v: how loud the fight is from here) */
const m5c=(t)=>t-OFF;
const SHOTS=[
 {t0:0,t1:10.4,name:'OVERWATCH · DRONE',dots:0,v:.4,f:u=>({p:vl(V(-170,80,200),V(-110,52,140),ease(u)),l:vl(V(100,0,-20),V(70,0,0),u),fov:50,real:1})},
 {t0:10.4,t1:12.4,name:'WRAITH · OPTICAL',dots:0,v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+1.6,m.y+9.6,m.z-1.5),l:V(100,2,30),fov:40,real:1};}},
 {t0:12.4,t1:15.4,name:'WRAITH · THERMAL',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+1.6,m.y+9.6,m.z-1.5),l:V(100,2,30),fov:lerp(32,28,u),mode:1,real:.85};}},
 {t0:15.4,t1:21.2,name:'COPPER · OPTICAL',dots:0,v:.4,f:(u,t)=>{const c=mid(copperAt,8,t);return {p:vl(V(92,1.9,14),V(89,1.9,13),u),l:c.add(V(0,1.2,0)),fov:46,real:1};}},
 {t0:21.2,t1:26,name:'REED · OPTICAL',dots:0,v:.6,f:(u,t)=>{const c=mid(reedAt,6,t);return {p:vl(V(-82,2.2,-6),V(-83,2.2,-3),u),l:c.add(V(-2,1.2,4)),fov:48,real:1};}},
 {t0:26,t1:31,name:'OVERWATCH · TACTICAL',v:.4,f:u=>({p:vl(V(0,230,70),V(0,210,60),ease(u)),l:V(0,0,8),fov:64,real:.22,mono:.7})},
 {t0:31,t1:36.6,name:'COPPER 1 · SENSOR',v:.4,f:(u,t)=>{const c=mid(copperAt,8,t);const e=SIM.E?SIM.E[0].pos:V(230,0,-30);return {p:c.clone().add(V(-6,2.4,6)),l:V(e.x,2,e.z),fov:50,real:.4,mono:.55};}},
 {t0:36.6,t1:42.4,name:'REED · OPTICAL',dots:0,v:.6,f:u=>({p:vl(V(-60,2.3,26),V(-62,2.3,24),u),l:V(-120,3,2),fov:48,real:1})},
 {t0:42.4,t1:50.4,name:'WRAITH · SENSOR',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+1.5,m.y+9.8,m.z-.5),l:V(47,1,6),fov:lerp(36,32,u),real:.4,mono:.55};}},
 {t0:50.4,t1:57.4,name:'WRAITH · THERMAL',v:1,f:u=>({p:vl(V(-20,9.6,51),V(-19.5,9.5,50),u),l:V(48,1,0),fov:lerp(26,22,u),mode:1,real:.85})},
 {t0:57.4,t1:66,name:'REED · OPTICAL',dots:0,v:.7,f:(u,t)=>{const m=mech(t);return {p:V(-44,1.8,22),l:V(m.x,m.y+6,m.z),fov:50,real:1};}},
 {t0:66,t1:72.2,name:'WRAITH · SENSOR',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+10,m.y+12,m.z+6),l:V(m.x-110,2,m.z-4),fov:42,real:.4,mono:.55};}},
 {t0:72.2,t1:80,name:'OVERWATCH · TACTICAL',v:.5,f:u=>({p:vl(V(-20,170,46),V(-14,160,40),u),l:V(-12,0,8),fov:62,real:.22,mono:.7})},
 {t0:80,t1:88,name:'WRAITH · THERMAL',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+7,3.4,m.z+11),l:V(m.x-40,6,m.z-6),fov:46,mode:1,real:.85};}},
 {t0:88,t1:95,name:'REED 2 · THERMAL',v:.6,f:u=>({p:vl(V(-30,2.4,10),V(-30,2.4,9),u),l:V(48,1,0),fov:lerp(24,21,u),mode:1,real:.85})},
 {t0:95,t1:100,name:'OVERWATCH · TACTICAL',v:.4,f:u=>({p:vl(V(10,120,40),V(36,90,24),ease(u)),l:vl(V(-10,0,8),V(44,0,2),ease(u)),fov:54,real:.22,mono:.7})},
 /* the Copper stretch (scene-m5c.js) */
 {t0:100,t1:107,name:'COPPER 3 · HELMET',dots:0,v:.4,f:(u,t)=>{const p=copperAt(2,t),s=m5c(t);const a=Math.sin(s*1.7)*.9+Math.sin(s*4.3)*.25;
   return {p:V(p.x,1.65,p.z),l:V(p.x+Math.cos(a)*10,1.65-2.2+Math.sin(s*3.1)*.4,p.z+Math.sin(a)*10),fov:62,shake:.18+ss(12+OFF,15+OFF,t)*.3,real:1};}},
 {t0:107,t1:121,name:'OVERWATCH · TACTICAL',v:.4,f:u=>({p:vl(V(10,105,30),V(36,72,18),ease(u)),l:vl(V(10,0,2),V(44,0,0),ease(u)),fov:52,real:.22,mono:.7})},
 {t0:121,t1:129,name:'WRAITH · SENSOR',v:.8,f:u=>({p:vl(V(-20,12,14),V(-18,13,12),u),l:vl(V(58,2,-2),V(40,2,0),u),fov:lerp(30,34,u),real:.4,mono:.7})},
 /* the pack */
 {t0:129,t1:135,name:'WRAITH · SENSOR',v:1,f:(u,t)=>({p:vl(V(-36,16,32),V(-34,15,30),u),l:V(ECX(t),0,ECZ(t)),fov:52,real:.4,mono:.6})},
 {t0:135,t1:141.4,name:'WRAITH · SENSOR',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+1.2,m.y+9.8,m.z-.6),l:V(ECX(t)+10,2,ECZ(t)),fov:42,real:.4,mono:.6,shake:.04};}},
 {t0:141.4,t1:147.4,name:'WRAITH · SENSOR',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x-7,m.y+11.5,m.z+7),l:V(m.x+30,3,m.z),fov:50,real:.4,mono:.6,shake:.05};}},
 {t0:147.4,t1:153.4,name:'REED · OPTICAL',dots:0,v:.8,f:u=>({p:vl(V(-46,1.8,22),V(-45,1.8,21),u),l:V(-16,7,6),fov:46,real:1,shake:.03})},
 {t0:153.4,t1:161,name:'WRAITH · SENSOR',v:1,f:(u,t)=>{const m=mech(t);return {p:V(m.x+1.2,m.y+9.8,m.z-.6),l:V(m.x+30,2,m.z),fov:48,real:.4,mono:.6,shake:.05};}},
 /* after */
 {t0:161,t1:166.6,name:'WRAITH · THERMAL',v:.6,f:u=>({p:vl(V(-23,9.6,8),V(-22.5,9.5,7.5),u),l:V(50,1,0),fov:lerp(26,22,u),mode:1,real:.85})},
 {t0:166.6,t1:175.6,name:'REED · OPTICAL',dots:0,v:.5,f:u=>({p:vl(V(-44,2.6,26),V(-42,2.4,23),u),l:V(-20,7,6),fov:44,real:1})},
 {t0:175.6,t1:DUR,name:'OVERWATCH · LOG',dots:0,v:.3,f:u=>({p:vl(V(-10,26,60),V(-30,90,120),ease(u)),l:vl(V(30,0,0),V(40,0,-20),u),fov:46,real:1})}];
const LOG0=177.6;
function logAt(t){if(t<LOG0)return '';let s='';const L=[[LOG0,'CASUALTY LOG · MISSION 5 · THE SALTPANS'],[LOG0+1.4,'SQUAD COPPER · 8 · LOST']];NAMES.forEach((n,i)=>L.push([LOG0+2.6+i*.62,'   '+n]));
  for(const [tt,line] of L){if(t<tt)break;s+=line.slice(0,Math.floor((t-tt)*40))+'\n';}return s;}
let NOW=0;
function tracks(t){simTo(t);NOW=t;const o={};const sh=SHOTS[FILM.shotIndex(t)];const w=lockAt(t);const fight=t>139&&t<WIN[2]+WL;
  o.real=.9;o.mono=0;o.mode=0;o.dots=sh.dots==null?1:sh.dots;
  o.interf=K([[0,.1],[24,.1],[26.3,.28],[27.6,.14],[50,.12],[66,.2],[95.5,.16],[100,.15],[104,.35],[106.2,.6],[106.5,1],[107,1],[107.3,.15],[TW[2],.22],[TW[2]+.3,.45],[TW[2]+1.4,.2],
    [129,.22],[134,.45],[140,.62],[159,.62],[160,.15],[176,.06],[DUR,.05]],t);
  if(fight&&w<0)o.interf+=.12*Math.max(0,Math.sin(t*7.3));
  if(w>=0){o.clear=.85;o.interf=Math.min(o.interf,.22);}
  o.stut=t>106.2&&t<107.2?1:t>TW[2]&&t<TW[2]+1?.4:fight&&w<0?.6:0;o.wexp=1.2;o.exp=.85;
  o.fade=ss(DUR-2.2,DUR,t)+(1-ss(0,1.6,t));if(t>106.5&&t<107.05)o.fade=.6;
  let fl=0;for(const q of WIN)if(t>q+.7&&t<q+1.2)fl=.3*(1-ss(q+.7,q+1.2,t));o.flash=fl;
  o.count=SIM.sw?SIM.sw.dots:0;
  const m=mech(t);let nd=1e9;if(SIM.sw)for(const c of SIM.sw.list)if(!c.dead&&!c.gone)nd=Math.min(nd,Math.hypot(c.pos.x-m.x,c.pos.z-m.z));
  o.range=t<26||nd>9e8?null:(Math.max(.1,nd/1000)).toFixed(1)+' KM';
  o.conf=t>106.2&&t<107.3?.04:fight&&w<0?.12:null;o.lock=w>=0;
  o.log=logAt(t);o.nohud=t<8.8||t>LOG0-.4;
  o.title=t<9?{k:ss(.8,1.8,t)*(1-ss(7,8.6,t)),org:'Mission 5 · 23:30',t:'NIGHT SHIFT',sub:'The Saltpans · International Rift Mech Defense'}:
    t>190?{k:ss(190.2,191.2,t)*(1-ss(194,195.4,t)),org:'Mission 5 · Night Shift',t:'COPPER',sub:'Eight names'}:null;
  return o;}
function lookOf(t,m){let p=null;const c=SIM.tgt;
  if(c&&!c.dead&&SIM.burst>0)p=c.pos;
  else if(t>66&&t<96&&SIM.W){const q=nearest(SIM.W,m.x,m.z,220);if(q)p=q.pos;}
  else if(t>121&&t<160&&SIM.E){const w=lockAt(t);const q=w>=0&&!SIM.E[EORD[w]].dead?SIM.E[EORD[w]]:nearest(SIM.E,m.x,m.z,200);if(q)p=q.pos;}
  let yaw=0;if(p){const a=Math.atan2(-(p.x-m.x),-(p.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
  const f=(t>64&&t<97)||(t>128&&t<160);return {pitch:f?.14:-.04,yaw:yaw*.5,torso:yaw*.8,aim:f?-.3:-.15};}
function apply(t,o,cam,px){const sw=SIM.sw;const th=o.mode>.5;const m=mech(t);
  CP.forEach((c,i)=>{const p=copperAt(i,t);const G=FOLK[i];G.position.set(p.x,p.mv?Math.abs(Math.sin(t*7+i))*.06:0,p.z);G.visible=t<TURN[i]+1.5;
    G.rotation.y=Math.atan2(80-p.x,0-p.z)+Math.sin(t*2+i)*.5;CU.uPos.value[i].set(p.x,t<TURN[i]+6?.2:-500,p.z);CU.uTurn.value[i]=ss(TURN[i],TURN[i]+.35,t);});
  CU.uT.value=t;CU.uScale.value=px;
  RP.forEach((r,i)=>{const p=reedAt(i,t);REED[i].position.set(p.x,p.mv?Math.abs(Math.sin(t*7+i*2))*.06:0,p.z);REED[i].rotation.y=Math.PI*.45+Math.sin(t+i)*.3;allyR[i].position.set(p.x,-2.9,p.z);});
  CV.forEach((r,j)=>{const p=civAt(j,t);CIV[j].position.set(p.x,p.mv?Math.abs(Math.sin(t*6.5+j*3))*.06:0,p.z);CIV[j].rotation.y=Math.sin(t*.7+j)*.8;allyC[j].position.set(p.x,-2.9,p.z);});
  /* torches: two of Copper's (west while they walk, then out over the east pans, then gone), two of Reed's */
  TORCH.forEach((L,i)=>{if(i<2){const k=i?5:2;const p=copperAt(k,t);const a=Math.sin(t*1.7+i*2)*.9;const turn=ss(30,34,t);L.position.set(p.x,1.5,p.z);
      L.target.position.set(p.x+lerp(-14,Math.cos(a)*14,turn),0,p.z+lerp(Math.sin(t*.9+i)*4,Math.sin(a)*14,turn));L.intensity=t<TURN[k]+.8?(13*(.85+.15*Math.sin(t*40))):0;}
    else{const p=reedAt(i===2?1:4,t);const dx=lerp(12,-12,ss(37,40,t));L.position.set(p.x,1.5,p.z);L.target.position.set(p.x+dx,0,p.z-6+Math.sin(t*.7+i)*4);L.intensity=22;}});
  if(TEAM.ready){TEAM.list.forEach((M,k)=>M.root.visible=k===1);const L=lookOf(t,m);TEAM.pose(t,[L,L,L,L],[m,m,m,m]);}
  allyW.position.set(m.x,m.y-5.5,m.z);
  const ch=[];if(sw)for(const c of sw.list)if(!c.dead&&!c.gone&&ch.length<12)ch.push({x:c.pos.x,z:c.pos.z,r:c.rig.id==='runner'?3.5:6,k:.9});
  for(let i=0;i<8;i++)if(t>TURN[i]-4&&t<TURN[i]+3&&ch.length<16){const p=copperAt(i,t);ch.push({x:p.x,z:p.z,r:3.5,k:.8});}
  SALT.update(t,{churn:ch.slice(0,16),lamps:th?.12:1});PBODY.emissiveIntensity=CBODY.emissiveIntensity=th?5:.6;
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(th);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.4;}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;FFX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params,ctx=S.ctx;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  const vK=t=>{const s=SHOTS[FILM.shotIndex(t)];return s.v==null?1:s.v;};
  F.RAMP(P.wind,[[0,0],[1.5,.12],[DUR-2,.14],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[1.5,.06],[DUR,0]],A);F.RAMP(P.buzz,[[0,0],[1,.012],[DUR,.01]],A);
  /* crickets on the pans: they stop when the contacts come, and come back at the end */
  const cr=(t0,t1,k)=>{for(let t=t0;t<t1;t+=.4+Math.random()*.6){const o=ctx.createOscillator();o.type='sine';o.frequency.value=4300+Math.random()*500;const g=ctx.createGain();o.connect(g);g.connect(S.sfx);
    for(let j=0;j<3;j++){g.gain.setValueAtTime(0,A(t+j*.055));g.gain.linearRampToValueAtTime(.012*k,A(t+j*.055+.01));g.gain.linearRampToValueAtTime(0,A(t+j*.055+.035));}o.start(A(t));o.stop(A(t+.25));}};
  cr(0,26,1);cr(163,DUR,.6);
  /* the Wraith's feet */
  for(const [a,b] of [[10.4,44],[57.4,70],[98.4,114]])for(let t=a;t<b;t+=.62)S.step(A(t),0,.5*vK(t));
  S.switchV(A(12.4),1);S.switchV(A(161),.6);
  S.sting(A(26.3),.5);S.glitch(A(26.3),.6,.35);
  /* Copper's rifles across the water: small and far, then nothing; up close on the helmet */
  for(let t=58;t<TW[2];t+=.5+Math.random()*1.4){S.thud(A(t),.5,.12+.08*(vK(t)<.5?1:0));if(Math.random()<.6)S.ac(A(t),.5,.06,2+Math.floor(Math.random()*3));}
  for(let t=9.4+OFF;t<15.4+OFF;t+=.25+Math.random()*.4)S.thud(A(t),(Math.random()-.5),.5);
  /* Reed's rifles on the west side */
  for(let t=68;t<95.5;t+=.3+Math.random()*.5)S.ac(A(t),-.2,.05*vK(t),1+Math.floor(Math.random()*2));
  /* the Wraith's guns and what they hit */
  let lastHit=-9;for(const e of EV){const m=mech(e.t);const pn=clamp((e.x-m.x)/60,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),0,.5*vK(e.t),8);
    else if(e.k==='hit'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,.4*vK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,e.id==='lance'?1.1:e.id==='stalker'?.8:.55);}
  WIN.forEach(q=>{S.lock(A(q));S.lance(A(q+.7-1.2),.1,1.3,1.2);S.hit(A(q+.75),1.0);});
  /* Copper's helmet drops; their dots turn */
  S.glitch(A(13.2+OFF),2,.6);S.burst(A(15.2+OFF),1,1);
  S.fizz(A(TW[0]),.3,.3);S.fizz(A(TW[1]),.3,.35);S.burstC(A(TW[2]),.3,.5);
  /* the pack crosses; the picture breaks up */
  S.moan(A(129.6),9);S.wash(A(131),6);
  F.RAMP(P.hum,[[0,0],[96,0],[100,.06],[103,.12],[107,.12],[TW[2],.16],[TW[2]+.15,0],[129,0],[136,.12],[141,.18],[WIN[2]+WL,.2],[WIN[2]+WL+.1,0]],A);
  /* music. the night: pad and piano */
  S.chord(A(.5),10,['D2','A2','F3'],.45,'pad');[[1.2,'D4'],[3.4,'F4'],[5.6,'E4'],[7.8,'A3']].forEach(([t,n])=>S.chord(A(t),2.4,[n],.6,'pno'));
  S.chord(A(10.4),8,['Bb1','F2','D3'],.4,'pad');S.chord(A(18.4),8,['G1','D2','Bb2'],.4,'pad');
  [[11,'D4'],[13.4,'C4'],[16,'A3'],[19.4,'F4'],[22.2,'E4']].forEach(([t,n])=>S.chord(A(t),2.4,[n],.55,'pno'));
  /* contacts: a slow pulse under the radio */
  S.chord(A(26.3),5,['D2','Ab2','D3'],.55,'brass');
  const pr=[['D3','F3','A3'],['C3','E3','G3'],['Bb2','D3','F3'],['A2','C#3','E3']];
  const b0=60/84*4;S.pulse(A(28),22,'D2',84,.55,{});for(let i=0;i<8;i++){const t=28+i*b0;if(t>=50)break;S.chord(A(t),b0,pr[i%4],.4,i%2?'pad':'str');}
  F.RAMP(P.str,[[0,0],[26,0],[30,.05],[49,.09],[51,0]],A);
  /* "We'll hold. Go." */
  S.chord(A(50.6),7,['D2','A2','F3'],.45,'pad');[[51.2,'D4'],[53.4,'F4'],[55.6,'E4'],[57.4,'A3']].forEach(([t,n])=>S.chord(A(t),2.4,[n],.6,'pno'));
  /* the west fight */
  const b1=60/100*4;S.pulse(A(60),36,'D2',100,.75,{snare:true});
  for(let i=0;i<15;i++){const t=60+i*b1;if(t>=95.5)break;S.chord(A(t),b1,pr[i%4],.5+i*.01,i%2?'str':'brass');S.taiko(A(t),.75,i%2?.3:-.3);}
  /* Copper (scene-m5c.js) */
  S.chord(A(16.4+OFF),8.4,['D2','A2','D3'],.5,'choir');S.hit(A(TW[2]),.9);S.note(A(TW[2]+.4),6);
  S.chord(A(30.3+OFF),8,['Bb1','F2','D3'],.5,'str');
  /* the pack: fire only on the lock */
  S.chord(A(129.4),12,['D2','A2','D3','F3'],.55,'choir');F.RAMP(P.str,[[128,0],[130,.04],[141,.1],[141.2,0]],A);S.riser(A(137.6),3.6);
  const b2=60/112*4;S.pulse(A(141.2),18,'D2',112,.85,{snare:true,oct:true});
  for(let i=0;i<9;i++){const t=141.2+i*b2;if(t>=159)break;S.chord(A(t),b2,pr[(i+2)%4],.55,i%2?'str':'pad');S.taiko(A(t),.85,i%2?.3:-.3);}
  WIN.forEach(q=>S.chord(A(q+.75),2.6,['D3','A3','D4'],.75,'brass'));
  S.chord(A(159.4),7,['D2','A2','D3'],.5,'choir');
  /* after: Reed, the log, the Arc */
  [[167.2,['D3','F3','A3']],[170.2,['Bb2','D3','F3']],[173.2,['F2','A2','C3','F3']]].forEach(([t,c])=>S.chord(A(t),3.2,c,.55,'str'));
  [[173.6,'A4'],[174.8,'F4']].forEach(([t,n])=>S.chord(A(t),2.6,[n],.75,'pno'));
  const end=[['D3','A3','F4'],['Bb2','F3','D4'],['G2','D3','Bb3'],['A2','E3','C#4'],['D3','A3','D4','F4']];end.forEach((c,i)=>S.chord(A(176+i*2.8),3.4,c,.55,i%2?'pad':'str'));
  [[176.6,'A4'],[178,'G4'],[179.4,'F4'],[182.2,'E4'],[183.6,'D4']].forEach(([t,n])=>S.chord(A(t),2.6,[n],.7,'pno'));
  for(let i=0;i<8;i++)S.beep(A(LOG0+2.6+i*.62),1500,.35);S.chord(A(184.8),5,['D3','F3','A3','D4'],.45,'choir');
  S.chord(A(186),4,['F2','C3','F3','A3'],.45,'str');S.chord(A(190.2),5.8,['D2','A2','D3','F3','A3'],.5,'choir');[[190.6,'D5'],[192.2,'A4']].forEach(([t,n])=>S.chord(A(t),3,[n],.6,'pno'));}
/* ---------------------------------------------------------------- build */
function build(scene,F){SALT.build(scene);FFX.init(scene);for(const o of SALT.occ)o.layers.enable(2);people(scene);
  scene.add(copperDots());
  const one=()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.scale.set(.35,.35,.35);a.layers.set(1);scene.add(a);return a;};
  allyR=RP.map(one);allyC=CV.map(one);
  allyW=SIG.makeAllies([V(0,5.5,0)]);allyW.layers.set(1);scene.add(allyW);simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const cc=()=>mid(copperAt,8,NOW).add(V(0,5,0)),rc=()=>mid(reedAt,6,NOW).add(V(0,5,0));
const pack=list=>()=>{const c=V(0,-999,0);let n=0;for(const q of list()||[])if(!q.dead){if(!n)c.set(0,0,0);c.add(q.pos);n++;}if(n)c.multiplyScalar(1/n).add(V(0,8,0));return c;};
const lockC=()=>{const w=lockAt(NOW);const c=SIM.E&&w>=0?SIM.E[EORD[w]]:null;return c&&!c.dead?SIM.sw.center(c).add(V(0,4,0)):V(0,-999,0);};
const in_=(...r)=>t=>{for(let i=0;i<r.length;i+=2)if(t>=r[i]&&t<r[i+1])return true;return false;};
const TAGS=[['COPPER · 8','green',cc,in_(15.4,21.2,42.4,50.4,72.2,80,88,95)],['REED · 6','green',rc,in_(21.2,26,72.2,80)],
  ['CONTACTS · EAST','red mark',pack(()=>SIM.E&&[SIM.E[0]]),in_(26.3,31)],['CONTACTS · WEST','red mark',pack(()=>SIM.W),in_(26.3,31)],
  ['CHANNEL · 60 M','',()=>V(2,0,30),in_(42.4,50.4)],['STALKER · 100','red mark',pack(()=>SIM.W&&[SIM.W[0]]),in_(66,72.2)],
  ['COPPER · 8','green',()=>V(47,4,0),in_(107,TW[0])],['COPPER · LOST','red mark',()=>V(52,4,0),in_(TW[2]+.6,121)],['REED · 6','green',()=>V(-35,5,10),in_(107,121)],
  ['THE PACK','red mark',pack(()=>SIM.E),in_(121.4,135)],['LOCK','green mark',lockC,(t,o)=>o&&o.lock]];
FILM.run({id:'m5',DUR,place:'The Saltpans',pageTitle:'IRMD · Mission 5 · Night Shift',clock:[23,30,0],poster:110,
  start:{org:'International Rift Mech Defense · Mission 5',t:'Night Shift',sub:'The Saltpans · 23:30 · 3 min<br>Sound on, headphones if you have them'},
  end:{org:'Squad Copper',t:'Eight names',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M5SIM=SIM;window.M5SIMTO=simTo;
})();
