'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: THE DROWNED SHELF BEFORE DAWN (game/cinematic/film/set-shelf.js, session D)
   Mission 6. The sea has pulled back off a wide flat shelf: wet sand and mud, tide channels, weed-covered rocks, a few
   old wrecks; the shore and low cliffs to the south (+z), the sea far out to the north. Three rifts are cracks in the
   open sand, glowing (A, B, C). The tide comes back in over the last minutes (o.tide: the sea's level).
   x east, z south, y up.  SHELF.h(x,z) ground.  SHELF.update(t, o): o = {tide, rifts:[k,k,k], dawn 0..1, churn}
   ===================================================================================================================== */
const SHELF=(function(){
const T=THREE,S={occ:[],u:{uT:{value:0},uTide:{value:-3},uDawn:{value:0},uCam:{value:new T.Vector3()},uRift:{value:[new T.Vector4(),new T.Vector4(),new T.Vector4()]},
  uChurn:{value:Array.from({length:16},()=>new T.Vector4())}}};
S.RIFTS=[{n:'A',x:-130,z:-190},{n:'B',x:150,z:-250},{n:'C',x:20,z:-400}];S.SURVEY={x:-40,z:60};
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
S.h=(x,z)=>{const base=-1.2+Math.min(0,z+300)*.004+Math.max(0,z-80)*.06+(z>140?Math.min(18,(z-140)*.35):0);const ch=Math.abs(Math.sin(x*.012+z*.004)*60+Math.sin(z*.011)*40-(x*.3));
  return base-1.1*Math.exp(-ch*ch/90)+Math.sin(x*.07+z*.05)*.25+Math.sin(x*.21-z*.17)*.12;};
const HG=`float hgt(vec2 q){float x=q.x,z=q.y;float base=-1.2+min(0.,z+300.)*.004+max(0.,z-80.)*.06+(z>140.?min(18.,(z-140.)*.35):0.);float ch=abs(sin(x*.012+z*.004)*60.+sin(z*.011)*40.-(x*.3));
  return base-1.1*exp(-ch*ch/90.)+sin(x*.07+z*.05)*.25+sin(x*.21-z*.17)*.12;}`;
const SKY=`uniform float uT,uDawn;
vec3 sky(vec3 d){float y=max(d.y,0.);vec3 hz=mix(vec3(.09,.1,.14),vec3(.32,.3,.32),uDawn),top=mix(vec3(.015,.02,.035),vec3(.12,.14,.19),uDawn);vec3 c=mix(hz,top,pow(y,.45));
  vec3 sd=normalize(vec3(.75,.04,.3));float sa=max(0.,dot(d,sd));c+=vec3(1.,.55,.32)*pow(sa,6.)*exp(-y*5.)*(.25+uDawn*.9);
  vec2 q=d.xz/(y+.1);float cl=fbm(q*.7+vec2(uT*.006,0.));c=mix(c,c*.6+vec3(.04,.04,.05)*(1.+uDawn*2.),smoothstep(.45,.8,cl)*smoothstep(0.,.15,y));
  float st=step(.9975,h2(floor(d.xz/(y+.05)*140.)))*smoothstep(.1,.4,y)*(1.-uDawn);c+=vec3(.5,.55,.7)*st*.4;return c;}`;
S.build=function(scene0){const g=new T.Group();scene0.add(g);S.group=g;
  const sky=new T.Mesh(new T.SphereGeometry(9000,32,16),new T.ShaderMaterial({uniforms:S.u,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=(projectionMatrix*modelViewMatrix*vec4(position,1.)).xyww;}`,
    fragmentShader:`varying vec3 vD;${NOISE}${SKY}void main(){gl_FragColor=vec4(sky(normalize(vD)),1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);g.add(sky);
  const N=320,geo=new T.PlaneGeometry(1800,1400,N,N);geo.rotateX(-Math.PI/2);geo.translate(0,0,-200);const P=geo.attributes.position;for(let i=0;i<P.count;i++)P.setY(i,S.h(P.getX(i),P.getZ(i)));geo.computeVertexNormals();
  const gm=new T.ShaderMaterial({uniforms:Object.assign({},S.u,T.UniformsLib.fog),fog:true,
    vertexShader:`varying vec3 vW;varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`varying vec3 vW;varying vec3 vN;uniform float uT,uDawn,uTide;uniform vec4 uRift[3];uniform vec4 uChurn[16];${NOISE}
    #include <fog_pars_fragment>
    void main(){vec2 p=vW.xz;vec3 n=normalize(vN);float rip=sin(p.x*1.3+fbm(p*.2)*8.)*.5+.5;
      vec3 sand=mix(vec3(.2,.19,.17),vec3(.28,.26,.22),fbm(p*.05))*(.8+.25*rip*smoothstep(.0,1.,fbm(p*.4)));float wet=.6+.4*smoothstep(-.4,.6,fbm(p*.09));
      vec3 col=sand*wet;float weed=smoothstep(.62,.7,fbm(p*.13+3.));col=mix(col,vec3(.08,.1,.06),weed*.8);
      float shine=smoothstep(.55,.75,fbm(p*.2+uT*.01))*(1.-weed);
      vec3 glow=vec3(0.);for(int i=0;i<3;i++){vec4 r=uRift[i];if(r.w<=0.)continue;vec2 q=p-r.xy;float a=atan(q.y,q.x);float crack=abs(q.y*.9+sin(q.x*.08+float(i))*10.+fbm(q*.06)*14.);
        float len=smoothstep(70.,20.,abs(q.x));float c=exp(-crack*crack*.05)*len;glow+=vec3(1.,.34,.07)*(c*2.2+exp(-length(q)*.035)*.35)*r.w*(.8+.2*sin(uT*5.+length(q)*.2));}
      float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}col*=1.-clamp(ch,0.,1.)*.35;
      vec3 sd=normalize(vec3(.75,.25+uDawn*.3,.3));float dif=max(0.,dot(n,sd));vec3 L=mix(vec3(.07,.08,.11),vec3(.26,.27,.3),uDawn)*(.6+.4*n.y)+vec3(1.,.7,.5)*dif*.35*uDawn;
      vec3 v=normalize(cameraPosition-vW);float spec=pow(max(0.,dot(reflect(-sd,n),v)),30.)*shine*(.2+uDawn*.6);
      gl_FragColor=vec4(col*L*1.6+vec3(.6,.5,.45)*spec*.4+glow,1.);
      #include <fog_fragment>
    }`});
  const ground=new T.Mesh(geo,gm);g.add(ground);S.occ.push(ground);
  /* the sea: far out at low tide, coming back over the flats */
  const sm=new T.ShaderMaterial({uniforms:S.u,fog:false,transparent:true,depthWrite:false,
    vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform vec3 uCam;uniform float uTide;uniform vec4 uRift[3];uniform vec4 uChurn[16];${NOISE}${SKY}${HG}
    void main(){vec2 p=vW.xz;float dist=length(uCam-vW);float dep=uTide-hgt(p);if(dep<-.05)discard;
      float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}
      float fd=smoothstep(700.,40.,dist);vec2 nz=(vec2(vn(p*.6+uT*.5),vn(p*.6-uT*.45+9.))-.5)*(.25+ch)*fd+vec2(0.,sin(p.y*.15+uT*1.2)*.05);
      vec3 n=normalize(vec3(-nz.x,1.,-nz.y));vec3 v=normalize(uCam-vW);float fr=.03+.97*pow(1.-max(dot(n,v),0.),5.);vec3 r=reflect(-v,n);r.y=abs(r.y);
      vec3 col=sky(r)*fr+vec3(.015,.02,.025)*(1.-fr);
      for(int i=0;i<3;i++){vec4 rr=uRift[i];if(rr.w<=0.)continue;float d=length(p-rr.xy);col+=vec3(1.,.32,.06)*exp(-d*.04)*rr.w*.6*smoothstep(0.,1.2,dep);}
      float foam=smoothstep(.35,0.,dep)*(.4+.6*fbm(p*.5+vec2(0.,uT*.7)))+ch*smoothstep(.5,.8,fbm(p*.4+uT))*.6;col=mix(col,vec3(.3,.31,.33)*(.4+uDawn*.6),clamp(foam,0.,1.)*.75);
      col=mix(col,mix(vec3(.04,.045,.06),vec3(.2,.2,.22),uDawn),(1.-exp(-dist*.0011))*.85);gl_FragColor=vec4(col,smoothstep(-.05,.25,dep));}`});
  const sg=new T.PlaneGeometry(8000,8000);sg.rotateX(-Math.PI/2);const sea=new T.Mesh(sg,sm);sea.frustumCulled=false;sea.renderOrder=1;sea.onBeforeRender=(r,s,cam)=>S.u.uCam.value.copy(cam.position);g.add(sea);S.sea=sea;
  S.riftL=S.RIFTS.map(r=>{const L=new T.PointLight(0xff5a1a,90,110,1.4);L.position.set(r.x,2,r.z);g.add(L);return L;});
  /* rocks with weed, two old wrecks, the survey truck and its lights */
  const stone=new T.MeshStandardMaterial({color:0x2c2e2a,roughness:1,flatShading:true}),rust=new T.MeshStandardMaterial({color:0x4a3022,roughness:.9,metalness:.3});
  let sd=17;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};
  for(let i=0;i<70;i++){const x=-600+rnd()*1200,z=-560+rnd()*640;const r=new T.Mesh(new T.DodecahedronGeometry(.8+rnd()*3,0),stone);r.position.set(x,S.h(x,z)+.2,z);r.scale.y=.5;r.rotation.set(rnd()*3,rnd()*3,rnd()*3);g.add(r);S.occ.push(r);}
  for(const [x,z,ry] of [[-260,-120,.6],[230,-60,2.2]]){const w=new T.Mesh(new T.BoxGeometry(7,4,24),rust);w.position.set(x,S.h(x,z)+.8,z);w.rotation.set(.15,ry,.3);g.add(w);S.occ.push(w);}
  const tm=new T.MeshStandardMaterial({color:0xc8c0a8,roughness:.6,metalness:.3}),dark=new T.MeshStandardMaterial({color:0x202224,roughness:.8});
  const tr=new T.Group();tr.position.set(S.SURVEY.x+8,S.h(S.SURVEY.x+8,S.SURVEY.z),S.SURVEY.z);tr.rotation.y=.4;g.add(tr);
  for(const [w,h,d,y,z,m] of [[2.4,1.4,5,1.1,0,tm],[2.4,1.6,2,1.8,2.8,tm],[2.4,.5,5.8,.4,.3,dark]]){const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(0,y,z);tr.add(b);S.occ.push(b);}
  S.survL=[];for(const dx of [-.8,.8]){const L=new T.SpotLight(0xfff0d0,30,140,.4,.5,1.4);L.position.set(S.SURVEY.x+8+dx,S.h(S.SURVEY.x+8,S.SURVEY.z)+2,S.SURVEY.z-3);L.target.position.set(S.SURVEY.x-10,-1,S.SURVEY.z-120);g.add(L);g.add(L.target);S.survL.push(L);}
  /* the low cliffs along the shore */
  const cl=new T.Mesh(new T.BoxGeometry(2000,40,60),new T.MeshStandardMaterial({color:0x2a2a28,roughness:1}));cl.position.set(0,10,250);g.add(cl);
  g.add(S.hemi=new T.HemisphereLight(0x3a4458,0x15130f,.5));S.sun=new T.DirectionalLight(0xffb48a,.0);S.sun.position.set(700,120,300);g.add(S.sun);
  S.fog=new T.FogExp2(0x0e1016,.0016);scene0.fog=S.fog;return S;};
S.update=function(t,o){o=o||{};S.u.uT.value=t;const dw=o.dawn||0;S.u.uDawn.value=dw;S.u.uTide.value=o.tide==null?-3:o.tide;
  S.RIFTS.forEach((r,i)=>{const k=o.rifts?o.rifts[i]:1;S.u.uRift.value[i].set(r.x,r.z,0,k);S.riftL[i].intensity=90*k*(.85+.15*Math.sin(t*6+i));});
  const C=S.u.uChurn.value;for(let i=0;i<16;i++){const c=o.churn&&o.churn[i];if(c)C[i].set(c.x,c.z,c.r,c.k);else C[i].w=0;}
  S.hemi.intensity=.5+dw*.45;S.sun.intensity=dw*.7;S.fog.color.setRGB(.055+dw*.2,.063+dw*.2,.086+dw*.2);};
return S;
})();
