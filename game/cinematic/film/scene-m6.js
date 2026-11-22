'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 6, THE SHELF (game/cinematic/film/scene-m6.js, session D)
   3 min on the Drowned Shelf, before dawn. Eight minutes before the tide turns.
     0:00  the shelf bare, three rifts glowing in the open sand; Bramble's survey truck on the flats.
     0:19  "A thousand. Slow. Wide. Hit it with the Arc." The Arc's first test: blue bolts through the crowd.
     0:41  everything at once, streams from rifts A and B; ANVIL's shells close both.
     1:20  the lull. "Wraith. Do you think they built me for this?" "Maybe. I'm glad they did." "...Thank you. Water's coming."
     1:46  HULK (5,000) rises out of rift C as the tide comes in: wade, then hover. Seal C under the water. The core.
     2:33  dawn, the sea back over the shelf. A drone is coming. "That was a joke."
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=184,DT=1/60,RA=SHELF.RIFTS;
const SHOT1=57.6,LAND1=77.6,SHOT2=128.4,LAND2=140.4,CORE=141.4,KILL=150.4;
const TIDE=t=>K([[0,-3],[96,-3],[118,-.6],[150,1.0],[DUR,1.8]],t);
/* ---------------------------------------------------------------- the team */
const KEYS=[
 [[0,-60,-10,0],[20,-60,-10,0],[32,-90,-90,0],[56,-110,-130,0],[80,-110,-130,0],[106,-60,-170,0],[150,-60,-170,0],[162,-40,-60,3.1],[DUR,-40,-40,3.1]],
 [[0,-20,-14,0],[20,-20,-14,0],[34,-20,-110,0],[56,-10,-150,0],[86,-10,-150,.9],[100,0,-160,0],[150,0,-170,0],[164,0,-60,3.1],[DUR,0,-40,3.1]],
 [[0,20,-14,0],[20,20,-14,0],[34,60,-110,0],[56,100,-170,0],[80,100,-170,0],[106,50,-175,0],[150,50,-175,0],[164,40,-60,3.1],[DUR,40,-40,3.1]],
 [[0,60,-10,0],[20,60,-10,0],[32,110,-90,0],[56,130,-150,0],[80,130,-150,0],[106,90,-165,0],[150,90,-165,0],[162,80,-50,3.1],[DUR,80,-40,3.1]]];
function keyAt(k,t){const ks=KEYS[k];for(let i=0;i<ks.length-1;i++){const [a,ax,az,af]=ks[i],[b,bx,bz,bf]=ks[i+1];if(t<b||i===ks.length-2){const u=ss(a,b,t);return {x:lerp(ax,bx,u),z:lerp(az,bz,u),face:bf};}}}
const hov=(x,z,t)=>ss(2.2,3.4,TIDE(t)-SHELF.h(x,z));
const MT=[];
function buildMT(){for(let k=0;k<4;k++){const tb=[];let d=0,yaw=0,px=null,pz=null;for(let i=0;i<=DUR*20;i++){const t=i/20,p=keyAt(k,t);
    if(px!=null){const dx=p.x-px,dz=p.z-pz,s=Math.hypot(dx,dz);const h=hov(p.x,p.z,t);d+=s*(1-h);const want=s*20>.6?Math.atan2(-dx,-dz):p.face;let a=want-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));yaw+=a*.12;tb.push({x:p.x,z:p.z,d,yaw,spd:s*20*(1-h),h});}
    else tb.push({x:p.x,z:p.z,d:0,yaw:p.face,spd:0,h:0});px=p.x;pz=p.z;}MT.push(tb);}}
