const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const planner = require('../planner-core.js');
const source = fs.readFileSync(path.join(__dirname, '../recipe-data.js'), 'utf8');
const catalogue = JSON.parse(source.slice(source.indexOf('['), source.lastIndexOf(']') + 1));

test('traybake shopping list scales the approved dressing and vegetables for one to eight people', () => {
  const recipes = catalogue.filter(recipe => recipe.id === 'lemon-garlic-oregano-chicken-traybake');
  assert.equal(recipes.length, 1);
  assert.equal(recipes[0].baseServings, 2);
  const quantities = [
    ['chicken breasts', 2], ['potatoes', 450], ['red onion', 1], ['red pepper', 1],
    ['courgette', 1], ['cherry tomatoes', 150], ['garlic', 5], ['large lemon', 1],
    ['olive oil', 9], // The planner stores tablespoons as three teaspoons.
    ['dried oregano', 3], ['smoked paprika', 1.5], ['Dijon mustard', 2], ['honey', 2],
    ['fine salt', 1.25], ['black pepper', 0.5], ['chilli flakes', 0.25], ['parsley', 10]
  ];
  for (let people = 1; people <= 8; people++) {
    for (const optional of [false, true]) {
      const plan = planner.initial();
      Object.assign(plan, {people, optional, count: 1});
      plan.days = planner.generate(plan, recipes, () => 0.5);
      const list = planner.shopping(plan, recipes);
      assert.equal(list.length, optional ? 17 : 16);
      for (const [name, quantity] of quantities) {
        const rows = list.filter(row => row.name.includes(name));
        if (name === 'chilli flakes' && !optional) {
          assert.equal(rows.length, 0);
          continue;
        }
        assert.equal(rows.length, 1, name);
        const [row] = rows;
        const expected = quantity * people / 2;
        assert.equal(row.min, expected, name);
        assert.equal(row.max, expected, name);
        if (row.unit === 'tsp' && name !== 'olive oil') {
          assert.ok(row.display.startsWith(expected + ' tsp '), row.display);
        }
      }
    }
  }
});
