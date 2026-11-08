#!/usr/bin/env python3
"""Refresh static search metadata from visible recipes; no third-party packages needed.

Run after recipe/content updates: python scripts/update-search-metadata.py
Optional cooking times are included only where the displayed time is unambiguous.
Never invent ratings, authorship, nutrition, publication dates or testing claims.
"""
import json
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.adamcooks.co.uk/'
MARKER_START = '<!-- search-metadata:start -->'
MARKER_END = '<!-- search-metadata:end -->'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def has(self, cls):
        return cls in self.attrs.get('class', '').split()

    def find(self, predicate):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if predicate(child):
                    result.append(child)
                result.extend(child.find(predicate))
        return result


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def clean(value):
    return re.sub(r'\s+', ' ', value).strip()


def amount(value):
    if abs(value * 3 - round(value * 3)) < 0.00001 and round(value * 3) % 3:
        whole = int(value)
        return (str(whole) + ' ' if whole else '') + ('⅓' if round((value - whole) * 3) == 1 else '⅔')
    fractions = {1: '⅛', 2: '¼', 3: '⅜', 4: '½', 5: '⅝', 6: '¾', 7: '⅞'}
    whole = int(value)
    part = round((value - whole) * 8)
    if abs(value * 8 - round(value * 8)) < 0.00001 and part in fractions:
        return (str(whole) + ' ' if whole else '') + fractions[part]
    return f'{round(value, 2):g}'


def text(node, factor=None):
    if isinstance(node, str):
        return node
    if node.has('step-number') or node.tag in {'script', 'style'}:
        return ''
    if factor is not None:
        if (node.has('val') or node.has('qty')) and 'data-base' in node.attrs:
            return amount(float(node.attrs['data-base']) * factor)
        if node.has('range') and 'data-min' in node.attrs and 'data-max' in node.attrs:
            return amount(float(node.attrs['data-min']) * factor) + '–' + amount(float(node.attrs['data-max']) * factor)
    value = ''.join(text(child, factor) for child in node.children)
    return value + (' ' if node.tag in {'p', 'h1', 'h2', 'h3', 'h4', 'div', 'li', 'br'} else '')


def first(root, predicate):
    found = root.find(predicate)
    return found[0] if found else None


def url(filename):
    return BASE + ('' if filename == 'index.html' else quote(filename, safe='/-._~'))


def duration(value):
    """Do not turn a range, minimum or per-loaf time into a precise promise."""
    value = clean(value).lower()
    if not re.fullmatch(r'(?:(\d+)\s*(?:hr|hrs|hour|hours)\s*)?(?:(\d+)\s*(?:min|mins|minute|minutes))?', value) or not value:
        return None
    hours = re.search(r'(\d+)\s*(?:hr|hour)', value)
    minutes = re.search(r'(\d+)\s*min', value)
    total = (int(hours[1]) * 60 if hours else 0) + (int(minutes[1]) if minutes else 0)
    return f'PT{total}M' if total else None


