(()=>{
'use strict';
const KEY='adam-cooks-favourites-v1';
const valid=file=>typeof file==='string'&&/^[\w -]+\.html$/.test(file);
const parse=raw=>{try{const data=JSON.parse(raw);return new Set(Array.isArray(data)?data.filter(valid):[]);}catch{return new Set();}};
let saved;try{saved=parse(localStorage.getItem(KEY));}catch{saved=new Set();}
function start(){
 const page=document.querySelector('[data-favourites-page]'),controls=[];
 const status=document.createElement('p');status.className='favourites-status sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);
 const nav=document.querySelector('.site-nav');if(nav&&!nav.querySelector('a[href="cookbook.html"]')){const a=document.createElement('a');a.href='cookbook.html';a.textContent='My cookbook';if(page||document.querySelector('[data-personal-page]'))a.setAttribute('aria-current','page');nav.append(a);}
 const fileFor=href=>{try{const u=new URL(href,location.href);if(u.origin!==location.origin)return null;const file=decodeURIComponent(u.pathname.split('/').pop());return valid(file)?file:null;}catch{return null;}};
 const normalise=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){
  for(const {button,file,name} of controls){const on=saved.has(file);button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',(on?'Remove '+name+' from':'Save '+name+' to')+' favourites');button.querySelector('span').textContent=on?'Saved':'Save';}
  if(page){let count=0;const q=normalise(document.getElementById('favourites-search').value.trim());for(const card of page.querySelectorAll('.recipe-card')){card.hidden=!(saved.has(fileFor(card.querySelector('.card-link').getAttribute('href')))&&normalise(card.dataset.search).includes(q));if(!card.hidden)count++;}document.getElementById('favourites-count').textContent=count+' recipe'+(count===1?'':'s');const empty=document.getElementById('favourites-empty');empty.hidden=count>0;empty.querySelector('h2').textContent=q?'No favourites match':'No favourites yet';empty.querySelector('p').textContent=q?'Try another search.':'Tap the heart on a recipe to save it here.';}
 }
 function add(parent,file,name,card){if(!valid(file))return;const button=document.createElement('button');button.type='button';button.className='favourite-button'+(card?' favourite-card':'');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>Save</span>';parent.append(button);controls.push({button,file,name});button.addEventListener('click',()=>{const removing=saved.has(file);try{saved=parse(localStorage.getItem(KEY));}catch{}if(removing)saved.delete(file);else saved.add(file);let persisted=true;try{localStorage.setItem(KEY,JSON.stringify([...saved]));}catch{persisted=false;}render();status.textContent=name+(removing?' removed from favourites.':' saved to favourites.')+(persisted?'':' Your browser could not save this for later; it applies to this page only.');if(page&&removing)document.getElementById('favourites-search').focus();});}
 document.querySelectorAll('.recipe-card').forEach(card=>{const a=card.querySelector('.card-link');if(a)add(card,fileFor(a.getAttribute('href')),card.querySelector('h2,h3')?.textContent||a.textContent.trim(),true);});
 const recipe=document.querySelector('.recipe-main');if(recipe){const target=recipe.querySelector('.recipe-top')||recipe.querySelector('.recipe-intro');if(target)add(target,fileFor(location.href),recipe.querySelector('h1').textContent,false);}
 document.getElementById('favourites-search')?.addEventListener('input',render);
 window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){saved=parse(event.newValue);render();}});
 window.addEventListener('pageshow',()=>{try{saved=parse(localStorage.getItem(KEY));render();}catch{}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
