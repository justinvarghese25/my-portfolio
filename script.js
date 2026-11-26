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
    requestAnimationFrame(()=>measureSections());
    if (!document.documentElement.classList.contains('motion-paused')) {
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
const scenes = [...document.querySelectorAll('.intro-scene, .robot-scene, .project-art svg')];
const visibleScenes = new Set(scenes);
let storedMotion='';try{storedMotion=localStorage.getItem('portfolio-motion')||'';}catch{}
let motionOptIn=storedMotion==='full';
let paused=storedMotion==='reduced'||(!motionOptIn&&reducedMotion.matches);
const scrollMotions=new Map();
let refreshScrollTransitions=()=>{},updateScrollTransitions=()=>{};
let isScrolling=false;
let scrollIdleTimer=null;
const frameInterval=(matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency||8)<=4||navigator.connection?.saveData)?32.8:16.1;
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
const routes = [...document.querySelectorAll('.route-traveler')].map((element) => {
  const path = document.getElementById(element.dataset.route);
  return { element, path, length: path.getTotalLength(), scene: element.closest('svg'), phase: Number(element.dataset.phase || 0) };
});
const maze = document.querySelector('#maze-route');
const mazeLength = maze.getTotalLength();
const loopOffsets = {maze:0, surveillance:0};
document.querySelector('#maze-progress').setAttribute('stroke-dasharray', `${mazeLength} ${mazeLength}`);
function draw(seconds) {
  window.portfolioStory.draw(seconds,visibleScenes);
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
  if (paused || isScrolling || document.hidden || document.documentElement.classList.contains('case-open') || !visibleScenes.size) { lastFrame = null; return; }
  // Use the display cadence on desktop and a lower budget on touch/low-power devices.
  if (lastFrame !== null && timestamp-lastFrame < frameInterval) { frameRequest=requestAnimationFrame(animate); return; }
  if (lastFrame !== null) elapsed += Math.min(timestamp - lastFrame, 100) / 1000;
  lastFrame = timestamp;
  draw(elapsed);
  frameRequest = requestAnimationFrame(animate);
}
function startMotion() {
  if (!paused && !isScrolling && !document.hidden && !document.documentElement.classList.contains('case-open') && visibleScenes.size && frameRequest === null) frameRequest = requestAnimationFrame(animate);
}
function syncMotion() {
  document.documentElement.classList.toggle('motion-paused', paused);
  document.documentElement.classList.toggle('allow-motion',motionOptIn&&!paused);
  const introToggle=document.querySelector('#intro-motion-toggle');introToggle.hidden=false;introToggle.textContent=paused?'Play animations':'Pause animations';introToggle.setAttribute('aria-pressed',String(paused));
  document.querySelector('#motion-state-note').textContent=paused?(storedMotion!=='reduced'&&reducedMotion.matches&&!motionOptIn?'Your device requests reduced motion. Play to enable animations.':'Animations paused. Play to enable scene and scroll motion.'):'Automatic animation · pause anytime';
  updateScrollTransitions();
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.innerHTML = paused ? '<span aria-hidden="true">▷</span> Play motion' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
  if (paused && frameRequest !== null) { cancelAnimationFrame(frameRequest); frameRequest = null; }
  if (paused) document.querySelector('#case-dialog')?.getAnimations().forEach(animation=>animation.finish());

  lastFrame = null;
  startMotion();
}
motionButton.hidden = false;
motionButton.addEventListener('click', () => { paused = !paused; motionOptIn=!paused;storedMotion=paused?'reduced':'full';try{localStorage.setItem('portfolio-motion',storedMotion);}catch{}syncMotion(); });
 document.querySelector('#intro-motion-toggle').addEventListener('click',()=>motionButton.click());
reducedMotion.addEventListener('change', () => { if(!storedMotion)paused=reducedMotion.matches;syncMotion(); });
document.addEventListener('visibilitychange', () => { lastFrame = null; startMotion(); });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { visibleScenes.add(entry.target); window.portfolioScenes.activate(entry.target, elapsed);window.portfolioStory.activate(entry.target,elapsed); }
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

const restartStory=document.querySelector('#restart-research-story');restartStory.hidden=false;restartStory.addEventListener('click',()=>{window.portfolioStory.restart(elapsed);});

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
    contactForm.scrollIntoView({behavior: paused ? 'instant' : 'smooth', block: 'start'});
    contactForm.querySelector('[name="name"]').focus({preventScroll:true});
  });
});

