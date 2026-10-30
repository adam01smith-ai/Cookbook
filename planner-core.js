(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CookbookPlanner=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const TYPES=['recipe','out','leftovers','custom','empty'];
const SIDES={none:{name:'No added side',amount:0,unit:'',ingredient:''},rice:{name:'Koshihikari rice',amount:75,unit:'g',ingredient:'Koshihikari rice'},pasta:{name:'Pasta',amount:75,unit:'g',ingredient:'pasta'},potatoes:{name:'Potatoes',amount:250,unit:'g',ingredient:'potatoes'},bread:{name:'Bread',amount:2,unit:'slice',ingredient:'bread'}};
const clone=x=>JSON.parse(JSON.stringify(x));
const amount=n=>String(Math.round(n*100)/100);
function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function parseDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Choose a valid week date.');const d=new Date(s+'T12:00:00');if(Number.isNaN(+d)||localDate(d)!==s)throw Error('Choose a valid week date.');return d;}
function monday(s){const d=parseDate(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return localDate(d);}
function addDays(s,n){const d=parseDate(s);d.setDate(d.getDate()+n);return localDate(d);}
function newDay(type='empty'){return {type,recipeId:'',side:'none',sideAmount:null,locked:false,title:'',ingredients:'',customBase:2,source:null,status:'planned'};}
function initial(now=new Date()){const week=monday(localDate(now));return {version:1,week,people:2,count:5,gap:1,noFish:true,optional:false,days:Array.from({length:7},()=>newDay()),history:[],checked:[],extras:'',confirmed:false};}
function validate(raw,catalog){
 if(!raw||raw.version!==1||!Array.isArray(raw.days)||raw.days.length!==7||!Array.isArray(raw.history)||raw.history.length>1000)throw Error('This is not a supported planner backup.');
 const ids=new Set(catalog.map(r=>r.id)),s=initial();s.week=monday(raw.week);
 for(const [k,min,max]of [['people',1,12],['count',0,7],['gap',1,4]]){const v=Number(raw[k]);if(!Number.isInteger(v)||v<min||v>max)throw Error('Invalid '+k+' in backup.');s[k]=v;}
 if(![1,2,4].includes(s.gap))throw Error('Invalid repeat gap.');
 function day(v){if(!v||!TYPES.includes(v.type))throw Error('Invalid day type.');const d=newDay(v.type);d.recipeId=ids.has(v.recipeId)?v.recipeId:'';d.side=SIDES[v.side]?v.side:'none';d.sideAmount=v.sideAmount===null||v.sideAmount===undefined?null:Math.max(0,Math.min(2000,Number(v.sideAmount)||0));d.locked=!!v.locked;d.title=String(v.title||'').slice(0,200);d.ingredients=String(v.ingredients||'').slice(0,10000);d.customBase=Math.max(1,Math.min(12,Number(v.customBase)||2));d.source=Number.isInteger(v.source)&&v.source>=0&&v.source<7?v.source:null;d.status=['planned','cooked','skipped'].includes(v.status)?v.status:'planned';return d;}
 s.days=raw.days.map(day);s.history=raw.history.map(w=>{if(!w||!Array.isArray(w.days)||w.days.length!==7)throw Error('Invalid history week.');return {week:monday(w.week),people:Math.max(1,Math.min(12,Number(w.people)||2)),days:w.days.map(day),confirmedAt:String(w.confirmedAt||'')};});
 s.noFish=raw.noFish!==false;s.optional=!!raw.optional;s.extras=String(raw.extras||'').slice(0,15000);s.checked=Array.isArray(raw.checked)?raw.checked.filter(x=>typeof x==='string').slice(0,2000):[];s.confirmed=!!raw.confirmed;return s;
}
function excluded(state){const min=addDays(state.week,-7*state.gap),ids=new Set();for(const w of state.history){if(w.week<min||w.week>=state.week)continue;for(const d of w.days){if(d.status!=='skipped'&&d.recipeId&&(d.type==='recipe'||d.type==='leftovers'))ids.add(d.recipeId);}}return ids;}
function eligible(state,catalog){const omit=excluded(state);return catalog.filter(r=>r.eligible&&(!state.noFish||!r.fish)&&!omit.has(r.id));}
function shuffled(a,rng=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function generate(state,catalog,rng=Math.random){
 const days=clone(state.days),fixed=days.filter(d=>d.type==='recipe'&&d.locked),fixedIds=new Set(fixed.map(d=>d.recipeId));
 if(fixed.some(d=>!eligible(state,catalog).some(r=>r.id===d.recipeId)))throw Error('A kept meal conflicts with your repeat gap or preferences. Unlock it or adjust the rules.');
 if(fixedIds.size!==fixed.length)throw Error('Kept meals include a duplicate. Unlock one before generating.');
 if(fixed.length>state.count)throw Error('You have kept more meals than the requested number. Increase dinners or unlock a meal.');
 const slots=days.map((d,i)=>(d.type==='empty'||(d.type==='recipe'&&!d.locked))?i:-1).filter(i=>i>=0),needed=state.count-fixed.length;
 if(needed>slots.length)throw Error('Not enough open cooking days. Reduce dinners or change an eating-out, custom or leftovers day.');
 const candidates=shuffled(eligible(state,catalog).filter(r=>!fixedIds.has(r.id)),rng);
 if(candidates.length<needed)throw Error('Only '+(candidates.length+fixed.length)+' eligible dinners remain. Choose fewer dinners or shorten the repeat gap; no meals were repeated.');
 for(let j=0;j<slots.length;j++){const i=slots[j];if(j<needed){const r=candidates[j];days[i]={...newDay('recipe'),recipeId:r.id,side:r.defaultSide};}else days[i]=newDay();}
 for(let i=0;i<7;i++)if(days[i].type==='leftovers'&&(days[i].source===null||days[i].source>=i||days[days[i].source].type!=='recipe'))days[i].source=null;
 return days;
}
function swap(state,catalog,index,rng=Math.random){const old=state.days[index];if(old.locked)throw Error('Unlock this meal before swapping.');const used=new Set(state.days.filter(d=>d.type==='recipe').map(d=>d.recipeId));const choices=eligible(state,catalog).filter(r=>!used.has(r.id));if(!choices.length)throw Error('No unused dinners meet your repeat rules. Shorten the repeat gap or choose manually.');const r=choices[Math.floor(rng()*choices.length)];return {...newDay('recipe'),recipeId:r.id,side:r.defaultSide};}
function portions(state,index){return state.people*(1+state.days.filter((d,i)=>d.type==='leftovers'&&d.source===index&&i>index&&d.status!=='skipped').length);}
function mealTitle(d,catalog,days){const r=catalog.find(r=>r.id===d.recipeId);if(d.type==='out')return d.title||'Eating out / takeaway';if(d.type==='custom')return d.title||'My own meal';if(d.type==='leftovers'){const source=days&&days[d.source];return source?'Leftovers: '+mealTitle(source,catalog):'Leftovers';}if(d.type==='empty')return 'Unplanned';return r?r.name+(d.side!=='none'?' with '+SIDES[d.side].name.toLowerCase():''):'Choose a recipe';}
function confirmWeek(state,catalog){
 const ids=new Set(),recent=excluded(state);
 for(let i=0;i<7;i++){const d=state.days[i];if(d.type==='recipe'){const r=catalog.find(r=>r.id===d.recipeId);if(!r||!r.eligible)throw Error('Choose a dinner for every recipe day.');if(ids.has(r.id))throw Error('The week contains a duplicate recipe. Swap or remove it.');if(recent.has(r.id))throw Error(r.name+' is inside your repeat gap. Swap it or shorten the gap.');if(state.noFish&&r.fish)throw Error('A fish meal is selected while No fish is enabled.');ids.add(r.id);}if(d.type==='custom'&&!d.title.trim())throw Error('Give your own meal a name.');if(d.type==='leftovers'&&(d.source===null||d.source>=i||state.days[d.source].type!=='recipe'))throw Error('Link each leftovers day to an earlier recipe day.');}
 const next=clone(state);const days=clone(state.days);for(const d of days)if(d.type==='leftovers')d.recipeId=days[d.source].recipeId;
 const record={week:state.week,people:state.people,days,confirmedAt:new Date().toISOString()};next.history=state.history.filter(w=>w.week!==state.week).concat(record).sort((a,b)=>a.week.localeCompare(b.week));next.days=days;next.confirmed=true;return next;
}
function fmtItem(item,factor){return item.template.replace(/§(\d+)§/g,(_,i)=>{const q=item.amounts[i];return q?amount(q.min*factor)+(q.max!==q.min?'–'+amount(q.max*factor):''):'';});}
const prep=/,.*$|\([^)]*\)/g;
function normalName(name){return name.toLowerCase().replace(prep,'').replace(/\b(finely|roughly|fresh|peeled|chopped|minced|diced|sliced|grated|uncooked|dried)\b/g,'').replace(/\s+/g,' ').trim().replace(/^minced beef$/,'beef mince').replace(/^garlic cloves?$/,'garlic').replace(/^onions$/,'onion').replace(/^red onions$/,'red onion').replace(/^carrots$/,'carrot').replace(/^potato$/,'potatoes').replace(/^limes$/,'lime').replace(/^lemons$/,'lemon');}
function category(name){if(/chicken|beef|pork|pancetta|chorizo|prawn|salmon|lamb|mince|sausage/.test(name)&&!/stock|sauce/.test(name))return 'Meat & seafood';if(/milk|cream|cheese|parmesan|pecorino|mozzarella|ricotta|feta|stilton|butter(?! bean)|yoghurt|egg/.test(name))return 'Dairy & eggs';if(/onion|garlic|ginger|pepper(?!corn)|carrot|potato|potatoes|lemon|lime|spinach|broccoli|coriander(?! powder)|parsley|basil|celery|courgette|asparagus|lettuce|greens|cucumber|spring onion|tomato(?! purée| paste|tin)|mushroom|avocado|mangetout/.test(name))return 'Fruit & vegetables';return 'Cupboard & other';}
function practicalItem(item,source){
 const raw=item.template.toLowerCase();
 // Loose cooking measures cannot be converted to reliable purchase weights.
 const weighed=/^§0§\s*(?:g|kg)\b/.test(raw);
 if(!weighed&&!/dried|ground|powder|sauce|paste|pesto/.test(raw)){
  const herb=raw.match(/\b(parsley|rosemary|thyme|chives|basil|dill|mint)\b/)||(/fresh coriander|coriander (?:stalks|leaves)|handful[^.]*coriander/.test(raw)?['','coriander']:null);
  if(herb){const name='Fresh '+herb[1];return {key:'herb:'+herb[1],name,display:name+' — buy by the bunch or pack',check:true,category:'Fruit & vegetables',source};}
 }
 const vague=raw.match(/\b(handfuls?|knobs?|pinches?|splashes?|drizzles?|thumb[^ ]*(?:-sized)?|thumb tip-sized)\b/);
 if(vague){
  let name=raw.replace(/§\d+§/g,'').replace(/\([^)]*\)/g,'').replace(/,.*$/,'').trim();
  if(/knob.*butter/.test(name))name='butter';
  else if(/ginger/.test(name))name='fresh ginger';
  else name=name.replace(/^(?:a |an |small |good )*/,'').replace(/^(?:handfuls?|pinches?|splashes?|drizzles?)\s*(?:of\s*)?/,'').replace(/:\s*(?:pinches?|splashes?)$/,'').trim();
  const cupboard=/salt|pepper|oil|butter|sugar|sauce|garam masala/.test(name);
  return {key:'loose:'+normalName(name),name,display:name+' — '+(cupboard?'check cupboard':'check amount needed'),check:!cupboard,category:category(name),source};
 }
 return null;
}
function wholePurchase(unit,name){if(['clove','pack','tin','punnet','nest','slice','head','stalk','stick','sprig','piece'].includes(unit))return true;return !unit&&/\b(onions?|carrots?|peppers?|leeks?|courgettes?|lemons?|limes?|eggs?|breasts?|thighs?|fillets?|buns?|tortillas?|potatoes|celery sticks?|chillies|chilli|garlic cloves?|bay lea(?:f|ves)|cardamom|cloves?|cinnamon sticks?|lemongrass stalks?|sultanas?|gherkins?|stock cubes?|pastry case)\b/i.test(name);}
function itemRow(item,factor,recipe){
 const practical=practicalItem(item,recipe);if(practical)return practical;
 const text=fmtItem(item,factor);if(!item.amounts.length)return {key:'check:'+normalName(text),name:text,display:text,check:!/salt|pepper|to taste|drizzle|splash|pinch|handful|sprig/.test(text.toLowerCase()),category:category(text.toLowerCase()),source:recipe};
 const q=item.amounts[0];let raw=item.template;
 if(!raw.startsWith('§0§')||item.amounts.length!==1){if(item.amounts.length===1&&/\b(?:lemon|lime)s?\b/i.test(raw)&&/juice|zest/i.test(raw)){const name=raw.match(/\b(lemon|lime)s?\b/i)[1].toLowerCase();return {key:'|'+name,name,unit:'',min:q.min*factor,max:q.max*factor,check:false,purchaseWhole:true,category:'Fruit & vegetables',source:recipe};}return {key:'complex:'+text,display:text,check:false,category:category(text.toLowerCase()),source:recipe};}
 raw=raw.replace(/^§0§\s*/,'');let min=q.min*factor,max=q.max*factor,unit='',name=raw;
 const tin=raw.match(/^[×x]\s*(\d+)\s*g\s+tin\s+(.+)$/i);
 if(tin){min*=Number(tin[1]);max*=Number(tin[1]);unit='g';name=tin[2];}
 else {const m=raw.match(/^(?:small\s+)?(kg|g|ml|litres?|l|tbsp|tsp|cups?|slices?|packs?|tins?|cans?|punnets?|nests?|heads?|stalks?|sticks?|sprigs?|pieces?|cm)\b\s*(.*)$/i);if(m){unit=m[1].toLowerCase();name=m[2];if(unit==='kg'){min*=1000;max*=1000;unit='g';}if(['l','litre','litres'].includes(unit)){min*=1000;max*=1000;unit='ml';}if(unit==='tbsp'){min*=3;max*=3;unit='tsp';}unit=unit.replace(/^(packs|tins|cans|cups|slices|punnets|nests|heads|stalks|sticks|sprigs|pieces)$/,(s)=>s.slice(0,-1));if(unit==='can')unit='tin';}}
 if(/^garlic cloves?/.test(name)){name=name.replace(/^garlic cloves?/,'garlic');unit='clove';}
 if(/^cloves?\s+garlic/.test(name)){name=name.replace(/^cloves?\s+garlic/,'garlic');unit='clove';}
 name=name.replace(/\s*\(.*?\)/g,'').replace(/\s*;.*$/,'').trim();const keyName=normalName(name);return {key:unit+'|'+keyName,name,unit,min,max,check:false,purchaseWhole:wholePurchase(unit,name),category:category(keyName),source:recipe};
}
function manualItems(text,base=1){return text.split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s+(.*)$/);return m?{template:'§0§ '+m[3],amounts:[{min:Number(m[1]),max:Number(m[2]||m[1])}]}:{template:s,amounts:[]};});}
function shopping(state,catalog){const merged=new Map();function push(item,factor,source){if(/^(?:§\d+§\s*)?(?:(?:ml|litres?|l|tbsp|tsp|cold|hot|boiling)\s+)*water\b|^a splash of water/i.test(item.template))return;const row=itemRow(item,factor,source);if(merged.has(row.key)&&row.min!==undefined){const prev=merged.get(row.key);prev.min+=row.min;prev.max+=row.max;prev.sources.add(source);}else if(merged.has(row.key))merged.get(row.key).sources.add(source);else merged.set(row.key,{...row,sources:new Set([source])});}
 state.days.forEach((d,i)=>{if(d.status==='skipped')return;if(d.type==='recipe'){const r=catalog.find(r=>r.id===d.recipeId);if(!r)return;const count=portions(state,i);for(const item of r.ingredients)if(state.optional||!item.optional)push(item,count/r.baseServings,r.name);if(d.side!=='none'){const s=SIDES[d.side],n=d.sideAmount===null?s.amount:d.sideAmount;push({template:'§0§ '+s.unit+' '+s.ingredient,amounts:[{min:n,max:n}]},count,'Side: '+s.name);}}if(d.type==='custom')for(const item of manualItems(d.ingredients))push(item,state.people/d.customBase,d.title);});
 for(const item of manualItems(state.extras))push(item,1,'Extra shopping');
 return [...merged.values()].map(r=>{if(r.min!==undefined){let min=r.min,max=r.max,unit=r.unit;if(r.purchaseWhole){min=max=Math.ceil(max-1e-9);r.purchaseQuantity=max;r.purchaseNote='Rounded up for buying; use the recipe quantities when cooking.';}if(unit==='tsp'&&min>=3){min/=3;max/=3;unit='tbsp';}r.display=amount(min)+(max!==min?'–'+amount(max):'')+(unit?' '+unit:'')+' '+r.name;}r.sources=[...r.sources];return r;}).sort((a,b)=>a.category.localeCompare(b.category)||a.display.localeCompare(b.display));
}
function shoppingText(state,catalog){return shopping(state,catalog).filter(r=>!state.checked.includes(r.key)).map(r=>r.display+(r.check&&!/check|buy by/i.test(r.display)?' — quantity needed':'')).join('\n');}
return {TYPES,SIDES,clone,amount,localDate,parseDate,monday,addDays,newDay,initial,validate,excluded,eligible,generate,swap,portions,mealTitle,confirmWeek,fmtItem,itemRow,manualItems,shopping,shoppingText};
});
