// Sizzle & Serve: the numbers that tune the kitchen. One file, one job: every
// constant the world, the renderer and the screenshot scenes share.
export const VIEW = { width: 1280, height: 800 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const RUSH_SECONDS = 30;
export const CHEF_SPEED = 275;
export const CHEF_RADIUS = 22;
export const MAX_ORDERS = 4;
export const START_HEARTS = 3;

// An ingredient the chef can carry. state: raw (from a crate), chopped (off the
// board), cooked (off the grill). choppable / cookable say which station it needs.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', choppable: true, cookable: false, color: '#e2483d', dark: '#a92e26', light: '#ff8a7a' },
  lettuce: { name: 'Lettuce', choppable: true, cookable: false, color: '#58b368', dark: '#2f7d3d', light: '#a5e8a0' },
  onion: { name: 'Onion', choppable: true, cookable: false, color: '#b678c7', dark: '#7d4a94', light: '#e3c2ee' },
  cheese: { name: 'Cheese', choppable: false, cookable: false, color: '#f6c445', dark: '#c98f1b', light: '#ffe08a' },
  patty: { name: 'Patty', choppable: false, cookable: true, color: '#8a5a33', dark: '#5f3a1e', light: '#b07a4a' },
  bun: { name: 'Bun', choppable: false, cookable: false, color: '#e8a94e', dark: '#b57a28', light: '#ffd28a' },
};

// A dish is a plate whose contents match these needs exactly, in any order.
// needs entries are { item, state } where state is raw, chopped or cooked.
export const DISHES = {
  salad: {
    name: 'Garden Salad',
    coins: 18,
    needs: [
      { item: 'tomato', state: 'chopped' },
      { item: 'lettuce', state: 'chopped' },
      { item: 'onion', state: 'chopped' },
    ],
  },
  burger: {
    name: 'Classic Burger',
    coins: 24,
    needs: [
      { item: 'bun', state: 'raw' },
      { item: 'patty', state: 'cooked' },
      { item: 'lettuce', state: 'chopped' },
    ],
  },
  cheeseBurger: {
    name: 'Cheese Burger',
    coins: 28,
    needs: [
      { item: 'bun', state: 'raw' },
      { item: 'patty', state: 'cooked' },
      { item: 'cheese', state: 'raw' },
      { item: 'tomato', state: 'chopped' },
    ],
  },
  stack: {
    name: 'Ember Stack',
    coins: 34,
    needs: [
      { item: 'bun', state: 'raw' },
      { item: 'lettuce', state: 'chopped' },
      { item: 'tomato', state: 'chopped' },
      { item: 'onion', state: 'chopped' },
      { item: 'cheese', state: 'raw' },
    ],
  },
};
export const DISH_IDS = ['salad', 'burger', 'cheeseBurger', 'stack'];

// Order pacing: a new ticket every spawnGap seconds (faster in the rush), each
// with this much patience before the customer walks out.
export const ORDER = {
  firstAt: 2,
  spawnGap: 15,
  rushSpawnGap: 8,
  patience: 85,
  rushPatience: 55,
  maxActive: MAX_ORDERS,
};

// Chopping takes this many E presses; the grill cooks in cookSeconds and burns
// cookSeconds past done (a burnt patty must be binned).
export const CHOP_PRESSES = 3;
export const GRILL_COOK_SECONDS = 9;
export const GRILL_BURN_SECONDS = 14;

// Stations: rect is the solid counter, touch is where the chef stands to use it.
export const STATIONS = {
  window: { label: 'Serving Window', rect: { x: 880, y: 92, w: 300, h: 58 }, touch: { x: 1030, y: 178 }, key: 'E', hint: 'Serve dish' },
  tomato: { label: 'Tomato Crate', rect: { x: 0, y: 170, w: 100, h: 84 }, touch: { x: 128, y: 212 }, key: 'E', hint: 'Take tomato' },
  lettuce: { label: 'Lettuce Crate', rect: { x: 0, y: 262, w: 100, h: 84 }, touch: { x: 128, y: 304 }, key: 'E', hint: 'Take lettuce' },
  onion: { label: 'Onion Crate', rect: { x: 0, y: 354, w: 100, h: 84 }, touch: { x: 128, y: 396 }, key: 'E', hint: 'Take onion' },
  cheese: { label: 'Cheese Crate', rect: { x: 0, y: 446, w: 100, h: 84 }, touch: { x: 128, y: 488 }, key: 'E', hint: 'Take cheese' },
  bun: { label: 'Bun Basket', rect: { x: 0, y: 538, w: 100, h: 84 }, touch: { x: 128, y: 580 }, key: 'E', hint: 'Take bun' },
  patty: { label: 'Patty Crate', rect: { x: 0, y: 630, w: 100, h: 84 }, touch: { x: 128, y: 672 }, key: 'E', hint: 'Take patty' },
  grill: { label: 'Grill', rect: { x: 180, y: 700, w: 250, h: 92 }, touch: { x: 305, y: 678 }, key: 'E', hint: 'Grill patty' },
  board: { label: 'Chopping Board', rect: { x: 500, y: 700, w: 240, h: 92 }, touch: { x: 620, y: 678 }, key: 'E', hint: 'Chop / take' },
  assembly: { label: 'Plating Counter', rect: { x: 1180, y: 220, w: 100, h: 340 }, touch: { x: 1152, y: 390 }, key: 'E', hint: 'Plate up' },
  trash: { label: 'Bin', rect: { x: 1060, y: 700, w: 120, h: 92 }, touch: { x: 1120, y: 678 }, key: 'E', hint: 'Bin it' },
};
export const STATION_IDS = Object.keys(STATIONS);

// Colours for the kitchen itself.
export const PALETTE = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#f3e2c7',
  wallTrim: '#d9b98c',
  counter: '#8a6b4f',
  counterTop: '#a5825f',
  steel: '#b9c0c7',
  steelDark: '#8d979f',
  hud: '#2b2118',
  cream: '#fff6e3',
  ink: '#2b2118',
};
