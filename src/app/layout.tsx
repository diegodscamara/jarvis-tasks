import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Jarvis Tasks',
  description: 'AI-powered task management with Linear-style interface',
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jarvis Tasks',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider defaultTheme="linear-purple">{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
