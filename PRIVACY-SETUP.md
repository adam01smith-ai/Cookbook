# Privacy setup

Updated 8 November 2026. Shared site-privacy.js runs before optional storage clients on every public HTML page. Optional planner/history, Vibe drafts and Google Analytics are denied by default. The only always-read/written localStorage key is the consent record, valid for 180 days. Version 1 choices retain planner/draft preferences but never grant the new analytics purpose; visitors are prompted again. Withdrawal makes saved plans/drafts dormant; explicit Clear deletes only those two owned data keys and preserves the separately chosen analytics preference.

Google Analytics uses G-002QLTW2TV. The shared privacy script loads site-analytics.js from this site; that script loads Google's library only after separate analytics consent. Basic consent mode keeps ad_storage, ad_user_data and ad_personalization denied. The GA disable flag is set before any tag command, and restored on withdrawal or expiry. Accessible first-party _ga / _ga_002QLTW2TV cookies are removed when analytics is denied. Cross-tab changes and consent expiry disable collection. Query strings and fragments are excluded from page_location, referrers are reduced to origin, and no cooking prompt or saved plan is added as custom tracking data. Cookie expiry is configured for 180 days without renewal.

Analytics owner settings to check: turn Enhanced measurement OFF in the Web data stream so Google's account-side automatic form/search/link tracking does not add extra events; keep Google signals, user-provided data and advertising personalisation off; review user/event retention (2 months is the minimal available setting). These account-side settings cannot be confirmed from the repository. Test a consenting visit in Analytics Realtime. Account reports also depend on consent, network blockers and processing. Traffic tracking does not measure actual OpenAI billing or AdSense profit.

Tests: `node --test scripts/test-analytics.cjs` (requires jsdom in the test environment) and `python -m unittest discover -s scripts -p 'test_search_metadata.py'`.

Owner action: add a dedicated public-facing private contact email to privacy.html. Current contact links to public GitHub issues and explicitly warns against posting private data. Review the notice and actual processing whenever services change; this implementation is not a legal compliance certification.

## Adding Google AdSense later

Do not insert ad or analytics tags into HTML before their appropriate consent system is configured. These local planner/draft preferences do NOT grant advertising consent and do NOT implement IAB TCF.

1. Create/verify the real AdSense account and site.
2. Configure a Google-certified CMP, such as AdSense Privacy & messaging > European regulations. Include the actual providers and purposes and all required user choices.
3. Integrate the account's real CMP code and its consent-controlled tag loading. Keep ad requests off until the CMP permits the relevant processing; handle rejection and withdrawal correctly. Test the actual CMP, including mobile and any limited/non-personalised ad behaviour.
4. Update privacy disclosures with actual vendors, identifiers, retention and transfers. Get fresh consent for new purposes; never reuse the local planner consent for ads.
5. Only then enable production ad slots with real publisher/slot identifiers.

References: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/ and https://support.google.com/adsense/answer/13554116?hl=en
