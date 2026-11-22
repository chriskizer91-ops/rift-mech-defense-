'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 2, HIGH WATER (game/cinematic/film/scene-m2.js, session D)
   3 min in Port Arlen's low town, a wet grey morning: the night's flood is at the second floor.
     0:00  Lantern on the cannery roof with a red flare: six of them, something in the water.
     0:28  the team wades down the flooded high street; the canal is too deep: jets. Fifties in the streets.
     1:06  "That's an actual MECH." "Climb down. I've got you." The six climb down into the cannery's skiff while the team
           holds; Lantern counts them down.
     1:44  "High street. Stay behind the big thing." The escort back; runners go for the slowest green dot: the skiff.
     2:26  six green on the high street. "Point us at something. We'll paint it." The Lance is coming.
   The same cannery BEHEMOTH comes through in mission 4 (set-portarlen.js with the flood, the canal and rain).
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
PORT.opts={canal:true,rain:true};
const DUR=182,DT=1/60,LV=4.6,CN=PORT.CANNERY;
const LADDER={x:140,z:24.6,top:13.1},SKIFF0=V(140,LV,29.5);
/* ---------------------------------------------------------------- the team */
const KEYS=[
 [[0,-26,160,0],[26,-26,72,0],[38,-26,57,0],[46,-24,32,0],[64,100,38,-1.3],[106,100,38,-1.3],[124,-2,30,1.4],[132,-24,54,0],[142,-26,76,3.1],[DUR,-26,76,3.1]],
 [[0,-14,170,0],[26,-14,80,0],[40,-14,57,0],[48,-12,31,0],[66,128,38,-.2],[106,128,38,-.2],[126,6,28,1.4],[134,-14,52,0],[144,-14,80,3.1],[DUR,-14,80,3.1]],
 [[0,-26,182,0],[26,-26,90,0],[42,-26,58,0],[50,-24,32,0],[66,110,50,-.5],[106,110,50,-.5],[128,-6,34,1.4],[136,-26,56,0],[146,-26,92,3.1],[DUR,-26,92,3.1]],
 [[0,-14,192,0],[26,-14,96,0],[44,-14,58,0],[52,-12,30,0],[68,152,42,-.8],[106,152,42,-.8],[130,12,24,1.4],[138,-14,52,0],[148,-14,94,3.1],[DUR,-14,94,3.1]]];
function keyAt(k,t){const ks=KEYS[k];for(let i=0;i<ks.length-1;i++){const [a,ax,az,af]=ks[i],[b,bx,bz,bf]=ks[i+1];if(t<b||i===ks.length-2){const u=ss(a,b,t);return {x:lerp(ax,bx,u),z:lerp(az,bz,u),face:bf};}}}
const hov=(x,z)=>ss(3.6,5.6,LV-PORT.h(x,z));
const MT=[];
function buildMT(){for(let k=0;k<4;k++){const tb=[];let d=0,yaw=0,px=null,pz=null;for(let i=0;i<=DUR*20;i++){const t=i/20,p=keyAt(k,t);
    if(px!=null){const dx=p.x-px,dz=p.z-pz,s=Math.hypot(dx,dz);const h=hov(p.x,p.z);d+=s*(1-h);const want=s*20>.6?Math.atan2(-dx,-dz):p.face;let a=want-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));yaw+=a*.12;tb.push({x:p.x,z:p.z,d,yaw,spd:s*20*(1-h),h});}
    else tb.push({x:p.x,z:p.z,d:0,yaw:p.face,spd:0,h:0});px=p.x;pz=p.z;}MT.push(tb);}}
