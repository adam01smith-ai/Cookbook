#!/usr/bin/env python3
"""Build consistent, ingredient-searchable cards from the recipe catalogue.

Run after update-favourites-page.py and before update-search-metadata.py.
Reviewed total-time allowances live in recipe-discovery.json.
"""
from pathlib import Path
from html import escape,unescape
import json,re
ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','breakfast.html','lunches.html','desserts.html','fakeaway.html','favourites.html']
def read(path):return (ROOT/path).read_text(encoding='utf-8')
def write(path,text):(ROOT/path).write_text(text,encoding='utf-8')
def plain(text):return unescape(re.sub('<[^>]+>',' ',text)).strip()
def attr(tag,name):
 m=re.search(r'\b'+name+r'="([^"]*)"',tag)
 return unescape(m[1]) if m else ''
def articles(text):return re.findall(r'<article\b[^>]*class="recipe-card"[^>]*>.*?</article>',text,re.S)
def file_for(card):
 for tag in re.findall(r'<a\b[^>]*>',card):
  if 'card-link' in attr(tag,'class').split():return attr(tag,'href')
 raise ValueError('Card has no recipe link')
def duration(value):
 h,m=divmod(value,60)
 return ((f'{h} hr'+(f' {m} min' if m else '')) if h else f'{m} min')
def time_label(t):
 if t.get('label'):return t['label']
 low,high=t['minMinutes'],t['maxMinutes']
 value=duration(low) if low==high else (f'{low}–{high} min' if high<60 else duration(low)+'–'+duration(high))
 return ('About ' if t['estimated'] else '')+value+' total'
