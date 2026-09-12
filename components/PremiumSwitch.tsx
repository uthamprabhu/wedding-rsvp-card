'use client';

import * as Switch from '@radix-ui/react-switch';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/lib/utils';

interface PremiumSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: string;
}

export default function PremiumSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  icon,
}: PremiumSwitchProps) {
  const thumbSpring = useSpring({
    x: checked ? 28 : 0,
    config: { tension: 300, friction: 20 },
  });

  const bgSpring = useSpring({
    backgroundColor: checked ? '#D4A574' : '#E5E7EB',
    config: { tension: 300, friction: 20 },
  });

  return (
    <div className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-[#D4A574]/20">
      <div className="flex items-start gap-4 flex-1">
        {icon && <span className="text-3xl mt-0.5">{icon}</span>}
        <div className="flex-1">
          <div className="font-semibold text-[#8B7355] text-lg">{label}</div>
          {description && (
            <div className="text-sm text-[#8B7355]/60 mt-1">{description}</div>
          )}
        </div>
      </div>

      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          'relative w-14 h-7 rounded-full transition-all cursor-pointer',
          'focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20'
        )}
        style={{ backgroundColor: bgSpring.backgroundColor.get() }}
      >
        <animated.div
          style={{
            transform: thumbSpring.x.to((x) => `translateX(${x}px)`),
          }}
        >
          <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow-lg ml-0.5 mt-0.5" />
        </animated.div>
      </Switch.Root>
    </div>
  );
}
