'use strict';
window.portfolioStory=(()=>{
 const intro=document.querySelector('#intro-scene'),research=document.querySelector('.robot-scene'),player=document.querySelector('.research-cinema');
 const origins=new Map(),started=new Set(),cache=new Map(),ns='http://www.w3.org/2000/svg';
 const $=id=>document.getElementById(id),clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
 function set(id,key,value){const v=String(value),k=id+key;if(cache.get(k)!==v){$(id).setAttribute(key,v);cache.set(k,v);}}
 function text(id,value){if($(id).textContent!==value)$(id).textContent=value;}
 function node(tag,attrs,parent){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));$(parent).append(e);return e;}
 let now=0,researchOffset=0;
 const colors=['#729052','#568b83','#b69b61'];
 let exploration=window.createExploration(),lastCycle=-1;
 const cells=Array.from({length:288},(_,i)=>node('rect',{id:'signature-cell-'+i,x:(i%24)*9,y:Math.floor(i/24)*9,width:8,height:8,rx:1,fill:'#e3e9da'},'signature-map'));
 for(let i=0;i<3;i++){
  const g=node('g',{id:'signature-robot-'+i},'signature-robots');
  const circle=document.createElementNS(ns,'circle');circle.setAttribute('r','8');circle.setAttribute('fill',colors[i]);circle.setAttribute('fill-opacity','.15');g.append(circle);
  const body=document.createElementNS(ns,'rect');Object.entries({x:-4,y:-4,width:8,height:8,rx:2,fill:colors[i],stroke:'#f6f7ee','stroke-width':1.2}).forEach(([k,v])=>body.setAttribute(k,v));g.append(body);
 }
 const detour=$('signature-detour'),detourLength=detour.getTotalLength();
 // A compact demonstration-to-relation story, sized to remain legible in the intro.
 function drawDemoPreview(seconds){
  const t=(seconds+2.8)%11,frames=[[0,125,48,0],[1,135,85,0],[1.6,135,85,1],[2.8,135,52,1],[4.8,185,62,1],[5.8,185,95,1],[6.5,185,95,0],[8,125,48,0],[11,125,48,0]];
  const index=Math.max(0,frames.findIndex(f=>f[0]>t)-1),from=frames[index],to=frames[index+1],p=ease((t-from[0])/(to[0]-from[0]));
  const x=from[1]+(to[1]-from[1])*p,y=from[2]+(to[2]-from[2])*p;
  const dx=x-57,dy=y-89,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,(d*d+65*65-75*75)/(2*d*65)))),ex=57+65*Math.cos(angle),ey=89+65*Math.sin(angle),path=`M57 89L${ex} ${ey}L${x} ${y-3}`;
  ['edge','','highlight'].forEach(k=>set('signature-demo-arm'+(k?'-'+k:''),'d',path));
  const grip=from[3]+(to[3]-from[3])*p,gap=10-grip*3;set('signature-demo-fingers','d',`M${-gap} 2V10L${-gap+3} 13M${gap} 2V10L${gap-3} 13`);
  set('signature-demo-joint','transform',`translate(${ex} ${ey})`);set('signature-demo-gripper','transform',`translate(${x} ${y})`);
  const object=t<1.3?[135,104]:t<6.2?[x,y+19]:[185,114];set('signature-demo-object','transform',`translate(${object[0]} ${object[1]})`);
  set('signature-demo-trace','stroke-dashoffset',1-ease((t-1.3)/4.5));
  set('signature-demo-trace','opacity',.25+.55*ease(t/3));
  const model=ease((t-5.8)/1.7);set('signature-learned-region','opacity',.2+.8*model);set('signature-demo-observations','opacity',.15+.85*model);
 }
 function drawIntro(seconds){
  const t=seconds+5;
  drawDemoPreview(seconds);
  const cycle=Math.floor(t/32),p=(t%32)/32;
  if(cycle!==lastCycle){if(lastCycle!==-1)exploration=window.createExploration();lastCycle=cycle;}
  exploration.robots.forEach((robot,i)=>{
   const progress=p*(robot.frames.length-1),frame=Math.floor(progress),next=Math.min(frame+1,robot.frames.length-1),mix=ease(progress-frame),from=robot.frames[frame],to=robot.frames[next];
   set('signature-robot-'+i,'transform',`translate(${22+(from.c+(to.c-from.c)*mix)*9+4} ${20+(from.r+(to.r-from.r)*mix)*9+4})`);
   for(let row=0;row<12;row++)for(let col=0;col<8;col++){const c=i*8+col,index=row*24+c,at=robot.discoveredAt[row*8+col],known=at>=0&&at<=frame;set(cells[index].id,'fill',known?(exploration.occupied(row,c)?'#637556':colors[i]):'#e3e9da');set(cells[index].id,'opacity',known?(exploration.occupied(row,c)?1:.28):.5);}
  });
  const car=detour.getPointAtLength((t%9)/9*detourLength),before=detour.getPointAtLength(Math.max(0,(t%9)/9*detourLength-.5)),angle=Math.atan2(car.y-before.y,car.x-before.x)*180/Math.PI;
  set('signature-car','transform',`translate(${car.x} ${car.y}) rotate(${angle})`);set('signature-alert','stroke-dashoffset',-t*6);set('signature-incident','opacity',.6+.4*Math.sin(t*.7)**2);
 }
 // Each π is built from two upright supports and one spanning plank.
 const demo=[{x:365,y:299,a:0},{x:455,y:299,a:0},{x:410,y:246,a:-90}];
 const pyramid=[{x:290,y:299,a:0},{x:380,y:299,a:0},{x:335,y:246,a:-90},{x:450,y:299,a:0},{x:540,y:299,a:0},{x:495,y:246,a:-90},{x:370,y:193,a:0},{x:460,y:193,a:0},{x:415,y:140,a:-90}];
 // Keep depth in the camera direction as a plank rotates into place.
 const plankAngles=[];
 const planks=pyramid.map((_,i)=>{const id='keva-plank-'+i,group=node('g',{id},'keva-planks');
  node('path',{id:id+'-sides',fill:'#869452',stroke:'#738248','stroke-width':.7,'stroke-linejoin':'round'},id);
  node('path',{id:id+'-front',fill:'url(#keva-wood)',stroke:'#8d9c5a','stroke-width':.8,'stroke-linejoin':'round'},id);
  node('path',{id:id+'-grain',fill:'none',stroke:'#f0f1cd','stroke-width':.6,'stroke-opacity':.42,'stroke-linecap':'round'},id);
  node('path',{id:id+'-edge',fill:'none',stroke:'#e5ecc1','stroke-width':.8,'stroke-opacity':.65},id);return group;
 });
 function shapePlank(i,angle){
  if(plankAngles[i]===angle)return;plankAngles[i]=angle;
  const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),rotate=([x,y])=>[x*c-y*s,x*s+y*c],p=[[-7,-46],[7,-46],[7,46],[-7,46]].map(rotate),depth=[6,-4];
  const polygon=points=>'M'+points.map(p=>p.map(n=>n.toFixed(2)).join(' ')).join('L')+'Z';
  let sides='';for(let j=0;j<4;j++){const a=p[j],b=p[(j+1)%4];if((b[1]-a[1])*depth[0]-(b[0]-a[0])*depth[1]>0)sides+=polygon([a,b,[b[0]+depth[0],b[1]+depth[1]],[a[0]+depth[0],a[1]+depth[1]]]);}
  const id='keva-plank-'+i;set(id+'-sides','d',sides);set(id+'-front','d',polygon(p));set(id+'-front','fill',Math.abs(angle)%180>45?'url(#keva-wood-horizontal)':'url(#keva-wood)');
  const grain=[[-3,-37],[-2,-15],[-3,13],[-2,37],[2,-33],[3,-8],[2,19],[3,39]].map(rotate);
  set(id+'-grain','d','M'+grain.slice(0,4).map(p=>p.join(' ')).join('L')+'M'+grain.slice(4).map(p=>p.join(' ')).join('L'));set(id+'-edge','d','M'+p[0].join(' ')+'L'+p[1].join(' '));
 }
 pyramid.forEach(p=>node('rect',{x:-7,y:-46,width:14,height:92,rx:2,transform:`translate(${p.x} ${p.y}) rotate(${p.a})`},'keva-target'));
 for(let i=0;i<32;i++)node('circle',{id:'keva-point-'+i,r:2.8,fill:i%2?'#8366ad':'#278b87'},'keva-cloud');
 const data={
  observe:['01 / KEVA DEMONSTRATION','Start with a simple π.','The robot places two supports and bridges them with a third plank. Demonstrations supply relative configurations between the gripper and planks, and between neighboring planks.','Demonstrate a three-plank π; record the relative configurations.'],
  learn:['02 / RELATIONAL LEARNING','Learn what connects the pieces.','Group recurring relative configurations into relational critical regions (RCRs). Teal shows robot–plank relations; violet marks plank–plank relations at the plank midpoints. These reusable relations feed the planning model.','Learn robot–plank and plank–plank RCRs from recurring configurations.'],
  plan:['03 / COMPOSE A LARGER TASK','Reuse relations. Build a π pyramid.','The learned relations and action models guide a larger assembly: two lower π units support a third. The animation illustrates planning and execution beyond the simple demonstration.','Plan a new assembly and execute the nine-plank sequence.']
 };
 // Solve the arm at the rotating wrist, not at the object's center.
 function arm(pose){
  const {x,y,angle,grip}=pose,r=angle*Math.PI/180,wx=x+26*Math.sin(r),wy=y-26*Math.cos(r);
  const dx=wx-105,dy=wy-290,d=Math.min(474.99,Math.max(15.01,Math.hypot(dx,dy))),a=230,b=245;
  const bend=Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,(d*d+a*a-b*b)/(2*d*a)))),ex=105+a*Math.cos(bend),ey=290+a*Math.sin(bend);
  const path=`M105 290L${ex} ${ey}L${wx} ${wy}`;
  ['shadow','link','highlight'].forEach(k=>set('keva-arm-'+k,'d',path));set('keva-elbow','transform',`translate(${ex} ${ey})`);
  set('keva-gripper','transform',`translate(${x} ${y}) rotate(${angle})`);
  const opening=9*(1-grip);set('keva-jaw-left','transform',`translate(${-opening} 0)`);set('keva-jaw-right','transform',`translate(${opening} 0)`);
  set('keva-gripper','data-state',pose.stage);set('keva-gripper','data-held-plank',pose.held??'');
 }
 // Explicit pick, carry, rotate, place and release phases keep the grasp rigid.
 function manipulation(p,f){
  const source={x:275,y:225},home={x:275,y:150},clearance=75;
  let pose={...home,angle:0,grip:0,stage:'APPROACH',held:null},object={...source,angle:0};
  const mix=(a,b,t)=>a+(b-a)*ease(t);
  if(f<.08){pose.y=mix(home.y,source.y,f/.08);}
  else if(f<.15){pose={...pose,...source,grip:ease((f-.08)/.07),stage:'CLOSE GRIP'};}
  else if(f<.26){pose={...pose,...source,y:mix(source.y,home.y,(f-.15)/.11),grip:1,stage:'LIFT'};}
  else if(f<.52){const u=(f-.26)/.26;pose={...pose,x:mix(home.x,p.x,u),y:mix(home.y,p.y-clearance,u)-Math.sin(u*Math.PI)*18,angle:p.a*ease(u),grip:1,stage:p.a?'CARRY + ROTATE':'CARRY'};}
  else if(f<.65){pose={...pose,x:p.x,y:mix(p.y-clearance,p.y,(f-.52)/.13),angle:p.a,grip:1,stage:'LOWER'};}
  else if(f<.70){pose={...pose,x:p.x,y:p.y,angle:p.a,grip:1,stage:'SETTLE'};}
  else if(f<.78){pose={...pose,x:p.x,y:p.y,angle:p.a,grip:1-ease((f-.70)/.08),stage:'OPEN GRIP'};}
  else if(f<.86){pose={...pose,x:p.x,y:mix(p.y,p.y-45,(f-.78)/.08),angle:p.a,stage:'WITHDRAW'};}
  else{const u=(f-.86)/.14;pose={...pose,x:mix(p.x,home.x,u),y:mix(p.y-45,home.y,u)-Math.sin(u*Math.PI)*25,angle:p.a*(1-ease(u)),stage:'RETURN'};}
  if(f>=.15&&f<.70)object={x:pose.x,y:pose.y,angle:pose.angle};
  else if(f>=.70)object={x:p.x,y:p.y,angle:p.a};
  return {pose,object,carrying:f>=.15&&f<.70};
 }
 function drawResearch(seconds){
  const t=((seconds%34)+34)%34,phase=t<8?'observe':t<17?'learn':'plan',local=phase==='observe'?t:phase==='learn'?t-8:t-17;
  player.dataset.heroMode=phase;
  document.querySelectorAll('[data-chapter]').forEach(e=>{const on=e.dataset.chapter===phase;e.classList.toggle('is-active',on);e.querySelector('button').setAttribute('aria-pressed',String(on));});
  const c=data[phase];text('research-phase-label',c[0]);text('research-phase-title',c[1]);text('research-phase-description',c[2]);text('hero-mode-caption',c[3]);
  const learning=phase==='learn'?local/9:0;
  document.querySelectorAll('[data-learning-step]').forEach(e=>e.classList.toggle('is-active',phase==='learn'&&+e.dataset.learningStep===Math.min(3,Math.floor(learning*4))));
  document.querySelectorAll('.research-symbols>span').forEach((e,i)=>{e.textContent=(phase==='plan'?['Support','Bridge','Compose']:['Demonstrations','RCRs','Action models'])[i];});
  const targets=phase==='plan'?pyramid:demo,duration=phase==='plan'?1.6:2.4;
  const progress=phase==='learn'?3:Math.min(targets.length,local/duration),index=Math.floor(progress),f=progress-index;
  let pose={x:275,y:150,angle:0,grip:0,stage:'ASSEMBLY COMPLETE',held:null};
  planks.forEach((e,i)=>{
   const p=targets[i];set(e.id,'visibility',p&&i<=index?'visible':'hidden');if(!p)return;
   let object={x:p.x,y:p.y,angle:p.a};
   if(i===index){const state=manipulation(p,f);object=state.object;pose=state.pose;pose.held=state.carrying?i:null;}
   shapePlank(i,Number(object.angle.toFixed(2)));set(e.id,'transform',`translate(${object.x.toFixed(3)} ${object.y.toFixed(3)})`);
  });
  if(phase==='learn')pose={x:410,y:246,angle:-90,grip:1,stage:'LEARN RELATIONS',held:null};
  arm(pose);
  set('keva-target','opacity',phase==='plan'?.22:0);
  set('keva-relations','opacity',phase==='learn'?ease((learning-.35)/.3):0);
  set('keva-grip-region','opacity',phase==='learn'?1:0);
  for(let i=0;i<32;i++){
   const u=ease(learning/.65),odd=i%2,x=odd?(i%4===1?365:455):410,y=odd?299:242;
   set('keva-point-'+i,'cx',x+Math.cos(i*2.3)*(8+(1-u)*65));set('keva-point-'+i,'cy',y+Math.sin(i*1.7)*(5+(1-u)*52));set('keva-point-'+i,'opacity',phase==='learn'?.65:0);
  }
  text('keva-structure-label',phase==='plan'?'NEW TASK / π PYRAMID':'DEMONSTRATED / π');
  text('keva-step-label',phase==='learn'?'02 / LEARN RECURRING RELATIONS':phase==='plan'?`03 / ${Math.min(9,index+1)} OF 9 PLANKS${index>=9?' · COMPLETE':''}`:'01 / TWO SUPPORTS + ONE BRIDGE');
  text('robot-stage',phase==='observe'?'DEMONSTRATE / π':phase==='learn'?'LEARN / RELATIONAL REGIONS':`PLAN & ACT / ${pose.stage}`);
 }
 document.querySelectorAll('[data-research-phase]').forEach(e=>e.addEventListener('click',()=>{const start={observe:0,learn:8,plan:17}[e.dataset.researchPhase];researchOffset=start-(now-(origins.get(research)||0));drawResearch(start);}));
 drawIntro(0);drawResearch(0);
 return {activate(scene,seconds){if((scene===intro||scene===research)&&!started.has(scene)){started.add(scene);origins.set(scene,seconds);}},draw(seconds,visible){now=seconds;if(visible.has(intro))drawIntro(seconds-(origins.get(intro)||0));if(visible.has(research))drawResearch(seconds-(origins.get(research)||0)+researchOffset);},restart(seconds){origins.set(research,seconds);researchOffset=0;drawResearch(0);},previewResearch:drawResearch,previewIntro:drawIntro};
})();
