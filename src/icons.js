/*
  Hint and chevron paths are from Lucide 1.57.0 (rotate-3d, chevron-left, chevron-right).
  Lucide is ISC. chevron-left and chevron-right descend from Feather, which is MIT.
  Copyright (c) 2026 Lucide Icons and Contributors
  Copyright (c) 2013-present Cole Bemis
*/

function svg(className, body) {
  return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function hintIcon() {
  return svg(
    'coinspin-icon',
    '<path d="m15.194 13.707 3.814 1.86-1.86 3.814"/><path d="M16.47214 7.52786 A 5 10 0 1 0 13 21.79796"/><path d="M21.79796 11 A 10 5 0 1 0 19 15.57071"/>',
  );
}

export function orbitMarkup() {
  const left = svg('coinspin-icon coinspin-chevron-left', '<path d="m15 18-6-6 6-6"/>');
  const right = svg('coinspin-icon coinspin-chevron-right', '<path d="m9 18 6-6-6-6"/>');
  return `<div class="coinspin-orbit"><svg class="coinspin-arc" viewBox="0 0 200 36" aria-hidden="true" focusable="false"><path d="M18 8C52 34 148 34 182 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${left}${right}</div>`;
}
