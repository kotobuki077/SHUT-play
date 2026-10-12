/* Compatibility drawing helpers. Legacy assets are never current production art. */
globalThis.SHUTArt={
 images:{},
 requests:new Map(),
 canvasRequests:new WeakMap(),
 image(src,callback){
  let request=this.requests.get(src);
  if(!request){
   const img=new Image();request={img,status:'loading',callbacks:[]};this.requests.set(src,request);this.images[src]=img;
   img.addEventListener('load',()=>{request.status=img.naturalWidth?'ready':'error';const callbacks=request.callbacks.splice(0);if(request.status==='ready')for(const cb of callbacks)cb(img);},{once:true});
   img.addEventListener('error',()=>{request.status='error';request.callbacks.length=0;},{once:true});img.src=src;
  }
  if(request.status==='ready')callback(request.img);else if(request.status==='loading')request.callbacks.push(callback);
  return request.img;
 },
 render(canvas,src,draw){
  if(!canvas)return;const token={};this.canvasRequests.set(canvas,token);
  this.image(src,img=>{if(canvas.isConnected&&this.canvasRequests.get(canvas)===token)draw(img)});
 },
 pending(canvas){
  if(!canvas)return;this.canvasRequests.set(canvas,{});canvas.style.backgroundImage='none';canvas.dataset.assetStatus='pending';canvas.dataset.artDomain='plant-gardener';const label=globalThis.SHUTI18n?.t('graphics.backgroundPending')||'PIXEL ART PENDING';canvas.setAttribute('aria-label',label);
  const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;c.save();c.fillStyle='#c4cbd1';c.textAlign='center';c.textBaseline='middle';const size=Math.max(8,Math.min(16,Math.floor(canvas.width/8)));c.font=size+'px sans-serif';c.fillText(label.split(' ').slice(0,2).join(' '),Math.floor(canvas.width/2),Math.floor(canvas.height/2-size*.65));c.fillText(label.split(' ').slice(2).join(' '),Math.floor(canvas.width/2),Math.floor(canvas.height/2+size*.65));c.restore();
 },
 drawCell(canvas,img,p,padding=.08){if(!canvas||!img?.naturalWidth||!img?.naturalHeight)return;const c=canvas.getContext('2d'),cols=p.columns||1,rows=p.rows||1,col=p.cell%cols,row=Math.floor(p.cell/cols),inset=Math.max(0,p.cellInset||0),sx=Math.round(col*img.naturalWidth/cols)+inset,sy=Math.round(row*img.naturalHeight/rows)+inset,ex=Math.round((col+1)*img.naturalWidth/cols)-inset,ey=Math.round((row+1)*img.naturalHeight/rows)-inset,sw=ex-sx,sh=ey-sy,raw=p.pixelPerfect?Math.min(canvas.width/sw,canvas.height/sh):Math.min(canvas.width*(1-2*padding)/sw,canvas.height*(1-2*padding)/sh),scale=p.pixelPerfect?(raw>=1?Math.max(1,Math.floor(raw)):raw>=.5?.5:.25):raw,width=sw*scale,height=sh*scale;c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;c.drawImage(img,sx,sy,sw,sh,Math.round((canvas.width-width)/2),Math.round((canvas.height-height)/2),width,height);if(p.cleanDetached)this.cleanDetached(canvas);},
 cleanDetached(canvas){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,image=c.getImageData(0,0,w,h),a=image.data,seen=new Uint8Array(w*h),groups=[];for(let n=0;n<w*h;n++){if(seen[n]||a[n*4+3]<24)continue;const stack=[n],group=[];seen[n]=1;while(stack.length){const q=stack.pop(),x=q%w,y=Math.floor(q/w);group.push(q);for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const z=yy*w+xx;if(!seen[z]&&a[z*4+3]>=24){seen[z]=1;stack.push(z)}}}groups.push(group)}const largest=Math.max(0,...groups.map(g=>g.length)),minimum=Math.max(12,Math.floor(largest*.018));for(const group of groups)if(group.length<minimum)for(const q of group){a[q*4]=a[q*4+1]=a[q*4+2]=a[q*4+3]=0}c.putImageData(image,0,0);},
 portrait(canvas,p){if(!canvas||!p)return;canvas.dataset.expressionCell=p.cell;canvas.dataset.assetStatus=p.status;canvas.dataset.artDomain='legacy-compatibility';this.render(canvas,p.src,img=>this.drawCell(canvas,img,p,.10));},
 ready:Promise.resolve()
};
