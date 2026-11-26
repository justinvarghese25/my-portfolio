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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-paused')) {
      projectCards.filter(card => !card.hidden).forEach((card, index) => card.animate(
        [{opacity: .35, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: 280, delay: index * 35, easing: 'cubic-bezier(.2,.7,.2,1)'}
      ));
    }
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
let isScrolling=false;
let scrollIdleTimer=null;
const frameInterval=(matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency||8)<=4||navigator.connection?.saveData)?32.8:16.1;
let elapsed = 0;
let lastFrame = null;
let frameRequest = null;
const disclosureAnimations = new Map();
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
const loopOffsets = {maze:0, surveillance:0};
document.querySelector('#maze-progress').setAttribute('stroke-dasharray', `${mazeLength} ${mazeLength}`);
function draw(seconds) {
  if (visibleScenes.has(document.querySelector('.robot-scene'))) positionHero(document.querySelector('.hero-visual').dataset.heroMode === 'plan' ? seconds : 0);
  for (const {element,path,length,scene,phase} of routes) {
    if (!visibleScenes.has(scene)) continue;
    const t = ((Math.max(0, seconds-loopOffsets.surveillance) / 15) + phase) % 1;
    const position = .5 - .5 * Math.cos(t * Math.PI * 2);
    const point = path.getPointAtLength(position * length);
    const next = path.getPointAtLength(Math.min(length, position * length + .5));
    const angle = Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI + (t > .5 ? 180 : 0);
    element.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  }
  if (visibleScenes.has(maze.closest('svg'))) {
    const p = .5 - .5 * Math.cos(Math.max(0,seconds-loopOffsets.maze) / 18 * Math.PI * 2);
    const point = maze.getPointAtLength(p * mazeLength);
    const [x,y] = elbowFor(454,226,point.x,point.y,165,180,1);
    const d = `M454 226L${x} ${y}L${point.x} ${point.y}`;
    document.querySelectorAll('.maze-arm-back,.maze-arm-front').forEach(path=>path.setAttribute('d',d));
    document.querySelector('#maze-elbow').setAttribute('cx',x);
    document.querySelector('#maze-elbow').setAttribute('cy',y);
    document.querySelector('#maze-pen').setAttribute('transform',`translate(${point.x} ${point.y})`);
    document.querySelector('#maze-progress').setAttribute('stroke-dashoffset',mazeLength * (1 - p));
  }
  if (!paused || seconds > 0) window.portfolioScenes.draw(seconds, visibleScenes);
}
function animate(timestamp) {
  frameRequest = null;
  if (paused || isScrolling || document.hidden || !visibleScenes.size) { lastFrame = null; return; }
  // Use the display cadence on desktop and a lower budget on touch/low-power devices.
  if (lastFrame !== null && timestamp-lastFrame < frameInterval) { frameRequest=requestAnimationFrame(animate); return; }
  if (lastFrame !== null) elapsed += Math.min(timestamp - lastFrame, 100) / 1000;
  lastFrame = timestamp;
  draw(elapsed);
  frameRequest = requestAnimationFrame(animate);
}
function startMotion() {
  if (!paused && !isScrolling && !document.hidden && visibleScenes.size && frameRequest === null) frameRequest = requestAnimationFrame(animate);
}
function syncMotion() {
  document.documentElement.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.innerHTML = paused ? '<span aria-hidden="true">▷</span> Play motion' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
  if (paused && frameRequest !== null) { cancelAnimationFrame(frameRequest); frameRequest = null; }
  if (paused) for (const state of disclosureAnimations.values()) state.animation.finish();
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
      if (entry.isIntersecting) { visibleScenes.add(entry.target); window.portfolioScenes.activate(entry.target, elapsed); }
      else visibleScenes.delete(entry.target);
      entry.target.classList.toggle('scene-offscreen', !entry.isIntersecting);
    }
    startMotion();
  }, {rootMargin:'100px'});
  scenes.forEach(scene=>observer.observe(scene));
}
draw(0);
syncMotion();

