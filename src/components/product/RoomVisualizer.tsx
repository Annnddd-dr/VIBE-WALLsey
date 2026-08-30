'use client';

import { useState, memo } from 'react';
import { X, Eye, Sparkles, Check } from 'lucide-react';
import Image from 'next/image';

interface RoomVisualizerProps {
  imageUrl: string;
  title: string;
  frame?: 'NONE' | 'BLACK' | 'WHITE' | 'WOOD';
  triggerButton?: React.ReactNode;
}

// Memoized constants to prevent recreation on every render
const ROOMS = [
  { id: 'living', name: 'Living Room', icon: '🛋️', vibe: 'Modern & Spacious' },
  { id: 'bedroom', name: 'Master Bedroom', icon: '🛏️', vibe: 'Calm & Warm' },
  { id: 'studio', name: 'Creative Studio', icon: '💻', vibe: 'Focused & Minimal' },
];

const WALL_COLORS = [
  { name: 'Warm Paper', hex: '#F5F4EE' },
  { name: 'Sandstone', hex: '#EAE4D9' },
  { name: 'Sage Green', hex: '#7A8B7B' },
  { name: 'Nordic Slate', hex: '#31363F' },
  { name: 'Terracotta', hex: '#A85A48' },
];

const FRAMES = [
  { id: 'NONE', label: 'No Frame', style: 'border-0 shadow-lg' },
  { id: 'BLACK', label: 'Matte Black', style: 'border-[8px] border-[#181818] shadow-2xl ring-1 ring-black/40' },
  { id: 'WHITE', label: 'Gallery White', style: 'border-[8px] border-[#FCFCFC] shadow-2xl ring-1 ring-black/10' },
  { id: 'WOOD', label: 'Natural Oak', style: 'border-[8px] border-[#A87948] shadow-2xl ring-1 ring-black/20' },
];

function RoomVisualizerContent({
  imageUrl,
  title,
  frame = 'NONE',
  triggerButton,
}: RoomVisualizerProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [wallColor, setWallColor] = useState(WALL_COLORS[0].hex);
  const [currentFrame, setCurrentFrame] = useState(frame);

  const activeFrame = FRAMES.find((f) => f.id === currentFrame) || FRAMES[0];

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setOpen(true)}>{triggerButton}</span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost text-xs gap-2 py-2 px-3 inline-flex items-center"
        >
          <Eye size={14} className="text-accent" />
          View on Wall
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-md animate-fade-in">
          <div className="bg-paper border border-line rounded-sm max-w-4xl w-full h-[90vh] max-h-[720px] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-white/50 backdrop-blur-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <h3 className="font-display text-base text-ink">Room Wall Visualizer</h3>
                <span className="text-xs text-ink/40 hidden sm:inline">— {title}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-ink/40 hover:text-ink transition-colors rounded-sm hover:bg-line/40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Stage */}
            <div
              className="flex-1 relative flex items-center justify-center overflow-hidden transition-colors duration-500"
              style={{ backgroundColor: wallColor }}
            >
              {/* Subtle room lighting overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none" />

              {/* Room Decor Context (Illustrative Floor / Furniture silhouette) */}
              <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 border-t border-black/10 bg-gradient-to-t from-black/15 to-transparent flex items-end justify-center pointer-events-none">
                {selectedRoom === 'living' && (
                  <div className="w-72 sm:w-96 h-16 sm:h-20 bg-neutral-800/80 rounded-t-xl shadow-2xl border-t border-white/10" />
                )}
                {selectedRoom === 'bedroom' && (
                  <div className="w-80 sm:w-[420px] h-14 sm:h-18 bg-amber-950/70 rounded-t-lg shadow-2xl border-t border-amber-900/30" />
                )}
                {selectedRoom === 'studio' && (
                  <div className="w-72 sm:w-[380px] h-12 sm:h-16 bg-stone-800/85 rounded-t shadow-2xl border-t border-stone-600/40" />
                )}
              </div>

              {/* Poster on Wall */}
              <div className="relative z-10 mb-14 sm:mb-16 transition-all duration-300">
                <div
                  className={`relative w-44 sm:w-56 md:w-64 aspect-[3/4] bg-white transition-all duration-300 ${activeFrame.style}`}
                >
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 250px, 300px"
                    className="object-cover"
                  />
                  {/* Subtle glass reflection effect */}
                  {currentFrame !== 'NONE' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
                  )}
                </div>
              </div>
            </div>

            {/* Controls Toolbar */}
            <div className="p-4 sm:p-5 bg-white border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs shrink-0">
              {/* Room selector */}
              <div>
                <label className="block text-ink/50 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                  Room Scene
                </label>
                <div className="flex gap-1.5">
                  {ROOMS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoom(r.id)}
                      className={`flex-1 py-1.5 px-2 rounded-sm border text-left transition-all ${
                        selectedRoom === r.id
                          ? 'border-ink bg-ink text-paper font-medium'
                          : 'border-line bg-paper/50 text-ink/70 hover:border-ink/40'
                      }`}
                    >
                      <span className="mr-1">{r.icon}</span> {r.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wall paint palette */}
              <div>
                <label className="block text-ink/50 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                  Wall Paint Color
                </label>
                <div className="flex items-center gap-2">
                  {WALL_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setWallColor(c.hex)}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border border-black/10 transition-transform flex items-center justify-center ${
                        wallColor === c.hex ? 'scale-110 ring-2 ring-accent' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {wallColor === c.hex && (
                        <Check size={12} className={c.hex === '#31363F' ? 'text-white' : 'text-ink'} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame selector */}
              <div>
                <label className="block text-ink/50 font-medium mb-1.5 uppercase tracking-wider text-[10px]">
                  Frame Finish
                </label>
                <div className="flex gap-1.5">
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCurrentFrame(f.id as any)}
                      className={`flex-1 py-1.5 px-1.5 rounded-sm border text-center text-[11px] truncate transition-all ${
                        currentFrame === f.id
                          ? 'border-accent bg-accent/10 text-accent font-semibold'
                          : 'border-line bg-paper/50 text-ink/70 hover:border-ink/40'
                      }`}
                    >
                      {f.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Memoize to prevent unnecessary re-renders from parent component updates
export const RoomVisualizer = memo(RoomVisualizerContent);
