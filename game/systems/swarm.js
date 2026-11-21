/* systems/swarm.js — the creatures, the allies and the waves in the arena.
   The creatures are session A's module, game/creatures/creatures.js (RMD.Creatures.Swarm): the rigs, the walk / lunge / maul
   brain (each creature goes for the nearest target), the dots and the knocked-off dots, hit / blast / absorb. A creature's dots are
   its hit points and its size (being tested): every point of damage knocks a dot off, it shrinks as it thins, and below
   12 % of where it started it comes apart.
   This file adds the arena's rules on top:
   - targets: the Wraith and its three wingmates (mech/wingmates.js); on the artillery map, the friendly Wraith teams (green dots);
   - bites: two a maul, power 1.2 + 0.8 × √dots, times the difficulty; a mauling creature hangs on to a Wraith that walks away;
   - a green dot that is bitten (a friendly Wraith on the artillery map) flickers for 1.25 s (kill the creature in time and it is
     saved), then turns red and is absorbed: one more dot of the creature;
   - bodies keep apart, and the big ones shove the Wraith; vents, rails and stomps knock creatures back;
   - waves out of the rifts, scrap, and how hard the sensor struggles. */
const SW=new RMD.Creatures.Swarm(DS,{max:60000,maxDebris:9000});
SW.ground=hgt;SW.geo.setDrawRange(0,0);
const RIG=RMD.Creatures.RIG,BASE_SPEED=Object.fromEntries(RMD.Creatures.RIGS.map(r=>[r.id,r.speed]));
/* the top-down camera is 60 to 90 m away: dots drawn half again as big as in the viewer, and dimmer, so a cluster reads as dots */
const TOPK=1.5,TOPI=.62;
const EN=[],ALLIES=[];
const DROP={knot:.03,skein:.05,runner:.12,stalker:.3,brute:1};
const DIFFS={easy:{bite:.6,speed:.85,count:.8,name:'EASY'},medium:{bite:1,speed:1,count:1,name:'MEDIUM'},hard:{bite:1.4,speed:1.12,count:1.25,name:'HARD'}};
let DIFF=DIFFS[store.get('diff','medium')]||DIFFS.medium;
/* the test waves: groups that come out of the rifts one after another (big groups out of two rifts at once) */
const WAVES=[
  [{t:'knot',n:16},{t:'knot',n:24},{t:'knot',n:30}],
  [{t:'knot',n:24},{t:'skein',n:8},{t:'knot',n:30},{t:'skein',n:12}],
  [{t:'runner',n:5},{t:'knot',n:36},{t:'runner',n:6},{t:'knot',n:40}],
  [{t:'stalker',n:3},{t:'skein',n:12},{t:'runner',n:6},{t:'stalker',n:4},{t:'knot',n:40}],
  [{t:'brute',n:1},{t:'knot',n:40},{t:'stalker',n:4},{t:'runner',n:6},{t:'brute',n:1},{t:'knot',n:40}],
  [{t:'brute',n:2},{t:'stalker',n:6},{t:'knot',n:60},{t:'runner',n:8},{t:'brute',n:2},{t:'stalker',n:4},{t:'knot',n:60}]];
const WV={groups:[],gi:0,t:0,spawnQ:[],lastDots:0,total:0};
const SQUADS=['ALPHA','BRAVO','CHARLIE','DELTA'];
const TEAM_K=2.2;
/* the arena reads a creature through these names (x, z, r = its reach on the ground, cy = the middle of its body, alive = dots) */
const CDEF={x:{get(){return this.pos.x;},set(v){this.pos.x=v;}},z:{get(){return this.pos.z;},set(v){this.pos.z=v;}},
  alive:{get(){return this.count;}},tier:{get(){return this.rig;}},r:{get(){return this.rig.size*.42*this.scale;}},cy:{get(){return this.pos.y+this.rig.size*.4*this.scale;}}};
function spawnCluster(id,rift){const a=Math.random()*TAU,rr=Math.random()*4;const x=rift.x+Math.cos(a)*rr,z=rift.z+Math.sin(a)*rr;
  const c=SW.spawn(id,V3(x,hgt(x,z),z),Math.atan2(-x,-z));Object.defineProperties(c,CDEF);
  Object.assign(c,{kind:id,spawnT:1.2,sx:x,sz:z,kx:0,kz:0,pend:0,lk:0,lka:9,dmgAcc:0,bit:0,lastSt:0,killed:false});
  /* every dot starts at the rift, under the ground: the springs pull them up into the body (it pours up out of the rift) */
  c.first=false;for(const p of c.P)if(p.alive)p.p.set(x+(Math.random()-.5)*2,-2-Math.random()*3,z+(Math.random()-.5)*2);
  EN.push(c);return c;}
