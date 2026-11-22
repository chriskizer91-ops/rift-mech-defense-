/* =====================================================================================================================
   RIFT MECH DEFENSE · MISSION 1: FIRST LIGHT (game/mission/m1.js, session B; the story is session D's)
   Greywater Strand at dawn. Gull is loading the last boats off the pier. The script is D's (docs/story/radio.md and
   docs/story/waves.md, mission 1); the voices are Christopher's ElevenLabs takes (audio/voice/m1_*), played through D's
   radio (RMD.RadioVoice, game/cinematic/cin-audio.js).
     1  It opens in the REAL view: the sand churns toward the pier, nothing to see. OVERWATCH: M1_01, M1_02.
     2  "Switching you to mine." (M1_03): the sensor comes on with a glitch; M1_04. Wave 1: 12 KNOT, in fours, out of
        the surf. The first hit on a KNOT: M1_05.
     3  Wave 1 cleared: GULL asks for three minutes (M1_06). Wave 2 over those minutes: 16 KNOT and 6 SKEIN; the SKEINs
        go for the pier (M1_07). One boat leaves at 1:30, the last at 3:00 (M1_08).
     4  M1_09 if every one of Gull got away, then the pilot's first word (M1_10). Mission complete.
   Losing: the Wraith goes down (C's screen), or every one of Gull is taken.
   Counts are D's (Medium) times C's TEAM_K (2.2: four Wraiths, not one), times the difficulty.
   ===================================================================================================================== */
const M1={savedN:0,phase:'title',t:0,lines:{},queue:[],talking:0,said:{},spawnQ:[],sent:0,kept:0,gullN:6,boats:[],hold:180,holdT:0,firstHit:false,done:false,stats:{}};
/* ---------- the voices (decoded once, after the first tap) ---------- */
let RV=null;
function voiceInit(){if(RV||!AU.c||!window.RMD_VOICE||!RMD.RadioVoice)return;RV=RMD.RadioVoice(AU.c,AU.out);
  for(const id in RMD_VOICE){const b=atob(RMD_VOICE[id]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
    AU.c.decodeAudioData(u.buffer).then(buf=>{M1.lines[id]=buf;},()=>{});}}
const WHO={OW:'OVERWATCH',GULL:'GULL',PILOT:'WRAITH'};
/* say a line: the caption, and the take through the radio. Lines wait their turn. then: called when it ends */
function say(id,text,then,o){M1.queue.push({id,text,then,o:o||{}});}
function sayStep(dt){if(M1.talking>0){M1.talking-=dt;if(M1.talking<=0&&M1.cur){const f=M1.cur.then;M1.cur=null;if(f)f();}return;}
  const q=M1.queue.shift();if(!q)return;M1.cur=q;const who=WHO[q.id.split('_')[2]]||'RADIO';
  const buf=M1.lines[q.id];let dur=Math.max(2.2,q.text.length*.065+.8);
  if(buf&&RV&&AU.on){try{dur=RV.play(buf,AU.c.currentTime+.05,{panic:q.o.panic||0})||buf.duration;}catch(e){}}
  radio('<b>'+who+'</b> '+q.text,dur+.6);M1.talking=dur+.35;}
/* ---------- Gull, the pier, the boats ---------- */
MSN.build=function(){
  const Pq=MAP.def.PIER,H=Pq.head;M1.deck={x0:H.x-H.w/2+1,x1:H.x+H.w/2-1,z0:H.z-H.d/2+1,z1:H.z+H.d/2-1,y:Pq.y+.3};
  /* the two boats moored off the pier head (as in D's film: the red one and the blue one) */
  const hull=(len,col)=>{const g=new THREE.Group(),hg=new THREE.BoxGeometry(4.2,2.2,len,1,1,6),p=hg.attributes.position;
    for(let i=0;i<p.count;i++){const z=p.getZ(i)/len+.5,y=p.getY(i);let x=p.getX(i);const bow=Math.pow(Math.max(0,1-z*1.25),1.6);x*=1-bow*.95;if(y<0)x*=.7;p.setX(i,x);if(y>0)p.setY(i,y+bow*.8);}
    hg.computeVertexNormals();const h=new THREE.Mesh(hg,new THREE.MeshStandardMaterial({color:col,roughness:.7}));h.position.y=.5;h.castShadow=true;g.add(h);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(3,2,3.6),new THREE.MeshStandardMaterial({color:0xb8b2a6,roughness:.8}));cab.position.set(0,2.6,len*.12);cab.castShadow=true;g.add(cab);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,6,6),new THREE.MeshStandardMaterial({color:0x2a2a2c}));mast.position.set(0,4.5,-len*.15);g.add(mast);
    const win=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.6),new THREE.MeshBasicMaterial({color:0xffcf8a}));win.position.set(0,2.9,len*.12+1.81);g.add(win);
    S.add(g);return g;};
  M1.boats=[{g:hull(14,0x6b2f26),x:H.x-11,z:H.z-6,yaw:.08},{g:hull(12,0x2f4a5a),x:H.x+11,z:H.z-4,yaw:-.1}];
  for(const b of M1.boats){b.x0=b.x;b.z0=b.z;}
  MSN.marks=[{x:H.x,z:H.z,r:12,c:'#4fe0b8'}];
};
function boatsStep(dt){for(const [i,b] of M1.boats.entries()){
  if(b.go){b.v=Math.min(7,(b.v||0)+dt*1.2);b.z-=b.v*dt;b.x+=Math.sin(b.yaw)*b.v*dt*.3;if(Math.random()<dt*4)RMD.World.ring(b.x,b.z+6,.9);}
  b.g.position.set(b.x,Math.sin(G.t*1.1+i)*.18-.1,b.z);b.g.rotation.set(Math.sin(G.t*.9+i)*.03,Math.PI+b.yaw,Math.sin(G.t*1.3+i*2)*.05);}}
