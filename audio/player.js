'use strict';
(function(root){
 const KEY='shut_rebuild_audio_v1',defaults={muted:false,bgm:60,se:70};
 // No production sources are approved. This catalog is deliberately empty.
 const catalog=Object.freeze({bgm:Object.freeze({}),se:Object.freeze({})});
 function valid(x){return !!x&&typeof x.muted==='boolean'&&['bgm','se'].every(k=>Number.isInteger(x[k])&&x[k]>=0&&x[k]<=100);}
 function create({storage,AudioClass=root.Audio,sources=catalog}={}){
  let settings={...defaults},storageStatus='ready',scene='title',unlocked=false,hidden=false,disposed=false,bgm=null,generation=0,lastError=null;const effects=new Set();
  try{const raw=storage.getItem(KEY);if(raw!==null){const parsed=JSON.parse(raw);if(valid(parsed))settings=parsed;else storageStatus='invalid';}}catch{storageStatus='unavailable';}
  const usable=url=>typeof url==='string'&&/^audio\/approved\/[a-zA-Z0-9_./-]+\.(ogg|mp3|wav|m4a)$/.test(url)&&!url.includes('..');
  const allowed=(type,id)=>usable(sources[type]?.[id])?sources[type][id]:null;
  function stop(a){if(!a)return;try{a.pause();a.removeAttribute?.('src');a.load?.();}catch{}a.onended=null;a.onerror=null;}
  function stopBgm(){generation++;stop(bgm);bgm=null;}
  function stopEffects(){for(const a of effects)stop(a);effects.clear();}
  function play(a,token,onFail){try{Promise.resolve(a.play()).catch(()=>{if(!disposed&&token===generation){lastError='playback';onFail();}});}catch{lastError='playback';onFail();}}
  function sync(){
   if(disposed)return;
   if(!unlocked||hidden||settings.muted||settings.bgm===0||!allowed('bgm',scene)||typeof AudioClass!=='function'){stopBgm();return;}
   if(bgm){bgm.volume=settings.bgm/100;return;}
   const token=++generation;try{const a=new AudioClass(allowed('bgm',scene));bgm=a;a.loop=true;a.volume=settings.bgm/100;a.onerror=()=>{if(token===generation){lastError='source';stopBgm();}};play(a,token,()=>{if(bgm===a)stopBgm();});}catch{lastError='unavailable';stopBgm();}
  }
  function update(next){if(disposed||!valid(next))return {ok:false,reason:'invalid'};try{storage.setItem(KEY,JSON.stringify(next));}catch{return {ok:false,reason:'storage'};}settings={...next};storageStatus='ready';if(settings.muted||settings.se===0)stopEffects();else for(const a of effects)a.volume=settings.se/100;sync();return {ok:true};}
  return {
   settings:()=>({...settings}),
   status:()=>({scene,unlocked,hidden,storage:storageStatus,error:lastError,playing:!!bgm,effects:effects.size,sourcesReady:Object.keys(sources.bgm||{}).some(id=>allowed('bgm',id))||Object.keys(sources.se||{}).some(id=>allowed('se',id)),supported:typeof AudioClass==='function'}),
   update,
   unlock(){if(disposed)return;unlocked=true;sync();},
   scene(next){if(disposed||scene===next)return;scene=next;stopBgm();stopEffects();sync();},
   visibility(value){if(disposed||hidden===!!value)return;hidden=!!value;if(hidden){stopBgm();stopEffects();}else sync();},
   effect(id){if(disposed||!unlocked||hidden||settings.muted||settings.se===0||!allowed('se',id)||typeof AudioClass!=='function')return false;while(effects.size>=4){const first=effects.values().next().value;stop(first);effects.delete(first);}try{const a=new AudioClass(allowed('se',id));effects.add(a);a.volume=settings.se/100;const done=()=>{effects.delete(a);stop(a);};a.onended=done;a.onerror=()=>{lastError='source';done();};play(a,generation,done);return true;}catch{lastError='unavailable';return false;}},
   dispose(){disposed=true;stopBgm();stopEffects();}
  };
 }
 const api={KEY,defaults,catalog,valid,create};root.SHUTRebuild={...(root.SHUTRebuild||{}),audio:api};if(typeof module!=='undefined')module.exports=api;
})(globalThis);
