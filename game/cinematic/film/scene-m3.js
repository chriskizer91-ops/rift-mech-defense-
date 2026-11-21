'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 3, THE DIG (game/cinematic/film/scene-m3.js, session D)
   2 min 52 in Kessel Cut quarry at midday. The first boss, staged with the game's pieces:
     0:00  into the quarry; ANVIL's six old guns (three on screen) check in
     0:20  the rift in the north wall streams KNOTs and SKEINs; Tern marks it from the lip; ANVIL fires; 20 s of flight;
           1:04 the shells land and the mouth caves in. The stream stops.
     1:16  the first STALKER ("A hundred. It doesn't rush. It waits.") and runners
     1:38  BRUTE comes out from under the dump trucks and eats them: 500, 540, 600, 700
     2:04  thermal: the core. 2:20 the Lance. "Gone. It's just grit now."
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=172,DT=1/60,R=QUARRY.RIFT;
const FIRE=[0,.55,1.1],SHOT=44.0,LAND=64.0,THERM=127.4,LANCE=140.6;
/* ---------------------------------------------------------------- the team */
const END=[-36,-14,8,30];
function mech(k,t){const t0=13+k*.5,u=clamp((t-t0)/12,0,1),e=(1-Math.cos(Math.PI*u))/2;
  const sx=[-12,-4,4,12][k],sz=200+k*9;let x=lerp(sx,END[k],e),z=lerp(sz,52,e);const d1=Math.hypot(END[k]-sx,52-sz)*e,s1=u>0&&u<1?Math.hypot(END[k]-sx,52-sz)*Math.PI/24*Math.sin(Math.PI*u):0;
  const v=clamp((t-(100+k*.4))/12,0,1),f=(1-Math.cos(Math.PI*v))/2;x+=34*f;z-=8*f;const d2=35*f,s2=v>0&&v<1?35*Math.PI/24*Math.sin(Math.PI*v):0;
  const yaw=u<1?Math.atan2(-(END[k]-sx),-(52-sz))*(1-ss(.85,1,u)):v>0&&v<1?-.8*Math.sin(Math.PI*v):0;
  return {x,z,y:QUARRY.h(x,z),yaw,dist:d1+d2,spd:Math.max(s1,s2)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- the sim */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
const SP=[];for(let t=20.5,i=0;t<LAND;t+=.9+((i*7)%5)*.18,i++)SP.push({t,id:i%3===2?'skein':'knot',x:R.x+((i*5)%9-4)*1.1,z:R.z+5});
SP.push({t:76,id:'stalker',x:118,z:-112});for(let j=0;j<6;j++)SP.push({t:80+j*1.3,id:'runner',x:-120+j*9,z:-115});
SP.push({t:98,id:'brute',x:98,z:38,boss:1});
SP.sort((a,b)=>a.t-b.t);
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=3131;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:5000,maxDebris:4000});sw.points.layers.set(1);sw.ground=(x,z)=>QUARRY.h(x,z);
  Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.si=0;SIM.cool=[2.2,1.4,.6,1.8];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];SIM.boss=null;SIM.eat=[0,0,0,0,0];FFX.reset();}
