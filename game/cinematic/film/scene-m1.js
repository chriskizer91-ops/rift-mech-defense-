'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 1, FIRST LIGHT (game/cinematic/film/scene-m1.js, session D)
   2 min 20 on Greywater Strand at dawn. The first battle of the film, staged with the game's own pieces:
     A's creatures (game/creatures/creatures.js: KNOTs out of the surf, then SKEINs going for the pier) driven by their
     own brains, the four Wraiths walking and firing by script, every round logged so picture and sound agree.
     0:00  the beach in REAL view; the team walks down off the dunes; something churns the sand toward the pier
     0:19  "Switching you to mine." The beach is full of red dots. Weapons free at 0:29.
     0:46  Gull's pier: two boats left. 0:57 the second wave, bigger ones, going for the pier. Boats leave at 1:12 and 1:37.
     1:52  "Board's clear. Breathe." The sun comes through. "Good morning, Wraith." "Morning."
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=140,DT=1/60;
/* ---------------------------------------------------------------- the team: where each Wraith is at time t */
const BASE=[-24,-8,8,24];
function mech(k,t){const t0=7.5+k*.45,u=clamp((t-t0)/12,0,1),d1=48*(1-Math.cos(Math.PI*u))/2,s1=u>0&&u<1?48*Math.PI/24*Math.sin(Math.PI*u):0;
  const v=clamp((t-(64+k*.3))/12,0,1),d2=34*(1-Math.cos(Math.PI*v))/2,s2=v>0&&v<1?34*Math.PI/24*Math.sin(Math.PI*v):0;
  const x=BASE[k]+d2*.95,z=78-d1-d2*.3;const yaw=v>0&&v<1?-1.15*Math.sin(Math.PI*v)*.9:0;
  return {x,z,y:STRAND.h(x,z),yaw,dist:d1+d2,spd:Math.max(s1,s2)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));
  return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- Gull's people and boats */
const PEOPLE=[];for(let i=0;i<10;i++)PEOPLE.push({z0:-112-(i%5)*6.5,board:i<5?0:1,tb:i<5?52+i*3.4:80+(i-5)*3.2});
function person(i,t){const P=PEOPLE[i];const bz=P.board?-146:-150,bx=P.board?80:61;const u=clamp((t-P.tb+8)/8,0,1);
  return {x:70+(i%2?1.2:-1.2)*(1-u)+(bx-70)*ss(.8,1,u),z:lerp(P.z0,bz+2,u),gone:t>P.tb};}
function boatAt(i,t){const tl=i?97:72;const u=clamp((t-tl)/40,0,1),e=u*u;return {x:(i?80:61)+(i?40:-30)*e,z:(i?-146:-150)-520*e,yaw:(i?-.2:.15)*ss(0,.3,u)};}
/* ---------------------------------------------------------------- the sim: creatures, fire, a log of every event */
const SIM={t:0,swarm:null,log:null,ev:[]};
let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
const WAVES=[];
[[12.0,-46],[13.5,-14],[15.2,18],[16.8,-30]].forEach(([t,x],g)=>{for(let j=0;j<3;j++)WAVES.push({t:t+j*.4,id:'knot',x:x+j*5-5,z:-26-j*3});});
for(let j=0;j<16;j++)WAVES.push({t:56+j*.9,id:'knot',x:-40+((j*37)%90),z:-28-(j%3)*4});
for(let j=0;j<6;j++)WAVES.push({t:57.5+j*2.6,id:'skein',x:52+((j*23)%40),z:-55-(j%2)*15,prefers:'ally'});
function simReset(){if(SIM.swarm){FILM.scene.remove(SIM.swarm.points);SIM.swarm.points.geometry.dispose();}
  srs=777;const sv=Math.random;Math.random=srnd;
  SIM.swarm=new RMD.Creatures.Swarm(FILM.scene,{max:4000,maxDebris:3000});SIM.swarm.points.layers.set(1);SIM.swarm.ground=(x,z)=>STRAND.h(x,z);
  Math.random=sv;SIM.t=0;SIM.wi=0;SIM.cool=[2.1,1.2,.4,1.7];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];FFX.reset();}
