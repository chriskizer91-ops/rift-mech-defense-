'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: THE SIGNAL (game/cinematic/cin-signal.js, session D)
   The million-dot Signal from the threat library (concept/swarm-viewer.src.html, session A): its body parts, its shader,
   its three forms and its tentacles, copied and made scriptable. The viewer drives it from its own globals (aggro, contact);
   here every number comes from the cinematic's timeline instead: SIG.pose(t, {f0,f1,f2, raise, slam, roar, ag, pulse}).
   Also new here: RIFTS, the extra columns of dots pouring up out of the bay (the viewer has only the one under the Signal).
   Dots write into the red channel (hostile), additively, as everywhere in the game.
   ===================================================================================================================== */
const SIG=(function(){
const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z);
const DOT_FRAG=`varying vec3 vC;varying float vA;uniform float uSoft;
void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;
 float core=exp(-r*r*mix(5.5,1.6,uSoft));gl_FragColor=vec4(vC*vA*core,1.);}`;
const HASH=`float hs(float n){return fract(sin(n)*43758.5453);}`;
/* depthTest on: the harbour wall, the Wraiths and the guns hide the dots behind them (an occluder pass fills the depth) */
const ADD={transparent:true,depthTest:true,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor};
const NPART=12;
const hostMat=new T.ShaderMaterial(Object.assign({uniforms:{uPart:{value:Array.from({length:NPART},()=>new T.Matrix4())},uPartL:{value:Array.from({length:NPART},()=>new T.Matrix4())},
  uT:{value:0},uRes:{value:1},uQ:{value:0},uPulse:{value:0},uCoreC:{value:new T.Vector3()},uMaw:{value:0},uReach:{value:0},uAg:{value:0},uTB:{value:Array.from({length:12},()=>new T.Vector4())},uTD:{value:Array.from({length:12},()=>new T.Vector4())},
  uSize:{value:.45},uScale:{value:1},uMin:{value:1.2},uMax:{value:6},uSoft:{value:0},uGain:{value:.03},uCG:{value:6},uCloud:{value:new T.Vector3(0,0,0)},uWS:{value:1}},
 vertexShader:`attribute vec4 aSeed;attribute float aPart;uniform mat4 uPart[${NPART}];uniform mat4 uPartL[${NPART}];uniform vec4 uTB[12];uniform vec4 uTD[12];
 uniform float uT,uRes,uQ,uPulse,uSize,uScale,uMin,uMax,uGain,uCG,uMaw,uReach,uAg,uWS;uniform vec3 uCoreC,uCloud;varying vec3 vC;varying float vA;${HASH}
 void main(){int pi=int(aPart+.5);vec3 tp;float hot=0.;float lag=aSeed.z*aSeed.z*.85;
  if(pi==8){float Hh=60.;float y=mod(position.y*Hh+uT*(5.+aSeed.y*9.),Hh);float f=y/Hh;
    float rad=mix(64.,17.,pow(f,.5))*(.15+.85*position.z);float ang=position.x+uT*(.3+.45*aSeed.x)+f*6.;
    tp=vec3(cos(ang)*rad,y,sin(ang)*rad*.8-6.);hot=.3*(1.-f);}
  else if(pi==9){vec4 q=vec4(uCoreC+position*(1.+.16*uPulse),1.);tp=mix((uPart[0]*q).xyz,(uPartL[0]*q).xyz,lag);hot=1.;}
  else if(pi==6){int ki=int(floor(position.x)+.5);float u=fract(position.x);
    vec4 B=uTB[ki],D=uTD[ki];vec3 base=(uPart[0]*vec4(B.xyz,1.)).xyz;vec3 d0=normalize(mat3(uPart[0])*D.xyz);float len=B.w;
    vec3 a1=normalize(cross(d0,vec3(.0013,1.,.0021)));vec3 a2=cross(d0,a1);float tw=uT*(.65+.2*sin(D.w*3.))+u*3.3+D.w;
    vec3 c=base+d0*u*len+(a1*sin(tw)+a2*sin(tw*1.27+1.))*.24*u*len;
    c.y-=u*u*len*.14*(1.-uReach);c.z+=uReach*u*u*len*.55;
    float rad=mix(len*.085,1.1,pow(u,.8))*(.2+.8*position.z);c+=(a1*cos(position.y)+a2*sin(position.y))*rad;tp=c;}
  else{vec4 q=vec4(position,1.);tp=mix((uPart[pi]*q).xyz,(uPartL[pi]*q).xyz,lag);if(pi==11)hot=uMaw;}
  vec3 w=tp*.045;tp+=vec3(sin(w.y*1.7+uT*1.1)+sin(w.z*2.3-uT*.8),sin(w.z*1.9+uT*.9)+sin(w.x*2.1+uT*1.3),sin(w.x*1.5-uT*1.2)+sin(w.y*2.5+uT*.7))*(1.5+uAg*1.3);
  if(aSeed.w>.983&&pi!=8){float dk=fract(uT*.11+aSeed.y*7.);tp+=vec3((aSeed.x-.5)*12.*dk,-dk*dk*75.,(aSeed.z-.5)*12.*dk);}
  float ph=aSeed.y*6.2832,ca2=1.6+2.4*fract(aSeed.y*7.31);tp+=vec3(sin(uT*.55+ph),sin(uT*.43+ph*1.7),cos(uT*.5+ph*2.3))*(pi==8?.4:ca2)+vec3(sin(uT*2.1+aSeed.w*40.),cos(uT*1.9+aSeed.x*40.),sin(uT*2.3+aSeed.z*40.))*.35;
  float ca=aSeed.w*6.2832+uT*.04*(.5+aSeed.x);float cr=40.+aSeed.z*aSeed.z*620.;
  vec3 cp=uCloud+vec3(cos(ca)*cr,1.+aSeed.y*aSeed.y*70.,sin(ca)*cr*.55);
  float k=clamp(uRes*1.7-aSeed.x*.7,0.,1.);k=k*k*(3.-2.*k);
  vec3 p=mix(cp,tp,k);float sw=sin(k*3.1416);p.y+=sw*50.*aSeed.z;p.xz+=sw*vec2(cos(ca*3.),sin(ca*3.))*70.*aSeed.y;
  float q=uQ*(1.-k*.6);float st=floor(uT*9.+aSeed.x*3.);
  p+=(vec3(hs(st+aSeed.y*91.7),hs(st*1.3+aSeed.z*57.1),hs(st*.7+aSeed.w*33.3))-.5)*q*(3.+aSeed.x*14.);
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  float un=1.-k;float px=uSize*uWS*(1.+hot*.7+un*1.6)*uScale/max(.001,-mv.z);float cl=clamp(px,uMin+un*.8,uMax);
  vA=uGain*mix(1.,uCG,un)*(1.+hot*2.2*(.5+.5*uPulse)*k)*min(1.,px*px/(cl*cl)+.35);gl_PointSize=cl;vC=vec3(1.,0.,0.);}`,
 fragmentShader:DOT_FRAG},ADD));

/* ---------- the body: the viewer's parts, verbatim ---------- */
const PIV=[V(0,58,-6),V(2,96,22),V(-36,102,10),V(-57,70,28),V(36,102,10),V(57,70,28),V(),V(),V(),V(),V(4,82,32),V(2,96,22)];
const CORE_C=V(-3,92,12);
const lerp=(a,b,t)=>a+(b-a)*t;
/* a seeded random, so every play of the film (and every recorded frame) is the same */
let sd=20261120;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};
const gauss=()=>{let u=0;while(u===0)u=rnd();const v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
function hostPrims(){const P=[];
  const cap=(a,b,ra,rb,part,w=1)=>P.push({t:0,a:V(...a),b:V(...b),ra,rb,part,w});
  const ell=(c,r,part,w=1)=>P.push({t:1,c:V(...c),r:V(...r),part,w});
  const mir=(f)=>{f(1);f(-1);};
  ell([0,58,-6],[25,15,21],0);cap([0,62,-6],[0,95,8],22,26,0);
  ell([3,113,-8],[38,30,32],0,1.25);
  ell([15,133,-14],[17,13,16],0,.55);ell([-17,126,-25],[15,12,14],0,.5);ell([4,107,-35],[16,14,13],0,.5);
  ell([-25,114,-3],[14,12,12],0,.45);ell([23,119,5],[12,10,11],0,.4);ell([-6,138,-2],[11,9,10],0,.35);
  mir(x=>ell([x*34,99,11],[16,13,15],0,.8));
  ell([4,84,40],[13,10.5,17],1);
  ell([4,76.5,44],[10.5,5,13],10);
  mir(x=>{const pu=x>0?2:4,pf=x>0?3:5,a=x>0?1.12:.92;
    cap([-x*36,102,10],[-x*57,70,28],15*a,12*a,pu);cap([-x*57,70,28],[-x*62,24,47],12*a,13.5*a,pf);ell([-x*62,13,51],[16*a,12*a,17*a],pf,1.1);});
  return P;}
const N=1000000;
function make(){
  const prims=hostPrims();const _b=V(),_up=V(0,1,0);
  prims.forEach(p=>{if(p.t===0){const L=p.a.distanceTo(p.b);p.L=L;p.area=(2*Math.PI*(p.ra+p.rb)*.5*L+2*Math.PI*(p.ra*p.ra+p.rb*p.rb)*.5)*p.w;}
    else{const a=p.r.x,b=p.r.y,c=p.r.z;p.area=4*Math.PI*Math.pow((Math.pow(a*b,1.6)+Math.pow(a*c,1.6)+Math.pow(b*c,1.6))/3,1/1.6)*p.w;}});
  const tot=prims.reduce((s,p)=>s+p.area,0);let acc=0;const cdf=prims.map(p=>(acc+=p.area)/tot);
  const geo=new T.BufferGeometry();
  const pos=new Float32Array(N*3),seed=new Float32Array(N*4),part=new Float32Array(N);
  const NF=160000,NC=12000,NM=6000,NT=120000;
  let made=0;const q=V(),n1=V(),n2=V(),dd=V();
  const put=(x,y,z,pt,sy)=>{const i=made++;pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;part[i]=pt;
    seed[i*4]=rnd();seed[i*4+1]=sy!=null?sy:rnd();seed[i*4+2]=rnd();seed[i*4+3]=rnd();};
  let cLeft=0,cR=1,cPh=0,cPart=0;const cc=V();
  const radial=()=>1-.42*Math.pow(rnd(),1.5);
  while(made<N){const ty=rnd()*N;
    if(ty<NF){put(rnd()*6.2832,rnd(),Math.pow(rnd(),.6),8);continue;}
    if(ty<NF+NC){const g=[gauss(),gauss(),gauss()];const s2=Math.pow(rnd(),.5)*11/(Math.hypot(...g)||1);put(g[0]*s2*1.2,g[1]*s2*.8,g[2]*s2,9);continue;}
    if(ty<NF+NC+NM){const g=[gauss(),gauss(),gauss()];const s2=Math.pow(rnd(),.5)/(Math.hypot(...g)||1);put(4+g[0]*s2*6,80.5+g[1]*s2*2.5,45+g[2]*s2*7,11);continue;}
    if(ty<NF+NC+NM+NT){const kk=Math.floor(rnd()*12);put(kk+Math.min(.999,Math.pow(rnd(),.8)),rnd()*6.2832,Math.pow(rnd(),.5),6);continue;}
    if(cLeft>0){const g=[gauss(),gauss(),gauss()];const rr=cR*Math.pow(rnd(),.35)/(Math.hypot(...g)||1);put(cc.x+g[0]*rr,cc.y+g[1]*rr*.8,cc.z+g[2]*rr,cPart,cPh);cLeft--;continue;}
    const r=rnd();let pi=0;while(cdf[pi]<r)pi++;const pr=prims[pi];const sh=radial();
    if(pr.t===0){_b.subVectors(pr.b,pr.a);const L=pr.L;dd.copy(_b).multiplyScalar(1/L);
      n1.crossVectors(Math.abs(dd.y)>.9?V(1,0,0):_up,dd).normalize();n2.crossVectors(dd,n1);
      const capP=(pr.ra*pr.ra+pr.rb*pr.rb)/((pr.ra+pr.rb)*L+pr.ra*pr.ra+pr.rb*pr.rb);
      if(rnd()<capP){const e=rnd()<pr.ra*pr.ra/(pr.ra*pr.ra+pr.rb*pr.rb)?0:1;const g=[gauss(),gauss(),gauss()];const gl2=Math.hypot(...g)||1;const rr=(e?pr.rb:pr.ra)*sh;
        q.copy(e?pr.b:pr.a).add(V(g[0]/gl2*rr,g[1]/gl2*rr,g[2]/gl2*rr));}
      else{const u=rnd(),a=rnd()*6.2832,rr=lerp(pr.ra,pr.rb,u)*sh;q.copy(pr.a).addScaledVector(dd,u*L).addScaledVector(n1,Math.cos(a)*rr).addScaledVector(n2,Math.sin(a)*rr);}}
    else{const g=[gauss(),gauss(),gauss()];const gl2=Math.hypot(...g)||1;q.set(pr.c.x+g[0]/gl2*pr.r.x*sh,pr.c.y+g[1]/gl2*pr.r.y*sh,pr.c.z+g[2]/gl2*pr.r.z*sh);}
    cc.copy(q);cLeft=220+Math.floor(rnd()*520);cR=2.6+rnd()*3.2;cPh=rnd();cPart=pr.part;}
  geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('aSeed',new T.BufferAttribute(seed,4));geo.setAttribute('aPart',new T.BufferAttribute(part,1));
  const pts=new T.Points(geo,hostMat);pts.frustumCulled=false;
  hostMat.uniforms.uCoreC.value.copy(CORE_C);
  return {pts,geo};
}
/* ---------- posing: the viewer's poseHost, with the timeline's numbers in place of its globals ---------- */
const _m=new T.Matrix4(),_m2=new T.Matrix4(),_e=new T.Euler(),_s=new T.Matrix4();
function pivotRot(out,pv,rx,ry,rz,parent,sc,off){_e.set(rx,ry,rz,'XYZ');out.makeTranslation(pv.x+(off?off.x:0),pv.y+(off?off.y:0),pv.z+(off?off.z:0)).multiply(_m.makeRotationFromEuler(_e));
  if(sc)out.multiply(_s.makeScale(sc.x,sc.y,sc.z));out.multiply(_m2.makeTranslation(-pv.x,-pv.y,-pv.z));
  if(parent)out.premultiply(parent);return out;}
const TENT=[
 [[0,138,-12],95,[.1,1,-.35],0],[[16,132,-16],85,[.7,.8,-.3],1.1],[[-17,126,-25],90,[-.7,.6,-.6],2.3],[[30,112,-14],80,[1,.2,-.4],3.1],[[-30,110,-16],85,[-1,.15,-.5],4.2],
 [[0,104,-34],100,[.1,.1,-1],5.3],[[22,82,-12],70,[1,-.35,.1],.6],[[-22,84,-14],75,[-1,-.3,-.05],1.7],[[14,62,-18],95,[.6,-.55,-.6],2.8],[[-16,60,-20],90,[-.65,-.5,-.6],3.9],
 [[6,98,-30],70,[.4,.5,-1],4.9],[[-6,120,-30],75,[-.3,.9,-.8],5.9]];
function poseOne(t,M,s){const {f0,f1,f2,raise,slam,roar,ag}=s;
  const pullL=Math.max(0,Math.sin(t*.32))*f0,pullR=Math.max(0,Math.sin(t*.32+Math.PI))*f0;
  const heave=Math.sin(t*.55),br=1+.025*Math.sin(t*.9);
  const sc=V(br*(1+.28*f2),br*(1+.2*f1-.32*f2),br*(1+.22*f2)),off=V(0,8*f1-22*f2,0);
  pivotRot(M[0],PIV[0],.04*heave+.05*(pullL+pullR)+ag*.1+slam*.1-.32*f1+.12*f2,.06*Math.sin(t*.21)+.05*(pullL-pullR),.03*Math.sin(t*.37)+.03*(pullL-pullR),null,sc,off);
  pivotRot(M[1],PIV[1],.05*Math.sin(t*.43)-roar*.3+slam*.12-.35*f1+.25*f2,.22*Math.sin(t*.27)*(1-roar),.05*Math.sin(t*.61),M[0]);
  pivotRot(M[10],PIV[10],.04+.03*Math.sin(t*1.1)+roar*.55+.2*f1,0,0,M[1]);M[11].copy(M[1]);
  pivotRot(M[2],PIV[2],-.32*pullL+.04*heave-.5*f1,.08*pullL,-.06*pullL-1.15*f1-.75*f2,M[0]);pivotRot(M[3],PIV[3],.22*pullL-.04*Math.sin(t*.4)+.3*f1+.5*f2,0,0,M[2]);
  pivotRot(M[4],PIV[4],-.32*pullR*(1-raise)-raise*1.85+slam*.28-.5*f1,raise*.3-.08*pullR,.06*pullR+raise*.32+1.15*f1+.75*f2,M[0]);
  pivotRot(M[5],PIV[5],.22*pullR*(1-raise)-raise*.85+slam*.12+.3*f1+.5*f2,0,0,M[4]);
  M[6].identity();M[7].identity();M[8].identity();M[9].copy(M[0]);}
const _td=V();
/* s: {f0,f1,f2 (forms: hunched, risen, spread), raise, slam, roar, ag (0..1), pulse (0..1)}; sPrev: the same half a second ago */
function pose(t,s,sPrev){const U=hostMat.uniforms;poseOne(t,U.uPart.value,s);poseOne(t-.5,U.uPartL.value,sPrev||s);
  TENT.forEach(([b,len,d,ph],i)=>{const w=.8+.2*Math.sin(t*.23+ph*2.1);U.uTB.value[i].set(b[0],b[1],b[2],len*w*(1+.35*s.f1+.7*s.f2));
    _td.set(d[0]*(1+.4*s.f2),d[1]+.7*s.f1-.95*s.f2,d[2]).normalize();U.uTD.value[i].set(_td.x,_td.y,_td.z,ph);});
  U.uPulse.value=s.pulse;U.uMaw.value=s.roar*1.2;U.uReach.value=s.ag*(.35+.65*Math.max(s.raise,s.slam));U.uAg.value=s.ag;U.uT.value=t;}

/* ---------- the other rifts: columns of dots pouring up out of the bay, leaning in toward the Signal as they rise ---------- */
const riftMat=new T.ShaderMaterial(Object.assign({uniforms:{uT:{value:0},uSize:{value:1.6},uScale:{value:1},uMin:{value:1.2},uMax:{value:7},uSoft:{value:0},uGain:{value:.05},
  uTo:{value:new T.Vector3()},uHgt:{value:420},uFeed:{value:1},uQ:{value:0}},
 vertexShader:`attribute vec4 aSeed;attribute vec3 aBase;uniform float uT,uSize,uScale,uMin,uMax,uGain,uHgt,uFeed,uQ;uniform vec3 uTo;varying vec3 vC;varying float vA;${HASH}
 void main(){float sp=.035+.05*aSeed.y;float f=fract(aSeed.x+uT*sp);
  float rad=mix(46.,10.,pow(f,.6))*(.2+.8*aSeed.z);float ang=aSeed.w*6.2832+uT*(.25+.4*aSeed.y)+f*7.;
  vec3 col=aBase+vec3(cos(ang)*rad,f*uHgt*.55,sin(ang)*rad);
  vec3 lean=mix(aBase+vec3(0.,uHgt*.55,0.),uTo,.9);col=mix(col,lean+vec3(cos(ang),.3*sin(ang*2.),sin(ang))*rad*.6,smoothstep(.35,1.,f)*uFeed);
  float st=floor(uT*9.+aSeed.x*5.);col+=(vec3(hs(st+aSeed.y*91.7),hs(st*1.3+aSeed.z*57.1),hs(st*.7+aSeed.w*33.3))-.5)*uQ*12.;
  vec4 mv=modelViewMatrix*vec4(col,1.);gl_Position=projectionMatrix*mv;
  float px=uSize*uScale/max(.001,-mv.z);float cl=clamp(px,uMin,uMax);
  vA=uGain*(1.+1.5*(1.-f))*smoothstep(0.,.05,f)*smoothstep(1.,.85,f)*min(1.,px*px/(cl*cl)+.35);gl_PointSize=cl;vC=vec3(1.,0.,0.);}`,
 fragmentShader:DOT_FRAG},ADD));
function makeRifts(bases,per){const n=bases.length*per,s=new Float32Array(n*4),b=new Float32Array(n*3),p=new Float32Array(n*3);
  for(let i=0;i<n;i++){const k=Math.floor(i/per);s.set([rnd(),rnd(),Math.pow(rnd(),.5),rnd()],i*4);b.set([bases[k].x,0,bases[k].z],i*3);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aSeed',new T.BufferAttribute(s,4));g.setAttribute('aBase',new T.BufferAttribute(b,3));
  const pts=new T.Points(g,riftMat);pts.frustumCulled=false;return pts;}

/* ---------- allies: a small knot of blue-channel dots on each Wraith (drawn green on the sensor) ---------- */
const allyMat=new T.ShaderMaterial(Object.assign({uniforms:{uT:{value:0},uScale:{value:1},uSoft:{value:0},uGain:{value:1}},
 vertexShader:`attribute vec4 aSeed;uniform float uT,uScale,uGain;varying vec3 vC;varying float vA;
 void main(){vec3 p=position+vec3(sin(uT*1.3+aSeed.x*30.),sin(uT*1.7+aSeed.y*30.)*.6,cos(uT*1.1+aSeed.z*30.))*.6;
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float px=.5*uScale/max(.001,-mv.z);float cl=clamp(px,2.,14.);
  vA=uGain*.5*min(1.,px*px/(cl*cl)+.5);gl_PointSize=cl;vC=vec3(0.,0.,1.);}`,fragmentShader:DOT_FRAG},ADD,{depthTest:false}));
function makeAllies(spots){const per=14,n=spots.length*per,p=new Float32Array(n*3),s=new Float32Array(n*4);
  for(let i=0;i<n;i++){const k=Math.floor(i/per);p.set([spots[k].x+gauss()*1.2,spots[k].y+3+rnd()*5,spots[k].z+gauss()*1.2],i*3);s.set([rnd(),rnd(),rnd(),rnd()],i*4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aSeed',new T.BufferAttribute(s,4));
  const pts=new T.Points(g,allyMat);pts.frustumCulled=false;return pts;}

return {N,make,pose,hostMat,riftMat,allyMat,makeRifts,makeAllies,CORE_C};
})();
