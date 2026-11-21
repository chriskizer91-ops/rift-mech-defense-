'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 5, COPPER (game/cinematic/film/scene-m5c.js, session D)
   1 min 2 on the Saltpans at night: the fixed loss. Copper's eight are across the channel, too wide for the jets.
     0:00  thermal across the channel: eight warm figures holding. "We'll hold. Go."
     0:09  Copper's helmet camera: nothing to see, just the salt moving. The feed drops.
     0:16  the tactical map: eight green dots in the red. On OVERWATCH's words they turn red: two, five, all of them.
     0:30  the pack, bigger. 0:38 the Wraith on the west bank with Reed's squad: "Don't forget them." "I won't."
     0:47  OVERWATCH logs Copper as lost: eight names.
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=62,DT=1/60;
const P11=.35,R11=1+.13*P11,T11=16.6;   /* M5_11 starts at 16.6 s; its words "Two." "Five." "All of them." are at 4.79, 5.72, 6.94 s in the take */
const TW=[T11+4.79/R11,T11+5.72/R11,T11+6.94/R11];
const TURN=[TW[0],TW[0]+.12,TW[1],TW[1]+.1,TW[1]+.22,TW[2],TW[2]+.12,TW[2]+.26];
const LINES=[
 {id:'M5_09_COPPER',t:1.0,w:5.6,who:'COPPER',p:.3,tx:'Copper to Wraith. She’s right. You can’t get to us. We’ll hold. Go.'},
 {id:'M5_10_COPPER',t:9.2,w:3.7,who:'COPPER',p:.75,tx:'We can’t see anything, it’s just the ground moving, it’s…'},
 {id:'M5_11_OW',t:T11,w:7.3,who:'OVERWATCH',p:P11,tx:'Copper, come in. Their dots are changing colour. Two. Five. All of them.'},
 {id:'M5_12_OW',t:30.4,w:6.0,who:'OVERWATCH',p:.3,tx:'They’ve gone red. They’re part of it now. Wraith… that pack just got bigger.'},
 {id:'M5_16_REED',t:38.4,w:4.7,who:'REED',p:.2,tx:'Reed to Wraith. Copper bought us that minute. Don’t forget them.'},
 {id:'M5_17_PILOT',t:44.4,w:1.2,who:'WRAITH',p:0,tx:'I won’t.'},
 {id:'M5_18_OW',t:47.4,w:7.6,who:'OVERWATCH',p:.05,tx:'I’m logging Copper as lost. Eight names. I’ll remember them… even if nobody else does.'}];
const NAMES=['A. BRENNAN','T. REYES','I. VARGA','J. OKAFOR','M. HALLORAN','S. PETROV','N. ASHBY','K. MENSAH'];
const CP=[[44,-8],[47,-3],[43,2],[49,4],[46,8],[51,-6],[52,1],[48,11]];   /* Copper's eight, east of the channel */
const RP=[[-34,6],[-37,10],[-31,13],[-38,15],[-33,18],[-36,3]];          /* Reed's six with the civilians, west */
const WR={x:-24,z:8};
function copperAt(i,t){const [x,z]=CP[i];const tn=TURN[i];const u=ss(tn+.5,tn+9,t);const cx=60,cz=-2;
  return {x:lerp(x,cx,u*.8)+Math.sin(t*3+i)*.15*(t<tn?1:0),z:lerp(z,cz,u*.8)};}
/* the pack: two stalkers coming over the pans for Copper, then everything it took */
const SIM={t:0,sw:null};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=5151;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:2000,maxDebris:800});sw.points.layers.set(1);sw.ground=(x,z)=>SALT.h(x,z);
  SIM.st=[sw.spawn('stalker',V(120,0,-60),-2),sw.spawn('stalker',V(130,0,40),-1),sw.spawn('stalker',V(95,0,-95),-2.5),sw.spawn('stalker',V(140,0,-10),-1.5)];
  SIM.st.forEach(c=>c.prefers='ally');Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.ab=0;}
const TG=[];
function simTo(t){if(t<SIM.t-DT*.5)simReset();const sv=Math.random;Math.random=srnd;let n=0;
  while(SIM.t+DT<=t+1e-9){const tt=SIM.t;TG.length=0;for(let i=0;i<8;i++)if(tt<TURN[i]){const p=copperAt(i,tt);TG.push({pos:V(p.x,0,p.z),kind:'ally',notice:400});}
    if(!TG.length)TG.push({pos:V(-30,0,10),kind:'ally',notice:400});
    SIM.sw.update(DT,tt,TG);
    /* each one taken adds 25 dots to the nearest stalker (eight of them: +200) */
    for(let i=0;i<8;i++)if(tt>=TURN[i]+6&&SIM.ab<=i){const p=copperAt(i,tt);let best=SIM.st[0],bd=1e9;for(const c of SIM.st){const d=Math.hypot(c.pos.x-p.x,c.pos.z-p.z);if(d<bd){bd=d;best=c;}}
      SIM.sw.absorb(best,V(p.x,0,p.z),25);SIM.ab=i+1;}
    SIM.t+=DT;if(++n>20000)break;}Math.random=sv;}
