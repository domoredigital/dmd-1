import { useRef, useEffect } from 'react';

// Three palettes the orb eases between. Each blob = [r,g,b].
const PALETTES = {
  idle: {
    blobs: [
      [122, 138, 92],   // muted green
      [86, 102, 74],    // deep moss
      [168, 150, 96],   // grey-gold
      [70, 82, 70],     // shadow green
    ],
    speed: 0.10,
    amp: 0.05,
    warp: 0.035,
  },
  listening: {
    blobs: [
      [64, 156, 168],   // teal
      [54, 110, 178],   // blue
      [92, 188, 196],   // bright teal
      [44, 84, 132],    // deep blue
    ],
    speed: 0.26,
    amp: 0.10,
    warp: 0.07,
  },
  speaking: {
    blobs: [
      [224, 168, 72],   // gold
      [212, 124, 48],   // amber
      [240, 198, 104],  // light gold
      [188, 96, 44],    // deep amber
    ],
    speed: 0.5,
    amp: 0.16,
    warp: 0.12,
  },
  // Distinct decorative palettes for the two guide choices.
  femaleGuide: {
    blobs: [
      [228, 142, 138],  // warm rose
      [224, 176, 96],   // soft gold
      [236, 168, 150],  // coral blush
      [186, 110, 110],  // deep rose
    ],
    speed: 0.16,
    amp: 0.07,
    warp: 0.05,
  },
  maleGuide: {
    blobs: [
      [88, 150, 150],   // teal
      [80, 120, 150],   // steel blue
      [110, 168, 150],  // sea green
      [56, 92, 110],    // deep slate
    ],
    speed: 0.16,
    amp: 0.07,
    warp: 0.05,
  },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function Orb({ state = 'idle', onClick, size = 240, hint, palette, decorative = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  // A fixed `palette` (e.g. for the guide avatars) overrides the state-driven one.
  const targetKey = palette || state;
  const stateRef = useRef(targetKey);
  const initial = PALETTES[targetKey] || PALETTES.idle;

  // Animated values that ease toward the target palette.
  const animRef = useRef({
    blobs: initial.blobs.map((c) => [...c]),
    speed: initial.speed,
    amp: initial.amp,
    warp: initial.warp,
    t: 0,        // animation clock (scaled by speed)
    last: 0,     // last timestamp
  });

  useEffect(() => {
    stateRef.current = palette || state;
  }, [state, palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = 2; // internal resolution = size * 2 for sharpness
    const W = size * DPR;
    const H = size * DPR;
    canvas.width = W;
    canvas.height = H;

    const cx = W / 2;
    const cy = H / 2;
    const R = W / 2;
    const anim = animRef.current;

    const draw = (ts) => {
      if (!anim.last) anim.last = ts;
      const dtMs = ts - anim.last;
      anim.last = ts;
      const dt = Math.min(dtMs, 64) / 1000; // clamp big gaps (tab switches)

      const target = PALETTES[stateRef.current] || PALETTES.idle;
      // Ease the dynamic params + colors toward target (smooth, no snap).
      const ease = 1 - Math.pow(0.001, dt); // framerate-independent ~lerp
      anim.speed = lerp(anim.speed, target.speed, ease);
      anim.amp = lerp(anim.amp, target.amp, ease);
      anim.warp = lerp(anim.warp, target.warp, ease);
      for (let i = 0; i < anim.blobs.length; i++) {
        const tc = target.blobs[i];
        const c = anim.blobs[i];
        c[0] = lerp(c[0], tc[0], ease);
        c[1] = lerp(c[1], tc[1], ease);
        c[2] = lerp(c[2], tc[2], ease);
      }

      // Advance clock scaled by current speed.
      anim.t += dt * anim.speed;
      const t = anim.t;

      ctx.clearRect(0, 0, W, H);
      ctx.save();

      // --- Clip to a gently warping circle ---
      ctx.beginPath();
      const STEPS = 96;
      for (let i = 0; i <= STEPS; i++) {
        const a = (i / STEPS) * Math.PI * 2;
        const wob =
          Math.sin(a * 3 + t * 1.7) * anim.warp +
          Math.sin(a * 5 - t * 1.1) * anim.warp * 0.5;
        const rr = R * (0.93 + wob);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.clip();

      // Base fill so transparent gaps read as deep tone, not nothing.
      ctx.fillStyle = 'rgba(10,12,10,1)';
      ctx.fillRect(0, 0, W, H);

      // --- Moving radial-gradient blobs, additively composited ---
      ctx.globalCompositeOperation = 'lighter';
      const blobR = R * 1.15;
      const driftR = R * (0.34 + anim.amp);
      for (let i = 0; i < anim.blobs.length; i++) {
        const [r, g, b] = anim.blobs[i];
        const phase = (i / anim.blobs.length) * Math.PI * 2;
        const bx =
          cx +
          Math.cos(t * (0.7 + i * 0.18) + phase) * driftR +
          Math.sin(t * 0.5 + phase) * driftR * 0.4;
        const by =
          cy +
          Math.sin(t * (0.6 + i * 0.22) + phase * 1.3) * driftR +
          Math.cos(t * 0.43 + phase) * driftR * 0.4;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blobR);
        grad.addColorStop(0, `rgba(${r|0},${g|0},${b|0},0.95)`);
        grad.addColorStop(0.5, `rgba(${r|0},${g|0},${b|0},0.35)`);
        grad.addColorStop(1, `rgba(${r|0},${g|0},${b|0},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // --- Soft inner shadow for depth (vignette toward the edge) ---
      ctx.globalCompositeOperation = 'source-over';
      const inner = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
      inner.addColorStop(0, 'rgba(0,0,0,0)');
      inner.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = inner;
      ctx.fillRect(0, 0, W, H);

      // --- Subtle top-left sheen highlight ---
      const sx = cx - R * 0.34;
      const sy = cy - R * 0.36;
      const sheen = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.7);
      sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
      sheen.addColorStop(0.4, 'rgba(255,255,255,0.06)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, W, H);

      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      anim.last = 0;
    };
  }, [size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        onClick={onClick}
        aria-label={
          state === 'listening' ? 'Stop listening' :
          state === 'speaking' ? 'Speaking' :
          'Tap to speak'
        }
        style={{
          width: size,
          height: size,
          padding: 0,
          border: 'none',
          background: 'transparent',
          borderRadius: '50%',
          cursor: onClick ? 'pointer' : 'default',
          display: 'block',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'block',
            background: 'transparent',
          }}
        />
      </button>
      {hint != null && (
        <p
          style={{
            fontSize: 13,
            color: state !== 'idle' ? 'var(--gold)' : 'var(--muted)',
            textAlign: 'center',
            minHeight: 18,
            transition: 'color 0.2s',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
