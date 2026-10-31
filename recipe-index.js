'use strict';
(()=>{
 const search=document.getElementById('search'),buttons=[...document.querySelectorAll('.filter')],cards=[...document.querySelectorAll('.recipe-card')];
 const names=buttons.map(button=>button.dataset.category),initial=new URLSearchParams(location.search).get('category');let category=names.includes(initial)?initial:'All';
 const normalise=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){let count=0;const q=normalise(search.value.trim());for(const card of cards){card.hidden=!((category==='All'||card.dataset.category===category)&&normalise(card.dataset.search).includes(q));if(!card.hidden)count++;}for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.category===category));document.getElementById('result-title').textContent=category==='All'?'Recipes':category;document.getElementById('count').textContent=count+' recipe'+(count===1?'':'s')+(q?' found':'');document.getElementById('empty').hidden=count!==0;}
 buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;render();}));search.addEventListener('input',render);document.getElementById('reset-search').addEventListener('click',()=>{category='All';search.value='';render();});render();
})();
