# Adam Cooks site audit — 13 November 2026

The audit covers the public static site and its browser features, against baseline commit `4964eb1`. It is a technical and consistency audit, not a claim that every recipe has been cooked or every device has been tested.

## Verified coverage

| Area | Evidence |
|---|---|
| Public delivery | 452 distinct public pages and assets returned successfully and matched the baseline repository bytes: 317 initial checks plus 135 additional referenced assets. |
| Local navigation and assets | 113 content pages, 4,545 internal resource/link references and 627 image references checked; no missing files, broken fragments, duplicate IDs or missing ARIA targets found. |
| Recipe catalogue | All 99 recipes appear in the main and favourites catalogues. All default numeric ingredient fields are present before JavaScript and agree with the running serving controls. |
| Planner | Existing variety, time limits, preferences, previews, extra portions and repeat rules pass. An additional 100 generated scenarios check eligibility, uniqueness, immutable generation, kept meals and backup round trips. |
| Saved features and consent | Tests cover favourites, collections, opt-in history, privacy defaults, blocked storage and preserving unrelated stored data. |
| Offline | Service-worker simulation covers successful downloads, listing, offline recipe/fallback retrieval, failed update retaining the old copy, removal, unknown-recipe rejection and leaving private POST/external requests unintercepted. |
| Sharing | Tests cover explicit native link sharing, copying, cancellation, photo attachment with canonical link, unavailable photos and clipboard failure. No real messages were sent. |
| Narrow layouts | Live homepage, recipe, planner, cookbook, Vibe, privacy and older recipe layouts checked at 340px; principal layouts also checked at 454px. No horizontal page overflow observed. These are Chromium responsive checks, not an iPhone Safari certification. |
| Automated checks | 35 JavaScript test results and 17 Python tests pass, plus the static audit. Some JavaScript files contain many assertions under one reported result. |

## Corrections in this patch

1. **Base Gravy uses full batches.** Its original full ingredient amounts now correspond to one batch, rather than being displayed as one third of a batch labelled two servings. Its page, cards, structured data and cooking mode use batch labels. The recipe remains excluded from dinner selections.
2. **No invented gravy-volume estimate.** The planner displays the actual millilitres needed by selected curries, including extras and linked leftovers. With no measured finished yield, the number of full batches is a manual choice with an explicit explanation. If a measured `yieldMl` is later supplied, volume-based recommendations are supported. Existing saved batch choices are retained.
3. **Default quantities survive rebuilds.** Search-metadata publishing now fills the visible numeric ingredient fields from the existing data amounts and the slider default. It preserves cooking-method wording and numeric data attributes. A regression check compares all 99 pages before and after their scripts execute.
4. **Consistent fractions.** The running serving controls now support thirds as well as eighth-based fractions, matching the static formatter.
5. **Static footer survives regeneration.** Rebuilding the favourites page keeps the shared utility/footer links, including My cookbook and privacy controls.
6. **Planner preference layout.** Vegetarian and cooking-time controls have separate spacing and clear narrow-screen layout.
7. **Tests reflect current features.** Favourites navigation tests target My cookbook; sharing tests exercise the explicit Share link control; sitemap tests assert that the offline fallback remains noindex and excluded. No feature was removed to make a test pass.
8. **Repeatable checks and documentation.** A pinned development dependency, package lock, audit command and corrected README replace outdated counts and deployment assumptions.

Existing recipe methods, ingredient data amounts, photographs, app icons, privacy choices and storage keys are preserved. Base Gravy's numeric base changes from six nominal servings to one full batch; its full ingredient quantities do not change.

## Remaining checks and inputs

| Item | Status / consequence |
|---|---|
| Finished Base Gravy volume | Needs a measured finished batch at the consistency used by the curry recipes. No litre figure has been invented. Until then, exact automatic batch sizing cannot be claimed. |
| Vibe cooking live AI generation | Not exercised during this audit. It uses the existing hosted OpenAI account/quota, with no local API credential available. Reuse of that hosted setup for a production generation check needs the user's credential decision. UI layout was checked; this is not evidence of provider availability or remaining quota. |
| Worker deployment maintenance | The checked-in worker configuration names `migrations` as its migration directory, while the SQL migration is at repository root. Backend provisioning/deployment needs a separate check before relying on automatic migrations. No backend changes were made. |
| Contact delivery | Public link/form destination is present. No contact message was submitted, so inbox delivery has not been verified. |
| Physical iPhone | Native sharing sheet, Add to Home Screen and actual airplane-mode behaviour require device testing. Public photos, responsive layouts and offline logic were checked as described above. |
| Recipe quality | Quantities, catalogue consistency, methods and guidance were checked programmatically. Taste, finished yields and practical cooking results were not kitchen-tested. |

## Repeating the checks

Use Node.js 24 or later and Python 3 with Pillow available:

```sh
npm ci
npm test
npm run audit
python3 -m unittest discover -s scripts -p 'test_*.py'
```

Follow `AGENTS.md` for refresh order. Refresh `offline-catalog.json` and `sw.js` last, after HTML and metadata are final. Deployment success and the final commit are recorded in GitHub Actions; live-file comparisons and browser checks are performed after publication.
