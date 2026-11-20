const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require('../planner-core.js');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'recipe-data.js'),'utf8');
const catalogue=JSON.parse(raw.slice(raw.indexOf('['),raw.lastIndexOf(']')+1));
const chicken=catalogue.find(r=>r.id==='creamy-garlic-chicken');
const karahi=catalogue.find(r=>r.id==='karahi');

test('baby new potatoes is an optional side for creamy garlic chicken only',()=>{
  assert(chicken);
  assert.equal(chicken.defaultSide,'pasta');
  assert.equal(chicken.mealName,'Creamy Garlic Chicken');
  assert(P.sideOptions(chicken).some(([id])=>id==='babyNewPotatoes'));
  assert(!P.sideOptions(karahi).some(([id])=>id==='babyNewPotatoes'));
  assert.equal(P.SIDES.babyNewPotatoes.amount,250);
});
test('selected potatoes scale with servings and enter shopping list only when chosen',()=>{
  const state=P.initial(new Date('2026-11-20T12:00:00'));
  state.people=2;
  state.days[0]={...P.newDay('recipe'),recipeId:chicken.id,side:'pasta'};
  const noPotatoes=P.shopping(state,catalogue).filter(x=>x.name.toLowerCase().includes('baby new potatoes'));
  assert.equal(noPotatoes.length,0);
  state.days[0].side='babyNewPotatoes';
  let rows=P.shopping(state,catalogue).filter(x=>x.name.toLowerCase().includes('baby new potatoes'));
  assert.equal(rows.length,1);
  assert.equal(rows[0].min,500);
  state.people=4;
  rows=P.shopping(state,catalogue).filter(x=>x.name.toLowerCase().includes('baby new potatoes'));
  assert.equal(rows[0].min,1000);
  const restored=P.validate(JSON.parse(JSON.stringify(state)),catalogue);
  assert.equal(restored.days[0].side,'babyNewPotatoes');
});
test('Recipe page explains the optional side, and support panel uses one secure destination',()=>{
  const recipe=fs.readFileSync(path.join(root,'creamy-garlic-chicken.html'),'utf8');
  assert.match(recipe,/Optional side: baby new potatoes/);
  assert.match(recipe,/250 g baby new potatoes per person/);
  const recipesPage=fs.readFileSync(path.join(root,'recipes.html'),'utf8');
  const panel=recipesPage.match(/<aside class="coffee-panel"[\s\S]*?<\/aside>/)?.[0];
  assert(panel);
  assert.match(panel,/Buy Me a Coffee/);
  assert.match(panel,/Buy Me a Beer/);
  assert.equal((panel.match(/href="https:\/\/buymeacoffee.com\/adam01smith"/g)||[]).length,2);
  assert.match(panel,/adam-coffee-portrait.webp/);
  assert.match(recipesPage,/class="collection-hero"/);
  assert.match(recipesPage,/id="recipes"/);
});
