/* Rift Mech Defense: the swarm creatures, as one module for the game (session A).
   Plain script; needs window.THREE (r187). Gives window.RMD.Creatures.

   const swarm = new RMD.Creatures.Swarm(scene);          // one buffer for every creature and every knocked-off dot
   const c = swarm.spawn('stalker', new THREE.Vector3(0,0,-40), heading);
   swarm.update(dt, t, targets);   // targets: [{pos:Vector3, kind:'mech'|'ally', ...}], each creature goes for the nearest
   swarm.pick(rayOrigin, rayDir)    // -> {creature, point} or null
   swarm.hit(creature, point, radius, dots)   // knocks up to `dots` dots off near `point`; returns how many
   swarm.blast(point, radius, dots)           // artillery: every creature in reach
   swarm.absorb(creature, pos, n)             // it takes something: n more dots (count can rise past where it started)
   swarm.grow(creature, n) / swarm.shed(creature, n)   // a rift feeds it / it sheds (sealed rift)
   swarm.pickAll(o, d)                        // every creature along a ray, nearest first (the Lance pierces)
   swarm.burn(point, radius)                  // burns loose dots on the ground (Arc, barrages); returns how many
   Cores: every creature of 100 dots or more has a core that wanders inside it. A hit on the core takes CORE_K (10) times
   the dots (swarm.lastCore tells you it was a core hit); the core shows hot on thermal.
   Loose dots: a share (swarm.liveK, 0.3) of knocked-off dots land alive and crawl back to the nearest creature within 25 m,
   rejoining it, unless burned first.
   swarm.setThermal(on); swarm.pxScale(px)    // view mode; pixels per metre at distance 1 (see SensorView.pxScale)
   swarm.ground = (x,z) => y                  // the world's ground height (B's map); creatures walk on it, loose dots land on it

   A creature's dot count is its hit points and its size: as dots come off it shrinks (size ~ cube root of the count);
   below 12% of where it started it comes apart. The rigs (pose + segments) are the same as the threat library viewer's
   (concept/swarm-viewer.src.html); change them in both places until the viewer uses this module. */
