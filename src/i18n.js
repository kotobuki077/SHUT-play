(() => {
  const dictionaries=globalThis.SHUT_LOCALES||{};
  const storageKey='shut_language';
  const supported=['ja','en'];
  const normalize=value=>supported.includes(value)?value:'ja';
  const lookup=(object,key)=>key.split('.').reduce((value,part)=>value&&typeof value==='object'?value[part]:undefined,object);
  const interpolate=(text,values)=>text.replace(/\{([^}]+)\}/g,(_,key)=>values[key]??`{${key}}`);
  let language='ja';
  try{language=normalize(localStorage.getItem(storageKey)||document.documentElement.lang)}catch{}
  const listeners=new Set();

  function t(key,values={}){
    const translated=lookup(dictionaries[language],key);
    const fallback=translated===undefined?lookup(dictionaries.ja,key):translated;
    return interpolate(typeof fallback==='string'?fallback:key,values);
  }
  function apply(root=document){
    document.documentElement.lang=language;
    root.querySelectorAll('[data-i18n]').forEach(node=>node.textContent=t(node.dataset.i18n));
    root.querySelectorAll('[data-i18n-aria-label]').forEach(node=>node.setAttribute('aria-label',t(node.dataset.i18nAriaLabel)));
    root.querySelectorAll('[data-i18n-title]').forEach(node=>node.setAttribute('title',t(node.dataset.i18nTitle)));
  }
  function setLanguage(next){
    const normalized=normalize(next);
    language=normalized;
    try{localStorage.setItem(storageKey,normalized)}catch{}
    apply();
    listeners.forEach(listener=>listener(normalized));
    return normalized;
  }
  function onChange(listener){listeners.add(listener);return()=>listeners.delete(listener)}

  globalThis.SHUTI18n={t,apply,setLanguage,onChange,get language(){return language},supported:[...supported],storageKey};
  apply();
})();
