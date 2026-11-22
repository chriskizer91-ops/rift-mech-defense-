'use strict';
/* =====================================================================================================================
   RIFT MECH DEFENSE · THE WORLD, FOR OTHER PAGES (game/world/wt-world.js)
   Puts one of B's maps into a scene someone else owns (the mission, the film, C's arena): the ground (25 cm soil detail
   round a focus point), the water, the trees, the buildings, the wrecks, rocks and props (the pier, the fence, the
   lifeguard tower), lit by whatever lights the scene has. Drawn for the lit view only.
   Needs, before it: window.WT_MAP, wt-map.js, wt-fields.js (and the map's own file), wt-soil.js, wt-look.js, wt-trees.js;
   and window.WT_ASSETS (the pictures and the trees: game/world/build.py's assets()).
     RMD.World.build(scene, renderer, {phone, fog})   once
     RMD.World.update(dt, t, focus {x,y,z}, camera, w, h, pixelRatio, renderer)   every frame
     RMD.World.heightAt(x,z), depthAt(x,z), waterAt(x,z), radius (how far from the middle you may go)
     RMD.World.foot(x,z,yaw,load) a footprint (returns {kind, depth}); churn(x,z,r,k,heat); ring(x,z,a); crater(x,z,R,D)
   ===================================================================================================================== */
