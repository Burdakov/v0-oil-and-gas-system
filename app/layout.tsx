import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "\u0422\u043e\u043f\u0420\u0435\u0439\u0442 \u2014 \u0441\u0438\u0441\u0442\u0435\u043c\u0430 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u043e\u0439",
  description: "\u0421\u0438\u0441\u0442\u0435\u043c\u0430 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u0437\u0430\u0432\u043e\u0434\u043d\u0435\u043d\u0438\u0435\u043c \u0438 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u043e\u0439 \u043d\u0435\u0444\u0442\u044f\u043d\u044b\u0445 \u0438 \u0433\u0430\u0437\u043e\u0432\u044b\u0445 \u0441\u043a\u0432\u0430\u0436\u0438\u043d",
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
