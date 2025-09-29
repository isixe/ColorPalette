import Color from 'color'
import colorthief from 'colorthief'

export const extractColors = async (
  img: HTMLImageElement,
  colorCount: number = 5,
  quality: number = 10
): Promise<string[]> => {
  const colorThief = new colorthief()
  if (!img.complete) {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image failed to load'))
    })
  }
  const palette = colorThief.getPalette(img, colorCount, quality)
  const hexColors = palette
    ? palette.map((c: number[]) => {
        return Color.rgb(c).hex()
      })
    : []
  return hexColors
}
