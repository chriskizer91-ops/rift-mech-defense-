'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: ARLEN BAY AT NIGHT (game/cinematic/cin-world.js, session D)
   The real world of the reveal, drawn the ordinary way (lit, fogged, in linear light; the look pass tone-maps it):
     the sky: low cloud lit red from below where the rifts are; a moon behind the cloud
     the bay: black water, waves in the normals, the sky in its reflection, magma veins glowing far under it,
              brightest round the four rifts
     the harbour wall the four Wraiths stand on, its lamps, bollards and cranes; the town behind, mostly dark
     the lighthouse at the end of the wall, its beam turning
     the ridge to the west and ANVIL's three old guns on it, the crew round a tablet
   x runs east, z south, y up; the bay is north (−z). The wall's top is at y = 5.5.
   ===================================================================================================================== */
const WORLD=(function(){
const T=THREE;
const W={barrels:[],occluders:[],u:{uT:{value:0},uGlow:{value:1},uBeam:{value:0},uRift:{value:Array.from({length:4},()=>new T.Vector4())},uExpo:{value:1}},lamps:[]};
const GLOWDIR=new T.Vector3(-.1,0,-1).normalize();
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
/* the sky, used by the dome and by the water's reflection */
const SKY=`uniform float uT,uGlow;uniform vec4 uRift[4];
vec3 sky(vec3 d){float y=max(d.y,0.);vec3 c=mix(vec3(.009,.011,.017),vec3(.0016,.002,.0035),pow(y,.45));
  vec2 q=d.xz/(y+.12);float cl=fbm(q*1.6+vec2(uT*.012,uT*.004));float cov=smoothstep(.4,.75,cl)*smoothstep(.015,.14,y);
  float north=pow(max(0.,dot(normalize(vec3(d.x,0.,d.z)+1e-5),normalize(vec3(-.1,0.,-1.)))),4.);
  float low=exp(-y*9.);vec3 red=vec3(1.,.24,.07)*(north*.95+.04)*low*uGlow;
  c+=cov*(vec3(.006,.007,.009)+red*.32);c+=red*.07;
  vec3 md=normalize(vec3(.55,.32,.4));float mo=max(0.,dot(d,md));c+=vec3(.5,.55,.65)*(pow(mo,900.)*1.2+pow(mo,24.)*.025)*(1.-cov*.9);
  return c;}`;
/* ---------- sky dome ---------- */
function sky(scene){const m=new T.ShaderMaterial({uniforms:W.u,side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:`varying vec3 vD;${NOISE}${SKY}void main(){gl_FragColor=vec4(sky(normalize(vD)),1.);}`});
  const s=new T.Mesh(new T.SphereGeometry(9000,48,24),m);s.renderOrder=-10;s.frustumCulled=false;
  s.onBeforeRender=(r,sc,cam)=>s.position.copy(cam.position);scene.add(s);}
/* ---------- the bay ---------- */
function water(scene){const m=new T.ShaderMaterial({uniforms:Object.assign({uCam:{value:new T.Vector3()}},W.u),fog:false,
  vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`varying vec3 vW;uniform vec3 uCam;uniform float uBeam;${NOISE}${SKY}
  vec2 wv(vec2 p,vec2 d,float k,float a,float s){float ph=dot(p,d)*k+uT*s;return d*cos(ph)*k*a;}
  void main(){vec2 p=vW.xz;float dist=length(uCam-vW);
   vec2 g=wv(p,normalize(vec2(.3,-1.)),.09,.5,1.3)+wv(p,normalize(vec2(-.7,-.6)),.17,.22,1.9)+wv(p,normalize(vec2(.9,-.2)),.31,.1,2.7)+wv(p,normalize(vec2(-.2,.9)),.6,.04,3.6);
   float fd=smoothstep(900.,60.,dist);vec2 nz=(vec2(vn(p*.7+uT*.3),vn(p*.7-uT*.27+9.))-.5)*.25*fd;
   vec3 n=normalize(vec3(-g.x-nz.x,1.,-g.y-nz.y)*vec3(mix(.15,1.,fd),1.,mix(.15,1.,fd)));
   vec3 v=normalize(uCam-vW);float fr=.02+.98*pow(1.-max(dot(n,v),0.),5.);
   vec3 r=reflect(-v,n);r.y=abs(r.y);vec3 col=sky(r)*fr*1.0;
   /* the magma under the sea: veins far down, brightest round the rifts */
   float near=0.;for(int i=0;i<4;i++){float d=length(p-uRift[i].xz);near+=exp(-d/(260.+uRift[i].w*260.))*uRift[i].w;}
   float vein=abs(fbm(p*.0042+3.1)-.5);vein=exp(-vein*vein*900.)*.9+exp(-abs(fbm(p*.011+7.)-.5)*40.)*.35;
   float pulse=.75+.25*sin(uT*1.3+fbm(p*.002)*9.);
   vec3 mag=vec3(1.,.28,.05)*(vein*(.03+near*.9)+near*.22)*pulse*uGlow;
   col+=mag*(1.-fr)*.4*smoothstep(4000.,600.,dist+0.)*mix(.35,1.,smoothstep(400.,60.,uCam.y));
   /* the lighthouse beam sweeping across the swell */
   vec2 lh=vec2(250.,-20.);vec2 bd=vec2(cos(uBeam),sin(uBeam));vec2 to=p-lh;float al=dot(to,bd);
   float bw=exp(-pow(abs(to.x*bd.y-to.y*bd.x)/(4.+al*.05),2.))*step(0.,al)*exp(-al/500.);col+=vec3(1.,.93,.8)*bw*fr*.35;
   float fog=1.-exp(-dist*.00042);col=mix(col,vec3(.006,.007,.01)+vec3(.022,.005,.002)*uGlow,fog*.85);
   gl_FragColor=vec4(col,1.);}`});
  const g=new T.PlaneGeometry(16000,16000,1,1);g.rotateX(-Math.PI/2);const w=new T.Mesh(g,m);w.frustumCulled=false;scene.add(w);
  w.onBeforeRender=(r,s,cam)=>m.uniforms.uCam.value.copy(cam.position);W.water=w;}
/* ---------- textures from the build ---------- */
function tex(k,rep){const A=window.CIN_ASSETS&&window.CIN_ASSETS.tex[k];if(!A)return null;const t=new T.TextureLoader().load(A);t.wrapS=t.wrapT=T.RepeatWrapping;
  t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(rep)t.repeat.set(rep[0],rep[1]);return t;}
const occ=o=>{W.occluders.push(o);return o;};
/* soft round glow, for lamps (additive sprite) */
const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  const t=new T.CanvasTexture(c);return t;})();
function glow(scene,pos,col,size,k){const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:col,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
  s.position.copy(pos);s.scale.setScalar(size);s.material.color.multiplyScalar(k||1);scene.add(s);return s;}
