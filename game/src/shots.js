// Sizzle & Serve: the screenshot scenes behind ?shot=cover|grill|rush|serve.
// Each one plays the real rules forward from a fresh seeded world, steered by
// a scripted cook (walk to a station, press E, wait), so every frame is what a
// short game really looks like — and the same seed always gives the same frame.
import { STATIONS, STEP } from './config.js';
import { createWorld, startShift, stepWorld } from './kitchen.js';

const SHOT_SEED = 7;
const MAX_STEPS = 24000;

/** Build one scripted input step from the driver's current move target. */
function steerInput(target) {
  const input = { up: false, down: false, left: false, right: false, interact: false, moveTarget: null };
  if (!target) return input;
  input.moveTarget = target;
  return input;
}

/**
 * Run `ops` against a fresh world. An op is { to, presses, pressGap, waitAfter }
 * (walk to a station, press E that many times, then wait), { wait } (stand
 * still), { toPoint } (walk to a floor point and stop), or { until } (stand
 * still until the shift clock reaches that time).
 */
function runScript(ops) {
  const world = createWorld(SHOT_SEED);
  startShift(world);
  let opIndex = 0;
  let arrived = false;
  let pressesDone = 0;
  let pressTimer = 0;
  let waiting = false;
  let waitLeft = 0;
  let steps = 0;

  while (opIndex < ops.length && steps < MAX_STEPS) {
    const op = ops[opIndex];
    let input = steerInput(null);

    if (op.wait !== undefined) {
      waitLeft -= STEP;
      if (waitLeft <= 0) { opIndex += 1; waitLeft = 0; }
    } else if (op.until !== undefined) {
      if (world.time >= op.until) opIndex += 1;
    } else if (op.toPoint) {
      const dx = op.toPoint.x - world.chef.x;
      const dy = op.toPoint.y - world.chef.y;
      if (Math.hypot(dx, dy) > 26) {
        input = steerInput(op.toPoint);
      } else {
        opIndex += 1;
      }
    } else if (op.to) {
      const touch = STATIONS[op.to].touch;
      const dx = touch.x - world.chef.x;
      const dy = touch.y - world.chef.y;
      const dist = Math.hypot(dx, dy);
      if (!arrived && dist > 26) {
        input = steerInput(touch);
      } else {
        arrived = true;
        const presses = op.presses === undefined ? 1 : op.presses;
        pressTimer -= STEP;
        if (pressesDone < presses && pressTimer <= 0) {
          input.interact = true;
          pressesDone += 1;
          pressTimer = op.pressGap || 0.4;
        }
        if (pressesDone >= presses) {
          if (!waiting) { waiting = true; waitLeft = op.waitAfter || 0; }
          waitLeft -= STEP;
          if (waitLeft <= 0) {
            opIndex += 1;
            arrived = false;
            pressesDone = 0;
            pressTimer = 0;
            waiting = false;
          }
        }
      }
    }
    stepWorld(world, input, STEP);
    steps += 1;
    if (world.phase === 'over') break;
  }
  return world;
}

// The shared opening: a cheese burger nearly built — bun, grilled patty and
// cheese on the plate, the tomato still to come. (With the shot seed the
// cheese burger ticket is on the board by the time the cook gets there.)
const BUILD_CHEESEBURGER = [
  { to: 'assembly', presses: 2, pressGap: 0.4 },
  { to: 'bun', presses: 1 },
  { to: 'assembly', presses: 1 },
  { to: 'patty', presses: 1 },
  { to: 'grill', presses: 1, waitAfter: 9.5 },
  { to: 'grill', presses: 1 },
  { to: 'assembly', presses: 1 },
  { to: 'cheese', presses: 1 },
  { to: 'assembly', presses: 1 },
];

// A garden salad, built and served: the shot seed's first order is a salad,
// still on the board when the plate reaches the window.
const BUILD_SALAD = [
  { to: 'assembly', presses: 2, pressGap: 0.4 },
  { to: 'tomato', presses: 1 },
  { to: 'board', presses: 1 },
  { to: 'board', presses: 3, pressGap: 0.35 },
  { to: 'board', presses: 1 },
  { to: 'assembly', presses: 1 },
  { to: 'lettuce', presses: 1 },
  { to: 'board', presses: 1 },
  { to: 'board', presses: 3, pressGap: 0.35 },
  { to: 'board', presses: 1 },
  { to: 'assembly', presses: 1 },
  { to: 'onion', presses: 1 },
  { to: 'board', presses: 1 },
  { to: 'board', presses: 3, pressGap: 0.35 },
  { to: 'board', presses: 1 },
  { to: 'assembly', presses: 1 },
];

const SCRIPTS = {
  // Cover: cheese burger finished, chef carrying the plate to the window,
  // four tickets on the board.
  cover: [
    ...BUILD_CHEESEBURGER,
    { to: 'tomato', presses: 1 },
    { to: 'board', presses: 1 },
    { to: 'board', presses: 3, pressGap: 0.35 },
    { to: 'board', presses: 1 },
    { to: 'assembly', presses: 1 },
    { to: 'assembly', presses: 1 },
    { toPoint: { x: 1030, y: 290 } },
    { until: 48 },
  ],
  // Grill: patty mid-cook, chef chopping the tomato, plate started.
  grill: [
    { to: 'assembly', presses: 2, pressGap: 0.4 },
    { to: 'bun', presses: 1 },
    { to: 'assembly', presses: 1 },
    { to: 'patty', presses: 1 },
    { to: 'grill', presses: 1, waitAfter: 5.5 },
    { to: 'tomato', presses: 1 },
    { to: 'board', presses: 1 },
    { to: 'board', presses: 1 },
  ],
  // Rush: the same kitchen late in the shift — four tickets, one nearly out
  // of time, one heart left, a dish still one ingredient from done.
  rush: [
    ...BUILD_CHEESEBURGER,
    { to: 'tomato', presses: 1 },
    { to: 'board', presses: 1 },
    { to: 'board', presses: 3, pressGap: 0.35 },
    { to: 'board', presses: 1 },
    { until: 112 },
  ],
  // Serve: the finished salad handed over, coins popping up.
  serve: [
    ...BUILD_SALAD,
    { to: 'assembly', presses: 1 },
    { to: 'window', presses: 1, waitAfter: 0.7 },
  ],
};

/**
 * Set a world to the named scene (cover, grill, rush or serve; anything else
 * is cover) and return the screen to draw over it.
 */
export function stageShot(name) {
  const script = SCRIPTS[name] || SCRIPTS.cover;
  const world = runScript(script);
  return { world, screen: 'play' };
}
