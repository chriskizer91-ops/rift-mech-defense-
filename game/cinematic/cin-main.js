'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: THE FILM (game/cinematic/cin-main.js, session D)
   2 min 44 in four parts (Christopher, 21 Nov: get to the rift sooner, stay with it longer, and let something be wrong
   before anything comes out):
     ARRIVAL        0 to 20    down through the rain; the team walks the wall; Harrow, Miller, Wren and ANVIL check in
     OMENS         20 to 40    the lamps die one by one; the foghorn chokes; the lighthouse goes out; the sea pulls back off
                               the wall; the magma under the bay beats like a heart; steam; the rain stops and drifts up;
                               the sensor's grid bends toward the rift
     EMERGENCE     40 to 113   the first dots pour slowly out of the rift; the swarm spreads, pulls together, sinks back as
                               one mass; then it rises out of the rift while the team steps back; three clear seconds;
                               ANVIL; the sea floods back; "The Signal."
     FIRST CONTACT 113 to 164  four rifts feed it; ANVIL's barrage seals one; it rises, comes ashore, and slams the water
   Every number in a frame is a function of the film's time t (plays the same every time; ?rec=1280x640 records it).
   The voices are Christopher's ElevenLabs takes on a failing radio (cin-audio.js). Hand-off: ?back=<the game's url>.
   ===================================================================================================================== */
(function(){
const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z),$=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t;
const ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const vl=(a,b,u)=>a.clone().lerp(b,u);
const K=(keys,t)=>{if(t<=keys[0][0])return keys[0][1];for(let i=0;i<keys.length-1;i++){const [a,va]=keys[i],[b,vb]=keys[i+1];if(t<b)return lerp(va,vb,ss(a,b,t));}return keys[keys.length-1][1];};
const Q=new URLSearchParams(location.search);
const REC=Q.get('rec');const BACK=Q.get('back');const DUR=164;
const D3=13.5,a3=x=>x+D3;   /* act 3 kept its timing from the 2 min 30 cut, moved 13.5 s later */
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
const sig=SIG.make();const sigG=new T.Group();sigG.position.set(-120,-380,-1150);sigG.scale.setScalar(SIGS);sigG.add(sig.pts);scene.add(sigG);
sig.pts.layers.set(1);SIG.hostMat.uniforms.uWS.value=SIGS;
const rifts=SIG.makeRifts(RIFTS.slice(1),26000);rifts.layers.set(1);scene.add(rifts);
const allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
const OTHERS=[{n:'HARROW',p:V(150,5.5,-1.5)},{n:'MILLER',p:V(-210,1.5,42)},{n:'WREN',p:V(250,5.5,-20)}];
const allyOthers=SIG.makeAllies(OTHERS.map(o=>o.p));allyOthers.layers.set(1);scene.add(allyOthers);
const GRIDC=V(-7,.4,-2);const grid=LOOK.grid(2600);grid.obj.position.copy(GRIDC);grid.obj.layers.set(1);scene.add(grid.obj);
grid.mat.uniforms.uC.value.set((RIFTS[0].x-GRIDC.x)/2600,(RIFTS[0].z-GRIDC.z)/2600);
WORLD.guns.updateMatrixWorld(true);const MUZ=WORLD.barrels.map(b=>b.localToWorld(V(0,9,0)));
const R3=V(270,0,-860);
const HITS=[V(262,0,-872),V(281,0,-850),V(268,0,-861)];
const FIRE=[.7,0,.35];MUZ.forEach((m,i)=>{const t0=a3(112.2)+FIRE[i],t1=a3(120.4)+FIRE[i]*1.15;FX.gun(m,t0);FX.shell(m,HITS[i],t0+.05,t1);FX.blast(HITS[i],t1,1.25);});
const SLAM=V(-150,0,-830);FX.ringAt(SLAM,a3(143.25));FX.blast(SLAM,a3(143.25),3.5);FX.blast(V(-95,0,-850),a3(143.35),2.2);
let teamReady=false;
const teamP=TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});teamReady=true;}).catch(e=>{console.warn('team',e);teamReady=true;});

