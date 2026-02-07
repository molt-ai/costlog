import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CostLog — AI API Spend Tracker',
  description: 'Track your OpenAI and Anthropic API costs in one dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#111] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
