'use strict';
(function(root){
 const KEY='shut_rebuild_save_v1',BACKUP=KEY+'_backup',LEGACY='shut_save_v2';
 const model=root.SHUTRebuild?.model||(typeof require==='function'?require('./model.js'):null);
 function parse(raw){try{const s=JSON.parse(raw);return model.validate(s)?s:null;}catch{return null;}}
 function create(storage){
  return {key:KEY,backup:BACKUP,
   load(){try{const raw=storage.getItem(KEY);if(raw===null)return {status:'empty',state:null};const state=parse(raw);if(state)return {status:'loaded',state};const previous=parse(storage.getItem(BACKUP));return previous?{status:'recovered',state:previous}:{status:'invalid',state:null};}catch{return {status:'unavailable',state:null};}},
   save(s){if(!model.validate(s))return {ok:false,reason:'invalid'};try{const previous=storage.getItem(KEY);if(parse(previous))storage.setItem(BACKUP,previous);storage.setItem(KEY,JSON.stringify(s));return {ok:true};}catch{return {ok:false,reason:'storage'};}},
   commit(expected,next){try{if(storage.getItem(KEY)!==expected)return {ok:false,reason:'conflict'};}catch{return {ok:false,reason:'storage'};}return this.save(next);},
   legacy(){try{return storage.getItem(LEGACY);}catch{return null;}},
   export(){try{return storage.getItem(KEY);}catch{return null;}}
  };
 }
 const api={create,KEY,BACKUP,LEGACY,parse};root.SHUTRebuild={...(root.SHUTRebuild||{}),save:api};if(typeof module!=='undefined')module.exports=api;
})(globalThis);
