'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: MISSION 4, LANDFALL (game/cinematic/film/scene-m4.js, session D)
   2 min 55 in Port Arlen at dusk. The first time something this size comes ashore.
     0:00  Port Arlen from the sea. Pike's squad holds the high street; the team walks down it. Stalkers in the alleys.
     0:30  the rift out in the shallows, and the stream of dots running from it to BEHEMOTH, waiting offshore: 10,000 and
           climbing. KESTREL and WRAITH wade out to mark it. "Shot, over! Twenty seconds!" SKEINs out of the rift.
     1:14  the shells land; the rift closes; it stops growing. 1:27 it comes ashore through the cannery, which goes grey.
     1:46  thermal: the core moving inside it. Five thousand. The Lance. "It's down. I need a minute." "Take it."
   ===================================================================================================================== */
(function(){
const T=THREE,{V,clamp,lerp,ss,ease,vl,K}=FILM;
const DUR=175,DT=1/60,R=PORT.RIFT,CN=PORT.CANNERY;
const FIRE=[0,.5,1],SHOT=54.6,LAND=74.6,THERM=106.2,LANCE=137.2,SEAL=LAND+1.2;
/* ---------------------------------------------------------------- the team: keyed paths (t, x, z, facing when stopped) */
const KEYS=[
 [[0,-26,215,0],[16,-26,120,0],[30,-26,96,.4],[42,-10,26,0],[50,40,-20,-.3],[56,52,-46,-.2],[72,52,-46,-.2],[80,40,10,-.6],[96,24,60,-.7],[DUR,24,60,-.7]],
 [[0,-14,225,0],[16,-14,128,0],[30,-14,104,-.4],[42,0,24,0],[50,48,-24,-.3],[56,62,-50,-.2],[72,62,-50,-.2],[80,52,14,-.6],[96,6,66,-.75],[DUR,6,66,-.75]],
 [[0,-26,240,0],[16,-26,142,0],[30,-26,110,.5],[42,-30,22,0],[80,-30,22,-.2],[96,-12,72,-.8],[DUR,-12,72,-.8]],
 [[0,-14,250,0],[16,-14,150,0],[30,-14,116,-.5],[42,-46,22,0],[80,-46,22,-.2],[96,-30,78,-.8],[DUR,-30,78,-.8]]];
function keyAt(k,t){const ks=KEYS[k];for(let i=0;i<ks.length-1;i++){const [a,ax,az,af]=ks[i],[b,bx,bz,bf]=ks[i+1];if(t<b||i===ks.length-2){const u=ss(a,b,t);return {x:lerp(ax,bx,u),z:lerp(az,bz,u),face:bf,moving:(bx!==ax||bz!==az)&&t>a&&t<b};}}}
const MT=[];(function(){for(let k=0;k<4;k++){const tb=[];let d=0,yaw=0,px=null,pz=null;for(let i=0;i<=DUR*20;i++){const t=i/20,p=keyAt(k,t);
    if(px!=null){const dx=p.x-px,dz=p.z-pz,s=Math.hypot(dx,dz);d+=s;const want=s*20>.6?Math.atan2(-dx,-dz):p.face;let a=want-yaw;a=Math.atan2(Math.sin(a),Math.cos(a));yaw+=a*.12;tb.push({x:p.x,z:p.z,d,yaw,spd:s*20});}
    else tb.push({x:p.x,z:p.z,d:0,yaw:p.face,spd:0});px=p.x;pz=p.z;}MT.push(tb);}})();
function mech(k,t){const i=clamp(t*20,0,DUR*20-1),j=Math.floor(i),f=i-j,a=MT[k][j],b=MT[k][j+1]||a;const x=lerp(a.x,b.x,f),z=lerp(a.z,b.z,f);
  let dy=b.yaw-a.yaw;return {x,z,y:PORT.h(x,z),yaw:a.yaw+dy*f,dist:lerp(a.d,b.d,f),spd:lerp(a.spd,b.spd,f)};}
const muzzle=(m,side,out)=>{const f=V(-Math.sin(m.yaw),0,-Math.cos(m.yaw)),r=V(Math.cos(m.yaw),0,-Math.sin(m.yaw));return (out||V()).set(m.x,m.y+6.1,m.z).addScaledVector(r,side*1.75).addScaledVector(f,2.2);};
/* ---------------------------------------------------------------- BEHEMOTH's path: offshore, through the shallows, through the cannery */
const BP=[[0,85,-190],[78,85,-190],[92,118,-30],[100,118,26]];
function bpos(t){for(let i=0;i<BP.length-1;i++){const [a,ax,az]=BP[i],[b,bx,bz]=BP[i+1];if(t<b){const u=(t-a)/(b-a);return V(lerp(ax,bx,u)+Math.sin(t*.3)*(t<78?6:0),0,lerp(az,bz,u));}}return V(118,0,26);}
/* the count it should have: fed by the rift, then bleeding, then the core */
const DC=t=>K([[0,6200],[SEAL,13400],[100,12900],[THERM,12600],[119,5000],[LANCE-.1,1300],[LANCE+.2,0]],t);
/* ---------------------------------------------------------------- the sim */
const SIM={t:0,sw:null,ev:[]};let srs=1;const srnd=()=>{srs=(srs*16807)%2147483647;return (srs-1)/2147483646;};
const SP=[];[[14,'stalker',-80,80],[16,'stalker',40,140],[19,'stalker',-90,140],[15,'runner',-70,84],[15.6,'runner',-74,78],[17.5,'runner',36,136],[18,'runner',44,144]].forEach(([t,id,x,z])=>SP.push({t,id,x,z}));
for(let j=0;j<20;j++)SP.push({t:56+j*.8,id:'skein',x:R.x+((j*7)%11-5)*1.5,z:R.z+((j*3)%5)});SP.push({t:60,id:'stalker',x:R.x-10,z:R.z},{t:64,id:'stalker',x:R.x+10,z:R.z});
SP.sort((a,b)=>a.t-b.t);
function simReset(){if(SIM.sw)FILM.scene.remove(SIM.sw.points);srs=4040;const sv=Math.random;Math.random=srnd;
  const sw=new RMD.Creatures.Swarm(FILM.scene,{max:22000,maxDebris:6000});sw.points.layers.set(1);sw.ground=(x,z)=>PORT.h(x,z);
  const B=sw.spawn('behemoth',bpos(0).setY(PORT.h(85,-190)),0);B.prefers='ally';let k=0;for(const q of B.P){if(k>=3800)break;if(q.alive){q.alive=false;k++;}}B.count-=k;B.hp=B.count/B.n0;
  Math.random=sv;SIM.sw=sw;SIM.B=B;SIM.t=0;SIM.si=0;SIM.cool=[2.2,1.4,.6,1.8];SIM.burst=[0,0,0,0];SIM.tgt=[null,null,null,null];SIM.ev=[];SIM.grey=0;FFX.reset();}
const TG=[];
function simStep(){const t=SIM.t,sw=SIM.sw,B=SIM.B;const sv=Math.random;Math.random=srnd;
  while(SIM.si<SP.length&&SP[SIM.si].t<=t){const w=SP[SIM.si++];sw.spawn(w.id,V(w.x,PORT.h(w.x,w.z),w.z),0);}
  TG.length=0;for(let k=0;k<4;k++){const m=mech(k,t);TG.push({pos:V(m.x,m.y,m.z),kind:'mech',notice:t<100?160:400});}
  TG.push({pos:V(-20,0,70),kind:'ally',notice:120});
  sw.update(DT,t,TG);
  if(B&&!B.dead){if(t<100){const p=bpos(t),q=bpos(t+.5);B.pos.set(p.x,PORT.h(p.x,p.z),p.z);B.heading=Math.atan2(q.x-p.x,q.z-p.z)||B.heading;B.target=null;}
    else B.prefers='mech';
    /* its size follows the story: the rift feeds it, then it bleeds, then the core */
    const want=DC(t);if(t<THERM){const d=Math.round((want-B.count)*.2);if(d>0)sw.grow(B,Math.min(d,12));else if(d<-2)sw.shed(B,Math.min(-d,6));}
    if(t>91&&t<99.5&&Math.floor(t*20)!==Math.floor((t-DT)*20)){sw.absorb(B,V(CN.x+(srnd()-.5)*50,8,CN.z+(srnd()-.5)*30),3);SIM.grey=Math.min(1,SIM.grey+.0065);}}
  if(t>20&&t<150){for(let k=0;k<4;k++){const m=mech(k,t);
    if(SIM.burst[k]>0){SIM.burst[k]-=DT;const n0=Math.ceil((SIM.burst[k]+DT)/.085),n1=Math.ceil(SIM.burst[k]/.085);
      if(n1<n0){const c=SIM.tgt[k];const mz=muzzle(m,(n1%2)?1:-1);let at;
        if(c&&!c.dead){const core=c===B&&t>THERM+1;at=core?c.corePos.clone().add(V((srnd()-.5)*2,(srnd()-.5)*2,(srnd()-.5)*2)):sw.center(c).add(V((srnd()-.5)*(c===B?14:3),(srnd()-.5)*(c===B?8:2),(srnd()-.5)*(c===B?14:3)));
          if(srnd()<.62){const before=c.count;let n=1+(srnd()<.35?1:0);if(core){n=clamp(Math.round((c.count-DC(t))*.012),1,40);}
            const got=sw.hit(c,at,core?3:1.6,n);if(got>0)SIM.ev.push({t,k:core?'core':'hit',x:at.x,z:at.z,n:got});if(c.dead&&before>0)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}}
        else at=mz.clone().add(V(-Math.sin(m.yaw)*60,-5,-Math.cos(m.yaw)*60));
        const gy=PORT.h(at.x,at.z),wy=Math.max(gy,0);FFX.shot(t,mz,at,1);FFX.flash(t,mz,1);FFX.puff(t,V(at.x,wy,at.z),gy<0?1.4:1,at.y-wy<1.5?12:5);}}
    else{SIM.cool[k]-=DT;if(SIM.cool[k]<=0){let best=null,bd=1e9;for(const c of sw.list){if(c.dead||c.gone)continue;if(c===B&&t<100)continue;const d=Math.hypot(c.pos.x-m.x,c.pos.z-m.z)*(c===B?.5:1);if(d<bd&&d<230){bd=d;best=c;}}
        if(best&&!(k===1&&t>LANCE-1.4&&t<LANCE+.3)){SIM.tgt[k]=best;SIM.burst[k]=6*.085;SIM.ev.push({t,k:'burst',m:k,x:m.x,z:m.z});SIM.cool[k]=(best===B?1.1:1.5)+srnd()*1.1;}else SIM.cool[k]=.3;}}}}
  for(let i=0;i<3;i++){const tl=LAND+FIRE[i]*1.1;if(t>=tl&&t<tl+DT*1.2){sw.blast(V(R.x,0,R.z),26,500);}}
  if(B&&!B.dead&&t>=LANCE&&t<LANCE+DT*1.2){const m=mech(1,t);const mz=muzzle(m,1);const at=B.corePos.clone();FFX.shot(t,mz,at,3.4);FFX.flash(t,mz,3);
    const got=sw.hit(B,at,4,Math.ceil(B.count/10)+10);SIM.ev.push({t,k:'lance',x:at.x,z:at.z,n:got});if(B.dead)SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:'behemoth'});}
  if(t>146&&t<146+DT*1.2)for(const c of sw.list)if(!c.dead){const at=sw.center(c);sw.hit(c,at,30,c.count);SIM.ev.push({t,k:'die',x:at.x,z:at.z,id:c.rig.id});}
  Math.random=sv;SIM.t+=DT;}