// Viewport entry starts a complete, time-based reveal. Two observers separate
// the entrance threshold from a distant offscreen reset, avoiding flicker at edges.
if('IntersectionObserver'in window&&Element.prototype.animate){
 const headingSelector='#research-title,#experience-title,#work-title,#about-title,#skills-title,#credentials-title,#contact-title';
 document.querySelectorAll(headingSelector).forEach(heading=>{
  const nodes=[...heading.childNodes];let line;
  const addLine=()=>{const mask=document.createElement('span');mask.className='heading-line';line=document.createElement('span');line.className='heading-ink';mask.append(line);heading.append(mask);};
  heading.replaceChildren();addLine();
  for(const node of nodes){if(node.nodeName==='BR'){heading.append(document.createTextNode(' '));addLine();}else line.append(node);}
 });
 const selector=headingSelector+',.section-heading,.research-overview>div:nth-child(2),.research-feature-metrics>div,.contribution-grid article,.research-cinema,.research-player-heading,.research-stage,.research-narrative,.project-card,.project-art>svg,.project-body>h3,.project-body>p:not(.eyebrow),.timeline article,.about-story,.skill-categories article,.credential-grid article';
 const cards=[...document.querySelectorAll('.project-card')];
 const states=[...document.querySelectorAll(selector)].map(element=>{
  const headline=element.matches(headingSelector),art=element.matches('.project-art>svg,.research-stage'),surface=element.matches('.project-card,.research-cinema'),metric=element.matches('.research-feature-metrics>div');
  const parts=headline?[...element.querySelectorAll('.heading-ink')]:[element],anchor=element.matches('.project-art>svg')?element.parentElement:element;
  const card=element.closest('.project-card'),siblings=[...element.parentElement.children].filter(e=>e.matches(selector));
  const stagger=card?Math.max(0,cards.indexOf(card))%2:Math.max(0,siblings.indexOf(element))%3;
  parts.forEach(part=>part.classList.add('scroll-reveal'));
  return{element,anchor,parts,headline,art,surface,metric,stagger,started:false,visible:false,animations:[]};
 });
 const anchors=new Map();for(const state of states){if(!anchors.has(state.anchor))anchors.set(state.anchor,[]);anchors.get(state.anchor).push(state);}
 function clear(state){for(const animation of state.animations)animation.cancel();state.animations=[];state.parts.forEach(part=>scrollMotions.delete(part));}
 function finish(state){clear(state);state.started=true;state.parts.forEach(part=>part.classList.remove('is-reveal-pending'));state.element.classList.add('has-revealed');}
 function prepare(state){clear(state);state.started=false;state.element.classList.remove('has-revealed');state.parts.forEach(part=>part.classList.add('is-reveal-pending'));}
 function reveal(state){
  if(state.started||paused)return;
  clear(state);state.started=true;state.element.classList.add('has-revealed');
  const compact=window.innerWidth<700,delay=compact?0:state.stagger*110;
  state.parts.forEach((part,index)=>{
   part.classList.remove('is-reveal-pending');
   const lift=state.art?(compact?46:76):state.metric?50:(compact?34:54);
   let frames,duration;
   if(state.headline){frames=[{opacity:0,transform:'translate3d(0,112%,0)'},{opacity:1,transform:'translate3d(0,0,0)'}];duration=1050;}
   else if(state.surface){frames=[{opacity:0},{opacity:1}];duration=650;}
   else if(state.art){frames=[{opacity:0,transform:`translate3d(0,${lift}px,0) scale(.9)`},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}];duration=1150;}
   else if(state.metric){frames=[{opacity:0,transform:'translate3d(0,50px,0) scale(.93)'},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}];duration=1000;}
   else{frames=[{opacity:0,transform:`translate3d(0,${lift}px,0)`},{opacity:1,transform:'translate3d(0,0,0)'}];duration=900;}
   const animation=part.animate(frames,{duration,delay:delay+(state.headline?index*110:0),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
   state.animations.push(animation);scrollMotions.set(part,animation);
   animation.onfinish=()=>{animation.cancel();scrollMotions.delete(part);state.animations=state.animations.filter(item=>item!==animation);};
  });
 }
 // Visible content starts readable. Pending styles are applied only by successful JS.
 for(const state of states){const rect=state.anchor.getBoundingClientRect();if(paused||(rect.top<innerHeight-48&&rect.bottom>0))finish(state);else prepare(state);}
 const enterObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)for(const state of anchors.get(entry.target)||[]){state.visible=entry.isIntersecting;if(entry.isIntersecting){if(paused)finish(state);else reveal(state);}}
 },{rootMargin:'0px 0px -48px 0px',threshold:0});
 const resetObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.isIntersecting)continue;for(const state of anchors.get(entry.target)||[]){if(paused)finish(state);else prepare(state);}}
 },{rootMargin:'180px 0px',threshold:0});
 for(const anchor of anchors.keys()){enterObserver.observe(anchor);resetObserver.observe(anchor);}
 let wasPaused=paused;
 updateScrollTransitions=()=>{
  if(paused===wasPaused)return;wasPaused=paused;
  for(const state of states){if(paused)finish(state);else if(state.visible){prepare(state);reveal(state);}else prepare(state);}
 };
 // Layout changes and filter switches are handled by the observers themselves.
 refreshScrollTransitions=()=>{};
 document.addEventListener('focusin',()=>{
  const focused=document.activeElement;
  for(const state of states)if(state.element.contains(focused)||(state.element.closest('.project-card')?.contains(focused)))finish(state);
 });
 window.addEventListener('pageshow',()=>{if(document.visibilityState==='visible')for(const state of states)if(state.visible&&!state.started)reveal(state);});
}

