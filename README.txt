ADAM COOKS

99 recipe records with serving controls, cooking mode and timers, searchable
collections, a meal planner and shopping list, private saved collections and
notes, optional recent history, and explicitly requested offline downloads.
The existing committed photographs and app icons are retained.

CHECKS
Use Node.js 24 or later and Python 3 with Pillow installed.
  npm ci
  npm test
  npm run audit
  python3 -m unittest discover -s scripts -p 'test_*.py'
The static audit checks page links, fragment targets, image references,
accessibility references and catalogue membership. JavaScript tests cover
recipe scaling, planner behaviour, consent, saving, sharing and offline logic.
Python tests cover recipe guidance, metadata and publishing helpers.
The live AI service and real-device sharing require separate production checks;
these local commands do not call OpenAI or send contact messages.

PUBLISHING
Review the patch against the current main branch, run the checks above, and
publish the verified commit. Confirm the GitHub Pages build and deploy jobs
succeed, then compare representative live files with the commit and check the
changed controls in a browser. Preserve existing working features and images.
Follow AGENTS.md for the catalogue and metadata refresh order. The metadata
updater populates default ingredient quantities in HTML for use before scripts
load. Refresh the offline catalogue last so its hashes match the final files.

BASE GRAVY
This recipe is measured in full batches. One batch uses the original full
ingredient quantities. Its finished volume has not been measured. The planner
shows the exact volume required by the selected curries and lets the cook choose
how many full batches to make; it does not infer a volume from a servings count.
Only add a yieldMl value after measuring a complete finished batch at the
consistency used by the curry recipes.

SAVED DATA AND PRIVACY
Collections, favourites and notes stay in the current browser. Planner history,
recent views and Vibe cooking drafts are optional. Keep a backup of important
plans and collections before clearing website data. Disabling optional storage
leaves existing saved data untouched. Analytics stays off until accepted.
No advertising is enabled. Offline downloads contain public recipe assets;
contact submissions and AI requests are not cached.

VIBE COOKING
The configured hosted service creates up to three new recipe ideas from a brief.
No API key is shipped in this website. Initial limits are 10 generation attempts
per UTC day and 100 per calendar month across visitors; provider failures count.
Requests use the owner's API account. Copy request to ChatGPT is also available.
See AI-SETUP.md for the service configuration and maintenance notes.
