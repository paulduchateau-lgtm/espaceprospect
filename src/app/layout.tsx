import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MetLife - Espace Prospect Intelligent',
  description:
    'Découvrez comment MetLife peut protéger votre activité de travailleur non salarié.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans text-foreground bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
