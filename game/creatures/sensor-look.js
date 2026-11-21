/* Rift Mech Defense: the sensor look, as one module (session A). Plain script; needs window.THREE. Gives window.RMD.SensorView.

   const view = new RMD.SensorView(renderer);   // makes its own render targets
   view.resize(w, h);                             // CSS pixels; uses the renderer's pixel ratio
   view.render(scene, camera, {thermal, interf, flash, exposure});
   view.pxScale(camera)                           // pixels per metre at distance 1, for the dot shaders
   view.skip(now, stutter)                        // true = drop this frame (hold the last one); stutter 0..1
   RMD.SensorView.grid(radius)                    // range rings, spokes and the sweep, drawn in the grid channel

   Channels: dots write red = hostile, green = grid and markers, blue = allies, additively, into a half-float target.
   The final pass colours them for SENSOR or THERMAL, adds bloom, then the interference (tearing, blocks, colour
   fringing, static, pixelation). Same as the threat library viewer (concept/swarm-viewer.src.html). */
(function(){
'use strict';
const T=THREE;
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const ADD={transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor};
const FS_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const downMat=new T.ShaderMaterial({uniforms:{tA:{value:null},uPx:{value:new T.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uPx;varying vec2 vUv;void main(){vec2 o=uPx*.5;
 gl_FragColor=(texture2D(tA,vUv+vec2(-o.x,-o.y))+texture2D(tA,vUv+vec2(o.x,-o.y))+texture2D(tA,vUv+vec2(-o.x,o.y))+texture2D(tA,vUv+vec2(o.x,o.y)))*.25;}`});
const blurMat=new T.ShaderMaterial({uniforms:{tA:{value:null},uD:{value:new T.Vector2()}},vertexShader:FS_V,depthTest:false,depthWrite:false,
 fragmentShader:`uniform sampler2D tA;uniform vec2 uD;varying vec2 vUv;void main(){
 vec4 c=texture2D(tA,vUv)*.2270;c+=(texture2D(tA,vUv+uD*1.3846)+texture2D(tA,vUv-uD*1.3846))*.3162;
 c+=(texture2D(tA,vUv+uD*3.2308)+texture2D(tA,vUv-uD*3.2308))*.0703;gl_FragColor=c;}`});
const finMat=new T.ShaderMaterial({uniforms:{tS:{value:null},tH:{value:null},tQ:{value:null},uMode:{value:0},uI:{value:0},uT:{value:0},uPix:{value:1},
  uRes:{value:new T.Vector2()},uExp:{value:1},uFlash:{value:0}},vertexShader:FS_V,depthTest:false,depthWrite:false,
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
   float bg=.05+.035*h(floor(uv*uRes/6.)+floor(uT*3.))+.04*uv.y;
   col=iron(bg+ (1.-exp(-Tm))*.95)+vec3(.05,.08,.08)*s.g;}
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
  // interference: fog, snow, dropouts
  float snow=h(uv*uRes*.5+fract(uT*61.)*vec2(91.,17.));
  col=mix(col,vec3(.16,.2,.2)*(.6+.8*snow),I*.42);
  col+=vec3(snow*snow)*.16*I;
  float drop=step(.985-I*.06,h(vec2(floor(uv.y*120.),fr)));col=mix(col,vec3(.5,.62,.6)*snow,drop*I*.8);
  col*=.93+.07*sin(uv.y*uRes.y*1.6);
  vec2 q=vUv-.5;col*=1.-dot(q,q)*.9;
  col+=vec3(1.,.4,.3)*uFlash;
  col+=(h(vUv*uRes+uT)-.5)*.025;
  gl_FragColor=vec4(col,1.);}`});

class SensorView{
  constructor(R){this.R=R;const half=!!(R.extensions.has('EXT_color_buffer_float')||R.extensions.has('EXT_color_buffer_half_float'));
    this.type=half?T.HalfFloatType:T.UnsignedByteType;this.half=half;this.fsCam=new T.OrthographicCamera(-1,1,1,-1,0,1);this.fsScene=new T.Scene();
    this.quad=new T.Mesh(new T.PlaneGeometry(2,2));this.quad.frustumCulled=false;this.fsScene.add(this.quad);this.hold=0;this.t0=performance.now();this.resize(innerWidth,innerHeight);}
  mk(w,h){return new T.WebGLRenderTarget(Math.max(1,w),Math.max(1,h),{type:this.type,format:T.RGBAFormat,depthBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});}
  resize(w,h){const pr=this.R.getPixelRatio();this.W=w;this.H=h;const W=Math.floor(w*pr),H=Math.floor(h*pr);
    [this.S,this.H1,this.H2,this.Q1,this.Q2].forEach(t=>t&&t.dispose());this.S=this.mk(W,H);this.H1=this.mk(W>>1,H>>1);this.H2=this.mk(W>>1,H>>1);this.Q1=this.mk(W>>2,H>>2);this.Q2=this.mk(W>>2,H>>2);}
  pxScale(cam){return (this.H*this.R.getPixelRatio())/(2*Math.tan(cam.fov*Math.PI/360));}
  skip(now,stut){if(now<this.hold)return true;if(stut>0&&Math.random()<stut*.22)this.hold=now+30+Math.random()*Math.random()*260*stut;return false;}
  pass(m,t){this.quad.material=m;this.R.setRenderTarget(t);this.R.render(this.fsScene,this.fsCam);}
  render(scene,cam,o={}){const R=this.R,th=!!o.thermal,I=Math.min(1,Math.max(0,o.interf||0));
    R.setRenderTarget(this.S);R.setClearColor(0x000000,1);R.clear();R.render(scene,cam);
    downMat.uniforms.tA.value=this.S.texture;downMat.uniforms.uPx.value.set(1/this.S.width,1/this.S.height);this.pass(downMat,this.H1);
    const sp=th?2.2:1;
    blurMat.uniforms.tA.value=this.H1.texture;blurMat.uniforms.uD.value.set(sp/this.H1.width,0);this.pass(blurMat,this.H2);
    blurMat.uniforms.tA.value=this.H2.texture;blurMat.uniforms.uD.value.set(0,sp/this.H1.height);this.pass(blurMat,this.H1);
    downMat.uniforms.tA.value=this.H1.texture;downMat.uniforms.uPx.value.set(1/this.H1.width,1/this.H1.height);this.pass(downMat,this.Q1);
    blurMat.uniforms.tA.value=this.Q1.texture;blurMat.uniforms.uD.value.set(sp*1.6/this.Q1.width,0);this.pass(blurMat,this.Q2);
    blurMat.uniforms.tA.value=this.Q2.texture;blurMat.uniforms.uD.value.set(0,sp*1.6/this.Q1.height);this.pass(blurMat,this.Q1);
    const u=finMat.uniforms;u.tS.value=this.S.texture;u.tH.value=this.H1.texture;u.tQ.value=this.Q1.texture;u.uMode.value=th?1:0;u.uI.value=I;
    u.uT.value=(performance.now()-this.t0)/1000;u.uPix.value=1+Math.floor(ss(.45,1,I)*7)*R.getPixelRatio();u.uRes.value.set(this.S.width,this.S.height);
    u.uFlash.value=o.flash||0;u.uExp.value=o.exposure||1.3;this.pass(finMat,null);}
}
SensorView.grid=function(radius){const p=[],c=[];const ring=(r,a)=>{for(let i=0;i<96;i++){const a0=i/96*Math.PI*2,a1=(i+1)/96*Math.PI*2;
  p.push(Math.cos(a0)*r,0,Math.sin(a0)*r,Math.cos(a1)*r,0,Math.sin(a1)*r);c.push(0,a,0,0,a,0);}};
 for(let i=1;i<=10;i++)ring(i/10,(i%5===0?.55:.28)*(1-i/12));
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;p.push(Math.cos(a)*.1,0,Math.sin(a)*.1,Math.cos(a),0,Math.sin(a));c.push(0,.26,0,0,.02,0);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));
 const grp=new T.Group();grp.add(new T.LineSegments(g,new T.LineBasicMaterial(Object.assign({vertexColors:true},ADD))));
 const sp=[],sc=[];const N=40,span=Math.PI*.42;
 for(let i=0;i<N;i++){const a0=-i/N*span,a1=-(i+1)/N*span,f0=Math.pow(1-i/N,2.2)*.22,f1=Math.pow(1-(i+1)/N,2.2)*.22;
  sp.push(0,0,0,Math.cos(a0),0,Math.sin(a0),Math.cos(a1),0,Math.sin(a1));sc.push(0,f0,0,0,f0,0,0,f1,0);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(sp,3));sg.setAttribute('color',new T.Float32BufferAttribute(sc,3));
 const sweep=new T.Mesh(sg,new T.MeshBasicMaterial(Object.assign({vertexColors:true,side:T.DoubleSide},ADD)));sweep.position.y=.001;grp.add(sweep);grp.userData.sweep=sweep;
 grp.scale.setScalar(radius);return grp;};
SensorView.ADD=ADD;
window.RMD=window.RMD||{};window.RMD.SensorView=SensorView;
})();
