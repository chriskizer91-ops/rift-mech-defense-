/* systems/swarm.js — the dot creatures, the allies and the waves in the arena.
   Being tested (a proposal, not decided): a creature's dots are its hit points. Every point of damage knocks a dot off, so a
   100-dot STALKER thins and shrinks as it is hit, and at 0 it is gone. An ally a creature reaches flickers for 1.25 s (kill the
   creature in that time and the ally is saved), then turns red and becomes one more dot of it.
   Who each creature goes for: STALKERs go for people first; RUNNERs for whatever is moving; BRUTEs for the Wraith; KNOTs and
   SKEINs for whatever is nearest. They walk, coil, lunge and maul (the viewer's AGGRO cycle, now aimed at a real target). */
const EN=[],ALLIES=[];
const TSTAT={knot:{speed:10,pref:'any',drop:.03,turn:6},skein:{speed:5,pref:'any',drop:.05,turn:4},runner:{speed:11,pref:'moving',drop:.12,turn:4},
  stalker:{speed:6,pref:'people',drop:.3,turn:3},brute:{speed:4,pref:'mech',drop:1,turn:1.3}};
const DIFFS={easy:{bite:.6,speed:.85,count:.8,name:'EASY'},medium:{bite:1,speed:1,count:1,name:'MEDIUM'},hard:{bite:1.4,speed:1.12,count:1.25,name:'HARD'}};
let DIFF=DIFFS[store.get('diff','medium')]||DIFFS.medium;
/* the test waves: groups that come out of the rifts one after another */
const WAVES=[
  [{t:'knot',n:12},{t:'knot',n:12}],
  [{t:'knot',n:14},{t:'skein',n:5},{t:'knot',n:12}],
  [{t:'runner',n:4},{t:'knot',n:16},{t:'runner',n:4}],
  [{t:'stalker',n:3},{t:'skein',n:8},{t:'runner',n:5},{t:'stalker',n:2}],
  [{t:'brute',n:1},{t:'knot',n:20},{t:'stalker',n:3}],
  [{t:'brute',n:2},{t:'stalker',n:5},{t:'knot',n:30},{t:'runner',n:6}]];
const WV={groups:[],gi:0,t:0,spawnQ:[],lastDots:0,total:0};
const SQUADS=['ALPHA','BRAVO','CHARLIE','DELTA'];

function spawnCluster(id,rift){const tier=RIG[id];const a=Math.random()*TAU,r=Math.random()*4;const x=rift.x+Math.cos(a)*r,z=rift.z+Math.sin(a)*r;
  const c=buildCluster(tier,x,z,Math.atan2(-(0-x),-(0-z)));
  Object.assign(c,{id,dead:false,spawnT:1.2,kx:0,kz:0,st:'walk',stT:0,tgt:null,tgtT:0,flash:0,pend:0,lk:0,lka:9,bit:0,stat:TSTAT[id],
    g:{phi:0,stride:.12,low:.1,stretch:0,hop:0,slam:0,thrash:0}});
  EN.push(c);return c;}
function startWave(){
  G.wave++;const base=WAVES[Math.min(G.wave-1,WAVES.length-1)],more=1+Math.max(0,G.wave-WAVES.length)*.25;
  WV.groups=base.map(g=>({t:g.t,n:Math.max(1,Math.round(g.n*DIFF.count*more))}));WV.gi=0;WV.t=0;WV.spawnQ.length=0;
  WV.total=WV.groups.reduce((s,g)=>s+g.n*RIG[g.t].n,0);
  for(let i=EN.length-1;i>=0;i--)if(EN[i].dead)EN.splice(i,1);
  makeSquads();sendGroup();HUD.banner('WAVE '+G.wave);G.waveOn=true;G.lostWave=0;
}
/* the next group comes out of a rift that is not right next to the Wraith */
function sendGroup(){const g=WV.groups[WV.gi++];if(!g)return;
  const far=RIFTS.filter(r=>Math.hypot(r.x-P.x,r.z-P.z)>40);const rf=(far.length?far:RIFTS)[(Math.random()*(far.length||RIFTS.length))|0];
  for(let i=0;i<g.n;i++)WV.spawnQ.push({t:g.t,rf,at:i*.18});WV.t=0;WV.lastDots=liveDots()+g.n*RIG[g.t].n;
  if(rf.light)rf.flare=1;radio(['<b>OVERWATCH</b> Contacts at the rift. ','<b>OVERWATCH</b> More coming up out of the rift. ','<b>OVERWATCH</b> Rift’s active again. '][Math.min(2,WV.gi-1)]+g.n+' '+RIG[g.t].name+(g.n>1?'S':'')+'.',3.5);}
