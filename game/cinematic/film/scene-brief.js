'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: INTEL BRIEF 00 (game/cinematic/film/scene-brief.js, session D)
   1 min 20, the film's opening and the game's first screen: OVERWATCH narrates, close and calm.
     0:00  black, a hiss: IRMD INTEL BRIEF 00
     0:05  a city at night, every window, phone and billboard showing static; on "the Static" every screen flares
     0:18  the sea from very high up; the cracks open, glowing orange under the water
     0:28  the real view of a beach: a truck sinking into grey grit, nothing else there
     0:37  the same beach on the sensor: red dots everywhere
     0:48  drone 4's log, typed, with beeps; the drone is lost
     0:58  Greywater Strand at dawn on the sensor, the Wraith's green marker on the sand
     1:10  the badge: WE SEE THEM. NOW WE FIGHT.
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=80,DT=1/60,X=SEAFLOOR.X;
const LINES=[
 {id:'BRIEF_01_OW',t:5.0,w:7.2,who:'OVERWATCH',p:0,tx:'One night, every screen on Earth showed static for nine minutes. People call that night… the Static.'},
 {id:'BRIEF_02_OW',t:18.0,w:5.8,who:'OVERWATCH',p:0,tx:'When the pictures came back, the seafloor had cracked open. Something came up through the cracks.'},
 {id:'BRIEF_03_OW',t:28.4,w:5.0,who:'OVERWATCH',p:0,tx:'Cameras don’t see them. Eyes don’t see them. You’ll see what they leave behind.'},
 {id:'BRIEF_04_OW',t:37.4,w:8.0,who:'OVERWATCH',p:0,tx:'I see them. Not well. One dot for every place they touch our world. That’s the best I can do.'},
 {id:'BRIEF_05_OW',t:59.0,w:7.5,who:'OVERWATCH',p:0,tx:'That’s everything we have. It isn’t much. But we can see them… and nobody else can. So we start there.'}];
const FLARE=12.2,SENS=36.6;
const SHOTS=[
 {t0:0,t1:4.5,name:'— — —',f:()=>({p:V(0,2,40),l:V(0,30,-200),fov:40})},
 {t0:4.5,t1:13.4,name:'ARCHIVE · CITY 06 · 03:14',f:u=>({p:vl(V(1.5,1.7,60),V(3,7,20),ease(u)),l:vl(V(0,22,-200),V(-2,60,-220),ease(u)),fov:44})},
 {t0:13.4,t1:17.5,name:'ARCHIVE · CITY 06 · 03:14',f:u=>({p:vl(V(-160,150,140),V(-150,140,110),u),l:V(0,0,-320),fov:48})},
 {t0:17.5,t1:27.6,name:'ARCHIVE · ORBIT · 3 DAYS LATER',f:u=>({p:vl(V(X-1200,7200,2400),V(X-300,4200,600),ease(u)),l:vl(V(X+200,0,-600),V(X+500,0,-1500),ease(u)),fov:40})},
 {t0:27.6,t1:SENS,name:'ARCHIVE · DRONE 4 · OPTICAL',f:u=>({p:vl(V(-133,3.2,38),V(-138,2.6,32.5),u),l:vl(V(-150,1.2,22),V(-151,.9,21),u),fov:40})},
 {t0:SENS,t1:48,name:'ARCHIVE · DRONE 4 · SENSOR',f:u=>({p:vl(V(-138,2.6,32.5),V(-110,40,90),ease(ss(.2,1,u))),l:vl(V(-151,.9,21),V(-120,0,-10),ease(ss(.2,1,u))),fov:lerp(38,58,ease(ss(.2,1,u)))})},
 {t0:48,t1:58,name:'ARCHIVE · DRONE 4 · LOG',f:u=>({p:vl(V(-110,140,40),V(-110,150,36),u),l:V(-110,0,0),fov:60})},
 {t0:58,t1:70,name:'OVERWATCH · TACTICAL · NOW',f:u=>({p:vl(V(-20,170,70),V(-24,34,58),ease(u)),l:vl(V(-20,0,28),V(-20,4,28),u),fov:lerp(52,40,u)})},
 {t0:70,t1:DUR,name:'— — —',f:()=>({p:V(-24,34,58),l:V(-20,4,28),fov:40})}];
const LOG=[[48.6,'IRMD DRONE 4 · GREYWATER STRAND · LOG'],[50.0,'05:01:12  optical   nothing'],[51.2,'05:01:40  thermal   nothing'],[52.4,'05:02:03  OVERWATCH sensor   2,214 contacts'],
  [54.2,'05:02:05  drone 4: signal lost','r']];
