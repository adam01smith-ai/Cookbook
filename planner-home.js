(()=>{
'use strict';const P=window.CookbookPlanner,catalog=window.COOKBOOK_RECIPES,$=id=>document.getElementById(id),privacy=window.CookbookPrivacy;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved=null,lastIdea='';
function load(){saved=null;$('home-current-week').hidden=true;try{const raw=privacy?.storage.get('planner','my-cookbook-planner-v1');if(!raw)return;saved=P.validate(JSON.parse(raw),catalog);const first=P.parseDate(saved.week),today=P.parseDate(P.localDate(new Date())),index=Math.round((today-first)/86400000);$('home-week-title').textContent=(saved.confirmed?'Your confirmed week':'Your saved draft')+' · '+first.toLocaleDateString('en-GB',{day:'numeric',month:'short'});$('home-tonight-copy').textContent=index>=0&&index<7?'Tonight: '+P.mealTitle(saved.days[index],catalog,saved.days):'This saved plan is for another week. Open it to choose your next dates.';$('home-week-links').innerHTML=saved.days.map((d,i)=>{const r=d.type==='recipe'?catalog.find(r=>r.id===d.recipeId):null;return r?'<a href="'+esc(r.file)+'">'+esc(P.parseDate(P.addDays(saved.week,i)).toLocaleDateString('en-GB',{weekday:'short'})+' · '+r.name)+'</a>':'';}).join('');$('home-current-week').hidden=false;}catch{ /* Never replace a damaged or older saved plan from the homepage. */ }}
function idea(different){
 const state=saved?P.clone(saved):P.initial(),today=P.localDate(new Date());state.week=P.monday(today);state.maxMinutes=different?0:30;
 let pool=P.eligible(state,catalog).filter(r=>(!state.maxMinutes||r.planningMinutes&&r.planningMinutes<=state.maxMinutes)&&r.id!==lastIdea&&!state.days.some(d=>d.type==='recipe'&&d.recipeId===r.id));
 if(different){const untried=pool.filter(r=>!window.CookbookIntelligence.tried(state,r.id));if(untried.length)pool=untried;}
 const box=$('home-dinner-result');box.hidden=false;
 if(!pool.length){box.textContent='No fresh dinner matches these preferences. Open the planner to adjust your time or repeat settings.';return;}
 const r=pool[Math.floor(Math.random()*pool.length)],m=P.describe(r);lastIdea=r.id;box.innerHTML='<img src="'+esc(r.image)+'" alt="'+esc(r.name)+'"><h2>'+esc(r.name)+'</h2><p>'+esc([m.cuisine,m.totalMinutes?(m.timeEstimated?'About ':'')+m.totalMinutes+' minutes total':null].filter(Boolean).join(' · '))+'</p><p><a href="'+esc(r.file)+'">Cook this tonight →</a></p><p class="discovery-help">An idea to explore. Your saved week and shopping list are unchanged.</p>';
}
$('home-tonight').onclick=e=>{e.preventDefault();if(saved){const i=Math.round((P.parseDate(P.localDate(new Date()))-P.parseDate(saved.week))/86400000);if(i>=0&&i<7&&saved.days[i].type!=='empty'){$('home-dinner-result').hidden=false;const d=saved.days[i],source=d.type==='leftovers'?saved.days[d.source]:d,r=catalog.find(r=>r.id===source?.recipeId);$('home-dinner-result').innerHTML='<h2>Tonight in your plan</h2><p>'+esc(P.mealTitle(d,catalog,saved.days))+'</p>'+(r?'<a href="'+esc(r.file)+'">Open recipe →</a>':'<a href="meal-planner.html">Open your plan →</a>');return;}}idea(false);};
$('home-different').onclick=e=>{e.preventDefault();idea(true);};
window.addEventListener('adam-cooks-consentchange',load);window.addEventListener('storage',e=>{if(e.key==='my-cookbook-planner-v1'||e.key===null)load();});window.addEventListener('pageshow',load);load();
})();
