import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/global.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Color Palette',
  description: 'Color Palette Tools'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body>
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
