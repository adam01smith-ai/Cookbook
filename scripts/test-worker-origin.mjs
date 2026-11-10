import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handle } from '../worker.mjs';
const origin = 'https://www.adamcooks.co.uk';
const endpoint = 'https://example.workers.dev/suggest';
const noUpstream = () => { throw Error('Preflight must not call a provider'); };
test('deployment configuration allows the canonical website', async () => {
 const config = JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 assert.equal(config.vars.ALLOWED_ORIGIN,origin);
 const response = await handle(new Request(endpoint,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}),config.vars,noUpstream);
 assert.equal(response.status,204);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
 assert.match(response.headers.get('Access-Control-Allow-Methods'),/POST/);
 assert.match(response.headers.get('Access-Control-Allow-Headers'),/Content-Type/i);
});
test('default origin also allows the canonical website without paid requests', async () => {
 const response = await handle(new Request(endpoint,{method:'OPTIONS',headers:{Origin:origin}}),{},noUpstream);
 assert.equal(response.status,204);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
});
test('unrelated origins remain blocked', async () => {
 const response = await handle(new Request(endpoint,{method:'OPTIONS',headers:{Origin:'https://unrelated.example'}}),{ALLOWED_ORIGIN:origin},noUpstream);
 assert.equal(response.status,403);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
});
test('configuration errors are readable by the website', async () => {
 const response = await handle(new Request(endpoint,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({prompt:'A quick pasta dinner',servings:2,noFish:true})}),{ALLOWED_ORIGIN:origin},noUpstream);
 assert.equal(response.status,503);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
});
