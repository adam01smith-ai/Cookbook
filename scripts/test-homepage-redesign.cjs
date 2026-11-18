const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
for(const width of [375,390,768,1280,1440])test('homepage navigation and search disclosure at '+width,()=>{
const d=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://www.adamcooks.co.uk/',runScripts:'outside-only'}),w=d.window,doc=w.document;w.matchMedia=()=>({matches:width<768,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
w.eval(fs.readFileSync(path.join(root,'homepage.js'),'utf8'));
const menu=doc.querySelector('.home-menu-toggle'),nav=doc.getElementById('home-navigation');assert.equal(nav.hidden,width<768);
if(width<768){menu.click();assert.equal(nav.hidden,false);nav.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(nav.hidden,true);assert.equal(doc.activeElement,menu);}
assert.equal(doc.querySelector('[data-home-search]').getAttribute('href'),'recipes.html#search');
assert.equal(doc.querySelectorAll('.home-card').length,3);assert.equal(doc.querySelectorAll('#recipes .recipe-card').length,0);assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelector('.home-support a').href,'https://buymeacoffee.com/adam01smith');w.close();});

