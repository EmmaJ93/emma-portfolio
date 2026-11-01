/* ==========================================================================
   PORTFOLIO INTERACTIVE CONTROLLER
   - Direct DOM Filtering with Inline Fallback Transitions
   - Darkroom Loupe / Proof Inspector Modal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     1. WORK CATEGORY FILTERING
     ------------------------------------------------------------------------ */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.case-card');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();

        // 1. Update Active Filter Button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // 2. Read Target Filter Attribute
        const selectedFilter = button.getAttribute('data-filter') || 'all';

        // 3. Filter Cards
        projectCards.forEach(card => {
          const rawCategories = card.getAttribute('data-category') || '';
          const cardCategories = rawCategories.trim().split(/\s+/);

          if (selectedFilter === 'all' || cardCategories.includes(selectedFilter)) {
            card.style.display = 'grid';
            // Force browser repaint to trigger smooth fade in
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 10);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 250);
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     2. DARKROOM CONTACT SHEET LIGHTBOX INSPECTOR
     ------------------------------------------------------------------------ */
  const contactFrames = document.querySelectorAll('.contact-frame');

  if (contactFrames.length > 0) {
    // Dynamically build and attach the modal markup
    const modal = document.createElement('div');
    modal.className = 'darkroom-lightbox';
    modal.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close Inspector">✕</button>
        <div class="lightbox-header">
          <span class="lightbox-code">FRAME INSPECTOR • PROOF EXAMINATION</span>
        </div>
        <div class="lightbox-viewer">
          <div class="lightbox-placeholder">
            <span class="lightbox-title">[ SPECIMEN PREVIEW ]</span>
          </div>
        </div>
        <div class="lightbox-meta">
          <span class="lightbox-spec">STATUS: SILVER GELATIN ARCHIVE • ROLL NO. 04</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.lightbox-close');
    const overlay = modal.querySelector('.lightbox-overlay');
    const titleTarget = modal.querySelector('.lightbox-title');
    const codeTarget = modal.querySelector('.lightbox-code');

    const closeModal = () => modal.classList.remove('is-active');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    contactFrames.forEach(frame => {
      frame.addEventListener('click', () => {
        const thumbText = frame.querySelector('.contact-thumb span')?.textContent || 'SPECIMEN';
        const frameExp = window.getComputedStyle(frame, '::before').getPropertyValue('content').replace(/"/g, '') || 'FRAME PROOF';
        
        titleTarget.textContent = thumbText;
        codeTarget.textContent = `${frameExp} • DARKROOM SPECIMEN INSPECTOR`;
        modal.classList.add('is-active');
      });
    });
  }

}); 