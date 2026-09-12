'use client';

import { useSpring, animated } from '@react-spring/web';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TactileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function TactileButton({
  children,
  onClick,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}: TactileButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [springs, api] = useSpring(() => ({
    scale: 1,
    y: 0,
    shadow: 20,
    brightness: 1,
    config: { tension: 300, friction: 20 },
  }));

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    api.start({
      scale: 1.05,
      y: -4,
      shadow: 30,
      brightness: 1.1,
    });
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    setIsPressed(false);
    api.start({
      scale: 1,
      y: 0,
      shadow: 20,
      brightness: 1,
    });
  };

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
    api.start({
      scale: 0.95,
      y: 2,
      shadow: 10,
      brightness: 0.9,
    });
  };

  const handleMouseUp = () => {
    if (disabled) return;
    setIsPressed(false);
    if (isHovered) {
      api.start({
        scale: 1.05,
        y: -4,
        shadow: 30,
        brightness: 1.1,
      });
    } else {
      api.start({
        scale: 1,
        y: 0,
        shadow: 20,
        brightness: 1,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    // Don't prevent default - allow scrolling
    setIsPressed(true);
    api.start({
      scale: 0.95,
      y: 2,
      shadow: 10,
      brightness: 0.9,
    });
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsPressed(false);
    api.start({
      scale: 1,
      y: 0,
      shadow: 20,
      brightness: 1,
    });
  };

  const variantStyles = {
    primary: 'bg-gradient-to-b from-[#E8C087] to-[#D4A574] text-white border-b-4 border-[#B8925A]',
    secondary: 'bg-gradient-to-b from-[#FFF8F0] to-[#F5E6D3] text-[#8B7355] border-b-4 border-[#D4A574]/30',
    ghost: 'bg-white/40 backdrop-blur-md text-[#8B7355] border-2 border-[#D4A574]/20',
  };

  const sizeStyles = {
    sm: 'px-6 py-3 text-sm',
    md: 'px-10 py-4 text-base',
    lg: 'px-14 py-5 text-lg',
  };

  return (
    <animated.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'relative font-semibold rounded-2xl transition-all select-none',
        'active:translate-y-1 active:shadow-sm',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        transform: springs.scale.to((s) => `scale(${s}) translateY(${springs.y.get()}px)`),
        boxShadow: springs.shadow.to((s) => `0 ${s}px ${s * 2}px rgba(212, 165, 116, 0.3)`),
        filter: springs.brightness.to((b) => `brightness(${b})`),
        touchAction: 'manipulation', // Prevent double-tap zoom, allow scroll
      }}
    >
      <div className="flex items-center justify-center gap-3">
        {Icon && <Icon className="w-5 h-5" />}
        <span className="font-serif tracking-wide">{children}</span>
      </div>

      {/* Inner highlight for 3D effect */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%)',
        }}
      />
    </animated.button>
  );
}
