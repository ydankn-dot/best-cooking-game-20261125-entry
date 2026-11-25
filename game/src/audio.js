// Sizzle & Serve: sound. One file, one job: tiny synthesized effects over
// WebAudio — no audio files, no network, nothing to load. Silent until the
// first gesture, and silent in a screenshot run where no gesture ever comes.
let context = null;

function ctx() {
  if (!context) {
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      context = null;
    }
  }
  if (context && context.state === 'suspended') context.resume();
  return context;
}

function blip(freq, dur, type, gain, slideTo) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  amp.gain.setValueAtTime(gain || 0.08, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

/** Play one of the kitchen's named effects. Unknown names stay silent. */
export function playSound(name) {
  if (typeof window === 'undefined') return;
  switch (name) {
    case 'chop': blip(220, 0.09, 'square', 0.07, 140); break;
    case 'take': blip(520, 0.07, 'sine', 0.06, 660); break;
    case 'place': blip(340, 0.08, 'triangle', 0.07, 260); break;
    case 'sizzle': blip(900, 0.25, 'sawtooth', 0.03, 500); break;
    case 'ding': blip(880, 0.18, 'sine', 0.08); blip(1320, 0.22, 'sine', 0.06); break;
    case 'serve': blip(660, 0.1, 'sine', 0.08, 880); blip(990, 0.16, 'sine', 0.07); break;
    case 'error': blip(180, 0.2, 'square', 0.06, 120); break;
    case 'expire': blip(320, 0.3, 'triangle', 0.07, 160); break;
    case 'bin': blip(140, 0.12, 'square', 0.05, 90); break;
    default: break;
  }
}