const TG=[];
function simStep(){const t=SIM.t,sw=SIM.sw;const sv=Math.random;Math.random=srnd;
  while(SIM.si<SP.length&&SP[SIM.si].t<=t){const w=SP[SIM.si++];const c=sw.spawn(w.id,V(w.x,QUARRY.h(w.x,w.z),w.z),w.boss?2.5:0);if(w.boss){SIM.boss=c;c.prefers='ally';}}
  TG.length=0;for(let k=0;k<4;k++){const m=mech(k,t);TG.push({pos:V(m.x,m.y,m.z),kind:'mech',notice:300});}
  const B=SIM.boss;
  if(B&&!B.dead){let best=-1,bd=1e9;QUARRY.TRUCKS.forEach(([x,z],i)=>{if(SIM.eat[i]>=1)return;const d=Math.hypot(B.pos.x-x,B.pos.z-z);if(d<bd){bd=d;best=i;}});
    if(best>=0&&t<133){const [x,z]=QUARRY.TRUCKS[best];TG.push({pos:V(x,0,z),kind:'ally',notice:500});
      if(bd<10){const before=SIM.eat[best];SIM.eat[best]=Math.min(1,SIM.eat[best]+DT/2.6);const n=Math.floor(SIM.eat[best]*40)-Math.floor(before*40);if(n>0)sw.absorb(B,V(x,1,z),n);
        if(Math.floor(before*6)!==Math.floor(SIM.eat[best]*6))SIM.ev.push({t,k:'eat',x,z});}}
    else B.prefers='mech';
    /* until thermal finds the core, it can't be hurt for long: what comes off crawls back, and it feeds */
    if(t<THERM+3&&B.count<B.n0*.85)sw.grow(B,2);}
  sw.update(DT,t,TG);
  if(t>24&&t<150){for(let k=0;k<4;k++){const m=mech(k,t);
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      if(n1<n0){const c=SIM.tgt[k];const mz=muzzle(m,(n1%2)?1:-1);let at;
        if(c&&!c.dead){const core=c===B&&t>THERM+4&&k===1&&c.core;at=core?c.corePos.clone().add(V((srnd()-.5)*1.2,(srnd()-.5)*1.2,(srnd()-.5)*1.2)):sw.center(c).add(V((srnd()-.5)*3,(srnd()-.5)*2,(srnd()-.5)*3));
          at.y=Math.max(QUARRY.h(at.x,at.z)+.2,at.y);
          if(srnd()<(c===B?.5:.62)){const before=c.count;const got=sw.hit(c,at,1.6,c===B&&!core?1:1+(srnd()<.35?1:0));if(got>0)SIM.ev.push({t,k:sw.lastCore?'core':'hit',x:at.x,z:at.z,n:got});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}
        else at=mz.clone().add(V(-Math.sin(m.yaw)*60,-5,-Math.cos(m.yaw)*60));
        const gy=QUARRY.h(at.x,at.z);FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,gy,at.z),1.1,at.y-gy<1.5?12:5);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z)*(c===B?.6:1);if(d<bd&&d<240){bd=d;best=c;}}
        if(best&&!(k===1&&t>LANCE-1.4&&t<LANCE+.3)){SIM.tgt[k]=best;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=1.5+srnd()*1.1;}else SIM.cool[k]=.3;}}}}
  /* the Lance: WRAITH, into the core */
  if(B&&!B.dead&&t>=LANCE&&t<LANCE+DT*1.2){const m=mech(1,t);const mz=muzzle(m,1);const at=B.corePos.clone();FFX.shot(t,mz,at,3.2);FFX.flash(t,mz,3);
    const got=sw.hit(B,at,3,70);SIM.ev.push({t,k:'lance',x:at.x,z:at.z,n:got});if(B.dead)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:'brute'});}
  /* the shells cave in the mouth: anything near it goes too */
  for(let i=0;i<3;i++){const tl=LAND+FIRE[i]*1.1;if(t>=tl&&t<tl+DT*1.2){sw.blast(V(R.x,0,R.z+6),24,400);}}
  if(t>147&&t<147+DT*1.2)for(const c of sw.list)if(!c.dead){const at=sw.center(c);sw.hit(c,at,10,c.count);SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>40000)break;}}
