import { jsPDF } from 'jspdf';

/**
 * Dynamically extracts portfolio content from the DOM and generates
 * a clean, executive A4 PDF resume.
 */
export function generateAndDownloadCV() {
  const doc = new jsPDF({
    format: 'a4',
    unit: 'mm',
    orientation: 'portrait'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  let y = 16;

  // Design Tokens (Cool Gray + Navy + Electric Blue)
  const COLOR_NAVY = [32, 51, 79];       // #20334F
  const COLOR_BLUE = [38, 118, 243];     // #2676F3
  const COLOR_BODY = [52, 71, 97];       // #344761
  const COLOR_MUTED = [102, 117, 138];   // #66758A
  const COLOR_LINE = [215, 222, 232];    // #D7DEE8

  function checkPageBreak(requiredHeight) {
    if (y + requiredHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      return true;
    }
    return false;
  }

  function renderSectionHeader(title) {
    checkPageBreak(12);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(title.toUpperCase(), marginX, y);
    y += 2;
    doc.setDrawColor(...COLOR_BLUE);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 4.5;
  }

  // ── 1. Header / Contact Information ─────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...COLOR_NAVY);
  doc.text('MUHAMMAD ABDUL RASYID', marginX, y);
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_BLUE);
  doc.text('SYSTEMS ENGINEER & IOT DEVELOPER  •  ROBOTICS ENGINEER', marginX, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  const contactLine = 'Purbalingga, Central Java, Indonesia  |  rasyidmuhammadabdul@gmail.com  |  +62 896-7304-9122';
  doc.text(contactLine, marginX, y);
  y += 3.5;

  const linksLine = 'GitHub: github.com/MASR170902  |  LinkedIn: linkedin.com/in/muhammadabdulrasyid-dev';
  doc.text(linksLine, marginX, y);
  y += 4;

  doc.setDrawColor(...COLOR_LINE);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 3;

  // ── 2. Professional Summary (Extracted from #about) ──────────────────────────
  renderSectionHeader('Professional Summary');

  const aboutParagraphs = Array.from(document.querySelectorAll('#about .space-y-4 p'))
    .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const summaryText = aboutParagraphs.length
    ? aboutParagraphs.slice(0, 2).join(' ')
    : 'Systems engineer with deep expertise across embedded microcontrollers, Proxmox VE virtualization, multi-subnet MikroTik routing, and high-availability Linux infrastructure. Focused on building production-grade systems with verifiable uptime, automated recovery, and robust documentation.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_BODY);
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryText, marginX, y, { maxWidth: contentWidth, align: 'justify' });
  y += summaryLines.length * 4 + 2;

  // ── 3. Professional Experience (Extracted from #experience) ──────────────────
  renderSectionHeader('Professional Experience');

  const experienceArticles = Array.from(document.querySelectorAll('#experience article'));

  experienceArticles.forEach((article) => {
    const roleTitle = article.querySelector('.role-title, h3')?.textContent.trim() || 'Engineer';
    const period = article.querySelector('.role-period, p')?.textContent.trim() || '';
    
    // Reliably extract company name using explicit class or second paragraph
    const company = article.querySelector('.role-company')?.textContent.trim() 
      || Array.from(article.querySelectorAll('p'))
          .map((p) => p.textContent.trim())
          .find((t) => t && t !== period && !t.includes('•'))
      || '';

    const bullets = Array.from(article.querySelectorAll('ul li')).map((li) =>
      li.textContent.replace(/^[•\s-]+/, '').trim()
    );

    checkPageBreak(18 + bullets.length * 6);

    // Role & Period
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(roleTitle, marginX, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_BLUE);
    doc.text(period, marginX + contentWidth, y, { align: 'right' });
    y += 4;

    // Company
    if (company) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(company, marginX, y);
      y += 4;
    }

    // Bullets (Justified for executive clean alignment)
    bullets.forEach((bullet) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(...COLOR_BODY);

      const bulletLines = doc.splitTextToSize(bullet, contentWidth - 6);
      checkPageBreak(bulletLines.length * 3.8 + 1.5);

      doc.setTextColor(...COLOR_BLUE);
      doc.text('•', marginX + 1.5, y);
      doc.setTextColor(...COLOR_BODY);
      doc.text(bullet, marginX + 5.5, y, { maxWidth: contentWidth - 6, align: 'justify' });
      y += bulletLines.length * 3.8 + 1.2;
    });

    y += 2.5;
  });

  // ── 4. Featured Engineering Projects (Extracted from #projects) ─────────────
  renderSectionHeader('Featured Technical Projects');

  const projectArticles = Array.from(document.querySelectorAll('#projects article'));

  projectArticles.forEach((article) => {
    const projectTitle = article.querySelector('h3')?.textContent.trim() || 'Project';
    const projectDesc = article.querySelector('p.mt-2\\.5')?.textContent.replace(/\s+/g, ' ').trim() || '';
    const tags = Array.from(article.querySelectorAll('.border-t span.rounded-full'))
      .map((span) => span.textContent.trim())
      .filter(Boolean);

    const descLines = doc.splitTextToSize(projectDesc, contentWidth);
    checkPageBreak(descLines.length * 3.6 + 9);

    // Title + Tech Tags inline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(projectTitle, marginX, y);

    if (tags.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_BLUE);
      const tagStr = `[ ${tags.slice(0, 4).join(' | ')} ]`;
      doc.text(tagStr, marginX + contentWidth, y, { align: 'right' });
    }
    y += 3.8;

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_BODY);
    doc.text(projectDesc, marginX, y, { maxWidth: contentWidth, align: 'justify' });
    y += descLines.length * 3.6 + 2.5;
  });

  // ── 5. Technical Expertise & Certifications (Extracted from #expertise) ──────
  renderSectionHeader('Core Technical Proficiencies & Certifications');

  const expertiseCards = Array.from(document.querySelectorAll('#expertise .rounded-2xl'));

  expertiseCards.forEach((card) => {
    const categoryName = card.querySelector('h3')?.textContent.trim() || '';
    const skillChips = Array.from(card.querySelectorAll('span.rounded-full'))
      .map((span) => span.textContent.trim())
      .filter(Boolean);

    if (!categoryName) return;

    checkPageBreak(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR_NAVY);
    doc.text(`${categoryName}:`, marginX, y);

    const titleWidth = doc.getTextWidth(`${categoryName}: `);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_BODY);

    const skillsLine = doc.splitTextToSize(skillChips.join('  •  '), contentWidth - titleWidth);
    doc.text(skillsLine, marginX + titleWidth + 1, y);
    y += skillsLine.length * 3.8 + 1.2;
  });

  // ── 6. Running Footer on All Pages ──────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLOR_LINE);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      'Muhammad Abdul Rasyid  •  Curriculum Vitae  •  https://abdulrasyid.my.id/',
      marginX,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, marginX + contentWidth, pageHeight - 8, { align: 'right' });
  }

  // Save the generated document
  doc.save('CV_Muhammad_Abdul_Rasyid.pdf');
}

