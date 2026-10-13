(function(root){'use strict';
const std=()=>root.SHUTPixelStandard;
const roster=()=>root.SHUTRoster;
const countByState={idle:8,attack:12,guard:6,hit:4,skill:16,dead:8,victory:10};
const fpsByState={idle:6,attack:12,guard:8,hit:12,skill:12,dead:8,victory:8};
function frames(no,side,state,count=countByState[state]){
  return std().profilePaths({no,side,state,count});
}
function bodyAnimations(no,side='gardener'){
  const pair=roster().pair(no);if(!pair)throw Error('Unknown roster no: '+no);
  const element=pair.attribute;
  const attackEvents=root.SHUTPixelEffects.eventPlan(element,{chargeFrame:3,impactFrame:6});
  const skillEvents=root.SHUTPixelEffects.eventPlan(element,{chargeFrame:4,impactFrame:9});
  return {
    idle:{state:'idle',frames:frames(no,side,'idle'),fps:fpsByState.idle,loop:true,events:[]},
    attack:{state:'attack',frames:frames(no,side,'attack'),fps:fpsByState.attack,loop:false,events:attackEvents},
    guard:{state:'guard',frames:frames(no,side,'guard'),fps:fpsByState.guard,loop:false,events:[]},
    hit:{state:'hit',frames:frames(no,side,'hit'),fps:fpsByState.hit,loop:false,events:[]},
    skill:{state:'skill',frames:frames(no,side,'skill'),fps:fpsByState.skill,loop:false,events:skillEvents},
    dead:{state:'dead',frames:frames(no,side,'dead'),fps:fpsByState.dead,loop:false,events:[]},
    victory:{state:'victory',frames:frames(no,side,'victory'),fps:fpsByState.victory,loop:true,events:[]}
  };
}
function facePath(no,side='gardener'){return 'assets/pixel/'+String(no).padStart(3,'0')+'/'+side+'/face-00.png'}
function profile(no,side='gardener'){
  const pair=roster().pair(no);if(!pair)throw Error('Unknown roster no: '+no);
  const isBoss=pair.no===100&&side==='plant';
  return {
    no:pair.no,side,
    width:isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard,
    height:isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard,
    faceWidth:std().STANDARD.nativeCanvas.face,
    faceHeight:std().STANDARD.nativeCanvas.face,
    animations:bodyAnimations(no,side),
    face:facePath(no,side),
    anchors:{body:{x:Math.floor((isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard)/2),y:(isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard)-1},weapon:{x:Math.floor((isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard)*.75),y:Math.floor((isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard)*.45)},target:{x:Math.floor((isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard)/2),y:Math.floor((isBoss?std().STANDARD.nativeCanvas.boss:std().STANDARD.nativeCanvas.standard)/2)}},
    quality:'production-contract',
    actualAssetStatus:'pending'
  };
}
function validateAll(){
  for(const pair of roster().data.pairs){
    for(const side of ['gardener','plant']){
      const p=profile(pair.no,side);
      for(const [state,def] of Object.entries(p.animations))std().validateAnimation({...def,state});
    }
  }
  return true;
}
root.SHUTPixelManifest={countByState,fpsByState,frames,bodyAnimations,facePath,profile,validateAll};
if(typeof module!=='undefined')module.exports=root.SHUTPixelManifest;
})(globalThis);
