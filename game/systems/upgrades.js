/* systems/upgrades.js — scrap and upgrades, from Ironhowl 4 (06e_upgrades; the six tracks, five levels, the same costs).
   Scrap: half a creature's starting dots when it is cleared (KNOT 5, STALKER 50, BRUTE 250), plus 15 for each ally alive at the
   end of a wave. It is kept on this device. The upgrade screen opens between waves (and from the pause menu in this test arena);
   after an artillery round too; it also sets the arms: each forearm takes the AC-4 autocannon, the LN-1 Lance or the AR-1 Arc (Ironhowl 4's bay did this). */
const UPG=[
  {id:'gun',name:'GUN',fx:['START AT TIER II','START AT TIER III','START AT TIER IV','+15% DAMAGE','+30% DAMAGE']},
  {id:'cool',name:'COOLING',fx:['-12% HEAT PER SHOT','-24% HEAT, FASTER COOLING','-36% HEAT, VENT 6 S','-48% HEAT, FASTER COOLING','-60% HEAT, VENT 4 S']},
  {id:'shield',name:'SHIELD',fx:['SHIELD 80','SHIELD 100, FASTER RECHARGE','SHIELD 120','SHIELD 140, RECHARGE AFTER 2 S','SHIELD 160']},
  {id:'msl',name:'MISSILES',fx:['SALVO OF 3, +4 AMMO','SALVO OF 4, +8 AMMO','SALVO OF 5, +12 AMMO','SALVO OF 6, +16 AMMO','SALVO OF 8, +20 AMMO']},
  {id:'jets',name:'JETS',fx:['3 FUEL CELLS','FASTER REFILL','STOMP LANDING (HURTS WHAT IS UNDER YOU)','4 FUEL CELLS','SALVO RECHARGES IN 8 S']},
  {id:'hull',name:'HULL',fx:['HULL 120','HULL 140, REPAIRS +45','HULL 160','HULL 180, REPAIRS +55','HULL 200']}];
