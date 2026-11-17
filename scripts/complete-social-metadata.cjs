'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='https://www.adamcooks.co.uk/';
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const attrs=t=>Object.fromEntries([...t.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(m=>[m[1].toLowerCase(),m[3]]));
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const canonical=f=>base+(f==='index.html'?'':encodeURIComponent(f));
function inspect(s){const head=s.split(/<\/head>/i)[0];const tags={};for(const t of head.match(/<meta\b[^>]*>/gi)||[]){const a=attrs(t),k=a.property||a.name;if(k)(tags[k]??=[]).push(decode(a.content||''));}
return {tags,titles:[...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(m=>decode(m[1].trim())),canonicals:(head.match(/<link\b[^>]*>/gi)||[]).map(attrs).filter(a=>a.rel==='canonical').map(a=>decode(a.href||''))};}
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).filter(f=>!/^google-site-verification:/.test(read(f))&&!/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(read(f)));
function generate(){const sample=inspect(read('sticky-gochujang-chicken-noodles.html'));
if(!sample)throw Error('No approved social image found');
for(const f of pages){let s=read(f),p=inspect(s);if(!p.titles[0])throw Error('Missing title: '+f);
const recipe=/"@type"\s*:\s*"Recipe"/.test(s);
const summaries={
'index.html':"Browse Adam's recipes and plan your meals for the week.",
'contact.html':'Contact Adam Cooks with feedback or questions about the recipes and website.',
'about.html':'Learn about Adam Cooks, the recipe collection and the tools available for planning and cooking meals.',
'breakfast.html':'Browse breakfast and brunch recipes on Adam Cooks, with measured ingredients and step-by-step cooking instructions.',
'cookbook.html':'Keep your favourite Adam Cooks recipes, collections and cooking notes together in My Cookbook.',
'desserts.html':'Browse dessert recipes on Adam Cooks, with measured ingredients and step-by-step methods.',
'fakeaway.html':'Explore fakeaway recipes on Adam Cooks and cook takeaway-inspired meals at home.',
'favourites.html':'Browse and manage your favourite recipes from the Adam Cooks collection.',
'how-to-use.html':'Learn how to browse recipes, adjust servings and use the meal planner and cooking tools on Adam Cooks.',
'lunches.html':'Browse lunch recipes on Adam Cooks, with measured ingredients and step-by-step methods.',
'meal-planner.html':'Plan a varied week of dinners, keep meals you like, swap recipes and build a shopping list with the Adam Cooks meal planner.',
'pantry.html':'Use Vibe cooking on Adam Cooks to turn the ingredients and meals you fancy into meal ideas.',
'privacy.html':'Read how Adam Cooks handles privacy, browser storage and your choices for saving plans and cooking information.'
};
let description=p.tags.description?.[0]||p.tags['og:description']?.[0]||summaries[f];
if(!description)throw Error('Review a meaningful description for '+f);
const values={description,'og:title':p.tags['og:title']?.[0]||p.titles[0],'og:description':p.tags['og:description']?.[0]||description,'og:url':canonical(f),'og:type':recipe?'article':'website','og:site_name':'Adam Cooks','og:locale':'en_GB'};
for(const key of ['og:image','og:image:width','og:image:height','og:image:type','og:image:alt'])values[key]=p.tags[key]?.[0]||sample.tags[key]?.[0];
values['og:image:secure_url']=values['og:image'];
for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':values['og:title'],'twitter:description':values['og:description'],'twitter:image':values['og:image'],'twitter:image:alt':values['og:image:alt']}))values[key]=p.tags[key]?.[0]||value;
// Edit only owned head tags; structured data and body content stay byte-for-byte intact.
const end=s.indexOf('</head>');let head=s.slice(0,end).replace(/<!-- complete-social:start -->[\s\S]*?<!-- complete-social:end -->\s*/g,''),body=s.slice(end);
head=head.replace(/<meta\b[^>]*>/gi,t=>{const a=attrs(t);return Object.hasOwn(values,a.property||a.name)?'':t;}).replace(/<link\b[^>]*>/gi,t=>attrs(t).rel==='canonical'?'':t);
head=head.trimEnd()+'\n<!-- complete-social:start -->\n<link rel="canonical" href="'+canonical(f)+'">\n'+Object.entries(values).map(([k,v])=>'<meta '+(k.startsWith('og:')?'property':'name')+'="'+k+'" content="'+esc(v)+'">').join('\n')+'\n';
if(recipe||['index.html','meal-planner.html'].includes(f)){
if(!/src=["']recipe-share\.js/.test(head+body))head+='<script defer src="recipe-share.js?v=seo-1"></script>\n';
if(!/href=["']recipe-share\.css/.test(head+body))head+='<link rel="stylesheet" href="recipe-share.css?v=seo-1">\n';
}
head+='<!-- complete-social:end -->\n';
fs.writeFileSync(path.join(root,f),head+body);
}}
function validate(){const errors=[],titles=new Map(),descriptions=new Map();for(const f of pages){const p=inspect(read(f));for(const [name,values] of [['title',p.titles],['canonical',p.canonicals],...Object.entries(p.tags).filter(([k])=>k==='description'||k.startsWith('og:')||k.startsWith('twitter:'))])if(values.length!==1||!values[0])errors.push(f+': invalid or duplicate '+name);
for(const k of ['description','og:title','og:description','og:url','og:image','og:image:width','og:image:height','twitter:card','twitter:title','twitter:description','twitter:image'])if(!p.tags[k]?.[0])errors.push(f+': missing '+k);
if(p.canonicals[0]!==canonical(f)||p.tags['og:url']?.[0]!==canonical(f))errors.push(f+': noncanonical URL');
for(const [label,value,seen]of [['title',p.titles[0],titles],['description',p.tags.description?.[0],descriptions]]){if(seen.has(value))errors.push(f+': duplicate '+label+' with '+seen.get(value));seen.set(value,f);}
for(const k of ['og:image','twitter:image']){try{const u=new URL(p.tags[k]?.[0]);if(u.origin!==base.slice(0,-1)||u.hash)throw Error();const dest=decodeURIComponent(u.pathname.slice(1));if(!fs.existsSync(path.join(root,dest)))errors.push(f+': missing image '+dest);}catch{errors.push(f+': invalid '+k);}}
}return {pages:pages.length,errors};}
if(require.main===module){if(process.argv.includes('--write'))generate();const report=validate();console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;}
module.exports={generate,validate,inspect,canonical,pages};

