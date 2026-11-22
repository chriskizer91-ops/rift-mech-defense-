'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · WORLD TEST: THE LOOK (game/world/wt-look.js)
   How everything is drawn, three ways:
     REAL     the world as a camera sees it: Mud Lab's ground pictures (sand, mud, red dirt) and Ironhowl 4's (asphalt,
              paving, rock, the buildings), lit by a low sun. The swarms are not drawn at all.
     SENSOR   the threat overlay: the world dark, a faint green grid and contour lines; the swarms as red dots, the
              Wraith as an ally (green). The look is the threat library's (concept/swarm-viewer.src.html): its dot
              shader, its bloom, its colours, its interference and dropped frames, copied here.
     THERMAL  the library's ironbow colours over the world's own heat: the magma cracks hot, the sea cold, the land
              lukewarm, fresh craters and the trails the swarms leave warm.
   The ground's height is drawn from two textures: the ground as made (wt-map.js, every 50 cm) plus what's been done to
   it (wt-soil.js, every 25 cm). Its slope (and so its light) is worked out per pixel from them, so a footprint 25 cm
   deep shows wherever it is, whatever the mesh under it.
   ===================================================================================================================== */
const LOOK={tex:{},base:null,splat:null,u:{uT:{value:0},uRiftP:{value:Array.from({length:4},()=>new THREE.Vector4(0,-999,0,0))},uRiftO:{value:Array.from({length:4},()=>new THREE.Vector4(0,0,0,0))},uSun:{value:new THREE.Vector3(-.42,.74,-.52).normalize()}},
  ring:Array.from({length:16},()=>new THREE.Vector4(0,0,-99,0)),ringI:0,bow:new THREE.Vector4(),bowD:new THREE.Vector4(1,0,4,0)};
function lookTextures(){lookGLSL();
  const A=window.WT_ASSETS.tex,L=new THREE.TextureLoader();
  for(const k in A){const t=L.load(A[k]);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;LOOK.tex[k]=t;}
  for(const k of ['fx','smoke'])if(LOOK.tex[k])LOOK.tex[k].wrapS=LOOK.tex[k].wrapT=THREE.ClampToEdgeWrapping;
  /* the ground as made: height, crack, wet, the water's level (half floats, filtered) and what it's made of */
  const N=MAP.N,hb=new Uint16Array(N*N*4);for(let k=0;k<N*N;k++){hb[k*4]=soilHalf(MAP.hB[k]);hb[k*4+1]=soilHalf(MAP.crk[k]);hb[k*4+2]=soilHalf(MAP.wet[k]);hb[k*4+3]=soilHalf(MAP.wl[k]);}
  const B=LOOK.base=new THREE.DataTexture(hb,N,N,THREE.RGBAFormat,THREE.HalfFloatType);B.minFilter=B.magFilter=THREE.LinearFilter;B.needsUpdate=true;
  const mk=a=>{const S=new THREE.DataTexture(a,N,N,THREE.RGBAFormat);S.minFilter=S.magFilter=THREE.LinearFilter;S.needsUpdate=true;return S;};
  LOOK.splat=mk(MAP.spl);LOOK.splat2=mk(MAP.spl2);
  Object.assign(LOOK.u,{tBase:{value:B},tSplat:{value:LOOK.splat},tSplat2:{value:LOOK.splat2},tSoil:{value:soilMakeTex()},uWin:{value:SOIL.win},uRing:{value:LOOK.ring},uBow:{value:LOOK.bow},uBowD:{value:LOOK.bowD}});
  const T=MAP.def.tex;for(const k in T)LOOK.u['t_'+k]={value:LOOK.tex[T[k]]};
}
/* a ring through standing water (Mud Lab's mlWake): where, when, how strong. Sixteen at a time */
function lookRing(x,z,a){const r=LOOK.ring[LOOK.ringI];r.set(x,z,LOOK.u.uT.value,a);LOOK.ringI=(LOOK.ringI+1)&15;}

