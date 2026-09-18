'use client';

/**
 * Graceful fallback for devices where WebGL is unavailable or blocked.
 *
 * Still a hinged chest rather than an image swap: the lid is a real element
 * rotated in CSS 3D around its rear edge inside a perspective container, and
 * the logo rises out from behind the body. Same beats, no GPU requirement.
 */

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  reducedMotion: boolean;
  onCompleted: () => void;
}

export default function TreasureChestFallback({ open, reducedMotion, onCompleted }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const riseDelay = reducedMotion ? 60 : 380;
    const rise = window.setTimeout(() => setRevealed(true), riseDelay);
    const done = window.setTimeout(onCompleted, reducedMotion ? 850 : 2100);
    return () => {
      window.clearTimeout(rise);
      window.clearTimeout(done);
    };
  }, [open, reducedMotion, onCompleted]);

  return (
    <div
      className={`chest-css${open ? ' is-open' : ''}${
        reducedMotion ? ' is-still' : ''
      }${revealed ? ' is-revealed' : ''}`}
      aria-hidden="true"
    >
      <div className="chest-css-shadow" />

      <div className="chest-css-stage">
        {/* logo sits behind the body and rises through the opening */}
        <div className="chest-css-logo">
          <Image src="/images/logo.jpeg" alt="" width={168} height={168} priority />
        </div>

        {/* hinged lid */}
        <div className="chest-css-lid">
          <span className="chest-css-strap" />
          <span className="chest-css-strap" />
          <span className="chest-css-strap" />
        </div>

        {/* body, drawn after the lid so it always covers the logo */}
        <div className="chest-css-body">
          <span className="chest-css-rail chest-css-rail-top" />
          <span className="chest-css-rail chest-css-rail-bottom" />
          <span className="chest-css-vstrap" />
          <span className="chest-css-vstrap" />
          <span className="chest-css-vstrap" />
          <span className="chest-css-lock" />
        </div>
      </div>
    </div>
  );
}
