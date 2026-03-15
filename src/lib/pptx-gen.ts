import PptxGenJS from 'pptxgenjs'
import type { PresentationAction } from '../types'

// Vibrant color themes
const THEMES = {
  jungle: ['1B5E20', '2E7D32', '388E3C', '43A047', '4CAF50', '66BB6A', '81C784', 'A5D6A7'],
  neon: ['FF1744', 'F50057', 'D500F9', '651FFF', '2979FF', '00E5FF', '00E676', 'FFEA00'],
  ocean: ['0D47A1', '1565C0', '1976D2', '1E88E5', '2196F3', '42A5F5', '64B5F6', '90CAF9'],
  sunset: ['BF360C', 'D84315', 'E64A19', 'F4511E', 'FF5722', 'FF6E40', 'FF8A65', 'FFAB91'],
}

export async function generatePptx(action: PresentationAction): Promise<Blob> {
  const prs = new PptxGenJS()
  prs.layout = 'LAYOUT_16x9'

  const colors = THEMES.jungle // default theme
  const totalSlides = action.slides.length + 2 // title + content + end

  // Title slide
  const titleSlide = prs.addSlide()
  titleSlide.background = { color: colors[0] }
  titleSlide.addText(action.title, {
    x: 0.5, y: 1, w: 9, h: 2.5,
    fontSize: 40, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle',
    fontFace: 'Arial Black',
    shadow: { type: 'outer', blur: 6, offset: 3, color: '000000', opacity: 0.4 },
  })
  titleSlide.addText('Made with AI Buddy \u{1F427}', {
    x: 0.5, y: 4.2, w: 9, h: 0.5,
    fontSize: 16, color: 'C8E6C9', align: 'center', fontFace: 'Arial',
  })
  titleSlide.addText(`1 / ${totalSlides}`, {
    x: 8, y: 4.8, w: 1.5, h: 0.3,
    fontSize: 10, color: 'A5D6A7', align: 'right',
  })

  // Content slides with alternating accent colors
  action.slides.forEach((slide, i) => {
    const s = prs.addSlide()
    const bgColor = colors[i % colors.length]
    const accentColor = colors[(i + 3) % colors.length]

    s.background = { color: bgColor }

    // Accent bar on left
    s.addShape(prs.ShapeType.rect, {
      x: 0, y: 0, w: 0.15, h: 5.63,
      fill: { color: accentColor },
    })

    // Emoji (large, top right)
    if (slide.emoji) {
      s.addText(slide.emoji, {
        x: 8.5, y: 0.2, w: 1, h: 1,
        fontSize: 44, align: 'center',
      })
    }

    // Slide title
    s.addText(slide.title, {
      x: 0.5, y: 0.2, w: 8, h: 0.9,
      fontSize: 30, bold: true, color: 'FFFFFF',
      fontFace: 'Arial Black',
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.3 },
    })

    // Divider line
    s.addShape(prs.ShapeType.rect, {
      x: 0.5, y: 1.15, w: 4, h: 0.04,
      fill: { color: 'FFFFFF' },
    })

    // Content bullets
    const bullets = slide.content.split('\n').filter(Boolean).map(line => ({
      text: line.replace(/^[-\u2022]\s*/, ''),
      options: {
        fontSize: 18,
        color: 'FFFFFF',
        bullet: { code: '25CF' },
        paraSpaceAfter: 8,
        fontFace: 'Arial',
      } as PptxGenJS.TextPropsOptions,
    }))

    s.addText(bullets, {
      x: 0.6, y: 1.4, w: 8.8, h: 3.8,
      valign: 'top',
      lineSpacingMultiple: 1.2,
    })

    // Slide number
    s.addText(`${i + 2} / ${totalSlides}`, {
      x: 8, y: 4.8, w: 1.5, h: 0.3,
      fontSize: 10, color: 'C8E6C9', align: 'right',
    })
  })

  // Thank you / end slide
  const endSlide = prs.addSlide()
  endSlide.background = { color: colors[0] }
  endSlide.addText('Thank You!', {
    x: 0.5, y: 1.5, w: 9, h: 2,
    fontSize: 44, bold: true, color: 'FFFFFF', align: 'center',
    fontFace: 'Arial Black',
    shadow: { type: 'outer', blur: 6, offset: 3, color: '000000', opacity: 0.4 },
  })
  endSlide.addText('\u{1F389}', {
    x: 4, y: 3.5, w: 2, h: 1.5,
    fontSize: 60, align: 'center',
  })
  endSlide.addText(`${totalSlides} / ${totalSlides}`, {
    x: 8, y: 4.8, w: 1.5, h: 0.3,
    fontSize: 10, color: 'A5D6A7', align: 'right',
  })

  return await prs.write({ outputType: 'blob' }) as Blob
}
