<p align="center">
  <img src="docs/logo.png" alt="CoinSpin" width="250">
</p>

<h1 align="center">CoinSpin</h1>

<p align="center">
  A dependency-free 360 viewer for the browser.<br>
  MIT licensed. No build step. No runtime dependencies.
</p>

<p align="center">
  <a href="https://peternickol.github.io/coinspin/">Live demo</a>
  &nbsp;·&nbsp;
  <a href="#install">Install</a>
  &nbsp;·&nbsp;
  <a href="#quick-start">Quick start</a>
  &nbsp;·&nbsp;
  <a href="#markup">Markup</a>
  &nbsp;·&nbsp;
  <a href="#options">Options</a>
  &nbsp;·&nbsp;
  <a href="#license">License</a>
</p>

CoinSpin shows one still photo, then loads frames as the picture turns. The first request is the poster. A click, a drag, or an arrow key opens the viewer and asks for the current frame and one neighbor on each side.

Pass an element and an options object, or mark the element and call `start()`. Types ship in `coinspin.d.ts`.

## Install

The package entry is `src/index.js`. Install from a checkout of this repository:

```bash
npm install /path/to/coinspin
```

```js
import { coinspin } from 'coinspin';
```

A page can import the module directly. Serve the page over HTTP. Module imports do not run from a `file://` address.

```html
<div id="product"></div>
<script type="module">
  import { coinspin } from './src/index.js';

  coinspin('#product', {
    folder: 'frames/',
    filename: 'product-{index}.png',
    amount: 36,
    poster: 'frames/product-1.png',
    label: 'Spin the product',
  });
</script>
```

The demo is in this repository at [`demo/index.html`](demo/index.html).

```bash
npm run demo
```

Then open `http://127.0.0.1:4174/demo/`.

## Quick start

`coinspin()` draws the poster immediately and returns the viewer. Frame images stay unloaded until the poster is clicked. The [demo](demo/index.html) is the same viewer.

```js
import { coinspin } from 'coinspin';

const view = coinspin('#product', {
  folder: 'https://cdn.example/spin/',
  filename: 'product-{index}.png',
  amount: 40,
  reverse: true,
  bottomCircle: true,
  poster: '/photos/product.jpg',
  label: 'Spin the product',
});
```

`new CoinSpin(element, options)` is the same viewer. It leaves `ready` false when the folder, the `{index}` pattern, or the amount is missing. `coinspin()` throws in that case. In the browser that constructor is also `window.CoinSpin`.

```js
import { CoinSpin } from 'coinspin';

const view = new CoinSpin(document.querySelector('#product'), {
  folder: 'frames/',
  filename: 'product-{index}.png',
  amount: 36,
  poster: 'frames/product-1.png',
});

view.destroy();
```

## Frames

`filename` must contain `{index}`. Indexes are 1-based and wrap, so frame 0 and frame 41 of a 40-frame spin are both frame 40 and frame 1.

Drag distance follows the width of the stage. One full drag across the picture is one full turn. `reverse` makes a drag to the right step backward, which matches pictures shot on a turntable that rotated the other way.

Arrow keys step one frame. `reverse` flips those keys the same way.

The hint rocks until the first drag or arrow key, then fades. The bottom arc fades while the pointer is down. Both honor `prefers-reduced-motion`.

Opening the viewer fetches the current frame and one neighbor on each side. A drag fetches two frames ahead of the pointer.

If a frame fails, the poster comes back and the status reads "The spin view did not load. The photo is still shown."

## Markup

Leave the poster in the HTML when it is the large picture on the page. `start()` binds every `.coinspin` that already has its frame data.

```html
<div
  class="coinspin"
  data-folder="https://cdn.example/spin/"
  data-filename-x="product-{index}.png"
  data-amount-x="40"
  data-spin-reverse
  data-bottom-circle
  data-label="Spin the product"
>
  <button type="button" class="coinspin-start">
    <img class="coinspin-frame" alt="" src="/photos/product.jpg" fetchpriority="high">
  </button>
  <div class="coinspin-stage" hidden tabindex="0" role="slider"></div>
  <p class="coinspin-status" hidden role="status"></p>
</div>
<script type="module">
  import { start } from './src/index.js';
  start();
</script>
```

`data-folder`, `data-filename-x`, `data-amount-x`, `data-spin-reverse`, and `data-bottom-circle` are the Cloudimage attribute names. `data-coinspin-folder`, `data-coinspin-filename`, `data-coinspin-amount`, `data-coinspin-reverse`, and `data-coinspin-bottom-circle` are the same fields.

The injected stylesheet is `#coinspin-style`. The picture height is `--coinspin-max-height`, which defaults to `none`. Focus, hint, and status colors are `--coinspin-focus`, `--coinspin-hint-bg`, `--coinspin-hint-fg`, `--coinspin-hint-border`, and `--coinspin-status`.

## Remove

`destroy()` removes the listeners and drops the injected stylesheet when no viewer still uses it.

| Name | What it does |
| --- | --- |
| `destroy()` | Remove the viewer and its listeners |
| `ready` | False when the folder, pattern, or amount is missing |
| `index` | Current frame, from 1 to `amount` |
| `options` | The settings the viewer is using |
| `el` | The host element |

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `folder` | | Directory of the frames, with a trailing slash |
| `filename` | | File pattern containing `{index}`. `filenameX` is the same field |
| `amount` | `36` | Frame count. `amountX` is the same field |
| `reverse` | `false` | Drag right, and ArrowRight, step backward |
| `bottomCircle` | `false` | Draw the arc under the picture |
| `poster` | | Still photo shown before the click |
| `label` | `Spin this picture` | Accessible name of the button and the slider |
| `maxHeight` | | Sets `--coinspin-max-height` |

`coinspin()` throws when the folder, the `{index}` pattern, or the amount is missing. `start()` skips that element. `new CoinSpin` sets `ready` to false and does not throw.

## Develop

```bash
npm test
```

Tests cover frame indexes, drag steps, and option reading. `test/browser.test.js` loads the demo in a browser. Opening the viewer needs a browser.

## License

CoinSpin is [MIT licensed](LICENSE). Copyright (c) 2026 CoinSpin contributors.

You can use it in a commercial product, modify it, and distribute it. The MIT grant includes sale. Copies and substantial portions keep the copyright notice and the permission notice from [LICENSE](LICENSE).

This repository is an original implementation. Those MIT terms are the license that applies to it.

The hint and chevron paths are from Lucide 1.57.0 (`rotate-3d`, `chevron-left`, `chevron-right`). Lucide is ISC. The chevrons descend from Feather, which is MIT. Those notices are in `src/icons.js`.
