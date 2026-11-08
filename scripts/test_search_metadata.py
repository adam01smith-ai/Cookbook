"""Search publishing checks: python -m unittest discover -s scripts -p 'test_search_metadata.py'."""
import json
import re
import subprocess
import sys
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.adamcooks.co.uk/'


def schema(filename):
    source = (ROOT / filename).read_text()
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
    assert len(blocks) == 1, filename
    return json.loads(blocks[0])


class SearchMetadataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        raw = (ROOT / 'recipe-data.js').read_text()
        cls.recipes = json.loads(raw[raw.index('['):raw.rindex(']') + 1])

    def test_every_recipe_has_complete_metadata_and_real_image(self):
        for recipe in self.recipes:
            with self.subTest(recipe=recipe['file']):
                data = schema(recipe['file'])
                self.assertEqual(data['@type'], 'Recipe')
                self.assertTrue(data['name'])
                self.assertTrue(data['recipeIngredient'])
                self.assertTrue(data['recipeInstructions'])
                for step in data['recipeInstructions']:
                    self.assertEqual(step['@type'], 'HowToStep')
                    self.assertTrue(step['text'])
                for image in data['image']:
                    self.assertTrue(image.startswith(BASE))
                    self.assertTrue((ROOT / unquote(urlsplit(image).path.lstrip('/'))).is_file())
                self.assertFalse({'aggregateRating', 'review', 'nutrition', 'datePublished', 'author'} & data.keys())
                for key in ['prepTime', 'cookTime']:
                    if key in data:
                        self.assertRegex(data[key], r'^PT[1-9]\d*M$')

    def test_servings_follow_actual_defaults_instead_of_catalogue_base(self):
        soup = schema('leek-and-potato-soup.html')
        self.assertEqual(soup['recipeYield'], '2 servings')
        self.assertIn('75 g potatoes, cubed', soup['recipeIngredient'])
        self.assertIn('400 ml vegetable stock', soup['recipeIngredient'])
        self.assertIn('50 ml double cream or crème fraîche', soup['recipeIngredient'])
        self.assertEqual(len(soup['recipeInstructions']), 3)
        slow = schema('slow-cooker-chicken-chasseur.html')
        self.assertEqual(slow['recipeYield'], '6 servings')
        self.assertTrue(any('750' in x and 'chicken' in x for x in slow['recipeIngredient']))
        self.assertEqual(schema('focaccia.html')['recipeYield'], '1 loaf')
        self.assertEqual(schema('sourdough.html')['recipeYield'], '2 loaves')
        self.assertEqual(schema('acai-bowl.html')['recipeYield'], '2 servings')
        self.assertTrue(any('2 ripe banana' in x for x in schema('acai-bowl.html')['recipeIngredient']))

    def test_all_public_pages_have_unique_canonicals_and_matching_sitemap(self):
        locations = []
        for page in ROOT.glob('*.html'):
            if re.fullmatch(r'google-site-verification:\s*google[\da-f]+\.html\s*', page.read_text()):
                continue
            matches = re.findall(r'<link rel="canonical" href="([^"]+)">', page.read_text())
            self.assertEqual(len(matches), 1, page.name)
            locations.append(matches[0])
            self.assertTrue(matches[0].startswith(BASE))
            self.assertNotIn(' ', matches[0])
            self.assertNotIn('?', matches[0])
        sitemap = ET.parse(ROOT / 'sitemap.xml')
        urls = [x.text for x in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        self.assertEqual(set(urls), set(locations))
        self.assertEqual(len(urls), len(set(urls)))
        self.assertIn(BASE, urls)
        self.assertNotIn(BASE + 'index.html', urls)
        self.assertIn(BASE + 'truffle%20pasta.html', urls)
        self.assertIn('Sitemap: ' + BASE + 'sitemap.xml', (ROOT / 'robots.txt').read_text())
        self.assertNotIn('Disallow: /', (ROOT / 'robots.txt').read_text())

    def test_refresh_is_idempotent(self):
        paths = list(ROOT.glob('*.html')) + [ROOT / 'sitemap.xml', ROOT / 'robots.txt']
        before = {p: p.read_bytes() for p in paths}
        subprocess.run([sys.executable, str(ROOT / 'scripts/update-search-metadata.py')], check=True, capture_output=True)
        self.assertEqual(before, {p: p.read_bytes() for p in paths})

    def test_google_verification_files_are_not_modified_or_indexed(self):
        verification = ROOT / 'google3f183cf2d21fd763.html'
        if not verification.exists():
            self.skipTest('No Google verification file present')
        original = verification.read_bytes()
        subprocess.run([sys.executable, str(ROOT / 'scripts/update-search-metadata.py')], check=True, capture_output=True)
        self.assertEqual(verification.read_bytes(), original)
        self.assertEqual(original.strip(), b'google-site-verification: google3f183cf2d21fd763.html')
        self.assertNotIn(verification.name, (ROOT / 'sitemap.xml').read_text())


if __name__ == '__main__':
    unittest.main()