function simTo(t){if(t<SIM.t-DT*.5)simReset();let n=0;while(SIM.t+DT<=t+1e-9){simStep();if(++n>40000)break;}}
/* ---------------------------------------------------------------- lines */
const LINES=[
 {id:'M4_01_OW',t:2.0,w:4.8,who:'OVERWATCH',p:.15,tx:'Something big has been sitting off Port Arlen since dark. It’s coming in.'},
 {id:'M4_02_PIKE',t:10.0,w:4.4,who:'PIKE',p:.25,tx:'Pike on the high street. We held it this morning. We’ll hold it again.'},
 {id:'M4_03_OW',t:18.2,w:3.7,who:'OVERWATCH',p:.3,tx:'It’s sending things ahead of it. Stalkers in the alleys.'},
 {id:'M4_04_OW',t:31.4,w:4.4,who:'OVERWATCH',p:.25,tx:'There’s a rift in the harbour, out in the shallows. That’s what’s feeding it.'},
 {id:'M4_05_OW',t:38.6,w:3.4,who:'OVERWATCH',p:.45,tx:'Ten thousand and climbing. Close that rift, Wraith.'},
 {id:'M4_06_ANVIL',t:46.6,w:2.9,who:'ANVIL',p:.2,tx:'Give me a mark on the harbour and I’ll fill it in.'},
 {id:'PING_03_PILOT',t:51.0,w:.6,who:'WRAITH',p:.2,tx:'On it.'},
 {id:'GEN_08_ANVIL',t:54.2,w:3.0,who:'ANVIL',p:.45,tx:'Shot, over! Twenty seconds! Don’t stand there!'},
 {id:'M4_07_ANVIL',t:76.6,w:1.6,who:'ANVIL',p:.15,tx:'Rift’s closed.'},
 {id:'M4_08_OW',t:80.2,w:4.8,who:'OVERWATCH',p:.3,tx:'It’s stopped growing. It’s losing dots. It can be killed.'},
 {id:'M4_09_OW',t:87.4,w:2.6,who:'OVERWATCH',p:.35,tx:'It’s been eating the wrecks all night.'},
 {id:'M4_10_PIKE',t:93.0,w:4.4,who:'PIKE',p:.6,tx:'It’s at the cannery. It’s… the cannery’s going grey.'},
 {id:'M4_11_OW',t:102.6,w:4.1,who:'OVERWATCH',p:.45,tx:'Thermal. The core’s moving around inside it. Follow it.'},
 {id:'M4_12_OW',t:119.0,w:4.6,who:'OVERWATCH',p:.5,tx:'Five thousand. We’re winning. I think we’re winning.'},
 {id:'M4_13_OW',t:141.0,w:6.8,who:'OVERWATCH',p:.25,tx:'It’s down. Ten thousand dots, and it’s down. I need a minute.'},
 {id:'M4_14_PILOT',t:150.0,w:1.0,who:'WRAITH',p:0,tx:'Take it.'},
 {id:'M4_15_OW',t:156.4,w:3.6,who:'OVERWATCH',p:.05,tx:'They’re fitting you a Watcher pod. Better eyes for both of us.'}];
