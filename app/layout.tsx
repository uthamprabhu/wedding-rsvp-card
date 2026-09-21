import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import 'lenis/dist/lenis.css';
import SmoothScroll from '@/components/SmoothScroll';
import StructuredData from '@/components/StructuredData';
import AudioProvider from '@/components/AudioProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://farzeen-bilal.vercel.app'),
  title: {
    default: 'Farzeen & Bilal - Wedding Invitation',
    template: '%s | Farzeen & Bilal'
  },
  description: 'You are cordially invited to celebrate the wedding of Farzeen and Bilal. Join us for this blessed occasion filled with love, joy, and cherished moments.',
  keywords: ['wedding', 'invitation', 'Farzeen', 'Bilal', 'wedding invitation', 'marriage', 'celebration', 'RSVP'],
  authors: [{ name: 'Farzeen & Bilal' }],
  creator: 'Farzeen & Bilal',
  publisher: 'Farzeen & Bilal',
  
  // Open Graph metadata for Facebook, WhatsApp, LinkedIn
  // og:image is auto-generated from app/opengraph-image.tsx — no manual
  // image declaration needed here; adding one would override the tsx file.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://farzeen-bilal.vercel.app',
    siteName: 'Farzeen & Bilal Wedding',
    title: 'Farzeen & Bilal - Wedding Invitation',
    description: 'You are cordially invited to celebrate the wedding of Farzeen and Bilal. Join us for this blessed occasion filled with love, joy, and cherished moments.',
  },
  
  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Farzeen & Bilal - Wedding Invitation',
    description: 'You are cordially invited to celebrate the wedding of Farzeen and Bilal. Join us for this blessed occasion.',
    creator: '@farzbilalwedding',
  },
  
  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Icons are generated from app/icon.tsx and app/apple-icon.tsx —
  // Next.js App Router auto-wires them, no manual declaration needed.
  
  // Verification (add your verification codes here if needed)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  
  // Other metadata
  category: 'event',
  classification: 'Wedding Invitation',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <head>
        {/* Preload Brittany Signature so it arrives before the couple names
            paint — reduces the fallback-to-script swap flash on first visit. */}
        <link
          rel="preload"
          href="/fonts/BrittanySignature.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Brittany Signature is self-hosted in public/fonts/ — no CDN
            dependency, no build-time @import parsing issues. */}
        <StructuredData />
      </head>
      <body 
        className="min-h-full" 
        suppressHydrationWarning
      >
        <SmoothScroll />
        {children}
        <AudioProvider />
      </body>
    </html>
  );
}
