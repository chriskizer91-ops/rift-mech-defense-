'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 8, THE SIGNAL (game/cinematic/film/scene-m8.js, session D)
   4 min 6 in Arlen Bay at night, straight after the reveal (cin-main.js): the same bay (cin-world.js), the same Signal
   (cin-signal.js), the team on the harbour wall. The fight, then the ending.
     0:00  900,000 and three rifts feeding it. ANVIL: "Give me a mark." Harrow and Wren paint rifts 3 and 2; two salvos.
     0:47  the last rift is behind the Signal: the Wraith's long hover out over the bay to mark it. Rift 1 closes. 600,000.
     1:26  it comes ashore and changes: risen (the slam), spread (two 5,000-dot arms crawl for Wren and Miller), hunched
           (the core in the hump, on thermal). 300,000.
     2:26  too close: the picture fails. "Listen for the thud." Three clear windows, each more tired. 50,000.
     2:58  "I can hold it still for you. It's going to cost me." The Lance. It sinks into the bay; the rain stops.
     3:23  the last dots drift into one point and turn toward the sensor. "It wasn't looking at you. It was looking at me."
           "I'm here." "Good. Stay." Over black: new contacts, 6, bearing every direction.
   The lines "Four rifts feeding it" and "Four holes" (M8F_01, M8F_02) are left out: the reveal closes the fourth.
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=246,DT=1/30,SIGS=2.5;
const lin=(keys,t)=>{if(t<=keys[0][0])return keys[0][1];for(let i=0;i<keys.length-1;i++){const [a,va]=keys[i],[b,vb]=keys[i+1];if(t<b)return lerp(va,vb,(t-a)/(b-a));}return keys[keys.length-1][1];};
const bump=(a,b,c,d,t)=>ss(a,b,t)*(1-ss(c,d,t));
/* ---------------------------------------------------------------- the beats */
const FIRE=[21.5,29.8,66.4],LAND=[34.4,41.6,78.6];       /* ANVIL's salvos: rift 3 (west), rift 2 (east), rift 1 (behind the Signal) */
const RIFT=[V(-700,0,-1380),V(430,0,-1520),V(-120,0,-1150)];
const SLAM=103.2,TIPS0=108.5,KILLA=122.5,KILLB=125.5,HUNCH=130;
const WIN=[[158.0,1.4],[165.4,1.4],[173.6,1.8]];
const inWin=t=>{for(let i=0;i<3;i++)if(t>=WIN[i][0]&&t<WIN[i][0]+WIN[i][1])return i;return -1;};
const HOLD0=191.6,LANCE=195.6,ONE=203,STATIC=206.5,BLACK=230.5;
const LINES=[
 {id:'GEN_07_ANVIL',t:9.6,w:2.9,who:'ANVIL',p:.2,tx:'ANVIL, guns up. Give me a mark.'},
 {id:'GEN_12_LANTERN_SQ4',t:15.6,w:2.4,who:'HARROW',p:.3,tx:'Painting it. Send it!'},
 {id:'GEN_08_ANVIL',t:21.0,w:4.2,who:'ANVIL',p:.35,tx:'Shot, over! Twenty seconds! Don’t stand there!'},
 {id:'GEN_12_LANTERN_SQ1',t:27.2,w:2.4,who:'WREN',p:.35,tx:'Painting it. Send it!'},
 {id:'GEN_09_ANVIL',t:34.6,w:1.6,who:'ANVIL',p:.2,tx:'Splash.'},
 {id:'M8F_03_OW',t:37.2,w:4.2,who:'OVERWATCH',p:.3,tx:'A hundred thousand, gone.'},
 {id:'GEN_10_ANVIL',t:42.4,w:3.7,who:'ANVIL',p:.15,tx:'That’s a hole in the ground now. Rift’s closed.'},
 {id:'M8F_04_OW',t:47.0,w:4.0,who:'OVERWATCH',p:.3,tx:'The last one’s across the channel. Long hover.'},
 {id:'PING_03_PILOT',t:51.0,w:1.6,who:'WRAITH',p:.3,tx:'On it.'},
 {id:'GEN_11_ANVIL',t:79.6,w:3.7,who:'ANVIL',p:.2,tx:'That’s the last of them. You’re on your own, son.'},
 {id:'M8F_05_OW',t:86.0,w:3.0,who:'OVERWATCH',p:.6,tx:'It’s coming ashore. And it’s changing!'},
 {id:'M8F_06_OW',t:97.6,w:4.3,who:'OVERWATCH',p:.8,tx:'It’s standing up! Stay low, stay out of the air!'},
 {id:'M8F_07_OW',t:109.0,w:4.0,who:'OVERWATCH',p:.45,tx:'It’s spreading out. The arms are crawling for the squads.'},
 {id:'M8F_09_WREN',t:116.2,w:3.0,who:'WREN',p:.6,tx:'Something’s coming up the lighthouse steps.'},
 {id:'M8F_08_OW',t:129.0,w:4.4,who:'OVERWATCH',p:.4,tx:'Hunched. The core’s in the hump. Thermal, now.'},
 {id:'M8F_10_OW',t:146.6,w:3.8,who:'OVERWATCH',p:.45,tx:'It’s too close. I can’t hold the picture.'},
 {id:'M8F_11_OW',t:151.6,w:3.9,who:'OVERWATCH',p:.4,tx:'I’ll give you what I can. Listen for the thud.'},
 {id:'M8F_12_OW_A',t:WIN[0][0]-.57,w:1.4,who:'OVERWATCH',p:.4,tx:'Now.'},
 {id:'M8F_12_OW_B',t:WIN[1][0]-1.9,w:3.0,who:'OVERWATCH',p:.4,tx:'…Now.'},
 {id:'M8F_12_OW_C',t:WIN[2][0]-1.0,w:4.2,who:'OVERWATCH',p:.4,tx:'Now…'},
 {id:'M8F_13_OW',t:178.4,w:5.6,who:'OVERWATCH',p:.3,tx:'I can hold it still for you. A long one. It’s going to cost me.'},
 {id:'M8F_14_OW',t:185.2,w:2.9,who:'OVERWATCH',p:.3,tx:'Charge the Lance. Tell me when.'},
 {id:'M8F_15_PILOT',t:189.6,w:1.2,who:'WRAITH',p:.1,tx:'Now.'},
 {id:'M8F_16_OW',t:191.0,w:3.7,who:'OVERWATCH',p:.5,tx:'Holding… holding…'},
 {id:'C2_01_OW',t:208.6,w:3.6,who:'OVERWATCH',p:.2,tx:'Wraith. It wasn’t looking at you.'},
 {id:'C2_02_OW',t:213.6,w:2.3,who:'OVERWATCH',p:.25,tx:'It was looking at me.'},
 {id:'C2_03_OW',t:218.4,w:2.0,who:'OVERWATCH',p:.2,tx:'…Are you still there?'},
 {id:'C2_04_PILOT',t:222.4,w:1.8,who:'WRAITH',p:0,tx:'I’m here.'},
 {id:'C2_05_OW',t:225.6,w:3.6,who:'OVERWATCH',p:.2,tx:'Good. Stay.'}];
