(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./planner-metadata.js'));else root.CookbookIntelligence=factory(root.COOKBOOK_PLANNER_METADATA||{});})(typeof window!=='undefined'?window:globalThis,function(metadata){
'use strict';
const WEIGHTS={cuisine:16,protein:16,style:14,flavour:8,ingredients:12,carbohydrate:10,recent:12,effort:8,richness:4};
const INTENTS={different:'Surprise me with something different',quicker:'Something quicker',comforting:'Something comforting',lighter:'Something lighter',spicy:'Something spicy',curry:'Another curry',untried:'Something I haven’t tried recently'};
const cache=new WeakMap(),clamp=n=>Math.max(0,Math.min(1,n));
function describe(r){
 if(!r)return null;if(cache.has(r))return cache.get(r);
 const fallback={cuisine:r.cuisines?.[0]||null,primaryProtein:r.proteins?.[0]||null,secondaryProteins:(r.proteins||[]).slice(1),dishType:r.mealStyle||r.category||null,cookingMethods:[],flavours:[],carbohydrates:[],richness:null,effort:null,totalMinutes:r.planningMinutes||null,keyIngredients:[],dietary:{vegetarian:r.vegetarian===true},dependencies:[]};
 const m={...fallback,...metadata[r.id],...r.planning};cache.set(r,m);return m;
}
function memory(state,id){return state.feedback?.[id]||{};}
function recent(state,id){
 let penalty=0;const date=memory(state,id).cookedOn;
 function age(s){return (new Date(state.week+'T12:00:00')-new Date(s+'T12:00:00'))/86400000;}
 if(date){const days=age(date);if(days>=-6&&days<56)penalty=Math.max(penalty,clamp(1-Math.max(0,days)/56));}
 for(const w of state.history||[]){const days=age(w.week);if(days<=0||days>56)continue;if(w.days.some(d=>d.recipeId===id&&d.status!=='skipped'&&['recipe','leftovers'].includes(d.type)))penalty=Math.max(penalty,clamp(1-days/63));}
 return penalty;
}
function tried(state,id){if(memory(state,id).rating==='untried')return false;return memory(state,id).tried===true||!!memory(state,id).cookedOn||(state.history||[]).some(w=>w.days.some(d=>d.recipeId===id&&d.status==='cooked'));}
function similarity(a,b){const x=new Set(a||[]),y=new Set(b||[]);if(!x.size||!y.size)return null;return [...x].filter(v=>y.has(v)).length/new Set([...x,...y]).size;}
function describeDay(day,r){const m=describe(r);if(!m)return null;const carbs=m.carbohydrates.slice();const sides={rice:'rice',microRice:'rice',curry:'rice',pasta:'pasta',potatoes:'potatoes',bread:'bread'};if(sides[day.side])carbs.push(sides[day.side]);return {...m,carbohydrates:[...new Set(carbs)],recipe:r,day};}
function report(state,catalog,days=state.days){
 const byId=new Map(catalog.map(r=>[r.id,r])),allKept=days.filter(d=>d.type==='recipe').every(d=>d.locked),meals=days.map((d,i)=>d.type==='recipe'?{...describeDay(d,byId.get(d.recipeId)),i}:null).filter(m=>m&&m.recipe),n=meals.length;
 const components={},known={},notes=[],counts=values=>values.reduce((o,v)=>(v&&(o[v]=(o[v]||0)+1),o),{});
 function concentration(key,values){const a=values.filter(v=>v!=null),c=counts(a);known[key]=a.length;const fixed=counts(values.filter((v,i)=>!allKept&&meals[i]?.day.locked)),baseline=Object.values(fixed).reduce((sum,num)=>sum+Math.max(0,num-2),0),excess=Object.values(c).reduce((sum,num)=>sum+Math.max(0,num-2),0)-baseline;return a.length<2?1:clamp(1-excess/Math.max(1,a.length-2-baseline));}
 components.cuisine=concentration('cuisine',meals.map(m=>m.cuisine));
 // A mixed-protein meal contributes to every listed flesh protein, not just its title.
 const pCounts={},fixedProteins={};for(const m of meals)for(const p of [m.primaryProtein,...m.secondaryProteins].filter(Boolean)){pCounts[p]=(pCounts[p]||0)+1;if(!allKept&&m.day.locked)fixedProteins[p]=(fixedProteins[p]||0)+1;}
 known.protein=meals.filter(m=>m.primaryProtein).length;const fixedProteinExcess=Object.values(fixedProteins).reduce((s,v)=>s+Math.max(0,v-2),0);components.protein=clamp(1-(Object.values(pCounts).reduce((s,v)=>s+Math.max(0,v-2),0)-fixedProteinExcess)/Math.max(1,n-2-fixedProteinExcess));
 components.style=concentration('style',meals.map(m=>m.dishType));const methods=meals.map(m=>m.cookingMethods[0]).filter(Boolean);if(methods.length)components.style=.7*components.style+.3*concentration('method',meals.map(m=>m.cookingMethods[0]));
 const carbs=meals.map(m=>m.carbohydrates[0]||null);components.carbohydrate=concentration('carbohydrate',carbs);
 function pairQuality(field,threshold){let sum=0,pairs=0;for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){if(!allKept&&meals[a].day.locked&&meals[b].day.locked)continue;const common=similarity(meals[a][field],meals[b][field]);if(common===null)continue;sum+=clamp((common-threshold)/(1-threshold));pairs++;}known[field==='keyIngredients'?'ingredients':'flavour']=pairs;return pairs?1-sum/pairs:1;}
 components.flavour=pairQuality('flavours',.5);components.ingredients=pairQuality('keyIngredients',.35);
 const changeable=meals.filter(m=>allKept||!m.day.locked);known.recent=changeable.length;components.recent=1-changeable.reduce((s,m)=>s+recent(state,m.recipe.id),0)/Math.max(1,changeable.length);
 let paired=0,pairCount=0;for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){if(!allKept&&meals[a].day.locked&&meals[b].day.locked)continue;pairCount++;if((state.history||[]).some(w=>w.week<state.week&&((new Date(state.week)-new Date(w.week))/86400000)<=56&&[meals[a].recipe.id,meals[b].recipe.id].every(id=>w.days.some(d=>d.recipeId===id&&d.status!=='skipped'))))paired++;}if(pairCount)components.recent=clamp(components.recent-.25*paired/pairCount);
 let adjacent=0,hard=0;for(let i=1;i<n;i++)if(meals[i].i===meals[i-1].i+1&&(!meals[i].day.locked||!meals[i-1].day.locked||allKept)){adjacent++;if(meals[i].effort==='involved'&&meals[i-1].effort==='involved')hard++;}known.effort=meals.filter(m=>m.effort).length;components.effort=adjacent?1-hard/adjacent:1;
 const rich=meals.filter(m=>m.richness==='rich').length;known.richness=meals.filter(m=>m.richness).length;components.richness=clamp(1-Math.max(0,rich-Math.ceil(n/2))/Math.max(1,n-Math.ceil(n/2)));
 const available=Object.keys(WEIGHTS).filter(k=>known[k]>0),weight=available.reduce((s,k)=>s+WEIGHTS[k],0),score=n>=2?Math.round(100*available.reduce((s,k)=>s+components[k]*WEIGHTS[k],0)/(weight||1)):null;
 const cuisines=new Set(meals.map(m=>m.cuisine).filter(Boolean)).size,styles=new Set(meals.map(m=>m.dishType).filter(Boolean)).size;
 const vegetarian=meals.some(m=>m.dietary?.vegetarian&&(!state.optional||!m.recipe.ingredients.some(x=>x.optional&&/chicken|beef|pork|bacon|prawn|fish/i.test(x.template))));
 if(!allKept){for(const [carb,num] of Object.entries(counts(carbs)))if(num>2){const target=meals.find(m=>!m.day.locked&&m.carbohydrates[0]===carb);if(target)notes.push(num+' meals use '+carb+'. Try a different accompaniment or replace '+new Date(new Date(state.week+'T12:00:00').getTime()+target.i*86400000).toLocaleDateString('en-GB',{weekday:'short'})+' for more contrast.');}
 for(const [protein,num] of Object.entries(pCounts))if(num>2&&(fixedProteins[protein]||0)<num)notes.push(protein+' appears '+num+' times; another protein would add contrast.');
 if(hard)notes.push('More involved dinners are next to each other. A quicker replacement could make the week easier.');
 if(state.vegetarianTarget&&!vegetarian)notes.push('No vegetarian dinner fits this suggestion. Keep fewer meals or widen the time limit.');}
 if(meals.some(m=>!metadata[m.recipe.id]&&!m.recipe.planning))notes.push('Some recipe descriptors are missing; this score uses only the available information.');
 const kept=meals.filter(m=>m.day.locked).length;if(meals.some(m=>m.day.locked&&state.maxMinutes&&(!m.totalMinutes||m.totalMinutes>state.maxMinutes)))notes.push('A kept meal exceeds the time limit or has no reviewed time; it stays as chosen.');if(kept)notes.push(kept+' kept meal'+(kept===1?' stays':'s stay')+' exactly as chosen.');
 if(n<state.count&&days.some(d=>['out','custom','leftovers'].includes(d.type)))notes.push('Special days stay in place; only the available cooking slots receive new dinners.');
 const summary=n?cuisines+' cuisines · '+Object.keys(pCounts).length+' protein groups · '+styles+' dish styles':'Add dinners to see how the week fits together.';
 return {score,notes,cuisines,styles,proteins:Object.keys(pCounts).length,vegetarian,components,weights:WEIGHTS,coverage:Math.round(weight),summary,meals:n};
}
function preferenceBonus(state,catalog,days){const byId=new Map(catalog.map(r=>[r.id,r]));let value=0,loved=0,untried=0;for(const d of days){if(d.type!=='recipe'||d.locked)continue;const f=memory(state,d.recipeId),r=byId.get(d.recipeId);if(f.rating==='love'||state.favourites?.includes(r?.file))loved++;if(f.rating==='again')value+=.6;if(!tried(state,d.recipeId))untried++;}value+=Math.min(loved,2)*1.5-Math.max(0,loved-2)*1.5+Math.min(untried,3)*.8;return value;}
function objective(state,catalog,days){const r=report(state,catalog,days);return (r.score||0)+preferenceBonus(state,catalog,days)+(state.vegetarianTarget?(r.vegetarian?18:-18):0);}
function optimise(state,catalog,make,rng=Math.random){
 let best=make(),score=objective(state,catalog,best);
 for(let attempt=0;attempt<79;attempt++){const d=make(),s=objective(state,catalog,d);if(s>score||(s===score&&rng()<.15)){best=d;score=s;}}
 return best;
}
function matchesIntent(intent,r,old,state){const m=describe(r),o=describe(old);if(intent==='quicker')return !!m.totalMinutes&&!!o?.totalMinutes&&m.totalMinutes<o.totalMinutes;if(intent==='comforting')return m.richness==='rich'||['Curry','Stew','Bake','Pasta','Soup','Comfort'].includes(m.dishType);if(intent==='lighter')return m.richness==='lighter';if(intent==='spicy')return m.flavours.includes('spicy');if(intent==='curry')return m.dishType==='Curry'||r.category==='Curries';if(intent==='untried')return !recent(state,r.id);return true;}
return {WEIGHTS,INTENTS,describe,describeDay,report,recent,tried,similarity,objective,optimise,matchesIntent};
});
