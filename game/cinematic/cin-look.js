'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: THE LOOK (game/cinematic/cin-look.js, session D)
   The whole film is OVERWATCH's feed: the real world as a camera sees it, with the threat overlay drawn over it.
     1. the world (layer 0) into a half-float target, lit, in linear light
     2. the occluders (layer 2: the wall, the Wraiths, the guns) into the dot target's depth only, then the dots (layer 1)
        into its colour, additively (red hostile, green grid, blue allies), as in the threat library
     3. the library's bloom on the dots
     4. the finish: the world tone-mapped (ACES), the dots coloured for SENSOR or THERMAL over it, then the library's
        interference (tearing, blocks, colour fringing, static, pixelation) over everything. uClear = 1 is the three
        seconds when nothing is wrong with the picture at all.
   Dot shader, bloom and the sensor/thermal colours are concept/swarm-viewer.src.html's (session A), copied.
   ===================================================================================================================== */
const LOOK=(function(){
const T=THREE;
const FS_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const downMat=new T.ShaderMaterial({uniforms:{tA:{value:null},uPx:{value:new T.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uPx;varying vec2 vUv;void main(){vec2 o=uPx*.5;
 gl_FragColor=(texture2D(tA,vUv+vec2(-o.x,-o.y))+texture2D(tA,vUv+vec2(o.x,-o.y))+texture2D(tA,vUv+vec2(-o.x,o.y))+texture2D(tA,vUv+vec2(o.x,o.y)))*.25;}`});
const blurMat=new T.ShaderMaterial({uniforms:{tA:{value:null},uD:{value:new T.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uD;varying vec2 vUv;void main(){
 vec4 c=texture2D(tA,vUv)*.2270;c+=(texture2D(tA,vUv+uD*1.3846)+texture2D(tA,vUv-uD*1.3846))*.3162;
 c+=(texture2D(tA,vUv+uD*3.2308)+texture2D(tA,vUv-uD*3.2308))*.0703;gl_FragColor=c;}`});
const finMat=new T.ShaderMaterial({uniforms:{tR:{value:null},tS:{value:null},tH:{value:null},tQ:{value:null},uMode:{value:0},uI:{value:0},uT:{value:0},uPix:{value:1},
  uRes:{value:new T.Vector2()},uExp:{value:1},uFlash:{value:0},uReal:{value:1},uMono:{value:0},uWExp:{value:1},uClear:{value:0},uFade:{value:0},uDots:{value:1}},
 vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tR,tS,tH,tQ;uniform float uMode,uI,uT,uPix,uExp,uFlash,uReal,uMono,uWExp,uClear,uFade,uDots;uniform vec2 uRes;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
 vec3 iron(float t){t=clamp(t,0.,1.);
  vec3 a=vec3(.02,.02,.07),b=vec3(.22,.04,.42),c=vec3(.72,.08,.38),d=vec3(.97,.42,.06),e=vec3(1.,.83,.25),f=vec3(1.,1.,.92);
  return t<.2?mix(a,b,t/.2):t<.42?mix(b,c,(t-.2)/.22):t<.62?mix(c,d,(t-.42)/.2):t<.82?mix(d,e,(t-.62)/.2):mix(e,f,(t-.82)/.18);}
 vec3 look(vec2 uv){vec4 s=texture2D(tS,uv)*uDots,bh=texture2D(tH,uv)*uDots,bq=texture2D(tQ,uv)*uDots;
  vec3 w=pow(aces(texture2D(tR,uv).rgb*uWExp),vec3(1./2.2));float wl=dot(w,vec3(.3,.55,.15));
  vec3 col;
  if(uMode<.5){float I=s.r+bh.r*.9+bq.r*.8;float A=s.b+bh.b*.9+bq.b*.6;float G=s.g+bh.g*.35;
   vec3 sens=vec3(.011,.015,.019)+vec3(.05,.16,.14)*wl*1.6;
   col=mix(sens,mix(w,vec3(wl)*vec3(.55,.9,.85),uMono),uReal);
   col+=vec3(1.,.08,.035)*(1.-exp(-I*1.4))*1.05+vec3(1.,.48,.14)*smoothstep(1.2,5.,I)*.85+vec3(1.,.95,.85)*smoothstep(5.,18.,I)*.8;
   col+=vec3(.2,1.,.45)*(1.-exp(-A*1.5))+vec3(.9,1.,.9)*smoothstep(3.,9.,A)*.5;
   col+=vec3(.12,.5,.44)*G;}
  else{float Tm=(s.r*.25+bh.r*.9+bq.r*1.6+(s.b*.15+bh.b*.5+bq.b*.9)*.6)*uExp;
   float bg=.03+wl*.32+.02*h(floor(uv*uRes/6.)+floor(uT*3.))*(1.-uClear);
   col=iron(bg+(1.-exp(-Tm))*.95)+vec3(.05,.08,.08)*s.g;}
  return col;}
 void main(){vec2 uv=vUv;float I=uI*(1.-uClear);
  if(uPix>1.01){vec2 g=uRes/uPix;uv=(floor(uv*g)+.5)/g;}
  float fr=floor(uT*18.);
  float band=floor(uv.y*46.+fr*13.);
  float on=step(1.-I*.55,h(vec2(band*.37,fr)));uv.x+=(h(vec2(band,fr*1.7))-.5)*.09*I*on;
  vec2 blk=floor(uv*vec2(10.,16.));float bg=step(1.-I*I*.3,h(blk+fr*.31));
  uv+=bg*(vec2(h(blk+1.3+fr),h(blk+2.7+fr))-.5)*.07;
  float ca=(.0012+.011*I)*(1.-uClear);
  vec3 col=vec3(look(uv+vec2(ca,0.)).r,look(uv).g,look(uv-vec2(ca,0.)).b);
  float snow=h(uv*uRes*.5+fract(uT*61.)*vec2(91.,17.));
  col=mix(col,vec3(.16,.2,.2)*(.6+.8*snow),I*.42);
  col+=vec3(snow*snow)*.16*I;
  float drop=step(.985-I*.06,h(vec2(floor(uv.y*120.),fr)));col=mix(col,vec3(.5,.62,.6)*snow,drop*I*.8);
  col*=mix(.93+.07*sin(uv.y*uRes.y*1.6),1.,uClear);
  vec2 q=vUv-.5;col*=1.-dot(q,q)*mix(.9,.5,uClear);
  col+=vec3(1.,.4,.3)*uFlash;
  col+=(h(vUv*uRes+uT)-.5)*.025*(1.-uClear);
  col*=1.-uFade;
  gl_FragColor=vec4(col,1.);}`});
const depthMat=new T.MeshBasicMaterial({colorWrite:false});
const fsCam=new T.OrthographicCamera(-1,1,1,-1,0,1),fsScene=new T.Scene();
const fsQuad=new T.Mesh(new T.PlaneGeometry(2,2));fsQuad.frustumCulled=false;fsScene.add(fsQuad);
const L={finMat,R:null,HALF:true};
let rtR,rtS,rtH1,rtH2,rtQ1,rtQ2;
L.init=function(R){L.R=R;L.HALF=!!(R.extensions.has('EXT_color_buffer_float')||R.extensions.has('EXT_color_buffer_half_float'));};
L.resize=function(w,h){const FT=L.HALF?T.HalfFloatType:T.UnsignedByteType;
  const mk=(a,b,depth)=>new T.WebGLRenderTarget(a,b,{type:FT,format:T.RGBAFormat,depthBuffer:!!depth,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  [rtR,rtS,rtH1,rtH2,rtQ1,rtQ2].forEach(t=>t&&t.dispose());
  rtR=mk(w,h,1);rtS=mk(w,h,1);rtH1=mk(w>>1,h>>1);rtH2=mk(w>>1,h>>1);rtQ1=mk(w>>2,h>>2);rtQ2=mk(w>>2,h>>2);};
function pass(mat,target){fsQuad.material=mat;L.R.setRenderTarget(target);L.R.render(fsScene,fsCam);}
/* o: {real, mono, mode (0 sensor, 1 thermal), interf, pix, flash, clear, fade, exp, wexp, dots, t} */
L.render=function(scene,cam,o){const R=L.R;
  R.setClearColor(0x000000,1);
  cam.layers.set(0);R.setRenderTarget(rtR);R.clear();R.render(scene,cam);
  R.setRenderTarget(rtS);R.clear();
  cam.layers.set(2);scene.overrideMaterial=depthMat;const bg=scene.background;R.render(scene,cam);scene.overrideMaterial=null;
  R.autoClear=false;cam.layers.set(1);R.render(scene,cam);R.autoClear=true;cam.layers.set(0);
  downMat.uniforms.tA.value=rtS.texture;downMat.uniforms.uPx.value.set(1/rtS.width,1/rtS.height);pass(downMat,rtH1);
  const spread=o.mode>.5?2.2:1;
  blurMat.uniforms.tA.value=rtH1.texture;blurMat.uniforms.uD.value.set(spread/rtH1.width,0);pass(blurMat,rtH2);
  blurMat.uniforms.tA.value=rtH2.texture;blurMat.uniforms.uD.value.set(0,spread/rtH1.height);pass(blurMat,rtH1);
  downMat.uniforms.tA.value=rtH1.texture;downMat.uniforms.uPx.value.set(1/rtH1.width,1/rtH1.height);pass(downMat,rtQ1);
  blurMat.uniforms.tA.value=rtQ1.texture;blurMat.uniforms.uD.value.set(spread*1.6/rtQ1.width,0);pass(blurMat,rtQ2);
  blurMat.uniforms.tA.value=rtQ2.texture;blurMat.uniforms.uD.value.set(0,spread*1.6/rtQ1.height);pass(blurMat,rtQ1);
  const u=finMat.uniforms;u.tR.value=rtR.texture;u.tS.value=rtS.texture;u.tH.value=rtH1.texture;u.tQ.value=rtQ1.texture;
  u.uMode.value=o.mode;u.uI.value=o.interf;u.uT.value=o.t;u.uPix.value=o.pix;u.uRes.value.set(rtS.width,rtS.height);u.uFlash.value=o.flash;
  u.uExp.value=o.exp;u.uReal.value=o.real;u.uMono.value=o.mono;u.uWExp.value=o.wexp;u.uClear.value=o.clear;u.uFade.value=o.fade;u.uDots.value=o.dots;
  pass(finMat,null);};
/* the range rings and spokes of the sensor's grid, round the team (green channel) */
L.grid=function(radius){const ADD={transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor};
  const p=[],c=[];const ring=(r,a)=>{for(let i=0;i<160;i++){const a0=i/160*Math.PI*2,a1=(i+1)/160*Math.PI*2;
   p.push(Math.cos(a0)*r,0,Math.sin(a0)*r,Math.cos(a1)*r,0,Math.sin(a1)*r);c.push(0,a,0,0,a,0);}};
  for(let i=1;i<=10;i++)ring(i/10,(i%5===0?.5:.24)*(1-i/12));
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;p.push(Math.cos(a)*.04,0,Math.sin(a)*.04,Math.cos(a),0,Math.sin(a));c.push(0,.22,0,0,.02,0);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));
  const m=new T.LineBasicMaterial(Object.assign({vertexColors:true},ADD));const gr=new T.LineSegments(g,m);gr.scale.setScalar(radius);gr.position.y=.3;gr.frustumCulled=false;
  return {obj:gr,mat:m};};
return L;
})();
