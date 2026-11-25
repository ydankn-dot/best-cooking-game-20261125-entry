// Sizzle & Serve: the kitchen itself. One file, one job: the world state and
// the rules — moving the chef, picking up and chopping and grilling, plating,
// serving orders, the shift clock. It never touches the screen or the network.
import {
  CHEF_RADIUS, CHEF_SPEED, CHOP_PRESSES, DISHES, DISH_IDS, GRILL_BURN_SECONDS,
  GRILL_COOK_SECONDS, INGREDIENTS, ORDER, SHIFT_SECONDS, STATIONS, STATION_IDS,
} from './config.js';
import { makeRandom } from './random.js';

let orderSeq = 0;

/** A fresh kitchen: chef in the middle of the floor, empty stations, no orders. */
export function createWorld(seed) {
  return {
    seed,
    rng: makeRandom(seed),
    time: 0,
    timeLeft: SHIFT_SECONDS,
    phase: 'title',
    chef: { x: 640, y: 430, dir: 1, moving: false, carrying: null },
    board: { item: null, progress: 0 },
    grill: { item: null, progress: 0 },
    counterPlate: null,
    orders: [],
    nextOrderIn: ORDER.firstAt,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    hearts: 3,
    rush: false,
    popups: [],
    message: null,
    stats: { chopped: 0, grilled: 0, wasted: 0 },
    overReason: null,
  };
}

/** Start the shift: the title screen hands over to the kitchen. */
export function startShift(world) {
  world.phase = 'play';
  world.time = 0;
  world.timeLeft = SHIFT_SECONDS;
}

function sameNeeds(a, b) {
  if (a.length !== b.length) return false;
  const key = (n) => `${n.item}:${n.state}`;
  const sortedA = a.map(key).sort().join('|');
  const sortedB = b.map(key).sort().join('|');
  return sortedA === sortedB;
}

/** The dish a plate matches, or null when it matches no order's dish. */
export function dishForPlate(contents) {
  for (const id of DISH_IDS) {
    if (sameNeeds(contents, DISHES[id].needs)) return id;
  }
  return null;
}

function say(world, text, color) {
  world.message = { text, color: color || '#fff6e3', until: world.time + 2.2 };
}

function popup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color: color || '#ffd76a', ttl: 1.4 });
}

function spawnOrder(world) {
  const dish = world.rng.pick(DISH_IDS);
  const patience = world.rush ? ORDER.rushPatience : ORDER.patience;
  world.orders.push({
    id: `o${orderSeq += 1}`,
    dish,
    patience,
    maxPatience: patience,
  });
  world.nextOrderIn = world.rush ? ORDER.rushSpawnGap : ORDER.spawnGap;
}