function mech(k,t){const i=clamp(t*20,0,DUR*20-1),j=Math.floor(i),f=i-j,a=MT[k][j],b=MT[k][j+1]||a;const x=lerp(a.x,b.x,f),z=lerp(a.z,b.z,f),h=lerp(a.h,b.h,f);
  const gy=PORT.h(x,z);return {x,z,y:lerp(gy,LV+2.4+Math.sin(t*3+k)*.2,h),gy,hov:h,yaw:a.yaw+(b.yaw-a.yaw)*f,dist:lerp(a.d,b.d,f),spd:lerp(a.spd,b.spd,f)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- Lantern's six: the roof, the ladder, the skiff, the street */
const P10=.55,R10=1+.13*P10,T10=98.0;
const ARR=[.2,.51/R10+.4,1.15,1.48/R10+.35,1.95,2.44/R10].map(x=>T10+x);   /* "Two down." "Four." "Everyone's down!" */
const SEAT=[[-.9,-1.6],[.9,-1.6],[-.9,0],[.9,0],[-.9,1.6],[.9,1.6]];
function skiffAt(t){if(t<104.5)return {p:SKIFF0.clone(),yaw:0};const w=mech(1,Math.max(104.5,t-3.2));const p=V(w.x+2,LV,w.z+7);
  const u=ss(104.5,108,t);const q=SKIFF0.clone().lerp(p,u);if(t>140){const e=V(-14,LV,66);q.lerp(e,ss(140,143.5,t));}return {p:q,yaw:Math.PI-w.yaw*0};}
function person(i,t){const a=ARR[i],c0=a-3.4;const roof=V(128+i*2.6,LADDER.top,22.6);const wait=V(LADDER.x-2.5+i*.9,LADDER.top,22.8);
  if(t<80+i*1.2)return {p:roof.clone().add(V(Math.sin(t*1.3+i)*.3,0,Math.cos(t*.9+i)*.2)),on:'roof'};
  if(t<c0)return {p:roof.clone().lerp(wait,ss(80+i*1.2,84+i*1.2,t)),on:'roof'};
  if(t<c0+.7)return {p:wait.clone().lerp(V(LADDER.x,LADDER.top,LADDER.z-.4),ss(c0,c0+.7,t)),on:'roof'};
  if(t<a){const u=(t-c0-.7)/(a-c0-.7);return {p:V(LADDER.x,lerp(LADDER.top,LV+.6,u),LADDER.z),on:'ladder'};}
  const sk=skiffAt(t);const sp=sk.p.clone().add(V(SEAT[i][0],.5,SEAT[i][1]));
  const out=143.6+i*.45;if(t<out)return {p:sp,on:'skiff'};
  const w=V(-18+i*1.6,0,76+(i%2)*1.4);w.y=PORT.h(w.x,w.z);return {p:sp.lerp(w,ss(out,out+3,t)),on:'street'};}
/* ---------------------------------------------------------------- the sim */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
const SP=[];for(let j=0;j<20;j++)SP.push({t:22+j*.55,id:'knot',x:-6+((j*29)%110),z:22+((j*13)%34)});SP.push({t:30,id:'runner',x:90,z:20},{t:33,id:'runner',x:20,z:60});
for(let j=0;j<10;j++)SP.push({t:78+j*.9,id:'skein',x:176+((j*7)%20),z:-6+((j*11)%40)});for(let j=0;j<4;j++)SP.push({t:80+j*2.2,id:'runner',x:190,z:10+j*8});
for(let j=0;j<6;j++)SP.push({t:110+j*1.5,id:'runner',x:-60+((j*23)%50),z:-30+((j*17)%30),prey:1});
SP.sort((a,b)=>a.t-b.t);
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=2020;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:3000,maxDebris:3000});sw.points.layers.set(1);sw.ground=(x,z)=>PORT.h(x,z);
  Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.si=0;SIM.cool=[2.2,1.4,.6,1.8];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];FFX.reset();}
