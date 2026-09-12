'use client';

import { useSpring, animated } from '@react-spring/web';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  icon?: string;
}

export default function PremiumInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: PremiumInputProps) {
  const [focused, setFocused] = useState(false);

  const [styles, api] = useSpring(() => ({
    scale: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    config: { tension: 300, friction: 25 },
  }));

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-[#8B7355] mb-2 ml-1">
        {label}
      </label>
      <animated.div
        style={{
          transform: styles.scale.to(s => `scale(${s})`),
          borderColor: styles.borderColor,
        }}
        className="relative"
      >
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => {
            setFocused(true);
            api.start({
              scale: 1.02,
              borderColor: 'rgba(212, 165, 116, 0.8)',
            });
          }}
          onBlur={() => {
            setFocused(false);
            api.start({
              scale: 1,
              borderColor: 'rgba(212, 165, 116, 0.3)',
            });
          }}
          className={cn(
            'w-full px-4 py-4 rounded-2xl border-2 transition-all',
            'bg-white/60 backdrop-blur-sm',
            'text-[#8B7355] placeholder:text-[#8B7355]/40',
            'focus:outline-none focus:bg-white/80',
            'font-medium text-lg',
            icon && 'pl-14'
          )}
        />
        {focused && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: '0 0 0 4px rgba(212, 165, 116, 0.1)',
            }}
          />
        )}
      </animated.div>
    </div>
  );
}