/* ---------------------------------------------------------------- lines */
const LINES=[
 {id:'M3_01_OW',t:2.2,w:4.8,who:'OVERWATCH',p:.05,tx:'Kessel Cut. The quarry wall opened up last night. It’s a rift.'},
 {id:'M3_02_ANVIL',t:9.4,w:6.5,who:'ANVIL',p:.1,tx:'ANVIL. Six guns behind the ridge, every one older than me. Find me the hole.'},
 {id:'M3_03_TERN',t:21.0,w:4.7,who:'TERN',p:.4,tx:'Tern on the lip! We can see the mouth. Keep them off us and we’ll mark it.'},
 {id:'M3_04_OW',t:30.0,w:4.2,who:'OVERWATCH',p:.25,tx:'It’s pouring out of there. It won’t stop until the mouth caves in.'},
 {id:'M3_05_TERN',t:39.6,w:1.7,who:'TERN',p:.5,tx:'Marked! Send it!'},
 {id:'M3_06_ANVIL',t:42.0,w:2.8,who:'ANVIL',p:.25,tx:'Shot, over. Twenty seconds.'},
 {id:'M3_07_ANVIL',t:66.0,w:4.3,who:'ANVIL',p:.15,tx:'Splash. That’s a hole in the ground now. Rift’s closed.'},
 {id:'M3_08_OW',t:71.8,w:3.4,who:'OVERWATCH',p:.1,tx:'Stream’s stopped. Nothing else is coming out of that one.'},
 {id:'M3_09_OW',t:80.4,w:4.1,who:'OVERWATCH',p:.3,tx:'A hundred. It doesn’t rush. It waits.'},
 {id:'M3_10_SLATE',t:96.4,w:4.5,who:'SLATE',p:.45,tx:'Slate, quarry crew. Something’s moving under the dump trucks.'},
 {id:'M3_11_OW',t:103.0,w:4.2,who:'OVERWATCH',p:.4,tx:'Five hundred. That’s bigger than you, Wraith.'},
 {id:'M3_12_OW',t:110.0,w:3.9,who:'OVERWATCH',p:.5,tx:'It’s eating the trucks. Five-forty. Six hundred.'},
 {id:'M3_13_OW',t:118.0,w:2.4,who:'OVERWATCH',p:.55,tx:'Kill it before it finishes the yard.'},
 {id:'M3_14_OW',t:124.4,w:2.4,who:'OVERWATCH',p:.4,tx:'Thermal. Look for the hot part.'},
 {id:'M3_15_PILOT',t:129.8,w:1.1,who:'WRAITH',p:.1,tx:'I see it.'},
 {id:'M3_16_OW',t:132.4,w:4.3,who:'OVERWATCH',p:.35,tx:'There. The core. Hit that and it really hurts.'},
 {id:'M3_17_OW',t:143.6,w:2.6,who:'OVERWATCH',p:.1,tx:'Gone. It’s just grit now.'},
 {id:'M3_18_SLATE',t:155.0,w:3.5,who:'SLATE',p:.05,tx:'Never thought I’d be glad to see a quarry full of gravel.'}];
