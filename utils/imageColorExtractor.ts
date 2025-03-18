import Color from 'color'
import colorthief from 'colorthief'

export const extractColors = async (
  img: HTMLImageElement,
  colorCount: number = 5,
  quality: number = 10
): Promise<string[]> => {
  const colorThief = new colorthief()

  // Ensure the image is loaded
  if (!img.complete) {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image failed to load'))
    })
  }

  // Get the color palette from the image
  const palette = colorThief.getPalette(img, colorCount, quality)

  // Convert RGB arrays to hex colors
  const hexColors = palette
    ? palette.map((color: number[]) => {
        return Color.rgb(color).hex()
      })
    : []

  return hexColors
}