function liveDots(){let n=0;for(const e of EN)if(!e.dead)n+=e.alive;return n;}
function dotsLeft(){let n=liveDots();for(const q of WV.spawnQ)n+=RIG[q.t].n;for(let i=WV.gi;i<WV.groups.length;i++)n+=WV.groups[i].n*RIG[WV.groups[i].t].n;return n;}
function makeSquads(){ALLIES.length=0;const nS=3;
  for(let s=0;s<nS;s++){let hx=0,hz=0;for(let t=0;t<40;t++){const a=Math.random()*TAU,d=24+Math.random()*34;hx=Math.cos(a)*d;hz=Math.sin(a)*d;
      if(RIFTS.every(r=>Math.hypot(r.x-hx,r.z-hz)>30)&&Math.hypot(hx-P.x,hz-P.z)>14&&ALLIES.every(a=>Math.hypot(a.hx-hx,a.hz-hz)>20))break;}
    for(let i=0;i<5;i++){const x=hx+(Math.random()-.5)*4,z=hz+(Math.random()-.5)*4;
      ALLIES.push({x,z,hx:x,hz:z,vx:0,vz:0,state:0,t0:0,by:null,sq:SQUADS[s],i:i+1,ph:Math.random()*6,h:[V3(x,1,z),V3(x,1,z),V3(x,1,z),V3(x,1,z),V3(x,1,z)]});}}}
function alliesOK(){let n=0;for(const a of ALLIES)if(a.state!==2)n++;return n;}

/* damage: every point knocks a dot off */
function hurtCluster(e,dmg,x,y,z){if(e.dead)return;e.dmgAcc+=dmg;const n=Math.floor(e.dmgAcc);if(n<=0)return;e.dmgAcc-=n;knockDots(e,n,x,y,z);e.flash=1;if(e.alive<=0)killCluster(e);}
function killCluster(e){e.dead=true;G.kills++;const sc=Math.round(e.n0/2);addScrap(sc);
  dustPuff(e.x,e.z,6+Math.min(20,e.n0/25)|0,.6+e.tier.size*.12);sBite(.6);
  if(e.n0>=100){CAMS.shake=Math.max(CAMS.shake,.25);HUD.msg(e.tier.name+' DOWN · +'+sc+' SCRAP',1.4);}
  if(Math.random()<e.stat.drop)dropPickup(e.x,e.z,e.id==='brute'&&Math.random()<.5?'chip':null);
  for(const a of ALLIES)if(a.state===1&&a.by===e){a.state=0;a.by=null;a.vx=a.vz=0;HUD.msg('SQUAD MEMBER SAVED',1.4);sPickup();}}

/* ---------------- the creatures' brains ---------------- */
function pickTarget(e){let best=null,bs=1e9;const st=e.stat,pm=Math.hypot(P.vx,P.vz);
  if(!P.dead){const w=st.pref==='people'?1.6:st.pref==='mech'?.6:st.pref==='moving'?(pm>2?.7:1.3):1;const d=Math.hypot(P.x-e.x,P.z-e.z)*w;if(d<bs){bs=d;best={P:1};}}
  for(const a of ALLIES){if(a.state!==0)continue;const w=st.pref==='people'?.45:st.pref==='mech'?1.8:st.pref==='moving'?(Math.hypot(a.vx,a.vz)>1?.8:1.4):1.1;
    const d=Math.hypot(a.x-e.x,a.z-e.z)*w;if(d<bs){bs=d;best={a};}}
  return best;}