/* ---------- shader pieces shared by the ground and the water ---------- */
let GLSL_HEAD='';
function lookGLSL(){const f=v=>v.toFixed(3);const M=MAP.def.MOUTHS[0]||{w:6,h:8,s0:-5.5,s1:1.4};
GLSL_HEAD=`uniform sampler2D tBase,tSoil,tSplat,tSplat2;uniform float uT;uniform vec4 uRiftP[4],uRiftO[4],uWin;uniform vec3 uSun;
vec2 bUV(vec2 p){return ((p-(${f(MAP.X0)}))/${f(MAP.C)}+.5)/${MAP.N}.;}
vec4 bAll(vec2 p){return texture(tBase,bUV(p));}
float bH(vec2 p){return texture(tBase,bUV(p)).r;}
vec4 sAll(vec2 p){if(p.x<uWin.x||p.x>uWin.z||p.y<uWin.y||p.y>uWin.w)return vec4(0.);return texture(tSoil,(p-(${f(MAP.X0)}))/${f(SOIL.W*64*SOIL.C)});}
float gH(vec2 p){return bH(p)+sAll(p).r;}
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}
float soilHeat(vec4 S){return S.a*exp(-max(0.,uT-S.b)/30.);}
/* a rift's mouth: cut out of the scarp's face while it's open (each mouth: where, its floor, which way it faces) */
bool inMouth(vec3 w){for(int i=0;i<4;i++){vec4 P=uRiftP[i];float op=uRiftO[i].x;if(op<.01)continue;vec2 d=w.xz-P.xz;float sn=sin(P.w),cs=cos(P.w);
  float out_=d.x*sn+d.y*cs,acr=d.x*cs-d.y*sn;vec2 q=vec2(acr/${f(M.w)},(w.y-P.y)/${f(M.h)});
  if(out_>${f(M.s0)}&&out_<${f(M.s1)}&&q.y>-.12&&dot(q,q)<op*op)return true;}return false;}
/* the ground's normal: its slope as made (every 50 cm) and the soil's (every 25 cm) */
vec3 gNorm(vec2 xz,out vec3 nB){float e=${f(Math.max(.5,MAP.C))},q=.25;
  float hL=bH(xz-vec2(e,0.)),hR=bH(xz+vec2(e,0.)),hD=bH(xz-vec2(0.,e)),hU=bH(xz+vec2(0.,e));
  float sL=sAll(xz-vec2(q,0.)).r,sR=sAll(xz+vec2(q,0.)).r,sD=sAll(xz-vec2(0.,q)).r,sU=sAll(xz+vec2(0.,q)).r;
  nB=normalize(vec3((hL-hR)/(2.*e),1.,(hD-hU)/(2.*e)));
  return normalize(vec3((hL-hR)/(2.*e)+(sL-sR)/(2.*q),1.,(hD-hU)/(2.*e)+(sD-sU)/(2.*q)));}
`;}
const GLSL_GRID=`float gridL(vec2 p,float s,float w){vec2 f=abs(fract(p/s-.5)-.5)*s,fw=max(fwidth(p),vec2(1e-4));vec2 l=1.-smoothstep(fw*w*.5,fw*w*1.5,f);return max(l.x,l.y);}
`;
const TERR_VERT=()=>`vec3 transformed=vec3(position);{vec4 wq=modelMatrix*vec4(position,1.);transformed.y=gH(clamp(wq.xz,vec2(${(MAP.X0+.2).toFixed(2)}),vec2(${(MAP.X0+MAP.S-.2).toFixed(2)})));vWp=vec3(wq.x,transformed.y,wq.z);}`;

