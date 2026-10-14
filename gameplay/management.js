'use strict';
(function(root){
 const copy=s=>JSON.parse(JSON.stringify(s)),R=()=>root.SHUTRebuild,cfg=()=>R().managementData;
 function normalize(state){
  const s=copy(state);s.items=s.items||{};s.shopStock=s.shopStock||{};s.acquisitionSequence=s.acquisitionSequence||0;
  s.rank=s.rank||1;s.rankXp=s.rankXp??s.progress.rankXp??0;s.rankNeed=s.rankNeed||100;s.rankXpCredited=s.rankXpCredited??(s.progress.rankXp||0);const r=rank(s);s.rank=r.level;s.rankXp=r.xp;s.rankNeed=r.need;
  for(const i of cfg().items){s.items[i.id]=s.items[i.id]||0;s.shopStock[i.id]=s.shopStock[i.id]??i.stock;}
  if(!s.gardeners.length){s.gardeners=['G015','G017','G033'].map(id=>R().combat.actor(id,'starter-'+id));s.party=s.gardeners.map(g=>g.instanceId);}
  return s;
 }
 function unlocked(s,feature){const stage=cfg().unlocks[feature];return !stage||s.progress.stageClears.includes(stage);}
 function rank(s){let level=s.rank||1,xp=s.rankXp??s.progress.rankXp??0,need=s.rankNeed||100;while(xp>=need){xp-=need;level++;need=Math.round(need*1.2);}return {level,xp,need};}
 function rarityWeights(s,mode){if(mode==='gold')return cfg().gold.weights;return s.gardeners.some(g=>g.id==='G100')?[[4,80],[5,20]]:[[4,79.2],[5,19.8],[6,1]];}
 function randomUnit(random){const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Invalid random');return n;}
 function draw(state,mode,count,random=Math.random){
  const s=normalize(state),rules=cfg()[mode];if(!rules||![1,10].includes(count))throw Error('Invalid draw');
  if(s.battle||s.gacha&&!s.gacha.opened)throw Error('Pending action');
  const currency=mode==='gold'?'gold':'keys',cost=count===1?rules.singleCost:rules.tenCost;if(s.wallet[currency]<cost)throw Error('Insufficient currency');
  const results=[];for(let i=0;i<count;i++){
   let roll=randomUnit(random)*100,chosen=rarityWeights(s,mode).at(-1)[0];for(const [rarity,weight] of rarityWeights(s,mode)){roll-=weight;if(roll<0){chosen=rarity;break;}}
   const pool=R().roster.filter(p=>p.rarity===chosen&&(p.no!==100||!s.gardeners.some(g=>g.id==='G100')));if(!pool.length)throw Error('Empty approved pool');
   const p=pool[Math.floor(randomUnit(random)*pool.length)];let uid;do{uid='gacha-'+(++s.acquisitionSequence)}while(s.gardeners.some(g=>(g.instanceId||g.id)===uid));
   const g=R().combat.actor(p.gardener.id,uid);s.gardeners.push(g);results.push({id:g.id,instanceId:uid,rarity:chosen});
  }
  s.wallet[currency]-=cost;s.output='close';s.gacha={mode,count,cost,results,opened:false};return s;
 }
 function reveal(state){const s=copy(state);if(!s.gacha||s.gacha.opened)throw Error('No closed result');s.output='open';s.gacha.opened=true;return s;}
 function finishDraw(state){const s=copy(state);if(!s.gacha?.opened)throw Error('OPEN required');s.gacha=null;return s;}
 function maxPurchase(state,id){const s=normalize(state),i=cfg().items.find(i=>i.id===id);if(!i||!unlocked(s,'shop')||rank(s).level<i.unlockRank)return 0;return Math.max(0,Math.min(i.cap-s.items[id],s.shopStock[id],Math.floor(s.wallet.gold/i.price)));}
 function purchase(state,id,quantity){const s=normalize(state);if(s.battle||s.gacha&&!s.gacha.opened)throw Error('Pending action');if(!Number.isSafeInteger(quantity)||quantity<1||quantity>maxPurchase(s,id))throw Error('Invalid quantity');const i=cfg().items.find(i=>i.id===id);s.wallet.gold-=i.price*quantity;s.shopStock[id]-=quantity;s.items[id]+=quantity;return s;}
 function setParty(state,slot,uid){const s=normalize(state);if(s.battle||s.gacha&&!s.gacha.opened||!Number.isInteger(slot)||slot<0||slot>2||!s.gardeners.some(g=>(g.instanceId||g.id)===uid))throw Error('Invalid party change');const old=s.party[slot],other=s.party.indexOf(uid);if(other>=0&&other!==slot){if(old)s.party[other]=old;else s.party.splice(other,1);}s.party[slot]=uid;if(s.party.some(x=>!x)||new Set(s.party).size!==s.party.length)throw Error('Invalid slots');return s;}
 function selectItem(state,id){useItem(state,id);const s=copy(state);s.battle.selectedItem=s.battle.selectedItem===id?null:id;return s;}
 function useItem(state,id){
  const s=normalize(state),i=cfg().items.find(i=>i.id===id),b=s.battle;if(!i||!b||b.phase!=='recovery'||b.itemUsedInRecovery||(b.itemSlots??3)<=0||s.items[id]<1)throw Error('Recovery item unavailable');
  const members=s.party.map(uid=>s.gardeners.find(g=>(g.instanceId||g.id)===uid));if(!members.some(g=>g.hp<R().combat.stats(g).hp))throw Error('Party HP full');
  for(const g of members)g.hp=Math.min(R().combat.stats(g).hp,g.hp+Math.round(R().combat.stats(g).hp*i.heal));
  s.items[id]--;b.itemUsedInRecovery=true;b.selectedItem=null;b.itemSlots=(b.itemSlots??3)-1;b.events=[{kind:'item',name:i.id}];return s;
 }
 function pickDrop(random=Math.random){let unit=randomUnit(random);for(const entry of cfg().itemDrops){unit-=entry.chance;if(unit<0)return entry.id;}return null;}
 function xpNeed(level){return level>=50?0:80+level*30;}
 function grantExp(s,amount){const changes=[];for(const uid of s.party){const g=s.gardeners.find(g=>(g.instanceId||g.id)===uid);if(!g)continue;const before=g.level||1;g.level=before;g.xp=(g.xp||0)+amount;while(g.level<50&&g.xp>=xpNeed(g.level)){g.xp-=xpNeed(g.level);g.level++;}changes.push({id:g.id,instanceId:uid,amount,beforeLevel:before,afterLevel:g.level,xp:g.xp,next:xpNeed(g.level)});}return changes;}
 function creditGrowth(state){const s=normalize(state),b=s.battle;if(!b)return s;b.expChanges=b.expChanges||[];
  const total=b.enemies.filter(e=>e.credited).reduce((n,e)=>n+Math.max(20,28+R().roster.find(p=>p.no===e.no).rarity*14),0),pending=total-(b.waveExpCredited||0);
  if(pending>0){b.expChanges.push(...grantExp(s,pending));b.waveExpCredited=total;}
  const target=s.progress.rankXp||0,delta=target-(s.rankXpCredited||0);if(delta>0){s.rankXp+=delta;s.rankXpCredited=target;}
  const r=rank(s);s.rank=r.level;s.rankXp=r.xp;s.rankNeed=r.need;return s;
 }
 const api={normalize,unlocked,rank,rarityWeights,draw,reveal,finishDraw,maxPurchase,purchase,setParty,selectItem,useItem,pickDrop,xpNeed,creditGrowth};
 root.SHUTRebuild={...(root.SHUTRebuild||{}),management:api};if(typeof module!=='undefined')module.exports=api;
})(globalThis);
