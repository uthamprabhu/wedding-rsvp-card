import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Farzeen & Bilal - Wedding Invitation';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ebe1d6',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(212, 165, 116, 0.15), transparent 50%), radial-gradient(circle at 75% 75%, rgba(195, 161, 108, 0.1), transparent 50%)',
          position: 'relative',
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            right: '40px',
            bottom: '40px',
            border: '2px solid rgba(166, 129, 78, 0.3)',
            borderRadius: '8px',
            display: 'flex',
          }}
        />
        
        {/* Inner border */}
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: '52px',
            right: '52px',
            bottom: '52px',
            border: '1px solid rgba(191, 152, 94, 0.25)',
            borderRadius: '6px',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 100px',
          }}
        >
          {/* Top ornament */}
          <div
            style={{
              fontSize: '48px',
              color: '#a6814e',
              marginBottom: '32px',
              display: 'flex',
            }}
          >
            ✦
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '24px',
              color: '#a6814e',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              marginBottom: '24px',
              display: 'flex',
            }}
          >
            You Are Invited
          </div>

          {/* Names */}
          <div
            style={{
              fontSize: '96px',
              fontWeight: '400',
              color: '#433b34',
              lineHeight: '0.95',
              marginBottom: '16px',
              display: 'flex',
              fontFamily: 'serif',
            }}
          >
            Farzeen
          </div>
          
          <div
            style={{
              fontSize: '64px',
              color: '#c3a16c',
              fontStyle: 'italic',
              marginBottom: '16px',
              display: 'flex',
              fontFamily: 'serif',
            }}
          >
            &
          </div>

          <div
            style={{
              fontSize: '96px',
              fontWeight: '400',
              color: '#433b34',
              lineHeight: '0.95',
              marginBottom: '36px',
              display: 'flex',
              fontFamily: 'serif',
            }}
          >
            Bilal
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '28px',
              color: '#76695d',
              lineHeight: '1.6',
              maxWidth: '800px',
              marginBottom: '32px',
              display: 'flex',
              fontFamily: 'serif',
            }}
          >
            Join us for this blessed occasion
          </div>

          {/* Bottom ornament */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              color: '#a6814e',
            }}
          >
            <div style={{ width: '60px', height: '1px', background: 'rgba(166, 129, 78, 0.4)', display: 'flex' }} />
            <div style={{ fontSize: '32px', display: 'flex' }}>✧</div>
            <div style={{ width: '60px', height: '1px', background: 'rgba(166, 129, 78, 0.4)', display: 'flex' }} />
          </div>
        </div>

        {/* Website URL at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            fontSize: '20px',
            color: '#93867a',
            letterSpacing: '0.1em',
            display: 'flex',
            fontFamily: 'serif',
          }}
        >
          farzeen-bilal.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
