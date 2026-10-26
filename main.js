/**
 * Portfolio — Main JavaScript
 * Handles: cursor, loader, header, mobile nav, scroll reveals, project slider, form
 */

'use strict';

/* ============================================
   CUSTOM CURSOR
   ============================================ */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  if (!cursor || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    raf = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effect on interactive elements
  const hoverEls = document.querySelectorAll('a, button, [role="button"], input, textarea, select, .project-card, .service-card, .stat-item, .tech-item, .process-step');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hovering');
      ring.classList.add('is-hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hovering');
      ring.classList.remove('is-hovering');
    });
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    ring.style.opacity = '1';
  });
})();

/* ============================================
   PAGE LOADER
   ============================================ */
(function initLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('loaded');
    }, 1000);
  });

  // Fallback: remove after 2s even if load hasn't fired
  setTimeout(() => {
    loader.classList.add('loaded');
  }, 2200);
})();

/* ============================================
   HEADER — SCROLL STATE
   ============================================ */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const update = () => {
    header.setAttribute('data-scrolled', window.scrollY > 20 ? 'true' : 'false');
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ============================================
   MOBILE NAV / BURGER
   ============================================ */
(function initMobileNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('mobileNav');
  if (!burger || !nav) return;

  let isOpen = false;

  burger.addEventListener('click', () => {
    isOpen = !isOpen;
    burger.setAttribute('aria-expanded', String(isOpen));
    nav.setAttribute('aria-hidden', String(!isOpen));
    nav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  nav.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      isOpen = false;
      burger.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      burger.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
      nav.classList.remove('open');
      document.body.style.overflow = '';
      burger.focus();
    }
  });
})();

/* ============================================
   SCROLL REVEAL
   ============================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  });

  elements.forEach(el => observer.observe(el));
})();

/* ============================================
   SKILLS REVEAL (staggered)
   ============================================ */
(function initSkillsReveal() {
  const skills = document.querySelectorAll('[data-skill]');
  if (!skills.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

  skills.forEach(el => observer.observe(el));
})();

/* ============================================
   PROJECT SLIDER — Lucas Aufrere style
   ============================================ */
(function initProjectSlider() {
  const trackWrap = document.getElementById('projectsTrackWrap');
  const track = document.getElementById('projectsTrack');
  const prevBtn = document.getElementById('projPrev');
  const nextBtn = document.getElementById('projNext');
  if (!track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.querySelectorAll('.project-slide'));
  if (!slides.length) return;

  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationId = null;
  let startTime = 0;
  let velocity = 0;
  let lastX = 0;

  // Get slide width including gap
  const getSlideWidth = () => {
    const slide = slides[0];
    const gap = 12; // matches CSS gap: 12px
    return slide.offsetWidth + gap;
  };

  const getMaxTranslate = () => {
    const visibleCount = getVisibleCount();
    const max = slides.length - visibleCount;
    return -(max * getSlideWidth());
  };

  const getVisibleCount = () => {
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 3;
  };

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const snapToIndex = (translate) => {
    const sw = getSlideWidth();
    return Math.round(-translate / sw);
  };

  const applyTranslate = (x, animated = true) => {
    track.style.transition = animated
      ? 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
      : 'none';
    track.style.transform = `translateX(${x}px)`;
    currentTranslate = x;
  };

  const goToIndex = (idx) => {
    const maxIdx = slides.length - getVisibleCount();
    currentIndex = clamp(idx, 0, maxIdx);
    const target = -(currentIndex * getSlideWidth());
    applyTranslate(target, true);
    prevTranslate = target;
    updateArrows();
  };

  const updateArrows = () => {
    const maxIdx = slides.length - getVisibleCount();
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= maxIdx;
  };

  prevBtn.addEventListener('click', () => goToIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToIndex(currentIndex + 1));

  // ---- Drag support ----
  const onDragStart = (x) => {
    isDragging = true;
    startX = x;
    lastX = x;
    startTime = performance.now();
    velocity = 0;
    if (animationId) cancelAnimationFrame(animationId);
    track.style.transition = 'none';
    if (trackWrap) trackWrap.style.cursor = 'grabbing';
  };

  const onDragMove = (x) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = now - startTime;
    velocity = (x - lastX) / (dt || 1) * 16; // px/frame approx
    lastX = x;
    startTime = now;

    const delta = x - startX;
    const raw = prevTranslate + delta;
    const minT = getMaxTranslate();
    // Add rubber-band resistance at boundaries
    let bounded = raw;
    if (raw > 0) bounded = raw * 0.2;
    if (raw < minT) bounded = minT + (raw - minT) * 0.2;
    track.style.transform = `translateX(${bounded}px)`;
    currentTranslate = bounded;
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    if (trackWrap) trackWrap.style.cursor = 'grab';

    const minT = getMaxTranslate();
    // Apply momentum
    let momentum = currentTranslate + velocity * 8;
    momentum = clamp(momentum, minT, 0);
    // Snap to nearest slide
    const idx = snapToIndex(-momentum);
    goToIndex(idx);
    prevTranslate = -(currentIndex * getSlideWidth());
  };

  // Mouse events
  track.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onDragStart(e.clientX);
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) onDragMove(e.clientX);
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) onDragEnd();
  });

  // Touch events
  track.addEventListener('touchstart', (e) => {
    onDragStart(e.touches[0].clientX);
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    onDragMove(e.touches[0].clientX);
  }, { passive: true });
  track.addEventListener('touchend', onDragEnd);

  // Prevent link navigation if dragging
  track.addEventListener('click', (e) => {
    const delta = Math.abs(e.clientX - startX);
    if (delta > 8) e.preventDefault();
  }, true);

  // Resize reset
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      goToIndex(currentIndex);
    }, 200);
  });

  // Init
  updateArrows();
})();