/* ---------------------------------------------------------------- the lines: t = where the take starts, ld = its silence before the words (s), w = how long the words run, p = panic (cin-audio.js) */
const LINES=[
 {id:'M8_01_OW',t:1.6,w:4.0,who:'OVERWATCH',p:.12,tx:'Arlen Bay. Every contact on the coast is moving that way.'},
 {id:'M8_02_HARROW',t:7.3,w:2.3,who:'HARROW',p:.15,tx:'Harrow, harbour wall.'},
 {id:'M8_03_MILLER',t:10.4,w:1.6,who:'MILLER',p:.15,tx:'Miller, slipway.'},
 {id:'M8_04_WREN',t:13.4,ld:.72,w:4.5,who:'WREN',p:.2,tx:'Wren, lighthouse. It’s very quiet out there.'},
 {id:'GEN_07_ANVIL',t:18.3,w:2.2,who:'ANVIL',p:.1,tx:'ANVIL, guns up. Give me a mark.'},
 {id:'PING_01_PILOT',t:21.1,ld:.71,w:.7,who:'WRAITH',p:.1,tx:'Copy.'},
 {id:'GEN_05_OW',t:35.4,w:3.2,who:'OVERWATCH',p:.55,tx:'Okay. Okay. We can do this.'},
 {id:'C1_01_OW',t:40.3,w:3.2,who:'OVERWATCH',p:.25,tx:'New contact. Bearing zero-four-one, range two point four.'},
 {id:'C1_02_OW',t:47.4,w:4.2,who:'OVERWATCH',p:.45,tx:'Count is climbing… forty thousand… two hundred thousand…'},
 {id:'C1_03_OW',t:55.6,w:2.45,who:'OVERWATCH',p:.5,tx:'That’s more than I’ve ever seen on one screen.'},
 {id:'C1_04_OW',t:62.6,w:2.6,who:'OVERWATCH',p:.7,tx:'Sensor’s choking! It can’t resolve them!'},
 {id:'C1_05_OW',t:69.7,w:2.45,who:'OVERWATCH',p:.75,tx:'Wait. They’re not moving like a swarm.'},
 {id:'C1_06_OW',t:77.2,w:1.65,who:'OVERWATCH',p:.3,tx:'It’s one mass.'},
 {id:'C1_07_OW',t:94.2,ld:.68,w:5.0,who:'OVERWATCH',p:0,tx:'Wraith. It’s coming through clear. Nothing’s ever come through clear.'},
 {id:'C1_08_ANVIL',t:101.6,w:3.85,who:'ANVIL',p:.35,tx:'OVERWATCH, ANVIL. What am I looking at?'},
 {id:'C1_09_OW',t:108.4,ld:.89,w:.95,who:'OVERWATCH',p:.2,tx:'The Signal.'},
 {id:'M8F_01_OW',t:113.6,w:3.0,who:'OVERWATCH',p:.5,tx:'Four rifts feeding it. Close them and it gets smaller.'},
 {id:'M8F_02_ANVIL',t:120.2,w:3.4,who:'ANVIL',p:.35,tx:'Four holes. All my shells. Mark them.'},
 {id:'PING_03_PILOT',t:124.2,w:.6,who:'WRAITH',p:.3,tx:'On it.'},
 {id:'GEN_08_ANVIL',t:125.2,w:3.55,who:'ANVIL',p:.45,tx:'Shot, over! Twenty seconds! Don’t stand there!'},
 {id:'GEN_09_ANVIL',t:135.0,w:.93,who:'ANVIL',p:.4,tx:'Splash.'},
 {id:'M8F_03_OW',t:136.8,w:3.35,who:'OVERWATCH',p:.35,tx:'A hundred thousand, gone.'},
 {id:'M8F_05_OW',t:143.4,w:2.2,who:'OVERWATCH',p:.65,tx:'It’s coming ashore. And it’s changing!'},
 {id:'M8F_06_OW',t:147.8,w:3.3,who:'OVERWATCH',p:.8,tx:'It’s standing up! Stay low, stay out of the air!'},
 {id:'C1_10_PILOT',t:157.3,w:2.07,who:'WRAITH',p:.55,tx:'Here it comes.'}];
LINES.forEach(L=>{if(L.ld==null)L.ld=.5;});

/* ---------------------------------------------------------------- the team: the walk (arrival) and the steps back (emergence) */
const WALK0=.5,WALKD=46,WALKT=19;
const BACKS=[[[63,64.4,1.6],[88,91.5,2.2]],[[88.4,91.5,2.6]],[[86.6,88,1.3],[89,91.6,1.6]],[[88.8,91.8,2.4]]];
function team(t){return [0,1,2,3].map(k=>{const s=TEAM.SPOTS[k],t0=WALK0+k*.45;const u=clamp((t-t0)/WALKT,0,1);
  const d=WALKD*(1-Math.cos(Math.PI*u))/2,spd0=u>0&&u<1?WALKD*Math.PI/(2*WALKT)*Math.sin(Math.PI*u):0;
  let back=0,bs=0;for(const [b0,b1,m] of BACKS[k]){const v=ss(b0,b1,t);back+=m*v;if(t>b0&&t<b1)bs=Math.max(bs,m/(b1-b0)*1.5);}
  const turn=ss(t0+WALKT,t0+WALKT+1.8,t);
  return {x:s.x+WALKD-d,z:s.z+back,yaw:lerp(Math.PI/2,0,turn),dist:d-back,spd:Math.max(spd0,bs)};});}
const leadX=t=>team(t)[0].x;
/* the lamps die from both ends of the wall toward the team */
const LAMPX=[];for(let x=-240,i=0;x<=230;x+=40,i++)if(i%4!==2)LAMPX.push(x);
const LDIE={};LAMPX.slice().sort((a,b)=>Math.abs(b+7)-Math.abs(a+7)).forEach((x,i,arr)=>LDIE[x]=22.6+i/(arr.length-1)*3.9);
const hsh=n=>{const s=Math.sin(n)*43758.5453;return s-Math.floor(s);};
function lampK(x,t){const td=LDIE[x];if(td==null)return 1;if(t<td-.4)return 1;if(t>=td)return 0;return hsh(Math.floor(t*28)+x)>.45?1:.1;}
function beamK(t){if(t<28.9)return 1;if(t>=30.2)return 0;return hsh(Math.floor(t*20)*3.1)>.5?1:.05;}
/* the heart under the bay: beats that come faster */
const BEATS=[];for(let t=30.6,iv=1.0;t<40;t+=iv,iv=Math.max(.5,iv*.93))BEATS.push(t);
const beatAt=t=>{let v=0;for(const b of BEATS)if(t>=b)v=Math.max(v,Math.exp(-(t-b)*5));return v;};
/* the rain: how far it has fallen (it stops, then drifts upward) */
const RAINV=t=>K([[0,1],[33.8,1],[35.6,0],[38,-.32],[80,-.32],[83,1]],t);
const FALL=[0];for(let i=1;i<=DUR*20+20;i++)FALL.push(FALL[i-1]+RAINV((i-.5)/20)/20);
const fallAt=t=>{const i=clamp(t*20,0,FALL.length-2),j=Math.floor(i);return lerp(FALL[j],FALL[j+1],i-j);};