/* ---------- the ground, REAL ---------- */
function matTerrain(){
  const m=new THREE.MeshStandardMaterial({roughness:.9,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,LOOK.u);
    sh.vertexShader='varying vec3 vWp;\n'+GLSL_HEAD+sh.vertexShader.replace('#include <begin_vertex>',TERR_VERT());
    sh.fragmentShader='varying vec3 vWp;\nuniform sampler2D t_sand,t_mud,t_dirt,t_asph,t_pave,t_rock,t_meadow,t_plough,t_wheat;\n'+GLSL_HEAD+sh.fragmentShader
    .replace('#include <map_fragment>',`
      if(inMouth(vWp))discard;
      vec2 xz=vWp.xz;vec3 nB;vec3 nW=gNorm(xz,nB);vec4 B=bAll(xz),S=sAll(xz);vec4 sp=texture(tSplat,bUV(xz)),sp2=texture(tSplat2,bUV(xz));
      float sand=sp.r,mud=sp.g,asph=sp.b,pave=sp.a,mea=sp2.r,plo=sp2.g,whe=sp2.b,dirt=max(0.,1.-sand-mud-asph-pave-mea-plo-whe);
      float rock=smoothstep(.42,.7,1.-nB.y);
      vec3 cS=texture(t_sand,xz/5.).rgb;float dS=mix(1.,dot(cS,vec3(.33))/.24,.7)*mix(1.,dot(texture(t_sand,xz/23.).rgb,vec3(.33))/.24,.35);cS=vec3(.36,.29,.19)*dS;
      vec3 cM=texture(t_mud,xz/3.).rgb*vec3(.95,.92,.88);
      vec3 cD=texture(t_dirt,xz/5.).rgb*mix(.8,1.1,vn(xz*.07));
      vec3 cA=texture(t_asph,xz/7.).rgb*.85,cP=texture(t_pave,xz/5.).rgb*.9;
      vec3 an=abs(nB);vec3 cR=(texture(t_rock,vWp.zy/8.).rgb*an.x+texture(t_rock,vWp.xy/8.).rgb*an.z+texture(t_rock,xz/8.).rgb*an.y)/(an.x+an.y+an.z);
      cR*=vec3(.82,.78,.72);
      vec3 cG=texture(t_meadow,xz/6.).rgb*mix(.75,1.1,vn(xz*.03)),cL=texture(t_plough,xz/7.).rgb*.9,cW=texture(t_wheat,xz/5.).rgb*mix(.85,1.05,vn(xz*.05+3.));
      vec3 alb=cS*sand+cM*mud+cD*dirt+cA*asph+cP*pave+cG*mea+cL*plo+cW*whe;alb=mix(alb,cR,rock);
      float gh=B.r+S.r,under=smoothstep(.06,-.06,gh-B.a),wet=max(B.b,under);
      /* churned: turned over, darker, muddier; pressed: a little darker; burnt where shells landed */
      float ch=S.g;alb=mix(alb,alb*.5+cM*.28,ch*.72*(1.-asph*.6));
      alb*=1.-clamp(-S.r*.8,0.,.2)*(1.-asph);
      alb*=mix(1.,.45,smoothstep(.85,1.,ch)*smoothstep(-.25,-.9,S.r));
      alb*=mix(1.,.56,wet*(1.-.5*asph));
      alb*=mix(vec3(1.),vec3(.5,.62,.6),smoothstep(0.,4.,B.a-gh));
      float rough=mix(.94,.36,wet)*(1.-.15*asph);
      diffuseColor.rgb=alb;`)
    .replace('#include <roughnessmap_fragment>','float roughnessFactor=rough;')
    .replace('#include <normal_fragment_maps>','normal=normalize((viewMatrix*vec4(nW,0.)).xyz);')
    .replace('#include <emissivemap_fragment>',`{float c=B.g;float pul=.75+.25*sin(uT*1.7+xz.x*.31)*sin(uT*.9+xz.x*.13);totalEmissiveRadiance+=vec3(1.,.34,.06)*c*c*3.2*pul;}`);};
  return m;}
/* ---------- the water, REAL: muddy at its edge, dark further out; the sky in it; rings and a bow wave (Mud Lab's look)
   and the cracks' glow coming up through it ---------- */