/* ---------------------------------------------------------------- the Signal: where it is, what shape it holds, how many dots */
function sigS(t){const f2=ss(126,HUNCH,t);const f1=K([[0,.75],[30,.55],[86,.5],[92,.25],[96,.3],[100.4,1],[108,1],[112,.5],[126,.45],[HUNCH,0]],t);
  let pulse=.5+.5*Math.sin(t*1.6);if(inWin(t)>=0||(t>HOLD0&&t<LANCE))pulse=Math.max(pulse,.9);if(t>LANCE)pulse=Math.max(pulse,1-ss(LANCE,LANCE+1.4,t));
  return {sx:K([[0,-120],[86,-120],[112,-60]],t),sigY:K([[0,0],[LANCE,0],[ONE,-280]],t),sigZ:K([[0,-900],[86,-900],[112,-300],[146,-250],[178,-225]],t),
    f0:Math.max(0,1-f1-f2),f1,f2,raise:ss(100.6,103.0,t)*(1-ss(103.05,103.3,t)),slam:ss(103.05,103.25,t)*(1-ss(104.4,107,t)),
    roar:bump(86.6,87.4,88.6,89.6,t)+bump(101.6,102.3,103.8,105,t)+.6*bump(146,146.6,148,149,t)+bump(LANCE,LANCE+.3,LANCE+2,LANCE+3.5,t),
    ag:K([[0,.35],[86,.4],[100,.6],[108,.7],[110,1],[124,1],[128,.6],[146,.8],[178,.4],[LANCE,.2],[ONE,0]],t),pulse};}
const sigCount=t=>lin([[0,900000],[LAND[0],900000],[LAND[0]+2,800000],[LAND[1],800000],[LAND[1]+2,700000],[LAND[2],700000],[LAND[2]+2,600000],[133,600000],[146,300000],
  [WIN[0][0],300000],[WIN[0][0]+1.2,220000],[WIN[1][0],220000],[WIN[1][0]+1.2,140000],[WIN[2][0],140000],[WIN[2][0]+1.6,50000],[LANCE,50000],[ONE,300],[STATIC,300],[STATIC+.1,0]],t);
let sig=null,sigG=null;const CORE=V();
function poseSig(t){const s=sigS(t);sigG.position.set(s.sx,s.sigY,s.sigZ);sigG.rotation.y=0;sigG.updateMatrixWorld(true);
  SIG.pose(t+161,s,sigS(Math.max(0,t-.5)));CORE.copy(SIG.CORE_C).applyMatrix4(SIG.hostMat.uniforms.uPart.value[0]).applyMatrix4(sigG.matrixWorld);return s;}
/* ---------------------------------------------------------------- the team on the wall; the Wraith's long hover */
const WK=[[0,-7,-1.5,5.5],[51.8,-7,-1.5,5.5],[53.2,-7,-5,9.5],[65,60,-690,5.5],[68.4,60,-690,5.5],[80.4,-7,-7,8.5],[82,-7,-1.5,5.5],[DUR,-7,-1.5,5.5]];
function wpos(t){for(let i=0;i<WK.length-1;i++){const [a,ax,az,ay]=WK[i],[b,bx,bz,by]=WK[i+1];if(t<b||i===WK.length-2){const u=ss(a,b,t);return {x:lerp(ax,bx,u),z:lerp(az,bz,u),y:lerp(ay,by,u)};}}}
const hovK=t=>ss(51.8,52.6,t)*(1-ss(81.2,82,t));
const WT=(function(){const tb=[];let yaw=0,px=null,pz=null;for(let i=0;i<=DUR*20;i++){const t=i/20,p=wpos(t);
  if(px!=null){const dx=p.x-px,dz=p.z-pz,s=Math.hypot(dx,dz)*20;const want=s>2?Math.atan2(-dx,-dz):(t>64&&t<69?.373:0);let a=want-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));yaw+=a*.08;}
  tb.push({x:p.x,z:p.z,y:p.y,yaw});px=p.x;pz=p.z;}return tb;})();
function wraith(t){const i=clamp(t*20,0,DUR*20-1),j=Math.floor(i),f=i-j,a=WT[j],b=WT[j+1]||a;const h=hovK(t);
  return {x:lerp(a.x,b.x,f),z:lerp(a.z,b.z,f),y:lerp(a.y,b.y,f)+h*Math.sin(t*3)*.25,yaw:a.yaw+(b.yaw-a.yaw)*f,dist:0,spd:0,hov:h};}
