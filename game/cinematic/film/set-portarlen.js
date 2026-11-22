'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: PORT ARLEN AT DUSK (game/cinematic/film/set-portarlen.js, session D)
   Mission 4. The town on Arlen Bay, at street level. x east, z south, y up; the sea is north (−z), its level y = 0.
     the harbour basin (west of x = 40) behind a stone quay wall at z = 0, its apron at y = 3, lamps and bollards
     the shallows (east of x = 40): a mud beach running down into the water; the rift is out in them at RIFT
     the cannery on the waterfront at x ≈ 125 (BEHEMOTH comes ashore through it; it goes grey), wrecks on the beach
     the high street running uphill (south) at x = −20, houses both sides, alleys at z = 80 and 140, Pike's sandbags
   The sky: the sun just down in the west, a red band under the cloud; o.dusk 0..1 takes it to night. Fires on o.fire.
   PORT.h(x,z) ground. PORT.update(t, o): o = {dusk, rift 0..1, grey 0..1 (the cannery), fire 0..1, churn:[{x,z,r,k}]}
   ===================================================================================================================== */
const PORT=(function(){
const T=THREE,S={occ:[],fires:[],u:{uT:{value:0},uDusk:{value:0},uRift:{value:1},uCam:{value:new T.Vector3()},uChurn:{value:Array.from({length:16},()=>new T.Vector4())}}};
S.RIFT={x:70,z:-78};S.CANNERY={x:125,z:4};S.STREET=-20;
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
const HJ=(x,z)=>{const town=3+Math.max(0,z-20)*.035;if(z>=20)return town;
  const west=z>=0?3:-5,east=Math.min(3.08,-2.2+(z+90)*.048)+Math.sin(x*.05+z*.03)*.15;const b=Math.min(1,Math.max(0,(x-30)/10));return west*(1-b)+east*b;};
const HG=`float hgt(vec2 q){float x=q.x,z=q.y;if(z>=20.)return 3.+max(0.,z-20.)*.035;float west=z>=0.?3.:-5.;float east=min(3.08,-2.2+(z+90.)*.048)+sin(x*.05+z*.03)*.15;
  float b=clamp((x-30.)/10.,0.,1.);return mix(west,east,b);}`;
S.h=HJ;
const SKY=`uniform float uT,uDusk;
vec3 sky(vec3 d){float y=max(d.y,0.);float n=uDusk;vec3 hz=mix(vec3(.3,.17,.12),vec3(.06,.05,.07),n),top=mix(vec3(.06,.06,.09),vec3(.01,.012,.02),n);vec3 c=mix(hz,top,pow(y,.45));
  vec3 sd=normalize(vec3(-.86,.02,-.45));float sa=max(0.,dot(d,sd));
  vec2 q=d.xz/(y+.08);float cl=fbm(q*.8+vec2(uT*.005,0.))*.7+fbm(q*2.8-vec2(uT*.008,0.))*.3;float cov=smoothstep(.38,.72,cl)*smoothstep(-.02,.12,y);
  vec3 warm=vec3(1.,.35,.12)*(pow(sa,4.)*.8+pow(sa,24.)*1.2)*exp(-y*6.)*(1.-n*.85);
  c+=warm*(1.-cov*.55);c=mix(c,mix(vec3(.07,.05,.06),vec3(.35,.14,.08)*(1.-n*.8),pow(sa,2.5)*.8),cov*.85);
  return c;}`;
S.build=function(scene0){const g=new T.Group();scene0.add(g);S.group=g;
  const sky=new T.Mesh(new T.SphereGeometry(9000,48,24),new T.ShaderMaterial({uniforms:S.u,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=(projectionMatrix*modelViewMatrix*vec4(position,1.)).xyww;}`,
    fragmentShader:`varying vec3 vD;${NOISE}${SKY}void main(){gl_FragColor=vec4(sky(normalize(vD)),1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);g.add(sky);
  /* the ground: town, quay, beach, basin floor */
  const N=280,geo=new T.PlaneGeometry(1400,1000,N,N);geo.rotateX(-Math.PI/2);geo.translate(0,0,100);const P=geo.attributes.position;
  for(let i=0;i<P.count;i++)P.setY(i,HJ(P.getX(i),P.getZ(i)));geo.computeVertexNormals();
  const gm=new T.ShaderMaterial({uniforms:Object.assign({},S.u,T.UniformsLib.fog),fog:true,
    vertexShader:`varying vec3 vW;varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`varying vec3 vW;varying vec3 vN;uniform float uT,uDusk;uniform vec4 uChurn[16];${NOISE}
    #include <fog_pars_fragment>
    void main(){vec2 p=vW.xz;vec3 n=normalize(vN);float town=step(20.,p.y);float road=town*smoothstep(8.,6.,abs(p.x+20.));
      vec3 mud=mix(vec3(.16,.14,.12),vec3(.24,.21,.17),fbm(p*.1))*(.8+.3*fbm(p*1.5));float wet=smoothstep(.8,-.3,vW.y);mud*=1.-wet*.45;
      vec3 stone=vec3(.25,.24,.23)*(.75+.3*fbm(p*.5));vec3 tar=vec3(.08,.08,.085)*(.8+.3*fbm(p*2.));
      vec3 col=mix(mud,stone,step(20.,p.y)*(1.-road)+(1.-step(40.,p.x))*step(-.1,p.y)*step(p.y,20.));col=mix(col,tar,road);
      float cob=step(.9,fract(p.x*.5))+step(.9,fract(p.y*.5));col*=1.-cob*.12*town*(1.-road);
      float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}col*=1.-clamp(ch,0.,1.)*(.3+.3*fbm(p*2.+uT));
      vec3 sd=normalize(vec3(-.86,.18,-.45));float dif=max(0.,dot(n,sd));vec3 L=mix(vec3(.13,.12,.14),vec3(.05,.055,.075),uDusk)*(.6+.4*n.y)+vec3(1.,.45,.2)*dif*.55*(1.-uDusk);
      gl_FragColor=vec4(col*L*1.6,1.);
      #include <fog_fragment>
    }`});
  const ground=new T.Mesh(geo,gm);g.add(ground);S.occ.push(ground);
  /* the sea, with the rift glowing under the shallows and the water stirred where something big wades */
  const sm=new T.ShaderMaterial({uniforms:S.u,fog:false,transparent:true,depthWrite:false,
    vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform vec3 uCam;uniform float uRift;uniform vec4 uChurn[16];${NOISE}${SKY}${HG}
    void main(){vec2 p=vW.xz;float dist=length(uCam-vW);float dep=-hgt(p);if(dep<-.05)discard;
      vec2 g=vec2(cos(p.y*.11+uT*1.3)*.07,0.)+vec2(sin(p.x*.17+uT*1.9)*.03,cos(p.y*.21-uT*1.7)*.03);
      float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}
      float fd=smoothstep(700.,40.,dist);vec2 nz=(vec2(vn(p*.7+uT*.5),vn(p*.7-uT*.45+9.))-.5)*(.3+ch*1.4)*fd;
      vec3 n=normalize(vec3(-g.x-nz.x,1.,-g.y-nz.y));vec3 v=normalize(uCam-vW);float fr=.03+.97*pow(1.-max(dot(n,v),0.),5.);
      vec3 r=reflect(-v,n);r.y=abs(r.y);vec3 col=sky(r)*fr+vec3(.02,.025,.03)*(1.-fr);
      vec2 rq=p-vec2(${S.RIFT.x}.,${S.RIFT.z}.);float rd=length(rq);float crack=exp(-pow(abs(rq.y+sin(rq.x*.12)*4.),2.)*.06)*smoothstep(26.,4.,abs(rq.x));
      col+=vec3(1.,.32,.06)*(crack*1.6+exp(-rd*.06)*.5)*uRift*(.8+.2*sin(uT*5.+rd*.3))*smoothstep(0.,1.5,dep);
      float foam=smoothstep(.5,0.,dep)*(.4+.6*fbm(p*.5+vec2(0.,uT*.5)))+ch*smoothstep(.55,.8,fbm(p*.4+uT*.8))*.7;col=mix(col,vec3(.3,.26,.25)*(1.-uDusk*.6),clamp(foam,0.,1.)*.7);
      float fog=1.-exp(-dist*.0012);col=mix(col,mix(vec3(.13,.09,.08),vec3(.03,.03,.04),uDusk),fog*.85);
      gl_FragColor=vec4(col,smoothstep(-.05,.3,dep));}`});
  const sg=new T.PlaneGeometry(8000,8000);sg.rotateX(-Math.PI/2);const sea=new T.Mesh(sg,sm);sea.frustumCulled=false;sea.renderOrder=1;sea.onBeforeRender=(r,s,cam)=>S.u.uCam.value.copy(cam.position);g.add(sea);
  S.riftLight=new T.PointLight(0xff5a1a,120,120,1.4);S.riftLight.position.set(S.RIFT.x,2,S.RIFT.z);g.add(S.riftLight);
  /* the quay wall, its lamps and bollards */
  const stone=new T.MeshStandardMaterial({color:0x4a4744,roughness:.95}),dark=new T.MeshStandardMaterial({color:0x1d1d1f,roughness:.85}),wood=new T.MeshStandardMaterial({color:0x4a3f36,roughness:.9});
  const box=(w,h,d,mat,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mat);b.position.set(x,y,z);if(ry)b.rotation.y=ry;g.add(b);S.occ.push(b);return b;};
  box(200,8.2,3,stone,-60,-1.1,-1.5);
  S.lamps=[];for(let x=-150;x<=30;x+=30){box(.25,7,.25,dark,x,6.5,2);const L=new T.PointLight(0xffb070,18,40,1.6);L.position.set(x,9.8,2.5);g.add(L);S.lamps.push(L);
    const gl=new T.Mesh(new T.SphereGeometry(.35,8,6),new T.MeshBasicMaterial({color:0xffc890}));gl.position.set(x,9.9,2.4);g.add(gl);}
  for(let x=-155;x<35;x+=12)box(.6,.9,.6,dark,x,3.45,1.2);
  /* a crane on the quay, two boats tied up in the basin */
  box(1.2,22,1.2,dark,-110,14,8);box(30,1,1.2,dark,-100,25,8);box(.2,14,.2,dark,-88,18,8);
  for(const [x,c] of [[-70,0x5a2a22],[-40,0x2a3a4a]]){const b=box(5,2.4,16,new T.MeshStandardMaterial({color:c,roughness:.7}),x,.9,-10);b.rotation.y=.05;box(3,2.2,4,new T.MeshStandardMaterial({color:0xaaa497,roughness:.8}),x,3.2,-7);}
  /* the cannery: a long shed with a sawtooth roof and two stacks, half over the water on piles */
  const can=new T.Group();can.position.set(S.CANNERY.x,0,S.CANNERY.z);g.add(can);S.cannery=can;
  S.canMat=new T.MeshStandardMaterial({color:0x6a3a2c,roughness:.8});S.canRoof=new T.MeshStandardMaterial({color:0x4f5458,roughness:.5,metalness:.5});
  const cb=(w,h,d,m,x,y,z,rx)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);if(rx)b.rotation.x=rx;can.add(b);S.occ.push(b);return b;};
  cb(64,12,40,S.canMat,0,7,0);for(let i=0;i<5;i++)cb(64,.5,9,S.canRoof,0,15.5,-16+i*8,-.45);
  for(const x of [-18,14]){const st=new T.Mesh(new T.CylinderGeometry(1.4,1.8,22,12),S.canMat);st.position.set(x,24,12);can.add(st);S.occ.push(st);}
  for(let x=-30;x<=30;x+=10)for(const z of [-22,-30]){const pl=new T.Mesh(new T.CylinderGeometry(.35,.4,8,6),wood);pl.position.set(x,0,z);can.add(pl);}
  cb(64,.6,14,wood,0,3,-26);
  S.canWin=[];for(let i=0;i<8;i++){const w=new T.Mesh(new T.PlaneGeometry(4,2.4),new T.MeshBasicMaterial({color:0xffb46a}));w.position.set(-28+i*8,8,20.05);can.add(w);S.canWin.push(w);}
  /* wrecks on the beach: boats and cars, already grey (it has been eating them) */
  const grey=new T.MeshStandardMaterial({color:0x56544e,roughness:1});S.greyMat=grey;
  [[60,-20,.4],[84,-34,1.2],[100,-12,2],[52,-40,2.6],[160,-30,.7]].forEach(([x,z,r],i)=>{const b=box(i%2?4:3,i%2?2:1.6,i%2?12:5,grey,x,HJ(x,z)+.6,z,r);b.rotation.z=.2;});
  /* the high street and the town up the hill: houses both sides, pitched roofs, a few windows lit */
  let sd=11;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};const cols=[0x6d6258,0x5a5550,0x7a6e5e,0x4e5458,0x6e5a4e];
  S.windows=[];const roof=new T.MeshStandardMaterial({color:0x2a2624,roughness:.8});
  const house=(x,z,w,d,h,ry)=>{const y=HJ(x,z);const b=box(w,h,d,new T.MeshStandardMaterial({color:cols[Math.floor(rnd()*5)],roughness:.9}),x,y+h/2,z,ry);
    const rg=new T.CylinderGeometry(.01,w*.72,h*.45,4,1);rg.rotateY(Math.PI/4);const r=new T.Mesh(rg,roof);r.scale.set(1,1,d/w);r.position.set(x,y+h+h*.22,z);r.rotation.y=ry||0;g.add(r);S.occ.push(r);
    if(rnd()<.55){const wm=new T.Mesh(new T.PlaneGeometry(1.3,1.5),new T.MeshBasicMaterial({color:new T.Color(1,.7,.4).multiplyScalar(.6+rnd()*.6)}));
      const side=x<S.STREET?1:-1;wm.position.set(x+side*(w/2+.03),y+h*.6,z+(rnd()-.5)*d*.5);wm.rotation.y=side*Math.PI/2;g.add(wm);S.windows.push(wm);}};
  for(let z=30;z<330;z+=0){const d=8+rnd()*6;for(const side of [-1,1]){if(Math.abs(z-80)<6||Math.abs(z-140)<6)continue;const w=9+rnd()*5,h=7+rnd()*7;house(S.STREET+side*(8+w/2),z+d/2,w,d,h);}z+=d+.6;}
  for(let i=0;i<120;i++){const x=-260+rnd()*520,z=40+rnd()*300;if(Math.abs(x-S.STREET)<30)continue;if(x>60&&z<60)continue;if(x>-2&&x<90&&z<96)continue;house(x,z,8+rnd()*6,8+rnd()*6,6+rnd()*8,rnd()*.4);}
  /* Pike's sandbags across the street at z = 70 */
  for(let i=0;i<9;i++)box(1.6,.9,.9,new T.MeshStandardMaterial({color:0x6a6048,roughness:1}),S.STREET-7+i*1.7,HJ(S.STREET,70)+.45+(i%2)*.2,70);
  /* fires (for the end): lights, glow, smoke */
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
  [[110,14,10],[140,10,8],[92,20,6],[40,60,5],[-60,8,4],[150,-6,7]].forEach(([x,y,z0],i)=>{const z=[0,12,-8,64,3,20][i];const L=new T.PointLight(0xff7a2a,0,60,1.5);L.position.set(x,y,z);g.add(L);
    const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(1,.5,.15),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.position.set(x,y,z);s.scale.setScalar(z0*4.5);g.add(s);S.fires.push({L,s,k:z0});});
  const n=2400,mp=new Float32Array(n*3),ma=new Float32Array(n*2);for(let i=0;i<n;i++){const f=S.fires[i%S.fires.length];mp.set([f.L.position.x,f.L.position.y,f.L.position.z],i*3);ma.set([Math.random(),Math.random()],i*2);}
  const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('aS',new T.BufferAttribute(ma,2));
  S.smokeU={uT:S.u.uT,uK:{value:0}};const smoke=new T.Points(mg,new T.ShaderMaterial({uniforms:S.smokeU,transparent:true,depthWrite:false,fog:false,
    vertexShader:`attribute vec2 aS;uniform float uT,uK;varying float vA;void main(){float a=fract(uT*.08+aS.x);vec3 p=position+vec3(sin(aS.y*40.)*3.+a*30.,a*70.,cos(aS.y*30.)*3.-a*8.);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((8.+a*40.)*600./max(1.,-mv.z),2.,220.);vA=uK*(1.-a)*smoothstep(0.,.1,a)*.22;}`,
    fragmentShader:`varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(.05,.045,.045),vA*(1.-r));}`}));smoke.frustumCulled=false;g.add(smoke);
  g.add(S.hemi=new T.HemisphereLight(0x4a4660,0x1a1410,.6));S.sun=new T.DirectionalLight(0xff8a50,.7);S.sun.position.set(-800,120,-400);g.add(S.sun);
  S.fog=new T.FogExp2(0x2a1e1c,.0021);scene0.fog=S.fog;return S;};
