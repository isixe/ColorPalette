import Client from '@/components/layout/client'
import '@/styles/global.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const host = headersList.get('host') || 'localhost:3000'
  const url = `${protocol}://${host}`

  return {
    title: 'Color Palette',
    keywords:
      'color, colors, color palette, color picker, color generator, color palette generator, color tool',
    description:
      'ColorPalette is a tool designed to help developers and designers create, manage, and use color palettes efficiently.',
    alternates: {
      canonical: url
    },
    openGraph: {
      title: 'Color Palette',
      description:
        'ColorPalette is a tool designed to help developers and designers create, manage, and use color palettes efficiently.',
      url,
      siteName: 'Color Palette',
      locale: 'en'
    }
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body>
        <Client>{children}</Client>
      </body>
    </html>
  )
}