const TG=[],TGP=[];
function simStep(){const t=SIM.t,sw=SIM.sw;const sv=Math.random;Math.random=srnd;
  while(SIM.si<SP.length&&SP[SIM.si].t<=t){const w=SP[SIM.si++];const c=sw.spawn(w.id,V(w.x,PORT.h(w.x,w.z),w.z),0);if(w.prey)c.prefers='ally';}
  TG.length=0;for(let k=0;k<4;k++){const m=mech(k,t);TG.push({pos:V(m.x,m.gy,m.z),kind:'mech',notice:110});}
  if(t>100){const sk=skiffAt(t).p;TG.push({pos:V(sk.x,PORT.h(sk.x,sk.z),sk.z),kind:'ally',notice:400});}else TG.push({pos:V(LADDER.x,PORT.h(LADDER.x,LADDER.z+3),LADDER.z+3),kind:'ally',notice:200});
  sw.update(DT,t,TG);
  if(t>24&&t<140){for(let k=0;k<4;k++){const m=mech(k,t);if(m.hov>.4)continue;
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      if(n1<n0){const c=SIM.tgt[k];const mz=muzzle(m,(n1%2)?1:-1);let at;
        if(c&&!c.dead){at=sw.center(c).add(V((srnd()-.5)*2.4,(srnd()-.5)*1.6,(srnd()-.5)*2.4));
          if(srnd()<.6){const before=c.count;const got=sw.hit(c,at,1.6,1+(srnd()<.35?1:0));if(got>0)SIM.ev.push({t,k:'hit',x:at.x,z:at.z});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}
        else at=mz.clone().add(V(-Math.sin(m.yaw)*60,-5,-Math.cos(m.yaw)*60));
        const wy=Math.max(PORT.h(at.x,at.z),LV);FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,wy,at.z),1.3,10);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z)*(c.prefers==='ally'?.6:1);if(d<bd&&d<160){bd=d;best=c;}}
        if(best){SIM.tgt[k]=best;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=1.4+srnd()*1.1;}else SIM.cool[k]=.3;}}}}
  if(t>139&&t<139+DT*1.2)for(const c of sw.list)if(!c.dead){const at=sw.center(c);sw.hit(c,at,8,c.count);SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>40000)break;}}
/* ---------------------------------------------------------------- lines */
const LINES=[
 {id:'M2_01_OW',t:2.0,w:3.9,who:'OVERWATCH',p:.1,tx:'The low town flooded overnight. Someone’s still in it.'},
 {id:'M2_02_LANTERN',t:10.4,w:7.8,who:'LANTERN',p:.55,tx:'Any IRMD unit, this is Lantern. Six of us on the cannery roof. The water’s at the second floor and there’s something in it.'},
 {id:'M2_03_OW',t:19.8,w:6.5,who:'OVERWATCH',p:.15,tx:'Lantern, OVERWATCH. I see you. Six green. Help’s coming… and it’s big.'},
 {id:'M2_04_OW',t:28.6,w:6.3,who:'OVERWATCH',p:.2,tx:'Wraith, the street’s flooded. Wade the shallow parts. The canal’s too deep: jets.'},
 {id:'M2_05_OW',t:40.4,w:3.5,who:'OVERWATCH',p:.3,tx:'That’s past your hips. Hover, or you’re swimming.'},
 {id:'M2_06_OW',t:52.4,w:4.1,who:'OVERWATCH',p:.35,tx:'Fifties. Fast. They go for whatever’s slowest.'},
 {id:'M2_07_LANTERN',t:66.4,w:4.1,who:'LANTERN',p:.4,tx:'That’s a mech. That’s an actual MECH.'},
 {id:'M2_08_PILOT',t:72.4,w:2.2,who:'WRAITH',p:.05,tx:'Climb down. I’ve got you.'},
 {id:'M2_09_OW',t:76.6,w:4.3,who:'OVERWATCH',p:.35,tx:'Contacts closing on the cannery. Hold them while Lantern climbs down.'},
 {id:'M2_10_LANTERN',t:T10,w:4.5,who:'LANTERN',p:P10,tx:'Two down. Four. Everyone’s down! Where do we go?'},
 {id:'M2_11_OW',t:104.0,w:2.8,who:'OVERWATCH',p:.3,tx:'High street. Stay behind the big thing.'},
 {id:'M2_12_OW',t:112.6,w:3.7,who:'OVERWATCH',p:.4,tx:'Stay with them. Runners go for whoever’s slowest.'},
 {id:'M2_13_LANTERN',t:146.0,w:6.2,who:'LANTERN',p:.1,tx:'High street. All six of us. Wraith… whoever’s in there, we owe you.'},
 {id:'M2_14_OW',t:154.0,w:5.3,who:'OVERWATCH',p:0,tx:'Six green. Six. That’s the best number I’ve seen all day.'},
 {id:'M2_15_LANTERN',t:161.0,w:2.4,who:'LANTERN',p:0,tx:'Point us at something. We’ll paint it.'},
 {id:'M2_16_OW',t:165.2,w:5.0,who:'OVERWATCH',p:0,tx:'They’re sending you a Lance. For the big ones. They didn’t say which big ones.'}];