const TG=[];
function simStep(){const t=SIM.t,sw=SIM.swarm;const sv=Math.random;Math.random=srnd;
  while(SIM.wi<WAVES.length&&WAVES[SIM.wi].t<=t){const w=WAVES[SIM.wi++];const c=sw.spawn(w.id,V(w.x,STRAND.h(w.x,w.z),w.z),Math.PI);if(w.prefers)c.prefers=w.prefers;c.tag=SIM.wi;}
  TG.length=0;for(let k=0;k<4;k++){const m=mech(k,t);TG.push({pos:V(m.x,m.y,m.z),kind:'mech',notice:260});}
  for(let i=0;i<PEOPLE.length;i++){const p=person(i,t);if(!p.gone)TG.push({pos:V(p.x,0,p.z),kind:'ally',notice:400});}
  sw.update(DT,t,TG);
  /* the Wraiths fire from 29.5 s: bursts of six, one round each 0.085 s, at the nearest live creature */
  if(t>29.5&&t<114){for(let k=0;k<4;k++){const m=mech(k,t);
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      if(n1<n0){const c=SIM.tgt[k];const side=(n1%2)?1:-1;const mz=muzzle(m,side);
        let at;if(c&&!c.dead){at=sw.center(c).add(V((srnd()-.5)*2.4,(srnd()-.5)*1.6,(srnd()-.5)*2.4));
          const hitP=srnd()<.62;at.y=Math.max(STRAND.h(at.x,at.z)+.2,at.y);
          if(hitP){const before=c.count;const got=sw.hit(c,at,1.6,1+(srnd()<.35?1:0));if(got>0)SIM.ev.push({t,k:'hit',x:at.x,z:at.z,n:got});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
          else{at.y=STRAND.h(at.x,at.z);}}
        else{at=mz.clone().add(V(-Math.sin(m.yaw)*60,-5,-Math.cos(m.yaw)*60));at.y=STRAND.h(at.x,at.z);}
        const gy=STRAND.h(at.x,at.z);const onGround=at.y-gy<1.2;
        FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,gy,at.z),onGround?1:.6,onGround?12:6);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z);if(d<bd&&d<170){bd=d;best=c;}}
        if(best){SIM.tgt[k]=best;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=1.6+srnd()*1.1;}else SIM.cool[k]=.3;}}}}
  /* the very end of the fight: anything still left at 110 s goes in one last volley */
  if(t>110&&t<110+DT*1.5)for(const c of sw.list)if(!c.dead){const at=sw.center(c);sw.hit(c,at,8,c.count);SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>40000)break;}}
/* ---------------------------------------------------------------- the lines */
const LINES=[
 {id:'M1_01_OW',t:2.0,w:3.6,who:'OVERWATCH',p:.05,tx:'Morning, Wraith. Gull’s loading the last boats off the pier.'},
 {id:'M1_02_OW',t:9.6,w:4.0,who:'OVERWATCH',p:.12,tx:'Something’s coming up the beach. You won’t see them with your eyes.'},
 {id:'M1_03_OW',t:16.4,w:1.4,who:'OVERWATCH',p:.1,tx:'Switching you to mine.'},
 {id:'M1_04_OW',t:21.0,w:5.2,who:'OVERWATCH',p:.12,tx:'There. Red is them. Green is us. Keep the red off the green.'},
 {id:'M1_05_OW',t:37.0,w:4.4,who:'OVERWATCH',p:.2,tx:'See it shrink? Ten dots, ten hits. That’s the whole trick.'},
 {id:'M1_06_GULL',t:46.6,w:4.6,who:'GULL',p:.45,tx:'Gull to whoever’s out there! Two boats left. Buy us three minutes!'},
 {id:'M1_07_OW',t:59.6,w:3.4,who:'OVERWATCH',p:.35,tx:'Bigger ones. Twenties. They’re going for the pier.'},
 {id:'M1_08_GULL',t:95.0,w:2.5,who:'GULL',p:.55,tx:'Last boat’s off! Go, go, go!'},
 {id:'GEN_04_OW',t:113.2,w:3.2,who:'OVERWATCH',p:.05,tx:'Board’s clear. Breathe.'},
 {id:'M1_09_OW',t:120.0,w:3.8,who:'OVERWATCH',p:0,tx:'Gull’s away. Every boat. Good morning, Wraith.'},
 {id:'M1_10_PILOT',t:126.6,w:1.0,who:'WRAITH',p:0,tx:'Morning.'}];