/* Copper's dots: green (blue on the overlay) until each one turns */
const CU={uT:{value:0},uScale:{value:1},uTurn:{value:new Array(8).fill(0)},uPos:{value:Array.from({length:8},()=>new T.Vector3())}};
function copperDots(){const per=16,n=8*per,p=new Float32Array(n*3),s=new Float32Array(n*4);for(let i=0;i<n;i++){p.set([0,0,0],i*3);s.set([Math.floor(i/per),Math.random(),Math.random(),Math.random()],i*4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aS',new T.BufferAttribute(s,4));
  const m=new T.ShaderMaterial({uniforms:CU,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute vec4 aS;uniform float uT,uScale;uniform float uTurn[8];uniform vec3 uPos[8];varying vec3 vC;varying float vA;
    void main(){int k=int(aS.x);vec3 c=uPos[0];float tu=uTurn[0];for(int i=1;i<8;i++)if(i==k){c=uPos[i];tu=uTurn[i];}
      vec3 o=vec3(sin(aS.y*40.+uT*1.3),fract(aS.z*7.)*1.9+.1,cos(aS.w*40.+uT*1.1))*vec3(.45,1.,.45);vec3 p=c+o*(1.+tu*.6);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float px=.9*uScale/max(.001,-mv.z);float cl=clamp(px,3.,16.);
      vA=.7*min(1.,px*px/(cl*cl)+.5);gl_PointSize=cl;vC=mix(vec3(0.,0.,1.),vec3(1.,0.,0.),tu);}`,
    fragmentShader:`varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vC*vA*exp(-r*r*3.),1.);}`});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.layers.set(1);return pts;}
/* people in the real world: Copper's and Reed's, with torches */
let FOLK=[],REED=[],TORCH=[],allyReed=null,allyW=null,cdots=null;
let PBODY=null;function people(scene){const body=new T.MeshStandardMaterial({color:0x2a2e34,roughness:.9,emissive:0x3a2a20,emissiveIntensity:.6});PBODY=body;
  const mk=()=>{const g=new T.Group();const b=new T.Mesh(new T.CapsuleGeometry(.28,.95,4,8),body);b.position.y=.78;g.add(b);const h=new T.Mesh(new T.SphereGeometry(.17,8,6),body);h.position.y=1.6;g.add(h);
    scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});return g;};
  FOLK=CP.map(mk);REED=RP.map(mk);
  for(let i=0;i<4;i++){const L=new T.SpotLight(0xdde6ff,28,70,.35,.6,1.4);scene.add(L);scene.add(L.target);TORCH.push(L);}}
const SHOTS=[
 {t0:0,t1:9,name:'WRAITH · THERMAL',f:u=>({p:vl(V(-27,9.4,12),V(-26,9.2,10),u),l:V(48,1,0),fov:lerp(26,22,u),mode:1,real:.85})},
 {t0:9,t1:16,name:'COPPER 3 · HELMET',f:(u,t)=>{const p=copperAt(2,t);const a=Math.sin(t*1.7)*.9+Math.sin(t*4.3)*.25;return {p:V(p.x,1.65,p.z),l:V(p.x+Math.cos(a)*10,1.65-2.2+Math.sin(t*3.1)*.4,p.z+Math.sin(a)*10),fov:62,shake:.18+ss(12,15,t)*.3,real:1};}},
 {t0:16,t1:30,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(10,105,30),V(36,72,18),ease(u)),l:vl(V(10,0,2),V(44,0,0),ease(u)),fov:52})},
 {t0:30,t1:38,name:'WRAITH · SENSOR',f:u=>({p:vl(V(-20,12,14),V(-18,13,12),u),l:vl(V(58,2,-2),V(40,2,0),u),fov:lerp(30,34,u)})},
 {t0:38,t1:47,name:'REED · OPTICAL',f:u=>({p:vl(V(-44,2.6,26),V(-42,2.4,23),u),l:V(-20,7,6),fov:44,real:1})},
 {t0:47,t1:DUR,name:'OVERWATCH · LOG',f:u=>({p:vl(V(-10,26,60),V(-30,90,120),ease(u)),l:vl(V(30,0,0),V(40,0,-20),u),fov:46,real:1})}];
function logAt(t){if(t<49)return '';let s='';const L=[[49,'CASUALTY LOG · MISSION 5 · THE SALTPANS'],[50.4,'SQUAD COPPER · 8 · LOST']];NAMES.forEach((n,i)=>L.push([51.6+i*.62,'   '+n]));
  for(const [tt,line] of L){if(t<tt)break;s+=line.slice(0,Math.floor((t-tt)*40))+'\n';}return s;}
function tracks(t){simTo(t);const o={};
  o.real=FILM.shotIndex(t)===2?.22:FILM.shotIndex(t)===3?.4:.9;o.mono=FILM.shotIndex(t)>=2&&FILM.shotIndex(t)<=3?.7:0;o.mode=0;
  o.dots=t>=9&&t<16?0:t>=38?0:1;
  o.interf=K([[0,.12],[9,.15],[13,.35],[15.2,.6],[15.5,1],[16,1],[16.3,.15],[TW[2],.22],[TW[2]+.3,.45],[TW[2]+1.4,.2],[30,.22],[38,.1],[47,.06],[DUR,.05]],t);
  o.stut=t>15.2&&t<16.2?1:t>TW[2]&&t<TW[2]+1?.4:0;o.wexp=1.25;o.exp=.85;
  o.fade=ss(DUR-2.2,DUR,t)+(1-ss(0,1.4,t));if(t>15.5&&t<16.05)o.fade=.6;
  o.count=SIM.sw?SIM.sw.dots:0;o.range=t<47?'0.1 KM':null;o.conf=t>15.2&&t<16.3?.04:null;
  o.log=logAt(t);o.nohud=t>48.6;
  o.title=t>58?{k:ss(58,59,t)*(1-ss(60.6,61.8,t)),org:'Mission 5 · Night Shift',t:'COPPER',sub:'Eight names'}:null;
  return o;}
function apply(t,o,cam,px){const sw=SIM.sw;
  CP.forEach((c,i)=>{const p=copperAt(i,t);const G=FOLK[i];G.position.set(p.x,0,p.z);G.visible=t<TURN[i]+1.5;G.rotation.y=Math.atan2(80-p.x,0-p.z)+Math.sin(t*2+i)*.5;CU.uPos.value[i].set(p.x,.2,p.z);CU.uTurn.value[i]=ss(TURN[i],TURN[i]+.35,t);});
  CU.uT.value=t;CU.uScale.value=px;
  RP.forEach(([x,z],i)=>{REED[i].position.set(x,0,z);REED[i].rotation.y=Math.PI*.45+Math.sin(t+i)*.3;});
  /* torches: Copper's swinging over the salt, then gone; two of Reed's */
  TORCH.forEach((L,i)=>{if(i<2){const k=i?5:2;const p=copperAt(k,t);const a=Math.sin(t*1.7+i*2)*.9;L.position.set(p.x,1.5,p.z);L.target.position.set(p.x+Math.cos(a)*14,0,p.z+Math.sin(a)*14);L.intensity=t<TURN[k]+.8?(13*(.85+.15*Math.sin(t*40))):0;}
    else{const [x,z]=RP[i-1];L.position.set(x,1.5,z);L.target.position.set(x+12,0,z-6+Math.sin(t*.7+i)*4);L.intensity=22;}});
  if(TEAM.ready){TEAM.list.forEach((M,k)=>M.root.visible=k===1);TEAM.pose(t,[0,1,2,3].map(()=>({pitch:-.05,yaw:.15,torso:.1,aim:-.2})),[0,1,2,3].map(()=>({x:WR.x,z:WR.z,y:0,yaw:-Math.PI/2+.25,dist:0,spd:0})));}
  allyW.position.set(WR.x,-5.5,WR.z);
  const ch=[];if(sw)for(const c of sw.list)if(!c.dead)ch.push({x:c.pos.x,z:c.pos.z,r:6,k:.9});
  for(let i=0;i<8;i++)if(t>TURN[i]-4&&t<TURN[i]+3){const p=copperAt(i,t);ch.push({x:p.x,z:p.z,r:3.5,k:.8});}
  SALT.update(t,{churn:ch.slice(0,16),lamps:o.mode>.5?.12:1});PBODY.emissiveIntensity=o.mode>.5?5:.6;
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(o.mode>.5);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.4;}
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;}
function cue(S,A,F){const P=S.params,N=FSFX.N,ctx=S.ctx;
  F.RAMP(P.wind,[[0,0],[1.5,.12],[DUR-2,.14],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[1.5,.06],[DUR,0]],A);F.RAMP(P.buzz,[[0,0],[1,.012],[DUR,.01]],A);
  /* crickets on the pans: they stop when it comes */
  const cr=(t0,t1,k)=>{for(let t=t0;t<t1;t+=.4+Math.random()*.6){const o=ctx.createOscillator();o.type='sine';o.frequency.value=4300+Math.random()*500;const g=ctx.createGain();o.connect(g);g.connect(S.sfx);
    for(let j=0;j<3;j++){g.gain.setValueAtTime(0,A(t+j*.055));g.gain.linearRampToValueAtTime(.012*k,A(t+j*.055+.01));g.gain.linearRampToValueAtTime(0,A(t+j*.055+.035));}o.start(A(t));o.stop(A(t+.25));}};
  cr(0,12,1);cr(31,DUR,.6);
  /* Copper's rifles across the water: small, far, then nothing */
  for(let t=2;t<TW[2];t+=.5+Math.random()*1.4){S.thud(A(t),.5,.15);if(Math.random()<.6)S.ac(A(t),.5,.07,2+Math.floor(Math.random()*3));}
  for(let t=9.4;t<15.4;t+=.25+Math.random()*.4)S.thud(A(t),(Math.random()-.5),.5);
  S.glitch(A(13.2),2,.6);S.burst(A(15.2),1,1);
  S.fizz(A(TW[0]),.3,.3);S.fizz(A(TW[1]),.3,.35);S.burstC(A(TW[2]),.3,.5);
  /* the music: piano and a low choir; one deep hit on "All of them", then nothing */
  S.chord(A(.5),9,['D2','A2','F3'],.45,'pad');[[1.2,'D4'],[3.4,'F4'],[5.6,'E4'],[7.8,'A3']].forEach(([t,n])=>S.chord(A(t),2.4,[n],.6,'pno'));
  F.RAMP(P.hum,[[0,0],[8,0],[12,.08],[16,.12],[TW[2],.16],[TW[2]+.15,0]],A);
  S.chord(A(16.4),8.4,['D2','A2','D3'],.5,'choir');S.hit(A(TW[2]),.9);S.note(A(TW[2]+.4),6);
  S.chord(A(30.3),8,['Bb1','F2','D3'],.5,'str');
  [[38.6,['D3','F3','A3']],[41.6,['Bb2','D3','F3']],[44.6,['F2','A2','C3','F3']]].forEach(([t,c])=>S.chord(A(t),3.2,c,.55,'str'));
  [[45.0,'A4'],[46.2,'F4']].forEach(([t,n])=>S.chord(A(t),2.6,[n],.75,'pno'));
  const end=[['D3','A3','F4'],['Bb2','F3','D4'],['G2','D3','Bb3'],['A2','E3','C#4'],['D3','A3','D4','F4']];end.forEach((c,i)=>S.chord(A(47.4+i*2.8),3.4,c,.55,i%2?'pad':'str'));
  [[48,'A4'],[49.4,'G4'],[50.8,'F4'],[53.6,'E4'],[55,'D4'],[57.8,'F4'],[59.2,'D4']].forEach(([t,n])=>S.chord(A(t),2.6,[n],.7,'pno'));
  for(let i=0;i<8;i++)S.beep(A(51.6+i*.62),1500,.35);S.chord(A(56.2),5,['D3','F3','A3','D4'],.45,'choir');}
function build(scene,F){SALT.build(scene);for(const o of SALT.occ)o.layers.enable(2);people(scene);
  cdots=copperDots();scene.add(cdots);
  allyReed=SIG.makeAllies(RP.map(([x,z])=>V(x,5.5-3.6,z)));allyReed.scale.set(1,1,1);allyReed.layers.set(1);scene.add(allyReed);
  allyW=SIG.makeAllies([V(0,5.5,0)]);allyW.layers.set(1);scene.add(allyW);simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[['COPPER · 8','green',()=>V(47,6,0),t=>t>=1&&t<9],['COPPER · 8','green',()=>V(47,4,0),t=>t>=16&&t<TW[0]],['COPPER · LOST','red mark',()=>V(52,4,0),t=>t>=TW[2]+.6&&t<30],
  ['REED · 6','green',()=>V(-35,5,10),t=>t>=16&&t<30],['CHANNEL · 60 M','',()=>V(0,1,-30),t=>t>=16&&t<24]];
FILM.run({id:'m5c',DUR,place:'The Saltpans',pageTitle:'IRMD · Mission 5 · Copper',clock:[23,41,0],poster:20,
  start:{org:'International Rift Mech Defense · Mission 5',t:'Night Shift',sub:'The Saltpans · 23:41 · 1 min<br>Sound on, headphones if you have them'},
  end:{org:'Squad Copper',t:'Eight names',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
})();
