'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import InvitationHero from '@/components/InvitationHero';
import LoadingAnimation from '@/components/LoadingAnimation';
import dynamic from 'next/dynamic';

const loadLuxuryInvitation = () => import('@/components/LuxuryInvitation');
const LuxuryInvitation = dynamic(loadLuxuryInvitation, {
  ssr: false,
  loading: () => null, // No loader - content streams in
});

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch the editorial story while the cover is visible. It stays unmounted,
  // so the first click does not have to compete with its photo/WebGL work.
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => { void loadLuxuryInvitation(); }, 260);
    return () => window.clearTimeout(timer);
  }, [loading]);

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
          {/* The chest hero is a dark, self-lit stage: no paper texture and no
              fluid simulation here, so the 3D lighting reads correctly against
              #3A0712. Other routes keep their own backgrounds untouched. */}
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
