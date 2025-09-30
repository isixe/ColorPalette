'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { DEFAULT_LANGUAGE, getTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { randomColor } from '@/utils/colorGenerator'
import { handleFileDrop, handleFileUpload } from '@/utils/fileUtils'
import { extractColors } from '@/utils/imageColorExtractor'
import Color from 'color'
import colorthief from 'colorthief'
import { Check, Copy, Palette, Pipette, RefreshCw, Upload } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type ColorMode = 'random' | 'image' | 'eyedropper'

function useClipboard() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: getTranslation('copied'),
      description: text
    })
  }, [])
  return { copied, copy }
}

function drawImageToCanvas(img: HTMLImageElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

function getColorFromCanvas(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): string | null {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const pixel = ctx.getImageData(x, y, 1, 1).data
  return Color.rgb(pixel[0], pixel[1], pixel[2]).hex()
}

export default function Page() {
  const [mode, setMode] = useState<ColorMode>('random')
  const [lang, setLang] = useState(DEFAULT_LANGUAGE)

  const [image, setImage] = useState<string | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState(5)
  const [quality, setQuality] = useState(10)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const eyedropperImgRef = useRef<HTMLImageElement>(null)
  const colorThiefRef = useRef<colorthief>(null)
  const { copied, copy } = useClipboard()

  const handleRandom = useCallback(() => {
    const arr = randomColor(colorCount)
    setColors(arr)
    setSelected(arr[0] || null)
  }, [colorCount])

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored === 'zh' || stored === 'en') setLang(stored)
  }, [])

  useEffect(() => {
    if (mode === 'random' && colors.length === 0) {
      handleRandom()
    }
  }, [mode, colorCount])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        toast({
          title: getTranslation('invalidFileType'),
          description: getTranslation('pleaseUploadImage'),
          variant: 'destructive'
        })
        return
      }
      handleFileUpload(
        file,
        (url) => setImage(url),
        () =>
          toast({
            title: getTranslation('uploadFailed'),
            description: getTranslation('pleaseRetry'),
            variant: 'destructive'
          })
      )
    },
    []
  )

  const handleDropImage = useCallback((e: React.DragEvent) => {
    handleFileDrop(e, (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: getTranslation('invalidFileType'),
          description: getTranslation('pleaseUploadImage'),
          variant: 'destructive'
        })
        return
      }
      handleFileUpload(
        file,
        (url) => setImage(url),
        () =>
          toast({
            title: getTranslation('uploadFailed'),
            description: getTranslation('pleaseRetry'),
            variant: 'destructive'
          })
      )
    })
  }, [])

  const handleExtractColors = useCallback(async () => {
    if (!imageRef.current || !colorThiefRef.current) return
    try {
      const arr = await extractColors(imageRef.current, colorCount, quality)
      setColors(arr)
      setSelected(arr[0] || null)
    } catch {
      toast({
        title: getTranslation('extractFailed'),
        description: getTranslation('tryOtherImage'),
        variant: 'destructive'
      })
    }
  }, [colorCount, quality])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return
      const hex = getColorFromCanvas(e, canvasRef.current)
      if (!hex) return
      if (mode === 'eyedropper') {
        setColors([hex])
      } else if (!colors.includes(hex)) {
        setColors([hex, ...colors.slice(0, 9)])
      }
      setSelected(hex)
    },
    [mode, colors]
  )

  const handleTabChange = useCallback((v: string) => {
    setColors([])
    setMode(v as ColorMode)
  }, [])

  useEffect(() => {
    colorThiefRef.current = new colorthief()
    if (image && imageRef.current && imageRef.current.complete) {
      handleExtractColors()
    }
  }, [image, colorCount, quality, handleExtractColors])

  useEffect(() => {
    if (
      mode === 'eyedropper' &&
      image &&
      eyedropperImgRef.current &&
      canvasRef.current
    ) {
      const img = eyedropperImgRef.current
      const canvas = canvasRef.current
      if (img.complete) {
        drawImageToCanvas(img, canvas)
      } else {
        img.onload = () => drawImageToCanvas(img, canvas)
      }
    }
  }, [mode, image])

  interface ColorSliderProps {
    value: number
    min: number
    max: number
    onChange: (v: number) => void
    label: string
  }
  const ColorSlider: React.FC<ColorSliderProps> = ({
    value,
    min,
    max,
    onChange,
    label
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">
        {label}: {value}
      </span>
      <div className="w-2/3">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={1}
          onValueChange={(v) => onChange(v[0])}
        />
      </div>
    </div>
  )

  interface ColorCardProps {
    colors: string[]
    selected: string | null
    setSelected: (c: string) => void
    mode: ColorMode
  }
  const ColorCard: React.FC<ColorCardProps> = ({
    colors,
    selected,
    setSelected,
    mode
  }) => {
    if (!colors.length) {
      let emptyText = ''
      if (mode === 'random') {
        emptyText = getTranslation('emptyRandom')
      } else if (mode === 'image') {
        emptyText = getTranslation('emptyImage')
      } else {
        emptyText = getTranslation('emptyEyedropper')
      }
      return (
        <div className="flex h-[200px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-muted/40 to-white text-muted-foreground shadow-inner">
          <Palette className="mb-2 h-12 w-12" />
          <p className="text-base font-medium">{emptyText}</p>
        </div>
      )
    }
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {colors.map((c, i) => (
            <div
              key={i}
              className={cn(
                'aspect-square cursor-pointer rounded-xl transition-all duration-200',
                selected === c
                  ? 'shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)]'
                  : 'shadow-md hover:shadow-xl'
              )}
              style={{ backgroundColor: c }}
              onClick={() => setSelected(c)}
            >
              <span className="sr-only">{c}</span>
            </div>
          ))}
        </div>
        {selected && <ColorDetail color={selected} />}
      </div>
    )
  }

  interface ColorDetailProps {
    color: string
  }
  const ColorDetail: React.FC<ColorDetailProps> = ({ color }) => {
    const { copied, copy } = useClipboard()
    let rgb = '',
      hsl = ''
    try {
      const c = Color(color)
      const r = c.rgb().object(),
        h = c.hsl().object()
      rgb = `rgb(${Math.round(r.r)}, ${Math.round(r.g)}, ${Math.round(r.b)})`
      hsl = `hsl(${Math.round(h.h)}, ${Math.round(h.s)}%, ${Math.round(h.l)}%)`
    } catch {}
    return (
      <div className="space-y-4">
        <Separator />
        <Card className="border-2 border-primary/30 bg-white/80 shadow-lg">
          <CardContent className="flex flex-col gap-4 py-6">
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-lg border shadow"
                style={{ backgroundColor: color }}
              />
              <span className="text-lg font-bold tracking-wide text-primary">
                {color.toUpperCase()}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(color.toUpperCase())}
                className="ml-auto"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {getTranslation('copy')}
              </Button>
            </div>
            <Tabs defaultValue="hex">
              <TabsList className="mb-2 grid w-full grid-cols-3">
                <TabsTrigger
                  value="hex"
                  className="rounded-[50px] transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  HEX
                </TabsTrigger>
                <TabsTrigger
                  value="rgb"
                  className="rounded-[50px] transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  RGB
                </TabsTrigger>
                <TabsTrigger
                  value="hsl"
                  className="rounded-[50px] transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  HSL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="hex" className="rounded-md bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <code className="font-mono text-base text-primary">
                    {color.toUpperCase()}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copy(color.toUpperCase())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="rgb" className="rounded-md bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <code className="font-mono text-base text-primary">
                    {rgb}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => copy(rgb)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="hsl" className="rounded-md bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <code className="font-mono text-base text-primary">
                    {hsl}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => copy(hsl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-10">
      <h1 className="mb-6 text-center text-3xl font-bold">
        {getTranslation('title')}
      </h1>
      <Tabs
        defaultValue="random"
        className="mb-6"
        onValueChange={handleTabChange}
      >
        <TabsList className="mx-auto grid w-full max-w-md grid-cols-3 rounded-[50px] p-1 shadow">
          <TabsTrigger
            value="random"
            className="rounded-[50px] transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {getTranslation('random')}
          </TabsTrigger>
          <TabsTrigger
            value="image"
            className="rounded-[50px] transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {getTranslation('image')}
          </TabsTrigger>
          <TabsTrigger
            value="eyedropper"
            className="rounded-[50px] transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            {getTranslation('eyedropper')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="random" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation('random')}</CardTitle>
              <CardDescription>{getTranslation('descRandom')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorSlider
                value={colorCount}
                min={3}
                max={10}
                onChange={setColorCount}
                label={getTranslation('colorCount')}
              />
              <Button onClick={handleRandom} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                {getTranslation('regenerate')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation('image')}</CardTitle>
              <CardDescription>{getTranslation('descImage')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted/50',
                  image ? 'border-primary' : 'border-muted'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropImage}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {image ? (
                  <div className="w-full">
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Uploaded"
                      className="mx-auto max-h-[200px] rounded-md object-contain"
                      crossOrigin="anonymous"
                      onLoad={handleExtractColors}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="mb-1 text-muted-foreground">
                      {getTranslation('dragTip')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTranslation('formatTip')}
                    </p>
                  </div>
                )}
              </div>
              {image && (
                <div className="space-y-4">
                  <ColorSlider
                    value={colorCount}
                    min={3}
                    max={10}
                    onChange={setColorCount}
                    label={getTranslation('colorCount')}
                  />
                  <ColorSlider
                    value={quality}
                    min={1}
                    max={20}
                    onChange={setQuality}
                    label={getTranslation('quality')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eyedropper" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation('eyedropper')}</CardTitle>
              <CardDescription>
                {getTranslation('descEyedropper')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted/50',
                  image ? 'border-primary' : 'border-muted'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropImage}
                onClick={
                  !image ? () => fileInputRef.current?.click() : undefined
                }
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {image ? (
                  <div className="w-full text-center">
                    <div className="relative inline-block">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className={cn(
                          'max-w-full cursor-crosshair rounded-md border'
                        )}
                      />
                      <img
                        ref={eyedropperImgRef}
                        src={image}
                        alt="Color Picker"
                        className="hidden"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {getTranslation('pickColorTip')}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Pipette className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="mb-1 text-muted-foreground">
                      {getTranslation('dragTip')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTranslation('formatTip')}
                    </p>
                  </div>
                )}
              </div>
              {image && selected && mode === 'eyedropper' && (
                <div className="mt-4 flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
                  <div
                    className="h-16 w-16 rounded-md border shadow-sm"
                    style={{ backgroundColor: selected }}
                  />
                  <div>
                    <p className="font-medium">
                      {getTranslation('selectedColor')}
                    </p>
                    <p className="text-lg font-bold">
                      {selected.toUpperCase()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => copy(selected.toUpperCase())}
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {getTranslation('copy')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{getTranslation('palette')}</CardTitle>
          <CardDescription>
            {mode === 'random'
              ? getTranslation('descPaletteRandom')
              : mode === 'image'
                ? getTranslation('descPaletteImage')
                : getTranslation('descPaletteEyedropper')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColorCard
            colors={colors}
            selected={selected}
            setSelected={setSelected}
            mode={mode}
          />
        </CardContent>
      </Card>
    </div>
  )
}
