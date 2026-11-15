# Quality and reliability release — 15 November 2026

## Baseline, before changes

Dedicated branch: `fix/quality-reliability-release`, based on clean main
`d8bb3346f1c050f40d9e59bcc9c163928ae08b15` (the audited commit).
GitHub Pages run 43642968917 succeeded for that SHA. Fresh production downloads
of index.html, planner-core.js, planner-intelligence.js and the corrected Caribbean
soup page match main byte for byte. No newer main work is being replaced.

Existing Node suite: 62 passed, 0 failed. This is a regression baseline, not a
recipe-completeness certificate: the extras test incorrectly expected swaps to
reset extraPortions. All reported source defects remain present at baseline.

Protected checklist (verify after changes):
- [x] Whole-week generation, repeated generation, seven distinct eligible meals
- [x] Locks, all-locked weeks, explicit preferences, time filters
- [x] Replacement preview, another idea, cancellation and one-day apply
- [x] Dinner servings, extra portions, linked leftovers and selected sides
- [x] Eating out, custom meals, skipped and cooked status
- [x] Saved plans, history, feedback and version-1 backup restoration
- [x] Optional browser persistence remains consent-gated
- [x] Shopping consolidation/scaling, checkboxes and plain-text export
- [x] Manual Base Gravy batches and dependencies
- [x] All 99 recipes, numeric scaling, images, links and cooking mode
- [x] Shared recipe presentation (structural checks)
- [ ] Browser mobile/desktop layout, touch interactions and Safari

## Evidence and unresolved recipe decisions

Original uploads explicitly omitted rice/beans and spice measurements. History
was checked back to the original files (5620b5e; brûlée dba7a5b; meatballs 8f49d61).
No original meat species or measured Base Gravy finished yield was found.

Supported corrections:
- Brûlée: the original 426 ml cream, 100 ml milk, 5 yolks, 50 g sugar / 4 portions
  match Angela Nilsen's Ultimate crème brûlée. Its method specifies 1½ tsp topping
  sugar per ramekin: 6 tsp / original four servings, independently scaled.
  https://www.bbcgoodfoodme.com/recipes/ultimate-creme-brulee/
- Bibimbap: matching HelloFresh mince, gochujang, carrot and sesame components
  support 160 g beans / 2 portions. That version uses 150 g *dry* rice, whereas
  this site uses microwave rice. Do not convert dry rice to microwave weight.
  https://www.hellofresh.co.uk/recipes/korean-style-gochujang-beef-bibimbap-68d41dc6353e3fbd3185dbef
- Poke dressing: matching sweet potato, breasts, cabbage, vinegar and edamame
  recipe specifies 1 tbsp dressing olive oil / 2 portions. Fryer oil remains a
  functional drizzle. Spice source specifies a sachet, not a reproducible blend.
  https://www.hellofresh.co.uk/recipes/air-fryer-indonesian-style-chicken-poke-bowl-6a33d31d4e4b173945bbb922
- Soup source also specifies a Thai spice sachet, without measured constituents.
  https://www.hellofresh.co.uk/recipes/ginger-and-lime-chicken-noodle-soup-67b5b968381832d770717796

Still needs Adam's confirmation, not an invented correction:
1. Bibimbap: weight of prepared microwave rice used for 2 portions.
2. Poke: Indonesian blend ingredients and amounts for 2 portions.
3. Noodle soup: Thai blend ingredients and amounts for 2 portions.
4. Meatballs: actual intended mince species (currently 250 g / base serving).
   Remove the demonstrably false vegetarian classification now, retain explicit
   'Unspecified meat' until confirmed; do not advertise this as full compliance.
5. Base Gravy: measure the finished, cooled usable volume of one original full
   batch, including whether water is added after blending/reduction. Until then
   retain the manual batch selector and all original batch ingredient amounts.

No merge or deployment is authorised by this implementation request.

## Scoring model

