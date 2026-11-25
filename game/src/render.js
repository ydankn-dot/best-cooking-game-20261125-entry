// Sizzle & Serve: the look. One file, one job: draw the whole kitchen on the
// canvas — floor, stations, food, chef, order board, timer, screens. Every
// picture is drawn from code; the game loads no image at all.
import { DISHES, INGREDIENTS, PALETTE, SHIFT_SECONDS, STATIONS, VIEW } from './config.js';
import { dishForPlate, interactHint } from './kitchen.js';

const FONT = (px, bold) => `${bold ? 'bold ' : ''}${px}px "Trebuchet MS", "Segoe UI", sans-serif`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** One ingredient, drawn as a little vector picture, centred on (x, y). */
export function drawIngredient(ctx, item, state, x, y, r) {
  const ing = INGREDIENTS[item];
  ctx.save();
  ctx.translate(x, y);
  if (item === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, 2, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9142';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.85, r * 0.45, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.4); ctx.lineTo(r * 0.7, r * 0.5); ctx.moveTo(r * 0.7, -r * 0.4); ctx.lineTo(-r * 0.7, r * 0.5); ctx.stroke();
    }
  } else if (item === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.stroke();
    if (state === 'chopped') {
      ctx.strokeStyle = ing.dark;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.moveTo(0, -r * 0.6); ctx.lineTo(0, r * 0.6); ctx.stroke();
    }
  } else if (item === 'onion') {
    ctx.fillStyle = '#efe6f5';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ing.color; ctx.lineWidth = 2.5;
    for (let k = 1; k <= 3; k += 1) { ctx.beginPath(); ctx.arc(0, 0, r * k / 3.4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#7d4a94';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.9, r * 0.3, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke();
    }
  } else if (item === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.moveTo(-r, r * 0.7); ctx.lineTo(r, r * 0.7); ctx.lineTo(0, -r); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.2, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.25, r * 0.35, r * 0.11, 0, Math.PI * 2); ctx.fill();
  } else if (item === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#2b1d12' : ing.color;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5);
    ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(r * 0.6, -r * 0.2); ctx.moveTo(-r * 0.6, r * 0.2); ctx.lineTo(r * 0.6, r * 0.2); ctx.stroke();
    if (state === 'burnt') {
      ctx.fillStyle = 'rgba(120,120,120,0.7)';
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.7, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill();
    }
  } else if (item === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(0, r * 0.25, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ing.dark;
    roundRect(ctx, -r, r * 0.2, r * 2, r * 0.3, r * 0.12);
    ctx.fill();
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.35, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.55, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.2, r * 0.09, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** A plate with its stacked contents, centred on (x, y). */
function drawPlate(ctx, contents, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c2b2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
  let stackY = 2;
  for (const need of contents) {
    drawIngredient(ctx, need.item, need.state, 0, stackY - r * 0.28, r * 0.52);
    stackY -= r * 0.16;
  }
  ctx.restore();
}

function drawFloor(ctx) {
  const tile = 64;
  for (let y = 92; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      const even = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 92; y < VIEW.height; y += tile) ctx.fillRect(0, y, VIEW.width, 2);
  for (let x = 0; x < VIEW.width; x += tile) ctx.fillRect(x, 92, 2, VIEW.height - 92);
  // Wall band along the top, under the order board.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 92, VIEW.width, 10);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 100, VIEW.width, 4);
}

function drawCrate(ctx, id, station) {
  const r = station.rect;
  ctx.fillStyle = '#7a5230';
  roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 8);
  ctx.fill();
  ctx.fillStyle = '#96683c';
  roundRect(ctx, r.x + 10, r.y + 10, r.w - 20, r.h - 20, 6);
  ctx.fill();
  ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r.x + 10, r.y + r.h / 2); ctx.lineTo(r.x + r.w - 10, r.y + r.h / 2); ctx.stroke();
  drawIngredient(ctx, id, 'raw', r.x + r.w / 2, r.y + r.h / 2 - 4, 20);
  ctx.fillStyle = '#fff6e3';
  ctx.font = FONT(13, true);
  ctx.textAlign = 'center';
  ctx.fillText(INGREDIENTS[id].name, r.x + r.w / 2, r.y + r.h - 12);
}

