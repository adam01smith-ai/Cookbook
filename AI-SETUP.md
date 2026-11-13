# Vibe cooking AI service

The `pantry.html` page is now Vibe cooking. Visitors describe a craving, cuisine, mood, ingredients, exclusions, time or equipment. They can ask for wild suggestions or use the optional prompt coach. A mood-only brief works without listing ingredients. Results are new AI recipes with measured ingredients, numbered methods and recipe-copy controls.
Live AI generation is connected to `https://adam-cooks-pantry.adam01smith-cooks.workers.dev/suggest` through the public URL in `pantry-config.js`. The service defined by `worker.mjs` and `wrangler.jsonc` at the repository root is already deployed to Cloudflare with a private API key and a persistent usage database. No additional setup is needed to use the existing website.
Copy request to ChatGPT remains a manual alternative. It creates a prompt you can paste into ChatGPT and does not run the website's AI service.

## What you need

- A Cloudflare account to host the small Worker service.
- An OpenAI API account with API billing enabled. This is separate from ChatGPT Plus billing.
- A project API key, entered privately into Cloudflare. Never put the key in this ZIP, GitHub, `pantry-config.js` or a chat message.

## Deploying to a different Cloudflare account

These steps are for a fresh account. The current deployment already has its database, migration, API secret and URL configured. To update the current service, use the existing account and database with `npm run build:worker`, `npm run test:worker`, `npm run check:worker`, then `npx wrangler deploy`. GitHub Pages publication does not deploy this Worker.

1. Install Node.js if you do not already have it, then open a terminal in the repository root (the folder containing `wrangler.jsonc`).
2. Run `npx wrangler login` and sign in to Cloudflare in the browser.
3. Run `npx wrangler d1 create adam-cooks-ai-usage`. Copy its database UUID into `database_id` in `wrangler.jsonc`, replacing `REPLACE_WITH_DATABASE_ID`. The database UUID is not an API key.
4. Run `npx wrangler d1 migrations apply adam-cooks-ai-usage --remote` to create the persistent usage table.
5. Run `npx wrangler secret put OPENAI_API_KEY` and paste your key into its private prompt.
6. Run `npx wrangler deploy`.
7. Copy the returned HTTPS Worker address and add `/suggest`, for example `https://adam-cooks-pantry.your-subdomain.workers.dev/suggest`.
8. Open `pantry-config.js` and put only that URL between the empty quotes after `apiUrl`.
9. Upload `pantry-config.js` to your Cookbook GitHub repository. The AI button will appear after the website updates.

The supplied `wrangler.jsonc` deploys the rate-limit binding and allows browser calls from `https://www.adamcooks.co.uk`. The deployed Cloudflare Worker must also have `ALLOWED_ORIGIN` set to exactly `https://www.adamcooks.co.uk` (no trailing slash or path). A stale GitHub Pages origin makes the browser preflight fail and the page reports Failed to fetch. Change this variable in the Worker's Settings → Variables and Secrets and deploy, or deploy the checked-in configuration with Wrangler. Preserve existing API secrets, the database and request limits. If the website moves again, update this setting to the new canonical origin.

The default model is `gpt-5.4-mini`, with reasoning effort `none`, configurable through `OPENAI_MODEL` and `OPENAI_REASONING_EFFORT`. The AI creates up to three new recipes for the selected servings and cooking brief. Optional Use these and Leave these out lists are sent as structured constraints and checked against the returned ingredient names. Conflicting coach constraints are rejected before a paid request. Free-text preferences are given to the model; validation is not a comprehensive allergen check. Each has a name, description, estimated times, measured ingredients and a method. The shared browser/Worker validator checks result structure, units, positive quantities, requested servings and fish preference. Ambiguous item counts such as garlic without cloves/bulbs and bread without slices/rolls/loaves are rejected; weights and clearly named counts remain supported. Common ingredients recognised in method text, including salt, black pepper, oil and water, must have measured ingredient entries. The model is instructed to cross-check every step, but this vocabulary-based check is not a comprehensive natural-language or allergen guarantee. Failed validation returns an error rather than guessing measurements or automatically spending another provider request. Extra ingredients are labelled separately. Input quantities are given to the model as constraints; inventory sufficiency is not independently verified. Existing cookbook recipes and planner history are not edited. Generated recipes can be copied, but are not automatically published or added to the planner.

## Usage controls

The service requires both the per-IP rate limiter and a persistent D1 usage database before calling OpenAI. The initial site-wide allowance is 10 generation attempts per UTC day and 100 per UTC calendar month. One atomic database statement checks both allowances and reserves an attempt before any provider call, including across concurrent visitors and server restarts. Provider failures still consume an attempt; requests refused by the daily or monthly allowance do not. A missing or failing database stops generation. Limits count AI requests, not pounds; pricing, tax and currency conversion still affect the bill. The per-IP limiter also allows up to five requests per minute per Cloudflare location. CORS is not authentication; the endpoint is public.

Only the cooking brief, optional coach ingredient lists, serving count, fish preference and existing recipe titles are sent for AI generation. The titles help avoid simply repeating an existing cookbook entry. The draft ingredient list is saved in the visitor's browser and can be removed with Clear. Planner history is not sent or changed by this page.

## Updating your cookbook

The service includes a snapshot of your recipe titles. When recipes are added, rebuild with `node build-pantry-page.cjs` and deploy the service again so those titles can be excluded from new suggestions.

## Validation completed

Twenty-four local checks cover generation response validation, measured quantities, fish filtering, copy controls, CORS, missing configuration, provider failures and persistent allowance behavior. Live recipe generation was verified before the Vibe cooking upgrade. Vibe cooking additionally has desktop and phone browser checks for mood buttons, coach inputs, recipe expansion, conflict messages and horizontal overflow. Preflight returned 204, an unrelated origin was refused with 403, and recipe generation returned 200. The hosted database recorded the reserved attempt. Structure checks cannot guarantee that an AI-created recipe will taste good or has been tested in a kitchen.

Official references:

- https://developers.cloudflare.com/workers/get-started/guide/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform

## Database migration safety

The initial migration is `migrations/0001_usage.sql`, matching `migrations_dir` in `wrangler.jsonc`. It uses `CREATE TABLE IF NOT EXISTS` so a pre-existing compatible `pantry_usage` table and its counters are preserved. It does not drop tables, delete counters, change the database ID or increase allowance limits.

For the existing production database, inspect the current schema and applied migration list before applying anything:

```sh
npx wrangler d1 migrations list adam-cooks-ai-usage --remote
npx wrangler d1 execute adam-cooks-ai-usage --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('pantry_usage','d1_migrations')"
```

The expected usage columns are `period TEXT PRIMARY KEY` and `attempts INTEGER NOT NULL CHECK (attempts >= 0)`. If a differently shaped table exists, stop and reconcile it rather than overwriting data. If `0001_usage.sql` is already recorded as applied and the expected table is present, do not reapply it. If the compatible table exists but the migration is not recorded, applying the migration records it without resetting counters. Fresh databases create the table normally.

Before deployment run `npm test`, `npm run test:worker`, `npm run check:worker` and the Python tests. The Worker build embeds the shared validator without changing the existing recipe catalogue. The dry run verifies the bundle and configured bindings without publishing. Publishing requires access to the existing Cloudflare account; it reuses its current API secret. Verify the deployed `X-Recipe-Validation: measured-v2` response header with a no-cost OPTIONS request before any authorised generation test. Do not add a second API key or recreate the database for this update.
