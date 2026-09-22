import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { PHOTO_FALLBACK } from '../lib/photos';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & {
  src: string;
  alt: string;
};

/**
 * An `<img>` that degrades instead of breaking.
 *
 * Listing photos come from a third-party random-image endpoint, so a request
 * can fail for reasons we do not control. When one does, this swaps in the
 * local placeholder rather than leaving a broken-image icon on the page.
 */
export function Photo({ src, alt, className, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  // A new src deserves a fresh attempt — otherwise one failure would stick
  // to the element even after it is reused for a different photo.
  useEffect(() => setFailed(false), [src]);

  return (
    <img
      src={failed ? PHOTO_FALLBACK : src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