/** Small dark pill with a label, so a station's name reads even over the chef. */
function pillLabel(ctx, text, x, y, fg, bg) {
  ctx.font = FONT(13, true);
  const w = ctx.measureText(text).width + 18;
  ctx.fillStyle = bg || 'rgba(43,33,24,0.85)';
  roundRect(ctx, x - w / 2, y - 18, w, 24, 12);
  ctx.fill();
  ctx.fillStyle = fg || '#fff6e3';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawGrill(ctx, world) {
  const r = STATIONS.grill.rect;
  ctx.fillStyle = PALETTE.steelDark;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = '#3a3f45';
  roundRect(ctx, r.x + 12, r.y + 12, r.w - 24, r.h - 34, 6);
  ctx.fill();
  ctx.strokeStyle = '#6d757d'; ctx.lineWidth = 3;
  for (let i = 1; i < 6; i += 1) {
    ctx.beginPath(); ctx.moveTo(r.x + 12 + (i * (r.w - 24)) / 6, r.y + 14); ctx.lineTo(r.x + 12 + (i * (r.w - 24)) / 6, r.y + r.h - 24); ctx.stroke();
  }
  const item = world.grill.item;
  if (item) {
    drawIngredient(ctx, 'patty', item.state, r.x + r.w / 2, r.y + (r.h - 20) / 2 + 4, 30);
    const frac = Math.min(1, world.grill.progress / 9);
    const barW = r.w - 40;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, r.x + 20, r.y + r.h - 18, barW, 10, 5);
    ctx.fill();
    ctx.fillStyle = item.state === 'burnt' ? '#3a3a3a' : item.state === 'cooked' ? '#58b368' : '#ff9a3d';
    roundRect(ctx, r.x + 20, r.y + r.h - 18, barW * frac, 10, 5);
    ctx.fill();
    if (item.state === 'cooked') {
      pillLabel(ctx, 'READY!', r.x + r.w / 2, r.y - 34, '#a5e8a0');
    }
    if (item.state === 'burnt') {
      pillLabel(ctx, 'BURNT!', r.x + r.w / 2, r.y - 34, '#ff9a8a');
    }
  }
  pillLabel(ctx, 'GRILL', r.x + r.w / 2, r.y - 10);
}

function drawBoard(ctx, world) {
  const r = STATIONS.board.rect;
  ctx.fillStyle = '#8a6b4f';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = '#e8c98f';
  roundRect(ctx, r.x + 14, r.y + 12, r.w - 28, r.h - 36, 8);
  ctx.fill();
  const item = world.board.item;
  if (item) {
    drawIngredient(ctx, item.item, item.state, r.x + r.w / 2, r.y + (r.h - 22) / 2, 26);
    if (item.state === 'raw') {
      const frac = world.board.progress;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, r.x + 20, r.y + r.h - 18, r.w - 40, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#ffd76a';
      roundRect(ctx, r.x + 20, r.y + r.h - 18, (r.w - 40) * frac, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#2b2118';
      pillLabel(ctx, `CHOP ${Math.round(frac * 3)}/3`, r.x + r.w / 2, r.y - 34, '#ffd76a');
    }
  }
  pillLabel(ctx, 'CHOPPING BOARD', r.x + r.w / 2, r.y - 10);
}

function drawAssembly(ctx, world) {
  const r = STATIONS.assembly.rect;
  ctx.fillStyle = PALETTE.steel;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = '#d7dde2';
  roundRect(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 8);
  ctx.fill();
  // A stack of clean plates waiting.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 52 + i * 7, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (world.counterPlate) {
    drawPlate(ctx, world.counterPlate.contents, r.x + r.w / 2, r.y + 190, 34);
    const dishId = dishForPlate(world.counterPlate.contents);
    ctx.font = FONT(12, true); ctx.textAlign = 'center';
    if (dishId) {
      ctx.fillStyle = '#2f7d3d';
      ctx.fillText('READY!', r.x + r.w / 2, r.y + 132);
    } else if (world.counterPlate.contents.length > 0) {
      ctx.fillStyle = '#8a6b4f';
      ctx.fillText('Building…', r.x + r.w / 2, r.y + 132);
    }
  }
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h - 48);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#2b2118'; ctx.font = FONT(14, true); ctx.textAlign = 'center';
  ctx.fillText('PLATING', 0, 5);
  ctx.restore();
}

