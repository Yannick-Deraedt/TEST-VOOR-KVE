// src/Confetti.tsx
import React, { useEffect, useRef, useState } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;         // dikte/lengte van “snipper”
  color: string;
  angle: number;        // rotatie in radialen
  spin: number;         // rotatiesnelheid
  life: number;         // frame-teller
  phase: number;        // voor unieke zigzag-fase
  settled: boolean;     // ligt op de grond?
};

const COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
  "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
  "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722"
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function pick<T>(arr: T[]) {
  return arr[(Math.random() * arr.length) | 0];
}

interface Props {
  active: boolean;
  /** duur in milliseconden (tijdens deze tijd blijven ze vallen) */
  duration: number;
}

const Confetti: React.FC<Props> = ({ active, duration }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!active) return;

    setFade(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Afmetingen + responsive resize
    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    // Fysica-parameters
    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;
    const gravity = 0.18;        // zwaartekracht
    const drag = 0.0025;         // luchtweerstand
    const windAmp = 0.9;         // zigzag amplitude
    const windFreq = 0.07;       // zigzag frequentie
    const groundBounce = 0.22;   // bouncesterkte
    const groundFriction = 0.90; // wrijving op de bodem
    const settleSpeed = 0.25;    // drempel om “settled” te worden

    // Hoeveel confetti? (responsief op scherm-oppervlak)
    const baseCount = Math.round((W() * H()) / 1200); // meer = drukker
    const particles: Particle[] = new Array(baseCount).fill(0).map(() => ({
      x: rand(0, W()),
      y: rand(-H(), 0),
      vx: rand(-0.6, 0.6),
      vy: rand(0.2, 1.4),
      size: rand(6, 14),
      color: pick(COLORS),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.15, 0.15),
      life: 0,
      phase: rand(0, Math.PI * 2),
      settled: false,
    }));

    // Timer voor fade en stop
    const fadeTimer: number = window.setTimeout(() => setFade(true), Math.max(0, duration - 600));
    const stopTimer: number = window.setTimeout(() => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      setFade(false);
      // laatste clear zodat er zeker niets blijft staan
      ctx.clearRect(0, 0, W(), H());
    }, duration + 650); // laat fade (600ms) uitspelen

    let t = 0;

    const step = () => {
      ctx.clearRect(0, 0, W(), H());
      t += 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // WIND (zigzag) – verandert vx lichtjes over tijd
        const wind = Math.sin(p.phase + t * windFreq) * windAmp;

        if (!p.settled) {
          // snelheid updaten met zwaartekracht + wind + drag
          p.vx += wind * 0.03;
          p.vy += gravity * (1 - drag * p.vy); // drag iets afhankelijk van snelheid

          // positie
          p.x += p.vx;
          p.y += p.vy;

          // rotatie
          p.angle += p.spin;

          // links/rechts scherm verlaten? wrap-around
          if (p.x < -20) p.x = W() + 20;
          if (p.x > W() + 20) p.x = -20;

          // bodem – lichte bounce & dan “settle”
          if (p.y >= H() - 2) {
            p.y = H() - 2;
            p.vy = -Math.abs(p.vy) * groundBounce; // bounce omhoog
            p.vx *= groundFriction;

            if (Math.abs(p.vy) < settleSpeed) {
              p.vy = 0;
              p.vx *= 0.85;
              p.settled = true; // ligt stil
            }
          }
        } else {
          // kleine wrijving zodat hij echt stil komt
          p.vx *= 0.92;
          p.x += p.vx;
          if (Math.abs(p.vx) < 0.02) p.vx = 0;
        }

        // TEKENEN – als rechthoekige snipper met rotatie
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        // teken een smalle rechthoek (liggend strookje confetti)
        const w = p.size * 1.4;
        const h = p.size * 0.35;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();

        p.life++;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    step();

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(stopTimer);
      setFade(false);
      ctx.clearRect(0, 0, W(), H());
    };
  }, [active, duration]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      // width/height door JS gezet; hier alleen stijl
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        opacity: fade ? 0 : 1,
        transition: "opacity 0.6s linear",
      }}
    />
  );
};

export default Confetti;
