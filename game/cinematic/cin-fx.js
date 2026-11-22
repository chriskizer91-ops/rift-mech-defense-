'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE SIGNAL'S REVEAL: FIRE AND WATER (game/cinematic/cin-fx.js, session D)
   The real things that happen in act 3, all driven by the film's time (nothing random at play time, so every play and
   every recorded frame match):
     FX.gun(at, t0, dark)   one of ANVIL's guns fires at t0: a muzzle flash, a light on the ridge (none if dark), smoke
     FX.shell(from, to, t0, t1)   a shell's tracer on a high arc, landing at t1
     FX.blast(at, t0, k, dark)  an explosion on the water: a fireball, a light (none if dark), spray falling back
     FX.ring(at, t0)        the slam's shock ring running out across the bay
     FX.update(t)           place everything for time t
   ===================================================================================================================== */
const FX=(function(){
const T=THREE,clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const F={items:[]};let scene=null;
const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
const spr=(col,k)=>{const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:col.multiplyScalar(k||1),blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.visible=false;scene.add(s);return s;};
let sd=99;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646;};
F.init=function(sc){scene=sc;
  /* the spray: one buffer of particles shared by every blast, moved in the shader */
  const N=9000,pos=new Float32Array(N*3),sdA=new Float32Array(N*4);for(let i=0;i<N;i++){sdA.set([rnd(),rnd(),rnd(),rnd()],i*4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aS',new T.BufferAttribute(sdA,4));
  F.sprayU={uT:{value:0},uB:{value:Array.from({length:6},()=>new T.Vector4(0,-999,0,-99))},uScale:{value:1}};
  const m=new T.ShaderMaterial({uniforms:F.sprayU,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
    vertexShader:`attribute vec4 aS;uniform float uT,uScale;uniform vec4 uB[6];varying float vA;varying vec3 vC;
    void main(){int k=int(floor(aS.w*6.));vec4 B=uB[0];if(k==1)B=uB[1];if(k==2)B=uB[2];if(k==3)B=uB[3];if(k==4)B=uB[4];if(k==5)B=uB[5];
      float age=uT-B.w;float a=aS.x*6.2832;float up=18.+aS.y*46.;float sp=2.+aS.z*13.;
      vec3 p=vec3(B.x+cos(a)*sp*age,max(0.,up*age-9.8*age*age*.5),B.z+sin(a)*sp*age);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float life=clamp(1.-age/(2.2+aS.y*2.2),0.,1.);
      vA=(age>0.&&p.y>0.)?life:0.;gl_PointSize=clamp(1.4*uScale/max(1.,-mv.z),1.,9.);vC=mix(vec3(1.,.55,.25)*2.,vec3(.5,.55,.6),smoothstep(.0,.5,age));}`,
    fragmentShader:`varying float vA;varying vec3 vC;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vC*vA*(1.-r)*.35,1.);}`});
  const p=new T.Points(g,m);p.frustumCulled=false;scene.add(p);
  /* the shock ring */
  F.ringM=new T.ShaderMaterial({uniforms:{uR:{value:0},uA:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false,
    vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uR,uA;varying vec2 vP;void main(){float d=length(vP);float w=exp(-pow((d-uR)/(6.+uR*.05),2.));
      gl_FragColor=vec4(vec3(1.,.5,.25)*w*uA*.9+vec3(.6,.7,.8)*w*uA*.25,1.);}`});
  const rg=new T.PlaneGeometry(3000,3000);rg.rotateX(-Math.PI/2);F.ring=new T.Mesh(rg,F.ringM);F.ring.position.y=.4;F.ring.visible=false;scene.add(F.ring);
  return F;};
F.gun=function(muzzle,t0,dark){const s=spr(new T.Color(1,.75,.4),4);let L=null;if(!dark){L=new T.PointLight(0xffb060,0,90,1.6);L.position.copy(muzzle);scene.add(L);}
  const sm=spr(new T.Color(.05,.05,.05));sm.material.blending=T.NormalBlending;sm.material.color.setRGB(.06,.06,.06);F.items.push({k:'gun',p:muzzle.clone(),t0,s,L,sm});};
F.shell=function(from,to,t0,t1){const head=spr(new T.Color(1,.85,.55),14);const trail=[0,1,2,3,4,5,6,7,8,9].map(()=>spr(new T.Color(1,.5,.2),7));
  F.items.push({k:'shell',a:from.clone(),b:to.clone(),t0,t1,head,trail,apex:Math.max(from.y,to.y)+700});};
let blastN=0;
F.blast=function(at,t0,k,dark){const s=spr(new T.Color(1,.42,.12),1.8);const c=spr(new T.Color(1,.8,.5),3.2);let L=null;if(!dark){L=new T.PointLight(0xff7a30,0,700,1.4);L.position.copy(at).setY(30);scene.add(L);}
  const slot=blastN++%6;F.items.push({k:'blast',p:at.clone(),t0,str:k||1,s,c,L,slot});};
F.ringAt=function(at,t0){F.ringT0=t0;F.ring.position.x=at.x;F.ring.position.z=at.z;};
const _v=new T.Vector3();
F.update=function(t,cam,pxScale){F.sprayU.uT.value=t;F.sprayU.uScale.value=pxScale;
  for(const it of F.items){
    if(it.k==='gun'){const a=t-it.t0;const on=a>=0&&a<.5;it.s.visible=on;it.sm.visible=a>0&&a<6;if(it.L)it.L.intensity=on?Math.max(0,1-a/.25)*900:0;
      if(on){it.s.position.copy(it.p);const f=Math.max(0,1-a/.3);it.s.scale.setScalar(2+f*9);it.s.material.opacity=f;}
      if(it.sm.visible){it.sm.position.copy(it.p).add(_v.set(a*3,a*4.5,-a*1.5));it.sm.scale.setScalar(4+a*5);it.sm.material.opacity=.45*(1-a/6);}}
    else if(it.k==='shell'){const u=(t-it.t0)/(it.t1-it.t0);const on=u>0&&u<1;it.head.visible=on;
      const P=w=>{const x=it.a.x+(it.b.x-it.a.x)*w,z=it.a.z+(it.b.z-it.a.z)*w;const y=(1-w)*(1-w)*it.a.y+2*(1-w)*w*it.apex+w*w*it.b.y;return _v.set(x,y,z);};
      if(on){it.head.position.copy(P(u));it.head.scale.setScalar(16);}
      it.trail.forEach((s,i)=>{const w=u-(i+1)*.008;s.visible=on&&w>0;if(s.visible){s.position.copy(P(w));s.scale.setScalar(13-i*1.1);s.material.opacity=.8*(1-i/10);}});}
    else if(it.k==='blast'){const a=t-it.t0;const on=a>=0&&a<5;it.s.visible=it.c.visible=on;if(it.L)it.L.intensity=a>=0&&a<3?Math.pow(Math.max(0,1-a/2.2),2)*6e4*it.str:0;
      if(on){it.s.position.copy(it.p).setY(10+a*16);it.s.scale.setScalar((26+Math.sqrt(a)*46)*it.str);it.s.material.opacity=Math.max(0,1-a/3.5)*(.8+.2*Math.sin(a*40));
        it.c.position.copy(it.p).setY(8+a*6);it.c.scale.setScalar((36*Math.max(0,1-a/.5)+6)*it.str);it.c.material.opacity=Math.max(0,1-a/.6);}
      F.sprayU.uB.value[it.slot].set(it.p.x,0,it.p.z,a>=-.01&&a<8?it.t0:-99);}}
  if(F.ringT0!=null){const a=t-F.ringT0;F.ring.visible=a>0&&a<6;if(F.ring.visible){F.ringM.uniforms.uR.value=a*260;F.ringM.uniforms.uA.value=Math.max(0,1-a/6)*1.4;}}};
return F;
})();
