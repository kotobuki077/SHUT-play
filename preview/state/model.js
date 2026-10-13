'use strict';
(function(root){
 const schemaVersion=1;
 function fresh(language='ja'){return {schemaVersion,domain:'plant-gardener',settings:{language,openOnly:false},output:'open',wallet:{gold:0,keys:0},gardeners:[],party:[],plantsSeen:[],progress:{stageClears:[],rescues:[]}};}
 function validate(s){
  if(!s||s.schemaVersion!==schemaVersion||s.domain!=='plant-gardener')return false;
  if(!s.settings||!['ja','en'].includes(s.settings.language)||typeof s.settings.openOnly!=='boolean'||!['open','close'].includes(s.output))return false;
  if(!s.wallet||!['gold','keys'].every(k=>Number.isSafeInteger(s.wallet[k])&&s.wallet[k]>=0))return false;
  if(!Array.isArray(s.gardeners)||!s.gardeners.every(g=>g&&typeof g.id==='string'&&/^G(?:00[1-9]|0[1-9][0-9]|100)$/.test(g.id)))return false;
  if(!Array.isArray(s.party)||s.party.length>3||new Set(s.party).size!==s.party.length||!s.party.every(id=>s.gardeners.some(g=>g.id===id)))return false;
  return Array.isArray(s.plantsSeen)&&s.plantsSeen.every(id=>/^P(?:00[1-9]|0[1-9][0-9]|100)$/.test(id))&&s.progress&&['stageClears','rescues'].every(k=>Array.isArray(s.progress[k])&&s.progress[k].every(id=>typeof id==='string'));
 }
 const api={fresh,validate,clone:s=>JSON.parse(JSON.stringify(s))};root.SHUTRebuild={...(root.SHUTRebuild||{}),model:api};if(typeof module!=='undefined')module.exports=api;
})(globalThis);
