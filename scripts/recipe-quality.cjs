// Structural/data checks, not a claim that an untested recipe has been kitchen-tested.
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const fractions={'⅛':.125,'¼':.25,'⅜':.375,'½':.5,'⅝':.625,'¾':.75,'⅞':.875,'⅓':1/3,'⅔':2/3};
function number(s){s=s.trim();for(const [f,v]of Object.entries(fractions))if(s.endsWith(f))return Number(s.slice(0,-1).trim()||0)+v;return Number(s);}
// Unmeasured seasonings, optional garnishes, starter carry-over, headings and
// functional pan-greasing/consistency water are intentional, not main quantities.
function functional(t){return /^(?:salt\b|black pepper\b|fresh (?:parsley|basil)\b|fresh parsley or basil\b|truffle powder to taste\b|sliced gherkins\b|extra lime zest, to decorate\b|(?:topping|icing):$|all of the levain\b|\d+\s*g\b|tepid water:\s*\d+\s*g\b|a (?:small )?pinch\b|a drizzle of .*oil\b|a pinch of sugar\b|a splash of water\b|a little (?:water|butter)\b|water, enough to cover\b|(?:vegetable )?oil, for (?:the (?:air fryer|bowl)|frying)\b)/i.test(t);}
function auditRecipe(r,html,{root=path.join(__dirname,'..'),metadata={}}={}){
 const dom=new JSDOM(html,{url:'https://www.adamcooks.co.uk/'+r.file,runScripts:'outside-only'}),w=dom.window,d=w.document,failures=[];const fail=(type,evidence)=>failures.push({type,evidence});
 if(!Number.isFinite(r.baseServings)||r.baseServings<=0)fail('servings','Invalid baseServings');
 const slider=d.querySelector('input[type=range]');if(!slider||Number(slider.min)<=0||Number(slider.max)<Number(slider.min))fail('servings','Invalid serving control');
 for(const i of r.ingredients){if(!i.optional&&!i.amounts.length&&!functional(i.template))fail('quantity',i.template);for(const a of i.amounts)if(!Number.isFinite(a.min)||a.min<0||a.max<=0||a.max<a.min)fail('quantity','Invalid amount: '+i.template);
 if(!i.optional&&/\bmince\b/i.test(i.template)&&!/(?:beef|pork|chicken|turkey|lamb|plant|vegan|vegetarian)\b.*\bmince\b/i.test(i.template))fail('primary-ingredient',i.template);
 if(!i.optional&&/spice (?:mix|blend)/i.test(i.template)&&!i.amounts.length)fail('undefined-blend',i.template);
 }
 const flesh=r.ingredients.filter(i=>!i.optional&&!/\b(?:stock|sauce)\b/i.test(i.template)).some(i=>/\b(?:chicken|beef|pork|prawns?|fish|mince|bacon|pancetta|chorizo)\b/i.test(i.template));if(flesh&&r.vegetarian)fail('dietary','Meat ingredients labelled vegetarian');if(flesh&&metadata[r.id]?.dietary.vegetarian)fail('dietary','Planner metadata labelled vegetarian');
 const method=d.querySelector('.method-panel'),steps=[...d.querySelectorAll('.method-panel li.step')],text=method?.textContent||'';if(!method||!steps.length)fail('method','Missing structured steps');
 if(!d.querySelector('.recipe-hero .recipe-intro h1')||!d.querySelector('.recipe-figure .recipe-photo')||!d.querySelector('.servings-panel')||steps.some((s,i)=>s.id!=='step-'+(i+1)))fail('presentation','Shared hero/servings/sequential step anchors required');
 const cookingStages=[...(method?.querySelectorAll('ol > li')||[])].map(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('.step-number').forEach(x=>x.remove());return copy.textContent;}).filter(t=>/\b(?:cook|fry|boil|bake|roast|simmer|steam|stir-fry)\b/i.test(t));
 if(cookingStages.length&&!cookingStages.some(t=>/(?:\d+\s*(?:[–-]\s*\d+)?\s*(?:min(?:ute)?s?|sec(?:ond)?s?|hours?|hrs?)\b|packet (?:cooking )?time|time on (?:its|the) packet|packet instructions|reaches\s+\d+\s*°C\s*\([^)]*stage\))/i.test(t)))fail('stage-guidance','Cooking stage lacks duration, packet guidance or measured confectionery endpoint (chilling time alone is insufficient)');

 for(const el of d.querySelectorAll('a[href],img[src],source[srcset]')){const refs=el.getAttribute('srcset')?.split(',').map(x=>x.trim().split(/\s/)[0])||[el.getAttribute('href')||el.getAttribute('src')];for(const ref of refs){if(!ref||/^(?:data:|mailto:|tel:|javascript:)/.test(ref))continue;const url=new URL(ref,w.location.href);if(url.origin!==w.location.origin)continue;const dest=decodeURIComponent(url.pathname.slice(1))||'index.html';if(!fs.existsSync(path.join(root,dest)))fail(el.tagName==='A'?'link':'image',ref);else if(url.hash&&dest===r.file&&!d.getElementById(decodeURIComponent(url.hash.slice(1))))fail('link',ref);}}
 try{for(const sc of d.querySelectorAll('script:not([src]):not([type])'))w.eval(sc.textContent);for(const count of [2,4,6]){if(!slider)break;slider.value=Math.max(Number(slider.min),Math.min(Number(slider.max),count));slider.dispatchEvent(new w.Event('input'));for(const el of d.querySelectorAll('.ingredient-list .val[data-base],.ingredient-list .qty[data-base]')){const expected=Number(el.dataset.base)*Number(slider.value)/r.baseServings;if(Math.abs(number(el.textContent)-expected)>.011||!Number.isFinite(number(el.textContent)))fail('scaling',el.outerHTML);}}}catch(e){fail('scaling',e.message);}
 w.close();return {id:r.id,file:r.file,pass:!failures.length,failures};
}
module.exports={auditRecipe,functional};
