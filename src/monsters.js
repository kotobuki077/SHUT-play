/* Pure Monster rules. Planning never mutates state; transactions return a new state. */
(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const natural=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
  function definition(id,data){const d=data.monsters.find(m=>m.monster_id===id);if(!d)throw Error('Unknown monster: '+id);return d;}
  function xpForLevel(level,data){
    if(!natural(level,1)||level>=data.monsterRules.maxLevel)return null;
    const curve=data.monsterRules.levelCurve;
    if(Array.isArray(curve)){const segment=curve.find(x=>level>=x.from&&level<=x.to)||curve.at(-1);return Math.max(1,Math.round(segment.base+(level-segment.from)*segment.step));}
    return data.monsterRules.levelBase+level*data.monsterRules.levelStep;
  }
  function totalXpForLevel(level,data){let total=0;for(let current=1;current<Math.min(level,data.monsterRules.maxLevel);current++)total+=xpForLevel(current,data);return total;}
  function levelAt(xp,data){let level=1,left=Math.max(0,Math.floor(Number(xp)||0));while(level<data.monsterRules.maxLevel){const need=xpForLevel(level,data);if(left<need)break;left-=need;level++;}return {level,xpIntoLevel:left,next:xpForLevel(level,data),total:Math.max(0,Math.floor(Number(xp)||0))};}
  function create(monsterId,id,data){definition(monsterId,data);if(typeof id!=='string'||!id)throw Error('Instance ID required');return {id,monsterId,xp:0,locked:false,favorite:false};}
  function form(instance,data){let d=definition(instance.monsterId,data),level=levelAt(instance.xp,data).level;const visited=new Set();while(d.evolution&&level>=d.evolution.level){if(visited.has(d.monster_id))throw Error('Evolution cycle');visited.add(d.monster_id);d=definition(d.evolution.to,data);}return d;}
  function stats(instance,data){const d=form(instance,data),l=levelAt(instance.xp,data).level,tr=(key,fallback)=>key&&root.SHUTI18n?.t?root.SHUTI18n.t(key):fallback,skill={...d.skill,name:tr(d.skill?.nameKey,d.skill?.name),description:tr(d.skill?.descriptionKey,d.skill?.description)},special={...d.special,name:tr(d.special?.nameKey,d.special?.name||d.special?.type),description:tr(d.special?.descriptionKey,d.special?.description||'')};return {name:tr(d.nameKey,d.name),nameKey:d.nameKey,level:l,attr:d.attribute,rarity:d.rarity,skill,special,maxHp:Math.round(d.hp*(1+(l-1)*data.monsterRules.hpGrowth)),atk:Math.round(d.atk*(1+(l-1)*data.monsterRules.atkGrowth)),sprite:d.sprite,formId:d.monster_id};}
  function attribute(a,b,data){return data.monsterRules.beats[a]===b?data.monsterRules.advantage:data.monsterRules.beats[b]===a?data.monsterRules.disadvantage:1;}
  function damage(actor,enemy,timing,data,context={}){
    const mult=data.monsterRules.timing[timing];if(!Number.isFinite(mult))throw Error('Unknown timing');if(mult===0)return 0;
    const am=attribute(actor.attr,enemy.attr,data),skill=actor.skill||{};
    const active=skill.trigger==='always'||skill.trigger==='perfect'&&timing==='PERFECT'||skill.trigger==='weakness'&&am>1||skill.trigger==='low_hp'&&actor.hp<=actor.maxHp*.5||skill.trigger==='guard'&&context.perfectGuard||skill.trigger==='third'&&context.attackCount%3===0;
    const sm=active&&skill.effect==='attack'?skill.multiplier:1;
    return Math.max(1,Math.round(actor.atk*mult*am*sm*(actor.status?.attackMultiplier??1)*(context.attackMultiplier??1)*(enemy.barrier&&timing!=='PERFECT'?1-enemy.barrier:1)));
  }
  function priority(e){return e.role==='minion'?0:e.boss||e.role==='boss'?3:e.role==='elite'||e.category==='midboss'?2:1;}
  function planAttack(party,enemies,timing,data,context={}){
    const targets=enemies.filter(e=>e.hp>0&&!e.dead).map(e=>({...e,remaining:e.hp,assigned:0}));
    const plan=[];
    for(const actor of party.filter(m=>m&&m.hp>0)){
      let available=targets.filter(e=>e.remaining>0);if(!available.length)break;
      // Coverage first among surviving targets. Estimated kills are reserved immediately.
      const untouched=available.filter(e=>!e.assigned);if(untouched.length)available=untouched;
      available.sort((a,b)=>priority(a)-priority(b)||a.remaining-b.remaining||attribute(actor.attr,b.attr,data)-attribute(actor.attr,a.attr,data)||String(a.id).localeCompare(String(b.id)));
      const e=available[0],amount=damage(actor,e,timing,data,context);
      plan.push({actorId:actor.id,targetId:e.id,damage:amount,attribute:attribute(actor.attr,e.attr,data),timing});
      e.remaining-=amount;e.assigned++;
    }
    return plan;
  }
  function validateRoster(state,data){
    if(!Array.isArray(state.monsters)||!Array.isArray(state.party)||state.party.length>3)throw Error('Invalid roster');
    const ids=new Set();for(const m of state.monsters){if(!m||typeof m.id!=='string'||!m.id||ids.has(m.id)||!natural(m.xp)||(m.hp!==undefined&&!natural(m.hp)))throw Error('Invalid monster instance');if(m.status&&(!natural(m.status.turns,1)||!Number.isFinite(m.status.attackMultiplier)||m.status.attackMultiplier<.1||m.status.attackMultiplier>2))throw Error('Invalid status');ids.add(m.id);definition(m.monsterId,data);}
    if(new Set(state.party).size!==state.party.length||state.party.some(id=>!ids.has(id)))throw Error('Invalid party');
  }
  function recordDiscoveries(state,data){
    state.codex=state.codex&&typeof state.codex==='object'?state.codex:{};
    state.codex.monsters=state.codex.monsters&&typeof state.codex.monsters==='object'&&!Array.isArray(state.codex.monsters)?state.codex.monsters:{};
    for(const m of state.monsters){let d=definition(m.monsterId,data);const level=levelAt(m.xp,data).level,seen=new Set();while(d&&!seen.has(d.monster_id)){seen.add(d.monster_id);state.codex.monsters[d.monster_id]=true;if(!d.evolution||level<d.evolution.level)break;d=definition(d.evolution.to,data);}}
    return state;
  }
  function synthesisMaterialExp(instance,data){const s=stats(instance,data),rules=data.monsterRules.synthesis,ratio=Number(rules.nextLevelRatioByRarity?.[s.rarity]);if(Number.isFinite(ratio))return Math.max(1,Math.round((xpForLevel(Math.min(s.level,data.monsterRules.maxLevel-1),data)||1)*ratio));const base=Number(rules.materialBaseByRarity?.[s.rarity]??form(instance,data).materialExp);return Math.max(1,Math.round(base*(1+(s.level-1)*Number(rules.materialLevelGrowth||0))+instance.xp*Number(rules.expRecovery||0)));}
  function synthesisPreview(state,baseId,materialIds,data,stoneInput={}){
    validateRoster(state,data);if(!natural(state.gold))throw Error('Invalid Gold');
    if(!Array.isArray(materialIds)||new Set(materialIds).size!==materialIds.length||materialIds.includes(baseId))throw Error('Invalid materials');
    const base=state.monsters.find(m=>m.id===baseId);if(!base)throw Error('Base missing');
    const materials=materialIds.map(id=>{const m=state.monsters.find(x=>x.id===id);if(!m)throw Error('Material missing');if(m.locked)throw Error('Locked material');if(state.party.includes(id))throw Error('Party material');return m;});
    const rules=data.monsterRules.synthesis;
    const stones=Object.fromEntries(Object.entries(rules.expStones||{}).map(([key])=>{const count=Number(stoneInput?.[key]||0);if(!natural(count)||count>Number(state.items?.[key]||0))throw Error('Invalid EXP Stone');return [key,count]})),stoneCount=Object.values(stones).reduce((n,x)=>n+x,0);if(!materials.length&&!stoneCount)throw Error('Invalid materials');
    const baseLevel=stats(base,data).level,levelNeed=xpForLevel(Math.min(baseLevel,data.monsterRules.maxLevel-1),data)||1,stoneExp=Object.entries(stones).reduce((sum,[key,count])=>sum+Math.round(levelNeed*Number(rules.expStones[key].ratio))*count,0);
    const exp=materials.reduce((sum,m)=>sum+synthesisMaterialExp(m,data),0)+stoneExp;
    const cost=materials.reduce((sum,m)=>sum+rules.goldBase+stats(m,data).rarity*rules.goldPerRarity+stats(m,data).level*rules.goldPerLevel,0)+Object.entries(stones).reduce((sum,[key,count])=>sum+Number(rules.expStones[key].gold||0)*count,0);
    const result={...base,xp:base.xp+exp},before=stats(base,data),after=stats(result,data);
    if(!Number.isSafeInteger(result.xp)||!natural(cost,1))throw Error('Overflow');
    const warnings=materials.flatMap(m=>{const s=stats(m,data),r=[];if(s.rarity>=rules.warningRarity)r.push('高レア');if(s.level>=rules.warningLevel)r.push('高レベル');if(s.formId!==m.monsterId)r.push('進化済み');if(m.favorite)r.push('お気に入り');if(definition(m.monsterId,data).important)r.push('重要');return r.length?[{id:m.id,name:s.name,reasons:r}]:[];});
    return {baseId,materialIds:[...materialIds],stones,goldBefore:state.gold,cost,goldAfter:state.gold-cost,affordable:state.gold>=cost,exp,before,after,evolves:before.formId!==after.formId,warnings,result};
  }
  function synthesize(state,preview,data){
    const current=synthesisPreview(state,preview.baseId,preview.materialIds,data,preview.stones);
    if(JSON.stringify(current)!==JSON.stringify(preview))throw Error('Preview expired');
    if(!current.affordable)throw Error('Not enough Gold');
    const next=recordDiscoveries(copy(state),data);next.gold=current.goldAfter;next.items=next.items||{};for(const [key,count]of Object.entries(current.stones))next.items[key]=Number(next.items[key]||0)-count;next.monsters=next.monsters.filter(m=>!current.materialIds.includes(m.id)).map(m=>m.id===current.baseId?current.result:m);return recordDiscoveries(next,data);
  }
  function gacha(state,count,data,mode='key',random=Math.random,idFactory){
    if(typeof mode==='function'){idFactory=random;random=mode;mode='key';}
    if(![1,10].includes(count)||!['gold','key'].includes(mode)||!natural(state.gateKeys)||!natural(state.gold))throw Error('Invalid pull');validateRoster(state,data);
    const rule=data.monsterGacha.modes?.[mode]||data.monsterGacha,currency=rule.currency||'gateKeys',cost=count===10?rule.tenCost:rule.singleCost;if(state[currency]<cost)throw Error('Not enough currency');
    const pool=data.monsters.filter(m=>m.acquisition.gacha===true&&m.acquisition.gachaAvailable!==false&&m.rarity>=rule.minRarity&&m.rarity<=rule.maxRarity),weights=rule.weights.filter(w=>w.weight>0&&w.rarity>=rule.minRarity&&w.rarity<=rule.maxRarity);
    const total=weights.reduce((n,w)=>n+w.weight,0);if(!total||weights.some(w=>!pool.some(m=>m.rarity===w.rarity)))throw Error('Invalid gacha pool');
    const next=copy(state),pulls=[];const draw=()=>{const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error('Invalid random');return r;};
    const makeId=typeof idFactory==='function'?idFactory:()=>root.crypto?.randomUUID?.()||`gacha-${Date.now()}-${pulls.length}`;
    for(let i=0;i<count;i++){let roll=draw()*total,rarity=weights[weights.length-1].rarity;for(const w of weights){roll-=w.weight;if(roll<0){rarity=w.rarity;break;}}const candidates=pool.filter(m=>m.rarity===rarity);const d=candidates[Math.floor(draw()*candidates.length)];const instance=create(d.monster_id,makeId(),data);if(next.monsters.some(m=>m.id===instance.id))throw Error('Duplicate instance ID');next.monsters.push(instance);pulls.push(instance);}
    next[currency]-=cost;return {state:next,pulls,cost,mode,currency};
  }
  function battleExp(enemy,stage,data){const rules=data.monsterRules.battleExp,level=Math.max(1,Number(stage.recommended_monster_level||stage.recommended_rank||1)),need=xpForLevel(Math.min(level,data.monsterRules.maxLevel-1),data)||1,category=enemy.category||'',share=enemy.boss||['boss','humanoid_boss'].includes(category)?rules.bossShare:category==='midboss'?rules.midbossShare:Number(enemy.tier)>=3?rules.eliteShare:rules.normalShare,chapter=data.chapterProgression?.find(x=>x.chapter===Number(stage.chapter))||{expMultiplier:1};return Math.max(1,Math.round(need*share*(1+(Math.max(1,Number(enemy.tier||1))-1)*rules.tierBonus)*chapter.expMultiplier));}
  function grantBattleExp(state,partyIds,amount,data){if(!natural(amount)||!Array.isArray(partyIds))throw Error('Invalid battle EXP');const next=copy(state),changes=[];for(const id of partyIds){const m=next.monsters.find(x=>x.id===id);if(!m)continue;const before=levelAt(m.xp,data);m.xp+=amount;const after=levelAt(m.xp,data);changes.push({id,amount,beforeLevel:before.level,afterLevel:after.level,beforeXp:before.xpIntoLevel,afterXp:after.xpIntoLevel,next:after.next,levelUp:after.level>before.level});}return {state:recordDiscoveries(next,data),changes};}
  function specialPlan(actor,allies,enemy){
    const special=actor?.special||{type:'damage',power:1},alive=(allies||[]).filter(x=>x&&x.hp>0),lowest=alive.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    const result={type:special.type||'damage',damageMultiplier:Number(special.power||1),allyId:null,heal:0,status:null};
    if(result.type==='heal'&&lowest){result.allyId=lowest.id;result.heal=Math.max(1,Math.round(lowest.maxHp*Number(special.healRate||.3)));}
    if(result.type==='regen'&&lowest){result.allyId=lowest.id;result.status={kind:'regen',turns:Number(special.status?.turns||3),rate:Number(special.status?.rate||.08)};}
    if(result.type==='poison')result.status={kind:'poison',turns:Number(special.status?.turns||3),rate:Number(special.status?.rate||.06)};
    if(result.type==='atk_down')result.status={kind:'atk_down',turns:Number(special.status?.turns||3),multiplier:Number(special.status?.multiplier||.78)};
    return result;
  }
  function migrate(state,data){
    const next=copy(state);
    if(!next.monsterMigration){
      next.legacyArchive={...(next.legacyArchive||{}),weaponInventory:copy(next.inventory||[]),equippedWeapon:next.equipped||null,partners:copy(next.partners||{}),normalTickets:next.normalTickets||0};
      next.monsters=data.monsterRules.starters.map((id,i)=>create(id,'starter-'+i,data));next.party=next.monsters.map(m=>m.id);next.monsterMigration=true;
    }
    const aliases={Gold:'gold','Rank EXP':'rank_xp','鍵':'gate_key'},retired=[],invalid=[];
    next.gifts=(Array.isArray(next.gifts)?next.gifts:[]).filter(g=>{
      if(!g||typeof g!=='object'){invalid.push(g);return false;}
      g.rewardType=aliases[g.rewardType]||g.rewardType;
      if(['boss_core','exp_small','exp_medium','exp_large','ボスコア','経験値石・小','経験値石・中','経験値石・大','weapon','normal_ticket'].includes(g.rewardType)){retired.push(g);return false;}
      const valid=['gold','rank_xp','gate_key','monster'].includes(g.rewardType)&&natural(g.rewardAmount,1)&&g.rewardAmount<=1000000&&(g.rewardType!=='monster'||g.rewardAmount<=100&&data.monsters.some(m=>m.monster_id===g.monsterId));
      if(!valid)invalid.push(g);return valid;
    });
    if(retired.length||invalid.length){next.legacyArchive=next.legacyArchive||{};for(const [key,list]of [['retiredGifts',retired],['invalidGifts',invalid]])if(list.length)next.legacyArchive[key]=[...(Array.isArray(next.legacyArchive[key])?next.legacyArchive[key]:[]),...list];}
    validateRoster(next,data);next.schemaVersion=6;return recordDiscoveries(next,data);
  }
  root.SHUTMonsters={definition,xpForLevel,totalXpForLevel,levelAt,create,form,stats,attribute,damage,planAttack,validateRoster,synthesisMaterialExp,synthesisPreview,synthesize,gacha,battleExp,grantBattleExp,specialPlan,migrate};
  if(typeof module!=='undefined')module.exports=root.SHUTMonsters;
})(globalThis);
