const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('carousel covers each published photo and URL, respects reduced motion and wraps backwards', async () => {
  const dom = new JSDOM(read('recipes.html'), {runScripts:'outside-only', url:'https://example.test/recipes.html'});
  const w = dom.window, d = w.document;
  w.matchMedia = () => ({matches:true,addEventListener(){}});
  w.HTMLImageElement.prototype.decode = async function() {
    assert(fs.existsSync(path.join(root,this.getAttribute('src').split('?')[0])));
  };
  w.eval(read('recipe-data.js'));
  w.eval(read('recipes-collection.js'));
  const link = d.querySelector('.hero-content a');
  const seen = new Set();
  assert.equal(d.querySelector('.hero-play').textContent, 'Play rotation');
  for (const recipe of w.COOKBOOK_RECIPES) {
    const file = link.getAttribute('href');
    assert(!seen.has(file));
    seen.add(file);
    const card = [...d.querySelectorAll('.card-link')].find(a => a.getAttribute('href') === file);
    assert.equal(d.querySelector('.hero-content h1').textContent,card.querySelector('h2').textContent);
    d.querySelector('.hero-next').click();
    await new Promise(resolve=>setImmediate(resolve));
  }
  assert.deepEqual(seen,new Set(w.COOKBOOK_RECIPES.map(r=>r.file)));
  assert.equal(link.getAttribute('href'),'karahi.html');
  d.querySelector('.hero-prev').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(link.getAttribute('href'),[...seen].at(-1));
  dom.window.close();
});
