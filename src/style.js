export const CSS = `
.coinspin {
  --coinspin-focus: #ff8a73;
  --coinspin-hint-bg: rgba(16, 17, 19, 0.78);
  --coinspin-hint-fg: #f3f1ed;
  --coinspin-hint-border: #656971;
  --coinspin-status: #9aa0a6;
  --coinspin-max-width: 600px;
  --coinspin-max-height: none;
  position: relative;
  max-width: var(--coinspin-max-width);
  margin-inline: auto;
}
.coinspin [hidden] { display: none !important; }
.coinspin-start {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.coinspin-start:focus-visible,
.coinspin-stage:focus-visible {
  outline: 3px solid var(--coinspin-focus);
  outline-offset: 3px;
}
.coinspin-hint {
  position: absolute;
  inset: 0;
  width: 72px;
  height: 72px;
  margin: auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--coinspin-hint-bg);
  color: var(--coinspin-hint-fg);
  border: 1px solid var(--coinspin-hint-border);
  pointer-events: none;
  opacity: 1;
  perspective: 180px;
}
.coinspin-hint .coinspin-icon {
  width: 32px;
  height: 32px;
  display: block;
  transform-origin: center;
  backface-visibility: hidden;
}
.coinspin.is-turned .coinspin-hint { opacity: 0; }
.coinspin-stage {
  position: relative;
  touch-action: none;
  cursor: grab;
  user-select: none;
}
.coinspin-stage.is-dragging { cursor: grabbing; }
.coinspin-stage.is-dragging .coinspin-orbit { opacity: 0; }
.coinspin-frame {
  display: block;
  width: 100%;
  height: auto;
  max-height: var(--coinspin-max-height);
  object-fit: contain;
  background: transparent;
  -webkit-user-drag: none;
  user-select: none;
}
.coinspin-orbit {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 4%;
  height: 42px;
  color: var(--coinspin-hint-fg);
  pointer-events: none;
  opacity: 1;
}
@media (prefers-reduced-motion: no-preference) {
  .coinspin-hint, .coinspin-orbit { transition: opacity 160ms ease; }
  .coinspin-hint .coinspin-icon { animation: coinspin-hint 2.6s ease-in-out infinite; }
}
@keyframes coinspin-hint {
  0%, 100% { transform: rotateY(-16deg); }
  50% { transform: rotateY(16deg); }
}
.coinspin-arc {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 2px;
  width: calc(100% - 44px);
  height: 28px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
}
.coinspin-orbit .coinspin-icon {
  width: 18px;
  height: 18px;
  position: absolute;
  top: 0;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
}
.coinspin-chevron-left { left: 0; }
.coinspin-chevron-right { right: 0; }
.coinspin-status {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--coinspin-status);
}
`;
