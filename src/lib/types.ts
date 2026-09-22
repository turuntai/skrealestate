export type Purpose = 'rent' | 'sale';

export type PropertyType =
  | 'house' | 'flat' | 'room' | 'shutter' | 'office' | 'land';

/** Bedroom count. `studio` and `rk` (room-kitchen) are common in Kathmandu. */
export type Bhk = 'rk' | '1' | '2' | '3' | '4' | '5+';

export type Furnishing = 'unfurnished' | 'semi' | 'full';

export type WaterSource = 'municipal' | 'boring' | 'both' | 'tanker';

export type RoadAccess = 'blacktop' | 'gravel' | 'soil' | 'alley';

export type Facing = 'east' | 'west' | 'north' | 'south' | 'north-east' | 'south-east' | 'north-west' | 'south-west';

export type ListingStatus = 'active' | 'rented' | 'expired';

export interface Media {
  /** Path under /media, or a data: URL for admin-uploaded photos. */
  src: string;
  alt: string;
}

export interface Listing {
  id: string;
  /** URL-safe slug; the share link is /property/{slug}. */
  slug: string;
  title: string;
  titleNe?: string;
  purpose: Purpose;
  type: PropertyType;

  /* --- media ------------------------------------------------------- */
  photos: Media[];
  /** Optional walkthrough. An embed URL, or a data: URL for an upload. */
  video?: string;

  /* --- price (all NPR) --------------------------------------------- */
  price: number;                 // monthly rent, or total price when purpose = 'sale'
  deposit?: number;              // advance, usually 1-3 months
  serviceCharge?: number;        // monthly maintenance / sewa sulka
  waterCharge?: number;
  electricityNote?: string;      // e.g. "Meter reading, Rs 15/unit"
  negotiable: boolean;
  priceOnRequest?: boolean;

  /* --- location ---------------------------------------------------- */
  area: string;                  // Baluwatar, Kupondole ...
  city: string;                  // Kathmandu, Lalitpur, Bhaktapur
  landmark: string;              // "2 min from Bhatbhateni"
  lat: number;
  lng: number;

  /* --- structure --------------------------------------------------- */
  bhk?: Bhk;
  floor?: string;                // "2nd floor of 4"
  bathrooms: number;
  builtUpArea?: number;          // sq ft
  landArea?: string;             // "4 aana 2 paisa"
  facing?: Facing;

  /* --- basics ------------------------------------------------------ */
  water: WaterSource;
  parking: { bike: number; car: number };
  roadAccess: RoadAccess;
  roadWidthFt?: number;
  furnishing: Furnishing;
  amenities: string[];           // keys from AMENITIES

  /* --- availability ------------------------------------------------ */
  availableFrom: string;         // ISO date
  postedAt: string;              // ISO datetime
  updatedAt: string;             // ISO datetime
  /** Days the listing stays live before it auto-expires. */
  durationDays: number;
  status: ListingStatus;

  /* --- contact ----------------------------------------------------- */
  contactName: string;
  phone: string;                 // 98XXXXXXXX
  whatsapp?: string;
  viber?: string;

  description: string;
  preferredTenant?: string;      // "Family only", "Bachelors welcome"
  verified: boolean;
  featured: boolean;
  views: number;
}

/** A visit request captured by the form (kept client-side for now). */
export interface VisitRequest {
  id: string;
  listingId: string;
  name: string;
  phone: string;
  date: string;
  slot: string;
  note?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  listingId: string;
  reason: string;
  detail?: string;
  createdAt: string;
}

export interface Filters {
  q: string;
  purpose: Purpose | 'all';
  cities: string[];
  areas: string[];
  types: PropertyType[];
  bhk: Bhk[];
  min: number | null;
  max: number | null;
  furnishing: Furnishing[];
  amenities: string[];
  parking: boolean;
  verifiedOnly: boolean;
  includeRented: boolean;
  sort: SortKey;
}

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'popular';
