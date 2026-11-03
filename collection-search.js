const search = document.getElementById('search');
const cards = [...document.querySelectorAll('.recipe-card')];
const status = document.getElementById('collection-search-status');
const empty = document.getElementById('collection-search-empty');

function normalise(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function filterRecipes() {
  const query = normalise(search.value.trim());
  let count = 0;
  for (const card of cards) {
    const name = card.dataset.search || card.textContent;
    card.hidden = !normalise(name).includes(query);
    if (!card.hidden) count++;
  }
  empty.hidden = count !== 0;
  status.textContent = query ? count + (count === 1 ? ' recipe found.' : ' recipes found.') : '';
}

search.addEventListener('input', filterRecipes);
filterRecipes();
