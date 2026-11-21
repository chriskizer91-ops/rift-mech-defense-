'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: THE FILM (game/cinematic/cin-main.js, session D)
   56 seconds, ten shots (the shot list is in the chapter 1 design doc). Every number in a frame is a function of the film's
   time t, so it plays the same every time and can be recorded frame by frame (?rec=1280x640).
   Hand-off: the game opens this page with ?back=<its url>; at the end (or SKIP) the page goes back there.
   ===================================================================================================================== */
(function(){
const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z),$=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t;
const ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const vl=(a,b,u)=>a.clone().lerp(b,u);
const Q=new URLSearchParams(location.search);
const REC=Q.get('rec');const BACK=Q.get('back');const DUR=56;
let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};

/* ---------------------------------------------------------------- the stage: a 2:1 band, letterboxed */
const stage=$('stage'),cv=document.createElement('canvas');stage.prepend(cv);
const R=new T.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance',alpha:false,preserveDrawingBuffer:!!REC});
let PR=REC?1:Math.min(window.devicePixelRatio||1,1.75);
LOOK.init(R);
const scene=new T.Scene();
const cam=new T.PerspectiveCamera(40,2,.3,20000);
let W=2,H=1;
function resize(){let w,h;if(REC){[w,h]=REC.split('x').map(Number);}else{const sw=innerWidth,sh=innerHeight;w=sw;h=Math.round(sw/2);if(h>sh){h=sh;w=sh*2;}}
  W=w;H=h;stage.style.width=w+'px';stage.style.height=h+'px';R.setPixelRatio(PR);R.setSize(w,h,false);LOOK.resize(Math.floor(w*PR),Math.floor(h*PR));
  cam.aspect=w/h;cam.updateProjectionMatrix();document.documentElement.style.setProperty('--bandH',h+'px');}
addEventListener('resize',resize);resize();

/* ---------------------------------------------------------------- the world, the team, the Signal */
WORLD.build(scene);
const RIFTS=[{x:-120,z:-1150,k:1.4},{x:430,z:-1520,k:1},{x:-700,z:-1380,k:1},{x:270,z:-860,k:.8}];
WORLD.setRifts(RIFTS);
for(const o of WORLD.occluders)o.layers.enable(2);
const SIGPOS=V(-120,0,-1150),SIGS=2.5;
const sig=SIG.make();const sigG=new T.Group();sigG.position.copy(SIGPOS);sigG.scale.setScalar(SIGS);sigG.add(sig.pts);scene.add(sigG);
sig.pts.layers.set(1);SIG.hostMat.uniforms.uWS.value=SIGS;
const rifts=SIG.makeRifts(RIFTS.slice(1),26000);rifts.layers.set(1);scene.add(rifts);
SIG.riftMat.uniforms.uTo.value.set(SIGPOS.x,95*SIGS,SIGPOS.z);
const allies=SIG.makeAllies(TEAM.SPOTS);allies.layers.set(1);scene.add(allies);
const grid=LOOK.grid(2600);grid.obj.position.set(-7,.4,-2);grid.obj.layers.set(1);scene.add(grid.obj);
let teamReady=false;
const teamP=TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});teamReady=true;}).catch(e=>{console.warn('team',e);teamReady=true;});

/* ---------------------------------------------------------------- the lines (ids match the voice-acting sheet) */
const LINES=[
 {id:'C1_01_OW',t:.7,d:3.6,who:'OVERWATCH',s:.1,tx:'New contact. Bearing zero-four-one, range two point four.'},
 {id:'C1_02_OW',t:5.4,d:5.2,who:'OVERWATCH',s:.15,tx:'Count is climbing… forty thousand… two hundred thousand…'},
 {id:'C1_03_OW',t:12.7,d:3,who:'OVERWATCH',s:.25,tx:'That’s more than I’ve ever seen on one screen.'},
 {id:'C1_04_OW',t:18.9,d:3,who:'OVERWATCH',s:.55,tx:'Sensor’s choking. It can’t resolve them.'},
 {id:'C1_05_OW',t:25.7,d:2.8,who:'OVERWATCH',s:.75,tx:'Wait. They’re not moving like a swarm.'},
 {id:'C1_06_OW',t:32.5,d:1.8,who:'OVERWATCH',s:.2,tx:'It’s one mass.'},
 {id:'C1_07_OW',t:36.9,d:4.6,who:'OVERWATCH',s:0,tx:'Wraith. It’s coming through clear. Nothing’s ever come through clear.'},
 {id:'C1_08_ANVIL',t:42.7,d:2.8,who:'ANVIL',s:.15,tx:'OVERWATCH, ANVIL. What am I looking at?'},
 {id:'C1_09_OW',t:48.5,d:1.6,who:'OVERWATCH',s:.1,tx:'The Signal.'},
 {id:'C1_10_PILOT',t:53.7,d:1.4,who:'WRAITH',s:.1,tx:'Here it comes.'}];

