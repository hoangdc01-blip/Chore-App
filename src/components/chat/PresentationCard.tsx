import { useCallback } from 'react'
import type { PresentationResult } from '../../types'

interface Props {
  result: PresentationResult
  isGenerating?: boolean
  onDismiss: () => void
}

export default function PresentationCard({ result, isGenerating = false, onDismiss }: Props) {
  const hasPptx = !!result.pptxDataUrl

  const downloadPptx = useCallback(() => {
    if (!result.pptxDataUrl) return
    const link = document.createElement('a')
    link.download = `${result.title}.pptx`
    link.href = result.pptxDataUrl
    link.click()
  }, [result.title, result.pptxDataUrl])

  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-3 ml-10 animate-fade-in-up">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        Presentation
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{'\u{1F4CA}'}</span>
        <span className="font-bold text-foreground">{result.title}</span>
        <span className="text-xs text-muted-foreground">({result.slideCount} slides)</span>
      </div>

      {/* Slide preview list */}
      <div className="bg-muted rounded-lg p-2 mb-3 space-y-1">
        {result.slides.map((slide, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
            {slide.emoji && <span className="text-sm">{slide.emoji}</span>}
            <span className="text-foreground truncate">{slide.title}</span>
          </div>
        ))}
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Generating PowerPoint...</p>
        </div>
      ) : hasPptx ? (
        <div className="flex gap-2 mb-2">
          <button
            onClick={downloadPptx}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white py-2 text-sm font-bold transition-colors"
          >
            Download PPTX {'\u{1F4E5}'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-3xl">{'\u{1F61E}'}</span>
          <p className="text-sm text-muted-foreground text-center">
            Could not generate the PowerPoint file. Please try again.
          </p>
        </div>
      )}

      {!isGenerating && (
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
