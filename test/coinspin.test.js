import assert from 'node:assert/strict';
import test from 'node:test';

import { dragStep, frameUrl, pixelsPerFrame, wrapped } from '../src/frame.js';
import { canSpin, readOptions } from '../src/options.js';
import { CSS } from '../src/style.js';
import CoinSpinDefault, { CoinSpin, version, coinspin, STYLE_ID } from '../src/index.js';

function element(attrs = {}, flags = []) {
  return {
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    hasAttribute(name) {
      return flags.includes(name);
    },
  };
}

test('version and the public entry are stable', () => {
  assert.equal(version, '0.1.0');
  assert.equal(STYLE_ID, 'coinspin-style');
  assert.equal(typeof coinspin, 'function');
  assert.equal(CoinSpinDefault, CoinSpin);
  assert.equal(CoinSpin.name, 'CoinSpin');
});

test('coinspin refuses to bind without a browser document', () => {
  assert.throws(() => coinspin('#product', { folder: 'frames/', filename: 'p-{index}.png', amount: 8 }), /browser/);
});

test('indexes wrap onto 1..amount', () => {
  assert.equal(wrapped(1, 40), 1);
  assert.equal(wrapped(40, 40), 40);
  assert.equal(wrapped(41, 40), 1);
  assert.equal(wrapped(0, 40), 40);
  assert.equal(wrapped(-7, 40), 33);
});

test('frame urls replace {index} after wrapping', () => {
  assert.equal(
    frameUrl('https://cdn.example/spin/', 'case-{index}.png', 41, 40),
    'https://cdn.example/spin/case-1.png',
  );
  assert.equal(frameUrl('frames/', 'coin-{index}.svg', 0, 12), 'frames/coin-12.svg');
});

test('one full drag across the stage is one turn', () => {
  assert.equal(pixelsPerFrame(546, 40), 546 / 40);
  assert.equal(pixelsPerFrame(0, 40), 15);
  const forward = dragStep(1, 80, 400, 10, false);
  assert.deepEqual(forward, { signed: 2, next: 3 });
  const reverse = dragStep(1, 80, 400, 10, true);
  assert.deepEqual(reverse, { signed: -2, next: -1 });
  assert.equal(wrapped(reverse.next, 10), 9);
  assert.deepEqual(dragStep(1, 0, 400, 10, true), { signed: 0, next: 1 });
});

test('options prefer the object and still read Cloudimage attributes', () => {
  const host = element(
    {
      'data-folder': 'https://cdn.example/spin/',
      'data-filename-x': 'case-{index}.png',
      'data-amount-x': '40',
      'data-label': 'Spin the case',
    },
    ['data-spin-reverse', 'data-bottom-circle'],
  );
  const read = readOptions(host);
  assert.equal(read.folder, 'https://cdn.example/spin/');
  assert.equal(read.filename, 'case-{index}.png');
  assert.equal(read.amount, 40);
  assert.equal(read.reverse, true);
  assert.equal(read.bottomCircle, true);
  assert.equal(read.label, 'Spin the case');
  assert.equal(canSpin(read), true);

  const overridden = readOptions(host, { reverse: false, amount: 12, filename: 'other-{index}.png' });
  assert.equal(overridden.reverse, false);
  assert.equal(overridden.amount, 12);
  assert.equal(overridden.filename, 'other-{index}.png');
  assert.equal(overridden.bottomCircle, true);
});

test('a missing pattern does not fall back to a silent default', () => {
  const read = readOptions(element({ 'data-folder': 'frames/', 'data-amount-x': 'nope' }));
  assert.equal(read.amount, 0);
  assert.equal(canSpin(read), false);
  assert.equal(readOptions(element()).amount, 36);
  assert.equal(readOptions(element()).label, 'Spin this picture');
});

test('the stylesheet owns the coinspin namespace', () => {
  assert.match(CSS, /\.coinspin-stage/);
  assert.match(CSS, /#ff8a73/);
  assert.match(CSS, /rotateY\(-16deg\)/);
  assert.equal(CSS.includes('360deg'), false);
  assert.equal(CSS.includes('spin-view'), false);
  assert.match(CSS, /--coinspin-max-height: none/);
});
