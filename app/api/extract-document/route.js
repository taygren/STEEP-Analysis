import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Basic HTML → Markdown conversion for mammoth output
function htmlToMarkdown(html) {
  return html
    // Images (before any other processing)
    .replace(/<img[^>]+src="([^"]*)"(?:[^>]+alt="([^"]*)")?[^>]*\/?>/gi,
      (_, src, alt) => `\n\n![${alt || 'Image'}](${src})\n\n`)
    // Headings
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
    // Inline formatting
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // List items (handle before ul/ol wrappers)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    // Block elements → paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n')
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = (file.name || '').toLowerCase();

    // ── Word document (.docx) ────────────────────────────────────
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const mammoth = (await import('mammoth')).default;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const extractedImageUrls = [];

      // Use convertToHtml with a custom image handler that saves images to disk
      const result = await mammoth.convertToHtml({ buffer }, {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imgBuffer = await image.read();
            const mimeType  = image.contentType || 'image/jpeg';
            const rawExt    = mimeType.split('/')[1] || 'jpg';
            const ext       = rawExt === 'jpeg' ? 'jpg' : rawExt.replace(/[^a-z0-9]/g, '');
            const filename  = `${randomUUID()}.${ext}`;
            await writeFile(path.join(uploadDir, filename), imgBuffer);
            const url = `/uploads/${filename}`;
            extractedImageUrls.push(url);
            return { src: url };
          } catch {
            return { src: '' };
          }
        }),
      });

      const html = result.value;
      if (!html.trim()) {
        return NextResponse.json({ error: 'No readable content found in document.' }, { status: 422 });
      }

      const markdown = htmlToMarkdown(html);

      return NextResponse.json({
        text: markdown,
        type: 'docx',
        filename: file.name,
        images: extractedImageUrls,
        imageCount: extractedImageUrls.length,
        wordCount: markdown.split(/\s+/).filter(Boolean).length,
      });
    }

    // ── PDF ──────────────────────────────────────────────────────
    if (name.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      if (!text) return NextResponse.json({ error: 'No readable text found in PDF. Make sure it is not a scanned image.' }, { status: 422 });
      return NextResponse.json({ text, type: 'pdf', pages: data.numpages, filename: file.name, images: [], imageCount: 0, wordCount: text.split(/\s+/).filter(Boolean).length });
    }

    return NextResponse.json({ error: 'Unsupported file type. Please upload a .docx or .pdf file.' }, { status: 400 });

  } catch (err) {
    console.error('[extract-document]', err);
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
  }
}
