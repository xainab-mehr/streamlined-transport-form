import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CryoFuture - Book Your Transport',
  description: 'Complete your CryoFuture transportation booking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
