'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 7, THE RIDGE (game/cinematic/film/scene-m7.js, session D)
   3 min on Hollin Ridge, a grey day. TITAN, 50,000 dots, walks up from the coast.
     0:00  the squads check in along the crest: Alder, Birch, Cedar. "Is it true it's fifty thousand?" "It's true."
           "Then we hold."
     0:30  TITAN on the plain; the sensor drops frames just looking at it. Shots only land when OVERWATCH locks.
     1:10  35,000: it comes apart into four tendrils (HULKs, 5,000 each) that go for the squads. Two are destroyed.
     1:52  it pulls itself back together. Thermal. The core, on the lock. The Lance. "The count was wrong."
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=180,DT=1/30,SPLIT=70.5,REFORM=113.5,THERM=115.6,LANCE=140.6;
const lockAt=t=>(t>42&&t<70&&((t-42)%4.2)<1.4)||(t>THERM+1&&t<LANCE&&((t-THERM-1)%3.1)<1.7);
/* ---------------------------------------------------------------- the team on the crest */
const KEYS=[
 [[0,-70,-20,0],[72,-70,-20,0],[80,-140,-32,.3],[108,-140,-32,0],[118,-40,-42,0],[DUR,-40,-42,0]],
 [[0,-25,-24,0],[78,-25,-24,0],[84,0,-32,0],[108,0,-32,0],[118,-10,-50,0],[DUR,-10,-50,0]],
 [[0,25,-24,0],[76,25,-24,0],[86,150,-32,-.2],[108,150,-32,0],[118,25,-48,0],[DUR,25,-48,0]],
 [[0,70,-20,0],[80,70,-20,0],[88,40,-58,0],[108,40,-58,0],[118,55,-44,0],[DUR,55,-44,0]]];
function keyAt(k,t){const ks=KEYS[k];for(let i=0;i<ks.length-1;i++){const [a,ax,az,af]=ks[i],[b,bx,bz,bf]=ks[i+1];if(t<b||i===ks.length-2){const u=ss(a,b,t);return {x:lerp(ax,bx,u),z:lerp(az,bz,u),face:bf};}}}
const MT=[];(function(){for(let k=0;k<4;k++){const tb=[];let d=0,yaw=0,px=null,pz=null;for(let i=0;i<=DUR*20;i++){const t=i/20,p=keyAt(k,t);
    if(px!=null){const dx=p.x-px,dz=p.z-pz,s=Math.hypot(dx,dz);d+=s;const want=s*20>.6?Math.atan2(-dx,-dz):p.face;let a=want-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));yaw+=a*.12;tb.push({x:p.x,z:p.z,d,yaw,spd:s*20});}
    else tb.push({x:p.x,z:p.z,d:0,yaw:p.face,spd:0});px=p.x;pz=p.z;}MT.push(tb);}})();
function mech(k,t){const i=clamp(t*20,0,DUR*20-1),j=Math.floor(i),f=i-j,a=MT[k][j],b=MT[k][j+1]||a;const x=lerp(a.x,b.x,f),z=lerp(a.z,b.z,f);return {x,z,y:RIDGE.h(x,z),yaw:a.yaw+(b.yaw-a.yaw)*f,dist:lerp(a.d,b.d,f),spd:lerp(a.spd,b.spd,f)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- TITAN and its tendrils */
const tpos=t=>t<SPLIT?V(0,0,lerp(-760,-175,ss(0,SPLIT,t))):t<REFORM+4?V(0,0,-175):V(0,0,lerp(-175,-115,ss(REFORM+4,LANCE,t)));
const TD=[{sq:0,off:[-50,10],kill:null},{sq:1,off:[-15,30],kill:95.2},{sq:1,off:[20,30],kill:null},{sq:2,off:[55,10],kill:104.4}];
function tdPos(i,t){const d=TD[i],sq=RIDGE.SQUADS[d.sq];const a=V(d.off[0],0,-175+d.off[1]),b=V(sq.x+(i===2?40:0),0,-26);const go=ss(SPLIT+1,100,t),back=ss(106,REFORM,t);
  const p=a.clone().lerp(b,go*(1-back)+0*back);if(back>0)p.lerp(V(d.off[0]*.3,0,-175),back);p.x+=Math.sin(t*1.3+i*2)*3;return p;}
const DTI=t=>K([[0,50000],[42,50000],[SPLIT-.1,35600]],t);
const DTF=t=>K([[THERM,0],[THERM+1,-1],[LANCE-.1,2200],[LANCE+.2,0]],t);
/* ---------------------------------------------------------------- the sim */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=7070;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:80000,maxDebris:8000});sw.points.layers.set(1);sw.ground=(x,z)=>RIDGE.h(x,z);
  SIM.T=sw.spawn('titan',tpos(0).setY(RIDGE.h(0,-760)),0);SIM.T.prefers='ally';
  Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.cool=[2.2,1.4,.6,1.8];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];SIM.td=null;SIM.split=false;SIM.reformed=false;SIM.reform0=0;FFX.reset();}
