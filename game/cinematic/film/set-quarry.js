'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: KESSEL CUT QUARRY AT MIDDAY (game/cinematic/film/set-quarry.js, session D)
   Mission 3. A rectangular pit (floor at y = 0, x −150..150, z −130..130) with benched rock walls 45 m high, the road in
   from the south, the rift in the north wall at x = −20 (a glowing slit that ANVIL's shells cave in), the yard of five
   dump trucks to the east, Tern's squad on the north lip, and ANVIL's three old guns on a ridge to the west.
   QUARRY.h(x,z) ground height. QUARRY.update(t, o): o = {rift 0..1 (open), cave 0..1 (caved in), eaten[i] 0..1, churn}
   ===================================================================================================================== */
const QUARRY=(function(){
const T=THREE,Q={occ:[],trucks:[],u:{uT:{value:0},uRift:{value:1},uChurn:{value:Array.from({length:16},()=>new T.Vector4())}}};
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
const HX=150,HZ=130;
Q.h=(x,z)=>{const ramp=Math.abs(x)<22&&z>HZ?Math.min(45,(z-HZ)*.22):null;const d=Math.max(Math.abs(x)-HX,Math.abs(z)-HZ);if(d<=0)return 0;
  const step=Math.floor(d/7),f=d/7-step;const y=Math.min(45,step*9+9*Math.min(1,f*3.5));const r=Math.sin(x*.07+z*.05)*.6+Math.sin(x*.21-z*.13)*.3;
  const w=Math.min(45,y)+(y>=45?Math.sin(x*.01)*3+(d-35)*.05:r);return ramp!=null?Math.min(w,ramp):w;};
Q.RIFT={x:-20,z:-HZ,y:7};Q.LIP={x:40,z:-HZ-34,y:45};Q.ANVIL={x:-620,z:120,y:70};
Q.TRUCKS=[[78,22],[96,34],[114,18],[88,58],[118,50]];
Q.build=function(scene0){const g=new T.Group();scene0.add(g);Q.group=g;
  const sky=new T.Mesh(new T.SphereGeometry(9000,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:Q.u,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=(projectionMatrix*modelViewMatrix*vec4(position,1.)).xyww;}`,
    fragmentShader:`varying vec3 vD;uniform float uT;${NOISE}void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(vec3(.26,.26,.255),vec3(.11,.12,.14),pow(y,.6));
      vec2 q=d.xz/(y+.1);float cl=fbm(q*.7+vec2(uT*.01,0.));c=mix(c,vec3(.19,.19,.2),smoothstep(.4,.8,cl)*.6);vec3 sd=normalize(vec3(.3,.8,.2));c+=vec3(.5,.45,.35)*pow(max(0.,dot(d,sd)),12.)*.6;gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);g.add(sky);
  const N=300,geo=new T.PlaneGeometry(1600,1600,N,N);geo.rotateX(-Math.PI/2);const P=geo.attributes.position;for(let i=0;i<P.count;i++)P.setY(i,Q.h(P.getX(i),P.getZ(i)));geo.computeVertexNormals();
  const A=window.CIN_ASSETS&&window.CIN_ASSETS.tex.rock;const tx=A?new T.TextureLoader().load(A):null;if(tx){tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.colorSpace=T.SRGBColorSpace;}
  const m=new T.ShaderMaterial({uniforms:Object.assign({tRock:{value:tx}},Q.u,T.UniformsLib.fog),fog:true,
    vertexShader:`varying vec3 vW;varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`varying vec3 vW;varying vec3 vN;uniform sampler2D tRock;uniform float uT;uniform vec4 uChurn[16];${NOISE}
    #include <fog_pars_fragment>
    void main(){vec3 n=normalize(vN);vec2 p=vW.xz;float steep=1.-n.y;
      vec3 rx=texture2D(tRock,vW.zy*.05).rgb,rz=texture2D(tRock,vW.xy*.05).rgb,ry=texture2D(tRock,p*.04).rgb;vec3 an=abs(n);vec3 rock=(rx*an.x+rz*an.z+ry*an.y)/(an.x+an.y+an.z);
      vec3 grav=vec3(.3,.285,.26)*(.75+.4*fbm(p*.4))*(1.-.25*smoothstep(.55,.7,fbm(p*.05)));
      float tx2=p.x-sin(p.y*.018)*30.-10.;float tr=(smoothstep(1.2,.2,abs(abs(tx2)-2.6)))*.3*smoothstep(130.,100.,abs(p.y));grav*=1.-tr;
      float band=.75+.25*sin(vW.y*1.7+fbm(p*.05)*4.);vec3 col=mix(grav,rock*vec3(.9,.82,.72)*.75*band,smoothstep(.15,.45,steep));
      float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}col*=1.-clamp(ch,0.,1.)*(.25+.25*fbm(p*2.+uT));
      vec3 sd=normalize(vec3(.3,.8,.2));float dif=max(0.,dot(n,sd));vec3 L=vec3(.24,.25,.27)*(.55+.45*n.y)+vec3(1.,.9,.76)*dif*.6;
      gl_FragColor=vec4(col*L,1.);
      #include <fog_fragment>
    }`});
  const ground=new T.Mesh(geo,m);g.add(ground);Q.occ.push(ground);
  /* the rift: a glowing slit at the foot of the north wall, and the rock that falls over it */
  const rm=new T.ShaderMaterial({uniforms:Q.u,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
    vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vU;uniform float uT,uRift;${NOISE}void main(){vec2 q=vU-.5;float w=.06+.05*fbm(vec2(vU.y*6.,uT*.5));float s=exp(-pow(q.x/w,2.))*smoothstep(.5,.2,abs(q.y));
      float f=.75+.25*sin(uT*7.+vU.y*20.);gl_FragColor=vec4(vec3(1.,.35,.08)*(s*f*4.+exp(-length(q*vec2(3.,1.6))*5.)*.6)*uRift,1.);}`});
  const rp=new T.Mesh(new T.PlaneGeometry(18,30),rm);rp.position.set(Q.RIFT.x,12,-HZ-.6);g.add(rp);Q.riftPlane=rp;
  Q.riftLight=new T.PointLight(0xff6020,140,140,1.4);Q.riftLight.position.set(Q.RIFT.x,6,-HZ+6);g.add(Q.riftLight);
  const rock=new T.MeshStandardMaterial({color:0x6f6a62,roughness:.95,flatShading:true});
  Q.boulders=[];for(let i=0;i<16;i++){const b=new T.Mesh(new T.DodecahedronGeometry(2+((i*7)%5)*.7,0),rock);const x=Q.RIFT.x+((i*13)%17-8)*1.2,z=-HZ+2+((i*5)%6);
    b.userData={x,z,y0:30+((i*11)%14),y1:1.5+((i*3)%4)*1.3,d:i*.07};b.position.set(x,b.userData.y0,z);b.visible=false;g.add(b);Q.boulders.push(b);Q.occ.push(b);}
  /* the trucks */
  const yel=new T.MeshStandardMaterial({color:0xc89a2a,roughness:.6,metalness:.3}),dark=new T.MeshStandardMaterial({color:0x222224,roughness:.8}),grey=new T.MeshStandardMaterial({color:0x5a5852,roughness:1});
  Q.TRUCKS.forEach(([x,z],i)=>{const t=new T.Group();t.position.set(x,0,z);t.rotation.y=i*.9+.3;g.add(t);
    const add=(w,h,d,mt,px,py,pz)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mt);b.position.set(px,py,pz);t.add(b);Q.occ.push(b);return b;};
    add(5,2.6,7,yel,0,3.4,-1.2);add(4.6,2.6,3,yel,0,3.3,4.2);add(4.4,1,.1,dark,0,3.9,5.72);
    for(const [wx,wz] of [[-2.4,3.6],[2.4,3.6],[-2.4,-1],[2.4,-1],[-2.4,-3.4],[2.4,-3.4]]){const w=new T.Mesh(new T.CylinderGeometry(1.25,1.25,1,14),dark);w.rotation.z=Math.PI/2;w.position.set(wx,1.25,wz);t.add(w);Q.occ.push(w);}
    Q.trucks.push({g:t,mats:[yel]});});
  Q.truckYel=yel;Q.truckGrey=grey;
  /* sheds, a conveyor, the crusher by the yard */
  const tin=new T.MeshStandardMaterial({color:0x7a7d80,roughness:.5,metalness:.6});
  [[120,90,24,10,16],[60,100,16,8,12]].forEach(([x,z,w,h,d])=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),tin);b.position.set(x,h/2,z);g.add(b);Q.occ.push(b);});
  /* ANVIL's guns on the ridge to the west */
  const gunM=new T.MeshStandardMaterial({color:0x3d4238,roughness:.7,metalness:.5});Q.barrels=[];
  const ridge=new T.Mesh(new T.CylinderGeometry(60,120,70,24),new T.MeshStandardMaterial({color:0x4a4a40,roughness:1}));ridge.position.set(Q.ANVIL.x,Q.ANVIL.y-35,Q.ANVIL.z);g.add(ridge);
  for(let i=0;i<3;i++){const gg=new T.Group();gg.position.set(Q.ANVIL.x+(i-1)*16,Q.ANVIL.y,Q.ANVIL.z+(i%2)*6);gg.rotation.y=-1.75;g.add(gg);
    const base=new T.Mesh(new T.BoxGeometry(4,1.4,6),gunM);base.position.y=.7;gg.add(base);
    const bar=new T.Mesh(new T.CylinderGeometry(.28,.34,9,10),gunM);bar.geometry.translate(0,4.5,0);bar.position.set(0,1.6,0);bar.rotation.x=-.9;gg.add(bar);Q.barrels.push(bar);}
  /* dust hanging in the pit */
  const n=1800,mp=new Float32Array(n*3),ma=new Float32Array(n);for(let i=0;i<n;i++){mp.set([(Math.random()-.5)*320,1+Math.random()*30,(Math.random()-.5)*280],i*3);ma[i]=Math.random();}
  const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('aS',new T.BufferAttribute(ma,1));
  const dm=new T.ShaderMaterial({uniforms:Q.u,transparent:true,depthWrite:false,fog:false,vertexShader:`attribute float aS;uniform float uT;varying float vA;void main(){vec3 p=position+vec3(uT*.6*aS,sin(uT*.1+aS*20.)*2.,cos(uT*.07+aS*30.)*5.);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(1800./max(1.,-mv.z),2.,140.);vA=.03*smoothstep(400.,20.,-mv.z);}`,
    fragmentShader:`varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(.45,.42,.37),vA*(1.-r)*(1.-r));}`});
  const dust=new T.Points(mg,dm);dust.frustumCulled=false;g.add(dust);
  g.add(new T.HemisphereLight(0x8a8e96,0x3a3630,.6));const sun=new T.DirectionalLight(0xfff0d8,.9);sun.position.set(300,800,200);g.add(sun);
  Q.fog=new T.FogExp2(0x4a4844,.0012);scene0.fog=Q.fog;return Q;};
