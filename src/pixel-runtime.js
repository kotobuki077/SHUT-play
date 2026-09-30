(function(root){'use strict';
const S=()=>root.SHUTPixelStandard;
const cache=new Map();
function load(src){
  if(cache.has(src))return cache.get(src);
  const p=new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Pixel frame failed: '+src));img.src=src;});
  cache.set(src,p);return p;
}
function prepareCanvas(canvas,width,height,scale=1){
  if(!canvas||typeof canvas.getContext!=='function')throw Error('Canvas required');
  const std=S();std.assertIntegerScale(scale);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0)throw Error('Native canvas dimensions must be positive integers');
  canvas.width=width;canvas.height=height;
  canvas.style.width=(width*scale)+'px';canvas.style.height=(height*scale)+'px';
  canvas.style.imageRendering='pixelated';
  canvas.classList?.add('pixel-art');
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  return ctx;
}
class PixelAnimator{
  constructor(canvas,{width=64,height=64,scale=1,animations={},onEvent=null,onState=null}={}){
    this.canvas=canvas;this.width=width;this.height=height;this.scale=scale;this.animations=animations;this.onEvent=onEvent;this.onState=onState;
    this.ctx=prepareCanvas(canvas,width,height,scale);this.state='idle';this.startedAt=0;this.lastFrame=-1;this.raf=0;this.token=0;this.running=false;this.locked=false;this.assetError=null;
    for(const [state,def] of Object.entries(animations))S().validateAnimation({...def,state});
  }
  priority(state){return S().stateSpec(state).priority}
  definition(state=this.state){const def=this.animations[state];if(!def)throw Error('Missing animation: '+state);return def}
  canInterrupt(next){
    if(this.state==='dead')return false;
    const cur=this.definition(this.state),curSpec=S().stateSpec(this.state);
    if(curSpec.loop)return true;
    return this.priority(next)>=this.priority(this.state);
  }
  async preload(state=null){
    const defs=state?[this.definition(state)]:Object.values(this.animations);
    await Promise.all(defs.flatMap(d=>d.frames.map(load)));return true;
  }
  play(state,{force=false,now=performance.now()}={}){
    if(!this.animations[state])throw Error('Unknown animation: '+state);
    if(!force&&!this.canInterrupt(state))return false;
    this.state=state;this.startedAt=Math.round(now);this.lastFrame=-1;this.assetError=null;this.token++;this.onState?.(state);
    this.running=true;cancelAnimationFrame(this.raf);const token=this.token;this.raf=requestAnimationFrame(()=>this.loop(token));
    return true;
  }
  stop(){this.running=false;this.token++;cancelAnimationFrame(this.raf)}
  loop(token){
    if(!this.running||token!==this.token)return;
    this.tick(performance.now()).finally(()=>{if(this.running&&token===this.token)this.raf=requestAnimationFrame(()=>this.loop(token));});
  }
  async tick(now){
    const def=this.definition(),frameMs=1000/def.fps,elapsed=Math.max(0,now-this.startedAt),raw=Math.floor(elapsed/frameMs),last=def.frames.length-1;
    let index=def.loop?raw%def.frames.length:Math.min(raw,last);
    if(index!==this.lastFrame){
      const from=this.lastFrame<0?0:this.lastFrame+1;
      for(let f=from;f<=index;f++)for(const evt of def.events||[])if(evt.frame===f)this.onEvent?.({...evt,state:this.state});
      this.lastFrame=index;
    }
    try{
      const img=await load(def.frames[index]);this.draw(img,0,0);
    }catch(error){this.assetError=error;this.canvas.dataset.assetStatus='missing';}
    if(!def.loop&&raw>=def.frames.length){
      if(this.state!=='dead'&&this.animations.idle)this.play('idle',{force:true,now});
      else this.stop();
    }
  }
  draw(img,x=0,y=0){
    S().assertIntegerPoint(x,y);
    if(img.naturalWidth!==this.width||img.naturalHeight!==this.height)throw Error('Pixel frame native size mismatch: expected '+this.width+'x'+this.height+', got '+img.naturalWidth+'x'+img.naturalHeight);
    const ctx=this.canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,this.width,this.height);ctx.drawImage(img,Math.round(x),Math.round(y));this.canvas.dataset.assetStatus='ready';this.canvas.dataset.animationState=this.state;this.canvas.dataset.frame=String(this.lastFrame);
  }
}
root.SHUTPixelRuntime={PixelAnimator,prepareCanvas,load};
if(typeof module!=='undefined')module.exports=root.SHUTPixelRuntime;
})(globalThis);