/* ---------------------------------------------------------------- the shots */
const P=TEAM.SPOTS[1];   /* the player */
const SHOTS=[
 {t0:0,t1:5,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(-0.6,10.9,19),V(-1.4,10.5,15.8),ease(u)),l:V(-45,32,-1150),fov:36})},
 {t0:5,t1:12,name:'WRAITH · OPTICAL ▸ SENSOR',f:u=>({p:vl(V(-5.4,12.6,3.6),V(-7.6,13.3,-6.5),ease(u)),l:V(-115,165,-1150),fov:lerp(38,24,ease(ss(0,1,u)))})},
 {t0:12,t1:18,name:'OVERWATCH · ORBITAL',f:u=>({p:vl(V(720,1220,360),V(540,1120,150),u),l:V(-150,0,-1020),fov:44})},
 {t0:18,t1:25,name:'HALE · OPTICAL',f:u=>({p:vl(V(36,8.6,5.2),V(32,8.2,3.6),ease(u)),l:vl(V(-22,11,-6),V(-40,40,-90),ease(ss(.25,1,u))),fov:36,shake:.05+u*.08})},
 {t0:25,t1:31,name:'— — —',cuts:[
   [25.0,{p:V(-6,13,6),l:V(-120,170,-1150),fov:26}],[26.4,{p:V(-24.6,7.3,-7.2),l:V(-21,12.3,-1.5),fov:30,real:.9}],
   [27.6,{p:V(260,330,-480),l:V(-120,150,-1150),fov:38}],[28.9,{p:V(-6,13,6),l:V(-120,240,-1150),fov:14}],[30.0,{p:V(-7,9.2,22),l:V(-60,60,-1150),fov:30,real:.9}]]},
 {t0:31,t1:36,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(70,15,300),V(68,14.6,288),u),l:V(-112,165,-1150),fov:lerp(21,19,u)})},
 {t0:36,t1:42,name:'WRAITH · SENSOR · LOCK',f:u=>({p:vl(V(-2,10,26),V(-4,10.6,13),ease(u)),l:V(-115,200,-1150),fov:lerp(25,17,ease(u))})},
 {t0:42,t1:47,name:'ANVIL · BATTERY',f:u=>({p:vl(V(-866,89.4,263),V(-870,90.4,258),u),l:V(-130,175,-1150),fov:30})},
 {t0:47,t1:52,name:'WRAITH · THERMAL',f:u=>({p:vl(V(-0.6,6.5,7.2),V(-1.1,6.3,6.2),u),l:V(-62,96,-600),fov:lerp(36,31,u)})},
 {t0:52,t1:56,name:'WRAITH · THERMAL',f:u=>{const k=ease(ss(.3,1,u));return {p:vl(V(-1.1,6.3,6.2),V(-7,78,48),k),l:vl(V(-62,96,-600),V(-7,0,-3),k),fov:lerp(31,42,k),shake:(1-ss(.0,.45,u))*.9};}}];
function shotAt(t){for(const s of SHOTS)if(t<s.t1)return s;return SHOTS[SHOTS.length-1];}

