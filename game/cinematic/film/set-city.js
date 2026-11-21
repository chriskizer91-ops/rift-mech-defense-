'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: THE NIGHT OF THE STATIC, AND THE SEAFLOOR (game/cinematic/film/set-city.js, session D)
   Two small sets for Intel Brief 00, each in its own group (the scene shows one at a time):
     CITY       a city block at night, every window, phone and billboard showing static (uStatic: how much; uFlare: the
                moment every screen flares at once). x east, z south; the street runs along z.
     SEAFLOOR   the sea from very high up, far off at x = 40000: dark water, and under it the cracks glowing orange
                (uCrack: how far they have opened)
   ===================================================================================================================== */
const CITY=(function(){
const T=THREE,C={u:{uT:{value:0},uStatic:{value:1},uFlare:{value:0}}};
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`;
/* the screens: every lit window and billboard shows static, a little different each */
const screenFrag=`varying vec2 vU;varying vec3 vW;uniform float uT,uStatic,uFlare;${NOISE}
  void main(){vec2 cell=floor(vU);vec2 f=fract(vU);float id=h2(cell+floor(vW.xz*.1));
    float lit=step(.35,id);if(f.x<.12||f.x>.88||f.y<.15||f.y>.85)lit=0.;
    float n=h2(floor(f*vec2(24.,18.))+cell*7.+floor(uT*24.+id*50.));float roll=fract(f.y+uT*(.3+id));n*=.75+.25*step(.04,roll);
    vec3 warm=vec3(1.,.82,.55)*.35;vec3 stc=vec3(.75,.8,.9)*n;vec3 c=mix(warm,stc,uStatic)*lit*(.6+.4*id)*(1.+uFlare*2.5);
    gl_FragColor=vec4(c,1.);}`;
const screenVert=`varying vec2 vU;varying vec3 vW;uniform vec2 uRep;void main(){vU=uv*uRep;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
C.build=function(scene){const g=new T.Group();scene.add(g);C.group=g;
  const dark=new T.MeshStandardMaterial({color:0x14161a,roughness:.9}),road=new T.MeshStandardMaterial({color:0x0b0c0e,roughness:.6,metalness:.2});
  const gr=new T.Mesh(new T.PlaneGeometry(600,2000),road);gr.rotation.x=-Math.PI/2;g.add(gr);
  const sky=new T.Mesh(new T.SphereGeometry(5000,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:C.u,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=(projectionMatrix*modelViewMatrix*vec4(position,1.)).xyww;}`,
    fragmentShader:`varying vec3 vD;uniform float uFlare;void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(vec3(.05,.03,.025),vec3(.006,.007,.012),pow(y,.35));gl_FragColor=vec4(c*(1.+uFlare*.6),1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);g.add(sky);
  /* towers both sides of the street, each face a grid of windows */
  let s=3;const rnd=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
  for(const side of [-1,1])for(let z=-900;z<200;z+=0){const w=18+rnd()*22,d=18+rnd()*18,h=20+rnd()*rnd()*130;const x=side*(16+d/2+rnd()*3);
    const b=new T.Mesh(new T.BoxGeometry(d,h,w),dark);b.position.set(x,h/2,z+w/2);g.add(b);
    const m=new T.ShaderMaterial({uniforms:Object.assign({uRep:{value:new T.Vector2(w/3.4,h/3.6)}},C.u),vertexShader:screenVert,fragmentShader:screenFrag});
    const f=new T.Mesh(new T.PlaneGeometry(w,h),m);f.position.set(x-side*(d/2+.05),h/2,z+w/2);f.rotation.y=-side*Math.PI/2;g.add(f);
    if(rnd()<.35){const bw=8+rnd()*6,bh=bw*.55,bm=new T.ShaderMaterial({uniforms:Object.assign({uRep:{value:new T.Vector2(1,1)}},C.u),vertexShader:screenVert,
        fragmentShader:screenFrag.replace('float lit=step(.35,id);if(f.x<.12||f.x>.88||f.y<.15||f.y>.85)lit=0.;','float lit=1.;if(f.x<.03||f.x>.97||f.y<.04||f.y>.96)lit=.0;')});
      const bb=new T.Mesh(new T.PlaneGeometry(bw,bh),bm);bb.position.set(x-side*(d/2+.4),12+rnd()*30,z+w/2);bb.rotation.y=-side*Math.PI/2;g.add(bb);
      const L=new T.PointLight(0x9aa8c0,8,40,1.6);L.position.set(x-side*(d/2+5),bb.position.y,z+w/2);g.add(L);C.lights=(C.lights||[]).concat(L);}
    z+=w+2+rnd()*6;}
  /* street lights, a few stopped cars with their phones glowing */
  for(let z=-880;z<180;z+=34)for(const x of [-13,13]){const p=new T.Mesh(new T.CylinderGeometry(.12,.15,8,6),dark);p.position.set(x,4,z);g.add(p);
    const L=new T.PointLight(0xffa860,6,26,1.8);L.position.set(x*.85,7.6,z);g.add(L);}
  for(let i=0;i<14;i++){const car=new T.Mesh(new T.BoxGeometry(2,1.4,4.4),new T.MeshStandardMaterial({color:[0x30343a,0x5a1e1a,0x22303e][i%3],roughness:.4,metalness:.5}));
    car.position.set((i%2?-5:5)+Math.sin(i)*1.2,.75,-60-i*45);car.rotation.y=Math.sin(i*2.1)*.2;g.add(car);}
  g.add(new T.HemisphereLight(0x223044,0x050505,.35));
  C.fog=new T.FogExp2(0x0c0a0a,.0045);return C;};
C.update=function(t,o){C.u.uT.value=t;C.u.uStatic.value=o.static==null?1:o.static;C.u.uFlare.value=o.flare||0;};
return C;
})();
const SEAFLOOR=(function(){
const T=THREE,S={u:{uT:{value:0},uCrack:{value:1},uCam:{value:new T.Vector3()}}};
S.X=40000;
S.build=function(scene){const g=new T.Group();g.position.x=S.X;scene.add(g);S.group=g;
  const m=new T.ShaderMaterial({uniforms:S.u,fog:false,
    vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float uT,uCrack;uniform vec3 uCam;
    float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}
    void main(){vec2 p=(vW.xz-vec2(${40000}.,0.))*.00035;
      float c1=abs(fbm(p*1.3+2.)-.5),c2=abs(fbm(p*3.1+7.)-.5),c3=abs(fbm(p*7.+1.)-.5);
      float open=uCrack;float v=exp(-c1*c1*2600./(.3+open))*1.+exp(-c2*c2*5200./(.3+open))*.55+exp(-c3*c3*9000.)*.25*open;
      float pulse=.8+.2*sin(uT*1.4+fbm(p*2.)*8.);vec3 mag=vec3(1.,.32,.06)*v*pulse*open;
      vec3 sea=vec3(.004,.008,.012)+vec3(.01,.015,.02)*fbm(p*20.+uT*.05);
      /* the water over it: lighter where the swell catches the sky */
      float sw=fbm(p*60.+vec2(uT*.08,uT*.05));vec3 col=sea+mag*.55*(1.-sw*.35)+vec3(.02,.025,.03)*smoothstep(.6,.8,sw);
      gl_FragColor=vec4(col,1.);}`});
  const pl=new T.Mesh(new T.PlaneGeometry(60000,60000),m);pl.rotation.x=-Math.PI/2;g.add(pl);
  /* clouds below the camera: soft sprites drifting */
  const cl=new T.Group();g.add(cl);const tx=(function(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const gr=x.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);})();
  let s=9;const rnd=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
  for(let i=0;i<70;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:tx,color:0x1a1c22,transparent:true,depthWrite:false,opacity:.7,fog:false}));
    sp.position.set((rnd()-.5)*9000,900+rnd()*900,(rnd()-.5)*9000);sp.scale.setScalar(900+rnd()*1500);cl.add(sp);}
  S.clouds=cl;return S;};
S.update=function(t,o){S.u.uT.value=t;S.u.uCrack.value=o.crack==null?1:o.crack;if(S.clouds)S.clouds.position.x=t*40;};
return S;
})();
