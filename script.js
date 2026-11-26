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

// Keep the existing Formspree endpoint. Never clear a message before acceptance.
const contactForm = document.querySelector('#contactForm');
if (contactForm) {
  let sending = false;
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !contactForm.reportValidity()) return;
    const status = document.querySelector('#form-status');
    const button = contactForm.querySelector('[type="submit"]');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    contactForm.setAttribute('aria-busy', 'true');
    status.dataset.state = 'sending';
    status.textContent = 'Sending your message…';
    try {
      const response = await fetch(contactForm.action, {
        method: 'POST', body: new FormData(contactForm),
        headers: { Accept: 'application/json' }, signal: controller.signal
      });
      if (!response.ok) throw new Error(String(response.status));
      contactForm.reset();
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your message was submitted successfully.';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.message === '429'
        ? 'The form is temporarily busy. Your message is still here. Please try later, or email me directly above.'
        : 'Could not confirm delivery. Your message is still here. Please try again, or use my email address above.';
    } finally {
      clearTimeout(timeout);
      sending = false;
      contactForm.removeAttribute('aria-busy');
      button.disabled = false;
      button.innerHTML = 'Send message <span aria-hidden="true">↗</span>';
    }
  });
}

// Illustrative motion is shared by all scenes and can be paused independently of scrolling.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('#motion-toggle');
const scenes = [...document.querySelectorAll('.robot-scene, .project-art svg')];
const visibleScenes = new Set(scenes);
let paused = reducedMotion.matches;
let elapsed = 0;
let lastFrame = null;
let frameRequest = null;
const ease = (t) => t * t * (3 - 2 * t);

function elbowFor(sx, sy, x, y, a, b, bend = -1) {
  const dx = x - sx, dy = y - sy;
  const distance = Math.min(a + b - .001, Math.max(Math.abs(a - b) + .001, Math.hypot(dx, dy)));
  const angle = Math.atan2(dy, dx) + bend * Math.acos(Math.max(-1, Math.min(1, (distance * distance + a * a - b * b) / (2 * distance * a))));
  return [sx + a * Math.cos(angle), sy + a * Math.sin(angle)];
}
function positionHero(seconds) {
  const cycle = (seconds / 17) % 1;
  const returning = cycle >= .5;
  const t = (cycle * 2) % 1;
  const source = returning ? [460, 306] : [390, 283];
  const destination = returning ? [390, 283] : [460, 306];
  const frames = [[0,330,172,0],[.1,330,172,0],[.22,source[0],source[1]-90,0],
    [.32,source[0],source[1]-28,0],[.39,source[0],source[1]-28,1],
    [.48,source[0],source[1]-90,1],[.63,destination[0],destination[1]-90,1],
    [.73,destination[0],destination[1]-28,1],[.8,destination[0],destination[1]-28,0],
    [.89,destination[0],destination[1]-90,0],[1,330,172,0]];
  const index = Math.max(0, frames.findIndex((f) => f[0] > t) - 1);
  const from = frames[index], to = frames[index + 1];
  const p = ease((t - from[0]) / (to[0] - from[0]));
  const x = from[1] + (to[1] - from[1]) * p;
  const y = from[2] + (to[2] - from[2]) * p;
  const grip = from[3] + (to[3] - from[3]) * p;
  const [ex, ey] = elbowFor(178, 280, x, y, 140, 150);
  const d = `M178 280L${ex} ${ey}L${x} ${y}`;
  document.querySelectorAll('.arm-back,.arm-metal,.arm-inset').forEach((path) => path.setAttribute('d', d));
  document.querySelector('#elbow-joint').setAttribute('transform', `translate(${ex} ${ey})`);
  document.querySelector('#wrist').setAttribute('transform', `translate(${x} ${y})`);
  document.querySelector('#jaw-left').setAttribute('transform', `translate(${grip * 5} 0)`);
  document.querySelector('#jaw-right').setAttribute('transform', `translate(${-grip * 5} 0)`);
  const object = t < .36 ? source : t < .765 ? [x, y + 28] : destination;
  document.querySelector('#carried-object').setAttribute('transform', `translate(${object[0]} ${object[1]})`);
  const stage = t < .32 ? 'REACH' : t < .48 ? 'GRASP + LIFT' : t < .73 ? 'TRANSFER' : 'PLACE + RELEASE';
  document.querySelector('#robot-stage').textContent = `${returning ? 'RETURN' : 'TRANSFER'} / ${stage}`;
}

const routes = [...document.querySelectorAll('.route-traveler')].map((element) => {
  const path = document.getElementById(element.dataset.route);
  return { element, path, length: path.getTotalLength(), scene: element.closest('svg'), phase: Number(element.dataset.phase || 0) };
});
const maze = document.querySelector('#maze-route');
const mazeLength = maze.getTotalLength();
document.querySelector('#maze-progress').setAttribute('stroke-dasharray', `${mazeLength} ${mazeLength}`);
function draw(seconds) {
  if (visibleScenes.has(document.querySelector('.robot-scene'))) positionHero(seconds);
  for (const {element,path,length,scene,phase} of routes) {
    if (!visibleScenes.has(scene)) continue;
    const t = ((seconds / 15) + phase) % 1;
    const position = .5 - .5 * Math.cos(t * Math.PI * 2);
    const point = path.getPointAtLength(position * length);
    const next = path.getPointAtLength(Math.min(length, position * length + .5));
    const angle = Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI + (t > .5 ? 180 : 0);
    element.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  }
  if (visibleScenes.has(maze.closest('svg'))) {
    const p = .5 - .5 * Math.cos(seconds / 18 * Math.PI * 2);
    const point = maze.getPointAtLength(p * mazeLength);
    const [x,y] = elbowFor(454,226,point.x,point.y,165,180,1);
    const d = `M454 226L${x} ${y}L${point.x} ${point.y}`;
    document.querySelectorAll('.maze-arm-back,.maze-arm-front').forEach(path=>path.setAttribute('d',d));
    document.querySelector('#maze-elbow').setAttribute('cx',x);
    document.querySelector('#maze-elbow').setAttribute('cy',y);
    document.querySelector('#maze-pen').setAttribute('transform',`translate(${point.x} ${point.y})`);
    document.querySelector('#maze-progress').setAttribute('stroke-dashoffset',mazeLength * (1 - p));
  }
}
function animate(timestamp) {
  frameRequest = null;
  if (paused || document.hidden || !visibleScenes.size) { lastFrame = null; return; }
  if (lastFrame !== null) elapsed += Math.min(timestamp - lastFrame, 64) / 1000;
  lastFrame = timestamp;
  draw(elapsed);
  frameRequest = requestAnimationFrame(animate);
}
function startMotion() {
  if (!paused && !document.hidden && visibleScenes.size && frameRequest === null) frameRequest = requestAnimationFrame(animate);
}
function syncMotion() {
  document.documentElement.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.innerHTML = paused ? '<span aria-hidden="true">▷</span> Play motion' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
  if (paused && frameRequest !== null) { cancelAnimationFrame(frameRequest); frameRequest = null; }
  lastFrame = null;
  startMotion();
}
motionButton.hidden = false;
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncMotion(); });
document.addEventListener('visibilitychange', () => { lastFrame = null; startMotion(); });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleScenes.add(entry.target); else visibleScenes.delete(entry.target);
      entry.target.classList.toggle('scene-offscreen', !entry.isIntersecting);
    }
    startMotion();
  }, {rootMargin:'100px'});
  scenes.forEach(scene=>observer.observe(scene));
}
draw(0);
syncMotion();
