import { useCallback } from 'react'
import type { DrawingResult } from '../../types'

interface Props {
  result: DrawingResult
  isGenerating?: boolean
  onDismiss: () => void
}

export default function DrawingCard({ result, isGenerating = false, onDismiss }: Props) {
  const isGeneratingImage = isGenerating
  const hasImage = !!result.imageDataUrl

  // Story illustrations: show only the image, no buttons
  if (result.style === 'illustration') {
    if (!isGeneratingImage && !hasImage) return null
    return (
      <div className="mb-3 ml-10">
        <div className="bg-white rounded-xl border border-border overflow-hidden inline-block max-w-[350px]">
          {isGeneratingImage ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 rounded-full border-3 border-purple-200 border-t-purple-500 animate-spin" />
            </div>
          ) : hasImage ? (
            <img
              src={result.imageDataUrl}
              alt=""
              className="w-full h-auto"
            />
          ) : null}
        </div>
      </div>
    )
  }

  const downloadAsPng = useCallback(() => {
    if (!result.imageDataUrl) return
    const link = document.createElement('a')
    link.download = `${result.title}.png`
    link.href = result.imageDataUrl
    link.click()
  }, [result.title, result.imageDataUrl])

  const handlePrintA4 = useCallback(() => {
    if (!result.imageDataUrl) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${result.title}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 100%;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              background: white;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
          </style>
        </head>
        <body>
          <img src="${result.imageDataUrl}" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }, [result.title, result.imageDataUrl])

  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-3 ml-10 animate-fade-in-up">
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
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            <span className="text-3xl">{'\u{1F61E}'}</span>
            <p className="text-sm text-muted-foreground text-center whitespace-pre-line">
              {result.error || 'Could not generate the image. Make sure Draw Things is running with API server enabled.'}
            </p>
          </div>
        )}
      </div>

      {hasImage && !isGeneratingImage && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={downloadAsPng}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white py-2 text-sm font-bold transition-colors"
          >
            Download PNG {'\u{1F4F7}'}
          </button>
          <button
            onClick={handlePrintA4}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white py-2 text-sm font-bold transition-colors"
          >
            Print A4 {'\u{1F5A8}\uFE0F'}
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
