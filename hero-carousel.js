(() => {
  'use strict';
  const hero = document.querySelector('.home-hero');
  const first = hero?.querySelector('img');
  if (!first) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const slides = [
    {name: 'Chicken Karahi', image: first},
    {name: 'Harissa Prawn Orzo', file: 'harissa-prawn-orzo', thumb: 480},
    {name: 'Mushroom Soup', file: 'mushroom-soup', thumb: 600}
  ];
  const controls = document.createElement('div');
  controls.className = 'hero-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Homepage photographs');
  let current = 0, request = 0, timer, hovered = false, paused = false;
  function button(label, text, action) {
    const el = document.createElement('button');
    el.type = 'button';
    el.setAttribute('aria-label', label);
    el.title = label;
    el.textContent = text;
    el.addEventListener('click', action);
    controls.append(el);
    return el;
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused && !motion.matches && !hovered && !hero.contains(document.activeElement) && !document.hidden)
      timer = setTimeout(() => show(current + 1), 7000);
  }
  async function show(index) {
    clearTimeout(timer);
    const token = ++request;
    index = (index + slides.length) % slides.length;
    const slide = slides[index];
    if (!slide.image) {
      const image = new Image(1200, 800);
      image.alt = slide.name;
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      image.sizes = first.sizes;
      image.srcset = 'images/' + slide.file + '-thumb.webp ' + slide.thumb + 'w, images/' + slide.file + '.webp 1200w';
      image.src = 'images/' + slide.file + '.webp';
      first.after(image);
      slide.image = image;
    }
    try { await slide.image.decode(); }
    catch { if (token === request) schedule(); return; }
    if (token !== request) return;
    getComputedStyle(slide.image).opacity; // Establish the hidden frame before fading in.
    slides.forEach((s, i) => {
      s.image?.setAttribute('aria-hidden', String(index !== i));
      dots[i].setAttribute('aria-current', String(index === i));
    });
    current = index;
    schedule();
  }
  button('Previous photograph', '‹', () => show(current - 1));
  const dots = slides.map((slide, i) => {
    const el = button('Show ' + slide.name, '', () => show(i));
    el.dataset.slide = String(i);
    el.setAttribute('aria-current', String(i === 0));
    return el;
  });
  button('Next photograph', '›', () => show(current + 1));
  const pause = button('Pause rotation', 'Ⅱ', () => {
    paused = !paused;
    syncPause();
    schedule();
  });
  function syncPause() {
    pause.hidden = motion.matches;
    pause.textContent = paused ? '▷' : 'Ⅱ';
    pause.title = paused ? 'Resume rotation' : 'Pause rotation';
    pause.setAttribute('aria-label', pause.title);
  }
  hero.append(controls);
  hero.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') {hovered = true; schedule();} });
  hero.addEventListener('pointerleave', () => {hovered = false; schedule();});
  hero.addEventListener('focusin', schedule);
  hero.addEventListener('focusout', () => queueMicrotask(schedule));
  controls.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    show(current + (e.key === 'ArrowLeft' ? -1 : 1));
  });
  motion.addEventListener('change', () => {syncPause(); schedule();});
  document.addEventListener('visibilitychange', schedule);
  syncPause();
  schedule();
})();