/* ---------------------------------------------------------------- the shots */
const sh3=(t,a,b,k)=>t>a3(a)&&t<a3(b)?k*(1-ss(a3(a),a3(b),t)):0;
const SHOTS=[
 /* ARRIVAL */
 {t0:0,t1:7,name:'OVERWATCH · ORBITAL',f:u=>{const k=ease(u);return {p:vl(V(520,520,960),V(150,100,220),k),l:vl(V(0,0,-300),V(10,6,-10),k),fov:40};}},
 {t0:7,t1:14,name:'KESTREL · OPTICAL',f:(u,t)=>{const x=leadX(t);return {p:V(x-17,lerp(7.4,9.6,u),lerp(-5.4,-6.4,u)),l:V(x+8,9.6,1),fov:42,shake:.03};}},
 {t0:14,t1:20,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(-300,1650,-40),V(-300,1540,-70),u),l:V(-300,0,-260),fov:52})},
 /* OMENS */
 {t0:20,t1:27,name:'HALE · OPTICAL',f:u=>({p:vl(V(64,8.2,-1),V(60,8,-1.5),ease(u)),l:vl(V(-200,11,6),V(-220,12,4),u),fov:34})},
 {t0:27,t1:33,name:'HARROW · OPTICAL',f:u=>({p:vl(V(196,9.6,6),V(203,9.4,2),u),l:vl(V(250,30,-24),V(80,-5,-10),ease(ss(.42,1,u))),fov:40})},
 {t0:33,t1:40,name:'— — —',cuts:[[33.0,{p:V(-34,-6,-66),l:V(-8,4,-3),fov:46,real:1}],[36.6,{p:V(-16,7.4,-5),l:V(-60,8,-600),fov:46,real:1}]]},
 /* EMERGENCE */
 {t0:40,t1:47,name:'WRAITH · SENSOR',f:u=>({p:vl(V(-8,13,4),V(-8.4,13.2,2.5),u),l:vl(V(-120,20,-1150),V(-120,70,-1150),ease(u)),fov:lerp(13,11,u)})},
 {t0:47,t1:55,name:'WRAITH · OPTICAL ▸ SENSOR',f:u=>({p:vl(V(-5.4,12.6,3.6),V(-7.6,13.3,-6.5),ease(u)),l:V(-115,110,-1150),fov:lerp(30,26,ease(u))})},
 {t0:55,t1:62,name:'OVERWATCH · ORBITAL',f:u=>({p:vl(V(720,1220,360),V(540,1120,150),u),l:V(-150,0,-1020),fov:44})},
 {t0:62,t1:69,name:'HALE · OPTICAL',f:u=>({p:vl(V(36,8.6,5.2),V(32,8.2,3.6),ease(u)),l:vl(V(-22,11,-6),V(-40,40,-90),ease(ss(.25,1,u))),fov:36,shake:.05+u*.08})},
 {t0:69,t1:76,name:'— — —',cuts:[
   [69.0,{p:V(-6,13,6),l:V(-120,120,-1150),fov:26}],[70.5,{p:V(-24.6,7.3,-7.2),l:V(-21,12.3,-1.5),fov:30,real:.9}],
   [71.8,{p:V(260,330,-480),l:V(-120,100,-1150),fov:38}],[73.2,{p:V(-6,13,6),l:V(-120,140,-1150),fov:16}],[74.5,{p:V(-7,9.2,22),l:V(-60,40,-1150),fov:30,real:.9}]]},
 {t0:76,t1:82,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(70,15,300),V(68,14.6,290),u),l:V(-112,60,-1150),fov:lerp(21,19,u)})},
 {t0:82,t1:94,name:'— RISING —',cuts:[
   [82.0,{p:V(-30,1.2,-46),l:V(-120,150,-1150),fov:24,real:.95}],[86.5,{p:V(9.5,9.4,4.6),l:V(-129,125,-1150),fov:34,real:.9}],
   [90.0,{p:V(300,120,-520),l:V(-120,170,-1150),fov:40,real:.7}]]},
 {t0:94,t1:101,name:'WRAITH · SENSOR · LOCK',f:u=>({p:vl(V(-2,10,26),V(-4,10.6,13),ease(u)),l:V(-115,200,-1150),fov:lerp(25,17,ease(u))})},
 {t0:101,t1:107,name:'ANVIL · BATTERY',f:u=>({p:vl(V(-866,89.4,263),V(-870,90.4,258),u),l:V(-130,175,-1150),fov:30})},
 {t0:107,t1:113,name:'WRAITH · THERMAL',f:u=>({p:vl(V(-0.6,6.5,7.2),V(-1.1,6.3,6.2),u),l:V(-62,96,-600),fov:lerp(36,31,u)})},
 /* FIRST CONTACT */
 {t0:113,t1:120,name:'WRAITH · SENSOR',f:u=>({p:vl(V(-40,12,9),V(25,12.5,9),u),l:V(-60,150,-1150),fov:34})},
 {t0:120,t1:127,name:'ANVIL · BATTERY',f:(u,t)=>({p:vl(V(-862,88.4,250),V(-860,88,247),u),l:V(-120,210,-900),fov:42,shake:t>a3(112.15)&&t<a3(113.3)?.5*(1-ss(a3(112.2),a3(113.3),t)):0})},
 {t0:127,t1:134.5,name:'WRAITH · OPTICAL',f:u=>({p:vl(V(-3,8.5,14),V(-2,8.2,11),u),l:vl(V(-420,520,-260),V(262,40,-866),ease(ss(.15,.95,u))),fov:lerp(52,30,ease(u))})},
 {t0:134.5,t1:141,name:'WRAITH · OPTICAL',f:(u,t)=>({p:vl(V(-6,13,8),V(-5,13.2,4),u),l:V(268,70,-862),fov:lerp(20,17,u),shake:t<a3(122.5)?.35*(1-ss(a3(121),a3(122.5),t)):0})},
 {t0:141,t1:147.5,name:'WRAITH · SENSOR',f:(u,t)=>({p:vl(V(58,7,32),V(55,6.6,26),u),l:V(-100,215,-1050),fov:lerp(28,24,u),shake:t>a3(128.2)&&t<a3(130)?.25:0})},
 {t0:147.5,t1:154.5,name:'— TEAM —',cuts:[
   [147.5,{p:V(-31,9.2,4.5),l:V(-19,11.8,-6.5),fov:40,real:.9}],[149.25,{p:V(15.5,8.4,-3.8),l:V(5,11.2,-2.2),fov:34,real:.9}],
   [151.0,{p:V(28,13,5),l:V(18,10.2,-5),fov:38,real:.9}],[152.75,{p:V(-4.6,11.8,3.4),l:V(-90,170,-980),fov:30,real:.7}]]},
 {t0:154.5,t1:164,name:'WRAITH · THERMAL',f:(u,t)=>{const k=ease(ss(.4,.92,u));return {p:vl(V(-0.6,6.5,7.2),V(-7,82,52),k),l:vl(V(-62,110,-600),V(-7,0,-3),k),fov:lerp(33,42,k),shake:t>a3(143.2)&&t<a3(145.5)?.9*(1-ss(a3(143.2),a3(145.5),t)):0};}}];
