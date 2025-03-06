import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 360,
          background: '#2563eb',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '22%',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ marginTop: '-20px' }}>PS</div>
        <div style={{ fontSize: '72px', marginTop: '20px' }}>Pocket Score</div>
      </div>
    ),
    {
      ...size,
    }
  )
}

