// Line icons (24px grid, stroke = currentColor) matching the gold-outline style of the brand mockup.
const s = (d: string) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  home: s('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h4.5v-5h4v5h4.5V10"/>'),
  book: s('<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z"/><path d="M12 6.5v13"/>'),
  people: s('<circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="9.5" r="2.2"/><circle cx="18.5" cy="9.5" r="2.2"/><path d="M6.5 19c.5-3 2.7-5 5.5-5s5 2 5.5 5"/><path d="M2.5 18c.3-2 1.5-3.3 3.2-3.6M21.5 18c-.3-2-1.5-3.3-3.2-3.6"/>'),
  scales: s('<path d="M12 4v16M8 20h8M5 7h14"/><path d="M12 4.5 5 7M12 4.5 19 7"/><path d="m5 7-3 6a3 3 0 0 0 6 0Z"/><path d="m19 7-3 6a3 3 0 0 0 6 0Z"/>'),
  chat: s('<path d="M4 5h16v10H9l-5 4Z"/><path d="M8 9.5h.01M12 9.5h.01M16 9.5h.01"/>'),
  bell: s('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  globe: s('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17"/>'),
  pin: s('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  rocket: s('<path d="M14 4c3 0 6 3 6 6l-6.5 6.5-6-6Z"/><path d="m7.5 10.5-3 .5L3 13.5l4 1M13.5 16.5l-.5 3L10.5 21l-1-4"/><circle cx="15" cy="9" r="1.4"/><path d="M6 18c-1 1-1.5 2.5-1.5 2.5S6 20 7 19"/>'),
  doc: s('<path d="M6 3.5h8l4 4v13H6Z"/><path d="M14 3.5v4h4M9 12h6M9 15h6M9 18h4"/>'),
  chevron: s('<path d="m9 6 6 6-6 6"/>'),
  chevronDown: s('<path d="m6 9 6 6 6-6"/>'),
  badge: s('<path d="m12 3 2.2 1.6 2.7-.2.9 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.9 2.6-2.7-.2L12 21l-2.2-1.6-2.7.2-.9-2.6L4 15.4l.9-2.6L4 10.2l2.2-1.6.9-2.6 2.7.2Z"/><path d="m8.8 12.2 2.2 2.2 4.3-4.4"/>'),
  list: s('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>'),
};

/** Laurel branch drawn procedurally (no long path data): a curved stem with paired leaves. Mirror with transform for the other side. */
export function laurel(mirror = false) {
  const leaves: string[] = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6; const a = -70 + t * 120;
    const x = 30 + Math.cos((a * Math.PI) / 180) * 22; const y = 34 - Math.sin((a * Math.PI) / 180) * 26;
    leaves.push(`<ellipse cx="${(x - 5).toFixed(1)}" cy="${y.toFixed(1)}" rx="6.4" ry="2.8" transform="rotate(${(a + 35).toFixed(0)} ${(x - 5).toFixed(1)} ${y.toFixed(1)})"/>`);
    leaves.push(`<ellipse cx="${(x + 5).toFixed(1)}" cy="${(y - 1).toFixed(1)}" rx="6.4" ry="2.8" transform="rotate(${(a - 35).toFixed(0)} ${(x + 5).toFixed(1)} ${(y - 1).toFixed(1)})"/>`);
  }
  return `<svg class="laurel" viewBox="0 0 60 70" width="58" height="68" aria-hidden="true" style="${mirror ? 'transform:scaleX(-1)' : ''}"><path d="M30 64C8 52 6 22 22 6" fill="none" stroke="url(#gg)" stroke-width="2"/><g fill="url(#gg)">${leaves.join('')}</g></svg>`;
}
