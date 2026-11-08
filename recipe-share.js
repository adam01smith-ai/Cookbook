(()=>{
'use strict';
function start(){
 const recipe=document.querySelector('.recipe-main'),top=recipe?.querySelector('.recipe-top');if(!top||top.querySelector('[data-share-recipe]'))return;
 const title=recipe.querySelector('h1').textContent.trim();
 let url;try{const candidate=new URL(document.querySelector('link[rel="canonical"]')?.href||location.href);candidate.search='';candidate.hash='';if(candidate.protocol!=='https:'||candidate.hostname!=='www.adamcooks.co.uk')return;url=candidate.href;}catch{return;}
 const button=document.createElement('button');button.type='button';button.className='outline recipe-share-button';button.dataset.shareRecipe='';button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8"/></svg>Share recipe';top.append(button);
 const dialog=document.createElement('dialog');dialog.className='recipe-share-dialog';dialog.setAttribute('aria-labelledby','share-recipe-title');
 dialog.innerHTML='<h2 id="share-recipe-title">Share this recipe</h2><p class="share-recipe-name"></p><label for="share-recipe-url">Recipe link</label><input id="share-recipe-url" type="url" readonly><div class="share-actions"><button type="button" class="primary" data-copy-link>Copy link</button><button type="button" class="outline" data-share-close>Close</button></div><p class="share-feedback" role="status" aria-live="polite"></p>';document.body.append(dialog);
 dialog.querySelector('.share-recipe-name').textContent=title;const input=dialog.querySelector('input');input.value=url;
 function fallback(){dialog.querySelector('.share-feedback').textContent='';dialog.showModal();dialog.querySelector('[data-copy-link]').focus();}
 button.addEventListener('click',async()=>{if(typeof navigator.share==='function'){try{await navigator.share({title,url});return;}catch(error){if(error.name==='AbortError')return;}}fallback();});
 dialog.querySelector('[data-copy-link]').addEventListener('click',async()=>{const feedback=dialog.querySelector('.share-feedback');try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(url);feedback.textContent='Recipe link copied. Paste it into a message or social post.';}catch{input.focus();input.select();feedback.textContent='Select and copy the link above, then paste it into your message.';}});
 dialog.querySelector('[data-share-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>button.focus());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
