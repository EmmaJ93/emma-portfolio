/* ==========================================================================
   PORTFOLIO INTERACTIVE CONTROLLER
   - Category filtering (any page with .filter-btn + .case-card)
   - Darkroom Loupe / Proof Inspector modal (any page with .contact-frame)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FADE_MS = 250;

  /* ------------------------------------------------------------------------
     1. WORK CATEGORY FILTERING
     ------------------------------------------------------------------------ */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.case-card');
  const feed = document.querySelector('.case-study-feed');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    // Empty-state message, shown when a filter matches no cards
    const emptyState = document.createElement('p');
    emptyState.className = 'feed-empty';
    emptyState.textContent = 'Nothing on this roll yet. New work in this category is being developed.';
    emptyState.hidden = true;
    feed.appendChild(emptyState);

    // Pending hide timers per card, so rapid clicks can't hide a card
    // that a later click decided to show.
    const hideTimers = new Map();

    const showCard = (card) => {
      clearTimeout(hideTimers.get(card));
      card.hidden = false;
      // Next frame so the browser registers the start state before fading in
      requestAnimationFrame(() => card.classList.remove('is-filtered-out'));
    };

    const hideCard = (card) => {
      clearTimeout(hideTimers.get(card));
      card.classList.add('is-filtered-out');
      const delay = reducedMotion.matches ? 0 : FADE_MS;
      hideTimers.set(card, setTimeout(() => { card.hidden = true; }, delay));
    };

    filterButtons.forEach(button => {
      button.setAttribute('aria-pressed', button.classList.contains('active'));

      button.addEventListener('click', () => {
        filterButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');

        const selectedFilter = button.dataset.filter || 'all';
        let visibleCount = 0;

        projectCards.forEach(card => {
          const categories = (card.dataset.category || '').trim().split(/\s+/);
          if (selectedFilter === 'all' || categories.includes(selectedFilter)) {
            showCard(card);
            visibleCount++;
          } else {
            hideCard(card);
          }
        });

        emptyState.hidden = visibleCount > 0;
      });
    });
  }

  /* ------------------------------------------------------------------------
     2. DARKROOM CONTACT SHEET LIGHTBOX INSPECTOR
     ------------------------------------------------------------------------ */
  const contactFrames = document.querySelectorAll('.contact-frame');

  if (contactFrames.length > 0) {
    const modal = document.createElement('div');
    modal.className = 'darkroom-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lightbox-title');
    modal.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button type="button" class="lightbox-close" aria-label="Close inspector">✕</button>
        <div class="lightbox-header">
          <span class="lightbox-code">FRAME INSPECTOR • PROOF EXAMINATION</span>
        </div>
        <div class="lightbox-viewer">
          <div class="lightbox-placeholder">
            <span class="lightbox-title" id="lightbox-title">[ SPECIMEN PREVIEW ]</span>
          </div>
        </div>
        <div class="lightbox-meta">
          <span class="lightbox-spec"></span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.lightbox-close');
    const overlay = modal.querySelector('.lightbox-overlay');
    const titleTarget = modal.querySelector('.lightbox-title');
    const codeTarget = modal.querySelector('.lightbox-code');
    const specTarget = modal.querySelector('.lightbox-spec');
    const sheetMeta = document.querySelector('.sheet-meta');

    let lastTrigger = null;

    const openModal = (frame, index) => {
      const expNumber = String(index + 1).padStart(2, '0');
      const thumbText = frame.querySelector('.contact-thumb span')?.textContent.trim() || '[ SPECIMEN ]';
      const isSelect = frame.classList.contains('select-frame');

      titleTarget.textContent = thumbText;
      codeTarget.textContent = `EXP ${expNumber} • DARKROOM SPECIMEN INSPECTOR`;
      specTarget.textContent = `STATUS: ${isSelect ? 'PROOF SELECT' : 'CONTACT PROOF'}`
        + (sheetMeta ? ` • ${sheetMeta.textContent.trim()}` : '');

      lastTrigger = frame;
      modal.classList.add('is-active');
      document.body.classList.add('lightbox-open');
      closeBtn.focus();
    };

    const closeModal = () => {
      if (!modal.classList.contains('is-active')) return;
      modal.classList.remove('is-active');
      document.body.classList.remove('lightbox-open');
      lastTrigger?.focus();
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-active')) return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Tab') {
        // Only one focusable control inside the dialog: keep focus on it
        e.preventDefault();
        closeBtn.focus();
      }
    });

    contactFrames.forEach((frame, index) => {
      const label = frame.querySelector('.contact-thumb span')?.textContent.trim() || 'proof';
      frame.setAttribute('aria-label', `Inspect exposure ${index + 1}: ${label}`);
      frame.addEventListener('click', () => openModal(frame, index));
    });
  }

});
