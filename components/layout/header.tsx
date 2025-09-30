'use client'
import { Button } from '@/components/ui/button'
import { LANGUAGES } from '@/lib/i18n'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { GithubIcon } from '../icons/github-icon'

export default function Header() {
  const [lang, setLang] = useState<string>('en')
  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored) setLang(stored)
  }, [])

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as 'zh' | 'en')
    localStorage.setItem('lang', e.target.value)
    location.reload()
  }
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center text-xl font-bold">
          Color Palette
        </Link>
        <div className="flex items-center gap-4">
          <select
            value={lang}
            onChange={handleLangChange}
            className="rounded-md bg-white px-2 py-1 text-sm shadow focus:outline-none"
            style={{ minWidth: 80, border: 'none' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="https://github.com/isixe/ColorPalette"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <GithubIcon className="h-5 w-5" />
              <span className="sr-only md:not-sr-only md:inline-block">
                GitHub
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
