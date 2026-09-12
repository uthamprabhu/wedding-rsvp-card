'use client';

import { useSpring, animated, config } from '@react-spring/web';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

export default function GuestCounter({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
}: GuestCounterProps) {
  const [numberSpring, api] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    config: config.wobbly,
  }));

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
      api.start({
        from: { scale: 1, rotate: 0 },
        to: [
          { scale: 1.3, rotate: 5 },
          { scale: 1, rotate: 0 },
        ],
      });
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
      api.start({
        from: { scale: 1, rotate: 0 },
        to: [
          { scale: 1.3, rotate: -5 },
          { scale: 1, rotate: 0 },
        ],
      });
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-[#8B7355] mb-3 ml-1">
        {label}
      </label>
      <div className="flex items-center justify-center gap-6 p-6 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-[#D4A574]/30">
        <motion.button
          onClick={handleDecrement}
          disabled={value <= min}
          className={cn(
            'w-14 h-14 rounded-full transition-all',
            'bg-gradient-to-b from-[#FFF8F0] to-[#F5E6D3]',
            'border-b-4 border-[#D4A574]/30',
            'flex items-center justify-center',
            'active:scale-95 active:border-b-2',
            value <= min && 'opacity-40 cursor-not-allowed'
          )}
          whileTap={value > min ? { scale: 0.9 } : {}}
        >
          <Minus className="w-6 h-6 text-[#8B7355]" />
        </motion.button>

        <animated.div
          style={{
            transform: numberSpring.scale.to(
              (s) => `scale(${s}) rotate(${numberSpring.rotate.get()}deg)`
            ),
          }}
          className="min-w-[100px] text-center"
        >
          <div className="text-6xl font-serif text-[#D4A574] font-bold leading-none">
            {value}
          </div>
          <div className="text-sm text-[#8B7355]/60 mt-2">
            {value === 1 ? 'guest' : 'guests'}
          </div>
        </animated.div>

        <motion.button
          onClick={handleIncrement}
          disabled={value >= max}
          className={cn(
            'w-14 h-14 rounded-full transition-all',
            'bg-gradient-to-b from-[#E8C087] to-[#D4A574]',
            'border-b-4 border-[#B8925A]',
            'flex items-center justify-center',
            'active:scale-95 active:border-b-2',
            value >= max && 'opacity-40 cursor-not-allowed'
          )}
          whileTap={value < max ? { scale: 0.9 } : {}}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
