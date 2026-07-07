// Pitch Partners website interactions
// Stable build: mobile menu, deterministic anchor scrolling, reveal animation,
// calculators, premium motion and form fallback.

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const header = document.querySelector('.topbar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  // External apps such as WhatsApp/Safari can restore the previous scroll
  // position for a clean root URL. Clean visits must always start at top.
  let userHasManuallyScrolled = false;
  const markUserScroll = () => { userHasManuallyScrolled = true; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((eventName) => {
    window.addEventListener(eventName, markUserScroll, { once: true, passive: true });
  });

  function forceTopForCleanUrl() {
    if (window.location.hash || userHasManuallyScrolled) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  forceTopForCleanUrl();

  function closeMenu() {
    if (!navLinks || !menuToggle) return;
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function getHeaderOffset() {
    return Math.ceil(header ? header.getBoundingClientRect().height : 84);
  }

  function getTargetFromHash(hash) {
    if (!hash || hash === '#') return null;
    if (hash === '#top') return document.body;
    const id = decodeURIComponent(hash.slice(1));
    return document.getElementById(id);
  }

  function getVisualAnchor(target) {
    if (!target || target === document.body) return target;

    const id = target.id || '';
    const visualTargets = {
      school: '.school-section .section-heading',
      pricing: '.pricing-section .section-heading',
      grades: '.grades-section .section-heading',
      pathways: '.cards-section .section-heading',
      private: '#private',
      philosophy: '.director-philosophy',
      director: '#director-profile',
      team: '.team-section .section-heading',
      contact: '.contact-copy',
      consultation: '#consultation',
      'information-terms': '.legal-intro'
    };

    if (visualTargets[id]) {
      const visual = document.querySelector(visualTargets[id]);
      if (visual) return visual;
    }

    if (target.tagName?.toLowerCase() === 'details') {
      target.open = true;
      return target.querySelector('summary') || target;
    }

    if (target.matches?.('section')) {
      return target.querySelector('.section-heading, .legal-intro, .contact-copy, .consult-form') || target;
    }

    return target;
  }

  function elementTop(el) {
    const box = el.getBoundingClientRect();
    return box.top + window.pageYOffset;
  }

  function scrollToHash(hash, updateUrl = true) {
    const target = getTargetFromHash(hash);
    if (!target) return false;
    const anchor = getVisualAnchor(target);
    const extraGap = 14;
    const top = anchor === document.body
      ? 0
      : elementTop(anchor) - getHeaderOffset() - extraGap;

    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'auto' });
    closeMenu();

    if (updateUrl && history.pushState) history.pushState(null, '', hash);
    return true;
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    if (scrollToHash(hash, true)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  function correctInitialHash() {
    if (!window.location.hash) return;
    scrollToHash(window.location.hash, false);
  }

  // Correct direct links from file previews/Safari hash jumps more than once.
  // For clean URLs opened from external apps, repeatedly cancel browser scroll restoration.
  document.addEventListener('DOMContentLoaded', () => {
    forceTopForCleanUrl();
    correctInitialHash();
    setTimeout(() => { forceTopForCleanUrl(); correctInitialHash(); }, 120);
  });
  window.addEventListener('pageshow', () => {
    forceTopForCleanUrl();
    setTimeout(forceTopForCleanUrl, 90);
  });
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    forceTopForCleanUrl();
    correctInitialHash();
    setTimeout(() => { forceTopForCleanUrl(); correctInitialHash(); }, 280);
    setTimeout(() => { forceTopForCleanUrl(); correctInitialHash(); }, 1000);
    setTimeout(forceTopForCleanUrl, 1800);
  });
  window.addEventListener('hashchange', correctInitialHash);

  // Reveal animations
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    revealItems.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 30, 180)}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealItems.forEach((el) => el.classList.add('active'));
  }

  // Magnetic buttons on pointer devices only
  if (!prefersReducedMotion && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.magnetic').forEach((item) => {
      item.addEventListener('mousemove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        item.style.transform = `translate(${x}px, ${y}px) translateY(-3px)`;
      });
      item.addEventListener('mouseleave', () => {
        item.style.transform = '';
      });
    });
  }

  // Subtle scroll motion without layout changes
  const heroImage = document.querySelector('.hero-bg img');
  const motionCards = document.querySelectorAll('.feature-image-card, .proposal-card, .pathway-feature-card, .team-card, .director-philosophy, .calculator-card');
  let ticking = false;

  function applyScrollMotion() {
    if (!prefersReducedMotion) {
      const y = window.scrollY || 0;
      if (heroImage) heroImage.style.transform = `translateY(${Math.min(y * 0.018, 12)}px) scale(1.01)`;
      motionCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const offset = (rect.top - window.innerHeight / 2) * -0.003;
          card.style.setProperty('--float', `${Math.max(Math.min(offset, 6), -6)}px`);
        }
      });
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(applyScrollMotion);
      ticking = true;
    }
  }, { passive: true });
  applyScrollMotion();

  // Calculator utilities
  function formatCurrency(num) {
    return `R${Math.round(num).toLocaleString('en-ZA')}`;
  }

  function animateValue(el, from, to, duration, formatter) {
    if (!el) return;
    if (prefersReducedMotion) {
      el.textContent = formatter(to);
      return;
    }
    if (el._ppAnimFrame) cancelAnimationFrame(el._ppAnimFrame);
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      el.textContent = formatter(current);
      if (progress < 1) el._ppAnimFrame = requestAnimationFrame(tick);
    }
    el._ppAnimFrame = requestAnimationFrame(tick);
  }

  function updateSliderFill(input) {
    if (!input) return;
    const min = parseFloat(input.min || '0');
    const max = parseFloat(input.max || '100');
    const val = parseFloat(input.value || String(min));
    const fill = max === min ? 0 : ((val - min) / (max - min)) * 100;
    const safeFill = Math.max(0, Math.min(fill, 100));
    input.style.setProperty('--fill', `${safeFill}%`);
    input.dataset.empty = safeFill <= 0.01 ? 'true' : 'false';
  }

  document.querySelectorAll('input[type="range"]').forEach(updateSliderFill);

  const schoolCoaches = document.getElementById('school-coaches');
  const schoolSessions = document.getElementById('school-sessions');
  const schoolMatchdays = document.getElementById('school-matchdays');
  const equipmentButtons = document.querySelectorAll('[data-equipment]');
  let equipmentNeeded = false;
  let lastSchoolTotal = 0;

  function getSchoolRate(coaches) {
    if (coaches <= 6) return 450;
    if (coaches <= 8) return 400;
    return 350;
  }

  function updateSchoolCalculator() {
    if (!schoolCoaches || !schoolSessions || !schoolMatchdays) return;
    const coaches = parseInt(schoolCoaches.value, 10);
    const sessionsPerWeek = parseInt(schoolSessions.value, 10);
    const matchdaysPerWeek = parseInt(schoolMatchdays.value, 10);
    const weeksPerMonth = 4.33;

    [schoolCoaches, schoolSessions, schoolMatchdays].forEach(updateSliderFill);

    const rate = getSchoolRate(coaches);
    const totalSessions = coaches * sessionsPerWeek * weeksPerMonth;
    const totalMatchdays = coaches * matchdaysPerWeek * weeksPerMonth;
    const monthlyCost = (totalSessions * rate) + (totalMatchdays * 450);

    document.getElementById('school-coaches-val').textContent = coaches;
    document.getElementById('school-sessions-val').textContent = sessionsPerWeek;
    document.getElementById('school-matchdays-val').textContent = matchdaysPerWeek;
    document.getElementById('school-result-coaches').textContent = coaches;
    document.getElementById('school-result-sessions').textContent = Math.round(totalSessions);
    document.getElementById('school-result-matchdays').textContent = Math.round(totalMatchdays);

    animateValue(document.getElementById('school-result-total'), lastSchoolTotal, monthlyCost, 350, formatCurrency);
    lastSchoolTotal = monthlyCost;

    const onboardingRow = document.getElementById('school-onboarding-row');
    if (onboardingRow) onboardingRow.style.display = equipmentNeeded ? 'flex' : 'none';

    const largeProgrammeRow = document.getElementById('school-large-programme-row');
    if (largeProgrammeRow) largeProgrammeRow.style.display = coaches >= 9 ? 'flex' : 'none';
  }

  if (schoolCoaches && schoolSessions && schoolMatchdays) {
    [schoolCoaches, schoolSessions, schoolMatchdays].forEach((input) => {
      input.addEventListener('input', updateSchoolCalculator);
      input.addEventListener('change', updateSchoolCalculator);
    });
    equipmentButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        equipmentButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        equipmentNeeded = btn.dataset.equipment === 'yes';
        updateSchoolCalculator();
      });
    });
    updateSchoolCalculator();
  }

  const privateSessions = document.getElementById('private-sessions');
  let lastPrivateTotal = 0;

  function updatePrivateCalculator() {
    if (!privateSessions) return;
    const sessionsPerWeek = parseInt(privateSessions.value, 10);
    const weeksPerMonth = 4.33;
    const rate = 400;
    const sessionsPerMonth = sessionsPerWeek * weeksPerMonth;
    const monthlyCost = sessionsPerMonth * rate;

    updateSliderFill(privateSessions);
    document.getElementById('private-sessions-val').textContent = sessionsPerWeek;
    document.getElementById('private-result-rate').textContent = `R${rate}`;
    document.getElementById('private-result-sessions').textContent = Math.round(sessionsPerMonth);
    animateValue(document.getElementById('private-result-total'), lastPrivateTotal, monthlyCost, 350, formatCurrency);
    lastPrivateTotal = monthlyCost;
  }

  if (privateSessions) {
    privateSessions.addEventListener('input', updatePrivateCalculator);
    privateSessions.addEventListener('change', updatePrivateCalculator);
    updatePrivateCalculator();
  }



  // Funnel cards: keep the user journey controlled.
  // Informational service/pathway cards go to Pricing first; Pricing CTAs go to the form.
  document.querySelectorAll('.price-funnel-card[data-target]').forEach((card) => {
    const targetHash = card.getAttribute('data-target') || '#pricing';
    const go = (event) => {
      if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      scrollToHash(targetHash, true);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', go);
  });

  // Pathway note toggle
  const requestType = document.getElementById('request-type');
  const pathwayNote = document.getElementById('pathway-note');
  if (requestType && pathwayNote) {
    requestType.addEventListener('change', () => {
      pathwayNote.style.display = requestType.value === 'Pathway Guidance' ? 'block' : 'none';
    });
  }

  // Form submission with email fallback
  const form = document.querySelector('#consultation');
  const pop = document.querySelector('.success-pop');
  const popTitle = pop?.querySelector('b');
  const popText = pop?.querySelector('small');
  const submitBtn = form?.querySelector('button[type="submit"]');

  function showPop(type = 'success', title = 'Request sent', text = 'Thank you — Pitch Partners will respond soon.') {
    if (!pop) return;
    pop.classList.remove('show', 'error');
    if (type === 'error') pop.classList.add('error');
    if (popTitle) popTitle.textContent = title;
    if (popText) popText.textContent = text;
    requestAnimationFrame(() => pop.classList.add('show'));
    setTimeout(() => pop.classList.remove('show'), 4600);
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      form.classList.remove('sent');
      submitBtn?.classList.add('is-sending');

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('Form service did not accept the request.');

        form.reset();
        if (pathwayNote) pathwayNote.style.display = 'none';
        form.classList.add('sent');
        showPop('success', 'Request sent', 'Thank you — Pitch Partners will respond soon.');
      } catch (error) {
        const name = encodeURIComponent(form.querySelector('#name')?.value || '');
        const phone = encodeURIComponent(form.querySelector('#phone')?.value || '');
        const request = encodeURIComponent(form.querySelector('#request-type')?.value || '');
        const details = encodeURIComponent(form.querySelector('#request')?.value || '');
        const fallback = `mailto:kmodise@pitchpartners.co.za?subject=New Pitch Partners consultation request&body=Name:%20${name}%0APhone:%20${phone}%0ARequest:%20${request}%0ADetails:%20${details}`;
        showPop('error', 'Email backup opened', 'The direct send failed, so your email app will open instead.');
        window.location.href = fallback;
      } finally {
        submitBtn?.classList.remove('is-sending');
      }
    });
  }
})();