const UPG_COST=[150,300,500,800,1200];
const SAVE={get(){try{return JSON.parse(store.get('save','{}'))||{};}catch(e){return {};}},put(s){store.set('save',JSON.stringify(s));}};
function upgLv(id){const u=SAVE.get().upg||{};return Math.min(5,u[id]||0);}
let RUN_SCRAP=0;   /* earned since the last save */
function scrap(){return (SAVE.get().scrap||0)+RUN_SCRAP;}
function addScrap(n){RUN_SCRAP+=n;}
function saveScrap(){if(!RUN_SCRAP)return;const sv=SAVE.get();sv.scrap=(sv.scrap||0)+RUN_SCRAP;RUN_SCRAP=0;SAVE.put(sv);}
function buyUpg(id){saveScrap();const lv=upgLv(id);if(lv>=5)return false;const c=UPG_COST[lv],sv=SAVE.get();if((sv.scrap||0)<c)return false;sv.scrap-=c;sv.upg=sv.upg||{};sv.upg[id]=lv+1;SAVE.put(sv);return true;}
/* fit the upgrades to the Wraith. full = a fresh start (hull, shield, ammo filled); otherwise between waves keep what is left */
function applyUpgrades(full){
  const g=upgLv('gun'),c=upgLv('cool'),s=upgLv('shield'),m=upgLv('msl'),j=upgLv('jets'),h=upgLv('hull');
  GUN.base=1+Math.min(3,g);UP.dmgK=1+Math.max(0,g-3)*.15;
  HEAT.shot=2.3*(1-.12*c);HEAT.cool=30*(1+[0,0,.15,.15,.3,.3][c]);GUN.ventCool=[8,8,8,6,6,4][c];
  const sh0=P.shieldMax,hu0=P.hullMax;
  P.shieldMax=[60,80,100,120,140,160][s];P.regenDelay=s>=4?2:3;P.regenRate=s>=2?30:22;
  MSL.salvo=[2,3,4,5,6,8][m];MSL.max=24+[0,4,8,12,16,20][m];
  P.cells=j>=4?4:j>=1?3:2;JET.refill=j>=2?2.4:3.2;UP.stomp=j>=3;SALVO.cool=j>=5?8:12;
  P.hullMax=[100,120,140,160,180,200][h];UP.repair=h>=4?55:h>=2?45:35;
  if(full){P.shield=P.shieldMax;P.hull=P.hullMax;P.fuel=P.cells;MSL.ammo=12+[0,4,8,12,16,20][m];GUN.tier=GUN.base;}
  else{P.shield=P.shieldMax;P.hull=Math.min(P.hullMax,P.hull+(P.hullMax-hu0));GUN.tier=Math.max(GUN.tier,GUN.base);MSL.ammo=Math.min(MSL.max,Math.max(MSL.ammo,12));P.fuel=P.cells;}
  if(!loadoutHas('mpod')){MSL.ammo=0;MSL.max=0;}
}
function loadoutHas(id){const L=loadout();return SLOTS.some(k=>L[k]===id);}
/* ---------------- the screen ---------------- */
const ARMS=[['ac','AUTOCANNON'],['ln','LANCE'],['ar','ARC']];
let UPG_FROM='';
function openUpg(from,bonus,ok){UPG_FROM=from;saveScrap();const box=$('upg');
  $('utitle').textContent=from==='clear'?'WAVE '+G.wave+' CLEAR':from==='arty'?'GRID CLEAR':'UPGRADES';
  $('usub').textContent=from==='clear'?('TEAM STANDING '+ok+'/3 · +'+bonus+' SCRAP'):from==='arty'?('GREEN ALIVE '+ok+'/8 · FRIENDLY FIRE '+(ART.last?ART.last.ff:0)+' · +'+bonus+' SCRAP'):'TEST ARENA · BUY BETWEEN WAVES';
  $('ugo').textContent=from==='clear'||from==='arty'?'NEXT WAVE':from==='title'?'DEPLOY':'BACK';
  drawUpg();box.style.display='flex';G.paused=from==='pause'||G.paused;}
function drawUpg(){
  $('uscrap').textContent='SCRAP '+scrap().toLocaleString('en-US');
  $('urows').innerHTML=UPG.map(u=>{const lv=upgLv(u.id),max=lv>=5,c=UPG_COST[lv]||0,can=!max&&scrap()>=c;
    return '<div class="urow"><div class="un"><b>'+u.name+'</b><span class="pips">'+'●'.repeat(lv)+'○'.repeat(5-lv)+'</span><span class="fx">'+(max?'MAXED':'NEXT: '+u.fx[lv])+'</span></div>'+
      '<button data-id="'+u.id+'"'+(can?'':' disabled')+'>'+(max?'DONE':c+'')+'</button></div>';}).join('');
  $('upg').querySelectorAll('.urow button').forEach(b=>b.onclick=e=>{e.stopPropagation();if(buyUpg(b.dataset.id)){sPickup();drawUpg();}});
  const L=loadout();
  $('uarms').innerHTML=[['fa_L','LEFT ARM'],['fa_R','RIGHT ARM']].map(([s,n])=>'<div class="arow"><b>'+n+'</b>'+ARMS.map(([id,nm])=>'<button class="chip'+(L[s]===id?' on':'')+'" data-s="'+s+'" data-k="'+id+'">'+nm+'</button>').join('')+'</div>').join('');
  $('uarms').querySelectorAll('.chip').forEach(b=>b.onclick=e=>{e.stopPropagation();const L2=loadout();L2[b.dataset.s]=b.dataset.k;setLoadout(L2);refitKit(M);drawUpg();});
}
function closeUpg(){$('upg').style.display='none';applyUpgrades(UPG_FROM==='title');
  if(UPG_FROM==='clear'||UPG_FROM==='arty'){G.mode='play';G.paused=false;CAMS.ready=false;startWave();}
  else if(UPG_FROM==='title')startPlay();
  else setPause(false);}