/* ---------------------------------------------------------------- shots */
const boss=()=>SIM.B&&!SIM.B.gone?SIM.sw.center(SIM.B):V(118,10,26);
const SHOTS=[
 {t0:0,t1:9,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(70,30,-330),V(30,20,-220),ease(u)),l:vl(V(-10,8,40),V(-10,6,60),u),fov:42,real:1})},
 {t0:9,t1:17,name:'PIKE · HIGH STREET',f:u=>({p:vl(V(-17,PORT.h(-17,62)+3.4,62),V(-17.5,PORT.h(-17,62)+3.6,61),u),l:V(-20,9,170),fov:46,real:1})},
 {t0:17,t1:30,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+1.5,m.y+14,m.z+16),l:vl(V(-50,2,82),V(0,2,112),ease(ss(.3,.8,u))),fov:52};}},
 {t0:30,t1:38,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(40,280,10),V(46,265,0),u),l:V(46,0,-90),fov:58})},
 {t0:38,t1:46,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+10.5,m.z+7),l:boss(),fov:lerp(20,16,u)};}},
 {t0:46,t1:54,name:'KESTREL · OPTICAL',f:(u,t)=>{const m=mech(0,t);return {p:V(m.x-5,m.y+9.6,m.z+14),l:V(R.x,0,R.z),fov:40,real:1,shake:.03};}},
 {t0:54,t1:64,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3.4,m.y+10,m.z+8),l:vl(V(R.x,2,R.z),V(R.x-6,2,R.z+12),u),fov:lerp(34,40,u)};}},
 {t0:64,t1:74,name:'VESPER · OPTICAL',f:(u,t)=>{const m=mech(2,t);return {p:V(m.x+5,m.y+9.4,m.z+6),l:V(R.x-6,0,R.z+14),fov:36,real:1};}},
 {t0:74,t1:80,name:'WRAITH · OPTICAL',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+9.6,m.z+7),l:V(R.x,8,R.z),fov:lerp(34,40,u),real:1,shake:t>LAND&&t<LAND+3?.45*(1-ss(LAND,LAND+3,t)):0};}},
 {t0:80,t1:87,name:'OVERWATCH · TACTICAL',f:u=>({p:vl(V(80,260,-20),V(90,240,-30),u),l:V(90,0,-100),fov:58})},
 {t0:87,t1:100,name:'PIKE · QUAY',cuts:[[87,{p:V(28,6.2,17),l:V(CN.x,9,CN.z-6),fov:40,real:1}],[95.4,{p:V(28,6.2,17),l:V(CN.x-8,12,CN.z+8),fov:44}]]},
 {t0:100,t1:106,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+10.5,m.z+7),l:boss(),fov:lerp(40,46,u)};}},
 {t0:106,t1:118,name:'WRAITH · THERMAL',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+10,m.z+7),l:boss(),fov:lerp(42,36,u),mode:1,real:.8};}},
 {t0:118,t1:130,name:'KESTREL · SENSOR',f:(u,t)=>{const m=mech(0,t);return {p:V(m.x-5,m.y+4,m.z+11),l:boss().add(V(0,6,0)),fov:48,shake:.04};}},
 {t0:130,t1:141,name:'WRAITH · THERMAL',f:(u,t)=>{const m=mech(1,t);const b=SIM.B&&!SIM.B.dead?SIM.B.corePos:boss();return {p:V(m.x+2.8,m.y+9.6,m.z+6.6),l:b,fov:lerp(30,22,ease(u)),mode:1,real:.8,shake:t>LANCE&&t<LANCE+1.6?.6*(1-ss(LANCE,LANCE+1.6,t)):0};}},
 {t0:141,t1:150,name:'WRAITH · SENSOR',f:(u,t)=>{const m=mech(1,t);return {p:V(m.x+3,m.y+11,m.z+9),l:V(90,6,40),fov:44};}},
 {t0:150,t1:DUR,name:'OVERWATCH · DRONE',f:u=>({p:vl(V(0,18,96),V(-60,120,220),ease(u)),l:vl(V(40,4,30),V(60,0,-40),ease(u)),fov:46,real:1})}];
