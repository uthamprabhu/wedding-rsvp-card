'use client';

import { useEffect, useState } from 'react';

const WEDDING_MOMENT = new Date('2026-11-01T12:00:00+05:30').getTime();

type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasArrived: boolean;
};

function getRemainingTime(): RemainingTime {
  const difference = Math.max(0, WEDDING_MOMENT - Date.now());

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
    hasArrived: difference === 0,
  };
}

const format = (value: number) => String(value).padStart(2, '0');

export default function WeddingCountdown() {
  // A neutral first paint prevents a server/client clock mismatch. The timer
  // begins only after the invitation is interactive.
  const [remaining, setRemaining] = useState<RemainingTime | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getRemainingTime());
    update();
    const interval = window.setInterval(update, 1_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const units = remaining ? [
    { value: remaining.days, label: 'days' },
    { value: remaining.hours, label: 'hours' },
    { value: remaining.minutes, label: 'minutes' },
    { value: remaining.seconds, label: 'seconds' },
  ] : [
    { value: 0, label: 'days' },
    { value: 0, label: 'hours' },
    { value: 0, label: 'minutes' },
    { value: 0, label: 'seconds' },
  ];

  return (
    <section className="wedding-countdown" aria-label="Countdown to the Nikah">
      <p className="section-eyebrow">Until the gathering begins</p>
      {remaining?.hasArrived ? (
        <p className="countdown-arrived">The celebration has begun.</p>
      ) : (
        <div className="countdown-clock" aria-live="off">
          {units.map((unit) => (
            <div className="countdown-unit" key={unit.label}>
              <strong>{unit.label === 'days' ? unit.value : format(unit.value)}</strong>
              <span>{unit.label}</span>
            </div>
          ))}
        </div>
      )}
      <p className="countdown-note">01 November 2026 · 12:00 noon</p>
    </section>
  );
}