/* ---------- the harbour wall, its lamps, the cranes, the town ---------- */
function harbour(scene){
  const conc=new T.MeshStandardMaterial({map:tex('conc',[60,1.6]),normalMap:tex('concN',[60,1.6]),color:0x8b8e92,roughness:.9,metalness:0});
  const top=new T.MeshStandardMaterial({map:tex('pave',[80,3]),normalMap:tex('paveN',[80,3]),color:0x6e7074,roughness:.75,metalness:0});
  const wall=occ(new T.Mesh(new T.BoxGeometry(520,9.5,16),[conc,conc,top,conc,conc,conc]));wall.position.set(-10,5.5-4.75,2);scene.add(wall);
  /* a lower quay behind it, and the mole curving back to land */
  const quay=occ(new T.Mesh(new T.BoxGeometry(520,4,60),[conc,conc,top,conc,conc,conc]));quay.position.set(-10,1,40);scene.add(quay);
  const steel=new T.MeshStandardMaterial({color:0x1a1c1f,roughness:.6,metalness:.7});
  for(let x=-250;x<=240;x+=22){const b=new T.Mesh(new T.CylinderGeometry(.35,.42,.9,10),steel);b.position.set(x,5.95,-5.4);scene.add(b);}
  /* lamp posts along the wall: sodium lamps, a few dead */
  for(let i=0,x=-240;x<=230;x+=40,i++){const post=occ(new T.Mesh(new T.CylinderGeometry(.12,.16,9,8),steel));post.position.set(x,10,8.5);scene.add(post);
    const arm=new T.Mesh(new T.BoxGeometry(.12,.12,2.2),steel);arm.position.set(x,14.4,7.6);scene.add(arm);
    const dead=i%4===2;if(dead)continue;const lp=new T.Vector3(x,14.2,6.6);
    const L=new T.PointLight(0xffa04a,dead?0:55,38,1.6);L.position.copy(lp);scene.add(L);W.lamps.push(L);glow(scene,lp,new T.Color(1,.62,.28),5.5,1.4);}
  /* cranes behind on the quay: dark silhouettes against the cloud */
  const cm=new T.MeshStandardMaterial({color:0x14161a,roughness:.8,metalness:.4});
  for(const [x,z,r] of [[-170,52,.2],[-120,58,-.3],[120,55,.6]]){const g=new T.Group();
    for(const [lx,lz] of [[-5,-4],[5,-4],[-5,4],[5,4]]){const l=new T.Mesh(new T.BoxGeometry(.9,34,.9),cm);l.position.set(lx,17,lz);g.add(l);}
    const b=new T.Mesh(new T.BoxGeometry(14,5,10),cm);b.position.y=36;g.add(b);const j=new T.Mesh(new T.BoxGeometry(2,2,70),cm);j.position.set(0,39,-22);g.add(j);
    const c2=new T.Mesh(new T.BoxGeometry(2,2,22),cm);c2.position.set(0,39,22);g.add(c2);g.position.set(x,3,z);g.rotation.y=r;scene.add(g);
    glow(scene,new T.Vector3(x,45,z),new T.Color(1,.15,.1),3,1.2);}
  /* the town: a skyline far behind, a few windows still lit */
  const sk=tex('skyline');if(sk){sk.wrapS=T.RepeatWrapping;sk.repeat.set(3,1);
    const m=new T.MeshBasicMaterial({map:sk,color:0x2a2c33,transparent:true,depthWrite:false,fog:false});const p=new T.Mesh(new T.PlaneGeometry(3200,320),m);p.position.set(0,150,1400);p.rotation.y=Math.PI;scene.add(p);}
  const wp=[];for(let i=0;i<500;i++){const a=(Math.random()-.5)*2.6,r=520+Math.random()*700;wp.push(Math.sin(a)*r,4+Math.random()*Math.random()*60,80+Math.cos(a)*r*.6+Math.random()*200);}
  const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wp,3));
  scene.add(new T.Points(wg,new T.PointsMaterial({color:new T.Color(1,.72,.4).multiplyScalar(1.6),size:1.8,sizeAttenuation:true,fog:true})));}