Q.update=function(t,o){o=o||{};Q.u.uT.value=t;const rk=o.rift==null?1:o.rift;Q.u.uRift.value=rk;Q.riftLight.intensity=140*rk*(.85+.15*Math.sin(t*9));
  const cv=o.cave||0;for(const b of Q.boulders){const d=b.userData;const u=Math.max(0,Math.min(1,(cv-d.d)/(1-d.d+.001)*1.3));b.visible=cv>d.d;b.position.y=d.y0+(d.y1-d.y0)*u*u;b.rotation.set(u*3+d.d,u*2,u);}
  const C=Q.u.uChurn.value;for(let i=0;i<16;i++){const c=o.churn&&o.churn[i];if(c)C[i].set(c.x,c.z,c.r,c.k);else C[i].w=0;}
  Q.trucks.forEach((tr,i)=>{const e=o.eaten?o.eaten[i]:0;tr.g.scale.set(1+e*.15,1-e*.75,1+e*.1);tr.g.position.y=-e*.6;tr.g.rotation.z=e*.12;
    tr.g.traverse(m=>{if(m.isMesh&&m.material===Q.truckYel&&e>.5)m.material=Q.truckGrey;if(m.isMesh&&m.material===Q.truckGrey&&e<=.5)m.material=Q.truckYel;});});};
return Q;
})();
