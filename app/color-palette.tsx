"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Palette, RefreshCw, Copy, Check, Pipette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import Color from "color"

// We'll dynamically import color-thief to avoid SSR issues
import dynamic from "next/dynamic"

const ColorThief = dynamic(() => import("colorthief").then((mod) => mod.default), { ssr: false })

type ColorMode = "random" | "image" | "eyedropper"

export default function ColorPicker() {
  const [activeTab, setActiveTab] = useState<ColorMode>("random")
  const [image, setImage] = useState<string | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState<number>(5)
  const [quality, setQuality] = useState<number>(10)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const eyedropperImageRef = useRef<HTMLImageElement>(null)
  const colorThiefRef = useRef<any>(null)

  // Initialize ColorThief
  useEffect(() => {
    const initColorThief = async () => {
      try {
        colorThiefRef.current = new (await import("colorthief")).default()
      } catch (error) {
        console.error("Failed to load ColorThief:", error)
      }
    }

    initColorThief()

    // Generate initial random colors
    generateRandomColors()
  }, [])

  // Extract colors when image loads
  useEffect(() => {
    if (image && imageRef.current && imageRef.current.complete && colorThiefRef.current) {
      extractColorsFromImage()
    }
  }, [image, colorCount, quality])

  // Set up canvas for eyedropper tab
  useEffect(() => {
    if (activeTab === "eyedropper" && image && eyedropperImageRef.current && canvasRef.current) {
      const img = eyedropperImageRef.current
      const canvas = canvasRef.current

      if (img.complete) {
        setupCanvas(img, canvas)
      } else {
        img.onload = () => setupCanvas(img, canvas)
      }
    }
  }, [activeTab, image])

  const setupCanvas = (img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match image
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const extractColorsFromImage = async () => {
    if (!imageRef.current || !colorThiefRef.current) return

    try {
      // Make sure the image is loaded
      if (!imageRef.current.complete) {
        await new Promise((resolve) => {
          if (imageRef.current) {
            imageRef.current.onload = resolve
          }
        })
      }

      // Get palette from ColorThief
      const palette = colorThiefRef.current.getPalette(imageRef.current, colorCount, quality)

      // Convert RGB arrays to hex colors using color library
      const hexColors = palette.map((color: number[]) => Color.rgb(color[0], color[1], color[2]).hex())

      setColors(hexColors)
      if (hexColors.length > 0) {
        setSelectedColor(hexColors[0])
      }
    } catch (error) {
      console.error("Error extracting colors:", error)
      toast({
        title: "提取颜色失败",
        description: "请尝试上传不同的图片或调整参数",
        variant: "destructive",
      })
    }
  }

  const generateRandomColors = () => {
    // Generate random harmonious colors
    const baseHue = Math.floor(Math.random() * 360)
    const newColors = []

    // Generate analogous colors
    for (let i = 0; i < colorCount; i++) {
      const hue = (baseHue + i * 30) % 360
      const saturation = 70 + Math.floor(Math.random() * 30)
      const lightness = 40 + Math.floor(Math.random() * 40)

      // Convert HSL to hex using color library
      const hexColor = Color.hsl(hue, saturation, lightness).hex()
      newColors.push(hexColor)
    }

    setColors(newColors)
    if (newColors.length > 0) {
      setSelectedColor(newColors[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "已复制到剪贴板",
      description: text,
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate mouse position on canvas
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Get pixel data at clicked location
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pixelData = ctx.getImageData(x, y, 1, 1).data
    const [r, g, b] = pixelData

    // Convert to hex using color library
    const hexColor = Color.rgb(r, g, b).hex()

    // For eyedropper mode, replace the colors array with just this color
    if (activeTab === "eyedropper") {
      setColors([hexColor])
    } else {
      // For other modes, add to colors array if not already there
      if (!colors.includes(hexColor)) {
        setColors((prev) => [hexColor, ...prev.slice(0, 9)])
      }
    }

    // Select this color
    setSelectedColor(hexColor)

    // Show feedback
    toast({
      title: "已选取颜色",
      description: hexColor.toUpperCase(),
    })
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">色卡生成工具</h1>

      <Tabs defaultValue="random" className="mb-6" onValueChange={(value) => setActiveTab(value as ColorMode)}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="random">随机生成</TabsTrigger>
          <TabsTrigger value="image">图片提取</TabsTrigger>
          <TabsTrigger value="eyedropper">取色器</TabsTrigger>
        </TabsList>

        <TabsContent value="random" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>随机色卡生成</CardTitle>
              <CardDescription>生成随机和谐的色卡</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">颜色数量: {colorCount}</span>
                <div className="w-2/3">
                  <Slider
                    value={[colorCount]}
                    min={3}
                    max={10}
                    step={1}
                    onValueChange={(value) => setColorCount(value[0])}
                  />
                </div>
              </div>

              <Button onClick={generateRandomColors} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                重新生成色卡
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>图片色卡提取</CardTitle>
              <CardDescription>上传或拖拽图片以提取色卡</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
                  image ? "border-primary" : "border-muted",
                )}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                {image ? (
                  <div className="w-full">
                    <img
                      ref={imageRef}
                      src={image || "/placeholder.svg"}
                      alt="Uploaded"
                      className="max-h-[200px] mx-auto object-contain rounded-md"
                      crossOrigin="anonymous"
                      onLoad={extractColorsFromImage}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground mb-1">点击或拖拽图片到此处</p>
                    <p className="text-xs text-muted-foreground">支持 JPG, PNG, GIF 等格式</p>
                  </div>
                )}
              </div>

              {image && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">颜色数量: {colorCount}</span>
                    <div className="w-2/3">
                      <Slider
                        value={[colorCount]}
                        min={3}
                        max={10}
                        step={1}
                        onValueChange={(value) => setColorCount(value[0])}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">质量 (越低越精确): {quality}</span>
                    <div className="w-2/3">
                      <Slider
                        value={[quality]}
                        min={1}
                        max={20}
                        step={1}
                        onValueChange={(value) => setQuality(value[0])}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eyedropper" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>图片取色器</CardTitle>
              <CardDescription>从图片中直接选取颜色</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
                  image ? "border-primary" : "border-muted",
                )}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={!image ? triggerFileInput : undefined}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                {image ? (
                  <div className="w-full text-center">
                    <div className="relative inline-block">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className={cn(
                          "max-w-full cursor-crosshair border rounded-md",
                        )}
                      />
                      <img
                        ref={eyedropperImageRef}
                        src={image || "/placeholder.svg"}
                        alt="Color Picker"
                        className="hidden"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground">点击图片上的任意位置选取颜色</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Pipette className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground mb-1">点击或拖拽图片到此处</p>
                    <p className="text-xs text-muted-foreground">支持 JPG, PNG, GIF 等格式</p>
                  </div>
                )}
              </div>

              {image && selectedColor && activeTab === "eyedropper" && (
                <div className="mt-4 flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                  <div className="w-16 h-16 rounded-md border shadow-sm" style={{ backgroundColor: selectedColor }} />
                  <div>
                    <p className="font-medium">已选取颜色</p>
                    <p className="text-lg font-bold">{selectedColor.toUpperCase()}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => copyToClipboard(selectedColor.toUpperCase())}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    复制
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>色卡</CardTitle>
          <CardDescription>
            {activeTab === "random"
              ? "随机生成的色卡"
              : activeTab === "image"
                ? "从图片中提取的色卡"
                : "从图片中选取的颜色"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {colors.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={cn(
                      "aspect-square rounded-md cursor-pointer hover:scale-105 transition-transform border",
                      selectedColor === color ? "ring-2 ring-primary ring-offset-2" : "",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>

              {selectedColor && (
                <div className="space-y-4">
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: selectedColor }} />
                      <span className="font-medium">{selectedColor.toUpperCase()}</span>
                    </div>
                    <Button size="sm" onClick={() => copyToClipboard(selectedColor.toUpperCase())}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      复制
                    </Button>
                  </div>

                  <Tabs defaultValue="hex">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="hex">HEX</TabsTrigger>
                      <TabsTrigger value="rgb">RGB</TabsTrigger>
                      <TabsTrigger value="hsl">HSL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="hex" className="p-4 bg-muted/50 rounded-md mt-2">
                      <div className="flex justify-between items-center">
                        <code>{selectedColor.toUpperCase()}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedColor.toUpperCase())}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="rgb" className="p-4 bg-muted/50 rounded-md mt-2">
                      {(() => {
                        try {
                          const colorObj = Color(selectedColor)
                          const rgb = colorObj.rgb().object()
                          const rgbString = `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`

                          return (
                            <div className="flex justify-between items-center">
                              <code>{rgbString}</code>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(rgbString)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        } catch (error) {
                          return null
                        }
                      })()}
                    </TabsContent>
                    <TabsContent value="hsl" className="p-4 bg-muted/50 rounded-md mt-2">
                      {(() => {
                        try {
                          const colorObj = Color(selectedColor)
                          const hsl = colorObj.hsl().object()
                          const hslString = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`

                          return (
                            <div className="flex justify-between items-center">
                              <code>{hslString}</code>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hslString)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        } catch (error) {
                          return null
                        }
                      })()}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Palette className="h-12 w-12 mb-2" />
              <p>
                {activeTab === "random"
                  ? "点击生成随机色卡"
                  : activeTab === "image"
                    ? "上传图片以提取色卡"
                    : "上传图片并点击任意位置选取颜色"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

