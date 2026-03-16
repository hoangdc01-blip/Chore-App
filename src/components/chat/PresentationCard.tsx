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

  // Determine progress stage
  const isContentStage = isGenerating && result.contentProgress && !result.imageProgress
  const isImageStage = isGenerating && result.imageProgress

  // Use topics for preview during generation, slides after generation
  const previewItems = result.slides.length > 0
    ? result.slides.map((s, i) => ({ index: i, emoji: s.emoji, label: s.title }))
    : result.topics.map((t, i) => ({ index: i, emoji: undefined, label: t }))

  // Calculate overall progress for progress bar
  let progressPercent = 0
  if (isContentStage && result.contentProgress) {
    // Content is first half (0-50%)
    progressPercent = (result.contentProgress.current / result.contentProgress.total) * 50
  } else if (isImageStage && result.imageProgress) {
    // Images are second half (50-100%)
    progressPercent = 50 + (result.imageProgress.current / result.imageProgress.total) * 50
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-3 mb-3 ml-10 animate-fade-in-up">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        Presentation
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{'\u{1F4CA}'}</span>
        <span className="font-bold text-foreground">{result.title}</span>
        <span className="text-xs text-muted-foreground">({result.slideCount} slides)</span>
      </div>

      {/* Slide/topic preview list */}
      <div className="bg-muted rounded-lg p-2 mb-3 space-y-1">
        {previewItems.map((item) => (
          <div key={item.index} className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{item.index + 1}.</span>
            {item.emoji && <span className="text-sm">{item.emoji}</span>}
            <span className="text-foreground truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-500 animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            {isContentStage && result.contentProgress
              ? `Writing slide content (${result.contentProgress.current}/${result.contentProgress.total})...`
              : isImageStage && result.imageProgress
                ? `Generating slide images (${result.imageProgress.current}/${result.imageProgress.total})...`
                : 'Preparing presentation...'}
          </p>
          {(isContentStage || isImageStage) && (
            <div className="w-full max-w-48 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      ) : hasPptx ? (
        <div className="flex gap-2 mb-2">
          <button
            onClick={downloadPptx}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 text-sm font-bold transition-colors"
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
          className="w-full flex items-center justify-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white py-2 text-sm font-bold transition-colors"
        >
          Done!
        </button>
      )}
    </div>
  )
}
