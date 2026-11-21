/* systems/main.js — the arena's flow and the frame loop (from Ironhowl 4's 10_main, cut down).
   title → (upgrades) → wave 1 → clear → upgrade screen → wave 2 → … ; the Wraith going down ends the run (scrap is kept).
   The sensor's held frames: when the interference is heavy the picture is held for a moment (a real dropped frame, as in the
   viewer); the game itself keeps running underneath. */
const G={mode:'load',paused:false,t:0,fdt:1/60,wave:0,waveOn:false,kills:0,lost:0,lostWave:0,thermal:false,hurt:0,interf:0,perf:{t:0,n:0}};
let M=null;
function setThermal(on){G.thermal=on;HUD.msg(on?'THERMAL':'SENSOR',.7);}
function setPause(b){if(G.mode!=='play'&&b)return;G.paused=b;$('menu').style.display=b?'flex':'none';setVolume();if(b)jetLoop(0);}
function resetRun(){P=mkPlayer();CAMS.ready=false;clearSwarm();BOLTS.length=MISS.length=0;clearPickups();
  Object.assign(GUN,{heat:0,over:false,cd:0,ventCd:0});SALVO.cd=0;SALVO.left=0;
  Object.assign(G,{wave:0,waveOn:false,kills:0,lost:0,lostWave:0,hurt:0});if(M)M.root.visible=true;$('down').style.display='none';}
function startPlay(){audioInit();resetRun();applyUpgrades(true);G.mode='play';G.paused=false;$('title').style.display='none';
  HUD.msg(touchy?'LEFT THUMB MOVES · RIGHT THUMB AIMS AND FIRES':'WASD MOVE · MOUSE AIMS · HOLD LEFT BUTTON TO FIRE · SPACE JET',4);
  setTimeout(()=>{if(G.mode==='play'&&!G.wave)startWave();},1800);}
function playerDown(){if(P.dead)return;P.dead=true;P.thrust=0;boom(P.x,P.y+2.5,P.z,2);boom(P.x+1,P.y+3.5,P.z-1,1.2);if(M)M.root.visible=false;saveScrap();
  G.mode='down';G.downT=2.2;$('dscore').textContent='WAVE '+G.wave+' · '+G.kills+' CLEARED · '+G.lost+' ALLIES LOST · SCRAP '+scrap().toLocaleString('en-US');
  radio('<b>OVERWATCH</b> Wraith is down. Pulling you out.',4);}
function handleEvents(){
  for(const e of P.ev){
    if(e.t==='jet'){sJet();CAMS.shake=Math.max(CAMS.shake,.45);dustPuff(P.x,P.z,12,1.1);}
    else if(e.t==='land'){sLand(e.k);CAMS.shake=Math.max(CAMS.shake,.4+e.k*.6);dustPuff(P.x,P.z,10+e.k*16|0,.9+e.k*.7);}
    else if(e.t==='nofuel'){sClick();HUD.flashFuel();}
    else if(e.t==='hover'){HUD.msg('HOVER',.7);}
    else if(e.t==='hoverout'){sClick();HUD.msg('HOVER TANK EMPTY',1.1);}}
  P.ev.length=0;}
const _np=new THREE.Vector3();
function jetFX(dt){if(P.thrust<.05||!M.ready)return;for(const J of M.jets){J.n.getWorldPosition(_np);
  const k=P.thrust;if(Math.random()<k*dt*60)part({x:_np.x,y:_np.y-.4,z:_np.z,vx:(Math.random()-.5)*2,vy:-6-Math.random()*4,vz:(Math.random()-.5)*2,life:.25+Math.random()*.15,s0:.9,s1:.35,a:1.4*k,col:[1,.55,.22],glow:true,drag:2});
  if(Math.random()<k*dt*30)part({x:_np.x,y:_np.y-.6,z:_np.z,vx:(Math.random()-.5)*1.5,vy:-3-Math.random()*2,vz:(Math.random()-.5)*1.5,life:1.2+Math.random()*.8,s0:.8,s1:3.4,a:.3,col:SMOKE,drag:1.6,grav:-.6});}}
