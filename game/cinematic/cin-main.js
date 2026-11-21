'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: THE FILM (game/cinematic/cin-main.js, session D)
   150 seconds in three acts, twenty shots:
     ARRIVAL       0 to 38    down through the rain onto Arlen Bay; the team walks the wall; the other teams and ANVIL check in
     THE REVEAL   38 to 99    the count climbs, the sensor chokes, it becomes one mass, three clear seconds, "The Signal."
     FIRST CONTACT 99 to 150  four rifts feed it; ANVIL's barrage seals one; it rises, comes ashore, and slams the water
   Every number in a frame is a function of the film's time t, so it plays the same every time and can be recorded
   frame by frame (?rec=1280x640). The voices are Christopher's ElevenLabs takes, on the radio (cin-audio.js).
   Hand-off: the game opens this page with ?back=<its url>; at the end (or SKIP) the page goes back there.
   ===================================================================================================================== */
(function(){
const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z),$=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t;
const ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const vl=(a,b,u)=>a.clone().lerp(b,u);
/* keyframes: [[t,v],...] eased between, held outside */
const K=(keys,t)=>{if(t<=keys[0][0])return keys[0][1];for(let i=0;i<keys.length-1;i++){const [a,va]=keys[i],[b,vb]=keys[i+1];if(t<b)return lerp(va,vb,ss(a,b,t));}return keys[keys.length-1][1];};
const Q=new URLSearchParams(location.search);
const REC=Q.get('rec');const BACK=Q.get('back');const DUR=150;
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
  cam.aspect=w/h;cam.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

/* ---------------------------------------------------------------- the world, the teams, the Signal */
WORLD.build(scene);FX.init(scene);
const RIFTS=[{x:-120,z:-1150,k:1.4},{x:430,z:-1520,k:1},{x:-700,z:-1380,k:1},{x:270,z:-860,k:.8}];
WORLD.setRifts(RIFTS);
for(const o of WORLD.occluders)o.layers.enable(2);
const SIGS=2.5;
const sig=SIG.make();const sigG=new T.Group();sigG.position.set(-120,0,-1150);sigG.scale.setScalar(SIGS);sigG.add(sig.pts);scene.add(sigG);
sig.pts.layers.set(1);SIG.hostMat.uniforms.uWS.value=SIGS;
const rifts=SIG.makeRifts(RIFTS.slice(1),26000);rifts.layers.set(1);scene.add(rifts);
const allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
/* the other teams, on the long-range map: green dots (decided) */
const OTHERS=[{n:'HARROW',p:V(150,5.5,-1.5)},{n:'MILLER',p:V(-210,1.5,42)},{n:'WREN',p:V(250,5.5,-20)}];
const allyOthers=SIG.makeAllies(OTHERS.map(o=>o.p));allyOthers.layers.set(1);scene.add(allyOthers);
const grid=LOOK.grid(2600);grid.obj.position.set(-7,.4,-2);grid.obj.layers.set(1);scene.add(grid.obj);
/* ANVIL's muzzles, for the barrage */
WORLD.guns.updateMatrixWorld(true);const MUZ=WORLD.barrels.map(b=>b.localToWorld(V(0,9,0)));
const R3=V(270,0,-860);
const HITS=[V(262,0,-872),V(281,0,-850),V(268,0,-861)];
const FIRE=[.7,0,.35];MUZ.forEach((m,i)=>{const t0=112.2+FIRE[i],t1=120.4+FIRE[i]*1.15;FX.gun(m,t0);FX.shell(m,HITS[i],t0+.05,t1);FX.blast(HITS[i],t1,1.25);});
const SLAM=V(-150,0,-830);FX.ringAt(SLAM,143.25);FX.blast(SLAM,143.25,3.5);FX.blast(V(-95,0,-850),143.35,2.2);
let teamReady=false;
const teamP=TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});teamReady=true;}).catch(e=>{console.warn('team',e);teamReady=true;});

