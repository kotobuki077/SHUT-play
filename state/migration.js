'use strict';
(function(root){
 const R=()=>root.SHUTRebuild,natural=n=>Number.isSafeInteger(n)&&n>=0,object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 function preview(source,language='ja'){
  try{
   if(!source||!['shut_save_v2','shut_save_v37_master'].includes(source.key)||typeof source.raw!=='string'||source.raw.length>5*1024*1024)throw Error('source');
   const old=JSON.parse(source.raw);if(!object(old)||!natural(old.gold)||old.domain==='plant-gardener')throw Error('shape');
   if(old.schemaVersion!==undefined&&(!natural(old.schemaVersion)||old.schemaVersion>7))throw Error('version');
   const version=old.rosterSchemaVersion??0;if(!natural(version)||version>2)throw Error('rosterVersion');
   const s=R().model.fresh(language),unsupported={};s.wallet.gold=old.gold;
   const keyAlias=['gateKeys','gate_key','knobs','knob','door_knob','doorknob'].find(k=>natural(old[k]));s.wallet.keys=keyAlias?old[keyAlias]:0;
   const defs=R().roster,known=id=>defs.some(p=>p.gardener.id===id),mapId=id=>version===2?(known(id)?id:null):id==='G016'?'G015':null;
   if(old.gardeners!==undefined&&!Array.isArray(old.gardeners))throw Error('gardeners');
   const kept=new Set();s.gardeners=[];
   for(const g of old.gardeners||[]){if(!object(g))throw Error('gardener');const id=mapId(g.gardenerId);if(!id){if(version===2)throw Error('unknownGardener');unsupported.unmappedRoster=(unsupported.unmappedRoster||0)+1;continue;}
    if(typeof g.id!=='string'||!g.id.length||g.id.length>100||kept.has(g.id))throw Error('instance');kept.add(g.id);
    const level=g.level??1,xp=g.xp??0,strain=g.plantStrain??0;if(!Number.isInteger(level)||level<1||level>50||!natural(xp)||!Number.isFinite(strain)||strain<0||strain>100)throw Error('growth');
    const a=R().combat.actor(id,g.id);a.level=level;a.xp=xp;a.strain=strain;a.sp=0;const max=R().combat.stats(a).hp;if(g.hp!==null&&g.hp!==undefined&&!natural(g.hp))throw Error('hp');a.hp=g.hp==null?max:Math.min(max,g.hp);for(const k of ['locked','favorite'])if(typeof g[k]==='boolean')a[k]=g[k];s.gardeners.push(a);
   }
   if(s.gardeners.filter(g=>g.id==='G100').length>1)throw Error('cap6');
   const starters=[];for(const id of ['G015','G017','G033'])if(s.gardeners.length<3&&!s.gardeners.some(g=>g.id===id)){let uid='import-starter-'+id;while(kept.has(uid))uid+='x';kept.add(uid);s.gardeners.push(R().combat.actor(id,uid));starters.push(id);}
   if(old.gardenerParty!==undefined&&!Array.isArray(old.gardenerParty))throw Error('party');const party=old.gardenerParty||[];if(party.length>3||new Set(party).size!==party.length)throw Error('party');if(version===2&&party.some(uid=>!kept.has(uid)))throw Error('partyReference');s.party=party.filter(uid=>kept.has(uid));for(const g of s.gardeners)if(s.party.length<3&&!s.party.includes(g.instanceId))s.party.push(g.instanceId);
   for(const [key,value,minimum] of [['rank',old.rank??1,1],['rankXp',old.rankXp??0,0],['rankNeed',old.rankNeed??100,1]]){if(!Number.isSafeInteger(value)||value<minimum)throw Error('rank');s[key]=value;}
   const items=old.items??{},stock=old.shopStock??{};if(!object(items)||!object(stock))throw Error('items');s.items={};s.shopStock={};for(const [id,key,shop] of [['ITM001','heal','SHOP004'],['ITM002','high','SHOP005'],['ITM003','elixir','SHOP006']]){const n=items[key]??items[id]??0,left=stock[shop]??99;if(!natural(n)||n>99||!natural(left)||left>99)throw Error('inventory');s.items[id]=n;s.shopStock[id]=left;}
   const clears=old.stageClears??{};if(!object(clears)||!Object.values(clears).every(v=>typeof v==='boolean'))throw Error('progress');s.progress.stageClears=Object.keys(clears).filter(id=>clears[id]&&R().managementData.stageIds.includes(id));unsupported.unknownStageClears=Object.keys(clears).filter(id=>clears[id]&&!R().managementData.stageIds.includes(id)).length;
   const rescued=old.rescuedGardeners??[];if(!Array.isArray(rescued))throw Error('rescues');s.progress.rescues=[...new Set(rescued.map(mapId).filter(Boolean))];s.plantsSeen=version===2&&object(old.codex?.plants)?Object.keys(old.codex.plants).filter(id=>old.codex.plants[id]&&defs.some(p=>p.plant.id===id)):[];
   if(typeof old.settings?.openOnly==='boolean')s.settings.openOnly=old.settings.openOnly;
   unsupported.monsters=Array.isArray(old.monsters)?old.monsters.length:0;unsupported.otherItems=Object.keys(items).filter(k=>!['heal','high','elixir','ITM001','ITM002','ITM003'].includes(k)&&items[k]).length;unsupported.equipment=Array.isArray(old.inventory)?old.inventory.length:0;unsupported.pendingSeeds=Array.isArray(old.pendingSeeds)?old.pendingSeeds.length:0;unsupported.ongoingRun=old.run?1:0;
   s.legacyImport={version:1,sourceKey:source.key,rosterVersion:version};const next=R().management.normalize(s);if(!R().model.validate(next))throw Error('invalidResult');return {ok:true,state:next,unsupported,starters,sourceKey:source.key};
  }catch(e){return {ok:false,reason:e.message==='cap6'?'cap6':'invalid'};}
 }
 root.SHUTRebuild.migration={preview};if(typeof module!=='undefined')module.exports={preview};
})(globalThis);
