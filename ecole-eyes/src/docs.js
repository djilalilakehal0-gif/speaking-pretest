// Opening documents (PDF, Word, text) and splitting them into pages to read aloud.

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth/mammoth.browser.js';

pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs';

const CHUNK = 1500; // characters per "page" for Word and text files

function chunkText(text) {
  const paras = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const pages = [];
  let cur = '';
  for (const p of paras) {
    if (cur && cur.length + p.length > CHUNK) { pages.push(cur); cur = ''; }
    cur += (cur ? '\n' : '') + p;
    while (cur.length > CHUNK * 2) { pages.push(cur.slice(0, CHUNK)); cur = cur.slice(CHUNK); }
  }
  if (cur) pages.push(cur);
  return pages;
}

// A loaded document. `pageText(i)` returns the text of page i (may need OCR for scans).
class Doc {
  constructor(name, kind) {
    this.name = name;
    this.kind = kind;
    this.pages = []; // cached text per page (null = not yet extracted)
    this.pdf = null;
  }
  get count() { return this.pdf ? this.pdf.numPages : this.pages.length; }

  async rawPageText(i) {
    if (this.pages[i] != null) return this.pages[i];
    if (!this.pdf) return '';
    const page = await this.pdf.getPage(i + 1);
    const tc = await page.getTextContent();
    let text = '';
    let lastY = null;
    for (const item of tc.items) {
      if (!('str' in item)) continue;
      const y = item.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) text += '\n';
      text += item.str + (item.hasEOL ? '\n' : '');
      if (y !== undefined) lastY = y;
    }
    // Join words broken with a hyphen at line ends.
    text = text.replace(/-\n(\p{L})/gu, '$1').replace(/[ \t]+/g, ' ').trim();
    this.pages[i] = text;
    return text;
  }

  // Render a PDF page to a JPEG (base64) for OCR by the AI.
  async pageImage(i) {
    const page = await this.pdf.getPage(i + 1);
    const vp1 = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / Math.max(vp1.width, vp1.height));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  }

  // A text sample of the whole document (for summaries and questions).
  async sample(maxChars = 60000) {
    let out = '';
    for (let i = 0; i < this.count && out.length < maxChars; i++) {
      const t = await this.rawPageText(i);
      if (t) out += `\n[${i + 1}]\n` + t;
    }
    return out.slice(0, maxChars);
  }
}

export async function openFile(file) {
  const name = file.name.replace(/\.[^.]+$/, '');
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const buf = await file.arrayBuffer();

  if (ext === 'pdf' || file.type === 'application/pdf') {
    const doc = new Doc(name, 'pdf');
    doc.pdf = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
    return doc;
  }
  if (ext === 'docx' || /wordprocessingml/.test(file.type)) {
    const r = await mammoth.extractRawText({ arrayBuffer: buf });
    const doc = new Doc(name, 'word');
    doc.pages = chunkText(r.value || '');
    return doc;
  }
  if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) {
    const doc = new Doc(name, 'text');
    doc.pages = chunkText(new TextDecoder().decode(buf));
    return doc;
  }
  if (ext === 'doc') throw new Error('old-doc');
  throw new Error('unsupported');
}

export function docFromText(name, text) {
  const doc = new Doc(name, 'article');
  doc.pages = chunkText(text);
  return doc;
}

// Guess the language of a text: 'ar', 'fr' or 'en'.
export function detectLang(text) {
  const sample = text.slice(0, 3000);
  const arabic = (sample.match(/[؀-ۿ]/g) || []).length;
  const latin = (sample.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  if (arabic > latin) return 'ar';
  const words = sample.toLowerCase().split(/[^a-zà-ÿ']+/);
  const fr = new Set(['le', 'la', 'les', 'des', 'est', 'et', 'une', 'du', 'dans', 'que', 'pour', 'qui', 'sur', 'avec', 'pas', 'au', 'ce', 'sont', 'par', 'à']);
  const en = new Set(['the', 'and', 'of', 'is', 'to', 'in', 'that', 'for', 'with', 'are', 'this', 'on', 'as', 'by', 'be', 'it', 'was', 'from', 'an', 'which']);
  let f = 0, e = 0;
  for (const w of words) { if (fr.has(w)) f++; if (en.has(w)) e++; }
  return f > e ? 'fr' : 'en';
}