function shotAt(t){for(const s of SHOTS)if(t<s.t1)return s;return SHOTS[SHOTS.length-1];}
const per=(t,vals)=>{for(let i=0;i<SHOTS.length;i++)if(t<SHOTS[i].t1)return vals[i];return vals[vals.length-1];};

/* ---------------------------------------------------------------- the tracks */
function tracks(t){const o={};
  /* the count: the dots that have come through */
  o.count=t<47?K([[0,0],[40,0],[41,40],[47,3000]],t):t<55?3000+Math.pow(ss(47,55,t),1.6)*197000:t<62?lerp(200000,600000,ss(55,62,t)):t<69?lerp(600000,850000,ss(62,69,t)):t<a3(122)?lerp(850000,1000000,ss(69,74,t)):lerp(1000000,900000,ss(a3(122),a3(124.5),t));
  /* the sea, and the Signal under it */
  o.water=K([[0,0],[29.5,0],[37,-11],[106,-11],[116,0]],t);
  o.sigY=K([[0,-380],[81,-380],[82.5,-270],[94,-150],[98.5,0]],t);
  /* the swarm: a column out of the rift, spreading, pulling together, sinking back in as one */
  o.cr=K([[0,.04],[40,.04],[47,.07],[55,.5],[62,1],[69,1],[76,.25],[80,.05]],t);
  o.col=K([[0,30],[40,30],[47,45],[55,120],[62,75],[76,40],[80,12]],t);
  o.res=t<79?0:ss(79,82,t);
  o.q=t<a3(99.5)?K([[0,.4],[47,.6],[69,1.4],[76,1.4],[80,.3],[82,.15],[94,.05],[101,.02],[107,.12]],t):K([[a3(99.5),.12],[a3(127),.15],[a3(134),.3],[a3(150),.4]],t);
  /* the picture */
  o.interf=K([[0,.06],[22,.07],[27,.12],[33,.2],[38,.3],[40,.15],[47,.12],[55,.3],[62,.42],[68.5,.66],[69,.7],[76,.5],[78,.18],[82,.35],[90,.52],[93.8,.3],[94.2,0],[99.4,.05],[101,.22],[113,.2],
    [a3(113.5),.16],[a3(121),.3],[a3(127.5),.3],[a3(134),.3],[a3(141),.4],[a3(143.2),.62],[a3(146),.45],[a3(149),1],[DUR,1]],t);
  if(t>69&&t<76)o.interf+=.14*Math.max(0,Math.sin(t*9.3));if(t>82&&t<94)o.interf+=.1*Math.max(0,Math.sin(t*6.7));if(t>a3(134)&&t<a3(141))o.interf+=.05*Math.max(0,Math.sin(t*5.1));
  o.stut=t<55?0:t<62?ss(55,62,t)*.15:t<69?lerp(.35,.8,ss(62,69,t)):t<76?1:t<78?.25:t<82?.05:t<94?.35:t<101?0:t<a3(127)?.1:t<a3(141)?lerp(.2,.5,ss(a3(127),a3(141),t)):lerp(.5,.9,ss(a3(141),a3(149),t));
  o.clear=ss(94.1,94.3,t)*(1-ss(98.6,100.8,t));
  o.mode=((t>=107&&t<113)||(t>=a3(141)&&t<a3(143.3)))?1:0;
  o.real=per(t,[1,1,.3,1,1,1,.9,lerp(1,.6,ss(47,55,t)),.16,.85,.45,.75,.85,.55,1,.8,.5,1,1,.9,.6,.85,.8]);
  o.mono=per(t,[0,0,1,0,0,0,.15,lerp(0,.4,ss(47,55,t)),1,.2,.4,.3,.25,.5,0,0,.4,0,0,0,.35,0,0]);
  o.wexp=per(t,[1.15,1.1,1,1.1,1.15,1.15,1.15,1.1,1,1.15,1.15,1.15,1.15,1.05,1.25,1,1.1,1.25,1.15,1.1,1.1,1.15,1]);
  o.grid=per(t,[0,.15,2.4,.3,.2,lerp(.3,1.1,ss(34,39,t)),.6,lerp(.5,1,ss(47,52,t)),1,.6,.6,.25,.3,.25,.35,.35,.6,.3,.25,.3,.5,.4,.35]);
  o.warp=K([[0,0],[33,0],[39,1],[76,1],[82,.4],[113,.3]],t);
  o.dots=1;o.fade=ss(DUR-.6,DUR,t)+(1-ss(0,1.6,t));
  /* the omens: the lamps, the lighthouse, the heart under the bay, steam, rain */
  o.beam=beamK(t);o.steam=K([[0,0],[31,0],[38,1],[100,1],[112,.25]],t);o.fall=fallAt(t);
  const hb=beatAt(t);
  o.glow=K([[0,.55],[30,.6],[40,1.1],[70,1],[96.5,1],[97.1,1.5],[98.5,1],[a3(143.1),1],[a3(143.4),1.6],[a3(146),1.1]],t)+hb*1.4*ss(30,32,t)+(t>40&&t<44?.9*Math.sin((t-40)/4*Math.PI):0);
  o.r0=1.4+(t>39.5&&t<46?1.8*Math.sin((t-39.5)/6.5*Math.PI):0);   /* the rift itself flares as it opens */
  o.k3=1-ss(a3(121),a3(124.5),t);
  /* the Signal */
  o.yaw=lerp(.62,0,ease(ss(107,111.5,t)));
  o.f1=ss(a3(127.5),a3(131.5),t)*(1-.25*ss(a3(143.1),a3(144),t));o.f2=0;o.f0=1-o.f1;
  o.raise=ss(a3(141.3),a3(143.0),t)*(1-ss(a3(143.05),a3(143.3),t));o.slam=ss(a3(143.05),a3(143.25),t)*(1-ss(a3(144.4),a3(147),t));
  o.roar=ss(a3(127.8),a3(128.6),t)*(1-ss(a3(130.4),a3(131.6),t))+ss(a3(142.1),a3(142.8),t)*(1-ss(a3(144.5),a3(146),t))+ss(84,86,t)*(1-ss(91,94,t))*.35;
  o.ag=ss(a3(127),a3(128.5),t)+ss(84,88,t)*(1-ss(92,96,t))*.6;
  o.pulse=.5+.5*Math.sin(t*1.6);if(t>96.7&&t<98.5)o.pulse=Math.max(o.pulse,1-Math.abs(t-97.2)/1.2);if(t>a3(143.2))o.pulse=Math.max(o.pulse,1-ss(a3(143.2),a3(144.6),t));
  o.flash=t>a3(143.25)&&t<a3(144.2)?.3*(1-ss(a3(143.25),a3(144.2),t)):0;
  o.sigZ=lerp(-1150,-900,ease(ss(a3(128),a3(148),t)));
  o.range=t<107?lerp(2.4,1.1,ss(40,107,t)):lerp(1.1,.85,ss(a3(128),a3(148),t));
  /* the team: heads turn to the lamps, the lighthouse, the sea; then up, and up, as it rises */
  const up=ss(62,67,t)*.2+ss(83,94,t)*.42-ss(107,110,t)*.1-ss(a3(127),a3(131),t)*.1+ss(a3(131),a3(134),t)*.25-ss(30,34,t)*.18+ss(38,41,t)*.18;
  const yawAll=ss(23,24.2,t)*.35-ss(26,27,t)*.35-ss(27.5,28.6,t)*.4+ss(32,33.5,t)*.4;
  const aim=-.32*Math.max(ss(87.5,90,t)*(1-ss(107,110,t)),ss(a3(134.5),a3(137),t));
  o.look=[0,1,2,3].map(k=>({pitch:up*(1+k*.04),yaw:yawAll+(k-1.5)*-.05*ss(62,67,t),torso:yawAll*.4,aim}));
  o.team=team(t);
  return o;}
