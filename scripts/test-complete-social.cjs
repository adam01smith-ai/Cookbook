const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),m=require('./complete-social-metadata.cjs');
test('all indexable pages have unique complete metadata and correctly sized JPEG images',()=>{
assert.deepEqual(m.validate().errors,[]);
for(const f of m.pages){const p=m.inspect(fs.readFileSync(path.join(root,f),'utf8'));const u=new URL(p.tags['og:image'][0]),b=fs.readFileSync(path.join(root,decodeURIComponent(u.pathname.slice(1))));
assert.equal(b.readUInt16BE(0),0xffd8,f);let size;
for(let i=2;i<b.length;){assert.equal(b[i],255);const marker=b[i+1],len=b.readUInt16BE(i+2);if([0xc0,0xc1,0xc2].includes(marker)){size=[b.readUInt16BE(i+7),b.readUInt16BE(i+5)];break;}i+=len+2;}
assert.deepEqual(size,[+p.tags['og:image:width'][0],+p.tags['og:image:height'][0]],f);}
});
test('metadata generation is idempotent and preserves every body and structured data block',()=>{
const before=new Map(m.pages.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
m.generate();for(const [f,s]of before){const now=fs.readFileSync(path.join(root,f),'utf8');assert.equal(now,s,f);assert.equal(now.split('</head>')[1],s.split('</head>')[1]);}
});
for(const f of ['croque-monsieur.html','index.html','meal-planner.html'])test('sharing fallbacks use canonical metadata on '+f,()=>{
const s=fs.readFileSync(path.join(root,f),'utf8'),dom=new JSDOM(s,{url:'https://www.adamcooks.co.uk/'+f+'?private=1#method',runScripts:'outside-only'}),w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.eval(fs.readFileSync(path.join(root,'recipe-share.js'),'utf8'));d.dispatchEvent(new w.Event('DOMContentLoaded'));assert.equal(d.querySelectorAll('[data-share-recipe]').length,1);d.querySelector('[data-share-recipe]').click();
const p=m.inspect(s),url=p.canonicals[0],links=[...d.querySelectorAll('.recipe-share-dialog a')].map(a=>new URL(a.href));assert.equal(links.length,3);assert.equal(links[0].searchParams.get('text'),p.tags['og:title'][0]+' '+url);assert.equal(links[1].searchParams.get('u'),url);assert.equal(links[2].searchParams.get('url'),url);assert.equal(links[2].searchParams.get('media'),p.tags['og:image'][0]);w.close();
});

