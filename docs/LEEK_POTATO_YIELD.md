# Leek and potato soup: portion correction

Baseline: main fde6419512425c330344b0db629b4fd955247b12.
The live recipe matched this source before editing. Adam reported that cooking
with the slider at 4 produced two main-meal servings.

The original ingredient amounts were divided by baseServings=6. Recalibrate that
batch to baseServings=3 in both the inline recipe scaler and catalogue.
The yield correction makes slider 2 match the batch previously cooked at 4,
with a separate, user-requested reduction of the added onion described below.
Keep default servings 2. Method steps, timings, images and eligibility stay intact.

| Setting | Potatoes | Vegetable stock | Cream / crème fraîche |
|---|---:|---:|---:|
| Previous slider 2 | 75 g | 400 ml | 50 ml |
| Previous slider 4 (fed two) | 150 g | 800 ml | 100 ml |
| Corrected slider 2 | 150 g | 800 ml | 100 ml |
| Corrected slider 4 | 300 g | 1600 ml | 200 ml |

Adam subsequently reported that the soup was very oniony and requested less onion.
Halve only the added onion: ⅓ onion for 2 servings, ⅔ for 4, 1 for 6 and 1⅓ for 8.
Keep leeks unchanged (1⅓ for 2 servings). The shopping list buys whole onions but
retains the fractional cooking quantity. Other ingredient ratios are unchanged.
All amounts use the existing fraction formatter.
Remove the obsolete description saying that slider 6 restores the original batch.
Rebuild visible default amounts, recipe JSON-LD, social tags and offline manifests.
Refresh recipe-data query versions on homepage/planner so the shopping list does
not retain the old portion basis in an already-cached script. Preserve newer
homepage and optional support-link work from main.

Verification:
- 84 Node tests PASS, including the new cook-tested yield regression.
- 8 Worker tests PASS; no Worker changes.
- 18 Python tests PASS; the old soup metadata fixture is updated to the corrected
  two-serving amounts rather than removed or relaxed.
- All 99 recipes PASS the automated quality and numeric scaling checks.
- Site link audit PASS.
- Soup slider / shopping quantities agree at 2, 4, 6 and 8 servings.
- A two-person dinner plus a linked two-person leftover day and one extra portion
  needs 5 portions and 2000 ml stock; saved-plan round-trip preserves this.
- Exactly one catalogue recipe changes: leek-and-potato-soup.

Prepared on a dedicated branch; not merged or deployed. Await release approval.
