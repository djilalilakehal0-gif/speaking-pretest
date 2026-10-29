# Un produit, trois saveurs

Page de défilement : le fond, le texte et le bouton « Ajouter au sac » changent de couleur selon la saveur à l'écran.

- `index.html` : trois sections `#burger`, `#pizza`, `#kebab` (liste d'ingrédients dans `data-items="nom:vitesse:taille"`).
- `style.css` : palettes (`--bg`, `--ink`) par `[data-flavour]`, transition 600 ms.
- `app.js` : `IntersectionObserver` (`rootMargin: -50% 0 -50% 0`), parallaxe 0,2–0,6 × scroll, profondeur de champ en WebGL (repli : images CSS avec `blur`). Constantes de réglage en haut du fichier (`FADE`, `FADE_TOP`, `MAX_BLUR`, zones du logo et du bouton).
- `sprites.js` : ingrédients PNG intégrés (la page marche aussi en `file://`). Les PNG d'origine sont dans `img/`.
