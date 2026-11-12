"""Coverage and safety exceptions for the static recipe guidance rollout."""
import importlib.util,json,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def catalogue():
 s=(ROOT/'recipe-data.js').read_text();return json.loads(s[s.index('=')+1:].rstrip(';\n'))
class GuidanceTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.notes=json.loads((ROOT/'recipe-guidance.json').read_text());cls.recipes=catalogue()
 def test_every_catalogue_recipe_has_all_four_rendered_notes(self):
  self.assertEqual(set(self.notes),{r['file'] for r in self.recipes})
  from html import escape
  for file,n in self.notes.items():
   with self.subTest(file=file):
    s=(ROOT/file).read_text();self.assertEqual(s.count('id="tips-heading"'),1);self.assertEqual(s.count('href="#tips-heading"'),1)
    self.assertIn('recipe-tips.css?v=1',s)
    for field in ['storage','freezing','reheating','substitutions']:
     label='Storage &amp; leftovers' if field=='storage' else field.title()
     self.assertTrue(n[field].strip());self.assertIn('<h3>'+label+'</h3><p>'+escape(n[field])+'</p>',s)
    self.assertLess(s.index('id="method-heading"'),s.index('<section class="recipe-tips"'))
    self.assertLess(s.index('<section class="recipe-tips"'),s.index('</main>'))
 def test_rice_uses_its_own_shorter_storage_rules(self):
  rice={'korean-style-gochujang-beef-pork-bibimbap.html','indonesian-chicken-poke-bowl.html','moroccan-meatball-bowl.html','thai-curry-bowl.html','jambalaya.html','panda-express-orange-chicken.html','chicken-stroganoff.html','thai-chicken-curry.html','crispy-chilli-beef.html'}
  for file in rice:
   n=self.notes[file];self.assertEqual(n['safety'],'rice');self.assertIn('24 hours',n['storage']);self.assertIn('1 hour',n['storage'])
   s=(ROOT/file).read_text();self.assertIn('cooked rice</a>',s)
  for file in ['korean-style-gochujang-beef-pork-bibimbap.html','indonesian-chicken-poke-bowl.html']:
   self.assertIn('already',self.notes[file]['reheating'])
 def test_bread_and_chilled_desserts_do_not_inherit_meal_storage(self):
  for r in self.recipes:
   if r['category']=='Bread':
    self.assertEqual(self.notes[r['file']]['safety'],'bread');self.assertIn('bread bin',self.notes[r['file']]['storage'])
  for file in ['lemon-cheesecake.html','key-lime-pie.html','carrot-cake.html','creme-brulee.html']:
   self.assertIn('fridge',self.notes[file]['storage']);self.assertIn('Do not reheat',(ROOT/file).read_text())
 def test_legacy_chicken_recipes_and_catalogue_agree_on_breast(self):
  files={'slow-cooker-tuscan-chicken.html','slow-cooker-chicken-chorizo-butter-bean-stew.html','slow-cooker-chicken-chasseur.html','lemon-garlic-oregano-chicken-traybake.html','jack-daniels-glazed-chicken.html'}
  for r in self.recipes:
   if r['file'] in files:
    s=(ROOT/r['file']).read_text();self.assertNotIn('thigh',s.lower());self.assertIn('breast',s.lower())
    for i in r['ingredients']:self.assertNotIn('thigh',i['template'])
 def test_renderer_is_idempotent(self):
  spec=importlib.util.spec_from_file_location('guidance_renderer',ROOT/'scripts/update-recipe-guidance.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
  before={file:(ROOT/file).read_bytes() for file in self.notes};module.render()
  self.assertEqual(before,{file:(ROOT/file).read_bytes() for file in self.notes})
if __name__=='__main__':unittest.main()