/* Gull: six people on the pier head (green dots), loading */
function makeSquads(){ALLIES.length=0;const D=M1.deck;
  for(let i=0;i<M1.gullN;i++){const x=lerp(D.x0,D.x1,(i+.5)/M1.gullN),z=lerp(D.z0,D.z1,.3+.4*Math.random());
    ALLIES.push({x,z,hx:x,hz:z,vx:0,vz:0,state:0,t0:0,by:null,sq:'GULL',i:i+1,ph:Math.random()*6,pos:V3(x,0,z),kind:'ally',deck:D,y:D.y,
      h:[V3(x,D.y,z),V3(x,D.y,z),V3(x,D.y,z),V3(x,D.y,z),V3(x,D.y,z)]});}}
/* ---------- the swarm out of the surf ---------- */
/* out in the surf, 45 to 65 m off the beach, along 200 m of it, never within 60 m of the pier head */
function surfPoint(){const Pq=MAP.def.PIER,H=Pq.head;for(let k=0;k<20;k++){const x=Pq.x+(Math.random()-.5)*200,z=MAP.def.coast(x)-45-Math.random()*20;if(Math.hypot(x-H.x,z-H.z)>60)return {x,z};}return {x:Pq.x-90,z:-50};}
function queueGroup(kind,n,at,o){const p=surfPoint();for(let i=0;i<n;i++)M1.spawnQ.push({t:kind,at:at+i*.35,x:p.x+(Math.random()-.5)*8,z:p.z+(Math.random()-.5)*8,o:o||{}});}
function spawnStep(dt){for(let i=M1.spawnQ.length-1;i>=0;i--){const q=M1.spawnQ[i];q.at-=dt;if(q.at>0)continue;M1.spawnQ.splice(i,1);
  const c=spawnCluster(q.t,{x:q.x,z:q.z});if(q.o.prefers)c.prefers=q.o.prefers;M1.sent++;
  if(q.t==='skein'&&!M1.said.m107&&!MSN.real){M1.said.m107=1;say('M1_07_OW',"Bigger ones. Twenties. They're going for the pier.");}}}
const N=(n)=>Math.max(1,Math.round(n*TEAM_K*DIFF.count));
function wave1(){const n=N(12);let k=0,at=0;while(k<n){const g=Math.min(4,n-k);queueGroup('knot',g,at);k+=g;at+=(at<10?5:8)+Math.random()*3;}M1.w1End=at;}
function wave2(){const nk=N(16),ns=N(6),T=150;const groups=[];for(let k=0;k<nk;k+=4)groups.push(['knot',Math.min(4,nk-k)]);for(let k=0;k<ns;k+=2)groups.push(['skein',Math.min(2,ns-k)]);
  groups.sort(()=>Math.random()-.5);let sk=0;groups.forEach((g,i)=>queueGroup(g[0],g[1],8+i/groups.length*T,g[0]==='skein'&&(sk++%2===0)?{prefers:'ally'}:{}));}
