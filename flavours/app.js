// Saveur active : la section qui traverse le milieu de l'écran pilote data-flavour
const root = document.documentElement;
const sections = [...document.querySelectorAll('.flavour')];
root.dataset.flavour = sections[0].dataset.flavour;

const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) root.dataset.flavour = e.target.dataset.flavour;
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => io.observe(s));

// Ingrédients : vitesse 0,2–0,6 × scroll ; profondeur = vitesse (petit/lent = loin, grand/rapide = proche)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FADE = 220; // px de fondu aux bords de section
const BTN_ZONE_W = 260, LOGO_ZONE_W = 260, BTN_ZONE_H = 90; // zones du bouton (droite) et du logo (gauche) dans la barre du haut
const MAX_BLUR = 7; // px de flou (écran) pour l'ingrédient le plus lointain
const layers = [];
sections.forEach((section, si) => {
  const items = section.querySelector('.ingredients').dataset.items.split(',');
  items.forEach((spec, i) => {
    const [name, speed, size] = spec.split(':');
    layers.push({
      section, name, s: +speed, size: +size * 1.6,
      left: i % 2 ? 62 + (i * 7) % 30 : 2 + (i * 11) % 30,          // % de la largeur
      top: 4 + (i / items.length) * 84 + (si % 2) * 3,                 // % de la hauteur de section
      rot: ((i * 47) % 70 - 35),
      blur: (0.6 - +speed) / 0.4,                                      // 0 (net) … 1 (flou max)
      tex: null,
    });
  });
});

// ---- Rendu WebGL ----
const canvas = document.createElement('canvas');
canvas.className = 'gl';
const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });

if (gl) {
  document.body.prepend(canvas);
  const compile = (type, src) => {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, `
    attribute vec2 a;                 // coin du quad, -1…1
    uniform vec2 u_res, u_pos;        // résolution canvas, centre du sprite (px)
    uniform float u_half, u_rot;      // demi-côté dessiné (px), rotation
    varying vec2 v_uv;
    void main(){
      float c = cos(u_rot), s = sin(u_rot);
      vec2 p = a * u_half;
      p = vec2(p.x*c - p.y*s, p.x*s + p.y*c) + u_pos;
      gl_Position = vec4(p.x/u_res.x*2.-1., 1.-p.y/u_res.y*2., 0., 1.);
      v_uv = a;                       // repère du quad (étendu par la marge de flou)
    }`));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform sampler2D u_tex;
    uniform float u_ext;              // ratio quad / sprite (>=1)
    uniform float u_radius;           // rayon de flou en UV sprite (profondeur de champ)
    uniform float u_fade;             // voile atmosphérique selon la profondeur
    uniform float u_alpha;            // fondu aux frontières de section
    varying vec2 v_uv;
    vec4 tap(vec2 uv){
      vec2 t = uv*.5+.5;
      return (t.x<0.||t.x>1.||t.y<0.||t.y>1.) ? vec4(0.) : texture2D(u_tex, t);
    }
    void main(){
      vec2 uv = v_uv*u_ext;
      vec4 col = tap(uv);
      if(u_radius > 0.0005){
        // disque de Vogel : 24 échantillons, rayon = cercle de confusion
        col = vec4(0.);
        for(int i=0;i<24;i++){
          float r = sqrt((float(i)+.5)/24.), th = float(i)*2.39996;
          col += tap(uv + u_radius*r*vec2(cos(th), sin(th)));
        }
        col /= 24.;
      }
      col.rgb *= 1. - u_fade*.18;     // légère atténuation des plans lointains
      col *= 1. - u_fade*.25;         // et transparence
      gl_FragColor = col * u_alpha;
    }`));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { res: U('u_res'), pos: U('u_pos'), half: U('u_half'), rot: U('u_rot'),
              ext: U('u_ext'), radius: U('u_radius'), fade: U('u_fade'), alpha: U('u_alpha'), tex: U('u_tex') };
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const textures = {};
  const load = name => textures[name] ||= (() => {
    const t = gl.createTexture();
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
                            [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
        gl.texParameteri(gl.TEXTURE_2D, k, v);
      t.ready = true; schedule();
    };
    img.src = (window.SPRITES && SPRITES[name]) || `img/${name}.png`;
    return t;
  })();
  layers.forEach(l => { l.tex = load(l.name); });

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    schedule();
  };

  const draw = () => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1i(u.tex, 0);
    const W = innerWidth, H = innerHeight;
    for (const sec of sections) {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) continue;
      for (const l of layers) {
        if (l.section !== sec || !l.tex.ready) continue;
        const y = r.top + (l.top / 100) * r.height - (1 - l.s) * r.top + l.size / 2;
        const x = (l.left / 100) * W + l.size / 2;
        // fondu : l'ingrédient s'efface en approchant le haut/bas de sa section au lieu d'être coupé net
        const edge = Math.min(y - r.top, r.bottom - y);
        let alpha = Math.min(Math.max(edge / FADE, 0), 1);
        // à droite, l'ingrédient s'efface avant d'atteindre le bouton « Ajouter au sac » (barre du haut)
        // idem à gauche, avant le logo « Trois saveurs »
        if (x + l.size / 2 > W - BTN_ZONE_W || x - l.size / 2 < LOGO_ZONE_W) {
          const clear = Math.min(Math.max((y - l.size / 2 - BTN_ZONE_H) / 120, 0), 1);
          alpha *= clear;
        }
        if (alpha <= 0) continue;
        const blurPx = l.blur * MAX_BLUR;
        const ext = 1 + (blurPx * 1.5) / (l.size / 2);           // marge pour que le flou ne soit pas rogné
        gl.uniform2f(u.pos, x * dpr, y * dpr);
        gl.uniform1f(u.half, (l.size / 2) * ext * dpr);
        gl.uniform1f(u.rot, (l.rot + r.top * l.s * 0.04) * Math.PI / 180);
        gl.uniform1f(u.ext, ext);
        gl.uniform1f(u.radius, blurPx / l.size * 2);              // en UV (-1…1 sur l.size px)
        gl.uniform1f(u.fade, l.blur);
        gl.uniform1f(u.alpha, alpha * alpha * (3 - 2 * alpha));
        gl.bindTexture(gl.TEXTURE_2D, l.tex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  };

  let ticking = false;
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; draw(); }); } }
  addEventListener('resize', resize);
  if (!reduce) addEventListener('scroll', schedule, { passive: true });
  resize();
} else {
  // Repli sans WebGL : images CSS avec flou
  sections.forEach(sec => {
    const box = sec.querySelector('.ingredients');
    layers.filter(l => l.section === sec).forEach(l => {
      const img = new Image();
      img.src = `img/${l.name}.png`; img.alt = ''; img.className = 'ingredient';
      img.width = img.height = l.size;
      img.style.left = l.left + '%'; img.style.top = l.top + '%';
      img.style.filter = `blur(${(l.blur * 2).toFixed(2)}px)`;
      box.appendChild(img); l.img = img;
    });
  });
  const update = () => {
    for (const l of layers) {
      const top = l.section.getBoundingClientRect().top;
      l.img.style.transform = `translate3d(0,${(-(1 - l.s) * top).toFixed(1)}px,0) rotate(${(l.rot + top * l.s * 0.04).toFixed(1)}deg)`;
    }
  };
  if (!reduce) addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
}