/* ---------------------------------------------------------------- shots */
const SHOTS=[
 {t0:0,t1:10,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(170,38,-140),V(130,30,-96),ease(u)),l:vl(V(20,5,60),V(10,5,70),u),fov:44,real:1})},
 {t0:10,t1:19.6,name:'LANTERN · ROOF',f:(u,t)=>({p:V(148+Math.sin(t*1.9)*.15,LADDER.top+1.7+Math.sin(t*2.7)*.08,23.2),l:V(60,5,60),fov:54,real:1,shake:.06})},
 {t0:19.6,t1:28.4,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(60,250,110),V(66,240,96),u),l:V(60,0,40),fov:60})},
 {t0:28.4,t1:40.4,name:'KESTREL · OPTICAL',f:(u,t)=>{const m=mech(0,t);return {p:V(-20,m.y+9,m.z+16),l:V(-20,LV,m.z-50),fov:46,real:1,shake:.03};}},
 {t0:40.4,t1:52.4,name:'KESTREL · OPTICAL',f:(u,t)=>{const m=mech(1,t);return {p:V(-18,LV+5,26),l:V(m.x,m.y+4,m.z),fov:44,real:1,shake:.05*m.hov};}},
 {t0:52.4,t1:66,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+10,m.z+8),l:vl(V(m.x+60,LV,m.z-10),V(m.x+40,LV,m.z+20),ease(u)),fov:46};}},
 {t0:66,t1:76.5,name:'LANTERN · ROOF',f:(u,t)=>{const m=mech(1,t);return {p:V(146,LADDER.top+1.8,23.4),l:V(m.x,m.y+5,m.z),fov:50,real:1,shake:.05};}},
 {t0:76.5,t1:98,name:'— — —',cuts:[
   [76.5,t=>{const m=mech(1,t);return {p:V(m.x-6,m.y+11,m.z+8),l:V(185,LV,15),fov:44};}],
   [84,{p:V(151,LADDER.top+2,23.6),l:V(LADDER.x-2,LADDER.top+.6,22.8),fov:48,real:1}],
   [90,t=>{const m=mech(3,t);return {p:V(m.x+3,m.y+10,m.z+8),l:V(185,LV,10),fov:44};}],
   [94,{p:V(131,LV+2.4,37),l:V(LADDER.x,9,LADDER.z),fov:42,real:1}]]},
 {t0:98,t1:112,name:'LANTERN · SKIFF',f:(u,t)=>{const s=skiffAt(t).p;const m=mech(1,t);return {p:V(s.x+.6,LV+2.8,s.z+5.2),l:t<104?V(LADDER.x,8,LADDER.z):V(m.x,m.y+6,m.z),fov:54,real:1,shake:.04};}},
 {t0:112,t1:126,name:'HALE · SENSOR',f:(u,t)=>{const m=mech(3,t);const s=skiffAt(t).p;return {p:V(m.x+4,m.y+11,m.z+10),l:s.clone().lerp(V(-40,LV,-20),.4),fov:52};}},
 {t0:126,t1:143,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(20,220,90),V(-10,200,100),u),l:V(-10,0,50),fov:58})},
 {t0:143,t1:160,name:'PIKE · HIGH STREET',f:u=>({p:vl(V(-19,PORT.h(-19,92)+1.8,92),V(-19,PORT.h(-19,90)+1.9,90),u),l:V(-20,4,62),fov:50,real:1})},
 {t0:160,t1:DUR,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(-40,22,110),V(-70,110,230),ease(u)),l:vl(V(-10,5,60),V(40,0,-20),ease(u)),fov:48,real:1})}];