/* ---------------------------------------------------------------- the tracks: every number the frame needs, from t */
function tracks(t){const o={};
  /* how many of the million are on the board */
  o.count=t<5?lerp(60,1500,ss(0,5,t)):t<12?1500+Math.pow(ss(5,12,t),1.6)*198500:t<18?lerp(200000,750000,ss(12,18,t)):lerp(750000,1000000,ss(18,30,t));
  /* resolving: a cloud, then the shape */
  o.res=t<18?0:t<31?ss(18,31,t)*.9+Math.sin(t*7)*.04*(t>25?1:0):lerp(.9,1,ss(31,33.5,t));
  o.q=t<5?.4:t<25?lerp(.6,1.4,ss(5,25,t)):t<31?1.4:t<36?lerp(1,.08,ss(31,35,t)):t<42?.02:lerp(.12,.35,ss(47,55,t));
  /* the picture: interference, held frames, the clear three seconds */
  const I=[[0,.07],[5,.1],[12,.3],[18,.4],[24.5,.66],[25,.7],[31,.5],[33,.15],[36,0],[41.5,.05],[42,.22],[47,.25],[52,.4],[55.2,1],[56,1]];
  let i=0;while(i<I.length-2&&t>=I[i+1][0])i++;o.interf=lerp(I[i][1],I[i+1][1],ss(I[i][0],I[i+1][0],t));
  if(t>25&&t<31)o.interf+=.14*Math.max(0,Math.sin(t*9.3));
  o.stut=t<18?ss(12,18,t)*.15:t<25?lerp(.35,.8,ss(18,25,t)):t<31?1:t<33?.25:t<36?.05:t<42?0:t<52?.12:lerp(.5,.9,ss(52,55,t));
  o.clear=ss(35.9,36.1,t)*(1-ss(39.6,41.8,t));
  /* the feed: how much of the real world shows under the overlay */
  const s=shotAt(t);o.mode=(t>=47&&t<52.55)?1:0;
  o.real=t<5?1:t<12?lerp(1,.6,ss(5,12,t)):t<18?.16:t<25?.85:t<31?.45:t<36?.75:t<42?.55:t<47?1:.8;
  o.mono=t<5?0:t<12?lerp(0,.4,ss(5,12,t)):t<18?1:t<25?.2:t<31?.4:t<36?.3:t<42?.5:0;
  o.wexp=t<12?1.1:t<18?1:t<36?1.15:t<42?1.05:t<47?1.25:1;
  o.dots=t<1?ss(0,1,t):1;o.grid=t<5?.4:t<18?lerp(.4,1,ss(5,14,t)):t<31?.6:t<42?.25:.35;
  o.fade=ss(55.55,56,t)+(1-ss(0,.6,t));
  o.glow=lerp(.65,1,ss(0,30,t))+(t>39&&t<40.5?.5*Math.sin((t-39)/1.5*Math.PI):0)+(t>52.3?.6*(1-ss(52.3,54,t)):0);
  /* the Signal: still until it becomes one, then it turns to the harbour, rises, and slams */
  o.hostRate=t<31?1:t<34?.2:1;
  o.yaw=lerp(.62,0,ease(ss(47,51.5,t)));
  o.f1=ss(47.5,51,t)*.7*(1-ss(52.2,53.5,t))+ss(53.5,55,t)*.2;o.f2=0;o.f0=1-o.f1;
  o.raise=ss(50.6,52.1,t)*(1-ss(52.15,52.4,t));o.slam=ss(52.15,52.35,t)*(1-ss(53.5,56,t));o.roar=ss(51.2,51.9,t)*(1-ss(53.6,55,t));o.ag=ss(50,51,t);
  o.pulse=.5+.5*Math.sin(t*1.6);if(t>38.8&&t<40.4)o.pulse=Math.max(o.pulse,1-Math.abs(t-39.2)/1.2);if(t>52.3)o.pulse=Math.max(o.pulse,1-ss(52.3,53.6,t));
  o.flash=t>52.3&&t<53.2?.4*(1-ss(52.3,53.2,t)):(t>52.55&&t<52.75?.25:0);
  o.range=lerp(2.4,1.1,ss(0,47,t));
  /* the team: heads come up as it rises */
  const up=ss(19,24,t)*.32+ss(47,50,t)*.18;o.look=[0,1,2,3].map(k=>({pitch:up*(1+k*.04),yaw:(k-1.5)*-.05*ss(19,24,t)+(k===1?.06*ss(1.5,3,t):0),torso:0}));
  return o;}
