/* systems/camera.js — the top-down camera (replaces Ironhowl 4's third-person cameras, 08_camera).
   High three-quarter view, always facing north, following the Wraith. It leans ahead of where you aim (up to 4.5 m, up to 10 m with the
   mouse far out), and frames enough ground on a phone held upright: at least 30 m across and 40 m top to bottom.
   A jet hop lifts it a little; hits and blasts shake it. CAM NEAR / FAR (button or Z key) steps the distance. */
const CAMS={x:0,z:0,lx:0,lz:0,shake:0,zoom:1,ready:false,pitch:58*Math.PI/180};
const ZOOMS=[1,1.3,.8];let ZI=+store.get('zoom',0)||0;CAMS.zoom=ZOOMS[ZI]||1;
function cycleZoom(){ZI=(ZI+1)%ZOOMS.length;CAMS.zoom=ZOOMS[ZI];store.set('zoom',ZI);HUD.msg(['CAMERA NORMAL','CAMERA FAR','CAMERA NEAR'][ZI],.9);}
function updCam(dt){
  /* lean: ahead of the aim while aiming (with the mouse: part of the way to the cursor) */
  let lx=0,lz=0;if(P.aimHeld){const k=AIM.mouse?clamp(AIM.dist*.25,0,10):4.5;lx=AIM.dx*k;lz=AIM.dz*k;}
  else{lx=P.vx*.5;lz=P.vz*.5;}
  CAMS.lx+=(lx-CAMS.lx)*damp(2.2,dt);CAMS.lz+=(lz-CAMS.lz)*damp(2.2,dt);
  const tx=P.x+CAMS.lx,tz=P.z+CAMS.lz;
  if(!CAMS.ready){CAMS.x=tx;CAMS.z=tz;CAMS.ready=true;}
  CAMS.x+=(tx-CAMS.x)*damp(6,dt);CAMS.z+=(tz-CAMS.z)*damp(6,dt);
  /* distance: enough ground across and down the screen whatever its shape */
  const tv=Math.tan(cam.fov*Math.PI/360),needW=30,needH=40;
  const dist=Math.max(needH/(2*tv),needW/(2*tv*cam.aspect))*.92*CAMS.zoom+P.y*.6;
  CAMS.shake=Math.max(0,CAMS.shake-dt*2.2);const sh=CAMS.shake*CAMS.shake*.6;
  const cp=Math.cos(CAMS.pitch),sp=Math.sin(CAMS.pitch);
  /* on a phone held upright the thumbs and buttons cover the bottom: look a little south so the Wraith sits above the middle */
  const ax=CAMS.x,az=CAMS.z+dist*(cam.aspect<1?.07:0);
  cam.position.set(ax+(Math.random()-.5)*sh,dist*sp+(Math.random()-.5)*sh,az+dist*cp+(Math.random()-.5)*sh);
  cam.lookAt(ax,0,az);
}