/* ---------------------------------------------------------------- the lines: file starts (each take has ~0.5 s of silence first), and how long the words run */
const LINES=[
 {id:'M8_01_OW',t:3.6,w:3.6,who:'OVERWATCH',s:.05,p:0.15,tx:'Arlen Bay. Every contact on the coast is moving that way.'},
 {id:'M8_02_HARROW',t:12.2,w:1.7,who:'HARROW',s:.1,p:0.2,tx:'Harrow, harbour wall.'},
 {id:'M8_03_MILLER',t:15.6,w:1.4,who:'MILLER',s:.1,p:0.2,tx:'Miller, slipway.'},
 {id:'M8_04_WREN',t:20.2,w:3.5,who:'WREN',s:.1,p:0.3,tx:'Wren, lighthouse. It’s very quiet out there.'},
 {id:'GEN_07_ANVIL',t:25.2,w:2.4,who:'ANVIL',s:.05,p:0.15,tx:'ANVIL, guns up. Give me a mark.'},
 {id:'PING_01_PILOT',t:28.4,w:.6,who:'WRAITH',s:0,p:0.15,tx:'Copy.'},
 {id:'C1_01_OW',t:38.4,w:4.3,who:'OVERWATCH',s:.1,p:0.3,tx:'New contact. Bearing zero-four-one, range two point four.'},
 {id:'C1_02_OW',t:44.8,w:4.4,who:'OVERWATCH',s:.15,p:0.55,tx:'Count is climbing… forty thousand… two hundred thousand…'},
 {id:'C1_03_OW',t:53.4,w:2.9,who:'OVERWATCH',s:.25,p:0.65,tx:'That’s more than I’ve ever seen on one screen.'},
 {id:'C1_04_OW',t:60.3,w:3.1,who:'OVERWATCH',s:.55,p:0.9,tx:'Sensor’s choking. It can’t resolve them.'},
 {id:'C1_05_OW',t:68.3,w:2.6,who:'OVERWATCH',s:.7,p:0.95,tx:'Wait. They’re not moving like a swarm.'},
 {id:'C1_06_OW',t:75.6,w:1.1,who:'OVERWATCH',s:.15,p:0.35,tx:'It’s one mass.'},
 {id:'C1_07_OW',t:80.9,w:4.5,who:'OVERWATCH',s:0,p:0,tx:'Wraith. It’s coming through clear. Nothing’s ever come through clear.'},
 {id:'C1_08_ANVIL',t:88.1,w:3.1,who:'ANVIL',s:.15,p:0.45,tx:'OVERWATCH, ANVIL. What am I looking at?'},
 {id:'C1_09_OW',t:94.9,w:.8,who:'OVERWATCH',s:.05,p:0.25,tx:'The Signal.'},
 {id:'M8F_01_OW',t:100.1,w:3.6,who:'OVERWATCH',s:.15,p:0.6,tx:'Four rifts feeding it. Close them and it gets smaller.'},
 {id:'M8F_02_ANVIL',t:106.9,w:3.1,who:'ANVIL',s:.05,p:0.45,tx:'Four holes. All my shells. Mark them.'},
 {id:'PING_03_PILOT',t:110.3,w:.6,who:'WRAITH',s:0,p:0.4,tx:'On it.'},
 {id:'GEN_08_ANVIL',t:111.8,w:2.6,who:'ANVIL',s:.05,p:0.55,tx:'Shot, over. Twenty seconds. Don’t stand there.'},
 {id:'GEN_09_ANVIL',t:121.6,w:.8,who:'ANVIL',s:.05,p:0.5,tx:'Splash.'},
 {id:'M8F_03_OW',t:123.6,w:2.3,who:'OVERWATCH',s:.1,p:0.45,tx:'A hundred thousand, gone.'},
 {id:'M8F_05_OW',t:130.0,w:2.8,who:'OVERWATCH',s:.3,p:0.85,tx:'It’s coming ashore. And it’s changing.'},
 {id:'M8F_06_OW',t:134.3,w:3.4,who:'OVERWATCH',s:.35,p:1,tx:'It’s standing up. Stay low, stay out of the air.'},
 {id:'C1_10_PILOT',t:144.0,w:1.1,who:'WRAITH',s:.1,p:0.75,tx:'Here it comes.'}];

/* ---------------------------------------------------------------- the team's walk along the wall (act 1) */
const WALK0=8.5,WALKD=52,WALKT=22;
function team(t){return [0,1,2,3].map(k=>{const s=TEAM.SPOTS[k],t0=WALK0+k*.45;const u=clamp((t-t0)/WALKT,0,1);
  const d=WALKD*(1-Math.cos(Math.PI*u))/2,spd=u>0&&u<1?WALKD*Math.PI/(2*WALKT)*Math.sin(Math.PI*u):0;
  const turn=ss(t0+WALKT,t0+WALKT+1.8,t);return {x:s.x+WALKD-d,z:s.z,yaw:lerp(Math.PI/2,0,turn),dist:d,spd};});}
const leadX=t=>team(t)[0].x;

