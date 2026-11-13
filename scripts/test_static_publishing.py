import importlib.util,json,subprocess,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('metadata',ROOT/'scripts/update-search-metadata.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class StaticPublishingTests(unittest.TestCase):
 def test_blank_and_stale_quantities_are_populated_at_default_scale(self):
  source='<input type="range" value="2"><span class="val" data-base="1"></span><span class="range" data-min="3" data-max="6">wrong</span><p>Cook for 20 minutes.</p>'
  result=mod.populate_static_quantities(source,{'baseServings':6})
  self.assertIn('>⅓</span>',result);self.assertIn('>1–2</span>',result);self.assertIn('Cook for 20 minutes.',result)
  self.assertEqual(mod.populate_static_quantities(result,{'baseServings':6}),result)
 def test_batch_quantities_use_one_full_batch(self):
  source='<input type="range" value="1"><span class="val" data-base="3"></span>'
  self.assertIn('>3</span>',mod.populate_static_quantities(source,{'baseServings':1,'batchRecipe':True}))
 def test_favourites_regeneration_retains_the_static_footer(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);(root/'scripts').mkdir()
   for name in ['lunches.html','recipe-data.js']:(root/name).write_bytes((ROOT/name).read_bytes())
   script=root/'scripts/update-favourites-page.py';script.write_bytes((ROOT/'scripts/update-favourites-page.py').read_bytes())
   subprocess.run([sys.executable,str(script)],check=True,capture_output=True)
   output=(root/'favourites.html').read_text()
   self.assertEqual(output.count('<footer class="privacy-footer">'),1)
   self.assertIn('href="cookbook.html"',output);self.assertIn('data-privacy-open hidden',output)
if __name__=='__main__':unittest.main()
