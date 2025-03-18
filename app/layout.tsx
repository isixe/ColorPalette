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
        {children}
        <Toaster />
      </body>
    </html>
  )
}