function kill(c,n){let k=0;for(const q of c.P){if(k>=n)break;if(q.alive){q.alive=false;k++;}}c.count-=k;c.hp=c.count/c.n0;return k;}
const TG=[];
function simStep(){const t=SIM.t,sw=SIM.sw,Ti=SIM.T;const sv=Math.random;Math.random=srnd;
  TG.length=0;for(let k=0;k<4;k++){const m=mech(k,t);TG.push({pos:V(m.x,m.y,m.z),kind:'mech',notice:120});}
  for(const sq of RIDGE.SQUADS)TG.push({pos:V(sq.x,0,sq.z),kind:'ally',notice:60});
  sw.update(DT,t,TG);
  if(Ti&&!Ti.dead){const p=tpos(t),q=tpos(t+1);Ti.pos.set(p.x,RIDGE.h(p.x,p.z),p.z);Ti.heading=Math.atan2(q.x-p.x,q.z-p.z)||Math.PI;Ti.target=null;
    if(!SIM.split){const d=Math.round((DTI(t)-Ti.count)*.25);if(d<-2)sw.shed(Ti,Math.min(-d,40));}
    if(!SIM.split&&t>=SPLIT){SIM.split=true;kill(Ti,20000);SIM.td=TD.map((d,i)=>{const c=sw.spawn('hulk',tdPos(i,t).setY(RIDGE.h(d.off[0],-175)),0);c.prefers='ally';return c;});SIM.ev.push({t,k:'split',x:0,z:-175});}}
  if(SIM.td)SIM.td.forEach((c,i)=>{if(c.dead)return;const p=tdPos(i,t),q=tdPos(i,t+.5);c.pos.set(p.x,RIDGE.h(p.x,p.z),p.z);c.heading=Math.atan2(q.x-p.x,q.z-p.z)||c.heading;c.target=null;
    const kt=TD[i].kill;if(kt&&t>kt-12&&!c.dead){const want=5000*(1-ss(kt-12,kt,t));const d=Math.round((c.count-want)*.3);if(d>0){const at=c.corePos?c.corePos.clone():sw.center(c);if(t<kt-.05){sw.shed(c,Math.min(d,60));}else{sw.hit(c,at,40,c.count);SIM.ev.push({t,k:'die',x:p.x,z:p.z,id:'hulk'});}}}});
  if(SIM.td&&!SIM.reformed&&t>=REFORM){SIM.reformed=true;let n=0;SIM.td.forEach(c=>{if(!c.dead){n+=c.count;kill(c,c.count);c.dead=true;c.gone=true;}});sw.grow(Ti,n);SIM.ev.push({t,k:'reform',x:0,z:-175});}
  if(SIM.reformed&&!Ti.dead&&!SIM.reform0)SIM.reform0=Ti.count;
  if(t>40&&t<150){const lock=lockAt(t);for(let k=0;k<4;k++){const m=mech(k,t);
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      for(let r=n1;r<n0;r++){const c=SIM.tgt[k];const mz=muzzle(m,(r%2)?1:-1);let at;
        if(c&&!c.dead){const core=c===Ti&&t>THERM+1;at=core?c.corePos.clone().add(V((srnd()-.5)*3,(srnd()-.5)*3,(srnd()-.5)*3)):sw.center(c).add(V((srnd()-.5)*(c===Ti?30:10),(srnd()-.5)*(c===Ti?20:6),(srnd()-.5)*(c===Ti?30:10)));
          if(srnd()<.62&&(c!==Ti||lock)){const before=c.count;let n=1+(srnd()<.35?1:0);
            if(c===Ti&&!SIM.split)n=clamp(Math.round((c.count-DTI(t))*.004),1,40);
            if(core&&SIM.reform0){const want=lerp(SIM.reform0,2200,ss(THERM+1,LANCE,t));n=clamp(Math.round((c.count-want)*.03),1,120);}
            const got=sw.hit(c,at,core?4:2,n);if(got>0)SIM.ev.push({t,k:core?'core':'hit',x:at.x,z:at.z});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}
        else at=mz.clone().add(V(-Math.sin(m.yaw)*80,-8,-Math.cos(m.yaw)*80));
        const gy=RIDGE.h(at.x,at.z);FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,gy,at.z),1.2,at.y-gy<2?12:4);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z)*(c===Ti?(lock?.4:3):1);if(d<bd&&d<700){bd=d;best=c;}}
        if(best&&!(k===1&&t>LANCE-1.4&&t<LANCE+.3)&&(best!==Ti||lock)){SIM.tgt[k]=best;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=1.1+srnd()*.9;}else SIM.cool[k]=.2;}}}}
  if(Ti&&!Ti.dead&&t>=LANCE&&t<LANCE+DT*1.2){const m=mech(1,t);const mz=muzzle(m,1);const at=Ti.corePos.clone();FFX.shot(t,mz,at,3.6);FFX.flash(t,mz,3.2);
    sw.hit(Ti,at,8,Math.ceil(Ti.count/10)+20);SIM.ev.push({t,k:'lance',x:at.x,z:at.z});if(Ti.dead)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:'titan'});}
  if(t>150&&t<150+DT*1.2)for(const c of sw.list)if(!c.dead){sw.hit(c,sw.center(c),60,c.count);}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>20000)break;}}
