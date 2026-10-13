(function(root){'use strict';
const std=()=>root.SHUTPixelStandard;
const effectStates={cast:{min:3,max:8,fps:[8,14]},trail:{min:4,max:10,fps:[10,15]},hit:{min:4,max:10,fps:[10,15]},aura:{min:4,max:8,fps:[5,8]}};
function validateEffect(def){
  if(!def||!std().STANDARD.elements.includes(def.element))throw Error('Unknown element effect');
  if(!effectStates[def.kind])throw Error('Unknown effect kind');
  if(!Array.isArray(def.frames)||!def.frames.length)throw Error('Effect frames required');
  const rule=effectStates[def.kind];if(def.frames.length<rule.min||def.frames.length>rule.max)throw Error('Effect frame count outside range');
  if(!Number.isInteger(def.fps)||def.fps<rule.fps[0]||def.fps>rule.fps[1])throw Error('Effect FPS outside range');
  for(const src of def.frames)if(typeof src!=='string'||!src.toLowerCase().endsWith('.png'))throw Error('Effect frames must be PNG');
  const a=def.anchor||{};if(!Number.isInteger(a.x)||!Number.isInteger(a.y))throw Error('Effect anchor must use integer coordinates');
  return true;
}
function paths(element,kind,count){return Array.from({length:count},(_,i)=>'assets/pixel/vfx/'+element+'/'+kind+'-'+String(i).padStart(2,'0')+'.png')}
const defaultDefinitions={};
for(const element of ['fire','wood','water','light','dark','rainbow']){
  defaultDefinitions[element]={
    cast:{element,kind:'cast',frames:paths(element,'cast',4),fps:10,anchor:{x:32,y:32}},
    trail:{element,kind:'trail',frames:paths(element,'trail',6),fps:12,anchor:{x:32,y:32}},
    hit:{element,kind:'hit',frames:paths(element,'hit',6),fps:12,anchor:{x:32,y:32}}
  };
}
function play(canvas,def,{scale=2,onDone=null}={}){
  validateEffect(def);std().assertIntegerScale(scale);
  const size=std().STANDARD.nativeCanvas.vfx,ctx=root.SHUTPixelRuntime.prepareCanvas(canvas,size,size,scale);
  let stopped=false,frame=0,timer=0;canvas.classList.add('pixelFxCanvas','pixel-art');canvas.dataset.effect=def.element+'_'+def.kind;
  const step=async()=>{
    if(stopped)return;
    try{
      const img=await root.SHUTPixelRuntime.load(def.frames[frame]);
      if(img.naturalWidth!==size||img.naturalHeight!==size)throw Error('VFX native size mismatch');
      ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,size,size);ctx.drawImage(img,0,0);canvas.dataset.assetStatus='ready';
    }catch{canvas.dataset.assetStatus='pending';stopped=true;onDone?.(false);return}
    frame++;
    if(frame>=def.frames.length){stopped=true;onDone?.(true);return}
    timer=setTimeout(step,Math.round(1000/def.fps));
  };
  step();
  return {stop(){stopped=true;clearTimeout(timer)}};
}
function eventPlan(element,{chargeFrame=3,impactFrame=6}={}){
  if(!defaultDefinitions[element])throw Error('No VFX set for '+element);
  return [
    {frame:chargeFrame,type:'spawnEffect',effect:element+'_cast',layer:'front',anchor:'weapon'},
    {frame:Math.max(chargeFrame+1,impactFrame-2),type:'spawnEffect',effect:element+'_trail',layer:'trail',anchor:'weapon'},
    {frame:impactFrame,type:'impact',anchor:'target'},
    {frame:impactFrame,type:'spawnEffect',effect:element+'_hit',layer:'hit',anchor:'target'}
  ];
}
root.SHUTPixelEffects={effectStates,validateEffect,defaultDefinitions,eventPlan,play};
if(typeof module!=='undefined')module.exports=root.SHUTPixelEffects;
})(globalThis);
