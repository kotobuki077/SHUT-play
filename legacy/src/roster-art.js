(function(root){'use strict';
const animators=new WeakMap();
const pending=new WeakSet();
async function mountFace(canvas,{no,side='gardener',scale=2,onReady=null,onMissing=null}={}){
  if(!canvas||!root.SHUTPixelRuntime||!root.SHUTPixelManifest)return false;
  const p=root.SHUTPixelManifest.profile(no,side),ctx=root.SHUTPixelRuntime.prepareCanvas(canvas,p.faceWidth,p.faceHeight,scale);
  canvas.dataset.assetQuality='production';
  if(p.actualAssetStatus!=='ready'){
    ctx.clearRect(0,0,p.faceWidth,p.faceHeight);canvas.dataset.assetStatus='pending';pending.add(canvas);onMissing?.(canvas);return false;
  }
  try{
    const img=await root.SHUTPixelRuntime.load(p.face);
    if(img.naturalWidth!==p.faceWidth||img.naturalHeight!==p.faceHeight)throw Error('Face icon native size mismatch');
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,p.faceWidth,p.faceHeight);ctx.drawImage(img,0,0);
    canvas.dataset.assetStatus='ready';pending.delete(canvas);onReady?.(canvas);return true;
  }catch{
    ctx.clearRect(0,0,p.faceWidth,p.faceHeight);canvas.dataset.assetStatus='pending';pending.add(canvas);onMissing?.(canvas);return false;
  }
}
function mount(canvas,{no,side='gardener',state='idle',scale=2,onEvent=null,onState=null,onReady=null,onMissing=null}={}){
  if(!canvas||!root.SHUTPixelRuntime||!root.SHUTPixelManifest)return false;
  stop(canvas);
  const p=root.SHUTPixelManifest.profile(no,side);
  if(p.actualAssetStatus!=='ready'){
    const ctx=root.SHUTPixelRuntime.prepareCanvas(canvas,p.width,p.height,scale);ctx.clearRect(0,0,p.width,p.height);
    canvas.dataset.assetQuality='production';canvas.dataset.assetStatus='pending';canvas.dataset.rosterNo=String(no);canvas.dataset.rosterSide=side;pending.add(canvas);onMissing?.(canvas);return false;
  }
  const animator=new root.SHUTPixelRuntime.PixelAnimator(canvas,{width:p.width,height:p.height,scale,animations:p.animations,onEvent,onState});
  animators.set(canvas,animator);canvas.dataset.assetQuality='production';canvas.dataset.rosterNo=String(no);canvas.dataset.rosterSide=side;
  animator.preload(state).then(()=>{canvas.dataset.assetStatus='ready';pending.delete(canvas);onReady?.(canvas);animator.play(state,{force:true});}).catch(()=>{canvas.dataset.assetStatus='pending';pending.add(canvas);onMissing?.(canvas);});
  return animator;
}
function setState(canvas,state,options={}){const a=animators.get(canvas);return a?a.play(state,options):false}
function stop(node){const a=animators.get(node);if(a)a.stop();animators.delete(node)}
function play(img){if(img){img.hidden=true;img.dataset.assetStatus='migration-blocked';img.dataset.assetQuality='migration-only'}return false}
root.SHUTRosterArt={mount,mountFace,setState,stop,play,isPending:node=>pending.has(node)};
if(typeof module!=='undefined')module.exports=root.SHUTRosterArt;
})(globalThis);
