import './style.css';
import { generateAndDownloadCV } from './cvGenerator.js';

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

const getProtectedEmail = () => {
  const u = 'rasyidmuhammadabdul';
  const d = 'gmail.com';
  return `${u}@${d}`;
};

const getProtectedWaUrl = () => {
  const country = '62';
  const phone = '89673049122';
  const message = encodeURIComponent("Hello Muhammad Abdul Rasyid, I would like to discuss a systems and infrastructure project with you.");
  return `https://wa.me/${country}${phone}?text=${message}`;
};

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

      // Allow UI update tick before synchronous canvas/pdf work
      await new Promise((resolve) => setTimeout(resolve, 60));

      generateAndDownloadCV();

      label.textContent = 'Downloaded!';
      setTimeout(() => {
        label.textContent = prevText;
        btn.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('Error generating CV PDF:', err);
      label.textContent = prevText;
      btn.disabled = false;
    }
  });
});
