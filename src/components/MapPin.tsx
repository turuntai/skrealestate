import { useMemo } from 'react';
import type { Listing } from '../lib/types';
import { Icon } from './Icon';

/* Rough bounding box of the Kathmandu Valley, used to place the marker
   on the schematic below. */
const BOUNDS = { minLat: 27.60, maxLat: 27.79, minLng: 85.24, maxLng: 85.44 };

const project = (lat: number, lng: number) => ({
  x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100,
  y: (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100,
});

export const googleMapsHref = (l: Listing) =>
  `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`;

export const directionsHref = (l: Listing) =>
  `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`;

/**
 * A schematic locator rather than a live tile map: it renders instantly, costs
 * nothing, works offline and never leaks the visitor's IP to a tile provider.
 * The buttons below hand off to Google Maps for real navigation.
 */
export function MapPin({ listing: l }: { listing: Listing }) {
  const pos = useMemo(() => {
    const p = project(l.lat, l.lng);
    return { x: Math.min(92, Math.max(8, p.x)), y: Math.min(88, Math.max(12, p.y)) };
  }, [l.lat, l.lng]);

  return (
    <div className="panel overflow-hidden">
      <div className="relative aspect-[16/9] sm:aspect-[2/1] bg-[#EDF0E9]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* built-up wash */}
          <rect width="100" height="100" fill="#EFF1EA" />
          <ellipse cx="50" cy="52" rx="42" ry="34" fill="#E4E8DC" />
          {/* ring road */}
          <ellipse cx="50" cy="52" rx="27" ry="21" fill="none" stroke="#C9CFBE" strokeWidth="2.2" />
          {/* the Bagmati, running south-west */}
          <path d="M16 20 Q38 42 44 58 Q50 76 78 92" fill="none" stroke="#A8C8DE" strokeWidth="3" strokeLinecap="round" />
          {/* arterial roads */}
          <path d="M0 52 H100M50 0 V100M14 14 L86 86M86 14 L14 86" stroke="#D8DCCC" strokeWidth="1.4" />
          {/* local grid */}
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} stroke="#E1E5D6" strokeWidth=".7">
              <line x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
              <line x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
            </g>
          ))}
          {/* green space */}
          <circle cx="22" cy="72" r="7" fill="#D4E0C6" />
          <circle cx="78" cy="26" r="5.5" fill="#D4E0C6" />
        </svg>

        {/* approximate-radius halo, then the pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson-600/14 border-2 border-crimson-600/30"
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: '22%', paddingBottom: '22%' }}
        />
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <div className="relative flex flex-col items-center">
            <span className="w-9 h-9 rounded-full bg-crimson-600 text-white grid place-items-center shadow-lift ring-2 ring-white">
              <Icon name="pin" className="w-5 h-5" strokeWidth={2} />
            </span>
            <span className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-crimson-600 -mt-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2 left-2 badge bg-white/92 text-navy-800 backdrop-blur shadow-sm">
          Approximate location
        </div>
        <div className="absolute top-2 right-2 badge bg-white/92 text-brick-700 backdrop-blur shadow-sm font-mono !tracking-normal">
          {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-2.5">
          <Icon name="pin" className="w-4.5 h-4.5 text-crimson-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-semibold text-[15px]">{l.area}, {l.city}</div>
            <div className="text-[14px] text-brick-700 mt-0.5 leading-snug">{l.landmark}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <a href={googleMapsHref(l)} target="_blank" rel="noreferrer noopener" className="btn-outline btn-sm">
            <Icon name="map" className="w-4 h-4" /> Open in Google Maps
          </a>
          <a href={directionsHref(l)} target="_blank" rel="noreferrer noopener" className="btn-outline btn-sm">
            <Icon name="arrow-right" className="w-4 h-4" /> Get directions
          </a>
        </div>
        <p className="hint">
          The pin shows the neighbourhood, not the exact door. The owner shares the precise
          address when a visit is confirmed.
        </p>
      </div>
    </div>
  );
}
