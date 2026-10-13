'use strict';
(function(root){
 const schemaVersion=1;
 function fresh(language='ja'){return {schemaVersion,domain:'plant-gardener',settings:{language,openOnly:false},output:'open',wallet:{gold:0,keys:0},gardeners:[],party:[],plantsSeen:[],progress:{stageClears:[],rescues:[]}};}
 function validate(s){
  if(!s||s.schemaVersion!==schemaVersion||s.domain!=='plant-gardener')return false;
  if(!s.settings||!['ja','en'].includes(s.settings.language)||typeof s.settings.openOnly!=='boolean'||!['open','close'].includes(s.output))return false;
  if(!s.wallet||!['gold','keys'].every(k=>Number.isSafeInteger(s.wallet[k])&&s.wallet[k]>=0))return false;
  if(!Array.isArray(s.gardeners)||!s.gardeners.every(g=>g&&typeof g.id==='string'&&/^G(?:00[1-9]|0[1-9][0-9]|100)$/.test(g.id)))return false;
  if(s.gardeners.some(g=>g.level!==undefined&&(!Number.isInteger(g.level)||g.level<1||g.level>50)||g.hp!==undefined&&(!Number.isSafeInteger(g.hp)||g.hp<0)||g.sp!==undefined&&(!Number.isInteger(g.sp)||g.sp<0||g.sp>7)))return false;
  if(s.battle!=null){const b=s.battle;if(b.stage!=='S01-01'||!Number.isInteger(b.wave)||b.wave<0||b.wave>2||!['ready','guard','recovery','waveResult','victory','defeat'].includes(b.phase)||!Array.isArray(b.enemies)||b.enemies.length<1||b.enemies.length>2||!b.enemies.every(e=>e&&[1,21,41].includes(e.no)&&Number.isSafeInteger(e.hp)&&e.hp>=0&&Number.isSafeInteger(e.maxHp)&&e.maxHp>0&&e.hp<=e.maxHp&&Number.isSafeInteger(e.atk)&&e.atk>0&&Array.isArray(e.attributes))||!Array.isArray(b.seeds)||!b.seeds.every(n=>n===1)||!Array.isArray(b.events)||b.events.length>12||!b.events.every(e=>e&&typeof e.kind==='string'&&(e.name===undefined||typeof e.name==='string'))||!Number.isInteger(b.round)||b.round<0||typeof b.settled!=='boolean'||!Number.isSafeInteger(b.gold)||b.gold<0||!Number.isSafeInteger(b.rankXp)||b.rankXp<0)return false;}
  if(!Array.isArray(s.party)||s.party.length>3||new Set(s.party).size!==s.party.length||!s.party.every(id=>s.gardeners.some(g=>(g.instanceId||g.id)===id)))return false;
  if(new Set(s.gardeners.map(g=>g.instanceId||g.id)).size!==s.gardeners.length)return false;
  return Array.isArray(s.plantsSeen)&&s.plantsSeen.every(id=>/^P(?:00[1-9]|0[1-9][0-9]|100)$/.test(id))&&s.progress&&['stageClears','rescues'].every(k=>Array.isArray(s.progress[k])&&s.progress[k].every(id=>typeof id==='string'));
 }
 const api={fresh,validate,clone:s=>JSON.parse(JSON.stringify(s))};root.SHUTRebuild={...(root.SHUTRebuild||{}),model:api};if(typeof module!=='undefined')module.exports=api;
})(globalThis);
