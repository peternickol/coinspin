import { dragStep, frameUrl, wrapped } from './frame.js';
import { hintIcon, orbitMarkup } from './icons.js';
import { canSpin, readOptions } from './options.js';
import { CSS } from './style.js';

export const STYLE_ID = 'coinspin-style';

const live = new WeakMap();
let sheetUsers = 0;

function fail(message) {
  throw new Error(message);
}

export function resolveTarget(target) {
  if (!globalThis.document) fail('CoinSpin runs in a browser document');
  if (typeof target === 'string') {
    const found = document.querySelector(target);
    if (!found) fail(`CoinSpin target not found: ${target}`);
    return found;
  }
  if (target && target.nodeType === 1) return target;
  fail('CoinSpin target must be an element or a selector');
}

function retainSheet() {
  sheetUsers += 1;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function releaseSheet() {
  sheetUsers = Math.max(0, sheetUsers - 1);
  if (sheetUsers === 0) document.getElementById(STYLE_ID)?.remove();
}

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}

export class CoinSpin {
  constructor(target, options = {}) {
    this.el = resolveTarget(target);
    const previous = live.get(this.el);
    if (previous && previous !== this) previous.destroy();
    this.options = readOptions(this.el, options);
    this.controller = new AbortController();
    this.cache = new Map();
    this.canvas = null;
    this.ctx = null;
    this.index = 1;
    this.open = false;
    this.dragging = false;
    this.originX = 0;
    this.originIndex = 1;
    this.ready = canSpin(this.options);
    this._alive = false;
    this.start = null;
    this.stage = null;
    this.orbit = null;
    this.status = null;
    this.poster = null;
    if (!this.ready) return;
    live.set(this.el, this);
    this.mount();
  }

  mount() {
    this.ensureMarkup();
    this.start = this.el.querySelector('.coinspin-start');
    this.stage = this.el.querySelector('.coinspin-stage');
    this.orbit = this.el.querySelector('.coinspin-orbit');
    this.status = this.el.querySelector('.coinspin-status');
    this.poster = this.start?.querySelector('img') || null;
    if (!this.start || !this.stage) {
      this.ready = false;
      live.delete(this.el);
      return;
    }
    retainSheet();
    this._alive = true;
    this.el.classList.add('coinspin');
    this.el.dataset.coinspinReady = 'true';
    if (this.options.maxHeight) {
      this.el.style.setProperty('--coinspin-max-height', this.options.maxHeight);
    }
    const { amount, label } = this.options;
    this.stage.tabIndex = 0;
    this.stage.setAttribute('role', 'slider');
    this.stage.setAttribute('aria-label', label);
    this.stage.setAttribute('aria-valuemin', '1');
    this.stage.setAttribute('aria-valuemax', String(amount));
    this.stage.setAttribute('aria-valuenow', '1');
    this.stage.setAttribute('aria-orientation', 'horizontal');
    this.start.setAttribute('aria-label', label);
    if (this.orbit && !this.options.bottomCircle) this.orbit.hidden = true;

    const signal = this.controller.signal;
    this.start.addEventListener('click', () => this.openViewer(), { signal });
    this.stage.addEventListener('pointerdown', (event) => this.onPointerDown(event), { signal });
    this.stage.addEventListener('pointermove', (event) => this.onPointerMove(event), { signal });
    this.stage.addEventListener('pointerup', () => this.endDrag(), { signal });
    this.stage.addEventListener('pointercancel', () => this.endDrag(), { signal });
    this.stage.addEventListener('keydown', (event) => this.onKey(event), { signal });
  }

  ensureMarkup() {
    const { poster, label, amount, bottomCircle } = this.options;
    if (!this.el.querySelector('.coinspin-start')) {
      const src = poster ? ` src="${escapeAttr(poster)}"` : '';
      this.el.innerHTML = [
        `<button type="button" class="coinspin-start" aria-label="${escapeAttr(label)}">`,
        `<img class="coinspin-frame" alt=""${src} fetchpriority="high" decoding="async" draggable="false">`,
        '</button>',
        `<div class="coinspin-stage" hidden tabindex="0" role="slider" aria-label="${escapeAttr(label)}" aria-valuemin="1" aria-valuemax="${amount}" aria-valuenow="1">`,
        bottomCircle ? orbitMarkup() : '',
        '</div>',
        `<div class="coinspin-hint" aria-hidden="true">${hintIcon()}</div>`,
        '<p class="coinspin-status" hidden role="status"></p>',
      ].join('');
      return;
    }
    let stage = this.el.querySelector('.coinspin-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'coinspin-stage';
      stage.hidden = true;
      this.el.appendChild(stage);
    }
    let hint = this.el.querySelector('.coinspin-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'coinspin-hint';
      hint.setAttribute('aria-hidden', 'true');
      this.el.appendChild(hint);
    }
    if (!hint.querySelector('svg')) hint.innerHTML = hintIcon();
    if (bottomCircle && !this.el.querySelector('.coinspin-orbit')) {
      stage.insertAdjacentHTML('beforeend', orbitMarkup());
    }
    if (!this.el.querySelector('.coinspin-status')) {
      const status = document.createElement('p');
      status.className = 'coinspin-status';
      status.hidden = true;
      status.setAttribute('role', 'status');
      this.el.appendChild(status);
    }
  }

