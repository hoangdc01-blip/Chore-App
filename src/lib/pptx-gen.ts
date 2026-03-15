import PptxGenJS from 'pptxgenjs'
import type { PresentationAction } from '../types'

export async function generatePptx(action: PresentationAction): Promise<Blob> {
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_16x9'

  // Title slide
  const titleSlide = prs.addSlide()
  titleSlide.background = { color: '4CAF50' }
  titleSlide.addText(action.title, {
    x: 0.5, y: 1.5, w: 9, h: 2,
    fontSize: 36, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle'
  })
  titleSlide.addText('Made with AI Buddy \u{1F427}', {
    x: 0.5, y: 4, w: 9, h: 0.5,
    fontSize: 14, color: 'E8F5E9', align: 'center'
  })

  // Content slides
  const SLIDE_COLORS = ['2196F3', 'FF9800', '9C27B0', 'F44336', '00BCD4', '8BC34A', 'FF5722', '3F51B5']

  action.slides.forEach((slide, i) => {
    const s = prs.addSlide()
    const bgColor = SLIDE_COLORS[i % SLIDE_COLORS.length]
    s.background = { color: bgColor }

    // Slide title
    s.addText(`${slide.emoji || ''} ${slide.title}`.trim(), {
      x: 0.5, y: 0.3, w: 9, h: 1,
      fontSize: 28, bold: true, color: 'FFFFFF'
    })

    // Content as bullet points
    const bullets = slide.content.split('\n').filter(Boolean).map(line => ({
      text: line.replace(/^[-\u2022]\s*/, ''),
      options: { fontSize: 18, color: 'FFFFFF', bullet: true, breakLine: true as const }
    }))

    s.addText(bullets, {
      x: 0.8, y: 1.5, w: 8.5, h: 3.5,
      valign: 'top'
    })
  })

  // Thank you slide
  const endSlide = prs.addSlide()
  endSlide.background = { color: '4CAF50' }
  endSlide.addText('Thank You! \u{1F389}', {
    x: 0.5, y: 2, w: 9, h: 2,
    fontSize: 40, bold: true, color: 'FFFFFF', align: 'center'
  })

  return await prs.write({ outputType: 'blob' }) as Blob
}
