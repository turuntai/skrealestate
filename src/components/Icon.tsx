/**
 * One inline SVG sprite. Every glyph is drawn on a 24x24 grid with a 1.7px
 * stroke so icons sit at the same visual weight next to 14-16px text.
 */
export type IconName =
  | 'house' | 'building' | 'door' | 'shop' | 'briefcase' | 'map'
  | 'bed' | 'bath' | 'car' | 'bike' | 'drop' | 'road' | 'sofa' | 'ruler'
  | 'bolt' | 'sun' | 'lift' | 'balcony' | 'terrace' | 'leaf' | 'cctv'
  | 'shield' | 'wifi' | 'kitchen' | 'paw' | 'compass'
  | 'phone' | 'whatsapp' | 'viber' | 'share' | 'heart' | 'flag' | 'calendar'
  | 'check' | 'check-circle' | 'x' | 'chevron-left' | 'chevron-right' | 'chevron-down'
  | 'search' | 'sliders' | 'pin' | 'eye' | 'clock' | 'verified' | 'arrow-right'
  | 'plus' | 'trash' | 'edit' | 'camera' | 'video' | 'play' | 'star'
  | 'alert' | 'info' | 'menu' | 'link' | 'grid' | 'list' | 'refresh'
  | 'facebook' | 'mail' | 'globe' | 'key' | 'users' | 'tag' | 'shield-check';