function mech(k,t){const i=clamp(t*20,0,DUR*20-1),j=Math.floor(i),f=i-j,a=MT[k][j],b=MT[k][j+1]||a;const x=lerp(a.x,b.x,f),z=lerp(a.z,b.z,f),h=lerp(a.h,b.h,f);
  const gy=SHELF.h(x,z);return {x,z,y:lerp(gy,TIDE(t)+2.2+Math.sin(t*3+k)*.2,h),gy,hov:h,yaw:a.yaw+(b.yaw-a.yaw)*f,dist:lerp(a.d,b.d,f),spd:lerp(a.spd,b.spd,f)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- the sim */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
const SP=[];const W1=[['knot',30],['skein',10],['runner',6],['drag',2]];let j=0;for(const [id,n] of W1)for(let i=0;i<n;i++,j++)SP.push({t:15+(j*.29)%14,id,x:-220+((j*67)%440),z:-360-((j*41)%120)});
for(let i=0;i<4;i++)SP.push({t:40+i*2.5,id:'stalker',x:-160+i*110,z:-330});
for(let t=41;t<LAND1;t+=1.3){SP.push({t,id:t%2.6<1.3?'knot':'skein',x:RA[0].x+(t*7%9)-4,z:RA[0].z},{t:t+.6,id:'knot',x:RA[1].x+(t*5%9)-4,z:RA[1].z});}
SP.push({t:106,id:'hulk',x:RA[2].x,z:RA[2].z,boss:1});for(let i=0;i<5;i++)SP.push({t:108+i*1.1,id:'runner',x:RA[2].x-40+i*20,z:RA[2].z+10});SP.push({t:111,id:'stalker',x:RA[2].x-30,z:RA[2].z},{t:113,id:'stalker',x:RA[2].x+30,z:RA[2].z});
SP.sort((a,b)=>a.t-b.t);
const DH=t=>K([[106,5000],[LAND2,4300],[KILL-.2,300],[KILL,0]],t);
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=6060;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:12000,maxDebris:5000});sw.points.layers.set(1);sw.ground=(x,z)=>SHELF.h(x,z);
  Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.si=0;SIM.cool=[2.2,1.4,.6,1.8];SIM.arc=[0,1.2,.6,0];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];SIM.H=null;FFX.reset();}