/* ---------------------------------------------------------------- tracks */
const per=(t,vals)=>vals[FILM.shotIndex(t)];
function tracks(t){simTo(t);const o={};
  o.real=per(t,[1,1,.28,1,1,.42,1,.42,1,.42,.28,1,1]);o.mono=per(t,[0,0,1,0,0,.55,0,.55,0,.55,1,0,0]);
  if(t>=76.5&&t<98){const c=t<84||(t>=90&&t<94);o.real=c?.42:1;o.mono=c?.55:0;}
  o.dots=o.real>=1?0:1;o.mode=0;
  o.interf=K([[0,.06],[10,.08],[19.6,.12],[28,.1],[52,.18],[66,.12],[76,.2],[98,.15],[112,.25],[126,.2],[143,.06],[DUR,.04]],t);
  o.stut=0;o.wexp=1.08;o.exp=.74;o.fade=ss(DUR-1.8,DUR,t)+(1-ss(0,1.6,t));
  o.count=SIM.sw?SIM.sw.dots:0;o.range=t<10?null:'0.2 KM';
  o.title=t<8.5?{k:ss(.8,1.8,t)*(1-ss(6.6,8.2,t)),org:'Mission 2 · 07:15',t:'HIGH WATER',sub:'Port Arlen low town · International Rift Mech Defense'}:
    t>172?{k:ss(172.5,174,t)*(1-ss(179.6,181.4,t)),org:'Board clear',t:'HIGH WATER',sub:'Lantern: 6 of 6 · Squads lost: 0'}:null;
  o.nohud=t<8.4||t>172;o.flare=t<78?1:0;
  return o;}
