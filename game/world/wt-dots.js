'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: A SWARM CROSSING (game/world/wt-dots.js)
   About four hundred red dots: twenty KNOTs (10 dots), six SKEINs (20) and two RUNNERs (50), the threat library's
   names and counts. They walk up out of the sea onto the beach and into the streets, and out of the rift's mouth while
   it is open. Each creature is a cluster of dots that boils as it moves (its look is the library's; its rig here is
   only a body, since session A owns the creatures).
   On the SENSOR and THERMAL views they are drawn as dots. In the REAL view they are not drawn at all; you see where
   they pass: the ground turned over and pocked, a puff of sand, rings in shallow water. That churn is warm for a
   while (the thermal view shows their trails).
   Near the Wraith they break the sensor up (the library's interference and dropped frames).
   ===================================================================================================================== */
const DTYPES={knot:{n:10,rx:.72,ry:.55,rz:.72,lift:1.05,speed:4.4,dot:.42,legs:0},
  skein:{n:20,rx:.42,ry:.28,rz:1.25,lift:.55,speed:3.1,dot:.34,legs:6},
  runner:{n:50,rx:.62,ry:.55,rz:1.7,lift:1.35,speed:6.2,dot:.27,legs:4}};
const SWARM={C:[],N:0,pos:null,col:null,ii:null,ss:null,pts:null,near:0,shown:0,
  STREETS:[-105,-41,19,64]};
function swarmInit(scene){
  RS=1234;const C=SWARM.C;
  const mk=(type,src)=>{const T=DTYPES[type],d=[];
    for(let i=0;i<T.n;i++){const g=()=>{let u=0;while(u===0)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*rnd());};
      const v=[g(),g(),g()],l=Math.hypot(...v)||1,r=Math.pow(rnd(),.4);
      const leg=T.legs&&i<T.legs*3?Math.floor(i/3):-1;d.push({x:v[0]/l*r,y:v[1]/l*r,z:v[2]/l*r,leg,lu:leg>=0?(i%3+1)/3:0,ph:rnd()*TAU,w:.6+rnd()*.8});}
    const c={type,T,d,src,x:0,y:0,z:0,hd:0,path:[],pi:0,ph:rnd()*TAU,alive:false,die:0,wait:rnd()*6,trail:0,ring:0,puff:0,vx:0,vz:0};C.push(c);return c;};
  for(let i=0;i<20;i++)mk('knot',i<6?'rift':'sea');for(let i=0;i<6;i++)mk('skein',i<2?'rift':'sea');for(let i=0;i<2;i++)mk('runner',i<1?'rift':'sea');
  let n=0;for(const c of C){c.o=n;n+=c.T.n;}SWARM.N=n;
  const g=new THREE.BufferGeometry();SWARM.pos=new Float32Array(n*3);SWARM.col=new Float32Array(n*3);SWARM.ii=new Float32Array(n);SWARM.ss=new Float32Array(n);
  for(const c of C)for(let i=0;i<c.T.n;i++){const k=c.o+i;SWARM.col[k*3]=1;SWARM.ii[k]=1;SWARM.ss[k]=c.T.dot;}
  g.setAttribute('position',new THREE.BufferAttribute(SWARM.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aCol',new THREE.BufferAttribute(SWARM.col,3));
  g.setAttribute('aI',new THREE.BufferAttribute(SWARM.ii,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aS',new THREE.BufferAttribute(SWARM.ss,1));
  SWARM.pts=new THREE.Points(g,dotMat);SWARM.pts.frustumCulled=false;SWARM.pts.renderOrder=10;SWARM.pts.visible=false;scene.add(SWARM.pts);
  /* a few already ashore when the page opens */
  for(const c of C){swarmSpawn(c);const k=Math.floor(rnd()*Math.max(1,c.path.length-2));for(let s=0;s<k;s++){c.pi++;}const a=c.path[c.pi],b=c.path[Math.min(c.pi+1,c.path.length-1)],f=rnd();c.x=lerp(a.x,b.x,f);c.z=lerp(a.z,b.z,f);}
}
/* a route: out of the sea (or the rift), up the beach, up a street, along the avenue, up another street */
function swarmSpawn(c){
  const S=SWARM.STREETS,rift=c.src==='rift'&&RIFT.state!=='sealed';let p=[];
  const xs=S[1+Math.floor(rnd()*3)],xe=S[Math.floor(rnd()*S.length)];
  if(rift){const M=MOUTH;p=[{x:M.x+(rnd()-.5)*4,z:M.zf-12},{x:M.x+(rnd()-.5)*6,z:M.zf+9},{x:100+(rnd()-.5)*6,z:22},{x:64+(rnd()-.5)*3,z:22},{x:64+(rnd()-.5)*3,z:49},{x:xe+(rnd()-.5)*4,z:49+(rnd()-.5)*4},{x:xe+(rnd()-.5)*4,z:120+rnd()*20}];}
  else{const x0=-70+rnd()*130;p=[{x:x0,z:-58-rnd()*16},{x:x0*.7+xs*.3+(rnd()-.5)*10,z:coastZ(x0)-8},{x:xs+(rnd()-.5)*12,z:coastZ(xs)+10+rnd()*6},{x:xs+(rnd()-.5)*4,z:30},{x:xs+(rnd()-.5)*4,z:49},
    {x:xe+(rnd()-.5)*4,z:49+(rnd()-.5)*4},{x:xe+(rnd()-.5)*4,z:120+rnd()*20}];}
  c.path=p;c.pi=0;c.x=p[0].x;c.z=p[0].z;c.y=hgt(c.x,c.z);c.alive=true;c.die=0;c.hd=Math.atan2(p[1].x-p[0].x,p[1].z-p[0].z);c.trail=0;}
/* a shell landing: anything within r is blown apart */
SWARM.blast=function(x,z,r){for(const c of SWARM.C)if(c.alive&&!c.die&&Math.hypot(c.x-x,c.z-z)<r){c.die=1e-3;c.wait=3+rnd()*4;}};
function swarmStep(dt,t,P){
  let near=0,shown=0;const pos=SWARM.pos,ii=SWARM.ii;
  for(const c of SWARM.C){const T=c.T;
    if(!c.alive){c.wait-=dt;if(c.wait<=0)swarmSpawn(c);for(let i=0;i<T.n;i++){ii[c.o+i]=0;}continue;}
    if(c.die>0){c.die+=dt;if(c.die>1.4){c.alive=false;continue;}}
    else{
      /* walk the route; turn on the Wraith when it's close */
      let tx,tz;const a=c.path[Math.min(c.pi+1,c.path.length-1)];tx=a.x;tz=a.z;
      const dm=P?Math.hypot(P.x-c.x,P.z-c.z):99;
      if(P&&dm<22){const ang=Math.atan2(c.x-P.x,c.z-P.z)+.6;tx=P.x+Math.sin(ang)*(4+T.rz*2);tz=P.z+Math.cos(ang)*(4+T.rz*2);}
      const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);
      if(d<2.5&&!(P&&dm<22)){c.pi++;if(c.pi>=c.path.length-1){c.alive=false;c.wait=1+rnd()*5;continue;}}
      const dep=Math.max(0,-hgt(c.x,c.z));
      const hop=c.type==='knot'?.45+.9*Math.max(0,Math.sin(t*7.5+c.ph)):1;
      const sp=T.speed*hop*(1-.55*smooth(.2,3,dep));
      const want=Math.atan2(dx,dz);c.hd+=clamp(angD(want,c.hd),-3*dt,3*dt);
      const wob=Math.sin(t*1.3+c.ph)*.35;c.vx=Math.sin(c.hd+wob)*sp;c.vz=Math.cos(c.hd+wob)*sp;
      let nx=c.x+c.vx*dt,nz=c.z+c.vz*dt;const b=buildingAt(nx,nz,.8);if(b){nx=c.x;nz=c.z;c.hd+=1.2*dt*8;}
      const step=Math.hypot(nx-c.x,nz-c.z);c.x=nx;c.z=nz;c.y=hgt(c.x,c.z);
      /* what it does to the ground and the water as it goes */
      const dep2=Math.max(0,-c.y);c.trail+=step;c.ring+=step;c.puff+=step;
      if(c.trail>.6&&dep2<.6){c.trail=0;const sz=Math.sqrt(T.n/10);soilChurn(c.x,c.z,.55*sz+.35,.1*sz,.02*sz,.24);}
      if(dep2>.1&&dep2<2.2&&c.ring>1.6){c.ring=0;lookRing(c.x,c.z,.35+.25*Math.sqrt(T.n/10));}
      if(dep2<=0&&c.puff>3){c.puff=0;const k=soilParams(c.x,c.z).kind;if(k==='sand'||k==='dirt')fxDust(c.x,c.y,c.z,1,.9+.25*Math.sqrt(T.n/10),k,.22);}
      if(P)near=Math.max(near,smooth(17,4,dm)*clamp(.55+T.n/60,.5,1.4));
    }
    /* the dots: the body boiling, lifted off the ground, its legs swinging */
    const ch=Math.cos(c.hd),sh=Math.sin(c.hd),br=1+.08*Math.sin(t*3.1+c.ph),gait=t*(c.type==='runner'?9:7)+c.ph;
    const lift=T.lift*(c.type==='knot'?1+.35*Math.max(0,Math.sin(t*7.5+c.ph)):1)+Math.abs(Math.sin(gait))*.08;
    const blow=c.die>0?c.die:0;
    for(let i=0;i<T.n;i++){const q=c.d[i],k=c.o+i;let lx,ly,lz;
      if(q.leg>=0){const side=q.leg%2?1:-1,row=Math.floor(q.leg/2),nr=T.legs/2,zr=nr>1?lerp(-1,1,row/(nr-1)):0,sw=Math.sin(gait+q.leg*Math.PI*.5+(side>0?Math.PI:0));
        lx=side*(T.rx*.9+q.lu*.5);ly=lift*(1-q.lu)+Math.max(0,Math.cos(gait+q.leg))*.25*q.lu;lz=zr*T.rz*.7+sw*.35*q.lu;}
      else{lx=q.x*T.rx*br;ly=lift+q.y*T.ry*br;lz=q.z*T.rz*br;}
      const bo=.09*q.w;lx+=Math.sin(t*2.3*q.w+q.ph)*bo;ly+=Math.sin(t*2.9*q.w+q.ph*1.7)*bo;lz+=Math.cos(t*2.1*q.w+q.ph*2.3)*bo;
      if(blow){const s=1+blow*7;lx*=s;lz*=s;ly=ly*(1+blow*2)+blow*4-blow*blow*6;}
      pos[k*3]=c.x+lx*ch+lz*sh;pos[k*3+1]=c.y+ly;pos[k*3+2]=c.z-lx*sh+lz*ch;ii[k]=blow?Math.max(0,1-blow/1.4):1;}
    shown+=T.n;}
  SWARM.near=near;SWARM.shown=shown;
  const g=SWARM.pts.geometry;g.attributes.position.needsUpdate=true;g.attributes.aI.needsUpdate=true;}
