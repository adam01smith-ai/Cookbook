(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CookbookPersonalStore=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function validate(data,known){if(!data||data.version!==1||!Array.isArray(data.collections)||data.collections.length>30)throw Error('This is not a valid collections backup.');const ids=new Set();const collections=data.collections.map(c=>{if(!c||typeof c.id!=='string'||!/^[a-z0-9-]{8,64}$/i.test(c.id)||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.trim().length>60||!Array.isArray(c.files)||c.files.length>known.size||!c.files.every(f=>typeof f==='string'&&known.has(f)))throw Error('The collections data contains invalid names or recipes.');ids.add(c.id);return {id:c.id,name:c.name.trim(),files:[...new Set(c.files)]};});return {version:1,collections};}
function merge(current,incoming,known){const a=validate(current,known),b=validate(incoming,known);for(const item of b.collections){const existing=a.collections.find(c=>c.id===item.id||c.name.toLowerCase()===item.name.toLowerCase());if(existing)existing.files=[...new Set([...existing.files,...item.files])];else a.collections.push(item);}return validate(a,known);}
function recent(raw,known){try{const data=JSON.parse(raw);return data?.version===1&&Array.isArray(data.files)?[...new Set(data.files.filter(f=>known.has(f)))].slice(0,8):[];}catch{return [];}}
function viewed(files,file){return [file,...files.filter(f=>f!==file)].slice(0,8);}
return {validate,merge,recent,viewed};
});