const teamAt=t=>TEAM.SPOTS.map((s,k)=>k===1?wraith(t):{x:s.x,z:s.z,y:5.5,yaw:0,dist:0,spd:0,hov:0});
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- the arms: two 5,000-dot clusters crawling for Wren and Miller */
const TPA=[[TIPS0,40,-260],[116,200,-90],[121.5,244,-28],[DUR,248,-22]],TPB=[[TIPS0,-160,-270],[117,-190,-60],[124.5,-204,30],[DUR,-206,36]];
function tipPos(i,t){const P=i?TPB:TPA;return {x:K(P.map(q=>[q[0],q[1]]),t)+Math.sin(t*1.7+i)*2,z:K(P.map(q=>[q[0],q[2]]),t)+Math.cos(t*1.3+i)*2};}
/* ---------------------------------------------------------------- the sim: the arms, the team's guns, the Lance */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=8181;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:12000,maxDebris:3000});sw.points.layers.set(1);sw.ground=()=>0;
  Math.random=sv;SIM.sw=sw;SIM.t=0;SIM.tips=null;SIM.cool=[.4,1.1,.7,1.5];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];FFX.reset();}
function nearest(list,x,z,max){let b=null,bd=max||1e9;for(const c of list||[]){if(c.dead||c.gone)continue;const d=Math.hypot(c.pos.x-x,c.pos.z-z);if(d<bd){bd=d;b=c;}}return b;}
const firing=t=>t>113&&t<126?'tips':(t>133&&t<146)||inWin(t)>=0?'core':null;
const TG=[];
function simStep(){const t=SIM.t,sw=SIM.sw;const sv=Math.random;Math.random=srnd;
  if(t<TIPS0&&t+DT>=TIPS0)SIM.tips=[0,1].map(i=>{const p=tipPos(i,t);const c=sw.spawn('hulk',V(p.x,0,p.z),0);c.prefers='ally';return c;});
  TG.length=0;TG.push({pos:V(-7,5.5,-1.5),kind:'mech',notice:60});sw.update(DT,t,TG);
  if(SIM.tips)SIM.tips.forEach((c,i)=>{if(c.dead)return;const p=tipPos(i,t),q=tipPos(i,t+.5);c.pos.set(p.x,0,p.z);c.heading=Math.atan2(q.x-p.x,q.z-p.z)||c.heading;c.target=null;
    if(t>=(i?KILLB:KILLA)){const at=sw.center(c);sw.hit(c,at,80,c.count+10);SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:'arm'});}});
  const mode=firing(t),tm=teamAt(t);let core=null;
  for(let k=0;k<4;k++){const m=tm[k];if(m.hov>.05)continue;
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      for(let r=n1;r<n0;r++){const mz=muzzle(m,(r%2)?1:-1);const c=SIM.tgt[k];let at;
        if(c==='core'){if(!core){poseSig(t);core=CORE.clone();}at=core.clone().add(V((srnd()-.5)*40,(srnd()-.5)*30,(srnd()-.5)*40));if(srnd()<.5)SIM.ev.push({t,k:'hit',x:at.x,z:at.z});}
        else if(c&&!c.dead){at=sw.center(c).add(V((srnd()-.5)*12,(srnd()-.5)*5,(srnd()-.5)*12));if(srnd()<.7){const got=sw.hit(c,at,4,40);if(got>0)SIM.ev.push({t,k:'hit',x:at.x,z:at.z});}}
        else at=mz.clone().add(V(0,20,-200));
        FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);if(c!=='core')FFX.puff(t,V(at.x,0,at.z),1.2,6);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let c=null;if(mode==='tips')c=nearest(SIM.tips,m.x,m.z,700);else if(mode==='core')c='core';
      if(c){SIM.tgt[k]=c;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=inWin(t)>=0?.1:.9+srnd()*.8;}else SIM.cool[k]=.2;}}}
  /* the Lance: a long beam into the core */
  if(t>=LANCE&&t<LANCE+.5){poseSig(t);const m=tm[1];const mz=muzzle(m,1);FFX.shot(t,mz,CORE.clone(),4);FFX.flash(t,mz,3.2);if(t<LANCE+DT)SIM.ev.push({t,k:'lance',x:CORE.x,z:CORE.z});}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>20000)break;}}
