'use strict';
(()=>{
 const feature=document.querySelector?.('.home-feature'),featured=globalThis.COOKBOOK_FEATURED_RECIPES||[];
 if(feature&&featured.length){
  const image=feature.querySelector('img'),link=feature.querySelector('.action-link'),next=document.getElementById('next-featured');
  let bag=[],ticket=0,current=link.getAttribute('href');
  function pick(){if(!bag.length){bag=featured.slice();for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.length>1&&bag[bag.length-1].file===current)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];}return bag.pop();}
  async function rotate(manual=false){const id=++ticket;for(let attempts=0;attempts<featured.length;attempts++){const recipe=pick(),preload=new Image();preload.src=recipe.image;try{await preload.decode();}catch{if(id!==ticket)return;continue;}if(id!==ticket)return;current=recipe.file;feature.querySelector('.eyebrow').textContent=recipe.category;document.getElementById('featured-title').textContent=recipe.name;const description=feature.querySelector('.feature-description');description.textContent=recipe.description;description.hidden=!recipe.description;feature.querySelector('.feature-details').textContent=(recipe.cook?'Cook '+recipe.cook+' · ':'')+'Serves '+recipe.servings;link.setAttribute('href',recipe.file);image.src=recipe.image;image.alt=recipe.name+' — AI-generated illustration';if(manual)document.getElementById('featured-status').textContent='Featured recipe: '+recipe.name;return;}}
  if(next){next.hidden=false;next.addEventListener('click',()=>rotate(true));}
  rotate();window.addEventListener('pageshow',event=>{if(event.persisted)rotate();});
 }

 const search=document.getElementById('search'),buttons=[...document.querySelectorAll('.filter')],cards=[...document.querySelectorAll('.recipe-card')];
 const names=buttons.map(button=>button.dataset.category),initial=new URLSearchParams(location.search).get('category');let category=names.includes(initial)?initial:'All';
 const normalise=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){let count=0;const q=normalise(search.value.trim());for(const card of cards){card.hidden=!((category==='All'||card.dataset.category===category)&&normalise(card.dataset.search).includes(q));if(!card.hidden)count++;}for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.category===category));document.getElementById('result-title').textContent=category==='All'?'All recipes':category;document.getElementById('count').textContent=count+' recipe'+(count===1?'':'s')+(q?' found':'');document.getElementById('empty').hidden=count!==0;}
 buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;render();}));search.addEventListener('input',render);document.getElementById('reset-search').addEventListener('click',()=>{category='All';search.value='';render();});render();if(initial&&names.includes(initial))document.getElementById('all-recipes')?.scrollIntoView?.();
})();

