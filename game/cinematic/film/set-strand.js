'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: GREYWATER STRAND AT DAWN (game/cinematic/film/set-strand.js, session D)
   The beach of mission 1 and of Intel Brief 00. x runs east, z south, y up; the sea is north (−z), the waterline at z ≈ 0.
     the sky: low grey cloud, a warm band in the east where the sun is trying to come up (uSun: it breaks through)
     the sea: a grey swell, the surf breaking in lines on the shallows, foam running up the sand
     the sand: grey, wet and dark below the tide line; it churns where something unseen walks (uChurn: up to 24 spots)
     the pier at x = 70 with Gull's two boats at its end, the dunes, a fence, a lifeguard tower, a truck sunk in the grit
   STRAND.h(x,z) is the ground's height (the swarm walks on it). STRAND.update(t, o) per frame.
   ===================================================================================================================== */
const STRAND=(function(){
const T=THREE,S={occ:[],boats:[],people:[]};
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
/* the ground: the same function in js and in the shaders */
const HJ=(x,z)=>{const r=Math.sin(x*.013+z*.004)*.35+Math.sin(x*.041-z*.02)*.12;
  if(z<52)return .03*z+r*(z>-20?1:.4)+(z<-30?-.02*(z+30):0);
  const d=z-52;return .03*52+r+Math.min(6.5,d*.16)*(1-Math.exp(-d*.06))+Math.sin(x*.05)*Math.min(1.6,d*.05)+Math.sin(x*.11+z*.07)*Math.min(.8,d*.03);};
const HG=`float hgt(vec2 q){float x=q.x,z=q.y;float r=sin(x*.013+z*.004)*.35+sin(x*.041-z*.02)*.12;
  if(z<52.)return .03*z+r*(z>-20.?1.:.4)+(z<-30.?-.02*(z+30.):0.);
  float d=z-52.;return .03*52.+r+min(6.5,d*.16)*(1.-exp(-d*.06))+sin(x*.05)*min(1.6,d*.05)+sin(x*.11+z*.07)*min(.8,d*.03);}`;
S.h=HJ;
S.u={uT:{value:0},uSun:{value:0},uTide:{value:0},uChurn:{value:Array.from({length:24},()=>new T.Vector4(0,0,0,0))},uCam:{value:new T.Vector3()}};
/* the dawn sky: dark cloud overhead, a warm low band to the east-north-east */
const SKY=`uniform float uT,uSun;
vec3 sky(vec3 d){float y=max(d.y,0.);vec3 hz=vec3(.2,.205,.22),top=vec3(.035,.042,.055);vec3 c=mix(hz,top,pow(y,.5));
  vec3 sd=normalize(vec3(.86,.06+uSun*.05,-.5));float sa=max(0.,dot(d,sd));
  vec2 q=d.xz/(y+.08);float cl=fbm(q*.9+vec2(uT*.006,0.))*.75+fbm(q*3.1-vec2(uT*.01,0.))*.25;float cov=smoothstep(.35,.7,cl)*smoothstep(-.02,.12,y);
  vec3 warm=vec3(1.,.55,.3)*(pow(sa,6.)*.9+pow(sa,40.)*1.4)*exp(-y*5.);
  c+=warm*(.9+uSun*.9)*(1.-cov*(.6-uSun*.3));c=mix(c,mix(vec3(.085,.09,.1),vec3(.38,.25,.18),pow(sa,3.)*(.55+uSun)),cov*.85);
  c+=vec3(1.,.8,.55)*pow(sa,900.)*6.*uSun*(1.-cov*.7);
  return c;}`;
function sky(scene){const m=new T.ShaderMaterial({uniforms:S.u,side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:`varying vec3 vD;${NOISE}${SKY}void main(){gl_FragColor=vec4(sky(normalize(vD)),1.);}`});
  const s=new T.Mesh(new T.SphereGeometry(9000,48,24),m);s.renderOrder=-10;s.frustumCulled=false;s.onBeforeRender=(r,sc,cam)=>s.position.copy(cam.position);scene.add(s);}
/* the sea */
function sea(scene){const m=new T.ShaderMaterial({uniforms:S.u,fog:false,transparent:true,depthWrite:false,
  vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`varying vec3 vW;uniform vec3 uCam;uniform float uTide;${NOISE}${SKY}${HG}
  vec2 wv(vec2 p,vec2 d,float k,float a,float s){float ph=dot(p,d)*k+uT*s;return d*cos(ph)*k*a;}
  void main(){vec2 p=vW.xz;float dist=length(uCam-vW);float dep=uTide-hgt(p);if(dep<-.05)discard;
   vec2 g=wv(p,normalize(vec2(.1,1.)),.11,.6,1.4)+wv(p,normalize(vec2(-.5,.8)),.19,.25,2.1)+wv(p,normalize(vec2(.7,.6)),.37,.1,3.);
   float fd=smoothstep(800.,40.,dist);vec2 nz=(vec2(vn(p*.8+uT*.4),vn(p*.8-uT*.37+9.))-.5)*.3*fd;
   vec3 n=normalize(vec3(-g.x-nz.x,1.,-g.y-nz.y));vec3 v=normalize(uCam-vW);float fr=.03+.97*pow(1.-max(dot(n,v),0.),5.);
   vec3 r=reflect(-v,n);r.y=abs(r.y);vec3 col=sky(r)*fr+vec3(.035,.045,.05)*(1.-fr);
   /* the surf: lines of foam that run in toward the sand and break on the shallows */
   float sh=smoothstep(3.2,1.2,dep)*smoothstep(.3,1.,dep);float ph=fract(p.y*.045+uT*.14+fbm(p*.015+3.)*1.3);float br=smoothstep(.0,.05,ph)*smoothstep(.16,.05,ph);
   float foam=br*sh*smoothstep(.35,.75,fbm(p*.08+vec2(uT*.05,0.)))*1.2;foam+=smoothstep(.45,0.,dep)*(.35+.65*fbm(p*.5+vec2(0.,uT*.6)))*.8;
   foam+=smoothstep(.78,.9,fbm(p*.07+vec2(uT*.03,uT*.05)))*.12*fd;
   col=mix(col,vec3(.38,.39,.41)*(.6+uSun*.5),clamp(foam,0.,1.)*.8);
   float fog=1.-exp(-dist*.0009);col=mix(col,vec3(.13,.135,.15)+vec3(.08,.04,.02)*uSun,fog*.8);
   gl_FragColor=vec4(col,smoothstep(-.05,.25,dep));}`});
  const g=new T.PlaneGeometry(8000,8000,1,1);g.rotateX(-Math.PI/2);const w=new T.Mesh(g,m);w.frustumCulled=false;w.renderOrder=1;scene.add(w);
  w.onBeforeRender=(r,s,cam)=>S.u.uCam.value.copy(cam.position);S.water=w;}
/* the sand */
function sand(scene){const N=260,g=new T.PlaneGeometry(1400,700,N,N/2);g.rotateX(-Math.PI/2);g.translate(0,0,90);
  const P=g.attributes.position;for(let i=0;i<P.count;i++)P.setY(i,HJ(P.getX(i),P.getZ(i)));g.computeVertexNormals();
  const m=new T.ShaderMaterial({uniforms:Object.assign({},S.u,T.UniformsLib.fog),fog:true,lights:false,
    vertexShader:`varying vec3 vW;varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`varying vec3 vW;varying vec3 vN;uniform float uT,uSun,uTide;uniform vec4 uChurn[24];${NOISE}
    #include <fog_pars_fragment>
    void main(){vec2 p=vW.xz;float e=.6;
     float hN=fbm(p*1.7)*.5+fbm(p*.35)*.5+sin(p.x*2.1+p.y*.7+fbm(p*.4)*6.)*.06*smoothstep(10.,-5.,vW.y);
     vec3 n=normalize(vN+vec3(dFdx(hN),0.,dFdy(hN))*-1.6);
     /* churn: the ground stirred where they walk (the real view's only sign of them) */
     float ch=0.;for(int i=0;i<24;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}
     ch=clamp(ch,0.,1.6);float pit=fbm(p*3.3+uT*2.3)*ch;n=normalize(n+vec3(sin(p.x*9.+uT*7.),0.,cos(p.y*8.-uT*6.))*.35*ch);
     float wet=smoothstep(.9+uTide,uTide-.1,vW.y);float dune=smoothstep(1.8,4.,vW.y);
     vec3 dry=mix(vec3(.27,.265,.25),vec3(.34,.32,.29),fbm(p*.07));vec3 wc=vec3(.1,.1,.105);vec3 col=mix(dry,wc,wet);
     col=mix(col,vec3(.38,.39,.33),dune*smoothstep(.45,.7,fbm(p*.15))*.6);col*=1.-pit*.55-ch*.22;
     col*=.85+.3*fbm(p*4.2);
     vec3 sd=normalize(vec3(.86,.25+uSun*.25,-.5));float dif=max(0.,dot(n,sd));
     vec3 L=vec3(.2,.215,.24)*(.55+.45*n.y)+vec3(1.,.66,.42)*dif*(.45+uSun*1.1);
     vec3 v=normalize(cameraPosition-vW);float spec=pow(max(0.,dot(reflect(-sd,n),v)),40.)*wet*(.4+uSun);
     gl_FragColor=vec4(col*L*1.05+vec3(1.,.7,.5)*spec*.6,1.);
     #include <fog_fragment>
    }`});
  const s=new T.Mesh(g,m);scene.add(s);S.sand=s;S.occ.push(s);}
/* the pier, the boats, the dunes' fence, the tower, the truck */
const wood=new T.MeshStandardMaterial({color:0x5a5148,roughness:.9}),dark=new T.MeshStandardMaterial({color:0x2a2a2c,roughness:.8,metalness:.3});
function box(w,h,d,mat,x,y,z,ry,rz){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;return m;}
function pier(scene){const g=new T.Group();scene.add(g);S.pierX=70;
  g.add(box(6,.5,154,wood,70,3.2,-67));g.add(box(18,.5,16,wood,70,3.2,-148));
  for(let z=8;z>-156;z-=8)for(const dx of [-2.6,2.6]){const y0=HJ(70+dx,z)-2;const pl=new T.Mesh(new T.CylinderGeometry(.22,.26,3.4-y0,8),wood);pl.position.set(70+dx,(3.2+y0)/2,z);g.add(pl);}
  for(const dx of [-3,3])g.add(box(.12,.9,154,wood,70+dx,3.9,-67));
  for(const [x,z] of [[62,-150],[78,-150],[64,-140],[76,-140]]){const b=new T.Mesh(new T.CylinderGeometry(.25,.3,.7,8),dark);b.position.set(x,3.7,z);g.add(b);}
  const lampP=[70+2.6,7,-146];const L=new T.PointLight(0xffc890,25,40,1.6);L.position.set(...lampP);g.add(L);g.add(box(.15,4,.15,dark,lampP[0],5,lampP[2]));
  g.traverse(o=>{if(o.isMesh)S.occ.push(o);});}
const hullMat=new T.MeshStandardMaterial({color:0x6b2f26,roughness:.7}),cabMat=new T.MeshStandardMaterial({color:0xb8b2a6,roughness:.8});
function boat(scene,len,col){const g=new T.Group();const hg=new T.BoxGeometry(4.2,2.2,len,1,1,6);const P=hg.attributes.position;
  for(let i=0;i<P.count;i++){const z=P.getZ(i)/len+.5,y=P.getY(i);let x=P.getX(i);const bow=Math.pow(Math.max(0,1-z*1.25),1.6);x*=1-bow*.95;if(y<0)x*=.7;P.setX(i,x);if(y>0)P.setY(i,y+bow*.8);}
  hg.computeVertexNormals();const hm=hullMat.clone();hm.color.set(col);const h=new T.Mesh(hg,hm);h.position.y=.5;g.add(h);
  g.add(box(3,2,3.6,cabMat,0,2.6,len*.12));const mast=new T.Mesh(new T.CylinderGeometry(.08,.1,6,6),dark);mast.position.set(0,4.5,-len*.15);g.add(mast);
  const L=new T.PointLight(0xffd8a0,6,18,1.8);L.position.set(0,3.4,len*.12+1.9);g.add(L);
  const win=new T.Mesh(new T.PlaneGeometry(2.2,.6),new T.MeshBasicMaterial({color:0xffcf8a}));win.position.set(0,2.9,len*.12+1.81);g.add(win);
  scene.add(g);g.traverse(o=>{if(o.isMesh)S.occ.push(o);});return g;}
function props(scene){
  for(let x=-420;x<420;x+=4.5){const y=HJ(x,64);if(Math.sin(x*.7)>.85)continue;const p=box(.14,1.1,.14,wood,x,y+.5,64+Math.sin(x*.3)*.6,0,Math.sin(x*1.3)*.15);scene.add(p);}
  const tw=new T.Group();tw.position.set(-70,HJ(-70,34),34);scene.add(tw);for(const [dx,dz] of [[-1.3,-1.3],[1.3,-1.3],[-1.3,1.3],[1.3,1.3]])tw.add(box(.18,4,.18,wood,dx,2,dz));
  tw.add(box(3.4,.25,3.4,wood,0,4,0));tw.add(box(3.2,2,3.2,new T.MeshStandardMaterial({color:0x8a3a2c,roughness:.8}),0,5.1,0));tw.add(box(3.8,.2,3.8,wood,0,6.2,0));
  /* the truck that sank into the grit (Intel Brief 00) */
  const tr=new T.Group();tr.position.set(-150,HJ(-150,22)-.9,22);tr.rotation.set(.12,.5,-.09);scene.add(tr);S.truck=tr;
  const tm=new T.MeshStandardMaterial({color:0xb8b29a,roughness:.55,metalness:.3}),rust=new T.MeshStandardMaterial({color:0x6a4a36,roughness:.8,metalness:.3});
  tr.add(box(2.5,.35,7,rust,0,.55,0));tr.add(box(2.5,1.1,4.2,tm,0,1.3,-1.4));tr.add(box(2.3,.9,3.9,new T.MeshStandardMaterial({color:0x1c1d1e,roughness:.9}),0,1.45,-1.4));
  tr.add(box(2.5,1.7,2.3,tm,0,1.6,2.25));tr.add(box(2.5,.6,1.1,tm,0,1,3.9));tr.add(box(2.3,.8,.08,new T.MeshStandardMaterial({color:0x111418,roughness:.1,metalness:.7}),0,2.05,3.42));
  for(const sx of [-1.27,1.27])tr.add(box(.06,.7,1.4,new T.MeshStandardMaterial({color:0x111418,roughness:.1,metalness:.7}),sx,2.05,2.3));
  const hl=new T.Mesh(new T.CircleGeometry(.16,10),new T.MeshBasicMaterial({color:0x4a4630}));hl.position.set(.85,1.05,4.46);tr.add(hl);const hl2=hl.clone();hl2.position.x=-.85;tr.add(hl2);
  for(const [x,z] of [[-1.3,2.6],[1.3,2.6],[-1.3,-2.6],[1.3,-2.6]]){const w=new T.Mesh(new T.CylinderGeometry(.55,.55,.4,12),dark);w.rotation.z=Math.PI/2;w.position.set(x,.2,z);tr.add(w);}
  /* huts on the dunes, the town's roofs behind */
  for(let i=0;i<9;i++){const x=-260+i*62+Math.sin(i*3.1)*14,z=118+Math.sin(i*1.7)*8;const y=HJ(x,z);
    const hu=box(6+i%3*2,4,5,new T.MeshStandardMaterial({color:[0x7d837f,0x6b6460,0x8b857a][i%3],roughness:.85}),x,y+2,z,Math.sin(i)*.3);scene.add(hu);
    const ro=box(7+i%3*2,.4,6,dark,x,y+4.2,z,Math.sin(i)*.3);scene.add(ro);}
  scene.traverse(o=>{if(o.isMesh&&!S.occ.includes(o))S.occ.push(o);});}
function lights(scene){const hemi=new T.HemisphereLight(0x6a7488,0x2a2824,.75);scene.add(hemi);S.hemi=hemi;
  const sun=new T.DirectionalLight(0xffc49a,.5);sun.position.set(860,250,-500);scene.add(sun);S.sun=sun;
  S.fog=new T.FogExp2(0x2a2b2e,.0019);}
S.build=function(scene0){const scene=new T.Group();scene0.add(scene);S.group=scene;lights(scene);scene0.fog=S.fog;sky(scene);sand(scene);sea(scene);pier(scene);props(scene);
  S.boats=[boat(scene,14,0x6b2f26),boat(scene,12,0x2f4a5a)];S.boats[0].position.set(61,0,-150);S.boats[1].position.set(80,0,-146);return S;};
/* per frame. o: {churn:[{x,z,r,k}], sun 0..1, tide (sea level m), boats:[{x,z,yaw}]} */
S.update=function(t,o){o=o||{};S.u.uT.value=t;S.u.uSun.value=o.sun||0;const tide=(o.tide||0)+Math.sin(t*.42)*.12;S.u.uTide.value=tide;
  const C=S.u.uChurn.value;for(let i=0;i<24;i++){const c=o.churn&&o.churn[i];if(c)C[i].set(c.x,c.z,c.r,c.k);else C[i].w=0;}
  if(o.boats)o.boats.forEach((b,i)=>{const B=S.boats[i];if(!B)return;B.position.set(b.x,Math.sin(t*1.1+i)*.18-.1,b.z);B.rotation.set(Math.sin(t*.9+i)*.03,b.yaw||0,Math.sin(t*1.3+i*2)*.05);});
  const k=o.sun||0;S.sun.intensity=.5+k*1.6;S.hemi.intensity=.9+k*.3;S.fog.color.setRGB(.15+k*.1,.155+k*.06,.17+k*.02);};
return S;
})();
