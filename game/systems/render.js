/* systems/render.js — the picture.
   1. The world (ground, rocks, rifts, the Wraith, shots, smoke) is drawn lit, into a target.
   2. The dot creatures (session A's module, game/creatures/), the allies and the knocked-off dots are drawn as additive points
      into a second target (the viewer's dots),
      then blurred twice for the bloom (the viewer's bloom).
   3. One last pass lays the dots over the world in the sensor look (red hostile, green allies) or the thermal look (iron palette,
      the world dimmed to its heat), then adds the interference: tearing bands, block shifts, colour split, snow and dropouts.
   Steps 2 and 3 are copied from concept/swarm-viewer.src.html so the arena looks like the threat library. */
const cv=document.createElement('canvas');cv.id='gl';document.body.prepend(cv);
const R=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance',alpha:false,stencil:false});
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;
const GL2=R.capabilities.isWebGL2;
const HALF=!!(R.extensions.has('EXT_color_buffer_float')||R.extensions.has('EXT_color_buffer_half_float'));
const FT=HALF?THREE.HalfFloatType:THREE.UnsignedByteType;
const S=new THREE.Scene();            /* the lit world */
const DS=new THREE.Scene();           /* the dot layer */
const cam=new THREE.PerspectiveCamera(42,1,1,900);
const fsCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1),fsScene=new THREE.Scene(),fsQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));fsQuad.frustumCulled=false;fsScene.add(fsQuad);
let W=1,H=1,PR=1,DYN=1;
const PRMAX=Math.min(devicePixelRatio||1,2);
let rtW,rtS,rtH1,rtH2,rtQ1,rtQ2;
function mkRT(w,h,o){return new THREE.WebGLRenderTarget(w,h,Object.assign({type:FT,format:THREE.RGBAFormat,depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter},o||{}));}
function resize(){
  W=Math.max(1,innerWidth);H=Math.max(1,innerHeight);PR=Math.max(.6,PRMAX*DYN);
  R.setPixelRatio(PR);R.setSize(W,H,false);cv.style.width=W+'px';cv.style.height=H+'px';
  const w=Math.floor(W*PR),h=Math.floor(H*PR);
  [rtW,rtS,rtH1,rtH2,rtQ1,rtQ2].forEach(t=>t&&t.dispose());
  rtW=mkRT(w,h,{depthBuffer:true,samples:GL2?4:0});
  rtS=mkRT(w,h);rtH1=mkRT(w>>1,h>>1);rtH2=mkRT(w>>1,h>>1);rtQ1=mkRT(w>>2,h>>2);rtQ2=mkRT(w>>2,h>>2);
  cam.aspect=W/H;cam.updateProjectionMatrix();
}
addEventListener('resize',resize);
/* px per metre at distance 1 (for world-sized dots) */
function pxScale(){return (H*PR)/(2*Math.tan(cam.fov*Math.PI/360));}

/* ---------------- packed assets (models and pictures are inlined by systems/build.py) ---------------- */
const ASSETS=window.RMD_ASSETS||{};
/* decoded here, never fetched: a published page may not fetch (session B found this) */
function b64bytes(b64){if(Uint8Array.fromBase64)return Promise.resolve(Uint8Array.fromBase64(b64));
  const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return Promise.resolve(u);}
const LM=new THREE.LoadingManager();
const TL=new THREE.TextureLoader(LM);
const TEXC={};
function assetTex(name,o={}){const key=name+(o.lin?'|l':'');if(TEXC[key])return TEXC[key];const b=ASSETS[name];if(!b){console.warn('missing asset',name);return null;}
  const t=TL.load('data:image/webp;base64,'+b);t.colorSpace=o.lin?THREE.NoColorSpace:THREE.SRGBColorSpace;t.flipY=!o.glb;t.anisotropy=4;
  if(o.rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(o.rep,o.rep);}return TEXC[key]=t;}
