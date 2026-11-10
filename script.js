document.addEventListener('DOMContentLoaded', () => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FADE_MS = 250;

  // Category filters: show items whose data-category matches the button
  const filterButtons = document.querySelectorAll('.filter-btn');
  const filterItems = document.querySelectorAll('.case-card, .filter-section');
  const feed = document.querySelector('.case-study-feed');

  if (filterButtons.length > 0 && filterItems.length > 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'feed-empty';
    emptyState.textContent = 'Nothing here yet. New work in this category is on the way.';
    emptyState.hidden = true;
    feed?.appendChild(emptyState);

    // Pending hide timers per item, so rapid clicks can't hide an item
    // that a later click decided to show.
    const hideTimers = new Map();

    const showItem = (item) => {
      clearTimeout(hideTimers.get(item));
      item.hidden = false;
      requestAnimationFrame(() => item.classList.remove('is-filtered-out'));
    };

    const hideItem = (item) => {
      clearTimeout(hideTimers.get(item));
      item.classList.add('is-filtered-out');
      const delay = reducedMotion.matches ? 0 : FADE_MS;
      hideTimers.set(item, setTimeout(() => { item.hidden = true; }, delay));
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
        let visibleCards = 0;

        filterItems.forEach(item => {
          const categories = (item.dataset.category || '').trim().split(/\s+/);
          if (selectedFilter === 'all' || categories.includes(selectedFilter)) {
            showItem(item);
            if (item.classList.contains('case-card')) visibleCards++;
          } else {
            hideItem(item);
          }
        });

        emptyState.hidden = visibleCards > 0;
      });
    });
  }

  // Lightbox for .contact-frame buttons (data-full, data-spec, data-tall)
  const contactFrames = document.querySelectorAll('.contact-frame');

  if (contactFrames.length > 0) {
    const modal = document.createElement('div');
    modal.className = 'darkroom-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lightbox-caption');
    modal.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button type="button" class="lightbox-close" aria-label="Close">✕</button>
        <div class="lightbox-header">
          <span class="lightbox-code">VIEWER</span>
        </div>
        <div class="lightbox-viewer">
          <div class="lightbox-stage">
            <img class="lightbox-img" alt="" hidden />
            <div class="lightbox-placeholder">
              <span class="lightbox-title">[ SPECIMEN PREVIEW ]</span>
            </div>
          </div>
          <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous frame">←</button>
          <button type="button" class="lightbox-nav lightbox-next" aria-label="Next frame">→</button>
        </div>
        <div class="lightbox-meta">
          <span class="lightbox-caption" id="lightbox-caption"></span>
          <span class="lightbox-spec"></span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.lightbox-close');
    const prevBtn = modal.querySelector('.lightbox-prev');
    const nextBtn = modal.querySelector('.lightbox-next');
    const overlay = modal.querySelector('.lightbox-overlay');
    const lbImg = modal.querySelector('.lightbox-img');
    const stage = modal.querySelector('.lightbox-stage');
    const placeholder = modal.querySelector('.lightbox-placeholder');
    const titleTarget = modal.querySelector('.lightbox-title');
    const codeTarget = modal.querySelector('.lightbox-code');
    const captionTarget = modal.querySelector('.lightbox-caption');
    const specTarget = modal.querySelector('.lightbox-spec');

    let lastTrigger = null;
    let currentFrame = null;

    // Focus pull: replay the soft-to-sharp animation each time a photo loads
    const pullFocus = () => {
      if (modal.classList.contains('is-tall')) return;
      lbImg.classList.remove('is-focusing');
      void lbImg.offsetWidth;
      lbImg.classList.add('is-focusing');
    };
    lbImg.addEventListener('load', pullFocus);

    // Frames in the same sheet as the given frame (for prev/next)
    const siblingsOf = (frame) =>
      Array.from(frame.parentElement.querySelectorAll('.contact-frame'));

    const frameLabel = (frame) => {
      const img = frame.querySelector('img');
      return frame.dataset.caption
        || frame.querySelector('.frame-caption')?.textContent.trim()
        || img?.alt
        || frame.querySelector('.contact-thumb span')?.textContent.trim()
        || 'Image';
    };

    const showFrame = (frame) => {
      currentFrame = frame;
      const sheetFrames = siblingsOf(frame);
      const index = sheetFrames.indexOf(frame);
      const expNumber = String(index + 1).padStart(2, '0');
      const section = frame.closest('section');
      const sheetMeta = frame.parentElement.dataset.label
        || section?.querySelector('.sheet-meta')?.textContent.trim();
      const thumbImg = frame.querySelector('img');

      // Full-length emails (data-tall) scroll inside the viewer
      modal.classList.toggle('is-tall', 'tall' in frame.dataset);
      stage.scrollTop = 0;

      if (thumbImg) {
        const src = frame.dataset.full || thumbImg.src;
        const sameImage = lbImg.getAttribute('src') === src;
        lbImg.src = src;
        lbImg.alt = thumbImg.alt;
        lbImg.hidden = false;
        placeholder.hidden = true;
        // Reopening the same photo fires no load event, so replay it here
        if (sameImage && lbImg.complete) pullFocus();
      } else {
        lbImg.hidden = true;
        lbImg.removeAttribute('src');
        placeholder.hidden = false;
        titleTarget.textContent = frameLabel(frame);
      }

      codeTarget.textContent = `${expNumber} / ${String(sheetFrames.length).padStart(2, '0')}`
        + (sheetMeta ? ` • ${sheetMeta}` : '');
      captionTarget.textContent = frameLabel(frame);
      specTarget.textContent = frame.dataset.spec || '';

      const single = sheetFrames.length < 2;
      prevBtn.hidden = single;
      nextBtn.hidden = single;
    };

    const step = (dir) => {
      if (!currentFrame) return;
      const sheetFrames = siblingsOf(currentFrame);
      const i = sheetFrames.indexOf(currentFrame);
      showFrame(sheetFrames[(i + dir + sheetFrames.length) % sheetFrames.length]);
    };

    const openModal = (frame) => {
      lastTrigger = frame;
      showFrame(frame);
      modal.classList.add('is-active');
      document.body.classList.add('lightbox-open');
      closeBtn.focus();
    };

    const closeModal = () => {
      if (!modal.classList.contains('is-active')) return;
      modal.classList.remove('is-active');
      document.body.classList.remove('lightbox-open');
      // Return focus to the frame now on screen (may differ after prev/next)
      (currentFrame || lastTrigger)?.focus();
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-active')) return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        step(-1);
      } else if (e.key === 'ArrowRight') {
        step(1);
      } else if (e.key === 'Tab') {
        // Keep focus cycling inside the dialog
        const focusables = [closeBtn, prevBtn, nextBtn].filter(b => !b.hidden);
        const i = focusables.indexOf(document.activeElement);
        const next = e.shiftKey
          ? focusables[(i - 1 + focusables.length) % focusables.length]
          : focusables[(i + 1) % focusables.length];
        e.preventDefault();
        next.focus();
      }
    });

    contactFrames.forEach((frame) => {
      const index = siblingsOf(frame).indexOf(frame);
      frame.setAttribute('aria-label', `View item ${index + 1}: ${frameLabel(frame)}`);
      frame.addEventListener('click', () => openModal(frame));
    });
  }

});

// Video posters: load the YouTube player only when someone presses play
document.querySelectorAll('.video-poster').forEach((poster) => {
  poster.addEventListener('click', (e) => {
    e.preventDefault();
    const iframe = document.createElement('iframe');
    iframe.className = 'video-embed';
    iframe.src = `https://www.youtube-nocookie.com/embed/${poster.dataset.video}?autoplay=1&rel=0`;
    iframe.title = poster.dataset.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    poster.replaceWith(iframe);
    iframe.focus();
  });
});
