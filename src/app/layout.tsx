import type { Metadata, Viewport } from 'next';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'The White Wolf — A Dark Fantasy Survival',
  description: 'Steel for the beasts. Courage for the darkness. An atmospheric, single-player fantasy survival roguelite. Play free in your browser.',
  applicationName: 'The White Wolf',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'White Wolf' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  userScalable: false, viewportFit: 'cover', themeColor: '#0b100f',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