/* the Signal's own clock: slows almost to a stop as it becomes one mass */
function hostClock(t){if(t<31)return t;if(t<34)return 31+(t-31)*.2;return 31.6+(t-34);}

/* ---------------------------------------------------------------- HUD */
const hud={cnt:$('cnt'),conf:$('conf'),confb:$('confb'),cap:$('cap'),cam:$('camn'),rng:$('rng'),tc:$('tc'),stamp:$('stamp'),lock:$('lock'),tags:[...document.querySelectorAll('.tag')]};
let capTxt=null;
function setCap(t){let l=null;for(const L of LINES)if(t>=L.t&&t<L.t+L.d+.6)l=L;const s=l?`<b>${l.who}</b> ${l.tx}`:'';if(s!==capTxt){capTxt=s;hud.cap.innerHTML=s;}}
function updHud(t,o){hud.cnt.textContent=Math.floor(o.count).toLocaleString('en-US');
  const conf=clamp(1-o.interf*.95-(1-o.res)*.35,0,1);hud.conf.style.width=(conf*100).toFixed(0)+'%';hud.confb.classList.toggle('bad',conf<.45);
  const s=shotAt(t);hud.cam.textContent=s.name;hud.rng.textContent=o.range.toFixed(1)+' KM';
  const sec=Math.floor(t),fr=Math.floor((t-sec)*24);hud.tc.textContent=`23:52:${String(14+sec).padStart(2,'0').slice(-2)}:${String(fr).padStart(2,'0')}`;
  hud.stamp.classList.toggle('on',t>48.6&&t<51.9);hud.lock.classList.toggle('on',o.clear>.5);
  document.body.classList.toggle('thermal',o.mode>.5);
  /* the team's tags, over their heads, in the shots where they're near */
  const near=(t<5||(t>=18&&t<25));
  hud.tags.forEach((el,k)=>{if(!near||!TEAM.list[k]){el.style.display='none';return;}const p=TEAM.SPOTS[k].clone().setY(14.2).project(cam);
    if(p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1){el.style.display='block';el.style.left=((p.x+1)/2*W)+'px';el.style.top=((1-p.y)/2*H)+'px';}else el.style.display='none';});
  setCap(t);}

/* ---------------------------------------------------------------- one frame */
const _l=V();let lastHost=0;
function frameAt(t,dt){const o=tracks(t);const s=shotAt(t);let c;
  if(s.cuts){let k=s.cuts[0];for(const q of s.cuts)if(t>=q[0])k=q;c=Object.assign({},k[1]);if(c.real!=null)o.real=c.real;}else c=s.f(clamp((t-s.t0)/(s.t1-s.t0),0,1));
  cam.position.copy(c.p);if(c.shake){cam.position.x+=(Math.sin(t*23.1)+Math.sin(t*37.7))*c.shake*.3;cam.position.y+=(Math.sin(t*19.3)+Math.sin(t*41.9))*c.shake*.3;}
  cam.fov=c.fov;cam.updateProjectionMatrix();cam.lookAt(c.l);
  if(t>52.2&&t<54){const k=(1-ss(52.2,54,t))*.012;cam.rotation.z+=Math.sin(t*61)*k;}
  /* the Signal */
  const ht=hostClock(t);const st={f0:o.f0,f1:o.f1,f2:o.f2,raise:o.raise,slam:o.slam,roar:o.roar,ag:o.ag,pulse:o.pulse};
  const op=tracks(Math.max(0,t-.5));SIG.pose(ht,st,{f0:op.f0,f1:op.f1,f2:op.f2,raise:op.raise,slam:op.slam,roar:op.roar,ag:op.ag,pulse:op.pulse});
  sigG.rotation.y=o.yaw;
  const U=SIG.hostMat.uniforms,th=o.mode>.5;U.uRes.value=o.res;U.uQ.value=o.q;
  sig.geo.setDrawRange(0,Math.floor(o.count));
  U.uGain.value=(th?.0022:.06)*(LOOK.HALF?1:2.5);U.uCG.value=th?3:7;U.uSize.value=th?2.2:.38;U.uMin.value=th?2.2:1.1;U.uMax.value=th?30:5;U.uSoft.value=th?1:0;
  const S=(H*PR)/(2*Math.tan(cam.fov*Math.PI/360));U.uScale.value=S;
  const RU=SIG.riftMat.uniforms;RU.uT.value=t;RU.uScale.value=S;RU.uSoft.value=th?1:0;RU.uGain.value=(th?.004:.05)*(LOOK.HALF?1:2.5)*(1-.6*ss(31,36,t));RU.uSize.value=th?6:1.6;RU.uMax.value=th?30:7;RU.uQ.value=o.q;
  RU.uFeed.value=ss(8,30,t);
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=S;AU.uGain.value=1;
  grid.mat.opacity=1;grid.obj.visible=o.grid>.01;grid.obj.material.color.setScalar(o.grid);
  /* the world and the team */
  WORLD.update(t,o.glow);if(teamReady)TEAM.pose(t,o.look);
  if(WORLD.rain)WORLD.rain.uniforms.uAmt.value=t<42?.7:t<47?1.2:.8;
  updHud(t,o);
  return o;}