let allyTeam=[],allyP=[],FOLK=[],flare=null,flareL=null,jets=[],skiffG=null,ladderG=null;
function apply(t,o,cam,px){const sw=SIM.sw;const mv=[0,1,2,3].map(k=>mech(k,t));
  const look=mv.map((m,k)=>{let yaw=0;const c=SIM.tgt[k];if(c&&!c.dead&&t>24&&t<140){const a=Math.atan2(-(c.pos.x-m.x),-(c.pos.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
    return {pitch:k===1&&t>66&&t<76?.15:-.02,yaw:yaw*.5,torso:yaw*.8,aim:t>24&&t<140&&m.hov<.3?-.32:-.1};});
  if(TEAM.ready)TEAM.pose(t,look,mv);mv.forEach((m,k)=>{allyTeam[k].position.set(m.x,m.y-5.5,m.z);
    const J=jets[k];const on=m.hov>.05;J.forEach((s,i)=>{s.visible=on;s.position.set(m.x+(i?1.4:-1.4),m.y+.4,m.z+.6);s.scale.setScalar(3.4*m.hov*(.85+.15*Math.sin(t*40+i)));s.material.opacity=m.hov;});});
  /* the six */
  for(let i=0;i<6;i++){const P=person(i,t);FOLK[i].position.copy(P.p);FOLK[i].rotation.y=P.on==='ladder'?Math.PI:P.on==='roof'?.8+Math.sin(t+i)*.6:Math.PI;
    allyP[i].position.set(P.p.x,P.p.y-2.9,P.p.z);}
  const sk=skiffAt(t);skiffG.position.copy(sk.p);skiffG.position.y=LV-.2+Math.sin(t*1.6)*.08;skiffG.rotation.set(Math.sin(t*1.3)*.03,0,Math.sin(t*1.7)*.04);
  /* Lantern's flare, waved on the roof */
  const fp=person(5,t).p;flare.visible=flareL.visible=o.flare>0;flare.position.set(fp.x+.4+Math.sin(t*3)*.5,fp.y+2.3+Math.abs(Math.sin(t*3))*.4,fp.z);flareL.position.copy(flare.position);
  flare.scale.setScalar(2.6*(.85+.3*Math.sin(t*37)*Math.sin(t*23)));flareL.intensity=40*(.8+.2*Math.sin(t*31));
  const ch=[];mv.forEach(m=>ch.push({x:m.x,z:m.z,r:m.hov>.3?9:3,k:m.hov>.3?1.4:.6}));if(sw)for(const c of sw.list)if(!c.dead&&!c.gone&&ch.length<16)ch.push({x:c.pos.x,z:c.pos.z,r:2.5,k:.5});
  PORT.update(t,{morn:1,level:LV,rift:0,grey:0,fire:0,churn:ch});
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(false);sw.mat.uniforms.uSizeMul.value=1.6;}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;FFX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params,ctx=S.ctx;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  F.RAMP(P.rain,[[0,0],[1.5,.09],[DUR-3,.08],[DUR,0]],A);F.RAMP(P.wind,[[0,0],[2,.14],[DUR-3,.14],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[2,.16],[DUR-3,.16],[DUR,0]],A);
  /* the flare's hiss on the roof shots */
  for(const [a,b,k] of [[10,19.6,1],[66,76.5,.8]]){const g=ctx.createGain();g.connect(S.sfx);const s=ctx.createBufferSource();const n=Math.floor(ctx.sampleRate*2),bf=ctx.createBuffer(1,n,ctx.sampleRate),d=bf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    s.buffer=bf;s.loop=true;const hp=ctx.createBiquadFilter();hp.type='bandpass';hp.frequency.value=3200;hp.Q.value=.8;s.connect(hp);hp.connect(g);g.gain.setValueAtTime(0,A(a));g.gain.linearRampToValueAtTime(.05*k,A(a+.3));g.gain.setValueAtTime(.05*k,A(b-.3));g.gain.linearRampToValueAtTime(0,A(b));s.start(A(a));s.stop(A(b+.1));}
  /* wading: a slow slosh each stride; jets over the canal */
  for(let k=0;k<4;k++){let lastD=0;for(let tt=0;tt<DUR;tt+=.05){const m=mech(k,tt);if(Math.floor(m.dist/3.4)!==Math.floor(lastD/3.4)){const deep=LV-m.gy;if(deep>.3)S.fizz(A(tt),[-.6,-.2,.2,.6][k],(k===1?.8:.45)*Math.min(1.2,deep*.5));else S.step(A(tt),[-.6,-.2,.2,.6][k],k===1?.8:.4);}lastD=m.dist;}
    let on=false;for(let tt=0;tt<DUR;tt+=.1){const h=mech(k,tt).hov;if(!on&&h>.1){on=true;S.riser(A(tt),1.2);S.wash(A(tt),3.5);}if(on&&h<.1)on=false;}}
  for(const [a,b] of [[42,50],[124,132]]){const g=ctx.createGain();g.connect(S.sfx);const s=ctx.createBufferSource();const n=Math.floor(ctx.sampleRate*2),bf=ctx.createBuffer(1,n,ctx.sampleRate),d=bf.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=.97*l+.2*(Math.random()*2-1);d[i]=l;}
    s.buffer=bf;s.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(500,A(a));lp.frequency.linearRampToValueAtTime(1600,A(a+2));s.connect(lp);lp.connect(g);
    g.gain.setValueAtTime(0,A(a));g.gain.linearRampToValueAtTime(.32,A(a+1.2));g.gain.setValueAtTime(.32,A(b-1));g.gain.linearRampToValueAtTime(0,A(b));s.start(A(a));s.stop(A(b+.1));}
  for(let i=0;i<6;i++)S.thud(A(ARR[i]),.3,.5);
  const camK=t=>[.3,.4,.6,1,1,1,.6,.9,.7,.9,.6,.4,.3][FILM.shotIndex(t)];
  let lastHit=-9;for(const e of EV){const pn=clamp((e.x-40)/120,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x-mech(1,e.t).x)/30,-.8,.8),.55*camK(e.t),6);
    else if(e.k==='hit'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,.35*camK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,.65*camK(e.t));}
  /* music: grey morning (B minor), the wade, the fifties, the rescue, the escort, six green */
  [['B2','F#3','D4'],['G2','D3','B3'],['D3','A3','F#4'],['A2','E3','C#4']].forEach((c,i)=>S.chord(A(.5+i*2.4),2.8,c,.45,'pad'));
  [[1.4,'F#4'],[3.8,'D4'],[6.2,'C#4'],[8.6,'B3']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.55,'pno'));
  S.chord(A(10.4),9,['B1','F#2','B2'],.5,'str');S.chord(A(19.8),8.6,['D2','A2','F#3'],.45,'str');
  const b1=60/104*4;S.pulse(A(28.4),12,'B1',104,.6,{kick:false});S.pulse(A(52.4),13.6,'B1',116,.75,{snare:true});
  [['B2','D3','F#3'],['G2','B2','D3'],['A2','C#3','E3'],['F#2','A#2','C#3']].forEach((c,i)=>{const tt=52.4+i*b1*.9;S.chord(A(tt),b1*.9,c,.55,'brass');});
  S.chord(A(66.4),10,['D3','F#3','A3','D4'],.55,'str');[[67,'A4'],[69,'B4'],[71,'D5'],[73,'C#5']].forEach(([tt,n])=>S.chord(A(tt),2.2,[n],.7,'pno'));
  const b2=60/112*4;S.pulse(A(76.6),21.4,'B1',112,.75,{snare:true});const pr=[['B2','D3','F#3'],['E2','G2','B2'],['G2','B2','D3'],['F#2','A#2','C#3']];
  for(let i=0;i<10;i++){const tt=76.6+i*b2;if(tt>=97)break;S.chord(A(tt),b2,pr[i%4],.55+i*.02,i%2?'str':'brass');}
  S.riser(A(95),3);ARR.forEach((a,i)=>S.pluck(A(a),[493.9,587.3,659.3,740,880,987.8][i],.8,(i%2?.3:-.3)));S.chord(A(T10+2.4),3.5,['D3','F#3','A3','D4'],.7,'brass');
  S.pulse(A(104),36,'B1',120,.8,{snare:true,oct:true});for(let i=0;i<18;i++){const tt=104+i*2;if(tt>=139.5)break;S.chord(A(tt),2,pr[(i+1)%4],.6,i%2?'brass':'str');if(i%2===0)S.taiko(A(tt),.8,i%4?.3:-.3);}
  S.hit(A(139.4),.6);
  const after=[['D3','A3','F#4'],['A2','E3','C#4'],['B2','F#3','D4'],['G2','D3','B3'],['D3','A3','D4','F#4'],['A2','E3','A3','C#4'],['G2','D3','G3','B3'],['D3','A3','D4','F#4']];
  after.forEach((c,i)=>S.chord(A(143+i*3.6),4,c,.5+i*.04,'str'));
  [[146.5,'F#5'],[148.3,'E5'],[150.1,'D5'],[151.9,'A4'],[154.5,'B4'],[156.3,'D5'],[158.1,'F#5'],[161,'A5'],[163,'F#5'],[165.5,'D5'],[172.5,'F#5']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.75,'pno'));
  S.chord(A(172.5),9,['D2','A2','D3','F#3','A3'],.7,'choir');S.sting(A(172.5),.5);}
