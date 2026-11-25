// Sizzle & Serve: keyboard and mouse. One file, one job: turn keys and clicks
// into the input object the kitchen steps on, and report the E key's edge.
export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
    moveTarget: null,
    clickStation: null,
    _interactQueued: false,
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

/** Wire the page's keyboard and the canvas's mouse to `input`. */
export function attachInput(canvas, input, onPause, onRestart) {
  window.addEventListener('keydown', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) {
      input[dir] = true;
      input.moveTarget = null;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      input._interactQueued = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyP') { onPause(); return; }
    if (event.code === 'KeyR') { onRestart(); }
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) input[dir] = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    input.moveTarget = { x, y };
    input.clickStation = { x, y };
  });
}

/** Call once per rendered frame: fold the queued E press into this step's edge. */
export function consumeInteract(input) {
  const pressed = input._interactQueued;
  input._interactQueued = false;
  input.interact = pressed;
  return pressed;
}
