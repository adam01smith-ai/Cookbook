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
 const byId=new Map(catalog.map(r=>[r.id,r])),meals=days.map((d,i)=>d.type==='recipe'?{...describeDay(d,byId.get(d.recipeId)),i}:null).filter(m=>m&&m.recipe),n=meals.length;
 const components={},known={},notes=[],counts=values=>values.reduce((o,v)=>(v&&(o[v]=(o[v]||0)+1),o),{}),allKept=meals.every(m=>m.day.locked);
 const editable=meals.filter(m=>!m.day.locked);
 const unknown=p=>!p||/unknown|unspecified|ambiguous/i.test(p);
 const protein=m=>[m.primaryProtein,...m.secondaryProteins].filter(p=>!unknown(p));
 const pCounts=counts(meals.flatMap(protein)),fixedProteins=counts(meals.filter(m=>m.day.locked).flatMap(protein));
 function comparable(a,b){return !a.day.locked||!b.day.locked;}
 // Each dinner's closest counterpart matters; unlike the old all-pairs mean,
 // an isolated near-duplicate cannot disappear among 20 unrelated comparisons.
 // Consecutive calendar days add a separate sequencing cost. Special days break it.
 function pairPenalty(fn){let nearest=Array(n).fill(0),seen=new Set(),adj=0,adjCount=0;
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){if(!comparable(meals[a],meals[b]))continue;const v=fn(meals[a],meals[b]);if(v===null)continue;seen.add(a);seen.add(b);nearest[a]=Math.max(nearest[a],v);nearest[b]=Math.max(nearest[b],v);if(meals[b].i===meals[a].i+1){adj+=v;adjCount++;}}
  return seen.size?.65*[...seen].reduce((s,i)=>s+nearest[i],0)/seen.size+.35*adj/Math.max(1,adjCount):0;
 }
 function concentration(values){const c=counts(values),fixed=counts(values.filter((v,i)=>meals[i].day.locked)),excess=Object.entries(c).reduce((s,[v,num])=>s+Math.max(0,num-2)-Math.max(0,(fixed[v]||0)-2),0);return clamp(excess/Math.max(1,n-2));}
 const cuisine=meals.map(m=>m.cuisine),carbs=meals.map(m=>m.carbohydrates[0]||null);
 known.cuisine=cuisine.filter(Boolean).length;components.cuisine=1-clamp(.8*concentration(cuisine)+.2*pairPenalty((a,b)=>a.cuisine&&b.cuisine?Number(a.cuisine===b.cuisine):null));
 known.protein=meals.filter(m=>m.primaryProtein).length;
 const proteinExcess=Object.entries(pCounts).reduce((s,[p,v])=>s+Math.max(0,v-2)-Math.max(0,(fixedProteins[p]||0)-2),0)/Math.max(1,n-2);
 components.protein=1-clamp(.75*proteinExcess+.15*pairPenalty((a,b)=>protein(a).length&&protein(b).length?Number(protein(a).some(p=>protein(b).includes(p))):null)+.4*editable.filter(m=>unknown(m.primaryProtein)).length/Math.max(1,n));
 known.style=meals.filter(m=>m.dishType||m.cookingMethods.length).length;
 const stylePenalty=pairPenalty((a,b)=>{const same=a.dishType&&b.dishType?Number(a.dishType===b.dishType):0,method=similarity(a.cookingMethods,b.cookingMethods);return .65*same+.35*(method||0);});
 components.style=1-clamp(.55*concentration(meals.map(m=>m.dishType))+.45*stylePenalty);
 known.carbohydrate=carbs.filter(Boolean).length;components.carbohydrate=1-clamp(.75*concentration(carbs)+.25*pairPenalty((a,b)=>a.carbohydrates.length&&b.carbohydrates.length?Number(a.carbohydrates.some(c=>b.carbohydrates.includes(c))):null));
 // Ubiquitous seasoning alone is weak evidence of similar dinners.
 const keys=m=>m.keyIngredients.filter(k=>!['garlic','ginger','chilli'].includes(k));
 known.ingredients=meals.filter(m=>keys(m).length).length;
 components.ingredients=1-pairPenalty((a,b)=>{const v=similarity(keys(a),keys(b));return v===null?null:clamp((v-.15)/.85);});
 const flavours=m=>m.flavours.filter(f=>!['savoury','garlicky'].includes(f));
 known.flavour=meals.filter(m=>flavours(m).length).length;
 // Matching a sauce base plus overlapping flavours is stronger evidence than
 // common seasoning: tomato/prawns or coconut/lime can cross cuisine labels.
 components.flavour=1-pairPenalty((a,b)=>{const v=similarity(flavours(a),flavours(b));if(v===null)return null;const sauce=['tomato','cream','coconut','peanut','gravy'].some(k=>keys(a).includes(k)&&keys(b).includes(k));return clamp(v*(sauce?1:.55));});
 known.recent=editable.length;components.recent=1-editable.reduce((s,m)=>s+recent(state,m.recipe.id),0)/Math.max(1,editable.length);
 const recentPair=pairPenalty((a,b)=>Number((state.history||[]).some(w=>w.week<state.week&&((new Date(state.week)-new Date(w.week))/86400000)<=56&&[a.recipe.id,b.recipe.id].every(id=>w.days.some(d=>d.recipeId===id&&d.status!=='skipped')))));
 components.recent=clamp(components.recent-.25*recentPair);
 let adjacent=0,hard=0,heavy=0;for(let i=1;i<n;i++)if(meals[i].i===meals[i-1].i+1&&comparable(meals[i],meals[i-1])){adjacent++;if(meals[i].effort==='involved'&&meals[i-1].effort==='involved')hard++;if(meals[i].richness==='rich'&&meals[i-1].richness==='rich')heavy++;}
 known.effort=meals.filter(m=>m.effort).length;components.effort=1-hard/Math.max(1,adjacent);
 known.richness=meals.filter(m=>m.richness).length;const rich=editable.filter(m=>m.richness==='rich').length;components.richness=1-clamp(.5*heavy/Math.max(1,adjacent)+.5*Math.max(0,rich-Math.ceil(n/2))/Math.max(1,n-Math.ceil(n/2)));
 const available=Object.keys(WEIGHTS).filter(k=>known[k]>0),weight=available.reduce((s,k)=>s+WEIGHTS[k],0),score=n>=2?Math.round(100*available.reduce((s,k)=>s+components[k]*WEIGHTS[k],0)/(weight||1)):null;
 const cuisines=new Set(cuisine.filter(Boolean)).size,styles=new Set(meals.map(m=>m.dishType).filter(Boolean)).size;
 const vegetarian=meals.some(m=>m.dietary?.vegetarian&&(!state.optional||!m.recipe.ingredients.some(x=>x.optional&&/chicken|beef|pork|bacon|prawn|fish/i.test(x.template))));
 if(!allKept){for(const [carb,num] of Object.entries(counts(carbs)))if(num>2&&editable.some(m=>m.carbohydrates[0]===carb))notes.push(num+' meals use '+carb+'. Try a different accompaniment for more contrast.');
 for(const [p,num] of Object.entries(pCounts))if(num>2&&(fixedProteins[p]||0)<num)notes.push(p+' appears '+num+' times; another protein would add contrast.');
 if(hard)notes.push('More involved dinners are next to each other. A quicker replacement could make the week easier.');
 if(heavy)notes.push('Rich dinners are next to each other; a lighter meal between them could add balance.');
 if(components.ingredients<.8||components.flavour<.7)notes.push('Some dinners share ingredients or sauce flavours. Spread similar meals apart or try a different style.');
 if(editable.some(m=>unknown(m.primaryProtein)))notes.push('A recipe has an unspecified protein; it does not count as an extra protein group.');
 if(components.recent<.8)notes.push('Several choices appeared recently. A less recently cooked replacement could add discovery.');
 if(state.vegetarianTarget&&!vegetarian)notes.push('No vegetarian dinner fits this suggestion. Keep fewer meals or widen the time limit.');}
 if(meals.some(m=>!metadata[m.recipe.id]&&!m.recipe.planning))notes.push('Some recipe descriptors are missing; this score uses only the available information.');
 const kept=meals.filter(m=>m.day.locked).length;if(meals.some(m=>m.day.locked&&state.maxMinutes&&(!m.totalMinutes||m.totalMinutes>state.maxMinutes)))notes.push('A kept meal exceeds the time limit or has no reviewed time; it stays as chosen.');if(kept)notes.push(kept+' kept meal'+(kept===1?' stays':'s stay')+' exactly as chosen.');
 if(allKept&&n)notes.push('All dinners are kept; the score excludes repetition between your fixed choices.');
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
