import './style.css';
import { renderAdminPage } from './admin-panel.js';
import { generateAndDownloadCV } from './cvGenerator.js';
import { getProtectedEmail, getProtectedWaUrl } from './contactDetails.js';

if (location.pathname === '/admin' || location.pathname === '/admin/') {
  renderAdminPage().catch((error) => {
    console.error('Unable to render the admin page:', error);
    document.body.textContent = 'The admin page could not be loaded. Please reload and try again.';
  });
} else {

const navToggle = document.querySelector('#nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const navIconOpen = document.querySelector('#nav-icon-open');
const navIconClose = document.querySelector('#nav-icon-close');
const navLinks = document.querySelectorAll('nav a');
const yearTarget = document.querySelector('#year');

// Dynamic Copyright Year
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const projectList = document.querySelector('#project-list');
const experienceList = document.querySelector('#experience-list');
const certificateList = document.querySelector('#certificate-list');

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createExternalLink(link, className) {
  const anchor = document.createElement('a');
  anchor.href = link.url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = className;
  anchor.textContent = link.label;
  return anchor;
}

function renderProjects(projects) {
  const cards = projects.map((project) => {
    const article = document.createElement('article');
    article.className = 'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-blue sm:rounded-[26px]';

    const visual = document.createElement('div');
    visual.className = 'flex min-h-[13rem] items-center justify-center overflow-hidden border-b border-border bg-[#101827] p-5 text-white';
    if (project.imageUrl) {
      const image = document.createElement('img');
      image.src = project.imageUrl;
      image.alt = project.title;
      image.loading = 'lazy';
      image.className = 'h-52 w-full rounded-xl object-cover';
      visual.append(image);
    } else {
      const visualText = document.createElement('div');
      visualText.className = 'max-w-sm text-center';
      visualText.append(
        createTextElement('p', 'text-xs font-bold uppercase tracking-[0.25em] text-blue', project.category),
        createTextElement('p', 'mt-3 text-xl font-black text-white sm:text-2xl', project.title)
      );
      visual.append(visualText);
    }

    const details = document.createElement('div');
    details.className = 'p-6';
    const headingRow = document.createElement('div');
    headingRow.className = 'flex flex-wrap items-center justify-between gap-3';
    headingRow.append(createTextElement(
      'span',
      'rounded-full bg-blue/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue',
      project.category
    ));
    const links = document.createElement('div');
    links.className = 'flex flex-wrap gap-x-3 gap-y-1';
    project.links.forEach((link) => {
      links.append(createExternalLink(
        { ...link, label: `${link.label} ↗` },
        'shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-blue transition-colors duration-200 hover:text-blueHover'
      ));
    });
    headingRow.append(links);
    details.append(
      headingRow,
      createTextElement('h3', 'mt-3 text-lg font-bold text-navy sm:text-xl', project.title),
      createTextElement('p', 'project-description prose-copy text-justify leading-relaxed mt-2.5 text-sm text-navySoft', project.description)
    );

    const footer = document.createElement('div');
    footer.className = 'mt-auto border-t border-border/60 bg-slate-50/50 p-6';
    const tags = document.createElement('div');
    tags.className = 'flex flex-wrap gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-navySoft sm:gap-2';
    project.tags.forEach((tag) => {
      tags.append(createTextElement('span', 'rounded-full border border-border bg-white px-2.5 py-1', tag));
    });
    footer.append(tags);
    article.append(visual, details, footer);
    return article;
  });
  projectList.replaceChildren(...cards);
  projectList.classList.remove('hidden');
}

function renderExperience(experiences) {
  const articles = experiences.map((experience, index) => {
    const article = document.createElement('article');
    article.className = 'relative';
    const marker = document.createElement('span');
    marker.className = `absolute -left-[1.55rem] top-1 h-3.5 w-3.5 rounded-full border-4 border-white shadow-soft sm:-left-[1.8rem] ${index === 0 ? 'bg-blue' : 'bg-navySoft'}`;
    const period = createTextElement(
      'p',
      `role-period text-xs font-semibold uppercase tracking-[0.22em] ${index === 0 ? 'text-blue' : 'text-muted'}`,
      experience.period
    );
    const title = createTextElement('h3', 'role-title mt-1 text-xl font-bold text-navy sm:text-2xl', experience.title);
    const company = createTextElement('p', 'role-company mt-0.5 text-sm font-medium text-navySoft sm:text-base', experience.company);
    const bullets = document.createElement('ul');
    bullets.className = 'prose-copy text-justify leading-relaxed mt-4 space-y-4 text-sm text-navySoft sm:text-base';
    experience.bullets.forEach((bullet) => bullets.append(createTextElement('li', '', `• ${bullet}`)));
    article.append(marker, period, title, company, bullets);
    return article;
  });
  experienceList.replaceChildren(...articles);
  experienceList.classList.remove('hidden');
}

function renderCertificates(certificates) {
  const cards = certificates.map((certificate) => {
    const article = document.createElement('article');
    article.className = 'certificate-item flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all duration-200 hover:border-blue sm:rounded-[24px]';

    const previewLink = document.createElement('a');
    previewLink.href = certificate.fileUrl;
    previewLink.target = '_blank';
    previewLink.rel = 'noopener noreferrer';
    previewLink.className = 'flex h-56 items-center justify-center overflow-hidden border-b border-border bg-slate-50 p-4';
    previewLink.setAttribute('aria-label', `Open certificate: ${certificate.title}`);

    if (certificate.fileType === 'image' || certificate.previewUrl) {
      const image = document.createElement('img');
      image.src = certificate.previewUrl || certificate.fileUrl;
      image.alt = `Certificate: ${certificate.title}`;
      image.loading = 'lazy';
      image.className = 'h-full w-full object-contain';
      previewLink.append(image);
    } else {
      previewLink.append(createTextElement(
        'span',
        'rounded-xl border border-blue/20 bg-blue/10 px-6 py-4 text-2xl font-black tracking-widest text-blue',
        'PDF'
      ));
    }

    const details = document.createElement('div');
    details.className = 'flex flex-1 flex-col p-5';
    details.append(
      createTextElement('h3', 'certificate-title text-base font-bold leading-snug text-navy', certificate.title),
      createTextElement('p', 'certificate-issuer mt-2 text-sm font-medium text-navySoft', certificate.issuer)
    );
    if (certificate.date) {
      details.append(createTextElement('p', 'certificate-date mt-1 text-xs text-muted', certificate.date));
    }
    if (certificate.credentialId) {
      details.append(createTextElement('p', 'certificate-id mt-1 text-xs text-muted', certificate.credentialId));
    }
    if (certificate.note) {
      details.append(createTextElement('p', 'certificate-note mt-3 text-xs leading-relaxed text-muted', certificate.note));
    }

    const actions = document.createElement('div');
    actions.className = 'mt-auto flex flex-wrap gap-4 pt-5 text-sm font-semibold';
    const viewLink = createExternalLink(
      { label: 'View certificate', url: certificate.fileUrl },
      'certificate-file-link text-blue transition-colors hover:text-blueHover'
    );
    actions.append(viewLink);
    if (certificate.verificationUrl) {
      actions.append(createExternalLink(
        { label: 'Verify online', url: certificate.verificationUrl },
        'certificate-verify-link text-navySoft transition-colors hover:text-blue'
      ));
    }
    details.append(actions);
    article.append(previewLink, details);
    return article;
  });
  certificateList.replaceChildren(...cards);
}

function showContentError(message) {
  [projectList, experienceList, certificateList].filter(Boolean).forEach((list) => {
    list.classList.remove('hidden');
    list.replaceChildren(createTextElement(
      'p',
      'col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800',
      message
    ));
  });
}

const contentReady = fetch('/api/content')
  .then(async (response) => {
    if (!response.ok) throw new Error(`Content request failed (${response.status}).`);
    const content = await response.json();
    if (!Array.isArray(content.projects) || !Array.isArray(content.experiences) || !Array.isArray(content.certificates)) {
      throw new Error('The content API returned an invalid response.');
    }
    renderProjects(content.projects);
    renderExperience(content.experiences);
    renderCertificates(content.certificates);
    return content;
  })
  .catch((error) => {
    console.error('Unable to load portfolio content:', error);
    showContentError('Portfolio content could not be loaded. Please refresh the page or try again later.');
    return null;
  });

// Mobile Menu Toggle & Behavior
if (navToggle && navMenu) {
  const setMenuState = (isOpen) => {
    navMenu.classList.toggle('hidden', !isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    if (navIconOpen && navIconClose) {
      navIconOpen.classList.toggle('hidden', isOpen);
      navIconClose.classList.toggle('hidden', !isOpen);
    }
  };

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = navMenu.classList.contains('hidden');
    setMenuState(willOpen);
  });

  // Close when clicking any nav link
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        setMenuState(false);
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      setMenuState(false);
    }
  });

  // Reset on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      setMenuState(false);
    }
  });
}