/* ---------------------------------------------------------------- the shots */
const SHOTS=[
 /* ARRIVAL */
 {t0:0,t1:9,name:'OVERWATCH · ORBITAL',f:u=>{const k=ease(u);return {p:vl(V(560,560,1000),V(160,110,230),k),l:vl(V(0,0,-300),V(10,6,-10),k),fov:40};}},
 {t0:9,t1:19,name:'KESTREL · OPTICAL',f:(u,t)=>{const x=leadX(t);return {p:V(x-17,lerp(7.4,9.6,u),lerp(-5.4,-6.4,u)),l:V(x+8,9.6,1),fov:42,shake:.03};}},
 {t0:19,t1:29.5,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(-300,1650,-40),V(-300,1520,-70),u),l:V(-300,0,-260),fov:52})},
 {t0:29.5,t1:38,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(-10.5,11.1,22),V(-11,10.5,16.5),ease(u)),l:V(-70,32,-1150),fov:36})},
 /* THE REVEAL */
 {t0:38,t1:44.5,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(-11,10.5,16.5),V(-11.3,10.3,13.5),u),l:V(-70,32,-1150),fov:36})},
 {t0:44.5,t1:52.5,name:'WRAITH · OPTICAL ▸ SENSOR',f:u=>({p:vl(V(-5.4,12.6,3.6),V(-7.6,13.3,-6.5),ease(u)),l:V(-115,165,-1150),fov:lerp(38,24,ease(u))})},
 {t0:52.5,t1:59.5,name:'OVERWATCH · ORBITAL',f:u=>({p:vl(V(720,1220,360),V(540,1120,150),u),l:V(-150,0,-1020),fov:44})},
 {t0:59.5,t1:67.5,name:'HALE · OPTICAL',f:u=>({p:vl(V(36,8.6,5.2),V(32,8.2,3.6),ease(u)),l:vl(V(-22,11,-6),V(-40,40,-90),ease(ss(.25,1,u))),fov:36,shake:.05+u*.08})},
 {t0:67.5,t1:74.5,name:'— — —',cuts:[
   [67.5,{p:V(-6,13,6),l:V(-120,170,-1150),fov:26}],[69.0,{p:V(-24.6,7.3,-7.2),l:V(-21,12.3,-1.5),fov:30,real:.9}],
   [70.3,{p:V(260,330,-480),l:V(-120,150,-1150),fov:38}],[71.7,{p:V(-6,13,6),l:V(-120,240,-1150),fov:14}],[73.0,{p:V(-7,9.2,22),l:V(-60,60,-1150),fov:30,real:.9}]]},
 {t0:74.5,t1:80.5,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(70,15,300),V(68,14.6,288),u),l:V(-112,165,-1150),fov:lerp(21,19,u)})},
 {t0:80.5,t1:87.5,name:'WRAITH · SENSOR · LOCK',f:u=>({p:vl(V(-2,10,26),V(-4,10.6,13),ease(u)),l:V(-115,200,-1150),fov:lerp(25,17,ease(u))})},
 {t0:87.5,t1:93.5,name:'ANVIL · BATTERY',f:u=>({p:vl(V(-866,89.4,263),V(-870,90.4,258),u),l:V(-130,175,-1150),fov:30})},
 {t0:93.5,t1:99.5,name:'WRAITH · THERMAL',f:u=>({p:vl(V(-0.6,6.5,7.2),V(-1.1,6.3,6.2),u),l:V(-62,96,-600),fov:lerp(36,31,u)})},
 /* FIRST CONTACT */
 {t0:99.5,t1:106.5,name:'WRAITH · SENSOR',f:u=>({p:vl(V(-40,12,9),V(25,12.5,9),u),l:V(-60,150,-1150),fov:34})},
 {t0:106.5,t1:113.5,name:'ANVIL · BATTERY',f:(u,t)=>({p:vl(V(-862,88.4,250),V(-860,88,247),u),l:V(-120,210,-900),fov:42,shake:t>112.15&&t<113.3?.5*(1-ss(112.2,113.3,t)):0})},
 {t0:113.5,t1:121,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(-3,8.5,14),V(-2,8.2,11),u),l:vl(V(-420,520,-260),V(262,40,-866),ease(ss(.15,.95,u))),fov:lerp(52,30,ease(u))})},
 {t0:121,t1:127.5,name:'WRAITH · OPTICAL',f:(u,t)=>({p:vl(V(-6,13,8),V(-5,13.2,4),u),l:V(268,70,-862),fov:lerp(20,17,u),shake:t<122.5?.35*(1-ss(121,122.5,t)):0})},
 {t0:127.5,t1:134,name:'WRAITH · SENSOR',f:(u,t)=>({p:vl(V(58,7,32),V(55,6.6,26),u),l:V(-100,215,-1050),fov:lerp(28,24,u),shake:t>128.2&&t<130?.25:0})},
 {t0:134,t1:141,name:'— TEAM —',cuts:[
   [134.0,{p:V(-31,9.2,4.5),l:V(-19,11.8,-6.5),fov:40,real:.9}],[135.75,{p:V(15.5,8.4,-3.8),l:V(5,11.2,-2.2),fov:34,real:.9}],
   [137.5,{p:V(28,13,5),l:V(18,10.2,-5),fov:38,real:.9}],[139.25,{p:V(-4.6,11.8,3.4),l:V(-90,170,-980),fov:30,real:.7}]]},
 {t0:141,t1:150,name:'WRAITH · THERMAL',f:(u,t)=>{const k=ease(ss(.4,.92,u));return {p:vl(V(-0.6,6.5,7.2),V(-7,82,52),k),l:vl(V(-62,110,-600),V(-7,0,-3),k),fov:lerp(33,42,k),shake:t>143.2&&t<145.5?.9*(1-ss(143.2,145.5,t)):0};}}];
