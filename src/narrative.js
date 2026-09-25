// A small dialogue player, independent of combat state. Completion is called once.
globalThis.SHUTNarrative=function({data,read,mark,apply,onChange}){
 const $=id=>document.getElementById(id);let queue=[],index=0,done=null,auto=false,timer=null;
 function stopTimer(){clearTimeout(timer);timer=null;}
 function render(){stopTimer();const item=queue[index];if(!item){$('dialogueOverlay').classList.remove('show');const cb=done;done=null;onChange(false);if(cb)cb();return;}
  const {event,line}=item,p=data.presentation.portraits[line.speaker];$('dialogueOverlay').classList.add('show');$('dialogueOverlay').dataset.position=line.position||'left';$('dialogueSpeaker').textContent=line.speaker;$('dialogueText').textContent=line.text;$('dialogueChapter').textContent=event.title;$('dialogueCount').textContent=`${index+1} / ${queue.length}`;
  const img=$('dialoguePortrait');img.hidden=!p;if(p)SHUTArt.portrait(img,p.expressions?.[line.expression]||p);img.dataset.placeholder=String(p?.placeholder??true);$('dialogueMonogram').hidden=!!p;$('dialogueMonogram').textContent=line.speaker.charAt(0);
  $('dialogueSkip').textContent=read(event.event_id)?'既読スキップ':'スキップ';$('dialogueAuto').textContent=auto?'AUTO ON':'AUTO';if(auto)timer=setTimeout(next,Math.max(1800,line.text.length*65));
 }
 function next(){const item=queue[index];if(!item)return;if(!queue[index+1]||queue[index+1].event!==item.event){mark(item.event.event_id);apply(item.event);}index++;render();}
 function skip(){stopTimer();const unique=new Map(queue.slice(index).map(x=>[x.event.event_id,x.event]));for(const e of unique.values()){mark(e.event_id);apply(e)}index=queue.length;render();}
 $('dialogueNext').onclick=next;$('dialogueSkip').onclick=skip;$('dialogueAuto').onclick=()=>{auto=!auto;render()};
 return {get active(){return !!done},next,skip,play(events,callback){stopTimer();queue=events.flatMap(event=>(event.lines||[{speaker:event.speaker,text:event.summary}]).map(line=>({event,line})));index=0;done=callback;auto=false;if(queue.length)onChange(true);render()}};
};