// Obfuscated Contact Actions (Anti-Scrape Protection)
const contactEmailBtn = document.querySelector('#btn-contact-email');
const copyEmailBtn = document.querySelector('#btn-copy-email');
const contactWaBtn = document.querySelector('#btn-contact-wa');

if (contactEmailBtn) {
  contactEmailBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `mailto:${getProtectedEmail()}`;
  });
}

if (copyEmailBtn) {
  copyEmailBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(getProtectedEmail());
      const label = copyEmailBtn.querySelector('.copy-label');
      if (label) {
        const prevText = label.textContent;
        label.textContent = 'Email Copied!';
        copyEmailBtn.classList.add('bg-blue', 'text-white', 'border-blue');
        setTimeout(() => {
          label.textContent = prevText;
          copyEmailBtn.classList.remove('bg-blue', 'text-white', 'border-blue');
        }, 2200);
      }
    } catch {
      window.location.href = `mailto:${getProtectedEmail()}`;
    }
  });
}

if (contactWaBtn) {
  contactWaBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(getProtectedWaUrl(), '_blank', 'noopener,noreferrer');
  });
}

// ── Scroll Spy with Bottom-Threshold Support ────────────────────────────────
const sections = [...document.querySelectorAll('section[id]')];
const allNavLinks = [...document.querySelectorAll('nav a[href^="#"]')];