function hostClock(t){if(t<76)return t;if(t<80)return 76+(t-76)*.25;return 77+(t-80);}

/* ---------------------------------------------------------------- HUD: tags over things, captions, readouts */
const hud={cnt:$('cnt'),conf:$('conf'),confb:$('confb'),cap:$('cap'),cam:$('camn'),rng:$('rng'),tc:$('tc'),stamp:$('stamp'),lock:$('lock')};
const TAGS=[];const tag=(text,cls,pos,when)=>{const el=document.createElement('div');el.className='hud tag '+(cls||'');el.textContent=text;stage.appendChild(el);TAGS.push({el,pos,when});};
TEAM.NAMES.forEach((n,k)=>tag(n,'',o=>V(o.team[k].x,14.4,o.team[k].z),t=>(t>=7&&t<14)||(t>=20&&t<26)||(t>=62&&t<69)));
tag('WRAITH TEAM','',o=>V(o.team[1].x-60,14,o.team[1].z+30),t=>t>=14&&t<20);
OTHERS.forEach(o=>tag(o.n,'',()=>o.p.clone().setY(o.p.y+9),t=>t>=14&&t<20));
tag('ANVIL','amber',()=>V(-850,96,232),t=>(t>=14&&t<20));
tag('RIFT 1 · ACTIVE','red mark',()=>V(RIFTS[0].x,25,RIFTS[0].z),t=>t>=41&&t<47);
RIFTS.forEach((r,i)=>tag('RIFT '+(i+1),'red',()=>V(r.x,40,r.z),t=>(t>=a3(101)&&t<a3(106.5))));
tag('MARK · RIFT 4','red mark',()=>V(R3.x,30,R3.z),t=>t>=a3(110.6)&&t<a3(121.2));
tag('SEALED','green mark',()=>V(R3.x,30,R3.z),t=>t>=a3(124)&&t<a3(127.5));
let capTxt=null;
function setCap(t){let l=null;for(const L of LINES)if(t>=L.t+L.ld-.05&&t<L.t+L.ld+L.w+.7)l=L;const s=l?`<b>${l.who}</b> ${l.tx}`:'';if(s!==capTxt){capTxt=s;hud.cap.innerHTML=s;}}
function updHud(t,o){hud.cnt.textContent=Math.floor(o.count).toLocaleString('en-US');
  const conf=clamp(1-o.interf*.95-(t>47&&t<82?(1-o.res)*.35:0)-o.warp*.15*(t<94?1:0),0,1);hud.conf.style.width=(conf*100).toFixed(0)+'%';hud.confb.classList.toggle('bad',conf<.45);
  const s=shotAt(t);hud.cam.textContent=s.name;hud.rng.textContent=t<40?'— —':o.range.toFixed(1)+' KM';
  const sec=Math.floor(t),fr=Math.floor((t-sec)*24),ts=49*60+30+sec;hud.tc.textContent=`23:${String(Math.floor(ts/60)).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}:${String(fr).padStart(2,'0')}`;
  hud.stamp.classList.toggle('on',t>109.2&&t<112.6);hud.lock.classList.toggle('on',o.clear>.5);
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
  cam.updateMatrixWorld();
  /* the Signal */
  sigG.position.set(-120,o.sigY,o.sigZ);sigG.rotation.y=o.yaw;
  const ht=hostClock(t);const op=tracks(Math.max(0,t-.5));SIG.pose(ht,o,op);
  const U=SIG.hostMat.uniforms,th=o.mode>.5;U.uRes.value=o.res;U.uQ.value=o.q;U.uCR.value=o.cr;U.uCol.value=o.col;U.uClipY.value=o.water;
  U.uCloud.value.set(0,(o.water-o.sigY)/SIGS+1,0);
  sig.geo.setDrawRange(0,Math.floor(o.count));
  U.uGain.value=(th?.0022:.06)*(LOOK.HALF?1:2.5)*(1-.45*ss(77,79,t)*(1-ss(81,83,t)));U.uCG.value=th?3:(t<62?4:7);U.uSize.value=th?2.2:.38;U.uMin.value=th?2.2:1.1;U.uMax.value=th?30:5;U.uSoft.value=th?1:0;
  const S=(H*PR)/(2*Math.tan(cam.fov*Math.PI/360));U.uScale.value=S;
  const RU=SIG.riftMat.uniforms;RU.uT.value=t;RU.uScale.value=S;RU.uSoft.value=th?1:0;RU.uGain.value=(th?.004:.05)*(LOOK.HALF?1:2.5)*(1-.6*ss(76,82,t))*ss(52,66,t);RU.uSize.value=th?6:1.6;RU.uMax.value=th?30:7;RU.uQ.value=o.q;
  RU.uFeed.value=ss(60,90,t);RU.uK.value.set(1,1,o.k3);RU.uTo.value.set(-120,o.sigY+95*SIGS,o.sigZ);
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=S;AU.uGain.value=lerp(.35,1,1-o.real)+(t>=14&&t<20?1.5:0);
  o.team.forEach((m,k)=>allyTeam[k].position.set(m.x,0,m.z));
  grid.obj.visible=o.grid>.01;grid.mat.uniforms.uK.value=o.grid;grid.mat.uniforms.uWarp.value=o.warp;grid.mat.uniforms.uT.value=t;
  /* the world, the team, fire and water */
  RIFTS[0].k=o.r0;RIFTS[3].k=.8*o.k3;WORLD.setRifts(RIFTS);
  WORLD.update(t,o.glow,{lamp:x=>lampK(x,t),beam:o.beam,water:o.water,steam:o.steam,fall:o.fall});
  if(teamReady)TEAM.pose(t,o.look,o.team);
  if(WORLD.rain)WORLD.rain.uniforms.uAmt.value=t<34?1.1:t<100?.8:.8;
  FX.update(t,cam,S);
  updHud(t,o);
  return o;}
