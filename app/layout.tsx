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
  metadataBase: new URL('https://commerce-ops-platform.abyys9114.chatgpt.site'),
  title: 'Commerce Ops — 운영 통합 플랫폼',
  description: '주문, 재고, 배송, 정산을 한곳에서 관리하는 커머스 운영 통합 플랫폼',
  openGraph: {
    title: 'Commerce Ops — 운영 통합 플랫폼',
    description: '주문, 재고, 배송, 정산을 한곳에서 관리하는 커머스 운영 통합 플랫폼',
    images: [{ url: '/og.png', width: 1734, height: 907, alt: 'Commerce Ops 운영 통합 플랫폼' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commerce Ops — 운영 통합 플랫폼',
    description: '주문, 재고, 배송, 정산을 한곳에서 관리하는 커머스 운영 통합 플랫폼',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
