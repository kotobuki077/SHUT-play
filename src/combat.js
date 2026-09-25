// Pure rules shared by the browser and deterministic balance tests.
(function(root) {
  const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function context(stage, rank, data) {
    const b = data.balance, d = Math.max(1, finite(stage.difficulty, 1));
    const recommended = Math.max(1, finite(stage.recommended_rank, 1)),recommendedLevel=Math.max(1,finite(stage.recommended_monster_level,recommended));
    // Enemy strength is fixed by stage/chapter data. The live player rank never scales enemies.
    const r = recommended,progression=data.chapterProgression?.find(x=>x.chapter===Number(stage.chapter))||{hpMultiplier:1,atkMultiplier:1,patternTier:1};
    return {b,d,r,recommendedLevel,progression,
      reference: b.referencePartyAttack * (1 + (recommendedLevel - 1) * data.monsterRules.atkGrowth),
      referenceHp:b.referenceMonsterHp*(1+(recommendedLevel-1)*data.monsterRules.hpGrowth)};
  }
  function stats(def, boss, stage, rank, data) {
    const {b,reference,referenceHp,progression,recommendedLevel} = context(stage,rank,data);
    const scripted = stage.stage_type === 'forced_loss';
    if (def.scriptedOnly && !scripted) throw Error('Loss-only enemy in ordinary encounter');
    const category=def.category||'',elite=!boss&&finite(def.tier,1)>=3,cycles=boss?(category==='midboss'?b.midbossCycles:b.bossCycles):elite?b.eliteCycles:b.normalCycles;
    const expectedHp=boss?(category==='midboss'?290:500):elite?140:90,expectedAtk=boss?40:elite?27:18,spread=Number(b.baseStatVariance||.18);
    const hpIdentity=clamp(finite(def.hp,expectedHp)/expectedHp,1-spread,1+spread),atkIdentity=clamp(finite(def.atk,expectedAtk)/expectedAtk,1-spread,1+spread);
    const rawHp=Math.max(1,reference*cycles*hpIdentity*finite(progression.hpMultiplier,1));
    const damageShare=boss?b.bossDamageShare:elite?b.eliteDamageShare:b.normalDamageShare;
    const rawAtk=Math.max(1,referenceHp*damageShare*atkIdentity*finite(progression.atkMultiplier,1));
    const hp=Math.round(scripted?Math.max(finite(def.hp,9999),rawHp):rawHp),atk=Math.round(scripted?Math.max(finite(def.atk,99),rawAtk):rawAtk);
    const cadence = Math.max(1, finite(def.attackEvery,3));
    return {maxHp:hp,hp,atk,attackEvery:cadence,turnsLeft:cadence,recommendedLevel,targetCycles:cycles,safetyClamped:false};
  }
  function encounterIds(stage, rank, n, data, random=Math.random) {
    const cfg=stage.encounters, {b,d,r}=context(stage,rank,data);
    if (n===cfg.count && cfg.bosses.length) return [...cfg.bosses.map(id=>({id,boss:true,role:'boss'})),...(cfg.minions||[]).map(id=>({id,boss:false,role:'minion'}))];
    const tier = Math.min(3,1+Math.floor((d-1)/b.tierStep));
    const explicit=Array.isArray(cfg.pool)?new Set(cfg.pool):null;
    const pool=data.enemies.filter(e=>(explicit?explicit.has(e.enemy_id):e.world===stage.world_id) && ['monster','machine'].includes(e.category) && !e.scripted_only && e.tier<=tier);
    if (!pool.length) throw Error(`No enemy pool for ${stage.stage_id}`);
    let budget=Math.min(b.maxBudget,2+Math.floor((d-1)*b.budgetStage)+Math.floor((r-1)/b.budgetRank));
    const result=[];
    while (result.length<b.maxEnemies && budget>0) {
      const available=pool.filter(e=>e.tier<=budget);if(!available.length)break;
      const e=available[Math.min(available.length-1,Math.floor(random()*available.length))];
      result.push({id:e.enemy_id,boss:false});budget-=e.tier;
    }
    return result;
  }
  function guardRate(delta, config) {
    const ad=Math.abs(delta);
    return ad<=config.perfect_guard_ms?finite(config.perfect_guard_rate,.1):ad<=config.good_guard_ms?finite(config.good_guard_rate,.3):ad<=config.normal_guard_ms?finite(config.normal_guard_rate,.55):ad<=config.bad_guard_ms?finite(config.bad_guard_rate,.8):finite(config.miss_guard_rate,1);
  }
  function guardDamage(atk,movePower,rate,attackMultiplier=1){return Math.max(1,Math.round(Math.max(1,finite(atk,1))*Math.max(0,finite(movePower,1))*Math.max(.1,finite(attackMultiplier,1))*clamp(finite(rate,1),0,1)));}
  function spriteRect(iw,ih,cw,ch,meta) {
    if(meta.pixelPerfect){
      const raw=Math.min(cw/iw,ch/ih),scale=raw>=1?Math.max(1,Math.floor(raw)):raw>=.5?.5:.25;
      const width=iw*scale,height=ih*scale;
      return {x:Math.round((cw-width)/2),y:Math.round((ch-height)/2),width,height,scale};
    }
    // A uniform floating-point draw scale preserves source aspect exactly. CSS magnifies
    // the square logical canvas by integer factors; these high-res placeholders downsample.
    const scale=Math.min(meta.logicalWidth/iw,meta.logicalHeight/ih);
    const width=iw*scale,height=ih*scale;
    return {x:(cw-width)/2,y:ch-meta.footInset-height,width,height,scale};
  }
  root.SHUTCombat={context,stats,encounterIds,guardRate,guardDamage,spriteRect};
  if(typeof module!=='undefined') module.exports=root.SHUTCombat;
})(globalThis);
