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
  const el = id => document.getElementById(id);
  const set = (id, attribute, value) => el(id).setAttribute(attribute, String(value));
  const stage = (key, text) => { el(`${key}-stage`).textContent = text; };
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
  const cells = [...document.querySelectorAll('.local-map-cell,.merged-map-cell')];
  function mapping(seconds) {
    const t = (seconds % 16) / 16;
    const fade = 1 - between(t, .95, 1);
    for (let i=0;i<3;i++) {
      const progress = between(t, .04 + i * .035, .53 + i * .025);
      follow(`mapping-robot-${i}`, `local-route-${i}`, progress, 0, false);
      const packet = between(t, .57 + i*.035, .75 + i*.035);
      follow(`merge-packet-${i}`, `merge-path-${i}`, packet, 0, false);
      set(`merge-packet-${i}`, 'opacity', between(packet, 0, .1) * (1 - between(packet, .9, 1)) * fade);
    }
    for (const cell of cells) {
      const robot = Number(cell.dataset.robot);
      const rank = Number(cell.dataset.cell) / 35;
      const local = cell.classList.contains('local-map-cell');
      const progress = local ? between(t, .03 + robot*.035, .53 + robot*.025) : between(t, .68 + robot*.035, .82 + robot*.035);
      const revealed = smooth((progress - rank * .88) / .12) * fade;
      cell.setAttribute('opacity', .06 + .94 * revealed);
    }
    stage('mapping', t < .58 ? '01 / Robots record separate local areas' : t < .77 ? '02 / Share and align partial maps' : '03 / Merge into one environment map');
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
  reflex(6.1); mapping(13.8); incident(10.8); road(9.7);
  return {
    activate(scene, seconds) {
      const key = keys.find(key => elements[key] === scene);
      if (key && !activated.has(key)) { origins.set(key, seconds); activated.add(key); }
    },
    draw(seconds, visible) {
      for (const key of keys) if (visible.has(elements[key])) renderers[key](Math.max(0, seconds - origins.get(key)));
    },
    restart(key, seconds) { if (renderers[key]) { origins.set(key, seconds); renderers[key](0); } },
    preview(key, seconds) { if (renderers[key]) renderers[key](seconds); }
  };
})();
