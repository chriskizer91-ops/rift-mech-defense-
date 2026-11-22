'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · FIELD 1: THE FIRST COMBAT MAP (game/world/wt-fields.js)
   Big open fields (decided, 20 Nov): 1,792 m square of rolling farmland the swarms come across. Earth-like, no real
   place. x runs east, z south, y up (metres); the middle of the map is 0, 0.
     the fields      a patchwork, 120 to 220 m each: meadow, ploughed earth, wheat; tree lines (hedgerows) between them
     the woods       groves on the higher ground
     the river       Mill River, north to south down the west half, in its flat valley (the Bottoms). Laid out as Mud Lab's
                     River is (borrowed/mud-lab/src/ml-world.js mlRiver): it swings side to side; a deep pool under a cut
                     bank on the outside of each bend (deeper than the Wraith's hips), a sand bar on the inside, a shallow
                     riffle between bends where the Wraith can wade across
     the flood       the Sunk Meadows, east of the river: low ground that went under when the cracks opened, knee to hip
                     deep, a magma crack glowing in its floor
     the tracks      farm tracks between the fields, a gravel road across the map, the farm in the middle
     three rifts     cave mouths in scarps of rock: the North Scarp, the West Scarp, the South Scarp
   From Mud Lab's world generator: the river's line through waypoints (each with its width, its riffle and pool depths,
   its cut bank and its bars, eased between them), how bent it is at every point, the quick nearest-line lookup in
   buckets, the valley's flat floor, knolls on the rolling hills, trees on a jittered grid by how wooded the spot is.
   The ground is kept every 2 m (the soil's 25 cm detail lives only round the Wraith: wt-soil.js).
   For other sessions: heightAt(x,z) and depthAt(x,z) (wt-main.js puts them on window.RMD.World).
   ===================================================================================================================== */
(function(){
const S=1792,X0=-896;
/* a line through waypoints, a point every `step` m (Catmull-Rom), each waypoint's numbers eased between; last, how it
   bends there (Mud Lab's mlRiver) */
function line(P,step){const o=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3),q=[f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])],e=t2*(3-2*t);
      for(let c=2;c<p1.length;c++)q.push(p1[c]+(p2[c]-p1[c])*e);o.push(q);}}
  o.push(P[P.length-1].slice());
  const n=o.length,K=new Float64Array(n),Ln=new Float64Array(n);
  for(let i=1;i<n;i++)Ln[i]=Ln[i-1]+Math.hypot(o[i][0]-o[i-1][0],o[i][1]-o[i-1][1]);
  for(let i=1;i<n-1;i++){const a=o[i-1],b=o[i],c=o[i+1],ax=b[0]-a[0],az=b[1]-a[1],bx=c[0]-b[0],bz=c[1]-b[1],la=Math.hypot(ax,az)||1,lb=Math.hypot(bx,bz)||1;K[i]=(ax*bz-az*bx)/(la*lb)/((la+lb)/2);}
  for(let i=0;i<n;i++){let q=0,w=0;for(let d=-7;d<=7;d++){const j=i+d;if(j<1||j>=n-1)continue;const g=1-Math.abs(d)/8;q+=K[j]*g;w+=g;}o[i].k=w?q/w:0;o[i].s=Ln[i];}
  o.len=Ln[n-1];return o;}
/* nearest-line lookups: each line's segments in 32 m buckets (Mud Lab's ML_IDX and mlNear) */
const BK=32,BN=Math.ceil(S/BK)+2;
function index(lines,pad){const M=new Map();lines.forEach((P,ln)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];
  const i0=Math.max(0,Math.floor((Math.min(a[0],b[0])-pad-X0)/BK)),i1=Math.min(BN-1,Math.floor((Math.max(a[0],b[0])+pad-X0)/BK)),j0=Math.max(0,Math.floor((Math.min(a[1],b[1])-pad-X0)/BK)),j1=Math.min(BN-1,Math.floor((Math.max(a[1],b[1])+pad-X0)/BK));
  for(let j=j0;j<=j1;j++)for(let q=i0;q<=i1;q++){const key=j*BN+q;let L=M.get(key);if(!L)M.set(key,L=[]);L.push(ln,i);}}});return M;}
