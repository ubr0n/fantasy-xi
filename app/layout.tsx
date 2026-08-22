import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import AppBackground from '@/components/AppBackground';

export const metadata: Metadata = {
  title: 'FPL Live — Fantasy Premier League Dashboard',
  description: 'Track live FPL points, league standings, and team stats in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AppBackground />
          <Navbar />
          <main className="relative z-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
