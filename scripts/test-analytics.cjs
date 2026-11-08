const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const privacy=fs.readFileSync(path.join(root,'site-privacy.js'),'utf8');
const analytics=fs.readFileSync(path.join(root,'site-analytics.js'),'utf8');
const KEY='adam-cooks-consent-v1',ID='G-002QLTW2TV';
const record=(extra={})=>({version:2,decided:true,planner:false,drafts:false,analytics:false,expires:Date.now()+86400000,...extra});
function setup(choice,{blocked=false,privacyLoaded=true}={}){
 const dom=new JSDOM('<!doctype html><head><title>Recipe test</title></head><body><input id="pantry-input" value="private cooking brief"></body>',{
  url:'https://www.adamcooks.co.uk/pantry.html?private=secret#private',referrer:'https://example.net/private?secret=yes',runScripts:'outside-only'
 });
 const w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.confirm=()=>true;
 if(choice!==undefined)w.localStorage.setItem(KEY,typeof choice==='string'?choice:JSON.stringify(choice));
 w.localStorage.setItem('my-cookbook-planner-v1','keep my plan');
 if(blocked){w.Storage.prototype.getItem=()=>{throw Error('blocked');};w.Storage.prototype.setItem=()=>{throw Error('blocked');};}
 if(privacyLoaded){w.eval(privacy);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));}
 w.eval(analytics);
 const google=()=>[...w.document.scripts].filter(s=>s.src.startsWith('https://www.googletagmanager.com/'));
 const commands=()=>Array.from(w.dataLayer||[],x=>JSON.parse(JSON.stringify(Array.from(x))));
 function saveAnalytics(on){w.CookbookPrivacy.open();w.document.getElementById('privacy-analytics').checked=on;w.document.querySelector('[data-save]').click();}
 return {dom,w,google,commands,saveAnalytics,close:()=>dom.window.close()};
}