const P: Record<IconName, string> = {
  house: 'M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5M9.5 21v-6h5v6',
  building: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 11h4a1 1 0 0 1 1 1v9M3 21h18M7.5 8h3M7.5 12h3M7.5 16h3M17.5 15h0M17.5 18h0',
  door: 'M4 21h16M7 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M14 12h.01',
  shop: 'M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0M5 12v9h14v-9M9.5 21v-5h5v5',
  briefcase: 'M3 8.5h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11ZM8.5 8.5v-2a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2M3 13.5h18',
  map: 'm9 4-6 2.5v13L9 17m0-13 6 2.5M9 4v13m6-10.5 6-2.5v13L15 20m0-13.5V20M9 17l6 3',
  bed: 'M3 19v-9m0 0V7m0 3h11a4 4 0 0 1 4 4v5M3 19h18M21 19v-5M6.5 13.5h2.5M3 15h18',
  bath: 'M4 11V6.5A2.5 2.5 0 0 1 6.5 4 2.5 2.5 0 0 1 9 6.5M7 6.5h.01M3 11h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2ZM7 18l-1.5 3M17 18l1.5 3',
  car: 'M5 16.5h14M6.5 16.5v2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-2M20.5 16.5v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2M3.5 16.5v-4l2-5.5a1.5 1.5 0 0 1 1.4-1h10.2a1.5 1.5 0 0 1 1.4 1l2 5.5v4M5.5 12.5h13M6.5 14.5h1M16.5 14.5h1',
  bike: 'M6 19a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM18 19a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM6 15.5h6l3.5-7M12 8.5h4M9.5 8.5H13',
  drop: 'M12 3s6 6.2 6 10.2A6 6 0 0 1 6 13.2C6 9.2 12 3 12 3Z',
  road: 'M8 3 5 21M16 3l3 18M12 4v3M12 10.5v3M12 17v3',
  sofa: 'M4 12V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V12M3 12.5A1.5 1.5 0 0 1 4.5 11 1.5 1.5 0 0 1 6 12.5V17h12v-4.5a1.5 1.5 0 0 1 3 0V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5.5ZM6 19v2M18 19v2',
  ruler: 'M3.5 14.5 14.5 3.5a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4L9.5 20.5a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4ZM8 10l2 2M11 7l2 2M14 4l2 2M5 13l2 2',
  bolt: 'M13 2 4.5 13.5H11L10 22l9-11.5h-6.5L13 2Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5',
  lift: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM12 3v18M8.5 9 7 7 5.5 9M8.5 15 7 17l-1.5-2M15.5 8h3M15.5 12h3M15.5 16h3',
  balcony: 'M4 10h16M6 10V4h12v6M4 14h16M6 10v10M10 10v10M14 10v10M18 10v10M3 20h18',
  terrace: 'M3 13h18L12 6 3 13ZM5 13v8M19 13v8M3 21h18M9 17h6M9 21v-4M15 21v-4',
  leaf: 'M4 20c0-9 5-14 16-15 0 11-5 15-11 15a5 5 0 0 1-5-5v5ZM8 16c2-4 5-6 8-7',
  cctv: 'm3 7 13-3 1.6 5.8L4.6 13 3 7ZM4.6 13l1.3 4.6M8 12.2 9 16M14 20a3 3 0 0 0-3-3H5M18.5 9.8l2.2-.6',
  shield: 'M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z',
  'shield-check': 'M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Zm-3.3 9.2 2.2 2.3 4.4-4.6',
  wifi: 'M2.5 8.5a15 15 0 0 1 19 0M5.5 12a10.5 10.5 0 0 1 13 0M8.5 15.5a6 6 0 0 1 7 0M12 19h.01',
  kitchen: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM3 9h18M7 6h.01M11 6h.01M7.5 12.5v5M11 12.5v5M16 12.5v2.5a1.5 1.5 0 0 1-3 0v-2.5',
  paw: 'M7 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM11 7.5a2 2 0 1 0 2 0M8 20a3 3 0 0 1-1.5-5.5C8 13.2 9 11.5 12 11.5s4 1.7 5.5 3A3 3 0 0 1 16 20c-1.5 0-2-.8-4-.8s-2.5.8-4 .8Z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5.5-5.5 2 2-5.5 5.5-2Z',
  phone: 'M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2.5 2.5 0 0 1-2.8 2.5C10.6 19.3 4.7 13.4 4 5.8A2.5 2.5 0 0 1 6.5 3Z',
  whatsapp: 'M3.5 20.5 5 16.2A8 8 0 1 1 8 19.2l-4.5 1.3ZM9 8.5c-.4 0-.8.2-1 .6-.3.6-.5 1.5.4 2.8a8 8 0 0 0 3.5 3c1.3.6 2 .3 2.5-.1.3-.3.5-.8.4-1.1l-1.7-.9-.8.9a6 6 0 0 1-2.3-2.3l.9-.8-.9-1.7a1 1 0 0 0-.5-.2H9Z',
  viber: 'M12 2.5c4.8 0 8 2.8 8 7.4 0 4.5-3.2 7.4-8 7.4h-.6l-2.7 3a.6.6 0 0 1-1-.4v-2.9C6 16 4 13.5 4 9.9c0-4.6 3.2-7.4 8-7.4ZM9.5 7c-.4 0-.7.2-.9.5-.3.5-.4 1.3.3 2.4a7 7 0 0 0 3 2.6c1.1.5 1.8.3 2.2-.1.3-.3.4-.7.3-1l-1.4-.8-.7.8a5 5 0 0 1-2-2l.8-.7L10.3 7h-.8ZM13 5.5a4 4 0 0 1 3.5 3.5M13 8a1.8 1.8 0 0 1 1.3 1.3',
  share: 'M18 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 15a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.2 11.3l7.6-3.6M8.2 13.7l7.6 3.6',
  heart: 'M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.9-8.5 10.9Z',
  flag: 'M5 21V4M5 4.5h11l-1.8 3.7L16 12H5',
  calendar: 'M4 6.5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5ZM4 10h16M8.5 3v4M15.5 3v4M8 14h2M14 14h2M8 17.5h2M14 17.5h2',
  check: 'm4.5 12.5 5 5 10-11',
  'check-circle': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-9.3 2.5 2.6 4.5-5',
  x: 'M6 6l12 12M18 6 6 18',
  'chevron-left': 'm14.5 5-7 7 7 7',
  'chevron-right': 'm9.5 5 7 7-7 7',
  'chevron-down': 'm5 9.5 7 7 7-7',
  search: 'M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM21 21l-4.6-4.6',
  sliders: 'M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1M15 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2',
  verified: 'm12 2.5 2.4 2 3.1-.4 1 3 2.6 1.8-1.3 2.9 1.3 2.9-2.6 1.8-1 3-3.1-.4-2.4 2-2.4-2-3.1.4-1-3L3 15.7 4.3 12.8 3 9.9l2.6-1.8 1-3 3.1.4 2.3-2Zm-3 9 2.2 2.3 4.3-4.6',
  'arrow-right': 'M4 12h16M14 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9.5 7V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6',
  edit: 'M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 6.5l3 3',
  camera: 'M3 8.5a1 1 0 0 1 1-1h2.6l1.4-2.5h8l1.4 2.5H20a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5Zm9 8.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  video: 'M3 7.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9ZM15 10.5l6-3v9l-6-3v-3Z',
  play: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10 8.5l6 3.5-6 3.5v-7Z',
  star: 'm12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9L12 3.5Z',
  alert: 'M12 8.5v4.5M12 16.5h.01M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  link: 'M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5',
  grid: 'M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z',
  list: 'M4 6.5h16M4 12h16M4 17.5h16',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 3.5V9h-5.5',
  facebook: 'M14.5 21v-8h2.7l.5-3.2h-3.2V7.7c0-.9.3-1.6 1.7-1.6h1.7V3.2A22 22 0 0 0 15.4 3c-2.6 0-4.3 1.6-4.3 4.4v2.4H8.3V13h2.8v8h3.4Z',
  mail: 'M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm.5.5 8.5 6 8.5-6',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z',
  key: 'M15.5 10.5a4 4 0 1 0-3.9-5L3 14.1V18h4l1-1v-2h2v-2h2l1.6-1.6c.6.1 1.2.1 1.9.1ZM17 7h.01',
  users: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 20.5a6.5 6.5 0 0 1 13 0M16 5.2a3.8 3.8 0 0 1 0 7.3M17.5 14.5a5.5 5.5 0 0 1 4 5.3',
  tag: 'M3.5 11.3V4.5a1 1 0 0 1 1-1h6.8a1 1 0 0 1 .7.3l8.2 8.2a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0L3.8 12a1 1 0 0 1-.3-.7ZM8 9a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 8 9Z',
};

interface Props {
  name: IconName;
  className?: string;
  /** Solid glyphs (brand marks) need fill, not stroke. */
  filled?: boolean;
  strokeWidth?: number;
}

const FILLED_BY_DEFAULT: IconName[] = ['facebook'];

export function Icon({ name, className = 'w-5 h-5', filled = false, strokeWidth = 1.7 }: Props) {
  const solid = filled || FILLED_BY_DEFAULT.includes(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={solid ? 'currentColor' : 'none'}
      stroke={solid ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={P[name]} />
    </svg>
  );
}

/** The SK monogram — a roofline over the company initials. */
export function Logo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#C62244" />
      <path d="M10 26 24 13l14 13" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 25.5V36h20V25.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="21" y="29" width="6" height="7" rx="1" fill="#E9A23B" />
    </svg>
  );
}
