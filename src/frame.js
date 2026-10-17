/** 1-based index wrapped onto 1..amount. */
export function wrapped(index, amount) {
  return ((index - 1) % amount + amount) % amount + 1;
}

export function frameUrl(folder, pattern, index, amount) {
  return `${folder}${String(pattern).replaceAll('{index}', String(wrapped(index, amount)))}`;
}

export function pixelsPerFrame(width, amount) {
  const span = width > 0 ? width : 600;
  const count = amount > 0 ? amount : 1;
  return Math.max(8, span / count);
}

/** Drag math. `next` is unwrapped; the viewer wraps it when the frame changes. */
export function dragStep(originIndex, deltaX, width, amount, reverse) {
  const steps = Math.round(deltaX / pixelsPerFrame(width, amount));
  const signed = (reverse ? -steps : steps) || 0;
  return { signed, next: originIndex + signed };
}
