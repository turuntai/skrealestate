import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { KEYS, read, write } from './storage';

export type Lang = 'en' | 'ne';

/**
 * Deliberately small. Only the chrome and the high-traffic labels are
 * translated — listing copy stays in whatever language the owner wrote it.
 */
const STRINGS = {
  'nav.rent': { en: 'Rent', ne: 'भाडामा' },
  'nav.buy': { en: 'Buy', ne: 'किन्न' },
  'nav.post': { en: 'Post a property', ne: 'सम्पत्ति राख्नुहोस्' },
  'nav.saved': { en: 'Saved', ne: 'सेभ गरिएको' },
  'nav.about': { en: 'About', ne: 'हाम्रोबारे' },
  'nav.contact': { en: 'Contact', ne: 'सम्पर्क' },
  'nav.admin': { en: 'Admin', ne: 'एडमिन' },

  'search.placeholder': { en: 'Search area, landmark or "2BHK Baluwatar"', ne: 'क्षेत्र वा ल्यान्डमार्क खोज्नुहोस्' },
  'search.button': { en: 'Search', ne: 'खोज्नुहोस्' },
  'search.filters': { en: 'Filters', ne: 'फिल्टर' },
  'search.clear': { en: 'Clear all', ne: 'सबै हटाउनुहोस्' },
  'search.results': { en: 'properties', ne: 'सम्पत्तिहरू' },
  'search.none': { en: 'No properties match these filters', ne: 'कुनै सम्पत्ति भेटिएन' },

  'action.call': { en: 'Call', ne: 'फोन गर्नुहोस्' },
  'action.whatsapp': { en: 'WhatsApp', ne: 'ह्वाट्सएप' },
  'action.viber': { en: 'Viber', ne: 'भाइबर' },
  'action.visit': { en: 'Request a visit', ne: 'हेर्न जाने अनुरोध' },
  'action.save': { en: 'Save', ne: 'सेभ' },
  'action.saved': { en: 'Saved', ne: 'सेभ भयो' },
  'action.share': { en: 'Share', ne: 'सेयर' },
  'action.report': { en: 'Report', ne: 'रिपोर्ट' },

  'detail.price': { en: 'Price', ne: 'मूल्य' },
  'detail.deposit': { en: 'Deposit', ne: 'धरौटी' },
  'detail.monthly': { en: 'Monthly rent', ne: 'मासिक भाडा' },
  'detail.service': { en: 'Service charge', ne: 'सेवा शुल्क' },
  'detail.water': { en: 'Water charge', ne: 'पानी शुल्क' },
  'detail.location': { en: 'Location', ne: 'स्थान' },
  'detail.basics': { en: 'The basics', ne: 'आधारभूत कुरा' },
  'detail.amenities': { en: 'Amenities', ne: 'सुविधाहरू' },
  'detail.availability': { en: 'Availability', ne: 'उपलब्धता' },
  'detail.about': { en: 'About this property', ne: 'यस सम्पत्तिबारे' },
  'detail.similar': { en: 'Similar properties', ne: 'मिल्दा सम्पत्तिहरू' },
  'detail.posted': { en: 'Posted', ne: 'राखिएको' },
  'detail.updated': { en: 'Updated', ne: 'अपडेट' },

  'basics.parking': { en: 'Parking', ne: 'पार्किङ' },
  'basics.road': { en: 'Road access', ne: 'बाटो' },
  'basics.furnishing': { en: 'Furnishing', ne: 'फर्निसिङ' },
  'basics.bathroom': { en: 'Bathrooms', ne: 'बाथरूम' },
  'basics.floor': { en: 'Floor', ne: 'तल्ला' },
  'basics.area': { en: 'Built-up area', ne: 'क्षेत्रफल' },
  'basics.land': { en: 'Land area', ne: 'जग्गा' },
  'basics.facing': { en: 'Facing', ne: 'मोहडा' },
} as const;

export type StringKey = keyof typeof STRINGS;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}

const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => read<Lang>(KEYS.lang, 'en'));

  useEffect(() => {
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write(KEYS.lang, l);
  }, []);

  const t = useCallback((key: StringKey) => STRINGS[key]?.[lang] ?? String(key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}

/** Pick the right side of a bilingual pair without another hook call. */
export const pickLang = (lang: Lang, en: string, ne?: string) =>
  lang === 'ne' && ne ? ne : en;
