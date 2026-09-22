import type {
  Bhk, Furnishing, ListingStatus, PropertyType, Purpose, RoadAccess, WaterSource,
} from './types';

/**
 * Single source of truth for every colour-coded concept in the app.
 *
 * Each entry carries a Tailwind class trio so the same concept looks identical
 * on a card, on a filter chip, on the detail page and in the admin table.
 * Nothing in the UI should hard-code a colour for these — import from here.
 */
export interface Token {
  label: string;
  labelNe: string;
  /** Solid fill — used on photo overlays and primary badges. */
  solid: string;
  /** Soft tint — used on light backgrounds. */
  soft: string;
  /** Just the dot/bullet colour. */
  dot: string;
  icon?: string;
}

/* ---- Purpose: rent vs sale ---------------------------------------- */
export const PURPOSE: Record<Purpose, Token> = {
  rent: {
    label: 'For Rent', labelNe: 'भाडामा',
    solid: 'bg-navy-600 text-white',
    soft: 'bg-navy-100 text-navy-800 border-navy-200',
    dot: 'bg-navy-600',
  },
  sale: {
    label: 'For Sale', labelNe: 'बिक्रीमा',
    solid: 'bg-jade-600 text-white',
    soft: 'bg-jade-100 text-jade-800 border-jade-200',
    dot: 'bg-jade-600',
  },
};

/* ---- Property type ------------------------------------------------- */
export const PROPERTY_TYPE: Record<PropertyType, Token> = {
  house: {
    label: 'House', labelNe: 'घर',
    solid: 'bg-crimson-600 text-white',
    soft: 'bg-crimson-50 text-crimson-800 border-crimson-200',
    dot: 'bg-crimson-600', icon: 'house',
  },
  flat: {
    label: 'Flat / Apartment', labelNe: 'फ्ल्याट',
    solid: 'bg-navy-600 text-white',
    soft: 'bg-navy-50 text-navy-800 border-navy-200',
    dot: 'bg-navy-600', icon: 'building',
  },
  room: {
    label: 'Room', labelNe: 'कोठा',
    solid: 'bg-marigold-600 text-white',
    soft: 'bg-marigold-50 text-marigold-800 border-marigold-200',
    dot: 'bg-marigold-600', icon: 'door',
  },
  shutter: {
    label: 'Shutter / Shop', labelNe: 'सटर',
    solid: 'bg-brick-700 text-white',
    soft: 'bg-brick-100 text-brick-800 border-brick-300',
    dot: 'bg-brick-700', icon: 'shop',
  },
  office: {
    label: 'Office Space', labelNe: 'अफिस',
    solid: 'bg-jade-700 text-white',
    soft: 'bg-jade-50 text-jade-800 border-jade-200',
    dot: 'bg-jade-700', icon: 'briefcase',
  },
  land: {
    label: 'Land', labelNe: 'जग्गा',
    solid: 'bg-jade-600 text-white',
    soft: 'bg-jade-50 text-jade-800 border-jade-200',
    dot: 'bg-jade-600', icon: 'map',
  },
};

/* ---- Listing status ------------------------------------------------ */
export const STATUS: Record<ListingStatus | 'expiring', Token> = {
  active: {
    label: 'Available', labelNe: 'उपलब्ध',
    solid: 'bg-jade-600 text-white',
    soft: 'bg-jade-50 text-jade-800 border-jade-200',
    dot: 'bg-jade-500',
  },
  expiring: {
    label: 'Expiring soon', labelNe: 'सकिन लाग्यो',
    solid: 'bg-marigold-400 text-navy-950',
    soft: 'bg-marigold-50 text-marigold-800 border-marigold-200',
    dot: 'bg-marigold-400',
  },
  rented: {
    label: 'Rented out', labelNe: 'भाडामा लागिसक्यो',
    solid: 'bg-navy-900 text-white',
    soft: 'bg-navy-100 text-navy-700 border-navy-200',
    dot: 'bg-navy-700',
  },
  expired: {
    label: 'Expired', labelNe: 'म्याद सकियो',
    solid: 'bg-brick-600 text-white',
    soft: 'bg-brick-100 text-brick-700 border-brick-300',
    dot: 'bg-brick-500',
  },
};

/* ---- Furnishing ---------------------------------------------------- */
export const FURNISHING: Record<Furnishing, Token> = {
  unfurnished: {
    label: 'Unfurnished', labelNe: 'फर्निचर बिना',
    solid: 'bg-brick-600 text-white',
    soft: 'bg-brick-100 text-brick-800 border-brick-300', dot: 'bg-brick-500',
  },
  semi: {
    label: 'Semi-furnished', labelNe: 'आंशिक फर्निस्ड',
    solid: 'bg-marigold-500 text-white',
    soft: 'bg-marigold-50 text-marigold-800 border-marigold-200', dot: 'bg-marigold-500',
  },
  full: {
    label: 'Fully furnished', labelNe: 'पूर्ण फर्निस्ड',
    solid: 'bg-jade-600 text-white',
    soft: 'bg-jade-50 text-jade-800 border-jade-200', dot: 'bg-jade-600',
  },
};