/* ---------- the lighthouse at the end of the wall ---------- */
function lighthouse(scene){const g=new T.Group();g.position.set(250,5.5,-20);scene.add(g);
  const wm=new T.MeshStandardMaterial({color:0xb8b2a8,roughness:.8,map:tex('conc',[3,6])});const rm=new T.MeshStandardMaterial({color:0x5a1610,roughness:.7});
  const base=occ(new T.Mesh(new T.CylinderGeometry(14,16,6,24),wm));base.position.y=-2;g.add(base);
  for(let i=0;i<4;i++){const s=occ(new T.Mesh(new T.CylinderGeometry(4.6-i*.45,5-i*.45,8,20),i%2?rm:wm));s.position.y=4+i*8;g.add(s);}
  const gal=new T.Mesh(new T.CylinderGeometry(4.6,4.6,.6,20),new T.MeshStandardMaterial({color:0x111214}));gal.position.y=36.3;g.add(gal);
  const lamp=new T.Mesh(new T.CylinderGeometry(2.6,2.6,3.6,16),new T.MeshBasicMaterial({color:new T.Color(1,.9,.7).multiplyScalar(3)}));lamp.position.y=38.4;g.add(lamp);
  const cap=new T.Mesh(new T.ConeGeometry(3.4,3,16),new T.MeshStandardMaterial({color:0x111214}));cap.position.y=41.7;g.add(cap);
  glow(scene,new T.Vector3(250,44,-20),new T.Color(1,.92,.75),26,1.3);
  /* the beam: a long soft cone, turning */
  const bg=new T.ConeGeometry(70,900,32,1,true);bg.translate(0,-450,0);bg.rotateX(-Math.PI/2);
  const bm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false,
    vertexShader:`varying float vZ,vD;varying vec3 vN,vV;void main(){vZ=position.z/900.;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;vV=normalize(-mv.xyz);vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vZ,vD;varying vec3 vN,vV;void main(){float e=pow(abs(dot(vN,vV)),2.);gl_FragColor=vec4(vec3(1.,.9,.75)*e*.03*(1.-vZ)*smoothstep(0.,.02,vZ)*smoothstep(120.,420.,vD),1.);}`});
  const beam=new T.Mesh(bg,bm);beam.position.set(0,38.4,0);g.add(beam);W.beam=beam;}