The nine weights are retained (sum 100): cuisine 16, protein 16, style/method 14,
flavour 8, ingredient similarity 12, carbohydrate 10, recent history 12, effort 8,
richness 4. These are preferences, never selection restrictions. Existing hard
eligibility, repeat-gap, avoided recipes, time filters and fixed days are unchanged.

Concentration still allows two occurrences naturally; only excess beyond two is
charged. Pair penalties now combine the mean of each dinner's *closest* counterpart
(65%) with the mean similarity on consecutive calendar days (35%). Out/leftover
slots break adjacency. This avoids diluting a near-duplicate among 21 pairings.
Cuisine mixes 80% concentration / 20% pair repetition. Protein uses 75%
concentration / 15% overlap / 40% unknown share, capped at its dimension weight.
Unknown proteins never increase the reported protein-group count. Style uses 55%
concentration / 45% pair similarity (65% dish type, 35% method-set overlap).
Carbohydrate uses 75% concentration / 25% overlap and considers all listed bases.

Ingredient Jaccard similarity ignores garlic, ginger and chilli as weak evidence
on their own; overlap above 0.15 is scaled to 0–1. Flavours ignore generic savoury
and garlicky. Matching tomato, cream, coconut, peanut or gravy strengthens flavour
overlap (full similarity rather than 55%). Richness now includes adjacent rich
meals, not only the total count. Recency retains cooked dates, prior plans and
previous pairings with their existing decay. Missing dimensions are not fabricated;
coverage is reported. Fixed-fixed pair/concentration costs are excluded; the report
explicitly explains that an all-kept week's score excludes fixed repetition.

The 80-candidate whole-week optimiser, seeded random interface and replacement
intent filters remain intact. No AI or new infrastructure is introduced.

Calibration fixtures in scripts/test-quality-release.cjs:
| Constructed week | Score |
|---|---:|
| Excellent: distinct styles, proteins, flavours, balanced bases | 99 |
| Good: three chicken/rice meals, otherwise varied | 89 |
| Average: five similar chicken/tomato/cream pasta meals | 50 |
| Poor: seven similar rich, involved chicken pastas | 14 |

100 fresh seeded optimised plans scored 89–94, mean 91.19. This is observational,
not an acceptance target. Tests assert ordering, meaningful margins, sequencing,
unknown-protein handling, recent cooking and locked-choice treatment.

## Replacement behaviour

Both a suggestion swap and the manual recipe selector preserve the original day's dinner requirements, extras, linked source
index, selected side and per-person side amount. Only recipe and cooked/planned
status change. A replacement is planned (not automatically recorded as cooked).
The preview states total portions and retained side; apply changes one day only.
Cancellation writes nothing. An optional `keepSide: true` flag is used only when a
retained side would otherwise be normalised or absent from the new recipe's menu.
It survives version-1 backup validation; old backups need no migration, and unknown
old extras continue defaulting to zero. Shopping is always recomputed from the
confirmed plan, including rice-pouch rounding, naan and linked leftovers.

Recipe slider maxima are UI control limits, not catalogued cooking-capacity limits.
The planner already scales ingredient data beyond those UI maxima when cooking
extra portions. No verified recipe-specific serving cap exists to enforce.

## Verification environment and release gate

Node DOM tests execute the actual planner application and inline recipe scalers.
These do not verify layout, touch, Safari, downloaded files or real kitchen yields.
The local preview starts, but its command network namespace is inaccessible from
the shared browser. Local file URLs are prohibited by browser policy. Headless
Chromium fails to launch under the runtime sandbox; WebKit is not installed. No
policy was disabled or bypassed. Physical iPhone/Safari and branch browser layout
checks remain NOT VERIFIED. The browser harness has been extended to assert the
portion regression and is ready to run via an accessible local preview.

`npm run check:recipe-quality` audits every recipe and exits nonzero for unresolved
facts. No failing recipes are skipped or relabelled PASS. `npm run check:release`
combines Node tests, Worker tests, generated metadata, site links and recipe quality.
A green unit suite alone is not release approval.

