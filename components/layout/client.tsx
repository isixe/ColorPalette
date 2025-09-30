'use client'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'
import { DEFAULT_LANGUAGE, LanguageContext } from '@/lib/i18n'
import React, { useEffect, useState } from 'react'

export default function Client({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE)
  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored === 'zh' || stored === 'en') setLang(stored)
  }, [])
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <Header />
      {children}
      <Footer />
      <Toaster />
    </LanguageContext.Provider>
  )
}