/* ---------------------------------------------------------------- shots */
const boss=()=>SIM.boss&&!SIM.boss.gone?SIM.sw.center(SIM.boss):V(100,4,40);
const SHOTS=[
 {t0:0,t1:9,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(160,170,300),V(70,90,190),ease(u)),l:vl(V(0,0,0),V(-20,8,-120),ease(u)),fov:46})},
 {t0:9,t1:17,name:'ANVIL · BATTERY',f:u=>({p:vl(V(-632,75,140),V(-630,74.5,136),u),l:V(-600,72,110),fov:42})},
 {t0:17,t1:25,name:'KESTREL · OPTICAL',f:(u,t)=>{const m=mech(0,t);return {p:V(m.x-6,m.y+9.5,m.z+16),l:V(R.x,8,R.z),fov:40,shake:.02};}},
 {t0:25,t1:34,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3.5,m.y+10,m.z+8),l:vl(V(R.x,8,R.z+4),V(R.x+6,4,R.z+40),ease(u)),fov:lerp(14,26,ease(u))};}},
 {t0:34,t1:44,name:'TERN · LIP',f:u=>({p:vl(V(30,49,-166),V(27,49.5,-165),u),l:V(R.x+4,3,R.z+30),fov:40,real:.5})},
 {t0:44,t1:50,name:'ANVIL · BATTERY',f:(u,t)=>({p:V(-650,76,128),l:V(-600,74,108),fov:38,shake:t>SHOT&&t<SHOT+2?.5*(1-ss(SHOT,SHOT+2,t)):0,real:1})},
 {t0:50,t1:63,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:vl(V(m.x-4,m.y+13,m.z+18),V(m.x-2,m.y+14,m.z+14),u),l:V(R.x,3,R.z+40),fov:44};}},
 {t0:63,t1:71,name:'WRAITH · OPTICAL',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3.5,m.y+9.8,m.z+8),l:V(R.x,10,R.z),fov:lerp(30,34,u),shake:t>LAND&&t<LAND+3?.4*(1-ss(LAND,LAND+3,t)):0,real:1};}},
 {t0:71,t1:80,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(0,240,60),V(10,230,40),u),l:V(0,0,-20),fov:56})},
 {t0:80,t1:96,name:'HALE · SENSOR',f:(u,t)=>{const m=mech(3,t);return {p:V(m.x+8,m.y+9,m.z+14),l:vl(V(110,4,-90),V(60,3,-20),ease(u)),fov:40};}},
 {t0:96,t1:108,name:'SLATE · YARD CAM',cuts:[[96,{p:V(70,7,80),l:V(98,1,36),fov:44,real:1}],[102.4,{p:V(70,7,80),l:V(98,1,36),fov:44}]]},
 {t0:108,t1:124,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);const b=boss();return {p:V(m.x+3,m.y+11,m.z+12),l:b,fov:lerp(24,17,u)};}},
 {t0:124,t1:132,name:'WRAITH · OPTICAL ▸ THERMAL',f:(u,t)=>{const m=mech(1,t);const b=boss();return {p:V(m.x+3.4,m.y+9.6,m.z+7.5),l:b,fov:30,real:t<THERM?1:.8,mode:t<THERM?0:1};}},
 {t0:132,t1:142,name:'WRAITH · THERMAL',f:(u,t)=>{const m=mech(1,t);const b=boss();return {p:V(m.x+2.8,m.y+9.6,m.z+6.8),l:b,fov:lerp(24,18,ease(u)),mode:1,real:.8,shake:t>LANCE&&t<LANCE+1.6?.6*(1-ss(LANCE,LANCE+1.6,t)):0};}},
 {t0:142,t1:154,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+12,m.z+14),l:V(100,2,36),fov:40};}},
 {t0:154,t1:DUR,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(60,30,120),V(40,190,300),ease(u)),l:vl(V(60,2,20),V(0,0,-40),ease(u)),fov:46,real:1})}];
/* ---------------------------------------------------------------- tracks */
const per=(t,vals)=>vals[FILM.shotIndex(t)];
function tracks(t){simTo(t);const o={};
  o.real=per(t,[1,1,1,.4,.5,1,.42,1,.28,.42,1,.4,1,.8,.42,1]);if(t>=102.4&&t<108)o.real=.42;
  o.mono=per(t,[0,0,0,.55,.45,0,.55,0,1,.55,0,.55,0,0,.55,0]);if(t>=102.4&&t<108)o.mono=.55;
  o.dots=o.real>=1?0:1;o.mode=0;
  o.interf=K([[0,.05],[20,.06],[30,.12],[50,.18],[63.8,.2],[64,.6],[65,.15],[76,.1],[96,.14],[103,.25],[110,.3],[124,.35],[THERM,.7],[THERM+.5,.15],[LANCE,.25],[LANCE+.2,.8],[LANCE+1,.2],[150,.08],[DUR,.04]],t);
  o.stut=(t>THERM&&t<THERM+.5)?.8:(t>LANCE&&t<LANCE+.8)?.6:(t>63.9&&t<65)?.4:0;o.wexp=1.05;o.exp=.68;
  o.flash=t>LANCE&&t<LANCE+.5?.3*(1-ss(LANCE,LANCE+.5,t)):0;
  o.fade=ss(DUR-1.8,DUR,t)+(1-ss(0,1.6,t));
  o.count=SIM.sw?SIM.sw.dots:0;o.range=t<17?null:'0.2 KM';
  o.title=t<8?{k:ss(.8,1.8,t)*(1-ss(6,7.6,t)),org:'Mission 3 · 12:20',t:'THE DIG',sub:'Kessel Cut quarry · International Rift Mech Defense'}:
    t>162?{k:ss(162.5,164,t)*(1-ss(169.6,171.4,t)),org:'Board clear · rift sealed',t:'THE DIG',sub:'BRUTE: 700 → 0 · Squads lost: 0'}:null;
  o.nohud=t<7.8||t>162;
  o.rift=1-ss(LAND,LAND+1.5,t);o.cave=ss(LAND,LAND+2.6,t);
  return o;}
