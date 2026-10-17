import { CoinSpin, mount, STYLE_ID } from './view.js';

export { CoinSpin, STYLE_ID };
export const version = '0.1.0';

function fail(message) {
  throw new Error(message);
}

/** Bind one viewer. Frames stay unloaded until the poster is clicked. */
export function coinspin(target, options = {}) {
  const view = mount(target, options);
  if (!view.ready) fail('CoinSpin needs a folder, a filename with {index}, and an amount');
  return view;
}

/** Bind every `.coinspin` element under `root` that has frame data. */
export function start(root = globalThis.document) {
  if (!root?.querySelectorAll) fail('CoinSpin runs in a browser document');
  const views = [];
  root.querySelectorAll('.coinspin').forEach((node) => {
    const view = mount(node);
    if (view.ready) views.push(view);
  });
  return views;
}

export default CoinSpin;

if (typeof window !== 'undefined') window.CoinSpin = CoinSpin;
