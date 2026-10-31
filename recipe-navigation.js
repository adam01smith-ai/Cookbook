'use strict';
(()=>{
 const links=[...document.querySelectorAll('.recipe-jumps a')];
 function mark(id){links.forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
 links.forEach(link=>link.addEventListener('click',()=>mark(link.hash.slice(1))));mark('ingredients-heading');
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)mark(entry.target.id);},{rootMargin:'-10% 0px -65% 0px',threshold:0});links.forEach(link=>{const target=document.getElementById(link.hash.slice(1));if(target)observer.observe(target);});}
})();