test('no Google tag or command before an explicit analytics choice; rejection keeps it blocked',()=>{
 const x=setup();try{
  assert.equal(x.google().length,0);assert.equal(x.commands().length,0);assert.equal(x.w['ga-disable-'+ID],true);
  x.w.document.querySelector('.privacy-banner [data-reject]').click();
  assert.equal(x.google().length,0);assert.equal(x.w.CookbookPrivacy.allowed('analytics'),false);
 }finally{x.close();}
});
test('old saving consent is preserved but never becomes analytics consent',()=>{
 const x=setup(record({version:1,planner:true,drafts:true,analytics:undefined}));try{
  assert.equal(x.w.CookbookPrivacy.allowed('planner'),true);assert.equal(x.w.CookbookPrivacy.allowed('drafts'),true);
  assert.equal(x.w.CookbookPrivacy.allowed('analytics'),false);assert.equal(x.google().length,0);
  assert.equal(x.w.document.querySelector('.privacy-banner').hidden,false);
  x.w.CookbookPrivacy.open();assert.equal(x.w.document.getElementById('privacy-analytics').checked,false);
 }finally{x.close();}
});
test('separate analytics opt-in sends one sanitized page view and keeps advertising denied',()=>{
 const x=setup();try{
  x.saveAnalytics(true);assert.equal(x.google().length,1);assert.ok(x.google()[0].src.endsWith('id='+ID));
  assert.equal(x.w.CookbookPrivacy.allowed('planner'),false);assert.equal(x.w.CookbookPrivacy.allowed('analytics'),true);
  const config=x.commands().find(c=>c[0]==='config');assert.equal(config[1],ID);
  assert.equal(config[2].allow_google_signals,false);assert.equal(config[2].allow_ad_personalization_signals,false);
  const views=x.commands().filter(c=>c[0]==='event'&&c[1]==='page_view');assert.equal(views.length,1);
  assert.equal(views[0][2].page_location,'https://www.adamcooks.co.uk/pantry.html');
  assert.equal(views[0][2].page_referrer,'https://example.net/');
  const consent=x.commands().filter(c=>c[0]==='consent').at(-1)[2];
  assert.equal(consent.analytics_storage,'granted');for(const key of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(consent[key],'denied');
  assert.ok(!JSON.stringify(x.commands()).includes('secret'));assert.ok(!JSON.stringify(x.commands()).includes('private cooking brief'));
  x.w.dispatchEvent(new x.w.Event('focus'));assert.equal(x.commands().filter(c=>c[0]==='event').length,1);
 }finally{x.close();}
});
test('withdrawal disables collection and clears cookies without deleting saved plans',()=>{
 const x=setup(record({planner:true,analytics:true}));try{
  assert.equal(x.google().length,1);x.google()[0].dispatchEvent(new x.w.Event('load'));
  x.w.document.cookie='_ga=old-id; Domain=.adamcooks.co.uk; Path=/; Secure';
  x.w.document.cookie='_ga_002QLTW2TV=old-session; Path=/; Secure';
  x.saveAnalytics(false);assert.equal(x.w['ga-disable-'+ID],true);assert.equal(x.google().length,0);
  assert.ok(!x.w.document.cookie.includes('_ga'));assert.equal(x.w.localStorage.getItem('my-cookbook-planner-v1'),'keep my plan');
  assert.equal(x.commands().filter(c=>c[0]==='consent').at(-1)[2].analytics_storage,'denied');
  x.saveAnalytics(true);assert.equal(x.google().length,0,'loaded Google library is not downloaded twice');
  assert.equal(x.commands().filter(c=>c[0]==='event').length,1,'no duplicate page view on regrant');
 }finally{x.close();}
});
test('reject all and cross-tab withdrawal both stop an active tag',()=>{
 const x=setup(record({analytics:true}));try{
  x.w.dispatchEvent(new x.w.StorageEvent('storage',{key:KEY,newValue:JSON.stringify(record())}));
  assert.equal(x.w['ga-disable-'+ID],true);assert.equal(x.w.CookbookPrivacy.allowed('analytics'),false);
  x.saveAnalytics(true);x.w.document.querySelector('.privacy-dialog [data-reject]').click();
  assert.equal(x.w['ga-disable-'+ID],true);assert.equal(x.w.CookbookPrivacy.allowed('analytics'),false);
 }finally{x.close();}
});
test('expired, malformed and missing consent fail closed, including when privacy script fails',()=>{
 for(const choice of [record({analytics:true,expires:Date.now()-1}),'{bad json',record({analytics:'yes'})]){
  const x=setup(choice);try{assert.equal(x.google().length,0);assert.equal(x.w['ga-disable-'+ID],true);}finally{x.close();}
 }
 const x=setup(undefined,{privacyLoaded:false});try{assert.equal(x.google().length,0);}finally{x.close();}
});
test('consent expiration in an open tab stops collection and asks again',()=>{
 const expiry=Date.now()+10000,x=setup(record({analytics:true,expires:expiry}));try{
  x.w.Date.now=()=>expiry+1;x.w.dispatchEvent(new x.w.Event('focus'));
  assert.equal(x.w['ga-disable-'+ID],true);assert.equal(x.w.document.querySelector('.privacy-banner').hidden,false);
 }finally{x.close();}
});
test('blocked storage still permits a deliberate session-only analytics choice',()=>{
 const x=setup(undefined,{blocked:true});try{
  assert.equal(x.google().length,0);x.saveAnalytics(true);assert.equal(x.google().length,1);
  assert.ok(x.w.document.querySelector('.privacy-feedback').textContent.includes('applies to this visit'));
 }finally{x.close();}
});
test('clearing saved plans preserves a separate analytics choice',()=>{
 const x=setup(record({planner:true,analytics:true}));try{
  x.w.CookbookPrivacy.open();x.w.document.querySelector('.privacy-clear').click();
  assert.equal(x.w.CookbookPrivacy.allowed('analytics'),true);assert.equal(x.w.CookbookPrivacy.allowed('planner'),false);
  assert.equal(x.w.localStorage.getItem('my-cookbook-planner-v1'),null);
 }finally{x.close();}
});
