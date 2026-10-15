import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

type OgImageProps = {
  title: string;
  summary: string;
  tags?: string[];
};

const ZINC_100 = '#f4f4f5';
const ZINC_400 = '#a1a1aa';
const ZINC_500 = '#71717a';
const ZINC_700 = '#3f3f46';
const EMERALD_400 = '#34d399';

/**
 * Shared renderer for the file-based opengraph-image routes. Uses the site
 * palette (zinc dark background, emerald accent) so the cards look like
 * screenshots of the site itself.
 */
export function createOgImage({ title, summary, tags }: OgImageProps): ImageResponse {
  const safeTitle = ellipsize(title, 72);
  const safeSummary = ellipsize(summary, 170);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              color: EMERALD_400,
              fontSize: 26,
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            Bruno Oliveira
          </div>
          <div style={{ display: 'flex', color: ZINC_500, fontSize: 24 }}>
            portfolio.bsoapp.net
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 72, height: 8, background: EMERALD_400 }} />
          <div
            style={{
              display: 'flex',
              marginTop: 32,
              color: ZINC_100,
              fontSize: safeTitle.length > 40 ? 54 : 66,
              lineHeight: 1.15,
            }}
          >
            {safeTitle}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              color: ZINC_400,
              fontSize: 29,
              lineHeight: 1.5,
            }}
          >
            {safeSummary}
          </div>
        </div>

        {tags && tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {tags.slice(0, 8).map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  padding: '8px 22px',
                  border: `1px solid ${ZINC_700}`,
                  borderRadius: 999,
                  color: ZINC_100,
                  fontSize: 24,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ),
    OG_SIZE,
  );
}

function ellipsize(value: string, limit: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();

  if (clean.length <= limit) {
    return clean;
  }

  return `${clean.slice(0, limit).trimEnd()}…`;
}
