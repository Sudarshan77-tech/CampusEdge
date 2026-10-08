import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
