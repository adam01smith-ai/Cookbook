import importlib.util,json,unittest
from pathlib import Path
from urllib.parse import urlsplit,unquote
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('search',ROOT/'scripts/update-search-metadata.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class SocialMetadataTests(unittest.TestCase):
 def test_every_recipe_has_static_social_tags_and_complete_jpeg_photo(self):
  raw=(ROOT/'recipe-data.js').read_text();recipes=json.loads(raw[raw.index('['):raw.rindex(']')+1])
  for recipe in recipes:
   with self.subTest(recipe=recipe['file']):
    source=(ROOT/recipe['file']).read_text();root=mod.Document(source).root
    tags={n.attrs.get('property',n.attrs.get('name')):n.attrs['content'] for n in root.find(lambda n:n.tag=='meta' and 'content' in n.attrs)}
    schema=mod.recipe_schema(recipe,source)
    self.assertEqual(tags['og:title'],schema['name']);self.assertEqual(tags['og:url'],schema['url']);self.assertEqual(tags['og:type'],'article');self.assertEqual(tags['og:locale'],'en_GB');self.assertEqual(tags['twitter:card'],'summary_large_image');self.assertEqual(tags['twitter:image'],tags['og:image'])
    self.assertTrue(tags['og:description']);self.assertEqual(tags['og:image:type'],'image/jpeg');self.assertTrue(tags['og:image'].startswith(mod.BASE));self.assertNotIn(' ',tags['og:image'])
    image=ROOT/unquote(urlsplit(tags['og:image']).path.lstrip('/'));original=ROOT/unquote(urlsplit(schema['image'][0]).path.lstrip('/'))
    with Image.open(image) as share,Image.open(original) as full:
     self.assertEqual(share.format,'JPEG');self.assertEqual(share.size,full.size);self.assertEqual(share.size,(int(tags['og:image:width']),int(tags['og:image:height'])))
if __name__=='__main__':unittest.main()
