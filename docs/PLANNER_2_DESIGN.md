# Intelligent Meal Planner 2.0

## Scope and preservation

An upgrade to the existing static planner, with no API calls, server changes, accounts, paid services, new runtime dependency or new recipe. `planner-intelligence.js` is a pure module; it returns suggestions without writing storage. `planner-core.js` still owns shopping and portions. The app owns explicit apply/cancel and privacy-gated persistence. Metadata and intelligence can later be used behind an authenticated service without binding the scoring to browser storage.

## Metadata provenance

`node scripts/build-planner-metadata.cjs` reads **every recipe's ingredient entries and complete published JSON-LD method**, `recipe-data.js` and the reviewed `recipe-discovery.json`. It produces `planner-metadata.js`. `--check` fails if generated content is stale.

Reviewed cuisine labels remain authoritative. Protein inference checks required ingredient text, distinguishing ham/guanciale/steak and unspecified mince from vegetables. Stock and sauces are not primary proteins. Required optional alternatives are not a dietary guarantee. Main carbohydrates exclude rice vinegar/flour/wine. Methods come from cooking verbs, with slow-cooker recipes distinguished from hands-on pan cooking. Flavours are ingredient-backed culinary descriptors. Richness is a culinary estimate based on cream/cheese/pastry, not nutrition. More involved effort means a prepared dependency or at least nine method steps; it does **not** mean long unattended cooking is difficult.

Prep/cook times are copied only from published ISO durations; otherwise `null`. Total time and its estimate flag/note come from reviewed discovery data, including waiting and prepared-base caveats. Difficulty is `null` until reviewed; vegan/gluten-free suitability is `null`. Existing vegetarian suitability is retained only where no required meat/stock/fish-sauce conflict or ambiguous mince is detected. No new allergen, calorie or nutrition claims are made. These descriptors do not change ingredient quantities or cooking instructions.

Fields: primary/secondary cuisine and protein, category, dishType, cookingMethods[], flavours[], carbohydrates[], richness, variable/mild spiceLevel, prepMinutes, cookMinutes, totalMinutes, timeEstimated/timeNote, difficulty, effort, keyIngredients[], dietary{}, dependencies[], evidence{}. Base Gravy dependencies refer to the existing recipe; precooked-meat reminders refer to the existing preparation stage, never additional meat shopping. Future recipes use the same generic builder; no recipe IDs are hardcoded in selection logic.

## Constraints and generation

New visitors start with seven dinner suggestions. Old saved counts remain unchanged. Eating-out, custom meals, leftovers and kept recipes stay in their slots. Where special days leave fewer cooking slots, only those slots are filled. Linked-leftover sources are filled before unrelated open slots; a requested count too small to supply those sources gives an actionable error.

Hard limits for new automatic suggestions: dinner eligibility, fish preference, explicit repeat-gap exclusions, time limit (unknown times fail a requested time limit), no duplicate recipes, and “Not for us”. New choices never relax these. Kept recipes are never overwritten. A fish/repeat-gap/avoid conflict stops generation with an explanation and leaves the current plan intact. A kept meal may exceed a time limit, which applies only to new suggestions; the report explains it. If the pool is insufficient, the message explains which controls can broaden it. Soft variety and vegetarian targets never block a usable plan.

The bounded search compares 80 complete candidate weeks, including all fixed meals, using the weighted score plus a small personal preference bonus. Fisher–Yates randomness is injectable: identical data + identical seed yields identical results. Different seeds explore fresh weeks. No storage changes occur during generation. No extra paid request or automatic AI retry is involved.

## Variety score

A weighted score out of 100. Each component is in [0,1]; unknown dimensions are left out and the remaining weights are normalised. Fewer than two recipe dinners have no score. The UI explains coverage. Eating out, custom meals and leftover portions are not scored as seven new dinners.

