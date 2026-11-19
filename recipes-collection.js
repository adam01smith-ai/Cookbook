(() => {
  'use strict';
  const hero = document.querySelector('.collection-hero');
  const catalogue = new Map(window.COOKBOOK_RECIPES.map(recipe => [recipe.file, recipe]));
  const cards = [...document.querySelectorAll('#recipes .recipe-card')];
  const slides = [];
  for (const card of cards) {
    const link = card.querySelector('.card-link');
    const file = link.getAttribute('href');
    const recipe = catalogue.get(file);
    if (!recipe) continue;
    card.dataset.proteins = JSON.stringify(recipe.proteins || []);
    if (recipe.image) slides.push({
      file, name: link.querySelector('h2').textContent,
      image: recipe.image.replace(/-thumb(?=\.)/, ''),
      description: link.querySelector('.catalogue-description')?.textContent || recipe.category
    });
  }
  const protein = document.getElementById('collection-protein');
  for (const value of [...new Set([...catalogue.values()].flatMap(r => r.proteins || []))].sort())
    protein.add(new Option(value, value));
  const grid = document.getElementById('recipes');
  document.getElementById('collection-sort').onchange = event => {
    const order = event.target.value;
    const sorted = cards.slice();
    if (order === 'name') sorted.sort((a,b) => a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent,'en'));
    if (order === 'time') sorted.sort((a,b) => Number(a.dataset.maxMinutes || Infinity) - Number(b.dataset.maxMinutes || Infinity));
    grid.append(...sorted);
  };
  const quickTime = document.querySelector('[data-quick-time]');
  quickTime.onclick = () => {
    const time = document.getElementById('recipe-time');
    time.value = quickTime.dataset.quickTime;
    time.dispatchEvent(new Event('change'));
  };
  for (const tile of document.querySelectorAll('[data-mood]')) tile.onclick = () => {
    if (tile.dataset.mood === 'cuisine') {
      const picker = document.querySelector('.cuisine-picker');
      picker.open = true;
      picker.querySelector('summary').focus();
      return;
    }
    if (tile.dataset.mood === 'category') document.querySelector('.filter[data-category="'+tile.dataset.value+'"]').click();
    else {
      const search = document.getElementById('search');
      search.value = tile.dataset.value;
      search.dispatchEvent(new Event('input'));
    }
    document.querySelector('.index-heading').scrollIntoView({block:'start'});
  };
  if (!slides.length) return;
  let index = Math.max(0,slides.findIndex(r => r.file === 'karahi.html'));
  let requested = index, serial = 0, timer;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, hovering = false, visible = true;
  const play = hero.querySelector('.hero-play');
  const position = hero.querySelector('.hero-position');
  const link = hero.querySelector('.lime-link');
  const photos = [...hero.querySelectorAll('.hero-photo')];
  function schedule() {
    clearTimeout(timer);
    play.textContent = paused ? 'Play rotation' : 'Pause rotation';
    if (!paused && !hovering && visible && !document.hidden && !hero.contains(document.activeElement) && slides.length > 1)
      timer = setTimeout(() => advance(1,false),7000);
  }
  async function advance(step,manual) {
    clearTimeout(timer);
    const token = ++serial;
    for (let tries=0; tries < slides.length; tries++) {
      requested = (requested + step + slides.length) % slides.length;
      const slide = slides[requested];
      const next = photos.find(photo => !photo.classList.contains('current'));
      next.alt = slide.name;
      next.src = slide.image;
      try { await next.decode(); } catch { if (serial !== token) return; continue; }
      if (serial !== token) return;
      for (const photo of photos) photo.classList.toggle('current',photo === next);
      index = requested;
      hero.querySelector('h1').textContent = slide.name;
      hero.querySelector('.hero-description').textContent = slide.description;
      link.href = slide.file;
      position.textContent = (index+1)+' / '+slides.length;
      if (manual) hero.querySelector('[role=status]').textContent = slide.name;
      break;
    }
    schedule();
  }
  // Start the published catalogue sequence with Karahi.
  slides.push(...slides.splice(0,index));
  index = requested = 0;
  position.textContent = '1 / '+slides.length;
  hero.querySelector('.hero-prev').onclick = () => advance(-1,true);
  hero.querySelector('.hero-next').onclick = () => advance(1,true);
  play.onclick = () => { paused=!paused; schedule(); };
  hero.onkeydown = event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); advance(event.key === 'ArrowRight'?1:-1,true);
    }
  };
  let start;
  hero.addEventListener('touchstart',e => {start=e.touches[0];clearTimeout(timer);},{passive:true});
  hero.addEventListener('touchend',e => {
    const end=e.changedTouches[0],dx=end.clientX-start.clientX;
    if (Math.abs(dx)>48 && Math.abs(dx)>Math.abs(end.clientY-start.clientY)) advance(dx<0?1:-1,true);
    else schedule();
  },{passive:true});
  hero.addEventListener('touchcancel',schedule);
  hero.onmouseenter=()=>{hovering=true;schedule();};
  hero.onmouseleave=()=>{hovering=false;schedule();};
  hero.onfocusin=schedule;
  hero.onfocusout=()=>queueMicrotask(schedule);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{paused=reduced.matches;schedule();});
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(hero);
  schedule();
})();
