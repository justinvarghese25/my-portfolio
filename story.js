'use strict';
window.portfolioStory=(()=>{
  const intro=document.querySelector('#intro-scene');
  const research=document.querySelector('.robot-scene');
  const player=document.querySelector('.research-cinema');
  const origins=new Map(),started=new Set(),cache=new Map();
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
  const set=(id,key,value)=>{const e=document.getElementById(id),v=String(value),k=id+':'+key;if(cache.get(k)!==v){e.setAttribute(key,v);cache.set(k,v);}};
  const text=(id,value)=>{const e=document.getElementById(id);if(e.textContent!==value)e.textContent=value;};
  const route=document.querySelector('#intro-route'),routeLength=route.getTotalLength();
  const demos=[...document.querySelectorAll('#hero-observations>path')];
  ['M300 175Q355 145 390 255','M450 205Q430 210 390 255','M320 250Q354 218 390 255'].forEach((d,i)=>{demos[i].setAttribute('d',d);demos[i].setAttribute('pathLength','1');});
  const demoLengths=demos.map(path=>path.getTotalLength());
  const points=[...document.querySelectorAll('.learning-point')].map((e,i)=>({e,cluster:Number(e.dataset.cluster),x:Number(e.dataset.x),y:Number(e.dataset.y),dx:Math.cos(i*1.73)*28,dy:Math.sin(i*2.11)*22}));
  let robotState={time:0,override:{x:300,y:175,grip:0}};
  let previousPhase='',previousStep=-2;
  const phaseData={
    observe:['01 / DEMONSTRATIONS','Different examples. Shared relationships.','Compare relative robot and object configurations across three demonstrations. The colored paths illustrate different approaches to the same interaction.','Observe — record relative configurations across demonstrations.'],
    learn:['02 / WORLD-MODEL LEARNING','Discover the structure in the data.','Reduce repetition, form local groups, retain recurring connected regions, and fit numerical relational models.','Learn — turn recurring configurations into reusable relations and action models.'],
    plan:['03 / TASK & MOTION PLANNING','A learned model. A new task.','Use the learned relations and action models to plan a sequence, refine it into robot motion, and execute the transfer in simulation.','Plan & act — use the learned model for a multi-step task and feasible robot motion.']
  };
  function drawIntro(seconds){
    const t=(seconds%14)/14;let p,turn;
    if(t<.05){p=0;turn=0;}else if(t<.45){p=ease((t-.05)/.4);turn=0;}else if(t<.55){p=1;turn=ease((t-.45)/.1)*180;}else if(t<.95){p=1-ease((t-.55)/.4);turn=180;}else{p=0;turn=180+ease((t-.95)/.05)*180;}
    const d=p*routeLength,a=route.getPointAtLength(Math.max(0,d-.5)),b=route.getPointAtLength(Math.min(routeLength,d+.5)),point=route.getPointAtLength(d);
    const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+turn;
    set('intro-rover','transform',`translate(${point.x} ${point.y}) rotate(${angle})`);
    set('intro-goal-ring','opacity',.25+.5*Math.sin(seconds*1.5)**2);
    const focus=Math.floor((seconds%12)/4);
    document.querySelectorAll('[data-intro-skill]').forEach(e=>e.classList.toggle('is-active',Number(e.dataset.introSkill)===focus));
    text('intro-animation-caption',[
      'Perception — turn observations into an understanding of the environment.',
      'Learning & planning — connect useful models to the next decision.',
      'Autonomous action — make those decisions work on a robotic system.'
    ][focus]);
  }
  function drawResearch(seconds){
    const t=seconds%24;
    const distance=Math.min(Math.abs(t-6),Math.abs(t-15),Math.abs(t-24),seconds>=24?t:24);
    player.style.setProperty('--story-opacity',distance<.2?ease(distance/.2):1);
    const phase=t<6?'observe':t<15?'learn':'plan';
    if(phase!==previousPhase){
      previousPhase=phase;player.dataset.heroMode=phase;
      document.querySelectorAll('[data-chapter]').forEach(e=>{const active=e.dataset.chapter===phase;e.classList.toggle('is-active',active);if(active)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');});
      const data=phaseData[phase];text('research-phase-label',data[0]);text('research-phase-title',data[1]);text('research-phase-description',data[2]);text('hero-mode-caption',data[3]);
      document.querySelectorAll('.research-symbols>span').forEach((e,i)=>{e.textContent=(phase==='plan'?['Pick','Transfer','Place']:['Observed poses','Relations','Actions'])[i];});
    }
    const learning=phase==='learn'?(t-6)/9:phase==='plan'?1:0;
    const step=phase==='learn'?Math.min(3,Math.floor(learning*4)):-1;
    if(step!==previousStep){previousStep=step;document.querySelectorAll('[data-learning-step]').forEach(e=>e.classList.toggle('is-active',Number(e.dataset.learningStep)===step));player.dataset.learningStep=String(step);}
    player.style.setProperty('--region-alpha',phase==='learn'?ease((learning-.55)/.4):phase==='plan'?.25:0);
    demos.forEach((path,i)=>{const progress=phase==='observe'?clamp((t-i*2)/1.6):1;path.style.strokeDasharray='1 1';path.style.strokeDashoffset=String(1-progress);});
    if(phase==='observe'){
      const i=Math.min(2,Math.floor(t/2)),p=(t-i*2)/2;
      const distance=(p<.65?ease(p/.65):p<.85?1:1-ease((p-.85)/.15))*demoLengths[i];
      const point=demos[i].getPointAtLength(distance);
      robotState={time:0,override:{x:point.x,y:point.y,grip:ease((p-.62)/.1)*(1-ease((p-.77)/.08))*.7}};
    }else if(phase==='learn')robotState={time:0,override:{x:330,y:185,grip:0}};
    else robotState={time:Math.min(8.45,t-15),override:null};
    document.querySelectorAll('.research-symbols>span').forEach((e,i)=>e.classList.toggle('is-active',phase==='plan'&&i===((t-15)<3.3?0:(t-15)<6.1?1:2)));
    for(const point of points){
      const cluster=ease(learning/.42);
      const x=(point.x+point.dx*(1-cluster)).toFixed(2),y=(point.y+point.dy*(1-cluster)).toFixed(2);
      if(point.lastX!==x){point.e.setAttribute('cx',x);point.lastX=x;}if(point.lastY!==y){point.e.setAttribute('cy',y);point.lastY=y;}
      const recurrence=point.cluster===2?1-ease((learning-.48)/.25):1;
      const opacity=(phase==='observe'?.15*clamp((t-point.cluster*2)/1.6):phase==='learn'?recurrence:0).toFixed(3);
      if(point.lastOpacity!==opacity){point.e.setAttribute('opacity',opacity);point.lastOpacity=opacity;}
    }
  }
  drawIntro(0);drawResearch(0);
  return{
    activate(scene,seconds){if((scene===intro||scene===research)&&!started.has(scene)){started.add(scene);origins.set(scene,seconds);}},
    draw(seconds,visible){if(visible.has(intro))drawIntro(Math.max(0,seconds-(origins.get(intro)||0)));if(visible.has(research))drawResearch(Math.max(0,seconds-(origins.get(research)||0)));},
    robotState:()=>robotState,
    restart(seconds){origins.set(research,seconds);drawResearch(0);},
    previewResearch(seconds){drawResearch(seconds);return robotState;}
  };
})();
