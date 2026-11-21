'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: THE COAST (game/world/wt-map.js)
   A made-up stretch of coast, 320 m square. x runs east, z runs south, y is up; the sea is to the north (-z) and the
   camera looks out to it. Sea level is y = 0. Earth-like, no real place.
     the beach      sand from the waterline up to a paved seafront, about 24 m
     the town       streets and blocks behind it on a low plateau (1.9 m)
     Harbour Street runs down to the beach; its foot has sunk and is flooded, 0.9 m deep
     the drowned    the west end of town slumped 1.3 m when the cracks opened: streets and blocks standing in the sea
       quarter
     the shelf      shallow water out to about 50 m (up to 2.5 m deep: the Wraith wades it), then a drop to 10 m
     the cracks     magma glowing in trenches on the sea floor: one along the drop-off, one far out
     the bluff      a headland 11 m high on the east side. The rift opens in its south face
   Everything about the ground that never changes is worked out here once, at load, every 50 cm: height, where the
   cracks glow, how wet it is, and what it's made of (sand, mud, asphalt, paving; the rest is dirt, steep ground rock).
   ===================================================================================================================== */
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const damp=(rate,dt)=>1-Math.exp(-rate*dt);
const angD=(a,b)=>{let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
function hash2(i,j){let h=(Math.imul(i,374761393)+Math.imul(j,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  const a=hash2(i,j),b=hash2(i+1,j),c=hash2(i,j+1),d=hash2(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,z,o){let s=0,a=.5,f=1;for(let k=0;k<(o||4);k++){s+=a*vnoise(x*f+k*17.3,z*f-k*9.1);f*=2.03;a*=.5;}return s;}
let RS=20261120;const rnd=()=>{RS=(Math.imul(RS,1664525)+1013904223)|0;return (RS>>>8)/16777216;};

const MAP={S:320,X0:-160,C:.5,N:641,hB:null,crk:null,wet:null,spl:null};
/* the waterline: z of the shore at x (wavy) */
const coastZ=x=>-6+5*Math.sin(x*.021+.4)+2.5*Math.sin(x*.067+1.3);
/* the rift: a cave mouth in the bluff's south face. x, the floor's height, its half width and its height; the face
   lies between z0 and z1 */
const MOUTH={x:108,y:1.3,w:6.2,h:7.6,z0:7,z1:15.5,zf:12.5};
/* where the Wraith starts: on the beach, facing the sea */
const SPAWN={x:-6,z:9,yaw:0};
/* streets (asphalt) and the seafront (paving): [x0, x1, z0, z1] */
const STREETS=[[-160,160,44,54],[-46,-36,-12,160],[14,24,22,160],[-110,-100,-14,160],[60,68,22,160]];
const PAVED=[[-160,160,18,26]];
/* blocks of buildings: [x0, x1, z0, z1] (lots are cut from them below) */
const BLOCKS=[[-58,-48,28,42],[-34,12,28,42],[26,58,28,42],[70,88,28,42],[128,150,28,42],
  [-58,-48,56,150],[-34,12,56,150],[26,58,56,150],[70,150,56,150],
  [-152,-113,6,42],[-97,-66,6,42],[-152,-113,56,104],[-97,-66,56,104]];
const BUILD=[],WRECKS=[];

/* the bluff: a rounded box, its edge roughened (signed distance: minus inside) */
function bluffSD(x,z){const cx=124,cz=-29,hx=52,hz=41,r=10;const qx=Math.abs(x-cx)-hx+r,qz=Math.abs(z-cz)-hz+r;
  let d=Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-r;
  const calm=smooth(22,10,Math.abs(x-MOUTH.x))*smooth(-6,4,z);   /* the face round the mouth is cleaner */
  return d+(fbm(x*.06,z*.06,3)-.5)*7*(1-.75*calm);}
function inRect(x,z,R,m){return x>R[0]-m&&x<R[1]+m&&z>R[2]-m&&z<R[3]+m;}
function rectW(x,z,R,e){return smooth(R[0]-e,R[0]+e,x)*smooth(R[1]+e,R[1]-e,x)*smooth(R[2]-e,R[2]+e,z)*smooth(R[3]+e,R[3]-e,z);}

/* the ground at one point, as made: height, crack glow, wetness, what it's made of */
const G0={h:0,crk:0,wet:0,sand:0,mud:0,asph:0,pave:0};
function ground0(x,z){
  const o=G0;const zc=coastZ(x),s=zc-z;   /* s: metres out to sea from the waterline (minus: inland) */
  let h,sand=0,mud=0,asph=0,pave=0,crk=0;
  if(s<0){const l=-s;h=1.9*(1-Math.exp(-l/16))+.12*(fbm(x*.05,z*.05)-.5)*smooth(0,20,l);sand=1-smooth(24,30,l);}
  else{let dep=2.6*(1-Math.exp(-s/30))+7.6*smooth(46,78,s)+(fbm(x*.04,z*.04)-.5)*.8*smooth(4,20,s);
    h=-dep;sand=1-smooth(30,70,s);mud=1-sand;}
  /* sand ripples and a few muddy patches by the waterline */
  if(Math.abs(s)<14){const p=smooth(.62,.75,fbm(x*.09+3,z*.09));mud=Math.max(mud,p*smooth(14,6,Math.abs(s)));}
  /* the town's plateau, streets and seafront */
  const l=-s;
  if(l>24){const t=smooth(24,34,l);h=lerp(h,1.9+.1*(fbm(x*.03,z*.03)-.5),t);sand*=1-t;}
  let st=0;for(const R of STREETS)st=Math.max(st,rectW(x,z,R,.4));
  let pv=0;for(const R of PAVED)pv=Math.max(pv,rectW(x,z,R,.4));
  if(l>22){for(const R of BLOCKS)pv=Math.max(pv,rectW(x,z,R,.4)*.9);}
  if(l>0){asph=st*smooth(16,22,l);pave=Math.max(0,pv-asph)*smooth(14,18,l);if(st>0&&l>20)h-=.07*st;}
  /* Harbour Street's foot has sunk: flooded from the beach to z 40 */
  {const w=smooth(-47.5,-45,x)*smooth(-34.5,-37,x),f=w*smooth(44,38,z);if(f>0){h=lerp(h,Math.min(h,-.9+.12*(fbm(x*.3,z*.3)-.5)),f);mud=Math.max(mud,f*.6);}}
  /* the drowned quarter: the west of town slumped 1.3 m */
  {const m=smooth(-55,-68,x)*smooth(114,98,z)*smooth(-2,8,l);if(m>0){h=lerp(h,-1.3+.25*(fbm(x*.08,z*.08)-.5),m);mud=Math.max(mud,m*(1-asph)*.85);}}
  /* the cracks: trenches in the sea floor with magma in them */
  if(s>20){
    const c1=97+7*Math.sin(x*.037)+3*Math.sin(x*.11),d1=Math.abs(s-c1);
    const t2=(x+96)/128,c2=38+34*t2+4*Math.sin(x*.09),d2=Math.abs(s-c2),on2=smooth(-.05,.08,t2)*smooth(1.05,.9,t2);
    const tr=Math.exp(-((d1/2.4)**2))+Math.exp(-((d2/2.1)**2))*on2;h-=3.2*tr;
    const k1=Math.exp(-((d1/1.1)**2))*(.45+.55*smooth(.35,.7,fbm(x*.06,1.7))),k2=Math.exp(-((d2/1.)**2))*on2*(.4+.6*smooth(.3,.62,fbm(x*.07,5.3)));
    crk=Math.min(1,k1+k2);}
  /* the bluff and the rift's apron in front of its mouth */
  {const sd=bluffSD(x,z);const top=11+2.2*(fbm(x*.04,z*.04)-.5);const fb=smooth(2.6,-3.2,sd),hb=lerp(h,top,fb);
    if(fb>0&&hb>h){const k=smooth(0,1.5,hb-h);h=hb;sand*=1-k;mud*=1-k;asph*=1-k;pave*=1-k;}
    const ap=smooth(MOUTH.w+9,MOUTH.w+2,Math.abs(x-MOUTH.x))*smooth(MOUTH.zf-1,MOUTH.zf+1.5,z)*smooth(30,22,z);
    if(ap>0){h=lerp(h,1.55+.12*(fbm(x*.2,z*.2)-.5),ap);asph*=1-ap;pave*=1-ap;sand*=1-ap;}}
  o.h=h;o.crk=crk;o.wet=s>=0?1:smooth(.95,.06,h);o.sand=sand;o.mud=mud;o.asph=asph;o.pave=pave;
  return o;}

function buildMap(){
  const N=MAP.N,C=MAP.C,X0=MAP.X0;MAP.hB=new Float32Array(N*N);MAP.crk=new Float32Array(N*N);MAP.wet=new Float32Array(N*N);MAP.spl=new Uint8Array(N*N*4);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,g=ground0(X0+i*C,X0+j*C);MAP.hB[k]=g.h;MAP.crk[k]=g.crk;MAP.wet[k]=g.wet;
    const q=k*4;MAP.spl[q]=Math.round(clamp(g.sand,0,1)*255);MAP.spl[q+1]=Math.round(clamp(g.mud,0,1)*255);MAP.spl[q+2]=Math.round(clamp(g.asph,0,1)*255);MAP.spl[q+3]=Math.round(clamp(g.pave,0,1)*255);}
  /* buildings: each block cut into lots along its long side, a few metres between */
  RS=7;
  for(const B of BLOCKS){const along=B[1]-B[0]>=B[3]-B[2];const L=along?B[1]-B[0]:B[3]-B[2];const n=Math.max(1,Math.round(L/(16+rnd()*10)));
    let a=0;for(let q=0;q<n;q++){const len=L/n,g=1.5+rnd()*2.5;const a0=a+g*.5,a1=a+len-g*.5;a+=len;
      const r=along?[B[0]+a0,B[0]+a1,B[2]+1+rnd()*1.5,B[3]-1-rnd()*1.5]:[B[0]+1+rnd()*1.5,B[1]-1-rnd()*1.5,B[2]+a0,B[2]+a1];
      if(r[1]-r[0]<5||r[3]-r[2]<5)continue;
      const cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2;let gmin=99;for(const [x,z] of [[r[0],r[2]],[r[1],r[2]],[r[0],r[3]],[r[1],r[3]],[cx,cz]])gmin=Math.min(gmin,baseH(x,z));
      const sunk=gmin<0,ht=(sunk?6:8)+rnd()*(sunk?9:14);
      BUILD.push({x0:r[0],x1:r[1],z0:r[2],z1:r[3],y0:gmin-2,y1:gmin+ht,kind:rnd()<.55?1:2,ruin:sunk&&rnd()<.4});}}
  /* wrecks: what a swarm leaves of a car, a truck, a crane cab (grey lumps) */
  for(const [x,z,s] of [[-22,14,1],[8,20,1.2],[-41,24,1],[-41,34,1.4],[19,60,1],[30,49,1.6],[-78,50,1.2],[-105,30,1],[-92,48,1.3],[64,36,1.1],[96,26,1.3],[118,30,1],[38,16,.9],[-60,12,1.1]])
    WRECKS.push({x,z,s,y:baseH(x,z)});
}
/* the ground as made, between the 50 cm points */
function baseH(x,z){const N=MAP.N,C=MAP.C,fx=clamp((x-MAP.X0)/C,0,N-1.001),fz=clamp((z-MAP.X0)/C,0,N-1.001),i=fx|0,j=fz|0,ax=fx-i,az=fz-j,k=j*N+i,a=MAP.hB;
  return a[k]+(a[k+1]-a[k])*ax+(a[k+N]-a[k])*az+(a[k]-a[k+1]-a[k+N]+a[k+N+1])*ax*az;}
/* what the ground is made of at a point (nearest 50 cm point) */
function baseKind(x,z,o){const N=MAP.N,i=clamp(Math.round((x-MAP.X0)/MAP.C),0,N-1),j=clamp(Math.round((z-MAP.X0)/MAP.C),0,N-1),k=j*N+i,q=k*4,S=MAP.spl;
  o.sand=S[q]/255;o.mud=S[q+1]/255;o.asph=S[q+2]/255;o.pave=S[q+3]/255;o.wet=MAP.wet[k];o.h=MAP.hB[k];
  const gx=(baseH(x+.6,z)-baseH(x-.6,z))/1.2,gz=(baseH(x,z+.6)-baseH(x,z-.6))/1.2;o.slope=Math.hypot(gx,gz);return o;}
/* inside a building? returns the building or null (m: margin) */
function buildingAt(x,z,m){for(const b of BUILD)if(x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m)return b;return null;}