document.querySelectorAll('[data-replay]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => {
    if (button.dataset.replay in loopOffsets) { loopOffsets[button.dataset.replay] = elapsed; draw(elapsed); }
    else window.portfolioScenes.restart(button.dataset.replay, elapsed);
  });
});

const heroModes = document.querySelector('.hero-modes');
const heroCaptions = {
  observe: 'Observe — compare relative configurations across demonstrations.',
  learn: 'Learn — group recurring configurations into relational regions.',
  plan: 'Plan & act — use learned models to guide robot actions.'
};
heroModes.hidden = false;
heroModes.addEventListener('click', event => {
  const button = event.target.closest('button[data-hero-mode]');
  if (!button) return;
  document.querySelector('.hero-visual').dataset.heroMode = button.dataset.heroMode;
  heroModes.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#hero-mode-caption').textContent = heroCaptions[button.dataset.heroMode];
  positionHero(button.dataset.heroMode === 'plan' ? elapsed : 0);
});

// Requests stay on the site and use the existing contact form rather than an email-app dependency.
document.querySelectorAll('[data-contact-topic]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const topic = link.dataset.contactTopic;
    contactForm.querySelector('[name="topic"]').value = topic;
    const message = contactForm.querySelector('[name="message"]');
    if (!message.value.trim() || message.dataset.requestTemplate === message.value) {
      message.value = topic === 'Résumé request'
        ? 'Hi Justin, I would like to request your résumé.\n\n'
        : 'Hi Justin, I would like to ask about the following certificate or training:\n\n';
      message.dataset.requestTemplate = message.value;
    }
    document.querySelector('#form-status').textContent = 'Add your name and email, complete your message, then press Send message.';
    document.querySelector('#form-status').removeAttribute('data-state');
    contactForm.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'});
    contactForm.querySelector('[name="name"]').focus({preventScroll:true});
  });
});

// Scroll entrances are staggered within each group; all content stays visible without JS.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reducedMotion.matches && !paused && !isScrolling) entry.target.animate(
        [{opacity:.35, transform:'translateY(14px)'},{opacity:1, transform:'translateY(0)'}],
        {duration:420, delay:Number(entry.target.dataset.revealDelay||0), easing:'cubic-bezier(.16,1,.3,1)'}
      );
      revealObserver.unobserve(entry.target);
    }
  }, {threshold:.12});
  document.querySelectorAll('.contribution-grid,.project-grid,.credential-grid,.skill-categories').forEach(group=>{
    [...group.children].forEach((element,index)=>{element.dataset.revealDelay=String((index%3)*70);});
  });
  document.querySelectorAll('.section-heading,.research-overview,.contribution-grid article,.project-body,.timeline article,.about-copy,.skill-categories article').forEach(element => revealObserver.observe(element));
}
document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
  const content = detail.querySelector('.project-detail,.research-details');
  if (detail.open && content && !reducedMotion.matches && !paused) content.animate(
    [{opacity:0, transform:'translateY(-5px)'},{opacity:1, transform:'translateY(0)'}],
    {duration:220,easing:'ease-out'}
  );
}));

// Native <details> remains the fallback. Animate only a user-triggered expansion.
document.querySelectorAll('.project-card details,.research-disclosure').forEach(detail=>{
  const summary=detail.querySelector('summary');
  summary.addEventListener('click',event=>{
    if(reducedMotion.matches||paused||!detail.animate)return;
    event.preventDefault();
    const previous=disclosureAnimations.get(detail);
    const targetOpen=!(previous?previous.targetOpen:detail.open);
    const fromHeight=detail.getBoundingClientRect().height;
    if(previous)previous.animation.cancel();
    detail.open=true;
    const toHeight=targetOpen?detail.getBoundingClientRect().height:summary.getBoundingClientRect().height;
    if(Math.abs(fromHeight-toHeight)<1){detail.open=targetOpen;detail.style.overflow='';disclosureAnimations.delete(detail);return;}
    detail.style.overflow='hidden';
    const animation=detail.animate([{height:`${fromHeight}px`},{height:`${toHeight}px`}],{duration:targetOpen?340:260,easing:'cubic-bezier(.22,.8,.2,1)'});
    const state={animation,targetOpen};disclosureAnimations.set(detail,state);
    animation.onfinish=()=>{
      if(disclosureAnimations.get(detail)!==state)return;
      detail.open=targetOpen;detail.style.overflow='';disclosureAnimations.delete(detail);
      measureSections();scheduleScroll();
    };
  });
});

