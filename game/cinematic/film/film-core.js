'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: THE SCENE RUNNER (game/cinematic/film/film-core.js, session D)
   The reveal's engine with the reveal taken out, so every piece of the film is one data file (a "scene"):
     FILM.run(SC)   SC = {id, DUR, place, start:{org,t,sub}, end:{org,t,sub}, LINES, SHOTS, TAGS,
                          build(scene, FILM) -> Promise, tracks(t) -> o, apply(t, o, cam, px), cue(score, A, FILM)}
   o (the scene's tracks at time t) drives the picture: real, mono, mode (0 sensor / 1 thermal), interf, stut, clear, fade,
   wexp, flash, count (the dot count), range (km or null), title ({k, org, t, sub} for a card over the picture).
   Every value is a function of t, so live play and recorded frames match (?rec=WxH; window.CIN.frame / at / seek).
   Scenes that simulate (A's swarm) step their sim to t at a fixed step; Math.random is seeded here so a run is the same
   every time. The look is game/cinematic/cin-look.js; the radio and the score are cin-audio.js (plus film/film-sfx.js).
   ===================================================================================================================== */
/* a seeded Math.random for the whole page: the swarm, the radio's crackle, everything (FILM.reseed(n) restarts it) */
(function(){let s=12345;Math.random=function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};window.__reseed=n=>{s=n%2147483647||1;};})();
const FILM=(function(){
const T=THREE,F={};
F.V=(x,y,z)=>new T.Vector3(x,y,z);F.clamp=(x,a,b)=>Math.min(b,Math.max(a,x));F.lerp=(a,b,t)=>a+(b-a)*t;
F.ss=(a,b,x)=>{const t=F.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};F.ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
F.vl=(a,b,u)=>a.clone().lerp(b,u);
F.K=(keys,t)=>{if(t<=keys[0][0])return keys[0][1];for(let i=0;i<keys.length-1;i++){const [a,va]=keys[i],[b,vb]=keys[i+1];if(t<b)return F.lerp(va,vb,F.ss(a,b,t));}return keys[keys.length-1][1];};
F.hash=n=>{const s=Math.sin(n)*43758.5453;return s-Math.floor(s);};
F.reseed=n=>window.__reseed(n);
F.run=function(SC){
const {V,clamp,lerp,ss}=F,$=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search);const REC=Q.get('rec');const BACK=Q.get('back');const DUR=SC.DUR;F.DUR=DUR;
let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};
/* the page's words */
const setTxt=(id,s)=>{const e=$(id);if(e&&s!=null)e.innerHTML=s;};
if(SC.start){setTxt('s_org',SC.start.org);setTxt('s_t',SC.start.t);setTxt('s_sub',SC.start.sub);}
if(SC.end){setTxt('e_org',SC.end.org);setTxt('e_t',SC.end.t);setTxt('e_sub',SC.end.sub);}
setTxt('place',SC.place);if(SC.pageTitle)document.title=SC.pageTitle;
/* the stage: a 2:1 band, letterboxed */
const stage=$('stage'),cv=document.createElement('canvas');stage.prepend(cv);
const R=new T.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance',alpha:false,preserveDrawingBuffer:!!REC});
let PR=REC?1:Math.min(window.devicePixelRatio||1,1.75);LOOK.init(R);
const scene=new T.Scene(),cam=new T.PerspectiveCamera(40,2,.3,20000);let W=2,H=1;
function resize(){let w,h;if(REC){[w,h]=REC.split('x').map(Number);}else{const sw=innerWidth,sh=innerHeight;w=sw;h=Math.round(sw/2);if(h>sh){h=sh;w=sh*2;}}
  W=w;H=h;stage.style.width=w+'px';stage.style.height=h+'px';R.setPixelRatio(PR);R.setSize(w,h,false);LOOK.resize(Math.floor(w*PR),Math.floor(h*PR));cam.aspect=w/h;cam.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
F.scene=scene;F.cam=cam;F.renderer=R;
/* lines: t = where the take starts, ld = its silence before the words, w = how long the words run, p = panic */
const LINES=SC.LINES||[];LINES.forEach(L=>{if(L.ld==null)L.ld=.5;if(L.p==null)L.p=.15;});
const SHOTS=SC.SHOTS;
const shotAt=t=>{for(const s of SHOTS)if(t<s.t1)return s;return SHOTS[SHOTS.length-1];};F.shotAt=shotAt;
F.shotIndex=t=>{for(let i=0;i<SHOTS.length;i++)if(t<SHOTS[i].t1)return i;return SHOTS.length-1;};
/* HUD */
const hud={log:$('log'),cnt:$('cnt'),conf:$('conf'),confb:$('confb'),cap:$('cap'),cam:$('camn'),rng:$('rng'),tc:$('tc'),title:$('title')};
const TAGS=[];const tag=(text,cls,pos,when)=>{const el=document.createElement('div');el.className='hud tag '+(cls||'');el.textContent=text;stage.appendChild(el);TAGS.push({el,pos,when});};
F.tag=tag;
let capTxt=null,titleTxt=null;
function setCap(t){let l=null;for(const L of LINES)if(t>=L.t+L.ld-.05&&t<L.t+L.ld+L.w+.7)l=L;if(SC.caption){const c=SC.caption(t);if(c)l=c;}
  const s=l?(l.who?`<b>${l.who}</b> `:'')+l.tx:'';if(s!==capTxt){capTxt=s;hud.cap.innerHTML=s;}}
const clock=SC.clock||[5,42,0];
function updHud(t,o){hud.cnt.textContent=Math.floor(o.count||0).toLocaleString('en-US');
  const conf=clamp(o.conf!=null?o.conf:1-o.interf*.95,0,1);hud.conf.style.width=(conf*100).toFixed(0)+'%';hud.confb.classList.toggle('bad',conf<.45);
  const s=shotAt(t);hud.cam.textContent=o.camName||s.name;hud.rng.textContent=o.range==null?'— —':(typeof o.range==='string'?o.range:o.range.toFixed(1)+' KM');
  const sec=Math.floor(t),fr=Math.floor((t-sec)*24),ts=clock[0]*3600+clock[1]*60+clock[2]+sec;
  hud.tc.textContent=`${String(Math.floor(ts/3600)%24).padStart(2,'0')}:${String(Math.floor(ts/60)%60).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}:${String(fr).padStart(2,'0')}`;
  document.body.classList.toggle('thermal',o.mode>.5);document.body.classList.toggle('nohud',!!o.nohud);
  const ti=o.title&&o.title.k>.01?o.title:null;const key=ti?ti.org+'|'+ti.t+'|'+ti.sub:'';
  if(key!==titleTxt){titleTxt=key;hud.title.innerHTML=ti?`<div class="d">${ti.org||''}</div><div class="n">${ti.t||''}</div><div class="s">${ti.sub||''}</div>`:'';}
  hud.title.style.opacity=ti?ti.k:0;
  const lg=o.log||'';if(lg!==hud._log){hud._log=lg;hud.log.innerHTML=lg;}
  for(const g of TAGS){if(!g.when(t,o)){g.el.style.display='none';continue;}const p=g.pos(o,t).project(cam);
    if(p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1){g.el.style.display='block';g.el.style.left=((p.x+1)/2*W)+'px';g.el.style.top=((1-p.y)/2*H)+'px';}else g.el.style.display='none';}
  setCap(t);}
/* one frame */
function frameAt(t){const o=SC.tracks(t);const s=shotAt(t);let c;
  if(s.cuts){let k=s.cuts[0];for(const q of s.cuts)if(t>=q[0])k=q;c=Object.assign({},typeof k[1]==='function'?k[1](t):k[1]);}else c=s.f(clamp((t-s.t0)/(s.t1-s.t0),0,1),t);
  for(const key of ['real','mono','mode','wexp','interf'])if(c[key]!=null)o[key]=c[key];
  cam.position.copy(c.p);if(c.shake){cam.position.x+=(Math.sin(t*23.1)+Math.sin(t*37.7))*c.shake*.3;cam.position.y+=(Math.sin(t*19.3)+Math.sin(t*41.9))*c.shake*.3;}
  cam.fov=c.fov;cam.updateProjectionMatrix();cam.lookAt(c.l);if(c.roll)cam.rotation.z+=c.roll;if(c.shake)cam.rotation.z+=Math.sin(t*61)*c.shake*.01;cam.updateMatrixWorld();
  const px=(H*PR)/(2*Math.tan(cam.fov*Math.PI/360));
  SC.apply(t,o,cam,px);updHud(t,o);return o;}
function draw(t,o){const pix=1+Math.floor(ss(.62,1,o.interf)*(1-(o.clear||0))*6)*PR;
  LOOK.render(scene,cam,{real:o.real,mono:o.mono||0,mode:o.mode||0,interf:o.interf,pix,flash:o.flash||0,clear:o.clear||0,fade:o.fade||0,exp:o.exp||.75,wexp:o.wexp||1.1,dots:o.dots==null?1:o.dots,t});}
const stutAt=o=>Math.max(o.stut||0,ss(.55,1,o.interf)*.6*(1-(o.clear||0)));
/* sound */
let ctx=null,score=null,radio=null,t0=0;const VOICE=window.CIN_VOICE||{};
const b64buf=u=>{const s=atob(u.slice(u.indexOf(',')+1)),x=new Uint8Array(s.length);for(let i=0;i<s.length;i++)x[i]=s.charCodeAt(i);return x.buffer;};
F.RAMP=(par,keys,A)=>{par.setValueAtTime(keys[0][1],A(keys[0][0]));for(let i=1;i<keys.length;i++)par.linearRampToValueAtTime(keys[i][1],A(keys[i][0]));};
/* sounds are queued and only built about a second before they play: Chrome processes every node from the moment it is
   connected, so scheduling a whole battle up front costs far more than playing it */
let queue=[],qi=0;const LEAD=1.2;
function pump(until){while(qi<queue.length&&queue[qi].w<until){const q=queue[qi++];try{q.f();}catch(e){console.warn('sound',e);}}}
function cue(){const A=t=>t0+t;const S=score;if(typeof FSFX!=="undefined")FSFX.extend(S);queue=[];qi=0;
  const Q={};for(const k in S){const v=S[k];if(typeof v!=='function'||k==='duck'){Q[k]=v;continue;}
    Q[k]=(...a)=>{if(typeof a[0]==='number')queue.push({w:a[0],f:()=>v.apply(S,a)});else v.apply(S,a);};}
  SC.cue&&SC.cue(Q,A,F);
  const ps=[],c=ctx,rd=radio;for(const L of LINES){S.duck(A(L.t+L.ld-.1),A(L.t+L.ld+L.w),.55-.3*L.p);const b=VOICE[L.id];if(!b)continue;
    ps.push(Promise.resolve(b).then(b64buf).then(a=>c.decodeAudioData(a)).then(buf=>{queue.push({w:A(L.t),f:()=>rd.play(buf,A(L.t),{panic:L.p})});}).catch(e=>console.warn('voice',L.id,e)));}
  return Promise.all(ps).then(()=>{queue.sort((a,b)=>a.w-b.w);});}
window.CIN_AUDIO=async function(){const off=new OfflineAudioContext(2,Math.ceil(44100*DUR),44100);const sv=[ctx,score,radio,t0];
  ctx=off;score=RMD.Score(off);radio=RMD.RadioVoice(off,score.voice);t0=0;const ready=cue();
  for(let t=0;t<DUR;t+=.05){const o=SC.tracks(t);const v=o.interf*o.interf*.3*(1-(o.clear||0))+(rnd()<stutAt(o)*.22?.16:0);score.params.stat.setValueAtTime(v,t);}
  await ready;pump(LEAD);for(let t=.5;t<DUR;t+=.5){const tt=t;off.suspend(tt).then(()=>{pump(tt+LEAD);off.resume();});}
  const buf=await off.startRendering();[ctx,score,radio,t0]=sv;return buf;};
let pumpI=null;
function startSound(){ctx=new (window.AudioContext||window.webkitAudioContext)();score=RMD.Score(ctx);radio=RMD.RadioVoice(ctx,score.voice);t0=ctx.currentTime+.6;
  cue().then(()=>pump(ctx.currentTime+LEAD));if(pumpI)clearInterval(pumpI);pumpI=setInterval(()=>{if(ctx)pump(ctx.currentTime+LEAD);},200);}
let statLvl=0;function soundFrame(o,holding){if(!score)return;const v=o.interf*o.interf*.3*(1-(o.clear||0))+(holding?.16:0);if(Math.abs(v-statLvl)>.01){statLvl=v;score.params.stat.setTargetAtTime(v,ctx.currentTime,.03);}}
/* live play */
let playing=false,holdUntil=0,lastNow=0,fpsA=0,fpsN=0,ended=false,startPerf=0;
const now=()=>ctx?ctx.currentTime-t0:(performance.now()-startPerf)/1000;
function loop(){if(!playing)return;requestAnimationFrame(loop);const t=now();if(t<0)return;
  const pn=performance.now(),dt=(pn-lastNow)/1000;lastNow=pn;if(dt<.2){fpsA+=dt;fpsN++;if(fpsA>2.5){const fps=fpsN/fpsA;if(fps<24&&PR>1){PR=1;resize();}fpsA=fpsN=0;}}
  if(t>=DUR){finish();return;}const o=frameAt(t);const st=stutAt(o);const holding=pn<holdUntil;soundFrame(o,holding);if(holding)return;
  if(st>0&&rnd()<st*.22){const l=30+rnd()*rnd()*260*st;holdUntil=pn+l;if(score)score.burst(ctx.currentTime,l/1000,st);}draw(t,o);}
function finish(){if(ended)return;ended=true;playing=false;if(pumpI){clearInterval(pumpI);pumpI=null;}$('end').classList.add('on');if(score)try{score.out.gain.setTargetAtTime(0,ctx.currentTime,.3);}catch(e){}
  if(BACK)setTimeout(()=>location.replace(BACK),2600);}
function play(){if(playing)return;$('start').classList.remove('on');$('end').classList.remove('on');ended=false;try{if(ctx)ctx.close();}catch(e){}ctx=null;
  try{startSound();}catch(e){console.warn('sound',e);ctx=null;}startPerf=performance.now()+400;sd=7;playing=true;lastNow=performance.now();
  setTimeout(()=>$('skip').classList.add('on'),3000);requestAnimationFrame(loop);}
$('go').onclick=play;$('replay').onclick=play;$('skip').onclick=()=>finish();$('back').onclick=()=>{if(BACK)location.replace(BACK);else history.back();};
if(!BACK)$('back').textContent='BACK';
/* ready */
Promise.resolve(SC.build(scene,F)).then(()=>{(SC.TAGS||[]).forEach(g=>tag(...g));$('load').textContent='';$('go').disabled=false;$('go').classList.add('ready');
  const pt=SC.poster!=null?SC.poster:Math.min(10,DUR/2);const o=frameAt(pt);o.fade=.5;draw(pt,o);if(REC)$('start').classList.remove('on');window.CIN.ready=true;})
  .catch(e=>{console.error(e);$('load').textContent='Failed to load: '+e;});
let recHold=-1,recLast=-1;
window.CIN={ready:false,DUR,LINES,
  frame(i,fps){fps=fps||30;const t=i/fps;const o=frameAt(t);const st=stutAt(o);if(i<=recHold&&recLast>=0)return 'held';
    if(st>0&&rnd()<st*.22*(30/fps)*1.6)recHold=i+Math.max(1,Math.round((30+rnd()*rnd()*260*st)/1000*fps));draw(t,o);recLast=i;return 'drawn';},
  seek(n,fps){fps=fps||30;sd=7;recHold=-1;recLast=-1;for(let i=0;i<n;i++){const o=SC.tracks(i/fps);const st=stutAt(o);if(i<=recHold&&recLast>=0)continue;
    if(st>0&&rnd()<st*.22*(30/fps)*1.6)recHold=i+Math.max(1,Math.round((30+rnd()*rnd()*260*st)/1000*fps));recLast=i;}},
  at(t){const o=frameAt(t);draw(t,o);return o;}};
};
return F;
})();
