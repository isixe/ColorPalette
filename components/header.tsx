import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GithubIcon } from './icons/github-icon'

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center text-xl font-bold">
          Color Palette
        </Link>
        <div className="flex items-center gap-4">
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