| Component | Weight | Interpretation |
|---|---:|---|
| Cuisine | 16 | Concentration beyond two occurrences, not seven distinct cuisines |
| Protein | 16 | Concentration beyond two; mixed meat dishes count all listed main proteins |
| Cooking style | 14 | 70% dish-type concentration, 30% primary cooking-method concentration |
| Flavour | 8 | Pairwise Jaccard overlap above 0.50 |
| Key ingredients | 12 | Pairwise Jaccard overlap above 0.35; quantities do not affect similarity |
| Carbohydrate | 10 | Concentration of main included/selected accompaniment beyond two |
| Recent repetition | 12 | Declining penalty for cooked/planned recipes and repeated recipe pairings over eight weeks, beyond the separate hard repeat-gap filter |
| Effort distribution | 8 | Adjacent involved meals, considering actual calendar slots |
| Richness | 4 | Excess rich meals beyond half the recipe dinners |

Concentration is `1 − sum(max(0, count − 2)) / max(1, mealCount − 2)`, clamped to [0,1]. Pair similarity uses intersection/union of descriptors. A threshold prevents a shared ordinary flavour from dominating. Concentration already caused by kept meals is subtracted before scoring additional choices. Fixed/fixed pairs are not criticised in pairwise comparisons while flexible choices remain; all-kept weeks still receive a descriptive score. Notes acknowledge kept meals rather than telling users to unlock them to chase 100.

The search adds a small capped bonus for Loved it / existing favourites (strongest for the first two), Would make again and untried recipes. Favourites beyond two do not earn a growing bonus. Recency remains more influential. A high score is a helpful comparison within the chosen constraints, not proof of taste, nutrition or kitchen results.

## Replacements and memory

Seven intents: different, quicker, comforting, lighter, spicy, curry, not tried recently (no cooking in the last eight weeks, with never-tried recipes preferred). Explicit intent filters the candidate pool **before** whole-week comparison. Quicker means strictly lower reviewed total time; lighter means the culinary lighter descriptor, not low calories. If no candidate meets an intent, report it rather than substituting an unwanted category. “Another idea” excludes earlier previews until the pool is exhausted.

Preview includes a recipe link, measured original ingredient templates scaled for that slot's linked leftovers/portions, time and preparation caveats, and week context. Apply changes one day; Cancel changes none. Any state edit invalidates the pending preview. Swapping a source recipe keeps linked leftover days pointing to that source slot. The existing shopping function recomputes the new recipe and portions; it never appends stale ingredients from the removed meal.

Optional version-1 state field `feedback[id] = {rating, tried, cookedOn}`. Ratings: love, again, avoid, untried, neutral. Cooked today records a local calendar date independently of a rating. The History preference list lets users re-enable avoided recipes. Existing favourites remain in their existing store, read only for suggestion context; recently viewed recipes remain a separate opt-in and are not used as cooked history.

The planner uses the existing consent gate and storage key. Without consent, memory works for this visit and JSON export remains available. With consent it is in the same exported backup. Old backups get an empty feedback map, with no automatic rewrite on opening. Invalid feedback is rejected before replacement. Rollback: export the current backup first, revert the feature commit and retain the backup; old code can ignore feedback, but saving with old code may omit it. No destructive storage migration is performed.

## Homepage and mobile

Planner-first opening, five concise links, saved-week/tonight preview only when planner consent allows reading, clearly labelled stale weeks and useful nonempty fallback. Inspiration never edits a saved plan. All original recipe browsing, featured rotation, categories, photographs and favourites remain. Feedback is folded in each meal. Inputs and buttons target at least 44px; layouts wrap at narrow widths. Real iPhone OS sharing/install behaviour is outside Chromium testing.

## Release gate

Run existing and new engine/UI tests, metadata freshness, Python publishing tests, static audit and actual Chromium flows at desktop and iPhone-sized widths. Keep changes on the feature branch; do not merge/deploy until Adam approves. Base Gravy's finished yield remains unmeasured; existing manual batch sizing is intentionally retained.
