// Calque de motion design : intro, bandeaux de saveur, barre de progression, outro.
// Entièrement piloté par window.__mg(t, prog) : même image pour un même temps (rendu image par image).
(() => {
  const C = { burger: [243,232,222], pizza: [250,225,214], kebab: [247,214,160] };
  const INK = { burger: [74,44,30], pizza: [150,30,24], kebab: [122,48,12] };
  const rgb = a => `rgb(${a.map(Math.round).join(',')})`;
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const cl = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b);
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const inOut = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const outExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const outBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden;font-family:system-ui,sans-serif';
  const el = (css, parent = root, html = '') => { const d = document.createElement('div'); d.style.cssText = css; d.innerHTML = html; parent.appendChild(d); return d; };
  const full = bg => `position:absolute;inset:0;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;will-change:transform`;

  // lignes de titre en lettres masquées
  const lineChars = (parent, text, size, color) => {
    const line = el(`overflow:hidden;line-height:1.02;padding:.06em .1em;font-size:${size}px;font-weight:900;letter-spacing:-.035em;color:${color}`, parent);
    return [...text].map(ch => { const s = document.createElement('span'); s.textContent = ch === ' ' ? ' ' : ch; s.style.cssText = 'display:inline-block;will-change:transform'; line.appendChild(s); return s; });
  };

  // empilement : kebab / pizza / burger (intro, du fond vers le haut)
  const iK = el(full(rgb(C.kebab))), iP = el(full(rgb(C.pizza))), iB = el(full(rgb(C.burger)));
  const introChars = [...lineChars(iB, 'Un produit,', 170, rgb(INK.burger)), ...lineChars(iB, 'trois saveurs.', 170, rgb(INK.burger))];
  const introSplit = 11; // nb de lettres de la 1re ligne

  // bandeau de saveur (bas gauche)
  const lt = el('position:absolute;left:96px;bottom:84px;display:flex;align-items:center;gap:24px;opacity:0');
  const ltNum = el('font-size:34px;font-weight:700;letter-spacing:.2em;color:var(--ink)', lt);
  const ltLine = el('height:4px;width:0;background:var(--ink)', lt);
  const ltMask = el('overflow:hidden;padding:.08em 0', lt);
  const ltName = el('font-size:76px;font-weight:900;letter-spacing:-.03em;text-transform:uppercase;color:var(--ink);will-change:transform', ltMask);

  // barre de progression
  const bar = el('position:absolute;left:0;bottom:0;height:10px;width:0;background:var(--ink)');

  // outro : trois bandes + carte finale
  const oB = el(full(rgb(INK.burger))), oP = el(full(rgb(INK.pizza))), oK = el(full(rgb(INK.kebab)));
  const oC = el(full(rgb(C.burger)));
  const outChars = [...lineChars(oC, 'Un produit.', 150, rgb(INK.burger)), ...lineChars(oC, 'Trois saveurs.', 150, rgb(INK.burger))];
  const outSplit = 11;
  const btn = el('margin-top:70px;padding:30px 78px;border-radius:999px;font-size:44px;font-weight:700;letter-spacing:.04em;color:#fff;will-change:transform', oC, 'Ajouter au sac');

  const LT = [
    { a: 3.3, b: 5.6, n: '01', name: 'Burger' },
    { a: 10.5, b: 13.2, n: '02', name: 'Pizza' },
    { a: 18.0, b: 21.0, n: '03', name: 'Kebab' },
  ];

  window.__mg = (t, prog) => {
    document.body.appendChild(root);
    // intro
    introChars.forEach((s, i) => {
      const k = i < introSplit ? i : i - introSplit;
      const base = i < introSplit ? 0.15 : 0.55;
      s.style.transform = `translateY(${(1 - outExpo(seg(t, base + k * 0.04, base + k * 0.04 + 0.7))) * 115}%)`;
    });
    iB.style.transform = `translateY(${-inOut(seg(t, 2.0, 2.8)) * 100}%)`;
    iP.style.transform = `translateY(${-inOut(seg(t, 2.12, 2.92)) * 100}%)`;
    iK.style.transform = `translateY(${-inOut(seg(t, 2.24, 3.04)) * 100}%)`;
    iB.style.display = t > 3.1 ? 'none' : 'flex'; iP.style.display = iB.style.display; iK.style.display = iB.style.display;

    // bandeau de saveur
    let shown = false;
    for (const L of LT) if (t >= L.a && t <= L.b) {
      shown = true;
      const kIn = seg(t, L.a, L.a + 0.7), kOut = seg(t, L.b - 0.45, L.b);
      lt.style.opacity = 1;
      ltNum.textContent = L.n; ltName.textContent = L.name;
      ltLine.style.width = `${outExpo(kIn) * 140 * (1 - inOut(kOut))}px`;
      ltName.style.transform = `translateY(${(1 - outExpo(kIn)) * 110 + inOut(kOut) * -110}%)`;
      ltNum.style.opacity = kIn * (1 - kOut);
    }
    if (!shown) lt.style.opacity = 0;

    // progression
    bar.style.width = `${(t > 2.9 && t < 21.4 ? prog : 0) * 100}vw`;

    // outro
    const slide = (e, a, b) => { e.style.transform = `translateX(${(1 - inOut(seg(t, a, b))) * 100}%)`; };
    slide(oB, 21.0, 21.7); slide(oP, 21.14, 21.84); slide(oK, 21.28, 21.98);
    oC.style.transform = `translateY(${(1 - inOut(seg(t, 21.55, 22.35))) * 100}%)`;
    outChars.forEach((s, i) => {
      const k = i < outSplit ? i : i - outSplit;
      const base = i < outSplit ? 22.15 : 22.5;
      s.style.transform = `translateY(${(1 - outExpo(seg(t, base + k * 0.04, base + k * 0.04 + 0.7))) * 115}%)`;
    });
    const bk = outBack(seg(t, 23.0, 23.55));
    const c = Math.max(0, (t - 23.4) / 0.5), i0 = Math.floor(c) % 3, kk = inOut(c % 1);
    const keys = ['burger', 'pizza', 'kebab'];
    btn.style.background = rgb(mix(INK[keys[i0]], INK[keys[(i0 + 1) % 3]], t < 23.4 ? 0 : kk));
    btn.style.transform = `scale(${bk})`; btn.style.opacity = seg(t, 23.0, 23.2);
  };
})();