function logAt(t){if(t<48.3||t>57.6)return '';let s='';for(const [tt,line,c] of LOG){if(t<tt)break;const n=Math.floor((t-tt)*44);const txt=line.slice(0,n);s+=(c?`<span class="r">${txt}</span>`:txt)+'\n';}return s;}
/* the swarm on the beach: creatures standing about, doing nothing anyone can see */
const SIM={t:0,swarm:null};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
function simReset(){if(SIM.swarm)FILM.scene.remove(SIM.swarm.points);srs=4242;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:6000,maxDebris:500});sw.points.layers.set(1);sw.ground=(x,z)=>STRAND.h(x,z);
  const kinds=['knot','knot','knot','skein','skein','runner','stalker'];
  for(let i=0;i<70;i++){const id=kinds[i%kinds.length];const x=-260+srnd()*300,z=-30+srnd()*95;if(Math.hypot(x+150,z-22)<9)continue;sw.spawn(id,V(x,STRAND.h(x,z),z),srnd()*6.28);}
  Math.random=sv;SIM.swarm=sw;SIM.t=0;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();const sv=Math.random;Math.random=srnd;let n=0;while(SIM.t+DT<=t+1e-9){SIM.swarm.update(DT,SIM.t,[]);SIM.t+=DT;if(++n>20000)break;}Math.random=sv;}
const seg=t=>t<4.5?0:t<17.5?1:t<27.6?2:3;
function tracks(t){const o={};const sg=seg(t);
  const sens=t>=SENS;
  o.real=t<SENS?1:t<48?lerp(.5,.3,ss(SENS,48,t)):t<58?.16:.3;o.mono=sens?(t<58?.6:.8):0;o.dots=sens?(t<SENS+.3?ss(SENS,SENS+.3,t):1):0;
  o.interf=K([[0,.25],[4.4,.25],[4.6,.08],[11.8,.1],[FLARE,.7],[13.4,.28],[16.4,.5],[17.3,.95],[17.6,.06],[27.4,.08],[27.7,.12],[SENS,.75],[SENS+.6,.18],[47,.2],[54,.3],[54.4,.95],[57.8,.95],[58.1,.12],[70,.08],[DUR,.05]],t);
  o.stut=(t>FLARE&&t<13.4)?.5:(t>54.4&&t<57.8)?.7:(t>SENS&&t<SENS+.5)?.8:0;
  o.flash=t>FLARE&&t<FLARE+.6?.25*(1-ss(FLARE,FLARE+.6,t)):0;o.wexp=sg===2?1.25:1.12;o.exp=.75;
  o.fade=(t<4.5?1:0)+ss(DUR-1.6,DUR,t)+ss(69.6,70.4,t)*(1-ss(78,DUR,t))*.92;if(t>=17.45&&t<17.6)o.fade=1;
  o.count=t<SENS?0:t<58?(t<SENS+3?2214*ss(SENS,SENS+3,t):2214):0;o.range=sens&&t<58?'0.4 KM':null;
  o.title=t<4.5?{k:ss(.8,1.6,t)*(1-ss(3.8,4.4,t)),org:'International Rift Mech Defense',t:'INTEL BRIEF 00',sub:'For new pilots · read by OVERWATCH'}:
    t>=70?{k:ss(70.4,71.4,t)*(1-ss(78.2,79.6,t)),org:'International Rift Mech Defense',t:t<73.6?'WE SEE THEM.':'WE SEE THEM.<br>NOW WE FIGHT.',sub:''}:null;
  o.nohud=t<4.5||t>=70||(t>=4.5&&t<27.6);
  o.log=logAt(t);o.conf=t>54.4&&t<58?.05:null;
  o.static=1;o.flare=t>FLARE?Math.exp(-(t-FLARE)*1.4)*(t<17.5?1:0):0;o.crack=ss(19,26,t)*.95+.05;
  return o;}
let WR=null,allyW=null;
function apply(t,o,cam,px){const sg=seg(t);
  CITY.group.visible=sg===1;SEAFLOOR.group.visible=sg===2;STRAND.group.visible=sg===3;FILM.scene.fog=sg===1?CITY.fog:sg===3?STRAND.fog:null;
  CITY.update(t,o);SEAFLOOR.update(t,o);
  if(sg===3){simTo(t);STRAND.truck.position.y=STRAND.h(-150,22)-.9-ss(27.6,36,t)*.5;STRAND.update(t,{sun:t>58?.25:0,tide:0,boats:[{x:61,z:-150},{x:80,z:-146}]});}
  const sw=SIM.swarm;if(sw){sw.points.visible=sg===3&&t<58;sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.mat.uniforms.uSizeMul.value=1.6;}
  if(TEAM.ready){TEAM.list.forEach((M,k)=>{M.root.visible=k===1&&t>=58;});TEAM.pose(t,[0,1,2,3].map(()=>({pitch:0,yaw:0,torso:0,aim:0})),[0,1,2,3].map(k=>({x:-20,z:28,y:STRAND.h(-20,28),yaw:0,dist:0,spd:0})));}
  allyW.visible=t>=58&&t<70;allyW.position.set(-20,STRAND.h(-20,28)-5.5,28);
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.4;
  if(TEAM.ready)TEAM.list.forEach(M=>M.root.visible=M.root.visible&&sg===3);}
