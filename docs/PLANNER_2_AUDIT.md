# Intelligent Meal Planner 2.0 — implementation audit

Baseline: production commit `6ff1baef454e853b51ca4143518e940c6c92a13e`. This upgrade is an unpublished feature branch; release requires Adam's approval.

## Architecture and baseline behaviour

- `recipe-data.js`: 99 recipes, ingredient templates and original numeric quantities, serving bases, dinner eligibility, sides, fish preference, reviewed cuisines/proteins/styles and total planning minutes. Bread, breakfast, lunch, desserts and sauces are not new dinner candidates.
- `planner-core.js`: pure functions for generation, swaps, validation, confirmation/history, side selection, linked leftovers and extra portions, gravy dependencies and consolidated shopping/export text.
- `planner-app.js` and `meal-planner.html`: seven date-indexed cards; count selector (previous default five); keeping, manual recipes, eating out, custom meals, leftovers, serving controls; whole-week preview/apply/discard; shopping tabs/checklists/copy/print; history statuses and JSON backups. Single Swap currently applies immediately: replacement previews must be added.
- `site-privacy.js`: opt-in planner localStorage key `my-cookbook-planner-v1`. Existing records must not be overwritten on opening. Recently viewed recipes are separately opt-in, and are not cooking history. Favourites are explicitly saved under their existing key.
- Generation compares 180 random candidates using cuisine/protein/style. Repeat gap, fish and time filters exist. Confirmed planned/cooked weeks block repeats; skipped entries do not. No accounts or paid services are needed.
- Homepage has a featured recipe and static example menu; it does not read saved plans.

## Reuse and regression protections

Retain shopping, `portions`, side amounts, gravy volume handling, ingredient parsing, history/confirmation, recipe URLs, privacy gating, backups and print/copy controls. Never infer finished Base Gravy volume. Recipe pages, ingredient quantities, cooking methods and photographs remain unchanged.

Add a separate generated metadata module and pure intelligence module. Add optional `feedback` to the version-1 state; missing fields default safely. Old backups retain days, locks, checked items, confirmed history and preferences. No storage-key change or destructive migration. Old code can ignore added fields, but exporting a current backup before rollback retains feedback.

Risks: kept meals conflicting with changed preferences; linked-leftover sources; erroneous protein/diet classification; incomplete metadata; slower generation; stale previews after state edits. Tests must cover these explicitly. Keep fixed days intact, preserve slot attributes on generation, reject impossible hard constraints with actionable errors, invalidate previews on edits and use bounded optimisation with cached metadata.

## Gaps and planned work

Ingredient/method-derived metadata for flavours, carbohydrate, methods, richness, effort and dependencies; whole-week weighted evaluation; contextual replacement intents with preview/confirm/cancel; cooking feedback and recent cooking memory; transparent 0–100 report; saved-week homepage preview and dinner entry points; mobile tap targets and wrapping.

No new recipes, framework, infrastructure, account system or AI requests. Browser tests and the existing regression suites gate review. Live publication remains prohibited until approved.

## Verification completed on 14 November 2026

- Baseline: 42 JavaScript results passed before implementation.
- Updated suite: 61 JavaScript results and 8 mocked Worker results pass. All 18 Python publishing tests pass. Metadata freshness passes for all 99 recipes.
- Static audit: 113 content pages, 4,553 local references, zero findings. The image reference count falls from 627 to 624 because the three static example-menu thumbnails were removed; no image files or recipes were deleted.
- The actual shared Chromium browser ran `scripts/planner-browser-check.html`: 56 assertions across 340, 390, 454 and 1280px frame widths. Checks cover no horizontal overflow, weekly preview/discard, contextual curry preview/cancel/apply, one-day-only replacement, removal of old shopping sources, plain shopping text, feedback and cooked-date persistence, print invocation, actual File-input backup import, reload and saved-week homepage previews. Temporary test storage was restored.
- Manual shared-browser checks separately exercised a kept meal, curry-intent replacement cancellation and application, and the updated shopping tab. Homepage and score screenshots are under `docs/planner-2-review/`.
- An attempted separate headless Chromium process could not start because its singleton socket was restricted in this executor. Rather than claiming it passed, the repeatable browser checks were run inside the available shared Chromium via the test page. This checks real rendered frame widths but is not a physical iPhone/Safari certification.
- Recipe HTML, quantities, method text and all photographs are byte-for-byte unchanged from the baseline. Metadata updaters were run; incidental newline-only changes were normalised back to each original file's format. Offline dependencies were refreshed to include the new privacy-script version without caching private requests.
- Hard preferences are never silently weakened. Kept conflicts stop generation without replacing the saved plan. Time limits remain for new suggestions only. Limited pools keep unique meals or give actionable errors. Existing strict repeat-gap controls are retained; the additional eight-week recency score is soft.

Remaining release conditions: Adam reviews and approves publication. Base Gravy remains manual until its cooked yield is measured, as already accepted in the previous audit. No AI request, contact message or live deployment was made for this feature.
