/**
 * Extract text content from PDF, DOCX, and Excel files.
 */

/** Parse a PDF file and return its text content */
async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item: any) => item.str)
      .join(' ')
    if (text.trim()) pages.push(`[Page ${i}]\n${text.trim()}`)
  }

  return pages.join('\n\n')
}

/** Parse a DOCX file and return its text content */
async function parseDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

/** Parse an Excel file and return its text content */
async function parseExcel(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheets: string[] = []

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    if (csv.trim()) {
      sheets.push(`[Sheet: ${name}]\n${csv.trim()}`)
    }
  }

  return sheets.join('\n\n')
}

/** Supported document MIME types */
const DOC_TYPES: Record<string, (file: File) => Promise<string>> = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': parseExcel,
  'application/vnd.ms-excel': parseExcel,
  'text/csv': parseExcel,
}

/** File extensions as fallback for type detection */
const EXT_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv',
}

export function isDocumentFile(file: File): boolean {
  if (DOC_TYPES[file.type]) return true
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  return !!EXT_MAP[ext]
}

export function getDocumentLabel(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? 'DOC'
  return ext
}

export async function extractDocumentText(file: File): Promise<string> {
  let mimeType = file.type
  if (!DOC_TYPES[mimeType]) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    mimeType = EXT_MAP[ext] ?? ''
  }

  const parser = DOC_TYPES[mimeType]
  if (!parser) throw new Error(`Unsupported file type: ${file.name}`)

  const text = await parser(file)
  if (!text.trim()) throw new Error('No text content found in the document.')

  // Truncate very long documents to avoid overwhelming the LLM context
  const MAX_CHARS = 15000
  if (text.length > MAX_CHARS) {
    return text.slice(0, MAX_CHARS) + `\n\n[... Document truncated at ${MAX_CHARS} characters. ${text.length - MAX_CHARS} characters omitted.]`
  }

  return text
}