function drawWindow(ctx) {
  const r = STATIONS.window.rect;
  ctx.fillStyle = '#7a4a2b';
  roundRect(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  // Striped awning.
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#e2483d' : '#fff6e3';
    ctx.fillRect(r.x + (i * r.w) / 10, r.y, r.w / 10, 16);
  }
  ctx.fillStyle = '#2b2118'; ctx.font = FONT(20, true); ctx.textAlign = 'center';
  ctx.fillText('★ SERVE ★', r.x + r.w / 2, r.y + 42);
}

function drawTrash(ctx) {
  const r = STATIONS.trash.rect;
  ctx.fillStyle = '#5d6b73';
  roundRect(ctx, r.x + 14, r.y + 8, r.w - 28, r.h - 16, 8);
  ctx.fill();
  ctx.fillStyle = '#78868e';
  roundRect(ctx, r.x + 8, r.y + 2, r.w - 16, 14, 6);
  ctx.fill();
  ctx.fillStyle = '#fff6e3'; ctx.font = FONT(13, true); ctx.textAlign = 'center';
  ctx.fillText('BIN', r.x + r.w / 2, r.y + r.h / 2 + 22);
}

function drawChef(ctx, world) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(world.time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 24, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: teal apron.
  ctx.fillStyle = '#2f8f83';
  roundRect(ctx, -17, -6, 34, 32, 12);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  roundRect(ctx, -17, 12, 34, 12, 6);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -20, 15, 0, Math.PI * 2); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -15, -44, 30, 16, 7);
  ctx.fill();
  ctx.beginPath(); ctx.arc(-10, -42, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -46, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -42, 8, 0, Math.PI * 2); ctx.fill();
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(c.dir * 4 - 5, -20, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.dir * 4 + 5, -20, 2.2, 0, Math.PI * 2); ctx.fill();
  // What the chef carries, held up high.
  const carrying = c.carrying;
  if (carrying) {
    if (carrying.kind === 'plate') {
      drawPlate(ctx, carrying.contents, 0, -62, 26);
    } else {
      drawIngredient(ctx, carrying.item, carrying.state, 0, -60, 18);
    }
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y) {
  const dish = DISHES[order.dish];
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.3;
  ctx.fillStyle = urgent ? '#fff0e8' : '#fff6e3';
  roundRect(ctx, x, y, 198, 76, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e2483d' : '#d9b98c';
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, 198, 76, 10);
  ctx.stroke();
  ctx.fillStyle = '#2b2118';
  ctx.font = FONT(14, true);
  ctx.textAlign = 'left';
  ctx.fillText(dish.name, x + 10, y + 21);
  ctx.fillStyle = '#c98f1b';
  ctx.font = FONT(12, true);
  ctx.textAlign = 'right';
  ctx.fillText(`${dish.coins} coins`, x + 188, y + 21);
  // The dish's needs as little pictures.
  let ix = x + 14;
  for (const need of dish.needs) {
    drawIngredient(ctx, need.item, need.state, ix + 10, y + 46, 11);
    ix += 28;
  }
  // Patience bar.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, x + 10, y + 64, 178, 7, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.3 ? '#f6c445' : '#e2483d';
  roundRect(ctx, x + 10, y + 64, 178 * frac, 7, 3);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, 92);
  ctx.fillStyle = '#ffd76a';
  ctx.font = FONT(22, true);
  ctx.textAlign = 'left';
  ctx.fillText('🍳 Sizzle & Serve', 16, 30);
  ctx.fillStyle = '#fff6e3';
  ctx.font = FONT(13, false);
  ctx.fillText('Ember Lane Kitchen', 16, 52);
  // Order board: four tickets, then the shift clock and coins on the right.
  ctx.fillStyle = '#fff6e3';
  ctx.font = FONT(12, true);
  ctx.fillText('ORDERS', 240, 16);
  if (world.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,246,227,0.55)';
    ctx.font = FONT(14, false);
    ctx.fillText('No orders yet — get ready!', 240, 52);
  }
  world.orders.forEach((order, i) => drawOrderTicket(ctx, order, 240 + i * 204, 8));
  // Shift timer, coins, hearts and combo in the right-hand block.
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const timeText = `${mins}:${String(secs).padStart(2, '0')}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = world.rush ? '#ff9a8a' : '#fff6e3';
  ctx.font = FONT(28, true);
  ctx.fillText(timeText, 1264, 32);
  const timeFrac = world.timeLeft / SHIFT_SECONDS;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 1064, 38, 200, 8, 4);
  ctx.fill();
  ctx.fillStyle = world.rush ? '#e2483d' : '#58b368';
  roundRect(ctx, 1064, 38, 200 * timeFrac, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.font = FONT(17, true);
  ctx.fillText(`🪙 ${world.coins}`, 1264, 66);
  ctx.fillStyle = '#ff8a7a';
  ctx.font = FONT(16, true);
  ctx.textAlign = 'left';
  ctx.fillText('♥'.repeat(world.hearts) + '♡'.repeat(Math.max(0, 3 - world.hearts)), 1064, 66);
  ctx.fillStyle = world.combo >= 2 ? '#a5e8a0' : 'rgba(255,246,227,0.75)';
  ctx.font = FONT(13, true);
  ctx.textAlign = 'right';
  ctx.fillText(world.combo >= 2 ? `Combo x${world.combo}` : `Served ${world.served}`, 1264, 86);
  ctx.fillStyle = world.rush ? '#ff9a8a' : 'rgba(255,246,227,0.6)';
  ctx.font = FONT(12, false);
  ctx.textAlign = 'left';
  ctx.fillText(world.rush ? 'RUSH HOUR!' : 'SHIFT', 1064, 86);
}

function drawPrompt(ctx, world) {
  const hint = interactHint(world);
  if (!hint) return;
  const c = world.chef;
  const text = `E — ${hint}`;
  ctx.font = FONT(14, true);
  const w = ctx.measureText(text).width + 20;
  const x = Math.max(8, Math.min(VIEW.width - w - 8, c.x - w / 2));
  // Under the chef's feet, so it never covers what the chef carries.
  const y = c.y + 42;
  ctx.fillStyle = 'rgba(43,33,24,0.9)';
  roundRect(ctx, x, y, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 18);
}

function drawMessage(ctx, world) {
  if (!world.message) return;
  ctx.font = FONT(18, true);
  const w = ctx.measureText(world.message.text).width + 28;
  const x = (VIEW.width - w) / 2;
  ctx.fillStyle = 'rgba(43,33,24,0.88)';
  roundRect(ctx, x, 112, w, 34, 17);
  ctx.fill();
  ctx.fillStyle = world.message.color;
  ctx.textAlign = 'center';
  ctx.fillText(world.message.text, VIEW.width / 2, 135);
}

function drawPopups(ctx, world) {
  ctx.textAlign = 'center';
  for (const p of world.popups) {
    ctx.globalAlpha = Math.min(1, p.ttl);
    ctx.font = FONT(22, true);
    const w = ctx.measureText(p.text).width + 24;
    ctx.fillStyle = 'rgba(43,33,24,0.88)';
    roundRect(ctx, p.x - w / 2, p.y - 26, w, 32, 16);
    ctx.fill();
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y - 3);
  }
  ctx.globalAlpha = 1;
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20,14,8,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const w = 640;
  const h = 120 + lines.length * 34;
  const x = (VIEW.width - w) / 2;
  const y = (VIEW.height - h) / 2;
  ctx.fillStyle = '#fff6e3';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = accent || '#e2483d';
  ctx.lineWidth = 4;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.fillStyle = '#2b2118';
  ctx.font = FONT(34, true);
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, y + 58);
  ctx.font = FONT(17, false);
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, y + 100 + i * 34));
}

function drawTitle(ctx, world) {
  drawFloor(ctx);
  drawWindow(ctx);
  for (const id of ['tomato', 'lettuce', 'onion', 'cheese', 'bun', 'patty']) drawCrate(ctx, id, STATIONS[id]);
  drawGrill(ctx, world);
  drawBoard(ctx, world);
  drawAssembly(ctx, world);
  drawTrash(ctx);
  drawChef(ctx, world);
  drawHud(ctx, world);
  drawPanel(ctx, '🍳 Sizzle & Serve', [
    'Run the Ember Lane Kitchen for one 2½-minute shift.',
    'Take ingredients, chop them, grill the patty, plate the dish, serve it hot.',
    'Move: WASD or arrows · Interact: E or Space · Click a station to walk there',
    'Match the order tickets exactly — fast serves earn tips and combos.',
    '',
    'Press Enter or click anywhere to start cooking!',
  ], '#e2483d');
}

function drawOver(ctx, world) {
  drawFloor(ctx);
  drawWindow(ctx);
  for (const id of ['tomato', 'lettuce', 'onion', 'cheese', 'bun', 'patty']) drawCrate(ctx, id, STATIONS[id]);
  drawGrill(ctx, world);
  drawBoard(ctx, world);
  drawAssembly(ctx, world);
  drawTrash(ctx);
  drawHud(ctx, world);
  const reason = world.overReason === 'hearts'
    ? 'Three customers walked out — the kitchen closes early.'
    : 'Shift over! The last ticket is in.';
  drawPanel(ctx, 'Shift Complete!', [
    reason,
    `Dishes served: ${world.served}   ·   Coins earned: ${world.coins}`,
    `Best combo: x${world.bestCombo}   ·   Chopped: ${world.stats.chopped}   ·   Grilled: ${world.stats.grilled}`,
    '',
    'Press R to cook another shift.',
  ], '#2f8f83');
}

/** Draw the current screen of the game. */
export function drawScene(ctx, world, screen) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (screen === 'title') { drawTitle(ctx, world); return; }
  if (screen === 'over') { drawOver(ctx, world); return; }
  drawFloor(ctx);
  drawWindow(ctx);
  for (const id of ['tomato', 'lettuce', 'onion', 'cheese', 'bun', 'patty']) drawCrate(ctx, id, STATIONS[id]);
  drawGrill(ctx, world);
  drawBoard(ctx, world);
  drawAssembly(ctx, world);
  drawTrash(ctx);
  drawChef(ctx, world);
  drawHud(ctx, world);
  drawPrompt(ctx, world);
  drawMessage(ctx, world);
  drawPopups(ctx, world);
  if (world.rush) {
    ctx.fillStyle = 'rgba(226,72,61,0.9)';
    ctx.font = FONT(20, true);
    ctx.textAlign = 'center';
    ctx.fillText('⚠ RUSH HOUR — orders are flying in! ⚠', VIEW.width / 2, 168);
  }
  if (screen === 'paused') {
    ctx.fillStyle = 'rgba(20,14,8,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff6e3';
    ctx.font = FONT(40, true);
    ctx.textAlign = 'center';
    ctx.fillText('Paused — press P to resume', VIEW.width / 2, VIEW.height / 2);
  }
}