function matWater(){
  const m=new THREE.MeshStandardMaterial({roughness:.07,metalness:0,transparent:true,envMapIntensity:.45});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,LOOK.u);
    sh.vertexShader='varying vec3 vWp;\n'+GLSL_HEAD+sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed=vec3(position);{vec4 wq=modelMatrix*vec4(position,1.);transformed.y=bAll(wq.xz).a;vWp=vec3(wq.x,transformed.y,wq.z);}');
    sh.fragmentShader='varying vec3 vWp;\nuniform vec4 uRing[16];uniform vec4 uBow,uBowD;\n'+GLSL_HEAD+sh.fragmentShader
    .replace('#include <map_fragment>',`
      vec2 p=vWp.xz;vec4 B=bAll(p);float gh=B.r+sAll(p).r,dep=B.a-gh;if(dep<-.002)discard;
      float sh=smoothstep(0.,.2,dep),deep=smoothstep(.4,7.,dep);
      vec3 wc=mix(vec3(.26,.27,.2),vec3(.03,.075,.085),deep);
      /* slopes on the surface: a slow swell, the rings, the bow wave */
      vec2 wg=vec2(0.);
      {vec2 d1=normalize(vec2(.3,1.)),d2=normalize(vec2(-.8,.6)),d3=normalize(vec2(.9,.2));
       wg+=d1*cos(dot(p,d1)*.55-uT*1.1)*.045+d2*cos(dot(p,d2)*1.3-uT*1.7)*.03+d3*cos(dot(p,d3)*2.9-uT*2.6)*.018;
       wg+=(vec2(vn(p*1.7+uT*.4),vn(p*1.7-uT*.37+9.))-.5)*.08;}
      for(int i=0;i<16;i++){vec4 e=uRing[i];float age=uT-e.z;if(age>0.&&age<3.2&&e.w>0.){vec2 q=p-e.xy;float d=length(q),x=d-.4-2.2*age;
        if(abs(x)<1.6)wg+=q/max(d,.05)*(e.w*exp(-x*x*2.2)/(1.+age*1.1)*(1.-age/3.2)*sin(x*6.));}}
      if(uBow.z>.01){vec2 q=p-uBow.xy,n=vec2(-uBowD.y,uBowD.x);float t=-dot(q,uBowD.xy),s=dot(q,n),x=abs(s)-uBow.w-t*.42;
        if(t>-.6&&t<uBowD.z)wg+=n*(sign(s)*uBow.z*1.6*(1.-t/uBowD.z)*exp(-x*x/(.5+t*.35))*sin(x*4.5-t*2.2));}
      wg*=.35+.65*sh;
      /* foam on the shore and round anything standing in the water */
      float fn=vn(p*2.3+vec2(uT*.3,0.))*.6+vn(p*6.1-uT*.5)*.4;
      float foam=smoothstep(.5,0.,dep)*smoothstep(.35,.75,fn+.25*sin(uT*1.5-dep*14.));
      foam+=clamp(length(wg)*1.4-.18,0.,.6)*smoothstep(3.,.2,dep);
      float al=mix(.2,.93,smoothstep(0.,3.,dep))*smoothstep(-.002,.06,dep);
      diffuseColor=vec4(mix(wc,vec3(.78,.8,.76),clamp(foam,0.,1.)*.75),clamp(al+foam*.4,0.,1.));
      vec3 nW=normalize(vec3(-wg.x,1.,-wg.y));
      float glow=B.g*exp(-dep*.12)*1.7;
      {float hl=0.;for(int k=0;k<6;k++){float a=float(k)*1.047;hl+=bAll(p+vec2(cos(a),sin(a))*2.6).g;}glow+=hl/6.*.9*exp(-dep*.1);}`)
    .replace('#include <roughnessmap_fragment>','float roughnessFactor=mix(.06,.5,clamp(foam,0.,1.));')
    .replace('#include <normal_fragment_maps>','normal=normalize((viewMatrix*vec4(nW,0.)).xyz);')
    .replace('#include <emissivemap_fragment>','totalEmissiveRadiance+=vec3(1.,.3,.05)*glow*(.8+.2*sin(uT*1.3+p.x*.2));');};
  return m;}