function startWave(){
  G.wave++;const base=WAVES[Math.min(G.wave-1,WAVES.length-1)],more=1+Math.max(0,G.wave-WAVES.length)*.25;
  /* 35 % faster than A's walking speeds (KNOT 7 → 9.5 m/s), so a pack can catch a Wraith (7.5 m/s) */
  for(const id in BASE_SPEED)RIG[id].speed=BASE_SPEED[id]*DIFF.speed*1.35;
  /* four Wraiths now, not one: every group is 2.2 times as big as it was for the Wraith alone */
  WV.groups=base.map(g=>({t:g.t,n:Math.max(1,Math.round(g.n*DIFF.count*more*TEAM_K))}));WV.gi=0;WV.t=0;WV.spawnQ.length=0;
  WV.total=WV.groups.reduce((s,g)=>s+g.n*RIG[g.t].n,0);
  ALLIES.length=0;resetWings(false);sendGroup();HUD.banner('WAVE '+G.wave);G.waveOn=true;G.lostWave=0;
}
function sendGroup(){const g=WV.groups[WV.gi++];if(!g)return;
  /* rifts 45 to 120 m from the Wraith (close enough to arrive, far enough to be seen coming), else the nearest ones past 40 m */
  const dR=r=>Math.hypot(r.x-P.x,r.z-P.z);let pool=RIFTS.filter(r=>dR(r)>45&&dR(r)<120).sort(()=>Math.random()-.5);
  if(pool.length<2)pool=RIFTS.filter(r=>dR(r)>40).sort((a,b)=>dR(a)-dR(b)).slice(0,3);if(!pool.length)pool=RIFTS.slice();
  const two=g.n>=8&&pool.length>1,rf=pool[0];
  for(let i=0;i<g.n;i++)WV.spawnQ.push({t:g.t,rf:two&&i%2?pool[1]:rf,at:Math.floor(i/(two?2:1))*.18});WV.t=0;WV.lastDots=liveDots()+g.n*RIG[g.t].n;
  rf.flare=1;if(two)pool[1].flare=1;
  radio(['<b>OVERWATCH</b> Contacts at the rift. ','<b>OVERWATCH</b> More coming up out of the rift. ','<b>OVERWATCH</b> Rift’s active again. '][Math.min(2,WV.gi-1)]+g.n+' '+RIG[g.t].name+(g.n>1?'S':'')+'.',3.5);}
function liveDots(){let n=0;for(const e of EN)if(!e.dead)n+=e.alive;return n;}
function dotsLeft(){let n=liveDots();for(const q of WV.spawnQ)n+=RIG[q.t].n;for(let i=WV.gi;i<WV.groups.length;i++)n+=WV.groups[i].n*RIG[WV.groups[i].t].n;return n;}
function makeSquads(){ALLIES.length=0;const nS=3;
  for(let s=0;s<nS;s++){let hx=0,hz=0;for(let t=0;t<40;t++){const a=Math.random()*TAU,d=24+Math.random()*34;hx=P.x+Math.cos(a)*d;hz=P.z+Math.sin(a)*d;const l=Math.hypot(hx,hz);if(l>ARENA_R-10){hx*=(ARENA_R-10)/l;hz*=(ARENA_R-10)/l;}
      if(RIFTS.every(r=>Math.hypot(r.x-hx,r.z-hz)>30)&&Math.hypot(hx-P.x,hz-P.z)>14&&ALLIES.every(a=>Math.hypot(a.hx-hx,a.hz-hz)>20))break;}
    for(let i=0;i<5;i++){const x=hx+(Math.random()-.5)*4,z=hz+(Math.random()-.5)*4;
      ALLIES.push({x,z,hx:x,hz:z,vx:0,vz:0,state:0,t0:0,by:null,sq:SQUADS[s],i:i+1,ph:Math.random()*6,pos:V3(x,0,z),kind:'ally',h:[V3(x,1,z),V3(x,1,z),V3(x,1,z),V3(x,1,z),V3(x,1,z)]});}}}
