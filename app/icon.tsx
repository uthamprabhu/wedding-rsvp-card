import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ebe1d6',
          borderRadius: 128,
        }}
      >
        <span
          style={{
            fontFamily: 'serif',
            fontSize: 188,
            fontWeight: 400,
            color: '#3d2e26',
            letterSpacing: '-6px',
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
