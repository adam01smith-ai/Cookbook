(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CookbookPantry=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const defs=[
 ['ginger-garlic-paste','Ginger & garlic paste',/\b(?:ginger\s*(?:and|\/)?\s*garlic|garlic\s*(?:and|\/)?\s*ginger)\s+paste\b/gi],
 ['stock','Stock',/\b(?:(?:chicken|beef|vegetable|veg)\s+)?stock(?:\s+cubes?)?\b/gi],
 ['tomato-puree','Tomato purée',/\btomato\s+(?:puree|purée|paste)\b/gi],
 ['sweet-chilli','Sweet chilli sauce',/\bsweet\s+chill?i(?:\s+sauce)?\b/gi],
 ['chilli-flakes','Chilli flakes',/\b(?:red\s+pepper|chill?i)\s+flakes?\b/gi],
 ['black-pepper','Black pepper',/\bblack\s+pepper\b/gi],
 ['peanut-butter','Peanut butter',/\bpeanut\s+butter\b/gi],
 ['rice-vinegar','Rice vinegar',/\brice(?:\s+wine)?\s+vinegar\b/gi],
 ['soy','Soy sauce',/\b(?:(?:light|dark)\s+)?soy(?:\s+sauce)?\b/gi],
 ['sesame-oil','Sesame oil',/\bsesame\s+oil\b/gi],
 ['oil','Cooking oil',/\b(?:(?:olive|neutral|vegetable|sunflower)\s+)?oil\b/gi],
 ['pasta','Pasta',/\b(?:pasta|spaghetti|rigatoni|penne|ziti|pastina|orzo)\b/gi],
 ['noodles','Noodles',/\b(?:udon(?:\s+noodles)?|noodles?)\b/gi],
 ['rice','Rice',/\b(?:(?:jasmine|koshihikari|microwave)\s+)?rice\b/gi],
 ['chicken','Chicken',/\bchicken(?:\s+(?:breasts?|thighs?|fillets?))?\b/gi],
 ['beef','Beef',/\b(?:beef|braising\s+steak|steak)\b/gi],['pork','Pork',/\bpork\b/gi],['lamb','Lamb',/\blamb\b/gi],
 ['mince','Mince',/\bmince(?:d)?\b/gi],['prawns','Prawns',/\b(?:prawns?|shrimp)\b/gi],['salmon','Salmon',/\bsalmon\b/gi],
 ['chorizo','Chorizo',/\bchorizo\b/gi],['pancetta','Pancetta or bacon',/\b(?:pancetta|bacon)\b/gi],['sausage','Sausage',/\bsausages?\b/gi],['tofu','Tofu',/\btofu\b/gi],
 ['sweet-potato','Sweet potato',/\bsweet\s+potato(?:es)?\b/gi],['potato','Potatoes',/\b(?:baby\s+)?potato(?:es)?\b/gi],
 ['spring-onion','Spring onions',/\b(?:spring\s+onions?|scallions?)\b/gi],['onion','Onions',/\b(?:(?:red|spanish|white|brown)\s+)?onions?\b/gi],
 ['pepper','Bell pepper',/\b(?:(?:red|green|yellow|bell)\s+)?peppers?\b/gi],['spinach','Spinach',/\b(?:baby\s+)?spinach\b/gi],
 ['pak-choi','Pak choi',/\b(?:pak|bok)\s*cho[yi]\b/gi],['green-beans','Green beans',/\b(?:green|fine|french)\s+beans?\b/gi],
 ['butter-beans','Butter beans',/\bbutter\s+beans?\b/gi],['kidney-beans','Kidney beans',/\bkidney\s+beans?\b/gi],['edamame','Edamame',/\bedamame(?:\s+beans?)?\b/gi],['beans','Beans',/\bbeans?\b/gi],
 ['chickpeas','Chickpeas',/\bchickpeas?\b/gi],
 ['broccoli','Broccoli',/\b(?:(?:tenderstem|tender\s+stem)\s+)?broccoli\b/gi],['asparagus','Asparagus',/\basparagus\b/gi],
 ['peas','Peas',/\bpeas\b/gi],['carrot','Carrots',/\bcarrots?\b/gi],['celery','Celery',/\bcelery\b/gi],
 ['cabbage','Cabbage',/\b(?:(?:red|white)\s+)?cabbage\b/gi],['mushrooms','Mushrooms',/\bmushrooms?\b/gi],
 ['tomatoes','Tomatoes',/\b(?:(?:cherry|chopped|tinned|canned|fresh)\s+)?tomato(?:es)?\b/gi],
 ['cucumber','Cucumber',/\bcucumbers?\b/gi],['lettuce','Salad leaves',/\b(?:lettuce|salad\s+(?:leaves|greens)|rocket)\b/gi],
 ['garlic','Garlic',/\bgarlic(?:\s+cloves?)?\b/gi],['ginger','Ginger',/\bginger\b/gi],['chilli','Chillies',/\bchill?i(?:es)?\b/gi],
 ['coconut-milk','Coconut milk',/\bcoconut\s+milk\b/gi],['coconut','Coconut',/\b(?:desiccated\s+)?coconut\b/gi],
 ['creme-fraiche','Crème fraîche',/\bcr[eè]me\s+fra[iî]che\b/gi],['cream','Cream',/\b(?:(?:double|single|heavy)\s+)?cream\b/gi],
 ['yoghurt','Yoghurt',/\b(?:greek\s+)?yo(?:gh|g)urt\b/gi],['milk','Milk',/\b(?:whole\s+)?milk\b/gi],['butter','Butter',/\bbutter\b/gi],
 ['parmesan','Parmesan',/\bparmesan\b/gi],['pecorino','Pecorino',/\bpecorino\b/gi],['cheddar','Cheddar',/\bcheddar\b/gi],
 ['feta','Feta',/\bfeta\b/gi],['mozzarella','Mozzarella',/\bmozzarella\b/gi],['stilton','Stilton',/\bstilton\b/gi],['ricotta','Ricotta',/\bricotta\b/gi],
 ['cheese','Cheese',/\bcheese\b/gi],['eggs','Eggs',/\beggs?\b/gi],['lemon','Lemon',/\blemons?\b/gi],['lime','Lime',/\blimes?\b/gi],
 ['gochujang','Gochujang',/\bgochujang(?:\s+paste)?\b/gi],['harissa','Harissa',/\bharissa(?:\s+paste)?\b/gi],
 ['pesto','Pesto',/\bpesto\b/gi],['sambal','Sambal',/\bsambal(?:\s+paste)?\b/gi],['curry-paste','Curry paste',/\b(?:(?:red|green|thai)\s+)?curry\s+paste\b/gi],
 ['peanut-butter','Peanut butter',/\bpeanut\s+butter\b/gi],['peanuts','Peanuts',/\bpeanuts?\b/gi],['honey','Honey',/\bhoney\b/gi],
 ['vinegar','Vinegar',/\b(?:(?:balsamic|white|distilled)\s+)?vinegar\b/gi],['mustard','Mustard',/\b(?:(?:dijon|american)\s+)?mustard\b/gi],
 ['mayonnaise','Mayonnaise',/\b(?:mayonnaise|mayo)\b/gi],['ketchup','Ketchup',/\bketchup\b/gi],['bread','Bread or buns',/\b(?:bread|buns?|rolls?)\b/gi],
 ['gherkins','Gherkins',/\b(?:gherkins?|pickles?)\b/gi],['olives','Olives',/\bolives?\b/gi],
 ['coriander','Coriander',/\b(?:coriander|cilantro)\b/gi],['parsley','Parsley',/\bparsley\b/gi],['basil','Basil',/\bbasil\b/gi],
 ['oil','Cooking oil',/\b(?:(?:olive|neutral|vegetable|sunflower)\s+)?oil\b/gi],['salt','Salt',/\bsalt\b/gi],['water','Water',/\bwater\b/gi]
];
const essential=new Set(['oil','salt','black-pepper','water']);
const titles=Object.fromEntries(defs.map(([key,label])=>[key,label]));
const norm=s=>String(s).toLowerCase().replace(/&amp;/g,'&').replace(/[’']/g,'').replace(/\s+/g,' ').trim();
function keys(text){let remaining=norm(text).replace(/\bsalt\s*(?:&|and)\s*(?:black\s*)?pepper\b/g,'salt black pepper'),found=[];for(const [key,,rx]of defs){rx.lastIndex=0;if(rx.test(remaining)){found.push(key);rx.lastIndex=0;remaining=remaining.replace(rx,' ');}}return [...new Set(found)];}
function parse(text){return [...new Set(keys(text))].filter(k=>!essential.has(k));}
function label(item){return item.template.replace(/\u00a7\d+\u00a7/g,'').replace(/^[\s\d.,½¼¾⅛⅜⅝⅞–-]+/,'').replace(/^(?:g|kg|ml|l|tsp|tbsp|cup|cups|pack|packs|tin|tins)\s+/i,'').replace(/\([^)]*\)/g,'').split(',')[0].replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function entries(r){const list=r.ingredients.filter(i=>!i.optional).map(i=>({label:label(i),keys:keys(i.template)})).filter(i=>i.label&&i.label!==':'&&!/^(?:ingredients|icing|filling|topping):?$/i.test(i.label));if(r.defaultSide&&r.defaultSide!=='none'){const sides={rice:['Koshihikari rice',['rice']],pasta:['Pasta',['pasta']],potatoes:['Potatoes',['potato']],bread:['Bread',['bread']]};const side=sides[r.defaultSide];if(side)list.push({label:side[0],keys:side[1]});}return list;}
function describe(r,pantry){const input=new Set(pantry),matched=new Set(),missing=[];for(const e of entries(r)){const matches=e.keys.filter(k=>input.has(k));matches.forEach(k=>matched.add(k));if(!matches.length&&!(e.keys.length&&e.keys.every(k=>essential.has(k)))&&!missing.includes(e.label))missing.push(e.label);}return {recipe:r,matched:[...matched],missing};}
function rank(catalog,text,noFish=true){const pantry=parse(text);if(!pantry.length)return [];return catalog.filter(r=>r.eligible&&(!noFish||!r.fish)).map(r=>describe(r,pantry)).filter(r=>r.matched.length).sort((a,b)=>(b.matched.length*100-b.missing.length*2)-(a.matched.length*100-a.missing.length*2)||a.recipe.name.localeCompare(b.recipe.name));}
function cleanAI(data,catalog,text,noFish=true){if(!data||!Array.isArray(data.suggestions)||typeof data.summary!=='string')throw Error('The AI returned an unreadable suggestion.');const allowed=new Map(rank(catalog,text,noFish).map(x=>[x.recipe.id,x])),seen=new Set();const suggestions=[];for(const s of data.suggestions){if(!s||typeof s.id!=='string'||typeof s.reason!=='string'||!allowed.has(s.id)||seen.has(s.id))continue;seen.add(s.id);suggestions.push({...allowed.get(s.id),reason:s.reason.slice(0,240)});if(suggestions.length===3)break;}return {summary:data.summary.slice(0,320),suggestions};}
function mealPrompt(ingredients,servings,noFish){return 'Create three new dinner recipes for '+servings+' people using: '+ingredients+'. Respect the amounts I mention, including partial vegetables. '+(noFish?'No fish; prawns and calamari are fine. ':'')+'Prefer boneless meat. Oil, salt, black pepper and water are available. Keep extra purchases modest and list them. Give each meal a name, description, approximate prep and cooking times, measured ingredients in g, ml, tsp, tbsp or counts, and plain numbered instructions. Avoid handfuls, knobs, splashes, pinches or packs. Invent new meals rather than searching an existing cookbook.';}
function validateMeals(data,servings,noFish,available,existingNames=[],options={}){
 if(!data||typeof data.summary!=='string'||!Array.isArray(data.meals)||!data.meals.length||data.meals.length>3)throw Error('The AI did not return complete recipes.');
 const units=new Set(['g','ml','tsp','tbsp','item']),seen=new Set(),old=new Set(existingNames.map(norm)),have=new Set(parse(available));const fish=/\b(?:fish|salmon|cod|haddock|tuna|mackerel|sardines?|anchov(?:y|ies)|trout|sea\s*bass)\b/i;
 const meals=data.meals.map(m=>{
  if(!m||typeof m.name!=='string'||m.name.trim().length<3||m.name.length>120||typeof m.description!=='string'||m.description.length>500||m.servings!==servings||!Number.isInteger(m.prepMinutes)||m.prepMinutes<0||m.prepMinutes>180||!Number.isInteger(m.cookMinutes)||m.cookMinutes<0||m.cookMinutes>720||!Array.isArray(m.ingredients)||m.ingredients.length<2||m.ingredients.length>25||!Array.isArray(m.steps)||m.steps.length<2||m.steps.length>15)throw Error('The AI returned an incomplete recipe. Please try again.');
  const title=norm(m.name);if(seen.has(title)||old.has(title))throw Error('Please try again for fresh meal ideas.');seen.add(title);
  const ingredients=m.ingredients.map(i=>{if(!i||typeof i.name!=='string'||!i.name.trim()||i.name.length>160||/\b(?:handful|knob|splash|pinch|pack|packet|bunch)s?\b/i.test(i.name)||typeof i.quantity!=='number'||!Number.isFinite(i.quantity)||i.quantity<=0||i.quantity>10000||!units.has(i.unit))throw Error('The AI returned an ingredient without a usable measurement.');const k=keys(i.name),staple=k.length>0&&k.every(x=>essential.has(x)),supplied=k.length?k.some(x=>have.has(x)):norm(available).includes(norm(i.name));return {name:i.name.trim(),quantity:i.quantity,unit:i.unit,source:staple?'staple':supplied?'have':'extra'};});
  if(!options.vibe&&!ingredients.some(i=>i.source==='have'))throw Error('The AI did not use the ingredients you supplied. Please try again.');const steps=m.steps.map(step=>{if(typeof step!=='string'||!step.trim()||step.length>1200)throw Error('The AI returned an incomplete method.');return step.trim();});if(noFish&&fish.test(m.name+' '+ingredients.map(i=>i.name).join(' ')))throw Error('The AI included fish despite your preference. Please try again.');return {name:m.name.trim(),description:m.description.trim(),servings,prepMinutes:m.prepMinutes,cookMinutes:m.cookMinutes,ingredients,steps};
 });return {summary:data.summary.slice(0,400),meals};
}
function vibePrompt(prompt,servings,noFish,mustUse=[],avoid=[]){
 return 'Create three distinct new dinner recipes for '+servings+' people. My cooking brief: '+prompt+'\n'+(mustUse.length?'Every recipe must use: '+mustUse.join(', ')+'.\n':'')+(avoid.length?'Leave these ingredients out of every recipe: '+avoid.join(', ')+'.\n':'')+(noFish?'No fish; prawns and calamari are fine unless my brief excludes them. ':'')+'Follow my exclusions, preferred heat, cuisine, available time and equipment. When I ask for wild suggestions, be inventive but keep the meals practical. A craving or mood is enough; I do not have to list ingredients. Give complete measured ingredients and plain numbered methods. Invent new meals rather than searching an existing cookbook.';
}
function ingredientMatches(term,name){
 const groups={dairy:/\b(?:milk|cream|butter|cheese|yogh?urt|parmesan|pecorino|cheddar|feta|mozzarella|stilton|ricotta|ghee|whey)\b/i,nuts:/\b(?:nuts?|peanuts?|almonds?|cashews?|walnuts?|pistachios?|pecans?|hazelnuts?)\b/i,peanuts:/\bpeanut(?:s| butter| oil)?\b/i,fish:/\b(?:fish|salmon|cod|haddock|tuna|mackerel|sardines?|anchov(?:y|ies)|trout|sea\s*bass)\b/i};
 const t=norm(term);if(t==='dairy'&&/\b(?:(?:coconut|almond|soy|soya|oat|cashew|plant[- ]based|dairy[- ]free)\s+(?:milk|cream|butter|cheese|yogh?urt)|peanut butter|cocoa butter)\b/i.test(name))return false;
 if(groups[t])return groups[t].test(name);
 const wanted=keys(t),actual=keys(name);if(wanted.length)return wanted.some(k=>actual.includes(k));
 const escaped=t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=escaped.endsWith('s')?escaped.slice(0,-1)+'s?':escaped+'s?';
 return new RegExp('\\b'+pattern+'\\b','i').test(norm(name));
}
function validateVibeMeals(data,servings,noFish,prompt,mustUse=[],avoid=[],existingNames=[]){
 const result=validateMeals(data,servings,noFish,prompt,existingNames,{vibe:true});
 for(const meal of result.meals){
  for(const term of mustUse)if(!meal.ingredients.some(i=>ingredientMatches(term,i.name)))throw Error('A recipe missed an ingredient you asked to use. Please try again.');
  for(const term of avoid)if(meal.ingredients.some(i=>ingredientMatches(term,i.name)))throw Error('A recipe included an ingredient you asked to leave out. Please try again.');
 }
 return result;
}

function quantity(i){const f={0.25:'¼',0.5:'½',0.75:'¾',1.5:'1½',2.5:'2½'};return (f[i.quantity]||String(Math.round(i.quantity*100)/100))+(i.unit==='item'?' ':' '+i.unit+' ')+i.name;}
function recipeText(m){return m.name+'\nServes '+m.servings+' · Prep '+m.prepMinutes+' mins · Cook '+m.cookMinutes+' mins\n\n'+m.description+'\n\nIngredients\n'+m.ingredients.map(quantity).join('\n')+'\n\nMethod\n'+m.steps.map((s,i)=>(i+1)+'. '+s).join('\n\n');}
return {parse,keys,label,entries,describe,rank,cleanAI,titles,mealPrompt,validateMeals,vibePrompt,validateVibeMeals,ingredientMatches,quantity,recipeText};
});