function draw(t,o){const pix=1+Math.floor(ss(.62,1,o.interf)*(1-o.clear)*6)*PR;
  LOOK.render(scene,cam,{real:o.real,mono:o.mono,mode:o.mode,interf:o.interf,pix,flash:o.flash,clear:o.clear,fade:o.fade,exp:.75,wexp:o.wexp,dots:o.dots,t});}

/* ---------------------------------------------------------------- sound */
let ctx=null,score=null,radio=null,t0=0;
const VOICE=window.CIN_VOICE||{};
const b64buf=u=>{const s=atob(u.slice(u.indexOf(',')+1)),x=new Uint8Array(s.length);for(let i=0;i<s.length;i++)x[i]=s.charCodeAt(i);return x.buffer;};
const RAMP=(par,keys,A)=>{par.setValueAtTime(keys[0][1],A(keys[0][0]));for(let i=1;i<keys.length;i++)par.linearRampToValueAtTime(keys[i][1],A(keys[i][0]));};
function cue(){const A=t=>t0+t,P=score.params,S=score;
  /* beds */
  RAMP(P.wind,[[0,0],[3,.3],[29.5,.3],[31,.08],[40,.2],[76,.2],[76.2,.02],[82,.02],[86,.14],[94,.14],[94.2,.03],[100,.1],[101.5,.42],[107,.22],[a3(140),.3],[DUR,0]],A);
  RAMP(P.sea,[[0,0],[3,.3],[29.5,.3],[33,.08],[37,.04],[105.5,.04],[110,.32],[a3(140),.24],[DUR,0]],A);
  RAMP(P.rain,[[0,0],[2,.07],[33.8,.07],[35.6,0],[100,0],[102,.04],[DUR,0]],A);
  RAMP(P.buzz,[[0,0],[2,.035],[22.4,.035],[26.6,0]],A);
  RAMP(P.hum,[[0,0],[30.5,0],[40,.14],[76,.2],[76.15,0],[81.8,0],[82.4,.12],[93.8,.2],[94.1,0]],A);
  RAMP(P.rise,[[0,0],[47,0],[54.9,.12],[56,.03],[62,0]],A);
  P.riseF.setValueAtTime(1400,A(47));P.riseF.exponentialRampToValueAtTime(6200,A(54.9));
  RAMP(P.pad,[[0,0],[7,.05],[20,.07],[29,.035],[40,.06],[76.05,.13],[76.2,0],[81.8,0],[82.3,.07],[93.8,.17],[94.1,0],[94.3,0],[98,.05],[a3(99),.12],[a3(112),.08],[a3(142.4),.14],[a3(142.6),0],[a3(143.2),0],[a3(144),.1],[a3(149.5),0]],A);
  P.padF.setValueAtTime(110,A(0));P.padF.exponentialRampToValueAtTime(240,A(20));P.padF.exponentialRampToValueAtTime(160,A(30));P.padF.exponentialRampToValueAtTime(480,A(76));
  P.padF.setValueAtTime(140,A(82));P.padF.exponentialRampToValueAtTime(1100,A(93.8));P.padF.setValueAtTime(160,A(94.3));P.padF.exponentialRampToValueAtTime(900,A(a3(99)));P.padF.exponentialRampToValueAtTime(1400,A(a3(142)));
  RAMP(P.str,[[0,0],[47,0],[55,.05],[76.05,.11],[76.2,0],[82,0],[93.8,.13],[94.1,0],[107,0],[109.5,.06],[a3(112),.03],[a3(127.5),.1],[a3(142.4),.13],[a3(142.6),0]],A);
  P.strF.setValueAtTime(600,A(47));P.strF.exponentialRampToValueAtTime(1500,A(76));P.strF.setValueAtTime(500,A(82));P.strF.exponentialRampToValueAtTime(1900,A(93.8));P.strF.setValueAtTime(700,A(107));P.strF.exponentialRampToValueAtTime(1800,A(a3(142.4)));
  /* arrival: the foghorn, a few plucked notes, the team's footsteps */
  S.horn(A(.8),.55,2.2);
  [[2,293.7],[4,349.2],[6,440],[8.6,392],[11,349.2],[13,329.6],[15.2,293.7],[17.5,220],[19.5,261.6]].forEach(([tt,f],i)=>S.pluck(A(tt),f,.9,i%2?.25:-.25));
  for(let k=0;k<4;k++){const st=WALK0+k*.45;for(let tt=st+.7,i=0;tt<st+WALKT-.6;tt+=.58+.05*Math.sin(i*1.7),i++){const near=k===1?1:.55;S.step(A(tt),[-.55,-.2,.2,.55][k],near*(.6+.4*Math.sin(Math.PI*(tt-st)/WALKT)));}
    S.servo(A(st+WALKT+.1),[-.55,-.2,.2,.55][k],.8);}
  /* omens: every lamp dies, the horn chokes, the sea drains, the heart under the bay */
  for(const x of LAMPX)S.pop(A(LDIE[x]),clamp((x+7)/200,-.9,.9),1-Math.min(.7,Math.abs(x+7)/400));
  S.servo(A(23.1),-.3,.7);S.servo(A(27.6),.5,.7);
  S.horn(A(27.2),.65,1.7,true);
  S.drain(A(29.5),8.5);
  for(const b of BEATS)S.beat(A(b),.55+.5*ss(30,40,b));
  S.servo(A(33.4),0,.6);
  /* emergence */
  S.note(A(40.2),7);S.servo(A(63.1),-.5,1);S.servo(A(70.6),-.4,1);
  S.note(A(77.6),5);
  S.moan(A(82.2),11.5);S.taiko(A(84.2),.6,0);S.taiko(A(88.4),.75,0);S.taiko(A(91.6),.9,0);
  S.servo(A(86.7),.3,1);S.servo(A(88.5),-.2,1);S.servo(A(89.1),.4,.8);
  [94.6,95.8,97.0,98.2,99.4].forEach((b,i)=>S.beat(A(b),i===2?1.6:.8));
  S.wash(A(105.5),10);S.hit(A(109.3),.6);
  /* first contact: the barrage */
  [0,1,2].forEach(i=>{S.boom(A(a3(112.2)+FIRE[i]),-.3+i*.1,1);S.whistle(A(a3(117.6)+FIRE[i]*1.15),2.8,.35,1);S.blast(A(a3(120.4)+FIRE[i]*1.15),.45,1);});
  S.stab(A(a3(124.1)),.55);S.pluck(A(a3(124.1)),440,1,0);S.pluck(A(a3(124.6)),587.3,.8,.2);
  S.roar(A(a3(128.2)),4);[127.6,128.85,130.1].forEach((tt,i)=>S.taiko(A(a3(tt)),.7+i*.2,(i-1)*.3));
  const BT=.625;for(let b=0;b<19;b++){const tb=a3(131)+b*BT;if(tb>=a3(142.4))break;const bar=Math.floor(b/4),q=b%4,lvl=.55+.45*Math.min(1,b/12);
    if(q===0||q===2)S.kick(A(tb),lvl);if(q===3)S.kick(A(tb+BT/2),lvl*.7);if(q===0)S.taiko(A(tb),lvl,(bar%2?.3:-.3));if(b>=8&&(q===1||q===3))S.snare(A(tb),lvl);
    const notes=[36.71,36.71,43.65,36.71,32.7,36.71,27.5,36.71];for(let e=0;e<2;e++)S.bass(A(tb+e*BT/2),notes[(q*2+e)%8],BT/2*.9,lvl);
    if(q===0&&b>=8)S.stab(A(tb),.35+.1*bar);}
  S.riser(A(a3(138.2)),4.9);S.roar(A(a3(142.3)),4.2);S.hit(A(a3(143.2)),1.2);S.note(A(a3(143.2)),6.2);
  /* the radio: every line, the music dipping under it (less under the panicked ones) */
  const ps=[],c=ctx,rd=radio;for(const L of LINES){S.duck(A(L.t+L.ld-.1),A(L.t+L.ld+L.w),.55-.3*L.p);const b=VOICE[L.id];if(!b)continue;
    ps.push(Promise.resolve(b).then(b64buf).then(a=>c.decodeAudioData(a)).then(buf=>rd.play(buf,A(L.t),{panic:L.p})).catch(e=>console.warn('voice',L.id,e)));}
  return ps;}