/* ---------------------------------------------------------------- the shots */
const SW=19.0;   /* the switch to the sensor */
let FOC=null;    /* the creature a close shot follows */
const focus=(id,t)=>{const sw=SIM.swarm;if(!sw)return V(0,0,0);let c=sw.list.find(c=>c.tag===id);if(!c||c.gone)c=sw.list.find(c=>!c.dead)||c;return c?sw.center(c):V(0,0,0);};
const SHOTS=[
 {t0:0,t1:8,name:'OVERWATCH · OPTICAL',f:u=>({p:vl(V(150,9,-75),V(128,8,-58),ease(u)),l:vl(V(0,3,40),V(-20,3,45),u),fov:40})},
 {t0:8,t1:15,name:'KESTREL · OPTICAL',f:u=>({p:vl(V(-44,13.5,104),V(-40,12,92),u),l:V(-4,5,30),fov:44,shake:.02})},
 {t0:15,t1:SW,name:'WRAITH · OPTICAL',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+4,m.y+8.2,m.z+9),l:V(m.x-8,-2,m.z-40),fov:42};}},
 {t0:SW,t1:28,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:vl(V(m.x+3.5,m.y+9.6,m.z+7),V(m.x+4,m.y+15,m.z+14),ease(u)),l:vl(V(m.x-6,1,m.z-70),V(m.x+10,0,m.z-60),ease(u)),fov:lerp(40,52,ease(u))};}},
 {t0:28,t1:36.5,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(14,150,42),V(14,140,38),u),l:V(14,0,-2),fov:56})},
 {t0:36.5,t1:46,name:'WRAITH · SENSOR · CLOSE',f:(u,t)=>{const c=focus(5,t);const m=mech(1,t);const d=V(m.x-c.x,0,m.z-c.z).normalize();return {p:c.clone().addScaledVector(d,26).add(V(6,9,0)),l:c,fov:34};}},
 {t0:46,t1:56,name:'GULL · PIER',f:u=>({p:vl(V(86,6.2,-126),V(85,6.4,-123),u),l:V(66,3.6,-150),fov:46,real:1})},
 {t0:56,t1:64,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+2,m.y+14,m.z+16),l:vl(V(m.x+20,0,m.z-50),V(m.x+40,0,m.z-70),u),fov:50};}},
 {t0:64,t1:76,name:'HALE · OPTICAL',f:(u,t)=>{const m=mech(3,t);return {p:V(m.x-14,m.y+7.5,m.z+18),l:V(m.x+18,2.5,m.z-55),fov:44,shake:.03};}},
 {t0:76,t1:88,name:'VESPER · SENSOR',f:u=>({p:vl(V(56,9,-24),V(58,10,-34),u),l:V(72,2,-100),fov:44})},
 {t0:88,t1:100,name:'— — —',cuts:[
   [88.0,()=>({p:V(40,240,-40),l:V(50,0,-80),fov:50})],
   [91.0,t=>{const c=focus(36,t);return {p:c.clone().add(V(-18,10,22)),l:c,fov:32};}],
   [94.0,{p:V(88,5.6,-130),l:V(76,3.6,-148),fov:44,real:1}],
   [97.0,{p:V(30,22,0),l:V(80,0,-170),fov:40}]]},
 {t0:100,t1:112,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:vl(V(m.x-6,m.y+16,m.z+22),V(m.x-4,m.y+20,m.z+30),u),l:V(m.x+15,0,m.z-60),fov:50};}},
 {t0:112,t1:124,name:'WRAITH · OPTICAL',f:(u,t)=>{const m=mech(1,t);return {p:vl(V(m.x+3,m.y+9.7,m.z+7),V(m.x+2.5,m.y+9.9,m.z+6.4),u),l:vl(V(m.x+20,1,m.z-80),V(m.x+70,6,m.z-330),ease(u)),fov:lerp(42,36,u)};}},
 {t0:124,t1:140,name:'OVERWATCH · OPTICAL',f:u=>({p:vl(V(-60,14,70),V(-150,70,150),ease(u)),l:vl(V(20,4,10),V(60,0,-140),ease(u)),fov:lerp(40,46,u)})}];