function shotAt(t){for(const s of SHOTS)if(t<s.t1)return s;return SHOTS[SHOTS.length-1];}
const per=(t,vals)=>{for(let i=0;i<SHOTS.length;i++)if(t<SHOTS[i].t1)return vals[i];return vals[vals.length-1];};

/* ---------------------------------------------------------------- the tracks */
function tracks(t){const o={};
  o.count=t<44.5?K([[0,0],[33,0],[35,30],[38,60],[44.5,1500]],t):t<52.5?1500+Math.pow(ss(44.5,52.5,t),1.6)*198500:t<59.5?lerp(200000,750000,ss(52.5,59.5,t)):t<122?lerp(750000,1000000,ss(59.5,71,t)):lerp(1000000,900000,ss(122,124.5,t));
  o.res=t<59.5?0:t<74.5?ss(59.5,74.5,t)*.9+Math.sin(t*7)*.04*(t>67.5?1:0):lerp(.9,1,ss(74.5,77,t));
  o.q=K([[0,.4],[44.5,.6],[67.5,1.4],[74.5,1.4],[78.5,.08],[80.5,.02],[87.5,.02],[93.5,.12],[127,.15],[134,.3],[150,.4]],t);
  o.interf=K([[0,.06],[38,.07],[44.5,.1],[52.5,.3],[59.5,.4],[67,.66],[67.5,.7],[74.5,.5],[76.5,.15],[80.4,0],[86.4,.05],[87.5,.22],[99.5,.2],[113.5,.16],[121,.3],[127.5,.3],[134,.3],[141,.4],[143.2,.62],[146,.45],[149,1],[150,1]],t);
  if(t>67.5&&t<74.5)o.interf+=.14*Math.max(0,Math.sin(t*9.3));if(t>134&&t<141)o.interf+=.05*Math.max(0,Math.sin(t*5.1));
  o.stut=t<52.5?0:t<59.5?ss(52.5,59.5,t)*.15:t<67.5?lerp(.35,.8,ss(59.5,67.5,t)):t<74.5?1:t<76.5?.25:t<80.5?.05:t<87.5?0:t<127?.1:t<141?lerp(.2,.5,ss(127,141,t)):lerp(.5,.9,ss(141,149,t));
  o.clear=ss(80.4,80.6,t)*(1-ss(84.2,86.4,t));
  o.mode=((t>=93.5&&t<99.5)||(t>=141&&t<143.3))?1:0;
  o.real=per(t,[1,1,.3,1,1,lerp(1,.6,ss(44.5,52.5,t)),.16,.85,.45,.75,.55,1,.8,.5,1,1,.9,.6,.85,.8]);
  o.mono=per(t,[0,0,1,0,0,lerp(0,.4,ss(44.5,52.5,t)),1,.2,.4,.3,.5,0,0,.4,0,0,0,.35,0,0]);
  o.wexp=per(t,[1.15,1.1,1,1.1,1.1,1.1,1,1.15,1.15,1.15,1.05,1.25,1,1.1,1.25,1.15,1.1,1.1,1.15,1]);
  o.grid=per(t,[0,.15,2.4,.35,.4,lerp(.4,1,ss(44.5,50,t)),1,.6,.6,.25,.25,.35,.35,.6,.3,.25,.3,.5,.4,.35]);
  o.dots=1;o.fade=ss(149.4,150,t)+(1-ss(0,1.6,t));
  o.glow=K([[0,.55],[38,.6],[70,1],[83.2,1],[83.8,1.5],[85,1],[143.1,1],[143.4,1.6],[146,1.1]],t);
  o.k3=1-ss(121,124.5,t);   /* the fourth rift, sealed */
  o.yaw=lerp(.62,0,ease(ss(93.5,98,t)));
  o.f1=ss(127.5,131.5,t)*(1-.25*ss(143.1,144,t));o.f2=0;o.f0=1-o.f1;
  o.raise=ss(141.3,143.0,t)*(1-ss(143.05,143.3,t));o.slam=ss(143.05,143.25,t)*(1-ss(144.4,147,t));
  o.roar=ss(127.8,128.6,t)*(1-ss(130.4,131.6,t))+ss(142.1,142.8,t)*(1-ss(144.5,146,t));o.ag=ss(127,128.5,t);
  o.pulse=.5+.5*Math.sin(t*1.6);if(t>83&&t<84.8)o.pulse=Math.max(o.pulse,1-Math.abs(t-83.5)/1.2);if(t>143.2)o.pulse=Math.max(o.pulse,1-ss(143.2,144.6,t));
  o.flash=t>143.25&&t<144.2?.3*(1-ss(143.25,144.2,t)):0;
  o.sigZ=lerp(-1150,-900,ease(ss(128,148,t)));
  o.range=t<93.5?lerp(2.4,1.1,ss(38,93.5,t)):lerp(1.1,.85,ss(128,148,t));
  const up=ss(60,66,t)*.32+ss(93.5,96,t)*.18-ss(127,131,t)*.1+ss(131,134,t)*.25;
  const aim=-.32*ss(134.5,137,t);
  o.look=[0,1,2,3].map(k=>({pitch:up*(1+k*.04),yaw:(k-1.5)*-.05*ss(60,66,t)+(k===1?.06*ss(39.5,41,t):0),torso:0,aim}));
  o.team=team(t);
  return o;}
