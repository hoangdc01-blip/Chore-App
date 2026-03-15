import { useCallback } from 'react'
import type { DrawingResult } from '../../types'
import { useChatStore } from '../../store/chat-store'

interface Props {
  result: DrawingResult
  onDismiss: () => void
}

export default function DrawingCard({ result, onDismiss }: Props) {
  const isGeneratingImage = useChatStore((s) => s.isGeneratingImage)
  const hasImage = !!result.imageDataUrl

  const downloadAsJpeg = useCallback(() => {
    if (!result.imageDataUrl) return
    const link = document.createElement('a')
    link.download = `${result.title}.jpeg`
    link.href = result.imageDataUrl
    link.click()
  }, [result.title, result.imageDataUrl])

  const handlePrint = useCallback(() => {
    if (!result.imageDataUrl) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>${result.title}</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
          <img src="${result.imageDataUrl}" style="max-width:100%;max-height:100vh;" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }, [result.title, result.imageDataUrl])

  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-3 ml-10 animate-fade-in-up">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        Drawing
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{'\u{1F3A8}'}</span>
        <span className="font-bold text-foreground">{result.title}</span>
      </div>

      <div
        className="bg-white rounded-lg border border-border p-2 mb-3 flex items-center justify-center"
        style={{ minHeight: '200px' }}
      >
        {isGeneratingImage ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Generating image...</p>
          </div>
        ) : hasImage ? (
          <img
            src={result.imageDataUrl}
            alt={result.title}
            className="w-full h-auto max-h-[250px] object-contain rounded"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-6">
            <span className="text-3xl">{'\u{1F61E}'}</span>
            <p className="text-sm text-muted-foreground text-center">
              Could not generate the image. Make sure Stable Diffusion is running (AUTOMATIC1111 or Draw Things app).
            </p>
          </div>
        )}
      </div>

      {hasImage && !isGeneratingImage && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={downloadAsJpeg}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white py-2 text-sm font-bold transition-colors"
          >
            Download {'\u{1F4F7}'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white py-2 text-sm font-bold transition-colors"
          >
            Print {'\u{1F5A8}\uFE0F'}
          </button>
        </div>
      )}

      {!isGeneratingImage && (
        <button
          onClick={onDismiss}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white py-2 text-sm font-bold transition-colors"
        >
          Done!
        </button>
      )}
    </div>
  )
}
