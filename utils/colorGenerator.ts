import Color from 'color'

export function randomColor(colorCount: number): Array<string> {
  // Generate random harmonious colors
  const baseHue = Math.floor(Math.random() * 360)
  const colors = []

  // Generate analogous colors
  for (let i = 0; i < colorCount; i++) {
    const hue = (baseHue + i * 30) % 360
    const saturation = 70 + Math.floor(Math.random() * 30)
    const lightness = 40 + Math.floor(Math.random() * 40)

    // Convert HSL to hex using color library
    const hexColor = Color.hsl(hue, saturation, lightness).hex()
    colors.push(hexColor)
  }
  return colors
}