def recipe_schema(recipe, source):
    root = Document(source).root
    title = first(root, lambda n: n.tag == 'h1')
    photo = first(root, lambda n: n.tag == 'img' and (n.has('recipe-photo') or n.has('fakeaway-hero')))
    slider = first(root, lambda n: n.tag == 'input' and n.attrs.get('type') == 'range')
    assert title and photo and slider, recipe['file']
    base = re.search(r'const\s+baseServings\s*=\s*([\d.]+)', source)
    # Older pages inline the divisor in update(); the catalogue retains that base.
    base_servings = float(base[1]) if base else float(recipe['baseServings'])
    assert base_servings == float(recipe['baseServings']), recipe['file']
    servings = float(slider.attrs['value'])
    factor = servings / base_servings
    ingredient_nodes = root.find(lambda n: n.has('ingredient-text'))
    if not ingredient_nodes:
        ingredient_nodes = [item for group in root.find(lambda n: n.has('ingredient-list')) for item in group.find(lambda n: n.tag == 'li')]
    ingredients = [clean(text(n, factor)) for n in ingredient_nodes]
    instructions = []
    step_nodes = root.find(lambda n: n.has('step'))
    if not step_nodes:
        panel = first(root, lambda n: n.has('method-panel'))
        assert panel, recipe['file']
        step_nodes = panel.find(lambda n: n.tag == 'li')
    for node in step_nodes:
        heading = first(node, lambda n: n.tag == 'h3')
        copy = first(node, lambda n: n.has('step-copy'))
        entry = {'@type': 'HowToStep', 'text': clean(text(copy or node, factor))}
        if heading:
            entry['name'] = clean(text(heading))
        instructions.append(entry)
    assert ingredients and instructions and all(x['text'] for x in instructions), recipe['file']
    image_path = urlsplit(photo.attrs['src']).path
    assert (ROOT / unquote(image_path)).is_file(), image_path
    schema = {'@context': 'https://schema.org', '@type': 'Recipe', '@id': url(recipe['file']) + '#recipe',
              'url': url(recipe['file']), 'name': clean(text(title)), 'image': [BASE + quote(image_path, safe='/-._~')],
              'recipeCategory': recipe['category'], 'recipeYield': f'{servings:g} servings',
              'recipeIngredient': ingredients, 'recipeInstructions': instructions}
    if recipe['category'] == 'Bread':
        schema['recipeYield'] = f'{servings:g} ' + ('loaf' if servings == 1 else 'loaves')
    description = first(root, lambda n: n.has('description'))
    if description:
        schema['description'] = clean(text(description))
    for node in root.find(lambda n: n.has('time')):
        label = first(node, lambda n: n.tag == 'span')
        value = first(node, lambda n: n.tag == 'strong')
        if not label or not value:
            continue
        key = {'prep': 'prepTime', 'cook': 'cookTime', 'bake': 'cookTime'}.get(clean(text(label)).lower())
        parsed = duration(text(value))
        if key and parsed:
            schema[key] = parsed
    return schema


def update():
    raw = (ROOT / 'recipe-data.js').read_text()
    recipes = json.loads(raw[raw.index('['):raw.rindex(']') + 1])
    by_file = {recipe['file']: recipe for recipe in recipes}
    pages = sorted(ROOT.glob('*.html'))
    for page in pages:
        original = page.read_text()
        source = re.sub(re.escape(MARKER_START) + r'.*?' + re.escape(MARKER_END) + r'\n?', '', original, flags=re.S)
        metadata = [f'<link rel="canonical" href="{escape(url(page.name), quote=True)}">']
        if page.name in by_file:
            schema = recipe_schema(by_file[page.name], source)
            payload = json.dumps(schema, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
            metadata.append('<script type="application/ld+json">' + payload + '</script>')
        block = MARKER_START + '\n' + '\n'.join(metadata) + '\n' + MARKER_END + '\n'
        assert source.count('</head>') == 1, page.name
        updated = source.replace('</head>', block + '</head>', 1)
        # Head-only changes must leave every recipe control, body and inline script untouched.
        assert updated.split('</head>', 1)[1] == original.split('</head>', 1)[1], page.name
        if updated != original:
            page.write_text(updated)
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap = ET.Element(f'{{{namespace}}}urlset')
    for page in pages:
        entry = ET.SubElement(sitemap, f'{{{namespace}}}url')
        ET.SubElement(entry, f'{{{namespace}}}loc').text = url(page.name)
    ET.indent(sitemap, space='  ')
    (ROOT / 'sitemap.xml').write_bytes(ET.tostring(sitemap, encoding='utf-8', xml_declaration=True) + b'\n')
    (ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: ' + BASE + 'sitemap.xml\n')
    print(f'Updated {len(recipes)} recipes, {len(pages)} canonical URLs and sitemap entries.')


if __name__ == '__main__':
    update()