function draw(t,o){const pix=1+Math.floor(ss(.62,1,o.interf)*(1-o.clear)*6)*PR;
  LOOK.render(scene,cam,{real:o.real,mono:o.mono,mode:o.mode,interf:o.interf,pix,flash:o.flash,clear:o.clear,fade:o.fade,exp:o.mode>.5?.75:.75,wexp:o.wexp,dots:o.dots,t});}

/* ---------------------------------------------------------------- sound */
let ctx=null,score=null,radio=null,t0=0;
const VOICE=window.CIN_VOICE||{};
function startSound(){ctx=new (window.AudioContext||window.webkitAudioContext)();score=RMD.Score(ctx);radio=RMD.RadioVoice(ctx,score.out);
  t0=ctx.currentTime+.35;const A=t=>t0+t,P=score.params;
  P.wind.setValueAtTime(0,A(0));P.wind.linearRampToValueAtTime(.32,A(2));P.wind.setValueAtTime(.32,A(30.9));P.wind.linearRampToValueAtTime(.03,A(31.05));
  P.wind.setValueAtTime(.03,A(36));P.wind.linearRampToValueAtTime(.12,A(38));P.wind.linearRampToValueAtTime(.45,A(42.3));P.wind.linearRampToValueAtTime(.22,A(47.2));P.wind.linearRampToValueAtTime(0,A(56));
  P.sea.setValueAtTime(0,A(0));P.sea.linearRampToValueAtTime(.3,A(2));P.sea.setValueAtTime(.3,A(30.9));P.sea.linearRampToValueAtTime(.04,A(31.05));P.sea.linearRampToValueAtTime(.22,A(37));P.sea.linearRampToValueAtTime(0,A(56));
  P.rise.setValueAtTime(0,A(5));P.rise.linearRampToValueAtTime(.12,A(12));P.rise.linearRampToValueAtTime(.03,A(13));P.rise.linearRampToValueAtTime(0,A(18));
  P.riseF.setValueAtTime(1400,A(5));P.riseF.exponentialRampToValueAtTime(6200,A(12));
  P.pad.setValueAtTime(0,A(0));P.pad.linearRampToValueAtTime(.08,A(12));P.pad.linearRampToValueAtTime(.13,A(30.9));P.pad.linearRampToValueAtTime(0,A(31.02));
  P.pad.setValueAtTime(0,A(36));P.pad.linearRampToValueAtTime(.05,A(40));P.pad.linearRampToValueAtTime(.16,A(51.8));P.pad.linearRampToValueAtTime(0,A(52.4));
  P.padF.setValueAtTime(110,A(0));P.padF.exponentialRampToValueAtTime(420,A(30));P.padF.setValueAtTime(160,A(36));P.padF.exponentialRampToValueAtTime(900,A(51.8));
  score.note(A(31.35),6.5);[36.5,37.7,38.95,40.15,41.35].forEach((b,i)=>score.beat(A(b),i===2?1.6:.8));
  score.servo(A(1.9));score.servo(A(20.3));score.servo(A(26.5));score.servo(A(47.4));
  score.roar(A(51.3),4.2);score.hit(A(52.3));
  for(const L of LINES){const b=VOICE[L.id];if(!b)continue;
    Promise.resolve(b).then(u=>{const s=atob(u.slice(u.indexOf(',')+1)),x=new Uint8Array(s.length);for(let i=0;i<s.length;i++)x[i]=s.charCodeAt(i);return ctx.decodeAudioData(x.buffer);}).then(buf=>{radio.play(buf,A(L.t),{strain:L.s});}).catch(()=>{});}}
