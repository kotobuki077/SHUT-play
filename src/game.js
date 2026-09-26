
(() => {
  const $ = id => document.getElementById(id);
  const I18n = globalThis.SHUTI18n;
  const t = (key,values) => I18n.t(key,values);
  const MASTER_DATA = globalThis.SHUT_MASTER_DATA;
  const Monsters = globalThis.SHUTMonsters;
  const allyFrames={};
  const Combat = globalThis.SHUTCombat;
  const Systems = globalThis.SHUTSystems;
  const CFG = Object.fromEntries(MASTER_DATA.config.map(x=>[x.key,x.value]));
  const screens = ['startScreen','gachaScreen','homeScreen','closeMenuScreen','battleScreen'];

  const attributes = ['火','水','雷','地','風'];
  const beats = {'火':'風','風':'地','地':'雷','雷':'水','水':'火'};
  const attrColor = {'火':'#f06a5e','水':'#5eb5e8','雷':'#c19ae9','地':'#d2a451','風':'#68c88e'};
  const itemDefs=MASTER_DATA.rules.items;
  const rewardAssets={eggCommon:'assets/reward-egg-common.png',eggRare:'assets/reward-egg-rare.png',key:'assets/reward-gate-key.png',item:'assets/reward-item-drop.png'};
  function rewardIcon(kind,rarity=1,extra=''){
    const source=kind==='egg'?(rarity>=4?rewardAssets.eggRare:rewardAssets.eggCommon):rewardAssets[kind];
    return source?`<img class="rewardPixelIcon ${extra}" src="${source}" alt="" aria-hidden="true">`:'';
  }

  function masterEnemyToDef(x){return {masterId:x.enemy_id,kind:x.sprite||'orbeye',name:x.name,nameKey:x.nameKey,category:x.category,world:x.world,attr:x.attribute,tier:Number(x.tier),hp:Number(x.base_hp),atk:Number(x.base_atk),gold:[Math.max(1,Math.round(Number(x.gold_base)*.75)),Math.max(2,Math.round(Number(x.gold_base)*1.25))],rankXp:Number(x.rank_exp),attackEvery:Number(x.attack_every),attackPattern:x.attack_pattern,scriptedOnly:!!x.scripted_only};}
  const allEnemyDefs=MASTER_DATA.enemies.map(masterEnemyToDef);
  const enemyDefs=allEnemyDefs.filter(x=>['monster','machine'].includes(x.category));
  const bossDefs=allEnemyDefs.filter(x=>['midboss','boss','humanoid_boss','humanoid'].includes(x.category));
  const enemyById=Object.fromEntries(allEnemyDefs.map(x=>[x.masterId,x]));

  const SAVE_KEY=SHUTSave.key;
  let S = {
    rank:1, rankXp:0, rankNeed:100, gold:0, gateKeys:0, stage:1,
    hp:100, maxHp:100,
    items:{heal:1,high:0,elixir:0,expSmall:0,expMedium:0,expLarge:0,retry:0,chip:0,bossFrag:0},
    monsters:[],party:[],monsterMigration:false,legacyArchive:{},
    inventory:[], equipped:null,
    materials:{bossCore:0},
    codex:{enemies:{},weapons:{},partners:{}},
    partners:{},equippedPartner:null,captureUnlocked:false,
    storyIndex:0,stageClears:{},readEvents:{},normalTickets:0,
    gifts:[],questProgress:{},questDelivered:{},
    gateUnlocked:{EXP:false,GOLD:false,HIDDEN:false,BOSSRUSH:false,TOWER:false,ENDLESS:false},gateAttempts:{EXP:0,GOLD:0,HIDDEN:0},
    shopStock:null,shopCycle:0,
    tutorialDone:false,freeDone:false
  };
  let hadSave=false;
  const WALLET_KEYS=new Set(['gold','gateKeys']);
  function walletNatural(value){return Number.isSafeInteger(value)&&value>=0}
  function assertWallet(state=S,label='wallet'){
    if(!state||!walletNatural(state.gold)||!walletNatural(state.gateKeys))throw Error('Invalid wallet: '+label);
    return state;
  }
  function addWallet(key,amount,label='wallet'){
    if(!WALLET_KEYS.has(key)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid wallet delta: '+label);
    assertWallet(S,label+' before');
    const next=S[key]+amount;
    if(!walletNatural(next))throw Error('Wallet overflow: '+label);
    S[key]=next;return next;
  }
  function spendWallet(key,amount,label='wallet'){
    if(!WALLET_KEYS.has(key)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid wallet spend: '+label);
    assertWallet(S,label+' before');
    if(S[key]<amount)return false;
    S[key]-=amount;return true;
  }
  function normalizeState(){
    S=Monsters.migrate(S,MASTER_DATA);S.schemaVersion=6;S.inventory=[];S.equipped=null;S.partners={};S.equippedPartner=null;S.normalTickets=0;S.captureUnlocked=false;S.freeDone=true;syncPartyHp();
    S.eventFlags=S.eventFlags||{};S.stageMissions=S.stageMissions||{};S.records=Object.assign({tower:0,endless:0},S.records);S.settings=Object.assign({sound:true,openOnly:false},S.settings);
    S.items=Object.assign({heal:1,high:0,elixir:0,expSmall:0,expMedium:0,expLarge:0,retry:0,chip:0,bossFrag:0},S.items||{});
    if(!S.eventFlags.retiredItemsRefunded){for(const [id,key]of [['ITM008','retry'],['ITM009','chip'],['ITM011','bossFrag']]){const price=Number(MASTER_DATA.migrations.retiredItemRefunds[key]||0);addWallet('gold',Math.max(0,Math.floor(Number(S.items[key]||0)))*price,'retired item refund');S.items[key]=0;}S.eventFlags.retiredItemsRefunded=true;}
    S.inventory=Array.isArray(S.inventory)?S.inventory:[];
    S.materials=Object.assign({bossCore:0},S.materials||{}); delete S.materials.dust;
    S.codex=S.codex||{};S.codex.enemies=S.codex.enemies||{};S.codex.weapons=S.codex.weapons||{};S.codex.partners=S.codex.partners||{};
    S.partners=S.partners||{};S.equippedPartner=S.partners[S.equippedPartner]?S.equippedPartner:null;S.captureUnlocked=!!S.captureUnlocked;
    S.storyIndex=Number.isFinite(S.storyIndex)?S.storyIndex:Math.max(0,(S.stage||1)-1);S.stageClears=S.stageClears||{};S.readEvents=S.readEvents||{};S.normalTickets=S.normalTickets||0;
    S.gifts=Array.isArray(S.gifts)?S.gifts:[];S.questProgress=S.questProgress||{};S.questDelivered=S.questDelivered||{};
    S.gateUnlocked=Object.assign({EXP:false,GOLD:false,HIDDEN:false,BOSSRUSH:false,TOWER:false,ENDLESS:false},S.gateUnlocked||{});S.gateAttempts=Object.assign({EXP:0,GOLD:0,HIDDEN:0},S.gateAttempts||{});
    S.shopCycle=S.shopCycle||0;S.shopStock=S.shopStock||null;
    if(!S.inventory.some(w=>w.id===S.equipped))S.equipped=S.inventory[0]?.id||null;
    if(!S.shopStock) refreshShopStock();
  }
  function saveGame(){if(!S.tutorialDone)return false;assertWallet(S,'save');return SHUTSave.write(S);}
  function loadGame(){const loaded=SHUTSave.read(S);if(!loaded)return false;S=loaded;normalizeState();return true;}
  function clearSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}


  const stageById=Object.fromEntries(MASTER_DATA.stages.map(x=>[x.stage_id,x]));
  const worldById=Object.fromEntries(MASTER_DATA.worlds.map(x=>[x.world_id,x]));
  const partnerById={};
  const itemById=Object.fromEntries(MASTER_DATA.items.map(x=>[x.item_id,x]));
  const itemStateKey={ITM001:'heal',ITM002:'high',ITM003:'elixir',ITM004:'expSmall',ITM005:'expMedium',ITM006:'expLarge',ITM008:'retry',ITM009:'chip',ITM011:'bossFrag'};
  let activeStageId=null,activeStageData=null,activeGate=null,encounterMax=5,discoveredThisStage=[];
  const masterStages=MASTER_DATA.stages;
  function currentStoryStage(){if(S.storyIndex>=masterStages.length)return null;return masterStages[Math.max(0,S.storyIndex)]||masterStages[0]}
  function randomFrom(arr){return arr[Math.floor(Math.random()*arr.length)]}
  function refreshShopStock(){S.shopCycle=(S.shopCycle||0)+1;S.shopStock={};}

  function addGift(title,rewardType,rewardAmount,desc='',monsterId=null){
    S.gifts.push({id:'g'+Date.now()+Math.random().toString(16).slice(2),title,rewardType,rewardAmount:Number(rewardAmount)||1,desc,monsterId});updateGiftBadge();saveGame();
  }
  function rewardName(type){return ({monster:'モンスターの卵',gate_key:'鍵',boss_core:'ボスコア',exp_small:'経験値石・小',exp_medium:'経験値石・中',exp_large:'経験値石・大',gold:'Gold',rank_xp:'Rank EXP'})[type]||type;}
  function applyReward(type,amount,monsterId){
    if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Invalid reward amount');
    if(type==='monster'){Monsters.definition(monsterId,MASTER_DATA);const added=Array.from({length:amount},()=>Monsters.create(monsterId,crypto.randomUUID(),MASTER_DATA));S.monsters.push(...added);S.codex.monsters=S.codex.monsters||{};S.codex.monsters[monsterId]=true;}
    else if(type==='gate_key')addWallet('gateKeys',amount,'reward gate key');else if(type==='gold')addWallet('gold',amount,'reward gold');else if(type==='rank_xp')addRankXp(amount);else throw Error('Unsupported reward');
  }
  function updateGiftBadge(){const b=$('giftBadge');if(!b)return;const n=S.gifts.length;b.textContent=n;b.classList.toggle('show',n>0)}
  function questValue(q){const k=q.condition_key;if(k==='rank')return S.rank;if(k==='enemy_dex')return Object.keys(S.codex.enemies).length;if(k==='weapon_dex')return Object.keys(S.codex.weapons).length;if(k.startsWith('stage_clear:'))return S.stageClears[k.split(':')[1]]?1:0;if(k.startsWith('chapter_clear:')){const w=k.split(':')[1];return MASTER_DATA.stages.filter(x=>x.world_id===w).every(x=>S.stageClears[x.stage_id])?1:0}if(k.startsWith('gate_discover:'))return S.questProgress[k]||0;if(k.startsWith('gate_clear:'))return S.questProgress[k]||0;return S.questProgress[k]||0}
  function evaluateQuests(){
    S.questProgress.partner_bond_level=Math.max(0,...Object.values(S.partners).map(p=>p.bond||1));
    S.questProgress.stage_mission_count=Object.values(S.stageMissions||{}).reduce((n,v)=>n+Object.values(v).filter(Boolean).length,0);
    S.questProgress.tower_floor=S.records?.tower||0;S.questProgress.endless_battle=S.records?.endless||0;
    S.questProgress.beginner_set_complete=MASTER_DATA.progression.beginnerQuests.every(id=>S.questDelivered[id])?1:0;
    MASTER_DATA.quests.forEach(q=>{if(S.questDelivered[q.quest_id])return;const v=questValue(q);if(v>=Number(q.target)){S.questDelivered[q.quest_id]=true;addGift(`QUEST: ${q.name}`,q.rewards[0].type,q.rewards[0].amount,`${q.name} 達成報酬`,q.rewards[0].monsterId)}});updateGiftBadge();
  }
  function bumpQuest(key,amount=1){S.questProgress[key]=(S.questProgress[key]||0)+amount;if(key==='perfect_attack_count'||key==='perfect_guard_count')S.questProgress.perfect_total=(S.questProgress.perfect_total||0)+amount;evaluateQuests();saveGame()}
  function addPartner(partnerId,source=''){
    const def=MASTER_DATA.monsters.find(m=>m.legacyPartnerId===partnerId);if(!def)return;const flag='monster-join:'+partnerId;if(S.eventFlags[flag])return;S.eventFlags[flag]=true;S.monsters.push(Monsters.create(def.monster_id,'join-'+partnerId,MASTER_DATA));saveGame();
  }
  function processStageUnlocks(stageId){
    if(stageId==='S01-01')addPartner('P028','story');
    
    if(stageId==='S02-02')addPartner('P029','story');
    if(stageId==='S03-01')addPartner('P030','story');
    if(stageId==='S03-05')addPartner('P027','story');
    unlockJourneyGates();
  }
  function rollSpecialGate(){
    if(activeStageData?.special_gate_check!==true||!S.stageClears[MASTER_DATA.expeditions.EXP.unlock])return;
    if(Math.random()<Number(MASTER_DATA.gates.find(g=>g.gate_id==='GATE_EXP').appearance_rate)){if(S.gateAttempts.EXP<=0){S.gateUnlocked.EXP=true;S.gateAttempts.EXP=Number(MASTER_DATA.gates.find(g=>g.gate_id==='GATE_EXP').attempts);S.questProgress['gate_discover:EXP']=1;localeToast('battle.gateFound',{name:'EXP GATE ×3'});}}
    if(S.gateUnlocked.GOLD&&Math.random()<Number(MASTER_DATA.gates.find(g=>g.gate_id==='GATE_GOLD').appearance_rate)){if(S.gateAttempts.GOLD<=0){S.gateAttempts.GOLD=Number(MASTER_DATA.gates.find(g=>g.gate_id==='GATE_GOLD').attempts);S.questProgress['gate_discover:GOLD']=1;localeToast('battle.gateFound',{name:'GOLD GATE ×3'});}}
    evaluateQuests();
  }

  let gachaCommitted=false,routeAfterGacha='open',hasShownCloseMenuHint=false;
  let gachaMode='key', gachaStep=0, pendingPulls=[], gachaSelectedCount=null, gachaBusy=false;
  let encounter=1, enemies=[], targetId=null, phase='idle', opened=true;
  let attackStart=0, attackDuration=1750, meterRAF=null, defenseImpact=0, defenseEnemyId=null, attackReadyToken=0;
  let defenseQueue=[], pendingItem=null, carrySlots=3, animFrame=0, rewardGold=0, rewardDrops=[], rewardEntries=[], rewardMonsterExp=0, rewardExpChanges=[];
  const SPECIAL_RULES=MASTER_DATA.monsterRules.special,SKILL_MAX=Number(SPECIAL_RULES.maxSp),SKILL_GAIN=SPECIAL_RULES.gain,ULTIMATE_MULTIPLIER=Number(SPECIAL_RULES.defaultDamageMultiplier);
  let skillCharge={};
  let closedReason='roundEnd', defenseToken=0;
  let currentBattleCopy=null;

  let audioCtx=null, master=null, musicGain=null, sfxGain=null, musicTimer=null, musicStep=0;


  function setStateBadge(text){
    if($('uiStateBadge')) $('uiStateBadge').textContent=text;
  }

  function toast(msg,ms=2200){
    const t=$('uiToast');
    if(!t) return;
    t._localeCopy=null;
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer=setTimeout(()=>t.classList.remove('show'),ms);
  }
  function localeToast(key,values={},ms=2200){toast(t(key,values),ms);$('uiToast')._localeCopy={key,values}}

  function show(id){
    screens.forEach(s => $(s).classList.toggle('show',s===id));
    $('app').dataset.screen=id;SHUTDevice.route(id);
    if(id!=='battleScreen')$('battleAction').disabled=true;
    if(id==='battleScreen'){ setMusicMode('battle'); setStateBadge('BATTLE'); }
    else if(id==='gachaScreen'){ setMusicMode('gacha'); setStateBadge('GACHA GATE'); }
    else if(id==='closeMenuScreen'){ setMusicMode('close'); setStateBadge('CLOSE MENU'); }
    else if(id==='homeScreen'){ setMusicMode('open'); setStateBadge('OPEN MENU'); }
    else { setMusicMode('title'); setStateBadge('START'); }
  }
  function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function stars(n){ return '★'.repeat(n); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  const isDesktop = () => window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function attackInstruction(){
    return t(isDesktop()?'battle.instructionDesktop':'battle.instructionTouch');
  }
  function localizedAttribute(value){const id={'火':'fire','水':'water','雷':'thunder','地':'earth','風':'wind'}[value];return id?t('battle.attributeName.'+id):value}
  function localizedDataName(entry){return entry?.nameKey?t(entry.nameKey):entry?.name||''}
  function localizedDataDescription(entry){return entry?.descriptionKey?t(entry.descriptionKey):entry?.description||''}
  function displayedEnemyName(enemy){return enemy?.nameKey?t(enemy.nameKey):globalThis.SHUTMikadoPresentation?.matches(enemy)?t('mikado.name'):enemy.name}
  function refreshBattleCopy(){
    if(!currentBattleCopy)return;
    const values=typeof currentBattleCopy.values==='function'?currentBattleCopy.values():currentBattleCopy.values;
    $('battleMessage').textContent=t(currentBattleCopy.messageKey,values);
    $('battleSub').textContent=t(currentBattleCopy.subKey,values);
  }
  function setBattleCopy(messageKey,subKey,values={}){currentBattleCopy={messageKey,subKey,values};refreshBattleCopy()}
  function setDeviceClosed(isClosed,options){return SHUTDevice.setClosed(isClosed,options);}
  function openOnlyMode(){return !!S.settings?.openOnly}

  // ---------- AUDIO ----------
  let noiseBuffer=null, musicMode='title', musicDelay=null, musicDelayGain=null, lastBaseMusicMode='title';
  function setMusicMode(mode){if(musicMode!==mode)musicStep=0;musicMode=mode; if(!['victory','equip','shop','synthesis','story'].includes(mode)) lastBaseMusicMode=mode; }

  function initAudio(){
    if(audioCtx) return;
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();

    master=audioCtx.createGain();master.connect(audioCtx.destination);
    musicGain=audioCtx.createGain();musicGain.connect(master);
    sfxGain=audioCtx.createGain();sfxGain.connect(master);applyAudioSettings();

    // Small echo bus for a more produced chiptune sound.
    musicDelay=audioCtx.createDelay(.6); musicDelay.delayTime.value=.19;
    musicDelayGain=audioCtx.createGain(); musicDelayGain.gain.value=.18;
    musicGain.connect(musicDelay); musicDelay.connect(musicDelayGain); musicDelayGain.connect(master);

    noiseBuffer=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*.22),audioCtx.sampleRate);
    const nd=noiseBuffer.getChannelData(0);
    for(let i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*(1-i/nd.length);

    const tick=MASTER_DATA.audio.tickMs; // 100 BPM, 16th note
    musicTimer=setInterval(()=>{
      if(!audioCtx || document.hidden) return;
      const step=musicStep%16;
      const form=MASTER_DATA.audio.form,measure=Math.floor(musicStep/16)%Object.values(form).reduce((n,v)=>n+v,0),bar=measure%4;
      const section=measure<form.intro?'intro':measure<form.intro+form.A?'A':measure<form.intro+form.A+form.B?'B':'variation';

      const config = MASTER_DATA.audio.themes[musicMode] || MASTER_DATA.audio.themes.open;
      const rootShift=config.prog[section==='B'?(bar+2)%4:bar];
      const root=config.root*Math.pow(2,rootShift/12);
      const chord = config.chord || [0,3,7,10];
      const arpPattern = config.arpPattern || [0,1,2,3];
      const arp=chord[arpPattern[step%4]]+(step>=8?12:0);

      if(section!=='intro'||step%2===0)tone(root*Math.pow(2,arp/12),.18,config.arpWave,config.arpVol*(section==='intro'?.65:1),musicGain);
      if(step%4===0){
        tone(root/2,.48,'triangle',config.bassVol,musicGain);
        tone(root*Math.pow(2,3/12),.55,'sine',.012,musicGain,.01);
        tone(root*Math.pow(2,7/12),.55,'sine',.010,musicGain,.02);
      }
      if(section!=='intro'&&step%2===0){
        const n=config.lead[section==='B'?(14-step+16)%16:section==='variation'?(step+4)%16:step]+(section==='variation'&&bar===3?12:0);
        tone(config.root*Math.pow(2,n/12),.24,config.leadWave,config.leadVol,musicGain);
        if(section==='B'&&step%4===0)tone(config.root*Math.pow(2,(n-5)/12),.36,'triangle',config.leadVol*.3,musicGain,.075);
      }
      if(config.pad && step%8===0){ tone(root*Math.pow(2,config.pad/12),.72,'triangle',.012,musicGain,.02); }

      if(section==='intro'){if(step===0)kick(.025);}
      else if(config.drums==='battle'){
        if(step===0||step===8) kick(.055);
        if(step===4||step===12) snare(.035);
        if(step%2===1) hat(.013);
        if(step===6||step===14) hat(.022);
      }else if(config.drums==='boss'){
        if(step===0||step===8) kick(.065);
        if(step===4||step===12) snare(.042);
        if(step%2===1) hat(.016);
        if(step===2||step===6||step===10||step===14) hat(.022);
      }else if(config.drums==='sparkle'){
        if(step===0||step===8) kick(.038);
        if(step===4||step===12) snare(.024);
        if(step%2===1) hat(.011);
        if(step===3||step===7||step===11||step===15) tone(root*2,.06,'sine',.012,musicGain);
      }else if(config.drums==='mystic'){
        if(step===0||step===8) kick(.034);
        if(step===4||step===12) snare(.020);
        if(step===2||step===10) hat(.010);
      }else if(config.drums==='victory'){
        if(step===0||step===8) kick(.050);
        if(step===4||step===12) snare(.032);
        if(step%2===1) hat(.012);
        if(step===0||step===8) tone(root*2,.10,'triangle',.018,musicGain);
      }else{
        if(step===0||step===8) kick(.032);
        if(step===4||step===12) snare(.020);
        if(step===3||step===11) hat(.010);
      }
      musicStep++;
    },tick);
  }

  function tone(freq,dur=.2,type='sine',vol=.05,target=sfxGain,delay=0){
    if(!audioCtx||!target) return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(target);o.start(t);o.stop(t+dur+.03);
  }
  function noiseHit(dur=.06,vol=.02,cut=1600){
    if(!audioCtx||!noiseBuffer)return;
    const s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain(),t=audioCtx.currentTime;
    s.buffer=noiseBuffer;f.type='highpass';f.frequency.value=cut;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(musicGain);s.start(t);s.stop(t+dur);
  }
  function kick(vol=.05){
    if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;
    o.type='sine';o.frequency.setValueAtTime(145,t);o.frequency.exponentialRampToValueAtTime(46,t+.13);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.15);
    o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+.16);
  }
  function snare(vol=.03){noiseHit(.11,vol,900)}
  function hat(vol=.012){noiseHit(.035,vol,3600)}

  function sfx(k){
    if(!audioCtx) return;
    try{
      const motifs={egg:[523,659,784],rare:[659,988,1318,1568],gold:[1109,1397],key:[740,1110,1480],item:[587,784],synthesis:[262,330,392,523],evolution:[392,523,659,784,1046],level:[523,659,1046],ui:[440],confirm:[660,880],cancel:[392,294]};
      if(motifs[k]){motifs[k].forEach((freq,i)=>tone(freq,k==='evolution'?.35:k==='ui'?.045:.13,'triangle',k==='ui'?.018:.035,sfxGain,i*.055));return;}
      if(k==='door'){tone(120,.15,'square',.05);tone(76,.24,'triangle',.04,sfxGain,.02)}
      if(k==='slash'){tone(680,.06,'sawtooth',.06);tone(310,.13,'square',.045,sfxGain,.03)}
      if(k==='hit'){tone(170,.16,'sawtooth',.05);tone(92,.22,'triangle',.035,sfxGain,.02)}
      if(k==='guard'){tone(520,.09,'triangle',.05);tone(820,.15,'sine',.04,sfxGain,.03)}
      if(k==='cue'){tone(980,.075,'sine',.04);tone(1320,.09,'sine',.035,sfxGain,.045)}
      if(k==='win'){[0,4,7,12,16].forEach((n,i)=>tone(294*Math.pow(2,n/12),.34,'triangle',.04,sfxGain,i*.07))}
      if(k==='gacha'){[0,7,12,16,19].forEach((n,i)=>tone(330*Math.pow(2,n/12),.46,'triangle',.045,sfxGain,i*.065))}
    }catch{}
  }




  function drawWeapon(canvas,w){if(canvas&&w?.monsterInstance)monsterIcon(canvas,w.monsterInstance);}
  function compactTouchDevice(){return Math.min(innerWidth,innerHeight)<600}
  function drawGachaResultMonster(canvas,w){
    if(!canvas||!w?.monsterInstance)return;
    if(!compactTouchDevice()){canvas.style.background='';drawWeapon(canvas,w);return;}
    const stats=Monsters.stats(w.monsterInstance,MASTER_DATA),sprite=MASTER_DATA.sprites[stats.sprite];if(!sprite)return;
    const frames=sprite.states?.idle||[sprite.cell||0],cell=frames[0]??sprite.cell??0,cols=Number(sprite.columns||1),rows=Number(sprite.rows||1),col=cell%cols,row=Math.floor(cell/cols);
    canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
    canvas.style.backgroundImage=`url("${new URL(sprite.source,location.href).href}")`;
    canvas.style.backgroundSize=`${cols*100}% ${rows*100}%`;
    canvas.style.backgroundPosition=`${cols>1?col/(cols-1)*100:0}% ${rows>1?row/(rows-1)*100:0}%`;
    canvas.style.backgroundRepeat='no-repeat';canvas.style.imageRendering='pixelated';
    canvas.dataset.animationState='idle';canvas.dataset.frame=String(cell);canvas.dataset.assetStatus=sprite.status;
  }

  function showSingleWeaponReveal(w){
    $('weaponRevealStars').textContent=stars(w.rarity);
    $('weaponRevealName').textContent=w.name;
    $('weaponRevealMeta').textContent=t('gacha.resultMeta',{attribute:localizedAttribute(w.attr),type:w.type,attack:w.atk,level:w.lv||1,skill:w.passive||''});
    drawGachaResultMonster($('weaponRevealCanvas'),w);
    $('weaponRevealOverlay').classList.add('show');
  }
  function showDoorItem(w){
    drawGachaResultMonster($('gDoorItemCanvas'),w);
    $('gDoorItemStars').textContent=stars(w.rarity);
    $('gDoorItemName').textContent=w.name;
    $('singleWeaponReveal').classList.add('show');
  }
  function hideDoorItem(){
    $('singleWeaponReveal').classList.remove('show');
    $('gDoorItemStars').textContent='';
    $('gDoorItemName').textContent='';
    const c=$('gDoorItemCanvas').getContext('2d'); c.clearRect(0,0,96,96);
  }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function bindTouchSafeButton(id,handler){
    const el=$(id);if(!el)return;let touchAt=-Infinity,directAt=-Infinity;
    const fireTouch=e=>{
      if(el.disabled)return;
      const now=performance.now();if(now-directAt<80){e.preventDefault();return;}
      directAt=now;touchAt=now;e.preventDefault();
      setTimeout(()=>{if(!el.disabled||id==='gachaHomeBtn')handler();},0);
    };
    el.addEventListener('pointerup',e=>{if(e.pointerType==='touch')fireTouch(e)});
    el.addEventListener('touchend',fireTouch,{passive:false});
    el.addEventListener('click',e=>{
      if(performance.now()-touchAt<700){e.preventDefault();return;}
      if(el.disabled)return;handler(e);
    });
  }
  function setGachaButtonsDisabled(flag){
    ['singlePullBtn','tenPullBtn','gachaHomeBtn','goldGachaMode','keyGachaMode'].forEach(id=>{ if($(id)) $(id).disabled=flag; });
  }

  // ---------- WEAPONS / GACHA ----------
  function closeTenPullResults(){
    $('pullResults').classList.remove('show','tenMode');
    $('pullResults').innerHTML='';
    $('gDoorFrame').style.opacity='';
    $('gDoor').classList.remove('open');
    $('gKey').classList.remove('inserted');
    hideDoorItem();
    gachaStep=0;
    gachaSelectedCount=null;
    gachaBusy=false;
    $('gachaScreen').classList.remove('summon-rare','result-open');
    document.querySelector('.outer-display').append($('gachaScreen'));
    setGachaButtonsDisabled(false);
    $('gachaTitle').textContent=t('gacha.gateTitle');
    $('gachaText').textContent=t('gacha.intro');
    $('gachaHomeBtn').textContent=t('gacha.back');
    updateGachaTop();
  }
  function renderPullResults(count){
    $('pullResults').innerHTML='';
    pendingPulls.forEach((w,i)=>{
      const d=document.createElement('div');
      d.className='weaponCard rarity-'+w.rarity+(w.rarity>=4?' highRare':'');d.style.setProperty('--i',i);
      d.innerHTML=`<canvas class="weaponMiniCanvas" width="128" height="128" data-widx="${i}"></canvas><div class="newTag">${t(w.isNew?'gacha.newDiscovery':'gacha.reunion')}</div><div class="wStars">${stars(w.rarity)}</div><div class="wName">${w.name}</div><div class="wMeta">${t('gacha.resultMeta',{attribute:localizedAttribute(w.attr),type:w.type,attack:w.atk,level:w.lv||1,skill:w.passive||''})}</div>`;
      $('pullResults').appendChild(d);
    });
    $('pullResults').querySelectorAll('.weaponMiniCanvas').forEach(cv=>drawGachaResultMonster(cv,pendingPulls[Number(cv.dataset.widx)]));

    if(count===10){
      hideDoorItem();
      $('pullResults').classList.add('show','tenMode');
      $('gDoorFrame').style.opacity=.18;
      $('gachaTitle').textContent=t('gacha.tenResultTitle');
      $('gachaText').textContent=t('gacha.tenResultText',{count});
      const actions=document.createElement('div');
      actions.className='tenResultActions';
      actions.innerHTML=`<button id="tenResultDone" class="btn gold">${t('gacha.done')}</button><button id="tenResultCloseMenu" class="btn">${t('gacha.closeMenu')}</button>`;
      $('pullResults').appendChild(actions);
      $('tenResultDone').onclick=()=>{closeTenPullResults();enterOpenMenu()};
      $('tenResultCloseMenu').onclick=()=>{closeTenPullResults();enterCloseMenu();};
    }else{
      $('pullResults').classList.remove('show','tenMode');
      $('gDoorFrame').style.opacity='';
      $('gachaTitle').textContent=t('gacha.singleResultTitle');
      $('gachaText').textContent=t('gacha.singleResultText');
      showDoorItem(pendingPulls[0]);
      setTimeout(()=>showSingleWeaponReveal(pendingPulls[0]),520);
    }
  }
  async function enterGacha(){
    routeAfterGacha='close';await setDeviceClosed(true);document.querySelector('.outer-display').append($('gachaScreen'));show('gachaScreen');gachaMode='key';gachaStep=0;pendingPulls=[];gachaBusy=false;gachaSelectedCount=null;
    $('pullResults').classList.remove('show','tenMode');$('pullResults').innerHTML='';$('weaponRevealOverlay').classList.remove('show');$('gDoorFrame').style.opacity='';$('gDoorFrame').classList.add('built');$('gDoor').classList.remove('open');$('gKey').classList.remove('inserted');hideDoorItem();setGachaButtonsDisabled(false);
    for(const id of ['singlePullBtn','tenPullBtn','gachaHomeBtn'])$(id).style.display='inline-block';$('gachaTitle').textContent=t('gacha.gateTitle');$('gachaText').textContent=t('gacha.intro');$('gachaHomeBtn').textContent=t('gacha.back');updateGachaTop();
  }
  function runGachaSequence(count){
    if(gachaBusy||gachaStep===3)return;
    assertWallet(S,'gacha entry');
    const mode=gachaMode,rule=MASTER_DATA.monsterGacha.modes[mode],cost=count===10?rule.tenCost:rule.singleCost,currency=rule.currency,owned=S[currency],currencyLabel=t(mode==='gold'?'gacha.currencyGold':'gacha.currencyKeys');
    if(owned<cost){localeToast('gacha.insufficient',{currency:currencyLabel,needed:cost,owned});return;}
    gachaBusy=true;setGachaButtonsDisabled(true);hideDoorItem();$('weaponRevealOverlay').classList.remove('show');$('pullResults').classList.remove('show','tenMode');$('pullResults').innerHTML='';
    const previousState=S,previousPulls=pendingPulls,previousCount=gachaSelectedCount,previousStep=gachaStep;
    try{
      const known=S.codex.monsters||{},result=Monsters.gacha(S,count,MASTER_DATA,mode,Math.random);
      assertWallet(result.state,'gacha result');
      const nextPendingPulls=result.pulls.map(m=>{const d=Monsters.stats(m,MASTER_DATA);return {...d,lv:d.level,type:'MONSTER',passive:d.special.name,isNew:!known[m.monsterId],monsterInstance:m};});
      S=result.state;pendingPulls=nextPendingPulls;gachaSelectedCount=count;gachaStep=2;
      S.codex.monsters=S.codex.monsters||{};for(const m of result.pulls)S.codex.monsters[m.monsterId]=true;
      if(mode==='key'){bumpQuest('rare_gacha_pull',count);if(count===10)bumpQuest('rare_gacha_ten_pull');}
      if(!saveGame())throw Error('Gacha save failed');
      gachaCommitted=true;
      const highRare=pendingPulls.some(m=>m.rarity>=4);
      $('gKey').classList.add('inserted');
      $('gachaScreen').classList.toggle('summon-rare',highRare);
      $('gachaText').textContent=t(highRare?'gacha.rareOmen':'gacha.openToReveal');
      $('gachaHomeBtn').textContent=t('gacha.openResult');
      try{sfx(highRare?'cue':'door')}catch{}
    }catch(err){
      S=previousState;pendingPulls=previousPulls;gachaSelectedCount=previousCount;gachaStep=previousStep;
      localeToast('gacha.failure');
    }finally{
      gachaBusy=false;setGachaButtonsDisabled(gachaStep===2);$('gachaHomeBtn').disabled=false;updateGachaTop();
    }
  }
  async function revealGachaResults(){
    if(gachaBusy||gachaStep!==2||!pendingPulls.length)return;
    gachaBusy=true;setGachaButtonsDisabled(true);gachaStep=3;$('gachaScreen').classList.add('result-open');$('gDoor').classList.add('open');
    const instantMobileOpen=Math.min(innerWidth,innerHeight)<600;
    await setDeviceClosed(false,{skipSnapshot:true,instant:instantMobileOpen});
    document.querySelector('.inner-workspace').append($('gachaScreen'));
    renderPullResults(gachaSelectedCount);updateGachaTop();sfx('gacha');gachaBusy=false;setGachaButtonsDisabled(false);$('gachaHomeBtn').textContent=t('gacha.back');
  }
  function updateGachaTop(){const r=MASTER_DATA.monsterGacha.modes[gachaMode],currency=t(gachaMode==='gold'?'gacha.currencyGold':'gacha.currencyKeys');$('gachaKeys').textContent=t('currency.keys',{count:S.gateKeys});$('gachaGold').textContent=`${S.gold} G`;$('singlePullBtn').textContent=t('gacha.singlePull',{cost:r.singleCost,currency});$('tenPullBtn').textContent=t('gacha.tenPull',{cost:r.tenCost,currency});$('gachaCostNote').textContent=t('gacha.costNote',{currency,min:r.minRarity,max:r.maxRarity});$('goldGachaMode').textContent=t('gacha.goldMode');$('keyGachaMode').textContent=t('gacha.keyMode');for(const mode of ['gold','key']){$(mode+'GachaMode').classList.toggle('gold',gachaMode===mode);$(mode+'GachaMode').classList.toggle('secondary',gachaMode!==mode);$(mode+'GachaMode').setAttribute('aria-pressed',String(gachaMode===mode));}}
  function refreshGachaCopy(){
    updateGachaTop();
    if(gachaStep===3&&gachaSelectedCount===10){$('gachaTitle').textContent=t('gacha.tenResultTitle');$('gachaText').textContent=t('gacha.tenResultText',{count:10})}
    else if(gachaStep===3){$('gachaTitle').textContent=t('gacha.singleResultTitle');$('gachaText').textContent=t('gacha.singleResultText')}
    else if(gachaStep===2){$('gachaTitle').textContent=t('gacha.gateTitle');$('gachaText').textContent=t('gacha.openToReveal');$('gachaHomeBtn').textContent=t('gacha.openResult')}
    else{$('gachaTitle').textContent=t('gacha.gateTitle');$('gachaText').textContent=t('gacha.intro');$('gachaHomeBtn').textContent=t('gacha.back')}
    document.querySelectorAll('#pullResults .weaponCard').forEach((card,index)=>{const w=pendingPulls[index];if(!w)return;card.querySelector('.newTag').textContent=t(w.isNew?'gacha.newDiscovery':'gacha.reunion');card.querySelector('.wMeta').textContent=t('gacha.resultMeta',{attribute:localizedAttribute(w.attr),type:w.type,attack:w.atk,level:w.lv||1,skill:w.passive||''})});
    if($('tenResultDone'))$('tenResultDone').textContent=t('gacha.done');if($('tenResultCloseMenu'))$('tenResultCloseMenu').textContent=t('gacha.closeMenu');
    if(pendingPulls[0]&&$('weaponRevealOverlay').classList.contains('show'))showSingleWeaponReveal(pendingPulls[0]);
  }

  // ---------- HOME / MODALS ----------
  function currentWeapon(){return null;}
  function updateCloseMenu(){
    const modes=MASTER_DATA.monsterGacha.modes;
    $('closeGold').textContent=`${S.gold} G`;
    $('closeKeys').textContent=t('currency.keys',{count:S.gateKeys});
    $('closeGachaCost').textContent=t('closeMenu.gachaCost',{goldSingle:modes.gold.singleCost,goldTen:modes.gold.tenCost,keySingle:modes.key.singleCost,keyTen:modes.key.tenCost});
    $('closeStage').textContent=currentStoryStage()?.stage_id||t('closeMenu.clear');
    $('closeRank').textContent=S.rank;
    const w=currentWeapon();
    $('closeEquip').textContent=partyMembers().map(m=>m.name).join(' / ');
  }

  function enterOpenMenu(){
    setDeviceClosed(false);
    show('homeScreen');
    updateHome();
    if(!hasShownCloseMenuHint && S.freeDone){
      hasShownCloseMenuHint=true;
      localeToast('menu.readyHint',{},2500);
    }
  }

  async function enterCloseMenu(){
    await setDeviceClosed(true);
    show('closeMenuScreen');
    updateCloseMenu();
  }

  function updateHome(){
    const st=currentStoryStage();
    $('rankPill').textContent=`Rank ${S.rank}`;$('stagePill').textContent=st?`${st.stage_id} ${localizedDataName(st)}`:`STORY CLEAR`;$('homeGold').textContent=`${S.gold} G`;$('homeKeys').textContent=t('currency.keys',{count:S.gateKeys});
    updateGiftBadge();evaluateQuests();saveGame();if($('closeGold'))updateCloseMenu();
    const world=worldById[st?.world_id||'W03'];
    const portrait=MASTER_DATA.presentation.portraits[partnerById[S.equippedPartner]?.name]||MASTER_DATA.presentation.portraits['ミナ'];SHUTArt.portrait($('campPortrait'),MASTER_DATA.presentation.portraits[partnerById[S.equippedPartner]?.name]||MASTER_DATA.presentation.portraits['ミナ']);
    $('app').style.setProperty('--world','url("'+new URL(MASTER_DATA.presentation.backgrounds[world.world_id],location.href).href+'")');
    $('journeyTitle').textContent=S.run?'まだ見ぬ、門の奥へ':(st?localizedDataName(st):'地図の余白へ');
    $('journeyObjective').textContent=S.run?MASTER_DATA.expeditions[S.run.kind].name+' の続きから再開できます。':(st?localizedDataName(world)+' · 推奨Rank '+st.recommended_rank+'。'+(S.gifts.some(g=>g.rewardAmount===45)?'旅立ちの贈り物が届いています。':'3体の仲間と、次の物語へ。'):'物語の先にも、門は続いている。塔と再戦で力を試そう。');
    $('nextJourney').textContent=S.run?t('menu.resumeExpedition'):st?t('menu.continueJourney'):t('menu.memoryGate');
    $('journeyProgress').innerHTML=masterStages.filter(x=>x.world_id===world.world_id).map(x=>'<i class="'+(S.stageClears[x.stage_id]?'done':'')+'"></i>').join('');
    const labels={battleBtn:['menu.story','menu.storyDesc'],equipBtn:['menu.monsters','menu.monstersDesc'],synthesisBtn:['menu.synthesis','menu.synthesisDesc'],shopBtn:['menu.shop','menu.shopDesc'],partnerBtn:['menu.partner','menu.partnerDesc'],questBtn:['menu.quests','menu.questsDesc'],giftBtn:['menu.presents','menu.presentsDesc'],gateBtn:['menu.gates','menu.gatesDesc'],collectionBtn:['menu.library','menu.libraryDesc']};
    Object.entries(labels).forEach(([id,[name,desc]])=>{$(id).querySelector('strong').textContent=t(name);$(id).querySelector('small').textContent=t(desc)});
    [['shopBtn','shop'],['partnerBtn','partner'],['questBtn','quests'],['collectionBtn','library']].forEach(([id,key])=>$(id).hidden=!S.stageClears[MASTER_DATA.progression[key]]);
    $('partnerBtn').hidden=true;
    $('gateBtn').hidden=!Object.values(S.gateUnlocked).some(Boolean);
    $('homeCenter').style.setProperty('--menu-rows',Math.ceil([...document.querySelectorAll('.menuGrid .menuBtn')].filter(b=>!b.hidden).length/2));
    $('soundToggle').textContent=t('settings.button');$('soundToggle').setAttribute('aria-label',t('settings.buttonAria'));
  }
  function openModal(title,html){document.querySelector(SHUTDevice.closed?'.outer-display':'.inner-workspace').append($('modal'));$('modalTitle').textContent=title;$('modalBody').innerHTML=html;$('modal').classList.add('show');}
  const monsterView={sort:'acquired',direction:-1,attributes:new Set(),rarity:0,favorite:false,locked:false};
  const attributeOrder={'火':0,'水':1,'雷':2,'地':3,'風':4};
  const monsterSortLabels={level:'monsters.sortLevel',rarity:'monsters.sortRarity',attribute:'monsters.sortAttribute',acquired:'monsters.sortAcquired',name:'monsters.sortName'};
  let shopSelection=null,shopQuantity=1;
  function visibleMonsters(){
    const acquired=new Map(S.monsters.map((m,index)=>[m.id,index]));
    const list=S.monsters.filter(m=>{const s=Monsters.stats(m,MASTER_DATA);return (!monsterView.attributes.size||monsterView.attributes.has(s.attr))&&(!monsterView.rarity||s.rarity===monsterView.rarity)&&(!monsterView.favorite||m.favorite)&&(!monsterView.locked||m.locked)});
    const value=(m,s)=>monsterView.sort==='level'?s.level:monsterView.sort==='rarity'?s.rarity:monsterView.sort==='attribute'?attributeOrder[s.attr]:monsterView.sort==='name'?s.name:acquired.get(m.id);
    return list.map(m=>({m,s:Monsters.stats(m,MASTER_DATA)})).sort((a,b)=>{const av=value(a.m,a.s),bv=value(b.m,b.s),diff=typeof av==='string'?av.localeCompare(bv,I18n.language):av-bv;return diff*monsterView.direction||acquired.get(a.m.id)-acquired.get(b.m.id)});
  }
  function monsterTile(m,s,mode='roster',selected=false,disabled=false){
    const flags=`${m.favorite?'<i class="favoriteFlag" title="'+t('monsters.favorite')+'">♥</i>':''}${m.locked?'<i class="lockFlag" title="'+t('monsters.locked')+'">◆</i>':''}${S.party.includes(m.id)?'<i class="partyFlag">'+t('monsters.party')+'</i>':''}`;
    return `<button class="monsterTile attr-${s.attr} ${selected?'selected':''}" data-${mode}="${m.id}" ${disabled?'disabled':''} aria-label="${s.name}"><span class="monsterFlags">${flags}</span><canvas width="96" height="96" data-monster="${m.id}"></canvas><span class="monsterTileMeta"><b>${t('monsters.level',{level:s.level})}</b><em>★${s.rarity}</em><small>${localizedAttribute(s.attr)}</small></span></button>`;
  }
  function renderEquipment(){
    setMusicMode('equip');const rows=visibleMonsters(),sortOptions=Object.entries(monsterSortLabels).map(([value,key])=>`<option value="${value}" ${monsterView.sort===value?'selected':''}>${t(key)}</option>`).join(''),rarityOptions=[0,1,2,3,4,5,6].map(r=>`<option value="${r}" ${monsterView.rarity===r?'selected':''}>${r?'★'+r:t('monsters.allRarities')}</option>`).join('');
    const directionKey=monsterView.direction>0?'monsters.directionAsc':'monsters.directionDesc';
    openModal(t('monsters.title',{count:S.monsters.length}),`<div class="monsterToolbar"><label>${t('monsters.sort')}<select id="monsterSort">${sortOptions}</select></label><button id="monsterDirection" class="btn secondary" aria-label="${t(directionKey)}" title="${t(directionKey)}"><span aria-hidden="true">${monsterView.direction>0?'↑':'↓'}</span><span class="directionText">${t(directionKey)}</span></button><label>${t('monsters.rarityFilter')}<select id="monsterRarity">${rarityOptions}</select></label></div><div class="monsterFilters">${attributes.map(a=>`<button class="filterChip ${monsterView.attributes.has(a)?'active':''}" data-attr-filter="${a}" aria-pressed="${monsterView.attributes.has(a)}">${localizedAttribute(a)}</button>`).join('')}<button class="filterChip ${monsterView.favorite?'active':''}" id="favoriteFilter" aria-pressed="${monsterView.favorite}">♥ ${t('monsters.favoriteOnly')}</button><button class="filterChip ${monsterView.locked?'active':''}" id="lockedFilter" aria-pressed="${monsterView.locked}">◆ ${t('monsters.lockedOnly')}</button><button class="filterChip clear" id="clearMonsterFilters">${t('monsters.all')}</button></div><div class="monsterGrid">${rows.map(({m,s})=>monsterTile(m,s,'monster-open')).join('')||`<p class="emptyState">${t('monsters.empty')}</p>`}</div>`);drawMonsterRoster();
    $('monsterSort').onchange=e=>{monsterView.sort=e.target.value;renderEquipment()};$('monsterDirection').onclick=()=>{monsterView.direction*=-1;renderEquipment()};$('monsterRarity').onchange=e=>{monsterView.rarity=Number(e.target.value);renderEquipment()};
    document.querySelectorAll('[data-attr-filter]').forEach(b=>b.onclick=()=>{monsterView.attributes.has(b.dataset.attrFilter)?monsterView.attributes.delete(b.dataset.attrFilter):monsterView.attributes.add(b.dataset.attrFilter);renderEquipment()});
    $('favoriteFilter').onclick=()=>{monsterView.favorite=!monsterView.favorite;renderEquipment()};$('lockedFilter').onclick=()=>{monsterView.locked=!monsterView.locked;renderEquipment()};$('clearMonsterFilters').onclick=()=>{monsterView.attributes.clear();monsterView.rarity=0;monsterView.favorite=false;monsterView.locked=false;renderEquipment()};
    document.querySelectorAll('[data-monster-open]').forEach(b=>b.onclick=()=>renderMonsterDetail(b.dataset.monsterOpen));
  }
  function renderMonsterDetail(id){
    const m=S.monsters.find(x=>x.id===id);if(!m){renderEquipment();return}const s=Monsters.stats(m,MASTER_DATA),level=Monsters.levelAt(m.xp,MASTER_DATA),form=Monsters.form(m,MASTER_DATA),next=form.evolution?Monsters.definition(form.evolution.to,MASTER_DATA):null,evolution=next?t('monsters.evolvesAt',{level:form.evolution.level,name:localizedDataName(next)}):t('monsters.noEvolution');
    openModal(s.name,`<div class="monsterDetail"><div class="monsterPortrait"><canvas width="192" height="192" data-monster="${m.id}"></canvas><div class="detailFlags">${stars(s.rarity)} · ${localizedAttribute(s.attr)} · ${t('monsters.acquiredOrder',{order:S.monsters.indexOf(m)+1})}</div></div><div class="monsterDetailInfo"><div class="detailStats"><span>${t('monsters.level',{level:s.level})}</span><span>${level.next?t('monsters.exp',{current:level.xpIntoLevel,next:level.next}):t('monsters.expMax')}</span><span>${t('monsters.hp')} ${s.maxHp}</span><span>${t('monsters.atk')} ${s.atk}</span></div><section><b>${t('monsters.skill')} · ${s.skill?.name||'—'}</b><p>${s.skill?.description||'—'}</p></section><section><b>${t('monsters.specialGauge')} · ${s.special?.name||'—'}</b><p>${s.special?.description||t('monsters.specialGaugeInfo')}</p></section><section><b>${t('monsters.evolution')}</b><p>${evolution}</p></section><div class="detailActions"><button id="detailFavorite" class="btn ${m.favorite?'gold':'secondary'}">♥ ${t(m.favorite?'monsters.favorite':'monsters.notFavorite')}</button><button id="detailLock" class="btn ${m.locked?'gold':'secondary'}">◆ ${t(m.locked?'monsters.locked':'monsters.unlocked')}</button><button id="detailTeam" class="btn" ${S.party.includes(m.id)?'disabled':''}>${t(S.party.includes(m.id)?'monsters.teamIn':'monsters.teamAdd')}</button><button id="detailBack" class="btn secondary">${t('monsters.back')}</button></div></div></div>`);drawMonsterRoster();
    $('detailFavorite').onclick=()=>{m.favorite=!m.favorite;saveGame();renderMonsterDetail(id)};$('detailLock').onclick=()=>{m.locked=!m.locked;saveGame();renderMonsterDetail(id)};$('detailBack').onclick=renderEquipment;$('detailTeam').onclick=()=>renderPartyReplacement(id);
  }
  function renderPartyReplacement(newId){
    openModal(t('monsters.chooseReplacement'),`<div class="partyReplaceGrid">${partyMembers().map(m=>monsterTile(S.monsters.find(x=>x.id===m.id),m,'swap')).join('')}</div>`);drawMonsterRoster();document.querySelectorAll('[data-swap]').forEach(b=>b.onclick=()=>{S.party[S.party.indexOf(b.dataset.swap)]=newId;syncPartyHp(true);saveGame();renderMonsterDetail(newId)});
  }
  function renderCollection(){
    const rows=MASTER_DATA.monsters.map(d=>{const seen=S.monsters.some(m=>m.monsterId===d.monster_id)||S.codex.monsters?.[d.monster_id];return '<div class="libraryCard"><b>'+(seen?d.name:'？？？')+'</b><p>'+(seen?stars(d.rarity)+' · '+d.attribute:'未発見')+'</p>'+(seen?'<canvas width="96" height="96" data-species="'+d.monster_id+'"></canvas>':'')+'</div>';}).join('');
    openModal('モンスター図鑑','<div class="libraryGrid">'+rows+'</div>');document.querySelectorAll('[data-species]').forEach(cv=>{const d=Monsters.definition(cv.dataset.species,MASTER_DATA),a=MASTER_DATA.sprites[d.sprite];SHUTArt.image(a.source,img=>SHUTArt.drawCell(cv,img,{...a,cell:a.states.idle[0]},.08));});
  }
  function renderShop(){
    setMusicMode('shop');const entries=shopEntries();if(!shopSelection||!entries.some(e=>e.shop_id===shopSelection))shopSelection=entries[0]?.shop_id||null;const selected=entries.find(e=>e.shop_id===shopSelection),max=selected?maxPurchase(selected):0;shopQuantity=clamp(shopQuantity,0,max);openModal(t('shop.title'),`<div class="shopHeader"><p>${t('shop.intro')}</p><strong>${t('shop.currentGold',{gold:S.gold})}</strong></div><div class="shopLayout"><div class="shopCatalog">${entries.map(e=>{const item=itemById[e.ref],owned=S.items[itemStateKey[e.ref]]||0,stock=shopStockRemaining(e);return `<button class="shopCatalogItem ${e===selected?'selected':''}" data-shop-select="${e.shop_id}">${itemIcon(e.ref,'small')}<span><b>${t('shop.items.'+e.ref+'.name')}</b><small>${t('shop.unitPrice',{price:e.price})}</small><small>${t('shop.owned',{count:owned})} · ${t('shop.stock',{count:stock})}</small></span></button>`}).join('')}</div>${selected?shopDetail(selected,max):`<p>${t('shop.selectItem')}</p>`}</div>`);bindShop(entries,selected);
  }
  function shopEntries(){return MASTER_DATA.shop.filter(e=>e.category==='item'&&e.enabled==='yes'&&['ITM001','ITM002','ITM003'].includes(e.ref))}
  function shopStockRemaining(entry){const stock=Number(entry.stock);if(!Number.isFinite(stock))return 999999;if(!Number.isFinite(S.shopStock[entry.shop_id]))S.shopStock[entry.shop_id]=Math.max(0,Math.floor(stock));return S.shopStock[entry.shop_id]}
  function maxPurchase(entry){const item=itemById[entry.ref],owned=S.items[itemStateKey[entry.ref]]||0;return Math.max(0,Math.min(item.max_stack-owned,Math.floor(S.gold/entry.price),shopStockRemaining(entry)))}
  const shopIconAssets={ITM001:'assets/shop-itm001-repair-mist.png',ITM002:'assets/shop-itm002-high-repair.png',ITM003:'assets/shop-itm003-full-core.png'};
  function itemIcon(ref,size='large'){const name=t('shop.items.'+ref+'.name');return `<img class="itemIcon ${size}" data-asset-status="finished" src="${shopIconAssets[ref]}" alt="${name}">`}
  function shopDetail(entry,max){const item=itemById[entry.ref],owned=S.items[itemStateKey[entry.ref]]||0,total=shopQuantity*entry.price,afterGold=S.gold-total;return `<div class="shopDetail">${itemIcon(entry.ref)}<div><h3>${t('shop.items.'+entry.ref+'.name')}</h3><p><b>${t('shop.effect')}</b><br>${t('shop.items.'+entry.ref+'.effect')}</p><div class="shopFacts"><span>${t('shop.unitPrice',{price:entry.price})}</span><span>${t('shop.owned',{count:owned})}</span><span>${t('shop.inventoryCap',{cap:item.max_stack})}</span><span>${t('shop.stock',{count:shopStockRemaining(entry)})}</span></div></div><div class="quantityPanel"><b>${t('shop.quantity')}</b><output id="shopQuantity">${shopQuantity}</output><div class="quantitySteps">${[-10,-1,1,10].map(n=>`<button class="btn secondary" data-quantity-step="${n}">${n>0?'+':''}${n}</button>`).join('')}<button class="btn secondary" data-quantity-max>MAX</button></div><div class="purchaseSummary"><span>${t('shop.afterOwned',{count:owned+shopQuantity})}</span><span>${t('shop.total',{total})}</span><span>${t('shop.currentGold',{gold:S.gold})}</span><strong>${t('shop.afterGold',{gold:afterGold})}</strong></div><button id="confirmShopPurchase" class="btn gold" ${shopQuantity<1||shopQuantity>max?'disabled':''}>${max?t('shop.buy'):t('shop.soldOut')}</button></div></div>`}
  function bindShop(entries,selected){document.querySelectorAll('[data-shop-select]').forEach(b=>b.onclick=()=>{shopSelection=b.dataset.shopSelect;shopQuantity=1;renderShop()});if(!selected)return;document.querySelectorAll('[data-quantity-step]').forEach(b=>b.onclick=()=>{shopQuantity=clamp(shopQuantity+Number(b.dataset.quantityStep),0,maxPurchase(selected));renderShop()});const maxButton=document.querySelector('[data-quantity-max]');if(maxButton)maxButton.onclick=()=>{shopQuantity=maxPurchase(selected);renderShop()};$('confirmShopPurchase').onclick=()=>{const current=shopEntries().find(e=>e.shop_id===selected.shop_id),allowed=current?maxPurchase(current):0,quantity=Math.floor(shopQuantity);if(!current||quantity<1||quantity>allowed)return;const key=itemStateKey[current.ref],total=current.price*quantity;if(!spendWallet('gold',total,'shop purchase'))return;S.items[key]=(S.items[key]||0)+quantity;S.shopStock[current.shop_id]=shopStockRemaining(current)-quantity;saveGame();updateHome();shopQuantity=1;renderShop()}}
  function renderPartner(){renderEquipment();}

  function renderGiftBox(){
    const rows=S.gifts.map((g,i)=>`<div class="giftRow"><div><b>${g.title}</b><span class="small">${rewardName(g.rewardType)} ×${g.rewardAmount}${g.desc?`<br>${g.desc}`:''}</span></div><button class="btn gold" data-gift="${i}">受取</button></div>`).join('');
    openModal('PRESENT BOX',`${S.gifts.length?`<button id="claimAllGift" class="btn gold" style="margin-bottom:10px">一括受取</button>`:''}${rows||'<div class="small">未受取のプレゼントはありません。</div>'}`);
    document.querySelectorAll('[data-gift]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.gift),g=S.gifts[i];if(!g)return;applyReward(g.rewardType,g.rewardAmount,g.monsterId);S.gifts.splice(i,1);saveGame();updateHome();renderGiftBox()});
    if($('claimAllGift'))$('claimAllGift').onclick=()=>{const batch=S.gifts.splice(0);batch.forEach(g=>applyReward(g.rewardType,g.rewardAmount,g.monsterId));saveGame();updateHome();renderGiftBox()};
  }
  function renderQuests(view='active'){
    if(typeof view!=='string')view='active';evaluateQuests();
    const visible=MASTER_DATA.quests.filter(q=>{if(view==='done')return !!S.questDelivered[q.quest_id];if(S.questDelivered[q.quest_id])return false;const secret={boss_rush_clear:'BOSSRUSH',boss_rematch_win:'BOSSRUSH',boss_capture_count:'HIDDEN',tower_floor:'TOWER',endless_battle:'ENDLESS'}[q.condition_key];if(secret&&!S.gateUnlocked[secret])return false;const gate=/gate_(?:discover|clear):(.+)/.exec(q.condition_key);if(gate&&!S.gateUnlocked[gate[1]])return false;const stage=q.condition_key.startsWith('stage_clear:')?q.condition_key.split(':')[1]:null;if(stage&&masterStages.findIndex(s=>s.stage_id===stage)>S.storyIndex)return false;return true;}).sort((a,b)=>questValue(b)/b.target-questValue(a)/a.target);
    const rows=visible.slice(0,view==='active'?8:100).map(q=>{const v=Math.min(Number(q.target),questValue(q)),done=v>=Number(q.target);return `<div class="questRow"><div><b>${q.name}</b><span class="small">${v}/${q.target} / 報酬 ${rewardName(q.rewards[0].type)} ×${q.rewards[0].amount}${S.questDelivered[q.quest_id]?' / 贈り物へ送付済':''}</span><div class="questBar"><i style="width:${Math.min(100,v/Number(q.target)*100)}%"></i></div></div><span class="dataTag">${done?'CLEAR':'ACTIVE'}</span></div>`}).join('');
    openModal('依頼帳',`<div class="filterTabs"><button class="btn ${view==='active'?'gold':''}" data-questview="active">今の挑戦</button><button class="btn ${view==='done'?'gold':''}" data-questview="done">達成した依頼</button></div><p class="small">今の旅に近い依頼を8件まで表示。達成報酬は「贈り物」に届きます。</p>${rows||'<p>このページの依頼はありません。</p>'}`);
    document.querySelectorAll('[data-questview]').forEach(b=>b.onclick=()=>renderQuests(b.dataset.questview));
  }
  function renderGates(){
    const rows=Object.entries(MASTER_DATA.expeditions).filter(([k])=>S.gateUnlocked[k]).map(([kind,cfg])=>'<div class="gateRow"><div><b>'+cfg.name+'</b><p class="small">'+cfg.description+'<br>'+(cfg.limited?'残り '+(S.gateAttempts[kind]||0)+' 回':kind==='TOWER'?'到達 '+S.records.tower+' F':kind==='ENDLESS'?'最深 '+S.records.endless+' 門':'記憶に刻まれたボスと再戦')+'</p></div><button class="btn gold" data-gateclaim="'+kind+'" '+(!Systems.gateAvailable(kind,S,MASTER_DATA)?'disabled':'')+'>挑戦する</button></div>').join('');
    openModal('未知の門',rows||'<p>まだ、未知の反応はない。物語を進めよう。</p>');document.querySelectorAll('[data-gateclaim]').forEach(b=>b.onclick=()=>runGateExpedition(b.dataset.gateclaim));
  }
  function runGateExpedition(kind,resume=false){
    if(!resume)syncPartyHp(true);
    const resumeHp=S.hp,resumeSlots=S.run?.slots??3;
    if(!resume&&!Systems.gateAvailable(kind,S,MASTER_DATA))return;
    const cfg=MASTER_DATA.expeditions[kind];if(!resume){if(cfg.limited)S.gateAttempts[kind]--;S.run={kind,floor:kind==='TOWER'?Math.floor(S.records.tower/5)*5+1:1,bank:0};if(S.run.floor>10)S.run.floor=1;}
    activeGate=kind;const unlocked=masterStages.filter(st=>S.stageClears[st.stage_id]&&st.stage_type!=='forced_loss');const base=unlocked.at(-1)||masterStages[0];
    activeStageId='GATE_'+kind;activeStageData=JSON.parse(JSON.stringify(base));activeStageData.stage_id=activeStageId;activeStageData.name=cfg.name;activeStageData.stage_type='expedition';activeStageData.encounters={count:cfg.count||999999,bosses:[]};
    encounterMax=cfg.count||999999;encounter=S.run.floor;carrySlots=resume?resumeSlots:3;S.run.slots=carrySlots;pendingItem=null;if(!resume)skillCharge=Object.fromEntries(S.party.map(id=>[id,0]));S.hp=resume?Math.max(1,Math.min(playerMaxHp(),resumeHp)):playerMaxHp();$('modal').classList.remove('show');setDeviceClosed(false);show('battleScreen');saveGame();startEncounter();
  }

  function renderStoryMap(chapter=null){
    if(typeof chapter!=='string')chapter=null;
    const current=currentStoryStage()||masterStages.at(-1),world=worldById[chapter||current.world_id];
    const available=MASTER_DATA.worlds.filter(w=>masterStages.findIndex(s=>s.world_id===w.world_id)<=S.storyIndex);
    let html='<div class="chapterNav">'+available.map((w,i)=>'<button class="btn secondary" data-chapter="'+w.world_id+'">CHAPTER '+(i+1)+'</button>').join('')+'</div><div class="worldHeader"><b>'+localizedDataName(world)+'</b><p class="small">'+localizedDataDescription(world)+'</p></div><div class="stageGrid">';
    masterStages.filter(st=>st.world_id===world.world_id).forEach(st=>{const idx=masterStages.indexOf(st),unlocked=idx<=S.storyIndex,cleared=S.stageClears[st.stage_id];html+='<button class="stageCard '+(!unlocked?'locked':cleared?'cleared':'current')+'" data-stage="'+st.stage_id+'" '+(!unlocked?'disabled':'')+'><span class="eyebrow">'+String(st.stage_no).padStart(2,'0')+' · '+(cleared?'CLEAR':unlocked?'NEXT':'LOCKED')+'</span><h4>'+localizedDataName(st)+'</h4><p>推奨Rank '+st.recommended_rank+' · '+localizedDataDescription(st)+'</p><p>初回 '+st.first_clear_rewards.map(r=>rewardName(r.type)+' ×'+r.amount).join(' / ')+'</p></button>'});
    openModal('旅の地図',html+'</div>');document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>showStoryEventAndStart(b.dataset.stage));document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>renderStoryMap(b.dataset.chapter));
  }
  function showStoryEventAndStart(stageId){
    const st=stageById[stageId];if(!st)return;openModal(localizedDataName(st),'<div class="stageDetail"><div class="eyebrow">'+localizedDataName(worldById[st.world_id])+'</div><h2>'+localizedDataDescription(st)+'</h2><p>推奨Rank '+st.recommended_rank+' / '+st.encounters.count + '戦'+'</p><p class="small">'+st.missions.map(m=>m.name).join(' · ')+'</p><button id="storyDeploy" class="btn gold">この門へ進む →</button></div>');
    $('storyDeploy').onclick=()=>{$('modal').classList.remove('show');playEvents(stageId,'before_battle',()=>startStoryStage(stageId))};
  }

  function weaponNeed(w){return 18+w.lv*10}
  function addRankXp(amount){
    amount=Math.round(amount);
    S.rankXp+=amount;
    while(S.rankXp>=S.rankNeed){S.rankXp-=S.rankNeed;S.rank++;S.rankNeed=Math.round(S.rankNeed*1.20);}
    saveGame();
  }

  // ---------- ENEMY GENERATION ----------
  function stageMult(){return Combat.context(activeStageData||currentStoryStage()||masterStages[0],S.rank,MASTER_DATA).hpScale}
  function makeEnemy(def,isBoss=false){
    const stage=activeStageData||currentStoryStage()||masterStages[0];
    const override=stage.encounters.bossOverrides?.[def.masterId];
    if(override)def={...def,hp:override.base_hp,atk:override.base_atk,attackEvery:override.attack_every};
    const stats=Combat.stats(def,isBoss,stage,S.rank,MASTER_DATA);if(activeGate&&MASTER_DATA.expeditions[activeGate].hpFactor)stats.hp=stats.maxHp=Math.round(stats.hp*MASTER_DATA.expeditions[activeGate].hpFactor);
    if(activeGate==='ENDLESS'){const extra=1+Math.min(2,(encounter-1)*.045);stats.hp=stats.maxHp=Math.round(stats.hp*extra);stats.atk=Math.round(stats.atk*Math.min(1.8,extra));}
    return {...def,...stats,id:'e'+Date.now()+Math.random().toString(16).slice(2),attr:def.attr,prevHp:stats.hp,gold:rnd(def.gold[0],def.gold[1]),boss:isBoss,dead:false,animationState:'idle',popup:null,popupTimer:null,flashUntil:0,hpAnimTimer:null};
  }
  function generateEncounter(n){
    if(activeGate){const cfg=MASTER_DATA.expeditions[activeGate];let ids=[];
      if(activeGate==='BOSSRUSH'){const cleared=cfg.bosses.filter(id=>masterStages.some(st=>S.stageClears[st.stage_id]&&st.encounters.bosses.includes(id)));const pool=cleared.length?cleared:['E008'];encounterMax=pool.length;ids=[pool[(n-1)%pool.length]];}
      else if(activeGate==='TOWER'&&n%5===0)ids=[n===10?'E019':'E012'];else if(activeGate==='HIDDEN'&&n===cfg.count)ids=[cfg.boss];else if(activeGate==='ENDLESS'&&n%5===0)ids=[n%10===0?'E026':'E013'];
      if(ids.length)return ids.map(id=>makeEnemy(enemyById[id],true));if(cfg.pool)return [makeEnemy(enemyById[cfg.pool[(n-1)%cfg.pool.length]],false)];
    }
    if(globalThis.SHUTMikadoPresentation?.rollEncounter(activeStageData||currentStoryStage(),Math.random)){
      const id=globalThis.SHUTMikadoPresentation.enemyId();
      return [{...makeEnemy(enemyById[id],true),role:'boss'}];
    }
    return Combat.encounterIds(activeStageData||currentStoryStage(),S.rank,n,MASTER_DATA).map(({id,boss,role})=>({...makeEnemy(enemyById[id],boss),role:role||(boss?'boss':'normal')}));
  }

  const enemySpriteSources = Object.fromEntries(Object.entries(MASTER_DATA.sprites).map(([k,v])=>[k,v.source]));
  const enemySpriteImages = {};
  Object.entries(enemySpriteSources).forEach(([k,src])=>{{ const im=new Image(); im.src=src; enemySpriteImages[k]=im; }});

  // ---------- PIXEL ART ----------
  function drawEnemy(canvas,e,frame){
    const c=canvas.getContext('2d'),cw=canvas.width,ch=canvas.height;c.clearRect(0,0,cw,ch);c.imageSmoothingEnabled=false;
    const img=enemySpriteImages[e.kind],meta=MASTER_DATA.sprites[e.kind];
    e.animationState=e.dead?'death':performance.now()<e.flashUntil?'hit':e.id===defenseEnemyId&&phase==='defense'?'attack':'idle';
    canvas.dataset.animationState=e.animationState;canvas.dataset.placeholder=String(meta.placeholder);
    if(e.lastAnimationState!==e.animationState){e.lastAnimationState=e.animationState;e.animationStart=performance.now();}const frames=meta.states[e.animationState]||[meta.cell];const elapsed=performance.now()-(e.animationStart||0),frameMs=e.animationState==='idle'?Math.max(320,meta.frameMs||0):(meta.frameMs||150);const ix=Math.floor(elapsed/frameMs);const cell=frames[e.animationState==='idle'||e.animationState==='attack'?ix%frames.length:Math.min(ix,frames.length-1)];canvas.dataset.frame=cell;
    c.fillStyle='rgba(16,45,52,.38)';const groundY=meta.baseline??ch-meta.footInset;c.fillRect(Math.round(cw/2-18),Math.min(ch-4,groundY+2),36,4);
    if(img?.complete&&img.naturalWidth){const cols=meta.columns||1,rows=meta.rows||1,col=cell%cols,row=Math.floor(cell/cols),sx=Math.round(col*img.naturalWidth/cols),sy=Math.round(row*img.naturalHeight/rows),ex=Math.round((col+1)*img.naturalWidth/cols),ey=Math.round((row+1)*img.naturalHeight/rows),sw=ex-sx,sh=ey-sy,sourceH=Math.floor(sh*(1-(meta.trimBottom||0)));const r=Combat.spriteRect(sw,sourceH,cw,ch,meta);c.drawImage(img,sx,sy,sw,sourceH,r.x,r.y,r.width,r.height);}
  }
  function spriteLoop(){animFrame=(animFrame+1)%6;document.querySelectorAll('.enemyCard canvas').forEach(cv=>{const e=enemies.find(x=>x.id===cv.dataset.id);if(e)drawEnemy(cv,e,animFrame)});setTimeout(spriteLoop,120)}

  // ---------- BATTLE UI ----------
  function updateBattleHeader(){
    const w=null;
    $('battleRank').textContent=`Rank ${S.rank}`;$('battleWeapon').textContent=t('battle.monstersCount',{count:S.party.length});
    $('playerHpFill').style.width=`${Math.min(100,S.hp/playerMaxHp()*100)}%`;$('playerHpText').textContent=`${Math.ceil(S.hp)}/${playerMaxHp()}`;
    $('playerHpFill').style.background=hpBarGradient(w?.attr||'風');
    $('rankXpFill').style.width=`${S.rankXp/S.rankNeed*100}%`;$('rankXpText').textContent=`${S.rankXp}/${S.rankNeed}`;
    const bossNow=enemies.some(e=>e.boss&&!e.dead);$('battleStage').textContent=activeStageData?`${activeStageData.stage_id} ${localizedDataName(activeStageData)}`:`Stage ${S.stage}`;$('battleEncounter').textContent=t('battle.battleCount',{current:encounter,total:encounterMax,boss:bossNow?'  BOSS':''});
    if(activeGate==='ENDLESS')$('battleEncounter').textContent=t('battle.endlessGate',{floor:encounter});
    $('battleCarry').textContent=t('battle.itemSlots',{slots:carrySlots});
  }
  function updateBossBar(){
    const bosses=enemies.filter(e=>e.boss);
    const liveBoss=bosses.find(e=>!e.dead);
    const boss=liveBoss?{...liveBoss,name:bosses.map(displayedEnemyName).join(' / '),hp:bosses.reduce((n,e)=>n+e.hp,0),maxHp:bosses.reduce((n,e)=>n+e.maxHp,0),prevHp:bosses.reduce((n,e)=>n+(e.prevHp??e.hp),0)}:null;
    const box=$('bossHpBox');
    if(!boss){ box.classList.remove('show'); return; }
    box.classList.add('show');
    $('bossName').textContent=`BOSS ${boss.name}`;
    $('bossAttr').textContent=t('battle.attribute',{attribute:localizedAttribute(boss.attr)});
    $('bossAttr').style.color=attrColor[boss.attr];
    const hpPct=Math.max(0,boss.hp/boss.maxHp*100);
    const prevPct=Math.max(hpPct, Math.max(0,(boss.prevHp ?? boss.hp)/boss.maxHp*100));
    $('bossHpLag').style.width=`${prevPct}%`;
    $('bossHpFill').style.width=`${prevPct}%`;
    $('bossHpFill').style.setProperty('--hp-color',hpBarGradient(boss.attr));$('bossHpFill').style.background=hpBarGradient(boss.attr);
    $('bossHpText').textContent=`${Math.max(0,Math.ceil(boss.hp))} / ${boss.maxHp}  (${Math.round(hpPct)}%)`;
    requestAnimationFrame(()=>{
      $('bossHpFill').style.width=`${hpPct}%`;
      setTimeout(()=>{ $('bossHpLag').style.width=`${hpPct}%`; },170);
    });
  }
  function hpBarGradient(attr){return attrColor[attr]||attrColor['風'];}
  function renderEnemies(){
    const area=$('enemyArea');area.innerHTML='';
    const alive=living();
    area.className='';
    area.id='enemyArea';
    if(alive.length===1 && alive[0].boss) area.classList.add('bossOnly');
    else if(alive.length===1) area.classList.add('single');
    else area.classList.add('multi');
    updateBossBar();
    enemies.forEach(e=>{
      const ready=!e.dead&&e.turnsLeft<=0;
      const card=document.createElement('div');
      const hpRatio=Math.max(0,e.hp/e.maxHp);
      const prevRatio=Math.max(hpRatio,Math.max(0,(e.prevHp ?? e.hp)/e.maxHp));
      const flashing=performance.now() < (e.flashUntil||0);
      const compact=enemies.length>=3 && !e.boss;
      card.className='enemyCard kind-'+e.kind+(compact?' compact':'')+(e.boss?' bossCard':'')+(e.id===targetId?' target':'')+(e.dead?(performance.now()<(e.defeatUntil||0)?' defeated':' dead'):'')+(hpRatio<.35?' lowhp':'')+(flashing?' hitFlash':'')+(e.id===defenseEnemyId&&phase==='defense'?' attacking':'');
      card.dataset.id=e.id;card.dataset.masterId=e.masterId||'';
      const popupHTML = e.popup ? `<div class="damagePop ${e.popup.cls||''}">${e.popup.text}${e.popup.tag?`<span class="tag">${e.popup.tag}</span>`:''}</div>` : '';
      const barNow=hpBarGradient(e.attr);
      const canvasW=MASTER_DATA.sprites[e.kind].canvasSize||64, canvasH=canvasW;
      card.innerHTML=`
        <div class="enemySpriteWrap">${popupHTML}<canvas width="${canvasW}" height="${canvasH}" data-id="${e.id}"></canvas></div>
        <div class="eName">${e.boss?'BOSS ':''}${displayedEnemyName(e)}</div>
        <div class="eMeta">${t('battle.enemyMeta',{attribute:localizedAttribute(e.attr),attack:e.atk})}${e.poison?` · ${t('battle.poison')}`:''}${e.attackDown?` · ${t('battle.atkDown')}`:''}</div>
        <div class="attr" style="color:${attrColor[e.attr]}">${e.attr}</div>
        <div class="turnBadge ${ready?'ready':''}">${t(ready?'battle.enemyReady':'battle.enemyTurns')} <b>${ready?'!':e.turnsLeft}</b></div>
        ${e.boss?'':`<div class="ehp eBar"><div class="ehpLag" style="width:${prevRatio*100}%"></div><div class="ehpNow" style="width:${prevRatio*100}%;--hp-color:${barNow};background:${barNow}"></div></div><div class="ehpText"><span>HP ${Math.max(0,Math.ceil(e.hp))} / ${e.maxHp}</span><span class="hpPct">${Math.round(hpRatio*100)}%</span></div>`}`;
      card.onclick=(ev)=>{
        ev.stopPropagation();
        if(phase==='defense'){executeDefense();return;}
        if(!e.dead && phase==='attack'){
          targetId=e.id;
          renderEnemies();
          executeAttack(e.id);
        }
      };
      area.appendChild(card);
      drawEnemy(card.querySelector('canvas'),e,animFrame);
      const nowBar=card.querySelector('.ehpNow');
      const lagBar=card.querySelector('.ehpLag');
      if(nowBar && lagBar){
        requestAnimationFrame(()=>{
          nowBar.style.width=`${hpRatio*100}%`;
          setTimeout(()=>{ lagBar.style.width=`${hpRatio*100}%`; },160);
        });
      }
    });
  }
  function living(){return enemies.filter(e=>!e.dead)}

  function playBossEntrance(e,done){
    if(globalThis.SHUTMikadoPresentation?.matches(e)){
      sfx('cue');
      SHUTMikadoPresentation.enter({enemy:e,setMusicMode,onComplete:done});
      return;
    }
    $('bossIntroName').textContent=displayedEnemyName(e);$('bossIntro').classList.remove('show');void $('bossIntro').offsetWidth;$('bossIntro').classList.add('show');sfx('cue');setTimeout(()=>{$('bossIntro').classList.remove('show');done?.()},900);
  }
  function startStage(){renderStoryMap()}
  function startStoryStage(stageId){
    discoveredThisStage=[];
    if(S.party.length!==3){localeToast('battle.partyRequired');return;}syncPartyHp(true);
    activeGate=null;activeStageId=stageId;activeStageData=stageById[stageId];encounterMax=activeStageData.encounters.count;S.stage=masterStages.findIndex(x=>x.stage_id===stageId)+1;setDeviceClosed(false);show('battleScreen');encounter=1;carrySlots=3;S.hp=playerMaxHp();pendingItem=null;skillCharge=Object.fromEntries(S.party.map(id=>[id,0]));stageStats={perfect:0,guard:0,turn:0};startEncounter();
  }
  function startEncounter(){
    clearTimeout(toast._timer);$('uiToast').classList.remove('show');$('combatFeedback').classList.remove('show');document.querySelectorAll('.monsterDrop,.monsterAttackSpark').forEach(node=>node.remove());
    defenseToken++;attackReadyToken++;encounterSettled=false;patternBeat=null;defenseQueue=[];
    SHUTMikadoPresentation?.clear();enemies=generateEncounter(encounter);targetId=enemies[0].id;rewardGold=0;rewardDrops=[];rewardEntries=[];rewardMonsterExp=0;rewardExpChanges=[];opened=true;phase='attackReady';setMusicMode(activeGate==='BOSSRUSH'?'bossrush':enemies.some(e=>e.boss)?'boss':activeGate?activeGate.toLowerCase():'battle');updateBattleHeader();updateBossBar();renderEnemies();
    $('closedMenu').classList.remove('show');$('rewardOverlay').classList.remove('show');
    enemies.forEach(e=>{if(e.masterId)S.codex.enemies[e.masterId]=true});evaluateQuests();setBattleCopy(enemies.some(e=>e.boss)?'battle.bossBattle':'battle.encounter','battle.encounterHint',()=>({instruction:attackInstruction()}));
    $('app').style.setProperty('--world','url("'+new URL(MASTER_DATA.presentation.backgrounds[activeStageData.world_id],location.href).href+'")');
    updateBattleAction();const ready=()=>{const boss=enemies.find(e=>e.boss);if(boss)playBossEntrance(boss,beginAttack);else setTimeout(beginAttack,300)};
    if(!activeGate&&enemies.some(e=>e.boss))playEvents(activeStageId,'before_boss',ready);else ready();
  }

  // ---------- ATTACK ----------
  function beginAttack(){
    if(!$('battleScreen').classList.contains('show')||['idle','test','gameover','reward'].includes(phase))return;
    if(!living().length){finishEncounter();return}
    if(narrative.active)return;
    const token=++attackReadyToken;phase='attackReady';updateBattleAction();opened=true;$('timingBox').classList.remove('show');
    setBattleCopy('battle.ready','battle.readyHint');
    setTimeout(()=>{if(token!==attackReadyToken||phase!=='attackReady')return;setBattleCopy('battle.go','battle.startTimingHint');sfx('cue');
      setTimeout(()=>{if(token!==attackReadyToken||phase!=='attackReady')return;phase='attackArmed';updateBattleAction();$('timingBox').classList.add('show');$('cursor').style.left='0%';setBattleCopy('battle.attack','battle.startTimingHint');
        const hitWidth=Number(CFG.hit_attack_width),perfWidth=Number(CFG.perfect_attack_width);
        $('hitZone').style.left=`${50-hitWidth*50}%`;$('hitZone').style.width=`${hitWidth*100}%`;$('perfectZone').style.left=`${50-perfWidth*50}%`;$('perfectZone').style.width=`${perfWidth*100}%`;
      },240);
    },Number(CFG.attack_ready_seconds)*1000);
  }

  function startTimingBar(){
    if(phase!=='attackArmed')return;phase='attack';attackStart=performance.now();attackDuration=rnd(1120,1420);cancelAnimationFrame(meterRAF);updateBattleAction();setBattleCopy('battle.attack',isDesktop()?'battle.attackHintDesktop':'battle.attackHintTouch');
    function frame(now){if(phase!=='attack')return;const p=Math.min(1,(now-attackStart)/attackDuration);$('cursor').style.left=`${p*100}%`;if(p<1)meterRAF=requestAnimationFrame(frame);else{phase='transition';$('timingBox').classList.remove('show');feedback(t('battle.miss'),'miss');setBattleCopy('battle.miss','battle.missTurn');chargeSkills('MISS');setTimeout(endPlayerTurn,330)}}
    meterRAF=requestAnimationFrame(frame);
  }

  function chargeSkills(timing,excluded=new Set()){for(const m of partyMembers().filter(x=>x.hp>0&&!excluded.has(x.id)))skillCharge[m.id]=Math.min(SKILL_MAX,(skillCharge[m.id]||0)+SKILL_GAIN[timing]);drawPartyHud()}

  function executeAttack(){
    if(phase!=='attack')return;const p=clamp((performance.now()-attackStart)/attackDuration,0,1),hitW=Number(CFG.hit_attack_width),perfectW=Number(CFG.perfect_attack_width);const timing=Math.abs(p-.5)<=perfectW/2?'PERFECT':Math.abs(p-.5)<=hitW/2?'HIT':'MISS';
    $('timingBox').classList.remove('show');cancelAnimationFrame(meterRAF);phase='transition';updateBattleAction();const ultimateActors=new Set(partyMembers().filter(m=>m.hp>0&&(skillCharge[m.id]||0)>=SKILL_MAX).map(m=>m.id));const plan=Monsters.planAttack(partyMembers(),living(),timing,MASTER_DATA,{attackCount:stageStats.turn+1,perfectGuard:!!S.perfectGuardBoost});S.perfectGuardBoost=false;
    for(const hit of plan)if(ultimateActors.has(hit.actorId)&&hit.damage>0){const actor=partyMembers().find(m=>m.id===hit.actorId),special=Monsters.specialPlan(actor,partyMembers(),enemies.find(e=>e.id===hit.targetId));hit.damage=Math.max(1,Math.round(hit.damage*(special.damageMultiplier||ULTIMATE_MULTIPLIER)));hit.ultimate=true;hit.special=special;skillCharge[hit.actorId]=0}
    chargeSkills(timing,ultimateActors);
    if(timing==='PERFECT'){stageStats.perfect++;bumpQuest('perfect_attack_count',1);}const timingKey={PERFECT:'battle.perfect',HIT:'battle.hit',MISS:'battle.miss'}[timing];feedback(t(timingKey),timing==='PERFECT'?'perfect':timing==='HIT'?'hit':'miss');setBattleCopy(timingKey,timing==='MISS'?'battle.nextMoment':'battle.coordinatedAttack');sfx(timing==='MISS'?'hit':'slash');
    const totals={};for(const [i,hit]of plan.entries()){const e=enemies.find(e=>e.id===hit.targetId);if(hit.damage>0){damageMonsterTarget(e,hit);showMonsterAttack(hit,i);if(hit.ultimate){showUltimateMotion(hit,i);applySpecialEffect(hit,e);}totals[e.id]=(totals[e.id]||0)+hit.damage;}}
    for(const [id,total]of Object.entries(totals)){const e=enemies.find(e=>e.id===id);if(e.popup)e.popup.text='−'+total;}
    renderEnemies();if(!living().length)setTimeout(finishEncounter,700);else setTimeout(endPlayerTurn,350);
  }

  function endPlayerTurn(){
    for(const id of S.party){const m=S.monsters.find(x=>x.id===id);if(!m||m.hp<=0||!m.regen)continue;const max=Monsters.stats(m,MASTER_DATA).maxHp;m.hp=Math.min(max,m.hp+Math.max(1,Math.round(max*m.regen.rate)));if(--m.regen.turns<=0)delete m.regen;}
    for(const e of living()){if(!e.poison)continue;const damage=Math.max(1,Math.round(e.maxHp*e.poison.rate));damageMonsterTarget(e,{damage,attribute:1,timing:'HIT'});if(--e.poison.turns<=0)delete e.poison;}
    for(const m of S.monsters){if(m.status&&--m.status.turns<=0)delete m.status;}syncPartyHp();
    if(!living().length){finishEncounter();return}
    stageStats.turn++;
    if(activeStageData.stage_type==='survival'&&stageStats.turn>=activeStageData.survival_turns){enemies.forEach(e=>e.dead=true);finishEncounter();return;}
    if(activeStageData.stage_type==='forced_loss'&&stageStats.turn>=3){playEvents(activeStageId,'battle_turn3',()=>{S.hp=0;gameOver()});return;}
    living().forEach(e=>e.turnsLeft=Math.max(0,e.turnsLeft-1));
    renderEnemies();
    const ready=living().filter(e=>e.turnsLeft<=0);
    if(ready.length){
      phase='defense';defenseQueue=[...ready].sort((a,b)=>a.attackEvery-b.attackEvery);nextEnemyAttack();
    }else{
      phase='transition';
      const soon=Math.min(...living().map(e=>e.turnsLeft));
      setBattleCopy('battle.enemyWait','battle.enemyWaitTurns',{turns:soon});
      setTimeout(beginAttack,420);
    }
  }


  // ---------- DEFENSE ----------
  function beginDefenseSequence(){
    if(!living().length){finishEncounter();return}
    const ready=living().filter(e=>e.turnsLeft<=0);
    if(!ready.length){beginAttack();return}
    phase='defense';
    defenseQueue=[...ready].sort((a,b)=>a.attackEvery-b.attackEvery);
    nextEnemyAttack();
  }

  function playEnemyAttackMotion(e){const card=document.querySelector(`.enemyCard[data-id="${e.id}"]`);if(!card)return;card.classList.remove('enemyAttack');void card.offsetWidth;card.classList.add('enemyAttack');setTimeout(()=>card.classList.remove('enemyAttack'),760);if(e.boss){$('battleScreen').classList.remove('bossShake');void $('battleScreen').offsetWidth;$('battleScreen').classList.add('bossShake');setTimeout(()=>$('battleScreen').classList.remove('bossShake'),500);}}
  function nextEnemyAttack(){
    if(!defenseQueue.length){beginAttack();return;}
    const e=defenseQueue.shift();if(e.dead){nextEnemyAttack();return;}
    const def=MASTER_DATA.enemies.find(x=>x.enemy_id===e.masterId);const action=Systems.action(e,def,MASTER_DATA);
    if(action.heal&&(e.healCount||0)<2){e.hp=Math.min(e.maxHp,e.hp+Math.round(e.maxHp*action.heal));e.healCount=(e.healCount||0)+1;}
    if(action.barrier)e.barrier=action.barrier;
    if(action.shift)e.attr=attributes[(attributes.indexOf(e.attr)+1)%attributes.length];
    patternBeat={enemy:e,action,index:0};
    const start=()=>startDefenseBeat();
    if(e.pendingPhaseEvent&&!activeGate){const timing=e.pendingPhaseEvent;e.pendingPhaseEvent=null;playEvents(activeStageId,timing,start)}else start();
  }
  function startDefenseBeat(){
    if(!patternBeat)return;const {enemy:e,action,index}=patternBeat;
    if(e.dead){patternBeat=null;nextEnemyAttack();return;}
    phase='defense';opened=true;setDeviceClosed(false);defenseEnemyId=e.id;const token=++defenseToken;
    const windup=action.beats[index];defenseImpact=performance.now()+windup;
    $('dangerRing').style.setProperty('--ring-duration',Math.min(920,windup)+'ms');
    const actionName=action.nameKey?t(action.nameKey):action.name,actionHint=action.hintKey?t(action.hintKey):action.hint;
    currentBattleCopy=null;$('battleMessage').textContent=actionName;$('battleSub').textContent=actionHint+' · '+(index+1)+'/'+action.beats.length;
    renderEnemies();playEnemyAttackMotion(e);$('guardTargetRing').classList.add('show');$('guardTimeline').classList.add('show');updateBattleAction();
    const draw=()=>{if(token!==defenseToken||phase!=='defense')return;const p=clamp(1-(defenseImpact-performance.now())/windup,0,1);$('guardProgress').style.width=p*100+'%';requestAnimationFrame(draw)};requestAnimationFrame(draw);
    if(action.feint)setTimeout(()=>{if(token===defenseToken)feedback(t('battle.feintWait'),'miss')},action.feint);
    setTimeout(()=>{if(token!==defenseToken)return;$('dangerRing').classList.remove('charge');void $('dangerRing').offsetWidth;$('dangerRing').classList.add('charge')},Math.max(0,windup-920));
    setTimeout(()=>{if(token!==defenseToken)return;$('closeNow').classList.add('show');sfx('cue')},windup-80);
    setTimeout(()=>{if(token===defenseToken&&phase==='defense')resolveDefense(Number(CFG.bad_guard_ms)+10,false)},windup+Number(CFG.bad_guard_ms)+1);
  }
  function executeDefense(){if(phase==='defense')resolveDefense(performance.now()-defenseImpact,!openOnlyMode());}
  function resolveDefense(delta,playerClosed=true){
    const e=enemies.find(x=>x.id===defenseEnemyId);if(!e)return;phase='defenseResolved';defenseToken++;opened=!playerClosed;if(playerClosed){setDeviceClosed(true);sfx('door');}e.turnsLeft=e.attackEvery;resetDanger();
    const rate=Combat.guardRate(delta,CFG),perfect=Math.abs(delta)<=Number(CFG.perfect_guard_ms),a=patternBeat?.action,factor=a?a.factors[patternBeat.index]*a.damage:1,alive=partyMembers().filter(m=>m.hp>0),target=alive[(stageStats.guardHits||0)%alive.length],dmg=Combat.guardDamage(e.atk,factor,rate,e.attackDown?.multiplier||1);stageStats.guardHits=(stageStats.guardHits||0)+1;
    if(target){const owned=S.monsters.find(m=>m.id===target.id);owned.hp=Math.max(0,target.hp-dmg);skillCharge[target.id]=Math.min(SKILL_MAX,(skillCharge[target.id]||0)+Number(SKILL_GAIN.damaged||8));if(dmg)allyFrames[target.id]={state:owned.hp?'hit':'death',start:performance.now(),until:performance.now()+600};const effect=MASTER_DATA.enemies.find(d=>d.enemy_id===e.masterId)?.onHitStatus;if(dmg>0&&effect)owned.status=structuredClone(effect);}syncPartyHp();const labelKey=perfect?'battle.perfectGuard':rate<=.3?'battle.goodGuard':rate<1?'battle.guard':'battle.miss';if(perfect){stageStats.guard++;bumpQuest('perfect_guard_count',1);S.perfectGuardBoost=true;sfx('guard');}
    SHUTDevice.guard(labelKey,dmg);feedback(t(labelKey),perfect?'guard':'hit');setBattleCopy(labelKey,'battle.damage',{name:target?.name||'',damage:dmg});updateBattleHeader();renderEnemies();if(S.hp<=0){setTimeout(gameOver,250);return;}
    const more=patternBeat&&++patternBeat.index<patternBeat.action.beats.length;if(!more){patternBeat=null;if(e.attackDown&&--e.attackDown.turns<=0)delete e.attackDown;}if(playerClosed)setTimeout(()=>openClosedMenu(more?'combo':'defenseContinue'),200);else setTimeout(()=>{if(more)startDefenseBeat();else if(defenseQueue.length)nextEnemyAttack();else beginAttack();},650);
  }

  function resetDanger(){
    $('guardTimeline').classList.remove('show');
    $('dangerRing').classList.remove('charge');
    $('guardTargetRing').classList.remove('show');
    $('closeNow').classList.remove('show');
    document.querySelectorAll('.enemyCard').forEach(x=>x.classList.remove('attacking'));
  }
  function openClosedMenu(reason){
    closedReason=reason;
    phase='closed';
    opened=false;
    pendingItem=null;
    defenseToken++; // invalidate any stale defense timers
    setDeviceClosed(true);
    resetDanger();
    updateItemMenu();
    $('closedMenu').classList.add('show');
    sfx('door');
  }

  function updateItemMenu(){
    $('cntHeal').textContent=`×${S.items.heal}`;$('cntHigh').textContent=`×${S.items.high}`;$('cntElixir').textContent=`×${S.items.elixir}`;
    document.querySelectorAll('.itemBtn').forEach(b=>{const k=b.dataset.item;b.disabled=S.items[k]<=0||carrySlots<=0;b.classList.toggle('selected',pendingItem===k)});
    const itemName=key=>t({heal:'battle.heal',high:'battle.highHeal',elixir:'battle.elixir'}[key]);
    $('selectedItemText').textContent=pendingItem?t('battle.selectedItem',{item:itemName(pendingItem)}):t('battle.noItemSelected',{slots:carrySlots});
  }
  async function openFromClosed(){
    if(phase!=='closed'||SHUTDevice.busy)return;
    opened=true;phase='transition';$('closedMenu').classList.remove('show');sfx('door');await setDeviceClosed(false);
    if(pendingItem){
      const it=itemDefs[pendingItem],itemName=t({heal:'battle.heal',high:'battle.highHeal',elixir:'battle.elixir'}[pendingItem]);S.items[pendingItem]--;carrySlots--;if(S.run)S.run.slots=carrySlots;healParty(it.heal);setBattleCopy('battle.itemUsed','battle.hpRecovered',{item:itemName,percent:Math.round(it.heal*100)});pendingItem=null;updateBattleHeader();
    }
    phase='transition';
    setTimeout(()=>{ if(closedReason==='combo'){startDefenseBeat();return;} if(closedReason==='defenseContinue' && defenseQueue.length) {phase='defense';nextEnemyAttack()} else beginAttack(); },200);
  }


  // ---------- REWARDS ----------
  function grantEnemyRewards(e){
    const chapter=MASTER_DATA.chapterProgression?.find(x=>x.chapter===Number(activeStageData?.chapter))||{goldMultiplier:1},g=Math.round(e.gold*stageMult()*Number(chapter.goldMultiplier||1));rewardGold+=g;rewardMonsterExp+=Monsters.battleExp(e,activeStageData,MASTER_DATA);addRankXp(Math.round(e.rankXp*(1+(Number(activeStageData?.difficulty||1)-1)*.08)));if(e.boss){const def=enemyById[e.masterId];if(def?.category==='midboss')bumpQuest('midboss_kill_count',1);else bumpQuest('boss_kill_count',1);}
    // item drops
    let r=Math.random(),drop=null;for(const entry of MASTER_DATA.monsterRules.itemDrops){r-=entry.chance;if(r<0){drop=entry.key;break;}}
    if(drop && S.items[drop]<itemDefs[drop].max){S.items[drop]++;rewardDrops.push(itemDefs[drop].name);rewardEntries.push({kind:'item',label:itemDefs[drop].name})}
    const monster=MASTER_DATA.monsters.find(m=>m.acquisition.enemyId===e.masterId);
    const egg=monster&&(monster.acquisition.guaranteedEgg===true||Math.random()<monster.acquisition.eggRate),monsterName=monster?localizedDataName(monster):'';
    if(egg){const wasOwned=S.monsters.some(x=>x.monsterId===monster.monster_id),instance=Monsters.create(monster.monster_id,crypto.randomUUID(),MASTER_DATA);S.monsters.push(instance);S.codex.monsters=S.codex.monsters||{};S.codex.monsters[monster.monster_id]=true;const label=t('battle.eggDrop',{name:monsterName});rewardDrops.push(label);rewardEntries.push({kind:'egg',label,rarity:monster.rarity,monsterId:monster.monster_id,isNew:!wasOwned});saveGame();}
    const keyRule=MASTER_DATA.monsterRules.keyDrop,keyFound=keyRule.gates.includes(activeGate)&&Math.random()<keyRule.chance;if(keyFound){addWallet('gateKeys',keyRule.amount,'battle key drop');const label=t('battle.keysDrop',{amount:keyRule.amount});rewardDrops.push(label);rewardEntries.push({kind:'key',label});}
    showMonsterDrop(e,[{label:g+' G',kind:'gold'},...(drop?[{label:itemDefs[drop].name,kind:'item'}]:[]),...(egg?[{label:t('battle.eggDrop',{name:monsterName}),kind:monster.rarity>=4?'rare':'egg'}]:[]),...(keyFound?[{label:t('battle.keysDrop',{amount:keyRule.amount}),kind:'key'}]:[])]);
  }
  function showMonsterDrop(enemy,drops){
    const card=document.querySelector(`.enemyCard[data-id="${enemy.id}"]`),area=$('battleScreen'),a=area.getBoundingClientRect(),r=card?.getBoundingClientRect();if(!r)return;
    drops.forEach((drop,i)=>{const node=document.createElement('div'),iconKind=drop.kind==='rare'||drop.kind==='egg'?'egg':drop.kind;node.className='monsterDrop '+drop.kind;node.innerHTML=`${rewardIcon(iconKind,drop.kind==='rare'?4:1,'dropIcon')}<span>${drop.label}</span>`;node.style.left=(r.left+r.width/2-a.left+(i-(drops.length-1)/2)*30)+'px';node.style.top=(r.top+r.height*.6-a.top-i*17)+'px';node.style.animationDelay=(160+i*55)+'ms';node.dataset.enemy=enemy.id;area.append(node);setTimeout(()=>sfx(drop.kind),200+i*55);setTimeout(()=>node.remove(),1200);});
  }
  function grantStageRewards(rewards){for(const r of rewards||[])addGift(activeStageData.name,r.type,r.amount,'',r.monsterId);}
  function renderRewardPresentation(title,subtitle,buttonLabel,extra=''){
    $('rewardTitle').textContent=title;const entries=[{kind:'gold',label:`+${rewardGold} G`},...rewardEntries],eggs=entries.filter(x=>x.kind==='egg');
    const expHtml=rewardExpChanges.length?`<div class="resultMonsterExp">${rewardExpChanges.map(change=>{const m=S.monsters.find(x=>x.id===change.id),s=m&&Monsters.stats(m,MASTER_DATA),pct=change.next?Math.round(change.afterXp/change.next*100):100;return `<div><b>${s?.name||change.id} ${t('battle.monsterExp',{exp:change.amount})}</b><span>Lv.${change.beforeLevel} → Lv.${change.afterLevel}</span><i><em style="width:${pct}%"></em></i>${change.levelUp?`<strong>${t('battle.levelUp',{name:s?.name||change.id,level:change.afterLevel})}</strong>`:''}</div>`}).join('')}</div>`:'';
    $('rewardBody').innerHTML=`<div class="resultVictory">${t('battle.victory')}</div><div class="rewardLine">${subtitle}</div><div class="resultLoot">${entries.map((x,i)=>x.kind==='egg'?`<div class="resultDrop eggReward rarity-${x.rarity}" style="--i:${i}" data-hatch="${x.monsterId}"><div class="rarityEgg" data-rarity="★${x.rarity}">${rewardIcon('egg',x.rarity,'eggIcon')}</div><b>${stars(x.rarity)}</b><span>${x.label}</span><canvas width="96" height="96"></canvas><em>${t(x.isNew?'battle.newMonster':'battle.monsterJoined')}</em></div>`:`<div class="resultDrop ${x.kind}" style="--i:${i}">${x.kind==='gold'?'<b>G</b>':rewardIcon(x.kind,1,'resultIcon')}<span>${x.label}</span></div>`).join('')}</div>${expHtml}${extra}`;
    $('rewardNext').textContent=buttonLabel;$('rewardNext').disabled=true;$('rewardOverlay').classList.add('show');
    document.querySelectorAll('[data-hatch]').forEach(node=>{const def=Monsters.definition(node.dataset.hatch,MASTER_DATA),sprite=MASTER_DATA.sprites[def.sprite],canvas=node.querySelector('canvas');SHUTArt.image(sprite.source,img=>SHUTArt.drawCell(canvas,img,{...sprite,cell:sprite.states.idle?.[0]??sprite.cell},.08))});
    setTimeout(()=>{$('rewardNext').disabled=false;if(eggs.length)sfx('gacha')},eggs.length?1900:850);
  }
  function finishEncounter(){
    if(encounterSettled)return;encounterSettled=true;attackReadyToken++;defenseToken++;stageStats.clear=true;
    const expResult=Monsters.grantBattleExp(S,[...S.party],rewardMonsterExp,MASTER_DATA);S=expResult.state;rewardExpChanges=expResult.changes;
    if(activeGate){finishExpeditionBattle();return;}
    healParty(MASTER_DATA.balance.storyRestRate);
    phase='reward';resetDanger();$('timingBox').classList.remove('show');addWallet('gold',rewardGold,'story battle reward');setMusicMode('victory');sfx('win');updateHome();updateBattleHeader();$('bossHpBox').classList.remove('show');
    if(encounter===encounterMax){
      const first=!S.stageClears[activeStageId];S.stageClears[activeStageId]=true;if(first){grantStageRewards(activeStageData.first_clear_rewards);S.questProgress[`stage_clear:${activeStageId}`]=1;}
      const idx=masterStages.findIndex(x=>x.stage_id===activeStageId);if(idx>=S.storyIndex)S.storyIndex=Math.min(masterStages.length,idx+1);grantStageRewards(activeStageData.repeat_rewards);processStageUnlocks(activeStageId);unlockJourneyGates();settleMissions();rollSpecialGate();refreshShopStock();
      if(activeStageData.stage_type==='boss'){const wid=activeStageData.world_id;S.questProgress[`chapter_clear:${wid}`]=1;}
      evaluateQuests();saveGame();const extra=(first?`<p class="resultNote">${t('battle.firstClearReward')}</p>`:'')+(discoveredThisStage.length?`<div class="gateDiscovery"><span class="eyebrow">${t('battle.newPath')}</span><h3>${t('battle.unknownGate')}</h3><p>${discoveredThisStage.map(k=>MASTER_DATA.expeditions[k].name).join(' / ')}</p><span class="small">${t('battle.challengeFromGate')}</span></div>`:'')+`<p class="small">${t('battle.restoredHp',{percent:Math.round(MASTER_DATA.balance.storyRestRate*100)})}</p>`;renderRewardPresentation(t('battle.stageClear'),`${activeStageData.stage_id} ${localizedDataName(activeStageData)}`,t('battle.returnBase'),extra);
    }else{renderRewardPresentation(t('battle.battleClear'),t('battle.rewardObtained'),t('battle.nextBattle'),`<p class="small">${t('battle.restoredHp',{percent:Math.round(MASTER_DATA.balance.storyRestRate*100)})}</p>`)}
    updateHome();
  }
  function gameOver(){
    $('closedMenu').classList.remove('show');
    attackReadyToken++;defenseToken++;patternBeat=null;
    if(activeGate){S.run=null;saveGame();}
    if(activeStageData&&activeStageData.stage_type==='forced_loss'){
      phase='reward';resetDanger();const first=!S.stageClears[activeStageId];S.stageClears[activeStageId]=true;if(first){grantStageRewards(activeStageData.first_clear_rewards);S.questProgress[`stage_clear:${activeStageId}`]=1;}const idx=masterStages.findIndex(x=>x.stage_id===activeStageId);if(idx>=S.storyIndex)S.storyIndex=idx+1;processStageUnlocks(activeStageId);evaluateQuests();saveGame();openModal('STORY CONTINUES',`<div style="text-align:center"><h3>届かなかった一撃</h3><p class="storySummary">攻撃は届かなかった。しかし物語はここで終わらない。</p><p class="small">ミナがあなたの手を握った。もう一度、歩き出そう。</p><button id="forcedContinue" class="btn gold">ホームへ</button></div>`);setTimeout(()=>{$('forcedContinue').onclick=()=>{$('modal').classList.remove('show');S.hp=S.maxHp;playEvents(activeStageId,'battle_turn3',enterOpenMenu)}},0);return;
    }
    phase='gameover';resetDanger();openModal(t('battle.defeat'),`<div style="text-align:center"><h3>${activeStageData?activeStageData.stage_id:'Stage'} / Battle ${encounter}</h3><p class="small">${t('battle.rewardsKept')}</p><button id="returnHome" class="btn">${t('battle.returnHome')}</button></div>`);setTimeout(()=>{$('returnHome').onclick=()=>{$('modal').classList.remove('show');S.hp=S.maxHp;enterOpenMenu()}},0)
  }

  // ---------- EVENTS ----------
  const tutorialPages=[
    {t:'tutorial.welcomeTitle',b:'tutorial.welcomeBody'},
    {t:'tutorial.attackTitle',b:'tutorial.attackBody'},
    {t:'tutorial.guardTitle',b:'tutorial.guardBody'},
    {t:'tutorial.teamTitle',b:'tutorial.teamBody'},
    {t:'tutorial.gachaTitle',b:'tutorial.gachaBody'}
  ];
  let tutorialIndex=0,practiceDone=false;
  function showTutorial(){practiceDone=false;$('tutorialSkip').hidden=false;$('tutorialNext').onclick=()=>{if(tutorialIndex<tutorialPages.length-1){tutorialIndex++;renderTutorial()}else finishTutorial()};setDeviceClosed(false);show('homeScreen');tutorialIndex=0;$('tutorialOverlay').classList.add('show');renderTutorial();}
  function renderTutorial(){const p=tutorialPages[tutorialIndex];$('tutorialStep').textContent=t('tutorial.step',{current:tutorialIndex+1,total:tutorialPages.length});$('tutorialTitle').textContent=t(p.t);$('tutorialBody').innerHTML=t(p.b);$('tutorialNext').textContent=t(tutorialIndex===tutorialPages.length-1?'tutorial.start':'tutorial.next');}
  async function finishTutorial(){
 if(!S.tutorialDone&&!practiceDone){practiceDone=true;$('tutorialTitle').textContent=t('tutorial.practiceTitle');$('tutorialBody').innerHTML='<span id="practiceCopy">'+t('tutorial.practiceBody')+'</span><div id="practiceLight" style="height:12px;background:#ead391;width:0;transition:width 1.1s linear;margin:20px 0"></div>';$('tutorialSkip').hidden=true;$('tutorialNext').textContent=t('tutorial.practiceAction');setTimeout(()=>$('practiceLight').style.width='100%',100);const practiceImpact=performance.now()+1200;let practiced=false;const hit=async()=>{if(practiced)return;practiced=true;removeEventListener('keydown',key);$('tutorialOverlay').classList.remove('show');const delta=performance.now()-practiceImpact,practiceRate=Combat.guardRate(delta,CFG),guardKey=Math.abs(delta)<=Number(CFG.perfect_guard_ms)?'tutorial.perfectGuard':practiceRate<1?'tutorial.guard':'tutorial.tryAgain';SHUTDevice.guard(guardKey,Combat.guardDamage(10,1,practiceRate));$('app').dataset.screen='battleScreen';await setDeviceClosed(true);$('closedMenu').classList.add('show');$('unfoldBattle').dataset.i18n='tutorial.openJourney';$('unfoldBattle').textContent=t('tutorial.openJourney');const original=$('unfoldBattle').onclick;const next=async()=>{$('closedMenu').classList.remove('show');await setDeviceClosed(false);$('unfoldBattle').onclick=original;$('unfoldBattle').dataset.i18n='battle.openNext';$('unfoldBattle').textContent=t('tutorial.openNext');finishTutorial();};$('unfoldBattle').onclick=next;};const key=e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();hit()}};addEventListener('keydown',key);$('tutorialNext').onclick=hit;return;}
 const firstCompletion=!S.tutorialDone;S.tutorialDone=true;S.questProgress.tutorial_complete=1;S.questProgress.account_first_start=1;addPartner('P028','story');if(firstCompletion){const initialGift=Number(MASTER_DATA.monsterGacha.initialGift||0);if(Number.isSafeInteger(initialGift)&&initialGift>0)addGift(t('tutorial.gachaTitle'),'gate_key',initialGift);}evaluateQuests();saveGame();$('tutorialOverlay').classList.remove('show');enterOpenMenu();}
  function startGameFlow(forceNew=false){
    try{initAudio();if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume()}catch(err){}
    const has=!!localStorage.getItem(SAVE_KEY);
    if(forceNew){clearSave();S={rank:1,rankXp:0,rankNeed:100,gold:0,gateKeys:0,stage:1,hp:100,maxHp:100,items:{heal:1,high:0,elixir:0,expSmall:0,expMedium:0,expLarge:0,retry:0,chip:0,bossFrag:0},inventory:[],equipped:null,materials:{bossCore:0},codex:{enemies:{},weapons:{},partners:{}},partners:{},equippedPartner:null,captureUnlocked:false,storyIndex:0,stageClears:{},readEvents:{},normalTickets:0,gifts:[],questProgress:{},questDelivered:{},gateUnlocked:{EXP:false,GOLD:false,HIDDEN:false,BOSSRUSH:false,TOWER:false,ENDLESS:false},gateAttempts:{EXP:0,GOLD:0,HIDDEN:0},shopStock:null,shopCycle:0,tutorialDone:false,freeDone:false};normalizeState();showTutorial();return;}
    if(has){loadGame();updateHome();if(!S.tutorialDone){showTutorial();return;}enterOpenMenu();return;}
    showTutorial();
  }
  $('startBtn').onclick=(e)=>{e.stopPropagation();startGameFlow(false)};
  $('tutorialNext').onclick=()=>{if(tutorialIndex<tutorialPages.length-1){tutorialIndex++;renderTutorial()}else finishTutorial()};
  $('tutorialSkip').onclick=finishTutorial;
  $('newGameBtn').onclick=(e)=>{e.stopPropagation();if(confirm(t('save.newGameConfirm')))startGameFlow(true)};
  $('weaponRevealContinue').onclick=()=>{
    $('weaponRevealOverlay').classList.remove('show');

    if(routeAfterGacha==='open'){
      $('gachaText').textContent=t('gacha.firstCompanionReady');
      setTimeout(()=>enterOpenMenu(),250);
      return;
    }

    closeTenPullResults();enterOpenMenu();
  };
  bindTouchSafeButton('singlePullBtn',()=>runGachaSequence(1));
  bindTouchSafeButton('tenPullBtn',()=>runGachaSequence(10));
  bindTouchSafeButton('goldGachaMode',()=>{if(!gachaBusy&&gachaStep===0){gachaMode='gold';updateGachaTop()}});
  bindTouchSafeButton('keyGachaMode',()=>{if(!gachaBusy&&gachaStep===0){gachaMode='key';updateGachaTop()}});
  bindTouchSafeButton('gachaHomeBtn',()=>{
    if(gachaStep===2){revealGachaResults();return;}
    if(routeAfterGacha==='open') enterOpenMenu();
    else enterCloseMenu();
  });
  bindTouchSafeButton('gachaBtn',()=>enterGacha('hub'));
  bindTouchSafeButton('closeGachaBtn',()=>enterGacha('hub'));
  $('equipBtn').onclick=renderEquipment;
  $('synthesisBtn').onclick=renderSynthesis;
  $('shopBtn').onclick=()=>renderShop('weapon');
  $('partnerBtn').onclick=renderPartner;
  $('questBtn').onclick=renderQuests;
  $('giftBtn').onclick=renderGiftBox;
  $('gateBtn').onclick=renderGates;
  $('collectionBtn').onclick=renderCollection;
  $('battleBtn').onclick=renderStoryMap;
  $('modalClose').onclick=()=>{$('modal').classList.remove('show');setMusicMode(lastBaseMusicMode||'open')};
  $('rewardNext').onclick=()=>{
    $('rewardOverlay').classList.remove('show');
    if(activeGate){if(gateFinished){S.run=null;activeGate=null;saveGame();enterOpenMenu()}else{encounter++;S.run.floor=encounter;saveGame();startEncounter()}return;}
    if(encounter===encounterMax){S.hp=S.maxHp;saveGame();playEvents(activeStageId,'after_clear',enterOpenMenu)}
    else{const timing='after_battle'+encounter;playEvents(activeStageId,timing,()=>{encounter++;startEncounter()})}
  };
  document.querySelectorAll('.itemBtn').forEach(b=>b.onclick=()=>{if(b.disabled)return;pendingItem=pendingItem===b.dataset.item?null:b.dataset.item;updateItemMenu()});

  // Keyboard/click = physical fold action during battle; in gacha, buttons advance sequence.
  window.addEventListener('keydown',e=>{
    if(narrative.active){if(['Space','Enter'].includes(e.code)){e.preventDefault();narrative.next()}return;}
    if(e.repeat||SHUTDevice.busy||$('modal').classList.contains('show')||$('tutorialOverlay').classList.contains('show'))return;
    if(!(e.code==='Space'||e.code==='Enter'||e.code==='NumpadEnter'))return; e.preventDefault();
    if($('startScreen').classList.contains('show')){ startGameFlow(false); }
    else if($('battleScreen').classList.contains('show')){
      if(phase==='attackArmed')startTimingBar();
      else if(phase==='attack')executeAttack(targetId);
      else if(phase==='defense')executeDefense();
      else if(phase==='closed'&&e.code!=='Space')openFromClosed();
    }else if($('homeScreen').classList.contains('show')){
      enterCloseMenu();
    }else if($('closeMenuScreen').classList.contains('show')){
      enterOpenMenu();
    }else if($('gachaScreen').classList.contains('show')&&gachaStep===2){
      revealGachaResults();
    }
  });
  $('startScreen').addEventListener('pointerdown',e=>{
    if(e.target.closest('button')) return;
    if(e.target.closest('.startCard')) startGameFlow(false);
  });
  $('battleScreen').addEventListener('pointerdown',e=>{
    if(e.target.closest('button')||e.target.closest('.enemyCard'))return;
    if(phase==='attackArmed')startTimingBar();
    else if(phase==='attack')executeAttack(targetId);
    else if(phase==='defense')executeDefense();
    else if(phase==='closed')openFromClosed();
  });

  let stageStats={perfect:0,guard:0,turn:0},patternBeat=null,encounterSettled=false,gateFinished=false;
  function playerMaxHp(){return partyMembers().reduce((n,m)=>n+m.maxHp,0);}
  let feedbackTimer;
  function feedback(text,kind){clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('combatFeedback').classList.remove('show'),720);const el=$('combatFeedback');el.style.animationDuration=650+'ms';el.textContent=text;el.dataset.kind=kind;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');if(kind==='perfect'){sfx('cue');tone(1568,.15,'triangle',.045,sfxGain,.09)}if(kind==='miss')sfx('hit');}
  const narrative=globalThis.SHUTNarrative({data:MASTER_DATA,read:id=>!!S.readEvents[id],mark:id=>{S.readEvents[id]=true;saveGame()},apply:event=>{
    if(S.eventFlags[event.event_id])return;S.eventFlags[event.event_id]=true;
    
    const join=/^(P\d+)_join/.exec(event.result||'');if(join)addPartner(join[1],'contract');
    saveGame();
  },onChange:active=>{SHUTDevice.dialogue(active);if(active){setMusicMode('story');attackReadyToken++;defenseToken++;phase='dialogue';$('timingBox').classList.remove('show');resetDanger();}else if(phase==='dialogue'){setMusicMode(lastBaseMusicMode);phase=$('battleScreen').classList.contains('show')?'transition':'idle';}updateBattleAction()}});
  function playEvents(stageId,timing,done){const events=MASTER_DATA.story_events.filter(e=>e.stage_id===stageId&&e.timing===timing&&!S.readEvents[e.event_id]);if(events.length)narrative.play(events,done);else done();}
  function unlockJourneyGates(){
    for(const [kind,cfg]of Object.entries(MASTER_DATA.expeditions)){if(!S.stageClears[cfg.unlock]||S.gateUnlocked[kind])continue;S.gateUnlocked[kind]=true;discoveredThisStage.push(kind);if(cfg.limited)S.gateAttempts[kind]=Number(MASTER_DATA.gates.find(g=>g.gate_id==='GATE_'+kind)?.attempts||1);S.questProgress['gate_discover:'+kind]=1;localeToast('battle.gateFound',{name:cfg.name},3600)}
  }
  function settleMissions(){
    const st=activeStageData;if(!st.missions)return;const saved=S.stageMissions[st.stage_id]||{};
    st.missions.forEach(m=>{if(saved[m.key]||!stageStats[m.key])return;saved[m.key]=true;addGift(st.name+' · '+m.name,'gold',m.reward)});S.stageMissions[st.stage_id]=saved;
  }
  function finishExpeditionBattle(){
    const cfg=MASTER_DATA.expeditions[activeGate];phase='reward';resetDanger();$('timingBox').classList.remove('show');addWallet('gold',rewardGold,'gate battle reward');gateFinished=activeGate!=='ENDLESS'&&encounter>=encounterMax;
    if(activeGate==='TOWER')S.records.tower=Math.max(S.records.tower,encounter);if(activeGate==='ENDLESS'){S.records.endless=Math.max(S.records.endless,encounter);addWallet('gold',Number(cfg.reward.gold||0),'endless reward');}
    if(gateFinished){const r=cfg.reward;addWallet('gold',Number(r.gold||0),'gate clear reward');S.materials.bossCore+=r.core||0;addWallet('gateKeys',Number(r.gateKeys||0),'gate clear keys');if(r.rankXp)addRankXp(r.rankXp);if(r.items)for(const [key,amount]of Object.entries(r.items))S.items[key]=Math.max(0,Number(S.items[key]||0)+Number(amount||0));if(r.monsters)for(const m of r.monsters)for(let i=0;i<m.amount;i++)S.monsters.push(Monsters.create(m.monsterId,crypto.randomUUID(),MASTER_DATA));bumpQuest('gate_clear:'+activeGate,1);if(activeGate==='BOSSRUSH'){bumpQuest('boss_rush_clear',1);bumpQuest('boss_rematch_win',1);}S.run=null;}
    else if(S.run)S.run.floor=encounter+1;
    const title=gateFinished?t('battle.gateClear'):activeGate==='TOWER'?t('battle.floorClear',{floor:encounter}):t('battle.gateFloorClear',{floor:encounter}),extra=`<p class="resultNote">${gateFinished?t('battle.expeditionReward'):t('battle.rewardObtained')}</p>${gateFinished?'':`<button id="extractGate" class="btn secondary">${t('battle.extract')}</button>`}`;
    renderRewardPresentation(title,cfg.name,gateFinished?t('battle.returnBase'):t('battle.deeper'),extra);if($('extractGate'))$('extractGate').onclick=()=>{S.run=null;activeGate=null;saveGame();$('rewardOverlay').classList.remove('show');enterOpenMenu()};saveGame();updateBattleHeader();
  }
  function updateBattleAction(){
    $('app').dataset.phase=phase;
    $('app').classList.toggle('open-only',openOnlyMode());
    const b=$('battleAction');if(!b)return;const labels={attack:'battle.actionStop',attackArmed:'battle.actionStart',attackReady:'battle.actionReady',defense:openOnlyMode()?'battle.actionGuardButton':'battle.actionDefense',closed:'battle.actionClosed',transition:'battle.actionTransition',dialogue:'battle.actionDialogue',reward:'battle.actionReward'};b.textContent=t(labels[phase]||'battle.actionDefault');b.disabled=!['attackArmed','attack','defense','closed'].includes(phase)||narrative?.active;
    drawPartyHud();
    $('encounterTrack').innerHTML=Array.from({length:Math.min(encounterMax,10)},(_,i)=>'<i class="'+(i<encounter?'done':'')+'"></i>').join('');
  }
  $('battleAction').onclick=()=>{if(phase==='attackArmed')startTimingBar();else if(phase==='attack')executeAttack();else if(phase==='defense')executeDefense();else if(phase==='closed')openFromClosed()};
  $('unfoldBattle').onclick=openFromClosed;$('foldHome').onclick=enterCloseMenu;$('unfoldHome').onclick=enterOpenMenu;
  $('nextJourney').onclick=()=>{if(S.run)runGateExpedition(S.run.kind,true);else if(currentStoryStage())showStoryEventAndStart(currentStoryStage().stage_id);else renderGates()};
  $('retreatBtn').onclick=()=>{if(!confirm(t('battle.retreatConfirm')))return;attackReadyToken++;defenseToken++;phase='idle';encounterSettled=true;patternBeat=null;S.run=null;activeGate=null;saveGame();$('rewardOverlay').classList.remove('show');$('closedMenu').classList.remove('show');enterOpenMenu()};
  function applyAudioSettings(){const value=(key,fallback)=>Number.isFinite(S.settings[key])?clamp(S.settings[key],0,1):fallback;if(master)master.gain.value=S.settings.sound?value('masterVolume',.56):0;if(musicGain)musicGain.gain.value=value('bgmVolume',.24);if(sfxGain)sfxGain.gain.value=value('seVolume',.5);}
  let settingsOriginalLanguage=null;
  function updateLocalizedUi(){
    I18n.apply(document);
    $('startBtn').textContent=hadSave?t('title.continue'):t('title.newGame');
    $('newGameBtn').textContent=t('title.newGame');
    document.querySelectorAll('[data-title-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.titleLanguage===I18n.language)));
    const st=currentStoryStage();
    $('homeKeys').textContent=t('currency.keys',{count:S.gateKeys});
    $('nextJourney').textContent=S.run?t('menu.resumeExpedition'):st?t('menu.continueJourney'):t('menu.memoryGate');
    const labels={battleBtn:['menu.story','menu.storyDesc'],equipBtn:['menu.monsters','menu.monstersDesc'],synthesisBtn:['menu.synthesis','menu.synthesisDesc'],shopBtn:['menu.shop','menu.shopDesc'],partnerBtn:['menu.partner','menu.partnerDesc'],questBtn:['menu.quests','menu.questsDesc'],giftBtn:['menu.presents','menu.presentsDesc'],gateBtn:['menu.gates','menu.gatesDesc'],collectionBtn:['menu.library','menu.libraryDesc']};
    Object.entries(labels).forEach(([id,[name,desc]])=>{$(id).querySelector('strong').textContent=t(name);$(id).querySelector('small').textContent=t(desc)});
    $('soundToggle').textContent=t('settings.button');$('soundToggle').setAttribute('aria-label',t('settings.buttonAria'));
    if($('uiToast')._localeCopy){const copy=$('uiToast')._localeCopy;$('uiToast').textContent=t(copy.key,copy.values)}
    if($('closeMenuScreen').classList.contains('show'))updateCloseMenu();
    if($('gachaScreen').classList.contains('show'))refreshGachaCopy();
    if($('tutorialOverlay').classList.contains('show')){if(practiceDone){$('tutorialTitle').textContent=t('tutorial.practiceTitle');if($('practiceCopy'))$('practiceCopy').textContent=t('tutorial.practiceBody');$('tutorialNext').textContent=t('tutorial.practiceAction')}else renderTutorial()}
    if($('battleScreen').classList.contains('show')){updateBattleHeader();updateBossBar();renderEnemies();updateBattleAction();refreshBattleCopy();if($('closedMenu').classList.contains('show'))updateItemMenu()}
    SHUTDevice.refreshLocale?.();
  }
  function renderSettings(){
    const rows=[['masterVolume','settings.master',.56],['bgmVolume','settings.bgm',.24],['seVolume','settings.se',.5]];
    const languageButtons=I18n.supported.map(language=>`<button class="btn ${I18n.language===language?'gold':''}" data-language="${language}" aria-pressed="${I18n.language===language}">${t(language==='ja'?'settings.japanese':'settings.english')}</button>`).join('');
    openModal(t('settings.title'),`<div class="settingsSection"><b>${t('settings.language')}</b><div class="settingsChoices">${languageButtons}</div></div><div class="settingsSection"><b>${t('settings.playStyle')}</b><p class="small">${t('settings.playStyleHelp')}</p><div class="settingsChoices"><button id="duoMode" class="btn ${!openOnlyMode()?'gold':''}" aria-pressed="${!openOnlyMode()}">${t('settings.duoMode')}</button><button id="openOnlyMode" class="btn ${openOnlyMode()?'gold':''}" aria-pressed="${openOnlyMode()}">${t('settings.openOnly')}</button></div></div><div class="settingsSection"><b>${t('settings.audio')}</b>${rows.map(([key,label,defaultValue])=>`<label class="audioSlider">${t(label)}<input type="range" min="0" max="100" value="${Math.round((S.settings[key]??defaultValue)*100)}" data-volume="${key}"><output>${Math.round((S.settings[key]??defaultValue)*100)}</output></label>`).join('')}<button id="muteSound" class="btn">${t(S.settings.sound?'settings.mute':'settings.unmute')}</button></div><div class="settingsActions"><button id="confirmSettings" class="btn gold">${t('common.confirm')}</button><button id="cancelSettings" class="btn secondary">${t('common.cancel')}</button></div>`);
    document.querySelectorAll('[data-language]').forEach(button=>button.onclick=()=>{I18n.setLanguage(button.dataset.language);updateLocalizedUi();renderSettings()});
    document.querySelectorAll('[data-volume]').forEach(input=>input.oninput=()=>{S.settings[input.dataset.volume]=Number(input.value)/100;input.nextElementSibling.textContent=input.value;applyAudioSettings();saveGame()});
    $('duoMode').onclick=()=>{S.settings.openOnly=false;saveGame();renderSettings()};$('openOnlyMode').onclick=()=>{S.settings.openOnly=true;saveGame();renderSettings()};
    $('muteSound').onclick=()=>{S.settings.sound=!S.settings.sound;applyAudioSettings();saveGame();renderSettings()};
    $('confirmSettings').onclick=()=>{settingsOriginalLanguage=null;$('modal').classList.remove('show')};
    $('cancelSettings').onclick=()=>{if(settingsOriginalLanguage)I18n.setLanguage(settingsOriginalLanguage);settingsOriginalLanguage=null;updateLocalizedUi();$('modal').classList.remove('show')};
  }
  function showSettings(){settingsOriginalLanguage=I18n.language;renderSettings()}
  $('soundToggle').onclick=showSettings;
  $('titleSettingsBtn').onclick=(event)=>{event.stopPropagation();showSettings()};
  document.querySelectorAll('[data-title-language]').forEach(button=>button.onclick=event=>{event.stopPropagation();I18n.setLanguage(button.dataset.titleLanguage);updateLocalizedUi()});
  setInterval(updateBattleAction,100);

  function partyMembers(){return S.party.map(id=>S.monsters.find(m=>m.id===id)).filter(Boolean).map(m=>({...Monsters.stats(m,MASTER_DATA),id:m.id,status:m.status,hp:m.hp??Monsters.stats(m,MASTER_DATA).maxHp}));}

  function syncPartyHp(full=false){
    const members=partyMembers();for(const p of members){const m=S.monsters.find(m=>m.id===p.id);if(full)delete m.status;m.hp=full?p.maxHp:clamp(m.hp??p.maxHp,0,p.maxHp);}
    S.maxHp=partyMembers().reduce((n,m)=>n+m.maxHp,0);S.hp=partyMembers().reduce((n,m)=>n+m.hp,0);
  }

  function healParty(rate){for(const p of partyMembers()){const m=S.monsters.find(m=>m.id===p.id);m.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*rate));}syncPartyHp();}

  function monsterIcon(canvas,instance){const s=Monsters.stats(instance,MASTER_DATA),p=MASTER_DATA.sprites[s.sprite];if(!p)return;const motion=allyFrames[instance.id],now=performance.now(),state=instance.hp===0?'death':motion&&now<motion.until?motion.state:'idle',idleFrames=p.states.idle||[p.cell],attackFrames=p.states.attack||idleFrames,ultimateFrames=[idleFrames.at(-1),...attackFrames,attackFrames.at(-1)],frames=state==='ultimate'?ultimateFrames:p.states[state]||idleFrames,elapsed=state==='idle'?now:now-(motion?.start||0),step=state==='idle'?Math.max(320,p.frameMs||0):state==='ultimate'?105:150,frame=frames[state==='idle'?Math.floor(elapsed/step)%frames.length:Math.min(frames.length-1,Math.max(0,Math.floor(elapsed/step)))];canvas.dataset.animationState=state;canvas.dataset.frame=frame;canvas.dataset.assetStatus=p.status;SHUTArt.image(p.source,img=>SHUTArt.drawCell(canvas,img,{...p,cell:frame},.08));}

  function drawPartyHud(){
    const el=$('battlePartner');el.className='monsterPartyHud';el.innerHTML=partyMembers().map(m=>{const charge=skillCharge[m.id]||0,motion=allyFrames[m.id],active=motion&&performance.now()<motion.until,owned=S.monsters.find(x=>x.id===m.id);return `<div class="monsterHud ${m.hp<=0?'fainted':''} ${active&&motion.state==='attack'?'attacking':''} ${active&&motion.state==='ultimate'?'ultimate':''} ${charge>=SKILL_MAX?'skillReady':''}" data-ally="${m.id}"><canvas width="64" height="64"></canvas><div><b>${m.name}</b><span>${localizedAttribute(m.attr)} Lv.${m.level}${m.status?' ↓'+m.status.name:''}${owned?.regen?' · '+t('battle.regen'):''}</span><div class="allyHp"><i style="width:${m.hp/m.maxHp*100}%;background:${attrColor[m.attr]}"></i></div><small>${m.hp}/${m.maxHp}</small><div class="skillGauge" aria-label="${t('battle.skillGauge',{value:charge})}"><i style="width:${charge}%"></i><em>${charge>=SKILL_MAX?t('battle.skillReady'):'SP '+charge+'%'}</em></div></div></div>`}).join('');el.querySelectorAll('[data-ally]').forEach(n=>monsterIcon(n.querySelector('canvas'),S.monsters.find(m=>m.id===n.dataset.ally)));
  }

  function drawMonsterRoster(){document.querySelectorAll('[data-monster]').forEach(cv=>{const m=S.monsters.find(m=>m.id===cv.dataset.monster);if(m)monsterIcon(cv,m);});}
  function presentSynthesis(p,baseId){
    setMusicMode('synthesis');
    openModal(p.evolves?'EVOLUTION':t('synthesis.title'),`<div class="synthesisScene"><div class="synthesisEnergy"><i></i><i></i><i></i></div><canvas id="synthesisPortrait" width="192" height="192"></canvas><h3 id="synthesisTitle">${t('synthesis.powerUnites')}</h3><div class="synthesisExp"><i></i></div><p>${t('synthesis.expGain',{exp:p.exp})} · ${t('synthesis.levelChange',{before:p.before.level,after:p.after.level})}</p><p class="synthesisStats">HP ${p.before.maxHp} → ${p.after.maxHp} · ATK ${p.before.atk} → ${p.after.atk}<br>${p.after.skill.description||p.after.skill.name}</p></div>`);
    const canvas=$('synthesisPortrait'),title=$('synthesisTitle'),scene=canvas.parentElement,old=MASTER_DATA.sprites[p.before.sprite];SHUTArt.image(old.source,img=>SHUTArt.drawCell(canvas,img,{...old,cell:old.states.idle[0]},.08));sfx('synthesis');
    setTimeout(()=>{title.textContent=p.evolves?'EVOLUTION':p.after.level>p.before.level?'LEVEL UP':p.after.name;scene.classList.toggle('evolving',p.evolves);sfx(p.evolves?'evolution':'level');},650);
    setTimeout(()=>{monsterIcon(canvas,S.monsters.find(m=>m.id===baseId));title.textContent=p.after.name;scene.classList.add('revealed');},p.evolves?1150:800);
  }
  function renderSynthesis(){
    setMusicMode('synthesis');openModal(t('synthesis.title'),`<p class="managementLead">${t('synthesis.chooseBase')}</p><div class="synthesisBaseGrid">${S.monsters.map(m=>monsterTile(m,Monsters.stats(m,MASTER_DATA),'synthesis-base')).join('')}</div>`);drawMonsterRoster();document.querySelectorAll('[data-synthesis-base]').forEach(b=>b.onclick=()=>renderSynthesisMaterials(b.dataset.synthesisBase,new Set()));
  }
  function renderSynthesisMaterials(baseId,selectedIds,stones={}){
    const base=S.monsters.find(m=>m.id===baseId);if(!base){renderSynthesis();return}const baseStats=Monsters.stats(base,MASTER_DATA),candidates=S.monsters.filter(m=>m.id!==baseId),selected=[...selectedIds].filter(id=>candidates.some(m=>m.id===id&&!m.locked&&!S.party.includes(m.id)));selectedIds=new Set(selected);const stoneRules=MASTER_DATA.monsterRules.synthesis.expStones||{},normalizedStones=Object.fromEntries(Object.keys(stoneRules).map(key=>[key,Math.min(Number(S.items[key]||0),Math.max(0,Number(stones[key]||0)))])),stoneCount=Object.values(normalizedStones).reduce((n,x)=>n+x,0);let preview=null;if(selected.length||stoneCount)try{preview=Monsters.synthesisPreview(S,baseId,selected,MASTER_DATA,normalizedStones)}catch(e){}
    const cards=candidates.map(m=>{const s=Monsters.stats(m,MASTER_DATA),reason=m.locked?t('synthesis.unavailableLocked'):S.party.includes(m.id)?t('synthesis.unavailableParty'):'';return `<div class="materialChoice ${selectedIds.has(m.id)?'selected':''} ${reason?'unavailable':''}">${monsterTile(m,s,'synthesis-material',selectedIds.has(m.id),!!reason)}${reason?`<span class="unavailableReason">${reason}</span>`:''}</div>`}).join('');
    const previewHtml=preview?`<div class="synthesisPreview"><b>${t('synthesis.expGain',{exp:preview.exp})}</b><span>${t('synthesis.levelChange',{before:preview.before.level,after:preview.after.level})}</span><span>${t('synthesis.goldCost',{cost:preview.cost})}</span><span class="${preview.affordable?'':'warning'}">${t('synthesis.goldAfter',{gold:preview.goldAfter})}</span><strong>${preview.evolves?t('synthesis.evolutionReady',{name:preview.after.name}):t('synthesis.noEvolution')}</strong></div>`:`<div class="synthesisPreview empty">${t('synthesis.selectRequired')}</div>`;
    const stoneNames={expSmall:t('synthesis.stoneSmall'),expMedium:t('synthesis.stoneMedium'),expLarge:t('synthesis.stoneLarge')},stoneHtml=Object.keys(stoneRules).map(key=>`<div class="synthesisStone"><b>${stoneNames[key]}</b><span>${t('synthesis.owned',{count:S.items[key]||0})}</span><button class="btn secondary" data-stone="${key}" data-step="-1" ${normalizedStones[key]<=0?'disabled':''}>−</button><em>${normalizedStones[key]}</em><button class="btn secondary" data-stone="${key}" data-step="1" ${normalizedStones[key]>=Number(S.items[key]||0)?'disabled':''}>＋</button></div>`).join('');
    openModal(t('synthesis.title'),`<div class="synthesisHeader"><div class="baseSummary"><span>${t('synthesis.base')}</span><canvas width="96" height="96" data-monster="${base.id}"></canvas><b>${baseStats.name}</b><small>${t('monsters.level',{level:baseStats.level})} · ★${baseStats.rarity}</small></div><div><p>${t('synthesis.chooseMaterials')}</p><button id="changeSynthesisBase" class="btn secondary">${t('synthesis.changeBase')}</button></div></div><div class="synthesisSectionTitle">${t('synthesis.materials')} · ${t('synthesis.selected',{count:selectedIds.size})}</div><div class="synthesisMaterialGrid">${cards||`<p>${t('synthesis.noMaterials')}</p>`}</div><div class="synthesisSectionTitle">${t('synthesis.expStones')} · ${t('synthesis.selectedStones',{count:stoneCount})}</div><div class="synthesisStones">${stoneHtml}</div>${previewHtml}<button id="previewSynthesis" class="btn gold" ${preview?'':'disabled'}>${t('synthesis.preview')}</button>`);drawMonsterRoster();
    $('changeSynthesisBase').onclick=renderSynthesis;document.querySelectorAll('[data-synthesis-material]').forEach(b=>b.onclick=()=>{const next=new Set(selectedIds);next.has(b.dataset.synthesisMaterial)?next.delete(b.dataset.synthesisMaterial):next.add(b.dataset.synthesisMaterial);renderSynthesisMaterials(baseId,next,normalizedStones)});document.querySelectorAll('[data-stone]').forEach(b=>b.onclick=()=>{const next={...normalizedStones},key=b.dataset.stone;next[key]=Math.max(0,Math.min(Number(S.items[key]||0),next[key]+Number(b.dataset.step)));renderSynthesisMaterials(baseId,selectedIds,next)});$('previewSynthesis').onclick=()=>{if(preview)renderSynthesisConfirmation(preview)};
  }
  function synthesisWarning(reason){return t({高レア:'synthesis.warningRare',高レベル:'synthesis.warningLevel',進化済み:'synthesis.warningEvolved',お気に入り:'synthesis.warningFavorite',重要:'synthesis.warningImportant'}[reason]||'synthesis.warning')}
  function renderSynthesisConfirmation(preview){
    const materials=preview.materialIds.map(id=>{const m=S.monsters.find(x=>x.id===id),s=Monsters.stats(m,MASTER_DATA),warning=preview.warnings.find(w=>w.id===id);return `<div class="confirmMaterial"><canvas width="72" height="72" data-monster="${id}"></canvas><span><b>${s.name}</b><small>${t('monsters.level',{level:s.level})} · ★${s.rarity}</small>${warning?`<em>${warning.reasons.map(synthesisWarning).join(' · ')}</em>`:''}</span></div>`}).join('')+Object.entries(preview.stones||{}).filter(([,count])=>count).map(([key,count])=>`<div class="confirmMaterial stone"><span><b>${t({expSmall:'synthesis.stoneSmall',expMedium:'synthesis.stoneMedium',expLarge:'synthesis.stoneLarge'}[key])}</b><small>×${count}</small></span></div>`).join('');
    openModal(t('synthesis.confirmTitle'),`<div class="synthesisConfirm"><div class="confirmSummary"><b>${preview.before.name}</b><span>${t('synthesis.levelChange',{before:preview.before.level,after:preview.after.level})}</span><span>${t('synthesis.expGain',{exp:preview.exp})}</span><span>${t('synthesis.goldCost',{cost:preview.cost})}</span><strong class="${preview.affordable?'':'warning'}">${t('synthesis.goldAfter',{gold:preview.goldAfter})}</strong>${preview.evolves?`<em>${t('synthesis.evolutionReady',{name:preview.after.name})}</em>`:''}</div><h3>${t('synthesis.consumed')}</h3><div class="confirmMaterials">${materials}</div><p class="warning">${t('synthesis.confirmWarning')}</p><div class="confirmActions"><button id="confirmSynthesis" class="btn gold" ${preview.affordable?'':'disabled'}>${t('synthesis.execute')}</button><button id="cancelSynthesis" class="btn secondary">${t('common.cancel')}</button></div></div>`);drawMonsterRoster();$('cancelSynthesis').onclick=()=>renderSynthesisMaterials(preview.baseId,new Set(preview.materialIds),preview.stones);$('confirmSynthesis').onclick=()=>{try{S=Monsters.synthesize(S,preview,MASTER_DATA);syncPartyHp(true);saveGame();presentSynthesis(preview,preview.baseId)}catch(err){localeToast('synthesis.changed');renderSynthesisMaterials(preview.baseId,new Set())}};
  }

  function damageMonsterTarget(e,hit){
    e.prevHp=e.hp;e.hp=Math.max(0,e.hp-hit.damage);if(hit.timing==='PERFECT')e.barrier=0;e.flashUntil=performance.now()+320;e.popup={text:'−'+hit.damage,tag:hit.attribute>1?'WEAK':hit.attribute<1?'RESIST':'',cls:hit.attribute>1?'weak':''};clearTimeout(e.popupTimer);e.popupTimer=setTimeout(()=>{e.popup=null;renderEnemies();},620);
    const oldPhase=e.phaseIndex||0,action=Systems.action(e,MASTER_DATA.enemies.find(d=>d.enemy_id===e.masterId),MASTER_DATA);e.phaseIndex=action.phaseIndex;if(e.boss&&e.hp>0&&e.phaseIndex>oldPhase){feedback(action.phase,'perfect');e.pendingPhaseEvent=e.phaseIndex===1?'boss_phase2':'boss_phase3';}
    if(!e.hp&&!e.dead){e.dead=true;e.defeatUntil=performance.now()+600;if(hit.attribute>1)bumpQuest('weak_kill_count',1);bumpQuest('enemy_kill_count',1);grantEnemyRewards(e);}
  }
  function showMonsterAttack(hit,index){
    allyFrames[hit.actorId]={state:hit.ultimate?'ultimate':'attack',start:performance.now(),until:performance.now()+(hit.ultimate?820:560)};
    const ally=document.querySelector(`[data-ally="${hit.actorId}"]`),target=document.querySelector(`.enemyCard[data-id="${hit.targetId}"]`);if(!ally||!target)return;const area=$('battleScreen').getBoundingClientRect(),a=ally.getBoundingClientRect(),b=target.getBoundingClientRect(),actor=partyMembers().find(m=>m.id===hit.actorId),node=document.createElement('i');node.className='monsterAttackSpark';node.style.cssText=`left:${a.left+a.width/2-area.left}px;top:${a.top-area.top}px;--dx:${b.left+b.width/2-a.left-a.width/2}px;--dy:${b.top+b.height*.45-a.top}px;--spark:${attrColor[actor.attr]};animation-delay:${index*45}ms`;$('battleScreen').append(node);setTimeout(()=>node.remove(),600);
  }

  function showUltimateMotion(hit,index){
    const actor=partyMembers().find(m=>m.id===hit.actorId);if(!actor)return;const node=document.createElement('div');node.className='ultimateMotion attr-'+({'火':'fire','水':'water','雷':'thunder','地':'earth','風':'wind'}[actor.attr]||'wind');node.style.setProperty('--delay',index*60+'ms');node.innerHTML=`<div class="ultimateSeal"><i></i><i></i><i></i></div><strong>${t('battle.ultimate')}</strong><span>${actor.skill?.name||actor.name}</span>`;$('battleScreen').append(node);sfx('cue');setTimeout(()=>node.remove(),1050);
  }

  function applySpecialEffect(hit,enemy){
    const plan=hit.special;if(!plan)return;
    if(plan.type==='heal'&&plan.allyId){const m=S.monsters.find(x=>x.id===plan.allyId),max=m&&Monsters.stats(m,MASTER_DATA).maxHp;if(m&&m.hp>0)m.hp=Math.min(max,m.hp+plan.heal);feedback(t('battle.heal'),'perfect');}
    if(plan.type==='regen'&&plan.allyId){const m=S.monsters.find(x=>x.id===plan.allyId);if(m)m.regen={...plan.status};feedback(t('battle.regen'),'perfect');}
    if(plan.type==='poison'&&enemy&&!enemy.dead){enemy.poison={...plan.status};feedback(t('battle.poison'),'hit');}
    if(plan.type==='atk_down'&&enemy&&!enemy.dead){enemy.attackDown={...plan.status};feedback(t('battle.atkDown'),'hit');}
    syncPartyHp();
  }

  document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled||!audioCtx||['startBtn','newGameBtn','battleAction','unfoldBattle','foldHome','unfoldHome','singlePullBtn','tenPullBtn','confirmSynthesis'].includes(b.id))return;sfx(['modalClose','cancelSynthesis','dialogueSkip'].includes(b.id)?'cancel':['storyDeploy','claimAllGift','previewSynthesis'].includes(b.id)||b.hasAttribute('data-buy')?'confirm':'ui');});
  hadSave=loadGame();normalizeState();if(hadSave){$('startBtn').textContent=t('title.continue');$('newGameBtn').style.display='inline-block';$('continueUnavailable').style.display='none'}else{$('startBtn').textContent=t('title.newGame');$('continueUnavailable').style.display='block';if(SHUTSave.recovered)toast(t('save.recovery'),9000)}
  window.addEventListener('beforeunload',saveGame);
  spriteLoop();
  updateHome();
})();
