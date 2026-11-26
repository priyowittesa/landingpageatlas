/** Near the top of the page the header always shows. */
export const REVEAL_ZONE_PX = 96;
/** Smaller movements are ignored, so a trembling touchpad does not flicker the header. */
export const SCROLL_STEP_PX = 8;

export type ScrollReveal = {
  hidden: boolean;
  /** Scroll position the next movement is measured from */
  anchorY: number;
};

/** Hide when the reader scrolls down, show again as soon as they scroll up. */
export function nextScrollReveal(state: ScrollReveal, y: number): ScrollReveal {
  if (y <= REVEAL_ZONE_PX) return { hidden: false, anchorY: y };
  const moved = y - state.anchorY;
  if (Math.abs(moved) < SCROLL_STEP_PX) return state;
  return { hidden: moved > 0, anchorY: y };
}
