'use strict';

// Navigation owns the destination immediately. This layer only draws continuity
// between its old control and new header; it never delays routing or saving.
window.SurfaceTransition = (() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const returns = new Map();
  let active = null;
  const rect = node => {
    const r = node.getBoundingClientRect();
    return {left:r.left,top:r.top,width:r.width,height:r.height};
  };
  const visible = r => r.width > 0 && r.height > 0 && r.top < innerHeight && r.top + r.height > 0;
  const resume = (app,id) => [...app.querySelectorAll('.home-resume')].find(n => n.dataset.to === '#/round/' + id);
  function cancel() {
    const prior = active;
    active = null;
    if (!prior) return;
    prior.effects.forEach(effect => effect.cancel());
    prior.layer?.remove();
  }
  function capture(app, page, id) {
    cancel();
    if (document.hidden || !Element.prototype.animate) return null;
    const from = app.dataset.page;
    const forward = page === 'round' && (from === 'home' || from === 'new');
    const back = from === 'round' && (page === '' || page === 'home');
    if (!forward && !back) return null;
    const roundId = forward ? id : app.dataset.roundId;
    const node = forward
      ? (from === 'home' ? resume(app,id) : app.querySelector('[data-action="start-round"]'))
      : app.querySelector('.round-top');
    if (!node) return null;
    const fromRect = rect(node);
    if (forward && !visible(fromRect)) return null;
    if (forward && from === 'home') {
      returns.set(roundId, scrollY);
      if (returns.size > 20) returns.delete(returns.keys().next().value);
    }
    const label = forward ? node.querySelector('.home-round-title') : node.querySelector('.round-toolbar > span');
    return {forward,roundId,fromRect,canAnimate:visible(fromRect),color:getComputedStyle(node).backgroundColor,
      radius:getComputedStyle(node).borderRadius,label:label?.textContent || '',
      labelRect:label ? rect(label) : null,labelSize:label ? parseFloat(getComputedStyle(label).fontSize) : 0};
  }
  function play(app, change) {
    if (!change || document.hidden) return;
    // Any failure in a decorative effect leaves the synchronously rendered UI usable.
    try {
      if (!change.forward && returns.has(change.roundId)) window.scrollTo(0, returns.get(change.roundId));
      if (!change.canAnimate) return;
      let node = change.forward ? app.querySelector('.round-top') : resume(app,change.roundId);
      if (!node) return;
      if (!visible(rect(node))) node = app.querySelector('.home-new');
      if (!node || !visible(rect(node))) return;
      const to = rect(node), duration = motion.matches ? 120 : change.forward ? 520 : 420;
      const state = {effects:[],layer:null};
      active = state;
      const animate = (el,frames,options={}) => {
        const effect = el.animate(frames,{duration,fill:'both',easing:'cubic-bezier(.22,1,.36,1)',...options});
        state.effects.push(effect);
      };
      if (motion.matches) {
        animate(node,[{opacity:.55},{opacity:1}]);
      } else {
        const layer = document.createElement('div');
        layer.className = 'surface-transition';
        layer.setAttribute('aria-hidden','true');
        const surface = document.createElement('div');
        surface.className = 'surface-transition-shape';
        Object.assign(surface.style,{left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'});
        layer.append(surface);
        document.body.append(layer);
        state.layer = layer;
        const a = change.fromRect;
        animate(surface,[{transform:`translate(${a.left-to.left}px,${a.top-to.top}px) scale(${a.width/to.width},${a.height/to.height})`,backgroundColor:change.color,borderRadius:change.radius},
          {transform:'none',backgroundColor:getComputedStyle(node).backgroundColor,borderRadius:getComputedStyle(node).borderRadius}],{duration:duration*.82});
        animate(surface,[{opacity:1},{opacity:0}],{duration:duration*.25,delay:duration*.7});
        animate(node,[{opacity:0},{opacity:1}],{duration:duration*.4,delay:duration*.55});
        const title = change.forward ? node.querySelector('.round-toolbar > span') : node.querySelector('.home-round-title');
        if (title && change.labelRect && change.label) {
          const target = rect(title), text = document.createElement('span');
          text.className = 'surface-transition-title';
          text.textContent = change.forward ? title.textContent : change.label;
          Object.assign(text.style,{left:target.left+'px',top:target.top+'px',font:getComputedStyle(title).font});
          layer.append(text);
          animate(text,[{transform:`translate(${change.labelRect.left-target.left}px,${change.labelRect.top-target.top}px) scale(${change.labelSize/parseFloat(getComputedStyle(title).fontSize)})`,opacity:1},
            {transform:'none',opacity:1}],{duration:duration*.82});
          animate(text,[{opacity:1},{opacity:1,offset:.6},{opacity:0}]);
        }
        const content = change.forward ? app.querySelector('.scoring-main') : app.querySelector('.home-main');
        if (content) animate(content,[{opacity:0,transform:`translateY(${change.forward?32:-12}px)`},{opacity:1,transform:'none'}],{duration:duration*.65,delay:duration*.25});
        if (change.forward) for (const control of app.querySelectorAll('.strip,.dock')) {
          animate(control,[{opacity:0},{opacity:1}],{duration:duration*.35,delay:duration*.5});
        }
      }
      Promise.allSettled(state.effects.map(effect => effect.finished)).then(() => {
        if (active === state) cancel();
      });
    } catch { cancel(); }
  }
  // Input takes priority over motion, including scoring during the entrance.
  for (const event of ['pointerdown','keydown','resize','pagehide']) window.addEventListener(event,cancel,{capture:true});
  document.addEventListener('visibilitychange',cancel);
  motion.addEventListener('change',cancel);
  return {capture,play,cancel};
})();