/* ---------------------------------------------------------------- lines */
const LINES=[
 {id:'M7_01_OW',t:2.0,w:6.9,who:'OVERWATCH',p:.2,tx:'Something huge is walking up from the coast. Alder, Birch and Cedar are dug in on Hollin Ridge.'},
 {id:'M7_02_ALDER',t:10.2,w:3.1,who:'ALDER',p:.25,tx:'Alder, west end. Ready as we’ll be.'},
 {id:'M7_03_BIRCH',t:14.4,w:1.8,who:'BIRCH',p:.25,tx:'Birch, in the middle.'},
 {id:'M7_04_CEDAR',t:17.6,w:4.0,who:'CEDAR',p:.4,tx:'Cedar, east end. Is it true it’s fifty thousand?'},
 {id:'M7_05_OW',t:22.6,w:1.1,who:'OVERWATCH',p:.1,tx:'It’s true.'},
 {id:'M7_06_PILOT',t:25.2,w:1.9,who:'WRAITH',p:0,tx:'Then we hold.'},
 {id:'M7_07_OW',t:30.6,w:4.2,who:'OVERWATCH',p:.45,tx:'Fifty thousand. The sensor drops frames just looking at it.'},
 {id:'M7_08_OW',t:36.4,w:4.3,who:'OVERWATCH',p:.45,tx:'Fire when I lock. Every shot in the static is wasted.'},
 {id:'M7_09_OW',t:63.6,w:4.1,who:'OVERWATCH',p:.55,tx:'It’s coming apart. No. It’s reaching.'},
 {id:'M7_10_OW',t:71.4,w:4.9,who:'OVERWATCH',p:.6,tx:'The count doesn’t match its size. There’s more of it than there are dots.'},
 {id:'M7_11_OW',t:78.0,w:3.8,who:'OVERWATCH',p:.65,tx:'Four of them. Tendrils. They’re going for the squads.'},
 {id:'M7_12_BIRCH',t:86.4,w:2.4,who:'BIRCH',p:.8,tx:'Something’s coming up the slope at us!'},
 {id:'M7_13_OW',t:96.4,w:3.0,who:'OVERWATCH',p:.35,tx:'That one’s gone. It’s not coming back.'},
 {id:'M7_14_OW',t:110.6,w:4.4,who:'OVERWATCH',p:.5,tx:'It’s pulling itself back together. Thermal. Find the core.'},
 {id:'M7_15_OW',t:146.0,w:7.3,who:'OVERWATCH',p:.15,tx:'It’s down. Wraith, I’ve been counting dots my whole life. That was the first time the count was wrong.'},
 {id:'M7_16_OW',t:159.6,w:6.1,who:'OVERWATCH',p:.05,tx:'They’re giving your jets a long hover. Somebody knows what’s next. I wish they’d tell me.'}];