export const WATER: Record<WaterSource, { label: string; labelNe: string }> = {
  municipal: { label: 'Municipal (Khanepani)', labelNe: 'खानेपानी' },
  boring:    { label: 'Boring / well', labelNe: 'बोरिङ' },
  both:      { label: 'Municipal + boring', labelNe: 'खानेपानी + बोरिङ' },
  tanker:    { label: 'Tanker supply', labelNe: 'ट्याङ्कर' },
};

export const ROAD: Record<RoadAccess, { label: string; labelNe: string }> = {
  blacktop: { label: 'Blacktopped road', labelNe: 'कालोपत्रे सडक' },
  gravel:   { label: 'Gravelled road', labelNe: 'ग्राभेल सडक' },
  soil:     { label: 'Earthen road', labelNe: 'माटोको बाटो' },
  alley:    { label: 'Alley / galli access', labelNe: 'गल्ली' },
};

export const BHK: { value: Bhk; label: string; labelNe: string }[] = [
  { value: 'rk', label: 'Room + Kitchen', labelNe: 'कोठा + भान्सा' },
  { value: '1',  label: '1 BHK', labelNe: '१ बेडरूम' },
  { value: '2',  label: '2 BHK', labelNe: '२ बेडरूम' },
  { value: '3',  label: '3 BHK', labelNe: '३ बेडरूम' },
  { value: '4',  label: '4 BHK', labelNe: '४ बेडरूम' },
  { value: '5+', label: '5+ BHK', labelNe: '५+ बेडरूम' },
];

/* ---- Amenities ----------------------------------------------------- */
export const AMENITIES: { key: string; label: string; labelNe: string; icon: string }[] = [
  { key: 'inverter',   label: 'Inverter / backup', labelNe: 'इन्भर्टर', icon: 'bolt' },
  { key: 'solar',      label: 'Solar water heater', labelNe: 'सोलार', icon: 'sun' },
  { key: 'lift',       label: 'Lift', labelNe: 'लिफ्ट', icon: 'lift' },
  { key: 'balcony',    label: 'Balcony', labelNe: 'बाल्कोनी', icon: 'balcony' },
  { key: 'terrace',    label: 'Terrace access', labelNe: 'कौसी', icon: 'terrace' },
  { key: 'garden',     label: 'Garden', labelNe: 'बगैंचा', icon: 'leaf' },
  { key: 'cctv',       label: 'CCTV', labelNe: 'सीसीटिभी', icon: 'cctv' },
  { key: 'gated',      label: 'Gated / guard', labelNe: 'गार्ड', icon: 'shield' },
  { key: 'internet',   label: 'Fibre-ready', labelNe: 'इन्टरनेट', icon: 'wifi' },
  { key: 'modular',    label: 'Modular kitchen', labelNe: 'मोड्युलर भान्सा', icon: 'kitchen' },
  { key: 'geyser',     label: 'Geyser', labelNe: 'गिजर', icon: 'drop' },
  { key: 'attached',   label: 'Attached bathroom', labelNe: 'एटच्ड बाथरूम', icon: 'bath' },
  { key: 'separate',   label: 'Separate entrance', labelNe: 'छुट्टै ढोका', icon: 'door' },
  { key: 'pets',       label: 'Pets allowed', labelNe: 'पाल्तु जनावर', icon: 'paw' },
];

export const AMENITY_MAP = Object.fromEntries(AMENITIES.map((a) => [a.key, a]));

/* ---- Kathmandu Valley geography ------------------------------------ */
export const CITIES: { name: string; nameNe: string; areas: string[] }[] = [
  {
    name: 'Kathmandu', nameNe: 'काठमाडौं',
    areas: [
      'Baluwatar', 'Baneshwor', 'Basundhara', 'Bouddha', 'Chabahil', 'Dhumbarahi',
      'Gongabu', 'Kalanki', 'Kalimati', 'Kirtipur', 'Maharajgunj', 'Naxal',
      'Samakhusi', 'Sinamangal', 'Swayambhu', 'Thamel', 'Tokha',
    ],
  },
  {
    name: 'Lalitpur', nameNe: 'ललितपुर',
    areas: [
      'Bhaisepati', 'Ekantakuna', 'Imadol', 'Jhamsikhel', 'Kupondole',
      'Lagankhel', 'Pulchowk', 'Sanepa', 'Satdobato',
    ],
  },
  {
    name: 'Bhaktapur', nameNe: 'भक्तपुर',
    areas: ['Balkot', 'Dudhpati', 'Jagati', 'Katunje', 'Sallaghari', 'Suryabinayak', 'Thimi'],
  },
];

export const ALL_AREAS = CITIES.flatMap((c) => c.areas).sort();

/** Areas people search most — shown as quick chips on the home page. */
export const POPULAR_AREAS = [
  'Baluwatar', 'Baneshwor', 'Jhamsikhel', 'Maharajgunj', 'Sanepa',
  'Chabahil', 'Bhaisepati', 'Thimi',
];

export const REPORT_REASONS = [
  'Already rented but still listed',
  'Wrong price or hidden charges',
  'Photos do not match the property',
  'Phone number does not work',
  'Duplicate listing',
  'Suspected scam / broker fee demanded',
  'Something else',
];

export const VISIT_SLOTS = [
  'Morning (8 AM – 11 AM)',
  'Midday (11 AM – 2 PM)',
  'Afternoon (2 PM – 5 PM)',
  'Evening (5 PM – 7 PM)',
];