const IDLE={mx:0,my:0,aim:false,ax:0,az:-1,aimPt:null,fire:false,jet:false,jetHit:false,msl:false,vent:false,salvo:false};
let CTLX=null;   /* tests: a fixed control set (dev only) */
function tick(dt){
  G.t+=dt;
  const live=G.mode==='play'&&!G.paused;
  let c=readCtl(dt);if(CTLX){c=Object.assign({},c,CTLX);CTLX.jetHit=false;CTLX.salvo=false;CTLX.msl=false;CTLX.vent=false;}
  if(c.thermal)setThermal(!G.thermal);if(c.zoom)cycleZoom();
  if(c.pause&&(G.mode==='play'))setPause(!G.paused);
  if(c.upg&&G.mode==='play'&&!G.paused){setPause(true);openUpg('pause');}
  if(!live)c=Object.assign({},IDLE);
  if(live){updAim(c);updPlayer(c,dt);updGun(c,dt);handleEvents();}
  const fight=live||G.mode==='down'||G.mode==='clear';
  if(fight){updShots(dt);updSwarm(dt);updPickups(dt);}
  updBeams(fight?dt:0);updShieldFx(dt);updRadio(dt);
  if(M&&M.ready){const ev=poseMech(M,{x:P.x,z:P.z,gy:P.y,legYaw:P.legYaw,aimYaw:P.yaw,spd:live?P.spd:0,air:P.air,vy:P.vy,land:P.land,thrust:P.thrust,pitch:0},fight||G.mode==='title'?dt:0);
    for(const e of ev){const k=clamp(Math.abs(P.spd)/WALK,.35,1);sStep(k);if(e.x!==undefined)dustPuff(e.x,e.z,3,.55);}}
  if(G.mode==='down'){G.downT-=dt;if(G.downT<=0&&$('down').style.display!=='flex')$('down').style.display='flex';
    if(Math.random()<dt*20)part({x:P.x+(Math.random()-.5)*2,y:P.y+1+Math.random()*2,z:P.z+(Math.random()-.5)*2,vx:0,vy:2.5,vz:0,life:2.4,s0:1.2,s1:5,a:.4,col:[.2,.2,.21],drag:.6,grav:-.5});}
  updCam(dt);placeSun(P.x,P.z);
  if(live)jetFX(dt);updFX(fight?dt:dt*.3);
  jetLoop(live?P.thrust:0);
  G.hurt=Math.max(0,G.hurt-dt*1.5);
  /* the dot layer: creatures, allies, knocked-off dots, and in thermal the Wraith's own heat (more as the gun heats) */
  DOTS.begin();drawSwarm(fight?dt:0,G.thermal);
  if(G.thermal&&!P.dead){const hk=.05+GUN.heat/100*.25+P.thrust*.2;DOTS.put(P.x,P.y+3.6,P.z,1,0,0,hk,5);DOTS.put(P.x,P.y+1.5,P.z,1,0,0,hk*.6,4);}
  DOTS.end();
  const S_=pxScale();dotMat.uniforms.uScale.value=S_;dotMat.uniforms.uSoft.value=G.thermal?1:0;
  dotMat.uniforms.uMin.value=(G.thermal?7:2)*PR*.5+1;dotMat.uniforms.uMax.value=G.thermal?160:56;
  G.interf=fight||G.mode==='title'?sensorInterference():.035;hissLoop(G.interf);
}
/* auto quality: if frames are slow, draw fewer pixels (down to 60 % of the screen's) */
function autoQ(dt){if(G.mode!=='play'||G.paused)return;const pf=G.perf;pf.t+=dt;pf.n++;
  if(pf.t>=2){const avg=pf.t/pf.n;pf.t=0;pf.n=0;
    if(avg>1/42&&DYN>.62){DYN*=.88;resize();}else if(avg<1/57&&DYN<1){DYN=Math.min(1,DYN*1.05);resize();}}}
