import Color from 'color'

export function randomColor(colorCount: number): Array<string> {
  const baseHue = Math.floor(Math.random() * 360)
  const colors = []

  for (let i = 0; i < colorCount; i++) {
    const hue = (baseHue + i * 30) % 360
    const saturation = 70 + Math.floor(Math.random() * 30)
    const lightness = 40 + Math.floor(Math.random() * 40)

    const hexColor = Color.hsl(hue, saturation, lightness).hex()
    colors.push(hexColor)
  }
  return colors
}

export function generateNearbyColors(baseColor: string, colorCount: number): Array<string> {
  const colors = []
  
  try {
    const base = Color(baseColor)
    const hsl = base.hsl().object()
    
    for (let i = 0; i < colorCount; i++) {
      const hueShift = (i - Math.floor(colorCount / 2)) * 15
      const newHue = (360 + hsl.h + hueShift) % 360
      const newSaturation = Math.max(30, Math.min(100, hsl.s + (i % 3 - 1) * 20))
      const newLightness = Math.max(25, Math.min(75, hsl.l + (i % 2 === 0 ? 10 : -10)))
      
      const hexColor = Color.hsl(newHue, newSaturation, newLightness).hex()
      colors.push(hexColor)
    }
  } catch {
    return randomColor(colorCount)
  }
  
  return colors
}