window.CIN_AUDIO=async function(){const off=new OfflineAudioContext(2,Math.ceil(44100*DUR),44100);const sv=[ctx,score,radio,t0];
  ctx=off;score=RMD.Score(off);radio=RMD.RadioVoice(off,score.voice);t0=0;const ps=cue();
  for(let t=0;t<DUR;t+=.05){const o=tracks(t),v=o.interf*o.interf*.3*(1-o.clear)+(rnd()<Math.max(o.stut,ss(.55,1,o.interf)*.6*(1-o.clear))*.22?.16:0);score.params.stat.setValueAtTime(v,t);}
  await Promise.all(ps);const buf=await off.startRendering();[ctx,score,radio,t0]=sv;return buf;};
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
  const o=frameAt(22);o.fade=.6;draw(22,o);
  if(REC){$('start').classList.remove('on');}window.CIN.ready=true;});
let recHold=-1,recLast=-1;
window.CIN={ready:false,DUR,LINES,
  frame(i,fps){fps=fps||30;const t=i/fps;const o=frameAt(t);const stut=Math.max(o.stut,ss(.55,1,o.interf)*.6*(1-o.clear));
    if(i<=recHold&&recLast>=0)return 'held';
    if(stut>0&&rnd()<stut*.22*(30/fps)*1.6)recHold=i+Math.max(1,Math.round((30+rnd()*rnd()*260*stut)/1000*fps));
    draw(t,o);recLast=i;return 'drawn';},
  at(t){const o=frameAt(t);draw(t,o);return o;}};
})();
