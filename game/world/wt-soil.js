'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: THE SOIL (game/world/wt-soil.js)
   Mud Lab's soil (borrowed/mud-lab/src/ml-soil.js), lifted out of the Salt & Sand engine into plain three.js and scaled
   for a 6.6 m walker instead of a tyre. What carries over, as Mud Lab does it:
     - the ground kept as what's been done to it, cell by cell, in squares made only when something first touches them
       (Mud Lab: 8 cm cells in 5.12 m squares; here 25 cm cells in 16 m squares, over the whole 320 m map)
     - a press sinks until the soil bears it, measured from the ground as made, so walking the same spot again doesn't
       dig on down; a share of what sinks is squeezed up beside the print as a berm (mlStamp)
     - soft wet soil slumps back into its prints by itself (mlSettle); under water it slumps three times as fast
     - a clod that lands is a small soft lump (mlLand)
   Each soil's numbers are Mud Lab's ML_SOIL turned into what a Wraith foot does (a 30 t walker on about 1 m^2 of foot):
     sink: how deep a full step presses (m); berm: share of it squeezed up beside; slump: how fast its prints flow back
   Kept per cell: rut (m, down in prints and craters, up in berms and rubble), churn (0..1: turned over, dark, lumpy),
   heat (when and how hot: craters and the trails the swarms leave, for the thermal view).
   On the graphics card the whole map is one 1,280 x 1,280 texture (R rut, G churn, B heat's time, A heat); a square is
   sent again only when it changes.
   ===================================================================================================================== */
const SOILS={
  sand:{sink:.26,berm:.5,slump:.25},     /* dry sand: deep loose prints, a big berm, edges that run */
  wsand:{sink:.09,berm:.4,slump:.6},    /* wet sand: firmer (Mud Lab: wet sand bears more), crisp prints that soften */
  mud:{sink:.42,berm:.3,slump:1.5},     /* silt and mud: deep, and it flows back in */
  dirt:{sink:.06,berm:.15,slump:0},     /* packed dirt */
  hard:{sink:0,berm:0,slump:0},         /* asphalt, paving: a foot only scuffs it */
  rock:{sink:.012,berm:.04,slump:0}};
const SOIL={C:.25,N:1280,T:64,NT:20,X0:-160,S:320,tiles:new Array(400).fill(null),up:new Set(),act:new Map(),clock:0,tex:null,src:null,half:null,
  stat:{prints:0,churn:0,craters:0,tiles:0},TAU:30};
function soilTile(ti,tj,make){if(ti<0||tj<0||ti>=SOIL.NT||tj>=SOIL.NT)return null;const q=tj*SOIL.NT+ti;let t=SOIL.tiles[q];
  if(!t&&make){const n=4096;t=SOIL.tiles[q]={ti,tj,r:new Float32Array(n),c:new Float32Array(n),ht:new Float32Array(n),ha:new Float32Array(n),sl:null};SOIL.stat.tiles++;}return t;}
function soilR(i,j){if(i<0||j<0||i>=SOIL.N||j>=SOIL.N)return 0;const t=SOIL.tiles[(j>>6)*SOIL.NT+(i>>6)];return t?t.r[((j&63)<<6)|(i&63)]:0;}
/* the rut at a point, between cells */
function soilH(x,z){const fx=(x-SOIL.X0)/SOIL.C-.5,fz=(z-SOIL.X0)/SOIL.C-.5,i=Math.floor(fx),j=Math.floor(fz),ax=fx-i,az=fz-j;
  const a=soilR(i,j),b=soilR(i+1,j),c=soilR(i,j+1),d=soilR(i+1,j+1);return a+(b-a)*ax+(c-a)*az+(a-b-c+d)*ax*az;}
/* the ground as it is now */
function hgt(x,z){return baseH(x,z)+soilH(x,z);}
function soilDirty(t){SOIL.up.add(t.tj*SOIL.NT+t.ti);}
function soilWake(t,secs){const u=SOIL.clock+secs;if((SOIL.act.get(t)||0)<u)SOIL.act.set(t,u);}
/* the soil's numbers at a point: each kind's, mixed by how much of each there is */
const SK={},SP={sink:0,berm:0,slump:0,kind:'dirt'};
function soilParams(x,z){const K=baseKind(x,z,SK),o=SP;
  const under=K.h+soilH(x,z)<0;const rock=smooth(.9,1.6,K.slope);
  const wet=under?1:K.wet;let w={sand:K.sand*(1-wet),wsand:K.sand*wet,mud:K.mud,hard:K.asph+K.pave};
  let t=w.sand+w.wsand+w.mud+w.hard;if(t>1){for(const k in w)w[k]/=t;t=1;}w.dirt=1-t;
  for(const k in w)w[k]*=1-rock;w.rock=rock;
  o.sink=o.berm=o.slump=0;let best='dirt',bw=-1;
  for(const k in w){const P=SOILS[k],q=w[k];if(q>bw){bw=q;best=k;}o.sink+=P.sink*q;o.berm+=P.berm*q;o.slump+=P.slump*q;}
  if(under)o.slump*=3;o.kind=best;o.under=under;return o;}
function soilSlumpOf(t){if(t.sl)return t.sl;const sl=t.sl=new Float32Array(16*16);   /* every metre of the square, from the ground below */
  for(let j=0;j<16;j++)for(let i=0;i<16;i++){const x=SOIL.X0+(t.ti*64+i*4+2)*SOIL.C,z=SOIL.X0+(t.tj*64+j*4+2)*SOIL.C;sl[j*16+i]=soilParams(x,z).slump;}return sl;}
/* the heat a cell has now, and adding some */
function soilHeat(T,k,amt){const age=SOIL.clock-T.ht[k],cur=T.ha[k]*Math.exp(-age/SOIL.TAU);if(amt>cur){T.ha[k]=Math.min(1,amt);T.ht[k]=SOIL.clock;}}
/* loop the cells inside a radius (metres) round x, z: f(T, k, dx, dz) where dx, dz are the cell centre's offset */
function soilEach(x,z,rad,f,make){const C=SOIL.C,i0=Math.max(0,Math.floor((x-rad-SOIL.X0)/C)),i1=Math.min(SOIL.N-1,Math.ceil((x+rad-SOIL.X0)/C)),
  j0=Math.max(0,Math.floor((z-rad-SOIL.X0)/C)),j1=Math.min(SOIL.N-1,Math.ceil((z+rad-SOIL.X0)/C)),touched=new Set();
  for(let j=j0;j<=j1;j++){const dz=SOIL.X0+(j+.5)*C-z;for(let i=i0;i<=i1;i++){const dx=SOIL.X0+(i+.5)*C-x;if(dx*dx+dz*dz>rad*rad)continue;
    const T=soilTile(i>>6,j>>6,make!==false);if(!T)continue;touched.add(T);f(T,((j&63)<<6)|(i&63),dx,dz);}}
  for(const T of touched)soilDirty(T);return touched;}

/* ---------- a Wraith footprint: a heel pad and three toes, pointing along the foot ----------
   (the Wraith's toes splay 0.45 m apart and reach 1 m out from the ankle: wraith_v2_combat's toe_* and heel_* empties) */
function footShape(a,b,g){
  const he=Math.hypot((a+.3)/(.46+g),b/(.4+g));let s=smooth(1,.55,he);
  for(let k=-1;k<=1;k++){const th=k*.44,ux=Math.cos(th),uy=Math.sin(th);const t=clamp(a*ux+b*uy,.05,1.05),px=a-ux*t,py=b-uy*t,d=Math.hypot(px,py)/(.19+g*.8+(1.05-t)*.06);
    s=Math.max(s,smooth(1,.45,d)*(t>1.04?smooth(1.35,1.05,a*ux+b*uy):1));}
  return s;}
const FOOT={vol:0,bw:[],bk:[],bt:[]};
function soilFoot(x,z,yaw,load){
  const P=soilParams(x,z),sink=P.sink*(load||1);const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
  let vol=0,bs=0;FOOT.bw.length=FOOT.bk.length=FOOT.bt.length=0;
  /* the print sits forward of the ankle: centre it */
  const cx=x+fx*.45,cz=z+fz*.45;
  const FS=1.3;soilEach(cx,cz,1.9*FS,(T,k,dx,dz)=>{const a=(dx*fx+dz*fz)/FS+.35,b=(dx*rx+dz*rz)/FS,s=footShape(a,b,0);
    if(s>.02){const tgt=-sink*s-.004*s;if(T.r[k]>tgt){vol+=T.r[k]-tgt;T.r[k]=tgt;}T.c[k]=Math.min(1,T.c[k]+.6*s*(P.kind==='hard'?.25:1));}
    else{const sd=footShape(a,b,.42);if(sd>.01){FOOT.bt.push(T);FOOT.bk.push(k);FOOT.bw.push(sd);bs+=sd;}}});
  if(vol>0&&bs>0){const kk=vol*P.berm/bs;for(let q=0;q<FOOT.bk.length;q++){const T=FOOT.bt[q],k=FOOT.bk[q],w=FOOT.bw[q];T.r[k]+=kk*w;T.c[k]=Math.min(1,T.c[k]+w*.35);}}
  if(P.slump>0)for(const q of new Set(FOOT.bt))soilWake(q,10);
  {const T=soilTile(Math.floor((cx-SOIL.X0)/SOIL.C)>>6,Math.floor((cz-SOIL.X0)/SOIL.C)>>6,false);if(T&&P.slump>0)soilWake(T,10);}
  SOIL.stat.prints++;return P;}
/* ---------- something passing over the ground: turned over, pocked, and (for the thermal view) warm ---------- */
function soilChurn(x,z,rad,amt,pock,heat){
  soilEach(x,z,rad,(T,k,dx,dz)=>{const w=1-(dx*dx+dz*dz)/(rad*rad);T.c[k]=Math.min(1,T.c[k]+amt*w);
    if(pock)T.r[k]+=(hash2(k+((SOIL.clock*7)|0)*131,T.ti*31+T.tj)-.55)*pock*w;if(heat)soilHeat(T,k,heat*w);});SOIL.stat.churn++;}
/* ---------- a shell: a bowl, a rim, the soil turned over and burnt, hot ---------- */
function soilCrater(x,z,R,D){
  soilEach(x,z,R*1.7,(T,k,dx,dz)=>{const d=Math.hypot(dx,dz)/R,j=hash2(k,T.ti*977+T.tj*31)-.5;
    let dh=d<1?-D*(1-d*d)*(1+.25*j):0;dh+=D*.42*Math.exp(-(((d-1.05)/.3)**2))*(1+.6*j);
    T.r[k]=Math.max(-7,T.r[k]+dh);T.c[k]=Math.min(1,T.c[k]+smooth(1.6,.6,d));soilHeat(T,k,smooth(1.5,.3,d));});
  SOIL.stat.craters++;}
/* ---------- rubble heaped up (the rift's mouth falling in) ---------- */
function soilHeap(x,z,R,H,k0){
  soilEach(x,z,R,(T,k,dx,dz)=>{const d=Math.hypot(dx,dz)/R;if(d>=1)return;const j=hash2(k*7,T.ti+T.tj*13);
    const f=Math.pow(1-d*d,1.4)*(.85+.3*j);T.r[k]+=H*f*(k0||1);T.c[k]=1;soilHeat(T,k,.35*f);});}
/* a thrown clod lands: a little more soil where it falls (Mud Lab's mlLand) */
function soilLump(x,z,v){const r=Math.max(.3,Math.cbrt(v)*1.6);soilEach(x,z,r,(T,k,dx,dz)=>{const w=1-(dx*dx+dz*dz)/(r*r);T.r[k]+=v/(r*r*1.6)*w;T.c[k]=Math.min(1,T.c[k]+.5*w);});}
/* ---------- soft soil moving by itself: slumping back into its prints (Mud Lab's mlSettle) ---------- */
/* (Mud Lab's slump is per 8 cm cell; over 25 cm cells the same rate would flatten a print ten times as fast) */
const SLUMP_K=(.08/.25)**2;
function soilSettle(dt){
  const now=SOIL.clock,L=[];for(const [T] of SOIL.act){if(L.length>=6)break;L.push(T);}
  for(const T of L){const until=SOIL.act.get(T);SOIL.act.delete(T);if(now<until)SOIL.act.set(T,until);
    const dd=Math.min(.15,now-(T.st||now-dt));T.st=now;const r=T.r,sl=soilSlumpOf(T),gi0=T.ti*64,gj0=T.tj*64;let any=false;
    for(let j=0;j<64;j++)for(let i=0;i<64;i++){const ks=Math.min(.22,dd*sl[(j>>2)*16+(i>>2)]*2*SLUMP_K);if(ks<=1e-5)continue;const k=(j<<6)|i;
      const nb=(i>0?r[k-1]:soilR(gi0+i-1,gj0+j))+(i<63?r[k+1]:soilR(gi0+i+1,gj0+j))+(j>0?r[k-64]:soilR(gi0+i,gj0+j-1))+(j<63?r[k+64]:soilR(gi0+i,gj0+j+1));
      r[k]+=(nb*.25-r[k])*ks;any=true;}
    if(any)soilDirty(T);}
}
/* ---------- to the graphics card ---------- */
const SOIL_F=new Float32Array(1),SOIL_U=new Uint32Array(SOIL_F.buffer);
function soilHalf(v){SOIL_F[0]=v;const x=SOIL_U[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
function soilMakeTex(){const N=SOIL.N;SOIL.tex=new THREE.DataTexture(new Uint16Array(N*N*4),N,N,THREE.RGBAFormat,THREE.HalfFloatType);
  SOIL.tex.minFilter=SOIL.tex.magFilter=THREE.LinearFilter;SOIL.tex.wrapS=SOIL.tex.wrapT=THREE.ClampToEdgeWrapping;SOIL.tex.generateMipmaps=false;SOIL.tex.needsUpdate=true;
  SOIL.half=new Uint16Array(64*64*4);SOIL.src=new THREE.DataTexture(SOIL.half,64,64,THREE.RGBAFormat,THREE.HalfFloatType);SOIL.src.generateMipmaps=false;SOIL.src.needsUpdate=true;
  SOIL.pos=new THREE.Vector2();return SOIL.tex;}
let soilCap=10;
function soilUpload(R){if(!SOIL.up.size)return 0;let n=0;
  for(const q of SOIL.up){if(n>=soilCap)break;SOIL.up.delete(q);const T=SOIL.tiles[q],H=SOIL.half;
    if(!T)H.fill(0);else for(let k=0;k<4096;k++){const o=k*4;H[o]=soilHalf(T.r[k]);H[o+1]=soilHalf(T.c[k]);H[o+2]=soilHalf(T.ht[k]);H[o+3]=soilHalf(T.ha[k]);}
    SOIL.pos.set((q%SOIL.NT)*64,Math.floor(q/SOIL.NT)*64);R.copyTextureToTexture(SOIL.src,SOIL.tex,null,SOIL.pos);n++;}
  return n;}
/* clear everything (the R key / the test's reset) */
function soilClear(){for(let q=0;q<SOIL.tiles.length;q++)if(SOIL.tiles[q]){SOIL.tiles[q]=null;SOIL.up.add(q);}SOIL.act.clear();SOIL.stat.tiles=0;}