function near(M,lines,u,v,o){o.d=1e9;o.n=-1;const L=M.get(Math.floor((v-X0)/BK)*BN+Math.floor((u-X0)/BK));if(!L)return o;
  for(let q=0;q<L.length;q+=2){const n=L[q],i=L[q+1],P=lines[n],a=P[i],b=P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],ll=ex*ex+ez*ez||1;let f=((u-a[0])*ex+(v-a[1])*ez)/ll;f=f<0?0:f>1?1:f;
    const dx=u-a[0]-ex*f,dz=v-a[1]-ez*f,d=dx*dx+dz*dz;if(d<o.d){o.d=d;o.n=n;o.i=i;o.f=f;o.side=ex*dz-ez*dx<0?-1:1;}}
  o.d=Math.sqrt(o.d);return o;}

/* MILL RIVER, north to south.            x     z   hw   riffle pool cut  bars */
const RIVER=[line([[-300,-990,16,.9,3.6,2.4,0],[-250,-760,17,.8,3.8,2.6,0],[-390,-560,18,.7,3.9,2.8,.2],[-300,-360,20,.55,3.8,2.6,.3],
  [-150,-230,24,.5,3.6,2.2,.5],[-215,-40,26,.45,3.4,2.,.6],[-350,110,26,.5,3.6,2.4,.4],[-300,320,24,.6,3.8,2.6,.3],
  [-150,450,22,.7,3.9,2.8,.2],[-190,650,20,.8,3.9,2.8,0],[-330,790,18,.9,3.8,2.4,0],[-280,990,18,.9,3.6,2.4,0]],8)];
const RV=index(RIVER,190);const RLV=(s)=>10.5-s*.0028;   /* its surface falls 2.8 m a kilometre, north to south */
/* the tracks (4 m) and the gravel road (6 m) */
const TRACKS=[line([[-896,120,6],[-600,90,6],[-350,40,6],[-210,10,6],[0,30,6],[200,60,6],[420,20,6],[640,60,6],[896,40,6]],10),   /* the road */
  line([[0,30,4],[30,-180,4],[10,-420,4],[60,-620,4],[150,-760,4]],10),line([[0,30,4],[-40,240,4],[30,460,4],[140,640,4],[200,720,4]],10),
  line([[200,60,4],[330,-120,4],[430,-280,4]],10),line([[420,20,4],[560,200,4],[620,420,4]],10),line([[-350,40,4],[-560,-160,4],[-620,-420,4]],10),
  line([[-40,240,4],[-460,300,4],[-640,280,4]],10)];
const TK=index(TRACKS,30);
/* the farm in the middle: a yard, a house, two barns, a shed */
const FARM={x:60,z:110,r:46};
/* knolls on the rolling ground: x, z, how wide, how high */
const KNOLLS=[[420,-380,140,9],[-620,260,120,8],[180,640,130,10],[560,560,160,12],[-560,-560,170,11],[700,-660,150,10],[-700,700,140,9],[260,-120,90,5]];
/* the Sunk Meadows: an oval of low ground east of the river; its water stands at FLOOD.wl */
const FLOOD={x:330,z:330,a:170,b:105,r:.35,wl:0};
/* the rift mouths: each in the face of a scarp; the face looks along (sin yaw, cos yaw): yaw 0 faces south */
const MOUTHS=[{name:'North Scarp',x:380,z:-430,yaw:-.5},{name:'West Scarp',x:-600,z:300,yaw:.6},{name:'South Scarp',x:220,z:690,yaw:.15}];
for(const M of MOUTHS){Object.assign(M,{w:6.4,h:8,s0:-5.5,s1:1.4,zf:M.z});M.nx=Math.sin(M.yaw);M.nz=Math.cos(M.yaw);}
/* the rolling hills (Mud Lab's mlHills shape at this size) and the knolls */
function hills(x,z){let y=9+15*fbm(x/460+3.1,z/460-1.7,3)+4*fbm(x/130,z/130,2)+1.2*fbm(x/40,z/40,2);
  for(const K of KNOLLS){const dx=x-K[0],dz=z-K[1],q=(dx*dx+dz*dz)/(K[2]*K[2]);if(q<7)y+=K[3]*Math.exp(-q);}return y;}