function tgtPos(t){return t.P?[P.x,P.z,2.2]:[t.a.x,t.a.z,.4];}
function updSwarm(dt){
  /* spawning */
  for(let i=WV.spawnQ.length-1;i>=0;i--){const q=WV.spawnQ[i];q.at-=dt;if(q.at<=0){spawnCluster(q.t,q.rf);WV.spawnQ.splice(i,1);}}
  if(G.waveOn&&WV.gi<WV.groups.length){WV.t+=dt;if(WV.t>14||liveDots()<WV.lastDots*.4&&!WV.spawnQ.length)sendGroup();}
  for(const rf of RIFTS){rf.flare=Math.max(0,(rf.flare||0)-dt*.5);if(rf.light)rf.light.intensity=90*(1+.25*Math.sin(G.t*2.3+rf.i))+rf.flare*400;}
  if(RIFTS.glow)RIFTS.glow.uniforms.uT.value=G.t;
  for(const e of EN){if(e.dead)continue;const g=e.g,tier=e.tier,st=e.stat;e.flash=Math.max(0,e.flash-dt*7);
    if(e.spawnT>0){e.spawnT-=dt;g.phi+=dt*2;g.stride=.12;g.low=.3;stepCluster(e,dt,G.t);continue;}
    e.tgtT-=dt;if(e.tgtT<=0||!e.tgt||e.tgt.a&&e.tgt.a.state!==0||e.tgt.P&&P.dead){if(e.st==='walk'||!e.tgt){e.tgt=pickTarget(e);e.tgtT=.6+Math.random()*.3;}}
    let tx=e.x,tz=e.z,tr=0;if(e.tgt)[tx,tz,tr]=tgtPos(e.tgt);
    const dx=tx-e.x,dz=tz-e.z,dist=Math.hypot(dx,dz)||1,d=dist-tr,reachD=e.front*e.scale+tier.reach*.4,spd0=st.speed*DIFF.speed;
    const want=Math.atan2(-dx,-dz);let spd=0;e.stT+=dt;
    g.thrash=0;g.slam=0;g.hop=0;g.stretch=0;
    if(e.st==='walk'){const turn=st.turn*dt;e.yaw+=clamp(angD(want,e.yaw),-turn,turn);spd=e.tgt?spd0*(Math.abs(angD(want,e.yaw))<1.2?1:.35):0;
      g.phi+=dt*(1.5+spd*1.6/Math.sqrt(tier.size));g.stride=.15+.75*clamp(spd/spd0,0,1);g.low=.45;
      if(e.id==='knot')g.hop=Math.max(0,Math.sin(G.t*7.5+e.phi))*.35;
      if(e.tgt&&d<reachD+tier.reach*1.3){e.st='coil';e.stT=0;}}
    else if(e.st==='coil'){spd=spd0*.1;g.phi+=dt*2;g.stride=.15;g.low=1;e.yaw+=clamp(angD(want,e.yaw),-4*dt,4*dt);if(e.stT>.3){e.st='lunge';e.stT=0;}}
    else if(e.st==='lunge'){const f=smooth(0,1,e.stT/.35);spd=d>reachD*.6?(tier.reach*1.5+2)/.35:0;g.stretch=Math.sin(f*Math.PI)+f*.3;g.low=.7;g.hop=Math.sin(f*Math.PI);g.stride=.3;g.phi+=dt*6;
      if(e.stT>.35){e.st='maul';e.stT=0;e.bit=0;}}
    else if(e.st==='maul'){spd=d>reachD?spd0*.5:0;g.stretch=.3;g.low=.85;g.thrash=1;g.phi+=dt*9;g.stride=.25;g.slam=Math.max(0,Math.sin(e.stT*9))*.7;
      e.yaw+=clamp(angD(want,e.yaw),-3*dt,3*dt);
      /* two bites a maul */
      const bites=e.stT>.25?(e.stT>.85?2:1):0;
      if(bites>e.bit){e.bit=bites;if(e.tgt&&d<reachD+1.6)bite(e);}
      if(e.stT>1.3){e.st='back';e.stT=0;}}
    else{spd=-spd0*.35;g.phi-=dt*3.6;g.stride=.75;g.low=.35;if(e.stT>.7){e.st='walk';e.stT=0;e.tgtT=0;}}
    const fx=-Math.sin(e.yaw),fz=-Math.cos(e.yaw);
    e.x+=(fx*spd+e.kx)*dt;e.z+=(fz*spd+e.kz)*dt;const kd=Math.exp(-dt*4);e.kx*=kd;e.kz*=kd;
    const ad=Math.hypot(e.x,e.z);if(ad>ARENA_R+6){e.x*=(ARENA_R+6)/ad;e.z*=(ARENA_R+6)/ad;}
    e.r=tier.size*.42*e.scale;e.cy=tier.size*.4*e.scale;
  }
  /* bodies keep apart; the big ones shove the Wraith */
  for(let i=0;i<EN.length;i++){const a=EN[i];if(a.dead)continue;
    if(!P.dead&&!P.air){const dx=a.x-P.x,dz=a.z-P.z,d=Math.hypot(dx,dz)||1,m=a.r*.7+RAD;if(d<m){const o=m-d,wa=a.alive>300?.35:1;a.x+=dx/d*o*wa;a.z+=dz/d*o*wa;P.x-=dx/d*o*(1-wa);P.z-=dz/d*o*(1-wa);}}
    for(let j=i+1;j<EN.length;j++){const b=EN[j];if(b.dead)continue;const dx=b.x-a.x,dz=b.z-a.z,m=(a.r+b.r)*.6;if(Math.abs(dx)>m||Math.abs(dz)>m)continue;
      const d=Math.hypot(dx,dz)||.01;if(d<m){const o=(m-d)*.5,wa=b.alive/(a.alive+b.alive);a.x-=dx/d*o*wa*2;a.z-=dz/d*o*wa*2;b.x+=dx/d*o*(1-wa)*2;b.z+=dz/d*o*(1-wa)*2;}}}
  for(const e of EN)if(!e.dead&&e.spawnT<=0)stepCluster(e,dt,G.t);
  updAllies(dt);
  /* wave over: everything sent and nothing left alive */
  if(G.waveOn&&WV.gi>=WV.groups.length&&!WV.spawnQ.length&&!EN.some(e=>!e.dead))waveClear();
}
/* a bite: the dot count is the power (1.2 + 0.8 × √dots), times the difficulty */
function bite(e){const t=e.tgt;const pw=1.2+Math.sqrt(e.alive)*.8;
  if(t.P){hurtPlayer(pw,e.x,e.z);sBite(Math.min(1,pw/15));}
  else if(t.a.state===0){t.a.state=1;t.a.t0=G.t;t.a.by=e;radio('<b>RADIO</b> '+t.a.sq+' squad: it’s on us!',2);}}