/* ---------------------------------------------------------------- shots */
const tit=()=>SIM.T&&!SIM.T.gone?SIM.sw.center(SIM.T):V(0,20,-175);
const tdc=i=>SIM.td&&SIM.td[i]&&!SIM.td[i].gone?SIM.sw.center(SIM.td[i]):tit();
const SQH=(i,dy)=>{const s=RIDGE.SQUADS[i];return RIDGE.h(s.x,s.z+3)+dy;};
const SHOTS=[
 {t0:0,t1:10,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(-300,70,60),V(-250,62,40),ease(u)),l:vl(V(0,28,-120),V(20,24,-160),u),fov:46,real:1})},
 {t0:10,t1:14.4,name:'ALDER · TRENCH',f:u=>({p:V(-170,SQH(0,3.4),16),l:V(-140,SQH(0,-14),-220),fov:44,real:1})},
 {t0:14.4,t1:17.6,name:'BIRCH · TRENCH',f:u=>({p:V(-8,SQH(1,3.4),19),l:V(20,SQH(1,-14),-220),fov:44,real:1})},
 {t0:17.6,t1:22.6,name:'CEDAR · TRENCH',f:u=>({p:V(182,SQH(2,3.4),14),l:V(140,SQH(2,-14),-220),fov:44,real:1})},
 {t0:22.6,t1:30,name:'WRAITH · OPTICAL',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+9,m.y+8,m.z+16),l:V(m.x-20,m.y-6,m.z-260),fov:lerp(46,40,u),real:1};}},
 {t0:30,t1:42,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3.2,m.y+10,m.z+7),l:tit().add(V(0,20,0)),fov:lerp(24,30,u)};}},
 {t0:42,t1:56,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(0,420,40),V(0,400,10),u),l:V(0,0,-140),fov:56})},
 {t0:56,t1:70,name:'HALE · SENSOR',f:(u,t)=>{const m=mech(3,t);return {p:V(m.x-4,m.y+3.5,m.z+6),l:tit().add(V(0,30,0)),fov:lerp(50,58,u),shake:.04};}},
 {t0:70,t1:80,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+12,m.z+12),l:V(0,RIDGE.h(0,-150)+10,-150),fov:lerp(40,54,ease(u))};}},
 {t0:80,t1:92,name:'BIRCH · TRENCH',f:u=>({p:V(-6,SQH(1,3.6),18),l:tdc(1),fov:lerp(50,42,u)})},
 {t0:92,t1:104.6,name:'VESPER · SENSOR',f:(u,t)=>{const m=mech(2,t);return {p:V(m.x+3,m.y+10,m.z+8),l:t<98?tdc(1):tdc(3),fov:40};}},
 {t0:104.6,t1:116,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(0,420,40),V(0,380,0),u),l:V(0,0,-130),fov:58})},
 {t0:116,t1:130,name:'WRAITH · THERMAL',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+10,m.z+8),l:tit().add(V(0,10,0)),fov:lerp(40,32,u),mode:1,real:.8};}},
 {t0:130,t1:142,name:'WRAITH · THERMAL',f:(u,t)=>{const m=mech(1,t);const c=SIM.T&&!SIM.T.dead?SIM.T.corePos:tit();return {p:V(m.x+2.8,m.y+9.6,m.z+6.6),l:c,fov:lerp(26,18,ease(u)),mode:1,real:.8,shake:t>LANCE&&t<LANCE+1.6?.7*(1-ss(LANCE,LANCE+1.6,t)):0};}},
 {t0:142,t1:158,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+11,m.z+9),l:V(0,RIDGE.h(0,-120)+8,-120),fov:46};}},
 {t0:158,t1:DUR,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(-10,60,40),V(-80,170,200),ease(u)),l:vl(V(0,30,-60),V(0,10,-400),ease(u)),fov:48,real:1})}];