/* ---------------------------------------------------------------- the last dots: one point that turns toward the sensor */
const OU={uT:{value:0},uScale:{value:1},uK:{value:0},uA:{value:0},uP:{value:new T.Vector3(-50,40,-230)},uC:{value:new T.Vector3(-60,0,-225)}};
function oneDots(){const n=300,p=new Float32Array(n*3),s=new Float32Array(n*4);for(let i=0;i<n;i++){const r=30+Math.random()*90,a=Math.random()*6.283;p.set([Math.cos(a)*r,10+Math.random()*120,Math.sin(a)*r],i*3);
    s.set([Math.random(),Math.random(),Math.random(),Math.random()],i*4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aS',new T.BufferAttribute(s,4));
  const m=new T.ShaderMaterial({uniforms:OU,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute vec4 aS;uniform float uT,uScale,uK,uA;uniform vec3 uP,uC;varying float vA;
    void main(){float k=smoothstep(aS.x*.6,aS.x*.6+.4,uK);vec3 w=mix(uC+position+vec3(sin(uT*.7+aS.y*9.),cos(uT*.5+aS.z*9.),0.)*3.,uP,k);
      vec4 mv=modelViewMatrix*vec4(w,1.);gl_Position=projectionMatrix*mv;float px=1.2*uScale/max(.001,-mv.z);float cl=clamp(px,2.,14.);
      vA=uA*.5*min(1.,px*px/(cl*cl)+.4);gl_PointSize=cl;}`,
    fragmentShader:`varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(1.,0.,0.)*vA*exp(-r*r*3.),1.);}`});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.layers.set(1);return pts;}
/* ---------------------------------------------------------------- shots (grid: the sensor grid; v: how loud the guns are from here) */
const W1=t=>wraith(t);
const SHOTS=[
 {t0:0,t1:9,name:'OVERWATCH · DRONE',grid:.3,v:.4,f:u=>({p:vl(V(-7,82,52),V(70,180,200),ease(u)),l:vl(V(-7,0,-3),V(-110,160,-900),ease(ss(.05,.9,u))),fov:lerp(42,44,u),real:.75,mono:.2})},
 {t0:9,t1:15.2,name:'ANVIL · BATTERY',v:.6,f:u=>({p:vl(V(-866,89.4,263),V(-870,90.4,258),u),l:V(-130,175,-900),fov:30,real:.9})},
 {t0:15.2,t1:21.2,name:'HARROW · SENSOR',grid:.3,v:.4,f:u=>({p:V(152,9.6,3),l:vl(V(-640,60,-1300),V(-700,40,-1380),u),fov:lerp(13,11,u),real:.4,mono:.5})},
 {t0:21.2,t1:27,name:'ANVIL · BATTERY',v:1,f:(u,t)=>({p:vl(V(-862,88.4,250),V(-860,88,247),u),l:V(-500,260,-1200),fov:42,real:.9,shake:t>FIRE[0]-.05&&t<FIRE[0]+1.4?.5*(1-ss(FIRE[0],FIRE[0]+1.4,t)):0})},
 {t0:27,t1:34.2,name:'WREN · SENSOR',grid:.3,v:.4,f:u=>({p:V(254,38,-36),l:vl(V(400,70,-1480),V(430,50,-1520),u),fov:lerp(15,12,u),real:.4,mono:.5})},
 {t0:34.2,t1:41.4,name:'WRAITH · SENSOR',grid:.3,v:.6,f:u=>({p:V(-10,11,6),l:V(-700,40,-1380),fov:lerp(20,17,u),real:.45,mono:.45})},
 {t0:41.4,t1:47,name:'WRAITH · SENSOR',grid:.3,v:.6,f:u=>({p:V(14,12,10),l:V(430,40,-1520),fov:lerp(17,15,u),real:.45,mono:.45})},
 {t0:47,t1:53.4,name:'KESTREL · OPTICAL',v:1,f:(u,t)=>{const w=W1(t);return {p:V(-24,10,9),l:V(w.x,w.y+5,w.z-4),fov:46,real:.9};}},
 {t0:53.4,t1:60,name:'KESTREL · OPTICAL',v:.7,f:(u,t)=>{const w=W1(t);return {p:V(-21,12,-2),l:V(w.x,w.y+4,w.z),fov:lerp(34,16,u),real:.85};}},
 {t0:60,t1:66.4,name:'WRAITH · SENSOR',grid:.4,v:1,f:(u,t)=>{const w=W1(t);return {p:V(w.x-1,w.y+9.5,w.z+3),l:V(-120,30,-1150),fov:38,real:.4,mono:.45,shake:.06};}},
 {t0:66.4,t1:72,name:'OVERWATCH · TACTICAL',grid:1.2,v:.4,f:u=>({p:vl(V(-60,1300,-350),V(-60,1200,-380),u),l:V(-60,0,-560),fov:56,real:.2,mono:.8})},
 {t0:72,t1:78.2,name:'WRAITH · OPTICAL',v:1,f:(u,t)=>{const w=W1(t);return {p:V(w.x+10,w.y+4,w.z+34),l:V(w.x,w.y+3,w.z-20),fov:44,real:.85,shake:.05};}},
 {t0:78.2,t1:86,name:'HALE · SENSOR',grid:.3,v:.6,f:u=>({p:V(32,13,12),l:V(-120,40,-1150),fov:lerp(22,19,u),real:.45,mono:.45})},
 /* it comes ashore */
 {t0:86,t1:95,name:'WRAITH · SENSOR',grid:.4,v:.8,f:(u,t)=>{const s=sigS(t);return {p:vl(V(-4,10,8),V(-5,10.5,10),u),l:V(s.sx,120,s.sigZ),fov:lerp(30,46,u),real:.45,mono:.45,shake:.04+.06*u};}},
 {t0:95,t1:103,name:'KESTREL · OPTICAL',v:1,f:(u,t)=>{const s=sigS(t);return {p:V(-25,7.5,5),l:V(s.sx,lerp(120,260,ss(.2,.8,u)),s.sigZ),fov:58,real:.85,shake:.05};}},
 {t0:103,t1:109,name:'OVERWATCH · DRONE',grid:.3,v:.7,f:(u,t)=>({p:vl(V(320,170,280),V(300,160,250),u),l:V(-40,90,-230),fov:48,real:.7,mono:.2,shake:t<105?.6*(1-ss(SLAM,105,t)):0})},
 {t0:109,t1:116,name:'OVERWATCH · TACTICAL',grid:1.2,v:.5,f:u=>({p:vl(V(10,620,-40),V(10,580,-60),u),l:V(10,0,-130),fov:58,real:.2,mono:.8})},
 {t0:116,t1:122.4,name:'WREN · OPTICAL',v:.6,f:(u,t)=>{const p=tipPos(0,t);return {p:V(234,9,-4),l:V(p.x,2,p.z),fov:56,real:.6,mono:.25,shake:.05};}},
 {t0:122.4,t1:128.8,name:'WRAITH · SENSOR',grid:.4,v:1,f:u=>({p:V(10,13,10),l:V(-200,4,20),fov:50,real:.45,mono:.45})},
 {t0:128.8,t1:134,name:'WRAITH · SENSOR',grid:.4,v:.8,f:u=>({p:V(-4,10,9),l:CORE.clone(),fov:lerp(34,28,u),real:.45,mono:.45,shake:.04})},
 {t0:134,t1:146.4,name:'WRAITH · THERMAL',v:1,f:u=>({p:vl(V(-0.6,6.8,7.2),V(-1.4,6.6,6),u),l:CORE.clone(),fov:lerp(34,28,u),mode:1,real:.85})},
 /* too close */
 {t0:146.4,t1:156.8,name:'WRAITH · SENSOR',grid:.4,v:1,f:u=>({p:vl(V(-5,10,8),V(-6,10.4,9),u),l:CORE.clone().add(V(0,40,0)),fov:lerp(50,56,u),real:.45,mono:.5,shake:.08})},
 {t0:156.8,t1:163.4,name:'WRAITH · SENSOR',grid:.4,v:1,f:u=>({p:V(-9,12,10),l:CORE.clone(),fov:36,real:.45,mono:.5,shake:.06})},
 {t0:163.4,t1:171.2,name:'HALE · SENSOR',grid:.4,v:1,f:u=>({p:V(23,10,6),l:CORE.clone(),fov:40,real:.45,mono:.5,shake:.06})},
 {t0:171.2,t1:178.2,name:'WRAITH · SENSOR',grid:.4,v:1,f:u=>({p:V(-5,10,8),l:CORE.clone(),fov:30,real:.45,mono:.5,shake:.06})},
 /* the long hold, the Lance */
 {t0:178.2,t1:185,name:'WRAITH · OPTICAL',v:.7,f:u=>({p:vl(V(4,8.6,14),V(3,8.4,12),u),l:vl(V(-8,10,-4),V(-30,80,-200),ease(u)),fov:44,real:.85})},
 {t0:185,t1:191.4,name:'WRAITH · SENSOR · LOCK',grid:.4,v:1,f:u=>({p:V(-7,12.6,-5),l:CORE.clone(),fov:lerp(32,20,ease(u)),real:.45,mono:.5})},
 {t0:191.4,t1:LANCE,name:'WRAITH · SENSOR · LOCK',grid:.4,v:1,f:u=>({p:V(-7,12.6,-5),l:CORE.clone(),fov:lerp(20,17,u),real:.45,mono:.5})},
 {t0:LANCE,t1:ONE,name:'KESTREL · OPTICAL',v:1,f:(u,t)=>({p:vl(V(-28,8,8),V(-30,9,12),u),l:vl(CORE.clone(),V(-60,20,-230),ss(.3,1,u)),fov:lerp(40,50,u),real:.85,shake:.6*(1-ss(LANCE,LANCE+2,t))})},
 /* the ending */
 {t0:ONE,t1:206,name:'OVERWATCH · DRONE',grid:.3,v:.5,f:u=>({p:vl(V(140,70,150),V(132,66,142),u),l:V(-40,25,-200),fov:40,real:.75,mono:.2})},
 {t0:206,t1:217,name:'WRAITH · SENSOR',grid:.4,v:.5,f:u=>({p:V(-7,12.6,-5),l:V(-50,40,-230),fov:lerp(16,9,ease(u)),real:.45,mono:.5})},
 {t0:217,t1:BLACK,name:'WRAITH · OPTICAL',v:.5,f:u=>({p:vl(V(-34,14,32),V(-30,13,26),u),l:V(-7,7,-12),fov:40,real:1})},
 {t0:BLACK,t1:DUR,name:'OVERWATCH · LOG',v:.3,f:u=>({p:V(-7,82,52),l:V(-7,0,-3),fov:42,real:1})}];
/* ---------------------------------------------------------------- the rain stops when it dies, drifts up, falls again */
const RAINV=t=>K([[0,1],[LANCE,1],[LANCE+1.6,0],[STATIC+1,0],[STATIC+3,-.22],[222,-.22],[227,1]],t);
const FALL=[0];for(let i=1;i<=DUR*20+20;i++)FALL.push(FALL[i-1]+RAINV((i-.5)/20)/20);
const fallAt=t=>{const i=clamp(t*20,0,FALL.length-2),j=Math.floor(i);return lerp(FALL[j],FALL[j+1],i-j);};
function logAt(t){if(t<BLACK+1.6)return '';let s='';for(const [tt,line] of [[BLACK+1.6,'NEW CONTACTS: 6'],[BLACK+3,'BEARING: EVERY DIRECTION']]){if(t<tt)break;s+=line.slice(0,Math.floor((t-tt)*30))+'\n';}return s;}
let NOW=0;
function tracks(t){simTo(t);NOW=t;poseSig(t);const o={};const sh=SHOTS[FILM.shotIndex(t)];const w=inWin(t),hold=t>=HOLD0&&t<LANCE;
  o.real=.9;o.mono=0;o.mode=0;o.dots=1;o.grid=sh.grid||0;
  o.interf=K([[0,.25],[10,.2],[50,.22],[86,.3],[100,.4],[110,.35],[128,.4],[146,.6],[156,.72],[178,.75],[HOLD0,.75],[LANCE,.4],[LANCE+1,.9],[LANCE+2.2,.15],[STATIC,.12],[STATIC+.05,1],[STATIC+1,1],[STATIC+1.05,.12],[DUR,.06]],t);
  if(t>146&&t<HOLD0&&w<0)o.interf+=.12*Math.max(0,Math.sin(t*6.1));
  o.clear=0;if(w>=0){o.clear=.85;o.interf=.15;}if(hold){o.clear=1;o.interf=.05;}
  o.stut=t>STATIC&&t<STATIC+1?1:t>140&&t<HOLD0&&w<0?lerp(.3,.75,ss(146,178,t)):hold?0:t>86&&t<140?.15:0;
  o.wexp=1.1;o.exp=.75;
  o.flash=t>SLAM&&t<SLAM+1?.3*(1-ss(SLAM,SLAM+1,t)):t>LANCE&&t<LANCE+1.4?.45*(1-ss(LANCE,LANCE+1.4,t)):0;
  o.fade=(1-ss(0,1.4,t))+ss(BLACK,BLACK+1.1,t);
  o.count=Math.round(sigCount(t)+(SIM.sw?SIM.sw.dots:0));
  o.range=t<BLACK?(Math.max(.05,Math.hypot(CORE.x+7,CORE.z+1.5)/1000)).toFixed(2)+' KM':null;
  o.conf=hold?1:t>146&&t<HOLD0&&w<0?.15:null;o.lock=w>=0||hold;
  o.log=logAt(t);o.nohud=t<7.6||t>BLACK;
  o.title=t<8?{k:ss(1,2,t)*(1-ss(6.2,7.6,t)),org:'Mission 8 · 23:58',t:'THE SIGNAL',sub:'Arlen Bay · 900,000 · three rifts feeding it'}:
    t>238.6?{k:ss(238.6,239.8,t)*(1-ss(DUR-1.6,DUR-.2,t)),org:'End of chapter 1',t:'RIFT MECH DEFENSE',sub:'International Rift Mech Defense · Arlen Bay'}:null;
  return o;}
function lookOf(t,tm){return tm.map((m,k)=>{let p=null;const c=SIM.tgt[k];
  if(SIM.burst[k]>0&&c==='core')p=CORE;else if(SIM.burst[k]>0&&c&&c!=='core'&&!c.dead)p=c.pos;else if(t>86&&t<ONE)p=CORE;
  let yaw=0,pitch=-.02;if(p){const a=Math.atan2(-(p.x-m.x),-(p.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);pitch=clamp(Math.atan2(p.y-(m.y+8),Math.hypot(p.x-m.x,p.z-m.z))*.6,-.1,.45);}
  const f=(t>112&&t<150)||(t>156&&t<LANCE+1);return {pitch,yaw:yaw*.5,torso:yaw*.8,aim:f?-.32:-.12};});}
let grid=null,allyTeam=[],allyOthers=null,jets=[];const GRIDC=V(-7,.4,-2);
function apply(t,o,cam,px){const th=o.mode>.5;const s=sigS(t);const U=SIG.hostMat.uniforms;const k0=1-ss(LAND[2],LAND[2]+1.6,t),k1=1-ss(LAND[1],LAND[1]+1.6,t),k2=1-ss(LAND[0],LAND[0]+1.6,t);
  U.uRes.value=1;U.uQ.value=K([[0,.3],[146,.4],[178,.5],[LANCE,.2]],t);U.uCR.value=.05*k0;U.uCol.value=12;U.uClipY.value=0;U.uCloud.value.set(0,(0-s.sigY)/SIGS+1,0);
  sig.geo.setDrawRange(0,Math.floor(sigCount(t)));
  const thin=clamp(Math.sqrt(600000/Math.max(1,sigCount(t))),1,4);U.uGain.value=(th?.0022:.06)*(LOOK.HALF?1:2.5)*thin;U.uCG.value=th?3:7;U.uSize.value=th?2.2:.38;U.uMin.value=th?2.2:1.1;U.uMax.value=th?30:5;U.uSoft.value=th?1:0;U.uScale.value=px;
  const RU=SIG.riftMat.uniforms;RU.uT.value=t;RU.uScale.value=px;RU.uSoft.value=th?1:0;RU.uGain.value=(th?.004:.05)*(LOOK.HALF?1:2.5);RU.uSize.value=th?6:1.6;RU.uMax.value=th?30:7;RU.uQ.value=U.uQ.value;
  RU.uFeed.value=1;RU.uK.value.set(k1,k2,0);RU.uTo.value.set(s.sx,s.sigY+95*SIGS,s.sigZ);
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=lerp(.35,1,1-o.real);
  const tm=teamAt(t);tm.forEach((m,k)=>allyTeam[k].position.set(m.x,m.y-5.5,m.z));
  grid.obj.visible=o.grid>.01;grid.mat.uniforms.uK.value=o.grid;grid.mat.uniforms.uWarp.value=.3;grid.mat.uniforms.uT.value=t;
  WORLD.setRifts([{x:-120,z:-1150,k:1.4*k0},{x:430,z:-1520,k:k1},{x:-700,z:-1380,k:k2},{x:270,z:-860,k:0}]);
  const glow=K([[0,1.1],[LAND[0],1.1],[LAND[0]+.3,1.5],[LAND[0]+2,1.05],[LAND[1],1.05],[LAND[1]+.3,1.45],[LAND[1]+2,1],[LAND[2],1],[LAND[2]+.3,1.4],[LAND[2]+2,.9],[SLAM,.9],[SLAM+.2,1.6],[SLAM+2,.9],[LANCE,.9],[LANCE+.2,2],[LANCE+4,.5],[DUR,.4]],t);
  WORLD.update(t,glow,{lamp:()=>0,beam:0,water:0,steam:.3,fall:fallAt(t)});
  if(WORLD.rain)WORLD.rain.uniforms.uAmt.value=K([[0,.8],[LANCE,.8],[LANCE+2,1.4],[ONE+4,.5],[225,.5],[229,.8]],t);
  if(TEAM.ready)TEAM.pose(t,lookOf(t,tm),tm);
  const w=tm[1];jets.forEach((J,i)=>{J.visible=w.hov>.05;J.position.set(w.x+(i?1.4:-1.4),w.y+.4,w.z+.6);J.scale.setScalar(3.6*w.hov*(.85+.15*Math.sin(t*40+i)));J.material.opacity=w.hov;});
  OU.uT.value=t;OU.uScale.value=px;OU.uK.value=ss(ONE,ONE+3,t);OU.uA.value=t>=ONE&&t<STATIC?1+ss(205.8,206.4,t):0;
  OU.uP.value.set(-50,40,-230).lerp(V(-7,12.6,-5),.12*ss(206,206.5,t));
  const sw=SIM.sw;if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(th);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.4;}
  FX.update(t,cam,px);FFX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  const vK=t=>{const s=SHOTS[FILM.shotIndex(t)];return s.v==null?1:s.v;};
  F.RAMP(P.wind,[[0,0],[1,.3],[LANCE,.32],[LANCE+1,.1],[ONE+6,.18],[DUR-3,.25],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[1,.2],[DUR-3,.2],[DUR,0]],A);
  F.RAMP(P.rain,[[0,0],[1,.25],[LANCE,.25],[LANCE+2,.06],[220,.06],[228,.2],[DUR-2,.2],[DUR,0]],A);
  F.RAMP(P.hum,[[0,0],[1,.1],[86,.12],[112,.18],[146,.22],[HOLD0,.25],[LANCE,.25],[LANCE+.1,0]],A);
  /* the Signal */
  S.moan(A(1),10);S.horn(A(2.5),-.2,5,0);S.roar(A(86.6),3.5);S.wash(A(88),7);S.moan(A(92),10);S.roar(A(101.6),4);S.horn(A(110),0,6,.3);S.moan(A(TIPS0),12);S.roar(A(146),3);
  S.hit(A(SLAM),1.4);S.blast(A(SLAM),0,1.4);S.boom(A(SLAM+.05),0,1);
  /* ANVIL's salvos and the marks */
  for(let q=0;q<3;q++)for(let i=0;i<3;i++){const t0=FIRE[q]+i*.35,t1=LAND[q]+i*.4;S.boom(A(t0),-.5,q===0?1:.5);if(i===0)S.whistle(A(t1-3.2),3.2,0,.5);S.blast(A(t1),[-.6,.6,-.1][q],.8);}
  [16.6,28.2,65.6].forEach(t=>S.lock(A(t)));
  /* the long hover */
  S.servo(A(51.4),0,.6);S.wash(A(51.8),3);S.riser(A(51.8),1.4);S.motor(A(52.4),29,0,.3);S.wash(A(81.4),2.5);S.step(A(82),0,.9);
  /* the team's guns, the arms dying */
  let lastHit=-9;for(const e of EV){const pn=clamp((e.x+7)/250,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x+7)/40,-.8,.8),.45*vK(e.t),6);
    else if(e.k==='hit'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,.35*vK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,1.4);}
  /* the thud, then the window */
  WIN.forEach(([w])=>{S.beat(A(w-.6),1.3);S.lock(A(w));});S.glitch(A(146.8),1.6,.5);S.glitch(A(160.5),1.2,.4);S.glitch(A(168),1.2,.45);
  /* the hold and the Lance */
  S.riser(A(185.4),10.2);S.lance(A(LANCE-1.2),0,1.6,1.2);S.hit(A(LANCE+.05),1.8);S.blast(A(LANCE+.1),0,1.5);S.roar(A(LANCE+.2),4.5);S.drain(A(LANCE+1.5),9);
  S.burst(A(STATIC),1,1);S.beep(A(221.6),880,.7);S.beep(A(BLACK+1.6),1500,.35);S.beep(A(BLACK+3),1500,.35);
  /* music: the rifts */
  S.chord(A(.3),9,['D2','A2','D3'],.5,'choir');S.chord(A(2),7,['D2','A2'],.4,'brass');
  const pr=[['D3','F3','A3'],['Bb2','D3','F3'],['C3','E3','G3'],['A2','C#3','E3']];
  const b0=60/92*4;S.pulse(A(9.6),37,'D2',92,.7,{snare:true});for(let i=0;i<14;i++){const t=9.6+i*b0;if(t>=46.5)break;S.chord(A(t),b0,pr[i%4],.5,i%2?'str':'brass');S.taiko(A(t),.7,i%2?.3:-.3);}
  S.stab(A(LAND[0]),.8);S.stab(A(LAND[1]),.8);S.chord(A(37.6),4,['F3','A3','C4'],.55,'str');
  /* the long hover: strings over a running pulse */
  const hv=[['D3','A3','F4'],['Bb2','F3','D4'],['F2','C3','A3'],['C3','G3','E4']];hv.forEach((c,i)=>{S.chord(A(47.2+i*4.2),4.4,c,.55,'str');S.chord(A(47.2+i*4.2),4.4,[c[0]],.4,'choir');});
  const b1=60/104*4;S.pulse(A(53),25,'D2',104,.7,{snare:true,shaker:true});for(let i=0;i<11;i++){const t=63.8+i*b1;if(t>=78)break;S.chord(A(t),b1,hv[i%4],.55,i%2?'brass':'str');}
  S.arp(A(53.2),10,['D4','F4','A4','D5'],.18,.3,0);S.stab(A(LAND[2]),.9);S.chord(A(LAND[2]+.2),5,['D3','F#3','A3','D4'],.6,'brass');
  /* it comes ashore */
  S.chord(A(86),14,['D2','A2','D3','F3'],.6,'choir');S.riser(A(97),3.4);
  const b2=60/120*4;S.pulse(A(95),33,'D2',120,.85,{snare:true,oct:true});const pr2=[['D3','F3','A3'],['C3','Eb3','G3'],['Bb2','D3','F3'],['A2','C#3','E3']];
  for(let i=0;i<17;i++){const t=95+i*b2;if(t>=128)break;S.chord(A(t),b2,pr2[i%4],.6,i%2?'brass':'str');S.taiko(A(t),.9,i%2?.3:-.3);}
  S.stab(A(SLAM),1);S.chord(A(SLAM),6,['D2','Ab2','D3'],.7,'brass');
  const b3=60/100*4;S.pulse(A(HUNCH),16,'D2',100,.85,{snare:true});for(let i=0;i<7;i++){const t=HUNCH+i*b3;if(t>=146)break;S.chord(A(t),b3,pr[i%4],.6,i%2?'str':'brass');S.taiko(A(t),.85,0);}
  /* too close: almost nothing but the heart */
  F.RAMP(P.str,[[0,0],[146,0],[150,.06],[178,.1],[178.2,0]],A);P.strF.setValueAtTime(400,A(146));P.strF.exponentialRampToValueAtTime(1600,A(178));
  S.chord(A(146.4),12,['D2','A2','D3'],.45,'pad');WIN.forEach(([w])=>S.chord(A(w+.1),2.6,['D3','A3','D4'],.75,'brass'));
  /* the hold */
  S.chord(A(178.6),6.8,['D3','F3','A3','E4'],.5,'pad');[[179,'A4'],[180.6,'F4'],[182.2,'E4'],[183.8,'D4']].forEach(([t,n])=>S.chord(A(t),2.6,[n],.6,'pno'));
  S.chord(A(185.4),10.2,['D2','A2','D3','F3'],.55,'choir');
  S.chord(A(LANCE+.3),9,['D3','F#3','A3','D4','F#4'],.85,'choir');S.chord(A(LANCE+.3),8,['D2','A2','D3'],.7,'brass');
  /* the ending: piano alone, then warm */
  [[216.4,'A4'],[217.8,'F4'],[219.6,'E4'],[221,'D4']].forEach(([t,n])=>S.chord(A(t),2.8,[n],.55,'pno'));
  S.chord(A(222.6),4,['F2','C3','F3'],.4,'pad');
  [[225.8,['F3','A3','C4']],[228.4,['Bb2','D3','F3','A3']],[231,['F2','C3','A3']]].forEach(([t,c])=>S.chord(A(t),3.2,c,.5,'str'));
  [[226.2,'C5'],[227.6,'A4'],[229,'F4']].forEach(([t,n])=>S.chord(A(t),2.6,[n],.6,'pno'));
  S.note(A(BLACK+1.4),6);S.chord(A(238.6),7,['D3','A3','F4'],.45,'choir');S.chord(A(239.2),5,['D5'],.5,'pno');}
/* ---------------------------------------------------------------- build */
function build(scene,F){WORLD.build(scene);FX.init(scene);FFX.init(scene);for(const o of WORLD.occluders)o.layers.enable(2);
  sig=SIG.make();sigG=new T.Group();sigG.scale.setScalar(SIGS);sigG.add(sig.pts);scene.add(sigG);sig.pts.layers.set(1);SIG.hostMat.uniforms.uWS.value=SIGS;
  const rifts=SIG.makeRifts([{x:430,z:-1520},{x:-700,z:-1380}],26000);rifts.layers.set(1);scene.add(rifts);
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  allyOthers=SIG.makeAllies([V(150,5.5,-1.5),V(-210,1.5,42),V(250,5.5,-20)]);allyOthers.layers.set(1);scene.add(allyOthers);
  grid=LOOK.grid(2600);grid.obj.position.copy(GRIDC);grid.obj.layers.set(1);scene.add(grid.obj);grid.mat.uniforms.uC.value.set((-120-GRIDC.x)/2600,(-1150-GRIDC.z)/2600);
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
  jets=[0,1].map(()=>{const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(.6,.75,1),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.visible=false;scene.add(s);return s;});
  scene.add(oneDots());
  /* ANVIL's three salvos (lights only on the first; one light per splash), the slam */
  WORLD.guns.updateMatrixWorld(true);const MUZ=WORLD.barrels.map(b=>b.localToWorld(V(0,9,0)));
  for(let q=0;q<3;q++)MUZ.forEach((m,i)=>{const t0=FIRE[q]+i*.35,t1=LAND[q]+i*.4;const hit=RIFT[q].clone().add(V((i-1)*14,0,(i%2)*10-5));FX.gun(m,t0,q>0);FX.shell(m,hit,t0+.05,t1);FX.blast(hit,t1,1.25,i>0);});
  FX.ringAt(V(-60,0,-170),SLAM);FX.blast(V(-60,0,-170),SLAM,3.2);
  simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const in_=(...r)=>t=>{for(let i=0;i<r.length;i+=2)if(t>=r[i]&&t<r[i+1])return true;return false;};
const sigTop=()=>{const s=sigS(NOW);return V(s.sx,s.sigY+260,s.sigZ);};
const tipTag=i=>()=>SIM.tips&&!SIM.tips[i].dead?SIM.sw.center(SIM.tips[i]).add(V(0,10,0)):V(0,-999,0);
const TAGS=[
 ['THE SIGNAL · 900,000','red mark',sigTop,in_(2,8.6)],
 ['RIFT 3 · MARKED','red mark',()=>V(-700,50,-1380),in_(16.6,21.2,34.2,LAND[0]+.2)],['RIFT 2 · MARKED','red mark',()=>V(430,50,-1520),in_(28.2,34.2,41.4,LAND[1]+.2)],
 ['RIFT 3 · SEALED','green mark',()=>V(-700,50,-1380),in_(LAND[0]+1.4,41.4)],['RIFT 2 · SEALED','green mark',()=>V(430,50,-1520),in_(LAND[1]+1.4,47)],
 ['WRAITH','',()=>{const w=wraith(NOW);return V(w.x,w.y+13,w.z);},in_(53.4,60)],
 ['RIFT 1 · MARKED','red mark',()=>V(-120,50,-1150),in_(65.6,72,78.2,LAND[2]+.2)],['RIFT 1 · SEALED','green mark',()=>V(-120,50,-1150),in_(LAND[2]+1.4,86)],
 ['HARROW','',()=>V(150,15,-1.5),in_(15.2,21.2,109,116)],['MILLER','',()=>V(-210,11,42),in_(109,116)],['WREN','',()=>V(250,52,-20),in_(27,34.2,109,116)],
 ['ARM · 5,000','red',tipTag(0),in_(109,116)],['ARM · 5,000','red',tipTag(1),in_(109,116)],
 ['CORE','red mark',()=>CORE.clone().add(V(0,14,0)),in_(134,146.4)],['LOCK','green mark',()=>CORE.clone(),(t,o)=>o&&o.lock]];
FILM.run({id:'m8',DUR,place:'Arlen Bay',pageTitle:'IRMD · Mission 8 · The Signal',clock:[23,58,0],poster:132,
  start:{org:'International Rift Mech Defense · Mission 8',t:'The Signal',sub:'Arlen Bay · 23:58 · 4 min<br>Sound on, headphones if you have them'},
  end:{org:'Chapter 1',t:'The Signal',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M8SIM=SIM;
})();
