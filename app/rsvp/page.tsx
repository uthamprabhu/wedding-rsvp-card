'use client';

import { FormEvent, useSyncExternalStore, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Minus, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const PaperBackground = dynamic(() => import('@/components/PaperBackground'), {
  ssr: false,
  loading: () => null,
});
const CelestialBackdrop = dynamic(() => import('@/components/CelestialBackdrop').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => null,
});
const AdaptiveLantern = dynamic(() => import('@/components/CelestialBackdrop').then(mod => ({ default: mod.AdaptiveLantern })), {
  ssr: false,
  loading: () => null,
});
const InvitationParticles = dynamic(() => import('@/components/InvitationParticles'), {
  ssr: false,
  loading: () => null,
});
import { SlideToConfirm } from '@/components/lightswind/slide-to-confirm';

interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: 'yes' | 'no' | '';
}

const initialFormData: FormData = {
  name: '', phone: '', email: '', guestCount: 1, accommodation: '',
};

const scrollReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const subscribeResize = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};

const getSlideWidth = () => {
  if (typeof window === 'undefined') return 300;
  const isPhone = window.innerWidth <= 640;
  return Math.min(360, Math.max(248, isPhone ? window.innerWidth - 56 : window.innerWidth - 360));
};

export default function RSVPPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slideWidth = useSyncExternalStore(subscribeResize, getSlideWidth, () => 300);
  const formRef = useRef<HTMLFormElement>(null);

  const updateField = <Key extends keyof FormData>(key: Key, value: FormData[Key]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const confirmRsvp = async (): Promise<void> => {
    setSubmitError('');
    setIsSubmitting(true);
    
    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.accommodation) {
      setSubmitError('Please complete the required fields before confirming.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit to API route (server-side handles Supabase)
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          guest_count: formData.guestCount,
          accommodation_needed: formData.accommodation === 'yes',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Submission failed');
      }

      // Success - redirect to confirmation
      const params = new URLSearchParams({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        guestCount: formData.guestCount.toString(),
        accommodation: formData.accommodation,
      });

      // Small delay for animation to complete
      setTimeout(() => {
        router.push(`/rsvp/confirmation?${params.toString()}`);
      }, 400);
    } catch (error) {
      console.error('RSVP submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to submit your RSVP. Please check your connection and try again.';
      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void confirmRsvp();
  };

  return (
    <main className="rsvp-page">
      <PaperBackground zIndex={0} />
      <CelestialBackdrop page="rsvp" />
      <InvitationParticles />
      <AdaptiveLantern />
      <div className="rsvp-glow rsvp-glow-left" aria-hidden="true" />
      <div className="rsvp-glow rsvp-glow-right" aria-hidden="true" />
      <motion.div className="rsvp-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <button type="button" className="rsvp-back" onClick={() => router.back()}><ArrowLeft size={16} aria-hidden="true" /> Back to journey</button>
        <motion.header className="rsvp-header" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <span className="rsvp-kicker"><Sparkles size={14} aria-hidden="true" /> With love &amp; dua</span>
          <p className="rsvp-monogram">F <span>&</span> B</p>
          <h1>Be our guest</h1>
          <p>We would be honoured to celebrate this blessed occasion with you.</p>
        </motion.header>

        <form ref={formRef} className="rsvp-form" onSubmit={handleSubmit} noValidate>
          <motion.section className="rsvp-section" aria-labelledby="guest-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            <div className="rsvp-section-heading"><span>01</span><h2 id="guest-heading">Your details</h2></div>
            <div className="rsvp-grid rsvp-grid-contact">
              <label className="rsvp-field rsvp-field-wide"><span>Full name <b>*</b></span><input required name="name" value={formData.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your name" autoComplete="name" /></label>
              <label className="rsvp-field"><span>Email address <em>Optional</em></span><input type="email" name="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label className="rsvp-field"><span>Phone number <b>*</b></span><input required type="tel" name="phone" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Your phone number" autoComplete="tel" /></label>
            </div>
          </motion.section>

          <motion.section className="rsvp-section" aria-labelledby="party-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            <div className="rsvp-section-heading"><span>02</span><h2 id="party-heading">Your party &amp; stay</h2></div>
            <div className="rsvp-party-row"><div><span className="rsvp-label">Number of guests</span><p>Including yourself</p></div><div className="rsvp-counter" aria-label="Number of guests"><button type="button" aria-label="Remove a guest" onClick={() => updateField('guestCount', Math.max(1, formData.guestCount - 1))}><Minus size={16} /></button><strong>{String(formData.guestCount).padStart(2, '0')}</strong><button type="button" aria-label="Add a guest" onClick={() => updateField('guestCount', Math.min(10, formData.guestCount + 1))}><Plus size={16} /></button></div></div>
            <fieldset className="rsvp-accommodation"><legend>Will you need accommodation? <b>*</b></legend><p>So we can make the right arrangements for you.</p><div className="rsvp-accommodation-options"><label className={`rsvp-choice ${formData.accommodation === 'yes' ? 'is-selected' : ''}`}><input required type="radio" name="accommodation" value="yes" checked={formData.accommodation === 'yes'} onChange={() => updateField('accommodation', 'yes')} /><span className="rsvp-choice-mark"><Check size={14} /></span><span><strong>Yes, please</strong><small>I&apos;ll need assistance with a stay.</small></span></label><label className={`rsvp-choice ${formData.accommodation === 'no' ? 'is-selected' : ''}`}><input required type="radio" name="accommodation" value="no" checked={formData.accommodation === 'no'} onChange={() => updateField('accommodation', 'no')} /><span className="rsvp-choice-mark"><Check size={14} /></span><span><strong>No, thank you</strong><small>I&apos;ve arranged my own stay.</small></span></label></div></fieldset>
          </motion.section>

          {submitError && <p className="rsvp-error" role="alert">{submitError}</p>}
          <motion.div className="rsvp-submit-row" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            <p>Your reply helps us prepare a day full of thoughtful details.</p>
            <SlideToConfirm 
              className="rsvp-slide-confirm" 
              width={slideWidth} 
              height={60} 
              text={isSubmitting ? "Saving..." : "Slide to confirm your place"}
              successText="Your place is confirmed" 
              onConfirm={confirmRsvp}
              disabled={isSubmitting}
            />
          </motion.div>
        </form>
        <p className="rsvp-footer">With love, Farzeen & Bilal <span>•</span> 2026</p>
      </motion.div>
    </main>
  );
}