/* ---------- the ridge to the west, and ANVIL's battery on it ---------- */
function ridge(scene){
  const rock=new T.MeshStandardMaterial({map:tex('rock',[14,14]),normalMap:tex('rockN',[14,14]),color:0x4a4640,roughness:.95});
  const pts=[];for(let i=0;i<=24;i++){const u=i/24;pts.push(new T.Vector2(Math.max(.01,(1-u)*520),Math.pow(Math.sin(u*Math.PI/2),1.4)*92));}
  const rg=new T.LatheGeometry(pts,48);const rm=occ(new T.Mesh(rg,rock));rm.scale.set(1.6,1,.8);rm.position.set(-880,-6,250);scene.add(rm);W.ridgeTop=new T.Vector3(-880,86,250);
  const gm=new T.MeshStandardMaterial({color:0x2b2e2a,roughness:.7,metalness:.5,map:tex('metal',[2,2])});
  const guns=new T.Group();guns.position.set(-850,85.2,232);guns.rotation.y=.28;scene.add(guns);W.guns=guns;
  for(const [x,z] of [[-22,4],[0,0],[22,5]]){const gun=new T.Group();gun.position.set(x,0,z);guns.add(gun);
    gun.add(occ(new T.Mesh(new T.BoxGeometry(3.4,1.6,6),gm)));
    for(const s of [-1,1]){const tr=occ(new T.Mesh(new T.BoxGeometry(.5,.5,7.5),gm));tr.position.set(s*1.4,-.3,5.2);tr.rotation.y=s*.25;gun.add(tr);
      const wh=new T.Mesh(new T.CylinderGeometry(1,1,.5,16),gm);wh.rotation.z=Math.PI/2;wh.position.set(s*2,-.1,-.6);gun.add(wh);}
    const sh=occ(new T.Mesh(new T.BoxGeometry(3.8,2.6,.25),gm));sh.position.set(0,1.6,-2.1);gun.add(sh);
    const br=occ(new T.Mesh(new T.CylinderGeometry(.18,.28,9,10),gm));br.geometry.translate(0,4.5,0);br.position.set(0,1.4,-1.4);br.rotation.x=-1.0;gun.add(br);W.barrels.push(br);}
  /* the crew: young, round a tablet that lights their faces red */
  const cm=new T.MeshStandardMaterial({color:0x26282a,roughness:.9});
  W.crew=[];for(const [x,z,r] of [[8,-6,0],[10.2,-5.2,-1.2],[9.3,-7.6,2.3],[6.4,-7.4,.9]]){const p=new T.Group();
    const body=occ(new T.Mesh(new T.CapsuleGeometry(.32,1,4,8),cm));body.position.y=.95;p.add(body);
    const head=occ(new T.Mesh(new T.SphereGeometry(.21,12,10),cm));head.position.y=1.8;p.add(head);
    p.position.set(x,0,z);p.rotation.y=r;guns.add(p);W.crew.push(p);}
  const tab=new T.Mesh(new T.PlaneGeometry(.7,.45),new T.MeshBasicMaterial({color:new T.Color(1,.12,.06).multiplyScalar(2.2)}));tab.position.set(8.6,1.25,-6.6);tab.rotation.x=-1.1;guns.add(tab);
  const tl=new T.PointLight(0xff2a14,9,6,1.5);tl.position.set(8.6,1.6,-6.4);guns.add(tl);
  /* a dug-in ammunition stack and a work lamp */
  const lp=new T.PointLight(0xffb070,14,20,1.6);lp.position.set(-10,4,-3);guns.add(lp);}