const TG=[];let arcSeed=1;
function simStep(){const t=SIM.t,sw=SIM.sw;const sv=Math.random;Math.random=srnd;
  while(SIM.si<SP.length&&SP[SIM.si].t<=t){const w=SP[SIM.si++];const c=sw.spawn(w.id,V(w.x,SHELF.h(w.x,w.z),w.z),0);if(w.boss)SIM.H=c;}
  TG.length=0;for(let k=0;k<4;k++){const m=mech(k,t);TG.push({pos:V(m.x,m.gy,m.z),kind:'mech',notice:300});}TG.push({pos:V(SHELF.SURVEY.x,0,SHELF.SURVEY.z),kind:'ally',notice:150});
  sw.update(DT,t,TG);
  const H=SIM.H;if(H&&!H.dead&&t<CORE){const d=Math.round((H.count-DH(t))*.2);if(d>0)sw.shed(H,Math.min(d,20));else if(d<-2)sw.grow(H,Math.min(-d,10));}
  if(t>22&&t<KILL){for(let k=0;k<4;k++){const m=mech(k,t);
    /* the Arc (WRAITH and VESPER): a bolt into the thickest crowd, jumping to two more */
    if((k===1||k===2)&&t<CORE){SIM.arc[k]-=DT;if(SIM.arc[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z)*(c.rig.id==='drag'?.4:c===H?2:1);if(d<bd&&d<200){bd=d;best=c;}}
      if(best){const mz=muzzle(m,1);let from=mz,c=best;const hit=[];for(let h=0;h<4&&c;h++){const at=sw.center(c);FFX.arc(t,from,at,++arcSeed*7919);sw.hit(c,at,5,c.rig.id==='drag'?90:c===H?6:16);hit.push(c);from=at;
          let nx=null,nd=30;for(const q of sw.list){if(q.dead||hit.includes(q))continue;const d=q.pos.distanceTo(c.pos);if(d<nd){nd=d;nx=q;}}c=nx;}
        FFX.flash(t,mz,2);SIM.ev.push({t,k:'arc',x:m.x,z:m.z});SIM.arc[k]=1.7+srnd()*.9;}else SIM.arc[k]=.3;}}
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      if(n1<n0){const c=SIM.tgt[k];const mz=muzzle(m,(n1%2)?1:-1);let at;
        if(c&&!c.dead){const core=c===H&&t>CORE&&c.core;at=core?c.corePos.clone().add(V((srnd()-.5)*2,(srnd()-.5)*2,(srnd()-.5)*2)):sw.center(c).add(V((srnd()-.5)*3,(srnd()-.5)*2,(srnd()-.5)*3));
          if(srnd()<.6){const before=c.count;let n=1+(srnd()<.35?1:0);if(core)n=clamp(Math.round((c.count-DH(t))*.02),1,40);const got=sw.hit(c,at,core?3:1.6,n);
            if(got>0)SIM.ev.push({t,k:core?'core':'hit',x:at.x,z:at.z});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}
        else at=mz.clone().add(V(-Math.sin(m.yaw)*60,-5,-Math.cos(m.yaw)*60));
        const wy=Math.max(SHELF.h(at.x,at.z),TIDE(t));FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,wy,at.z),1.1,10);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z)*(c===H&&t>CORE?.3:1);if(d<bd&&d<240){bd=d;best=c;}}
        if(best){SIM.tgt[k]=best;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=1.4+srnd()*1.1;}else SIM.cool[k]=.3;}}}}
  /* 1:19: all four arc whatever is left, so the lull is quiet */
  if(t>79&&t<80.4&&Math.floor(t*5)!==Math.floor((t-DT)*5)){for(let k=0;k<4;k++){const m=mech(k,t);let c=null,bd=1e9;for(const q of sw.list){if(q.dead||q.gone||q===H)continue;const d=q.pos.distanceTo(V(m.x,m.gy,m.z));if(d<bd){bd=d;c=q;}}
      if(c){const at=sw.center(c);FFX.arc(t,muzzle(m,1),at,++arcSeed*7919);FFX.flash(t,muzzle(m,1),2);sw.hit(c,at,6,c.count);SIM.ev.push({t,k:'arc',x:m.x,z:m.z},{t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}}
  if(t>80.4&&t<80.4+DT*1.2)for(const c of sw.list)if(!c.dead&&c!==H)sw.hit(c,sw.center(c),8,c.count);
  for(const [tl,r] of [[LAND1,0],[LAND1+.6,1],[LAND1+1.1,0],[LAND1+1.5,1]])if(t>=tl&&t<tl+DT*1.2)sw.blast(V(RA[r].x,0,RA[r].z),28,400);
  if(H&&!H.dead&&t>=KILL&&t<KILL+DT*1.2){sw.hit(H,H.corePos.clone(),90,H.count+10);SIM.ev.push({t,k:'die',x:H.pos.x,z:H.pos.z,id:'hulk'});}
  if(t>KILL+.5&&t<KILL+.5+DT*1.2)for(const c of sw.list)if(!c.dead){const at=sw.center(c);sw.hit(c,at,10,c.count);SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>40000)break;}}
/* ---------------------------------------------------------------- lines */
const LINES=[
 {id:'M6_01_OW',t:2.0,w:5.3,who:'OVERWATCH',p:.15,tx:'The sea pulled back off the shelf before dawn. Three rifts, out in the open.'},
 {id:'M6_02_BRAMBLE',t:10.6,w:6.4,who:'BRAMBLE',p:.2,tx:'Bramble, survey. The tide turns in eight minutes. Then all of this is underwater again.'},
 {id:'M6_03_OW',t:19.0,w:4.6,who:'OVERWATCH',p:.3,tx:'A thousand. Slow. Wide. Hit it with the Arc.'},
 {id:'M6_04_OW',t:41.6,w:5.9,who:'OVERWATCH',p:.45,tx:'Everything, all at once. You’ve seen all of this before. Just not together.'},
 {id:'M6_05_ANVIL',t:52.6,w:4.0,who:'ANVIL',p:.2,tx:'Two holes left. I’ve got the shells if you’ve got the marks.'},
 {id:'PING_03_PILOT',t:57.0,w:.6,who:'WRAITH',p:.2,tx:'On it.'},
 {id:'M6_06_OW',t:84.0,w:3.4,who:'OVERWATCH',p:0,tx:'Wraith. Do you think they built me for this?'},
 {id:'M6_07_OW',t:89.6,w:3.4,who:'OVERWATCH',p:0,tx:'Not traffic. Not weather. This.'},
 {id:'M6_08_PILOT',t:95.4,w:2.9,who:'WRAITH',p:0,tx:'Maybe. I’m glad they did.'},
 {id:'M6_09_OW',t:101.0,w:2.2,who:'OVERWATCH',p:.05,tx:'…Thank you. Water’s coming.'},
 {id:'M6_10_OW',t:107.2,w:3.4,who:'OVERWATCH',p:.4,tx:'Five thousand. It’s rising out of rift C.'},
 {id:'M6_11_BRAMBLE',t:118.6,w:3.6,who:'BRAMBLE',p:.5,tx:'Tide’s in. Water’s at our knees and climbing.'},
 {id:'M6_12_OW',t:125.0,w:3.0,who:'OVERWATCH',p:.35,tx:'Seal C under it. Then the core.'},
 {id:'M6_13_OW',t:153.0,w:4.5,who:'OVERWATCH',p:.1,tx:'Shelf’s clear. Three rifts closed. The sea can have it back.'},
 {id:'M6_14_OW',t:163.0,w:7.2,who:'OVERWATCH',p:0,tx:'You’re getting a drone. It fixes things. I asked if it could fix me. That was a joke.'}];
/* ---------------------------------------------------------------- shots */
const hulk=()=>SIM.H&&!SIM.H.gone?SIM.sw.center(SIM.H):V(RA[2].x,6,RA[2].z);
const SV=SHELF.SURVEY;
const SHOTS=[
 {t0:0,t1:10,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(-260,90,60),V(-200,70,20),ease(u)),l:vl(V(0,-2,-260),V(10,-2,-280),u),fov:48,real:1})},
 {t0:10,t1:18.6,name:'BRAMBLE · SURVEY',f:u=>({p:vl(V(SV.x+3,SHELF.h(SV.x,SV.z)+2.4,SV.z+12),V(SV.x+2.5,SHELF.h(SV.x,SV.z)+2.5,SV.z+11),u),l:V(-20,2,-80),fov:50,real:1})},
 {t0:18.6,t1:30,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+11,m.z+9),l:vl(V(0,0,-360),V(-20,0,-250),u),fov:lerp(28,38,u)};}},
 {t0:30,t1:41.6,name:'VESPER · OPTICAL',f:(u,t)=>{const m=mech(2,t);return {p:V(m.x+10,m.y+7,m.z+16),l:V(m.x-10,0,m.z-120),fov:48,real:1};}},
 {t0:41.6,t1:52.6,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(0,420,-120),V(0,400,-140),u),l:V(0,0,-240),fov:60})},
 {t0:52.6,t1:64,name:'KESTREL · SENSOR',f:(u,t)=>{const m=mech(0,t);return {p:V(m.x+3,m.y+10,m.z+8),l:V(RA[0].x,2,RA[0].z),fov:lerp(34,28,u)};}},
 {t0:64,t1:80,name:'— — —',cuts:[[64,t=>{const m=mech(3,t);return {p:V(m.x+3,m.y+10,m.z+8),l:V(RA[1].x,2,RA[1].z),fov:36};}],[70,{p:V(0,400,-140),l:V(0,0,-230),fov:60}],
   [76.4,t=>{const m=mech(1,t);return {p:V(m.x+4,m.y+9.6,m.z+8),l:V(RA[0].x*.5+RA[1].x*.5,4,-220),fov:56,real:1,shake:t>LAND1&&t<LAND1+3?.4*(1-ss(LAND1,LAND1+3,t)):0};}]]},
 {t0:80,t1:106,name:'WRAITH · OPTICAL',cuts:[[80,t=>{const m=mech(1,t);return {p:V(m.x-18,m.y+6,m.z+10),l:V(m.x+40,m.y+5,m.z-20),fov:40,real:1};}],
   [92,t=>{const m=mech(1,t);const gx=m.x+12,gz=m.z-30;return {p:V(gx,Math.max(TIDE(t),SHELF.h(gx,gz))+1.5,gz),l:V(m.x,m.y+5,m.z),fov:44,real:1};}],[100,t=>{const m=mech(1,t);return {p:V(m.x+4,m.y+9,m.z+7),l:V(400,10,-300),fov:44,real:1};}]]},
 {t0:106,t1:118.6,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+10.5,m.z+8),l:hulk().add(V(0,4,0)),fov:lerp(22,28,u)};}},
 {t0:118.6,t1:128.4,name:'BRAMBLE · SURVEY',f:(u,t)=>({p:V(SV.x+2,Math.max(TIDE(t),SHELF.h(SV.x,SV.z))+1.7,SV.z+10),l:V(SV.x-6,-1,SV.z-40),fov:52,real:1,shake:.04})},
 {t0:128.4,t1:141.4,name:'KESTREL · SENSOR',f:(u,t)=>{const m=mech(0,t);return {p:V(m.x-6,m.y+8,m.z+12),l:hulk(),fov:46,shake:t>LAND2&&t<LAND2+2?.4:0};}},
 {t0:141.4,t1:152,name:'WRAITH · THERMAL',f:(u,t)=>{const m=mech(1,t);const c=SIM.H&&!SIM.H.dead&&SIM.H.core?SIM.H.corePos:hulk();return {p:V(m.x+3,m.y+9.8,m.z+7),l:c,fov:lerp(30,22,ease(u)),mode:1,real:.8,shake:t>KILL&&t<KILL+1.5?.6*(1-ss(KILL,KILL+1.5,t)):0};}},
 {t0:152,t1:DUR,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(60,40,-120),V(140,130,40),ease(u)),l:vl(V(0,2,-110),V(-40,0,-260),ease(u)),fov:50,real:1})}];