/* ---------- the flow ---------- */
function startPlay(){audioInit();voiceInit();resetRun();applyUpgrades(true);
  for(const id in BASE_SPEED)RIG[id].speed=BASE_SPEED[id]*DIFF.speed*1.35;
  const SP=MAP.def.SPAWN;P.x=SP.x;P.z=SP.z;P.y=hgt(SP.x,SP.z);P.yaw=P.legYaw=SP.yaw;MSN.camYaw=SP.yaw;CAMS.ready=false;resetWings(true);
  Object.assign(M1,{savedN:0,phase:'intro',t:0,queue:[],talking:0,cur:null,said:{},spawnQ:[],sent:0,firstHit:false,done:false,holdT:0,stats:{t0:G.t,kills0:G.kills}});
  for(const b of M1.boats){b.x=b.x0;b.z=b.z0;b.go=false;b.v=0;b.g.visible=true;}
  makeSquads();MSN.real=true;G.mode='play';G.paused=false;$('title').style.display='none';$('mres').style.display='none';
  objective('');HUD.msg(touchy?'LEFT THUMB MOVES · RIGHT THUMB AIMS AND FIRES · DRAG THE TOP TO TURN':'WASD MOVE · MOUSE AIMS · HOLD LEFT TO FIRE · [ ] TURN THE CAMERA',4.5);
  say('M1_01_OW',"Morning, Wraith. Gull's loading the last boats off the pier.");
  say('M1_02_OW',"Something's coming up the beach. You won't see them with your eyes.",()=>{
    say('M1_03_OW',"Switching you to mine.",()=>{MSN.real=false;MSN.glitch=.9;CAMS.shake=Math.max(CAMS.shake,.3);
      say('M1_04_OW',"There. Red is them. Green is us. Keep the red off the green.");objective('KEEP THE RED OFF THE PIER');});});
  wave1();HUD.banner('FIRST LIGHT');}
/* the mission's own wave flow replaces C's (C's waves stay empty) */
function startWave(){}
function waveClear(){}
function objective(t){const o=$('obj');o.textContent=t;o.style.opacity=t?1:0;}
const mmss=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
MSN.step=function(dt){if(M1.done)return;M1.t+=dt;sayStep(dt);spawnStep(dt);boatsStep(dt);
  const live=EN.filter(e=>!e.dead).length,gull=ALLIES.filter(a=>a.sq==='GULL'&&a.state!==2).length;
  if(!M1.firstHit&&!MSN.real&&EN.some(e=>!e.dead&&e.alive<e.n0)){M1.firstHit=true;say('M1_05_OW',"See it shrink? Ten dots, ten hits. That's the whole trick.");}
  if(M1.phase==='intro'&&!M1.spawnQ.length&&!live&&M1.t>20){M1.phase='hold';M1.holdT=0;
    say('M1_06_GULL',"Gull to whoever's out there! Two boats left. Buy us three minutes!",null,{panic:.35});wave2();HUD.banner('HOLD THE PIER');}
  if(M1.phase==='hold'){M1.holdT+=dt;const left=M1.hold-M1.holdT;objective('HOLD THE PIER · '+mmss(left)+' · GULL '+gull+'/'+M1.gullN);
    /* the first boat goes at the half-way mark with three aboard; the last at the end with everyone left */
    if(!M1.boats[0].go&&M1.holdT>M1.hold/2){M1.boats[0].go=true;board(3);HUD.msg('FIRST BOAT AWAY',1.6);}
    if(left<=0){M1.boats[1].go=true;board(99);M1.phase='away';
      const saved=M1.savedN;M1.stats.saved=saved;objective('');
      say('M1_08_GULL',"Last boat's off! Go, go, go!",()=>{
        const fin=()=>say('M1_10_PILOT',"Morning.",()=>{setTimeout(()=>missionEnd(true),900);});
        if(saved===M1.gullN)say('M1_09_OW',"Gull's away. Every boat. Good morning, Wraith.",fin);else{radio('<b>OVERWATCH</b> Gull’s away. '+saved+' of '+M1.gullN+'.',3);setTimeout(fin,2600);}},{panic:.25});}}
  /* lost: every one of Gull taken */
  if((M1.phase==='hold'||M1.phase==='intro')&&gull===0&&M1.savedN===0){M1.phase='lost';objective('');say('M1_XX_OW',"Gull's gone. I'm sorry, Wraith. Pull back.",()=>setTimeout(()=>missionEnd(false),600));}
};
/* people taken off the pier by boat leave the picture (and count as saved) */
function board(n){for(let i=ALLIES.length-1;i>=0&&n>0;i--){const a=ALLIES[i];if(a.sq==='GULL'&&a.state===0){ALLIES.splice(i,1);M1.savedN++;n--;}}}
function missionEnd(won){if(M1.done)return;M1.done=true;G.mode='clear';saveScrap();const st=M1.stats,s=Math.round(G.t-st.t0);
  $('mrt').textContent=won?'MISSION COMPLETE':'MISSION FAILED';$('mrs').textContent=won?'Gull is away. The beach is quiet.':'Gull didn’t make it off the pier.';
  $('mrl').innerHTML=[['Time',mmss(s)],['Gull saved',(st.saved||0)+' of '+M1.gullN],['Creatures cleared',G.kills-st.kills0],['Team standing',wingsUp()+' of 3'],['Scrap',scrap().toLocaleString('en-US')]]
    .map(r=>'<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('');
  $('mres').style.display='flex';}