/* ---------- SENSOR and THERMAL ---------- */
/* what the world writes into the sensor's picture: R hostile (dots only), G the grid and the world's lines,
   B allies, A the world's heat (thermal) */
function matTerrainView(mode){
  return new THREE.ShaderMaterial({uniforms:LOOK.u,vertexShader:'varying vec3 vWp;\n'+GLSL_HEAD+`void main(){${TERR_VERT()}gl_Position=projectionMatrix*viewMatrix*vec4(vWp,1.);}`,
    fragmentShader:'varying vec3 vWp;\n'+GLSL_HEAD+GLSL_GRID+(mode===1?`
      void main(){if(inMouth(vWp))discard;vec2 xz=vWp.xz;vec3 nB;vec3 n=gNorm(xz,nB);float gh=gH(xz);
        float g=.025+.035*clamp(dot(n,normalize(vec3(-.3,1.,.5))),0.,1.)+gridL(xz,10.,1.3)*.3+gridL(xz,2.5,1.)*.06;
        float cf=fwidth(gh);float c=abs(fract(gh/2.-.5)-.5)*2.;g+=(1.-smoothstep(cf*.8,cf*2.2,c))*.12;
        if(gh<bAll(xz).a)g*=.5+.2*sin(vWp.z*3.+uT*2.);
        g*=1.-.6*smoothstep(60.,170.,distance(vWp,cameraPosition));
        gl_FragColor=vec4(0.,g,0.,0.);}`:`
      void main(){if(inMouth(vWp))discard;vec2 xz=vWp.xz;vec3 nB;vec3 n=gNorm(xz,nB);vec4 B=bAll(xz),S=sAll(xz);float gh=B.r+S.r,dep=B.a-gh;
        vec4 sp=texture(tSplat,bUV(xz));float ht;
        if(dep>0.){ht=.06+.03*smoothstep(2.5,0.,dep);float hl=0.;for(int k=0;k<6;k++){float a=float(k)*1.047;hl+=bAll(xz+vec2(cos(a),sin(a))*3.).g;}
          ht+=(B.g*.95+hl/6.*.45)*exp(-dep*.08);}
        else{ht=.24+.07*clamp(dot(n,uSun),0.,1.)+.03*vn(xz*.15)+.05*sp.b-.07*B.b+.04*sp.a;}
        ht+=soilHeat(S)*.8+S.g*.03;
        gl_FragColor=vec4(0.,0.,0.,ht);}`)});}
/* trees and buildings between the camera and the Wraith are cut away round it (dithered), so a lower camera still sees it;
   so is anything within 18 m of the camera */
const CUT={uMech:{value:new THREE.Vector3(-1e4,-1e4,0)},uCutR:{value:120}};
function cutout(m){m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,CUT);
  sh.fragmentShader='uniform vec3 uMech;uniform float uCutR;\n'+sh.fragmentShader.replace('void main() {',`void main() {
    {float d=length(gl_FragCoord.xy-uMech.xy);if(gl_FragCoord.z<uMech.z&&d<uCutR){float k=smoothstep(uCutR,uCutR*.55,d);
      float b=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));if(b<k)discard;}
     float vd=length(vViewPosition);if(vd<18.){float b=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));if(b<smoothstep(18.,10.,vd))discard;}}`);};}
const CUT_GLSL=`uniform vec3 uMech;uniform float uCutR;
void cutAway(float vd){float b=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  float d=length(gl_FragCoord.xy-uMech.xy);if(gl_FragCoord.z<uMech.z&&d<uCutR&&b<smoothstep(uCutR,uCutR*.55,d))discard;
  if(vd<18.&&b<smoothstep(18.,10.,vd))discard;}`;