S.update=function(t,o){o=o||{};S.u.uT.value=t;const dk=o.dusk||0;S.u.uDusk.value=dk;const rk=o.rift==null?1:o.rift;S.u.uRift.value=rk;S.riftLight.intensity=120*rk*(.85+.15*Math.sin(t*6));
  S.sun.intensity=.7*(1-dk);S.hemi.intensity=.6-.25*dk;S.fog.color.setRGB(.165-.12*dk,.12-.08*dk,.11-.07*dk);
  const C=S.u.uChurn.value;for(let i=0;i<16;i++){const c=o.churn&&o.churn[i];if(c)C[i].set(c.x,c.z,c.r,c.k);else C[i].w=0;}
  const gr=o.grey||0;S.canMat.color.setRGB(.415-.08*gr,.227+.1*gr,.172+.13*gr);S.canRoof.color.setRGB(.31+.03*gr,.33+.0*gr,.345-.02*gr);S.cannery.scale.y=1-gr*.35;S.cannery.rotation.z=gr*.05;
  S.canWin.forEach((w,i)=>w.visible=gr<.2+i*.08);
  const fk=o.fire||0;S.fires.forEach((f,i)=>{const fl=.75+.25*Math.sin(t*13+i*3)*Math.sin(t*7.3+i);f.L.intensity=fk*f.k*30*fl;f.s.material.opacity=fk*.9*fl;f.s.visible=fk>.01;});S.smokeU.uK.value=fk;};
return S;
})();