/* ============================================
   CONTACT FORM
   ============================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'rgba(192,57,43,0.5)';
        valid = false;
        field.addEventListener('input', () => {
          field.style.borderColor = '';
        }, { once: true });
      }
    });
    if (!valid) return;

    // Simulate send (replace with real endpoint)
    const btn = form.querySelector('#formSubmit');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      if (success) success.classList.add('shown');
    }, 1200);
  });
})();

/* ============================================
   HERO TILE GRID (decorative)
   ============================================ */
(function initHeroTiles() {
  const container = document.getElementById('heroTiles');
  if (!container) return;

  const cols = 6;
  const rows = 10;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement('span');
      tile.style.cssText = `
        display:block;
        border-right: 1px solid rgba(200,184,154,0.04);
        border-bottom: 1px solid rgba(200,184,154,0.04);
        transition: background ${0.3 + Math.random() * 0.3}s ease;
      `;
      tile.addEventListener('mouseenter', () => {
        tile.style.background = 'rgba(200,184,154,0.06)';
      });
      tile.addEventListener('mouseleave', () => {
        tile.style.background = 'transparent';
      });
      container.appendChild(tile);
    }
  }
})();

/* ============================================
   SMOOTH PAGE TRANSITIONS
   ============================================ */
(function initPageTransitions() {
  // Add a subtle fade out on link clicks (same-origin only)
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.25s ease';
      setTimeout(() => {
        window.location.href = href;
      }, 250);
    });
  });

  // Fade in on load
  document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
      document.body.style.transition = 'opacity 0.35s ease';
      document.body.style.opacity = '1';
    }, 50);
  });
})();

/* ============================================
   STAT COUNTER ANIMATION
   ============================================ */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-value');
  if (!stats.length) return;

  const animateCount = (el, end, suffix) => {
    const startTime = performance.now();
    const duration = 1500;
    const num = parseInt(end);
    if (isNaN(num)) return; // skip non-numeric like '∞'

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * num);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        const match = text.match(/^(\d+)(.*)$/);
        if (match) animateCount(el, match[1], match[2]);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();

/* ============================================
   KEYBOARD NAVIGATION ENHANCEMENT
   ============================================ */
(function initKeyboardNav() {
  // Show focus outlines only for keyboard users
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
  });
})();