/* ---------------------------------------------------------------- tracks */
const per=(t,vals)=>vals[FILM.shotIndex(t)];
function tracks(t){simTo(t);const o={};
  o.real=per(t,[1,1,.4,1,.28,.42,.42,1,.42,1,.42,.8,1]);o.mono=per(t,[0,0,.55,0,1,.55,.55,0,.55,0,.55,0,0]);
  if(t>=64&&t<80){o.real=t<70?.42:t<76.4?.28:1;o.mono=t<70?.55:t<76.4?1:0;}
  o.dots=o.real>=1?0:1;o.mode=0;
  o.interf=K([[0,.06],[18,.1],[30,.15],[41,.25],[64,.25],[LAND1,.3],[LAND1+.3,.6],[LAND1+1.5,.15],[80,.06],[106,.15],[118,.2],[128,.3],[CORE,.3],[CORE+.3,.6],[CORE+.8,.3],[KILL,.35],[KILL+.2,.8],[KILL+1.2,.15],[152,.06],[DUR,.04]],t);
  o.stut=(t>CORE&&t<CORE+.5)?.8:(t>KILL&&t<KILL+.8)?.6:(t>LAND1&&t<LAND1+1)?.4:0;o.wexp=1.08;o.exp=.74;o.flash=t>KILL&&t<KILL+.5?.25*(1-ss(KILL,KILL+.5,t)):0;
  o.fade=ss(DUR-1.8,DUR,t)+(1-ss(0,1.6,t));o.count=SIM.sw?SIM.sw.dots:0;o.range=t<10?null:'0.3 KM';
  o.title=t<8.5?{k:ss(.8,1.8,t)*(1-ss(6.6,8.2,t)),org:'Mission 6 · 05:10',t:'THE SHELF',sub:'The Drowned Shelf · International Rift Mech Defense'}:
    t>173?{k:ss(173.5,175,t)*(1-ss(181.6,183.4,t)),org:'Board clear · 3 rifts sealed',t:'THE SHELF',sub:'HULK: 5,000 → 0 · Bramble: all five'}:null;
  o.nohud=t<8.4||t>173;
  o.tide=TIDE(t);o.dawn=ss(40,170,t);o.rifts=[1-ss(LAND1,LAND1+1.5,t),1-ss(LAND1+.6,LAND1+2,t),1-ss(LAND2,LAND2+1.5,t)];
  return o;}
