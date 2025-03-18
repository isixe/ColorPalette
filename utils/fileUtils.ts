export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      resolve(result)
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export const handleFileUpload = async (
  file: File,
  onSuccess: (dataUrl: string) => void,
  onError: (error: Error) => void
) => {
  try {
    const dataUrl = await readFileAsDataURL(file)
    onSuccess(dataUrl)
  } catch (error) {
    onError(error as Error)
  }
}

export const handleFileDrop = (
  e: React.DragEvent,
  onFile: (file: File) => void
) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    onFile(file)
  }
}
