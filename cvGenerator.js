import { jsPDF } from 'jspdf';

/**
 * Extracts portfolio content from the DOM and builds an A4 PDF resume.
 * Every line is placed manually with one line-height rule, so spacing is
 * predictable and does not depend on jsPDF's lineHeightFactor.
 */
export async function generateAndDownloadCV() {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });

  // ── Page geometry ───────────────────────────────────────────────────────────
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_X = 16;
  const MARGIN_TOP = 18;
  const MARGIN_BOTTOM = 17; // room for footer
  const CONTENT_W = PAGE_W - MARGIN_X * 2; // 178mm
  const RIGHT_X = MARGIN_X + CONTENT_W;

  // ── Spacing scale (mm). Use ONLY these numbers for gaps ─────────────────────
  const GAP = {
    xs: 1.2,       // between bullets
    sm: 2.5,       // title -> content
    md: 5,         // between items (projects, roles)
    lg: 9          // before a section header
  };

  // ── Typography ──────────────────────────────────────────────────────────────
  const PT = 0.3528;     // 1pt in mm
  const LH_FACTOR = 1.45;
  const lh = (size) => size * PT * LH_FACTOR; // line height in mm for a font size

  const SIZE = {
    name: 19,
    role: 9.5,
    meta: 8,
    section: 10.5,
    itemTitle: 9.5,
    sub: 8.5,
    body: 8.5,
    tag: 7.5
  };

  // ── Colors ──────────────────────────────────────────────────────────────────
  const NAVY = [32, 51, 79];
  const BLUE = [38, 118, 243];
  const BODY = [52, 71, 97];
  const MUTED = [102, 117, 138];
  const LINE = [215, 222, 232];

  let y = MARGIN_TOP;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  /** Strip characters Helvetica (WinAnsi) cannot draw, so widths stay correct. */
  const clean = (t = '') =>
    String(t)
      .replace(/\u2192|\u21D2/g, '->')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2014/g, ' - ')
      .replace(/\u2013/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/[\u00A0\u2009\u202F]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\u0020-\u007E\u00A0-\u00FF\u2022]/g, '')
      .trim();

  const font = (style, size, color) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  /** Starts a new page if `needed` mm does not fit. */
  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
      return true;
    }
    return false;
  };

  /** Draws one line; text baseline sits at y + ascent so blocks stack evenly. */
  const drawLine = (text, x, opts = {}) => {
    doc.text(text, x, y, opts);
  };

  /**
   * Draws a wrapped paragraph. Lines are placed one by one at lh(size).
   * Justified lines are spread word by word. The last line stays left-aligned,
   * and a line is left alone if justifying would open large gaps.
   */
  const paragraph = (text, { x = MARGIN_X, width = CONTENT_W, size = SIZE.body, style = 'normal', color = BODY, justify = true } = {}) => {
    const str = clean(text);
    if (!str) return;
    font(style, size, color);
    const lines = doc.splitTextToSize(str, width);
    const step = lh(size);

    lines.forEach((line, i) => {
      ensureSpace(step);
      font(style, size, color);
      y += step;

      const isLast = i === lines.length - 1;
      const words = line.split(' ');
      if (justify && !isLast && words.length > 1) {
        const wordsW = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
        const gap = (width - wordsW) / (words.length - 1);
        const normalGap = doc.getTextWidth(' ');
        if (gap <= normalGap * 2.2) {
          let cx = x;
          words.forEach((w) => {
            doc.text(w, cx, y);
            cx += doc.getTextWidth(w) + gap;
          });
          return;
        }
      }
      doc.text(line, x, y);
    });
  };

  const sectionHeader = (title) => {
    ensureSpace(GAP.lg + lh(SIZE.section) + GAP.sm + 20); // keep header with its content
    y += GAP.lg;
    font('bold', SIZE.section, NAVY);
    y += lh(SIZE.section);
    drawLine(title.toUpperCase(), MARGIN_X);
    y += 1.8;
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, y, RIGHT_X, y);
    y += GAP.sm;
  };

  const loadImageAsBase64 = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({ data: canvas.toDataURL('image/jpeg', 0.92), w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  // ── 1. Header ───────────────────────────────────────────────────────────────
  const PHOTO_W = 26;
  const PHOTO_H = 34; // 3:4 portrait, matches the ID-style photo
  const headerTextW = CONTENT_W - PHOTO_W - 6;
  const headerTop = y;

  let photo = null;
  const imgEl = document.querySelector('#about img[src*="profil"]');
  if (imgEl) photo = await loadImageAsBase64(imgEl.currentSrc || imgEl.src);
  if (!photo) photo = await loadImageAsBase64('./profil.webp');

  if (photo) {
    // Center-crop to the target ratio via a canvas so the photo is never stretched
    const target = PHOTO_W / PHOTO_H;
    const srcRatio = photo.w / photo.h;
    const tmp = await new Promise((resolve) => {
      const im = new Image();
      im.onload = () => {
        let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
        if (srcRatio > target) { sw = sh * target; sx = (im.naturalWidth - sw) / 2; }
        else { sh = sw / target; sy = 0; }
        const c = document.createElement('canvas');
        c.width = Math.round(sw);
        c.height = Math.round(sh);
        c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.92));
      };
      im.onerror = () => resolve(null);
      im.src = photo.data;
    });
    if (tmp) {
      doc.addImage(tmp, 'JPEG', RIGHT_X - PHOTO_W, headerTop, PHOTO_W, PHOTO_H);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.rect(RIGHT_X - PHOTO_W, headerTop, PHOTO_W, PHOTO_H);
    }
  }

  font('bold', SIZE.name, NAVY);
  y += lh(SIZE.name);
  drawLine('MUHAMMAD ABDUL RASYID', MARGIN_X);

  y += GAP.xs + lh(SIZE.role);
  font('bold', SIZE.role, BLUE);
  drawLine('SYSTEMS ENGINEER & IOT DEVELOPER  |  ROBOTICS ENGINEER', MARGIN_X);

  y += GAP.sm;
  font('normal', SIZE.meta, MUTED);
  [
    'Purbalingga, Central Java, Indonesia',
    'rasyidmuhammadabdul@gmail.com  |  +62 896-7304-9122',
    'github.com/MASR170902  |  linkedin.com/in/muhammadabdulrasyid-dev'
  ].forEach((txt) => {
    y += lh(SIZE.meta);
    drawLine(txt, MARGIN_X);
  });

  y = Math.max(y, headerTop + PHOTO_H) + GAP.md;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, RIGHT_X, y);

  // ── 2. Professional Summary ─────────────────────────────────────────────────
  sectionHeader('Professional Summary');

  const aboutParagraphs = Array.from(document.querySelectorAll('#about .about-copy p'))
    .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const summary = aboutParagraphs.length
    ? aboutParagraphs.slice(0, 3).join(' ')
    : 'Systems engineer with expertise across embedded microcontrollers, Proxmox VE virtualization, multi-subnet MikroTik routing, and Linux infrastructure.';

  paragraph(summary);

  // ── 3. Professional Experience ──────────────────────────────────────────────
  sectionHeader('Professional Experience');

  const roles = Array.from(document.querySelectorAll('#experience article'));
  roles.forEach((article, idx) => {
    const title = clean(article.querySelector('.role-title')?.textContent) || 'Engineer';
    const period = clean(article.querySelector('.role-period')?.textContent);
    const company = clean(article.querySelector('.role-company')?.textContent);
    const bullets = Array.from(article.querySelectorAll('ul li')).map((li) =>
      clean(li.textContent.replace(/^[\u2022\s-]+/, ''))
    );

    if (idx > 0) y += GAP.md;
    ensureSpace(lh(SIZE.itemTitle) + lh(SIZE.sub) + lh(SIZE.body) * 3);

    font('bold', SIZE.itemTitle, NAVY);
    y += lh(SIZE.itemTitle);
    drawLine(title, MARGIN_X);
    font('bold', SIZE.meta, BLUE);
    drawLine(period, RIGHT_X, { align: 'right' });

    if (company) {
      font('italic', SIZE.sub, MUTED);
      y += lh(SIZE.sub);
      drawLine(company, MARGIN_X);
    }
    y += GAP.xs;

    bullets.forEach((b, bi) => {
      if (bi > 0) y += GAP.xs;
      ensureSpace(lh(SIZE.body) * 2);
      const bulletY = y + lh(SIZE.body);
      font('bold', SIZE.body, BLUE);
      doc.text('-', MARGIN_X + 1, bulletY);
      paragraph(b, { x: MARGIN_X + 5, width: CONTENT_W - 5 });
    });
  });

  // ── 4. Featured Projects ────────────────────────────────────────────────────
  sectionHeader('Featured Technical Projects');

  const projects = Array.from(document.querySelectorAll('#projects article'));
  projects.forEach((article, idx) => {
    const title = clean(article.querySelector('h3')?.textContent) || 'Project';
    const raw = clean(article.querySelector('.project-description')?.textContent || article.querySelector('p.mt-2\\.5')?.textContent);
    const desc = raw.length > 900 ? raw.slice(0, 897).trimEnd() + '...' : raw;
    const tags = Array.from(article.querySelectorAll('.border-t span.rounded-full'))
      .map((s) => clean(s.textContent))
      .filter(Boolean);

    if (idx > 0) y += GAP.md;
    // Title + tags + first two description lines must stay together
    ensureSpace(lh(SIZE.itemTitle) + lh(SIZE.tag) * 2 + lh(SIZE.body) * 2 + GAP.sm);

    font('bold', SIZE.itemTitle, NAVY);
    y += lh(SIZE.itemTitle);
    drawLine(title, MARGIN_X);

    if (tags.length) {
      y += GAP.xs;
      font('normal', SIZE.tag, BLUE);
      const tagLines = doc.splitTextToSize(tags.join('  |  '), CONTENT_W);
      tagLines.forEach((t) => {
        y += lh(SIZE.tag);
        drawLine(t, MARGIN_X);
      });
    }

    y += GAP.xs;
    paragraph(desc);
  });

  // ── 5. Expertise ────────────────────────────────────────────────────────────
  sectionHeader('Core Technical Proficiencies & Certifications');

  const cards = Array.from(document.querySelectorAll('#expertise .rounded-2xl'))
    .map((card) => ({
      name: clean(card.querySelector('h3')?.textContent),
      skills: Array.from(card.querySelectorAll('span.rounded-full')).map((s) => clean(s.textContent)).filter(Boolean)
    }))
    .filter((c) => c.name);

  // One shared label column keeps every skill list on the same left edge
  font('bold', SIZE.body, NAVY);
  const labelW = Math.max(...cards.map((c) => doc.getTextWidth(`${c.name}:`))) + 3;
  const skillsW = CONTENT_W - labelW;

  cards.forEach((c, i) => {
    if (i > 0) y += GAP.xs + 0.8;
    font('normal', SIZE.body, BODY);
    const lines = doc.splitTextToSize(c.skills.join('  \u2022  '), skillsW);
    ensureSpace(lh(SIZE.body) * lines.length);

    font('bold', SIZE.body, NAVY);
    doc.text(`${c.name}:`, MARGIN_X, y + lh(SIZE.body));

    font('normal', SIZE.body, BODY);
    lines.forEach((ln) => {
      y += lh(SIZE.body);
      doc.text(ln, MARGIN_X + labelW, y);
    });
  });

  // ── 6. Footer on every page ─────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, PAGE_H - 12, RIGHT_X, PAGE_H - 12);
    font('normal', 7.5, MUTED);
    doc.text('Muhammad Abdul Rasyid  |  Curriculum Vitae  |  https://abdulrasyid.my.id/', MARGIN_X, PAGE_H - 8);
    doc.text(`Page ${i} of ${total}`, RIGHT_X, PAGE_H - 8, { align: 'right' });
  }

  doc.save('CV_Muhammad_Abdul_Rasyid.pdf');
}
