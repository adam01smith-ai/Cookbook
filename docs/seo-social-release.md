# SEO and social sharing release

Base commit: 7df0498ca8d97063318345900ae9feb457c79080

Audited all 115 root HTML pages over HTTPS (all returned 200). Of these, 113 are indexable; the offline fallback and Google verification file are deliberately excluded from generated SEO metadata. The browser test fixture under scripts is a utility, now marked noindex.

Before: 111 root pages lacked a meta description; 15 lacked og:title, including the two excluded files.

After: 113 unique titles and descriptions, canonical www HTTPS URLs, complete Open Graph and Twitter cards. Existing approved JPEG images reused without replacement or image changes. Every social image checked against its actual JPEG dimensions.

Sharing: reusable recipe-share component, used by all 100 recipes, homepage and meal planner. Native Web Share, native photo sharing, WhatsApp, Facebook, Pinterest, clipboard and selectable-link fallback. Canonical public URLs exclude queries/fragments. No new tracking services.

Validation: 93 JavaScript tests; 9 Python metadata tests; 100/100 recipe quality checks; planner metadata check; site audit: 0 findings across 4,799 references and 630 images. All passed. Recipe JSON-LD and page bodies preserved against source archive. No recipe data, planner logic or Buy Me a Coffee content changes.

The desktop browser tool could not create a usable preview session. Visual mobile-device layout and third-party scraper preview screenshots remain unverified. JSDOM tests cover sharing behavior, platform URL encoding, native availability, cancellations, clipboard failures and focus restoration. Metadata cannot force third-party platforms to refresh their caches or guarantee Google indexing.

Maintenance: run python scripts/update-search-metadata.py (with UTF-8 mode on Windows). It now invokes node scripts/complete-social-metadata.cjs --write. Run node scripts/update-personal-catalog.cjs --offline-only afterward. npm test includes complete metadata, real JPEG dimension, sharing and regeneration checks. Do not hand-edit generated metadata blocks.

Deployment uses the existing GitHub Pages pages-build-deployment workflow triggered by updating main. No replacement hosting workflow was introduced.