function alliesOK(){let n=0;for(const a of ALLIES)if(a.state!==2)n++;return n;}

/* damage: every point knocks a dot off, the ones nearest where it landed */
const _hc=new THREE.Vector3();
function hurtCluster(e,dmg,x,y,z){if(e.dead)return;e.dmgAcc+=dmg;const n=Math.floor(e.dmgAcc);if(n<=0)return;e.dmgAcc-=n;
  /* nearest the impact first; whatever the impact's neighbourhood cannot supply comes off the body as a whole, so dots stay hit points */
  _hc.set(x,clamp(y,e.pos.y+.3,e.cy+e.rig.size*.5*e.scale),z);let k=SW.hit(e,_hc,e.rig.size*.35*e.scale+.6,n);
  if(!e.dead&&k<n){_hc.set(e.x,e.cy,e.z);SW.hit(e,_hc,e.rig.size*1.2*e.scale+2,n-k);}
  if(e.dead)killCluster(e);}
function killCluster(e){if(e.killed)return;e.killed=true;e.dead=true;G.kills++;const sc=Math.round(e.n0/2);addScrap(sc);
  dustPuff(e.x,e.z,6+Math.min(20,e.n0/25)|0,.6+e.rig.size*.12);sBite(.6);
  if(e.n0>=100){CAMS.shake=Math.max(CAMS.shake,.25);HUD.msg(e.rig.name+' DOWN · +'+sc+' SCRAP',1.4);}
  if(Math.random()<(DROP[e.kind]||.05))dropPickup(e.x,e.z,e.kind==='brute'&&Math.random()<.5?'chip':null);
  for(const a of ALLIES)if(a.state===1&&a.by===e){a.state=0;a.by=null;a.vx=a.vz=0;HUD.msg('SQUAD MEMBER SAVED',1.4);sPickup();}}