/* the patchwork: fields on a jittered grid, 170 m apart; the nearest and next-nearest field centres */
const FC=170;const FQ={a:0,b:0,i:0,j:0,t:0};
function fieldAt(x,z,o){let d1=1e9,d2=1e9,bi=0,bj=0;const ci=Math.floor(x/FC),cj=Math.floor(z/FC);
  for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){const px=(i+.2+.6*hash2(i,j*7+1))*FC,pz=(j+.2+.6*hash2(i*5+3,j))*FC,d=Math.hypot(x-px,z-pz);
    if(d<d1){d2=d1;d1=d;bi=i;bj=j;}else if(d<d2)d2=d;}
  o.edge=(d2-d1)*.5;o.i=bi;o.j=bj;const h=hash2(bi*13+7,bj*17+3);o.t=h<.42?0:h<.72?1:2;return o;}   /* 0 meadow, 1 ploughed, 2 wheat */
const RQ={},TQ={},F0={};
function ground0(x,z){
  const o=G0;let h=hills(x,z),wl=h-6,sand=0,mud=0,asph=0,pave=0,meadow=0,plough=0,wheat=0,crk=0,wood=0;
  const n1=vnoise(x/9,z/9)-.5,n2=vnoise(x/37,z/37)-.5;
  /* THE RIVER: its valley floor, then its bed, its banks, its bars (Mud Lab 19's River) */
  let bot=0;near(RV,RIVER,x,z,RQ);
  if(RQ.n>=0){const P=RIVER[RQ.n],a=P[RQ.i],b=P[RQ.i+1],f=RQ.f,L=(c)=>a[c]+(b[c]-a[c])*f;let hw=L(2);const dr=L(3),dp=L(4),cut=L(5),bars=L(6),k=a.k+(b.k-a.k)*f,s=a.s+(b.s-a.s)*f;
    hw*=1+.14*(vnoise(s/70,3)-.5);const lv=RLV(s),floor=lv+.7;
    const vb=150+60*vnoise(x/240,z/240);bot=smooth(vb+90,vb,RQ.d+n2*30);h=h*(1-bot)+(floor+.25*n1)*bot;
    const xr=RQ.side*RQ.d/hw,ax=Math.abs(xr),am=Math.min(1,Math.abs(k)*170),so=k>0?-1:1,xin=-xr*so;
    if(RQ.d<hw+60){wl=lv;}
    if(ax<1){let dep=dr*smooth(1,.74,ax)*(1-.8*am*smooth(-.3,.8,xin));
      /* the pool under the outside bank */
      dep+=(dp-dr)*am*smooth(-.2,.7,-xin)*smooth(1.05,.6,ax);
      h=Math.min(h,lv-dep+.06*n1);mud+=.3*smooth(.2,.9,am);sand=Math.max(sand,smooth(.2,-.5,xin)*Math.max(am,bars)*smooth(1,.6,ax));}
    else{const dOut=RQ.d-hw,outer=xin<0;
      if(outer){h=Math.min(h,lv+.05+.5*smooth(0,2,dOut))+cut*am*smooth(0,3,dOut)*smooth(60,14,dOut);wood=Math.max(wood,am*.8*smooth(4,8,dOut)*smooth(40,20,dOut));}
      else{if(dOut<12)h=Math.min(h,lv+.05+.5*smooth(0,12,dOut));sand=Math.max(sand,smooth(16,3,dOut)*(.45+.55*Math.max(am,bars)));}
      if(dOut<2)mud=Math.max(mud,.5);}}
  /* THE SUNK MEADOWS: low ground gone under; a crack in its floor */
  if(!FLOOD.wl){const F=FLOOD,cs=Math.cos(F.r),sn=Math.sin(F.r);let m=1e9;for(let i=0;i<32;i++){const a=i/32*TAU,u=Math.cos(a)*F.a*1.3,v=Math.sin(a)*F.b*1.3;m=Math.min(m,hills(F.x+u*cs-v*sn,F.z+u*sn+v*cs));}F.wl=m-.5;}   /* the water stands just under the lowest of its rim */
  {const F=FLOOD,cs=Math.cos(F.r),sn=Math.sin(F.r),dx=x-F.x,dz=z-F.z,a=(dx*cs+dz*sn)/F.a,b=(-dx*sn+dz*cs)/F.b,r=Math.hypot(a,b)*(1+.18*(vnoise(x/60,z/60)-.5));
    if(r<1.6){const k=smooth(1.6,.85,r),fl=F.wl-.2-1.3*smooth(1,.1,r)+.35*n2;h=h*(1-k)+Math.min(h,fl)*k;if(r<1.35)wl=Math.max(wl,F.wl);mud=Math.max(mud,smooth(1.3,1,r));
      const cl=Math.abs(b+.25*Math.sin(a*5)+.12*Math.sin(a*13))*F.b;if(r<.95){const tr=Math.exp(-((cl/4)**2));h-=1.4*tr;crk=Math.exp(-((cl/2.6)**2))*smooth(.95,.6,r)*(.5+.5*smooth(.3,.7,vnoise(a*6,1.3)));}}}
  /* THE RIFTS: a scarp of rock behind each mouth, a flat apron in front */
  for(const M of MOUTHS){const dx=x-M.x,dz=z-M.z,w=dx*M.nx+dz*M.nz,u=dx*M.nz-dz*M.nx;if(Math.abs(u)>90||w<-90||w>60)continue;
    const base=M.base||(M.base=hills(M.x,M.z)),top=base+13+2*(vnoise(u/14,w/14)-.5);
    const across=smooth(48,30,Math.abs(u)+6*n2),back=smooth(-70,-50,w+8*n2),nearM=smooth(16,9,Math.abs(u)),face=smooth(lerp(3,.8,nearM),lerp(-3.5+.8*n1,-1.6,nearM),w);
    const sc=across*back*face;if(sc>0){const hs=lerp(h,top,sc);if(hs>h){h=hs;sand*=1-sc;mud*=1-sc;}}
    const ap=smooth(M.w+10,M.w+3,Math.abs(u))*smooth(-1,2,w)*smooth(30,20,w);if(ap>0)h=lerp(h,base+.1*n1,ap);
    M.y=base-.15;}
  /* THE FIELDS: what each grows, the verges and tree lines between them */
  fieldAt(x,z,F0);const crop=1-bot*.9;
  const edge=smooth(1.5,4,F0.edge);
  meadow=F0.t===0?1:0;plough=F0.t===1?edge:0;wheat=F0.t===2?edge:0;meadow=Math.max(meadow,1-edge);
  meadow*=crop;plough*=crop;wheat*=crop;
  /* the tracks and the road */
  near(TK,TRACKS,x,z,TQ);if(TQ.n>=0){const hw=TQ.n===0?3.2:2.1,t=smooth(hw+1.2,hw-.3,TQ.d);if(t>0){asph=Math.max(asph,t*(TQ.n===0?0:1));pave=Math.max(pave,TQ.n===0?t:0);
    const P=TRACKS[TQ.n],a=P[TQ.i],b=P[TQ.i+1];const hl=hills(a[0]+(b[0]-a[0])*TQ.f,a[1]+(b[1]-a[1])*TQ.f);if(bot<.5)h=lerp(h,Math.min(h,hl)-.08,t*.6);}}
  /* the farm yard */
  {const d=Math.hypot(x-FARM.x,z-FARM.z);if(d<FARM.r){const k=smooth(FARM.r,FARM.r-8,d);pave=Math.max(pave,k*.85);h=lerp(h,hills(FARM.x,FARM.z),k*.8);}}
  const free=1-Math.max(asph,pave)-sand-mud;if(free<1){const k=Math.max(0,free);meadow*=k;plough*=k;wheat*=k;}
  o.h=h;o.crk=crk;o.wl=wl;o.wet=wl>h-.6?smooth(1.2,.1,h-wl):0;o.sand=sand;o.mud=Math.min(1,mud);o.asph=asph;o.pave=pave;o.meadow=meadow;o.plough=plough;o.wheat=wheat;o.x4=0;
  return o;}
