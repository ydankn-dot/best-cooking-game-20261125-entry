// Sizzle & Serve: the front door. One file, one job: run the kitchen — the
// fixed-step loop, the title / play / paused / over screens, the mouse, and
// the ?shot= scenes the screenshots are taken from. No clock, no network:
// the shift's orders come from a fixed seed, so the same play is the same game.
import { STATIONS, STATION_IDS, STEP, VIEW } from './config.js';
import { attachInput, consumeInteract, createInput } from './input.js';
import { createWorld, startShift, stepWorld } from './kitchen.js';
import { drawScene } from './render.js';
import { playSound } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const BASE_SEED = Number.isInteger(seedParam) ? seedParam : 20261125;

let world;
let screen = 'title';
let restarts = 0;
let paused = false;
let pendingAutoInteract = false;
const input = createInput();

function newShift() {
  world = createWorld(BASE_SEED + restarts);
  restarts += 1;
  screen = 'title';
  paused = false;
  pendingAutoInteract = false;
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function startGame() {
  startShift(world);
  screen = 'play';
  announce('Shift started. Serve the orders before their patience runs out.');
}

attachInput(canvas, input, () => {
  if (screen === 'play') { paused = !paused; }
}, () => {
  if (screen === 'over') newShift();
});

// Clicking a station walks the chef there and uses it on arrival; clicking
// anywhere else just walks there. Clicking the title screen starts the shift.
function handleClickStation() {
  const click = input.clickStation;
  input.clickStation = null;
  if (!click) return;
  if (screen === 'title') { startGame(); return; }
  if (screen !== 'play') return;
  let best = null;
  let bestDist = 70;
  for (const id of STATION_IDS) {
    const r = STATIONS[id].rect;
    const cx = Math.max(r.x, Math.min(click.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(click.y, r.y + r.h));
    const d = Math.hypot(click.x - cx, click.y - cy);
    if (d < bestDist) { bestDist = d; best = id; }
  }
  if (best) {
    input.moveTarget = { ...STATIONS[best].touch };
    pendingAutoInteract = true;
  }
}

let last = 0;
let accumulator = 0;

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (screen === 'title' || screen === 'over') {
    drawScene(ctx, world, screen);
    return;
  }
  if (paused) {
    drawScene(ctx, world, 'paused');
    return;
  }
  const dt = Math.min(0.1, (timestamp - last) / 1000 || 0);
  last = timestamp;
  accumulator += dt;
  handleClickStation();
  while (accumulator >= STEP) {
    consumeInteract(input);
    if (pendingAutoInteract && !input.moveTarget) {
      input.interact = true;
      pendingAutoInteract = false;
    }
    const events = stepWorld(world, input, STEP);
    for (const event of events) playSound(event);
    input.interact = false;
    accumulator -= STEP;
    if (world.phase === 'over') {
      screen = 'over';
      announce(`Shift over. ${world.served} dishes served, ${world.coins} coins earned.`);
      break;
    }
  }
  drawScene(ctx, world, 'play');
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' && screen === 'title') startGame();
  if (event.code === 'Enter' && screen === 'over') newShift();
});

if (shotName) {
  // A screenshot scene: play the scripted cook forward, draw one frame, stop.
  const staged = stageShot(shotName);
  world = staged.world;
  screen = staged.screen;
  drawScene(ctx, world, screen);
  window.__shotReady = true;
} else {
  newShift();
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });
}

// A handle for play-testing: the live world and screen, read-only from here.
window.__sizzle = { getWorld: () => world, getScreen: () => screen };
