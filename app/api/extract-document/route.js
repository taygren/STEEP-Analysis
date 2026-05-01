import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = (file.name || '').toLowerCase();

    // ── Word document (.docx / .doc) ─────────────────────────────
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const mammoth = (await import('mammoth')).default;
      const TurndownService = (await import('turndown')).default;
      const { gfm } = await import('turndown-plugin-gfm');

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const extractedImageUrls = [];

      // ── mammoth: HTML with images saved to /uploads/ ─────────────
      const result = await mammoth.convertToHtml({ buffer }, {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Caption'] => p.caption:fresh",
          "b => strong",
          "i => em",
        ],
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imgBuffer = await image.read();
            const mimeType = image.contentType || 'image/jpeg';
            const rawExt   = mimeType.split('/')[1] || 'jpg';
            const ext      = rawExt === 'jpeg' ? 'jpg' : rawExt.replace(/[^a-z0-9]/g, '');
            const filename = `${randomUUID()}.${ext}`;
            await writeFile(path.join(uploadDir, filename), imgBuffer);
            const url = `/uploads/${filename}`;
            extractedImageUrls.push(url);
            return { src: url, alt: 'Figure' };
          } catch {
            return { src: '', alt: '' };
          }
        }),
      });

      const html = result.value;
      if (!html.trim()) {
        return NextResponse.json({ error: 'No readable content found in document.' }, { status: 422 });
      }

      // ── Turndown: HTML → clean GFM markdown ──────────────────────
      const td = new TurndownService({
        headingStyle:    'atx',
        hr:              '---',
        bulletListMarker:'-',
        codeBlockStyle:  'fenced',
        emDelimiter:     '*',
        strongDelimiter: '**',
      });

      // GFM plugin adds table support, task lists, strikethrough
      td.use(gfm);

      // Ensure our /uploads/ image URLs are preserved exactly
      td.addRule('siteImages', {
        filter: 'img',
        replacement: (_content, node) => {
          const src = node.getAttribute('src') || '';
          const alt = (node.getAttribute('alt') || 'Figure').trim();
          if (!src) return '';
          return `\n\n![${alt}](${src})\n\n`;
        },
      });

      // Caption paragraphs → italicised line
      td.addRule('caption', {
        filter: (node) => node.nodeName === 'P' && node.classList?.contains('caption'),
        replacement: (content) => `\n\n*${content.trim()}*\n\n`,
      });

      let markdown = td.turndown(html);

      // Tidy up whitespace
      markdown = markdown
        .replace(/\n{4,}/g, '\n\n\n')
        .replace(/^\n+/, '')
        .trim();

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
      return NextResponse.json({
        text,
        type: 'pdf',
        pages: data.numpages,
        filename: file.name,
        images: [],
        imageCount: 0,
        wordCount: text.split(/\s+/).filter(Boolean).length,
      });
    }

    return NextResponse.json({ error: 'Unsupported file type. Please upload a .docx or .pdf file.' }, { status: 400 });

  } catch (err) {
    console.error('[extract-document]', err);
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
  }
}
