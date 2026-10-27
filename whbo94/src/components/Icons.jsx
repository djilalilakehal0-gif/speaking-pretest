const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const I = (d, extra = {}) => (props) => <svg {...base} {...extra} {...props}>{d}</svg>;

export const Play = I(<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />);
export const Pause = I(<><rect x="6" y="4.5" width="4.2" height="15" rx="1" fill="currentColor" stroke="none" /><rect x="13.8" y="4.5" width="4.2" height="15" rx="1" fill="currentColor" stroke="none" /></>);
export const Heart = I(<path d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3.3 5 6.6 5c2 0 3.5 1.1 5.4 3 1.9-1.9 3.4-3 5.4-3 3.3 0 5.4 3.3 4 6.7C19.5 16.4 12 21 12 21z" />);
export const Bookmark = I(<path d="M6 3h12v18l-6-4-6 4z" />);
export const Share = I(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>);
export const Next = I(<><path d="M5 4.5v15l11-7.5z" fill="currentColor" stroke="none" /><path d="M19 5v14" /></>);
export const Volume = I(<><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></>);
export const Mute = I(<><path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" /><path d="M22 9l-6 6M16 9l6 6" /></>);
export const Fullscreen = I(<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />);
export const Search = I(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const Eye = I(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const Menu = I(<path d="M4 7h16M4 12h16M4 17h16" />);
export const Close = I(<path d="M6 6l12 12M18 6L6 18" />);
export const Sparkle = I(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" fill="currentColor" stroke="none" />);
export const Pin = I(<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z" />);
export const Trash = I(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const Edit = I(<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />);
export const Up = I(<path d="M6 15l6-6 6 6" />);
export const Down = I(<path d="M6 9l6 6 6-6" />);

export const Crescent = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3c4" /><stop offset="1" stopColor="#b8902a" /></linearGradient></defs>
    <path d="M40 8a24 24 0 1 0 0 48 19 19 0 1 1 0-48z" fill="url(#gc)" />
    <path d="M47 14l1.6 4.2 4.4.4-3.4 2.9 1 4.3-3.6-2.4-3.8 2.4 1.2-4.3-3.4-2.9 4.4-.4z" fill="#fff3c4" />
  </svg>
);
