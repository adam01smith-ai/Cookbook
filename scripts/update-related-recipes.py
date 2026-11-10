#!/usr/bin/env python3
"""Build three relevant, static cookbook links at the end of every recipe."""
from pathlib import Path
from html import unescape
import json,re
ROOT=Path(__file__).resolve().parents[1]
def read(file):return (ROOT/file).read_text(encoding='utf-8')
def tokens(recipe):
 text=' '.join(i['template'] for i in recipe['ingredients']).lower()
 words=set(re.findall(r'[a-z]{4,}',text))
 return words-{'optional','fresh','chopped','sliced','small','large','black','white','extra','water','stock','ground','taste','salt','pepper','olive','vegetable','cooking','divided','plus','more','finely','drained','plain','sauce','grated','minced','tablespoon','teaspoon','unsalted','butter'}
def build():
 raw=read('recipe-data.js');recipes=json.loads(raw[raw.index('['):raw.rindex(']')+1]);by_file={r['file']:r for r in recipes};timings=json.loads(read('recipe-discovery.json'))
 cards={}
 for article in re.findall(r'<article\b[^>]*class="recipe-card"[^>]*>.*?</article>',read('index.html'),re.S):
  link=re.search(r'<a class="card-link" href="([^"]+)"',article) or re.search(r'<a href="([^"]+)" class="card-link"',article)
  assert link,'Recipe card missing primary link';cards[unescape(link[1])]=article
 assert set(cards)==set(by_file),'Main recipe index must include the complete catalogue'
 overrides={
  'satay-beef-noodles.html':['sticky-gochujang-chicken-noodles.html','chicken-chow-mein.html','ginger-lime-chicken-noodle-soup.html'],
  'sourdough.html':['focaccia.html','tiger-bread.html','mozzarella-pesto-toasties.html'],
  'focaccia.html':['tiger-bread.html','sourdough.html','steak-ciabatta.html'],
  'tiger-bread.html':['focaccia.html','sourdough.html','brioche-french-toast.html'],
  'basegravy.html':['jalfrezi.html','pathia.html','moghul.html'],
  'sofritto-ragu.html':['sofritto-ragu-lasagne.html','sofritto-ragu-tagliatelle.html','baked-ziti.html'],
  'jack-daniels-sauce.html':['jack-daniels-glazed-chicken.html','panda-express-orange-chicken.html','smash-cheeseburgers.html'],
  'panda-express-orange-chicken-sauce.html':['panda-express-orange-chicken.html','jack-daniels-glazed-chicken.html','crispy-chilli-beef.html'],
  'vinaigrette.html':['lemon-chicken-salad.html','mediterranean-pasta-salad.html','pesto-pasta-salad.html'],
  'nacho-cheese-sauce.html':['smash-cheeseburgers.html','slow-cooker-smoky-hot-chilli-con-carne.html','crispy-chilli-beef.html'],
 }
 special={'Desserts','Bread','Breakfast & Brunch','Lunches'}
 def score(a,b):
  category=a['category'];other=b['category'];shared=tokens(a)&tokens(b);value=100 if category==other else 0
  if category=='Desserts' and other!='Desserts':value-=300
  elif category=='Bread':
   if other=='Breakfast & Brunch' or b['file']=='mozzarella-pesto-toasties.html':value+=30
   elif other!='Bread':value-=100
  elif category not in special and other in {'Desserts','Bread','Breakfast & Brunch'}:value-=150
  if category!='Sauces' and other=='Sauces':value-=50
  value+=40*len(shared)/max(1,min(len(tokens(a)),len(tokens(b))))
  if a.get('fish')==b.get('fish'):value+=5
  ta=timings[a['file']]['maxMinutes'];tb=timings[b['file']]['maxMinutes']
  if ta is not None and tb is not None:value+=max(0,10-abs(ta-tb)/15)
  return value
 mapping={}
 for recipe in recipes:
  file=recipe['file'];candidates=[r for r in recipes if r['file']!=file]
  ranked=sorted(candidates,key=lambda r:(-score(recipe,r),r['name'].casefold()))
  chosen=overrides.get(file,[r['file'] for r in ranked[:3]])
  assert len(chosen)==3 and len(set(chosen))==3 and file not in chosen
  assert all(f in by_file for f in chosen)
  mapping[file]=chosen
  rendered=[]
  for candidate in chosen:
   card=cards[candidate];card=card.replace('<h2>','<h3>').replace('</h2>','</h3>')
   card=re.sub(r'<div class="card-related">.*?</div>','',card,flags=re.S)
   rendered.append(card)
  intro='<p class="note">More quick noodle dinners from the cookbook.</p>' if file=='satay-beef-noodles.html' else ''
  block='<!-- related-recipes:start --><section class="related-recipes" id="related-recipes" aria-labelledby="related-recipes-heading"><h2 id="related-recipes-heading">More recipes you might like</h2>'+intro+'<div class="recipe-grid">'+''.join(rendered)+'</div></section><!-- related-recipes:end -->'
  source=re.sub(r'<!-- related-recipes:start -->.*?<!-- related-recipes:end -->','',read(file),flags=re.S)
  at=source.index('</main>');footer=source.rfind('<footer',source.index('<main'),at)
  at=footer if footer>=0 else at
  source=source[:at]+block+source[at:]
  (ROOT/file).write_text(source,encoding='utf-8')
 (ROOT/'recipe-related.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'Built three related recipes for each of {len(recipes)} recipe pages.')
if __name__=='__main__':build()
