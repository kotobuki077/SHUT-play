(function(root){'use strict';
  const R=()=>root.SHUTRoster;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const MAX_LEVEL=50;
  const STARTER_GARDENERS=['G016','G021','G041'];
  function defById(id){const p=R()?.byGardenerId(id);if(!p)throw Error('Unknown gardener: '+id);return p}
  function create(gardenerId,instanceId){const p=defById(gardenerId);if(!instanceId)throw Error('Instance ID required');return {id:instanceId,gardenerId:p.gardener.id,xp:0,level:1,hp:null,plantStrain:0,locked:false,favorite:false}}
  function levelOf(g){return clamp(Math.floor(Number(g?.level)||1),1,MAX_LEVEL)}
  function roleFor(effect){return effect==='defense_up'?'guardian':effect==='recovery_up'?'support':effect==='range_up'?'control':effect==='speed_up'?'balanced':'striker'}
  function baseStats(pair){const r=Number(pair.rarity)||1;return {maxHp:82+r*8,atk:15+r*3,def:10+r*2}}
  function stats(g){
    const p=defById(g.gardenerId),l=levelOf(g),b=baseStats(p),growth=l-1,effect=p.gardener.plantMode?.effect||'attack_up';
    return {
      no:p.no,name:p.gardener.name,attr:p.attribute,attrJa:p.attributeJa,rarity:p.rarity,level:l,
      maxHp:Math.round(b.maxHp*(1+growth*.032)),atk:Math.round(b.atk*(1+growth*.038)),def:Math.round(b.def*(1+growth*.028)),
      weapon:p.gardener.weapon,plantMode:p.gardener.plantMode,role:roleFor(effect),
      skill:{name:p.no===16?'None but shot':'CRITICAL',trigger:'perfect',effect:'attack',multiplier:1},
      special:{type:'plant_mode',name:'PLANT MODE',power:plantModePower(g)}
    }
  }
  function attributeMultiplier(attacker,defender){return R().attributeMultiplier(attacker,defender)}
  function timingMultiplier(timing){return timing==='MISS'?0:timing==='PERFECT'?1.5:1}
  function damage(actor,enemy,timing,context={}){
    const tm=timingMultiplier(timing);if(!tm)return 0;
    const attr=attributeMultiplier(actor.attr,enemy.attr);
    const attackMultiplier=Number(context.attackMultiplier||1);
    const statusMultiplier=Number(actor.status?.attackMultiplier||1);
    return Math.max(1,Math.round(actor.atk*tm*attr*attackMultiplier*statusMultiplier));
  }
  function priority(e){return e.role==='minion'?0:e.boss||e.role==='boss'?3:e.role==='elite'||e.category==='midboss'?2:1}
  function planAttack(party,enemies,timing,context={}){
    const targets=(enemies||[]).filter(e=>e&&e.hp>0&&!e.dead).map(e=>({...e,remaining:e.hp,assigned:0})),plan=[];
    for(const actor of (party||[]).filter(x=>x&&x.hp>0)){
      let available=targets.filter(e=>e.remaining>0);if(!available.length)break;
      const untouched=available.filter(e=>!e.assigned);if(untouched.length)available=untouched;
      available.sort((a,b)=>priority(a)-priority(b)||a.remaining-b.remaining||attributeMultiplier(actor.attr,b.attr)-attributeMultiplier(actor.attr,a.attr)||String(a.id).localeCompare(String(b.id)));
      const target=available[0],amount=damage(actor,target,timing,context);
      plan.push({actorId:actor.id,targetId:target.id,damage:amount,attribute:attributeMultiplier(actor.attr,target.attr),timing,critical:timing==='PERFECT'});
      target.remaining-=amount;target.assigned++;
    }
    return plan;
  }
  function xpNeed(level){const l=clamp(Math.floor(Number(level)||1),1,MAX_LEVEL);return l>=MAX_LEVEL?0:80+l*30}
  function grantBattleExp(state,partyIds,amount){
    const next=copy(state),changes=[];for(const id of partyIds||[]){const g=next.gardeners.find(x=>x.id===id);if(!g)continue;
      const before=levelOf(g);g.xp=Math.max(0,Math.floor(Number(g.xp)||0))+Math.max(0,Math.floor(Number(amount)||0));
      while(g.level<MAX_LEVEL&&g.xp>=xpNeed(g.level)){g.xp-=xpNeed(g.level);g.level++}
      changes.push({id,amount,beforeLevel:before,afterLevel:levelOf(g),beforeXp:0,afterXp:g.xp,next:xpNeed(g.level),levelUp:levelOf(g)>before});
    }return {state:next,changes}
  }
  function plantModeBerserkChance(g){
    const p=defById(g.gardenerId),level=levelOf(g);
    if(p.gardener.plantMode?.neverBerserks===true)return 0;
    const personal=clamp(Number(p.gardener.plantMode?.controlModifier??1),.55,1.45),strain=clamp(Number(g.plantStrain)||0,0,100);
    const mastery=.30*(1-(level-1)/(MAX_LEVEL-1))+.02*((level-1)/(MAX_LEVEL-1));
    return clamp((mastery+strain*.0022)*personal,.01,.55);
  }
  function plantModePower(g){const p=defById(g.gardenerId),r=Number(p.rarity)||1;return Number(p.gardener.plantMode?.attackMultiplier||Number((1.28+r*.055).toFixed(3)))}
  function usePlantMode(g,random=Math.random){
    const roll=Number(random());if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid random');
    const chance=plantModeBerserkChance(g),berserk=roll<chance,next=copy(g);
    next.plantStrain=clamp((Number(next.plantStrain)||0)+(berserk?14:9),0,100);
    return {gardener:next,berserk,chance,power:plantModePower(g),effect:defById(g.gardenerId).gardener.plantMode?.effect||'attack_up'};
  }
  function recoverStrain(g,amount=10){const next=copy(g);next.plantStrain=clamp((Number(next.plantStrain)||0)-Math.max(0,Number(amount)||0),0,100);return next}
  function berserkTarget(party,actorId,random=Math.random){
    const targets=(party||[]).filter(x=>x&&x.id!==actorId&&(x.hp??1)>0);if(!targets.length)return null;
    const roll=Number(random());if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid random');
    return targets[Math.min(targets.length-1,Math.floor(roll*targets.length))];
  }
  function seedFor(no){const p=R().pair(no);if(!p)throw Error('Unknown roster no: '+no);return {id:'SEED-'+String(no).padStart(3,'0'),no:p.no,gardenerId:p.gardener.id,plantId:p.plant.id,status:'seed'}}
  function queueSeed(state,no){const next=copy(state),seed=seedFor(no);next.pendingSeeds=Array.isArray(next.pendingSeeds)?next.pendingSeeds:[];if(!next.pendingSeeds.some(x=>x.no===seed.no))next.pendingSeeds.push(seed);return next}
  function restoreSeedsAfterStage(state,idFactory=()=>root.crypto?.randomUUID?.()||('gardener-'+Date.now())){
    const next=copy(state);next.gardeners=Array.isArray(next.gardeners)?next.gardeners:[];next.rescuedGardeners=Array.isArray(next.rescuedGardeners)?next.rescuedGardeners:[];const rescued=[];
    for(const seed of Array.isArray(next.pendingSeeds)?next.pendingSeeds:[]){
      if(next.gardeners.some(g=>g.gardenerId===seed.gardenerId))continue;
      const g=create(seed.gardenerId,idFactory(seed));next.gardeners.push(g);next.rescuedGardeners.push(seed.gardenerId);rescued.push(g);
    }
    next.pendingSeeds=[];return {state:next,rescued};
  }
  function ensureStarterParty(next){
    if(next.gardenerFoundationSeeded)return next;
    for(const [i,id] of STARTER_GARDENERS.entries())if(!next.gardeners.some(g=>g.gardenerId===id))next.gardeners.push(create(id,'gardener-starter-'+String(i+1)));
    next.gardenerParty=STARTER_GARDENERS.map(id=>next.gardeners.find(g=>g.gardenerId===id)?.id).filter(Boolean);
    next.gardenerFoundationSeeded=true;return next;
  }
  function normalizeState(state){
    const next=copy(state||{});next.gardeners=Array.isArray(next.gardeners)?next.gardeners:[];next.gardenerParty=Array.isArray(next.gardenerParty)?next.gardenerParty:[];next.pendingSeeds=Array.isArray(next.pendingSeeds)?next.pendingSeeds:[];next.rescuedGardeners=Array.isArray(next.rescuedGardeners)?next.rescuedGardeners:[];
    if(!next.gardeners.some(g=>g.gardenerId==='G016'))next.gardeners.unshift(create('G016','gardener-mikado'));
    ensureStarterParty(next);
    next.gardenerParty=next.gardenerParty.filter(id=>next.gardeners.some(g=>g.id===id)).slice(0,3);
    return next;
  }
  root.SHUTGardeners={MAX_LEVEL,STARTER_GARDENERS,create,stats,attributeMultiplier,damage,planAttack,xpNeed,grantBattleExp,plantModeBerserkChance,plantModePower,usePlantMode,recoverStrain,berserkTarget,seedFor,queueSeed,restoreSeedsAfterStage,normalizeState};
  if(typeof module!=='undefined')module.exports=root.SHUTGardeners;
})(globalThis);
