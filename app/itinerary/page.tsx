'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import InteractiveItinerary from '@/components/InteractiveItinerary';
import PaperBackground from '@/components/PaperBackground';
import TactileButton from '@/components/TactileButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const FluidBackground = dynamic(() => import('@/components/FluidBackground'), {
  ssr: false,
});

export default function ItineraryPage() {
  const router = useRouter();

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto">
      {/* Paper background - z-0 */}
      <PaperBackground />
      
      {/* Fluid background - z-5 (always behind content) */}
      <FluidBackground className="opacity-30" variant="itinerary" />

      {/* Content - z-20 */}
      <motion.div
        style={{ zIndex: 20 }}
        className="relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <InteractiveItinerary />
      </motion.div>

      {/* Navigation buttons - z-40 (above everything) */}
      <motion.div
        style={{ zIndex: 40 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <TactileButton
          onClick={() => router.back()}
          icon={ChevronLeft}
          variant="secondary"
          size="md"
        >
          Back to Invitation
        </TactileButton>

        <TactileButton
          onClick={() => router.push('/rsvp')}
          icon={ChevronRight}
          variant="primary"
          size="md"
        >
          Confirm Attendance
        </TactileButton>
      </motion.div>
    </main>
  );
}
