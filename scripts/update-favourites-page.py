#!/usr/bin/env python3
"""Rebuild the favourites catalogue from recipe-data.js. Run before search metadata."""
from pathlib import Path
import json,re,html
import os
os.chdir(Path(__file__).resolve().parents[1])
s=Path('recipe-data.js').read_text(); recipes=json.loads(s[s.index('=')+1:].rstrip(';\n'))
base=Path('lunches.html').read_text()
head=base[:base.index('<body>')].replace('Lunches · Adam Cooks','My favourites · Adam Cooks')
head=re.sub(r'<!-- search-metadata:start -->.*?<!-- search-metadata:end -->','',head,flags=re.S)
nav=base[base.index('<header'):base.index('<main')].replace(' aria-current="page"','')
footer=re.search(r'<footer class="privacy-footer">.*?</footer>',base,re.S)
assert footer, 'The collection template needs its static utility footer'
cards=[]
for r in sorted(recipes,key=lambda r:r['name'].casefold()):
 e=lambda x:html.escape(str(x),quote=True)
 cards.append(f'<article class="recipe-card" data-category="{e(r["category"])}" data-search="{e(r["name"]+" "+r["category"])}" hidden><a class="card-link" href="{e(r["file"])}"><img class="recipe-thumb" src="{e(r["image"])}" width="600" height="400" alt="{e(r["name"])}" loading="lazy" decoding="async"><h2>{e(r["name"])}</h2><div class="card-meta"><span>{e(r["category"])}</span></div></a></article>')
Path('favourites.html').write_text(head+'<body><a class="skip-link" href="#main">Skip to content</a>'+nav+'<main id="main" class="index-main" data-favourites-page><section class="recipe-browser"><div class="index-heading"><h1>My favourites</h1><span id="favourites-count" role="status" aria-live="polite"></span></div><p>Recipes you love, ready for next time. Saved in this browser on this device; clearing site data removes them.</p><div class="search-wrap"><label class="sr-only" for="favourites-search">Search my favourites</label><input id="favourites-search" type="search" placeholder="Search your favourites" autocomplete="off"></div><div class="recipe-grid">'+''.join(cards)+'</div><div id="favourites-empty" class="empty" hidden><h2>No favourites yet</h2><p>Tap the heart on a recipe to save it here.</p><a class="secondary" href="index.html#all-recipes">Browse recipes</a></div><noscript><p>Turn on JavaScript to save and view favourites in your browser.</p></noscript></section></main>'+footer[0]+'</body></html>')
