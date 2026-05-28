import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prode Digital Tecnoprop · Mundial 2026',
  description: 'Pronosticá el Mundial 2026, competí en rankings y ganá premios. El prode oficial de Tecnoprop.',
  keywords: ['prode', 'mundial 2026', 'pronosticos', 'futbol', 'tecnoprop', 'tucuman'],
  authors: [{ name: 'Tecnoprop', url: 'https://tecnoprop.ar' }],
  openGraph: {
    title: 'Prode Digital Tecnoprop · Mundial 2026',
    description: 'No mires el Mundial. Jugalo.',
    url: 'https://prode.tecnoprop.ar',
    siteName: 'Prode Tecnoprop 2026',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prode Tecnoprop · Mundial 2026',
    description: 'No mires el Mundial. Jugalo.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="ambient-bg min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0d1a2e',
              color: '#ffffff',
              border: '1px solid rgba(54,169,224,0.3)',
              borderRadius: '14px',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: {
              iconTheme: { primary: '#36A9E0', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
      </body>
    </html>
  )
}
