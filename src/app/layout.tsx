import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Utsav Copilot (उत्सव) — Living Event Plan for Indian Celebrations',
  description:
    'A living event plan for Indian family celebrations. Mathematical budget splits, critical-path timelines, and smart disruption replanning with zero guesswork.',
  keywords: [
    'Indian wedding planner',
    'celebration planner',
    'event budget calculator',
    'anniversary planning',
    'event copilot',
    'living event plan',
  ],
  authors: [{ name: 'Utsav Copilot Team' }],
  openGraph: {
    title: 'Utsav Copilot — Living Event Plan for Indian Celebrations',
    description:
      'A living event plan for Indian family celebrations. Budget, timeline, vendor comparison, and living replan engine.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
