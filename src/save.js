/* Save validation and copy-on-write migration. No partial application on failure. */
globalThis.SHUTSave={
 key:'shut_save_v2',schemaVersion:6,
 read(defaults){
  let raw=null,legacy=false;
  try{raw=localStorage.getItem(this.key);if(!raw){raw=localStorage.getItem('shut_save_v37_master');legacy=!!raw}if(!raw)return null;
   const v=JSON.parse(raw);if(!v||typeof v!=='object'||Array.isArray(v))throw Error('shape');
   const out=structuredClone(defaults);for(const key of Object.keys(out))if(v[key]!==undefined)out[key]=v[key];
   // Aliases describe the SAME wallet. Never sum aliases or mint currency on reload.
   const wallet=['gateKeys','gate_key','knobs','knob','door_knob','doorknob'].find(k=>Number.isFinite(v[k])&&v[k]>=0);
   out.gateKeys=wallet?Math.floor(v[wallet]):0;
   for(const key of ['rank','rankXp','rankNeed','gold','gateKeys','stage','hp','maxHp','storyIndex','normalTickets','shopCycle'])if(!Number.isFinite(out[key])||out[key]<0)out[key]=defaults[key];
   out.rank=Math.max(1,Math.floor(out.rank));out.rankNeed=Math.max(1,out.rankNeed);out.maxHp=Math.max(100,out.maxHp);out.hp=Math.min(out.hp,out.maxHp);out.storyIndex=Math.min(SHUT_MASTER_DATA.stages.length,Math.floor(out.storyIndex));
   for(const key of ['items','materials','codex','partners','stageClears','readEvents','questProgress','questDelivered','gateUnlocked','gateAttempts'])if(!out[key]||typeof out[key]!=='object'||Array.isArray(out[key]))out[key]=structuredClone(defaults[key]);
   for(const key of ['enemies','weapons','partners'])if(!out.codex[key]||typeof out.codex[key]!=='object'||Array.isArray(out.codex[key]))out.codex[key]={};
   for(const key of Object.keys(defaults.items))out.items[key]=Math.min(99,Math.max(0,Math.floor(Number(out.items[key])||0)));
   out.inventory=(Array.isArray(out.inventory)?out.inventory:[]).filter(w=>w&&typeof w.id==='string').map(w=>structuredClone(w)); // Preserved only in legacyArchive, never active combat.
   out.gifts=(Array.isArray(out.gifts)?out.gifts:[]).filter(g=>g&&typeof g.title==='string'&&Number.isFinite(g.rewardAmount)).map(g=>({...g,title:g.title.replaceAll('ドアノブ','鍵'),desc:typeof g.desc==='string'?g.desc.replaceAll('ドアノブ','鍵'):'',rewardType:['knob','knobs','door_knob','doorknob','ドアノブ','ゲートキー'].includes(g.rewardType)?'gate_key':g.rewardType}));
   // The unused old special-gate item is retired, not another paid wallet.
   for(const k of ['gateKey','gate_key','ITM012'])delete out.items[k];
   for(const [k,p]of Object.entries(out.partners))if(!p||typeof p!=='object')delete out.partners[k];
   for(const key of ['eventFlags','stageMissions','records','settings'])if(v[key]&&typeof v[key]==='object'&&!Array.isArray(v[key]))out[key]=v[key];
   if(v.run&&SHUT_MASTER_DATA.expeditions[v.run.kind]&&Number.isInteger(v.run.floor)&&v.run.floor>0)out.run={kind:v.run.kind,floor:v.run.floor,slots:Math.min(3,Math.max(0,Number.isFinite(v.run.slots)?v.run.slots:3))};
   if(!out.inventory.length){out.freeDone=false;out.equipped=null;}
   for(const k of ['monsters','party','monsterMigration','legacyArchive'])if(v[k]!==undefined)out[k]=v[k];
   const migrated=SHUTMonsters.migrate(out,SHUT_MASTER_DATA);Object.assign(out,migrated);
   out.schemaVersion=this.schemaVersion;
   if(legacy||v.schemaVersion!==this.schemaVersion)localStorage.setItem(this.key,JSON.stringify(out));return out;
  }catch(e){this.recovered=true;try{if(raw)localStorage.setItem(this.key+'_recovery',raw);localStorage.removeItem(this.key)}catch{}return null}
 },
 write(state){try{localStorage.setItem(this.key,JSON.stringify({...state,schemaVersion:this.schemaVersion}));return true}catch{return false}}
};