let last=performance.now(),holdUntil=0,fpsT=0;
function frame(now){requestAnimationFrame(frame);
  const raw=(now-last)/1000,dt=Math.min(.05,raw);last=now;G.fdt+=(raw-G.fdt)*.1;
  if(DEV&&window.__freeze)return;
  tick(dt);autoQ(dt);
  if(G.mode==='play'||G.mode==='clear'||G.mode==='down'||G.mode==='title')HUD.frame(dt,clamp(1-G.interf*.95,0,1));
  if((fpsT-=raw)<=0&&DEV){fpsT=.5;$('fps').textContent=Math.round(1/Math.max(.001,G.fdt))+' fps · x'+DYN.toFixed(2)+' · dots '+DOTS.n;}
  /* the sensor struggles: hold the picture (only while playing, never on a menu) */
  const stut=G.mode==='play'&&!G.paused?smooth(.3,.62,G.interf)*.5:0;
  if(now<holdUntil)return;
  if(stut>0&&Math.random()<stut*.22)holdUntil=now+30+Math.random()*Math.random()*200*stut;
  renderFrame({thermal:G.thermal,interf:G.interf,t:G.t,flash:0,hurt:G.hurt});
}
function boot(){
  setupHud();resize();buildArena();buildFX();buildWeapons();P=mkPlayer();M=buildMech();
  G.mode='title';
  /* the title: pick a difficulty, deploy, or open the upgrades first */
  const dsel=()=>document.querySelectorAll('#tdiff button').forEach(b=>b.classList.toggle('on',DIFFS[b.dataset.d]===DIFF));
  document.querySelectorAll('#tdiff button').forEach(b=>b.onclick=e=>{e.stopPropagation();DIFF=DIFFS[b.dataset.d];store.set('diff',b.dataset.d);dsel();});dsel();
  $('tgo').onclick=e=>{e.stopPropagation();startPlay();};
  $('tupg').onclick=e=>{e.stopPropagation();$('title').style.display='none';openUpg('title');};
  $('ugo').onclick=e=>{e.stopPropagation();closeUpg();};
  $('ureset').onclick=e=>{e.stopPropagation();if(confirmReset()){SAVE.put({});RUN_SCRAP=0;drawUpg();}};
  $('mresume').onclick=()=>setPause(false);
  $('mupg').onclick=()=>{openUpg('pause');};
  $('mthermal').onclick=()=>{setThermal(!G.thermal);};
  $('msound').onclick=()=>{AU.on=!AU.on;store.set('sound',AU.on?1:0);setVolume();$('msound').textContent='SOUND: '+(AU.on?'ON':'OFF');};
  $('msound').textContent='SOUND: '+(AU.on?'ON':'OFF');
  $('mquit').onclick=()=>{setPause(false);saveScrap();G.mode='title';resetRun();$('title').style.display='flex';};
  $('down').onclick=()=>{if(G.mode==='down'&&G.downT<=0){$('down').style.display='none';G.mode='title';resetRun();$('title').style.display='flex';}};
  LM.onLoad=()=>{$('load').style.display='none';};
  M.loaded.then(()=>{$('load').style.display='none';},e=>{console.error(e);$('load').textContent='COULD NOT LOAD THE WRAITH';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.mode==='play'&&!G.paused)setPause(true);});
  requestAnimationFrame(frame);
}
/* resetting progress asks twice by tapping: the first tap arms it for 3 s (no browser dialogs) */
let RESET_ARM=0;function confirmReset(){const now=performance.now();if(now<RESET_ARM){RESET_ARM=0;$('ureset').textContent='RESET';return true;}RESET_ARM=now+3000;$('ureset').textContent='TAP AGAIN';setTimeout(()=>{$('ureset').textContent='RESET';},3000);return false;}
if(DEV)window.__rmd={G,get P(){return P;},get M(){return M;},EN,ALLIES,GUN,MSL,SALVO,UP,AIM,WV,DOTS,startPlay,startWave,spawnCluster,RIFTS,hurtCluster,openUpg,closeUpg,setThermal,refit(L){setLoadout(Object.assign(loadout(),L));return refitKit(M).then(()=>applyUpgrades(true));},buyUpg,upgLv,addScrap,saveScrap,SAVE,PK,dropPickup,
  ctl(o){CTLX=o;},ff(t){const n=Math.round(t*60);for(let i=0;i<n;i++)tick(1/60);},
  info(){return {mode:G.mode,wave:G.wave,x:+P.x.toFixed(1),z:+P.z.toFixed(1),hull:+P.hull.toFixed(0),shield:+P.shield.toFixed(0),heat:+GUN.heat.toFixed(0),msl:MSL.ammo,
    alive:EN.filter(e=>!e.dead).map(e=>e.id+':'+e.alive).join(' '),dots:liveDots(),allies:alliesOK()+'/'+ALLIES.length,kills:G.kills,scrap:scrap(),interf:+G.interf.toFixed(2),fps:Math.round(1/G.fdt),ready:!!(M&&M.ready)};}};
boot();