/* buildings, rocks, wrecks and the Wraith in the sensor and thermal views */
const MESH_VERT=`varying vec3 vWp,vN;void main(){vec4 lp=vec4(position,1.);vec3 ln=normal;
#ifdef USE_INSTANCING
lp=instanceMatrix*lp;ln=mat3(instanceMatrix)*ln;
#endif
vec4 wq=modelMatrix*lp;vWp=wq.xyz;vN=normalize(mat3(modelMatrix)*ln);gl_Position=projectionMatrix*viewMatrix*wq;}`;
function matMeshView(mode,o){o=o||{};const u=Object.assign({uHeat:{value:o.heat||.3},uAlly:{value:o.ally?1:0},uK:{value:o.k||1},uT:LOOK.u.uT},CUT);
  return new THREE.ShaderMaterial({uniforms:u,vertexShader:MESH_VERT,side:o.side||THREE.FrontSide,
    fragmentShader:CUT_GLSL+`varying vec3 vWp,vN;uniform float uHeat,uAlly,uK,uT;
      float gridL(vec2 p,float s,float w){vec2 f=abs(fract(p/s-.5)-.5)*s,fw=max(fwidth(p),vec2(1e-4));vec2 l=1.-smoothstep(fw*w*.5,fw*w*1.5,f);return max(l.x,l.y);}
      void main(){`+(o.cut?'cutAway(distance(cameraPosition,vWp));':'')+`vec3 N=normalize(vN),V=normalize(cameraPosition-vWp);float fr=pow(1.-abs(dot(N,V)),2.);`+(mode===1?`
        if(uAlly>.5){gl_FragColor=vec4(0.,.03,(.16+fr*.7)*uK,0.);return;}
        float g=(.035+fr*.32+gridL(vWp.xz+vWp.y,4.,1.)*.05+gridL(vec2(vWp.y,0.),3.,1.)*.08*(1.-abs(N.y)))*uK;
        gl_FragColor=vec4(0.,g,0.,0.);}`:`
        gl_FragColor=vec4(0.,0.,0.,uHeat*(.88+.2*fr)+.03*N.y);}`)});}

/* ---------- the dots (the threat library's dot shader; size per dot, and it leaves the world's heat alone) ---------- */
const ADD={transparent:true,depthTest:false,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,
  blendEquationAlpha:THREE.AddEquation,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor};
const DOT_FRAG=`varying vec3 vC;varying float vA;uniform float uSoft;
void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;
 float core=exp(-r*r*mix(5.5,1.6,uSoft));gl_FragColor=vec4(vC*vA*core,0.);}`;
const dotMat=new THREE.ShaderMaterial(Object.assign({uniforms:{uSize:{value:.3},uScale:{value:1},uMin:{value:2},uMax:{value:48},uSoft:{value:0},uGain:{value:1},uT:{value:0}},
 vertexShader:`attribute vec3 aCol;attribute float aI,aS;uniform float uSize,uScale,uMin,uMax,uGain,uT;varying vec3 vC;varying float vA;
 void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
  float px=uSize*aS*uScale/max(.001,-mv.z);float cl=clamp(px,uMin,uMax);
  vA=aI*uGain*min(1.,px*px/(cl*cl)+.4);gl_PointSize=cl;vC=aCol;}`,
 fragmentShader:DOT_FRAG},ADD));