/* ---------------------------------------------------------------- tracks */
const per=(t,vals)=>vals[FILM.shotIndex(t)];
function tracks(t){simTo(t);const o={};
  o.real=per(t,[1,1,.42,.28,.4,1,.42,1,1,.28,1,.42,.8,.42,.8,.42,1]);if(t>=95.4&&t<100)o.real=.42;
  o.mono=per(t,[0,0,.55,1,.55,0,.55,0,0,1,0,.55,0,.55,0,.55,0]);if(t>=95.4&&t<100)o.mono=.55;
  o.dots=o.real>=1?0:1;o.mode=0;
  o.interf=K([[0,.06],[30,.12],[38,.2],[46,.22],[54,.25],[LAND,.3],[LAND+.3,.6],[LAND+1.2,.2],[87,.25],[95.4,.6],[96,.35],[100,.4],[THERM,.75],[THERM+.5,.3],[119,.25],[LANCE,.3],[LANCE+.2,.85],[LANCE+1,.2],[150,.08],[DUR,.04]],t);
  if(t>38&&t<46)o.interf+=.08*Math.max(0,Math.sin(t*5.3));
  o.stut=(t>THERM&&t<THERM+.5)?.8:(t>LANCE&&t<LANCE+.8)?.6:(t>LAND&&t<LAND+1)?.4:(t>95.3&&t<96.2)?.6:(t>100&&t<106)?.25:0;o.wexp=1.08;o.exp=.72;
  o.flash=t>LANCE&&t<LANCE+.5?.3*(1-ss(LANCE,LANCE+.5,t)):0;o.fade=ss(DUR-1.8,DUR,t)+(1-ss(0,1.6,t));
  o.count=SIM.sw?SIM.sw.dots:0;o.range=t<9?null:t<100?'0.3 KM':'0.1 KM';
  o.title=t<8?{k:ss(.8,1.8,t)*(1-ss(6,7.6,t)),org:'Mission 4 · 19:40',t:'LANDFALL',sub:'Port Arlen · International Rift Mech Defense'}:
    t>164?{k:ss(164.5,166,t)*(1-ss(172.6,174.4,t)),org:'Board clear · rift sealed',t:'LANDFALL',sub:'BEHEMOTH: 13,400 → 0 · Pike’s squad: all six'}:null;
  o.nohud=t<7.8||t>164;
  o.rift=1-ss(LAND,SEAL,t);o.grey=SIM.grey;o.fire=ss(95,104,t);o.dusk=ss(0,DUR,t)*.85;
  return o;}