const GLBC={};
function loadGLB(name){if(!GLBC[name]){const b=ASSETS[name];if(!b)return Promise.reject(new Error('missing '+name));
  LM.itemStart(name);
  GLBC[name]=b64bytes(b).then(u=>new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
    .then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',g=>res(g.scene),rej)))
    .then(sc=>{LM.itemEnd(name);return sc;},e=>{LM.itemError(name);LM.itemEnd(name);throw e;});}
  return GLBC[name].then(sc=>sc.clone(true));}

/* ---------------- light: a high sun from the north-west, a sky-and-earth fill, and a soft sky for the metal to reflect ---------------- */
const SUN=new THREE.Vector3(-.42,.78,-.46).normalize();
const HEMI=new THREE.HemisphereLight(0xc8d6e8,0x4a4036,1.25);S.add(HEMI);
const KEY=new THREE.DirectionalLight(0xfff0d8,3.0);KEY.castShadow=true;S.add(KEY,KEY.target);
KEY.shadow.bias=-.0004;KEY.shadow.normalBias=.05;KEY.shadow.mapSize.set(2048,2048);
Object.assign(KEY.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:260});KEY.shadow.camera.updateProjectionMatrix();
/* the shadow box follows a point, snapped to shadow texels so edges do not crawl (Ironhowl 4's placeSun) */
function placeSun(fx,fz){const s=KEY.shadow.mapSize.x,r=KEY.shadow.camera.right,step=2*r/s;
  const ux=Math.round(fx/step)*step,uz=Math.round(fz/step)*step;
  KEY.target.position.set(ux,0,uz);KEY.position.set(ux+SUN.x*120,SUN.y*120,uz+SUN.z*120);KEY.target.updateMatrixWorld();}
(function envMap(){const es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vD;void main(){float y=vD.y;vec3 c=mix(vec3(.30,.27,.24),vec3(.85,.9,1.),smoothstep(-.15,.4,y));c=mix(c,vec3(.45,.55,.75),smoothstep(.4,1.,y));'+
      'c+=vec3(1.,.9,.7)*pow(max(dot(vD,normalize(vec3(-.42,.78,-.46))),0.),40.)*6.;gl_FragColor=vec4(c,1.);}'})));
  const pm=new THREE.PMREMGenerator(R);S.environment=pm.fromScene(es,.02).texture;S.environmentIntensity=.55;pm.dispose();})();
S.background=new THREE.Color(0x0b0d0f);

