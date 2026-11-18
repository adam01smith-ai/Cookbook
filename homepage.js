(()=>{
'use strict';
const toggle=document.querySelector('.home-menu-toggle'),nav=document.getElementById('home-navigation'),mobile=matchMedia('(max-width:767px)');function menu(open){toggle.setAttribute('aria-expanded',String(open));nav.hidden=mobile.matches&&!open;}function resize(){menu(!mobile.matches)}resize();mobile.addEventListener('change',resize);toggle.addEventListener('click',()=>menu(toggle.getAttribute('aria-expanded')!=='true'));nav.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile.matches){menu(false);toggle.focus();}});
function handleBookmark() {
  if (!['#all-recipes', '#search'].includes(location.hash)) return;
  if (document.querySelector('.home-hero')) location.replace('recipes.html' + location.hash);
  else if (location.hash === '#search') document.querySelector('input#search')?.focus();
}
addEventListener('hashchange', handleBookmark);
handleBookmark();
})();