Recommendation: HOLD production deployment until Adam confirms the four recipe
facts above and the unpublished branch completes browser/mobile regression checks.
Base Gravy's manual batch functionality can remain; a measured yield is a documented
limitation, not a reason to invent an automatic batch conversion.


## Final branch verification

- `npm test`: 78 tests PASS; includes prior planner workflows and 16 new checks.
- `npm run test:worker`: 8 PASS; no Worker source or configuration changes.
- Python unittest discovery: 18 PASS.
- `npm run check:planner-metadata`: PASS, all 99 entries current.
- `npm run audit`: PASS, 113 HTML pages, 4,553 local references, 624 image
  references, no findings. Sitemap remains 112 indexable URLs.
- Combined recipe checks: 95 PASS / 4 FAIL (96/99 quantities; 98/99 specified
  primary ingredient; 97/99 defined blends; all 99 dietary consistency, serving
  data, arithmetic, method structure, presentation, stage guidance, links, images).
- `npm run check:release`: FAIL by design only on the four unresolved recipe facts;
  this is a genuine release blocker, not a waived test.
- Actual branch browser/mobile checks: NOT VERIFIED (environment blocks above).

| Issue | Previous status | Branch status | Evidence | Resolution |
|---|---|---|---|---|
| Extra portions | FAIL | PASS (automated) | 0/1/4 extras, with/without linked leftovers; saved restore, adjacent lock, immutable preview/cancel, apply and manual selector | Preserve day settings; shared replacement helper; recompute shopping |
| Ingredient completeness | 95/99 | 96/99; FAIL for three | QUALITY_RESULTS.json; source links above | Brûlée fully measured; beans and dressing oil supported; rice and two blends unresolved |
| Meatballs specificity | FAIL | PARTIAL / FAIL | Original upload never names the mince | Vegetarian false in catalogue and metadata; unknown meat retained and excluded from score diversity |
| Recipe presentation | 97/99 | 99/99 structural PASS | All-recipe checker, inline scalers | Both legacy pages share hero, ingredients, step anchors and serving controls |
| Cooking-stage timings | 5 failures | 0 failures PASS | All-recipe checker, method guidance | Packet pasta guidance; off-heat carbonara sauce; conditional chicken/broccoli/rice timings and doneness |
| Variety Score | FAIL | PASS (automated calibration) | 99 / 89 / 50 / 14 fixtures; 100 plans 89–94 | Closest-pair and adjacency costs; sauces, richness, unknown proteins; existing optimiser retained |
| Base Gravy yield | NOT VERIFIED | NOT VERIFIED; manual batches PASS | Original/history lacks measured finished volume; regression tests | Retain manual batches, no invented ml conversion |
| Mobile Safari | NOT VERIFIED | NOT VERIFIED | No physical iPhone or WebKit; browser preview unavailable | Complete accessible-browser viewport/touch regression before release |

The collection is still exactly 99 recipes. Images, original measured amounts
(except the explicitly sourced additions), storage consent and existing saved data
are preserved. Generated related cards, search/schema data and offline manifests
are refreshed where affected; no unrelated redesign or services are introduced.

To review on an accessible developer machine: `npm ci`, run `npm run check:release`
(expect the four documented recipe failures until confirmed), then `npm run dev`.
Open http://127.0.0.1:3000/scripts/planner-browser-check.html and run the browser
checks. Verify the two revised recipes at 340px, 390px and 1280px, including
serving controls, step anchors, ingredient checkboxes and cooking mode. Repeat
on iPhone Safari when available. The harness restores its temporary test storage.

Deployment remains held. After data confirmation, fix the remaining facts and
rerun all checks. Only an explicit subsequent approval permits merge/deployment.
After approval verify Pages' deployed SHA and repeat production smoke tests;
rollback is a normal revert commit through the existing Pages process, never a
force-push. No storage migration or destructive data reset is required.