function cue(S,A,F){const P=S.params,N=FSFX.N;
  F.RAMP(P.stat,[[0,.0]],A);
  /* the hiss at the start, and the screens' static in the city */
  const hiss=S.ctx.createGain();hiss.connect(S.sfx);
  F.RAMP(P.wind,[[0,0],[17.6,0],[18,.35],[27.4,.3],[27.7,.12],[58,.1],[70,.05],[DUR,0]],A);
  F.RAMP(P.sea,[[0,0],[27.6,0],[28,.16],[69,.12],[70,0]],A);
  S.glitch(A(.2),4,.25);S.beep(A(1.2),1200,.7);
  S.city(A(4.5),13,1);S.glitch(A(4.6),12.6,.12);S.sting(A(FLARE),.9);S.glitch(A(FLARE),1.4,.9);S.riser(A(14.5),3);S.glitch(A(15.6),1.9,1);
  F.RAMP(P.hum,[[0,0],[17.5,0],[18,.12],[27,.18],[27.5,0],[SENS,0],[SENS+.3,.1],[57.6,.14],[58,0]],A);
  S.boom(A(19.2),0,1.2);[20.4,22.6,24.6,26.4].forEach((b,i)=>S.beat(A(b),.6+i*.1));
  S.surf(A(27.6),42,.6);
  S.switchV(A(SENS-.05),1);S.glitch(A(SENS),.5,.6);
  for(let tt=SENS+.6;tt<57;tt+=.35+Math.random()*.5)S.fizz(A(tt),(Math.random()-.5)*1.4,.12);
  for(const [tt,line] of LOG)for(let i=0;i<Math.min(line.length,40);i+=3)S.beep(A(tt+i/44),2200+(i%7)*90,.25);
  S.burst(A(54.4),3.3,1);S.glitch(A(54.4),3.3,1);S.hit(A(54.4),.6);
  /* the music: a low drone in the city, strings under the sea, then the theme */
  S.chord(A(4.5),13,['D2','A2'],.5,'pad');
  F.RAMP(P.str,[[0,0],[17.6,0],[19,.05],[27.4,.1],[27.6,0],[37,0],[45,.05],[48,0]],A);P.strF.setValueAtTime(500,A(17.6));P.strF.exponentialRampToValueAtTime(1600,A(27.4));
  S.chord(A(27.8),9,['D3','A3'],.45,'pad');S.chord(A(SENS+.2),11,['D2','A2','D3','F3'],.7,'choir');
  [[38.2,'D4'],[40.4,'F4'],[42.6,'E4'],[44.8,'C4']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.7,'pno'));
  const th=[['D3','A3','D4','F4'],['Bb2','F3','D4','F4'],['F2','C3','A3','C4'],['C3','G3','E4','G4'],['D3','A3','F4','A4']];
  th.forEach((c,i)=>S.chord(A(58.2+i*2.4),2.8,c,.5+i*.08,'str'));
  [[58.4,'A4'],[59.6,'D5'],[60.8,'C5'],[62,'A4'],[63.2,'F4'],[64.4,'G4'],[65.6,'A4'],[66.8,'C5'],[68,'D5']].forEach(([tt,n])=>S.chord(A(tt),1.8,[n],.8,'pno'));
  S.chord(A(66.8),3.6,['D3','A3','D4','F4','A4'],.7,'choir');
  S.taiko(A(70.4),1,0);S.sting(A(70.4),1);S.chord(A(70.4),8,['D2','A2','D3','F3','A3','D4'],.9,'brass');S.chord(A(70.4),8.5,['D3','F3','A3','D4'],.8,'choir');
  S.taiko(A(73.6),1,0);S.hit(A(73.6),.8);S.chord(A(73.6),5.6,['F2','C3','F3','A3','C4'],.8,'brass');}
function build(scene,F){CITY.build(scene);SEAFLOOR.build(scene);STRAND.build(scene);for(const o of STRAND.occ)o.layers.enable(2);
  allyW=SIG.makeAllies([V(0,5.5,0)]);allyW.layers.set(1);scene.add(allyW);simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[['WRAITH','green',()=>V(-20,STRAND.h(-20,28)+14,28),t=>t>=60&&t<70],['2,214 CONTACTS','red',()=>V(-120,6,10),t=>t>=40&&t<48]];
FILM.run({id:'brief',DUR,place:'IRMD archive',pageTitle:'IRMD · Intel Brief 00',clock:[3,14,0],poster:40,
  start:{org:'International Rift Mech Defense',t:'Intel Brief 00',sub:'For new pilots · 1 min 20<br>Sound on, headphones if you have them'},
  end:{org:'Mission 1',t:'First Light',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
})();
