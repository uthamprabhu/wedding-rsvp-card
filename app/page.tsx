'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import InvitationHero from '@/components/InvitationHero';
import LoadingAnimation from '@/components/LoadingAnimation';
import LuxuryInvitation from '@/components/LuxuryInvitation';
import PaperBackground from '@/components/PaperBackground';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  const openInvitation = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setInvitationOpen(true), 720);
  };

  return (
    <main className="invitation-entry">
      <AnimatePresence mode="wait">
        {loading && <LoadingAnimation key="loader" />}
      </AnimatePresence>

      {!loading && !invitationOpen && (
        <motion.div
          className="invitation-entry-hero"
          initial={{ opacity: 0 }}
          animate={opening ? { opacity: 0, scale: 1.08, filter: 'blur(8px)' } : { opacity: 1 }}
          transition={{ duration: .72, ease: [0.22, 1, 0.36, 1] }}
        >
          <PaperBackground />
          <div className="invitation-entry-glow" aria-hidden="true" />
          <InvitationHero onOpen={openInvitation} />
        </motion.div>
      )}

      <AnimatePresence>
        {invitationOpen && (
          <motion.div
            className="invitation-entry-story"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .9, ease: [0.22, 1, 0.36, 1] }}
          >
            <LuxuryInvitation />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
