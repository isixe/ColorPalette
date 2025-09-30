import React from 'react'

export type Language = 'zh' | 'en'

export const DEFAULT_LANGUAGE: Language = 'en'

export const LanguageContext = React.createContext<{
  lang: Language
  setLang: (l: Language) => void
}>({ lang: DEFAULT_LANGUAGE, setLang: () => {} })

export const LANGUAGES: { label: string; value: Language }[] = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' }
]

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  zh: {
    title: '色卡生成工具',
    random: '随机生成',
    image: '图片提取',
    eyedropper: '取色器',
    palette: '色卡',
    colorCount: '颜色数量',
    quality: '质量 (越低越精确)',
    upload: '上传图片',
    copy: '复制',
    github: 'GitHub',
    copied: '已复制到剪贴板',
    invalidFileType: '无效的文件类型',
    pleaseUploadImage: '请上传图片文件',
    uploadFailed: '文件上传失败',
    pleaseRetry: '请重试',
    extractFailed: '提取颜色失败',
    tryOtherImage: '请尝试其他图片或参数',
    emptyRandom: '点击生成随机色卡',
    emptyImage: '上传图片以提取色卡',
    emptyEyedropper: '上传图片并点击任意位置选取颜色',
    descRandom: '生成随机和谐的色卡',
    regenerate: '重新生成色卡',
    descImage: '上传或拖拽图片以提取色卡',
    descEyedropper: '从图片中直接选取颜色',
    pickColorTip: '点击图片上的任意位置选取颜色',
    dragTip: '点击或拖拽图片到此处',
    formatTip: '支持 JPG, PNG, GIF 等格式',
    selectedColor: '已选取颜色',
    descPaletteRandom: '随机生成的色卡',
    descPaletteImage: '从图片中提取的色卡',
    descPaletteEyedropper: '从图片中选取的颜色'
  },
  en: {
    title: 'Color Palette Generator',
    random: 'Random',
    image: 'Image Extract',
    eyedropper: 'Eyedropper',
    palette: 'Palette',
    colorCount: 'Color Count',
    quality: 'Quality (lower is more accurate)',
    upload: 'Upload Image',
    copy: 'Copy',
    github: 'GitHub',
    copied: 'Copied to clipboard',
    invalidFileType: 'Invalid file type',
    pleaseUploadImage: 'Please upload an image file',
    uploadFailed: 'Upload failed',
    pleaseRetry: 'Please retry',
    extractFailed: 'Color extraction failed',
    tryOtherImage: 'Please try another image or parameter',
    emptyRandom: 'Click to generate random palette',
    emptyImage: 'Upload image to extract palette',
    emptyEyedropper: 'Upload image and click anywhere to pick color',
    descRandom: 'Generate harmonious random palette',
    regenerate: 'Regenerate',
    descImage: 'Upload or drag image to extract palette',
    descEyedropper: 'Pick color directly from image',
    pickColorTip: 'Click anywhere on image to pick color',
    dragTip: 'Click or drag image here',
    formatTip: 'Supports JPG, PNG, GIF',
    selectedColor: 'Selected Color',
    descPaletteRandom: 'Randomly generated palette',
    descPaletteImage: 'Palette extracted from image',
    descPaletteEyedropper: 'Color picked from image'
  }
}

export function getTranslation(key: string): string {
  try {
    const context = React.useContext(LanguageContext)
    const lang: Language =
      context && context.lang ? context.lang : DEFAULT_LANGUAGE
    return (
      TRANSLATIONS[lang]?.[key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key
    )
  } catch {
    return TRANSLATIONS[DEFAULT_LANGUAGE][key] || key
  }
}
