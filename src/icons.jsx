// Outline icons, monochrome. Stroke = currentColor.
const I = ({d, size=16, sw=1.6, children, viewBox="0 0 24 24"}) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d}/> : children}
  </svg>
);

const Icons = {
  Leads: (p)=> <I {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.7-3 3-4.5 5.5-4.5S13.8 16 14.5 19"/><circle cx="17" cy="9" r="2.5"/><path d="M14.5 14.4c2.4 0 5 1.2 5.5 4.6"/></I>,
  Pipeline: (p)=> <I {...p}><rect x="3" y="4" width="4.5" height="16" rx="1"/><rect x="9.75" y="4" width="4.5" height="11" rx="1"/><rect x="16.5" y="4" width="4.5" height="7" rx="1"/></I>,
  Sales: (p)=> <I {...p}><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></I>,
  Property: (p)=> <I {...p}><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.8V20h14V9.8"/><path d="M10 20v-5h4v5"/></I>,
  Dashboard: (p)=> <I {...p}><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></I>,
  Settings: (p)=> <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></I>,
  Search: (p)=> <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></I>,
  Plus: (p)=> <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  Filter: (p)=> <I {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></I>,
  Whatsapp: (p)=> <I {...p}><path d="M20 12a8 8 0 1 1-3.4-6.5L20 4l-1.5 3.6A8 8 0 0 1 20 12z"/><path d="M8.5 9.5c.4 2.5 2.5 4.6 5 5l1.5-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z"/></I>,
  More: (p)=> <I {...p}><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></I>,
  Arrow: (p)=> <I {...p}><path d="M5 12h14M13 6l6 6-6 6"/></I>,
  ArrowUp: (p)=> <I {...p}><path d="M6 14l6-6 6 6"/></I>,
  ArrowDown: (p)=> <I {...p}><path d="M6 10l6 6 6-6"/></I>,
  Phone: (p)=> <I {...p}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></I>,
  Mail: (p)=> <I {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></I>,
  Calendar: (p)=> <I {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></I>,
  Bell: (p)=> <I {...p}><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 6 1.5 6h-15S6 12 6 8z"/><path d="M10 18a2 2 0 0 0 4 0"/></I>,
  Close: (p)=> <I {...p}><path d="M6 6l12 12M18 6 6 18"/></I>,
  Chevron: (p)=> <I {...p}><path d="m9 6 6 6-6 6"/></I>,
  Pin: (p)=> <I {...p}><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></I>,
  Sparkle: (p)=> <I {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></I>,
  Download: (p)=> <I {...p}><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></I>,
  Eye: (p)=> <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></I>,
  Home: (p)=> <I {...p}><path d="M3 10.5 12 4l9 6.5V20H3z"/></I>,
  Doc: (p)=> <I {...p}><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></I>,
  Check: (p)=> <I {...p}><path d="m4 12 5 5L20 7"/></I>,
};

window.Icons = Icons;