/** The station the chef can reach right now, or null. */
export function nearestStation(world) {
  const c = world.chef;
  let best = null;
  let bestDist = 82;
  for (const id of STATION_IDS) {
    const s = STATIONS[id];
    const dx = c.x - s.touch.x;
    const dy = c.y - s.touch.y;
    const d = Math.hypot(dx, dy);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

/** What the E key would do at the station in reach, for the on-screen prompt. */
export function interactHint(world) {
  const id = nearestStation(world);
  if (!id) return null;
  const carrying = world.chef.carrying;
  if (id === 'window') return carrying && carrying.kind === 'plate' ? 'Serve dish' : 'Serving window';
  if (id === 'trash') return carrying ? 'Bin it' : 'Bin';
  if (id === 'assembly') {
    if (world.counterPlate) return carrying && carrying.kind === 'item' ? 'Add to plate' : 'Take plate';
    return carrying && carrying.kind === 'plate' ? 'Set plate down' : 'Take a plate';
  }
  if (id === 'board') {
    if (world.board.item) return world.board.item.state === 'chopped' ? 'Take chopped' : 'Chop!';
    return carrying && carrying.kind === 'item' && INGREDIENTS[carrying.item].choppable ? 'Place to chop' : 'Chopping board';
  }
  if (id === 'grill') {
    if (world.grill.item) return world.grill.item.state === 'cooked' ? 'Take patty' : 'Still cooking…';
    return carrying && carrying.kind === 'item' && carrying.item === 'patty' ? 'Grill patty' : 'Grill';
  }
  return STATIONS[id].hint;
}

function doInteract(world, events) {
  const id = nearestStation(world);
  if (!id) return;
  const chef = world.chef;
  const carrying = chef.carrying;

  if (id === 'window') {
    if (!carrying || carrying.kind !== 'plate') { say(world, 'Bring a finished plate here'); return; }
    const dishId = dishForPlate(carrying.contents);
    if (!dishId) { say(world, 'No order wants this dish!', '#ff9a8a'); events.push('error'); world.combo = 0; return; }
    const orderIndex = world.orders.findIndex((o) => o.dish === dishId);
    if (orderIndex === -1) { say(world, 'No order wants this dish!', '#ff9a8a'); events.push('error'); world.combo = 0; return; }
    const order = world.orders[orderIndex];
    const dish = DISHES[dishId];
    const tip = Math.ceil((order.patience / order.maxPatience) * 10);
    const earned = dish.coins + tip + Math.min(world.combo, 5);
    world.coins += earned;
    world.served += 1;
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.orders.splice(orderIndex, 1);
    popup(world, chef.x, chef.y - 56, `+${earned} coins`, '#ffd76a');
    if (world.combo >= 2) popup(world, chef.x, chef.y - 84, `Combo x${world.combo}!`, '#a5e8a0');
    say(world, `${dish.name} served! +${earned}`, '#a5e8a0');
    events.push('serve');
    chef.carrying = null;
    return;
  }

  if (id === 'trash') {
    if (carrying) {
      world.stats.wasted += 1;
      chef.carrying = null;
      events.push('bin');
      say(world, 'Binned');
    }
    return;
  }

  if (id === 'assembly') {
    if (world.counterPlate) {
      if (carrying && carrying.kind === 'item') {
        world.counterPlate.contents.push({ item: carrying.item, state: carrying.state });
        chef.carrying = null;
        events.push('place');
      } else if (!carrying) {
        chef.carrying = { kind: 'plate', contents: world.counterPlate.contents };
        world.counterPlate = null;
        events.push('take');
      }
      return;
    }
    if (carrying && carrying.kind === 'plate') {
      world.counterPlate = { contents: carrying.contents };
      chef.carrying = null;
      events.push('place');
    } else if (!carrying) {
      chef.carrying = { kind: 'plate', contents: [] };
      events.push('take');
    }
    return;
  }

  if (id === 'board') {
    if (world.board.item) {
      const item = world.board.item;
      if (item.state === 'raw') {
        world.board.progress += 1 / CHOP_PRESSES;
        events.push('chop');
        if (world.board.progress >= 1) {
          world.board.item = { item: item.item, state: 'chopped', progress: 1 };
          world.board.progress = 1;
          world.stats.chopped += 1;
          say(world, `${INGREDIENTS[item.item].name} chopped!`);
        }
      } else if (carrying && carrying.kind === 'plate') {
        carrying.contents.push({ item: item.item, state: 'chopped' });
        world.board.item = null;
        world.board.progress = 0;
        events.push('place');
      } else if (!carrying) {
        chef.carrying = { kind: 'item', item: item.item, state: 'chopped' };
        world.board.item = null;
        world.board.progress = 0;
        events.push('take');
      }
      return;
    }
    if (carrying && carrying.kind === 'item' && INGREDIENTS[carrying.item].choppable && carrying.state === 'raw') {
      world.board.item = { item: carrying.item, state: 'raw', progress: 0 };
      world.board.progress = 0;
      chef.carrying = null;
      events.push('place');
    }
    return;
  }

  if (id === 'grill') {
    if (world.grill.item) {
      const item = world.grill.item;
      if (item.state === 'cooked') {
        if (carrying && carrying.kind === 'plate') {
          carrying.contents.push({ item: 'patty', state: 'cooked' });
          world.grill.item = null;
          world.grill.progress = 0;
          events.push('place');
        } else if (!carrying) {
          chef.carrying = { kind: 'item', item: 'patty', state: 'cooked' };
          world.grill.item = null;
          world.grill.progress = 0;
          events.push('take');
        }
      } else if (item.state === 'burnt' && !carrying) {
        chef.carrying = { kind: 'item', item: 'patty', state: 'burnt' };
        world.grill.item = null;
        world.grill.progress = 0;
        say(world, 'Burnt! Bin it.', '#ff9a8a');
        events.push('take');
      }
      return;
    }
    if (carrying && carrying.kind === 'item' && carrying.item === 'patty' && carrying.state === 'raw') {
      world.grill.item = { item: 'patty', state: 'raw', progress: 0 };
      world.grill.progress = 0;
      chef.carrying = null;
      events.push('sizzle');
    }
    return;
  }

  // Ingredient crates (tomato, lettuce, onion, cheese, bun, patty).
  if (!carrying) {
    chef.carrying = { kind: 'item', item: id, state: 'raw' };
    events.push('take');
  }
}

function moveChef(world, input, dt) {
  const chef = world.chef;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (input.moveTarget) {
    const tx = input.moveTarget.x - chef.x;
    const ty = input.moveTarget.y - chef.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 10) {
      input.moveTarget = null;
    } else {
      dx = tx / dist;
      dy = ty / dist;
    }
  }
  const len = Math.hypot(dx, dy);
  chef.moving = len > 0;
  if (!chef.moving) return;
  dx /= len;
  dy /= len;
  if (dx !== 0) chef.dir = dx > 0 ? 1 : -1;
  const step = CHEF_SPEED * dt;
  // Axis-separated movement so the chef slides along counters instead of
  // sticking on their corners.
  const nx = chef.x + dx * step;
  if (!hitsStation(nx, chef.y)) chef.x = nx;
  const ny = chef.y + dy * step;
  if (!hitsStation(chef.x, ny)) chef.y = ny;
  chef.x = Math.max(24, Math.min(1256, chef.x));
  chef.y = Math.max(116, Math.min(776, chef.y));
}

function hitsStation(x, y) {
  for (const id of STATION_IDS) {
    const r = STATIONS[id].rect;
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if (Math.hypot(x - cx, y - cy) < CHEF_RADIUS - 2) return true;
  }
  return false;
}

/**
 * Advance the kitchen one fixed step. `input` carries the keys held this step
 * and `interact` true on the step the E key (or a click) fires. Returns the
 * sound events this step raised: chop, take, place, sizzle, serve, error, bin.
 */
export function stepWorld(world, input, dt) {
  const events = [];
  if (world.phase !== 'play') return events;
  world.time += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.time);
  world.rush = world.timeLeft <= 30 && world.timeLeft > 0;

  moveChef(world, input, dt);
  if (input.interact) doInteract(world, events);

  // The grill cooks on its own; a patty left too long burns.
  if (world.grill.item) {
    world.grill.progress += dt;
    if (world.grill.progress >= GRILL_COOK_SECONDS && world.grill.item.state === 'raw') {
      world.grill.item = { item: 'patty', state: 'cooked', progress: world.grill.progress };
      world.stats.grilled += 1;
      events.push('ding');
    }
    if (world.grill.progress >= GRILL_BURN_SECONDS && world.grill.item.state === 'cooked') {
      world.grill.item = { item: 'patty', state: 'burnt', progress: world.grill.progress };
      say(world, 'Patty burnt!', '#ff9a8a');
      events.push('error');
    }
  }

  // Orders arrive, wait, and walk out when their patience runs out.
  world.nextOrderIn -= dt;
  if (world.nextOrderIn <= 0 && world.orders.length < ORDER.maxActive) spawnOrder(world);
  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.hearts -= 1;
      world.combo = 0;
      say(world, `${DISHES[order.dish].name} walked out!`, '#ff9a8a');
      events.push('expire');
    }
  }

  for (let i = world.popups.length - 1; i >= 0; i -= 1) {
    const p = world.popups[i];
    p.ttl -= dt;
    p.y -= 28 * dt;
    if (p.ttl <= 0) world.popups.splice(i, 1);
  }
  if (world.message && world.time > world.message.until) world.message = null;

  if (world.hearts <= 0) {
    world.phase = 'over';
    world.overReason = 'hearts';
  } else if (world.timeLeft <= 0) {
    world.phase = 'over';
    world.overReason = 'time';
  }
  return events;
}