let allyTeam=[],allyB=null,FOLK=[],jets=[];
function apply(t,o,cam,px){const sw=SIM.sw;const mv=[0,1,2,3].map(k=>mech(k,t));const H=SIM.H;
  const look=mv.map((m,k)=>{let yaw=0;const c=SIM.tgt[k];if(c&&!c.dead&&t>22&&t<KILL){const a=Math.atan2(-(c.pos.x-m.x),-(c.pos.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
    return {pitch:-.02,yaw:yaw*.5,torso:yaw*.8,aim:(t>22&&t<80)||(t>106&&t<KILL)?-.32:-.08};});
  if(TEAM.ready)TEAM.pose(t,look,mv);mv.forEach((m,k)=>{allyTeam[k].position.set(m.x,m.y-5.5,m.z);const J=jets[k];const on=m.hov>.05;
    J.forEach((s,i)=>{s.visible=on;s.position.set(m.x+(i?1.4:-1.4),m.y+.4,m.z+.6);s.scale.setScalar(3.4*m.hov*(.85+.15*Math.sin(t*40+i)));s.material.opacity=m.hov;});});
  FOLK.forEach((G,i)=>{const x=SV.x-6+i*2.2,z=SV.z-4+(i%2);G.position.set(x,SHELF.h(x,z),z);G.rotation.y=Math.PI+Math.sin(t*.7+i)*.4;});
  const ch=[];mv.forEach(m=>ch.push({x:m.x,z:m.z,r:m.hov>.3?9:3,k:m.hov>.3?1.4:.6}));if(sw)for(const c of sw.list)if(!c.dead&&!c.gone&&ch.length<16)ch.push({x:c.pos.x,z:c.pos.z,r:c===H?14:3,k:c===H?1:.5});
  SHELF.update(t,{tide:o.tide,dawn:o.dawn,rifts:o.rifts,churn:ch});
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(o.mode>.5);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.6;else sw.mat.uniforms.uGain.value*=1.0;}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;FFX.update(t,cam,px);FX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  F.RAMP(P.wind,[[0,0],[2,.16],[DUR-3,.18],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[2,.06],[96,.06],[120,.2],[150,.3],[DUR-3,.28],[DUR,0]],A);
  F.RAMP(P.hum,[[0,0],[2,.06],[LAND1,.1],[LAND1+.2,.04],[106,.08],[LAND2,.14],[LAND2+.2,0]],A);
  S.surf(A(118),DUR-120,.5);for(const tt of [86,93,99,104])S.gull(A(tt),Math.sin(tt)*.6,.4);
  for(let k=0;k<4;k++){let lastD=0;for(let tt=0;tt<DUR;tt+=.05){const m=mech(k,tt);if(Math.floor(m.dist/3.4)!==Math.floor(lastD/3.4)){const deep=TIDE(tt)-m.gy;if(deep>.3)S.fizz(A(tt),[-.6,-.2,.2,.6][k],(k===1?.7:.4));else S.step(A(tt),[-.6,-.2,.2,.6][k],k===1?.8:.4);}lastD=m.dist;}
    let on=false;for(let tt=0;tt<DUR;tt+=.1){const h=mech(k,tt).hov;if(!on&&h>.1){on=true;S.riser(A(tt),1.2);S.wash(A(tt),3);}if(on&&h<.1)on=false;}}
  [0,1,2,3].forEach(i=>{S.boom(A(SHOT1+i*.5),-.9,.5);S.whistle(A(LAND1-2.6+[0,.6,1.1,1.5][i]),2.6,.1,.8);S.blast(A(LAND1+[0,.6,1.1,1.5][i]),i%2?.4:-.4,1);});S.riser(A(LAND1-3.4),3.3);S.hit(A(LAND1),.8);
  [0,1,2].forEach(i=>{S.boom(A(SHOT2+i*.5),-.9,.5);S.whistle(A(LAND2-2.6+i*.5),2.6,.1,.8);S.blast(A(LAND2+i*.5),.1,1.1);});S.wash(A(LAND2+.4),5);
  S.moan(A(106.4),10);S.roar(A(107),3.5);S.switchV(A(CORE-.05),1);S.lance(A(KILL-1.2),.1,1.2,1.2);S.hit(A(KILL+.05),1.1);S.note(A(KILL+.3),6);
  const camK=t=>[.3,.4,1,1,.6,1,.9,.4,1,.4,1,1,.4][FILM.shotIndex(t)];
  let lastHit=-9;for(const e of EV){const pn=clamp(e.x/200,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x-mech(1,e.t).x)/40,-.8,.8),.5*camK(e.t),6);
    else if(e.k==='arc')S.zap(A(e.t),clamp((e.x-mech(1,e.t).x)/40,-.8,.8),.9*camK(e.t));
    else if(e.k==='hit'||e.k==='core'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,(e.k==='core'?.7:.35)*camK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,e.id==='hulk'?1.5:e.id==='drag'?1.1:.6*camK(e.t));}
  /* music: dark flats (E minor), the Arc's fight, everything at once, the lull (piano alone), the tide and HULK, dawn */
  S.chord(A(.5),9,['E2','B2','G3'],.45,'pad');[[1.6,'B4'],[3.8,'G4'],[6,'F#4'],[8.2,'E4']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.5,'pno'));S.chord(A(10.6),8,['C2','G2','E3'],.4,'str');
  const b1=60/110*4;S.pulse(A(19),22,'E2',110,.7);[['E3','G3','B3'],['C3','E3','G3'],['D3','F#3','A3'],['B2','D#3','F#3']].forEach((c,i)=>{for(let r=0;r<2;r++){const tt=19+(i*2+r)*b1;if(tt<41)S.chord(A(tt),b1,c,.55,r?'str':'brass');}});
  S.pulse(A(41.6),36,'E2',120,.85,{snare:true,oct:true});for(let i=0;i<18;i++){const tt=41.6+i*2;if(tt>=LAND1)break;S.chord(A(tt),2,[['E3','G3','B3'],['C3','E3','G3'],['A2','C3','E3'],['B2','D#3','F#3']][i%4],.6,i%2?'brass':'str');if(i%2===0)S.taiko(A(tt),.8,0);}
  S.riser(A(LAND1-3.4),3.3);S.chord(A(LAND1+.3),4,['G2','D3','B3'],.6,'brass');
  [[82,['G2','D3','B3']],[86,['E2','B2','G3']],[90,['C3','G3','E4']],[94,['D3','A3','F#4']],[98,['G2','D3','B3','D4']],[102,['C3','G3','C4','E4']]].forEach(([tt,c])=>S.chord(A(tt),4.4,c,.4,'str'));
  [[82.6,'B4'],[84.6,'D5'],[86.6,'B4'],[88.6,'A4'],[90.6,'G4'],[92.6,'E4'],[95.4,'G4'],[97.4,'A4'],[99.4,'B4'],[101.4,'D5'],[103.4,'E5']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.7,'pno'));
  S.chord(A(106),8,['E1','B1','E2'],.6,'choir');S.pulse(A(108),32,'E2',100,.85,{snare:true});for(let i=0;i<14;i++){const tt=108+i*2.4;if(tt>=KILL-2)break;S.chord(A(tt),2.4,[['E3','G3','B3'],['C3','E3','G3'],['D3','F#3','A3'],['B2','D#3','F#3']][i%4],.6+i*.02,i%2?'brass':'str');S.taiko(A(tt),.85,i%2?.3:-.3);}
  S.riser(A(KILL-4),3.9);S.chord(A(KILL+.4),8,['E3','B3','E4','G4','B4'],.8,'choir');S.chord(A(KILL+.4),8,['E2','B2','E3'],.7,'brass');
  const dawn=[['C3','G3','E4'],['G2','D3','B3'],['D3','A3','F#4'],['E3','B3','G4'],['C3','G3','C4','E4'],['G2','D3','G3','B3'],['D3','A3','D4','F#4'],['G2','D3','G3','B3','D4']];
  dawn.forEach((c,i)=>S.chord(A(153+i*3.6),4,c,.5+i*.04,'str'));[[154,'G5'],[156,'F#5'],[158,'E5'],[160,'D5'],[163,'B4'],[165,'D5'],[167,'E5'],[169,'G5'],[173.5,'B5']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.75,'pno'));
  S.chord(A(173.5),9,['G2','D3','G3','B3','D4'],.7,'choir');S.sting(A(173.5),.5);}