/* ---------- post: bloom + the sensor / thermal look + interference (the threat library's, with the world added) ---------- */
const FS_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const downMat=new THREE.ShaderMaterial({uniforms:{tA:{value:null},uPx:{value:new THREE.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uPx;varying vec2 vUv;void main(){vec2 o=uPx*.5;
 gl_FragColor=(texture2D(tA,vUv+vec2(-o.x,-o.y))+texture2D(tA,vUv+vec2(o.x,-o.y))+texture2D(tA,vUv+vec2(-o.x,o.y))+texture2D(tA,vUv+vec2(o.x,o.y)))*.25;}`});
const blurMat=new THREE.ShaderMaterial({uniforms:{tA:{value:null},uD:{value:new THREE.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uD;varying vec2 vUv;void main(){
 vec4 c=texture2D(tA,vUv)*.2270;c+=(texture2D(tA,vUv+uD*1.3846)+texture2D(tA,vUv-uD*1.3846))*.3162;
 c+=(texture2D(tA,vUv+uD*3.2308)+texture2D(tA,vUv-uD*3.2308))*.0703;gl_FragColor=c;}`});
const finMat=new THREE.ShaderMaterial({uniforms:{tS:{value:null},tH:{value:null},tQ:{value:null},uMode:{value:0},uI:{value:0},uT:{value:0},uPix:{value:1},
  uRes:{value:new THREE.Vector2()},uExp:{value:1.3},uFlash:{value:0}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tS,tH,tQ;uniform float uMode,uI,uT,uPix,uExp,uFlash;uniform vec2 uRes;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 iron(float t){t=clamp(t,0.,1.);
  vec3 a=vec3(.02,.02,.07),b=vec3(.22,.04,.42),c=vec3(.72,.08,.38),d=vec3(.97,.42,.06),e=vec3(1.,.83,.25),f=vec3(1.,1.,.92);
  return t<.2?mix(a,b,t/.2):t<.42?mix(b,c,(t-.2)/.22):t<.62?mix(c,d,(t-.42)/.2):t<.82?mix(d,e,(t-.62)/.2):mix(e,f,(t-.82)/.18);}
 vec3 look(vec2 uv){vec4 s=texture2D(tS,uv),bh=texture2D(tH,uv),bq=texture2D(tQ,uv);vec3 col;
  if(uMode<.5){float I=s.r+bh.r*.9+bq.r*.8;float A=s.b+bh.b*.9+bq.b*.6;float G=s.g+bh.g*.35;
   col=vec3(.011,.015,.019);
   col+=vec3(1.,.08,.035)*(1.-exp(-I*1.4))*1.05+vec3(1.,.48,.14)*smoothstep(1.2,5.,I)*.85+vec3(1.,.95,.85)*smoothstep(5.,18.,I)*.8;
   col+=vec3(.2,1.,.45)*(1.-exp(-A*1.5))+vec3(.9,1.,.9)*smoothstep(3.,9.,A)*.5;
   col+=vec3(.12,.5,.44)*G;}
  else{float Tm=(s.r*.25+bh.r*.9+bq.r*1.6+(s.b*.15+bh.b*.5+bq.b*.9)*.6)*uExp;
   float bg=.02+.03*h(floor(uv*uRes/6.)+floor(uT*3.));
   float wh=s.a*.9+bh.a*.25;
   col=iron(bg+wh+(1.-exp(-Tm))*.95);}
  return col;}
 void main(){vec2 uv=vUv;float I=uI;
  if(uPix>1.01){vec2 g=uRes/uPix;uv=(floor(uv*g)+.5)/g;}
  float fr=floor(uT*18.);
  float band=floor(uv.y*46.+fr*13.);
  float on=step(1.-I*.55,h(vec2(band*.37,fr)));uv.x+=(h(vec2(band,fr*1.7))-.5)*.09*I*on;
  vec2 blk=floor(uv*vec2(10.,16.));float bg=step(1.-I*I*.3,h(blk+fr*.31));
  uv+=bg*(vec2(h(blk+1.3+fr),h(blk+2.7+fr))-.5)*.07;
  float ca=.0012+.011*I;
  vec3 col=vec3(look(uv+vec2(ca,0.)).r,look(uv).g,look(uv-vec2(ca,0.)).b);
  float snow=h(uv*uRes*.5+fract(uT*61.)*vec2(91.,17.));
  col=mix(col,vec3(.16,.2,.2)*(.6+.8*snow),I*.42);
  col+=vec3(snow*snow)*.16*I;
  float drop=step(.985-I*.06,h(vec2(floor(uv.y*120.),fr)));col=mix(col,vec3(.5,.62,.6)*snow,drop*I*.8);
  col*=.93+.07*sin(uv.y*uRes.y*1.6);
  vec2 q=vUv-.5;col*=1.-dot(q,q)*.9;
  col+=vec3(1.,.4,.3)*uFlash;
  col+=(h(vUv*uRes+uT)-.5)*.025;
  gl_FragColor=vec4(col,1.);}`});
