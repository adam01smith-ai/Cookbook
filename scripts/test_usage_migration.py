import json,sqlite3,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class UsageMigrationTests(unittest.TestCase):
 def test_fresh_database_and_existing_usage_are_preserved(self):
  config=json.loads((ROOT/'wrangler.jsonc').read_text());sql=(ROOT/config['d1_databases'][0]['migrations_dir']/'0001_usage.sql').read_text()
  with sqlite3.connect(':memory:') as db:
   db.executescript(sql);db.execute('INSERT INTO pantry_usage VALUES (?,?)',('2026-11-13',7));db.executescript(sql)
   self.assertEqual(db.execute('SELECT period,attempts FROM pantry_usage').fetchall(),[('2026-11-13',7)])
   self.assertEqual([r[1] for r in db.execute('PRAGMA table_info(pantry_usage)')],['period','attempts'])
   with self.assertRaises(sqlite3.IntegrityError):db.execute('INSERT INTO pantry_usage VALUES (?,?)',('2026-11-14',-1))
if __name__=='__main__':unittest.main()
