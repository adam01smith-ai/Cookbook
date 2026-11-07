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
