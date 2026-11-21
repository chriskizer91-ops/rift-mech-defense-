/* creatures-test/cluster.js — one dot creature in the world, many at once.
   From the viewer's buildCreature() and stepCreature() (concept/swarm-viewer.src.html), changed for the arena:
   - each creature has its own place (x,z), heading and gait instead of the viewer's scripted lunge cycle;
   - its dots are its hit points: knockDots() takes dots off (they fly away and fade), addDot() adds one (an ally it took);
   - the body shrinks as it loses dots (scale = cube root of what is left, never below 45 %).
   Dots are written into the shared dot buffer (DOTS, systems/render.js) with their trail copies. */
const HIST=5,TRAIL=[1,.42,.24,.13,.07];
const TOPK=1.5,TOPI=.42;   /* the top-down camera is 60 to 90 m away: dots drawn half again as big as in the viewer, and dimmer, so a cluster reads as dots and not as one glow */
let seedN=1;const rnd=()=>{seedN=(seedN*16807)%2147483647;return (seedN-1)/2147483646;};
const gauss=()=>{let u=0,v=0;while(u===0)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const RIG=Object.fromEntries(RIGS.map(r=>[r.id,r]));
/* how far the body reaches forward from its middle, as a share of its height (measured from the poses) */
const FRONT={knot:.5,skein:.55,runner:.6,stalker:.45,brute:.6};

function buildCluster(tier,x,z,heading){
  seedN=(tier.n*7919+11+Math.floor(Math.random()*1e6))%2147483647||1;
  const kp=tier.pose(0,{phi:0,stride:0,low:0,stretch:0,hop:0,slam:0});
  const segs=tier.seg.map(([a,b,ra,rb,w])=>{const L=kp[a].distanceTo(kp[b]);return {a,b,ra,rb,w:(L*(ra+rb)*.5+ra*ra*1.6)*w};});
  const tot=segs.reduce((s,x)=>s+x.w,0);
  const cnt=segs.map(s=>s.w/tot*tier.n);const flo=cnt.map(Math.floor);let left=tier.n-flo.reduce((a,b)=>a+b,0);
  cnt.map((c,i)=>[c-flo[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,left).forEach(([,i])=>flo[i]++);
  const P=[];
  segs.forEach((s,si)=>{for(let j=0;j<flo[si];j++){const u=flo[si]>1?(j+.2+.6*rnd())/flo[si]:.5;P.push(mkDot(si,u));}});
  /* links: consecutive dots along each segment, and segment ends that meet at a key point (the viewer's sensor lines) */
  const L=[];const bySeg=segs.map(()=>[]);P.forEach((p,i)=>bySeg[p.s].push(i));
  bySeg.forEach(a=>{a.sort((x,y)=>P[x].u-P[y].u);for(let i=1;i<a.length;i++)L.push([a[i-1],a[i]]);});
  for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){const A=segs[i],B=segs[j];const ai=bySeg[i],bi=bySeg[j];if(!ai.length||!bi.length)continue;
    const pick=(arr,seg,key)=>seg.a===key?arr[0]:arr[arr.length-1];
    for(const key of [A.a,A.b])if(key===B.a||key===B.b){L.push([pick(ai,A,key),pick(bi,B,key)]);break;}}
  if(tier.n<=10)for(let i=0;i<P.length;i++)L.push([i,(i+3)%P.length]);
  /* every dot starts at the rift, under the ground: the springs pull them up into the body (it pours up out of the rift) */
  for(const p of P){p.p.set(x+(Math.random()-.5)*2,-2-Math.random()*3,z+(Math.random()-.5)*2);for(const q of p.h)q.copy(p.p);}
  return {tier,segs,P,L,alive:P.length,n0:tier.n,x,z,yaw:heading||0,phi:Math.random()*6,scale:1,g:null,dmgAcc:0,
    r:tier.size*.42,cy:tier.size*.4,front:tier.size*(FRONT[tier.id]||.5)};
}
function mkDot(si,u){const a=rnd()*Math.PI*2,rr=.72+.28*Math.sqrt(rnd());const sph=[gauss(),gauss(),gauss()];const sl=Math.hypot(...sph)||1;
  return {s:si,u,ox:Math.cos(a)*rr,oy:Math.sin(a)*rr,sx:sph[0]/sl*rr,sy:sph[1]/sl*rr,sz:sph[2]/sl*rr,cap:0,cr:rnd(),k:70+rnd()*110,d:11+rnd()*7,
    ph:rnd()*6.283,jf:.7+rnd()*1.6,p:V(0,0,0),v:V(0,0,0),h:[V(),V(),V(),V(),V()],dead:false,ally:0};}

/* the body's size follows what is left of it */
function clusterScale(c){return Math.max(.45,Math.cbrt(c.alive/c.n0));}

/* knock n dots off, the ones nearest (hx,hz) first. They fly away from the hit and fade (DEBRIS). Returns how many came off. */
function knockDots(c,n,hx,hy,hz){let off=0;
  for(let i=0;i<n&&c.alive>0;i++){
    /* pick the nearest of a few live dots: shots chip the side they hit */
    let best=null,bd=1e9;for(let t=0;t<4;t++){const p=c.P[(Math.random()*c.P.length)|0];if(p.dead)continue;const d=(p.p.x-hx)**2+(p.p.y-hy)**2+(p.p.z-hz)**2;if(d<bd){bd=d;best=p;}}
    if(!best){best=c.P.find(p=>!p.dead);if(!best)break;}
    best.dead=true;c.alive--;off++;
    const dx=best.p.x-hx,dz=best.p.z-hz,dl=Math.hypot(dx,dz)||1,s=3+Math.random()*7;
    debris(best.p.x,best.p.y,best.p.z,dx/dl*s+(Math.random()-.5)*3,2+Math.random()*6,dz/dl*s+(Math.random()-.5)*3,best.ally?[0,0,1]:[1,0,0]);}
  c.scale=clusterScale(c);return off;}
/* one more dot: an ally it reached is part of it now */
function addDot(c,x,y,z){const si=(Math.random()*c.segs.length)|0,p=mkDot(si,Math.random());p.p.set(x,y,z);for(const q of p.h)q.copy(p.p);p.ally=1;
  c.P.push(p);c.alive++;c.n0=Math.max(c.n0,c.alive);c.scale=clusterScale(c);}

/* pose the dots for this frame: key points from the rig, placed in the world, then every dot springs toward its spot */
const _f=[];
function stepCluster(c,dt,t){
  const tier=c.tier,g=c.g,kp=tier.pose(t,g),sc=c.scale;
  const fx=-Math.sin(c.yaw),fz=-Math.cos(c.yaw),rx=fz,rz=-fx;   /* creature +z = its heading, +x = up × heading */
  const W=(v,o)=>{o.x=c.x+(v.x*rx+v.z*fx)*sc;o.y=v.y*sc;o.z=c.z+(v.x*rz+v.z*fz)*sc;return o;};
  c.segs.forEach((s,i)=>{const F=_f[i]||(_f[i]={A:V(),B:V(),d:V(),n1:V(),n2:V(),L:0});W(kp[s.a],F.A);W(kp[s.b],F.B);
    F.d.subVectors(F.B,F.A);F.L=F.d.length();if(F.L>1e-4)F.d.multiplyScalar(1/F.L);
    F.n1.set(0,1,0);if(Math.abs(F.d.y)>.9)F.n1.set(1,0,0);F.n1.crossVectors(F.n1,F.d).normalize();F.n2.crossVectors(F.d,F.n1);F.ra=s.ra*sc;F.rb=s.rb*sc;});
  const jit=.16*(1+(g.thrash||0)*2.2)*Math.max(.5,tier.size/4)*sc;
  const sub=Math.max(1,Math.ceil(dt/(1/90))),h=dt/sub;
  for(const p of c.P){if(p.dead)continue;const f=_f[p.s];let tx,ty,tz;
    if(f.L<1e-4){const r=f.ra;tx=f.A.x+p.sx*r;ty=f.A.y+p.sy*r;tz=f.A.z+p.sz*r;}
    else{const r=lerp(f.ra,f.rb,p.u),along=f.L*p.u;
      tx=f.A.x+f.d.x*along+(f.n1.x*p.ox+f.n2.x*p.oy)*r;ty=f.A.y+f.d.y*along+(f.n1.y*p.ox+f.n2.y*p.oy)*r;tz=f.A.z+f.d.z*along+(f.n1.z*p.ox+f.n2.z*p.oy)*r;}
    const w=t*p.jf*5.5+p.ph;tx+=Math.sin(w)*jit;ty+=Math.sin(w*1.31+1.7)*jit*.7;tz+=Math.cos(w*.87)*jit;
    for(let s=0;s<sub;s++){p.v.x+=((tx-p.p.x)*p.k-p.v.x*p.d)*h;p.v.y+=((ty-p.p.y)*p.k-p.v.y*p.d)*h;p.v.z+=((tz-p.p.z)*p.k-p.v.z*p.d)*h;
      p.p.x+=p.v.x*h;p.p.y+=p.v.y*h;p.p.z+=p.v.z*h;}}
}
/* write the dots (and their trails, and the sensor lines between them) into the shared buffers */
function drawCluster(c,thermal,gain){
  const tier=c.tier,I=(tier.gain||1)*gain*(thermal?.07*Math.pow(Math.min(1,500/tier.n),.33):TOPI),sz=tier.dot*TOPK*(thermal?4.2:1)*Math.max(.7,c.scale);
  for(const p of c.P){if(p.dead)continue;for(let k=HIST-1;k>0;k--)p.h[k].copy(p.h[k-1]);p.h[0].copy(p.p);
    if(thermal)DOTS.put(p.p.x,p.p.y,p.p.z,1,0,0,I,sz);
    else for(let k=0;k<HIST;k++)DOTS.put(p.h[k].x,p.h[k].y,p.h[k].z,1,0,0,I*TRAIL[k],sz);}
  if(thermal)return;
  const li=.55*gain,mx=tier.size*.45*c.scale;
  for(const [a,b] of c.L){const pa=c.P[a],pb=c.P[b];if(!pa||!pb||pa.dead||pb.dead)continue;const d=pa.p.distanceTo(pb.p);const k=li*clamp(1.4-d/mx,0,1);if(k>0)DOTS.line(pa.p,pb.p,k);}
}
