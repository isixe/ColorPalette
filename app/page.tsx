'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_LANGUAGE, getTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { generateNearbyColors } from '@/utils/colorGenerator'
import { handleFileDrop, handleFileUpload } from '@/utils/fileUtils'
import { extractColors } from '@/utils/imageColorExtractor'
import Color from 'color'
import colorthief from 'colorthief'
import {
  Check,
  Copy,
  Droplets,
  ImageIcon,
  Lightbulb,
  MousePointer2,
  Palette,
  Pipette,
  Sparkles,
  Upload
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type ColorMode = 'nearby' | 'image' | 'eyedropper'

function useClipboard() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
  const [mode, setMode] = useState<ColorMode>('nearby')
  const [lang, setLang] = useState(DEFAULT_LANGUAGE)

  const [image, setImage] = useState<string | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState(5)
  const [quality, setQuality] = useState(10)
  const [baseColor, setBaseColor] = useState('#6366f1')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const eyedropperImgRef = useRef<HTMLImageElement>(null)
  const colorThiefRef = useRef<colorthief>(null)
  const { copied, copy } = useClipboard()

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleNearby = useCallback(() => {
    const arr = generateNearbyColors(baseColor, colorCount)
    setColors(arr)
    setSelected(arr[0] || null)
  }, [baseColor, colorCount])

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored === 'zh' || stored === 'en') setLang(stored)
  }, [])

  useEffect(() => {
    if (mode === 'nearby') {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        handleNearby()
      }, 300)
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [mode, baseColor, colorCount, handleNearby])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        return
      }
      handleFileUpload(
        file,
        (url) => setImage(url),
        () => {}
      )
    },
    []
  )

  const handleDropImage = useCallback((e: React.DragEvent) => {
    handleFileDrop(e, (file: File) => {
      if (!file.type.startsWith('image/')) {
        return
      }
      handleFileUpload(
        file,
        (url) => setImage(url),
        () => {}
      )
    })
  }, [])

  const handleExtractColors = useCallback(async () => {
    if (!imageRef.current || !colorThiefRef.current) return
    try {
      const arr = await extractColors(imageRef.current, colorCount, quality)
      setColors(arr)
      setSelected(arr[0] || null)
    } catch {}
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

  const handleTabChange = useCallback((newMode: ColorMode) => {
    setColors([])
    setSelected(null)
    if (newMode === 'nearby') {
      setImage(null)
    }
    setMode(newMode)
  }, [])

  useEffect(() => {
    colorThiefRef.current = new colorthief()
    if (image && imageRef.current && imageRef.current.complete) {
      handleExtractColors()
    }
  }, [image, handleExtractColors])

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

  const navItems = [
    { id: 'nearby' as const, icon: Sparkles, labelKey: 'nearby' },
    { id: 'image' as const, icon: ImageIcon, labelKey: 'image' },
    { id: 'eyedropper' as const, icon: Pipette, labelKey: 'eyedropper' }
  ]

  const ColorSlider: React.FC<{
    value: number
    min: number
    max: number
    onChange: (v: number) => void
    label: string
    onChangeEnd?: (v: number) => void
  }> = ({ value, min, max, onChange, label, onChangeEnd }) => {
    const [localValue, setLocalValue] = useState(value)

    useEffect(() => {
      setLocalValue(value)
    }, [value])

    return (
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="w-20">
          <Slider
            value={[localValue]}
            min={min}
            max={max}
            step={1}
            onValueChange={(v) => {
              setLocalValue(v[0])
              onChange(v[0])
            }}
            onPointerUp={() => {
              onChangeEnd?.(localValue)
            }}
          />
        </div>
        <span className="w-5 text-right text-sm font-semibold">
          {localValue}
        </span>
      </div>
    )
  }

  const ColorSwatch: React.FC<{
    color: string
    isSelected: boolean
    onClick: () => void
    index?: number
  }> = ({ color, isSelected, onClick, index = 0 }) => (
    <button
      onClick={onClick}
      className={cn(
        'group relative h-16 w-full rounded-xl transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        isSelected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
      )}
      style={{ backgroundColor: color }}
    >
      <span className="sr-only">{color}</span>
      {isSelected && (
        <div className="animate-scale-in absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/20 p-1.5 backdrop-blur-sm">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </button>
  )

  const ColorDetail: React.FC<{ color: string }> = ({ color }) => {
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

    const formats = [
      { label: 'HEX', value: color.toUpperCase() },
      { label: 'RGB', value: rgb },
      { label: 'HSL', value: hsl }
    ]

    return (
      <div className="rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-xl border-2 shadow-inner"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1">
            <p className="font-mono text-xl font-bold tracking-wider">
              {color.toUpperCase()}
            </p>
          </div>
          {copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <Copy
              className="h-5 w-5"
              onClick={() => copy(color.toUpperCase())}
            />
          )}
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {formats.map((format) => (
            <button
              key={format.label}
              onClick={() => copy(format.value)}
              className="group flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2 transition-colors hover:bg-muted"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {format.label}
              </span>
              <code className="font-mono text-xs font-semibold group-hover:text-primary">
                {format.value}
              </code>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container relative mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:py-8">
        <h1 className="sr-only">{getTranslation('title')}</h1>
        <nav className="sticky top-1/2 z-[100] hidden h-fit -translate-y-1/2 flex-col gap-2 lg:flex">
          {navItems.map((item) => (
            <div key={item.id} className="group relative">
              <button
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border border-border/50 text-sm font-medium backdrop-blur-sm transition-all duration-200',
                  mode === item.id
                    ? 'bg-primary/90 text-primary-foreground'
                    : 'bg-card/80 text-muted-foreground hover:scale-110 hover:bg-card hover:text-foreground hover:shadow-lg'
                )}
              >
                <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
              </button>
              <div className="pointer-events-none absolute left-full top-1/2 z-[110] ml-3 -translate-y-1/2 translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                <div className="whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-sm font-medium shadow-lg">
                  {item.id === 'nearby' &&
                    (lang === 'zh' ? '邻近色生成' : 'Nearby Colors')}
                  {item.id === 'image' &&
                    (lang === 'zh' ? '图片提取' : 'Image Extract')}
                  {item.id === 'eyedropper' &&
                    (lang === 'zh' ? '取色器' : 'Eyedropper')}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <nav className="flex justify-center gap-4 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-all duration-200',
                mode === item.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
            </button>
          ))}
        </nav>

        <main className="flex-1 space-y-6">
          <div
            className={cn(
              'rounded-2xl border bg-card/60 p-5 shadow-sm backdrop-blur-sm',
              mode === 'nearby' && 'border-blue-200/50 dark:border-blue-800/30',
              mode === 'image' &&
                'border-green-200/50 dark:border-green-800/30',
              mode === 'eyedropper' &&
                'border-pink-200/50 dark:border-pink-800/30'
            )}
          >
            {mode === 'nearby' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {getTranslation('nearby')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh'
                        ? '基于基础色智能生成和谐色系'
                        : 'Generate harmonious colors based on base color'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh'
                        ? '选择一种基础颜色，调整颜色数量，点击生成按钮获得一组和谐配色方案'
                        : 'Choose a base color, adjust color count, click generate to get harmonious color schemes'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      {getTranslation('baseColor')}:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={baseColor}
                        onChange={(e) => setBaseColor(e.target.value)}
                        className="h-9 w-24 rounded-lg border bg-background px-3 font-mono text-sm uppercase outline-none"
                        maxLength={7}
                      />
                      <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-border">
                        <input
                          type="color"
                          value={baseColor}
                          onChange={(e) => setBaseColor(e.target.value)}
                          className="absolute -left-2 -top-2 h-16 w-16 cursor-pointer border-0 p-0"
                          style={{ background: 'transparent' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[180px] max-w-[200px] flex-1">
                    <ColorSlider
                      value={colorCount}
                      min={3}
                      max={10}
                      onChange={setColorCount}
                      onChangeEnd={() => {}}
                      label={getTranslation('colorCount')}
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'image' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {getTranslation('image')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh'
                        ? '从图片中提取主要颜色生成色卡'
                        : 'Extract main colors from image to generate palette'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh'
                        ? '上传或拖拽图片，支持 JPG、PNG、GIF 等常见格式，调整颜色数量和质量参数获取不同效果'
                        : 'Upload or drag images (JPG, PNG, GIF), adjust color count and quality for different results'}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors',
                    image
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground'
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
                    <div className="flex w-full justify-center">
                      <img
                        ref={imageRef}
                        src={image}
                        alt="Uploaded"
                        className="mx-auto max-h-[200px] w-auto rounded-lg object-contain sm:max-h-[250px]"
                        crossOrigin="anonymous"
                        onLoad={handleExtractColors}
                      />
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Upload className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        {getTranslation('dragTip')}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {getTranslation('formatTip')}
                      </p>
                    </div>
                  )}
                </div>

                {image && (
                  <div className="flex flex-wrap items-center gap-10 pt-2">
                    <div>
                      <ColorSlider
                        value={colorCount}
                        min={3}
                        max={10}
                        onChange={setColorCount}
                        onChangeEnd={(v) => {
                          setColorCount(v)
                          handleExtractColors()
                        }}
                        label={getTranslation('colorCount')}
                      />
                    </div>
                    <div className="min-w-[140px] flex-1">
                      <ColorSlider
                        value={quality}
                        min={1}
                        max={20}
                        onChange={setQuality}
                        onChangeEnd={(v) => {
                          setQuality(v)
                          handleExtractColors()
                        }}
                        label={getTranslation('quality')}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'eyedropper' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <MousePointer2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {getTranslation('eyedropper')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh'
                        ? '从图片中精确选取单个颜色'
                        : 'Precisely pick single colors from image'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-muted/30 p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh'
                        ? '上传图片后，点击图片任意位置即可精确选取该点的颜色，适合获取特定位置的精确色值'
                        : "After uploading image, click anywhere to precisely pick that point's color"}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors',
                    image
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground'
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
                    <div className="flex w-full justify-center py-2">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className="max-h-[250px] w-auto max-w-full cursor-crosshair rounded-lg border sm:max-h-[300px]"
                      />
                      <img
                        ref={eyedropperImgRef}
                        src={image}
                        alt="Color Picker"
                        className="hidden"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Droplets className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        {getTranslation('dragTip')}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {getTranslation('formatTip')}
                      </p>
                    </div>
                  )}
                </div>

                {image && selected && (
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                    <div
                      className="h-14 w-14 rounded-xl border-2 shadow-sm"
                      style={{ backgroundColor: selected }}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {getTranslation('selectedColor')}
                      </p>
                      <p className="font-mono text-lg font-bold">
                        {selected.toUpperCase()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto gap-1.5"
                      onClick={() => copy(selected.toUpperCase())}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {getTranslation('copy')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card/60 p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {getTranslation('palette')}
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {colors.length} {getTranslation('colors')}
              </span>
            </div>

            {colors.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
                <Palette className="mb-2 h-8 w-8" />
                <p className="px-4 text-center text-sm">
                  {mode === 'nearby'
                    ? lang === 'zh'
                      ? '点击"生成"按钮创建色卡'
                      : 'Click "Generate" to create palette'
                    : mode === 'image'
                      ? lang === 'zh'
                        ? '上传图片以提取色卡'
                        : 'Upload image to extract palette'
                      : lang === 'zh'
                        ? '上传图片并点击选取颜色'
                        : 'Upload image and click to pick color'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5">
                  {colors.map((c, i) => (
                    <ColorSwatch
                      key={i}
                      color={c}
                      isSelected={selected === c}
                      onClick={() => setSelected(c)}
                      index={i}
                    />
                  ))}
                </div>
                {selected && <ColorDetail color={selected} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