const setActiveNavLink = (currentId) => {
  allNavLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${currentId}`;
    link.classList.toggle('text-blue', isActive);
    if (!link.classList.contains('mobile-nav-link')) {
      link.classList.toggle('text-navySoft', !isActive);
      link.classList.toggle('font-bold', isActive);
    }
  });
};

if (sections.length && allNavLinks.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      // If we are at the bottom of the page, let the scroll listener lock to #contact
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70;
      if (atBottom) {
        setActiveNavLink('contact');
        return;
      }

      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (!visibleEntries.length) return;

      const currentId = visibleEntries[0].target.id;
      setActiveNavLink(currentId);
    },
    {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0.15, 0.35, 0.55]
    }
  );

  sections.forEach((section) => navObserver.observe(section));

  // Explicit window scroll listener to fix bottom section (Contact) highlight bug
  window.addEventListener(
    'scroll',
    () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70;
      if (atBottom) {
        setActiveNavLink('contact');
      }
    },
    { passive: true }
  );
}

// ── Dynamic CV PDF Generation ───────────────────────────────────────────────
const cvButtons = document.querySelectorAll('.btn-download-cv');
cvButtons.forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const label = btn.querySelector('.btn-cv-text') || btn;
    const prevText = label.textContent;

    try {
      label.textContent = 'Generating PDF...';
      btn.disabled = true;

      const content = await contentReady;
      if (!content) throw new Error('Portfolio content is unavailable.');

      // Allow UI update tick before synchronous canvas/pdf work
      await new Promise((resolve) => setTimeout(resolve, 60));

      await generateAndDownloadCV();

      label.textContent = 'Downloaded!';
      setTimeout(() => {
        label.textContent = prevText;
        btn.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('Error generating CV PDF:', err);
      label.textContent = 'Download failed';
      setTimeout(() => {
        label.textContent = prevText;
        btn.disabled = false;
      }, 2500);
    }
  });
});
}