// A short, local ripple makes actions perceptible without introducing a dependency.
document.addEventListener('click',event=>{
  const control=event.target.closest('button,summary,.button');
  if(!control||reducedMotion.matches||paused||control.disabled)return;
  const bounds=control.getBoundingClientRect();
  const wave=document.createElement('span');wave.className='click-wave';wave.setAttribute('aria-hidden','true');
  const pointer=event.detail!==0;
  wave.style.left=`${(pointer?event.clientX-bounds.left:bounds.width/2)-10}px`;
  wave.style.top=`${(pointer?event.clientY-bounds.top:bounds.height/2)-10}px`;
  control.append(wave);
  const animation=wave.animate([{transform:'scale(0)',opacity:.2},{transform:`scale(${Math.max(bounds.width,bounds.height)/9})`,opacity:0}],{duration:450,easing:'ease-out'});
  animation.onfinish=()=>wave.remove();animation.oncancel=()=>wave.remove();
});

// Progress and section context use one passive scroll listener and at most one update per frame.
const progressFill=document.querySelector('#page-progress-fill');
const sectionContext=document.querySelector('#current-section');
const sectionNames={home:'Introduction',research:'Research',experience:'Experience',work:'Projects',about:'Background & skills',contact:'Let’s connect'};
const scrollSections=[...document.querySelectorAll('main>section[id]')];
let scrollScheduled=false;
let sectionOffsets=[];
let scrollRange=1;
let activeSectionId='';
let previousScrollPosition=window.scrollY;
let previousScrollTime=performance.now();
const navigationLinks=[...document.querySelectorAll('.site-header nav a')];
function measureSections(){sectionOffsets=scrollSections.map(element=>({element,id:element.id,top:element.getBoundingClientRect().top+window.scrollY}));scrollRange=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);}
function updateScroll(){
  scrollScheduled=false;
  const scrollTop=window.scrollY;
  progressFill.style.transform=`scaleX(${Math.max(0,Math.min(1,scrollTop/scrollRange))})`;
  let active=sectionOffsets[0];
  for(const section of sectionOffsets)if(section.top<=scrollTop+window.innerHeight*.32)active=section;
  if(active&&active.id!==activeSectionId){
    activeSectionId=active.id;
    const label=sectionNames[active.id]||active.id;
    if(sectionContext.textContent!==label)sectionContext.textContent=label;
    navigationLinks.forEach(link=>{
      if(link.hash===`#${active.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });
  }
}
function scheduleScroll(){if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}}
window.addEventListener('scroll',()=>{
  const now=performance.now(),distance=Math.abs(window.scrollY-previousScrollPosition);
  const fast=distance>40||distance/Math.max(1,now-previousScrollTime)>1;
  previousScrollPosition=window.scrollY;previousScrollTime=now;
  if(fast||isScrolling){
    if(!isScrolling){isScrolling=true;lastFrame=null;document.documentElement.classList.add('is-scrolling');if(frameRequest!==null){cancelAnimationFrame(frameRequest);frameRequest=null;}}
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer=setTimeout(()=>{isScrolling=false;lastFrame=null;document.documentElement.classList.remove('is-scrolling');startMotion();},140);
  }
  scheduleScroll();
},{passive:true});
window.addEventListener('resize',()=>{measureSections();scheduleScroll();},{passive:true});
if('ResizeObserver'in window)new ResizeObserver(()=>{measureSections();scheduleScroll();}).observe(document.querySelector('main'));
measureSections();updateScroll();

const compactHero=matchMedia('(max-width:600px)');
function sizeHero(){document.querySelector('.robot-scene').setAttribute('viewBox',compactHero.matches?'240 0 720 540':'0 0 1200 540');}
compactHero.addEventListener('change',sizeHero);sizeHero();
