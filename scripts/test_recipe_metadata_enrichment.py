"""Verify the reported recipe pages retain their content and expose real step URLs."""
import importlib.util
import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = list(json.loads((ROOT / 'recipe-search-details.json').read_text()))
spec = importlib.util.spec_from_file_location('search_metadata', ROOT / 'scripts/update-search-metadata.py')
metadata = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metadata)


class RecipeMetadataEnrichmentTests(unittest.TestCase):
    def test_step_links_resolve_to_unique_visible_steps(self):
        for filename in PAGES:
            source = (ROOT / filename).read_text()
            data = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)[1])
            document = metadata.Document(source).root
            steps = document.find(lambda n: n.has('step'))
            ids = re.findall(r'\bid="([^"]+)"', source)
            self.assertEqual(len(ids), len(set(ids)), filename)
            self.assertEqual(len(steps), len(data['recipeInstructions']), filename)
            for node, instruction in zip(steps, data['recipeInstructions']):
                self.assertEqual(instruction['url'], metadata.url(filename) + '#' + node.attrs['id'])
                self.assertEqual(instruction['text'], metadata.clean(metadata.text(metadata.first(node, lambda n: n.has('step-copy')))))
            self.assertTrue(data['recipeCuisine'])
            self.assertTrue(data['keywords'])
            self.assertFalse({'author', 'aggregateRating', 'nutrition', 'video'} & data.keys())

    def test_existing_anchors_are_preserved_and_collisions_rejected(self):
        existing = '<li class="step" id="custom-step">Existing wording</li>'
        self.assertEqual(metadata.add_step_anchors(existing), existing)
        with self.assertRaises(ValueError):
            metadata.add_step_anchors('<div id="step-1"></div><li class="step">Text</li>')

    def test_refresh_is_idempotent(self):
        paths = [ROOT / f for f in PAGES] + [ROOT / 'sitemap.xml', ROOT / 'robots.txt']
        before = [p.read_bytes() for p in paths]
        subprocess.run([sys.executable, str(ROOT / 'scripts/update-search-metadata.py'), '--pages', *PAGES], check=True, capture_output=True)
        self.assertEqual(before, [p.read_bytes() for p in paths])


if __name__ == '__main__':
    unittest.main()