/* ---------------------------------------------------------------- the tracks */
const per=(t,vals)=>vals[FILM.shotIndex(t)];
function tracks(t){simTo(t);const o={};
  const sens=t>=SW+.25;
  o.real=per(t,[1,1,1,.42,.25,.35,1,.4,1,.42,.4,.42,1,1]);if(t>=88&&t<100)o.real=t>=94&&t<97?1:.4;
  o.mono=sens?per(t,[0,0,0,.55,1,.5,0,.55,0,.5,.6,.55,0,0]):0;if(t>=94&&t<97)o.mono=0;
  o.dots=t<SW?0:t<SW+.35?ss(SW,SW+.35,t):(o.real>=1?0:1);
  o.interf=K([[0,.04],[SW-.3,.05],[SW,.7],[SW+.6,.12],[29,.08],[46,.1],[60,.16],[80,.22],[96,.3],[100,.18],[110,.1],[113,.04],[140,.03]],t);
  if(t>SW&&t<SW+.6)o.interf+=.3*Math.sin((t-SW)*40);
  o.stut=t>SW&&t<SW+.5?.9:t>88&&t<100?.12:0;o.wexp=1.12;o.flash=0;
  o.fade=ss(DUR-1.8,DUR,t)+(1-ss(0,1.8,t));
  o.count=SIM.swarm?SIM.swarm.dots:0;if(t<SW+.3)o.count=0;
  o.range=t<SW?null:'0.2 KM';
  o.title=t<7.5?{k:ss(.8,1.8,t)*(1-ss(5.6,7.2,t)),org:'Mission 1 · 05:42',t:'FIRST LIGHT',sub:'Greywater Strand · International Rift Mech Defense'}:
    t>129.5?{k:ss(130,131.5,t)*(1-ss(137.4,139,t)),org:'Board clear · 0 dots',t:'FIRST LIGHT',sub:'Gull’s boats: 2 of 2 · Squads lost: 0'}:null;
  o.nohud=t<7.4||t>129.5;
  o.sun=ss(112,132,t);
  return o;}
