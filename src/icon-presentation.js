/* Display-only adapter. Historical assets are allowed only in explicit compatibility UI. */
(() => {
  const attributes={fire:'assets/attr-fire.svg',water:'assets/attr-water.svg',thunder:'assets/attr-thunder.svg',earth:'assets/attr-earth.svg',wind:'assets/attr-wind.svg'};
  const rewards={eggCommon:'assets/reward-egg-common.png',eggRare:'assets/reward-egg-rare.png',key:'assets/reward-gate-key.png',item:'assets/reward-item-drop.png'};
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function attribute(id,label,short,extra='',legacy=false){
    const asset=legacy&&attributes[id];
    return `<span class="attrIcon ${asset?'':'attrTextIcon'} attrIcon-${escape(id)} ${escape(extra)}" role="img" aria-label="${escape(label)}" title="${escape(label)}" data-asset-status="${asset?'legacy-compatibility':'pending'}">${asset?`<img class="attrIconImage" src="${asset}" alt="" aria-hidden="true">`:`<b aria-hidden="true">${escape(short)}</b>`}</span>`;
  }
  function reward(kind,rarity=1,extra='',legacy=false){
    const key=kind==='egg'?(rarity>=4?'eggRare':'eggCommon'):kind;
    if(!rewards[key])return '';
    const label=globalThis.SHUTI18n.t('graphics.rewardLabel.'+key);
    if(legacy)return `<img class="rewardPixelIcon ${escape(extra)}" src="${rewards[key]}" alt="${escape(label)}" data-asset-status="legacy-compatibility">`;
    return `<span class="rewardText ${escape(extra)}" role="img" aria-label="${escape(label)}${kind==='egg'?' ★'+rarity:''}" data-reward-kind="${key}" data-asset-status="pending"><span aria-hidden="true">${escape(label)}</span></span>`;
  }
  globalThis.SHUTIconPresentation={attribute,reward};
})();