/* ---------------------------------------------------------------- tracks */
const per=(t,vals)=>vals[FILM.shotIndex(t)];
function tracks(t){simTo(t);const o={};const lock=lockAt(t);const near=t>28&&t<LANCE+1;
  o.real=per(t,[1,1,1,1,1,.4,.28,.4,.4,.45,.4,.28,.8,.8,.4,1]);o.mono=per(t,[0,0,0,0,0,.55,1,.55,.55,.5,.55,1,0,0,.55,0]);o.dots=o.real>=1?0:1;o.mode=0;
  o.interf=K([[0,.08],[22,.1],[28,.25],[34,.45],[42,.5],[70,.6],[80,.45],[104,.4],[THERM,.75],[THERM+.5,.45],[LANCE,.45],[LANCE+.2,.9],[LANCE+1.2,.2],[158,.08],[DUR,.05]],t);
  o.clear=lock?ss(0,.12,((t-42)%4.2))*1:0;if(lock)o.clear=.85;if(near&&!lock)o.interf+=.12*Math.max(0,Math.sin(t*7.3));
  o.stut=near&&!lock?(t>THERM?.7:.6):0;if(t>80&&t<104)o.stut*=.6;
  o.wexp=1.06;o.exp=.7;o.flash=t>LANCE&&t<LANCE+.5?.3*(1-ss(LANCE,LANCE+.5,t)):0;o.fade=ss(DUR-1.8,DUR,t)+(1-ss(0,1.6,t));
  o.count=SIM.sw?SIM.sw.dots:0;o.range=t<28?null:(SIM.T&&!SIM.T.dead?(Math.hypot(SIM.T.pos.x,SIM.T.pos.z)/1000).toFixed(1)+' KM':'0.1 KM');
  o.title=t<9?{k:ss(.8,1.8,t)*(1-ss(7,8.6,t)),org:'Mission 7 · 14:05',t:'THE RIDGE',sub:'Hollin Ridge · International Rift Mech Defense'}:
    t>168?{k:ss(168.5,170,t)*(1-ss(177.4,179.4,t)),org:'Board clear',t:'THE RIDGE',sub:'TITAN: 50,000 → 0 · Alder, Birch, Cedar: all holding'}:null;
  o.nohud=t<8.8||t>168;o.gloom=ss(28,60,t)*(1-ss(150,175,t))*.8;o.lock=lock;
  return o;}
