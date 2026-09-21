import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ebe1d6',
        }}
      >
        <span
          style={{
            fontFamily: 'serif',
            fontSize: 66,
            fontWeight: 400,
            color: '#3d2e26',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          F&amp;B
        </span>
      </div>
    ),
    { ...size },
  );
}
