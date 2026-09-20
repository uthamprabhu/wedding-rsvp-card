'use client';

/**
 * The single motion-access request for the whole invitation.
 *
 * Presented as a physical object rather than a browser dialog: a card rises
 * from the bottom edge on a spring, sits above a soft scrim so the chest stays
 * visible behind it, and can be dismissed either by a button or by dragging it
 * back down - the same gesture the guest would use on a real bottom sheet.
 *
 * Framer Motion (already a project dependency) supplies every primitive here:
 * AnimatePresence for the mount/unmount transition, spring `transition`s for
 * the physical rise, and `drag="y"` + `dragConstraints` for the swipe-to-
 * dismiss gesture, so nothing generic is being hand-rolled.
 */

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useId } from 'react';

interface Props {
  open: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

const SPARKLE_POSITIONS = [
  { left: '12%', top: '18%', delay: 0 },
  { left: '82%', top: '24%', delay: 0.5 },
  { left: '28%', top: '72%', delay: 1.1 },
  { left: '70%', top: '68%', delay: 0.8 },
  { left: '50%', top: '10%', delay: 1.6 },
] as const;

const sheetSpring = { type: 'spring' as const, stiffness: 340, damping: 32, mass: 0.9 };

export default function MotionUnlockSheet({ open, onEnable, onDismiss }: Props) {
  const titleId = useId();
  const descId = useId();

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // A deliberate downward swipe dismisses it, exactly like a real sheet.
    if (info.offset.y > 90 || info.velocity.y > 650) onDismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Soft scrim: dims the chest without hiding it, and closes on tap
              outside - the sheet is never a hard interruption. */}
          <motion.div
            className="motion-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={onDismiss}
            aria-hidden="true"
          />

          <motion.div
            className="motion-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0 }}
            transition={sheetSpring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle doubles as the visual affordance that this can be
                swiped away, matching native bottom-sheet conventions. */}
            <div className="motion-sheet-handle" aria-hidden="true" />

            {/* Tiny floating champagne sparkles - restrained, not a particle
                system. Pure CSS keyframes, no extra render cost. */}
            <div className="motion-sheet-sparkles" aria-hidden="true">
              {SPARKLE_POSITIONS.map((s, i) => (
                <Sparkles
                  key={i}
                  size={i % 2 === 0 ? 11 : 8}
                  className="motion-sheet-sparkle"
                  style={{ left: s.left, top: s.top, animationDelay: `${s.delay}s` }}
                />
              ))}
            </div>

            {/* Restrained Mughal-arch ornament, echoing the lantern's brass */}
            <svg
              className="motion-sheet-ornament"
              viewBox="0 0 120 40"
              aria-hidden="true"
            >
              <path
                d="M60 4c10 0 16 7 16 15 0 6-3 10-7 13h20M31 32h20c-4-3-7-7-7-13 0-8 6-15 16-15"
                stroke="currentColor"
                strokeWidth="1.3"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="60" cy="14" r="2.6" fill="currentColor" />
              <path d="M14 32h10M96 32h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>

            <h2 id={titleId} className="motion-sheet-title">
              Unlock the Invitation
            </h2>
            <p id={descId} className="motion-sheet-copy">
              Enable motion access for a more immersive experience. Gently move
              your phone to interact with the invitation.
            </p>

            <div className="motion-sheet-actions">
              <button type="button" className="motion-sheet-btn is-ghost" onClick={onDismiss}>
                Not Now
              </button>
              <button type="button" className="motion-sheet-btn is-primary" onClick={onEnable}>
                Enable Motion
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