let allyTeam=[],allySq=[];
function apply(t,o,cam,px){const sw=SIM.sw;const mv=[0,1,2,3].map(k=>mech(k,t));
  const look=mv.map((m,k)=>{let yaw=0;const c=SIM.tgt[k];if(c&&!c.dead&&t>40&&t<150){const a=Math.atan2(-(c.pos.x-m.x),-(c.pos.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
    return {pitch:t>28&&t<142?.16:-.02,yaw:yaw*.5,torso:yaw*.8,aim:t>36&&t<150?-.32:-.12};});
  if(TEAM.ready)TEAM.pose(t,look,mv);mv.forEach((m,k)=>allyTeam[k].position.set(m.x,m.y-5.5,m.z));
  const ch=[];if(sw)for(const c of sw.list)if(!c.dead&&!c.gone&&ch.length<16)ch.push({x:c.pos.x,z:c.pos.z,r:c.rig.id==='titan'?40:c.rig.id==='hulk'?16:4,k:1});
  RIDGE.update(t,{churn:ch,gloom:o.gloom});
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=(LOOK.HALF?1:2.5)*.7;sw.setThermal(o.mode>.5);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.4;
    else sw.mat.uniforms.uGain.value*=clamp(700/Math.max(1,SIM.T&&!SIM.T.dead?SIM.T.count:900),.02,.3);}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;FFX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  F.RAMP(P.wind,[[0,0],[2,.32],[28,.3],[60,.38],[150,.34],[DUR-3,.3],[DUR,0]],A);
  F.RAMP(P.hum,[[0,0],[26,0],[34,.12],[SPLIT,.2],[SPLIT+.1,.05],[REFORM,.16],[LANCE,.2],[LANCE+.1,0]],A);
  for(let k=0;k<4;k++)for(const [a,b] of [[72+k*2,90],[106,118]])for(let tt=a+.6;tt<b;tt+=.62)S.step(A(tt),[-.6,-.2,.2,.6][k],.5);
  /* TITAN's tread, louder as it comes; the split, the reform */
  for(let tt=28;tt<LANCE;tt+=1.7)S.beat(A(tt),.4+ss(28,70,tt)*.7);
  S.roar(A(SPLIT-.2),4.5);S.moan(A(SPLIT+1),12);S.moan(A(88),10);S.roar(A(REFORM-.4),4);S.hit(A(REFORM),.8);S.wash(A(SPLIT),6);
  /* every lock: two beeps */
  for(let tt=42;tt<70;tt+=4.2)S.lock(A(tt));for(let tt=THERM+1;tt<LANCE;tt+=3.1)S.lock(A(tt));
  const camK=t=>[.4,.5,.5,.5,.9,1,.6,1,1,.7,1,.6,1,1,1,.5][FILM.shotIndex(t)];
  let lastHit=-9;for(const e of EV){const pn=clamp(e.x/200,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x-mech(1,e.t).x)/40,-.8,.8),.5*camK(e.t),6);
    else if(e.k==='hit'||e.k==='core'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,(e.k==='core'?.7:.4)*camK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,e.id==='titan'?1.8:e.id==='hulk'?1.3:.7);}
  S.switchV(A(THERM-.05),1);S.lance(A(LANCE-1.2),.1,1.3,1.2);S.hit(A(LANCE+.05),1.3);S.note(A(LANCE+.3),7);
  /* music: the ridge (strings, slow), the squads, the long fight on the locks, the count that was wrong, the long hover */
  [['D3','A3','F4'],['Bb2','F3','D4'],['C3','G3','E4'],['A2','E3','C#4']].forEach((c,i)=>S.chord(A(.5+i*2.6),3,c,.5,'str'));
  S.chord(A(10),12,['D2','A2','D3'],.4,'pad');[[10.6,'A4'],[14.6,'C5'],[17.8,'D5'],[22.8,'A4'],[25.4,'D4']].forEach(([tt,n])=>S.chord(A(tt),2.6,[n],.6,'pno'));
  F.RAMP(P.str,[[0,0],[28,0],[34,.06],[42,.08],[70,.12],[70.2,0],[104,0],[110,.08],[THERM,.1],[THERM+.2,0]],A);P.strF.setValueAtTime(500,A(28));P.strF.exponentialRampToValueAtTime(1800,A(70));
  S.chord(A(28),14,['D2','A2','D3','F3'],.55,'choir');
  const b1=60/92*4;S.pulse(A(42),28,'D2',92,.75,{snare:true});const pr=[['D3','F3','A3'],['Bb2','D3','F3'],['G2','Bb2','D3'],['A2','C#3','E3']];
  for(let i=0;i<10;i++){const tt=42+i*b1;if(tt>=SPLIT)break;S.chord(A(tt),b1,pr[i%4],.55+i*.02,i%2?'str':'brass');S.taiko(A(tt),.8,i%2?.3:-.3);}
  S.stab(A(SPLIT),.8);S.chord(A(SPLIT),6,['D2','Ab2','D3'],.6,'brass');
  const b2=60/120*4;S.pulse(A(78),27,'D2',120,.8,{snare:true,oct:true});for(let i=0;i<13;i++){const tt=78+i*b2;if(tt>=104)break;S.chord(A(tt),b2,pr[(i+2)%4],.6,i%2?'brass':'str');if(i%2===0)S.taiko(A(tt),.9,0);}
  S.chord(A(95.4),3,['F3','A3','C4'],.7,'brass');S.chord(A(104.6),3,['G3','Bb3','D4'],.7,'brass');
  S.chord(A(106),10,['D2','A2','D3'],.55,'choir');S.riser(A(REFORM-3),3);
  const b3=60/100*4;S.pulse(A(THERM+1),24,'D2',100,.85,{snare:true});for(let i=0;i<10;i++){const tt=THERM+1+i*b3;if(tt>=LANCE-2)break;S.chord(A(tt),b3,pr[i%4],.65,i%2?'str':'brass');S.taiko(A(tt),.9,i%2?.3:-.3);}
  S.riser(A(LANCE-4),3.9);S.chord(A(LANCE+.4),9,['D3','A3','D4','F4','A4'],.85,'choir');S.chord(A(LANCE+.4),9,['D2','A2','D3'],.7,'brass');
  const after=[['Bb2','F3','D4'],['F2','C3','A3'],['C3','G3','E4'],['D3','A3','F4'],['Bb2','F3','D4','F4'],['F2','C3','A3','C4'],['C3','G3','C4','E4'],['F2','C3','F3','A3']];
  after.forEach((c,i)=>S.chord(A(146+i*3.6),4,c,.5+i*.04,'str'));
  [[147,'D5'],[148.8,'C5'],[150.6,'A4'],[152.4,'G4'],[155,'F4'],[157,'A4'],[159.4,'C5'],[161.6,'D5'],[164,'F5'],[166,'E5'],[168.5,'C5']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.8,'pno'));
  S.chord(A(168.5),10,['F2','C3','F3','A3','C4'],.75,'choir');S.sting(A(168.5),.7);}
