'use client';

import DiamondRingLoader from '@/components/DiamondRingLoader';

/** A lightweight, branded bridge while the invitation story chunk is hydrated. */
export default function InvitationHandoffLoader() {
  return <DiamondRingLoader label="Preparing your invitation" overlay />;
}
