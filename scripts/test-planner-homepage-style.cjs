const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'meal-planner.html'),'utf8');
const navScript=fs.readFileSync(path.join(root,'homepage.js'),'utf8');
const style=fs.readFileSync(path.join(root,'meal-planner-theme.css'),'utf8');

test('planner uses homepage branding and presentation-only styles',()=>{
  assert.match(html,/class="home-header"/);
  assert.match(html,/class="home-logo"/);
  assert.match(html,/ADAM COOKS<span>REAL RECIPES FOR EVERYDAY COOKING<\/span>/);
  assert.match(html,/meal-planner\.html" aria-current="page"/);
  assert.match(html,/href="homepage\.css\?v=1"/);
  assert.match(html,/href="meal-planner-theme\.css\?v=2"/);
  assert.match(html,/src="homepage\.js\?v=1"/);
  assert.match(style,/\.planner-page \.planner-intro-hero/);
  assert.match(style,/--forest:#0e351b/);
  assert.doesNotMatch(html,/class="site-header"/);
  for(const id of ['week-start','people','dinner-count','repeat-gap',
    'no-fish','vegetarian-target','variety-time','generate',
    'meals','variety-score','use-variety','shopping-panel','history-panel',
    'base-gravy-choice','confirm-week','week-tab','shopping-tab','history-tab']){
    assert.match(html,new RegExp('id="'+id+'"'),id+' still exists');
  }
});

for(const width of [375,390,768,1280,1440]){
  test('planner homepage navigation works at '+width,()=>{
    const dom=new JSDOM(html,{
      url:'https://www.adamcooks.co.uk/meal-planner.html',
      runScripts:'outside-only'
    });
    const w=dom.window,d=w.document;
    w.matchMedia=()=>({matches:width<768,addEventListener(){}});
    w.eval(navScript);
    const toggle=d.querySelector('.home-menu-toggle');
    const nav=d.getElementById('home-navigation');
    assert(toggle&&nav);
    assert.equal(nav.hidden,width<768);
    assert.equal(nav.querySelector('[aria-current="page"]').getAttribute('href'),'meal-planner.html');
    assert.equal(nav.querySelector('[data-home-search]').getAttribute('href'),'recipes.html#search');
    assert(nav.querySelector('a[href="favourites.html"]'));
    if(width<768){
      toggle.click();
      assert.equal(nav.hidden,false);
      nav.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      assert.equal(nav.hidden,true);
      assert.equal(d.activeElement,toggle);
    }
    assert.equal(d.querySelectorAll('[data-tab]').length,3);
    assert.equal(d.querySelectorAll('#week-panel #meals').length,1);
    w.close();
  });
}

test('photographic cards retain editing, portions, feedback and accessible tab shortcuts',()=>{
  const dom=new JSDOM(html,{url:'https://www.adamcooks.co.uk/meal-planner.html',runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  w.CookbookPrivacy={allowed:()=>false,storage:{get:()=>null}};
  for(const file of ['recipe-data.js','planner-metadata.js','planner-intelligence.js','planner-core.js','planner-app.js']){
    w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  }
  assert.equal(d.querySelectorAll('.meal').length,7);
  const edit=d.querySelector('.meal-edit');
  edit.open=true;
  const portions=edit.querySelector('[data-action="extra-portions"]');
  portions.value='3';
  portions.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert(d.querySelector('.meal-edit').open,'editing stays expanded after a change');
  assert.match(d.querySelector('.portion-summary').textContent,/5 portions/);
  assert(d.querySelector('.meal-edit [data-action="rating"]'));
  assert(d.querySelector('.meal-edit [data-action="side"]'));
  assert(d.querySelector('.meal-edit [data-action="type"]'));
  d.querySelector('[data-open-tab="shopping"]').click();
  assert.equal(d.querySelector('#shopping-panel').hidden,false);
  assert.equal(d.activeElement,d.querySelector('#shopping-tab'));
  d.querySelector('[data-open-tab="history"]').click();
  assert.equal(d.querySelector('#history-panel').hidden,false);
  assert.equal(d.activeElement,d.querySelector('#history-tab'));
  assert.equal(d.querySelector('.planner-help a').getAttribute('href'),'how-to-use.html#plan');
  assert.equal(d.querySelector('.planner-portrait img').getAttribute('src'),'images/adam-planner-support.jpg');
  w.close();
});