let statLvl=0;
function soundFrame(o,holding){if(!score)return;const v=o.interf*o.interf*.32*(1-o.clear)+(holding?.18:0);if(Math.abs(v-statLvl)>.01){statLvl=v;score.params.stat.setTargetAtTime(v,ctx.currentTime,.03);}}

/* ---------------------------------------------------------------- playing: live, held frames and all */
let playing=false,holdUntil=0,lastNow=0,fpsA=0,fpsN=0,ended=false;
function now(){return ctx?ctx.currentTime-t0:(performance.now()-startPerf)/1000;}
let startPerf=0;
function loop(){if(!playing)return;requestAnimationFrame(loop);const t=now();if(t<0)return;
  const pn=performance.now(),dt=(pn-lastNow)/1000;lastNow=pn;if(dt<.2){fpsA+=dt;fpsN++;if(fpsA>2.5){const fps=fpsN/fpsA;if(fps<24&&PR>1){PR=1;resize();}fpsA=fpsN=0;}}
  if(t>=DUR){finish();return;}
  const o=frameAt(t,dt);
  /* the sensor struggles: hold the last frame (a real dropped frame, not a filter) */
  const stut=Math.max(o.stut,ss(.55,1,o.interf)*.6*(1-o.clear));
  const holding=pn<holdUntil;soundFrame(o,holding);
  if(holding)return;
  if(stut>0&&rnd()<stut*.22){const l=30+rnd()*rnd()*260*stut;holdUntil=pn+l;if(score)score.burst(ctx.currentTime,l/1000,stut);}
  draw(t,o);}
function finish(){if(ended)return;ended=true;playing=false;$('end').classList.add('on');
  if(score)try{score.out.gain.setTargetAtTime(0,ctx.currentTime,.3);}catch(e){}
  if(BACK)setTimeout(()=>location.replace(BACK),2600);}
function play(){if(playing)return;$('start').classList.remove('on');$('end').classList.remove('on');ended=false;
  try{if(ctx)ctx.close();}catch(e){}ctx=null;try{startSound();}catch(e){console.warn('sound',e);ctx=null;}
  startPerf=performance.now()+350;sd=7;playing=true;lastNow=performance.now();setTimeout(()=>$('skip').classList.add('on'),3000);requestAnimationFrame(loop);}
$('go').onclick=play;$('replay').onclick=play;
$('skip').onclick=()=>{finish();};$('back').onclick=()=>{if(BACK)location.replace(BACK);else history.back();};
if(!BACK)$('back').textContent='BACK';

/* ---------------------------------------------------------------- ready */
Promise.all([teamP]).then(()=>{$('load').textContent='';$('go').disabled=false;$('go').classList.add('ready');
  /* a still of the first frame behind the start card */
  const o=frameAt(.8,0);o.fade=.55;draw(.8,o);
  if(REC){$('start').classList.remove('on');}window.CIN.ready=true;});
/* recording: render frame i of a fixed-rate film (held frames repeat the frame before) */
let recHold=-1,recLast=-1;
window.CIN={ready:false,DUR,
  frame(i,fps){const t=i/(fps||30);const o=frameAt(t,1/(fps||30));const stut=Math.max(o.stut,ss(.55,1,o.interf)*.6*(1-o.clear));
    if(i<=recHold&&recLast>=0)return 'held';
    if(stut>0&&rnd()<stut*.22*(30/(fps||30))*1.6)recHold=i+Math.max(1,Math.round((30+rnd()*rnd()*260*stut)/1000*(fps||30)));
    draw(t,o);recLast=i;return 'drawn';},
  at(t){const o=frameAt(t,0);draw(t,o);return o;}};
})();
