'use client'

import { Button } from '@/components/ui/button'
import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { GithubIcon } from '../icons/github-icon'

export default function Header() {
  const [lang, setLang] = useState<string>('en')
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored) setLang(stored)
  }, [])

  const handleLangChange = (value: string) => {
    setLang(value as 'zh' | 'en')
    localStorage.setItem('lang', value)
    setLangOpen(false)
    location.reload()
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image
              src="/favicon.ico"
              alt="Color Palette"
              fill
              className="object-contain"
            />
          </div>
          <span>Color Palette</span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-5 w-5" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-24 rounded-lg border bg-popover p-1 shadow-lg">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => handleLangChange(l.value)}
                    className={cn(
                      'w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                      lang === l.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="https://github.com/isixe/ColorPalette"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <GithubIcon className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
