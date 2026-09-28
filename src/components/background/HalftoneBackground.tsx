'use client';

import { useEffect, useRef, useState } from 'react';

const TAU = Math.PI * 2;

interface Props {
  imageUrl?: string;
  cell?: number;
  strength?: number;
  className?: string;
}

export function HalftoneBackground({
  imageUrl,
  cell = 30,
  strength = 0.08,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const read = () => setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dark = theme === 'dark';

    const styles = getComputedStyle(document.documentElement);
    const rgb = (name: string, fallback: string) => {
      const v = styles.getPropertyValue(name).trim().split(/\s+/).map(Number);
      return v.length >= 3 && v.every((n) => !Number.isNaN(n))
        ? [v[0], v[1], v[2]] as [number, number, number]
        : (fallback.split(',').map(Number) as [number, number, number]);
    };
    const paperRGB = dark ? rgb('--c-bg', '5,7,13') : rgb('--c-bg', '246,249,243');

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth + 120;
      h = window.innerHeight + 120;
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.style.transform = 'translate(-60px, -60px)';
    };
    resize();

    interface Light {
      bx: number;
      by: number;
      r: number;
      phase: number;
    }

    const lights: Light[] = [
      { bx: w * 0.28, by: h * 0.35, r: Math.min(w, h) * 0.38, phase: 0.0 },
      { bx: w * 0.7, by: h * 0.68, r: Math.min(w, h) * 0.32, phase: 1.6 },
    ];

    const toneAt = (x: number, y: number, t: number): number => {
      if (img && img.complete && img.naturalWidth > 0) {
        const l = imgLum(x, y);
        return Math.min(1, Math.max(0, l * 0.92));
      }

      let v = 0.15;
      for (const light of lights) {
        const lx = light.bx + Math.sin(t * 0.0002 + light.phase) * 80;
        const ly = light.by + Math.cos(t * 0.00018 + light.phase) * 70;
        const d = Math.hypot(x - lx, y - ly);
        v += Math.max(0, 1 - d / light.r) * 0.42;
      }

      return Math.min(1, Math.max(0, (v - 0.18) / 0.55));
    };

    let lumBuf: ImageData | null = null;
    const imgLum = (x: number, y: number): number => {
      if (!lumBuf) return 0;
      const ix = Math.min(lumBuf.width - 1, Math.max(0, Math.round(x)));
      const iy = Math.min(lumBuf.height - 1, Math.max(0, Math.round(y)));
      const i = (iy * lumBuf.width + ix) * 4;
      const l = 0.2126 * (lumBuf.data[i] / 255) + 0.7152 * (lumBuf.data[i + 1] / 255) + 0.0722 * (lumBuf.data[i + 2] / 255);
      return dark ? 1 - l : l;
    };

    let img: HTMLImageElement | null = null;
    if (imageUrl) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => {
        if (!img || !img.naturalWidth) return;
        const sw = 280;
        const sh = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * sw));
        const off = document.createElement('canvas');
        off.width = sw;
        off.height = sh;
        const octx = off.getContext('2d');
        if (!octx) return;
        octx.drawImage(img, 0, 0, sw, sh);
        lumBuf = octx.getImageData(0, 0, sw, sh);
      };
    }

    interface Dot { x: number; y: number; sx: number; sy: number }
    const buildGrid = (): Dot[] => {
      const a = (45 * Math.PI) / 180;
      const cos = Math.cos(-a);
      const sin = Math.sin(-a);
      const cx = w / 2;
      const cy = h / 2;
      const half = Math.hypot(w, h) / 2 + cell * 3;
      const out: Dot[] = [];
      const n = Math.ceil(half / cell);

      for (let iy = -n; iy <= n; iy++) {
        for (let ix = -n; ix <= n; ix++) {
          const rx = ix * cell;
          const ry = iy * cell;
          const x = cx + rx * cos - ry * sin;
          const y = cy + rx * sin + ry * cos;
          if (x < -cell || x > w + cell || y < -cell || y > h + cell) continue;
          out.push({ x, y, sx: rx + cx, sy: ry + cy });
        }
      }
      return out;
    };

    let dots = buildGrid();

    const pointer = { x: -9999, y: -9999, active: false };
    const onMove = (e: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = e.clientX - bounds.left;
      pointer.y = e.clientY - bounds.top;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    const maxR = cell * 0.36;
    let raf = 0;
    let paused = false;

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${paperRGB[0]},${paperRGB[1]},${paperRGB[2]})`;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = dark ? `rgba(255,255,255,${strength})` : `rgba(0,0,0,${strength})`;

      for (const d of dots) {
        let tone = toneAt(d.sx, d.sy, t);
        if (pointer.active) {
          const pd = Math.hypot(d.x - pointer.x, d.y - pointer.y);
          if (pd < 150) tone = Math.min(1, tone + (1 - pd / 150) * 0.18);
        }
        if (tone <= 0.02) continue;

        const rad = maxR * Math.sqrt(tone);
        ctx.beginPath();
        ctx.arc(d.x, d.y, rad, 0, TAU);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (!paused) draw(t);
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onVis = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    const onResize = () => {
      resize();
      dots = buildGrid();
      if (reduceMotion) draw(0);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [theme, imageUrl, cell, strength]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
