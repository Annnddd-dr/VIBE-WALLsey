'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * LIKE BUTTON — recreation of Chris Gannon's "SVG Twitter Heart" (CodePen
 * NGLKWO). On like: the heart pops with an elastic overshoot while a ring
 * expands and a burst of coloured particles flies outward. On unlike: the
 * heart deflates with a soft squeeze.
 *
 * Driven by framer-motion (GPU-cheap: transform/opacity only). Honours
 * prefers-reduced-motion by showing a plain state swap.
 */

const INK = '#E0245E'; // Twitter-heart red
const PARTICLE_COLORS = [
  '#E0245E', // red
  '#F2C230', // brand yellow
  '#85C8F2', // brand blue
  '#79C28A', // green
  '#A86ED6', // violet
];

const HEART_PATH =
  'M 50 88.9 C 20 66 2.2 47.6 2.2 30.3 C 2.2 15.4 13.5 4.4 27.6 4.4 C 36.5 4.4 45 9.2 50 17.1 C 55 9.2 63.5 4.4 72.4 4.4 C 86.5 4.4 97.8 15.4 97.8 30.3 C 97.8 47.6 80 66 50 88.9 Z';

interface Particle {
  angle: number;
  dist: number;
  size: number;
  color: string;
  dur: number;
}

function makeParticles(): Particle[] {
  const n = 12;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 + (i % 2 ? 0.22 : -0.18);
    const dist = 34 + (i % 3) * 12;
    return {
      angle,
      dist,
      size: 4 + (i % 4) * 1.6,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      dur: 0.55 + (i % 5) * 0.07,
    };
  });
}

export function LikeButton({
  liked,
  onToggle,
  size = 20,
  className = '',
  label,
}: {
  liked: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
  label?: string;
}) {
  const particles = useMemo(makeParticles, []);
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={liked}
      aria-label={label ?? (liked ? 'Remove from wishlist' : 'Add to wishlist')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`relative inline-flex items-center justify-center leading-none ${className}`}
      style={{ width: size * 2.2, height: size * 2.2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.86 }}
    >
      {/* ---- burst ring ---- */}
      <AnimatePresence>
        {liked && !reduceMotion && (
          <motion.span
            key="ring"
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${INK}`, opacity: 0.9 }}
            initial={{ scale: 0.55, opacity: 0.9 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ---- particle burst ---- */}
      <AnimatePresence>
        {liked && !reduceMotion && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {particles.map((p, i) => (
              <motion.span
                key={`p${i}`}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
                initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.dist,
                  y: Math.sin(p.angle) * p.dist,
                  scale: [0.4, 1.25, 0.2],
                  opacity: [1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: p.dur, ease: 'easeOut' }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>

      {/* ---- the heart ---- */}
      <svg
        viewBox="0 0 100 100"
        width={size * 1.6}
        height={size * 1.6}
        aria-hidden="true"
        className="relative"
      >
        <motion.path
          d={HEART_PATH}
          fill={liked ? INK : 'none'}
          stroke={liked ? INK : 'currentColor'}
          strokeWidth={liked ? 0 : 7}
          strokeLinejoin="round"
          animate={
            reduceMotion
              ? { fill: liked ? INK : 'none' }
              : liked
                ? { scale: [1, 1.35, 0.92, 1.08, 1] }
                : { scale: [1, 0.86, 1] }
          }
          transition={{ duration: liked ? 0.7 : 0.35, ease: 'easeOut' }}
          style={{ transformOrigin: '50% 55%' }}
        />
      </svg>
    </motion.button>
  );
}
