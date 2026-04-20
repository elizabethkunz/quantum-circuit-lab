/* =========================================================================
   TIMELINE expand/collapse
   ========================================================================= */
document.querySelectorAll('.tl-entry').forEach(entry => {
  const header = entry.querySelector('.tl-header');
  if (header) header.addEventListener('click', () => {
    entry.classList.toggle('open');
  });
});


updateProgressPills();
