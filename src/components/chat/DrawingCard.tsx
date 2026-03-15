import { useRef, useCallback } from 'react'
import type { DrawingResult } from '../../types'

interface Props {
  result: DrawingResult
  onDismiss: () => void
}

/** Strip script tags and event handler attributes from SVG strings */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[\s\S]*?\/>/gi, '')
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
}

export default function DrawingCard({ result, onDismiss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const downloadAsJpeg = useCallback(() => {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 800, 800)
      ctx.drawImage(img, 0, 0, 800, 800)
      const link = document.createElement('a')
      link.download = `${result.title}.jpeg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [result.title])

  const handlePrint = useCallback(() => {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>${result.title}</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
          ${svgData}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }, [result.title])

  const sanitized = sanitizeSvg(result.svg)

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
        ref={containerRef}
        className="bg-white rounded-lg border border-border p-2 mb-3 flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />

      <div className="flex gap-2 mb-2">
        <button
          onClick={downloadAsJpeg}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white py-2 text-sm font-bold transition-colors"
        >
          Download JPEG {'\u{1F4F7}'}
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white py-2 text-sm font-bold transition-colors"
        >
          Print {'\u{1F5A8}\uFE0F'}
        </button>
      </div>

      <button
        onClick={onDismiss}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white py-2 text-sm font-bold transition-colors"
      >
        Done!
      </button>
    </div>
  )
}