/* ---------------------------------------------------------------- build */
function build(scene,F){RIDGE.build(scene);FFX.init(scene);for(const o of RIDGE.occ)o.layers.enable(2);
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  RIDGE.SQUADS.forEach(sq=>{const pts=[];for(let i=0;i<6;i++){const x=sq.x-8+i*3.2,z=sq.z+1;pts.push(V(x,RIDGE.h(x,z)+.6,z));}const a=SIG.makeAllies(pts);a.layers.set(1);scene.add(a);allySq.push(a);});
  const body=new T.MeshStandardMaterial({color:0x3a4034,roughness:.9});RIDGE.SQUADS.forEach(sq=>{for(let i=0;i<6;i++){const x=sq.x-8+i*3.2,z=sq.z+1.4;const g=new T.Group();
    const b=new T.Mesh(new T.CapsuleGeometry(.28,.6,4,8),body);b.position.y=.55;g.add(b);const h=new T.Mesh(new T.SphereGeometry(.17,8,6),body);h.position.y=1.15;g.add(h);g.position.set(x,RIDGE.h(x,z),z);scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});}});
  simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[
 ...RIDGE.SQUADS.map((sq,i)=>[sq.n+' · 6','green',()=>V(sq.x,RIDGE.h(sq.x,sq.z)+7,sq.z),t=>(t>=42&&t<56)||(t>=104.6&&t<116)]),
 ['TITAN · 50,000','red mark',()=>tit().add(V(0,40,0)),t=>t>=30.6&&t<36],['LOCK','green mark',()=>tit().add(V(0,10,0)),(t,o)=>o&&o.lock&&t<70&&(t<42||t>=56)],
 ['LOCK','green mark',()=>SIM.T&&!SIM.T.dead?SIM.T.corePos.clone():tit(),(t,o)=>o&&o.lock&&t>THERM],
 ...[0,1,2,3].map(i=>['TENDRIL · 5,000','red',()=>tdc(i).add(V(0,14,0)),t=>t>=78&&t<84])];
FILM.run({id:'m7',DUR,place:'Hollin Ridge',pageTitle:'IRMD · Mission 7 · The Ridge',clock:[14,5,0],poster:60,
  start:{org:'International Rift Mech Defense · Mission 7',t:'The Ridge',sub:'Hollin Ridge · 14:05 · 3 min<br>Sound on, headphones if you have them'},
  end:{org:'TITAN down',t:'The Ridge',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M7SIM=SIM;window.M7SIMTO=simTo;
})();
