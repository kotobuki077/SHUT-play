(function(root){'use strict';
const STANDARD={
  version:1,
  nativeCanvas:{face:32,standard:64,large:96,boss:128,vfx:64},
  states:{
    idle:{minFrames:6,maxFrames:8,fpsMin:5,fpsMax:8,loop:true,priority:10},
    guard:{minFrames:4,maxFrames:6,fpsMin:6,fpsMax:10,loop:false,priority:20},
    attack:{minFrames:10,maxFrames:12,fpsMin:10,fpsMax:14,loop:false,priority:30,requiredEvents:['impact']},
    skill:{minFrames:12,maxFrames:16,fpsMin:10,fpsMax:15,loop:false,priority:40,requiredEvents:['impact']},
    hit:{minFrames:3,maxFrames:5,fpsMin:10,fpsMax:14,loop:false,priority:50},
    victory:{minFrames:8,maxFrames:16,fpsMin:6,fpsMax:12,loop:true,priority:15},
    dead:{minFrames:4,maxFrames:12,fpsMin:6,fpsMax:12,loop:false,priority:60}
  },
  statePriority:['dead','hit','skill','attack','guard','victory','idle'],
  elements:['fire','wood','water','light','dark','rainbow'],
  elementLayers:['cast','trail','hit','aura'],
  render:{
    format:'png',
    alpha:'rgba',
    smoothing:false,
    interpolation:false,
    integerScaleOnly:true,
    integerCoordinatesOnly:true,
    crossfade:false,
    morph:false,
    motionBlur:false,
    runtimeSheetCropping:false,
    independentFrameFiles:true,
    transparentBackground:true,
    anchor:'bottom-center'
  },
  sheetBuild:{allowedAfterFrameApproval:true,paddingMin:2,paddingMax:4,integerRects:true,nearestNeighbor:true},
  attackPhases:['windup','impact','recovery'],
  productionRules:{
    aiSheetGeneration:false,
    singleImageMultiPose:false,
    frameDuplicationForCount:false,
    antiAliasedEdges:false,
    postShrinkFromHighRes:false
  }
};
function stateSpec(name){const s=STANDARD.states[name];if(!s)throw Error('Unknown pixel state: '+name);return s}
function assertIntegerScale(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>8)throw Error('Pixel scale must be an integer 1..8');return n}
function assertIntegerPoint(x,y){if(!Number.isInteger(Number(x))||!Number.isInteger(Number(y)))throw Error('Pixel draw coordinates must be integers');return {x:Number(x),y:Number(y)}}
function validateAnimation(def){
  if(!def||typeof def!=='object')throw Error('Animation definition required');
  const spec=stateSpec(def.state);
  if(!Array.isArray(def.frames))throw Error('Animation frames must be an array');
  if(def.frames.length<spec.minFrames||def.frames.length>spec.maxFrames)throw Error(def.state+' frame count outside production range');
  const fps=Number(def.fps);if(!Number.isInteger(fps)||fps<spec.fpsMin||fps>spec.fpsMax)throw Error(def.state+' FPS outside production range');
  if(!!def.loop!==!!spec.loop&&def.state!=='victory')throw Error(def.state+' loop policy mismatch');
  for(const src of def.frames)if(typeof src!=='string'||!src.toLowerCase().endsWith('.png'))throw Error('Pixel frames must be PNG files');
  const events=Array.isArray(def.events)?def.events:[];
  for(const name of spec.requiredEvents||[])if(!events.some(e=>e?.type===name&&Number.isInteger(e.frame)&&e.frame>=0&&e.frame<def.frames.length))throw Error(def.state+' requires '+name+' event');
  for(const e of events)if(!Number.isInteger(e.frame)||e.frame<0||e.frame>=def.frames.length)throw Error('Animation event frame out of bounds');
  return true;
}
function profilePaths({no,side='gardener',state,count}){
  const id=String(no).padStart(3,'0');
  return Array.from({length:count},(_,i)=>'assets/pixel/'+id+'/'+side+'/'+state+'-'+String(i).padStart(2,'0')+'.png');
}
root.SHUTPixelStandard={STANDARD,stateSpec,assertIntegerScale,assertIntegerPoint,validateAnimation,profilePaths};
if(typeof module!=='undefined')module.exports=root.SHUTPixelStandard;
})(globalThis);
