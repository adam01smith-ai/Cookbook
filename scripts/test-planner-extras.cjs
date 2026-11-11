const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),P=require('../planner-core.js');
const raw=fs.readFileSync(path.join(__dirname,'../recipe-data.js'),'utf8'),catalog=JSON.parse(raw.slice(raw.indexOf('['),raw.lastIndexOf(']')+1));
const recipe=catalog.find(r=>r.id==='cottage-pie');assert(recipe);
const state=P.initial();state.days[0]={...P.newDay('recipe'),recipeId:recipe.id};
const baseline=P.shopping(state,catalog);state.days[0].extraPortions=2;assert.equal(P.portions(state,0),4);for(const row of P.shopping(state,catalog)){const old=baseline.find(x=>x.key===row.key);if(old.min!==undefined)assert.equal(row.min,old.min*2,row.key);}
state.days[1]={...P.newDay('recipe'),recipeId:'amatriciana'};assert.equal(P.portions(state,1),2);
state.days[2]={...P.newDay('leftovers'),source:0};assert.equal(P.portions(state,0),6);state.days[2].status='skipped';assert.equal(P.portions(state,0),4);state.days[2].status='planned';
state.days[0].side='microRice';const rice=P.shopping(state,catalog).find(x=>x.name.includes('microwave basmati'));assert.equal(rice.min,3);assert.equal(rice.purchaseQuantity,3);
const confirmed=P.confirmWeek(state,catalog);assert.equal(confirmed.history[0].days[0].extraPortions,2);const restored=P.validate(JSON.parse(JSON.stringify(confirmed)),catalog);assert.equal(P.portions(restored,0),6);assert.equal(restored.history[0].days[0].extraPortions,2);
const old=P.clone(confirmed);for(const day of old.days)delete day.extraPortions;for(const week of old.history)for(const day of week.days)delete day.extraPortions;assert.equal(P.validate(old,catalog).days[0].extraPortions,0);
for(const n of [-1,1.5,25,'2']){const bad=P.clone(state);bad.days[0].extraPortions=n;assert.throws(()=>P.validate(bad,catalog),/Extra portions/);}
state.days[0].locked=true;assert.equal(P.generate(state,catalog,()=>.4)[0].extraPortions,2);state.days[0].locked=false;assert.equal(P.swap(state,catalog,0,()=>.4).extraPortions,0);
const own=P.initial();own.days[0]={...P.newDay('custom'),title:'Own dinner',ingredients:'100 g lentils',customBase:2,extraPortions:2};assert.equal(P.shopping(own,catalog)[0].min,200);
const curry=catalog.find(r=>P.usesBaseGravy(r)&&r.eligible);const c=P.initial();c.days[0]={...P.newDay('recipe'),recipeId:curry.id,side:'none'};const original=P.gravyNeeds(c,catalog).max;c.days[0].extraPortions=2;assert.equal(P.gravyNeeds(c,catalog).max,original*2);
console.log('Passed: per-meal scaling, unaffected other meals, additive linked leftovers, skipped days, sides, curry gravy, custom meals, history/backup persistence, old backups, invalid values, keep and swap.');