  url(index) {
    const { folder, filename, amount } = this.options;
    return frameUrl(folder, filename, index, amount);
  }

  load(index, priority) {
    const frameIndex = wrapped(index, this.options.amount);
    if (this.cache.has(frameIndex)) return this.cache.get(frameIndex);
    const image = new Image();
    image.decoding = 'async';
    if (priority) image.fetchPriority = priority;
    const pending = new Promise((resolve, reject) => {
      image.onload = () => {
        const ready = image.decode ? image.decode().catch(() => {}) : Promise.resolve();
        ready.then(() => resolve(image));
      };
      image.onerror = () => {
        this.cache.delete(frameIndex);
        reject(new Error(`frame ${frameIndex}`));
      };
    });
    this.cache.set(frameIndex, pending);
    image.src = this.url(frameIndex);
    return pending;
  }

  prefetch(center, direction, distance) {
    const reach = distance || 1;
    for (let step = 1; step <= reach; step += 1) {
      this.load(center + direction * step, 'low').catch(() => {});
    }
  }

  paint(image) {
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    if (!this.canvas || !this.ctx || !w || !h) return false;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(image, 0, 0);
    return true;
  }

  reveal() {
    if (!this.stage.hidden) return;
    this.start.hidden = true;
    this.stage.hidden = false;
    this.stage.focus({ preventScroll: true });
  }

  show(index) {
    const frameIndex = wrapped(index, this.options.amount);
    this.index = frameIndex;
    this.stage.setAttribute('aria-valuenow', String(frameIndex));
    this.stage.setAttribute('aria-valuetext', `Frame ${frameIndex} of ${this.options.amount}`);
    return this.load(frameIndex, 'high').then((image) => {
      if (!this.canvas || this.index !== frameIndex) return;
      if (this.paint(image)) this.reveal();
    });
  }

  fail() {
    this.open = false;
    this.el.classList.remove('is-open');
    this.start.hidden = false;
    this.stage.hidden = true;
    if (this.status) {
      this.status.hidden = false;
      this.status.textContent = 'The spin view did not load. The photo is still shown.';
    }
  }

  openViewer() {
    if (this.open) return;
    this.open = true;
    this.el.classList.add('is-open');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'coinspin-frame';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        this.open = false;
        this.el.classList.remove('is-open');
        return;
      }
      this.stage.insertBefore(this.canvas, this.stage.firstChild);
    }
    const poster = this.poster;
    if (poster && poster.complete && poster.naturalWidth) this.paint(poster);
    if (this.canvas.width > 0 && poster && poster.complete && poster.naturalWidth) this.reveal();
    this.show(1).then(() => {
      this.prefetch(1, 1, 1);
      this.prefetch(1, -1, 1);
    }).catch(() => this.fail());
  }

  markTurned() {
    this.el.classList.add('is-turned');
  }

  onPointerDown(event) {
    if (event.button !== 0) return;
    this.dragging = true;
    this.originX = event.clientX;
    this.originIndex = this.index;
    this.stage.classList.add('is-dragging');
    this.markTurned();
    if (this.status) this.status.hidden = true;
    this.stage.setPointerCapture(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    const width = this.stage.clientWidth || this.el.clientWidth || 600;
    const { signed, next } = dragStep(this.originIndex, event.clientX - this.originX, width, this.options.amount, this.options.reverse);
    if (!signed || next === this.index) return;
    this.show(next).catch(() => {});
    this.prefetch(next, signed > 0 ? 1 : -1, 2);
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    this.stage.classList.remove('is-dragging');
  }

  onKey(event) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    this.markTurned();
    const signed = this.options.reverse ? -step : step;
    this.show(this.index + signed).catch(() => {});
  }

  destroy() {
    this.controller.abort();
    this.cache.clear();
    if (this._alive) releaseSheet();
    this._alive = false;
    this.ready = false;
    this.el.classList.remove('is-open', 'is-turned');
    delete this.el.dataset.coinspinReady;
    if (live.get(this.el) === this) live.delete(this.el);
  }
}

export function mount(target, options) {
  const el = resolveTarget(target);
  const existing = live.get(el);
  if (existing?.ready) return existing;
  return new CoinSpin(el, options);
}