function hostClock(t){if(t<74.5)return t;if(t<77.5)return 74.5+(t-74.5)*.2;return 75.1+(t-77.5);}

/* ---------------------------------------------------------------- HUD: tags over things, captions, readouts */
const hud={cnt:$('cnt'),conf:$('conf'),confb:$('confb'),cap:$('cap'),cam:$('camn'),rng:$('rng'),tc:$('tc'),stamp:$('stamp'),lock:$('lock')};
const TAGS=[];const tag=(text,cls,pos,when)=>{const el=document.createElement('div');el.className='hud tag '+(cls||'');el.textContent=text;stage.appendChild(el);TAGS.push({el,pos,when});};
TEAM.NAMES.forEach((n,k)=>tag(n,'',o=>V(o.team[k].x,14.4,o.team[k].z),t=>(t>=9&&t<19)||(t>=29.5&&t<44.5)||(t>=59.5&&t<67.5)));
tag('WRAITH TEAM','',o=>V(o.team[1].x-60,14,o.team[1].z+30),t=>t>=19&&t<29.5);
OTHERS.forEach(o=>tag(o.n,'',()=>o.p.clone().setY(o.p.y+9),t=>t>=19&&t<29.5));
tag('ANVIL','amber',()=>V(-850,96,232),t=>(t>=19&&t<29.5));
RIFTS.forEach((r,i)=>tag('RIFT '+(i+1),'red',()=>V(r.x,40,r.z),t=>(t>=101&&t<106.5)));
tag('MARK · RIFT 4','red mark',()=>V(R3.x,30,R3.z),t=>t>=110.6&&t<121.2);
tag('SEALED','green mark',()=>V(R3.x,30,R3.z),t=>t>=124&&t<127.5);
let capTxt=null;
function setCap(t){let l=null;for(const L of LINES)if(t>=L.t+.45&&t<L.t+.5+L.w+.7)l=L;const s=l?`<b>${l.who}</b> ${l.tx}`:'';if(s!==capTxt){capTxt=s;hud.cap.innerHTML=s;}}
function updHud(t,o){hud.cnt.textContent=Math.floor(o.count).toLocaleString('en-US');
  const conf=clamp(1-o.interf*.95-(t>44?(1-o.res)*.35:0),0,1);hud.conf.style.width=(conf*100).toFixed(0)+'%';hud.confb.classList.toggle('bad',conf<.45);
  const s=shotAt(t);hud.cam.textContent=s.name;hud.rng.textContent=t<34?'— —':o.range.toFixed(1)+' KM';
  const sec=Math.floor(t),fr=Math.floor((t-sec)*24),ts=48*60+10+sec;hud.tc.textContent=`23:${String(Math.floor(ts/60)).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}:${String(fr).padStart(2,'0')}`;
  hud.stamp.classList.toggle('on',t>95.3&&t<98.8);hud.lock.classList.toggle('on',o.clear>.5);
  document.body.classList.toggle('thermal',o.mode>.5);
  for(const g of TAGS){if(!g.when(t)){g.el.style.display='none';continue;}const p=g.pos(o).project(cam);
    if(p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1){g.el.style.display='block';g.el.style.left=((p.x+1)/2*W)+'px';g.el.style.top=((1-p.y)/2*H)+'px';}else g.el.style.display='none';}
  setCap(t);}

