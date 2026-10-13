(function(root){
 const phase=(enemy,definition)=>{let current=definition.phases?.[0]||{threshold:1,name:'',pattern:definition.pattern_id||'single',damage:1};for(const p of definition.phases||[])if(enemy.hp/enemy.maxHp<=p.threshold)current=p;return current};
 function action(enemy,definition,data){const p=phase(enemy,definition),a=data.combat_patterns[p.pattern]||data.combat_patterns.single;return {...a,phase:p.name,phaseIndex:(definition.phases||[]).indexOf(p),damage:p.damage||1,pattern:p.pattern};}
 function gateAvailable(kind,state,data){const cfg=data.expeditions[kind];return !!cfg&&!!state.gateUnlocked[kind]&&(!cfg.limited||(state.gateAttempts[kind]||0)>0);}
 root.SHUTSystems={phase,action,gateAvailable};if(typeof module!=='undefined')module.exports=root.SHUTSystems;
})(globalThis);