window.WT=window.WT||{phone:matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600,view:0};
window.VIEWED=window.VIEWED||[];window.setView=window.setView||function(){};
window.RMD=window.RMD||{};
RMD.World=(function(){
  const W={ground:null,water:null,group:null,map:MAPID,radius:(MAPS[MAPID]||MAPS.coast).S/2-24};
  function grid(n,c,E){const h=n/2,A=c*h,B=E-A,P=[],I=[];const w=q=>{const u=q/h-1;return A*u+B*u*u*u;};
    for(let j=0;j<=n;j++)for(let i=0;i<=n;i++)P.push(w(i),0,w(j));
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=j*(n+1)+i,q=p+1,r=p+n+1,s=r+1;I.push(p,r,s,p,s,q);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(P.length).map((_,k)=>k%3===1?1:0),3));g.setIndex(I);return g;}
  function box(w,h,d,mat,x,y,z,ry){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=m.receiveShadow=true;return m;}
  W.build=function(scene,R,o){o=o||{};const phone=o.phone!=null?o.phone:WT.phone;WT.phone=phone;
    buildMap();soilInit();lookTextures();
    const G=W.group=new THREE.Group();scene.add(G);
    if(o.fog!==false)scene.fog=new THREE.Fog(o.fogColor||new THREE.Color(.52,.58,.62),MAP.def.fog[0],MAP.def.fog[1]);
    const E=MAP.def.fog[1]*.8;
    W.ground=new THREE.Mesh(grid(phone?224:288,.25,E),matTerrain());W.ground.receiveShadow=true;W.ground.frustumCulled=false;G.add(W.ground);
    W.water=new THREE.Mesh(grid(phone?96:128,.5,E),matWater());W.water.renderOrder=2;W.water.receiveShadow=true;W.water.frustumCulled=false;G.add(W.water);
    const T=LOOK.tex,std=(map,x)=>new THREE.MeshStandardMaterial(Object.assign({map,roughness:.88,metalness:.05},x||{}));
    const mats={1:std(T.fac1,{roughness:.8}),2:std(T.fac2,{roughness:.6,metalness:.15}),3:std(T.barn||T.fac1,{roughness:.85}),roof:std(T.roof,{color:0x8a8580}),
      rock:std(T.rock,{color:0xb8b0a4,roughness:.95}),wreck:std(T.metal,{color:0x7a7c80,roughness:.6,metalness:.5}),
      wood:new THREE.MeshStandardMaterial({color:0x5a5148,roughness:.9}),dark:new THREE.MeshStandardMaterial({color:0x2a2a2c,roughness:.8,metalness:.3}),
      red:new THREE.MeshStandardMaterial({color:0x8a3a2c,roughness:.8})};
    for(const k of [1,2,3,'roof','wood'])if(mats[k])cutout(mats[k]);W.mats=mats;
    /* buildings: boxes, the facade picture 12 m (brick), 16 m (offices) or 6 m (boards) to a tile */
    const quads={1:[],2:[],3:[],roof:[]};
    for(const b of BUILD){const tl=b.kind===1?12:b.kind===3?6:16,F=quads[b.kind],vr=(b.y1-b.y0)/tl,v0=-(b.y0+2)/tl,{x0,x1,z0,z1,y0,y1}=b;
      F.push([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],(x1-x0)/tl,vr,x0/tl,v0],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],(x1-x0)/tl,vr,x0/tl,v0],
        [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],(z1-z0)/tl,vr,z0/tl,v0],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],(z1-z0)/tl,vr,z0/tl,v0]);
      quads.roof.push([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],(x1-x0)/8,(z1-z0)/8,0,0]);}
    for(const k in quads){const A=quads[k];if(!A.length)continue;const p=[],u=[],ix=[];
      for(const [a,b,c,d,uw,vh,u0,v0] of A){const n=p.length/3;p.push(...a,...b,...c,...d);u.push(u0,v0,u0+uw,v0,u0+uw,v0+vh,u0,v0+vh);ix.push(n,n+1,n+2,n,n+2,n+3);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();
      const m=new THREE.Mesh(g,mats[k]);m.castShadow=m.receiveShadow=true;G.add(m);}
    for(const [i,q] of WRECKS.entries()){const gg=rockGeoW(500+i,1.6*q.s);gg.scale(1.5,.55,.9);const m=new THREE.Mesh(gg,mats.wreck);m.position.set(q.x,q.y+.25*q.s,q.z);m.rotation.y=i*1.3;m.castShadow=m.receiveShadow=true;G.add(m);}
    for(const [i,q] of ROCKS.entries()){const m=new THREE.Mesh(rockGeoW(900+i,q.r),mats.rock);m.position.set(q.x,hgt(q.x,q.z)+q.r*.3,q.z);m.rotation.set(i,i*1.7,i*.3);m.castShadow=m.receiveShadow=true;G.add(m);}
    /* props: the pier (deck on piles, a head, rails, bollards, a lamp), the dune fence, the lifeguard tower */
    for(const p of MAP.def.PROPS||[]){
      if(p.k==='pier'){const len=p.z0-p.z1,cz=(p.z0+p.z1)/2,H=p.head;G.add(box(p.w,.5,len,mats.wood,p.x,p.y,cz),box(H.w,.5,H.d,mats.wood,H.x,p.y,H.z));
        for(let z=p.z0-2;z>H.z-H.d/2;z-=8)for(const dx of [-p.w/2+.4,p.w/2-.4]){const y0=hgt(p.x+dx,z)-1.5,pl=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,p.y-y0,8),mats.wood);pl.position.set(p.x+dx,(p.y+y0)/2,z);pl.castShadow=true;G.add(pl);}
        for(const dx of [-p.w/2,p.w/2])G.add(box(.12,.9,len,mats.wood,p.x+dx,p.y+.7,cz));
        for(const [dx,dz] of [[-8,-6],[8,-6],[-6,5],[6,5]]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.7,8),mats.dark);b.position.set(H.x+dx,p.y+.5,H.z+dz);G.add(b);}
        G.add(box(.15,4,.15,mats.dark,H.x+2.6,p.y+2,H.z+5));const L=new THREE.PointLight(0xffc890,25,40,1.6);L.position.set(H.x+2.6,p.y+4,H.z+5);G.add(L);W.pier=p;}
      else if(p.k==='fence'){for(let x=p.x0;x<p.x1;x+=4.5){if(Math.sin(x*.7)>.85)continue;const z=p.z+Math.sin(x*.3)*.6,y=hgt(x,z);const m=box(.14,1.1,.14,mats.wood,x,y+.5,z);m.rotation.z=Math.sin(x*1.3)*.15;G.add(m);}}
      else if(p.k==='tower'){const y=hgt(p.x,p.z);for(const [dx,dz] of [[-1.3,-1.3],[1.3,-1.3],[-1.3,1.3],[1.3,1.3]])G.add(box(.18,4,.18,mats.wood,p.x+dx,y+2,p.z+dz));
        G.add(box(3.4,.25,3.4,mats.wood,p.x,y+4,p.z),box(3.2,2,3.2,mats.red,p.x,y+5.1,p.z),box(3.8,.2,3.8,mats.wood,p.x,y+6.2,p.z));}}
    treesInit(G);
    W.radius=MAP.S/2-24;return W;};
  function rockGeoW(seed,r){const g=new THREE.IcosahedronGeometry(r,2),p=g.attributes.position;RS=seed;const o=[rnd()*9,rnd()*9,rnd()*9];
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.35*(vnoise(x/r*1.6+o[0],z/r*1.6+y/r+o[1])-.5)+.2*(vnoise(y/r*3+o[2],x/r*3)-.5);p.setXYZ(i,x*k,y*k*.8,z*k);}
    g.computeVertexNormals();return g;}
  W.update=function(dt,t,f,cam,w,h,pr,R){SOIL.clock+=dt;LOOK.u.uT.value=SOIL.clock;
    W.ground.position.set(Math.round(f.x/2)*2,0,Math.round(f.z/2)*2);W.water.position.copy(W.ground.position);
    soilFollow(f.x,f.z);soilSettle(dt);soilUpload(R);treesFollow(f.x,f.z);if(cam){cam.updateMatrixWorld();treeCutFollow(cam,f,w,h,pr);}};
  W.heightAt=hgt;W.depthAt=depthAt;W.waterAt=waterL;
  W.foot=(x,z,yaw,load)=>{const d=depthAt(x,z),P=soilFoot(x,z,yaw,load==null?1-.5*smooth(0,3.3,d):load);return {kind:P.kind,depth:d,under:P.under};};
  W.churn=soilChurn;W.ring=lookRing;W.crater=soilCrater;
  W.bow=(x,z,dx,dz,k,len)=>{LOOK.bow.set(x,z,k,1.2);LOOK.bowD.set(dx,dz,len||6,0);};
  return W;})();