const TG_P={pos:new THREE.Vector3(),kind:'mech'};
function updSwarm(dt){
  /* spawning */
  for(let i=WV.spawnQ.length-1;i>=0;i--){const q=WV.spawnQ[i];q.at-=dt;if(q.at<=0){spawnCluster(q.t,q.rf);WV.spawnQ.splice(i,1);}}
  if(G.waveOn&&WV.gi<WV.groups.length){WV.t+=dt;if(WV.t>11||liveDots()<WV.lastDots*.3&&!WV.spawnQ.length&&WV.t>4)sendGroup();}
  for(const rf of RIFTS){rf.flare=Math.max(0,(rf.flare||0)-dt*.5);if(rf.light)rf.light.intensity=90*(1+.25*Math.sin(G.t*2.3+rf.i))+rf.flare*400;}
  if(RIFTS.glow)RIFTS.glow.uniforms.uT.value=G.t;
  /* knock-backs, and a mauling creature hanging on to the Wraith */
  const kd=Math.exp(-dt*4);
  for(const e of EN){if(e.dead)continue;e.x+=e.kx*dt;e.z+=e.kz*dt;e.kx*=kd;e.kz*=kd;
    if(e.state==='maul'&&e.target===TG_P&&!P.dead){const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz)||1,reach=(e.rig.reach||2)*e.scale+1.2+RAD;
      if(d>reach){const s=Math.min(d-reach,e.rig.speed*1.05*dt);e.x+=dx/d*s;e.z+=dz/d*s;}}}
  /* the targets: the Wraith and every ally not yet taken */
  const tg=[];if(!ART.on){if(!P.dead){TG_P.pos.set(P.x,0,P.z);tg.push(TG_P);}for(const w of WINGS)if(!w.down)tg.push(w);}
  for(const a of ALLIES)if(a.state===0){a.pos.set(a.x,0,a.z);tg.push(a);}
  SW.update(dt,G.t,tg);
  /* still pouring out of the rift: it stays where it came up */
  for(const e of EN){if(e.dead)continue;if(e.spawnT>0){e.spawnT-=dt;e.x=e.sx;e.z=e.sz;}}
  /* bites: two a maul, a third and most of the way through */
  for(const e of EN){if(e.dead||e.spawnT>0)continue;
    if(e.state==='maul'){if(e.st<e.lastSt)e.bit=0;const bites=e.st>.3?(e.st>.95?2:1):0;if(bites>e.bit){e.bit=bites;if(e.mauling&&e.target)bite(e,e.target);}}
    else e.bit=0;e.lastSt=e.st;
    if(!ART.on){const ad=Math.hypot(e.x,e.z);if(ad>ARENA_R+6){e.x*=(ARENA_R+6)/ad;e.z*=(ARENA_R+6)/ad;}}}
  /* bodies keep apart; the big ones shove the Wraith */
  for(let i=0;i<EN.length;i++){const a=EN[i];if(a.dead)continue;
    if(!P.dead&&!P.air){const dx=a.x-P.x,dz=a.z-P.z,d=Math.hypot(dx,dz)||1,m=a.r*.7+RAD;if(d<m){const o=m-d,wa=a.alive>300?.35:1;a.x+=dx/d*o*wa;a.z+=dz/d*o*wa;P.x-=dx/d*o*(1-wa);P.z-=dz/d*o*(1-wa);}}
    for(const w of WINGS){if(w.down)continue;const dx=a.x-w.x,dz=a.z-w.z,d=Math.hypot(dx,dz)||1,m=a.r*.7+RAD;if(d<m){const o=m-d,wa=a.alive>300?.35:1;a.x+=dx/d*o*wa;a.z+=dz/d*o*wa;w.x-=dx/d*o*(1-wa);w.z-=dz/d*o*(1-wa);}}
    for(let j=i+1;j<EN.length;j++){const b=EN[j];if(b.dead)continue;const dx=b.x-a.x,dz=b.z-a.z,m=(a.r+b.r)*.6;if(Math.abs(dx)>m||Math.abs(dz)>m)continue;
      const d=Math.hypot(dx,dz)||.01;if(d<m){const o=(m-d)*.5,wa=b.alive/(a.alive+b.alive);a.x-=dx/d*o*wa*2;a.z-=dz/d*o*wa*2;b.x+=dx/d*o*(1-wa)*2;b.z+=dz/d*o*(1-wa)*2;}}}
  for(const e of EN)if(e.dead&&!e.killed)killCluster(e);
  for(let i=EN.length-1;i>=0;i--)if(EN[i].dead)EN.splice(i,1);
  updAllies(dt);
  /* wave over: everything sent and nothing left alive */
  if(G.waveOn&&WV.gi>=WV.groups.length&&!WV.spawnQ.length&&!EN.length)waveClear();
}
/* a bite: the dot count is the power (1.2 + 0.8 × √dots), times the difficulty */
function bite(e,t){const pw=1.2+Math.sqrt(e.alive)*.8;
  if(t===TG_P){hurtPlayer(pw,e.x,e.z);sBite(Math.min(1,pw/15));}
  else if(t.kind==='wing')hurtWing(t,pw,e.x,e.z);
  else if(t.kind==='ally'&&t.state===0){t.state=1;t.t0=G.t;t.by=e;radio('<b>RADIO</b> '+t.sq+' squad: it’s on us!',2);}}
function updAllies(dt){
  for(const a of ALLIES){if(a.state===2)continue;
    if(a.state===1){const e=a.by;if(!e||e.dead){a.state=0;a.by=null;continue;}
      const f=e.rig.size*.5*e.scale;a.x=lerp(a.x,e.x+Math.sin(e.heading)*f,damp(8,dt));a.z=lerp(a.z,e.z+Math.cos(e.heading)*f,damp(8,dt));
      if(G.t-a.t0>1.25){a.state=2;G.lost++;G.lostWave++;SW.absorb(e,V3(a.x,1,a.z));sLost();
        radio('<b>RADIO</b> Lost contact with '+a.sq+'-'+a.i+'… the marker just turned red.',3.2);}
      continue;}
    /* on the artillery map they are Wraith teams: they hold their ground and fire on anything within 28 m */
    if(ART.on){a.cd=(a.cd||Math.random()*.6)-dt;if(a.cd<=0){a.cd=.6;let t=null,bd=28;for(const e of EN){if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-a.x,e.z-a.z)-e.r;if(d<bd){bd=d;t=e;}}
      if(t)hurtCluster(t,4,lerp(t.x,a.x,.3),t.cy,lerp(t.z,a.z,.3));}continue;}
    /* scatter from anything close; otherwise drift back to the squad's spot */
    let nx=0,nz=0,nd=1e9;for(const e of EN){if(e.dead||e.spawnT>0)continue;const dx=a.x-e.x,dz=a.z-e.z,d=Math.hypot(dx,dz)-e.r;if(d<nd){nd=d;nx=dx;nz=dz;}}
    let tvx=0,tvz=0;if(nd<12){const l=Math.hypot(nx,nz)||1;tvx=nx/l*3.4;tvz=nz/l*3.4;}else{const dx=a.hx-a.x,dz=a.hz-a.z,d=Math.hypot(dx,dz);if(d>.6){tvx=dx/d*1.2;tvz=dz/d*1.2;}}
    tvx+=Math.sin(G.t*.8+a.ph)*.3;tvz+=Math.cos(G.t*.6+a.ph)*.3;
    a.vx+=(tvx-a.vx)*damp(4,dt);a.vz+=(tvz-a.vz)*damp(4,dt);a.x+=a.vx*dt;a.z+=a.vz*dt;
    const ad=Math.hypot(a.x,a.z);if(ad>ARENA_R-3){a.x*=(ARENA_R-3)/ad;a.z*=(ARENA_R-3)/ad;}}}