/* ---------------------------------------------------------------- one frame */
function frameAt(t){const o=tracks(t);const s=shotAt(t);let c;
  if(s.cuts){let k=s.cuts[0];for(const q of s.cuts)if(t>=q[0])k=q;c=Object.assign({},k[1]);if(c.real!=null)o.real=c.real;}else c=s.f(clamp((t-s.t0)/(s.t1-s.t0),0,1),t);
  cam.position.copy(c.p);if(c.shake){cam.position.x+=(Math.sin(t*23.1)+Math.sin(t*37.7))*c.shake*.3;cam.position.y+=(Math.sin(t*19.3)+Math.sin(t*41.9))*c.shake*.3;}
  cam.fov=c.fov;cam.updateProjectionMatrix();cam.lookAt(c.l);
  if(c.shake)cam.rotation.z+=Math.sin(t*61)*c.shake*.01;
  cam.updateMatrixWorld();   /* so the HUD's tags project with this frame's camera */
  /* the Signal */
  sigG.position.z=o.sigZ;sigG.rotation.y=o.yaw;
  const ht=hostClock(t);const op=tracks(Math.max(0,t-.5));SIG.pose(ht,o,op);
  const U=SIG.hostMat.uniforms,th=o.mode>.5;U.uRes.value=o.res;U.uQ.value=o.q;
  sig.geo.setDrawRange(0,Math.floor(o.count));
  U.uGain.value=(th?.0022:.06)*(LOOK.HALF?1:2.5);U.uCG.value=th?3:7;U.uSize.value=th?2.2:.38;U.uMin.value=th?2.2:1.1;U.uMax.value=th?30:5;U.uSoft.value=th?1:0;
  const S=(H*PR)/(2*Math.tan(cam.fov*Math.PI/360));U.uScale.value=S;
  const RU=SIG.riftMat.uniforms;RU.uT.value=t;RU.uScale.value=S;RU.uSoft.value=th?1:0;RU.uGain.value=(th?.004:.05)*(LOOK.HALF?1:2.5)*(1-.6*ss(74.5,80,t))*ss(33,46,t);RU.uSize.value=th?6:1.6;RU.uMax.value=th?30:7;RU.uQ.value=o.q;
  RU.uFeed.value=ss(46,68,t);RU.uK.value.set(1,1,o.k3);RU.uTo.value.set(-120,95*SIGS,o.sigZ);
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=S;AU.uGain.value=lerp(.35,1,1-o.real)+(t>=19&&t<29.5?1.5:0);
  o.team.forEach((m,k)=>allyTeam[k].position.set(m.x,0,m.z));
  grid.obj.visible=o.grid>.01;grid.obj.material.color.setScalar(o.grid);
  /* the world, the team, fire and water */
  RIFTS[3].k=.8*o.k3;WORLD.setRifts(RIFTS);WORLD.update(t,o.glow);if(teamReady)TEAM.pose(t,o.look,o.team);
  if(WORLD.rain)WORLD.rain.uniforms.uAmt.value=t<38?1.1:t<87.5?.7:t<99.5?1.2:.8;
  FX.update(t,cam,S);
  updHud(t,o);
  return o;}
function draw(t,o){const pix=1+Math.floor(ss(.62,1,o.interf)*(1-o.clear)*6)*PR;
  LOOK.render(scene,cam,{real:o.real,mono:o.mono,mode:o.mode,interf:o.interf,pix,flash:o.flash,clear:o.clear,fade:o.fade,exp:.75,wexp:o.wexp,dots:o.dots,t});}

