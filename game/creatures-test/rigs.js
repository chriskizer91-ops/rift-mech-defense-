/* creatures-test/rigs.js — the swarm creatures KNOT to BRUTE, copied from concept/swarm-viewer.src.html (session A's viewer,
   20 Nov 2026) for session C's arena. The rigs below (legs() and the RIGS table) are the viewer's own lines, unchanged.
   Session A will hand over the proper creature module later (asked on docs/BOARD.md); until then this copy is what the arena fights.
   pose(t,g) returns key points in creature space (faces +z, feet on y=0). Segments join key points: [a,b,radiusA,radiusB,weight]. */
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
let aggro=true;   /* the viewer's TITAN pose reads this; the arena's creatures are always hunting */
function legs(k,g,hips,len,lift,phOff,stride){ // simple gait helper
  for(const [nm,hx,hy,hz,off,side] of hips){const ph=g.phi+off+phOff;const sw=Math.sin(ph),up=Math.max(0,Math.cos(ph));
    const fx=hx+side*len[2],fz=hz+sw*stride*g.stride;const fy=up*lift*g.stride;
    k[nm+'h']=V(hx,hy,hz);k[nm+'k']=V(hx+side*len[0],hy+len[1]+fy*.5,hz+sw*stride*.4*g.stride+len[3]);k[nm+'f']=V(fx,fy,fz);}}
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
];