/* trees: the tree lines along the field edges, groves on the high ground, the cut banks of the river */
const TREES=[];
function setup(){
  const add=(x,z,kind,s)=>TREES.push({x,z,y:baseH(x,z),kind,s,r:hash2(Math.round(x*3),Math.round(z*7))*TAU});
  const Fq={},Rq={},Tq={};
  for(let z=X0+12;z<X0+S-12;z+=6.5)for(let x=X0+12;x<X0+S-12;x+=6.5){
    const jx=x+(hash2(Math.round(x),Math.round(z))-.5)*5,jz=z+(hash2(Math.round(z),Math.round(x)+9)-.5)*5;
    const g=ground0(jx,jz);if(g.wl>g.h-.2||g.asph>.05||g.pave>.05||g.sand>.3)continue;
    let hasT=false;for(const M of MOUTHS){if(Math.hypot(jx-M.x,jz-M.z)<70){hasT=true;break;}}if(hasT)continue;
    if(Math.hypot(jx-FARM.x,jz-FARM.z)<FARM.r+6)continue;
    near(TK,TRACKS,jx,jz,Tq);if(Tq.d<6)continue;
    fieldAt(jx,jz,Fq);const hedge=Fq.edge<2.6&&hash2(Fq.i*3+Math.round(jx/40),Fq.j*5+Math.round(jz/40))>.28;   /* gaps in the tree lines */
    const grove=smooth(.64,.72,fbm(jx/190+5,jz/190,3))*smooth(12,20,g.h);
    near(RV,RIVER,jx,jz,Rq);const bank=Rq.n>=0&&Rq.d>RIVER[Rq.n][Rq.i][2]+4&&Rq.d<RIVER[Rq.n][Rq.i][2]+26?.35:0;
    const p=hash2(Math.round(jx*3),Math.round(jz*3));
    if(hedge&&p<.82||p<grove*.9||p<bank)add(jx,jz,hedge?0:p<.5?1:0,.75+.6*hash2(Math.round(jx*2),Math.round(jz*2)));}
  /* the farm's buildings */
  const B=(x0,z0,w,d,ht,kind)=>{const y=baseH(x0+w/2,z0+d/2);BUILD.push({x0,x1:x0+w,z0,z1:z0+d,y0:y-2,y1:y+ht,kind});};
  B(FARM.x-30,FARM.z-26,22,14,9,3);B(FARM.x+6,FARM.z-30,18,26,11,3);B(FARM.x-22,FARM.z+8,14,10,7,1);B(FARM.x+14,FARM.z+12,10,8,5,2);
  /* wrecks: tractors, trucks, a combine (grey lumps) */
  RS=41;for(let i=0;i<22;i++){const T=TRACKS[1+Math.floor(rnd()*(TRACKS.length-1))],q=T[Math.floor(rnd()*T.length)];const x=q[0]+(rnd()-.5)*14,z=q[1]+(rnd()-.5)*14;WRECKS.push({x,z,s:.9+rnd()*.8,y:baseH(x,z)});}
  /* boulders at the scarps' feet */
  for(const M of MOUTHS)for(let i=0;i<10;i++){const u=(rnd()-.5)*80,w=2+rnd()*6;if(Math.abs(u)<14)continue;const x=M.x+u*M.nz+w*M.nx,z=M.z-u*M.nx+w*M.nz;ROCKS.push({x,z,r:1.2+rnd()*2.4});}
}
/* the swarm's routes: out of a rift, across the fields toward the farm (they turn on the Wraith when it's close) */
function route(c,rift){const M=rift||MOUTHS[Math.floor(rnd()*MOUTHS.length)];const p=[{x:M.x-M.nx*12,z:M.z-M.nz*12},{x:M.x+M.nx*14+(rnd()-.5)*6,z:M.z+M.nz*14+(rnd()-.5)*6}];
  const tx=FARM.x+(rnd()-.5)*160,tz=FARM.z+(rnd()-.5)*160;for(let k=1;k<=4;k++){const f=k/4,ox=(rnd()-.5)*90*(1-f);p.push({x:lerp(p[1].x,tx,f)+ox,z:lerp(p[1].z,tz,f)+(rnd()-.5)*90*(1-f)});}return p;}
/* for other maps: the line, the nearest-line lookup and the patchwork of fields */
MAPS.lib={line,index,near,fieldAt};
MAPS.fields={S,X0,C:2,ground0,setup,SPAWN:{x:330,z:-330,yaw:-.46},MOUTHS,name:'Field 1',RIVER,TRACKS,FLOOD,FARM,TREES,route,
  tex:{sand:'sand',mud:'mud',dirt:'dirt',asph:'track',pave:'gravel',rock:'rock',meadow:'meadow',plough:'plough',wheat:'wheat'},fog:[260,900],
  swarm:{sea:false}};
})();