function updAllies(dt){
  for(const a of ALLIES){if(a.state===2)continue;
    if(a.state===1){const e=a.by;if(!e||e.dead){a.state=0;a.by=null;continue;}
      const fx=-Math.sin(e.yaw),fz=-Math.cos(e.yaw),f=e.front*e.scale*.8;a.x=lerp(a.x,e.x+fx*f,damp(8,dt));a.z=lerp(a.z,e.z+fz*f,damp(8,dt));
      if(G.t-a.t0>1.25){a.state=2;G.lost++;G.lostWave++;addDot(e,a.x,1,a.z);sLost();
        radio('<b>RADIO</b> Lost contact with '+a.sq+'-'+a.i+'… the marker just turned red.',3.2);}
      continue;}
    /* scatter from anything close; otherwise drift back to the squad's spot */
    let nx=0,nz=0,nd=1e9;for(const e of EN){if(e.dead||e.spawnT>0)continue;const dx=a.x-e.x,dz=a.z-e.z,d=Math.hypot(dx,dz)-e.r;if(d<nd){nd=d;nx=dx;nz=dz;}}
    let tvx=0,tvz=0;if(nd<12){const l=Math.hypot(nx,nz)||1;tvx=nx/l*3.4;tvz=nz/l*3.4;}else{const dx=a.hx-a.x,dz=a.hz-a.z,d=Math.hypot(dx,dz);if(d>.6){tvx=dx/d*1.2;tvz=dz/d*1.2;}}
    tvx+=Math.sin(G.t*.8+a.ph)*.3;tvz+=Math.cos(G.t*.6+a.ph)*.3;
    a.vx+=(tvx-a.vx)*damp(4,dt);a.vz+=(tvz-a.vz)*damp(4,dt);a.x+=a.vx*dt;a.z+=a.vz*dt;
    const ad=Math.hypot(a.x,a.z);if(ad>ARENA_R-3){a.x*=(ARENA_R-3)/ad;a.z*=(ARENA_R-3)/ad;}}}
/* the dots for this frame: creatures, allies (green; a grabbed one flickers, then turns red), knocked-off dots */
function drawSwarm(dt,thermal){
  for(const e of EN)if(!e.dead)drawCluster(e,thermal,1+e.flash*.8);
  for(const a of ALLIES){if(a.state===2)continue;let col=[0,0,1];
    if(a.state===1){const f=(G.t-a.t0)/1.25;const fl=Math.sin((G.t-a.t0)*(8+f*30))>0;col=(f>.55?fl||f>.85:fl&&Math.random()<f*1.6)?[1,0,0]:[0,0,1];}
    for(let k=HIST-1;k>0;k--)a.h[k].copy(a.h[k-1]);a.h[0].set(a.x,1,a.z);
    if(thermal)DOTS.put(a.x,1,a.z,col[0],0,col[2],.09,2.4);
    else for(let k=0;k<HIST;k++)DOTS.put(a.h[k].x,a.h[k].y,a.h[k].z,col[0],0,col[2],1.3*TRAIL[k],.55);}
  drawDebris(dt,thermal);
}
/* how hard the sensor struggles: close and big clusters break it up (0 = clear, 1 = gone) */
function sensorInterference(){let s=0;
  for(const e of EN){if(e.dead)continue;const d=Math.hypot(e.x-P.x,e.z-P.z),R=e.tier.size*e.scale;s+=smooth(R*3.2+8,R*.75+2.5,d)*Math.sqrt(e.alive/100);}
  return clamp(.035+.6*(1-Math.exp(-s*.6)),0,.7);}
function waveClear(){G.waveOn=false;const ok=alliesOK(),bonus=ok*15;addScrap(bonus);saveScrap();
  G.mode='clear';HUD.banner('WAVE '+G.wave+' CLEAR');
  radio('<b>OVERWATCH</b> Rift’s quiet. '+(ok===ALLIES.length?'Everyone made it.':ok+' of '+ALLIES.length+' made it.'),4);
  setTimeout(()=>{if(G.mode==='clear')openUpg('clear',bonus,ok);},1600);}
function clearSwarm(){EN.length=0;ALLIES.length=0;DEBRIS.length=0;WV.groups=[];WV.gi=0;WV.spawnQ.length=0;}
