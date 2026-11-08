# Adam Cooks recipe updates

When adding a recipe, include its food image in the same update without asking Adam separately.

- Use an image supplied by Adam when available. Otherwise generate a realistic food photograph using the available image-generation tool, based on the actual recipe ingredients and finished dish. Show the whole plate, bowl or loaf on warm neutral tableware with natural light, without text or watermarks.
- After creating the recipe HTML and catalog entries, run `python scripts/add-recipe-image.py <recipe-slug> <image-path>`. It creates optimized full-size and thumbnail WebP files and connects existing image references in the recipe, index and catalogs. New entries must use `images/<slug>.webp` for the recipe and `images/<slug>-thumb.webp` for cards/catalogs.
- Write descriptive alt text and accurate image dimensions. Verify both files exist and every recipe/card reference resolves before publishing. Do not add an image caption saying “AI-generated” or “Illustrative”.
- If image generation is unavailable, report the missing image rather than claiming it was automated or completed.
- Keep the servings slider. Bread recipes must remain excluded from meal-planner meal selections (`eligible: false`).

This is the workflow for recipe additions made by the assistant. The public Vibe cooking service does not generate or publish images.

Slow Cooker recipe sliders must open at 6 servings. All other non-Bread recipe sliders must open at 2 servings. Keep original baseServings and data-base quantities for correct scaling; Bread keeps its loaf defaults.

Food photographs must show the entire serving bowl, plate or platter, including handles, with generous tabletop margin on all four sides. Use a wide pulled-back view; never crop dish edges. Apply the same complete framing to thumbnails.

Adam only wants chicken breast in recipes. Never use chicken thighs in new or revised recipes; use diced or sliced chicken breast as appropriate.

For assistant-created recipe ideas, show Adam the full recipe and image before publishing and wait for his approval.

Breakfast & Brunch recipes belong on breakfast.html and must set eligible: false. The meal planner excludes the whole breakfast category from dinner choices. Keep breakfast defaults at 2 servings.

Lunch recipes belong on lunches.html with category Lunches and eligible: false. Lunches must stay out of suggested dinners and manual dinner choices. Keep defaults at 2 servings.

After adding or changing recipes or public pages, run `python scripts/update-search-metadata.py` after images and catalogue entries are ready. Publish the refreshed recipe JSON-LD, canonical links, sitemap.xml and robots.txt with the change. Metadata must match visible recipes and default servings; do not invent ratings, nutrition, authorship or dates.

After adding or removing recipes or changing card metadata, run `python scripts/update-favourites-page.py` before `python scripts/update-search-metadata.py` to keep the favourites page in sync with recipe-data.js.

Every published recipe must include recipe-specific Storage, Freezing, Reheating and Substitutions notes. Add or update its entry in `recipe-guidance.json`, checking food-safety guidance and any recipe-specific exceptions (especially rice and previously reheated ingredients). Run `python scripts/update-recipe-guidance.py` before refreshing search metadata. Bread storage and chilled desserts must not inherit generic cooked-meal advice. Keep notes and methods consistent.

The search metadata updater also exports JPEG copies of complete recipe photos for Open Graph and Twitter sharing. Publish changed `images/social/*.jpg` files and static social tags with recipe updates. Do not crop or regenerate existing photos for this export. Recipe sharing uses the canonical URL without queries or fragments.
