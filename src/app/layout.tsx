import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { GlobalSiteChrome } from '@/components/layout/GlobalSiteChrome';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '600'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'VIBEWALLseyy — Premium wall posters & custom prints', template: '%s · VIBEWALLseyy' },
  description:
    'Premium wall posters designed for your room, your mood and your story. Shop curated prints or create your own — shipped across India.',
  openGraph: {
    title: 'VIBEWALLseyy — Premium wall posters & custom prints',
    description: 'Premium posters designed for your room, your mood and your story.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F9F3' },
    { media: '(prefers-color-scheme: dark)', color: '#05070D' },
  ],
};

// Runs before hydration to apply the stored theme — prevents any flash of the
// wrong atmosphere. Deliberately tiny and inline.
const themeNoFlashScript = `
(function(){try{var t=localStorage.getItem('vibewallsey_theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="font-sans">
        <Providers>
          <GlobalSiteChrome>{children}</GlobalSiteChrome>
        </Providers>
      </body>
    </html>
  );
}