/* ---------------------------------------------------------------- sound */
let ctx=null,score=null,radio=null,t0=0;
const VOICE=window.CIN_VOICE||{};
const b64buf=u=>{const s=atob(u.slice(u.indexOf(',')+1)),x=new Uint8Array(s.length);for(let i=0;i<s.length;i++)x[i]=s.charCodeAt(i);return x.buffer;};
function cue(){const A=t=>t0+t,P=score.params,S=score;
  /* beds */
  P.wind.setValueAtTime(0,A(0));P.wind.linearRampToValueAtTime(.3,A(3));P.wind.setValueAtTime(.3,A(74.4));P.wind.linearRampToValueAtTime(.03,A(74.55));
  P.wind.setValueAtTime(.03,A(80.5));P.wind.linearRampToValueAtTime(.12,A(82));P.wind.linearRampToValueAtTime(.42,A(88));P.wind.linearRampToValueAtTime(.22,A(93.7));P.wind.linearRampToValueAtTime(.3,A(140));P.wind.linearRampToValueAtTime(0,A(150));
  P.sea.setValueAtTime(0,A(0));P.sea.linearRampToValueAtTime(.3,A(3));P.sea.setValueAtTime(.3,A(74.4));P.sea.linearRampToValueAtTime(.04,A(74.55));P.sea.linearRampToValueAtTime(.24,A(81));P.sea.linearRampToValueAtTime(0,A(150));
  P.rain.setValueAtTime(0,A(0));P.rain.linearRampToValueAtTime(.07,A(2));P.rain.linearRampToValueAtTime(.035,A(40));P.rain.setValueAtTime(.035,A(74.4));P.rain.linearRampToValueAtTime(0,A(74.55));P.rain.linearRampToValueAtTime(.04,A(88));P.rain.linearRampToValueAtTime(0,A(150));
  P.rise.setValueAtTime(0,A(44.5));P.rise.linearRampToValueAtTime(.12,A(52.4));P.rise.linearRampToValueAtTime(.03,A(53.5));P.rise.linearRampToValueAtTime(0,A(59.5));
  P.riseF.setValueAtTime(1400,A(44.5));P.riseF.exponentialRampToValueAtTime(6200,A(52.4));
  P.pad.setValueAtTime(0,A(0));P.pad.linearRampToValueAtTime(.05,A(8));P.pad.linearRampToValueAtTime(.08,A(38));P.pad.linearRampToValueAtTime(.13,A(74.4));P.pad.linearRampToValueAtTime(0,A(74.55));
  P.pad.setValueAtTime(0,A(80.5));P.pad.linearRampToValueAtTime(.05,A(85));P.pad.linearRampToValueAtTime(.12,A(99));P.pad.linearRampToValueAtTime(.08,A(112));P.pad.linearRampToValueAtTime(.14,A(142.4));P.pad.linearRampToValueAtTime(0,A(142.6));
  P.pad.setValueAtTime(0,A(143.2));P.pad.linearRampToValueAtTime(.1,A(144));P.pad.linearRampToValueAtTime(0,A(149.5));
  P.padF.setValueAtTime(110,A(0));P.padF.exponentialRampToValueAtTime(260,A(38));P.padF.exponentialRampToValueAtTime(460,A(74));P.padF.setValueAtTime(160,A(80.5));P.padF.exponentialRampToValueAtTime(900,A(99));P.padF.exponentialRampToValueAtTime(1400,A(142));
  P.str.setValueAtTime(0,A(52.5));P.str.linearRampToValueAtTime(.05,A(59.5));P.str.linearRampToValueAtTime(.11,A(74.4));P.str.linearRampToValueAtTime(0,A(74.55));
  P.str.setValueAtTime(0,A(93.5));P.str.linearRampToValueAtTime(.06,A(96));P.str.linearRampToValueAtTime(.03,A(112));P.str.linearRampToValueAtTime(.1,A(127.5));P.str.linearRampToValueAtTime(.13,A(142.4));P.str.linearRampToValueAtTime(0,A(142.6));
  P.strF.setValueAtTime(600,A(52.5));P.strF.exponentialRampToValueAtTime(1500,A(74.4));P.strF.setValueAtTime(700,A(93.5));P.strF.exponentialRampToValueAtTime(1800,A(142.4));
  /* act 1: the foghorn, a few plucked notes, the team's footsteps and servos */
  S.horn(A(1.2),.55,2.4);S.horn(A(7.4),.55,2.6);S.horn(A(31.8),.6,3.2);
  [[4,293.7],[6,349.2],[8,440],[11,392],[14,349.2],[16,329.6],[18.2,293.7],[21.5,220],[24,261.6],[26,293.7],[30,349.2],[32.5,329.6],[35,293.7]].forEach(([tt,f],i)=>S.pluck(A(tt),f,.9,i%2?.25:-.25));
  for(let k=0;k<4;k++){const st=WALK0+k*.45;for(let tt=st+.7,i=0;tt<st+WALKT-.6;tt+=.58+.05*Math.sin(i*1.7),i++){const near=k===1?1:.55;S.step(A(tt),[-.55,-.2,.2,.55][k],near*(.6+.4*Math.sin(Math.PI*(tt-st)/WALKT)));}
    S.servo(A(st+WALKT+.1),[-.55,-.2,.2,.55][k],.8);}
  /* act 2 */
  S.servo(A(40.2),-.1,1);S.servo(A(60.6),.4,1);S.servo(A(69.1),-.4,1);S.servo(A(94),0,1);
  S.note(A(75.9),7);[81,82.2,83.4,84.6,85.8].forEach((b,i)=>S.beat(A(b),i===2?1.6:.8));
  S.hit(A(95.4),.6);
  /* act 3: the barrage */
  [0,1,2].forEach(i=>{S.boom(A(112.2+i*.35),-.3+i*.1,1);S.whistle(A(117.6+i*.4),2.8,.35,1);S.blast(A(120.4+i*.4),.45,1);});
  S.stab(A(124.1),.55);S.pluck(A(124.1),440,1,0);S.pluck(A(124.6),587.3,.8,.2);
  S.roar(A(128.2),4);[127.6,128.85,130.1].forEach((tt,i)=>S.taiko(A(tt),.7+i*.2,(i-1)*.3));
  /* the groove: 96 bpm from 131 to the slam */
  const BT=.625;for(let b=0;b<19;b++){const tb=131+b*BT;if(tb>=142.4)break;const bar=Math.floor(b/4),q=b%4,lvl=.55+.45*Math.min(1,b/12);
    if(q===0||q===2)S.kick(A(tb),lvl);if(q===3)S.kick(A(tb+BT/2),lvl*.7);if(q===0)S.taiko(A(tb),lvl,(bar%2?.3:-.3));if(b>=8&&(q===1||q===3))S.snare(A(tb),lvl);
    const notes=[36.71,36.71,43.65,36.71,32.7,36.71,27.5,36.71];for(let e=0;e<2;e++)S.bass(A(tb+e*BT/2),notes[(q*2+e)%8],BT/2*.9,lvl);
    if(q===0&&b>=8)S.stab(A(tb),.35+.1*bar);}
  S.riser(A(138.2),4.9);S.roar(A(142.3),4.2);S.hit(A(143.2),1.2);S.note(A(143.2),6.2);
  /* the radio: every line, the music dipping under it */
  const ps=[],c=ctx,rd=radio;for(const L of LINES){S.duck(A(L.t+.4),A(L.t+.5+L.w),.55-.3*(L.p||0));const b=VOICE[L.id];if(!b)continue;
    ps.push(Promise.resolve(b).then(b64buf).then(a=>c.decodeAudioData(a)).then(buf=>rd.play(buf,A(L.t),{strain:L.s,panic:L.p})).catch(e=>console.warn('voice',L.id,e)));}
  return ps;}
