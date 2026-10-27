import { getNonce, safeJsonLd } from '@/lib/seo';

/** schema.org JSON-LD bloki — CSP nonce bilan va `</script>` injeksiyasidan himoyalangan. */
export default async function JsonLd({ data }: { data: unknown }) {
  const nonce = await getNonce();
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