// Native disclosures remain a no-JavaScript fallback; enhanced controls open a focused case study.
const caseDialog=document.querySelector('#case-dialog');
const caseBody=document.querySelector('#case-dialog-body');
let caseTrigger=null;
let dialogAnimation=null;
let dialogClosing=false;
function closeCase(){
  if(!caseDialog.open||dialogClosing)return;
  dialogClosing=true;
  if(dialogAnimation)dialogAnimation.cancel();
  const finish=()=>{caseDialog.close();dialogClosing=false;};
  if(paused){finish();return;}
  dialogAnimation=caseDialog.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(12px)'}],{duration:160,easing:'ease-in'});
  dialogAnimation.onfinish=finish;
}
if(caseDialog&&typeof caseDialog.showModal==='function'){
  document.querySelectorAll('.project-card details,.research-disclosure').forEach(detail=>{
    const summary=detail.querySelector('summary');
    const button=document.createElement('button');
    button.type='button';button.className=detail.classList.contains('research-disclosure')?'detail-trigger research-trigger':'detail-trigger project-trigger';
    button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','case-dialog');
    for(const child of summary.childNodes)button.append(child.cloneNode(true));
    detail.before(button);detail.hidden=true;
    button.addEventListener('click',()=>{
      if(dialogAnimation)dialogAnimation.cancel();dialogClosing=false;caseTrigger=button;
      const research=detail.classList.contains('research-disclosure');
      document.querySelector('#case-dialog-kind').textContent=research?'RESEARCH / FULL RESULTS':'PROJECT / CASE STUDY';
      document.querySelector('#case-dialog-title').textContent=research?'Learning models for robot planning':detail.closest('.project-card').querySelector('h3').textContent;
      caseBody.replaceChildren();
      const nodes=research?[...detail.children].filter(child=>child!==summary):[detail.querySelector('.project-detail')];
      for(const node of nodes){const clone=node.cloneNode(true);clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));caseBody.append(clone);}
      document.documentElement.classList.add('case-open');caseDialog.showModal();caseBody.scrollTop=0;
      document.querySelector('#case-dialog-close').focus({preventScroll:true});
      if(!paused)dialogAnimation=caseDialog.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
    });
  });
  document.querySelector('#case-dialog-close').addEventListener('click',closeCase);
  caseDialog.addEventListener('cancel',event=>{event.preventDefault();closeCase();});
  caseDialog.addEventListener('click',event=>{if(event.target!==caseDialog)return;const rect=caseDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeCase();});
  caseDialog.addEventListener('close',()=>{document.documentElement.classList.remove('case-open');if(caseTrigger?.isConnected)caseTrigger.focus({preventScroll:true});lastFrame=null;startMotion();});
}

// A short, local ripple makes actions perceptible without introducing a dependency.
document.addEventListener('click',event=>{
  const control=event.target.closest('button,summary,.button');
  if(!control||paused||control.disabled)return;
  const bounds=control.getBoundingClientRect();
  const wave=document.createElement('span');wave.className='click-wave';wave.setAttribute('aria-hidden','true');
  const pointer=event.detail!==0;
  wave.style.left=`${(pointer?event.clientX-bounds.left:bounds.width/2)-10}px`;
  wave.style.top=`${(pointer?event.clientY-bounds.top:bounds.height/2)-10}px`;
  control.append(wave);
  const animation=wave.animate([{transform:'scale(0)',opacity:.2},{transform:`scale(${Math.min(48,bounds.width,bounds.height)/20})`,opacity:0}],{duration:280,easing:'ease-out'});
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
function measureSections(){sectionOffsets=scrollSections.map(element=>({element,id:element.id,top:element.getBoundingClientRect().top+window.scrollY}));scrollRange=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);refreshScrollTransitions();}
function updateScroll(){
  scrollScheduled=false;
  const scrollTop=window.scrollY;
  updateScrollTransitions();
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
function sizeHero(){document.querySelector('.robot-scene').setAttribute('viewBox','0 0 640 510');}
compactHero.addEventListener('change',sizeHero);sizeHero();

// Home previews use their section anchors; reveal a filtered-out destination first.
document.querySelectorAll('[data-featured-project]').forEach(link=>link.addEventListener('click',()=>{
 const target=document.querySelector(link.hash);
 if(target?.hidden)filterGroup?.querySelector('[data-filter="all"]')?.click();
}));
