import type { Metadata } from 'next';
import './globals.css';
import { ChunkLoadHandler } from '@/components/ChunkLoadHandler';
import { DevApiHealthBanner } from '@/components/DevApiHealthBanner';

export const metadata: Metadata = {
  title: 'CampusEdge — College Placement Intelligence Engine',
  description:
    'AI-assisted, college-specific placement preparation and intelligence platform for engineering colleges.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <DevApiHealthBanner />
        <ChunkLoadHandler />
        {children}
      </body>
    </html>
  );
}
