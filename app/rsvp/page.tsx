'use client';

import { FormEvent, useSyncExternalStore, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ExternalLink, Heart, Minus, Plus, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import dynamic from 'next/dynamic';

const PaperBackground = dynamic(() => import('@/components/PaperBackground'), { ssr: false, loading: () => null });
const CelestialBackdrop = dynamic(() => import('@/components/CelestialBackdrop').then(m => ({ default: m.default })), { ssr: false, loading: () => null });
const AdaptiveLantern = dynamic(() => import('@/components/CelestialBackdrop').then(m => ({ default: m.AdaptiveLantern })), { ssr: false, loading: () => null });
const InvitationParticles = dynamic(() => import('@/components/InvitationParticles'), { ssr: false, loading: () => null });
import { SlideToConfirm } from '@/components/lightswind/slide-to-confirm';
import { WEDDING_DAYS } from '@/lib/wedding-days';

/* ------------------------------------------------------------------ *
 * Client-side Zod schema  (mirrors server schema)
 * ------------------------------------------------------------------ */
const clientSchema = z.object({
  name: z.string().min(2, 'Please enter your full name (at least 2 characters).'),
  phone: z
    .string()
    .min(7, 'Please enter a valid phone number.')
    .transform((v) => v.replace(/[\s\-().]/g, ''))
    .refine((v) => /^\+?\d{7,15}$/.test(v), {
      message: 'Phone must contain only digits, and may start with +.',
    }),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
  daysAttending: z.array(z.string()).min(1, 'Please select at least one day you plan to attend.'),
  accommodation: z.enum(['yes', 'no'], { message: 'Please let us know about accommodation.' }),
});

/* ------------------------------------------------------------------ *
 * Error modal
 * ------------------------------------------------------------------ */
interface ErrorModalProps {
  type: 'validation' | 'duplicate' | null;
  message: string;
  onClose: () => void;
}

function ErrorModal({ type, message, onClose }: ErrorModalProps) {
  const isDuplicate = type === 'duplicate';
  return (
    <AnimatePresence>
      {type !== null && (
        <>
          {/* scrim */}
          <motion.div
            className="rsvp-modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* sheet */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="rsvp-error-title"
            className="rsvp-modal"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
          >
            <button
              type="button"
              className="rsvp-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <div className="rsvp-modal-icon" aria-hidden="true">
              {isDuplicate ? '✦' : '✗'}
            </div>

            <h2 id="rsvp-error-title" className="rsvp-modal-title">
              {isDuplicate ? 'Already submitted' : 'Something needs your attention'}
            </h2>

            <p className="rsvp-modal-message">{message}</p>

            <button
              type="button"
              className="rsvp-modal-btn"
              onClick={onClose}
            >
              {isDuplicate ? 'Got it' : 'Fix it'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ *
 * Form state
 * ------------------------------------------------------------------ */
interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: 'yes' | 'no' | '';
  daysAttending: string[];
}

const initialFormData: FormData = {
  name: '', phone: '', email: '', guestCount: 1, accommodation: '', daysAttending: [],
};

const scrollReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const subscribeResize = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};
const getSlideWidth = () => {
  if (typeof window === 'undefined') return 300;
  const p = window.innerWidth <= 640;
  return Math.min(360, Math.max(248, p ? window.innerWidth - 56 : window.innerWidth - 360));
};

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function RSVPPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{ type: 'validation' | 'duplicate' | null; message: string }>({ type: null, message: '' });
  const slideWidth = useSyncExternalStore(subscribeResize, getSlideWidth, () => 300);
  const formRef = useRef<HTMLFormElement>(null);

  /* Bumped on every failure so the slide-to-confirm control snaps back to idle
     instead of sitting on "your place is confirmed" behind the error modal. */
  const [sliderReset, setSliderReset] = useState(0);

  const showError = (type: 'validation' | 'duplicate', message: string) => {
    setErrorModal({ type, message });
    setSliderReset((n) => n + 1);
  };
  const closeError = () => setErrorModal({ type: null, message: '' });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData((c) => ({ ...c, [key]: value }));

  const toggleDay = (id: string) =>
    setFormData((c) => ({
      ...c,
      daysAttending: c.daysAttending.includes(id)
        ? c.daysAttending.filter((d) => d !== id)
        : [...c.daysAttending, id],
    }));

  const confirmRsvp = async (): Promise<void> => {
    closeError();
    setIsSubmitting(true);

    /* Client-side Zod check */
    const parsed = clientSchema.safeParse({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      daysAttending: formData.daysAttending,
      accommodation: formData.accommodation || undefined,
    });

    if (!parsed.success) {
      showError('validation', parsed.error.issues[0]?.message ?? 'Please check your details.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          guest_count: formData.guestCount,
          accommodation_needed: formData.accommodation === 'yes',
          days_attending: formData.daysAttending,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showError(
          result.code === 'duplicate_phone' ? 'duplicate' : 'validation',
          result.message ?? 'Something went wrong. Please try again.',
        );
        setIsSubmitting(false);
        return;
      }

      const params = new URLSearchParams({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        guestCount: formData.guestCount.toString(),
        accommodation: formData.accommodation,
      });

      setTimeout(() => router.push(`/rsvp/confirmation?${params.toString()}`), 400);
    } catch {
      showError('validation', 'Unable to submit your RSVP. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void confirmRsvp();
  };

  return (
    <>
      <main className="rsvp-page">
        <PaperBackground zIndex={0} />
        <CelestialBackdrop page="rsvp" />
        <InvitationParticles />
        <AdaptiveLantern />
        <div className="rsvp-glow rsvp-glow-left" aria-hidden="true" />
        <div className="rsvp-glow rsvp-glow-right" aria-hidden="true" />

        <motion.div className="rsvp-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <button type="button" className="rsvp-back" onClick={() => router.back()}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to journey
          </button>

          <motion.header className="rsvp-header" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <span className="rsvp-kicker"><Sparkles size={14} aria-hidden="true" /> With love &amp; dua</span>
            <p className="rsvp-monogram">F <span>&</span> B</p>
            <h1>Be our guest</h1>
            <p>We would be honoured to celebrate this blessed occasion with you.</p>
          </motion.header>

          <form ref={formRef} className="rsvp-form" onSubmit={handleSubmit} noValidate>

            {/* 01 — Your details */}
            <motion.section className="rsvp-section" aria-labelledby="guest-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
              <div className="rsvp-section-heading"><span>01</span><h2 id="guest-heading">Your details</h2></div>
              <div className="rsvp-grid rsvp-grid-contact">
                <label className="rsvp-field rsvp-field-wide"><span>Full name <b>*</b></span><input required name="name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Your name" autoComplete="name" /></label>
                <label className="rsvp-field"><span>Email address <em>Optional</em></span><input type="email" name="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
                <label className="rsvp-field"><span>Phone number <b>*</b></span><input required type="tel" name="phone" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Your phone number" autoComplete="tel" /></label>
              </div>
            </motion.section>

            {/* 02 — Which days */}
            <motion.section className="rsvp-section rsvp-days-section" aria-labelledby="days-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
              <div className="rsvp-section-heading"><span>02</span><h2 id="days-heading">Which days will you attend?</h2></div>
              <p className="rsvp-days-hint">Select all that apply — one, two or all three.</p>
              <div className="rsvp-days-grid" role="group" aria-labelledby="days-heading">
                {WEDDING_DAYS.map((day) => {
                  const selected = formData.daysAttending.includes(day.id);
                  return (
                    <button key={day.id} type="button" role="checkbox" aria-checked={selected}
                      className={`rsvp-day-chip${selected ? ' is-selected' : ''}`}
                      onClick={() => toggleDay(day.id)}
                    >
                      <span className="rsvp-day-chip-mark" aria-hidden="true">
                        {selected && <Check size={11} strokeWidth={2.5} />}
                      </span>
                      <span className="rsvp-day-chip-date">{day.date}</span>
                      <span className="rsvp-day-chip-label">{day.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            {/* 03 — Party & stay */}
            <motion.section className="rsvp-section" aria-labelledby="party-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
              <div className="rsvp-section-heading"><span>03</span><h2 id="party-heading">Your party &amp; stay</h2></div>
              <div className="rsvp-party-row">
                <div><span className="rsvp-label">Number of guests</span><p>Including yourself</p></div>
                <div className="rsvp-counter" aria-label="Number of guests">
                  <button type="button" aria-label="Remove a guest" onClick={() => updateField('guestCount', Math.max(1, formData.guestCount - 1))}><Minus size={16} /></button>
                  <strong>{String(formData.guestCount).padStart(2, '0')}</strong>
                  <button type="button" aria-label="Add a guest" onClick={() => updateField('guestCount', Math.min(10, formData.guestCount + 1))}><Plus size={16} /></button>
                </div>
              </div>
              <fieldset className="rsvp-accommodation">
                <legend>Will you need accommodation? <b>*</b></legend>
                <p>So we can make the right arrangements for you.</p>
                <div className="rsvp-accommodation-options">
                  <label className={`rsvp-choice ${formData.accommodation === 'yes' ? 'is-selected' : ''}`}>
                    <input required type="radio" name="accommodation" value="yes" checked={formData.accommodation === 'yes'} onChange={() => updateField('accommodation', 'yes')} />
                    <span className="rsvp-choice-mark"><Check size={14} /></span>
                    <span><strong>Yes, please</strong><small>I&apos;ll need assistance with a stay.</small></span>
                  </label>
                  <label className={`rsvp-choice ${formData.accommodation === 'no' ? 'is-selected' : ''}`}>
                    <input required type="radio" name="accommodation" value="no" checked={formData.accommodation === 'no'} onChange={() => updateField('accommodation', 'no')} />
                    <span className="rsvp-choice-mark"><Check size={14} /></span>
                    <span><strong>No, thank you</strong><small>I&apos;ve arranged my own stay.</small></span>
                  </label>
                </div>
              </fieldset>
            </motion.section>

            <motion.div className="rsvp-submit-row" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
              <p>Your reply helps us prepare a day full of thoughtful details.</p>
              <SlideToConfirm
                className="rsvp-slide-confirm"
                width={slideWidth}
                height={60}
                text={isSubmitting ? 'Saving...' : 'Slide to confirm your place'}
                successText="Your place is confirmed"
                onConfirm={confirmRsvp}
                disabled={isSubmitting}
                resetSignal={sliderReset}
              />
            </motion.div>
          </form>
          <div className="rsvp-footer-block">
            <p className="rsvp-footer">With love, Farzeen &amp; Bilal <span>•</span> 2026</p>
            <a
              href="https://wa.me/919633693160"
              target="_blank"
              rel="noreferrer"
              className="zorscode-credit"
            >
              Made with <Heart size={11} className="zorscode-heart" aria-hidden="true" /> by <span className="zorscode-name">UNSP<ExternalLink size={10} className="zorscode-ext" aria-label="Open chat" strokeWidth={2} /></span>
            </a>
          </div>
        </motion.div>
      </main>

      {/* Error modal — lives outside the main layout so it's always on top */}
      <ErrorModal type={errorModal.type} message={errorModal.message} onClose={closeError} />
    </>
  );
}
