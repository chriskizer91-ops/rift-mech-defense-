'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: HOLLIN RIDGE, A GREY DAY (game/cinematic/film/set-ridge.js, session D)
   Mission 7. A long grass ridge running east–west, its crest at z = 0, y ≈ 40; the slope falls north (−z) to the coastal
   plain and the sea far off. Alder, Birch and Cedar are dug in along the crest (trenches, sandbags); a radio mast,
   a stone wall, wind-bent trees, rock outcrops. x east, z south, y up.
   RIDGE.h(x,z) ground. RIDGE.update(t, o): o = {churn:[{x,z,r,k}], gloom 0..1}
   ===================================================================================================================== */
const RIDGE=(function(){
const T=THREE,S={occ:[],u:{uT:{value:0},uGloom:{value:0},uChurn:{value:Array.from({length:16},()=>new T.Vector4())}}};
S.SQUADS=[{n:'ALDER',x:-160,z:2},{n:'BIRCH',x:0,z:5},{n:'CEDAR',x:170,z:0}];
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
S.h=(x,z)=>{const crest=40+Math.sin(x*.008)*5+Math.sin(x*.023+1)*2;const north=z<0?crest/(1+Math.pow(z/150,2)):crest-z*.06-Math.pow(Math.max(0,z)/180,2)*12;
  return north+Math.sin(x*.05+z*.04)*.8+Math.sin(x*.13-z*.09)*.35-(Math.abs(z-6)<2.2&&(Math.abs(x+160)<26||Math.abs(x)<26||Math.abs(x-170)<26)?1.6:0);};
S.build=function(scene0){const g=new T.Group();scene0.add(g);S.group=g;
  const sky=new T.Mesh(new T.SphereGeometry(9000,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:S.u,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=(projectionMatrix*modelViewMatrix*vec4(position,1.)).xyww;}`,
    fragmentShader:`varying vec3 vD;uniform float uT,uGloom;${NOISE}void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(vec3(.44,.45,.46),vec3(.2,.21,.23),pow(y,.5));
      vec2 q=d.xz/(y+.12);float cl=fbm(q*.6+vec2(uT*.02,uT*.006))*.7+fbm(q*2.2-vec2(uT*.03,0.))*.3;c=mix(c,vec3(.25,.255,.26),smoothstep(.35,.75,cl)*.8);c*=1.-uGloom*.45;gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);g.add(sky);
  const N=300,geo=new T.PlaneGeometry(2000,1600,N,N);geo.rotateX(-Math.PI/2);geo.translate(0,0,-400);const P=geo.attributes.position;for(let i=0;i<P.count;i++)P.setY(i,S.h(P.getX(i),P.getZ(i)));geo.computeVertexNormals();
  const gm=new T.ShaderMaterial({uniforms:Object.assign({},S.u,T.UniformsLib.fog),fog:true,
    vertexShader:`varying vec3 vW;varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`varying vec3 vW;varying vec3 vN;uniform float uT,uGloom;uniform vec4 uChurn[16];${NOISE}
    #include <fog_pars_fragment>
    void main(){vec2 p=vW.xz;vec3 n=normalize(vN);float wind=fbm(p*.04+vec2(uT*.25,uT*.08));
      vec3 grass=mix(vec3(.11,.14,.085),vec3(.19,.2,.13),fbm(p*.06))*(.8+.35*wind)*(.85+.3*fbm(p*1.3));
      vec3 rock=vec3(.33,.32,.3)*(.7+.4*fbm(p*.7));float steep=1.-n.y;vec3 col=mix(grass,rock,smoothstep(.35,.6,steep+fbm(p*.2)*.3));
      float trench=smoothstep(2.6,1.4,abs(p.y-6.))*step(abs(abs(p.x)-(p.x<-60.?160.:p.x>60.?170.:0.)),26.)*step(abs(p.x-(p.x<-60.?-160.:p.x>60.?170.:0.)),26.);col=mix(col,vec3(.12,.1,.08),trench);
      float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}col=mix(col,vec3(.16,.13,.1),clamp(ch,0.,1.)*(.5+.4*fbm(p*1.5+uT)));
      vec3 sd=normalize(vec3(.2,.9,.3));float dif=max(0.,dot(n,sd));vec3 L=vec3(.4,.41,.43)*(.6+.4*n.y)+vec3(.9,.9,.88)*dif*.4;
      gl_FragColor=vec4(col*L*(1.-uGloom*.35)*.95,1.);
      #include <fog_fragment>
    }`});
  const ground=new T.Mesh(geo,gm);g.add(ground);S.occ.push(ground);
  /* the sea far off to the north */
  const sea=new T.Mesh(new T.PlaneGeometry(6000,3000),new T.MeshStandardMaterial({color:0x2a3034,roughness:.25,metalness:.6}));sea.rotation.x=-Math.PI/2;sea.position.set(0,.5,-2600);g.add(sea);
  const box=(w,h,d,mat,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mat);b.position.set(x,y,z);if(ry)b.rotation.y=ry;g.add(b);S.occ.push(b);return b;};
  const bag=new T.MeshStandardMaterial({color:0x6a6450,roughness:1}),dark=new T.MeshStandardMaterial({color:0x26282a,roughness:.8}),stone=new T.MeshStandardMaterial({color:0x5e5c57,roughness:1,flatShading:true});
  /* trenches: sandbags along the north lip */
  for(const sq of S.SQUADS)for(let i=-12;i<=12;i++){const x=sq.x+i*1.9,z=3.6+Math.sin(i)*.3;box(1.7,.8,.9,bag,x,S.h(x,z)+.5+(i%2)*.25,z,Math.sin(i*2)*.1);}
  /* the radio mast and a hut on the crest */
  box(.5,34,.5,dark,70,S.h(70,14)+17,14);for(let i=0;i<4;i++){const w=new T.Mesh(new T.CylinderGeometry(.03,.03,40,4),dark);const a=i*Math.PI/2;w.position.set(70+Math.cos(a)*9,S.h(70,14)+16,14+Math.sin(a)*9);w.rotation.set(Math.sin(a)*.24,0,-Math.cos(a)*.24);g.add(w);}
  box(6,3.5,4,new T.MeshStandardMaterial({color:0x6a7064,roughness:.8}),78,S.h(78,18)+1.75,18);
  S.mastLight=new T.PointLight(0xff3030,4,30,1.5);S.mastLight.position.set(70,S.h(70,14)+34.5,14);g.add(S.mastLight);
  /* a dry-stone wall down the slope, rocks, wind-bent trees */
  for(let z=-20;z>-260;z-=2.2){const x=-80+Math.sin(z*.02)*14;box(2.2,1.1,.9,stone,x,S.h(x,z)+.4,z,1.57+Math.sin(z*.05)*.2);}
  let sd=5;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};
  for(let i=0;i<90;i++){const x=-600+rnd()*1200,z=-500+rnd()*560;const r=new T.Mesh(new T.DodecahedronGeometry(1+rnd()*3.5,0),stone);r.position.set(x,S.h(x,z)+.3,z);r.rotation.set(rnd()*3,rnd()*3,rnd()*3);r.scale.y=.6;g.add(r);S.occ.push(r);}
  const bark=new T.MeshStandardMaterial({color:0x2e2a26,roughness:1}),leaf=new T.MeshStandardMaterial({color:0x2a3324,roughness:1});
  for(let i=0;i<0;i++){const x=-500+rnd()*1000,z=-180+rnd()*240;if(Math.abs(z-6)<14)continue;const t=new T.Group();t.position.set(x,S.h(x,z),z);t.rotation.z=.18;t.rotation.y=-.3;g.add(t);
    const tr=new T.Mesh(new T.CylinderGeometry(.25,.4,6,6),bark);tr.position.y=3;t.add(tr);const cr=new T.Mesh(new T.ConeGeometry(2.4+rnd(),6,7),leaf);cr.position.set(1,7,0);cr.rotation.z=-.5;t.add(cr);S.occ.push(tr,cr);}
  /* low cloud drifting over the crest */
  const n=1600,mp=new Float32Array(n*3),ma=new Float32Array(n);for(let i=0;i<n;i++){mp.set([(rnd()-.5)*1400,30+rnd()*50,-300+rnd()*420],i*3);ma[i]=rnd();}
  const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('aS',new T.BufferAttribute(ma,1));
  const mist=new T.Points(mg,new T.ShaderMaterial({uniforms:S.u,transparent:true,depthWrite:false,fog:false,vertexShader:`attribute float aS;uniform float uT;varying float vA;void main(){vec3 p=position+vec3(mod(uT*4.*(.5+aS)+aS*300.,1400.)-700.-position.x*0.,0.,0.);p.x=mod(position.x+uT*5.*(.5+aS)+700.,1400.)-700.;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(5000./max(1.,-mv.z),2.,260.);vA=.045*smoothstep(900.,40.,-mv.z);}`,
    fragmentShader:`varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(.5,.51,.53),vA*(1.-r)*(1.-r));}`}));mist.frustumCulled=false;g.add(mist);
  g.add(S.hemi=new T.HemisphereLight(0xb0b4ba,0x3a3a32,.75));S.sun=new T.DirectionalLight(0xe8eaf0,.5);S.sun.position.set(200,800,300);g.add(S.sun);
  S.fog=new T.FogExp2(0x7a7d80,.0017);scene0.fog=S.fog;return S;};
S.update=function(t,o){o=o||{};S.u.uT.value=t;const gl=o.gloom||0;S.u.uGloom.value=gl;S.fog.color.setRGB(.478-.17*gl,.49-.17*gl,.5-.17*gl);S.hemi.intensity=.75-.25*gl;
  const C=S.u.uChurn.value;for(let i=0;i<16;i++){const c=o.churn&&o.churn[i];if(c)C[i].set(c.x,c.z,c.r,c.k);else C[i].w=0;}S.mastLight.intensity=Math.sin(t*3)>0?6:0;};
return S;
})();
