'use strict';
const filterGroup = document.querySelector('.filters');
const projectCards = [...document.querySelectorAll('.project-card')];
const filterStatus = document.querySelector('#filter-status');
// Keep all projects readable if JavaScript is unavailable.
if (filterGroup) {
  filterGroup.hidden = false;
  filterGroup.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    filterGroup.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    projectCards.forEach((card) => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
    const count = projectCards.filter((card) => !card.hidden).length;
    filterStatus.textContent = `${count} projects shown. Filter: ${button.textContent}.`;
  });
}
const copyButton = document.querySelector('#copy-email');
if (copyButton && navigator.clipboard && window.isSecureContext) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try { await navigator.clipboard.writeText('justinvjohn25@gmail.com'); status.textContent = 'Email address copied.'; }
    catch { status.textContent = 'Select the email address above to copy it, or click it to open your email app.'; }
  });
}
document.querySelector('#year').textContent = String(new Date().getFullYear());