/* the stream from the rift to BEHEMOTH: dots running out along the water while the rift is open */
const STU={uA:{value:V()},uB:{value:V()},uT:{value:0},uK:{value:1},uScale:{value:1}};
function stream(){const n=900,p=new Float32Array(n*3),s=new Float32Array(n*2);for(let i=0;i<n;i++)s.set([Math.random(),Math.random()],i*2);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aS',new T.BufferAttribute(s,2));
  const m=new T.ShaderMaterial({uniforms:STU,transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute vec2 aS;uniform vec3 uA,uB;uniform float uT,uK,uScale;varying float vA;
    void main(){float u=fract(aS.x+uT*.12);vec3 p=mix(uA,uB,u);p.y+=sin(u*3.1416)*14.+sin(aS.y*40.+uT*2.)*1.5;p.x+=sin(aS.y*31.+u*9.)*3.;p.z+=cos(aS.y*23.+u*7.)*3.;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float px=.5*uScale/max(.001,-mv.z);float cl=clamp(px,1.5,6.);gl_PointSize=cl;vA=uK*.6*min(1.,px*px/(cl*cl)+.4)*smoothstep(0.,.05,u)*smoothstep(1.,.9,u);}`,
    fragmentShader:`varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(1.,0.,0.)*vA*exp(-r*r*3.),1.);}`});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.layers.set(1);return pts;}
let allyTeam=[],allyPike=null,FOLK=[],TORCH=[];
function apply(t,o,cam,px){const sw=SIM.sw;const mv=[0,1,2,3].map(k=>mech(k,t));
  const look=mv.map((m,k)=>{let yaw=0;const c=SIM.tgt[k];if(c&&!c.dead&&t>20&&t<150){const a=Math.atan2(-(c.pos.x-m.x),-(c.pos.z-m.z))-m.yaw;yaw=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.9,.9);}
    return {pitch:t>100&&t<141?.12:-.02,yaw:yaw*.5,torso:yaw*.8,aim:t>20&&t<150?-.32:-.12};});
  if(TEAM.ready)TEAM.pose(t,look,mv);mv.forEach((m,k)=>allyTeam[k].position.set(m.x,m.y-5.5,m.z));
  const ch=[];if(sw)for(const c of sw.list)if(!c.dead&&!c.gone&&ch.length<16)ch.push({x:c.pos.x,z:c.pos.z,r:c.rig.id==='behemoth'?22:2.5+c.rig.size*.4,k:c.rig.id==='behemoth'?1:.7});
  PORT.update(t,{dusk:o.dusk,rift:o.rift,grey:o.grey,fire:o.fire,churn:ch});
  FOLK.forEach((G,i)=>{G.rotation.y=Math.PI+Math.sin(t*1.3+i)*.4;});
  if(sw){sw.pxScale(px);sw.mat.uniforms.uT.value=t;sw.mat.uniforms.uGain.value=LOOK.HALF?1:2.5;sw.setThermal(o.mode>.5);if(!sw.thermal)sw.mat.uniforms.uSizeMul.value=1.6;else sw.mat.uniforms.uGain.value*=1.0;}
  STU.uA.value.set(R.x,1,R.z);STU.uB.value.copy(boss());STU.uT.value=t;STU.uK.value=o.rift*(t>28?1:ss(20,28,t));STU.uScale.value=px;
  const AU=SIG.allyMat.uniforms;AU.uT.value=t;AU.uScale.value=px;AU.uGain.value=1.1;FFX.update(t,cam,px);FX.update(t,cam,px);}
/* ---------------------------------------------------------------- sound */
function cue(S,A,F){const P=S.params;
  simReset();simTo(DUR-.1);const EV=SIM.ev.slice();simReset();
  F.RAMP(P.wind,[[0,0],[2,.16],[DUR-3,.2],[DUR,0]],A);F.RAMP(P.sea,[[0,0],[2,.18],[46,.2],[54,.26],[150,.18],[DUR,0]],A);F.RAMP(P.buzz,[[0,0],[9,.014],[95,.014],[96,0]],A);
  F.RAMP(P.hum,[[0,0],[28,0],[34,.1],[LAND,.18],[SEAL,0],[82,0],[88,.12],[100,.18],[THERM,.1],[LANCE,.16],[LANCE+.1,0]],A);
  for(let k=0;k<4;k++){for(let tt=.6+k*.4;tt<16;tt+=.62)S.step(A(tt),[-.6,-.2,.2,.6][k],tt>8?.8:.45);for(let tt=30.6+k*.3;tt<41.6;tt+=.6)S.step(A(tt),[-.6,-.2,.2,.6][k],.5);for(let tt=80.6+k*.3;tt<95.6;tt+=.6)S.step(A(tt),[-.6,-.2,.2,.6][k],.45);}
  for(let tt=42.4;tt<56;tt+=.66){S.thud(A(tt),-.1,.5);S.thud(A(tt+.33),.1,.5);}
  /* BEHEMOTH: a groan offshore, its tread when it comes ashore, the cannery coming down */
  S.moan(A(36),9);S.moan(A(84),12);for(let tt=86;tt<118;tt+=1.4)S.beat(A(tt),.5+ss(86,100,tt)*.6);
  S.roar(A(95.6),4.5);S.wash(A(92),8);for(let tt=92;tt<100;tt+=.7)S.thud(A(tt),.5,.9);S.hit(A(95.5),.7);
  /* ANVIL from the west: the guns far off, the flight, the landing in the water */
  FIRE.forEach((f,i)=>{S.boom(A(SHOT+f),-.9,.55);S.whistle(A(LAND-2.6+f*1.1),2.6,.15,.9);S.blast(A(LAND+f*1.1),.3,1.1);});S.riser(A(LAND-3.4),3.3);S.hit(A(LAND),.9);S.wash(A(LAND+.5),5);
  const camK=t=>[.4,.6,1,.6,1,.8,1,.9,1,.6,.6,1,1,1,1,.9,.5][FILM.shotIndex(t)];
  let lastHit=-9;for(const e of EV){const pn=clamp((e.x-20)/120,-.8,.8);
    if(e.k==='burst')S.ac(A(e.t),clamp((e.x-mech(1,e.t).x)/30,-.8,.8),.55*camK(e.t),6);
    else if(e.k==='hit'||e.k==='core'){if(e.t-lastHit<.14)continue;lastHit=e.t;S.fizz(A(e.t),pn,(e.k==='core'?.7:.4)*camK(e.t));}
    else if(e.k==='die')S.burstC(A(e.t),pn,e.id==='behemoth'?1.6:.7*camK(e.t));}
  S.switchV(A(THERM-.05),1);S.lance(A(LANCE-1.2),.2,1.3,1.2);S.hit(A(LANCE+.05),1.2);S.note(A(LANCE+.3),6);
  /* music: dusk, the town; a long build while it feeds; the turn; the fight; the quiet after */
  S.chord(A(.4),9,['A2','E3','C4'],.5,'pad');[[1.5,'E4'],[3.5,'C4'],[5.5,'B3'],[7.5,'A3']].forEach(([tt,n])=>S.chord(A(tt),2.6,[n],.55,'pno'));
  S.chord(A(9),8,['F2','C3','A3'],.45,'str');
  const b1=60/108*4;S.pulse(A(17),13,'A1',108,.7);[['A2','C3','E3'],['F2','A2','C3'],['G2','B2','D3']].forEach((c,i)=>S.chord(A(17+i*b1*1.5),b1*1.5,c,.5,'brass'));
  F.RAMP(P.str,[[0,0],[30,0],[34,.05],[54,.1],[LAND,.14],[LAND+.1,0],[80,0],[86,.06],[100,.12],[100.2,0]],A);P.strF.setValueAtTime(500,A(30));P.strF.exponentialRampToValueAtTime(1900,A(LAND));P.strF.setValueAtTime(500,A(80));P.strF.exponentialRampToValueAtTime(1600,A(100));
  S.chord(A(30),16,['A1','E2','A2'],.5,'choir');S.pulse(A(54),20,'A1',116,.65,{snare:true});
  S.chord(A(LAND+1),6,['C3','G3','E4'],.5,'str');S.chord(A(82),18,['D2','A2','D3'],.55,'choir');
  const b2=60/100*4;S.pulse(A(100),37,'A1',100,.85,{snare:true,oct:true});const pr=[['A2','C3','E3','A3'],['F2','A2','C3','F3'],['C3','E3','G3','C4'],['G2','B2','D3','G3']];
  for(let i=0;i<15;i++){const tt=100+i*b2;if(tt>=LANCE-2)break;S.chord(A(tt),b2,pr[i%4],.6+i*.02,i%2?'str':'brass');S.taiko(A(tt),.85,i%2?.3:-.3);}
  S.riser(A(LANCE-4),3.9);S.chord(A(LANCE+.4),8,['A2','E3','A3','C4','E4'],.8,'choir');S.chord(A(LANCE+.4),8,['A1','E2','A2'],.7,'brass');
  const after=[['F2','C3','A3'],['C3','G3','E4'],['G2','D3','B3'],['A2','E3','C4'],['F2','C3','A3','C4'],['C3','G3','C4','E4']];after.forEach((c,i)=>S.chord(A(146+i*4.2),4.6,c,.5+i*.05,'str'));
  [[148,'C5'],[150,'B4'],[152,'A4'],[154,'G4'],[157,'E4'],[159,'G4'],[161,'C5'],[164.5,'E5']].forEach(([tt,n])=>S.chord(A(tt),2.4,[n],.8,'pno'));
  S.chord(A(164.5),9,['C2','G2','C3','E3','G3'],.7,'choir');S.sting(A(164.5),.6);}
/* ---------------------------------------------------------------- build */
function build(scene,F){PORT.build(scene);FX.init(scene);FFX.init(scene);for(const o of PORT.occ)o.layers.enable(2);
  for(let i=0;i<3;i++){const from=V(-900+i*20,140,180+i*10),to=V(R.x+(i-1)*5,1,R.z+i*3);FX.shell(from,to,SHOT+FIRE[i]+.05,LAND+FIRE[i]*1.1);FX.blast(to,LAND+FIRE[i]*1.1,1.5);}
  allyTeam=[0,1,2,3].map(()=>{const a=SIG.makeAllies([V(0,5.5,0)]);a.layers.set(1);scene.add(a);return a;});
  const PK=[[-24,72],[-21,73],[-18,72.5],[-15,73],[-26,74],[-13,74.5]];allyPike=SIG.makeAllies(PK.map(([x,z])=>V(x,PORT.h(x,z)+2,z)));allyPike.layers.set(1);scene.add(allyPike);
  const body=new T.MeshStandardMaterial({color:0x2e3238,roughness:.9});FOLK=PK.map(([x,z])=>{const g=new T.Group();const b=new T.Mesh(new T.CapsuleGeometry(.28,.95,4,8),body);b.position.y=.78;g.add(b);
    const h=new T.Mesh(new T.SphereGeometry(.17,8,6),body);h.position.y=1.6;g.add(h);g.position.set(x,PORT.h(x,z),z);scene.add(g);g.traverse(o=>{if(o.isMesh)o.layers.enable(2);});return g;});
  for(const [x,z] of [PK[1],PK[3]]){const L=new T.SpotLight(0xdde6ff,16,80,.3,.6,1.4);L.position.set(x,PORT.h(x,z)+1.5,z);L.target.position.set(x,PORT.h(x,z+60),z+60);scene.add(L);scene.add(L.target);}
  scene.add(stream());simReset();
  return TEAM.build(scene,[]).then(tm=>{for(const M of tm.list)M.root.traverse(o=>{if(o.isMesh)o.layers.enable(2);});});}
const TAGS=[
 ['PIKE · 6','green',()=>V(-20,PORT.h(-20,72)+8,72),t=>(t>=17&&t<24)],['STALKERS','red',()=>V(-80,8,84),t=>t>=19&&t<26],
 ['RIFT · FEEDING','red mark',()=>V(R.x,12,R.z),t=>t>=30&&t<38],['BEHEMOTH','red mark',()=>boss().add(V(0,30,0)),t=>(t>=31&&t<46)||(t>=80&&t<87)],
 ['MARK','red mark',()=>V(R.x,10,R.z),t=>t>=51.6&&t<56],['ANVIL · 20 S','amber',()=>V(R.x,22,R.z),t=>t>=56&&t<64],['SEALED','green mark',()=>V(R.x,12,R.z),t=>t>=SEAL+.5&&t<87],
 ['CANNERY','',()=>V(CN.x,26,CN.z),t=>t>=87&&t<95],['CORE','red mark',()=>SIM.B&&!SIM.B.dead?SIM.B.corePos.clone().add(V(0,4,0)):V(0,-99,0),t=>t>=108&&t<LANCE]];
FILM.run({id:'m4',DUR,place:'Port Arlen',pageTitle:'IRMD · Mission 4 · Landfall',clock:[19,40,0],poster:42,
  start:{org:'International Rift Mech Defense · Mission 4',t:'Landfall',sub:'Port Arlen · 19:40 · 2 min 55<br>Sound on, headphones if you have them'},
  end:{org:'BEHEMOTH down',t:'Landfall',sub:'Returning to the game…'},LINES,SHOTS,TAGS,build,tracks,apply,cue});
window.M4SIM=SIM;window.M4SIMTO=simTo;
})();
