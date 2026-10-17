import type { Input } from './Input';

/** Pointer capture keeps held controls reliable when a finger slides off a button. */
export function bindTouchControls(root: HTMLElement, input: Input, focus: () => void, unlock: () => void) {
  const pointers = new Map<number, string>();
  const release = (event: PointerEvent) => {
    const code = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (code && ![...pointers.values()].includes(code)) input.release(code);
  };
  root.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
    const code = button.dataset.key!;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      focus(); unlock();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, code);
      input.press(code);
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    // Screen readers and keyboard activation generate a click without a pointer.
    button.addEventListener('click', event => {
      if (event.detail !== 0) return;
      focus(); unlock(); input.press(code); input.release(code);
    });
  });
  root.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('blur', () => { pointers.clear(); input.clear(); });
}
