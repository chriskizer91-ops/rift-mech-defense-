'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE FILM: THE SALTPANS AT NIGHT (game/cinematic/film/set-saltpans.js, session D)
   Mission 5. Flat salt pans in a grid of low berms, white crust and black brine, mist on the ground, the saltworks'
   sheds with a few lamps. The channel runs north–south along x = 0 (too wide for the jets): Reed's squad is west of it,
   Copper's east. x east, z south, y up.  SALT.update(t, o): o = {churn:[{x,z,r,k}], lamps 0..1}
   ===================================================================================================================== */
const SALT=(function(){
const T=THREE,S={occ:[],u:{uT:{value:0},uChurn:{value:Array.from({length:16},()=>new T.Vector4())},uCam:{value:new T.Vector3()}}};
const NOISE=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}`;
const CH=x=>Math.abs(x)<34?-1.4*(1-Math.pow(Math.abs(x)/34,2)):0;
S.h=(x,z)=>CH(x);
S.build=function(scene0){const g=new T.Group();scene0.add(g);S.group=g;
  /* the sky: night, a few stars through thin cloud, a glow on the horizon from the town */
  const sky=new T.Mesh(new T.SphereGeometry(9000,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:S.u,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=(projectionMatrix*modelViewMatrix*vec4(position,1.)).xyww;}`,
    fragmentShader:`varying vec3 vD;uniform float uT;${NOISE}void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(vec3(.02,.022,.03),vec3(.002,.003,.006),pow(y,.4));
      vec2 q=d.xz/(y+.1);float st=step(.997,h2(floor(q*180.)))*smoothstep(.05,.3,y)*(1.-smoothstep(.4,.7,fbm(q*.8)));c+=vec3(.6,.65,.8)*st*.5;
      c+=vec3(.06,.03,.015)*exp(-y*14.)*max(0.,-d.x*.6+.4);gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);g.add(sky);
  /* the pans */
  const N=240,geo=new T.PlaneGeometry(900,900,N,N);geo.rotateX(-Math.PI/2);const P=geo.attributes.position;for(let i=0;i<P.count;i++)P.setY(i,CH(P.getX(i)));geo.computeVertexNormals();
  const m=new T.ShaderMaterial({uniforms:Object.assign({},S.u,T.UniformsLib.fog),fog:true,
    vertexShader:`varying vec3 vW;varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normal;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`varying vec3 vW;varying vec3 vN;uniform float uT;uniform vec4 uChurn[16];${NOISE}
    #include <fog_pars_fragment>
    void main(){vec2 p=vW.xz;vec2 cell=fract(p/vec2(46.,38.));vec2 ce=floor(p/vec2(46.,38.));float berm=1.-smoothstep(.0,.04,min(min(cell.x,1.-cell.x),min(cell.y,1.-cell.y)));
     float brine=smoothstep(.55,.7,fbm(p*.03+ce*3.1))*(1.-berm);float crust=fbm(p*.6)*.6+fbm(p*3.)*.4;
     float ch=0.;for(int i=0;i<16;i++){vec4 c=uChurn[i];if(c.w<=0.)continue;float d=length(p-c.xy);ch+=c.w*exp(-d*d/(c.z*c.z));}ch=clamp(ch,0.,1.5);
     vec3 col=mix(vec3(.5,.5,.48)*(.75+.35*crust),vec3(.04,.045,.05),brine);col=mix(col,vec3(.32,.3,.27),berm);
     float cr=smoothstep(.48,.5,abs(fbm(p*1.4+uT*.4)-.5)+.47)*ch;col*=1.-cr*.7-ch*.18;
     float chan=smoothstep(-.3,-.9,vW.y);col=mix(col,vec3(.02,.022,.025),chan);
     vec3 L=vec3(.05,.055,.075)*(.6+.4*vN.y);
     gl_FragColor=vec4(col*L*1.7,1.);
     #include <fog_fragment>
    }`});
  const ground=new T.Mesh(geo,m);g.add(ground);S.occ.push(ground);
  /* the channel's black water */
  const wm=new T.ShaderMaterial({uniforms:S.u,transparent:true,depthWrite:false,fog:false,vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float uT;uniform vec3 uCam;${NOISE}void main(){vec3 v=normalize(uCam-vW);float fr=.04+.9*pow(1.-v.y,5.);float r=fbm(vW.xz*.15+vec2(0.,uT*.2));
      vec3 c=vec3(.006,.007,.01)+vec3(.04,.045,.06)*fr*(.6+.4*r)+vec3(.12,.08,.05)*fr*smoothstep(.6,.8,r)*.3;float d=length(uCam-vW);c=mix(c,vec3(.012,.013,.016),1.-exp(-d*.003));gl_FragColor=vec4(c,1.);}`});
  const wg=new T.PlaneGeometry(56,900);wg.rotateX(-Math.PI/2);const water=new T.Mesh(wg,wm);water.position.y=-.55;water.onBeforeRender=(r,s,cam)=>S.u.uCam.value.copy(cam.position);g.add(water);
  /* the saltworks east of the channel: sheds, a conveyor, a few lamps */
  const dark=new T.MeshStandardMaterial({color:0x2a2c30,roughness:.85}),tin=new T.MeshStandardMaterial({color:0x50555a,roughness:.5,metalness:.6});
  const box=(w,h,d,mat,x,y,z,ry)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mat);b.position.set(x,y,z);if(ry)b.rotation.y=ry;g.add(b);S.occ.push(b);return b;};
  [[120,-60,30,9,18],[150,-20,22,7,14],[110,40,40,11,20],[175,60,18,6,12],[-160,-40,24,8,14],[-190,30,30,9,16]].forEach(([x,z,w,h,d],i)=>{box(w,h,d,i%2?dark:tin,x,h/2,z,i*.2);box(w+1,.4,d+1,dark,x,h+.2,z,i*.2);});
  box(70,.8,2,tin,80,7,-40,.3);for(let i=0;i<6;i++)box(.4,7,.4,dark,52+i*11,3.5,-48+i*3.2);
  S.lamps=[];[[118,-42],[150,-8],[96,58],[-150,-24],[-176,46]].forEach(([x,z])=>{const L=new T.PointLight(0xffb070,14,55,1.7);L.position.set(x,9,z);g.add(L);
    const p=new T.Mesh(new T.CylinderGeometry(.1,.12,9,6),dark);p.position.set(x,4.5,z);g.add(p);S.lamps.push(L);});
  g.add(new T.HemisphereLight(0x1c2436,0x060606,.5));const moon=new T.DirectionalLight(0x8090b0,.25);moon.position.set(-300,400,-200);g.add(moon);
  /* mist on the pans */
  const n=2200,mp=new Float32Array(n*3),ma=new Float32Array(n);for(let i=0;i<n;i++){mp.set([(Math.random()-.5)*600,.5+Math.random()*3,(Math.random()-.5)*600],i*3);ma[i]=Math.random();}
  const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(mp,3));mg.setAttribute('aS',new T.BufferAttribute(ma,1));
  const mistM=new T.ShaderMaterial({uniforms:S.u,transparent:true,depthWrite:false,fog:false,vertexShader:`attribute float aS;uniform float uT;varying float vA;void main(){vec3 p=position+vec3(sin(uT*.05+aS*30.)*8.,0.,uT*.4*aS);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(2400./max(1.,-mv.z),2.,160.);vA=.035*smoothstep(500.,30.,-mv.z);}`,
    fragmentShader:`varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(.25,.26,.3),vA*(1.-r)*(1.-r));}`});
  const mist=new T.Points(mg,mistM);mist.frustumCulled=false;g.add(mist);
  S.fog=new T.FogExp2(0x07080a,.0035);scene0.fog=S.fog;return S;};
S.update=function(t,o){o=o||{};S.u.uT.value=t;const C=S.u.uChurn.value;for(let i=0;i<16;i++){const c=o.churn&&o.churn[i];if(c)C[i].set(c.x,c.z,c.r,c.k);else C[i].w=0;}
  const lk=o.lamps==null?1:o.lamps;S.lamps.forEach((L,i)=>L.intensity=14*lk*(.9+.1*Math.sin(t*31+i)));};
return S;
})();
