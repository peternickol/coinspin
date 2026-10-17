const TEXT = {
  folder: ['data-coinspin-folder', 'data-folder'],
  filename: ['data-coinspin-filename', 'data-filename-x'],
  amount: ['data-coinspin-amount', 'data-amount-x'],
  poster: ['data-coinspin-poster', 'data-poster'],
  label: ['data-coinspin-label', 'data-label'],
  maxHeight: ['data-coinspin-max-height'],
};

function attr(element, names) {
  if (!element) return '';
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value) return value;
  }
  return '';
}

function present(element, names) {
  if (!element) return false;
  return names.some((name) => element.hasAttribute(name));
}

function amountOf(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
}

/** Options object wins. Data attributes fill anything it leaves out. */
export function readOptions(element, overrides = {}) {
  const specified = overrides.amount ?? overrides.amountX;
  const amount = specified == null
    ? amountOf(attr(element, TEXT.amount), 36)
    : amountOf(specified, 0);
  const filename = overrides.filename ?? overrides.filenameX ?? attr(element, TEXT.filename);
  return {
    folder: overrides.folder ?? attr(element, TEXT.folder),
    filename,
    amount,
    reverse: overrides.reverse ?? present(element, ['data-coinspin-reverse', 'data-spin-reverse']),
    bottomCircle: overrides.bottomCircle ?? present(element, ['data-coinspin-bottom-circle', 'data-bottom-circle']),
    poster: overrides.poster ?? attr(element, TEXT.poster),
    label: overrides.label ?? (attr(element, TEXT.label) || 'Spin this picture'),
    maxHeight: overrides.maxHeight ?? attr(element, TEXT.maxHeight),
  };
}

export function canSpin(options) {
  return Boolean(options.folder && String(options.filename).includes('{index}') && options.amount > 0);
}