/* ---------------------------------------------------------------- per frame */
let grid=null,allyTeam=[],allyPeople=[],allyBoats=[];
function apply(t,o,cam,px){const sw=SIM.swarm;
  const mv=[0,1,2,3].map(k=>mech(k,t));
  const look=mv.map((m,k)=>{let yaw=0;const c=SIM.tgt[k];if(c&&!c.dead&&t>29&&t<114){const a=Math.atan2(-(c.pos.x-m.x),-(c.pos.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
    return {pitch:t<SW?.05:-.02,yaw:yaw*.5,torso:yaw*.8,aim:t>29&&t<114?-.32:t>SW+2?-.18:0};});
  if(TEAM.ready)TEAM.pose(t,look,mv);
  mv.forEach((m,k)=>allyTeam[k].position.set(m.x,m.y-5.5,m.z));
  PEOPLE.forEach((P,i)=>{const p=person(i,t);const A=allyPeople[i];A.visible=!p.gone;A.position.set(p.x,.35,p.z);
    const G=FOLK[i];if(G){if(!p.gone){G.position.set(p.x,3.45,p.z);G.rotation.y=Math.PI+Math.sin(t*2+i)*.2;G.children[0].position.y=.75+Math.abs(Math.sin(t*7+i))*.06;}
      else{const b=boatAt(P.board,t);G.position.set(b.x+((i%3)-1)*1.1,1.6,b.z+(i%2?1.5:-1.2));}}});
  allyBoats.forEach((A,i)=>{const b=boatAt(i,t);A.position.set(b.x,-6.2,b.z);A.visible=t>PEOPLE[i?9:4].tb;});
  /* the churn: in the real view the only sign of them */
  const ch=[];if(sw){const L=sw.list.filter(c=>!c.dead&&!c.gone).map(c=>({c,d:c.pos.distanceTo(cam.position)})).sort((a,b)=>a.d-b.d).slice(0,24);
    for(const {c} of L)ch.push({x:c.pos.x,z:c.pos.z,r:2.2+c.rig.size*.4*c.scale,k:.8});}
  STRAND.update(t,{churn:ch,sun:o.sun,tide:0,boats:[boatAt(0,t),boatAt(1,t)]});
  if(sw){sw.pxScale(px);sw.mat.uniforms.uSizeMul.value=1.7;sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;
  grid.obj.position.set(mv[1].x,.3,mv[1].z);grid.mat.uniforms.uK.value=o.dots*(o.real>.9?0:.8);grid.mat.uniforms.uT.value=t;
  FFX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params,N=FSFX.N;
  /* run the whole fight once to hear it: every burst, hit and death */
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  F.RAMP(P.wind,[[0,0],[2,.16],[110,.14],[124,.2],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[2,.22],[DUR-2,.25],[DUR,0]],A);
  F.RAMP(P.stat,[[0,0]],A);
  S.surf(A(0),DUR-2,1);S.surf(A(3),DUR-6,.5,.6);
  for(const tt of [3.5,6.2,10.5,14,24.5,48,52,118,123,128,133])S.gull(A(tt),Math.sin(tt)*.7,tt>46&&tt<56?.8:.55);
  S.crowd(A(46),10,1);S.motor(A(70),24,-.2,.7);S.motor(A(95),26,.3,.8);
  /* the team: footsteps down the dunes, servos */
  for(let k=0;k<4;k++){for(let tt=8.2+k*.45;tt<19.2+k*.45;tt+=.62)S.step(A(tt),[-.6,-.2,.2,.6][k],k===1?1:.5);S.servo(A(20+k*.4),[-.6,-.2,.2,.6][k],.6);}
  for(let k=0;k<4;k++)for(let tt=64.6+k*.3;tt<75.5;tt+=.6)S.step(A(tt),[-.6,-.2,.2,.6][k],k===3?.9:.4);
  S.servo(A(29),.1,.9);S.lock(A(29.3));
  /* the switch */
  S.switchV(A(SW-.05),1);S.glitch(A(SW),.5,.7);S.sting(A(SW+.1),.6);
  /* the fight, from the log */
  const camK=t=>{const i=FILM.shotIndex(t);return [1,1,1,1,.6,.9,.35,.9,1,.8,.7,.9,1,.6][i]*(t>=94&&t<97?.5:1);};
  let lastHit=-9;for(const e of EV){const pn=clamp((e.x-20)/90,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x-mech(1,e.t).x)/30,-.8,.8),.55*camK(e.t),6);
    else if(e.k==='hit'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,.4*camK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,.7*camK(e.t));}
  window.M1EVN=EV.length;
  /* the music: dawn, the turn, two fights, the morning */
  const dawn=[['D3','A3','E4','F4'],['Bb2','F3','D4','A4'],['F2','C3','A3','E4'],['C3','G3','E4','G4']];
  dawn.forEach((c,i)=>S.chord(A(1+i*4.5),5,c,.7,'pad'));
  [[2,'A4'],[4.2,'F4'],[6.4,'E4'],[8.6,'D4'],[11,'A4'],[13.2,'C5'],[15.4,'A4']].forEach(([tt,n])=>S.pluck(A(tt),N(n),.7,.2));
  F.RAMP(P.hum,[[0,0],[12,0],[18.8,.12],[19.1,0],[21,.05],[29,.08],[29.6,0]],A);
  F.RAMP(P.str,[[0,0],[13,0],[18.8,.06],[19,0],[21,.04],[29.4,.07],[30,0]],A);
  S.chord(A(SW+.2),9,['D2','A2','D3','F3'],.8,'choir');
  /* fight one: 112 bpm, D */
  const b1=60/112*4;S.pulse(A(29.5),26.8,'D2',112,.75);
  [['D3','F3','A3'],['Bb2','D3','F3'],['C3','E3','G3'],['A2','C#3','E3']].forEach((c,i)=>{for(let r=0;r<2;r++){const tt=29.5+(i*2+r)*b1;if(tt<56)S.chord(A(tt),b1,c,.55,'brass');}});
  S.taiko(A(29.5),.9,0);S.riser(A(52.6),3.5);S.hit(A(56.2),.6);
  /* fight two: 120 bpm, darker, the snare comes in */
  const b2=60/120*4;S.pulse(A(60),37,'D2',120,.8,{snare:false});S.pulse(A(80),17,'D2',120,.85,{snare:true,oct:true});
  const prog=[['D3','F3','A3','C4'],['Bb2','D3','F3','A3'],['G2','Bb2','D3','F3'],['A2','C#3','E3','G3']];
  for(let i=0;i<18;i++){const tt=60+i*b2;if(tt>=97)break;S.chord(A(tt),b2,prog[i%4],.6+(tt>80?.15:0),i%2?'str':'brass');}
  for(let i=0;i<8;i++)S.taiko(A(80+i*b2),.7+i*.03,(i%2?.3:-.3));
  S.riser(A(93.6),3.4);S.stab(A(97),.7);S.chord(A(97),4,['F3','A3','C4','F4'],.8,'brass');
  S.pulse(A(98.8),11.5,'D2',120,.7,{snare:true});[['D3','F3','A3'],['Bb2','D3','F3'],['C3','E3','G3']].forEach((c,i)=>S.chord(A(99+i*4),4,c,.6,'brass'));
  S.hit(A(110.1),.7);S.note(A(110.3),4);
  /* the morning: warm strings, a piano line, the sun */
  const morn=[['F2','C3','A3','F4'],['C3','G3','E4','G4'],['D3','A3','F4','A4'],['Bb2','F3','D4','F4'],['F2','C3','A3','C5'],['C3','G3','E4','G4'],['Bb2','F3','D4','F4'],['F2','C3','A3','F4']];
  morn.forEach((c,i)=>S.chord(A(112.6+i*3.4),3.8,c,.55+i*.04,'str'));
  [[115,'C5'],[116.7,'A4'],[118.4,'G4'],[120.1,'F4'],[121.8,'E4'],[123.5,'F4'],[125.2,'A4'],[127,'C5'],[128.7,'D5'],[130.4,'C5'],[132,'A4']].forEach(([tt,n])=>S.chord(A(tt),2.2,[n],.9,'pno'));
  S.chord(A(130),9,['F2','C3','F3','A3','C4'],.7,'choir');S.sting(A(130),.5);}
/* ---------------------------------------------------------------- build */
let FOLK=[];
function folk(scene){const body=new T.MeshStandardMaterial({color:0x3b4048,roughness:.9}),coat=new T.MeshStandardMaterial({color:0xb87a2a,roughness:.8});
  FOLK=PEOPLE.map((P,i)=>{const g=new T.Group();const b=new T.Mesh(new T.CapsuleGeometry(.28,.9,4,8),i%3?body:coat);b.position.y=.75;g.add(b);
    const h=new T.Mesh(new T.SphereGeometry(.17,8,6),body);h.position.y=1.55;g.add(h);scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});return g;});}
