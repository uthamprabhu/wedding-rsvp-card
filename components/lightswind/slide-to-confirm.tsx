"use client";

import React, { useEffect, useId, useState, useRef } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideToConfirmProps {
  /** Text to show before sliding */
  text?: string;
  /** Text to show after confirming */
  successText?: string;
  /** Async callback fired when slide completes */
  onConfirm: () => Promise<void> | void;
  /** Width of the component */
  width?: number;
  /** Height of the component */
  height?: number;
  /** Additional classes for the container */
  className?: string;
  /** Disable the slider */
  disabled?: boolean;
  /**
   * Increment this counter to force the slider back to its idle state.
   * Useful when `onConfirm` resolves without throwing but the parent still
   * treated the attempt as a failure (e.g. it surfaced a validation modal).
   */
  resetSignal?: number;
}

/** Fraction of the track a keyboard press moves per Arrow key tap. */
const KEYBOARD_STEP = 0.12;

export function SlideToConfirm({
  text = "Slide to confirm",
  successText = "Confirmed",
  onConfirm,
  width = 320,
  height = 56,
  className,
  disabled = false,
  resetSignal = 0,
}: SlideToConfirmProps) {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const trackWidth = width - height; // Total drag distance
  const thumbSize = height - 8; // Margin inside
  const labelId = useId();

  const x = useMotionValue(0);
  const controls = useAnimation();

  // Opacity of the text fades out as you drag
  const textOpacity = useTransform(x, [0, trackWidth * 0.5], [1, 0]);
  // Background gradient progresses as you drag
  const bgWidth = useTransform(x, [0, trackWidth], [height, width]);

  /** Shared "the slide/press committed" path — used by both drag and keyboard. */
  const commit = async () => {
    controls.start({ x: trackWidth, transition: { type: "spring", stiffness: 400, damping: 30 } });
    setState("loading");

    try {
      await onConfirm();
      setState("success");
    } catch {
      // Reset on failure. We deliberately swallow here rather than re-throw:
      // Framer Motion does not await `onDragEnd`, so a re-throw would surface
      // as an unhandled promise rejection. The parent owns error reporting.
      setState("idle");
      x.set(0);
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };

  const handleDragEnd = async () => {
    if (state !== "idle" || disabled) return;

    if (x.get() >= trackWidth * 0.9) {
      await commit();
    } else {
      // Reset if not fully dragged
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };

  /** Keyboard equivalent of dragging: Arrow keys nudge, Enter/Space commits
   *  from wherever the thumb currently sits. Without this, a keyboard or
   *  screen-reader user has no way to operate the control at all — the only
   *  other path into `onConfirm` is the surrounding <form>'s Enter-to-submit,
   *  which is unlabelled and bypasses this component's own gating. */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (state !== "idle" || disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      x.set(trackWidth);
      void commit();
      return;
    }

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      x.set(Math.min(trackWidth, x.get() + trackWidth * KEYBOARD_STEP));
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      x.set(Math.max(0, x.get() - trackWidth * KEYBOARD_STEP));
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      x.set(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      x.set(trackWidth);
    }
  };

  const handleReset = () => {
    // Once confirmed, the RSVP is already saved server-side. A stray tap here
    // previously reverted the UI to "Slide to confirm your place" with no
    // guard, which reads as "it failed" for something that already
    // succeeded — the guest would resubmit and hit a duplicate-entry error
    // on their own first, successful attempt. Success is now terminal.
    return;
  };

  /* Parent-driven reset: snap back to idle whenever `resetSignal` changes.
     Skips the initial render (resetSignal === 0) so no animation on mount.
     The setState call is intentional and safe here: it synchronises this
     component's internal animation state with an external imperative signal
     (the parent bumping a counter on API failure), which is exactly the
     "sync with external system" use case that effects are designed for.
     The linter rule targets accidental cascades; this is a deliberate,
     bounded reset with a guarded early-return. */
  useEffect(() => {
    if (resetSignal === 0) return;
    setState("idle"); // eslint-disable-line react-hooks/set-state-in-effect
    x.set(0);
    controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border border-border bg-[#f8f0e2] select-none",
        state === "success" ? "border-green-500/50" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      style={{
        width,
        height,
      }}
      onClick={handleReset}
    >
      {/* Background fill transitioning to green on success */}
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: state === "success" ? width : bgWidth,
          backgroundColor: state === "success" ? "#22c55e" : "#a6814e",
          opacity: state === "success" ? 0.14 : 0.1,
        }}
        animate={{ width: state === "success" ? width : undefined }}
        transition={{ duration: 0.3 }}
      />

      {/* Main Text */}
      <motion.span
        id={labelId}
        className={cn(
          "absolute font-medium text-sm z-0",
          state === "success" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}
        style={{ opacity: state === "idle" ? textOpacity : 0 }}
      >
        {text}
      </motion.span>

      {/* Success Text */}
      <motion.span
        className="absolute font-medium text-sm z-0 text-green-600 dark:text-green-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: state === "success" ? 1 : 0,
          y: state === "success" ? 0 : 10
        }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {successText}
      </motion.span>

      {/* Draggable Thumb — also a keyboard-operable slider control */}
      <motion.div
        role="slider"
        tabIndex={disabled || state !== "idle" ? -1 : 0}
        aria-label={state === "success" ? successText : text}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={state === "success" ? 100 : Math.round((x.get() / trackWidth) * 100)}
        aria-disabled={disabled}
        onKeyDown={handleKeyDown}
        drag={state === "idle" && !disabled ? "x" : false}
        dragConstraints={{ left: 0, right: trackWidth }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className={cn(
          "absolute left-1 z-10 flex cursor-grab items-center justify-center rounded-full bg-background shadow-md active:cursor-grabbing",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6814e]",
          state !== "idle" && "cursor-default",
          disabled && "cursor-not-allowed opacity-50"
        )}

        initial={false}
        whileTap={{ scale: state === "idle" ? 0.95 : 1 }}
        animate={state === "success" ? { x: trackWidth, backgroundColor: "#22c55e", color: "white" } : controls}
        style={{
          width: thumbSize,
          height: thumbSize,
          x,
        }}
      >
        <motion.div
          animate={{
            rotate: state === "loading" ? 360 : 0,
            scale: state === "idle" ? 1 : 0,
            opacity: state === "idle" ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <ArrowRight className="h-5 w-5 opacity-70" />
        </motion.div>

        {state === "loading" && (
          <div className="absolute flex h-full w-full items-center justify-center">
            {/* Refined macOS Style Spinner (12 Spokes) */}
            <div className="relative h-[20px] w-[20px]">
              {[...Array(12)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-[9px] top-0 h-[5.5px] w-[1.8px] rounded-full bg-foreground"
                  style={{
                    rotate: i * 30,
                    transformOrigin: "center 10px",
                  }}
                  animate={{
                    opacity: [0.15, 1, 0.15],
                  }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.091,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <motion.div
          animate={{
            scale: state === "success" ? 1 : 0,
            opacity: state === "success" ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute text-white"
        >
          <Check className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </div>
  );
}
