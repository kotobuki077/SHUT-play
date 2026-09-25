(() => {
  let timer=0;
  const config=()=>globalThis.SHUT_MASTER_DATA?.presentation?.specialEncounters?.mikado||{};
  const matches=enemy=>{
    const c=config(),id=String(enemy?.masterId||enemy?.enemy_id||''),name=String(enemy?.name||'').toLocaleLowerCase();
    return !!enemy&&(id===c.enemyId||(c.aliases||[]).some(alias=>name===String(alias).toLocaleLowerCase()));
  };
  const enemyId=()=>config().enemyId;
  function rollEncounter(stage,random=Math.random){
    const c=config();
    if(!stage?.mikado_encounter||stage.world_id!==c.worldId)return false;
    const roll=random();
    if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid Mikado encounter roll');
    return roll<Number(c.encounterRate);
  }
  const fillPetals=container=>{
    if(!container||container.childElementCount)return;
    for(let i=0;i<28;i++){
      const petal=document.createElement('i');
      petal.style.setProperty('--x',`${(i*37)%101}%`);
      petal.style.setProperty('--delay',`${-((i*421)%7000)}ms`);
      petal.style.setProperty('--drift',`${42+(i*23)%90}px`);
      petal.style.setProperty('--drift-back',`${-Math.round((42+(i*23)%90)*.35)}px`);
      petal.style.setProperty('--rest',`${8+(i*29)%78}%`);
      petal.style.setProperty('--fall',`${6200+(i*311)%4300}ms`);
      container.append(petal);
    }
  };
  function prepare(enemy){
    if(!matches(enemy))return false;
    const battle=document.getElementById('battleScreen'),overlay=document.getElementById('mikadoEncounter'),app=document.getElementById('app'),c=config();
    battle?.classList.add('mikadoBattle');
    if(c.background&&app)app.style.setProperty('--world',`url("${new URL(c.background,location.href).href}")`);
    fillPetals(document.getElementById('mikadoPetals'));
    overlay?.setAttribute('aria-hidden','true');
    return true;
  }
  function enter({enemy,onComplete,setMusicMode,duration}={}){
    if(!prepare(enemy)){onComplete?.();return false}
    clearTimeout(timer);
    const battle=document.getElementById('battleScreen'),overlay=document.getElementById('mikadoEncounter'),ms=duration??config().introMs??15000;
    battle?.classList.add('mikadoIntro');
    overlay?.classList.remove('show');void overlay?.offsetWidth;overlay?.classList.add('show');overlay?.setAttribute('aria-hidden','false');
    setMusicMode?.('mikado');
    timer=setTimeout(()=>{battle?.classList.remove('mikadoIntro');overlay?.classList.remove('show');overlay?.setAttribute('aria-hidden','true');onComplete?.()},ms);
    return true;
  }
  function clear(){
    clearTimeout(timer);timer=0;
    document.getElementById('battleScreen')?.classList.remove('mikadoBattle','mikadoIntro');
    const overlay=document.getElementById('mikadoEncounter');overlay?.classList.remove('show');overlay?.setAttribute('aria-hidden','true');
  }
  globalThis.SHUTMikadoPresentation={matches,enemyId,rollEncounter,prepare,enter,clear};
  if(typeof module!=='undefined')module.exports=globalThis.SHUTMikadoPresentation;
})();
