(()=>{
'use strict';
const KEY='adam-cooks-consent-v1',VERSION=1,AGE=180*24*60*60*1000;
const KEYS={planner:'my-cookbook-planner-v1',drafts:'adam-cooks-pantry-v1'};
const denied=()=>({version:VERSION,planner:false,drafts:false,decided:false,expires:0});
function parse(raw){try{const v=JSON.parse(raw);return v&&v.version===VERSION&&v.decided===true&&typeof v.planner==='boolean'&&typeof v.drafts==='boolean'&&Number.isFinite(v.expires)&&v.expires>Date.now()&&v.expires<=Date.now()+AGE+60000?v:denied();}catch{return denied();}}
let choice;try{choice=parse(localStorage.getItem(KEY));}catch{choice=denied();}
let banner,dialog,feedback,returnFocus;
function current(){if(choice.decided&&choice.expires<=Date.now())choice=denied();return choice;}
function allowed(category){return Object.hasOwn(KEYS,category)&&current()[category]===true;}
function announce(){window.dispatchEvent(new CustomEvent('adam-cooks-consentchange',{detail:{planner:allowed('planner'),drafts:allowed('drafts')}}));}
function choose(planner,drafts){choice={version:VERSION,decided:true,planner:!!planner,drafts:!!drafts,expires:Date.now()+AGE};let persisted=true;try{localStorage.setItem(KEY,JSON.stringify(choice));}catch{persisted=false;}update();announce();if(feedback)feedback.textContent=persisted?'Privacy choices saved.':'Your browser could not save the choice. It applies to this visit.';}
function update(){if(banner)banner.hidden=current().decided;if(dialog){document.getElementById('privacy-planner').checked=allowed('planner');document.getElementById('privacy-drafts').checked=allowed('drafts');}}
function open(){returnFocus=document.activeElement;update();dialog.showModal();}
window.CookbookPrivacy={allowed,open,storage:{get(category,key){if(!allowed(category)||KEYS[category]!==key)return null;return localStorage.getItem(key);},set(category,key,value){if(!allowed(category)||KEYS[category]!==key)return false;localStorage.setItem(key,value);return true;},remove(category,key){if(KEYS[category]===key)localStorage.removeItem(key);}}};
window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){choice=parse(event.newValue);update();announce();}});
function start(){
 const footer=document.createElement('footer');footer.className='privacy-footer';footer.innerHTML='<a href="privacy.html">Privacy &amp; storage</a><button type="button" data-privacy-open>Privacy settings</button>';document.body.append(footer);
 banner=document.createElement('section');banner.className='privacy-banner';banner.setAttribute('aria-label','Privacy choices');banner.innerHTML='<div><h2>A little privacy choice.</h2><p>May we remember your meal plans and cooking prompts on this device? Optional saving is off until you choose. You can use the site either way. <a href="privacy.html">How we use storage</a>.</p></div><div class="privacy-actions"><button type="button" data-accept>Accept optional</button><button type="button" data-reject>Reject optional</button><button type="button" data-privacy-open>Settings</button></div>';document.body.append(banner);
 dialog=document.createElement('dialog');dialog.className='privacy-dialog';dialog.setAttribute('aria-labelledby','privacy-title');dialog.innerHTML='<h2 id="privacy-title">Your privacy choices</h2><p>Choose what this device remembers. These settings do not sync between devices.</p><div class="privacy-essential"><strong>Essential: your privacy choice</strong><p>We remember this choice for up to 180 days so we do not ask on every page. No advertising identifiers.</p></div><label class="privacy-option"><input id="privacy-planner" type="checkbox"><span><strong>Remember my planner</strong><span>Save meal plans, shopping ticks, preferences and previous weeks to help avoid repeats.</span></span></label><label class="privacy-option"><input id="privacy-drafts" type="checkbox"><span><strong>Remember my cooking prompt</strong><span>Save your Vibe cooking brief, use/avoid ingredients, servings and fish preference.</span></span></label><p>Advertising and analytics are not enabled. Requesting AI ideas sends your brief to our AI service whether optional saving is on or off.</p><p>Turning saving off leaves older saved data untouched but stops this site reading or updating it. Clear it below if you want it removed.</p><div class="privacy-actions"><button type="button" data-save>Save choices</button><button type="button" data-reject>Reject optional</button><button type="button" data-close>Cancel</button></div><hr><button type="button" class="privacy-clear">Clear saved plans and prompts</button><p class="privacy-feedback" role="status" aria-live="polite"></p><a href="privacy.html">Read our privacy &amp; storage notice</a>';document.body.append(dialog);feedback=dialog.querySelector('.privacy-feedback');
 document.addEventListener('click',event=>{if(event.target.closest('[data-privacy-open]'))open();});
 banner.querySelector('[data-accept]').onclick=()=>choose(true,true);
 for(const parent of [banner,dialog])parent.querySelector('[data-reject]').onclick=()=>{choose(false,false);if(dialog.open)dialog.close();};
 dialog.querySelector('[data-save]').onclick=()=>{choose(document.getElementById('privacy-planner').checked,document.getElementById('privacy-drafts').checked);dialog.close();};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>returnFocus?.focus());
 dialog.querySelector('.privacy-clear').onclick=()=>{if(!window.confirm('Delete saved meal plans, shopping ticks, previous weeks and cooking prompts from this device? This cannot be undone. Your current open page stays usable.'))return;choose(false,false);try{for(const key of Object.values(KEYS))localStorage.removeItem(key);feedback.textContent='Saved plans and prompts cleared from this device. Optional saving is off.';}catch{feedback.textContent='Your browser prevented clearing storage. Use its site data settings to remove it.';}};
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