function build(scene,F){STRAND.build(scene);folk(scene);FFX.init(scene);for(const o of STRAND.occ)o.layers.enable(2);
  grid=LOOK.grid(160);grid.obj.layers.set(1);scene.add(grid.obj);
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  allyPeople=PEOPLE.map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.scale.set(.35,.35,.35);a.layers.set(1);scene.add(a);return a;});
  allyBoats=[0,1].map(()=>{const a=SIG.makeAllies([V(0,5.5,0),V(1.5,5.5,1),V(-1.2,5.5,-1.4)]);a.layers.set(1);scene.add(a);return a;});
  simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[
 ['GULL · 2 BOATS','green',()=>V(70,9,-148),t=>(t>=19.5&&t<36.5)||(t>=56&&t<64)],
 ...['KESTREL','WRAITH','VESPER','HALE'].map((n,k)=>[n,'',(o,t)=>{const m=mech(k,t);return V(m.x,m.y+14,m.z);},t=>(t>=8&&t<15)||(t>=28&&t<36.5)]),
 ['CONTACTS · 12','red',()=>V(-14,4,-20),t=>t>=21.5&&t<28],
 ['PIER','red mark',()=>V(70,6,-70),t=>t>=60&&t<64]];
FILM.run({id:'m1',DUR,place:'Greywater Strand',pageTitle:'IRMD · Mission 1 · First Light',clock:[5,42,0],poster:24,
  start:{org:'International Rift Mech Defense · Mission 1',t:'First Light',sub:'Greywater Strand · 05:42 · 2 min 20<br>Sound on, headphones if you have them'},
  end:{org:'Board clear',t:'First Light',sub:'Returning to the game…'},
  LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M1SIM=SIM;window.M1SIMTO=simTo;
})();
