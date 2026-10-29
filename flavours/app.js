// 1-4. Fond de page : la saveur qui traverse le milieu de l'écran pilote data-flavour
const root = document.documentElement;
const sections = [...document.querySelectorAll('.flavour')];
root.dataset.flavour = sections[0].dataset.flavour;

const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) root.dataset.flavour = e.target.dataset.flavour;
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => io.observe(s));

// 6-7. Ingrédients PNG : vitesse 0,2–0,6 × scroll ; petits = lents + flou 2px, grands = rapides + nets
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const layers = [];
sections.forEach((section, si) => {
  const box = section.querySelector('.ingredients');
  const items = box.dataset.items.split(',');
  items.forEach((spec, i) => {
    const [name, speed, size] = spec.split(':');
    const s = +speed;
    const img = new Image();
    img.src = `img/${name}.png`;
    img.alt = '';
    img.className = 'ingredient';
    img.width = img.height = +size * 1.6;
    // répartition en quinconce gauche/droite, hauteurs étalées
    const left = i % 2 ? 62 + (i * 7) % 30 : 2 + (i * 11) % 30;
    img.style.left = left + '%';
    img.style.top = (4 + (i / items.length) * 84 + (si % 2) * 3) + '%';
    img.style.filter = `blur(${((0.6 - s) / 0.4 * 2).toFixed(2)}px)`;
    img.dataset.rot = (i * 47) % 70 - 35;
    box.appendChild(img);
    layers.push({ section, img, s, rot: +img.dataset.rot });
  });
});

let ticking = false;
function update() {
  ticking = false;
  const vh = innerHeight;
  for (const l of layers) {
    const top = l.section.getBoundingClientRect().top;
    if (top > vh || top < -l.section.offsetHeight) continue;
    // l'élément défile à 1× ; on retire (1 - s) du déplacement pour qu'il avance à s × scroll
    const y = -(1 - l.s) * top;
    l.img.style.transform = `translate3d(0,${y.toFixed(1)}px,0) rotate(${(l.rot + top * l.s * 0.04).toFixed(1)}deg)`;
  }
}
if (!reduce) {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
}
update();
