import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

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
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) return NextResponse.json({ error: 'No readable text found in document.' }, { status: 422 });
      return NextResponse.json({ text, type: 'docx', filename: file.name });
    }

    // ── PDF ──────────────────────────────────────────────────────
    if (name.endsWith('.pdf')) {
      // Import from lib path to skip pdf-parse's test-file side effect in Next.js
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      if (!text) return NextResponse.json({ error: 'No readable text found in PDF. Make sure it is not a scanned image.' }, { status: 422 });
      return NextResponse.json({ text, type: 'pdf', pages: data.numpages, filename: file.name });
    }

    return NextResponse.json({ error: 'Unsupported file type. Please upload a .docx or .pdf file.' }, { status: 400 });

  } catch (err) {
    console.error('[extract-document]', err);
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
  }
}
