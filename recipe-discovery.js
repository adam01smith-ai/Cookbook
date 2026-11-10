(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.RecipeDiscovery=api;api.mount();}})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function normalise(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/\bground beef\b/g,'beef mince').replace(/\bminced\b/g,'mince').replace(/\bbell peppers?\b/g,'pepper').replace(/\bcilantro\b/g,'coriander').replace(/\bscallions?\b/g,'spring onion').replace(/\bzucchini\b/g,'courgette').replace(/\beggplants?\b/g,'aubergine').replace(/\bshrimps?\b/g,'prawn').replace(/\bchili(?:es|s)?\b/g,'chilli')
 .replace(/\b(tomatoes|potatoes|chillies)\b/g,word=>({tomatoes:'tomato',potatoes:'potato',chillies:'chilli'}[word]))
 .replace(/\b([a-z]{3,})ies\b/g,'$1y').replace(/\b([a-z]{3,})s\b/g,'$1');}
const ignored=new Set(['and','with','the','a','an','or']);
function terms(value){return [...new Set((normalise(value).match(/[a-z0-9]+/g)||[]).filter(word=>!ignored.has(word)))];}
function has(text,word){return (' '+text.replace(/[^a-z0-9]+/g,' ')+' ').includes(' '+word+' ');}
function ingredientMatches(ingredients,word,context=[]){return ingredients.some(raw=>{let ingredient=normalise(raw);if((word==='chicken'||word==='beef')&&!context.some(w=>w==='stock'||w==='broth'))ingredient=ingredient.replace(new RegExp('\\b'+word+'\\s+(?:stock|broth)\\b','g'),'');if(word==='rice'&&!context.some(w=>['vinegar','wine','flour'].includes(w)))ingredient=ingredient.replace(/\brice\s+(?:wine\s+)?vinegar\b|\brice\s+(?:wine|flour)\b/g,'');if(word==='pasta'&&['spaghetti','rigatoni','penne','tagliatelle','macaroni','orzo','pastina','ziti','lasagne','cannelloni','fusilli'].some(type=>has(ingredient,type)))return true;if(word==='noodle'&&['udon','ramen','soba','vermicelli'].some(type=>has(ingredient,type)))return true;return has(ingredient,word);});}
function matches(recipe,search,ingredients,time='any',category='All'){
 if(category!=='All'&&recipe.category!==category&&!recipe.collections.includes(category))return false;
 const words=(normalise(recipe.search+' '+recipe.collections.join(' ')).match(/[a-z0-9]+/g)||[]),searchTerms=terms(search),ingredientTerms=terms(ingredients);if(!searchTerms.every(word=>words.some(value=>value.startsWith(word))||ingredientMatches(recipe.ingredients,word,searchTerms)))return false;
 if(!ingredientTerms.every(word=>ingredientMatches(recipe.ingredients,word,ingredientTerms)))return false;
 if(time==='long')return recipe.makeAhead||(recipe.minMinutes!==null&&recipe.minMinutes>60);
 if(time!=='any')return recipe.maxMinutes!==null&&recipe.maxMinutes<=Number(time);
 return true;
}
function mount(){
 function start(){
 const grid=document.querySelector('.recipe-grid'),search=document.getElementById('search')||document.getElementById('favourites-search'),ingredients=document.getElementById('recipe-ingredients'),time=document.getElementById('recipe-time');if(!grid||!search||!ingredients||!time||grid.dataset.discoveryReady)return;grid.dataset.discoveryReady='true';
 const favourites=!!document.querySelector('[data-favourites-page]'),buttons=[...document.querySelectorAll('.filter')],title=document.getElementById('result-title'),allTitle=title?.textContent,count=document.getElementById(favourites?'favourites-count':'count'),empty=document.getElementById(favourites?'favourites-empty':'empty'),reset=document.getElementById('discovery-reset');
 const initial=new URLSearchParams(location.search).get('category');let category=buttons.some(b=>b.dataset.category===initial)?initial:'All';
 const cards=[...grid.querySelectorAll('.recipe-card')].map(card=>{let list=[];try{list=JSON.parse(card.dataset.ingredients);}catch{}const value=key=>card.dataset[key]===''||card.dataset[key]===undefined?null:Number(card.dataset[key]);return {card,category:card.dataset.category,search:card.dataset.search||card.textContent,ingredients:Array.isArray(list)?list:[],minMinutes:value('minMinutes'),maxMinutes:value('maxMinutes'),makeAhead:card.dataset.makeAhead==='true',collections:(card.dataset.collections||'').split('|')};});
 let queued=false;
 function render(){queued=false;let visible=0,saved=0;for(const recipe of cards){const allowed=!favourites||recipe.card.querySelector('.favourite-button')?.getAttribute('aria-pressed')==='true';if(allowed)saved++;const show=allowed&&matches(recipe,search.value,ingredients.value,time.value,category);if(recipe.card.hidden===show)recipe.card.hidden=!show;if(show)visible++;}
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.category===category));if(title)title.textContent=category==='All'?allTitle:category;
  const active=!!(search.value.trim()||ingredients.value.trim()||time.value!=='any'||category!=='All');if(count)count.textContent=visible+' recipe'+(visible===1?'':'s')+(active?' found':'');reset.disabled=!active;
  if(empty){empty.hidden=visible>0;empty.querySelector('h2').textContent=favourites&&saved===0?'No favourites yet':'No recipes match your filters';empty.querySelector('p').textContent=favourites&&saved===0?'Tap the heart on a recipe to save it here.':'Try fewer ingredients, more time or another category.';}
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(render);}}
 function clear(){search.value='';ingredients.value='';time.value='any';category='All';render();search.focus();}
 search.addEventListener('input',schedule);ingredients.addEventListener('input',schedule);time.addEventListener('change',schedule);reset.addEventListener('click',clear);document.getElementById('reset-search')?.addEventListener('click',clear);
 buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;render();}));
 if(favourites){
  // Saved-heart state comes from the existing favourites feature, including its
  // in-memory fallback when browser storage is unavailable.
  new MutationObserver(schedule).observe(grid,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
  document.addEventListener('input',event=>{if(event.target===search)schedule();});document.addEventListener('click',event=>{if(event.target.closest('.favourite-button'))schedule();});window.addEventListener('storage',schedule);window.addEventListener('pageshow',schedule);
 }
 render();if(initial&&category!=='All')document.getElementById('all-recipes')?.scrollIntoView();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return {normalise,terms,ingredientMatches,matches,mount};
});