CONTROLS='''<div class="discovery-controls"><div><label for="recipe-ingredients">Ingredients to use</label><input id="recipe-ingredients" type="search" placeholder="e.g. chicken, rice" autocomplete="off" aria-describedby="discovery-help"></div><div><label for="recipe-time">Time available</label><select id="recipe-time"><option value="any">Any time</option><option value="30">Up to 30 minutes</option><option value="45">Up to 45 minutes</option><option value="60">Up to 1 hour</option><option value="long">Over 1 hour / make ahead</option></select></div><button class="secondary" type="button" id="discovery-reset">Clear filters</button></div><p id="discovery-help" class="discovery-help">Separate ingredients with commas, + or spaces; recipes must include each one. Optional ingredients are included. Times allow for prep and cooking; estimates, extra waiting and prepared sauces are noted.</p>'''
CONTROLS='<!-- recipe-discovery:controls:start -->'+CONTROLS+'<!-- recipe-discovery:controls:end -->'
def build():
 raw=read('recipe-data.js');recipes=json.loads(raw[raw.index('['):raw.rindex(']')+1]);by_file={r['file']:r for r in recipes};times=json.loads(read('recipe-discovery.json'))
 assert set(times)==set(by_file),'Every recipe needs a reviewed time allowance'
 originals={p:re.sub(r'<!-- recipe-discovery:controls:start -->.*?<!-- recipe-discovery:controls:end -->','',read(p),flags=re.S).replace('<script src="recipe-discovery.js?v=1"></script>','') for p in PAGES}
 old_cards={}
 for s in originals.values():
  for old in articles(s):old_cards.setdefault(file_for(old),old)
 fakeaway={file_for(card) for card in articles(originals['fakeaway.html'])}
 details={}
 for r in recipes:
  file=r['file'];source=read(file);schema=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',source,re.S)[1]);t=times[file]
  # Match the published two-person defaults, six for slow cookers, loaf defaults for bread.
  servings=schema['recipeYield'] if r['category']=='Bread' else ('6 servings' if r['category']=='Slow Cooker' else '2 servings')
  if r['category']!='Bread':
   desired=6 if r['category']=='Slow Cooker' else 2
   slider=re.search(r'<input[^>]*\bid="slider"[^>]*>|<input[^>]*\btype="range"[^>]*>',source)
   if slider and attr(slider[0],'id')=='slider' and float(attr(slider[0],'min') or 1)>desired:
    changed=re.sub(r'\bmin="[^"]+"',f'min="{desired}"',slider[0]);source=source[:slider.start()]+changed+source[slider.end():]
    ticks=re.search(r'<div class="ticks"[^>]*>.*?</div>',source,re.S)
    if ticks:
     top=int(attr(slider[0],'max'));middle=(top+desired)//2
     source=source[:ticks.start()]+f'<div class="ticks" aria-hidden="true"><span>{desired}</span><span>{middle}</span><span>{top}</span></div>'+source[ticks.end():]
  label=time_label(t);note=t.get('note','');prefix='Estimated total: ' if t['estimated'] and not t.get('makeAhead') else 'Time to allow: '
  summary='<p class="recipe-time-summary"><strong>'+escape(prefix+label)+'</strong>'+('<span>'+escape(note)+'</span>' if note else '')+'</p>'
  source=re.sub(r'<p class="recipe-time-summary">.*?</p>','',source,flags=re.S)
  after=re.search(r'<p class="description">.*?</p>',source,re.S) or re.search(r'<h1\b[^>]*>.*?</h1>',source,re.S)
  assert after,file
  source=source[:after.end()]+summary+source[after.end():]
  if 'recipe-discovery.css?v=1' not in source:source=source.replace('</head>','<link rel="stylesheet" href="recipe-discovery.css?v=1">\n</head>')
  write(file,source)
  details[file]=(schema['name'],servings,label)
 def card(r,hidden=False):
  file=r['file'];t=times[file];name,servings,label=details[file];old=old_cards.get(file,'');image=re.search(r'<img\b[^>]*>',old)
  img=image[0] if image else f'<img class="recipe-thumb" src="{escape(r["image"],quote=True)}" width="600" height="400" alt="{escape(name,quote=True)}" loading="lazy" decoding="async">'
  ingredients=[re.sub(r'§\d+§','',i['template']).strip() for i in r['ingredients']]
  data={'category':r['category'],'search':name+' '+r['category'],'ingredients':json.dumps(ingredients,ensure_ascii=False),'min-minutes':'' if t['minMinutes'] is None else t['minMinutes'],'max-minutes':'' if t['maxMinutes'] is None else t['maxMinutes'],'make-ahead':str(t.get('makeAhead',False)).lower(),'collections':'Fakeaway' if file in fakeaway else ''}
  attrs=' '.join('data-'+k+'="'+escape(str(v),quote=True)+'"' for k,v in data.items())
  metadata='<div class="card-meta"><span>'+escape(r['category'])+'</span><span aria-hidden="true">·</span><span class="card-time">'+escape(label)+'</span><span aria-hidden="true">·</span><span>'+escape(servings.replace(' servings','').join(['Serves ','']) if r['category']!='Bread' else servings)+'</span></div>'
  # Preserve the existing shortcut links to sauce recipes below relevant cards.
  extras=[a for a in re.findall(r'<a\b[^>]*>.*?</a>',old,re.S) if 'card-link' not in attr(a.split('>')[0]+'>','class').split()]
  extra='<div class="card-related">'+' '.join(extras)+'</div>' if extras else ''
  return '<article class="recipe-card" '+attrs+(' hidden' if hidden else '')+'><a class="card-link" href="'+escape(file,quote=True)+'">'+img+'<h2>'+escape(name)+'</h2>'+metadata+('<p class="card-time-note">'+escape(t['note'])+'</p>' if t.get('note') else '')+'</a>'+extra+'</article>'
 for page in PAGES:
  s=originals[page];files=[file_for(c) for c in articles(s)]
  if page=='index.html':files+= [r['file'] for r in recipes if r['file'] not in files]
  assert len(files)==len(set(files)),page
  grid=re.search(r'<div class="recipe-grid"[^>]*>',s);last=s.rindex('</article>')+len('</article>');end=s.index('</div>',last)+len('</div>')
  s=s[:grid.start()]+grid[0]+''.join(card(by_file[f],page=='favourites.html') for f in files)+'</div>'+s[end:]
  s=re.sub(r'<span id="count"([^>]*)>.*?</span>',lambda m:'<span id="count"'+m[1]+'>'+str(len(files))+' recipes</span>',s,flags=re.S)
  s=s.replace('Search recipes by name or category','Search recipes or ingredients').replace('placeholder="Search your favourites"','placeholder="Search names or ingredients"')
  s=re.sub(r'(<input[^>]*id="search"[^>]*placeholder=")[^"]*',r'\1Search recipes or ingredients',s)
  point=re.search(r'<div class="category-controls"|<div class="recipe-grid"',s).start();s=s[:point]+CONTROLS+s[point:]
  s=re.sub(r'recipe-index.js\?v=\d+','recipe-index.js?v=6',s)
  s=re.sub(r'featured-recipes.js\?v=\d+','featured-recipes.js?v=4',s)
  if 'recipe-discovery.css?v=1' not in s:s=s.replace('</head>','<link rel="stylesheet" href="recipe-discovery.css?v=1">\n</head>')
  s=s.replace('</body>','<script src="recipe-discovery.js?v=1"></script></body>')
  write(page,s)
 raw=read('featured-recipes.js');featured=json.loads(raw[raw.index('['):raw.rindex(']')+1])
 for item in featured:
  name,servings,label=details[item['file']]
  item['name']=name;item['total']=label;item['servingLabel']=('Serves '+servings.removesuffix(' servings')) if by_file[item['file']]['category']!='Bread' else servings
 write('featured-recipes.js','window.COOKBOOK_FEATURED_RECIPES='+json.dumps(featured,ensure_ascii=False,separators=(',',':'))+';\n')
 print(f'Built ingredient and time discovery for {len(recipes)} recipes on {len(PAGES)} collection pages.')
if __name__=='__main__':build()
