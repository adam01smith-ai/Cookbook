const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),{matches,ingredientMatches}=require('../recipe-discovery.js');
const fixture={category:'Rice & Bowls',search:'Test bowl',ingredients:['Chicken breast','Jasmine rice','Optional spring onions'],collections:[],minMinutes:25,maxMinutes:35,makeAhead:false};
assert(matches(fixture,'','chicken + rice'));
assert(matches(fixture,'','chicken, rice'));
assert(matches(fixture,'','chicken and rice'));
assert(matches(fixture,'chicken rice',''));
assert(matches(fixture,'tes',''),'Recipe names support partial typing');
assert(matches({...fixture,collections:['Fakeaway']},'fakeaway',''));
assert(!matches(fixture,'','chicken, pasta'));
assert(matches(fixture,'','scallions'));
assert(!matches(fixture,'','', '30'),'Use the upper time allowance for quick filters');
assert(matches(fixture,'','', '45'));
assert(!ingredientMatches(['Chicken stock'],'chicken'));
assert(!ingredientMatches(['Rice vinegar'],'rice'));
assert(!ingredientMatches(['Rice flour'],'rice'));
assert(matches({...fixture,ingredients:['Rice vinegar']},'','rice vinegar'));
assert(matches({...fixture,ingredients:['Chicken stock']},'','chicken stock'));
assert(matches({...fixture,ingredients:['Rigatoni']},'','pasta'));
assert(matches({...fixture,ingredients:['Udon']},'','noodles'));
assert(ingredientMatches(['Rice vinegar','Jasmine rice'],'rice'));
assert(matches({...fixture,ingredients:['Prawns']},'','shrimp'));
assert(matches({...fixture,ingredients:['Potatoes']},'','potato'));
assert(matches({...fixture,minMinutes:60,maxMinutes:60},'','','60'));
assert(!matches({...fixture,minMinutes:60,maxMinutes:60},'','','long'));
assert(!matches({...fixture,minMinutes:60,maxMinutes:null,makeAhead:true},'','','60'));
assert(matches({...fixture,minMinutes:60,maxMinutes:null,makeAhead:true},'','','long'));
assert(matches({...fixture,collections:['Fakeaway']},'','','any','Fakeaway'));
assert(!matches(fixture,'','','any','Pasta'));
const raw=fs.readFileSync(path.join(root,'recipe-data.js'),'utf8'),recipes=JSON.parse(raw.slice(raw.indexOf('['),raw.lastIndexOf(']')+1)),timings=JSON.parse(fs.readFileSync(path.join(root,'recipe-discovery.json'),'utf8'));
assert.equal(Object.keys(timings).length,recipes.length);
for(const r of recipes){const t=timings[r.file],html=fs.readFileSync(path.join(root,r.file),'utf8');assert(t,r.file);assert.equal((html.match(/class="recipe-time-summary"/g)||[]).length,1,r.file);if(t.maxMinutes!==null)assert(t.maxMinutes>=t.minMinutes,r.file);assert(/recipe-timer\.js\?v=\d+/.test(html),r.file);assert(html.includes('recipe-community.js?v=1'),r.file);}
const collections={'index.html':recipes.length,'breakfast.html':recipes.filter(r=>r.category==='Breakfast & Brunch').length,'lunches.html':recipes.filter(r=>r.category==='Lunches').length,'desserts.html':recipes.filter(r=>r.category==='Desserts').length,'fakeaway.html':9,'favourites.html':recipes.length};
for(const [file,total] of Object.entries(collections)){const html=fs.readFileSync(path.join(root,file),'utf8');assert.equal((html.match(/class="recipe-card"/g)||[]).length,total,file);assert.equal((html.match(/id="recipe-ingredients"/g)||[]).length,1,file);assert.equal((html.match(/id="recipe-time"/g)||[]).length,1,file);assert.equal((html.match(/src="recipe-discovery.js\?v=2"/g)||[]).length,1,file);assert.equal((html.match(/class="card-time"/g)||[]).length,total,file);}
console.log('Passed: ingredient AND search, aliases, stock/vinegar exclusions, optional ingredients, time boundaries, waiting-time exclusions, category membership, all catalogue timing entries, card consistency and six collection pages.');

