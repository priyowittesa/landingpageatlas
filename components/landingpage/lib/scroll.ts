let glideFrame = 0;

// Native `behavior: "smooth"` has a fixed, short duration. This glide is slower and
// scales with distance (1.1s – 2.2s), easing in and out; any user input cancels it.
export function glideTo(targetY: number) {
  cancelAnimationFrame(glideFrame);
  // The wheel inertia may still be easing toward the spot the user scrolled to. Both loops call
  // scrollTo every frame, so without this the wheel one wins and drags the page back.
  window.dispatchEvent(new Event("atlas:scroll-jump"));
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.min(Math.max(0, targetY), Math.max(0, maxY));
  const distance = endY - startY;
  if (Math.abs(distance) < 2) return;

  const duration = Math.min(2200, Math.max(1100, 700 + Math.abs(distance) * 0.35));
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const cancelEvents = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  const stop = () => {
    cancelAnimationFrame(glideFrame);
    cancelEvents.forEach((name) => window.removeEventListener(name, stop));
  };
  cancelEvents.forEach((name) =>
    window.addEventListener(name, stop, { passive: true })
  );

  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) glideFrame = requestAnimationFrame(step);
    else stop();
  };
  glideFrame = requestAnimationFrame(step);
}

function canScrollInside(start: Element | null, deltaY: number) {
  for (let el = start; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
    }
  }
  return false;
}

// Mouse-wheel inertia: the wheel moves a target position and the page eases toward it
// every frame, so notches glide instead of jumping. Native scrolling is untouched for
// touch, keyboard, zoom, horizontal gestures and nested scrollers.
export function attachSmoothWheel() {
  let target = window.scrollY;
  let position = target;
  let frame = 0;
  let last = 0;
  const EASE = 0.075; // per 16.7ms frame; lower = slower, floatier

  const tick = (now: number) => {
    const dt = Math.min(48, now - last) / 16.7;
    last = now;
    // Browsers snap scroll positions to whole pixels; keep our own float position or
    // sub-pixel steps stall a few pixels short of the target.
    if (Math.abs(window.scrollY - position) > 2) position = window.scrollY;
    const k = 1 - Math.pow(1 - EASE, dt);
    position += (target - position) * k;
    if (Math.abs(target - position) < 0.5) {
      position = target;
      window.scrollTo(0, target);
      frame = 0;
      return;
    }
    window.scrollTo(0, position);
    frame = requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.shiftKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      event.deltaY === 0
    )
      return;
    if (canScrollInside(event.target as Element | null, event.deltaY)) return;

    event.preventDefault();
    const unit =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (!frame) target = position = window.scrollY;
    target = Math.min(Math.max(0, target + event.deltaY * unit), max);
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  // Keyboard, scrollbar drags and anchor glides move the page on their own: resync.
  const onScroll = () => {
    if (!frame) target = position = window.scrollY;
  };

  // The page moves itself (a filter change jumps back to the list): drop the glide so it cannot undo the jump.
  const onJump = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    target = position = window.scrollY;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("atlas:scroll-jump", onJump);
  return () => {
    window.removeEventListener("atlas:scroll-jump", onJump);
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
  };
}