(function(){
'use strict';
const T=THREE;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
let seedN=7;const rnd=()=>{seedN=(seedN*16807)%2147483647;return (seedN-1)/2147483646;};
const gauss=()=>{let u=0;while(u===0)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random());};
const _up=V(0,1,0);

function legs(k,g,hips,len,lift,phOff,stride){ // simple gait helper
  for(const [nm,hx,hy,hz,off,side] of hips){const ph=g.phi+off+phOff;const sw=Math.sin(ph),up=Math.max(0,Math.cos(ph));
    const fx=hx+side*len[2],fz=hz+sw*stride*g.stride;const fy=up*lift*g.stride;
    k[nm+'h']=V(hx,hy,hz);k[nm+'k']=V(hx+side*len[0],hy+len[1]+fy*.5,hz+sw*stride*.4*g.stride+len[3]);k[nm+'f']=V(fx,fy,fz);}}
// speeds (m/s) and how they fight; the rest of each rig comes from the viewer
const MOVE={knot:{speed:7,dart:1},skein:{speed:5.5},runner:{speed:9},stalker:{speed:4.5},brute:{speed:3.2},drag:{speed:2.6},hulk:{speed:3},behemoth:{speed:4},titan:{speed:4.5}};
const RIGS=[
 {id:'knot',n:10,name:'KNOT',cls:'10 dots · darter',desc:'Darts in, bites, scatters. Never alone: they come in hundreds. Light Arc fire breaks them apart.',
  size:1.6,grid:14,cam:[6,.4,1],minD:2.2,maxD:60,base:.03,dot:.42,gain:1.25,reach:1.2,lane:9,
  seg:[['c','c',.75,.75,1]],pose(t,g){const k={};const b=1.05+.22*Math.sin(t*3.1)-.35*g.low+.6*g.hop;k.c=V(0,b,0);return k;}},
 {id:'skein',n:20,name:'SKEIN',cls:'20 dots · crawler',desc:'Low and many-legged. Climbs wreckage and pours through gaps in armour.',
  size:2.6,grid:18,cam:[6.5,.5,.5],yaw:.9,minD:2.5,maxD:70,base:.04,dot:.32,gain:1.15,reach:1.6,lane:10,
  seg:[['tail','mid',.3,.38,1.4],['mid','front',.38,.3,1.4],['front','head',.25,.18,.7]].concat(['a','b','c','d','e','f'].flatMap(s=>[[s+'h',s+'k',.07,.06,.5],[s+'k',s+'f',.06,.04,.6]])),
  pose(t,g){const k={};const y=.58-.18*g.low;const sway=Math.sin(g.phi*.5)*.08;
   k.tail=V(sway,y,-1.0);k.mid=V(0,y+.05,0);k.front=V(-sway,y,.9+g.stretch*.8);k.head=V(-sway*1.5,y-.05,1.3+g.stretch*1.3);
   legs(k,g,[['a',.22,y,-.6,0,1],['b',-.22,y,-.6,Math.PI,-1],['c',.25,y,0,Math.PI,1],['d',-.25,y,0,0,-1],['e',.22,y,.6,0,1],['f',-.22,y,.6,Math.PI,-1]],
     [.45,.38,.95,.1],.35,0,.42);return k;}},
 {id:'runner',n:50,name:'RUNNER',cls:'50 dots · pack hunter',desc:'Four legs, fast on open ground. Runs at whatever is moving and keeps going.',
  size:3.6,grid:24,cam:[8.5,.32,1.1],yaw:1.25,minD:3.5,maxD:90,base:.05,dot:.25,gain:1.05,reach:2.4,lane:13,
  seg:[['hip','sh',.42,.5,1.6],['sh','head',.3,.24,.8],['head','jaw',.2,.1,.4],['hip','t1',.2,.12,.5],['t1','t2',.12,.04,.35]]
   .concat(['fl','fr','bl','br'].flatMap(s=>[[s+'h',s+'k',.15,.12,.6],[s+'k',s+'f',.11,.07,.6]])),
  pose(t,g){const k={};const bob=Math.abs(Math.sin(g.phi))*.08*g.stride;const y=1.35-.38*g.low+bob;
   k.hip=V(0,y,-1.0);k.sh=V(0,y+.15-.2*g.low,.8+g.stretch*.6);k.head=V(0,y+.35-.55*g.low,1.65+g.stretch*1.2);k.jaw=V(0,y+.05-.6*g.low,2.1+g.stretch*1.5);
   const tw=Math.sin(t*2.3)*.35;k.t1=V(tw*.5,y+.05,-1.7);k.t2=V(tw,y+.2,-2.4);
   legs(k,g,[['fl',.34,y+.05,.8,0,1],['fr',-.34,y+.05,.8,Math.PI,-1],['bl',.34,y,-1.0,Math.PI,1],['br',-.34,y,-1.0,0,-1]],[.06,-.62,.05,.18],.45,0,.7);
   return k;}},
 {id:'stalker',n:100,name:'STALKER',cls:'100 dots · walks upright',desc:'Long arms, digitigrade legs. It goes for people first, and the ones it reaches join its count.',
  size:4.8,grid:30,cam:[11.5,.25,2.3],yaw:1.0,minD:4,maxD:110,base:.07,dot:.22,gain:.95,reach:2.8,lane:15,
  seg:[['pel','ch',.55,.72,2.2],['ch','nk',.32,.28,.6],['nk','hd',.34,.14,.8],['ch','sp1',.14,.02,.25],['pel','sp2',.12,.02,.2]]
   .concat(['l','r'].flatMap(s=>[[s+'s',s+'e',.22,.17,.8],[s+'e',s+'w',.16,.12,.8],[s+'w',s+'c',.1,.02,.45],[s+'hp',s+'kn',.26,.19,.9],[s+'kn',s+'an',.18,.11,.7],[s+'an',s+'ft',.1,.06,.35]])),
  pose(t,g){const k={};const L=g.low;const br=Math.sin(t*1.4)*.04;const bob=Math.abs(Math.sin(g.phi))*.12*g.stride;
   k.pel=V(0,2.3-.5*L+bob,0);k.ch=V(0,3.45-.75*L+br+bob,.45+.8*L+g.stretch*.6);k.nk=V(0,3.95-.9*L+bob,1.0+1.0*L+g.stretch*1.0);
   k.hd=V(Math.sin(t*.7)*.15,3.85-.95*L+bob,1.75+1.1*L+g.stretch*1.5);k.sp1=V(0,4.3-.7*L,-.4+.6*L);k.sp2=V(0,2.9-.4*L,-.6);
   for(const [s,x,o] of [['l',1,0],['r',-1,Math.PI]]){const sw=Math.sin(g.phi+o+Math.PI)*g.stride;const reachA=L*.9+g.stretch*1.6;
    k[s+'s']=V(x*.78,k.ch.y-.05,k.ch.z);k[s+'e']=V(x*1.15,k.ch.y-1.0+reachA*.3,k.ch.z+.35+sw*.4+reachA*.7);
    k[s+'w']=V(x*1.05,k.ch.y-2.0+reachA*1.0,k.ch.z+.8+sw*.6+reachA*1.6);k[s+'c']=V(x*.95,k.ch.y-2.6+reachA*1.3,k.ch.z+1.2+sw*.6+reachA*2.1);
    const ph=g.phi+o;const fs=Math.sin(ph)*.75*g.stride,up=Math.max(0,Math.cos(ph))*.45*g.stride;
    k[s+'hp']=V(x*.42,k.pel.y-.1,k.pel.z);k[s+'kn']=V(x*.52,k.pel.y-1.0+up*.4,k.pel.z+.65+fs*.4);
    k[s+'an']=V(x*.48,.65+up*.6,k.pel.z-.35+fs*.8);k[s+'ft']=V(x*.48,up*.5,k.pel.z+.3+fs);}
   return k;}},
 {id:'brute',n:500,name:'BRUTE',cls:'500 dots · armour breaker',desc:'Bigger than the Wraith. Walks on its fists. Every wreck and every person it takes adds to it.',
  size:9,grid:50,cam:[23,.22,4],yaw:1.2,minD:7,maxD:200,base:.1,dot:.27,gain:.7,reach:4.2,lane:26,
  seg:[['pel','hump',1.3,1.9,5],['hump','ch',1.8,1.6,4],['ch','hd',.95,.85,1.3],['hd','sn',.95,.45,.9],['pel','tl',.7,.15,.8]]
   .concat(['l','r'].flatMap(s=>[[s+'s',s+'e',1.05,.92,2.4],[s+'e',s+'f',.92,1.1,2.4],[s+'f',s+'f2',1.15,.9,1.2],[s+'hp',s+'kn',.85,.6,1.2],[s+'kn',s+'ft',.6,.45,.8],
     [s+'h0',s+'h1',.38,.22,.35],[s+'h1',s+'h2',.22,.07,.3]]))
   .concat([0,1,2,3,4].map(i=>['b'+i,'bt'+i,.45,.05,.35])),
  pose(t,g){const k={};const L=g.low;const br=Math.sin(t*.9)*.12;const bob=Math.abs(Math.sin(g.phi))*.25*g.stride;
   k.pel=V(0,3.3-.4*L+bob,-2.4);k.hump=V(0,7.3-.9*L+br+bob,.1+.4*L);k.ch=V(0,5.3-.8*L+bob,1.9+.6*L+g.stretch*.8);
   k.hd=V(Math.sin(t*.5)*.3,5.0-1.0*L+bob,3.5+.8*L+g.stretch*1.5);k.sn=V(Math.sin(t*.5)*.35,4.2-1.1*L+bob,4.8+.9*L+g.stretch*2.2);k.tl=V(Math.sin(t*1.3)*.6,2.4,-4.4);
   for(const [s,x,o] of [['l',1,0],['r',-1,Math.PI]]){const ph=g.phi+o;const sw=Math.sin(ph)*1.3*g.stride,up=Math.max(0,Math.cos(ph))*.9*g.stride;
    const slam=g.slam*(s==='l'?1:.6);
    k[s+'s']=V(x*2.3,k.hump.y-.9,1.3+.4*L);k[s+'e']=V(x*3.2,3.7+slam*3.5,2.3+sw*.5+slam*1.5);
    k[s+'f']=V(x*2.9,.95+up+slam*6.0,3.0+sw+g.stretch*1.6+slam*1.2);k[s+'f2']=V(x*2.8,.9+up+slam*6.0,3.5+sw+g.stretch*1.8+slam*1.5);
    const ph2=ph+Math.PI;const fs2=Math.sin(ph2)*.9*g.stride,up2=Math.max(0,Math.cos(ph2))*.6*g.stride;
    k[s+'hp']=V(x*1.25,k.pel.y-.2,-2.3);k[s+'kn']=V(x*1.55,1.7+up2*.5,-1.5+fs2*.5);k[s+'ft']=V(x*1.45,up2,-2.5+fs2);
    k[s+'h0']=V(x*.85,k.hd.y+.55,k.hd.z-.1);k[s+'h1']=V(x*2.3,k.hd.y+1.5,k.hd.z-.6);k[s+'h2']=V(x*2.6,k.hd.y+2.6,k.hd.z+.7);}
   for(let i=0;i<5;i++){const f=i/4;const bx=lerp(k.pel.x,k.hump.x,f),by=lerp(k.pel.y+1.2,k.hump.y+.9,f),bz=lerp(k.pel.z,k.hump.z,f)-.6;
    k['b'+i]=V(bx,by,bz);k['bt'+i]=V(bx,by+1.4+Math.sin(f*3)*.8,bz-1.6-f*.4);}
   return k;}},
 {id:'drag',n:1000,name:'DRAG',cls:'1,000 dots · hauls itself',desc:'A bloated mass that drags itself forward on two huge arms. Slow, until it reaches you.',
  size:12,grid:70,cam:[40,.3,3],yaw:1.15,minD:8,maxD:260,base:.12,dot:.3,gain:.62,reach:5.5,lane:34,
  seg:[['tail','belly',1.9,2.7,4],['belly','chest',2.7,2.4,4],['chest','hd',1.5,1.1,1.2],['b0','b0',1.7,1.7,.8],['b1','b1',1.4,1.4,.6]]
   .concat(['l','r'].flatMap(s=>[[s+'s',s+'e',1.1,.95,1.4],[s+'e',s+'h',.95,1.2,1.4],[s+'h',s+'h',1.1,1.1,.5],[s+'hp',s+'ft',.85,.65,.6]])),
  pose(t,g){const k={};const L=g.low;const br=Math.sin(t*.8)*.15;const surge=Math.abs(Math.sin(g.phi))*.5*g.stride;
   k.tail=V(Math.sin(t*.6)*.4,1.9+br*.5,-5.6+surge*.3);k.belly=V(0,2.7+br,-2.1+surge*.6);k.chest=V(0,3.7-.6*L+br,1.2+surge+g.stretch*1.2);
   k.hd=V(Math.sin(t*.4)*.4,3.1-.8*L,3.4+surge+g.stretch*2.0);k.b0=V(0,4.6+br,-.6);k.b1=V(.8,4.0+br,-3);
   for(const [s,x,o] of [['l',1,0],['r',-1,Math.PI]]){const ph=g.phi+o;const rch=Math.sin(ph)*g.stride;const up=Math.max(0,Math.cos(ph))*g.stride;const sl=g.slam*(s==='l'?1:.5);
    k[s+'s']=V(x*2.3,3.7-.4*L,1.4+surge);k[s+'e']=V(x*4.2,3.4+up*1.2+sl*3,3.3+rch*1.2+surge);
    k[s+'h']=V(x*3.8,.9+up*1.6+sl*4,5.4+rch*2.2+surge+g.stretch*2.4);k[s+'hp']=V(x*1.7,1.9,-2.3);k[s+'ft']=V(x*2.3,.4,-2.8+Math.sin(ph+1)*.3*g.stride);}
   return k;}},
 {id:'hulk',n:5000,name:'HULK',cls:'5,000 dots · upright mass',desc:'Nearly three Wraiths tall. Its head is sunk into its shoulders and its arms reach the ground.',
  size:18,grid:100,cam:[62,.22,8],yaw:.95,minD:12,maxD:400,base:.14,dot:.28,gain:.35,reach:7,lane:50,
  seg:[['pel','ch',3.1,4.0,5],['ch','hump',4.0,3.6,4],['ch','hd',2.3,1.7,1.4],['hump','hump',3.5,3.5,1.2]]
   .concat(['l','r'].flatMap(s=>[[s+'s',s+'e',2.1,1.8,2],[s+'e',s+'f',1.8,2.1,2],[s+'f',s+'f',2.1,2.1,.9],[s+'hp',s+'kn',2.0,1.6,1.4],[s+'kn',s+'ft',1.6,1.4,1]])),
  pose(t,g){const k={};const L=g.low;const br=Math.sin(t*.7)*.25;const bob=Math.abs(Math.sin(g.phi))*.5*g.stride;
   k.pel=V(0,6.3+bob-.6*L,-.6);k.ch=V(0,12.6+br+bob-1.4*L,1.6+1.2*L+g.stretch*1.2);k.hump=V(0,15.2+br+bob-1.2*L,-.6+.6*L);
   k.hd=V(Math.sin(t*.35)*.6,13.0+bob-1.8*L,4.4+1.6*L+g.stretch*2.6);
   for(const [s,x,o] of [['l',1,0],['r',-1,Math.PI]]){const ph=g.phi+o;const sw=Math.sin(ph+Math.PI)*g.stride;const up=Math.max(0,Math.cos(ph+Math.PI))*g.stride;const sl=g.slam*(s==='l'?1:.5);
    k[s+'s']=V(x*4.6,k.ch.y+1.2,k.ch.z-.2);k[s+'e']=V(x*6.3,8.6+up*2+sl*9,3.2+sw*1.5+sl*3);k[s+'f']=V(x*5.9,2.1+up*2.4+sl*14,4.8+sw*3+g.stretch*3+sl*4);
    const fs=Math.sin(ph)*2.2*g.stride,fu=Math.max(0,Math.cos(ph))*1.6*g.stride;
    k[s+'hp']=V(x*2.3,6,-.5);k[s+'kn']=V(x*2.9,3.3+fu*.5,1.2+fs*.4);k[s+'ft']=V(x*2.6,1.2+fu,fs);}
   return k;}},
 {id:'behemoth',n:10000,name:'BEHEMOTH',cls:'10,000 dots · the first boss',desc:'Thirty metres of it, built like a bison. It does not go around buildings. The first time something this size comes ashore.',
  size:28,grid:150,cam:[95,.24,9],yaw:1.2,minD:18,maxD:600,base:.16,dot:.33,gain:.39,reach:13,lane:80,
  seg:[['hip','mid',5.2,6.2,5],['mid','hump',6.2,7.2,5],['hump','hd',4.4,3.0,2],['hd','sn',3.0,2.0,1],['hip','tl',2.6,1.4,.6],
    ['l0','l0',3.6,3.6,.7],['l1','l1',3.1,3.1,.6],['l2','l2',2.7,2.7,.5]]
   .concat(['fl','fr','bl','br'].flatMap(s=>[[s+'h',s+'k',2.8,2.3,1.4],[s+'k',s+'f',2.3,2.5,1.2]])),
  pose(t,g){const k={};const L=g.low;const br=Math.sin(t*.6)*.35;const bob=Math.abs(Math.sin(g.phi))*.7*g.stride;
   k.hip=V(0,10+bob,-11);k.mid=V(0,11.4+br+bob,-3);k.hump=V(0,15+br+bob-1.5*L,4+g.stretch*1.5);
   k.hd=V(Math.sin(t*.3)*.8,8.6+bob-2.5*L,12+g.stretch*4+L*1.5);k.sn=V(Math.sin(t*.3),6.6+bob-3*L,15+g.stretch*5.5+L*2);
   k.tl=V(Math.sin(t*1.1)*1.5,7,-17);k.l0=V(0,19.3+br+bob-1.2*L,2.5);k.l1=V(1,18+br+bob,-2.5);k.l2=V(-.8,16+bob,-6.5);
   legs(k,g,[['fl',4.2,11+bob,6,0,1],['fr',-4.2,11+bob,6,Math.PI,-1],['bl',4,9.5+bob,-11,Math.PI,1],['br',-4,9.5+bob,-11,0,-1]],[.6,-5.4,.3,1.2],2.4,0,3.2);
   for(const s of ['fl','fr','bl','br'])k[s+'f'].y+=2.3;
   return k;}},
 {id:'titan',n:50000,name:'TITAN',cls:'50,000 dots · the mid boss',desc:'The mid boss. Sixty metres of BRUTE that has started to come apart into tendrils, out of its back, its shoulders, its hips. The first one that isn’t one shape.',
  size:60,grid:320,cam:[205,.2,26],yaw:.75,minD:35,maxD:1100,base:.18,dot:.4,gain:.31,reach:24,lane:170,
  seg:[['pel','tor',9.5,12.5,5],['tor','hump',12.5,11.5,4],['tor','hd',6.5,4.8,1.4],['hump','hump',10.5,10.5,1]]
   .concat(['l','r'].flatMap(s=>[[s+'s',s+'e',6.2,5.4,2],[s+'e',s+'f',5.4,6.2,2],[s+'f',s+'f',6.4,6.4,.8],[s+'hp',s+'kn',6,4.8,1.2],[s+'kn',s+'ft',4.8,4.2,1],
     [s+'t0',s+'t1',3.0,2.1,1.6],[s+'t1',s+'t2',2.1,1.1,1.4],[s+'u0',s+'u1',2.4,1.6,1.3],[s+'u1',s+'u2',1.6,.8,1.1],[s+'v0',s+'v1',2.6,1.8,1.4],[s+'v1',s+'v2',1.8,.9,1.2]])),
  pose(t,g){const k={};const L=g.low;const br=Math.sin(t*.5)*.8;const bob=Math.abs(Math.sin(g.phi))*1.6*g.stride;
   k.pel=V(0,21+bob-2*L,-4);k.tor=V(0,40+br+bob-4*L,4+3*L+g.stretch*4);k.hump=V(0,48+br+bob-3.5*L,-4+2*L);
   k.hd=V(Math.sin(t*.25)*2,41+bob-5*L,15+4*L+g.stretch*8);
   for(const [s,x,o] of [['l',1,0],['r',-1,Math.PI]]){const ph=g.phi+o;const sw=Math.sin(ph+Math.PI)*g.stride;const up=Math.max(0,Math.cos(ph+Math.PI))*g.stride;const sl=g.slam*(s==='l'?1:.5);
    k[s+'s']=V(x*14,k.tor.y+5,k.tor.z);k[s+'e']=V(x*20,26+up*6+sl*28,10+sw*5+sl*9);k[s+'f']=V(x*18,6.4+up*7+sl*44,16+sw*9+g.stretch*10+sl*12);
    const fs=Math.sin(ph)*7*g.stride,fu=Math.max(0,Math.cos(ph))*5*g.stride;
    k[s+'hp']=V(x*7,20,-4);k[s+'kn']=V(x*9,10+fu*.5,3+fs*.4);k[s+'ft']=V(x*8,4+fu,-1+fs);
    const w1=t*.9+o,w2=t*1.3+o*1.7,rch=(g.ag?1:0)*(.4+g.stretch+L*.5);
    k[s+'t0']=V(x*7,52+br,-8);k[s+'t1']=V(x*(22+4*Math.sin(w1)),74+5*Math.sin(w1*1.2)-rch*10,-20+7*Math.sin(w1*.8)+rch*26);
    k[s+'t2']=V(x*(38+6*Math.sin(w2)),80+8*Math.sin(w2*.9)-rch*30,-8+12*Math.sin(w2*.7)+rch*60);
    const w3=t*.7+o*2.3,w4=t*1.1+o*.9,w5=t*.6+o*1.3,w6=t*.95+o*2.7;      // more tendrils: from the shoulders, and from the hips trailing on the ground
    k[s+'u0']=V(x*13,k.tor.y+9,k.tor.z-6);k[s+'u1']=V(x*(24+4*Math.sin(w3)),k.tor.y+22+5*Math.sin(w3*1.3)-rch*6,k.tor.z-2+8*Math.sin(w3*.8)+rch*18);
    k[s+'u2']=V(x*(30+7*Math.sin(w4)),k.tor.y+38+7*Math.sin(w4*.9)-rch*24,k.tor.z+6+12*Math.sin(w4*.6)+rch*46);
    k[s+'v0']=V(x*9,24,-10);k[s+'v1']=V(x*(20+4*Math.sin(w5)),8+3*Math.sin(w5*1.4),-22+6*Math.sin(w5*.7)+rch*20);
    k[s+'v2']=V(x*(34+8*Math.sin(w6)),2.5+2*Math.max(0,Math.sin(w6*1.2)),-34+12*Math.sin(w6*.8)+rch*58);}
   return k;}}
];
const RIG={};RIGS.forEach(r=>{RIG[r.id]=Object.assign(r,MOVE[r.id]||{speed:4});});

// ---------------------------------------------------------------- the dot shader (same look as the viewer; size and crawl per dot)
const ADD={transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor};
function dotMaterial(){return new T.ShaderMaterial(Object.assign({uniforms:{uScale:{value:1},uMin:{value:2},uMax:{value:56},uSoft:{value:0},uGain:{value:1},uT:{value:0},uSizeMul:{value:1}},
 vertexShader:`attribute vec3 aCol;attribute float aI,aS,aB;uniform float uScale,uMin,uMax,uGain,uT,uSizeMul;varying vec3 vC;varying float vA;
 void main(){vec3 p0=position;if(aB>0.){vec3 w=p0*(12./aB);p0+=vec3(sin(w.y*1.7+uT*1.1)+sin(w.z*2.3-uT*.8),sin(w.z*1.9+uT*.9)+sin(w.x*2.1+uT*1.3),sin(w.x*1.5-uT*1.2)+sin(w.y*2.5+uT*.7))*aB*.008*aCol.r*(1.-aCol.b);}
  vec4 mv=modelViewMatrix*vec4(p0,1.);gl_Position=projectionMatrix*mv;
  float px=aS*uSizeMul*uScale/max(.001,-mv.z);float cl=clamp(px,uMin,uMax);
  vA=aI*uGain*min(1.,px*px/(cl*cl)+.4);gl_PointSize=cl;vC=aCol;}`,
 fragmentShader:`varying vec3 vC;varying float vA;uniform float uSoft;
 void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;float core=exp(-r*r*mix(5.5,1.6,uSoft));gl_FragColor=vec4(vC*vA*core,1.);}`},ADD));}

// ---------------------------------------------------------------- one creature: a rig, its dots, a little state machine
function makeCreature(rig,pos,heading,opts){opts=opts||{};
  seedN=Math.floor(Math.random()*1e6)+11;
  const g0={phi:0,stride:0,low:0,stretch:0,hop:0,slam:0,ag:0};
  const kp=rig.pose(0,g0);
  const segs=rig.seg.map(([a,b,ra,rb,w])=>{const L=kp[a].distanceTo(kp[b]);return {a,b,ra,rb,w:(L*(ra+rb)*.5+ra*ra*1.6)*w};});
  const tot=segs.reduce((s,x)=>s+x.w,0);const n=Math.max(4,Math.round(opts.n||rig.n));
  const cnt=segs.map(s=>s.w/tot*n);const flo=cnt.map(Math.floor);let left=n-flo.reduce((a,b)=>a+b,0);
  cnt.map((c,i)=>[c-flo[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,left).forEach(([,i])=>flo[i]++);
  const big=n>500;const gsz=n>=10000?60:n>=5000?40:16;const P=[];let cl=null,clLeft=0,nCl=0;
  segs.forEach((s,si)=>{clLeft=0;for(let j=0;j<flo[si];j++){
    let u=flo[si]>1?(j+.2+.6*rnd())/flo[si]:.5;let a=rnd()*Math.PI*2;let rr=.72+.28*Math.sqrt(rnd());let cap=0,ci=-1,cr=rnd();
    if(big){const thin=s.ra<3.5;if(clLeft<=0){cl={u:rnd(),a:rnd()*Math.PI*2,rr:1-.5*Math.pow(rnd(),1.4),cap:rnd()<.22?(rnd()<.5?-1:1):0,cr:rnd(),i:nCl++};clLeft=Math.round((thin?Math.max(4,gsz/8):gsz)*(.4+rnd()*1.2));}
      clLeft--;ci=cl.i;cap=cl.cap;u=cap?(cap<0?0:1):clamp(cl.u+gauss()*.045,0,1);a=cl.a+gauss()*.28;rr=clamp(cl.rr+gauss()*.12,.2,1.08);cr=cap?clamp(cl.cr+gauss()*.12,0,1):cr;}
    const sph=[gauss(),gauss(),gauss()];const sl=Math.hypot(...sph)||1;
    P.push({s:si,u,ox:Math.cos(a)*rr,oy:Math.sin(a)*rr,sx:sph[0]/sl*rr,sy:sph[1]/sl*rr,sz:sph[2]/sl*rr,cap,cr,ci,
      k:(big?40:70)+rnd()*(big?90:110),d:(big?9:11)+rnd()*7,ph:rnd()*6.283,jf:.7+rnd()*1.6,p:V(),v:V(),alive:true});}});
  // spare slots: what it takes from the world becomes more of it (up to +45%, or +220 dots for anything of 50 or more)
  const spare=Math.max(Math.ceil(n*.45),n>=50?220:0);for(let i=0;i<spare;i++){const q=P[Math.floor(rnd()*n)];P.push(Object.assign({},q,{p:V(),v:V(),alive:false,ph:rnd()*6.283}));}
  return {rig,segs,P,n0:n,count:n,nCl,cw:new Float32Array(Math.max(1,nCl)*3),cph:Float32Array.from({length:Math.max(1,nCl)},()=>rnd()*6.283),
    pos:pos.clone(),heading:heading||0,scale:1,phi:Math.random()*6,state:'walk',st:0,target:null,first:true,dead:false,gone:false,fade:1,
    id:Math.random().toString(36).slice(2,8),hp:1,mauling:false,
    core:n>=100?{seg:0,u:.5,to:{seg:0,u:.5},t:0,pos:V(),r:1,seen:false}:null,corePos:V()};
}
const _q=new T.Quaternion(),_e=new T.Euler();
function gait(c,dt){const r=c.rig,g={phi:c.phi,stride:0,low:.1,stretch:0,hop:0,slam:0,ag:1,thrash:0};const st=c.st;
  if(c.state==='walk'){g.stride=.9;g.low=.5;}
  else if(c.state==='lunge'){const f=ss(0,.35,st);g.stretch=Math.sin(f*Math.PI)+f*.3;g.low=.7;g.hop=Math.sin(f*Math.PI);g.stride=.3;}
  else if(c.state==='maul'){g.stretch=.3;g.low=.85;g.thrash=1;g.stride=.25;g.slam=Math.max(0,Math.sin(st*9))*.7;}
  else if(c.state==='back'){g.stride=.75;g.low=.4;}
  else if(c.state==='idle'){g.stride=.12;g.low=.1;}
  if(r.id==='knot'&&c.state==='walk')g.hop=Math.max(0,Math.sin(c.phi*1.8))*.35;
  return g;}

// ---------------------------------------------------------------- the swarm: every creature and every loose dot in one Points
class Swarm{
  constructor(scene,opts={}){
    this.max=opts.max||80000;this.maxDebris=opts.maxDebris||12000;const N=this.max+this.maxDebris;
    this.pos=new Float32Array(N*3);this.col=new Float32Array(N*3);this.I=new Float32Array(N);this.S=new Float32Array(N);this.B=new Float32Array(N);
    const g=new T.BufferGeometry();this.geo=g;
    g.setAttribute('position',new T.BufferAttribute(this.pos,3).setUsage(T.DynamicDrawUsage));g.setAttribute('aCol',new T.BufferAttribute(this.col,3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('aI',new T.BufferAttribute(this.I,1).setUsage(T.DynamicDrawUsage));g.setAttribute('aS',new T.BufferAttribute(this.S,1).setUsage(T.DynamicDrawUsage));
    g.setAttribute('aB',new T.BufferAttribute(this.B,1).setUsage(T.DynamicDrawUsage));
    this.mat=dotMaterial();this.points=new T.Points(g,this.mat);this.points.frustumCulled=false;scene.add(this.points);
    this.list=[];this.thermal=false;this.ground=(x,z)=>0;this.liveK=.3;this.coreK=10;this.lastCore=false;this.dLive=new Uint8Array(opts.maxDebris||12000);this.rejoined=0;
    this.dPos=new Float32Array(this.maxDebris*3);this.dVel=new Float32Array(this.maxDebris*3);this.dLife=new Float32Array(this.maxDebris);this.dS=new Float32Array(this.maxDebris);this.dHead=0;
  }
  get dots(){return this.list.reduce((s,c)=>s+(c.dead?0:c.count),0);}
  spawn(id,pos,heading,opts){const rig=RIG[id];if(!rig)throw new Error('no creature '+id);const c=makeCreature(rig,pos,heading,opts);this.list.push(c);return c;}
  setThermal(on){this.thermal=on;this.mat.uniforms.uSoft.value=on?1:0;this.mat.uniforms.uSizeMul.value=on?4.2:1;this.mat.uniforms.uMin.value=on?8:2.5;this.mat.uniforms.uMax.value=on?160:56;}
  pxScale(px){this.mat.uniforms.uScale.value=px;}
  center(c,out){return (out||V()).set(c.pos.x,c.pos.y+c.rig.size*.35*c.scale,c.pos.z);}
  radius(c){return c.rig.size*.55*c.scale+1;}
  pick(o,d){let best=null,bt=1e9;const cp=V(),w=V();
    for(const c of this.list){if(c.dead)continue;this.center(c,cp);w.subVectors(cp,o);const t=w.dot(d);if(t<0)continue;
      const r=this.radius(c);const d2=w.lengthSq()-t*t;if(d2>r*r)continue;if(t<bt){bt=t;best={creature:c,point:o.clone().addScaledVector(d,t).lerp(cp,.35)};}}
    return best;}
  pickAll(o,d){const out=[];const cp=V(),w=V();
    for(const c of this.list){if(c.dead)continue;this.center(c,cp);w.subVectors(cp,o);const t=w.dot(d);if(t<0)continue;
      const r=this.radius(c);const d2=w.lengthSq()-t*t;if(d2>r*r)continue;out.push({creature:c,t,point:o.clone().addScaledVector(d,t).lerp(cp,.35)});}
    return out.sort((a,b)=>a.t-b.t);}
  burn(point,radius){let k=0;const r2=radius*radius;for(let i=0;i<this.maxDebris;i++){if(this.dLife[i]<=0||!this.dLive[i])continue;
      const dx=this.dPos[i*3]-point.x,dz=this.dPos[i*3+2]-point.z;if(dx*dx+dz*dz<r2){this.dLive[i]=0;this.dLife[i]=Math.min(this.dLife[i],.25);k++;}}return k;}
  _debris(p,from,speed,s,live){const i=this.dHead;this.dLive[i]=live&&Math.random()<this.liveK?1:0;this.dHead=(this.dHead+1)%this.maxDebris;
    const dx=p.x-from.x,dy=p.y-from.y,dz=p.z-from.z;const l=Math.hypot(dx,dy,dz)||1;
    this.dPos.set([p.x,p.y,p.z],i*3);this.dVel.set([dx/l*speed*(.5+Math.random()),Math.abs(dy/l)*speed*.6+speed*.4*Math.random()+2,dz/l*speed*(.5+Math.random())],i*3);
    this.dLife[i]=1;this.dS[i]=s;}
  hit(c,point,radius,dots,opts){if(!c||c.dead)return 0;this.lastCore=false;
    if(c.core&&point.distanceTo(c.corePos)<c.core.r*1.4+radius*.5){dots*=this.coreK;radius=Math.max(radius*2.5,c.core.r*1.6);this.lastCore=true;c.core.seen=true;}
    const r2=radius*radius;let k=0;const sp=6+radius*2;const live=!(opts&&opts.burn);
    const near=[];for(let i=0;i<c.P.length;i++){const q=c.P[i];if(!q.alive)continue;const d2=q.p.distanceToSquared(point);if(d2<r2)near.push([d2,i]);}
    near.sort((a,b)=>a[0]-b[0]);
    for(const [,i] of near){if(k>=dots)break;const q=c.P[i];q.alive=false;this._debris(q.p,point,sp,c.rig.dot,live);k++;}
    // nothing close enough: the shot still tears dots off the nearest skin
    if(k===0&&dots>0){let bi=-1,bd=1e9;for(let i=0;i<c.P.length;i++){const q=c.P[i];if(!q.alive)continue;const d2=q.p.distanceToSquared(point);if(d2<bd){bd=d2;bi=i;}}
      if(bi>=0&&bd<(radius*3)*(radius*3)){c.P[bi].alive=false;this._debris(c.P[bi].p,point,sp,c.rig.dot,live);k=1;}}
    c.count-=k;c.hp=c.count/c.n0;
    if(c.count<Math.max(2,c.n0*.12)){for(const q of c.P)if(q.alive){q.alive=false;this._debris(q.p,this.center(c),8+c.rig.size*.6,c.rig.dot);}c.count=0;c.dead=true;}
    return k;}
  blast(point,radius,dots){let tot=0;for(const c of this.list){if(c.dead)continue;const d=Math.hypot(c.pos.x-point.x,c.pos.z-point.z);
      if(d<radius+this.radius(c)){const share=Math.round(dots*clamp(1-d/(radius+this.radius(c)),.25,1));tot+=this.hit(c,this.center(c).lerp(point,.5),radius+c.rig.size*.4,share);}}
    return tot;}
  absorb(c,pos,n){if(!c||c.dead)return 0;n=n||1;let k=0;for(const q of c.P){if(k>=n)break;if(q.alive)continue;q.alive=true;q.p.copy(pos);q.p.x+=(Math.random()-.5)*2;q.p.z+=(Math.random()-.5)*2;q.v.set(0,0,0);k++;}
    c.count+=k;c.hp=c.count/c.n0;return k;}
  grow(c,n){if(!c||c.dead)return 0;let k=0;const al=c.P.filter(q=>q.alive);for(const q of c.P){if(k>=n)break;if(q.alive)continue;const src=al[Math.floor(Math.random()*al.length)];q.alive=true;q.p.copy(src?src.p:c.pos);q.v.set(0,0,0);k++;}
    c.count+=k;c.hp=c.count/c.n0;return k;}
  shed(c,n){if(!c||c.dead)return 0;let k=0;for(const q of c.P){if(k>=n)break;if(!q.alive)continue;if(Math.random()>.2)continue;q.alive=false;this._debris(q.p,this.center(c),4,c.rig.dot,false);k++;}
    c.count-=k;c.hp=c.count/c.n0;return k;}
  update(dt,t,targets){
    let o=0;const P3=this.pos,C3=this.col,I=this.I,S=this.S,B=this.B;
    for(const c of this.list){if(c.gone)continue;
      if(c.dead){c.gone=true;continue;}
      // brain: nearest target, walk, lunge, maul, back off
      let tg=null,td=1e9;for(const x of targets||[]){if(x.gone)continue;const d=Math.hypot(x.pos.x-c.pos.x,x.pos.z-c.pos.z);if(d<td&&d<(x.notice||1e9)){td=d;tg=x;}}
      c.target=tg;c.st+=dt;const r=c.rig,reach=(r.reach||2)*c.scale+1.2;c.mauling=false;
      if(tg){const want=Math.atan2(tg.pos.x-c.pos.x,tg.pos.z-c.pos.z);let dh=want-c.heading;dh=Math.atan2(Math.sin(dh),Math.cos(dh));c.heading+=dh*Math.min(1,dt*(c.state==='walk'?3:1.2));}
      const fx=Math.sin(c.heading),fz=Math.cos(c.heading);const sp=r.speed*(.6+.4*c.scale);
      if(c.state==='walk'){if(tg){c.pos.x+=fx*sp*dt;c.pos.z+=fz*sp*dt;}else c.state='idle';if(tg&&td<reach*2.4){c.state='lunge';c.st=0;}c.phi+=dt*sp/Math.max(.6,r.size*.25)*1.6;}
      else if(c.state==='idle'){c.phi+=dt;if(tg){c.state='walk';c.st=0;}}
      else if(c.state==='lunge'){const f=Math.max(0,td-reach*.6);const step=Math.min(f,sp*5*dt);c.pos.x+=fx*step;c.pos.z+=fz*step;c.phi+=dt*6;if(c.st>.4){c.state='maul';c.st=0;}}
      else if(c.state==='maul'){c.mauling=td<reach*1.6;c.phi+=dt*9;if(c.st>1.4){c.state='back';c.st=0;}}
      else if(c.state==='back'){c.pos.x-=fx*sp*.6*dt;c.pos.z-=fz*sp*.6*dt;c.phi-=dt*3.6;if(c.st>.9){c.state='walk';c.st=0;}}
      c.pos.y=this.ground(c.pos.x,c.pos.z);
      const target=Math.cbrt(Math.max(.05,c.count/c.n0));c.scale+=(clamp(target,.4,1.25)-c.scale)*Math.min(1,dt*2.5);
      // pose → world
      const g=gait(c,dt);const kp=r.pose(t,g);const s=c.scale;_q.setFromEuler(_e.set(0,c.heading,0));
      const F=c.segs.map(sg=>{const A=kp[sg.a].clone().multiplyScalar(s).applyQuaternion(_q).add(c.pos),Bp=kp[sg.b].clone().multiplyScalar(s).applyQuaternion(_q).add(c.pos);
        const d=Bp.clone().sub(A);const L=d.length();if(L>1e-4)d.multiplyScalar(1/L);const n1=new T.Vector3().crossVectors(Math.abs(d.y)>.9?V(1,0,0):_up,d).normalize();const n2=new T.Vector3().crossVectors(d,n1);
        return {A,d,L,n1,n2,ra:sg.ra*s,rb:sg.rb*s};});
      if(c.core){const co=c.core;co.t-=dt;if(co.t<=0){const sg=c.segs;let tw=0;for(const x of sg)tw+=x.w;let r=Math.random()*tw,si=0;for(;si<sg.length-1;si++){r-=sg[si].w;if(r<=0)break;}
          co.to={seg:si,u:.2+Math.random()*.6};co.t=3+Math.random()*2.5;}
        const f=F[co.to.seg];const tx=f.A.x+f.d.x*f.L*co.to.u,ty=f.A.y+f.d.y*f.L*co.to.u,tz=f.A.z+f.d.z*f.L*co.to.u;
        if(c.first)c.corePos.set(tx,ty,tz);else{const k=Math.min(1,dt*1.8);c.corePos.x+=(tx-c.corePos.x)*k;c.corePos.y+=(ty-c.corePos.y)*k;c.corePos.z+=(tz-c.corePos.z)*k;}
        co.r=Math.max(.7,r.size*s*.1);}
      const big=c.n0>500;const jit=big?0:(c.state==='walk'?.1:.2)*(1+g.thrash*2.2)*Math.max(.5,r.size*s/4);
      if(big){const am=r.size*s*.035;for(let k=0;k<c.nCl;k++){const ph=c.cph[k];c.cw[k*3]=Math.sin(t*.7+ph)*am;c.cw[k*3+1]=Math.sin(t*.55+ph*1.7)*am*.7;c.cw[k*3+2]=Math.cos(t*.62+ph*2.3)*am;}}
      const sub=Math.max(1,Math.ceil(dt/(1/90)));const h=dt/sub;const gain=r.gain*(this.thermal?.07*Math.pow(Math.min(1,500/r.n),.33):1);
      for(const p of c.P){if(!p.alive)continue;const f=F[p.s];let tx,ty,tz;
        if(f.L<1e-4){tx=f.A.x+p.sx*f.ra;ty=f.A.y+p.sy*f.ra;tz=f.A.z+p.sz*f.ra;}
        else{let rr=lerp(f.ra,f.rb,p.u),along=f.L*p.u;if(p.cap){const re=p.cap<0?f.ra:f.rb;const oo=p.cr*re;along+=p.cap*oo;rr=Math.sqrt(Math.max(0,re*re-oo*oo));}
          tx=f.A.x+f.d.x*along+(f.n1.x*p.ox+f.n2.x*p.oy)*rr;ty=f.A.y+f.d.y*along+(f.n1.y*p.ox+f.n2.y*p.oy)*rr;tz=f.A.z+f.d.z*along+(f.n1.z*p.ox+f.n2.z*p.oy)*rr;}
        if(p.ci>=0){tx+=c.cw[p.ci*3];ty+=c.cw[p.ci*3+1];tz+=c.cw[p.ci*3+2];}
        if(jit>0){const w=t*p.jf*(c.state==='walk'?3:5.5)+p.ph;tx+=Math.sin(w)*jit;ty+=Math.sin(w*1.31+1.7)*jit*.7;tz+=Math.cos(w*.87)*jit;}
        if(c.first){p.p.set(tx,ty,tz);}
        else for(let k=0;k<sub;k++){p.v.x+=((tx-p.p.x)*p.k-p.v.x*p.d)*h;p.v.y+=((ty-p.p.y)*p.k-p.v.y*p.d)*h;p.v.z+=((tz-p.p.z)*p.k-p.v.z*p.d)*h;p.p.x+=p.v.x*h;p.p.y+=p.v.y*h;p.p.z+=p.v.z*h;}
        if(o>=this.max)continue;let gi=gain;if(c.core){const cr=c.core.r*1.7,dx=p.p.x-c.corePos.x,dy=p.p.y-c.corePos.y,dz=p.p.z-c.corePos.z;if(dx*dx+dy*dy+dz*dz<cr*cr)gi*=this.thermal?7:2.2;}
        P3[o*3]=p.p.x;P3[o*3+1]=p.p.y;P3[o*3+2]=p.p.z;C3[o*3]=1;C3[o*3+1]=0;C3[o*3+2]=0;I[o]=gi;S[o]=r.dot;B[o]=big?r.size*s:0;o++;}
      c.first=false;}
    // loose dots: fly, fall, fade; live ones land and crawl back to the nearest creature
    const dg=this.thermal?.05:1;const alive=this.list.filter(c=>!c.dead&&!c.gone).map(c=>({c,x:c.pos.x,z:c.pos.z,r:this.radius(c)}));
    for(let i=0;i<this.maxDebris;i++){if(this.dLife[i]<=0)continue;const k=i*3;
      if(this.dLive[i]&&this.dPos[k+1]<this.ground(this.dPos[k],this.dPos[k+2])+.4&&Math.abs(this.dVel[k+1])<3){
        let best=null,bd=25;for(const a of alive){const d=Math.hypot(a.x-this.dPos[k],a.z-this.dPos[k+2])-a.r*.6;if(d<bd){bd=d;best=a;}}
        if(!best){this.dLive[i]=0;}
        else if(bd<.5){if(this.absorb(best.c,V(this.dPos[k],this.dPos[k+1],this.dPos[k+2]),1))this.rejoined++;this.dLife[i]=0;this.dLive[i]=0;continue;}
        else{const dx=best.x-this.dPos[k],dz=best.z-this.dPos[k+2],l=Math.hypot(dx,dz)||1;this.dVel[k]=dx/l*3.2;this.dVel[k+2]=dz/l*3.2;this.dVel[k+1]=0;
          this.dPos[k]+=this.dVel[k]*dt;this.dPos[k+2]+=this.dVel[k+2]*dt;this.dPos[k+1]=this.ground(this.dPos[k],this.dPos[k+2])+.15;this.dLife[i]-=dt*.08;
          if(o<this.max+this.maxDebris){P3[o*3]=this.dPos[k];P3[o*3+1]=this.dPos[k+1];P3[o*3+2]=this.dPos[k+2];C3[o*3]=1;C3[o*3+1]=0;C3[o*3+2]=0;I[o]=.55*dg;S[o]=this.dS[i]*.8;B[o]=0;o++;}
          continue;}}
      this.dVel[k+1]-=14*dt;
      this.dPos[k]+=this.dVel[k]*dt;this.dPos[k+1]+=this.dVel[k+1]*dt;this.dPos[k+2]+=this.dVel[k+2]*dt;
      const gy=this.ground(this.dPos[k],this.dPos[k+2])+.1;if(this.dPos[k+1]<gy){this.dPos[k+1]=gy;this.dVel[k]*=.6;this.dVel[k+2]*=.6;this.dVel[k+1]*=-.25;}
      this.dLife[i]-=dt*.9;if(o>=this.max+this.maxDebris)continue;const L=Math.max(0,this.dLife[i]);
      P3[o*3]=this.dPos[k];P3[o*3+1]=this.dPos[k+1];P3[o*3+2]=this.dPos[k+2];C3[o*3]=1;C3[o*3+1]=0;C3[o*3+2]=0;I[o]=L*L*1.4*dg;S[o]=this.dS[i]*(.6+.4*L);B[o]=0;o++;}
    this.list=this.list.filter(c=>!c.gone);
    this.geo.setDrawRange(0,o);
    for(const [k,w] of [['position',3],['aCol',3],['aI',1],['aS',1],['aB',1]]){const a=this.geo.attributes[k];a.clearUpdateRanges();a.addUpdateRange(0,o*w);a.needsUpdate=true;}
    this.mat.uniforms.uT.value=t;
  }
}
window.RMD=window.RMD||{};
window.RMD.Creatures={Swarm,RIG,RIGS,dotMaterial};
})();