/* ---------------- the test arena: flat ground, rocks for scale, rift mouths glowing at the edge ---------------- */
/* rift mouths scattered over the field: [angle in degrees, distance from the middle in metres] */
const RIFTS=[[-100,82],[-25,96],[55,78],[140,90],[215,84],[10,150],[175,148],[260,140],[95,152]].map(([a,d],i)=>{const r=a*Math.PI/180;return {x:Math.cos(r)*d,z:Math.sin(r)*d,a:r,i};});
function buildArena(){
  const gm=new THREE.MeshStandardMaterial({map:assetTex('06-dirt-and-gravel.webp',{rep:72}),normalMap:assetTex('06-dirt-and-gravel-n.webp',{rep:72,lin:true}),
    normalScale:new THREE.Vector2(.9,.9),roughness:.95,metalness:0,color:0x8a8d8c});
  /* the ground darkens past the arena's edge, and big soft patches break up the tiling */
  gm.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>','#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\nfloat gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}')
      .replace('#include <map_fragment>',`#include <map_fragment>
        {float n=gn(vWP.xz/23.)*.6+gn(vWP.xz/7.)*.4;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.33))),.45)*(.78+.4*n);
         float e=smoothstep(${ARENA_R}.,${ARENA_R+30}.,length(vWP.xz));diffuseColor.rgb*=1.-.75*e;}`);};
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900,1,1),gm);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;S.add(ground);
  /* rocks: one instanced mesh, more of them near the edge */
  const rg=new THREE.IcosahedronGeometry(1,1),pa=rg.attributes.position;
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),k=.75+.5*Math.abs(Math.sin(x*3.1+y*1.7)*Math.cos(z*2.3));pa.setXYZ(i,x*k,y*k*.62,z*k);}
  rg.computeVertexNormals();
  const rm=new THREE.MeshStandardMaterial({color:0x5a5753,roughness:.9,metalness:.05,flatShading:true});
  const N=520,rocks=new THREE.InstancedMesh(rg,rm,N),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
  let made=0;for(let t=0;t<6000&&made<N;t++){const a=Math.random()*TAU,d=Math.sqrt(Math.random())*260;if(d<14)continue;if(d<ARENA_R&&Math.random()>.45)continue;
    const x=Math.cos(a)*d,z=Math.sin(a)*d;if(RIFTS.some(r=>Math.hypot(r.x-x,r.z-z)<12))continue;
    const s=d>ARENA_R?1+Math.random()*3.5:.4+Math.random()*1.4;q.setFromEuler(e.set(Math.random()*.4,Math.random()*TAU,Math.random()*.4));
    m4.compose(V3(x,s*.15,z),q,V3(s*(.8+Math.random()*.6),s,s*(.8+Math.random()*.6)));rocks.setMatrixAt(made++,m4);}
  rocks.count=made;rocks.castShadow=rocks.receiveShadow=true;S.add(rocks);
  /* rift mouths: a dark gash in the ground with magma light inside (session B makes the real ones) */
  const lipM=new THREE.MeshStandardMaterial({color:0x1d1916,roughness:.95,metalness:0,flatShading:true});
  const glowM=new THREE.ShaderMaterial({uniforms:{uT:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uT;varying vec2 vU;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){vec2 c=vU-.5;float r=length(c*vec2(1.,2.6))*2.;float k=1.-smoothstep(.15,1.,r);
        float cr=n(vU*vec2(9.,3.)+vec2(uT*.2,0.))*n(vU*vec2(23.,7.)-uT*.15);float fl=.75+.25*sin(uT*2.1+vU.x*9.);
        vec3 col=vec3(1.,.32,.06)*(k*k*1.6+smoothstep(.35,.6,cr)*k*3.)*fl;gl_FragColor=vec4(col,1.);}`});
  for(const rf of RIFTS){const g=new THREE.Group();g.position.set(rf.x,0,rf.z);g.rotation.y=-rf.a+Math.PI/2;
    const lip=new THREE.Mesh(new THREE.TorusGeometry(5,1.6,6,18),lipM);lip.rotation.x=-Math.PI/2;lip.scale.set(1,2.6,.5);lip.castShadow=lip.receiveShadow=true;g.add(lip);
    const pit=new THREE.Mesh(new THREE.CircleGeometry(5.6,24),new THREE.MeshBasicMaterial({color:0x050302}));pit.rotation.x=-Math.PI/2;pit.position.y=.03;pit.scale.set(1,2.5,1);g.add(pit);
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(9,22),glowM);gl.rotation.x=-Math.PI/2;gl.position.y=.06;g.add(gl);
    const pl=new THREE.PointLight(0xff5a1a,90,30,1.6);pl.position.y=2;g.add(pl);rf.light=pl;S.add(g);}
  RIFTS.glow=glowM;
}

/* ---------------- the dot layer (from the viewer) ---------------- */
const ADD={transparent:true,depthTest:false,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor};
const DOT_FRAG=`varying vec3 vC;varying float vA;uniform float uSoft;
void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;
 float core=exp(-r*r*mix(5.5,1.6,uSoft));gl_FragColor=vec4(vC*vA*core,1.);}`;
/* aCol = channel mix (r hostile, g grid/neutral, b ally); aS = the dot's size in metres (the viewer used one size per creature) */
const dotMat=new THREE.ShaderMaterial(Object.assign({uniforms:{uScale:{value:1},uMin:{value:2},uMax:{value:48},uSoft:{value:0},uGain:{value:1}},
 vertexShader:`attribute vec3 aCol;attribute float aI;attribute float aS;uniform float uScale,uMin,uMax,uGain;varying vec3 vC;varying float vA;
 void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
  float px=aS*uScale/max(.001,-mv.z);float cl=clamp(px,uMin,uMax);
  vA=aI*uGain*min(1.,px*px/(cl*cl)+.4);gl_PointSize=cl;vC=aCol;}`,
 fragmentShader:DOT_FRAG},ADD));
const DOTS={max:90000,n:0,maxL:9000,nl:0};
(function(){const D=DOTS,n=D.max;D.pos=new Float32Array(n*3);D.col=new Float32Array(n*3);D.I=new Float32Array(n);D.S=new Float32Array(n);
  const g=D.geo=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(D.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aCol',new THREE.BufferAttribute(D.col,3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aI',new THREE.BufferAttribute(D.I,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aS',new THREE.BufferAttribute(D.S,1).setUsage(THREE.DynamicDrawUsage));
  D.pts=new THREE.Points(g,dotMat);D.pts.frustumCulled=false;DS.add(D.pts);
  D.lp=new Float32Array(D.maxL*6);D.lc=new Float32Array(D.maxL*6);const lg=D.lgeo=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.BufferAttribute(D.lp,3).setUsage(THREE.DynamicDrawUsage));lg.setAttribute('color',new THREE.BufferAttribute(D.lc,3).setUsage(THREE.DynamicDrawUsage));
  D.lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial(Object.assign({vertexColors:true},ADD)));D.lines.frustumCulled=false;DS.add(D.lines);})();
DOTS.begin=function(){this.n=0;this.nl=0;};
DOTS.put=function(x,y,z,r,g,b,i,s){const n=this.n;if(n>=this.max)return;this.pos[n*3]=x;this.pos[n*3+1]=y;this.pos[n*3+2]=z;this.col[n*3]=r;this.col[n*3+1]=g;this.col[n*3+2]=b;this.I[n]=i;this.S[n]=s;this.n++;};
DOTS.line=function(a,b,k){const n=this.nl;if(n>=this.maxL)return;const o=n*6;this.lp[o]=a.x;this.lp[o+1]=a.y;this.lp[o+2]=a.z;this.lp[o+3]=b.x;this.lp[o+4]=b.y;this.lp[o+5]=b.z;
  this.lc[o]=k;this.lc[o+1]=0;this.lc[o+2]=0;this.lc[o+3]=k;this.lc[o+4]=0;this.lc[o+5]=0;this.nl++;};
DOTS.end=function(){const g=this.geo;g.setDrawRange(0,this.n);
  for(const [k,w] of [['position',3],['aCol',3],['aI',1],['aS',1]]){const a=g.attributes[k];a.clearUpdateRanges();if(this.n)a.addUpdateRange(0,this.n*w);a.needsUpdate=true;}
  const lg=this.lgeo;lg.setDrawRange(0,this.nl*2);for(const k of ['position','color']){const a=lg.attributes[k];a.clearUpdateRanges();if(this.nl)a.addUpdateRange(0,this.nl*6);a.needsUpdate=true;}};
/* ---------------- post: bloom + sensor / thermal look + interference (from the viewer) ---------------- */
const FS_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const downMat=new THREE.ShaderMaterial({uniforms:{tA:{value:null},uPx:{value:new THREE.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uPx;varying vec2 vUv;void main(){vec2 o=uPx*.5;
 gl_FragColor=(texture2D(tA,vUv+vec2(-o.x,-o.y))+texture2D(tA,vUv+vec2(o.x,-o.y))+texture2D(tA,vUv+vec2(-o.x,o.y))+texture2D(tA,vUv+vec2(o.x,o.y)))*.25;}`});
