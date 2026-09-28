'use client';

/**
 * HERO VECTOR SCENE — faithful recreation of the brand reference illustration:
 * a flat-vector young man (yellow tee, blue jeans, black quiff, round glasses)
 * mid-stride, holding a sunset poster up in his right hand, surrounded by
 * floating posters on an organic blue blob.
 *
 * Motion:
 *   - entrance: blob outline draws → blue fill blooms → posters pop in → the
 *     character's outline draws then fills part by part
 *   - loop: character floats; each poster bobs/tilts on its own phase; vinyl
 *     spins; × marks pulse; speed lines travel
 *
 * GPU-cheap: CSS transforms/opacity/stroke-dashoffset only. No canvas, no JS
 * animation loop. Honors prefers-reduced-motion.
 */

const INK = '#1F2937';
const YELLOW = '#F2C230';
const JEANS = '#4FA8DE';
const JEANS_LIGHT = '#7CC3EC';
const SKIN = '#FFFFFF';
const SHOE = '#16181D';
const BLOB = '#85C8F2';

function X({ x, y, s = 7, d = 0 }: { x: number; y: number; s?: number; d?: number }) {
  return (
    <g className="hl-pulse" style={{ '--pdel': `${d}s`, '--pd': '4.8s' } as React.CSSProperties}>
      <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

export function HeroLineScene() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-[440px] sm:max-w-[520px] mx-auto select-none pointer-events-none">
      <svg viewBox="0 0 920 940" className="w-full h-auto" role="img">
        <defs>
          <linearGradient id="hlSunset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6B5CA5" />
            <stop offset="55%" stopColor="#E98A5B" />
            <stop offset="100%" stopColor="#F7C873" />
          </linearGradient>
          <linearGradient id="hlBeach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9B266" />
            <stop offset="55%" stopColor="#E87A93" />
            <stop offset="100%" stopColor="#35507E" />
          </linearGradient>
          <linearGradient id="hlTee" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7CE4E" />
            <stop offset="100%" stopColor="#EDB71F" />
          </linearGradient>
        </defs>

        {/* ============ BLOB ============ */}
        <g className="hl-breathe">
          <path
            className="hl-draw"
            style={{ '--d': '0s' } as React.CSSProperties}
            pathLength={1}
            d="M 462 58 C 636 44 816 160 846 356 C 872 528 812 706 648 800 C 500 886 300 886 178 772 C 68 668 52 486 118 336 C 182 192 302 70 462 58 Z"
            fill="none"
            stroke={INK}
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <path
            className="hl-fill"
            style={{ '--d': '0.9s' } as React.CSSProperties}
            d="M 462 58 C 636 44 816 160 846 356 C 872 528 812 706 648 800 C 500 886 300 886 178 772 C 68 668 52 486 118 336 C 182 192 302 70 462 58 Z"
            fill={BLOB}
            stroke="none"
          />
        </g>

        {/* ============ SCATTERED MARKS ============ */}
        <X x={150} y={372} d={0.4} />
        <X x={596} y={318} s={6} d={1.6} />
        <X x={318} y={724} d={2.2} />
        <X x={858} y={196} s={5} d={1.1} />
        <g className="hl-pulse" style={{ '--pdel': '2.6s', '--pd': '5.5s' } as React.CSSProperties}>
          <circle cx={498} cy={168} r={7} fill="none" stroke={INK} strokeWidth="1.6" />
        </g>

        {/* ============ POSTER — GOOD IDEAS TAKE TIME ============ */}
        <g transform="translate(700 236) rotate(6)">
          <g className="hl-bob" style={{ '--bd': '7.5s', '--bdel': '-2s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '0.55s' } as React.CSSProperties}>
              <rect x="-85" y="-115" width="170" height="230" rx="3" fill="#101014" stroke={INK} strokeWidth="2" />
              {['GOOD', 'IDEAS', 'TAKE', 'TIME'].map((w, i) => (
                <text key={w} x="0" y={-66 + i * 32} textAnchor="middle" fill="#FFFFFF"
                  fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="23" letterSpacing="1"
                  className="hl-fade" style={{ '--d': `${1.1 + i * 0.1}s` } as React.CSSProperties}>
                  {w}
                </text>
              ))}
              <path className="hl-fade" style={{ '--d': '1.5s' } as React.CSSProperties}
                d="M -34 48 Q 0 38 34 48" fill="none" stroke={YELLOW} strokeWidth="4" strokeLinecap="round" />
              <g className="hl-fade" style={{ '--d': '1.6s' } as React.CSSProperties}>
                <circle cx="46" cy="68" r="11" fill="none" stroke={YELLOW} strokeWidth="2.2" />
                <circle cx="42" cy="64" r="1.6" fill={YELLOW} />
                <circle cx="50" cy="64" r="1.6" fill={YELLOW} />
                <path d="M 41 71 Q 46 76 51 71" fill="none" stroke={YELLOW} strokeWidth="1.8" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </g>

        {/* ============ POSTER — MUSIC HEALS (vinyl spins) ============ */}
        <g transform="translate(796 462) rotate(8)">
          <g className="hl-bob" style={{ '--bd': '8.5s', '--bdel': '-4s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '0.7s' } as React.CSSProperties}>
              <rect x="-80" y="-105" width="160" height="210" rx="3" fill="#F4ECDC" stroke={INK} strokeWidth="2" />
              <text x="-62" y="-76" fill="#17171A" fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="13"
                className="hl-fade" style={{ '--d': '1.3s' } as React.CSSProperties}>MUSIC</text>
              <text x="-62" y="-60" fill="#17171A" fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="13"
                className="hl-fade" style={{ '--d': '1.35s' } as React.CSSProperties}>HEALS</text>
              <g className="hl-spin">
                <circle cx="20" cy="16" r="50" fill="#15151A" stroke={INK} strokeWidth="1.5" />
                <circle cx="20" cy="16" r="41" fill="none" stroke="#2E2E36" strokeWidth="1" />
                <circle cx="20" cy="16" r="32" fill="none" stroke="#2E2E36" strokeWidth="1" />
                <circle cx="20" cy="16" r="16" fill="#E8663C" />
                <circle cx="20" cy="16" r="2.5" fill="#15151A" />
              </g>
              <g className="hl-fade" style={{ '--d': '1.5s' } as React.CSSProperties} stroke="#9A917E" strokeWidth="1.5">
                <line x1="-62" y1="64" x2="-28" y2="64" />
                <line x1="-62" y1="72" x2="-36" y2="72" />
                <line x1="-62" y1="80" x2="-32" y2="80" />
              </g>
            </g>
          </g>
        </g>

        {/* ============ POSTER — CREATE EXPLORE REPEAT ============ */}
        <g transform="translate(186 506) rotate(-7)">
          <g className="hl-bob" style={{ '--bd': '7s', '--bdel': '-1s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '0.85s' } as React.CSSProperties}>
              <rect x="-85" y="-110" width="170" height="220" rx="3" fill="#F6EFDE" stroke={INK} strokeWidth="2" />
              {['CREATE', 'EXPLORE', 'REPEAT'].map((w, i) => (
                <text key={w} x="0" y={-44 + i * 32} textAnchor="middle" fill="#17171A"
                  fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="21" letterSpacing="0.5"
                  className="hl-fade" style={{ '--d': `${1.4 + i * 0.12}s` } as React.CSSProperties}>
                  {w}
                </text>
              ))}
              <line x1="-16" y1="38" x2="16" y2="38" stroke="#17171A" strokeWidth="3" strokeLinecap="round"
                className="hl-fade" style={{ '--d': '1.8s' } as React.CSSProperties} />
            </g>
          </g>
        </g>

        {/* ============ POSTER — A BRIGHTER YOU (botanical) ============ */}
        <g transform="translate(724 640) rotate(-4)">
          <g className="hl-bob" style={{ '--bd': '9s', '--bdel': '-3s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '1s' } as React.CSSProperties}>
              <rect x="-90" y="-115" width="180" height="230" rx="3" fill="#F5EEDF" stroke={INK} strokeWidth="2" />
              {['A', 'BRIGHTER', 'YOU'].map((w, i) => (
                <text key={w} x="-70" y={-84 + i * 18} fill="#17171A" fontFamily="'Inter', sans-serif"
                  fontWeight="800" fontSize="15" className="hl-fade"
                  style={{ '--d': `${1.6 + i * 0.1}s` } as React.CSSProperties}>
                  {w}
                </text>
              ))}
              <path className="hl-fade" style={{ '--d': '1.7s' } as React.CSSProperties}
                d="M 14 70 C 22 24 30 -18 52 -66" fill="none" stroke="#2E5D3A" strokeWidth="2.5" />
              {([
                [24, -2, -30, 1, '#3E7C4F'], [30, -26, -70, 1, '#57875F'], [44, -44, -35, 1, '#3E7C4F'],
                [50, -62, -75, 1, '#6FA07A'], [8, 22, -20, 1, '#57875F'], [40, -16, -100, 0.8, '#6FA07A'],
              ] as const).map(([lx, ly, rot, sc, col], i) => (
                <path key={i} className="hl-fade" style={{ '--d': `${1.8 + i * 0.08}s` } as React.CSSProperties}
                  transform={`translate(${lx} ${ly}) rotate(${rot}) scale(${sc})`}
                  d="M 0 0 C 8 -10 22 -12 32 -4 C 24 6 10 8 0 0 Z" fill={col} />
              ))}
            </g>
          </g>
        </g>

        {/* ============ POSTER — ART LIVES FOREVER ============ */}
        <g transform="translate(216 764) rotate(-6)">
          <g className="hl-bob" style={{ '--bd': '8s', '--bdel': '-5s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '1.15s' } as React.CSSProperties}>
              <rect x="-80" y="-105" width="160" height="210" rx="3" fill="#EFEFE8" stroke={INK} strokeWidth="2" />
              <g className="hl-fade" style={{ '--d': '1.9s' } as React.CSSProperties}>
                <rect x="-34" y="44" width="68" height="14" fill="#D8D8D0" stroke={INK} strokeWidth="1.5" />
                <path d="M -28 44 C -24 22 -12 12 0 12 C 12 12 24 22 28 44 Z" fill="#CDCDC5" stroke={INK} strokeWidth="1.5" />
                <circle cx="0" cy="-10" r="20" fill="#CDCDC5" stroke={INK} strokeWidth="1.5" />
                <path d="M -14 -26 Q -8 -34 0 -32 M 2 -32 Q 10 -32 14 -24 M -18 -18 Q -16 -26 -10 -30"
                  fill="none" stroke={INK} strokeWidth="1.6" />
                <rect x="-24" y="-18" width="48" height="10" fill={YELLOW} stroke={INK} strokeWidth="1.5" />
              </g>
              {['ART', 'LIVES', 'FOREVER'].map((w, i) => (
                <text key={w} x="28" y={62 + i * 11} fill="#17171A" fontFamily="'Inter', sans-serif"
                  fontWeight="800" fontSize="8.5" letterSpacing="0.5" className="hl-fade"
                  style={{ '--d': `${2 + i * 0.08}s` } as React.CSSProperties}>
                  {w}
                </text>
              ))}
            </g>
          </g>
        </g>

        {/* ============ POSTER — GOOD VIBES ONLY ============ */}
        <g transform="translate(642 800) rotate(5)">
          <g className="hl-bob" style={{ '--bd': '7.8s', '--bdel': '-6s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '1.3s' } as React.CSSProperties}>
              <rect x="-90" y="-115" width="180" height="230" rx="3" fill="url(#hlBeach)" stroke={INK} strokeWidth="2" />
              <circle cx="8" cy="-18" r="17" fill="#FFE7B0" className="hl-fade" style={{ '--d': '2.1s' } as React.CSSProperties} />
              <rect x="-78" y="8" width="156" height="44" fill="#33517E" opacity="0.9"
                className="hl-fade" style={{ '--d': '2.15s' } as React.CSSProperties} />
              <g stroke="#C7D6EC" strokeWidth="1.5" opacity="0.7" className="hl-fade" style={{ '--d': '2.2s' } as React.CSSProperties}>
                <line x1="-60" y1="22" x2="-20" y2="22" />
                <line x1="20" y1="30" x2="56" y2="30" />
              </g>
              <g className="hl-fade" style={{ '--d': '2.25s' } as React.CSSProperties} stroke="#22301F" fill="none" strokeLinecap="round">
                <path d="M -44 44 C -46 12 -40 -12 -30 -32" strokeWidth="4" />
                <path d="M -30 -32 C -48 -42 -62 -40 -70 -30 M -30 -32 C -22 -48 -8 -54 4 -52 M -30 -32 C -16 -28 -6 -18 -2 -8 M -30 -32 C -40 -28 -48 -20 -50 -10" strokeWidth="3.5" />
                <path d="M 52 44 C 52 24 50 8 46 -4" strokeWidth="3" />
                <path d="M 46 -4 C 36 -12 26 -12 20 -6 M 46 -4 C 50 -14 58 -18 66 -16" strokeWidth="3" />
              </g>
              {['Good', 'Vibes', 'Only'].map((w, i) => (
                <text key={w} x={26 + i * 2} y={-66 + i * 22} textAnchor="middle" fill="#FFFFFF"
                  fontFamily="var(--font-display), Georgia, serif" fontStyle="italic" fontWeight="600"
                  fontSize="17" className="hl-fade" style={{ '--d': `${2.3 + i * 0.1}s` } as React.CSSProperties}>
                  {w}
                </text>
              ))}
            </g>
          </g>
        </g>

        {/* ============ POSTER — CHASE BETTER DAYS (held up, right hand) ============ */}
        <g transform="translate(320 240) rotate(-8)">
          <g className="hl-bob" style={{ '--bd': '8.2s', '--bdel': '-2.6s' } as React.CSSProperties}>
            <g className="hl-pop" style={{ '--d': '0.4s' } as React.CSSProperties}>
              <rect x="-75" y="-100" width="150" height="200" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
              <rect x="-63" y="-88" width="126" height="150" fill="url(#hlSunset)" />
              <circle cx="6" cy="-30" r="13" fill="#FFE0A8" className="hl-fade" style={{ '--d': '1s' } as React.CSSProperties} />
              <path d="M -63 40 L -22 -12 L 2 40 Z" fill="#3A3466" opacity="0.95" className="hl-fade" style={{ '--d': '1.05s' } as React.CSSProperties} />
              <path d="M -14 40 L 22 -4 L 63 40 Z" fill="#2C2755" className="hl-fade" style={{ '--d': '1.1s' } as React.CSSProperties} />
              {['CHASE', 'BETTER', 'DAYS'].map((w, i) => (
                <text key={w} x="0" y={-56 + i * 14} textAnchor="middle" fill="#FFFFFF"
                  fontFamily="var(--font-display), Georgia, serif" fontStyle="italic" fontWeight="700"
                  fontSize="12" letterSpacing="0.5" className="hl-fade"
                  style={{ '--d': `${1.2 + i * 0.08}s` } as React.CSSProperties}>
                  {w}
                </text>
              ))}
            </g>
          </g>
        </g>

        {/* ============ SPEED LINES ============ */}
        <g stroke={INK} strokeWidth="2.5" strokeLinecap="round" className="hl-dash"
          style={{ '--dd': '2.6s' } as React.CSSProperties} strokeDasharray="14 10">
          <line x1="610" y1="556" x2="646" y2="596" />
          <line x1="632" y1="544" x2="668" y2="584" />
          <line x1="654" y1="532" x2="690" y2="572" />
        </g>

        {/*
          ============ CHARACTER ============
          Draw order: back leg → back arm → torso → front leg → front arm up
          → neck/head → hair → face → gripping hand (in front of poster).
          Proportions follow the reference: slightly oversized head, slim
          limbs, tapered yellow tee, baggy cuffed jeans, chunky sneakers.
        */}
        <g className="hl-float">
          {/* BACK (left) leg — bent, crossing behind */}
          <path className="hl-draw" style={{ '--d': '0.9s' } as React.CSSProperties} pathLength={1}
            d="M 452 540 C 430 570 416 604 420 636 C 422 654 432 668 448 676 L 478 664 C 464 650 458 630 462 606 C 466 584 476 564 490 548 Z"
            fill="none" stroke={INK} strokeWidth="2" />
          <path className="hl-fill" style={{ '--d': '1.5s' } as React.CSSProperties}
            d="M 452 540 C 430 570 416 604 420 636 C 422 654 432 668 448 676 L 478 664 C 464 650 458 630 462 606 C 466 584 476 564 490 548 Z"
            fill={JEANS} stroke={INK} strokeWidth="2" />
          {/* back calf + cuff */}
          <path className="hl-draw" style={{ '--d': '1s' } as React.CSSProperties} pathLength={1}
            d="M 448 676 C 444 700 448 724 460 744 L 494 734 C 484 714 480 692 482 668 Z"
            fill="none" stroke={INK} strokeWidth="2" />
          <path className="hl-fill" style={{ '--d': '1.6s' } as React.CSSProperties}
            d="M 448 676 C 444 700 448 724 460 744 L 494 734 C 484 714 480 692 482 668 Z"
            fill={JEANS_LIGHT} stroke={INK} strokeWidth="2" />
          {/* back sneaker */}
          <g className="hl-fill" style={{ '--d': '1.75s' } as React.CSSProperties}>
            <path d="M 456 742 C 444 748 436 760 440 772 C 444 780 456 784 470 782 L 502 774 C 508 764 504 750 494 744 Z"
              fill={SHOE} stroke={INK} strokeWidth="2" />
            <path d="M 440 772 C 452 778 476 780 500 776" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* BACK (right) arm — hangs down, relaxed */}
          <path className="hl-draw" style={{ '--d': '0.85s' } as React.CSSProperties} pathLength={1}
            d="M 544 398 C 562 434 570 476 562 516 L 534 510 C 540 472 534 434 518 404 Z"
            fill="none" stroke={INK} strokeWidth="2" />
          <path className="hl-fill" style={{ '--d': '1.5s' } as React.CSSProperties}
            d="M 544 398 C 562 434 570 476 562 516 L 534 510 C 540 472 534 434 518 404 Z"
            fill={SKIN} stroke={INK} strokeWidth="2" />
          {/* back hand — open, relaxed */}
          <path className="hl-fill" style={{ '--d': '1.55s' } as React.CSSProperties}
            d="M 538 510 C 530 524 530 542 540 550 C 550 556 562 550 566 538 C 568 526 562 512 554 506 Z"
            fill={SKIN} stroke={INK} strokeWidth="2" />
          <g className="hl-fade" style={{ '--d': '1.9s' } as React.CSSProperties} stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M 542 548 Q 546 552 552 550" />
            <path d="M 550 548 Q 554 550 558 546" />
          </g>

          {/* TORSO — yellow tee, slightly tapered, hem below waist */}
          <path className="hl-draw" style={{ '--d': '0.6s' } as React.CSSProperties} pathLength={1}
            d="M 446 386 C 428 394 418 412 422 434 C 425 448 434 456 444 460 C 440 488 440 516 446 542 C 480 552 520 552 550 544 C 556 516 556 486 552 460 C 562 454 570 444 572 432 C 576 410 566 394 550 388 C 514 376 476 376 446 386 Z"
            fill="none" stroke={INK} strokeWidth="2" />
          <path className="hl-fill" style={{ '--d': '1.25s' } as React.CSSProperties}
            d="M 446 386 C 428 394 418 412 422 434 C 425 448 434 456 444 460 C 440 488 440 516 446 542 C 480 552 520 552 550 544 C 556 516 556 486 552 460 C 562 454 570 444 572 432 C 576 410 566 394 550 388 C 514 376 476 376 446 386 Z"
            fill="url(#hlTee)" stroke={INK} strokeWidth="2" />
          {/* sleeve seams + hem highlight */}
          <g className="hl-fade" style={{ '--d': '1.8s' } as React.CSSProperties} stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round">
            <path d="M 436 452 C 442 458 450 461 458 462" />
            <path d="M 560 452 C 554 458 546 461 538 462" />
            <path d="M 462 400 Q 484 412 508 398" strokeOpacity="0.65" />
          </g>
          {/* tee fold shading */}
          <path className="hl-fade" style={{ '--d': '1.85s' } as React.CSSProperties}
            d="M 470 470 C 476 492 476 514 472 536 M 522 468 C 518 490 518 512 522 534"
            fill="none" stroke="#D9A413" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

          {/* FRONT (left) leg — striding forward */}
          <path className="hl-draw" style={{ '--d': '1.05s' } as React.CSSProperties} pathLength={1}
            d="M 470 546 C 486 590 498 644 502 700 L 502 716 L 544 714 L 542 698 C 540 646 532 592 518 548 Z"
            fill="none" stroke={INK} strokeWidth="2" />
          <path className="hl-fill" style={{ '--d': '1.65s' } as React.CSSProperties}
            d="M 470 546 C 486 590 498 644 502 700 L 502 716 L 544 714 L 542 698 C 540 646 532 592 518 548 Z"
            fill={JEANS} stroke={INK} strokeWidth="2" />
          {/* front cuff */}
          <path className="hl-fade" style={{ '--d': '1.9s' } as React.CSSProperties}
            d="M 500 700 L 546 698" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          {/* front sneaker */}
          <g className="hl-fill" style={{ '--d': '1.8s' } as React.CSSProperties}>
            <path d="M 498 714 C 494 734 500 750 518 754 L 556 750 C 566 742 564 726 554 718 Z"
              fill={SHOE} stroke={INK} strokeWidth="2" />
            <path d="M 498 748 C 518 754 542 754 560 748" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            <path d="M 512 720 L 534 740 M 536 716 L 548 736" stroke="#3A3D45" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* FRONT (left) arm — raised diagonally, holding the poster up */}
          <path className="hl-draw" style={{ '--d': '0.75s' } as React.CSSProperties} pathLength={1}
            d="M 446 400 C 424 386 408 368 398 346 C 394 336 392 326 392 316 L 416 314 C 418 330 426 348 440 366 C 450 378 460 388 470 396 Z"
            fill="none" stroke={INK} strokeWidth="2" />
          <path className="hl-fill" style={{ '--d': '1.4s' } as React.CSSProperties}
            d="M 446 400 C 424 386 408 368 398 346 C 394 336 392 326 392 316 L 416 314 C 418 330 426 348 440 366 C 450 378 460 388 470 396 Z"
            fill={SKIN} stroke={INK} strokeWidth="2" />

          {/* NECK */}
          <path className="hl-fill" style={{ '--d': '1.1s' } as React.CSSProperties}
            d="M 458 352 L 462 384 L 496 382 L 492 350 Z" fill={SKIN} stroke={INK} strokeWidth="2" />

          {/* HEAD — slightly oversized, rounded jaw (reference proportion) */}
          <ellipse className="hl-draw" style={{ '--d': '0.55s' } as React.CSSProperties} pathLength={1}
            cx="478" cy="308" rx="52" ry="58" fill="none" stroke={INK} strokeWidth="2" />
          <ellipse className="hl-fill" style={{ '--d': '1.2s' } as React.CSSProperties}
            cx="478" cy="308" rx="52" ry="58" fill={SKIN} stroke={INK} strokeWidth="2" />
          {/* ear */}
          <circle className="hl-fill" style={{ '--d': '1.3s' } as React.CSSProperties}
            cx="516" cy="316" r="10" fill={SKIN} stroke={INK} strokeWidth="2" />
          <path className="hl-fade" style={{ '--d': '1.75s' } as React.CSSProperties}
            d="M 514 312 Q 519 316 514 320" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />

          {/* HAIR — black quiff swept up-left (signature of the reference) */}
          <path className="hl-fill" style={{ '--d': '1.35s' } as React.CSSProperties}
            d="M 428 300 C 420 244 458 204 506 214 C 548 224 564 260 556 296 C 548 274 532 258 512 252 C 520 268 522 282 518 294 C 504 270 482 258 458 262 C 442 265 432 280 428 300 Z"
            fill={SHOE} stroke={INK} strokeWidth="2" />
          {/* quiff swoop */}
          <path className="hl-fade" style={{ '--d': '1.6s' } as React.CSSProperties}
            d="M 464 226 C 452 210 460 192 478 194 C 466 200 462 212 468 224 Z"
            fill={SHOE} stroke={INK} strokeWidth="1.8" />
          <path className="hl-fade" style={{ '--d': '1.62s' } as React.CSSProperties}
            d="M 486 212 C 480 200 488 188 500 192" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />

          {/* FACE — round glasses, small smile, brow (reference features) */}
          <g className="hl-fade" style={{ '--d': '1.7s' } as React.CSSProperties}>
            <circle cx="450" cy="316" r="16" fill="#FFFFFF" stroke={INK} strokeWidth="2.4" />
            <circle cx="492" cy="314" r="16" fill="#FFFFFF" stroke={INK} strokeWidth="2.4" />
            <line x1="466" y1="314" x2="476" y2="313" stroke={INK} strokeWidth="2.4" />
            <line x1="508" y1="312" x2="514" y2="312" stroke={INK} strokeWidth="2.2" />
            <circle cx="452" cy="317" r="2.8" fill={INK} />
            <circle cx="490" cy="315" r="2.8" fill={INK} />
            <path d="M 436 296 Q 446 291 456 295" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 482 293 Q 492 289 502 293" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 462 348 Q 472 356 484 350" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* GRIPPING HAND — holds the poster's bottom-left corner (drawn last → in front) */}
          <g className="hl-fill" style={{ '--d': '1.6s' } as React.CSSProperties}>
            <circle cx="402" cy="330" r="15" fill={SKIN} stroke={INK} strokeWidth="2" />
            <path d="M 390 322 Q 396 316 404 318 M 392 330 Q 396 326 402 327"
              fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      </svg>

      <style>{`
        @keyframes hl-draw-kf { to { stroke-dashoffset: 0; } }
        @keyframes hl-fill-kf { to { fill-opacity: 1; } }
        @keyframes hl-fade-kf { to { opacity: 1; } }
        @keyframes hl-pop-kf {
          0% { opacity: 0; transform: translateY(18px) scale(0.88); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hl-bob-kf {
          0%, 100% { transform: translateY(-6px) rotate(-1.6deg); }
          50% { transform: translateY(7px) rotate(1.8deg); }
        }
        @keyframes hl-float-kf {
          0%, 100% { transform: translateY(0) rotate(-0.6deg); }
          50% { transform: translateY(-12px) rotate(0.8deg); }
        }
        @keyframes hl-spin-kf { to { transform: rotate(360deg); } }
        @keyframes hl-pulse-kf {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes hl-dash-kf { to { stroke-dashoffset: -60; } }
        @keyframes hl-breathe-kf {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.012); }
        }

        .hl-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: hl-draw-kf 1.1s cubic-bezier(0.6, 0, 0.3, 1) forwards;
          animation-delay: var(--d, 0s);
          will-change: stroke-dashoffset;
        }
        .hl-fill {
          fill-opacity: 0;
          animation: hl-fill-kf 0.9s ease forwards;
          animation-delay: var(--d, 0.5s);
        }
        .hl-fade {
          opacity: 0;
          animation: hl-fade-kf 0.8s ease forwards;
          animation-delay: var(--d, 0.6s);
        }
        .hl-pop {
          opacity: 0;
          transform: translateY(18px) scale(0.88);
          transform-box: fill-box;
          transform-origin: center;
          animation: hl-pop-kf 0.9s cubic-bezier(0.2, 0.9, 0.25, 1.15) forwards;
          animation-delay: var(--d, 0s);
        }
        .hl-bob {
          transform-box: fill-box;
          transform-origin: center;
          animation: hl-bob-kf var(--bd, 7s) ease-in-out infinite;
          animation-delay: var(--bdel, 0s);
          will-change: transform;
        }
        .hl-float {
          transform-box: fill-box;
          transform-origin: center;
          animation: hl-float-kf 6.5s ease-in-out infinite;
          will-change: transform;
        }
        .hl-spin {
          transform-box: fill-box;
          transform-origin: center;
          animation: hl-spin-kf 9s linear infinite;
        }
        .hl-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: hl-pulse-kf var(--pd, 4.5s) ease-in-out infinite;
          animation-delay: var(--pdel, 0s);
        }
        .hl-dash { animation: hl-dash-kf linear infinite; animation-duration: var(--dd, 3s); }
        .hl-breathe {
          transform-box: fill-box;
          transform-origin: center;
          animation: hl-breathe-kf 12s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hl-draw, .hl-fill, .hl-fade, .hl-pop, .hl-bob, .hl-float, .hl-spin,
          .hl-pulse, .hl-dash, .hl-breathe { animation: none !important; }
          .hl-draw { stroke-dashoffset: 0 !important; }
          .hl-fill { fill-opacity: 1 !important; }
          .hl-fade, .hl-pop { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