let guns=[],allyTeam=[],allyTern=null,allyCrew=null;
function apply(t,o,cam,px){const sw=SIM.sw;
  const mv=[0,1,2,3].map(k=>mech(k,t));
  const look=mv.map((m,k)=>{let yaw=0;const c=SIM.tgt[k];if(c&&!c.dead&&t>24&&t<150){const a=Math.atan2(-(c.pos.x-m.x),-(c.pos.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
    return {pitch:-.02,yaw:yaw*.5,torso:yaw*.8,aim:t>24&&t<150?-.32:-.12};});
  if(TEAM.ready)TEAM.pose(t,look,mv);
  mv.forEach((m,k)=>allyTeam[k].position.set(m.x,m.y-5.5,m.z));
  const ch=[];if(sw)for(const c of sw.list)if(!c.dead&&!c.gone&&ch.length<16)ch.push({x:c.pos.x,z:c.pos.z,r:2+c.rig.size*.45*c.scale,k:.8});
  QUARRY.update(t,{rift:o.rift,cave:o.cave,eaten:SIM.eat,churn:ch});
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(o.mode>.5);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.9;else sw.mat.uniforms.uGain.value*=.45;}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;
  FFX.update(t,cam,px);FX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params,N=FSFX.N;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  F.RAMP(P.wind,[[0,0],[2,.2],[9,.2],[9.2,.3],[17,.3],[17.2,.12],[154,.14],[160,.24],[DUR,0]],A);
  F.RAMP(P.buzz,[[0,0],[17,0],[18,.01],[150,.012],[DUR,0]],A);
  F.RAMP(P.hum,[[0,0],[16,0],[22,.1],[63.9,.16],[64.1,0]],A);
  /* footsteps down the ramp, servos */
  for(let k=0;k<4;k++){for(let tt=13.6+k*.5;tt<24.6+k*.5;tt+=.62)S.step(A(tt),[-.6,-.2,.2,.6][k],k===0?1:.45);S.servo(A(25+k*.3),[-.6,-.2,.2,.6][k],.6);}
  for(let k=0;k<4;k++)for(let tt=100.6+k*.4;tt<111.6;tt+=.6)S.step(A(tt),[-.6,-.2,.2,.6][k],k===1?.9:.4);
  /* the stream: a steady crackle from the mouth while it's open */
  for(let tt=20.5;tt<LAND;tt+=.22+Math.random()*.3)S.fizz(A(tt),-.2,.12);
  /* ANVIL: the guns, the flight, the landing, the rock coming down */
  FIRE.forEach((f,i)=>{S.boom(A(SHOT+f),-.4+i*.3,1.1);S.whistle(A(LAND-2.6+f*1.1),2.6,.1,.9);S.blast(A(LAND+f*1.1),-.1,1.1);});
  S.riser(A(LAND-3.4),3.3);S.hit(A(LAND),.9);S.roar(A(LAND+.3),3.8);S.wash(A(LAND+.6),4);
  /* the fight from the log */
  const camK=t=>[.4,.4,1,1,.45,.35,1,1,.6,.9,.6,1,1,1,.9,.5][FILM.shotIndex(t)];
  let lastHit=-9;for(const e of EV){const pn=clamp(e.x/150,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x-mech(1,e.t).x)/30,-.8,.8),.55*camK(e.t),6);
    else if(e.k==='hit'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,.4*camK(e.t));}
    else if(e.k==='core'){S.fizz(A(e.t),pn,.9);S.thud(A(e.t),pn,.6);}
    else if(e.k==='eat'){S.thud(A(e.t),pn,.8);S.burst(A(e.t),.12,.5);}
    else if(e.k==='die')S.burstC(A(e.t),pn,e.id==='brute'?1.4:.7*camK(e.t));}
  S.switchV(A(THERM-.05),1);S.lance(A(LANCE-1.2),.1,1.2,1.2);S.hit(A(LANCE+.05),1.1);S.note(A(LANCE+.3),5);
  /* music: low and heavy, C minor; the Lance lands in silence, then the morning-after chord */
  S.chord(A(.5),8,['C2','G2','C3','Eb3'],.5,'pad');S.taiko(A(2),.5,-.3);S.taiko(A(6),.5,.3);
  S.chord(A(9),8,['Ab1','Eb2','C3'],.45,'str');S.taiko(A(13),.6,0);S.taiko(A(15),.6,0);
  const b=60/104*4;S.pulse(A(24),20,'C2',104,.7);[['C3','Eb3','G3'],['Ab2','C3','Eb3'],['Bb2','D3','F3'],['G2','B2','D3']].forEach((c,i)=>{for(let r=0;r<2;r++){const tt=24+(i*2+r)*b;if(tt<44)S.chord(A(tt),b,c,.55,'brass');}});
  for(let i=0;i<5;i++)S.taiko(A(24+i*b),.8,i%2?.3:-.3);
  F.RAMP(P.str,[[0,0],[44,0],[46,.05],[63.8,.12],[64,0],[80,0],[84,.05],[95,.08],[96,0]],A);P.strF.setValueAtTime(600,A(44));P.strF.exponentialRampToValueAtTime(1900,A(63.8));
  S.pulse(A(46),17.6,'C2',104,.55,{kick:false});
  S.chord(A(66.5),8,['Eb3','G3','Bb3','D4'],.5,'str');S.chord(A(74),6,['C3','G3','Eb4'],.4,'pad');
  S.chord(A(80),16,['C2','G2','C3'],.5,'choir');[[82,'G4'],[85,'Ab4'],[88,'G4'],[91,'F4'],[94,'Eb4']].forEach(([tt,n])=>S.chord(A(tt),2.6,[n],.6,'pno'));
  const b2=60/96*4;S.pulse(A(98),29,'C2',96,.8,{snare:true});const pr=[['C3','Eb3','G3','C4'],['Ab2','C3','Eb3','Ab3'],['Eb3','G3','Bb3','Eb4'],['Bb2','D3','F3','Bb3']];
  for(let i=0;i<12;i++){const tt=98+i*b2;if(tt>=THERM)break;S.chord(A(tt),b2,pr[i%4],.6+i*.02,i%2?'str':'brass');S.taiko(A(tt),.85,i%2?.3:-.3);}
  S.riser(A(THERM-3),3);S.stab(A(THERM),.7);S.chord(A(THERM),5,['C2','G2','C3'],.6,'choir');
  S.pulse(A(132),8,'C2',120,.75,{snare:true,oct:true});S.riser(A(LANCE-4),3.9);
  S.chord(A(LANCE+.4),8,['C3','G3','C4','Eb4','G4'],.8,'choir');S.chord(A(LANCE+.4),8,['C2','G2','C3'],.7,'brass');
  const after=[['Ab2','Eb3','C4'],['Eb3','Bb3','G4'],['Bb2','F3','D4'],['C3','G3','Eb4'],['Ab2','Eb3','C4','Eb4'],['Eb3','G3','Bb3','Eb4']];
  after.forEach((c,i)=>S.chord(A(149+i*3.6),4,c,.5+i*.05,'str'));
  [[151,'Eb5'],[152.8,'D5'],[154.6,'C5'],[156.4,'Bb4'],[159,'G4'],[160.8,'Bb4'],[162.6,'Eb5']].forEach(([tt,n])=>S.chord(A(tt),2.2,[n],.8,'pno'));
  S.chord(A(162.6),8.5,['Eb2','Bb2','Eb3','G3','Bb3'],.7,'choir');S.sting(A(162.6),.6);}
