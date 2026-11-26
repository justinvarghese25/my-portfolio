'use strict';

// Explanatory animation timelines. These illustrate system behavior, not experiment footage.
window.portfolioScenes = (() => {
  const keys = ['reflex', 'mapping', 'incident', 'road'];
  const elements = Object.fromEntries(keys.map(key => [key, document.getElementById(`${key}-scene`)]));
  const origins = new Map(keys.map(key => [key, 0]));
  const activated = new Set();
  const paths = new Map();
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const p = clamp(n); return p * p * (3 - 2 * p); };
  const between = (t, start, end) => smooth((t - start) / (end - start));
  const elementCache = new Map();
  const attributeCache = new WeakMap();
  const el = id => { if (!elementCache.has(id)) elementCache.set(id, document.getElementById(id)); return elementCache.get(id); };
  const set = (id, attribute, value) => {
    const element = el(id), text = String(value);
    let attributes = attributeCache.get(element);
    if (!attributes) { attributes = new Map(); attributeCache.set(element, attributes); }
    if (attributes.get(attribute) !== text) { element.setAttribute(attribute, text); attributes.set(attribute, text); }
  };
  const stage = (key, text) => { const element = el(`${key}-stage`); if (element.textContent !== text) element.textContent = text; };
  function pathInfo(id) {
    if (!paths.has(id)) { const path = el(id); paths.set(id, { path, length: path.getTotalLength() }); }
    return paths.get(id);
  }
  function follow(id, route, fraction, rotationOffset = 0, rotate = true) {
    const {path, length} = pathInfo(route);
    const distance = clamp(fraction) * length;
    const point = path.getPointAtLength(distance);
    const a = path.getPointAtLength(Math.max(0, distance - .5));
    const b = path.getPointAtLength(Math.min(length, distance + .5));
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + rotationOffset;
    set(id, 'transform', `translate(${point.x} ${point.y})${rotate ? ` rotate(${angle})` : ''}`);
    return point;
  }
  function reflex(seconds) {
    const t = (seconds % 10) / 10;
    const ballY = 55 + between(t, .08, .75) * 184;
    const shift = between(t, .31, .49) * (1 - between(t, .85, 1));
    set('reflex-object', 'transform', `translate(280 ${ballY})`);
    set('reflex-object', 'opacity', between(t, 0, .07) * (1 - between(t, .84, .97)));
    set('reflex-robot', 'transform', `translate(${280 - shift * 82} 194)`);
    set('reflex-prediction', 'opacity', between(t, .12, .23) * (1 - between(t, .53, .67)));
    set('reflex-evasion', 'opacity', between(t, .29, .39) * (1 - between(t, .72, .85)));
    stage('reflex', t < .23 ? '01 / Detect the approaching object' : t < .39 ? '02 / Predict its path' : t < .73 ? '03 / Move sideways before impact' : '04 / Object passes · return to ready');
  }
  function incident(seconds) {
    const t = (seconds % 14) / 14;
    const fade = 1 - between(t, .94, 1);
    const detected = between(t, .08, .2) * fade;
    set('incident-detection', 'opacity', detected);
    set('incident-closure', 'opacity', between(t, .22, .34) * fade);
    set('authority-signal', 'opacity', between(t, .2, .3) * fade);
    follow('authority-packet', 'authority-signal', between(t, .22, .43), 0, false);
    set('authority-packet', 'opacity', between(t, .22, .26) * (1 - between(t, .44, .48)));
    set('authority-beacon', 'opacity', .3 + .7 * between(t, .4, .46) * fade);
    set('incident-detour', 'opacity', .12 + .88 * between(t, .43, .56) * fade);
    const {length} = pathInfo('incident-detour');
    const travel = between(t, .43, .93) * (length - 70);
    follow('diverted-car-0', 'incident-detour', (travel + 60) / length);
    follow('diverted-car-1', 'incident-detour', travel / length);
    for (let i=0;i<2;i++) set(`diverted-car-${i}`, 'opacity', between(t, 0, .05) * fade);
    stage('incident', t < .22 ? '01 / Detect the road incident' : t < .44 ? '02 / Alert the authorities' : t < .63 ? '03 / Close the affected route' : '04 / Divert drivers around the blockage');
  }
  let mapRun, mapCycle=0;
  const cells=[...document.querySelectorAll('.local-map-cell,.merged-map-cell')].map(element=>({element,robot:Number(element.dataset.robot),index:Number(element.dataset.cell),local:element.classList.contains('local-map-cell'),last:-1}));
  function newMapRun(seed){
    mapRun=window.createExploration(seed);
    mapRun.robots.forEach((robot,index)=>{
      const points=robot.frames.map(point=>({x:33+point.c*14,y:70+point.r*12}));
      robot.points=points;
      set('local-route-'+index,'d',points.map((p,n)=>(n?'L':'M')+p.x+' '+p.y).join(''));
      set('local-route-'+index,'pathLength',1);
      set('local-route-'+index,'stroke-dasharray','1 1');
      paths.delete('local-route-'+index);
    });
  }
  newMapRun();
  function mapping(seconds){
    const cycle=Math.floor(seconds/32),t=(seconds%32)/32;
    if(cycle!==mapCycle){mapCycle=cycle;newMapRun();}
    const fade=1-between(t,.985,1);
    const stepPositions=mapRun.robots.map((robot,index)=>between(t,.025+index*.015,.80+index*.01)*(robot.frames.length-1));
    mapRun.robots.forEach((robot,index)=>{
      const step=stepPositions[index],lower=Math.min(robot.points.length-1,Math.floor(step)),upper=Math.min(robot.points.length-1,lower+1);
      const a=robot.points[lower],b=robot.points[upper],p=smooth(step-lower);
      set('mapping-robot-'+index,'transform','translate('+(a.x+(b.x-a.x)*p)+' '+(a.y+(b.y-a.y)*p)+')');
      set('local-route-'+index,'stroke-dashoffset',1-step/(robot.frames.length-1));
      const objectIndex=[52,44,60][index];
      const firstSeen=robot.discoveredAt[objectIndex];
      const detected=firstSeen<0?0:(firstSeen===0?1:between(step,firstSeen-.65,firstSeen))*fade;
      set('map-object-'+index,'opacity',detected);
      set('object-marker-'+index,'opacity',detected);
      set('merged-object-'+index,'opacity',between(t,.86+index*.02,.92+index*.01)*fade);
    });
    for(const cell of cells){
      const seen=mapRun.robots[cell.robot].discoveredAt[cell.index];
      const observed=seen<0?0:seen===0?1:between(stepPositions[cell.robot],seen-.65,seen);
      const merged=between(t,.83+cell.robot*.02,.92+cell.robot*.01);
      const reveal=cell.local?observed:observed*between(merged,cell.index/95*.85,Math.min(.99,cell.index/95*.85+.12));
      const opacity=Math.round((.04+.96*reveal*fade)*40)/40;
      if(opacity!==cell.last){cell.element.setAttribute('opacity',opacity);cell.last=opacity;}
    }
    const packet=between(t,.82,.94);
    follow('shared-map-packet','shared-map-merge',packet,0,false);
    set('shared-map-packet','opacity',between(packet,0,.1)*(1-between(packet,.9,1))*fade);
    stage('mapping',t<.38?'01 / Randomized exploration of unknown regions':t<.83?'02 / Sense, identify objects, update the map':t<.95?'03 / Merge the robots’ observations':'04 / Shared map with discovered objects');
  }
  function road(seconds) {
    const t = (seconds % 12) / 12;
    const fade = 1 - between(t, .94, 1);
    set('road-mask', 'opacity', between(t, .1, .46) * fade);
    set('road-scan', 'y', 8 + between(t, .08, .48) * 143);
    set('road-scan', 'opacity', between(t, .05, .1) * (1 - between(t, .49, .54)));
    const {length} = pathInfo('road-lanes');
    set('road-lanes', 'stroke-dasharray', `${length} ${length}`);
    set('road-lanes', 'stroke-dashoffset', length * (1 - between(t, .43, .66)));
    set('road-lanes', 'opacity', fade);
    set('road-follower', 'opacity', between(t, .62, .69) * fade);
    follow('road-follower', 'road-center', between(t, .65, .93), 90);
    stage('road', t < .18 ? '01 / Observe the unmarked road' : t < .49 ? '02 / Segment the drivable surface' : t < .67 ? '03 / Generate virtual lane boundaries' : '04 / Follow the navigation corridor');
  }
  const renderers = {reflex, mapping, incident, road};
  // Complete explanatory stills are present when motion is disabled or JS is unavailable.
  reflex(6.1); mapping(30.5); incident(10.8); road(9.7);
  return {
    activate(scene, seconds) {
      const key = keys.find(key => elements[key] === scene);
      if (key && !activated.has(key)) { origins.set(key, seconds); activated.add(key); }
    },
    draw(seconds, visible) {
      for (const key of keys) if (visible.has(elements[key])) renderers[key](Math.max(0, seconds - origins.get(key)));
    },
    restart(key, seconds) { if (renderers[key]) { origins.set(key, seconds); if(key==='mapping'){mapCycle=0;newMapRun();} renderers[key](0); } },
    preview(key, seconds) { if (renderers[key]) renderers[key](seconds); },
    mappingInfo(){return {seed:mapRun.seed,coverage:mapRun.robots.map(robot=>robot.coverage),signatures:mapRun.robots.map(robot=>robot.signature),frames:mapRun.robots.map(robot=>robot.frames)};}
  };
})();
