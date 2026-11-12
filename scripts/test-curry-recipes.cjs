const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),core=require(path.join(root,'planner-core.js')),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'recipe-data.js'),'utf8'),context);
const catalog=context.window.COOKBOOK_RECIPES;
for(const id of ['karahi','jalfrezi','pathia','moghul']){
 const source=fs.readFileSync(path.join(root,id+'.html'),'utf8');
 const schema=JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert(schema.recipeIngredient.includes('300 g chicken breast, raw'),id);
 assert(source.includes('href="https://www.adamcooks.co.uk/basegravy.html"'),id);
 assert(schema.recipeInstructions[0].text.includes('base gravy first'),id);
 const words=schema.recipeInstructions.map(s=>s.text).join(' ');
 assert(!/(?<!kasuri )\bmethi\b|the powders|remaining spices/i.test(words),id);
 assert(words.includes('pre-cooked chicken')||words.includes('chicken pre-cooked earlier'),id);
 for(const step of schema.recipeInstructions)assert(source.includes('id="'+step.url.split('#')[1]+'"'),id);
 const recipe=catalog.find(r=>r.id===id);
 assert(recipe.ingredients.every(i=>i.amounts.length===1),id);
 for(const people of [1,2,3,4,6]){
  const state=core.initial();state.people=people;state.gravyChoice='have';state.days[0]={...core.newDay('recipe'),recipeId:id,side:'none'};
  const rows=core.shopping(state,catalog),chicken=rows.find(r=>/chicken breast/.test(r.name||r.display));
  assert.equal(chicken.min,people*150,id);
  assert(!rows.some(r=>r.check||/main ingredient|pre-cooked chicken|\bwater\b/i.test(r.display)),id);
  assert(!rows.some(r=>/Worcestershire|sultanas|ghee|egg|bay leaf/i.test(r.display)),id);
 }
}
console.log('Passed: four measured curry recipes, explicit cooking sequence, stable step URLs and shopping quantities at 1/2/3/4/6 servings.');