/* the dot layer this frame. The creatures draw themselves (SW); here: their dot size and brightness for the top-down view, and the
   allies (green; a bitten one flickers, then turns red) */
let SW_TH=null;
function drawSwarm(dt,thermal){
  if(SW_TH!==thermal){SW_TH=thermal;SW.setThermal(thermal);}
  /* on the long-range artillery map the camera is about 500 m up: the dots are drawn bigger there */
  SW.mat.uniforms.uSizeMul.value=(thermal?4.2:1)*TOPK*(ART.on?2.6:1);SW.mat.uniforms.uGain.value=(thermal?1:TOPI)*(ART.on?1.5:1);
  SW.pxScale(pxScale());
  /* in the fight, a green dot over each wingmate and the player: the sensor's friend-or-foe mark */
  if(!ART.on){for(const w of WINGS)if(!w.down)DOTS.put(w.x,8,w.z,0,0,1,thermal?.05:.9,thermal?2:.7);}
  for(const a of ALLIES){if(a.state===2)continue;let col=[0,0,1];
    if(a.state===1){const f=(G.t-a.t0)/1.25;const fl=Math.sin((G.t-a.t0)*(8+f*30))>0;col=(f>.55?fl||f>.85:fl&&Math.random()<f*1.6)?[1,0,0]:[0,0,1];}
    for(let k=4;k>0;k--)a.h[k].copy(a.h[k-1]);a.h[0].set(a.x,1,a.z);
    const az=ART.on?3.2:1;
    if(thermal)DOTS.put(a.x,1,a.z,col[0],0,col[2],.09,2.4*az);
    else for(let k=0;k<5;k++)DOTS.put(a.h[k].x,a.h[k].y,a.h[k].z,col[0],0,col[2],1.3*[1,.42,.24,.13,.07][k]*(ART.on?1.4:1),.55*az);}
}
/* how hard the sensor struggles: close and big clusters break it up (0 = clear; held under 0.7 so the fight stays playable) */
function sensorInterference(){let s=0;
  for(const e of EN){if(e.dead)continue;const d=Math.hypot(e.x-P.x,e.z-P.z),R=e.rig.size*e.scale;s+=smooth(R*3.2+8,R*.75+2.5,d)*Math.sqrt(e.alive/100);}
  return clamp(.035+.6*(1-Math.exp(-s*.6)),0,.7);}
/* a wave cleared: 40 scrap for each wingmate standing; every second wave the guns are set up for the artillery round */
function waveClear(){G.waveOn=false;const ok=wingsUp(),bonus=ok*40;addScrap(bonus);saveScrap();
  G.mode='clear';HUD.banner('WAVE '+G.wave+' CLEAR');const arty=G.wave%2===0;
  radio('<b>OVERWATCH</b> Rift\u2019s quiet. '+(ok===3?'Whole team standing.':ok+' of 3 standing.')+(arty?' Get the guns set up: two Wraith teams are in contact two klicks north.':''),4.5);
  setTimeout(()=>{if(G.mode!=='clear')return;if(arty)startArty();else openUpg('clear',bonus,ok);},arty?3200:1600);}
function clearSwarm(){EN.length=0;SW.list.length=0;SW.dLife.fill(0);ALLIES.length=0;WV.groups=[];WV.gi=0;WV.spawnQ.length=0;}
