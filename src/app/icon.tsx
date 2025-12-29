import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 20,
                    background: '#0f172a', // slate-950 base color
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '8px', // Rounded corners for modern look
                    fontWeight: 800,
                    fontFamily: 'sans-serif',
                    border: '1px solid #334155' // slate-700 subtle border
                }}
            >
                R
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
