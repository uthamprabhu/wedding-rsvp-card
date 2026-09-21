'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Mail, Users, BedDouble, ArrowLeft, Heart, ExternalLink } from 'lucide-react';
import PaperBackground from '@/components/PaperBackground';
import CelestialBackdrop, { AdaptiveLantern } from '@/components/CelestialBackdrop';
import InvitationParticles from '@/components/InvitationParticles';
import dynamic from 'next/dynamic';

const RsvpCelebration = dynamic(() => import('@/components/RsvpCelebration'), {
  ssr: false,
});

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const name = searchParams.get('name');
  const phone = searchParams.get('phone');
  const email = searchParams.get('email') || '';
  const guestCount = parseInt(searchParams.get('guestCount') || '1', 10);
  const accommodation = searchParams.get('accommodation') || '';

  useEffect(() => {
    if (!name || !phone) {
      router.push('/rsvp');
    }
  }, [name, phone, router]);

  if (!name || !phone) {
    return (
      <div className="simple-loader">
        <p>Loading your confirmation...</p>
      </div>
    );
  }

  const data = {
    name,
    phone,
    email,
    guestCount,
    accommodation,
  };

  const firstName = data.name.trim().split(/\s+/)[0];
  const details = [
    { icon: Users, label: 'Your party', value: `${data.guestCount} ${data.guestCount === 1 ? 'guest' : 'guests'}` },
    { icon: BedDouble, label: 'Accommodation', value: data.accommodation === 'yes' ? 'Assistance requested' : 'Not needed' },
  ];
  if (data.email.trim()) {
    details.splice(1, 0, { icon: Mail, label: 'Confirmation email', value: data.email });
  }

  return (
    <main className="rsvp-page">
      <PaperBackground zIndex={0} />
      <CelestialBackdrop page="rsvp" />
      <InvitationParticles />
      <AdaptiveLantern />
      <RsvpCelebration />
      
      <div className="rsvp-confirmation">
        <motion.div 
          className="rsvp-confirmation-wrap" 
          initial={{ opacity: 0, y: 14 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <button 
            type="button" 
            className="rsvp-back" 
            onClick={() => router.push('/')}
            style={{ marginBottom: '2rem' }}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to invitation
          </button>

          <div className="rsvp-confirmation-mark">
            <Check size={22} strokeWidth={1.5} />
          </div>
          <p className="rsvp-kicker">The sweetest yes</p>
          <h1>Thank you, {firstName}.</h1>
          <p className="rsvp-confirmation-intro">
            Your place at our celebration is lovingly reserved. We cannot wait to share the day with you.
          </p>

          <div className="rsvp-confirmation-details">
            {details.map(({ icon: Icon, label, value }) => (
              <div className="rsvp-detail" key={label}>
                <Icon size={17} strokeWidth={1.5} />
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>

          <p className="rsvp-confirmation-note" style={{ marginTop: '2rem' }}>
            We have your RSVP details for {data.phone}.
          </p>

          <div className="rsvp-footer-block">
            <p className="rsvp-footer" style={{ marginTop: 0 }}>With love, Farzeen & Bilal <span>•</span> 2026</p>
            <a
              href="https://wa.me/919633693160"
              target="_blank"
              rel="noreferrer"
              className="zorscode-credit"
            >
              Made with <Heart size={11} className="zorscode-heart" aria-hidden="true" /> by <span className="zorscode-name">UNSP<ExternalLink size={10} className="zorscode-ext" aria-label="Open chat" strokeWidth={2} /></span>
            </a>
          </div>

          <a
            href="https://wa.me/919633693160"
            target="_blank"
            rel="noreferrer"
            className="zorscode-credit"
          >
            Made with <Heart size={11} className="zorscode-heart" aria-hidden="true" /> by <span className="zorscode-name">UNSP<ExternalLink size={10} className="zorscode-ext" aria-label="Open chat" strokeWidth={2} /></span>
          </a>
        </motion.div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="simple-loader">
        <p>Loading your confirmation...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
