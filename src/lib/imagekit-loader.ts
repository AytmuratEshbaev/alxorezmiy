import { transformImage } from './imagekit';

/**
 * Custom next/image loader. Keeps ImageKit transformations working (resize/format/quality
 * happen on ImageKit's CDN) while letting next/image build a responsive srcset — it calls
 * this loader once per candidate width. Local paths get a `w` param (satisfies next/image); other remote hosts are returned untouched.
 */
export default function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.includes('ik.imagekit.io')) {
    return transformImage(src, { width, quality: quality ?? 'auto' });
  }
  if (src.includes('images.unsplash.com')) {
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}w=${width}&q=${quality ?? 75}&auto=format`;
  }
  if (src.startsWith('/')) {
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
  }
  return src;
}