/* ---------- the lights of the night ---------- */
function lights(scene){scene.add(new T.HemisphereLight(0x1a2233,0x050505,.55));
  const moon=new T.DirectionalLight(0x8ea0c0,.35);moon.position.set(550,320,400);scene.add(moon);
  /* the rifts' glow from the north: a hard red rim on everything that faces the bay */
  const rim=new T.DirectionalLight(0xff4a1a,0);rim.position.set(-120,90,-1100);scene.add(rim);W.rim=rim;
  scene.fog=new T.FogExp2(0x040507,.00055);}
/* ---------- drizzle round the camera ---------- */
function rain(scene){const n=6000,p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p.set([(Math.random()-.5)*80,Math.random()*60,(Math.random()-.5)*80],i*3);s[i]=Math.random();}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('aS',new T.BufferAttribute(s,1));
  const m=new T.ShaderMaterial({uniforms:{uT:W.u.uT,uC:{value:new T.Vector3()},uAmt:{value:.6}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
    vertexShader:`attribute float aS;uniform float uT;uniform vec3 uC;varying float vA;void main(){
      float y=mod(position.y-uT*(16.+aS*6.)-uC.y,60.)-30.;vec3 w=vec3(uC.x+mod(position.x-uC.x+y*.12+40.,80.)-40.,uC.y+y,uC.z+mod(position.z-uC.z+40.,80.)-40.);
      vec4 mv=viewMatrix*vec4(w,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(28./max(1.,-mv.z),1.,3.);vA=smoothstep(60.,4.,-mv.z);}`,
    fragmentShader:`uniform float uAmt;varying float vA;void main(){gl_FragColor=vec4(vec3(.55,.6,.7)*vA*.09*uAmt,1.);}`});
  const r=new T.Points(g,m);r.frustumCulled=false;r.onBeforeRender=(a,b,cam)=>m.uniforms.uC.value.copy(cam.position);scene.add(r);W.rain=m;}

W.build=function(scene){lights(scene);sky(scene);water(scene);harbour(scene);lighthouse(scene);ridge(scene);rain(scene);return W;};
/* per frame: t (s), beam angle, rift glow amount (0..1) */
W.update=function(t,glowAmt){W.u.uT.value=t;const a=-1.9+t*.62;W.u.uBeam.value=a;if(W.beam)W.beam.rotation.y=Math.PI/2-a;
  W.u.uGlow.value=glowAmt;if(W.rim)W.rim.intensity=.25+glowAmt*1.1;
  for(const L of W.lamps)L.intensity=55*(.92+.08*Math.sin(t*37+L.position.x));};
W.setRifts=function(list){list.forEach((r,i)=>W.u.uRift.value[i].set(r.x,0,r.z,r.k));};
return W;
})();