/* ---------------------------------------------------------------- build */
function build(scene,F){buildMT();PORT.build(scene);FFX.init(scene);for(const o of PORT.occ)o.layers.enable(2);
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  const coats=[0xb8462c,0x2e3a48,0xc8a23a,0x3a4a3a,0x5a2a48,0x2a2e34];
  for(let i=0;i<6;i++){const g=new T.Group();const m=new T.MeshStandardMaterial({color:coats[i],roughness:.8});const b=new T.Mesh(new T.CapsuleGeometry(.28,.95,4,8),m);b.position.y=.78;g.add(b);
    const h=new T.Mesh(new T.SphereGeometry(.17,8,6),new T.MeshStandardMaterial({color:0x2a2420,roughness:.9}));h.position.y=1.6;g.add(h);scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});FOLK.push(g);
    const a=SIG.makeAllies([V(0,5.5,0)]);a.scale.set(.35,.35,.35);a.layers.set(1);scene.add(a);allyP.push(a);}
  /* the ladder down the cannery's south wall, the skiff */
  const dark=new T.MeshStandardMaterial({color:0x2a2a2c,roughness:.7,metalness:.4});ladderG=new T.Group();scene.add(ladderG);
  for(const dx of [-.4,.4]){const r=new T.Mesh(new T.BoxGeometry(.08,LADDER.top-LV+1,.08),dark);r.position.set(LADDER.x+dx,(LADDER.top+LV-1)/2,LADDER.z);ladderG.add(r);}
  for(let y=LV;y<LADDER.top;y+=.4){const r=new T.Mesh(new T.BoxGeometry(.8,.05,.05),dark);r.position.set(LADDER.x,y,LADDER.z);ladderG.add(r);}
  skiffG=new T.Group();scene.add(skiffG);const hull=new T.Mesh(new T.BoxGeometry(2.6,.8,6.2),new T.MeshStandardMaterial({color:0x8a9aa0,roughness:.6,metalness:.3}));hull.position.y=.2;skiffG.add(hull);
  const inner=new T.Mesh(new T.BoxGeometry(2.2,.5,5.6),new T.MeshStandardMaterial({color:0x2a3034,roughness:.9}));inner.position.y=.45;skiffG.add(inner);skiffG.traverse(o=>{if(o.isMesh)o.layers.enable(2);});
  /* the flare and the jets */
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
  flare=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(1,.15,.08),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));scene.add(flare);
  flareL=new T.PointLight(0xff2a14,40,60,1.5);scene.add(flareL);
  jets=[0,1,2,3].map(()=>[0,1].map(()=>{const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(.6,.8,1),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.visible=false;scene.add(s);return s;}));
  simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[
 ['LANTERN · 6','green',()=>V(140,LADDER.top+5,18),t=>t>=19.6&&t<28.4],['CANAL · TOO DEEP','',()=>V(-20,LV+3,45),t=>t>=28.4&&t<40.4],
 ['RUNNERS','red',(o,t)=>{const c=SIM.sw&&SIM.sw.list.find(c=>c.rig.id==='runner'&&!c.dead);return c?SIM.sw.center(c).add(V(0,5,0)):V(0,-99,0);},t=>t>=53&&t<60],
 ['SKIFF · 6','green',(o,t)=>skiffAt(t).p.clone().add(V(0,5,0)),t=>t>=112&&t<143]];
FILM.run({id:'m2',DUR,place:'Port Arlen',pageTitle:'IRMD · Mission 2 · High Water',clock:[7,15,0],poster:30,
  start:{org:'International Rift Mech Defense · Mission 2',t:'High Water',sub:'Port Arlen low town · 07:15 · 3 min<br>Sound on, headphones if you have them'},
  end:{org:'Lantern: six green',t:'High Water',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M2SIM=SIM;window.M2SIMTO=simTo;
})();