/* render the whole soundtrack offline (for checking the mix, and for a preview file) */
window.CIN_AUDIO=async function(){const off=new OfflineAudioContext(2,Math.ceil(44100*DUR),44100);const sv=[ctx,score,radio,t0];
  ctx=off;score=RMD.Score(off);radio=RMD.RadioVoice(off,score.voice);t0=0;const ps=cue();for(let t=0;t<DUR;t+=.05){const o=tracks(t),v=o.interf*o.interf*.3*(1-o.clear)+(rnd()<Math.max(o.stut,ss(.55,1,o.interf)*.6*(1-o.clear))*.22?.16:0);score.params.stat.setValueAtTime(v,t);}await Promise.all(ps);const buf=await off.startRendering();[ctx,score,radio,t0]=sv;return buf;};
function startSound(){ctx=new (window.AudioContext||window.webkitAudioContext)();score=RMD.Score(ctx);radio=RMD.RadioVoice(ctx,score.voice);t0=ctx.currentTime+.4;cue();}
let statLvl=0;
function soundFrame(o,holding){if(!score)return;const v=o.interf*o.interf*.3*(1-o.clear)+(holding?.16:0);if(Math.abs(v-statLvl)>.01){statLvl=v;score.params.stat.setTargetAtTime(v,ctx.currentTime,.03);}}

/* ---------------------------------------------------------------- playing: live, held frames and all */
let playing=false,holdUntil=0,lastNow=0,fpsA=0,fpsN=0,ended=false,startPerf=0;
function now(){return ctx?ctx.currentTime-t0:(performance.now()-startPerf)/1000;}
function loop(){if(!playing)return;requestAnimationFrame(loop);const t=now();if(t<0)return;
  const pn=performance.now(),dt=(pn-lastNow)/1000;lastNow=pn;if(dt<.2){fpsA+=dt;fpsN++;if(fpsA>2.5){const fps=fpsN/fpsA;if(fps<24&&PR>1){PR=1;resize();}fpsA=fpsN=0;}}
  if(t>=DUR){finish();return;}
  const o=frameAt(t);
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
  startPerf=performance.now()+400;sd=7;playing=true;lastNow=performance.now();setTimeout(()=>$('skip').classList.add('on'),3000);requestAnimationFrame(loop);}
$('go').onclick=play;$('replay').onclick=play;
$('skip').onclick=()=>finish();$('back').onclick=()=>{if(BACK)location.replace(BACK);else history.back();};
if(!BACK)$('back').textContent='BACK';

/* ---------------------------------------------------------------- ready */
teamP.then(()=>{$('load').textContent='';$('go').disabled=false;$('go').classList.add('ready');
  const o=frameAt(40);o.fade=.6;draw(40,o);
  if(REC){$('start').classList.remove('on');}window.CIN.ready=true;});
let recHold=-1,recLast=-1;
window.CIN={ready:false,DUR,LINES,
  frame(i,fps){fps=fps||30;const t=i/fps;const o=frameAt(t);const stut=Math.max(o.stut,ss(.55,1,o.interf)*.6*(1-o.clear));
    if(i<=recHold&&recLast>=0)return 'held';
    if(stut>0&&rnd()<stut*.22*(30/fps)*1.6)recHold=i+Math.max(1,Math.round((30+rnd()*rnd()*260*stut)/1000*fps));
    draw(t,o);recLast=i;return 'drawn';},
  at(t){const o=frameAt(t);draw(t,o);return o;}};
})();
