# Privacy setup

Implemented 2 November 2026. Shared site-privacy.js runs before optional storage clients on every HTML page. Optional planner/history and Vibe drafts are denied by default. The only always-read/written key is the consent record, valid for 180 days. Withdrawal makes old optional data dormant; explicit Clear deletes only the two owned data keys. No advertising or analytics scripts are included.

Owner action: add a dedicated public-facing private contact email to privacy.html. Current contact links to public GitHub issues and explicitly warns against posting private data. Review the notice and actual processing whenever services change; this implementation is not a legal compliance certification.

## Adding Google AdSense later

Do not insert ad or analytics tags into HTML before their appropriate consent system is configured. These local planner/draft preferences do NOT grant advertising consent and do NOT implement IAB TCF.

1. Create/verify the real AdSense account and site.
2. Configure a Google-certified CMP, such as AdSense Privacy & messaging > European regulations. Include the actual providers and purposes and all required user choices.
3. Integrate the account's real CMP code and its consent-controlled tag loading. Keep ad requests off until the CMP permits the relevant processing; handle rejection and withdrawal correctly. Test the actual CMP, including mobile and any limited/non-personalised ad behaviour.
4. Update privacy disclosures with actual vendors, identifiers, retention and transfers. Get fresh consent for new purposes; never reuse the local planner consent for ads.
5. Only then enable production ad slots with real publisher/slot identifiers.

References: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/ and https://support.google.com/adsense/answer/13554116?hl=en
