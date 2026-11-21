'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: GUNFIRE (game/cinematic/film/film-fx.js, session D)
   What the Wraiths' weapons leave in the real world, for battle scenes. The scene's sim records events; this draws the
   ones that are still alive at time t (so a frame depends only on t and the sim's log):
     FFX.shot(t, from, to, k)   a tracer from a muzzle to where the round lands (k: 1 autocannon, 3 Lance)
     FFX.puff(t, at, k)         sand or spray thrown up where it lands
     FFX.flash(t, at, k)        a muzzle flash (light and glow)
     FFX.update(t, cam, px)     draw time t;  FFX.reset() clears the log (the sim restarts)
   ===================================================================================================================== */
const FFX=(function(){
const T=THREE,F={shots:[],puffs:[],flashes:[]};let scene=null;
const NT=160,NP=6000,NF=12;
const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
F.init=function(sc){scene=sc;
  /* tracers: quads stretched along the shot, drawn additively */
  const tg=new T.BufferGeometry();F.tp=new Float32Array(NT*6*3);F.ta=new Float32Array(NT*6);
  tg.setAttribute('position',new T.BufferAttribute(F.tp,3).setUsage(T.DynamicDrawUsage));tg.setAttribute('aA',new T.BufferAttribute(F.ta,1).setUsage(T.DynamicDrawUsage));
  F.tm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,side:T.DoubleSide,
    vertexShader:`attribute float aA;varying float vA;void main(){vA=aA;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying float vA;void main(){gl_FragColor=vec4(vec3(1.,.78,.45)*vA*3.,1.);}`});
  F.tracers=new T.Mesh(tg,F.tm);F.tracers.frustumCulled=false;scene.add(F.tracers);
  /* puffs of sand: particles thrown up and falling, grey */
  const pg=new T.BufferGeometry();F.pp=new Float32Array(NP*3);F.pa=new Float32Array(NP*4);
  pg.setAttribute('position',new T.BufferAttribute(F.pp,3).setUsage(T.DynamicDrawUsage));pg.setAttribute('aS',new T.BufferAttribute(F.pa,4).setUsage(T.DynamicDrawUsage));
  F.pu={uT:{value:0},uScale:{value:1},uCol:{value:new T.Color(.42,.41,.38)}};
  F.pm=new T.ShaderMaterial({uniforms:F.pu,transparent:true,depthWrite:false,fog:false,
    vertexShader:`attribute vec4 aS;uniform float uT,uScale;varying float vA;
    void main(){float age=uT-aS.w;float a=aS.x*6.2832;float up=(3.+aS.y*9.)*aS.z;float sp=(1.+aS.y*3.)*aS.z;
      vec3 p=position+vec3(cos(a)*sp*age,max(0.,up*age-9.8*age*age*.5),sin(a)*sp*age);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float life=clamp(1.-age/1.6,0.,1.);
      vA=(age>0.&&age<1.6)?life*life:0.;gl_PointSize=clamp((.35+age*.8)*aS.z*uScale/max(1.,-mv.z),1.,48.);}`,
    fragmentShader:`uniform vec3 uCol;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(uCol,vA*(1.-r)*.55);}`});
  F.puffPts=new T.Points(pg,F.pm);F.puffPts.frustumCulled=false;scene.add(F.puffPts);
  /* muzzle flashes: a few sprites and lights, reused */
  F.fs=[];for(let i=0;i<NF;i++){const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(1,.7,.35),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
    s.visible=false;scene.add(s);const L=i<4?new T.PointLight(0xffb060,0,40,1.6):null;if(L)scene.add(L);F.fs.push({s,L});}
  return F;};
F.reset=function(){F.shots.length=0;F.puffs.length=0;F.flashes.length=0;F.pHead=0;F.pa.fill(-99,0);for(let i=3;i<F.pa.length;i+=4)F.pa[i]=-99;F.puffPts.geometry.attributes.aS.needsUpdate=true;};
F.shot=function(t,from,to,k){F.shots.push({t,a:from.clone(),b:to.clone(),k:k||1});if(F.shots.length>400)F.shots.splice(0,F.shots.length-400);};
F.flash=function(t,at,k){F.flashes.push({t,p:at.clone(),k:k||1});if(F.flashes.length>200)F.flashes.splice(0,F.flashes.length-200);};
F.pHead=0;
F.puff=function(t,at,k,n){n=n||14;for(let j=0;j<n;j++){const i=F.pHead;F.pHead=(F.pHead+1)%NP;F.pp.set([at.x+(Math.random()-.5)*.6*k,at.y,at.z+(Math.random()-.5)*.6*k],i*3);
  F.pa.set([Math.random(),Math.random(),k*(.6+Math.random()*.6),t+Math.random()*.05],i*4);}
  F.puffPts.geometry.attributes.position.needsUpdate=true;F.puffPts.geometry.attributes.aS.needsUpdate=true;};
const _d=new T.Vector3(),_s=new T.Vector3(),_c=new T.Vector3();
F.update=function(t,cam,px){F.pu.uT.value=t;F.pu.uScale.value=px||1;
  let n=0;for(const s of F.shots){const age=t-s.t;if(age<0||age>.09||n>=NT)continue;
    const L=s.a.distanceTo(s.b);const u0=Math.max(0,age/.09-.35),u1=Math.min(1,age/.09+.15);
    _d.subVectors(s.b,s.a);const A=s.a.clone().addScaledVector(_d,u0),B=s.a.clone().addScaledVector(_d,u1);
    _c.subVectors(cam.position,A);_s.crossVectors(_d,_c).normalize().multiplyScalar(.07*s.k+.0015*A.distanceTo(cam.position));
    const q=[A.clone().add(_s),A.clone().sub(_s),B.clone().add(_s),B.clone().sub(_s)];const al=s.k*(1-age/.09)*.8;
    const P=[q[0],q[1],q[2],q[2],q[1],q[3]];for(let j=0;j<6;j++){F.tp.set([P[j].x,P[j].y,P[j].z],(n*6+j)*3);F.ta[n*6+j]=al;}n++;}
  for(let i=n;i<NT;i++)for(let j=0;j<6;j++)F.ta[i*6+j]=0;
  F.tracers.geometry.attributes.position.needsUpdate=true;F.tracers.geometry.attributes.aA.needsUpdate=true;F.tracers.geometry.setDrawRange(0,Math.max(1,n)*6);
  let m=0;for(let i=F.flashes.length-1;i>=0&&m<NF;i--){const f=F.flashes[i];const age=t-f.t;if(age<0||age>.06)continue;const E=F.fs[m++];
    E.s.visible=true;E.s.position.copy(f.p);const k=f.k*(1-age/.06);E.s.scale.setScalar(1.6*f.k*(.7+.6*Math.abs(Math.sin(f.t*917.3))));E.s.material.opacity=k;if(E.L){E.L.position.copy(f.p);E.L.intensity=60*k;}}
  for(;m<NF;m++){F.fs[m].s.visible=false;if(F.fs[m].L)F.fs[m].L.intensity=0;}};
return F;
})();
