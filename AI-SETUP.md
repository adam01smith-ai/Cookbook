# Connect the pantry AI

The `pantry.html` page is designed to generate NEW meals from the ingredients you enter, with measured ingredient lists and full numbered methods. It does not search the existing recipes for its AI results.
Live AI generation is connected to `https://adam-cooks-pantry.adam01smith-cooks.workers.dev/suggest` through the public URL in `pantry-config.js`. The service in `ai-service/` is already deployed to Cloudflare with a private API key and a persistent usage database. No additional setup is needed to use the existing website.
Copy request to ChatGPT remains a manual alternative. It creates a prompt you can paste into ChatGPT and does not run the website's AI service.

## What you need

- A Cloudflare account to host the small Worker service.
- An OpenAI API account with API billing enabled. This is separate from ChatGPT Plus billing.
- A project API key, entered privately into Cloudflare. Never put the key in this ZIP, GitHub, `pantry-config.js` or a chat message.

## Deploying to a different Cloudflare account

These steps are for a fresh account. The current deployment already has its database, migration, API secret and URL configured. To update the current service, use the existing account and database with `wrangler deploy`.

1. Install Node.js if you do not already have it, then open a terminal in the extracted `ai-service` folder.
2. Run `npx wrangler login` and sign in to Cloudflare in the browser.
3. Run `npx wrangler d1 create adam-cooks-ai-usage`. Copy its database UUID into `database_id` in `wrangler.jsonc`, replacing `REPLACE_WITH_DATABASE_ID`. The database UUID is not an API key.
4. Run `npx wrangler d1 migrations apply adam-cooks-ai-usage --remote` to create the persistent usage table.
5. Run `npx wrangler secret put OPENAI_API_KEY` and paste your key into its private prompt.
6. Run `npx wrangler deploy`.
7. Copy the returned HTTPS Worker address and add `/suggest`, for example `https://adam-cooks-pantry.your-subdomain.workers.dev/suggest`.
8. Open `pantry-config.js` and put only that URL between the empty quotes after `apiUrl`.
9. Upload `pantry-config.js` to your Cookbook GitHub repository. The AI button will appear after the website updates.

The supplied `wrangler.jsonc` deploys the rate-limit binding and allows browser calls from `https://adam01smith-ai.github.io`. If your website moves to a custom domain, update `ALLOWED_ORIGIN` to the new origin and redeploy. Do not include `/Cookbook` in the origin value.

The default model is `gpt-5.4-mini`, with reasoning effort `none`, configurable through `OPENAI_MODEL` and `OPENAI_REASONING_EFFORT`. The AI creates up to three new recipes for the selected servings. Each has a name, description, estimated times, measured ingredients and a method. The service checks the result structure, units, positive quantities, requested servings and fish preference. Extra ingredients are labelled separately. Input quantities are given to the model as constraints; inventory sufficiency is not independently verified. Existing cookbook recipes and planner history are not edited. Generated recipes can be copied, but are not automatically published or added to the planner.

## Usage controls

The service requires both the per-IP rate limiter and a persistent D1 usage database before calling OpenAI. The initial site-wide allowance is 10 generation attempts per UTC day and 100 per UTC calendar month. One atomic database statement checks both allowances and reserves an attempt before any provider call, including across concurrent visitors and server restarts. Provider failures still consume an attempt; requests refused by the daily or monthly allowance do not. A missing or failing database stops generation. Limits count AI requests, not pounds; pricing, tax and currency conversion still affect the bill. The per-IP limiter also allows up to five requests per minute per Cloudflare location. CORS is not authentication; the endpoint is public.

Only the ingredient request, serving count, fish preference and existing recipe titles are sent for AI generation. The titles help avoid simply repeating an existing cookbook entry. The draft ingredient list is saved in the visitor's browser and can be removed with Clear. Planner history is not sent or changed by this page.

## Updating your cookbook

The service includes a snapshot of your recipe titles. When recipes are added, rebuild with `node build-pantry-page.cjs` and deploy the service again so those titles can be excluded from new suggestions.

## Validation completed

Seventeen local checks cover generation response validation, measured quantities, fish filtering, copy controls, CORS, missing configuration, provider failures and persistent allowance behavior. A live request to the deployed service successfully generated three complete recipes for two people using chicken, spinach and half a pepper. Preflight returned 204, an unrelated origin was refused with 403, and recipe generation returned 200. The hosted database recorded the reserved attempt. Structure checks cannot guarantee that an AI-created recipe will taste good or has been tested in a kitchen.

Official references:

- https://developers.cloudflare.com/workers/get-started/guide/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