/* ---------------------------------------------------------------- build */
function build(scene,F){buildMT();SHELF.build(scene);FX.init(scene);FFX.init(scene);for(const o of SHELF.occ)o.layers.enable(2);
  [[0,-1],[0,1],[1,-1],[1,1]].forEach(([r,o],i)=>{const from=V(-900+i*20,150,300+i*10),to=V(RA[r].x+o*6,0,RA[r].z+o*4);const tl=LAND1+[0,.6,1.1,1.5][i];FX.shell(from,to,SHOT1+i*.5+.05,tl);FX.blast(to,tl,1.4);});
  [0,1,2].forEach(i=>{const from=V(-900+i*20,150,300),to=V(RA[2].x+(i-1)*6,TIDE(LAND2),RA[2].z);FX.shell(from,to,SHOT2+i*.5+.05,LAND2+i*.5);FX.blast(to,LAND2+i*.5,1.6);});
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  const PB=[];for(let i=0;i<5;i++){const x=SV.x-6+i*2.2,z=SV.z-4+(i%2);PB.push(V(x,SHELF.h(x,z)-2.9,z));}allyB=SIG.makeAllies(PB);allyB.scale.set(1,1,1);allyB.layers.set(1);scene.add(allyB);
  const body=new T.MeshStandardMaterial({color:0x4a3e30,roughness:.9});for(let i=0;i<5;i++){const g=new T.Group();const b=new T.Mesh(new T.CapsuleGeometry(.28,.95,4,8),body);b.position.y=.78;g.add(b);
    const h=new T.Mesh(new T.SphereGeometry(.17,8,6),body);h.position.y=1.6;g.add(h);scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});FOLK.push(g);}
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
  jets=[0,1,2,3].map(()=>[0,1].map(()=>{const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(.6,.8,1),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.visible=false;scene.add(s);return s;}));
  simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[
 ['BRAMBLE · 5','green',()=>V(SV.x,SHELF.h(SV.x,SV.z)+6,SV.z),t=>(t>=41.6&&t<52.6)],...RA.map((r,i)=>['RIFT '+r.n,'red',()=>V(r.x,10,r.z),t=>(t>=41.6&&t<52.6)||(i===2&&t>=106&&t<112)]),
 ['MARK · A','red mark',()=>V(RA[0].x,12,RA[0].z),t=>t>=57.6&&t<64],['MARK · B','red mark',()=>V(RA[1].x,12,RA[1].z),t=>t>=64&&t<70],['SEALED','green mark',()=>V(RA[0].x,10,RA[0].z),t=>t>=LAND1+1&&t<80],
 ['DRAG · 1,000','red',(o,t)=>{const c=SIM.sw&&SIM.sw.list.find(c=>c.rig.id==='drag'&&!c.dead);return c?SIM.sw.center(c).add(V(0,8,0)):V(0,-99,0);},t=>t>=19&&t<30],
 ['HULK · 5,000','red mark',()=>hulk().add(V(0,14,0)),t=>t>=107&&t<118],['CORE','red mark',()=>SIM.H&&!SIM.H.dead&&SIM.H.core?SIM.H.corePos.clone().add(V(0,3,0)):V(0,-99,0),t=>t>=CORE+.5&&t<KILL]];
FILM.run({id:'m6',DUR,place:'The Drowned Shelf',pageTitle:'IRMD · Mission 6 · The Shelf',clock:[5,10,0],poster:30,
  start:{org:'International Rift Mech Defense · Mission 6',t:'The Shelf',sub:'The Drowned Shelf · 05:10 · 3 min<br>Sound on, headphones if you have them'},
  end:{org:'Three rifts closed',t:'The Shelf',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M6SIM=SIM;window.M6SIMTO=simTo;
})();