const blurMat=new THREE.ShaderMaterial({uniforms:{tA:{value:null},uD:{value:new THREE.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uD;varying vec2 vUv;void main(){
 vec4 c=texture2D(tA,vUv)*.2270;c+=(texture2D(tA,vUv+uD*1.3846)+texture2D(tA,vUv-uD*1.3846))*.3162;
 c+=(texture2D(tA,vUv+uD*3.2308)+texture2D(tA,vUv-uD*3.2308))*.0703;gl_FragColor=c;}`});
/* tW: the lit world (linear). It is tone mapped (ACES) and turned to screen colours here, because the targets stay linear. */
const finMat=new THREE.ShaderMaterial({uniforms:{tW:{value:null},tS:{value:null},tH:{value:null},tQ:{value:null},uMode:{value:0},uI:{value:0},uT:{value:0},uPix:{value:1},
  uRes:{value:new THREE.Vector2()},uExp:{value:1.3},uFlash:{value:0},uWExp:{value:1.15},uHurt:{value:0}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tW,tS,tH,tQ;uniform float uMode,uI,uT,uPix,uExp,uFlash,uWExp,uHurt;uniform vec2 uRes;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 aces(vec3 x){x*=uWExp;return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
 vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
 vec3 iron(float t){t=clamp(t,0.,1.);
  vec3 a=vec3(.02,.02,.07),b=vec3(.22,.04,.42),c=vec3(.72,.08,.38),d=vec3(.97,.42,.06),e=vec3(1.,.83,.25),f=vec3(1.,1.,.92);
  return t<.2?mix(a,b,t/.2):t<.42?mix(b,c,(t-.2)/.22):t<.62?mix(c,d,(t-.42)/.2):t<.82?mix(d,e,(t-.62)/.2):mix(e,f,(t-.82)/.18);}
 vec3 look(vec2 uv){vec4 s=texture2D(tS,uv),bh=texture2D(tH,uv),bq=texture2D(tQ,uv);vec3 w=texture2D(tW,uv).rgb;vec3 col;
  if(uMode<.5){float I=s.r+bh.r*.9+bq.r*.8;float A=s.b+bh.b*.9+bq.b*.6;float G=s.g+bh.g*.35;
   float ov=1.-exp(-(I+A)*1.2);
   col=srgb(aces(w))*(1.-.5*ov);
   col+=vec3(1.,.08,.035)*(1.-exp(-I*1.4))*1.05+vec3(1.,.48,.14)*smoothstep(1.2,5.,I)*.85+vec3(1.,.95,.85)*smoothstep(5.,18.,I)*.8;
   col+=vec3(.2,1.,.45)*(1.-exp(-A*1.5))+vec3(.9,1.,.9)*smoothstep(3.,9.,A)*.5;
   col+=vec3(.12,.5,.44)*G;}
  else{float lum=dot(srgb(aces(w)),vec3(.3,.59,.11)),hot=max(0.,dot(w,vec3(.3,.59,.11))-1.5);   /* the world: its brightness as cold-end heat; flames, shots and flashes run hot */
   float Tm=(s.r*.25+bh.r*.9+bq.r*1.6+(s.b*.15+bh.b*.5+bq.b*.9)*.6)*uExp+lum*.55+hot*.6;
   float bg=.05+.035*h(floor(uv*uRes/6.)+floor(uT*3.))+.04*uv.y;
   col=iron(bg+(1.-exp(-Tm))*.95)+vec3(.05,.08,.08)*s.g;}
  return col;}
 void main(){vec2 uv=vUv;float I=uI;
  if(uPix>1.01){vec2 g=uRes/uPix;uv=(floor(uv*g)+.5)/g;}
  float fr=floor(uT*18.);
  float band=floor(uv.y*46.+fr*13.);
  float on=step(1.-I*.55,h(vec2(band*.37,fr)));uv.x+=(h(vec2(band,fr*1.7))-.5)*.09*I*on;
  vec2 blk=floor(uv*vec2(10.,16.));float bg=step(1.-I*I*.3,h(blk+fr*.31));
  uv+=bg*(vec2(h(blk+1.3+fr),h(blk+2.7+fr))-.5)*.07;
  float ca=.0004+.012*I*I+.004*I;
  vec3 col=vec3(look(uv+vec2(ca,0.)).r,look(uv).g,look(uv-vec2(ca,0.)).b);
  float snow=h(uv*uRes*.5+fract(uT*61.)*vec2(91.,17.));
  col=mix(col,vec3(.16,.2,.2)*(.6+.8*snow),I*.3);
  col+=vec3(snow*snow)*.16*I;
  float drop=step(.985-I*.06,h(vec2(floor(uv.y*120.),fr)));col=mix(col,vec3(.5,.62,.6)*snow,drop*I*.8);
  col*=.95+.05*sin(uv.y*uRes.y*1.6);
  vec2 q=vUv-.5;col*=1.-dot(q,q)*.7;
  col+=vec3(1.,.4,.3)*uFlash;
  col=mix(col,col*vec3(1.,.35,.3)+vec3(.25,0.,0.),uHurt*smoothstep(.25,.75,length(q)*1.4));
  col+=(h(vUv*uRes+uT)-.5)*.025;
  gl_FragColor=vec4(col,1.);}`});
function pass(mat,target){fsQuad.material=mat;R.setRenderTarget(target);R.render(fsScene,fsCam);}
/* draw one frame: world → dots → bloom → look. look: {thermal, interf, t, flash, hurt} */
function renderFrame(look){
  R.setRenderTarget(rtW);R.setClearColor(0x0b0d0f,1);R.clear();R.render(S,cam);
  R.setRenderTarget(rtS);R.setClearColor(0x000000,1);R.clear();R.render(DS,cam);
  downMat.uniforms.tA.value=rtS.texture;downMat.uniforms.uPx.value.set(1/rtS.width,1/rtS.height);pass(downMat,rtH1);
  const spread=look.thermal?2.2:1;
  blurMat.uniforms.tA.value=rtH1.texture;blurMat.uniforms.uD.value.set(spread/rtH1.width,0);pass(blurMat,rtH2);
  blurMat.uniforms.tA.value=rtH2.texture;blurMat.uniforms.uD.value.set(0,spread/rtH1.height);pass(blurMat,rtH1);
  downMat.uniforms.tA.value=rtH1.texture;downMat.uniforms.uPx.value.set(1/rtH1.width,1/rtH1.height);pass(downMat,rtQ1);
  blurMat.uniforms.tA.value=rtQ1.texture;blurMat.uniforms.uD.value.set(spread*1.6/rtQ1.width,0);pass(blurMat,rtQ2);
  blurMat.uniforms.tA.value=rtQ2.texture;blurMat.uniforms.uD.value.set(0,spread*1.6/rtQ1.height);pass(blurMat,rtQ1);
  const u=finMat.uniforms;u.tW.value=rtW.texture;u.tS.value=rtS.texture;u.tH.value=rtH1.texture;u.tQ.value=rtQ1.texture;u.uMode.value=look.thermal?1:0;u.uI.value=look.interf;u.uT.value=look.t;
  u.uPix.value=1+Math.floor(smooth(.45,.8,look.interf)*3)*PR;u.uRes.value.set(rtS.width,rtS.height);u.uFlash.value=look.flash||0;u.uHurt.value=look.hurt||0;
  pass(finMat,null);
}
