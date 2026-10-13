/* No current-world background has source + technical + user visual approval yet.
 * Deliberately ignore legacy master presentation paths; never substitute old art.
 * Future approved integration must follow BACKGROUND_STYLE_SPEC.md and its gate.
 */
(function(){
  'use strict';
  function resolve(){return {status:'pending',asset:null};}
  function apply(element){
    if(!element)return resolve();
    element.style.setProperty('--world','none');
    element.dataset.backgroundStatus='pending';
    return resolve();
  }
  globalThis.SHUTBackgrounds=Object.freeze({resolve,apply});
  apply(document.getElementById('app'));
  for(const id of ['homeScreen','battleScreen','closeMenuScreen','gachaScreen']){
    const screen=document.getElementById(id);if(!screen)continue;
    const label=document.createElement('span');label.className='backgroundPendingLabel';
    label.dataset.i18n='graphics.backgroundPending';
    label.textContent=globalThis.SHUTI18n.t('graphics.backgroundPending');
    screen.appendChild(label);
  }
})();