/* ---------------------------------------------------------------- build */
function build(scene,F){QUARRY.build(scene);FX.init(scene);FFX.init(scene);for(const o of QUARRY.occ)o.layers.enable(2);
  QUARRY.group.updateMatrixWorld(true);const MUZ=QUARRY.barrels.map(b=>b.localToWorld(V(0,9,0)));
  MUZ.forEach((m,i)=>{const t0=SHOT+FIRE[i],t1=LAND+FIRE[i]*1.1;const hit=V(R.x+(i-1)*4,R.y+6+i*2,R.z+3);FX.gun(m,t0);FX.shell(m,hit,t0+.05,t1);FX.blast(hit,t1,1.4);});
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  allyTern=SIG.makeAllies([V(QUARRY.LIP.x,QUARRY.LIP.y+2.5,QUARRY.LIP.z),V(QUARRY.LIP.x+4,QUARRY.LIP.y+2.5,QUARRY.LIP.z-2)]);allyTern.scale.set(1,1,1);allyTern.layers.set(1);scene.add(allyTern);
  allyCrew=SIG.makeAllies([V(122,2.5,92),V(116,2.5,96)]);allyCrew.layers.set(1);scene.add(allyCrew);
  simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[
 ['TERN','green',()=>V(QUARRY.LIP.x,QUARRY.LIP.y+12,QUARRY.LIP.z),t=>(t>=25&&t<34)||(t>=50&&t<63)],
 ['RIFT · STREAMING','red mark',()=>V(R.x,22,R.z),t=>t>=26&&t<34],['MARK','red mark',()=>V(R.x,18,R.z),t=>t>=39.6&&t<44],
 ['ANVIL · 20 S','amber',()=>V(R.x,30,R.z),t=>t>=50&&t<63],['SEALED','green mark',()=>V(R.x,20,R.z),t=>t>=67&&t<80],
 ['STALKER · 100','red',(o,t)=>{const c=SIM.sw&&SIM.sw.list.find(c=>c.rig.id==='stalker');return c?SIM.sw.center(c).add(V(0,8,0)):V(0,-99,0);},t=>t>=80.5&&t<90],
 ['SLATE · CREW','green',()=>V(119,9,94),t=>t>=96&&t<102],
 ['BRUTE','red mark',()=>boss().add(V(0,12,0)),t=>t>=103.2&&t<110],['CORE','red mark',()=>SIM.boss&&!SIM.boss.dead?SIM.boss.corePos.clone().add(V(0,3,0)):V(0,-99,0),t=>t>=133&&t<LANCE]];
FILM.run({id:'m3',DUR,place:'Kessel Cut',pageTitle:'IRMD · Mission 3 · The Dig',clock:[12,20,0],poster:56,
  start:{org:'International Rift Mech Defense · Mission 3',t:'The Dig',sub:'Kessel Cut quarry · 12:20 · 2 min 52<br>Sound on, headphones if you have them'},
  end:{org:'Rift sealed',t:'The Dig',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M3SIM=SIM;window.M3SIMTO=simTo;
})();
