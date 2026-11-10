#!/usr/bin/env python3
"""Render the reviewed, recipe-specific guidance into static recipe pages."""
from pathlib import Path
from html import escape
import argparse
import json,re
ROOT=Path(__file__).resolve().parents[1]
CHILL='https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely'
COOK='https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food#using-your-leftovers'
RICE='https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker'
SAFETY={
 'general':'Cool cooked leftovers in small portions and refrigerate within 2 hours. Keep the fridge at 0–5°C and the freezer around −18°C. Freeze suitable leftovers promptly. Defrost fully in the fridge and use within 24 hours. Reheat only once, until steaming hot all the way through. Follow any shorter use-by or opened-pack instructions; using older cooked ingredients does not restart their storage time.',
 'rice':'Rice needs faster cooling: cool quickly, ideally within 1 hour, and refrigerate; use within 24 hours. If freezing freshly cooked rice, cool it quickly and freeze within 1 hour. Defrost in the fridge and use within 24 hours. Reheat only once until steaming hot throughout and eat immediately. Do not heat rice again if it was already reheated, including a heated microwave pouch. Keep the fridge at 0–5°C and the freezer around −18°C.',
 'bread':'These notes are for the baked, unfilled loaf. Keep bread dry and well wrapped; discard the whole loaf if mould appears. Once you add perishable fillings or toppings, follow their fridge storage guidance instead. Keep the freezer around −18°C and take out only the slices you need.',
 'baking':'Cool baked cookies fully before sealing to avoid condensation. Use clean containers and keep them dry. Do not eat raw flour or raw cookie dough. If adding fresh cream or another perishable topping, refrigerate and follow that ingredient’s shorter storage instructions.',
 'cold':'Keep chilled food at 0–5°C and follow the shortest ingredient use-by or opened-pack instruction. For cooked desserts, cool promptly and refrigerate within 2 hours; do not leave them out overnight. Freeze suitable portions promptly, keep the freezer around −18°C, defrost in the fridge and use within 24 hours. Do not refreeze a thawed serving.'
}
def render(selected=None):
 notes=json.loads((ROOT/'recipe-guidance.json').read_text())
 src=(ROOT/'recipe-data.js').read_text();recipes=json.loads(src[src.index('=')+1:].rstrip(';\n'))
 if set(notes)!={r['file'] for r in recipes}:raise ValueError('Every catalogue recipe needs reviewed guidance; remove stale guidance entries too.')
 if selected:
  missing=set(selected)-set(notes)
  if missing:raise ValueError(f'Unknown recipes: {sorted(missing)}')
  notes={file:note for file,note in notes.items() if file in selected}
 changed=0
 for file,note in notes.items():
  path=ROOT/file;s=path.read_text();before=s
  # Remove only our own block before regenerating it.
  s=re.sub(r'<section class="recipe-tips" aria-labelledby="tips-heading">.*?</section>','',s,flags=re.S)
  if 'recipe-tips.css?v=1' not in s:s=s.replace('</head>','<link rel="stylesheet" href="recipe-tips.css?v=1"></head>')
  if 'href="#tips-heading"' not in s:
   nav=re.search(r'<nav class="recipe-jumps".*?</nav>',s,re.S)
   if nav:s=s[:nav.end()-6]+'<a href="#tips-heading">Tips &amp; leftovers</a>'+s[nav.end()-6:]
   else:
    s=s.replace('<h2>Ingredients</h2>','<h2 id="ingredients-heading">Ingredients</h2>',1).replace('<h2>Method</h2>','<h2 id="method-heading">Method</h2>',1)
    nav='<nav class="recipe-jumps" aria-label="Recipe sections"><a href="#ingredients-heading">Ingredients</a><a href="#method-heading">Method</a><a href="#tips-heading">Tips &amp; leftovers</a></nav>'
    assert '<div class="recipe-layout">' in s,file
    s=s.replace('<div class="recipe-layout">',nav+'<div class="recipe-layout">',1)
  cards=''.join('<div><h3>'+label+'</h3><p>'+escape(note[key])+'</p></div>' for key,label in [('storage','Storage &amp; leftovers'),('freezing','Freezing'),('reheating','Reheating'),('substitutions','Substitutions')])
  kind=note.get('safety','general');common=SAFETY[kind]
  # Perishable desserts use the cold-food storage note, not room-temperature bread advice.
  if file in {'lemon-cheesecake.html','key-lime-pie.html','carrot-cake.html','creme-brulee.html'}:common=SAFETY['cold']
  if note.get('finishedFreezingRecommended') is False:
   common='Keep chilled food at 0–5°C and follow the shortest ingredient use-by or opened-pack instruction. Cool cooked leftovers in small portions and refrigerate within 2 hours. Reheat suitable cooked leftovers only once, until steaming hot throughout; ingredients already reheated in this recipe must not be reheated again. Serve chilled desserts cold. Freezing recommendations and any exceptions for a base prepared without cream or prawns are explained in this recipe’s Freezing note.'
   if kind=='rice':common+=' Cool rice quickly, ideally within 1 hour, refrigerate and use within 24 hours. Do not reheat rice that has already been reheated, including a heated microwave pouch.'
  source='<p class="recipe-tips-source">Food-safety guidance: <a href="'+CHILL+'">Food Standards Agency: chilling and freezing</a> · <a href="'+COOK+'">reheating leftovers</a>'
  if kind=='rice':source+=' · <a href="'+RICE+'">cooked rice</a>'
  source+='.</p>'
  block='<section class="recipe-tips" aria-labelledby="tips-heading"><h2 id="tips-heading">Tips &amp; leftovers</h2><div class="recipe-tips-grid">'+cards+'</div><details class="recipe-tips-safety"><summary>Keeping leftovers safe</summary><p>'+escape(common)+'</p>'+source+'</details></section>'
  main_start=s.index('<main');main_end=s.index('</main>',main_start)
  footer=s.rfind('<footer',main_start,main_end)
  scripts=s.find('<script',main_start,main_end)
  at=footer if footer>=0 else scripts if scripts>=0 else main_end
  s=s[:at]+block+s[at:]
  if s!=before:path.write_text(s);changed+=1
 print(f'Rendered {len(notes)} recipe guidance sections; {changed} pages changed.')
if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--pages',nargs='+',help='Render guidance only for the named recipes.')
 render(parser.parse_args().pages)
